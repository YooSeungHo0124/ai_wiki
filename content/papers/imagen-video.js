WIKI.paper({
slug:'imagen-video',
venue:'arXiv 2022 (Google Research, Brain Team)',
authors:'Ho, Chan, Saharia, Whang et al. (Google Research)',
arxiv:'2210.02303',

tldr:'[Imagen](#/p/imagen)의 text-to-image 레시피(frozen 대형 언어모델 + cascaded diffusion)를 영상으로 확장한 논문. 7개의 diffusion 모델을 base → 시간/공간 초해상도 순서로 이어붙여 1280×768·24fps·5.3초 영상을 만들고, v-예측과 점진적 증류(progressive distillation)로 샘플링을 18배 빠르게 했다.',

context:'2022년 [Imagen](#/p/imagen)과 [DALL-E 2](#/p/dalle2)는 frozen 언어모델 임베딩 + cascaded diffusion으로 정지 이미지 생성 품질을 크게 끌어올렸다. 영상 생성은 사정이 다르다. [Video Diffusion Models](#/p/video-diffusion)가 저해상도에서 가능성을 보였지만, 프레임 수·해상도·프레임레이트가 한꺼번에 늘어나면 연산량이 폭발한다. 프레임을 하나씩 자기회귀로 생성하면 오류가 누적되고 장기 시간 일관성이 깨진다. 질문은 **정지 이미지에서 통했던 cascaded diffusion 레시피가 시공간 두 축으로 동시에 확장돼도 여전히 통하는가**였다.',

ideas:[
 {h:'7개 모델의 캐스케이드로 시공간을 나눠 키운다',
  lead:'base 1개 + 공간초해상도(SSR) 3개 + 시간초해상도(TSR) 3개를 순서대로 통과시킨다.',
  d:'T5-XXL(4.6B, frozen) 텍스트 임베딩을 받아 base 모델이 16프레임·40×24·3fps의 저해상도 영상을 만들고, 이후 SSR·TSR 모델이 번갈아 공간 해상도와 프레임 수를 늘려 최종 128프레임·1280×768·24fps에 도달한다. 각 단계가 독립적으로 학습 가능해 7개 모델을 병렬로 학습시킬 수 있고, SSR/TSR은 범용 영상 초해상도 모델이라 다른 생성 모델의 출력에도 그대로 적용 가능하다.'},
 {h:'공간-시간 분리 블록: attention과 convolution을 나눠 쓴다',
  lead:'공간 연산은 프레임마다 독립적으로, 시간 연산만 프레임 사이를 섞는다.',
  d:'Video [U-Net](#/p/unet) 블록은 각 프레임에 spatial conv·spatial attention을 **파라미터 공유로 독립 적용**한 뒤, 마지막에 temporal attention/convolution으로 프레임 간 정보를 섞는다. base 모델은 시간축 장기 의존성을 잡기 위해 temporal attention을 쓰지만, 해상도가 높아지는 SSR·TSR 단계는 메모리 때문에 temporal convolution으로 대체하고, 최고 해상도 모델은 spatial attention마저 뺀다.'},
 {h:'v-예측: 고해상도·긴 증류 체인에서의 안정성',
  lead:'노이즈 ε나 원본 x 대신 $v$ 를 예측해 고해상도·영상에서 색상 흔들림을 없앤다.',
  d:'ε-예측은 고해상도 이미지에서 색 번짐(color shifting) 아티팩트가 알려져 있는데, 영상에서는 이것이 **시간축 색상 흔들림**으로 나타난다. v-parameterization($v_t = \\alpha_t \\epsilon - \\sigma_t x$ 형태)으로 바꾸면 수치적으로 안정될 뿐 아니라 이 색상 문제가 사라지고, 뒤따르는 점진적 증류 학습도 더 잘 수렴한다.'},
 {h:'전 구간 텍스트 재주입',
  lead:'초해상도 단계에서도 base 모델처럼 텍스트 임베딩을 계속 다시 넣어준다.',
  d:'텍스트 조건을 base 모델에만 주면 후속 SSR·TSR 단계가 원 프롬프트의 의미를 놓치기 쉽다. [Imagen](#/p/imagen)에서 발견된 것과 동일하게, 모든 초해상도 모델에도 텍스트 임베딩을 함께 조건으로 넣는 것이 정렬(alignment)에 중요하다는 것을 영상에서도 재확인했다.'},
 {h:'점진적 증류로 618초를 35초로',
  lead:'[DDIM](#/p/ddim) 샘플러를 단계마다 절반씩 줄이는 2단계 증류로 추론을 18배 가속한다.',
  d:'먼저 조건부·비조건부 모델을 classifier-free guidance 가중치로 합친 단일 모델을 학습하고, 그 다음 각 단계의 [DDIM](#/p/ddim) 샘플링 스텝 수를 $N \\to N/2$ 로 반복해서 줄인다. 원래 base 256스텝·SR 128스텝이던 것을 증류 후 스테이지당 8스텝으로 줄여, 배치 하나를 샘플링하는 시간이 618초에서 35초로 준다.'}
],

diagram:{type:'flow', cap:'7개 diffusion 모델의 캐스케이드. 화살표를 따라 프레임 수·해상도·fps가 함께 늘어난다.',
 nodes:[
  {t:'T5-XXL 임베딩', s:'4.6B, frozen'},
  {t:'Base', s:'16f·40×24·3fps', acc:true},
  {t:'TSR', s:'32f·40×24·6fps'},
  {t:'SSR', s:'32f·80×48·6fps'},
  {t:'SSR', s:'32f·320×192·6fps'},
  {t:'TSR', s:'64f·320×192·12fps'},
  {t:'TSR', s:'128f·320×192·24fps'},
  {t:'SSR', s:'128f·1280×768·24fps'}
 ]},

math:[
 {expr:'v_t = alpha_t * epsilon - sigma_t * x  (v-parameterization)',
  tex:'v_t \\equiv \\alpha_t\\,\\epsilon - \\sigma_t\\,x',
  d:'노이즈 $\\epsilon$과 원본 $x$의 선형 결합인 $v$를 직접 예측하도록 학습한다. ε-예측 대비 고해상도·긴 증류 체인에서 수치적으로 안정적이고, 영상에서는 프레임 간 색상 흔들림을 없앤다.'},
 {expr:'z_s = mu_tilde(z_t, x_hat) + sqrt((sigma_tilde^2)^(1-gamma) (sigma^2)^gamma) * epsilon',
  tex:'\\mathbf{z}_s = \\tilde{\\boldsymbol{\\mu}}_{s|t}(\\mathbf{z}_t,\\hat{\\mathbf{x}}_\\theta(\\mathbf{z}_t)) + \\sqrt{(\\tilde{\\sigma}_{s|t}^2)^{1-\\gamma}(\\sigma_{t|s}^2)^{\\gamma}}\\,\\boldsymbol{\\epsilon}',
  d:'조상 샘플러(ancestral sampler)의 갱신식. $\\gamma$가 샘플링의 확률성(stochasticity)을 조절하는 하이퍼파라미터이고, 증류 후에는 이와 유사한 형태의 결정론적 DDIM 스텝을 2배 크기로 적용한다.'}
],

numbers:[
 {k:'최종 출력', v:'1280×768 · 24fps · 128프레임(≈5.3초)', d:'text-to-video로는 당시 최고 해상도급'},
 {k:'전체 diffusion 파라미터', v:'11.6B', d:'base 5.6B + SSR 3개(1.2B+1.4B+340M) + TSR 3개(1.7B+780M+630M)'},
 {k:'텍스트 인코더', v:'T5-XXL 4.6B (frozen)', d:'diffusion 모델 파라미터와 별도, 학습되지 않음'},
 {k:'서브모델 수', v:'7개', d:'base 1 + SSR 3 + TSR 3, 텍스트 인코더 포함 총 8개 컴포넌트'},
 {k:'증류 전/후 샘플링 시간', v:'618초 → 35초', d:'배치 1개 기준, 약 18배 가속'},
 {k:'증류 전/후 스텝 수', v:'base 256 · SR 128 → 스테이지당 8', d:'2단계 progressive distillation 적용 결과'}
],

impact:'정지 이미지용 cascaded diffusion + frozen 언어모델 레시피가 **시공간 두 축을 함께 늘려도 그대로 작동**함을 보였다. 특히 v-예측과 점진적 증류를 결합해 영상 diffusion의 고질적 문제인 느린 샘플링 속도를 실용적인 수준(18배 가속)으로 낮췄다. 이후 텍스트-투-비디오 연구 대부분이 "저해상도 base + 초해상도 캐스케이드" 또는 유사한 시공간 분리 구조를 기본 골격으로 채택했다.',

legacy:[
 '**캐스케이드에서 latent diffusion으로** — [Video LDM](#/p/videoldm)처럼 픽셀 공간 캐스케이드 대신 latent space에서 영상을 다루는 방향으로 후속 연구가 이동',
 '**증류의 표준화** — v-예측 + progressive distillation 조합이 이후 영상·이미지 diffusion 가속 연구의 기본 참조점이 됨',
 '**시공간 분리 블록의 재사용** — spatial attention/conv + temporal attention/conv 분리 구조가 이후 대부분의 영상 diffusion U-Net에서 반복됨',
 '**text-to-video 경쟁 촉발** — 같은 해 [Make-A-Video](#/p/make-a-video) 등과 함께 영상 생성 분야를 diffusion 중심으로 재편'
],

pitfalls:[
 '**"7개 모델"이 순차적으로 하나씩 학습되는 게 아니다.** 캐스케이드의 장점은 각 단계가 **독립적으로 병렬 학습** 가능하다는 것이며, 추론 시에만 순서대로 이어 붙인다.',
 '**SSR과 TSR의 역할을 혼동하기 쉽다.** SSR은 각 프레임의 공간 해상도(폭×높이)를 올리고, TSR은 프레임 사이를 채워 시간 해상도(fps·프레임 수)를 올린다. Figure 6에서 두 종류가 번갈아 나오는 순서를 확인해야 한다.',
 '**11.6B는 diffusion 모델들만의 합이고 T5-XXL(4.6B) frozen 인코더는 별도다.** 총 파라미터 수를 인용할 때 이 둘을 구분해야 한다.'
],

figures:[
 {f:'fig6-cascade-pipeline.png',
  cap:'왼쪽 위 텍스트 프롬프트가 T5-XXL로 임베딩된 뒤 Base 모델(16프레임·40×24·3fps)로 들어간다. 이후 TSR·SSR이 번갈아(빨강=시간 초해상도, 초록=공간 초해상도) 프레임 수와 해상도를 늘려 최종 128프레임·1280×768·24fps에 도달한다. 각 상자 아래 숫자가 프레임수×가로×세로와 fps.',
  src:'원문 Figure 6, p.8'}
],

quotes:[
 {t:'We present Imagen Video, a text-conditional video generation system based on a cascade of video diffusion models.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2210.02303 — Imagen Video', u:'https://arxiv.org/abs/2210.02303'},
 {t:'프로젝트 페이지 — imagen.research.google/video', u:'https://imagen.research.google/video/'}
]
});
