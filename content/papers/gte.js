WIKI.paper({
slug:'gte',
venue:'arXiv 2023 (Alibaba Group)',
authors:'Li, Zhang, Zhang, Long, Xie & Zhang (Alibaba Group)',
arxiv:'2308.03281',

tldr:'검색·분류·클러스터링·STS 등 서로 다른 작업에 각각 맞춰 학습하던 텍스트 임베딩을, **비지도 사전학습 + 지도 미세조정 2단계 대조학습**으로 통합한 범용 임베딩 모델. 110M 파라미터의 `GTE_base`가 OpenAI의 임베딩 API와 자기보다 훨씬 큰 모델들을 MTEB에서 앞질렀다.',

context:'2023년 텍스트 임베딩 연구는 갈라져 있었다. [SimCSE](#/p/simcse) 처럼 대칭적인 문장쌍(패러프레이즈)으로 학습한 모델은 검색(비대칭적인 질의-문서 관계)에 약했고, 반대로 검색 전용으로 학습한 모델은 문장 유사도(STS) 과제에서 약했다. 각 모델이 특정 과제의 학습 데이터·목적함수에만 맞춰져 있었기 때문이다. [MTEB](https://arxiv.org/abs/2210.07316) 벤치마크가 등장하면서 "여러 과제를 동시에 잘하는 범용 임베딩"이라는 목표가 측정 가능해졌지만, 기존 연구 대부분은 사전학습에 비공개 사내 데이터를 썼고, 공개 데이터만으로 어디까지 가능한지가 불분명했다. GTE는 전부 공개 데이터로 이 격차를 메우려 한 시도다.',

ideas:[
 {h:'2단계 대조학습: 약지도 사전학습 → 지도 미세조정',
  lead:'웹에서 자연 발생한 텍스트 쌍으로 먼저 대략적인 표현을 익히고, 사람이 라벨링한 데이터로 다듬는다.',
  d:'1단계는 CommonCrawl·Wikipedia·Reddit·StackExchange·arXiv 등 33개 공개 출처에서 뽑은 **약 8억 쌍**(제목-본문, 인용-피인용, 질문-답변 등)으로 대조학습한다. 2단계는 MS MARCO·NQ·MNLI·FEVER·Quora 등 사람이 라벨링한 약 300만 쌍(하드 네거티브 포함)으로 미세조정한다. [BERT](#/p/bert)의 MLM 목적과 임베딩의 대조학습 목적 사이 간극을 1단계가 메꾸는 역할을 한다.'},
 {h:'출처 불균형을 온도 있는 다항 샘플링으로 완화',
  lead:'데이터 출처마다 크기가 천차만별이라 $n_i^{0.5}$ 에 비례해 배치를 뽑는다.',
  d:'33개 출처의 크기가 3M~327M까지 100배 이상 차이 나기 때문에, 그대로 섞으면 큰 출처가 학습을 지배한다. 출처 $i$ 를 뽑을 확률을 $p_i \\propto n_i^{\\alpha}$ ($\\alpha=0.5$)로 두어 작은 출처의 비중을 인위적으로 키운다. 또한 같은 배치 안의 샘플은 전부 같은 과제 출처에서만 뽑아, 모델이 서로 다른 과제를 섞어 푸는 지름길을 배우지 않게 한다.'},
 {h:'양방향으로 확장한 대조 손실',
  lead:'배치 안의 문서뿐 아니라 질의끼리도, 그 반대 방향도 모두 네거티브로 쓴다.',
  d:'표준 InfoNCE는 질의 $q$ 대 문서 $d$ 방향만 본다. GTE는 분할함수 $Z$ 에 $q_i$-$d_j$, $q_i$-$q_j$, $q_j$-$d_i$, $d_i$-$d_j$ 네 항을 모두 포함시켜, 질의-문서 양방향과 질의끼리·문서끼리의 관계까지 한 번에 대조한다. 온도 $\\tau=0.01$, 유사도는 코사인 유사도를 쓴다.'},
 {h:'단계별로 배치 크기 전략을 바꾼다',
  lead:'1단계는 하드 네거티브 없이 큰 배치로, 2단계는 하드 네거티브로 작은 배치로도 충분하다.',
  d:'in-batch negative만 쓰는 1단계는 배치가 커야 네거티브가 많아져 유리하므로 배치 크기를 수만까지 키운다(메모리 절감 기법 병행). 2단계는 별도 리트리버로 채굴한 하드 네거티브가 이미 신뢰도 높은 그래디언트를 주므로, 글로벌 배치 128·그룹 크기 16(양성 1 + 네거티브 15)이면 충분하고 대신 최대 시퀀스 길이를 512로 늘려 긴 텍스트를 다룬다.'}
],

diagram:{type:'flow', cap:'두 단계 파이프라인. 1단계는 웹에서 자동으로 채굴한 대량 약지도 쌍, 2단계는 사람이 라벨링한 소량 다과제 데이터.',
 nodes:[
  {t:'웹 텍스트쌍', s:'~8억 쌍, 33개 출처'},
  {t:'비지도 대조 사전학습', s:'큰 배치·in-batch neg', acc:true},
  {t:'다과제 지도 데이터', s:'~300만 쌍'},
  {t:'지도 대조 미세조정', s:'하드 네거티브 포함'},
  {t:'범용 텍스트 임베딩', s:'small/base/large'}
 ]},

math:[
 {expr:'p_i = n_i^α / Σ_j n_j^α',
  tex:'p_i = \\dfrac{n_i^{\\alpha}}{\\sum_{j=1}^{m} n_j^{\\alpha}},\\qquad \\alpha=0.5',
  d:'$m$개 출처 중 $i$번째 출처(크기 $n_i$)에서 배치를 뽑을 확률. $\\alpha<1$ 이라 작은 출처가 크기 비율보다 더 자주 뽑힌다.'},
 {expr:'L_icl = -(1/n) Σ log[ e^{s(qi,di)/τ} / Z ],  Z = Σ e^{s(qi,dj)/τ} + Σ e^{s(qi,qj)/τ} + Σ e^{s(qj,di)/τ} + Σ e^{s(dj,di)/τ}',
  tex:'\\mathcal{L}_{icl}=-\\frac{1}{n}\\sum_{i=1}^{n}\\log\\frac{e^{s(q_i,d_i)/\\tau}}{Z},\\quad Z=\\sum_j e^{s(q_i,d_j)/\\tau}+\\sum_{j\\neq i} e^{s(q_i,q_j)/\\tau}+\\sum_j e^{s(q_j,d_i)/\\tau}+\\sum_{j\\neq i} e^{s(d_j,d_i)/\\tau}',
  d:'분할함수 $Z$ 에 질의-문서·질의-질의·문서-질의·문서-문서 네 방향 네거티브를 모두 넣은 양방향 대조 손실. $s(\\cdot,\\cdot)$ 는 코사인 유사도, $\\tau=0.01$.'}
],

numbers:[
 {k:'MTEB 평균(지도, 56개 데이터셋, 영어)', v:'GTE_base(110M) 62.4', d:'표 6 — OpenAI `text-embedding-ada-002`(61.0, 파라미터 비공개·추정 ~300M)와 InstructOR-XL(61.8, 1.5B), GTR-XXL(59.0, 4.5B)을 모두 상회'},
 {k:'MTEB 평균, GTE_large', v:'63.1 (330M)', d:'표 6 — InstructOR_large(61.6, 330M) 대비 +1.5점, 논문 시점 MTEB 최고 성능'},
 {k:'MTEB 평균(비지도, 웹 사전학습만)', v:'GTE_small(30M) 58.5 vs E5_large(330M) 56.4', d:'표 5 — 10배 작은 모델이 비지도 설정에서 더 높은 평균'},
 {k:'MTEB 평균(지도), 소형 모델 비교', v:'GTE_small(30M) 61.4 = E5_large(330M) 61.4', d:'표 6 — 10배 작은 GTE_small이 E5_large와 동률'},
 {k:'사전학습 규모', v:'~8억 쌍, 33개 공개 출처', d:'CommonCrawl·Wikipedia·Reddit·StackExchange·arXiv 등, 필터링 없이 그대로 사용'}
],

impact:'MTEB에서 순위를 다투던 이전 모델들이 각자 다른 (종종 비공개) 데이터를 쓰던 것과 달리, GTE는 **공개 데이터만으로 크기 대비 최상위 성능**을 재현 가능하게 보여줬다. "모델을 키우면 성능이 오른다"는 통념과 달리 110M 모델이 4.5B 모델을 넘어선 결과는, 텍스트 임베딩 품질이 파라미터 수보다 **데이터 다양성과 2단계 학습 전략**에 더 좌우된다는 것을 시사했다. 이후 공개 임베딩 모델 경쟁(BGE, [nomic-embed](#/p/nomic-embed) 등)이 같은 사전학습→미세조정 레시피를 표준으로 채택했다.',

legacy:[
 '**[nomic-embed](#/p/nomic-embed)** 가 GTE의 2단계 대조학습 레시피를 그대로 이어받으면서, 완전 공개(데이터·코드·가중치)라는 축으로 한 걸음 더 나아감',
 'MTEB 리더보드가 이후 "모델 크기 대비 성능" 축으로 재편되며, BGE·[nomic-embed](#/p/nomic-embed) 등 후속 공개 임베딩 모델들이 GTE와 같은 체급 비교표를 관행으로 채택',
 '코드를 별도 처리 없이 텍스트로 취급해도 코드 검색이 되는 결과가, 이후 범용 임베딩 모델이 코드 검색까지 하나의 모델로 흡수하는 흐름으로 이어짐',
 '양방향 대조 손실(질의-질의·문서-문서 항 추가)이 이후 공개 임베딩 모델들의 손실 설계에 참고 지점이 됨'
],

pitfalls:[
 '**MTEB 평균 하나만 보고 비교하면 안 된다.** 표 6은 12개 하위 과제군(분류·클러스터링·검색·STS 등)의 평균이라, 특정 과제(예: 검색만)에서는 순위가 달라질 수 있다. 본문의 62.4·63.1은 반드시 "지도 설정, 56개 데이터셋 평균" 조건과 함께 읽어야 한다.',
 '**OpenAI ada-002와의 비교에서 파라미터 수는 추정치다.** 논문 각주는 "정확한 크기는 비공개이며 BERT-large급(~300M)으로 추정"이라고 명시한다 — "10배 작다"는 문구를 정확한 배수로 오해하지 않는다.',
 '**비지도(표 5)와 지도(표 6) 결과를 섞어 인용하지 않는다.** 같은 GTE_small이라도 비지도 58.5와 지도 61.4는 다른 설정의 수치다.'
],

figures:[
 {f:'fig1-pipeline.png',
  cap:'왼쪽이 1단계(비지도 사전학습) — CommonCrawl·Wikipedia·Reddit·StackOverflow·arXiv 등 다양한 웹 출처에서 텍스트쌍을 채굴한다. 화살표를 건너 오른쪽이 2단계(지도 미세조정) — Web Search·Open QA·NLI·Paraphrase 등 사람이 라벨링한 과제별 데이터셋으로 다시 학습한다. 두 단계가 서로 다른 데이터 성격(자동 채굴 vs 사람 라벨링)을 쓴다는 것이 그림의 핵심.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'Notably, even with a relatively modest parameter count of 110M, GTEbase outperforms the black-box embedding API provided by OpenAI and even surpasses 10x larger text embedding models on the massive text embedding benchmark.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2308.03281 — Towards General Text Embeddings with Multi-stage Contrastive Learning', u:'https://arxiv.org/abs/2308.03281'},
 {t:'gte-large (HuggingFace)', u:'https://huggingface.co/thenlper/gte-large'}
]
});
