WIKI.paper({
slug:'faster-rcnn',
venue:'NeurIPS 2015 (확장판 TPAMI 2017)',
authors:'Ren, He, Girshick, Sun (Microsoft Research)',
arxiv:'1506.01497',

tldr:'탐지 파이프라인에서 마지막까지 남아 있던 비신경망 부품 — 영역 제안 — 을 **RPN(Region Proposal Network)** 으로 대체해, 제안부터 분류까지 전부를 하나의 네트워크로 통합한 논문. 제안 생성 비용이 이미지당 10ms로 떨어지면서 2-stage 탐지기가 처음으로 "거의 실시간"에 들어섰다.',

context:'[R-CNN](#/p/rcnn) 이후 SPPnet과 Fast R-CNN이 후보 영역마다 CNN을 다시 도는 낭비를 없앴다. 이미지 전체를 한 번만 컨볼루션한 뒤 특징 맵에서 RoI를 잘라내는(RoI Pooling) 방식으로, 탐지 자체는 이미지당 0.3초 수준까지 빨라졌다. 그러자 **병목이 다른 곳으로 옮겨갔다** — selective search가 CPU에서 이미지당 약 2초를 쓴다. 탐지 네트워크가 0.2초에 끝나는데 후보를 만드는 데 2초를 쓰는 상황이니, 전체 시간의 90% 이상이 학습되지 않는 고전 알고리즘에 묶여 있었다. 게다가 selective search는 데이터에서 배우지 않으므로 제안 품질이 과제에 맞춰 개선되지도 않는다. 이 논문의 관찰은 단순하다 — **탐지 네트워크가 이미 계산해 둔 컨볼루션 특징 맵에는 "여기 물체가 있다"는 정보가 이미 들어 있다.**',

ideas:[
 {h:'RPN: 특징 맵 위를 도는 작은 컨볼루션 네트워크',
  lead:'특징 맵 위에 3×3 conv를 슬라이딩시켜 objectness와 박스를 함께 예측한다.',
  d:'백본의 마지막 특징 맵([VGG](#/p/vgg)-16 기준 conv5) 위에 3×3 컨볼루션을 슬라이딩시키고, 각 위치에서 두 개의 1×1 컨볼루션 head가 **objectness 점수(2k)** 와 **박스 보정량(4k)** 을 뱉는다. 전부 컨볼루션이라 이미지 크기와 무관하게 한 번의 forward로 모든 위치의 제안이 나온다. 추가 비용은 **약 10ms** — selective search의 2초에 비하면 사실상 공짜다.'},
 {h:'Anchor: 스케일과 종횡비를 미리 심어둔 기준 상자',
  lead:'스케일·종횡비 9종의 anchor를 미리 두고 상대 보정량만 학습한다.',
  d:'각 슬라이딩 위치마다 3가지 스케일(128², 256², 512²)과 3가지 종횡비(1:1, 1:2, 2:1)를 조합한 **9개의 anchor**를 둔다. 네트워크는 상자를 맨땅에서 예측하는 대신 각 anchor에 대한 상대적 보정량만 학습하면 된다. 여러 크기를 다루기 위해 이미지나 필터를 여러 스케일로 돌리는 대신 **참조 상자만 여러 개 두는** 이 선택이, 이후 거의 모든 탐지기의 기본 설계가 되었다.'},
 {h:'컨볼루션 특징 공유 — 제안과 탐지가 같은 몸통을 쓴다',
  lead:'RPN과 검출 head가 같은 백본 특징 맵을 공유해 추가 비용이 거의 없다.',
  d:'RPN과 Fast R-CNN 검출 head가 **같은 백본 특징 맵**을 공유한다. 즉 제안 생성은 이미 하고 있던 계산에 얇은 head를 하나 더 붙인 것에 불과하다. 논문은 이 공유를 위해 4단계 교대 학습(RPN 학습 → 검출기 학습 → 백본 고정 후 RPN 재학습 → 검출 head 재학습)을 제안했고, 이후 구현들은 대개 하나의 손실로 함께 학습하는 방식으로 단순화했다.'},
 {h:'제안 개수를 300개로 줄여도 성능이 유지된다',
  lead:'학습된 제안 300개만으로 selective search 2000개보다 mAP가 높다.',
  d:'selective search는 2000개의 후보를 쓰지만, 학습된 RPN은 **300개**만으로 더 높은 mAP를 낸다. 제안이 물체 쪽으로 정렬돼 있기 때문에 뒤 단계가 훑을 후보가 훨씬 적어도 된다. 후보가 1/7로 줄면 RoI별 계산도 그만큼 줄어들어, 속도 이득이 제안 단계에만 그치지 않는다.'},
 {h:'네 갈래 손실을 하나로 묶는다',
  lead:'RPN 분류·회귀와 검출 분류·회귀 네 손실을 한 번에 최적화한다.',
  d:'RPN의 objectness 분류 + 박스 회귀, 검출 head의 클래스 분류 + 클래스별 박스 회귀 — 네 손실을 함께 최소화한다. 회귀에는 outlier에 덜 민감한 smooth L1을 쓰고, 미니배치는 한 이미지에서 positive:negative 비율이 1:1이 되도록 256개 anchor를 샘플링해 배경 anchor가 손실을 지배하지 않도록 막는다. 이 클래스 불균형 문제를 정면으로 다룬 것이 뒷날 [Focal Loss](#/p/focal-loss)다.'}
],

quotes:[
 {t:'Using the recently popular terminology of neural networks with ‘attention’ mechanisms, the RPN module tells the Fast R-CNN module where to look.',
  src:'Section 3, p.3'}
],

figures:[
 {f:'fig2-unified-network.png',
  cap:'맨 아래 conv layers가 만든 feature maps(빨강 테두리) 위에서 RPN이 proposals를 뽑고, 그 위에서 다시 RoI pooling으로 classifier가 판정한다. 화살표가 아래에서 위로 한 방향뿐임을 보라 — feature map은 RPN과 classifier가 같은 것을 공유한다.',
  src:'원문 Figure 2, p.3'},
 {f:'fig3-rpn-anchors.png',
  cap:'왼쪽: 빨간 사각형(sliding window) 하나가 conv feature map 위를 지나가며 256-d 벡터를 만들고, 여기서 2k개의 objectness 점수와 4k개의 좌표가 동시에 나온다. 오른쪽 파란 상자들이 그 위치에 미리 심어둔 k개의 anchor — 네트워크는 이 anchor들로부터의 상대 보정량만 예측한다.',
  src:'원문 Figure 3(left), p.4'}
],

diagram:{type:'compare', cap:'제안 단계를 고전 알고리즘에서 신경망으로 옮기면 무엇이 바뀌는가.',
 left:{t:'Fast R-CNN', items:[
  '후보 생성이 CPU에서 별도 실행(~2초)',
  '제안 알고리즘은 학습되지 않음(고정)',
  '후보 ~2000개를 뒤 단계로 넘김',
  '전체 시간의 대부분이 제안에 묶임']},
 right:{t:'Faster R-CNN (RPN)', items:[
  '백본 특징 맵 위 컨볼루션(~10ms)',
  '제안도 gradient로 학습됨',
  '후보 300개로 충분, mAP는 오히려 상승',
  'VGG-16 기준 전체 198ms = 5 fps']}},

math:[
 {expr:'L = (1/N_cls) Σ L_cls(p_i, p_i*) + λ (1/N_reg) Σ p_i* · L_reg(t_i, t_i*)',
  tex:'L = \\frac{1}{N_{cls}}\\sum_i L_{cls}(p_i,p_i^{*}) + \\lambda \\frac{1}{N_{reg}}\\sum_i p_i^{*}\\, L_{reg}(t_i,t_i^{*})',
  d:'RPN의 다중 작업 손실. $p_i^*$ 가 0(배경)이면 회귀 항이 통째로 꺼지므로 **positive anchor에 대해서만 좌표를 학습**한다. 두 항의 정규화 상수가 다르기 때문에 $\\lambda$ 로 균형을 맞춘다(논문 기본값 10).'},
 {expr:'t_x = (x − x_a)/w_a,  t_w = log(w / w_a)',
  tex:'t_x = \\dfrac{x - x_a}{w_a}, \\quad t_w = \\log\\!\\left(\\dfrac{w}{w_a}\\right)',
  d:'anchor $a$ 를 기준으로 한 상대 파라미터화. 네트워크는 절대 좌표가 아니라 **anchor로부터의 편차**만 예측하므로 학습 대상 분포가 0 주변으로 모여 수렴이 쉬워진다.'},
 {expr:'positive: IoU > 0.7 (또는 GT별 최대 IoU),  negative: IoU < 0.3',
  tex:'\\text{positive: IoU} > 0.7\\ (\\text{or max IoU per GT}), \\quad \\text{negative: IoU} < 0.3',
  d:'anchor 라벨링 규칙. 0.3~0.7 사이의 애매한 anchor는 학습에서 아예 제외한다. 어떤 GT도 0.7을 넘기지 못하는 경우를 대비해 "GT마다 최고 IoU anchor는 무조건 positive"라는 예외를 둔다.'}
],

numbers:[
 {k:'mAP · VOC 2007 test', v:'73.2%', d:'VGG-16 · 07+12 학습. selective search 기반 Fast R-CNN(70.0%)보다 높다'},
 {k:'mAP · VOC 2012 test', v:'70.4%', d:'같은 설정'},
 {k:'COCO test-dev', v:'42.7% AP@0.5 / 21.9% AP@[.5,.95]', d:'trainval 학습. 엄격한 IoU 기준에서의 이득이 특히 크다'},
 {k:'속도 · VGG-16', v:'5 fps (198ms/이미지)', d:'제안 생성 포함 전 과정. R-CNN(47초)의 약 240배'},
 {k:'속도 · ZF net', v:'17 fps', d:'가벼운 백본을 쓰면 실시간에 근접'},
 {k:'RPN 부가 비용', v:'~10ms', d:'백본을 공유하므로 추가되는 것은 얇은 head뿐'},
 {k:'제안 개수', v:'300개', d:'selective search 2000개 대비 1/7'}
],

impact:'탐지 파이프라인이 처음으로 **완전히 학습 가능한 하나의 네트워크**가 되었다. 이후 수년간 정확도 기준선은 사실상 "Faster R-CNN + 더 좋은 백본"이었고, 백본을 [ResNet](#/p/resnet)으로 바꾸는 것만으로 COCO 리더보드가 갱신되는 시기가 이어졌다. 여기서 정립된 부품들 — anchor, RPN, RoI 특징 추출, smooth L1, NMS — 은 논문의 기여를 넘어 **탐지의 공용 어휘**가 되었고, 이후 논문들은 이 어휘 위에서 하나씩 갈아끼우는 방식으로 전개된다. 동시에 "2-stage는 정확하지만 느리다"는 구도가 명확해지면서, 같은 해 [YOLO](#/p/yolo)로 대표되는 1-stage 계열이 반대편 극단을 열었다.',

legacy:[
 '**RoI Align과 분할로의 확장** — [Mask R-CNN](#/p/mask-rcnn)이 RoI Pooling의 양자화 오차를 고치고 마스크 head를 추가해 인스턴스 분할까지 흡수했다',
 '**다중 스케일 문제** — 단일 특징 맵에서 anchor만 여러 개 두는 방식의 한계가 드러나며 [FPN](#/p/fpn)이 표준 부품으로 편입됐다',
 '**1-stage와의 정확도 격차 소멸** — [SSD](#/p/ssd)를 거쳐 [Focal Loss](#/p/focal-loss)/RetinaNet이 2-stage의 정확도를 단일 단계로 따라잡으며 "정확도=2-stage" 등식이 깨졌다',
 '**anchor·NMS 자체를 없애는 흐름** — [DETR](#/p/detr)이 집합 예측과 헝가리안 매칭으로 anchor와 NMS를 모두 제거하며 이 논문이 만든 어휘를 처음으로 정면 부정했다'
],

pitfalls:[
 '**anchor 하이퍼파라미터는 공짜가 아니다.** 스케일·종횡비·IoU 임계값·샘플링 비율은 데이터셋 통계에 강하게 의존한다. 얼굴이나 텍스트처럼 종횡비 분포가 VOC와 다른 도메인에 기본 설정을 그대로 쓰면 성능이 크게 떨어진다.',
 '**"5 fps"는 VGG-16 기준의 당시 측정치다.** 백본, 입력 해상도(짧은 변 600px), 제안 개수를 바꾸면 속도는 완전히 달라진다. 논문 숫자를 하드웨어와 설정 없이 인용하면 오도된다.',
 '**RPN은 클래스를 모른다.** RPN이 내는 것은 "물체인가 배경인가"뿐이고 클래스 판별은 2단계 head의 몫이다. RPN 점수를 클래스 신뢰도처럼 해석하는 것은 흔한 오해다.'
],

links:[
 {t:'arXiv 1506.01497 — Faster R-CNN: Towards Real-Time Object Detection with RPN', u:'https://arxiv.org/abs/1506.01497'},
 {t:'Fast R-CNN (arXiv 1504.08083)', u:'https://arxiv.org/abs/1504.08083'},
 {t:'Detectron2 구현 (Meta AI)', u:'https://github.com/facebookresearch/detectron2'}
]
});
