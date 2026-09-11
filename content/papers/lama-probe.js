WIKI.paper({
slug:'lama-probe',
venue:'EMNLP-IJCNLP 2019',
authors:'Petroni, Rocktäschel, Lewis, Bakhtin, Wu, Miller, Riedel (Facebook AI Research · UCL)',
arxiv:'1909.01066',

tldr:'사전학습 언어모델에 파인튜닝 없이 "Dante was born in [MASK]." 같은 빈칸 채우기 문장만 던져서 **사실 지식을 얼마나 답하는가**를 측정한 논문(LAMA). BERT-large가 지식 베이스 연결 없이도 감독 학습된 relation extraction baseline을 넘어서는 결과를 보였다.',

context:'[ELMo](#/p/elmo)·[BERT](#/p/bert) 같은 사전학습 언어모델이 구문·의미 지식을 담고 있다는 분석은 이미 여럿 있었지만, **사실적 지식(factual knowledge)**까지 담고 있는지는 별개 질문이었다. 전통적으로 사실 지식은 지식 베이스(KB)에 `(Dante, born-in, X)` 같은 구조화된 트리플로 저장하고 조회했는데, 이 방식은 스키마 설계·엔티티 링킹·관계 추출 같은 복잡한 파이프라인이 필요하고 오류가 누적된다. 저자들은 "언어모델에 빈칸 채우기 문장만 던져도 지식 베이스처럼 쓸 수 있지 않을까"라는 질문을 정면으로 검증했다.',

ideas:[
 {h:'LAMA 프로브: cloze 문장으로 지식 베이스를 흉내낸다',
  lead:'관계마다 수작업 템플릿을 만들어 트리플을 빈칸 채우기 문장으로 바꾼다.',
  d:'`(Dante, born-in, X)`라는 트리플을 "Dante was born in [MASK]."라는 문장으로 바꿔 언어모델에 던지고, [MASK] 자리에 가장 높은 확률을 배정한 토큰을 답으로 채점한다. 파인튜닝은 전혀 하지 않는다 — 사전학습 과정에서 이미 담긴 지식만을 잰다.'},
 {h:'네 종류의 지식 소스로 폭을 넓힌다',
  lead:'Google-RE·T-REx·ConceptNet·SQuAD 네 코퍼스를 서로 다른 스타일의 지식으로 활용한다.',
  d:'Google-RE·T-REx는 Wikipedia에서 정렬한 Wikidata 트리플(사실 지식), ConceptNet은 상식 관계, [SQuAD](#/p/squad)는 질의응답 쌍을 cloze 형태로 수작업 변환한 것이다. 성격이 다른 네 지식 소스에서 일관되게 관찰되는 패턴을 찾아 결론의 일반성을 높였다.'},
 {h:'어휘 교집합으로 모델 간 비교를 공정하게',
  lead:'ELMo(~80만 토큰)와 BERT(~3만 토큰)처럼 어휘 크기가 다른 모델을 같은 기준으로 비교하기 위해 공통 어휘 약 2만1천 토큰으로 제한한다.',
  d:'어휘가 클수록 정답 토큰이 상위에 랭크되기 어려워지므로, 어휘 크기 자체가 모델 간 비교를 왜곡할 수 있다. 모든 모델이 참여 모델들의 어휘 교집합 안에서만 순위를 매기게 강제해 이 왜곡을 제거했다.'},
 {h:'BERT는 감독 학습 relation extraction보다 나은 결과를 낸다',
  lead:'oracle 개체 연결까지 받은 RE baseline보다도 BERT-large의 무파인튜닝 cloze 점수가 평균적으로 더 높았다.',
  d:'Google-RE·T-REx에서 BERT-large는 entity linking oracle까지 제공받은 relation extraction 모델보다 평균 2.2~2.9점(P@1) 더 높은 정확도를 냈다. 다만 저자들은 이 결과가 "BERT가 올바른 이유로 맞혔다"는 뜻은 아니라고 스스로 단서를 달았다.'}
],

diagram:{type:'compare', cap:'같은 사실 질의 (Dante, born-in, X)를 얻는 두 경로.',
 left:{t:'지식 베이스 경로', items:['엔티티 링킹·관계 추출 파이프라인 필요','스키마를 미리 설계해야 함','symbolic 조회로 정답 반환']},
 right:{t:'LAMA(언어모델) 경로', items:['cloze 문장 하나만 입력','파인튜닝·스키마 불필요','[MASK] 예측 확률로 정답 추정']}
},

math:[
 {expr:'P@k: 정답이 상위 k개 예측 안에 있으면 1, 아니면 0',
  tex:'P@k = \\mathbb{1}[\\text{gold object} \\in \\text{top-}k\\text{ predictions}]',
  d:'각 사실(fact)마다 0 또는 1로 채점한 뒤 관계·코퍼스별로 평균을 낸 것이 본문의 핵심 지표. $k=1$일 때가 P@1, 논문의 주 지표다.'}
],

numbers:[
 {k:'BERT-large P@1 · T-REx 전체', v:'32.3', d:'34,039개 트리플, 41개 관계 평균'},
 {k:'BERT-large P@1 · Google-RE 전체', v:'10.5', d:'5,527개 트리플(생년월일·출생지·사망지 3개 관계) — 다른 코퍼스보다 낮음'},
 {k:'BERT-large P@1 · ConceptNet', v:'19.2', d:'11,458개 상식 관계 트리플'},
 {k:'BERT-large open-domain QA', v:'17.4', d:'SQuAD 305문항, 지도학습 DrQA(37.5) 대비 파인튜닝 없이 절반 수준'},
 {k:'BERT vs oracle RE baseline', v:'평균 +2.2~+2.9점(P@1)', d:'entity linking oracle까지 받은 relation extraction보다 BERT가 앞섬(Google-RE/T-REx)'},
 {k:'T-REx top-10 정답률', v:'약 80%', d:'BERT 기준, 정답이 top-10 예측 안에 드는 비율(P@10)'}
],

impact:'사전학습만으로도 상당한 사실 지식이 파라미터에 저장된다는 실증 결과는 "지식 베이스 없이 언어모델만으로 질의응답이 가능하지 않을까"라는 질문에 힘을 실었고, 이후 **[닫힌 책 QA](#/p/closed-book-qa)** 연구와 검색-증강(RAG) 논의의 출발점 중 하나가 됐다. 동시에 이 논문이 스스로 지적한 **템플릿 민감성**은, 이후 프롬프트 엔지니어링·프롬프트 앙상블 연구(예: 여러 문구로 같은 사실을 물어 평균 내는 방법)로 이어졌다.',

legacy:[
 '**[닫힌 책 QA](#/p/closed-book-qa)** — 외부 지식 베이스 없이 언어모델 파라미터만으로 답하는 연구 흐름의 초기 근거로 인용됨',
 '검색-증강(RAG) 계열 연구가 "파라미터 지식 vs 검색 지식"을 대비할 때 LAMA 결과를 기준점으로 삼음',
 '프롬프트 템플릿에 따라 정답률이 흔들린다는 관찰이 이후 프롬프트 앙상블·자동 템플릿 탐색 연구(예: LPAQA, AutoPrompt)로 이어짐',
 'cloze 기반 지식 프로빙이 이후 다국어·시간 변화 지식 프로빙 등 여러 프로브 벤치마크의 템플릿으로 확장됨'
],

pitfalls:[
 '**프롬프트 형태에 따라 결과가 크게 흔들린다.** 저자들이 직접 명시했듯 같은 사실도 템플릿을 바꾸면 정답률이 오르거나 내려가서, 논문이 보고한 수치는 "언어모델이 아는 지식의 하한선"이지 상한선이 아니다.',
 '**높은 P@1이 곧 추론을 의미하지 않는다.** BERT가 oracle RE baseline을 앞섰다는 결과가 나왔지만, 저자들도 이것이 "옳은 이유로 맞혔다"는 근거는 아니라고 못박았다 — 표면적 공기 관계(co-occurrence)만으로도 비슷한 점수가 나올 수 있다.',
 '**코퍼스마다 난이도가 크게 다르다.** Google-RE(10.5)와 T-REx(32.3)의 격차처럼, "언어모델의 지식 점수" 하나로 뭉뚱그리면 관계 유형별 편차를 놓친다 — 인명의 출생년도처럼 여러 답이 그럴듯한 관계는 특히 낮게 나온다.'
],

figures:[
 {f:'fig1-kb-vs-lm.png',
  cap:'위쪽 KG(지식 그래프)는 `(Dante, born-in, X)` 트리플을 symbolic memory access로 조회해 Florence를 얻는 전통적 경로. 아래쪽 LM은 같은 질문을 "Dante was born in [MASK]."라는 문장으로 바꿔 언어모델의 마스크 예측만으로 같은 답을 얻는다 — 이 논문이 검증하려는 것이 바로 이 두 경로가 얼마나 비슷한 성능을 내는가다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'We find that (i) without fine-tuning, BERT contains relational knowledge competitive with traditional NLP methods that have some access to oracle knowledge.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1909.01066 — Language Models as Knowledge Bases?', u:'https://arxiv.org/abs/1909.01066'},
 {t:'LAMA GitHub', u:'https://github.com/facebookresearch/LAMA'}
]
});
