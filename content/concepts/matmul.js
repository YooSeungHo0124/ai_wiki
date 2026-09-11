WIKI.concept({
slug:'matmul',

tldr:'두 행렬을 곱해 모든 행-열 쌍의 내적을 한 번에 계산하는 연산으로, 선형층과 어텐션을 포함한 딥러닝 연산 대부분이 결국 행렬곱으로 환원된다.',

why:'GPU 가 딥러닝에 특히 잘 맞는 이유, 모델의 연산량(FLOPs)을 셀 수 있는 이유, 왜 컨텍스트 길이를 늘리면 어텐션 비용이 제곱으로 느는지가 전부 행렬곱의 계산 복잡도에서 나온다. [FlashAttention](#/p/flashattention) 같은 최적화가 "수학적으로 같은 결과를 메모리 접근 방식만 바꿔서" 빠르게 만드는 것도 행렬곱의 구조를 이해해야 왜 되는지 보인다.',

sections:[
 {h:'정의와 형태', d:'$A\\in\\mathbb{R}^{m\\times k}$ 와 $B\\in\\mathbb{R}^{k\\times n}$ 을 곱하면 $C=AB\\in\\mathbb{R}^{m\\times n}$ 이 나오고, $C_{ij}=\\sum_{l=1}^k A_{il}B_{lj}$ — $A$ 의 $i$ 행과 $B$ 의 $j$ 열의 내적이다. 안쪽 차원 $k$ 가 반드시 일치해야 하고, 결과의 shape 은 바깥쪽 두 차원 $m,n$ 으로 결정된다.'},
 {h:'전부 행렬곱이다', d:'선형층 $y=Wx$ 는 가중치 행렬과 입력 벡터(또는 배치)의 곱이다. [self-attention](#/c/self-attention)의 $QK^\\top$ 도 행렬곱이고, 그 결과에 softmax 를 씌운 뒤 다시 $V$ 와 곱하는 것도 행렬곱이다. 즉 Transformer 순전파의 압도적 비중은 행렬곱이 차지하고, 이게 GPU(수천 개의 코어로 곱셈-덧셈을 병렬화)가 학습을 몇 자릿수 빠르게 만드는 이유다.'},
 {h:'연산량을 세어보기', d:'$A\\in\\mathbb{R}^{m\\times k}$, $B\\in\\mathbb{R}^{k\\times n}$ 의 곱은 $m\\times n$ 개의 출력 원소마다 $k$ 번의 곱셈과 $k-1$ 번의 덧셈이 필요하므로, 전체 연산량은 $O(mnk)$(대략 $2mnk$ FLOPs)다. self-attention 에서 $Q,K\\in\\mathbb{R}^{n\\times d}$ 라면 $QK^\\top$ 은 $m=n,\\,k=d,\\,n=n$ 을 대입해 $O(n^2 d)$ — 이것이 시퀀스 길이 $n$ 의 제곱에 비례하는 이유를 직접 셀 수 있는 근거다. $\\times V$(다시 $n\\times n$ 과 $n\\times d$ 를 곱함)도 같은 $O(n^2 d)$ 다.'},
 {h:'배치 행렬곱', d:'실무에서는 단일 행렬곱이 아니라 배치 차원이 추가된 batched matmul(`torch.bmm`, `einsum`)을 쓴다 — 배치 $N$ 개, [multi-head](#/c/multi-head) $H$ 개 각각에 대해 같은 모양의 행렬곱을 동시에 수행한다. 연산량은 단일 행렬곱의 $N\\times H$ 배가 되고, 이게 실제 학습·추론 비용을 좌우하는 지배적 항이다.'}
],

math:[
 {tex:'C_{ij}=\\sum_{l=1}^{k} A_{il}B_{lj},\\qquad \\text{FLOPs}\\approx 2mnk',
  expr:'행렬곱의 정의와 연산량', d:'$A\\in\\mathbb{R}^{m\\times k}$, $B\\in\\mathbb{R}^{k\\times n}$. 출력 원소 하나에 $k$ 번 곱셈+덧셈, 원소가 $mn$ 개이므로 전체 FLOPs 는 $mnk$ 에 비례한다(곱셈·덧셈을 각각 세면 약 $2mnk$).'}
],

diagram:{type:'flow', cap:'행렬곱의 형태 규칙: 안쪽 차원이 만나 사라진다.',
 nodes:[
  {t:'A: m×k'},
  {t:'B: k×n'},
  {t:'k 일치 확인'},
  {t:'C: m×n', s:'O(mnk) FLOPs'}
 ]},

confuse:[
 {a:'행렬곱(matmul)', b:'원소별 곱(elementwise, Hadamard)', d:'행렬곱은 안쪽 차원이 일치해야 하고 결과 shape 이 입력과 다르다. 원소별 곱은 두 텐서의 shape 이 완전히 같아야(또는 broadcasting 가능해야) 하고 결과 shape 도 같다. `@`/`torch.matmul` 과 `*` 를 코드에서 바꿔 쓰면 소리 없이 다른 연산이 된다.'},
 {a:'O(n²d) 어텐션', b:'O(nd²) 선형층', d:'시퀀스 길이 $n$ 이 임베딩 차원 $d$ 보다 훨씬 클 때(긴 컨텍스트) 어텐션의 $O(n^2d)$ 가 지배적이 되고, 반대로 $n$ 이 작으면 QKV 투영·FFN 같은 $O(nd^2)$ 항이 지배적이다. "Transformer 비용 = 어텐션 비용"이라고 단순화하면 짧은 시퀀스에서는 틀린다.'}
],

pitfalls:[
 '행렬곱은 교환법칙이 성립하지 않는다($AB\\neq BA$, 애초에 형태가 안 맞으면 정의도 안 됨) — 순서를 바꾸면 다른 연산이거나 에러가 난다.',
 '연산량(FLOPs)과 실제 소요 시간(wall-clock)은 다르다 — 메모리 접근(memory-bound)이 병목이면 FLOPs 가 같아도 구현 방식(타일링, [FlashAttention](#/p/flashattention))에 따라 실측 속도가 몇 배씩 차이 난다.',
 '"파라미터 수가 많으면 느리다"고 단순화하기 쉬운데, 실제 지연은 FLOPs 뿐 아니라 행렬 형태(정사각에 가까울수록 GPU 효율이 좋다)와 메모리 대역폭에도 크게 좌우된다 — 같은 FLOPs 라도 형태가 다르면 실측 속도가 다르다.'
],

code:{lang:'python', d:'선형층 FLOPs 를 직접 세어 어텐션의 O(n²d) 와 비교.',
 src:'n, d = 2048, 4096          # 시퀀스 길이, 임베딩 차원\nattn_flops = 2 * n * n * d  # QK^T 한 번, 대략 2n^2 d\nffn_flops  = 2 * n * d * (4*d)  # FFN 선형층 하나\nprint(attn_flops, ffn_flops)\n# n 이 커질수록 attn_flops 가 ffn_flops 를 앞지른다'},

papers:['transformer','flashattention'],
terms:['vector-matrix','tensor','self-attention']
});
