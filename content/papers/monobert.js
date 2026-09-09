WIKI.paper({
slug:'monobert',
venue:'arXiv preprint, 2019',
authors:'Nogueira & Cho (New York University)',
arxiv:'1901.04085',

tldr:'질의와 문서를 한 시퀀스로 이어붙여 [BERT](#/p/bert)에 통째로 넣고 `[CLS]` 벡터 하나로 관련성을 채점하는, 재랭킹 방법 중 가장 단순한 형태로 MS MARCO·TREC-CAR SOTA를 큰 폭으로 갈아치운 논문. 검색이 통계 함수에서 신경망으로 넘어간 전환점이다.',

context:'2019년 이전 신경망 검색 모델 — DRMM, KNRM, Conv-KNRM, DUET — 은 대체로 [BM25](#/p/bm25) 위에 얕은 매칭 신호를 얹는 정도였고, [Lin(2019)이 "약한 기준선과의 비교"](https://arxiv.org/abs/1904.07094)라고 비판할 만큼 개선폭이 크지 않았다. 이유는 단순했다 — 학습시킬 대규모 질의-문서 쌍 데이터도, 문맥을 깊게 이해하는 사전학습 모델도 아직 갖춰지지 않았기 때문이다. 2019년 초 두 조건이 동시에 갖춰진다. 100만 개 실사용자 질의를 담은 MS MARCO 데이터셋이 나왔고, [BERT](#/p/bert)라는 범용 사전학습 인코더가 이미 여러 NLP 과제를 갈아치운 뒤였다. 저자들의 질문은 단순하다 — **BERT를 재랭킹에 그대로 갖다 쓰면 얼마나 좋아지는가?**',

ideas:[
 {h:'Cross-encoder: 질의와 문서를 한 시퀀스로 합친다',
  lead:'`[CLS] 질의 [SEP] 문서 [SEP]` 하나를 BERT에 통째로 넣어 self-attention이 질의-문서 토큰 쌍을 전부 직접 비교하게 한다.',
  d:'[DPR](#/p/dpr) 같은 bi-encoder는 질의와 문서를 따로 인코딩해 벡터만 비교하지만, 여기서는 애초에 둘을 한 입력으로 합친다. BERT의 12/24층 self-attention이 모든 질의-문서 토큰 쌍의 상호작용을 직접 계산하므로 얕은 매칭보다 훨씬 정교한 관련성 판단이 가능하다. 대신 질의마다 후보 문서 수만큼 BERT를 처음부터 다시 돌려야 한다.'},
 {h:'점수는 `[CLS]` 벡터 하나에서 나온다',
  lead:'`[CLS]` 최종 은닉 벡터를 단일 선형층에 통과시켜 관련성 확률 하나로 압축한다.',
  d:'질의는 최대 64토큰, 질의+문서+구분자 전체는 최대 512토큰으로 자른다. `[CLS]` 벡터를 이진분류기(선형층 1개)에 넣어 "이 문서가 관련 있는가"의 확률 $s_i$ 를 얻고, 후보 문서들을 이 확률로 정렬해 최종 순위를 만든다. 구조상 새로운 부품은 없다 — BERT 위에 분류 헤드 하나를 얹은 것이 전부다.'},
 {h:'2단계 파이프라인의 재랭커로 설계됐다',
  lead:'전체 코퍼스를 스캔하지 않고 [BM25](#/p/bm25)가 추린 top-1000 후보만 재정렬한다.',
  d:'BERT로 코퍼스 전체를 매 질의마다 스캔하는 것은 계산상 불가능하다. 그래서 1단계로 [BM25](#/p/bm25)가 후보 1,000개를 빠르게 추리고, 2단계에서 monoBERT가 그 후보만 정교하게 재정렬한다. 이 retrieve-then-rerank 구조가 이후 신경망 검색 파이프라인의 기본형이 됐다.'},
 {h:'적은 데이터로도 즉시 이전 SOTA를 넘는다',
  lead:'전체 학습 데이터의 0.3%도 안 되는 10만 쌍만으로 이전 최고 성능(IR-NET)을 앞섰다.',
  d:'MS MARCO 학습셋은 약 4억 쌍이지만, 10만 쌍(0.3% 미만)만으로 파인튜닝해도 이전 비지도 SOTA IR-NET보다 MRR@10이 1.4점 높았다. 사전학습된 언어 표현이 이미 대부분의 일을 해 놓았다는 뜻이며, 이는 사전학습-파인튜닝 패러다임이 검색에도 그대로 통한다는 실증이었다.'},
 {h:'손실 함수는 이진 교차엔트로피 그대로',
  lead:'관련 문서 집합과 비관련 문서 집합에 대한 로그우도를 더하는, 새로울 것 없는 형태다.',
  d:'관련 문서 인덱스 집합 $J_{pos}$, 비관련 집합 $J_{neg}$ 에 대해 표준 이진 교차엔트로피를 최소화한다. 아키텍처도 손실 함수도 새로 발명한 것이 없다는 점이 오히려 이 논문의 메시지다 — **BERT를 있는 그대로 옮기기만 해도 충분했다.**'}
],

diagram:{type:'flow', cap:'질의와 문서를 한 시퀀스로 합쳐 BERT에 넣고 CLS 벡터 하나로 관련성 점수를 낸다.',
 nodes:[
  {t:'질의+문서 결합', s:'[CLS]q[SEP]d[SEP]'},
  {t:'BERT 인코더', s:'12/24층 self-attn', acc:true},
  {t:'CLS 벡터', s:'768/1024d'},
  {t:'선형+시그모이드', s:'관련성 점수 s'}
 ]},

math:[
 {expr:'L = -Σ_{j∈Jpos} log(sj) - Σ_{j∈Jneg} log(1-sj)',
  tex:'L=-\\sum_{j\\in J_{\\text{pos}}}\\log(s_j)-\\sum_{j\\in J_{\\text{neg}}}\\log(1-s_j)',
  d:'$J_{pos}$·$J_{neg}$ 는 BM25로 뽑은 top-1000 후보 중 관련·비관련으로 표시된 문서의 인덱스 집합. $s_j$ 는 CLS 벡터에서 나온 관련성 확률.'},
 {expr:'si = σ( wᵀ · CLS(query, di) )',
  tex:'s_i=\\sigma\\!\\left(w^{\\top}\\,\\text{CLS}(q, d_i)\\right)',
  d:'문서 $d_i$ 하나에 대해 질의와 함께 BERT를 통과시켜 얻은 CLS 벡터를 단일 가중치 벡터 $w$ 로 사영하고 시그모이드를 씌운 값이 최종 점수다.'}
],

numbers:[
 {k:'MS MARCO MRR@10 (Eval)', v:'35.8', d:'BERT Large. 이전 SOTA IR-NET(28.1) 대비 상대 **+27%**'},
 {k:'TREC-CAR MAP (Test)', v:'33.5', d:'BM25(Anserini, 튜닝) 15.3의 두 배 이상, BERT Base도 31.0'},
 {k:'BM25 후보 수', v:'top-1,000', d:'재랭커는 전체 코퍼스가 아니라 BM25가 추린 이 범위만 처리'},
 {k:'데이터 효율', v:'10만 쌍', d:'전체 학습셋의 0.3% 미만으로도 IR-NET 대비 +1.4 MRR@10 우위 (Fig.1)'},
 {k:'학습 규모', v:'batch 128×512토큰 · 10만 iter', d:'TPU v3-8, 약 30시간 — 전체 학습셋의 2% 미만만 사용'}
],

impact:'monoBERT는 새 구조를 발명하지 않고도 재랭킹 성능을 단번에 끌어올려, **"BERT를 그대로 얹기만 해도 이긴다"**는 것을 증명했다. 이후 MS MARCO 리더보드는 몇 달 만에 BERT 계열 재랭커로 뒤덮였고, 검색 연구의 무게중심이 손으로 설계한 매칭 함수에서 사전학습 인코더 활용법으로 옮겨갔다. 동시에 이 구조의 약점 — 후보 문서마다 BERT를 통째로 다시 돌려야 하는 추론 비용 — 이 다음 세대 연구의 출발점이 됐다.',

legacy:[
 '**Cross-encoder 재랭커의 표준 구성이 됨** — 이후 재랭킹 연구 대부분이 monoBERT를 baseline이자 구성요소로 사용',
 '[ColBERT](#/p/colbert)가 이 방식의 **느린 추론**(후보마다 전체 BERT forward) 문제를 late interaction으로 풀며 등장',
 '[BM25](#/p/bm25) 1단계 + BERT 2단계라는 retrieve-then-rerank 구조가 이후 검색 파이프라인의 기본형으로 정착',
 'monoT5·duoBERT 등 "mono/duo" 계열 재랭커 명명이 이 논문에서 시작'
],

pitfalls:[
 '**느리다.** 질의마다 후보 1,000개 각각에 대해 BERT forward를 새로 돌려야 해서 온라인 서빙 비용이 크다 — 이 문제가 [ColBERT](#/p/colbert)의 직접적인 동기다.',
 '**재현율은 1단계에 갇힌다.** [BM25](#/p/bm25)가 애초에 후보에 넣지 못한 관련 문서는 monoBERT가 아무리 정교해도 재랭킹 대상이 되지 못한다.',
 '**"monoBERT"라는 이름은 원 논문에 없다.** 논문 제목은 "Passage Re-ranking with BERT"이고, mono라는 이름은 duoBERT 등 후속 논문이 구분을 위해 붙였다.'
],

figures:[
 {f:'fig1-training-curve.png',
  cap:'x축은 로그 스케일 학습 질의-문서 쌍 수(1천~1억), y축은 MRR@10. 점선이 이전 SOTA인 IR-NET. 파란 선(BERT Large)은 10만 쌍 지점에서 이미 점선을 넘어서고, 그 이후로는 데이터를 더 넣어도 이득이 빠르게 줄어든다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'Our system is the state of the art on the TREC-CAR dataset and the top entry in the leaderboard of the MS MARCO passage retrieval task, outperforming the previous state of the art by 27% (relative) in MRR@10.',
  src:'Abstract, p.1'},
 {t:'We found that the pretrained models used in this work require few training examples from the end task to achieve a good performance.',
  src:'§3.3, p.3'}
],

links:[
 {t:'arXiv 1901.04085 — Passage Re-ranking with BERT', u:'https://arxiv.org/abs/1901.04085'},
 {t:'GitHub — dl4marco-bert (공식 코드)', u:'https://github.com/nyu-dl/dl4marco-bert'},
 {t:'MS MARCO 리더보드', u:'https://microsoft.github.io/msmarco/'}
]
});
