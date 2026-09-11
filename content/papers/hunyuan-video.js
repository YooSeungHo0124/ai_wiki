WIKI.paper({
slug:'hunyuan-video',
venue:'Technical Report 2024 (Tencent)',
authors:'Tencent Hunyuan Foundation Model Team',
arxiv:'2412.03603',

tldr:'13B 파라미터 규모로는 당시 **오픈 웨이트 영상 생성 모델 중 가장 큰** 모델을 공개한 보고서. 계층적 데이터 필터링 파이프라인과 causal 3D VAE를 상세히 기술하고, 전문가 평가에서 상용 폐쇄형 모델들과 비교했다는 점에서 [movie-gen](#/p/movie-gen)과 짝을 이루는 문서다.',

context:'2024년 하반기, [movie-gen](#/p/movie-gen)·Sora·Runway Gen-3 같은 대규모 비디오 생성 모델은 대부분 가중치도 코드도 닫혀 있어 학계·오픈소스 커뮤니티가 그 성능에 접근할 방법이 없었다. 반면 공개된 오픈소스 영상 모델들은 규모와 데이터 품질에서 상용 모델에 크게 못 미쳤다. HunyuanVideo는 이 **폐쇄형-개방형 격차를 좁히는 것 자체를 목표**로 내세운다. 아키텍처 면에서는 [DiT](#/p/dit)와 [LDM](#/p/ldm)의 잠재공간 diffusion을 잇지만, 텍스트 조건을 CLIP 대신 대형 언어모델(LLM)로 인코딩하고, dual-stream/single-stream 두 단계로 구성된 transformer로 텍스트·비디오를 결합한다.',

ideas:[
 {h:'계층적 데이터 필터링 파이프라인',
  lead:'장면 분할부터 미학·모션·문자 필터까지 여러 단계를 거쳐 학습 데이터를 정제한다.',
  d:'PySceneDetect로 원본 비디오를 단일 샷 클립으로 자르고, VideoCLIP 임베딩으로 중복을 제거하고 k-means로 개념 균형을 맞춘다. 이어서 Dover(미학·기술 품질), optical flow 기반 모션 필터(정적 영상 제거), OCR(과도한 자막 제거), YOLOX 기반 워터마크·로고 탐지 등 목적이 다른 필터를 순차 적용하는 **계층적 파이프라인**을 구성했다. 이 필터들의 효과를 소형 모델로 사전에 검증한 뒤 전체 데이터셋에 적용했다.'},
 {h:'Causal 3D VAE로 이미지·비디오를 통일',
  lead:'CausalConv3D로 미래 프레임을 보지 않는 3D VAE를 만들어 이미지도 1프레임 비디오로 인코딩한다.',
  d:'$(T+1)\\times3\\times H\\times W$ 비디오를 시간축 $c_t=4$, 공간축 $c_s=8$, 채널 $C=16$ 으로 압축하는 3D VAE를 CausalConv3D로 구현했다. 인과적(causal) 설계 덕분에 현재 프레임의 토큰이 미래 프레임을 보지 않으므로, 이미지(1프레임 비디오)와 비디오를 **같은 인코더로 함께** 처리할 수 있다.'},
 {h:'Dual-stream → Single-stream DiT',
  lead:'초반에는 비디오·텍스트 토큰을 독립적으로 처리하다가 후반에 하나로 합쳐 처리한다.',
  d:'앞쪽 dual-stream 단계에서는 비디오 토큰과 텍스트 토큰이 서로 다른 transformer 블록을 통과해 각 모달리티 고유의 표현을 방해받지 않고 학습한다. 이어지는 single-stream 단계에서는 두 토큰 시퀀스를 concat해 같은 블록에 통과시켜 모달리티 간 융합을 강화한다. [sd3](#/p/sd3)의 MMDiT가 매 블록에서 attention만 공유하는 것과 달리, HunyuanVideo는 아예 단계를 나눠 앞부분은 분리, 뒷부분은 통합하는 구조를 쓴다.'},
 {h:'구조화된 캡션과 카메라 움직임 태깅',
  lead:'장면·배경·스타일·샷 타입·조명·분위기를 JSON으로 구조화한 캡션과 14종 카메라 움직임 분류를 학습에 함께 사용한다.',
  d:'캡션을 단순 서술문이 아니라 dense description, background, style, shot type, lighting, atmosphere 등 다차원 필드로 나눈 JSON 구조로 만들고, 학습 시 일부 필드를 무작위로 드롭아웃해 다양한 길이·패턴의 캡션에 대한 일반화를 높인다. 별도로 학습한 카메라 움직임 분류기(zoom in/out, pan, tilt 등 14종)의 고신뢰 예측을 캡션에 통합해 카메라 제어 능력을 부여한다.'},
 {h:'13B 파라미터를 오픈 웨이트로 공개',
  lead:'모델 가중치와 추론 코드를 GitHub에 공개해 오픈소스 영상 생성 생태계의 기반을 넓힌다.',
  d:'13B는 발표 시점 기준 공개된 영상 생성 모델 중 최대 규모였다. 논문은 가중치·추론 코드를 `github.com/Tencent/HunyuanVideo`에 공개했지만, 전체 학습 데이터셋과 학습 파이프라인 코드까지 전부 공개한 것은 아니다 — **가중치와 추론 스택 공개**가 이 논문의 "오픈"이 뜻하는 실제 범위다.'}
],

diagram:{type:'flow', cap:'HunyuanVideo 전체 구조. 비디오는 3D VAE로, 텍스트는 LLM으로 각각 인코딩된 뒤 diffusion backbone에서 결합된다.',
 nodes:[
  {t:'입력 비디오', s:'프레임 시퀀스'},
  {t:'Causal 3D VAE', s:'8×8×4 압축', acc:true},
  {t:'노이즈 추가', s:'잠재공간에서'},
  {t:'LLM 텍스트 인코딩', s:'조건으로 주입'},
  {t:'Diffusion 백본', s:'dual→single stream'}
 ]},

math:[
 {expr:'latent shape = (T/c_t + 1) × C × (H/c_s) × (W/c_s),  c_t=4, c_s=8, C=16',
  tex:'\\text{latent shape} = \\left(\\frac{T}{c_t}+1\\right)\\times C \\times \\frac{H}{c_s} \\times \\frac{W}{c_s},\\quad c_t=4,\\ c_s=8,\\ C=16',
  d:'Causal 3D VAE의 압축 비율. 시간축은 4배, 공간축은 8배 압축되며, "+1"은 causal 설계가 첫 프레임을 별도로 취급하는 데서 온다.'}
],

numbers:[
 {k:'모델 크기', v:'13B 파라미터', d:'공개 시점 최대 규모의 오픈 웨이트 비디오 생성 모델'},
 {k:'VAE 압축', v:'시간 4× · 공간 8×8', d:'채널 C=16'},
 {k:'카메라 움직임 분류', v:'14종', d:'zoom/pan/tilt/around/static/handheld 등'},
 {k:'평가 방식', v:'전문 평가자(professional evaluators) 비교', d:'Runway Gen-3·Luma 1.6 등 상용 모델과 GSB 비교'},
 {k:'공개 범위', v:'가중치 + 추론 코드', d:'전체 학습 데이터·학습 코드는 비공개'}
],

impact:'HunyuanVideo는 오픈소스 진영에 상용 모델과 견줄 만한 규모(13B)의 영상 생성 파운데이션 모델을 최초로 공개해, 이후 커뮤니티 파생 모델(LoRA 미세조정, 커스텀 컨트롤넷 등)의 기반이 되었다. 데이터 필터링 파이프라인과 causal 3D VAE 설계는 후속 오픈 비디오 모델들이 참고하는 공학적 표준 사례로 자리잡았다. 다만 이 보고서의 성능 우위 주장은 자동 지표가 아니라 **전문 평가자의 상대 비교(GSB)** 에 기반한다는 점을 함께 봐야 한다.',

legacy:[
 '**가중치 공개 규모의 벤치마크** — "오픈소스 영상 생성 모델도 상용 모델에 근접할 수 있다"를 13B 규모에서 실증한 사례로 자주 인용됨',
 '계층적 데이터 필터링·구조화 캡션 설계가 후속 오픈 비디오 모델의 데이터 파이프라인 설계에 참고 자료로 사용됨',
 'dual-stream→single-stream 결합 구조가 [sd3](#/p/sd3)의 MMDiT와 함께 텍스트-비디오 결합 방식의 두 갈래 사례로 비교 대상이 됨',
 '아바타 애니메이션(오디오·포즈·표정 구동) 등 파생 응용이 같은 사전학습 백본 위에서 후속 미세조정으로 이어짐'
],

pitfalls:[
 '**"오픈소스"의 의미가 가중치·추론 코드 공개에 한정된다.** 전체 학습 데이터셋과 학습 코드까지 재현 가능한 형태로 공개된 것은 아니다.',
 '**성능 비교 기준이 전문 평가자의 상대 비교(GSB)다.** FVD·CLIP score 같은 자동 지표만으로 이 논문의 우위 주장을 검증하려 하면 논문이 실제로 보고한 근거와 다르다.',
 '**13B는 diffusion transformer 본체 크기다.** 3D VAE, 텍스트 인코딩용 LLM 등 파이프라인의 다른 구성 요소는 별도로 계산된다.'
],

figures:[
 {f:'fig5-architecture.png',
  cap:'왼쪽 위 입력 이미지/비디오가 주황색 Hunyuan Causal 3DVAE Encoder로 압축되고, 노이즈가 더해진 뒤(주황 격자) 아래쪽 텍스트(초록 LLM 인코딩)와 함께 가운데 파란 Diffusion Backbone으로 들어간다. 오른쪽 파란 격자가 생성된 잠재이고, 마지막 3DVAE Decoder가 다시 픽셀로 복원한다.',
  src:'원문 Figure 5, p.5'}
],

quotes:[
 {t:'According to professional human evaluation results, HunyuanVideo outperforms previous state-of-the-art models, including Runway Gen-3, Luma 1.6.',
  src:'p.1'}
],

links:[
 {t:'arXiv 2412.03603 — HunyuanVideo', u:'https://arxiv.org/abs/2412.03603'},
 {t:'GitHub — Tencent/HunyuanVideo', u:'https://github.com/Tencent/HunyuanVideo'}
]
});
