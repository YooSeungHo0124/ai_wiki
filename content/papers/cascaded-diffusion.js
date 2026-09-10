WIKI.paper({
slug:'cascaded-diffusion',
venue:'JMLR 2022 (arXiv 2021)',
authors:'Ho, Saharia, Chan, Fleet, Norouzi, Salimans (Google)',
arxiv:'2106.15282',

tldr:'저해상도 확산 모델 뒤에 초해상도 확산 모델을 여러 단계 이어 붙이는 계단식(cascade) 구조로, 별도의 분류기 안내 없이 순수 생성 모델만으로 BigGAN-deep을 능가하는 ImageNet 이미지를 만들었다. 핵심은 상위 단계 학습 시 조건 이미지에 일부러 노이즈를 섞는 **conditioning augmentation**.',

context:'[SR3](#/p/sr3)는 저해상도 이미지를 조건으로 준 확산 모델이 고품질 초해상도를 만들 수 있음을 보였고, 그 조건 이미지가 실제 사진이 아니라 다른 생성 모델의 출력이어도 된다는 가능성까지 시사했다. 하지만 이를 여러 단계로 이어 붙이면 문제가 생긴다. 저해상도 생성 모델은 완벽하지 않아 특유의 오차와 아티팩트를 만드는데, 초해상도 모델은 **진짜** 저해상도 이미지로만 학습되어 있어 그런 오차를 본 적이 없다. 그 결과 오차가 다음 단계로 전달되며 누적된다 — 시퀀스 모델링에서 익히 알려진 **exposure bias**(train-test mismatch)와 같은 현상이다. 단순히 모델을 이어 붙이는 것만으로는 계단식 구조가 기대만큼 작동하지 않는 이유가 여기에 있었다.',

ideas:[
 {h:'계단식 파이프라인: 해상도를 단계별로 두 배씩 키운다',
  lead:'32×32 생성 → 64×64 초해상도 → 256×256 초해상도로 이어지는 독립 모델 체인.',
  d:'전체를 한 번에 256×256으로 생성하는 대신, 저해상도 [DDPM](#/p/ddpm) 하나와 초해상도 확산 모델 여러 개([SR3](#/p/sr3) 방식)를 순서대로 이어 붙인다. 각 단계는 독립적으로 학습되고, 앞 단계의 출력이 다음 단계의 조건이 된다. 저해상도에서 전체 구도를 정하고 후속 단계는 국소적인 디테일만 채우면 되므로 각 모델의 부담이 줄어든다.'},
 {h:'Conditioning augmentation: 조건 이미지에 일부러 노이즈를 넣는다',
  lead:'초해상도 모델을 학습할 때 저해상도 조건 이미지에 가우시안 노이즈·블러를 가해 추론 시 오차에 대비시킨다.',
  d:'추론 때 상위 단계가 받는 조건 이미지는 이전 단계 생성 모델의 불완전한 출력이다. 학습 때 조건 이미지에 인위적으로 노이즈나 블러를 넣어주면, 모델이 "약간 틀린 저해상도 입력"에도 견고하게 반응하도록 배운다. 이것이 없으면 계단식 구조가 오히려 단일 모델보다 못한 결과를 낸다는 것을 저자들이 직접 보였다(수치는 `numbers` 참고).'},
 {h:'Truncated / non-truncated 두 가지 구현',
  lead:'저해상도 역확산을 스텝 `s`에서 멈추거나(truncated), 끝까지 돌린 뒤 다시 노이즈를 입힌다(non-truncated).',
  d:'truncated 방식은 저해상도 역확산 과정을 타임스텝 `s>0`에서 멈춘 잠재값 `z_s`를 그대로 다음 단계에 넘긴다. non-truncated 방식은 저해상도 샘플링을 끝까지(`s=0`) 마친 뒤, 전방 확산 과정으로 다시 노이즈를 입혀 `z_s`를 만든다. 두 방식 모두 초해상도 모델은 임의의 `s`에 대해 동작하도록 시간 임베딩에 `s`를 추가로 넣어 amortize 학습한다. 두 방식의 성능은 논문에서 비슷하다고 보고된다.'},
 {h:'분류기 안내 없이 BigGAN-deep을 능가',
  lead:'별도의 classifier guidance 없이 순수 생성 모델만으로 FID·분류 정확도 모두 GAN 계열을 앞선다.',
  d:'ADM 계열 확산 모델은 흔히 별도로 학습한 분류기의 그래디언트로 샘플을 유도(classifier guidance)해 품질을 끌어올렸다. 이 논문은 그런 보조 장치 없이, conditioning augmentation만으로 BigGAN-deep과 VQ-VAE-2를 능가하는 결과를 얻었다는 점을 강조한다.'},
 {h:'저해상도 정확도를 높이면 상위 단계 전체가 이득을 본다',
  lead:'저해상도 단계 하나의 개선이 계단식 전체(고해상도 결과)로 전파된다.',
  d:'각 단계가 독립 모델이라 저해상도 base 모델을 별도로 개선(더 많은 샘플링 스텝, 더 나은 손실 등)하면 그 개선이 그대로 다음 단계들에 상속된다. 이는 하나의 거대한 end-to-end 모델을 재학습하는 것보다 단계별로 실험하고 교체하기 쉬운 구조적 이점이다.'}
],

diagram:{type:'flow', cap:'32×32 클래스 조건부 생성부터 256×256까지, 각 화살표가 독립적으로 학습된 확산 모델 하나.',
 nodes:[
  {t:'클래스 라벨', s:'ImageNet 1000종'},
  {t:'저해상도 생성', s:'32×32', acc:true, note:'DDPM'},
  {t:'초해상도 1단계', s:'→ 64×64'},
  {t:'초해상도 2단계', s:'→ 256×256'}
 ]},

math:[
 {expr:'p_θ^s(x0) = ∫ p_θ(x0|z_s) p_θ(z_s:T) dz_s:T',
  tex:'p_\\theta^{s}(x_0)=\\int p_\\theta(x_0\\mid z_s)\\,p_\\theta(z_{s:T})\\,dz_{s:T}',
  d:'truncated conditioning augmentation의 정의. 저해상도 역확산을 `s=0`까지 완주하지 않고 `s>0`에서 멈춘 잠재 `z_s`를 그대로 초해상도 모델의 조건으로 쓴다.'},
 {expr:'z_t = √ᾱ_s · z0 + √(1-ᾱ_s) · z,   z ~ N(0, I)',
  tex:'z_t=\\sqrt{\\bar{\\alpha}_s}\\,z_0+\\sqrt{1-\\bar{\\alpha}_s}\\,z,\\quad z\\sim\\mathcal{N}(0,I)',
  d:'non-truncated 방식에서, 완주한 저해상도 샘플 `z_0`에 다시 전방 확산으로 노이즈를 입혀 `z_s`를 만드는 식. truncated·non-truncated 모두 결과적으로 초해상도 모델은 "약간 오염된" 저해상도 입력을 보고 학습한다.'}
],

numbers:[
 {k:'FID · 64×64 / 128×128 / 256×256', v:'1.48 / 3.52 / 4.88', d:'전부 BigGAN-deep보다 낮음(우수)'},
 {k:'분류 정확도(CAS) · 256×256', v:'top-1 63.02% · top-5 84.06%', d:'VQ-VAE-2(54.83%/77.59%)를 큰 격차로 능가'},
 {k:'conditioning augmentation 유무 · FID', v:'6.02 → 2.13', d:'16×16→64×64 케이스, 증강 세기 s=0→1001, 무증강 시 단일 모델(2.35)보다도 나쁨'},
 {k:'단일 모델(비계단식) 대비', v:'FID 2.35', d:'같은 64×64 해상도, 증강 없는 계단식은 이보다 못하고 충분한 증강 시 이를 능가'}
],

impact:'이 논문은 확산 모델을 고해상도로 스케일링하는 표준 레시피를 확립했다. "한 모델이 한 번에 다 그리게 하지 말고, 저해상도 생성과 초해상도를 분업시키되 그 이음매의 오차 누적을 conditioning augmentation으로 메운다"는 처방이 이후 거의 모든 대형 텍스트-이미지 확산 모델의 구조가 된다. 특히 분류기 guidance 없이도 GAN을 능가할 수 있음을 보여, 확산 모델이 보조 장치 의존적인 방법이 아니라 그 자체로 경쟁력 있는 생성기임을 입증했다.',

legacy:[
 '**[Imagen](#/p/imagen)이 이 구조를 그대로 채택** — 64×64 텍스트-조건 생성 뒤에 두 단계 초해상도(→256×256→1024×1024)를 이어 붙이고, conditioning augmentation도 그대로 사용',
 '**[SDXL](#/p/sdxl)의 refiner 단계** 등 이후 "베이스 모델 + 정제 모델" 2단계 구조에 계단식 사고방식이 남음',
 '**noise conditioning augmentation 표준화** — 상위 단계에 노이즈 낀 조건을 주는 방식이 [ControlNet](#/p/controlnet) 이전 세대 조건부 확산 모델의 공통 관례로 자리잡음',
 '**video diffusion으로 확장** — 시간 축에도 같은 계단식(저프레임률→고프레임률, 저해상도→고해상도) 아이디어가 [Video Diffusion Models](#/p/video-diffusion) 계열에 이어짐'
],

pitfalls:[
 '**"계단식으로 쌓기만 하면 품질이 좋아진다"는 이 논문의 결론이 아니다.** 오히려 증강 없는 계단식은 단일 모델보다 나쁠 수 있다는 것이 핵심 실험 결과다 — conditioning augmentation이 없으면 계단식은 손해다.',
 '**truncated와 non-truncated 방식을 혼동하기 쉽다.** 전자는 저해상도 역확산을 중간에서 멈추는 것이고, 후자는 끝까지 완주한 뒤 다시 노이즈를 입히는 것이다. 구현 난이도(저장해야 할 중간 상태)에서 차이가 나지만 성능은 논문에서 비슷하다고 보고된다.',
 '**FID 수치만 보고 GAN보다 절대적으로 우월하다고 일반화하면 안 된다.** 이 논문의 비교는 classifier guidance를 쓰지 않은 조건에서의 결과이며, 샘플링 스텝 수가 GAN 대비 훨씬 많다는 추론 비용 차이는 표에 드러나지 않는다.'
],

figures:[
 {f:'fig1-pipeline.png',
  cap:'"Irish Setter" 클래스 라벨 하나에서 출발해 Model 1(32×32 생성)→Model 2(64×64 초해상도)→Model 3(256×256 초해상도)로 이어지는 세 모델 체인. 아래로 뻗은 화살표가 각 단계의 저해상도 출력이 다음 모델의 조건으로 재사용됨을 보여준다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-cheeseburger.png',
  cap:'Figure 1과 같은 구조를 클래스 조건 블록까지 구체적으로 표시한 그림. 첫 상자만 "Class Conditional"(순수 생성), 나머지 두 상자는 "Class Conditional Super-Res"(SR3 방식)로 역할이 다르다는 점에 주목.',
  src:'원문 Figure 4, p.6'}
],

quotes:[
 {t:'We find that the sample quality of a cascading pipeline relies crucially on conditioning augmentation, our proposed method of data augmentation of the lower resolution conditioning inputs to the super-resolution models.',
  src:'Abstract, p.1'},
 {t:'We empirically find that conditioning augmentation is effective because it alleviates compounding error in cascading pipelines due to train-test mismatch, sometimes referred to as exposure bias in the sequence modeling literature.',
  src:'Introduction, p.2'}
],

links:[
 {t:'arXiv 2106.15282 — Cascaded Diffusion Models for High Fidelity Image Generation', u:'https://arxiv.org/abs/2106.15282'},
 {t:'프로젝트 페이지 (샘플 갤러리)', u:'https://cascaded-diffusion.github.io/'}
]
});
