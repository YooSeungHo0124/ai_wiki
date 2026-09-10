WIKI.paper({
slug:'mixed-precision',
venue:'ICLR 2018',
authors:'Micikevicius et al. (NVIDIA) · Narang et al. (Baidu Research)',
arxiv:'1710.03740',

tldr:'가중치·활성값·그레디언트를 **FP16으로 저장·연산**하면서도 정확도를 잃지 않는 방법을 제시한 논문. FP32 마스터 가중치, 손실 스케일링(loss-scaling), FP32 누산이라는 세 장치로 메모리를 절반 가까이 줄이고 텐서코어 시대의 학습 표준을 열었다.',

context:'2017년까지 딥러닝 학습은 사실상 전부 FP32(단정밀도)였다. 모델이 커질수록 메모리와 연산 시간이 함께 늘어나는데, GPU의 half-precision(FP16) 산술 처리량은 당시 이미 FP32의 2~8배였고 메모리 대역폭도 절반이면 충분했다. 문제는 정확도였다 — FP16을 그냥 쓰면 그레디언트 같은 작은 값이 표현 범위 밖으로 사라지거나(underflow), 가중치 갱신량이 가중치 값에 묻혀 사라지는 일이 실제로 일어났다. 이전의 저정밀도 연구(BinaryConnect, DoReFa 등)는 정확도 손실을 감수하거나 작은 데이터셋(MNIST·CIFAR)에서만 검증돼 있었다. 이 논문의 질문은 "**하이퍼파라미터를 건드리지 않고, 큰 모델에서도 정확도 손실 없이 FP16으로 학습할 수 있는가**"였다.',

ideas:[
 {h:'FP32 마스터 가중치 — 갱신량이 사라지는 문제',
  lead:'가중치는 FP32 원본을 따로 두고, forward/backward에만 FP16 사본을 쓴다.',
  d:'가중치 갱신량(그레디언트×학습률)은 두 가지 이유로 FP16에서 사라진다. 하나는 값 자체가 $2^{-24}$ 보다 작아 underflow하는 경우, 다른 하나는 가중치 값이 갱신량보다 2048배 이상 커서 덧셈 시 비트가 오른쪽으로 밀려 사라지는 경우다. 그래서 **FP32 마스터 사본**을 두고 매 스텝 이 사본에 그레디언트를 누적한 뒤, forward·backward용으로만 FP16으로 반올림한 사본을 만든다. 저장 공간은 가중치 몫만 50% 늘지만, 학습 메모리는 활성값이 지배적이라 전체로는 여전히 거의 절반이 된다.'},
 {h:'손실 스케일링 — 그레디언트를 표현 가능한 범위로 밀어 넣기',
  lead:'손실값을 미리 키워 작은 그레디언트를 FP16 표현 범위 안으로 밀어 넣는다.',
  d:'FP16의 정규화 지수 범위는 $[-14, 15]$ 인데, 실제 그레디언트 분포는 이보다 훨씬 작은 값(음의 지수) 쪽에 몰려 있다. Multibox SSD 실험에서는 활성값 그레디언트의 **67%가 0으로 사라졌다**. forward에서 나온 손실값을 스케일 인자(예: 8)만큼 곱해 두면 연쇄법칙에 의해 모든 그레디언트가 같은 배율로 커지고, 역전파에는 추가 연산이 없다. 가중치 갱신 직전에만 그레디언트를 다시 나눠 원래 크기로 되돌린다.'},
 {h:'FP16 곱셈 + FP32 누산',
  lead:'행렬곱의 곱셈은 FP16으로, 누적합은 FP32 레지스터로 계산해 메모리에는 FP16으로 저장한다.',
  d:'행렬곱·컨볼루션 같은 연산은 개별 곱은 FP16으로 하되, 그 부분곱들을 더하는 누산기는 **FP32로 계산**한 뒤 메모리에 쓸 때만 FP16으로 반올림한다. 텐서코어가 하드웨어 수준에서 이 방식을 지원하도록 설계됐고, 이 덕분에 누적 오차 없이 FP16의 속도·메모리 이점만 취할 수 있다.'},
 {h:'하이퍼파라미터 불변으로 검증',
  lead:'CNN 분류·검출·언어모델·음성인식·GAN까지 하이퍼파라미터 변경 없이 FP32와 동등한 정확도를 재현했다.',
  d:'AlexNet부터 ResNet50, Faster-RCNN·SSD, 기계번역, DeepSpeech 2, GAN까지 폭넓은 아키텍처에 같은 세 기법을 적용해, **학습률·배치 크기 등 어떤 하이퍼파라미터도 바꾸지 않고** FP32 기준선과 동등한 정확도를 재현했다. 이것이 이 방법이 "특정 모델의 트릭"이 아니라 "일반 레시피"로 받아들여진 이유다.'}
],

diagram:{type:'flow', cap:'한 층의 forward-backward 한 스텝. 검정 화살표는 FP32, 초록/파랑은 FP16 텐서.',
 nodes:[
  {t:'FP32 마스터 W', s:'float2half로 변환'},
  {t:'FWD', s:'FP16 W·활성값'},
  {t:'BWD-Activ', s:'FP16 그레디언트'},
  {t:'BWD-Weight', s:'FP16 → 가중치 그레디언트'},
  {t:'Weight Update', s:'FP32 누적', acc:true, note:'마스터 가중치만 갱신'}
 ]},

math:[
 {expr:'W_master(FP32) → W_fp16 = round(W_master),  W_master ← W_master + η·g(FP32)',
  tex:'W_{\\text{fp16}}=\\text{round}(W_{\\text{master}}),\\qquad W_{\\text{master}}\\leftarrow W_{\\text{master}}+\\eta\\, g_{\\text{FP32}}',
  d:'forward/backward는 반올림된 FP16 가중치로 하되, 실제 갱신은 FP32 마스터 사본에 누적한다. 작은 갱신량이 반복적으로 사라지는 것을 막는다.'},
 {expr:'L_scaled = S · L,   g_unscaled = (1/S) · ∂L_scaled/∂w',
  tex:'L_{\\text{scaled}} = S\\cdot L,\\qquad g_{\\text{unscaled}} = \\frac{1}{S}\\cdot\\frac{\\partial L_{\\text{scaled}}}{\\partial w}',
  d:'손실에 스케일 $S$(논문 실험에서 8~32K)를 곱해 역전파하면 모든 그레디언트가 $S$ 배 커진다. 가중치 갱신 직전에 $1/S$ 로 나눠 원래 크기를 복원한다.'}
],

numbers:[
 {k:'메모리 절감', v:'약 1/2', d:'활성값·그레디언트가 FP16이 되며 학습 메모리 전체가 거의 절반으로'},
 {k:'ILSVRC12 top-1 (ResNet50)', v:'75.92% → 76.04%', d:'FP32 대비 mixed precision, Table 1 — 정확도 손실 없음'},
 {k:'Multibox SSD mAP', v:'76.9%(FP32) vs 발산(스케일링 없음) vs 77.1%(스케일링 적용)', d:'Table 2 — 손실 스케일링 없인 학습 자체가 실패'},
 {k:'FP32 마스터 없이 학습', v:'상대 정확도 −80%', d:'Mandarin 음성인식 실험, FP16 가중치만으로 갱신했을 때'},
 {k:'SSD 활성값 그레디언트 중 0', v:'67%', d:'손실 스케일링 없이 FP16으로 저장했을 때(Figure 3)'},
 {k:'손실 스케일 인자 범위', v:'8 ~ 32K', d:'실험한 다양한 네트워크에서 사용한 상수 스케일 값(대다수는 불필요)'}
],

impact:'FP32가 기본값이던 학습을 FP16(+FP32 마스터/누산)이 기본값인 시대로 바꿨다. NVIDIA의 텐서코어(Volta 이후)는 이 논문이 요구하는 "FP16 곱 + FP32 누산" 연산을 하드웨어로 구현해, 이후 모든 대규모 학습이 별도 코드 변경 없이 속도·메모리 이득을 챙기게 됐다. PyTorch AMP(`torch.cuda.amp`), TensorFlow의 mixed precision API가 이 레시피를 그대로 자동화했고, 이후 `bfloat16` 같은 대안 포맷도 이 세 장치의 변형으로 이해된다.',

legacy:[
 '**텐서코어 프로그래밍 모델의 근거** — Volta 이후 GPU의 FP16×FP16→FP32 누산 텐서코어가 이 논문의 요구사항을 하드웨어로 구현',
 '**프레임워크 자동화** — PyTorch AMP, TensorFlow mixed precision, NVIDIA Apex가 마스터 가중치·손실 스케일링을 자동 처리하는 한 줄 옵션으로 흡수',
 '**BF16으로의 분기** — 지수 범위가 FP32와 같은 BF16이 등장하면서 손실 스케일링 없이도 학습 가능한 경로가 열렸지만, 마스터 가중치·FP32 누산의 기본 골격은 유지',
 '**대규모 LLM 학습의 전제** — [ZeRO](#/p/zero) 등 분산학습 시스템이 다루는 "옵티마이저 상태" 자체가 이 논문이 도입한 FP32 마스터 가중치 + 모멘텀을 가리킨다'
],

pitfalls:[
 '**"FP16으로 다 저장하면 끝"이 아니다.** 곱셈의 누산을 FP16으로 하면(FP32 누산 없이) 오차가 누적되어 큰 모델에서 정확도가 무너진다. 저장은 FP16, 누산은 FP32라는 구분이 핵심이다.',
 '**손실 스케일링은 만능 상수가 아니다.** 스케일이 너무 크면 오히려 그레디언트가 overflow해 NaN이 뜬다. 논문은 8~32K 범위에서 네트워크마다 다른 값을 실험적으로 골랐고, 이후 프레임워크들은 이를 동적으로 조절하는 방식(dynamic loss scaling)으로 발전시켰다.',
 '**옵티마이저 상태(모멘텀 등)의 정밀도는 이 논문의 범위 밖이다.** 여기서 다룬 것은 가중치·활성값·그레디언트이며, Adam의 1차·2차 모멘트를 어떤 정밀도로 둘지는 이후 연구([ZeRO](#/p/zero) 등)의 몫이다.'
],

figures:[
 {f:'fig1-flow.png',
  cap:'한 층의 학습 스텝. FWD와 두 BWD 상자를 오가는 화살표(F16 라벨)가 forward/backward 전체가 FP16임을 보여준다. 맨 아래 Weight Update만 F32(검정 화살표)로 표시돼 있는데, 이것이 "가중치 갱신만 FP32 마스터에서" 일어난다는 이 논문의 핵심 구조다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig3-histogram.png',
  cap:'x축이 그레디언트 크기를 $\\log_2$ 로 표시. 빨간 선 왼쪽(맨 왼쪽 막대 포함)이 FP16에서 0이 되는 영역이다. 초록 막대의 상당 부분이 빨간 선 왼쪽에 몰려 있는 것이 "그냥 FP16으로 저장하면 그레디언트 대부분이 사라진다"는 문제를 그대로 보여준다 — 이 그림이 손실 스케일링이 필요한 이유다.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'We introduce methodology for training deep neural networks using half-precision floating point numbers, without losing model accuracy or having to modify hyper-parameters.',
  src:'Abstract, p.1'},
 {t:'This particular network diverges when gradients are not scaled, but scaling them by a factor of 8 ... is sufficient to match the accuracy achieved with FP32 training.',
  src:'Section 3.2, p.3-4'}
],

links:[
 {t:'arXiv 1710.03740 — Mixed Precision Training', u:'https://arxiv.org/abs/1710.03740'},
 {t:'PyTorch Automatic Mixed Precision 문서', u:'https://pytorch.org/docs/stable/amp.html'}
]
});
