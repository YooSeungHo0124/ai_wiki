WIKI.paper({
slug:'dssd',
venue:'arXiv 2017 (CVPR workshop 계열)',
authors:'Fu, Liu, Ranga, Tyagi, Berg (UNC Chapel Hill · Amazon)',
arxiv:'1701.06659',

tldr:'`[SSD](#/p/ssd)`의 백본을 `ResNet-101`로 바꾸고, 끝에 **디컨볼루션(역합성곱) 층을 얹어 얕은 층에 깊은 층의 의미 정보를 되먹인다.** 작은 객체 탐지 정확도를 크게 올렸지만, 그 대가로 속도를 상당히 내줬다.',

context:'`[SSD](#/p/ssd)`는 한 번의 forward pass로 여러 층의 feature map에서 곧바로 박스를 예측하는 속도-정확도 균형의 대표작이었다. 문제는 **얕은 층일수록 해상도는 높지만 의미 정보가 부족하다**는 것이었다 — 작은 물체를 잡을 만큼 세밀한 feature map은 아직 깊은 문맥을 담지 못한 상태다. 같은 시기 비슷한 문제의식으로 `[FPN](#/p/fpn)`이 top-down 경로로 여러 스케일의 feature를 재조합하는 해법을 냈다. DSSD는 다른 손잡이를 당긴다 — 깊은 백본(ResNet-101)과 함께 SSD 뒤쪽에 **디컨볼루션 모듈**을 덧붙여 인코더-디코더(hourglass) 구조를 만들고, 깊은 층의 의미 정보를 얕은 해상도로 전달한다.',

ideas:[
 {h:'백본을 VGG에서 ResNet-101로 교체',
  lead:'더 깊고 강한 분류기로 SSD를 다시 얹지만, 그냥 바꾸면 오히려 성능이 떨어진다.',
  d:'원래 `[SSD](#/p/ssd)`는 VGG16 기반이었다. ResNet-101로 단순히 교체하면 321×321 입력에서 VOC2007 mAP가 오히려 77.5%(VGG)에서 76.4%로 **떨어진다**. 저자들은 더 깊은 분류기를 꽂는 것만으로는 부족하고, 예측 모듈 자체를 다시 설계해야 한다는 것을 발견했다.'},
 {h:'예측 모듈: 곧장 예측하지 않고 residual block을 하나 더 끼운다',
  lead:'feature map에서 바로 예측하지 않고 잔차 블록을 거친 뒤 예측한다.',
  d:'원 SSD는 선택된 feature map에 바로 3×3 conv로 분류·박스 회귀를 건다. DSSD는 그 앞에 1×1 conv 두 겹(256→1024채널)을 쌓은 residual 블록을 넣고 원본과 element-wise sum한 뒤 예측한다. 이 한 층이 ResNet-101 백본에서의 학습을 안정시켜 정확도를 크게 끌어올렸다.'},
 {h:'디컨볼루션 모듈: 깊은 의미를 얕은 해상도로 되먹인다',
  lead:'Deconv(2×)로 해상도를 올린 깊은 feature와 얕은 feature를 element-wise product로 합친다.',
  d:'가장 깊은 feature map에서 시작해, 학습되는 deconvolution(bilinear가 아님)으로 해상도를 2배씩 올리며 SSD 쪽 얕은 feature map과 결합해 나간다. 각 경로는 conv+BN을 거친 뒤 element-wise product로 합치고 ReLU를 통과한다 — 실험적으로 product가 sum보다 정확도가 좋았다. 이렇게 만들어진 비대칭 hourglass가 "DSSD" 이름의 유래다.'},
 {h:'디코더는 대칭이 아니라 얕다 — 속도와 사전학습 문제',
  lead:'인코더-디코더를 대칭으로 만들지 않고 디코더를 극도로 얕게 유지한다.',
  d:'Hourglass 계열은 보통 encoder·decoder가 대칭이지만, DSSD는 두 가지 이유로 decoder를 얕게 둔다. 첫째, 탐지는 다운스트림 응용을 위한 실시간성이 중요한 과제라 속도를 크게 희생할 수 없다. 둘째, ImageNet 분류로 사전학습된 decoder 가중치가 존재하지 않으므로, decoder 층은 전부 무작위 초기화에서 학습해야 한다 — 층을 늘릴수록 이 부담이 커진다.'}
],

diagram:{type:'compare', cap:'SSD 예측 경로 vs DSSD가 덧붙인 디컨볼루션 경로.',
 left:{t:'SSD: 순방향 한 번', items:['얕은~깊은 feature map에서 직접 예측','고해상도 층은 의미 정보 부족','빠름 (300×300, 46 FPS)']},
 right:{t:'DSSD: 디컨볼루션으로 회귀', items:['ResNet-101 + 예측모듈로 정확도 개선','deconv로 깊은 의미를 얕은 해상도에 주입','작은 물체 mAP 개선, 속도는 크게 하락']}},

math:[
 {expr:'DSSD 결합 = ReLU( BN(Deconv(F_deep)) ⊙ BN(Conv(F_shallow)) )',
  tex:'F_{out} = \\text{ReLU}\\!\\big(\\text{BN}(\\text{Deconv}(F_{deep})) \\odot \\text{BN}(\\text{Conv}(F_{shallow}))\\big)',
  d:'디컨볼루션 모듈의 핵심 연산. 깊은 층 feature를 학습된 deconv로 2배 확대한 뒤, 얕은 층 feature와 **원소별 곱(element-wise product)** 으로 결합한다. 곱셈이 합보다 정확도가 높았다는 것이 실험 결과다.'}
],

numbers:[
 {k:'VOC2007 test mAP', v:'81.5%', d:'DSSD513, `ResNet-101` 백본 — R-FCN 대비 우위'},
 {k:'VOC2012 test mAP', v:'80.0%', d:'추가 데이터·앙상블 없이 도달한 유일한 80% 모델이라고 저자가 강조'},
 {k:'COCO test-dev mAP', v:'33.2%', d:'R-FCN(29.9%) 대비 **+3.3**, 특히 중대형 객체에서 개선 폭이 큼'},
 {k:'속도 · DSSD513', v:'5.5~6.6 FPS (Titan X)', d:'같은 조건 SSD513(80.6% mAP)의 6.8~8.7 FPS보다 느림'},
 {k:'속도 · SSD300 VGG', v:'46 FPS', d:'참고: 저해상도·경량 백본 SSD는 훨씬 빠름 — DSSD와 직접 비교 시 해상도·백본 차이를 감안해야 함'},
 {k:'ResNet-101 단순 교체 효과', v:'77.5%→76.4%', d:'예측 모듈 없이 백본만 바꾸면 VOC2007에서 오히려 성능 하락'}
],

impact:'DSSD는 "SSD류 단일 스테이지 탐지기도 문맥·의미 정보를 되먹이면 작은 물체를 잡을 수 있다"는 것을 보였고, 인코더-디코더 구조를 탐지에 적용하는 흐름의 초기 사례가 됐다. 다만 얻은 정확도만큼 속도를 내줬다는 점에서, 같은 시기 **가로 연결(lateral connection)로 더 가볍게 다중 스케일을 합치는** `[FPN](#/p/fpn)`과 자주 대비된다. FPN 계열이 이후 탐지기의 표준 넥(neck)으로 자리잡으면서, DSSD의 무거운 디컨볼루션 모듈 방식은 주류가 되지 못했다.',

legacy:[
 '**멀티스케일 문맥 결합의 두 갈래** — 이 논문의 무거운 top-down 디컨볼루션과, 더 가벼운 `[FPN](#/p/fpn)`의 lateral connection이 이후 탐지기 넥 설계의 두 원형이 됨',
 '**"백본만 깊게 하면 끝"이 아니라는 반례** — ResNet-101 단순 교체가 VGG보다 낮은 mAP를 낸 사례로, 예측 헤드·문맥 결합 설계가 백본 교체 자체보다 중요할 수 있음을 보임',
 '**element-wise product 결합**이 이후 여러 feature fusion 설계에서 sum과 함께 비교 대상으로 자주 등장',
 '**속도-정확도 트레이드오프 논의의 참조점** — "단일 스테이지 = 항상 빠르다"는 통념에 대한 반례로 자주 인용됨'
],

pitfalls:[
 '**단일 스테이지라고 항상 빠른 것은 아니다.** DSSD513은 2단계 탐지기인 `R-FCN`과 비슷하거나 더 느린 FPS를 보인다 — "SSD 계열=실시간"이라는 통념을 그대로 적용하면 안 된다.',
 '**ResNet-101 백본 교체만으로는 성능이 오르지 않는다.** 예측 모듈(residual block)을 함께 바꿔야 ResNet의 깊이가 실제 이득으로 이어진다.',
 '**같은 시기의 `[FPN](#/p/fpn)`과 목적은 같지만 방법은 다르다.** 둘 다 "얕은 층에 깊은 의미를 준다"는 문제를 풀지만 DSSD는 무거운 디컨볼루션 모듈을, FPN은 가벼운 1×1 lateral connection을 쓴다 — 혼동해서 같은 기법으로 서술하면 안 된다.'
],

figures:[
 {f:'fig1-dssd-arch.png',
  cap:'conv3_x부터 conv5_x까지가 ResNet-101 백본(흰색). 오른쪽 파란 상자가 원래 SSD가 덧붙인 예측 층, 빨간 상자들이 DSSD가 새로 얹은 디컨볼루션 층 사슬 — 원 기호가 디컨볼루션 모듈, 화살표가 conv3_x 등 얕은 층에서 오는 skip 연결이다.',
  src:'원문 Figure 1(하단), p.2'},
 {f:'fig3-deconv-module.png',
  cap:'위 경로: 더 깊은 층의 feature(HxWx512)를 Deconv 2×2로 확대 → Conv 3×3 → BN. 아래 경로: SSD 쪽 얕은 feature(2Hx2WxD)를 Conv-BN-ReLU-Conv-BN으로 정제. 두 경로를 Eltw Product로 합친 뒤 ReLU를 거쳐 다음 디컨볼루션 모듈로 넘긴다.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'While these two contributions are easily described at a high-level, a naive implementation does not succeed.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1701.06659 — DSSD: Deconvolutional Single Shot Detector', u:'https://arxiv.org/abs/1701.06659'}
]
});
