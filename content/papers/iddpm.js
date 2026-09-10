WIKI.paper({
slug:'iddpm',
venue:'ICML 2021',
authors:'Nichol, Dhariwal (OpenAI)',
arxiv:'2102.09672',

tldr:'[DDPM](#/p/ddpm)이 샘플 품질만 좋고 로그우도는 나빴던 문제를, **역방향 분산을 학습**하고 **코사인 노이즈 스케줄**을 써서 해결한 논문. 부산물로 샘플링 스텝을 1000에서 수십 개로 줄여도 품질이 거의 안 떨어진다는 것도 보였다.',

context:'[DDPM](#/p/ddpm)은 CIFAR-10·LSUN에서 뛰어난 샘플을 냈지만, 역방향 분산 $\\Sigma_\\theta$를 시간에 따라 고정된 상수($\\beta_t$ 또는 $\\tilde\\beta_t$)로 두고 평균만 학습했다. 그 결과 로그우도는 자기회귀 모델·[정규화 흐름](#/p/real-nvp) 계열 같은 우도 기반 모델에 크게 못 미쳤다. 우도가 나쁘다는 것은 모델이 데이터 분포의 일부 모드를 놓치고 있다는 신호일 수 있어, 이 논문은 "샘플 품질을 해치지 않고 우도를 끌어올릴 수 있는가"를 묻는다.',

ideas:[
 {h:'분산도 학습한다 — 고정 상수 대신 보간',
  lead:'$\\beta_t$와 $\\tilde\\beta_t$ 사이를 신경망이 예측하는 계수로 log-domain 보간한다.',
  d:'DDPM은 $\\Sigma_\\theta$를 학습하려다 불안정해져 포기했다. 이 논문은 분산의 합리적 범위가 $\\beta_t$(상한)와 $\\tilde\\beta_t$(하한) 사이로 매우 좁다는 점에 착안해, 신경망이 직접 분산이 아니라 보간 계수 $v$를 출력하게 한다. $\\Sigma_\\theta = \\exp(v\\log\\beta_t + (1-v)\\log\\tilde\\beta_t)$ 로 재매개변수화하면 학습이 안정된다.'},
 {h:'하이브리드 목적함수: 평균은 simple loss, 분산은 VLB',
  lead:'$L_{simple}$에 작은 가중치로 VLB를 더해, 평균 학습을 해치지 않으면서 분산에 신호를 준다.',
  d:'DDPM의 $L_{simple}$은 $\\Sigma_\\theta$에 대한 그레디언트를 전혀 주지 않는다. 그렇다고 $L_{vlb}$만 최적화하면 그레디언트 잡음이 훨씬 커서 학습이 어렵다. $L_{hybrid}=L_{simple}+\\lambda L_{vlb}$ ($\\lambda=0.001$)로 절충하고, $\\mu_\\theta$ 쪽 그레디언트는 멈춰(stop-gradient) $L_{vlb}$가 분산만 조정하게 만든다.'},
 {h:'코사인 스케줄: 노이즈를 더 천천히 섞는다',
  lead:'선형 스케줄은 뒷부분에서 정보를 너무 빨리 지워, $\\bar\\alpha_t$가 코사인 곡선을 따르게 바꾼다.',
  d:'선형 $\\beta_t$ 스케줄은 저해상도(32×32·64×64)에서 확산 과정 후반부의 잠재변수가 일찌감치 순수 노이즈가 돼버려, 그 구간의 학습 신호가 낭비된다. $\\bar\\alpha_t=\\cos^2\\!\\big((t/T+s)/(1+s)\\cdot\\pi/2\\big)$ 로 정의된 코사인 스케줄은 양 끝에서 완만하고 중간에서 선형으로 떨어져, 정보를 더 고르게 파괴한다.'},
 {h:'중요도 샘플링으로 VLB 자체도 직접 최적화 가능하게',
  lead:'손실 크기가 큰 시간 스텝을 더 자주 뽑아 $L_{vlb}$의 그레디언트 잡음을 줄인다.',
  d:'VLB의 각 항 $L_{t-1}$은 스텝마다 크기가 크게 다른데(초반 스텝이 NLL에 훨씬 크게 기여), $t$를 균등 샘플링하면 잡음이 커진다. 각 손실항 제곱의 이동평균에 비례하게 $t$를 뽑는 중요도 샘플링을 쓰면 $L_{vlb}$를 직접 최적화해도 $L_{hybrid}$보다 낮은 NLL을 얻을 수 있다.'},
 {h:'적은 스텝으로도 샘플링이 된다는 부수 효과',
  lead:'학습된 분산 덕분에 재학습 없이 4000스텝 모델을 25~100스텝만으로 샘플링해도 품질이 거의 유지된다.',
  d:'분산이 고정된 $L_{simple}$ 모델은 샘플링 스텝을 줄이면 FID가 급격히 나빠지지만, $\\Sigma_\\theta$를 학습한 $L_{hybrid}$ 모델은 학습 시퀀스의 부분수열만 써도(스텝 수를 균등 간격으로 골라 $\\bar\\alpha_t$를 재계산) 100스텝 근처에서 이미 최적에 가까운 FID를 낸다.'}
],

diagram:{type:'compare', cap:'DDPM 대비 IDDPM이 바꾼 두 축 — 분산과 노이즈 스케줄.',
 left:{t:'DDPM (2020)', items:['Σθ 고정(βt 또는 β̃t)','선형 노이즈 스케줄','1000스텝 샘플링 필요','CIFAR-10 NLL 3.70']},
 right:{t:'Improved DDPM', items:['Σθ를 v로 보간 학습','코사인 노이즈 스케줄','25~100스텝으로 대체 가능','CIFAR-10 NLL 2.94']}},

math:[
 {expr:'Σθ(xt,t) = exp(v log βt + (1−v) log β̃t)',
  tex:'\\Sigma_\\theta(x_t,t) = \\exp\\!\\big(v \\log \\beta_t + (1-v)\\log \\tilde\\beta_t\\big)',
  d:'분산을 직접 예측하지 않고 $\\beta_t$·$\\tilde\\beta_t$ 사이의 log-domain 보간 계수 $v$를 예측한다. 두 값이 상한·하한을 이루므로 안정적으로 학습된다.'},
 {expr:'L_hybrid = L_simple + λ L_vlb',
  tex:'L_{\\text{hybrid}} = L_{\\text{simple}} + \\lambda L_{\\text{vlb}},\\quad \\lambda=0.001',
  d:'$\\mu_\\theta$는 주로 $L_{simple}$이 학습시키고, $\\Sigma_\\theta$는 $L_{vlb}$가 학습시키도록 절충한 손실. $\\mu_\\theta$ 쪽엔 $L_{vlb}$의 stop-gradient가 걸려있다.'},
 {expr:'ᾱt = f(t)/f(0),  f(t) = cos²( (t/T + s)/(1+s) · π/2 )',
  tex:'\\bar\\alpha_t = \\frac{f(t)}{f(0)},\\qquad f(t) = \\cos^2\\!\\left(\\frac{t/T+s}{1+s}\\cdot\\frac{\\pi}{2}\\right),\\quad s=0.008',
  d:'코사인 노이즈 스케줄. $\\beta_t=1-\\bar\\alpha_t/\\bar\\alpha_{t-1}$ 로 변환해 쓰며, $t=T$ 근처 특이점 방지를 위해 $\\beta_t\\le 0.999$로 클리핑한다.'}
],

numbers:[
 {k:'CIFAR-10 NLL', v:'2.94 bits/dim', d:'DDPM의 3.70에서 크게 개선, Sparse Transformer(2.80)에 근접'},
 {k:'ImageNet 64×64 NLL', v:'3.53 bits/dim', d:'DDPM 3.77 대비 개선, conv 기반 모델 중 최상급'},
 {k:'샘플링 스텝 축소', v:'4000 → 100', d:'Lhybrid+학습된 분산 모델은 100스텝에서 근최적 FID'},
 {k:'클래스 조건부 ImageNet 64×64 FID', v:'2.92', d:'270M 파라미터, 250 스텝 — BigGAN-deep(4.06)보다 recall 우수'},
 {k:'FID vs recall', v:'BigGAN recall 0.59 vs 확산 0.71', d:'유사 FID에서 확산 모델이 분포를 더 넓게 커버'},
 {k:'스케일링', v:'FID ~ 컴퓨트의 거듭제곱 법칙', d:'채널수 64~192(30M~270M) 모델에서 FID가 예측 가능하게 개선'}
],

impact:'DDPM을 "우도는 나쁘지만 샘플은 예쁜 모델"에서 우도 기반 모델과 정면으로 경쟁 가능한 모델로 바꿨다. 분산 학습과 코사인 스케줄은 이후 거의 모든 확산 모델의 기본값이 됐고, 적은 스텝 샘플링이 가능하다는 발견은 실용적 배포의 문턱을 크게 낮췄다. 같은 저자들(Nichol·Dhariwal)이 곧이어 [확산이 GAN을 이기다](#/p/diffusion-beats-gan)에서 classifier guidance로 FID를 GAN 이하로 끌어내리는데, 그 논문의 아키텍처·스케줄 기반이 전부 이 논문에서 나온다.',

legacy:[
 '**[확산이 GAN을 이기다](#/p/diffusion-beats-gan)** — 같은 저자가 이 논문의 코사인 스케줄·학습된 분산 위에 classifier guidance를 얹어 GAN보다 낮은 FID를 달성',
 '**코사인/개선된 스케줄의 표준화** — 이후 [LDM](#/p/ldm)·[Imagen](#/p/imagen) 등 대부분의 확산 모델이 선형 대신 코사인류 스케줄을 기본값으로 채택',
 '**적은 스텝 샘플링 계열** — 병렬로 나온 [DDIM](#/p/ddim)의 결정론적 샘플러와 이 논문의 학습된 분산 재사용 기법이 함께 빠른 샘플링 연구의 출발점이 됨',
 '**precision/recall로 모드 커버리지 비교** — FID만으로는 안 보이는 "확산이 GAN보다 분포를 더 넓게 덮는다"는 관찰이 이후 확산 vs GAN 논쟁의 핵심 근거로 반복 인용됨'
],

pitfalls:[
 '**"VLB를 직접 최적화하면 우도가 가장 좋아진다"는 직관은 틀렸다.** 균등 샘플링된 $L_{vlb}$는 그레디언트가 너무 시끄러워 $L_{hybrid}$보다 학습이 어렵고, 중요도 샘플링을 추가해야만 $L_{vlb}$ 직접 최적화가 더 나은 우도를 낸다.',
 '**적은 스텝 샘플링이 공짜는 아니다.** 분산이 고정된 기존 DDPM 방식으로 스텝을 줄이면 FID가 급격히 나빠진다 — 학습된 $\\Sigma_\\theta$가 있어야만 스텝 축소가 안전하다.',
 '**FID가 좋다고 분포 커버리지가 좋은 것은 아니다.** BigGAN-deep은 이 논문의 확산 모델보다 FID는 좋지만 recall(모드 커버리지)은 더 나쁘다 — 지표 하나로 생성 모델을 비교하면 안 된다는 것을 이 논문 자체가 보여준다.'
],

figures:[
 {f:'fig5-cosine-schedule.png', cap:'선형(파랑) vs 코사인(주황) 스케줄에서 시간에 따른 ᾱt(누적 신호 비율)의 변화. 선형은 t/T=0.5 이전에 이미 정보 대부분이 사라지는 반면, 코사인은 양 끝에서 완만하고 중간에서만 급격히 떨어져 확산 과정 전체를 고르게 쓴다.',
  src:'원문 Figure 5, p.4'},
 {f:'fig3-latent-samples.png', cap:'같은 이미지에 t=0부터 T까지 균등 간격으로 노이즈를 씌운 잠재변수. 위쪽 선형 스케줄은 이미지 후반 1/4 지점에서 이미 거의 순수 노이즈가 되는 반면, 아래쪽(원문에는 이어지는) 코사인 스케줄은 노이즈가 훨씬 천천히 쌓인다.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'We find that learning variances of the reverse diffusion process allows sampling with an order of magnitude fewer forward passes with a negligible difference in sample quality.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2102.09672 — Improved Denoising Diffusion Probabilistic Models', u:'https://arxiv.org/abs/2102.09672'},
 {t:'공식 코드 (openai/improved-diffusion)', u:'https://github.com/openai/improved-diffusion'}
]
});
