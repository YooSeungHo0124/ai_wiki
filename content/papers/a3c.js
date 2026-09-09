WIKI.paper({
slug:'a3c',
venue:'ICML 2016',
authors:'Mnih et al. (Google DeepMind · Montreal Institute for Learning Algorithms)',
arxiv:'1602.01783',

tldr:'경험 재생 버퍼를 없애고, **여러 액터를 서로 다른 환경 복사본에서 비동기로 동시에 굴려** 샘플 상관을 깬 논문. GPU 없이 16코어 CPU 한 대로 [DQN](#/p/dqn)보다 짧은 시간에 더 높은 Atari 점수를 냈고, on-policy 정책 경사도 딥 RL에서 안정적으로 쓸 수 있음을 보였다.',

context:'[DQN](#/p/dqn) 이후 딥 RL의 표준 안정화 수단은 경험 재생이었다. 그런데 재생 버퍼에는 대가가 있다. **(1)** 100만 전이를 메모리에 들고 있어야 하고, **(2)** 버퍼 속 데이터는 과거 정책이 만든 것이라 학습 알고리즘이 반드시 **off-policy여야 한다** — 즉 Q-러닝 계열은 되지만 SARSA나 actor-critic 같은 on-policy 방법은 그대로 쓸 수 없다. 정책 경사 계열이 딥 RL에서 홀대받은 실질적 이유가 여기 있었다. 한편 당시 대규모 RL 학습의 대안은 Gorila 같은 **분산 클러스터**였는데, 수백 대의 머신을 전제로 해서 대부분의 연구자가 쓸 수 없었다. 이 논문의 질문은 두 개다 — 상관을 깨는 데 꼭 버퍼가 필요한가, 그리고 특별한 하드웨어 없이도 가능한가.',

ideas:[
 {h:'병렬 액터가 재생 버퍼를 대신한다',
  lead:'여러 액터가 서로 다른 국면에서 동시에 굴러 그래디언트 상관을 자연히 깬다.',
  d:'하나의 에이전트가 만드는 궤적은 시간적으로 강하게 상관돼 있다. 그런데 **16개 액터-러너 스레드가 각자 자기 환경 복사본에서 서로 다른 지점을 플레이하고 있으면**, 어느 한 순간에 모아지는 그래디언트들은 서로 다른 게임 국면·서로 다른 탐색 상태에서 나온 것이다. 즉 병렬성 자체가 디코릴레이션 장치다. 버퍼 없이 상관이 깨지므로 데이터를 **바로 쓰고 버릴 수 있고**, 그 결과 on-policy 알고리즘이 그대로 성립한다.'},
 {h:'액터마다 다른 탐색 정책',
  lead:'스레드마다 다른 ε을 줘 병렬성이 계산량과 탐색 다양성을 동시에 늘린다.',
  d:'각 스레드에 서로 다른 $\\epsilon$ 값(여러 분포에서 뽑음)을 주어 어떤 액터는 공격적으로 탐색하고 어떤 액터는 거의 탐욕적으로 행동하게 했다. 병렬성이 계산량뿐 아니라 **탐색의 다양성**까지 늘리는 셈이고, 이는 단일 에이전트의 $\\epsilon$ 스케줄 튜닝 부담을 덜어준다.'},
 {h:'비동기 갱신 — 락 없이 공유 파라미터에 그래디언트를 쏜다',
  lead:'각 스레드가 락 없이 공유 파라미터에 그래디언트를 더해 코어 수에 선형으로 확장한다.',
  d:'각 스레드는 공유 파라미터를 읽어 $t_{max}$ 스텝(논문 기본 5)만큼 굴린 뒤, 누적한 그래디언트를 공유 파라미터에 **락 없이(Hogwild! 방식)** 더한다. 스레드끼리 서로 덮어쓰는 경합이 생기지만 희소한 갱신에서는 무해하다는 것이 알려져 있었고, 실제로 동기화 오버헤드 없이 코어 수에 거의 선형으로 확장됐다. 파라미터 서버도, 머신 간 통신도 필요 없다.'},
 {h:'A3C — 어드밴티지 액터-크리틱',
  lead:'정책과 가치가 몸통을 공유하고 n-스텝 어드밴티지로 정책을 갱신한다.',
  d:'네 가지 비동기 변형(1-step Q, 1-step SARSA, n-step Q, 어드밴티지 액터-크리틱)을 모두 실험했고 마지막이 가장 좋았다. 정책 $\\pi(a|s)$ 와 가치 $V(s)$ 가 **CNN 몸통을 공유하고 머리만 두 개**인 구조다. 정책은 $n$-스텝 리턴에서 $V(s)$ 를 뺀 어드밴티지로 갱신되는데, $V$ 를 빼는 것은 분산을 줄이는 기준선(baseline) 역할이고 편향은 생기지 않는다. 여기에 정책 엔트로피 보너스를 더해 한 행동으로 조기에 수렴하는 것을 막는다.'},
 {h:'하드웨어를 낮춘 것 자체가 결과다',
  lead:'GPU와 재생 버퍼 없이 멀티코어 CPU만으로 여러 도메인을 학습시켰다.',
  d:'GPU 없이 **멀티코어 CPU 한 대**에서 돌아간다는 점이 실험 결과의 일부다. 재생 버퍼가 없으니 메모리도 거의 안 쓴다. Atari뿐 아니라 TORCS 레이싱, MuJoCo 연속 제어, 3D 미로(Labyrinth)까지 같은 프레임워크로 다뤄, 특정 도메인용 트릭이 아님을 보였다.'}
],

diagram:{type:'split', cap:'하나의 공유 파라미터를 여러 액터-러너가 비동기로 갱신한다. 병렬성이 곧 디코릴레이션 장치다.',
 from:{t:'공유 파라미터 θ, θ_v', s:'CNN 몸통 + 정책·가치 두 머리'},
 branches:[
  {t:'액터 1', s:'환경 사본 1 · ε=0.1'},
  {t:'액터 2', s:'환경 사본 2 · ε=0.01'},
  {t:'액터 3', s:'환경 사본 3 · ε=0.5'},
  {t:'…', s:'총 16 스레드'}
 ],
 join:'각자 5스텝 롤아웃 후 락 없이 그래디언트 누적 — 재생 버퍼 불필요'},

figures:[
 {f:'fig1-speedup-curves.png',
  cap:'x축은 학습 시간(시간 단위), y축은 게임 점수. 5개 Atari 게임 각각에 대해 GPU에서 돌린 DQN(파란선)과 CPU 16코어에서 돌린 4가지 비동기 방법을 겹쳐 그렸다. 노란선(A3C)이 대부분 게임에서 가장 이르게, 가장 높이 올라가는 것을 확인한다 — "GPU 없이도 더 빠르다"는 주장의 직접 증거.',
  src:'원문 Figure 1, p.5'}
],

quotes:[
 {t:'The best performing method, an asynchronous variant of actor-critic, surpasses the current state-of-the-art on the Atari domain while training for half the time on a single multi-core CPU instead of a GPU.',
  src:'Abstract, p.1'},
 {t:'While this shows that stable online Q-learning is possible without experience replay, which was used for this purpose in DQN, it does not mean that experience replay is not useful.',
  src:'Section 6 Conclusions, p.7'}
],

math:[
 {expr:'∇_θ log π(a_t|s_t; θ) · A(s_t, a_t),   A = Σ_{i=0}^{k−1} γⁱ r_{t+i} + γᵏ V(s_{t+k}) − V(s_t)',
  tex:'\\nabla_\\theta \\log\\pi(a_t|s_t;\\theta)\\,A(s_t,a_t),\\quad A=\\sum_{i=0}^{k-1}\\gamma^i r_{t+i}+\\gamma^k V(s_{t+k})-V(s_t)',
  d:'$k$-스텝 리턴에서 현재 가치 추정을 뺀 어드밴티지. $k$ 가 크면 편향이 줄고 분산이 늘며, 논문은 $t_{max}=5$ 를 기본으로 썼다. 몬테카를로와 1-스텝 TD 사이의 절충점이다.'},
 {expr:'L = L_policy + 0.5 · L_value − β · H(π(·|s))',
  tex:'L=L_{\\text{policy}}+0.5\\,L_{\\text{value}}-\\beta H(\\pi(\\cdot|s))',
  d:'정책 손실, 가치 회귀 손실, 엔트로피 보너스를 한 번에 최적화한다. $\\beta$ 는 0.01 수준으로, 엔트로피 항이 정책 분포가 너무 빨리 뾰족해지는 것을 막아 탐색을 유지한다.'}
],

numbers:[
 {k:'Atari 평가 게임', v:'57개', d:'6개 게임에서 하이퍼파라미터를 정한 뒤 나머지에 고정 적용'},
 {k:'하드웨어', v:'16 CPU 코어 · GPU 없음', d:'비교 대상 DQN 계열은 Nvidia K40 GPU 사용'},
 {k:'학습 시간', v:'절반 이하', d:'GPU 기반 기존 방법이 8~10일 걸린 결과를 A3C는 CPU 4일에 상회'},
 {k:'롤아웃 길이 t_max', v:'5 스텝', d:'이 길이만큼 굴린 뒤 그래디언트를 공유 파라미터에 적용'},
 {k:'엔트로피 계수 β', v:'0.01', d:'조기 결정론화 방지'},
 {k:'다룬 도메인', v:'Atari · TORCS · MuJoCo · Labyrinth', d:'이산·연속 행동, 2D·3D 관측을 같은 프레임워크로'}
],

impact:'두 가지가 바뀌었다. **(1) 진입 장벽** — GPU 클러스터 없이 노트북급 CPU로 Atari 에이전트를 학습할 수 있게 되면서 deep RL 연구자 수가 크게 늘었다. **(2) 알고리즘 지형** — 재생 버퍼 제약이 사라지자 on-policy 액터-크리틱이 딥 RL의 1급 시민이 됐고, 곧이어 [TRPO](#/p/trpo)/[PPO](#/p/ppo) 계열이 이 병렬 액터 구조 위에 얹혀 표준이 된다. 오늘날 "여러 환경을 벡터화해 동시에 굴린다"는 구현 관행 자체가 A3C에서 왔다.',

legacy:[
 '**A2C** — 비동기를 버리고 액터들의 롤아웃을 동기적으로 모아 배치로 처리하는 단순화 버전. GPU에서는 이쪽이 오히려 빠르다는 것이 밝혀지며 실무 기본형이 됨',
 '**[PPO](#/p/ppo)** — A3C의 병렬 액터 데이터 수집 구조를 그대로 쓰고 갱신 규칙만 clipped surrogate로 교체',
 '**[RLHF 원형](#/p/rlhf-prefs)** — 인간 선호 기반 보상 학습 실험에서 병렬 액터로 궤적을 모으는 이 구조가 그대로 활용됨',
 '**IMPALA / Ape-X** — 비동기 액터와 중앙 학습자를 분리하고 off-policy 보정(V-trace)이나 우선순위 재생을 더해 대규모로 확장'
],

pitfalls:[
 '**"비동기"가 성능의 원인은 아니다.** 후속 연구에서 동기 버전(A2C)이 같거나 더 나은 성능을 내는 것이 확인되면서, 실제 이득은 비동기성이 아니라 **여러 환경을 병렬로 굴려 배치를 다양화한 것**에 있었다는 해석이 정착했다. 논문 제목의 "asynchronous"를 핵심 기여로 오해하기 쉽다.',
 '**샘플 효율은 오히려 나쁘다.** on-policy라 모든 전이를 한 번 쓰고 버린다. 벽시계 시간은 짧아졌지만 필요한 **환경 상호작용 총량**은 재생 버퍼를 쓰는 [DQN](#/p/dqn) 계열보다 많다. 시뮬레이터가 싸면 유리하고, 실제 로봇처럼 상호작용이 비싼 환경에서는 불리하다.',
 '**재현이 특히 어려운 알고리즘이다.** 스레드 수, OS 스케줄링, 락 없는 갱신의 경합 패턴이 결과에 영향을 주므로 같은 코드도 머신이 다르면 곡선이 달라진다. deep RL 전반의 시드 민감성 문제 위에 **비결정적 병렬성**이 하나 더 얹힌 셈이라, 보고된 점수를 그대로 재현하려는 시도는 대체로 실패했다.'
],

links:[
 {t:'arXiv 1602.01783 — Asynchronous Methods for Deep Reinforcement Learning', u:'https://arxiv.org/abs/1602.01783'},
 {t:'ICML 2016 proceedings (PMLR v48)', u:'https://proceedings.mlr.press/v48/mniha16.html'},
 {t:'OpenAI Baselines — A2C가 A3C를 대체한 이유', u:'https://openai.com/index/openai-baselines-acktr-a2c/'}
]
});
