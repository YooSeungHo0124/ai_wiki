WIKI.paper({
slug:'meanflow',
venue:'arXiv 2025 (CMU · MIT)',
authors:'Geng, Deng, Bai, Kolter, He (CMU · MIT)',
arxiv:'2505.13447',

tldr:'[Flow Matching](#/p/flow-matching)의 **순간 속도**(instantaneous velocity) 대신 **평균 속도**(average velocity)라는 새 필드를 정의하고, 둘 사이의 정확한 항등식(MeanFlow Identity)을 유도해 신경망 학습 목표로 그대로 쓰는 논문. 증류도, 사전학습도, 커리큘럼도 없이 **처음부터 1-NFE(단일 함수 호출) 생성**을 학습하며, ImageNet 256×256에서 이전 소수 스텝 방법 대비 50~70% 상대 개선된 FID를 낸다.',

context:'[Flow Matching](#/p/flow-matching)과 diffusion은 매 시점 $t$ 에서의 **순간 속도** $v(z_t,t)$ 를 배운 뒤, 그것을 ODE 솔버로 적분해 샘플을 만든다. 순간 속도만으로는 큰 스텝을 밟을수록 이산화 오차가 커지므로 스텝 수를 줄이기 어렵다. [일관성 모델](#/p/consistency)은 궤적 위 임의의 점이 같은 끝점을 내놓도록 강제하는 **일관성 제약**으로 이 문제를 우회했지만, 이 제약은 "네트워크의 행동이 이래야 한다"는 요구일 뿐 그 밑바탕에 있는 **정답 필드**가 무엇인지는 말해주지 않는다. 그래서 학습이 불안정해지고, 시간 구간을 점점 좁혀가는 이산화 커리큘럼 같은 세심한 장치가 필요했다. 저자들의 질문은 다르다 — **순간 속도 대신 "구간 평균 속도"라는 필드를 직접 정의하면, 그 필드가 만족해야 할 항등식에서 학습 목표가 저절로 나오지 않는가?**',

ideas:[
 {h:'평균 속도: 변위를 시간 구간으로 나눈 것',
  lead:'r에서 t까지 순간 속도를 적분한 변위를 시간 간격으로 나눈 새 필드를 정의한다.',
  d:'순간 속도 $v(z_t,t)$ 가 경로의 접선 방향이라면, 평균 속도 $u(z_t,r,t)$ 는 시점 $r$ 과 $t$ 사이의 **변위**를 시간 간격 $t-r$ 로 나눈 값이다. 정의상 $v$ 를 적분한 함수일 뿐 신경망과 무관한, 경로 자체가 갖는 성질이다. $r\\to t$ 극한에서 $u\\to v$ 로 수렴하고, [일관성 모델](#/c/consistency-c)의 일관성 조건에 해당하는 가산성($\\int_r^t = \\int_r^s+\\int_s^t$)도 정의에서 자동으로 따라온다 — **제약이 아니라 정의의 귀결**이라는 점이 다르다.'},
 {h:'MeanFlow Identity: 평균 속도가 만족하는 정확한 항등식',
  lead:'평균 속도를 시간으로 미분하면 순간 속도와 평균 속도를 잇는 등식이 나온다.',
  d:'정의식 $(t-r)u=\\int_r^t v\\,d\\tau$ 의 양변을 $t$ 에 대해 미분하면(곱의 법칙 + 미적분학의 기본정리), $u(z_t,r,t)=v(z_t,t)-(t-r)\\frac{d}{dt}u(z_t,r,t)$ 라는 등식이 나온다. 우변은 신경망이 근사해야 할 **타깃의 형태**를 직접 제공한다 — 적분을 계산할 필요 없이, 순간 속도 하나와 $u$ 자신의 시간 전미분만 있으면 된다.'},
 {h:'JVP 한 번으로 시간 전미분을 계산한다',
  lead:'전미분을 자코비안-벡터곱(JVP)으로 풀어 역전파 한 번의 비용으로 목표를 만든다.',
  d:'$\\frac{d}{dt}u=\\partial_z u\\cdot v+\\partial_t u$ 로 전개되는데, 이는 $u_\\theta$ 의 야코비안과 접벡터 $[v,0,1]$ 의 **자코비안-벡터곱(JVP)** 이다. `torch.func.jvp`/`jax.jvp` 로 forward-mode 미분 한 번에 계산되며, 타깃 전체에 stop-gradient를 걸어 이중 역전파(higher-order gradient)를 피한다. 실측 오버헤드는 전체 학습 시간의 20% 미만이라고 보고한다.'},
 {h:'t=r이면 그냥 Flow Matching으로 환원된다',
  lead:'특수 조건 t=r에서 두 번째 항이 사라져 표준 flow matching 손실과 정확히 일치한다.',
  d:'손실은 $\\Vert u_\\theta(z_t,r,t)-\\text{sg}(u_{tgt})\\Vert^2$ 이고 $u_{tgt}=v_t-(t-r)(v_t\\partial_z u_\\theta+\\partial_t u_\\theta)$ 이다. $t=r$ 로 제한하면 둘째 항이 $0$ 이 되어 표준 conditional flow matching 손실로 정확히 축소된다 — MeanFlow는 Flow Matching의 **일반화**이지 별개의 손실이 아니다. 샘플링은 적분 대신 $z_r=z_t-(t-r)u_\\theta(z_t,r,t)$ 한 스텝으로 끝난다.'},
 {h:'classifier-free guidance를 타깃 필드 자체에 흡수한다',
  lead:'CFG를 샘플링 시점의 후처리가 아니라 평균 속도 필드의 정의에 포함시켜 NFE를 늘리지 않는다.',
  d:'일반적인 CFG는 조건부·무조건부 두 예측을 매 샘플링 스텝마다 계산해 선형결합해야 해서 NFE가 두 배로 는다. MeanFlow는 CFG로 유도된 속도장을 **평균 속도의 정의 자체**에 포함시켜, 1-NFE 샘플링을 유지한 채로 guidance 효과를 얻는다.'}
],

diagram:{type:'compare', cap:'같은 flow 경로를 순간 속도로 적분할지, 평균 속도로 한 번에 건너뛸지의 차이.',
 left:{t:'Flow Matching: 순간 속도', items:[
  'v(z_t,t) 학습, ODE로 적분',
  '스텝마다 이산화 오차 누적',
  '적은 스텝이면 궤적이 휘어 부정확',
  '증류해야 few-step 가능']},
 right:{t:'MeanFlow: 평균 속도', items:[
  'u(z_t,r,t) 직접 학습',
  '정의에서 나온 항등식이 곧 손실',
  '1스텝: z_0 = z_1 − u(z_1,0,1)',
  '증류·사전학습 없이 처음부터 학습']}},

math:[
 {expr:'u(z_t, r, t) := (1/(t−r)) ∫_r^t v(z_τ, τ) dτ',
  tex:'u(z_t, r, t) \\;\\triangleq\\; \\frac{1}{t-r}\\int_{r}^{t} v(z_\\tau,\\tau)\\,d\\tau',
  d:'평균 속도의 정의(식 3). $r\\to t$ 이면 $u\\to v$ 로 순간 속도에 수렴한다. 신경망과 무관하게 순간 속도장 $v$ 로부터 정의되는 함수다.'},
 {expr:'u(z_t,r,t) = v(z_t,t) − (t−r)·d/dt[u(z_t,r,t)]',
  tex:'\\underbrace{u(z_t,r,t)}_{\\text{average vel.}} = \\underbrace{v(z_t,t)}_{\\text{instant. vel.}} - (t-r)\\underbrace{\\frac{d}{dt}u(z_t,r,t)}_{\\text{time derivative}}',
  d:'MeanFlow Identity(식 6). 정의식을 $t$ 로 미분해 얻는다. 우변이 손실의 회귀 타깃 형태를 그대로 준다 — 적분을 몰라도 $v$ 와 $u$ 자신의 시간 미분만 있으면 계산 가능하다.'},
 {expr:'L(θ) = E‖ u_θ(z_t,r,t) − sg(u_tgt) ‖²,  u_tgt = v_t − (t−r)(v_t·∂_z u_θ + ∂_t u_θ)',
  tex:'L(\\theta) = \\mathbb{E}\\left\\Vert u_\\theta(z_t,r,t) - \\text{sg}(u_{tgt}) \\right\\Vert^2, \\quad u_{tgt} = v_t - (t-r)\\left(v_t\\,\\partial_z u_\\theta + \\partial_t u_\\theta\\right)',
  d:'실제 학습 손실(식 9~11). $v_t$ 는 conditional velocity로 대체된 값이고 $\\partial_z u_\\theta,\\partial_t u_\\theta$ 는 JVP로 한 번에 계산된다. $t=r$ 이면 둘째 항이 사라져 표준 Flow Matching 손실과 정확히 일치한다.'}
],

numbers:[
 {k:'ImageNet 256² · 1-NFE FID', v:'3.43', d:'처음부터 학습, classifier-free guidance 포함, 1회 함수 평가만 사용'},
 {k:'vs IMM 1-step FID', v:'7.77 → 3.43', d:'같은 1-step/1-NFE 범주에서 [IMM](#/p/imm)(DiT-XL/2, w=1.25) 대비 50% 이상 상대 개선'},
 {k:'vs Shortcut 1-NFE FID', v:'10.60 → 3.43', d:'이전 1-NFE 최고 대비 약 70% 상대 개선'},
 {k:'ImageNet 256² · 2-NFE FID', v:'2.20', d:'250스텝짜리 [DiT](#/p/dit)-XL/2(FID 2.27), SiT-XL/2(FID 2.15)와 동급 — 같은 XL/2 백본, NFE는 250×2 대 2'},
 {k:'JVP 추가 학습 비용', v:'20% 미만', d:'JAX 구현 기준, 전체 학습 시간 대비 forward-mode JVP의 오버헤드'}
],

impact:'few-step 생성의 기준을 "네트워크 출력이 어떤 제약을 만족해야 하는가"에서 "그 밑에 있는 필드가 애초에 무엇인가"로 옮겼다. 순간 속도만 다루던 Flow Matching의 시야를 평균 속도로 확장해, 1-NFE 생성을 증류·일관성 제약 없이 순수한 회귀 문제로 환원했다. NFE 2로도 250-스텝 [DiT](#/p/dit)/[SiT](#/p/flow-matching)에 준하는 FID를 내면서, "다단계 diffusion/flow와 1스텝 생성 사이의 격차를 상당 부분 좁혔다"고 스스로 평가한다.',

legacy:[
 '**"제약이 아니라 정의에서 나온 항등식"이라는 설계 원칙 확산** — [일관성 모델](#/p/consistency)이 행동 제약으로 시작한 것과 달리, 이후 few-step 연구가 "정답 필드가 만족하는 항등식"을 먼저 찾는 방식을 시도하는 계기',
 '**[IMM](#/p/imm)과 함께 증류 없는 few-step 계보의 두 축을 형성** — IMM이 분포 수준 모멘트 매칭으로 일반화했다면, MeanFlow는 속도장의 재정의로 접근해 서로 다른 수학적 뿌리에서 같은 목표(교사 없는 1-step 학습)에 도달',
 '**CFG를 타깃 필드에 흡수하는 아이디어의 재사용 가능성** — guidance를 샘플링 후처리가 아니라 학습 목표에 내재화하는 방식이 다른 few-step 프레임워크에도 적용 가능한 일반적 기법으로 제시됨',
 '**JVP 기반 학습의 실용성 입증** — forward-mode 자동미분이 대규모 생성 모델 학습에서 20% 미만의 오버헤드로 실용적임을 보여, 고차 미분을 요구하는 다른 목적함수 설계에도 참고 사례가 됨'
],

pitfalls:[
 '**"증류 없이 1스텝"이라는 점에서 일관성 모델과 같은 범주로 보이지만, 학습 목표의 근거가 다르다.** 일관성 모델은 궤적 위 두 점의 출력이 같아야 한다는 **행동 제약**에서 출발하고, MeanFlow는 평균 속도라는 **필드의 정의**에서 항등식을 유도한다 — 결과가 비슷해 보여도 안정성의 근거는 다른 층위에 있다.',
 '**JVP를 이용한 타깃 계산은 자동미분 프레임워크의 forward-mode 지원에 의존한다.** stop-gradient로 이중 역전파는 피하지만, JVP 자체가 없는 환경에서는 이 구현을 그대로 옮길 수 없다.',
 '**2-NFE FID(2.20)가 250-step 모델과 "동급"이라는 비교는 같은 XL/2 백본·같은 데이터셋 조건에서의 비교다.** 다른 아키텍처·해상도로 일반화된 결론이 아니다.'
],

figures:[
 {f:'fig3-average-velocity.png',
  cap:'왼쪽: 순간 속도 v(파란 화살표, 경로의 접선)와 평균 속도 u(주황, 변위 (t-r)u 방향)가 서로 다른 방향을 가리킨다는 것을 보여준다. 오른쪽 세 그림: 같은 필드 u(z,r,t)를 t=0.5, 0.7, 1.0으로 고정하고 r을 바꿔가며 그린 것 — u가 r과 t 모두에 의존하는 2변수 필드임을 시각화한다.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'We introduce the notion of average velocity to characterize flow fields, in contrast to instantaneous velocity modeled by Flow Matching methods.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2505.13447 — Mean Flows for One-step Generative Modeling', u:'https://arxiv.org/abs/2505.13447'}
]
});
