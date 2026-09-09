WIKI.paper({
slug:'imagen',
venue:'NeurIPS 2022',
authors:'Saharia, Chan et al. (Google Research, Brain Team)',
arxiv:'2205.11487',

tldr:'text-to-image 확산 모델에서 **텍스트 인코더를 키우는 쪽이 이미지 확산 모델(U-Net)을 키우는 쪽보다 훨씬 효과적**이라는 것을 보인 논문. 이미지-텍스트 쌍으로 학습한 CLIP류 인코더 대신, 텍스트만으로 학습한 **얼린 T5-XXL**을 그대로 가져다 썼다.',

context:'2022년의 text-to-image 모델([DALL·E 2](#/p/dalle2)류, GLIDE)은 대부분 CLIP처럼 **이미지-텍스트 쌍**으로 학습된 인코더를 조건으로 썼다. [LDM/Stable Diffusion](#/p/ldm)도 별도 텍스트 인코더로 조건을 주는 구조는 같다. 이 논문은 다른 선택을 한다 — 이미지를 전혀 보지 않고 **텍스트 전용 코퍼스로 학습한 대형 언어모델**(T5)이 오히려 더 나은 조건 신호를 준다는 것이다. 또 [CFG](#/p/cfg)의 guidance weight를 키우면 이미지-텍스트 정합성은 좋아지지만 색이 과포화되고 뭉개지는 부작용이 있었는데, 그 원인이 학습-추론 간 픽셀 범위 불일치라는 것을 밝힌다.',

ideas:[
 {h:'얼린 T5-XXL: 이미지를 안 본 언어모델이 더 잘 그리게 한다',
  lead:'이미지-텍스트 대조학습 인코더 대신 텍스트 전용 LM을 얼려서 조건으로 쓴다.',
  d:'BERT·T5·CLIP 세 종류의 텍스트 인코더를 비교한 결과, MS-COCO 같은 단순 벤치마크에서는 T5-XXL과 CLIP 성능이 비슷했지만 복합적인 프롬프트를 모은 DrawBench에서는 사람 평가자가 **T5-XXL을 CLIP보다 일관되게 선호**했다. 인코더는 학습 중 얼린 채로 두어 임베딩을 미리 계산해 두면 되므로 학습 비용도 거의 늘지 않는다.'},
 {h:'인코더 크기 > U-Net 크기',
  lead:'U-Net을 300M→2B로 키운 것보다 텍스트 인코더를 T5-Small→XXL로 키운 효과가 더 크다.',
  d:'CLIP 점수-FID의 pareto curve로 비교하면, U-Net 파라미터를 4개 규모(300M/500M/1B/2B)로 바꿔도 곡선이 거의 겹치는 반면, 텍스트 인코더 크기를 바꾸면 곡선이 뚜렷하게 이동한다. 이미지를 그리는 능력의 병목이 **U-Net의 생성 능력이 아니라 언어 이해**에 있다는 뜻이다.'},
 {h:'Dynamic thresholding: 포화 없이 큰 guidance를 쓴다',
  lead:'매 스텝 x-예측값을 percentile 기준으로 눌러 강한 CFG에서도 색이 안 터지게 한다.',
  d:'학습 데이터의 픽셀은 $[-1,1]$ 범위인데, guidance weight $w$ 를 키우면 매 스텝의 x-예측 $\\hat{x}_0^t$ 이 이 범위를 크게 벗어난다. 정적으로 $[-1,1]$에 clip하는 static thresholding은 이 문제를 완화하지만 여전히 과포화된다. 이 논문은 각 스텝마다 픽셀 절댓값의 특정 percentile $s$ 를 구해, $s>1$ 이면 $[-s,s]$ 로 클립한 뒤 $s$ 로 나누는 **동적** 방식을 쓴다. 포화된 픽셀을 매 스텝 안쪽으로 밀어 넣는 효과가 있다.'},
 {h:'픽셀 공간 cascade: 64→256→1024을 확산으로 잇는다',
  lead:'latent가 아니라 픽셀 공간에서 3단 확산 모델을 순서대로 거쳐 해상도를 올린다.',
  d:'[LDM](#/p/ldm)이 VAE로 압축한 latent 공간에서 확산을 도는 것과 달리, Imagen은 **64×64 기본 확산 모델** 뒤에 텍스트 조건부 super-resolution 확산 모델을 두 번(256×256, 1024×1024) 이어 붙인다. 각 단계는 noise conditioning augmentation — 저해상도 입력에 노이즈를 섞어 그 세기를 모델에 알려주는 방식 — 을 쓰는데, 이것이 없으면 앞 단계의 아티팩트가 그대로 다음 단계로 전달돼 품질이 떨어진다.'},
 {h:'DrawBench: 모델을 가르는 어려운 프롬프트 세트',
  lead:'구도·개수·공간관계·희귀 단어 등 11개 범주 200개 프롬프트로 모델을 직접 대결시킨다.',
  d:'MS-COCO 캡션은 너무 단순해서 모델 간 차이를 드러내지 못한다는 문제의식에서, 색·개수·공간관계·긴 문장·오탈자 프롬프트·비현실적 조합 등 11개 범주 200개 프롬프트를 모았다. 사람 평가자에게 두 모델의 샘플 8장씩을 나란히 보여주고 어느 쪽이 나은지 고르게 하는 방식으로 GLIDE·DALL-E 2·Latent Diffusion·VQGAN+CLIP과 직접 비교했다.'}
],

diagram:{type:'flow', cap:'Imagen 파이프라인. 텍스트 인코더는 얼린 채 그대로, 이미지 쪽만 3단으로 해상도를 올린다.',
 nodes:[
  {t:'텍스트', s:'프롬프트'},
  {t:'T5-XXL', s:'4.6B · 얼림', acc:true, note:'이미지 안 봄'},
  {t:'기본 확산', s:'64×64 · 2B'},
  {t:'초해상 1', s:'64→256 · 600M'},
  {t:'초해상 2', s:'256→1024 · 400M'}
 ]},

math:[
 {expr:'s = percentile(|x̂0|, p);  if s > 1: x̂0 ← clip(x̂0, -s, s) / s',
  tex:'s=\\mathrm{percentile}_p(|\\hat{\\mathbf{x}}_0^t|),\\quad \\text{if } s>1:\\ \\hat{\\mathbf{x}}_0^t \\leftarrow \\mathrm{clip}(\\hat{\\mathbf{x}}_0^t,-s,s)/s',
  d:'dynamic thresholding. 매 샘플링 스텝마다 $\\hat{x}_0^t$ 의 절댓값 분포에서 percentile $s$ 를 구하고, 1을 넘으면 그 범위로 눌러 다시 정규화한다. $p$ 가 높을수록(예: 99.5%) 더 공격적으로 포화를 억제한다.'},
 {expr:'ε̃(z_t, c) = w·ε(z_t, c) + (1-w)·ε(z_t)',
  tex:'\\tilde{\\boldsymbol{\\epsilon}}_\\theta(\\mathbf{z}_t,\\mathbf{c}) = w\\,\\boldsymbol{\\epsilon}_\\theta(\\mathbf{z}_t,\\mathbf{c}) + (1-w)\\,\\boldsymbol{\\epsilon}_\\theta(\\mathbf{z}_t)',
  d:'[CFG](#/p/cfg) 그대로다. $w>1$ 로 조건 방향을 과장할수록 정합성은 좋아지지만 dynamic thresholding 없이는 이 지점에서 이미지가 깨진다.'}
],

numbers:[
 {k:'FID-30K · MS-COCO', v:'7.27', d:'COCO로 학습하지 않은 zero-shot 기준. GLIDE 12.4, DALL-E 2 10.4보다 낮음(좋음)'},
 {k:'T5-XXL 파라미터', v:'4.6B', d:'텍스트 인코더 크기. U-Net(2B)보다도 크다'},
 {k:'기본 확산 모델', v:'2B 파라미터 · 64×64', d:'배치 2048 · 2.5M 스텝 · TPU-v4 256개'},
 {k:'초해상 모델', v:'600M + 400M', d:'64→256, 256→1024 두 단계'},
 {k:'DrawBench 선호도', v:'GLIDE 대비 alignment 약 60%', d:'사람 평가자가 Imagen을 고른 비율(95% CI, VQGAN+CLIP 상대로는 약 75%)'}
],

impact:'이미지 생성 품질의 병목이 "확산 모델이 얼마나 잘 그리는가"가 아니라 "텍스트를 얼마나 잘 이해하는가"에 있다는 것을 보여, 이후 text-to-image 모델들이 대형 언어모델·다중 텍스트 인코더를 적극 채택하는 계기가 되었다. dynamic thresholding은 이후 대부분의 확산 기반 생성 모델에 표준 기법으로 흡수됐다. 다만 latent 공간을 쓰는 [LDM](#/p/ldm) 계열과 달리 픽셀 공간에서 직접 cascade를 도는 방식은 계산 비용이 커서, 이후 산업계 모델은 대부분 latent 방식을 택했다.',

legacy:[
 '**텍스트 인코더 강화 추세** — [SDXL](#/p/sdxl)의 이중 텍스트 인코더, 이후 모델들의 대형 LM 기반 conditioning으로 이어짐',
 '**dynamic thresholding의 확산** — 강한 guidance에서 포화를 막는 기법으로 여러 오픈소스 diffusion 구현에 채택',
 '**DrawBench류 벤치마크** — MS-COCO만으로는 부족하다는 문제의식이 이후 구성적(compositional) 평가셋 설계로 이어짐',
 '**픽셀 vs latent 확산의 갈림길** — [DALL·E 2](#/p/dalle2)·Imagen의 픽셀 cascade와 [LDM](#/p/ldm)의 latent 압축이 서로 다른 계보로 갈라짐, 이후 공개 생태계는 latent 쪽이 지배적'
],

pitfalls:[
 '**"CLIP보다 T5가 항상 낫다"가 아니다.** 논문 스스로 MS-COCO 같은 단순 벤치마크에서는 T5-XXL과 CLIP 성능이 비슷하다고 밝힌다. 차이는 DrawBench 같은 **복합적인 프롬프트**에서만 뚜렷하게 드러난다.',
 '**Imagen은 Stable Diffusion과 다른 계보다.** 픽셀 공간에서 직접 cascade를 도는 구조라 [LDM](#/p/ldm)의 latent 압축과는 별개 접근이다. 두 계보를 같은 것으로 혼동하기 쉽다.',
 '**공개 모델이 아니다.** 안전성 우려로 가중치·코드가 공개되지 않았고, 논문의 수치는 재현 없이 저자 보고에 의존한다.'
],

figures:[
 {f:'fig3-drawbench-preference.png',
  cap:'DrawBench에서 Imagen 대 각 모델의 사람 선호도(파랑=Imagen). alignment·fidelity 두 축 모두, 특히 VQGAN+CLIP·Latent Diffusion 상대로 격차가 크다(약 75~80%).',
  src:'원문 Figure 3, p.8'},
 {f:'fig4-scaling-pareto.png',
  cap:'왼쪽(encoder size): T5-Small→XXL로 갈수록 곡선이 왼쪽 아래로 뚜렷이 이동. 가운데(U-Net size): 300M→2B로 키워도 곡선이 거의 겹침 — 이것이 "인코더가 더 중요하다"는 핵심 증거다.',
  src:'원문 Figure 4(a)(b), p.8'}
],

quotes:[
 {t:'Our key discovery is that generic large language models (e.g. T5), pretrained on text-only corpora, are surprisingly effective at encoding text for image synthesis: increasing the size of the language model in Imagen boosts both sample fidelity and image-text alignment much more than increasing the size of the image diffusion model.',
  src:'Abstract, p.1'},
 {t:'Dynamic thresholding pushes saturated pixels (those near -1 and 1) inwards, thereby actively preventing pixels from saturation at each step.',
  src:'Section 2.3, p.4'}
],

links:[
 {t:'arXiv 2205.11487 — Photorealistic Text-to-Image Diffusion Models with Deep Language Understanding', u:'https://arxiv.org/abs/2205.11487'},
 {t:'Imagen project page', u:'https://imagen.research.google'}
]
});
