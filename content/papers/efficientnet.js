WIKI.paper({
slug:'efficientnet',
venue:'ICML 2019',
authors:'Mingxing Tan, Quoc V. Le (Google Brain)',
arxiv:'1905.11946',

tldr:'모델을 키울 때 깊이·너비·입력 해상도를 따로 늘리지 말고 **하나의 계수 φ로 동시에** 늘리라는 규칙(compound scaling)을 제안한다. 잘 설계된 작은 baseline에 이 규칙만 적용해 ImageNet 84.3% top-1을 기존 최고 모델보다 **8.4배 적은 파라미터**로 달성했다.',

context:'[ResNet](#/p/resnet) 이후 정확도를 올리는 방법은 세 가지가 알려져 있었다 — 층을 더 쌓거나(깊이), 채널을 넓히거나(너비), 입력 이미지를 키우거나(해상도). 문제는 이 셋을 **각각 따로, 손으로** 조정해왔다는 점이다. ResNet-18→200은 깊이만, WideResNet은 너비만, GPipe는 주로 해상도와 크기를 함께 밀어붙였다. 그런데 축 하나만 계속 키우면 금방 수확 체감이 온다 — 층만 깊게 하면 gradient 문제와 별개로 정확도가 포화하고, 넓게만 하면 고수준 특징을 못 잡는다. 저자들의 관찰은 단순하다: **해상도를 키우면 더 넓은 수용 영역을 위해 층이 더 필요하고, 픽셀이 늘면 더 세밀한 패턴을 담을 채널도 더 필요하다.** 세 축은 독립이 아니라 서로를 요구한다.',

ideas:[
 {h:'Compound scaling — 세 축을 하나의 지수로 묶는다',
  lead:'깊이·너비·해상도를 각각 α·β·γ의 φ제곱으로 묶어 φ 하나로 함께 조절한다.',
  d:'깊이 $d = \\alpha^\\phi$, 너비 $w = \\beta^\\phi$, 해상도 $r = \\gamma^\\phi$ 로 두고, 사용자는 **φ 하나만** 정한다. φ는 "쓸 수 있는 자원이 몇 배인가"를 뜻하고, α·β·γ는 세 축의 상대 배분 비율이다. 축 사이의 균형을 매번 다시 찾는 대신, 작은 모델에서 한 번 찾아 그대로 확장한다.'},
 {h:'제약 $\\alpha \\cdot \\beta^2 \\cdot \\gamma^2 \\approx 2$ 의 의미',
  lead:'$\\alpha\\beta^2\\gamma^2 \\approx 2$ 로 묶어 φ를 1 올릴 때마다 FLOPs가 약 2배가 되게 한다.',
  d:'conv 연산량은 깊이에 **선형**, 너비와 해상도에는 **제곱**으로 비례한다. 그래서 $\\alpha\\beta^2\\gamma^2$ 를 2로 묶어두면 φ를 1 올릴 때마다 전체 FLOPs가 정확히 약 $2^\\phi$ 배가 된다. 자원 예산을 φ로 직접 읽을 수 있게 만든 설계다. B0에서의 작은 그리드 탐색 결과가 $\\alpha=1.2,\\ \\beta=1.1,\\ \\gamma=1.15$ 이다.'},
 {h:'스케일링은 baseline의 질을 증폭할 뿐이다',
  lead:'B0 자체를 정확도와 FLOPs를 함께 보상으로 쓰는 NAS로 먼저 찾는다.',
  d:'저자들은 같은 compound scaling을 [MobileNet](#/p/mobilenet)과 [ResNet](#/p/resnet)에도 적용해 단일 축 스케일링보다 나음을 보이지만, 84.3%가 나온 이유는 **좋은 출발점**에도 있다. 그래서 B0 자체를 NAS로 탐색하되, 목적함수에 정확도뿐 아니라 FLOPs를 넣어 $ACC(m) \\times [FLOPS(m)/T]^w$ ($w = -0.07$)를 최대화했다. 지연시간이 아니라 FLOPs를 쓴 것은 특정 기기에 종속되지 않기 위해서다.'},
 {h:'B0의 뼈대는 MBConv — MobileNetV2 블록 + SE',
  lead:'B0의 기본 단위는 SE를 붙인 MobileNetV2의 inverted residual 블록이다.',
  d:'탐색 결과 나온 B0는 [MobileNet](#/p/mobilenet)V2의 inverted residual 블록(1×1 확장 → depthwise → 1×1 축소)에 squeeze-and-excitation 채널 어텐션을 붙인 구조를 반복한다. 즉 모바일용으로 개발된 효율 블록이 **서버급 SOTA 모델의 기본 단위**가 되었다.'},
 {h:'해상도를 키우면 정규화도 같이 키워야 한다',
  lead:'해상도를 키우는 만큼 dropout·stochastic depth 강도도 함께 올려야 한다.',
  d:'B0에서 B7로 갈수록 입력 해상도가 224에서 600으로 커지는데, 논문은 이에 맞춰 dropout 비율을 0.2에서 0.5로, stochastic depth 등 증강 강도도 함께 올린다. 스케일링은 구조만의 문제가 아니라 **학습 레시피와 짝을 이뤄야 한다**는 점이 명시된다.'}
],

diagram:{type:'split', cap:'φ 하나를 정하면 세 축의 배율이 동시에 결정된다. baseline은 B0(5.3M·0.39B FLOPs·224px), 자원 2배당 φ+1.',
 from:{t:'Baseline B0', s:'5.3M · 224px'},
 branches:[
  {t:'깊이 스케일링', s:'d=α^φ (α=1.2)'},
  {t:'너비 스케일링', s:'w=β^φ (β=1.1)'},
  {t:'해상도 스케일링', s:'r=γ^φ (γ=1.15)'}
 ],
 join:'제약 α·β²·γ² ≈ 2  →  FLOPs는 약 2^φ 배'},

math:[
 {expr:'d = α^φ,  w = β^φ,  r = γ^φ    s.t.  α · β² · γ² ≈ 2,  α,β,γ ≥ 1',
  tex:'\\begin{aligned} d &= \\alpha^\\phi, \\quad w = \\beta^\\phi, \\quad r = \\gamma^\\phi \\\\ \\text{s.t.}\\ & \\alpha \\cdot \\beta^2 \\cdot \\gamma^2 \\approx 2, \\quad \\alpha,\\beta,\\gamma \\ge 1 \\end{aligned}',
  d:'논문의 핵심 식. 너비와 해상도에 지수 2가 붙는 이유는 conv FLOPs가 채널 수의 제곱, 특징맵 넓이(=해상도²)에 각각 비례하기 때문이다. 이 제약 덕분에 φ가 곧 자원 배수의 로그가 된다.'},
 {expr:'max_{d,w,r}  Accuracy( N(d, w, r) )   s.t.  FLOPS(N) ≤ 목표,  Memory(N) ≤ 목표',
  tex:'\\max_{d,w,r}\\ \\text{Accuracy}(N(d,w,r)) \\quad \\text{s.t.}\\ \\text{FLOPS}(N) \\le T,\\ \\text{Memory}(N) \\le M',
  d:'스케일링을 손기술이 아니라 **제약 최적화 문제**로 정식화한 것이 이 논문의 프레이밍이다. 위의 지수식은 이 문제의 탐색 공간을 φ 하나로 축소한 근사해다.'},
 {expr:'ACC(m) × [ FLOPS(m) / T ]^w,   w = -0.07',
  tex:'\\text{ACC}(m) \\times \\left[\\frac{\\text{FLOPS}(m)}{T}\\right]^{w}, \\quad w = -0.07',
  d:'B0를 찾은 NAS의 보상 함수. FLOPs가 목표 $T$ 를 넘으면 지수 $w<0$ 때문에 보상이 깎인다. 정확도만 보던 기존 NAS와 달리 **효율을 목적함수에 직접 넣었다**.'}
],

figures:[
 {f:'fig1-scaling-curve.png',
  cap:'x축이 파라미터 수, y축이 ImageNet top-1 정확도. 빨간 실선(EfficientNet)이 다른 계열보다 왼쪽 위에 있다는 것은 같은 정확도를 훨씬 적은 파라미터로 낸다는 뜻. 점 하나가 B0~B7 중 하나.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-compound-scaling.png',
  cap:'왼쪽 (a)가 baseline. (b)~(d)는 너비·깊이·해상도 중 하나만 키운 기존 방식, (e)가 이 논문의 compound scaling — 세 축을 동시에 정해진 비율로 키운다. 도형 크기가 각 축의 배율을 나타낸다.',
  src:'원문 Figure 2, p.2'}
],

numbers:[
 {k:'EfficientNet-B0', v:'77.1% top-1', d:'5.3M 파라미터 · 0.39B FLOPs — [ResNet](#/p/resnet)-50(76.0%, 4.1B)보다 정확하고 연산 10배 적음'},
 {k:'EfficientNet-B1', v:'79.1% top-1', d:'7.8M 파라미터 · 0.70B FLOPs — ResNet-152급 정확도를 훨씬 적은 비용으로'},
 {k:'EfficientNet-B7', v:'84.3% top-1', d:'66M 파라미터 — 당시 최고 ConvNet 대비 **8.4배 작고 추론 6.1배 빠름**'},
 {k:'compound 계수', v:'α=1.2, β=1.1, γ=1.15', d:'B0에서 소규모 그리드 탐색으로 한 번만 구한 값'},
 {k:'입력 해상도 범위', v:'224 → 600', d:'B0에서 B7까지. 해상도도 스케일링 대상이라는 점이 핵심'},
 {k:'전이학습', v:'CIFAR-100 91.7% · Flowers 98.8%', d:'8개 전이 데이터셋 중 5개에서 SOTA, 파라미터는 평균적으로 크게 적음'}
],

quotes:[
 {t:'In this paper, we want to study and rethink the process of scaling up ConvNets. In particular, we investigate the central question: is there a principled method to scale up ConvNets that can achieve better accuracy and efficiency?',
  src:'Introduction, p.1'}
],

impact:'EfficientNet은 "모델을 키운다"는 행위에 **정량적 규칙**을 부여했다. 이전까지 스케일링은 논문마다 다른 임의의 선택이었지만, 이후로는 하나의 baseline과 계수 세트로 B0~B7 같은 **모델 패밀리**를 발표하는 것이 표준 형식이 되었다. 정확도–FLOPs 파레토 곡선을 통째로 제시하는 그래프 형식도 여기서 정착했다. 동시에 [MobileNet](#/p/mobilenet) 계열의 MBConv 블록이 모바일 전용이 아니라 범용 고성능 백본의 재료임이 확인되면서, 효율 연구와 SOTA 경쟁의 경계가 사라졌다. 이 "규모를 계수로 다룬다"는 사고방식은 언어 모델의 [스케일링 법칙](#/p/scaling-laws)과 문제의식이 정확히 겹친다.',

legacy:[
 '**모델 패밀리 관행** — 단일 모델 대신 정확도–연산량 곡선 위의 B0~B7 같은 계열을 함께 공개하는 것이 논문의 기본 형식이 됨',
 '**EfficientNetV2 (2021)** — 얕은 층에는 depthwise 대신 일반 conv를 쓰는 Fused-MBConv와 점진적 해상도 학습으로 학습 속도 문제를 보완',
 '**NAS의 목적함수 전환** — 정확도 단독에서 정확도×효율 결합 보상으로 옮겨가며 하드웨어 인지 탐색이 주류가 됨',
 '**규모 자체의 법칙화** — [ViT](#/p/vit)·[스케일링 법칙](#/p/scaling-laws)으로 이어지는 "성능은 구조가 아니라 자원의 함수"라는 관점의 비전 측 전조'
],

pitfalls:[
 '**FLOPs 파레토와 실제 속도 파레토는 다르다.** B7은 FLOPs 기준으로는 압도적이지만, depthwise conv와 큰 해상도 탓에 GPU 활용률이 낮아 **동일 정확도의 [ResNet](#/p/resnet)류보다 학습이 느린 경우가 많다**. 후속 EfficientNetV2가 정면으로 인정하고 고친 부분이다.',
 '**해상도만 올리고 파인튜닝하면 손해 본다.** 학습 해상도와 다른 해상도로 추론하면 객체의 겉보기 크기 분포가 어긋나 정확도가 떨어진다. B 시리즈는 각 단계마다 해상도가 고정되어 있으므로 임의로 바꿔 쓰면 안 된다.',
 '**α, β, γ는 보편 상수가 아니다.** B0 구조와 ImageNet이라는 조건에서 탐색된 값이다. 다른 도메인이나 다른 baseline에 그대로 가져다 쓰면 균형이 최적이라는 보장은 없다.'
],

links:[
 {t:'arXiv 1905.11946 — EfficientNet: Rethinking Model Scaling for CNNs', u:'https://arxiv.org/abs/1905.11946'},
 {t:'arXiv 2104.00298 — EfficientNetV2: Smaller Models and Faster Training', u:'https://arxiv.org/abs/2104.00298'},
 {t:'공식 구현 (google/automl · efficientnet)', u:'https://github.com/google/automl/tree/master/efficientnetv2'}
]
});
