WIKI.paper({
slug:'gelu',
venue:'arXiv 2016 (2023년까지 개정)',
authors:'Dan Hendrycks (UC Berkeley) & Kevin Gimpel (TTI-Chicago)',
arxiv:'1606.08415',

tldr:'ReLU의 하드한 0/1 게이팅을 **입력값이 표준정규분포에서 얼마나 큰지에 대한 확률**로 부드럽게 바꾼 활성함수 $x\\Phi(x)$. [Transformer](#/p/transformer)·[BERT](#/p/bert)·[GPT](#/p/gpt1) 계열이 사실상 전부 이걸 쓰면서 FFN의 기본 비선형성이 됐다.',

context:'ReLU는 입력의 **부호**만 보고 통과시킬지 죽일지 결정한다 — $x>0$ 이면 그대로, 아니면 0. 이 결정은 입력이 아무리 0에 가까워도 완전히 딱딱하게 갈린다. 한편 [dropout](#/p/dropout)·zoneout 같은 확률적 정규화는 뉴런의 출력에 **무작위로** 0 또는 1을 곱해 앙상블 효과를 낸다. 문제는 이 둘이 서로 무관하게 발전해왔다는 것이다 — 비선형성은 입력값을 보고 결정을 내리지만 그 결정에 확률이 없고, 확률적 정규화는 확률적이지만 입력값을 보지 않는다. 저자들은 "입력값에 의존하면서도 확률적인 게이트"를 만들면 이 둘을 하나로 합칠 수 있다고 본다.',

ideas:[
 {h:'게이트를 입력 자신의 CDF로 확률화한다',
  lead:'m ~ Bernoulli(Φ(x))로 게이트를 뽑아 입력이 클수록 살아남을 확률을 높인다.',
  d:'뉴런 입력 $x$ 에 $m \\sim \\text{Bernoulli}(\\Phi(x))$ 로 뽑은 0/1 마스크를 곱한다. 여기서 $\\Phi$ 는 표준정규분포의 누적분포함수(CDF)다. $x$ 가 클수록 $\\Phi(x)$ 가 1에 가까워 거의 항상 살아남고, $x$ 가 작을수록(음수로 클수록) 거의 항상 죽는다. ReLU의 "부호로 딱 자르기"와 dropout의 "무작위로 끄기", zoneout의 "무작위로 그대로 두기"를 한 확률분포 안에 합친 것이다.'},
 {h:'그 기댓값을 결정론적 함수로 취한다',
  lead:'확률적 게이트의 기댓값을 취하면 xΦ(x)라는 매끈한 함수가 나온다.',
  d:'실제 추론에서는 매번 무작위로 게이트를 뽑을 수 없으니, [dropout](#/p/dropout)의 테스트 시 근사와 같은 논리로 **기댓값**을 취한다. $\\mathbb{E}[m\\cdot x] = \\Phi(x)\\cdot x + (1-\\Phi(x))\\cdot 0 = x\\Phi(x)$ 가 곧 GELU다. 확률적 정규화를 확률화된 게이트로 일반화하고, 그 게이트의 기댓값을 새 활성함수로 정의한다는 유도 과정 자체가 이 논문의 핵심 기여다.'},
 {h:'ReLU와 달리 음수 구간에서 비단조다',
  lead:'입력이 조금 음수일 때 오히려 값을 낮췄다 올리는 볼록한 골짜기를 만든다.',
  d:'ReLU는 $x<0$ 에서 항상 정확히 0이고, ELU는 매끄럽지만 단조증가한다. GELU는 $x$ 가 0보다 살짝 작을 때 출력이 **음의 방향으로 살짝 파였다가** 다시 올라오는 비단조 곡선을 그린다(원문 Figure 1). 이 곡률 때문에 GELU는 어디서나 미분 가능하고, 작은 음수 입력에도 완전히 죽지 않는 gradient를 남긴다.'},
 {h:'저렴한 근사식으로 실무 속도를 확보한다',
  lead:'erf 계산이 비싸 tanh·sigmoid 기반의 근사식을 실무에서 대신 쓴다.',
  d:'정확한 정의 $x\\Phi(x) = \\frac{x}{2}[1+\\text{erf}(x/\\sqrt{2})]$ 는 오차함수 `erf`를 계산해야 해 느리다. 논문은 두 근사식 — $0.5x(1+\\tanh[\\sqrt{2/\\pi}(x+0.044715x^3)])$ 와 더 거친 $x\\sigma(1.702x)$ — 을 제시하고, 모든 실험에 **tanh 근사**를 사용한다. 오늘날 프레임워크의 `gelu(approximate="tanh")`가 바로 이 식이다.'}
],

diagram:{type:'compare', cap:'입력값을 보고 결정하되, 그 결정을 확률로 만드는 것이 유도의 핵심이다.',
 left:{t:'ReLU: 결정론적 하드 게이트',
  items:['부호만 보고 0 또는 1로 딱 자름','미분 불가능한 꺾임점 (x=0)','작은 음수 입력의 gradient는 정확히 0','확률적 정규화(dropout)와는 별개 개념']},
 right:{t:'GELU: 확률적 게이트의 기댓값',
  items:['확률적 게이트 m~Bernoulli(Φ(x))의 기댓값','모든 구간에서 매끄럽고 미분 가능','작은 음수 구간에서 비단조(살짝 파임)','dropout·zoneout과 같은 계열로 유도됨']}},

math:[
 {expr:'GELU(x) = x·P(X ≤ x) = x·Φ(x) = x · ½[1 + erf(x/√2)]',
  tex:'\\text{GELU}(x) = x\\,P(X\\le x) = x\\Phi(x) = x\\cdot\\tfrac{1}{2}\\Big[1+\\text{erf}\\big(x/\\sqrt{2}\\big)\\Big]',
  d:'$X \\sim \\mathcal{N}(0,1)$ 일 때 $\\Phi(x)$ 는 "이 입력이 다른 입력들보다 얼마나 큰가"에 대한 확률이다. GELU는 그 확률만큼 $x$ 를 통과시키고 나머지는 죽인다 — ReLU의 0/1 게이팅을 연속 확률로 부드럽게 만든 것.'},
 {expr:'GELU(x) ≈ 0.5x(1 + tanh[√(2/π)·(x + 0.044715x³)])   ≈   xσ(1.702x)',
  tex:'\\text{GELU}(x)\\approx 0.5x\\Big(1+\\tanh\\big[\\sqrt{2/\\pi}\\,(x+0.044715x^3)\\big]\\Big) \\;\\approx\\; x\\,\\sigma(1.702x)',
  d:'`erf` 없이 계산 가능한 두 근사식. 첫 번째(tanh)가 더 정확해 논문 실험 전부와 이후 대부분의 라이브러리 구현이 이것을 쓴다. 두 번째($x\\sigma(1.702x)$)는 더 거칠지만 sigmoid 하나로 끝나 더 싸다.'}
],

numbers:[
 {k:'CIFAR-10 median error', v:'GELU 7.89% vs ReLU 8.16% vs ELU 8.41%', d:'동일 구조에서 activation만 교체, 3회 실행 중앙값'},
 {k:'CIFAR-100 median error', v:'GELU 20.74% vs ReLU 21.77%', d:'40층 wide residual network(widening factor 4)'},
 {k:'TIMIT 음소 인식 median error', v:'29.3%', d:'검증 손실 최소 지점에서 선택. 다른 activation 대비 GELU가 가장 낮음'},
 {k:'MNIST 실험 구조', v:'8층 · 폭 128', d:'배치 128, 50 epoch, dropout 유무 양쪽에서 GELU가 가장 낮은 log loss'},
 {k:'추가 하이퍼파라미터', v:'0개', d:'µ=0, σ=1로 고정 — ELU의 α처럼 튜닝할 값이 없다'}
],

impact:'GELU는 활성함수 선택을 다시 "그냥 ReLU"에서 벗어나게 만들었다. 결정적 계기는 이 논문 자체가 아니라 **채택**이다 — [BERT](#/p/bert)가 FFN 비선형성으로 GELU를 쓰면서 이후 [GPT](#/p/gpt1) 계열을 포함한 거의 모든 [Transformer](#/p/transformer) 기반 언어모델의 기본값이 됐다. ReLU의 sparsity(정확히 0)를 잃는 대신 매끄러운 gradient를 얻는 트레이드오프가, 대형 모델을 깊게 쌓고 안정적으로 학습시키는 데 유리하다고 경험적으로 굳어졌다. 이후 [Swish/SiLU](https://arxiv.org/abs/1710.05941)($x\\sigma(x)$)처럼 "부드러운 게이트" 계열 활성함수 연구를 촉발한 시초이기도 하다.',

legacy:[
 '**[BERT](#/p/bert) 채택** — FFN 내부 비선형성을 ReLU에서 GELU로 바꾸며 이후 encoder 계열의 표준이 됨',
 '**GPT 계열 전파** — [GPT](#/p/gpt1)·GPT-2·GPT-3와 그 후속 LLM 대부분이 FFN에 GELU(주로 tanh 근사)를 그대로 사용',
 '**부드러운 게이트 계열 확장** — 같은 유도 방식으로 얻은 Swish/SiLU가 EfficientNet 등에 쓰이며 "매끄러운 자기 게이팅" 활성함수 연구가 갈래를 이룸',
 '**GLU 변형과의 결합** — GEGLU처럼 GELU를 gated linear unit과 합친 FFN 변형이 이후 LLaMA 등 최신 아키텍처의 FFN으로 자리잡음'
],

pitfalls:[
 '**"GELU가 항상 ReLU보다 낫다"는 이 논문의 주장이 아니다.** 여러 과제에서 median error가 낮았다는 실험 결과이지, 모든 상황에서의 이론적 우위를 증명한 것은 아니다.',
 '**정확한 정의와 실무 구현이 다르다.** `erf` 기반 정확한 식과 tanh/sigmoid 근사식은 값이 미세하게 다르며, 프레임워크마다 기본 구현(exact vs tanh vs sigmoid)이 다를 수 있어 재현 시 확인이 필요하다.',
 '**ReLU의 정확한 0 sparsity를 잃는다.** GELU는 음수 입력에서도 정확히 0이 되지 않으므로(작은 음수를 남김), ReLU가 주는 명시적 희소 활성화 구조에 의존하는 최적화·프루닝 기법과는 궁합이 다를 수 있다.'
],

figures:[
 {f:'fig1-gelu-curve.png',
  cap:'x<0 구간에서 GELU(파랑)가 ReLU(주황, 항상 0)와 ELU(초록, 단조)와 달리 살짝 아래로 파였다가 올라오는 비단조 곡선을 그린다. x>0에서는 셋 다 거의 겹친다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'The GELU nonlinearity weights inputs by their value, rather than gates inputs by their sign as in ReLUs.',
  src:'Abstract, p.1'},
 {t:'In this work, we introduce a new nonlinearity, the Gaussian Error Linear Unit (GELU). It relates to stochastic regularizers in that it is the expectation of a modification to Adaptive Dropout.',
  src:'Section 1, p.1'}
],

links:[
 {t:'arXiv 1606.08415 — Gaussian Error Linear Units (GELUs)', u:'https://arxiv.org/abs/1606.08415'},
 {t:'GELUs 공식 코드', u:'https://github.com/hendrycks/GELUs'}
]
});
