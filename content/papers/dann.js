WIKI.paper({
slug:'dann',
venue:'JMLR 17 (2016) 1-35 · 원 아이디어는 ICML 2015',
authors:'Ganin, Ustinova, Ajakan, Germain, Larochelle, Laviolette, Marchand, Lempitsky (Skoltech · INRIA · Univ. Rouen · Univ. Montreal)',
arxiv:'1505.07818',

tldr:'특징 추출기와 도메인 판별기를 **하나의 역전파 안에서** 적대적으로 학습시켜, 소스·타깃 도메인을 구분할 수 없는 표현을 만드는 방법. 판별기로 가는 그래디언트의 부호만 뒤집는 층 하나로 이것을 구현했다.',

context:'2015년 무렵 딥러닝은 학습 분포와 테스트 분포가 같다는 가정 위에서 잘 작동했지만, 실제로는 **소스 도메인(레이블 있음)과 타깃 도메인(레이블 없음)이 다른 분포**를 갖는 경우가 흔했다(합성 이미지→실제 사진, 리뷰 장르 A→B). 기존 도메인 적응 이론은 "두 도메인을 구분하는 분류기가 정확도를 낼 수 없을 만큼 특징이 비슷해야 한다"는 경계를 제시했지만, 이를 딥러닝에 넣으려면 보통 두 단계 최적화(특징 학습 후 도메인 거리 측정)가 필요했다. 이 논문의 질문은 단순하다 — **도메인 판별기 자체를 신경망 안에 넣고, 그 판별기를 속이는 방향으로 특징 추출기를 직접 학습시킬 수 없는가?**',

ideas:[
 {h:'그래디언트 반전 층(GRL)',
  lead:'순전파는 항등함수, 역전파는 부호만 뒤집는 층 하나로 적대적 학습을 SGD에 끼워 넣는다.',
  d:'특징 추출기 $G_f$ 뒤에 도메인 분류기 $G_d$ 를 붙이되, 둘 사이에 GRL을 넣는다. 순전파 때 GRL은 입력을 그대로 통과시키고, 역전파 때는 들어온 그래디언트에 $-\\lambda$ 를 곱해 되돌려준다. 그 결과 $G_d$ 는 도메인을 더 잘 맞히려고 $\\theta_d$ 를 갱신하지만, 그 손실이 $G_f$ 로 전달될 때는 **부호가 뒤집혀** $\\theta_f$ 가 오히려 도메인 판별을 어렵게 만드는 방향으로 갱신된다. 파라미터도, 추가 최적화 루프도 없는 층 하나로 min-max를 표준 SGD로 바꿔치기한 것이 핵심 트릭이다.'},
 {h:'saddle point로서의 도메인 적대 학습',
  lead:'레이블 예측은 최소화, 도메인 예측은 최대화하는 하나의 목적함수를 동시에 푼다.',
  d:'전체 목적함수 하나에 레이블 손실 $L_y$ 와 도메인 손실 $L_d$ 를 함께 넣고, $\\theta_f,\\theta_y$ 는 이를 최소화하며 $\\theta_d$ 는 최대화하는 안장점(saddle point)을 찾는다. $\\theta_f$ 의 갱신식에서 두 손실의 그래디언트가 **더해지지 않고 빼진다**는 점이 결정적이다 — 그냥 더하면 SGD는 오히려 두 도메인을 더 잘 구분하도록 특징을 벌려놓게 된다.'},
 {h:'얕은 버전과 깊은 버전을 같은 틀로',
  lead:'단일 은닉층 신경망부터 CNN까지, 임의의 순전파 구조에 GRL만 꽂으면 된다.',
  d:'논문은 먼저 은닉층 하나짜리 얕은 DANN으로 이론(도메인 간 $\\mathcal{H}$-divergence 상계)을 세우고, 곧바로 임의의 깊은 아키텍처로 일반화한다. $G_f,G_y,G_d$ 를 각각 파라미터화된 함수로만 취급하므로 CNN이든 단어 임베딩 MLP든 그대로 붙는다. 이 일반성 덕분에 이미지 분류와 문서 감성 분류(아마존 리뷰) 양쪽에서 같은 방법을 검증한다.'},
 {h:'타깃 레이블 없이 학습한다',
  lead:'타깃 도메인은 이미지(또는 문서)만 쓰고 레이블은 전혀 쓰지 않는 비지도 적응이다.',
  d:'$L_y$ 는 레이블이 있는 소스 표본에서만, $L_d$ 는 소스·타깃 표본 전부에서(도메인 라벨은 "어느 데이터셋에서 왔는가"이므로 공짜로 있다) 계산한다. 학습이 끝나면 소스에서 학습한 $G_y$ 를 타깃에도 그대로 쓴다 — 도메인 불변 특징이라는 가정이 성립하는 한 별도의 타깃 분류기가 필요 없다.'}
],

diagram:{type:'flow', cap:'입력 하나가 세 갈래로 간다 — 레이블 예측(정방향), 도메인 예측(정방향), 그리고 그 사이의 GRL(역방향에서만 부호 반전).',
 nodes:[
  {t:'입력 x', s:'소스 또는 타깃'},
  {t:'특징 추출기', s:'G_f(x;θf)', acc:true},
  {t:'레이블 예측기', s:'G_y → 클래스 y', a:'정방향'},
  {t:'GRL', s:'순전파=항등, 역전파=×(−λ)'},
  {t:'도메인 분류기', s:'G_d → 소스/타깃', a:'역전파 반전'}
 ]},

math:[
 {expr:'R(x) = x,   dR/dx = −I',
  tex:'R(x) = x, \\qquad \\frac{dR}{dx} = -I',
  d:'GRL을 순전파·역전파가 다른 "가짜 함수"로 정의한 식. 순전파에서는 항등, 역전파에서는 야코비안이 $-I$ 이다.'},
 {expr:'E(θf, θy, θd) = (1/n)Σ Lʸ − λ(1/n)Σ Lᵈ(소스) − λ(1/N′)Σ Lᵈ(타깃),   (θ̂f, θ̂y)=argmin E,  θ̂d=argmax E',
  tex:"\\begin{aligned}E(\\theta_f,\\theta_y,\\theta_d) &= \\frac{1}{n}\\sum_{i=1}^{n} L_y^{i}(\\theta_f,\\theta_y) - \\lambda\\left(\\frac{1}{n}\\sum_{i=1}^{n} L_d^{i}(\\theta_f,\\theta_d) + \\frac{1}{N'}\\sum_{i=n+1}^{N} L_d^{i}(\\theta_f,\\theta_d)\\right)\\\\ (\\hat\\theta_f,\\hat\\theta_y) &= \\operatorname*{argmin}_{\\theta_f,\\theta_y} E(\\theta_f,\\theta_y,\\hat\\theta_d), \\qquad \\hat\\theta_d = \\operatorname*{argmax}_{\\theta_d} E(\\hat\\theta_f,\\hat\\theta_y,\\theta_d)\\end{aligned}",
  d:'DANN이 실제로 풀려는 min-max 목적함수. $\\lambda$ 는 두 손실의 상대적 비중을 정하는 스칼라로, 학습 중 서서히 키워가며 도메인 판별기의 영향력을 늘린다.'},
 {expr:'θf ← θf − µ(∂Lʸ/∂θf − λ ∂Lᵈ/∂θf)',
  tex:'\\theta_f \\leftarrow \\theta_f - \\mu\\!\\left(\\frac{\\partial L_y^{i}}{\\partial \\theta_f} - \\lambda \\frac{\\partial L_d^{i}}{\\partial \\theta_f}\\right)',
  d:'GRL이 구현하는 실제 SGD 갱신식. 도메인 손실의 그래디언트가 **빼지는** 부호가 핵심 — 그냥 더하면 특징이 도메인별로 더 잘 갈라지는 방향으로 학습된다.'}
],

numbers:[
 {k:'Office-31 · Amazon→Webcam', v:'73.0%', d:'source only 64.2% 대비 개선. 당시 GFK·DLID·DDC·DAN을 모두 앞섬'},
 {k:'Office-31 · DSLR→Webcam', v:'96.4%', d:'source only 96.1%에서 소폭 개선 — 이미 쉬운 shift'},
 {k:'MNIST→MNIST-M', v:'76.66%', d:'source only 52.25% 대비 gap의 52.9% 해소(target-only 상한 95.96%)'},
 {k:'SVHN→MNIST', v:'73.85%', d:'source only 54.90% 대비 gap의 42.6% 해소'},
 {k:'Syn Numbers→SVHN', v:'91.09%', d:'source only 86.74% 대비 gap의 79.7% 해소 — 다섯 shift 중 가장 큰 개선률'},
 {k:'GRL 추가 비용', v:'파라미터 0개', d:'층 자체는 학습 가능한 파라미터가 없다 — 순전파 항등, 역전파 부호 반전뿐'}
],

impact:'DANN은 도메인 적응을 "표현 정렬을 어떻게 구현할 것인가"의 공학 문제로 축소시켰다. 이후 나온 수많은 방법이 GRL 자체를 쓰거나(직접 계승), GRL이 만든 적대적 min-max 틀을 다른 손실로 바꿔치기한다(대비 대상). [ADDA](#/p/adda)는 이 틀을 "생성/판별 · 가중치 공유 · 손실 선택"의 세 축으로 정리해 DANN을 그 특수 사례 중 하나로 배치했고, [TENT](#/p/tent)는 아예 소스 데이터 없이 같은 도메인 적응 문제를 시험 시점에서 풀어낸다. 실무적으로도 GRL은 `torch.autograd.Function` 하나로 구현할 수 있을 만큼 간단해, 도메인 적응 외에도 "그래디언트를 반대로 흘려 어떤 정보를 지운다"는 아이디어 자체가 공정성·프라이버시 연구로 퍼졌다.',

legacy:[
 '**적대적 판별기 계열** — [ADDA](#/p/adda)가 DANN의 구조를 일반 프레임워크로 정리하고 비대칭 가중치를 도입',
 '**픽셀+특징 결합** — [CyCADA](#/p/cycada)가 DANN의 특징 정렬에 CycleGAN 기반 픽셀 변환을 더함',
 '**시험시 적응으로의 전환** — [TENT](#/p/tent)는 DANN이 전제하는 "소스+타깃 동시 학습"을 버리고 타깃만으로 적응',
 '**적대적 정보 제거 일반화** — GRL 아이디어가 공정성(민감 속성 제거)·도메인 불변 강화학습 등으로 확산'
],

pitfalls:[
 '**arXiv 1505.07818은 JMLR 2016 확장판이다.** ICML 2015 원논문(별도 arXiv ID 1409.7495)과 실험·이론 서술이 다르며, 이 노트의 수치·수식은 JMLR판 기준이다.',
 '**GRL은 GAN이 아니다.** 판별기가 별도로 수렴하는 두 단계 학습이 아니라, 하나의 SGD 루프 안에서 부호만 반전된 그래디언트로 동시에 갱신된다 — 모드 붕괴 같은 GAN 특유의 문제와는 다른 종류의 불안정성(과도한 $\\lambda$ 로 인한 발산)을 겪는다.',
 '**$\\lambda$ 스케줄링이 성능을 좌우한다.** 논문은 학습 초반 $\\lambda$ 를 0에 가깝게 두고 점차 키우는 스케줄을 쓴다 — 처음부터 크게 주면 특징 추출기가 태스크를 배우기도 전에 판별기에 휘둘린다.'
],

figures:[
 {f:'fig1-grl.png',
  cap:'초록 블록이 특징 추출기 $G_f$, 파란 블록이 레이블 예측기 $G_y$, 빨간 블록이 도메인 분류기 $G_d$. $G_f$ 와 $G_d$ 사이의 "gradient reversal layer" 화살표가 순전파(회색)와 역전파(반전된 $-\\lambda\\,\\partial L_d/\\partial\\theta_f$)를 다른 경로로 그린 부분이 이 논문의 전부다.',
  src:'원문 Figure 1, p.12'}
],

quotes:[
 {t:'We show that this adaptation behaviour can be achieved in almost any feed-forward model by augmenting it with few standard layers and a new gradient reversal layer.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1505.07818 — Domain-Adversarial Training of Neural Networks', u:'https://arxiv.org/abs/1505.07818'},
 {t:'JMLR 17 (2016) — published version', u:'https://www.jmlr.org/papers/v17/15-239.html'}
]
});
