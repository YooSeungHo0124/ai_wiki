WIKI.paper({
slug:'bge',
venue:'SIGIR 2024 (BAAI)',
authors:'Xiao, Liu, Zhang et al. (Beijing Academy of AI · Renmin University)',
arxiv:'2309.07597',

tldr:'벤치마크(C-MTEB)·학습 데이터(C-MTP, 1억 쌍)·모델(BGE)을 한 세트로 묶어 공개한 패키지. **사전학습 → 대규모 약감독 대조학습 → 지시문 기반 지도 미세조정**의 3단계 레시피로 중국어 C-MTEB 전 항목에서 기존 대비 +10%p 이상 앞섰고, 이후 영어 MTEB 최상위권까지 확장됐다.',

context:'[E5](#/p/e5)는 웹에서 자연 발생한 (질의,문단) 쌍을 대규모로 모아 대조 사전학습한 뒤 소량 라벨로 미세조정하는 레시피를 영어 임베딩에 적용했다. 그런데 중국어 쪽은 사정이 더 나빴다 — 공개된 대규모 학습 데이터도, 평가를 위한 표준 벤치마크도 없었다. 개별 팀이 서로 다른 비공개 데이터·평가 방식으로 모델을 내놓다 보니 모델 간 비교조차 어려웠다. BGE 저자들의 질문은 "모델 하나만 내놓을 게 아니라, 벤치마크·데이터·모델·학습 레시피를 통째로 표준화해서 공개하면 커뮤니티 전체가 재현하고 개선할 수 있지 않을까"였다.',

ideas:[
 {h:'C-Pack: 벤치마크·데이터·모델을 한 세트로',
  lead:'C-MTEB(평가)·C-MTP(데이터)·BGE(모델)·학습 레시피 네 가지를 함께 패키징한다.',
  d:'MTEB의 중국어 확장판인 **C-MTEB**(6개 태스크·35개 데이터셋), 1억 쌍 규모의 **C-MTP** 학습 데이터, 그리고 그 위에서 학습한 **BGE** 모델 3종(small 24M·base 102M·large 326M)을 통째로 공개했다. 평가·데이터·모델이 따로 놀던 이전 연구들과 달리, 하나가 바뀌면 나머지도 검증 가능한 폐루프를 만들었다.'},
 {h:'3단계 학습: 사전학습 → 약감독 대조 → 지도 미세조정',
  lead:'RetroMAE 사전학습 후 라벨 없는 데이터로 대조학습하고, 라벨 데이터+지시문으로 마무리한다.',
  d:'1단계는 RetroMAE 스타일의 embedding-oriented 사전학습으로 인코더를 준비한다. 2단계는 C-MTP(unlabeled, 1억 쌍)로 in-batch negative 대조학습을 해 범용 판별력을 만든다([E5](#/p/e5)의 CCPairs와 같은 역할). 3단계는 C-MTP(labeled, 약 100만 쌍)에 태스크별 hard negative를 채굴해 붙이고 지시문 기반으로 미세조정한다. E5가 2단계였다면 BGE는 사전학습을 명시적으로 앞에 붙여 3단계로 늘렸다.'},
 {h:'질의에만 붙는 지시문 프리픽스',
  lead:'query에만 자연어 지시문을 붙이고 passage는 그대로 둬 비대칭 검색을 학습한다.',
  d:'[E5](#/p/e5)의 `"query: "`/`"passage: "`라는 고정 태그 대신, BGE는 질의 쪽에만 `"Represent this sentence for searching relevant passages: "` 류의 자연어 지시문 $I_t$ 를 붙인다($q\' \\leftarrow q + I_t$). passage 쪽은 그대로 둔다. 지시문이 일종의 hard in-batch negative처럼 작동해 질의와 문서 표현을 더 뚜렷이 갈라놓는다고 보고한다.'},
 {h:'ANN 방식 hard negative 채굴',
  lead:'무작위가 아니라 근사 최근접 탐색으로 헷갈리는 negative를 골라 미세조정에 넣는다.',
  d:'미세조정 단계에서 각 (질의,정답문단) 쌍마다 그 태스크의 원본 코퍼스에서 근사 최근접 탐색([HNSW](#/p/hnsw)류)으로 정답과 비슷하지만 오답인 문단을 하나씩 골라 hard negative로 추가한다. in-batch negative만 쓰는 것보다 판별 경계가 촘촘해진다.'}
],

diagram:{type:'flow', cap:'C-Pack의 3단계 학습 레시피. 각 단계마다 다른 데이터 소스와 목적이 붙는다.',
 nodes:[
  {t:'웹 코퍼라', s:'Baike·Zhihu·뉴스'},
  {t:'사전학습', s:'RetroMAE'},
  {t:'약감독 대조학습', s:'C-MTP unlabeled 100M', acc:true},
  {t:'지도 미세조정', s:'라벨+hard negative+지시문'},
  {t:'BGE', s:'small/base/large'}
 ]},

math:[
 {expr:'q\' = q ⊕ I_t   (지시문 I_t는 query에만 부착, passage는 그대로)',
  tex:'q^{\\prime} \\leftarrow q \\oplus I_t,\\qquad p^{\\prime} \\leftarrow p',
  d:'미세조정 단계에서 태스크별 지시문 $I_t$ 를 질의에만 이어붙인다. 같은 인코더가 지시문의 유무로 질의·문서 역할을 구분한다.'},
 {expr:'L = -log [ exp(sim(q\',p⁺)/τ) / Σ_j exp(sim(q\',p_j)/τ) ]   (in-batch + 1개 ANN hard negative)',
  tex:'\\mathcal{L}=-\\log\\frac{\\exp(\\text{sim}(q^{\\prime},p^{+})/\\tau)}{\\sum_{j}\\exp(\\text{sim}(q^{\\prime},p_j)/\\tau)}',
  d:'분모의 negative 집합 $\\{p_j\\}$ 에 in-batch negative뿐 아니라 ANN으로 채굴한 hard negative가 추가된다는 점이 E5의 순수 in-batch 방식과 다르다.'}
],

numbers:[
 {k:'C-MTP', v:'16개 소스 · 100M 쌍', d:'Wudao Corpora·Zhihu·과학문헌 등, unlabeled+labeled 합산'},
 {k:'C-MTEB', v:'6개 태스크 · 35개 데이터셋', d:'분류·클러스터링·재순위화·검색·STS·pair 분류'},
 {k:'중국어 벤치마크 향상폭', v:'+10%p 이상', d:'C-MTEB 전 항목에서 기존 중국어 임베딩 모델 대비'},
 {k:'모델 크기', v:'small 24M · base 102M · large 326M', d:'세 크기로 효율-성능 절충을 제공'},
 {k:'영어용 데이터', v:'200M 쌍', d:'C-MTP와 같은 방법으로 영어판도 별도 구축'},
 {k:'HuggingFace 다운로드', v:'2천만+ (2024-04 기준)', d:'가장 널리 쓰이는 오픈 임베딩 모델 중 하나로 자리잡음'}
],

impact:'BGE는 "모델 하나 공개"에서 "벤치마크+데이터+모델+레시피를 함께 공개"로 임베딩 연구의 공개 단위를 바꿨다. `query:`/`passage:` 프리픽스를 자연어 지시문으로 일반화한 것은 이후 대다수 오픈소스 임베딩 모델(GTE, Nomic Embed 등)의 표준이 됐고, ANN 기반 hard negative 채굴은 미세조정 단계의 사실상 표준 관행이 됐다. C-MTEB는 중국어권에서 MTEB와 동급의 권위를 얻었고, BGE 자체는 HuggingFace에서 가장 널리 쓰이는 임베딩 모델 계열 중 하나로 [RAG](#/p/rag) 파이프라인의 기본 리트리버로 흔히 쓰인다.',

legacy:[
 '**지시문 프리픽스의 자연어화** — 고정 태그(`query:`) 대신 태스크별 자연어 지시문을 쓰는 방식이 이후 임베딩 모델의 표준이 됨',
 '**벤치마크+데이터+모델 동시 공개 관행**이 이후 GTE, Nomic Embed, Jina Embeddings 등 오픈소스 임베딩 릴리스의 표준 형식이 됨',
 '**다국어·영어 확장** — 같은 레시피가 BGE-M3(다국어·다기능) 등 후속 모델로 이어지며 원래의 "중국어 전용" 범위를 넘어섬',
 '**RAG 리트리버의 기본값** — LangChain·LlamaIndex 등 주요 프레임워크에 기본 통합되며 실무 RAG 스택의 표준 구성요소가 됨'
],

pitfalls:[
 '**임베딩 모델을 BGE로 바꾸면 [HNSW](#/p/hnsw)/[FAISS](#/p/faiss) 인덱스를 전체 재구축해야 한다.** 특히 3단계 레시피로 학습된 벡터의 분포는 이전 모델과 달라, 부분 교체나 점진적 마이그레이션이 불가능하다.',
 '**지시문을 빼먹으면 성능이 떨어진다.** query에는 지시문을 붙이고 passage에는 붙이지 않는 비대칭 규칙을 지키지 않으면(둘 다 붙이거나 둘 다 생략) 학습 시 분포와 어긋난다.',
 '**C-MTEB/MTEB 순위가 실제 도메인 성능을 보장하지 않는다.** 벤치마크는 공개 데이터셋 35~56개의 평균일 뿐이라, 리더보드 경쟁이 과열되며 벤치마크 자체에 맞춰 모델을 조정하는 과적합 우려가 꾸준히 제기된다.'
],

figures:[
 {f:'fig2-recipe.png',
  cap:'C-Pack 3단계 학습 파이프라인: Web Corpora로 Pre-Trained Model을 만들고(사전학습), C-MTP(unlabeled)로 Intermediate Model을 만들고(대규모 약감독학습), C-MTP(labeled)로 Final Model을 만든다(지도 미세조정). 각 화살표 위 라벨이 그 단계의 이름.',
  src:'원문 Figure 2 하단, p.3'}
],

quotes:[
 {t:'C-Pack includes three critical resources. 1) C-MTP is a massive training dataset for text embedding... 2) C-MTEB is a comprehensive benchmark... 3) BGE is a family of embedding models covering multiple sizes.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2309.07597 — C-Pack: Packed Resources For General Chinese Embeddings', u:'https://arxiv.org/abs/2309.07597'},
 {t:'GitHub — FlagOpen/FlagEmbedding (BGE)', u:'https://github.com/FlagOpen/FlagEmbedding'},
 {t:'C-MTEB Leaderboard', u:'https://huggingface.co/spaces/mteb/leaderboard'}
]
});
