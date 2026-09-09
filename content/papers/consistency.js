WIKI.paper({
slug:'consistency',
venue:'ICML 2023',
authors:'Song, Dhariwal, Chen, Sutskever (OpenAI)',
arxiv:'2303.01469',

tldr:'확률 흐름 ODE 궤적 위의 **어느 지점을 넣어도 같은 출발점(원본 이미지)을 뱉는** 함수 $f_\\theta$ 를 학습해, diffusion 생성을 **1~2 스텝**으로 끝낸 논문. 증류(distillation)로도, 처음부터 단독(training)으로도 학습할 수 있다는 두 갈래를 함께 제시했다.',

context:'[DDPM](#/p/ddpm) 계열의 근본 약점은 속도다. 샘플 하나에 신경망을 수십~수백 번 통과시켜야 해서, GAN이 1회 forward로 끝내는 일을 diffusion은 그 수백 배 비용으로 한다. [DDIM](#/p/ddim)이 샘플링을 결정적 ODE로 바꾸고 [Score SDE](#/p/score-sde)가 그 ODE를 확률 흐름 ODE로 정식화하면서 스텝 수는 크게 줄었지만, 10~50 스텝 아래로 내려가면 품질이 급격히 무너졌다. 원인은 명확하다 — ODE 궤적이 휘어 있어 큰 스텝을 밟으면 이산화 오차가 쌓인다. 기존의 증류 시도(progressive distillation)는 스텝 수를 절반씩 줄이는 방식이라 1스텝까지 가려면 여러 라운드의 재학습이 필요했다. 이 논문의 질문은 다르다 — **궤적을 잘게 따라가는 대신, 궤적 전체를 한 번에 원점으로 접어버리면 안 되는가?**',

ideas:[
 {h:'self-consistency: 같은 궤적 위 모든 점은 같은 답을 낸다',
  lead:'ODE 궤적 위 어느 점을 넣어도 같은 시작점을 내놓는 함수를 학습해 1회 호출로 끝낸다.',
  d:'확률 흐름 ODE는 노이즈 $x_T$ 에서 데이터 $x_\\epsilon$ 까지 하나의 결정적 궤적을 그린다. 그 궤적 위의 임의의 점 $(x_t, t)$ 를 넣으면 **항상 같은 시작점** $x_\\epsilon$ 을 내놓는 함수 $f_\\theta(x_t,t)$ 를 정의한다. 이 성질이 성립하면 노이즈 하나를 넣고 $f_\\theta$ 를 **한 번** 호출하는 것만으로 샘플이 나온다. 궤적을 따라가는 대신 궤적을 통째로 무너뜨리는 셈이다.'},
 {h:'경계 조건은 아키텍처로 강제한다',
  lead:'경계 조건을 손실이 아니라 c_skip/c_out 파라미터화로 구조적으로 못 박는다.',
  d:'$f_\\theta(x,\\epsilon)=x$ 라는 경계 조건이 없으면 상수 함수가 손실을 0으로 만드는 자명해가 된다. 이를 학습으로 배우게 두지 않고 **파라미터화로 못 박는다**: $f_\\theta(x,t)=c_{skip}(t)\\,x + c_{out}(t)\\,F_\\theta(x,t)$ 로 두고, $t=\\epsilon$ 에서 $c_{skip}=1$, $c_{out}=0$ 이 되도록 계수를 설계한다. 그러면 어떤 $\\theta$ 든 경계 조건은 자동으로 만족된다.'},
 {h:'증류(CD): 미리 학습된 diffusion을 교사로 쓴다',
  lead:'교사로 한 스텝 역방향을 밟은 인접한 두 점의 출력을 EMA 타깃에 맞춘다.',
  d:'교사 score 모델로 ODE 솔버를 **한 스텝만** 역방향으로 밟아 $x_{t_{n+1}} \\to \\hat{x}_{t_n}$ 을 얻고, $f_\\theta(x_{t_{n+1}},t_{n+1})$ 과 $f_{\\theta^-}(\\hat{x}_{t_n},t_n)$ 이 같아지도록 맞춘다. $\\theta^-$ 는 EMA로 천천히 따라오는 **타깃 네트워크**이고, 여기에 stop-gradient가 걸린다. 인접한 두 점의 출력만 붙여도 사슬처럼 전파되어 결국 궤적 전체가 한 점으로 모인다.'},
 {h:'단독 학습(CT): 교사 없이도 된다',
  lead:'조건부 score의 불편 추정량으로 교사 없이 인접 노이즈 레벨 쌍을 맞춘다.',
  d:'교사 없이 학습하려면 $\\nabla \\log p_t$ 를 알아야 하는데, 이 논문은 **데이터 한 점에 조건부화한 score의 불편 추정량**으로 그것을 대체할 수 있음을 보인다. 그러면 같은 깨끗한 이미지에 서로 다른 두 노이즈 레벨을 씌운 쌍 $(x+t_{n+1}z,\\; x+t_n z)$ 의 출력을 맞추는 것만으로 학습이 된다. diffusion 사전학습에 의존하지 않는 **독립적인 생성 모델 계열**이 되는 지점이다.'},
 {h:'스텝 수를 품질과 맞바꾸는 손잡이',
  lead:'다시 노이즈를 씌우고 f_θ를 반복 호출하면 스텝 수만큼 품질이 올라간다.',
  d:'1스텝으로 끝낼 필요는 없다. 나온 샘플에 다시 노이즈를 $t$ 만큼 씌우고 $f_\\theta$ 를 또 호출하는 것을 반복하면 스텝 수만큼 품질이 올라간다. CIFAR-10에서 1→2 스텝만으로 FID가 3.55→2.93으로 떨어진다. 또 $f_\\theta$ 는 노이즈 낀 입력을 곧장 데이터로 보내는 함수라, 인페인팅·초해상도 같은 편집 작업을 **재학습 없이** 같은 방식으로 처리할 수 있다.'}
],

diagram:{type:'compare', cap:'같은 확률 흐름 ODE 궤적을 두 방식이 어떻게 다루는가. (좌: $x_T \\to x_{t_1} \\to \\dots \\to x_0$ 순차 적분, 우: $f_\\theta(x_t,t)=x_\\epsilon$ 로 즉시 사영)',
 left:{t:'기존: 궤적을 따라 적분', items:[
  '노이즈에서 데이터까지 순차 진행',
  '신경망 호출 수십~수백 회 (NFE 35+)',
  '스텝을 줄이면 이산화 오차 누적',
  'EDM 교사: CIFAR-10 FID 2.04']},
 right:{t:'Consistency: 궤적을 접는다', items:[
  '궤적 위 어느 점이든 같은 시작점',
  '신경망 호출 **1회**로 샘플 완성',
  'c_skip/c_out 파라미터화로 경계 강제',
  'CD 1스텝 FID 3.55 · 2스텝 2.93']}},

figures:[
 {f:'fig2-consistency-mapping.png',
  cap:'연두색 곡선들이 데이터(왼쪽)에서 노이즈(오른쪽)로 가는 여러 개의 확률 흐름 ODE 궤적. 빨간 화살표는 한 궤적 위의 서로 다른 세 점 $(x_t,t)$, $(x_{t\'},t\')$, $(x_T,T)$ 가 모두 같은 함수 $f_\\theta$ 를 거쳐 같은 시작점 $(x_0,0)$ 으로 모이는 것을 보여준다. 즉 궤적 전체가 하나의 점으로 접힌다 — 이 사영 하나가 다단계 적분을 1회 호출로 대체한다.',
  src:'원문 Figure 2, p.3'}
],

math:[
 {expr:'f_θ(x_t, t) = x_ε  for all t ∈ [ε, T]  on the same ODE trajectory',
  tex:'f_\\theta(x_t,t) = x_\\epsilon \\quad \\text{for all } t \\in [\\epsilon, T] \\text{ on the same ODE trajectory}',
  d:'논문 전체를 정의하는 한 줄. 궤적을 하나의 등가류로 보고, 그 등가류를 대표하는 원소(시작점)로 사영하는 함수를 배우는 것이다.'},
 {expr:'f_θ(x, t) = c_skip(t)·x + c_out(t)·F_θ(x, t),   c_skip(ε)=1, c_out(ε)=0',
  tex:'f_\\theta(x,t) = c_{skip}(t)\\,x + c_{out}(t)\\,F_\\theta(x,t), \\quad c_{skip}(\\epsilon)=1,\\ c_{out}(\\epsilon)=0',
  d:'경계 조건 $f_\\theta(x,\\epsilon)=x$ 를 손실이 아니라 **구조**로 보장한다. 이것이 없으면 "전부 같은 값을 내라"는 손실이 상수 붕괴로 최적화된다.'},
 {expr:'L = E[ λ(t_n) · d( f_θ(x_{t_{n+1}}, t_{n+1}),  f_{θ⁻}(x̂_{t_n}, t_n) ) ]',
  tex:'L = \\mathbb{E}\\left[ \\lambda(t_n)\\, d\\big( f_\\theta(x_{t_{n+1}}, t_{n+1}),\\, f_{\\theta^-}(\\hat x_{t_n}, t_n) \\big) \\right]',
  d:'인접 시점 두 출력의 거리 $d$(LPIPS가 $\\ell_2$ 보다 크게 나았다)를 좁힌다. $\\theta^-$ 는 EMA 타깃이며 gradient가 흐르지 않는다 — 이 비대칭이 붕괴를 막는 두 번째 장치다.'}
],

quotes:[
 {t:'We propose consistency models, a new family of models that generate high quality samples by directly mapping noise to data.',
  src:'Abstract, p.1'}
],

numbers:[
 {k:'CD · CIFAR-10', v:'1스텝 FID 3.55 / 2스텝 2.93', d:'교사 EDM은 FID 2.04에 **NFE 35**'},
 {k:'CD · ImageNet 64²', v:'1스텝 FID 6.20 / 2스텝 4.70', d:'당시 1스텝 생성 기준 최고'},
 {k:'CT · CIFAR-10', v:'1스텝 FID 8.70 / 2스텝 5.83', d:'교사 없이 처음부터 학습한 경우'},
 {k:'CT · ImageNet 64²', v:'1스텝 FID 13.0 / 2스텝 11.1', d:'증류 대비 확연한 격차 — 단독 학습의 한계'},
 {k:'거리 함수 선택', v:'LPIPS > ℓ₂', d:'지각적 거리를 쓰는 것이 FID에 큰 영향을 준 설계 선택'}
],

impact:'diffusion의 "느리다"는 정체성을 흔들었다. 수십 스텝을 전제로 짜여 있던 샘플러·스케줄러 논의가, **한 번의 forward로 끝나는 생성기**라는 선택지 앞에서 재편됐다. 특히 CT 쪽 결과는 이것이 단순한 diffusion 가속 트릭이 아니라 GAN·VAE와 나란히 놓일 수 있는 별도의 생성 모델 계열임을 시사했다. 실시간 이미지 생성, 온디바이스 생성, 그리고 생성 모델을 강화학습 정책이나 로봇 제어에 끼워 넣는 응용 — 즉 **추론 지연이 결정적인 곳** — 이 이때부터 현실적인 선택지가 됐다.',

legacy:[
 '**소수 스텝 증류 계열의 표준 축** — latent consistency model(LCM), consistency trajectory model 등으로 확장되며 [LDM](#/p/ldm) 기반 실시간 이미지 생성이 보급됨',
 '**adversarial 증류와의 경쟁** — 이후 [GAN](#/p/gan) 손실을 섞어 1~4 스텝 품질을 끌어올리는 계열(ADD·LADD 등)이 등장하며, 순수 consistency 손실과 방법론적으로 갈라짐',
 '**곧은 궤적과의 결합** — [Flow Matching](#/p/flow-matching)/rectified flow의 직선 경로 위에서 consistency를 걸면 접어야 할 곡률이 적어, 두 계열이 자연스럽게 합쳐짐',
 '**후속 개선(iCT)** — 같은 저자들이 이산화 스케줄·EMA 타깃·거리 함수를 손봐 단독 학습(CT) 성능을 크게 끌어올리며, EMA 타깃 없이도 학습되는 레시피를 제시'
],

pitfalls:[
 '**증류(CD)와 단독 학습(CT)의 성능 차이가 크다.** 흔히 "consistency model은 교사 없이 1스텝 생성"으로 요약되지만, 논문의 좋은 숫자는 대부분 CD 쪽이고 CT는 CIFAR-10에서도 FID가 두 배 이상 나쁘다. 어느 쪽인지 확인하지 않고 수치를 인용하면 어긋난다.',
 '**1스텝 샘플은 교사보다 다양성이 떨어지기 쉽다.** 궤적을 한 점으로 접는 과정에서 미세한 모드가 뭉개지며, FID는 비슷해도 세부 디테일과 변이가 줄어든 결과가 나오는 경우가 많다.',
 '**학습이 손실만으로 굴러가지 않는다.** EMA 타깃의 감쇠율, 이산화 구간 개수 $N$ 의 스케줄, 거리 함수 선택이 결과를 좌우한다. 특히 LPIPS를 쓰면 사전학습된 지각 네트워크에 의존하게 되어, 평가 지표와의 순환 논란이 따라붙는다.'
],

links:[
 {t:'arXiv 2303.01469 — Consistency Models', u:'https://arxiv.org/abs/2303.01469'},
 {t:'arXiv 2310.14189 — Improved Techniques for Training Consistency Models', u:'https://arxiv.org/abs/2310.14189'}
]
});
