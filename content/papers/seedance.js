WIKI.paper({
slug:'seedance',
venue:'arXiv 2025 (ByteDance Seed)',
authors:'ByteDance Seed',
arxiv:'2506.09113',

tldr:'프롬프트 충실도·움직임 타당성·화질을 동시에 잡으면서, **다단계 증류로 추론을 약 10배 가속**한 비디오 생성 모델. 공간·시간 attention을 분리한 구조가 멀티샷(여러 장면 전환) 생성을 네이티브로 지원한다.',

context:'2025년 상반기 비디오 생성 모델들은 프롬프트 충실도·움직임의 물리적 타당성·시각 품질 셋을 동시에 만족시키기 어려웠고, 특히 여러 샷(카메라 전환)에 걸쳐 같은 인물·객체의 정체성을 유지하는 내러티브 생성은 거의 다뤄지지 않았다. 또한 diffusion 기반 비디오 생성은 여러 스텝의 함수 평가(NFE)가 필요해 추론 비용이 커서, 실서비스에 올리기엔 느렸다. Seedance 1.0은 이 두 축 — "품질을 유지하며 멀티샷까지 되는 모델"과 "그걸 빠르게 서빙하는 법" — 을 함께 다룬다.',

ideas:[
 {h:'공간·시간 attention을 분리한 DiT',
  lead:'프레임 내부는 Spatial DiT Block, 프레임 사이는 Temporal DiT Block으로 분리해 학습·추론 효율을 높인다.',
  d:'Spatial DiT Block은 각 프레임 내부에서 attention을 계산하고(여기서만 텍스트 토큰과의 cross-modality 상호작용이 일어남), Temporal DiT Block은 프레임 사이의 attention을 윈도우 분할로 계산해 시간축 전역 수용영역을 확보한다. [Stable Diffusion 3](#/p/sd3)의 MMDiT 설계를 따라 공간 레이어에서는 비전·텍스트가 서로 다른 AdaLN·QKV·MLP 가중치를 쓰고, 시간 레이어는 비전 토큰만 처리한다.'},
 {h:'Multishot MM-RoPE로 여러 샷을 한 시퀀스에',
  lead:'텍스트 토큰에도 1D 위치 인코딩을 더한 3D Multi-modal RoPE로, 샷이 바뀌어도 순서·정체성을 유지한다.',
  d:'비전 토큰의 3D RoPE에 텍스트 토큰용 1D 위치 인코딩을 더해 만든 MM-RoPE(Seaweed·LCT 계열의 방식을 따름)는 비전·텍스트가 섞인 인터리브 시퀀스를 지원한다. 여러 샷을 행동의 시간 순서로 배열하고 각 샷마다 상세 캡션을 붙이는 방식으로, 멀티샷 학습 데이터를 하나의 긴 시퀀스로 표현할 수 있다.'},
 {h:'T2V/I2V/T2I 통합: 채널 결합 + 이진 마스크',
  lead:'노이즈가 낀 입력에 클린 프레임 또는 제로패딩 프레임을 채널 축으로 이어붙이고 마스크로 태스크를 구분한다.',
  d:'노이즈 입력에 조건 프레임(클린 또는 zero-padded)을 채널 차원으로 concat하고, 어떤 프레임이 "따라야 할 지시"인지 이진 마스크로 표시한다. 이 통일된 공식화 하나로 text-to-image·text-to-video·image-to-video를 같은 모델에서 학습 비율만 조절해 함께 다룬다.'},
 {h:'비디오 전용 RLHF: 다차원 보상 모델',
  lead:'소량의 정교한 SFT 데이터 이후, 움직임 자연스러움·구조적 일관성·시각적 충실도를 각각 재는 보상 모델로 RLHF를 건다.',
  d:'SFT는 신중하게 수집한 소규모 데이터로만 진행하고, 이후 비디오 특성에 맞춘 RLHF를 적용한다. 여러 개의 잘 발달된 보상 모델을 함께 써서 motion naturalness·structural coherence·visual fidelity 등 다차원으로 피드백을 준다.'},
 {h:'다단계 증류로 약 10배 가속',
  lead:'TSCD → RayFlow 스코어 증류 → APT 적대적 학습을 순서대로 얹어 NFE를 줄이면서 품질 저하를 막는다.',
  d:'먼저 HyperSD의 [Trajectory Segmented Consistency Distillation](#/p/add-turbo)(TSCD)로 디노이징 궤적을 여러 구간으로 나눠 일관성을 학습시켜 4배 가속을 얻는다. 여기에 RayFlow의 score distillation으로 학생 모델의 예측 노이즈를 교사와 정렬해 낮은 NFE에서도 안정적인 샘플링을 얻는다. 마지막으로 APT의 적대적 학습을 다단계 증류에 확장해, 사람 선호 데이터로 학습된 판별기가 급격한 가속으로 생긴 아티팩트를 줄인다. 이 파이프라인의 계보는 [Progressive Distillation](#/p/progressive-distillation) → [Consistency Models](#/p/consistency) → ADD/SDXL-Turbo로 이어지는 증류 연구 흐름 위에 있다. VAE 디코더도 픽셀에 가까운 단계의 채널 폭을 줄인 thin decoder로 재학습해 추가로 2배 가속을 얻는다.'}
],

diagram:{type:'stack', cap:'VAE로 비디오를, LLM으로 샷별 상세 캡션을 인코딩해 Spatial·Temporal DiT Block을 N번 반복한다. 여러 샷(Shot 1…Shot N)이 한 시퀀스로 들어가는 것이 멀티샷 지원의 핵심.',
 layers:[
  {t:'비디오 프레임', s:'Shot 1…Shot N'},
  {t:'VAE 인코더', s:'4×16×16 압축', acc:true},
  {t:'Spatial DiT', s:'프레임 내부 attn'},
  {t:'Temporal DiT', s:'프레임 간 attn', note:'윈도우 분할'},
  {t:'다단계 증류', s:'TSCD+RayFlow+APT', acc:true}
 ]},

math:[
 {expr:'VAE compression ratio r = C / (3 * rt * rh * rw)',
  tex:'r = \\frac{C\\times T\\times H\\times W}{3\\times T_{0}\\times H_{0}\\times W_{0}} = \\frac{C}{3\\times r_t\\times r_h\\times r_w}',
  d:'$(r_t,r_h,r_w)=(4,16,16)$, $C=48$ 을 실제로 사용. 채널 수를 압축률 대비 크게 잡아(C=48) DiT 쪽 patchify를 아예 생략할 수 있게 했다.'}
],

numbers:[
 {k:'추론 가속', v:'10배 이상 (품질 저하 없이)', d:'§Abstract — 다단계 증류 + 시스템 최적화 종합'},
 {k:'생성 속도', v:'5초·1080p 영상을 41.4초 (NVIDIA-L20)', d:'§Abstract — 상용 경쟁 모델 대비 유의미하게 빠르다고 주장'},
 {k:'VAE 압축률', v:'시간 4배 · 공간 16×16, 채널 48', d:'§2.1 — DCAE 방식을 따라 DiT의 patchify 연산 자체를 제거'},
 {k:'TSCD 단독 가속', v:'4배', d:'§5.1 — HyperSD의 TSCD 기법만 적용했을 때, RayFlow·APT 추가 전 수치'},
 {k:'VAE 디코더 가속', v:'2배 (thin decoder)', d:'§5.1 — 픽셀에 가까운 단계의 채널 폭을 줄여 재학습, 화질 손실 없음'},
 {k:'커널 융합 처리량 개선', v:'+15%', d:'§5.2 — 추론 인프라 최적화 중 커널 퓨전 단독 효과'}
],

impact:'품질(프롬프트 충실도·움직임·화질)과 속도(10배 가속)를 동시에 달성했다는 것을 증류 기법의 계보(TSCD→RayFlow→APT)를 조합해 실증했고, 공간·시간 attention 분리 + MM-RoPE로 멀티샷 내러티브 생성을 네이티브로 지원하는 구조를 제시했다. Artificial Analysis 리더보드에서 T2V·I2V 양쪽 1위를 차지하며 상용 서비스(Doubao·Jimeng)에 실제로 배포된 사례로, 연구용 데모를 넘어 프로덕션 규모에서 검증된 비디오 생성 파이프라인의 참조 사례가 되었다.',

legacy:[
 '**증류 기법의 조합 활용** — TSCD·RayFlow·APT라는 서로 다른 계보의 증류 기법을 순서대로 쌓아 적용하는 방식이 이후 비디오 diffusion 가속 연구의 참조 레시피가 됨',
 '**멀티샷 네이티브 생성** — 공간·시간 attention 분리 + 샷별 캡션을 더한 MM-RoPE 조합이 이후 내러티브형 비디오 생성 모델 설계에 참조됨',
 '**연구-프로덕션 격차 축소의 사례** — 대형 비디오 모델을 실제 상용 서비스 지연시간(초 단위)까지 끌어내린 엔지니어링 사례로 인용됨'
],

pitfalls:[
 '**"10배 가속"은 여러 기법(TSCD+RayFlow+APT+시스템 최적화)의 누적 효과다.** TSCD 단독으로는 4배이며, 어느 한 기법의 성과로 오인하면 안 된다.',
 '**41.4초라는 수치는 NVIDIA-L20 한 종류의 하드웨어 기준이다.** 다른 GPU에서의 지연시간은 논문에 나오지 않으므로 일반화해 인용하지 않는다.',
 '**Artificial Analysis 리더보드 1위는 2025년 6월 10일 시점의 스냅샷이다.** 비디오 생성 경쟁이 빠르게 바뀌는 분야이므로 "현재도 1위"라고 가정하면 안 된다 — 특히 Kling 2.1의 Elo는 데이터 부재로 Kling 2.0 값을 대신 썼다고 명시돼 있다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'왼쪽: 비디오 프레임은 VAE Encoder로, 샷별 상세 캡션은 LLM으로 인코딩돼 Shot 1…Shot N이 한 시퀀스로 이어진 뒤 Spatial→Temporal DiT Block을 N번 통과한다. 오른쪽 확대: Spatial DiT Block은 MM-RoPE 이후 Vision MLP와 Text MLP가 분리되고, Temporal DiT Block은 RoPE 이후 Vision MLP만 남는다 — 텍스트는 공간 레이어에서만 관여한다.',
  src:'원문 Figure 2, p.5'}
],

quotes:[
 {t:'Excellent model acceleration achieving 10× inference speedup through multi-stage distillation strategies and system-level optimizations. Seedance 1.0 can generate a 5-second video at 1080p resolution only with 41.4 seconds (NVIDIA-L20).',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2506.09113 — Seedance 1.0', u:'https://arxiv.org/abs/2506.09113'},
 {t:'Seedance 공식 페이지', u:'https://seed.bytedance.com/seedance'}
]
});
