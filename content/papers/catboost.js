WIKI.paper({
slug:'catboost',
venue:'NeurIPS 2018',
authors:'Prokhorenkova, Gusev, Vorobev, Dorogush, Gulin (Yandex)',
arxiv:'1706.09516',

tldr:'모든 기존 그래디언트 부스팅 구현이 겪는, 이름조차 없던 문제 — 자기 자신의 타깃으로 만든 통계를 다시 자기 자신에게 학습시켜서 생기는 편향 — 을 **prediction shift**라는 개념으로 정식화하고, 순서(ordering) 원리 하나로 범주형 인코딩과 그래디언트 추정 양쪽의 편향을 동시에 없앤 논문.',

context:'[XGBoost](#/p/xgboost)·[LightGBM](#/p/lightgbm) 시대의 GBDT는 범주형 특징을 다룰 때 보통 타깃 통계(target statistic, TS) — 그 범주에서 관측된 타깃의 평균 — 로 치환했다. 문제는 $k$번째 샘플의 범주를 치환할 때 $k$번째 샘플 자신의 타깃 $y_k$가 그 평균 계산에 들어간다는 점이다. 이 논문은 이것이 **왜** 문제인지를 극단적인 예로 보여준다 — 범주값이 전부 유일하고 $P(y=1|x_i)=0.5$인 특징이 있으면, 타깃 통계는 학습 데이터에서 $y_k$ 값 자체를 거의 그대로 복사하게 되어 훈련 정확도는 100%에 가깝지만 테스트에서는 0.5로 떨어진다. 저자들은 이 현상이 범주형 인코딩만의 문제가 아니라, **그래디언트 부스팅 자체의 그래디언트 추정 단계에도 똑같은 구조로 숨어 있다**는 것을 지적한다.',

ideas:[
 {h:'타깃 통계의 조건 이동(conditional shift)',
  lead:'같은 샘플의 타깃으로 만든 인코딩 값은 훈련·테스트에서 분포가 달라진다.',
  d:'그리디 TS $\\hat x_i^k=\\dfrac{\\sum_j 1\\{x_{ij}=x_{ik}\\}y_j+ap}{\\sum_j 1\\{x_{ij}=x_{ik}\\}+a}$ 는 합에 $y_k$ 자신이 포함된다. 저자들은 이를 "$E(\\hat x^i\\mid y=v)=E(\\hat x_k^i\\mid y_k=v)$" 라는 조건(P1)으로 정식화하고, 그리디 TS와 leave-one-out TS **둘 다 이 조건을 만족시키지 못함**을 반례로 증명한다. holdout TS는 조건을 만족하지만 데이터를 절반 버리게 된다(P2 위반).'},
 {h:'Ordered TS: 각 샘플에게 자신보다 앞선 기록만 보여준다',
  lead:'임의의 순서를 매겨 각 샘플의 타깃 통계를 "그 이전 샘플들"만으로 계산한다.',
  d:'학습 데이터에 인위적인 시간 순서 $\\sigma$를 무작위로 부여하고, $k$번째 샘플의 TS는 $\\sigma(j)<\\sigma(k)$ 인 샘플 $j$들만으로 계산한다(온라인 학습에서 과거 기록만 쓰는 것과 같은 원리). 이렇게 하면 $y_k$ 자신이 자기 통계 계산에 들어가지 않아 P1을 만족하면서도, 전체 데이터를 다 쓸 수 있어 P2도 지킨다. 순서를 하나만 고정하면 순서 앞쪽 샘플일수록 분산이 크므로, CatBoost는 부스팅 스텝마다 **다른 순열을 새로 뽑아** 이 분산을 줄인다.'},
 {h:'Prediction shift: 그래디언트 추정에도 같은 누수가 있다',
  lead:'$t$번째 트리의 그래디언트를 계산할 때 이미 그 샘플을 본 모델로 계산해서 편향이 생긴다.',
  d:'표준 GBDT는 $t$번째 트리를 만들 때 이전까지의 앙상블 $F^{t-1}$로 각 훈련 샘플의 그래디언트를 구한다. 그런데 $F^{t-1}$ 자체가 그 샘플을 포함한 데이터로 학습됐으므로, 훈련 샘플에서 관측하는 그래디언트의 조건부 분포 $F^{t-1}(x_k)\\mid x_k$ 가 테스트 샘플의 $F^{t-1}(x)\\mid x$ 와 달라진다. 저자들은 간단한 회귀 예제로 이 편향이 $O(1/n)$ 이 아니라 상수 차수로 남을 수 있음을 수식으로 보인다.'},
 {h:'Ordered boosting: 그래디언트도 순서 원리로 재추정한다',
  lead:'$i$번째 샘플의 그래디언트는 그 샘플을 한 번도 보지 않은 모델 $M_{\\sigma(i)-1}$로만 계산한다.',
  d:'타깃 통계와 같은 순열 원리를 부스팅 자체에 적용한다. $n$개의 샘플마다 별도의 지지 모델(supporting model) $M_1,\\dots,M_n$ 을 유지하며, $i$번째 샘플의 잔차는 그 샘플 이전 기록만으로 학습된 $M_{\\sigma(i)-1}$ 로 계산한다(원리적으로는 Algorithm 1). 순진하게 구현하면 샘플마다 모델을 따로 유지해야 해 비현실적이므로, 실전 구현(Algorithm 2)은 오블리비어스 트리 구조를 이용해 여러 순열 $\\sigma_1,\\dots,\\sigma_s$ 을 공유하는 방식으로 표준 GBDT와 같은 점근 복잡도를 유지한다.'},
 {h:'오블리비어스 트리: 같은 레벨은 같은 분할 조건을 쓴다',
  lead:'트리의 같은 깊이에서는 전 노드가 동일한 분할 특징·임계값을 공유해 균형 트리를 강제한다.',
  d:'오블리비어스(decision table) 구조는 한 레벨에 하나의 (특징, 임계값) 쌍만 고르므로 트리가 자동으로 균형을 이루고 과적합에 덜 민감하며, 추론 시 빠르다. ordered boosting과 궁합이 좋은 것은, 레벨마다 분할을 한 번만 고르면 되어 여러 순열에 대한 그래디언트·리프 값 계산을 재사용하기 쉽기 때문이다.'}
],

diagram:{type:'flow', cap:'Ordered TS 계산: 샘플 7의 통계는 6까지의 순서(1~6)만 사용하고, 자기 자신(7)의 타깃은 쓰지 않는다.',
 nodes:[
  {t:'순서 σ 부여', s:'무작위 순열'},
  {t:'샘플 k 이전 기록', s:'σ(j) < σ(k)만'},
  {t:'TS/그래디언트 계산', s:'자기 타깃 제외', acc:true},
  {t:'스텝마다 순열 교체', s:'분산 감소'}
 ]},

math:[
 {expr:'x̂ik = ( Σ_{j∈Dk} 1{xij=xik}·yj + a·p ) / ( Σ_{j∈Dk} 1{xij=xik} + a )',
  tex:'\\hat x_k^i=\\dfrac{\\sum_{x_j\\in D_k}\\mathbb 1\\{x_{ij}=x_{ik}\\}\\,y_j+a\\,p}{\\sum_{x_j\\in D_k}\\mathbb 1\\{x_{ij}=x_{ik}\\}+a}',
  d:'타깃 통계의 일반형. $D_k$ 를 어떻게 정하느냐(그리디=전체, holdout=별도 절반, ordered=순서상 이전 샘플)가 편향 여부를 가른다. $a>0$ 는 저빈도 범주를 사전값 $p$ 쪽으로 스무딩하는 파라미터.'},
 {expr:'P1: E(x̂i | y=v) = E(x̂ik | yk=v)',
  tex:'\\mathbb E(\\hat x^{i}\\mid y=v)=\\mathbb E(\\hat x_k^{i}\\mid y_k=v)',
  d:'타깃 통계가 갖춰야 할 조건. 훈련 샘플에서 관측하는 통계의 조건부 기대값이 테스트에서 관측하는 것과 같아야 한다는 뜻 — 이 조건을 그리디 TS와 leave-one-out TS는 만족하지 못한다.'},
 {expr:'loss(Tc) = cos(Δ, G)',
  tex:'\\text{loss}(T_c)=\\cos(\\Delta,\\,G)',
  d:'CatBoost는 후보 분할 $T_c$ 를 평가할 때, 리프 평균 잔차 $\\Delta$ 와 실제 그래디언트 $G$ 사이의 코사인 유사도를 쓴다(Algorithm 2). Ordered 모드에서는 $\\Delta,G$ 모두 순열상 이전 기록만으로 계산된 값이다.'}
],

numbers:[
 {k:'Amazon (logloss)', v:'CatBoost 0.139', d:'같은 데이터에서 LightGBM +17%, XGBoost +17% 상대 악화 (Ordered TS로 전처리 후 비교)'},
 {k:'Epsilon (zero-one loss)', v:'CatBoost 0.109', d:'LightGBM +4.1%, XGBoost +12% 상대 악화'},
 {k:'통계적 유의성', v:'9개 중 6개 데이터셋', d:'p<0.01 (Appetency·Churn·Upselling 3개 제외 전부 유의)'},
 {k:'Ordered vs Plain 속도', v:'약 1.7배', d:'Epsilon 데이터 기준 Ordered 모드가 Plain보다 느림 (Plain·LightGBM이 가장 빠름)'},
 {k:'실험 데이터셋 수', v:'9개', d:'Adult·Amazon·Click·Epsilon·Appetency·Churn·Internet·Upselling·Kick'},
 {k:'평가 방식', v:'4/5 학습 · 1/5 테스트', d:'하이퍼파라미터 탐색(TPE)도 같은 4/5 위에서 수행, 세 알고리즘 모두 동일 조건'}
],

impact:'CatBoost는 "범주형 특징은 원-핫이나 타깃 인코딩으로 전처리한다"는 관행 자체에 이론적 결함이 있음을 보여주고, GBDT 구현 3파전([XGBoost](#/p/xgboost)·[LightGBM](#/p/lightgbm)·CatBoost)에 세 번째 축을 세웠다. 범주형 변수가 많은 실무 데이터(광고·추천·금융)에서 별도의 인코딩 파이프라인 없이 바로 쓸 수 있다는 점이 채택의 핵심 이유가 되었다. 다만 논문이 보인 것은 "인코딩·그래디언트 추정에 구조적 편향이 있다"는 진단이지, 모든 상황에서 CatBoost가 이긴다는 뜻은 아니다 — Table 2에서도 데이터셋별 우위 폭은 0.04%~17%로 크게 갈린다.',

legacy:[
 '**타깃 인코딩 라이브러리 전반에 영향** — scikit-learn의 `TargetEncoder`, `category_encoders` 패키지 등이 이후 순서/교차검증 기반 인코딩을 기본 옵션으로 채택',
 '**GBDT 3파전 고착화** — [XGBoost](#/p/xgboost)(정확·근사 분할), [LightGBM](#/p/lightgbm)(히스토그램·leaf-wise), CatBoost(순서 원리)가 각자의 강점 영역(정확도 vs 속도 vs 범주형)을 유지한 채 공존',
 '**"편향 없는 그래디언트"라는 관점의 확산** — 이후 정형 데이터 벤치마크 논문([Trees Still Win](#/p/trees-still-win) 포함)이 GBDT 비교 시 인코딩 방식을 통제 변수로 명시하게 됨'
],

pitfalls:[
 '**"CatBoost가 범주형 변수를 원-핫 없이 쓴다"가 전부가 아니다.** 핵심은 원-핫 여부가 아니라 타깃 통계를 계산할 때 **자기 자신의 타깃을 배제**하는 순서 원리다. 단순 K-fold 타깃 인코딩도 완벽한 해법은 아니다.',
 '**Ordered 모드가 항상 Plain보다 좋은 것은 아니다.** Table 3에 따르면 데이터셋에 따라 Plain이 근소하게 더 나은 경우도 있다(Amazon, Click, Kick의 zero-one loss). 저자들은 작은 데이터셋일수록 prediction shift 편향이 커 Ordered의 이득이 크다고 분석한다.',
 '**Ordered 모드는 메모리·연산량 비용이 있다.** $s+1$개의 순열과 순열별 지지 모델을 유지해야 해서, 논문 실험에서도 Plain·LightGBM보다 약 1.7배 느리다 — "정확도만 보고 항상 Ordered를 켜라"는 결론이 아니다.'
],

figures:[
 {f:'fig1-ordered-boosting.png',
  cap:'원 안의 숫자는 순열 σ가 매긴 순서. 샘플 7의 잔차 $r^t(x_7,y_7)=y_7-M_6^{t-1}(x_7)$ 를 계산할 때, 모델 $M_6^{t-1}$ 은 1~6번(자기 자신보다 앞선 기록)만으로 학습된 것 — 7번 자신의 타깃은 이 계산에 전혀 쓰이지 않는다.',
  src:'원문 Figure 1, p.6'}
],

quotes:[
 {t:'A prediction model F obtained after several steps of boosting relies on the targets of all training examples... This finally leads to a prediction shift of the learned model.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 1706.09516 — CatBoost: unbiased boosting with categorical features', u:'https://arxiv.org/abs/1706.09516'},
 {t:'CatBoost 공식 문서', u:'https://catboost.ai/docs/'},
 {t:'CatBoost GitHub', u:'https://github.com/catboost/catboost'}
]
});
