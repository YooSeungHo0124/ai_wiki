WIKI.paper({
slug:'deeplab',
venue:'TPAMI 2018 (v1: ICLR 2015)',
authors:'Chen, Papandreou, Kokkinos, Murphy, Yuille (Google · UCLA)',
arxiv:'1606.00915',

tldr:'분류용 CNN을 분할에 쓰면 pooling 때문에 해상도가 1/32로 주저앉는다는 문제를, **atrous(dilated) convolution — 커널 사이에 구멍을 뚫어 파라미터를 늘리지 않고 receptive field만 키우는 방식**으로 풀었다. 여기에 여러 배율을 병렬로 보는 ASPP와 CRF 후처리를 얹어 시맨틱 분할의 표준 레시피를 만들었다.',

context:'[FCN](#/p/fcn)이 분류 네트워크를 완전 합성곱으로 바꿔 분할을 푸는 길을 열었지만, 근본 문제가 남았다. 분류망은 **의도적으로 해상도를 버리도록 설계돼 있다** — [VGG](#/p/vgg)나 [ResNet](#/p/resnet)을 통과하면 feature map이 입력의 1/32이 되고, 이 상태에서 픽셀 라벨을 복원하면 경계가 뭉개진다. FCN은 이를 skip connection과 학습된 deconvolution으로 메웠지만 여전히 흐릿했다. 딜레마는 명확하다 — **stride를 줄이면 해상도는 살지만 receptive field가 좁아져 큰 객체의 문맥을 못 보고, stride를 유지하면 문맥은 보지만 위치가 부정확하다.** 게다가 분류망은 작은 이동에 불변하도록 학습됐는데, 분할은 정확히 그 반대의 성질을 요구한다.',

ideas:[
 {h:'Atrous convolution: 해상도와 시야를 동시에 얻는다',
  lead:'커널 원소 사이에 구멍을 두어 파라미터 증가 없이 수용 영역만 넓힌다.',
  d:'커널 원소 사이에 rate $r-1$ 만큼 구멍을 두고 샘플링한다. $3 \\times 3$ 커널을 $r=2$ 로 쓰면 파라미터는 9개 그대로인데 시야는 $5 \\times 5$ 가 된다. 마지막 두 pooling의 stride를 1로 되돌리고 그 뒤 층들의 rate를 2·4로 키우면, **receptive field는 원래 망과 동일하게 유지한 채 출력 해상도만 4배로 올릴 수 있다.** 사전학습된 가중치를 그대로 재사용할 수 있다는 것이 이 트릭의 핵심 실용성이다.'},
 {h:'ASPP: 배율을 하나 고르지 않고 병렬로 본다',
  lead:'서로 다른 rate의 atrous conv를 병렬로 걸어 한 번의 forward로 다중 배율을 본다.',
  d:'객체 크기가 제각각이니 적절한 rate도 제각각이다. Atrous Spatial Pyramid Pooling은 같은 feature map에 서로 다른 rate(예: 6·12·18·24)의 atrous conv를 **병렬로** 걸고 결과를 합친다. 이미지를 여러 배율로 리사이즈해 여러 번 forward하는 기존 multi-scale 방식과 달리 **한 번의 forward로 끝난다**. 공간 피라미드 풀링의 다중 배율 아이디어를 dilation으로 옮겨온 셈이다.'},
 {h:'Fully-connected CRF로 경계를 되찾는다',
  lead:'색과 위치가 비슷한 픽셀을 같은 라벨로 묶어 경계를 원본 엣지에 맞춘다.',
  d:'CNN 출력은 여전히 부드럽고 경계가 뭉툭하다. 모든 픽셀 쌍을 잇는 dense CRF를 후처리로 걸어, "색과 위치가 비슷한 픽셀은 같은 라벨"이라는 사전지식으로 경계를 원본 이미지의 엣지에 스냅시킨다. 10회 mean-field 반복으로 CPU에서 약 0.5초 걸린다. VGG 백본에서는 mIoU를 **3~5%p** 끌어올렸지만, ResNet-101 + ASPP 구성에서는 이득이 1.3%p 수준으로 줄어든다. 이 단계는 **학습과 분리된 별도 모듈**이며, 후속 버전에서 사라진다는 점이 오히려 중요하다.'},
 {h:'"불변성"이 분할에서는 결함이다',
  lead:'잃은 해상도를 복원하는 대신 애초에 잃지 않는 방향으로 설계를 바꾼다.',
  d:'이 논문의 진단이 그 뒤 설계 전체를 규정했다 — 분류 사전학습이 심어준 이동 불변성과 공간 다운샘플링은 분할에 그대로 해가 된다. 그래서 해법도 "잃은 해상도를 복원한다"(deconv/upsample)가 아니라 **"애초에 잃지 않는다"**(atrous)가 됐다. 이후 분할 백본 설계에서 output stride(8 또는 16)를 하이퍼파라미터로 명시하는 관행이 여기서 나왔다.'}
],

figures:[
 {f:'fig1-pipeline.png',
  cap:'전체 파이프라인을 4단계로. Atrous Convolution을 쓴 DCNN이 원본보다 8배 작은 "Aeroplane Coarse Score map"(빨강=높은 확률)을 낸다 → Bi-linear Interpolation으로 원본 크기까지 단순히 늘리면 경계가 뭉개진 채 크기만 커진다 → Fully Connected CRF가 이 뭉갠 경계를 색·위치 정보로 다시 날카롭게 다듬어 Final Output의 깔끔한 실루엣을 만든다. 핵심은 "거친 예측 후 CRF로 경계만 복원"하는 2단계 구조다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig4-aspp.png',
  cap:'가운데 주황 점 하나(분류하려는 픽셀)를 놓고 4개의 병렬 conv 브랜치가 서로 다른 rate(6·12·18·24)로 훑는다. 같은 3×3 커널이라도 rate가 커질수록 점선 사각형(field-of-view)이 넓어지는 것을 보라 — 커널 크기나 파라미터는 그대로인데 "보는 범위"만 커진다. 맨 아래 겹친 사각형들은 이 네 스케일이 같은 중심점을 동시에 바라본다는 것을 보여준다. 필터 하나로는 못 잡는 다양한 물체 크기를 병렬 rate로 동시에 커버하는 것이 ASPP다.',
  src:'원문 Figure 4, p.5'}
],

quotes:[
 {t:'Atrous convolution allows us to explicitly control the resolution at which feature responses are computed within Deep Convolutional Neural Networks.',
  src:'Abstract, p.1'}
],

diagram:{type:'compare', cap:'해상도를 잃고 복원하느냐, 애초에 잃지 않느냐 — 분할 백본 설계의 갈림길.',
 left:{t:'기존: FCN 방식', items:[
  'pooling/stride로 1/32까지 축소',
  'deconv·bilinear로 해상도 복원',
  '복원 과정에서 세부가 이미 소실',
  '배율 대응은 이미지를 여러 번 forward']},
 right:{t:'DeepLab: atrous', items:[
  '뒤쪽 stride를 1로, rate를 2·4로',
  'output stride 8 유지 (4배 조밀)',
  '파라미터·연산 증가 없이 시야 유지',
  'ASPP로 한 번의 forward에 다배율']}},

math:[
 {expr:'y[i] = Σ_k x[i + r·k] · w[k]',
  tex:'y[i] = \\sum_k x[i + r\\cdot k]\\, w[k]',
  d:'1차원 atrous convolution. $r=1$ 이면 보통의 합성곱이고, $r$ 을 키우면 입력을 $r$ 칸씩 건너뛰며 읽는다. 가중치 $w$ 의 개수는 그대로다 — 즉 **연산량과 파라미터는 고정, 시야만 확장**된다.'},
 {expr:'유효 커널 크기 = k + (k-1)(r-1)',
  tex:'\\text{유효 커널 크기} = k + (k-1)(r-1)',
  d:'$k=3$, $r=6$ 이면 유효 커널은 $13 \\times 13$. ASPP는 이 값을 여러 개 동시에 확보하는 장치다.'}
],

numbers:[
 {k:'PASCAL VOC 2012 test mIoU', v:'79.7%', d:'ResNet-101 + MSC + COCO + ASPP + CRF. v1(VGG)은 71.6%'},
 {k:'Cityscapes test mIoU', v:'70.4%', d:'ResNet-101 + CRF, train set만 사용'},
 {k:'PASCAL-Context mIoU', v:'45.7%', d:'59개 클래스 + 배경. CRF 없이는 44.7%'},
 {k:'특징맵 밀도', v:'4배', d:'atrous로 밀도를 4배 올린 뒤 bilinear로 8배 확대 — 실효 stride 8'},
 {k:'ASPP-L rate', v:'6 · 12 · 18 · 24', d:'VGG-16 fc6 변형 기준. ASPP-S는 2·4·8·12'},
 {k:'속도', v:'8 FPS (Titan X)', d:'CRF의 mean-field 추론은 CPU에서 별도로 약 0.5초'}
],

impact:'atrous convolution이 **분할·탐지 백본의 기본 부품**이 됐다. "해상도를 잃었다가 복원한다"는 인코더–디코더 관점 옆에, "처음부터 잃지 않는다"는 선택지가 대등하게 자리잡았고, 실무에서는 output stride 8/16을 정확도–속도 다이얼처럼 돌리게 됐다. ASPP는 다중 배율 문맥을 한 번의 forward로 집약하는 표준 모듈이 되어 분할 밖으로도 퍼졌다. 반대로 CRF는 이 논문 계열이 스스로 폐기한 부분이다 — v3에서 백본과 ASPP가 충분히 강해지자 CRF 후처리가 주는 이득이 사라졌고, **"후처리로 메우던 것을 결국 네트워크가 흡수한다"**는 딥러닝의 반복되는 패턴을 잘 보여주는 사례가 됐다.',

legacy:[
 '**DeepLab v3 / v3+** — CRF를 걷어내고 ASPP에 이미지 수준 global pooling을 더한 뒤, 가벼운 디코더를 붙여 경계를 살리는 방향으로 정리됐다',
 '**dilation의 일반화** — 분할을 넘어 탐지 백본, 음성·시계열의 확장 합성곱(WaveNet 계열)까지 같은 트릭이 이식됐다',
 '**[Mask R-CNN](#/p/mask-rcnn)과의 분업** — 인스턴스는 RoI 기반, 시맨틱은 dilation 기반이라는 두 축이 정립되고, 이후 panoptic 연구가 둘을 합치려 시도했다',
 '**트랜스포머로의 세대교체** — 다중 배율 문맥을 dilation으로 쌓던 자리는 [ViT](#/p/vit)·[Swin](#/p/swin) 기반 분할 헤드의 전역 attention이 대체해갔다'
],

pitfalls:[
 '**dilation을 크게 쌓으면 gridding artifact가 생긴다.** rate가 큰 층을 연달아 두면 서로 인접한 출력 픽셀이 완전히 겹치지 않는 입력 집합을 보게 되어 격자무늬 결함이 나타난다. rate를 서로소로 배치하는 등의 완화책이 필요하다.',
 '**output stride를 8로 낮추면 메모리와 연산이 급증한다.** 해상도가 2배면 activation은 4배다. 학습 시에는 stride 16으로 두고 평가만 8로 하는 식의 타협이 흔하다.',
 '**CRF를 지금도 붙일 필요는 없다.** v2 시절의 수치를 재현하려다 dense CRF를 붙이는 경우가 있는데, 최신 백본에서는 이득이 거의 없고 추론 시간만 크게 늘어난다. 이 논문 계열 스스로 v3에서 제거했다.'
],

links:[
 {t:'arXiv 1606.00915 — DeepLab (v2, TPAMI)', u:'https://arxiv.org/abs/1606.00915'},
 {t:'arXiv 1706.05587 — Rethinking Atrous Convolution (v3)', u:'https://arxiv.org/abs/1706.05587'},
 {t:'arXiv 1802.02611 — DeepLabv3+ (encoder-decoder)', u:'https://arxiv.org/abs/1802.02611'}
]
});
