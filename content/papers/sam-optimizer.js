WIKI.paper({
slug:'sam-optimizer',
venue:'ICLR 2021',
authors:'Foret, Kleiner, Mobahi, Neyshabur (Google Research · Blueshift)',
arxiv:'2010.01412',

tldr:'손실값 하나만 낮추는 대신, **파라미터 주변 이웃 전체의 손실이 고르게 낮은 곳**을 찾도록 목적함수를 바꾼 옵티마이저. "평평한 최소점이 잘 일반화된다"는 오래된 관찰을 실제로 SOTA를 갱신하는 실용적 절차로 만들었다.',

context:'과대매개변수화된 모델은 학습 손실을 0에 가깝게 만드는 지점이 무수히 많고, 그중 어디에 도달하느냐에 따라 일반화 성능이 크게 갈린다. [큰 배치의 함정](#/p/large-batch)은 배치를 키우면 손실 지형이 뾰족한(sharp) 최소점에 수렴하기 쉽고, 이런 지점이 테스트 성능을 해친다는 것을 관찰한 바 있다. 평평한 최소점이 좋다는 가설 자체는 Hochreiter & Schmidhuber(1997)까지 거슬러 올라가지만, 그것을 **직접 최적화 목표로 넣어 실제로 대규모 SOTA 모델에서 개선을 내는** 실용적 절차는 이 논문 이전까지 없었다.',

ideas:[
 {h:'손실값이 아니라 이웃의 최악값을 최소화한다',
  lead:'파라미터 $w$ 대신 반경 $\\rho$ 이웃에서 손실이 가장 큰 점의 손실을 최소화한다.',
  d:'일반화 오차의 상한을 $\\max_{\\|\\epsilon\\|\\le\\rho} L_S(w+\\epsilon)$ 항으로 표현할 수 있다는 이론적 관찰에서 출발한다. 이 최댓값 항이 곧 "그 지점 주변이 얼마나 뾰족한가"를 재는 sharpness다. SAM은 손실값과 sharpness를 **동시에** 최소화하는 min-max 문제로 학습을 재정의한다.'},
 {h:'내부 최대화를 1차 근사로 한 스텝에 푼다',
  lead:'테일러 1차 근사로 최악의 교란 $\\hat\\epsilon(w)$ 를 경사 방향의 닫힌 형태로 구한다.',
  d:'$\\max_{\\|\\epsilon\\|_p\\le\\rho} L_S(w+\\epsilon)$ 는 원래 풀기 어려운 내부 최적화지만, $L_S(w+\\epsilon)$ 를 $\\epsilon=0$ 근처에서 1차 테일러 전개하면 $\\epsilon$ 에 대한 선형함수가 되어 dual norm 문제로 닫힌 형태의 해가 나온다. $p=2$ 인 경우 이는 단순히 현재 경사를 정규화해 길이 $\\rho$ 만큼 키운 것과 같다.'},
 {h:'2차 항을 버려도 잘 작동한다',
  lead:'헤시안이 들어가는 2차 미분 항을 실험적으로 제거해도 성능이 유지된다.',
  d:'$\\hat\\epsilon(w)$ 자체가 $\\nabla_w L_S(w)$ 의 함수이므로 엄밀한 미분에는 헤시안-벡터곱이 등장한다. 저자들은 부록 실험에서 이 2차 항을 포함시키면 오히려 성능이 떨어짐을 확인하고, 최종 알고리즘에서는 $\\nabla_w L_S(w)|_{w+\\hat\\epsilon(w)}$ 만 쓰는 1차 근사를 채택했다 — **적대적 지점에서 한 번 더 그래디언트를 계산**하는 것이 전부다.'},
 {h:'단일 하이퍼파라미터 ρ, 순수 알고리즘 교체',
  lead:'모델 구조를 바꾸지 않고 옵티마이저만 SAM으로 교체하면 된다.',
  d:'ρ(이웃 반경) 하나만 그리드서치로 정하면, 기존 SGD/데이터 증강/정칙화 위에 SAM을 그대로 얹을 수 있다. WideResNet, PyramidNet, EfficientNet 등 이미 정교한 정칙화를 쓰는 SOTA 모델에도 추가 이득을 냈다는 것이 "새 아키텍처가 아니라 최적화 절차의 교체"라는 이 논문의 위치를 만든다.'}
],

diagram:{type:'compare', cap:'기존 최적화는 손실값만 보고, SAM은 이웃 전체의 최악값을 본다.',
 left:{t:'기존: 손실값 최소화', items:['현재 지점의 loss만 봄','뾰족한 최소점에도 수렴 가능','배치가 커질수록 더 뾰족해짐']},
 right:{t:'SAM: 이웃 최악값 최소화', items:['반경 ρ 이웃의 최댓값을 최소화','평평한 최소점으로 유도','역전파 2회로 근사 계산']}},

math:[
 {expr:'min_w  max_{||ε||_p ≤ ρ} L_S(w + ε) + λ||w||²',
  tex:'\\min_{w}\\ \\max_{\\|\\epsilon\\|_p\\le\\rho} L_S(w+\\epsilon)\\;+\\;\\lambda\\|w\\|_2^2',
  d:'SAM의 목적함수. 안쪽 $\\max$ 가 "이 파라미터 주변에서 손실을 가장 나쁘게 만드는 교란"을 찾고, 바깥쪽 $\\min$ 이 그 최악의 경우조차 낮아지도록 $w$ 를 움직인다.'},
 {expr:'ε̂(w) = ρ · sign(∇L_S(w)) |∇L_S(w)|^(q-1) / (‖∇L_S(w)‖_q^q)^(1/p),  1/p + 1/q = 1',
  tex:'\\hat\\epsilon(w)=\\rho\\,\\text{sign}\\!\\big(\\nabla_w L_S(w)\\big)\\,\\big|\\nabla_w L_S(w)\\big|^{q-1}\\Big/\\big(\\|\\nabla_w L_S(w)\\|_q^q\\big)^{1/p}',
  d:'1차 근사로 얻는 최악의 교란. $p=2$ 이면 $\\hat\\epsilon(w)=\\rho\\,\\nabla_w L_S(w)/\\|\\nabla_w L_S(w)\\|_2$ — 현재 경사 방향으로 길이 $\\rho$ 만큼 이동한 지점이다.'},
 {expr:'∇L_SAM(w) ≈ ∇L_S(w) |_{w + ε̂(w)}',
  tex:'\\nabla_w L_S^{SAM}(w)\\approx \\nabla_w L_S(w)\\big|_{w+\\hat\\epsilon(w)}',
  d:'2차 항을 버린 최종 근사. $w+\\hat\\epsilon(w)$(적대적으로 교란된 지점)에서 한 번 더 계산한 경사를 그대로 업데이트에 쓴다 — 결과적으로 순전파·역전파를 배치당 두 번 수행하는 것과 같다.'}
],

numbers:[
 {k:'ImageNet top-1 오류 (ResNet-152)', v:'20.3% → 18.4%', d:'SAM 적용만으로 감소, 구조 변경 없음'},
 {k:'CIFAR-100 (PyramidNet+ShakeDrop)', v:'10.3%', d:'추가 데이터 없이 당시 새 SOTA'},
 {k:'CIFAR-10 (WideResNet)', v:'2.2% → 1.6%', d:'같은 구조에서 옵티마이저만 SAM으로 교체'},
 {k:'EfficientNet-L2 + SAM · ImageNet', v:'top-1 오류 11.39%', d:'파인튜닝에서도 이전 SOTA(ViT, 11.45%) 경신'},
 {k:'계산 비용', v:'역전파 2회/스텝', d:'ε̂(w) 계산용 1회 + 최종 gradient용 1회 — 학습 시간이 대략 2배'},
 {k:'하이퍼파라미터', v:'ρ ∈ {0.01…0.5}', d:'그리드서치로 선택하는 유일한 추가 하이퍼파라미터'}
],

impact:'"평평한 최소점이 좋다"는 이론적 직관을 실제로 대규모 벤치마크에서 SOTA를 갱신하는 **실행 가능한 알고리즘**으로 옮겼다는 점이 핵심이다. 옵티마이저만 바꿔 끼우는 방식이라 기존 정칙화·증강 기법과 독립적으로 결합되며, 라벨 노이즈에 대한 강건성까지 부가적으로 얻는다는 것도 보였다. 다만 대가는 **학습 계산량이 거의 두 배**라는 것이고, 이는 이후 SAM 계열 연구 전체의 핵심 병목이 되었다.',

legacy:[
 '**계산량 절감 계열** — ESAM, LookSAM, SAF 등 역전파 2회를 피하거나 일부 스텝만 SAM을 적용해 오버헤드를 줄이는 후속 연구가 이어짐',
 '**m-sharpness 관찰** — 논문 자체가 미니배치 크기 $m$ 을 줄여 부분집합 단위로 sharpness를 재면 일반화와의 상관이 더 좋아진다는 것을 발견, 이후 sharpness 정의 논쟁의 출발점이 됨',
 '**대형 모델·비전 트랜스포머로 확산** — ViT, MLP-Mixer 학습 레시피에 SAM이 표준 옵션으로 채택됨',
 '**일반화 이론과 실전 최적화를 잇는 사례**로 자주 인용 — [큰 배치의 함정](#/p/large-batch)이 제기한 sharp minima 문제에 대한 최초의 실용적 대응 절차로 자리매김'
],

pitfalls:[
 '**"공짜 점심"이 아니다.** SAM은 배치당 순전파·역전파를 두 번 수행하므로 같은 벽시계 시간 기준으로는 절반의 스텝만 밟는다. 논문 자체도 공정 비교를 위해 SAM이 아닌 베이스라인에 **2배의 에폭**을 허용했다 — 실무에서 "같은 시간에 SAM이 항상 이긴다"고 오해하면 안 된다.',
 '**ρ 하나지만 튜닝이 필요하다.** 데이터셋·모델마다 최적 ρ가 다르며(0.01~0.5 범위), 잘못 고르면 오히려 수렴이 불안정해지거나 이득이 사라진다.',
 '**배치 정규화·분산학습 환경에 민감하다.** m-sharpness 관찰에서 보듯 SAM의 효과는 그래디언트를 계산하는 서브배치 크기에 의존하므로, 멀티 GPU에서 배치를 나누는 방식(논문은 가속기별로 독립 계산 후 평균)이 결과에 영향을 준다.'
],

figures:[
 {f:'fig1-sharpvswide.png',
  cap:'같은 ResNet56을 SGD(왼쪽, 뾰족하고 들쭉날쭉한 손실 지형)와 SAM(오른쪽, 매끈하고 넓은 그릇 모양)으로 각각 학습시켰을 때 수렴한 지점 주변의 손실 지형. 두 그림 다 같은 축척이며, 왼쪽의 좁고 깊은 협곡이 "뾰족한 최소점"이 실제로 어떤 모양인지 보여준다.',
  src:'원문 Figure 1(중간·오른쪽), p.2'},
 {f:'fig2-schematic.png',
  cap:'SAM 한 스텝의 기하학적 그림. 초록 점 $w_{adv}$ 는 현재 경사 방향으로 $\\rho$ 만큼 이동한 "최악의 이웃"이고, 실제 파라미터 업데이트($w_t \\to w_{t+1}^{SAM}$, 파란 화살표)는 그 $w_{adv}$ 에서 계산한 경사를 쓴다 — 일반 SGD 업데이트($w_t \\to w_{t+1}$, 주황 화살표)와 방향이 달라짐에 주목.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'Sharpness-Aware Minimization (SAM)... seeks parameters that lie in neighborhoods having uniformly low loss; this formulation results in a min-max optimization problem on which gradient descent can be performed efficiently.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2010.01412 — Sharpness-Aware Minimization for Efficiently Improving Generalization', u:'https://arxiv.org/abs/2010.01412'},
 {t:'Google Research 공식 구현', u:'https://github.com/google-research/sam'}
]
});
