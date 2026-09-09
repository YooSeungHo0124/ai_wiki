WIKI.paper({
slug:'simclr',
venue:'ICML 2020',
authors:'Chen, Kornblith, Norouzi, Hinton (Google Brain)',
arxiv:'2002.05709',

tldr:'같은 이미지를 두 번 서로 다르게 변형한 뒤 "이 둘은 같은 것"이라고 맞추는 것만으로 라벨 없이 표현을 배운다. 특별한 구조 없이 **augmentation 조합 · projection head · 큰 배치** 세 가지만 제대로 갖추면 지도학습 [ResNet-50](#/p/resnet)과 같은 정확도에 도달한다는 것을 보였다.',

context:'2019년까지 자기지도 학습은 "pretext task"의 시대였다. 이미지를 9조각 내서 순서 맞히기, 회전 각도 맞히기, 흑백 이미지 채색하기 — 사람이 손으로 설계한 퍼즐을 풀게 하고 그 부산물로 표현을 얻는 방식이었다. 문제는 이 퍼즐들이 대체로 얄팍했다는 것이다. 모델은 종종 퍼즐 자체의 지름길(조각 경계의 색 연속성 같은 것)을 찾아냈고, 지도학습 대비 [ImageNet](#/p/imagenet) 선형 평가 정확도는 한참 뒤처졌다. 한편 대조학습(contrastive learning) 계열은 개념은 오래됐지만 CPC·CMC·[MoCo](#/p/moco) 등 구현마다 메모리 뱅크·클러스터링 같은 부품이 덧붙어 무엇이 실제로 성능을 만드는지 불분명했다. 이 논문의 태도는 정반대다 — **특수 부품을 전부 걷어내고**, 무엇이 남아야 하는지를 통제된 ablation으로 하나씩 재본다.',

ideas:[
 {h:'프레임 자체는 4줄이다',
  lead:'두 뷰를 인코더와 head에 통과시켜 서로를 찾게 하는 손실만 건다.',
  d:'이미지 하나에서 두 개의 뷰 $\\tilde{x}_i, \\tilde{x}_j$ 를 뽑고 → 인코더 $f$(ResNet)로 표현 $h$ 를 얻고 → projection head $g$(MLP)로 $z$ 로 보내고 → 배치 안에서 이 둘이 서로를 찾아내게 하는 손실을 건다. 메모리 뱅크도, 큐도, 특수한 아키텍처도 없다. 남는 것은 **어떤 변형을 쓸 것인가**와 **negative를 어디서 구할 것인가** 두 질문뿐이다.'},
 {h:'augmentation은 하나가 아니라 "조합"이 문제다',
  lead:'crop과 color distortion을 함께 써서 색 히스토그램 지름길을 막는다.',
  d:'논문의 가장 값진 ablation이다. 변형을 하나씩 켜보면 어떤 것도 단독으로는 신통치 않은데, **random crop + color distortion** 두 개를 겹쳤을 때 성능이 급격히 뛴다. 이유가 선명하다 — crop만 쓰면 같은 이미지에서 잘라낸 두 조각은 **색 히스토그램이 거의 동일**해서, 모델이 의미를 이해할 필요 없이 색 분포만 대조해도 정답을 맞힐 수 있다. color distortion은 이 지름길을 막아버린다. 즉 augmentation 설계란 "다양성 추가"가 아니라 **모델이 쓸 수 있는 값싼 단서를 차단하는 일**이다.'},
 {h:'projection head: 손실을 거는 지점과 쓰는 지점을 분리한다',
  lead:'손실은 head 출력 z에 걸고, 실제로 쓰는 표현은 그 앞단 h에 남긴다.',
  d:'대조 손실은 $h$ 가 아니라 그 뒤에 붙인 2층 MLP $g(h)=W_2\\,\\sigma(W_1 h)$ 의 출력 $z$ 에 건다. 그리고 downstream에서는 $z$ 를 버리고 **$h$ 를 쓴다.** 대조 손실은 변형에 불변인 표현을 강요하므로, 손실이 직접 닿는 층은 색·방향·크기 정보를 지워버릴 수밖에 없다. head를 한 겹 끼우면 그 정보 삭제가 head 안에서 일어나고 $h$ 에는 정보가 더 남는다. 실제로 $h$ 로 회전 각도나 색 변형 종류를 훨씬 잘 복원할 수 있다. 이 "손실용 표현 ≠ 사용할 표현" 분리는 이후 [MoCo](#/p/moco) v2·[BYOL](#/p/byol)·[DINO](#/p/dino)가 전부 이어받는다.'},
 {h:'negative는 같은 배치의 나머지 전부다 — 그래서 배치가 커야 한다',
  lead:'배치 안 나머지 전부를 negative로 써서 배치가 클수록 성능이 오른다.',
  d:'배치에 $N$ 장을 넣으면 뷰는 $2N$ 개가 되고, 각 뷰에게 나머지 $2N-2$ 개가 모두 negative가 된다. 별도의 negative 저장소가 없다는 것이 이 논문의 단순함이자 약점이다. 배치 256에서는 negative가 510개뿐이라 성능이 낮고, **4096까지 키우면 8190개**가 되면서 크게 좋아진다. 게다가 큰 배치는 학습 초기가 불안정해 LARS 옵티마이저와 warm-up이 필요했다. 즉 SimCLR의 성능은 **TPU를 몇 개 붙일 수 있는가**와 직결된다 — 이 제약을 정면으로 푼 것이 [MoCo](#/p/moco)다.'},
 {h:'자기지도는 더 오래, 더 크게 학습할수록 이득이 커진다',
  lead:'라벨 병목이 없어 에폭과 모델 크기를 키울수록 상대 이득이 계속 늘어난다.',
  d:'지도학습과 달리 학습 에폭을 늘리고 모델 폭을 넓힐수록 자기지도의 상대적 이득이 계속 커진다. 라벨이라는 병목이 없으니 데이터를 무한히 재활용할 수 있기 때문이다. 이 관찰은 "표현 학습은 스케일 문제"라는 방향을 시각 분야에 각인시켰고, 3년 뒤 [DINOv2](#/p/dinov2)에서 그대로 실현된다.'}
],

figures:[
 {f:'fig1-accuracy-vs-params.png',
  cap:'x축은 모델 파라미터 수(즉 계산량), y축은 ImageNet linear evaluation 정확도. 빨간 별(SimCLR)이 같은 파라미터 수에서 다른 자기지도 방법(파란 점)보다 전부 위에 있고, 폭을 4배 키운 SimCLR(4x)는 지도학습(회색 X, ResNet-50)까지 넘어선다. 이 그래프 한 장이 "특수한 구조나 메모리 뱅크 없이도 단순한 대조학습만으로 SOTA를 갱신했다"는 논문의 주장을 요약한다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-framework.png',
  cap:'맨 아래 이미지 $x$에서 서로 다른 두 augmentation $t, t\'$를 적용해 만든 $\\tilde{x}_i, \\tilde{x}_j$(같은 이미지의 두 "view")가 이 프레임워크의 유일한 입력이다. 같은 인코더 $f(\\cdot)$를 통과시켜 얻은 $h_i, h_j$가 대조학습에 쓰일 표현이고, 그 위에 얹은 작은 projection head $g(\\cdot)$가 $z_i, z_j$를 만들어 "Maximize agreement"(맨 위 화살표)로 손실을 건다. 학습이 끝나면 $g(\\cdot)$는 버리고 $h$만 downstream에 쓴다는 것이 그림에는 안 나오지만 캡션이 밝히는 핵심.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'We show that (1) composition of data augmentations plays a critical role in defining effective predictive tasks, (2) introducing a learnable nonlinear transformation between the representation and the contrastive loss substantially improves the quality of the learned representations.',
  src:'Abstract, p.1'}
],

diagram:{type:'flow', cap:'SimCLR 한 스텝. 학습이 끝나면 오른쪽 두 상자(head와 손실)는 통째로 버리고, 인코더 출력 h만 downstream으로 가져간다.',
 nodes:[
  {t:'이미지 1장', s:'배치 N=4096'},
  {t:'2가지 변형', s:'crop + color + blur', acc:true},
  {t:'인코더 f', s:'ResNet-50 → h (2048d)'},
  {t:'projection g', s:'MLP → z (128d)'},
  {t:'NT-Xent', s:'negative 2N-2개'}
 ]},

math:[
 {expr:'sim(u, v) = uᵀv / (‖u‖ ‖v‖)',
  tex:'\\text{sim}(u,v) = \\dfrac{u^\\top v}{\\lVert u\\rVert\\,\\lVert v\\rVert}',
  d:'표현을 단위 구면에 올린 뒤 코사인 유사도로 잰다. L2 정규화를 빼면 벡터 크기로 손실을 낮추는 지름길이 생겨 성능이 떨어진다.'},
 {expr:'ℓ(i,j) = −log[ exp(sim(z_i, z_j)/τ) / Σ_{k≠i} exp(sim(z_i, z_k)/τ) ]',
  tex:'\\ell(i,j) = -\\log\\frac{\\exp(\\text{sim}(z_i,z_j)/\\tau)}{\\sum_{k\\neq i}\\exp(\\text{sim}(z_i,z_k)/\\tau)}',
  d:'NT-Xent(normalized temperature-scaled cross entropy). 형태는 **$2N-1$ 개 중 정답 하나를 고르는 분류 문제**의 cross-entropy와 정확히 같다. 온도 $\\tau$ 는 분포의 날카로움을 조절하는데, 크면 어려운 negative를 구분하지 못하고 작으면 학습이 불안정해진다. 논문은 0.1 부근을 쓴다.'}
],

numbers:[
 {k:'ImageNet 선형 평가 top-1', v:'76.5%', d:'ResNet-50(4×). 이전 SOTA 대비 **상대 7% 개선**이며 지도학습 ResNet-50과 동급'},
 {k:'ResNet-50 (1×) top-1', v:'69.3%', d:'같은 백본으로 비교했을 때의 값. 1년 뒤 [BYOL](#/p/byol)이 74.3%로 넘어선다'},
 {k:'라벨 1%만 사용', v:'top-5 85.8%', d:'라벨을 **100배 적게** 쓰고도 [AlexNet](#/p/alexnet)을 능가'},
 {k:'배치 크기', v:'4096', d:'뷰 8192개 → 쌍마다 negative 8190개. 배치 256 대비 뚜렷하게 높음'},
 {k:'projection head', v:'2층 MLP → 128d', d:'downstream에는 head 출력이 아니라 그 **입력** $h$(2048d)를 쓴다'}
],

impact:'"복잡한 pretext task를 설계해야 한다"는 전제가 무너졌다. 필요한 것은 잘 고른 변형 조합과 충분한 negative뿐이었고, 자기지도 표현이 처음으로 지도학습과 같은 선을 밟았다. 동시에 이 논문은 **대조학습의 계산 비용 구조**를 드러냈다 — 성능이 배치 크기에 붙어 있다는 사실이 이후 2년간 자기지도 연구의 중심 문제가 된다. 그 문제에 대한 답이 두 방향으로 갈렸다. 하나는 negative를 싸게 조달하는 [MoCo](#/p/moco), 다른 하나는 negative 자체를 없애버리는 [BYOL](#/p/byol)이다. 한편 "두 뷰를 임베딩 공간에서 붙인다"는 이 골격은 뷰를 이미지·텍스트로 바꾸는 순간 그대로 [CLIP](#/p/clip)이 된다.',

legacy:[
 '**negative 조달 문제** — 배치 의존성을 큐로 푼 [MoCo](#/p/moco), negative를 아예 제거한 [BYOL](#/p/byol)/[DINO](#/p/dino)로 갈라짐',
 '**멀티모달로 이식** — 두 뷰를 (이미지, 캡션) 쌍으로 바꾼 것이 [CLIP](#/p/clip), 손실을 softmax에서 sigmoid로 바꿔 배치 제약을 푼 것이 [SigLIP](#/p/siglip)',
 '**대조 대신 복원** — 같은 시기 [MAE](#/p/mae)는 뷰 비교 대신 마스킹 복원으로 방향을 틀었고, [DINOv2](#/p/dinov2)에서 두 계열이 합류한다',
 '**projection head 관행** — 손실을 거는 층과 실제로 쓰는 층을 분리하는 설계가 표현학습의 기본 문법으로 정착'
],

pitfalls:[
 '**downstream에서 $z$ 를 쓰면 성능이 떨어진다.** projection head는 학습이 끝나면 버리는 부품이고, 전이에 쓰는 것은 그 앞의 $h$ 다. 구현할 때 가장 자주 나오는 실수다.',
 '**"배치만 키우면 된다"가 아니다.** 배치를 늘리면 LARS·warm-up·긴 스케줄이 함께 따라와야 하고, 그냥 SGD로 4096을 돌리면 발산한다. 소규모 GPU 환경에서 SimCLR를 그대로 재현하기 어려운 진짜 이유는 여기에 있다.',
 '**augmentation은 도메인마다 다시 설계해야 한다.** color distortion이 핵심인 것은 자연 이미지에서 색이 값싼 지름길이기 때문이다. 의료·위성 영상처럼 색 자체가 진단 신호인 도메인에서는 같은 레시피가 오히려 정보를 지운다.'
],

links:[
 {t:'arXiv 2002.05709 — A Simple Framework for Contrastive Learning of Visual Representations', u:'https://arxiv.org/abs/2002.05709'},
 {t:'google-research/simclr (공식 구현)', u:'https://github.com/google-research/simclr'},
 {t:'Advancing Self-Supervised and Semi-Supervised Learning with SimCLR (Google Research Blog)', u:'https://research.google/blog/advancing-self-supervised-and-semi-supervised-learning-with-simclr/'}
]
});
