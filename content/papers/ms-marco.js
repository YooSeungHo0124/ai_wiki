WIKI.paper({
slug:'ms-marco',
venue:'NIPS 2016 Workshop (arXiv, 지속 갱신)',
authors:'Bajaj, Campos, Craswell, Deng, Gao et al. (Microsoft AI & Research)',
arxiv:'1611.09268',

tldr:'빙(Bing) 검색엔진의 **실제 사용자 질의**와 그에 대한 실제 웹 문서·사람이 작성한 답변으로 만든 대규모 기계독해·검색 데이터셋. 질문이 인위적으로 만들어진 게 아니라 실제 정보 요구에서 나왔다는 점에서 이후 거의 모든 dense retrieval 연구의 표준 평가 기준이 됐다.',

context:'2016년 무렵 기계독해(MRC) 데이터셋은 [SQuAD](#/p/squad)처럼 위키피디아 문단에서 크라우드워커가 질문을 **만들어내는** 방식이 표준이었다. 문제는 두 가지다. 첫째, 이런 질문은 실제 사람들이 검색창에 입력하는 질문과 분포가 다르다 — 사람들은 완결된 문장이 아니라 "will I qualify for osap if i\'m new in canada" 같은 비문법적이고 애매한 문장을 던진다. 둘째, 답이 지문 안의 연속된 스팬(span)으로 한정되는 경우가 많아, 여러 문서에 흩어진 정보를 종합하거나 "답 없음"을 판단하는 능력은 평가하지 못했다. MS MARCO는 이 두 한계를 **빙의 실제 검색 로그**와 **사람이 직접 쓰는 자연어 답변**으로 정면 돌파한다.',

ideas:[
 {h:'질문 자체가 진짜 검색 질의다',
  lead:'크라우드워커가 지어낸 문장이 아니라 Bing 검색 로그에서 그대로 뽑은 익명화 질의를 쓴다.',
  d:'질의 의도 분류기로 네비게이션성 질의를 걸러내고 질문형 질의만 남긴다. 그 결과 "in what type of circulation does the oxygenated blood flow..."처럼 정형화된 질문도 있지만, "barack obama age"처럼 질문형이 아닌 키워드성 표현도 섞여 실제 정보 탐색 행동을 더 그대로 반영한다.'},
 {h:'답은 지문 스팬이 아니라 사람이 요약해 쓴 자연어 문장',
  lead:'편집자가 관련 지문을 고르고 그 내용을 자기 문장으로 종합해 답을 작성한다.',
  d:'질문마다 Bing이 검색한 문서에서 자동 추출한 지문 약 10개를 후보로 제시하고, 사람 편집자가 그중 답에 필요한 지문을 `is_selected`로 표시한 뒤 완전한 문장으로 답을 쓴다. 정보가 없으면 "답 없음"으로 처리해, 답을 억지로 만들어내지 않는다. 이후 별도 편집자가 문법·독립적 이해 가능성을 검수해 재작성한 well-formed answer도 함께 제공한다.'},
 {h:'질문 하나에 답이 여럿이거나 아예 없을 수 있다',
  lead:'단일 정답을 강제하지 않고, 복수 정답·무응답을 데이터 구조 자체로 허용한다.',
  d:'같은 질문이라도 여러 지문에서 서로 다른 각도의 정보를 얻을 수 있으므로 여러 개의 정답 답변이 달릴 수 있다. 이는 채점 방식에도 영향을 줘서, 정답 여러 개와의 유사도를 함께 고려하는 phrasing-aware 평가(pa-BLEU)가 함께 제안됐다.'},
 {h:'세 가지 과제: 답변 생성, 정형 답변 생성, 지문 재순위화',
  lead:'MRC(초급·중급)와 별개로 **passage re-ranking** 과제를 독립적으로 정의했다.',
  d:'novice 과제는 답변 가능 여부 판단 + 답 생성, intermediate 과제는 문맥 없이도 이해되는 정형 문장 생성을 요구한다. 세 번째 **passage re-ranking** 과제는 질문과 BM25로 미리 검색된 지문 1000개를 주고, 그중 정답을 포함할 가능성이 높은 순서로 재정렬하게 한다. 이 과제가 이후 신경망 기반 검색(neural IR) 연구의 표준 벤치마크가 됐다.'},
 {h:'v1.1 → v2.1로 개정하며 난이도를 계속 올렸다',
  lead:'v1.1의 사람 기준선이 약 15개월 만에 모델에 추월당하자, v2.1은 무응답 판단을 강화해 다시 어렵게 만들었다.',
  d:'저자들은 이것을 정적 벤치마크가 아니라 **지속적으로 갱신되는 벤치마크**로 운영했다고 밝힌다. v2.1에서는 상위 편집자 5명으로 새 사람 기준선을 다시 측정하고, 답변 불가 질문을 포함해 평가하도록 과제를 조정했다.'}
],

diagram:{type:'flow', cap:'MS MARCO 데이터 구축 파이프라인. Bing 검색 로그에서 편집자의 자연어 답변까지.',
 nodes:[
  {t:'Bing 질의 로그', s:'질문형만 필터링'},
  {t:'Bing 문서 검색', s:'질문당 관련 문서'},
  {t:'지문 자동 추출', s:'질문당 지문 ~10개'},
  {t:'편집자 답변 작성', s:'is_selected + 자연어 답', acc:true},
  {t:'정형 답변 재작성', s:'문맥 없이도 이해 가능'}
 ]},

numbers:[
 {k:'질문 수', v:'1,010,916개', d:'Bing 검색 로그에서 익명화해 추출'},
 {k:'지문 · 문서 수', v:'8,841,823 지문 · 3,563,535 문서', d:'질문당 평균 지문 약 10개, Bing이 검색·추출'},
 {k:'편집자 작성 답변', v:'182,669개 (정형 답변)', d:'well-formed answer로 재작성된 것만 집계'},
 {k:'SQuAD 대비 규모', v:'10배 이상', d:'저자들이 직접 비교 — 대형 신경망 학습에 필요한 규모를 겨냥'},
 {k:'재순위화 과제 입력', v:'BM25 top-1000 지문', d:'질문당 이 지문들을 재정렬하는 것이 passage re-ranking 과제'},
 {k:'v1.1 사람 기준선 추월 기간', v:'약 15개월', d:'공개 후 모델 성능이 사람 기준선을 넘어서는 데 걸린 시간, 이후 v2.1로 난이도 재조정'}
],

impact:'MS MARCO는 애초 기계독해 벤치마크로 시작했지만, 실제로 가장 오래 남은 유산은 **passage re-ranking 과제**다. BM25로 1차 검색한 지문 1000개를 신경망으로 재순위화하는 이 설정이 이후 dense retrieval·late interaction·희소 검색 연구 전부의 공통 평가대가 됐다. TREC Deep Learning Track도 이 질문·지문 컬렉션을 그대로 가져다 썼다.',

legacy:[
 '**dense retrieval 계열의 공통 시험대** — [DPR](#/p/dpr)·[ColBERT](#/p/colbert)·[monoBERT](#/p/monobert)·[SPLADE](#/p/splade)가 전부 MS MARCO passage ranking(MRR@10)으로 서로를 비교한다',
 '**TREC Deep Learning Track(2019~)의 기반 컬렉션** — 같은 질문·지문 집합을 더 정밀한 사람 판정으로 재평가하는 후속 벤치마크의 토대가 됨',
 '**"실제 검색 로그 기반 질의"라는 설계가 이후 QA·검색 데이터셋의 표준 관행이 됨** — 크라우드워커가 지어낸 질문 대신 실사용 로그를 쓰는 흐름',
 '**정형 답변(well-formed answer) 개념이 이후 생성형 QA 평가에서 "문맥 독립적 이해 가능성" 기준으로 재사용**'
],

pitfalls:[
 '**"MS MARCO"라는 이름 아래 서로 다른 과제가 여러 개 있다.** QA(novice/intermediate) 과제와 passage ranking 과제는 평가지표(ROUGE-L/BLEU vs MRR)와 데이터 형식이 다르다 — 논문을 인용할 때 어느 과제·버전(v1.1/v2.1)인지 명시해야 한다.',
 '**`is_selected` 라벨은 완전하지 않다.** 저자들도 명시하듯 답을 포함하는 다른 지문이 있어도 편집자가 놓쳐 표시하지 않았을 수 있다 — 이 불완전한 양성 라벨 문제가 이후 dense retrieval 학습에서 hard negative 샘플링을 까다롭게 만드는 원인 중 하나다.',
 '**v1.1과 v2.1의 사람 기준선은 서로 다른 절차로 측정됐다.** 버전 간 점수를 직접 비교하면 안 되고, 저자들도 v2.1에서 상위 편집자 5명으로 기준선을 다시 만들었다고 밝힌다.'
],

figures:[
 {f:'fig1-annotation-ui.png',
  cap:'왼쪽 Candidate passages: Bing이 검색해 온 지문 후보 목록. 오른쪽 Selected passages: 편집자가 답에 필요하다고 고른 지문(형광 표시)과 출처 URL. 하단 텍스트박스에 그 지문들을 종합한 자연어 답("No. You won\'t qualify.")을 직접 입력한다 — 스팬을 고르는 게 아니라 문장을 새로 쓴다는 점이 SQuAD류와 다르다.',
  src:'원문 Figure 1, p.4'}
],

quotes:[
 {t:'The dataset comprises of 1,010,916 anonymized questions—sampled from Bing’s search query logs—each with a human generated answer.',
  src:'Abstract, p.1'},
 {t:'In MS MARCO, in contrast, the questions correspond to actual search queries that users submitted to Bing, and therefore may be more representative of a “natural” distribution of information need.',
  src:'Introduction, p.2'}
],

links:[
 {t:'arXiv 1611.09268 — MS MARCO', u:'https://arxiv.org/abs/1611.09268'},
 {t:'MS MARCO 공식 리더보드', u:'https://microsoft.github.io/msmarco/'}
]
});
