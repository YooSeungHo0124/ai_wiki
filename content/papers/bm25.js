WIKI.paper({
slug:'bm25',
venue:'TREC-3 Proceedings (NIST, 1994)',
authors:'Robertson, Walker, Jones, Hancock-Beaulieu, Gatford (City University London)',

tldr:'문서와 질의의 검색 점수를 **용어 빈도 포화**와 **문서 길이 정규화** 두 가지로 계산하는 함수. 학습도, 임베딩도 없는 순수 통계식인데도 30년이 지난 지금까지 모든 [dense retrieval](#/p/dpr) 논문이 비교 기준선으로 삼는다.',

context:'1992년 TREC-1의 City University Okapi 시스템은 Robertson–Sparck Jones 확률 가중치($w^{(1)}$, 이후 BM1)만 썼다. 이 값은 사실상 idf류 가중치라, 한 문서 안에서 용어가 몇 번 나왔는지(tf)도 문서가 얼마나 긴지도 반영하지 않았다. TREC-2에서 tf와 문서 길이를 넣은 두 변형이 나왔는데 — 문서 길이가 tf 항 안에 있는 BM11과, tf 항 밖에 있는 BM15다. 이 논문(TREC-3, 1994)의 3.2–3.3절이 그 둘을 **하나의 연속 함수**로 합치는 과정을 기록한 문서다.',

ideas:[
 {h:'tf 포화: 등장 횟수는 log가 아니라 분수로 꺾인다',
  lead:'tf가 커질수록 가중치 증가폭이 $tf/(K+tf)$ 형태로 줄어들어 한 단어의 반복이 점수를 무한히 밀어올리지 못한다.',
  d:'tf-idf류는 tf를 (거의) 선형으로 또는 log로 키운다. 여기서는 $tf^c/(K^c+tf^c)$ 형태를 쓰는데, $c=1$ 로 두면 $tf/(K+tf)$ 가 된다. $tf\\to\\infty$ 여도 이 값은 1에 수렴하므로, 한 단어를 도배한 문서가 부당하게 높은 점수를 받는 것을 막는다. 2-Poisson 모델에서 영감을 얻었지만 정식 유도가 아니라 실험으로 형태를 골랐다고 논문이 직접 밝힌다.'},
 {h:'문서 길이 정규화: 파라미터 b가 두 극단을 잇는다',
  lead:'$K=k_1((1-b)+b\\cdot dl/avdl)$ 의 b를 0~1로 움직이면 BM15와 BM11 사이를 연속적으로 이동한다.',
  d:'BM11은 $b=1$(문서 길이를 tf 항 안에서 정규화), BM15는 $b=0$(길이 보정을 tf와 분리해 마지막에 전역으로 더함)에 해당한다. 저자들은 둘 중 어느 쪽이 옳은지 확신하지 못해 아예 파라미터로 만들어 **혼합 비율을 데이터로 정하게** 했다. 실험적으로 $b=0.75$ 근처가 자주 최적이었다.'},
 {h:'RSJ 가중치가 idf 자리를 대신한다',
  lead:'용어 하나의 "귀함"은 $w^{(1)}=\\log\\frac{(r+0.5)/(R-r+0.5)}{(n-r+0.5)/(N-n-R+r+0.5)}$ 로 잰다.',
  d:'관련성 정보($R,r$)가 없으면(대부분의 실전 상황) 이 식은 그대로 역문서빈도(idf)와 같아진다. 즉 BM25의 idf 항은 별개로 발명된 게 아니라, 1970년대 Robertson–Sparck Jones 확률 모델의 특수한 경우다.'},
 {h:'질의 쪽 tf도 같은 방식으로 포화시킨다',
  lead:'질의에 같은 단어가 반복돼도 $qtf/(k_3+qtf)$ 로 가중치 증가를 눌러 한 단어의 과대표현을 막는다.',
  d:'문서 tf에 $k_1$, 질의 tf에 $k_3$ 를 따로 둬서 두 축을 독립적으로 조절할 수 있게 했다. 논문은 이 전체 함수를 $\\text{BM25}(k_1,k_2,k_3,b)$ 로 표기하는데, $k_2$ 는 BM11/BM15에 있던 별도의 전역 길이 보정 항의 계수로, 실전에서는 대개 0으로 꺼둔다.'},
 {h:'BM11과 BM15를 한 이름 BM25로 통합',
  lead:'"BM25"는 새로운 발명이 아니라, 기존 두 최고 성능 함수를 하나의 수식족으로 재정리한 이름이다.',
  d:'논문 원문 그대로: "we in effect combined BM11 and BM15 into a single function BM25, which allowed for a number of variations." 이 논문 자체는 BM25의 파라미터별 성능표를 따로 신지도 않는다 — 그만큼 이 함수가 처음엔 여러 실험 변형 중 하나였을 뿐, 지금 같은 지위를 예상하고 만든 게 아니었다.'}
],

diagram:{type:'compare', cap:'BM1(RSJ 단독)은 idf류 가중치만 쓰고, BM25는 tf 포화와 길이 정규화를 파라미터 b로 보간해 추가한다.',
 left:{t:'BM1 (TREC-1)', items:['tf 등장 여부만 봄','문서 길이 미반영','idf류 가중치 단독 사용']},
 right:{t:'BM25 (BM11+BM15)', items:['tf를 k1으로 포화시킴','문서 길이를 b로 정규화','b로 두 극단을 연속 보간']}
},

math:[
 {expr:'score(D,Q) = Σ idf(qi) · tf(qi,D)·(k1+1) / ( tf(qi,D) + k1·(1-b+b·|D|/avgdl) )',
  tex:'\\text{score}(D,Q)=\\sum_{i} \\text{idf}(q_i)\\cdot\\frac{tf(q_i,D)\\,(k_1+1)}{tf(q_i,D)+k_1\\left(1-b+b\\frac{|D|}{avgdl}\\right)}',
  d:'오늘날 흔히 쓰는 2-파라미터($k_1$, $b$) 요약형이다. 원 논문의 $k_2,k_3$ 항을 꺼두고 tf 포화·길이 정규화 두 축만 남긴 형태로, 이것이 [SPLADE](#/p/splade)가 비교 대상으로 삼는 "표준 BM25"다.'},
 {expr:'w(1) = log( (r+0.5)/(R-r+0.5) / ( (n-r+0.5)/(N-n-R+r+0.5) ) )',
  tex:'w^{(1)}=\\log\\frac{(r+0.5)/(R-r+0.5)}{(n-r+0.5)/(N-n-R+r+0.5)}',
  d:'원 논문의 Robertson–Sparck Jones 가중치. $N$ 은 전체 문서 수, $n$ 은 그 용어를 포함한 문서 수, $R,r$ 은 관련 문서 중 전체·해당 용어 포함 수. 관련성 정보가 없으면($R=r=0$) idf로 축약된다.'},
 {expr:'K = k1 · ( (1-b) + b · dl/avdl )',
  tex:'K=k_1\\left((1-b)+b\\,\\frac{dl}{avdl}\\right)',
  d:'문서 길이 $dl$ 이 평균 $avdl$ 보다 길수록 $K$ 가 커져 같은 tf라도 가중치가 줄어든다. $b=1$ 이면 BM11, $b=0$ 이면 BM15와 같아진다.'}
],

numbers:[
 {k:'공식 런 기본 파라미터', v:'BM25(2.0, 0.0, 1, 0.75)', d:'TREC-3 공식 ad hoc 런 전부 이 값 사용 — $k_1=2.0$, $k_2=0$(꺼둠), $k_3=1$, $b=0.75$'},
 {k:'AveP · 최선 passage 런', v:'0.349', d:'topics 151–200, disks 1&2, passage retrieval 적용 (Table 1)'},
 {k:'AveP · 문서 단위 대조군', v:'0.337', d:'같은 조건에서 passage 세분화 없이 문서 전체로 채점한 공식 결과'},
 {k:'k2(전역 길이 보정)', v:'0으로 실전 사용', d:'논문이 이미 이 항을 자주 꺼서 씀 — 현대 2-파라미터 BM25가 여기서 유래'},
 {k:'발표 연도', v:'1994 (TREC-3)', d:'BERT·dense retrieval보다 24년 앞선 순수 통계 함수'}
],

impact:'BM25는 처음엔 TREC 실험 중 하나였지만, Lucene·Elasticsearch·Solr가 기본 랭킹 함수로 채택하면서 **사실상 검색 엔진의 표준 점수 함수**가 됐다. 임베딩도 학습도 없이 역색인(inverted index)만으로 계산되기 때문에 계산 비용이 극단적으로 낮고, 도메인을 가리지 않고 안정적으로 작동한다. 그 결과 [DPR](#/p/dpr)부터 [ColBERT](#/p/colbert), [SPLADE](#/p/splade)까지 모든 신경망 검색 논문의 첫 번째 표는 예외 없이 "BM25 대비 몇 점 개선"으로 시작한다. [monoBERT](#/p/monobert) 같은 재랭커도 BM25가 추린 top-1000 후보 위에서만 동작해, BM25는 여전히 파이프라인 1단계를 담당한다.',

legacy:[
 '**역색인 인프라 표준** — Lucene/Elasticsearch/Solr 기본 스코어러로 채택되며 웹 검색 인프라의 최하층이 됨',
 '**모든 검색 신경망의 기준선** — [DPR](#/p/dpr), [ColBERT](#/p/colbert), [SPLADE](#/p/splade) 모두 "BM25 대비" 수치로 성능을 보고',
 '**2단계 파이프라인의 1단계** — [monoBERT](#/p/monobert)처럼 비싼 재랭커는 BM25가 추린 후보 집합 위에서만 돌아감',
 '**"기존 역색인을 그대로 쓴다"는 주장의 기준점** — [SPLADE](#/p/splade)가 학습된 sparse 표현으로 BM25와 같은 역색인 자료구조를 재사용할 수 있다는 것을 장점으로 내세우는 이유가 여기서 나옴'
],

pitfalls:[
 '**"BM25"는 하나의 고정된 공식이 아니다.** 논문 자체가 $k_1,k_2,k_3,b$ 네 파라미터의 family를 정의하며, 오늘날 실무에서 쓰는 2-파라미터형은 그중 $k_2=0$ 인 특수 경우를 관용적으로 부르는 이름이다.',
 '**정식 이론 유도가 아니라 실험적 형태 선택이다.** 2-Poisson 모델에서 s자형 곡선을 시사받았을 뿐, 저자들 스스로 "$c$ 를 $K$ 에 관련짓는 공식은 사실상 실험에서 대체로 무시됐다"고 적었다.',
 '**어휘 불일치(vocabulary mismatch)를 풀지 못한다.** 정확히 같은 표기의 용어만 매칭하므로 동의어·paraphrase에는 무력하며, 이것이 [DPR](#/p/dpr) 이후 dense retrieval이 필요했던 근본 이유다.'
],

figures:[
 {f:'fig-weighting-functions.png',
  cap:'왼쪽 위 (1)이 idf류로 축약되는 RSJ 가중치 $w^{(1)}$. 아래 두 블록이 BM15·BM11 — 둘 다 $s_1 s_3 \\cdot tf/(k_1+tf)\\cdot w^{(1)}\\cdot qtf/(k_3+qtf)$ 형태를 공유하고, 문서 길이 보정 $k_2\\cdot nq(avdl-dl)/(avdl+dl)$ 을 tf 항 안에 넣느냐(BM11) 밖에 두느냐(BM15)만 다르다. 이 둘을 하나의 $b$ 로 잇는 것이 바로 다음 절의 BM25.',
  src:'원문 §3.2, p.2'}
],

quotes:[
 {t:'In the course of investigating variant functions for TREC–3, we in effect combined BM11 and BM15 into a single function BM25, which allowed for a number of variations.',
  src:'§3.3, p.3'},
 {t:'Evaluation results for BM25 with various parameter values are not explicitly given in this paper.',
  src:'§3.3, p.3'}
],

links:[
 {t:'원문 PDF — Okapi at TREC-3 (NIST TREC 프로시딩)', u:'https://trec.nist.gov/pubs/trec3/papers/city.ps.gz'},
 {t:'Overview of TREC-3 (Donna Harman)', u:'https://trec.nist.gov/pubs/trec3/papers/overview.pdf'},
 {t:'The Probabilistic Relevance Framework: BM25 and Beyond (2009 리뷰)', u:'https://www.staff.city.ac.uk/~sb317/papers/foundations_bm25_review.pdf'}
]
});
