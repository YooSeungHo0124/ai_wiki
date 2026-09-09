WIKI.paper({
slug:'din',
venue:'KDD 2018',
authors:'Zhou et al. (Alibaba Group)',
arxiv:'1706.06978',

tldr:'CTR 예측에서 사용자의 전체 행동 이력을 **후보 광고와 무관하게 고정된 한 벡터**로 압축하던 관행을 깨고, 지금 보여줄 광고와 관련된 과거 행동에만 가중치를 몰아주는 local activation unit을 제안한 논문. 사용자 관심사는 다양하지만 특정 순간에는 그 일부만 활성화된다는 관찰을 구조로 옮겼다.',

context:'2018년의 산업용 CTR 모델은 [DeepFM](#/p/deepfm)·Wide&Deep처럼 **Embedding&MLP** 패러다임을 공유했다. 희소 피처를 임베딩으로 매핑하고, 사용자가 클릭·조회한 상품 목록(가변 길이)은 sum/average pooling으로 **고정 길이 벡터 하나**로 뭉갠 뒤 MLP에 넣는다. 문제는 이 고정 벡터가 사용자의 모든 관심사를 동시에 표현해야 한다는 점이다. 한 젊은 엄마가 최근에 코트·티셔츠·귀걸이·토트백·가죽 핸드백을 봤다면, 지금 화면에 뜬 새 핸드백 광고와 관련 있는 것은 그중 일부뿐이다. 벡터를 키워 표현력을 늘리면 파라미터가 수억 개로 폭증해 과적합이 심해지고, 산업 규모(수억 사용자, 초당 100만 요청)에서는 그 비용을 감당할 수 없다.',

ideas:[
 {h:'Local activation unit: 후보 광고가 주의의 기준이 된다',
  lead:'사용자 행동마다 후보 광고와의 관련도를 계산해 가중합으로 대체한다.',
  d:'고정된 sum pooling `e_i = pooling(e_i1,...,e_ik)` 대신, 후보 광고 임베딩 `v_A`와 각 행동 임베딩 `e_j`를 함께 feed-forward 네트워크 `a(·)`에 넣어 관련도 가중치 `w_j`를 만들고 가중합한다. 결과 벡터 `v_U(A)`는 **같은 사용자라도 어떤 광고를 보여주느냐에 따라 달라진다.** [Bahdanau attention](#/p/bahdanau)이 decoder 스텝마다 encoder를 다시 훑던 것과 같은 발상을, 사용자 행동 시퀀스와 후보 아이템 사이에 옮겨 심었다.'},
 {h:'관련도 함수에 외적(out product)을 더한다',
  lead:'두 임베딩의 차이·곱까지 넣어 관련도 함수가 더 풍부한 상호작용을 보게 한다.',
  d:'`a(·)`는 단순 concat이 아니라 행동 임베딩과 후보 임베딩, 그리고 둘의 외적(element-wise product)까지 이어붙여 MLP에 넣는다. 이렇게 하면 두 벡터의 차이나 유사도 같은 명시적 상호작용 신호가 관련도 계산에 직접 들어간다. softmax 정규화는 쓰지 않고 가중치 합을 사용자 관심 강도의 대략적 근사로 남겨둔다.'},
 {h:'Dice: 데이터 분포에 맞춰 꺾이는 점을 옮기는 활성함수',
  lead:'입력의 평균·분산으로 정류점을 이동시켜 PReLU를 일반화한다.',
  d:'PReLU는 항상 0에서 꺾이지만, 층마다 입력 분포가 다른 산업 모델에서는 이 고정된 기준점이 최적이 아닐 수 있다. Dice는 미니배치의 평균 `E[s]`·분산 `Var[s]`로 만든 확률 `p(s)`를 스위치로 써서 꺾이는 지점을 입력 분포의 평균 쪽으로 자연스럽게 옮긴다. `E[s]=0, Var[s]=0`이면 PReLU로 퇴화하는 일반화 관계다.'},
 {h:'Mini-batch aware regularization: 등장한 파라미터만 정규화',
  lead:'미니배치에 실제로 나온 희소 피처의 임베딩에만 L2 페널티를 준다.',
  d:'수억 개 파라미터에 매 스텝 L2 정규화를 통째로 계산하면 연산량이 감당 불가능하다. `goods_id`처럼 극단적으로 희소한 피처는 배치마다 극소수만 등장하므로, 등장 빈도로 정규화 강도를 근사해 **등장한 임베딩에 대해서만** 계산한다. 이 근사 덕분에 정규화를 켜도 학습이 실용적인 속도를 유지한다.'}
],

diagram:{type:'compare', cap:'같은 Embedding&MLP 골격에서 사용자 표현을 만드는 방식만 다르다.',
 left:{t:'Base Model', items:['행동 임베딩을 sum pooling','후보와 무관한 고정 벡터','관심사 다양성 표현에 한계']},
 right:{t:'DIN', items:['행동마다 후보와의 관련도 계산','activation unit이 가중치 생성','후보별로 다른 사용자 벡터']}},

math:[
 {expr:'v_U(A) = Σ_j a(e_j, v_A) e_j = Σ_j w_j e_j',
  tex:'v_U(A) = \\sum_{j=1}^{H} a(e_j, v_A)\\,e_j = \\sum_{j=1}^{H} w_j e_j',
  d:'광고 `A`에 대한 사용자 표현은 `H`개 행동 임베딩의 가중합이다. 가중치 `w_j`가 곧 activation unit의 출력이라 `v_U`는 광고가 바뀔 때마다 다시 계산된다.'},
 {expr:'f(s) = p(s)·s + (1 − p(s))·α s,   p(s) = 1 / (1 + exp(−(s − E[s]) / sqrt(Var[s] + ε)))',
  tex:'f(s) = p(s)\\cdot s + (1-p(s))\\cdot \\alpha s,\\qquad p(s) = \\dfrac{1}{1+e^{-\\frac{s-E[s]}{\\sqrt{Var[s]+\\epsilon}}}}',
  d:'Dice 활성함수. `E[s]`·`Var[s]`는 학습 시 미니배치 통계, 추론 시에는 이동평균을 쓴다. `ε=10^{-8}`.'}
],

numbers:[
 {k:'Alibaba 데이터셋', v:'2.14B 샘플 · 6억 상품', d:'2주치 학습 로그, 사용자 6천만 · 카테고리 10만'},
 {k:'AUC · Alibaba(전체 피처)', v:'0.6029 → 0.6083', d:'BaseModel 0.5970 대비 DIN+MBA+Dice가 **RelaImpr 11.65%**'},
 {k:'AUC · Amazon(Electronics)', v:'0.7348 (Dice 적용)', d:'BaseModel 대비 개선, 행동이 풍부한 데이터셋일수록 격차 커짐'},
 {k:'온라인 A/B 테스트', v:'CTR +10.0% · RPM +3.8%', d:'2017년 5~6월, 약 한 달간 실제 트래픽'},
 {k:'서빙 규모', v:'초당 100만+ 사용자', d:'요청당 수백 개 광고를 10ms 이내 예측해야 하는 제약'}
],

impact:'DIN은 CTR 모델에 **attention을 명시적으로 들여온 첫 산업 사례**로 자리잡았다. 이후 Alibaba 계열 후속 연구(DIEN, DSIN 등)가 여기에 시퀀스 구조·시간 정보를 얹어 발전시켰고, "사용자 표현은 후보에 따라 달라져야 한다"는 관점이 추천 랭킹 모델의 기본 전제가 됐다. Dice와 mini-batch aware regularization은 activation unit과 독립적으로도, 희소 피처를 다루는 산업 모델 전반에 재사용 가능한 공학적 해법으로 인용된다.',

legacy:[
 '**시퀀스 인식으로 확장** — DIEN이 GRU로 관심사의 시간적 변화(evolution)를 모델링하며 DIN의 정적 activation unit을 보완',
 '**후보 조건부 표현이라는 원칙의 확산** — 검색·추천 랭킹 전반에서 "사용자 벡터는 쿼리/아이템에 따라 달라진다"는 설계가 표준이 됨',
 '**후보 생성 단계와의 역할 분담 정착** — [YouTube DNN](#/p/youtube-dnn)류의 후보 생성이 거른 뒤보를 DIN류의 attention 랭커가 정교하게 재정렬하는 2단계 구조가 굳어짐',
 '**희소 대규모 임베딩 학습의 공학 관행** — mini-batch aware regularization처럼 "등장한 것만 계산"하는 근사가 이후 대형 임베딩 테이블 학습의 상식이 됨'
],

pitfalls:[
 '**activation unit은 softmax attention이 아니다.** 논문은 가중치 합을 정규화하지 않고 관심 강도의 근사치로 남겨둔다 — 표준 attention처럼 합이 1이 되는 분포를 기대하면 구현이 어긋난다.',
 '**공개 성능 향상 폭은 절대적으로 작아 보인다.** Alibaba 데이터셋 AUC 개선은 0.006~0.011 수준이지만, 수억 트래픽 규모의 광고 시스템에서는 0.001 AUC도 유의미하다고 원문이 명시한다 — 학계 벤치마크의 감각으로 "작은 개선"이라 단정하면 안 된다.',
 '**Dice는 attention 구조와 독립적인 개선이다.** DIN 아키텍처 없이 Dice·MBA만 다른 모델에 붙여도 효과가 있으므로, "DIN = activation unit"으로만 기억하면 논문의 두 공학적 기여를 놓친다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'오른쪽이 DIN. 각 과거 행동(Goods 1…N)과 후보 광고 임베딩이 함께 Activation Unit에 들어가 Goods Weight를 만들고, 이 가중치로 SUM Pooling한 결과가 이후 MLP로 들어간다. 오른쪽 위 박스가 Activation Unit 내부 — 사용자 임베딩과 광고 임베딩에 더해 Out Product(외적)까지 Concat해 넣는 것을 볼 수 있다.',
  src:'원문 Figure 2 오른쪽, p.4'}
],

quotes:[
 {t:'DIN adaptively calculate the representation vector of user interests by taking into consideration the relevance of historical behaviors w.r.t. candidate ad.',
  src:'Section 4.1, p.4'}
],

links:[
 {t:'arXiv 1706.06978 — Deep Interest Network for Click-Through Rate Prediction', u:'https://arxiv.org/abs/1706.06978'},
 {t:'공식 구현 (zhougr1993/DeepInterestNetwork)', u:'https://github.com/zhougr1993/DeepInterestNetwork'}
]
});
