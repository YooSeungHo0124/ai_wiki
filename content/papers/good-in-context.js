WIKI.paper({
slug:'good-in-context',
venue:'arXiv 2021 (later EMNLP 2022 Findings)',
authors:'Liu, Shen, Zhang, Dolan, Carin, Chen (Duke Univ. · Microsoft)',
arxiv:'2101.06804',

tldr:'[GPT-3](#/p/gpt3)의 few-shot 성능이 **어떤 문맥 예시를 고르느냐**에 따라 크게 흔들린다는 것을 보이고, 임베딩 공간에서 테스트 입력에 가까운 예시를 검색해 쓰는 KATE를 제안한 논문. 무작위 선택 대비 큰 폭의 성능 개선을 냈고, "예시 검색"이라는 이후 프롬프트 엔지니어링·RAG 흐름의 출발점이 되었다.',

context:'GPT-3의 in-context learning은 파라미터를 전혀 바꾸지 않고 프롬프트에 예시 몇 개를 붙이는 것만으로 새 태스크를 푼다. 원 논문 [GPT-3](#/p/gpt3)는 이 예시들을 학습셋에서 **무작위로** 뽑아 썼다. 그런데 저자들이 SST-2 감정분석에서 같은 5개짜리 무작위 시행을 5번 반복했더니 정확도가 86.9%에서 95.8%까지 흔들렸다. 문제 자체나 모델이 바뀐 게 아니라 **어떤 예시가 걸렸는지**만 바뀐 결과다. 예시 선택을 브루트포스로 탐색하는 것은 조합 폭발 때문에 비현실적이라, 이 논문은 더 체계적인 선택 기준을 찾는다.',

ideas:[
 {h:'가까운 예시 vs 먼 예시: NQ에서 EM 46.0 대 31.0',
  lead:'테스트 입력과 임베딩 거리가 가까운 예시가 먼 예시보다 압도적으로 낫다.',
  d:'사전학습 [RoBERTa](#/p/roberta)-large의 CLS 임베딩으로 유클리드 거리를 재서, Natural Questions 100개 테스트 질문마다 학습셋에서 **가장 가까운 10개**를 쓴 경우와 **가장 먼 10개**를 쓴 경우를 비교했다. Exact Match가 46.0 대 31.0으로 15점 차이가 났다. 무작위 선택이 아니라 "가까움"이라는 축 자체가 성능을 좌우한다는 첫 증거다.'},
 {h:'KATE: k-최근접 이웃으로 문맥 예시를 검색한다',
  lead:'테스트 입력을 인코딩해 학습셋에서 가장 가까운 k개를 문맥으로 쓴다.',
  d:'KATE(kNN-Augmented in-conText Example selection)는 문장 인코더로 학습셋 전체와 테스트 입력을 벡터화한 뒤, 코사인 유사도나 유클리드 거리로 가장 가까운 k개를 순서대로 골라 `[x1,y1,...,xk,yk]` 형태의 문맥을 만들어 GPT-3에 넣는다. 별도 학습이 필요 없는 **비모수적** 방법이라 GPT-3 자체를 건드리지 않는다.'},
 {h:'검색은 GPT-3의 대체가 아니라 보완이다',
  lead:'검색된 예시만으로 답을 베끼는 kNN 베이스라인은 무작위 선택 수준으로 떨어진다.',
  d:'검색 단계가 그냥 정답을 복사해오는 것 아니냐는 의심을 검증하기 위해, 검색된 이웃의 정답으로 다수결 투표만 하는 kNN 베이스라인을 만들었다. IMDB에서 kNNroberta는 50.20%로 **무작위 추측 수준**이었던 반면 KATEroberta는 91.99%였다. 검색이 잘한 것이 아니라, 검색된 예시를 GPT-3가 실제로 활용해야 성능이 난다는 뜻이다.'},
 {h:'인코더를 태스크에 맞춰 미세조정하면 더 좋아진다',
  lead:'범용 RoBERTa보다 목표 태스크로 파인튜닝한 인코더가 더 유용한 예시를 찾는다.',
  d:'IMDB 감정분석에서 SST-2로 파인튜닝한 인코더(KATEsst-2)가 범용 RoBERTa(KATEroberta)보다 나은 93.43%를 냈다. 반대로 NLI+STS-B로 파인튜닝한 인코더는 목적이 다른 태스크라 오히려 성능이 떨어졌다(90.20%) — "비슷한 일을 했던 인코더일수록 좋은 이웃을 찾는다"는 것이 이 논문의 부가 발견이다.'},
 {h:'학습셋이 커질수록, 적은 예시로도 KATE가 이긴다',
  lead:'검색 풀이 클수록 좋아지고, 예시 개수가 적어도 무작위보다 낫다.',
  d:'NQ에서 검색용 학습셋 크기를 1천에서 7만까지 늘리며 봤더니 KATE의 EM은 꾸준히 올라간 반면 무작위 베이스라인은 거의 변화가 없었다. 또 예시 수를 5개로 줄여도 KATE가 무작위보다 우세했는데, 이는 실무에서 **적은 예시 = 짧은 프롬프트 = 싼 추론**을 의미해 실용적으로 중요하다.'}
],

diagram:{type:'compare', cap:'같은 GPT-3, 같은 태스크에서 문맥 예시를 어떻게 고르느냐만 다르다.',
 left:{t:'무작위 선택 (원 GPT-3)', items:['학습셋에서 랜덤 k개 추출','시행마다 정확도 86.9~95.8%로 요동','NQ EM 28.6']},
 right:{t:'KATE: kNN 검색 선택', items:['임베딩 거리로 최근접 k개 검색','같은 예시 반복 → 분산 0','NQ EM 40.0~41.6', 'IMDB 91.99~93.43%'], },
},

math:[
 {expr:'p(y|C,x) = Π_t p(y_t | C, x, y<t),  C = {x1,y1,...,xk,yk}',
  tex:'p_{\\text{LM}}(y \\mid C, x) = \\prod_{t=1}^{T} p(y_t \\mid C, x, y_{<t}),\\quad C=\\{x_1,y_1,\\dots,x_k,y_k\\}',
  d:'in-context learning을 조건부 생성으로 정식화한 식. $C$는 예시들을 이어붙인 문자열일 뿐 파라미터 업데이트가 없다 — 학습이 아니라 **입력의 일부**로 예시를 다룬다는 것이 핵심.'},
 {expr:'similarity(x_test, x_i) = -||v_test - v_i||_2  또는  cos(v_test, v_i)',
  tex:'s_i = -\\lVert v_{\\text{test}} - v_i \\rVert_2 \\quad \\text{또는} \\quad \\frac{v_{\\text{test}}\\cdot v_i}{\\lVert v_{\\text{test}}\\rVert_2\\,\\lVert v_i\\rVert_2}',
  d:'KATE의 검색 기준. $v=\\mu_\\theta(x)$는 사전학습(또는 파인튜닝)된 문장 인코더의 출력이고, 가장 큰 $s_i$ 상위 $k$개를 문맥으로 정렬해 붙인다.'}
],

numbers:[
 {k:'SST-2 무작위 시행 5회', v:'86.9~95.8%', d:'같은 태스크·같은 모델에서 예시만 바꿨을 때의 정확도 변동폭'},
 {k:'NQ EM (최근접 vs 최원접 10개)', v:'46.0 vs 31.0', d:'RoBERTa CLS 임베딩·유클리드 거리 기준, 테스트 100개'},
 {k:'IMDB kNNroberta vs KATEroberta', v:'50.20% vs 91.99%', d:'검색만으로 다수결 투표 대 GPT-3에 문맥으로 제공'},
 {k:'ToTTo BLEU (Random vs KATEroberta)', v:'28.4 vs 40.3', d:'표-투-텍스트 생성, dev set 전체'},
 {k:'NQ EM (Random vs KATEnli+sts-b)', v:'28.6 vs 41.6', d:'64-shot, 파인튜닝 인코더 사용 시 최고 성능'},
 {k:'예시 순서 효과', v:'EM 41.6~42.8', d:'가까운 예시를 테스트 프롬프트에 더 가깝게 배치하는지 여부 — 순서 자체의 영향은 선택 전략의 영향보다 훨씬 작음'}
],

impact:'이 논문 이후 "어떤 예시를 프롬프트에 넣을지"는 프롬프트 엔지니어링의 독립된 문제로 자리잡았다. 검색 기반 예시 선택은 이후 dense retrieval을 프롬프트 구성에 쓰는 RAG류 파이프라인의 원형이 됐고, 동시에 "in-context learning이 정말 무엇을 하는가"라는 해석 논쟁([시연의 역할 재고](#/p/rethinking-demos) 등)에도 실증적 출발점을 제공했다. 다만 이 논문 자체는 **왜** 가까운 예시가 더 잘 통하는지 메커니즘을 설명하지 않는다 — "그렇다"는 것만 실험으로 확인했다.',

legacy:[
 '**예시 검색의 표준화** — KATE 이후 임베딩 kNN으로 few-shot 예시를 고르는 것이 GPT류 모델 프롬프팅의 기본 관행이 됨',
 '**in-context learning 해석 논쟁의 재료** — [시연의 역할 재고](#/p/rethinking-demos)가 "예시의 무엇이 실제로 중요한가"를 더 파고드는 후속 질문을 던짐',
 '**RAG식 파이프라인과의 수렴** — 검색-후-생성 구조가 파인튜닝 없는 프롬프트 구성에도 적용된다는 것을 보여줌',
 '**프롬프트 순서·개수 등 세부 요인 연구의 시작** — 이 논문의 ablation(순서·크기·인코더 종류)이 이후 프롬프트 민감도 연구의 표준 실험 설계가 됨'
],

pitfalls:[
 '**"검색이 곧 정답 찾기"가 아니다.** kNNroberta(검색된 예시로 다수결 투표만)가 무작위 수준 성능으로 떨어진다는 실험이 이를 반박한다 — GPT-3의 few-shot 추론 능력과 검색이 **함께** 작동해야 효과가 난다.',
 '**인코더 선택이 태스크에 의존적이다.** NLI로 파인튜닝한 인코더가 QA에서는 도움이 됐지만 IMDB 감정분석에서는 오히려 성능을 깎았다. "파인튜닝하면 무조건 좋다"로 일반화하면 틀린다.',
 '**상관관계이지 기제 규명이 아니다.** 이 논문은 가까운 예시가 더 잘 통한다는 것을 반복 실험으로 확인했을 뿐, 왜 그런지(어떤 정보가 전이되는지)는 다루지 않는다.'
],

figures:[
 {f:'fig1-context.png',
  cap:'문맥 예시 3개(파란 박스, source==target 쌍)와 테스트 프롬프트(4번째 줄)를 하나의 문자열로 이어붙여 GPT-3에 넣는다. 예시 사이는 개행문자로 구분되고, 모델은 다음 개행이 나올 때까지 토큰을 생성한다 — in-context learning이 파라미터 갱신 없이 입력 문자열 조작만으로 이뤄진다는 것을 보여준다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We found that the in-context examples that are closer to the test sample in the embedding space consistently give rise to stronger performance (relative to the farther ones).',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2101.06804 — What Makes Good In-Context Examples for GPT-3?', u:'https://arxiv.org/abs/2101.06804'},
 {t:'GPT-3 논문 (Brown et al., 2020)', u:'https://arxiv.org/abs/2005.14165'}
]
});
