WIKI.paper({
slug:'sana',
venue:'NVIDIA Technical Report (2024)',
authors:'Xie, Chen, Chen, Cai, Tang, Lin, Zhang, Li, Zhu, Lu, Han (NVIDIA · MIT · Tsinghua)',
arxiv:'2410.10629',

tldr:'**깊은 압축 오토인코더**(공간 압축률 32×)와 **선형 어텐션 DiT**를 결합해, 4096×4096 이미지를 노트북 GPU에서 생성하면서도 파라미터 0.6B로 12B급 Flux와 경쟁하는 text-to-image 모델. "느린 것은 attention의 $O(n^2)$과 토큰 수 둘 다"라는 이중 병목을 한 번에 공략했다.',

context:'[LDM](#/p/ldm) 계열은 [VAE](#/p/ldm) 오토인코더로 이미지를 압축한 뒤 그 latent에서 diffusion을 돌린다. 문제는 표준 오토인코더(AE-F8, 공간 압축 8×)가 고정관념처럼 굳어 있었다는 점이다 — PixArt 계열, [SD3](#/p/sd3), Flux까지 전부 AE-F8을 쓰면서 모델 크기만 8B, 10B, 12B로 키워왔다. 해상도가 4K로 올라가면 토큰 수가 압축률의 제곱에 비례해 폭증하고, 여기에 [Transformer](#/p/transformer)의 self-attention이 $O(n^2)$ 이라 두 문제가 곱으로 겹친다. 질문은 단순하다 — **압축을 더 세게 하고 attention을 선형으로 바꾸면, 모델을 키우지 않고도 고해상도를 감당할 수 있지 않을까?**',

ideas:[
 {h:'깊은 압축 오토인코더: 8배가 아니라 32배',
  lead:'공간 압축률을 8×에서 32×로 올려 latent 토큰 수를 4배 더 줄인다.',
  d:'기존 AE-F8C4는 이미지를 가로세로 8배씩 줄인다. SANA는 AE-F32C32(32배 압축, 채널 32)를 새로 학습해 **패치 크기 1**로 DiT에 넣는다. 압축을 더 세게 가는 대신 채널 수를 32로 늘려, 압축률이 훨씬 높은 SDv1.5 계열의 AE-F32C64보다 재구성 품질을 끌어올려 SDXL의 AE-F8C4에 근접시켰다(재구성 rFID 0.34 vs SDXL 0.31, PSNR 29.29 vs 31.41). "압축은 오토인코더가 전담하고 DiT는 디노이징에만 집중한다"는 역할 분리가 핵심 설계 철학이다.'},
 {h:'선형 어텐션 DiT: O(n²)을 O(n)으로',
  lead:'softmax 대신 ReLU 기반 선형 어텐션으로 어텐션 복잡도를 토큰 수에 선형으로 낮춘다.',
  d:'모든 vanilla self-attention을 ReLU linear attention으로 교체한다. Query·Key에 ReLU를 씌운 뒤 $\\sum_j \\text{ReLU}(K_j)^\\top V_j$ 를 먼저 계산하면 쿼리 순서와 무관하게 재사용할 수 있어, 전체 복잡도가 토큰 수 $N$ 에 대해 선형이 된다. 4K 해상도처럼 토큰 수가 많을수록 이 교체의 효과가 커진다.'},
 {h:'Mix-FFN: 선형 어텐션의 약점을 depthwise conv로 보완',
  lead:'MLP-FFN에 depthwise convolution을 끼워 선형 어텐션이 잃는 지역 정보를 되살린다.',
  d:'선형 어텐션은 softmax의 비선형 대조(sharp weighting)를 잃어 지역적인 세부 정보 포착이 약해진다. FFN을 inverted residual 블록 안에 3×3 depthwise convolution을 끼운 Mix-FFN으로 바꿔, 토큰 간 지역 정보를 다시 채워 넣는다. 이 덕분에 위치 인코딩(positional embedding)이 없어도 학습이 된다는 부수 효과도 얻는다.'},
 {h:'디코더 전용 소형 LLM을 텍스트 인코더로',
  lead:'T5 대신 디코더 전용 소형 LLM을 in-context 지시문과 함께 텍스트 인코더로 쓴다.',
  d:'기존 계열이 쓰던 인코더-디코더 구조의 T5를 버리고, 현대 디코더 전용 소형 LLM을 텍스트 인코더로 채택한다. 복잡한 사람 지시문(instruction)을 in-context 예시와 함께 넣어 프롬프트-이미지 정합성을 높인다.'},
 {h:'Flow-DPM-Solver로 샘플링 스텝도 줄인다',
  lead:'flow matching 궤적 전용 DPM-Solver 변형으로 적은 스텝에서도 품질을 유지한다.',
  d:'학습·모델 구조뿐 아니라 샘플링도 최적화한다. flow-based 궤적에 맞춘 DPM-Solver 변형(Flow-DPM-Solver)과 효율적인 캡션 라벨링·선택으로 수렴 속도까지 함께 끌어올린다. 이는 [일관성 모델](#/c/consistency-c) 계열의 "학습 자체를 소수 스텝으로" 바꾸는 접근과는 달리, 여전히 다단계 [ODE 샘플러](#/c/ddim-samplers)를 쓰되 그 스텝 수와 스텝당 비용을 함께 줄이는 방향이다.'}
],

diagram:{type:'compare', cap:'기존 latent diffusion 파이프라인과 SANA의 차이. 압축률과 attention 복잡도를 동시에 공략한다.',
 left:{t:'기존: AE-F8 + softmax', items:[
  '공간 압축 8배 — 토큰 수 많음',
  'self-attention O(n²)',
  '4K 생성에 수십 초~십수 초',
  '모델 크기로 품질 확보 (8~12B)']},
 right:{t:'SANA: F32 + 선형attn', items:[
  '공간 압축 32배 — 토큰 4배 감소',
  'ReLU 선형 attention O(n)',
  '4K 생성 4~10초대, 0.6B로 가능',
  'Mix-FFN으로 지역 정보 보완']}},

math:[
 {expr:'O_i = Σ_j ReLU(Q_i)·ReLU(K_j)ᵀ·V_j / Σ_j ReLU(Q_i)·ReLU(K_j)ᵀ = ReLU(Q_i)(Σ_j ReLU(K_j)ᵀV_j) / ReLU(Q_i)(Σ_j ReLU(K_j)ᵀ)',
  tex:'O_i=\\frac{\\sum_{j=1}^{N}\\text{ReLU}(Q_i)\\text{ReLU}(K_j)^{\\top}V_j}{\\sum_{j=1}^{N}\\text{ReLU}(Q_i)\\text{ReLU}(K_j)^{\\top}}=\\frac{\\text{ReLU}(Q_i)\\left(\\sum_{j=1}^{N}\\text{ReLU}(K_j)^{\\top}V_j\\right)}{\\text{ReLU}(Q_i)\\left(\\sum_{j=1}^{N}\\text{ReLU}(K_j)^{\\top}\\right)}',
  d:'softmax를 커널 $\\text{ReLU}(\\cdot)$ 로 바꾸면 우변처럼 재결합이 가능해, $\\sum_j \\text{ReLU}(K_j)^\\top V_j$ 를 모든 쿼리가 재사용하는 $O(N)$ 계산으로 바뀐다. [Transformer](#/p/transformer)의 $QK^\\top/\\sqrt{d_k}$ softmax attention과 정확히 이 재결합 가능성 여부가 다르다.'}
],

numbers:[
 {k:'오토인코더 압축률', v:'32× (AE-F32C32)', d:'공간 압축 8×가 표준이던 것을 32×로, latent 토큰 수는 기존 대비 4배 감소'},
 {k:'파라미터 대비 경쟁 모델', v:'20배 작음', d:'SANA-0.6B가 Flux-12B 대비 20분의 1 크기로 측정 throughput 경쟁'},
 {k:'측정 throughput', v:'100배 이상 빠름', d:'SANA-0.6B vs Flux-12B, 같은 조건 측정 처리량 비교'},
 {k:'1024² 생성 지연시간', v:'0.9초 (SANA-0.6B)', d:'Flux-Dev 23.0초 대비 **25배** 단축 (그림 1b)'},
 {k:'4096² 생성 지연시간', v:'9.6초 (SANA-0.6B)', d:'Flux-Dev 1023.0초 대비 **106배** 단축 (그림 1c)'},
 {k:'GenEval / DPG-Bench', v:'0.64 / 83.6', d:'SANA-0.6B, 파라미터 12B인 Flux-dev(GenEval 0.67, DPG 84.0)에 근접'}
],

impact:'"모델을 키우면 품질이 오른다"는 당시 text-to-image 계의 관성(PixArt 0.6B → [SD3](#/p/sd3) 8B → Flux 12B)에 정면으로 반박하는 사례가 됐다 — 오토인코더의 압축률과 attention의 복잡도라는 **아키텍처 병목**을 고치면 파라미터를 늘리지 않고도 4K 해상도를 감당할 수 있음을 보였다. 이는 온디바이스·엣지 배포 가능한 text-to-image 모델의 실질적 기준점이 됐고, "attention을 어떻게 줄일까"라는 언어모델 쪽 고민([FlashAttention](#/p/flashattention), 선형 attention 계열)이 확산 트랜스포머에도 그대로 유효함을 실증했다.',

legacy:[
 '**깊은 압축 오토인코더 설계의 재조명** — AE-F8을 당연시하던 관행에 압축률 자체가 조정 가능한 설계 변수임을 보여, 후속 latent diffusion 연구가 압축률·채널 수를 함께 탐색하게 됨',
 '**선형 attention의 생성 모델 이식** — 언어모델의 $O(n^2)$ 병목 해소 연구 계열이 확산 트랜스포머에도 적용 가능함을 대규모로 실증',
 '**소형 모델 경쟁력 재확인** — [REPA](#/p/repa)가 "학습을 빠르게"였다면 SANA는 "추론과 구조 자체를 가볍게"로, 소수 스텝 생성 계보 안에서 서로 다른 축의 효율화를 보여줌',
 '**증류 없이 구조 개선만으로 속도를 얻는 사례** — [progressive distillation](#/p/progressive-distillation)·[LCM](#/p/lcm)처럼 스텝 수를 줄이는 대신, 스텝당 비용 자체를 줄이는 접근이 가능함을 보여 두 전략이 상호보완적임을 시사'
],

pitfalls:[
 '**"20배 작고 100배 빠르다"는 특정 해상도·하드웨어 조건에서의 측정 throughput 비교다.** 지연시간 수치(0.9초/9.6초)는 SANA-0.6B가 특정 해상도(1024²/4096²)에서 측정한 값이며, 다른 조건에서 그대로 재현된다고 단정할 수 없다.',
 '**압축률을 높이면 재구성 품질이 공짜로 유지되지 않는다.** AE-F32C64는 AE-F8C4 대비 재구성 품질이 크게 떨어졌고, SANA는 채널 수를 32로 늘려서야 격차를 메웠다 — "그냥 압축률만 올리면 된다"는 요약은 틀렸다.',
 '**선형 어텐션 단독으로는 부족하다.** 논문 스스로 선형 어텐션이 지역 정보 포착에 약하다는 것을 인정하고 Mix-FFN(depthwise conv)으로 보완한다 — 선형 어텐션 교체만 떼어 적용하면 품질 저하를 겪을 수 있다.'
],

figures:[
 {f:'fig1-sana-latency.png',
  cap:'1024×1024(왼쪽)와 4096×4096(오른쪽) 생성 지연시간(초) 비교. 회색 막대가 기존 모델(Flux-Dev·SD3·PixArt-Σ), 빨간 막대가 SANA. 4096² 에서 Flux-Dev 1023초 대비 SANA-0.6B는 9.6초로 **106배** 빠르다 — 해상도가 오를수록 압축률·선형 attention의 이득이 커지는 것을 보여준다.',
  src:'원문 Figure 1(b)(c), p.1'}
],

links:[
 {t:'arXiv 2410.10629 — SANA', u:'https://arxiv.org/abs/2410.10629'},
 {t:'프로젝트 페이지', u:'https://nvlabs.github.io/Sana'}
]
});
