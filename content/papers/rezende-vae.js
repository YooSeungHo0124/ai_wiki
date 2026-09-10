WIKI.paper({
slug:'rezende-vae',
venue:'ICML 2014',
authors:'Rezende, Mohamed, Wierstra (Google DeepMind)',
arxiv:'1401.4082',

tldr:'가우시안 잠재변수를 통과하는 그래디언트를 "샘플링 후 결정론적 변환"으로 재구성해 역전파를 가능하게 만든 논문. [VAE](#/p/vae) (Kingma & Welling)와 **같은 달에 독립적으로** 같은 결론에 도달했고, 이쪽은 더 일반적인 확률적 역전파 규칙의 형태로 문제를 풀었다.',

context:'딥러닝 이전의 잠재변수 생성모델(sigmoid belief network 등)은 층이 깊어지고 잠재변수가 연속이 되는 순간 추론이 다루기 어려워졌다. 근사추론에 널리 쓰이던 평균장 변분 EM이나 wake-sleep 알고리즘은 매 반복마다 최적화 루프를 새로 도는 방식이라 느렸고, 라플라스 근사·기댓값 전파(EP) 같은 대안은 비선형 변환 아래서 신뢰하기 어렵거나 계산이 너무 비쌌다. 근본적인 장벽은 하나였다 — **확률분포에서 샘플을 뽑는 연산은 미분할 수 없으므로**, 잠재변수가 확률적인 신경망은 표준 역전파로 학습시킬 수 없었다.',

ideas:[
 {h:'DLGM: 층마다 가우시안 잠재변수를 두는 생성모델',
  lead:'각 층의 활성값을 위층의 결정론적 변환에 가우시안 노이즈를 더해 만든다.',
  d:'Deep Latent Gaussian Model(DLGM)은 최상위 층에서 $\\xi_L \\sim \\mathcal{N}(0,I)$를 뽑고, 아래층으로 내려가며 $h_l = T_l(h_{l+1}) + G_l\\xi_l$ 형태로 노이즈를 섞어 계층을 쌓는다. $T_l$은 MLP, $G_l$은 공분산을 결정하는 행렬이다. 최하위 층에서 관측 데이터 $v$를 샘플링하는 구조 자체는 [VAE](#/p/vae)의 디코더와 본질적으로 같다.'},
 {h:'확률적 역전파: 샘플링을 "노이즈 입력 + 결정론적 함수"로 분리',
  lead:'$\\xi \\sim \\mathcal{N}(\\mu,C)$ 샘플링을 $\\xi=\\mu+R\\epsilon$로 다시 써서 미분 가능하게 만든다.',
  d:'가우시안에서 직접 샘플을 뽑으면 $\\mu,C$에 대한 그래디언트를 구할 수 없다. 저자들은 표준정규 노이즈 $\\epsilon$을 따로 뽑은 뒤 $\\xi = \\mu + R\\epsilon$ ($C=RR^\\top$)로 변환하는 방식을 제안한다. 이제 확률성은 $\\epsilon$ 쪽에만 있고 $\\mu,C$로 가는 경로는 전부 결정론적이라, 일반적인 역전파 체인 룰을 그대로 적용할 수 있다. 오늘날 "reparameterization trick"이라 부르는 것이 바로 이 아이디어다.'},
 {h:'인식 모델(recognition model)로 사후분포를 근사',
  lead:'별도의 신경망이 데이터를 보고 근사 사후분포의 평균·공분산을 즉시 출력한다.',
  d:'매 데이터포인트마다 변분 파라미터를 새로 최적화하는 대신, $q(\\xi|v)$의 평균·공분산을 만드는 신경망(recognition model)을 생성모델과 **함께 학습**시킨다. 이 신경망 하나가 학습 후에는 어떤 입력에 대해서도 한 번의 순전파로 근사 사후분포를 내놓아, 반복적인 E-step 없이 빠른 테스트 시점 추론이 가능해진다.'},
 {h:'대각 공분산을 넘어 저랭크·구조화된 공분산까지',
  lead:'사후분포를 단순 대각행렬이 아니라 저랭크(rank-one) 공분산으로도 표현할 수 있게 일반화한다.',
  d:'사후분포를 축에 정렬된 대각 가우시안으로만 근사하면 잠재변수 간 상관관계를 표현하지 못한다. 논문은 대각 공분산 모델과, 상관관계를 포착하는 rank-one 공분산 모델을 둘 다 제시하고 비교한다. MNIST에서 rank-one 모델(음의 로그우도 86.60)이 대각 모델(87.30)보다 근소하게 낫다는 것을 실험으로 보였다.'}
],

diagram:{type:'loop', cap:'생성모델(우→ 좌로 샘플링)과 인식모델(좌 → 우로 근사추론)이 매 학습 스텝마다 함께 갱신된다.',
 center:'자유에너지 최소화',
 nodes:[
  {t:'인식 모델', s:'q(ξ|v) 추론'},
  {t:'재매개변수화', s:'ξ = μ + Rε', acc:true},
  {t:'생성 모델', s:'p(v|ξ) 디코딩'},
  {t:'그래디언트 역전파', s:'양쪽 파라미터 동시 갱신'}
 ]},

math:[
 {expr:'F(V) = KL[ q(ξ) || p(ξ) ] − E_q[ log p(V|ξ,θ) ]',
  tex:'\\mathcal{F}(V) = D_{KL}\\!\\left[q(\\xi)\\,\\|\\,p(\\xi)\\right] - \\mathbb{E}_{q}\\!\\left[\\log p(V\\mid \\xi,\\theta^{g})\\right]',
  d:'최소화하는 자유에너지(음의 변분하한)다. 첫 항은 근사 사후분포를 사전분포에 가깝게 당기는 정규화, 둘째 항은 재구성 오차에 해당한다. [VAE](#/p/vae)의 ELBO와 부호만 다른 사실상 같은 목적함수다.'},
 {expr:'ξ = μ(v) + R(v) ε,   ε ~ N(0, I)',
  tex:'\\xi = \\mu(v) + R(v)\\,\\epsilon,\\qquad \\epsilon \\sim \\mathcal{N}(0,I)',
  d:'확률적 역전파의 핵심 치환. 샘플링의 무작위성을 파라미터와 무관한 $\\epsilon$ 쪽으로 밀어내면, $\\mu,R$까지의 그래디언트는 전부 결정론적 합성함수의 미분이 되어 표준 역전파로 계산할 수 있다.'}
],

numbers:[
 {k:'MNIST 이진화 NLL', v:'86.6', d:'DLGM rank-one 공분산, 3층 구조(대각 공분산은 87.3)'},
 {k:'비교 기준', v:'Factor Analysis 106.0', d:'같은 test set에서 wake-sleep(91.3)·NLGBN(95.8)보다도 DLGM이 낮음'},
 {k:'NORB 실험', v:'24,300장 · 96×96', d:'결정론적 층 1개(400유닛) + 잠재변수 100개'},
 {k:'CIFAR-10 실험', v:'50,000장 → 8×8 패치', d:'자연 이미지 전체가 아니라 패치 단위로 학습'},
 {k:'Frey Faces', v:'약 2,000장 · 28×20', d:'가장 작은 데이터셋, 얼굴 표정 변화의 매끄러운 잠재공간 확인용'}
],

impact:'이 논문은 확률적 잠재변수를 가진 딥러닝 모델을 표준 SGD로 통째로 학습시키는 일반적인 방법을 처음으로 제시했다. [VAE](#/p/vae)와 거의 동시에 나온 두 논문이 서로 다른 유도 경로(변분추론 일반 이론 vs. 특정 사전/근사분포 조합)로 같은 재매개변수화 트릭에 도달했다는 사실 자체가, 이 아이디어가 당시 무르익어 있었음을 보여준다. 이후 "잠재변수를 신경망으로 인코딩·디코딩하고 재매개변수화로 역전파한다"는 틀이 생성모델 연구 전체의 표준 도구가 됐다.',

legacy:[
 '**재매개변수화 트릭의 정착** — [VAE](#/p/vae) 계열은 물론, 정책이 연속분포인 강화학습·[World Models](#/p/world-models) 같은 잠재변수 강화학습에도 동일한 트릭이 쓰임',
 '**인식모델(인코더) 개념의 표준화** — 데이터를 보고 사후분포를 즉시 추론하는 별도 신경망이라는 설계가 이후 모든 오토인코더 계열 생성모델의 기본 구성요소가 됨',
 '**[VQ-VAE](#/p/vqvae) 등 이산 잠재변수 계열과의 대비** — 연속 가우시안 재매개변수화가 안 통하는 이산 잠재변수를 위해 별도의 우회 기법(Gumbel-softmax, VQ)이 필요해졌고, 그 배경에는 이 논문이 정립한 연속 케이스의 성공이 있음',
 '**변분추론과 딥러닝의 결합이라는 연구 축** — 확산모델의 이론적 뿌리인 [비평형 열역학 기반 확산모델](#/p/diffusion-original)도 변분 하한을 최적화한다는 점에서 이 계열의 문제의식을 공유'
],

pitfalls:[
 '**"Kingma & Welling이 먼저다/나중이다"라고 단정하지 않는다.** 두 논문 모두 2014년 1월에 arXiv에 올라왔고(Kingma & Welling이 약 한 달 앞섬), 저자들 스스로 "concurrently... developed simultaneously"라고 명시한다. 어느 쪽이 원조인지보다 **두 팀이 독립적으로 같은 결론에 도달했다**는 사실이 중요하다.',
 '**이 논문의 프레이밍은 "오토인코더"가 아니라 "확률적 역전파 규칙"이다.** VAE라는 이름과 인코더/디코더 프레이밍은 Kingma & Welling 쪽에서 굳어졌고, 이 논문은 더 일반적인 가우시안 그래디언트 항등식(섹션 3)에서 출발해 DLGM에 적용하는 순서를 취한다.',
 '**재매개변수화는 연속분포 전용이다.** 가우시안처럼 위치-척도(location-scale) 형태로 쓸 수 있는 분포에서만 곧바로 성립하며, 이산 잠재변수에는 그대로 적용할 수 없다는 한계를 저자들도 인지하고 있었다.'
],

figures:[
 {f:'fig1-dlgm.png',
  cap:'(a) DLGM의 그래픽 모델 — 위층 $h_{n,2}$가 아래층 $h_{n,1}$을 거쳐 관측 $v_n$을 생성한다. (b) 같은 구조를 계산 그래프로 그린 것. 검은 화살표(순전파)는 생성모델(왼쪽)과 인식모델(오른쪽)이 각각 샘플을 만드는 방향이고, 빨간 화살표가 역전파인데 점선 구간이 바로 이 논문이 새로 제시하는 확률적 역전파 경로다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-mnist-samples.png',
  cap:'(a) 왼쪽부터 학습 데이터, 모델이 예측한 픽셀 확률, 실제로 생성한 샘플 — 세 번째 열이 진짜 숫자처럼 보이면 생성모델이 데이터 분포를 잘 학습한 것이다. (b) 2차원으로 축소한 잠재공간에서 색깔별로 숫자 클래스가 뭉쳐 분리되는 모습.',
  src:'원문 Figure 3, p.7'}
],

quotes:[
 {t:'We develop stochastic backpropagation – rules for gradient backpropagation through stochastic variables – and derive an algorithm that allows for joint optimisation of the parameters of both the generative and recognition models.',
  src:'Abstract, p.1'},
 {t:'Concurrently with this paper, Kingma & Welling (2014) present an alternative discussion of stochastic backpropagation. Our approaches were developed simultaneously and provide complementary perspectives on the use and derivation of stochastic backpropagation rules.',
  src:'Section 3.2, p.3'}
],

links:[
 {t:'arXiv 1401.4082 — Stochastic Backpropagation and Approximate Inference', u:'https://arxiv.org/abs/1401.4082'},
 {t:'Auto-Encoding Variational Bayes (Kingma & Welling)', u:'https://arxiv.org/abs/1312.6114'}
]
});
