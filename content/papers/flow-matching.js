WIKI.paper({
slug:'flow-matching',
venue:'ICLR 2023 (oral)',
authors:'Lipman, Chen, Ben-Hamu, Nickel, Le (Meta AI · Weizmann)',
arxiv:'2210.02747',

tldr:'노이즈에서 데이터로 가는 **확률 경로를 직선으로 정해 놓고**, 그 위의 속도 벡터장을 회귀로 맞추는 학습법. diffusion의 SDE·시간 스케줄·노이즈 예측이라는 장치를 걷어내고 단순 $L_2$ 회귀 한 줄로 대체하면서, 더 적은 스텝으로 샘플링되고 학습도 안정적이 됐다.',

context:'[Score SDE](#/p/score-sde)는 diffusion을 "데이터를 노이즈로 망가뜨리는 확률 미분방정식과 그 역과정"으로 정리했고, 그 덕분에 [DDPM](#/p/ddpm)·[DDIM](#/p/ddim)이 하나의 틀 안에 들어왔다. 하지만 그 틀은 forward 과정을 **미리 고정된 물리적 확산**으로 두기 때문에 경로를 설계 대상으로 삼기 어렵다. 반대편에는 연속 정규화 흐름(CNF)이 있었다 — ODE로 분포를 나르는 훨씬 일반적인 프레임이지만, 학습하려면 매 스텝 ODE를 실제로 풀어야 해서(simulation) 비용이 감당되지 않았다. 한쪽은 **돌아가지만 경로가 고정**이고, 다른 쪽은 **유연하지만 못 돌린다**. 이 논문은 그 사이를 메운다 — CNF를 **시뮬레이션 없이** 학습하고, 그 김에 경로도 마음대로 고른다.',

ideas:[
 {h:'벡터장을 회귀 문제로 바꾼다',
  lead:'데이터 한 점에 조건부화한 벡터장에 회귀해도 원래 목표와 같은 gradient를 준다.',
  d:'목표 확률 경로 $p_t$ 를 만들어 내는 참 벡터장 $u_t$ 가 있다고 하면, 학습은 $\\|v_\\theta(x,t) - u_t(x)\\|^2$ 를 최소화하는 회귀다. 문제는 $u_t$ 를 모른다는 것. 이 논문의 핵심 보조정리는 **데이터 한 점 $x_1$ 로 조건부화한** 벡터장 $u_t(x|x_1)$ 에 대한 회귀가 **원래 목표와 같은 gradient를 준다**는 것이다. 조건부 벡터장은 닫힌 형태로 쓸 수 있으므로, 그 순간 학습이 완전히 시뮬레이션-프리가 된다.'},
 {h:'경로를 직선으로 고른다 (OT 경로)',
  lead:'노이즈와 데이터를 선형 보간하면 조건부 속도가 시간에 무관한 상수가 된다.',
  d:'조건부 경로를 자유롭게 고를 수 있다면, 가장 단순한 것을 고르면 된다. 노이즈 $x_0$ 와 데이터 $x_1$ 을 **선형 보간** $x_t = (1-t)x_0 + t x_1$ 로 잇는 경로(가우시안 사이 최적수송 변위)를 쓰면 조건부 속도는 상수 $x_1 - x_0$ 가 된다. 목표가 시간에 따라 요동치지 않으니 회귀가 쉬워지고, 궤적이 곧을수록 ODE 솔버가 큰 스텝을 밟아도 오차가 작다.'},
 {h:'diffusion을 특수 케이스로 흡수한다',
  lead:'경로의 평균·분산 스케줄만 바꾸면 VP/VE diffusion이 그대로 재현된다.',
  d:'조건부 경로의 평균·분산 스케줄 $(\\mu_t,\\sigma_t)$ 만 바꾸면 VP/VE diffusion 경로가 그대로 나온다. 즉 flow matching은 diffusion을 **대체**한다기보다 **포함**하며, 같은 프레임 안에서 "diffusion 경로 vs OT 경로"를 통제된 비교로 놓을 수 있다. 논문의 실험이 정확히 그 비교이고, 동일 조건에서 OT 경로가 더 나은 FID와 더 적은 NFE를 준다.'},
 {h:'왜 더 안정적인가',
  lead:'속도장 회귀는 전 구간에서 유계라 score 발산 같은 특이점이 없다.',
  d:'diffusion 학습은 $t\\to 0$ 근처에서 score가 발산해 손실 가중치·시간 샘플링 분포를 손봐야 하고, 노이즈 스케줄이 성능에 크게 영향을 준다. flow matching의 목표는 전 구간에서 유계한 속도 벡터에 대한 단순 $L_2$ 회귀라 이런 특이점이 없다. 논문은 diffusion 경로를 쓰더라도 FM 목표 쪽이 더 안정적이라고 보고한다 — 이득이 **경로 선택**과 **목표 형태** 양쪽에서 각각 온다는 뜻이다.'},
 {h:'rectified flow와의 관계',
  lead:'독립적으로 제안된 rectified flow는 사실상 같은 OT 경로 학습 목표에 도달한다.',
  d:'같은 시기 독립적으로 제안된 rectified flow(Liu et al., 2022)는 노이즈–데이터 쌍을 직선으로 잇고 그 속도를 회귀한다는 점에서 **OT 경로 flow matching과 사실상 같은 학습 목표**에 도달한다. 다른 점은 강조점이다. rectified flow는 "학습된 흐름으로 쌍을 다시 짝지어 재학습(reflow)하면 궤적이 더 곧아진다"는 반복 절차로 1-스텝 생성까지 밀고 갔고, flow matching은 CNF 학습 일반론과 경로 설계의 자유도를 정리했다. 실무에서 두 이름은 거의 같은 구현을 가리킨다.'}
],

diagram:{type:'compare', cap:'같은 노이즈 → 같은 이미지. 달라지는 것은 그 사이를 어떤 경로로 잇느냐다.',
 left:{t:'diffusion (SDE)', items:[
  '경로가 forward SDE로 **고정**됨',
  '곡선 궤적 — 솔버가 작은 스텝을 밟아야 함',
  '노이즈 스케줄·손실 가중치 튜닝이 필요',
  '$t\\to0$ 에서 score 발산',
  'ImageNet-32 FID 5.68 · NFE 178']},
 right:{t:'flow matching (OT)', items:[
  '경로를 **직선으로 설계**해 놓고 시작',
  '조건부 속도가 상수 — 회귀 목표가 단순',
  '스케줄 없이 $L_2$ 회귀 한 줄',
  '전 구간 유계, 특이점 없음',
  'ImageNet-32 FID 5.02 · NFE 122']}},

figures:[
 {f:'fig3-diffusion-vs-ot-trajectories.png',
  cap:'같은 시작점(검은 사각형)에서 같은 목표 쪽으로 가는 여러 색의 궤적. 왼쪽 diffusion 경로는 크게 휘어 돌아가거나 목표를 지나쳤다가(overshoot) 되돌아오는 곡선이고, 오른쪽 OT 경로는 전부 직선이다. 궤적이 곧다는 것은 ODE 솔버가 적은 스텝으로도 오차 없이 따라갈 수 있다는 뜻 — 이 논문이 적은 NFE로 샘플링되는 이유를 그림 한 장으로 보여준다.',
  src:'원문 Figure 3, p.6'}
],

math:[
 {expr:'L_CFM(θ) = E_{t, x1, x0} ‖ v_θ(x_t, t) − u_t(x_t | x1) ‖²',
  tex:'L_{CFM}(\\theta) = \\mathbb{E}_{t,x_1,x_0} \\left\\| v_\\theta(x_t,t) - u_t(x_t \\mid x_1) \\right\\|^2',
  d:'조건부 flow matching 손실. 참 벡터장 대신 **한 데이터 점에 조건부화한** 벡터장에 회귀하는데, 두 손실의 gradient가 같다는 것이 논문의 핵심 정리다. ODE를 한 번도 풀지 않고 CNF를 학습할 수 있게 되는 지점.'},
 {expr:'x_t = (1−t)·x0 + t·x1  ⟹  u_t(x_t | x1) = x1 − x0',
  tex:'x_t = (1-t)x_0 + t x_1 \\;\\Longrightarrow\\; u_t(x_t \\mid x_1) = x_1 - x_0',
  d:'OT(직선) 경로에서 조건부 속도는 시간에 무관한 상수다. 학습은 "노이즈와 데이터를 랜덤으로 하나씩 뽑아 선형 보간한 점에서, 그 차이 벡터를 예측하라"가 전부가 된다.'},
 {expr:'dx/dt = v_θ(x, t),   x(0) ~ N(0, I)  →  x(1)',
  tex:'\\frac{dx}{dt} = v_\\theta(x,t), \\quad x(0) \\sim \\mathcal{N}(0,I) \\;\\to\\; x(1)',
  d:'샘플링은 확률 미분방정식이 아니라 **결정적 ODE** 적분이다. 궤적이 곧을수록 Euler 같은 저차 솔버로도 큰 스텝을 밟을 수 있고, 이것이 적은 NFE의 직접적인 이유다.'}
],

quotes:[
 {t:'FM breaks the barriers for scalable CNF training beyond diffusion, and sidesteps the need to reason about diffusion processes to directly work with probability paths.',
  src:'Introduction, p.1'}
],

numbers:[
 {k:'CIFAR-10 FID', v:'6.35 (FM-OT) vs 19.94 (score matching)', d:'동일 백본·동일 학습 설정에서의 비교'},
 {k:'CIFAR-10 NLL', v:'2.99 bpd vs 3.16 bpd', d:'샘플 품질과 우도가 동시에 개선됨'},
 {k:'ImageNet-32', v:'FID 5.02 · NFE 122', d:'score matching은 FID 5.68 · NFE 178'},
 {k:'ImageNet-64', v:'FID 14.45 · NFE 138', d:'score matching은 FID 19.74 · **NFE 441**'},
 {k:'같은 오차까지의 비용', v:'diffusion 대비 약 60% NFE', d:'논문이 명시한 적분 효율 비교'}
],

impact:'생성 모델 학습이 "노이즈를 예측하는 문제"에서 "**속도를 예측하는 문제**"로 재서술됐다. 실무적으로는 튜닝 표면이 크게 줄었다 — 노이즈 스케줄, 손실 가중치, $\\epsilon$/$v$/$x_0$ 파라미터화 선택 같은 항목이 통째로 사라지고 "경로를 무엇으로 둘지" 하나만 남는다. 샘플링도 SDE가 아닌 ODE라 결정적이고, 궤적이 곧아 적은 스텝에서 품질 저하가 완만하다. 몇 년 만에 대형 이미지·영상·오디오 생성 모델의 기본 학습 목표가 diffusion에서 flow matching으로 넘어갔다.',

legacy:[
 '**"DiT 백본 + flow matching 목표"의 표준 조합** — [DiT](#/p/dit) 계열 백본에 학습 목표만 갈아끼운 구성이 Stable Diffusion 3 이후 대형 생성 모델의 기본형이 됨',
 '**소수 스텝 생성으로의 접속** — 곧은 궤적은 [Consistency Model](#/p/consistency)이나 reflow 같은 증류 기법이 붙기 좋은 출발점이라, 1~4 스텝 생성 연구의 기반이 됨',
 '**비유클리드 확장** — 조건부 경로만 정의하면 되므로 리만 다양체, 이산 상태, 단백질 구조처럼 노이즈 확산을 정의하기 어려운 도메인으로 프레임이 확장됨',
 '**diffusion 문헌의 재정리** — [DDPM](#/p/ddpm)·[DDIM](#/p/ddim)·[Score SDE](#/p/score-sde)가 모두 특정 경로 선택의 사례로 재해석되며, 교재·강의의 설명 순서 자체가 바뀜'
],

pitfalls:[
 '**"직선 경로 = 1스텝 생성"이 아니다.** 직선인 것은 노이즈 $x_0$ 와 데이터 $x_1$ 을 **조건부로 잇는** 각각의 경로이고, 실제로 학습되는 주변(marginal) 벡터장의 궤적은 여전히 휘어 있다. 1스텝까지 가려면 reflow 반복이나 별도의 증류가 필요하다.',
 '**diffusion보다 항상 이기는 것은 아니다.** 논문의 이득은 동일 백본·동일 예산 비교에서 나온 것이고, 잘 튜닝된 diffusion 레시피(EDM 계열)와의 격차는 훨씬 작다. 실제 이득의 큰 부분은 "성능"보다 **튜닝할 것이 줄어드는 것**에 있다.',
 '**샘플링이 ODE라고 해서 솔버가 공짜는 아니다.** NFE는 솔버 차수와 스텝 배치에 여전히 민감하고, [CFG](#/p/cfg)를 세게 걸면 벡터장이 왜곡되어 곧음이 깨진다. diffusion에서 쓰던 guidance 스케일을 그대로 옮기면 저스텝 구간에서 결과가 무너지기 쉽다.'
],

links:[
 {t:'arXiv 2210.02747 — Flow Matching for Generative Modeling', u:'https://arxiv.org/abs/2210.02747'},
 {t:'arXiv 2209.03003 — Rectified Flow', u:'https://arxiv.org/abs/2209.03003'}
]
});
