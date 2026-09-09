WIKI.paper({
slug:'siglip',
venue:'ICCV 2023',
authors:'Zhai, Mustafa, Kolesnikov, Beyer (Google DeepMind)',
arxiv:'2303.15343',

tldr:'[CLIP](#/p/clip)의 softmax 대조 손실을 **쌍마다 독립적인 sigmoid 이진 분류**로 바꾼 논문. 정규화를 위해 배치 전체를 한눈에 볼 필요가 없어지면서, 작은 배치에서 더 잘 되고 큰 배치로도 더 쉽게 확장된다. TPUv4 칩 4개로 이틀 학습해 ImageNet zero-shot 84.5%를 찍었다.',

context:'[CLIP](#/p/clip)과 [ALIGN](#/p/align)이 정착시킨 대조학습에는 조용한 전제가 하나 있다 — **배치가 커야 한다**. softmax는 한 이미지에 대한 모든 텍스트의 점수를 분모에서 더해 확률로 만들기 때문에, 배치 안의 다른 항목들이 곧 negative 집합이고 배치 크기가 곧 문제의 난이도다. 그래서 CLIP은 32,768, ALIGN은 16,384라는 배치를 썼고, 이는 곧 수백~수천 개의 가속기를 전제로 한다. 구현 측면도 무겁다 — $B \\times B$ 유사도 행렬을 만들려면 모든 디바이스의 임베딩을 all-gather 해야 하고, 수치 안정성을 위해 행별 최댓값을 빼는 추가 통신 패스가 붙으며, 행 방향·열 방향 두 번 정규화해야 한다. 이 논문의 질문은 이렇다 — **정규화를 배치 전체에 대해 해야 할 이유가 정말 있는가?**',

ideas:[
 {h:'N개 중 고르기가 아니라, N² 개의 예/아니오',
  lead:'배치 전체를 정규화하는 대신 각 이미지-텍스트 쌍을 독립적인 이진 분류로 푼다.',
  d:'softmax 손실은 "이 이미지에 맞는 텍스트를 배치 안 $N$ 개 중 고르라"는 **다중 선택 문제**다. SigLIP은 이를 $N \\times N$ 개의 **독립적인 이진 문제**로 재정의한다. 각 (이미지 $i$, 텍스트 $j$) 쌍에 대해 "짝이 맞나?"만 sigmoid로 묻고, 대각선은 정답(+1), 나머지는 오답(−1)이다. 어떤 셀의 손실도 다른 셀의 값에 의존하지 않는다.'},
 {h:'배치 크기 의존이 끊기는 이유',
  lead:'softmax의 분모가 사라져 손실이 배치 구성 전체에 의존하지 않는다.',
  d:'softmax의 분모 $\\sum_j \\exp(\\cdot)$ 가 사라지면 손실이 **배치 구성에 대한 전역 함수가 아니게 된다**. 배치가 작으면 negative 개수가 줄어들 뿐, 목적함수의 형태 자체는 그대로다. 반대로 softmax에서는 배치가 작아지면 분모의 항이 줄어 각 negative의 상대적 무게가 왜곡되고, 배치가 커지면 정답 하나가 수만 개 오답과 겨루는 극단적 불균형이 생긴다. 실제로 sigmoid 손실은 배치 16k 이하에서 softmax를 일관되게 앞선다.'},
 {h:'학습 가능한 bias로 극단적 클래스 불균형을 잡는다',
  lead:'로짓 bias를 −10으로 초기화해 압도적인 negative 비율로 인한 초기 붕괴를 막는다.',
  d:'이진 문제로 바꾸면 배치당 positive는 $N$ 개, negative는 $N^2 - N$ 개다. 배치 32k면 오답이 정답의 3만 배다. 학습 초반 이 불균형이 그대로 gradient에 실리면 모델이 전부 "아니오"로 붕괴한다. 그래서 로짓에 **학습 가능한 bias $b$ 를 −10으로 초기화**해 넣는다. 시작 시점의 예측을 사전 분포(대부분 negative) 근처에 놓아 초기 gradient 폭주를 막고, 학습이 진행되면 $b$ 가 알아서 조정된다. 온도 $t$ 역시 학습 대상이다.'},
 {h:'디바이스 간 통신이 all-gather에서 순환 교환으로',
  lead:'전역 정규화가 없으니 임베딩을 다 모으지 않고 이웃 디바이스끼리만 교환한다.',
  d:'전역 정규화가 없으니 전체 $B \\times B$ 행렬을 한 곳에 모을 이유도 없다. 각 디바이스는 자기가 가진 $b \\times b$ 로컬 블록의 손실을 계산하고, **텍스트 임베딩만 이웃 디바이스로 순환(cyclic permutation)시키며** 블록 손실을 누적한다. 피크 메모리가 $O(B^2)$ 에서 $O(b^2)$ 로 떨어지고, 통신도 all-gather 대신 이웃 간 교환으로 끝난다. 같은 TPUv4 칩 4개에서 Base 모델 기준 CLIP은 배치 2048까지, SigLIP은 **4096**까지 올라간다.'},
 {h:'"배치를 계속 키우면 좋아진다"는 통념을 반증한다',
  lead:'배치를 100만까지 키워봐도 성능은 32k 부근에서 이미 포화한다.',
  d:'sigmoid 손실 덕분에 배치를 **최대 100만**까지 밀어 볼 수 있게 되자, 오히려 그럴 필요가 없다는 결론이 나왔다. 성능은 배치 **32k 부근에서 사실상 포화**하고 그 이상은 미미하거나 되레 떨어진다. softmax는 98k에서야 최고점을 찍으면서도 sigmoid를 이기지 못했다. 즉 CLIP 시대의 거대 배치는 좋은 표현을 위한 필요조건이 아니라 **softmax 손실이 요구하던 비용**이었다.'}
],

figures:[
 {f:'fig1-sigmoid-algorithm.png',
  cap:'논문이 제안하는 손실 전체가 이 8줄이다. `logits`는 `n×n` 유사도 행렬(온도·bias 적용)이고, `labels`는 대각선만 +1, 나머지는 -1인 행렬 — softmax처럼 행/열을 정규화하는 과정이 아예 없고, `log_sigmoid`를 원소별로 씌워 평균만 내면 끝이라는 점을 코드로 확인한다.',
  src:'원문 Algorithm 1, p.2'},
 {f:'fig2-batchsize-curve.png',
  cap:'가로축이 배치 크기(로그 스케일), 세로축이 ImageNet zero-shot 정확도. 왼쪽(SigLiT)·가운데(SigLIP) 모두 작은 배치에서 sigmoid(녹색 원)가 softmax(주황 별)를 크게 앞서다가 배치가 커지면 두 곡선이 32k 부근에서 만나고, 그 이상 키우면 오히려 하락한다 — "배치는 클수록 좋다"는 통념이 이 곡선에서 무너진다.',
  src:'원문 Figure 2, p.4'}
],

diagram:{type:'matrix', cap:'배치 4개일 때의 목표값 z_ij. softmax는 각 행을 확률 분포로 정규화하지만, sigmoid 손실은 16개 셀 각각을 독립된 이진 분류로 본다 — 어떤 셀도 다른 셀의 값을 필요로 하지 않는다.',
 cols:['txt 1','txt 2','txt 3','txt 4'],
 rows:[
  {t:'img 1', v:[1,0,0,0]},
  {t:'img 2', v:[0,1,0,0]},
  {t:'img 3', v:[0,0,1,0]},
  {t:'img 4', v:[0,0,0,1]}
 ]},

quotes:[
 {t:'Unlike standard contrastive learning with softmax normalization, the sigmoid loss operates solely on image-text pairs and does not require a global view of the pairwise similarities for normalization.',
  src:'Abstract, p.1'},
 {t:'To our surprise, the performance saturates at 32k batch size, further scaling up the batch size only gives a minor boost, and the model peaks at 84.5% on ImageNet zero-shot classification task.',
  src:'Section 4.1, p.4'}
],

math:[
 {expr:'L = -1/N Σ_i Σ_j  log σ( z_ij · ( t · x_i·y_j + b ) ),   z_ij = +1 if i=j else -1',
  tex:'\\mathcal{L} = -\\frac{1}{N}\\sum_{i}\\sum_{j} \\log \\sigma\\big(z_{ij}\\,(t \\cdot x_i \\cdot y_j + b)\\big),\\quad z_{ij}=\\begin{cases}+1 & i=j\\\\-1 & i\\ne j\\end{cases}',
  d:'논문 전체가 이 한 줄이다. $x_i, y_j$ 는 L2 정규화된 이미지·텍스트 임베딩, $t$ 는 학습되는 온도, $b$ 는 학습되는 bias다. $\\sigma$ 는 시그모이드이고 $z_{ij}$ 부호가 정답/오답을 뒤집는다. **분모에 다른 쌍이 등장하지 않는다**는 점이 softmax와의 유일하면서 결정적인 차이다.'},
 {expr:'CLIP:  L = -1/2N Σ_i [ log( e^{t·x_i·y_i} / Σ_j e^{t·x_i·y_j} ) + log( e^{t·x_i·y_i} / Σ_j e^{t·x_j·y_i} ) ]',
  tex:'\\mathcal{L}_{\\text{CLIP}} = -\\frac{1}{2N}\\sum_i \\left[ \\log\\frac{e^{t\\cdot x_i \\cdot y_i}}{\\sum_j e^{t\\cdot x_i \\cdot y_j}} + \\log\\frac{e^{t\\cdot x_i \\cdot y_i}}{\\sum_j e^{t\\cdot x_j \\cdot y_i}} \\right]',
  d:'비교용. 분모의 $\\sum_j$ 때문에 (1) 배치 전체의 임베딩이 필요하고, (2) 수치 안정화를 위한 최댓값 빼기 패스가 붙고, (3) 행·열 두 방향을 따로 정규화해야 한다. sigmoid 버전은 이 세 가지가 전부 사라진다.'},
 {expr:'b ← -10 (초기값)',
  tex:'b \\leftarrow -10 \\;\\text{(초기값)}',
  d:'positive $N$ 개 대 negative $N^2-N$ 개라는 불균형 때문에, bias 없이 시작하면 초기 손실이 negative 쪽으로 쏠려 큰 gradient 스텝을 만든다. $b = -10$ 은 초기 예측 확률을 0에 가깝게 눌러 학습 시작점을 사전 분포에 맞춘다.'}
],

numbers:[
 {k:'SigLiT ImageNet zero-shot', v:'84.5%', d:'**TPUv4 칩 4개로 2일** 학습. Locked-image Tuning(이미지 타워를 얼리고 텍스트 타워만 학습)과 결합한 구성'},
 {k:'성능 포화 배치', v:'32k', d:'그 이상 키워도 이득이 거의 없거나 감소'},
 {k:'탐색한 최대 배치', v:'1,000,000', d:'sigmoid 손실 덕에 실험 자체가 가능해졌고, 그 결과 "더 키울 필요 없음"이 밝혀짐'},
 {k:'softmax 최적 배치', v:'98k', d:'거기서도 sigmoid 버전을 이기지 못함'},
 {k:'sigmoid 우위 구간', v:'배치 16k 이하', d:'작은 배치일수록 격차가 커진다 — 자원이 적을수록 이득이 큰 손실함수'},
 {k:'메모리', v:'같은 칩 4개에서 4096 vs 2048', d:'Base 모델 기준 SigLIP이 CLIP의 2배 배치를 수용'},
 {k:'bias 초기값', v:'b = -10', d:'positive:negative 불균형(배치 32k면 약 1:32767)에 맞춘 초기화'}
],

impact:'손실함수 한 줄을 바꿔서 **대조학습의 진입 장벽을 낮췄다**는 점이 핵심이다. CLIP 재현에는 수백 대의 가속기가 필요하다는 인식이 있었지만, SigLIP은 배치가 그 자체로 목적이 아니었음을 보였고 소규모 클러스터에서도 경쟁력 있는 학습이 가능해졌다. 동시에 "거대 배치 = 좋은 대조 표현"이라는 커뮤니티의 암묵적 가정을 정면으로 측정해 반증했다. 실무적으로는 공개된 SigLIP 가중치가 CLIP을 대체하기 시작했고 — 특히 **VLM의 비전 인코더** 자리에서 — [LLaVA](#/p/llava) 계열과 [Qwen-VL](#/p/qwen-vl) 이후의 오픈 멀티모달 모델들이 CLIP ViT 대신 SigLIP 백본을 기본값으로 채택하는 흐름이 만들어졌다.',

legacy:[
 '**VLM 기본 백본 교체** — [LLaVA](#/p/llava)·[Qwen-VL](#/p/qwen-vl) 계열 이후의 오픈 VLM들이 CLIP ViT 자리에 SigLIP 인코더를 놓기 시작',
 '**후속 SigLIP 2** — 다국어 데이터, 캡션 기반 사전학습, 자기지도(디코더·거리 기반) 목적을 섞어 같은 sigmoid 골격을 확장',
 '**손실함수 재검토 흐름** — "in-batch softmax가 정말 필요한가"라는 질문이 대조학습 전반(검색·추천 임베딩 포함)으로 번짐',
 '**저자원 대조학습** — 배치 포화 지점이 측정되면서, 자원 배분이 "배치 키우기"에서 데이터 품질·해상도·학습 스텝 쪽으로 이동'
],

pitfalls:[
 '**"sigmoid가 언제나 낫다"는 아니다.** 이득이 뚜렷한 구간은 작은 배치이고, 32k 부근에서는 두 손실의 차이가 좁혀진다. 이미 대규모 클러스터에서 32k 배치로 잘 돌고 있는 파이프라인을 sigmoid로 바꾼다고 큰 폭의 개선이 보장되지는 않는다.',
 '**bias 초기화와 온도는 하이퍼파라미터가 아니라 필수 장치다.** $b$ 를 0에서 시작하거나 고정하면 극단적 클래스 불균형 때문에 초기 학습이 무너진다. 논문 결과만 보고 손실 식만 옮겨 심으면 재현이 안 되는 대표적인 지점이다.',
 '**손실을 바꿔도 [CLIP](#/p/clip)이 물려준 한계는 그대로다.** 개수 세기·공간 관계·세밀한 속성 구분 같은 약점, 웹 데이터에서 오는 편향, zero-shot 평가와 학습 데이터의 오염 가능성은 이 논문이 건드리는 문제가 아니다. SigLIP은 **같은 목표를 더 싸게 달성하는 방법**이지 표현의 성격을 바꾸는 방법이 아니다.'
],

links:[
 {t:'arXiv 2303.15343 — Sigmoid Loss for Language Image Pre-Training', u:'https://arxiv.org/abs/2303.15343'},
 {t:'google-research/big_vision — SigLIP 공식 구현과 체크포인트', u:'https://github.com/google-research/big_vision'},
 {t:'Hugging Face Transformers — SigLIP 모델 문서', u:'https://huggingface.co/docs/transformers/model_doc/siglip'}
]
});
