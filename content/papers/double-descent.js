WIKI.paper({
slug:'double-descent',
venue:'arXiv 2019 (Harvard · OpenAI)',
authors:'Nakkiran, Kaplun, Bansal, Yang, Barak, Sutskever',
arxiv:'1912.02292',

tldr:'모델 크기·학습 시간·데이터 양, 세 축 **어느 것을 키워도** 테스트 오차가 한 번 나빠졌다가 다시 좋아지는 이중 하강 곡선이 나타난다는 것을 보이고, 이 세 현상을 "effective model complexity(EMC)"라는 하나의 개념으로 통일한 논문. "보간 임계점을 넘기면" 무슨 축이든 다시 좋아진다는 것이 핵심이다.',

context:'고전 통계학의 편향-분산 트레이드오프는 모델이 훈련 데이터를 완전히 외우기 시작하면(보간, interpolation) 그때부터 테스트 오차가 무조건 나빠진다고 가르친다 — U자 곡선. 그런데 현대 신경망은 파라미터가 훈련 샘플보다 훨씬 많아 무작위 레이블도 통째로 외울 수 있는데도([일반화 재고](#/p/rethinking-generalization)가 보인 바로 그 사실), 실무에서는 "모델을 더 키우면 더 좋아진다"는 것이 상식이었다. Belkin et al.(2018)이 결정트리·랜덤피처·2층 신경망에서 이 U자 곡선 뒤에 두 번째 하강이 이어지는 "double descent"를 처음 관찰했지만, 어디까지나 모델 크기 하나의 축이었다. 이 논문은 그 관찰을 ResNet·Transformer 같은 실제 딥러닝 모델로 확장하고, **모델 크기가 아니라도 같은 현상이 학습 시간·데이터 양 축에서도 똑같이 나온다**는 것을 보여 세 현상을 하나의 틀로 묶는다.',

ideas:[
 {h:'Effective Model Complexity: "외울 수 있는 샘플 수"로 복잡도를 재정의',
  lead:'파라미터 수 대신, 그 학습 절차가 훈련오차를 거의 0으로 만들 수 있는 최대 샘플 수로 복잡도를 정의한다.',
  d:'EMC는 모델 구조뿐 아니라 학습 절차 전체(에폭 수, 데이터 증강, 최적화기)에 의존한다. 같은 모델이라도 오래 학습시키면 EMC가 커진다 — 즉 학습 시간도 "복잡도"의 한 형태로 취급된다. 이 재정의가 세 종류의 이중 하강을 하나로 묶는 열쇠다.'},
 {h:'보간 임계점 근처의 "critical regime"이 가장 나쁘다',
  lead:'EMC가 샘플 수와 거의 같아지는 지점에서 테스트 오차가 정점을 찍고, 그 양옆에서는 오히려 좋아진다.',
  d:'EMC가 샘플 수 $n$보다 충분히 작으면(과소적합) 복잡도를 늘리는 것이 늘 도움이 되고, 충분히 크면(과적합 그 이상, over-parameterized) 늘리는 것도 여전히 도움이 된다. 문제는 EMC ≈ n인 딱 그 지점 — 모델이 훈련셋을 겨우 외울 수 있는 지점 — 에서 노이즈가 있는 샘플에 억지로 맞추려다 결정 경계가 불안정해지며 테스트 오차가 최악이 된다.'},
 {h:'model-wise: 모델을 키워가며 봐도 이중 하강',
  lead:'CIFAR-10/100에서 ResNet18의 폭을 늘려가면 보간 임계점 근처에서 테스트 오차가 봉우리를 이룬 뒤 다시 떨어진다.',
  d:'라벨 노이즈가 있으면 이 봉우리가 뚜렷한 피크로, 없어도 완만한 "고원(plateau)"으로 나타난다. 데이터 증강이나 훈련 샘플 수를 늘리는 것도 보간 임계점 자체를 오른쪽(더 큰 모델 쪽)으로 밀어내는 효과를 낸다 — 모델을 더 키워야 그 데이터를 완전히 외울 수 있기 때문이다.'},
 {h:'epoch-wise: 같은 모델도 오래 학습시키면 이중 하강',
  lead:'모델 크기를 고정해도, 학습을 계속하면 테스트 오차가 U자로 나빠졌다가 다시 좋아지는 구간이 있다.',
  d:'훈련 초반에는 고전적 U자를 따르다가(과소적합 → early stopping이 도움), EMC가 샘플 수를 넘어서는 시점부터는 계속 학습시킬수록 오히려 좋아진다. 이는 "early stopping이 항상 최선"이라는 통념이 **critically parameterized 구간에서만** 성립함을 뜻한다.'},
 {h:'sample non-monotonicity: 데이터를 늘렸는데 더 나빠지는 경우',
  lead:'훈련 샘플을 4.5배 늘렸는데도 특정 모델 크기 구간에서는 테스트 성능이 오히려 떨어진다.',
  d:'샘플 수가 늘면 보간 임계점(정점)이 더 큰 모델 쪽으로 이동한다. 모델 크기를 고정해 두고 데이터만 늘리면, 원래는 과대매개변수화(over-parameterized) 구간에 있던 모델이 그 이동한 정점 바로 위, 즉 최악의 critical regime으로 밀려 들어갈 수 있다. "데이터는 많을수록 좋다"는 상식이 깨지는 드문 반례다.'}
],

diagram:{type:'compare', cap:'고전 편향-분산 이론은 보간 임계점 이후 계속 나빠진다고 예측하지만, 실제로는 그 임계점 근처에서만 나쁘고 이후 다시 좋아진다.',
 left:{t:'고전: 편향-분산 U자', items:['복잡도 ↑ → 분산 ↑','임계점 이후 계속 악화','early stopping이 항상 최선']},
 right:{t:'이중 하강', items:['임계점 근처만 봉우리','그 이후 계속 개선','모델·시간·데이터 세 축 공통']}},

math:[
 {expr:'EMC_{D,ε}(T) = max{ n | E_{S~D^n}[Error_S(T(S))] ≤ ε }',
  tex:'\\text{EMC}_{D,\\varepsilon}(T) \\;=\\; \\max\\Big\\{\\, n \\;\\Big|\\; \\mathbb{E}_{S\\sim D^n}\\!\\big[\\text{Error}_S(T(S))\\big] \\le \\varepsilon \\Big\\}',
  d:'학습 절차 $T$가 분포 $D$에서 뽑은 $n$개 샘플에 대해 평균 훈련오차를 $\\varepsilon$ 이하로 낮출 수 있는 **최대 $n$**을 그 절차의 유효 복잡도로 정의한다. $\\varepsilon$은 실험에서 관례적으로 0.1을 쓴다.'},
 {expr:'EMC(T) ≈ n  ⇒  critically parameterized (가장 나쁜 구간)',
  tex:'\\text{EMC}_{D,\\varepsilon}(T) \\approx n \\;\\;\\Longrightarrow\\;\\; \\text{critically parameterized regime}',
  d:'일반화된 이중 하강 가설의 핵심 조건. EMC가 $n$보다 충분히 작거나 크면 복잡도를 늘리는 쪽이 이롭고, 딱 같아지는 좁은 구간에서만 늘리는 것이 오히려 해로울 수 있다.'}
],

numbers:[
 {k:'label noise', v:'15%', d:'CIFAR-10 ResNet18 실험 표준 설정 — 노이즈가 있어야 봉우리가 뚜렷해진다'},
 {k:'ResNet18 학습', v:'Adam, lr 1e-4, 최대 4K epoch', d:'model-wise/epoch-wise 실험 공통 설정'},
 {k:'SGD 학습', v:'lr ∝ 1/√T, 50만 gradient step', d:'옵티마이저를 바꿔도 현상이 재현됨을 보이는 대조 실험'},
 {k:'Transformer 학습', v:'8만 gradient step, label smoothing 10%, dropout 없음', d:'IWSLT14 De→En 번역, 샘플 비단조성 실험'},
 {k:'데이터 증가 반례', v:'4.5배 (4k→18k 샘플)', d:'특정 모델 크기에서 테스트 손실이 오히려 악화'},
 {k:'EMC 임계값 ε', v:'0.1', d:'"훈련오차 ≈0"의 기준으로 논문이 경험적으로 채택한 값'}
],

impact:'"모델을 키우면 언제나, 얼마나 좋아지는가"라는 질문에 조건을 하나 붙였다 — 보간 임계점을 이미 넘었거나 아직 한참 못 미친 경우에만 그렇다는 것이다. 이는 대형 언어모델 시대에 "일단 파라미터와 데이터를 계속 키운다"는 실무 전략이 왜 대체로 안전한지(대부분 over-parameterized 구간에 있으므로) 설명하는 한편, 중간 크기 모델을 무작정 키우는 실험에서 성능이 일시적으로 나빠지는 사례들을 이 하나의 틀로 해석할 수 있게 했다. Early stopping이 만능이 아니라는 것, 데이터를 늘리는 것이 항상 안전하지 않다는 것도 이 논문 이후 실무에서 참고되는 주의사항이 되었다.',

legacy:[
 '**[스케일링 법칙](#/p/scaling-laws) 논쟁의 배경지식** — 모델·데이터를 함께 키워야 하는 이유(EMC와 샘플 수의 상대적 위치를 함께 옮겨야 임계 구간을 피한다)를 설명하는 참조로 쓰인다',
 '**[로또 티켓 가설](#/p/lottery)과의 접점** — 과대매개변수화된 네트워크 안에 실제로 작동하는 부분망이 있다는 로또 티켓 결과와, "충분히 크면 오히려 안전하다"는 이중 하강의 관찰이 서로를 보강하는 것으로 자주 함께 인용된다',
 '**선형모델·커널 회귀에서의 이론적 후속 연구** — Bartlett, Hastie, Belkin 등이 이 논문 이후 이중 하강을 랜덤 피처·최소노름 회귀에서 수학적으로 설명하는 논문들을 다수 내놓음',
 '**"benign overfitting" 연구 계열의 촉매** — 왜 보간(훈련오차 0)이 항상 나쁘지 않은지를 규명하려는 이론 연구가 이 논문을 계기로 크게 늘었다'
],

pitfalls:[
 '**"모델을 키우면 무조건 이중 하강 봉우리를 지난다"는 뜻이 아니다.** 봉우리의 폭과 높이는 라벨 노이즈·데이터 증강 여부에 크게 좌우되며, 노이즈가 없으면 뚜렷한 피크 대신 완만한 고원으로 나타나는 경우가 많다.',
 '**EMC는 정확히 계산 가능한 양이 아니다.** $\\varepsilon$의 선택이 경험적(0.1)이고, "충분히 작다/크다"의 경계도 엄밀히 정의돼 있지 않다 — 논문 스스로 이를 "informal hypothesis"라고 명시한다.',
 '**이중 하강의 근본 메커니즘은 이 논문에서도 완전히 설명되지 않는다.** 딥러닝에서 왜 이런 현상이 나타나는지에 대한 이론적 설명은 후속 연구(선형모델 분석 등)의 몫으로 남겨 두었다.'
],

figures:[
 {f:'fig1-model-wise.png',
  cap:'왼쪽: ResNet18 폭을 늘려가며 본 test/train error. 주황 음영이 "critical regime"이고 그 안의 점선이 보간 임계점(훈련오차가 0에 도달하는 지점) — 바로 그 지점에서 test error가 봉우리를 이룬다. 오른쪽: 같은 실험을 학습 에폭(색)별로 나눠 그리면, 오래 학습시킬수록(어두운 색) 봉우리가 사라지고 큰 모델에서 계속 좋아진다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-heatmap.png',
  cap:'가로축 모델 폭, 세로축 학습 에폭 수(로그), 색이 test error(왼쪽)와 train error(오른쪽). 왼쪽 그림의 수평 점선을 따라가면 model-wise, 수직 점선을 따라가면 epoch-wise 이중 하강이고, 오른쪽 그림의 흰 점선(보간 임계점)이 왼쪽의 밝은(나쁜) 띠와 정확히 겹친다.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'We show that a variety of modern deep learning tasks exhibit a "double-descent" phenomenon where, as we increase model size, performance first gets worse and then gets better.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1912.02292 — Deep Double Descent', u:'https://arxiv.org/abs/1912.02292'},
 {t:'OpenAI Blog: Deep Double Descent', u:'https://openai.com/research/deep-double-descent'}
]
});
