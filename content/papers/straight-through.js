WIKI.paper({
slug:'straight-through',
venue:'arXiv preprint (2013)',
authors:'Bengio, Léonard & Courville (Université de Montréal)',
arxiv:'1308.3432',

tldr:'이산적인(0 또는 1) 확률 뉴런은 미분이 불가능해 backprop이 통과할 수 없다는 문제에 대해, **역전파 시엔 그냥 항등함수인 척 gradient를 그대로 흘려보내는** straight-through estimator를 제안한 짧은 논문. 편향된 추정량이지만 단순함 덕에 이후 이산 잠재변수를 다루는 거의 모든 모델의 기본 도구가 되었다.',

context:'2013년 무렵 신경망은 sigmoid·tanh 같은 매끄러운 비선형에 backprop을 걸어 학습하는 것이 표준이었다. 그런데 **이산 확률 뉴런**(0 또는 1을 확률적으로 출력하는 유닛)이나 hard threshold 함수는 계단 형태라 미분값이 거의 모든 곳에서 0이거나 정의되지 않는다. 이런 뉴런은 conditional computation(입력에 따라 계산의 일부만 켜서 비용을 줄이는 것)이나 강화학습의 이산 행동 선택에 유용하지만, gradient를 어떻게 그 뉴런을 통과시켜 앞단 파라미터까지 전달할지가 난제였다. 유한차분법으로 파라미터 하나하나를 흔들어 보는 방법은 파라미터 수만큼 비용이 들어 비현실적이다.',

ideas:[
 {h:'네 가지 추정법을 나란히 비교한다',
  lead:'REINFORCE류 미분추정, 매끄러운 근사, 노이즈 주입, straight-through를 같은 조건에서 비교했다.',
  d:'(1) 이진 확률 뉴런에 대한 최소분산 비편향 추정량(REINFORCE의 특수한 경우), (2) 확률적 이진 연산을 매끄러운 미분가능 부분과 이진 부분으로 분해하는 방법, (3) 그렇지 않으면 미분가능한 계산 그래프에 덧셈·곱셈 노이즈를 주입하는 방법, (4) 그리고 이 논문이 강조하는 **straight-through**. 논문 제목의 "estimating or propagating"이 이 두 갈래(정확한 추정 vs. 편향된 근사 전파)를 가리킨다.'},
 {h:'Straight-through: 역전파 때만 threshold를 지운다',
  lead:'순전파는 hard threshold 그대로 쓰고, 역전파는 그 자리에 항등함수가 있었던 것처럼 gradient를 그대로 복사한다.',
  d:'순전파에서 $h_i = \\mathbb{1}[a_i > 0]$ 같은 이진 결정을 그대로 쓰되, 역전파에서는 $\\partial L/\\partial a_i := \\partial L/\\partial h_i$ 로 둔다. 즉 손실에 대한 출력 $h_i$의 gradient를 threshold 이전의 입력 $a_i$에 대한 gradient인 것처럼 그냥 복사해 흘린다. 단일 층에서는 이 부호가 맞다는 것을 보이지만, 층을 여러 개 통과하면 그 보장이 사라지는 **명백히 편향된** 추정량이다.'},
 {h:'Conditional computation: gater로 계산의 일부만 켠다',
  lead:'작은 gater 부분망이 큰 expert 부분망 중 10%만 활성화해 $O(N^2)$을 $O(\\alpha N^2)$으로 줄인다.',
  d:'입력을 작은 bottleneck층(gater path)에 통과시켜 희소한 게이트 $h_i$를 만들고, 이를 큰 은닉층(main path)의 출력 $H_i$에 원소별로 곱한다. gater 계산량이 main path보다 훨씬 작으므로, $h_i=0$인 유닛은 $H_i$ 계산 자체를 건너뛰어 비용을 절감할 수 있다. 이 실험에서 게이트가 바로 이산 확률 뉴런이라 앞의 네 추정법이 필요해진다.'},
 {h:'실험적으로 straight-through가 의외로 가장 좋았다',
  lead:'이론적으로 가장 거친 근사인 straight-through가 MNIST 실험에서 검증·테스트 오류 모두 최저를 기록했다.',
  d:'noisy rectifier, straight-through, smooth-times-stochastic, 이진 확률 뉴런 네 방법과 세 baseline을 비교한 결과, straight-through가 test error 1.39%로 전체 최저였다. 이론적 근거가 가장 약한 방법이 실무에서 가장 잘 작동한다는, 이후로도 반복되는 패턴을 이 논문이 처음 보고한 셈이다.'}
],

diagram:{type:'flow', cap:'gater path(왼쪽 작은 층)가 만든 희소 이진 게이트가 main path(큰 은닉층) 출력에 곱해진다. 게이트가 0인 유닛은 main path 계산을 건너뛸 수 있다.',
 nodes:[
  {t:'입력', s:'N차원'},
  {t:'Gater path', s:'bottleneck M≪N'},
  {t:'이진 게이트 h_i', s:'10%만 활성', acc:true},
  {t:'Main path', s:'게이트 곱해 O(αN²)'},
  {t:'출력 softmax'}
 ]},

math:[
 {expr:'h_i = 1[z_i > sigm(a_i)],  z_i ~ U[0,1]',
  tex:'h_i=\\mathbb{1}\\!\\left[z_i>\\text{sigm}(a_i)\\right],\\qquad z_i\\sim U[0,1]',
  d:'확률적 이진 뉴런의 정의. pre-activation $a_i$가 크면 $\\text{sigm}(a_i)$가 1에 가까워 $h_i=1$이 나올 확률이 높아진다.'},
 {expr:'straight-through: ∂L/∂a_i := ∂L/∂h_i',
  tex:'g_i^{ST}:=\\frac{\\partial L}{\\partial h_i}\\ \\approx\\ \\frac{\\partial L}{\\partial a_i}',
  d:'threshold 함수의 실제 미분(거의 모든 곳에서 0)을 무시하고, 마치 $h_i=a_i$인 항등함수였던 것처럼 gradient를 그대로 앞으로 복사한다. 이것이 이 논문 전체에서 가장 널리 쓰이게 되는 한 줄이다.'}
],

numbers:[
 {k:'MNIST test error · straight-through', v:'1.39%', d:'conditional computation 게이터 실험, 4개 확률 추정법 중 최저'},
 {k:'MNIST test error · noisy rectifier', v:'1.87%', d:'같은 실험의 다른 추정법'},
 {k:'MNIST test error · 이진 확률 뉴런', v:'1.89%', d:'REINFORCE 계열 최소분산 비편향 추정량'},
 {k:'baseline(비확률) 최저', v:'1.60%', d:'sparsity 제약만 있고 확률성이 없는 rectifier baseline'},
 {k:'게이트 목표 희소도', v:'10%', d:'2000개 gater 출력 유닛 중 평균 10%만 비영(非零)이 되도록 KL-divergence로 제약'},
 {k:'계산량 절감', v:'O(N²) → O(αN²)', d:'α=0.1일 때 main path 연산량, gater 자체는 O(MN)으로 훨씬 저렴'}
],

impact:'이 논문이 던진 "이산 결정 앞뒤로 gradient를 억지로 흘리자"는 발상은 이후 이산 잠재변수를 쓰는 모델 전체의 표준 트릭이 되었다. 특히 코드북에서 가장 가까운 벡터를 고르는 **양자화(quantization)** 연산은 정확히 이 논문이 다룬 hard threshold와 같은 문제를 안고 있어서, straight-through estimator가 그 자리를 그대로 메운다.',

legacy:[
 '**[VQ-VAE](#/p/vqvae)의 핵심 트릭** — 인코더 출력을 코드북에서 가장 가까운 벡터로 바꾸는 argmin 연산이 미분 불가능한데, straight-through로 인코더까지 gradient를 그대로 통과시켜 학습 가능하게 만듦',
 '**가중치·활성값 양자화 전반** — 학습 중 가중치를 저비트로 반올림하는 quantization-aware training이 반올림 앞뒤로 이 추정기를 사용',
 '**[GPTQ](#/p/gptq) 계열 사후 양자화의 배경 지식** — 사후 양자화 자체는 학습 없이 이뤄지지만, 양자화 오차를 보정하는 QAT 계열 방법들이 여전히 이 추정기에 기댐',
 '**Gumbel-Softmax 등 후속 완화 기법과 병존** — 더 매끄러운 대안(연속 완화)이 나온 뒤에도, 구현이 한 줄로 끝나는 straight-through는 여전히 가장 널리 쓰이는 기본값으로 남음'
],

pitfalls:[
 '**"올바른 gradient의 근사"가 아니라 명시적으로 편향된 추정량이다.** 논문 스스로도 단일 층에서만 부호가 보장되고 여러 층을 통과하면 그 보장이 사라진다고 밝힌다.',
 '**straight-through는 이 논문에서 새로 증명된 것이 아니라 Hinton의 2012년 강의(코세라 lecture 15b)에서 제안된 아이디어를 이 논문이 정식으로 이름 붙이고 다른 세 방법과 비교한 것이다.**',
 '**"실험에서 가장 좋았다"는 결과를 일반화하면 안 된다.** 이 논문의 비교는 MNIST 기반 소규모 conditional computation 실험 한 건에 국한되며, 어떤 추정기가 나은지는 과제와 아키텍처에 따라 달라진다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'주황 상자가 입력, 왼쪽 초록 상자(gater path)가 입력을 받아 희소한 게이팅 유닛(검은 점)을 만들고, 그 값이 가운데 큰 초록 상자(main path의 expert 유닛)에 원소별로 곱해져 출력 softmax로 이어진다. gater가 작고 main path가 크다는 비대칭이 계산 절감의 원천.',
  src:'원문 Figure 1, p.8'}
],

quotes:[
 {t:'A fourth approach heuristically copies the gradient with respect to the stochastic output directly as an estimator of the gradient with respect to the sigmoid argument (we call this the straight-through estimator).',
  src:'Abstract'}
],

links:[
 {t:'arXiv 1308.3432 — Estimating or Propagating Gradients Through Stochastic Neurons for Conditional Computation', u:'https://arxiv.org/abs/1308.3432'}
]
});
