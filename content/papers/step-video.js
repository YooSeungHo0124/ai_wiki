WIKI.paper({
slug:'step-video',
venue:'arXiv 2025 (StepFun)',
authors:'Step-Video Team (StepFun)',
arxiv:'2502.10248',

tldr:'**30B 파라미터, 최대 204프레임** 생성이 가능한 당시 최대급 오픈 text-to-video 모델. 16×16 공간·8배 시간 압축의 deep-compression VAE로 긴 영상을 감당하고, Video-DPO로 아티팩트를 줄였다.',

context:'2024년 말~2025년 초 시점에서 Sora·Veo·Kling 같은 폐쇄형 상용 모델은 고품질 영상을 만들었지만, 오픈소스로 공개된 모델들은 대개 파라미터 수나 생성 가능한 프레임 길이가 그에 못 미쳤다. 저자들은 이 논문에서 비디오 파운데이션 모델을 두 단계로 구분한다 — Level-1(텍스트·이미지를 영상으로 "번역"하는 모델)과 Level-2(LLM처럼 미래를 예측·추론하는 모델). Step-Video-T2V는 스스로 Level-1에 속한다고 명시하며, 복잡한 동작 시퀀스(체조 동작)나 물리 법칙 준수(바닥에 튀는 농구공) 같은 것은 아직 어렵다고 인정한다. 이 논문의 기여는 "Level-1을 오픈소스로 최대한 크게, 최대한 길게" 만드는 데 있다.',

ideas:[
 {h:'Deep-compression Video-VAE: 16×16×8',
  lead:'공간 16배·시간 8배라는 공격적 압축으로 긴 영상의 시퀀스 길이를 감당한다.',
  d:'입력 비디오 $X\\in\\mathbb{R}^{B\\times C\\times T\\times H\\times W}$ 를 latent $Z\\in\\mathbb{R}^{B\\times C_z\\times \\lceil T/8\\rceil\\times\\lceil H/16\\rceil\\times\\lceil W/16\\rceil}$ 로 압축한다. 인코더 후반부·디코더 전반부에 **Dual-Path** 구조를 둬서, Conv Path(causal 3D conv + pixel unshuffle)로 고주파 디테일을, Shortcut Path(grouped channel averaging)로 저주파 구조를 각각 보존한 뒤 residual로 합친다. 비교하면 [HunyuanVideo](#/p/hunyuan-video)는 8×8 공간·4배 시간 압축을 쓴다 — Step-Video는 이보다 두 배 더 압축해 같은 시퀀스 길이 예산으로 더 긴 영상(최대 204프레임, HunyuanVideo의 129프레임 대비)을 다룰 수 있다.'},
 {h:'이중 이중언어 텍스트 인코더',
  lead:'양방향 CLIP류(Hunyuan-CLIP)와 단방향 자체 LLM(Step-LLM)을 함께 써서 길이 제한과 정렬을 동시에 해결한다.',
  d:'Hunyuan-CLIP은 시각 공간과 잘 정렬되지만 입력 길이가 77토큰으로 제한된다. Step-LLM은 Alibi 위치 인코딩을 개조한 자체 단방향 중국어·영어 이중언어 인코더로, next-token prediction으로 사전학습돼 길이 제한이 없다. 두 인코더의 출력을 함께 조건으로 써서 짧은 프롬프트의 정렬 품질과 긴 프롬프트의 처리 능력을 둘 다 잡는다.'},
 {h:'3D Full Attention DiT, 30B·48층',
  lead:'48층·48헤드·헤드차원 128의 DiT가 3D full attention으로 flow matching 디노이징을 수행한다.',
  d:'[DiT](#/p/dit) 아키텍처를 기반으로 48층, 레이어당 48개 attention head(헤드 차원 128), cross-attention 차원 (6144, 1024), RMSNorm과 GELU-approx를 쓴다. 노이즈를 latent 프레임으로 디노이징하는 과정은 flow matching으로 학습된다.'},
 {h:'Video-DPO: 사람 피드백으로 아티팩트 감소',
  lead:'사람이 평가한 선호 데이터로 DPO를 적용해 비디오 특유의 아티팩트를 줄인다.',
  d:'프롬프트 풀에서 생성한 영상에 사람이 피드백을 주고, 이를 보상 모델을 거쳐 [DPO](#/p/dpo) 방식으로 반영하는 파이프라인(Figure 4)을 구축했다. LLM의 RLHF 관행을 비디오 생성에 옮긴 것으로, 목표는 절대적 품질 향상보다는 **아티팩트 감소**에 초점을 둔다.'},
 {h:'Step-Video-T2V-Eval: 자체 평가 벤치마크',
  lead:'11개 카테고리 128개 프롬프트로 구성된 벤치마크를 공개해 오픈·상용 모델과 비교한다.',
  d:'스포츠·음식·풍경·동물 등 11개 카테고리, 128개의 다양한 프롬프트로 구성된 벤치마크를 새로 만들어 공개했다. 사람 평가자 3인이 Win-Tie-Loss(Metric-1)와 4개 차원 점수 비교(Metric-2: Instruction Following·Motion Smoothness·Physical Plausibility·Aesthetic Appeal)로 HunyuanVideo·상용 엔진과 비교했다.'}
],

diagram:{type:'flow', cap:'이중 텍스트 인코더로 조건을 만들고, deep-compression VAE latent 위에서 3D full attention DiT가 flow matching으로 디노이징한다.',
 nodes:[
  {t:'프롬프트', s:'중국어+영어'},
  {t:'이중 텍스트 인코더', s:'CLIP+Step-LLM'},
  {t:'Video-VAE', s:'16×16×8 압축', acc:true},
  {t:'DiT', s:'3D Full Attn, 30B'},
  {t:'Video-DPO', s:'아티팩트 감소'}
 ]},

math:[
 {expr:'Causal 3D conv: frame t depends only on previous frames',
  tex:'\\mathcal{C}_{3D}(\\mathbf{X})_t = \\begin{cases}\\text{Conv3D}([\\mathbf{0},\\dots,\\mathbf{X}_t],\\Theta) & t=0\\\\ \\text{Conv3D}([\\mathbf{X}_{t-k},\\dots,\\mathbf{X}_t],\\Theta) & t>0\\end{cases}',
  d:'Video-VAE의 causal 3D convolution. 커널 크기 $k$ 만큼의 과거 프레임만 보고 현재 프레임을 계산해, 미래 정보가 새어 들어가지 않게 한다.'}
],

numbers:[
 {k:'파라미터', v:'30B', d:'§Abstract — DiT 48층 기준'},
 {k:'최대 생성 길이', v:'204프레임', d:'§Abstract, §9.3 — HunyuanVideo의 129프레임 대비 약 1.6배'},
 {k:'Video-VAE 압축률', v:'공간 16×16, 시간 8배', d:'§Abstract — HunyuanVideo(8×8, 4배) 대비 두 배 높은 압축률'},
 {k:'vs HunyuanVideo (Metric-1 전체)', v:'Annotator별 59-22-47 / 46-47-35 / 54-41-33', d:'Table 7 — Win-Tie-Loss, 세 평가자 간 편차가 크다는 점에 유의'},
 {k:'vs T2VTopA (Metric-1 전체)', v:'44-13-69 / 41-13-72 / 46-25-55', d:'Table 9 부근 — 중국 상용 엔진 대비는 오히려 Loss가 더 많음(오픈소스 중 최강이라는 주장과 별개)'},
 {k:'DiT 구성', v:'48층 · 48헤드 · 헤드차원 128', d:'Table 1 — cross-attn 차원 (6144,1024), RMSNorm/GELU-approx'}
],

impact:'공개 당시 오픈소스 text-to-video 중 최대 규모(30B)·최장 생성 길이(204프레임)를 달성해, 오픈 비디오 생성의 상한선을 한 단계 끌어올렸다. Deep-compression VAE(16×16×8)로 시퀀스 길이 예산 안에서 더 긴 영상을 다루는 접근과, LLM의 RLHF 관행을 비디오에 옮긴 Video-DPO는 이후 오픈 비디오 모델들의 설계 논의에 참조점이 되었다. 동시에 Level-1/Level-2 구분과 남은 한계(복잡한 동작, 물리 법칙)를 스스로 명시해, 후속 연구의 문제의식을 구체화했다.',

legacy:[
 '**Deep-compression VAE 설계의 참조** — 16×16×8처럼 압축률을 공격적으로 높여 긴 영상을 다루는 접근이 이후 대형 비디오 모델 설계에서 비교 기준이 됨(예: [Wan](#/p/wan-video)의 4×8×8과 대비)',
 '**Video-DPO의 확산** — 사람 선호 기반 DPO를 비디오 생성에 적용하는 파이프라인이 이후 비디오 모델 후처리 단계의 참조 사례가 됨',
 '**Level-1/Level-2 구분 프레임** — "번역 모델 vs 예측 모델"이라는 구분이 이후 비디오 파운데이션 모델 논의에서 목표를 명확히 하는 틀로 인용됨'
],

pitfalls:[
 '**"SOTA"는 오픈소스 모델 대비 주장이다.** 중국 상용 엔진(T2VTopA) 대비 Metric-1 종합 Win-Tie-Loss는 세 평가자 모두에서 Loss가 Win보다 많다(예: 44-13-69) — 상용 최상위 모델까지 앞섰다는 뜻은 아니다.',
 '**HunyuanVideo 대비 우위도 카테고리마다 다르다.** Animals 카테고리에서는 오히려 HunyuanVideo가 우세했고, 저자들은 이를 미학적 매력(Aesthetic Appeal) 점수 차이로 설명한다.',
 '**저자 스스로 Level-1 모델이라고 명시한다.** 복잡한 동작 시퀀스나 물리 법칙 준수는 명시적으로 한계로 남겨뒀다 — "최첨단"이라는 표현을 일반적인 비디오 이해·추론 능력까지 포함하는 것으로 확장하면 안 된다.'
],

figures:[
 {f:'fig2-vae.png',
  cap:'왼쪽이 인코더(아래→위), 오른쪽이 디코더(대칭). 각 Res3DModule DownSample/UpSample이 압축·복원을 담당하고, Conv Path(파랑)와 Shortcut Path(초록)가 Add로 합쳐지는 Dual-Path 구조가 인코더 후반부·디코더 전반부에 반복된다. 가운데 MidBlock이 attention을 포함한 병목 지점.',
  src:'원문 Figure 2, p.5'}
],

quotes:[
 {t:'We present Step-Video-T2V, a state-of-the-art text-to-video pre-trained model with 30B parameters and the ability to generate videos up to 204 frames in length.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2502.10248 — Step-Video-T2V Technical Report', u:'https://arxiv.org/abs/2502.10248'},
 {t:'GitHub — stepfun-ai/Step-Video-T2V', u:'https://github.com/stepfun-ai/Step-Video-T2V'}
]
});
