WIKI.paper({
slug:'faiss',
authors:'Johnson, Douze & Jégou (Facebook AI Research)',
arxiv:'1702.08734',

tldr:'수십억 개 벡터를 GPU로 검색·클러스터링하는 실전 라이브러리(Faiss)의 설계 논문. 핵심은 GPU에서 병목이던 `k-selection`(top-k 뽑기)을 레지스터 메모리만으로 처리하는 `WarpSelect` 알고리즘과, IVF(역색인)+PQ(product quantization) 조합으로 압축된 벡터를 GPU에서 직접 검색하는 구조다.',

context:'2017년 시점, 이미지·비디오 임베딩은 CNN으로 대량 생산되고 있었지만 그 벡터들을 저장·검색하는 인프라는 GPU를 제대로 못 쓰고 있었다. 문제의 핵심은 유사도 검색이 두 단계로 이뤄진다는 데 있다 — 거리 계산(행렬곱이라 GPU에 잘 맞음)과 `k-selection`(가장 가까운 k개를 골라내는 정렬/선택 연산으로, 데이터 의존적 분기가 많아 GPU에 잘 안 맞음). 기존 GPU 근접 이웃 구현들은 대부분 수백만 벡터 규모에 머물렀고, 10억(1B) 단위 데이터셋은 압축(PQ)과 역색인(IVF) 없이는 메모리에 올릴 수도 없었다. 이 논문은 "GPU에서 십억 스케일 검색을 실제로 어떻게 짜는가"를 다룬다.',

ideas:[
 {h:'WarpSelect: 레지스터에서 끝내는 top-k',
  lead:'힙이나 정렬 대신 warp 레지스터만으로 동작하는 병렬 k-selection 커널을 설계한다.',
  d:'top-k를 고르는 연산은 본질적으로 순차적인 힙 갱신에 의존해 GPU의 데이터 병렬성과 상성이 나쁘다. WarpSelect는 공유 메모리나 warp 간 동기화 없이, 각 스레드가 레지스터에 작은 정렬 버퍼를 유지하며 새 값이 들어올 때만 갱신하는 방식으로 이 병목을 없앤다. 다른 커널(거리 계산)에 융합(fuse)할 수 있을 만큼 가볍다는 점이 특히 중요하다.'},
 {h:'IVF: 역색인으로 후보를 좁힌다',
  lead:'벡터 공간을 `|C1|`개 클러스터로 나눠, 질의와 가까운 τ개 클러스터만 스캔한다.',
  d:'전체 데이터베이스를 매번 다 훑는 대신, 1단계 양자화기 $q_1$ 으로 벡터들을 $|C_1|$ 개의 역색인 리스트(inverted list)에 미리 나눠 담는다. 검색 시 질의에 가장 가까운 τ개 리스트만 선형 스캔하면 되므로, 전수 검색 대비 계산량이 $|C_1|/\\tau$ 배 줄어든다. $|C_1|$ 은 보통 데이터 개수의 제곱근 근처로 잡는다.'},
 {h:'PQ: 벡터를 바이트로 압축해서 저장',
  lead:'벡터를 b개 부분벡터로 쪼개 각각 1바이트 코드로 양자화해 메모리를 수십 배 줄인다.',
  d:'IVF로 후보를 좁혀도 남은 벡터들과의 거리를 원본 float로 계산하면 메모리가 감당이 안 된다. Product Quantization은 벡터 $y$ 를 $b$ 개의 부분벡터로 나눠 각각 256개 중심을 갖는 서브 양자화기로 인코딩한다. 결과적으로 벡터 하나가 $b$ 바이트 코드가 되어(원본이 512바이트짜리 float128이면 수십~수백 배 압축), 코드만으로 근사 거리(ADC, Asymmetric Distance Computation)를 계산할 수 있다.'},
 {h:'멀티 GPU로 샤딩·복제를 동시에',
  lead:'인덱스를 여러 GPU에 샤딩(분할)하거나 복제해 처리량과 용량을 함께 늘린다.',
  d:'단일 GPU 메모리에 안 들어가는 인덱스는 샤드(shard, `S`)로 쪼개 분산 저장하고, 처리량이 부족하면 복제(replica, `R`)로 늘린다. DEEP1B 실험처럼 `S=2, R=2`로 4개 GPU를 동시에 쓰는 식으로 조합해, 단일 머신 안에서도 용량과 속도를 둘 다 확보한다.'},
 {h:'k-NN 그래프 구축이라는 킬러 애플리케이션',
  lead:'모든 벡터를 인덱스 자신에 대해 검색해 전체 데이터셋의 k-최근접 이웃 그래프를 만든다.',
  d:'구축한 인덱스로 데이터셋의 모든 벡터에 대해 자기 자신을 질의로 던지면 k-NN 그래프가 나온다. 이 그래프는 클러스터링·중복 탐지·추천의 기반 자료가 되는데, 이전에는 계산량 때문에 수백만 개 규모에서 멈췄던 이 작업을 논문은 9500만~10억 개 규모로 끌어올린다.'}
],

diagram:{type:'flow', cap:'IVFADC 검색 파이프라인: 질의는 먼저 역색인으로 후보 클러스터를 찾고, 그 안에서 PQ 압축 코드로 근사 거리를 계산해 k-selection으로 마무리한다.',
 nodes:[
  {t:'질의 벡터', s:'d차원 float'},
  {t:'q1 역색인 탐색', s:'τ개 클러스터 선택'},
  {t:'PQ 코드 스캔', s:'b바이트 코드', acc:true},
  {t:'ADC 거리 계산', s:'근사 L2 거리'},
  {t:'WarpSelect', s:'top-k 추출'}
 ]},

math:[
 {expr:'y ≈ q(y) = q1(y) + q2(y − q1(y))',
  tex:'y \\approx q(y) = q_1(y) + q_2(y-q_1(y))',
  d:'IVFADC의 2단계 양자화. $q_1$ 이 굵은 클러스터(coarse quantizer)를 정하고, $q_2$ 가 그 잔차(residual)를 다시 양자화해 정밀도를 보완한다.'},
 {expr:'L_IVFADC = k-argmin over {i : q1(yi) in L_IVF} of ||x − q(yi)||²',
  tex:'L_{\\text{IVFADC}} = \\underset{i:\\,q_1(y_i)\\in L_{\\text{IVF}}}{k\\text{-argmin}} \\; \\lVert x-q(y_i) \\rVert^2',
  d:'전체가 아니라 후보 클러스터 집합 $L_{IVF}$ 에 속한 벡터만 대상으로 top-k를 계산한다. IVF가 검색 범위를, PQ가 거리 계산 비용을 동시에 줄이는 구조.'}
],

numbers:[
 {k:'k-selection 속도', v:'이전 GPU 최고 대비 8.5배', d:'SIFT1B, 동일 메모리 조건에서 R@10도 더 높음(0.376 vs 0.35)'},
 {k:'WarpSelect 효율', v:'이론 최대 성능의 55%(k=100)', d:'k=1000에서는 16%로 하락 — 병합 네트워크 오버헤드 증가'},
 {k:'k-NN 그래프(9500만장)', v:'35분', d:'YFCC100M, accuracy 0.8 이상, 4× Maxwell Titan X'},
 {k:'k-NN 그래프(10억 벡터)', v:'12시간 미만', d:'DEEP1B, 4× Maxwell Titan X GPU'},
 {k:'k-means 속도', v:'BIDMach 대비 2배 이상', d:'MNIST8m, 4096 centroids 기준 GPU 1개로도 우위'},
 {k:'멀티 GPU 확장성', v:'4 GPU에서 3.16배', d:'대형 문제에서 거의 선형에 가까운 speedup'}
],

impact:'이 논문 이후 벡터 검색은 "연구용 알고리즘"에서 "GPU로 수십억 개를 돌리는 인프라 소프트웨어"로 넘어갔다. Faiss는 오픈소스로 공개되어 오늘날 대부분의 임베딩 검색 시스템(추천, 이미지 검색, [RAG](#/p/rag) 파이프라인)의 사실상 표준 라이브러리가 됐다. IVF+PQ라는 조합은 "정확도-속도-메모리" 삼각 트레이드오프를 파라미터(`nlist`, `m`, `nprobe`)로 명시적으로 조절할 수 있게 만들었고, 이후 대부분의 벡터 DB가 이 어휘를 그대로 물려받았다.',

legacy:[
 '**벡터 DB의 백엔드 표준** — Faiss는 Milvus, Weaviate 등 여러 오픈소스 벡터 DB의 코어 검색 엔진으로 직접 내장되거나 참조 구현이 됨',
 '**HNSW 흡수** — 2018년부터 [HNSW](#/p/hnsw) 인덱스(`IndexHNSW`)를 자체 구현으로 추가해, 그래프 기반 인덱스와 IVF-PQ 압축 인덱스를 같은 라이브러리 안에서 선택할 수 있게 됨',
 '**IVF-PQ 어휘의 표준화** — `nlist`(클러스터 수), `nprobe`(탐색 클러스터 수), PQ 서브벡터 수 같은 파라미터 명명이 이후 업계 전반에서 그대로 쓰임',
 '**GPU 서빙의 선례** — 임베딩 검색을 GPU에 올리는 설계(k-selection 융합, 멀티 GPU 샤딩)가 이후 대규모 추천 시스템 인덱스 설계의 참조점이 됨'
],

pitfalls:[
 '**"HNSW보다 항상 빠르다/느리다"는 일반화는 틀렸다.** IVF-PQ는 메모리 효율에서, 그래프 인덱스([HNSW](#/p/hnsw))는 같은 메모리에서의 recall-latency 트레이드오프에서 강점을 보이는 등 데이터 분포·규모·하드웨어에 따라 우열이 갈린다. 실제로 HNSW 논문 자체가 같은 200M SIFT 데이터셋에서 Faiss PQ보다 훨씬 빠른 결과를 보고한 바 있다.',
 '**임베딩 모델을 바꾸면 인덱스 전체를 재구축해야 한다.** PQ의 서브 양자화기와 IVF의 클러스터 중심은 학습 시점의 임베딩 분포에 맞춰 훈련(`train`)된다. 임베딩 모델을 교체하면 벡터 분포 자체가 달라져 기존 양자화기가 무의미해지고, 수억~수십억 개 규모에서는 이 재학습·재인코딩이 몇 시간~며칠짜리 배치 작업이 된다.',
 '**PQ 압축은 손실 압축이라 재현율 손실을 감수해야 한다.** `m`(바이트 수)을 줄이면 메모리는 줄지만 근사 거리 오차가 커져 recall이 떨어진다. `nprobe`를 늘려 보정할 수 있지만 그만큼 지연시간이 늘어나는 트레이드오프는 피할 수 없다.'
],

figures:[
 {f:'fig3-kselect.png',
  cap:'x축은 배열 길이(로그), y축은 실행시간(로그, ms). 맨 아래 노란 직선이 메모리 대역폭 한계이고, 하늘색 WarpSelect가 다른 두 GPU 구현(bitonic sort, fgknn)보다 전 구간에서 한계선에 가장 가깝다 — k-selection이 메모리 병목에 근접했다는 뜻.',
  src:'원문 Figure 3, p.8'},
 {f:'fig5-billion-scale.png',
  cap:'x축 10-intersection@10(정확도), y축 구축 시간. 위쪽 YFCC100M(9500만 장)은 분 단위, 아래 DEEP1B(10억 개)는 시간 단위로 스케일이 다르다는 점부터 이미 규모 차이를 보여준다. 곡선이 오른쪽으로 갈수록(정확도 상승) 급격히 꺾여 올라가는 지점이 "이 이상의 정확도는 비용이 급증한다"는 실무적 한계선이다.',
  src:'원문 Figure 5, p.9'}
],

quotes:[
 {t:'We propose a design for k-selection that operates at up to 55% of theoretical peak performance, enabling a nearest neighbor implementation that is 8.5× faster than prior GPU state of the art.',
  src:'Abstract, p.1'},
 {t:'making searches on GPUs is a game-changer in terms of speed achievable on a single machine.',
  src:'Section 6.4, p.9'}
],

links:[
 {t:'arXiv 1702.08734 — Billion-scale similarity search with GPUs', u:'https://arxiv.org/abs/1702.08734'},
 {t:'facebookresearch/faiss (GitHub)', u:'https://github.com/facebookresearch/faiss'},
 {t:'Faiss wiki — Indexing 1G vectors', u:'https://github.com/facebookresearch/faiss/wiki/Indexing-1G-vectors'}
]
});
