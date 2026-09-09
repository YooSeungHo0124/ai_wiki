WIKI.paper({
slug:'zero',
venue:'SC 2020',
authors:'Rajbhandari, Rasley, Ruwase, He (Microsoft · DeepSpeed)',
arxiv:'1910.02054',

tldr:'데이터 병렬은 GPU마다 **똑같은** 옵티마이저 상태·gradient·파라미터를 통째로 복제해 두는데, ZeRO는 그 중복을 GPU 수만큼 잘라서 나눠 갖는다. 계산 방식은 그대로 두고 "누가 무엇을 보관하는가"만 바꿔서, 데이터 병렬의 편의성을 유지한 채 학습 가능한 모델 크기를 GPU 수에 비례해 늘렸다.',

context:'2019년의 큰 모델 학습에는 두 가지 선택지뿐이었다. **데이터 병렬(DP)**은 코드 수정이 거의 없어 쓰기 쉽지만, 모든 GPU가 모델 전체를 복제하므로 한 장에 안 들어가는 모델은 아예 학습할 수 없다. **모델 병렬(MP)**, 즉 [Megatron](#/p/megatron) 방식은 모델을 쪼개 넣을 수 있지만 레이어마다 통신이 끼어들어 노드 경계를 넘어가면 효율이 급락하고, 모델 코드를 직접 뜯어고쳐야 한다. 여기서 ZeRO가 던진 질문은 메모리 회계에 관한 것이다 — **DP에서 GPU N장이 들고 있는 것 중 실제로 서로 다른 값은 얼마나 되는가?** 답은 "거의 없다"였다. 학습 메모리의 대부분을 차지하는 옵티마이저 상태와 gradient는 각 GPU가 완전히 동일한 복사본을 유지하고 있었고, 이것은 순수한 낭비였다.',

ideas:[
 {h:'먼저 메모리 장부부터 정확히 쓴다',
  lead:'파라미터당 16바이트 중 대부분이 옵티마이저 상태의 중복 복사본임을 밝힌다.',
  d:'Adam + fp16 혼합정밀 학습에서 파라미터 $\\Psi$ 개당 실제로 필요한 바이트는 fp16 파라미터 2, fp16 gradient 2, 그리고 옵티마이저 상태로 fp32 파라미터 사본 4 + fp32 momentum 4 + fp32 variance 4 = **총 16바이트**다. 즉 활성값을 제외해도 파라미터 자체(2바이트)의 8배가 든다. 1.5B 모델이면 24GB — 당시 V100 32GB에 겨우 들어가고, 활성값 자리는 남지 않는다. 논문의 출발점은 이 장부를 항목별로 분해한 것이다.'},
 {h:'Stage 1 (P_os): 옵티마이저 상태를 쪼갠다 — 4배 절약',
  lead:'12바이트짜리 옵티마이저 상태를 GPU 수만큼 나눠 보관한다.',
  d:'전체 16바이트 중 12바이트를 차지하는 fp32 옵티마이저 상태를 $N_d$ 등분해 각 GPU가 자기 몫만 보관한다. 각 GPU는 자기가 담당하는 파라미터 구간만 갱신하고, 갱신된 fp16 파라미터를 `all-gather`로 서로에게 뿌린다. **통신량은 기존 DP와 동일**하다(reduce-scatter + all-gather = all-reduce). 즉 공짜로 메모리가 1/4로 줄어든다.'},
 {h:'Stage 2 (P_os+g): gradient까지 쪼갠다 — 8배 절약',
  lead:'담당 구간 외 gradient는 만들자마자 버려 통신량 증가 없이 더 아낀다.',
  d:'어차피 각 GPU가 자기 구간만 갱신한다면, 다른 구간의 gradient를 완성된 형태로 들고 있을 이유가 없다. 역전파 도중 레이어별로 gradient가 나오는 즉시 `reduce-scatter`로 담당 GPU에 넘기고 나머지는 버린다. gradient 2바이트도 $N_d$ 로 나뉘어 총 8배 절약. 이 단계까지도 **통신량은 여전히 기존 DP와 같다.**'},
 {h:'Stage 3 (P_os+g+p): 파라미터까지 쪼갠다 — GPU 수에 비례해 절약',
  lead:'파라미터도 나눠 필요한 레이어만 잠깐 모았다 버려 선형으로 절약한다.',
  d:'마지막으로 fp16 파라미터 자체를 나눈다. 각 GPU는 평소 자기 구간만 갖고 있다가, forward/backward에서 어떤 레이어가 필요해지는 순간 그 레이어 파라미터를 `all-gather`로 모으고, 쓰고 나면 즉시 버린다. 메모리는 $16\\Psi/N_d$ 로 **선형 감소**하지만 통신량은 기존 DP 대비 약 1.5배가 된다. GPU를 늘리는 만큼 모델을 키울 수 있다는 뜻이라, 논문은 이 산술만으로 1조 파라미터 규모가 현 하드웨어에서 가능하다고 계산한다.'},
 {h:'모델 병렬을 대체하는 게 아니라 곱한다',
  lead:'모델 병렬은 노드 안에서만 쓰고 노드 간 확장은 ZeRO가 맡는다.',
  d:'ZeRO-DP는 [Megatron](#/p/megatron) 식 텐서 병렬과 직교한다. 실제 100B 실험은 ZeRO stage 1+2에 16-way 모델 병렬을 곱해 400 GPU에서 돌렸다. 핵심은 **모델 병렬을 노드 안에서만 쓰고**(NVLink 대역폭), 노드를 넘는 확장은 ZeRO가 붙은 데이터 병렬로 처리하는 조합이다.'}
],

diagram:{type:'compare', cap:'같은 8 GPU · 같은 계산. 달라지는 것은 "무엇을 중복 보관하는가"뿐이다.',
 left:{t:'기존 데이터 병렬', items:[
  'GPU마다 파라미터 전체 복사본',
  'GPU마다 gradient 전체 복사본',
  'GPU마다 옵티마이저 상태 전체 복사본 (12Ψ)',
  '메모리 = 16Ψ × 8장 (완전 중복)',
  '한 장에 안 들어가면 → 학습 불가']},
 right:{t:'ZeRO (분할 보관)', items:[
  'Stage 1: 옵티마이저 상태만 1/N → 4배 절약',
  'Stage 2: +grad도 1/N → 8배 절약',
  'Stage 3: + 파라미터 1/N → N배 절약',
  '필요할 때만 all-gather로 잠깐 모은다',
  'Stage 1·2는 통신량 증가 0']}},

math:[
 {expr:'Memory(Ψ, N) = 2Ψ + 2Ψ + 12Ψ  →  2Ψ + 2Ψ + 12Ψ/N  →  2Ψ + (2Ψ+12Ψ)/N  →  16Ψ/N',
  tex:'\\begin{aligned} 2\\Psi+2\\Psi+12\\Psi &\\to 2\\Psi+2\\Psi+\\frac{12\\Psi}{N} \\\\ &\\to 2\\Psi+\\frac{2\\Psi+12\\Psi}{N} \\to \\frac{16\\Psi}{N} \\end{aligned}',
  d:'왼쪽부터 baseline / stage 1 / stage 2 / stage 3. $\\Psi$ 는 파라미터 수, $N$ 은 데이터 병렬 차수. 7.5B 모델을 64 GPU로 학습할 때 GPU당 메모리는 120GB → 31.4GB → 16.6GB → 1.9GB로 줄어든다.'},
 {expr:'all-reduce  =  reduce-scatter  +  all-gather',
  tex:'\\text{all-reduce} = \\text{reduce-scatter} + \\text{all-gather}',
  d:'stage 1·2가 "공짜"인 이유의 전부다. 기존 DP의 all-reduce를 두 단계로 분해하면, 그 중간 지점에 이미 **각 GPU가 자기 몫의 gradient만 갖고 있는 상태**가 존재한다. ZeRO는 새 통신을 추가한 게 아니라 그 중간 상태에서 갱신을 끝내고 all-gather로 결과만 뿌린다.'}
],

numbers:[
 {k:'파라미터당 학습 메모리', v:'16 바이트', d:'Adam + fp16 혼합정밀 기준. 파라미터 자체(2바이트)의 **8배**'},
 {k:'Stage 1 / 2 절약', v:'4× / 8×', d:'둘 다 **통신량 증가 없음** — 사실상 기본으로 켜도 되는 구간'},
 {k:'Stage 3 절약', v:'N_d 배 (선형)', d:'대신 통신량 약 1.5×. GPU를 늘린 만큼 모델이 커진다'},
 {k:'실측 규모', v:'100B+ 파라미터 · 400 GPU', d:'15 PetaFLOPS, **초선형(super-linear) 스케일링**'},
 {k:'기존 대비', v:'모델 크기 8× · 성능 10×', d:'논문 당시 SOTA(Megatron) 대비'},
 {k:'MP 없이 가능한 크기', v:'13B', d:'모델 코드를 안 건드리고 데이터 병렬만으로. Megatron 8.3B·[T5](#/p/t5) 11B보다 큼'},
 {k:'파생 결과', v:'Turing-NLG 17B', d:'이 시스템 위에서 학습된 당시 최대 언어모델'}
],

figures:[
 {f:'fig1-stage-memory.png',
  cap:'행이 Baseline→P_os→P_os+g→P_os+g+p 순서로 stage 0~3에 해당한다. 각 GPU 막대에서 파란(파라미터)·주황(gradient) 띠는 그대로 남고 초록(옵티마이저 상태)만 줄다가, 마지막 줄에서는 세 색 전부가 GPU마다 다른 조각(N_d분의 1)만 남는다. 오른쪽 수식·GB 값은 Ψ=7.5B, N_d=64 예시로, stage가 내려갈수록 GPU당 메모리가 120GB→31.4GB→16.6GB→1.9GB로 준다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig2-throughput-speedup.png',
  cap:'x축은 모델 크기(억 단위 파라미터), 회색 막대는 기존 SOTA 대비 ZeRO의 속도 배수(오른쪽 축), 초록/주황/빨강 점은 GPU당 실측 처리량(TFlops, 왼쪽 축)이다. 모델이 커질수록 baseline(빨강 삼각형)은 처리량이 떨어지는 반면 ZeRO(초록 원)는 유지되며, 100B 근처에서 막대 높이(속도 배수)가 가장 크다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'ZeRO eliminates memory redundancies in data- and model-parallel training while retaining low communication volume and high computational granularity, allowing us to scale the model size proportional to the number of devices with sustained high efficiency.',
  src:'Abstract, p.1'}
],

impact:'ZeRO는 알고리즘이 아니라 **회계**를 바꿨다는 점에서 특이하다. 수학적으로 기존 데이터 병렬과 완전히 동일한 gradient를 계산하므로 하이퍼파라미터도, 수렴 곡선도 바뀌지 않는다. 바뀌는 것은 GPU당 메모리뿐이다. 이 "공짜 점심"의 성격 때문에 DeepSpeed 구현은 곧 사실상의 표준이 되었고, PyTorch에 FSDP(Fully Sharded Data Parallel)라는 이름으로 흡수되어 오늘날 오픈 LLM 학습의 기본 설정이 됐다. 실무적으로는 **"모델 병렬을 쓸지 말지" 자체가 대부분의 경우 고민거리가 아니게 됐다** — 13B까지는 그냥 ZeRO를 켜면 된다.',

legacy:[
 '**ZeRO-Offload / ZeRO-Infinity** — 옵티마이저 상태를 CPU RAM과 NVMe로 더 밀어내, 단일 GPU에서 10B급 학습을 가능하게 만든 후속 연구',
 '**PyTorch FSDP** — ZeRO stage 3와 동일한 아이디어가 프레임워크 기본 기능으로 편입. [LLaMA](#/p/llama)를 비롯한 오픈 모델 학습 코드의 표준 백엔드',
 '**3D 병렬의 한 축** — ZeRO(데이터) × [텐서 병렬](#/p/megatron) × 파이프라인 병렬 조합이 100B+ 학습의 정석 레시피로 굳어짐',
 '**추론 쪽으로의 파급** — "복제된 상태를 제거한다"는 발상은 서빙에서 [vLLM](#/p/vllm)의 KV 캐시 공유로, 파인튜닝에서 [LoRA](#/p/lora)의 옵티마이저 상태 제거로 각각 변주됐다'
],

pitfalls:[
 '**Stage 3가 항상 정답은 아니다.** stage 1·2는 통신량이 그대로라 켜지 않을 이유가 거의 없지만, stage 3는 레이어마다 파라미터를 모았다 버리므로 인터커넥트가 느린 환경(PCIe만 있는 노드, 이더넷 클러스터)에서는 오히려 느려진다. **모델이 stage 2로 들어가면 stage 2에서 멈춰라.**',
 '**활성값(activation) 메모리는 ZeRO가 줄여주지 않는다.** ZeRO가 다루는 것은 파라미터·gradient·옵티마이저 상태이며, 배치 크기와 시퀀스 길이에 비례하는 활성값은 별개 문제다. 긴 문맥에서 OOM이 난다면 범인은 대개 활성값이고, 해법은 activation checkpointing이나 [FlashAttention](#/p/flashattention)이다.',
 '**"ZeRO를 쓰면 모델 병렬이 필요 없다"는 절반만 맞다.** 13B 정도까지의 이야기이며, 그 위로 가면 레이어 하나의 파라미터조차 한 장에 안 들어가거나 활성값이 폭발한다. 100B 규모에서 논문 자신도 텐서 병렬을 함께 썼다.'
],

links:[
 {t:'arXiv 1910.02054 — ZeRO: Memory Optimizations Toward Training Trillion Parameter Models', u:'https://arxiv.org/abs/1910.02054'},
 {t:'DeepSpeed 공식 사이트', u:'https://www.deepspeed.ai/'},
 {t:'PyTorch FSDP 문서 (ZeRO stage 3 계열 구현)', u:'https://pytorch.org/docs/stable/fsdp.html'}
]
});
