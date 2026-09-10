WIKI.paper({
slug:'yolov3',
venue:'arXiv tech report 2018',
authors:'Redmon & Farhadi (University of Washington)',
arxiv:'1804.02767',

tldr:'[YOLO](#/p/yolo) 계열에 다중 스케일 예측과 새 백본 Darknet-53을 얹어, SSD와 같은 속도에서 정확도를 크게 끌어올린 개정판. 저자 스스로 "그냥 자잘한 개선들"이라 부르지만, 실무에서는 오랫동안 가장 널리 배포된 검출기였다.',

context:'[YOLO](#/p/yolo)와 YOLOv2(YOLO9000)는 단일 스케일 feature map에서 곧바로 박스를 회귀해 빨랐지만, 작은 물체 검출이 특히 약했다. 같은 시기 [FPN](#/p/fpn)과 [Focal Loss](#/p/focal-loss)(RetinaNet)는 다중 스케일 pyramid와 클래스 불균형 처리로 1단계 검출기의 정확도를 2단계 검출기 수준까지 끌어올렸다. YOLOv3는 이 흐름을 YOLO 계열에 이식하는 작업이다. 저자는 이 논문을 논문이 아니라 "tech report"라 부르는데, 실제로 인용을 위한 근거 문서가 필요해서 급하게 썼다고 서문에 적혀 있고, 본문 전체가 실험 노트에 가까운 구어체로 쓰여 있다.',

ideas:[
 {h:'3개 스케일에서 독립적으로 예측',
  lead:'FPN 방식의 업샘플·병합으로 13×13·26×26·52×52 세 해상도에서 각각 박스를 뽑는다.',
  d:'백본 마지막 feature map에서 한 번, 그것을 2배 업샘플해 더 얕은 층의 feature map과 concat한 뒤 다시 한 번, 이를 반복해 총 3개 스케일에서 예측한다. [FPN](#/p/fpn)과 개념은 같지만 top-down lateral 연결 대신 단순 concat을 쓴다. 각 스케일마다 3개씩, 총 9개의 anchor(k-means로 구한 dimension cluster)를 스케일별로 나눠 배정해 큰 스케일은 작은 anchor를, 작은 스케일은 큰 anchor를 맡는다. 이 변화만으로 작은 물체 검출력이 크게 개선됐다.'},
 {h:'로지스틱 다중 라벨 분류 — softmax를 버린다',
  lead:'클래스 예측에 softmax 대신 클래스별 독립 로지스틱 분류기와 이진 교차엔트로피를 쓴다.',
  d:'softmax는 한 박스가 정확히 하나의 클래스에만 속한다고 가정한다. 그런데 Open Images 같은 데이터셋에는 "Woman"과 "Person"처럼 겹치는 라벨이 흔하다. YOLOv3는 클래스마다 독립적인 로지스틱 회귀 + binary cross-entropy를 써서 한 박스가 여러 클래스에 동시에 속할 수 있게 했다. objectness 점수도 같은 방식으로 로지스틱 회귀로 예측한다.'},
 {h:'Darknet-53 — 3×3/1×1 + shortcut',
  lead:'Darknet-19에 residual shortcut을 더해 53층으로 키운 새 백본.',
  d:'ResNet 스타일의 shortcut 연결을 Darknet 계열에 처음 도입했다. ImageNet top-1 77.2%로 ResNet-101(77.1%)과 비슷한 정확도를 내면서도 초당 부동소수점 연산(BFLOP/s)은 더 높고 Titan X에서 78 FPS로 ResNet-101(53 FPS)보다 빠르다. 레이어 수는 많지만 연산 효율이 ResNet보다 좋다는 것이 핵심 주장이다.'},
 {h:'objectness 기반 단일 anchor 할당',
  lead:'ground truth마다 IoU가 가장 높은 anchor prior 딱 하나에만 좌표·클래스 loss를 매긴다.',
  d:'Faster R-CNN류가 쓰는 이중 IoU 문턱(0.7 이상 positive, 0.3 미만 negative)을 시도했지만 결과가 나빴다고 밝힌다. 대신 각 ground truth 객체에 가장 잘 맞는 anchor prior 하나만 responsible로 지정하고, 나머지 prior가 문턱(0.5) 이상 겹치더라도 loss 없이 무시한다. 단순하지만 저자들이 "지금 국소 최적점에 있는 것 같다"고 스스로 평가할 만큼 미세조정된 규칙이다.'},
 {h:'실패한 시도들을 그대로 공개',
  lead:'Focal Loss·선형 x,y 예측·이중 IoU 문턱을 시도했지만 효과가 없었다고 명시한다.',
  d:'[Focal Loss](#/p/focal-loss)를 그대로 적용했더니 오히려 mAP가 약 2점 떨어졌다고 보고한다. objectness와 클래스 예측이 이미 분리돼 있어 대부분의 예측에 클래스 loss 자체가 거의 없기 때문일 것이라 추측하지만 확신하지는 못한다고 적는다. 이런 음성 결과 공개는 당시 논문 문화에서 드물었고, 이후 이 보고서가 "정직한 실험 노트"로 자주 인용되는 이유이기도 하다.'}
],

diagram:{type:'flow', cap:'Darknet-53에서 3개 스케일로 갈라지는 예측 경로. 얕은 층 feature map일수록 작은 물체를 담당한다.',
 nodes:[
  {t:'Darknet-53', s:'53층, shortcut 포함'},
  {t:'13×13 예측', s:'큰 물체', a:'2배 업샘플'},
  {t:'26×26 병합+예측', s:'concat, 중간 물체', acc:true, a:'2배 업샘플'},
  {t:'52×52 병합+예측', s:'concat, 작은 물체'}
 ]},

math:[
 {expr:'bx = σ(tx) + cx,  by = σ(ty) + cy,  bw = pw·e^tw,  bh = ph·e^th',
  tex:'\\begin{aligned} b_x &= \\sigma(t_x) + c_x \\\\ b_y &= \\sigma(t_y) + c_y \\\\ b_w &= p_w e^{t_w} \\\\ b_h &= p_h e^{t_h} \\end{aligned}',
  d:'예측 $t_x,t_y,t_w,t_h$ 를 실제 박스 좌표로 바꾸는 식. 중심 좌표는 시그모이드로 셀 내부(0~1)에 가두고, 폭·높이는 anchor prior $p_w, p_h$ 에 지수를 곱해 조정한다. [YOLO](#/p/yolo)의 grid 회귀를 그대로 물려받았다.'},
 {expr:'N × N × [3 * (4 + 1 + 80)]',
  tex:'N \\times N \\times [3*(4+1+80)]',
  d:'COCO 기준 한 스케일의 출력 텐서 모양. 각 격자 셀마다 3개 anchor, 각 anchor마다 좌표 4개 + objectness 1개 + 클래스 80개(로지스틱)를 예측한다.'}
],

numbers:[
 {k:'COCO AP · YOLOv3-608', v:'33.0', d:'AP50=57.9, 51ms — RetinaNet-101-800(AP 37.8, 198ms)보다 낮지만 **3.8배 빠름**'},
 {k:'COCO AP50 · YOLOv3-608', v:'57.9', d:'구식 IoU=.5 지표에서는 RetinaNet(57.5)과 거의 동률'},
 {k:'YOLOv3-320', v:'28.2 mAP / 22ms', d:'320×320 입력, SSD321과 동급 정확도에 3배 빠름'},
 {k:'ImageNet · Darknet-53', v:'top-1 77.2%, 78 FPS', d:'ResNet-101(77.1%, 53 FPS)과 동급 정확도에 더 빠름 (Titan X)'},
 {k:'Darknet-53 규모', v:'53 conv layers', d:'3×3/1×1 반복 + shortcut, ImageNet 분류용 사전학습 백본'},
 {k:'anchor 개수', v:'9개 (스케일당 3개)', d:'COCO에서 k-means로 구한 클러스터, 예: (10×13) ~ (373×326)'}
],

impact:'YOLOv3는 연구적 참신함보다 **실무 배포 가능성**에서 영향이 컸다. 다중 스케일 예측으로 작은 물체 약점을 상당히 메웠고, Darknet-53으로 속도-정확도 균형을 잡으면서 이후 수년간 임베디드·엣지 환경에서 가장 널리 쓰인 검출기 중 하나가 됐다. 또한 저자가 COCO AP 지표(0.5~0.95 IoU 평균)를 "이상한 지표"라 비판하며 사람의 IoU 경계 판단 자체가 애매하다는 논쟁을 정면으로 제기한 것도, 검출 평가 지표에 대한 커뮤니티 논의를 촉발했다.',

legacy:[
 '**Darknet 계열의 정점이자 마지막** — 이후 저자 Redmon은 컴퓨터 비전 연구의 군사·감시 악용을 우려해 이 분야를 떠났고, YOLOv4부터는 다른 팀이 이어받았다',
 '**anchor 기반 검출의 관성** — 같은 해 [FCOS](#/p/fcos)가 anchor 없는 대안을 제시하며 YOLOv3식 9-anchor 설계의 하이퍼파라미터 의존을 정면 비판',
 '**다중 스케일 예측의 표준화** — 이후 [EfficientDet](#/p/efficientdet)의 BiFPN을 포함해 거의 모든 1단계 검출기가 FPN류 다중 스케일 헤드를 기본값으로 채택',
 '**로지스틱 다중 라벨 분류** — 클래스 중첩이 흔한 실무 데이터셋에서 softmax 대신 독립 로지스틱을 쓰는 설계가 이후 검출기에도 종종 재사용됨'
],

pitfalls:[
 '**"YOLOv3가 SOTA"라는 인용은 지표를 확인해야 한다.** COCO AP(.5~.95)로는 RetinaNet에 확실히 뒤진다. YOLOv3가 강한 것은 옛 AP50 지표뿐이며, 저자 스스로 이 차이를 논문에서 인정한다.',
 '**"anchor-free의 시대에도 여전히 anchor 기반"이라는 점을 놓치기 쉽다.** 9개의 anchor 크기는 COCO 통계에 k-means로 맞춘 값이라 다른 도메인(예: 항공 촬영, 의료 영상)에 그대로 쓰면 성능이 떨어진다 — 데이터셋마다 재클러스터링이 필요하다.',
 '**Focal Loss를 붙이면 무조건 좋아질 것이라는 가정은 틀렸다.** 저자들이 직접 실험해 오히려 mAP가 떨어졌다고 보고했다 — objectness/클래스 예측이 분리된 구조에서는 클래스 불균형 문제의 양상이 RetinaNet과 다르다.'
],

figures:[
 {f:'fig1-speed-accuracy.png',
  cap:'x축이 추론 시간(ms), y축이 COCO AP. YOLOv3(분홍 별)가 왼쪽 위 — 같은 시간대의 RetinaNet-50/101(원·마름모)보다 AP가 높거나 훨씬 빠르다. 표는 각 점의 실제 mAP·시간 수치.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-bbox-prediction.png',
  cap:'격자 셀 좌상단 오프셋 $(c_x,c_y)$ 와 anchor prior 폭·높이 $(p_w,p_h)$ 로부터 실제 박스 $(b_x,b_y,b_w,b_h)$ 를 만드는 과정. 점선이 anchor prior, 파란 실선이 예측된 박스.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:"So here's the deal with YOLOv3: We mostly took good ideas from other people.",
  src:'Section 2, p.1'},
 {t:'YOLOv3 is a good detector. It’s fast, it’s accurate. It’s not as great on the COCO average AP between .5 and .95 IOU metric.',
  src:'Section 5, p.4'}
],

links:[
 {t:'arXiv 1804.02767 — YOLOv3: An Incremental Improvement', u:'https://arxiv.org/abs/1804.02767'},
 {t:'pjreddie.com/darknet/yolo', u:'https://pjreddie.com/darknet/yolo/'}
]
});
