WIKI.paper({
slug:'efficacy-kd',
venue:'arXiv 2019 (WACV 2020)',
authors:'Cho & Hariharan (Cornell)',
arxiv:'1910.01348',

tldr:'교사가 정확할수록 증류가 더 잘 될 거라는 가정을 CIFAR-10과 ImageNet에서 정면으로 반박한다. 교사가 커지고 정확해질수록 오히려 학생 성능이 **떨어지고**, ImageNet에서는 아예 어떤 교사를 써도 [scratch 학습](#/p/distillation)보다 못하다. 원인은 학생의 용량 부족이고, 처방은 교사 학습을 일찍 멈추는 것이다.',

context:'[Hinton의 증류](#/p/distillation)는 "soft target이 정보가 많으니 더 좋은 교사가 더 좋은 학생을 만든다"는 직관 위에 서 있었고, 실무에서도 큰 교사를 붙이면 당연히 이득이라고 가정해 왔다. 하지만 [teacher assistant 증류](#/p/teacher-assistant) 논문처럼 교사와 학생의 용량 차이가 너무 크면 증류가 실패한다는 산발적 보고가 있었고, Zagoruyko와 Komodakis는 ImageNet에서 attention transfer로도 증류가 잘 안 됐다고 언급한 바 있다. 이 논문은 이 실패들을 우연이 아니라 **체계적인 현상**으로 재현한다. 질문은 단순하다 — 교사 정확도와 학생 정확도 사이의 관계를 실제로 스캔해보면 무엇이 보이는가?',

ideas:[
 {h:'교사 정확도와 학생 정확도는 역U자 관계다',
  lead:'CIFAR-10에서 교사 깊이·너비를 늘리면 학생 정확도는 오르다가 다시 떨어진다.',
  d:'WideResNet과 DenseNet 학생을 고정하고 교사의 깊이(depth)와 너비(width)만 키워가며 증류했다. 교사 정확도는 계속 오르는데, 학생 오차는 어느 지점을 지나면 **다시 나빠진다**. 즉 "교사 정확도"는 좋은 증류의 대리 지표가 될 수 없다.'},
 {h:'ImageNet에서는 모든 교사가 손해다',
  lead:'ResNet18 학생에 ResNet18/34/50/152 교사를 붙여도 scratch(30.24%)보다 전부 나쁘다.',
  d:'ResNet18 학생 기준 scratch 오차가 30.24%인데, ResNet18·34·50 교사로 증류한 학생은 각각 30.57%, 30.79%, 30.95%로 **교사가 커질수록 더 나빠진다**. CIFAR가 아니라 ImageNet 같은 어려운 데이터셋에서 이 현상이 더 뚜렷하다.'},
 {h:'원인은 학생이 큰 교사를 못 따라간다는 것',
  lead:'KD error(학생·교사 예측 불일치 비율)가 가장 큰 교사에서 가장 높다.',
  d:'두 가설을 세운다 — (1) 학생이 교사를 잘 모방하지만 그게 정확도에 도움이 안 된다, (2) 학생이 애초에 교사를 모방하지 못한다. CIFAR-10의 KD error와 ImageNet의 KD loss를 재보면 **가장 큰 교사에서 이 값이 가장 크다** — 학생이 그 교사를 못 따라간다는 뜻이고, 이는 두 번째 가설, 즉 **용량 불일치**를 가리킨다.'},
 {h:'학습 후반부에 증류가 오히려 해를 끼친다',
  lead:'초반엔 KD가 도움되지만 학습이 진행될수록 정확도를 갉아먹는다.',
  d:'ResNet34 교사로 ResNet18을 증류하며 에폭별 검증 오차를 scratch와 비교하면, 초반 30에폭 정도는 KD가 확실히 앞서다가 이후 **역전되어 KD 쪽이 더 나빠진다**. 저자들은 어려운 데이터셋에서 저용량 학생이 KD 손실과 교차엔트로피 손실을 동시에 최소화할 여력이 없어, 학습 후반에 KD 손실 쪽으로 과적합되며 분류 손실을 희생시킨다고 해석한다.'},
 {h:'처방: 교사와 증류를 둘 다 일찍 멈춘다 (ESKD)',
  lead:'증류를 학습 중간에 끊고 남은 구간은 교차엔트로피만으로 학습한다.',
  d:'"Early-Stopped KD"(ESKD)는 표준 Full KD 대신, 어느 지점부터 KD 손실을 끄고 정답 레이블만으로 마저 학습한다. ImageNet에서 ResNet18·34·50을 교사로 쓴 세 경우 모두 ESKD가 Full KD보다 낫고, 심지어 scratch(30.24%)보다도 낫다 — ResNet18 교사 ESKD는 29.01%까지 내려간다. 다만 ESKD도 "교사가 커질수록 학생이 나빠진다"는 근본 경향 자체를 뒤집지는 못한다.'}
],

diagram:{type:'compare', cap:'통념(교사가 크고 정확할수록 좋다)과 이 논문의 관찰이 정확히 반대다.',
 left:{t:'통념: 큰 교사 = 좋은 증류', items:['교사 정확도 ↑ → 학생 정확도 ↑','soft target 정보량이 핵심 변수','증류는 항상 도움이 됨']},
 right:{t:'관찰: 용량 불일치가 핵심', items:['교사 ↑ → 학생 ↓ (역U자)','KD error가 큰 교사에서 급증','ImageNet: 전 교사가 scratch보다 나쁨']}
},

math:[
 {expr:'L = α·L_cls + (1-α)·L_KD,   L_KD = -τ² Σ p̃ᵗ log p̃ˢ',
  tex:'L=\\alpha L_{cls}+(1-\\alpha)L_{KD},\\quad L_{KD}=-\\tau^{2}\\sum_{k}\\tilde p^{t}_{k}\\log \\tilde p^{s}_{k}',
  d:'[Hinton의 증류](#/p/distillation)와 동일한 손실. 이 논문의 기여는 손실 식이 아니라, 이 손실을 교사 용량을 바꿔가며 스캔했을 때 나오는 실험 곡선이다.'}
],

numbers:[
 {k:'CIFAR-10 교사 스캔', v:'역U자', d:'깊이·너비 증가 시 학생 오차가 오르다 다시 내려가는 게 아니라 **내려가다 다시 오름**(그림 참조)'},
 {k:'ImageNet scratch', v:'30.24%', d:'ResNet18을 교사 없이 학습했을 때의 top-1 오차 (기준선)'},
 {k:'ImageNet Full KD (ResNet50 교사)', v:'30.95%', d:'가장 큰 교사를 썼을 때 오차가 가장 큼 — scratch보다도 나쁨'},
 {k:'ImageNet ESKD (ResNet18 교사)', v:'29.01%', d:'조기 종료 증류가 scratch·Full KD를 모두 앞지른 유일한 처방'},
 {k:'KD error · WRN28-1 학생', v:'0.23~0.31% (train)', d:'교사가 커져도 학습 데이터에서는 거의 못 맞추는 게 아니라 오히려 낮음 — 문제는 test 쪽 KD error(4.05→4.81%)'}
],

impact:'"증류는 교사가 좋을수록 좋다"는 암묵적 전제를 실험으로 무너뜨렸다. 이후 연구들이 교사-학생 용량 차이를 직접 다루는 [teacher assistant 증류](#/p/teacher-assistant)나 커리큘럼식 접근으로 이어졌고, 조기 종료라는 값싼 처방은 실무에서 바로 쓸 수 있는 규칙으로 자리잡았다. 무엇보다 "증류 논문의 벤치마크는 교사·학생 조합 하나만으로는 부족하다"는 방법론적 기준을 세웠다.',

legacy:[
 '[teacher assistant 증류](#/p/teacher-assistant) — 교사와 학생 사이에 중간 크기 모델을 끼워 용량 격차를 완화',
 '[Does KD Really Work?](#/p/does-kd-work) — 용량이 충분해도 왜 학생이 교사를 못 닮는지, 최적화 관점에서 후속 규명',
 '[patient-consistent](#/p/patient-consistent) — 오래·일관되게 학습하면 큰 교사도 문제없이 증류된다는 반례를 제시하며 이 논문의 결론에 조건을 덧붙임'
],

pitfalls:[
 '**"교사가 학생보다 항상 정확하면 된다"는 착각.** 절대적 정확도 격차가 아니라 학생이 그 교사의 결정 함수를 **표현할 수 있는 용량**을 가졌는지가 핵심이다.',
 '**ESKD가 근본 원인을 없애는 게 아니다.** 학습 후반의 손실 트레이드오프를 피하는 처방일 뿐, 교사가 극단적으로 크면 여전히 학생이 못 따라간다.',
 '**이 논문의 결론이 모든 설정에 보편적인 건 아니다.** [patient-consistent](#/p/patient-consistent)는 같은 증강과 훨씬 긴 학습을 쓰면 큰 교사에서도 학생이 계속 좋아진다는 것을 보여, "용량 격차 자체가 문제"라는 진단에 재검토가 필요함을 시사한다.'
],

figures:[
 {f:'fig3-scratch-vs-kd.png',
  cap:'ImageNet에서 ResNet18 학생을 ResNet34로 증류했을 때(파랑)와 scratch로 학습했을 때(빨강)의 검증 오차 곡선. 학습 초반 30에폭 정도는 KD가 앞서지만, 60에폭 이후 두 곡선이 사실상 같아지고 그 사이 구간에서 KD의 이점이 사라진다 — "증류는 초반엔 돕고 후반엔 해친다"는 주장의 근거.',
  src:'원문 Figure 3, p.4'}
],

links:[
 {t:'arXiv 1910.01348 — On the Efficacy of Knowledge Distillation', u:'https://arxiv.org/abs/1910.01348'}
]
});
