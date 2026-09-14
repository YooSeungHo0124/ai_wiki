WIKI.paper({
slug:'rlad',
venue:'ICML 2026',
authors:'Zhang, Jiang, Shen et al. (AWS Agentic AI, Amazon)',
arxiv:'2602.22495',

tldr:'RL 후속학습 도중 교사를 향한 증류를 **GRPO의 신뢰영역 안으로 직접 접어넣는** 방법 TRRD(Trust Region Ratio Distillation)를 제안. 별도의 KL 페널티 항을 더하는 대신, 교사-이전정책 혼합 앵커에 대한 확률비를 클리핑해서 "보상과 어긋나는 교사 선호는 자동으로 무시"되게 만든다.',

context:'긴 사고사슬(chain-of-thought) 추론 모델을 [GRPO](#/p/grpo) 같은 RL로 학습시킨 뒤, 그 능력을 작은 학생에게 옮기고 싶을 때 표준 파이프라인은 교사를 먼저 RL로 학습시키고 그 흔적(trace)에 학생을 SFT시키는 것이다. 이 방식은 학생의 진화하는 정책에 맞춰 교사 안내를 조정하지 못한다. KDRL 같은 최근 시도는 RL 루프 안에 교사-학생 KL 정규화 항을 더해 온폴리시로 만들지만, 이 KL 항은 **추정된 어드밴티지와 무관하게 균일하게** 작용한다 — 교사의 선호가 높은 보상 궤적과 어긋나는 영역에서도 그대로 학생을 교사 쪽으로 당겨서 성능을 오히려 깎을 수 있다.',

ideas:[
 {h:'선택적 모방: 어드밴티지가 있을 때만 교사를 따른다',
  lead:'교사 안내가 보상 신호와 일치할 때만 작동하도록 증류를 어드밴티지 가중 업데이트 안에 박아 넣는다.',
  d:'KDRL의 KL 페널티는 정책 개선 메커니즘과 독립적으로 작동해 항상 켜져 있다. RLAD는 반대로, 교사 정보를 GRPO의 어드밴티지 가중 중요도비 **안에** 직접 넣어서, 교사를 따르는 것이 보상과 일치하는 경우에만 실질적으로 그래디언트가 그 방향으로 강화되게 한다.'},
 {h:'TRRD: 교사-이전정책 혼합을 신뢰영역 앵커로',
  lead:'GRPO의 이전 정책 하나 대신 이전 정책과 교사의 기하 혼합을 신뢰영역 중심으로 쓴다.',
  d:'계수 $\\alpha\\in[0,1]$ 로 학생의 이전 정책과 교사 정책을 토큰 단위로 보간한 혼합 앵커 $r_{\\pi_{mix}}$ 를 정의하고, GRPO의 중요도비를 이 앵커에 대한 비율로 바꾼다. $\\alpha=0$ 이면 표준 GRPO로, $\\alpha=1$ 이면 완전히 교사에 고정된(DPO에 가까운) 목적함수로 되돌아가는 다이얼이다.'},
 {h:'암묵적 가중 KL 정규화로의 재해석',
  lead:'TRRD 비율의 로그를 풀면 두 KL 항의 볼록결합을 최적화하는 것과 같아진다.',
  d:'TRRD 비율에 로그를 취하면 $\\alpha \\cdot \\mathrm{KL}(\\pi_S\\Vert\\pi_{S,old}) + (1-\\alpha)\\cdot \\mathrm{KL}(\\pi_S\\Vert\\pi_T)$ 형태의 보상-정규화 목적함수와 등가임을 보일 수 있다. 즉 TRRD는 교사 모방을 고정 제약이 아니라, 온폴리시 개선과 경쟁하는 **소프트 정규화 항**으로 다룬다 — 교사가 어드밴티지와 어긋나는 곳에서는 이 정규화가 자동으로 약해진다.'},
 {h:'클리핑이 곧 교사 신뢰영역의 경계가 된다',
  lead:'PPO 스타일 클리핑 $[1-\\epsilon,1+\\epsilon]$ 을 TRRD 비율에 적용하면 로그확률 변화량이 직접 제한된다.',
  d:'$|\\log\\pi_S - \\log r_{\\pi_{mix}}|\\le\\log(1+\\epsilon)$ 형태로 학생과 혼합 앵커 사이 토큰 단위 KL이 상한을 갖는다. 이 덕분에 교사 쪽으로 끌려가는 정도 자체가 신뢰영역 폭을 벗어나지 못하고, 탐색·활용·모방 세 가지가 하나의 클리핑 메커니즘 안에서 자연히 균형을 이룬다.'}
],

diagram:{type:'compare', cap:'KDRL은 어드밴티지와 무관한 고정 KL 페널티, RLAD/TRRD는 어드밴티지 가중 비율 안에 교사를 내장한다.',
 left:{t:'KDRL: 고정 KL 정규화', items:['교사-학생 KL을 별도 항으로 추가','어드밴티지와 무관하게 항상 작동','보상과 어긋나도 교사를 따름']},
 right:{t:'RLAD: TRRD', items:['교사·이전정책 혼합을 신뢰영역 앵커로','α로 GRPO↔교사고정 보간','어드밴티지 있을 때만 실질 반영']}
},

math:[
 {expr:'r_TRRD(theta) = (GRPO ratio)^alpha * (teacher ratio)^(1-alpha)',
  tex:'r_{i,t}^{\\text{TRRD}}(\\theta_S)=\\left(r_{i,t}^{\\text{GRPO}}(\\theta_S)\\right)^{\\alpha}\\left(r_{i,t}^{T}(\\theta_S)\\right)^{1-\\alpha}',
  d:'$\\alpha=0$ 이면 표준 GRPO 중요도비, $\\alpha=1$ 이면 교사에 대한 비율만 남아 DPO에 가까운 목적함수가 된다.'},
 {expr:'max E[R] - alpha*KL(piS||piS_old) - (1-alpha)*KL(piS||piT)',
  tex:'\\max_{\\theta_S}\\ \\mathbb{E}[R(x,y)]-\\alpha\\,\\mathrm{KL}(\\pi_{\\theta_S}\\Vert\\pi_{\\theta_S,old})-(1-\\alpha)\\,\\mathrm{KL}(\\pi_{\\theta_S}\\Vert\\pi_{\\theta_T})',
  d:'TRRD가 실제로 최적화하는 등가 목적함수. 클리핑과 어드밴티지 정규화를 별도로 하면 이 식에 근사한다.'}
],

numbers:[
 {k:'K&K Logistics 평균 (Qwen3-0.6B, 8K)', v:'0.76 → 0.94', d:'GRPO 대비 +18%p, KDRL도 능가'},
 {k:'K&K Logistics 평균 (Qwen3-1.7B, 8K)', v:'0.95 → 0.99', d:'GRPO 대비 +4%p'},
 {k:'K&K Logistics 평균 (Qwen3-0.6B, 2K)', v:'0.70 → 0.90', d:'GRPO 대비 +20%p'},
 {k:'최난도 PPL8 구간', v:'0.63 → 0.83 (8K)', d:'Qwen3-0.6B, GRPO 대비 — 어려운 구간일수록 이득이 크다'},
 {k:'KDRL 대비 우위', v:'6%p ~ 15%p', d:'난도가 높은 구간에서 KDRL을 앞서는 폭'}
],

impact:'RL 후속학습과 증류를 분리된 두 단계(교사 RL → 학생 SFT)로 처리하던 관행에, "RL 루프 안에서 교사를 선택적으로 모방하는" 제3의 축을 더했다. 핵심은 새로운 손실 항을 추가한 게 아니라 **기존 GRPO 신뢰영역 메커니즘 자체를 재활용**했다는 점 — 별도의 KL 계수 튜닝 없이 클리핑 하나로 교사 신뢰도와 보상 신호를 동시에 반영한다.',

legacy:[
 '[opd-survey](#/p/opd-survey)의 세 축 중 **안정화(§6)** 와 **목적함수(§4)** 에 걸친 사례 — RL 후속학습 맥락에 특화된 신뢰영역 설계',
 'KDRL의 고정 KL 정규화 한계를 직접 겨냥한 후속 연구로, "온폴리시 KL 정규화"에서 "어드밴티지 조건부 신뢰영역"으로의 이동을 보여줌',
 'PPO/GRPO의 클리핑 메커니즘을 증류 신호 자체의 게이팅 장치로 재해석한 사례로, 이후 RL+증류 결합 연구의 참조점이 될 수 있음'
],

pitfalls:[
 '**TRRD가 "교사를 항상 따른다"는 뜻이 아니다.** $\\alpha=1$ 일 때조차 클리핑 범위 밖의 토큰에서는 영향이 제한되며, 논문은 명시적으로 "교사 모방을 고정 제약으로 부과하지 않는다"고 밝힌다.',
 '실험은 K&K Logistics(논리 추론)와 수학 추론(Skywork-OR1 레시피) 두 영역에 한정되어 있고, 모두 [Qwen3](#/p/qwen3) 계열(0.6B/1.7B/8B)로 검증됐다 — 다른 아키텍처·다른 도메인에서의 일반화는 논문 범위 밖이다.',
 '$\\alpha$ 는 튜닝이 필요한 하이퍼파라미터로 남아 있다. 논문은 민감도 분석(Table 4)을 제공하지만 "안정적인 범위"이지 "$\\alpha$ 가 필요 없어졌다"는 뜻은 아니다.'
],

links:[
 {t:'arXiv 2602.22495 — Reinforcement-aware Knowledge Distillation for LLM Reasoning', u:'https://arxiv.org/abs/2602.22495'}
]
});
