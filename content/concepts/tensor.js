WIKI.concept({
slug:'tensor',

tldr:'스칼라·벡터·행렬을 임의 차원 수로 일반화한 다차원 배열로, 딥러닝 프레임워크에서 모든 데이터와 가중치를 담는 기본 컨테이너다.',

why:'PyTorch·TensorFlow 코드의 모든 변수가 텐서다. shape 에러를 디버깅하려면 "이 텐서의 각 축이 무엇을 의미하는가"(배치? 시퀀스? 채널?)를 즉시 읽을 수 있어야 한다 — 이걸 못 하면 `RuntimeError: shape mismatch` 앞에서 매번 시행착오만 반복하게 된다.',

sections:[
 {h:'차수(rank)로 구분', d:'텐서는 축(axis)의 개수인 rank(또는 order, ndim)로 분류한다. rank 0은 스칼라(숫자 하나), rank 1은 벡터, rank 2는 행렬, rank 3 이상은 흔히 "텐서"라고 부른다. [vector-matrix](#/c/vector-matrix) 는 텐서의 특수한 경우일 뿐이다 — 수학적으로 엄밀한 텐서(다중선형 변환) 정의와 딥러닝에서 말하는 "다차원 배열"로서의 텐서는 엄밀히는 다르지만, 실무에서는 후자의 의미로만 쓰면 충분하다.'},
 {h:'shape 이 곧 의미', d:'이미지 배치는 보통 $[N,C,H,W]$(배치·채널·높이·너비), 텍스트 배치는 $[N,L,d]$(배치·시퀀스 길이·임베딩 차원) 형태의 rank-4, rank-3 텐서다. 같은 rank-3 텐서라도 축의 순서(NLD 인지 LND 인지)가 프레임워크·레이어마다 달라서, 이 규약을 안 맞추면 소리 없이 틀린 결과를 낸다(에러는 안 나고 결과만 틀림) — shape 만 맞고 의미가 틀린 경우가 디버깅에서 가장 까다롭다.'},
 {h:'broadcasting', d:'모양이 다른 텐서끼리 연산할 때, 크기가 1인 축을 자동으로 늘려서 맞추는 규칙이다. 예를 들어 $[N,L,d]$ 텐서에 $[d]$ 벡터를 더하면 벡터가 모든 $(N,L)$ 위치에 반복 적용된다 — LayerNorm 의 스케일·시프트 파라미터, 편향(bias) 덧셈이 전부 이 방식으로 동작한다. 편리하지만 의도치 않은 축에 broadcasting 이 일어나 조용히 틀린 shape 을 만드는 버그의 흔한 원인이다.'},
 {h:'메모리 레이아웃', d:'텐서는 논리적으로는 다차원이지만 실제 메모리에는 1차원으로 이어 저장된다(대개 row-major/C-order). `transpose`·`permute` 는 이 순서를 바꾸지 않고 "보는 방식"(stride)만 바꾸므로, 그 뒤 `view`/`reshape` 을 하면 에러가 나거나(`contiguous` 하지 않다는 에러) 의도와 다른 결과가 나올 수 있다 — `contiguous()` 로 실제 메모리를 재배열해야 하는 이유다.'}
],

diagram:{type:'stack', cap:'rank 이 늘수록 축 하나씩 더 붙는다.',
 layers:[
  {t:'rank 0', s:'스칼라: 3.14'},
  {t:'rank 1', s:'벡터: [d]'},
  {t:'rank 2', s:'행렬: [m,n]'},
  {t:'rank 3', s:'예: [N,L,d]'},
  {t:'rank 4', s:'예: [N,C,H,W]'}
 ]},

confuse:[
 {a:'shape', b:'size(원소 개수)', d:'shape 은 각 축의 길이를 나열한 튜플(예: `(32,128,768)`)이고, 크기(총 원소 수)는 그 곱이다. "텐서가 크다"고 할 때 rank 가 큰 건지 원소 총수가 큰 건지 구분해야 한다 — rank 2 라도 $10000\\times10000$ 이면 rank 4 텐서보다 훨씬 클 수 있다.'},
 {a:'reshape', b:'transpose/permute', d:'`reshape`(`view`)은 원소의 메모리 순서를 그대로 두고 축의 나누는 방식만 바꾼다. `transpose`/`permute`는 축의 순서 자체를 바꾼다 — $[N,L,d]$ 를 $[N,d,L]$ 로 바꾸는 건 transpose 이지 reshape 이 아니다. 이 둘을 혼동하면 데이터가 완전히 뒤섞인다.'}
],

pitfalls:[
 'shape 이 맞으면 연산이 통과되므로, 축 순서를 잘못 알고도 에러 없이 실행되어 학습이 되는 것처럼 보이다가 성능만 이상하게 낮은 경우가 있다 — 항상 축의 의미를 주석으로 남기는 습관이 도움된다.',
 '큰 텐서를 `permute`/`transpose` 후 바로 `view` 하면 "not contiguous" 에러가 난다 — `reshape` 이나 `.contiguous().view(...)` 로 바꿔야 한다.',
 'rank 이 같으면 shape 도 같다고 착각하기 쉬운데, rank 는 축의 개수일 뿐 각 축의 길이는 전혀 다를 수 있다 — rank-3 텐서끼리도 $[32,128,768]$ 과 $[8,4096,64]$ 는 완전히 다른 shape 이다.'
],

code:{lang:'python', d:'transpose 뒤 reshape 을 그대로 쓰면 나는 대표적 에러와 해결.',
 src:'import torch\nx = torch.randn(8, 16, 64)   # [N, L, d]\ny = x.transpose(1, 2)        # [N, d, L], 메모리는 안 바뀜\n# y.view(8, -1)              # RuntimeError: not contiguous\nz = y.contiguous().view(8, -1)  # 정상 동작\nprint(z.shape)'},

papers:['tensorflow'],
terms:['vector-matrix','matmul']
});
