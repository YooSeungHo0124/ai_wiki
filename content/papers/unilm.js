WIKI.paper({
slug:'unilm',
venue:'NeurIPS 2019',
authors:'Dong, Yang, Wang, Wei et al. (Microsoft Research)',
arxiv:'1905.03197',

tldr:'하나의 Transformer를 **세 가지 self-attention 마스크**(양방향·단방향·seq2seq)로 번갈아 학습시켜, 같은 파라미터로 언어 이해(NLU)와 생성(NLG)을 동시에 잘하게 만든 모델.',

context:'[BERT](#/p/bert)는 양방향 마스킹 덕에 이해 과제에서 강했지만, 그 양방향성 자체가 발목을 잡았다. 디코딩은 왼쪽에서 오른쪽으로 한 토큰씩 생성해야 하는데, BERT는 애초에 전체 문맥을 다 보고 채우도록 학습돼서 자기회귀 생성에 자연스럽게 맞지 않는다. GPT는 반대로 왼쪽 문맥만 보아 생성에는 맞지만 이해 과제에서 BERT에 못 미쳤다. 결국 이해용 모델과 생성용 모델을 따로 학습·배포해야 했다. 이 논문의 질문은, **구조를 두 개 만들 필요 없이 마스크만 바꿔 가며 하나의 Transformer로 둘 다 학습시킬 수 있는가**이다.',

ideas:[
 {h:'네 가지 cloze 과제를 한 모델에 섞어 학습',
  lead:'좌→우, 우→좌, 양방향, seq2seq 마스크를 같은 배치 안에서 번갈아 쓴다.',
  d:'마스킹된 토큰을 주변 문맥으로 맞히는 cloze 방식은 [BERT](#/p/bert)와 같지만, "주변 문맥이 무엇인가"를 self-attention 마스크로 매번 바꾼다. 한 배치 안에서 1/3은 양방향 LM, 1/3은 seq2seq LM, 나머지 1/3을 좌→우·우→좌로 반씩 나눠 샘플링한다. 네 목적이 **같은 파라미터**를 공유하므로 모델이 하나뿐이다.'},
 {h:'attention 마스크 하나로 방향성을 조절',
  lead:'마스크 행렬 M의 원소를 0 또는 $-\\infty$로 바꿔 self-attention을 부분 attention으로 좁힌다.',
  d:'모든 목적이 동일한 self-attention 수식 $\\text{softmax}(QK^\\top/\\sqrt{d_k}+M)V$ 를 쓴다. 양방향이면 M이 전부 0(모든 토큰이 서로 보임), 좌→우면 상삼각 부분을 $-\\infty$로 채워 미래 토큰을 가린다. 아키텍처를 바꾸지 않고 **입력으로 주는 마스크 행렬만 바꿔** 네 가지 언어모델을 구현한 것이 이 논문의 핵심이다.'},
 {h:'seq2seq 마스크: 소스는 양방향, 타깃은 인과적',
  lead:'source 세그먼트는 서로 다 보고 target 세그먼트는 자기 왼쪽과 source만 본다.',
  d:'source 토큰들은 서로 자유롭게 attend하지만 target을 보지 못하고, target 토큰은 자신의 왼쪽 target 토큰과 source 전체를 볼 수 있다. 이렇게 하나의 self-attention 안에서 **양방향 encoder와 단방향 decoder를 동시에** 구현해, 별도의 encoder-decoder 구조 없이 seq2seq를 학습한다. 요약·질문생성 같은 조건부 생성 과제에 그대로 쓰인다.'},
 {h:'BERT 체크포인트에서 이어받아 초기화',
  lead:'`BERT_LARGE` 가중치로 초기화한 뒤 위 네 목적으로 이어서 학습한다.',
  d:'처음부터 새로 학습하지 않고 24층·hidden 1024·head 16의 `BERT_LARGE` 구조와 가중치를 그대로 물려받아 추가 사전학습한다. 활성함수는 GPT를 따라 GELU를 쓴다. 이는 [BERT](#/p/bert)가 이미 잡아둔 양방향 표현력 위에 생성 능력을 얹는 전략이다.'}
],

diagram:{type:'flow', cap:'같은 5개 토큰·같은 Transformer 블록에 마스크만 바꿔 넣으면 세 가지 다른 언어모델이 된다.',
 nodes:[
  {t:'입력 토큰', s:'토큰+위치+세그먼트 임베딩'},
  {t:'공유 Transformer', s:'L층, 파라미터 하나', acc:true},
  {t:'양방향 마스크', s:'M=0, 전부 참조'},
  {t:'좌→우 마스크', s:'상삼각 -∞'},
  {t:'Seq2Seq 마스크', s:'소스 양방향+타깃 인과'}
 ]},

math:[
 {expr:'A_l = softmax( QKᵀ/√d_k + M ) V,   M_ij = 0(허용) or -∞(차단)',
  tex:'A_l=\\text{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d_k}}+M\\right)V,\\qquad M_{ij}=\\begin{cases}0 & \\text{allow}\\\\ -\\infty & \\text{prevent}\\end{cases}',
  d:'[Transformer](#/p/transformer)의 scaled dot-product attention에 마스크 항 $M$ 을 더한 것이 전부다. $-\\infty$ 를 더하면 softmax 이후 그 위치의 가중치가 0이 되어 해당 토큰 쌍의 정보 흐름이 완전히 끊긴다.'}
],

numbers:[
 {k:'모델 크기', v:'24층 · hidden 1024 · head 16 · 340M', d:'`BERT_LARGE` 구조를 그대로 따름'},
 {k:'사전학습 데이터', v:'English Wikipedia + BookCorpus', d:'770,000 스텝, 배치 330, 8×V100'},
 {k:'GLUE 평균 점수', v:'80.8', d:'`BERT_LARGE` 80.5 대비 근소 우위 (GPT 72.8)'},
 {k:'CNN/DailyMail 요약', v:'ROUGE-L 40.51', d:'기존 최고 대비 **+2.04**'},
 {k:'Gigaword 요약', v:'ROUGE-L 35.75', d:'기존 최고 대비 **+0.86**'},
 {k:'CoQA 생성형 QA', v:'F1 82.5', d:'seq2seq 파인튜닝, 기존 대비 **+37.1**(추출형 대비 생성형의 큰 도약)'}
],

impact:'BERT 계열이 이해 과제에 갇혀 있던 것과 달리, **하나의 사전학습 모델로 요약·질문생성·대화생성 같은 조건부 생성 과제 5개에서 동시에 SOTA를 찍었다**는 것을 보여줬다. 더 중요한 것은 방법론이다 — 아키텍처를 새로 설계하지 않고 **self-attention 마스크의 조합만으로** 양방향·단방향·seq2seq를 하나의 파라미터 집합에 통합할 수 있음을 증명했다. 이 마스크 조작이라는 아이디어는 이후 encoder-decoder를 하나의 decoder-only 구조로 흡수하려는 여러 시도의 출발점이 됐다.',

legacy:[
 '**마스크로 방향성을 조절한다는 발상**이 저자들의 후속작 `UniLMv2`의 pseudo-masked LM으로 이어짐',
 '**하나의 모델로 이해+생성**이라는 목표는 [BART](#/p/bart)(denoising encoder-decoder)와 [T5](#/p/t5)(text-to-text 통일)에서 각자 다른 방식으로 재시도됨',
 '단일 decoder 안에서 접두사는 양방향, 생성부는 단방향으로 보게 하는 **prefix LM** 구성이 [UL2](#/p/ul2) 등 후속 통합 목적함수 연구의 한 갈래로 남음',
 'BERT 가중치를 이어받아 목적함수만 바꿔 재학습하는 **웜스타트 전략** 자체가 이후 여러 파생 모델의 관례가 됨'
],

pitfalls:[
 '**"세 가지를 동시에 학습한다"는 세 개의 독립 모델을 학습한다는 뜻이 아니다.** 배치 단위로 목적을 확률적으로 샘플링해 같은 파라미터를 계속 업데이트하는 것이며, 추론 시에도 용도에 맞는 마스크 하나만 골라 쓴다.',
 '**seq2seq 마스크는 cross-attention이 아니다.** 별도의 encoder-decoder attention 모듈 없이, 하나의 self-attention 안에서 마스크로 "source는 다 보이고 target은 왼쪽만 보인다"를 구현한 것이라 [Transformer](#/p/transformer) 원 구조와 파라미터 형태가 다르다.',
 '실험은 영어 위키·BookCorpus 중심이고 비교 기준도 `BERT_LARGE` 하나다. 이후 등장한 대규모 GPT/T5류와 직접 비교하면 규모 자체가 훨씬 작다는 점을 감안해야 한다.'
],

figures:[
 {f:'fig1-masks.png',
  cap:'왼쪽이 공유 Transformer 블록(파라미터 하나). 오른쪽 세 행렬이 같은 5개 토큰에 서로 다른 self-attention 마스크를 적용한 것 — 흰 칸은 attend 허용, 회색 칸은 차단. 맨 위 Bidirectional LM은 마스크가 전부 흰색(전부 허용), 가운데 Left-to-Right LM은 상삼각이 회색(미래 차단), 맨 아래 Seq2Seq LM은 S1(source)은 서로 다 보이고 S2(target)는 자기 왼쪽까지만 보이는 계단형 마스크다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'The unified modeling is achieved by employing a shared Transformer network and utilizing specific self-attention masks to control what context the prediction conditions on.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1905.03197 — Unified Language Model Pre-training', u:'https://arxiv.org/abs/1905.03197'},
 {t:'microsoft/unilm (GitHub)', u:'https://github.com/microsoft/unilm'}
]
});
