WIKI.paper({
slug:'deeplabv3plus',
venue:'ECCV 2018',
authors:'Chen et al. (Google)',
arxiv:'1802.02611',

tldr:'[DeepLab](#/p/deeplab) 계열의 atrous(팽창) 합성곱 기반 인코더에 **간단한 디코더 하나**를 붙여 물체 경계를 되살리고, ASPP와 디코더 전체에 **depthwise separable 합성곱**을 적용해 속도까지 챙긴 논문.',

context:'atrous 합성곱으로 특징 맵의 해상도를 유지하는 [DeepLab](#/p/deeplab)/DeepLabv3 계열(spatial pyramid pooling 방식)은 문맥 정보는 풍부하지만, output stride를 8까지 낮추려면 [ResNet](#/p/resnet)-101 기준 26개 잔차 블록(78개 층)을 팽창시켜야 해서 계산량이 급격히 커진다. 반대로 [U-Net](#/p/unet) 류의 encoder-decoder 구조는 다운샘플·업샘플을 그대로 쓰기 때문에 계산은 가볍지만, 최종 특징 맵을 그대로 16배 bilinear 업샘플만 하는 "순진한 디코더"로는 물체 경계가 뭉개진다. 이 논문은 두 계열 중 하나를 고르는 대신 **DeepLabv3를 인코더로 그대로 쓰고, 가벼운 디코더를 덧붙이는** 절충을 택한다.',

ideas:[
 {h:'DeepLabv3 전체를 인코더로 재활용한다',
  lead:'ASPP를 포함한 DeepLabv3의 마지막 특징 맵(256채널)을 그대로 인코더 출력으로 쓴다.',
  d:'새 인코더를 설계하지 않고, 기존 DeepLabv3의 logit 직전 특징 맵을 가져온다. 이 특징 맵은 여러 atrous rate(6·12·18)의 3×3 conv와 1×1 conv, 이미지 전역 풀링(Image Pooling)을 병렬로 합친 ASPP를 거쳤기 때문에 이미 여러 스케일의 문맥을 담고 있다. output stride 16으로 뽑은 이 특징이 속도·정확도의 최적점이라는 것을 실험으로 확인했다.'},
 {h:'디코더: 저수준 특징과 한 번만 합친다',
  lead:'인코더 출력을 4배 업샘플한 뒤 백본 초반의 저수준 특징과 concat하고 3×3 conv로 다듬는다.',
  d:'인코더 출력을 bilinear로 4배 업샘플하고, 백본 초반(예: ResNet-101의 Conv2, striding 전)의 저수준 특징과 이어붙인다. 저수준 특징은 채널 수가 많아(256~512) 그대로 합치면 인코더의 의미 정보(256채널)를 압도하므로, **1×1 conv로 채널을 먼저 줄인 뒤** concat한다. 합친 특징에 3×3 conv를 몇 번 적용해 정제하고 다시 4배 업샘플해 원본 해상도로 되돌린다 — 단 한 단계의 skip만 쓰는 최소 설계다.'},
 {h:'ASPP와 디코더 전체를 depthwise separable 합성곱으로',
  lead:'표준 conv를 depthwise+pointwise로 쪼개 계산량을 33~41% 줄이면서 정확도는 유지한다.',
  d:'3×3 표준 합성곱을 채널별로 따로 필터링하는 depthwise conv와, 그 출력을 1×1 conv로 섞는 pointwise conv로 분해한다. 여기에 atrous rate를 depthwise 단계에 적용해 **atrous separable convolution**을 만든다. ASPP와 디코더의 3×3 conv를 모두 이 방식으로 바꾸면 Multiply-Adds가 33~41% 줄어드는데 mIOU는 거의 그대로다.'},
 {h:'Modified Aligned Xception 백본',
  lead:'max pooling을 stride가 있는 depthwise separable conv로 바꾼 Xception을 백본으로 쓴다.',
  d:'MSRA의 Aligned Xception을 기반으로 (1) entry flow는 유지해 속도를 지키고, (2) 모든 max pooling을 stride가 있는 depthwise separable conv로 바꿔 atrous 알고리즘을 적용할 수 있게 하고, (3) 각 3×3 depthwise conv 뒤에 BN+ReLU를 추가로 넣었다(MobileNet 설계와 유사). ResNet-101보다 이 백본을 쓸 때 mIOU가 더 오른다.'}
],

diagram:{type:'stack', cap:'인코더(DeepLabv3 = ASPP)가 만든 저해상도·고의미 특징을, 디코더가 저수준 특징과 한 번 합쳐 경계를 되살린다.',
 layers:[
  {t:'입력 이미지', s:'H×W×3'},
  {t:'DCNN 백본', s:'atrous conv, OS=16'},
  {t:'ASPP', s:'rate 6·12·18 + 풀링', acc:true, note:'다중 스케일 문맥'},
  {t:'저수준 특징 결합', s:'1×1 conv → concat', note:'백본 초반 conv2'},
  {t:'3×3 conv 정제', s:'경계 다듬기'},
  {t:'업샘플', s:'4× × 2번 → 원해상도'}
 ]},

math:[
 {expr:'atrous conv: y[i] = Σ_k x[i + r·k] w[k]',
  tex:'y[i] = \\sum_{k} x[i + r \\cdot k]\\,w[k]',
  d:'표준 합성곱(r=1)의 일반화. rate r이 필터가 입력을 샘플링하는 간격을 정해, 파라미터 수를 늘리지 않고도 시야(field-of-view)를 넓힌다.'},
 {expr:'output stride = 입력 해상도 / 최종 특징 맵 해상도',
  tex:'\\text{output stride} = \\dfrac{\\text{input resolution}}{\\text{final feature resolution}}',
  d:'분류에서는 보통 32. 분할에서는 마지막 1~2개 블록의 stride를 없애고 atrous rate로 보정해 16 또는 8까지 낮춘다 — 낮출수록 특징이 조밀해지지만 계산량이 커진다.'}
],

numbers:[
 {k:'PASCAL VOC 2012 test mIOU', v:'89.0%', d:'Xception 백본 + JFT-300M 사전학습, 후처리 없음'},
 {k:'PASCAL VOC 2012 (JFT 없이)', v:'87.8%', d:'ImageNet만으로 사전학습한 Xception 기준'},
 {k:'Cityscapes test 정확도', v:'82.1%', d:'후처리 없이 새 SOTA'},
 {k:'depthwise separable 적용 효과', v:'연산량 −33~41%', d:'ASPP+디코더에 적용, mIOU는 거의 유지'},
 {k:'ADE20K val mIOU (Xception-65)', v:'45.65%', d:'모델 계열이 다른 데이터셋에도 잘 옮겨감을 보이는 참고 수치'},
 {k:'디코더 사용 여부 효과', v:'OS=16 기준 mIOU 개선', d:'naive bilinear 업샘플 대비 디코더 추가 시 경계 부근 정확도가 뚜렷이 상승(trimap 실험)'}
],

impact:'"ASPP로 문맥을 넓게 볼 것인가, encoder-decoder로 경계를 살릴 것인가"라는 양자택일을 없애고, **인코더는 그대로 두고 얇은 디코더만 얹는다**는 절충이 이후 분할 아키텍처의 기본 패턴이 됐다. depthwise separable 합성곱을 ASPP·디코더 전체에 적용해 정확도 손실 없이 연산량을 크게 줄인 것도, 모바일·엣지에서 세그멘테이션을 돌리는 실무 파이프라인(MobileNet 계열 백본과의 조합 포함)의 표준 구성으로 자리잡았다.',

legacy:[
 '**[SegFormer](#/p/segformer)** 는 인코더를 Transformer로 완전히 바꾸지만, "저수준(고해상도) 특징과 고수준(저해상도) 특징을 합쳐 경계를 살린다"는 디코더 쪽 문제의식은 그대로 이어받는다',
 '**[MobileNet](#/p/mobilenet)·[EfficientNet](#/p/efficientnet) 백본 조합** — depthwise separable ASPP/디코더 설계는 경량 백본과 자연스럽게 맞물려 모바일 분할 파이프라인의 기본형이 됐다',
 '**단일 skip 설계의 한계 인식** — [U-Net](#/p/unet)처럼 여러 단계에서 skip을 두지 않고 한 번만 저수준 특징을 합치는 절충이, 이후 더 세밀한 경계가 필요한 과제에서는 multi-level skip으로 다시 확장되는 계기가 됐다',
 '**output stride라는 용어의 표준화** — 이후 분할 논문 대부분이 "OS=16/8"로 인코더 해상도-계산량 트레이드오프를 표기하는 관행을 남겼다'
],

pitfalls:[
 '**"encoder-decoder"라는 이름 때문에 [U-Net](#/p/unet)처럼 여러 단계의 skip 연결이 있다고 오해하기 쉽다.** 실제로는 저수준 특징을 **딱 한 곳**(백본 초반)에서만 가져와 합치는 최소 설계다.',
 '**89.0%는 JFT-300M 사전학습이 포함된 최고 수치다.** ImageNet만 쓴 87.8%와 섞어서 인용하면 다른 논문과 공정한 비교가 안 된다.',
 '**depthwise separable conv는 백본 전체가 아니라 ASPP와 디코더에만 적용된 실험이다.** Modified Aligned Xception 백본 자체의 depthwise 설계와는 별개로 구분해서 읽어야 한다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'위 Encoder 박스: atrous conv로 뽑은 특징을 rate 6·12·18의 3×3 conv, 1×1 conv, 전역 Image Pooling 다섯 갈래로 병렬 처리(ASPP)한 뒤 concat+1×1 conv. 아래 Decoder 박스: 그 출력을 4배 업샘플해 저수준 특징(1×1 conv로 채널을 줄인 것)과 Concat하고 3×3 conv로 다듬은 뒤 다시 4배 업샘플.',
  src:'원문 Figure 2, p.4'},
 {f:'fig1-designs.png',
  cap:'세 설계를 나란히 비교. (a) ASPP만 쓰는 spatial pyramid pooling은 마지막에 8배를 한 번에 업샘플(경계가 흐려짐). (b) 순수 encoder-decoder는 여러 단계에서 2배씩 나눠 업샘플. (c) 이 논문의 절충: ASPP로 문맥을 넓힌 뒤 디코더에서 4배씩 두 번만 업샘플.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'The proposed model, DeepLabv3+, extends DeepLabv3 by adding a simple yet effective decoder module to refine the segmentation results especially along object boundaries.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1802.02611 — Encoder-Decoder with Atrous Separable Convolution', u:'https://arxiv.org/abs/1802.02611'},
 {t:'공식 코드 (TensorFlow deeplab)', u:'https://github.com/tensorflow/models/tree/master/research/deeplab'}
]
});
