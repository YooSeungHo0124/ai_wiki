WIKI.paper({
slug:'googlenet',
venue:'CVPR 2015',
authors:'Szegedy et al. (Google)',
arxiv:'1409.4842',

tldr:'층을 단순히 쌓는 대신 **여러 크기의 필터를 한 층 안에서 병렬로 돌리고(Inception), 1×1 합성곱으로 채널을 먼저 줄여 연산을 억제**한 논문. 22층으로 ILSVRC-2014 분류 1위(top-5 6.67%)를 [AlexNet](#/p/alexnet)의 **1/12 파라미터**로 달성했다.',

context:'[AlexNet](#/p/alexnet) 이후의 지배적 처방은 "더 깊고 더 넓게"였다. 하지만 이 방향에는 두 개의 비용이 붙는다. 파라미터가 늘면 라벨 데이터가 부족한 상태에서 과적합하고, 연산량은 **채널 수의 제곱에 비례해** 폭증한다 — 두 conv 층을 나란히 키우면 비용은 4배가 된다. 저자들의 실무 제약은 명확했다: 모바일·임베디드를 포함한 실서비스에 올리려면 추론 연산이 15억 multiply-add 수준에 머물러야 한다. 이론적 실마리는 Arora 등의 연구였다 — 데이터의 확률분포가 큰 희소 신경망으로 표현된다면, 상관이 높은 유닛들을 묶어 층 단위로 최적 구조를 근사할 수 있다. 문제는 오늘날의 하드웨어가 **희소 연산을 못 한다**는 것이다. GPU는 조밀한 행렬곱에 최적화돼 있어 희소 행렬은 이론 FLOPs가 적어도 실제로는 더 느리다. Inception은 이 간극을 노린 타협이다 — **희소한 구조를 조밀한 부품들의 조합으로 흉내 낸다.**',

ideas:[
 {h:'Inception 모듈 — 필터 크기를 고르지 말고 전부 쓴다',
  lead:'여러 커널 크기의 conv를 한 층에서 병렬로 돌려 채널 방향으로 이어붙인다.',
  d:'같은 입력에 1×1, 3×3, 5×5 합성곱과 3×3 max pooling을 **병렬로** 적용하고 결과를 채널 방향으로 이어붙인다. 객체가 이미지에서 차지하는 크기가 제각각이므로 층마다 최적 커널 크기가 다른데, 그것을 설계자가 고르는 대신 **네트워크가 가중치로 선택하게** 두는 것이다. 하나의 층이 여러 스케일의 정보를 동시에 담게 된다.'},
 {h:'1×1 병목 — 이 논문의 실질적 핵심',
  lead:'3×3·5×5 앞에 1×1 conv를 끼워 채널을 먼저 줄인 뒤 비싼 연산을 수행한다.',
  d:'순진하게 병렬 분기를 붙이면 채널이 층마다 누적되고 5×5 분기의 비용이 감당 불가로 커진다. 그래서 3×3·5×5 앞에, 그리고 pooling 뒤에 **1×1 합성곱을 넣어 채널 수를 먼저 줄인다**. 1×1은 공간적으로는 아무것도 하지 않고 채널 방향 선형결합 + ReLU만 수행하므로, 값싼 차원 축소기이자 추가 비선형이다. 이 병목 패턴이 없으면 Inception은 성립하지 않으며, 같은 아이디어가 곧바로 [ResNet](#/p/resnet)의 bottleneck 블록으로 넘어간다.'},
 {h:'FC 층을 global average pooling으로 대체',
  lead:'마지막 feature map을 채널별 공간 평균 하나로 접어 분류기에 바로 넣는다.',
  d:'[VGG](#/p/vgg) 파라미터 138M의 대부분은 마지막 완전연결층에 있다. GoogLeNet은 마지막 feature map을 채널별 공간 평균 하나로 접어(7×7×1024 → 1024) 분류기에 넣는다. 파라미터가 사실상 사라지고 top-1이 오히려 약 0.6%p 개선됐다. 총 파라미터가 500만 개로 떨어진 주된 이유다.'},
 {h:'보조 분류기 — 중간층에도 오류를 직접 주입',
  lead:'중간 두 지점에 작은 분류기를 달아 손실을 0.3 가중치로 더해 역전파를 돕는다.',
  d:'22층 깊이에서 출력의 gradient가 앞쪽 층까지 온전히 도달하지 못한다는 우려로, 중간 두 지점에 작은 분류기를 달아 손실에 0.3 가중치로 더했다. 학습 중에만 쓰고 추론 시에는 떼어낸다. **깊이 자체가 학습을 방해한다**는 문제를 우회로 푼 것인데, 이듬해 [ResNet](#/p/resnet)이 같은 문제를 구조로 정면 해결하면서 이 장치는 후속 Inception 버전에서 효과가 미미하다고 재평가된다.'}
],

figures:[
 {f:'fig2-inception-module.png',
  cap:'왼쪽(a)이 순진한 버전 — 1×1/3×3/5×5/pool 네 분기를 그대로 이어붙인다. 오른쪽(b)이 실제 채택안 — 3×3·5×5 앞과 pool 뒤에 노란 1×1 conv(차원 축소)가 끼어든다. 이 노란 상자 하나가 논문의 실질적 기여다.',
  src:'원문 Figure 2, p.5'}
],

quotes:[
 {t:'We propose a deep convolutional neural network architecture codenamed Inception, which was responsible for setting the new state of the art for classification and detection in the ImageNet Large-Scale Visual Recognition Challenge 2014 (ILSVRC14).',
  src:'Abstract, p.1'}
],

diagram:{type:'split', cap:'Inception 모듈(차원 축소 버전). 1×1 병목이 각 분기 앞에 붙어 채널을 먼저 줄인다.',
 from:{t:'이전 층 출력', s:'H×W×C'},
 branches:[
  {t:'1×1 conv'},
  {t:'3×3 conv', s:'1×1 축소 후'},
  {t:'5×5 conv', s:'1×1 축소 후'},
  {t:'맥스풀+1×1'}
 ],
 join:'채널 방향 concat — 여러 수용영역 크기를 한 층에 공존시킨다'},

math:[
 {expr:'비용(3×3) = H·W·C_in·C_out·9   →   H·W·C_in·C_mid + H·W·C_mid·C_out·9',
  tex:'\\begin{aligned} \\text{cost}_{3\\times3} &= H \\cdot W \\cdot C_{in} \\cdot C_{out} \\cdot 9 \\\\ \\text{cost}_{bottleneck} &= H \\cdot W \\cdot C_{in} \\cdot C_{mid} + H \\cdot W \\cdot C_{mid} \\cdot C_{out} \\cdot 9 \\end{aligned}',
  d:'1×1 병목의 효과. $C_{mid} \\ll C_{in}$ 이면 9배 비싼 3×3이 훨씬 좁은 채널 위에서만 수행되므로 전체 연산이 크게 줄어든다. 이 분해가 이후 [ResNet](#/p/resnet) bottleneck과 [MobileNet](#/p/mobilenet)의 분리 합성곱으로 이어지는 계열의 출발점이다.'},
 {expr:'L_total = L_final + 0.3 · L_aux1 + 0.3 · L_aux2',
  tex:'L_{total} = L_{final} + 0.3 \\times L_{aux1} + 0.3 \\times L_{aux2}',
  d:'보조 분류기를 포함한 학습 손실. 추론 시에는 $L_{final}$ 경로만 남긴다.'}
],

numbers:[
 {k:'ILSVRC-2014 분류 top-5', v:'6.67%', d:'**1위**. 7개 모델 앙상블 + 144 크롭. [VGG](#/p/vgg)는 7.3%(제출)/6.8%(대회 후)로 2위'},
 {k:'깊이', v:'22층 (파라미터 있는 층 기준)', d:'풀링까지 세면 27층. Inception 모듈 9개가 쌓여 있다'},
 {k:'파라미터', v:'약 500만', d:'[AlexNet](#/p/alexnet) 60M 대비 **약 1/12**, [VGG-16](#/p/vgg) 138M 대비 약 1/28'},
 {k:'추론 연산 예산', v:'약 15억 multiply-add', d:'실서비스 배포를 전제로 처음부터 설정한 상한'},
 {k:'ILSVRC-2014 검출 mAP', v:'43.9%', d:'검출 부문도 1위. 2013년 우승 성적의 약 2배'},
 {k:'GAP 효과', v:'top-1 약 +0.6%p', d:'완전연결층을 global average pooling으로 대체했을 때'}
],

impact:'GoogLeNet은 **정확도 경쟁에 "연산 예산"이라는 축을 추가했다.** 같은 대회에서 [VGG](#/p/vgg)가 "단순한 구조를 깊게"로 거의 같은 점수를 냈기 때문에, 두 논문의 대비는 이후 백본 설계의 두 노선을 그대로 정의한다 — 균일하고 재현하기 쉬운 구조 대 손으로 조율된 효율 구조. 부품 단위로 보면 이 논문이 남긴 것이 더 크다. **1×1 병목**은 [ResNet](#/p/resnet)의 bottleneck, [MobileNet](#/p/mobilenet)의 pointwise conv를 거쳐 오늘날까지 표준 부품이고, **global average pooling**은 그날 이후 거의 모든 분류 백본의 마지막 층이 됐다. 후속 Inception-v2에서 도입된 [Batch Normalization](#/p/batchnorm)은 아예 별도의 논문 계보를 열었다.',

legacy:[
 '**Inception 계열의 전개** — v2에서 [BatchNorm](#/p/batchnorm) 도입, v3에서 5×5를 3×3 두 개로·n×n을 1×n+n×1로 분해, v4에서 residual 연결 결합(Inception-ResNet)',
 '**1×1 병목의 보편화** — [ResNet](#/p/resnet) bottleneck, [MobileNet](#/p/mobilenet) depthwise-separable, [EfficientNet](#/p/efficientnet)까지 이어지는 효율 백본 계열의 기본 부품',
 '**global average pooling** — 거대한 FC 분류 헤드를 사실상 퇴출시켰고, CAM 계열 시각화의 전제 조건이 됨',
 '**보조 분류기의 퇴장** — 같은 문제(깊이에 따른 학습 곤란)를 [ResNet](#/p/resnet)이 skip connection으로 풀면서 우회 장치는 사라졌다'
],

pitfalls:[
 '**Inception은 재현·수정이 어렵다.** 분기별 채널 수가 층마다 손으로 조율된 값이라, 다른 데이터셋이나 다른 입력 해상도로 옮길 때 무엇을 어떻게 바꿔야 하는지 지침이 없다. [VGG](#/p/vgg)/[ResNet](#/p/resnet)의 균일한 구조가 실무에서 더 널리 쓰인 실질적 이유다.',
 '**"파라미터가 적다 = 빠르다"가 아니다.** 500만 파라미터지만 분기가 많아 메모리 접근과 커널 실행이 잘게 쪼개지고, 실측 지연시간은 파라미터 비율만큼 유리하지 않다. 파라미터 수·FLOPs·실측 속도는 서로 다른 지표다.',
 '**보조 분류기를 gradient vanishing 해결책으로 인용하는 것은 과한 해석이다.** 논문 자신이 효과에 대해 조심스러웠고, 후속 Inception 논문은 정규화에 가까운 역할이며 이득이 작다고 재평가했다.'
],

links:[
 {t:'arXiv 1409.4842 — Going Deeper with Convolutions', u:'https://arxiv.org/abs/1409.4842'},
 {t:'Rethinking the Inception Architecture (Inception-v3)', u:'https://arxiv.org/abs/1512.00567'}
]
});
