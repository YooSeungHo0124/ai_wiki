WIKI.paper({
slug:'trpo',
venue:'ICML 2015',
authors:'Schulman et al. (UC Berkeley)',
arxiv:'1502.05477',

tldr:'정책 경사법이 한 번의 갱신으로 정책을 망가뜨리는 문제를, **갱신 전후 정책의 KL 발산을 상수 이하로 묶는 신뢰영역 제약**으로 해결한 논문. "이 크기 안에서는 성능이 단조 증가한다"는 이론적 보증에서 출발해 실제로 쓸 수 있는 근사 알고리즘까지 내려온다.',

context:'정책 경사법(REINFORCE, actor-critic)의 실용적 병목은 **스텝 크기**다. 지도학습에서는 학습률이 조금 커도 다음 배치에서 회복되지만, RL에서는 정책이 곧 데이터 수집기다. 한 번의 큰 갱신으로 정책이 무너지면 그 뒤로 수집되는 궤적 자체가 쓰레기가 되고, 회복할 방법이 없다. 반대로 안전하게 학습률을 낮추면 학습이 실용적이지 않을 만큼 느려진다. 게다가 파라미터 공간에서의 고정 스텝 크기는 **정책 분포 공간에서 얼마나 큰 변화인지와 무관하다** — 어떤 방향으로 0.01만큼 움직이면 정책이 거의 안 변하고, 다른 방향으로 같은 0.01은 정책을 완전히 뒤집는다. 이 논문은 "파라미터가 아니라 **정책 분포**를 기준으로 스텝을 재자"고 답한다.',

figures:[
 {f:'fig1-single-path-vine.png',
  cap:'왼쪽(single path)은 정책을 그냥 한 번 굴려 나온 궤적 위의 상태-행동 쌍을 전부 목적함수에 쓴다. 오른쪽(vine)은 같은 상태 $s_n$으로 되돌아가 여러 행동($a_1$, $a_2$)을 각각 시도한 뒤 그 갈래마다 다시 롤아웃한다 — 상태를 되돌릴 수 있어야만 가능한 방식이라 분산은 낮지만 시뮬레이터 전용이다.',
  src:'원문 Figure 1, p.4'},
 {f:'fig4-learning-curves.png',
  cap:'x축은 정책 갱신 횟수, y축은 보상. 네 과제(Cartpole·Swimmer·Hopper·Walker) 모두에서 Vine·Single Path(진한 초록·파랑)가 다른 방법보다 빠르고 안정적으로 올라간다. 특히 Hopper·Walker에서 Natural Gradient(하늘색)가 정체되는 것이 고정 학습률 계열의 한계를 보여준다.',
  src:'원문 Figure 4, p.7'}
],

quotes:[
 {t:'We describe an iterative procedure for optimizing policies, with guaranteed monotonic improvement.',
  src:'Abstract, p.1'},
 {t:'Despite its approximations that deviate from the theory, TRPO tends to give monotonic improvement, with little tuning of hyperparameters.',
  src:'Abstract, p.1'}
],

ideas:[
 {h:'대리 목적함수와 단조 개선 보장',
  lead:'대리 목적을 KL 발산에 비례한 항으로 하한 지으면 성능이 절대 나빠지지 않는다.',
  d:'새 정책의 성능 $\\eta(\\tilde\\pi)$ 를 옛 정책의 데이터로 쓴 대리 목적 $L_\\pi(\\tilde\\pi)$ 로 근사하면, 그 차이가 두 정책의 최대 KL 발산에 비례하는 항으로 **상한이 잡힌다**. 즉 $\\eta(\\tilde\\pi) \\ge L_\\pi(\\tilde\\pi) - C \\cdot D_{KL}^{max}$. 오른쪽 항을 최대화하면 실제 성능이 절대 나빠지지 않는다는 것이 논문의 이론적 출발점이며, 이것이 **단조 개선(monotonic improvement)** 보장이다.'},
 {h:'페널티에서 제약으로 — 실용화를 위한 타협',
  lead:'이론적 페널티 대신 평균 KL을 δ 이하로 묶는 부등식 제약으로 바꾼다.',
  d:'이론이 제시하는 계수 $C$ 를 그대로 쓰면 스텝이 너무 작아져 실용성이 없다. 그래서 KL 항을 목적함수의 페널티로 두는 대신 **부등식 제약 $\\bar{D}_{KL} \\le \\delta$** 로 바꾸고 $\\delta$ 를 직접 지정한다. 또한 모든 상태에서의 최대 KL 대신 **상태 분포에 대한 평균 KL** 을 쓴다. 두 번 다 이론적 엄밀성을 조금 내주고 계산 가능성을 얻은 자리이며, 논문은 이 타협을 명시적으로 밝힌다.'},
 {h:'중요도 샘플링으로 옛 데이터를 재사용',
  lead:'옛 정책 대비 확률 비를 어드밴티지에 곱해 옛 궤적으로 새 정책을 평가한다.',
  d:'대리 목적 안의 기댓값은 **옛 정책이 모은 궤적**으로 계산되어야 한다. 그래서 $\\pi_\\theta(a|s)/\\pi_{old}(a|s)$ 라는 확률 비를 어드밴티지에 곱한다. 이 비율은 뒤에 [PPO](#/p/ppo)에서 clip의 대상이 되는 바로 그 양이며, 비율이 1에서 크게 벗어날수록 근사가 무너진다는 사실이 신뢰영역이 필요한 이유 자체다.'},
 {h:'자연 경사와 Fisher 행렬 — 실제 계산 방법',
  lead:'Fisher 행렬을 직접 안 만들고 켤레 경사법으로 자연 경사 방향만 구한다.',
  d:'제약 최적화를 풀기 위해 목적은 1차, KL 제약은 2차로 테일러 전개한다. KL의 헤시안이 곧 **Fisher 정보 행렬** $F$ 이므로 갱신 방향은 $F^{-1}g$ 가 된다. 파라미터가 수만 개라 $F$ 를 명시적으로 만들 수 없어서, **켤레 경사법(conjugate gradient)** 으로 Fisher-vector product만 반복 계산해 방향을 구한다. 마지막에 line search로 실제 대리 목적이 개선되고 제약이 지켜지는지 확인한 뒤에만 갱신을 받아들인다.'},
 {h:'single-path와 vine, 두 가지 샘플링',
  lead:'단순 궤적 롤아웃과, 상태를 되돌려 분산을 낮춘 vine 롤아웃을 함께 제시한다.',
  d:'어드밴티지 추정을 위해 두 방식을 제시한다. **single-path** 는 정책을 그냥 굴려 얻은 궤적을 쓰는 표준 방식이고, **vine** 은 궤적 위의 상태들에서 롤아웃을 여러 갈래로 재시작해 분산이 훨씬 낮은 추정을 얻는다. vine은 시뮬레이터를 임의 상태로 되돌릴 수 있어야만 가능해서 현실 로봇에는 못 쓰지만, 알고리즘의 성능 상한을 보여주는 역할을 한다.'}
],

diagram:{type:'compare', cap:'스텝 크기를 무엇으로 재는가 — 파라미터 거리 $\\|\\Delta\\theta\\|$ vs 정책 분포 거리 $\\bar{D}_{KL}(\\pi_{old}\\|\\pi_\\theta) \\le \\delta$.',
 left:{t:'기존: 정책 경사 + 고정 학습률', items:[
  '파라미터 거리로 스텝 제한',
  '같은 이동도 정책 변화폭이 다름',
  '한 번 무너지면 이후 수집 데이터가 전부 오염',
  '안전하게 가려면 학습률을 극단적으로 낮춰야 함']},
 right:{t:'TRPO: KL 신뢰영역 제약', items:[
  'KL 제약 안에서만 최대화',
  '스텝 크기를 **행동 분포의 변화량**으로 측정',
  '대리 목적 하한에서 유도된 단조 개선 논리',
  '켤레경사+line search로 검증']}},

math:[
 {expr:'maximize_θ  E[ (π_θ(a|s) / π_old(a|s)) · A_old(s,a) ]   s.t.  E[ D_KL(π_old(·|s) ‖ π_θ(·|s)) ] ≤ δ',
  tex:'\\max_{\\theta}\\; \\mathbb{E}\\!\\left[\\frac{\\pi_\\theta(a|s)}{\\pi_{old}(a|s)} A_{old}(s,a)\\right] \\;\\text{s.t.}\\; \\mathbb{E}[D_{KL}(\\pi_{old}(\\cdot|s) \\,\\|\\, \\pi_\\theta(\\cdot|s))] \\le \\delta',
  d:'TRPO 전체가 이 한 줄이다. 목적은 중요도 비율로 가중한 어드밴티지, 제약은 상태 평균 KL. $\\delta$ 는 보통 0.01 근처를 쓴다.'},
 {expr:'η(π̃) ≥ L_π(π̃) − C · D_KL^max(π, π̃),   C = 4εγ/(1−γ)²',
  tex:'\\eta(\\tilde\\pi) \\ge L_\\pi(\\tilde\\pi) - C \\cdot D_{KL}^{max}(\\pi, \\tilde\\pi), \\quad C = \\frac{4\\epsilon\\gamma}{(1-\\gamma)^2}',
  d:'논문의 정리 1. 오른쪽 하한을 최대화하는 것이 실제 성능 $\\eta$ 를 단조 증가시킨다. 다만 이 $C$ 를 그대로 쓰면 스텝이 지나치게 작아 실전에서는 제약 형태로 완화한다.'},
 {expr:'s = F⁻¹ g,   β = √(2δ / (sᵀ F s))',
  tex:'s = F^{-1} g, \\quad \\beta = \\sqrt{\\frac{2\\delta}{s^{\\top} F s}}',
  d:'갱신 방향은 자연 경사 $F^{-1}g$, 스텝 배율 $\\beta$ 는 2차 근사한 KL이 정확히 $\\delta$ 가 되도록 정한 값. $F$ 를 만들지 않고 켤레 경사법으로 $s$ 만 구한다.'}
],

numbers:[
 {k:'KL 제약 δ', v:'0.01 수준', d:'논문 실험의 기본값. 이 값 하나가 사실상 유일한 스텝 크기 하이퍼파라미터'},
 {k:'연속 제어 과제', v:'swimming · hopping · walking', d:'MuJoCo 물리 시뮬레이션 이동 보행 학습'},
 {k:'Atari', v:'화면 픽셀 입력', d:'동일 구조·동일 파라미터로 실행 — 도메인별 튜닝 없이 합리적 점수'},
 {k:'2차 정보 계산', v:'Fisher-vector product 반복', d:'$F$ 를 명시적으로 저장하지 않아 파라미터 수에 선형'}
],

impact:'"정책을 얼마나 크게 바꿀 것인가"를 **정책 분포 공간의 거리**로 정의한 것이 이후 on-policy RL의 공통 언어가 되었다. 신뢰영역이라는 개념 자체는 최적화 이론에서 오래된 것이지만, 그것을 딥 RL의 안정성 문제에 정확히 대응시킨 것이 이 논문의 기여다. 실제로 TRPO 이후 정책 경사 계열 논문은 거의 예외 없이 "옛 정책과의 KL/비율을 어떻게 통제하는가"를 설계 축으로 삼는다. 다만 켤레 경사와 line search가 들어간 구현은 무겁고, 파라미터 공유·순환 네트워크와 잘 안 맞는다는 실용적 부담이 남았다 — 이 부담이 [PPO](#/p/ppo)를 낳는다.',

legacy:[
 '**[PPO](#/p/ppo)** — 같은 목적(정책 변화 억제)을 2차 최적화 없이 clip 한 줄로 근사하며 사실상 TRPO를 대체',
 '**[RLHF 원형](#/p/rlhf-prefs)** — 인간 선호로 학습한 보상 모델 위에서 정책을 최적화할 때 TRPO 계열 신뢰영역 방법이 초기 선택지가 됨',
 '**ACKTR / K-FAC 계열** — Fisher 행렬 근사를 더 싸게 만들어 자연 경사 갱신을 실용화하려는 후속 연구',
 '**KL 제약의 일반화** — RLHF의 참조 모델 KL 페널티, [GRPO](#/p/grpo)의 그룹 정규화까지 "기준 정책에서 멀어지지 마라"는 발상이 LLM 정렬로 이어짐'
],

pitfalls:[
 '**단조 개선 보장은 실제 알고리즘에는 적용되지 않는다.** 정리가 성립하는 것은 이론적 페널티 계수 $C$ 를 쓰고 최대 KL을 볼 때뿐이며, 실제 TRPO는 평균 KL과 사용자 지정 $\\delta$, 2차 근사, 샘플 기반 추정을 모두 쓴다. "TRPO는 성능이 절대 안 떨어짐이 증명됐다"는 흔한 요약은 틀렸다.',
 '**구현 난이도가 성능의 일부다.** 켤레 경사 반복 횟수, 댐핑 계수, line search의 백트래킹 조건 같은 세부가 결과를 크게 바꾼다. RL 재현성 연구들은 논문 사이의 성능 차이 상당 부분이 알고리즘이 아니라 이런 **구현 세부와 랜덤 시드**에서 온다고 지적했다 — TRPO 대 PPO 비교 실험이 대표적인 사례다.',
 '**샘플 효율이 좋아지는 것이 아니다.** TRPO는 on-policy 방법이라 매 갱신마다 새 궤적을 모아야 하고, 안정성을 얻는 대가로 [DQN](#/p/dqn) 같은 off-policy 방법보다 훨씬 많은 환경 상호작용을 요구한다.'
],

links:[
 {t:'arXiv 1502.05477 — Trust Region Policy Optimization', u:'https://arxiv.org/abs/1502.05477'},
 {t:'ICML 2015 proceedings (PMLR v37)', u:'https://proceedings.mlr.press/v37/schulman15.html'},
 {t:'OpenAI Spinning Up — TRPO', u:'https://spinningup.openai.com/en/latest/algorithms/trpo.html'}
]
});
