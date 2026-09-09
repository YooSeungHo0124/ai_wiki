WIKI.paper({
slug:'gat',
venue:'ICLR 2018',
authors:'Veličković, Cucurull, Casanova, Romero, Liò, Bengio (Cambridge · CVC-UAB · Montréal)',
arxiv:'1710.10903',

tldr:'[GCN](#/p/gcn)이 이웃마다 차수로 정해지는 **고정 가중치**로 평균을 냈다면, GAT는 [Bahdanau attention](#/p/bahdanau)처럼 이웃마다 **학습된 attention 가중치**를 매겨 중요한 이웃에 더 집중한다. 전체 그래프 구조를 몰라도 되어 transductive·inductive 양쪽에 그대로 쓸 수 있다.',

context:'[GCN](#/p/gcn)의 전파 규칙 $\\tilde D^{-1/2}\\tilde A \\tilde D^{-1/2}$ 은 이웃 $j$ 의 가중치를 차수 $\\sqrt{d_i d_j}$ 로만 정한다 — 그 이웃이 실제로 얼마나 유용한 정보를 주는지는 전혀 보지 않는 구조적으로 고정된 가중치다. 게다가 GCN은 학습 전에 전체 그래프의 정규화 인접행렬 $\\hat A$ 를 미리 계산해야 해서, [GraphSAGE](#/p/graphsage)가 지적한 것과 같은 이유로 새 그래프·새 정점에 유연하게 적용하기 어렵다. 마침 같은 시기 NLP에서는 [Transformer](#/p/transformer)의 self-attention이 "어떤 위치가 어떤 위치를 참조할지"를 데이터로부터 학습하는 것이 효과적임을 보이고 있었다. 질문은 — **이웃의 중요도도 고정하지 말고 attention으로 학습하면 어떨까?**',

ideas:[
 {h:'정점 쌍마다 attention 계수를 계산한다',
  lead:'선형변환한 두 정점 특징을 이어붙여 단일 층 신경망에 통과시켜 raw attention score를 얻는다.',
  d:'모든 정점에 공유 가중치 $W$ 를 곱해 특징을 변환한 뒤, 이웃 $j$ 에 대한 raw score를 $e_{ij}=\\text{LeakyReLU}(\\vec a^\\top[W\\vec h_i \\| W\\vec h_j])$ 로 계산한다. $\\vec a$ 는 학습되는 단일 attention 벡터로, 모든 간선에서 공유된다 — 정점 개수·차수에 무관하게 파라미터 수가 고정된다.'},
 {h:'masked attention: 실제 이웃에만 정규화한다',
  lead:'softmax를 그래프 전체가 아니라 각 정점의 실제 이웃 $\\mathcal N_i$ 로만 제한해 그래프 구조를 반영한다.',
  d:'$\\alpha_{ij} = \\text{softmax}_j(e_{ij}) = \\exp(e_{ij}) / \\sum_{k\\in\\mathcal N_i}\\exp(e_{ik})$ 로, 정규화 대상을 정점 $i$ 의 그래프상 실제 이웃(자기 자신 포함)으로만 제한한다. 이 마스킹이 self-attention을 "그래프 구조를 아는 attention"으로 만드는 유일한 장치다 — 나머지는 표준 attention과 동일하다.'},
 {h:'multi-head attention으로 학습을 안정화한다',
  lead:'$K$개의 독립 attention을 병렬로 돌려 concat(중간층)·평균(출력층)한다.',
  d:'[Transformer](#/p/transformer)와 마찬가지로 attention을 하나만 쓰면 학습이 불안정할 수 있어, $K$개의 독립적인 attention head를 병렬로 계산한다. 중간층에서는 $\\vec h_i\\prime = \\|_{k=1}^K \\sigma(\\sum_{j} \\alpha_{ij}^k W^k \\vec h_j)$ 로 concat하고, 최종 예측층에서는 concat 대신 평균을 내 차원이 $K$배로 불어나지 않게 한다.'},
 {h:'그래프 구조를 미리 몰라도 된다 → inductive',
  lead:'전체 인접행렬의 고유분해·정규화가 필요 없고, 이웃 집합만 있으면 즉시 attention을 계산한다.',
  d:'GCN류 스펙트럴 방법은 그래프 전체의 라플라시안에 의존해 본질적으로 transductive하다. GAT의 attention 계수는 오직 국소적인 (정점, 이웃) 쌍의 특징만으로 계산되므로, 학습 때 못 본 정점·심지어 통째로 새로운 그래프에도 같은 파라미터를 그대로 적용할 수 있다 — PPI 실험이 이를 직접 검증한다.'}
],

diagram:{type:'compare', cap:'GCN의 차수 기반 고정 가중치 대 GAT의 학습된 attention 가중치.',
 left:{t:'GCN 집계', items:['가중치 = 1/√(d_i·d_j)','전체 그래프 정규화 필요','transductive에 강함']},
 right:{t:'GAT 집계', items:['가중치 = 학습된 attention','국소 계산만으로 충분','inductive에도 바로 적용']}
},

math:[
 {expr:'e_ij = LeakyReLU( a^T [W h_i ‖ W h_j] )',
  tex:'e_{ij} = \\text{LeakyReLU}\\big(\\vec a^{\\top}[W\\vec h_i \\,\\Vert\\, W\\vec h_j]\\big)',
  d:'정점 $i$ 가 이웃 $j$ 를 얼마나 중요하게 볼지의 정규화 전 점수. $W\\in\\mathbb R^{F\\prime\\times F}$ 는 공유 선형변환, $\\vec a \\in \\mathbb R^{2F\\prime}$ 는 학습되는 attention 벡터.'},
 {expr:'α_ij = softmax_j(e_ij) = exp(e_ij) / Σ_{k∈N_i} exp(e_ik)',
  tex:'\\alpha_{ij} = \\text{softmax}_j(e_{ij}) = \\frac{\\exp(e_{ij})}{\\sum_{k\\in \\mathcal N_i}\\exp(e_{ik})}',
  d:'정점 $i$ 의 실제 이웃 $\\mathcal N_i$ (보통 자기 자신 포함) 안에서만 정규화한다 — 이 마스킹이 그래프 구조를 반영하는 지점이다.'},
 {expr:'h_i\' = ‖_{k=1}^{K} σ( Σ_{j∈N_i} α_ij^k W^k h_j )',
  tex:'\\vec h_i\\prime = \\big\\Vert_{k=1}^{K} \\sigma\\!\\Big(\\sum_{j\\in \\mathcal N_i} \\alpha_{ij}^{k} W^{k} \\vec h_j\\Big)',
  d:'$K$개의 독립 attention head 결과를 이어붙여(중간층) 다음 층의 입력으로 쓴다. 최종 예측층에서는 concat 대신 $\\frac1K\\sum_k$ 로 평균한다.'}
],

numbers:[
 {k:'Cora 정확도', v:'83.0 ± 0.7%', d:'GCN 81.5%, GCN-64* 81.4% 대비 우위'},
 {k:'Citeseer 정확도', v:'72.5 ± 0.7%', d:'GCN 70.3% 대비 +2.2%p'},
 {k:'Pubmed 정확도', v:'79.0 ± 0.3%', d:'GCN과 동률, MoNet과 유사'},
 {k:'PPI micro-F1', v:'0.973 ± 0.002', d:'GraphSAGE 최고 0.768 대비 큰 격차, inductive 설정'},
 {k:'상수 attention(Const-GAT) PPI', v:'0.934', d:'같은 구조에서 attention을 균등 가중치로 고정한 ablation — 학습된 attention의 순수 기여도를 보여줌'},
 {k:'기본 구성', v:'8개 head, head당 8차원', d:'Cora/Citeseer 두 층 GAT'}
],

impact:'그래프 신경망의 이웃 집계 방식을 **"그래프 구조로 정해지는 고정 가중치"에서 "데이터로부터 학습하는 attention 가중치"로** 옮겼다. Const-GAT(균등 가중치) vs GAT(학습된 attention) 비교 실험이 이 차이가 실제로 성능에 기여함을 직접 보여준다. 계산이 정점별·간선별로 국소적이고 병렬화 가능해 GCN의 전역 고유분해 의존을 없앴고, 이 덕분에 transductive·inductive 벤치마크 양쪽에서 동시에 SOTA를 달성한 최초의 GNN 계열 중 하나가 되었다. attention이 그래프 신경망의 표준 부품으로 자리잡는 계기가 되었다.',

legacy:[
 '**Transformer와의 수렴** — attention 기반 이웃 집계라는 아이디어가 이후 [Graphormer](#/p/graphormer)에서 그래프 전체를 Transformer로 다루는 방향으로 확장됨',
 '**표현력 상한 규명** — [GIN](#/p/gin)이 attention 기반 가중합 역시 sum 집계가 아니면 특정 그래프 구조를 구별하지 못함을 보이며 GAT의 표현력 한계를 이론적으로 정리',
 '**scaled attention·GATv2 등 후속 변형** — 원 논문의 attention이 사실상 정적(static)이라는 지적이 이어지며, 더 표현력 높은 attention 스코어 함수를 쓰는 개선 연구가 이어짐',
 '**대규모 그래프 라이브러리의 표준 층으로 채택** — PyTorch Geometric·DGL 등 주요 GNN 라이브러리가 GATConv를 기본 레이어로 제공하며 GCN과 함께 사실상의 표준 베이스라인이 됨'
],

pitfalls:[
 '**degree가 매우 큰 정점에서 attention이 거의 균등해질 수 있다.** softmax가 이웃 수가 많을수록 뾰족한 분포를 만들기 어려워, 실제로는 GCN과 큰 차이가 없어지는 경우가 보고된다 — "attention이 항상 GCN보다 낫다"는 보장은 없다.',
 '**여전히 over-smoothing에서 자유롭지 않다.** attention 가중치가 학습되더라도 층을 깊게 쌓으면 [GCN](#/p/gcn)과 유사하게 노드 표현이 수렴해 균질해지는 경향이 나타난다.',
 '**multi-head는 계산·메모리 비용을 head 수만큼 늘린다.** 표현력 향상과 학습 안정성을 얻는 대신, 큰 그래프에서는 head 수·은닉 차원 선택이 곧바로 메모리 병목으로 이어진다.'
],

figures:[
 {f:'fig1-attention-mech.png',
  cap:'선형변환된 두 정점 특징 $W\\vec h_i, W\\vec h_j$ 를 이어붙여(concat) attention 벡터 $\\vec a$ 와 내적한 뒤 비선형(꺾인 화살표가 LeakyReLU)과 softmax를 거쳐 최종 계수 $\\alpha_{ij}$ 를 얻는다.',
  src:'원문 Figure 1(왼쪽), p.4'},
 {f:'fig1-multihead.png',
  cap:'정점 1이 이웃 2~6을 볼 때, 색이 다른 세 개의 화살표 세트(초록·파랑·보라)가 $K{=}3$개의 독립 attention head다. 각 head가 서로 다른 $\\alpha_{1j}^k$ 를 매기고, 오른쪽에서 그 결과들을 concat 또는 평균해 최종 $\\vec h_1\\prime$ 을 만든다.',
  src:'원문 Figure 1(오른쪽), p.4'}
],

quotes:[
 {t:'We present graph attention networks (GATs), novel neural network architectures that operate on graph-structured data, leveraging masked self-attentional layers to address the shortcomings of prior methods based on graph convolutions or their approximations.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1710.10903 — Graph Attention Networks', u:'https://arxiv.org/abs/1710.10903'},
 {t:'공식 구현 (GitHub, PetarV-/GAT)', u:'https://github.com/PetarV-/GAT'}
]
});
