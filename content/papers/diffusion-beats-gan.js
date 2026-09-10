WIKI.paper({
slug:'diffusion-beats-gan',
venue:'NeurIPS 2021',
authors:'Dhariwal & Nichol (OpenAI)',
arxiv:'2105.05233',

tldr:'제목 그대로다. U-Net 구조를 체계적으로 개선하고 **classifier guidance**를 더해, 확산 모델이 처음으로 ImageNet에서 `[BigGAN](#/p/biggan)`-deep을 FID로 앞질렀다. 확산이 "느리지만 다양한 대안"에서 "품질도 최고인 표준"으로 자리를 바꾼 논문이다.',

context:'`[DDPM](#/p/ddpm)`은 GAN보다 학습이 안정적이고 mode collapse가 없었지만, LSUN·ImageNet 같은 어려운 데이터셋에서 샘플 품질(FID)은 여전히 `[BigGAN](#/p/biggan)`-deep에 뒤처졌다. Nichol & Dhariwal의 IDDPM이 분산 스케줄과 hybrid loss로 이를 좁혔지만 격차가 남아 있었다. 이 논문은 두 갈래로 이 문제를 공격한다 — (1) 아키텍처 자체를 ablation으로 하나씩 최적화하고, (2) 클래스 레이블 정보를 분류기의 gradient를 통해 샘플링 과정에 직접 주입한다. GAN이 조건부 생성에서 클래스 정보를 적극적으로 쓰는 것을 보고, 확산 모델도 같은 정보를 다른 방식으로 쓸 수 있다는 것이 출발점이다.',

ideas:[
 {h:'U-Net 아키텍처 전면 재탐색',
  lead:'헤드 수·attention 해상도·업다운샘플 블록을 하나씩 바꿔가며 FID로 검증한다.',
  d:'`[DDPM](#/p/ddpm)`의 U-Net은 16×16 해상도에만 단일 head attention을 뒀다. 이 논문은 attention을 32/16/8 세 해상도로 넓히고, head 수를 늘리거나(또는 head당 채널을 64로 고정) `[BigGAN](#/p/biggan)`의 residual 업/다운샘플링 블록을 가져오는 식으로 하나씩 바꿔 wall-clock 대비 FID를 측정했다. 깊이를 늘리는 것도 FID를 개선하지만 학습 시간이 늘어 채택하지 않았다.'},
 {h:'AdaGN: 시간·클래스 정보를 정규화에 주입',
  lead:'GroupNorm 출력을 시간·클래스 임베딩에서 만든 스케일·바이어스로 변조한다.',
  d:'`AdaGN(h,y) = y_s · GroupNorm(h) + y_b` 형태로, 타임스텝과 클래스 임베딩의 선형 투영에서 얻은 $(y_s, y_b)$ 로 각 residual 블록의 정규화 출력을 변조한다. `[DDPM](#/p/ddpm)`처럼 단순히 더하기만 하는 것보다 FID가 확실히 더 좋았다(13.06 대 15.08, ablation 기준).'},
 {h:'Classifier guidance: 분류기 gradient로 샘플링을 조종한다',
  lead:'노이즈 낀 이미지에 학습시킨 분류기의 $\\nabla_{x_t}\\log p_\\phi(y|x_t)$ 로 평균을 밀어낸다.',
  d:'노이즈가 낀 $x_t$ 에 대해 분류기 $p_\\phi(y|x_t,t)$ 를 따로 학습시킨 뒤, 매 역확산 스텝에서 그 gradient만큼 평균을 이동시켜 표본을 원하는 클래스 쪽으로 유도한다. 이 조건화가 클래스 레이블을 모델 가중치가 아니라 **샘플링 시점의 외부 신호**로 다루는 첫 실용적 방법이었고, 곧 분류기 없이 같은 효과를 내는 `[CFG](#/p/cfg)`로 대체된다.'},
 {h:'gradient scale: 세게 밀수록 사실적이지만 다양성이 준다',
  lead:'gradient에 scale $s>1$ 을 곱하면 분포가 $p(y|x)^s$ 로 뾰족해져 품질-다양성이 trade-off된다.',
  d:'scale 1.0으로는 분류기 확신도가 50%대에 머물러 시각적으로 클래스가 불분명했지만, scale 10.0에서는 거의 100%로 올라가고 이미지도 훨씬 클래스에 맞아졌다(FID 33.0 → 12.0, corgi 예시). 이는 precision은 올리고 recall(다양성)은 낮추는 명시적 다이얼로 작동한다.'},
 {h:'DDIM에도 적용되는 score 기반 유도',
  lead:'노이즈 예측 $\\epsilon_\\theta$ 를 분류기 gradient로 보정해 결정론적 DDIM 샘플링에도 guidance를 쓴다.',
  d:'`[DDIM](#/p/ddim)`은 확률적 과정이 아니라서 평균에 노이즈를 더하는 원래 유도가 적용되지 않는다. 대신 확산과 score matching의 연결을 이용해 $\\hat\\epsilon(x_t) = \\epsilon_\\theta(x_t) - \\sqrt{1-\\bar\\alpha_t}\\,\\nabla_{x_t}\\log p_\\phi(y|x_t)$ 로 노이즈 예측 자체를 수정하면, 스텝 수를 25까지 줄여도 `[BigGAN](#/p/biggan)`에 필적하는 품질을 유지했다.'}
],

diagram:{type:'loop', cap:'classifier guidance의 역확산 한 스텝. 매 t에서 분류기 gradient가 평균을 클래스 방향으로 민다.',
 center:'매 스텝 t = T…1',
 nodes:[
  {t:'노이즈 x_t', s:'현재 샘플'},
  {t:'U-Net 예측', s:'μ, Σ 추정'},
  {t:'분류기 gradient', s:'∇ log p(y|x_t)', acc:true, note:'클래스 방향 신호'},
  {t:'평균 이동', s:'μ + sΣ·gradient'},
  {t:'x_t-1 샘플링', s:'N(이동된 μ, Σ)'}
 ]},

math:[
 {expr:'p_θ,φ(x_t | x_t+1, y) = Z · p_θ(x_t|x_t+1) · p_φ(y|x_t)',
  tex:'p_{\\theta,\\phi}(x_t \\mid x_{t+1}, y) = Z\\, p_\\theta(x_t \\mid x_{t+1})\\, p_\\phi(y \\mid x_t)',
  d:'조건부 역확산 과정의 정의. $Z$ 는 정규화 상수. 이를 Gaussian 근사로 풀면 분류기 gradient만큼 평균이 이동하는 형태가 된다(Algorithm 1).'},
 {expr:'x_t-1 ~ N(μ + s·Σ·∇_xt log p_φ(y|x_t), Σ)',
  tex:'x_{t-1} \\sim \\mathcal{N}\\!\\left(\\mu + s\\,\\Sigma\\,\\nabla_{x_t}\\log p_\\phi(y\\mid x_t),\\ \\Sigma\\right)',
  d:'실제 샘플링에 쓰이는 최종 식. $s$ 는 gradient scale — 1보다 크게 주면 분포가 $p(y|x)^s$ 로 뾰족해져 클래스 일관성이 강해진다.'},
 {expr:'ε̂(x_t) = ε_θ(x_t) − √(1 − ᾱ_t) · ∇_xt log p_φ(y|x_t)',
  tex:'\\hat\\epsilon(x_t) = \\epsilon_\\theta(x_t) - \\sqrt{1-\\bar\\alpha_t}\\,\\nabla_{x_t}\\log p_\\phi(y\\mid x_t)',
  d:'`[DDIM](#/p/ddim)`처럼 결정론적인 샘플러에 guidance를 적용하려고 score 함수 관계를 이용해 노이즈 예측 자체를 수정한 식.'}
],

numbers:[
 {k:'ImageNet 128×128 FID', v:'2.97', d:'ADM-G, `[BigGAN](#/p/biggan)`-deep(6.02)을 큰 폭으로 경신'},
 {k:'ImageNet 256×256 FID', v:'4.59 → 3.94', d:'guidance만 4.59, 업샘플링 스택까지 결합하면 3.94(BigGAN-deep 6.95)'},
 {k:'ImageNet 512×512 FID', v:'3.85', d:'ADM-G + ADM-U 결합, BigGAN-deep(8.43) 대비 절반 이하'},
 {k:'attention 헤드 ablation', v:'헤드당 채널 64', d:'헤드 수를 늘리거나 헤드당 채널을 줄일수록 FID 개선, 64채널을 기본값으로 채택'},
 {k:'AdaGN ablation', v:'13.06 vs 15.08', d:'AdaGN이 단순 덧셈+GroupNorm보다 FID 우수(700K iter 기준)'},
 {k:'DDIM 가속 샘플링', v:'25 스텝', d:'guidance 적용 시 25 스텝만으로도 `[BigGAN](#/p/biggan)`급 FID 유지(ImageNet 128, FID 5.98)'}
],

impact:'이 논문 전까지 확산 모델은 "안정적이지만 GAN보다 못한" 취급을 받았는데, 아키텍처 개선만으로도 이미 LSUN·ImageNet 64×64에서 SOTA를 찍었고 classifier guidance까지 더하자 고해상도에서도 GAN을 넘어섰다. 이후 텍스트-이미지 생성(`[GLIDE](#/p/imagen)` 계열, `[Imagen](#/p/imagen)`)이 조건부 확산 + guidance 조합을 표준으로 채택하는 직접적 계기가 되었고, 여기서 쓰인 별도 분류기 학습의 번거로움이 곧 `[CFG](#/p/cfg)`가 나오는 동기가 된다.',

legacy:[
 '**classifier guidance → `[CFG](#/p/cfg)`** — 별도 분류기를 학습할 필요 없이 조건부/무조건부 모델 하나로 같은 효과를 내는 classifier-free guidance가 곧바로 이 방식을 대체',
 '**개선된 U-Net이 사실상 표준 백본이 됨** — multi-resolution attention, AdaGN, BigGAN 업/다운샘플 블록이 이후 `[LDM](#/p/ldm)`·`[Imagen](#/p/imagen)` 등 대부분의 확산 모델 아키텍처에 그대로 계승',
 '**GAN 대 확산의 무게중심 이동** — 이 논문 이후 이미지 생성 연구의 주류가 GAN에서 확산으로 넘어갔고, `[BigGAN](#/p/biggan)` 계열 후속 연구가 사실상 멈춤',
 '**guidance-diversity trade-off 논쟁** — precision을 높이면 recall이 떨어진다는 관찰이 이후 guidance scale 튜닝을 둘러싼 표준적인 고민거리가 됨'
],

pitfalls:[
 '**classifier guidance는 "공짜"가 아니다.** 노이즈 낀 이미지 전용 분류기를 별도로 학습해야 하고, 추론 시 매 스텝마다 분류기 forward+backward가 추가로 필요해 샘플링 비용이 늘어난다.',
 '**FID가 낮다고 항상 더 좋은 샘플은 아니다.** guidance scale을 올리면 FID·IS는 좋아지지만 recall(다양성)이 떨어진다 — 논문 스스로 이것이 trade-off라고 못박는다.',
 '**ADM은 DDPM 대비 여러 변경을 동시에 적용한 결과다.** 아키텍처 개선과 classifier guidance는 독립적인 기여이므로, 어느 쪽이 FID 개선에 얼마나 기여했는지는 Table 5/6을 따로 봐야 한다.'
],

figures:[
 {f:'fig-classifier-scale.png',
  cap:'같은 무조건부 모델에 "코기" 클래스를 강제한 결과. gradient scale 1.0(왼쪽, FID 33.0)은 클래스가 불분명하지만 10.0(오른쪽, FID 12.0)은 뚜렷한 코기 이미지가 된다 — scale이 품질·클래스 일치도를 얼마나 좌우하는지 보여주는 대목.',
  src:'원문 Figure 3, p.8'},
 {f:'fig-biggan-vs-diffusion.png',
  cap:'같은 클래스(타조·플라밍고)에서 `[BigGAN](#/p/biggan)`-deep(왼쪽, FID 6.95)과 이 논문의 guided 확산 모델(가운데, FID 4.59)을 나란히 비교한 첫 줄. 오른쪽은 실제 학습 데이터. 두 생성 결과의 사실감은 비슷하지만, 이 논문의 핵심 주장은 확산 쪽이 더 넓은 mode를 커버한다는 것이다.',
  src:'원문 Figure 6, p.11'}
],

quotes:[
 {t:'We show that diffusion models can achieve image sample quality superior to the current state-of-the-art generative models. We achieve this on unconditional image synthesis by finding a better architecture through a series of ablations.',
  src:'Abstract, p.1'},
 {t:'While the samples are of similar perceptual quality, the diffusion model contains more modes than the GAN, such as zoomed ostrich heads, single flamingos, different orientations of cheeseburgers, and a tinca fish with no human holding it.',
  src:'Section 5.1, p.10'}
],

links:[
 {t:'arXiv 2105.05233 — Diffusion Models Beat GANs on Image Synthesis', u:'https://arxiv.org/abs/2105.05233'},
 {t:'OpenAI guided-diffusion (공식 코드)', u:'https://github.com/openai/guided-diffusion'}
]
});
