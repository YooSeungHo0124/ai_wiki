WIKI.paper({
slug:'sr3',
venue:'arXiv 2021 (TPAMI 2022)',
authors:'Saharia, Ho, Chan, Salimans, Fleet, Norouzi (Google Research, Brain Team)',
arxiv:'2104.07636',

tldr:'[DDPM](#/p/ddpm)의 노이즈 제거 과정을 초해상도(super-resolution)에 그대로 적용한 논문. 저해상도 이미지를 조건으로 주고 순수 가우시안 노이즈에서 출발해 반복적으로 정제하면, 사람이 진짜 사진과 절반 가까이 헷갈리는 결과가 나온다는 것을 보였다.',

context:'2021년의 초해상도는 여전히 회귀(regression) 기반 CNN 아니면 GAN 둘 중 하나였다. 회귀 모델은 MSE 손실로 학습하기 때문에 여러 정답이 가능한 지점에서 그 평균을 예측하게 되어 결과가 흐릿하다. GAN은 선명하지만 판별기와의 min-max 학습이 불안정하고, mode collapse를 막으려면 별도의 consistency 손실이 필요했다. 한편 [DDPM](#/p/ddpm)은 비조건부 이미지 생성에서 GAN급 품질을 보였지만, 저해상도 이미지 같은 강한 조건을 주는 초해상도 문제에 그대로 옮겨 쓸 수 있는지는 아직 검증되지 않았다.',

ideas:[
 {h:'조건부 확산: U-Net 입력에 저해상도 이미지를 이어붙인다',
  lead:'저해상도 이미지를 bicubic으로 업샘플한 뒤 노이즈 이미지와 채널 방향으로 concat한다.',
  d:'DDPM의 U-Net 구조를 거의 그대로 쓰되, 조건 이미지 `x`를 목표 해상도로 bicubic 보간한 뒤 노이즈 낀 타깃 `y_t`와 채널 축으로 이어붙여 입력한다. FiLM 같은 더 정교한 조건화 방식도 시도했지만 단순 concat과 품질이 비슷했다. 구조를 복잡하게 만들지 않고도 비조건부 확산 모델을 조건부로 바꾸는 최소한의 방법을 보여준 셈이다.'},
 {h:'노이즈 제거 목표는 그대로, 조건만 추가',
  lead:'$\\sqrt{\\gamma}y_0+\\sqrt{1-\\gamma}\\epsilon$ 에서 조건 `x`를 보고 $\\epsilon$ 을 맞히는 회귀 문제로 학습한다.',
  d:'학습 손실은 [DDPM](#/p/ddpm)과 동일하게 노이즈 $\\epsilon$ 을 예측하는 것이지만, 예측 네트워크 `f_θ`가 노이즈 낀 타깃 `y_t` 뿐 아니라 소스 이미지 `x`도 함께 입력받는다. 노이즈 분산을 나타내는 스칼라 `γ`도 시간 스텝 `t` 대신 직접 조건으로 줘서, 학습된 노이즈 스케줄과 추론 스텝 수를 나중에 자유롭게 바꿀 수 있게 했다.'},
 {h:'평가 지표를 사람으로 바꾼다: fool rate',
  lead:'2AFC 실험에서 피험자가 SR3 출력을 진짜 사진으로 착각한 비율을 직접 측정한다.',
  d:'PSNR·SSIM 같은 픽셀 단위 지표는 여러 정답이 가능한 초해상도에서 오히려 흐릿한 회귀 출력을 선호하는 왜곡이 있다. 저자들은 이를 인정하고, 사람에게 참조 이미지와 모델 출력을 나란히 보여준 뒤 어느 쪽이 진짜인지 고르게 하는 2AFC(2-alternative forced choice) 실험으로 대체했다. 완벽히 구분 못 하면 fool rate 50%가 된다.'},
 {h:'CelebA-HQ 8× 얼굴 초해상도에서 GAN을 앞선다',
  lead:'16×16→128×128 과제에서 fool rate 47.4%로, 최고 GAN 대비 34%를 크게 웃돈다.',
  d:'FSRGAN·PULSE 같은 당시 SOTA GAN 기반 초해상도 방법은 fool rate가 최대 34%에 그쳤다. 같은 조건에서 SR3는 47.4%로 50%(완전한 착각)에 근접했다. 확산 모델이 지금까지 GAN의 전유물이던 "사람 눈을 속이는 선명함"의 영역에서 처음으로 우위를 보인 사례다.'},
 {h:'생성 모델과 이어 붙여 계단식(cascade)으로 쓴다',
  lead:'저해상도 생성 모델 뒤에 SR3를 이어 붙이면 그 자체로 고해상도 생성기가 된다.',
  d:'SR3는 조건 이미지가 진짜 저해상도 사진일 필요가 없다. 저해상도 확산 모델이 **생성한** 이미지를 조건으로 줘도 그대로 작동한다. 64×64 생성 모델 뒤에 SR3를 붙여 ImageNet에서 FID 11.3을 얻었는데, 이 아이디어가 그대로 [cascaded-diffusion](#/p/cascaded-diffusion)의 뼈대가 된다.'}
],

diagram:{type:'flow', cap:'추론 시 매 스텝의 조건화 방식. 저해상도 x를 목표 해상도로 올려 노이즈 이미지와 합친 뒤 U-Net에 넣는다.',
 nodes:[
  {t:'저해상도 x', s:'16×16'},
  {t:'Bicubic 업샘플', s:'→ 128×128'},
  {t:'채널 concat', s:'x ⊕ y_t', acc:true, note:'조건화 전부'},
  {t:'U-Net 노이즈 예측', s:'ε̂ 출력'},
  {t:'한 스텝 정제', s:'y_t → y_t-1'}
 ]},

math:[
 {expr:'ỹ = √γ · y0 + √(1-γ) · ε,   ε ~ N(0, I)',
  tex:'\\tilde{y}=\\sqrt{\\gamma}\\,y_0+\\sqrt{1-\\gamma}\\,\\epsilon,\\quad \\epsilon\\sim\\mathcal{N}(0,I)',
  d:'DDPM과 동일한 전방 노이즈 주입 공식. `γ`는 누적 노이즈 비율이고, 시간 스텝 `t` 대신 이 스칼라를 직접 모델에 조건으로 준다.'},
 {expr:'E(x,y) E_{ε,γ} || f_θ(x, √γ y0 + √(1-γ) ε, γ) − ε ||^p',
  tex:'\\mathbb{E}_{(x,y)}\\mathbb{E}_{\\epsilon,\\gamma}\\left\\|f_\\theta\\!\\left(x,\\sqrt{\\gamma}y_0+\\sqrt{1-\\gamma}\\epsilon,\\ \\gamma\\right)-\\epsilon\\right\\|^{p}',
  d:'학습 목표. 소스 이미지 `x`를 추가 조건으로 받는다는 점만 빼면 [DDPM](#/p/ddpm)의 노이즈 예측 손실과 완전히 같다. `p∈{1,2}`.'},
 {expr:'ŷ0 = (1/√γt) · ( yt − √(1-γt) · f_θ(x, yt, γt) )',
  tex:'\\hat{y}_0=\\frac{1}{\\sqrt{\\gamma_t}}\\Big(y_t-\\sqrt{1-\\gamma_t}\\,f_\\theta(x,y_t,\\gamma_t)\\Big)',
  d:'추론 시 예측된 노이즈로부터 깨끗한 이미지 추정치를 역산하는 식. 이 추정치를 사후분포에 대입해 다음 스텝의 평균을 얻는다.'}
],

numbers:[
 {k:'Fool rate · 8× 얼굴(CelebA-HQ)', v:'47.4%', d:'50%가 완전한 착각. GAN 최고 기록은 34% 이하'},
 {k:'FID · ImageNet 계단식 생성', v:'11.3', d:'64×64 생성 모델 + SR3로 256×256까지 업샘플'},
 {k:'확산 스텝 수 T', v:'2000', d:'학습 시 노이즈 스케줄 `γ`를 균등 구간에서 샘플링'},
 {k:'파라미터 수', v:'625M', d:'64×64→256×256, 512×512 과제 기준 U-Net'},
 {k:'학습 스텝', v:'1M steps · batch 256', d:'SR3·회귀 baseline 공통 학습 조건'},
 {k:'4× 자연 이미지 fool rate(입력 표시)', v:'39.0%', d:'ImageNet 64×64→256×256, 회귀 baseline은 이보다 낮음'}
],

impact:'SR3는 [DDPM](#/p/ddpm)이 비조건부 생성기를 넘어 임의의 이미지-투-이미지 문제에 적용될 수 있음을 보인 초기 사례다. 조건화 방법이 놀랍도록 단순했다는 점(concat 한 줄)이 이후 확산 모델 연구에 "굳이 아키텍처를 새로 설계하지 말고 입력에 조건을 이어붙여라"는 기본 패턴을 남겼다. 또한 회귀 지표(PSNR/SSIM) 대신 fool rate라는 사람 평가를 표준으로 제시해, "확산 모델의 결과가 흐릿한 평균이 아니라 실제로 그럴듯한 하나의 표본"이라는 것을 정량적으로 입증했다. 이 논문의 계단식 아이디어는 곧이어 [cascaded-diffusion](#/p/cascaded-diffusion)에서 정식으로 체계화된다.',

legacy:[
 '**계단식 생성의 첫 실증** — 저해상도 생성 + SR3 초해상도라는 조합이 [cascaded-diffusion](#/p/cascaded-diffusion)의 conditioning augmentation 연구로 이어짐',
 '**텍스트-이미지 파이프라인의 표준 부품** — [Imagen](#/p/imagen)의 64×64→256×256→1024×1024 초해상도 스택이 SR3 아키텍처를 거의 그대로 재사용',
 '**사람 평가 지표의 정착** — fool rate/2AFC 방식이 이후 생성 이미지 논문들의 인간 평가 프로토콜로 굳어짐',
 '**조건부 확산의 일반화** — 이미지 조건뿐 아니라 텍스트([GLIDE](#/p/glide)) · 저해상도 잠재 벡터 등 다양한 조건으로 확장되는 출발점'
],

pitfalls:[
 '**PSNR/SSIM으로 SR3를 회귀 모델과 비교하면 SR3가 진다.** 저자들도 이를 인정한다 — 확산 모델은 다봉분포에서 하나의 그럴듯한 표본을 뽑는 것이지, 평균(posterior mean)을 맞히는 게 아니기 때문에 픽셀 단위 지표에서는 불리하다.',
 '**8× 이상의 큰 배율에서는 "정답에 충실함(fidelity)"을 기대하면 안 된다.** 확대율이 클수록 가능한 원본이 여러 개이므로, SR3가 그린 세부 구조(예: 주근깨 위치)가 실제 원본과 다를 수 있다.',
 '**추론 스텝 수는 학습 시 T=2000과 다르게 설정할 수 있다.** `γ`를 직접 조건으로 주는 설계 덕분이지만, 이 유연성을 놓치고 항상 T와 같은 스텝 수로 샘플링해야 한다고 오해하기 쉽다.'
],

figures:[
 {f:'fig1-output.png',
  cap:'왼쪽 열이 저해상도 입력, 가운데가 SR3 출력, 오른쪽이 실제 원본. 위 얼굴 사례는 16×16→128×128(8×), 아래 꽃 사례는 64×64→256×256(4×). 입력의 픽셀 블록이 사라지고 SR3 출력이 원본과 거의 구분되지 않는 질감을 만들어낸 것에 주목.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-unet.png',
  cap:'조건화 방법의 전부. 왼쪽 녹색+연보라 막대가 입력(저해상도를 업샘플한 x와 노이즈 낀 y_t를 채널 방향으로 이어붙인 것)이고, 오른쪽 끝이 U-Net이 예측한 y_t-1. 가운데 화살표로 이어진 분홍 상자들은 표준 U-Net 다운/업샘플링 블록과 skip connection이며, 조건 이미지는 딱 한 번, 입력 단계에서만 개입한다.',
  src:'원문 Figure A.1, p.13'}
],

quotes:[
 {t:'SR3 achieves a fool rate close to 50%, suggesting photo-realistic outputs, while GANs do not exceed a fool rate of 34%.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2104.07636 — Image Super-Resolution via Iterative Refinement', u:'https://arxiv.org/abs/2104.07636'},
 {t:'프로젝트 페이지 (샘플 갤러리)', u:'https://iterative-refinement.github.io/'}
]
});
