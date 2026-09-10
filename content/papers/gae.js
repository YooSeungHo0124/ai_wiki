WIKI.paper({
slug:'gae',
venue:'ICLR 2016',
authors:'Schulman, Moritz, Levine, Jordan, Abbeel (UC Berkeley)',
arxiv:'1506.02438',

tldr:'정책 경사(policy gradient)에서 advantage 추정값의 **편향과 분산을 하나의 파라미터 $\\lambda$ 로 조절**하는 방법. 몬테카를로 리턴(분산은 크지만 편향 없음)과 1-스텝 TD 잔차(편향은 있지만 분산 작음) 사이를 매끄럽게 오가며, 고차원 연속 제어(3D 보행)를 안정적으로 학습시켰다.',

context:'정책 경사 방법은 보상을 직접 미분해 최적화하지만 실무에서 두 문제에 부딪힌다. 하나는 **샘플 효율** — 원시 리턴을 그대로 쓰면 분산이 너무 커서 유효 신호를 얻으려면 엄청난 수의 롤아웃이 필요하다. 다른 하나는 **학습 안정성** — 함수 근사가 비정상(nonstationary) 데이터에 적응하며 정책이 한 스텝에 무너지기 쉽다. 분산을 줄이려고 가치함수를 baseline으로 빼는 것은 이미 흔했지만, 그 가치함수를 **얼마나 신뢰해서 얼마나 멀리 내다볼지**를 정하는 원칙적인 방법이 없었다. 리턴을 통째로 쓰면(몬테카를로) 편향은 없지만 분산이 크고, 1-스텝 TD 잔차만 쓰면 분산은 작지만 가치함수가 부정확한 만큼 편향이 낀다.',

ideas:[
 {h:'TD 잔차의 지수가중합으로 advantage를 만든다',
  lead:'$\\delta_t=r_t+\\gamma V(s_{t+1})-V(s_t)$ 를 $(\\gamma\\lambda)^l$ 로 감쇠시켜 무한히 더한다.',
  d:'각 스텝의 TD 잔차 $\\delta_t^V$ 는 그 자체로 낮은 분산의(그러나 편향 있는) advantage 추정값이다. $k$-스텝을 내다본 추정값들을 $(1-\\lambda)\\lambda^{k-1}$ 가중치로 지수평균 내면, 대수적으로 정리했을 때 $\\delta$ 들을 $(\\gamma\\lambda)^l$ 로 감쇠시켜 더한 아주 단순한 형태가 된다. `TD(λ)`가 가치함수를 이런 식으로 추정하는 것과 정확히 같은 구조를, 여기서는 advantage 함수에 적용한다.'},
 {h:'$\\lambda$ 는 편향-분산을, $\\gamma$ 는 시야(effective horizon)를 조절한다',
  lead:'두 파라미터가 같은 트레이드오프에 관여하지만 역할이 다르다.',
  d:'$\\lambda=0$ 이면 1-스텝 TD 잔차 하나만 쓰는 `GAE(γ,0)` 가 되어 분산은 최소지만 $V$ 가 부정확하면 편향이 크다. $\\lambda=1$ 이면 몬테코를로 리턴에서 baseline만 뺀 `GAE(γ,1)` 이 되어 $V$ 의 정확도와 무관하게 편향이 없지만(γ-just) 항들의 합이라 분산이 크다. $0<\\lambda<1$ 은 그 사이 어디쯤에서 타협한다. 실험적으로 $\\lambda$ 의 최적 범위가 $\\gamma$ 보다 훨씬 넓은데, $\\lambda$ 가 도입하는 편향이 $\\gamma$ 가 도입하는 편향(할인 자체가 바꾸는 목적함수)보다 작기 때문이다.'},
 {h:'가치함수도 신뢰영역(trust region)으로 학습한다',
  lead:'정책뿐 아니라 가치함수 업데이트도 이전 배치에 과적합하지 않도록 신뢰영역으로 제약한다.',
  d:'advantage 추정이 가치함수 $V_\\phi$ 에 의존하므로, $V_\\phi$ 를 매 반복 최신 배치에 회귀로 과적합시키면 다음 반복의 advantage 추정이 왜곡된다. 저자들은 [TRPO](#/p/trpo)와 같은 신뢰영역 방식으로 $V_\\phi$ 도 제한된 폭만 갱신하게 했다. 정책 업데이트에는 갱신 **이전**의 $V_{\\phi_i}$ 를 쓰는데, 먼저 업데이트해 버리면 극단적으로 $V$ 가 벨만 잔차를 0으로 만들어 정책 경사 자체가 사라지는 퇴화가 생기기 때문이다.'},
 {h:'보상 함수 재구성으로서의 해석',
  lead:'할인 계수 $\\gamma$ 를 도입하는 것은 원래 MDP의 보상을 $-\\gamma$ 배로 변형한 것과 같다고 보인다.',
  d:'논문은 $\\gamma$ 를 쓴 advantage 추정이 원래 목적함수가 아니라 변형된 보상 함수를 최적화하는 것과 동치임을 증명한다. 이 관점에서 GAE는 "미래를 얼마나 할인해서 볼지"와 "가치함수를 얼마나 믿을지"를 분리해서 다루는 하나의 일관된 틀이 된다.'},
 {h:'3D 연속 제어로 검증',
  lead:'카트폴부터 이족·사족 로봇 보행까지, 손으로 짠 정책 없이 신경망만으로 학습시켰다.',
  d:'MuJoCo 물리 엔진 위에서 33차원 상태의 이족 로봇, 29차원 사족 로봇을 대상으로 안정적인 걸음걸이와 기립 동작을 처음부터(from scratch) 학습시켰다. 정책과 가치함수 모두 3-hidden-layer 피드포워드 신경망(100·50·25 tanh)이며, 손으로 만든 특징이나 모방학습 시드 없이 순수 강화학습만으로 이뤄냈다는 점이 당시로서는 드물었다.'}
],

diagram:{type:'flow', cap:'GAE를 쓴 반복 하나의 흐름. λ=0과 λ=1은 이 지수가중합의 두 극단이다.',
 nodes:[
  {t:'롤아웃 N스텝', s:'현재 정책으로 수집'},
  {t:'TD 잔차 계산', s:'δt = rt+γV(st+1)-V(st)'},
  {t:'지수가중 합산', s:'(γλ)^l 감쇠', acc:true, note:'λ가 편향·분산 조절'},
  {t:'TRPO 정책 갱신', s:'advantage 사용'},
  {t:'가치함수 갱신', s:'신뢰영역으로 회귀'}
 ]},

math:[
 {expr:'δt = rt + γV(st+1) - V(st)',
  tex:'\\delta_t^{V} = r_t + \\gamma V(s_{t+1}) - V(s_t)',
  d:'현재 가치함수 기준 TD 잔차. 그 자체가 낮은 분산의 advantage 추정값이다.'},
 {expr:'GAE(γ,λ) = Σ_{l=0}^∞ (γλ)^l · δ(t+l)',
  tex:'\\hat A_t^{\\text{GAE}(\\gamma,\\lambda)} = \\sum_{l=0}^{\\infty} (\\gamma\\lambda)^l\\,\\delta_{t+l}^{V}',
  d:'k-스텝 advantage 추정값들을 $(1-\\lambda)\\lambda^{k-1}$ 가중치로 지수평균 낸 결과를 대수적으로 정리하면 이 형태가 된다.'},
 {expr:'GAE(γ,0)=δt,   GAE(γ,1)=Σγ^l·r(t+l) - V(st)',
  tex:'\\text{GAE}(\\gamma,0):\\hat A_t=\\delta_t \\qquad \\text{GAE}(\\gamma,1):\\hat A_t=\\sum_{l=0}^{\\infty}\\gamma^l r_{t+l}-V(s_t)',
  d:'$\\lambda=0$ 은 분산 최소·편향 有(1-스텝 TD), $\\lambda=1$ 은 편향 無·분산 大(몬테카를로). $0<\\lambda<1$ 이 그 사이의 절충이다.'}
],

numbers:[
 {k:'카트폴 최적 구간', v:'γ∈[0.96,0.99], λ∈[0.92,0.99]', d:'21회 반복 실험 평균'},
 {k:'3D 이족 보행 최적 구간', v:'γ∈[0.99,0.995], λ∈[0.96,0.99]', d:'9회 시행 평균'},
 {k:'이족 보행 학습 1회', v:'16코어 약 2시간', d:'1000 반복 기준'},
 {k:'환산 실제 시간', v:'약 5.8일', d:'0.01초/스텝 × 50000스텝/배치 × 1000배치'},
 {k:'로봇 상태 차원', v:'이족 33 · 사족 29', d:'MuJoCo 시뮬레이션, torque-level 제어'},
 {k:'사족 보행 최적 λ', v:'0.96', d:'γ=0.995 고정, 32코어 약 4시간/시행'}
],

impact:'분산-편향을 하나의 스칼라로 매끈하게 조절하는 이 추정량은 이후 거의 모든 정책 경사·actor-critic 계열의 표준 부품이 되었다. [TRPO](#/p/trpo)가 "얼마나 멀리 갱신할지"의 안전장치를 만들었다면, GAE는 "그 갱신에 쓸 신호를 얼마나 믿을지"를 조절하는 짝이다. [PPO](#/p/ppo)는 GAE로 계산한 advantage를 clip된 목적함수에 그대로 대입하고, [GRPO](#/p/grpo) 계열은 가치함수 자체를 없애면서 GAE가 풀던 문제를 그룹 상대 보상으로 우회한다.',

legacy:[
 '**RLHF 파이프라인의 표준 부품** — [InstructGPT](#/p/instructgpt) 등 대부분의 PPO 기반 RLHF 구현이 advantage 계산에 GAE(보통 λ=0.95)를 그대로 쓴다',
 '**actor-critic 일반 관행으로 정착** — 연속 제어를 넘어 게임([AlphaStar](#/p/alphastar) 등)까지 advantage 기반 정책 경사의 기본 선택지가 됨',
 '**GRPO가 정면으로 대체** — [GRPO](#/p/grpo)는 가치함수·GAE 없이 같은 프롬프트의 여러 샘플을 상대 비교해 advantage를 만들어, GAE가 요구하던 별도 가치함수 학습 비용 자체를 없앤다',
 '**λ, γ 튜닝이 별도의 하이퍼파라미터 관행으로 굳음** — 이후 RL 논문 대부분이 GAE의 λ를 보고하는 것이 표준이 됨'
],

pitfalls:[
 '**λ와 γ는 같은 편향-분산 트레이드오프에 관여하지만 크기가 다르다.** γ는 목적함수 자체(할인된 보상 정의)를 바꿔 편향을 만들고, λ는 그 안에서 추정 방식만 바꾸므로 도입하는 편향이 훨씬 작다. 그래서 논문에서도 λ의 최적 구간이 γ보다 넓다.',
 '**가치함수 업데이트 순서를 틀리기 쉽다.** 정책을 갱신할 때는 그 배치에서 쓴 **이전** $V_{\\phi_i}$ 를 그대로 써야 한다. 가치함수를 먼저 갱신한 뒤 advantage를 계산하면 극단적으로 벨만 잔차가 0에 가까워져 정책 경사 신호 자체가 사라질 수 있다.',
 '**GAE 자체는 특정 정책 최적화 알고리즘이 아니다.** 논문은 TRPO와 결합해 실험했을 뿐, advantage 추정 기법으로서 A2C·PPO 등 다른 어떤 정책 경사 방법에도 끼워넣을 수 있는 독립적인 부품이다.'
],

figures:[
 {f:'fig1-robots.png',
  cap:'실험에 쓴 시뮬레이션 로봇. 왼쪽 이족(33차원 상태), 오른쪽 사족(29차원 상태). 아래 프레임 시퀀스가 학습된 보행 gait — 손으로 짠 정책이나 모방학습 없이 GAE+TRPO만으로 얻은 결과다.',
  src:'원문 Figure 1, p.9'}
],

quotes:[
 {t:'We address the first challenge by using value functions to substantially reduce the variance of policy gradient estimates at the cost of some bias, with an exponentially-weighted estimator of the advantage function that is analogous to TD(λ).',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1506.02438 — High-Dimensional Continuous Control Using Generalized Advantage Estimation', u:'https://arxiv.org/abs/1506.02438'},
 {t:'Spinning Up: Vanilla Policy Gradient (OpenAI)', u:'https://spinningup.openai.com/en/latest/algorithms/vpg.html'}
]
});
