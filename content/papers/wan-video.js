WIKI.paper({
slug:'wan-video',
venue:'arXiv 2025 (Alibaba)',
authors:'Wan Team (Alibaba Group)',
arxiv:'2503.20314',

tldr:'1.3B·14B 두 크기로 나온 오픈 비디오 생성 모델 모음. **1.3B 모델이 VRAM 8.19GB로 소비자용 GPU에서 돌아가면서도** 더 큰 오픈소스 모델을 능가해, 오픈 비디오 생성의 실질적 표준으로 자리잡았다.',

context:'2024~2025년 비디오 diffusion transformer는 [CogVideoX](#/p/cogvideox)·HunyuanVideo 등으로 품질은 올라갔지만, 대부분 수십 GB VRAM을 요구하는 대형 모델이라 개인이나 소규모 팀이 직접 돌리기 어려웠다. 오픈소스를 표방해도 실질적으로는 데이터센터급 GPU가 있어야 실험할 수 있었다는 뜻이다. Wan은 "최고 품질의 14B 모델"과 "소비자 GPU에서 돌아가는 1.3B 모델"을 같은 학습 레시피·같은 VAE로 함께 내놓아, 품질과 접근성을 양쪽 다 잡으려 했다.',

ideas:[
 {h:'Wan-VAE: 4×8×8 시공간 압축의 3D causal VAE',
  lead:'첫 프레임만 공간적으로, 나머지는 시공간 모두 압축하는 causal 구조로 4×8×8 압축을 만든다.',
  d:'입력 비디오 $V\\in\\mathbb{R}^{(1+T)\\times H\\times W\\times 3}$ 를 latent $[1+T/4, H/8, W/8, C{=}16]$ 로 압축한다. Down 블록이 공간만 압축하는 것과 공간+시간을 함께 압축하는 것을 섞어 쓰고, causal convolution으로 미래 프레임이 과거 예측에 섞이지 않게 한다. 비교하면 SVD는 1×8×8, Mochi는 6×8×8, [Step-Video](#/p/step-video)는 8×16×16을 쓴다 — Wan은 그 중간 지점에서 압축률과 재구성 품질의 균형을 택했다.'},
 {h:'umT5 텍스트 인코더로 중국어·영어 시각 텍스트',
  lead:'양방향 attention의 umT5를 써서 중국어·영어 모두를 잘 이해하고 화면 속 텍스트까지 생성한다.',
  d:'실험 결과 umT5가 (1) 중국어·영어를 포함한 다국어 인코딩에 강하고, (2) 같은 조건에서 단방향 attention LLM 기반 인코더보다 구성(compositionality) 면에서 우수하며, (3) 같은 파라미터 규모에서 더 빨리 수렴한다는 점에서 최종 텍스트 인코더로 umT5를 골랐다. 이 선택 덕에 Wan은 **중국어와 영어 모두**에서 화면 속 텍스트를 생성할 수 있는 최초의 모델이라고 주장한다.'},
 {h:'Flow matching 기반 이미지-비디오 통합 사전학습',
  lead:'저해상도 이미지 사전학습에서 시작해 이미지·비디오를 함께 flow matching으로 학습하며 해상도·길이를 늘린다.',
  d:'[flow matching](#/p/flow-matching) 프레임워크로 이미지와 비디오를 하나의 통일된 디노이징 과정으로 모델링한다. 저해상도 이미지 사전학습 이후, 해상도와 시간 길이를 단계적으로 늘려가는 다단계 이미지-비디오 공동 최적화를 거친다.'},
 {h:'1.3B로 소비자 GPU 접근성 확보',
  lead:'14B와 같은 레시피로 학습한 1.3B 모델이 VRAM 8.19GB만으로 480p T2V/I2V를 돌린다.',
  d:'1.3B 모델은 480p 해상도의 text-to-video·image-to-video를 지원하면서 VRAM 8.19GB만 필요해 RTX 4090급 소비자 GPU에서 실행 가능하다. 논문은 이 모델이 크기가 더 큰 다른 오픈소스 모델들보다도 성능이 앞선다고 보고한다 — "작아서 접근성이 좋다"가 아니라 "작은데도 품질이 밀리지 않는다"는 주장이다.'},
 {h:'8개 다운스트림 태스크로 확장',
  lead:'T2V·I2V뿐 아니라 지시 기반 비디오 편집, 개인화 커스터마이징까지 하나의 파운데이션 위에 얹는다.',
  d:'기반 모델 위에 image-to-video(I2V), instruction-guided video editing(V2V), zero-shot 개인화 커스터마이징, 실시간 생성, 오디오 생성 등 총 8개 다운스트림 태스크로 확장했다. 하나의 사전학습된 비디오 파운데이션 모델을 여러 응용의 백본으로 쓰는 구조다.'}
],

diagram:{type:'stack', cap:'Wan-VAE가 비디오를 시공간 압축한 latent로 만들고, 텍스트 조건과 함께 diffusion transformer가 flow matching으로 denoising한다.',
 layers:[
  {t:'입력 비디오', s:'[1+T, H, W, 3]'},
  {t:'Wan-VAE 인코더', s:'4×8×8 압축', acc:true, note:'causal, C=16'},
  {t:'umT5 텍스트 인코딩', s:'중국어+영어'},
  {t:'DiT', s:'flow matching'},
  {t:'Wan-VAE 디코더', s:'latent → 비디오'}
 ]},

numbers:[
 {k:'모델 크기', v:'1.3B / 14B', d:'§Abstract — 효율/성능 두 축을 위한 두 크기'},
 {k:'1.3B VRAM 요구량', v:'8.19 GB', d:'§Abstract — 480p T2V/I2V 기준, 소비자 GPU 호환성의 근거 수치'},
 {k:'Wan-VAE 압축률', v:'4×8×8, latent 채널 16', d:'Fig.5 — SVD(1×8×8)·Mochi(6×8×8)·Step-Video(8×16×16) 대비 비교'},
 {k:'umT5 도입 효과', v:'파라미터 25% 절감(bias 분리 설계)', d:'§4.2.1 — 텍스트 인코더 자체 절감이 아니라, 블록별 bias 분리를 통한 DiT 설계 개선치'},
 {k:'실시간 추론 데모', v:'RTX 4090 단일 GPU + int8/TensorRT', d:'Fig.31 캡션 — 소비자 하드웨어에서의 추론 시연'}
],

impact:'같은 레시피로 최고 품질(14B)과 소비자 GPU 접근성(1.3B)을 동시에 내놓은 것이, 오픈 비디오 생성 모델을 연구 논문 수준에서 실제로 널리 쓰이는 도구로 바꾼 결정적 요인이 되었다. Wan-VAE의 시공간 압축 설계와 umT5 기반 다국어 텍스트 렌더링은 이후 오픈 비디오 모델들의 참조 설계가 되었고, 8개 다운스트림 태스크로의 확장은 하나의 비디오 파운데이션 모델을 범용 백본으로 쓰는 패턴을 보여줬다.',

legacy:[
 '**소비자 GPU 접근성의 선례** — 대형 모델과 함께 경량 모델을 같은 레시피로 공개하는 방식이 이후 오픈 비디오 모델 릴리스의 관행이 됨',
 '**Wan-VAE 압축률 비교의 참조점** — 4×8×8 압축률이 이후 논문들이 자기 VAE 설계를 설명할 때 비교 기준으로 인용됨(예: [Step-Video](#/p/step-video)의 8×16×16과 대비)',
 '**중국어+영어 시각 텍스트 생성** — [Qwen-Image](#/p/qwen-image)를 비롯해 다국어 텍스트 렌더링을 명시적 목표로 삼는 후속 생성 모델들과 문제의식을 공유'
],

pitfalls:[
 '**"1.3B가 더 큰 모델을 이긴다"는 특정 오픈소스 모델·벤치마크 조건에서의 비교다.** Figure 1의 Wan-Bench·인간 선호도 비교 대상이 무엇인지 확인하지 않고 일반화하면 과장이 된다.',
 '**umT5로 인한 25% 파라미터 절감은 텍스트 인코더 자체의 효과가 아니라, DiT 블록의 bias를 분리하는 설계 변경의 효과다.** 원문에서 두 논의가 인접해 있어 혼동하기 쉽다.',
 '**"중국어와 영어 모두 시각 텍스트를 생성하는 최초 모델"은 저자 자신의 주장이다.** 비교 대상이 명시된 범위(오픈소스 비디오 생성 모델) 내에서의 최초라는 점에 유의한다.'
],

figures:[
 {f:'fig5-vae.png',
  cap:'왼쪽 Encoder가 [1+T,H,W,3] 비디오를 Down 블록(파랑=공간만, 주황=시공간 함께) 3개로 줄여 [1+T/4,H/8,W/8,C] latent를 만들고, 오른쪽 Decoder가 대칭으로 복원한다. 첫 프레임이 "1+T"로 따로 취급되는 것이 causal 설계의 흔적.',
  src:'원문 Figure 5, p.10'}
],

quotes:[
 {t:'Remarkably, the 1.3B model requires only 8.19G of VRAM, allowing it to run on many consumer-grade GPUs, while its performance exceeds that of many larger open-source models.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2503.20314 — Wan: Open and Advanced Large-Scale Video Generative Models', u:'https://arxiv.org/abs/2503.20314'},
 {t:'GitHub — Wan-Video/Wan2.1', u:'https://github.com/Wan-Video/Wan2.1'}
]
});
