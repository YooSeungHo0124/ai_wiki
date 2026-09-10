WIKI.paper({
slug:'adadelta',
venue:'arXiv tech report 2012 (Google)',
authors:'Matthew D. Zeiler (Google · New York University)',
arxiv:'1212.5701',

tldr:'학습률 $\\eta$ 를 손으로 튜닝할 필요가 없는 적응적 최적화기. AdaGrad의 그래디언트 제곱 누적이 끝없이 커져 학습률이 0으로 죽는 문제를, **고정 창(window)의 지수이동평균**과 **파라미터 단위와 맞춘 업데이트 항**으로 고쳤다.',

context:'2012년의 표준 관행은 SGD에 전역 학습률 $\\eta$ 하나를 손으로 잡고 실험적으로 튜닝하는 것이었다 — 너무 크면 발산하고 너무 작으면 느리다. [AdaGrad](https://www.jmlr.org/papers/volume12/duchi11a/duchi11a.pdf)는 차원마다 과거 그래디언트 제곱의 누적합으로 학습률을 나눠 자동으로 차원별 스케일을 맞추는 첫 해법을 냈지만, 누적합이 학습 내내 단조 증가하기 때문에 **학습률이 시간이 갈수록 0으로 수렴해 학습이 사실상 멈춘다**는 새로운 문제를 만들었다. 이 논문은 AdaGrad의 아이디어(차원별 적응)는 유지하면서 이 감쇠 문제와, 여전히 남아있던 전역 학습률 하이퍼파라미터를 동시에 없애려 한다.',

ideas:[
 {h:'무한 누적 대신 지수이동평균 창',
  lead:'그래디언트 제곱을 처음부터 다 더하지 않고 최근 값 위주로 감쇠 평균한다.',
  d:'AdaGrad는 분모가 $\\sum_{\\tau=1}^t g_\\tau^2$ 로 학습이 길어질수록 계속 커져 학습률을 0으로 밀어붙인다. 이 논문은 이를 decay constant $\\rho$ 를 쓴 지수이동평균 $E[g^2]_t=\\rho E[g^2]_{t-1}+(1-\\rho)g_t^2$ 으로 바꿔, 사실상 크기 $w$ 인 창 내의 최근 그래디언트만 반영되게 한다. 오래된 그래디언트의 영향이 지수적으로 사라지므로 학습 후반에도 분모가 무한정 커지지 않는다.'},
 {h:'단위(unit) 불일치를 고친다',
  lead:'SGD·모멘텀·AdaGrad의 업데이트 항은 파라미터가 아니라 그래디언트의 단위를 갖는다는 점을 지적한다.',
  d:'2차 방법(뉴턴법)은 $\\Delta x \\propto H^{-1}g \\propto \\partial f/\\partial x \\div \\partial^2 f/\\partial x^2$ 로 정확히 $x$ 의 단위를 갖지만, SGD류는 $\\Delta x \\propto g \\propto \\partial f/\\partial x \\propto 1/(\\text{x의 단위})$ 로 **거꾸로 된 단위**를 쓴다. 저자는 이 불일치를 헤시안 역수의 근사로 바로잡는다 — 정확한 2차 도함수 대신, 분자에 **직전 파라미터 업데이트들의 RMS**를 놓아 근사한다.'},
 {h:'RMS[Δx]/RMS[g]: 헤시안을 명시적으로 계산하지 않는 근사',
  lead:'헤시안 역수 자리에 "과거 업데이트 크기 / 과거 그래디언트 크기"라는 1차 정보만으로 만든 비율을 넣는다.',
  d:'$1/H \\approx \\Delta x/g$ 이고 $\\Delta x_t$ 는 아직 모르므로, 그 대신 창 크기 $w$ 로 지수감쇠된 이전 $\\Delta x$ 들의 RMS를 대리로 쓴다. 결과 업데이트 $\\Delta x_t = -\\frac{\\text{RMS}[\\Delta x]_{t-1}}{\\text{RMS}[g]_t}g_t$ 는 분자·분모 모두 그래디언트 단위 하나씩을 가져서 전체적으로 $x$ 의 단위가 되고, 동시에 헤시안 계산이나 추가 순전파 없이 1차 정보만으로 끝난다.'},
 {h:'전역 학습률 η가 식에서 완전히 사라진다',
  lead:'RMS 비율 자체가 스텝 크기를 결정하므로 튜닝할 η가 남지 않는다.',
  d:'AdaGrad·모멘텀·SGD는 여전히 전역 $\\eta$ 를 손으로 골라야 했다. AdaDelta의 최종 업데이트 식(식 14)에는 $\\eta$ 항이 없다 — 남는 하이퍼파라미터는 감쇠율 $\\rho$ 와 분모 안정화 상수 $\\epsilon$ 뿐이며, 저자는 표 2에서 이 둘을 넓은 범위로 바꿔도 MNIST 성능이 거의 흔들리지 않음을 보인다(1.83%~2.32% 범위).'},
 {h:'급격한 그래디언트에 대한 자연스러운 강건성',
  lead:'분자가 분모보다 1스텝 늦게 반응해 갑작스런 큰 그래디언트의 충격을 완충한다.',
  d:'식 14의 분자 $\\text{RMS}[\\Delta x]_{t-1}$ 은 정의상 한 스텝 지연된 값이라, 그래디언트가 갑자기 튀면 분모($\\text{RMS}[g]_t$)만 먼저 커져 그 스텝의 유효 학습률이 즉시 낮아진다. 분자가 뒤늦게 따라오기 전에 분모가 먼저 제동을 거는 셈이라, 노이즈가 큰 미니배치·분산 학습 환경에서 별도 처리 없이도 안정적이다.'}
],

diagram:{type:'flow', cap:'AdaDelta 한 스텝(알고리즘 1). 그래디언트 하나로 두 개의 지수이동평균을 갱신하고, 그 비율로 스텝 크기를 정한다.',
 nodes:[
  {t:'그래디언트 계산', s:'gt'},
  {t:'E[g²] 갱신', s:'ρE[g²]+(1-ρ)g²'},
  {t:'RMS 비율', s:'RMS[Δx]/RMS[g]', acc:true},
  {t:'업데이트 Δx', s:'-비율 × gt'},
  {t:'E[Δx²] 갱신', s:'ρE[Δx²]+(1-ρ)Δx²'},
  {t:'파라미터 적용', s:'x ← x + Δx'}
 ]},

math:[
 {expr:'E[g²]t = ρ E[g²]t−1 + (1−ρ) gt²,   RMS[g]t = √(E[g²]t + ε)',
  tex:'E[g^2]_t=\\rho\\,E[g^2]_{t-1}+(1-\\rho)\\,g_t^2,\\qquad \\text{RMS}[g]_t=\\sqrt{E[g^2]_t+\\epsilon}',
  d:'AdaGrad의 무한 누적합을 지수감쇠 평균으로 대체한 부분. $\\rho$ 는 모멘텀의 감쇠상수와 같은 역할이고, $\\epsilon$ 은 분모가 0이 되는 것을 막는 안정화 상수다.'},
 {expr:'Δxt = −( RMS[Δx]t−1 / RMS[g]t ) · gt',
  tex:'\\Delta x_t=-\\dfrac{\\text{RMS}[\\Delta x]_{t-1}}{\\text{RMS}[g]_t}\\,g_t',
  d:'최종 업데이트 규칙. 분자는 "최근 파라미터가 실제로 얼마나 움직였는가", 분모는 "최근 그래디언트가 얼마나 컸는가"를 의미해서, 그래디언트가 큰데 실제 움직임은 작았던 차원은 스텝을 줄이고 그 반대는 늘린다 — 헤시안 역수의 1차 근사다.'},
 {expr:'E[Δx²]t = ρ E[Δx²]t−1 + (1−ρ) Δxt²',
  tex:'E[\\Delta x^2]_t=\\rho\\,E[\\Delta x^2]_{t-1}+(1-\\rho)\\,\\Delta x_t^2',
  d:'다음 스텝의 분자로 쓰일 $\\text{RMS}[\\Delta x]_t$ 를 만들기 위해 방금 적용한 업데이트 크기를 같은 방식으로 누적한다.'}
],

numbers:[
 {k:'MNIST 6-epoch 테스트 오류 (최선 하이퍼파라미터)', v:'2.00%', d:'ρ=0.95, ε=1e-6 — Schaul et al.(2.10%)보다 낮음'},
 {k:'하이퍼파라미터 민감도(표 2)', v:'1.83% ~ 2.32%', d:'ρ∈{0.9,0.95,0.99}, ε∈{1e-2…1e-8} 전 범위에서 변동폭이 작음'},
 {k:'SGD 민감도 대비(표 1)', v:'2.26% ~ 58.10%', d:'같은 조건에서 학습률 하나만 바꿔도 오류가 25배 이상 요동'},
 {k:'분산 음성 인식 실험', v:'replica 100 · 200개', d:'중앙 파라미터 서버 구조에서도 ADAGRAD보다 빠르게 수렴'},
 {k:'계산 오버헤드', v:'SGD 대비 trivial', d:'추가 순전파·역전파 없이 그래디언트당 몇 개의 스칼라 연산만 추가'}
],

impact:'학습률이라는 가장 손이 많이 가는 하이퍼파라미터 튜닝을 사실상 없앴다. 헤시안을 명시 계산하지 않고도 파라미터-단위로 맞춘 업데이트를 만든다는 아이디어와, 그래디언트 제곱의 무한 누적을 지수이동평균으로 바꾼다는 두 장치는 이후 나온 거의 모든 적응적 최적화기의 표준 부품이 됐다. 특히 제곱 그래디언트의 지수이동평균이라는 축은 몇 달 뒤 나온 [Adam](#/p/adam)에도 (모멘텀 항과 함께) 그대로 이어진다.',

legacy:[
 '**제곱 그래디언트 지수이동평균이 표준 관행이 됨** — [Adam](#/p/adam)의 $v_t$ 항이 이 논문의 $E[g^2]_t$ 와 사실상 같은 메커니즘',
 '**AdaGrad 감쇠 문제의 공식적 해법으로 자리잡음** — RMSprop(비공식 발표, 같은 해)과 함께 "지수이동평균으로 고친 AdaGrad" 계열을 형성',
 '**[seq2seq](#/p/seq2seq)·요약 계열의 실전 옵티마이저로 채택** — [abstractive-rnn](#/p/abstractive-rnn) 등 초기 신경망 요약·번역 논문들이 학습률 튜닝을 피하려 AdaDelta를 그대로 씀',
 '**"학습률을 없앤다"는 목표 자체는 이후 [Adam](#/p/adam)·[AdamW](#/p/adamw)에서 초기 학습률 하나 + 감쇠 스케줄로 절충됨** — 완전한 무튜닝은 실무에서 오래가지 못했다'
],

pitfalls:[
 '**"학습률 하이퍼파라미터가 전혀 없다"는 과장이다.** 식에서 $\\eta$ 는 사라졌지만 감쇠율 $\\rho$ 와 안정화 상수 $\\epsilon$ 이라는 두 하이퍼파라미터가 남는다. 논문 스스로도 "hyper parameters가 있지만 결과를 크게 바꾸지 않는다"고 표현하지, 하이퍼파라미터가 없다고 주장하지 않는다.',
 '**모멘텀보다 항상 좋은 것은 아니다.** 저자가 Fig. 1 논의에서 명시하듯, 학습 후반부에는 제대로 튜닝된 모멘텀이 AdaDelta를 능가했다 — 명시적 annealing이 없는 것이 오히려 후반 수렴에서 손해라고 결론에서 밝힌다.',
 '**연도·발표처를 Zeiler 2012 tech report로 정확히 표기한다.** ICLR·NeurIPS 정식 심사를 거친 논문이 아니라 arXiv 단독 게재 기술 보고서이며, 저자는 Google 인턴 시절 작업임을 각주에 명시했다.'
],

figures:[
 {f:'fig1-mnist-comparison.png',
  cap:'MNIST 50 epoch 학습 곡선. AdaGrad(연두)는 초반 10 epoch까지 가장 빠르지만 이후 분모가 계속 커지며 정체되는 반면, AdaDelta(파랑)는 초반 속도를 유지하면서도 계속 오류를 낮춰 모멘텀에 가까운 수준까지 수렴한다.',
  src:'원문 Figure 1, p.4'}
],

quotes:[
 {t:'The method requires no manual tuning of a learning rate and appears robust to noisy gradient information, different model architecture choices, various data modalities and selection of hyperparameters.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1212.5701 — ADADELTA: An Adaptive Learning Rate Method', u:'https://arxiv.org/abs/1212.5701'}
]
});
