WIKI.paper({
slug:'phi3',
venue:'arXiv 2024',
authors:'Microsoft',
arxiv:'2404.14219',

tldr:'3.8B 파라미터 모델(phi-3-mini)이 4-bit 양자화로 휴대폰에서 돌아가면서도 GPT-3.5급 벤치마크 점수를 낸다고 주장한 보고서. [phi 교과서](#/p/phi-textbooks) 계열의 "데이터 품질로 크기를 대체한다"는 노선을 대형 벤치마크로 재확인한다.',

context:'[phi-1](#/p/phi-textbooks)이 처음 제시한 주장 — "교과서 수준으로 정제된 데이터를 쓰면 훨씬 작은 모델도 큰 모델을 따라잡을 수 있다" — 은 코딩이라는 좁은 영역에서만 검증됐었다. phi-3는 이 접근을 범용 대화·추론 능력까지 확장하면서, 동시에 "정말 휴대폰에서 실용적으로 돌아가는가"라는 배포 관점의 질문에 구체적인 수치(메모리, 토큰/초)로 답하려 한 보고서다.',

ideas:[
 {h:'phi-2 데이터셋의 확장판으로 3.8B를 3.3T 토큰까지 학습',
  lead:'phi-2와 같은 계열의 더 크고 정교한 데이터셋을 3.8B 모델에 3.3T 토큰 먹인다.',
  d:'phi-3-mini는 phi-2에서 쓰인 데이터셋의 "더 크고 더 발전된 버전"으로 학습했다고 밝히지만, 정확히 무엇이 어떻게 커졌는지(합성 데이터 생성 프롬프트, 필터링 기준)는 공개하지 않는다. 아키텍처는 [Llama 2](#/p/llama2)와 같은 블록 구조를 그대로 써서, 기존 Llama 툴체인을 그대로 재사용할 수 있게 했다.'},
 {h:'"데이터 최적 영역(Data Optimal Regime)"이라는 자체 스케일링 법칙',
  lead:'같은 데이터로 학습한 Llama-2 계열보다 phi 계열이 모델 크기 대비 MMLU 오차가 훨씬 가파르게 낮다.',
  d:'phi-1.5·phi-2·phi-3-mini·phi-3-small을 모델 크기 대 MMLU 오차율로 로그-로그 플롯하면, 같은 고정 데이터로 학습된 Llama-2 계열(7B~70B)보다 기울기가 훨씬 가파르다. 저자들은 이를 [친칠라](#/p/chinchilla) 최적점과 별개로 "데이터가 좋으면 도달하는 최적 영역 자체가 달라진다"는 근거로 제시한다.'},
 {h:'phi-3-small에 블록스파스 attention을 섞는다',
  lead:'7B 모델은 dense attention과 블록스파스 attention을 층마다 교대로 배치한다.',
  d:'phi-3-small(7B)은 로컬 블록 2개와 수직 stride 3의 블록스파스 attention을 dense attention과 번갈아 쓴다. 긴 시퀀스에서 attention 연산량을 줄이면서도 완전 로컬 윈도우보다 넓은 수용 범위를 유지하려는 설계다. tiktoken 기반 다국어 토크나이저도 이 크기부터 도입된다.'},
 {h:'4-bit 양자화로 휴대폰에서 실제로 돌린다',
  lead:'3.8B 모델을 4-bit로 양자화하면 약 1.8GB 메모리로 iPhone 14(A16)에서 초당 12토큰 이상 생성한다.',
  d:'phi-3-mini를 4-bit로 양자화해 약 1.8GB 메모리에 올리고, A16 Bionic 칩을 탑재한 iPhone 14에서 네트워크 연결 없이 온디바이스로 초당 12토큰 이상 생성하는 것을 시연했다. "휴대폰에서 돈다"는 주장은 이 특정 양자화 수준·특정 칩 조건에서의 결과이며, 원본 bfloat16 가중치를 그대로 올린 결과가 아니다.'},
 {h:'phi-3.5에서 MoE와 비전 모델로 계열을 확장',
  lead:'같은 보고서 후반부에서 16×3.8B MoE(활성 6.6B)와 비전 모델을 추가로 공개한다.',
  d:'phi-3.5-MoE는 16개의 3.8B 전문가 중 활성 파라미터가 6.6B(총 42B)인 구조로, [Llama 3.1](#/p/llama3)이나 Mixtral류와 비슷한 크기대에서 경쟁력을 주장한다. phi-3.5-Vision(4.2B)은 phi-3.5-mini에서 파생된 이미지 이해 모델이다.'}
],

diagram:{type:'compare', cap:'phi-3의 핵심 주장 — 파라미터를 늘리는 대신 데이터 품질을 올려 같은 크기에서 더 낮은 오차에 도달한다.',
 left:{t:'Llama-2 계열', items:['같은 고정 데이터로 학습','7B→70B로 커야 오차 감소']},
 right:{t:'phi-3 계열', items:['정제·합성 데이터 사용','3.8B로도 훨씬 낮은 MMLU 오차']}},

math:[
 {expr:'log(MMLU error rate) ≈ a − b·log(model size), b_phi > b_Llama2',
  tex:'\\log(\\text{MMLU error})\\approx a-b\\cdot\\log(\\text{model size}),\\quad b_{\\text{phi}}>b_{\\text{Llama2}}',
  d:'모델 크기와 MMLU 오차율을 로그-로그로 회귀했을 때, phi 계열의 기울기 $b$ 가 같은 고정 데이터로 학습된 Llama-2 계열보다 가파르다 — 크기를 늘릴 때 오차가 더 빨리 줄어든다는 의미다(Figure 3).'}
],

numbers:[
 {k:'phi-3-mini', v:'3.8B / 3.3T 토큰', d:'컨텍스트 4K, 128K 버전도 별도 공개'},
 {k:'phi-3-small', v:'7B / 4.8T 토큰', d:'블록스파스+dense attention 교대'},
 {k:'phi-3-medium', v:'14B', d:'같은 데이터로 더 많은 epoch 학습'},
 {k:'MMLU (5-shot)', v:'68.8 (mini) / 78.0 (medium)', d:'GPT-3.5(1106) 71.4와 비교 대상'},
 {k:'GSM8K (8-shot CoT)', v:'82.5 (mini)', d:'GPT-3.5(1106) 78.1보다 높음'},
 {k:'양자화 배포', v:'4-bit · ≈1.8GB', d:'iPhone 14(A16)에서 12+ 토큰/초'}
],

impact:'"작은 모델이라도 데이터가 좋으면 큰 모델급 벤치마크 점수를 낼 수 있다"는 주장을 온디바이스 배포라는 구체적 시나리오로 제시해, 이후 경량 모델 보고서들이 벤치마크 점수뿐 아니라 실제 배포 조건(양자화 수준, 메모리, 기기)을 함께 명시하는 관행에 힘을 실었다. 동시에 phi 계열의 높은 벤치마크 점수가 데이터 정제 과정에서 벤치마크와 유사한 형식의 합성 데이터가 섞여 들어간 것 아니냐는 논쟁을 계속 불러왔다.',

legacy:[
 '**온디바이스 LLM 배포의 참조 사례** — 4-bit 양자화·특정 칩·특정 메모리 조건을 명시한 시연이 이후 경량 모델의 "휴대폰에서 실행" 주장의 비교 기준이 됨',
 '**"데이터 최적 영역" 개념의 확산** — [친칠라](#/p/chinchilla) 스케일링과 별개로 데이터 품질이 스케일링 곡선 자체를 바꾼다는 프레이밍이 이후 소형 모델 보고서에 반복 인용',
 '**MoE·비전으로의 자연스러운 확장** — phi-3.5-MoE·Vision이 같은 사전학습 데이터 파이프라인을 재사용해 파생 모델을 늘리는 방식의 사례가 됨',
 '**커뮤니티의 벤치마크 오염 논의** — phi 계열 전반이 학습 데이터에 평가 벤치마크와 유사한 문항이 섞였을 가능성을 놓고 외부에서 반복적으로 문제 제기됐고, 정확한 데이터 구성이 공개되지 않아 검증이 어렵다는 비판이 있다(이 보고서 자체는 이 논쟁을 다루지 않는다).'
],

pitfalls:[
 '**"휴대폰에서 돈다"는 주장은 4-bit 양자화·특정 칩(A16)·특정 메모리(1.8GB) 조건에서다.** 원본 정밀도 가중치를 그대로 휴대폰에 올릴 수 있다는 뜻이 아니다.',
 '**정확한 데이터 구성·필터링 기준·합성 데이터 생성 프롬프트는 공개되지 않았다.** "phi-2보다 크고 발전된 데이터셋"이라는 서술 이상의 재현 정보가 없다.',
 '**벤치마크 오염 의혹은 커뮤니티에서 제기된 논쟁이며, 이 논문이 스스로 인정하거나 검증한 내용이 아니다.** 수치를 그대로 받아들이기 전에 이 맥락을 함께 고려해야 한다.'
],

figures:[
 {f:'fig3-scaling.png',
  cap:'가로축은 모델 크기(로그), 세로축은 MMLU 오차율(로그). 파란 점(phi 계열)의 빨간 회귀선이 초록 점(Llama-2 계열)의 보라 회귀선보다 훨씬 가파르게 떨어진다 — 같은 크기 증가에도 phi 계열의 오차가 더 빨리 준다는 것이 이 그래프의 핵심.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'We introduce phi-3-mini, a 3.8 billion parameter language model trained on 3.3 trillion tokens, whose overall performance, as measured by both academic benchmarks and internal testing, rivals that of models such as Mixtral 8x7B and GPT-3.5.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2404.14219 — Phi-3 Technical Report', u:'https://arxiv.org/abs/2404.14219'},
 {t:'Microsoft — Phi-3 (Hugging Face)', u:'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct'}
]
});
