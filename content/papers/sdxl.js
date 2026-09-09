WIKI.paper({
slug:'sdxl',
venue:'arXiv 2023 (Stability AI)',
authors:'Podell, Rombach et al. (Stability AI)',
arxiv:'2307.01952',

tldr:'[LDM/Stable Diffusion](#/p/ldm)의 UNet을 3배로 키우고 텍스트 인코더를 두 개로 늘린 뒤, 이미지 크기·크롭 좌표까지 조건으로 넣고 마지막에 별도의 refiner 모델로 디테일을 다듬는 2단계 파이프라인으로 SD 1.x/2.x를 실사용자 선호도에서 크게 앞선 논문이다.',

context:'2022~2023년 Stable Diffusion 1.x/2.x는 이미 널리 쓰였지만 세 가지 병목이 뚜렷했다. UNet 용량이 작아 복잡한 프롬프트의 구도·디테일을 놓쳤고, 단일 CLIP 텍스트 인코더의 표현력이 제한적이었다. 또한 [LDM](#/p/ldm) 학습 파이프라인은 배치를 만들려고 이미지를 정사각형으로 리사이즈·크롭하는데, 이 과정에서 최소 해상도 미만 이미지를 통째로 버리거나(데이터 낭비) 랜덤 크롭이 물체를 잘라낸 채 그대로 학습 신호로 흘러들어가(생성물의 목이 잘리는 등) 품질을 깎아먹었다. SDXL은 아키텍처를 새로 발명하기보다, 이 병목들을 스케일·조건화 설계로 정면 돌파한다.',

ideas:[
 {h:'UNet 3배 확장 + attention 배치 재설계',
  lead:'파라미터를 늘리되 낮은 해상도 레벨에 transformer block을 몰아준다.',
  d:'기존 SD는 UNet의 모든 다운샘플링 레벨에 균일하게 transformer block을 1개씩 뒀다. SDXL은 계산량 대비 표현력이 큰 저해상도(고레벨) 특징 쪽에 transformer block을 [0, 2, 10]개로 편중시키고, 가장 높은 해상도 레벨에서는 아예 transformer block을 생략하며, 8× 다운샘플링 레벨 자체를 제거했다. 그 결과 UNet 파라미터가 860M(SD 1.x)·865M(SD 2.x)에서 **2.6B**로 늘었다.'},
 {h:'두 텍스트 인코더 병용',
  lead:'OpenCLIP ViT-bigG와 CLIP ViT-L의 출력을 이어붙여 cross-attention에 쓴다.',
  d:'penultimate(마지막 직전) 레이어의 텍스트 임베딩을 채널 축으로 concat해 context 차원을 768~1024에서 **2048**로 키운다. 여기에 더해 OpenCLIP ViT-bigG의 pooled text embedding을 timestep 임베딩 쪽에 추가로 더해, cross-attention 경로와 별개로 "문장 전체의 요지"도 모델에 넣어준다. 텍스트 인코더 전체 크기는 817M 파라미터다.'},
 {h:'크기 조건화: 저해상도 데이터를 버리지 않는다',
  lead:'원본 해상도 $(h,w)$를 Fourier feature로 임베딩해 timestep 조건에 더한다.',
  d:'[LDM](#/p/ldm) 학습은 최소 이미지 크기가 필요해, 예전 SD는 256px 미만을 통째로 버렸다(이 방식이면 SDXL 사전학습 데이터의 39%가 소실됐을 것으로 추정). SDXL은 대신 리사이즈 전 원본 $h_{original}, w_{original}$을 조건으로 주고, 추론 시 원하는 "체감 해상도"를 사용자가 직접 지정할 수 있게 한다. 저해상도 데이터를 버리지 않고도 저해상도 특유의 흐림이 새어나오는 것을 막는 셈이다.'},
 {h:'크롭 조건화: 물체 잘림 문제 해결',
  lead:'크롭 좌표 $(c_{top}, c_{left})$를 조건으로 줘 크롭을 추론 시 제어한다.',
  d:'배치를 만들 때 이미지를 랜덤 크롭하면 목이 잘린 고양이처럼 크롭 흔적이 생성물에 새어나온다. SDXL은 크롭이 일어난 좌상단 좌표 $(c_{top}, c_{left})$까지 Fourier feature로 임베딩해 조건에 포함시킨다. 학습 데이터는 그대로 랜덤 크롭 증강을 쓰되, 추론 시에는 $(c_{top}, c_{left})=(0,0)$으로 고정해 물체가 중앙에 온전히 나오는 샘플을 얻는다.'},
 {h:'2단계 파이프라인: base + refiner',
  lead:'base가 만든 latent를 refiner가 SDEdit 방식으로 다시 디노이징한다.',
  d:'base 모델(SDXL)로 128×128 latent를 끝까지 생성한 뒤, 같은 latent space에서 학습된 별도의 refiner 모델이 [SDEdit](#/p/ldm)처럼 낮은 노이즈 스텝(첫 200 노이즈 스케일)만 다시 노이징-디노이징해 고주파 디테일(얼굴, 배경 텍스처)을 보강한다. base와 refiner는 같은 VAE 오토인코더를 공유하며, 이 단계는 선택적이지만 사람 평가 선호도를 크게 끌어올린다.'}
],

diagram:{type:'flow', cap:'추론 파이프라인: base가 128×128 latent를 만들고 refiner가 같은 latent space에서 디테일만 다시 디노이징한 뒤 VAE로 디코딩한다.',
 nodes:[
  {t:'프롬프트', s:'2개 텍스트 인코더'},
  {t:'Base UNet', s:'128×128 latent, 2.6B', acc:true},
  {t:'Refiner UNet', s:'SDEdit, 노이즈 200스텝'},
  {t:'VAE 디코더', s:'→ 1024×1024'}
 ]},

math:[
 {expr:'context = concat(CLIP-L(txt), OpenCLIP-bigG(txt))  → dim 2048',
  tex:'c_{\\text{ctx}} = \\text{Concat}\\big(E_{\\text{ViT-L}}(y),\\, E_{\\text{ViT-bigG}}(y)\\big) \\in \\mathbb{R}^{2048}',
  d:'두 인코더의 penultimate 출력을 채널 축으로 이어붙여 cross-attention의 key/value로 쓴다. 여기에 OpenCLIP의 pooled embedding을 timestep 조건에 별도로 더한다.'},
 {expr:'c_size = FourierEmbed(h_original, w_original); c_crop = FourierEmbed(c_top, c_left)',
  tex:'\\mathbf{c}_{\\text{size}} = \\gamma(h_{\\text{orig}}, w_{\\text{orig}}),\\quad \\mathbf{c}_{\\text{crop}} = \\gamma(c_{\\text{top}}, c_{\\text{left}})',
  d:'$\\gamma$는 Fourier feature 인코딩. 두 임베딩을 concat해 timestep 임베딩에 더함으로써, UNet 구조를 바꾸지 않고도 원본 해상도·크롭 정보를 "공짜 조건"으로 주입한다.'}
],

numbers:[
 {k:'UNet 파라미터', v:'2.6B', d:'SD 1.4/1.5의 860M, SD 2.0/2.1의 865M 대비 약 3배'},
 {k:'텍스트 인코더', v:'817M', d:'OpenCLIP ViT-bigG + CLIP ViT-L 합산'},
 {k:'context 차원', v:'2048', d:'SD 1.x는 768, SD 2.x는 1024'},
 {k:'사람 평가 승률 · SDXL+refiner', v:'48.44%', d:'SD 1.5(7.91%), SD 2.1(6.71%) 대비 압도적'},
 {k:'사람 평가 승률 · SDXL base만', v:'36.93%', d:'refiner 없이도 SD 1.5/2.1을 크게 앞섬'},
 {k:'미사용시 폐기 데이터', v:'39%', d:'256px 미만 컷오프를 썼다면 버려졌을 사전학습 데이터 비율(크기 조건화로 방지)'}
],

impact:'SDXL은 오픈소스 text-to-image 모델이 처음으로 사람 선호도 평가에서 흑백상자(black-box) 상용 모델급 경쟁력을 보였다는 점에서 분수령이 됐다. 크기·크롭 조건화는 이후 대부분의 diffusion 파이프라인이 채택하는 표준 관행이 됐고, "base + refiner" 2단계 구조는 이후 여러 대형 이미지·비디오 생성 모델의 설계에 영향을 줬다. 무엇보다 가중치와 코드를 공개해, 커뮤니티가 [ControlNet](#/p/controlnet)·[DreamBooth](#/p/dreambooth) 같은 파생 연구를 SDXL 기반으로 곧바로 재현·확장할 수 있게 했다.',

legacy:[
 '**조건화 레시피의 표준화** — 크기·크롭 conditioning은 이후 SD 3, 여러 오픈 diffusion 모델의 기본 학습 관행이 됨',
 '**2단계(base+refiner) 구조** — 뒤이은 여러 이미지·[Stable Video Diffusion](#/p/svd) 계열 모델이 "생성 후 정제" 파이프라인을 채택',
 '**멀티 텍스트 인코더** — 여러 상용·오픈 모델이 서로 다른 인코더를 병용해 텍스트 이해력을 보강하는 방향으로 이어짐',
 '**아키텍처 전환의 전조** — SDXL은 UViT·[DiT](#/p/dit) 스타일 순수 transformer 백본을 실험했지만 이득을 못 봤다고 명시했고, 이 한계가 이후 [DiT](#/p/dit) 기반 diffusion 모델 전환의 동기가 됨'
],

pitfalls:[
 '**FID/CLIP score로는 SDXL의 우위가 잘 안 보인다.** 논문 스스로 고전적 지표가 text-to-image 품질 향상을 반영하지 못한다고 밝히며, 사람 평가(win rate)를 주 지표로 쓴다 — 지표만 보고 판단하면 개선이 없어 보일 수 있다.',
 '**refiner는 필수가 아니라 선택 단계다.** base 모델 단독으로도 SD 1.5/2.1보다 크게 앞서며(승률 36.93%), refiner는 얼굴·배경 디테일을 더 다듬는 추가 비용(모델 2개를 메모리에 올려야 함)일 뿐이다.',
 '**크롭 조건화는 크롭을 없애는 게 아니라 "숨기는" 것이다.** 학습 시 랜덤 크롭 증강 자체는 유지하고, 그 크롭 좌표를 조건으로 줘 추론 시 $(0,0)$으로 고정하는 방식이라 크롭 정보가 여전히 학습 신호에 남아 있다는 점을 헷갈리기 쉽다.'
],

figures:[
 {f:'fig1-pipeline.png',
  cap:'왼쪽 막대그래프가 4개 모델(SDXL+refiner/SDXL base/SD1.5/SD2.1) 간 사람 선호도 승률. 오른쪽이 실제 추론 흐름 — Base UNet이 128×128 latent를 만들고, 같은 크기의 Refiner UNet이 다시 디노이징한 뒤 VAE 디코더가 1024×1024로 확장한다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'Compared to previous versions of Stable Diffusion, SDXL leverages a three times larger UNet backbone: The increase of model parameters is mainly due to more attention blocks and a larger cross-attention context as SDXL uses a second text encoder.',
  src:'Abstract, p.1'},
 {t:'Given that in our experience large scale datasets are, on average, object-centric, we set (ctop, cleft) = (0, 0) during inference and thereby obtain object-centered samples from the trained model.',
  src:'Sec. 2.2, p.5'}
],

links:[
 {t:'arXiv 2307.01952 — SDXL', u:'https://arxiv.org/abs/2307.01952'},
 {t:'GitHub — Stability-AI/generative-models', u:'https://github.com/Stability-AI/generative-models'},
 {t:'Hugging Face — stabilityai (SDXL weights)', u:'https://huggingface.co/stabilityai'}
]
});
