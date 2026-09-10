WIKI.paper({
slug:'randaugment',
venue:'CVPR Workshops 2020 (arXiv 2019)',
authors:'Cubuk, Zoph, Shlens, Le (Google Research, Brain Team)',
arxiv:'1909.13719',

tldr:'[AutoAugment](#/p/autoaugment)의 방대한 탐색 공간을 **N(적용 개수)·M(강도) 단 두 개의 정수**로 줄인다. 탐색 자체가 거의 불필요했다는 것이 결론이고, 그래서 실무에서 AutoAugment 대신 이것이 쓰인다.',

context:'[AutoAugment](#/p/autoaugment)는 강화학습으로 증강 정책(어떤 변환을, 얼마의 확률과 강도로 적용할지)을 탐색해 사람이 만든 증강보다 좋은 결과를 냈다. 문제는 비용이다. 정책 하나를 찾으려면 대리(proxy) 모델을 작은 데이터셋에 수천 번 학습시켜야 했고, 원 논문은 **약 15,000 GPU시간**을 썼다. 게다가 작은 대리 과제에서 찾은 정책이 큰 모델·큰 데이터셋에는 최적이 아닐 수 있다는 근본적인 의문도 있었다. Population Based Augmentation 등 후속 연구들은 탐색 속도를 높였지만 탐색 단계 자체를 없애지는 못했다. RandAugment의 질문은 단순하다 — **애초에 탐색이 필요한가?**',

ideas:[
 {h:'정책을 학습하지 말고 균등 무작위로 고른다',
  lead:'14개 변환 중 매번 균등 확률로 골라 적용해 학습된 확률·정책 자체를 없앤다.',
  d:'AutoAugment는 "어떤 변환을 얼마의 확률로 쓸지"까지 30개 이상의 파라미터로 학습했다. RandAugment는 이 확률을 전부 버리고, 회전·색상·대비 등 $K=14$개의 후보 변환 중 하나를 균등 확률 $1/K$ 로 뽑는 절차로 대체한다. 학습되는 정책이 없으므로 탐색 자체가 필요 없어진다.'},
 {h:'하이퍼파라미터를 N, M 두 개로 압축',
  lead:'한 이미지에 순차 적용할 변환 개수 N과, 모든 변환에 공통으로 쓸 강도 M만 남긴다.',
  d:'한 이미지마다 $N$ 개의 변환을 무작위로 뽑아 순서대로 적용하고, 모든 변환은 하나의 공유된 왜곡 강도 $M$(0~30 정수)을 쓴다. 원래 변환마다 따로 학습해야 했던 강도를 단일 값으로 묶은 것이 핵심 단순화이며, 결과적으로 탐색 공간이 $K^N$ 수준(그마저도 그리드서치로 충분)으로 줄어든다.'},
 {h:'그리드서치만으로 학습된 정책을 능가',
  lead:'N·M 두 값에 대한 최소한의 그리드서치가 강화학습 탐색을 대체할 수 있음을 실험으로 보인다.',
  d:'CIFAR-10·SVHN·ImageNet·COCO 전반에서 $N,M$ 을 좁은 그리드로만 훑어도 AutoAugment·Fast AutoAugment·PBA와 동등하거나 더 나은 정확도를 얻었다. 탐색 공간 크기로 보면 AutoAugment의 $10^{32}$ 대비 RandAugment는 $10^2$ 수준으로, 네 자릿수 이상 줄었는데도 성능은 떨어지지 않았다.'},
 {h:'최적 강도는 모델·데이터 크기에 따라 달라진다',
  lead:'모델이 크거나 데이터가 많을수록 더 강한 증강(M이 큰 값)이 최적임을 실측으로 확인한다.',
  d:'Wide-ResNet의 폭을 키우거나 학습 데이터를 늘릴수록, 검증 정확도를 최대화하는 최적 왜곡 강도 $M$ 이 체계적으로 커졌다(그림 3). 이는 작은 대리 모델·작은 데이터셋에서 찾은 AutoAugment 정책이 큰 모델에는 약할 수 있다는 것을 실측으로 보여주는 근거이기도 하다.'}
],

diagram:{type:'compare', cap:'AutoAugment와 RandAugment의 탐색 공간·절차 비교.',
 left:{t:'AutoAugment', items:['RL로 정책·확률·강도 학습','대리 과제에 ~15K GPU시간','탐색 공간 ~10^32']},
 right:{t:'RandAugment', items:['균등 확률로 변환 선택','파라미터 단 2개: N, M','좁은 그리드서치(~10^2)로 충분'], acc:true}},

math:[
 {expr:'policy(x) = [transform_i(x, M) for i in Uniform(K, N)]  — N개를 K종에서 균등 샘플링, 공통 강도 M',
  tex:'\\text{ops} \\sim \\text{Uniform}(\\{1,\\dots,K\\},\\,N), \\qquad \\tilde{x} = T_{\\text{op}_N}\\!\\big(\\cdots T_{\\text{op}_1}(x; M);M\\big)',
  d:'$K=14$ 개 변환 후보에서 $N$ 개를 균등 확률로 뽑아 순서대로 합성 적용하고, 모든 변환은 동일한 강도 $M$ 을 공유한다. 학습 가능한 파라미터가 전혀 없는 절차이며, 코드로는 for문 하나로 끝난다(Figure 2).'}
],

numbers:[
 {k:'탐색 공간 크기', v:'AA 10³²  →  RA 10²', d:'AutoAugment·Fast AA의 정책 공간 대비 RandAugment는 자릿수 30 이상 축소'},
 {k:'탐색 비용', v:'AutoAugment ~15,000 GPU시간 vs RandAugment 그리드서치', d:'별도 대리 과제 학습이 필요 없어 탐색이 본 학습에 통합됨'},
 {k:'ImageNet (EfficientNet-B7)', v:'84.0% → 85.0%', d:'baseline 대비 **+1.0%p**, AutoAugment(84.4%)보다도 높은 신규 SOTA'},
 {k:'COCO 검출(mAP)', v:'AutoAugment 대비 0.3 이내', d:'RetinaNet 기반, AutoAugment 전용 변환 없이도 근접한 성능'},
 {k:'하이퍼파라미터 수', v:'2개 (N, M)', d:'AutoAugment는 변환별 확률+강도로 30개 이상'}
],

impact:'RandAugment는 자동 증강 연구의 방향을 "더 정교한 탐색 알고리즘"에서 "애초에 탐색이 필요한가"로 되돌려 놓았다. 두 정수 하이퍼파라미터만 조정하면 되는 단순함 덕분에 이후 대부분의 이미지 분류·자기지도 학습 파이프라인에서 [AutoAugment](#/p/autoaugment)를 대체하는 기본 증강이 되었으며, [UDA](#/p/uda)·[Noisy Student](#/p/noisy-student) 같은 준지도·자기학습 파이프라인이 실제로 사용하는 증강도 RandAugment다.',

legacy:[
 '**[UDA](#/p/uda)** 의 일관성 학습(consistency training)에서 강한 증강 소스로 RandAugment가 실제로 쓰임',
 '**[Noisy Student](#/p/noisy-student)** 등 대규모 자기학습(self-training) 파이프라인의 표준 증강으로 채택',
 '탐색 비용을 없앤 접근이 이후 TrivialAugment 등 "탐색을 아예 제거"하는 후속 연구의 직접적인 선례가 됨',
 '단순함 때문에 논문 밖 실무 코드베이스(torchvision, timm 등)에 기본 내장 증강으로 흡수됨'
],

pitfalls:[
 '**"탐색이 완전히 불필요하다"는 결론을 과대해석하면 안 된다.** N·M에 대한 좁은 그리드서치는 여전히 필요하고, 이 그리드 자체도 데이터셋·모델 크기에 따라 최적 지점이 달라진다(그림 3).',
 '**모든 모델·데이터셋에 동일한 M이 최적이 아니다.** 작은 모델이나 적은 데이터에는 오히려 낮은 M이 유리하므로, EfficientNet-B7에서 찾은 M을 다른 크기 모델에 그대로 재사용하면 성능이 떨어질 수 있다.',
 '**COCO 결과는 AutoAugment의 동일 이득을 재현하지 못했다.** AutoAugment는 COCO 전용 특수 변환을 썼는데 RandAugment는 그런 전용 변환 없이 근접한 성능(0.3 이내)을 낸 것이지, 능가한 것은 아니다.'
],

figures:[
 {f:'fig1-magnitude.png', cap:'같은 원본에 ShearX → AutoContrast를 순서대로 적용한 예시를 왜곡 강도 M=9/17/28로 늘려가며 비교. M이 커질수록 기울기(shear)와 명암 왜곡이 강해지는 것을 눈으로 확인한다 — 이 M 하나가 전체 변환 강도를 통제한다.', src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'The primary goal of RandAugment is to remove the need for a separate search phase on a proxy task.',
  src:'Section 3, p.3'}
],

links:[
 {t:'arXiv 1909.13719 — RandAugment', u:'https://arxiv.org/abs/1909.13719'},
 {t:'공식 코드 (tensorflow/tpu)', u:'https://github.com/tensorflow/tpu/tree/master/models/official/efficientnet'}
]
});
