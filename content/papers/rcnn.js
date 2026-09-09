WIKI.paper({
slug:'rcnn',
venue:'CVPR 2014',
authors:'Girshick, Donahue, Darrell, Malik (UC Berkeley)',
arxiv:'1311.2524',

tldr:'"영역을 제안하고, 그 영역마다 CNN을 돌린다"는 단순한 조합으로 객체 탐지의 mAP를 한 번에 30% 이상(상대) 끌어올린 논문. [AlexNet](#/p/alexnet)이 분류에서 보여준 학습된 특징이 탐지에도 그대로 통한다는 것을 증명했지만, 이미지 한 장에 수십 초가 걸린다는 병목을 함께 남겼다.',

context:'2010~2013년의 PASCAL VOC 탐지 성능은 정체 상태였다. 당시 최강자는 HOG 같은 **손으로 설계한 특징** 위에 deformable part model(DPM)을 얹은 계열이었고, 앙상블과 후처리로 성능을 조금씩 짜내고 있었다. 한편 2012년 [AlexNet](#/p/alexnet)은 [ImageNet](#/p/imagenet) 분류에서 손설계 특징을 압도했다. 남은 질문은 **"분류에서 통한 CNN 특징을 탐지로 옮길 수 있는가"** 였다. 탐지는 분류와 달리 "무엇"뿐 아니라 "어디"를 답해야 하고, 위치를 찾으려면 이미지 전체를 슬라이딩 윈도로 훑어야 하는데, 깊은 CNN은 receptive field가 커서 슬라이딩 방식과 궁합이 나빴다. 게다가 탐지용 라벨 데이터(VOC)는 CNN을 처음부터 학습시키기에는 너무 작았다.',

ideas:[
 {h:'탐지를 "영역 제안 + 영역 분류"로 분해한다',
  lead:'selective search로 후보 영역을 뽑고, 각 영역을 CNN으로 분류한다.',
  d:'이미지 전체를 촘촘히 훑는 대신, **selective search**로 색·질감·크기의 유사성을 병합해 물체일 법한 영역 후보를 이미지당 약 2000개 뽑는다. 그 다음은 분류 문제다 — 후보 하나하나를 잘라 227×227로 워핑한 뒤 CNN에 통과시킨다. 위치 찾기(recall)는 고전 알고리즘에, 판별(precision)은 CNN에 맡긴 역할 분담이다.'},
 {h:'특징을 설계하지 않고 학습한다',
  lead:'손설계 HOG 대신 CNN fc7 활성 4096차원을 특징으로 그대로 쓴다.',
  d:'각 영역에서 CNN의 fc7 활성을 뽑아 **4096차원 벡터**를 특징으로 쓴다. 논문의 표현대로 이것은 "HOG를 CNN으로 갈아끼운" 것이며, 이 교체 하나가 VOC 2007 기준 mAP를 33.7%(HOG 기반 DPM)에서 54.2%로 밀어 올렸다. 이후 비전 연구에서 특징 설계라는 분야 자체가 사라지는 전환점이 된다.'},
 {h:'지도 사전학습 → 도메인 미세조정',
  lead:'ImageNet 분류로 사전학습한 뒤 VOC 영역으로 미세조정해 데이터 부족을 푼다.',
  d:'탐지 데이터가 부족한 문제를, ILSVRC 분류로 먼저 학습한 네트워크를 VOC 영역 데이터로 **미세조정(fine-tuning)** 하는 방식으로 풀었다. 마지막 분류층만 (N+1)-way로 갈아끼우고, IoU ≥ 0.5인 후보를 positive로 삼아 이어서 학습한다. "큰 데이터로 사전학습하고 작은 과제로 옮긴다"는 전이학습 레시피를 탐지에서 처음 설득력 있게 보인 사례다.'},
 {h:'분류기는 softmax가 아니라 클래스별 선형 SVM',
  lead:'미세조정된 특징 위에 클래스별 이진 SVM을 따로 학습해 분류한다.',
  d:'미세조정된 CNN의 softmax를 그대로 쓰지 않고, 고정된 특징 위에 **클래스마다 하나씩 이진 SVM**을 학습한다. 학습 시에는 IoU 0.3 미만만 negative로 쓰는 hard negative mining을 적용한다. 저자들도 이 파이프라인이 어색하다는 것을 인정하며, softmax를 쓰면 mAP가 몇 점 떨어진다는 실험으로 정당화했다 — 이 부분은 이후 Fast R-CNN에서 다시 softmax로 통합된다.'},
 {h:'Bounding-box regression으로 위치를 보정한다',
  lead:'pool5 특징으로 상자 보정량을 회귀해 위치 정확도를 끌어올린다.',
  d:'selective search가 준 상자는 물체를 어긋나게 감싸는 경우가 많다. pool5 특징으로부터 (dx, dy, dw, dh) 네 개의 보정량을 릿지 회귀로 예측해 상자를 밀고 늘린다. 이 후처리 한 단계만으로 VOC 2007 mAP가 54.2% → 58.5%로 올랐다. 상자 좌표를 회귀로 다듬는다는 이 발상은 이후 모든 detector에 붙박이 부품이 된다.'}
],

figures:[
 {f:'fig1-pipeline.png',
  cap:'저자들이 그린 실제 4단계 그림. 2번 단계에서 노란 상자들이 selective search 후보이고, 3번에서 그중 하나(파란 테두리)를 정사각형으로 워핑해 CNN에 넣는다. 4번의 화살표 굵기는 없지만 각 클래스마다 독립된 yes/no 판정이라는 점이 핵심 — 클래스 수만큼 SVM이 따로 있다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'Our approach combines two key insights: (1) one can apply high-capacity convolutional neural networks (CNNs) to bottom-up region proposals in order to localize and segment objects and (2) when labeled training data is scarce, supervised pre-training for an auxiliary task, followed by domain-specific fine-tuning, yields a significant performance boost.',
  src:'Abstract, p.1'}
],

diagram:{type:'flow', cap:'R-CNN의 테스트 파이프라인. 모든 단계가 따로 학습되고, 2000개 후보 각각에 CNN이 한 번씩 돈다 — 여기서 속도 병목이 발생한다.',
 nodes:[
  {t:'입력 이미지', s:'임의 해상도'},
  {t:'영역 제안', s:'Selective Search ~2000'},
  {t:'워핑 + CNN', s:'227×227 → 4096-d', acc:true},
  {t:'클래스별 SVM', s:'2000×4096 · 4096×N'},
  {t:'NMS + 박스 회귀', s:'최종 검출'}
 ]},

math:[
 {expr:'IoU(A, B) = |A ∩ B| / |A ∪ B|',
  tex:'\\text{IoU}(A,B) = \\dfrac{|A \\cap B|}{|A \\cup B|}',
  d:'예측 상자와 정답 상자의 겹침 비율. 미세조정 시 $IoU \\ge 0.5$ 를 positive, SVM 학습 시 $IoU < 0.3$ 을 negative로 쓰는 식으로 **단계마다 다른 임계값**을 쓴다. 탐지 논문을 읽을 때 이 임계값이 어디에 걸려 있는지가 성능 차이의 상당 부분을 설명한다.'},
 {expr:'t_x = (G_x − P_x)/P_w,  t_w = log(G_w / P_w)',
  tex:'t_x = \\dfrac{G_x - P_x}{P_w}, \\quad t_w = \\log\\!\\left(\\dfrac{G_w}{P_w}\\right)',
  d:'박스 회귀의 타깃. 중심 좌표는 상자 크기로 나눠 **상대 이동량**으로, 폭·높이는 **로그 비율**로 인코딩한다. 스케일에 무관한 이 파라미터화는 이후 [Faster R-CNN](#/p/faster-rcnn)의 anchor 회귀까지 거의 그대로 계승된다.'}
],

numbers:[
 {k:'mAP · VOC 2012', v:'53.3%', d:'직전 최고 대비 **상대 30% 이상** 향상'},
 {k:'mAP · VOC 2007', v:'58.5%', d:'박스 회귀 포함(미포함 54.2%). HOG 기반 DPM은 33.7%'},
 {k:'mAP · ILSVRC2013 detection', v:'31.4%', d:'2위 OverFeat의 24.3%를 크게 앞섬'},
 {k:'영역 후보 수', v:'~2000 / 이미지', d:'selective search 결과. 이 수만큼 CNN forward가 반복된다'},
 {k:'특징 추출 시간', v:'13초/이미지 (GPU)', d:'CPU에서는 53초. 논문 자체의 측정값'},
 {k:'VGG-16 사용 시', v:'47초/이미지', d:'Fast R-CNN 논문이 보고한 R-CNN의 테스트 시간 — 실시간과 거리가 멀다'}
],

impact:'탐지 분야의 기준선이 하룻밤에 바뀌었다. 손설계 특징 + DPM 계열은 이 논문 이후 사실상 연구가 멈췄고, 모든 후속 연구가 "CNN 특징을 어떻게 더 잘, 더 빨리 쓸 것인가"로 재편됐다. 동시에 R-CNN은 **명확한 숙제 목록**을 남겼다 — (1) 후보마다 CNN을 다시 도는 중복 계산, (2) 세 개(CNN·SVM·회귀)로 쪼개진 학습 파이프라인, (3) 학습된 것이 아니라 고정된 selective search. 이후 3년간의 탐지 연구는 이 세 항목을 하나씩 지워나가는 과정으로 읽을 수 있다.',

legacy:[
 '**중복 계산 제거** — SPPnet과 Fast R-CNN이 이미지 전체를 한 번만 컨볼루션하고 특징 맵에서 RoI를 잘라내는 방식으로 바꿔, 테스트 시간을 47초에서 0.3초 수준으로 줄였다',
 '**제안까지 학습** — [Faster R-CNN](#/p/faster-rcnn)의 RPN이 selective search를 신경망으로 대체하며 파이프라인 전체가 하나의 네트워크가 됐다',
 '**2-stage를 버리는 갈래** — [YOLO](#/p/yolo)와 [SSD](#/p/ssd)가 영역 제안 단계 자체를 없애고 탐지를 단일 회귀로 재정의하며 실시간 영역을 열었다',
 '**과제 확장** — 같은 "영역 특징" 아이디어가 [Mask R-CNN](#/p/mask-rcnn)의 인스턴스 분할로, 최종적으로는 [DETR](#/p/detr)의 집합 예측으로 이어진다'
],

pitfalls:[
 '**R-CNN은 end-to-end 학습이 아니다.** CNN 미세조정, SVM 학습, 박스 회귀가 각각 따로 돌아가며 중간 특징을 디스크에 캐싱해야 한다(수백 GB). "딥러닝 탐지 = 하나의 손실로 통째 학습"이라는 현대적 그림을 이 논문에 투영하면 안 된다.',
 '**속도 병목은 CNN이 아니라 "2000번 반복"이다.** 후보 영역들이 서로 크게 겹치는데도 같은 픽셀에 대해 컨볼루션을 반복 수행한다. 이 관찰이 곧바로 SPP/RoI Pooling이라는 해법으로 이어졌다.',
 '**recall의 상한은 selective search가 정한다.** 후보에 잡히지 않은 물체는 뒤 단계가 아무리 좋아도 영영 찾지 못한다. 작은 물체 성능이 낮은 이유의 상당 부분이 여기 있고, 이 문제는 [FPN](#/p/fpn) 계열이 나오기 전까지 남는다.'
],

links:[
 {t:'arXiv 1311.2524 — Rich Feature Hierarchies for Accurate Object Detection', u:'https://arxiv.org/abs/1311.2524'},
 {t:'Fast R-CNN (후속 논문, arXiv 1504.08083)', u:'https://arxiv.org/abs/1504.08083'},
 {t:'Selective Search for Object Recognition (Uijlings et al., IJCV 2013)', u:'https://www.koen.me/research/selectivesearch/'}
]
});
