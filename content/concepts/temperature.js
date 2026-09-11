WIKI.concept({
slug:'temperature',

tldr:'다음 토큰 확률분포를 softmax 이전에 나누는 값으로, 클수록 분포가 평평해져 다양한 토큰이 뽑히고 작을수록 한 토큰에 확률이 몰린다.',

why:'temperature 는 [샘플링](#/c/sampling)의 다양성을 조절하는 가장 기본적인 손잡이다. 코드 생성 API 를 호출하는데 temperature 를 창작용 값으로 놔두면 같은 함수를 물어봐도 매번 다른(때로 틀린) 답이 나오고, 반대로 창작에 temperature=0 을 쓰면 매번 똑같이 밋밋한 글이 나온다 — 값 하나로 이런 차이가 갈린다.',

sections:[
 {h:'softmax 속 T 위치', d:'모델이 내는 원시 점수(logit) $z_i$ 를 확률로 바꾸는 보통의 softmax 는 $p_i=\\exp(z_i)/\\sum_j\\exp(z_j)$ 이다. temperature 샘플링은 이 지수를 취하기 전에 모든 logit 을 $T$ 로 나눈다. $T$ 가 로짓들의 차이(간격)를 줄이거나 늘려서, 지수함수를 거친 뒤의 확률 분포 모양 자체를 바꾸는 것이다.'},
 {h:'극한을 보면 감이 온다', d:'$T\\to 0$ 이면 로짓 사이의 차이가 무한히 커져 exp 를 거친 뒤 가장 큰 logit 하나만 확률 1에 가까워진다 — 이는 곧 탐욕적 디코딩과 같아진다. $T\\to\\infty$ 이면 모든 logit 이 0에 가깝게 뭉개져 exp 를 거치면 전부 거의 같은 값이 되고, 결과적으로 어휘 전체에 걸친 균등분포에 가까워진다. $T=1$ 은 모델이 학습한 원래 분포를 그대로 쓰는 기준점이다.'},
 {h:'실무에서 어떤 값을 쓰는가', d:'정답이 하나로 정해진 작업(코드 생성, 사실 조회, 함수 호출)은 temperature 를 0~0.3 정도로 낮게 쓰는 것이 관행이다 — 일관되고 예측 가능한 출력이 중요하기 때문이다. 브레인스토밍·카피라이팅·소설처럼 다양성이 값어치가 있는 작업은 0.7~1.0, 때로 그 이상을 쓰는 것이 흔한 관행이다. 이건 정해진 규칙이 아니라 경험적 관행이므로 작업마다 실제로 비교해 보고 정하는 게 맞다.'},
 {h:'보정과는 다른 개념', d:'이름이 같은 "temperature scaling"이 [보정(calibration)](#/c/calibration) 분야에도 있다 — [On Calibration of Modern Neural Networks](#/p/temperature-scaling) 논문에서 나온 기법이다. 거기서도 logit 을 $T$ 로 나누고 softmax 를 취하는 같은 수식을 쓰지만 목적이 정반대다. 생성 시 temperature 는 사람이 값을 정해 다양성을 조절하려는 것이고, 보정의 temperature scaling 은 검증셋에서 $T$ 를 최적화해 모델이 뱉는 확신도(confidence)가 실제 정확도와 맞아떨어지게(예: "90% 확신"이라 말하면 실제로 90% 맞도록) 교정하는 것이다. 후자는 대개 분류기의 출력에 적용되고 생성 다양성과는 무관하다.'}
],

math:[
 {tex:'p_i=\\dfrac{\\exp(z_i/T)}{\\sum_j \\exp(z_j/T)}', expr:'temperature 를 적용한 softmax', d:'$z_i$ 는 $i$ 번째 토큰의 logit, $T$ 는 temperature. $T<1$ 이면 큰 logit 과 작은 logit 의 차이가 나눗셈으로 더 벌어져 exp 이후 분포가 뾰족해지고(확신 있는 토큰에 확률 집중), $T>1$ 이면 차이가 줄어들어 분포가 평평해진다(여러 토큰에 확률 분산).'}
],

diagram:{type:'flow', cap:'T 값에 따라 같은 logit 이 다른 분포로 바뀐다.',
 steps:['logit [z_1, z_2, z_3]','T=0.2로 나눔 → 큰 차이','softmax → 한 토큰에 확률 집중(≈탐욕)','T=2.0로 나눔 → 작은 차이','softmax → 고른 확률(≈균등)']},

confuse:[
 {a:'temperature', b:'[Top-k·Top-p](#/c/top-k-top-p)', d:'temperature 는 분포의 뾰족함(모양)을 바꾸고, top-k·top-p 는 어떤 토큰들을 후보로 남길지(집합)를 자른다. 실무에서는 둘을 같이 쓰며, 적용 순서에 따라 결과가 달라진다 — 자세한 순서는 top-k·top-p 문서 참고.'},
 {a:'생성의 temperature', b:'[보정](#/c/calibration)의 temperature scaling', d:'수식(logit 을 $T$로 나눈 뒤 softmax)은 똑같지만 목적이 다르다. 생성에서는 사람이 다양성을 조절하려고 직접 값을 고르고, 보정에서는 검증 데이터로 $T$ 를 최적화해 확신도를 정확도에 맞춘다. "temperature"라는 이름만 보고 같은 걸 하는 기법이라고 착각하기 쉽다.'},
 {a:'$T=1$', b:'temperature "off"', d:'$T=1$ 은 temperature 를 안 쓰는 게 아니라 모델이 학습한 원래 분포를 그대로 쓰는 기준값이다. "temperature 를 끈다"는 표현을 쓸 거면 $T\\to0$(탐욕적)을 가리키는 것인지 $T=1$(원분포)을 가리키는 것인지 헷갈리지 않게 확인해야 한다.'}
],

pitfalls:[
 'temperature 를 올리면 "더 똑똑해진다"고 착각하기 쉽지만, 실제로는 다양성만 늘어날 뿐 사실성이나 추론 능력이 좋아지는 게 아니다 — 오히려 환각 위험이 커질 수 있다.',
 'temperature=0 이 항상 완전한 결정론을 보장하는 것은 아니다 — 구현·하드웨어에 따라 미세한 부동소수점 차이가 결과를 바꿀 수 있다.',
 '생성용 temperature 와 보정용 temperature scaling 을 같은 개념으로 혼동해 "모델을 보정하려면 API 의 temperature 파라미터를 조절하면 된다"고 잘못 생각하는 경우가 있다 — 전혀 다른 절차다.'
],

papers:['nucleus-sampling','temperature-scaling'],
terms:['sampling','top-k-top-p','calibration']
});
