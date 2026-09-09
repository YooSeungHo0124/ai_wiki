WIKI.paper({
slug:'mobilenet',
venue:'arXiv 2017 (Google, 학회 미발표)',
authors:'Howard, Zhu, Chen, Kalenichenko et al. (Google)',
arxiv:'1704.04861',

tldr:'표준 합성곱을 **채널별 3×3(depthwise) + 채널 섞기 1×1(pointwise)** 두 단계로 분해해 연산량을 8~9배 줄인다. 여기에 폭(α)과 해상도(ρ) 두 개의 하이퍼파라미터를 얹어, 하나의 구조에서 지연시간 예산에 맞는 모델을 즉석에서 뽑아 쓰게 만들었다.',

context:'2017년까지의 CNN 경쟁은 사실상 ImageNet 정확도 단일 지표였다. [VGG](#/p/vgg)는 138M 파라미터에 15.3 GFLOPs를 썼고 [ResNet](#/p/resnet)은 152층까지 갔다. 그런데 이 모델들이 실제로 돌아야 할 곳은 데이터센터만이 아니었다 — 휴대폰의 카메라 앱, 자율주행 보드, 임베디드 센서에서는 **밀리초 단위 지연시간과 수십 MB의 메모리**가 진짜 제약이다. 당시의 대응은 대개 학습이 끝난 큰 모델을 사후에 압축(pruning·quantization·[distillation](#/p/distillation))하는 방식이었다. 이 논문은 반대로 접근한다 — 처음부터 작게 설계하되, **어디를 줄여야 정확도를 덜 잃는가**를 연산 구조 수준에서 따진다.',

ideas:[
 {h:'Depthwise separable convolution — 필터링과 결합을 분리한다',
  lead:'3×3 conv를 채널별 공간 필터링(depthwise)과 1×1 채널 결합(pointwise)으로 쪼갠다.',
  d:'표준 3×3 conv 하나는 두 가지 일을 동시에 한다: **공간적으로 이웃을 모으는 일**과 **입력 채널들을 섞어 새 채널을 만드는 일**이다. MobileNet은 이를 쪼갠다. 먼저 depthwise conv가 각 입력 채널에 3×3 필터 **하나씩**을 따로 적용해 채널 간 섞음 없이 공간 필터링만 하고, 이어 1×1 pointwise conv가 채널을 선형결합해 새 채널을 만든다. 표현력은 조금 줄지만 비용은 거의 한 자릿수만큼 떨어진다.'},
 {h:'비용 절감은 $1/N + 1/D_K^2$ 라는 정확한 값이다',
  lead:'절감 비율은 $1/N+1/D_K^2$ 로 정확히 계산되며 커널 크기가 좌우한다.',
  d:'추상적인 "가볍다"가 아니라 계산으로 확정되는 비율이다. 출력 채널 $N$ 이 보통 수백이므로 $1/N$ 은 무시할 수 있고, 절감량은 사실상 커널 크기가 결정한다. 3×3이면 $1/9$ 에 가까워 **8~9배** 싸진다. 대신 정확도는 ImageNet에서 71.7% → 70.6%로 1.1%p만 손해 본다.'},
 {h:'Width multiplier α — 모델 전체를 균일하게 가늘게',
  lead:'모든 층 채널 수에 α를 곱해 연산량을 $\\alpha^2$ 비율로 줄인다.',
  d:'모든 층의 채널 수에 $\\alpha \\in \\{1, 0.75, 0.5, 0.25\\}$ 를 곱한다. 입력·출력 채널이 동시에 줄어들므로 비용은 $\\alpha^2$ 에 비례해 떨어진다. 층을 빼는 것(depth 축소)보다 **얇게 만드는 쪽이 같은 연산량에서 더 정확하다**는 것이 논문의 실험 결과다.'},
 {h:'Resolution multiplier ρ — 입력 해상도 자체를 예산 손잡이로',
  lead:'입력 해상도에 ρ를 곱해 파라미터는 그대로 두고 연산량만 줄인다.',
  d:'입력을 224 대신 192·160·128로 넣는다. 가중치는 그대로이므로 파라미터는 변하지 않고 연산량만 $\\rho^2$ 로 줄어든다. α와 ρ를 조합하면 하나의 구조에서 정확도–지연시간 곡선 위의 임의의 점을 골라잡을 수 있다 — 이 "두 개의 손잡이" 발상이 뒤에 [EfficientNet](#/p/efficientnet)의 compound scaling으로 확장된다.'},
 {h:'연산의 95%가 1×1 conv에 몰린다는 구현상의 이점',
  lead:'전체 연산의 95%가 1×1 conv에 몰려 GEMM으로 곧장 빠르게 처리된다.',
  d:'MobileNet 전체 Mult-Add의 **94.9%**, 파라미터의 74.6%가 1×1 conv다. 1×1 conv는 im2col 같은 메모리 재배열 없이 곧바로 GEMM(행렬곱)으로 처리되므로, 이론 FLOPs 절감이 실제 속도로 잘 이어진다. 반대로 depthwise conv는 산술 강도가 낮아 하드웨어 지원이 없으면 기대만큼 안 빨라진다.'}
],

figures:[
 {f:'fig3-block-comparison.png',
  cap:'왼쪽이 기존 방식(3×3 conv 한 번으로 필터링+채널결합을 동시에), 오른쪽이 MobileNet 블록 — 3×3 depthwise 뒤에 1×1 conv가 따로 붙어 두 일을 분리한다. 두 경로 모두 conv마다 BN→ReLU가 따라오지만, 오른쪽은 층이 하나 더 많다.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'MobileNet spends 95% of it\'s computation time in 1×1 convolutions which also has 75% of the parameters.',
  src:'Section 4, p.4'}
],

diagram:{type:'flow', cap:'표준 3×3 conv 한 층을 두 층으로 쪼갠다. 이 블록 13개가 MobileNet 본체를 이룬다.',
 nodes:[
  {t:'입력 특징맵', s:'D_F × D_F × M'},
  {t:'Depthwise Conv', s:'3×3, 채널별 독립', acc:true},
  {t:'BN + ReLU', s:''},
  {t:'Pointwise Conv', s:'1×1, M→N 결합'},
  {t:'BN + ReLU', s:''},
  {t:'출력', s:'D_F × D_F × N'}
 ]},

math:[
 {expr:'표준 conv 비용 = D_K · D_K · M · N · D_F · D_F',
  tex:'D_K \\cdot D_K \\cdot M \\cdot N \\cdot D_F \\cdot D_F',
  d:'커널 $D_K$, 입력 채널 $M$, 출력 채널 $N$, 출력 해상도 $D_F$. $M \\times N$ 이 곱해지는 것이 비용의 핵심이다 — 모든 입력 채널과 모든 출력 채널의 조합마다 $D_K^2$ 개의 가중치를 쓴다.'},
 {expr:'depthwise separable 비용 = D_K·D_K·M·D_F·D_F  +  M·N·D_F·D_F',
  tex:'D_K \\cdot D_K \\cdot M \\cdot D_F \\cdot D_F + M \\cdot N \\cdot D_F \\cdot D_F',
  d:'앞항이 depthwise(채널마다 필터 1개, $N$ 이 사라짐), 뒷항이 pointwise($D_K$ 가 1이 됨). 곱셈이던 $D_K^2$ 와 $N$ 이 **덧셈으로 분리**된 것이 절감의 원리다.'},
 {expr:'비용비 = (D_K·D_K·M + M·N) / (D_K·D_K·M·N) = 1/N + 1/D_K²',
  tex:'\\frac{D_K \\cdot D_K \\cdot M + M \\cdot N}{D_K \\cdot D_K \\cdot M \\cdot N} = \\frac{1}{N} + \\frac{1}{D_K^2}',
  d:'$N=512$, $D_K=3$ 이면 $1/512 + 1/9 \\approx 0.113$ — 약 **8.9배 절감**. 폭 α와 해상도 ρ를 적용하면 여기에 $\\alpha^2 \\rho^2$ 가 추가로 곱해진다.'}
],

numbers:[
 {k:'MobileNet (α=1, 224)', v:'70.6% top-1', d:'569M Mult-Add · 4.2M 파라미터'},
 {k:'같은 구조를 표준 conv로', v:'71.7% top-1', d:'4866M Mult-Add · 29.3M 파라미터 — **정확도 1.1%p 위해 연산 8.5배**'},
 {k:'vs [VGG](#/p/vgg)-16', v:'71.5% top-1', d:'15300M Mult-Add · 138M 파라미터 — 거의 같은 정확도에 파라미터 33배'},
 {k:'vs GoogLeNet', v:'69.8% top-1', d:'1550M Mult-Add — MobileNet이 더 정확하면서 연산은 2.7배 적음'},
 {k:'0.5 MobileNet-160', v:'60.2% top-1', d:'76M Mult-Add · 1.32M 파라미터 — α·ρ로 뽑아낸 극단 구성'},
 {k:'1×1 conv 비중', v:'연산 94.9% · 파라미터 74.6%', d:'최적화 대상이 어디인지 명확히 지목'}
],

impact:'MobileNet 이후 논문의 성능표에는 정확도 옆에 **연산량과 파라미터 수가 나란히** 실리는 것이 규범이 되었다. depthwise separable conv 자체는 Xception 등에서 먼저 쓰였지만, 이를 축으로 **완결된 모델 계열과 예산 조절 손잡이(α, ρ)** 를 함께 제시한 것이 이 논문의 기여다. 실무적으로는 안드로이드 온디바이스 비전의 기본 백본이 되었고, [SSD](#/p/ssd)와 결합한 MobileNet-SSD는 오랫동안 엣지 객체 검출의 사실상 표준이었다. 아키텍처 설계를 "정확도 최대화"가 아니라 **주어진 지연시간 예산 하의 최적화 문제**로 재정의한 것이 가장 큰 변화다.',

legacy:[
 '**MobileNetV2 (2018)** — inverted residual + linear bottleneck으로 개선되고, 이 MBConv 블록이 [EfficientNet](#/p/efficientnet)의 기본 구성 요소가 됨',
 '**NAS와의 결합** — MnasNet·MobileNetV3처럼 실제 기기 지연시간을 보상으로 넣은 아키텍처 탐색의 검색 공간이 이 블록 위에서 정의됨',
 '**엣지 배포 파이프라인** — 양자화(int8) · TFLite · NPU 커널이 depthwise/pointwise 조합을 1급 시민으로 지원하게 됨',
 '**스케일링 손잡이의 일반화** — 폭·해상도 두 축을 따로 돌리던 방식이 [EfficientNet](#/p/efficientnet)에서 깊이까지 포함한 복합 스케일링으로 통합'
],

pitfalls:[
 '**FLOPs가 적다 ≠ 빠르다.** depthwise conv는 가중치 대비 메모리 접근량이 많은 memory-bound 연산이라, 이론 Mult-Add가 8배 줄어도 실제 지연시간은 2~3배 개선에 그치는 하드웨어가 많다. 배포 대상에서 반드시 실측해야 한다.',
 '**α를 줄이는 것과 층을 빼는 것은 다르다.** 논문 실험은 같은 연산 예산이면 **얇고 깊은 쪽**이 낫다고 보고한다(0.75 MobileNet > 층을 5개 제거한 얕은 MobileNet). 경량화한다고 무작정 블록을 삭제하면 손해다.',
 '**depthwise 층에는 weight decay를 거의 걸지 않는다.** 파라미터가 워낙 적어 과적합보다 **과소적합**이 문제이며, 논문도 정규화와 데이터 증강을 큰 모델보다 약하게 쓴다고 명시한다. 큰 모델의 학습 레시피를 그대로 가져오면 정확도가 떨어진다.'
],

links:[
 {t:'arXiv 1704.04861 — MobileNets: Efficient CNNs for Mobile Vision Applications', u:'https://arxiv.org/abs/1704.04861'},
 {t:'arXiv 1801.04381 — MobileNetV2: Inverted Residuals and Linear Bottlenecks', u:'https://arxiv.org/abs/1801.04381'},
 {t:'arXiv 1610.02357 — Xception (depthwise separable conv의 선행 연구)', u:'https://arxiv.org/abs/1610.02357'}
]
});
