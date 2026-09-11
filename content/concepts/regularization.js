WIKI.concept({
slug:'regularization',

tldr:'모델이 학습 데이터를 통째로 외우지 못하도록 손실이나 학습 절차에 제약·노이즈를 더하는 기법들의 총칭.',

why:'L1/L2, dropout, 조기 종료, 데이터 증강, label smoothing 은 전부 "정칙화"라 불리지만 서로 완전히 다른 방식으로 작동한다. 무엇을 먼저 시도할지, 왜 어떤 조합은 서로 방해하는지(dropout + BatchNorm)를 알아야 과적합 처방을 순서 있게 고를 수 있다. 또한 한국어로 "정규화"라 옮겨지는 두 개념 — regularization 과 [normalization](#/c/normalization) — 을 헷갈리면 완전히 다른 문제를 서로 바꿔 적용하게 된다.',

sections:[
 {h:'정칙화 vs 정규화', d:'한국어 번역이 겹쳐서 생기는 가장 흔한 혼동이다. regularization(이 글, 정칙화)은 **과적합을 줄이려는** 기법 — 손실에 페널티를 더하거나(L1/L2), 학습 중 노이즈를 주거나(dropout), 데이터를 늘리는 것(증강)이다. normalization(정규화 층)은 **활성값의 분포를 안정시켜 학습을 빠르고 안정적으로** 만드는 층(BatchNorm, LayerNorm)이다. 목적이 다르고 적용 위치도 다르다 — 다만 BatchNorm 은 미니배치 통계에 노이즈가 섞여 **부수적으로** 약한 정칙화 효과도 낸다. 자세한 비교는 [정규화 층](#/c/normalization) 문서를 봐라.'},
 {h:'L1 · L2 페널티', d:'손실에 가중치 크기에 비례하는 항을 더해 큰 가중치에 불이익을 준다. L2(=ridge, weight decay 와 동의어로 자주 쓰임)는 가중치를 0에 가깝게 고르게 줄이고, L1(=lasso)은 일부 가중치를 정확히 0으로 만들어 **희소성**을 유도한다. 특징 선택이 중요하면 L1, 부드러운 억제면 L2를 쓰는 것이 관행이다.'},
 {h:'Dropout · 조기 종료', d:'Dropout 은 학습 중 매 스텝 유닛을 무작위로 꺼서, 특정 유닛 조합에 의존하는 공적응(co-adaptation)을 막는다 — 사실상 지수적으로 많은 부분망의 암묵적 앙상블이다. 조기 종료(early stopping)는 검증 loss 가 최저인 지점에서 학습을 멈춰, 그 이후에나 나타날 과적합 구간에 아예 들어가지 않는 것이다. 둘 다 파라미터 자체를 건드리지 않고 **학습 절차**를 바꾼다는 점에서 L1/L2 와 결이 다르다.'},
 {h:'데이터 증강 · label smoothing', d:'데이터 증강(augmentation)은 회전·자르기·색상 변형 등으로 학습 데이터의 다양성을 늘려, 모델이 특정 픽셀 배치가 아니라 불변적인 패턴을 배우게 만든다. label smoothing 은 정답 레이블을 완전한 1이 아니라 0.9 같은 값으로 낮추고 나머지 확률을 다른 클래스에 나눠, 모델이 과도하게 확신하지 못하게 한다. 둘 다 손실 함수 형태가 아니라 **입력·타깃을 바꾸는** 정칙화다.'},
 {h:'L2 와 weight decay, Adam 에서 갈라진다', d:'SGD 에서는 L2 페널티를 손실에 더하는 것과 가중치를 매 스텝 일정 비율 줄이는 weight decay 가 수학적으로 같다. 하지만 Adam 처럼 기울기를 파라미터별로 다르게 스케일링하는 옵티마이저에서는 L2 항이 기울기에 섞여 **적응적 스케일링의 영향을 받아 버려** 원래 의도한 만큼 감쇠되지 않는다. [AdamW](#/p/adamw) 는 weight decay 를 기울기 계산과 분리해(decoupled) 이 문제를 고친 것이다. Adam 계열을 쓰면서 L2 페널티를 손실에 직접 더하고 있다면 실제로는 의도한 정칙화 강도를 못 받고 있을 가능성이 크다.'}
],

math:[
 {expr:'L2:  L_reg = L_data + λ Σ w_i²',
  tex:'L_{\\text{reg}} = L_{\\text{data}} + \\lambda \\sum_i w_i^2',
  d:'$\\lambda$ 가 클수록 가중치를 더 세게 억제한다. 기울기에는 $2\\lambda w$ 항이 더해져 매 스텝 가중치를 원점 쪽으로 조금씩 당긴다.'},
 {expr:'SGD 에서 decoupled weight decay:  θ ← θ − η(∇L_data + λθ)',
  tex:'\\theta \\leftarrow \\theta - \\eta(\\nabla L_{\\text{data}} + \\lambda \\theta)',
  d:'SGD 에서는 이 형태가 L2 페널티를 손실에 더한 것과 동일하다. 문제는 Adam 처럼 $\\nabla L$ 을 2차 모멘트로 나눠 스케일을 바꾸는 옵티마이저에서는 $\\lambda\\theta$ 항도 같이 스케일이 바뀌어 버린다는 것 — AdamW 는 이 항을 스케일링 바깥으로 빼낸다.'}
],

diagram:{type:'compare', cap:'같은 "과적합 억제"를 손실 항으로 하느냐, 학습 절차에 노이즈를 섞어 하느냐.',
 left:{t:'명시적: 손실에 항 추가', items:[
  'L1 — 가중치 희소화',
  'L2 — 가중치 크기 억제',
  'label smoothing — 과신 억제']},
 right:{t:'절차적: 노이즈·개입', items:[
  'dropout — 유닛 무작위 제거',
  '증강 — 입력에 변형',
  '조기 종료 — 학습을 일찍 멈춤']}},

confuse:[
 {a:'정칙화(regularization)', b:'정규화(normalization)', d:'전자는 과적합을 줄이는 기법군, 후자는 활성값 분포를 안정시키는 층이다. 한국어로 둘 다 "정규화"라 옮겨지는 경우가 많아 원어를 병기해 구분하는 습관이 필요하다. 자세히는 [정규화 층](#/c/normalization) 참고.'},
 {a:'L2 regularization', b:'weight decay', d:'SGD 에서는 동일하지만 Adam 에서는 다르다 — 전자는 기울기에 섞여 적응적 스케일링의 영향을 받고, 후자(디커플드)는 그 영향을 받지 않는다. [AdamW](#/p/adamw) 가 이 구분을 만든 이유다.'},
 {a:'dropout', b:'조기 종료', d:'dropout 은 매 스텝 다른 부분망을 학습시키는 것이고, 조기 종료는 과적합이 시작되기 전에 학습을 멈추는 것이다. 함께 써도 서로 방해하지 않는다.'}
],

pitfalls:[
 '"정규화"라는 한국어만 보고 regularization 과 normalization 을 같은 것으로 착각하는 경우가 매우 흔하다 — 항상 원어를 확인해라.',
 'Adam/AdamW 계열에서 L2 페널티를 직접 손실에 더하면 weight decay 로 의도한 만큼의 억제가 안 될 수 있다. AdamW 의 decoupled weight decay 를 쓰는 것이 표준이다.',
 'dropout 과 BatchNorm 을 함께 쓰면 활성값 분산이 학습·추론에서 달라져 BN 의 이동 통계와 어긋날 수 있다 — 굳이 함께 쓴다면 BN 뒤에 둔다.',
 '정칙화를 세게 걸었는데도 학습 loss 자체가 안 내려가면 정칙화가 아니라 과소적합 문제다 — 정칙화를 더 거는 대신 강도를 낮춰야 한다.'
],

papers:['dropout','adamw','cutout'],
terms:['overfitting','normalization','augmentation','adamw-c','generalization']
})
