WIKI.paper({
slug:'vae',
venue:'ICLR 2014',
authors:'Kingma & Welling (Universiteit van Amsterdam)',
arxiv:'1312.6114',

tldr:'잠재변수 생성모델의 사후분포를 신경망으로 근사하고, **reparameterization trick**으로 샘플링 과정에 gradient를 통과시켜 encoder와 decoder를 역전파 한 번으로 동시에 학습시킨 논문. "잠재 공간(latent space)"을 딥러닝의 기본 어휘로 만들었다.',

context:'2013년의 생성모델은 대부분 잠재변수 $z$ 를 두고 $p(x)=\\int p(x|z)p(z)dz$ 를 최대화하려 했지만, 이 적분과 그에 딸린 사후분포 $p(z|x)$ 는 신경망 decoder에서는 계산이 불가능하다. 표준 해법인 mean-field 변분추론은 **데이터 하나마다** 별도의 변분 파라미터를 최적화해야 해서 대규모 데이터셋에 쓸 수 없었고, MCMC는 미니배치 학습 루프 안에 넣기엔 너무 느렸다. 남은 선택지였던 score function(REINFORCE) 방식의 gradient 추정기는 편향은 없지만 **분산이 너무 커서** 실질적으로 학습이 되지 않았다. 이 논문의 기여는 새로운 모델이라기보다 **추정기**다 — 어떻게 하면 이 목적함수의 gradient를 낮은 분산으로, 미니배치 SGD로, 데이터 개수와 무관한 비용으로 얻을 것인가.',

ideas:[
 {h:'Amortized inference: 사후분포를 함수로 학습한다',
  lead:'데이터마다 최적화하는 대신 하나의 신경망으로 사후분포를 근사한다.',
  d:'데이터 하나하나에 변분 파라미터를 붙이는 대신, **모든 $x$ 에 공통으로 적용되는 신경망** $q_\\phi(z|x)$ 를 학습한다. 새 데이터가 와도 추가 최적화 없이 forward pass 한 번으로 근사 사후분포를 얻는다. 이것이 encoder이고 $p_\\theta(x|z)$ 가 decoder다. 오토인코더와 모양은 같아 보이지만 병목이 벡터가 아니라 **분포**($\\mu$, $\\sigma$)라는 점이 다르다.'},
 {h:'ELBO: 계산 불가능한 우도를 계산 가능한 하한으로',
  lead:'계산 불가능한 우도를 재구성 항과 KL 항으로 쪼갠 하한으로 대신 최적화한다.',
  d:'$\\log p(x)$ 를 직접 못 구하니 Jensen 부등식으로 하한을 잡는다. 그 하한이 **재구성 항 − KL 항**으로 정확히 쪼개지고, 둘 다 미니배치에서 추정 가능하다. 하한과 실제 우도의 간격은 정확히 $KL(q_\\phi(z|x) \\| p(z|x))$ 이므로, ELBO를 올리는 것은 "데이터를 잘 설명하는 것"과 "근사 사후분포를 진짜 사후분포에 붙이는 것"을 동시에 하는 일이 된다.'},
 {h:'Reparameterization trick: 샘플링을 gradient가 통과하게 만든다',
  lead:'무작위성을 입력 노이즈로 밀어내 샘플링 과정에도 gradient가 통과하게 만든다.',
  d:'$z \\sim N(\\mu_\\phi(x), \\sigma_\\phi(x)^2)$ 는 **확률적 노드**라서 $\\phi$ 에 대한 미분이 정의되지 않는다. 이걸 $z = \\mu_\\phi(x) + \\sigma_\\phi(x)\\odot\\epsilon,\\ \\epsilon\\sim N(0,I)$ 로 다시 쓰면 무작위성이 $\\epsilon$ 이라는 **입력 상수**로 밀려나고, $z$ 는 $\\phi$ 의 결정적(deterministic) 함수가 된다. 그러면 decoder의 오차가 $\\mu$ 와 $\\sigma$ 를 거쳐 encoder까지 그냥 흘러간다. 논문의 실질적 핵심이 이 한 줄이며, 이후 discrete latent를 다루는 연구들이 전부 "여기에 해당하는 트릭이 없다"는 문제와 싸우게 된다.'},
 {h:'KL 항은 정규화가 아니라 잠재 공간의 구조를 강제하는 힘',
  lead:'KL이 잠재 공간을 빈틈없이 채워 사전분포에서 뽑아도 그럴듯한 샘플이 나오게 한다.',
  d:'KL 항은 각 데이터의 posterior를 prior $N(0,I)$ 쪽으로 끌어당긴다. 이 압력이 없으면 encoder는 각 샘플을 서로 멀리 떨어진 점에 박아 두는 룩업 테이블이 되고, 그 사이 공간에서 뽑은 $z$ 는 아무 의미도 없는 출력을 낸다. KL이 잠재 공간을 **빈틈없이 채워** 사전분포에서 뽑은 $z$ 를 decoder에 넣기만 하면 새 샘플이 나오는 구조를 만든다.'},
 {h:'가우시안 prior에서는 KL이 닫힌 형태로 나온다',
  lead:'대각 가우시안과 표준정규를 쓰면 KL 항이 샘플링 없이 수식으로 바로 나온다.',
  d:'$q$ 를 대각 가우시안, $p(z)$ 를 표준정규로 두면 KL 항이 수식으로 정확히 계산된다. 즉 ELBO 두 항 중 하나는 **샘플링조차 필요 없다**. 논문이 미니배치 $M=100$ 에서 데이터당 샘플 $L=1$ 로 충분하다고 보고할 수 있었던 이유다.'}
],

diagram:{type:'flow', cap:'입력 → 분포 파라미터 → 노이즈로 샘플 → 복원. 가운데 z 샘플링만 미분 불가능한데, 그것을 μ+σ⊙ε로 우회한다.',
 nodes:[
  {t:'입력 x', s:'예: 784차원'},
  {t:'Encoder q(z|x)', s:'→ μ, log σ²'},
  {t:'z = μ + σ⊙ε', s:'ε ~ N(0, I)', acc:true},
  {t:'Decoder p(x|z)', s:'z → x̂'},
  {t:'손실', s:'재구성 + KL'}
 ]},

math:[
 {expr:'log p(x) ≥ L(θ,φ;x) = E_q[ log p(x|z) ] − KL( q(z|x) ‖ p(z) )',
  tex:'\\log p(x) \\ge \\mathcal{L}(\\theta,\\phi;x) = \\mathbb{E}_q[\\log p(x|z)] - KL(q(z|x)\\,\\|\\,p(z))',
  d:'ELBO. 앞 항은 "z에서 x를 얼마나 잘 복원하는가"(오토인코더의 재구성 오차), 뒤 항은 "근사 사후분포가 사전분포에서 얼마나 벗어났는가". 두 항의 **줄다리기**가 VAE의 모든 동작을 설명한다.'},
 {expr:'z = μ_φ(x) + σ_φ(x) ⊙ ε,   ε ~ N(0, I)',
  tex:'z = \\mu_\\phi(x) + \\sigma_\\phi(x) \\odot \\epsilon, \\quad \\epsilon \\sim \\mathcal{N}(0, I)',
  d:'reparameterization. 확률변수를 "파라미터의 결정적 함수 + 파라미터와 무관한 노이즈"로 분해한다. 이 형태여야 $\\nabla_\\phi E_q[f(z)] = E_\\epsilon[\\nabla_\\phi f(z(\\phi,\\epsilon))]$ 로 기대값과 미분의 순서를 바꿀 수 있다.'},
 {expr:'KL( N(μ, σ²) ‖ N(0, I) ) = −½ Σ_j ( 1 + log σ_j² − μ_j² − σ_j² )',
  tex:'KL\\left(\\mathcal{N}(\\mu,\\sigma^2)\\,\\|\\,\\mathcal{N}(0,I)\\right) = -\\frac12 \\sum_j \\left(1 + \\log \\sigma_j^2 - \\mu_j^2 - \\sigma_j^2\\right)',
  d:'가우시안 가정에서의 닫힌 해. 구현체에서 흔히 보는 `-0.5 * (1 + logvar - mu.pow(2) - logvar.exp()).sum()` 한 줄이 이것이다. 분산을 직접 출력하지 않고 $\\log\\sigma^2$ 를 출력하는 이유는 양수 제약을 없애고 수치 안정성을 얻기 위해서다.'}
],

numbers:[
 {k:'데이터당 샘플 수 L', v:'1', d:'미니배치 $M=100$ 이면 $L=1$ 로 충분하다고 보고 — 배치가 곧 몬테카를로 평균 역할을 한다'},
 {k:'미니배치 M', v:'100', d:'전체 데이터 크기와 무관하게 스텝 비용이 일정하다는 것이 amortization의 요점'},
 {k:'실험 데이터셋', v:'MNIST · Frey Face', d:'MNIST는 은닉 500 유닛, Frey Face는 200 유닛 MLP'},
 {k:'최적화', v:'Adagrad', d:'stepsize는 {0.01, 0.02, 0.1} 중 선택. [Adam](#/p/adam) 이전 논문이다'},
 {k:'비교 대상', v:'wake-sleep', d:'같은 계산량에서 AEVB가 더 빨리 수렴하고 더 좋은 해에 도달'}
],

impact:'세 가지가 남았다. **(1) 잠재 공간이라는 인터페이스** — 이미지를 저차원 연속 벡터로 놓고 그 위에서 보간·산술·조작을 하는 사고방식이 여기서 표준이 되었다. **(2) 확률적 노드를 통과하는 gradient** — reparameterization은 VAE를 넘어 강화학습 정책, 베이지안 신경망, 미분가능 샘플링 전반의 기본 도구가 되었다. **(3) 목적함수가 명시적** — [GAN](#/p/gan)과 달리 VAE는 우도의 하한이라는 단일 스칼라를 최적화하므로 학습이 안정적이고 수렴 여부를 숫자로 볼 수 있다. 대신 대가는 흐릿한 샘플이었고, 이 약점을 고치려는 시도가 이후 계보 전체를 만든다.',

legacy:[
 '**흐림의 원인을 잠재 공간 쪽에서 해결** — 연속 가우시안 대신 이산 코드북을 쓰는 [VQ-VAE](#/p/vqvae), 그 위에 적대적 손실을 얹은 [VQGAN](#/p/vqgan)으로 이어진다',
 '**흐림의 원인을 decoder 쪽에서 해결** — 한 번에 복원하지 말고 여러 스텝에 걸쳐 노이즈를 제거하자는 발상이 [DDPM](#/p/ddpm)이다. diffusion의 손실 함수는 실제로 계층적 VAE의 ELBO를 다시 쓴 형태다',
 '**픽셀이 아니라 잠재 공간에서 생성** — [Stable Diffusion](#/p/ldm)은 오토인코더로 압축한 잠재 공간에서 diffusion을 돌린다. "잠재 공간에서 논다"는 전제 자체가 이 논문의 유산',
 '**표현 학습 도구로의 전용** — β-VAE 계열의 disentanglement 연구, 이상 탐지, 분자 생성 등 생성 품질과 무관한 영역에서 여전히 현역'
],

pitfalls:[
 '**"VAE = 노이즈 낀 오토인코더"가 아니다.** 병목이 벡터가 아니라 분포이고, KL 항이 그 분포들을 겹치게 만드는 것이 핵심이다. KL을 빼면 그냥 오토인코더가 되고, 사전분포에서 샘플링해 생성하는 기능이 통째로 사라진다.',
 '**흐릿한 샘플은 "학습이 덜 된 것"이 아니라 구조적 결과다.** 가우시안 decoder의 재구성 항은 사실상 픽셀 MSE이고, MSE는 여러 그럴듯한 답의 **평균**을 최적해로 만들어 경계를 뭉갠다. 선명함을 원하면 손실 함수를 바꿔야 한다 — [VQGAN](#/p/vqgan)이 적대적·지각 손실을 넣은 이유가 이것이다.',
 '**posterior collapse에 주의.** decoder가 충분히 강력하면(자기회귀 decoder 등) 모델이 $z$ 를 무시하고 KL을 0으로 만드는 것이 더 쉬운 해가 된다. 이때 잠재 변수는 아무 정보도 담지 않는다. KL 가중치를 서서히 올리는 warm-up, free-bits 등이 대표적 대응책이다.'
],

figures:[
 {f:'fig4-latent-manifold.png',
  cap:'2차원 latent space를 균등 격자로 훑고, 각 격자점 z를 학습된 디코더에 넣어 나온 숫자를 그 위치에 그린 것(MNIST). 왼쪽 위(6)에서 오른쪽 아래(7/1)까지 숫자 모양이 연속적으로 부드럽게 바뀌는 것을 볼 수 있다 — z의 두 축이 임의의 노이즈가 아니라 필체의 연속적인 변형 방향을 인코딩하고 있다는 증거.',
  src:'원문 Figure 4(b), p.10'},
 {f:'fig3-learning-curves.png',
  cap:'x축은 학습에 사용한 샘플 수, y축은 테스트 주변우도(marginal log-likelihood, 높을수록 좋음). 빨강이 이 논문의 AEVB, 초록이 wake-sleep, 파랑이 Monte Carlo EM. 왼쪽(학습 데이터 1000개)과 오른쪽(50000개) 모두에서 AEVB(빨강 실선)이 가장 먼저, 가장 높은 값에 도달한다.',
  src:'원문 Figure 3, p.8'}
],

quotes:[
 {t:'How can we perform efficient inference and learning in directed probabilistic models, in the presence of continuous latent variables with intractable posterior distributions, and large datasets?',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1312.6114 — Auto-Encoding Variational Bayes', u:'https://arxiv.org/abs/1312.6114'},
 {t:'An Introduction to Variational Autoencoders (Kingma & Welling, 2019)', u:'https://arxiv.org/abs/1906.02691'},
 {t:'Tutorial on Variational Autoencoders (Doersch)', u:'https://arxiv.org/abs/1606.05908'}
]
});
