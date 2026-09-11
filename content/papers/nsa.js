WIKI.paper({
slug:'nsa',
venue:'arXiv 2025 (ACL 2025)',
authors:'Yuan, Gao, Dai et al. (DeepSeek-AI · Peking University · U. Washington)',
arxiv:'2502.11089',

tldr:'추론에서만 쓰던 희소 attention을 **사전학습 단계부터 끝까지 미분 가능하게** 만들어, 27B 파라미터 모델을 260~270B 토큰으로 통째로 학습시킨 논문. 64k 길이에서 forward 9.0배·backward 6.0배·디코딩 11.6배 빨라지면서도 일반 벤치마크 평균 점수는 [Full Attention](#/p/transformer)보다 높았다.',

context:'[희소 attention](#/p/sparse-attn)의 아이디어 자체는 오래됐지만, 두 문제가 실용화를 막고 있었다. 첫째는 **"이론상의 효율"의 함정** — 블록 선택이나 클러스터링으로 계산량은 줄여도 실제 커널이 그 희소성을 GPU 메모리 접근 절감으로 못 바꿔 속도가 그대로인 경우가 흔했다. 둘째는 **학습 불가능성** — 대부분의 방법이 추론 시점에만 희소 패턴을 적용하고 사전학습은 여전히 [FlashAttention](#/p/flashattention) 같은 dense attention으로 하거나, top-k 선택처럼 미분이 끊기는 연산을 쓰기 때문에 사전학습부터 희소 구조로 갈 수 없었다. 그 결과 기존 방법들은 추론 가속과 학습 효율화 중 하나만 얻었다. NSA(Native Sparse Attention)는 이 두 요구를 동시에 만족시키는 것을 목표로 한다.',

ideas:[
 {h:'세 갈래 병렬 attention: 압축·선택·슬라이딩',
  lead:'키·값을 압축 요약, 중요 블록 선택, 최근 윈도 세 경로로 나눠 각각 attention한 뒤 게이트로 합친다.',
  d:'각 쿼리가 전체 과거 토큰을 세 경로로 나눠서 본다. **압축(compression)** 경로는 연속된 블록을 하나의 대표 벡터로 뭉쳐 전역적인 큰 그림을 저비용으로 유지하고, **선택(selection)** 경로는 압축 단계에서 나온 attention score를 재활용해 중요도 상위 $n$개 블록만 원래 해상도로 골라 정밀하게 본다, **슬라이딩(sliding window)** 경로는 최근 토큰을 항상 포함해 국소 패턴을 놓치지 않는다. 세 출력은 학습된 게이트로 가중합된다.'},
 {h:'하드웨어 정렬(hardware-aligned): 이론적 희소성을 실제 속도로',
  lead:'블록 단위 연속 메모리 접근과 GQA 그룹 단위 쿼리 로딩으로 희소성을 실제 커널 속도로 전환한다.',
  d:'"하드웨어 정렬"이란 희소 패턴을 GPU가 실제로 빠르게 처리할 수 있는 형태로 강제한다는 뜻이다. 무작위 인덱스 대신 **연속된 블록** 단위로만 선택해 Tensor Core의 연속 메모리 접근 이점을 살리고, [GQA](#/p/mqa)처럼 KV 캐시를 공유하는 쿼리 헤드들이 **같은 블록 선택**을 공유하도록 강제해 그룹 내에서 중복 KV 로딩이 생기지 않게 한다. Triton 커널을 GQA 그룹 단위(Grid Loop)로 쿼리를 로드하도록 짜서 산술 강도(arithmetic intensity)를 균형 있게 유지한다.'},
 {h:'네이티브 학습 가능성: 미분 가능한 선택',
  lead:'top-k 대신 압축 단계의 attention score를 그대로 재사용해 선택 연산에 그라디언트가 흐르게 한다.',
  d:'기존 방법들이 top-k 인덱싱으로 그라디언트를 끊는 것과 달리, NSA는 블록 중요도 점수를 압축 attention의 softmax 출력에서 그대로 유도한다(식 8~10). 이 점수로 top-n 블록을 고르는 연산 자체는 미분되지 않지만, 그 점수를 만드는 압축 경로는 완전히 미분 가능해서 **역전파가 선택 메커니즘 전체를 통해 흐른다**. 이것이 "사전학습부터 희소 구조로 간다"를 가능하게 하는 핵심이다.'}
],

diagram:{type:'split', cap:'쿼리 하나가 세 경로(압축·선택·슬라이딩)로 동시에 attention을 계산하고 게이트로 합쳐진다.',
 from:{t:'쿼리 q_t'},
 branches:[
  {t:'압축 attention', s:'블록 단위 요약'},
  {t:'선택 attention', s:'top-n 블록만', acc:true},
  {t:'슬라이딩 attention', s:'최근 w 토큰'}
 ], join:'학습된 게이트로 가중합'},

math:[
 {expr:'p_t^slc[j] = Σ p_t^cmp(블록 매핑)',
  tex:'\\mathbf{p}_t^{\\text{slc}} \\;=\\; \\sum_{m,n} \\mathbf{p}_t^{\\text{cmp}}\\!\\left[\\tfrac{l^{\\prime}}{d} j - m - n\\right]',
  d:'압축 attention에서 나온 점수 $p_t^{cmp}$ 를 선택 블록 크기 $l\'$ 에 맞춰 재매핑해 선택 블록 중요도로 쓴다. 별도의 중요도 계산 없이 이미 계산된 압축 attention을 재활용하는 것이 핵심.'},
 {expr:'I_t = {i | rank(p_t^slc[i]) ≤ n}',
  tex:'\\mathcal{I}_t = \\{\\, i \\mid \\text{rank}(\\mathbf{p}_t^{\\text{slc}}[i]) \\le n \\,\\}',
  d:'중요도 상위 $n$개 블록의 인덱스 집합. 이 블록들의 키·값만 원래 해상도로 selection attention에 참여한다.'}
],

numbers:[
 {k:'백본 · 정밀도', v:'27B 총 파라미터(3B 활성) GQA+MoE, 30층, d=2560', d:'DeepSeekMoE 구조, top-6/72 라우팅 전문가'},
 {k:'GQA 설정', v:'그룹 4개 · 헤드 64개 · d_k=192, d_v=128', d:'효율 분석에서는 그룹 4·헤드/그룹 16 설정 사용'},
 {k:'학습 규모', v:'270B 토큰 · 8k 길이 사전학습 → 32k 연속학습(YaRN)', d:'Full Attention과 동일 조건으로 비교'},
 {k:'벤치마크 평균', v:'NSA 0.456 vs Full Attention 0.443', d:'MMLU·BBH·GSM8K·MATH·DROP·MBPP·HumanEval 등 9개 과제 평균'},
 {k:'학습 속도(A100, Triton, 64k)', v:'forward 9.0× · backward 6.0×', d:'8k에서는 forward 2.1×·backward 1.1×로 시작해 길이가 늘수록 격차 확대'},
 {k:'디코딩 속도(64k)', v:'11.6× (이론적 기대치와 근접)', d:'KV 캐시 로딩량이 65536→5632 토큰으로 줄어든 것에 비례'}
],

impact:'NSA는 희소 attention을 "추론 가속 트릭"에서 "사전학습부터 쓰는 아키텍처 구성요소"로 옮겼다. 압축된 요약 정보로 선택 중요도를 유도하는 방식은 별도의 라우팅 네트워크 없이도 미분 가능한 희소성을 얻을 수 있음을 보여줬고, GQA 그룹 단위로 블록 선택을 공유해야 한다는 관찰은 이후 희소 attention 설계의 공통 제약이 됐다. 같은 시기 [MoBA](#/p/moba)가 MoE 라우팅 관점에서 유사한 문제를 풀었다는 점에서, 2025년 초 "학습 가능한 블록 희소 attention"이 독립적으로 수렴한 방향임을 보여준다.',

legacy:[
 '**압축+선택+슬라이딩 3분기 구조**가 이후 장문맥 아키텍처의 참조 설계로 자리잡음',
 '[MoBA](#/p/moba)와 함께 "학습 가능한 블록 희소 attention" 계열을 형성 — 라우팅 관점(MoBA) vs 압축 점수 재활용 관점(NSA)의 대비',
 'GQA 그룹 단위 블록 선택 공유가 이후 희소 attention 커널 설계의 기본 제약으로 정착',
 '[FlashAttention-3](#/p/flashattention3)류의 "하드웨어에 맞춘 커널 재설계"와는 다른 축 — 계산량 자체를 줄이는 접근으로 상호보완적'
],

pitfalls:[
 '**속도 비교는 A100 + Triton 커널 기준이다.** H100/Hopper나 다른 백엔드(cuDNN, CUTLASS)에서의 수치가 아니므로 [FlashAttention-3](#/p/flashattention3) 같은 Hopper 전용 최적화와 직접 비교하면 안 된다.',
 '**속도 이득은 길이에 비선형적으로 커진다.** 8k에서는 forward 2.1배에 불과하고, 짧은 문맥(길이 수백~수천)에서는 압축·선택 오버헤드 때문에 이득이 거의 없거나 역전될 수 있다 — 긴 문맥(수만 토큰) 워크로드에 특화된 최적화다.',
 '**"사전학습부터 희소"라는 주장은 27B/270B 토큰 규모 실험 하나에 근거한다.** 훨씬 큰 모델·데이터에서도 같은 결론이 유지되는지는 이 논문만으로는 확인되지 않는다.'
],

figures:[
 {f:'fig2-architecture.png', cap:'왼쪽: 하나의 쿼리 q_t가 압축(Compression)·선택(Selection)·슬라이딩(Sliding) 세 경로를 거쳐 각각 attention을 계산하고 Gated Output으로 합쳐진다. 오른쪽: 세 경로가 실제로 계산하는(초록) 영역과 건너뛰는(흰색) 영역의 패턴 — 압축은 전체를 성기게, 선택은 블록 단위로 듬성듬성, 슬라이딩은 대각선 띠만.', src:'원문 Figure 2, p.3'},
 {f:'fig1-performance-speed.png', cap:'왼쪽: 일반/LongBench/추론 벤치마크 모두에서 NSA(빨강)가 Full Attention(주황)과 같거나 더 높은 점수. 오른쪽: 64k 길이에서 디코딩 11.6배, forward 9.0배, backward 6.0배 — 세 단계 모두에서 속도가 개선됨을 한눈에 보여준다.', src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We present NSA, a Natively trainable Sparse Attention mechanism that integrates algorithmic innovations with hardware-aligned optimizations to achieve efficient long-context modeling.', src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2502.11089 — Native Sparse Attention', u:'https://arxiv.org/abs/2502.11089'}
]
});
