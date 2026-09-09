WIKI.paper({
slug:'vllm',
venue:'SOSP 2023',
authors:'Kwon, Li, Zhuang, Sheng, Zheng et al. (UC Berkeley · Stanford · UCSD)',
arxiv:'2309.06180',

tldr:'LLM 서빙의 병목이 연산이 아니라 **KV 캐시가 차지하는 메모리**이고, 그 메모리의 60~80%가 파편화와 과잉 예약으로 낭비되고 있다는 진단. 해법으로 운영체제의 가상 메모리 페이징을 그대로 빌려와 KV 캐시를 고정 크기 블록으로 쪼갠 결과, 같은 지연 시간에서 처리량이 2~4배가 됐다.',

context:'[Transformer](#/p/transformer) 디코딩은 이미 생성한 토큰들의 key·value를 캐시해 재계산을 피한다. 문제는 이 캐시가 **얼마나 커질지 미리 알 수 없다**는 것이다. 요청이 10토큰을 생성할지 2000토큰을 생성할지는 끝나 봐야 안다. 기존 서빙 시스템(FasterTransformer, Orca)은 텐서를 연속된 메모리에 잡아야 하는 딥러닝 프레임워크의 제약 때문에 **최대 길이만큼 미리 통째로 예약**했다. 2048토큰을 예약해 놓고 실제로는 30토큰만 쓰는 요청이 대부분이니, 남은 공간은 다른 요청이 쓸 수도 없이 놀았다. 저자들의 프로파일링 결과 실제 토큰 상태를 담고 있는 KV 캐시 메모리는 **전체의 20.4%~38.2%뿐**이었다. 즉 GPU는 연산이 부족한 게 아니라, 메모리를 잘못 써서 배치를 못 키우고 있었다.',

ideas:[
 {h:'진단: 낭비는 세 종류다',
  lead:'병목을 메모리 부족이 아니라 메모리 할당기의 결함으로 재정의한다.',
  d:'**예약 낭비** — 미래 토큰을 위해 잡아 두었지만 지금 안 쓰는 슬롯. **내부 파편화** — 요청이 예상보다 짧게 끝나 예약 구간 끝에 남는 공간. **외부 파편화** — 요청마다 예약 크기가 달라 청크 사이에 끼는 못 쓰는 틈. 이 셋이 합쳐져 KV 캐시의 대부분을 먹는다. 아이디어의 절반은 이 분해 자체다 — 병목을 "메모리가 부족하다"가 아니라 "메모리 할당기가 잘못됐다"로 재정의했다.'},
 {h:'PagedAttention: KV 캐시를 페이지로 쪼갠다',
  lead:'OS의 가상 메모리 페이징을 그대로 빌려 KV 캐시를 블록 단위로 관리한다.',
  d:'OS는 프로세스가 연속된 주소를 본다고 믿게 하면서 물리 메모리는 페이지 단위로 흩어 놓는데, PagedAttention은 이를 그대로 KV 캐시에 적용한다. KV 캐시를 **고정 크기 블록**(기본 16토큰)으로 나누고, 시퀀스마다 논리 블록 → 물리 블록 매핑 테이블을 두며, attention 커널은 블록 단위로 key/value를 읽도록 다시 작성한다. 물리 블록은 GPU 메모리 어디에 있어도 되므로 **연속성 제약이 사라지고**, 요청은 실제로 토큰을 생성할 때마다 블록 하나씩만 더 받는다. 낭비는 요청당 마지막 블록 하나 안쪽으로 제한된다.'},
 {h:'copy-on-write로 KV 캐시를 요청 간에 공유한다',
  lead:'같은 접두사를 쓰는 요청들이 물리 블록을 복사 없이 공유한다.',
  d:'페이징의 진짜 배당금은 여기서 나온다 — 같은 프롬프트에서 여러 답을 뽑는 parallel sampling이나 beam search는 접두사가 완전히 동일하다. 블록 테이블만 같은 물리 블록을 가리키게 하고 참조 카운트를 세면 **KV 캐시를 복사 없이 공유**할 수 있고, 어느 한 갈래가 그 블록에 쓰려 할 때만 복사한다(copy-on-write). beam search에서 최대 55%의 메모리가 절약된다. 시스템 프롬프트가 긴 서비스에서도 같은 원리가 그대로 적용된다.'},
 {h:'continuous batching: 배치를 반복 단위로 재구성한다',
  lead:'배치를 요청 단위가 아니라 디코딩 스텝마다 다시 구성한다.',
  d:'전통적 배치는 묶인 요청이 **전부** 끝날 때까지 기다리므로, 30토큰짜리 요청이 2000토큰짜리와 같은 배치에 묶이면 1970스텝 동안 그 자리는 낭비다. vLLM은 **디코딩 스텝마다** 배치를 다시 구성한다 — 끝난 요청은 빠지고 대기열의 새 요청이 즉시 들어온다. 이것이 가능하려면 요청마다 KV 캐시를 독립적으로 붙였다 뗄 수 있어야 하는데, 그게 정확히 페이징이 제공하는 것이다. **PagedAttention과 continuous batching은 한 쌍이다.**'},
 {h:'메모리가 모자라면 스케줄러가 선점한다',
  lead:'블록이 고갈되면 최근 요청을 재계산하거나 CPU로 스왑해 회수한다.',
  d:'블록 풀이 고갈되면 vLLM은 가장 최근에 들어온 요청의 블록을 회수한다. 시퀀스 단위로 전부(all-or-nothing) 처리하되, 다시 계산하는 recomputation과 CPU RAM으로 내리는 swapping 중에서 고른다. 즉 **GPU 메모리를 OS처럼 오버커밋**하고, 넘치면 스왑한다. 서빙 시스템이 메모리 관리자를 갖게 된 셈이다.'}
],

diagram:{type:'compare', cap:'같은 GPU, 같은 모델. 달라지는 것은 KV 캐시를 어떻게 할당하느냐뿐이다.',
 left:{t:'기존 (연속 할당)', items:[
  '요청마다 최대 길이만큼 미리 예약',
  '실제 사용률 20.4%~38.2%',
  '예약 · 내부 · 외부 파편화 3종',
  '접두사가 같아도 캐시 복사',
  '배치 전체가 끝나야 다음 배치']},
 right:{t:'vLLM (블록 페이징)', items:[
  '16토큰 블록을 필요할 때 하나씩',
  '낭비는 마지막 블록 안쪽뿐',
  '블록 테이블로 논리↔물리 분리',
  'copy-on-write로 접두사 공유',
  '스텝마다 배치 재구성 (continuous)']}},

math:[
 {expr:'KV/token = 2 × d_model × n_layer × 2 bytes',
  tex:'\\text{KV/token} = 2 \\times d_{model} \\times n_{layer} \\times 2\\ \\text{bytes}',
  d:'OPT-13B 기준 $2 \\times 5120 \\times 40 \\times 2$ = **토큰당 800KB**. 2048토큰까지 생성하면 요청 하나가 1.6GB를 먹는다. GPU 메모리가 수십 GB인 것을 감안하면 예약 방식으로는 동시 처리 요청이 수십 개를 넘기 어렵다.'},
 {expr:'A_ij = softmax( q_i^T K_j / √d ),   o_i = Σ_j A_ij V_j     (j = 블록 인덱스)',
  tex:'A_{ij} = \\mathrm{softmax}\\!\\left(\\frac{q_i^{\\top}K_j}{\\sqrt{d}}\\right),\\quad o_i = \\sum_j A_{ij}V_j\\ \\ (j:\\text{블록 인덱스})',
  d:'attention을 토큰 단위가 아니라 **블록 단위 루프**로 다시 쓴 것이 PagedAttention 커널의 전부다. 수학적으로는 원래 attention과 완전히 동일하며, 달라지는 것은 $K_j, V_j$ 를 블록 테이블로 찾아온다는 점뿐이다. 출력은 비트 단위로 같다.'}
],

numbers:[
 {k:'처리량 향상', v:'2~4×', d:'**같은 지연 시간** 기준, FasterTransformer·Orca 대비'},
 {k:'기존 KV 캐시 실사용률', v:'20.4% ~ 38.2%', d:'나머지는 예약·파편화로 낭비'},
 {k:'13B 모델 메모리 분포', v:'가중치 65% · KV 캐시 ~30%', d:'A100 40GB 기준. 가중치는 고정이므로 **조절 가능한 건 KV 캐시뿐**'},
 {k:'토큰당 KV 캐시', v:'800 KB', d:'OPT-13B. 요청 하나가 최대 1.6GB'},
 {k:'기본 블록 크기', v:'16 토큰', d:'너무 작으면 커널 병렬성 손해, 너무 크면 파편화. 16~128 구간에서 최적'},
 {k:'공유로 인한 절약', v:'beam search 37.6~55.2%', d:'parallel sampling은 6.1~9.8% (Alpaca 기준)'}
],

figures:[
 {f:'fig6-block-table.png',
  cap:'요청 A의 논리적 KV 블록(왼쪽, 프롬프트 순서대로 채워짐)과 물리적 KV 블록(오른쪽, GPU DRAM 상 임의 위치)을 가운데 Block Table이 연결한다. 논리 Block 0·1이 물리 Block 7·1에 매핑돼 있는 것처럼 논리 순서와 물리 배치가 전혀 다르다 — OS의 페이지 테이블과 같은 구조다. 마지막 논리 블록의 빈 칸(#filled)에 새 토큰의 KV가 하나씩 채워진다.',
  src:'원문 Figure 6, p.6'},
 {f:'fig4-system-overview.png',
  cap:'중앙 Scheduler가 어떤 요청의 어떤 블록을 어느 GPU에 둘지 결정하고, KV Cache Manager가 CPU/GPU Block Allocator를 통해 실제 물리 블록을 배분한다. Worker들은 자기 몫의 Model Shard와 Cache Engine만 갖고 있어 스케줄러의 지시대로 KV 블록을 읽고 쓴다.',
  src:'원문 Figure 4, p.5'}
],

quotes:[
 {t:'PagedAttention allows storing continuous keys and values in non-contiguous memory space. Specifically, PagedAttention partitions the KV cache of each sequence into KV blocks.',
  src:'§4.1, p.5'}
],

impact:'vLLM은 논문이자 곧바로 표준 인프라가 된 드문 사례다. 핵심은 **모델을 전혀 건드리지 않는다**는 점 — 양자화나 [GQA](#/p/gqa)처럼 품질과 맞바꾸는 것이 아니라, 출력이 완전히 동일한 채로 메모리 관리만 고친다. 그래서 도입 결정에 트레이드오프 검토가 필요 없고, 오픈소스 구현은 사실상 오픈 LLM 서빙의 기본값이 됐다. 더 넓게 보면 이 논문은 **LLM 서빙을 ML 문제가 아니라 시스템 문제로 다시 정의**했다. 이후의 서빙 연구가 스케줄링·캐시 정책·prefill/decode 분리 같은 OS·DB의 어휘로 쓰이게 된 출발점이다.',

legacy:[
 '**prefix caching** — 시스템 프롬프트나 긴 문서처럼 요청 간에 겹치는 접두사의 KV 블록을 재사용하는 기능이 표준 탑재. 에이전트·RAG 워크로드에서 특히 효과가 크다',
 '**chunked prefill / prefill-decode 분리** — 긴 프롬프트 처리(연산 바운드)와 토큰 생성(메모리 바운드)의 성격이 다르다는 인식이 이후 서빙 연구의 주 전선이 됨',
 '**KV 캐시 축소 계열과의 결합** — [MQA](#/p/mqa)/[GQA](#/p/gqa)가 캐시 자체를 줄이고 vLLM이 그것을 효율적으로 담는다. [DeepSeek-V3](#/p/deepseek-v3)의 MLA도 같은 축의 연장',
 '**[speculative decoding](#/p/speculative) 통합** — 페이징 위에서 draft 토큰의 KV 블록을 붙였다 떼는 것이 자연스러워, 두 기법이 같은 엔진에서 결합됨'
],

pitfalls:[
 '**"vLLM = 항상 빠르다"가 아니다.** 개선되는 것은 **처리량(throughput)**이지 단일 요청의 지연 시간(latency)이 아니다. 요청이 하나뿐인 로컬 환경에서는 이득이 거의 없거나 커널 오버헤드로 약간 느릴 수도 있다. 동시 요청이 많을 때 비로소 2~4배가 나온다.',
 '**메모리를 안 쓰는 게 아니라 꽉 쓴다.** vLLM은 남는 GPU 메모리를 전부 KV 블록 풀로 선점한다(`gpu_memory_utilization` 기본 0.9). 같은 GPU에 다른 프로세스를 띄우면 충돌하고, `nvidia-smi`의 사용량만 보고 "메모리 누수"로 오해하기 쉽다.',
 '**KV 캐시 압박을 못 줄이면 페이징만으로는 한계가 있다.** 문맥이 아주 길어지면 800KB/토큰 같은 상수 자체가 문제가 된다. 이때는 [GQA](#/p/gqa)·양자화된 KV 캐시처럼 캐시의 **크기**를 줄이는 수단과 함께 써야 한다.'
],

links:[
 {t:'arXiv 2309.06180 — Efficient Memory Management for LLM Serving with PagedAttention', u:'https://arxiv.org/abs/2309.06180'},
 {t:'vllm-project/vllm (GitHub)', u:'https://github.com/vllm-project/vllm'},
 {t:'vLLM 공식 문서', u:'https://docs.vllm.ai/'}
]
});
