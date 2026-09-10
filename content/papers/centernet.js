WIKI.paper({
slug:'centernet',
venue:'arXiv 2019',
authors:'Zhou, Wang, Krähenbühl (UT Austin · UC Berkeley)',
arxiv:'1904.07850',

tldr:'객체를 박스가 아니라 **중심점 하나**로 표현하는 검출기. 히트맵에서 지역 최댓값(peak)을 찾는 것만으로 검출이 끝나 **NMS 후처리가 필요 없고**, 같은 틀로 3D 검출·자세 추정까지 확장된다.',

context:'2019년 시점 [FCOS](#/p/fcos)를 포함한 anchor-free 연구들도 여전히 박스를 직접 다뤘고, [YOLOv3](#/p/yolov3)·RetinaNet 같은 1단계 검출기는 anchor를 촘촘히 깔고 겹치는 예측을 NMS로 걸러내는 구조를 유지했다. NMS는 IoU 기반 중복 제거라 미분 불가능해서 검출 파이프라인 전체를 end-to-end로 학습시키지 못하게 만드는 마지막 걸림돌이었다. CenterNet은 질문을 더 단순하게 바꾼다 — **박스 전체가 아니라 중심점 하나만 키포인트로 찾으면 안 되나?** 중심점은 객체마다 정확히 하나뿐이므로 애초에 중복이 생기지 않고, NMS 자체가 불필요해진다.',

ideas:[
 {h:'객체 = 히트맵의 peak 하나',
  lead:'클래스별 히트맵을 예측하고 지역 최댓값 위치를 객체 중심으로 본다.',
  d:'입력 이미지를 fully convolutional encoder-decoder에 통과시켜 클래스마다 하나씩, 총 $C$ 채널의 히트맵 $\\hat{Y}\\in[0,1]^{W/R\\times H/R\\times C}$ 를 만든다. 학습 시 ground truth 중심점 위치에 가우시안 커널을 splat해 부드러운 타깃을 만들고, 추론 시에는 8-이웃보다 값이 큰 지역 최댓값을 상위 100개까지 뽑는다. 이 peak 추출이 $3\\times3$ max pooling 하나로 구현되어, 사실상 NMS를 대체한다.'},
 {h:'중심점에서 크기·오프셋을 직접 회귀',
  lead:'같은 위치의 feature에서 박스 크기(w,h)와 양자화 오차 보정용 오프셋을 함께 예측한다.',
  d:'히트맵은 출력 stride $R=4$ 로 다운샘플되므로 정수 좌표로 반올림하는 과정에서 오차가 생긴다. 이를 보정하는 로컬 오프셋 $\\hat{O}$ 를 별도 채널로 예측하고, 객체 크기 $(w,h)$ 도 클래스에 무관하게 하나의 회귀 헤드로 예측해 연산량을 아낀다. 결과적으로 한 위치에서 $C+4$ 개 출력만으로 검출이 끝난다.'},
 {h:'anchor의 재해석 — "위치 기반 단일 anchor"',
  lead:'중심점을 겹침이 아니라 위치만으로 결정되는 모양에 무관한 anchor 하나로 본다.',
  d:'저자는 자신들의 방법을 anchor 기반 1단계 검출기의 특수 경우로 설명한다. 다만 세 가지가 다르다 — (1) anchor 할당이 박스 겹침(IoU)이 아니라 **위치만으로** 정해지고 수동 IoU 문턱이 없다, (2) 객체당 positive anchor가 정확히 하나라 NMS가 필요 없다, (3) 출력 해상도가 stride 4로, 기존 검출기의 stride 16보다 훨씬 높아 여러 anchor를 둘 필요 자체가 사라진다.'},
 {h:'같은 파이프라인으로 3D 박스·자세까지 확장',
  lead:'중심점에 깊이·3D 크기·방향, 또는 k개 관절 오프셋을 추가 헤드로 얹기만 하면 된다.',
  d:'2D 검출과 동일한 백본에 head만 추가해 KITTI 3D 검출(깊이 스칼라, 3D 크기 3개, 방향 8개 인코딩)과 COCO 자세 추정(17개 관절 오프셋)을 수행한다. 자세 추정은 중심점에서 각 관절까지의 오프셋을 회귀한 뒤, 별도의 관절 히트맵에서 뽑은 후보들과 가장 가까운 것으로 스냅(snap)해 정제한다.'}
],

diagram:{type:'compare', cap:'anchor 나열 후 분류하는 기존 방식과 중심점 하나로 표현하는 CenterNet의 차이.',
 left:{t:'anchor 기반 1단계', items:['위치마다 anchor 여러 개','각 anchor를 전경/배경 분류','겹치는 예측 다수 발생','NMS로 중복 제거 필수']},
 right:{t:'CenterNet', items:['클래스별 히트맵 1장','peak = 객체 중심 (unique)','크기·오프셋을 같은 위치서 회귀','peak 추출이 NMS 대체']}},

math:[
 {expr:'Lk = -(1/N) Σ (1-Ŷ)^α log(Ŷ)  [Y=1],  (1-Y)^β Ŷ^α log(1-Ŷ)  [otherwise]',
  tex:'L_k=\\frac{-1}{N}\\sum_{xyc}\\begin{cases}(1-\\hat{Y}_{xyc})^{\\alpha}\\log(\\hat{Y}_{xyc}) & Y_{xyc}=1\\\\ (1-Y_{xyc})^{\\beta}(\\hat{Y}_{xyc})^{\\alpha}\\log(1-\\hat{Y}_{xyc}) & \\text{otherwise}\\end{cases}',
  d:'히트맵 학습 손실. [Focal Loss](#/p/focal-loss)를 픽셀 단위 키포인트 추정에 맞게 변형한 penalty-reduced logistic regression으로, 가우시안 타깃 근처의 negative에는 페널티를 줄여준다.'},
 {expr:'Ldet = Lk + λsize·Lsize + λoff·Loff',
  tex:'L_{det}=L_k+\\lambda_{size}L_{size}+\\lambda_{off}L_{off}',
  d:'전체 학습 목표. 논문 기본값은 $\\lambda_{size}=0.1$, $\\lambda_{off}=1$. 크기·오프셋 손실은 모두 L1.'},
 {expr:'d = 1/σ(d̂) - 1',
  tex:'d=1/\\sigma(\\hat{d})-1',
  d:'3D 검출에서 깊이를 직접 회귀하면 불안정해서, sigmoid를 거친 뒤 역변환하는 방식(Eigen et al.)을 그대로 채용해 학습을 안정시킨다.'}
],

numbers:[
 {k:'COCO AP · ResNet-18', v:'28.1% @ 142 FPS', d:'가장 가벼운 구성, 실시간 배포에 적합한 지점'},
 {k:'COCO AP · DLA-34', v:'37.4% @ 52 FPS', d:'정확도-속도 균형점으로 논문이 강조하는 대표 설정'},
 {k:'COCO AP · Hourglass-104', v:'45.1% @ 1.4 FPS', d:'multi-scale testing 포함, 최고 정확도 설정'},
 {k:'출력 stride', v:'R=4', d:'기존 검출기(stride 16)보다 4배 높은 해상도라 여러 anchor가 불필요'},
 {k:'peak 후보 수', v:'상위 100개', d:'8-이웃보다 큰 지역 최댓값을 클래스별로 추출, $3\\times3$ max pooling으로 구현'}
],

impact:'CenterNet은 "검출 = 분류+회귀+NMS"라는 고정관념에서 NMS 자체를 제거해 파이프라인을 단순화했고, 같은 중심점 프레임워크가 2D 박스뿐 아니라 3D 박스·자세 추정까지 그대로 확장된다는 것을 보여 **범용 키포인트 기반 인식 프레임워크**로서의 가능성을 제시했다. NMS 없는 검출은 엣지 디바이스 배포에서 후처리 지연을 줄이는 실무적 이점이 크고, 이후 여러 실시간 검출기 설계에 영향을 미쳤다.',

legacy:[
 '**중심점 표현의 확산** — 이후 다수의 실시간 검출기·트래커가 "박스 대신 점"이라는 CenterNet의 표현을 재사용',
 '**anchor-free 계열의 두 축** — [FCOS](#/p/fcos)(픽셀별 거리 회귀)와 CenterNet(중심점 히트맵)이 이후 anchor-free 검출 연구의 두 갈래를 이룸',
 '**멀티태스크 헤드 패턴** — "공통 백본 + 태스크별 얕은 head"라는 구조가 이후 3D 검출·자세·트래킹 통합 모델에 반복적으로 재사용됨',
 '**후처리 제거 흐름** — DETR류의 완전 end-to-end 검출(이분 매칭으로 NMS까지 제거)로 이어지는 문제의식의 초기 이정표'
],

pitfalls:[
 '**"CenterNet"이라는 이름의 동명이인 논문이 있다.** 같은 2019년 발표된 "CenterNet: Keypoint Triplets for Object Detection"(1904.08189, Duan et al.)은 코너·중심 키포인트 삼중항을 쓰는 완전히 다른 논문이다. 이 노트가 다루는 것은 "Objects as Points"(1904.07850, Zhou et al.)이다.',
 '**"NMS가 필요 없다"는 것이 "후처리가 전혀 없다"는 뜻은 아니다.** peak 추출을 위한 max pooling과 top-100 선별 자체가 일종의 억제 연산이며, 완전한 end-to-end 미분 가능성과는 다른 층위의 이야기다.',
 '**작은 객체에서 중심점이 겹치는 극단적 경우는 이 방식의 약점이다.** 서로 다른 두 객체의 중심이 다운샘플된 히트맵에서 같은 픽셀에 떨어지면 한쪽이 소실된다 — stride가 높을수록(=R이 작을수록) 완화되지만 완전히 없어지지 않는다.'
],

figures:[
 {f:'fig2-center-point.png',
  cap:'세 예시 이미지 모두 빨간 점이 예측된 객체 중심이고, 화살표가 그 지점에서 회귀되는 박스의 폭·높이를 나타낸다. 중심점 하나로 크기까지 함께 결정되는 것을 보여준다.',
  src:'원문 Figure 2, p.2'},
 {f:'fig1-speed-accuracy.png',
  cap:'x축 추론시간, y축 COCO AP. CenterNet(진한 파랑)이 FasterRCNN·RetinaNet·YOLOv3보다 왼쪽 위에 위치 — 같은 정확도에서 더 빠르거나 같은 속도에서 더 정확하다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'We model an object as a single point — the center point of its bounding box.',
  src:'Abstract, p.1'},
 {t:'Inference is a single network forward-pass, without non-maximal suppression for post-processing.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 1904.07850 — Objects as Points', u:'https://arxiv.org/abs/1904.07850'},
 {t:'공식 코드 (xingyizhou/CenterNet)', u:'https://github.com/xingyizhou/CenterNet'}
]
});
