WIKI.paper({
slug:'e5',
venue:'arXiv 2022 (Microsoft, TMLR 2024)',
authors:'Wang et al. (Microsoft Corporation)',
arxiv:'2212.03533',

tldr:'라벨 없는 (질의, 문단) 쌍 2억7천만 개로 대조 사전학습한 뒤 소량의 라벨 데이터로 미세조정하는 2단계 레시피로, 라벨 없이도 `BM25`를 이기는 첫 임베딩 모델을 만들었다. `query:`/`passage:` 프리픽스로 하나의 인코더가 비대칭 검색을 처리한다.',

context:'[SimCSE](#/p/simcse)와 [Sentence-BERT](#/p/sentence-bert)는 NLI처럼 사람이 라벨링한 문장 쌍 몇만 개로 대조학습을 했다. 규모가 작다 보니 도메인이 좁고, 웹 규모로 확장하기 어려웠다. 반대로 random cropping 같은 휴리스틱으로 쌍을 만드는 방법은 라벨 없이도 대량 생성은 되지만 잡음이 심해 품질이 떨어졌다. 검색 쪽에서는 [DPR](#/p/dpr)이 질의-문서 쌍에 사람이 단 라벨을 요구했다. E5의 질문은 "웹에 이미 존재하는 자연 발생 (질의, 문단) 쌍을 대량으로 긁어 잡음을 걸러내면, 라벨 없이도 DPR급 검색 임베딩을 학습할 수 있는가"다.',

ideas:[
 {h:'CCPairs: 웹에서 자연 발생한 쌍을 수확한다',
  lead:'Reddit·StackExchange·위키피디아·논문 인용 등에서 (질의,문단) 쌍 13억 개를 모은다.',
  d:'Reddit의 (게시물,댓글), StackExchange의 (질문,채택답변), 위키피디아의 (표제어+절 제목,본문), 논문의 (제목,초록) 등 이미 웹에 짝지어 존재하는 텍스트 쌍을 자동으로 긁는다. 사람이 새로 라벨을 달 필요가 없다. 필터링 전 13억 쌍(대부분 Reddit·CommonCrawl)이 모인다.'},
 {h:'Consistency filter: 모델이 스스로 잡음을 거른다',
  lead:'1.3B 쌍으로 초벌 학습한 모델이 자기 예측과 일치하는 쌍만 남겨 2.7억 개로 정제한다.',
  d:'13억 개 원시 쌍으로 먼저 모델을 학습시킨 뒤, 그 모델로 각 쌍을 100만 개 무작위 문단 풀과 비교해 순위를 매긴다. top-$k$($k=2$) 안에 드는 쌍만 남긴다. 신경망이 시끄러운 라벨에서도 깨끗한 패턴을 먼저 외운다는 memorization 특성을 이용한 자기 정제다. 이 단계를 거쳐 2.7억 개(CCPairs)로 줄어든다.'},
 {h:'query:/passage: 프리픽스로 비대칭성을 명시한다',
  lead:'같은 인코더에 역할을 나타내는 텍스트 프리픽스만 붙여 질의와 문서를 구분한다.',
  d:'질의와 문서는 길이·역할이 다른데도 하나의 공유 인코더를 쓴다. 대신 입력 앞에 `"query: "` 또는 `"passage: "` 문자열을 붙여 대칭을 깬다. 두 인코더 파라미터는 공유(share)하고, 각 출력을 average pooling한 뒤 내적으로 유사도를 낸다. 태스크마다 다른 모델을 두지 않고 프리픽스 하나로 검색·클러스터링·분류를 겸용하는 general-purpose 임베딩을 지향한다.'},
 {h:'대조 사전학습 → 소량 라벨 미세조정의 2단계',
  lead:'CCPairs로 대규모 대조 사전학습을 한 뒤 MS-MARCO 등 소량 라벨로 미세조정한다.',
  d:'1단계는 in-batch negative를 쓴 InfoNCE로 CCPairs 전체를 학습한다(라벨 불필요). 2단계는 사람이 단 라벨(MS-MARCO, NLI, NQ 등)로 짧게 미세조정해 hard negative까지 반영한다. 사전학습만 한 `E5-PT`도 `BM25`를 능가하지만, 미세조정을 거치면 격차가 크게 벌어진다.'}
],

diagram:{type:'flow', cap:'CCPairs 구축(왼쪽)과 학습 시점 구조(오른쪽). 두 인코더는 파라미터를 공유하고 프리픽스로만 역할을 구분한다.',
 nodes:[
  {t:'웹 소스', s:'Reddit·위키·논문'},
  {t:'수확', s:'1.3B 원시 쌍'},
  {t:'일관성 필터', s:'top-k=2 자기검증', acc:true},
  {t:'CCPairs', s:'270M 쌍'},
  {t:'대조 사전학습', s:'query:/passage: 프리픽스'}
 ]},

math:[
 {expr:'L = -log [ exp(sim(q,p⁺)/τ) / Σ_j exp(sim(q,p_j)/τ) ]',
  tex:'\\mathcal{L}=-\\log\\frac{\\exp(\\text{sim}(q,p^{+})/\\tau)}{\\sum_{j}\\exp(\\text{sim}(q,p_j)/\\tau)}',
  d:'InfoNCE 손실. 배치 안의 다른 문단들이 자동으로 negative가 되는 in-batch negative 방식이라, 배치 크기가 클수록 negative가 많아져 성능이 오른다.'},
 {expr:'E_q = AvgPool(Encoder("query: " + q)),  E_p = AvgPool(Encoder("passage: " + p))',
  tex:'E_q=\\text{AvgPool}(\\text{Encoder}(\\texttt{"query: "}+q)),\\quad E_p=\\text{AvgPool}(\\text{Encoder}(\\texttt{"passage: "}+p))',
  d:'같은 인코더 가중치를 공유하되 입력 프리픽스만 바꿔 질의·문서 임베딩을 만든다. 유사도는 $E_q \\cdot E_p$ 내적.'}
],

numbers:[
 {k:'CCPairs 규모', v:'1.3B → 270M', d:'consistency filter로 원시 13억 쌍을 2.7억으로 정제'},
 {k:'BEIR (zero-shot, 사전학습만)', v:'`BM25` 첫 추월', d:'라벨 없이 `BM25`를 이긴 첫 임베딩 모델이라고 주장'},
 {k:'MTEB 평균 (E5-large, 미세조정)', v:'61.4', d:'56개 데이터셋 영어 서브셋 평균 점수'},
 {k:'파라미터 대비 성능', v:'40배 작은 모델', d:'`GTR-XXL`(4.8B) 등 훨씬 큰 모델을 능가한다고 보고'},
 {k:'모델 크기', v:'E5-small/base/large', d:'각각 MiniLM·BERT-base·BERT-large 초기화, 110M~330M'},
 {k:'NQ 검색 nDCG@10 (미세조정)', v:'62.9 (E5-large)', d:'`ANCE`(44.6)·`ColBERT`(52.4)·`GTR-large`(54.7) 상회'}
],

impact:'E5는 "임베딩 모델도 웹 스케일 약감독 사전학습 + 소량 미세조정"이라는, 언어모델 사전학습 레시피를 검색 임베딩에 그대로 옮겼다. `query:`/`passage:` 프리픽스는 이후 [BGE](#/p/bge)를 비롯한 대다수 오픈소스 임베딩 모델의 표준 관행이 되었고, 하나의 모델이 검색·클러스터링·분류·[RAG](#/p/rag)용 리트리버를 겸하는 general-purpose embedding이라는 개념을 정착시켰다. MTEB 벤치마크가 사실상 임베딩 모델의 표준 리더보드로 자리잡는 데도 이 논문의 영향이 크다.',

legacy:[
 '**[BGE](#/p/bge)**가 CCPairs식 약감독 대조 사전학습과 프리픽스 관행을 이어받아 다단계 학습(C-Pack) 레시피로 발전시켰다',
 '**instruction 프리픽스의 일반화** — 이후 임베딩 모델들이 `"query: "` 같은 고정 문자열 대신 태스크별 자연어 지시문("Represent this sentence for retrieval:")으로 확장',
 '**MTEB 시대의 개막** — E5 이후 임베딩 모델 경쟁이 사실상 MTEB 리더보드 순위 경쟁으로 수렴',
 '**consistency filter류의 자기정제 기법**이 이후 대규모 약감독 데이터 큐레이션의 표준 도구로 자리잡음'
],

pitfalls:[
 '**프리픽스를 빼먹으면 성능이 크게 떨어진다.** E5 계열 모델은 학습 시 `query:`/`passage:` 프리픽스를 붙였으므로, 추론에서 이를 생략하면 학습 분포와 어긋나 검색 품질이 눈에 띄게 나빠진다.',
 '**임베딩 모델을 E5로 바꾸면 [HNSW](#/p/hnsw)/[FAISS](#/p/faiss) 인덱스를 전체 재구축해야 한다.** 차원·분포가 다른 새 벡터는 기존 인덱스와 호환되지 않으므로, 수십억 벡터 규모에서는 재임베딩·재인덱싱 비용이 모델 성능 향상분을 상쇄할 수 있다.',
 '**MTEB 상위권 = 실무 도메인 최적은 아니다.** MTEB는 56개 공개 데이터셋의 평균일 뿐, 특정 도메인(법률·의료·사내 문서)으로 이동하면 순위가 뒤집히는 경우가 흔하다.'
],

figures:[
 {f:'fig1-pipeline.png',
  cap:'왼쪽: 13억 원시 쌍이 consistency filter를 거쳐 2.7억 CCPairs로 줄어드는 큐레이션 파이프라인. 오른쪽: 두 인코더가 파라미터를 공유(share)하며 입력 앞의 "query: "/"passage: " 문자열만으로 역할을 구분하는 학습 구조 — average pool 후 내적(⊗)으로 유사도를 낸다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'For zero-shot settings, E5 is the first model that outperforms the strong BM25 baseline on the BEIR retrieval benchmark without using any labeled data.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2212.03533 — Text Embeddings by Weakly-Supervised Contrastive Pre-training', u:'https://arxiv.org/abs/2212.03533'},
 {t:'GitHub — microsoft/unilm (E5)', u:'https://github.com/microsoft/unilm/tree/master/e5'},
 {t:'MTEB Leaderboard', u:'https://huggingface.co/spaces/mteb/leaderboard'}
]
});
