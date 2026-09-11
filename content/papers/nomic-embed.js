WIKI.paper({
slug:'nomic-embed',
venue:'TMLR 2025 (arXiv 2024)',
authors:'Nussbaum, Morris, Duderstadt & Mulyar (Nomic AI · Cornell University)',
arxiv:'2402.01613',

tldr:'가중치만 공개하던 기존 임베딩 모델과 달리 **학습 데이터·코드·가중치를 전부 공개**한 8192토큰 긴 문맥 텍스트 임베딩 모델. 137M 파라미터로 짧은 문맥([MTEB](https://arxiv.org/abs/2210.07316))과 긴 문맥(LoCo) 벤치마크 모두에서 OpenAI `text-embedding-ada-002`·`text-embedding-3-small`을 앞선다.',

context:'2024년 초 상위권 오픈소스 임베딩 모델([E5](#/p/e5)·[GTE](#/p/gte)·BGE)은 문맥 길이가 512토큰으로 묶여 있었고, 2048토큰을 넘는 긴 문맥 모델은 거의 전부 비공개([Voyage](https://arxiv.org/abs/2401.07049), OpenAI ada-002)였다. 유일한 오픈 긴 문맥 모델이던 jina-embeddings-v2조차 짧은 문맥에서는 ada-002를 넘지 못했다. 더 근본적인 문제는 **재현 불가능성**이었다 — E5도, GTE도 논문에는 "약지도 데이터를 필터링해서 썼다"고만 적혀 있을 뿐, 어떤 필터링 모델을 어떻게 학습했는지, 데이터 자체가 무엇인지는 공개하지 않았다. 가중치만 열려 있고 재현 경로는 닫혀 있었다.',

ideas:[
 {h:'BERT를 긴 문맥용으로 개조한 nomic-bert-2048',
  lead:'절대위치 대신 RoPE, GeLU 대신 SwiGLU, 여기에 FlashAttention을 더해 8192토큰까지 확장 가능한 인코더를 만든다.',
  d:'표준 [BERT](#/p/bert) 구조에서 절대 위치 임베딩을 [RoPE](#/p/rope)로, 활성함수를 [SwiGLU](#/p/glu-variants)로 바꾸고 [FlashAttention](#/p/flashattention)을 적용해 nomic-bert-2048을 학습한다. SwiGLU는 GeGLU보다 FlashAttention과 결합했을 때 약 25% 빠르다고 보고한다. 2048토큰으로 MLM 사전학습한 뒤, RoPE의 주파수를 보간하는 방식으로 추론 시 8192토큰까지 외삽한다.'},
 {h:'3단계 학습: MLM → 약지도 대조 사전학습 → 지도 미세조정',
  lead:'BERT류 사전학습 위에 대량의 약지도 쌍으로 먼저 다듬고, 소량의 고품질 라벨 데이터로 마무리한다.',
  d:'1단계는 표준 마스킹 언어모델링(nomic-bert-2048). 2단계는 29개 공개 출처에서 모은 4억 7천만 쌍을 일관성 필터링해 걸러낸 약 2억 3,500만 쌍으로 InfoNCE 대조학습한다. 3단계는 MS MARCO·NQ·NLI·HotpotQA·FEVER 등에서 뽑은 160만 개의 사람이 라벨링한 쌍(하드 네거티브 포함, [GTE](#/p/gte)로 채굴)으로 미세조정한다.'},
 {h:'단방향 대조 손실 + 태스크 프리픽스로 용도를 구분',
  lead:'같은 인코더가 검색·분류·클러스터링에서 다르게 행동하도록 입력 앞에 태스크 이름을 붙인다.',
  d:'"프랑스의 수도는 어디인가?"라는 질의에 대해 의미 유사도 관점에서는 "프랑스 수도의 이름은?"이 가깝고, 질의응답 관점에서는 "파리가 프랑스의 수도다"가 가깝다 — 같은 질의에 상반된 정답을 요구하는 셈이다. `search_query`/`search_document`(비대칭 검색)·`classification`(대칭 STS)·`clustering` 네 가지 프리픽스를 입력 앞에 붙여 이 모호성을 없앤다. 또한 문서→질의 방향을 추가하는 기존 양방향 손실과 달리 질의→문서 **단방향** InfoNCE만 쓴다.'},
 {h:'일관성 필터링: 자기 자신으로 데이터를 정제',
  lead:'초벌로 학습한 모델의 임베딩 유사도가 낮은 쌍을 노이즈로 보고 걸러낸다.',
  d:'노이즈 섞인 웹 쌍 4억 7천만 개에서, 초벌 대조학습 모델이 계산한 코사인 유사도가 낮은 쌍을 제거해 2억 3,500만 개로 줄인다. 저자들은 이 필터링 모델 자체와 기준을 논문·공개 코드에 그대로 남겨, "무엇을 왜 걸렀는지"까지 재현 가능하게 했다는 점을 [E5](#/p/e5)·[GTE](#/p/gte)와의 핵심 차이로 강조한다.'}
],

diagram:{type:'flow', cap:'BERT를 긴 문맥용으로 바꾼 뒤 대조학습 2단계를 더 얹는다. 각 단계의 데이터·코드·가중치를 전부 공개한 것이 이 논문의 핵심 주장.',
 nodes:[
  {t:'BERT 개조', s:'RoPE·SwiGLU·FlashAttn', acc:true},
  {t:'약지도 대조 사전학습', s:'2.35억 쌍, 필터링됨'},
  {t:'지도 미세조정', s:'160만 쌍, 태스크 프리픽스'},
  {t:'8192토큰 임베딩', s:'RoPE 외삽'}
 ]},

math:[
 {expr:'L = -log[ e^{s(q,d+)/τ} / (e^{s(q,d+)/τ} + Σ_{d-} e^{s(q,d-)/τ}) ]',
  tex:'\\mathcal{L}=-\\log\\frac{e^{s(q,d^{+})/\\tau}}{e^{s(q,d^{+})/\\tau}+\\sum_{d^{-}} e^{s(q,d^{-})/\\tau}}',
  d:'질의 $q$ 에서 문서 방향으로만 계산하는 단방향 InfoNCE. 하드 네거티브 $d_{hn}$ 을 포함하도록 분할함수를 확장해 지도 미세조정 단계에 쓴다.'}
],

numbers:[
 {k:'MTEB 평균 (137M, 영어)', v:'62.39', d:'표 1 — OpenAI text-embedding-ada-002(60.99), jina-embeddings-base-v2(60.39)보다 높고 text-embedding-3-small(62.26)과 동급'},
 {k:'LoCo (긴 문맥 검색)', v:'85.53', d:'표 1 — ada-002(52.7)·text-embedding-3-small(82.4)을 모두 상회, 공개 모델 중 유일하게 두 벤치마크 동시 우위'},
 {k:'Jina Long Context 벤치마크', v:'54.16', d:'표 1 — jina-embeddings-base-v2(51.90)보다 높지만 text-embedding-3-small(58.21)에는 못 미침'},
 {k:'문맥 길이', v:'8192 토큰', d:'2048토큰으로 사전학습 후 RoPE 보간으로 외삽; 대부분의 오픈소스 경쟁 모델(E5·GTE·BGE)은 512토큰 한계'},
 {k:'약지도 사전학습 데이터', v:'4.7억 쌍 → 필터링 후 2.35억 쌍', d:'29개 공개 출처, 일관성 필터링으로 절반 가까이 제거'}
],

impact:'"가중치 공개"와 "재현 가능"이 다르다는 것을 보여준 사례다. 데이터·필터링 기준·학습 코드까지 전부 공개함으로써, 다른 연구자가 정확히 같은 파이프라인으로 모델을 다시 만들 수 있게 했다. 8192토큰 문맥은 실무에서 RAG의 청크 크기를 줄이지 않고 문서 전체(또는 긴 섹션)를 한 번에 임베딩할 수 있게 해, 짧은 문맥 모델이 강제하던 잦은 chunking·문맥 손실 문제를 완화한다.',

legacy:[
 '**완전 공개 임베딩 모델의 기준점** — 이후 공개를 표방하는 임베딩 모델들이 데이터·필터링 기준까지 공개하는 관행을 참조',
 '**[GTE](#/p/gte)의 2단계 레시피를 계승·확장** — 약지도 사전학습+지도 미세조정 구조는 그대로 두고 긴 문맥·완전 재현성 축을 추가',
 'RoPE 기반 BERT 개조(nomic-bert-2048)가 긴 문맥 인코더를 만드는 표준 레시피 중 하나로 참조됨',
 '태스크 프리픽스(`search_query`/`search_document` 등)가 이후 다른 공개 임베딩 모델의 API 관행으로 확산'
],

pitfalls:[
 '**"모든 벤치마크에서 최고"가 아니다.** Jina Long Context 벤치마크에서는 text-embedding-3-small(58.21)에 못 미친다(54.16). 표 1의 세 벤치마크(MTEB·LoCo·JinaLC) 결과를 함께 봐야 한다.',
 '**ablated 버전과 혼동하지 않는다.** `nomic-embed-text-v1-ablated`(FEVER·HotpotQA·MEDI 제외 학습)는 MTEB 61.36으로 정식 버전(62.39)보다 낮다 — 이는 일부 벤치마크 데이터셋이 MTEB 학습 데이터와 겹치는 문제를 검증하기 위한 대조군이다.',
 '**8192토큰은 사전학습이 아니라 RoPE 외삽으로 확보한 길이다.** MLM 사전학습 자체는 2048토큰에서 이뤄지므로, 극단적으로 긴 입력에서는 절대적인 문맥 이해보다 위치 인코딩의 보간 품질에 성능이 좌우될 수 있다.'
],

figures:[
 {f:'fig1-benchmark.png',
  cap:'세 벤치마크(MTEB·LoCo·JinaLC)에서 Nomic Embed(파란색)와 Jina Base V2·OpenAI 두 모델을 막대로 비교. LoCo(긴 문맥) 행에서 Nomic Embed가 85.53으로 가장 길게 뻗어 있고, ada-002(52.7)는 짧은 문맥(MTEB)에서는 준수하지만 긴 문맥(LoCo)에서 급격히 짧아지는 것이 한눈에 보인다 — "짧은 문맥에서 잘하는 모델이 긴 문맥에서도 잘하는 것은 아니다"라는 논문의 핵심 주장이 이 대비에 있다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'This technical report describes the training of nomic-embed-text-v1, the first fully reproducible, open-source, open-weights, open-data, 8192 context length English text embedding model.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2402.01613 — Nomic Embed', u:'https://arxiv.org/abs/2402.01613'},
 {t:'contrastors (학습 코드, GitHub)', u:'https://github.com/nomic-ai/contrastors'}
]
});
