WIKI.paper({
slug:'imagenet-v2',
venue:'arXiv 2019 (ICML 2019 논의 포함)',
authors:'Recht, Roelofs, Schmidt, Shankar (UC Berkeley)',
arxiv:'1902.10811',

tldr:'[ImageNet](#/p/imagenet) 검증셋과 CIFAR-10 테스트셋을 **원래 데이터 수집 절차 그대로 새로 만들어** 기존 모델들을 재평가했더니, ImageNet에서 top-1 정확도가 11~14%p 떨어졌다. 하지만 모델 간 **순위는 거의 그대로 유지**됐고, 저자들은 이를 "과적합"이 아니라 원본과 새 테스트셋 사이의 **분포 차이(distribution gap)** 때문이라고 결론지었다.',

context:'2010년대 중반 [ImageNet](#/p/imagenet)은 거의 10년간 같은 검증셋으로 계속 재사용된 벤치마크였다. 같은 5만 장을 두고 수백 편의 논문이 하이퍼파라미터를 튜닝하고 architecture search를 돌렸으니, "test set에 암묵적으로 과적합된 것 아니냐"는 의심이 계속 제기됐다. 이 논문의 질문은 단순한 사고실험이다 — 원래 데이터 수집 절차를 **그대로 반복해서** 새 테스트셋을 만들면, 기존 모델들은 거기서도 원래 점수를 낼까? 만약 못 낸다면 그 이유가 test set 재사용에 의한 적응적 과적합(adaptive overfitting)인지, 아니면 두 데이터 분포 자체가 미묘하게 다른 것인지 구분해야 한다.',

ideas:[
 {h:'원본 파이프라인을 최대한 그대로 복제',
  lead:'Flickr 후보 풀 수집부터 MTurk 라벨링 UI까지 원본 ImageNet 절차를 그대로 재현했다.',
  d:'CIFAR-10과 ImageNet 모두, 새 이미지를 다른 데이터셋에서 가져오지 않고 원래 수집 절차를 반복했다. ImageNet의 경우 클래스별로 Flickr에서 후보 이미지를 모으고, 원본과 동일한 형식의 MTurk 작업(48장 그리드, 대상 클래스 정의와 위키백과 링크 제공)으로 사람이 검수하게 했다. 품질 관리를 위해 각 MTurk 작업에 원본 검증셋 이미지를 몰래 섞어 넣어 선택 빈도(selection frequency)를 비교할 수 있게 했다.'},
 {h:'정확도 하락: top-1 기준 11~14%p',
  lead:'모든 모델이 원본 대비 11~14%p 하락했고 이는 약 5년치 연구 진전에 해당한다.',
  d:'CIFAR-10에서는 하락폭이 3~15%p로 모델별 편차가 컸지만, ImageNet에서는 VGG·[ResNet](#/p/resnet) 계열이 11%p, 당시 최고 모델도 top-1에서 83%→72%로 11%p, top-5는 96%→90%로 6%p 떨어졌다. 저자들은 이 top-5 6%p 하락을 "ILSVRC 2014에서 2018 SOTA까지 약 5년간의 진전에 해당한다"고 환산해 그 크기를 강조한다.'},
 {h:'핵심 반전: 순위는 거의 안 바뀌었다',
  lead:'원본에서 정확도가 높은 모델은 새 테스트셋에서도 그대로 높다 — 적응적 과적합의 전형적 징후가 없다.',
  d:'적응적 과적합이 있었다면 최근 모델일수록(더 많이 튜닝됐을수록) 새 테스트셋에서 "수확체감"을 보여야 한다. 그런데 실제로는 그 반대다. original accuracy와 new accuracy를 회귀하면 기울기가 1보다 **크다**(ImageNet 1.11, CIFAR-10 1.69) — 즉 원본에서 1%p 잘하면 새 테스트셋에서는 그보다 더 잘한다. 모델 순위도 거의 그대로 보존된다. 저자들은 이것을 "수확체감이 아니라 그 반대"라며 적응적 과적합의 가장 위험한 형태를 배제하는 증거로 든다.'},
 {h:'MTurk 선택 빈도만 바꿔도 14%p 왔다갔다',
  lead:'같은 후보 풀에서 "쉬운" 이미지만 고르면 정확도가 오히려 오르고, "덜 확실한" 이미지를 섞으면 급락한다.',
  d:'저자들은 같은 Flickr 후보 풀에서 표본 추출 방식만 세 가지로 바꿔 데이터셋을 만들었다. `TopImages`(MTurk 선택 빈도가 가장 높은 이미지만)는 원본보다 오히려 +2.1%p, `Threshold0.7`(선택 빈도 0.7 이상)은 -3.2%p, `MatchedFrequency`(원본과 같은 선택 빈도 분포를 재현)는 -11.8%p였다. 세 데이터셋 모두 "정답이고 Flickr 출신이고 평균 70% 이상이 선택한" 이미지들인데도 이 정도 차이가 난다는 것은, 모델 정확도가 라벨링 파이프라인의 미세한 선택 기준에 그만큼 민감하다는 뜻이다.'},
 {h:'결론: 적응성이 아니라 분포 차이',
  lead:'수확체감이 없다는 사실 자체가 저자들이 분포 차이(distribution gap)를 주된 원인으로 꼽는 근거다.',
  d:'논문은 정확도 하락을 adaptivity gap(테스트셋에 맞춰 튜닝되며 생기는 과대추정)과 distribution gap(원본과 새 분포 자체의 차이)으로 분해한다. 수확체감이 관찰되지 않는다는 사실은 적응성 쪽 설명과 배치되므로, 저자들은 "결과가 distribution gap이 하락의 주된 원인이라는 쪽을 가리킨다"고 결론짓는다. 다만 이것이 모든 형태의 적응적 과적합을 배제한다는 뜻은 아니라고 명시적으로 못박는다 — 모든 모델에 **균등하게** 적용되는 형태의 적응성(예: 상수만큼의 일괄 하락)은 이 실험으로는 구분할 수 없다.'}
],

diagram:{type:'compare', cap:'같은 Flickr 후보 풀에서 MTurk 표본 추출 기준만 바꿔도 정확도가 14%p 갈린다(TopImages vs MatchedFrequency).',
 left:{t:'TopImages', items:['선택 빈도 최상위 10장/클래스','평균 선택빈도 0.93','원본 대비 +2.1%p']},
 right:{t:'MatchedFrequency', items:['원본과 동일한 빈도 분포 재현','평균 선택빈도 0.73','원본 대비 -11.8%p']}},

math:[
 {expr:'acc_new = 1.11 · acc_orig − 20.2%  (ImageNet, top-1)',
  tex:'\\text{acc}_{\\text{new}} = 1.11\\cdot \\text{acc}_{\\text{orig}} - 20.2\\%',
  d:'원본 정확도와 새 테스트셋 정확도의 선형 회귀식(부트스트랩 95% CI: 기울기 [1.07, 1.19]). 기울기가 1보다 크다는 것이 "수확체감 없음"의 수치적 증거다 — 원본에서 더 잘하는 모델일수록 새 테스트셋에서도 상대적으로 덜 떨어진다.'},
 {expr:'L_S(f) − L_D0(f) = (L_S − L_D) + (L_D − L_D0)  [adaptivity gap + distribution gap]',
  tex:'L_{S}(\\hat f) - L_{D\'}(\\hat f) = \\underbrace{(L_S(\\hat f) - L_D(\\hat f))}_{\\text{adaptivity gap}} + \\underbrace{(L_D(\\hat f) - L_{D\'}(\\hat f))}_{\\text{distribution gap}}',
  d:'원본 테스트셋 손실과 새 테스트셋 손실의 차이를, 모델이 테스트셋 $S$ 에 적응해 생기는 항과 원본 분포 $D$ 와 새 분포 $D\'$ 자체가 다른 항으로 분해한 것. 논문 5절의 핵심 틀.'}
],

numbers:[
 {k:'ImageNet top-1 정확도 하락', v:'11%p ~ 14%p', d:'모델군에 따라 편차 — VGG/[ResNet](#/p/resnet) 계열은 11%p, 최고 모델도 83%→72%'},
 {k:'CIFAR-10 정확도 하락', v:'3%p ~ 15%p', d:'ImageNet보다 편차가 크고, SOTA 모델은 3%p로 가장 견고'},
 {k:'ImageNet 선형회귀 기울기', v:'1.11 (CIFAR-10은 1.69)', d:'1보다 커서 "수확체감 없음" — 원본이 좋을수록 새 테스트셋에서도 상대적으로 덜 떨어짐'},
 {k:'TopImages vs MatchedFrequency 격차', v:'top-1 약 14%p, top-5 약 10%p', d:'같은 후보 풀·같은 정답인데 MTurk 표본 추출 기준만 다름'},
 {k:'top-5 6%p 하락의 환산', v:'약 5년치 연구 진전', d:'ILSVRC 2014(93% top-5) 대비 2018 SOTA의 개선폭과 맞먹는 손실'},
 {k:'원본 검증셋 평균 MTurk 선택빈도', v:'0.71', d:'저자들이 새로 만든 세 데이터셋(0.73~0.93)은 전부 이보다 "더 확실하게" 라벨링됨'}
],

impact:'이 논문은 "ImageNet이 과적합됐다"는 통념을 뒤집었다. 실험은 오히려 적응적 과적합의 가장 위험한 형태(수확체감)를 **관찰하지 못했다**는 증거를 제시하며, 벤치마크 재사용 자체보다 데이터셋 생성 파이프라인의 미세한 선택이 정확도에 훨씬 큰 영향을 준다는 점을 보였다. ImageNetV2가 이후 robustness 연구의 표준 held-out 셋으로 쓰이기 시작했고, "같은 벤치마크의 재현조차 이렇게 어렵다"는 사실은 벤치마크 설계·데이터 큐레이션 자체를 감사하는 흐름([Are We Done with ImageNet?](#/p/done-with-imagenet) 등)과 맞물렸다.',

legacy:[
 '**ImageNetV2가 robustness 표준 벤치마크로 정착** — 이후 distribution shift·OOD 연구에서 "ImageNet 정확도만으로는 부족하다"는 근거로 자주 인용됨',
 '**분포 차이 대 적응적 과적합 논쟁의 출발점** — 같은 저자 그룹의 후속 연구와 다른 벤치마크(CIFAR-10.1, [ImageNet 라벨 재검토](#/p/done-with-imagenet))로 이어지는 "벤치마크 감사" 계열의 초기 사례',
 '**[ImageNet 라벨 재검토](#/p/done-with-imagenet)와 문제의식은 같지만 접근이 다르다** — 이 논문은 새 테스트셋을 아예 다시 수집해 분포를 재현했고, ReaL 논문은 기존 검증셋 이미지의 라벨 자체를 다시 검증했다. 둘 다 "ImageNet 점수가 실제로 무엇을 재는가"라는 같은 질문을 서로 다른 각도에서 파고든 형제 연구다',
 '**MTurk 선택 빈도 실험이 데이터 큐레이션 난이도 연구의 참조점이 됨** — "라벨링 기준의 미세한 변화가 벤치마크 점수를 좌우한다"는 관찰이 이후 데이터셋 설계 논문들의 경고 사례로 인용됨'
],

pitfalls:[
 '**"모델들이 ImageNet에 과적합됐다"는 요약은 이 논문의 결론과 정반대다.** 실제 결론은 순위가 유지되고 수확체감이 없었다는 것이며, 저자들은 이를 적응적 과적합에 불리한 증거로 제시한다. 정확도 하락의 주된 설명은 distribution gap(분포 차이)이다.',
 '**"적응적 과적합을 완전히 배제했다"도 과장이다.** 저자들은 명시적으로 모든 모델에 균등하게 적용되는 형태의 적응성(constant offset)까지는 이 실험으로 구분할 수 없다고 밝힌다.',
 '**정확도 하락의 원인을 "어려운 이미지"로 단정하지만, 왜 어려운지는 이 논문에서 규명하지 못했다.** 저자들 스스로 물체 크기·필터·특이한 각도 등을 후보 가설로만 남기고 후속 연구 과제로 돌린다.'
],

figures:[
 {f:'fig1-scatter-imagenet.png',
  cap:'x축은 원본 ImageNet 검증셋 top-1 정확도, y축은 새로 만든 테스트셋(MatchedFrequency) top-1 정확도. 점선은 "하락 없음"을 뜻하는 y=x, 빨간 실선은 실측 선형회귀(기울기 1.11). 모든 점이 점선 아래(하락)에 있지만 회귀선을 따라 거의 일직선으로 늘어서 있다는 것이 "순위 보존"의 시각적 증거다.',
  src:'원문 Figure 1 (ImageNet 패널), p.2'}
],

quotes:[
 {t:'We evaluate a broad range of models and find accuracy drops of 3% - 15% on CIFAR-10 and 11% - 14% on ImageNet. However, accuracy gains on the original test sets translate to larger gains on the new test sets. Our results suggest that the accuracy drops are not caused by adaptivity, but by the models’ inability to generalize to slightly “harder” images than those found in the original test sets.',
  src:'Abstract, p.1'},
 {t:'The lack of diminishing returns in our experiments points towards the distribution gap as the primary reason for the accuracy drops.',
  src:'Section 5.2, p.11'}
],

links:[
 {t:'arXiv 1902.10811 — Do ImageNet Classifiers Generalize to ImageNet?', u:'https://arxiv.org/abs/1902.10811'},
 {t:'GitHub — ImageNetV2', u:'https://github.com/modestyachts/ImageNetV2'}
]
});
