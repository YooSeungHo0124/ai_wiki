WIKI.paper({
slug:'adam',
venue:'ICLR 2015',
authors:'Diederik P. Kingma & Jimmy Lei Ba (Univ. of Amsterdam · Univ. of Toronto)',
arxiv:'1412.6980',

tldr:'gradient의 1차 모멘트(방향)와 2차 모멘트(크기)를 각각 지수이동평균으로 추적해, **파라미터마다 스텝 크기를 자동으로 조절하는** 옵티마이저. 기본값 그대로 두어도 대부분 학습이 굴러가면서 "learning rate 튜닝"이라는 공정 자체를 크게 줄였다.',

context:'[역전파](#/p/backprop)는 gradient를 주지만, 그 gradient로 얼마나 움직일지는 알려주지 않는다. 순수 SGD는 모든 파라미터에 같은 learning rate를 쓰기 때문에 곡률이 방향마다 다른 손실 지형에서 심하게 진동하고, 값 하나를 잘못 잡으면 발산하거나 정체한다. 2011~2013년의 대안들은 각각 결함이 있었다 — **AdaGrad**는 gradient 제곱을 계속 누적하기만 해서 학습이 진행될수록 스텝이 0으로 말라죽고, **RMSProp**은 누적을 지수이동평균으로 바꿔 이를 고쳤지만 모멘텀과의 결합이 임시방편이었으며 초기 스텝의 편향 문제가 남아 있었다. 게다가 dropout·미니배치·희소 gradient가 표준이 되면서 **잡음이 큰 목적함수**를 다루는 것이 기본 상황이 됐다. Adam은 이 조각들을 하나의 알고리즘으로 정리한다.',

ideas:[
 {h:'두 개의 모멘트를 동시에 추적한다',
  lead:'gradient의 평균 방향과 제곱 크기를 함께 추적해 스텝을 조절한다.',
  d:'$m_t$ 는 gradient의 지수이동평균(1차 모멘트 = 어느 방향으로 가는가), $v_t$ 는 gradient 제곱의 지수이동평균(2차 모멘트 = 그 방향이 얼마나 요동치는가)이다. 갱신은 $m_t/\\sqrt{v_t}$ 로, **일관되게 같은 부호가 나오는 방향은 크게, 부호가 계속 뒤집히는 방향은 작게** 움직인다. 이름 Adam은 **ada**ptive **m**oment estimation 에서 왔다.'},
 {h:'bias correction: 0에서 시작한 평균을 보정한다',
  lead:'0 초기화가 만드는 초반 편향을 나눗셈 한 번으로 정확히 상쇄한다.',
  d:'$m_0 = v_0 = 0$ 으로 초기화하면 초반 몇 스텝의 추정치는 0 쪽으로 심하게 치우친다. $\\beta_2 = 0.999$ 일 때 첫 스텝의 $v_1$ 은 실제 크기의 0.001배에 불과하다. Adam은 $\\hat{m}_t = m_t/(1-\\beta_1^t)$, $\\hat{v}_t = v_t/(1-\\beta_2^t)$ 로 나눠 이를 정확히 상쇄한다. **논문에서 RMSProp+모멘텀과 Adam을 구별하는 실질적 차이가 사실상 이 두 줄이다** — 이것이 없으면 초기 스텝이 비정상적으로 커지거나 warm-up이 필요해진다.'},
 {h:'스케일 불변성과 스텝 크기의 상한',
  lead:'유효 스텝이 대략 α로 상한이 걸려 과제가 바뀌어도 같은 α가 통한다.',
  d:'분자와 분모에 gradient가 각각 1차·2차로 들어가므로, 손실 함수에 상수를 곱해도 갱신량이 거의 변하지 않는다(대각 재스케일링 불변). 게다가 유효 스텝 크기가 대략 $\\alpha$ 로 **상한이 걸린다**. 즉 $\\alpha$ 가 "한 스텝에 파라미터가 얼마나 움직일 수 있는가"의 신뢰 영역 반경처럼 해석되고, 이 덕분에 모델·층·과제가 바뀌어도 같은 $\\alpha$ 가 대체로 통한다.'},
 {h:'희소 gradient에 강하다',
  lead:'드물게 갱신되는 파라미터일수록 v가 작아 상대적으로 큰 스텝을 받는다.',
  d:'임베딩처럼 대부분의 스텝에서 gradient가 0인 파라미터는, SGD에서는 어쩌다 오는 갱신이 통째로 묻힌다. Adam은 그 파라미터의 $v$ 도 작게 유지되므로 $m/\\sqrt{v}$ 가 상대적으로 커져 **드물게 등장하는 파라미터도 제대로 학습된다**. NLP 모델이 특히 Adam 계열을 벗어나지 못하는 이유가 여기에 있다.'},
 {h:'비용은 파라미터당 상태 2개',
  lead:'m, v 두 벡터만 추가로 저장하면 되는 값싼 원소별 연산이다.',
  d:'추가로 필요한 것은 $m$, $v$ 두 벡터뿐이고 계산은 원소별 연산 몇 개다. 구현이 10줄이라는 점이 채택 속도를 결정했다. 다만 이 "상태 2개"는 대형 모델 시대에 **옵티마이저 상태가 모델 가중치의 2배 메모리를 먹는다**는 형태로 되돌아온다.'}
],

diagram:{type:'compare', cap:'같은 gradient를 받아도 무엇을 기억하느냐가 다르다.',
 left:{t:'SGD·AdaGrad·RMSProp',
  items:['SGD: 전 파라미터 동일 learning rate','모멘텀은 방향만, 스케일 조절 없음','AdaGrad: 제곱 누적 → 스텝이 0으로 말라죽음','RMSProp: EMA로 고쳤으나 초기 편향 미보정','과제마다 lr 그리드 탐색이 필수']},
 right:{t:'Adam: 1차 + 2차 모멘트',
  items:['m: 방향, v: 요동 — 둘 다 EMA로 추적','편향 보정된 m̂, v̂ 사용','유효 스텝이 대략 α로 상한','희소 gradient 파라미터도 제대로 갱신','기본값 그대로 대부분 통함']}},

math:[
 {expr:'m_t = β₁ m_{t−1} + (1−β₁) g_t,   v_t = β₂ v_{t−1} + (1−β₂) g_t²',
  tex:'m_t = \\beta_1 m_{t-1} + (1-\\beta_1) g_t, \\qquad v_t = \\beta_2 v_{t-1} + (1-\\beta_2) g_t^2',
  d:'gradient와 그 제곱의 지수이동평균. $\\beta_1=0.9$ 는 최근 약 10스텝, $\\beta_2=0.999$ 는 약 1000스텝의 통계를 본다는 뜻이다.'},
 {expr:'m̂_t = m_t / (1 − β₁ᵗ),   v̂_t = v_t / (1 − β₂ᵗ)',
  tex:'\\hat{m}_t = \\dfrac{m_t}{1-\\beta_1^t}, \\qquad \\hat{v}_t = \\dfrac{v_t}{1-\\beta_2^t}',
  d:'0 초기화가 만드는 편향의 정확한 해석적 보정. $t$ 가 커지면 $\\beta^t \\to 0$ 이라 보정 계수는 1로 수렴하므로, 초반에만 효력을 갖는다.'},
 {expr:'θ_t = θ_{t−1} − α · m̂_t / (√v̂_t + ε)',
  tex:'\\theta_t = \\theta_{t-1} - \\alpha \\cdot \\dfrac{\\hat{m}_t}{\\sqrt{\\hat{v}_t} + \\varepsilon}',
  d:'최종 갱신. $\\varepsilon$ 은 0으로 나누는 것을 막는 안정화 항이지만, 값에 따라 실질적으로 "적응성을 얼마나 끌 것인가"를 조절하는 하이퍼파라미터로도 작동한다.'}
],

numbers:[
 {k:'기본 스텝 크기', v:'α = 0.001', d:'논문 권장값. 오늘날 대형 Transformer 사전학습은 보통 이보다 작은 1e-4 대역을 쓴다'},
 {k:'모멘트 감쇠', v:'β₁ = 0.9, β₂ = 0.999', d:'10년이 지나도 사실상 그대로 쓰이는 값'},
 {k:'안정화 항', v:'ε = 10⁻⁸', d:'혼합정밀도 학습에서는 언더플로 때문에 1e-6 등으로 키우는 것이 흔한 실무 조정'},
 {k:'추가 메모리', v:'파라미터당 상태 2개', d:'가중치 대비 **2배**. 7B 모델을 fp32 Adam으로 돌리면 옵티마이저 상태만 56GB'},
 {k:'AdaMax 기본 스텝', v:'α = 0.002', d:'$L^2$ 대신 $L^\\infty$ 노름을 쓰는 논문 내 변형'},
 {k:'수렴 보장', v:'평균 regret O(1/√T)', d:'온라인 볼록 최적화 가정 하의 결과 — 이 증명은 이후 반례가 제시된다'}
],

impact:'Adam은 새로운 능력을 만든 것이 아니라 **학습을 지루하게 만들었다**. 논문 이전에는 새 아키텍처를 시도할 때 optimizer와 learning rate 스케줄을 함께 탐색해야 했지만, 이후로는 "일단 Adam 기본값"이 출발점이 되면서 연구의 병목이 최적화에서 **아키텍처와 데이터**로 옮겨갔다. [Transformer](#/p/transformer)·[BERT](#/p/bert)·[GPT-3](#/p/gpt3)·[LLaMA](#/p/llama)까지 현대 대형 모델의 학습 레시피는 사실상 예외 없이 Adam 계열(AdamW) + warmup + cosine decay이며, [스케일링 법칙](#/p/scaling-laws)이나 [Chinchilla](#/p/chinchilla)처럼 "연산량만 정하면 성능이 예측된다"는 논의도 옵티마이저가 변수가 아니게 된 뒤에야 가능해졌다.',

legacy:[
 '**AdamW (Loshchilov & Hutter, 2017)** — Adam의 L2 정규화가 적응적 분모에 나눠져 weight decay로 제대로 작동하지 않는다는 결함을 지적하고 decay를 갱신에서 분리. 오늘날 LLM 학습의 실질 표준은 Adam이 아니라 AdamW다',
 '**AMSGrad (Reddi et al., ICLR 2018)** — 원 논문의 수렴 증명에 오류가 있음을 반례로 보이고 수정판을 제시. 실무 성능은 크게 나아지지 않아 널리 쓰이지는 않는다',
 '**옵티마이저 상태 압축** — 파라미터당 2배 메모리가 대형 모델의 실제 병목이 되면서 8-bit Adam, ZeRO 샤딩, Adafactor 같은 계열이 파생됨. [QLoRA](#/p/qlora)의 paged optimizer도 같은 문제의식',
 '**learning rate 스케줄과의 결합** — Adam 단독이 아니라 warmup + cosine/inverse-sqrt decay와 묶여 하나의 레시피로 굳어짐. [Transformer](#/p/transformer)가 warmup 없이는 잘 학습되지 않는 현상이 그 계기'
],

pitfalls:[
 '**"Adam이 항상 SGD보다 낫다"는 사실이 아니다.** 특히 비전 분류에서는 SGD+모멘텀이 더 나은 일반화 성능(테스트 정확도)을 내는 경우가 오래 보고돼 왔다. Adam은 수렴이 빠르고 튜닝이 쉬운 것이지 최종 품질이 항상 좋은 것이 아니다.',
 '**Adam에 `weight_decay`를 넣는다고 L2 정규화가 되는 것이 아니다.** 원래 Adam 구현은 decay 항까지 $\\sqrt{v}$ 로 나눠버려서 gradient가 큰 파라미터일수록 정규화가 약해진다. 정규화 의도라면 AdamW를 써야 하며, 두 optimizer의 이름이 비슷하다고 같은 설정이 옮겨가지 않는다.',
 '**ε 은 무시해도 되는 상수가 아니다.** fp16/bf16 학습이나 gradient가 매우 작은 구간에서는 $\\varepsilon$ 값이 실제 스텝 크기를 좌우하며, 값 하나 때문에 학습이 멈추거나 폭주하는 사례가 흔하다.'
],

figures:[
 {f:'fig2-training-cost.png',
  cap:'MNIST 다층 신경망(+dropout) 학습 곡선. y축이 로그 스케일 training cost, x축이 전체 데이터셋을 몇 번 돈 횟수(epoch). 다섯 optimizer 중 Adam(자주색)이 가장 아래(=가장 낮은 loss)로 가장 먼저 내려간다 — "기본값만으로 다른 기법을 이긴다"는 주장의 핵심 증거.',
  src:'원문 Figure 2(a), p.7'}
],

quotes:[
 {t:'We propose Adam, a method for efficient stochastic optimization that only requires first-order gradients with little memory requirement.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1412.6980 — Adam: A Method for Stochastic Optimization', u:'https://arxiv.org/abs/1412.6980'},
 {t:'Decoupled Weight Decay Regularization (AdamW)', u:'https://arxiv.org/abs/1711.05101'},
 {t:'On the Convergence of Adam and Beyond (AMSGrad)', u:'https://arxiv.org/abs/1904.09237'}
]
});
