WIKI.paper({
slug:'td3',
venue:'ICML 2018',
authors:'Fujimoto, van Hoof & Meger (McGill Univ.)',
arxiv:'1802.09477',

tldr:'[DQN](#/p/dqn)류에서 잘 알려진 Q값 과대추정(overestimation bias)이 [DDPG](#/p/ddpg) 같은 연속제어 actor-critic에도 그대로 발생함을 이론과 실험으로 보이고, 쌍둥이 크리틱의 최솟값·지연된 정책 갱신·타깃 정책 평활화라는 세 처방으로 바로잡은 논문. 알고리즘 이름 TD3(Twin Delayed DDPG)는 DDPG에 이 세 가지를 얹은 것에 불과하지만 MuJoCo 벤치마크 전반에서 DDPG를 압도적으로 앞섰다.',

context:'이산 행동 공간의 [DQN](#/p/dqn)에서는 $\\max_{a}$ 연산 때문에 함수근사 오차가 있으면 Q값이 체계적으로 과대추정된다는 것이 잘 알려져 있었고 Double DQN이 해법이었다. 그런데 [DDPG](#/p/ddpg) 같은 연속제어 actor-critic은 명시적인 $\\max$ 대신 정책 네트워크의 그래디언트 상승으로 행동을 고르기 때문에, 같은 문제가 있는지 불분명했다. 이 논문은 먼저 결정적 정책 그래디언트 갱신도 근사 오차 때문에 필연적으로 과대추정을 유발한다는 것을 수식으로 증명하고, DDPG로 Hopper·Walker2d를 학습시키며 실제 Q값 추정치가 참값보다 계속 높게 벌어지는 것을 확인한다. 게다가 이산 행동의 해법인 Double DQN을 actor-critic에 그대로 옮기면(타깃 정책이 현재 정책과 거의 같은 속도로 바뀌므로) 효과가 거의 없다는 것도 함께 보인다.',

ideas:[
 {h:'쌍둥이 크리틱의 최솟값 (Clipped Double Q-learning)',
  lead:'크리틱을 두 개 학습시켜 타깃 계산 시 더 작은 값을 써서 과대추정을 억누른다.',
  d:'크리틱 $Q_{\\theta_1}, Q_{\\theta_2}$ 를 각각 독립적으로 학습시키되, TD 타깃을 계산할 때 $\\min(Q_{\\theta_1\\prime},Q_{\\theta_2\\prime})$ 를 쓴다. Double DQN처럼 별도 정책으로 행동을 고르는 게 아니라 **같은 타깃 정책이 고른 같은 행동에 대해 두 크리틱 중 작은 값**을 취하므로, 둘 중 하나라도 과대추정이 아니면 그 값이 선택돼 편향을 줄인다. 대신 과소추정 쪽으로 편향되는 대가가 있는데, 논문은 이 편향이 정책 학습에 전파되지 않아 과대추정보다 훨씬 덜 해롭다고 주장한다.'},
 {h:'지연된 정책 갱신 (Delayed Policy Updates)',
  lead:'크리틱을 $d$번 갱신할 때마다 정책은 1번만 갱신해 부정확한 값 위에서 정책을 고치는 일을 줄인다.',
  d:'가치추정 오차가 큰 상태에서 정책을 갱신하면 그 오차가 정책에 그대로 새겨지고, 다음 크리틱 갱신도 그 나쁜 정책이 만든 데이터를 보게 되는 악순환이 생긴다. TD3는 크리틱을 매 스텝 갱신하되 정책과 타깃 네트워크는 $d$스텝(논문 기본값 2)에 한 번만 갱신해, 크리틱의 오차가 어느 정도 가라앉은 뒤에 정책을 움직이게 한다. 이 자체는 새 손실함수가 아니라 **갱신 빈도의 비대칭**일 뿐이다.'},
 {h:'타깃 정책 평활화 (Target Policy Smoothing)',
  lead:'타깃 행동에 클리핑된 노이즈를 더해 좁은 값 스파이크에 과적합하지 않게 만든다.',
  d:'결정적 정책은 크리틱의 좁고 뾰족한 값 스파이크에 쉽게 과적합한다 — 그 지점만 살짝 잘못 추정돼도 정책이 그리로 끌려갈 수 있다. TD3는 SARSA 스타일로, 타깃 행동 $\\pi_{\\phi\\prime}(s\\prime)$ 에 $\\text{clip}(\\mathcal N(0,\\sigma),-c,c)$ 노이즈를 더한 뒤 크리틱을 평가한다. 이는 "비슷한 행동은 비슷한 값을 가져야 한다"는 사전 지식을 학습 타깃에 명시적으로 주입하는 정규화다.'}
],

diagram:{type:'compare', cap:'DDPG의 단일 크리틱·매 스텝 정책 갱신·평활화 없음 구조 대비, TD3가 세 곳을 동시에 고친 지점.',
 left:{t:'DDPG', items:['크리틱 1개 → 과대추정 누적','정책 매 스텝 갱신','타깃 행동에 평활화 없음']},
 right:{t:'TD3', items:['쌍둥이 크리틱의 min','정책은 d스텝마다 지연 갱신','타깃 행동에 클리핑 노이즈 추가'], acc:true}},

math:[
 {expr:'y = r + γ · min_{i=1,2} Q_θi\'(s\', ã),   ã = π_φ\'(s\') + ε,   ε ~ clip(N(0,σ̃), -c, c)',
  tex:'y = r + \\gamma \\min_{i=1,2} Q_{\\theta_i^{\\prime}}(s^{\\prime}, \\tilde a),\\qquad \\tilde a = \\pi_{\\phi^{\\prime}}(s^{\\prime}) + \\varepsilon,\\;\\; \\varepsilon\\sim\\text{clip}(\\mathcal N(0,\\tilde\\sigma), -c, c)',
  d:'TD3의 타깃값 하나에 세 아이디어가 전부 들어 있다 — $\\min$이 클리핑된 더블 Q, $\\varepsilon$ 노이즈가 타깃 정책 평활화, 그리고 이 타깃 자체는 $d$스텝마다만 정책 갱신에 쓰인다(지연 갱신).'},
 {expr:'φ_approx = φ + (α/Z₁) E[∇_φπ_φ(s) ∇_a Q_θ(s,a)|_{a=π_φ(s)}]',
  tex:'\\phi_{\\text{approx}} = \\phi + \\frac{\\alpha}{Z_1}\\,\\mathbb E_{s\\sim p_\\pi}\\big[\\nabla_\\phi \\pi_\\phi(s)\\,\\nabla_a Q_\\theta(s,a)|_{a=\\pi_\\phi(s)}\\big]',
  d:'근사 크리틱 $Q_\\theta$ 로 얻는 실제 정책 갱신. 같은 식에서 $Q_\\theta$ 를 참값 $Q^\\pi$ 로 바꾼 $\\phi_{\\text{true}}$ 와 비교해, 저자들은 $\\mathbb E[Q_\\theta(s,\\pi_{\\text{approx}}(s))]\\ge \\mathbb E[Q^\\pi(s,\\pi_{\\text{approx}}(s))]$ 임을 증명한다 — 결정적 정책 그래디언트도 과대추정에서 자유롭지 않다는 뜻.'}
],

numbers:[
 {k:'HalfCheetah-v1 최대 평균 리턴', v:'TD3 9636.95', d:'DDPG 3305.60 · SAC 2347.19 · PPO 1795.43 (100만 스텝, 10 시드 중 최고)'},
 {k:'Ant-v1 최대 평균 리턴', v:'TD3 4372.44', d:'DDPG 1005.30 — DDPG가 특히 취약한 환경. TD3는 4배 이상'},
 {k:'평가 방식', v:'10개 랜덤 시드', d:'OpenAI Gym MuJoCo, 각 100만 타임스텝. Table 1은 시드 중 최댓값 평균 ± 표준편차'},
 {k:'지연 간격', v:'d = 2', d:'크리틱 2회 갱신마다 정책·타깃 네트워크 1회 갱신'},
 {k:'평활화 노이즈', v:'N(0, 0.2), clip ±0.5', d:'타깃 행동에 더하는 노이즈. 탐험 노이즈(N(0,0.1))와는 별개'},
 {k:'InvertedDoublePendulum', v:'TD3 9337.47 ≈ DDPG 9355.52', d:'단순 과제에서는 개선 폭이 크지 않음 — 이미 포화된 벤치마크'}
],

impact:'"알고리즘을 새로 만들지 않고 기존 알고리즘의 편향 원인을 진단해 최소 개입으로 고친다"는 접근이 연속제어 RL의 사실상 표준 베이스라인을 바꿨다. TD3는 이후 [SAC](#/p/sac)와 함께 연속제어 실험의 기본 baseline 두 축이 되었고, 쌍둥이 크리틱+최솟값 타깃은 SAC를 포함한 이후 거의 모든 continuous actor-critic 알고리즘에 그대로 채택되는 표준 부품이 되었다.',

legacy:[
 '**쌍둥이 크리틱이 표준이 됨** — [SAC](#/p/sac)를 비롯해 이후 연속제어 actor-critic 대부분이 크리틱 두 개 + min을 기본으로 채택',
 '**TD3+BC 등 오프라인 RL로 확장** — TD3의 안정화 기법이 오프라인 강화학습 알고리즘의 베이스로 재사용됨',
 '**하이퍼파라미터 없는 벤치마크 관행 정착** — 논문이 강조한 "시드 수를 명시하고 공정하게 비교하라"는 방법론 자체가 이후 RL 논문의 재현성 기준으로 자리잡음',
 '**Rainbow식 애블레이션 문화의 연속제어 버전** — 세 요소 각각의 기여도를 애블레이션으로 분리한 방식이 이후 알고리즘 논문의 표준 형식이 됨'
],

pitfalls:[
 '**TD3는 [DDPG](#/p/ddpg)의 손실함수나 정책구조를 바꾸지 않는다.** 결정적 정책·경험재생·타깃 네트워크는 그대로다 — 바뀐 것은 타깃값 계산 방식과 갱신 빈도뿐이라는 점을 "새 알고리즘"으로 과장하면 안 된다.',
 '**과소추정 편향이 없는 것이 아니라 "덜 해로운 쪽으로 편향시킨 것"이다.** min을 쓰면 두 크리틱 중 낮은 쪽이 항상 선택되므로 체계적 과소추정이 생기지만, 논문은 이것이 정책에 전파되지 않아 과대추정보다 안전하다고 주장할 뿐 편향 자체가 사라진다고 말하지 않는다.',
 '**[SAC](#/p/sac)와 TD3는 같은 시기(2018)에 독립적으로 등장했고 지향점이 다르다.** TD3는 결정적 정책 + 명시적 노이즈 주입으로 안정성을 얻고, SAC는 엔트로피 정규화가 있는 확률적 정책으로 탐험과 안정성을 함께 얻는다 — 둘 다 쌍둥이 크리틱을 쓰지만 정책 자체의 성격이 다르다.'
],

figures:[
 {f:'fig1-overestimation.png',
  cap:'주황 DDPG의 추정값(굵은 선)이 실제 값(점선, True DDPG)보다 계속 위에서 벌어지는 반면, 파란 Clipped Double Q(CDQ, TD3의 전신)는 추정값과 실제값이 훨씬 가깝게 붙어간다 — 과대추정이 실측으로 확인되는 지점.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'We show that this problem persists in an actor-critic setting and propose novel mechanisms to minimize its effects on both the actor and the critic.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1802.09477 — Addressing Function Approximation Error in Actor-Critic Methods', u:'https://arxiv.org/abs/1802.09477'},
 {t:'GitHub — sfujim/TD3 (저자 구현)', u:'https://github.com/sfujim/TD3'}
]
});
