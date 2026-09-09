WIKI.paper({
slug:'hnsw',
authors:'Malkov & Yashunin (Institute of Applied Physics, Russian Academy of Sciences)',
arxiv:'1603.09320',

tldr:'벡터 최근접 이웃 검색을 **다층 그래프**로 풀어 검색을 $O(\\log N)$ 에 가깝게 만든 논문. 오늘날 거의 모든 벡터 DB(pgvector, Milvus, Qdrant, Faiss 자체도)의 기본 인덱스가 이 구조다.',

context:'임베딩을 대량으로 저장해두고 "이 벡터와 가장 가까운 K개"를 찾는 문제(K-NNS)는 정확히 풀면 차원이 높아질수록 사실상 전수 스캔과 다를 게 없어진다(`curse of dimensionality`). 그래서 정확도를 조금 포기하고 빠르게 찾는 근사 검색(K-ANNS)이 표준이 됐고, 트리·LSH·PQ·근접 그래프(proximity graph) 계열이 경쟁하고 있었다. 이 논문 직전의 대표 그래프 기법인 NSW(Navigable Small World)는 삽입 순서로 그래프를 만들어 탐색 홉 수를 줄였지만, 홉 수가 데이터 크기에 대해 다항로그(polylogarithmic)로만 줄어 대규모·저차원 데이터에서 성능이 급격히 무너지는 문제가 있었다.',

ideas:[
 {h:'다층 그래프: 층마다 연결 스케일을 분리',
  lead:'긴 연결은 위층에, 짧은 연결은 아래층에 둬 탐색 범위를 계층적으로 좁힌다.',
  d:'모든 연결을 하나의 그래프에 섞어두면(=NSW) 탐색이 허브를 반복 경유하면서 다항로그 복잡도에 머문다. HNSW는 각 원소가 속하는 최상위 층 $l$ 을 확률적으로 뽑아 원소를 여러 층에 중복 배치하고, 층마다 별도의 근접 그래프를 만든다. 위층일수록 원소 수가 지수적으로 적고 연결의 특성 거리(characteristic radius)가 크다 — 성긴 고속도로다.'},
 {h:'탐색: 위에서 아래로 내려가며 좁혀간다',
  lead:'최상위 층에서 시작해 국소 최소에 도달하면 한 층 내려가 이어서 탐색한다.',
  d:'질의가 들어오면 가장 위층의 진입점에서 탐욕적 탐색(greedy search)으로 국소 최소를 찾고, 그 지점을 다음 층의 진입점으로 넘겨 한 층 아래에서 다시 탐욕적 탐색을 반복한다. 위층에서 큰 보폭으로 대략적인 방향을 잡고 아래층에서 정밀하게 좁히는 구조라, 마지막 0층에서만 촘촘한 그래프를 훑으면 된다. **스킵 리스트(skip list)**의 2차원 그래프 버전이라고 저자들은 직접 말한다 — 스킵 리스트의 연결 리스트를 근접 그래프로 일반화한 것.'},
 {h:'층 개수는 지수분포로 랜덤 결정',
  lead:'삽입마다 층수를 지수분포로 뽑아 셔플 없이도 계층 구조가 저절로 생긴다.',
  d:'원소가 삽입될 때 최대 층 $l = \\lfloor -\\ln(\\text{unif}(0,1)) \\cdot m_L \\rfloor$ 로 뽑는다. $m_L$ 이 클수록 위층에 원소가 많아지고 층 간 중복이 늘어 탐색은 안정되지만 메모리·구성 비용이 커진다. 저자들은 $m_L = 1/\\ln(M)$ 을 실험적으로 합리적인 기본값으로 제시한다 — 스킵 리스트의 승급 확률 $p=1/M$ 에 대응한다.'},
 {h:'이웃 선택 휴리스틱: 가장 가까운 게 아니라 다양한 이웃',
  lead:'단순 최근접 대신 방향이 겹치지 않는 이웃을 골라 그래프의 전역 연결성을 지킨다.',
  d:'후보 중 무조건 가까운 M개를 잇지 않고, 이미 연결된 이웃보다 삽입 원소에 더 가까운 후보만 추가로 연결하는 휴리스틱(alg. 4)을 쓴다. 이렇게 하면 서로 멀리 떨어진 두 클러스터를 잇는 "다리" 연결이 살아남아, 데이터가 심하게 군집화돼 있어도 그래프 전체가 끊기지 않는다.'},
 {h:'구성은 삽입형·병렬화 가능',
  lead:'원소를 하나씩 순차 삽입하며 그래프를 키우고, 삽입 자체를 병렬화할 수 있다.',
  d:'배치로 전체 그래프를 한 번에 짓는 대신 원소를 하나씩 넣으며 그때그때 이웃을 연결한다. 삽입 순서를 미리 섞을 필요가 없고(층 랜덤화만으로 충분), 동기화 지점이 적어 멀티스레드로 구성 시간을 크게 줄일 수 있다.'}
],

diagram:{type:'stack', cap:'질의가 최상위 층에서 시작해 국소 최소를 찾을 때마다 한 층씩 내려가며 탐색 범위를 좁힌다 (Fig. 1의 구조).',
 layers:[
  {t:'Layer 2 (최상위)', s:'원소 수 최소', note:'긴 연결, 성긴 그래프'},
  {t:'탐욕적 탐색', s:'국소 최소까지', acc:true},
  {t:'Layer 1', s:'중간 밀도'},
  {t:'탐욕적 탐색', s:'진입점 승계'},
  {t:'Layer 0 (전체)', s:'모든 원소 포함', note:'짧은 연결, 조밀'}
 ]},

math:[
 {expr:'l = floor( -ln(unif(0,1)) * m_L )',
  tex:'l=\\left\\lfloor -\\ln(\\text{unif}(0,1))\\cdot m_L \\right\\rfloor',
  d:'새로 삽입되는 원소가 속할 최대 층 $l$ 을 지수분포로 뽑는 식. $m_L$ 이 층 수 분포의 스케일을 정한다.'},
 {expr:'m_L = 1 / ln(M)',
  tex:'m_L = 1/\\ln(M)',
  d:'저자들이 제시하는 기본값. 스킵 리스트의 승급 확률 $p=1/M$ 과 대응되며, 층 간 원소 중복이 평균 1개 정도가 되게 한다.'}
],

numbers:[
 {k:'복잡도', v:'O(log N)', d:'NSW의 다항로그(polylogarithmic) 스케일링을 로그로 개선'},
 {k:'HNSW 구성 시간', v:'5.6시간 · M=16, efConstruction=500', d:'200M 서브셋(1B SIFT), 64GB 메모리'},
 {k:'Faiss(PQ) 구성 시간', v:'12시간 · OPQ64,IMI2x14,PQ64', d:'같은 200M SIFT에서 HNSW보다 메모리는 적지만(30GB) 훨씬 느림'},
 {k:'최적 mL', v:'1/ln(M)', d:'스킵 리스트 파라미터 $p=1/M$ 에 대응'},
 {k:'NSW 대비 향상', v:'최대 약 1000배', d:'저차원 wiki-8(JS-divergence) 데이터셋에서 3자릿수 개선'},
 {k:'테스트 규모', v:'200M subset of 1B SIFT', d:'4× Xeon E5-4650 v2, 128GB RAM 서버'}
],

impact:'HNSW 이후 근사 최근접 이웃 검색은 "그래프 인덱스가 기본값"인 분야가 됐다. 로그 복잡도와 삽입형 구성이라는 조합이 실시간으로 벡터가 추가·삭제되는 서비스(검색, 추천, RAG)에 딱 맞아떨어졌기 때문이다. [Faiss](#/p/faiss)를 비롯해 pgvector, Milvus, Qdrant, Weaviate 등 사실상 모든 오픈소스·상용 벡터 DB가 HNSW를 핵심 인덱스 옵션으로 제공한다. 흥미롭게도 각주 8에서 언급되듯 2017년 당시 Faiss는 HNSW를 갖고 있지 않았지만, 2018년부터 자체 구현을 추가했다 — 이 논문이 경쟁 라이브러리의 설계까지 바꾼 사례다.',

legacy:[
 '**Faiss의 IndexHNSW** — 2018년부터 [Faiss](#/p/faiss)가 자체 HNSW 구현을 포함, IVF-PQ와 나란히 선택 가능한 인덱스가 됨',
 '**벡터 DB 산업 표준화** — pgvector·Milvus·Qdrant·Weaviate·Vespa가 모두 HNSW(또는 그 변형)를 기본 인덱스로 채택',
 '**[DPR](#/p/dpr)·[RAG](#/p/rag) 서빙 계층** — 밀집 임베딩 검색기 논문들이 "인덱싱 방법"으로 HNSW를 전제하면서 연구와 인프라가 분리됨',
 '**압축과의 결합 실험** — 그래프 인덱스(HNSW)와 양자화(PQ)를 함께 쓰는 IVF-PQ-HNSW 하이브리드 인덱스로 이어짐'
],

pitfalls:[
 '**"HNSW가 항상 정확한 최근접 이웃을 준다"는 오해.** 근사 검색이라 recall이 100%가 아니며, `efSearch`(탐색 폭)를 낮게 잡으면 실제로는 상당한 재현율 손실이 생긴다. 논문의 Fig. 14/15도 recall-vs-latency 트레이드오프 곡선으로 결과를 보고한다.',
 '**임베딩 모델을 바꾸면 인덱스 전체를 재구축해야 한다.** HNSW 그래프는 특정 임베딩 공간의 거리 구조에 맞춰 연결을 만들기 때문에, 임베딩 모델을 교체하면 벡터 값이 통째로 바뀌어 기존 그래프가 무의미해진다. 수억 개 벡터 규모에서는 이 재구축이 수 시간~수일이 걸리는 실무 비용이 된다.',
 '**메모리 비용을 과소평가하기 쉽다.** 그래프 연결(포인터) 자체가 원소당 $M$~$2M$ 개씩 필요해서, 벡터 원본보다 그래프 구조가 메모리를 더 먹는 경우가 흔하다(논문 실험에서도 64GB를 씀). 압축이 필요하면 PQ와 결합해야 한다.'
],

figures:[
 {f:'fig1-layers.png',
  cap:'맨 위 Layer=2에서 빨간 진입점으로 시작해 점선 화살표를 따라 국소 최소에 도달할 때마다 한 층씩(1→0) 내려간다. 아래로 갈수록 층에 포함된 원소가 많아지고(특성 반지름 감소) 마지막 Layer=0에서 초록색 질의 지점에 도달한다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig15-faiss-compare.png',
  cap:'x축 질의 시간(로그), y축 recall. 분홍 두 곡선(HNSW)이 같은 recall에 도달하는 데 청록 곡선(Faiss PQ)보다 훨씬 짧은 시간이 걸린다 — 그래프 인덱스가 양자화 기반 인덱스보다 latency-recall 트레이드오프에서 우위임을 보여준다. 삽입 그래프는 데이터셋 크기가 커져도 질의 시간이 완만하게만 늘어남을 보여준다.',
  src:'원문 Figure 15, p.10'}
],

quotes:[
 {t:'Similarity of the algorithm to the skip list structure allows straightforward balanced distributed implementation.',
  src:'Abstract, p.1'},
 {t:'A simple choice for the optimal mL is 1/ln(M), this corresponds to the skip list parameter p=1/M with an average single element overlap between the layers.',
  src:'Section 4, p.4'}
],

links:[
 {t:'arXiv 1603.09320 — Efficient and Robust Approximate Nearest Neighbor Search Using HNSW', u:'https://arxiv.org/abs/1603.09320'},
 {t:'hnswlib (저자들의 레퍼런스 구현)', u:'https://github.com/nmslib/hnswlib'},
 {t:'pgvector HNSW 문서', u:'https://github.com/pgvector/pgvector#hnsw'}
]
});
