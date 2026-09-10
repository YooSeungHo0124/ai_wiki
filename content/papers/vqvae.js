WIKI.paper({
slug:'vqvae',
venue:'NeurIPS 2017',
authors:'van den Oord, Vinyals, Kavukcuoglu (DeepMind)',
arxiv:'1711.00937',

tldr:'VAE의 연속 잠재변수를 **유한한 코드북에서 고른 이산 코드**로 바꾸고, 양자화라는 미분 불가능한 연산을 straight-through estimator로 우회한 논문. 이미지를 "토큰 격자"로 바꿔 놓음으로써 언어모델용 자기회귀 구조를 이미지에 그대로 붙일 수 있는 길을 열었다.',

context:'[VAE](#/p/vae)의 잠재변수는 연속 가우시안이고, 여기에는 두 가지 문제가 따라다녔다. 첫째, 강력한 자기회귀 decoder와 결합하면 모델이 $z$ 를 무시하고 KL을 0으로 만드는 **posterior collapse**가 거의 항상 일어났다. 둘째, 세상의 많은 데이터는 애초에 이산적이다 — 언어는 단어, 이미지는 "고양이/개", 음성은 음소다. 연속 벡터에 억지로 밀어 넣을 이유가 없다. 한편 당시 이미지 생성의 우도 기반 최강자는 픽셀을 하나씩 예측하는 자기회귀 모델이었는데, $256\\times256$ 이미지면 65,536 스텝을 밟아야 해서 실용성이 없었다. 이 논문은 두 문제를 한 번에 친다 — **이미지를 작은 이산 격자로 먼저 압축하고, 자기회귀 모델은 그 격자 위에서만 돌리자.**',

ideas:[
 {h:'벡터 양자화: encoder 출력을 가장 가까운 코드북 벡터로 스냅',
  lead:'encoder 출력을 코드북에서 가장 가까운 벡터로 스냅해 정수 인덱스로 바꾼다.',
  d:'encoder는 여전히 연속 벡터 $z_e(x)$ 를 뱉지만, decoder에 넘기기 전에 학습되는 임베딩 테이블 $e_1..e_K$ 중 **L2 거리가 가장 가까운 항목**으로 갈아치운다. 결과적으로 decoder가 보는 것은 코드북 인덱스 하나뿐이고, 이미지 전체는 $32\\times32$ 짜리 정수 배열이 된다. 사후분포는 그 한 항목에 확률 1을 주는 결정적 원-핫 분포다.'},
 {h:'Straight-through estimator: 양자화를 gradient에서는 없는 셈 친다',
  lead:'forward에서는 양자화하고 backward에서는 gradient를 그대로 복사해 우회한다.',
  d:'$\\arg\\min$ 은 미분이 0이거나 정의되지 않아서 decoder의 gradient가 encoder에 도달하지 못한다. 해법은 뻔뻔하다 — **forward에서는 양자화하고, backward에서는 $z_q$ 의 gradient를 $z_e$ 에 그대로 복사한다.** 구현은 `z_q = z_e + (quantize(z_e) - z_e).detach()` 한 줄이다. 편향된 추정기지만 실제로 잘 동작하며, [VAE](#/p/vae)의 reparameterization이 하던 역할을 이산 잠재에서 대신한다.'},
 {h:'손실이 세 조각: 재구성 · 코드북 · 커밋먼트',
  lead:'재구성·코드북·커밋먼트 손실이 서로 다른 파라미터를 나눠서 갱신한다.',
  d:'재구성 손실은 decoder와 (straight-through를 통해) encoder를 학습시킨다. 코드북 손실 $\\|sg[z_e]-e\\|^2$ 는 선택된 임베딩을 encoder 출력 쪽으로 끌어당긴다. 커밋먼트 손실 $\\beta\\|z_e-sg[e]\\|^2$ 는 반대로 encoder가 코드북에서 멀리 떠돌지 않게 붙잡는다. `sg`는 stop-gradient. 세 항이 서로 다른 파라미터를 담당하도록 gradient를 갈라 놓은 것이 설계의 핵심이다.'},
 {h:'KL 항이 상수가 되어 posterior collapse가 사라진다',
  lead:'균등 사전분포를 쓰면 KL이 상수가 되어 collapse가 구조적으로 사라진다.',
  d:'사전분포를 코드북 위의 균등분포로 두면 $KL(q\\|p) = \\log K$ 로 **$x$ 와 무관한 상수**가 된다. 최적화가 건드릴 수 없으니 "KL을 줄이려고 잠재를 무시한다"는 선택지 자체가 없어진다. VAE가 KL 가중치 스케줄링으로 씨름하던 문제를 구조로 제거한 셈이다.'},
 {h:'2단계 학습: 압축과 생성을 분리한다',
  lead:'먼저 이산 코드로 압축하고, 그 코드 위에 별도의 자기회귀 prior를 학습한다.',
  d:'1단계에서 VQ-VAE로 토크나이저를 학습하고 나면, 2단계에서는 그 이산 코드 위에 별도의 강력한 자기회귀 prior(이미지는 PixelCNN, 음성은 WaveNet)를 학습한다. 생성은 prior에서 코드 격자를 샘플링한 뒤 decoder를 한 번 통과시키면 끝이다. **"압축기 따로, 생성기 따로"** 라는 이 분업이 [VQGAN](#/p/vqgan)·[DALL·E](#/p/dalle)·[Stable Diffusion](#/p/ldm)까지 그대로 이어진다.'}
],

diagram:{type:'compare', cap:'연속 잠재 대 이산 잠재. 오른쪽에서는 KL이 상수가 되고, 잠재가 "토큰"이 되어 언어모델을 그대로 붙일 수 있게 된다.',
 left:{t:'VAE: 연속 잠재', items:[
  'encoder가 μ, σ를 출력',
  'reparameterization으로 z 샘플',
  'KL 항이 x마다 달라짐 → collapse 위험',
  '잠재가 실수 벡터라 자기회귀 모델과 안 맞음',
  '픽셀 MSE → 흐릿한 샘플']},
 right:{t:'VQ-VAE: 이산 코드북', items:[
  'encoder 출력을 최근접 e_k로 스냅',
  'straight-through로 gradient 복사',
  'KL = log K 상수 → collapse 제거',
  '잠재가 정수 격자 → 자기회귀 직결',
  '2단계: 토크나이저 학습 → prior 학습']}},

math:[
 {expr:'q(z = k | x) = 1  if  k = argmin_j ‖ z_e(x) − e_j ‖₂,  else 0',
  tex:'q(z=k\\mid x) = \\mathbb{1}\\!\\left[k=\\arg\\min_j \\|z_e(x)-e_j\\|_2\\right]',
  d:'사후분포가 원-핫 결정적 분포다. 샘플링이 없으므로 reparameterization도 필요 없지만, 대신 $\\arg\\min$ 이 gradient를 끊는다.'},
 {expr:'L = log p(x | z_q(x)) + ‖ sg[z_e(x)] − e ‖² + β ‖ z_e(x) − sg[e] ‖²',
  tex:'L = \\log p(x\\mid z_q(x)) + \\|\\text{sg}[z_e(x)] - e\\|^2 + \\beta\\|z_e(x) - \\text{sg}[e]\\|^2',
  d:'첫 항은 decoder + (straight-through) encoder, 둘째 항은 **코드북 임베딩만**, 셋째 항은 **encoder만** 갱신한다. 논문은 $\\beta$ 를 0.1~2.0 범위에서 결과가 거의 변하지 않았다고 보고하고 0.25를 쓴다.'},
 {expr:'∇_{z_e} L_recon  ←  ∇_{z_q} L_recon',
  tex:'\\nabla_{z_e} L_{recon} \\leftarrow \\nabla_{z_q} L_{recon}',
  d:'straight-through의 전부. 양자화 연산의 Jacobian을 항등행렬로 근사한다. $z_e$ 와 $z_q$ 가 가까이 있는 한(그래서 커밋먼트 손실이 필요하다) 이 근사가 크게 틀리지 않는다.'}
],

numbers:[
 {k:'코드북 크기 K', v:'512', d:'이미지·VCTK 음성 실험 기본값. 인덱스 하나가 9비트'},
 {k:'ImageNet 압축률', v:'약 42.6배', d:'$128\\times128\\times3$ 픽셀(8비트) → $32\\times32$ 코드(9비트)'},
 {k:'커밋먼트 계수 β', v:'0.25', d:'0.1~2.0 사이에서 결과가 변하지 않을 만큼 둔감'},
 {k:'CIFAR-10 bits/dim', v:'4.67', d:'연속 VAE 4.51, VIMCO 5.14 — 우도는 조금 나쁘지만 **이산 잠재로도 경쟁 가능**하다는 것이 요점'},
 {k:'음성 잠재 압축', v:'64배', d:'stride 2 합성곱 6개. 이 정도로 줄이면 화자 정체성은 버려지고 음소 내용만 남는다'}
],

impact:'"이미지는 연속 신호"라는 전제를 깨고 **이미지를 토큰 시퀀스로 취급하는 관행**을 만들었다. 일단 이미지가 $32\\times32=1024$ 개의 정수가 되면, NLP에서 쌓아 온 자기회귀 모델링 기법을 통째로 가져다 쓸 수 있다. 동시에 posterior collapse를 하이퍼파라미터 튜닝이 아니라 구조 설계로 없앨 수 있음을 보였다. 음성 실험에서는 화자 정보를 버리고 음소 내용만 남기는 코드가 **비지도로** 학습된다는 것을 보여, 이산 잠재가 단순 압축이 아니라 의미 있는 분해를 만든다는 근거가 되었다.',

legacy:[
 '**[VQ-VAE-2](#/p/vqvae2) (2019)** — 계층적 코드북(전역/지역)과 더 큰 PixelCNN prior로 당시 최고 수준이던 [GAN](#/p/gan) 계열에 필적하는 고해상도 샘플에 도달, 이산 잠재 노선의 실효성을 증명',
 '**적대적 손실과의 결합** — [VQGAN](#/p/vqgan)이 재구성 손실을 지각 손실 + discriminator로 바꿔 같은 토큰 수로 훨씬 선명한 복원을 얻고, 그 위에 [Transformer](#/p/transformer)를 올린다',
 '**텍스트–이미지 통합 시퀀스** — [DALL·E](#/p/dalle)가 이 구조의 dVAE 변형을 써서 텍스트 토큰과 이미지 토큰을 한 줄에 이어 붙이고 12B 모델로 자기회귀 생성',
 '**연속 잠재로의 회귀** — [Stable Diffusion](#/p/ldm)은 VQGAN 계열 오토인코더를 쓰되 양자화를 약화시킨 KL 정규화 버전을 선택했다. 이산화가 항상 유리한 것은 아니라는 점도 이 계보의 결론 중 하나'
],

pitfalls:[
 '**코드북 붕괴(codebook collapse)가 실전의 최대 난관이다.** 초기에 몇 개 코드만 선택되면 나머지는 gradient를 못 받아 영원히 죽고, 유효 코드북 크기가 K보다 훨씬 작아진다. EMA 기반 코드북 갱신, 죽은 코드 재초기화, 코드북 차원 축소 같은 대응책이 사실상 필수다.',
 '**straight-through는 편향된 추정기다.** 잘 동작한다는 것은 경험적 사실이지 이론적 보장이 아니다. 양자화 오차가 크면 encoder가 받는 gradient는 실제 목적함수의 gradient와 다른 방향을 가리킬 수 있다.',
 '**VQ-VAE 자체는 생성 모델로 쓸 수 없다.** prior가 균등분포라서 코드를 무작위로 뽑으면 잡음이 나온다. 반드시 2단계에서 코드 격자에 대한 prior를 따로 학습해야 하며, **최종 샘플 품질의 대부분은 그 prior가 결정한다.**'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽: encoder(CNN)가 이미지를 z_e(x)로 만들고, 이를 위쪽 임베딩 공간(e₁…e_K)에서 가장 가까운 벡터로 바꿔치기해(파란 점, q(z|x)) z_q(x)를 얻은 뒤 decoder(CNN)에 넣어 복원한다. 빨간 화살표(∇_z L)가 decoder 쪽에서 encoder 쪽으로 그대로 복사되는 것에 주목 — 이것이 양자화를 건너뛰는 straight-through gradient다. 오른쪽: 임베딩 공간을 점으로 시각화한 것으로, z_e(x)(노랑)가 가장 가까운 e₂(초록)로 스냅되고 gradient(빨강)가 그 지점을 밀어 다음 forward pass에서 다른 코드로 배정될 수 있게 한다.',
  src:'원문 Figure 1, p.4'}
],

quotes:[
 {t:'Our model, which relies on vector quantization (VQ), is simple to train, does not suffer from large variance, and avoids the "posterior collapse" issue which has been problematic with many VAE models that have a powerful decoder.',
  src:'Section 1, p.1-2'}
],

links:[
 {t:'arXiv 1711.00937 — Neural Discrete Representation Learning', u:'https://arxiv.org/abs/1711.00937'},
 {t:'arXiv 1906.00446 — Generating Diverse High-Fidelity Images with VQ-VAE-2', u:'https://arxiv.org/abs/1906.00446'},
 {t:'sonnet/DeepMind VQ-VAE 공식 구현', u:'https://github.com/google-deepmind/sonnet'}
]
});
