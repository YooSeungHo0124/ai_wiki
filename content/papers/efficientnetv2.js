WIKI.paper({
slug:'efficientnetv2',
venue:'ICML 2021',
authors:'Tan, Le (Google Research, Brain Team)',
arxiv:'2104.00298',

tldr:'[EfficientNet](#/p/efficientnet)이 최적화한 지표는 FLOPs·파라미터였지 **학습 속도**가 아니었다는 것을 지적하고, 학습 병목을 직접 찾아 Fused-MBConv와 **점진적 학습(이미지 크기와 정규화를 함께 키움)** 으로 최대 11배 빠른 학습을 달성한 후속작.',

context:'[EfficientNet](#/p/efficientnet)은 정확도 대비 FLOPs·파라미터 수를 최소화하도록 NAS와 compound scaling으로 설계됐다. 하지만 저자들이 직접 재점검해 보니, FLOPs가 적다고 **학습이 빠른 것은 아니었다** — 큰 입력 해상도는 GPU/TPU 메모리를 많이 써서 배치 크기를 줄일 수밖에 없고, depthwise convolution은 파라미터·FLOPs는 적지만 최신 가속기(GPU/TPU)의 연산 유닛을 충분히 활용하지 못해 이론상 가벼운 연산이 실제로는 느리게 돈다. 게다가 모든 스테이지를 동일한 비율로 키우는 compound scaling도 스테이지별 기여도가 다르다는 점에서 최적이 아니었다.',

ideas:[
 {h:'세 가지 학습 병목을 실측으로 짚는다',
  lead:'큰 이미지 크기, 초반 층의 depthwise conv, 균등 스케일링이 EfficientNet 학습을 느리게 만든다.',
  d:'(1) 큰 입력 해상도는 메모리를 많이 써 배치를 줄이게 되고 학습 속도가 급격히 떨어진다 — 학습 시 입력 크기를 추론보다 작게 쓰는 FixRes 기법만으로도 최대 **2.2배** 빨라졌다. (2) depthwise conv는 초반 스테이지에서 가속기의 연산 밀도를 살리지 못해 느리다. (3) 모든 스테이지를 같은 비율로 키우는 compound scaling은 스테이지마다 학습 속도·파라미터 효율 기여가 다르다는 사실을 무시한다.'},
 {h:'Fused-MBConv: depthwise+1×1을 일반 3×3 conv 하나로',
  lead:'[MobileNetV2](#/p/mobilenetv2)식 MBConv의 depthwise conv3x3+conv1x1을 일반 conv3x3 하나로 합친다.',
  d:'MBConv는 conv1x1(확장) → depthwise conv3x3 → SE → conv1x1(압축) 순서다. Fused-MBConv는 앞의 conv1x1+depthwise conv3x3을 **일반 conv3x3 하나**로 대체한다. 파라미터·FLOPs는 늘지만 가속기의 연산 유닛을 훨씬 잘 활용해 실측 처리량이 오른다. 다만 전 스테이지에 다 적용하면(stage1-7) 오히려 파라미터·FLOPs가 과도하게 늘고 학습도 느려진다 — 초반 스테이지(1~3)에만 적용했을 때 TPU 처리량이 262에서 362 imgs/sec/core로 오르면서 정확도도 오히려 82.8%에서 83.1%로 개선됐다. 어디에 Fused-MBConv를 쓰고 어디에 기존 MBConv를 쓸지는 학습 속도까지 고려한 NAS로 자동 탐색한다.'},
 {h:'점진적 학습: 이미지 크기와 정규화 강도를 함께 키운다',
  lead:'작은 이미지·약한 정규화로 시작해 점점 큰 이미지·강한 정규화로 전환한다.',
  d:'기존 progressive resizing 기법들은 이미지 크기만 단계적으로 키우고 정규화 강도는 고정했는데, 이는 작은 이미지 단계에서 과도한 정규화로 학습 용량을 낭비하거나 큰 이미지 단계에서 과적합을 막지 못하는 문제를 낳는다. 이 논문은 **이미지 크기가 커질수록 dropout·[RandAugment](#/p/randaugment)·[mixup](#/p/mixup) 강도도 같이 키우는** 스케줄을 제안한다. 작은 네트워크 용량(작은 이미지)에는 약한 정규화, 큰 용량(큰 이미지)에는 강한 정규화가 맞다는 직관을 정규화 스케줄에 반영한 것이 핵심이며, 이 조정 덕분에 학습 속도를 올리면서도 기존 progressive resizing과 달리 정확도가 떨어지지 않았다.'}
],

diagram:{type:'compare', cap:'MBConv와 Fused-MBConv의 구조 차이 — 확장 단계의 depthwise+1×1을 일반 conv 하나로 합친다.',
 left:{t:'MBConv', items:['conv1x1 확장 → depthwise 3x3','SE → conv1x1(압축)','파라미터·FLOPs는 적음']},
 right:{t:'Fused-MBConv', items:['conv3x3 하나로 확장','SE → conv1x1(압축)','가속기 활용도가 높아 실측이 빠름']}},

math:[
 {expr:'training_speed(image_size) ↑  ⇒  regularization_strength ↑  (dropout, RandAugment, Mixup 강도를 이미지 크기와 함께 스케줄링)',
  tex:'\\text{stage } i:\\ (\\text{size}_i,\\ \\epsilon_i)\\ \\text{with}\\ \\text{size}_i \\uparrow \\Rightarrow \\epsilon_i \\uparrow \\quad (\\epsilon:\\ \\text{dropout, RandAug, mixup 강도})',
  d:'학습을 여러 스테이지로 나눠 각 스테이지의 이미지 크기 $\\text{size}_i$가 커질수록 정규화 강도 $\\epsilon_i$도 선형적으로 키운다. 식이라기보다 스케줄링 원칙이며, 저자들은 이를 알고리즘 1로 구체화한다.'}
],

numbers:[
 {k:'ImageNet Top-1 (EfficientNetV2-M)', v:'85.1%대', d:'EfficientNet-B7과 비슷한 정확도를 **6.8배 적은 파라미터**로 달성(그림 1b 기준 EfficientNetV2 24M vs EfficientNet 43M급 비교)'},
 {k:'학습 속도', v:'최대 11배 빠름', d:'ImageNet·CIFAR·Cars·Flowers에서 이전 모델 대비, **32개 TPUv3 코어** 기준 측정(TPU days)'},
 {k:'ImageNet21k 사전학습 후 Top-1', v:'87.3%', d:'ViT-L/16(21k) 대비 정확도 +2.0%p, 같은 컴퓨팅 자원으로 학습 시간은 5~11배 단축'},
 {k:'ImageNet21k 학습 시간', v:'약 2일', d:'ImageNet-1k보다 약 10배 큰 데이터셋을, **32 TPUv3 코어**라는 중간 규모 자원으로 완료'},
 {k:'FixRes 효과(EfficientNet-B6)', v:'학습 이미지를 512→380으로 줄이면 최대 2.2배 처리량', d:'**TPUv3 imgs/sec/core** 및 **V100 imgs/sec/gpu** 둘 다에서 실측(Table 2)'},
 {k:'Fused-MBConv 부분 적용 효과', v:'TPU 262→362 imgs/sec/core, 정확도 82.8%→83.1%', d:'stage 1-3에만 적용했을 때(EfficientNet-B4 기준), 전 스테이지 적용(stage1-7)은 오히려 254 imgs/sec로 저하'}
],

impact:'경량 CNN 연구의 축이 "추론 시 FLOPs·정확도"에서 "**학습 시간**·정확도"로 넓어졌다. 대규모 사전학습이 표준이 된 시대에 학습 비용 자체가 실무 제약이 된다는 것을 명확히 보였고, Fused-MBConv는 이후 여러 효율적 백본·검출기 설계에서 초반 스테이지의 기본 선택지가 됐다. 점진적 학습(이미지 크기·정규화 동시 스케줄링)도 대규모 비전 모델 학습 레시피의 표준 기법으로 자리잡았다.',

legacy:[
 '**Fused-MBConv의 확산** — 이후 다수의 효율적 검출·분류 백본이 초반 고해상도 스테이지에 Fused-MBConv를 기본 채택',
 '**학습 효율을 명시 목표로 삼는 후속 연구 증가** — 정확도·FLOPs뿐 아니라 TPU/GPU 학습 시간을 벤치마크에 나란히 보고하는 관행 강화',
 '**점진적 해상도·정규화 스케줄** — 대규모 이미지·비디오 모델 학습에서 해상도를 단계적으로 늘리는 커리큘럼 방식이 널리 재사용됨',
 '**"FLOPs 최적화"와 "실제 학습/추론 속도 최적화"의 구분이 굳어짐** — [ShuffleNet](#/p/shufflenet)·[RepVGG](#/p/repvgg)의 문제의식이 학습 단계까지 확장됨'
],

pitfalls:[
 '**Fused-MBConv를 전 스테이지에 쓰면 오히려 손해다.** 논문 Table 3이 직접 보여주듯 stage1-7 전체 적용은 파라미터·FLOPs가 급증하고 학습도 느려진다 — 어디까지 적용할지는 탐색의 대상이지 규칙이 아니다.',
 '**"학습이 빠르다"는 결과가 곧 "추론도 빠르다"를 의미하지 않는다.** 이 논문의 핵심 지표는 TPU/GPU 학습 처리량이며, 모바일 추론 지연은 별도로 검증된 것이 아니다.',
 '**점진적 학습의 이득은 정규화를 함께 조정했을 때만 나온다.** 기존 progressive resizing처럼 이미지 크기만 키우고 정규화를 고정하면 오히려 정확도가 떨어진다는 것이 논문이 반복해 강조하는 지점이다.'
],

figures:[
 {f:'fig1-training-efficiency.png',
  cap:'가로축이 32 TPU 코어 기준 학습 시간(TPU days), 세로축이 ImageNet Top-1. EfficientNetV2(빨강·자홍·초록 점선)가 EfficientNet(검정 점선)보다 왼쪽 위에 있다 — 같은 정확도에 더 적은 학습 시간, 또는 같은 학습 시간에 더 높은 정확도.',
  src:'원문 Figure 1(a), p.1'},
 {f:'fig2-mbconv-fused.png',
  cap:'왼쪽 MBConv는 conv1x1로 채널을 4배 확장한 뒤 depthwise conv3x3을 쓴다. 오른쪽 Fused-MBConv는 그 두 단계를 conv3x3 하나로 합친다 — SE와 마지막 conv1x1(압축)은 동일하게 유지.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'We demonstrate up to 11x faster training speed and up to 6.8x better parameter efficiency on ImageNet, CIFAR, Cars, and Flowers dataset, than prior art.',
  src:'Section 1, p.1'}
],

links:[
 {t:'arXiv 2104.00298 — EfficientNetV2', u:'https://arxiv.org/abs/2104.00298'},
 {t:'공식 코드 (google/automl)', u:'https://github.com/google/automl/tree/master/efficientnetv2'}
]
});
