WIKI.paper({
slug:'ddpm',
venue:'NeurIPS 2020',
authors:'Ho, Jain, Abbeel (UC Berkeley)',
arxiv:'2006.11239',

tldr:'이미지에 가우시안 노이즈를 1000번 조금씩 더해 완전한 잡음으로 만든 뒤, 그 과정을 거꾸로 되돌리도록 신경망을 학습시킨다. 복잡해 보이는 변분 하한이 결국 **"이 이미지에 섞인 노이즈를 맞혀라"는 MSE 한 줄**로 정리된다는 것을 보이면서, 확산 모델을 GAN과 겨룰 수 있는 생성 모델로 끌어올렸다.',

context:'2020년의 이미지 생성은 [GAN](#/p/gan)의 시대였다. 품질은 [StyleGAN](#/p/stylegan)이 압도했지만 대가가 컸다 — 생성자와 판별자의 minimax 게임은 학습이 불안정하고, 모드 붕괴로 데이터 분포의 일부를 통째로 놓치며, 우도(likelihood)를 계산할 수 없어 모델을 정량적으로 비교하기 어렵다. 반대편의 [VAE](#/p/vae)나 흐름 기반 모델은 안정적이고 우도가 있지만 샘플이 흐릿했다. 확산 모델 자체는 2015년 Sohl-Dickstein 등이 비평형 열역학에서 빌려와 이미 제안했으나, 샘플 품질이 경쟁력이 없어 6년 가까이 방치돼 있었다. 이 논문은 새 아이디어를 발명했다기보다, **파라미터화를 바꾸면 같은 목적함수가 훨씬 잘 학습된다**는 것을 찾아냈다.',

ideas:[
 {h:'전방 과정: 학습할 것이 없는 고정된 노이즈 스케줄',
  lead:'노이즈 스케줄 βt는 학습 대상이 아닌 고정 상수라 흔들리는 상대가 없다.',
  d:'$q(x_t|x_{t-1}) = N(\\sqrt{1-\\beta_t}\\,x_{t-1},\\ \\beta_t I)$ 로 매 스텝 조금씩 노이즈를 섞고 신호를 줄인다. $\\beta_t$ 는 학습 대상이 아니라 $10^{-4}$ 에서 $0.02$ 까지 선형으로 커지는 **고정 상수**다. $T=1000$ 스텝을 거치면 원본이 무엇이었든 표준 정규분포에 도달한다. 학습되는 부분이 없다는 것이 핵심이다 — GAN의 판별자처럼 같이 흔들리는 상대가 없다.'},
 {h:'임의의 t로 한 번에 점프한다',
  lead:'가우시안의 재생성으로 임의의 t의 노이즈 이미지를 한 번에 샘플링한다.',
  d:'가우시안을 연달아 더하면 가우시안이므로 1000번을 시뮬레이션할 필요가 없다. $\\bar\\alpha_t = \\prod_{s\\le t}(1-\\beta_s)$ 라 두면 $x_t = \\sqrt{\\bar\\alpha_t}\\,x_0 + \\sqrt{1-\\bar\\alpha_t}\\,\\epsilon$ 로 곧바로 샘플링된다. 덕분에 학습 루프는 **이미지 하나 뽑고, $t$ 를 균등하게 하나 뽑고, 노이즈 하나 뽑아 섞는 것**이 전부다. 스텝별로 순차 학습할 필요가 없어 완전히 병렬이다.'},
 {h:'ε 예측: 목적함수가 MSE 한 줄로 무너진다',
  lead:'평균 대신 노이즈를 예측하도록 재파라미터화하면 손실이 MSE로 단순해진다.',
  d:'변분 하한은 원래 $T$ 개의 KL 항으로 이루어진 험한 식이다. 그런데 역방향 평균 $\\mu_\\theta$ 를 직접 예측하는 대신 **섞인 노이즈 $\\epsilon$ 을 예측하도록 다시 쓰고**, 각 항의 가중치를 1로 버리면 $\\|\\epsilon - \\epsilon_\\theta(x_t,t)\\|^2$ 만 남는다. 논문은 이 단순화된 $L_{simple}$ 이 정식 하한보다 **샘플 품질이 더 좋다**고 보고한다. 이론적으로 덜 엄밀한 쪽이 실제로는 더 잘 되는, 흔치 않은 사례다.'},
 {h:'디노이징 = 스코어 추정이라는 다리',
  lead:'노이즈 예측이 곧 데이터 밀도의 스코어 추정과 같다는 것을 보인다.',
  d:'$\\epsilon_\\theta$ 는 상수배만 다르게 보면 $\\nabla_{x}\\log q(x_t)$, 즉 데이터 밀도의 **스코어**를 추정하는 것과 같다. 그러면 역방향 샘플링은 노이즈 수준을 낮춰가며 진행하는 어닐링 Langevin 동역학이 된다. 이 관찰이 확산과 스코어 매칭이라는 두 갈래를 하나로 묶었고, 곧바로 [Score SDE](#/p/score-sde)의 연속시간 일반화로 이어진다.'},
 {h:'백본은 시간을 조건으로 받는 U-Net',
  lead:'타임스텝 임베딩과 self-attention을 얹은 U-Net이 표준 백본이 된다.',
  d:'$\\epsilon_\\theta$ 는 입력과 출력이 같은 해상도의 이미지이므로 [U-Net](#/p/unet)이 그대로 맞는다. 여기에 (1) 정현파 임베딩으로 만든 타임스텝 $t$ 를 각 residual 블록에 더하고, (2) 16×16 해상도에 self-attention을 넣고, (3) group normalization을 쓴다. 이 세 가지를 얹은 U-Net이 이후 [DDIM](#/p/ddim)·[CFG](#/p/cfg)·[LDM](#/p/ldm)까지 그대로 표준 백본으로 굳는다.'}
],

diagram:{type:'loop', cap:'전방(q)은 고정된 노이즈 추가, 역방향(p)은 학습된 노이즈 제거. 생성은 순수 잡음에서 시작해 오른쪽 화살표를 T번 도는 것이다.',
 center:'t = T … 1',
 nodes:[
  {t:'원본 이미지 x₀', s:'데이터 분포'},
  {t:'노이즈 추가', s:'q(xt|xt-1) · βt 고정'},
  {t:'순수 가우시안 x_T', s:'N(0, I) · T=1000'},
  {t:'노이즈 예측', s:'εθ(xt,t) · MSE 학습', acc:true},
  {t:'한 스텝 되돌리기', s:'xt → xt-1'}
 ]},

math:[
 {expr:'x_t = √(ᾱ_t) · x₀ + √(1 − ᾱ_t) · ε,    ε ~ N(0, I)',
  tex:'x_t = \\sqrt{\\bar\\alpha_t}\\,x_0 + \\sqrt{1-\\bar\\alpha_t}\\,\\epsilon,\\quad \\epsilon \\sim N(0,I)',
  d:'전방 과정의 닫힌 형태. $\\bar\\alpha_t$ 가 1에서 0으로 내려가며 신호와 잡음의 비율을 결정한다. 학습 시 $t$ 를 무작위로 뽑아 이 식으로 곧장 $x_t$ 를 만든다.'},
 {expr:'L_simple = E_{t, x₀, ε} [ ‖ ε − ε_θ( √(ᾱ_t)x₀ + √(1−ᾱ_t)ε , t ) ‖² ]',
  tex:'L_{simple} = \\mathbb{E}_{t,x_0,\\epsilon}\\left[\\lVert \\epsilon - \\epsilon_\\theta(\\sqrt{\\bar\\alpha_t}x_0+\\sqrt{1-\\bar\\alpha_t}\\epsilon,\\ t) \\rVert^2\\right]',
  d:'논문 전체의 결론. 변분 하한에서 가중치를 떼어낸 형태로, 실질적으로는 **노이즈 수준이 무작위인 디노이징 오토인코더를 하나의 네트워크로 학습**하는 것이다.'},
 {expr:'x_{t-1} = (1/√α_t) ( x_t − (β_t/√(1−ᾱ_t)) ε_θ(x_t,t) ) + σ_t z',
  tex:'x_{t-1} = \\frac{1}{\\sqrt{\\alpha_t}}\\left(x_t - \\frac{\\beta_t}{\\sqrt{1-\\bar\\alpha_t}}\\epsilon_\\theta(x_t,t)\\right) + \\sigma_t z',
  d:'샘플링 한 스텝. 예측한 노이즈를 빼서 평균을 구하고, 다시 약간의 잡음 $\\sigma_t z$ 를 더한다. 이 마지막 항을 0으로 두는 것이 [DDIM](#/p/ddim)의 출발점이다.'}
],

numbers:[
 {k:'CIFAR-10 FID', v:'3.17', d:'당시 무조건부 생성 최고 기록. GAN 계열을 처음으로 앞섰다'},
 {k:'CIFAR-10 Inception Score', v:'9.46', d:'클래스 조건 없이 얻은 값'},
 {k:'확산 스텝 T', v:'1000', d:'샘플 한 장에 U-Net forward **1000회** — 실용성의 최대 걸림돌'},
 {k:'노이즈 스케줄 β', v:'1e-4 → 0.02', d:'선형 증가, 학습되지 않는 고정 하이퍼파라미터'},
 {k:'우도(NLL)', v:'≤ 3.75 bits/dim', d:'$L_{simple}$ 사용 시. 우도 전용 모델보다는 나쁘고, 샘플 품질은 훨씬 좋다'},
 {k:'최대 해상도', v:'LSUN 256×256', d:'ProgressiveGAN에 필적하는 품질을 보고'}
],

figures:[
 {f:'fig2-forward-reverse.png',
  cap:'위쪽 화살표 사슬이 두 방향 과정이다. 오른쪽에서 왼쪽(점선, q(x_t|x_{t-1}))은 깨끗한 사진 x_0에 매 스텝 조금씩 가우시안 노이즈를 더해 완전한 잡음 x_T로 만드는 **고정된, 학습되지 않는** forward process다. 왼쪽에서 오른쪽(실선, p_θ(x_{t-1}|x_t))은 신경망이 노이즈 x_T에서 한 스텝씩 노이즈를 제거해 x_0을 복원하려는 **학습 대상** reverse process다. 아래 회색조 이미지들이 T→0로 갈수록 잡음이 걷히는 것을 보여준다.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'Diffusion models are straightforward to define and efficient to train, but to the best of our knowledge, there has been no demonstration that they are capable of generating high quality samples.',
  src:'§1, p.2'}
],

impact:'세 가지가 동시에 정리됐다. **(1) 학습 안정성** — 적대적 게임도, 모드 붕괴도 없이 그냥 MSE를 내리면 되므로 학습률·아키텍처에 둔감하고, 데이터와 연산을 늘리면 그대로 좋아진다. **(2) 목적함수의 단순함** — 구현이 200줄 수준으로 줄어들면서 연구 진입장벽이 사라졌고, 1년 만에 수백 편의 후속 논문이 쏟아졌다. **(3) 모듈성** — 노이즈 스케줄, 샘플러, 조건 주입, 백본이 서로 독립적인 부품이 되어 각각을 따로 갈아끼울 수 있게 됐다. 실제로 [DDIM](#/p/ddim)은 샘플러만, [CFG](#/p/cfg)는 조건 주입만, [LDM](#/p/ldm)은 작동 공간만, [DiT](#/p/dit)는 백본만 바꾼 것이다. 남긴 숙제는 명확하다 — **한 장에 1000번의 forward**.',

legacy:[
 '**연속시간 일반화** — [Score SDE](#/p/score-sde)가 1000개의 이산 스텝을 하나의 확률미분방정식으로 묶고, 다시 [Flow Matching](#/p/flow-matching)으로 이어진다',
 '**샘플링 가속** — [DDIM](#/p/ddim)이 스텝을 50 이하로 줄이고, [Consistency Models](#/p/consistency)는 결국 1~2스텝까지 밀어붙인다',
 '**조건 생성** — [Classifier-Free Guidance](#/p/cfg)가 텍스트·클래스 조건을 붙이는 표준이 되면서 text-to-image의 문이 열린다',
 '**작동 공간과 백본 교체** — [LDM/Stable Diffusion](#/p/ldm)이 픽셀 대신 [VQGAN](#/p/vqgan)류 잠재공간으로, [DiT](#/p/dit)가 U-Net 대신 [ViT](#/p/vit)로 갈아끼운다'
],

pitfalls:[
 '**"노이즈를 예측한다"와 "이미지를 예측한다"는 수학적으로 동치지만 학습은 다르다.** $x_0$ 예측, $\\epsilon$ 예측, $v$ 예측은 같은 것의 재파라미터화인데도 손실의 암묵적 가중치가 달라져서 실제 품질이 크게 갈린다. 이 논문의 기여 상당 부분이 이 선택 하나에 있다.',
 '**$T=1000$ 은 학습 시 비용이 아니라 샘플링 시 비용이다.** 학습은 매 배치마다 $t$ 를 하나만 뽑으므로 일반적인 지도학습과 비용이 같다. 느린 것은 오직 생성 쪽이다.',
 '**우도가 좋다고 샘플이 좋은 것이 아니다.** 논문의 3.75 bits/dim은 우도 전용 모델에 밀리는데도 FID는 최고였다. 대부분의 codelength가 사람 눈에 안 보이는 미세 디테일에 쓰이기 때문으로, 이 괴리는 생성 모델 평가의 고질적 문제다.'
],

links:[
 {t:'arXiv 2006.11239 — Denoising Diffusion Probabilistic Models', u:'https://arxiv.org/abs/2006.11239'},
 {t:'공식 구현 (hojonathanho/diffusion)', u:'https://github.com/hojonathanho/diffusion'},
 {t:'What are Diffusion Models? (Lilian Weng)', u:'https://lilianweng.github.io/posts/2021-07-11-diffusion-models/'}
]
});
