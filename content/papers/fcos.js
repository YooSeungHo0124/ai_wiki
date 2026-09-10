WIKI.paper({
slug:'fcos',
venue:'ICCV 2019',
authors:'Tian, Shen, Chen, He (University of Adelaide)',
arxiv:'1904.01355',

tldr:'anchor box를 완전히 없앤 1단계 검출기. 각 픽셀 위치에서 직접 박스 경계까지의 거리를 회귀하고, "center-ness" 가지 하나로 화질 나쁜 예측을 억제해 anchor 기반 [Focal Loss](#/p/focal-loss)(RetinaNet)를 능가했다.',

context:'2019년 시점 주류 검출기 — [SSD](#/p/ssd), [Focal Loss](#/p/focal-loss)의 RetinaNet, [YOLOv3](#/p/yolov3), Faster R-CNN 계열 — 는 전부 미리 정의된 anchor box에 의존했다. anchor 방식은 세 가지 문제를 안고 있다. 첫째, anchor의 크기·비율·개수 같은 하이퍼파라미터가 성능에 최대 4% AP까지 영향을 준다. 둘째, 800px 입력 기준 [FPN](#/p/fpn) 하나에서만 18만 개 이상의 anchor를 깔아야 하고 그중 대부분이 negative라서 극심한 클래스 불균형이 생긴다. 셋째, 모든 anchor와 ground truth 사이 IoU를 계산하는 것 자체가 학습 시 상당한 연산 비용이다. FCOS는 시맨틱 분할처럼 **픽셀 단위로 직접 예측**하면 이 문제들이 애초에 생기지 않는다는 것을 보인다.',

ideas:[
 {h:'픽셀마다 (l,t,r,b) 4D 벡터를 직접 회귀',
  lead:'feature map의 각 위치가 ground truth 박스의 좌·상·우·하 경계까지 거리를 직접 예측한다.',
  d:'객체 내부에 속하는 모든 위치 $(x,y)$ 를 positive 샘플로 쓰고, 그 위치에서 박스의 네 변까지 거리 $t^*=(l^*,t^*,r^*,b^*)$ 를 regression target으로 삼는다. anchor와 ground truth의 IoU를 계산할 필요 자체가 사라지고, anchor 크기·비율·개수 같은 하이퍼파라미터도 전부 없어진다. 예측 벡터는 [YOLOv3](#/p/yolov3) 같은 anchor 9개 방식보다 **출력 변수 수가 9배 적다**.'},
 {h:'다중 레벨 FPN으로 두 가지 문제를 동시에 해결',
  lead:'P3~P7 다섯 레벨에 박스 크기별로 위치를 분산 배정해 recall 저하와 중첩 모호성을 줄인다.',
  d:'픽셀 단위 예측은 두 문제를 낳는다 — (1) 최종 feature map의 큰 stride 때문에 recall 상한(BPR)이 낮아질 수 있고, (2) 한 위치가 여러 ground truth 박스 안에 동시에 들어가면 어느 박스를 회귀해야 할지 모호하다. FCOS는 [FPN](#/p/fpn)의 P3~P7 다섯 레벨마다 회귀 대상 크기의 범위($m_{i-1}$~$m_i$)를 정해 큰 객체와 작은 객체를 서로 다른 레벨로 분산시킨다. 이 하나의 장치로 중첩 모호 샘플 비율이 23.16%에서 7.14%로 줄고, BPR도 anchor 기반 RetinaNet과 대등해진다.'},
 {h:'center-ness: 중심에서 먼 저품질 예측을 죽인다',
  lead:'위치가 박스 중심에서 얼마나 벗어났는지를 0~1로 예측해 분류 점수에 곱한다.',
  d:'객체 경계 근처의 위치도 여전히 positive로 학습되기 때문에, 박스 중심에서 멀리 떨어진 저품질 예측이 다수 나온다. FCOS는 분류·회귀와 별도로 한 층짜리 center-ness 가지를 두어 각 위치가 객체 중심에 얼마나 가까운지를 예측하고, 추론 시 이 값을 분류 점수에 곱해 NMS 전에 저품질 박스의 순위를 낮춘다. 회귀 벡터로부터 역산한 center-ness(center-ness†)를 쓰면 33.5 AP에 그치지만, 별도 가지를 학습시키면 37.1 AP로 뛴다 — 즉 **별도 가지가 필수**다.'},
 {h:'exp(six)로 회귀 범위를 스케일별로 자동 조정',
  lead:'고정된 exp(x) 대신 레벨마다 학습되는 스칼라 $s_i$ 를 곱해 회귀 값의 기저를 조절한다.',
  d:'회귀 타깃은 항상 양수라 $\\exp(x)$ 로 매핑해 값을 $(0,\\infty)$ 로 만드는데, 레벨마다 담당하는 객체 크기가 크게 다르므로 고정된 지수함수 하나로는 잘 맞지 않는다. 레벨별로 학습 가능한 스칼라 $s_i$ 를 곱해 $\\exp(s_i x)$ 를 쓰면 각 FPN 레벨이 자기 담당 크기 범위에 맞는 회귀 기저를 스스로 학습한다.'}
],

diagram:{type:'compare', cap:'anchor 기반 검출과 FCOS의 예측 방식 차이.',
 left:{t:'anchor 기반', items:['위치마다 anchor 9개 배치','anchor-GT IoU로 정답 라벨링','anchor 크기·비율 튜닝 필요','18만+ anchor, 극심한 불균형']},
 right:{t:'FCOS', items:['위치 자체가 학습 샘플','(l,t,r,b) 직접 회귀','center-ness로 저품질 억제','anchor 하이퍼파라미터 없음']}},

math:[
 {expr:'l* = x - x0, t* = y - y0, r* = x1 - x, b* = y1 - y',
  tex:'l^{*}=x-x_0^{(i)},\\quad t^{*}=y-y_0^{(i)},\\quad r^{*}=x_1^{(i)}-x,\\quad b^{*}=y_1^{(i)}-y',
  d:'위치 $(x,y)$ 에서 ground truth 박스의 좌상단 $(x_0,y_0)$·우하단 $(x_1,y_1)$ 까지 거리. 이 네 값이 그대로 회귀 목표가 된다.'},
 {expr:'centerness* = sqrt( min(l*,r*)/max(l*,r*) × min(t*,b*)/max(t*,b*) )',
  tex:'\\text{centerness}^{*}=\\sqrt{\\frac{\\min(l^{*},r^{*})}{\\max(l^{*},r^{*})}\\times\\frac{\\min(t^{*},b^{*})}{\\max(t^{*},b^{*})}}',
  d:'박스 중심일수록 1에 가깝고 경계에 가까울수록 0에 가까운 값. 좌우·상하 거리의 비대칭도를 기하평균으로 결합한다.'},
 {expr:'L = (1/Npos)·Σ Lcls + (λ/Npos)·Σ 1{c*>0}·Lreg',
  tex:'L(\\{p_{x,y}\\},\\{t_{x,y}\\})=\\frac{1}{N_{pos}}\\sum_{x,y}L_{cls}(p_{x,y},c^{*}_{x,y})+\\frac{\\lambda}{N_{pos}}\\sum_{x,y}\\mathbb{1}_{\\{c^{*}_{x,y}>0\\}}L_{reg}(t_{x,y},t^{*}_{x,y})',
  d:'분류 손실은 [Focal Loss](#/p/focal-loss), 회귀 손실은 IoU loss. positive 위치에서만 회귀 손실을 계산하고 $N_{pos}$ 로 정규화한다.'}
],

numbers:[
 {k:'COCO AP · ResNeXt-64x4d-101-FPN', v:'44.7', d:'개선판(center-sampling 등 포함), single-model single-scale'},
 {k:'COCO AP · ResNet-101-FPN', v:'41.5', d:'동일 백본 RetinaNet(39.1)보다 **+2.4** — 논문의 핵심 비교'},
 {k:'출력 변수 비율', v:'anchor 대비 1/9', d:'anchor 9개/위치(RetinaNet, Faster R-CNN) 대비 anchor-free라 출력 채널이 훨씬 적음'},
 {k:'중첩 모호 샘플', v:'23.16% → 7.14%', d:'FPN 없을 때 대비 다중레벨 FPN 적용 후 (실제 검출 결과 기준으로는 최종 1.5%만 영향)'},
 {k:'center-ness 유무 AP', v:'33.5 → 37.1', d:'별도 center-ness 가지 추가만으로 +3.6 AP (ablation, minival)'}
],

impact:'FCOS는 "anchor가 검출기 성공의 핵심"이라는 당시의 통념을 실험으로 뒤집었다. anchor 관련 하이퍼파라미터·IoU 계산·불균형 문제를 아예 없애면서도 동일 백본에서 RetinaNet보다 높은 AP를 냈다는 점이, 이후 1단계 검출기 설계의 기본값을 anchor-free 쪽으로 옮기는 데 결정적인 근거가 되었다. 구조가 시맨틱 분할의 FCN과 사실상 같아 다른 픽셀 단위 태스크(인스턴스 분할, 키포인트, 추적)로 이식하기도 쉬웠다.',

legacy:[
 '**anchor-free 1단계 검출기의 대표 기준선** — 이후 anchor-free 계열 논문들이 성능 비교의 표준 baseline으로 FCOS를 사용',
 '**center-ness의 재사용** — 저품질 예측을 억제하는 이 아이디어는 이후 다른 dense head 설계에도 흔히 차용됨',
 '**[CenterNet](#/p/centernet)과의 경쟁** — 같은 시기 등장한 중심점 히트맵 방식과 함께 "anchor 없이 어떻게 객체를 표현할까"라는 질문에 대한 두 가지 답으로 비교됨',
 '**산업 검출기 백본화** — 단순한 구조 덕에 FCOS 헤드가 이후 여러 상용 검출 파이프라인의 기본 헤드로 채택됨'
],

pitfalls:[
 '**"anchor가 완전히 사라졌다"고 해서 하이퍼파라미터가 전혀 없는 것은 아니다.** FPN 레벨별 회귀 범위 $m_i$ 는 여전히 수동으로 정한 값이며, 이 튜닝이 성능에 영향을 준다.',
 '**중첩 모호 샘플(23.16%)과 실제 성능 저하는 다른 수치다.** 논문은 다중레벨 FPN 적용 후 최종 검출 결과 중 모호 위치에서 나온 것은 1.5%뿐이라고 명시한다 — 앞 숫자만 인용하면 문제를 과장하게 된다.',
 '**center-ness를 회귀 벡터에서 역산해도 된다는 생각은 논문이 직접 반박한다.** Table 4에서 역산 방식(33.5 AP)은 별도 학습 가지(37.1 AP)보다 뚜렷이 나쁘다.'
],

figures:[
 {f:'fig1-ltrb-ambiguity.png',
  cap:'왼쪽: 한 위치(주황 점)에서 박스 네 변까지 거리 l·t·r·b를 직접 회귀. 오른쪽: 두 박스(주황·파랑)가 겹친 영역의 점은 어느 박스를 회귀해야 할지 모호한 사례 — 이 문제를 다중레벨 FPN으로 해결한다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-architecture.png',
  cap:'왼쪽 C3~C5가 백본, 중앙 P3~P7이 FPN 레벨. 오른쪽 확대도가 각 레벨이 공유하는 head 내부 — 분류·center-ness 가지가 같은 4개 conv 스택을 공유하다 마지막에 갈라지고, 회귀는 별도 스택.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'In contrast, our proposed detector FCOS is anchor box free, as well as proposal free.',
  src:'Abstract, p.1'},
 {t:'It is worth noting that FCOS has 9× fewer network output variables than the popular anchor-based detectors with 9 anchor boxes per location.',
  src:'Section 3.1, p.4'}
],

links:[
 {t:'arXiv 1904.01355 — FCOS: Fully Convolutional One-Stage Object Detection', u:'https://arxiv.org/abs/1904.01355'},
 {t:'공식 코드 (tianzhi0549/FCOS)', u:'https://github.com/tianzhi0549/FCOS'}
]
});
