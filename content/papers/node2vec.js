WIKI.paper({
slug:'node2vec',
venue:'KDD 2016',
authors:'Grover, Leskovec (Stanford University)',
arxiv:'1607.00653',

tldr:'[DeepWalk](#/p/deepwalk)의 균등 무작위 걷기를 **편향된 2차 무작위 걷기**로 바꿔, 하이퍼파라미터 두 개만으로 BFS 성향(커뮤니티 포착)과 DFS 성향(구조적 역할 포착) 사이를 조절 가능하게 만들었다.',

context:'[DeepWalk](#/p/deepwalk)는 그래프 정점에서 균등 무작위 걷기로 "문장"을 만들고 SkipGram을 돌리는 레시피를 제시했지만, 걷기의 다음 정점을 항상 균등하게 고르는 탓에 **어떤 종류의 이웃 구조를 포착할지 선택할 수 없었다**. 네트워크에는 서로 다른 두 가지 유사성이 섞여 있다 — 같은 커뮤니티에 속한 정점끼리 비슷해지는 **동질성(homophily)**, 그리고 커뮤니티는 달라도 같은 역할(예: 허브)을 하면 비슷해지는 **구조적 동등성(structural equivalence)**이다. 순수 BFS는 후자를, 순수 DFS는 전자를 잘 잡지만 둘 다 극단적이고 계산 비용도 크다. 질문은 — **걷기 자체를 조절 가능한 하나의 알고리즘으로 두 극단 사이를 오갈 수 없을까?**',

ideas:[
 {h:'2차 무작위 걷기: 방금 온 곳을 기억한다',
  lead:'다음 정점을 고를 때 현재 정점뿐 아니라 직전 정점 $t$ 와의 거리도 함께 본다.',
  d:'DeepWalk의 걷기는 1차 마르코프(현재 정점만 본다)였다. node2vec은 간선 $(t,v)$ 를 지나 $v$ 에 도달했을 때, 다음 이동 $x$ 를 고를 확률을 직전 정점 $t$ 와 후보 $x$ 사이의 그래프 거리 $d_{tx}$ 로 조절한다. 이렇게 하면 걷기가 "어디서 왔는지"를 한 스텝만큼 기억하는 2차 마르코프 과정이 된다.'},
 {h:'Return 파라미터 p, In-out 파라미터 q',
  lead:'$p$ 는 되돌아갈 확률을, $q$ 는 안쪽(BFS)·바깥쪽(DFS) 탐색 성향을 조절한다.',
  d:'거리 $d_{tx}=0$(직전 정점으로 복귀)이면 가중치 $1/p$, $d_{tx}=1$(공통 이웃, 로컬)이면 $1$, $d_{tx}=2$(더 먼 곳)이면 $1/q$ 를 부여한다. $q>1$ 이면 걷기가 $t$ 근처에 머물러 BFS를 닮고, $q<1$ 이면 바깥으로 뻗어나가 DFS를 닮는다. $p,q$ 를 조절하는 것만으로 두 극단 사이의 임의의 지점을 고를 수 있다.'},
 {h:'무작위 걷기라서 여전히 값싸다',
  lead:'2차 마르코프인데도 이웃의 이웃 정보만 미리 저장해 두면 걷기 자체는 여전히 가볍다.',
  d:'순수 BFS/DFS로 이웃 구조를 직접 나열하면 정점당 비용이 크지만, node2vec은 각 정점의 이웃 간 연결 정보만 $O(a^2|V|)$ 로 미리 캐싱해 두면(a는 평균 차수) 이후 걷기 생성은 여전히 무작위 걷기 수준으로 싸다. 또한 길이 $l$ 인 걷기 하나로 $k$-크기 이웃 샘플을 $l-k$ 개 정점에 대해 재사용할 수 있어 샘플링 효율이 높다.'},
 {h:'정점 → 간선 임베딩: 이항 연산자',
  lead:'두 정점 임베딩을 Hadamard·평균 등으로 결합해 링크 예측용 간선 표현을 만든다.',
  d:'정점 임베딩만으로는 "이 두 정점 사이에 간선이 있는가"를 직접 풀 수 없다. node2vec은 정점 쌍 $(u,v)$ 의 임베딩 $f(u), f(v)$ 를 Hadamard 곱·평균·가중 L1/L2 같은 이항 연산자로 결합해 간선 표현 $g(u,v)$ 를 만들고, 이를 링크 존재 여부의 이진 분류 입력으로 쓴다.'}
],

diagram:{type:'compare', cap:'같은 2차 무작위 걷기가 파라미터 p, q에 따라 BFS 성향과 DFS 성향 사이를 오간다.',
 left:{t:'q > 1 (BFS 성향)', items:['시작점 근처에 머무름','허브·구조적 역할 포착','촘촘한 로컬 뷰']},
 right:{t:'q < 1 (DFS 성향)', items:['바깥으로 뻗어나감','같은 커뮤니티 포착','넓은 거시적 뷰']}
},

math:[
 {expr:'π_vx = α_pq(t,x) · w_vx,   α_pq(t,x) = 1/p if d_tx=0, 1 if d_tx=1, 1/q if d_tx=2',
  tex:'\\alpha_{pq}(t,x)=\\begin{cases}\\dfrac{1}{p} & d_{tx}=0\\\\[4pt] 1 & d_{tx}=1\\\\[4pt] \\dfrac{1}{q} & d_{tx}=2\\end{cases}',
  d:'직전 정점 $t$ 에서 $v$ 로 이동한 뒤, 다음 후보 $x$ 로의 비정규화 전이확률 $\\pi_{vx}$ 를 간선 가중치 $w_{vx}$ 에 탐색 편향 $\\alpha_{pq}$ 를 곱해 정한다. $d_{tx}$ 는 $t$ 와 $x$ 사이의 최단 거리(0·1·2 중 하나만 가능).'},
 {expr:'max_f  Σ_u log Pr(N_S(u) | f(u))',
  tex:'\\max_{f}\\;\\sum_{u \\in V} \\log \\Pr\\big(N_S(u)\\mid f(u)\\big)',
  d:'2차 걷기로 샘플링한 이웃 집합 $N_S(u)$ 의 co-occurrence 우도를 최대화하도록 임베딩 함수 $f$ 를 학습한다. [DeepWalk](#/p/deepwalk)와 목적함수 형태는 같고, $N_S(u)$ 를 만드는 샘플링 절차만 다르다.'}
],

numbers:[
 {k:'다중 라벨 분류 최대 향상', v:'+26.7%', d:'BlogCatalog, 라벨 70% 사용 시 최근접 베이스라인 대비'},
 {k:'링크 예측 최대 향상', v:'+12.6%', d:'arXiv 협업 네트워크에서 최고 성능 베이스라인 대비 AUC'},
 {k:'DeepWalk 대비 Macro-F1', v:'+22.3%', d:'p, q를 낮게 설정했을 때(BlogCatalog)'},
 {k:'기본 하이퍼파라미터', v:'d=128, 걷기 길이=80', d:'DeepWalk·LINE과 동일 조건으로 비교'},
 {k:'2차 걷기 공간복잡도', v:'O(a²|V|)', d:'a=평균 차수, 이웃 간 연결을 미리 캐싱하는 비용'}
],

impact:'"어떤 무작위 걷기가 좋은가"를 **설계자가 직접 고민할 문제가 아니라 학습 가능한 하이퍼파라미터 $p,q$ 로 환원**했다. 이후 그래프 임베딩 연구 상당수가 node2vec을 표준 베이스라인으로 채택했고, 동질성과 구조적 동등성을 하나의 틀에서 조절한다는 통찰은 이후 그래프 표현학습이 "어떤 이웃 정보를 어떻게 집계할까"라는 질문으로 수렴하는 데 영향을 주었다. 다만 이 계열 전체(DeepWalk·node2vec)는 정점 특징을 쓰지 않는 얕은(shallow) 임베딩이라, 곧이어 등장한 [GCN](#/p/gcn) 계열의 특징 기반 집계로 무게중심이 옮겨간다.',

legacy:[
 '**샘플링 전략은 여기서 정점을 찍고, GraphSAGE는 이웃 자체를 샘플링** — [GraphSAGE](#/p/graphsage)는 걷기 대신 이웃을 직접 샘플링해 특징을 집계하는 방향으로 갈라짐',
 '**PMI 행렬 분해와의 등가성** — node2vec·DeepWalk 모두 특정 조건에서 이웃 co-occurrence 통계 행렬의 암묵적 분해로 재해석되며 이론적으로 정리됨',
 '**하이퍼파라미터 탐색의 관행화** — $p,q$ 그리드서치가 그래프 임베딩 벤치마크의 표준 절차로 굳어짐',
 '**특징 없는 얕은 임베딩의 한계 노출** — 정점 attribute를 쓰지 않는 이 계열은 이후 [GCN](#/p/gcn)·[GAT](#/p/gat) 같은 특징 기반 GNN에 다중 라벨·링크 예측 벤치마크에서 자리를 내줌'
],

pitfalls:[
 '**$p,q$ 는 그래프마다 다시 튜닝해야 한다.** 논문 자체가 그리드서치로 최적값을 찾으며, 한 그래프에서 잘 맞는 값이 다른 그래프에 그대로 옮겨지지 않는다.',
 '**여전히 transductive다.** [DeepWalk](#/p/deepwalk)와 마찬가지로 학습 시점에 없던 새 정점을 다루려면 재학습이 필요하고, 정점 attribute도 쓰지 않는다.',
 '**2차 마르코프는 "직전 한 스텝"만 기억한다.** 더 긴 경로 의존성(예: 3홉 전 정점)은 여전히 포착하지 못하며, 이는 순수 무작위 걷기 기반 방법의 근본적 한계로 남는다.'
],

figures:[
 {f:'fig1-bfs-dfs.png',
  cap:'정점 $u$ 에서 출발할 때 BFS(빨강)는 바로 이웃 $s_1,s_2,s_3$ 로 퍼지고, DFS(파랑)는 $s_4 \\to s_5 \\to s_6$ 처럼 한 방향으로 깊이 들어간다. node2vec의 2차 걷기는 $p,q$ 값으로 이 두 화살표 패턴 사이를 조절한다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We propose node2vec, an efficient scalable algorithm for feature learning in networks that efficiently optimizes a novel network-aware, neighborhood preserving objective using SGD.',
  src:'Section 1, p.2'}
],

links:[
 {t:'arXiv 1607.00653 — node2vec: Scalable Feature Learning for Networks', u:'https://arxiv.org/abs/1607.00653'},
 {t:'node2vec 프로젝트 페이지 (SNAP, Stanford)', u:'http://snap.stanford.edu/node2vec/'}
]
});
