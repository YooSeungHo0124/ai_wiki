WIKI.paper({
slug:'impala',
venue:'ICML 2018',
authors:'Espeholt et al. (DeepMind)',
arxiv:'1802.01561',

tldr:'[A3C](#/p/a3c)처럼 워커가 그래디언트를 중앙 서버로 보내는 대신, 행위자(actor)가 **경험 궤적 전체**를 학습자(learner)로 보내 GPU에서 배치로 학습하는 구조. 이 결정 하나로 행위자 정책과 학습자 정책이 어긋나는 정책 지연(policy lag)이 생기는데, 이를 V-trace라는 오프폴리시 보정으로 바로잡아 초당 25만 프레임이라는 처리량과 안정적 학습을 동시에 얻었다.',

context:'[A3C](#/p/a3c)와 그 파생 알고리즘은 각 워커가 로컬로 그래디언트를 계산해 중앙 파라미터 서버로 보내는 비동기 SGD 방식이었다. 문제는 두 가지다. 첫째, 그래디언트 통신은 대역폭을 많이 먹고 워커가 GPU를 충분히 활용하지 못한다 — 렌더링 시간이 워커마다 들쭉날쭉해 배치 동기화 방식(Batched A2C)은 가장 느린 워커에 전체가 발목 잡힌다. 둘째, 수십 개 태스크를 하나의 에이전트로 동시에 학습하려면 [A3C](#/p/a3c)식 수억~수십억 프레임·며칠 단위의 학습 시간은 비현실적이다. IMPALA는 "그래디언트 대신 경험 자체를 보내면 어떻게 되는가"라는 질문에서 출발한다.',

ideas:[
 {h:'행위자는 궤적을, 학습자는 배치를 — 완전한 역할 분리',
  lead:'행위자가 $n$ 스텝 궤적 전체를 큐로 보내면 학습자가 GPU에서 배치로 소비한다.',
  d:'각 행위자는 학습자의 최신 정책 $\\pi$ 로 로컬 정책 $\\mu$ 를 갱신한 뒤 $n$ 스텝을 굴려 상태·행동·보상 궤적과 그때의 행동 확률 $\\mu(a_t|x_t)$ 를 함께 큐로 보낸다. 학습자는 여러 행위자에서 모인 궤적을 배치로 묶어 GPU에서 한 번에 처리하므로, 시간 차원을 배치 차원에 접어(fold) 컨볼루션과 완전연결층을 병렬화할 수 있다. A3C처럼 그래디언트를 보내는 게 아니라 **경험을 보낸다**는 것이 핵심 설계 결정이다.'},
 {h:'정책 지연(policy lag)이라는 필연적 대가',
  lead:'학습자가 배치를 처리하는 동안 행위자 정책은 이미 여러 스텝 뒤처진다.',
  d:'행위자가 궤적을 보낸 시점의 정책 $\\mu$ 와, 학습자가 실제로 그 데이터를 학습에 쓰는 시점의 정책 $\\pi$ 사이에는 갱신 여러 번의 간격이 생긴다. 이는 데이터가 **오프폴리시**가 됐다는 뜻이고, 그대로 온폴리시 알고리즘(A3C의 policy gradient)을 적용하면 편향이 생긴다.'},
 {h:'V-trace: 끊어낸 중요도가중치로 지연을 보정한다',
  lead:'중요도가중치 $\\rho_t$, $c_i$ 를 상한 $\\bar\\rho$, $\\bar c$ 로 잘라 분산을 억제한다.',
  d:'V-trace는 TD 오차 $\\delta_tV=\\rho_t(r_t+\\gamma V(x_{t+1})-V(x_t))$ 를 절단된 중요도가중치 $\\rho_t=\\min(\\bar\\rho,\\pi/\\mu)$ 로 가중하고, 그 이전 시점으로 전파하는 계수도 별도로 절단된 $c_i=\\min(\\bar c,\\pi/\\mu)$ 를 쓴다. 두 절단 상한의 역할이 다르다 — $\\bar\\rho$ 는 수렴하는 목표 정책 자체를 결정하고, $\\bar c$ 는 수렴 속도(분산)만 조절한다. $\\pi=\\mu$ 인 온폴리시 극한에서는 $\\rho_t=c_i=1$ 이 되어 표준 $n$-스텝 벨만 갱신으로 정확히 환원된다.'},
 {h:'수백 개 CPU 행위자 + GPU 학습자라는 비대칭 자원 배치',
  lead:'값싼 CPU 렌더링과 비싼 GPU 텐서 연산을 물리적으로 분리해 활용률을 높인다.',
  d:'Atari 같은 환경은 렌더링·게임 로직이 텐서 연산보다 훨씬 싸다. 이를 같은 프로세스에서 동기적으로 묶으면(Batched A2C) 렌더링 시간 편차 때문에 GPU가 논다. IMPALA는 렌더링을 CPU 행위자 수백 대에, 학습을 GPU 학습자 소수에 완전히 분리해 GPU를 계속 바쁘게 만든다.'}
],

diagram:{type:'compare', cap:'A3C는 워커가 계산한 그래디언트를 파라미터 서버와 주고받는다. IMPALA는 행위자가 궤적(경험)을 학습자에게 보내고, 학습자만 GPU에서 갱신한다.',
 left:{t:'A3C: 그래디언트 공유', items:['워커가 로컬 그래디언트 계산','중앙 서버에 비동기 전송','서버가 파라미터 갱신 후 배포']},
 right:{t:'IMPALA: 경험 공유', items:['행위자는 궤적만 생성·전송','학습자 GPU가 배치로 소비','V-trace로 정책 지연 보정']}},

math:[
 {expr:'v_s = V(x_s) + Σ_{t=s}^{s+n-1} γ^(t-s) (Π_{i=s}^{t-1} c_i) δ_t V,   δ_t V = ρ_t (r_t + γV(x_{t+1}) − V(x_t))',
  tex:'v_s \\;=\\; V(x_s) + \\sum_{t=s}^{s+n-1}\\gamma^{t-s}\\Big(\\prod_{i=s}^{t-1}c_i\\Big)\\delta_t V,\\qquad \\delta_t V=\\rho_t\\big(r_t+\\gamma V(x_{t+1})-V(x_t)\\big)',
  d:'V-trace 목표값. $\\rho_t=\\min(\\bar\\rho,\\pi(a_t|x_t)/\\mu(a_t|x_t))$, $c_i=\\min(\\bar c,\\pi(a_i|x_i)/\\mu(a_i|x_i))$ 는 절단된 중요도가중치. $\\pi=\\mu$ 이고 $\\bar c\\ge 1$ 이면 모든 $c_i=\\rho_t=1$ 이 되어 온폴리시 $n$-스텝 벨만 타깃 $\\sum\\gamma^{t-s}r_t+\\gamma^nV(x_{s+n})$ 으로 정확히 환원된다.'},
 {expr:'policy gradient ∝ ρ_s ∇log π(a_s|x_s) [r_s + γv_{s+1} − V(x_s)]',
  tex:'\\rho_s\\,\\nabla_\\omega\\log\\pi_\\omega(a_s|x_s)\\big(r_s+\\gamma v_{s+1}-V_\\theta(x_s)\\big)',
  d:'정책 파라미터 갱신 방향. 어드밴티지 자리에 V-trace 타깃 $v_{s+1}$ 을 쓰고, 그 스텝의 중요도가중치 $\\rho_s$ 로 다시 한 번 스케일한다 — 가치함수 학습과 정책 학습이 같은 $v_s$ 를 공유하지만 가중치 적용 방식은 다르다.'}
],

numbers:[
 {k:'처리량', v:'250,000 FPS', d:'최적화된 학습자 1개(P100 GPU) 기준. [A3C](#/p/a3c) 대비 30배 이상, 하루 210억 프레임'},
 {k:'단일머신 처리량 비교', v:'IMPALA 17K~21K FPS', d:'CPU 48개 동일 조건에서 A3C 6.5K~9K FPS, Batched A2C 9K~16K FPS'},
 {k:'DMLab-30 · 멀티태스크', v:'59.7% (mean capped)', d:'IMPALA deep multi-task 단일 가중치. A3C deep experts(태스크별 전문가) 대비 오히려 근접·역전'},
 {k:'DMLab-30 wall-clock', v:'~10시간 vs 7.5일', d:'학습자 1개 IMPALA가 A3C가 7.5일에 도달하는 성능에 10시간 만에 도달'},
 {k:'8-GPU 학습자 확장', v:'30K → 210K FPS', d:'학습자를 1개에서 8개로 늘려 약 7배 처리량 증가(deep 모델)'},
 {k:'Atari-57 중앙값', v:'IMPALA deep multi-task 59.7%', d:'IMPALA deep experts(태스크별 개별학습)는 191.8% median · 957.6% mean, up to 30 no-op 시작'}
],

impact:'분산 강화학습에서 "그래디언트를 나눌 것인가, 경험을 나눌 것인가"라는 갈림길에서 후자를 택하고 그 대가(정책 지연)를 명시적인 오프폴리시 보정으로 해결하는 설계 패턴을 확립했다. V-trace는 상태가치 함수 $V$ 만으로 오프폴리시 보정을 하기 때문에 [Retrace](https://arxiv.org/abs/1606.02647)처럼 $Q$ 함수가 필요 없고, actor-critic 구조에 바로 얹을 수 있다. [Ape-X](#/p/apex)가 경험 재생을 분산시켰다면 IMPALA는 정책 기반 학습 자체를 분산시키면서 그 사이의 이론적 구멍(지연)까지 메웠다는 점이 다르다.',

legacy:[
 '**R2D2·SEED RL** — IMPALA의 액터-학습자 분리를 계승해 LSTM 상태 처리, TPU 학습자 등으로 처리량을 더 키움',
 '**멀티태스크 RL의 증거** — DMLab-30에서 관찰된 태스크 간 양의 전이(positive transfer)가 이후 범용 에이전트 연구의 근거로 인용됨',
 '**V-trace의 일반화** — Retrace류의 절단된 중요도가중치 기법이 이후 다양한 오프폴리시 actor-critic에 재사용됨',
 '**PBT(population-based training)와의 결합** — 하이퍼파라미터를 학습 도중 진화시키는 기법이 IMPALA 대규모 실험에서 실용성을 입증'
],

pitfalls:[
 '**V-trace는 "완전한 온폴리시로 되돌린다"는 뜻이 아니다.** 절단 상한 $\\bar\\rho$ 가 유한하면 수렴하는 값함수는 정책 $\\pi$ 가 아니라 $\\mu$ 와 $\\pi$ 사이 어딘가의 정책 $\\pi_{\\bar\\rho}$ 에 대한 것이다 — $\\bar\\rho\\to\\infty$ 일 때만 정확히 타깃 정책의 값함수가 된다.',
 '**$\\bar\\rho$ 와 $\\bar c$ 의 역할을 혼동하기 쉽다.** $\\bar\\rho$ 는 수렴점(어떤 정책의 값함수로 수렴하는지)을 결정하고, $\\bar c$ 는 그 수렴점까지 가는 속도(분산)만 조절한다 — 둘을 같은 값으로 놓아도 되지만 의미는 다르다.',
 '**DMLab-30의 "59.7%"는 멀티태스크 단일 모델 점수이고, 191.8%는 태스크별 전문가(expert) 점수다.** 같은 논문의 Table 3·4에서 이 둘을 섞어 인용하면 안 된다 — 전자는 30개 태스크를 하나의 가중치로, 후자는 게임마다 별도로 학습한 결과다.'
],

figures:[
 {f:'fig1-single-learner.png',
  cap:'행위자(작은 원)들이 관측을 받아 궤적을 만들고 화살표로 표시된 큐를 통해 학습자(가운데 큰 원)로 보낸다. 학습자는 그 반대 방향으로 최신 파라미터만 돌려준다 — 그래디언트가 오가는 A3C 그림(원문 Figure 1 우측)과 화살표 방향이 다르다는 점이 핵심.',
  src:'원문 Figure 1(왼쪽), p.2'},
 {f:'fig2-timeline.png',
  cap:'(a)(b)는 액터를 스텝/궤적 단위로 동기화하는 Batched A2C — 주황(역전파) 사이에 파란 블록 길이가 들쭉날쭉해 가장 느린 액터가 전체를 묶어둔다. (c) IMPALA는 액터가 학습자와 비동기로 돌아가 이런 대기 시간이 없다.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'Unlike the popular A3C-based agents, in which workers communicate gradients with respect to the parameters of the policy to a central parameter server, IMPALA actors communicate trajectories of experience to a centralised learner.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 1802.01561 — IMPALA', u:'https://arxiv.org/abs/1802.01561'},
 {t:'GitHub — deepmind/scalable_agent', u:'https://github.com/deepmind/scalable_agent'}
]
});
