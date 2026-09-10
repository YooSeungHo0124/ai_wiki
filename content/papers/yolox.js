WIKI.paper({
slug:'yolox',
venue:'arXiv 2021 (Megvii Technology)',
authors:'Zheng Ge, Songtao Liu, Feng Wang, Zeming Li, Jian Sun (Megvii Technology)',
arxiv:'2107.08430',

tldr:'YOLO 계열에 **앵커 제거·분리된 헤드(decoupled head)·SimOTA 라벨 할당**을 한꺼번에 이식해, YOLOv3를 47.3% AP까지, YOLOX-L을 68.9 FPS에서 50.0% AP까지 끌어올린 리포트다. "YOLO는 앵커·결합 헤드로 고정된 구조"라는 통념을 깨고 이후 YOLO 계열 전체를 anchor-free로 돌려놓았다.',

context:'2021년 시점 [YOLOv3](#/p/yolov3)의 후예인 YOLOv4·YOLOv5는 여전히 앵커 기반·결합 헤드(coupled head) 구조를 유지하고 있었다. 반면 학계에서는 이미 [FCOS](#/p/fcos) 같은 anchor-free 검출기, OTA류의 정교한 라벨 할당, end-to-end(NMS-free) 검출기가 각각 따로 발전해 있었는데, 이 성과들이 YOLO 계열에는 통합되지 않은 상태였다. 앵커 방식은 데이터셋마다 앵커 클러스터링을 다시 해야 하고, 헤드가 분류·회귀·앵커 개수만큼 예측을 늘려 엣지 기기의 NPU→CPU 전송 병목까지 만든다는 문제도 있었다. YOLOX의 질문은 단순하다 — **학계에서 이미 검증된 개선들을 YOLO에 그대로 옮기면 얼마나 좋아지는가?**',

ideas:[
 {h:'Anchor-free: 위치당 예측을 3개에서 1개로',
  lead:'앵커 3개 대신 grid당 좌상단 오프셋 2개 + 높이·너비 2개만 직접 예측한다.',
  d:'앵커 클러스터링·IoU 매칭 같은 휴리스틱을 없애고, 각 grid가 박스의 좌상단 오프셋과 높이·너비 4개 값만 직접 회귀하게 만들었다. `[FCOS](#/p/fcos)`가 먼저 증명한 anchor-free 방식을 YOLO 계열로 가져온 것이며, FCOS의 center sampling(중심 3×3을 양성으로 삼는 기법)도 그대로 채택했다. 이 변경만으로 예측 개수가 1/3로 줄고 파라미터·연산량도 소폭 감소한다.'},
 {h:'Decoupled head: 분류와 회귀를 다른 가지로',
  lead:'분류·회귀·IoU를 각각 별도 branch로 분리해 두 과제의 충돌을 없앤다.',
  d:'기존 YOLO 헤드는 1×1 conv 하나로 분류·박스·objectness를 한꺼번에 뽑는 결합(coupled) 구조였다. YOLOX는 FPN 특징을 1×1 conv로 256채널로 줄인 뒤, 3×3 conv 2개씩을 쓰는 분류 branch와 회귀 branch를 병렬로 둔다(회귀 branch에는 IoU branch가 추가로 붙는다). 분류는 "이게 무엇인가", 회귀는 "경계가 어디인가"로 필요한 특징이 근본적으로 달라 한 층에 욱여넣으면 서로 발목을 잡는데, 이를 분리하니 학습 수렴 속도와 최종 AP가 모두 좋아졌다.'},
 {h:'SimOTA: 매칭을 최적수송 문제로 풀되 근사한다',
  lead:'예측-GT 쌍의 cost를 계산해 GT별로 비용이 가장 낮은 top-k개를 동적으로 정답 삼는다.',
  d:'저자들의 이전 연구 OTA는 라벨 할당을 최적수송(Optimal Transport) 문제로 정식화해 Sinkhorn-Knopp 알고리즘으로 풀었지만, 300 epoch 학습에서 25%의 추가 학습 시간이 든다는 문제가 있었다. SimOTA는 같은 cost($L_{cls}+\\lambda L_{reg}$)를 쓰되, GT마다 cost가 가장 낮은 top-k개의 예측만 양성으로 고르는 근사 해법으로 바꿔 정확도는 거의 유지하면서 학습을 훨씬 가볍게 만든다. `k`는 GT마다 동적으로 정해진다(dynamic top-k).'},
 {h:'Multi positives: 중심 하나가 아니라 3×3을 양성으로',
  lead:'GT당 중심 grid 1개만 쓰던 규칙을 버리고 중심 3×3 영역 전체를 양성 후보로 쓴다.',
  d:'YOLOv3와의 호환을 위해 처음엔 GT당 중심 위치 하나만 양성으로 삼았는데, 이는 다른 고품질 예측들을 그냥 버리는 셈이라 양성/음성 불균형을 키운다. FCOS의 "center sampling"처럼 중심 3×3 grid를 전부 양성 후보로 넣자 45.0% AP까지 올랐다(SimOTA 적용 전 기준).'}
],

diagram:{type:'compare', cap:'YOLOv3~v5의 결합 헤드(위)와 YOLOX의 분리된 헤드(아래). 분류·회귀·IoU가 서로 다른 conv 가지를 탄다.',
 left:{t:'결합 헤드 (YOLOv3~v5)', items:['1×1 conv 하나로 끝','분류+박스+obj 한 텐서','수렴 느림 · AP 낮음']},
 right:{t:'분리된 헤드 (YOLOX)', items:['분류·회귀 별도 3×3×2 가지','회귀 가지에 IoU branch 추가','수렴 빠름 · +1.1% AP']}},

math:[
 {expr:'c_ij = L_cls(i,j) + λ · L_reg(i,j)',
  tex:'c_{ij}=L_{ij}^{cls}+\\lambda L_{ij}^{reg}',
  d:'SimOTA의 매칭 비용. GT $g_i$ 와 예측 $p_j$ 사이의 분류 손실과 회귀 손실을 $\\lambda$ 로 가중합해, "이 예측을 이 GT의 정답으로 쓰면 얼마나 손해인가"를 하나의 스칼라로 만든다. 각 GT는 중심 부근 후보 중 cost가 가장 낮은 top-k개를 양성으로 가져간다.'}
],

numbers:[
 {k:'YOLOv3 → YOLOX 개선폭', v:'38.5% → 47.3% AP', d:'같은 YOLOv3-SPP 백본에서 decoupled head(+1.1) · 강한 증강(+2.4) · anchor-free(+0.9) · multi positives(+2.1) · SimOTA(+2.3)를 누적한 결과 (COCO val, 640×640, FP16, batch=1, Tesla V100)'},
 {k:'YOLOX-L (COCO test-dev)', v:'50.0% AP · 68.9 FPS', d:'파라미터 규모가 비슷한 YOLOv5-L(48.2% AP)보다 +1.8% AP, V100·FP16·batch=1 기준'},
 {k:'YOLOX-X (COCO test-dev)', v:'51.2% AP · 57.8 FPS', d:'YOLOX 계열 최상위 모델, 300 epoch 학습'},
 {k:'YOLOX-Nano', v:'25.3% AP · 0.91M 파라미터 · 1.08G FLOPs', d:'NanoDet 대비 +1.8% AP, 초경량 모바일 모델'},
 {k:'SimOTA의 단독 기여', v:'45.0% → 47.3% AP (+2.3)', d:'multi positives까지만 적용한 상태 대비 SimOTA 추가분, ultralytics-YOLOv3(44.3%) 대비 +3.0% AP'},
 {k:'End-to-end(NMS-free) 옵션', v:'47.3% → 46.5% AP (-0.8)', d:'추가 conv 2개 + one-to-one 할당을 붙이면 AP가 떨어지고 지연도 11.1ms→13.5ms로 늘어 최종 모델에는 채택하지 않음'}
],

impact:'YOLOX 이후 "YOLO = 앵커 기반·결합 헤드"라는 공식이 깨졌다. anchor-free와 decoupled head는 이후 YOLO 계열의 사실상 표준 구성이 되어, `[YOLOv7](#/p/yolov7)` 등 후속 모델들이 이를 이어받거나 비교 기준으로 삼았다. SimOTA가 보여준 "동적 top-k 매칭"이라는 아이디어도 이후 라벨 할당 연구의 공통 어휘가 됐다. 또한 ONNX·TensorRT·NCNN·OpenVINO 배포 버전을 함께 공개해 산업 현장에서 가장 널리 쓰이는 실시간 검출기 중 하나가 되었다.',

legacy:[
 '**anchor-free가 YOLO 계열의 기본값이 됨** — 이후 YOLO 계열 다수가 앵커 클러스터링 없이 grid 좌표 회귀 방식을 채택',
 '**동적 라벨 할당의 확산** — SimOTA류의 "GT마다 cost 기준 top-k" 방식이 이후 검출기 라벨 할당의 표준 패턴 중 하나로 자리잡음',
 '**decoupled head가 표준 구성으로 정착** — 분류·회귀 분리가 이후 실시간 검출기 설계에서 기본 선택지가 됨',
 '**end-to-end(NMS-free) 방향은 미완으로 남김** — YOLOX 자체는 NMS-free를 옵션으로만 실험했고 채택하지 않아, 이후 `[RT-DETR](#/p/rt-detr)` 등 DETR 계열이 NMS 제거를 본격적으로 밀어붙이는 계기가 됨'
],

pitfalls:[
 '**FPS·AP 비교는 항상 측정 조건을 같이 봐야 한다.** 이 논문의 수치는 전부 V100·FP16·batch=1·후처리 제외 기준이며, 배치 크기나 TensorRT 적용 여부가 다르면 순위가 뒤집힐 수 있다. 실제로 저자들도 YOLOv5-L을 640 해상도·FP16·batch=1로 재측정해 YOLOv4/v4-CSP와 조건을 맞췄다고 명시한다.',
 '**"anchor-free가 SimOTA보다 기여가 크다"는 오해.** 절제 표를 보면 anchor-free 단독 기여는 +0.9% AP에 불과하고, multi positives(+2.1%)와 SimOTA(+2.3%) 즉 **라벨 할당 개선**이 오히려 더 큰 폭을 차지한다.',
 '**end-to-end(NMS-free) 버전은 실제로 쓰이는 최종 모델이 아니다.** 논문 표에 등장하지만 AP가 0.8%p 떨어지고 느려져 "옵션 모듈"로만 남겼다 — 이 표를 보고 YOLOX가 NMS를 없앴다고 오해하면 안 된다.'
],

figures:[
 {f:'fig2-decoupled-head.png',
  cap:'위: 기존 YOLOv3~v5의 결합 헤드 — 1×1 conv 하나가 분류·박스·objectness를 한 텐서로 뭉쳐 낸다. 아래: YOLOX의 분리된 헤드 — FPN 특징을 256채널로 줄인 뒤 분류 가지(위)와 회귀+IoU 가지(아래)가 각각 3×3 conv 2개를 거쳐 독립적으로 예측한다.',
  src:'원문 Figure 2, p.3'},
 {f:'fig1-speed-accuracy.png',
  cap:'왼쪽: V100 batch=1 지연시간 대비 COCO AP. YOLOX-L(빨간 원)이 같은 지연시간대에서 YOLOv5-L(연두 원)보다 위쪽에 위치해 더 높은 AP를 낸다. 오른쪽: 모바일급 경량 모델의 파라미터 수 대비 AP — YOLOX-Nano·YOLOX-Tiny가 NanoDet·EfficientDet-Lite 계열보다 좌상단(적은 파라미터·높은 AP)에 위치한다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'We switch the YOLO detector to an anchor-free manner and conduct other advanced detection techniques, i.e., a decoupled head and the leading label assignment strategy SimOTA to achieve state-of-the-art results across a large scale range of models.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2107.08430 — YOLOX: Exceeding YOLO Series in 2021', u:'https://arxiv.org/abs/2107.08430'},
 {t:'Megvii-BaseDetection/YOLOX (공식 코드)', u:'https://github.com/Megvii-BaseDetection/YOLOX'}
]
});
