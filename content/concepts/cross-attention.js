WIKI.concept({
slug:'cross-attention',

tldr:'query는 한 시퀀스(또는 모달리티)에서, key·value는 다른 시퀀스에서 뽑아 두 표현 사이에 정보를 흘려보내는 어텐션이다.',

why:'번역기의 인코더-디코더 연결, 확산모델이 텍스트 프롬프트를 이미지 생성에 반영하는 방식, VLM이 이미지 특징을 언어모델에 주입하는 방식 — 서로 다른 것처럼 보이는 이 세 가지가 전부 같은 연산이라는 것을 알아야 "왜 이 논문도 cross-attention을 쓰지?"라는 질문에 매번 새로 헤매지 않는다. 두 서로 다른 모달리티·시퀀스를 이어야 하는 설계 문제를 만났을 때 가장 먼저 떠올릴 후보가 이것이다.',

sections:[
 {h:'self-attn과 차이', d:'[self-attention](#/c/self-attention)은 $Q,K,V$ 세 벡터를 전부 **같은** 시퀀스에서 뽑는다. cross-attention은 $Q$는 한쪽 시퀀스(예: 디코더의 현재 상태)에서, $K,V$는 **다른** 시퀀스(예: 인코더 출력)에서 뽑는다. 연산 자체($\\text{softmax}(QK^\\top/\\sqrt{d_k})V$)는 완전히 동일하고 바뀌는 것은 오직 $Q$와 $K,V$가 어디서 왔는가뿐이다 — 이 단순한 차이가 "두 서로 다른 표현 공간 사이에 정보를 흘려보내는 다리"를 만든다.'},
 {h:'원조: 인코더-디코더 번역', d:'seq2seq 번역에서 디코더가 다음 단어를 생성할 때, 원문(인코더 출력)의 어느 부분을 봐야 하는지 알아야 한다. 디코더의 현재 상태를 $Q$로, 인코더의 전체 출력을 $K,V$로 써서 cross-attention을 하면, 디코더는 매 생성 스텝마다 원문에서 관련된 위치에 가중치를 몰아줄 수 있다. 이것이 원래 Bahdanau attention이 풀려던 문제였고, [Transformer](#/p/transformer)의 인코더-디코더 구조에서는 각 디코더 블록의 self-attention sub-layer 뒤에 별도의 cross-attention sub-layer로 명시적으로 들어간다.'},
 {h:'확산모델의 조건화', d:'text-to-image 확산모델([LDM/Stable Diffusion](#/p/ldm) 계열)에서는 U-Net(또는 DiT)의 중간 표현이 $Q$를, 텍스트 인코더(CLIP 등)가 만든 텍스트 임베딩 시퀀스가 $K,V$를 제공한다. 노이즈를 제거하는 매 단계마다 이미지 쪽 표현이 프롬프트의 각 단어에 "이 위치는 지금 어떤 단어와 관련 있는지" 물어보는 구조다 — self-attention이 이미지 내부 픽셀·패치끼리의 관계를 다루는 것과 역할이 분리된다.'},
 {h:'VLM의 이미지 주입', d:'[Flamingo](#/p/flamingo) 같은 비전-언어모델은 이미지 인코더가 뽑은 시각 특징을 그대로 언어모델 토큰 시퀀스에 섞지 않고, 언어모델의 텍스트 표현을 $Q$로, 이미지 특징을 $K,V$로 하는 cross-attention 레이어를 언어모델 블록 사이사이에 끼워 넣는다. 텍스트 쪽 파라미터(대형 사전학습 LM)는 대부분 고정한 채 이 cross-attention 레이어만 새로 학습하는 식으로, 언어모델의 능력을 재사용하면서 시각 정보를 주입하는 값싼 방법이 된다.'},
 {h:'왜 이 방식을 고르나', d:'이미지 토큰을 텍스트 토큰과 그냥 이어붙여 self-attention 하나로 처리하는 방법(예: 초기 ViT-language 결합 모델들)도 가능하지만, 이미지 토큰 수가 많아지면 시퀀스 길이가 크게 늘어 $O(n^2)$ 비용이 커지고 텍스트 전용으로 사전학습된 self-attention 가중치를 건드리게 된다. cross-attention을 별도 레이어로 끼워 넣으면 시퀀스 길이 증가 없이(이미지는 K,V로만 참여) 사전학습된 언어모델 본체를 그대로 재사용할 수 있어, 특히 대형 언어모델에 시각 능력을 값싸게 얹을 때 선호된다.'}
],

math:[
 {tex:'\\text{CrossAttn}(X,C)=\\text{softmax}\\!\\left(\\dfrac{(XW_Q)(CW_K)^\\top}{\\sqrt{d_k}}\\right)(CW_V)',
  expr:'cross-attention', d:'$X$는 query를 낼 시퀀스(예: 디코더 상태, 이미지 표현), $C$는 조건(condition) 시퀀스(예: 인코더 출력, 텍스트 임베딩). $Q=XW_Q$는 $X$에서, $K=CW_K,\\ V=CW_V$는 $C$에서 나오므로 두 시퀀스의 길이가 달라도(디코더 길이 $\\ne$ 인코더 길이) 문제없이 계산된다 — $QK^\\top$의 크기가 $|X|\\times|C|$일 뿐이다.'}
],

code:{lang:'python', d:'cross-attention은 self-attention과 같은 함수를 K,V의 출처만 바꿔 쓴다.',
 src:`def cross_attention(X, C, Wq, Wk, Wv):
    Q = X @ Wq          # X: query를 낼 시퀀스 (디코더/이미지)
    K = C @ Wk          # C: 조건 시퀀스 (인코더 출력/텍스트)
    V = C @ Wv
    A = softmax((Q @ K.T) / sqrt(d_k))  # (|X|, |C|)
    return A @ V        # X와 같은 길이로 출력`},

diagram:{type:'flow', cap:'cross-attention: Q는 한쪽, K·V는 다른 쪽에서.',
 nodes:[
  {t:'X(디코더)', s:'Q 투영'},
  {t:'C(인코더/조건)', s:'K,V 투영'},
  {t:'QKᵀ softmax'},
  {t:'×V', s:'X쪽에 주입'}
 ]},

confuse:[
 {a:'cross-attention', b:'self-attention', d:'self-attention은 $Q,K,V$가 전부 같은 시퀀스에서 나와 시퀀스 내부 관계를 계산한다. cross-attention은 $Q$와 $K,V$의 출처가 다른 두 시퀀스라 서로 다른 표현 공간 사이의 관계를 계산한다. 인코더-디코더 Transformer는 두 종류를 블록마다 모두 쓴다.'},
 {a:'cross-attention', b:'concatenation(단순 결합)', d:'두 표현을 그냥 이어 붙이거나 더하면 어느 위치가 어느 위치와 관련 있는지 구분 없이 뭉뚱그려진다. cross-attention은 $Q$쪽의 각 위치가 $C$쪽의 어느 위치를 얼마나 참조할지 가중치를 학습하므로, 위치별로 선택적인 정보 흐름을 만든다는 점이 다르다.'},
 {a:'cross-attention', b:'AdaLN(adaptive LayerNorm)', d:'[DiT](#/c/dit-c) 계열은 조건 주입을 cross-attention이 아니라 조건 벡터로 정규화의 scale·shift를 바꾸는 AdaLN으로 하기도 한다 — 조건이 시퀀스(예: 텍스트 여러 토큰)면 cross-attention이, 조건이 벡터 하나(예: 클래스 라벨, 타임스텝)면 AdaLN이 더 자연스러운 선택이다.'}
],

pitfalls:[
 'cross-attention을 "self-attention의 변형된 특수 버전"으로 가볍게 넘기면, 두 입력의 시퀀스 길이가 달라도 되고 두 표현 공간이 처음부터 다른 도메인(텍스트 vs 이미지)이어도 된다는 유연성을 놓친다.',
 '확산모델에서 self-attention과 cross-attention을 혼동하기 쉽다 — 같은 블록 안에 둘 다 있는 경우가 흔하며(이미지 내부 self-attention + 텍스트 조건 cross-attention), 프롬프트 편집 기법들은 정확히 cross-attention의 가중치 맵만 조작하는 경우가 많다.',
 'cross-attention이 있으면 반드시 인코더-디코더 구조라고 오해하기 쉽지만, 디코더 전용 모델에 조건을 주입하려고 cross-attention 레이어만 추가로 끼워 넣는 설계([Flamingo](#/p/flamingo) 등)도 흔하다.'
],

papers:['transformer','ldm','flamingo'],
terms:['self-attention','attention-c','dit-c','transformer-block']
});
