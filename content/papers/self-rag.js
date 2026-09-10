WIKI.paper({
slug:'self-rag',
venue:'ICLR 2024',
authors:'Asai, Wu, Wang, Sil, Hajishirzi (U. Washington · Allen Institute for AI · IBM)',
arxiv:'2310.11511',

tldr:'검색할지 말지, 검색된 문서가 쓸모 있는지, 생성한 문장이 그 문서에 근거하는지를 **모델 스스로 특수 토큰(reflection token)으로 판단**하게 학습한 RAG. 항상 고정된 개수의 문서를 검색해 넣는 기존 [RAG](#/p/rag)와 달리, 불필요한 검색이 오히려 답을 해치는 문제를 정면으로 다룬다.',

context:'[RAG](#/p/rag) 이후 표준이 된 방식은 질의마다 top-k 문서를 무조건 검색해 프롬프트에 끼워넣는 것이다. 그런데 검색이 늘 도움이 되는 것은 아니다 — 이미 아는 사실이거나 창작 요청("여름휴가 에세이를 써줘")에는 무관한 문서가 끼어들어 답을 오히려 산만하게 만들 수 있고, 검색된 문서가 실제로 관련이 있는지, 생성된 문장이 그 문서 내용과 실제로 부합하는지 모델이 확인할 방법도 없었다. 결과물이 인용한 근거와 실제로 일치하는지 검증하기도 어려웠다. 저자들은 검색·생성·검증을 모두 하나의 LM이 스스로 판단하도록 학습시키면 어떨까를 묻는다.',

ideas:[
 {h:'네 종류의 reflection token으로 스스로를 채점한다',
  lead:'Retrieve·IsRel·IsSup·IsUse 네 토큰이 검색 필요성부터 최종 유용성까지 판단한다.',
  d:'`Retrieve`는 지금 검색이 필요한지(yes/no/continue), `IsRel`은 검색된 문서가 질의에 쓸모 있는지(relevant/irrelevant), `IsSup`은 생성한 문장이 그 문서에 의해 뒷받침되는지(완전/부분/없음), `IsUse`는 전체 응답의 유용성(1~5점)을 나타낸다. 이 네 토큰이 일반 어휘와 똑같이 다음 토큰 예측으로 생성된다.'},
 {h:'GPT-4로 라벨을 만들고 critic 모델에 증류한 뒤 학습 데이터에 삽입',
  lead:'GPT-4가 매긴 reflection token을 critic 모델에 증류해, 학습 코퍼스에 오프라인으로 박아 넣는다.',
  d:'[GPT-4](#/p/gpt4)에게 각 reflection token 범주별 프롬프트를 줘서 라벨을 수집하고, 이를 흉내 내도록 별도의 critic 모델 $C$ 를 학습시킨다. $C$ 는 학습 데이터의 각 구간에 reflection token을 미리 삽입하는 용도로만 쓰이고, **추론 시에는 critic 없이 생성기 $M$ 혼자** reflection token까지 함께 생성하도록 학습된다. 이 덕분에 서빙 단계에서 별도 critic 모델을 호출할 필요가 없다.'},
 {h:'검색은 매번이 아니라 온디맨드로',
  lead:'매 세그먼트마다 Retrieve 토큰을 먼저 예측해, 필요할 때만 검색기를 호출한다.',
  d:'문장(세그먼트) 단위로 생성하기 전에 먼저 `Retrieve` 토큰을 예측한다. "no"면 검색 없이 바로 다음 문장을 생성하고, "yes"면 검색기를 호출해 여러 문서를 병렬로 가져온 뒤 각 문서에 대해 `IsRel`·`IsSup`을 매겨 최선의 결과를 고른다. 창작 요청처럼 사실 확인이 필요 없는 입력에서는 검색을 아예 건너뛴다.'},
 {h:'추론 시 세그먼트 단위 빔서치로 reflection token 점수를 반영',
  lead:'reflection token들의 확률을 가중합해 세그먼트 점수로 쓰는 커스텀 디코딩을 쓴다.',
  d:'여러 문서에서 병렬로 생성된 각 세그먼트 후보를 `IsRel`·`IsSup`·`IsUse` 토큰의 생성 확률로 점수를 매겨 비교하고, 가장 높은 것을 선택한다. 가중치를 조절하면 인용 정밀도와 답변 완결성 사이의 트레이드오프를 추론 시점에 조정할 수 있다 — 재학습 없이 사용자 요구에 맞춰 모델 행동을 바꾸는 것이 가능하다.'}
],

diagram:{type:'loop', cap:'세그먼트마다 검색 여부를 먼저 판단하고, 검색했다면 관련성·근거성·유용성을 스스로 매겨 최선을 고른다.', center:'세그먼트 단위 반복',
 nodes:[
  {t:'Retrieve? 판단', s:'yes/no/continue', acc:true},
  {t:'검색기 호출', s:'문서 여러 개 병렬'},
  {t:'IsRel 평가', s:'relevant/irrelevant'},
  {t:'세그먼트 생성', s:'문서별 병렬'},
  {t:'IsSup·IsUse 평가', s:'근거성·유용성 채점 → 최선 선택'}
 ]},

math:[
 {expr:'score(y_t) = p(y_t) + Σ_G w_G · s_G(y_t),  s_G = p(most desirable token in G)',
  tex:'f(y_t, d, \\text{Critique})=p(y_t \\mid x, d, y_{<t}) + \\sum_{G \\in \\{\\text{IsRel},\\,\\text{IsSup},\\,\\text{IsUse}\\}} w^{G}\\, s^{G}_t',
  d:'세그먼트 $y_t$ 의 최종 점수는 일반적인 언어모델 로그확률에, 각 critique 토큰 그룹에서 "가장 바람직한 토큰"이 나올 확률 $s^G_t$ 를 가중치 $w^G$ 로 더한 값이다. 이 가중치를 조절하는 것이 추론 시 커스터마이징의 핵심이다.'}
],

numbers:[
 {k:'PopQA 정확도 (7B / 13B)', v:'54.9 / 55.8', d:'검색 포함 Llama2·Alpaca(7B·13B) 및 ChatGPT 대비 최고'},
 {k:'PubHealth 정확도 (7B / 13B)', v:'72.4 / 74.5', d:'검색 포함 베이스라인들이 검색 없는 버전보다 별 이득 못 본 태스크에서 큰 격차로 우위'},
 {k:'ARC-Challenge 정확도 (7B / 13B)', v:'67.3 / 73.1', d:'ChatGPT(75.3)에는 못 미치지만 오픈 모델 중 최고'},
 {k:'Bio 생성 FactScore (7B / 13B)', v:'81.2 / 80.2', d:'프롬프트 엔지니어링 기반 CoVe(65B, 71.2)를 더 작은 모델로 능가'},
 {k:'ASQA 인용 정밀도 (7B / 13B)', v:'66.9 / 70.3', d:'ChatGPT(65.1)보다도 높은 인용 정밀도'},
 {k:'ablation · No Retriever / No Critic', v:'PopQA 45.5 → 43.6 / 42.6', d:'50k 축소 학습셋 기준, 검색이나 critic 신호를 빼면 둘 다 성능 하락'}
],

impact:'Self-RAG는 "검색은 항상 켜져 있어야 한다"는 RAG의 기본 가정을 무너뜨리고, 검색 여부·근거성 검증을 모델 자신의 판단으로 내재화했다. 결과물마다 세그먼트 단위로 "이 문장이 어느 문서에 근거하는지"를 스스로 표시하기 때문에 사실 검증이 쉬워지고, 별도의 reward model이나 RLHF 없이 reflection token 학습만으로 이런 제어 가능성을 얻었다는 점에서 RAG 파이프라인 설계에 "언제 검색할지"라는 새로운 축을 열었다.',

legacy:[
 '**적응적 검색(adaptive retrieval)** 계열 연구 — 매 스텝 검색 여부를 판단하는 후속 RAG 기법들의 대표 참조점',
 '**reflection token / self-critique 토큰**을 활용한 제어 가능한 생성 아이디어가 이후 여러 에이전트·툴 사용 LLM 설계에 인용',
 '세그먼트 단위 근거 표시(citation-level grounding)가 RAG 결과물의 사실 검증·평가 지표 설계 논의에 영향',
 'critic 모델을 오프라인으로만 쓰고 서빙 시엔 제거하는 구조가, 이후 "학습에만 비싼 감독 신호를 쓰고 추론은 가볍게" 하는 여러 후속 방법의 설계 패턴으로 참조됨'
],

pitfalls:[
 '**Self-RAG가 검색을 "안 한다"는 뜻이 아니다.** 여전히 검색기를 쓰지만, 매 세그먼트마다 `Retrieve` 토큰으로 필요성을 판단해 불필요한 검색만 건너뛴다 — 검색 자체를 없앤 것이 아니라 **선택적으로** 켠다는 점을 혼동하기 쉽다.',
 '**reflection token 라벨은 GPT-4가 만든 것이지 사람이 만든 정답이 아니다.** critic 모델 $C$ 는 GPT-4 예측을 흉내 내도록 학습되므로, 최종 IsRel·IsSup 판단의 신뢰도는 GPT-4 판단의 정확도에 상한이 걸려 있다.',
 '**추론 시 critic 모델을 별도로 호출하지 않는다.** 학습 데이터에 reflection token을 삽입하는 데만 critic이 쓰이고, 서빙 단계에서는 생성기 $M$ 하나가 reflection token까지 전부 스스로 생성한다 — "critic이 실시간으로 채점한다"고 오해하기 쉬운 대목이다.'
],

figures:[
 {f:'fig1-selfrag-overview.png',
  cap:'왼쪽 기존 RAG는 검색 여부와 무관하게 K개 문서를 한 번에 검색해 프롬프트에 넣고 끝. 오른쪽 Self-RAG는 Retrieve 토큰으로 검색 여부를 먼저 정하고, 문서별로 Relevant/Irrelevant·Supported/Partially를 매긴 뒤 최선의 세그먼트만 골라 이어붙인다. 맨 아래 여름휴가 에세이 예시는 아예 검색을 건너뛴다(No Retrieval).',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We introduce a new framework called Self-Reflective Retrieval-Augmented Generation (SELF-RAG) that enhances an LM\\u2019s quality and factuality through retrieval and self-reflection.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2310.11511 — Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection', u:'https://arxiv.org/abs/2310.11511'},
 {t:'selfrag.github.io (공식 코드·모델)', u:'https://selfrag.github.io/'}
]
});
