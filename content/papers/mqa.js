WIKI.paper({
slug:'mqa',
venue:'arXiv 2019 (preprint)',
authors:'Noam Shazeer (Google)',
arxiv:'1911.02150',

tldr:'디코딩이 느린 진짜 이유는 연산량이 아니라 **KV 캐시를 읽어오는 메모리 대역폭**이라는 진단을 내리고, 모든 head가 하나의 K·V를 공유하게 만들어 캐시를 $h$ 배 줄인 논문. 8쪽짜리 프리프린트지만 오늘날 거의 모든 서빙 스택의 기본 전제가 되었다.',

context:'[Transformer](#/p/transformer)의 학습은 시퀀스 전체를 한 번의 행렬곱으로 처리하므로 GPU를 꽉 채운다. 그러나 **생성은 토큰을 하나씩** 뽑아야 하고, 매 스텝마다 지금까지 만든 모든 토큰의 Key·Value를 다시 참조해야 한다. 이걸 매번 다시 계산하지 않으려고 저장해두는 것이 KV 캐시다. 문제는 그 다음이다. 토큰 하나를 만드는 데 필요한 산술 연산은 몇 MFLOP 수준인데, 그 계산을 위해 읽어야 하는 캐시는 수십~수백 MB다. 즉 **연산기는 놀고 메모리 버스만 혹사당한다**. Shazeer가 던진 질문은 "그러면 읽어야 할 텐서 자체를 줄이면 되지 않나"였다.',

ideas:[
 {h:'병목은 FLOPs가 아니라 memory-bandwidth ratio다',
  lead:'디코딩 한 스텝의 연산 대비 메모리 접근 비율이 나빠 GPU가 대역폭에 묶인다.',
  d:'논문은 incremental decoding 한 스텝의 **연산량 대비 메모리 접근량 비율**을 직접 계산한다. multi-head attention에서 이 비율은 대략 $O(n/d + 1/b)$ 로, 시퀀스가 길어지거나($n$↑) 배치가 작아지면($b$↓) 급격히 나빠진다. 현대 GPU의 연산:대역폭 비는 수백:1이므로, 이 비율이 1 근처면 하드웨어는 사실상 메모리 컨트롤러 속도로만 돈다. 아키텍처 논문이 아니라 **하드웨어 회계 논문**에 가깝다.'},
 {h:'Query만 여러 개, Key·Value는 하나',
  lead:'Q는 head별로 두고 K·V만 전 head가 공유해 캐시를 h배 줄인다.',
  d:'multi-head attention은 head마다 $W_Q^i, W_K^i, W_V^i$ 를 따로 둔다. MQA는 $W_Q^i$ 만 head별로 유지하고 **$W_K, W_V$ 는 전 head가 공유**한다. 각 head는 자기만의 질문을 던지지만 참조하는 사전은 하나다. 캐시에 저장할 텐서는 $2 \\times n \\times h \\times d_{head}$ 에서 $2 \\times n \\times d_{head}$ 로, 정확히 head 수만큼 줄어든다.'},
 {h:'학습 속도는 그대로, 디코딩만 빨라진다',
  lead:'학습은 이미 연산 바운드라 그대로고, 이득은 자기회귀 디코딩에만 생긴다.',
  d:'학습에서는 시퀀스 전체를 한꺼번에 처리하므로 K·V를 읽는 비용이 이미 연산량에 묻힌다. 실제로 논문의 학습 시간은 MHA 13μs/토큰, MQA 13μs/토큰으로 동일하다. 이득은 **오직 자기회귀 디코딩 구간에만** 발생한다. 이 비대칭이 MQA를 "공짜 최적화"처럼 보이게 만든다.'},
 {h:'대가는 표현력 — 그리고 그것이 [GQA](#/p/gqa)를 낳는다',
  lead:'K·V 공유로 표현력 다양성이 줄어드는 대가를 그룹 수로 절충한 것이 GQA다.',
  d:'head마다 다른 부분공간을 보라고 만든 것이 multi-head인데, K·V를 공유하면 그 다양성의 절반이 사라진다. 논문 자체의 번역 실험에서는 손실이 미미했지만(ln PPL 1.424 → 1.439), 이후 대형 모델에서는 품질 저하와 학습 불안정이 보고되었다. 이 간극을 메우려고 나온 것이 K·V 그룹을 $g$ 개로 두는 [GQA](#/p/gqa)다.'}
],

diagram:{type:'compare', cap:'같은 attention이지만 디코딩 스텝마다 메모리에서 읽어야 하는 양이 다르다.',
 left:{t:'MHA: head별 K·V', items:[
  'Q, K, V 각각 h개 투영',
  'KV 캐시 = 2 · n · h · d_head',
  '토큰당 디코딩 46 μs (greedy)',
  'beam 4에서 203 μs/토큰',
  '연산기는 놀고 HBM만 포화']},
 right:{t:'MQA: K·V 공유', items:[
  'Q만 h개, K·V는 1개',
  'KV 캐시 = 2·n·d_head (h배↓)',
  '토큰당 디코딩 3.8 μs (약 12배)',
  'beam 4에서 32 μs/토큰',
  '학습 속도는 동일 (13 μs/토큰)']}},

math:[
 {expr:'MHA cache = 2 · b · n · h · d_head     MQA cache = 2 · b · n · d_head',
  tex:'\\text{MHA}=2bnh\\,d_{head},\\quad \\text{MQA}=2bn\\,d_{head}',
  d:'배치 $b$, 길이 $n$, head 수 $h$. head 수만큼 나누어진다. $h=32$ 인 모델이면 KV 캐시가 32분의 1이 되고, 같은 GPU에 32배 많은 동시 요청을 올릴 수 있다는 뜻이다.'},
 {expr:'memory_access / arithmetic_ops  ≈  n/d + 1/b',
  tex:'\\frac{\\text{memory access}}{\\text{arithmetic ops}}\\approx \\frac{n}{d}+\\frac{1}{b}',
  d:'논문이 MHA 디코딩에 대해 계산한 비율. 이 값이 1보다 크면 메모리 바운드다. 긴 문맥($n$↑)이나 저지연 단일 요청($b=1$)일수록 나빠지는데, 이것이 정확히 실제 챗봇 서빙 환경이다.'},
 {expr:'head_i = softmax( (x W_Q^i) (M W_K)ᵀ / √d ) (M W_V)',
  tex:'\\text{head}_i=\\text{softmax}\\!\\left(\\frac{(xW_Q^i)(MW_K)^{\\top}}{\\sqrt{d}}\\right)(MW_V)',
  d:'$W_K, W_V$ 에 head 인덱스 $i$ 가 없다는 것이 논문의 전부다. 코드 변경은 텐서 shape 몇 줄이지만 서빙 비용 구조가 바뀐다.'}
],

quotes:[
 {t:'We propose a variant called multi-query attention, where the keys and values are shared across all of the different attention "heads", greatly reducing the size of these tensors and hence the memory bandwidth requirements of incremental decoding.',
  src:'Abstract, p.1'}
],

numbers:[
 {k:'WMT14 EN→DE BLEU (beam 4)', v:'28.5 vs 28.4', d:'MQA vs MHA 베이스라인 — 품질 차이 없음'},
 {k:'ln(perplexity)', v:'1.439 vs 1.424', d:'MQA가 근소하게 나쁨. 이 미세한 손실이 대형 모델에서는 커진다'},
 {k:'디코더 · greedy', v:'46 μs → 3.8 μs', d:'토큰당 시간, 약 **12배** 단축'},
 {k:'디코더 · beam 4', v:'203 μs → 32 μs', d:'약 6배'},
 {k:'인코더', v:'1.7 μs → 1.5 μs', d:'인코더는 병렬이라 이득이 거의 없다 — 병목이 디코딩에 있다는 증거'},
 {k:'학습', v:'13 μs → 13 μs', d:'학습 비용은 완전히 동일'}
],

impact:'이 논문은 "LLM 추론 최적화"를 독립된 공학 분야로 만든 출발점 중 하나다. 이전까지 효율 연구는 대부분 학습 FLOPs를 줄이는 데 집중했지만, MQA는 **서빙에서 실제로 아픈 곳은 대역폭과 KV 캐시 메모리**라는 것을 수치로 못 박았다. 이 진단 위에서 [FlashAttention](#/p/flashattention)(HBM 왕복 줄이기), [PagedAttention](#/p/vllm)(캐시 단편화 제거), [GQA](#/p/gqa)(캐시 크기 절충)가 각각 다른 각도로 같은 병목을 공격한다. PaLM, Falcon 등이 MQA를 그대로 채택했고, 이후 세대는 대부분 GQA로 옮겨갔다.',

legacy:[
 '**[GQA](#/p/gqa)** — K·V를 1개가 아니라 $g$ 개 그룹으로 두어 MQA의 품질 저하를 메우고, [Llama 2](#/p/llama2)·[Mistral](#/p/mistral) 이후 사실상 표준이 됨',
 '**서빙 스택의 전제** — KV 캐시가 작아지면서 배치 크기와 동시 요청 수를 키울 수 있게 됐고, 이것이 [vLLM](#/p/vllm) 같은 처리량 중심 서버 설계의 물리적 여지를 만들었다',
 '**KV 캐시 압축 계열** — 캐시를 head 차원에서 줄이는 이 발상은 이후 양자화([GPTQ](#/p/gptq)·[AWQ](#/p/awq)를 KV에 적용), 캐시 축출, 저랭크 압축(MLA) 등 여러 방향으로 확장됨',
 '**"메모리 바운드" 관점의 확산** — [Mamba](#/p/mamba)·[RWKV](#/p/rwkv) 같은 상태공간 계열도 "디코딩 시 상태 크기가 상수"라는 같은 축에서 자신을 정당화한다'
],

pitfalls:[
 '**"MQA가 attention을 h배 빠르게 한다"는 오해.** 빨라지는 것은 자기회귀 **디코딩**뿐이다. 학습과 prefill(프롬프트 처리) 구간은 이미 연산 바운드라 사실상 변화가 없다.',
 '**MQA를 나중에 얹을 수는 없다.** MHA로 학습한 체크포인트를 그냥 K·V 공유로 바꾸면 망가진다. 처음부터 MQA로 학습하거나, [GQA](#/p/gqa) 논문의 uptraining 절차를 거쳐야 한다.',
 '**텐서 병렬과 궁합이 나쁘다.** KV head가 1개면 모델을 $p$ 개로 쪼갤 때 그 head를 모든 파티션에 복제해야 해서, 실제 절감이 이론치만큼 나오지 않는다. GQA가 그룹 수를 파티션 수에 맞추는 이유가 이것이다.'
],

links:[
 {t:'arXiv 1911.02150 — Fast Transformer Decoding: One Write-Head is All You Need', u:'https://arxiv.org/abs/1911.02150'},
 {t:'GQA (후속 논문, MQA의 한계와 전환 절차)', u:'https://arxiv.org/abs/2305.13245'}
]
});
