WIKI.paper({
slug:'colbert',
venue:'SIGIR 2020',
authors:'Khattab & Zaharia (Stanford University)',
arxiv:'2004.12832',

tldr:'질의와 문서를 따로 BERT에 태워 각각 **토큰마다** 벡터를 남겨 두고, 검색 시점에는 그 벡터들 사이의 최대 유사도(MaxSim)만 더하는 **late interaction**을 제안한 논문. cross-encoder급 정확도를 bi-encoder급 속도로 얻는다.',

context:'2019년 [BERT](#/p/bert)를 랭킹에 쓰는 표준 방식은 질의와 문서를 하나로 이어 붙여 BERT에 통째로 넣고 `[CLS]` 위에 MLP를 얹는 것이었다(cross-encoder). 정확하지만 후보 문서마다 BERT를 처음부터 돌려야 해서, 문서 하나 재순위화에도 수십에서 수백 ms가 걸린다. 반대편에는 [DPR](#/p/dpr)처럼 질의와 문서를 각각 하나의 벡터로 미리 인코딩해 내적만 계산하는 bi-encoder가 있다. 문서 벡터를 오프라인에 미리 만들어 두므로 빠르지만, 문서 전체를 벡터 하나로 눌러 담다 보니 세밀한 토큰 수준 매칭 정보가 사라져 정확도가 떨어진다. ColBERT는 이 둘 사이의 절충을 찾는다 — **문서 인코딩은 미리(offline) 끝내 두면서도, 토큰 수준의 세밀한 상호작용은 포기하지 않는다.**',

ideas:[
 {h:'Late interaction: 상호작용을 검색 시점으로 미룬다',
  lead:'질의·문서를 따로 인코딩해 두고, 상호작용만 질의 시점에 값싸게 계산한다.',
  d:'cross-encoder(Figure 2c의 all-to-all)는 질의와 문서를 처음부터 같이 넣어 모든 토큰 쌍이 attention으로 섞이므로 정확하지만 문서마다 다시 계산해야 한다. bi-encoder(Figure 2a)는 각자 인코딩한 뒤 벡터 하나로 압축해 비교하므로 빠르지만 정보 손실이 크다. ColBERT는 **인코딩은 따로, 상호작용은 늦게** — 질의·문서를 독립적으로 BERT에 태워 토큰별 벡터 집합(bag of embeddings)을 얻고, 이 세밀한 표현을 유지한 채로 검색 시점에만 가볍게 비교한다.'},
 {h:'MaxSim: 토큰마다 최선의 상대를 찾아 합산',
  lead:'질의 토큰마다 문서 토큰 중 가장 가까운 것과의 내적을 구해 모두 더한다.',
  d:'질의 토큰 임베딩 집합 $E_q$ 의 각 벡터 $v$ 에 대해, 문서 토큰 임베딩 집합 $E_d$ 안에서 코사인 유사도가 가장 큰 것을 찾고, 이 최댓값들을 질의 토큰에 대해 모두 합산해 최종 점수로 삼는다(수식 참고). 예를 들어 질의의 "capital"이라는 토큰은 문서 안에서 "capital"과 가장 가까운 위치의 문맥화된 벡터 하나만 골라 비교하면 된다 — 문서 전체를 한 벡터로 뭉개지 않고도 값싼 연산으로 끝난다.'},
 {h:'문서 인코딩은 오프라인, 질의 인코딩만 온라인',
  lead:'문서 임베딩은 색인 시점에 미리 계산해 두고 질의만 실시간으로 인코딩한다.',
  d:'ColBERT는 문서를 색인에 넣기 전에 BERT로 딱 한 번 인코딩해 토큰별 벡터를 디스크에 저장해 둔다. 질의가 들어오면 그 질의만 BERT에 태우고, 저장해 둔 문서 벡터들과 MaxSim만 계산하면 된다. cross-encoder는 질의–문서 쌍마다 길이 $|q|+|d|$ 시퀀스를 BERT에 새로 넣어야 하지만, ColBERT는 길이 $|q|$ 짜리 시퀀스 하나만 넣으면 되므로 재순위화할 문서 수 $k$ 가 늘어도 비용이 거의 늘지 않는다.'},
 {h:'query augmentation: [mask] 패딩으로 질의를 부풀린다',
  lead:'짧은 질의를 `[mask]` 토큰으로 채워 넣어 소프트한 질의 확장 효과를 낸다.',
  d:'질의를 고정 길이 $N_q$ 로 맞추되, 모자란 자리를 BERT의 `[mask]` 토큰으로 채운다. 이 마스크 위치들도 BERT를 통과하며 문맥화된 벡터를 얻으므로, 모델이 "질의에 없지만 관련 있는 단어"의 임베딩을 그 자리에 학습해 넣을 수 있다. 논문은 이를 제거하면 MRR@10이 눈에 띄게 떨어진다는 것을 ablation으로 보인다.'},
 {h:'벡터 유사도 인덱스로 top-k를 직접 검색한다',
  lead:'MaxSim의 pruning-friendly한 구조를 이용해 BM25 재순위화가 아닌 end-to-end 검색을 한다.',
  d:'재순위화만 하려면 BM25가 먼저 뽑은 top-1000 후보가 필요하지만, ColBERT는 각 질의 토큰 벡터로 [FAISS](#/p/faiss) 같은 근사 최근접 이웃(ANN) 인덱스를 조회해 후보 문서 임베딩들을 직접 찾아낸 뒤 MaxSim으로 재정렬한다. BM25가 애초에 놓친 문서까지 상위권에 올라올 수 있어 recall이 크게 개선된다.'}
],

diagram:{type:'compare', cap:'세 가지 질의–문서 매칭 패러다임의 절충. ColBERT는 bi-encoder의 오프라인 인코딩과 cross-encoder의 토큰 수준 정밀도를 동시에 취한다.',
 left:{t:'기존 두 극단', items:['bi-encoder: 문서 1벡터, 부정확','cross-encoder: 문서마다 재계산']},
 right:{t:'late interaction', items:['질의·문서 토큰별 벡터 인코딩','문서 벡터는 미리 색인 계산','검색 시점엔 MaxSim만 계산']}},

math:[
 {expr:'S(q,d) = Σ_i max_j  E_qi · E_dj^T',
  tex:'S_{q,d} := \\sum_{i \\in [|E_q|]} \\max_{j \\in [|E_d|]} E_{q_i} \\cdot E_{d_j}^{\\top}',
  d:'질의 토큰 임베딩 $i$ 마다 문서 토큰 임베딩 중 내적(=코사인 유사도, 둘 다 L2 정규화됨)이 가장 큰 것을 골라(MaxSim) 그 값을 질의 토큰 전체에 대해 합산한다. 이 합이 문서의 최종 관련도 점수다.'},
 {expr:'E_q = Normalize( CNN( BERT("[Q] q1 q2 ... ql ##...#") ) )',
  tex:'E_q := \\text{Normalize}\\big(\\text{Linear}(\\text{BERT}(\\texttt{[Q]}\\,q_1 q_2 \\dots q_l \\,\\#\\#\\dots\\#))\\big)',
  d:'질의는 `[Q]` 토큰을 붙이고 길이 $N_q$ 까지 `[mask]`(#)로 패딩한 뒤 BERT에 넣고, 선형 층으로 차원을 $m$(기본 128)까지 줄이고 정규화한다. 문서는 `[D]` 토큰을 붙이되 패딩 없이 같은 과정을 거치고 구두점 토큰을 제거한다.'}
],

numbers:[
 {k:'재순위화 지연시간', v:'61ms', d:'BERT_base 재순위화 10,700ms 대비 **170배 이상 빠름** (MS MARCO, GPU 1장)'},
 {k:'FLOPs/query', v:'7B', d:'BERT_base의 97T 대비 **약 14,000배 적음**'},
 {k:'MRR@10 (재순위화)', v:'34.9%', d:'BERT_base 34.7~36.0%와 대등, BM25 16.7%·최고 non-BERT(fastText+ConvKNRM) 29.0% 상회'},
 {k:'MRR@10 (end-to-end 검색)', v:'36.0%', d:'BM25 top-1000 재순위화가 아니라 880만 문서 전체에서 직접 top-1000 검색, latency 458ms'},
 {k:'색인 시간', v:'약 3시간', d:'GPU 4장으로 MS MARCO 880만 패시지 인덱싱'},
 {k:'공간 효율 설정', v:'24차원 · 2byte', d:'MRR@10 33.9%(최고 대비 -1%p)로 880만 문서 색인을 **27GiB**에 저장 가능'}
],

impact:'ColBERT는 "정확도를 얻으려면 매 문서마다 BERT를 다시 돌려야 한다"는 전제를 깼다. 문서 인코딩과 질의–문서 상호작용을 분리한 late interaction은 이후 신경망 기반 first-stage retrieval 연구 전체의 표준 축이 됐고, 재순위화뿐 아니라 대규모 컬렉션에서의 end-to-end dense retrieval을 실용적인 지연시간으로 가능하게 만들었다. [RAG](#/p/rag) 계열이 필요로 하는 "빠르면서도 세밀한" 검색기의 한 축을 세운 논문이다.',

legacy:[
 '**ColBERTv2**(2021)가 벡터 압축(잔차 양자화)으로 index 크기를 수십 배 줄이며 late interaction의 실용성을 크게 개선',
 '**[SPLADE](#/p/splade)** 계열이 dense multi-vector 대신 vocabulary 크기의 sparse 벡터로 같은 late-interaction 정신을 역색인 위에서 구현',
 '**PLAID, XTR** 등 후속 연구가 MaxSim 계산을 pruning·클러스터링으로 더 가속화',
 '오늘날 상용 RAG 파이프라인의 재순위화 단계(re-ranker)로 ColBERT류 late interaction이 널리 채택'
],

pitfalls:[
 '**임베딩 모델을 바꾸면 색인 전체를 다시 만들어야 한다.** ColBERT는 문서당 벡터를 하나가 아니라 토큰 수만큼 저장하므로(문서당 수십~수백 개), 모델을 교체하거나 임베딩 차원을 바꿀 때의 재인덱싱 비용과 저장 공간이 [DPR](#/p/dpr) 같은 single-vector 방식보다 훨씬 크다 — Table 4 기준 MS MARCO 880만 문서 색인이 128차원·4바이트에서 286GiB에 달한다.',
 '**MaxSim은 결국 벡터 간 최근접 탐색이라 근사 인덱스(ANN)에 의존한다.** end-to-end 검색에서 [FAISS](#/p/faiss)/[HNSW](#/p/hnsw) 같은 근사 탐색을 쓰면 정확도-속도 트레이드오프가 또 하나 끼어들고, 브루트포스와 근사 검색의 성능 차이는 컬렉션 규모에 따라 달라진다.',
 '**MS MARCO에서의 이득이 다른 도메인에서 그대로 재현되지 않을 수 있다.** 질의 길이·문서 스타일이 크게 다른 도메인으로 옮기면 query augmentation이나 MaxSim의 이점이 줄어들 수 있어, 도메인 이동 시 재학습이나 재검증이 필요하다.'
],

figures:[
 {f:'fig2-paradigms.png',
  cap:'왼쪽부터 (a) representation-based: 질의·문서를 각각 벡터 하나로 압축 후 비교(DPR류), (b)/(c) interaction-based: 토큰 쌍을 직접 섞음(BERT cross-encoder류), (d) ColBERT의 late interaction: 따로 인코딩한 뒤 MaxSim(초록 점선)으로만 연결. 네 그림의 화살표 밀도 차이가 곧 계산 비용의 차이다.',
  src:'원문 Figure 2, p.2'},
 {f:'fig3-architecture.png',
  cap:'질의 인코더 f_Q 와 문서 인코더 f_D 는 따로 동작하고(회색 박스가 "Offline Indexing" — 문서 쪽만 미리 계산해 둘 수 있음을 표시), 각 질의 토큰이 모든 문서 토큰과 연결된 화살표 중 MaxSim이 최댓값 하나만 골라 Σ로 합산해 score를 만든다.',
  src:'원문 Figure 3, p.3'}
],

quotes:[
 {t:'ColBERT introduces a late interaction architecture that independently encodes the query and the document using BERT and then employs a cheap yet powerful interaction step that models their fine-grained similarity.',
  src:'Abstract, p.1'},
 {t:'This enables using vector-similarity algorithms for skipping documents without materializing the full interaction matrix or even considering each document in isolation.',
  src:'Section 3.1, p.4'}
],

links:[
 {t:'arXiv 2004.12832 — ColBERT', u:'https://arxiv.org/abs/2004.12832'},
 {t:'ColBERT (GitHub, Stanford Future Data Systems)', u:'https://github.com/stanford-futuredata/ColBERT'}
]
});
