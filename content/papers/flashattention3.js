WIKI.paper({
slug:'flashattention3',
venue:'arXiv 2024 (NeurIPS 2024)',
authors:'Shah, Bikshandi, Zhang, Thakkar, Ramani, Dao (Colfax Research · Meta · NVIDIA · Georgia Tech · Princeton · Together AI)',
arxiv:'2407.08608',

tldr:'H100(Hopper) 세대 하드웨어의 **비동기 텐서 코어와 FP8**을 정면으로 활용해 [FlashAttention-2](#/p/flashattention2)보다 attention을 1.5~2.0배 더 빠르게 만든 논문. FP16에서 이론 최대치의 75%(740 TFLOPs/s)까지 끌어올렸다.',

context:'[FlashAttention](#/p/flashattention)은 타일링과 online softmax로 attention의 HBM 접근을 줄여 메모리 병목을 풀었고, [FlashAttention-2](#/p/flashattention2)는 스레드블록·워프 단위로 작업을 재분배해 병렬성을 끌어올렸다. 그런데 이 두 버전은 A100 세대(Ampere)를 기준으로 설계됐고, 정작 H100(Hopper)에 올리면 GEMM 커널이 80~90% 활용률을 내는 것과 달리 FlashAttention-2는 **35% 활용률**에 그쳤다. 원인은 Hopper가 새로 얻은 능력 — Tensor Core와 TMA(Tensor Memory Accelerator)의 비동기 실행, FP8 Tensor Core — 을 FlashAttention-2의 동기식 설계가 전혀 쓰지 못하기 때문이다. 하드웨어 세대가 바뀌면 커널도 그 세대에 맞춰 다시 짜야 한다는 것이 이 논문의 출발점이다.',

ideas:[
 {h:'Producer-Consumer 비동기: warp-specialization',
  lead:'워프를 데이터 이동 담당과 계산 담당으로 나눠 GEMM과 데이터 이동을 겹친다.',
  d:'Hopper의 TMA는 데이터 이동을 텐서 코어와 완전히 분리된 하드웨어 유닛으로 처리한다. 이 논문은 CTA(스레드블록) 안의 워프그룹을 producer(TMA로 Q·K·V를 SMEM에 올리는 역할)와 consumer(WGMMA로 실제 GEMM을 도는 역할)로 나눈다. producer는 계산에 관여하지 않으므로 레지스터를 거의 안 쓰고, consumer는 데이터 도착을 기다리는 대신 다음 블록의 로드가 이미 진행 중인 상태로 계산을 이어간다.'},
 {h:'Softmax를 GEMM 아래로 숨긴다',
  lead:'느린 지수함수 연산을 인접 블록의 비동기 WGMMA 계산 뒤에 겹쳐서 가린다.',
  d:'H100은 FP16 GEMM에 989 TFLOPS를 내지만 지수함수(softmax에 필요) 처리량은 3.9 TFLOPS뿐이다 — **약 256배 차이**. 헤드 차원 128 기준 GEMM 연산량이 지수 연산량의 512배이므로 softmax가 파이프라인에서 그냥 두면 병목이 된다. 2단계 pingpong 스케줄링으로 한 워프그룹이 softmax를 계산하는 동안 다른 워프그룹이 WGMMA(비동기 GEMM 명령)를 돌리게 겹쳐, softmax 지연을 GEMM 뒤에 숨긴다. 이 최적화만으로 570→620-640 TFLOPS(헤드 차원 128, 길이 8192)로 뛴다.'},
 {h:'FP8 저정밀도: 레이아웃 변환과 정확도 보정',
  lead:'FP8 텐서 코어로 처리량을 2배 올리되, 블록 양자화·incoherent processing으로 정밀도 손실을 상쇄한다.',
  d:'FP8 WGMMA는 FP16과 달리 k-major 레이아웃만 지원해서 V 타일을 커널 내부에서 전치해야 하고, 첫 GEMM의 FP32 누산기 레이아웃이 두 번째 GEMM의 FP8 피연산자 레이아웃과 달라 레지스터 단위 순열 변환이 필요하다. 정확도 쪽에서는 텐서 전체가 아니라 **블록마다 별도 스케일**을 쓰는 블록 양자화와, 이상치(outlier)를 무작위 회전으로 분산시키는 incoherent processing 두 기법을 더해 FP8 표준 구현 대비 RMSE를 **2.6배** 낮췄다.'}
],

diagram:{type:'flow', cap:'2개 워프그룹이 GEMM과 softmax를 번갈아 겹치는 pingpong 스케줄링. 색이 같으면 같은 반복(iteration).',
 nodes:[
  {t:'워프그룹1: GEMM0', s:'K·Q 곱'},
  {t:'워프그룹2: GEMM0', s:'동시 진행', a:'겹침'},
  {t:'워프그룹1: Softmax', s:'지수 연산', acc:true},
  {t:'워프그룹2: GEMM1', s:'P·V 곱', a:'겹침'},
  {t:'다음 반복', s:'역할 교대'}
 ]},

math:[
 {expr:'H100 FP16 matmul 989 TFLOPS vs 지수함수 3.9 TFLOPS',
  tex:'\\frac{989\\ \\text{TFLOPS (matmul)}}{3.9\\ \\text{TFLOPS (exp)}} \\approx 256\\times',
  d:'헤드 차원 128 기준 softmax의 지수 연산이 GEMM에 비해 처리량이 256배 낮다. 겹치지 않으면 softmax가 전체 파이프라인의 실제 병목이 된다.'},
 {expr:'실효 활용률 = 측정 TFLOPs/s ÷ 이론 최대 TFLOPS',
  tex:'\\text{utilization}=\\frac{740}{989}\\approx 75\\%',
  d:'FP16에서 FlashAttention-3가 도달한 활용률. FlashAttention-2는 같은 하드웨어에서 35%에 그쳤다.'}
],

numbers:[
 {k:'GPU · 정밀도', v:'H100 SXM5 80GB · FP16/BF16, FP8', d:'Hopper 세대 전용 최적화, 헤드 차원 64/128/256'},
 {k:'FP16 forward 속도향상', v:'1.5~2.0×', d:'FlashAttention-2 대비, 시퀀스 512~16k'},
 {k:'FP16 최고 처리량', v:'740 TFLOPs/s (75% 활용률)', d:'이론 최대 989 TFLOPS 대비'},
 {k:'FP8 처리량', v:'약 1.2 PFLOPs/s', d:'FP16 대비 텐서 코어 처리량이 2배인 것을 대부분 실현'},
 {k:'FP8 수치 오차 개선', v:'2.6× 낮은 RMSE', d:'블록 양자화 + incoherent processing 적용, 표준 per-tensor FP8 대비'},
 {k:'속도 이득이 나타나는 시점', v:'짧은 길이(512)부터 이미 우위', d:'512에서도 FA2 대비 약 1.4배, 8k~16k까지 격차 유지(OOM 없이 확장)'}
],

impact:'attention 커널 최적화가 "메모리 접근 줄이기"([FlashAttention](#/p/flashattention))에서 "하드웨어 세대별 비동기·저정밀도 자원 쓰기"로 한 단계 더 들어갔다. FP8 attention이 실용 정확도로 동작한다는 것을 보여, 이후 추론 서빙 스택이 attention까지 저정밀도로 내리는 근거가 됐다. 동시에 이 논문은 attention 커널이 하드웨어 세대마다 사실상 다시 설계돼야 한다는 것을 보여줬고, 이는 [NSA](#/p/nsa)·[MoBA](#/p/moba)처럼 애초에 계산량 자체를 줄이는 방향과는 다른 축의 최적화다.',

legacy:[
 '**하드웨어-알고리즘 공동설계 계열의 정점** — 커널이 순수 알고리즘이 아니라 GPU 세대(Ampere→Hopper→Blackwell)마다 재작성 대상이 된다는 것을 보임',
 'FP8 attention의 실용성 입증이 이후 저정밀도 추론 서빙(vLLM 등)의 attention 양자화 논의를 뒷받침',
 '[NSA](#/p/nsa)·[MoBA](#/p/moba)가 채택한 "하드웨어 정렬(hardware-aligned)"이라는 표현이 이 논문류의 문제의식(GPU가 실제로 잘하는 연산 패턴에 맞추기)을 계승',
 'Blackwell(FP4) 등 차세대 GPU에도 같은 비동기·저정밀도 원칙이 적용될 것으로 저자들이 명시적으로 전망'
],

pitfalls:[
 '**"2배 빨라졌다"는 FlashAttention-2 대비 수치이지 원조 FlashAttention이나 다른 구현 대비가 아니다.** 비교 기준(cuDNN, Triton 등)이 그래프마다 다르므로 어떤 베이스라인인지 확인해야 한다.',
 '**FP8 경로는 FP16 경로만큼 최적화되지 않았다.** persistent kernel과 load balancing이 FP16에만 적용돼 있어, 짧은 시퀀스·causal mask 조건에서는 FP8이 cuDNN보다 처지는 경우가 있다고 저자들이 명시했다.',
 '**Hopper 전용 설계다.** WGMMA·TMA는 H100의 명령어 집합이라 A100 이전 GPU에는 이 최적화가 그대로 이식되지 않는다.'
],

figures:[
 {f:'fig1-pingpong.png', cap:'두 워프그룹이 GEMM0→Softmax→GEMM1을 어긋나게 실행한다. 같은 색 블록이 같은 반복(iteration)이고, 한 워프그룹의 Softmax(느림) 구간에 다른 워프그룹의 GEMM(빠름)이 겹쳐 실행되는 것이 핵심.', src:'원문 Figure 1, p.6'},
 {f:'fig5-speed-headdim128.png', cap:'헤드 차원 128, causal mask 없음, H100 기준 forward 속도. FlashAttention-3(보라)가 시퀀스 512부터 이미 FlashAttention-2(주황)를 앞서고, 길이가 늘어도 격차가 유지된다 — 16k에서 FA2가 OOM(막대 없음)인 반면 FA3는 계속 동작한다.', src:'원문 Figure 5(c), p.10'}
],

quotes:[
 {t:'FlashAttention elaborated an approach to speed up attention on GPUs through minimizing memory reads/writes. However, it has yet to take advantage of new capabilities present in recent hardware, with FlashAttention-2 achieving only 35% utilization on the H100 GPU.', src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2407.08608 — FlashAttention-3', u:'https://arxiv.org/abs/2407.08608'},
 {t:'Colfax Research 기술 블로그', u:'https://research.colfax-intl.com/flashattention-3-fast-and-accurate-attention-with-asynchrony-and-low-precision/'}
]
});
