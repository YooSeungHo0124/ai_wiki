WIKI.paper({
slug:'tabnet',
venue:'AAAI 2021 (arXiv 2019)',
authors:'Arik & Pfister (Google Cloud AI)',
arxiv:'1908.07442',

tldr:'표 데이터에도 [Transformer](#/p/transformer) 계열처럼 **어텐션으로 무엇을 볼지 고르는** 신경망을 적용한 논문. 이미지·텍스트를 벗어나 정형 데이터에서 딥러닝이 그래디언트 부스팅과 정면으로 경쟁하려 한 초기 시도 중 하나다.',

context:'표 데이터는 2019년까지도 [XGBoost](#/p/xgboost)·[LightGBM](#/p/lightgbm) 같은 GBDT가 사실상의 기본값이었고, 이미지·텍스트·음성처럼 규범적인 딥러닝 아키텍처가 없었다. 표 데이터에 흔한 MLP는 파라미터가 특징 전체에 걸쳐 밀집(dense)하게 연결돼 있어, 실제로는 소수의 특징만 유의미한 표 데이터에서 트리 기반 모델의 **특징별 하드 분기**가 주는 이점(불필요한 특징을 아예 무시)을 못 따라간다는 것이 저자들의 출발점이다. 동시에 GBDT는 종단간(end-to-end) 미분 가능하지 않아 이미지 등 다른 모달리티와 결합하거나 스트리밍 데이터로 파인튜닝하기 어렵다는 한계도 있었다.',

ideas:[
 {h:'순차적 어텐션: 매 결정 단계마다 다른 특징을 본다',
  lead:'하나의 순전파 안에 여러 결정 단계를 두고, 단계마다 sparsemax로 특징의 부분집합만 골라 쓴다.',
  d:'TabNet은 $N_{steps}$ 개의 순차적 결정 단계로 구성되고, 각 단계는 어텐티브 트랜스포머가 만든 마스크 $M[i]$ 로 입력 특징 $f$ 를 곱해(`M[i]·f`) 그 단계에서 쓸 특징만 남긴다. 이 마스크는 **샘플마다 다르게(instance-wise)** 결정되어, 같은 모델이라도 입력에 따라 다른 특징 조합을 본다 — 이 점이 데이터셋 전체에 대해 하나의 중요도 순위만 내는 전역(global) 특징 선택 방법과 다르다.'},
 {h:'Sparsemax로 마스크를 실제로 0으로 만든다',
  lead:'softmax 대신 sparsemax를 써서 관련 없는 특징의 가중치를 정확히 0으로 떨어뜨린다.',
  d:'$M[i]=\\text{sparsemax}(P[i-1]\\cdot h_i(a[i-1]))$ 로 마스크를 계산한다. sparsemax는 softmax와 달리 확률 단체(simplex)로의 유클리드 사영이라 다수의 성분이 정확히 0이 될 수 있다 — 이 때문에 "약하게 낮은 가중치"가 아니라 실제로 그 특징을 안 쓰는 상태가 만들어져, 해석과 파라미터 효율 양쪽에 도움이 된다.'},
 {h:'Prior scale term: 이미 쓴 특징은 다음 단계에서 억제한다',
  lead:'특징을 이전 단계에서 얼마나 썼는지 누적한 $P[i]$로 다음 단계 마스크를 조절해 특징 재사용을 통제한다.',
  d:'$P[i]=\\prod_{j\\le i}(\\gamma - M[j])$ 로 정의되어, 이전 단계에서 많이 쓰인 특징일수록 $P[i]$ 값이 작아져 다음 단계에서 다시 선택되기 어려워진다. 완화 파라미터 $\\gamma=1$ 이면 특징이 정확히 한 단계에서만 쓰이도록 강제되고, $\\gamma$ 가 커질수록 여러 단계에 걸쳐 재사용할 여유가 생긴다.'},
 {h:'Feature transformer: 공유 층 + 단계별 층',
  lead:'전체 단계가 공유하는 층과 단계마다 독립인 층을 섞어 파라미터 효율과 표현력을 동시에 잡는다.',
  d:'각 결정 단계의 특징 처리 블록(FC → BN → GLU)은 일부 층을 모든 단계가 공유하고 나머지는 단계별로 독립적으로 둔다. 공유 층은 "표 전체에 대해 항상 유효한 변환"을, 단계별 층은 "이 단계만의 특수한 변환"을 담당하는 구조적 분업이다.'},
 {h:'마스크 자체가 해석 결과가 된다 — 그리고 비지도 사전학습도 가능하다',
  lead:'가중치가 0/1에 가까워 마스크를 바로 특징 중요도로 읽을 수 있고, 마스크된 특징 복원으로 비지도 사전학습도 한다.',
  d:'각 단계의 결정 기여도 $\\eta_b[i]$ 로 마스크들을 가중합하면 샘플별 지역(local) 특징 중요도가 되고, 이를 데이터셋 전체로 합하면 전역 중요도가 된다. 별도의 설명 모델(LIME 등)이 필요 없다는 것이 저자들의 주장이다. 또한 인코더-디코더 구조로 일부 특징 열을 가려 놓고 복원하는 방식의 자기지도 사전학습도 제안해, 라벨이 적은 상황에서 인코더 성능을 높인다.'}
],

diagram:{type:'loop', cap:'하나의 순전파 안에서 여러 결정 단계를 거치며, 매 단계 다른 특징 부분집합에 집중한다.',
 center:'N_steps번 반복',
 nodes:[
  {t:'특징 선택', s:'sparsemax 마스크'},
  {t:'입력 처리', s:'feature transformer'},
  {t:'정보 집계', s:'다음 단계로 전달'},
  {t:'출력 합산', s:'ReLU(d[i]) 누적'}
 ]},

math:[
 {expr:'M[i] = sparsemax( P[i-1] · h_i(a[i-1]) )',
  tex:'M[i]=\\text{sparsemax}\\big(P[i-1]\\cdot h_i(a[i-1])\\big)',
  d:'단계 $i$ 의 특징 마스크. $\\sum_j M[i]_{b,j}=1$ 이 되도록 정규화되며, sparsemax 특성상 다수의 성분이 정확히 0이 된다.'},
 {expr:'P[i] = Π_{j≤i} (γ − M[j])',
  tex:'P[i]=\\prod_{j=1}^{i}(\\gamma-M[j])',
  d:'이전 단계까지 각 특징이 얼마나 쓰였는지의 누적. $\\gamma=1$ 이면 한 특징은 전체 결정 과정에서 단 한 번만 선택되도록 강제된다.'},
 {expr:'L_sparse = Σ_{i,b,j} −M[i]_{b,j}·log(M[i]_{b,j}+ε) / (N_steps·B)',
  tex:'L_{sparse}=\\sum_{i=1}^{N_{steps}}\\sum_{b=1}^{B}\\sum_{j=1}^{D}\\dfrac{-M_{b,j}[i]\\log(M_{b,j}[i]+\\epsilon)}{N_{steps}\\cdot B}',
  d:'마스크의 엔트로피를 벌점으로 추가해 희소성을 유도한다. 특징 대부분이 중복 정보를 갖는 데이터셋에서 이 정규화가 유리한 귀납 편향을 준다.'}
],

numbers:[
 {k:'Forest Cover Type 정확도', v:'TabNet 96.99%', d:'XGBoost 89.34% · LightGBM 89.28% · CatBoost 85.14% · AutoML Tables 94.95%'},
 {k:'Sarcos 회귀 (대형 모델)', v:'TabNet-L MSE 0.14', d:'그래디언트 부스팅 트리 1.44, MLP 2.13 대비 약 10배 낮음 (모델 크기 1.75M)'},
 {k:'Higgs Boson (중형 모델)', v:'TabNet-M 78.84%', d:'같은 크기대의 그래디언트 부스팅 트리-M 75.97%, MLP 78.44%(2.04M 파라미터, TabNet의 약 3배 크기)'},
 {k:'버섯 식용 여부 특징 중요도', v:"Odor에 43%", d:'단일 특징 Odor만으로 98.5% 정확도가 나오는 데이터셋에서, LIME·Integrated Gradients·DeepLift는 30% 미만을 할당한 반면 TabNet 마스크는 43%를 할당'},
 {k:'Poker Hand 정확도', v:'딥 신경망 DT 65.1%보다 우위', d:'수작업 규칙이면 100%가 나오는 조합적 문제에서 TabNet이 기존 신경망 계열보다 크게 앞섬'},
 {k:'Rossmann Store Sales MSE', v:'TabNet 485.12', d:'XGBoost 490.83 · CatBoost 489.75 · LightGBM 504.76 · MLP 512.62 — 격차가 가장 좁은 벤치마크'}
],

impact:'TabNet은 "표 데이터에도 어텐션 기반 아키텍처가 통할 수 있다"는 것을 보여 이후 [FT-Transformer](#/p/ft-transformer) 등 정형 데이터용 딥러닝 계열의 본격적인 시작점이 되었다. 동시에 마스크가 곧 해석 결과라는 주장은 표 데이터 딥러닝에 "해석 가능성"이라는 세일즈 포인트를 만들어, 그래디언트 부스팅과 경쟁할 두 번째 근거(정확도 외에 설명력)를 제시했다. 다만 이후 여러 재현 연구는 TabNet의 벤치마크 우위가 **하이퍼파라미터 탐색 예산의 비대칭**(TabNet 쪽에 더 많은 탐색을 준 비교)에서 상당 부분 온다고 지적했다 — 이 문제의식이 [FT-Transformer](#/p/ft-transformer)와 [Trees Still Win](#/p/trees-still-win)이 공정한 재비교를 다시 하게 만든 배경이다.',

legacy:[
 '**정형 데이터 딥러닝 계열의 기준점** — [FT-Transformer](#/p/ft-transformer)가 TabNet을 포함한 여러 표 데이터 딥러닝을 다시 공정하게 비교하는 출발점으로 삼음',
 '**instance-wise 해석 가능성 논의 확산** — 특징 중요도를 사후 설명 모델이 아니라 아키텍처 자체에서 뽑아내는 접근이 이후 표 데이터 신경망 설계의 한 축이 됨',
 '**GBDT와의 정면 비교 관행 고착** — 이후 표 데이터 신경망 논문은 거의 예외 없이 XGBoost/LightGBM/[CatBoost](#/p/catboost)를 베이스라인으로 명시하게 됨'
],

pitfalls:[
 '**"TabNet이 표 데이터에서 GBDT를 이겼다"를 일반화하면 안 된다.** 이 논문의 벤치마크는 논문 저자가 선택한 데이터셋·하이퍼파라미터 탐색 조건에서의 결과이며, 이후 독립적 재현 연구들은 GBDT 쪽 튜닝을 강화하면 격차가 크게 줄거나 역전되는 경우를 다수 보고했다.',
 '**Sparsemax 희소성이 "해석 가능"과 "정확한 인과 설명"을 동일시하게 만들기 쉽다.** 마스크가 0인 특징을 안 쓴다는 것은 사실이지만, 마스크가 큰 특징이 예측에 실제로 얼마나 인과적으로 기여했는지는 별개의 질문이다.',
 '**모델 크기별 비교표(Table 4, 5)를 볼 때 크기를 맞춰 봐야 한다.** TabNet-S/M/L처럼 저자들도 크기별로 나눠 비교하는데, 다른 논문을 인용할 때 크기가 다른 모델끼리 수치만 떼어와 비교하면 오해가 생긴다.'
],

figures:[
 {f:'fig1-sequential-selection.png',
  cap:'위쪽 표가 입력 특징 한 행(Adult 소득 예측). 아래 노란 박스 안에서 첫 "Feature selection"은 직업 관련 열(occupation 등)에, 두 번째 "Feature selection"은 투자 관련 열(capital.gain/loss)에 화살표가 몰려 있다 — 같은 모델이 결정 단계마다 다른 특징 부분집합을 골라 쓰는 것을 보여준다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'TabNet uses sequential attention to choose which features to reason from at each decision step, enabling interpretability and more efficient learning as the learning capacity is used for the most salient features.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1908.07442 — TabNet: Attentive Interpretable Tabular Learning', u:'https://arxiv.org/abs/1908.07442'},
 {t:'TabNet 공식 구현 (Google Research)', u:'https://github.com/google-research/google-research/tree/master/tabnet'}
]
});
