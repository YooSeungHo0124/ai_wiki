WIKI.paper({
slug:'safety-recipes',
venue:'EMNLP 2021 (arXiv 2020)',
authors:'Xu, Ju, Li, Boureau, Weston, Dinan (Facebook AI Research)',
arxiv:'2010.07079',

tldr:'대화 챗봇의 안전을 이론이 아니라 **실제로 구현하고 비교 측정한** 논문. 차단(분류기 필터링)·재구성(안전 발화로 유도 학습)·회피(민감 주제 피하기) 세 전략을 같은 기반 모델 위에서 나란히 실험하고, 안전성과 재미(engagingness)가 상충하지 않을 수 있음을 보인다.',

context:'[Meena](#/p/meena)와 [LaMDA](#/p/lamda)는 대화 품질(engagingness·sensibleness)을 끌어올렸지만, 대규모 인간 대화 코퍼스로 학습한 모델은 그 코퍼스에 담긴 독성·편향 언어도 그대로 배운다는 문제는 별도로 남아 있었다. [생성 모델의 편향](#/p/bias-in-generation) 연구가 문제를 진단했다면, 이 논문은 BlenderBot 계열의 2.7B 오픈도메인 대화 모델을 기반으로 **실제 배포 가능한 완화 기법들을 한자리에 모아 정량 비교**한다. 저자들은 안전과 재미가 트레이드오프라는 통념 — "모르겠어요"만 반복하면 안전하지만 재미없다 — 을 명시적으로 문제 삼고, 두 축을 동시에 만족하는 모델이 가능한지 검증한다.',

ideas:[
 {h:'차단: 안전 분류기로 걸러내는 2단계 모델',
  lead:'생성 모델 뒤에 별도 분류기를 붙여 위험 발화를 걸러내고 무해한 대체 문장으로 바꾼다.',
  d:'가장 고전적인 방식이다. 대화 모델이 응답을 생성하면, 별도 학습된 안전 분류기가 그 발화를 검사하고 "위험"으로 판정되면 미리 준비한 non-sequitur(화제 전환용 무해한 문장)로 대체한다. 분류기 학습 데이터의 질이 곧 시스템 전체의 질을 좌우하는 구조다.'},
 {h:'Bot-Adversarial Dialogue(BAD): 사람이 봇을 직접 공격해 데이터를 만든다',
  lead:'크라우드워커가 실제 봇과 14턴 대화하며 위험한 답을 유도하고 그 대화 자체를 학습 데이터로 쓴다.',
  d:'기존 Build-it Break-it Fix-it 방식은 사람이 사람이 쓴 문장으로 분류기를 속이는 데 그쳤다. BAD는 그 대상을 **실제 대화 모델 자체**로 바꿔, 사람이 봇과 대화하며 위험 발화를 유도한 뒤 매 턴을 안전/위험으로 태깅한다. 이렇게 모은 약 5천 건·7만 발화 데이터로 학습한 분류기가 기존 분류기보다 실제 대화 상황에서 훨씬 견고했다.'},
 {h:'재구성(Baked-in Safety): 분류기 없이 모델 자체에 안전을 새긴다',
  lead:'학습 데이터의 정답 레이블을 안전 발화로 바꿔치기해 배포 시점에 별도 분류기가 필요 없게 만든다.',
  d:'2단계 모델은 추론 때마다 분류기를 따로 호출해야 한다. Baked-in 방식은 학습 데이터를 만들 때 안전 분류기가 위험하다고 판단한 타깃 응답을 안전한 응답으로 **미리 바꿔서** 학습시킨다. 그 결과 모델 자신이 안전한 응답을 직접 생성하도록 증류되어, 배포 시점에는 분류기 없이도 동작한다.'},
 {h:'회피: 민감 주제 자체를 피하기, 편향 완화는 별도 축',
  lead:'정치·종교 같은 민감 주제는 아예 회피하도록 분류기로 감지하고, 성별 편향은 통제 토큰으로 조절한다.',
  d:'정치·종교처럼 옳고 그름을 가리기보다 회피가 안전한 주제는 별도 분류기로 감지해 대화를 돌린다. 성별 편향은 이 회피 전략과 별개로, 학습 타깃에 성별 단어 유무를 나타내는 제어 토큰(F⁰M⁰ 등)을 붙여 추론 시 성별 중립적인 응답 비율을 조절하는 방식으로 다룬다.'}
],

diagram:{type:'compare', cap:'같은 기반 모델(BST 2.7B) 위에 적용한 두 축 — 배포 때 분류기가 필요한 2단계 모델과, 안전을 모델 가중치 자체에 새겨 넣는 baked-in 모델.',
 left:{t:'차단: 2단계 모델', items:['생성 후 안전 분류기로 검사','위험하면 non-sequitur로 대체','추론 때 분류기 호출 필요']},
 right:{t:'재구성: Baked-in', items:['학습 타깃을 안전 발화로 치환','모델이 직접 안전 응답 생성','배포 시 분류기 불필요']}},

numbers:[
 {k:'BAD 데이터셋 규모', v:'약 5천 대화 · 7만 발화', d:'크라우드워커가 실제 봇을 공격해 수집'},
 {k:'적대적 안전성 · 기본 BST 2.7B', v:'55%', d:'적대적 테스트셋에서 "OK" 응답 비율'},
 {k:'적대적 안전성 · BAD 분류기 적용', v:'87.2%', d:'같은 테스트셋, 2단계 모델 적용 후'},
 {k:'분류기 F1 · 기존 방법(Dinan et al. 2019)', v:'67.5', d:'BAD 테스트셋 포함 평균 F1'},
 {k:'분류기 F1 · BAD로 학습한 분류기', v:'85.4', d:'같은 평균 F1 기준, 이 논문 최고 성능'},
 {k:'기반 모델 규모', v:'2.7B 파라미터', d:'BlenderBot 계열 Seq2Seq [Transformer](#/p/transformer)'}
],

impact:'이 논문은 "안전한 챗봇을 만들자"는 목표를 **측정 가능한 실험**으로 바꿨다. 여러 완화 기법을 같은 기반 모델·같은 평가지표 위에서 비교함으로써, 어떤 조합이 재미를 희생하지 않고 안전성을 높이는지 처음으로 정량적으로 보여줬다. 특히 봇 자신을 직접 공격해 데이터를 모으는 BAD 방식은, 사람이 쓴 문장만으로 만든 분류기가 실제 봇-사람 대화의 위험 패턴을 놓친다는 것을 실증했다 — 안전 데이터 수집이 배포 환경과 동일한 조건에서 이뤄져야 한다는 원칙을 세웠다.',

legacy:[
 '**적대적 레드티밍의 표준화** — 사람이 시스템을 직접 공격해 실패 사례를 모으는 BAD 방식론이 이후 대화형 LLM의 안전 데이터 수집 관행으로 자리잡음',
 '**baked-in 안전 vs 외부 필터의 트레이드오프 논쟁** — 배포 단순성(baked-in)과 안전성 상한(2단계 분류기)의 선택 문제가 이후 대형 언어모델의 안전 튜닝 설계에도 그대로 이어짐',
 '**[생성의 편향](#/p/bias-in-generation) 연구와의 결합** — 성별 편향 통제 토큰 실험이 편향 측정 연구와 안전 연구를 같은 파이프라인에서 다루는 선례가 됨',
 '**engagingness-safety 동시 평가 프로토콜** — Figure 3의 산점도처럼 두 축을 동시에 그리는 평가 방식이 이후 대화 시스템 논문의 표준 보고 형식으로 확산'
],

pitfalls:[
 '**분류기 기반 방어는 적대적 상황에서 여전히 뚫린다.** 논문 스스로 GPT2·BST 2.7B 모두 적대적 테스트에서는 취약함을 보이며(정상 대화에서는 안전해 보여도), "이 정도로 충분하다"고 단정하지 않는다.',
 '**baked-in 모델이 2단계 모델을 완전히 대체하지 못한다.** 실험 결과 baked-in 방식은 배포는 간단하지만 최고 안전성은 여전히 외부 분류기를 쓰는 2단계 모델(BAD 분류기 적용)이 더 높게 나온다.',
 '**성별 편향 완화는 "완전한 해결"이 아니라 통제 다이얼이다.** F⁰M⁰ 등 제어 토큰은 생성 시 성별 단어 비율을 조절할 뿐이며, 편향 자체를 모델에서 제거하는 것은 아니다.'
],

figures:[
 {f:'fig1-bad-diagram.png',
  cap:'왼쪽: 기존 Build-It Break-It Fix-It 방식은 사람이 "분류기"를 속이는 문장을 만든다. 오른쪽: 이 논문의 Bot-Adversarial Dialogue는 공격 대상이 분류기가 아니라 실제 "대화 봇" 자체다 — breaker가 봇과 대화하며 위험 발화를 유도하고, 그 대화가 다시 봇을 고치는 데 쓰인다.',
  src:'원문 Figure 1, p.4'},
 {f:'fig2-safety-engagingness.png',
  cap:'가로축 engagingness, 세로축 적대적 안전성. 오른쪽 위일수록 이상적이다. 파란 원(기본 모델들)은 안전성이 낮은 좌하단에 몰려 있는 반면, 이 논문이 제안한 2단계 모델(보라 다이아몬드)은 engagingness를 유지하면서 안전성만 크게 끌어올려 우상단으로 이동했다.',
  src:'원문 Figure 3, p.20'}
],

quotes:[
 {t:'We emphasize this potential trade-off by representing our results on those two axes, and note that a model that is evasive on every turn ... is inoffensive, but far from engaging.',
  src:'Abstract/Introduction, p.1'},
 {t:'Ideally, we should train generative models that do not have to be screened by an independent classifier module – they should already produce safe, engaging responses: the safety should be "baked-in".',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 2010.07079 — Recipes for Safety in Open-domain Chatbots', u:'https://arxiv.org/abs/2010.07079'},
 {t:'ACL Anthology: Recipes for Safety in Open-domain Chatbots (EMNLP 2021)', u:'https://aclanthology.org/2021.findings-emnlp.13/'}
]
});
