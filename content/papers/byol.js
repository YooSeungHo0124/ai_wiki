WIKI.paper({
slug:'byol',
venue:'NeurIPS 2020',
authors:'Grill, Strub, Altché, Tallec, Richemond et al. (DeepMind · Imperial College London)',
arxiv:'2006.07733',

tldr:'negative sample을 **하나도 쓰지 않고** 자기지도 표현을 학습한다. 온라인 네트워크가 자기 자신의 이동평균(target network)의 출력을 예측하게 하는 것뿐인데, 모든 표현이 한 점으로 뭉개지는 붕괴(collapse)가 일어나지 않고 [SimCLR](#/p/simclr)를 크게 앞선다.',

context:'2020년 상반기까지 대조학습의 상식은 명확했다 — positive끼리 당기는 항만 있으면 모델은 **모든 입력에 같은 상수 벡터를 뱉는 자명해**로 도망치므로(손실 0의 완벽한 최적해), negative를 밀어내는 항이 반드시 필요했고 문제는 그것을 어떻게 싸게 많이 조달하느냐였다. [SimCLR](#/p/simclr)는 배치를 4096까지 키웠고 [MoCo](#/p/moco)는 65536짜리 큐를 돌렸지만, 같은 클래스의 다른 이미지도 무조건 negative로 밀어내야 하고(false negative) 성능이 augmentation 설계와 배치 크기에 민감하게 붙는 부작용이 있었다. BYOL은 여기서 상식을 정면으로 부정한다 — **밀어내는 항을 통째로 삭제한다.** 논문 제목의 "bootstrap"은 부트스트랩 통계가 아니라 강화학습에서 쓰는 의미로, 아직 부정확한 자기 추정치를 목표로 삼아 조금씩 개선해 나가는 것을 가리킨다.',

ideas:[
 {h:'비대칭 두 네트워크: online과 target',
  lead:'online은 학습되고 target은 online의 이동평균일 뿐인 두 네트워크를 둔다.',
  d:'같은 구조의 네트워크 두 벌을 둔다. **online** $\\theta$ 는 gradient로 학습하고, **target** $\\xi$ 는 학습하지 않고 online의 지수이동평균으로만 갱신된다. 한 이미지의 뷰 $v$ 를 online이, 다른 뷰 $v\'$ 를 target이 처리한 뒤, online이 target의 출력을 **예측**하게 한다. 손실은 두 정규화 벡터의 MSE 하나뿐이고 밀어내는 항은 없다.'},
 {h:'predictor: 대칭을 깨는 한 층',
  lead:'online 쪽에만 predictor를 더해 두 경로를 비대칭으로 만들어 붕괴를 막는다.',
  d:'online 쪽에만 projector 뒤에 predictor $q_\\theta$ 를 하나 더 붙인다. 이 비대칭이 붕괴를 막는 결정적 장치다. 양쪽이 완전히 대칭이면 두 네트워크가 같은 상수를 뱉는 것이 곧바로 최적해지만, online은 target을 **예측**해야 하는 추가 부담을 진다. predictor를 제거하면 실험에서 성능이 즉시 무너진다 — **predictor 제거와 EMA 제거 중 하나만 해도 붕괴한다.**'},
 {h:'stop-gradient: 목표는 움직이되 끌려오지 않는다',
  lead:'target 경로에는 gradient를 흘리지 않아 목표가 손실을 따라 움직이지 못하게 한다.',
  d:'target 쪽 경로로는 gradient가 흐르지 않는다($\\text{sg}$). 만약 흐르게 두면 target도 함께 손실을 낮추는 방향으로 움직여, 두 네트워크가 서로에게 다가가 상수해로 수렴한다. stop-gradient는 target을 **그 순간 고정된 회귀 목표**로 만들고, EMA는 그 목표가 스텝마다 조금씩만 바뀌도록 한다. 즉 BYOL은 매 스텝 "느리게 움직이는 목표를 향한 회귀 문제"를 푸는 셈이고, 이 구조는 강화학습의 target network와 정확히 같은 발상이다.'},
 {h:'왜 붕괴하지 않는가 — 논문도 완전히는 답하지 못한다',
  lead:'target이 online보다 살짝 뒤처져 있어 online이 계속 그보다 조금 나아진다는 설명이다.',
  d:'논문의 설명은 이렇다 — target은 online의 과거 이동평균이므로 online보다 항상 조금 뒤처져 있고, online은 그 목표를 맞추면서 **target보다 아주 조금 더 나은** 표현을 만든다. 그 개선이 EMA를 통해 target으로 다시 흘러들어가 목표를 한 단계 올리고, 이 되먹임이 표현을 계속 밀어 올린다. 다만 상수해도 여전히 손실의 최적해라는 사실은 변하지 않으며, 왜 경사하강이 그 해로 가지 않는지는 이후 SimSiam·DirectPred 등 여러 후속 논문이 분석한 미해결에 가까운 문제로 남았다.'},
 {h:'negative가 없으니 배치와 augmentation에 덜 민감해진다',
  lead:'negative를 배치에서 뽑지 않으므로 배치 크기·색 augmentation 의존도가 크게 줄어든다.',
  d:'실용적으로 가장 큰 이득이다. negative가 배치에서 오지 않으므로 배치를 4096에서 256으로 줄여도 성능 저하가 SimCLR보다 훨씬 작다. augmentation 목록에서 color distortion을 빼면 SimCLR는 크게 무너지는데 BYOL은 완만하게 떨어진다. 대조학습의 성능이 사실은 "negative가 색 히스토그램으로 구분되지 않게 막는 일"에 상당 부분 의존했음을 역으로 보여준 결과다.'}
],

diagram:{type:'loop', cap:'BYOL의 부트스트랩 루프. 끊어야 할 곳(stop-gradient)과 느리게 이어야 할 곳(EMA)이 이 구조의 전부다.',
 center:'매 스텝 반복',
 nodes:[
  {t:'online 경로', s:'v → f_θ → g_θ → q_θ'},
  {t:'target 경로', s:'v\' → f_ξ → g_ξ'},
  {t:'MSE 손실', s:'대칭화된 예측-목표 거리'},
  {t:'θ만 SGD 갱신', s:'ξ는 gradient 없음'},
  {t:'EMA 업데이트', s:'τ: 0.996 → 1'}
 ]},

math:[
 {expr:'L = ‖ q_θ(z_θ)/‖q_θ(z_θ)‖ − z_ξ\'/‖z_ξ\'‖ ‖²  =  2 − 2·cos(q_θ(z_θ), z_ξ\')',
  tex:'\\mathcal{L}_\\theta=\\left\\|\\frac{q_\\theta(z_\\theta)}{\\|q_\\theta(z_\\theta)\\|}-\\frac{z_\\xi\'}{\\|z_\\xi\'\\|}\\right\\|^2=2-2\\cdot\\cos\\!\\left(q_\\theta(z_\\theta),\\,z_\\xi\'\\right)',
  d:'정규화한 두 벡터의 제곱거리는 코사인 유사도의 단조 감소 함수다. 즉 손실은 **방향을 맞추라**는 요구 하나뿐이고, 어떤 것도 밀어내지 않는다. 두 뷰의 역할을 바꿔 한 번 더 계산해 더한다(대칭화).'},
 {expr:'ξ ← τ·ξ + (1 − τ)·θ,   τ = 1 − (1 − τ_base)·(cos(πk/K) + 1)/2',
  tex:'\\begin{aligned}\\xi &\\leftarrow \\tau\\xi+(1-\\tau)\\theta\\\\ \\tau &= 1-(1-\\tau_{base})\\cdot\\frac{\\cos(\\pi k/K)+1}{2}\\end{aligned}',
  d:'target의 감쇠율 $\\tau$ 는 고정이 아니라 $\\tau_{base}=0.996$ 에서 시작해 학습이 끝날 때 1로 코사인 스케줄을 따라 올라간다. 초반에는 목표가 비교적 빠르게 따라오고, 후반으로 갈수록 얼어붙어 안정적인 회귀 목표가 된다.'}
],

numbers:[
 {k:'ImageNet 선형 평가 top-1', v:'74.3%', d:'ResNet-50. [SimCLR](#/p/simclr)의 69.3%를 **+5.0%p** 앞선다'},
 {k:'더 큰 백본', v:'79.6%', d:'ResNet-200(2×). 당시 자기지도 최고 기록'},
 {k:'target 감쇠율 τ_base', v:'0.996', d:'코사인 스케줄로 1까지 증가. $\\tau=1$(고정 target)이나 $\\tau=0$(즉시 복사) 양극단은 모두 실패'},
 {k:'학습 규모', v:'배치 4096 · TPU v3 512코어', d:'ResNet-50 기준 약 8시간'},
 {k:'negative 개수', v:'0', d:'이 논문의 요점 전체가 이 칸에 있다'}
],

figures:[
 {f:'fig2-architecture.png',
  cap:'위(파란) 줄이 online 네트워크, 아래(빨간) 줄이 target 네트워크. 같은 이미지 x에서 서로 다른 증강 t, t\'로 만든 두 view가 각각 들어가 encoder(f)·projector(g)를 거치는데, online 쪽에만 predictor(q)가 하나 더 붙는다. loss는 online의 예측 q_θ(z_θ)가 target의 출력 sg(z\')를 맞히도록 계산되고, target 쪽은 stop-gradient(sg 표시)로 역전파가 차단된다 — 이 비대칭(predictor 유무 + stop-gradient)이 negative pair 없이도 붕괴를 막는 장치다.',
  src:'원문 Figure 2, p.4'},
 {f:'fig1-scaling-curve.png',
  cap:'x축은 파라미터 수(로그 스케일), y축은 ImageNet 선형 평가 top-1 정확도. 빨간 선(BYOL)이 회색 점으로 표시된 SimCLR·MoCo·CPC 등 기존 대조학습 계열보다 같은 파라미터 수에서 항상 위에 있고, 파란 선(지도학습, Sup.)에 거의 붙는다 — negative 없이도 대조학습을 능가하고 지도학습에 근접한다는 것이 이 그래프의 주장.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'While state-of-the art methods rely on negative pairs, BYOL achieves a new state of the art without them.',
  src:'Abstract, p.1'},
 {t:'We hypothesize that there is no loss $L_{\\theta,\\xi}$ such that BYOL\'s dynamics is a gradient descent on $L$ jointly over $\\theta,\\xi$.',
  src:'Section 3.2, p.4'}
],

impact:'"대조학습에는 negative가 필수"라는 전제를 깨뜨렸고, 자기지도 학습의 문제 설정 자체를 바꿨다. 질문이 **"negative를 어떻게 조달하는가"**에서 **"붕괴를 무엇이 막고 있는가"**로 이동했으며, 그 답으로 비대칭 predictor·stop-gradient·EMA target이라는 세 부품이 표준 도구가 되었다. 곧이어 SimSiam이 EMA조차 없어도(predictor + stop-gradient만으로) 붕괴하지 않음을 보이면서 붕괴 방지의 최소 조건을 더 좁혔고, Barlow Twins·VICReg는 아예 표현의 공분산 구조를 제약하는 다른 갈래를 열었다. 그리고 BYOL의 골격에 백본을 [ViT](#/p/vit)로 갈아끼우고 출력을 확률분포로 바꾼 것이 곧 [DINO](#/p/dino)다.',

legacy:[
 '**[DINO](#/p/dino)** — BYOL의 online/target을 student/teacher로 재해석하고 MSE 대신 분포 간 cross-entropy + centering/sharpening을 쓰면서 [ViT](#/p/vit)의 창발적 attention 맵을 발견',
 '**SimSiam** — EMA target 없이 stop-gradient와 predictor만으로도 붕괴하지 않음을 보여 최소 조건을 규명',
 '**비대조 계열의 확산** — Barlow Twins·VICReg처럼 negative 대신 특징 차원의 중복/분산을 규제하는 방향이 별도 계열로 자리잡음',
 '**[DINOv2](#/p/dinov2)로의 합류** — 비대조 자기증류가 [MAE](#/p/mae) 계열의 마스킹 목표와 결합해 오늘날 범용 시각 인코더의 학습 레시피가 됨'
],

pitfalls:[
 '**"negative가 없으니 정규화가 필요 없다"는 오해.** BYOL 발표 직후 "BN이 배치 통계를 통해 사실상 암묵적 negative 역할을 한다"는 유명한 반론이 나왔고, DeepMind는 BatchNorm을 GroupNorm + weight standardization으로 대체해도 성능이 유지된다는 후속 실험으로 답했다. BN이 본질은 아니지만, **어떤 형태로든 정규화가 붕괴 방지에 관여한다**는 점은 남았다.',
 '**predictor와 EMA는 옵션이 아니다.** 둘 중 하나만 빼도 표현이 즉시 상수로 붕괴한다. "손실이 잘 떨어진다"는 것이 학습이 잘 되고 있다는 신호가 전혀 아니며, 붕괴 여부는 표현의 분산이나 임베딩 rank를 따로 찍어봐야 알 수 있다.',
 '**손실 값으로 모델을 비교할 수 없다.** 목표(target)가 학습 중 계속 변하는 비정상(non-stationary) 회귀라, 손실 곡선은 서로 다른 설정 간 비교에 아무 의미가 없다. 평가는 반드시 선형 프로브나 k-NN 같은 downstream 지표로 해야 한다.'
],

links:[
 {t:'arXiv 2006.07733 — Bootstrap Your Own Latent: A New Approach to Self-Supervised Learning', u:'https://arxiv.org/abs/2006.07733'},
 {t:'google-deepmind/deepmind-research/byol (공식 구현)', u:'https://github.com/google-deepmind/deepmind-research/tree/master/byol'},
 {t:'arXiv 2010.10241 — BYOL works even without batch statistics', u:'https://arxiv.org/abs/2010.10241'}
]
});
