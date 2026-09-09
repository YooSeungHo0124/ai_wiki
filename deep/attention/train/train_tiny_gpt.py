"""시각화 사이트용 초소형 GPT를 실제로 학습시키고 가중치를 JS 파일로 내보낸다.

구조는 GPT-2 와 동일한 pre-LayerNorm decoder-only Transformer:
    x = tok_emb[idx] + pos_emb
    for block: x = x + attn(ln1(x)) ; x = x + mlp(ln2(x))
    logits = lnf(x) @ tok_emb.T          (weight tying)

학습 코퍼스는 "주어 / 장소 / 목적어 / 부사 / 동사" 5어절 한국어 문장이다.
동사는 '목적어'로만 결정되고 주어로는 결정되지 않게 설계해서,
마지막 위치의 self-attention 이 반드시 목적어 토큰을 바라보도록 만들었다.
"""
import json
import os
import numpy as np

import autograd as ag
from autograd import Tensor

rng = np.random.default_rng(20260902)

# ----------------------------------------------------------------------------
# 1. 어휘 & 코퍼스
# ----------------------------------------------------------------------------
SUBJ = ["고양이가", "강아지가", "학생이", "요리사가"]
PLACE = ["부엌에서", "마당에서", "교실에서", "식당에서"]
OBJ = ["생선을", "뼈다귀를", "책을", "수프를", "공을"]
ADV = ["맛있게", "열심히", "조용히", "천천히"]
VERB = ["먹었다", "물었다", "읽었다", "끓였다", "굴렸다"]
EOS = ["<eos>"]

VOCAB = SUBJ + PLACE + OBJ + ADV + VERB + EOS
STOI = {w: i for i, w in enumerate(VOCAB)}

# 목적어 -> 동사 (완전 결정적)
OBJ2VERB = {
    "생선을": "먹었다",
    "뼈다귀를": "물었다",
    "책을": "읽었다",
    "수프를": "끓였다",
    "공을": "굴렸다",
}
# 주어 -> 가능한 목적어 2개. 주어만으로는 동사를 알 수 없다.
SUBJ2OBJ = {
    "고양이가": ["생선을", "공을"],
    "강아지가": ["뼈다귀를", "공을"],
    "학생이": ["책을", "수프를"],
    "요리사가": ["수프를", "생선을"],
}

sentences = []
for s in SUBJ:
    for o in SUBJ2OBJ[s]:
        for p in PLACE:
            for a in ADV:
                sentences.append([s, p, o, a, OBJ2VERB[o], "<eos>"])

DATA = np.array([[STOI[w] for w in s] for s in sentences], dtype=np.int64)
BLOCK = DATA.shape[1] - 1  # 입력 길이 5, 타깃 길이 5

# ----------------------------------------------------------------------------
# 2. 모델 설정
# ----------------------------------------------------------------------------
CFG = dict(
    n_vocab=len(VOCAB),
    n_ctx=BLOCK,
    d_model=24,
    n_head=3,
    d_head=8,
    n_layer=2,
    d_ff=96,
)
D, H, DH, L, DFF, V, T = (CFG["d_model"], CFG["n_head"], CFG["d_head"],
                          CFG["n_layer"], CFG["d_ff"], CFG["n_vocab"], CFG["n_ctx"])
assert H * DH == D

params = {}


def P(name, shape, std=0.02, zeros=False, ones=False):
    if zeros:
        v = np.zeros(shape)
    elif ones:
        v = np.ones(shape)
    else:
        v = rng.normal(0, std, shape)
    t = Tensor(v, requires_grad=True)
    params[name] = t
    return t


tok_emb = P("tok_emb", (V, D), std=0.05)
pos_emb = P("pos_emb", (T, D), std=0.05)
blocks = []
for i in range(L):
    blocks.append(dict(
        ln1_g=P(f"b{i}.ln1_g", (D,), ones=True), ln1_b=P(f"b{i}.ln1_b", (D,), zeros=True),
        w_qkv=P(f"b{i}.w_qkv", (D, 3 * D), std=0.08), b_qkv=P(f"b{i}.b_qkv", (3 * D,), zeros=True),
        w_o=P(f"b{i}.w_o", (D, D), std=0.08), b_o=P(f"b{i}.b_o", (D,), zeros=True),
        ln2_g=P(f"b{i}.ln2_g", (D,), ones=True), ln2_b=P(f"b{i}.ln2_b", (D,), zeros=True),
        w_fc=P(f"b{i}.w_fc", (D, DFF), std=0.08), b_fc=P(f"b{i}.b_fc", (DFF,), zeros=True),
        w_proj=P(f"b{i}.w_proj", (DFF, D), std=0.08), b_proj=P(f"b{i}.b_proj", (D,), zeros=True),
    ))
lnf_g = P("lnf_g", (D,), ones=True)
lnf_b = P("lnf_b", (D,), zeros=True)

NEG = -1e9
MASK = np.triu(np.full((T, T), NEG), k=1)[None, None, :, :]  # (1,1,T,T) causal mask


def forward(idx):
    B, t = idx.shape
    x = ag.add(ag.embedding(tok_emb, idx), _pos_slice(t))
    for blk in blocks:
        h = ag.layernorm(x, blk["ln1_g"], blk["ln1_b"])
        qkv = ag.add(ag.matmul(h, blk["w_qkv"]), blk["b_qkv"])          # (B,t,3D)
        qkv = ag.reshape(qkv, (B, t, 3, H, DH))
        qkv = ag.transpose(qkv, (2, 0, 3, 1, 4))                        # (3,B,H,t,DH)
        q = ag.reshape(_take(qkv, 0), (B, H, t, DH))
        k = ag.reshape(_take(qkv, 1), (B, H, t, DH))
        v = ag.reshape(_take(qkv, 2), (B, H, t, DH))
        att = ag.scale(ag.matmul(q, ag.transpose(k, (0, 1, 3, 2))), 1.0 / np.sqrt(DH))
        att = ag.add_const(att, MASK[:, :, :t, :t])
        att = ag.softmax(att, axis=-1)
        y = ag.matmul(att, v)                                           # (B,H,t,DH)
        y = ag.reshape(ag.transpose(y, (0, 2, 1, 3)), (B, t, D))
        x = ag.add(x, ag.add(ag.matmul(y, blk["w_o"]), blk["b_o"]))
        h2 = ag.layernorm(x, blk["ln2_g"], blk["ln2_b"])
        m = ag.gelu(ag.add(ag.matmul(h2, blk["w_fc"]), blk["b_fc"]))
        m = ag.add(ag.matmul(m, blk["w_proj"]), blk["b_proj"])
        x = ag.add(x, m)
    x = ag.layernorm(x, lnf_g, lnf_b)
    logits = ag.matmul(x, ag.transpose(tok_emb, (1, 0)))
    return logits


def _pos_slice(t):
    """pos_emb[:t] 를 gradient 가 흐르는 형태로 잘라낸다."""
    out = Tensor(pos_emb.data[:t], (pos_emb,))

    def _bw():
        if out.grad is not None:
            g = np.zeros_like(pos_emb.data)
            g[:t] = out.grad
            pos_emb._accum(g)

    out._backward = _bw
    return out


def _take(a, i):
    """축 0 에서 i 번째를 뽑는다."""
    out = Tensor(a.data[i], (a,))

    def _bw():
        if out.grad is not None:
            g = np.zeros_like(a.data)
            g[i] = out.grad
            a._accum(g)

    out._backward = _bw
    return out


# ----------------------------------------------------------------------------
# 3. 학습 (AdamW, full batch)
# ----------------------------------------------------------------------------
X = DATA[:, :-1]
Y = DATA[:, 1:]
STEPS = 4000
LR = 3e-3
m_st = {k: np.zeros_like(t.data) for k, t in params.items()}
v_st = {k: np.zeros_like(t.data) for k, t in params.items()}
b1, b2, eps, wd = 0.9, 0.98, 1e-8, 1e-4

print(f"vocab={V} sentences={len(sentences)} params={sum(t.data.size for t in params.values())}")
for step in range(1, STEPS + 1):
    for t in params.values():
        t.zero_grad()
    logits = forward(X)
    flat = ag.reshape(logits, (-1, V))
    loss = ag.cross_entropy(flat, Y.reshape(-1))
    loss.backward()

    lr = LR * (0.5 * (1 + np.cos(np.pi * step / STEPS)))
    for k, t in params.items():
        g = t.grad if t.grad is not None else np.zeros_like(t.data)
        m_st[k] = b1 * m_st[k] + (1 - b1) * g
        v_st[k] = b2 * v_st[k] + (1 - b2) * g * g
        mh = m_st[k] / (1 - b1 ** step)
        vh = v_st[k] / (1 - b2 ** step)
        t.data -= lr * (mh / (np.sqrt(vh) + eps) + wd * t.data)

    if step % 500 == 0 or step == 1:
        pred = forward(X).data.argmax(-1)
        # 동사 예측 정확도(위치 3 -> 동사)
        acc = (pred[:, 3] == Y[:, 3]).mean()
        print(f"step {step:5d}  loss {loss.data:.4f}  verb_acc {acc:.3f}")

# ----------------------------------------------------------------------------
# 4. 검증 & 내보내기
# ----------------------------------------------------------------------------
demo = ["고양이가", "부엌에서", "생선을", "맛있게"]
di = np.array([[STOI[w] for w in demo]])
lg = forward(di).data[0, -1]
p = np.exp(lg - lg.max()); p /= p.sum()
top = np.argsort(-p)[:5]
print("\n데모 입력:", " ".join(demo))
for i in top:
    print(f"   {VOCAB[i]:8s} {p[i]*100:6.2f}%")

OUT = os.path.join(os.path.dirname(__file__), "..", "data", "weights.js")


def r(a):
    return np.round(np.asarray(a), 5).tolist()


payload = {
    "config": CFG,
    "vocab": VOCAB,
    "weights": {k: r(t.data) for k, t in params.items()},
}
with open(OUT, "w", encoding="utf-8") as f:
    f.write("// 자동 생성 파일 - train/train_tiny_gpt.py 로 학습해서 만들어짐. 직접 수정하지 말 것.\n")
    f.write("window.TINY_GPT = ")
    json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\n")
print("\nsaved ->", os.path.abspath(OUT), os.path.getsize(OUT) // 1024, "KB")
