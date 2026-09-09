WIKI.paper({
slug:'deepfm',
venue:'IJCAI 2017',
authors:'Guo, Tang, Ye, Li, He (Harbin Institute of Technology · Huawei Noah\'s Ark Lab)',
arxiv:'1703.04247',

tldr:'[Wide & Deep](#/p/wide-deep)의 wide 부분에 여전히 남아있던 **수작업 교차곱 특징 공학**을 팩토라이제이션 머신(FM)으로 대체했다. wide(FM)와 deep이 같은 임베딩을 공유해, 원본 특징만으로 저차·고차 교차를 동시에 end-to-end 학습한다.',

context:'[Wide & Deep](#/p/wide-deep)은 암기(wide)와 일반화(deep)를 한 모델로 합쳐 성공했지만, wide 부분은 여전히 `AND(user_installed_app=netflix, impression_app=pandora)` 같은 교차곱 특징을 사람이 설계해야 했다. "기저귀와 맥주" 같은 연관 규칙은 데이터에서 저절로 드러나지, 전문가가 미리 다 나열할 수 있는 게 아니다. 한편 FM(factorization machine)은 특징마다 잠재벡터를 두고 내적으로 2차 교차를 자동 학습하지만, 이론상 고차 교차도 표현할 수 있음에도 실무에서는 계산 복잡도 때문에 보통 2차까지만 쓴다. FNN·PNN 같은 선행 딥러닝 CTR 모델들은 고차 교차는 잘 잡지만 저차 교차 학습이 약하다는 편향이 있었다. 이 논문은 "저차든 고차든 사람 손을 타지 않고 한 모델이 동시에 배우게 하자"는 질문에서 출발한다.',

ideas:[
 {h:'FM 성분과 Deep 성분이 입력과 임베딩을 공유',
  lead:'같은 임베딩 벡터를 FM(2차 교차)과 DNN(고차 교차) 양쪽에 동시에 먹인다.',
  d:'[Wide & Deep](#/p/wide-deep)은 wide와 deep에 서로 다른 입력(전자는 수작업 교차곱, 후자는 원본 특징)을 줬다. DeepFM은 특징 $i$ 마다 1차 중요도를 나타내는 스칼라 $w_i$ 와 상호작용을 나타내는 잠재벡터 $V_i$ 를 두고, **같은 $V_i$** 를 FM 성분과 DNN 성분 양쪽에 그대로 넣는다. 입력도 원본 희소 특징 하나뿐이라 별도의 특징 공학이 필요 없다.'},
 {h:'FM 성분: 특징 쌍의 내적으로 2차 교차를 학습',
  lead:'모든 특징 쌍의 잠재벡터 내적을 더해 저차 상호작용을 표현한다.',
  d:'$y_{FM}=\\langle w,x\\rangle+\\sum_{j_1<j_2}\\langle V_{j_1},V_{j_2}\\rangle x_{j_1}x_{j_2}$ 로, 1차항(단순 가중합)과 2차항(모든 특징쌍의 내적)을 더한다. 두 특징이 같은 데이터에 동시에 나타난 적이 없어도 각자의 잠재벡터만 있으면 상호작용을 추정할 수 있어, 희소 데이터에서 특히 유리하다.'},
 {h:'Deep 성분: 같은 임베딩 위에 쌓은 표준 MLP',
  lead:'필드별 임베딩을 이어붙여 ReLU 은닉층을 통과시켜 고차 교차를 학습한다.',
  d:'각 필드(성별·지역 등)의 희소 원-핫 벡터를 임베딩 $e_i$ 로 압축하고, $a^{(0)}=[e_1,\\dots,e_m]$ 을 시작으로 $a^{(l+1)}=\\sigma(W^{(l)}a^{(l)}+b^{(l)})$ 을 반복해 깊은 비선형 상호작용을 학습한다. FNN처럼 FM을 사전학습해 초기화로만 쓰는 대신, 이 논문은 FM을 아예 전체 아키텍처의 일부로 넣어 **사전학습 없이 처음부터 함께** 학습한다.'},
 {h:'두 성분의 출력을 더해 시그모이드 하나로',
  lead:'ŷ = sigmoid(FM 출력 + DNN 출력)로 최종 CTR을 예측한다.',
  d:'$\\hat y=\\text{sigmoid}(y_{FM}+y_{DNN})$ 형태로 두 출력을 단순히 더한 뒤 하나의 시그모이드를 통과시킨다. FM과 DNN이 별도로 학습되는 것이 아니라, $w_i$·$V_i$·DNN의 모든 가중치가 **하나의 손실**로 함께 역전파된다는 점이 FNN·PNN 같은 순차적 파이프라인과 다르다.'}
],

diagram:{type:'compare', cap:'Wide&Deep과 달리 DeepFM은 wide 자리에 FM을 놓고, wide·deep이 서로 다른 입력이 아니라 같은 임베딩을 공유한다.',
 left:{t:'Wide & Deep', items:['wide: 수작업 교차곱 특징 필요','deep: 별도 임베딩 학습','두 입력이 서로 다름']},
 right:{t:'DeepFM', items:['FM이 wide 자리를 대체(자동 2차 교차)','FM·DNN이 같은 임베딩 Vi 공유','특징 공학 없이 원본 특징만 입력']}},

math:[
 {expr:'ŷ = sigmoid(yFM + yDNN)',
  tex:'\\hat y=\\text{sigmoid}(y_{FM}+y_{DNN})',
  d:'FM 성분과 Deep 성분의 출력을 더해 최종 CTR 확률을 만든다. 두 성분은 같은 임베딩을 공유하며 함께 학습된다.'},
 {expr:'yFM = <w,x> + Σ <Vi,Vj> xj1·xj2',
  tex:'y_{FM}=\\langle w,x\\rangle+\\sum_{j_1=1}^{d}\\sum_{j_2=j_1+1}^{d}\\langle V_{j_1},V_{j_2}\\rangle\\,x_{j_1}x_{j_2}',
  d:'1차항(전체 특징의 가중합)과 2차항(모든 특징쌍의 잠재벡터 내적)의 합. FM 원 논문(Rendle, 2010)의 정의를 그대로 가져왔다.'},
 {expr:'a^(l+1) = σ(W^(l) a^(l) + b^(l)),  a^(0) = [e1,...,em]',
  tex:'a^{(0)}=[e_1,e_2,\\dots,e_m],\\qquad a^{(l+1)}=\\sigma\\!\\left(W^{(l)}a^{(l)}+b^{(l)}\\right)',
  d:'필드별 임베딩을 이어붙인 것을 입력으로 하는 DNN의 순전파. $m$ 은 필드 수, $|H|$ 개 은닉층을 통과한 뒤 시그모이드로 $y_{DNN}$ 을 낸다.'}
],

numbers:[
 {k:'Company* 데이터셋', v:'약 10억 건 · 7일 학습/1일 테스트', d:'실제 상용 앱스토어 클릭 로그(익명화)'},
 {k:'Criteo 데이터셋', v:'4,500만 사용자 클릭 기록', d:'연속 특징 13개 · 범주형 특징 26개, 90/10 분할'},
 {k:'AUC (Company* / Criteo)', v:'DeepFM 0.8715 / 0.8007', d:'LR·FM·FNN·PNN·Wide&Deep 변형 9개 모델 중 최고'},
 {k:'2위 대비 개선폭', v:'AUC +0.37%(Company*) · +0.25%(Criteo)', d:'저차+고차를 동시에 학습하는 것의 순수 효과'},
 {k:'임베딩 공유 효과', v:'FM&DNN 대비 AUC +0.33~0.48%p', d:'같은 임베딩을 안 쓰고 따로 학습한 변형보다 우수'},
 {k:'FM 잠재차원 k', v:'10', d:'실험에서 고정한 값, 임베딩 크기는 필드 전체에서 동일'}
],

impact:'DeepFM은 "wide 부분에 무엇을 넣을까"라는 질문에 FM이라는 답을 내놓으면서, 이후 CTR 예측 연구가 **특징 공학 없이 end-to-end로 저차+고차 교차를 함께 학습**하는 방향으로 굳어지는 데 기여했다. 임베딩을 wide/deep이 공유하게 만든 설계는 파라미터 효율성과 학습 속도(논문 Figure 6에서 CPU/GPU 모두 최상급 효율)를 동시에 달성해, 산업 CTR 시스템에서 널리 채택되는 베이스라인이 됐다.',

legacy:[
 '**어텐션의 도입** — [DIN](#/p/din)은 DeepFM류의 임베딩+MLP 구조에 만족하지 않고, 사용자 행동 이력 중 지금 후보와 관련된 것에만 가중치를 주는 attention을 더했다',
 '**임베딩 공유 패턴의 표준화** — wide/deep(또는 FM/DNN)이 같은 임베딩을 공유한다는 설계는 이후 xDeepFM·AutoInt 등 특징 교차 연구 전반의 기본 전제가 됐다',
 '**"교차 자동화" 계열의 정착** — 사람이 특징을 교차시키던 [Wide & Deep](#/p/wide-deep) 이전 방식에서, 이 논문 이후로는 "교차를 어떤 연산자로 자동화할까"(내적·attention·outer product 등)가 CTR 연구의 표준 질문이 됐다'
],

pitfalls:[
 '**오프라인 AUC의 작은 차이가 사소해 보여도 무시하면 안 된다.** 논문 스스로 인용하듯 Wide&Deep은 오프라인 AUC를 0.275%p만 올렸지만 온라인 CTR은 3.9% 뛰었다 — 하루 거래액이 수백만 달러인 서비스에서는 이 정도 차이도 막대한 매출 차이로 이어진다는 점을, DeepFM의 0.37%p 개선을 볼 때도 같은 잣대로 해석해야 한다.',
 '**FM의 2차 교차만으로는 한계가 있고, DNN의 고차 교차도 무한정 깊다고 좋아지지 않는다.** 논문의 하이퍼파라미터 실험(뉴런 수·은닉층 수)에서 특정 지점을 넘으면 성능이 오히려 정체되거나 나빠졌다 — 무작정 크게 만드는 것이 능사가 아니다.',
 '**모든 특징을 동일한 임베딩 차원 k로 압축하는 것이 항상 최적은 아니다.** 필드마다 카디널리티(가능한 값의 수)가 크게 다른데도 같은 차원을 쓰면, 희소한 필드는 과소표현되고 조밀한 필드는 과대표현될 수 있다 — 이 논문은 이 문제를 다루지 않는다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'맨 아래 Sparse Features에서 각 필드(Field i, j, ..., m)가 파란 점선(Embedding)을 타고 Dense Embeddings로 압축된다. 이 같은 임베딩이 왼쪽 FM Layer(덧셈+내적, 빨간 Weight-1 연결)와 오른쪽 Hidden Layer(검은 Normal Connection)로 동시에 흘러가, 맨 위 Output Units에서 하나로 합쳐지는 구조가 이 논문의 핵심이다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig6-efficiency.png',
  cap:'y축은 로지스틱 회귀(LR) 학습 시간 대비 배수. CPU(왼쪽)에서 IPNN·PNN*이 30배 넘게 걸리는 반면 DeepFM(오른쪽 막대)은 2.00배로 FNN·LR&DNN·FM&DNN과 비슷한 수준을 유지한다 — 정확도 1등이면서 속도는 최하위권이 아니라는 것이 이 그래프의 요지다.',
  src:'원문 Figure 6, p.5'}
],

quotes:[
 {t:'DeepFM has a shared input to its "wide" and "deep" parts, with no need of feature engineering besides raw features.',
  src:'Abstract, p.1'},
 {t:'DeepFM consists of two components, FM component and deep component, that share the same input... All parameters... are trained jointly for the combined prediction model.',
  src:'2.1 DeepFM, p.2'}
],

links:[
 {t:'arXiv 1703.04247 — DeepFM: A Factorization-Machine based Neural Network for CTR Prediction', u:'https://arxiv.org/abs/1703.04247'}
]
});
