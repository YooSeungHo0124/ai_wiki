WIKI.paper({
slug:'pinsage',
venue:'KDD 2018',
authors:'Ying et al. (Pinterest · Stanford)',
arxiv:'1806.01973',

tldr:'그래프 신경망(GCN)을 노드 30억 개·엣지 180억 개짜리 실제 프로덕션 그래프에 처음으로 돌린 사례. 전체 그래프 라플라시안 대신 무작위 보행으로 이웃을 샘플링해, GCN을 학계 벤치마크가 아니라 웹 스케일 추천 시스템에서 실제로 작동하게 만들었다.',

context:'2018년까지 [GraphSAGE](#/p/graphsage) 등 GCN 계열은 노드 분류·추천 벤치마크에서 최고 성능을 냈지만, 전부 전체 그래프 라플라시안을 메모리에 올려 학습한다는 전제를 깔고 있었다. Pinterest 그래프는 핀(pin) 20억 개와 보드(board) 10억 개, 엣지 180억 개로 이 전제가 물리적으로 불가능한 규모다. node2vec·DeepWalk 같은 무작위 보행 기반 임베딩은 그래프 구조는 다루지만 노드의 시각·텍스트 특성(feature)을 반영하지 못하고, 파라미터 수가 노드 수에 비례해 늘어나 웹 스케일에 쓸 수 없다. 질문은 명확했다 — **GCN의 표현력과 무작위 보행의 확장성을 어떻게 한 알고리즘에 합칠 것인가?**',

ideas:[
 {h:'무작위 보행 기반 이웃 정의',
  lead:'전체 이웃 대신 노드에서 시작한 짧은 무작위 보행의 방문 빈도로 이웃 T개를 고른다.',
  d:'전통적 GCN은 그래프 라플라시안을 통째로 다뤄야 한다. PinSage는 각 노드에서 짧은 무작위 보행을 반복해, 방문 횟수가 가장 높은 상위 $T$개 노드만 "이웃"으로 취급한다. 이렇게 하면 이웃 크기가 고정돼 메모리 사용량을 통제할 수 있고, 학습마다 전체 그래프가 아니라 **동적으로 구성한 계산 그래프** 하나만 처리하면 된다.'},
 {h:'Importance pooling: 방문 빈도를 그대로 가중치로',
  lead:'무작위 보행 방문 횟수를 정규화해 이웃 집계의 가중치로 재사용한다.',
  d:'보행에서 얻은 방문 빈도는 이웃을 고르는 데만 쓰이지 않는다. 그 빈도를 L1 정규화한 값을 그대로 가중 평균(weighted-mean)의 가중치 $\\alpha$ 로 사용해, "더 자주 방문되는 이웃일수록 집계에서 더 중요하게" 반영한다. 이 한 가지 변경이 오프라인 지표에서 **46%** 성능 향상을 낸다 — 논문에서 가장 큰 단일 개선.'},
 {h:'Producer–consumer 미니배치 구성',
  lead:'CPU가 이웃 샘플링·특성 fetch를, GPU가 학습을 동시에 처리해 GPU를 놀리지 않는다.',
  d:'대용량 메모리를 쓰는 CPU 프로세스가 노드 이웃을 샘플링하고 시각·텍스트 특성을 미리 가져와 계산 그래프를 만들고, 별도의 GPU 프로세스는 그 계산 그래프를 받아 TensorFlow로 SGD만 수행한다. 두 단계를 파이프라인으로 겹쳐, 데이터 준비가 GPU 학습 속도의 병목이 되지 않게 했다.'},
 {h:'Hard negative + curriculum training',
  lead:'PageRank 순위 2000~5000위 아이템을 "어려운 오답"으로 섞어 점진적으로 늘린다.',
  d:'무작위로 뽑은 오답(negative)은 쿼리와 너무 달라서 모델이 쉽게 구분한다. query 기준 Personalized PageRank 순위 2000~5000위 아이템을 "hard negative"로 추가하면 모델이 더 세밀한 구분을 배우지만, 처음부터 넣으면 수렴이 느려진다. 그래서 첫 epoch은 hard negative 없이, $n$번째 epoch에는 $n-1$개씩 늘려가는 curriculum을 쓴다. 이 기법만으로 **12%** 성능 향상.'},
 {h:'MapReduce 기반 임베딩 서빙',
  lead:'학습된 모델을 MapReduce로 돌려 30억 노드 임베딩을 24시간 안에 계산한다.',
  d:'노드별 임베딩을 순진하게 계산하면 K-hop 이웃이 겹쳐 같은 계산을 반복하게 된다. PinSage는 레이어별로 pin→저차원 투영, board 임베딩 집계를 각각 MapReduce job으로 분리해 중복 계산을 없앴다. 학습은 GPU 16장(K80)짜리 서버 한 대로 하고, 추론은 Hadoop 클러스터 378대로 나눠 돌리는 **학습과 서빙의 완전한 분리**가 이 논문의 실무적 기여다.'}
],

diagram:{type:'flow', cap:'PinSage 임베딩 파이프라인. 학습은 GPU 한 대, 대규모 서빙은 별도 MapReduce로 분리된다.',
 nodes:[
  {t:'무작위 보행', s:'노드별 T개 이웃 샘플'},
  {t:'중요도 풀링', s:'방문빈도 가중 집계', acc:true},
  {t:'Convolve × K층', s:'concat + ReLU + 정규화'},
  {t:'Max-margin 학습', s:'hard negative curriculum'},
  {t:'MapReduce 서빙', s:'30억 노드 <24시간'}
 ]},

math:[
 {tex:'n_u=\\gamma\\!\\left(\\{\\text{ReLU}(Qh_v+q)\\mid v\\in N(u)\\},\\alpha\\right)',
  expr:'n_u = γ({ ReLU(Q h_v + q) | v ∈ N(u) }, α)',
  d:'이웃 $N(u)$의 표현을 하나씩 dense layer에 통과시킨 뒤, 무작위 보행 방문 빈도 $\\alpha$ 를 가중치로 삼아 pooling($\\gamma$)한다. 이것이 importance pooling의 정의다.'},
 {tex:'z_u^{new}=\\text{ReLU}\\!\\left(W\\cdot\\text{concat}(z_u,n_u)+w\\right),\\quad z_u^{new}\\leftarrow z_u^{new}/\\lVert z_u^{new}\\rVert_2',
  expr:'z_u_new = ReLU(W · concat(z_u, n_u) + w); 그 후 L2 정규화',
  d:'노드 자신의 현재 표현 $z_u$ 와 이웃 집계 $n_u$ 를 concat한 뒤 한 번 더 dense layer를 통과시키고 L2 정규화한다. concat이 평균보다 성능이 좋았고, 정규화는 이후 근사 최근접 이웃 탐색을 안정시킨다.'}
],

numbers:[
 {k:'그래프 규모', v:'노드 30억 · 엣지 180억', d:'핀 20억 + 보드 10억, 학습에는 7.5억 샘플 그래프 사용'},
 {k:'학습 데이터', v:'7.5B 학습 예제', d:'긍정쌍 12억 + 배치당 무작위 오답 500 + hard negative 6개/핀'},
 {k:'Hit-rate · MRR (전체 모델)', v:'67% · 0.59', d:'최고 baseline 대비 hit-rate +40%p(상대 150%), MRR +22%p(상대 60%)'},
 {k:'Importance pooling 기여', v:'+46%', d:'무작위 보행 가중치를 집계에 반영했을 때의 오프라인 지표 개선폭'},
 {k:'Curriculum training 기여', v:'+12%', d:'hard negative를 점진적으로 늘렸을 때의 추가 개선폭'},
 {k:'서빙 인프라', v:'K80 GPU 16장 학습 · Hadoop 378노드 추론', d:'학습 메모리 500GB, 전체 30억 노드 임베딩 계산 <24시간'}
],

impact:'PinSage는 GCN을 "논문 속 벤치마크 모델"에서 "실제 서비스에서 매일 도는 인프라"로 옮겼다. 사용자 참여도가 A/B 테스트에서 세팅에 따라 30~100% 개선되며, GCN이 실전에서 [행렬 분해](#/p/mf) 기반 협업 필터링을 대체할 수 있음을 처음으로 산업 규모에서 증명했다. 무작위 보행으로 이웃을 정의하는 방식은 [GraphSAGE](#/p/graphsage)의 균일 샘플링을 실전 그래프의 밀도 불균형에 맞게 개조한 것으로, 이후 대규모 그래프 학습 시스템 다수가 이 샘플링·서빙 분리 패턴을 따랐다. GCN 연구의 무게중심이 "정확도를 어떻게 더 올릴까"에서 "10억 노드 그래프에서 어떻게 돌아가게 할까"로 옮겨가는 계기가 되었다.',

legacy:[
 '**산업용 GNN 추천 시스템의 표준 레시피** — 무작위 보행 샘플링 + producer-consumer 학습 + MapReduce/분산 서빙 조합이 이후 대규모 추천 시스템 설계의 참조 사례가 됨',
 '**GraphSAGE 계열의 실전 개조** — [GraphSAGE](#/p/graphsage)의 균일 이웃 샘플링을 importance-weighted 샘플링으로 바꿔, 실제 그래프의 불균등한 연결성에 대응',
 '**임베딩 기반 후보 생성의 정착** — 근접 이웃 탐색(LSH)으로 서빙하는 임베딩 기반 candidate generation이 추천 파이프라인의 표준 첫 단계로 자리잡음',
 '**hard negative mining의 확산** — Personalized PageRank로 "어려운 오답"을 정의하고 curriculum으로 점진 투입하는 기법이 이후 dense retrieval·contrastive learning 전반에 재사용됨'
],

pitfalls:[
 '**"GCN이 전체 그래프를 본다"는 오해다.** PinSage는 각 노드마다 무작위 보행으로 뽑은 상위 T개 이웃만 보며, 이는 근사이지 전체 그래프 컨볼루션이 아니다. 학계 벤치마크의 완전 그래프 GCN과 다른 알고리즘으로 봐야 한다.',
 '**node2vec·DeepWalk와 다른 카테고리다.** 이들은 비지도 학습이고 노드 특성을 못 쓰며 파라미터가 그래프 크기에 비례한다. PinSage는 지도 학습·특성 활용·그래프 크기 독립 파라미터라는 점에서 근본적으로 다른 접근이다.',
 '**hard negative를 처음부터 넣으면 안 된다.** curriculum 없이 hard negative를 바로 전량 투입하면 수렴이 느려지거나 불안정해진다 — 논문이 명시적으로 경고한 함정이다.'
],

figures:[
 {f:'fig1-convolve.png',
  cap:'왼쪽 입력 그래프에서 target node A의 2-layer 임베딩 $h_A^{(2)}$를 만드는 과정. 오른쪽이 CONVOLVE 연산 — 이웃 B, C, D 각각의 1층 표현이 dense layer(회색 사각형)를 지나 γ(importance pooling)로 집계된 뒤 A 자신의 표현과 합쳐진다. 같은 무늬의 상자는 파라미터를 공유한다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-hardneg.png',
  cap:'쿼리 핀(왼쪽)에 대해 Positive Example은 실제 정답, Random Negative는 무작위로 뽑은 무관한 아이템, Hard Negative는 PageRank 순위 2000~5000위권이라 쿼리와 얼핏 비슷해 보이지만 정답은 아닌 예시. 이 Hard Negative를 학습에 섞는 것이 curriculum training의 핵심.',
  src:'원문 Figure 2, p.6'}
],

quotes:[
 {t:'To our knowledge, this is the largest application of deep graph embeddings to date and paves the way for a new generation of web-scale recommender systems based on graph convolutional architectures.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1806.01973 — PinSage', u:'https://arxiv.org/abs/1806.01973'},
 {t:'Pinterest Engineering Blog — PinSage', u:'https://medium.com/pinterest-engineering/pinsage-a-new-graph-convolutional-neural-network-for-web-scale-recommender-systems-88795a107f48'}
]
});
