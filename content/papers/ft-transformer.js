WIKI.paper({
slug:'ft-transformer',
venue:'NeurIPS 2021',
authors:'Gorishniy, Rubachev, Khrulkov, Babenko (Yandex · HSE)',
arxiv:'2106.11959',

tldr:'표 데이터용 딥러닝 논문들을 **같은 전처리·같은 튜닝 예산**으로 다시 비교했더니, 상당수가 스스로 비교했던 기존 방법보다 겨우 조금 나은 수준이었고 **단순한 [ResNet](#/p/resnet) 하나가 이미 강력한 베이스라인**이었다는 것을 보인 논문. 그 위에 [Transformer](#/p/transformer)를 표 데이터에 옮긴 FT-Transformer를 새 기준선으로 제시한다.',

context:'2019~2021년 사이 [TabNet](#/p/tabnet)을 비롯해 표 데이터용 딥러닝 아키텍처가 쏟아졌지만, 각 논문이 **서로 다른 전처리·다른 튜닝 예산·다른 데이터셋 부분집합**으로 자신의 베이스라인을 골라 비교했다. 이 논문의 출발점은 방법론적 의심이다 — "새 아키텍처가 이겼다는 결과가, 아키텍처의 우월성이 아니라 비교 조건의 비대칭에서 나온 것은 아닌가?" 저자들은 MLP를 진지하게 튜닝만 해도 사라지는 격차가 많다는 것을 확인하기 위해, 11개 데이터셋에 대해 모든 모델을 **Optuna 기반 베이지안 최적화로 동일한 탐색 예산** 아래 재훈련한다.',

ideas:[
 {h:'같은 프로토콜로 재비교한다',
  lead:'11개 데이터셋, 모델마다 Optuna로 동일 예산의 하이퍼파라미터 탐색, 15개 시드 반복.',
  d:'전처리(수치형은 quantile transform, 일부 데이터셋만 표준화), 배치 크기, patience=16 조기종료, 옵티마이저(AdamW)까지 전 모델에 동일하게 고정한다. 각 설정을 15개 랜덤 시드로 반복해 평균·순위를 보고하고, 앙상블 비교를 위해 15개를 3개씩 묶어 3개의 앙상블도 만든다. 이 정도로 통제된 비교 자체가 이 분야에 없었다는 것이 저자들의 문제 제기다.'},
 {h:'ResNet이 죽지 않는 베이스라인이다',
  lead:'잔차 연결 하나만 더한 단순 MLP 변형이 TabNet·AutoInt·GrowNet 등 복잡한 경쟁자를 순위표에서 앞선다.',
  d:'`ResNetBlock(x) = x + Dropout(Linear(Dropout(ReLU(Linear(BatchNorm(x))))))` 구조를 쌓은 것이 전부인 모델이 11개 데이터셋 평균 순위 3.3위로, TabNet(7.5위)·SNN(6.4위)·AutoInt(5.7위)·GrowNet(5.7위)을 앞선다. "어떤 경쟁자도 ResNet을 일관되게 이기지 못한다"는 것이 이 논문 첫 번째 핵심 결론이다.'},
 {h:'Feature Tokenizer: 수치·범주 특징을 전부 임베딩 벡터로 통일한다',
  lead:'수치형은 값과 벡터의 원소곱, 범주형은 lookup table로 각 특징을 같은 차원 $d$의 토큰으로 바꾼다.',
  d:'$T_j^{(num)}=b_j^{(num)}+x_j^{(num)}\\cdot W_j^{(num)}$, $T_j^{(cat)}=b_j^{(cat)}+e_j^T W_j^{(cat)}$ 로 모든 특징을 같은 차원의 벡터로 변환하고 쌓아 $T\\in\\mathbb R^{k\\times d}$ 를 만든다. 이렇게 하면 하나의 표 행이 [BERT](#/p/bert)의 문장처럼 "토큰들의 시퀀스"가 되어 표준 Transformer를 그대로 적용할 수 있다.'},
 {h:'[CLS] 토큰으로 표 전체를 요약한다',
  lead:'BERT와 같은 방식으로 [CLS] 토큰을 특징 토큰들 앞에 붙이고, 그 출력만으로 예측한다.',
  d:'$T_0=\\text{stack}[\\texttt{[CLS]}, T]$ 를 $L$개의 Transformer 층에 통과시켜 $T_i=F_i(T_{i-1})$ 을 얻고, 마지막 층의 [CLS] 표현만 예측 헤드에 넣는다. Self-attention이 [CLS]와 각 특징 토큰, 그리고 특징 토큰들 사이의 관계를 전부 학습하므로, 어떤 특징 조합이 상호작용하는지를 아키텍처가 직접 정할 필요가 없다.'},
 {h:'"보편적으로 이기는 모델은 없다"는 결론',
  lead:'GBDT가 이기는 데이터셋에서 FT-Transformer가 ResNet보다 특히 더 앞선다 — 정확도보다 "안정성"이 강점이라는 뜻.',
  d:'하이퍼파라미터를 제대로 튜닝하면 California Housing·Adult·Yahoo 같은 데이터셋에서 [CatBoost](#/p/catboost)/[XGBoost](#/p/xgboost)가 여전히 딥러닝을 이긴다. 흥미로운 점은 FT-Transformer가 ResNet보다 우위를 보이는 지점이 **정확히 GBDT가 ResNet을 이기는 데이터셋들**이라는 것 — FT-Transformer는 모든 과제에서 그럭저럭 경쟁력을 유지하는 반면, GBDT와 ResNet은 각자 잘하는 데이터셋의 부분집합이 다르다. 저자들은 이를 "보편성(universality)"의 증거로 해석한다.'}
],

diagram:{type:'flow', cap:'표 데이터의 한 행을 [CLS] 포함 토큰 시퀀스로 바꿔 표준 Transformer에 통과시킨다.',
 nodes:[
  {t:'수치+범주 특징', s:'원본 행'},
  {t:'특징 토큰화', s:'전부 d차원 벡터로', acc:true},
  {t:'[CLS] 토큰 추가', s:'BERT식 요약 토큰'},
  {t:'Transformer L층', s:'특징 간 self-attention'},
  {t:'[CLS] 출력 → 예측', s:'분류/회귀 헤드'}
 ]},

math:[
 {expr:'T_j = b_j + f_j(x_j),   f_j(num)(x) = x·W_j(num),   f_j(cat)(x) = e^T W_j(cat)',
  tex:'\\begin{aligned}T_j^{(num)} &= b_j^{(num)} + x_j^{(num)}\\cdot W_j^{(num)} \\in \\mathbb R^{d}\\\\ T_j^{(cat)} &= b_j^{(cat)} + e_j^{\\top} W_j^{(cat)} \\in \\mathbb R^{d}\\end{aligned}',
  d:'수치형 특징은 값과 학습 가능한 벡터의 곱, 범주형 특징은 원-핫 벡터와 lookup table의 곱으로 같은 차원 $d$의 토큰을 만든다. $b_j$ 는 특징별 편향(bias).'},
 {expr:'T_0 = stack([CLS], T),   T_i = F_i(T_{i-1})',
  tex:'T_0=\\text{stack}\\big[\\texttt{[CLS]},\\,T\\big],\\qquad T_i=F_i(T_{i-1})',
  d:'[CLS] 토큰을 특징 토큰 시퀀스 앞에 붙이고 $L$개 Transformer 층 $F_1,\\dots,F_L$ 을 통과시킨다. 최종 $T_L$ 의 [CLS] 위치 벡터가 예측에 쓰인다.'},
 {expr:'ResNetBlock(x) = x + Dropout(Linear(Dropout(ReLU(Linear(BatchNorm(x))))))',
  tex:'\\text{ResNetBlock}(x)=x+\\text{Dropout}\\big(\\text{Linear}(\\text{Dropout}(\\text{ReLU}(\\text{Linear}(\\text{BatchNorm}(x)))))\\big)',
  d:'이 논문의 두 번째 기여인 ResNet 베이스라인의 블록 정의. 복잡한 설계 없이 잔차 연결 하나만 더했을 뿐인데도 여러 최신 표 데이터 신경망을 이긴다.'}
],

numbers:[
 {k:'비교 데이터셋 수', v:'11개', d:'California Housing·Adult·Helena·Jannis·Higgs·ALOI·Epsilon·Year·Covertype·Yahoo·Microsoft'},
 {k:'평가 반복', v:'15개 랜덤 시드', d:'모델마다 Optuna로 튜닝 후 15회 반복, 3개씩 묶어 앙상블도 3개 구성'},
 {k:'DL 모델 평균 순위 (11개 데이터셋)', v:'FT-Transformer 1.8위', d:'ResNet 3.3위, NODE 3.9위, MLP 4.8위, TabNet 7.5위 (숫자가 낮을수록 좋음)'},
 {k:'단일 모델 최고 튜닝 GBDT vs DL', v:'California Housing·Adult·Yahoo', d:'하이퍼파라미터를 제대로 튜닝하면 이 데이터셋들에서 CatBoost/XGBoost가 앙상블 기준으로도 딥러닝을 앞섬(Table 4)'},
 {k:'기본값 FT-Transformer 앙상블', v:'대부분 데이터셋에서 GBDT 능가', d:'튜닝 없이도 California Housing·Adult 2개를 제외하면 GBDT 앙상블보다 우위 — "박스에서 바로 강하다"는 근거'}
],

impact:'이 논문의 진짜 기여는 새 아키텍처가 아니라 **비교 방법론**이다 — 표 데이터 딥러닝 분야에 "동일 튜닝 예산·동일 전처리로 재현 가능한 벤치마크"라는 기준을 세웠고, 이후 이 분야 논문들은 이 벤치마크 프로토콜을 인용하거나 답습하게 되었다. "보편적으로 이기는 모델은 없다"는 결론은 실무자에게 유용한 메시지다 — 새 딥러닝 아키텍처를 볼 때마다 "베이스라인이 제대로 튜닝됐는가"를 먼저 물어야 한다는 관행을 남겼다.',

legacy:[
 '**표 데이터 벤치마크 방법론의 기준점** — [Trees Still Win](#/p/trees-still-win)을 포함한 후속 비교 연구들이 이 논문의 "동일 튜닝 예산" 프로토콜을 표준으로 채택',
 '**ResNet 베이스라인의 재발견** — 이후 표 데이터 신경망 논문들이 새 아키텍처의 우위를 주장하려면 최소 튜닝된 ResNet/MLP를 반드시 이겨야 하는 관행이 생김',
 '**Feature Tokenizer 패턴의 확산** — 수치·범주 특징을 동일 차원 토큰으로 통일해 Transformer에 넣는 방식이 이후 표 데이터 파운데이션 모델 계열에서 재사용됨'
],

pitfalls:[
 '**"FT-Transformer가 GBDT를 이겼다"는 이 논문의 결론이 아니다.** Section 4.5는 명시적으로 "GBDT와 딥러닝 사이에 보편적 우위는 없다"고 결론짓는다 — 튜닝된 GBDT가 이기는 데이터셋(California Housing, Adult, Yahoo)이 분명히 있다.',
 '**비교의 공정성은 "같은 튜닝 예산"이지 "무튜닝"이 아니다.** 저자들은 default 설정과 tuned 설정을 모두 보고하며, tuned 상태에서 GBDT가 더 강해진다는 것을 숨기지 않는다. 기본값 비교 결과만 인용하면 논문의 실제 결론과 반대로 이해하게 된다.',
 '**FT-Transformer는 계산 비용이 크다.** 저자들 스스로 "Limitations"에서 ResNet보다 더 많은 하드웨어·시간이 필요하고 특징 수가 매우 많으면 확장이 어렵다고 명시한다 — 정확도표만 보고 항상 FT-Transformer를 고르는 것은 이 논문의 취지에 어긋난다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽부터: 원본 특징 $x$ → Feature Tokenizer가 임베딩 $T$로 변환 → [CLS] 토큰을 앞에 붙여 $T_0$ 구성 → Transformer 층 통과 → 마지막 [CLS] 표현만 꺼내 예측. [BERT](#/p/bert)의 문장 분류 방식을 표 한 행에 그대로 적용한 구조.',
  src:'원문 Figure 1, p.4'},
 {f:'fig2a-tokenizer.png',
  cap:'수치형 특징(위, 빨강)은 값과 학습된 벡터 $W^{(num)}$ 의 원소곱 + 편향, 범주형 특징(아래, 초록)은 원-핫 벡터로 lookup table $W^{(cat)}$ 에서 행을 골라 + 편향. 결과가 전부 같은 차원 $d$ 벡터로 쌓여 $T$ 를 이룬다.',
  src:'원문 Figure 2(a), p.4'}
],

quotes:[
 {t:'We reveal that there is still no universally superior solution among GBDT and deep models.',
  src:'Introduction, p.2'}
],

links:[
 {t:'arXiv 2106.11959 — Revisiting Deep Learning Models for Tabular Data', u:'https://arxiv.org/abs/2106.11959'},
 {t:'공식 구현 (rtdl / Yandex Research)', u:'https://github.com/yandex-research/rtdl'}
]
});
