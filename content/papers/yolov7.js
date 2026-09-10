WIKI.paper({
slug:'yolov7',
venue:'arXiv 2022 (CVPR 2023)',
authors:'Chien-Yao Wang, Alexey Bochkovskiy, Hong-Yuan Mark Liao (Academia Sinica)',
arxiv:'2207.02696',

tldr:'추론 비용은 그대로 두고 **학습 때만 비용을 쓰는 기법들**(trainable bag-of-freebies)로 실시간 검출기의 속도-정확도 곡선을 통째로 밀어 올린 논문. E-ELAN 구조, `RepConv` 기반 재매개화, 보조 헤드를 통한 깊은 감독을 조합해 V100 기준 5~160 FPS 전 구간에서 기존 검출기를 앞섰다.',

context:'[YOLOv4](#/p/yolov4) 이후 실시간 검출기는 [YOLOX](#/p/yolox), YOLOR, PPYOLOE, Scaled-YOLOv4처럼 백본·헤드·라벨 할당을 각각 개선하는 방향으로 갈라져 나갔다. 이 논문은 아키텍처 자체보다 **학습 과정의 최적화**에 주목한다. 추론 비용을 늘리지 않고 정확도만 올리는 기법(bag-of-freebies)은 YOLOv4에서도 다뤘지만, 저자들은 두 가지 새 문제를 지적한다. 첫째, [RepVGG](#/p/repvgg)류 재매개화 모듈을 아무 네트워크에나 그대로 꽂으면 오히려 정확도가 떨어진다는 것 — 어느 conv를 바꿀지 그래디언트 경로를 보고 계획해야 한다. 둘째, 여러 출력 레이어(보조 헤드 포함)를 동적 라벨 할당으로 학습시킬 때 "각 레이어에 어떤 라벨을 줄 것인가"라는 새 문제가 생긴다는 것이다.',

ideas:[
 {h:'E-ELAN: 그래디언트 경로는 그대로, 표현력만 확장',
  lead:'ELAN의 그래디언트 경로를 보존한 채 group conv로 카디널리티만 늘린다.',
  d:'[ELAN](#/p/yolov4)은 "가장 짧은/긴 그래디언트 경로를 통제하면 깊은 네트워크도 잘 수렴한다"는 원칙으로 설계된 feature aggregation 구조다. E-ELAN(Extended-ELAN)은 이 경로를 **전혀 바꾸지 않고**, computational block에만 group convolution을 적용해 채널과 카디널리티를 늘린 뒤 group별로 shuffle하고 다시 합친다(merge cardinality). transition layer는 손대지 않는다. 결과적으로 파라미터·연산량 대비 학습 능력만 커진다.'},
 {h:'Planned re-parameterized convolution: RepConv를 아무 데나 쓰면 안 된다',
  lead:'residual/concat 연결이 있는 자리의 RepConv에서는 identity 분기를 빼야 한다.',
  d:'[RepVGG](#/p/repvgg)의 `RepConv`는 학습 때 3×3+1×1+identity 세 분기를 두고 추론 때 하나의 3×3 conv로 합친다. 이 논문은 `RepConv`를 ResNet·DenseNet류에 그대로 적용하면 정확도가 떨어지는 것을 발견하고, 그 원인을 identity 분기가 이미 있는 residual/concatenation 연결과 충돌해 **그래디언트의 다양성을 죽이기 때문**이라고 분석한다. 그래서 이미 residual이나 concat이 있는 위치에서는 identity가 없는 `RepConvN`을 쓰는 "계획된 재매개화"를 제안하고, 이를 3-stacked ELAN의 특정 conv 위치에 적용해 검증한다.'},
 {h:'보조 헤드 + coarse-to-fine lead 라벨 할당으로 깊은 감독',
  lead:'lead head의 예측을 기준으로 lead·보조 헤드에 각각 다른 굵기의 라벨을 만들어 준다.',
  d:'최종 출력을 내는 head를 lead head, 중간 레이어에서 학습만 돕는 head를 보조 head(auxiliary head)라 부른다. 두 head를 독립적으로 라벨 할당하면 성능이 오히려 떨어져서, lead head의 예측 결과를 기준으로 label assigner를 돌리고 그 결과를 **lead head guided label assignment**로 두 head 모두에 전달한다. 여기서 한 단계 더 나아가 보조 head에는 recall을 우선하도록 양성 샘플 조건을 완화한 coarse label을, lead head에는 정밀한 fine label을 따로 만드는 것이 coarse-to-fine lead head guided assignment다.'},
 {h:'연결 기반 모델을 위한 compound scaling',
  lead:'concat 구조에서는 깊이를 늘리면 다음 층 입력 채널비가 바뀌어 폭도 같이 조정해야 한다.',
  d:'EfficientNet류 compound scaling은 깊이·폭·해상도를 독립 변수로 다룬다. 그런데 E-ELAN처럼 **concatenation 기반** 구조는 한 computational block의 깊이를 늘리면 그 뒤 transition layer의 입력 채널 비율이 달라져 하드웨어 활용률이 떨어진다. 그래서 이 논문은 computational block의 깊이를 스케일할 때 transition layer의 폭도 같은 비율로 같이 조정하는 concat 전용 compound scaling을 쓴다.'},
 {h:'추론 비용 없는 최적화들을 한데 묶다',
  lead:'BN 흡수, YOLOR의 implicit knowledge 벡터화, EMA 추론까지 전부 추론 시점엔 공짜다.',
  d:'배치정규화의 평균·분산을 conv의 bias·weight로 흡수하는 BN re-parameterization, YOLOR의 implicit knowledge를 미리 계산해 벡터 하나로 인접 conv에 합치는 기법, 그리고 학습 중 계속 갱신한 EMA(지수이동평균) 가중치를 최종 추론 모델로 쓰는 것까지 모두 학습 때만 계산하고 추론 그래프에는 흔적이 남지 않는다.'}
],

diagram:{type:'compare', cap:'RepConv를 아무 곳에나 쓰는 것과, 이미 residual/concat이 있는 자리에서 identity 분기를 뺀 계획된 재매개화의 차이.',
 left:{t:'RepVGG 방식 그대로', items:['3×3+1×1+identity 3분기 학습','ResNet/DenseNet에 얹으면 정확도 하락','identity가 residual과 충돌']},
 right:{t:'계획된 재매개화', items:['그래디언트 경로 분석 후 위치 선정','residual/concat 자리는 RepConvN','identity 없이 3×3+1×1만 합침']}
},

math:[
 {expr:'RepConv(x) = W_3x3 * x + W_1x1 * x + x   (학습 시)  →  W\' * x   (추론 시, 세 분기를 하나의 3×3 conv로 합침)',
  tex:'\\text{RepConv}(x)=W_{3\\times3}\\!*\\!x+W_{1\\times1}\\!*\\!x+x \\;\\xrightarrow{\\text{merge}}\\; W\'\\!*\\!x',
  d:'[RepVGG](#/p/repvgg)의 핵심 항등식. 세 분기가 전부 선형(conv, 1×1 conv, identity는 1×1의 특수형)이므로 학습이 끝나면 하나의 3×3 커널 $W\'$ 로 합쳐 추론 그래프에서 분기를 없앤다. YOLOv7은 residual/concat이 있는 자리에서는 identity 항을 빼고 두 분기만 합친다(`RepConvN`).'},
 {expr:'compound scaling (concat 기반): depth × d  ⇒  transition 폭도 × d 로 같이 조정',
  tex:'\\text{depth}\\leftarrow d\\cdot\\text{depth},\\qquad \\text{width}_{\\text{transition}}\\leftarrow d\\cdot\\text{width}_{\\text{transition}}',
  d:'EfficientNet식 독립 스케일링과 달리, concat 구조는 computational block 깊이 $d$ 배 스케일 시 다음 transition layer의 입력 채널 비율이 깨지므로 두 값을 같은 비율로 묶어서 조정한다.'}
],

numbers:[
 {k:'COCO AP · YOLOv7', v:'51.4% (test-dev/val)', d:'640 입력, **161 FPS, V100, batch=1**(Table 2) — 36.9M 파라미터'},
 {k:'COCO AP · YOLOv7-X', v:'53.1%', d:'114 FPS V100 batch=1, YOLOv5-X(r6.1) 대비 +2.2% AP, 31 FPS 더 빠름'},
 {k:'COCO AP · YOLOv7-E6', v:'56.0%/55.9%', d:'1280 입력, **56 FPS V100**. SWIN-L Cascade-Mask R-CNN(9.2 FPS A100, 53.9% AP)을 속도 509%·정확도 +2% 앞섬'},
 {k:'최고 정확도 · YOLOv7-E6E', v:'56.8% AP', d:'1280 입력, 36 FPS V100 batch=1, no-TRT — 논문이 주장하는 "30 FPS 이상 실시간 검출기 중 최고 정확도"'},
 {k:'YOLOv7 vs YOLOv4', v:'파라미터 -75%, 연산량 -36%, AP +1.5%', d:'같은 학습 설정 비교(Table 1)'},
 {k:'YOLOv7-tiny vs YOLOv6-n', v:'35.2% AP · 0.4ms', d:'V100 batch=32, FP16, IoU 0.65 조건 — YOLOv6-n(35.0% AP·0.5ms) 대비 +25% 빠르고 +0.2% AP'}
],

impact:'YOLOv7은 "새 백본을 설계하지 않고도 속도-정확도 곡선을 밀 수 있다"는 것을 보여줬다. 재매개화를 **무비판적으로 이식하면 오히려 해가 된다**는 지적은 이후 재매개화 기반 검출기 설계에서 그래디언트 경로 분석이 표준 점검 항목이 되게 했고, 보조 헤드를 통한 깊은 감독은 소형 모델에서도 학습 신호를 강화하는 방법으로 자리잡았다. 다만 이 성과 대부분이 **학습 레시피**에 있어서, 이후 [YOLOv9](#/p/yolov9)·[YOLOv10](#/p/yolov10)이 구조적 병목(정보 손실, NMS 의존) 자체를 겨냥하는 방향으로 이어졌다.',

legacy:[
 '**재매개화 설계 원칙 확립** — "어디에 RepConv를 놓을지는 그래디언트 경로를 보고 정한다"는 원칙이 이후 경량 검출기·백본 설계의 체크리스트가 됨',
 '**깊은 감독의 재조명** — 보조 헤드 + coarse-to-fine 라벨은 [YOLOv9](#/p/yolov9)의 programmable gradient information(PGI) 논의로 이어짐',
 '**"trainable bag-of-freebies" 프레이밍** — 추론 비용 불변을 전제로 학습 기법을 모으는 방식론이 이후 YOLO 계열 릴리스(v8, v9, v10)의 표준 서술 틀이 됨',
 '**NMS·앵커 의존은 그대로 남김** — 구조적 한계는 해결하지 않았고, 이 지점이 [RT-DETR](#/p/rt-detr)이 "YOLO를 이기자"고 나선 배경이 됨'
],

pitfalls:[
 '**FPS 숫자는 측정 조건이 다르면 순서가 뒤집힌다.** Table 2의 FPS는 V100·batch=1·no-TRT 기준이고, 다른 논문(YOLOv6 등)은 batch=32나 TensorRT/FP16 조건을 쓴다. 조건을 맞추지 않고 FPS만 비교하면 결론이 바뀐다 — 실제로 YOLOv7-tiny/YOLOv6-n 비교(35.2%·0.4ms)는 "V100, batch=32, FP16, IoU 0.65"라는 별도 조건에서 나온 값이다.',
 '**"trainable bag-of-freebies"는 추론 그래프를 바꾸지 않는다는 뜻이지, 학습이 가볍다는 뜻이 아니다.** 보조 헤드·재매개화 분기·EMA 모두 학습 시점의 메모리·연산을 늘린다.',
 '**RepConv를 검증 없이 다른 백본에 이식하면 정확도가 떨어질 수 있다.** 논문이 직접 보인 실패 사례이므로, `RepConv` 적용은 residual/concat 유무에 따라 identity 분기 포함 여부를 다시 판단해야 한다.'
],

figures:[
 {f:'fig1-speed-accuracy.png',
  cap:'x축이 V100 batch=1 추론 시간(ms, 작을수록 좋음), y축이 COCO AP(클수록 좋음). 같은 AP=55% 선에서 YOLOv7(보라)이 YOLOR(주황)보다 왼쪽에 있어 "+120% faster"라고 표시했다 — 곡선이 왼쪽 위에 있을수록 우수하다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-eelan.png',
  cap:'왼쪽부터 VoVNet→CSPVoVNet→ELAN→E-ELAN 순으로 진화. (d) E-ELAN은 (c) ELAN과 굵은 화살표로 표시된 그래디언트 경로(cross stage connection, stack in computational block)가 완전히 동일하고, 그 안의 3×3 conv들만 group conv로 확장(2c)한 뒤 shuffle·merge cardinality로 다시 합친다는 점을 눈으로 비교하면 된다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'YOLOv7 surpasses all known object detectors in both speed and accuracy in the range from 5 FPS to 160 FPS.',
  src:'Abstract, p.1'},
 {t:"we find that the identity connection in RepConv destroys the residual in ResNet and the concatenation in DenseNet, which provides more diversity of gradients for different feature maps.",
  src:'Section 4.1, p.4'}
],

links:[
 {t:'arXiv 2207.02696 — YOLOv7', u:'https://arxiv.org/abs/2207.02696'},
 {t:'GitHub — WongKinYiu/yolov7', u:'https://github.com/WongKinYiu/yolov7'}
]
});
