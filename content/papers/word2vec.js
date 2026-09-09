WIKI.paper({
slug:'word2vec',
venue:'ICLR 2013 Workshop (+ NIPS 2013 후속)',
authors:'Mikolov, Chen, Corrado, Dean (Google)',
arxiv:'1301.3781',

tldr:'은닉층을 통째로 없애고 학습 목표를 "주변 단어 맞히기"로 단순화해, 단어 벡터를 **수십억 단어 규모에서 하루 안에** 뽑을 수 있게 만든 논문. 부산물로 `king − man + woman ≈ queen` 같은 벡터 산술이 성립한다는 것이 드러나면서, 단어 임베딩이 NLP의 기본 부품이 되었다.',

context:'[NNLM](#/p/nnlm)이 분산 표현의 유효성을 증명한 뒤 10년 동안, 신경망 언어모델은 **너무 비쌌다**. 비선형 은닉층과 어휘 크기 $|V|$ 짜리 softmax 때문에 백만 단어급 코퍼스에도 CPU 수십 대와 몇 주가 필요했고, 그 결과 나오는 벡터는 50~100차원에 학습 데이터도 수천만 단어 수준이었다. 저자들의 관찰은 이것이다 — **좋은 단어 벡터를 얻는 데 좋은 언어모델이 필요하지는 않다.** 언어모델은 문법적으로 정확한 확률 분포를 내야 하지만, 벡터는 그저 "어떤 단어들이 같은 자리에 오는가"만 반영하면 된다. 그렇다면 모델을 극단적으로 얕게 만들고 대신 데이터를 100배 넣는 쪽이 이긴다. 이 논문은 그 트레이드를 실제로 실행한 결과다.',

ideas:[
 {h:'은닉층을 없앤다 (log-linear 모델)',
  lead:'비선형 은닉층을 없애 같은 시간에 훨씬 많은 데이터를 처리한다.',
  d:'NNLM의 비용은 대부분 $(n-1)m \\times h$ 크기의 은닉층과 출력 softmax였다. word2vec은 비선형 은닉층을 **완전히 제거**하고 입력 벡터의 평균/투영을 바로 출력층에 연결한다. 표현력은 떨어지지만, 같은 시간에 볼 수 있는 데이터가 자릿수 단위로 늘어난다. 실제로 6B 토큰 학습 시 NNLM이 180코어 × 14일인 데 비해 Skip-gram은 125코어 × 2.5일이면서 정확도는 50.8% → 65.6%로 더 높다.'},
 {h:'CBOW: 주변으로 가운데를 맞힌다',
  lead:'주변 단어 벡터를 평균 내 중심 단어를 예측해 빠르게 학습한다.',
  d:'윈도우 안 주변 단어들의 벡터를 **평균 내서** 중심 단어를 예측한다. 여러 문맥 단어가 하나의 예측으로 합쳐지므로 예제당 업데이트가 적고 학습이 빠르다. 빈출 단어에 강하고 문법적(syntactic) 유추에 상대적으로 유리하다 — 783M 토큰 300차원에서 syntactic 53.1% / semantic 15.5%.'},
 {h:'Skip-gram: 가운데로 주변을 맞힌다',
  lead:'중심 단어로 주변 각각을 예측해 희귀어와 의미 관계에 강해진다.',
  d:'반대로 중심 단어 하나에서 윈도우 안의 각 주변 단어를 개별적으로 예측한다. 단어 하나가 여러 번의 gradient를 받으므로 **희귀 단어와 의미적(semantic) 관계**에 훨씬 강하다. 같은 조건에서 semantic 정확도가 15.5% → 50.0%로 뛴다. 윈도우 크기 $c$ 를 1~$C$ 사이에서 랜덤으로 뽑아 가까운 단어에 자연스럽게 더 큰 가중치를 준다.'},
 {h:'출력 softmax를 날려버리는 두 가지 방법',
  lead:'이진 트리나 노이즈 대조로 어휘 크기에 비례하는 계산을 없앤다.',
  d:'$|V|$-way softmax는 여전히 병목이다. **계층적 softmax**는 어휘를 Huffman 이진 트리로 만들어 $|V|$ 번의 계산을 $\\log_2 |V|$ 번으로 줄인다(빈출 단어일수록 짧은 코드). 후속 논문의 **negative sampling**은 아예 정규화를 포기하고, "진짜 (중심,문맥) 쌍 1개 + 노이즈 분포에서 뽑은 가짜 쌍 $k$ 개"를 구분하는 로지스틱 회귀로 바꾼다. 노이즈 분포는 유니그램 빈도의 $3/4$ 제곱이 가장 잘 동작했다.'},
 {h:'빈출 단어 서브샘플링',
  lead:'정보량 적은 빈출 단어를 확률적으로 버려 속도와 정확도를 함께 올린다.',
  d:'`the`·`a` 같은 단어는 정보량이 거의 없는데 예제의 절대다수를 차지한다. 빈도 $f(w)$ 에 따라 확률적으로 버리면(임계 $t \\approx 10^{-5}$) 학습이 2~10배 빨라지고 정확도도 **같이** 올라간다. Skip-gram NEG-5 기준 38분 → 14분, 정확도 59% → 60%. 부수 효과로 유효 윈도우가 넓어져 의미적 관계를 더 멀리서 잡는다.'},
 {h:'벡터 산술이 성립한다',
  lead:'목적함수에 없던 유추 관계가 벡터 뺄셈·덧셈으로 관찰됐다.',
  d:'평가를 위해 만든 19,544문항의 Semantic-Syntactic 테스트셋(의미 8,869 + 문법 10,675)에서, `vec("Berlin") − vec("Germany") + vec("France")` 의 최근접 벡터가 `Paris` 로 나온다. 논문은 이것을 설계한 게 아니라 **관찰했다**. 목적함수 어디에도 유추를 요구하는 항은 없다.'}
],

diagram:{type:'split', cap:'예시 윈도우 "… the cat sat on the mat …"(중심=sat, c=5). 같은 윈도우, 반대 방향의 두 목적함수가 벡터의 성격을 바꾼다.',
 from:{t:'중심 단어', s:'sat · 윈도우 c=5'},
 branches:[
  {t:'CBOW', s:'주변 평균 → 중심 예측'},
  {t:'Skip-gram', s:'중심 → 주변 각각 예측'}
 ],
 join:'출력층은 계층적 softmax(Huffman) 또는 negative sampling으로 대체 — 여기가 속도의 전부'},

math:[
 {expr:'J_skipgram = (1/T) Σ_t Σ_{−c ≤ j ≤ c, j≠0}  log p(w_{t+j} | w_t)',
  tex:'J_{\\text{skip-gram}} = \\frac{1}{T}\\sum_{t=1}^{T} \\sum_{-c \\le j \\le c,\\, j\\ne 0} \\log p(w_{t+j} \\mid w_t)',
  d:'중심 단어 $w_t$ 로 윈도우 안 모든 주변 단어의 로그확률을 최대화한다. $c$ 는 매 예제마다 1~$C$ 에서 균등 추출해, 가까운 단어가 더 자주 학습되도록 한다.'},
 {expr:'log σ(v\'_{wO}ᵀ v_{wI}) + Σ_{i=1..k} E_{w_i ~ P_n(w)} [ log σ(−v\'_{w_i}ᵀ v_{wI}) ]',
  tex:'\\log \\sigma(v_{w_O}^{\\prime \\top} v_{w_I}) + \\sum_{i=1}^{k} \\mathbb{E}_{w_i \\sim P_n(w)}\\big[\\log \\sigma(-v_{w_i}^{\\prime \\top} v_{w_I})\\big]',
  d:'negative sampling 목적함수. 정규화 상수를 계산하지 않고 진짜 쌍 1개와 노이즈 $k$ 개를 이진 분류로 가른다. $k$ 는 작은 데이터에서 5~20, 큰 데이터에서 2~5. $P_n(w) \\propto U(w)^{3/4}$.'},
 {expr:'P(discard w_i) = 1 − √( t / f(w_i) )',
  tex:'P(\\text{discard } w_i) = 1 - \\sqrt{\\dfrac{t}{f(w_i)}}',
  d:'빈출 단어 서브샘플링. $t$ 는 보통 $10^{-5}$. 빈도가 $t$ 를 넘는 단어만 공격적으로 버리고 빈도 순위는 보존한다.'}
],

numbers:[
 {k:'유추 테스트셋', v:'19,544 문항', d:'의미 8,869 + 문법 10,675. 정확히 그 단어여야 정답'},
 {k:'Skip-gram 300d / 783M 토큰', v:'53.3%', d:'같은 조건 CBOW는 36.1%. 의미 유추에서 50.0% vs 15.5%로 크게 갈린다'},
 {k:'분산 학습 (6B 토큰)', v:'Skip-gram 65.6% · CBOW 63.7%', d:'같은 데이터의 NNLM은 50.8%'},
 {k:'학습 비용 (6B 토큰)', v:'2.5일 × 125 코어', d:'NNLM은 14일 × 180 코어 — 약 8배 차이'},
 {k:'negative sampling 효과', v:'NEG-5 59% vs 계층적 softmax 47%', d:'유추 과제 기준. 시간은 38분 vs 41분으로 비슷'},
 {k:'서브샘플링 효과', v:'38분 → 14분', d:'$10^{-5}$ 적용 시 NEG-5 기준. 정확도는 59% → 60%로 오히려 상승'}
],

impact:'단어 벡터가 **연구 대상에서 인프라 부품으로** 바뀌었다. `word2vec` 도구와 사전학습된 Google News 300차원 벡터가 공개되면서, 이후 몇 년간 거의 모든 NLP 시스템(분류·NER·파싱·검색)이 랜덤 초기화 대신 이 벡터로 임베딩 층을 시작했다. 방법론적으로 더 중요한 유산은 **"복잡한 모델 + 적은 데이터"보다 "단순한 모델 + 훨씬 많은 데이터"가 이긴다**는 것을 명시적 비교로 보인 점이다. 이 논리는 그대로 [GPT-2](#/p/gpt2)·[GPT-3](#/p/gpt3)의 스케일링 서사로 이어진다. 동시에 벡터 산술이라는 관찰은 "임베딩 공간에는 선형 구조가 있다"는 연구 흐름을 열었고, 오늘날 [Sparse Autoencoder](#/p/sae) 기반 해석 연구까지 같은 가정 위에 서 있다.',

legacy:[
 '**전역 통계 진영의 응답** — [GloVe](#/p/glove)가 "로컬 윈도우만 훑는 건 코퍼스 통계 낭비"라며 동시등장 행렬 분해로 같은 유추 과제를 다시 공격했다',
 '**서브워드로의 확장** — [fastText](#/p/fasttext)가 단어 벡터를 문자 n-gram 합으로 바꿔 OOV와 형태론 문제를 풀었다 (같은 저자 그룹)',
 '**문맥 의존 벡터** — 단어당 벡터 하나라는 근본 한계가 [ELMo](#/p/elmo) → [BERT](#/p/bert)로 이어지는 문맥 임베딩의 출발 동기가 됐다',
 '**negative sampling의 재사용** — 대조학습 손실의 원형으로서 [SimCLR](#/p/simclr)·[CLIP](#/p/clip)·[DPR](#/p/dpr) 등 표현학습 전반에 같은 골격이 재등장한다'
],

pitfalls:[
 '**논문 두 편이 흔히 하나로 뭉뚱그려진다.** CBOW·Skip-gram·계층적 softmax는 arXiv 1301.3781(ICLR 2013 workshop), **negative sampling·서브샘플링·구(phrase) 벡터는 후속 NIPS 2013 논문**(1310.4546)이다. "word2vec 논문에 negative sampling이 있다"고 인용하면 절반은 틀린다.',
 '**`king − man + woman = queen` 은 마케팅에 가깝다.** 평가 코드는 입력 세 단어를 후보에서 **제외한 뒤** 최근접을 찾는다. 그 제외를 안 하면 상당수 질의에서 답이 입력 단어 자신이 된다. 유추 성공률도 전체 문항의 절반 수준이며, 벡터 공간이 깔끔한 평행사변형이라는 뜻은 아니다.',
 '**단어당 벡터는 하나뿐이다.** `bank`(강둑/은행), `배`(과일/선박/복부)처럼 다의어는 여러 의미가 한 점으로 평균돼 버린다. 이 한계는 서브워드([fastText](#/p/fasttext), [BPE](#/p/bpe))로도 안 풀리고, 문맥 의존 표현([ELMo](#/p/elmo))이 나와야 해소된다.'
],

figures:[
 {f:'fig1-cbow-skipgram.png',
  cap:'두 새 아키텍처를 나란히 놓은 그림. 왼쪽 CBOW는 주변 단어 w(t-2)~w(t+2)가 화살표로 모여(SUM) 가운데 단어 w(t) 하나를 예측하고, 오른쪽 Skip-gram은 반대로 가운데 단어 w(t) 하나에서 화살표가 퍼져나가 주변 단어들을 예측한다 — 입력·출력이 서로 뒤집힌 구조라는 점을 한눈에 보여준다.',
  src:'원문 Figure 1, p.5'}
],

quotes:[
 {t:'We observe large improvements in accuracy at much lower computational cost, i.e. it takes less than a day to learn high quality word vectors from a 1.6 billion words data set.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1301.3781 — Efficient Estimation of Word Representations in Vector Space', u:'https://arxiv.org/abs/1301.3781'},
 {t:'arXiv 1310.4546 — Distributed Representations of Words and Phrases (negative sampling)', u:'https://arxiv.org/abs/1310.4546'},
 {t:'word2vec 원본 구현 (Google Code 아카이브)', u:'https://code.google.com/archive/p/word2vec/'}
]
});
