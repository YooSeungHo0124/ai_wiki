WIKI.paper({
slug:'graphsage',
venue:'NeurIPS 2017',
authors:'Hamilton, Ying, Leskovec (Stanford University)',
arxiv:'1706.02216',

tldr:'[GCN](#/p/gcn)은 고정된 그래프 전체를 한 번에 학습해야 하는(transductive) 한계가 있었다. GraphSAGE는 **이웃을 고정 개수만큼 샘플링해 집계 함수를 학습**함으로써, 학습 때 보지 못한 새 노드에도 즉시 적용되는(inductive) 임베딩을 만든다.',

context:'[GCN](#/p/gcn)을 비롯해 그때까지의 그래프 임베딩 방법 대부분은 **transductive**했다 — 정점마다 고유한 임베딩 벡터를 직접 최적화하거나, 고정된 인접행렬 $\\hat A$ 를 전제로 학습했다. 그래프에 새 정점이 추가되면(예: 새로 올라온 Reddit 게시물, 새로 출판된 논문) 임베딩을 얻으려고 전체를 다시 학습해야 했다. 실서비스 그래프는 계속 자라는데, 이 재학습 비용은 감당하기 어렵다. 질문은 — **정점 하나하나의 임베딩을 외우는 대신, "이웃 정보를 임베딩으로 바꾸는 함수" 자체를 학습해서 한 번도 못 본 정점에도 바로 적용할 수 없을까?**',

ideas:[
 {h:'정점 임베딩 대신 집계 함수를 학습한다',
  lead:'정점마다 벡터를 외우지 않고, 이웃 특징을 입력받아 임베딩을 만드는 함수 $K$개를 학습한다.',
  d:'각 깊이(홉) $k$ 마다 하나씩 학습 가능한 집계 함수 $\\text{AGGREGATE}_k$ 를 둔다. 정점의 임베딩은 그 정점의 특징이 아니라, "이웃 특징을 어떻게 합칠지"에 대한 **규칙**으로 정의된다. 이 규칙은 그래프의 모든 정점이 공유하므로, 학습 후 한 번도 보지 못한 새 정점이 나타나도 그 정점의 이웃 특징만 있으면 같은 함수로 즉시 임베딩을 만들 수 있다 — inductive.'},
 {h:'고정 크기 이웃 샘플링',
  lead:'모든 이웃 대신 매 반복마다 균등 샘플로 뽑은 $S$개만 사용해 계산량을 통제한다.',
  d:'차수가 큰 정점은 이웃이 수천 개일 수 있어 전체 이웃을 다 쓰면 배치 크기가 통제 불능이 된다. GraphSAGE는 매 반복(iteration)마다 이웃 집합 $\\mathcal N(v)$ 에서 균등 무작위로 고정 개수 $S$ 개만 샘플링한다. $K{=}2$, $S_1\\cdot S_2 \\le 500$ 정도로도 높은 성능이 나온다는 것이 실험적으로 확인됐다.'},
 {h:'K홉 반복 집계 = 이웃의 이웃까지 정보 전파',
  lead:'깊이 $k{=}1..K$ 를 반복하며, 자기 이전 표현과 이웃 집계를 concat한 뒤 비선형 변환한다.',
  d:'$h^0_v \\leftarrow x_v$ 로 시작해, 각 깊이 $k$ 에서 $h^k_{\\mathcal N(v)} \\leftarrow \\text{AGGREGATE}_k(\\{h^{k-1}_u, u\\in\\mathcal N(v)\\})$ 로 이웃을 모으고, $h^k_v \\leftarrow \\sigma(W^k \\cdot \\text{CONCAT}(h^{k-1}_v, h^k_{\\mathcal N(v)}))$ 로 자기 자신의 이전 표현과 합쳐 갱신한다. $K$ 번 반복하면 $K$홉 이웃 정보가 누적된 임베딩 $z_v = h^K_v$ 를 얻는다.'},
 {h:'집계 함수 후보: mean · LSTM · pooling',
  lead:'순서 없는 이웃 집합을 다루려면 집계 함수가 대칭(순서 불변)이어야 한다.',
  d:'평균(mean, GCN 전파식과 거의 동일하지만 concat을 유지), 이웃을 임의 순서로 LSTM에 통과시키는 LSTM 집계(순서에 원래 민감하지만 무작위 순서로 학습해 근사적 대칭성 확보), 각 이웃을 fully-connected층에 통과시킨 뒤 원소별 max-pooling하는 pooling 집계를 비교한다. 실험에서는 LSTM·pooling이 mean·GCN식보다 평균 7.4% 더 나았다.'},
 {h:'비지도 손실도, 지도 손실도 가능',
  lead:'그래프 근접성 기반 negative sampling 손실로 라벨 없이도 학습할 수 있다.',
  d:'라벨이 없을 때는 word2vec류의 목적함수를 그래프에 옮겨, 짧은 무작위 걷기로 가까운 정점 쌍의 임베딩 내적은 크게, 멀리서 뽑은(negative sampling) 정점 쌍은 작게 만드는 손실을 쓴다. 라벨이 있으면 이 비지도 손실을 그냥 지도 손실(예: cross-entropy)로 바꿔치기하면 된다 — 프레임 자체는 동일하다.'}
],

diagram:{type:'flow', cap:'대상 정점 하나에 대해: 이웃 샘플링 → 이웃 특징 집계 → concat·변환을 K번 반복해 임베딩을 얻는다.',
 nodes:[
  {t:'그래프 + 특징', s:'미확인 정점 포함'},
  {t:'이웃 샘플링', s:'고정 크기 S', note:'매 반복 새로 샘플'},
  {t:'AGGREGATE', s:'mean/LSTM/pool', acc:true, note:'학습되는 함수'},
  {t:'concat + 변환', s:'σ(W·[h,agg])'},
  {t:'K회 반복', s:'K=2 흔함'},
  {t:'임베딩 z_v', s:'새 정점도 즉시 계산'}
 ]},

math:[
 {expr:'h^k_{N(v)} ← AGGREGATE_k({ h^{k-1}_u, ∀u ∈ N(v) })',
  tex:'h^{k}_{\\mathcal N(v)} \\leftarrow \\text{AGGREGATE}_k\\big(\\{h_u^{k-1},\\, \\forall u \\in \\mathcal N(v)\\}\\big)',
  d:'깊이 $k$ 에서 정점 $v$ 의 샘플링된 이웃 $\\mathcal N(v)$ 의 이전 층 표현들을 하나의 벡터로 합친다.'},
 {expr:'h^k_v ← σ( W^k · CONCAT(h^{k-1}_v, h^k_{N(v)}) ),  then L2 normalize',
  tex:'h_v^{k} \\leftarrow \\sigma\\!\\Big(W^{k}\\cdot \\text{CONCAT}\\big(h_v^{k-1},\\,h_{\\mathcal N(v)}^{k}\\big)\\Big),\\quad h_v^k \\leftarrow \\frac{h_v^k}{\\lVert h_v^k \\rVert_2}',
  d:'자기 자신의 이전 표현과 이웃 집계를 이어붙여 선형변환·비선형을 적용하고, 마지막에 L2 정규화한다. $K$번 반복 후 $z_v \\equiv h_v^K$ 가 최종 임베딩이다.'},
 {expr:'J(z_u) = −log σ(z_uᵀz_v) − Q·E_{v_n~P_n(v)}[log σ(−z_uᵀz_{v_n})]',
  tex:'J_{\\mathcal G}(z_u) = -\\log\\sigma(z_u^\\top z_v) - Q\\cdot \\mathbb{E}_{v_n \\sim P_n(v)}\\big[\\log\\sigma(-z_u^\\top z_{v_n})\\big]',
  d:'무작위 걷기로 함께 등장한 정점 $v$ 는 내적을 크게, negative sampling 분포 $P_n$ 에서 뽑은 $Q$개의 정점은 내적을 작게 만드는 비지도 손실. [word2vec](#/p/word2vec)의 negative sampling 목적함수와 같은 형태다.'}
],

numbers:[
 {k:'지도학습 F1 개선', v:'평균 +51%', d:'특징만 쓰는 베이스라인 대비, 세 데이터셋 평균'},
 {k:'집계기 개선폭', v:'평균 +7.4%', d:'제안한 LSTM/pool 집계가 GCN식 집계 대비'},
 {k:'Citation Sup. F1', v:'0.839 (pool)', d:'DeepWalk+특징 0.701 대비'},
 {k:'Reddit Sup. F1', v:'0.954 (LSTM)', d:'DeepWalk+특징 0.691 대비, 미확인 노드에 적용'},
 {k:'PPI Sup. F1', v:'0.612 (LSTM)', d:'전혀 다른 그래프(unseen graph)에 대한 일반화'},
 {k:'기본 설정', v:'K=2, S₁·S₂≤500', d:'2홉, 이웃 샘플 크기 곱이 500 이하로도 충분'}
],

impact:'그래프 표현학습의 기본 가정을 **"정점마다 벡터를 학습"에서 "이웃을 임베딩으로 바꾸는 규칙을 학습"으로 바꿨다.** 이 전환 덕분에 그래프가 계속 커지고 바뀌는 실서비스(추천 시스템·소셜 그래프)에 GNN을 처음으로 실용적인 규모로 적용할 수 있게 됐다. 대표적으로 Pinterest의 PinSAGE가 이 프레임을 수십억 노드 규모로 확장해 프로덕션에 배치했다. 또한 이웃 샘플링이라는 아이디어는 이후 대규모 그래프 학습에서 "전체 그래프를 GPU 메모리에 올릴 필요가 없다"는 표준 전제를 만들었다.',

legacy:[
 '**산업 규모 적용** — PinSAGE(Pinterest)가 이 샘플링·집계 프레임을 30억+ 노드 그래프로 확장해 실서비스 추천에 사용',
 '**메시지 패싱 관점으로 재정리** — [MPNN](#/p/mpnn)이 GraphSAGE의 집계·갱신 절차를 message-update 프레임의 한 인스턴스로 통합',
 '**집계 가중치의 학습** — 이웃마다 균등하거나 고정된 가중치를 주는 대신, [GAT](#/p/gat)가 attention으로 이웃별 가중치 자체를 학습하도록 발전',
 '**표현력의 한계 규명** — [GIN](#/p/gin)이 mean/max/pooling류 집계가 구별하지 못하는 그래프 쌍이 있음을 증명하며 sum 집계의 필요성을 이론적으로 제시'
],

pitfalls:[
 '**샘플링은 분산(variance)을 늘린다.** 매 반복 다른 이웃 부분집합을 쓰므로 같은 정점이라도 forward pass마다 임베딩이 조금씩 달라질 수 있다 — 안정성과 계산량 사이의 트레이드오프다.',
 '**깊이 $K$ 가 커지면 샘플링 이웃 수가 지수적으로 폭발한다.** $S_1 \\cdot S_2 \\cdots S_K$ 로 늘어나므로 실전에서는 $K{=}2$ 를 넘기기 어렵고, 이는 [GCN](#/p/gcn)과 마찬가지로 깊은 GNN을 쌓기 어렵게 만드는 요인 중 하나다(over-smoothing과는 별개의 계산량 문제).',
 '**Inductive라고 해서 완전히 새로운 그래프에 항상 잘 옮겨가지는 않는다.** PPI 실험처럼 학습에 쓴 그래프들과 특징 분포가 비슷한 새 그래프에는 잘 일반화되지만, 구조가 크게 다른 그래프에서는 성능이 떨어질 수 있다.'
],

figures:[
 {f:'fig1-sample-aggregate.png',
  cap:'왼쪽(1)에서 대상 정점(빨강)을 중심으로 $k{=}1, k{=}2$ 이웃을 샘플링하고, 가운데(2)에서 바깥쪽 이웃(초록)부터 안쪽으로 학습된 aggregator를 반복 적용해 정보를 모으고, 오른쪽(3)에서 최종 임베딩으로 그래프 맥락이나 라벨을 예측한다. 점선 원이 홉 깊이, 화살표 방향이 정보가 흐르는 방향(바깥→중심)이다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We present GraphSAGE, a general inductive framework that leverages node feature information to efficiently generate node embeddings for previously unseen data.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1706.02216 — Inductive Representation Learning on Large Graphs', u:'https://arxiv.org/abs/1706.02216'},
 {t:'GraphSAGE 프로젝트 페이지 (Stanford SNAP)', u:'http://snap.stanford.edu/graphsage/'}
]
});
