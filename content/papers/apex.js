WIKI.paper({
slug:'apex',
venue:'ICLR 2018',
authors:'Horgan et al. (DeepMind)',
arxiv:'1803.00933',

tldr:'행위자(actor) 수백 개가 각자 다른 탐험 정책으로 병렬로 경험을 생성하고, 학습자(learner) 하나가 우선순위가 매겨진 그 경험을 GPU에서 소비하도록 [DQN](#/p/dqn)의 경험 재생을 완전히 분산시킨 구조. 학습 알고리즘은 그대로 두고 **데이터 생성량만 두 자릿수로 늘려도** Atari 성능이 크게 오른다는 것을 보였다.',

context:'[프리오리타이즈드 경험 재생](#/p/dqn)은 TD 오차가 큰 전이를 더 자주 샘플링해 학습 효율을 높였지만 단일 머신 안에서였다. 반면 [Gorila](#/p/deepmind-lab)나 [A3C](#/p/a3c)류는 액터를 늘려 데이터를 병렬로 모으는 데는 성공했지만, 우선순위 재생과 결합하지 않았거나 그래디언트 자체를 비동기로 공유하는 구조라 확장에 한계가 있었다. 질문은 단순하다 — **"학습 알고리즘은 그대로 두고, 액터 수만 수백 개로 늘리면 무슨 일이 일어나는가?"** 이 논문은 액터가 생성하는 초당 프레임 수와 최종 성능 사이의 관계를 직접 측정해 답한다.',

ideas:[
 {h:'행위자·학습자 분리: 생성과 소비를 완전히 나눈다',
  lead:'수백 개 행위자가 경험만 생성하고, GPU 학습자 하나가 그것만 소비한다.',
  d:'행위자는 각자 자기 환경 인스턴스를 갖고 정책을 굴려 전이를 생성한 뒤 공유 재생 메모리로 보낸다. 학습자는 그 메모리에서 표본을 뽑아 네트워크를 갱신하고, 갱신된 파라미터를 주기적으로(약 400프레임, ∼2.8초마다) 행위자에게 되돌려준다. 그래디언트를 공유하는 [A3C](#/p/a3c) 방식과 달리 **경험만 공유**하므로 행위자와 학습자가 서로 다른 데이터센터에 있어도 성능 손실 없이 동작한다.'},
 {h:'행위자 각자가 우선순위를 스스로 계산한다',
  lead:'액터가 로컬 네트워크로 TD 오차를 직접 계산해 초기 우선순위를 붙인다.',
  d:'기존 프리오리타이즈드 재생은 새 전이의 우선순위를 일단 최댓값으로 초기화하고 학습자가 나중에 갱신했다. 액터가 수백 개면 학습자가 우선순위를 매길 때까지 기다리는 비용이 커진다. 대신 각 액터가 이미 굴리고 있는 자기 정책 네트워크로 TD 오차를 즉시 계산해 우선순위를 붙이므로, 추가 비용 없이 더 정확한 우선순위가 재생 메모리에 곧바로 들어간다.'},
 {h:'행위자마다 다른 탐험률: 다양성 자체가 자원이다',
  lead:'액터마다 서로 다른 $\\epsilon$ 값을 고정해 다양한 전략의 경험을 동시에 모은다.',
  d:'각 액터 $i$ 는 $\\epsilon_i=\\epsilon^{1+\\frac{i}{N-1}\\alpha}$ 로 정해지는 서로 다른 $\\epsilon$-greedy 정책을 학습 내내 유지한다($\\epsilon=0.4$, $\\alpha=7$). 우선순위 재생이 공유 메모리에서 가장 유용한 경험을 골라내는 역할을 하므로, 개별 액터가 최적일 필요 없이 **집단으로 다양한 전략을 시도**하기만 하면 된다.'},
 {h:'재생 메모리를 소프트 용량 제한으로 굴린다',
  lead:'용량 200만을 넘겨도 액터 전송은 막지 않고 FIFO로 일괄 정리한다.',
  d:'공유 재생 메모리 용량은 200만 전이로 소프트 제한된다. 새 데이터 추가는 액터 속도를 늦추지 않기 위해 항상 허용하고, 대신 학습 100스텝마다 초과분을 FIFO 순서로 한꺼번에 제거한다. 실측 메모리 크기는 평균 2,035,050으로 목표치 근처에서 안정적으로 유지된다.'}
],

diagram:{type:'flow', cap:'액터(수백 개)가 환경을 굴려 경험과 초기 우선순위를 재생 메모리로 보내고, 학습자 하나가 우선순위 표본을 뽑아 갱신한 뒤 파라미터를 액터에 되돌린다.',
 nodes:[
  {t:'액터 × 수백', s:'각자 환경 인스턴스', acc:true},
  {t:'초기 우선순위', s:'로컬 TD 오차', a:'생성 경험'},
  {t:'공유 재생 메모리', s:'~200만 전이'},
  {t:'학습자 (GPU 1개)', s:'우선순위 표본 학습', a:'파라미터'},
  {t:'액터로 회신', s:'~400프레임마다'}
 ]},

math:[
 {expr:'ε_i = ε^(1 + i/(N-1)·α)',
  tex:'\\epsilon_i=\\epsilon^{1+\\frac{i}{N-1}\\alpha}',
  d:'$N$개 액터 중 $i$번째의 탐험률. $\\epsilon=0.4$, $\\alpha=7$을 쓰면 액터마다 거의 탐욕적인 정책부터 매우 무작위적인 정책까지 고르게 퍼진다.'},
 {expr:'G_t = R_{t+1} + γR_{t+2} + ... + γ^(n-1)R_{t+n} + γ^n·q(S_{t+n}, π(S_{t+n},φ⁻), ψ⁻)',
  tex:'G_t=\\underbrace{R_{t+1}+\\gamma R_{t+2}+\\dots+\\gamma^{n-1}R_{t+n}+\\gamma^{n}q(S_{t+n},\\pi(S_{t+n},\\phi^{-}),\\psi^{-})}_{\\text{multi-step return}}',
  d:'Ape-X DPG(연속제어 버전)에서 쓰는 $n$-스텝 부트스트랩 타깃. Ape-X DQN도 같은 형태의 멀티스텝 손실을 쓴다($n=3$).'}
],

numbers:[
 {k:'액터 수 · 총 FPS', v:'360대 · ~50K FPS', d:'액터당 CPU 1코어, 약 139 FPS. action repeat 4로 실제 전이는 ~12.5K/s'},
 {k:'Atari 중앙값 (no-op)', v:'434%', d:'57게임 human-normalized 중앙값. 훈련 5일·376코어+GPU 1개, 총 22.8B 프레임'},
 {k:'Atari 중앙값 (human starts)', v:'358%', d:'더 어려운 human-starts 기준에서도 전 baseline 대비 최고'},
 {k:'Rainbow 대비', v:'Rainbow 223% (no-op)', d:'[Rainbow](#/p/rainbow)는 단일 GPU·200M 프레임·10일 학습. Ape-X가 절반 학습 시간에 두 배 가까운 점수'},
 {k:'재생 메모리 용량', v:'~200만 전이', d:'소프트 제한. 실측 평균 크기 2,035,050'},
 {k:'연속제어 총 처리량', v:'~22K 전이/초', d:'Ape-X DPG, 액터 64개, 초당 86 배치(256 전이) 처리'}
],

impact:'분산 강화학습을 "그래디언트를 나눈다"에서 "경험을 나눈다"로 재정의했다. 액터와 학습자를 분리하고 그 사이를 우선순위 붙은 경험 스트림으로만 연결하는 구조는 이후 [IMPALA](#/p/impala)의 액터-학습자 구조, R2D2, 그리고 산업용 대규모 RL 파이프라인의 표준 골격이 되었다. 알고리즘(DQN, DPG) 자체는 하나도 바꾸지 않고 오직 데이터 생성 규모만 키워 SOTA를 갱신했다는 점이 핵심 메시지다.',

legacy:[
 '**R2D2** — Ape-X의 분산 구조에 LSTM과 recurrent 상태 저장을 결합해 부분관측 환경으로 확장',
 '**[IMPALA](#/p/impala)** — 같은 액터-학습자 분리를 정책 기반 알고리즘에 적용하면서 V-trace로 정책 지연을 정면으로 다룸',
 '**연속제어로의 확장** — Ape-X DPG는 이후 분포적 가치함수와 결합한 후속 연구(D4PG)로 이어짐',
 '**"스케일이 곧 알고리즘 개선"이라는 관점** — 새 손실함수 없이 데이터량만으로 SOTA를 넘을 수 있다는 선례가 이후 RL 인프라 연구의 정당성이 됨'
],

pitfalls:[
 '**"액터가 많을수록 무조건 좋다"가 아니다.** 논문은 액터 수를 늘릴수록 데이터 생성 속도가 선형으로 느는 것(부록 Figure 11)과 최종 성능이 느는 것을 따로 보고한다 — 우선순위 재생이 있어야 그 데이터를 실제로 성능으로 바꿀 수 있다.',
 '**학습 알고리즘 자체는 [DQN](#/p/dqn)/DPG와 동일하다.** Ape-X는 새로운 RL 알고리즘이 아니라 기존 알고리즘의 분산 실행 아키텍처다 — 이 논문이 제안한 것은 손실함수가 아니라 데이터 파이프라인이다.',
 '**Table 1의 자원(376코어+GPU 1개)과 학습 시간(5일)은 baseline들과 절대적으로 비교하기 어렵다.** baseline마다 코어 수·GPU 종류가 다르므로, "5일 만에 SOTA"라는 문장은 계산 자원 총량이 아니라 wall-clock 기준이라는 점을 구분해야 한다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'파란 Learner와 초록 Replay 사이는 "표본"과 "갱신된 우선순위"만 오가고, 빨간 Actor(여러 겹으로 그려져 다수를 표현)는 자기 환경에서 생성한 경험과 초기 우선순위를 Replay로 보내며 Learner로부터는 네트워크 파라미터만 받는다 — 네 화살표가 이 논문의 데이터 흐름 전부다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig2-score-vs-time.png',
  cap:'x축이 학습 시간(시간), y축이 57게임 human-normalized 중앙값. Ape-X DQN(파란 점 3개, 20/70/120시간)이 Rainbow·C51·Prioritized DQN·Gorila·DQN보다 훨씬 짧은 시간에 훨씬 높은 점수에 도달함을 한눈에 보여준다.',
  src:'원문 Figure 2(왼쪽), p.5'}
],

quotes:[
 {t:'The algorithm decouples acting from learning: the actors interact with their own instances of the environment by selecting actions according to a shared neural network, and accumulate the resulting experience in a shared experience replay memory; the learner replays samples of experience and updates the neural network.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1803.00933 — Distributed Prioritized Experience Replay', u:'https://arxiv.org/abs/1803.00933'},
 {t:'DeepMind blog — Ape-X', u:'https://www.deepmind.com/blog'}
]
});
