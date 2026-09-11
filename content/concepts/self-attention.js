WIKI.concept({
slug:'self-attention',

tldr:'같은 시퀀스의 모든 토큰이 서로를 query·key·value 로 삼아 관계를 계산하는 어텐션으로, scaled dot-product 로 유사도를 구하고 그 가중치로 value 를 섞는다.',

why:'self-attention 은 [Transformer](#/p/transformer)가 RNN 없이도 시퀀스를 처리할 수 있게 만든 핵심 연산이다. 왜 $\\sqrt{d_k}$ 로 나누는지, 왜 계산량이 시퀀스 길이의 제곱에 비례하는지를 모르면 컨텍스트 길이를 늘릴 때 왜 비용이 폭발하는지, [FlashAttention](#/p/flashattention)이나 sparse attention 같은 최적화가 왜 나왔는지를 이해할 수 없다.',

sections:[
 {h:'"자기 자신을 본다"의 의미', d:'[attention](#/c/attention-c)은 원래 디코더가 인코더를 보는 것처럼 서로 다른 두 시퀀스 사이에 걸렸다. self-attention 은 **같은 시퀀스**의 각 토큰 임베딩에서 query·key·value 세 벡터를 모두 뽑아낸다. 즉 문장의 각 단어가 문장 안의 다른 모든 단어(자기 자신 포함)를 query 로 "질문"하고, 그 답을 value 가중평균으로 받는다 — RNN처럼 앞에서부터 순서대로 정보를 전달하지 않고, 한 번에 모든 위치가 모든 위치를 직접 참조한다.'},
 {h:'scaled dot-product', d:'입력 행렬 $X$ 를 세 개의 학습된 가중치 $W_Q, W_K, W_V$ 로 각각 투영해 $Q=XW_Q,\\ K=XW_K,\\ V=XW_V$ 를 만든다. query와 key의 내적으로 유사도를 구하고, $\\sqrt{d_k}$ 로 나눠 스케일을 맞춘 뒤 softmax 로 정규화하고, 그 가중치로 value 를 가중합한다. 내적이 유사도로 쓰이는 이유는 단순히 계산이 빠르고(행렬곱 하나) 방향이 비슷한 벡터일수록 값이 커지기 때문이다.'},
 {h:'왜 √d_k 로 나누는가', d:'$q,k$ 의 각 성분이 평균 0, 분산 1인 독립 확률변수라고 하면 내적 $q\\cdot k=\\sum_{i=1}^{d_k} q_i k_i$ 의 분산은 차원 $d_k$ 에 비례해서 커진다. $d_k$ 가 크면(보통 64) 내적 값의 절댓값이 커지고, softmax 입력이 커지면 출력이 원-핫에 가깝게 **포화**되어 대부분의 gradient 가 0에 가까워진다(softmax 의 saturation). $\\sqrt{d_k}$ 로 나누면 내적의 분산이 대략 1로 유지되어 softmax 가 포화되지 않고 학습 가능한 gradient 를 유지한다.'},
 {h:'왜 O(n²) 인가, 그리고 그 대가', d:'시퀀스 길이 $n$ 의 모든 토큰이 다른 모든 토큰과 유사도를 계산하므로 $QK^\\top$ 자체가 $n\\times n$ 행렬이다 — 계산량과 저장량 모두 시퀀스 길이의 제곱에 비례한다($O(n^2 d)$). 이것이 컨텍스트 길이를 2배로 늘리면 어텐션 비용이 4배로 느는 이유이고, 실무에서 컨텍스트 길이 제한·[KV 캐시](#/c/kv-cache) 메모리 문제·sparse attention·[FlashAttention](#/p/flashattention) 같은 최적화가 나온 근본 원인이다. 디코더에서는 미래 토큰을 못 보게 $n\\times n$ 행렬의 위쪽 삼각을 $-\\infty$ 로 마스킹한 뒤 softmax 를 적용하는 causal mask 를 쓴다.'}
],

math:[
 {tex:'\\text{Attention}(Q,K,V)=\\text{softmax}\\!\\left(\\dfrac{QK^\\top}{\\sqrt{d_k}}\\right)V',
  expr:'scaled dot-product self-attention', d:'$Q,K,V\\in\\mathbb{R}^{n\\times d_k}$ 는 각각 query·key·value 행렬($n$ 은 시퀀스 길이, $d_k$ 는 head 차원). $QK^\\top\\in\\mathbb{R}^{n\\times n}$ 은 모든 토큰 쌍의 유사도 점수, $\\sqrt{d_k}$ 는 이 점수를 스케일 다운하는 상수, softmax 는 각 행(각 query 기준)을 합 1인 가중치로 바꾼다. 그 가중치 행렬을 $V$ 에 곱하면 각 토큰의 새 표현이 나온다.'}
],

diagram:{type:'flow', cap:'self-attention 한 층의 연산 순서: 입력 투영 → 유사도 → 스케일·마스킹 → softmax → value 가중합.',
 nodes:[
  {t:'X → Q,K,V', s:'선형 투영'},
  {t:'QKᵀ', s:'n×n 유사도'},
  {t:'÷√d_k + mask'},
  {t:'softmax'},
  {t:'×V', s:'출력'}
 ]},

confuse:[
 {a:'self-attention', b:'cross-attention', d:'self-attention 은 Q·K·V 를 전부 같은 시퀀스에서 뽑는다. cross-attention 은 query 는 디코더에서, key·value 는 인코더 출력에서 뽑는다 — [attention](#/c/attention-c) 원래 형태(Bahdanau)에 더 가깝다.'},
 {a:'dot-product attention', b:'additive attention', d:'Bahdanau 의 원조 attention 은 작은 MLP 로 유사도를 계산하는 additive attention 이었다. Transformer 의 self-attention 은 내적 하나로 유사도를 계산하는 dot-product attention 이다 — 행렬곱으로 구현돼 GPU 에서 훨씬 빠르다.'}
],

pitfalls:[
 '$\\sqrt{d_k}$ 스케일링을 "관행적으로 넣는 트릭" 정도로 넘기면 안 된다 — 빼면 학습 초반부터 softmax 가 포화돼 gradient 가 거의 0이 되고 학습이 사실상 멈출 수 있다.',
 'self-attention 은 원리상 순서를 모른다. 이 사실은 [positional encoding](#/c/positional-encoding)이 왜 별도로 필요한지를 설명하는 핵심 전제다.'
],

papers:['transformer','sparse-attn'],
terms:['attention-c','multi-head','positional-encoding','transformer-block']
});
