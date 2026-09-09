WIKI.paper({
slug:'transformer',
venue:'NeurIPS 2017',
authors:'Vaswani et al. (Google Brain · Google Research · U. Toronto)',
arxiv:'1706.03762',

tldr:'순환(RNN)과 합성곱을 전부 버리고 **attention만으로** 시퀀스를 처리해도 번역 품질이 더 좋다는 것을 보인 논문. 시퀀스 길이만큼 순차적으로 기다릴 필요가 사라지면서, 이후 모든 대규모 모델의 기본 골격이 되었다.',

context:'2017년의 기계번역은 LSTM 기반 encoder–decoder에 [Bahdanau attention](#/p/bahdanau)을 얹은 구조가 표준이었다. 문제는 **순차성**이다. RNN은 $h_t$ 를 계산하려면 $h_{t-1}$ 이 필요하므로 문장 길이 $n$ 만큼의 스텝을 직렬로 밟아야 하고, GPU의 병렬성을 쓸 수 없다. 게다가 멀리 떨어진 두 단어의 관계는 그 사이의 모든 스텝을 통과해야 전달돼서 신호가 희석된다. 당시 대안이던 ConvS2S는 병렬화는 되지만 두 위치를 잇는 경로 길이가 거리에 따라 늘어난다. 이 논문의 질문은 단순하다 — **attention은 이미 임의의 두 위치를 한 번에 잇는데, 굳이 RNN이 왜 필요한가?**',

ideas:[
 {h:'Self-attention: 시퀀스가 자기 자신을 참조한다',
  lead:'Q·K·V로 모든 토큰이 서로를 직접 참조해 관계를 한 홉에 계산한다.',
  d:'기존 attention은 decoder가 encoder를 쳐다보는 용도였다. 여기서는 **같은 시퀀스 안의 토큰들이 서로를 쳐다본다**. 각 토큰이 Query·Key·Value 세 벡터를 만들고, Query와 모든 Key의 내적으로 "누구를 볼지"를 정한 뒤 Value를 가중합한다. 임의의 두 위치 사이 경로 길이가 $O(1)$ 이 되어, 문장 끝의 동사가 문장 앞의 목적어를 **한 홉에** 참조할 수 있다.'},
 {h:'Scaled dot-product: √d로 나누는 한 줄',
  lead:'내적을 $\\sqrt{d_k}$ 로 나눠 softmax 분산을 안정시켜 gradient 소실을 막는다.',
  d:'차원 $d_k$ 가 커지면 내적의 분산이 $d_k$ 에 비례해 커지고, softmax가 한 곳에 극단적으로 몰려 gradient가 죽는다. 점수를 $\\sqrt{d_k}$ 로 나눠 분산을 1 근처로 되돌리는 것이 전부지만, 이 한 줄이 없으면 깊은 모델의 학습이 불안정해진다.'},
 {h:'Multi-head: 한 번에 여러 종류의 관계를 본다',
  lead:'$d_{model}$ 을 $h$ 개로 나눠 서로 다른 관계를 병렬로 포착한다.',
  d:'하나의 attention은 결국 하나의 가중 평균이라 여러 관계를 동시에 표현하기 어렵다. $d_{model}$ 을 $h$ 개로 쪼개 각각 독립적인 attention을 돌린 뒤 concat한다. 실제로 어떤 head는 문법적 의존관계를, 어떤 head는 바로 앞 토큰을, 어떤 head는 지시 대상을 추적하는 식으로 분화한다. 계산량은 단일 head와 거의 같다.'},
 {h:'위치 정보는 아키텍처가 아니라 입력으로 준다',
  lead:'순서 정보를 sin/cos 위치 인코딩으로 만들어 임베딩에 더해 주입한다.',
  d:'attention은 순서 개념이 없는 집합 연산이다. 그래서 sin/cos 주기 함수로 만든 positional encoding을 임베딩에 **더해서** 위치를 주입한다. 순서를 구조가 아니라 데이터로 취급한 이 선택이, 나중에 [RoPE](#/p/rope)·[ALiBi](#/p/alibi) 같은 위치 인코딩 교체 실험을 가능하게 만들었다.'},
 {h:'Residual + LayerNorm + FFN이라는 블록 규격',
  lead:'attention과 FFN을 residual·LayerNorm으로 감싸 표준 블록으로 규격화한다.',
  d:'`x ← x + Sublayer(LayerNorm(x))` 형태로 attention과 position-wise FFN(보통 4배 확장)을 쌓는다. 이 블록이 표준 규격이 되면서, 이후 연구는 "새 아키텍처"가 아니라 "이 블록의 어느 부품을 갈아끼울까"의 문제로 바뀌었다.'}
],

diagram:{type:'stack', cap:'Transformer 블록 하나. 이후 8년간 사실상 모든 대형 모델이 이 규격을 반복해 쌓는다.',
 layers:[
  {t:'임베딩 + 위치인코딩', s:'n × d_model'},
  {t:'LayerNorm', s:'평균 0 · 분산 1'},
  {t:'Self-Attention', s:'h개 head 병렬 attention', acc:true, note:'토큰끼리 정보 교환'},
  {t:'Residual 연결', s:'x + attention 출력'},
  {t:'FFN', s:'d → 4d → d (ReLU)', note:'토큰별 독립 계산'},
  {t:'Residual 연결', s:'x + FFN 출력'}
 ]},

math:[
 {expr:'Attention(Q, K, V) = softmax( Q Kᵀ / √d_k ) V',
  tex:'\\text{Attention}(Q,K,V)=\\text{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d_k}}\\right)V',
  d:'논문 전체가 사실상 이 한 줄이다. $QK^T$ 는 모든 토큰 쌍의 유사도 행렬(n×n), softmax는 그것을 확률 분포로, 마지막 $V$ 곱은 그 분포로 값들을 섞는 것.'},
 {expr:'MultiHead(Q,K,V) = Concat(head₁ … head_h) W_O,   head_i = Attention(Q W_Qⁱ, K W_Kⁱ, V W_Vⁱ)',
  tex:'\\begin{aligned}\\text{MultiHead}(Q,K,V) &= \\text{Concat}(\\text{head}_1,\\dots,\\text{head}_h)W_O\\\\ \\text{head}_i &= \\text{Attention}(QW_Q^{i}, KW_K^{i}, VW_V^{i})\\end{aligned}',
  d:'각 head는 $d_{model}/h$ 차원의 부분공간에서 따로 attention을 수행한다. 논문 기본값은 $d_{model}=512$, $h=8$, 따라서 head당 64차원.'},
 {expr:'PE(pos, 2i) = sin(pos / 10000^(2i/d)),   PE(pos, 2i+1) = cos(pos / 10000^(2i/d))',
  tex:'\\begin{aligned}PE_{(pos,\\,2i)} &= \\sin\\!\\left(pos/10000^{2i/d}\\right)\\\\ PE_{(pos,\\,2i+1)} &= \\cos\\!\\left(pos/10000^{2i/d}\\right)\\end{aligned}',
  d:'주파수를 지수적으로 바꿔가며 위치를 인코딩한다. 상대 위치 $k$ 만큼의 이동이 선형 변환으로 표현되므로 모델이 상대적 거리를 배우기 쉽다.'}
],

numbers:[
 {k:'BLEU · WMT14 EN→DE', v:'28.4', d:'당시 앙상블 SOTA를 **+2.0** 앞섬'},
 {k:'BLEU · WMT14 EN→FR', v:'41.8', d:'단일 모델 기준 최고'},
 {k:'학습 비용', v:'3.5일 × 8 GPU', d:'기존 최고 모델 대비 학습 연산량 **약 1/100**'},
 {k:'기본 구성', v:'6층 · d 512 · head 8 · FFN 2048', d:'"base" 모델 65M 파라미터'},
 {k:'경로 길이', v:'O(1)', d:'RNN은 $O(n)$, ConvS2S는 $O(\\log_k n)$'},
 {k:'복잡도', v:'O(n²·d)', d:'길이에 제곱 — 훗날 긴 문맥의 최대 병목이 된다'}
],

impact:'세 가지가 동시에 바뀌었다. **(1) 병렬화** — 한 시퀀스 전체를 한 번의 행렬곱으로 처리할 수 있어 GPU를 100% 쓰게 됐고, 이것이 곧 "모델을 키우면 된다"는 [스케일링 법칙](#/p/scaling-laws) 시대의 물리적 전제가 되었다. **(2) 통일** — 번역용으로 나온 구조가 encoder만 떼면 [BERT](#/p/bert), decoder만 떼면 [GPT](#/p/gpt1), 이미지 패치를 넣으면 [ViT](#/p/vit)가 되면서 NLP·비전·음성·생성이 하나의 아키텍처로 수렴했다. **(3) 해석 가능성** — attention 가중치가 "모델이 무엇을 보고 있는가"의 직접적인 관찰 창을 열었다.',

legacy:[
 '**encoder/decoder 분화** — [BERT](#/p/bert)(encoder·양방향), [GPT](#/p/gpt1)(decoder·자기회귀), [T5](#/p/t5)(둘 다)로 갈라지며 사전학습 패러다임이 정착',
 '**도메인 이식** — [ViT](#/p/vit), [DETR](#/p/detr), [Whisper](#/p/whisper), [DiT](#/p/dit)까지 "패치/프레임을 토큰으로 보면 된다"는 레시피가 전 분야로 확산',
 '**$O(n^2)$ 와의 싸움** — [희소 attention](#/p/sparse-attn), [FlashAttention](#/p/flashattention), [MQA](#/p/mqa)/[GQA](#/p/gqa), [Mamba](#/p/mamba)까지 이 논문이 남긴 제곱 복잡도를 깎는 연구 계열이 통째로 생김',
 '**부품 교체 연구** — 위치 인코딩은 [RoPE](#/p/rope)로, 정규화 위치는 pre-LN으로, FFN은 [MoE](#/p/moe-shazeer)로 대체되며 원본 논문 그대로 쓰는 모델은 오늘날 거의 없다'
],

pitfalls:[
 '**"attention 가중치 = 모델의 근거"는 과장이다.** 가중치가 높은 토큰이 예측에 실제로 인과적으로 기여했는지는 별개 문제이며, 이 해석 논쟁은 지금도 끝나지 않았다.',
 '**원 논문은 post-LN(sublayer 뒤에 LayerNorm)이었다.** 이 구성은 깊게 쌓으면 warm-up 없이 발산하기 쉬워서, 현대 구현은 거의 전부 **pre-LN**으로 바뀌었다. 논문 그림을 그대로 코드로 옮기면 학습이 안 될 수 있다.',
 '**"RNN보다 항상 빠르다"가 아니다.** 학습은 병렬이지만 **생성(추론)은 여전히 토큰 하나씩 순차적**이고, 길이에 대해 $O(n^2)$ 이라 긴 문맥에서는 오히려 불리하다. 여기서 [KV 캐시](#/p/vllm)라는 별도의 공학 영역이 파생됐다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽 회색 블록이 encoder, 오른쪽 회색 블록이 decoder. 각 블록이 N=6번 반복 쌓인다. decoder 쪽에만 있는 아래에서 두 번째 "Masked Multi-Head Attention"이 causal mask이고, 그 위 "Multi-Head Attention"은 encoder 출력을 K·V로 받는 cross-attention이다. 화살표를 감싸는 곡선이 residual 경로.',
  src:'원문 Figure 1, p.3'},
 {f:'fig2-attention.png',
  cap:'왼쪽: Q·K를 MatMul → Scale(√d_k로 나눔) → (필요시 Mask) → SoftMax → V와 MatMul, 이 다섯 단계가 수식 (1) 그대로다. 오른쪽: 같은 Scaled Dot-Product Attention을 h개 복사해 병렬로 돌린 뒤(뒤에 겹쳐 그려진 상자들이 h개 head) Concat하고 한 번 더 Linear를 통과시킨 것이 Multi-Head Attention.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
  src:'Abstract, p.1'}
],

deep:{t:'이 논문은 인터랙티브 시각화가 따로 있습니다', d:'실제로 학습시킨 초소형 GPT의 forward pass를 18장에 걸쳐 한 단계씩 — Q·K·V 행렬곱부터 causal mask, softmax, KV 캐시까지 모든 숫자를 실제 값으로 확인합니다.', url:'deep/attention/'},

links:[
 {t:'arXiv 1706.03762 — Attention Is All You Need', u:'https://arxiv.org/abs/1706.03762'},
 {t:'The Illustrated Transformer (Jay Alammar)', u:'https://jalammar.github.io/illustrated-transformer/'},
 {t:'The Annotated Transformer (Harvard NLP)', u:'https://nlp.seas.harvard.edu/annotated-transformer/'}
]
});
