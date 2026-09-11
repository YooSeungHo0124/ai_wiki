WIKI.concept({
slug:'learning-rate',

tldr:'매 스텝 기울기 방향으로 파라미터를 얼마나 이동시킬지 정하는 스칼라로, 딥러닝에서 가장 결과를 좌우하는 하이퍼파라미터.',

why:'같은 모델·같은 데이터라도 learning rate 하나로 수렴 여부, 최종 성능, 학습 시간이 전부 달라진다. 실무에서 학습이 발산하거나 정체될 때 가장 먼저 의심해야 할 것이 learning rate 이며, 배치 크기를 바꿀 때 learning rate 를 같이 조정하지 않으면 다른 모든 설정이 같아도 결과가 재현되지 않는다.',

sections:[
 {h:'너무 크면 · 너무 작으면', d:'너무 크면 매 스텝 손실 표면의 골짜기를 뛰어넘어 loss 가 줄지 않거나 발산(NaN)한다. 초반 몇 스텝은 그럴듯해 보이다가 갑자기 loss 가 치솟는 경우도 흔하다. 너무 작으면 발산하지는 않지만 수렴이 느려 같은 성능에 도달하는 데 훨씬 많은 스텝이 걸리고, 손실 표면의 얕은 지역 최소값(local minimum)이나 안장점(saddle point)에 갇혀 빠져나오지 못하기 쉽다.'},
 {h:'실무에서 어떻게 정하는가', d:'맨땅에서 값을 고르기보다 **LR 범위 테스트(LR range test)** 를 먼저 돌린다 — 매우 작은 값에서 시작해 몇 스텝마다 지수적으로 learning rate 를 올리며 loss 를 기록하면, loss 가 가장 가파르게 떨어지는 구간이 쓸 만한 값의 근방이고 loss 가 다시 튀기 시작하는 지점이 상한이다. 실제 학습에서는 고정값을 쓰지 않고 **스케줄**을 쓰는 것이 표준이다 — 초반 몇백~몇천 스텝은 작은 값에서 목표 값까지 선형으로 올리는 warmup 을 거치고([SGDR](#/p/sgdr) 류의 cosine decay 등으로) 이후 서서히 낮춘다. warmup 은 초기 가중치가 무작위라 큰 learning rate 를 바로 주면 불안정하기 때문이다.'},
 {h:'배치 크기와의 관계', d:'배치 크기를 키우면 한 스텝의 기울기 추정이 더 정확해지지만 같은 에폭 수 동안 파라미터 업데이트 횟수는 줄어든다. 이를 보정하는 관행이 **선형 스케일링 규칙(linear scaling rule)** 이다 — 배치 크기를 $k$ 배로 키우면 learning rate 도 $k$ 배로 키운다. [Accurate, Large Minibatch SGD](#/p/lr-scaling) 가 ImageNet 학습에서 이 규칙과 warmup 을 함께 써서 배치 8192까지도 정확도 손실 없이 확장됨을 보였다. 다만 이 규칙은 무한정 성립하지 않는다 — 배치가 아주 커지면 아무리 learning rate 를 키워도 이득이 줄어드는 지점이 있다.'}
],

math:[
 {expr:'θ ← θ − η · ∇L(θ)',
  tex:'\\theta \\leftarrow \\theta - \\eta \\cdot \\nabla L(\\theta)',
  d:'$\\eta$ 가 learning rate. 기울기 $\\nabla L$ 의 방향으로 얼마나 이동할지를 정하는 유일한 계수다.'},
 {expr:'선형 스케일링:  η_new = η_base · (B_new / B_base)',
  tex:'\\eta_{\\text{new}} = \\eta_{\\text{base}} \\cdot \\dfrac{B_{\\text{new}}}{B_{\\text{base}}}',
  d:'배치 크기 $B$ 를 키운 비율만큼 learning rate 도 키운다. warmup 과 함께 쓰지 않으면 초반에 발산하기 쉽다.'}
],

diagram:{type:'compare', cap:'둘 다 결과는 나쁘지만 원인과 증상이 다르다.',
 left:{t:'너무 큼', items:[
  'loss 가 튀거나 NaN 으로 발산',
  '초반엔 빨라 보이다 무너짐',
  '처방: 값을 낮추거나 warmup 추가']},
 right:{t:'너무 작음', items:[
  '수렴은 하지만 매우 느림',
  '얕은 극소점에 갇히기 쉬움',
  '처방: LR 범위 테스트로 재탐색']}},

confuse:[
 {a:'learning rate', b:'배치 크기', d:'둘은 독립 변수가 아니다. 배치를 키우면서 learning rate 를 그대로 두면 유효 업데이트 크기가 작아져 동일 설정이 아니게 된다 — 선형 스케일링 규칙으로 함께 조정한다.'},
 {a:'warmup', b:'decay(감쇠)', d:'warmup 은 학습 초반 작은 값에서 목표 값까지 올리는 구간이고, decay 는 목표 값에서 학습이 끝날 때까지 낮추는 구간이다. 스케줄은 이 둘을 이어 붙인 것이다.'},
 {a:'learning rate 스케줄', b:'옵티마이저 선택', d:'스케줄은 같은 옵티마이저 안에서 시간에 따라 $\\eta$ 를 바꾸는 것이고, 옵티마이저 선택(SGD vs Adam)은 기울기를 파라미터에 반영하는 방식 자체를 바꾸는 것이다. 둘은 독립적으로 고른다.'}
],

pitfalls:[
 '다른 논문·코드의 learning rate 를 배치 크기 차이를 무시하고 그대로 가져다 쓰면 재현이 안 된다.',
 'loss 가 초반 몇 스텝 동안 잘 떨어진다고 안심하지 마라 — 발산은 수십~수백 스텝 뒤에 나타나는 경우가 많다.',
 'warmup 을 생략하고 큰 learning rate 로 바로 시작하면, 특히 Transformer 나 Post-LN 구조([정규화 층](#/c/normalization) 참고)에서 초반 발산이 흔하다.',
 'LR 범위 테스트에서 나온 "가장 가파른 구간"을 그대로 쓰지 말고 그보다 한두 자릿수 낮은 값에서 시작하는 것이 안전하다 — 테스트는 짧은 구간에서 관찰한 값이라 실제 장기 학습에서는 더 보수적이어야 한다.'
],

papers:['sgdr','lr-scaling','adam'],
terms:['gradient-descent','batch-epoch','lr-schedule','sgd','momentum']
})
