WIKI.paper({
slug:'swish',
venue:'arXiv 2017 (ICLR 2018 workshop)',
authors:'Ramachandran, Zoph, Le (Google Brain)',
arxiv:'1710.05941',

tldr:'활성함수를 사람이 설계하지 않고 **강화학습으로 탐색**해서 찾아낸 $f(x)=x\\cdot\\sigma(\\beta x)$. ReLU를 대체하는 일관된 성능 개선을 처음으로 대규모에서 보였다.',

context:'2017년 당시 ReLU는 단순하고 안정적이라는 이유로 사실상 표준이었다. LReLU·ELU·SELU 등 손으로 설계한 대안이 많았지만 모델과 데이터셋에 따라 성능이 들쭉날쭉해서 아무것도 ReLU를 밀어내지 못했다. 저자들은 활성함수 자체를 사람이 고르지 말고, 아키텍처 탐색(neural architecture search)처럼 탐색으로 찾자고 제안한다. 스칼라를 입력받아 스칼라를 반환하는 함수만 다뤄서 기존 네트워크 구조를 바꾸지 않고 ReLU 자리에 그대로 끼워 넣을 수 있게 했다.',

ideas:[
 {h:'탐색 공간: unary·binary 함수의 조합',
  lead:'x2·σ(x) 같은 unary 연산과 곱·지수 같은 binary 연산을 반복 조합해 함수를 만든다.',
  d:'"core unit"은 두 입력을 각각 unary 함수(예: $u(x)=x^2$, $\\sigma(x)$)에 통과시킨 뒤 binary 함수(예: 곱, $\\exp(-(x_1-x_2)^2)$)로 합친다. 이 core unit을 반복해서 쌓으면 함수 하나가 만들어진다. core unit이 하나뿐이면 전수조사가 가능하지만, 여러 번 반복하면 경우의 수가 $10^{12}$ 규모로 커져 전수조사가 불가능해진다.'},
 {h:'RNN 컨트롤러의 강화학습 탐색',
  lead:'RNN이 함수의 각 구성요소를 한 스텝씩 예측하고, 검증 정확도를 보상으로 학습한다.',
  d:'탐색 공간이 큰 경우 Zoph & Le의 아키텍처 탐색 방식과 같은 RNN 컨트롤러를 쓴다. 매 스텝 활성함수의 구성요소(unary·binary 선택)를 하나씩 예측하고, 후보 함수로 CIFAR-10에서 "자식 네트워크"를 학습시켜 나온 검증 정확도를 보상으로 컨트롤러를 강화학습한다. 탐색은 계산 비용이 커서 분산 학습으로 병렬화했다.'},
 {h:'Swish: x·sigmoid(βx)',
  lead:'탐색이 찾아낸 최종 함수는 입력에 sigmoid 게이트를 곱하는 self-gating 구조다.',
  d:'탐색으로 여러 후보가 나왔지만, 저자들은 그중 $f(x)=x\\cdot\\sigma(\\beta x)$ 를 Swish로 이름 붙여 집중 검증했다. $\\beta=1$ 이면 강화학습 문맥에서 이미 제안됐던 Sigmoid-weighted Linear Unit(SiL, 나중에는 **SiLU**로도 불림)과 동일하다. $\\beta=0$ 이면 $x/2$ 인 선형함수, $\\beta\\to\\infty$ 이면 ReLU에 가까워져서, Swish는 선형과 ReLU 사이를 매끄럽게 보간하는 함수로 볼 수 있다.'},
 {h:'ReLU와 다른 두 성질: 매끄러움과 비단조성',
  lead:'ReLU와 달리 미분 가능하고, $x<0$ 구간에 작은 "bump"가 있어 단조증가가 아니다.',
  d:'ReLU는 $x=0$ 에서 꺾이지만 Swish는 전 구간에서 매끄럽다. 또한 $x<0$ 근처에 값이 살짝 내려갔다 올라오는 비단조(non-monotonic) 구간이 있는데, 저자들은 실제 모델의 preactivation 상당수가 이 bump 구간($-5\\le x\\le 0$)에 분포한다는 것을 확인했다. $\\beta=1$ 일 때 미분값이 $x<1.25$ 부근까지 1보다 작다는 점도 확인해, "ReLU의 장점은 $x>0$ 에서 기울기가 정확히 1인 것"이라는 통념이 절대적이지 않음을 보였다.'},
 {h:'대규모 실측 검증',
  lead:'ImageNet 분류부터 WMT 기계번역까지 여러 대형 모델에서 ReLU·다른 활성함수와 직접 비교했다.',
  d:'Mobile NASNet-A, Inception-ResNet-v2, Inception-v3/v4, MobileNet 등 ReLU로 설계된 아키텍처의 활성함수만 통째로 갈아 끼워 재학습했다. WMT14 English→German 번역에서도 12층 Transformer로 검증했다. 탐색으로 나온 함수가 사람이 설계한 아키텍처에도 재조정 없이 이식 가능하다는 것을 보이는 것이 목적이었다.'}
],

diagram:{type:'flow', cap:'입력 x에 sigmoid(βx) 게이트를 곱해 self-gating을 만드는 구조.',
 nodes:[
  {t:'입력', s:'x'},
  {t:'Sigmoid 게이트', s:'σ(βx)'},
  {t:'원소별 곱', s:'x · σ(βx)', acc:true, note:'Swish 출력'}
 ]},

math:[
 {expr:'Swish(x) = x · sigmoid(βx)',
  tex:'f(x)=x\\cdot\\sigma(\\beta x),\\quad \\sigma(z)=(1+e^{-z})^{-1}',
  d:'$\\beta$ 는 상수이거나 학습되는 파라미터다. $\\beta=1$ 이면 SiL/SiLU, $\\beta=0$ 이면 $x/2$, $\\beta\\to\\infty$ 이면 ReLU에 근접한다.'},
 {expr:"f'(x) = βf(x) + σ(βx)(1 − βf(x))",
  tex:"f'(x)=\\beta f(x)+\\sigma(\\beta x)\\bigl(1-\\beta f(x)\\bigr)",
  d:'미분이 $f(x)$ 자기 자신으로 재귀적으로 표현된다. $\\beta$ 가 미분이 0과 1로 수렴하는 속도를 조절한다.'}
],

numbers:[
 {k:'ImageNet top-1 · Mobile NASNet-A', v:'+0.9%p', d:'ReLU 대비, 재학습만으로 얻은 개선'},
 {k:'ImageNet top-1 · Inception-ResNet-v2', v:'+0.6%p', d:'논문은 "1년치 아키텍처 튜닝이 준 개선(1.3%p)"과 견주며 유의미하다고 강조'},
 {k:'MobileNet 개선폭', v:'+2.2%p', d:'모바일 크기 모델일수록 Swish의 이득이 컸다'},
 {k:'WMT14 EN→DE BLEU · newstest2016', v:'34.0 (Swish-1)', d:'12층 Base Transformer, ReLU(33.3)·Softplus(29.2) 등과 비교'},
 {k:'탐색 공간 크기', v:'약 $10^{12}$', d:'core unit을 반복 조합했을 때의 후보 함수 수, 전수조사 불가능한 규모'}
],

impact:'활성함수를 더 이상 손으로 설계하지 않고 탐색 대상으로 다룰 수 있음을 보였고, 그 결과물이 실제로 널리 쓰였다. Swish/SiLU는 [EfficientNet](#/p/efficientnet)의 기본 활성함수로 채택됐고, self-gating 아이디어는 이후 [Mamba](#/p/mamba)의 게이팅 메커니즘 등 시퀀스 모델에도 흔적을 남겼다. `x·sigmoid(βx)` 형태의 매끄러운 게이팅은 ReLU의 꺾인 지점이 만드는 죽은 뉴런 문제를 우회하는 실용적 대안으로 자리잡았다.',

legacy:[
 '**독립적 재발견** — 비슷한 시기에 [GELU](#/p/gelu)가 다른 동기(확률적 정규화)로 거의 같은 모양의 함수에 도달했고, 오늘날 두 함수는 대형 모델에서 사실상 교체 가능하게 쓰인다',
 '**이름의 중첩** — $\\beta=1$ 인 Swish는 원래 강화학습 논문(Elfwing et al., 2017)의 SiL과 동일해, 지금은 SiLU라는 이름으로 PyTorch 등에 그대로 내장돼 있다',
 '**비전 백본의 기본값** — [EfficientNet](#/p/efficientnet)이 Swish를 표준 활성함수로 채택하면서 모바일·서버급 CNN 전반에 확산됐다',
 '**탐색 기반 설계의 선례** — 활성함수뿐 아니라 옵티마이저·데이터 증강 등 "사람이 정하던 하이퍼파라미터를 탐색으로 대체"하는 후속 연구 흐름에 참조점이 되었다'
],

pitfalls:[
 '**Swish가 항상 이기지는 않는다.** 논문 표에서도 Inception-v4처럼 Softplus·ELU가 Swish보다 나은 경우가 있다 — "일관되게 ReLU 이상"이지 "항상 최고"는 아니다.',
 '**Swish와 GELU를 같은 것으로 착각하기 쉽다.** 둘은 그래프가 거의 겹치지만 유도 과정과 정확한 수식이 다르고, 독립적으로 발견됐다. 코드에서 이름만 보고 같은 함수라고 가정하면 안 된다.',
 '**$\\beta$ 를 학습 가능하게 둘지 여부가 결과에 영향을 준다.** 논문은 $\\beta=1$ 고정(SiLU)과 학습형 $\\beta$ 를 모두 실험했고, 모델에 따라 최적값이 다르다.'
],

figures:[
 {f:'fig1-search-space.png',
  cap:'탐색 공간의 기본 단위인 "core unit". 두 입력 x를 각각 노란 unary 함수(예: 제곱·sigmoid)에 통과시키고, 파란 binary 함수(예: 곱)로 합친다. 이 단위를 오른쪽으로 반복해서 더 복잡한 활성함수를 조립한다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig4-swish-plot.png',
  cap:'β=0.1(주황)은 거의 직선, β=1.0(빨강)이 SiLU, β=10.0(파랑)은 ReLU에 가깝다. x<0에서 빨강·파랑 선이 0 아래로 살짝 내려갔다 올라오는 부분이 비단조 "bump".',
  src:'원문 Figure 4, p.5'}
],

quotes:[
 {t:'The best discovered activation function, f(x) = x · sigmoid(βx), which we name Swish, tends to work better than ReLU on deeper models across a number of challenging datasets.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1710.05941 — Searching for Activation Functions', u:'https://arxiv.org/abs/1710.05941'},
 {t:'PyTorch nn.SiLU 문서', u:'https://pytorch.org/docs/stable/generated/torch.nn.SiLU.html'}
]
});
