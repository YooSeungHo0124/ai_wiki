WIKI.paper({
slug:'gcn',
venue:'ICLR 2017',
authors:'Kipf, Welling (University of Amsterdam)',
arxiv:'1609.02907',

tldr:'스펙트럴 그래프 합성곱을 **1차(K=1) 근사**까지 단순화하면, 층마다 이웃 특징을 정규화된 인접행렬로 한 번 평균 내는 갱신식 하나로 줄어든다는 것을 보였다. 이후 거의 모든 그래프 신경망의 출발점이 된 식이다.',

context:'그래프 위 준지도(semi-supervised) 노드 분류의 전통적 방법은 라벨 전파처럼 $\\mathcal{L} = \\mathcal{L}_0 + \\lambda \\mathcal{L}_{reg}$ 형태로 그래프 Laplacian 정규화 항을 손실에 직접 추가해, "연결된 두 노드는 같은 라벨을 가질 것"이라는 가정을 명시적으로 강제했다. 문제는 이 가정이 너무 강하다는 것이다 — 간선이 항상 유사성을 뜻하지 않을 수 있다. 한편 [DeepWalk](#/p/deepwalk)류의 스펙트럴/워크 기반 방법은 그래프 구조는 쓰지만 노드 특징(feature)을 함께 쓰지 못했다. 동시에 그래프 신호처리 쪽에서는 그래프 Fourier 변환으로 합성곱을 정의하는 스펙트럴 그래프 합성곱 이론이 발전했지만, 고유분해(eigendecomposition)가 $O(N^2)$ 로 비싸 실제 큰 그래프에 쓰기 어려웠다. 질문은 — **정규화 항도, 비싼 고유분해도 없이 노드 특징과 그래프 구조를 동시에 신경망에 넣을 수 없을까?**',

ideas:[
 {h:'스펙트럴 합성곱을 Chebyshev 다항식으로 근사',
  lead:'그래프 Fourier 필터 $g_\\theta$ 를 $K$차 Chebyshev 다항식으로 전개해 고유분해를 피한다.',
  d:'그래프 신호 $x$ 에 대한 스펙트럴 필터는 $g_\\theta \\star x = U g_\\theta U^\\top x$ 로, $U$ 는 정규화 Laplacian $L$ 의 고유벡터 행렬이다. $U$ 계산이 $O(N^2)$ 라 큰 그래프에 못 쓴다. Hammond et al.의 결과를 빌려 $g_\\theta(\\Lambda)$ 를 $K$차 Chebyshev 다항식으로 근사하면, 필터가 중심 노드에서 최대 $K$홉 이웃에만 의존하는 **$K$-국소적** 형태가 되고 계산량도 $O(|E|)$ 로 줄어든다.'},
 {h:'K=1로 자르면 층별 선형 모델이 된다',
  lead:'Chebyshev 전개를 1차(K=1)에서 끊고 $\\lambda_{max}\\approx 2$ 로 근사하면 파라미터가 단 하나로 줄어든다.',
  d:'K=1로 제한하면 필터가 $\\theta_0\\prime x + \\theta_1\\prime (L-I_N)x$ 형태가 된다. 여기에 파라미터를 $\\theta=\\theta_0\\prime=-\\theta_1\\prime$ 하나로 묶으면 $g_\\theta \\star x \\approx \\theta(I_N + D^{-1/2}AD^{-1/2})x$ 가 된다. 표현력은 여러 층을 쌓아 회복하고, 대신 층마다는 아주 싸고 안정적인 선형 연산 하나만 남긴다는 것이 핵심 통찰이다.'},
 {h:'재정규화(renormalization) 트릭: self-loop을 더한다',
  lead:'$I_N + D^{-1/2}AD^{-1/2}$ 의 고유값이 [0,2] 라 반복 적용 시 발산·소실하므로 자기 자신을 이웃에 포함시킨다.',
  d:'$I_N + D^{-1/2}AD^{-1/2}$ 을 층마다 반복 곱하면 고유값이 [0,2] 범위라 그래디언트가 exploding/vanishing할 수 있다. 저자들은 $\\tilde{A}=A+I_N$(자기 자신에게 self-loop 추가)와 $\\tilde{D}_{ii}=\\sum_j \\tilde{A}_{ij}$ 로 다시 정규화한 $\\tilde{D}^{-1/2}\\tilde{A}\\tilde{D}^{-1/2}$ 를 쓴다. 이 한 번의 재정규화가 없으면 깊은 GCN은 학습이 불안정하다.'},
 {h:'최종 층별 전파 규칙',
  lead:'$H^{(l+1)}=\\sigma(\\tilde D^{-1/2}\\tilde A \\tilde D^{-1/2}H^{(l)}W^{(l)})$ — 이웃 평균 후 선형변환 후 비선형.',
  d:'각 층은 (1) 정규화된 인접행렬로 이웃(자기 자신 포함) 특징을 가중 평균하고, (2) 학습 가능한 가중치 $W^{(l)}$ 로 선형 변환한 뒤, (3) ReLU 같은 비선형을 씌운다. 그래프 구조 $\\tilde A$ 는 전체 층에서 공유되고, 층마다 갱신되는 것은 노드 표현 $H^{(l)}$ 뿐이다.'}
],

diagram:{type:'stack', cap:'2층 GCN. 입력 특징 X에서 시작해 이웃 평균 → 선형변환 → 비선형을 두 번 반복한다.',
 layers:[
  {t:'입력 특징 X', s:'N × C'},
  {t:'정규화 인접행렬 Â', s:'D̃⁻¹ᐟ²ÃD̃⁻¹ᐟ²', note:'전 층 공유'},
  {t:'ÂXW⁽⁰⁾', s:'N × H', acc:true, note:'이웃 평균 + 선형'},
  {t:'ReLU', s:'비선형'},
  {t:'ÂH⁽¹⁾W⁽¹⁾', s:'N × F'},
  {t:'softmax', s:'노드별 클래스 확률'}
 ]},

math:[
 {expr:'H^{(l+1)} = σ( D̃^{-1/2} Ã D̃^{-1/2} H^{(l)} W^{(l)} )',
  tex:'H^{(l+1)}=\\sigma\\!\\left(\\tilde D^{-\\frac12}\\tilde A \\tilde D^{-\\frac12} H^{(l)} W^{(l)}\\right)',
  d:'$\\tilde A = A + I_N$ 은 self-loop을 더한 인접행렬, $\\tilde D_{ii}=\\sum_j \\tilde A_{ij}$ 는 그 차수 행렬. $H^{(0)}=X$ 이고 $\\sigma$ 는 ReLU 등의 비선형. 이 논문 전체가 사실상 이 한 줄로 요약된다.'},
 {expr:'Z = f(X,A) = softmax( Â · ReLU(ÂXW^{(0)}) · W^{(1)} )',
  tex:'Z=f(X,A)=\\text{softmax}\\!\\Big(\\hat A\\,\\text{ReLU}\\big(\\hat A X W^{(0)}\\big)W^{(1)}\\Big)',
  d:'논문이 실험에 쓴 2층 GCN의 forward pass 전체. $\\hat A=\\tilde D^{-1/2}\\tilde A \\tilde D^{-1/2}$ 는 전처리 단계에서 한 번만 계산해 두는 정규화 인접행렬이다.'},
 {expr:'L = −Σ_{l∈Y_L} Σ_f Y_lf ln Z_lf',
  tex:'\\mathcal{L}=-\\sum_{l\\in \\mathcal{Y}_L}\\sum_{f=1}^{F} Y_{lf}\\ln Z_{lf}',
  d:'라벨이 있는 노드 집합 $\\mathcal{Y}_L$ 에 대해서만 cross-entropy를 계산한다. 라벨 없는 노드는 손실에 직접 기여하지 않지만, 그래프 합성곱을 통해 라벨 있는 노드의 그래디언트가 전파되어 학습에 관여한다.'}
],

numbers:[
 {k:'Cora 정확도', v:'81.5%', d:'Planetoid* 75.7% 대비 우위, 학습 4초'},
 {k:'Citeseer 정확도', v:'70.3%', d:'DeepWalk 43.2% 대비 큰 격차'},
 {k:'Pubmed 정확도', v:'79.0%', d:'ICA 73.9%, LP 63.0% 등 베이스라인 상회'},
 {k:'NELL 정확도', v:'66.0%', d:'Planetoid* 61.9% 대비 우위, 학습 48초'},
 {k:'복잡도', v:'O(|E|CHF)', d:'간선 수에 선형 — 희소행렬 곱으로 구현'},
 {k:'실험 구조', v:'2층, hidden=16, dropout 0.5', d:'Cora에서 튜닝한 하이퍼파라미터를 Citeseer·Pubmed에도 그대로 사용'}
],

impact:'그래프 신경망을 "그래프 신호처리 이론의 근사"라는 복잡한 유도에서, **"이웃을 평균 내고 선형변환하고 비선형을 씌우는" 한 줄짜리 층**으로 만들었다. 이 단순함 덕분에 구현이 몇 줄이면 충분해졌고, TensorFlow·PyTorch 기반 GNN 라이브러리들의 사실상 기본 연산자가 되었다. 노드 특징과 그래프 구조를 하나의 end-to-end 미분 가능 모델에 넣어 함께 학습한다는 이 논문의 프레임 자체가, 이후 [GraphSAGE](#/p/graphsage)·[GAT](#/p/gat)·[MPNN](#/p/mpnn) 등 "이웃 집계 함수를 어떻게 바꿀까"라는 질문으로 이어지는 GNN 연구 전체의 공통 틀이 되었다.',

legacy:[
 '**메시지 패싱으로의 통합** — [MPNN](#/p/mpnn)이 GCN을 포함한 여러 이웃 집계 모델을 하나의 메시지 패싱 프레임워크로 재정리',
 '**샘플링 기반 확장** — 학습 시 전체 그래프를 메모리에 올려야 하는 이 논문의 한계를, [GraphSAGE](#/p/graphsage)가 이웃 샘플링으로 풀며 대규모·inductive 학습을 가능하게 함',
 '**집계에 attention 도입** — 모든 이웃을 $\\tilde D^{-1/2}\\tilde A \\tilde D^{-1/2}$ 로 고정 가중치 평균하던 것을, [GAT](#/p/gat)가 학습된 attention 가중치로 대체',
 '**표현력 한계 규명** — [GIN](#/p/gin)이 평균 집계가 Weisfeiler-Lehman 테스트보다 약하다는 것을 증명하며 sum 집계를 제안'
],

pitfalls:[
 '**Over-smoothing.** 층을 깊게 쌓을수록 $\\tilde D^{-1/2}\\tilde A \\tilde D^{-1/2}$ 를 반복 곱하는 것이 그래프 위 저역통과 필터처럼 작동해, 노드 표현이 서로 구별되지 않는 하나의 값으로 수렴해 버린다. 그래서 실전 GCN은 대개 2~3층을 넘지 않는다 — "깊게 쌓을수록 좋아진다"는 CNN의 직관이 그대로 옮겨오지 않는다.',
 '**전체 그래프를 한 번에 메모리에 올려야 한다.** 이 논문의 학습은 full-batch gradient descent를 가정하므로, 노드 수가 수백만을 넘는 그래프에는 그대로 쓰기 어렵다. 이것이 [GraphSAGE](#/p/graphsage)가 등장한 직접적인 이유다.',
 '**Transductive 설정이다.** 학습 그래프에 없던 새 노드가 추가되면 $\\hat A$ 를 다시 계산하고 재학습해야 한다 — inductive하게 새 노드에 즉시 적용할 수 없다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'입력층(C개 채널의 노드 특징 $X_1..X_4$)에서 은닉층을 거쳐 출력층($Z_1..Z_4$)까지, 검은 선(그래프 구조)은 모든 층에서 동일하게 재사용된다. 화살표는 학습되는 가중치 $W$ 를 통한 정보 흐름이고, 출력의 $Z_i$ 가 점선으로 라벨 $Y_i$ 와 비교된다.',
  src:'원문 Figure 1(a), p.4'},
 {f:'fig1-tsne.png',
  cap:'Cora 데이터셋에 라벨 5%만 써서 학습한 2층 GCN의 은닉층 활성값을 t-SNE로 2차원 투영한 결과. 색은 실제 문서 클래스인데, 그래프 구조와 특징만으로 클래스가 뚜렷이 뭉쳐 분리된 것을 볼 수 있다.',
  src:'원문 Figure 1(b), p.4'}
],

quotes:[
 {t:'We present a scalable approach for semi-supervised learning on graph-structured data that is based on an efficient variant of convolutional neural networks which operate directly on graphs.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1609.02907 — Semi-Supervised Classification with Graph Convolutional Networks', u:'https://arxiv.org/abs/1609.02907'},
 {t:'공식 구현 (GitHub, tkipf/gcn)', u:'https://github.com/tkipf/gcn'}
]
});
