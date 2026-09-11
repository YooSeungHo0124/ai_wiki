WIKI.paper({
slug:'deep-infomax',
venue:'ICLR 2019 (arXiv 2018)',
authors:'Hjelm, Fedorov, Lavoie-Marchildon, Grewal, Bachman, Trischler, Bengio (MSR Montreal · MILA · U Toronto)',
arxiv:'1808.06670',

tldr:'재구성 없이, 입력과 인코더 출력 사이의 **상호정보량(mutual information)을 직접 추정하고 최대화**하는 자기지도 표현학습 방법. 이미지 전체가 아니라 **지역(local) 패치와 전역(global) 요약을 짝지어** MI를 최대화하는 쪽이 재구성 기반 방법(VAE·AE)보다 훨씬 나은 표현을 만든다는 것을 보였다.',

context:'2018년까지 비지도 표현학습의 주류는 `[VAE](#/p/vae)`·오토인코더처럼 **입력을 재구성**하도록 인코더-디코더를 학습시키는 방식이었다. 문제는 재구성 손실이 픽셀 단위 오차에 좌우되어, 분류 같은 다운스트림 과제에 중요한 고수준 의미와 무관한 디테일(질감·잡음)까지 복원하려 든다는 것이다. Deep InfoMax는 질문을 바꾼다 — **재구성할 필요 없이, 입력과 표현 사이의 상호정보량만 직접 키우면 안 되는가?** MI 자체는 고차원 신경망 출력 사이에서 계산이 어렵지만, MINE(Belghazi et al., 2018) 같은 신경망 기반 MI 추정기가 이를 가능하게 만든 직후였다.',

ideas:[
 {h:'재구성 대신 상호정보량 추정·최대화',
  lead:'디코더로 입력을 복원하는 대신, 판별자 네트워크로 MI 하한을 추정해 직접 키운다.',
  d:'인코더 $E_\\psi$의 출력과 입력 사이의 상호정보량 $I(X; E_\\psi(X))$를 목적함수로 직접 최대화한다. MI 자체는 계산 불가능하지만, 데이터 $(x,y)$가 실제 짝인지(joint) 무작위로 섞인 짝인지(marginal의 곱)를 구별하도록 훈련된 판별자 $T_\\omega$ 를 이용하면 하한을 추정할 수 있다(MINE의 Donsker-Varadhan 하한). 인코더는 이 하한을 계속 키우는 방향으로 학습된다.'},
 {h:'전역(global) MI만으로는 부족하다',
  lead:'이미지 전체와 표현 벡터 사이의 MI만 키우면 다운스트림 분류 성능이 오히려 낮다.',
  d:'이미지 전체를 하나의 벡터로 요약한 뒤 그 벡터와 원본 이미지 사이의 MI를 최대화하는 DIM(G) 방식은, 놀랍게도 VAE·AE 같은 재구성 기반 방법보다도 분류 정확도가 낮았다. 전역 MI 최대화만으로는 인코더가 국소적으로 의미 없는 저수준 통계(예: 픽셀 잡음 패턴)에 매달릴 수 있다는 것이 원인으로 지목됐다.'},
 {h:'지역 특징과 전역 특징을 짝짓는 것이 핵심',
  lead:'M×M 격자의 지역 특징 각각과 전역 요약 벡터 사이의 MI를 최대화한다.',
  d:'인코더가 만든 M×M 크기의 중간 feature map(지역 특징들)과, 그것을 요약한 전역 특징 벡터를 **모든 위치에서 짝지어** MI를 최대화한다(DIM(L)). 같은 이미지에서 나온 지역-전역 쌍은 "진짜(real)", 다른 이미지에서 가져온 지역 특징과 짝지은 쌍은 "가짜(fake)"로 판별자가 구별하도록 훈련한다. 이는 이미지 전체가 아니라 **국소 패치들이 전역 요약과 일관되게 연결되는지**를 학습 신호로 쓰는 것이다.'},
 {h:'표현에 원하는 통계적 제약을 어울리게 강제한다',
  lead:'표현의 분포가 원하는 사전분포를 따르도록 adversarial autoencoder 방식으로 추가 제약을 건다.',
  d:'MI 최대화만으로는 표현이 임의의 분포를 가질 수 있다. DIM은 여기에 두 번째 목적을 더한다 — 인코더 출력의 분포 $U_{\\psi,P}$가 원하는 사전분포 $V$(예: 균등분포)를 따르도록 판별자를 하나 더 써서 adversarial하게 맞춘다(adversarial autoencoder와 같은 방식). 이는 독립성 같은 바람직한 통계적 성질을 표현에 부여하기 위한 것이다.'},
 {h:'MI 추정기 선택이 성능을 좌우한다: infoNCE가 최선',
  lead:'DV·JSD·infoNCE 세 추정기 중 infoNCE 기반 DIM(L)이 CIFAR10/100에서 가장 좋은 정확도를 냈다.',
  d:'MI 하한을 추정하는 방식으로 Donsker-Varadhan(DV), Jensen-Shannon(JSD), infoNCE(=Noise-Contrastive Estimation 기반) 세 가지를 비교했다. JSD가 DV보다 안정적이었고, infoNCE 기반이 CIFAR10/100 모두에서 최고 정확도를 냈다. infoNCE는 이후 `[CPC](#/p/cpc)` 계열이 공유하는 손실 함수이기도 하다.'}
],

diagram:{type:'flow', cap:'지역-전역 MI 최대화 경로. 판별자는 같은 이미지의 지역-전역 쌍(진짜)과 다른 이미지에서 가져온 쌍(가짜)을 구별하도록 학습된다.',
 nodes:[
  {t:'입력 이미지', s:'x'},
  {t:'conv 인코더', s:'M×M 지역특징'},
  {t:'전역 요약', s:'벡터 1개', acc:true},
  {t:'지역·전역 결합', s:'모든 M×M 위치'},
  {t:'판별자', s:'진짜/가짜 점수'}
 ]},

math:[
 {expr:'I(X;Y) ≥ E_J[Tω(x,y)] − log E_M[e^Tω(x,y)]   (Donsker–Varadhan 하한)',
  tex:'\\mathcal{I}(X;Y) := D_{KL}(\\mathbb{J}\\Vert\\mathbb{M}) \\ge \\widehat{\\mathcal{I}}_\\omega^{(DV)}(X;Y) := \\mathbb{E}_{\\mathbb{J}}[T_\\omega(x,y)] - \\log \\mathbb{E}_{\\mathbb{M}}[e^{T_\\omega(x,y)}]',
  d:'상호정보량을 결합분포 $\\mathbb{J}$와 주변분포의 곱 $\\mathbb{M}$ 사이의 KL divergence로 쓰고, 판별자 $T_\\omega$ 로 그 하한을 추정한다. 이 하한을 크게 만들도록 인코더와 판별자를 함께 학습시키는 것이 DIM의 기본 골격이다.'},
 {expr:'I_JSD(X;Eψ(X)) = E_P[-softplus(-Tψ,ω(x,Eψ(x)))] - E_P×P̃[softplus(Tψ,ω(x′,Eψ(x)))]',
  tex:'\\widehat{\\mathcal{I}}_{\\omega,\\psi}^{(JSD)} := \\mathbb{E}_{\\mathbb{P}}[-\\text{sp}(-T_{\\psi,\\omega}(x,E_\\psi(x)))] - \\mathbb{E}_{\\mathbb{P}\\times\\tilde{\\mathbb{P}}}[\\text{sp}(T_{\\psi,\\omega}(x^\\prime,E_\\psi(x)))]',
  d:'실전에서 더 안정적이었던 Jensen-Shannon 기반 추정기. 실질적으로 진짜 쌍과 가짜 쌍을 구별하는 이진 분류(binary cross-entropy)와 같은 형태다. $\\text{sp}$는 softplus.'}
],

numbers:[
 {k:'CIFAR10 선형분류 · DIM(L) infoNCE', v:'75.57%', d:'fc(1024) 표현 위 선형 분류기, 완전지도 학습(75.39%)과 동급'},
 {k:'CIFAR10 · DIM(G) 전역만', v:'52.84%', d:'지역-전역 결합 없이 전역 MI만 최대화하면 VAE(60.54%)보다도 낮음'},
 {k:'CIFAR10 · VAE / AE', v:'60.54% / 55.78%', d:'재구성 기반 방법의 대표 기준선'},
 {k:'CIFAR100 · DIM(L) infoNCE', v:'47.72%', d:'완전지도(42.27%)를 오히려 상회'},
 {k:'Tiny ImageNet · DIM(L)', v:'완전지도 AlexNet급에 근접', d:'다른 모든 비지도 방법을 큰 격차로 앞섬 (원문 Table 2)'}
],

impact:'Deep InfoMax는 재구성 없이도 상호정보량 최대화만으로 강력한 표현을 학습할 수 있음을 보였고, **어떤 MI를 최대화하느냐(전역 vs 지역)가 재구성 여부보다 더 중요한 설계 선택**이라는 것을 드러냈다. 이 지역-전역 프레임과 infoNCE 손실은 이후 `[CPC](#/p/cpc)`·`[AMDIM](#/p/amdim)`류 대조학습 계열의 이론적 배경이 됐고, "긍정 쌍은 가까이, 부정 쌍은 멀리"라는 대조학습의 일반 레시피를 상호정보량이라는 공통 언어로 정당화하는 역할을 했다.',

legacy:[
 '**대조학습(contrastive learning)의 이론적 토대 중 하나** — `[CPC](#/p/cpc)`의 InfoNCE, `[SimCLR](#/p/simclr)`류가 공유하는 "MI 하한 = 판별 손실"이라는 관점을 명시적으로 제시',
 '**지역-전역 결합**이라는 설계가 이후 AMDIM 등 멀티스케일 대조학습 구조로 이어짐',
 '**"재구성이 필수가 아니다"는 것을 실증** — 이후 자기지도 학습 연구가 판별적(discriminative) 목적함수 쪽으로 크게 기울게 된 계기 중 하나',
 '**MI 추정기 선택의 실전 지침** — infoNCE가 DV·JSD보다 하류 과제 정확도에서 우수하다는 비교가 이후 연구의 기본 선택으로 자주 채택됨'
],

pitfalls:[
 '**전역 MI만 최대화하면 오히려 나쁜 표현이 나온다.** "MI를 최대화하면 무조건 좋은 표현"이라는 단순화는 틀렸다 — 이 논문의 핵심 발견은 **구조(지역-전역 결합)가 MI 최대화 자체보다 중요하다**는 것이다.',
 '**CPC와 동시대·독립 발견이지 CPC의 아류가 아니다.** DIM은 지역 특징 전체를 한 번에 하나의 전역 요약으로 예측하는 반면, CPC는 순서대로 미래의 지역 특징을 자기회귀적으로 예측한다 — 메커니즘이 다르다.',
 '**MI 하한 추정치 자체의 크기는 하류 성능과 반드시 비례하지 않는다.** DV 추정기가 더 타이트한 하한을 줄 수 있어도 분류 정확도는 JSD·infoNCE보다 낮게 나왔다 — "더 정확한 MI 추정 = 더 좋은 표현"이 아니다.'
],

figures:[
 {f:'fig3-local-global-mi.png',
  cap:'위쪽(같은 이미지): M×M 지역 특징 중 하나(초록 화살표, Local feature +)와 전역 특징(노란 정육면체)을 결합해 판별자에 넣으면 "Real" 점수가 나와야 한다. 아래쪽: 다른 이미지에서 가져온 M×M 특징(분홍)에서 뽑은 지역 특징(Local feature -)과 같은 전역 특징을 결합하면 "Fake" 점수가 나와야 한다. 이 진짜/가짜 구별 자체가 MI 하한을 추정하는 손실이 된다.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:"We show that structure matters: incorporating knowledge about locality in the input into the objective can significantly improve a representation's suitability for downstream tasks.",
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1808.06670 — Learning deep representations by mutual information estimation and maximization', u:'https://arxiv.org/abs/1808.06670'}
]
});
