WIKI.paper({
slug:'sparrow',
venue:'arXiv 2022 (DeepMind)',
authors:'Glaese, McAleese, Trebacz et al. (DeepMind)',
arxiv:'2209.14375',

tldr:'[Chinchilla](#/p/chinchilla) 70B를 기반으로 한 대화 에이전트를, 단일 선호 대신 **23개 규칙(rule) 각각에 대해 사람 판단을 따로 받고** 사실 주장에는 검색으로 **인용 증거를 붙이는** RLHF로 정렬한 논문. 적대적 프로빙에서 규칙을 어긴 비율이 **8%**, 증거가 실제로 답변을 뒷받침한 비율이 **78%**였다.',

context:'[InstructGPT](#/p/instructgpt)는 응답 전체에 대한 단일 선호 순위로 보상모델을 학습시킨다. 이 방식은 "왜 이 응답이 나쁜가"를 세분화하지 못해, 평가자가 유해성·과장된 확신·주제 이탈 같은 서로 다른 실패를 뭉뚱그려 하나의 점수로 표현해야 한다. Sparrow는 [LaMDA](#/p/lamda)의 규칙 기반 평가나 Anthropic의 helpful·harmless 어시스턴트 연구가 쓰는 단일 보상모델과도 다르게, **행동 규범을 여러 개의 구체적인 규칙으로 쪼개고** 각 규칙 위반 여부를 별도로 라벨링한다. 동시에 사실 정확성을 대화형으로 검증하기 위해 GopherCite식 검색 인용을 대화 에이전트로 확장한다.',

ideas:[
 {h:'23개 규칙으로 helpful·harmless를 분해한다',
  lead:'"위협적 발언 금지"·"금융 조언 금지" 같은 짧고 독립적인 규칙을 개별적으로 판단하게 한다.',
  d:'Stereotypes·Hate and harassment·Self-anthropomorphism·Misinformation 등 카테고리별로 총 23개 규칙을 정의한다. 각 규칙은 평가자가 맥락 없이도 즉시 이해할 수 있도록 **짧고 독립적**으로 쓰였다. InstructGPT류의 "helpful/harmless 정도"라는 모호한 단일 축 대신, "이 응답이 규칙 X를 어겼는가"라는 구체적 이진 질문을 던져 라벨의 잡음을 줄인다.'},
 {h:'선호와 규칙 위반을 각각 다른 보상모델로 학습',
  lead:'Preference RM은 응답 선호 순위를, Rule RM은 규칙별 위반 확률을 따로 학습한다.',
  d:'두 보상모델 모두 Chinchilla 70B에서 미세조정된다. Preference RM은 사람이 매긴 응답 간 선호를 Elo 점수로 학습하고, Rule RM은 (대화, 규칙) 쌍을 입력받아 해당 규칙이 깨졌을 확률 $r(x,y)\\in[0,1]$ 을 추정하는 조건부 분류기다. Rule RM은 모든 규칙에 대해 **공동으로** 학습돼 규칙 간 정보를 공유한다.'},
 {h:'Search Query·Search Result를 대화 참여자로 넣는다',
  lead:'User·Agent 외에 검색 질의를 만드는 참여자와 검색 결과를 주입하는 참여자를 추가한다.',
  d:'대화를 User·Agent 두 참여자로만 구성하지 않고 Search Query(검색어 생성)·Search Result(Google Search로 얻은 스니펫 삽입) 두 참여자를 더한다. Agent가 검색을 할지 말지, 무엇을 검색할지를 스스로 생성하며, 검색 결과는 그대로 다음 문맥에 이어붙여 답변의 근거가 된다.'},
 {h:'다중 목표 RLHF: 위반율은 낮추고 선호는 올린다',
  lead:'Rule RM의 위반 확률과 Preference RM의 선호 점수를 A2C로 동시에 최적화한다.',
  d:'DPC(Dialogue-Prompted Chinchilla)를 시작점으로, advantage actor-critic(A2C)을 써서 두 보상 신호를 함께 최적화한다. 단일 스칼라 보상으로 합치는 대신 규칙 위반 추정치와 선호 점수를 별도 항으로 유지해, "더 선호되지만 규칙도 더 어기는" 트레이드오프를 명시적으로 관찰할 수 있게 한다. 학습·평가·재수집을 반복하는 online 루프로 데이터를 계속 늘려간다.'},
 {h:'재순위화(reranking)로 검색 여부까지 결정한다',
  lead:'추론 시 N개 후보를 Preference RM·Rule RM 점수로 재순위화해 검색 사용 여부까지 고른다.',
  d:'학습된 보상모델을 추론 시점에도 활용해, 검색을 쓴 응답과 안 쓴 응답을 함께 생성한 뒤 $R_{pr}$(선호 점수)와 규칙별 $R_{rule_i}$ 를 결합한 점수로 재순위화한다. 이는 사실이 아닌 질문에 불필요한 근거를 붙이는 것을 피하고, 사실 질문에는 근거 있는 응답을 고르는 "검색 여부 자체의 선택적 예측" 역할을 한다.'}
],

diagram:{type:'compare', cap:'InstructGPT의 단일 선호 파이프라인과 Sparrow의 규칙 분해·검색 인용 파이프라인 비교.',
 left:{t:'InstructGPT', items:['응답 전체에 단일 선호 순위','보상모델 하나로 전부 표현','검색·인용 없음']},
 right:{t:'Sparrow', items:['23개 규칙을 개별 판단','Preference RM + Rule RM 분리','Search Query/Result로 인용 증거 제공'], acc:true}},

math:[
 {expr:'r(x, y) ∈ [0, 1]  — Rule RM이 추정하는 규칙 위반 확률',
  tex:'r(x,y)\\in[0,1]',
  d:'대화 $x$ 에 대한 응답 $y$ 가 특정 규칙을 어겼을 확률. 모든 규칙에 대해 하나의 조건부 분류기로 공동 학습된다.'},
 {expr:'R_rerank ∝ Σ R_rule_i / ( e^{R_pr} + e^{AVG(R_pr)} )',
  tex:'R_{\\text{rerank}} \\propto \\frac{\\prod_{i=1}^{n} R_{\\text{rule}_i}}{e^{R_{pr}} + e^{\\mathrm{AVG}(R_{pr})}}',
  d:'추론 시 N개 후보 응답을 재순위화하는 점수. 분모의 선호 점수 $R_{pr}$ 이 평균보다 낮으면 페널티가 커지고, 분자의 규칙별 위반 확률의 곱이 하나라도 낮으면(규칙을 어기면) 전체 점수가 크게 깎인다.'}
],

numbers:[
 {k:'규칙 위반율 (적대적 프로빙)', v:'8%', d:'사람이 규칙을 어기도록 의도적으로 유도했을 때 Sparrow가 실제로 위반한 비율'},
 {k:'증거 지지율', v:'78%', d:'사실 질문에 검색 증거를 붙였을 때, 그 증거가 실제로 응답을 뒷받침하고 그럴듯했던 비율'},
 {k:'기반 모델', v:'Chinchilla 70B', d:'DPC(프롬프트만 적용)를 출발점으로 SFT·RL 두 갈래로 미세조정'},
 {k:'규칙 수', v:'23개', d:'Stereotypes·Hate/harassment·Self-anthropomorphism·Misinformation 등 카테고리로 구성'},
 {k:'RL 알고리즘', v:'A2C', d:'PPO 대신 advantage actor-critic으로 Rule RM·Preference RM 보상을 동시 최적화'}
],

impact:'단일 스칼라 보상으로 뭉뚱그리던 RLHF 파이프라인을, 세분화된 규칙별 판단과 검색 증거라는 두 축으로 쪼갤 수 있음을 실증했다. 규칙별 라벨은 실패 모드를 구체적으로 진단하고 타겟팅해서 고칠 수 있게 해주고, 검색 인용은 "그럴듯하지만 근거 없는 답변"이라는 RLHF의 고질적 문제에 정면으로 대응한다. 동시에 논문은 규칙을 잘 지키게 만드는 것이 분포적 편향(distributional bias)을 반드시 줄이지는 않는다는 한계도 스스로 보고한다.',

legacy:[
 '**규칙 기반 정렬의 계보** — [Constitutional AI](#/p/constitutional)류의 "명시적 원칙 목록에 따른 정렬" 접근과 문제의식을 공유하며, 이후 정렬 연구가 "선호 하나"에서 "세분화된 규범 목록"으로 확장되는 흐름의 초기 사례로 자주 인용된다',
 '**검색 증강 대화의 표준화** — Search Query/Result를 대화 참여자로 넣는 설계는 이후 검색 도구를 쓰는 대화 에이전트들이 채택하는 패턴이 됐다',
 '**GopherCite에서 대화로** — 단일 턴 QA에서의 근거 인용 기법을 멀티턴 대화로 확장하며, "출처를 다는 챗봇"이라는 이후 상용 챗봇들의 기능적 전례가 되었다'
],

pitfalls:[
 '**8%는 "적대적으로 프로빙했을 때"의 수치다.** 일반적인 사용 상황에서의 위반율이 아니라, 사람이 규칙을 깨뜨리려고 의도적으로 시도한 대화에서의 비율이라는 점을 놓치면 안전성을 과대평가하게 된다.',
 '**23개 규칙은 helpful·harmless만 다루고 honest(정직)는 다루지 않는다.** 저자들은 helpful·honest·harmless(HHH) 분해에서 honest 대신 correct를 쓴다고 명시한다 — 이 논문의 방법이 모델의 정직성 자체를 직접 다루지는 않는다.',
 '**규칙 준수가 편향을 자동으로 줄이지 않는다.** 논문은 규칙을 더 잘 따르도록 학습된 모델이 분포적 공정성 측면에서는 오히려 우려를 키울 수 있다고 별도 절에서 분석한다 — "규칙을 잘 지킨다 = 전반적으로 더 안전하다"로 단순화하면 이 부분을 놓친다.'
],

figures:[
 {f:'fig4-evidence.png',
  cap:'왼쪽이 모델에 실제로 들어가는 텍스트 문맥(Search Query·Search Results가 대화 참여자로 삽입됨), 오른쪽이 사람 평가자에게 보이는 렌더링 — 답변 아래 출처와 함께 지지 문장이 인용 카드로 따로 표시된다.',
  src:'원문 Figure 4, p.6'}
],

quotes:[
 {t:'For factual questions, evidence provided by Sparrow supports the sampled response 78% of the time. Sparrow is preferred more often than baselines while being more resilient to adversarial probing by humans, violating our rules only 8% of the time when probed.', src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2209.14375 — Sparrow', u:'https://arxiv.org/abs/2209.14375'},
 {t:'DeepMind blog — Building safer dialogue agents', u:'https://www.deepmind.com/blog/building-safer-dialogue-agents'}
]
});
