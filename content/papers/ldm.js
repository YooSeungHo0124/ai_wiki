WIKI.paper({
slug:'ldm',
venue:'CVPR 2022',
authors:'Rombach, Blattmann, Lorenz, Esser, Ommer (LMU München CompVis · Runway ML)',
arxiv:'2112.10752',

tldr:'확산을 픽셀이 아니라 **오토인코더가 만든 저차원 잠재공간**에서 수행한다. 512×512 이미지를 64×64로 압축하고 나면 매 스텝의 연산량이 수십 배 줄어 소비자용 GPU에서도 돌아가고, U-Net에 cross-attention을 끼워 텍스트·레이아웃 같은 임의의 조건을 주입한다. Stable Diffusion의 논문이다.',

context:'[DDPM](#/p/ddpm) 계열은 품질에서 [GAN](#/p/gan)을 앞질렀지만 **픽셀 공간에서 직접 작동한다**는 구조적 비용을 안고 있었다. 512×512 RGB 한 장은 786,432차원이고, 확산 모델은 이 공간에서 수십~수백 번의 U-Net forward를 돌린다. 당시 최고 수준 모델의 학습에는 수백 GPU-day가 들었고 추론도 비쌌다. 문제의 본질은 낭비다 — 이미지 비트의 대부분은 사람이 인지하지 못하는 고주파 디테일에 쓰이는데, 확산 모델은 그 부분을 모델링하는 데도 의미 있는 구조를 학습하는 것과 똑같은 용량과 연산을 쓴다. 한편 [VQGAN](#/p/vqgan)은 이미 "지각적으로 동등한 압축"을 보였고, 그 위에 자기회귀 트랜스포머를 얹는 방식도 있었지만 순차 생성이 느리고 1차원으로 펼친 토큰 순서가 이미지의 2차원 구조와 맞지 않았다. **압축은 오토인코더에, 생성은 확산에 맡기자**는 것이 이 논문의 분업이다.',

ideas:[
 {h:'인지적 압축과 의미적 압축을 분리한다',
  lead:'오토인코더가 고주파 디테일을 걷어내고, 확산 모델은 남은 의미적 구조만 생성한다.',
  d:'1단계에서 오토인코더가 고주파 디테일을 걷어내는 **인지적 압축**만 담당하고, 2단계 확산 모델은 남은 **의미적 구조**의 생성에 집중한다. 인코더 $E$ 와 디코더 $D$ 는 [VQGAN](#/p/vqgan)에서 가져온 조합 — 픽셀 L1에 더해 perceptual loss와 패치 단위 판별자를 함께 써서, 낮은 비트레이트에서도 흐릿해지지 않고 그럴듯한 질감을 복원한다. 한 번 학습한 오토인코더는 여러 확산 모델에 재사용된다.'},
 {h:'압축률 f 는 너무 크지도 작지도 않아야 한다',
  lead:'f가 작으면 디테일에 낭비하고 크면 정보를 잃으니 f=4~8이 균형점이다.',
  d:'다운샘플링 배수 $f \\in \\{1,2,4,8,16,32\\}$ 를 전부 실험한 것이 이 논문의 실증적 기여다. $f$ 가 작으면(=픽셀 확산에 가까우면) 확산 모델이 디테일 모델링에 낭비하고, 크면 오토인코더가 정보를 잃어 확산 모델이 아무리 잘해도 복원 한계에 막힌다. 결론은 **$f=4$ 또는 $8$** — 논문 표현으로 "복잡도 감소와 디테일 보존 사이의 거의 최적점"이다.'},
 {h:'잠재공간의 규제: KL 또는 VQ, 아주 약하게',
  lead:'잠재 분산이 폭주하지 않도록 KL 또는 VQ로 아주 약하게만 규제한다.',
  d:'잠재변수가 임의로 큰 분산을 갖지 않도록 두 가지 중 하나를 쓴다 — [VAE](#/p/vae)식 KL 페널티(가중치를 아주 작게)나 [VQ-VAE](#/p/vqvae)식 벡터 양자화(디코더 안에 흡수). 핵심은 **규제를 약하게** 건다는 점이다. 표준 VAE처럼 강하게 걸면 잠재가 뭉개져 복원이 나빠지고, 아예 안 걸면 분산이 폭주해 확산의 노이즈 스케줄과 어긋난다.'},
 {h:'cross-attention으로 임의의 조건을 꽂는다',
  lead:'U-Net 특징이 Query, 조건 인코더 출력이 Key·Value가 되어 attention으로 결합한다.',
  d:'U-Net의 중간 특징에서 Query를, 조건 인코더 $\\tau_\\theta(y)$ 의 출력에서 Key·Value를 만들어 $\\mathrm{softmax}(QK^T/\\sqrt d)V$ 를 계산한다. 조건이 텍스트면 $\\tau_\\theta$ 는 트랜스포머 텍스트 인코더, 세그멘테이션 맵이면 작은 CNN이다. 조건을 **가변 길이 토큰 시퀀스**로 다루므로 문장의 각 단어가 이미지의 서로 다른 영역에 붙을 수 있고, 이 지점이 확산 모델과 [Transformer](#/p/transformer) 계열 언어 표현이 만나는 접합부가 된다.'},
 {h:'convolutional 방식으로 학습 해상도를 넘어선다',
  lead:'U-Net이 완전 합성곱이라 학습보다 큰 잠재 텐서를 넣어도 그대로 생성된다.',
  d:'U-Net이 완전 합성곱 구조이므로, 256×256으로 학습한 모델에 더 큰 잠재 텐서를 넣으면 학습보다 큰 이미지를 그대로 생성할 수 있다. 초해상도·인페인팅·파노라마 확장 같은 작업이 별도 아키텍처 없이 같은 모델로 처리된다.'}
],

diagram:{type:'flow', cap:'확산은 가운데 상자 안에서만 일어난다. 인코더·디코더는 한 번 학습한 뒤 얼려두고 재사용한다.',
 nodes:[
  {t:'이미지', s:'512×512×3 ≈ 786k'},
  {t:'인코더 E', s:'f=8 다운샘플'},
  {t:'잠재 z', s:'64×64×4 ≈ 16k'},
  {t:'잠재공간 확산 U-Net', s:'+ cross-attention(텍스트)', acc:true},
  {t:'디코더 D', s:'GAN·perceptual 손실로 학습'},
  {t:'생성 이미지', s:'512×512×3'}
 ]},

figures:[
 {f:'fig3-ldm-architecture.png',
  cap:'왼쪽 분홍 영역이 픽셀공간의 인코더 E·디코더 D, 가운데 초록 영역이 잠재공간에서 도는 확산 과정과 디노이징 U-Net. U-Net 안의 Q/K/V 박스가 cross-attention 지점이고, 오른쪽 회색 영역(semantic map·text·representations·images)이 τ_θ 를 거쳐 그 K,V로 흘러들어간다. 즉 조건의 종류가 바뀌어도 붙는 자리는 항상 같은 attention 층이다.',
  src:'원문 Figure 3, p.4'}
],

math:[
 {expr:'L_LDM = E_{E(x), ε, t} [ ‖ ε − ε_θ( z_t , t , τ_θ(y) ) ‖² ]',
  tex:'L_{LDM} = \\mathbb{E}_{E(x),\\,\\epsilon,\\,t}\\left[ \\| \\epsilon - \\epsilon_\\theta(z_t, t, \\tau_\\theta(y)) \\|^2 \\right]',
  d:'[DDPM](#/p/ddpm)의 손실에서 $x_t$ 가 $z_t = E(x)$ 의 노이즈 버전으로 바뀐 것이 전부다. 목적함수는 그대로이고 **작동하는 공간만 교체**했다.'},
 {expr:'Attention(Q, K, V) = softmax( Q Kᵀ / √d ) · V,   Q = W_Q φ(z_t),  K = W_K τ_θ(y),  V = W_V τ_θ(y)',
  tex:'\\text{Attention}(Q,K,V) = \\text{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d}}\\right)V,\\quad Q=W_Q\\varphi(z_t),\\ K=W_K\\tau_\\theta(y),\\ V=W_V\\tau_\\theta(y)',
  d:'조건 주입 지점. U-Net의 공간 특징이 Query가 되어 텍스트 토큰들을 조회한다. 이 attention 맵이 나중에 프롬프트-영역 대응을 이용한 편집 기법들의 개입 지점이 된다.'},
 {expr:'공간 요소 수:  512·512 = 262,144  →  64·64 = 4,096   (f = 8)',
  tex:'512 \\times 512 = 262{,}144 \\;\\longrightarrow\\; 64 \\times 64 = 4{,}096 \\quad (f=8)',
  d:'U-Net의 self-attention은 공간 요소 수에 대해 제곱으로 커지므로, 64배의 요소 감소가 곧 학습·추론 비용의 붕괴적 감소로 이어진다.'}
],

quotes:[
 {t:'To enable DM training on limited computational resources while retaining their quality and flexibility, we apply them in the latent space of powerful pretrained autoencoders.',
  src:'Abstract, p.1'}
],

numbers:[
 {k:'다운샘플링 배수 f', v:'4 또는 8', d:'$f\\in\\{1,…,32\\}$ 전수 비교 결과. 4~16 구간이 균형점'},
 {k:'text-to-image 모델', v:'1.45B 파라미터', d:'LAION-400M으로 학습. 잠재공간 U-Net 기준'},
 {k:'MS-COCO zero-shot FID', v:'12.63', d:'[CFG](#/p/cfg) scale 1.5 · [DDIM](#/p/ddim) 250스텝'},
 {k:'ImageNet 256 클래스 조건 FID', v:'3.60', d:'LDM-4 + classifier-free guidance. 당시 최상위권'},
 {k:'Stable Diffusion 잠재 크기', v:'64×64×4', d:'512×512 입력을 $f=8$ 로 압축한 공개 모델 구성'}
],

impact:'확산 모델을 **연구실 밖으로 내보낸** 논문이다. 잠재공간으로 옮기면서 추론이 소비자용 GPU 한 장에서 몇 초 안에 끝나게 됐고, 2022년 8월 Stable Diffusion이라는 이름으로 가중치가 공개되면서 이미지 생성은 소수 기업의 API에서 누구나 로컬에서 돌리고 파인튜닝하는 것으로 성격이 바뀌었다. 기술적으로 굳어진 것은 **2단계 분업 구조**다 — 압축(오토인코더)·생성(확산)·조건화(cross-attention)가 각각 독립적으로 교체 가능한 부품이 되면서, 이후 연구는 백본을 [DiT](#/p/dit)로 바꾸거나, 조건 인코더를 [CLIP](#/p/clip)에서 T5로 바꾸거나, [LoRA](#/p/lora)로 cross-attention만 미세조정하는 식으로 진행됐다. 영상 생성 모델 대부분도 시간 축을 추가한 같은 골격을 쓴다.',

legacy:[
 '**Stable Diffusion 생태계** — 공개 가중치 위에 [LoRA](#/p/lora) 미세조정, ControlNet, 인페인팅 파이프라인이 쌓이며 오픈 이미지 생성의 사실상 표준이 됨',
 '**백본 교체** — [DiT](#/p/dit)가 잠재공간 U-Net을 [ViT](#/p/vit)로 바꾸고, 이 조합(잠재 + 트랜스포머 + [flow matching](#/p/flow-matching))이 이후 대형 생성 모델의 기본형이 됨',
 '**영상·3D로의 확장** — 잠재공간 확산에 시간 축을 더한 비디오 확산 모델, [NeRF](#/p/nerf)/[3DGS](#/p/3dgs)의 최적화를 확산 사전확률로 유도하는 text-to-3D 계열이 파생',
 '**편집 도구의 기반** — cross-attention 맵을 직접 조작하는 프롬프트 편집, [DDIM](#/p/ddim) inversion 기반 실사진 편집이 모두 이 구조의 attention 지점을 이용'
],

pitfalls:[
 '**오토인코더의 복원 한계가 곧 모델의 상한이다.** 확산 모델이 완벽한 잠재를 만들어도 디코더가 못 살리는 것은 못 살린다. 작은 글자, 규칙적인 격자, 얼굴의 미세 구조가 무너지는 현상 상당수는 확산 쪽이 아니라 VAE 쪽 문제다.',
 '**잠재는 "압축된 이미지"이지 해석 가능한 의미 공간이 아니다.** 4채널 잠재를 그대로 시각화하면 흐릿한 이미지처럼 보이지만, 각 채널이 의미 있는 속성에 대응하지 않는다. [StyleGAN](#/p/stylegan)의 W 공간 같은 편집 성질을 기대하면 안 된다.',
 '**잠재 스케일링 상수는 장식이 아니다.** 잠재의 분산을 확산 노이즈 스케줄에 맞추는 스케일 인자(공개 구현의 `0.18215` 같은 값)를 빠뜨리면 신호 대 잡음비가 어긋나 학습이 조용히 망가진다. 오토인코더를 바꾸면 이 값도 다시 계산해야 한다.'
],

links:[
 {t:'arXiv 2112.10752 — High-Resolution Image Synthesis with Latent Diffusion Models', u:'https://arxiv.org/abs/2112.10752'},
 {t:'공식 구현 (CompVis/latent-diffusion)', u:'https://github.com/CompVis/latent-diffusion'},
 {t:'Stable Diffusion 저장소 (CompVis/stable-diffusion)', u:'https://github.com/CompVis/stable-diffusion'}
]
});
