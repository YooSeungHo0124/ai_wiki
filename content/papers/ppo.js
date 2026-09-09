WIKI.paper({
slug:'ppo',
venue:'arXiv 2017 (OpenAI)',
authors:'Schulman et al. (OpenAI)',
arxiv:'1707.06347',

tldr:'[TRPO](#/p/trpo)의 KL 신뢰영역을 **확률비를 잘라내는(clip) 목적함수 한 줄**로 근사한 논문. 켤레 경사도 Fisher 행렬도 line search도 없이 1차 SGD만으로 비슷한 안정성을 얻으면서, 구현이 단순하다는 이유 하나로 정책 경사법의 사실상 표준이 되었다.',

context:'2017년 시점에 on-policy 정책 최적화의 선택지는 셋이었다. 바닐라 정책 경사는 스텝 크기에 극도로 민감하고, [A3C](#/p/a3c) 계열은 데이터를 한 번 쓰고 버려 샘플 효율이 낮으며, [TRPO](#/p/trpo)는 잘 되지만 **구현이 무겁다**. TRPO는 KL 제약을 지키려고 Fisher-vector product 기반 켤레 경사와 백트래킹 line search를 돌리는데, 이 2차 최적화 절차는 코드가 길고 디버깅이 어려우며 dropout이나 파라미터 공유 같은 흔한 구조와 잘 맞지 않는다. 논문이 던지는 질문은 실용적이다 — **TRPO가 하려던 일(정책이 한 번에 너무 크게 변하지 않게 막기)을, 1차 최적화만으로 할 수 없는가?**',

ideas:[
 {h:'clipped surrogate — 개선의 인센티브를 잘라낸다',
  lead:'확률비가 일정 범위를 벗어나면 목적을 상수로 만들어 경사를 없앤다.',
  d:'확률비 $r_t(\\theta) = \\pi_\\theta(a_t|s_t)/\\pi_{old}(a_t|s_t)$ 를 $[1-\\epsilon, 1+\\epsilon]$ 구간으로 자른 목적을 만들고, **자르지 않은 값과 자른 값 중 작은 쪽(min)** 을 취한다. 어드밴티지가 양수인 행동에 대해 비율이 $1+\\epsilon$ 을 넘으면 목적이 상수가 되어 **더 밀어봐야 이득이 없어진다**. 정책을 물리적으로 못 움직이게 막는 것이 아니라, 일정 범위를 벗어난 갱신에서 **경사를 0으로 만들어** 인센티브를 제거하는 방식이다.'},
 {h:'min을 취하는 이유 — 나빠지는 방향은 안 자른다',
  lead:'하한을 취해 정책이 나쁜 방향으로 벗어났을 때는 clip을 풀어준다.',
  d:'clip만 하고 min을 안 취하면 정책이 이미 나쁜 쪽으로 크게 벗어났을 때도 목적이 평평해져 되돌아오지 못한다. min은 **하한(pessimistic bound)** 을 취하는 장치라서, 갱신이 성능을 해치는 방향일 때는 clip이 풀려 정상적인 경사가 되살아난다. 한 줄짜리 수식이지만 이 비대칭이 알고리즘의 안정성 대부분을 담당한다.'},
 {h:'같은 데이터로 여러 에폭 — 샘플 효율의 출처',
  lead:'clip이 과도한 이탈을 막아줘서 같은 궤적을 K 에폭 재학습해도 안전하다.',
  d:'TRPO는 한 배치로 한 번만 갱신한다. PPO는 clip이 과도한 이탈을 막아주므로, 모아둔 궤적을 **미니배치로 쪼개 K 에폭(보통 3~10회) 반복 학습**해도 무너지지 않는다. 같은 환경 상호작용에서 더 많은 갱신을 뽑아내는 것이 PPO가 A3C 계열보다 샘플 효율이 좋은 직접적인 이유다.'},
 {h:'적응형 KL 페널티 — 채택되지 않은 다른 후보',
  lead:'KL 계수를 목표에 맞춰 자동 조절하는 대안도 실험했지만 clip이 더 나았다.',
  d:'논문은 clip 말고 **KL 페널티 계수를 목표 KL에 맞춰 자동 조절하는 변형**도 함께 제시하고 비교했다. 실험에서 clip 쪽이 더 나았고, 하이퍼파라미터도 $\\epsilon$ 하나뿐이라 이쪽이 표준이 되었다. 다만 KL 페널티 버전은 나중에 LLM 정렬에서 참조 모델과의 거리를 통제하는 형태로 다시 등장한다.'},
 {h:'단일 손실 함수, 단일 옵티마이저',
  lead:'정책·가치·엔트로피 손실을 하나로 합쳐 표준 지도학습 루프처럼 돌린다.',
  d:'정책 손실 · 가치 함수 회귀 손실 · 엔트로피 보너스를 **하나의 스칼라로 합쳐 Adam으로 최적화**한다. 즉 전체가 표준 지도학습 루프와 구조적으로 동일하다. 병렬 액터로 궤적을 모으고, GAE로 어드밴티지를 계산하고, 이 손실을 몇 에폭 돌린다 — 100줄 남짓이면 쓸 수 있다는 점이 이 논문의 실질적 기여다.'}
],

diagram:{type:'compare', cap:'같은 목표(정책 변화 억제)를 2차 제약으로 강제할 것인가, 1차 목적함수로 유도할 것인가',
 left:{t:'TRPO: KL 제약 + 2차 최적화', items:[
  'Fisher 행렬 · 켤레 경사법 필요',
  '매 갱신마다 line search로 제약 검증',
  '배치당 한 번만 갱신 → 샘플 효율 낮음',
  '파라미터 공유·dropout과 잘 안 맞음']},
 right:{t:'PPO: clip 목적함수', items:[
  '확률비를 일정 범위로 clip',
  '1차 SGD(Adam)만으로 갱신',
  '같은 데이터로 K 에폭 재사용',
  '하이퍼파라미터는 사실상 $\\epsilon$ 하나']}},

figures:[
 {f:'fig1-clip-objective.png',
  cap:'x축은 확률비 $r=\\pi_\\theta/\\pi_{old}$, y축은 $L^{CLIP}$의 한 항(단일 타임스텝) 값. 빨간 점이 $r=1$(현재 정책)인 시작점이다. 왼쪽(A>0, 좋은 행동)은 $r$이 커질수록 $L^{CLIP}$이 같이 커지다가 $1+\\epsilon$을 넘는 순간 완전히 평평해진다 — 그 이상 밀어붙여도 목적이 늘지 않으니 경사가 0이 되어 갱신 인센티브가 사라진다. 오른쪽(A<0, 나쁜 행동)은 대칭으로, $r$이 $1-\\epsilon$ 아래로 내려가면 평평해진다. 두 그래프 모두 정책이 $\\epsilon$ 범위를 벗어나 "이득을 보는" 방향으로 더 가려 할 때만 클립이 걸리고, 손해를 줄이는 방향(그래프에서 꺾이지 않고 계속 내려가는/올라가는 구간)은 클립되지 않는다는 것이 min을 취하는 이유다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig2-ablation.png',
  cap:'x축은 실제 PPO 한 스텝에서 $\\theta_{old}$에서 갱신된 $\\theta$까지 선형 보간한 위치(0=갱신 전, 1=갱신 후), y축은 그 지점에서 각 목적함수 값. 주황선 $L^{CPI}$(clip 없는 원래 목적)는 보간이 진행될수록 계속 커져서 이대로 최적화하면 정책이 한없이 멀어짐을 보여준다. 빨간선 $L^{CLIP}$은 보간factor≈1(실제 PPO가 멈춘 지점) 근처에서 최대가 된 뒤 꺾여 내려가는데, 이는 그 이상 갱신하면 KL이 너무 커져 clip이 개선 인센티브를 없앤다는 뜻 — 즉 clip이 실제로 갱신 크기를 원하는 지점 근처에서 멈추게 만드는 것을 경험적으로 보여주는 그래프다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'We propose a novel objective with clipped probability ratios, which forms a pessimistic estimate (i.e., lower bound) of the performance of the policy.',
  src:'Introduction, p.1'},
 {t:'The parameters 1.5 and 2 above are chosen heuristically, but the algorithm is not very sensitive to them.',
  src:'Section 4, p.4'}
],

math:[
 {expr:'L^CLIP(θ) = E[ min( r_t(θ)·A_t ,  clip(r_t(θ), 1−ε, 1+ε)·A_t ) ]',
  tex:'L^{CLIP}(\\theta)=\\mathbb{E}\\left[\\min\\!\\left(r_t(\\theta)A_t,\\ \\text{clip}(r_t(\\theta),1-\\epsilon,1+\\epsilon)A_t\\right)\\right]',
  d:'논문 전체가 이 한 줄이다. $A_t > 0$ 이면 비율이 $1+\\epsilon$ 이상으로 못 올라가고, $A_t < 0$ 이면 $1-\\epsilon$ 아래로 못 내려간다. min 때문에 clip은 **정책이 이득 보는 방향으로만** 작동한다.'},
 {expr:'L = L^CLIP − c₁·(V_θ(s) − V_target)² + c₂·H(π_θ(·|s))',
  tex:'L=L^{CLIP}-c_1\\left(V_\\theta(s)-V_{target}\\right)^2+c_2\\,H(\\pi_\\theta(\\cdot|s))',
  d:'실제로 최적화하는 합산 손실. 가치 함수 손실과 엔트로피 보너스가 같은 그래프에 들어가며, 몸통 네트워크를 공유하는 경우 $c_1$ 의 균형이 중요해진다.'},
 {expr:'Â_t = δ_t + (γλ)δ_{t+1} + … ,   δ_t = r_t + γV(s_{t+1}) − V(s_t)',
  tex:'\\begin{aligned}\\hat{A}_t &= \\delta_t + (\\gamma\\lambda)\\delta_{t+1} + \\cdots \\\\ \\delta_t &= r_t + \\gamma V(s_{t+1}) - V(s_t)\\end{aligned}',
  d:'PPO 구현이 거의 항상 함께 쓰는 GAE(Generalized Advantage Estimation). $\\lambda$ 로 편향-분산을 조절하며, 이 추정기의 품질이 PPO 성능에 clip 못지않게 영향을 준다.'}
],

numbers:[
 {k:'clip 범위 ε', v:'0.2', d:'논문과 이후 구현의 사실상 기본값'},
 {k:'재사용 에폭 K', v:'3 (Atari) / 10 (연속 제어)', d:'모은 궤적을 미니배치로 나눠 반복 학습'},
 {k:'연속 제어 벤치마크', v:'MuJoCo 7개 과제 · 100만 스텝', d:'TRPO·A2C·CEM·바닐라 PG와 비교'},
 {k:'Atari 벤치마크', v:'49개 게임', d:'A2C·ACER와 비교해 학습 속도·최종 점수에서 우위'},
 {k:'GAE λ', v:'0.95 수준', d:'어드밴티지 추정의 편향-분산 절충 계수'}
],

impact:'**단순함이 표준을 만든 대표 사례다.** PPO는 TRPO보다 이론적으로 강하지 않고 어떤 벤치마크에서는 성능도 비슷하지만, 100줄로 구현되고 기존 딥러닝 코드에 그대로 얹힌다는 이유로 거의 모든 RL 라이브러리의 기본 알고리즘이 되었다. 결과적으로 이후 10년간 "RL을 붙여야 할 새 문제"가 나오면 첫 시도는 대체로 PPO다. 로봇 제어, 게임(OpenAI Five), 그리고 결정적으로 **언어 모델 정렬**까지 — PPO는 알고리즘이라기보다 인프라에 가까운 위치에 올랐다.',

legacy:[
 '**[InstructGPT](#/p/instructgpt) / RLHF의 기본 알고리즘** — 보상 모델 점수를 최대화하되 참조 정책에서 KL로 벗어나지 않도록 하는 언어 모델 정렬 파이프라인이 PPO 위에 구축되었고, 이것이 ChatGPT 계열 모델의 학습 절차가 됨. [요약 RLHF](#/p/summarize-hf), [Llama 2](#/p/llama2)까지 같은 골격을 따름',
 '**[DPO](#/p/dpo)** — RLHF에서 PPO 루프 자체를 제거하고 선호 데이터로 직접 정책을 최적화하는 방향. PPO의 구현·튜닝 부담이 동기였음',
 '**[GRPO](#/p/grpo)** — PPO에서 가치 네트워크를 없애고 그룹 내 상대 보상으로 어드밴티지를 대체, 추론 모델 RL의 표준이 되며 [DeepSeek-R1](#/p/deepseek-r1)로 이어짐',
 '**대규모 게임 에이전트** — OpenAI Five(Dota 2) 등 수개월 규모 학습에서 PPO가 그대로 확장 가능함이 확인되며 실전 검증'
],

pitfalls:[
 '**clip은 KL 제약이 아니다.** clip은 비율이 범위를 벗어난 샘플의 경사를 죽일 뿐, 정책이 실제로 얼마나 변했는지를 보증하지 않는다. 여러 에폭을 돌리면 KL이 목표치를 크게 초과하는 일이 흔해서, 실무 구현은 대부분 **KL을 별도로 측정해 조기 종료(early stopping)** 하는 장치를 따로 넣는다.',
 '**"PPO의 성능은 clip에서 온다"는 것이 검증되지 않았다.** [Implementation Matters](https://arxiv.org/abs/2005.12729) 등의 후속 분석은 관측 정규화, 보상 스케일링, 어드밴티지 정규화, 학습률 감쇠, 직교 초기화 같은 **논문에 강조되지 않은 구현 세부를 제거하면 PPO가 TRPO 수준으로 떨어진다**고 보고했다. 알고리즘 이름이 아니라 코드베이스가 성능을 설명하는 전형적 사례다.',
 '**RL 결과 비교에서 시드는 필수 정보다.** deep RL은 랜덤 시드에 따라 학습 곡선이 질적으로 달라지며, 소수 시드의 평균만 보고 알고리즘 우열을 주장하면 재현되지 않는다. PPO 대 TRPO처럼 근소한 차이를 다루는 비교일수록 시드 수와 분산을 함께 봐야 한다.'
],

links:[
 {t:'arXiv 1707.06347 — Proximal Policy Optimization Algorithms', u:'https://arxiv.org/abs/1707.06347'},
 {t:'Implementation Matters in Deep RL: A Case Study on PPO and TRPO', u:'https://arxiv.org/abs/2005.12729'},
 {t:'The 37 Implementation Details of PPO (ICLR blog track)', u:'https://iclr-blogposts.github.io/2022/blog/2022/the-37-implementation-details-of-proximal-policy-optimization/'}
]
});
