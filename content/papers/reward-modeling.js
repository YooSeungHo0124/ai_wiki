WIKI.paper({
slug:'reward-modeling',
venue:'arXiv 2018 (DeepMind)',
authors:'Leike, Krueger, Everitt, Martic, Maini, Legg (DeepMind)',
arxiv:'1811.07871',

tldr:'실제 세계의 과제는 게임과 달리 명시적인 보상 함수가 없다는 문제("agent alignment problem")를, **보상 모델을 사람 피드백으로 따로 학습시키고 RL은 그 보상을 최적화하는 데만 쓴다**는 구조로 풀자고 제안한 DeepMind의 연구 방향 논문. 사람이 직접 평가할 수 없는 과제까지 확장하기 위한 재귀적 보상 모델링 구상도 함께 제시한다.',

context:'Atari나 바둑 같은 벤치마크는 점수·승패라는 명시적 보상 함수가 이미 주어져 있어 RL 알고리즘의 진보를 측정하기 쉽다. 그러나 이메일 답장이나 소프트웨어 개발처럼 실제로 사람에게 도움이 되는 과제는 "잘했다"를 계산해 줄 함수가 없다 — 과제의 목적은 사용자의 머릿속에만 암묵적으로 존재한다. 손으로 보상 함수를 설계하면 **reward hacking**(의도치 않은 허점을 이용하는 행동)이나 부작용이 튀어나오기 쉽다는 것도 이미 알려져 있었다. 저자들은 이를 **agent alignment problem** — "사용자의 의도에 맞게 행동하는 에이전트를 어떻게 만들 것인가" — 로 명명하고, 이 문제를 정면으로 다루는 연구 방향을 제시한다.',

ideas:[
 {h:'보상 모델링: "무엇을"과 "어떻게"를 분리한다',
  lead:'사용자 피드백으로 보상 모델을 먼저 학습시키고, RL은 그 보상만 최적화한다.',
  d:'문제를 두 단계로 쪼갠다. (1) 사용자의 피드백(비교·시연·수정 등)으로부터 사용자의 의도를 근사하는 **보상 모델**을 학습하고, (2) 그 보상 모델이 주는 점수를 [강화학습](#/p/rlhf-prefs)으로 최적화해 정책(에이전트)을 훈련한다. "무엇을 달성할지"(What)를 사람 피드백에서 배우고 "어떻게 달성할지"(How)를 RL에 맡기는 분업이 핵심이다.'},
 {h:'재귀적 보상 모델링: 평가 능력 자체를 에이전트로 증강한다',
  lead:'이전 단계 에이전트 $A_{k-1}$가 사용자를 도와 다음 에이전트 $A_k$의 보상 모델 평가를 보조한다.',
  d:'사람이 직접 평가하기 힘든 과제(예: x86 기계어, 접힌 단백질, 신경망 내부 활성값)에서는 보상 모델링 자체가 막힌다. 해법은 이전 단계에서 훈련된 에이전트 $A_{k-1}$를 사용자의 **평가 보조 도구**로 투입하는 것이다. 사용자는 $A_{k-1}$의 도움을 받아 더 복잡한 과제의 결과를 평가하고, 그 피드백으로 더 강력한 $A_k$를 훈련한다. 이 과정을 반복하면 원래 사람이 평가할 수 없던 영역까지 단계적으로 확장할 수 있다는 것이 이 논문에서 가장 독창적인 제안이다.'},
 {h:'세 가지 설계 원칙: 확장 가능·경제적·실용적',
  lead:'초인간 성능까지 버티고, 다른 방법 대비 비용 열세가 없어야 하며, 완전한 해가 아니어도 된다.',
  d:'제안하는 방향이 만족해야 할 조건을 명시적으로 못박는다. **Scalable**(에이전트 성능이 사람을 넘어서도 계속 작동), **Economical**(정렬된 에이전트를 만드는 것이 정렬 안 된 에이전트보다 비용 면에서 불리하면 안 됨 — 그래야 실제로 채택된다), **Pragmatic**(안전 문제를 전부 풀 필요는 없고, 실용적으로 충분한 수준이면 된다). 이 세 원칙이 이후 논문의 모든 설계 판단의 기준이 된다.'},
 {h:'스케일링이 만들어낼 도전을 미리 목록화한다',
  lead:'분포 이동·reward hacking·비가역적 실수·불충분한 피드백을 스케일의 함수로 예상한다.',
  d:'보상 모델링을 복잡하고 일반적인 도메인으로 확장하면 부딪힐 문제를 미리 정리한다 — 학습 분포 밖 상태에서의 **분포 이동(distributional shift)**, 보상 모델의 허점을 이용하는 **reward hacking**, 되돌릴 수 없는 실수를 저지르는 문제, 그리고 사용자가 원하는 바를 정확히 반영하지 못하는 **불충분한 피드백**이다. 각 문제에 안전 탐색·불확실성 인지·모델 기반 계획 같은 완화책을 후보로 제시하지만, 스스로 "이 방향이 실제로 작동할지는 열린 연구 질문"이라고 명시한다.'},
 {h:'신뢰 확보: 디자인만으로는 부족하고 증거가 필요하다',
  lead:'테스트·해석 가능성·정형 검증·이론적 보장까지 다섯 갈래의 신뢰 구축 경로를 나열한다.',
  d:'에이전트를 배포하려면 "정렬됐을 것 같다"가 아니라 **정렬됐다는 증거**가 필요하다. 설계 선택, 적대적/분포 밖 테스트, 해석 가능성 도구로 내부를 들여다보기, 정형 검증, 이론적 보장이라는 다섯 경로를 나열하며 어느 하나로는 부족하고 서로 보완해야 한다고 본다.'}
],

diagram:{type:'loop', cap:'재귀적 보상 모델링. 이전 단계 에이전트가 다음 단계 평가를 보조하며 반복된다.', center:'단계 k마다 반복',
 nodes:[
  {t:'에이전트 A(k-1)', s:'이전 단계 산출물'},
  {t:'사용자 평가 보조', s:'A(k-1)이 돕는다', acc:true},
  {t:'보상 모델 학습', s:'user feedback로 학습'},
  {t:'에이전트 A(k) 훈련', s:'RL로 보상 최적화'}
 ]},

math:[
 {expr:'r(τ) ≈ user intention, where τ = trajectory',
  tex:'r(\\tau) \\approx \\text{user intention},\\quad \\tau = \\text{trajectory}',
  d:'보상 모델링의 목표를 요약한 식. 사람이 직접 짤 수 없는 보상 함수 $r$을, 궤적 $\\tau$에 대한 사용자 피드백으로부터 근사 학습한다는 것이 전체 구도다. 논문은 구체적 손실함수보다 이 프레임 자체를 제안하는 개념 논문이라 수식은 최소한으로만 등장한다.'}
],

numbers:[
 {k:'제안하는 설계 원칙', v:'3가지', d:'Scalable · Economical · Pragmatic'},
 {k:'스케일링 시 예상 도전', v:'4가지', d:'분포 이동 · reward hacking · 비가역적 실수 · 불충분한 피드백'},
 {k:'신뢰 확보 경로', v:'5가지', d:'설계 선택 · 테스트 · 해석 가능성 · 정형 검증 · 이론적 보장'},
 {k:'저자 소속', v:'DeepMind (+ Mila 인턴)', d:'전원 DeepMind 소속, 1저자 Jan Leike는 이후 OpenAI superalignment 리드로 이동'}
],

impact:'RLHF를 "사람이 직접 보상을 줄 수 있는 규모"에서 "사람이 평가조차 할 수 없는 규모"로 확장하는 이론적 청사진을 제시했다. 특히 재귀적 보상 모델링은 이후 [iterated amplification](#/p/agent-alignment), debate 같은 **scalable oversight**(확장 가능한 감독) 연구 계열의 공통 조상 역할을 했고, 실제 RLHF 파이프라인이 [요약 RLHF](#/p/summarize-hf)·[InstructGPT](#/p/instructgpt)로 산업에 정착하기 전에 그 구조("보상 모델 학습 + RL 최적화")를 먼저 정식화한 논문이다.',

legacy:[
 '**RLHF 파이프라인의 이론적 원형** — "보상 모델을 학습하고 RL로 최적화한다"는 구조가 [요약 RLHF](#/p/summarize-hf)·[InstructGPT](#/p/instructgpt)에서 그대로 실전 구현됨',
 '**scalable oversight 계열의 출발점** — 재귀적 보상 모델링의 문제의식이 iterated amplification·debate·[언어 에이전트 정렬](#/p/agent-alignment) 논의로 이어짐',
 '**정렬 연구의 어휘 정립** — agent alignment problem, reward hacking, distributional shift 같은 용어를 하나의 틀로 묶어 이후 안전성 논문들의 공통 참조점이 됨',
 '**RLHF의 스케일 한계에 대한 선제적 경고** — 사람이 직접 평가할 수 없는 과제에서 RLHF가 부딪힐 한계를 2018년 시점에 예견, 이후 초인간 모델 정렬 논의의 배경이 됨'
],

pitfalls:[
 '**이 논문은 알고리즘이 아니라 연구 방향(agenda)이다.** 구체적 손실함수나 실험 결과가 아니라 "이런 구조로 접근해 보자"는 제안이므로, 실제 구현 세부는 [rlhf-prefs](#/p/rlhf-prefs)·[요약 RLHF](#/p/summarize-hf) 같은 후속 논문에서 찾아야 한다.',
 '**재귀적 보상 모델링이 실제로 작동한다는 실증은 이 논문에 없다.** 저자들 스스로 "열린 연구 질문"이라고 반복해서 명시하며, 각 단계마다 오차가 누적될 위험도 별도로 논의한다.',
 '**"보상 모델 = 안전"이 아니다.** 보상 모델 자체가 사용자 의도를 잘못 근사하면 그 오차를 RL이 그대로(혹은 증폭해) 최적화하므로, 보상 모델의 부정확성이 정렬 실패의 새로운 원천이 된다는 점을 논문도 §4에서 지적한다.'
],

figures:[
 {f:'fig1-reward-modeling.png',
  cap:'reward model이 user의 feedback으로 학습되고(왼쪽 화살표), agent는 그 reward model이 주는 점수만 보고 environment와 상호작용(observation/action)한다. user는 environment의 trajectories를 보고 feedback을 준다 — "무엇을"(reward model)과 "어떻게"(agent)의 분리가 도식의 핵심.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-recursive.png',
  cap:'Figure 1 구조에 agent A(k-1)이 추가된 것. user가 A(k)를 훈련하기 위해 A(k-1)과 상호작용(interaction)해 평가를 보조받는다 — 사람이 직접 평가할 수 없는 과제로 확장하기 위한 재귀 구조.',
  src:'원문 Figure 2, p.7'}
],

quotes:[
 {t:"This gives rise to the agent alignment problem: how do we create agents that behave in accordance with the user's intentions?",
  src:'Abstract, p.1'},
 {t:"We separate learning what to achieve (the 'What?') from learning how to achieve it (the 'How?'). We call this approach reward modeling.",
  src:'§1, p.2'}
],

links:[
 {t:'arXiv 1811.07871 — Scalable Agent Alignment via Reward Modeling', u:'https://arxiv.org/abs/1811.07871'},
 {t:'DeepMind Safety Research (블로그)', u:'https://deepmindsafetyresearch.medium.com/'}
]
});
