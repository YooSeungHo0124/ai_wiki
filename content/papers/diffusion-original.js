WIKI.paper({
slug:'diffusion-original',
venue:'ICML 2015',
authors:'Sohl-Dickstein, Weiss, Maheswaranathan, Ganguli (스탠퍼드 · UC 버클리)',
arxiv:'1503.03585',

tldr:'비평형 열역학에서 아이디어를 빌려, 데이터를 **천천히 노이즈로 망가뜨리는 전방 과정**을 정의하고 그 **역과정을 학습**해 생성모델을 만든 논문. 5년 뒤 [DDPM](#/p/ddpm)이 이 틀을 그대로 쓰면서 이미지 생성의 주류가 됐다.',

context:'생성모델은 오랫동안 **유연함과 다루기 쉬움의 교환**에 묶여 있었다. 가우시안처럼 다루기 쉬운 분포는 실제 데이터의 구조를 담지 못하고, $p(x) = \\phi(x)/Z$ 처럼 임의의 함수로 정의한 유연한 분포는 정규화 상수 $Z$ 를 계산할 수 없다. 학습·샘플링·추론·평가를 모두 다루기 쉽게 유지하면서 유연한 분포를 쓸 방법이 필요했다. 저자들은 물리학에서 답을 가져왔다 — 비평형 통계역학은 복잡한 분포를 단순한 분포로 **점진적으로 변환하는 과정**을 다룬다.',

ideas:[
 {h:'데이터를 조금씩 망가뜨려 단순한 분포로 보낸다',
  lead:'가우시안 노이즈를 수천 번 조금씩 더해 데이터 분포를 등방 가우시안으로 만든다.',
  d:'전방 과정 $q$ 는 학습하지 않는다. 매 스텝 아주 작은 노이즈를 더할 뿐이고, 충분히 반복하면 원래 분포의 구조가 완전히 지워져 표준 가우시안이 된다. **각 스텝이 작다는 것**이 핵심이다 — 변화가 미소하면 그 역방향도 같은 함수 형태(가우시안)를 갖는다는 것이 물리학에서 알려진 사실이고, 이것이 역과정을 학습 가능하게 만든다.'},
 {h:'역과정을 신경망으로 학습한다',
  lead:'노이즈에서 데이터로 되돌아오는 각 스텝의 평균과 분산만 예측하면 된다.',
  d:'생성은 표준 가우시안에서 시작해 학습된 역스텝을 거꾸로 밟는 것이다. 신경망은 전체 분포를 한 번에 맞히는 대신 **아주 작은 한 스텝의 되돌리기**만 배우면 되므로 과제가 훨씬 쉬워진다. 어려운 문제를 수천 개의 쉬운 문제로 쪼갠 셈이다.'},
 {h:'정규화 상수 문제를 우회한다',
  lead:'전방 과정이 다루기 쉬운 분포로 끝나므로 로그 우도의 하한을 계산할 수 있다.',
  d:'유연한 모델의 고질적 문제였던 $Z$ 계산이 사라진다. 전방 과정의 각 스텝이 해석적으로 알려진 가우시안이라, 변분 하한(ELBO)을 명시적으로 쓸 수 있고 홀드아웃 집합에서 로그 우도를 평가할 수 있다. **학습·샘플링·추론·평가가 모두 다루기 쉬운** 상태로 유지된다.'},
 {h:'조건부 생성과 인페인팅이 공짜로 따라온다',
  lead:'역과정 각 스텝에 다른 분포를 곱하기만 하면 조건을 걸 수 있다.',
  d:'이미지의 일부가 주어졌을 때 나머지를 채우는 것 같은 작업이 별도 학습 없이 가능하다. 역과정의 매 스텝에서 알려진 영역을 관측값으로 고정하면 된다. 훗날 [ControlNet](#/p/controlnet)이나 확산 모델의 편집 기능이 서 있는 자리가 여기다.'}
],

diagram:{type:'loop', center:'T 스텝 반복', cap:'전방 과정은 학습하지 않는다. 신경망이 배우는 것은 역방향 화살표 하나뿐이고, 그것도 아주 작은 한 스텝이다.',
 nodes:[
  {t:'데이터 분포', s:'복잡·구조 있음'},
  {t:'전방: 노이즈 추가', s:'학습 없음 · 고정'},
  {t:'등방 가우시안', s:'단순·다루기 쉬움'},
  {t:'역방향: 노이즈 제거', s:'신경망이 배우는 부분', acc:true}
 ]},

math:[
 {tex:'q\\!\\left(\\mathbf{x}^{(t)} \\mid \\mathbf{x}^{(t-1)}\\right) \;=\; \\mathcal{N}\\!\\left(\\mathbf{x}^{(t)};\; \\mathbf{x}^{(t-1)}\\sqrt{1-\\beta_t},\; \\beta_t \\mathbf{I}\\right)',
  expr:'q(xₜ | xₜ₋₁) = N(xₜ; xₜ₋₁√(1−βₜ), βₜI)',
  d:'전방 확산 커널. $\\beta_t$ 가 매 스텝 더하는 노이즈의 양이고, 작게 두는 것이 전제다. 학습 대상이 아니라 **미리 정한 스케줄**이다.'},
 {tex:'p\\!\\left(\\mathbf{x}^{(t-1)} \\mid \\mathbf{x}^{(t)}\\right) \;=\; \\mathcal{N}\\!\\left(\\mathbf{x}^{(t-1)};\; \\mathbf{f}_\\mu\\!\\left(\\mathbf{x}^{(t)}, t\\right),\; \\mathbf{f}_\\Sigma\\!\\left(\\mathbf{x}^{(t)}, t\\right)\\right)',
  expr:'p(xₜ₋₁ | xₜ) = N(xₜ₋₁; f_μ(xₜ,t), f_Σ(xₜ,t))',
  d:'역과정. 신경망 $\\mathbf{f}$ 가 평균과 분산을 예측한다. **전방 스텝이 작으면 역스텝도 가우시안**이라는 사실이 이 형태를 정당화한다. [DDPM](#/p/ddpm)은 여기서 분산을 고정하고 평균 예측을 노이즈 예측으로 바꿔 목적함수를 한 줄로 줄였다.'},
 {tex:'\\log p(\\mathbf{x}^{(0)}) \;\\geq\; K \;=\; -\\sum_{t=2}^{T} \\mathbb{E}_{q}\\!\\left[D_{\\mathrm{KL}}\\!\\left(q\\,\\|\\,p\\right)\\right] + H_q\\!\\left(\\mathbf{x}^{(T)} \\mid \\mathbf{x}^{(0)}\\right) - H_q\\!\\left(\\mathbf{x}^{(1)} \\mid \\mathbf{x}^{(0)}\\right) - H_p\\!\\left(\\mathbf{x}^{(T)}\\right)',
  expr:'log p(x⁰) ≥ K  (변분 하한)',
  d:'로그 우도의 하한. 각 항이 해석적으로 계산 가능한 KL 발산과 엔트로피라, 정규화 상수 없이 모델을 평가할 수 있다. 이것이 "다루기 쉬움"의 실체다.'}
],

numbers:[
 {k:'전방 스텝 수', v:'수백~수천', d:'데이터셋에 따라 $T$ 를 다르게 뒀다. 스텝이 작아야 역과정이 가우시안으로 근사된다'},
 {k:'Dead Leaves · 로그 우도 하한', v:'1.489 bits/pixel', d:'당시 최고 성능 MCGSM의 1.244를 넘어섬'},
 {k:'Bark 텍스처', v:'−0.55 bits/pixel', d:'등방 가우시안 대비 **1.5 bits/pixel** 개선'},
 {k:'MNIST (Parzen 추정)', v:'−', d:'적대적 신경망(GAN) 등 당시 기법과 비슷한 수준으로 보고'},
 {k:'실험 데이터셋', v:'MNIST · CIFAR-10 · Bark · Dead Leaves · 심장박동', d:'이미지뿐 아니라 1차원 시계열까지'}
],

impact:'발표 당시에는 크게 주목받지 못했다. 2015년은 [GAN](#/p/gan)이 막 나와 선명한 샘플로 판을 휩쓸던 때였고, 이 논문의 샘플 품질은 그에 못 미쳤다. 그러나 **틀 자체가 옳았다.** 5년 뒤 [DDPM](#/p/ddpm)이 같은 전방·역방향 구조를 유지한 채 목적함수를 단순화하고 [U-Net](#/p/unet)을 붙이자 GAN을 능가하는 품질이 나왔고, 거기서 [Stable Diffusion](#/p/ldm)까지 이어졌다. 오늘날 이미지·영상·오디오 생성의 지배적 패러다임이 이 논문에서 시작한다.',

legacy:[
 '**[DDPM](#/p/ddpm)(2020)** — 분산을 고정하고 평균 예측을 노이즈 예측 MSE로 바꿔 학습을 안정화. 이 논문의 직계이자 실용화 지점',
 '**[Score SDE](#/p/score-sde)(2021)** — 이산 스텝을 연속 SDE로 일반화해, 확산과 스코어 매칭이 같은 것임을 보였다',
 '**[DDIM](#/p/ddim)·[Consistency Models](#/p/consistency)** — "스텝이 작아야 한다"는 이 논문의 전제를 깨고 샘플링 스텝을 줄이는 연구 계열',
 '**조건부 생성** — 역스텝에 분포를 곱해 조건을 거는 방식이 [CFG](#/p/cfg)·[ControlNet](#/p/controlnet)의 뿌리다'
],

pitfalls:[
 '**이 논문의 샘플 품질은 오늘날 기준으로 조악하다.** 기여는 품질이 아니라 **틀**이다. 확산 모델의 성능을 이 논문으로 판단하면 안 된다.',
 '**"확산 모델은 2020년에 나왔다"는 서술이 흔하지만 5년 앞선 이 논문이 원조다.** [DDPM](#/p/ddpm)은 스스로 이 논문을 출발점으로 명시한다. 다만 DDPM 없이는 실용화되지 않았을 것이므로, 어느 한쪽만 원조라고 하는 것도 정확하지 않다.',
 '**노이즈 스케줄 $\\beta_t$ 는 학습되지 않는 설계 선택이다.** 이 논문은 스텝이 충분히 작아야 역과정의 가우시안 근사가 성립한다는 전제 위에 서 있고, 그래서 샘플링에 수천 스텝이 필요하다. 이 느림이 이후 10년간 확산 연구의 주된 과제가 됐다.'
],

figures:[
 {f:'fig1-forward-reverse.png',
  cap:'2차원 스위스롤 데이터. **윗줄이 전방 과정** — 왼쪽(t=0)의 나선 구조가 오른쪽(t=T)으로 갈수록 뭉개져 등방 가우시안이 된다. **가운뎃줄이 학습된 역과정** — 오른쪽 가우시안에서 출발해 왼쪽 나선을 복원한다. 아랫줄은 역과정의 drift 항으로, 신경망이 각 지점에서 어느 방향으로 밀지를 보여 준다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'The essential idea, inspired by non-equilibrium statistical physics, is to systematically and slowly destroy structure in a data distribution through an iterative forward diffusion process. We then learn a reverse diffusion process that restores structure in data, yielding a highly flexible and tractable generative model of the data.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1503.03585 — Deep Unsupervised Learning using Nonequilibrium Thermodynamics', u:'https://arxiv.org/abs/1503.03585'},
 {t:'저자 참조 구현', u:'https://github.com/Sohl-Dickstein/Diffusion-Probabilistic-Models'}
]
});
