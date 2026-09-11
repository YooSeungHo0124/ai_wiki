WIKI.paper({
slug:'deliberative-alignment',
venue:'arXiv 2024 (OpenAI)',
authors:'Guan, Joglekar, Wallace, Jain, Barak et al. (OpenAI)',
arxiv:'2412.16339',

tldr:'안전 규칙(스펙)을 라벨 생성에만 쓰고 버리는 대신, 모델이 **CoT 안에서 그 규칙 자체를 명시적으로 불러와 근거로 삼도록** 학습시키는 방법. OpenAI의 o-시리즈에 적용해 탈옥 저항성과 과잉거부 감소를 동시에 개선했다.',

context:'기존 안전 학습(SFT+RLHF, [Constitutional AI](#/p/constitutional))은 모델이 규칙을 간접적으로 패턴화해서 배운다는 한계가 있다. [Constitutional AI](#/p/constitutional)조차 헌법 텍스트로 AI가 초안을 비평·수정하게 한 뒤, 최종적으로 남는 것은 **수정된 답변뿐**이고 그 답변이 어떤 규칙을 근거로 나왔는지는 모델에 남지 않는다. 게다가 모델은 고정된 연산량으로 즉각 답해야 해서, 복잡한 안전 시나리오에도 숙고할 여유가 없다. 이 논문은 o1 같은 추론 모델이 이미 CoT로 테스트 타임 계산을 쓸 수 있다는 점에 착안해, 그 사고 과정 안에 안전 규칙을 직접 넣는 방법을 제안한다.',

ideas:[
 {h:'스펙을 라벨이 아니라 사고 과정의 재료로 쓴다',
  lead:'CoT 자체를 지도학습해 규칙의 내용과 그것을 적용하는 방법을 모델 안에 남긴다.',
  d:'기존 [RLAIF](#/p/rlaif) 계열은 안전 스펙으로 학습 라벨(정답/선호 데이터)을 만들 뿐, 학습이 끝나면 스펙 자체는 모델에서 사라진다. 반면 이 방법은 (프롬프트, CoT, 출력) 데이터에서 **CoT가 관련 스펙 조항을 직접 인용하며 추론하도록** SFT를 건다. 그 결과 모델은 추론 시점에 관련 정책을 스스로 불러와("이 요청은 자해 카테고리의 안전 완성 조항에 해당한다") 적용할 수 있게 된다.'},
 {h:'2단계 학습: 컨텍스트 증류 SFT + 판사 모델 RL',
  lead:'스펙-비인지 모델에 스펙을 시스템 프롬프트로 줘서 답을 생성시킨 뒤, 그 스펙을 지우고 학습한다.',
  d:'1단계는 유용성만 학습된(안전 데이터 없이 학습된) `G_base` 모델에 카테고리별 안전 스펙을 시스템 프롬프트로 주고 (CoT, 출력)을 생성시킨 뒤, 시스템 프롬프트(스펙)를 지워 (프롬프트, CoT, 출력) 데이터셋을 만드는 **컨텍스트 증류**다. 사람이 쓴 CoT나 답변이 전혀 필요 없다. 2단계는 스펙에 접근 가능한 "판사" 추론 모델 `G_RM`이 (CoT, 출력)에 정책 준수 여부로 점수를 매겨 추가 보상 신호를 주는 RL이다.'},
 {h:'거부율과 과잉거부율을 동시에 개선하는 파레토 이동',
  lead:'탈옥 저항성을 올리면서 무해한 요청의 과잉거부는 오히려 줄인다 — 흔한 트레이드오프를 깬다.',
  d:'보통 안전을 강화하면 무해한 질문까지 거부하는 과잉거부가 늘어나는 트레이드오프가 생긴다. o1 모델은 StrongREJECT 탈옥 저항성과 XSTest 과잉거부 정확도 두 축 모두에서 GPT-4o보다 우수해, 기존 방법들의 파레토 프론티어 자체를 밀어낸다.'},
 {h:'사람이 쓴 CoT·답변 없이 합성 데이터만으로',
  lead:'인간 라벨러의 CoT 작성 없이, 모델 스스로 생성한 데이터로 전 파이프라인을 돌린다.',
  d:'사람이 직접 체인오브소트나 정답 예시를 작성할 필요가 없다는 것이 확장성의 핵심이다. 모든 학습 데이터가 컨텍스트 증류와 판사 모델의 자동 채점으로 생성되므로, 새 안전 카테고리가 추가돼도 사람의 개입 없이 파이프라인을 재사용할 수 있다.'}
],

diagram:{type:'compare', cap:'스펙을 다루는 방식의 차이 — 라벨 생성에만 쓰고 버리는가, CoT 안에 남기는가.',
 left:{t:'Constitutional AI', items:['헌법으로 초안을 비평·수정','최종 수정본만 SFT에 사용','스펙 자체는 모델에 남지 않음']},
 right:{t:'숙고적 정렬', items:['CoT가 스펙 조항을 직접 인용','추론 시점에 관련 정책을 스스로 호출','판사 모델이 CoT까지 채점(RL)'], acc:true}},

math:[],

numbers:[
 {k:'탈옥 저항 (StrongREJECT goodness@0.1)', v:'GPT-4o 0.37 → o1 0.88', d:'o1-preview 0.66, o3-mini 0.75 — o1이 가장 높음'},
 {k:'과잉거부 정확도 (XSTest)', v:'GPT-4o 0.88 → o1 0.93', d:'o1-preview가 0.976으로 더 높지만 탈옥 저항은 o1이 앞섬 — 두 모델이 서로 다른 지점에서 파레토 프론티어를 그림'},
 {k:'자해 안전완성 스타일 준수', v:'GPT-4o 0.04 → o1 0.92', d:'Response Style Guidelines 항목, self-harm safe completion 지표'},
 {k:'규제 조언 안전완성 준수', v:'GPT-4o 0.28 → o1 0.65', d:'같은 항목의 regulated advice(의료·법률 조언) 하위 지표'},
 {k:'적용 모델', v:'o1-preview · o1 · o3-mini', d:'OpenAI o-시리즈 추론 모델에 적용'}
],

impact:'CoT를 활용한 테스트 타임 계산이 성능뿐 아니라 **안전성**에도 쓰일 수 있음을 보였다. "규칙을 어떻게 훈련 데이터에 반영하는가"에서 "규칙을 추론 과정 자체의 대상으로 만드는가"로 안전 정렬의 프레임을 옮겼고, 사람이 쓴 CoT 없이 컨텍스트 증류 + 판사 모델만으로 전체 파이프라인을 자동화할 수 있음을 보여 확장성 문제도 함께 다뤘다.',

legacy:[
 '[Constitutional Classifiers](#/p/constitutional-classifiers) 등 이후 OpenAI·Anthropic의 안전 연구가 "추론 시점에 정책을 참조시킨다"는 아이디어를 공유하며 발전',
 '탈옥 저항성과 과잉거부율을 하나의 파레토 그래프로 나란히 보고하는 관행이 안전성 평가의 표준 표현 방식으로 자리잡음',
 '사람이 쓴 CoT 없이 컨텍스트 증류로 추론 학습 데이터를 만드는 방식이 안전 정렬 밖의 일반 추론 모델 학습에도 참조됨'
],

pitfalls:[
 '**[Constitutional AI](#/p/constitutional)의 "실패"가 아니라 "다른 지점"이다.** CAI도 안전 스펙(헌법)을 쓰지만 최종 학습 신호는 수정된 답변뿐이고 스펙 자체는 모델에 남지 않는다 — 이 차이가 핵심이지, CAI가 스펙을 안 쓴다는 뜻이 아니다.',
 'o1-preview가 XSTest 과잉거부 정확도(0.976)에서는 o1(0.93)보다 높다. "o1 계열이 모든 지표에서 항상 최고"라고 단순화하면 안 되고, 어느 모델·어느 지표인지 표를 그대로 봐야 한다.',
 'RL 단계는 o1과 o3-mini에만 추가됐고 o1-preview에는 적용되지 않았다 — 세 모델의 학습 단계가 동일하지 않다.'
],

figures:[
 {f:'fig2-pareto.png',
  cap:'x축은 StrongREJECT 탈옥 저항성, y축은 XSTest 과잉거부 정확도. 원형 점은 GPT-4o·Claude·Gemini 등 CoT 안전 추론이 없는 기존 모델들이고, 별 모양(o1-preview·o1)이 오른쪽 위로 이동해 있다 — 두 축을 동시에 개선한 파레토 이동을 보여준다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'We introduce Deliberative Alignment, a new paradigm that directly teaches the model safety specifications and trains it to explicitly recall and accurately reason over the specifications before answering.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2412.16339', u:'https://arxiv.org/abs/2412.16339'}
]
});
