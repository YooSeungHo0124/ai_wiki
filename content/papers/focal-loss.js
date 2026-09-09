WIKI.paper({
slug:'focal-loss',
venue:'ICCV 2017 (Best Student Paper)',
authors:'Tsung-Yi Lin, Priya Goyal, Ross Girshick, Kaiming He, Piotr Dollár (Facebook AI Research)',
arxiv:'1708.02002',

tldr:'1-stage 검출기가 2-stage에 정확도로 밀리던 이유가 구조가 아니라 **학습 중의 극단적인 전경–배경 클래스 불균형**임을 진단하고, cross entropy에 $(1-p_t)^\\gamma$ 한 항을 곱해 쉬운 배경 예제의 기여를 눌러버리는 것으로 해결한 논문. 이 손실로 학습한 단순한 검출기 RetinaNet이 속도는 1-stage를 유지하면서 당시 모든 2-stage 검출기를 앞질렀다.',

context:'2017년 검출 분야는 두 계열로 갈려 있었다. [Faster R-CNN](#/p/faster-rcnn) 계열의 2-stage는 RPN이 후보를 수천 개에서 **1~2천 개로 먼저 걸러낸 뒤** 분류기를 돌리고, 그 두 번째 단계에서도 미니배치의 전경:배경 비율을 1:3으로 맞추거나 OHEM으로 어려운 예제만 골라 쓴다. 반면 [YOLO](#/p/yolo)·[SSD](#/p/ssd) 같은 1-stage는 이미지 전체를 조밀하게 훑어 한 번에 예측하므로 훨씬 빠르지만, AP가 늘 몇 점 낮았다. 통념은 "덜 정교한 구조라서"였다. 이 논문은 그 통념을 뒤집는다 — 조밀한 샘플링은 이미지 한 장당 **약 10만 개의 후보 위치**를 만들고 그중 실제 물체는 많아야 수십 개다. 나머지 압도적 다수는 이미 쉽게 배경으로 맞히는 예제인데, 개당 손실이 아무리 작아도 **10만 개가 합쳐지면 전경 손실을 덮어버린다**. 즉 문제는 표현력이 아니라 gradient의 주인이 누구냐였다.',

ideas:[
 {h:'진단: 쉬운 음성 예제가 gradient를 삼킨다',
  lead:'개당 손실은 작아도 쉬운 배경이 압도적으로 많아 전경 손실을 덮어버린다.',
  d:'cross entropy $-\\log p_t$ 는 $p_t=0.9$ 처럼 이미 잘 맞힌 예제에도 0.1 정도의 손실을 남긴다. 개별로는 무시할 만하지만 이런 예제가 수만 개면 총합이 소수의 어려운 전경 예제를 압도한다. 논문은 이것을 "쉬운 음성이 학습을 지배한다"로 정식화하고, 클래스 가중치 $\\alpha$ 만으로는 **양성/음성 비율은 조절해도 쉬운/어려운 예제는 구분하지 못한다**는 점을 지적한다.'},
 {h:'Focal Loss: 확신도에 따라 손실을 스스로 깎는다',
  lead:'(1-p_t)^γ 항을 곱해 이미 잘 맞힌 예제의 손실을 스스로 줄인다.',
  d:'$FL(p_t) = -(1-p_t)^\\gamma \\log p_t$. 변조 계수 $(1-p_t)^\\gamma$ 는 예측이 틀렸을 때($p_t$ 작음) 1에 가까워 손실을 그대로 두고, 맞혔을 때($p_t$ 큼) 0으로 가서 손실을 지운다. $\\gamma=2$ 면 $p_t=0.9$ 인 예제의 손실은 CE 대비 **100배**, $p_t\\approx0.968$ 이면 **1000배** 작아진다. 별도의 샘플링 규칙이나 하드 예제 마이닝 없이, **손실 함수 자체가 매 스텝 자동으로 커리큘럼을 만든다**.'},
 {h:'α와 γ는 다른 축을 담당한다',
  lead:'α는 클래스 간 불균형을, γ는 예제 난이도 간 불균형을 따로 조절한다.',
  d:'실전 형태는 $\\alpha_t (1-p_t)^\\gamma \\log p_t$ 로 둘을 함께 쓴다. $\\alpha$ 는 양성/음성 **클래스 간** 가중치, $\\gamma$ 는 쉬운/어려운 **예제 간** 가중치다. 흥미롭게도 $\\gamma$ 를 키우면 최적 $\\alpha$ 는 약간 작아지는데, 이미 $\\gamma$ 가 음성 쪽 손실을 많이 깎아놨기 때문이다. 논문 최종값은 $\\gamma=2,\\ \\alpha=0.25$ 이고, $\\gamma \\in [0.5, 5]$ 범위에서 결과가 크게 흔들리지 않는다.'},
 {h:'RetinaNet: 손실을 증명하기 위한 일부러 단순한 검출기',
  lead:'특수한 구조 없이 ResNet+FPN에 단순 서브넷만 얹어 손실의 효과만 드러낸다.',
  d:'ResNet + [FPN](#/p/fpn) 백본에 P3~P7 피라미드를 두고, 각 위치마다 3 스케일 × 3 비율 = **9개 anchor**를 깐다. 그 위에 분류 서브넷과 박스 회귀 서브넷을 각각 4개의 3×3 conv로 붙인 게 전부다. 새 부품은 없다 — 논문의 주장은 "구조를 정교하게 만들 필요가 없었고, 손실만 고치면 됐다"이므로 검출기가 단순할수록 논거가 강해진다.'},
 {h:'prior 초기화: 학습 첫 스텝에서 발산하지 않게',
  lead:'분류기 bias를 π=0.01에 맞춰 초기화해 초반 손실 폭주를 막는다.',
  d:'분류 서브넷 마지막 conv의 bias를 $\\pi=0.01$ 에 해당하는 값으로 초기화한다. 이렇게 하지 않으면 초기에 모든 anchor가 물체일 확률 0.5를 내놓고, 10만 개 × 0.5의 거대한 손실이 첫 iteration에서 학습을 불안정하게 만든다. **손실 설계와 초기화가 한 세트**라는 점은 재구현할 때 자주 놓치는 부분이다.'}
],

figures:[
 {f:'fig1-loss-curve.png',
  cap:'x축은 정답 클래스에 대한 예측 확률 $p_t$(오른쪽으로 갈수록 "잘 맞춘" 쉬운 샘플), y축은 그 샘플이 학습에 기여하는 loss 값. 파란 선($\\gamma=0$)이 보통의 cross-entropy — $p_t=0.6$처럼 이미 잘 맞춘 샘플도 여전히 작지 않은 loss를 남긴다. $\\gamma$를 5까지 올린 초록 선은 같은 지점에서 loss가 거의 0으로 꺼진다. 즉 곡선이 오른쪽으로 갈수록 빨리 0에 붙을수록, 쉬운 배경 샘플이 학습을 덜 지배하게 된다는 뜻이다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'We discover that the extreme foreground-background class imbalance encountered during training of dense detectors is the central cause.',
  src:'Abstract, p.1'}
],

diagram:{type:'compare', cap:'같은 조밀 샘플링, 다른 손실. 문제는 검출기 구조가 아니라 누가 gradient를 차지하느냐였다.',
 left:{t:'기존: CE + 샘플링', items:[
  '후보 ~100k개 중 전경은 수십 개',
  '쉬운 배경의 작은 손실이 합쳐져 전경을 압도',
  'α 가중치 / 1:3 비율 / OHEM으로 우회',
  '샘플링 단계를 따로 관리해야 함',
  'ResNet-50-FPN 600px: AP 31.1']},
 right:{t:'Focal Loss 하나로', items:[
  '모든 anchor를 버리지 않고 그대로 학습',
  '잘 맞힌 예제의 손실을 자동으로 100~1000× 감쇠',
  '하드 예제 마이닝 불필요',
  'α=0.25, γ=2 하나로 끝',
  '같은 설정에서 AP 34.0 (+2.9)']}},

math:[
 {expr:'CE(p_t) = -log(p_t)',
  tex:'\\text{CE}(p_t) = -\\log(p_t)',
  d:'기준선. $p_t$ 는 정답 클래스에 대한 예측 확률이다. $p_t=0.9$ 여도 손실이 0.105 남는다는 점이 문제의 출발점.'},
 {expr:'FL(p_t) = -(1 - p_t)^γ · log(p_t)',
  tex:'\\text{FL}(p_t) = -(1-p_t)^{\\gamma}\\log(p_t)',
  d:'논문 전체가 이 한 줄이다. $\\gamma=0$ 이면 정확히 CE로 돌아간다. $\\gamma$ 가 커질수록 잘 맞힌 예제가 더 빨리 무시된다.'},
 {expr:'FL(p_t) = -α_t · (1 - p_t)^γ · log(p_t)',
  tex:'\\text{FL}(p_t) = -\\alpha_t (1-p_t)^{\\gamma}\\log(p_t)',
  d:'실제 구현에 쓰는 α-balanced 형태. $\\alpha_t$ 는 클래스 불균형, $(1-p_t)^\\gamma$ 는 난이도 불균형을 각각 담당한다.'}
],

numbers:[
 {k:'후보 위치 수', v:'약 100,000 / 이미지', d:'2-stage가 1~2천 개로 걸러낸 뒤 분류하는 것과의 결정적 차이'},
 {k:'γ = 2 감쇠율', v:'p_t=0.9 → 100×, p_t≈0.968 → 1000×', d:'CE 대비 손실이 줄어드는 배수'},
 {k:'최종 하이퍼파라미터', v:'γ = 2.0, α = 0.25', d:'γ가 커지면 최적 α는 작아진다'},
 {k:'ablation (ResNet-50-FPN, 600px)', v:'31.1 → 34.0 AP', d:'α-balanced CE 대비 focal loss가 **+2.9 AP**'},
 {k:'RetinaNet-101-800', v:'39.1 AP · 198ms', d:'COCO test-dev. 당시 모든 2-stage 검출기 상회'},
 {k:'anchor 구성', v:'9개/위치 (3 스케일 × 3 비율), P3~P7', d:'[FPN](#/p/fpn) 피라미드 5레벨'}
],

impact:'첫째, **1-stage와 2-stage의 정확도 격차가 구조적 한계가 아니라 학습 문제였음**이 밝혀지면서 이후 검출 연구의 무게중심이 조밀한 1-stage 쪽으로 완전히 이동했다. 둘째, RetinaNet은 "ResNet + FPN + 두 개의 서브넷 + focal loss"라는 **1-stage 검출기의 표준 레시피**가 되어 이후 수년간 새 논문의 기본 비교 대상이 되었다. 셋째, focal loss 자체가 검출을 벗어나 세그멘테이션·의료영상·이상탐지·불균형 분류 전반에서 기본 도구가 됐다 — 데이터가 한쪽으로 심하게 치우친 문제라면 일단 시도해보는 손실이 됐다. 넷째, "샘플링 규칙으로 우회하던 문제를 손실 함수 안으로 흡수한다"는 접근 자체가 하나의 설계 패턴이 됐다.',

legacy:[
 '**1-stage의 부활** — RetinaNet 이후 FCOS·CenterNet 등 anchor 없이도 조밀하게 예측하는 계열이 쏟아졌고, YOLO 후속 버전들도 불균형 대응 손실을 기본 탑재한다',
 '**anchor 자체를 지우는 방향** — anchor 9개와 NMS를 그대로 둔 채 손실만 고친 이 논문의 다음 수순이, 손수 만든 부품을 전부 제거한 [DETR](#/p/detr)의 집합 예측이다',
 '**불균형 손실의 일반화** — focal loss는 세그멘테이션([Mask R-CNN](#/p/mask-rcnn) 계열 후속), 의료영상, 롱테일 분류로 퍼졌고 Dice loss 등과 조합해 쓰는 것이 표준이 됐다',
 '**손실 설계라는 연구 축** — "구조를 바꾸기 전에 손실을 의심하라"는 문제 접근이 정착했고, IoU 계열 회귀 손실·품질 인식 손실 등 후속 연구를 촉발했다'
],

pitfalls:[
 '**"불균형이면 무조건 focal loss"는 아니다.** 라벨 노이즈가 있는 데이터에서는 $(1-p_t)^\\gamma$ 가 **잘못 라벨링된 예제를 "어려운 예제"로 오해해 더 크게 가중**한다. 노이즈가 심한 데이터셋에서 focal loss가 CE보다 나빠지는 사례가 흔하다.',
 '**γ만 켜고 bias 초기화를 빼면 학습이 초반에 터진다.** $\\pi=0.01$ prior 초기화는 옵션이 아니라 이 손실을 쓰기 위한 전제 조건에 가깝다.',
 '**손실 정규화 기준을 헷갈리기 쉽다.** 논문은 전체 anchor 수가 아니라 **할당된 전경 anchor 수로 나눈다**. 10만 개 전체로 나누면 손실 스케일이 수백 배 작아져 학습률이 사실상 0이 된다.'
],

links:[
 {t:'arXiv 1708.02002 — Focal Loss for Dense Object Detection', u:'https://arxiv.org/abs/1708.02002'},
 {t:'Detectron2 — RetinaNet 구현', u:'https://github.com/facebookresearch/detectron2'},
 {t:'torchvision.ops.sigmoid_focal_loss', u:'https://pytorch.org/vision/stable/generated/torchvision.ops.sigmoid_focal_loss.html'}
]
});
