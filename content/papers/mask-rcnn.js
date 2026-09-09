WIKI.paper({
slug:'mask-rcnn',
venue:'ICCV 2017 (Best Paper)',
authors:'He, Gkioxari, Dollár, Girshick (Facebook AI Research)',
arxiv:'1703.06870',

tldr:'[Faster R-CNN](#/p/faster-rcnn)에 **마스크 예측 브랜치 하나를 병렬로 덧붙인 것**이 전부인데, 그 과정에서 RoIPool의 좌표 반올림이 픽셀 단위 예측을 망가뜨린다는 것을 발견하고 **RoIAlign**으로 바꿨다. 탐지·인스턴스 분할·사람 키포인트가 같은 프레임 하나로 통합됐다.',

context:'2016년까지 인스턴스 분할은 탐지와 별개의 파이프라인이었다. DeepMask·MNC 같은 방법은 마스크 후보를 먼저 만들고 분류하는 다단계 캐스케이드였고, 단계마다 오차가 누적됐다. 반대편에서 [FCN](#/p/fcn) 계열의 시맨틱 분할은 픽셀을 잘 칠하지만 **같은 클래스의 두 사람을 구분하지 못한다**. 한편 탐지 쪽에서는 [Faster R-CNN](#/p/faster-rcnn)이 RPN으로 영역 제안을 내재화하며 사실상 표준이 되어 있었다. 그렇다면 이미 잘 도는 탐지기의 각 RoI마다 마스크를 하나씩 더 그리면 되지 않나 — 문제는 그 RoI 특징이 **분류에는 충분해도 픽셀 정렬에는 전혀 충분하지 않았다**는 점이다.',

ideas:[
 {h:'RoIAlign: 반올림을 없앤다',
  lead:'좌표를 반올림하지 않고 bilinear 보간으로 RoI 특징을 정확히 읽는다.',
  d:'RoIPool은 실수 좌표의 RoI를 feature map 격자에 맞추려고 두 번 반올림한다 — 한 번은 RoI 경계를, 한 번은 bin 분할을. stride 16이나 32인 층에서 이 반올림은 **원본 이미지 기준 수십 픽셀의 어긋남**이 된다. 분류는 조금 흔들려도 맞히지만 마스크는 그 어긋남이 그대로 경계 오류가 된다. RoIAlign은 **어떤 반올림도 하지 않고**, 각 bin 안에 규칙적으로 잡은 샘플 점 4개에서 bilinear interpolation으로 값을 읽어 평균한다. 코드 한 줄 수준의 변경인데 마스크 AP가 크게 뛴다.'},
 {h:'마스크와 클래스를 분리한다 (sigmoid, softmax 아님)',
  lead:'클래스별 이진 마스크를 sigmoid로 독립 예측해 클래스 간 경쟁을 없앤다.',
  d:'FCN은 픽셀마다 클래스를 softmax로 고르기 때문에 클래스들이 서로 경쟁한다. Mask R-CNN은 클래스 결정을 이미 분류 브랜치가 했으므로, 마스크 브랜치는 **클래스마다 독립적인 이진 마스크 $K$ 장**을 sigmoid로 내고 분류 결과가 가리키는 $k$번째 것만 손실에 쓴다. 마스크끼리 경쟁이 사라지는 이 "decoupling"이 성능의 큰 몫을 차지한다.'},
 {h:'브랜치는 병렬, 손실은 덧셈',
  lead:'세 손실을 단순히 더해 마스크 학습이 박스 정확도를 방해하지 않게 한다.',
  d:'`L = L_cls + L_box + L_mask` 로 세 손실을 그냥 더한다. 마스크 브랜치는 분류·박스 브랜치와 **직렬이 아니라 병렬**이라, 마스크를 위해 박스 정확도를 희생하지 않는다. 오히려 마스크 학습이 특징을 공유하는 백본을 도와 박스 AP도 함께 오른다. 구조가 단순해서 [FPN](#/p/fpn), ResNeXt 등 백본을 그대로 갈아끼울 수 있다.'},
 {h:'마스크 브랜치는 작은 FCN이다',
  lead:'fc 대신 작은 완전합성곱망을 써서 공간 구조를 유지한 채 마스크를 그린다.',
  d:'RoI 특징에 fc를 붙여 벡터로 눌러버리면 공간 정보가 사라진다. 대신 작은 완전 합성곱 네트워크를 붙여 $m \\times m$ (FPN 헤드 기준 $28 \\times 28$) 해상도의 마스크를 **공간 구조를 유지한 채** 예측한다. 해상도가 낮아 세밀한 경계는 뭉개지지만, 파라미터가 적고 RoIAlign 덕에 위치가 정확해서 실용적으로 충분했다.'},
 {h:'같은 프레임으로 키포인트까지',
  lead:'키포인트를 원-핫 위치 맵으로 표현해 마스크와 같은 틀로 학습한다.',
  d:'마스크를 "$K$개의 이진 맵"으로 본다면, 사람 관절 하나를 "정답 위치 한 픽셀만 1인 원-핫 맵"으로 보면 그대로 키포인트 추정이 된다. 관절 종류마다 맵 하나씩 두고 위치에 대한 cross-entropy로 학습하면 끝이다. 아키텍처를 바꾸지 않고 태스크만 갈아끼워 COCO 키포인트에서도 경쟁력 있는 결과를 냈다는 점이, 이 프레임이 일반적이라는 증거였다.'}
],

figures:[
 {f:'fig1-overview.png',
  cap:'왼쪽 이미지에서 RoIAlign으로 뽑아낸 RoI 특징(파란 격자)이 두 개의 conv를 거쳐 오른쪽 두 갈래로 갈라진다 — 위쪽 얇은 화살표는 class/box를 예측하는 기존 Faster R-CNN 경로, 아래쪽 conv 스택은 새로 추가된 마스크 브랜치로 각 사람의 실루엣(오른쪽 컬러 마스크)을 픽셀 단위로 낸다. 두 브랜치가 같은 RoI 특징에서 "병렬로" 갈라진다는 것이 이 그림의 핵심이며, 마스크가 클래스 예측에 의존하지 않는다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig3-roialign.png',
  cap:'점선 격자가 conv 특징 맵의 실제 셀, 굵은 실선 사각형이 RoI(2×2 bin 예시), 검은 점 4개가 각 bin 안의 샘플링 위치다. RoIPool과 달리 이 점들은 격자 칸에 딱 맞춰 반올림되지 않고 **소수점 좌표 그대로** 유지되며, 그 위치의 값은 주변 4개 격자점에서 양선형 보간(파란 화살표)으로 계산된다. "반올림이 전혀 없다"는 것이 RoIAlign과 RoIPool의 유일한 차이이자 mask 정확도를 크게 끌어올린 이유다.',
  src:'원문 Figure 3, p.3'}
],

quotes:[
 {t:'Mask R-CNN extends Faster R-CNN by adding a branch for predicting segmentation masks on each Region of Interest (RoI), in parallel with the existing branch for classification and bounding box regression.',
  src:'Section 1, p.1'}
],

diagram:{type:'compare', cap:'변경점은 사실상 두 가지 — RoIPool을 RoIAlign으로 바꾸고, 브랜치를 하나 병렬로 더한 것.',
 left:{t:'Faster R-CNN', items:[
  'RPN → RoIPool → 분류 + 박스 회귀',
  'RoI 경계와 bin을 정수로 두 번 반올림',
  '출력은 박스와 클래스뿐',
  '인스턴스 분할은 별도 파이프라인']},
 right:{t:'Mask R-CNN', items:[
  'RPN → RoIAlign → 분류 + 박스 + 마스크',
  '반올림 없음 · bilinear 샘플링',
  '클래스별 이진 마스크 K장 (sigmoid)',
  '마스크 브랜치를 키포인트로 교체 가능']}},

math:[
 {expr:'L = L_cls + L_box + L_mask',
  tex:'L = L_{\\text{cls}} + L_{\\text{box}} + L_{\\text{mask}}',
  d:'세 손실의 단순 합. $L_{mask}$ 는 정답 클래스 $k$ 에 해당하는 마스크에만 정의되는 **픽셀별 평균 이진 cross-entropy**다. 다른 $K-1$ 장은 손실에 기여하지 않으므로 클래스 간 경쟁이 생기지 않는다.'},
 {expr:'RoIAlign(x, y) = Σ_i w_i · f(⌊x_i⌋, ⌊y_i⌋)   (bilinear, 반올림 없음)',
  tex:'\\text{RoIAlign}(x,y) = \\sum_i w_i\\, f(x_i, y_i)',
  d:'bin 안의 고정된 샘플 점들에서 주변 4개 격자값을 bilinear로 보간해 읽고 평균(또는 max)한다. 결과가 좌표에 대해 **연속**이므로 gradient도 위치에 대해 자연스럽게 흐른다.'}
],

numbers:[
 {k:'COCO mask AP (test-dev)', v:'35.7', d:'ResNet-101-FPN. ResNeXt-101-FPN은 **37.1**'},
 {k:'RoIAlign 이득 (stride 32)', v:'+7.3 mask AP', d:'RoIPool 23.6 → RoIAlign 30.9. AP75는 **+10.5** (상대 50% 개선)'},
 {k:'RoIAlign 이득 (stride 16)', v:'+3.4 mask AP', d:'ResNet-50-C4에서 26.9 → 30.3, AP75는 +5.1'},
 {k:'sigmoid vs softmax', v:'+5.5 mask AP', d:'클래스별 이진 마스크로 분리했을 때의 이득 (24.8 → 30.3)'},
 {k:'키포인트 AP', v:'62.7 AP^kp', d:'ResNet-50-FPN. 마스크까지 함께 학습하면 63.1'},
 {k:'추론 속도', v:'5 fps · 195 ms/이미지', d:'ResNet-101-FPN · Nvidia Tesla M40 기준'}
],

impact:'인스턴스 분할이 **"탐지의 부가 출력"**으로 격하됐다. 그전까지 별도 연구 분야처럼 다뤄지던 문제가 기존 탐지기에 브랜치 하나 붙이면 되는 일이 되면서, 이후 몇 년간 COCO 인스턴스 분할 리더보드는 사실상 "어떤 백본을 Mask R-CNN에 꽂았는가"의 경쟁이 되었다. RoIAlign이 준 교훈은 더 넓게 퍼졌다 — **feature map과 원본 좌표계 사이의 정렬은 공짜가 아니며, 픽셀 단위 태스크에서는 그 오차가 지배적**이라는 것. Detectron / Detectron2 / mmdetection 같은 프레임워크가 이 구조를 기본 베이스라인으로 채택하면서, 산업 현장에서 "일단 Mask R-CNN부터 돌려본다"가 관행이 됐다.',

legacy:[
 '**RoIAlign은 표준 부품이 됐다** — 이후 RoI 기반 헤드를 쓰는 거의 모든 탐지·분할 모델이 RoIPool 대신 RoIAlign을 쓴다',
 '**panoptic segmentation의 출발점** — 이 논문의 인스턴스 브랜치와 [DeepLab](#/p/deeplab) 계열의 시맨틱 브랜치를 [FPN](#/p/fpn) 위에서 합치는 방향으로 이어졌다',
 '**"헤드를 바꾸면 태스크가 바뀐다"** — 마스크/키포인트를 같은 틀로 처리한 방식은 멀티태스크 비전 헤드 설계의 관용구가 됐다',
 '**쿼리 기반으로의 교체** — 이후 [DETR](#/p/detr)과 [SAM](#/p/sam)은 RoI·NMS 같은 수작업 부품 자체를 없애는 방향으로 갔고, Mask R-CNN은 그 비교 기준선 역할을 했다'
],

pitfalls:[
 '**RoIAlign이 "정확한 좌표 계산"의 전부는 아니다.** 구현마다 샘플 점 위치와 좌표 오프셋(`aligned` 플래그) 처리가 미묘하게 달라 재현 결과가 몇 AP 흔들린다. 프레임워크를 갈아탈 때 이 옵션을 확인하지 않으면 논문 수치가 안 나온다.',
 '**마스크는 $m \\times m$ 짜리를 박스 크기로 늘린 것이다.** 최종 마스크는 저해상도 마스크를 업샘플한 결과라 경계가 뭉툭하고, 큰 객체일수록 손해다. 세밀한 경계가 필요하면 별도 refinement가 필요하다.',
 '**박스가 틀리면 마스크는 회복 불가능하다.** 분할이 박스 안에서만 이뤄지므로 검출 실패가 곧 분할 실패다. 겹친 객체나 극단적 종횡비에서 이 의존성이 약점으로 드러난다.'
],

links:[
 {t:'arXiv 1703.06870 — Mask R-CNN', u:'https://arxiv.org/abs/1703.06870'},
 {t:'Detectron2 (공식 구현)', u:'https://github.com/facebookresearch/detectron2'}
]
});
