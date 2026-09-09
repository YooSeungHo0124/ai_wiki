WIKI.paper({
slug:'gan',
venue:'NeurIPS 2014',
authors:'Goodfellow et al. (Université de Montréal)',
arxiv:'1406.2661',

tldr:'생성 모델을 **확률밀도를 직접 계산하는 문제**가 아니라 **두 네트워크의 게임**으로 재정의한 논문. 생성자는 가짜를 만들고 판별자는 진짜와 구별하려 하며, 이 경쟁의 균형점에서 생성 분포가 데이터 분포와 같아진다.',

context:'2014년 이전의 생성 모델은 대부분 명시적 확률밀도를 다뤘다. RBM·DBN 계열은 분배함수(partition function) $Z$ 를 계산할 수 없어 MCMC 근사에 의존했고, 샘플 한 장 뽑는 데 긴 마르코프 체인이 필요했다. 같은 해 나온 [VAE](#/p/vae)는 변분 하한으로 이 문제를 우회했지만, 픽셀 단위 재구성 오차를 쓰는 탓에 샘플이 흐릿했다. 이 논문의 출발점은 다른 질문이다 — **밀도를 아예 계산하지 않고, 좋은 샘플을 뽑는 능력만 학습할 수는 없는가?** 밀도 대신 "이 샘플이 진짜 같은가"를 판정해 줄 두 번째 네트워크를 세우면, 학습 신호를 그 판정자의 gradient에서 얻을 수 있다.',

ideas:[
 {h:'생성 문제를 2인 minimax 게임으로 바꾼다',
  lead:'생성자와 판별자가 서로의 손실을 만들어내는 상대적 목표로 경쟁시킨다.',
  d:'생성자 $G$ 는 노이즈 $z \\sim p_z$ 를 데이터 공간으로 사상하고, 판별자 $D$ 는 입력이 진짜일 확률을 출력한다. $D$ 는 정답률을 올리려 하고 $G$ 는 $D$ 를 속이려 한다. 학습 목표가 고정된 손실 함수가 아니라 **상대의 현재 실력에 따라 계속 변하는 손실**이라는 점이 핵심이다. 학습이 진행될수록 판별자가 까다로워지고, 그만큼 생성자가 받는 요구 수준도 자동으로 올라간다.'},
 {h:'판별자가 최적일 때, 게임은 JS divergence 최소화가 된다',
  lead:'최적 판별자를 대입하면 목적함수가 Jensen-Shannon divergence로 정리된다.',
  d:'$G$ 를 고정하면 최적 판별자는 $D^*(x) = p_{data}(x) / (p_{data}(x) + p_g(x))$ 로 닫힌 형태를 갖는다. 이것을 목적함수에 대입하면 $-\\log 4 + 2 \\cdot JSD(p_{data} \\| p_g)$ 가 되고, 따라서 전역 최적해는 $p_g = p_{data}$ 하나뿐이다. **어떤 거리를 최소화하고 있는지 명시적으로 안다**는 이 결과가, 이후 [WGAN](#/p/wgan)이 "그 거리가 잘못 골라졌다"고 반박할 수 있는 발판이 되었다.'},
 {h:'밀도 없이, 역전파만으로 학습한다',
  lead:'마르코프 체인도 근사 추론도 없이 판별자의 gradient만으로 생성자를 학습시킨다.',
  d:'마르코프 체인도 근사 추론 네트워크도 필요 없다. $G$ 는 미분 가능한 함수이기만 하면 되고, 학습 신호는 판별자를 통과한 gradient로 전부 전달된다. 그 대가로 **$p_g(x)$ 값을 계산할 방법이 없다** — likelihood도, 정확한 평가 지표도 없다. 이 트레이드오프가 GAN 계보 전체의 성격을 결정했다.'},
 {h:'비포화 손실: 실전에서 목적함수를 바꿔 쓴다',
  lead:'초기 gradient 포화를 피하려 G의 손실을 최소화 대신 최대화 형태로 뒤집는다.',
  d:'이론상 $G$ 는 $\\log(1 - D(G(z)))$ 를 최소화해야 하지만, 학습 초기에는 $D$ 가 가짜를 쉽게 잡아내 이 항의 gradient가 0에 가깝게 포화된다. 그래서 실제로는 $G$ 가 $\\log D(G(z))$ 를 **최대화**하도록 뒤집어 쓴다. 같은 고정점을 갖지만 초기 gradient가 훨씬 크다. 논문이 직접 밝힌 이 우회는, 이론과 구현이 어긋나는 GAN 특유의 패턴의 첫 사례다.'},
 {h:'번갈아 최적화 — 그리고 그것이 수렴 보장을 깨뜨린다',
  lead:'D를 최적까지 학습시킨다는 증명의 가정이 실제 SGD 번갈이 갱신에서는 깨진다.',
  d:'이론 증명은 "$D$ 를 매번 최적까지 학습시킨다"는 가정 위에 서 있지만, 실제로는 $D$ 를 $k$ 스텝(실험에서는 $k=1$) 돌리고 $G$ 를 한 스텝 돌린다. 함수 공간에서의 볼록성 논증이 파라미터 공간에서는 성립하지 않으므로, **수렴 보장은 실제 학습에 적용되지 않는다**. 모드 붕괴와 진동은 여기서 나온다.'}
],

diagram:{type:'loop', cap:'한 스텝의 게임. 두 네트워크가 서로의 손실을 만들어내므로 고정된 목표가 존재하지 않는다.',
 center:'균형점에서 D(x)=1/2',
 nodes:[
  {t:'노이즈 z', s:'p_z(z)'},
  {t:'생성자 G(z)', s:'가짜 샘플', acc:true},
  {t:'판별자 D', s:'진짜일 확률'},
  {t:'D 갱신', s:'분류 정확도 최대화'},
  {t:'G 갱신', s:'D 속이기 (비포화 손실)'}
 ]},

figures:[
 {f:'fig2-generated-samples.png',
  cap:'왼쪽(a)이 MNIST, 오른쪽(b)이 얼굴 데이터셋(TFD)에서 생성자가 뽑은 샘플. 각 행의 맨 오른쪽 노란 테두리 칸만 학습 데이터에서 가장 가까운 이웃을 보여준 것이고, 나머지 칸은 전부 생성자가 만든 이미지다 — 학습 데이터를 그대로 베낀 것이 아니라는 것을 이 대조로 확인할 수 있다. 2014년 기준 해상도가 32×32 이하로 낮고 TFD 쪽은 흐릿하지만, 마르코프 체인 없이 한 번의 forward로 뽑은 샘플이라는 점이 핵심.',
  src:'원문 Figure 2, p.6'}
],

math:[
 {expr:'min_G max_D  V(D,G) = E_x~pdata[log D(x)] + E_z~pz[log(1 - D(G(z)))]',
  tex:'\\min_G \\max_D V(D,G) = \\mathbb{E}_{x \\sim p_{data}}[\\log D(x)] + \\mathbb{E}_{z \\sim p_z}[\\log(1-D(G(z)))]',
  d:'논문 전체가 이 한 줄이다. 안쪽 $\\max$ 는 현재 생성 분포를 진짜와 구별하는 최선의 판정자를 찾고, 바깥 $\\min$ 은 그 판정자조차 못 속이는 지점을 찾는다.'},
 {expr:'D*(x) = pdata(x) / ( pdata(x) + pg(x) )',
  tex:'D^*(x) = \\frac{p_{data}(x)}{p_{data}(x) + p_g(x)}',
  d:'$G$ 를 고정했을 때의 최적 판별자. 두 분포가 같아지면 어디서나 $1/2$ 를 출력하고, 그때 $V = -\\log 4$ 로 전역 최소가 된다.'},
 {expr:'V(D*, G) = -log 4 + 2 · JSD( pdata || pg )',
  tex:'V(D^*,G) = -\\log 4 + 2 \\cdot \\text{JSD}(p_{data} \\,\\|\\, p_g)',
  d:'최적 판별자를 대입한 결과. GAN 학습이 사실상 **Jensen-Shannon divergence 최소화**임을 보인다. JSD는 두 분포의 support가 겹치지 않으면 $\\log 2$ 로 상수가 되어 gradient가 사라진다 — 고차원 이미지에서 정확히 그런 상황이 벌어진다.'}
],

quotes:[
 {t:'We propose a new framework for estimating generative models via an adversarial process, in which we simultaneously train two models: a generative model G that captures the data distribution, and a discriminative model D that estimates the probability that a sample came from the training data rather than G.',
  src:'Abstract, p.1'}
],

numbers:[
 {k:'Parzen 로그우도 · MNIST', v:'225 ± 2', d:'당시 비교 모델들보다 높았지만, Parzen 추정 자체가 고차원에서 신뢰도가 낮다고 논문이 직접 인정'},
 {k:'Parzen 로그우도 · TFD', v:'2057 ± 26', d:'Toronto Face Database. 표준오차는 fold 간 계산'},
 {k:'D 스텝 : G 스텝', v:'k = 1', d:'이론은 $D$ 의 최적화를 가정하지만 실험은 1스텝만 돌렸다'},
 {k:'전역 최적 목적함수 값', v:'-log 4 ≈ -1.386', d:'$p_g = p_{data}$ 일 때, 즉 $D$ 가 완전히 헷갈릴 때'},
 {k:'실험 데이터셋', v:'MNIST · TFD · CIFAR-10', d:'모두 32×32 이하 저해상도. 고해상도는 아직 불가능했다'}
],

impact:'생성 모델의 평가 기준이 "우도"에서 "샘플이 그럴듯한가"로 이동했다. 흐릿한 평균을 만드는 픽셀 손실 대신 **학습되는 손실(learned loss)** 을 쓴다는 발상은 곧 초해상도·인페인팅·이미지 변환 같은 분야로 그대로 이식되었다. 동시에 이 논문은 앞으로 몇 년간 연구자들을 괴롭힐 세 가지 병을 함께 물려줬다 — **모드 붕괴**(생성자가 판별자를 속이는 몇 개의 샘플만 반복 생산), **학습 불안정**(두 손실이 진동하며 발산), **평가 불가능성**(진행 상황을 알려주는 스칼라가 없음). GAN 계보의 이후 5년은 사실상 이 세 문제와의 싸움이다.',

legacy:[
 '**아키텍처로 안정화** — [DCGAN](#/p/dcgan)이 "이렇게 쌓으면 학습이 된다"는 구조 규칙을 정리하며 GAN을 재현 가능한 도구로 만듦',
 '**거리를 바꿔서 안정화** — [WGAN](#/p/wgan)이 JS divergence를 Wasserstein 거리로 교체하며 gradient 소실의 원인을 이론적으로 지목',
 '**조건부 생성으로 확장** — [pix2pix](#/p/pix2pix)·[CycleGAN](#/p/cyclegan)이 입력 이미지를 조건으로 받아 변환 문제를 풀고, [StyleGAN](#/p/stylegan)이 잠재공간 제어까지 가져감',
 '**부품으로 살아남기** — GAN 손실은 [VQGAN](#/p/vqgan)의 디코더나 확산 모델 latent 오토인코더의 지각 손실 항으로 여전히 쓰인다. 주역에서 조연이 됐을 뿐 사라지지 않았다'
],

pitfalls:[
 '**"판별자 손실이 내려가면 잘 학습되는 중"이 아니다.** GAN에는 진행 상황과 상관관계를 갖는 손실 스칼라가 없다. $D$ 의 손실이 0에 수렴하면 오히려 $G$ 가 gradient를 못 받고 있다는 신호일 수 있다. 이 문제를 정면으로 다룬 것이 [WGAN](#/p/wgan)이다.',
 '**모드 붕괴는 버그가 아니라 목적함수의 성질이다.** 목적함수는 "모든 모드를 덮으라"고 요구하지 않는다. 데이터 분포의 극히 일부만 완벽하게 재현해도 판별자를 속일 수 있으면 그것이 국소 최적이다. 샘플이 예뻐 보여도 다양성은 별도로 측정해야 한다.',
 '**논문의 수렴 증명은 실제 학습에 적용되지 않는다.** 증명은 $p_g$ 를 함수 공간에서 직접 업데이트하고 $D$ 를 매번 최적까지 학습시키는 이상적 절차에 대한 것이다. 신경망 파라미터를 SGD로 번갈아 갱신하는 실제 절차는 그 가정을 하나도 만족하지 않는다.'
],

links:[
 {t:'arXiv 1406.2661 — Generative Adversarial Networks', u:'https://arxiv.org/abs/1406.2661'},
 {t:'NIPS 2016 Tutorial: Generative Adversarial Networks (Goodfellow)', u:'https://arxiv.org/abs/1701.00160'},
 {t:'Towards Principled Methods for Training GANs (Arjovsky & Bottou)', u:'https://arxiv.org/abs/1701.04862'}
]
});
