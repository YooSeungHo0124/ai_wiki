WIKI.paper({
slug:'mamba',
venue:'COLM 2024 (arXiv 2023.12)',
authors:'Albert Gu (CMU), Tri Dao (Princeton)',
arxiv:'2312.00752',

tldr:'[S4](#/p/s4) 계열 SSM이 언어에서 지는 이유를 **"내용 기반 추론을 못 한다"** 로 진단하고, SSM의 파라미터 $\\Delta, B, C$ 를 **입력의 함수**로 만들어 그 약점을 없앤 논문. 선형 시불변(LTI)을 버리면 FFT 합성곱을 못 쓰게 되는데, 이를 하드웨어 인지 병렬 스캔으로 되살렸다. 결과는 KV 캐시 없이 길이에 선형인 추론과, 같은 크기 Transformer를 넘어서는 언어 모델링 성능이다.',

context:'[S4](#/p/s4) 이후 SSM은 오디오·유전체·LRA에서는 강했지만 언어에서는 번번이 [Transformer](#/p/transformer)에 밀렸다. 원인은 구조적이다. LTI 시스템의 커널 $\\bar{K}$ 는 **입력과 무관하게 고정**되어 있어서, 매 위치에서 똑같은 방식으로 과거를 섞는다. 즉 "지금 들어온 토큰이 중요하니 상태에 넣고, 이 토큰은 채움말이니 무시하라" 같은 **선택**이 원리적으로 불가능하다. attention은 이걸 공짜로 한다 — $QK^T$ 자체가 내용 비교이기 때문이다. Mamba의 저자들은 이 격차를 두 개의 합성 태스크(selective copying, induction heads)로 분리해 보인 뒤, 시불변성을 포기하는 대가로 무엇을 잃고 무엇을 얻는지를 정면으로 계산한다.',

ideas:[
 {h:'선택성(selectivity): 파라미터를 입력의 함수로 만든다',
  lead:'Δ,B,C를 토큰마다 다르게 만들어 무엇을 기억할지 게이트로 고른다.',
  d:'기존 SSM에서 $\\Delta, B, C$ 는 학습 후 고정된 상수였는데, Mamba는 이들을 각 토큰 $x_t$ 로부터 선형 투영해 **매 스텝 다르게** 만드는 게이트로 바꾼다. $B_t$ 는 이 토큰을 상태에 얼마나 쓸지, $C_t$ 는 상태에서 무엇을 읽을지, 그리고 $\\Delta_t$ 는 "이 토큰에 얼마나 시간을 쓸지"를 정한다. $\\Delta_t$ 가 크면 이전 상태를 지우고 현재 입력에 집중하고, 0에 가까우면 입력을 무시하고 상태를 그대로 통과시킨다 — [LSTM](#/p/lstm)의 forget/input 게이트를 연속 시간 언어로 재발명한 셈이다.'},
 {h:'LTI를 버리면 합성곱이 사라진다',
  lead:'선택성의 대가로 전역 합성곱 표현과 FFT 병렬 학습이 무효가 된다.',
  d:'이 변경의 대가는 크다. 커널이 위치마다 달라지므로 $y = u * \\bar{K}$ 라는 전역 합성곱 표현이 성립하지 않고, 따라서 S4의 FFT 병렬 학습이 통째로 무효가 된다. 남는 것은 순차 재귀뿐이고, 그대로 짜면 RNN의 느린 학습으로 되돌아간다. 논문 기여의 절반은 여기서부터의 **공학**이다.'},
 {h:'하드웨어 인지 병렬 스캔',
  lead:'재귀를 prefix sum으로 병렬화하고 계산을 SRAM 안에서 끝낸다.',
  d:'재귀 $h_t = \\bar{A}_t h_{t-1} + \\bar{B}_t x_t$ 는 결합법칙이 성립하는 연산이므로 **병렬 스캔(prefix sum)** 으로 $O(\\log L)$ 깊이에 계산할 수 있다. 문제는 상태를 $N$ 배(기본 $N=16$)로 확장한 $(B, L, D, N)$ 텐서를 HBM에 쓰면 대역폭에서 죽는다는 것. [FlashAttention](#/p/flashattention)과 같은 처방을 쓴다 — 파라미터를 SRAM으로 올려 거기서 이산화와 스캔을 모두 끝내고 최종 출력만 HBM에 쓰며, 역전파용 중간 상태는 저장하지 않고 **재계산**한다. 이 커널 덕분에 실제 측정 속도가 길이 2K를 넘어가면 FlashAttention-2보다 빨라진다.'},
 {h:'블록 하나로 통합 — attention도 MLP도 없다',
  lead:'SSM 층과 게이트 MLP를 번갈아 쌓지 않고 하나의 블록으로 합친다.',
  d:'기존 SSM 아키텍처(H3 등)는 SSM 층과 게이트 MLP를 번갈아 쌓았다. Mamba는 그 둘을 하나의 블록으로 합친다. 입력을 두 갈래로 확장(기본 2배)해 한쪽은 짧은 1D 합성곱 → SiLU → 선택적 SSM을 통과시키고, 다른 쪽은 게이트로 곱한 뒤 다시 투영한다. 이 동일한 블록만 반복해 쌓으면 모델이 되며, [Transformer](#/p/transformer) 블록의 attention/FFN 이분법이 사라진다.'},
 {h:'추론에 KV 캐시가 없다',
  lead:'고정 크기 상태 하나만 유지해 토큰당 비용이 문맥 길이와 무관하다.',
  d:'Transformer의 생성 비용은 지금까지 본 모든 토큰의 K·V를 들고 있어야 해서 문맥 길이에 비례해 메모리와 시간이 늘고, 그래서 [PagedAttention](#/p/vllm) 같은 캐시 관리 기술이 따로 필요하다. Mamba가 들고 가는 것은 **고정 크기 상태 $h$ 하나**뿐이다. 토큰당 비용이 문맥 길이와 무관한 상수이고, 전체 시퀀스에 대해 선형이다. 이것이 배치 크기를 크게 키울 수 있게 해 5배 처리량으로 이어진다.'}
],

diagram:{type:'compare', cap:'LTI SSM이 못 하던 한 가지 — 입력을 보고 무엇을 기억할지 고르는 일.',
 left:{t:'S4 / LTI SSM', items:[
  'Δ, B, C 가 모든 위치에서 동일',
  '고정 커널과의 전역 합성곱 = FFT 병렬',
  '내용 기반 선택 불가 (copying 실패)',
  '연속 신호(오디오·픽셀)에 강함']},
 right:{t:'Mamba: 선택적 SSM (S6)', items:[
  'Δt, Bt, Ct 를 토큰마다 투영해 생성',
  '합성곱 불가 → 하드웨어 인지 병렬 스캔',
  '무시·기억·리셋을 토큰 단위로 결정',
  '언어에서 동급 Transformer 상회']}},

math:[
 {expr:'h_t = Ā_t h_{t-1} + B̄_t x_t,   y_t = C_t h_t',
  tex:'h_t = \\bar{A}_t h_{t-1} + \\bar{B}_t x_t,\\quad y_t = C_t h_t',
  d:'S4의 재귀식과 형태는 같지만 **첨자 $t$** 가 붙은 것이 전부다. 이 한 글자 때문에 시불변성이 깨지고, 합성곱 표현과 FFT 학습이 동시에 사라진다.'},
 {expr:'Δ_t = softplus(s_Δ(x_t)),   B_t = s_B(x_t),   C_t = s_C(x_t)',
  tex:'\\Delta_t = \\mathrm{softplus}(s_\\Delta(x_t)),\\quad B_t = s_B(x_t),\\quad C_t = s_C(x_t)',
  d:'$s_B, s_C$ 는 $d \\to N$ 선형층, $s_\\Delta$ 는 저계수 투영 후 브로드캐스트. $A$ 자체는 입력과 무관한 대각 행렬로 두되, $\\bar{A}_t = \\exp(\\Delta_t A)$ 를 통해 사실상 입력 의존이 된다.'},
 {expr:'ḡ_t = σ(Δ_t),   h_t = (1 − ḡ_t) h_{t-1} + ḡ_t x_t   (N=1, A=−1 인 경우)',
  tex:'\\bar{g}_t = \\sigma(\\Delta_t),\\quad h_t = (1-\\bar{g}_t)h_{t-1} + \\bar{g}_t x_t\\ \\ (N=1,\\ A=-1)',
  d:'논문이 직접 보이는 특수화. 상태 차원이 1이고 $A=-1$ 이면 선택적 SSM은 **게이트 달린 RNN 그 자체**로 환원된다. $\\Delta$ 를 크게 만드는 토큰은 상태를 리셋하고, 작게 만드는 토큰은 그냥 흘려보낸다.'}
],

numbers:[
 {k:'추론 처리량', v:'Transformer 대비 5배', d:'KV 캐시가 없어 같은 메모리로 배치를 훨씬 키울 수 있다'},
 {k:'Mamba-3B', v:'2배 크기 Transformer와 동급', d:'사전학습 perplexity와 다운스트림 평가 모두에서. 동급 크기 Transformer는 상회'},
 {k:'문맥 길이', v:'최대 100만 토큰까지 성능 향상', d:'유전체·오디오처럼 정말 긴 시퀀스에서 길이를 늘릴수록 좋아진다 — Transformer는 보통 반대'},
 {k:'induction heads 외삽', v:'길이 256 학습 → 100만 이상에서 동작', d:'학습 길이의 4000배 이상. 고정 크기 상태라 길이 외삽에 구조적 제약이 없다'},
 {k:'스캔 커널 손익분기', v:'시퀀스 길이 약 2K', d:'그 이상에서는 FlashAttention-2보다 빠르다'},
 {k:'상태 확장', v:'N = 16 (기본)', d:'채널당 상태 차원. 커지면 기억 용량이 늘지만 SRAM 예산과 직결된다'}
],

figures:[
 {f:'fig1-selective-ssm.png',
  cap:'가운데 A는 시간에 따라 고정된 상태 전이 행렬이지만, 아래쪽 파란 "Selection Mechanism"이 입력 x_t를 보고 Δ_t·B_t·C_t를 그때그때 다시 계산한다(점선 화살표). 즉 기존 S4처럼 모든 시점에서 같은 파라미터를 쓰는 게 아니라, **토큰마다 무엇을 상태에 기억하고 무엇을 흘려보낼지**를 입력 자체가 결정한다. 오른쪽 GPU SRAM/HBM 삼각형은 이 입력 의존적 계산 때문에 더는 커널을 미리 합성할 수 없어, 확장된 상태를 SRAM에서만 다루는 하드웨어 인식 알고리즘이 필요해졌음을 나타낸다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'We identify that a key weakness of such models is their inability to perform content-based reasoning, and make several improvements. First, simply letting the SSM parameters be functions of the input addresses their weakness with discrete modalities, allowing the model to selectively propagate or forget information along the sequence length dimension depending on the current token.',
  src:'Abstract, p.1'}
],

impact:'Mamba는 "SSM은 신호용, 언어는 attention"이라는 암묵적 분업을 깼다. 3B 규모까지의 실험이지만 동급 Transformer를 넘긴 첫 순수 SSM이었고, 이후 1년 사이 SSM은 연구 주제에서 **양산 모델의 부품**으로 넘어갔다. 특히 KV 캐시가 없다는 성질은 서빙 경제학을 바꾼다 — 긴 문맥에서 동시 요청 수가 캐시 메모리에 묶이지 않기 때문이다. 다만 논문 스스로 밝히듯 정밀 복사·검색 능력은 attention이 여전히 우위이고, 실제 산업 모델은 순수 Mamba가 아니라 **소수의 attention 층을 섞은 하이브리드**로 수렴했다.',

legacy:[
 '**[Mamba-2](#/p/mamba2) / SSD** — 선택적 SSM과 선형 attention이 같은 행렬 분해의 두 얼굴임을 보이고, 행렬곱 유닛을 쓰도록 재작성해 학습 속도를 크게 올렸다',
 '**하이브리드가 표준** — Jamba, Zamba, Samba, NVIDIA Nemotron-H 등은 Mamba 층 사이에 attention 층을 몇 개만 끼워 넣어 회상 능력을 회복시킨다',
 '**비전·과학 도메인 이식** — Vision Mamba·VMamba, 그리고 DNA·EEG·시계열까지 "길이가 길고 국소성이 강한 데이터"에 빠르게 퍼졌다',
 '**회상-효율 트레이드오프 연구** — 고정 크기 상태가 저장할 수 있는 정보량의 상한을 정량화하는 연구 계열이 이 논문 이후 본격화됐다'
],

pitfalls:[
 '**"Transformer를 대체했다"는 과장이다.** 고정 크기 상태는 곧 **정보 병목**이다. 긴 문맥에서 특정 문자열을 그대로 찾아 복사하는 일(정밀 검색, 다중 질의 회상, in-context 학습의 일부)에서 Mamba는 attention에 체계적으로 뒤진다. 2024년 이후 실제 배포되는 SSM 계열은 거의 전부 attention 층을 섞은 하이브리드이며, 순수 SSM으로 프런티어 모델을 만든 사례는 아직 없다.',
 '**"선형이니까 항상 빠르다"도 아니다.** 짧은 문맥(수백~2K 토큰)에서는 [FlashAttention](#/p/flashattention)이 더 빠르고, Mamba의 이점은 문맥이 길거나 배치가 클 때 나온다. 게다가 이 속도는 커스텀 CUDA 커널에 의존해서, 커널이 없는 환경(다른 가속기, 순수 PyTorch)에서는 이론 복잡도가 실측으로 이어지지 않는다.',
 '**LRA·합성 태스크 점수를 언어 성능으로 읽지 말 것.** selective copying과 induction heads는 선택성의 존재를 증명하기 위해 **설계된** 태스크다. 이 태스크를 푼다는 것이 곧 실제 문서 QA에서 attention만큼 회상한다는 뜻은 아니다.'
],

links:[
 {t:'arXiv 2312.00752 — Mamba: Linear-Time Sequence Modeling with Selective State Spaces', u:'https://arxiv.org/abs/2312.00752'},
 {t:'Transformers are SSMs (Mamba-2, ICML 2024)', u:'https://arxiv.org/abs/2405.21060'},
 {t:'state-spaces/mamba — 공식 구현', u:'https://github.com/state-spaces/mamba'}
]
});
