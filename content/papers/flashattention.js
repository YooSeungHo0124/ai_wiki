WIKI.paper({
slug:'flashattention',
venue:'NeurIPS 2022',
authors:'Tri Dao, Daniel Y. Fu, Stefano Ermon, Atri Rudra, Christopher Ré (Stanford · SUNY Buffalo)',
arxiv:'2205.14135',

tldr:'attention을 **근사하지 않는다**. 수학적으로 완전히 동일한 결과를 내면서, $n \\times n$ 행렬을 GPU 주메모리에 아예 쓰지 않도록 타일링 + 온라인 softmax로 재구현했다. 메모리는 $O(n^2) \\to O(n)$, 속도는 2~4배. "Efficient Transformer" 논문 수십 편이 못 한 일을 커널 하나가 해냈다.',

context:'2020~2022년의 효율 연구는 대부분 **FLOPs를 줄이는** 방향이었다. [희소 attention](#/p/sparse-attn), 저랭크 근사, 커널 트릭 등이 이론상 $O(n^2)$ 를 $O(n \\log n)$ 이나 $O(n)$ 으로 낮췄다고 주장했지만, 실제 GPU에서 재보면 dense attention보다 빠르지 않은 경우가 많았다. 이 논문의 진단은 다르다 — **attention은 연산 바운드가 아니라 메모리 바운드다**. A100에서 HBM은 40~80GB에 1.5~2.0TB/s인데, 연산기 바로 옆 SRAM은 SM당 192KB에 약 19TB/s다. 표준 구현은 $QK^T$(n×n), softmax 결과(n×d), 마스크·드롭아웃 마스크를 전부 HBM에 쓰고 다시 읽는다. 시퀀스가 길어지면 GPU는 계산이 아니라 **이 왕복**에 시간을 쓴다. 그러니 줄여야 할 것은 FLOPs가 아니라 HBM 접근 횟수다.',

ideas:[
 {h:'IO-aware — 알고리즘의 비용 모델을 메모리 계층으로 바꾼다',
  lead:'비용을 FLOPs가 아니라 HBM 접근 바이트 수로 재정의해 병목을 다시 찾는다.',
  d:'논문은 attention 알고리즘을 FLOPs가 아니라 **HBM 접근 바이트 수**로 분석한다. 표준 attention은 $\\Theta(nd + n^2)$ 번, FlashAttention은 $\\Theta(n^2 d^2 M^{-1})$ 번 접근한다($M$ = SRAM 크기). head 차원 64~128, SRAM 약 100KB인 실제 환경에서 이는 수 배~수십 배 감소다. FLOPs는 오히려 **더 많이** 쓴다(재계산 때문에). 그래도 빠르다는 것이 논문의 핵심 주장이다.'},
 {h:'타일링 — n×n 행렬을 통째로 만들지 않는다',
  lead:'Q·K·V를 블록으로 쪼개 SRAM에서만 부분 attention을 계산하고 곧바로 버린다.',
  d:'Q를 행 블록, K·V를 열 블록으로 쪼개고 이중 루프를 돈다. 각 반복에서 Q 블록과 K·V 블록만 SRAM으로 올려 그 부분 attention을 계산하고, 결과를 출력 누적기에 더한 뒤 버린다. **전체 attention 행렬은 메모리 어디에도 존재한 적이 없다**. 저장되는 것은 출력 $O(n \\times d)$ 와 통계량 두 줄뿐이다.'},
 {h:'온라인 softmax — 블록을 나눠 계산해도 정확히 같은 값이 나온다',
  lead:'최댓값과 정규화 합을 들고 다니며 새 블록마다 누적 출력을 되보정한다.',
  d:'softmax는 행 전체의 합이 필요해 보이므로 블록 분할과 상극처럼 보인다. 그러나 실행 중인 최댓값 $m$ 과 정규화 합 $\\ell$ 을 들고 다니면서, 새 블록이 더 큰 최댓값을 내놓을 때마다 이미 누적한 출력에 $e^{m_{old}-m_{new}}$ 를 곱해 **되보정**하면 된다. 근사가 아니라 대수적으로 동일한 재배열이다 — FlashAttention이 "exact attention"인 이유가 여기다.'},
 {h:'역전파는 저장 대신 재계산',
  lead:'attention 행렬을 저장하지 않고 backward에서 SRAM 안에 다시 계산한다.',
  d:'표준 구현은 backward를 위해 $n \\times n$ attention 행렬을 저장한다. FlashAttention은 forward에서 softmax 통계량 $(m, \\ell)$ 만 남기고, backward에서 그 행렬을 **SRAM 안에서 다시 계산**한다. 추가 FLOPs를 지불하고 HBM 트래픽을 사는 거래이며, 메모리 바운드 상황에서는 이쪽이 이긴다. 활성화 체크포인팅과 같은 논리지만 블록 단위로 훨씬 촘촘하게 적용된다.'},
 {h:'그래서 메모리가 길이에 선형이 된다',
  lead:'attention 메모리가 $O(n)$ 이 되어 OOM 때문에 막혔던 긴 시퀀스가 열린다.',
  d:'attention의 메모리가 $O(n^2)$ 에서 $O(n)$ 이 되면서 "이 시퀀스 길이는 OOM이라 불가능"이라는 제약이 사라진다. 논문은 이 여유로 Path-X(16K)에서 처음으로 우연 이상의 성능을, block-sparse 버전으로 Path-256(64K)까지 도달한다.'}
],

diagram:{type:'flow', cap:'FlashAttention 한 블록의 흐름. Q·K·V 블록만 SRAM에 올라가고, n×n 행렬은 SRAM 밖으로 나가지 않는다. 출력 누적기는 O_i ← O_i·e^(m_old−m_new) + P·V_j 로 재보정된다.',
 nodes:[
  {t:'HBM', s:'Q, K, V · 1.5–2.0 TB/s'},
  {t:'블록 로드', s:'Q_i, K_j, V_j → SRAM'},
  {t:'온라인 softmax', s:'S=QKᵀ · 19 TB/s', acc:true},
  {t:'출력 누적기 재보정', s:'지수 인자로 스케일'},
  {t:'HBM에 결과 기록', s:'O, m, ℓ만 · O(n)'}
 ]},

math:[
 {expr:'m_new = max(m_old, m_blk),   ℓ_new = e^(m_old−m_new)·ℓ_old + e^(m_blk−m_new)·ℓ_blk',
  tex:'m_{\\text{new}}=\\max(m_{\\text{old}},m_{\\text{blk}}),\\quad \\ell_{\\text{new}}=e^{m_{\\text{old}}-m_{\\text{new}}}\\ell_{\\text{old}}+e^{m_{\\text{blk}}-m_{\\text{new}}}\\ell_{\\text{blk}}',
  d:'온라인 softmax의 갱신 규칙. 새 블록의 최댓값이 더 크면 지금까지의 합과 출력을 지수 인자로 스케일해 맞춘다. 수치적으로 안정된 softmax(최댓값 빼기)를 스트리밍으로 확장한 것.'},
 {expr:'HBM accesses:  standard Θ(nd + n²)   →   flash Θ(n²d²/M)',
  tex:'\\text{HBM: standard } \\Theta(nd+n^2)\\;\\longrightarrow\\;\\text{flash } \\Theta(n^2 d^2/M)',
  d:'$M$ 은 SRAM 크기. $d^2/M \\ll 1$ 인 실제 조건($d$=64~128, $M$≈100KB)에서 접근량이 크게 준다. 주목할 점은 FlashAttention이 **FLOPs를 줄이지 않는다**는 것이다.'},
 {expr:'extra memory: O(n)  (기존 O(n²))',
  tex:'\\text{extra memory: } O(n) \\;(\\text{기존 } O(n^2))',
  d:'입력·출력을 제외하고 forward가 추가로 쓰는 메모리. 저장하는 것은 행별 통계량 $m, \\ell$ 두 벡터뿐이다.'}
],

numbers:[
 {k:'A100 메모리 계층', v:'HBM 40–80GB / 1.5–2.0 TB/s vs SRAM 192KB·SM / ~19 TB/s', d:'대역폭 차이 약 10배 — 이 격차가 논문 전체의 동기'},
 {k:'BERT-large 학습', v:'+15%', d:'MLPerf 1.1 기록 대비 end-to-end wall-clock 단축'},
 {k:'GPT-2 small', v:'3.5× vs HuggingFace · 2.0× vs Megatron-LM', d:'end-to-end 학습 속도'},
 {k:'GPT-2 medium', v:'3.0× vs HuggingFace · 1.8× vs Megatron-LM', d:''},
 {k:'Long-Range Arena', v:'2.4×', d:'표준 attention 대비'},
 {k:'Path-X (16K) / Path-256 (64K)', v:'61.4% / 63.1%', d:'Transformer로 우연(50%) 이상을 처음 달성. 후자는 block-sparse 버전'}
],

impact:'세 가지가 동시에 바뀌었다. **(1) 근사 노선의 퇴조** — 정확한 attention이 근사보다 빠르고 메모리도 적게 쓰자, 범용 LLM에서 희소·저랭크 근사를 쓸 이유가 대부분 사라졌다. **(2) 문맥 길이 인플레이션** — attention 메모리가 선형이 되면서 4K→32K→128K 문맥이 공학적으로 가능해졌고, [RoPE](#/p/rope) scaling 같은 확장 기법이 실제로 쓸모 있어졌다. **(3) 커널이 논문이 되는 시대** — 수학은 그대로 두고 하드웨어 메모리 계층에 맞춰 구현만 바꿔도 최상위 학회 논문이 된다는 선례를 남겼다. FlashAttention은 곧 PyTorch(`scaled_dot_product_attention`), HuggingFace, [vLLM](#/p/vllm) 등에 기본값으로 들어가, 오늘날 대부분의 사용자는 이 논문을 쓰고 있다는 사실조차 모른 채 쓴다.',

legacy:[
 '**FlashAttention-2 / -3** — 작업 분할과 non-matmul 연산 최적화로 A100에서 이론 성능의 50~70%까지, Hopper에서는 비동기·FP8 기능까지 활용하도록 재작성됨',
 '**[PagedAttention](#/p/vllm)** — "메모리 레이아웃을 고치면 서빙이 빨라진다"는 같은 사고방식을 KV 캐시 관리로 확장',
 '**[Mamba](#/p/mamba)** — 저자 Tri Dao가 이어서 낸 SSM 계열. hardware-aware 스캔 구현이라는 방법론이 그대로 이어진다',
 '**[GQA](#/p/gqa)와의 결합** — attention 커널이 IO 최적화되자 남은 병목은 KV 캐시 크기가 되었고, 두 기법이 함께 쓰이는 것이 현재 표준 구성이다'
],

pitfalls:[
 '**근사가 아니다.** 출력이 표준 attention과 (부동소수점 오차 범위에서) 동일하다. "FlashAttention을 썼더니 품질이 떨어졌다"면 그건 이 알고리즘 때문이 아니라 dropout seed, 마스킹, 정밀도 설정 문제일 가능성이 높다.',
 '**FLOPs는 줄지 않는다 — 오히려 는다.** backward의 재계산 때문에 연산량은 더 많다. 이득은 전적으로 메모리 트래픽에서 나오므로, 연산 바운드인 짧은 시퀀스에서는 개선폭이 작거나 없다.',
 '**하드웨어와 설정에 민감하다.** head 차원 제한, 특정 dtype, 특정 마스크 형태, GPU 아키텍처에 따라 fast path로 못 들어가 조용히 느린 경로로 폴백하는 일이 흔하다. 속도가 기대만큼 안 나오면 커널이 실제로 선택됐는지부터 확인해야 한다.'
],

figures:[
 {f:'fig1-memory-hierarchy-tiling.png',
  cap:'왼쪽 삼각형이 메모리 계층이다. 위로 갈수록 빠르지만 작다 — SRAM은 19TB/s인데 20MB뿐이고, 맨 아래 CPU DRAM은 1TB 넘게 들어가지만 12.8GB/s로 100배 이상 느리다. 오른쪽 다이어그램은 그 격차를 다루는 법: K/V를 블록 단위로 SRAM에 복사해(Outer Loop, 빨간 화살표) 그 안에서 Q 블록과 함께 계산을 전부 끝내고(Compute Block on SRAM, 주황), $N\\times N$ 크기의 attention 행렬 전체는 HBM에 한 번도 쓰지 않은 채 결과만 HBM으로 내보낸다.',
  src:'원문 Figure 1 (Left), p.2'}
],

quotes:[
 {t:'We argue that a missing principle is making attention algorithms IO-aware—that is, carefully accounting for reads and writes to different levels of fast and slow memory.',
  src:'Section 1, p.1-2'}
],

links:[
 {t:'arXiv 2205.14135 — FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness', u:'https://arxiv.org/abs/2205.14135'},
 {t:'arXiv 2307.08691 — FlashAttention-2', u:'https://arxiv.org/abs/2307.08691'},
 {t:'GitHub — Dao-AILab/flash-attention', u:'https://github.com/Dao-AILab/flash-attention'}
]
});
