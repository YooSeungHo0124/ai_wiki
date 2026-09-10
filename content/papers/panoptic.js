WIKI.paper({
slug:'panoptic',
venue:'CVPR 2019',
authors:'Kirillov et al. (FAIR · Heidelberg University)',
arxiv:'1801.00868',

tldr:'새 모델이 아니라 **새 과제와 지표를 정의**한 논문. 의미 분할(모든 픽셀에 클래스)과 인스턴스 분할(물체마다 개별 마스크)로 갈라져 있던 두 과제를 "픽셀마다 (클래스, 인스턴스 id)"라는 하나의 형식으로 통합하고, 그 성능을 재는 **panoptic quality(PQ)** 지표를 제안한다.',

context:'2019년 이전까지 의미 분할과 인스턴스 분할은 서로 다른 출력 형식·평가지표·전용 알고리즘을 가진 별개의 과제였다. 의미 분할은 [FCN](#/p/fcn) 계열로 모든 픽셀에 클래스를 매기지만 개별 물체를 구분하지 않고, 인스턴스 분할(예: [Mask R-CNN](#/p/mask-rcnn))은 물체마다 겹칠 수 있는 마스크와 신뢰도 점수를 내지만 배경(하늘·도로·잔디 같은 "stuff")은 다루지 않는다. 두 갈래를 한 시스템에 합쳐도 출력이 서로 모순될 수 있고, 통합된 결과를 잴 공용 지표가 없었다. 이 논문은 새 아키텍처를 제안하는 대신, **둘을 하나의 형식과 하나의 지표로 묶는** 작업을 한다.',

ideas:[
 {h:'thing과 stuff를 하나의 출력 형식으로 통합한다',
  lead:'모든 픽셀을 (semantic class, instance id) 쌍으로 표현해 물체와 배경을 한 틀에 담는다.',
  d:'과제 형식은 단순하다: L개의 의미 클래스 집합 $\\mathcal{L}$ 이 주어지면, 알고리즘은 모든 픽셀 $i$ 를 $(l_i, z_i) \\in \\mathcal{L} \\times \\mathbb{N}$ 에 대응시킨다. **thing**(사람·차처럼 셀 수 있는 물체) 클래스는 같은 $(l_i,z_i)$ 를 가진 픽셀들이 하나의 개체를 이루고, **stuff**(하늘·도로처럼 셀 수 없는 것) 클래스는 인스턴스 id가 무의미해서 같은 클래스의 모든 픽셀이 하나로 묶인다. 인스턴스 분할과 달리 **세그먼트 간 겹침을 허용하지 않는다** — 한 픽셀은 정확히 하나의 (클래스, 인스턴스)만 가진다.'},
 {h:'IoU > 0.5 매칭은 유일하게 정해진다(Theorem 1)',
  lead:'겹침이 없는 두 분할에서는 IoU 0.5 초과 매칭이 자동으로 유일해, 복잡한 매칭 알고리즘이 필요 없다.',
  d:'예측 세그먼트 $p_1, p_2$ 가 겹치지 않는다는 성질($p_1 \\cap p_2 = \\emptyset$)만으로 $\\text{IoU}(p_1,g)+\\text{IoU}(p_2,g) \\le 1$ 임을 보일 수 있다. 따라서 어떤 ground truth 세그먼트 $g$ 든 IoU가 0.5를 넘는 예측 세그먼트는 **최대 하나**뿐이다. 이 성질 덕분에 greedy든 최적 매칭이든 결과가 똑같아서, AP 계산에 쓰이는 것 같은 복잡한 매칭 최적화가 필요 없다.'},
 {h:'PQ = SQ × RQ로 분해되는 단일 지표',
  lead:'매칭된 쌍의 평균 IoU(SQ)와 검출 F1 점수(RQ)를 곱해 하나의 숫자로 만든다.',
  d:'매칭 결과로 나온 TP·FP·FN을 갖고 PQ를 계산한다. TP는 매칭된 쌍, FP는 매칭 안 된 예측, FN은 매칭 안 된 정답이다. 클래스별로 계산한 뒤 클래스 평균을 내어 클래스 불균형에 둔감하게 만든다. PQ는 SQ(segmentation quality, 매칭 쌍의 평균 IoU)와 RQ(recognition quality, 검출의 F1 점수)의 곱으로 분해되어 해석하기 쉽다 — 다만 SQ는 매칭된 것들에 대해서만 계산되므로 SQ와 RQ가 독립은 아니다.'},
 {h:'human consistency로 과제의 난이도를 가늠한다',
  lead:'같은 이미지를 서로 다른 사람이 라벨링했을 때의 PQ로 "사람도 완벽하지 않다"는 기준선을 만든다.',
  d:'Cityscapes·ADE20k·Mapillary Vistas에서 이미지 일부를 서로 다른 주석자가 각각 라벨링하게 해 사람 간 일치도(PQ)를 측정한다. 사람의 PQ도 100%가 아니며(Cityscapes 69.7, ADE20k 67.1, Vistas 57.5), 특히 작은 물체에서 RQ가 크게 떨어진다. 이는 뒤에서 머신 성능과 비교할 상한선 역할을 한다.'}
],

diagram:{type:'compare', cap:'같은 이미지에 대해 세 과제가 요구하는 출력이 어떻게 다른지, 그리고 panoptic이 그 둘을 어떻게 합치는지.',
 left:{t:'기존: 의미/인스턴스 분리', items:['의미분할: 클래스만, 개체 구분 없음','인스턴스분할: thing만, 마스크 겹침 허용','stuff/thing 각각 다른 지표']},
 right:{t:'Panoptic 통합', items:['모든 픽셀 = (클래스, 인스턴스 id)','겹침 없음 — 신뢰도 점수 불필요','stuff·thing 모두 PQ 하나로 평가']}
},

math:[
 {expr:'PQ = [ Σ_(p,g)∈TP IoU(p,g) ] / ( |TP| + 1/2|FP| + 1/2|FN| )',
  tex:'\\text{PQ} = \\frac{\\sum_{(p,g)\\in TP} \\text{IoU}(p,g)}{|TP| + \\tfrac{1}{2}|FP| + \\tfrac{1}{2}|FN|}',
  d:'분자는 매칭된 쌍들의 IoU 합, 분모는 매칭 개수에 미매칭 예측·정답을 절반 가중치로 더한 것. 매칭 안 된 세그먼트가 많을수록 분모가 커져 PQ가 낮아진다.'},
 {expr:'PQ = SQ × RQ = [ (1/|TP|)Σ IoU(p,g) ] × [ |TP| / (|TP|+1/2|FP|+1/2|FN|) ]',
  tex:'\\text{PQ} = \\underbrace{\\frac{1}{|TP|}\\sum_{(p,g)\\in TP}\\text{IoU}(p,g)}_{\\text{segmentation quality (SQ)}} \\times \\underbrace{\\frac{|TP|}{|TP|+\\tfrac12|FP|+\\tfrac12|FN|}}_{\\text{recognition quality (RQ)}}',
  d:'RQ는 검출에서 흔히 쓰는 F1 점수와 같은 형태다. SQ는 매칭된 것들만의 평균 IoU, RQ는 "얼마나 많이 올바르게 검출했는가"를 나타낸다.'}
],

numbers:[
 {k:'사람 간 일치 PQ · Cityscapes', v:'69.7% (SQ 84.2 · RQ 82.1)', d:'같은 이미지를 다른 주석자가 라벨링했을 때의 일치도'},
 {k:'사람 간 일치 PQ · ADE20k', v:'67.1% (SQ 85.8 · RQ 78.0)', d:'stuff/things로 나눠도 격차가 크지 않음(PQst 70.3 · PQth 65.9)'},
 {k:'사람 간 일치 PQ · Mapillary Vistas', v:'57.5% (SQ 79.5 · RQ 71.4)', d:'세 데이터셋 중 가장 낮음'},
 {k:'작은 물체의 인간 RQ', v:'Cityscapes 51.5%', d:'큰 물체(94.1%)와 큰 격차 — 작을수록 놓치기 쉽다는 것을 보여줌'},
 {k:'IoU 매칭 임계값', v:'> 0.5', d:'세그먼트 겹침 없음과 결합해 매칭을 수학적으로 유일하게 만드는 값(Theorem 1)'},
 {k:'평가 데이터셋', v:'Cityscapes(5000장) · ADE20k(25000+장) · Mapillary Vistas(25000장)', d:'셋 다 stuff·thing 주석을 모두 갖춰 새 데이터 수집 없이 바로 PS 평가에 쓸 수 있었음'}
],

impact:'새 신경망 구조를 제시하지 않았음에도, "분할이라는 과제를 어떻게 정의하고 잴 것인가"를 바꿔 이후 모든 통합 분할 연구의 출발점이 됐다. PQ는 지금도 Cityscapes·COCO panoptic 리더보드의 표준 지표이며, "stuff와 thing을 분리해서 각자 다른 지표로 재는" 관행 자체를 없앴다. 사람 간 일치도 실험은 이후 "이 과제에서 모델이 얼마나 사람에 가까운가"를 논할 때의 기준선을 제공했다.',

legacy:[
 '**[MaskFormer](#/p/maskformer)** — panoptic segmentation을 "클래스 있는 마스크 집합 예측"이라는 하나의 문제로 재정의해, 이 논문이 정의한 과제를 [DETR](#/p/detr) 스타일 쿼리 기반 모델로 직접 풀어낸다',
 '**Panoptic-DeepLab·Panoptic FPN 등** — [DeepLab](#/p/deeplab)·FCN 계열 분할기에 instance 분기를 더해 PQ로 평가하는 실무적 후속 모델들이 뒤따랐다',
 '**COCO/Cityscapes panoptic 트랙 신설** — 이 논문이 제안한 형식과 지표가 그대로 공식 리더보드 트랙으로 채택됐다',
 '**"과제 정의 논문"이라는 장르의 재확인** — 새 아키텍처 없이 형식·지표만으로 한 분야의 방향을 바꿀 수 있음을 보여, 이후 유사한 과제·벤치마크 정의 논문들의 참고가 됐다'
],

pitfalls:[
 '**이 논문은 방법론 논문이 아니다.** 저자들이 실험에 쓴 것도 기존 의미분할기+인스턴스분할기를 NMS 유사 휴리스틱으로 합친 baseline일 뿐, panoptic segmentation을 푸는 새 모델을 제안하지 않는다.',
 '**PQ = SQ × RQ지만 SQ와 RQ는 독립이 아니다.** SQ는 매칭된(TP) 세그먼트에 대해서만 계산되므로, RQ가 바뀌면 TP 집합이 바뀌어 SQ도 함께 변할 수 있다.',
 '**"instance segmentation 지표(AP)를 그대로 쓰면 된다"는 오해가 흔하다.** AP는 신뢰도 점수와 겹치는 마스크를 전제하지만, panoptic segmentation은 겹침이 없고 신뢰도 점수도 요구하지 않는 다른 형식이라 AP를 직접 적용할 수 없다.'
],

figures:[
 {f:'fig1-comparison.png',
  cap:'같은 거리 사진에 대해 세 형식을 나란히 비교. (b) 의미분할은 자동차들을 모두 같은 색(하나의 클래스)으로 칠해 개체 구분이 없다. (c) 인스턴스분할은 사람·차 각각을 박스+마스크로 구분하지만 하늘·잔디 같은 배경(stuff)이 검게 비어 있다. (d) panoptic은 (b)의 배경과 (c)의 개별 물체를 한 이미지에 합쳐, 빈 픽셀 없이 모든 곳에 (클래스,인스턴스)가 존재한다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-matching.png',
  cap:'Ground Truth(왼쪽)의 person 3개·dog 1개와 Prediction(오른쪽)의 person 2개를 색으로 매칭. 같은 색끼리 IoU>0.5로 매칭된 TP, 매칭 안 된 정답(작은 사람)이 FN, 매칭 안 된 예측(노란 점)이 FP — PQ 계산에 들어가는 TP/FP/FN 분류를 그림 하나로 보여준다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'We emphasize that panoptic segmentation is not a multitask problem but rather a single, unified view of image segmentation.',
  src:'Section 2, p.3'},
 {t:'The requirement that matches must have IoU greater than 0.5, which in turn yields the unique matching theorem, achieves two of our desired properties.',
  src:'Section 4.1, p.4'}
],

links:[
 {t:'arXiv 1801.00868 — Panoptic Segmentation', u:'https://arxiv.org/abs/1801.00868'},
 {t:'COCO Panoptic Segmentation 태스크', u:'https://cocodataset.org/#panoptic-2018'}
]
});
