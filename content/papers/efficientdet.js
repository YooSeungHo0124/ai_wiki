WIKI.paper({
slug:'efficientdet',
venue:'CVPR 2020',
authors:'Tan, Pang, Le (Google Research, Brain Team)',
arxiv:'1911.09070',

tldr:'[EfficientNet](#/p/efficientnet)의 복합 스케일링을 검출기 전체(백본·특징 네트워크·헤드·입력 해상도)로 확장하고, 가중치를 학습하는 **양방향 특징 융합(BiFPN)**을 제안해 훨씬 적은 FLOPs로 당시 SOTA를 갱신했다.',

context:'[FPN](#/p/fpn) 이후 PANet(top-down에 bottom-up을 더함), NAS-FPN(구조 탐색으로 찾은 불규칙 위상) 등 특징 피라미드 개선이 이어졌지만, 두 가지 질문이 남아 있었다. 첫째, 서로 다른 해상도의 특징을 더할 때 다들 **동일한 가중치로 단순히 더하기만** 했는데, 해상도가 다른 특징이 출력에 똑같이 기여할 이유가 있는가? 둘째, 검출기를 키울 때 다들 backbone만, 혹은 입력 해상도만 키우는 식으로 **한 차원만** 스케일했는데, [EfficientNet](#/p/efficientnet)이 분류에서 보여준 깊이·너비·해상도의 동시 스케일링을 검출기 전체(백본+FPN+헤드)로 확장하면 어떻게 되는가? EfficientDet은 이 두 질문에 각각 BiFPN과 복합 스케일링으로 답한다.',

ideas:[
 {h:'BiFPN: 양방향 연결을 반복 가능한 한 층으로',
  lead:'기여도 낮은 노드를 제거하고 같은 레벨에 skip edge를 추가해, top-down+bottom-up 한 번을 하나의 반복 가능한 층으로 만든다.',
  d:'PANet은 top-down 한 번 + bottom-up 한 번을 딱 한 번만 쓴다. BiFPN은 세 가지를 바꾼다 — (1) 입력 엣지가 하나뿐이라 융합 기여가 없는 노드는 제거, (2) 같은 레벨의 원본 입력과 출력을 잇는 skip edge를 추가해 비용을 거의 안 늘리고 정보를 더 섞음, (3) 이 양방향 경로 전체를 하나의 "층"으로 보고 **여러 번 반복**할 수 있게 만듦. NAS-FPN처럼 수천 GPU-시간의 구조 탐색 없이, 사람이 설계한 반복 가능한 블록으로 PANet보다 나은 정확도-효율 균형을 낸다.'},
 {h:'가중 특징 융합 — 해상도마다 다른 기여도를 학습',
  lead:'입력마다 학습 가능한 가중치를 두고, ReLU+정규화로 빠르게 계산되는 fast normalized fusion을 쓴다.',
  d:'기존 FPN류는 서로 다른 해상도의 특징을 그냥 더했다. BiFPN은 각 입력에 학습 가능한 가중치 $w_i$ 를 주는데, softmax 정규화는 GPU에서 느려지므로 대신 $w_i \\geq 0$ 을 ReLU로 보장하고 합으로 나누는 **fast normalized fusion**을 쓴다. 이 방식은 softmax 방식과 학습 거동·정확도가 거의 같으면서 GPU에서 최대 30% 더 빠르다.'},
 {h:'복합 스케일링 — 하나의 φ로 전체를 함께 키운다',
  lead:'스칼라 φ 하나로 백본·BiFPN 폭·깊이·헤드 깊이·입력 해상도를 동시에, 정해진 공식대로 키운다.',
  d:'백본은 [EfficientNet](#/p/efficientnet) B0~B7의 기존 스케일링 계수를 그대로 재사용해 ImageNet 사전학습 체크포인트를 그대로 쓸 수 있게 했다. BiFPN의 폭(채널)은 $64\\cdot1.35^\\varphi$ 로 지수적으로, 깊이(반복 층 수)는 $3+\\varphi$ 로 선형적으로 늘린다. 분류·회귀 헤드의 깊이는 $3+\\lfloor\\varphi/3\\rfloor$, 입력 해상도는 $512+\\varphi\\cdot128$ 로 늘린다. 이 하나의 정수 $\\varphi=0\\ldots7$ 로 EfficientDet-D0부터 D7까지 **하나의 공식**으로 전체 모델군을 만들어낸다.'},
 {h:'공유 헤드로 파라미터를 절약한다',
  lead:'분류·박스 헤드의 가중치를 모든 FPN 레벨이 공유해 파라미터 수를 크게 줄인다.',
  d:'RetinaNet과 마찬가지로 클래스·박스 예측 네트워크의 가중치를 P3~P7 모든 레벨이 공유한다. 레벨마다 별도 헤드를 두지 않는 이 선택이 복합 스케일링과 맞물려, 큰 모델(D7)도 파라미터를 과도하게 늘리지 않고 정확도만 끌어올릴 수 있게 한다.'}
],

diagram:{type:'compare', cap:'특징 피라미드 융합 방식의 진화 — PANet까지의 단방향/단순 가산 대 BiFPN.',
 left:{t:'FPN → PANet', items:['top-down 한 번(FPN)','+bottom-up 한 번(PANet)','모든 입력을 동일 가중치로 가산','블록 반복 불가']},
 right:{t:'BiFPN', items:['기여 없는 노드 제거','같은 레벨 skip edge 추가','입력마다 학습된 가중치로 가산','한 블록을 여러 번 반복']}},

math:[
 {expr:'O = Σ_i [ wi / (Σ_j wj + ε) ] · Ii',
  tex:'O=\\sum_i \\frac{w_i}{\\varepsilon+\\sum_j w_j}\\cdot I_i',
  d:'fast normalized fusion. $w_i\\geq0$ 은 ReLU로 보장하고 $\\varepsilon=0.0001$ 로 0-나눗셈을 방지한다. softmax 없이도 입력별 상대적 중요도를 학습한다.'},
 {expr:'Wbifpn = 64 · 1.35^φ,  Dbifpn = 3 + φ',
  tex:'W_{bifpn}=64\\cdot1.35^{\\varphi},\\qquad D_{bifpn}=3+\\varphi',
  d:'BiFPN의 채널 폭은 지수적으로, 반복 층 수는 선형적으로 키운다. [EfficientNet](#/p/efficientnet)의 복합 스케일링 공식을 검출기의 특징 네트워크에 맞게 재해석한 것.'},
 {expr:'Rinput = 512 + φ · 128',
  tex:'R_{input}=512+\\varphi\\cdot128',
  d:'BiFPN이 레벨 3~7(stride 8~128)을 모두 쓰므로 입력 해상도가 $2^7=128$ 의 배수여야 한다는 제약에 맞춰 선형적으로 키운다.'}
],

numbers:[
 {k:'COCO AP · EfficientDet-D7x', v:'55.1', d:'77M 파라미터, 410B FLOPs — 발표 시점 단일모델 단일스케일 SOTA'},
 {k:'COCO AP · EfficientDet-D0', v:'33.8 (2.5B FLOPs)', d:'YOLOv3(33.0 AP, 71B FLOPs)와 동급 정확도에 FLOPs **1/28**'},
 {k:'COCO AP · EfficientDet-D1', v:'39.6 (6.1B FLOPs)', d:'RetinaNet-R50(39.2 AP, 97B FLOPs) 동급 정확도에 FLOPs **1/16**'},
 {k:'GPU 지연시간 · D1', v:'16ms (Titan V)', d:'RetinaNet 32ms 대비 2.0배 빠름'},
 {k:'파라미터 대비 정확도', v:'AmoebaNet+NAS-FPN+AA 대비 SOTA 동급에서 FLOPs 13x, 파라미터 최대 9x 작음', d:'D7x 기준'}
],

impact:'EfficientDet은 검출기 설계에서도 "따로따로 키우지 말고 함께 키운다"는 [EfficientNet](#/p/efficientnet)식 접근이 유효함을 보여, 이후 검출 모델 계열들이 단일 스케일링 계수로 여러 모델 크기를 파생시키는 설계를 표준으로 채택하게 만들었다. BiFPN의 가중 융합·반복 가능한 블록 구조는 특징 피라미드 설계의 사실상 정리판으로 받아들여져, 이후 여러 검출·분할 아키텍처의 FPN 자리에 직접 대체돼 쓰였다.',

legacy:[
 '**FPN 계열 개선의 정리판** — FPN → PANet → NAS-FPN으로 이어진 특징 융합 개선 흐름을 BiFPN이 사실상 마무리지으며 이후 새 FPN 변형 연구가 크게 줄어듦',
 '**복합 스케일링의 검출기 확산** — 이후 여러 검출기 계열이 "하나의 계수로 백본·헤드·해상도를 동시에 스케일"하는 EfficientDet식 설계를 채택',
 '**모바일·엣지 배포 기준선화** — D0~D2 같은 경량 구성이 FLOPs 제약이 큰 실무 환경에서 오래도록 비교 기준으로 쓰임',
 '**[YOLOv3](#/p/yolov3)·RetinaNet과의 FLOPs 대비 정확도 비교가 이후 검출 논문의 표준 그래프 형식이 됨** — Figure 1의 FLOPs-AP 곡선 형식이 후속 논문에 자주 재사용됨'
],

pitfalls:[
 '**AP만 보고 "더 정확하다"고 결론 내리면 안 된다.** EfficientDet의 핵심 주장은 **같은 FLOPs/파라미터 대비** 정확도이지, 최고 AP(D7x 55.1)만 떼어놓고 비교하면 모델 크기·연산량 차이를 놓치게 된다.',
 '**FLOPs가 적다고 실제 지연시간(latency)이 항상 비례해 줄지는 않는다.** 논문도 이를 인지해 Titan V·V100·CPU에서 별도로 실측 지연시간을 보고한다 — FLOPs 비율과 실측 배속 비율이 정확히 일치하지 않는 경우가 있다(예: GPU에서 FLOPs 대비 배속 이득이 CPU보다 작음).',
 '**BiFPN의 "양방향"을 PANet과 같은 것으로 착각하기 쉽다.** PANet은 top-down·bottom-up을 각각 한 번만 쓰고 노드/엣지 구조가 고정이지만, BiFPN은 저기여 노드 제거·skip edge 추가·블록 반복이라는 세 가지 변경이 추가된 별개의 구조다.'
],

figures:[
 {f:'fig2-bifpn-comparison.png',
  cap:'왼쪽부터 (a) FPN은 위에서 아래로만 흐르는 단방향, (b) PANet은 아래에서 위로 가는 경로를 한 번 추가, (c) NAS-FPN은 구조 탐색으로 찾은 불규칙 연결, (d) BiFPN은 같은 레벨 skip edge(보라색 곡선)를 더하고 점선 박스 단위(양방향 한 층)를 반복한다.',
  src:'원문 Figure 2, p.3'},
 {f:'fig1-flops-accuracy.png',
  cap:'x축 FLOPs, y축 COCO AP. 빨간 실선(EfficientDet D0~D7)이 왼쪽 위로 치우쳐, RetinaNet·Mask R-CNN·NAS-FPN 계열(점선)보다 훨씬 적은 FLOPs에서 같은 AP에 도달한다. 표는 대표 지점의 정확 수치와 FLOPs 배율.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'We propose a weighted bi-directional feature pyramid network (BiFPN), which allows easy and fast multi-scale feature fusion.',
  src:'Abstract, p.1'},
 {t:'Our EfficientDet-D7 achieves state-of-the-art 55.1 AP on COCO test-dev with 77M parameters and 410B FLOPs, being 4x–9x smaller and using 13x–42x fewer FLOPs than previous detectors.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1911.09070 — EfficientDet: Scalable and Efficient Object Detection', u:'https://arxiv.org/abs/1911.09070'},
 {t:'공식 코드 (google/automl/efficientdet)', u:'https://github.com/google/automl/tree/master/efficientdet'}
]
});
