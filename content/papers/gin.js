WIKI.paper({
slug:'gin',
venue:'ICLR 2019',
authors:'Xu, Hu, Leskovec, Jegelka (MIT · Stanford University)',
arxiv:'1810.00826',

tldr:'"그래프 신경망이 대체 얼마나 강력한가"라는 질문에 답한다. [GCN](#/p/gcn)의 mean, [GraphSAGE](#/p/graphsage)의 max-pooling 집계가 구별하지 못하는 그래프 쌍이 존재함을 증명하고, **sum 집계**를 쓰면 메시지 패싱 GNN이 도달 가능한 표현력의 상한인 **Weisfeiler-Lehman(WL) 테스트**와 동등해짐을 보였다.',

context:'[GCN](#/p/gcn)·[GraphSAGE](#/p/graphsage)·[GAT](#/p/gat)·[MPNN](#/p/mpnn)까지, 이웃 특징을 모아 노드를 갱신하는 GNN들이 쏟아져 나왔지만 "이 모델들이 서로 다른 그래프 구조를 어디까지 구별할 수 있는가"는 실증적 벤치마크 성능으로만 어렴풋이 짐작될 뿐 이론적으로 규명되지 않았다. 한편 그래프 이론에는 두 그래프가 동형(isomorphic)인지 판정하는 오래된 휴리스틱인 **Weisfeiler-Lehman(WL) 테스트**가 있다 — 각 노드의 라벨을 이웃 라벨들의 다중집합(multiset)으로 반복 갱신하고 해시하는 절차로, 다항시간에 동작하며 실전 대부분의 그래프를 구별해낸다. GNN의 이웃 집계도 본질적으로 "이웃 특징을 모아 노드 표현을 갱신"하는 같은 모양이다. 질문은 — **GNN이 WL 테스트만큼 강력해질 수 있는가, 그리고 그러려면 집계 함수가 어떤 조건을 만족해야 하는가?**',

ideas:[
 {h:'GNN은 최대 WL 테스트만큼만 강력하다',
  lead:'어떤 메시지 패싱 GNN도 WL 테스트가 구별하지 못하는 두 그래프를 구별할 수 없다.',
  d:'WL 테스트가 같다고 판정하는 두 그래프는, 이웃 라벨의 다중집합을 반복 해싱하는 것과 본질적으로 같은 절차를 따르는 어떤 GNN에게도 구별 불가능하다(Lemma 2). 즉 WL 테스트는 메시지 패싱 기반 GNN 전체의 **표현력 상한**이다 — 이 상한을 이 논문에서 처음으로 엄밀히 증명했다.'},
 {h:'집계·readout이 단사(injective)면 그 상한에 도달한다',
  lead:'이웃 다중집합을 서로 다른 표현으로 단사적으로 매핑하는 집계 함수를 쓰면 GNN이 WL과 동등해진다.',
  d:'역으로, 이웃 집계 함수 $f$ 와 그래프 수준 readout이 모두 단사 함수이면(즉 서로 다른 다중집합을 항상 서로 다른 표현으로 보내면), 그렇게 만든 GNN은 WL 테스트가 구별하는 모든 그래프 쌍을 구별할 수 있다(Theorem 3). 문제는 "다중집합에 대한 단사 함수를 신경망으로 어떻게 만드는가"로 좁혀진다.'},
 {h:'sum은 단사, mean·max는 단사가 아니다',
  lead:'다중집합을 구별하는 데 필요한 정보는 원소의 **개수(multiplicity)** 인데, mean·max는 이를 지워버린다.',
  d:'노드 $a$ 만 있는 이웃 2개짜리 다중집합 $\\{a,a\\}$ 와 3개짜리 $\\{a,a,a\\}$ 를 생각하면, sum은 $2f(a) \\neq 3f(a)$ 로 구별하지만 mean은 $f(a)=f(a)$ 로 동일하게 본다(Figure 3a). max는 한 걸음 더 나아가 다중집합을 **집합(set)**으로 뭉개버려 원소 개수 정보를 아예 잃는다(Figure 3b). 결국 mean은 "분포"를, max는 "존재 여부(스켈레톤)"만 포착하고, **sum만이 다중집합 전체를 보존**한다.'},
 {h:'GIN 갱신식: sum + MLP',
  lead:'단사 다중집합 함수를 만드는 충분조건으로, 자기 자신에 $(1+\\epsilon)$ 가중치를 주고 이웃과 합산한 뒤 MLP를 씌운다.',
  d:'보편근사정리(universal approximation theorem)에 기대어 $f,\\phi$ 를 MLP로 근사할 수 있다는 사실(Corollary 6)을 이용해, $h_v^{(k)} = \\text{MLP}^{(k)}\\big((1+\\epsilon^{(k)})\\cdot h_v^{(k-1)} + \\sum_{u\\in\\mathcal N(v)} h_u^{(k-1)}\\big)$ 로 노드를 갱신한다. $\\epsilon$ 은 학습 가능한 스칼라거나 고정값 0(**GIN-0**)으로 둘 수 있는데, 실험에서는 GIN-0이 오히려 일반화가 살짝 더 좋았다.'}
],

diagram:{type:'compare', cap:'같은 이웃 다중집합을 세 집계 함수가 서로 다른 정보로 압축한다 — 잃는 정보가 다르면 표현력도 다르다.',
 left:{t:'mean · max (기존)', items:['mean: 원소 비율만 보존','max: 존재 여부만 보존(집합화)','개수 다른 다중집합을 혼동']},
 right:{t:'sum (GIN)', items:['다중집합 전체를 보존','개수 차이를 그대로 반영','WL 테스트와 동등한 표현력']}
},

math:[
 {expr:'h_v^{(k)} = MLP^{(k)}( (1+ε^{(k)})·h_v^{(k-1)} + Σ_{u∈N(v)} h_u^{(k-1)} )',
  tex:'h_v^{(k)} = \\text{MLP}^{(k)}\\!\\left((1+\\epsilon^{(k)})\\cdot h_v^{(k-1)} + \\sum_{u \\in \\mathcal N(v)} h_u^{(k-1)}\\right)',
  d:'GIN의 노드 갱신식. 자기 자신을 이웃 합과 구별해 $(1+\\epsilon)$ 로 가중치를 주고, 합산 결과 전체를 MLP에 통과시킨다 — mean·max 대신 sum을 쓴 것이 GCN·GraphSAGE와의 유일하지만 결정적인 차이다.'},
 {expr:'h_G = CONCAT( READOUT({h_v^{(k)} | v∈G}) | k=0,1,...,K )',
  tex:'h_G = \\text{CONCAT}\\Big(\\text{READOUT}\\big(\\{h_v^{(k)}\\mid v\\in G\\}\\big) \\;\\Big|\\; k=0,1,\\dots,K\\Big)',
  d:'그래프 수준 표현은 마지막 층뿐 아니라 **모든 층**의 노드 표현을 합산(readout)한 뒤 이어붙인다. WL 서브트리 커널이 모든 반복 단계의 라벨을 함께 쓰는 것과 같은 이유 — 얕은 반복은 지역 구조, 깊은 반복은 넓은 구조를 포착하므로 둘 다 필요하다.'}
],

numbers:[
 {k:'IMDB-BINARY 정확도', v:'75.1 ± 5.1%', d:'GIN-0(Sum-MLP), 9개 벤치마크 중 하나'},
 {k:'MUTAG 정확도', v:'89.4 ± 5.6%', d:'GIN-0, 소규모 분자 데이터셋'},
 {k:'REDDIT-BINARY 정확도', v:'92.4 ± 2.5%', d:'GIN-0, 소셜 네트워크 데이터셋'},
 {k:'벤치마크 수', v:'9개', d:'생물정보학 4개 + 소셜 네트워크 5개'},
 {k:'GIN-0 vs GIN-ε', v:'GIN-0이 일관되게 근소 우위', d:'둘 다 학습 데이터는 거의 완벽히 fit하지만 일반화는 GIN-0이 나음'},
 {k:'1층 퍼셉트론 실패', v:'이론적으로 증명', d:'MLP 대신 단일 선형+비선형을 쓰면 구별 못 하는 다중집합 쌍이 존재(Lemma 7)'}
],

impact:'GNN 연구를 "어떤 아키텍처가 벤치마크에서 더 잘 나오는가"라는 경험적 질문에서, **"이 아키텍처가 원리적으로 무엇을 구별할 수 있는가"**라는 이론적 질문으로 확장했다. sum 집계가 mean·max보다 표현력이 높다는 결과는 이후 GNN 설계에서 집계 함수 선택을 실험적 튜닝 대상이 아니라 이론적 근거가 있는 선택으로 만들었다. 동시에 WL 테스트라는 **상한**을 명시함으로써, 이후 연구가 "이 상한을 넘어서려면 무엇이 더 필요한가"(예: 구조적 인코딩·고차 WL)라는 질문으로 나아가는 기준점을 제공했다.',

legacy:[
 '**표현력 상한을 넘어서려는 시도들** — WL 테스트로도 구별 못 하는 그래프(예: 정규 그래프)를 다루기 위해 subgraph counting·고차 WL(k-WL) 기반 GNN 연구가 이어짐',
 '**구조 정보를 attention에 직접 주입** — [Graphormer](#/p/graphormer)가 메시지 패싱의 한계를 우회해, 중심성·최단경로 같은 구조 정보를 Transformer의 attention bias로 넣는 방향으로 발전',
 '**집계 함수 선택의 이론적 근거화** — 이후 GNN 논문들이 새 집계 함수를 제안할 때 "단사성(injectivity)"을 검증하는 것이 관행이 됨',
 '**깊이와 표현력의 분리** — WL 테스트와의 동등성은 층수 $K$ 가 곧 반경 $K$ 이웃까지의 정보 접근을 뜻함을 명확히 해, over-smoothing 논의와 표현력 논의를 구분해서 다루게 함'
],

pitfalls:[
 '**WL 테스트와 동등 = 만능이 아니다.** 정규 그래프(regular graph)처럼 WL 테스트 자체가 구별하지 못하는 그래프 쌍은 GIN도 구별하지 못한다. "가장 강력한 메시지 패싱 GNN"이지, "가장 강력한 그래프 판별기"가 아니다.',
 '**sum이 항상 실전에서 더 좋은 것은 아니다.** 표현력 상한이 높다는 것과 특정 데이터셋에서 일반화가 잘 되는 것은 별개다. 노드 특징의 스케일이 크게 다른 경우 sum은 mean보다 학습이 불안정할 수 있다.',
 '**MLP가 필수다.** 1층 선형변환+비선형만으로는(Lemma 7) 단사성이 보장되지 않는다. "sum만 쓰면 된다"고 단순화하면 이 논문이 증명한 조건을 놓친다 — sum과 MLP(다층)가 함께 있어야 한다.'
],

figures:[
 {f:'fig1-wl-subtree.png',
  cap:'왼쪽 원본 그래프에서 파란 노드를 뿌리로 WL 테스트를 2번 반복하면 가운데의 rooted subtree(이웃 구조를 나무 모양으로 펼친 것)를 얻는다. 오른쪽은 GNN의 이웃 집계가 이 다중집합(같은 색이 여러 번 등장 가능)을 그대로 보존해야 WL 테스트를 재현할 수 있음을 보여준다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig3-fail-cases.png',
  cap:'각 쌍에서 두 그래프의 중심 노드 $v, v\\prime$ 는 구조가 다른데도 mean·max 집계로는 같은 임베딩을 받는다. (a)(c)는 mean·max 둘 다 실패, (b)는 이웃 안에 서로 다른 색이 섞이면서 max만 실패하는 경우 — 원소 개수 정보가 사라지기 때문이다.',
  src:'원문 Figure 3, p.6'}
],

quotes:[
 {t:'We develop a simple architecture, Graph Isomorphism Network (GIN), and show that its discriminative/representational power is equal to the power of the WL test.',
  src:'Section 1, p.2'}
],

links:[
 {t:'arXiv 1810.00826 — How Powerful are Graph Neural Networks?', u:'https://arxiv.org/abs/1810.00826'},
 {t:'공식 구현 (GitHub, weihua916/powerful-gnns)', u:'https://github.com/weihua916/powerful-gnns'}
]
});
