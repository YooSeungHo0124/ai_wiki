WIKI.paper({
slug:'cutmix',
venue:'ICCV 2019',
authors:'Yun, Han, Oh, Yoo, Choe, Chun (Clova AI · NAVER/LINE · Yonsei)',
arxiv:'1905.04899',

tldr:'이미지를 지우는 대신 **다른 이미지의 조각을 잘라 붙이고, 라벨도 붙인 면적 비율만큼 섞는다.** [Cutout](#/p/cutout)의 정보 손실과 [mixup](#/p/mixup)의 부자연스러운 픽셀 혼합을 동시에 해결한다.',

context:'지역 드롭아웃 계열인 [Cutout](#/p/cutout)은 입력의 일부를 지워 모델이 덜 두드러진 특징까지 보게 만들지만, 지운 영역의 픽셀은 학습에서 완전히 버려진다. CNN은 원래 데이터에 굶주려 있는데, 학습 이미지의 일부를 매 스텝 검은 사각형으로 낭비하는 것은 비효율적이다. 반대로 [mixup](#/p/mixup)은 두 이미지를 픽셀 단위로 선형 보간해 정보를 버리지 않지만, 결과 이미지가 반투명하게 겹친 부자연스러운 형태가 되어 특히 물체 위치를 찾는 국소화(localization) 과제에는 잘 맞지 않는다. CutMix는 "정보를 버리지 않으면서도 지역 드롭아웃의 정규화 효과를 유지"하는 조합을 찾는다.',

ideas:[
 {h:'자르고 붙이기: 지우는 대신 다른 이미지로 채운다',
  lead:'지울 영역을 검게 칠하지 않고 다른 학습 이미지의 같은 위치 조각으로 대체한다.',
  d:'이미지 $x_A$ 에서 사각형 영역 하나를 골라 그 자리를 이미지 $x_B$ 의 동일 좌표 영역으로 덮어씌운다. 결과물은 여전히 자연스러운 사진처럼 보이면서도(픽셀이 흐릿하게 겹치지 않는다), 학습에 쓰이는 모든 픽셀이 어느 한쪽 클래스의 실제 정보를 담고 있어 **버려지는 픽셀이 없다.**'},
 {h:'라벨도 면적 비율로 섞는다',
  lead:'잘라 붙인 영역의 넓이 비율 λ만큼 두 클래스의 원-핫 라벨을 선형 결합한다.',
  d:'[mixup](#/p/mixup)처럼 $\\text{Beta}(\\alpha,\\alpha)$ 에서 뽑은 비율 λ로 라벨을 섞지만, 여기서는 λ가 실제로 잘라 붙인 사각형이 전체 이미지에서 차지하는 면적 비율과 일치한다. 즉 라벨이 "픽셀이 실제로 어느 클래스에서 왔는가"를 그대로 반영해, mixup의 임의적인 혼합 비율보다 라벨-입력 대응이 더 일관적이다.'},
 {h:'국소화 능력이 부산물로 따라온다',
  lead:'이미지 일부만 봐도 그 클래스를 맞혀야 해서, 모델이 물체 전체 영역으로 근거를 넓힌다.',
  d:'붙여넣은 조각만으로 해당 클래스를 판별해야 하므로, 모델은 가장 두드러진 한 부위(개의 얼굴 등)만 보고 판단하는 습관에서 벗어나 물체의 다른 부위(다리, 몸통)까지 근거로 쓰게 된다. 이 효과는 별도의 국소화 학습 신호 없이 분류 학습만으로 얻어지며, [Grad-CAM](#/p/grad-cam) 활성화 지도로 시각적으로 확인된다.'},
 {h:'추가 연산이 사실상 없다',
  lead:'좌표 하나를 뽑아 잘라 붙이는 것뿐이라 배치 생성 비용이 거의 늘지 않는다.',
  d:'mixup처럼 이미지 두 장을 섞으므로 배치 준비 과정에서 이미지 한 쌍을 더 불러오는 비용은 있지만, 실제 연산(자르고 붙이기)은 슬라이싱과 대입뿐이다. 저자들은 이 비용이 학습 전체 시간에 미치는 영향이 무시할 만하다고 보고한다.'}
],

diagram:{type:'compare', cap:'Mixup·Cutout·CutMix가 각각 이미지와 라벨을 어떻게 다루는지 비교.',
 left:{t:'Mixup / Cutout', items:['Mixup: 픽셀 선형 보간 → 부자연스러움','Cutout: 영역을 0으로 지움 → 정보 손실','국소화 성능 오히려 하락 가능']},
 right:{t:'CutMix', items:['다른 이미지 조각으로 대체 → 자연스러움','버려지는 픽셀 없음','라벨을 면적 비율로 정확히 혼합'], acc:true}},

math:[
 {expr:'x̃ = M ⊙ x_A + (1−M) ⊙ x_B,   ỹ = λ y_A + (1−λ) y_B,   λ = 잘라붙인 영역 넓이 비율',
  tex:'\\tilde{x} = M \\odot x_A + (\\mathbf{1}-M)\\odot x_B,\\qquad \\tilde{y} = \\lambda y_A + (1-\\lambda) y_B',
  d:'$M$ 은 붙여넣을 사각형 영역만 0(=$x_B$ 사용), 나머지는 1(=$x_A$ 유지)인 이진 마스크다. $\\lambda \\sim \\text{Beta}(\\alpha,\\alpha)$ 로 사각형의 넓이 비율을 정하고, 라벨은 그 비율 그대로 선형 결합한다. $\\lambda=1$ 이면 순수 $x_A$, $\\lambda=0$ 이면 순수 $x_B$ 로 mixup·Cutout을 극단값으로 포함하는 일반화다.'}
],

numbers:[
 {k:'ImageNet 분류 (ResNet-50)', v:'76.3% → 78.6%', d:'baseline 대비 **+2.3%p**, 같은 조건 mixup(+1.1%p)·Cutout(+0.8%p)보다 큼'},
 {k:'ImageNet 약지도 위치추정', v:'46.3% → 47.3%', d:'**+1.0%p** — mixup(−0.5%p)·Cutout(+0.4%p)은 이만큼 못 오르거나 오히려 하락'},
 {k:'Pascal VOC 검출 전이(mAP)', v:'75.6 → 76.7', d:'ImageNet으로 CutMix 사전학습 후 SSD 파인튜닝, **+1.1**'},
 {k:'PyramidNet-200 CIFAR-100', v:'16.45% → 14.47%', d:'top-1 오류율, ShakeDrop 포함 비교 기법 중 최저'},
 {k:'ResNeXt-101 ImageNet', v:'top-1 오류 21.40%', d:'Cutout·Mixup·Manifold Mixup보다 낮은 오류율로 신규 최저'}
],

impact:'CutMix는 "증강이 정확도만 올리는 게 아니라 국소화·강건성·OOD 탐지까지 함께 개선할 수 있다"는 것을 보였고, 이후 탐지·분할 모델의 학습 레시피에 거의 기본값으로 채택됐다. 특히 [YOLOv4](#/p/yolov4)가 CutMix를 학습 트릭 목록에 명시적으로 포함하면서 객체 탐지 커뮤니티로 빠르게 퍼졌다. "지우지 말고 채워라"는 원리는 이후 다양한 영역-교체형 증강 연구의 공통 출발점이 됐다.',

legacy:[
 '**[YOLOv4](#/p/yolov4)** 가 학습 트릭(bag of freebies) 중 하나로 CutMix를 채택하며 탐지 커뮤니티로 확산',
 '분류를 넘어 이미지 캡셔닝·전이학습 벤치마크에서도 CutMix로 사전학습한 백본이 일관되게 더 좋은 성능을 보임',
 '**"자르고 붙이기" 패러다임**이 이후 Mosaic 증강([YOLOv4](#/p/yolov4)) 등 여러 조각을 한 이미지에 합성하는 방식으로 확장',
 '모델의 과신(overconfidence)을 줄이고 OOD 탐지 성능을 개선한다는 관찰이 이후 캘리브레이션 연구에서 참조됨'
],

pitfalls:[
 '**Cutout과 CutMix를 함께 쓰면 항상 더 좋아지는 것은 아니다.** 논문 실험에서는 Cutout+Mixup 조합이 국소적으로 도움이 된 사례가 있었지만, 이는 특정 설정(라벨 스무딩 유무 등)에 따라 달라지는 부수 결과이지 일반 규칙이 아니다.',
 '**개선 폭이 항상 수 %p는 아니다.** ResNet-50 ImageNet 기준 +2.3%p는 비교적 큰 축에 속하고, 더 깊은 백본(ResNet-101, ResNeXt-101)에서는 +1.5~1.7%p 수준으로 줄어든다.',
 '**λ가 0 또는 1에 가까운 극단적인 경우** 사실상 원본 이미지 하나만 보는 것과 비슷해지므로, 실제 정규화 효과는 Beta 분포의 α 설정에 민감하다.'
],

figures:[
 {f:'fig1-compare.png', cap:'같은 원본(코기 사진)에 네 가지 방식을 적용한 결과. ResNet-50 원본, Mixup(반투명하게 겹침), Cutout(검게 지움), CutMix(고양이 조각을 붙여넣음)를 나란히 비교 — CutMix만 두 클래스 모두 자연스러운 픽셀로 남는다.', src:'원문 Table 1(이미지 비교 부분), p.1'}
],

quotes:[
 {t:'we propose the CutMix augmentation strategy: patches are cut and pasted among training images where the ground truth labels are also mixed proportionally to the area of the patches',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1905.04899 — CutMix', u:'https://arxiv.org/abs/1905.04899'},
 {t:'공식 코드 (clovaai/CutMix-PyTorch)', u:'https://github.com/clovaai/CutMix-PyTorch'}
]
});
