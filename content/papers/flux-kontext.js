WIKI.paper({
slug:'flux-kontext',
venue:'arXiv 2025 (Black Forest Labs)',
authors:'Batifol, Blattmann, Boesel et al. (Black Forest Labs)',
arxiv:'2506.15742',

tldr:'텍스트-이미지 생성과 이미지 편집을 **하나의 흐름 매칭 모델**로 통합한다. 컨텍스트 이미지를 latent 토큰 시퀀스에 그냥 이어붙이는 단순한 방식으로, 반복 편집에서도 캐릭터·객체 일관성이 잘 유지되는 것이 핵심 주장이다.',

context:'이미지 편집 모델은 대개 두 갈래로 나뉘어 있었다 — inpainting류(LaMa, SD Inpainting)는 마스크 안쪽만 국소적으로 바꾸고, in-context 생성 모델은 참조 이미지의 스타일이나 캐릭터를 새 장면에 옮기지만 편집은 잘 못한다. 더 큰 문제는 **반복 편집**이다. 한 번 편집한 결과를 다시 입력으로 넣어 여러 턴 편집을 이어가면, 기존 모델 다수는 캐릭터 정체성이 조금씩 드러나거나(identity drift) 화질이 누적 열화된다. 이는 학습 자체가 단일 턴 편집 쌍에만 최적화돼 있고, 생성과 편집을 별도 파이프라인으로 다루는 구조적 한계에서 온다. FLUX.1 Kontext는 생성과 편집을 애초에 구분하지 않는 하나의 조건부 분포로 모델링해 이 문제에 접근한다.',

ideas:[
 {h:'생성과 편집을 하나의 조건부 분포로',
  lead:'컨텍스트 이미지 $y$ 가 없으면 생성, 있으면 편집인 $p_\\theta(x\\mid y,c)$ 하나로 통일한다.',
  d:'출력 이미지 $x$, 선택적 컨텍스트 이미지 $y\\in X\\cup\\{\\varnothing\\}$, 텍스트 프롬프트 $c$ 를 두고 $p_\\theta(x\\mid y,c)$ 하나의 네트워크로 모델링한다. $y=\\varnothing$ 이면 순수 text-to-image, $y\\neq\\varnothing$ 이면 in-context 생성 또는 국소 편집이 된다. FLUX.1 text-to-image 체크포인트에서 시작해 수백만 쌍의 관계형 데이터 $(x\\mid y,c)$ 로 이어서 학습한다.'},
 {h:'시퀀스 결합: 채널이 아니라 토큰 축으로 이어붙인다',
  lead:'컨텍스트 이미지를 latent 토큰으로 인코딩해 출력 이미지 토큰 뒤에 그냥 이어붙인다.',
  d:'고정된 FLUX 오토인코더로 컨텍스트 이미지를 latent 토큰 $y$ 로 인코딩하고, 이를 출력 이미지 토큰 $x$ 뒤에 **시퀀스 축으로 concat**해 visual stream에 넣는다. 채널 축으로 합치는 방식도 실험했지만 성능이 더 나빴다. 시퀀스 결합은 서로 다른 해상도·종횡비의 입출력을 그대로 지원하고, 컨텍스트 이미지를 $y_1,\\dots,y_N$ 여러 장으로 자연스럽게 확장할 수 있다는 장점이 있다.'},
 {h:'가상 시간축으로 컨텍스트와 타깃을 분리하는 3D RoPE',
  lead:'토큰 위치 $(t,h,w)$ 의 $t$ 를 가상 타임스텝으로 써서 타깃과 컨텍스트 블록을 구분한다.',
  d:'[RoPE](#/p/rope)를 3D로 확장해 위치 정보를 인코딩한다. 타깃 토큰은 $u_x=(0,h,w)$, $i$번째 컨텍스트 이미지의 토큰은 $u_{y_i}=(i,h,w)$ 로 위치를 인코딩한다. $h,w$(공간 구조)는 그대로 유지한 채 $t$ 값만 블록마다 다르게 줘서, attention이 "이건 몇 번째 컨텍스트/타깃 토큰인지"를 명확히 구분하게 한다. 공간 구조는 유지하면서 블록 정체성만 분리하는 절충이다.'},
 {h:'Rectified-flow 목적함수',
  lead:'노이즈와 타깃 latent를 선형 보간한 $z_t$ 에서 velocity를 직접 회귀한다.',
  d:'$z_t=(1-t)x+t\\varepsilon$ 로 정의된 보간 경로에서 velocity $v_\\theta$ 를 예측하도록 학습한다. 텍스트-이미지 쌍만 샘플링할 때는 컨텍스트 토큰 $y$ 를 아예 빼서, 같은 네트워크가 text-to-image 능력을 잃지 않도록 한다. $p(t)$ 는 해상도에 따라 모드를 바꾸는 logit-normal shift 스케줄을 쓴다.'},
 {h:'KontextBench: 다섯 태스크의 실사용 편집 벤치마크',
  lead:'108개 기반 이미지에서 뽑은 1026개 이미지-프롬프트 쌍으로 국소편집·전역편집·캐릭터/스타일 참조·텍스트 편집을 평가한다.',
  d:'기존 편집 벤치마크는 커버리지가 좁다는 문제의식으로, 크라우드소싱한 실제 사용 사례 1026쌍을 국소 편집·전역 편집·캐릭터 참조(CREF)·스타일 참조(SREF)·텍스트 편집 5개 범주로 구성했다. CREF는 AuraFace로 얼굴 임베딩을 뽑아 편집 전후 정체성 보존을 정량 비교한다.'}
],

diagram:{type:'flow', cap:'텍스트와 컨텍스트 이미지를 각각 인코딩해 하나의 시퀀스로 잇고, Double Stream과 Fused DiT 블록을 거쳐 출력 이미지를 만든다.',
 nodes:[
  {t:'텍스트+컨텍스트', s:'프롬프트, 참조 이미지'},
  {t:'VAE 인코더', s:'latent 토큰화'},
  {t:'시퀀스 결합', s:'concat(x, y)', acc:true},
  {t:'DiT 블록', s:'N개, Double/Fused'},
  {t:'VAE 디코더', s:'출력 이미지'}
 ]},

math:[
 {expr:'L = E[ ||v_theta(z_t, t, y, c) - (eps - x)||^2 ],  z_t = (1-t)x + t*eps',
  tex:'\\mathcal{L}_\\theta = \\mathbb{E}_{t\\sim p(t),\\,x,y,c}\\left[\\lVert v_\\theta(z_t, t, y, c) - (\\varepsilon - x)\\rVert_2^2\\right],\\quad z_t=(1-t)x+t\\varepsilon',
  d:'rectified flow-matching 손실. $y=\\varnothing$ 이면 text-to-image, $y\\neq\\varnothing$ 이면 편집/in-context 생성 — 같은 손실 하나로 두 태스크를 함께 학습한다.'},
 {expr:'context position: u_yi = (i, h, w),  target: u_x = (0, h, w)',
  tex:'\\mathbf{u}_{y_i} = (i, h, w),\\quad i=1,\\dots,N \\qquad \\mathbf{u}_x = (0, h, w)',
  d:'3D RoPE의 시간축 $t$ 를 컨텍스트 이미지 번호로 씀으로써, 여러 장의 컨텍스트 이미지도 공간 구조를 유지한 채 타깃과 구분해 넣을 수 있다.'}
],

numbers:[
 {k:'KontextBench 규모', v:'1026쌍 (기반 이미지 108장)', d:'§4.1 — 5개 태스크 범주(국소·전역·CREF·SREF·텍스트 편집) 합계'},
 {k:'속도 우위', v:'경쟁 API 대비 최대 한 자릿수(order of magnitude)', d:'§4.2, Figure 7b — 이미지-투-이미지 지연시간 비교, GPT-Image-1 등 대비'},
 {k:'FLUX-VAE 재구성 품질', v:'PSNR 31.1, SSIM 0.896', d:'Table 1 — SD3-VAE(29.6/0.858) 등 경쟁 VAE 대비 4096 ImageNet 이미지 기준 최고'},
 {k:'text-to-image 지연시간', v:'1024×1024 기준 3~5초', d:'§1 — 기존 diffusion 계열 multi-step 샘플링의 일반적 범위(비교 배경 수치)'},
 {k:'CREF·전역편집·텍스트편집 평가', v:'human eval + AuraFace 임베딩', d:'Figure 8 — [max]/[pro]가 로컬·텍스트 편집·일반 CREF에서 최상위, 전역편집·SREF는 각각 gpt-image-1·Gen-4에 이어 2위'}
],

impact:'생성과 편집을 하나의 흐름 매칭 모델·하나의 시퀀스 결합 방식으로 통합할 수 있음을 보여, 이후 이미지 생성 모델들이 "생성 전용"과 "편집 전용"을 따로 만들 필요가 없다는 설계 선택지를 제시했다. 특히 반복 편집에서의 캐릭터·객체 일관성을 실사용 벤치마크(KontextBench)로 정량화한 것은 이후 편집 모델 평가의 참조점이 되었다.',

legacy:[
 '**시퀀스 결합 방식의 확산** — 채널 결합 대신 토큰 시퀀스에 컨텍스트를 이어붙이는 방식이 이후 통합 생성·편집 모델의 표준 선택지로 자리잡음',
 '[Qwen-Image](#/p/qwen-image) 등 후속 모델들이 비슷한 흐름 매칭 기반 통합 생성·편집 구조를 채택',
 '**실사용 크라우드소싱 벤치마크(KontextBench)** — 국소/전역/참조/텍스트 편집을 함께 재는 벤치마크 설계가 이후 편집 모델 평가에 참조됨'
],

pitfalls:[
 '**"성능이 SOTA"가 아니라 태스크별로 순위가 다르다.** 전역 편집은 gpt-image-1에, 스타일 참조(SREF)는 Gen-4 References에 2위로 밀린다 — CREF·로컬·텍스트 편집에서만 최상위라는 점을 정확히 인용해야 한다.',
 '**반복 편집이 완전히 해결된 것은 아니다.** 논문 스스로 Figure 15에서 6회 반복 편집 후 identity degradation과 화질 열화 사례를 보고한다 — "일관성 문제를 해결했다"가 아니라 "기존보다 견고해졌다"는 주장이다.',
 '**[pro]/[max]/[dev] 세 변형의 평가 범위가 다르다.** [dev]는 image-to-image 태스크만 평가 대상으로 삼았다고 명시돼 있어, text-to-image 비교표에 [dev]를 넣으면 안 된다.'
],

figures:[
 {f:'fig4-architecture.png',
  cap:'왼쪽에서 텍스트 프롬프트와 컨텍스트 이미지(위 "YOU HAD ME AT KONTEXT")가 각각 인코딩된다. Visual Stream 안에서 Noised Latent(타깃, T=0)와 Encoded Input Image(컨텍스트, T=1)가 서로 다른 시간 위치 임베딩을 갖고 같은 흐름으로 들어가, N/2 Double Stream Blocks → N Fused DiT Block을 거쳐 오른쪽 출력("YOU HAD ME AT BEER")이 나온다.',
  src:'원문 Figure 4, p.5'}
],

quotes:[
 {t:'Compared to current editing models that exhibit degradation in character consistency and stability across multiple turns, we observe that FLUX.1 Kontext improved preservation of objects and characters, leading to greater robustness in iterative workflows.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2506.15742 — FLUX.1 Kontext', u:'https://arxiv.org/abs/2506.15742'},
 {t:'Black Forest Labs', u:'https://blackforestlabs.ai/'}
]
});
