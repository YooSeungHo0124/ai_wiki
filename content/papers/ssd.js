WIKI.paper({
slug:'ssd',
venue:'ECCV 2016',
authors:'Liu, Anguelov, Erhan, Szegedy, Reed, Fu, Berg (UNC Chapel Hill · Zoox · Google · U. Michigan)',
arxiv:'1512.02325',

tldr:'[YOLO](#/p/yolo)의 단일 단계 구조를 유지하면서, **여러 해상도의 특징 맵 각각에 default box를 깔아** 예측하도록 바꾼 탐지기. 300×300 입력으로 VOC 2007 74.3% mAP를 59 FPS에 냈다 — [Faster R-CNN](#/p/faster-rcnn)의 정확도(73.2%)를 처음으로 1-stage가 넘으면서 속도는 10배 이상 빨랐다.',

context:'2016년 초의 탐지 지형은 양극단이었다. 한쪽에는 정확하지만 5~7 fps에 머무는 [Faster R-CNN](#/p/faster-rcnn), 다른 쪽에는 45 fps로 달리지만 mAP가 10점 낮은 [YOLO](#/p/yolo)가 있었다. YOLO의 손실은 어디서 왔는가? 두 가지가 지목됐다 — (1) 7×7이라는 **거친 격자**와 셀당 박스 2개라는 제약 때문에 recall이 낮고, (2) 예측이 백본의 **가장 마지막 특징 맵 하나**에서만 나오기 때문에 그 맵의 receptive field에 맞지 않는 크기의 물체, 특히 작은 물체를 놓친다. 한편 CNN은 본래 층마다 다른 해상도의 특징 맵을 이미 만들고 있다 — conv4는 세밀하고 좁게, conv7 이후는 거칠고 넓게 본다. **이미 존재하는 이 계층을 왜 쓰지 않는가**가 SSD의 출발점이다.',

ideas:[
 {h:'Multi-scale feature map: 층마다 다른 크기의 물체를 맡는다',
  lead:'백본이 이미 만드는 여러 해상도 특징 맵 각각에 예측 head를 붙인다.',
  d:'VGG-16 백본의 conv4_3부터 뒤에 덧붙인 conv 층들까지, **해상도가 다른 6개의 특징 맵**(SSD300 기준 38×38, 19×19, 10×10, 5×5, 3×3, 1×1)에 각각 예측 head를 붙인다. 앞쪽 고해상도 맵이 작은 물체를, 뒤쪽 저해상도 맵이 큰 물체를 담당한다. 이미지 피라미드를 만들어 네트워크를 여러 번 돌리는 대신, **한 번의 forward에서 나오는 계층을 그대로 피라미드로 쓴다** — 추가 비용이 거의 없다.'},
 {h:'Default box: 특징 맵 셀마다 고정된 기준 상자들',
  lead:'특징 맵 셀마다 스케일이 다른 default box 여러 개를 미리 깐다.',
  d:'각 특징 맵 셀 위에 스케일·종횡비가 다른 default box(Faster R-CNN의 anchor와 같은 개념)를 여러 개 두고, 각 박스에 대해 **좌표 보정 4개 + 클래스 점수 (c+1)개**를 예측한다. 결정적인 차이는 default box가 **맵마다 다른 스케일**을 갖는다는 점이다 — 한 맵이 모든 크기를 감당하지 않는다. SSD300은 이렇게 이미지당 **8732개**의 박스를 낸다(SSD512는 24564개).'},
 {h:'예측이 완전 컨볼루션이다',
  lead:'FC 대신 3×3 conv 하나로 각 위치의 박스와 클래스를 바로 예측한다.',
  d:'YOLO v1은 마지막에 FC 층을 써서 7×7×30 텐서를 만들었지만, SSD의 head는 **3×3 컨볼루션 필터** 하나다. 특징 맵 위를 도는 작은 컨볼루션이 그 위치의 박스 보정과 클래스 점수를 바로 뱉는다. FC가 사라지면서 파라미터가 줄고, 입력 해상도를 300에서 512로 바꾸는 것도 구조 변경 없이 가능해진다.'},
 {h:'Hard negative mining으로 3:1을 맞춘다',
  lead:'매칭 실패 박스 중 손실이 큰 순으로 골라 배경:물체 비율을 3:1로 맞춘다.',
  d:'8732개 박스 중 물체와 매칭되는 것은 보통 수 개다. 그대로 학습하면 배경 손실이 압도한다. SSD는 매칭 실패한 박스들을 confidence loss가 높은 순으로 정렬해 **negative:positive = 3:1** 이 되도록만 남긴다. 이 단순한 샘플링이 학습을 안정시키고 수렴을 빠르게 만든다 — 같은 문제를 손실 함수 자체로 푼 것이 이듬해의 [Focal Loss](#/p/focal-loss)다.'},
 {h:'확대/축소 데이터 증강이 성능의 큰 몫을 차지한다',
  lead:'축소 후 캔버스에 붙이는 zoom-out 증강으로 작은 물체 샘플을 늘린다.',
  d:'원본, 랜덤 크롭(IoU 조건부), 그리고 **이미지를 축소해 평균값 캔버스에 붙이는 "zoom out"** 을 섞는다. 마지막 기법이 작은 물체 학습 샘플을 인위적으로 늘려 준다. 논문의 ablation에서 이 증강만으로 mAP가 수 점 오른다 — SSD 성능의 상당 부분은 아키텍처가 아니라 데이터 파이프라인에서 나온다.'}
],

figures:[
 {f:'fig2-ssd-yolo-comparison.png',
  cap:'위(SSD): VGG-16 뒤로 특징 맵이 38×38부터 1×1까지 점점 작아지며 이어지고, 그 각각에서 화살표가 갈라져 "Classifier: Conv" 박스로 향한다 — 예측이 한 군데가 아니라 여러 층에서 동시에 나온다. 아래(YOLO): 특징 맵이 7×7 하나로 좁아진 뒤 Fully Connected 두 개를 거쳐야 예측이 나온다. 오른쪽 수치 74.3mAP/59FPS 대 63.4mAP/45FPS가 그 구조 차이의 결과.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'Our approach, named SSD, discretizes the output space of bounding boxes into a set of default boxes over different aspect ratios and scales per feature map location.',
  src:'Abstract, p.1'}
],

diagram:{type:'stack', cap:'SSD300의 예측 소스. 아래(고해상도)가 작은 물체, 위(저해상도)가 큰 물체를 맡는다 — 별도 피라미드를 만들지 않고 백본의 계층을 그대로 쓴다.',
 layers:[
  {t:'conv4_3', s:'38×38 · box 4개/셀', acc:true, note:'← 작은 물체'},
  {t:'conv7 (fc7)', s:'19×19 · box 6개/셀'},
  {t:'conv8_2', s:'10×10 · box 6개/셀'},
  {t:'conv9_2', s:'5×5 · box 6개/셀'},
  {t:'conv10_2·11_2', s:'3×3·1×1 box 4개/셀', note:'← 큰 물체'},
  {t:'전체 예측', s:'8732 박스→NMS(0.45)'}
 ]},

math:[
 {expr:'s_k = s_min + (s_max − s_min)(k − 1)/(m − 1),   s_min = 0.2, s_max = 0.9',
  tex:'s_k = s_{min} + \\dfrac{(s_{max}-s_{min})(k-1)}{m-1}, \\quad s_{min}=0.2,\\ s_{max}=0.9',
  d:'$k$ 번째 예측 층이 담당하는 default box 스케일을 **선형으로 배분**한다. 즉 층의 깊이가 곧 물체 크기의 축이 된다. 종횡비는 {1, 2, 3, 1/2, 1/3}에 정사각형 하나를 더해 조합한다.'},
 {expr:'L = (1/N)( L_conf(x, c) + α L_loc(x, l, g) )',
  tex:'L = \\frac{1}{N}\\big(L_{conf}(x,c) + \\alpha\\, L_{loc}(x,l,g)\\big)',
  d:'매칭된 박스 수 $N$ 으로 정규화한 분류 + 위치 손실. 위치는 smooth L1, 분류는 softmax이며 $\\alpha = 1$. $N = 0$ 이면 손실을 0으로 둔다.'},
 {expr:'매칭: IoU(default box, GT) > 0.5 인 것 전부',
  tex:'\\text{IoU}(\\text{default box}, GT) > 0.5',
  d:'GT마다 최고 IoU default box 하나를 반드시 매칭시킨 뒤, 임계값 0.5를 넘는 것들도 **모두** positive로 추가한다. 하나만 고르지 않고 여러 개를 허용하는 이 완화가 학습을 쉽게 만든다.'}
],

numbers:[
 {k:'mAP · VOC 2007 (SSD300)', v:'74.3% @ 59 FPS', d:'Titan X. Faster R-CNN은 73.2% @ 7 FPS, YOLO는 63.4% @ 45 FPS'},
 {k:'mAP · VOC 2007 (SSD512)', v:'76.9% @ 22 FPS', d:'입력 해상도를 키우면 정확도가 오르고 속도가 절반 이하로'},
 {k:'COCO test-dev (SSD300)', v:'23.2% AP / 41.2% AP@0.5', d:'trainval35k 학습'},
 {k:'COCO test-dev (SSD512)', v:'26.8% AP / 46.5% AP@0.5', d:'Faster R-CNN을 두 기준 모두에서 앞선다'},
 {k:'default box 수', v:'8732 (SSD300) / 24564 (SSD512)', d:'YOLO v1의 98개와 대비된다'},
 {k:'NMS 비용', v:'~1.7 ms/이미지', d:'confidence 0.01로 걸러낸 뒤 클래스별 IoU 0.45로 억제, 상위 200개 유지'}
],

impact:'1-stage 탐지기가 "빠르지만 부정확한 대안"이 아니라 **기본 선택지**가 되는 전환점이었다. SSD가 보인 것은 두 가지다 — (1) 정확도 손실의 원인은 단일 단계 구조 자체가 아니라 **단일 스케일 예측**이었고, (2) 여러 해상도에서 예측하게 하면 제안 단계 없이도 2-stage 정확도에 도달한다. 이 논문 이후 "특징 맵 계층을 어떻게 예측에 쓸 것인가"가 탐지 설계의 중심 질문이 되었고, 곧바로 [FPN](#/p/fpn)이 그 질문의 더 나은 답을 내놓는다. 실무적으로도 SSD는 임베디드·모바일 탐지의 기본 골격이 되어, [MobileNet](#/p/mobilenet) 백본과 결합한 SSD-MobileNet이 수년간 온디바이스 탐지의 표준 조합으로 쓰였다.',

legacy:[
 '**얕은 층의 의미 부족 문제** — SSD의 conv4_3은 해상도는 높지만 의미 정보가 약하다. [FPN](#/p/fpn)이 top-down 경로로 깊은 층의 의미를 얕은 층에 되돌려주며 이 약점을 정면으로 고쳤다',
 '**불균형의 손실 함수 해법** — 8732개 박스가 만드는 극단적 배경 편중을 hard negative mining 대신 손실로 푼 [Focal Loss](#/p/focal-loss)/RetinaNet이 1-stage의 정확도 상한을 다시 올렸다',
 '**모바일 탐지의 표준 조합** — [MobileNet](#/p/mobilenet)·[EfficientNet](#/p/efficientnet) 계열 백본 + SSD head 구성이 온디바이스 탐지의 기본 레시피로 정착했다',
 '**multi-scale head의 보편화** — 여러 해상도에서 밀집 예측한다는 설계는 이후 YOLO v3 이후 버전을 포함해 사실상 모든 1-stage 탐지기가 채택했다'
],

pitfalls:[
 '**SSD는 여전히 작은 물체에 약하다.** 논문 스스로 인정하듯 Faster R-CNN이 두 번의 박스 정제를 거치는 것과 달리 SSD에는 특징 재추출 단계가 없고, 작은 물체를 담당하는 conv4_3은 의미 정보가 부족하다. COCO의 AP_small에서 격차가 두드러진다.',
 '**"multi-scale feature map = 특징 피라미드"가 아니다.** SSD는 각 층을 **독립적으로** 예측에 쓸 뿐 층 사이에 정보를 섞지 않는다. 깊은 층의 의미를 얕은 층으로 흘려보내는 것은 [FPN](#/p/fpn)의 기여이며, 둘을 같은 것으로 설명하는 경우가 흔하다.',
 '**59 FPS는 batch size 8, Titan X, cuDNN v4 기준 측정값이다.** 배치 1의 지연시간(latency)과 배치 처리량(throughput)은 다른 값이며, 실시간 여부를 판단할 때는 후자가 아니라 전자를 봐야 한다.'
],

links:[
 {t:'arXiv 1512.02325 — SSD: Single Shot MultiBox Detector', u:'https://arxiv.org/abs/1512.02325'},
 {t:'공식 Caffe 구현 (weiliu89/caffe, ssd 브랜치)', u:'https://github.com/weiliu89/caffe/tree/ssd'},
 {t:'ECCV 2016 논문 페이지 (Springer)', u:'https://link.springer.com/chapter/10.1007/978-3-319-46448-0_2'}
]
});
