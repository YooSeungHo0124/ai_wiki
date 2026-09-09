WIKI.paper({
slug:'simcse',
venue:'EMNLP 2021',
authors:'Gao, Yao & Chen (Princeton University · Tsinghua University)',
arxiv:'2104.08821',

tldr:'같은 문장을 dropout mask만 다르게 해서 encoder에 두 번 통과시키는 것만으로 positive pair를 만든다. 라벨 데이터도 데이터 증강도 없이 이 한 가지 트릭만으로 [SBERT](#/p/sentence-bert) 계열의 비지도 SOTA를 크게 앞섰다.',

context:'[Sentence-BERT](#/p/sentence-bert)는 문장을 독립적으로 인코딩해 코사인 유사도만 비교하면 되게 만들었지만, 학습에는 여전히 SNLI/MultiNLI 같은 **라벨된 문장 쌍**이 필요했다. 라벨 없이 좋은 문장 임베딩을 얻으려는 시도들은 단어 삭제·치환 같은 이산적 데이터 증강이나 다음 문장 예측 같은 목적함수를 썼지만 성능이 낮았다. 텍스트는 이미지와 달리 자르기·회전 같은 연속적인 augmentation을 적용하기 어렵다는 것이 근본 문제였다. 여기에 더해 사전학습 언어모델의 임베딩은 **anisotropy**(비등방성) 문제를 겪는다 — 벡터들이 공간 전체에 퍼지지 못하고 좁은 원뿔 모양 영역에 몰려서, 아무 문장 쌍이나 코사인 유사도가 비정상적으로 높게 나온다.',

ideas:[
 {h:'Dropout 두 번이 전부다',
  lead:'같은 문장을 encoder에 두 번 넣고, 서로 다른 dropout mask가 만든 두 벡터를 positive pair로 쓴다.',
  d:'Transformer 내부에는 이미 학습용 dropout이 걸려 있다. 이 논문은 새로운 augmentation을 설계하는 대신, **같은 입력 문장을 두 번 forward** 시키기만 한다. 매번 무작위로 다른 뉴런이 꺼지므로 두 출력 벡터는 미세하게 다르고, 이 둘을 positive pair로, 같은 배치의 다른 문장들을 negative로 써서 InfoNCE 손실로 학습한다. 데이터 증강도 라벨도 필요 없다.'},
 {h:'In-batch negative로 강한 대조 신호를 만든다',
  lead:'배치 안의 다른 모든 문장을 negative로 취급해 대조 손실을 계산한다.',
  d:'positive pair가 있으면 배치 크기 $N$개의 다른 문장을 자동으로 negative로 쓸 수 있다. 배치가 클수록 negative가 많아져 학습 신호가 강해지고, temperature $\\tau=0.05$로 유사도 분포를 뾰족하게 만들어 hard negative에 더 큰 gradient가 가도록 조정한다.'},
 {h:'Supervised 버전: NLI의 entailment/contradiction 재활용',
  lead:'entailment 쌍은 positive, contradiction 쌍은 hard negative로 그대로 쓴다.',
  d:'라벨이 있을 때는 더 잘할 수 있다. NLI 데이터셋의 premise-hypothesis 쌍 중 **entailment**(함의) 라벨을 positive pair로, **contradiction**(모순) 라벨을 같은 배치 안에서 특히 어려운 negative로 추가한다. [SBERT](#/p/sentence-bert)처럼 3-way 분류로 학습하는 대신 대조학습 틀 안에 라벨을 녹여 넣은 것이 핵심 차이이고, 이 방식이 STS 평균을 81.6%까지 밀어올렸다.'},
 {h:'왜 되는가: alignment와 uniformity',
  lead:'dropout 잡음은 표현 붕괴 없이 양성쌍 정렬을 유지하고, 대조 손실은 임베딩 공간을 고르게 펼친다.',
  d:'Wang & Isola의 분석 틀을 빌리면 좋은 임베딩은 (1) 비슷한 쌍끼리는 가깝고(alignment) (2) 임베딩 전체가 공간에 고르게 퍼져야(uniformity) 한다. Dropout이 전혀 없으면(no dropout) 두 forward가 완전히 같아져 학습이 무너지는 **표현 붕괴**가 일어난다. 반대로 SimCSE의 미세한 dropout 잡음은 alignment는 거의 해치지 않으면서 uniformity를 크게 개선해, 사전학습 임베딩이 겪던 **anisotropy**(좁은 원뿔에 몰리는 문제)를 완화한다.'}
],

diagram:{type:'compare', cap:'같은 encoder를 두 번 쓰지만 positive pair를 만드는 방식이 다르다.',
 left:{t:'Sentence-BERT', items:['서로 다른 두 문장 A, B','NLI 라벨(함의/모순)로 학습','siamese로 코사인 유사도 회귀·분류']},
 right:{t:'SimCSE (비지도)', items:['같은 문장을 encoder에 두 번','dropout mask 차이만으로 positive','라벨 없이 InfoNCE 대조학습']}},

math:[
 {expr:'l_i = -log( exp(sim(h_i, h_i+)/τ) / Σ_j exp(sim(h_i, h_j+)/τ) )',
  tex:'\\ell_i=-\\log\\frac{e^{\\text{sim}(\\mathbf{h}_i,\\mathbf{h}_i^{+})/\\tau}}{\\sum_{j=1}^{N}e^{\\text{sim}(\\mathbf{h}_i,\\mathbf{h}_j^{+})/\\tau}}',
  d:'배치 크기 $N$의 InfoNCE 손실. $\\mathbf{h}_i,\\mathbf{h}_i^{+}$는 같은 문장을 dropout을 다르게 걸어 두 번 인코딩한 벡터 쌍, 분모는 배치 안 모든 후보와의 유사도 합이라 나머지 $N-1$개가 자동으로 negative가 된다.'},
 {expr:'sim(h1, h2) = (h1 · h2) / (||h1|| ||h2||)',
  tex:'\\text{sim}(\\mathbf{h}_1,\\mathbf{h}_2)=\\frac{\\mathbf{h}_1^{\\top}\\mathbf{h}_2}{\\lVert \\mathbf{h}_1\\rVert\\cdot\\lVert \\mathbf{h}_2\\rVert}',
  d:'코사인 유사도. temperature $\\tau=0.05$로 나눠 분포를 뾰족하게 만든 뒤 softmax에 넣는다 — 너무 크면 negative 구분이 무뎌지고, 너무 작으면 학습이 불안정해진다.'}
],

numbers:[
 {k:'STS 평균(비지도)', v:'76.3%', d:'BERTbase, 7개 STS 태스크 Spearman ρ 평균 — 이전 최고 대비 +4.2%p(Abstract)'},
 {k:'STS 평균(지도, NLI)', v:'81.6%', d:'entailment/contradiction을 활용한 supervised SimCSE, 이전 최고 대비 +2.2%p(Abstract)'},
 {k:'temperature', v:'τ = 0.05', d:'유사도 점수를 나누는 값. 학습 안정성에 민감한 하이퍼파라미터로 별도 튜닝됨'},
 {k:'dropout 제거 실험', v:'STS-B 74.2 → 붕괴', d:'"w/o dropout"(같은 mask로 두 번 forward)은 두 벡터가 사실상 동일해져 표현 붕괴가 관찰됨(Table 1)'},
 {k:'학습 데이터', v:'Wikipedia 문장(비지도) / NLI 데이터셋(지도)', d:'비지도판은 라벨 없는 위키피디아 문장만 사용, 별도 augmentation 없음'}
],

impact:'SimCSE는 "좋은 augmentation을 설계해야 대조학습이 된다"는 전제를 dropout 하나로 무너뜨렸다. 구현이 몇 줄이면 끝나는 단순함 덕에 [SBERT](#/p/sentence-bert) 이후 문장 임베딩의 사실상 기본 베이스라인이 됐고, [SimCLR](#/p/simclr)류의 비전 대조학습 레시피(양성쌍 만들기 + in-batch negative + temperature)를 텍스트에 옮기는 표준 패턴을 확립했다. Alignment/uniformity 분석 틀을 빌려 "왜 되는지"까지 실증적으로 설명한 점도, 이후 임베딩 연구가 성능 숫자만이 아니라 표현 공간의 기하학적 성질을 함께 보고하게 만들었다.',

legacy:[
 '**대규모 약지도 대조학습으로 확장** — [E5](#/p/e5)가 SimCSE의 대조학습 틀에 웹 규모 텍스트 쌍을 결합해 범용 임베딩으로 발전',
 '**dropout-as-augmentation 패턴의 확산** — 이후 다른 모달리티·태스크에서도 "다시 forward하면 그게 augmentation"이라는 아이디어가 재사용됨',
 '**검색 파이프라인의 인코더 교체 대상** — [DPR](#/p/dpr)·[RAG](#/p/rag) 계열 retrieval 인코더를 SimCSE류 대조학습 임베딩으로 바꾸는 것이 실무 표준이 됨',
 '**MTEB 등 임베딩 벤치마크의 기준점** — SimCSE 계열 점수가 이후 임베딩 모델 비교의 출발선으로 자주 인용됨'
],

pitfalls:[
 '**임베딩 모델을 SimCSE로 바꾸면 벡터DB 인덱스를 전체 재구축해야 한다.** [Sentence-BERT](#/p/sentence-bert)와 마찬가지로 좌표계가 모델마다 다르므로 기존 벡터와 직접 비교할 수 없다 — 재인코딩 비용을 과소평가하기 쉽다.',
 '**STS 벤치마크 점수가 실제 검색 품질을 보장하지 않는다.** SimCSE와 후속 모델들은 STS/MTEB 리더보드에 맞춰 과적합되는 경향이 있고, 학습 도메인(주로 Wikipedia·NLI)과 동떨어진 실무 도메인에서는 벤치마크 순위와 실제 성능이 어긋날 수 있다.',
 '**dropout rate가 성능에 민감하다.** 기본값 $p=0.1$을 벗어나면(0으로 끄거나 지나치게 키우면) 표현 붕괴나 성능 저하가 관찰됐다 — 무심코 dropout 설정을 바꾸면 재현이 깨진다.'
],

figures:[
 {f:'fig1-dropout-contrastive.png',
  cap:'(a) 비지도: 같은 문장 "Two dogs are running."을 encoder E에 두 번 통과시켜 서로 다른 dropout mask로 나온 두 벡터(초록 원)가 positive, 배치의 다른 문장들이 negative. (b) 지도: premise를 두 encoder에 넣고, entailment 라벨 문장은 positive(초록), contradiction 라벨 문장은 hard negative(빨강)로 명시적으로 추가.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We find that dropout acts as minimal data augmentation, and removing it leads to a representation collapse.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2104.08821 — SimCSE', u:'https://arxiv.org/abs/2104.08821'},
 {t:'princeton-nlp/SimCSE (공식 구현)', u:'https://github.com/princeton-nlp/SimCSE'}
]
});
