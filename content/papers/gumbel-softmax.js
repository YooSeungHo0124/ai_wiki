WIKI.paper({
slug:'gumbel-softmax',
venue:'ICLR 2017',
authors:'Jang, Gu, Poole (Google Brain · Cambridge · Stanford)',
arxiv:'1611.01144',

tldr:'이산 범주형 변수에서 표본을 뽑는 과정을 **온도로 완화된 softmax**로 바꿔, 역전파가 통과할 수 있는 연속 근사를 만든 논문. 이산 선택이 필요한 모든 신경망에서 `argmax`/샘플링 대신 쓸 수 있는 범용 재매개화 도구를 제공한다.',

context:'신경망에 이산 잠재변수(범주 선택, 어텐션 대상, 메모리 주소)를 넣고 싶을 때 문제는 역전파다. $z \\sim \\text{Categorical}(\\pi)$ 처럼 샘플링 연산 자체가 미분 불가능해서 그래디언트가 그 지점에서 끊긴다. 기존 해법은 두 갈래였다 — score function 추정기(REINFORCE 계열, 분산이 크고 baseline이 필요)와 Bernoulli 전용 straight-through 추정기(편향은 있지만 실용적). 범주형(2개 이상 클래스) 변수에 맞춰 설계된 추정기는 이 논문 이전에는 없었다. 연속 변수라면 [VAE](#/p/vae)의 재매개화 트릭($z=\\mu+\\sigma\\epsilon$)으로 간단히 풀리는 문제였는데, 이산 변수에는 그런 매끄러운 재매개화가 없었다.',

ideas:[
 {h:'Gumbel-Max 트릭: argmax로 정확한 범주 샘플링',
  lead:'로짓에 Gumbel 노이즈를 더하고 argmax를 취하면 정확히 원하는 범주형 분포에서 샘플링된다.',
  d:'$\\log \\pi_i$ 에 독립적인 Gumbel(0,1) 노이즈 $g_i$ 를 더한 뒤 `argmax`를 취하면, 그 결과가 정확히 확률 $\\pi$ 를 갖는 범주형 분포의 표본이 된다는 것이 1954년부터 알려진 사실이다. 문제는 `argmax` 자체가 미분 불가능하다는 것 — 이 논문은 이 트릭을 미분 가능하게 만드는 다음 단계를 밟는다.'},
 {h:'Softmax로 argmax를 연속 완화한다',
  lead:'argmax 대신 온도 τ가 있는 softmax를 적용해 미분 가능한 (k-1)차원 심플렉스 위 표본을 얻는다.',
  d:'`argmax`를 매끄러운 softmax로 바꾸면 결과 벡터 $y$ 는 더 이상 one-hot이 아니라 심플렉스 위의 연속값이 되지만, 모든 연산이 미분 가능해진다. 이 분포를 **Gumbel-Softmax 분포**라 부른다. 온도 $\\tau \\to 0$ 이면 $y$ 는 one-hot에 수렴해 원래 범주형 분포와 같아지고, $\\tau \\to \\infty$ 이면 균등분포로 무너진다.'},
 {h:'온도는 분산-편향 트레이드오프의 손잡이',
  lead:'낮은 온도는 one-hot에 가깝지만 그래디언트 분산이 크고, 높은 온도는 매끄럽지만 분산이 작다.',
  d:'온도가 낮으면 표본이 실제 범주형 표본과 거의 같아 편향은 작지만, softmax가 뾰족해지며 그래디언트 분산이 커진다. 온도가 높으면 표본이 뭉개지지만 그래디언트는 안정적이다. 실험에서는 학습 초반에 높은 온도로 시작해 점점 낮추는 **anneal 스케줄**(`τ = max(0.5, exp(−rt))`)을 썼고, 특정 스케줄에 크게 민감하지 않았다.'},
 {h:'Straight-Through: forward는 이산, backward는 연속',
  lead:'forward에서는 진짜 argmax로 이산 one-hot을 쓰고, backward에서는 Gumbel-Softmax 그래디언트를 대신 흘린다.',
  d:'강화학습의 행동 공간이나 양자화 압축처럼 **진짜로 이산값**이 필요한 경우가 있다. 이때는 forward pass에서 $y$ 를 discretize(`argmax`로 one-hot화)해서 쓰고, backward pass에서만 $\\nabla_\\theta z \\approx \\nabla_\\theta y$ 로 근사해 Gumbel-Softmax의 연속 그래디언트를 흘린다. [Bengio(2013)]의 straight-through 추정기와 같은 발상을 범주형으로 확장한 것이다.'}
],

diagram:{type:'flow', cap:'로짓에 Gumbel 노이즈를 더하고 softmax(argmax 대신)를 취해 미분 가능한 근사 표본을 얻는다.',
 nodes:[
  {t:'로짓', s:'log π_i'},
  {t:'Gumbel 노이즈', s:'g_i ~ Gumbel(0,1)', a:'더하기'},
  {t:'softmax/τ', s:'argmax 대신', acc:true},
  {t:'연속 표본', s:'심플렉스 위 y'}
 ]},

math:[
 {expr:'z = one_hot( argmax_i [ g_i + log π_i ] ),   g_i ~ Gumbel(0,1)',
  tex:'z=\\text{one\\_hot}\\Big(\\operatorname*{arg\\,max}_i\\,[g_i+\\log\\pi_i]\\Big)',
  d:'Gumbel-Max 트릭. 이 식은 정확한 범주형 샘플링이지만 `argmax` 때문에 미분이 불가능하다.'},
 {expr:'y_i = exp((log π_i + g_i)/τ) / Σ_j exp((log π_j + g_j)/τ)',
  tex:'y_i=\\dfrac{\\exp\\!\\big((\\log\\pi_i+g_i)/\\tau\\big)}{\\sum_{j=1}^{k}\\exp\\!\\big((\\log\\pi_j+g_j)/\\tau\\big)}',
  d:'Gumbel-Softmax 완화. `argmax`를 온도 τ의 softmax로 바꿔 미분 가능하게 만든 핵심 식. τ→0에서 원래 범주형 분포로 수렴한다.'}
],

numbers:[
 {k:'SBN 범주형 NLL', v:'59.0 (Gumbel-S.) vs 67.9 (DARN)', d:'구조화 출력 예측(binarized MNIST), 낮을수록 좋음'},
 {k:'VAE 범주형 하한', v:'101.5 (Gumbel-S.) vs 128.8 (DARN)', d:'범주형 잠재변수 VAE, 다른 추정기 대비 가장 낮은(좋은) negative ELBO'},
 {k:'준지도 분류 정확도', v:'93.6%', d:'ST Gumbel-Softmax, 라벨 100장 + 비라벨 5만장 설정에서 marginalization(92.6%) 상회'},
 {k:'anneal 스케줄', v:'τ = max(0.5, exp(−3e-5·t))', d:'2000 스텝마다 갱신, 실험 전반에 쓰인 대표 스케줄'}
],

impact:'이 논문 이후 "이산 선택이 필요하지만 역전파도 필요하다"는 문제는 REINFORCE의 고분산 대신 Gumbel-Softmax의 낮은 분산·약간의 편향으로 푸는 것이 표준 선택지가 되었다. [VQ-VAE](#/p/vqvae)류의 이산 코드북 학습, [Switch Transformer](#/p/switch) 같은 MoE의 라우팅 결정, 신경망 구조 탐색(NAS)의 연산 선택 등 "미분 가능한 이산 선택"이 필요한 영역 전반에 이 재매개화가 기본 도구로 자리잡았다.',

legacy:[
 '**[VQ-VAE](#/p/vqvae)** 계열은 최근접 코드북 검색이라는 다른 이산화 방식을 쓰지만, 이후 변형들에서 Gumbel-Softmax 기반 소프트 라우팅이 대안으로 쓰인다',
 '**MoE 라우팅** — [Switch Transformer](#/p/switch)류의 top-k 게이팅 연구에서 Gumbel 노이즈 기반 완화가 로드밸런싱 학습에 활용됨',
 '**강화학습의 이산 행동 공간** — ST Gumbel-Softmax가 이산 행동을 갖는 정책망의 그래디언트 추정에 REINFORCE 대안으로 쓰임',
 '**신경망 구조 탐색(NAS)** — DARTS 등에서 연산 선택을 연속 완화해 미분 가능하게 만드는 데 같은 발상이 재사용됨'
],

pitfalls:[
 '**Concrete distribution과 별개 논문이 아니다.** 같은 분포를 [Maddison, Mnih, Teh (2016)]가 독립적으로 발견해 "Concrete distribution"이라 불렀다 — 둘은 동시대에 같은 수식에 붙은 다른 이름이다.',
 '**forward에서 항상 연속값을 쓴다고 착각하기 쉽다.** 실제로 이산값이 필요한 경우(RL 행동, 양자화)엔 Straight-Through 버전을 써서 forward는 진짜 one-hot, backward만 연속 근사를 쓴다.',
 '**온도를 고정해도 항상 되는 건 아니다.** 구조화 출력 예측 실험에서는 τ=1 고정으로 충분했지만, VAE 실험에서는 annealing이 필요했다 — 과제에 따라 다르다.'
],

figures:[
 {f:'fig1-temperature.png',
  cap:'같은 로짓에 대해 온도 τ를 0.1→10.0으로 올릴수록(왼쪽에서 오른쪽) 기대값(a행)과 실제 표본(b행)이 뾰족한 one-hot에서 점점 균등분포로 뭉개진다. 맨 왼쪽 "Categorical"이 이산 정답, τ=0.1이 그것과 가장 가까운 연속 근사.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We present an efficient gradient estimator that replaces the non-differentiable sample from a categorical distribution with a differentiable sample from a novel Gumbel-Softmax distribution.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1611.01144 — Categorical Reparameterization with Gumbel-Softmax', u:'https://arxiv.org/abs/1611.01144'},
 {t:'The Concrete Distribution (Maddison, Mnih, Teh, 2016)', u:'https://arxiv.org/abs/1611.00712'}
]
});
