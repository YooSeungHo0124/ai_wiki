WIKI.paper({
slug:'videoldm',
venue:'CVPR 2023',
authors:'Blattmann, Rombach et al. (LMU Munich · NVIDIA)',
arxiv:'2304.08818',

tldr:'이미지로 이미 학습된 [LDM](#/p/ldm)을 얼려 두고, 그 사이사이에 **시간 층(temporal layer)만 새로 끼워 넣어 학습**해서 영상 생성기로 바꾼 논문. 픽셀이 아니라 latent에서 확산하므로 512×1024 해상도의 긴 영상까지 감당할 수 있는 계산량으로 낮춘 것이 핵심이다.',

context:'[Video Diffusion Models](#/p/video-diffusion)는 픽셀 공간에서 3D U-Net으로 직접 영상을 denoise했고, [Make-A-Video](#/p/make-a-video)도 비슷하게 픽셀 공간 캐스케이드를 썼다. 두 접근 모두 프레임 수·해상도가 늘수록 메모리와 연산이 그대로 폭증한다. 반면 이미지 쪽에서는 [LDM](#/p/ldm)이 오토인코더로 압축한 latent에서 확산해 비용을 크게 낮춘 상태였다. 문제는 영상 데이터셋이 이미지 데이터셋보다 훨씬 작고 구하기 어렵다는 점이다. 이 논문의 질문은 "이미 잘 학습된 이미지 LDM을 통째로 재활용하면서, 영상에 필요한 시간 축 정보만 최소한으로 추가할 수 없는가"이다.',

ideas:[
 {h:'공간 층은 얼리고 시간 층만 새로 학습',
  lead:'사전학습된 이미지 LDM의 spatial layer $l^i_\\theta$ 는 고정하고 temporal layer $l^i_\\phi$ 만 학습한다.',
  d:'U-Net의 각 spatial layer 뒤에 temporal layer를 끼워 넣는다. 학습 중 spatial layer는 $B{\\cdot}T$ 개의 프레임을 배치처럼 독립적으로 처리하고, temporal layer만 프레임 축 $T$ 를 열어 프레임 간 관계를 학습한다. $\\phi$ 를 학습하는 동안 $\\theta$ 는 그대로 두므로, **이미지 데이터로 학습한 지식을 잃지 않은 채** 영상에 필요한 시간적 일관성만 얹는다. 추론 시 병합 계수 $\\alpha^i_\\phi=1$ 로 두면 temporal layer를 건너뛰어 원래 이미지 모델로 되돌아간다.'},
 {h:'시간 층은 attention과 3D conv 두 종류',
  lead:'시간 축 attention과 3D convolution 기반 residual block을 번갈아 끼워 시간 정보를 섞는다.',
  d:'temporal attention은 같은 위치의 서로 다른 프레임끼리를, 3D conv 기반 층은 국소적인 시간 이웃을 섞는다. 시간 위치 정보는 sin/cos positional encoding으로 주입한다. 두 종류를 같이 쓰는 구성이 attention만 쓴 것보다 FVD·FID 모두 더 낮았다.'},
 {h:'디코더도 시간적으로 미세조정해야 깜빡임이 사라진다',
  lead:'이미지로만 학습된 오토인코더 디코더를 영상에 맞게 다시 미세조정해야 프레임 간 깜빡임이 없어진다.',
  d:'[LDM](#/p/ldm)의 오토인코더는 인코더·디코더 모두 개별 이미지로 학습됐다. 이 디코더로 latent 영상을 프레임별로 독립 디코딩하면 색·질감이 프레임마다 미세하게 달라져 깜빡인다. 인코더는 그대로 두고 디코더에만 시간 층과 3D conv 기반 판별기를 추가해 영상 재구성 손실로 다시 학습시키면, 재구성 FVD가 자릿수 단위로 개선된다.'},
 {h:'Video LDM Stack: 키프레임 → 보간 → 업샘플',
  lead:'드문 키프레임을 먼저 생성하고 같은 backbone을 공유하는 보간 모델로 프레임 수를 늘린 뒤 업샘플러를 얹는다.',
  d:'전체 파이프라인은 (1) 희소한 키프레임 생성, (2)(3) 같은 interpolation LDM을 두 단계 반복 적용해 프레임 수를 4배씩 늘림, (4) 디코더로 픽셀 변환, (5) 영상 업샘플러 적용의 5단계다. 보간 모델은 앞뒤 컨텍스트 프레임을 마스킹해 조건으로 주는 동일한 temporal layer 구조를 재사용하므로, 몇 분 길이의 영상도 이 스택을 반복해 만들 수 있다.'},
 {h:'업샘플러도 시간적으로 정렬해야 화질이 산다',
  lead:'초해상도 diffusion 모델에도 temporal layer를 끼워, 프레임을 독립적으로 업샘플할 때 생기는 깜빡임을 없앤다.',
  d:'프레임을 각각 업샘플하면 개별 프레임 품질(FID)은 괜찮지만 시간적 일관성이 깨져 FVD가 크게 나빠진다. 업샘플러 U-Net에도 동일한 temporal layer를 삽입해 video fine-tuning하면 FVD가 165.98 → 45.39로 낮아진다. 업샘플러는 저해상도 조건에 맞춰 국소적으로만 동작하면 되므로 학습·추론 비용이 낮다.'}
],

diagram:{type:'stack', cap:'U-Net 한 블록의 구조. spatial layer(회색, 고정)와 temporal layer(초록, 학습)가 번갈아 쌓인다.',
 layers:[
  {t:'입력 latent', s:'B·T×C×H×W'},
  {t:'Spatial layer', s:'이미지 LDM, 고정 θ'},
  {t:'Temporal layer', s:'attention or 3D conv', acc:true, note:'프레임 간 정렬 학습'},
  {t:'병합', s:'α·z + (1-α)·z′', note:'α=1이면 이미지 모델'},
  {t:'다음 블록으로', s:'반복'}
 ]},

math:[
 {expr:'z′ = l_φ(z′, c);  αz + (1-α)z′',
  tex:'z^{\\prime}\\leftarrow l_{\\phi}^{i}(z^{\\prime},c),\\qquad \\alpha_{\\phi}^{i} z + (1-\\alpha_{\\phi}^{i})z^{\\prime}',
  d:'temporal layer의 출력 $z\\prime$ 을 학습 가능한 계수 $\\alpha^i_\\phi \\in [0,1]$ 로 spatial 출력 $z$ 와 섞는다. $\\alpha=1$ 이면 temporal layer가 완전히 무시되어 원본 이미지 모델과 동일해지는, 시간 축 도입을 안전하게 시작하는 장치다.'},
 {expr:'argmin_φ E‖y − f_{θ,φ}(z_τ; c, τ)‖²',
  tex:'\\arg\\min_{\\phi}\\; \\mathbb{E}_{x\\sim p_{data},\\tau\\sim p_{\\tau},\\epsilon\\sim\\mathcal{N}(0,I)}\\left\\lVert y-f_{\\theta,\\phi}(z_{\\tau};c,\\tau)\\right\\rVert_2^2',
  d:'denoising score matching 목적함수는 [DDPM](#/p/ddpm)과 동일한 형태이지만, 최적화 대상이 $\\phi$ (temporal layer) 뿐이고 $\\theta$ (spatial layer)는 상수로 고정된다는 점이 이 논문의 전부다.'}
],

numbers:[
 {k:'주행 영상 해상도', v:'512×1024', d:'실제 주행 장면(RDS) 데이터셋, 8초·최대 30fps 클립 683,060개'},
 {k:'FVD · RDS 128×256', v:'389 (조건부 356)', d:'LVG 기존 SOTA 478 대비 개선'},
 {k:'디코더 fine-tuning 효과', v:'FVD 390.88 → 7.61', d:'재구성 FVD, 시간적 디코더 미세조정의 효과(Table 3)'},
 {k:'업샘플러 fine-tuning 효과', v:'FVD 165.98 → 45.39', d:'프레임별 독립 업샘플 대비 시간 정렬 업샘플'},
 {k:'텍스트-영상 해상도', v:'최대 1280×2048', d:'공개 Stable Diffusion을 temporal layer만 얹어 확장'},
 {k:'최장 생성 길이', v:'약 5분', d:'prediction 모델로 컨텍스트 프레임 조건부 반복 생성'}
],

impact:'영상 확산 모델의 학습 비용 구조를 바꿨다. 픽셀 공간에서 전체 3D U-Net을 처음부터 학습하는 대신, **이미 완성된 이미지 생성기에 작은 시간 모듈만 추가 학습**하면 된다는 것을 보여 [LDM](#/p/ldm)의 latent 확산을 영상으로 옮기는 표준 레시피를 세웠다. 공개된 Stable Diffusion 체크포인트를 그대로 재사용해 텍스트-영상 모델을 만들 수 있다는 것도 보였고, 개인화된 이미지 체크포인트에 학습된 temporal layer를 그대로 이식해 개인화 텍스트-영상 생성이 가능함을 처음 보였다.',

legacy:[
 '**[SVD](#/p/svd)** 가 같은 "이미지 사전학습 → 시간 층 확장" 골격을 이어받아, 여기에 대규모 데이터 큐레이션과 3단계 학습을 더해 완성했다',
 '**픽셀 공간 확산과의 결별** — 이후 대부분의 텍스트-영상 모델이 latent 공간 확산을 기본값으로 채택',
 '**temporal layer 삽입 패러다임**이 영상 편집·개인화(모션 LoRA, DreamBooth 결합) 연구의 표준 진입점이 됨',
 '**키프레임 + 보간 스택** 구조가 이후 긴 영상 생성 파이프라인(계층적 생성)의 기본 설계로 반복 사용됨'
],

pitfalls:[
 '**"영상 확산이 이미지 확산보다 무조건 비싸다"는 이 논문 이후로는 절반만 맞다.** temporal layer만 학습하면 파라미터·데이터 요구량이 크게 줄지만, 그만큼 새로 학습할 수 있는 모션의 다양성도 spatial layer가 고정된 만큼 제한된다.',
 '**디코더 fine-tuning을 생략하면 논문 성능이 재현되지 않는다.** temporal layer만 신경 쓰고 오토인코더 디코더를 이미지용 그대로 쓰면 Table 3에서 보듯 재구성 FVD가 자릿수 단위로 나빠진다.',
 '**latent 확산이라 프레임 단위의 미세한 텍스처 일관성은 보장하지 못한다.** 압축 오토인코더를 거치는 한, 워터마크·텍스트처럼 고주파 디테일이 프레임마다 흔들리는 문제는 완전히 해결되지 않는다.'
],

figures:[
 {f:'fig4-temporal-layers.png',
  cap:'왼쪽: spatial layer(회색, θ 고정)와 temporal layer(초록, φ 학습) 이 번갈아 쌓인 U-Net 블록. 오른쪽: 학습 중 프레임이 배치 차원으로 펼쳐졌다가(spatial layer) temporal layer에서만 다시 시간 축으로 reshape되는 과정.',
  src:'원문 Figure 4, p.4'},
 {f:'fig5-ldm-stack.png',
  cap:'1) 키프레임 생성 → 2)(3) 같은 interpolation LDM을 두 번 반복 적용해 프레임 수를 늘림 → 4) 디코더로 픽셀 변환 → 5) 업샘플러 적용. 오른쪽 색 블록들이 모두 같은 이미지 backbone을 공유한다는 것이 이 스택의 핵심.',
  src:'원문 Figure 5, p.4'}
],

quotes:[
 {t:'We first pre-train an LDM on images only; then, we turn the image generator into a video generator by introducing a temporal dimension to the latent space diffusion model and fine-tuning on encoded image sequences, i.e., videos.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2304.08818 — Align your Latents', u:'https://arxiv.org/abs/2304.08818'},
 {t:'프로젝트 페이지 (NVIDIA)', u:'https://research.nvidia.com/labs/toronto-ai/VideoLDM/'}
]
});
