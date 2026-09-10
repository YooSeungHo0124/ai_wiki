WIKI.paper({
slug:'mmdetection',
venue:'arXiv 2019 (OpenMMLab)',
authors:'Chen, Wang, Pang et al. (Chinese University of Hong Kong · SenseTime Research 등)',
arxiv:'1906.07155',

tldr:'새 검출 알고리즘이 아니라 **검출기 툴박스이자 벤치마크 보고서**. [Faster R-CNN](#/p/faster-rcnn)부터 [Cascade R-CNN](#/p/cascade-rcnn)까지 서로 다른 논문의 검출기를 하나의 코드베이스·하나의 학습 조건에서 재구현해, 방법 간 비교가 처음으로 공정해졌다.',

context:'2019년 시점 객체 검출 연구는 논문마다 배치 크기·학습 스케줄·데이터 증강이 달라 표에 적힌 mAP만으로는 어느 아이디어가 진짜 기여인지 가리기 어려웠다. Detectron, maskrcnn-benchmark, SimpleDet 같은 코드베이스가 있었지만 각각 지원 모델이 제한적이고 프레임워크(Caffe2·PyTorch·MXNet)도 갈려 있었다. MMDet 팀은 2018 COCO Challenge 검출 트랙 우승 코드를 정리해 이 문제를 풀기로 했다 — **하나의 모듈 체계 위에 최대한 많은 검출기를 올리고, 같은 하이퍼파라미터로 다시 학습시켜 비교표를 새로 만든다.**',

ideas:[
 {h:'Backbone–Neck–DenseHead–RoIHead 4분할',
  lead:'모든 검출기를 네 가지 교체 가능한 모듈의 조합으로 추상화한다.',
  d:'이미지를 특징맵으로 바꾸는 backbone, backbone 출력을 정제하는 neck(예: [FPN](#/p/fpn)), 밀집 위치마다 예측하는 DenseHead(RPN·RetinaHead·FCOSHead), RoI별 예측을 만드는 RoIHead(BBoxHead·MaskHead)로 나눈다. single-stage는 backbone→neck→DenseHead로 끝나고, two-stage는 DenseHead(RPN)가 만든 후보를 RoIHead가 다시 분류·회귀한다. 새 논문 하나를 재현하는 일이 "새 모듈 하나 끼우기"로 축소된다.'},
 {h:'훅 기반 학습 파이프라인',
  lead:'학습 루프를 고정하고 before/after 시점마다 훅을 꽂아 확장한다.',
  d:'`before_train_epoch`, `after_train_iter`, `after_run` 같은 지정된 시점에 임의의 훅(로깅·체크포인트·학습률 갱신·검증)을 등록하는 구조로, 알고리즘이 달라져도 학습 루프 자체는 건드리지 않는다. 검출뿐 아니라 분류·분할에도 같은 파이프라인을 쓸 수 있게 설계했다.'},
 {h:'동일 조건 재현 — Detectron·maskrcnn-benchmark·SimpleDet과 정면 비교',
  lead:'같은 V100 노드에서 같은 코드를 최신으로 받아 성능·속도·메모리를 재측정한다.',
  d:'각 코드베이스의 model zoo 수치는 서로 다른 하드웨어·다른 시점 코드로 측정돼 신뢰하기 어렵다는 문제를 지적하고, 세 경쟁 코드베이스를 직접 pull해 동일 환경에서 다시 돌렸다. [Mask R-CNN](#/p/mask-rcnn)과 [RetinaNet은 Focal Loss](#/p/focal-loss) 계열을 대표로 삼아 학습 속도(iter/s)·추론 속도(fps)·GPU 메모리를 나란히 표로 냈다.'},
 {h:'하이퍼파라미터 재조사 — RPN 기본값이 최적이 아니었다',
  lead:'통일된 환경에서 손실 종류·정규화층·학습 스케일을 재검증해 최적값을 다시 찾는다.',
  d:'Smooth L1의 `beta`, RPN 앵커의 `allowed_border`, `neg_pos_ub` 같은 그동안 Detectron 기본값을 그대로 물려쓰던 하이퍼파라미터를 격자 탐색으로 재조사했다. `allowed_border`를 0에서 무한대로 바꾸는 것만으로 RPN Average Recall이 57.1%에서 57.7%로 올랐다 — 원 논문 저자들도 최적화하지 않았던 값이다.'},
 {h:'혼합정밀도·다중 노드 확장성 실측',
  lead:'FP16 학습과 8~64 GPU 분산 학습의 실제 이득을 직접 측정해 보여준다.',
  d:'FP16 학습이 배치 크기를 키울수록 메모리 절감폭이 커진다는 것(배치 12에서 FP32 대비 절반 가까이)과, 8→64 GPU로 늘려도 거의 선형에 가까운 속도 향상이 난다는 것을 실측으로 확인했다. 이런 공학적 사실은 개별 논문에서는 잘 보고되지 않는 정보다.'}
],

diagram:{type:'flow', cap:'모든 검출기가 공유하는 네 모듈. neck·head를 갈아끼우면 다른 논문의 검출기가 된다.',
 nodes:[
  {t:'Backbone', s:'ResNet/ResNeXt'},
  {t:'Neck', s:'FPN 등', acc:true, a:'특징 정제'},
  {t:'DenseHead', s:'RPN/RetinaHead'},
  {t:'RoIHead', s:'BBox/MaskHead'}
 ]},

numbers:[
 {k:'Mask R-CNN 학습 속도', v:'0.430 iter/s', d:'같은 V100에서 Detectron 0.744, maskrcnn-benchmark 0.436 — MMDetection이 더 느리지만 메모리는 3.8GB로 최소권'},
 {k:'Mask R-CNN 추론 속도', v:'10.8 fps', d:'같은 조건 maskrcnn-benchmark 12.1 fps, Detectron 8.1 fps, SimpleDet 8.8 fps'},
 {k:'Mask R-CNN box/mask AP', v:'37.4 / 34.3', d:'네 코드베이스 중 가장 낮은 GPU 메모리(3.8GB)로 달성한 수치, R-50-FPN·1x 스케줄'},
 {k:'RPN allowed_border 개선', v:'57.1% → 57.7% AR', d:'Detectron 기본값(0)을 무한대로 바꾸기만 한 결과, ResNet-50 RPN'},
 {k:'BN 설정 차이', v:'34.2 → 37.4 box AP', d:'통계 고정(eval=True)만 해도 통계 갱신(eval=False) 대비 +3.1%p — Mask R-CNN·1x'},
 {k:'8→64 GPU 확장', v:'선형에 근접', d:'Mask R-CNN 분산 학습, 학습률을 배치에 비례해 선형 조정했을 때'}
],

impact:'검출 연구가 "표에 적힌 숫자"에서 "재현 가능한 숫자"로 옮겨가는 계기가 됐다. 이후 [Cascade R-CNN](#/p/cascade-rcnn), [RetinaNet은 Focal Loss](#/p/focal-loss) 계열, anchor-free 검출기들이 모두 이 코드베이스 위에서 서로 비교되기 시작했고, 논문 저자들이 자기 모델을 MMDetection config로 공개하는 것이 관례가 됐다. OpenMMLab 생태계로 확장되어 포즈 추정([RTMPose](#/p/rtmpose))·분할·3D 검출까지 같은 모듈 철학을 물려받았다.',

legacy:[
 '**OpenMMLab 생태계로 확산** — 같은 backbone/neck/head 추상화가 MMSegmentation·MMPose([RTMPose](#/p/rtmpose))·MMDetection3D로 이어짐',
 '**config 파일이 논문의 사실상 부록** — 이후 검출 논문들이 MMDetection config를 첨부해 재현성을 보장하는 관행이 자리잡음',
 '**"동일 조건 재현" 문화 확산** — Detectron2 등 후속 툴박스도 같은 방식의 통일 벤치마크 표를 채택',
 '**하이퍼파라미터가 아이디어보다 클 수 있다는 경고** — `allowed_border` 하나로 AR이 흔들린 사례가, 이후 논문 리뷰에서 "공정 비교" 요구를 강화하는 근거로 자주 인용됨'
],

pitfalls:[
 '**이 논문의 mAP는 "그 알고리즘 원 논문의 최고 성능"이 아니다.** 통일된 1x/2x 스케줄·통일된 입력 해상도로 재학습한 값이라 원 논문 수치와 다를 수 있다(예: 표 10의 Faster R-CNN R-50 1x 36.4는 원 논문 저자 발표치와 다를 수 있음) — 비교의 공정성이 목적이지 최고 기록 경신이 목적이 아니다.',
 '**Table 2의 "메모리"를 코드베이스 간에 그대로 비교하면 안 된다.** MMDetection은 전체 GPU 중 최대값, maskrcnn-benchmark는 GPU 0 하나, SimpleDet은 `nvidia-smi` 값으로 측정 방식이 서로 다르다고 논문이 명시한다.',
 '**"MMDetection이 제일 빠르다"가 아니다.** Table 2에서 학습 iter/s는 Detectron·SimpleDet이 더 빠르고, MMDetection은 저메모리·범용성이 강점이지 절대 속도 1위가 아니다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'위: single-stage 검출기는 Backbone→Neck→DenseHead 한 줄로 끝난다. 아래: two-stage는 DenseHead(RPN)가 먼저 후보를 뽑고 RoIHead가 그 후보들을 다시 분류·회귀한다 — 화살표가 갈라지는 지점이 "후보 생성 후 재검토"라는 two-stage의 정의 그 자체다.',
  src:'원문 Figure 1, p.4'},
 {f:'fig3-benchmark.png',
  cap:'x축 fps(추론 속도), y축 mAP. 왼쪽이 box AP, 오른쪽이 mask AP. 같은 방법이라도 backbone 4종(ResNet-50/101, ResNeXt-32x4d/64x4d)에 따라 점 4개로 흩어진다 — 오른쪽 위로 갈수록 좋고, Cascade 계열이 속도를 내주고 정확도를 얻는 위치에 몰려 있는 것이 보인다.',
  src:'원문 Figure 3, p.5'}
],

quotes:[
 {t:'We believe this toolbox is by far the most complete detection toolbox.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1906.07155 — MMDetection', u:'https://arxiv.org/abs/1906.07155'},
 {t:'GitHub — open-mmlab/mmdetection', u:'https://github.com/open-mmlab/mmdetection'}
]
});
