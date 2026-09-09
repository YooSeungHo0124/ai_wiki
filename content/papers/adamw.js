WIKI.paper({
slug:'adamw',
venue:'ICLR 2019',
authors:'Ilya Loshchilov & Frank Hutter (University of Freiburg)',
arxiv:'1711.05101',

tldr:'[Adam](#/p/adam)에 L2 정규화를 그대로 얹으면 **weight decay와 같지 않다**는 것을 증명하고, decay를 gradient 기반 갱신에서 분리(decouple)해 원래의 weight decay 효과를 되살린 옵티마이저. 오늘날 거의 모든 대형 모델 학습의 실질적 기본값이 됐다.',

context:'SGD에서는 L2 정규화와 weight decay가 **수학적으로 동일**하다 — 손실에 $\\frac{\\lambda}{2}\\|\\theta\\|_2^2$ 를 더하는 것과, 매 스텝 가중치에 $(1-\\lambda)$ 를 곱하는 것이 학습률로 재매개변수화하면 같은 갱신식이 된다. 문제는 [Adam](#/p/adam)처럼 파라미터마다 다른 스케일로 gradient를 나누는 **적응적** 옵티마이저다. 딥러닝 라이브러리들은 여기에도 L2 정규화를 그대로 얹어 "weight decay"라 불러왔지만, 저자들은 이것이 착각이라고 지적한다. 당시 Adam은 이미지 분류 같은 과제에서 잘 튜닝된 SGD+모멘텀에 여전히 밀리고 있었고([Wilson et al. 2017]의 일반화 격차 논쟁), 이 논문은 그 원인의 상당 부분이 **정규화 항이 적응적 분모에 함께 나눠지면서 망가진다**는 데 있음을 보인다.',

ideas:[
 {h:'L2 정규화 ≠ weight decay, Adam에서는',
  lead:'적응적 분모가 정규화 항까지 나눠버려 SGD와의 동치가 깨진다.',
  d:'SGD에서 L2 정규화는 gradient에 $\\lambda\\theta$ 를 더하는 것으로 구현된다. Adam은 이렇게 만들어진 gradient 전체를 $\\sqrt{\\hat{v}_t}$ 로 나누는데, 이 $\\hat{v}_t$ 는 **손실 gradient의 과거 크기**를 반영한다. 결과적으로 큰 gradient를 지속적으로 받아온 파라미터는 정규화 항까지 함께 작게 나뉘어 **덜 정규화**되고, gradient가 작았던 파라미터는 상대적으로 **더 강하게** 정규화된다. 저자들은 이를 Proposition 2로 증명한다 — 적응적 옵티마이저에서는 어떤 L2 계수를 골라도 decoupled weight decay와 동치인 손실 함수가 존재하지 않는다.'},
 {h:'해법: decay를 갱신식에서 분리한다',
  lead:'weight decay 항을 gradient 계산에서 떼어 갱신 마지막에 직접 더한다.',
  d:'`AdamW`는 $g_t \\leftarrow \\nabla f_t(\\theta_{t-1})$ 는 순수 손실 gradient로만 두고, 파라미터 갱신 마지막 줄에 $-\\eta_t\\lambda\\theta_{t-1}$ 을 **직접** 더한다. 즉 decay가 더 이상 $\\sqrt{\\hat{v}_t}$ 로 나뉘지 않고 모든 파라미터에 **같은 비율** $\\lambda$ 로 적용된다. Adam 알고리즘 자체는 그대로 두고 단 한 줄의 위치만 옮긴 수정이다.'},
 {h:'학습률과 weight decay가 분리된다',
  lead:'두 하이퍼파라미터의 최적값이 서로 독립적으로 튜닝 가능해진다.',
  d:'L2 정규화 방식에서는 $\\lambda$ 의 최적값이 학습률 $\\alpha$ 에 강하게 얽혀 있어(원 논문 Figure 2), 최적점이 대각선을 따라 형성된다. Decoupled weight decay를 쓰면 이 최적 영역이 **축에 정렬**된다 — 학습률을 대충 잡아둔 채 weight decay만 따로 튜닝해도 된다. 하이퍼파라미터 탐색 비용을 크게 줄이는 실무적 이득이다.'},
 {h:'학습률 스케줄과 결합하면 더 좋아진다',
  lead:'cosine annealing 같은 스케줄을 곱해 SGDR/AdamWR로 확장한다.',
  d:'논문은 decoupled weight decay에 스케줄 배수 $\\eta_t$ 를 곱하는 형태로 일반화하고, warm restarts(SGDR, 같은 저자의 이전 연구)를 결합한 AdamWR을 함께 제시한다. Adam은 파라미터별로 이미 적응적이라 학습률 스케줄이 덜 중요하다는 통념과 달리, **스케줄을 곱해주는 것만으로도 성능이 크게 개선**됨을 보여, 이후 LLM 학습의 warmup+cosine decay 관행에 근거를 더했다.'}
],

diagram:{type:'compare', cap:'같은 gradient, 같은 λ 라도 어디에 decay를 넣느냐에 따라 결과가 다르다.',
 left:{t:'Adam + L2 정규화',
  items:['decay가 손실 gradient에 합쳐짐','√v̂로 함께 나뉘어 파라미터마다 다르게 약화','α와 λ의 최적값이 서로 얽힘','이미지 분류에서 SGD+모멘텀에 밀림']},
 right:{t:'AdamW: decay 분리',
  items:['decay를 갱신 마지막 줄로 분리','모든 파라미터에 동일 비율로 적용','α와 λ가 독립적으로 튜닝 가능','SGD+모멘텀과 대등하거나 능가']}},

math:[
 {expr:'g_t = ∇f_t(θ_{t−1}),   θ_t = θ_{t−1} − η_t( α·m̂_t/(√v̂_t+ε) + λθ_{t−1} )',
  tex:'g_t=\\nabla f_t(\\theta_{t-1}), \\qquad \\theta_t = \\theta_{t-1} - \\eta_t\\!\\left(\\alpha\\frac{\\hat{m}_t}{\\sqrt{\\hat{v}_t}+\\varepsilon} + \\lambda\\theta_{t-1}\\right)',
  d:'[Adam](#/p/adam)의 $m_t$, $v_t$, $\\hat{m}_t$, $\\hat{v}_t$ 계산은 그대로다. 차이는 $g_t$ 에 $\\lambda\\theta_{t-1}$ 을 더하지 않고, 대신 마지막 갱신식에 $\\lambda\\theta_{t-1}$ 을 **직접** 더한다는 것뿐이다.'},
 {expr:'θ_{t+1} = θ_t − αMₜ∇f_t(θ_t) − αMₜλ·θ_t   (L2, Mₜ가 나눔)   vs.   θ_{t+1} = (1−λ)θ_t − αMₜ∇f_t(θ_t)   (decoupled)',
  tex:'\\underbrace{\\theta_{t+1}=\\theta_t-\\alpha \\mathbf{M}_t\\nabla f_t(\\theta_t)}_{\\text{L2: }\\lambda\\theta_t\\text{ 도 }\\nabla f_t\\text{ 에 섞여 }\\mathbf{M}_t\\text{ 로 나뉨}} \\quad\\text{vs.}\\quad \\underbrace{\\theta_{t+1}=(1-\\lambda)\\theta_t-\\alpha \\mathbf{M}_t\\nabla f_t(\\theta_t)}_{\\text{decoupled: 모든 }\\theta_t\\text{ 에 동일 비율}}',
  d:'$\\mathbf{M}_t$ 가 대각 전처리 행렬(적응적 학습률)일 때 둘의 차이가 논문 Proposition 2·3의 핵심이다. $\\mathbf{M}_t = k\\mathbf{I}$ (SGD처럼 스칼라)면 둘은 동치이지만, $\\mathbf{M}_t$ 가 파라미터마다 다르면 동치가 깨진다.'}
],

numbers:[
 {k:'CIFAR-10 test error 개선', v:'15%', d:'기본 학습률 α=0.001에서 AdamW가 Adam(L2) 대비 상대 개선. ImageNet32x32에서도 동일'},
 {k:'실험 모델', v:'26-2×64d / 2×96d ResNet', d:'CIFAR-10/100 및 ImageNet32×32에서 SGDW·AdamW 비교'},
 {k:'학습 budget 범위', v:'100 ~ 1800 epoch', d:'다양한 학습률 스케줄(고정·step-drop·cosine annealing)에서 일관되게 decoupled decay가 우세'},
 {k:'AdamWR 도달 배속', v:'최대 10배', d:'warm restarts 결합 시 첫 restart에서 SGDWR·AdamWR가 CIFAR-10·ImageNet32x32에 더 빨리 도달'},
 {k:'CIFAR-10 SOTA', v:'2.86%', d:'SGDWR로 학습한 wide residual net이 당시 신규 SOTA에 도달'}
],

impact:'AdamW는 새로운 능력을 추가하지 않았지만 **Adam이 실패하던 자리를 없앴다**. 이 논문 이전에는 이미지 분류처럼 weight decay가 중요한 과제에서 "Adam은 SGD+모멘텀보다 일반화가 나쁘다"는 것이 정설이었는데, decoupled weight decay 하나로 그 격차가 대부분 사라졌다. 오늘날 [Transformer](#/p/transformer) 계열 대형 모델 — [BERT](#/p/bert), [GPT-3](#/p/gpt3), [LLaMA](#/p/llama) — 의 학습 레시피는 사실상 예외 없이 Adam이 아니라 **AdamW**이며, PyTorch·TensorFlow 모두 `AdamW`를 표준 옵티마이저 클래스로 내장하게 됐다.',

legacy:[
 '**PyTorch/TensorFlow 표준화** — `torch.optim.AdamW`가 사실상 LLM·ViT 사전학습의 기본 옵티마이저 클래스로 굳어짐',
 '**LLM 학습 레시피의 일부로 흡수** — [GPT-3](#/p/gpt3)·[LLaMA](#/p/llama) 등 대형 모델 논문의 "학습 세팅" 절이 AdamW + warmup + cosine decay를 거의 그대로 반복',
 '**AMSGrad와 별개로 계속 채택** — 같은 시기 제기된 Adam 수렴 증명 오류(AMSGrad)는 실무에 거의 안 쓰였지만, weight decay 분리는 거의 보편적으로 채택됨',
 '**하이퍼파라미터 탐색 관행 변화** — 학습률과 weight decay를 독립적으로 그리드 탐색하는 것이 표준 관행이 됨'
],

pitfalls:[
 '**`weight_decay` 인자를 아무 옵티마이저에나 넣으면 같은 효과라고 착각하기 쉽다.** 이 논문의 요점은 정확히 그 반대다 — 적응적 옵티마이저에서 "L2 정규화 계수"와 "decoupled weight decay 계수"는 다른 양이며, 같은 숫자를 넣어도 다르게 작동한다.',
 '**PyTorch의 `Adam(weight_decay=...)`은 이 논문 이전 방식(L2)이고, `AdamW(weight_decay=...)`가 이 논문의 방식이다.** 두 클래스를 혼동해 코드를 옮기면 재현되지 않는 결과가 나온다.',
 '**논문의 수치 검증은 CIFAR-10/100·ImageNet32×32의 CNN(ResNet)에서 나왔다.** LLM 스케일에서의 우위는 이후 커뮤니티 관행으로 굳어진 것이지, 이 논문이 직접 대형 언어모델을 학습시켜 보인 것은 아니다.'
],

figures:[
 {f:'fig-algo2-adamw.png',
  cap:'6번째 줄(분홍) g_t는 순수 손실 gradient이고 여기엔 λθ가 섞이지 않는다. 대신 12번째 줄(초록) 최종 갱신에서만 λθ_{t-1}이 더해진다 — 이 한 줄의 위치 이동이 논문의 전부다.',
  src:'원문 Algorithm 2, p.3'},
 {f:'fig2-heatmap.png',
  cap:'왼쪽(Adam+L2)은 최적 영역(검은 원, 파란 영역)이 대각선으로 기울어 학습률과 정규화 계수가 얽혀 있다. 오른쪽(AdamW)은 같은 영역이 세로로 곧게 서서 두 하이퍼파라미터가 독립적으로 튜닝된다.',
  src:'원문 Figure 2, p.6 (하단 Adam/AdamW 행)'}
],

quotes:[
 {t:'L2 regularization and weight decay regularization are equivalent for standard stochastic gradient descent (when rescaled by the learning rate), but as we demonstrate this is not the case for adaptive gradient algorithms, such as Adam.',
  src:'Abstract, p.1'},
 {t:'We decouple weight decay and loss-based gradient updates in Adam as shown in line 12 of Algorithm 2; this gives rise to our variant of Adam with decoupled weight decay (AdamW).',
  src:'Section 2, p.3'}
],

links:[
 {t:'arXiv 1711.05101 — Decoupled Weight Decay Regularization', u:'https://arxiv.org/abs/1711.05101'},
 {t:'AdamW-and-SGDW (저자 공식 코드)', u:'https://github.com/loshchil/AdamW-and-SGDW'}
]
});
