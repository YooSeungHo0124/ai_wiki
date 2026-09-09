WIKI.paper({
slug:'sac',
venue:'ICML 2018',
authors:'Haarnoja et al. (UC Berkeley · Google Brain)',
arxiv:'1801.01290',

tldr:'보상뿐 아니라 **정책의 엔트로피까지 함께 최대화**하는 최대 엔트로피 목적을 off-policy 액터-크리틱에 결합한 논문. 탐색을 하이퍼파라미터가 아니라 목적함수 안에 넣어 [DDPG](#/p/ddpg)의 고질적 불안정과 튜닝 민감성을 동시에 줄였고, 연속 제어의 기본 알고리즘이 되었다.',

context:'2018년 시점 연속 제어의 두 축은 명확한 트레이드오프였다. [PPO](#/p/ppo) 같은 on-policy 방법은 안정적이지만 데이터를 한 번 쓰고 버려 **환경 상호작용이 수백만 스텝** 필요하다 — 실제 로봇에는 쓸 수 없다. [DDPG](#/p/ddpg) 같은 off-policy 방법은 재생 버퍼로 샘플 효율이 좋지만 **극도로 불안정하고 하이퍼파라미터에 예민하다.** DDPG의 취약함에는 구조적 이유가 있다. 정책이 결정론적이라 탐색을 외부 노이즈 프로세스에 전적으로 의존하고, 크리틱의 Q 과대추정이 액터를 잘못된 행동으로 몰면 그 행동만 계속 수집돼 되돌릴 수 없다. 이 논문은 탐색을 노이즈로 덧붙이는 대신 **"불확실할 때는 여러 행동에 확률을 남겨두는 것 자체를 보상하자"** 는 최대 엔트로피 RL 관점에서 문제를 다시 세운다.',

ideas:[
 {h:'최대 엔트로피 목적 — 엔트로피를 보상에 포함시킨다',
  lead:'같은 보상이면 더 넓게 퍼진 정책을 선호하도록 엔트로피를 보상에 더한다.',
  d:'표준 RL의 목적 $\\sum \\gamma^t r_t$ 대신 $\\sum \\gamma^t (r_t + \\alpha \\mathcal{H}(\\pi(\\cdot|s_t)))$ 를 최대화한다. 즉 **같은 보상을 얻는다면 더 넓게 퍼진 정책이 더 좋다**는 뜻이다. 이 목적은 탐색을 자동으로 유도하고, 성능이 비슷한 여러 해법이 있으면 모두에 확률을 남겨두어 한 국소해에 조기 고착되지 않게 한다. 그 결과 정책은 환경 교란에도 더 강건해진다.'},
 {h:'확률적 정책으로의 회귀',
  lead:'재파라미터화 트릭으로 확률적 정책도 크리틱 경사를 그대로 전달받는다.',
  d:'DDPG는 argmax를 피하려고 정책을 결정론적으로 만들었는데, SAC는 **가우시안 정책(평균·분산을 네트워크가 출력)** 으로 되돌아간다. 대신 재파라미터화 트릭 $a = \\tanh(\\mu_\\theta(s) + \\sigma_\\theta(s)\\odot\\varepsilon)$ 을 써서 샘플링을 미분 가능하게 만든다. 덕분에 크리틱의 경사가 액터로 그대로 흐르면서도 정책은 확률적이라, 재생 버퍼에 **다양한 행동이 쌓인다**.'},
 {h:'두 개의 Q 네트워크 — 과대추정 억제',
  lead:'독립된 두 크리틱 중 작은 값을 타깃으로 써서 Q의 낙관적 편향을 상쇄한다.',
  d:'$\\max$ 또는 그에 준하는 연산은 추정 노이즈 중 가장 큰 값을 고르므로 Q를 체계적으로 부풀린다. SAC는 크리틱을 **두 개 독립적으로 학습시키고 타깃 계산에는 둘 중 작은 값을 쓴다.** 낙관적 편향을 비관적으로 상쇄하는 단순한 장치이며, 같은 시기 TD3와 독립적으로 같은 결론에 도달했다. 이것이 DDPG 대비 안정성 향상의 상당 부분을 설명한다.'},
 {h:'soft policy iteration — 이론적 뼈대',
  lead:'평가와 개선을 번갈아 반복하면 최적 최대엔트로피 정책에 수렴함을 증명한다.',
  d:'알고리즘은 임기응변이 아니라 **soft policy evaluation과 soft policy improvement의 반복**으로 유도된다. 개선 단계는 "지수화된 soft Q 분포에 정책을 KL 투영하라"는 형태이고, 표 형태 설정에서 이 반복이 최적 최대엔트로피 정책으로 수렴함이 증명된다. 실제 알고리즘은 이 반복을 함수 근사 + 확률적 경사로 근사한 것이다.'},
 {h:'온도 α — 유일한 진짜 하이퍼파라미터',
  lead:'α는 결정론과 탐색 사이의 다이얼이며, 후속판은 이를 자동으로 조절한다.',
  d:'$\\alpha$ 는 보상과 엔트로피의 상대 가중치, 즉 **결정론과 탐색 사이의 다이얼**이다. 값이 너무 크면 정책이 무작위에 가까워지고 작으면 DDPG처럼 조기 수렴한다. 원 논문에서는 과제별로 고정값을 튜닝했고, 이 부담이 후속판(arXiv 1812.05905)에서 목표 엔트로피를 정하고 $\\alpha$ 를 **자동으로 조절하는** 방식으로 해결된다. 실무에서 쓰이는 SAC는 대개 이 자동 온도 버전이다.'}
],

diagram:{type:'compare', cap:'탐색을 어디에 두는가 — 정책 밖의 노이즈 vs 목적함수 안의 엔트로피',
 left:{t:'DDPG: 결정론적+노이즈', items:[
  '결정론적 행동 + OU 노이즈',
  '노이즈 스케일·감쇠가 성능을 좌우',
  '크리틱 하나 → Q 과대추정에 취약',
  '학습이 중간에 붕괴하는 사례가 흔함']},
 right:{t:'SAC: 확률적+엔트로피', items:[
  '보상에 엔트로피 항 포함',
  '재파라미터화로 확률적 정책도 미분 가능',
  '크리틱 둘 중 min → 낙관 편향 상쇄',
  '시드·하이퍼파라미터 간 편차가 작음']}},

figures:[
 {f:'fig1-results-curves.png',
  cap:'6개 연속 제어 과제(a~f)의 학습 곡선. x축은 환경 상호작용 스텝 수(백만 단위, 과제마다 스케일 다름), y축은 평가 롤아웃의 평균 리턴. 5개 시드의 평균(실선)과 최소·최대 범위(음영)를 보여준다. 쉬운 과제(a, b)에서는 SAC(주황)가 다른 방법과 비슷하지만, 어려운 과제로 갈수록(d Ant, e Humanoid-v1, f Humanoid rllab) DDPG(초록)는 거의 학습에 실패하고 SAC만 꾸준히 상승하는 것이 핵심 포인트다.',
  src:'원문 Figure 1, p.6'},
 {f:'fig3b-reward-scale.png',
  cap:'Ant-v1에서 보상 스케일(범례의 1~100배)을 바꿔가며 학습한 곡선. x축은 스텝 수, y축은 평균 리턴. 스케일이 너무 작으면(파란선, 1배) 정책이 거의 균일분포로 수렴해 리턴이 낮은 채로 정체되고, 중간 스케일(초록·빨강, 10~30배)이 가장 빠르고 높게 수렴하며, 너무 크면(보라, 100배) 다시 성능이 떨어진다 — α(온도)가 보상 스케일에 종속적이라는 pitfalls 항목의 근거 그림이다.',
  src:'원문 Figure 3(b), p.8'}
],

quotes:[
 {t:'In this paper, we propose soft actor-critic, an off-policy actor-critic deep RL algorithm based on the maximum entropy reinforcement learning framework. In this framework, the actor aims to maximize expected reward while also maximizing entropy.',
  src:'Abstract, p.1'},
 {t:'In practice, we found reward scale to be the only hyperparameter that requires tuning, and its natural interpretation as the inverse of the temperature in the maximum entropy framework provides good intuition for how to adjust this parameter.',
  src:'Section 5.2 (Reward scale), p.8'}
],

math:[
 {expr:'J(π) = Σ_t E[ r(s_t, a_t) + α · H( π(·|s_t) ) ]',
  tex:'J(\\pi)=\\sum_t \\mathbb{E}\\left[r(s_t,a_t)+\\alpha H(\\pi(\\cdot|s_t))\\right]',
  d:'최대 엔트로피 RL의 목적. $\\alpha \\to 0$ 이면 표준 RL로 돌아간다. 엔트로피 항이 있으면 최적 정책이 결정론적이지 않고, "여러 좋은 행동"에 확률을 배분하게 된다.'},
 {expr:'y = r + γ ( min_{i=1,2} Q_{θ\'_i}(s\', a\') − α·log π_φ(a\'|s\') ),   a\' ~ π_φ(·|s\')',
  tex:'y=r+\\gamma\\left(\\min_{i=1,2}Q_{\\theta_i\'}(s\',a\')-\\alpha\\log\\pi_\\phi(a\'|s\')\\right),\\quad a\'\\sim\\pi_\\phi(\\cdot|s\')',
  d:'크리틱 타깃. DDPG와 두 곳이 다르다 — 두 타깃 Q 중 **작은 값**을 쓰고, 다음 행동의 **로그 확률을 빼서** 엔트로피 보너스를 부트스트랩에 반영한다.'},
 {expr:'a = tanh( μ_φ(s) + σ_φ(s) ⊙ ε ),   ε ~ N(0, I)',
  tex:'a=\\tanh\\!\\left(\\mu_\\phi(s)+\\sigma_\\phi(s)\\odot\\varepsilon\\right),\\quad \\varepsilon\\sim\\mathcal{N}(0,I)',
  d:'재파라미터화 트릭. 무작위성을 파라미터와 무관한 $\\varepsilon$ 으로 분리해 $\\nabla_\\phi$ 가 크리틱을 통과하게 만든다. $\\tanh$ 압착에 따른 로그 확률 보정항이 별도로 필요하다.'}
],

numbers:[
 {k:'벤치마크', v:'OpenAI Gym 연속 제어 + rllab Humanoid', d:'HalfCheetah, Ant, Humanoid 등 이동 과제'},
 {k:'최고 난이도 과제', v:'Humanoid (rllab) · 행동 21차원', d:'off-policy 방법이 대체로 실패하던 고차원 과제에서 학습 성공'},
 {k:'비교 대상', v:'DDPG · PPO · TD3 · Soft Q-learning', d:'샘플 효율과 최종 성능 모두에서 우위 보고'},
 {k:'크리틱 개수', v:'2개 · 타깃은 min', d:'Q 과대추정 억제'},
 {k:'온도 α', v:'과제별 고정 → 후속판에서 자동 조절', d:'목표 엔트로피 제약을 두고 α를 학습하는 방식(arXiv 1812.05905)'}
],

impact:'**샘플 효율과 안정성을 동시에 잡은 첫 실용적 연속 제어 알고리즘**으로 자리 잡았다. off-policy라 [PPO](#/p/ppo)보다 환경 상호작용이 훨씬 적게 필요하면서도, 하이퍼파라미터 튜닝 없이 여러 과제에서 곧바로 동작한다는 점이 실무에서 결정적이었다. 저자들은 실제 4족 로봇과 밸브 회전 조작을 실제 하드웨어에서 수 시간 만에 학습시켜, 시뮬레이션 벤치마크를 넘어선 적용 가능성을 보였다.',

legacy:[
 '**자동 온도 조절 SAC** — 후속 논문(SAC Algorithms and Applications)에서 목표 엔트로피 제약으로 $\\alpha$ 를 학습해 마지막 남은 튜닝 부담까지 제거',
 '**로보틱스 표준 베이스라인** — 실제 하드웨어 학습과 sim-to-real 파이프라인에서 기본 선택지가 됨',
 '**오프라인 RL로의 계승** — CQL 등 오프라인 RL 알고리즘 다수가 SAC의 액터-크리틱 골격 위에 보수적 Q 정규화를 얹는 형태로 구성됨',
 '**엔트로피 정규화의 확산** — "기준 분포에서 너무 멀어지거나 너무 뾰족해지지 마라"는 발상이 [PPO](#/p/ppo)의 엔트로피 보너스, RLHF의 KL 페널티와 같은 계열의 아이디어로 이어짐'
],

pitfalls:[
 '**α는 보상 스케일에 종속된 값이다.** 보상을 10배로 키우면 엔트로피 항의 상대적 비중이 1/10이 되어 같은 $\\alpha$ 가 전혀 다르게 동작한다. 환경의 보상 설계를 바꾸면 $\\alpha$ 를 다시 잡아야 하며, 이것이 자동 온도 조절 버전이 사실상 필수인 이유다.',
 '**"최대 엔트로피 = 항상 더 좋다"가 아니다.** 엔트로피 항은 결국 목적함수를 왜곡하는 정규화이므로, 정밀한 결정론적 제어가 필요한 과제에서는 최적 성능을 깎을 수 있다. 평가 시에는 보통 분포의 평균 행동만 쓰는 결정론적 모드로 전환한다.',
 '**논문 곡선은 알고리즘만의 결과가 아니다.** deep RL의 재현성 연구가 반복해 지적했듯 관측 정규화, 네트워크 크기, 재생 버퍼 크기, 학습 시작 전 워밍업 스텝 같은 **구현 세부와 랜덤 시드**가 알고리즘 선택만큼 결과를 바꾼다. SAC는 상대적으로 시드 편차가 작은 편이지만, 여전히 여러 시드의 분산을 함께 보고해야 비교가 성립한다.'
],

links:[
 {t:'arXiv 1801.01290 — Soft Actor-Critic', u:'https://arxiv.org/abs/1801.01290'},
 {t:'arXiv 1812.05905 — Soft Actor-Critic Algorithms and Applications (자동 온도)', u:'https://arxiv.org/abs/1812.05905'},
 {t:'BAIR Blog — Soft Actor-Critic: Deep RL with Real-World Robots', u:'https://bair.berkeley.edu/blog/2018/12/14/sac/'}
]
});
