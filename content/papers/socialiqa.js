WIKI.paper({
slug:'socialiqa',
venue:'EMNLP 2019',
authors:'Sap et al. (Allen Institute for AI · U. Washington)',
arxiv:'1904.09728',

tldr:'사회적 상황에서의 상식 추론을 묻는 최초의 대규모 3지선다 벤치마크다. `사람이 왜 그랬는지`, `다음에 무엇을 원하는지`, `주변 사람이 어떻게 느낄지`를 묻는 38,000문항을 지식그래프 ATOMIC에서 파생시켜 만들었다.',

context:'2019년까지 상식 추론 벤치마크는 대부분 **물리적·서술적 상식**에 머물러 있었다. 문장을 자연스럽게 잇는 [HellaSwag](#/p/hellaswag)나 일상 사물의 물리적 인과를 묻는 PIQA류 과제는 "다음에 무슨 일이 일어나는가"는 다루지만, "그 사람은 왜 그랬고 남들은 그것을 보고 어떻게 느끼는가" 같은 **심리 이론(Theory of Mind)** 축은 비어 있었다. [BERT](#/p/bert) 이후 언어모델이 여러 QA에서 사람에 근접했지만, 저자들은 사회적 상황에서는 여전히 크게 뒤처진다는 것을 보이려 했다. 재료는 이미 있었다 — Sap et al.이 직접 만든 지식그래프 ATOMIC이 24k개 사건에 대해 원인·반응·다음 행동 같은 9종의 추론을 담고 있었지만, 그것을 사람이 실제로 풀 수 있는 객관식 QA로 바꾸는 절차가 없었다.',

ideas:[
 {h:'ATOMIC 지식그래프를 QA로 변환',
  lead:'지식그래프의 사건-추론 트리플을 자연어 컨텍스트와 질문으로 다시 쓴다.',
  d:'ATOMIC은 "PersonX가 음식을 쏟았다 → xWant: 치우고 싶어한다"처럼 사건과 9종 추론 차원(원인·반응·다음행동 등)의 트리플로 되어 있다. 저자들은 각 사건 문구에 이름을 채워 자연스러운 문장으로 바꾸고("Alex spilled food all over the floor"), 해당 추론 차원에 맞는 질문 템플릿("What will Alex want to do next?")을 자동 생성한 뒤, 크라우드워커에게 정답 두 개를 쓰게 했다. 지식그래프가 이미 다양한 사회적 상황을 커버하고 있었으므로 질문 다양성이 처음부터 보장됐다.'},
 {h:'Question-Switching Answers: 오답도 정답처럼 쓰이게 만든다',
  lead:'다른 추론 차원의 정답을 그대로 가져와 이 질문의 오답으로 쓴다.',
  d:'오답을 사람이 직접 지어내면 부정어를 쓰거나("~하지 않았다") 문체가 어색해지는 등 통계적 편향(annotation artifact)이 남는다. 이 논문은 **같은 컨텍스트에 대한 다른 질문**(예: "이후에 무엇을 할까" 대신 "이전에 무엇이 필요했을까")의 정답을 가져와 원래 질문의 오답으로 재활용한다. 그 답은 컨텍스트와 강하게 관련되고 문체도 정답과 구분되지 않지만, 묻는 것과는 다른 종류의 추론이라 논리적으로는 틀린 답이 된다. VAD(valence-arousal-dominance) 어휘로 측정한 결과 이 QSA 오답은 손으로 쓴 오답(HIA)보다 정답과 문체 차이가 훨씬 작았다(Cohen\'s d ≤ .1).'},
 {h:'두 종류의 오답을 섞어 적대적 필터링',
  lead:'손으로 쓴 오답과 질문전환 오답을 섞고 스타일 분류기로 쉬운 문항을 걸러낸다.',
  d:'오답은 두 경로에서 나온다 — 컨텍스트를 보고 그럴듯하지만 틀리게 손으로 쓴 답(HIA)과 위의 QSA. 두 방식은 서로 다른 종류의 편향을 막기 때문에 섞어 쓰면 한쪽 편향에 의존하는 패턴매칭이 어려워진다. 여기에 [HellaSwag](#/p/hellaswag)와 유사하게, 스타일만으로 정답을 맞히는 분류기가 쉽게 푸는 dev/test 문항을 한 번 더 걸러내는 adversarial filtering을 얹었다.'},
 {h:'전이 학습 자원으로서의 검증',
  lead:'SocialIQA로 먼저 파인튜닝한 뒤 COPA·Winograd에 다시 학습시켜 성능이 오르는지 본다.',
  d:'벤치마크 자체의 난이도뿐 아니라, SocialIQA가 담은 사회적 상식이 다른 과제에도 옮겨지는지를 확인했다. BERT-large를 SocialIQA로 먼저 파인튜닝한 뒤 COPA와 Winograd Schema Challenge로 순차 파인튜닝하면 두 과제 모두 기존 최고 기록을 넘었다. 이는 사회적 상식이 특정 벤치마크의 트릭이 아니라 다른 추론 과제에도 실제로 유용한 지식이라는 증거로 제시된다.'}
],

diagram:{type:'flow', cap:'하나의 ATOMIC 사건에서 컨텍스트·질문·정답·오답까지 만드는 3단계 크라우드소싱 파이프라인.',
 nodes:[
  {t:'ATOMIC 사건', s:'PersonX spills ___'},
  {t:'문장으로 변환', s:'이름·문법 채움'},
  {t:'컨텍스트+질문+정답', s:'추론차원별 템플릿'},
  {t:'질문전환 오답', s:'QSA', acc:true},
  {t:'적대적 필터링', s:'스타일 분류기'}
 ]},

math:[],

numbers:[
 {k:'문항 수', v:'37,588', d:'train 33,410 · dev 1,954 · test 2,224, 모두 3지선다'},
 {k:'BERT-large 정확도', v:'64.5% (test)', d:'컨텍스트+질문 모두 제거하면 45.5%까지 떨어져 둘 다 필요함을 확인'},
 {k:'사람 정확도', v:'84.4% (test) · 86.9% (dev)', d:'무작위 900문항 표본, 워커 3명 다수결'},
 {k:'모델-사람 격차', v:'>20%p', d:'BERT-large 최고 성능(64.5%) 대비'},
 {k:'무작위 기준선', v:'33.3%', d:'3지선다이므로 우연 정답률'},
 {k:'COPA 전이 성능', v:'80.8%', d:'SocialIQA로 먼저 파인튜닝 후 COPA 재학습, 기존 최고 71.2% 대비 상승'}
],

impact:'SocialIQA는 상식 추론 벤치마크 지형에 **사회적 상황**이라는 새 축을 열었다. 이후 사회적 편향·안전성 연구들이 "모델이 타인의 의도·감정을 얼마나 이해하는가"를 측정할 때 이 데이터셋을 기준으로 삼았다. Question-Switching Answers라는 오답 생성 기법은 스타일 편향을 줄이는 일반적인 레시피로 이후 다른 상식 벤치마크 제작에도 참조됐다. 또한 "지식그래프를 자연어 QA로 변환해 벤치마크를 만든다"는 절차 자체가 ATOMIC 계열 후속 연구(ATOMIC 2020 등)의 표준 레시피가 됐다.',

legacy:[
 '**사회적 상식 축의 확립** — [HellaSwag](#/p/hellaswag)류의 사건-서술 추론과 구분되는 "타인의 의도·감정 추론" 벤치마크 계열이 SocialIQA를 기점으로 자리잡음',
 '**오답 생성 기법의 확산** — Question-Switching 방식의 "다른 질문의 정답을 오답으로 재활용" 아이디어가 이후 상식 QA 데이터셋 제작에서 참조되는 패턴이 됨',
 '**대형 언어모델 평가 항목화** — GPT 계열 이후 사회적 추론 능력을 별도로 보고하는 관행이 정착하는 데 기여',
 '**ATOMIC 계열의 확장** — 지식그래프를 QA로 바꾸는 파이프라인이 후속 ATOMIC 확장판 등 지식그래프-벤치마크 쌍의 모델이 됨'
],

pitfalls:[
 '**"사회적 상식"이 곧 "감정 인식"은 아니다.** 질문은 감정뿐 아니라 동기·다음 행동·필요조건 등 9종 ATOMIC 추론 차원 전체를 다루므로, 감성분석용 데이터로 오해하면 안 된다.',
 '**QSA 오답은 논리적으로만 틀렸지 문체로는 정답과 거의 구분되지 않는다.** 그래서 표면적 패턴(길이, 극성 단어)에 기대는 구식 베이스라인은 이 데이터셋에서 특히 약하게 나온다 — 이는 설계 의도이지 데이터 결함이 아니다.',
 '**ATOMIC에서 파생됐다는 한계가 그대로 이어진다.** 사건 유형과 인물 표현이 ATOMIC의 편향(주로 영어권 일상 시나리오)을 물려받으므로, 문화적으로 다른 사회적 규범에는 일반화가 제한적이다.'
],

figures:[
 {f:'fig1-examples.png',
  cap:'세 가지 추론 유형의 실제 문항. 위부터 동기 추론(왜 좁은 엘리베이터에서 몸을 붙였는가), 다음 행동 추론(음식을 쏟았으니 다음엔 무엇을 하고 싶어할까), 감정 추론(연극에서 악역을 맡은 친구를 보고 다른 사람들은 어떻게 느낄까) — 세 축 모두 정답에는 사건 자체가 아니라 그 이후의 사회적 맥락에 대한 상식이 필요하다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-qsa.png',
  cap:'같은 컨텍스트에 대해 "다음에 무엇을 할까"(왼쪽, 실제 질문)의 정답이 아니라 "이전에 무엇이 필요했을까"(오른쪽, 다른 추론 차원)의 정답을 가져와 왼쪽 질문의 오답으로 쓴다. 화살표가 그 재활용 방향이다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'We introduce SocialIQA, the first large-scale benchmark for commonsense reasoning about social situations.',
  src:'Abstract, p.1'},
 {t:'By including answers to a different question about the same context, we ensure that these adversarial responses have the stylistic qualities of correct answers and strongly relate to the context topic, while still being incorrect.',
  src:'Section 3.3, p.3'}
],

links:[
 {t:'arXiv 1904.09728 — SocialIQA', u:'https://arxiv.org/abs/1904.09728'},
 {t:'SocialIQA 데이터셋 페이지 (AllenAI)', u:'https://leaderboard.allenai.org/socialiqa/submissions/get-started'}
]
});
