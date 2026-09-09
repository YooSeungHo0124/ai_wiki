WIKI.paper({
slug:'graphormer',
venue:'NeurIPS 2021',
authors:'Ying, Cai, Luo, Zheng, Ke, He, Shen, Liu (Microsoft Research · Peking University · UCLA)',
arxiv:'2106.05234',

tldr:'[GAT](#/p/gat)까지의 GNN은 이웃에만 attention을 쓰는 국소 메시지 패싱이었다. Graphormer는 그래프를 통째로 [Transformer](#/p/transformer)에 넣되, 중심성·최단경로 같은 구조 정보를 attention의 **편향(bias) 항**으로 주입해 [GIN](#/p/gin)이 증명한 메시지 패싱 GNN의 표현력 상한(1-WL 테스트)을 넘어선다.',

context:'[Transformer](#/p/transformer)는 순서 있는 시퀀스에서 임의의 두 토큰을 한 번에 잇는 attention으로 NLP·비전을 평정했지만, 그래프에 그대로 옮기면 문제가 생긴다 — **정점에는 고유한 순서가 없고**, 단순 self-attention은 정점 사이의 그래프 구조(누가 누구와 연결됐는지, 얼마나 가까운지, 그 정점이 그래프에서 얼마나 중요한지)를 전혀 알지 못한다. 한편 [GCN](#/p/gcn)부터 [GAT](#/p/gat)까지 이어진 메시지 패싱 GNN 계열은 구조를 잘 쓰지만, [GIN](#/p/gin)이 증명했듯 표현력이 원리적으로 **1-WL 테스트**를 넘지 못하는 상한에 갇혀 있었다. 질문은 — **Transformer의 전역 attention과 GNN의 구조 인식을 동시에 가지려면, 그래프 구조를 어떻게 attention 안에 집어넣어야 하는가?**',

ideas:[
 {h:'중심성 인코딩: 노드 중요도를 입력에 더한다',
  lead:'각 노드의 in/out-degree를 학습 가능한 벡터로 바꿔 입력 특징에 더한다.',
  d:'Transformer의 attention은 두 토큰의 의미적 유사도만 본다. 그런데 소셜 네트워크의 유명인처럼 **연결이 많은 노드가 원래 더 중요한 정보**일 수 있다. Graphormer는 $h_i^{(0)} = x_i + z^-_{\\deg^-(v_i)} + z^+_{\\deg^+(v_i)}$ 로 차수(degree)를 학습 가능한 임베딩으로 바꿔 입력에 더한다. 이렇게 하면 attention의 query·key 자체에 이미 "이 노드가 얼마나 중심적인가" 정보가 실린다.'},
 {h:'공간 인코딩: 최단경로 거리를 attention 편향으로',
  lead:'두 정점의 최단경로 길이 $\\phi(v_i,v_j)$ 마다 학습되는 스칼라를 attention 점수에 더한다.',
  d:'시퀀스의 위치 인코딩과 달리 그래프 정점은 다차원 공간에 흩어져 있어 "거리"를 하나로 정의하기 어렵다. Graphormer는 최단경로 거리(SPD) $\\phi(v_i,v_j)$ 마다 학습 가능한 스칼라 $b_{\\phi(v_i,v_j)}$ 를 attention 점수 $A_{ij}=\\frac{(h_iW_Q)(h_jW_K)^\\top}{\\sqrt d} + b_{\\phi(v_i,v_j)}$ 에 더한다. 모든 정점 쌍에 전역적으로 attention을 주면서도, $b$ 가 거리에 따라 감소하는 함수로 학습되면 결과적으로 가까운 이웃에 더 주의를 기울이는 국소성도 함께 얻는다.'},
 {h:'간선 인코딩: 최단경로 위의 간선 특징을 평균해 편향에 더한다',
  lead:'$v_i, v_j$ 사이 최단경로 위 간선 특징들의 평균을 또 하나의 편향 항 $c_{ij}$ 로 추가한다.',
  d:'기존 방법들은 간선 특징을 이웃 메시지에 곱하거나 노드 특징에 더하는 식으로만 썼다. Graphormer는 $v_i \\to v_j$ 최단경로 $(e_1,\\dots,e_N)$ 위의 각 간선 특징을 학습 가능한 가중치와 내적한 뒤 평균해 $c_{ij}=\\frac1N\\sum_n x_{e_n}(w_n^E)^\\top$ 로 만들고, 이를 attention 점수에 또 더한다.'},
 {h:'가상 노드([VNode]) = self-attention의 특수한 경우',
  lead:'전체 그래프에 연결된 가상 노드 트릭이 실은 self-attention의 한 형태임을 보인다.',
  d:'GNN 커뮤니티에서 널리 쓰이던 "모든 노드에 연결된 가상 노드를 추가해 그래프 전체 정보를 모은다"는 휴리스틱을, Graphormer는 [VNode]와 다른 노드 사이의 공간 인코딩만 별도의 학습 가능한 값으로 리셋하면 자기 attention 메커니즘 안에서 자연히 재현됨을 보인다 — 두 아이디어가 사실 같은 것의 다른 이름이었다는 것.'},
 {h:'GCN·GIN이 Graphormer의 특수 사례임을 증명',
  lead:'공간 인코딩과 다중 head·FFN을 조합하면 mean/sum 집계 기반 메시지 패싱을 재현할 수 있다.',
  d:'공간 인코딩이 이웃 집합 $\\mathcal N(v_i)$ 를 구별 가능하게 하면 softmax attention이 이웃에 대한 평균을 계산할 수 있고, 노드 차수를 알면 평균을 합으로 바꿀 수 있으며, multi-head·FFN으로 $v_i$ 자신과 이웃 집계를 따로 처리한 뒤 나중에 합칠 수 있다는 것이 증명의 골자다. 즉 [GCN](#/p/gcn)·[GIN](#/p/gin) 같은 메시지 패싱 GNN은 Graphormer가 표현할 수 있는 함수 공간의 특수 사례이고, 나아가 1-WL 테스트로는 구별 못 하는 그래프 쌍도 Graphormer는 구별할 수 있음을 예시로 보인다.'}
],

diagram:{type:'stack', cap:'입력에 중심성 인코딩을 더하고, attention 점수에 공간·간선 인코딩을 편향으로 더하는 Graphormer 층.',
 layers:[
  {t:'중심성 인코딩', s:'입력에 차수 임베딩 가산'},
  {t:'Q,K,V 선형변환', s:'표준 self-attention'},
  {t:'구조 편향 가산', s:'공간+간선 인코딩', acc:true, note:'모든 정점 쌍에 전역 attention'},
  {t:'softmax 가중합', s:'표준 attention 출력'},
  {t:'FFN + residual', s:'Transformer 블록과 동일'}
 ]},

math:[
 {expr:'h_i^{(0)} = x_i + z⁻_{deg⁻(v_i)} + z⁺_{deg⁺(v_i)}',
  tex:'h_i^{(0)} = x_i + z^{-}_{\\deg^{-}(v_i)} + z^{+}_{\\deg^{+}(v_i)}',
  d:'중심성 인코딩. 노드 특징 $x_i$ 에 in-degree·out-degree로 인덱싱되는 학습 가능한 임베딩 $z^-, z^+$ 를 더한다. 무방향 그래프에서는 하나의 $\\deg(v_i)$ 로 통합된다.'},
 {expr:'A_ij = (h_i W_Q)(h_j W_K)ᵀ / √d + b_{φ(v_i,v_j)} + c_ij',
  tex:'A_{ij} = \\frac{(h_iW_Q)(h_jW_K)^{\\top}}{\\sqrt d} + b_{\\phi(v_i,v_j)} + c_{ij}',
  d:'공간 인코딩 $b_{\\phi(v_i,v_j)}$(최단경로 거리로 인덱싱되는 학습 스칼라, 전 층 공유)과 간선 인코딩 $c_{ij}$(최단경로 위 간선 특징 평균)를 표준 attention 점수에 더한다. 최단경로가 없으면 $\\phi=-1$ 같은 특수값을 쓴다.'}
],

numbers:[
 {k:'PCQM4M-LSC validate MAE', v:'0.1234', d:'이전 최고(GIN-VN) 0.1395 대비 −11.5%'},
 {k:'OGB Large-Scale Challenge', v:'그래프 부문 1위', d:'ExpC와 앙상블해 test MAE 0.1200'},
 {k:'파라미터 수', v:'47.1M (Graphormer)', d:'경량판 GraphormerSMALL은 12.5M'},
 {k:'GT-Wide 대비', v:'Graphormer 우위', d:'파라미터를 83.2M로 키운 기존 Graph Transformer보다도 적은 파라미터로 앞섬'},
 {k:'벤치마크', v:'ZINC · ogbg-molhiv · ogbg-molpcba', d:'PCQM4M-LSC 사전학습 후 파인튜닝으로도 SOTA급 성능'}
],

impact:'그래프 표현학습의 무게중심을 **"이웃만 보는 메시지 패싱"에서 "전역 attention + 구조를 편향으로 주입"으로** 옮겼다. GCN·GIN을 자기 프레임의 특수 사례로 흡수하면서 동시에 1-WL 테스트라는 메시지 패싱 GNN의 표현력 상한을 실제로 넘어설 수 있음을 보여, "그래프에도 Transformer가 통한다"는 것을 대규모 벤치마크(OGB-LSC)에서 실증했다. 이후 그래프 학습 연구의 상당 부분이 그래프 고유의 귀납편향(구조)을 Transformer의 attention에 어떻게 자연스럽게 주입할지를 다루는 방향으로 이동했다.',

legacy:[
 '**Graph Transformer 계열의 사실상 표준 출발점** — 이후 다수의 그래프 트랜스포머 연구가 Graphormer의 편향 주입 방식을 기본 설계로 채택',
 '**표현력 상한의 실질적 우회** — [GIN](#/p/gin)이 증명한 1-WL 상한을 메시지 패싱을 벗어나는 것으로 실제로 넘어선 사례가 되어, "GNN의 한계는 아키텍처를 바꾸면 극복 가능하다"는 것을 실증',
 '**대규모 그래프에서의 확장성 문제 노출** — 전역 attention은 정점 수에 대해 $O(n^2)$ 라, 이후 연구는 대규모 그래프에 맞는 희소·근사 attention 변형을 탐색',
 '**분자·소재 스크리닝으로 확산** — [MPNN](#/p/mpnn) 계열이 주도하던 분자 물성 예측 벤치마크에 Graph Transformer 계열이 경쟁 구도로 진입'
],

pitfalls:[
 '**전역 attention은 $O(n^2)$ 이다.** 시퀀스 Transformer와 같은 이유로, 정점 수가 수만 개를 넘는 그래프에는 그대로 적용하기 어렵다 — 분자처럼 작은 그래프(QM9·PCQM4M급)에서 강점이 두드러진 이유이기도 하다.',
 '**최단경로 거리 계산 자체가 비용이다.** 공간 인코딩을 쓰려면 모든 정점 쌍의 최단경로를 미리 계산해야 하고, 이는 큰 그래프에서 그래프 반지름에 따라 전처리 비용이 커진다.',
 '**"GNN보다 항상 낫다"가 아니다.** 구조가 매우 희소하거나 지역성이 강한 그래프에서는 국소 메시지 패싱 GNN이 여전히 효율적이고 경쟁력 있는 선택일 수 있다 — Graphormer의 이득은 특히 전역적 상호작용이 중요한 분자 성질 예측류 과제에서 두드러진다.'
],

figures:[
 {f:'fig1-encodings.png',
  cap:'왼쪽은 표준 Transformer의 Q·K·V·attention 계산 흐름이고, 가운데 위 "Spatial Encoding" 행렬(파란 격자)이 정점 쌍 $v_1..v_5$ 사이 최단경로 거리로 매긴 attention 편향, 아래 "Edge Encoding" 행렬(색깔 격자)이 그 경로 위 간선 특징 편향이다. 아래쪽 "Centrality Encoding"은 노드 특징에 더해지는 차수 임베딩이고, 오른쪽 그래프 그림에서 정점 크기·색이 그 중심성을 나타낸다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'We show that the great capacity of the Graphormer and the ways we exploit the structural information of graphs allow it to substantially outperform previous state-of-the-art GNN variants.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2106.05234 — Do Transformers Really Perform Bad for Graph Representation?', u:'https://arxiv.org/abs/2106.05234'},
 {t:'공식 구현 (GitHub, microsoft/Graphormer)', u:'https://github.com/microsoft/Graphormer'}
]
});
