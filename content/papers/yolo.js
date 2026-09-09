WIKI.paper({
slug:'yolo',
venue:'CVPR 2016',
authors:'Redmon, Divvala, Girshick, Farhadi (U. Washington · Allen Institute for AI · FAIR)',
arxiv:'1506.02640',

tldr:'객체 탐지를 "후보를 만들고 분류한다"가 아니라 **이미지 픽셀에서 박스 좌표와 클래스 확률로 가는 하나의 회귀 문제**로 재정의한 논문. 단일 네트워크의 한 번의 forward로 탐지가 끝나기 때문에 45 FPS(경량판 155 FPS)라는, 그때까지 없던 속도 영역을 열었다.',

context:'2015년까지의 탐지기는 전부 **여러 단계의 조합**이었다. DPM은 슬라이딩 윈도로 분류기를 훑었고, [R-CNN](#/p/rcnn) 계열은 영역 제안 → 특징 추출 → 분류 → 박스 회귀 → NMS로 이어지는 파이프라인을 각각 따로 학습했다. [Faster R-CNN](#/p/faster-rcnn)이 이 단계들을 한 네트워크로 묶었지만, 여전히 **제안을 만들고 그 제안들을 다시 평가하는** 2단계 구조였고 VGG-16 기준 5 fps에 머물렀다. 이 속도로는 로봇·자율주행·비디오 스트림처럼 프레임이 계속 들어오는 상황을 감당할 수 없다. 또 하나의 문제는 파이프라인이 분절돼 있어 최종 탐지 성능을 직접 최적화할 수 없다는 점이었다. 이 논문의 질문은 근본적이다 — **탐지를 그냥 회귀 하나로 쓰면 안 되는가?**',

ideas:[
 {h:'이미지를 S×S 격자로 나누고, 셀마다 직접 예측한다',
  lead:'이미지를 7×7 격자로 나눠 각 셀이 자기 중심의 물체를 직접 예측한다.',
  d:'입력 448×448 이미지를 **7×7 격자**로 나눈다. 물체 중심이 어느 셀에 떨어지면 **그 셀이 그 물체를 책임진다**. 각 셀은 B=2개의 박스(x, y, w, h, confidence)와 20개 클래스의 조건부 확률을 예측하므로, 네트워크의 최종 출력은 7×7×(2·5+20) = **7×7×30 텐서** 하나다. 영역 제안도, RoI별 반복 계산도 없다.'},
 {h:'전역 문맥을 보고 판단한다',
  lead:'잘라낸 영역이 아니라 이미지 전체를 보고 배경 오검출을 줄인다.',
  d:'R-CNN 계열은 잘라낸 영역만 보고 분류하므로 배경 패치를 물체로 오인하기 쉽다. YOLO는 학습·추론 모두에서 **이미지 전체**를 보기 때문에 클래스의 맥락적 정보를 함께 쓴다. 논문의 오류 분석에 따르면 Fast R-CNN은 YOLO보다 배경을 물체로 잘못 예측할 확률이 약 3배 높다(Fast R-CNN 상위 검출의 13.6%가 물체를 전혀 담지 않은 오검출) — 실제로 YOLO로 Fast R-CNN의 배경 오검출을 걸러내면 Fast R-CNN 단독보다 mAP가 오른다.'},
 {h:'confidence = "물체가 있을 확률" × "박스가 얼마나 정확한가"',
  lead:'confidence를 물체 존재 확률과 예측 박스 IoU의 곱으로 정의한다.',
  d:'각 박스의 confidence는 $Pr(Object) \\times IoU_{pred}^{truth}$ 로 정의된다. 즉 네트워크는 존재 여부와 위치 품질을 **하나의 스칼라에 곱해서** 학습한다. 최종 클래스별 점수는 여기에 셀의 클래스 확률을 곱해 얻는다. 이미지당 박스는 7×7×2 = **98개**뿐이라 NMS 부담도 Faster R-CNN(300 제안)보다 가볍다.'},
 {h:'좌표·신뢰도·클래스를 하나의 제곱오차 손실로',
  lead:'좌표·신뢰도·클래스를 하나의 제곱오차 손실에 가중치로 함께 넣는다.',
  d:'전부 sum-squared error로 최적화하되, 격자 셀 대부분이 물체를 담지 않는 **극심한 불균형**을 상수로 보정한다 — 좌표 항에 $\\lambda_{coord}=5$, 물체 없는 셀의 confidence 항에 $\\lambda_{noobj}=0.5$. 또 큰 박스의 오차와 작은 박스의 오차를 동등하게 취급하지 않으려고 폭·높이는 **제곱근**을 씌워 회귀한다.'},
 {h:'실시간을 설계 목표로 삼는다',
  lead:'백본을 직접 설계해 45 FPS(경량판 155 FPS)를 목표로 최적화한다.',
  d:'24개 컨볼루션 층 + 2개 FC 층(GoogLeNet 스타일의 1×1 축소 사용)으로 백본을 직접 설계하고, 224×224 분류 사전학습 후 탐지용으로 **448×448에서 미세조정**한다. 층 수를 9개로 줄인 Fast YOLO는 155 FPS로 동작한다. "정확도를 얼마나 포기하고 속도를 얼마나 얻는가"를 명시적 설계 축으로 올린 첫 탐지 논문에 가깝다.'}
],

figures:[
 {f:'fig2-grid-model.png',
  cap:'왼쪽 원본 위에 그려진 격자가 S×S. 위쪽 "Bounding boxes + confidence"는 각 셀이 뱉는 박스들(굵기가 confidence), 아래 "Class probability map"은 색으로 표시된 셀별 클래스 확률. 이 둘을 곱해 오른쪽 "Final detections"의 상자와 라벨이 나온다 — 별도의 영역 제안 단계가 그림 어디에도 없다.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'We reframe object detection as a single regression problem, straight from image pixels to bounding box coordinates and class probabilities.',
  src:'Abstract, p.1'}
],

diagram:{type:'compare', cap:'같은 문제를 보는 두 가지 방식. 오른쪽은 파이프라인 자체가 사라진다.',
 left:{t:'2-stage (R-CNN 계열)', items:[
  '영역 제안 → RoI 특징 → 분류 → 회귀',
  '이미지당 300~2000개 후보를 평가',
  '단계별 학습 또는 복합 손실',
  'VGG-16 기준 5 fps']},
 right:{t:'YOLO: 단일 회귀', items:[
  '이미지 → 7×7×30 텐서, 한 번의 forward',
  '이미지당 박스 98개',
  '탐지 성능을 하나의 손실로 직접 최적화',
  '45 fps (Fast YOLO 155 fps)']}},

math:[
 {expr:'confidence = Pr(Object) × IoU(pred, truth)',
  tex:'\\text{confidence} = \\Pr(\\text{Object}) \\times \\text{IoU}(\\text{pred}, \\text{truth})',
  d:'박스 하나가 내놓는 신뢰도의 정의. 물체가 없는 셀에서는 목표값이 0이고, 있는 셀에서는 **예측 박스와 정답의 실제 IoU** 가 목표값이 된다. 학습 중 매 스텝 목표가 바뀌는 셈이라, 정확한 박스를 낼수록 confidence 목표도 함께 올라간다.'},
 {expr:'Pr(Class_i | Object) × Pr(Object) × IoU = Pr(Class_i) × IoU',
  tex:'\\Pr(\\text{Class}_i \\mid \\text{Object}) \\times \\Pr(\\text{Object}) \\times \\text{IoU} = \\Pr(\\text{Class}_i) \\times \\text{IoU}',
  d:'클래스 확률은 **박스가 아니라 셀 단위**로 하나만 예측한다. 그래서 한 셀 안에 서로 다른 클래스의 물체가 두 개 겹치면 원리적으로 둘 다 맞힐 수 없다 — YOLO v1의 가장 큰 구조적 한계다.'},
 {expr:'λ_coord = 5,  λ_noobj = 0.5',
  tex:'\\lambda_{coord} = 5, \\quad \\lambda_{noobj} = 0.5',
  d:'격자 셀 49개 중 물체를 담는 셀은 보통 한 자릿수다. 보정이 없으면 "전부 배경"이라는 해가 손실을 지배해 학습 초반에 발산한다. 이 클래스 불균형을 상수 가중치로 눌렀다는 점이, 뒤에 [Focal Loss](#/p/focal-loss)가 손실 함수 자체로 푸는 문제와 정확히 같은 지점이다.'}
],

numbers:[
 {k:'mAP · VOC 2007', v:'63.4%', d:'Faster R-CNN(VGG-16) 73.2%보다 약 10점 낮다'},
 {k:'속도 · YOLO', v:'45 FPS', d:'Titan X 기준. 실시간 탐지기 중 정확도 1위였다'},
 {k:'Fast YOLO', v:'52.7% mAP · 155 FPS', d:'당시 다른 실시간 탐지기의 두 배 이상 mAP'},
 {k:'mAP · VOC 2012', v:'57.9%', d:'VGG-16 기반 방법들에 뒤지지만 속도는 한 자릿수 배 차이'},
 {k:'출력 텐서', v:'7×7×30', d:'S=7, B=2, C=20 → 이미지당 박스 98개'},
 {k:'배경 오검출', v:'Fast R-CNN이 약 3배 많음', d:'Fast R-CNN 상위 검출의 13.6%가 물체 없는 오검출. YOLO와 결합하면 Fast R-CNN mAP가 71.8% → 75.0%'}
],

impact:'"정확도를 조금 내주고 속도를 한 자릿수 배 얻는다"는 교환이 처음으로 명확한 선택지가 되었다. 이 논문 이후 탐지 논문은 mAP만 보고하지 않고 **mAP–FPS 곡선 위의 위치**를 보고하는 것이 관행이 됐다. 더 중요한 것은 관점의 전환이다 — 탐지를 "후보 검증" 문제가 아니라 **밀집 예측(dense prediction)** 문제로 보면, 격자의 각 위치가 곧 예측 단위가 된다. 이 관점은 [SSD](#/p/ssd), RetinaNet, FCOS를 거쳐 오늘날 1-stage 탐지기 전체의 기본 틀이 되었고, 산업 현장에서 실제로 배포되는 탐지기의 대부분이 이 계보에 속한다.',

legacy:[
 '**YOLO 계열의 계속되는 세대교체** — v2/v3에서 anchor, multi-scale, 로지스틱 클래스 예측을 흡수하며 v1의 한계를 하나씩 지웠고, 이후에도 산업 표준 실시간 탐지기로 남았다',
 '**격자 예측의 정교화** — [SSD](#/p/ssd)가 여러 해상도의 특징 맵에 default box를 깔아 YOLO의 낮은 recall과 작은 물체 약점을 정면으로 보완했다',
 '**1-stage의 정확도 문제 해결** — 밀집 예측이 겪는 극단적 전경/배경 불균형을 [Focal Loss](#/p/focal-loss)가 손실 설계로 풀며 1-stage가 2-stage 정확도를 따라잡았다',
 '**anchor-free로의 회귀** — "셀이 물체를 책임진다"는 YOLO v1의 원래 발상이 FCOS·CenterNet 계열에서 anchor 없는 밀집 예측으로 되살아났다'
],

pitfalls:[
 '**v1의 격자는 강한 공간적 제약이다.** 한 셀은 박스 2개, 클래스 1개만 예측하므로 새 떼처럼 작은 물체가 몰려 있는 장면에서는 원리적으로 다 잡을 수 없다. 논문도 이를 한계로 명시한다.',
 '**"YOLO가 Faster R-CNN보다 좋다"가 아니다.** VOC 2007 기준 mAP는 63.4% 대 73.2%로 오히려 낮다. 논문의 주장은 정확도 우위가 아니라 **속도–정확도 곡선의 새로운 지점**이고, 실제로 저자들은 YOLO를 Fast R-CNN의 보완재(배경 오검출 필터)로 결합하는 실험까지 보여준다.',
 '**오늘날의 "YOLO"는 이 논문이 아니다.** 현재 쓰이는 YOLO 구현들은 anchor, [FPN](#/p/fpn) 계열 넥, 다양한 라벨 할당 전략이 겹겹이 쌓인 별개의 계보다. v1의 손실 함수나 7×7 격자를 현행 YOLO의 설명으로 옮기면 틀린다.'
],

links:[
 {t:'arXiv 1506.02640 — You Only Look Once: Unified, Real-Time Object Detection', u:'https://arxiv.org/abs/1506.02640'},
 {t:'YOLO 프로젝트 페이지 (Darknet)', u:'https://pjreddie.com/darknet/yolo/'},
 {t:'YOLO9000 / YOLOv2 (arXiv 1612.08242)', u:'https://arxiv.org/abs/1612.08242'}
]
});
