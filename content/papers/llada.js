WIKI.paper({
slug:'llada',
venue:'NeurIPS 2025',
authors:'Nie, Zhu, You et al. (Renmin University of China · Ant Group)',
arxiv:'2502.09992',

tldr:'다음 토큰 예측이 아니라 **[BERT](#/p/bert)식 마스크 예측을 반복**해 문장 전체를 동시에 다듬는 8B 파라미터 언어모델. 자기회귀([Transformer](#/p/transformer) decoder) 없이도 처음부터 사전학습한 확산 모델이 LLaMA3 8B와 맞먹는 zero/few-shot 성능을 낸다는 것을 보였다.',

context:'현재 거의 모든 대형 언어모델은 왼쪽에서 오른쪽으로 한 토큰씩 생성하는 자기회귀(autoregressive) 방식이다. 이 논문은 스케일링·문맥 학습·지시 따르기 같은 LLM의 핵심 능력이 정말로 "다음 토큰 예측"이라는 형식 자체에 묶여 있는지 묻는다. 저자들의 주장은, 이런 능력들이 사실 **최대우도 기반 생성 모델링 원리**에서 나오는 것이지 자기회귀라는 특정 인수분해 방식 때문이 아니라는 것이다. 근거로 자기회귀의 고유한 약점 하나를 든다 — 왼쪽→오른쪽 생성 때문에 "A는 B이다"를 배워도 "B는 A이다"를 못 끌어내는 **역전 저주(reversal curse)**. [DDPM](#/p/ddpm) 같은 확산 모델은 이미지에서 이런 방향성 없이 전체를 동시에 다듬는 방식으로 성공했으니, 언어에도 같은 원리가 통할 수 있다는 것이 LLaDA의 출발점이다.',

ideas:[
 {h:'마스크 비율이 확률변수인 확산 과정',
  lead:'BERT의 고정 15% 마스킹과 달리, 매 학습 스텝마다 마스크 비율 t를 [0,1]에서 무작위로 뽑는다.',
  d:'forward process는 각 토큰을 확률 $t$로 독립적으로 마스킹해 $t=1$에서 완전히 마스킹된 시퀀스를 만든다. [BERT](#/p/bert)의 마스크 예측(MLM)과 형태는 같지만 결정적 차이가 있다 — BERT는 항상 약 15%만 가리는 **고정 비율**이라 마스크 언어모델링이지 생성 모델이 아니고, LLaDA는 $t$를 매번 다르게 뽑아 $t=1$(전부 마스킹)까지 포괄하기 때문에 이 손실이 실제로 음의 로그우도의 상한(변분 하한)이 되어 **원칙 있는 생성 모델**이 된다.'},
 {h:'reverse process: 반복적으로 전부를 동시에 채운다',
  lead:'완전히 마스킹된 시퀀스에서 시작해, 매 스텝 모든 마스크 토큰을 동시에 예측하고 확신도 낮은 것만 다시 마스킹한다.',
  d:'생성은 $t=1$(전부 마스크)에서 $t=0$(전부 확정)까지 여러 스텝에 걸쳐 진행된다. 각 중간 스텝에서 mask predictor가 남은 마스크 위치를 **한 번에 모두** 예측하고, 그중 확신도가 낮은 토큰들만 다시 마스킹(remasking)해 다음 스텝에서 재추정한다. 이 저확신 리마스킹 전략이 무작위 리마스킹보다 일관되게 좋았다.'},
 {h:'Transformer는 그대로 두고 attention mask만 없앤다',
  lead:'디코더 구조 자체는 표준 Transformer이지만 causal mask를 제거해 양방향 의존성을 허용한다.',
  d:'LLaDA의 mask predictor는 [Transformer](#/p/transformer) 인코더에 가깝다 — causal mask가 없어 모든 토큰이 서로를 양방향으로 참조할 수 있다. 이는 아키텍처 차원의 새 발명이 아니라, GPT류가 쓰는 causal mask를 걷어내고 학습 목적함수를 자기회귀 NLL 대신 확산 손실로 바꾼 것에 가깝다 — 그 대가로 KV 캐시라는 자기회귀의 핵심 추론 최적화를 쓸 수 없게 된다.'}
],

diagram:{type:'loop', cap:'완전히 마스킹된 시퀀스에서 시작해, 예측→저확신 리마스킹을 반복하며 t=1에서 t=0으로 진행한다.',
 center:'전부 예측 후 저확신 토큰만 재마스킹',
 nodes:[
  {t:'t=1: 전부 마스크'},
  {t:'Mask Predictor', s:'모든 마스크 동시 예측', acc:true},
  {t:'저확신 토큰 리마스킹'},
  {t:'t=0: 전부 확정'}
 ]},

math:[
 {expr:'L(θ) = -E[ (1/t) Σ 1[x_t^i = MASK] log p_θ(x_0^i | x_t) ]',
  tex:'\\mathcal{L}(\\theta) \\triangleq -\\mathbb{E}_{t,x_0,x_t}\\!\\left[\\frac{1}{t}\\sum_{i=1}^{L}\\mathbf{1}[x_t^i=\\mathrm{M}]\\,\\log p_\\theta(x_0^i \\mid x_t)\\right]',
  d:'마스크된 위치에서만 교차엔트로피를 계산하고 $1/t$ 로 나눈다. $t$ 를 $[0,1]$ 균등분포에서 뽑는다는 점이 BERT의 고정 마스크 비율과의 결정적 차이 — 이 손실이 음의 로그우도의 상한이 된다.'},
 {expr:'-E[log p_θ(x_0)] ≤ L(θ)',
  tex:'-\\mathbb{E}_{p_{\\text{data}}(x_0)}[\\log p_\\theta(x_0)] \\le \\mathcal{L}(\\theta)',
  d:'식(3)의 손실이 데이터 로그우도의 변분 상한임을 보이는 부등식. [DDPM](#/p/ddpm)의 ELBO와 같은 구조로, LLaDA를 "그럴듯한 휴리스틱"이 아니라 원칙 있는 우도 기반 생성모델로 만든다.'}
],

numbers:[
 {k:'모델 규모 · 학습', v:'8B 파라미터, 2.3조 토큰, 0.13M H800 GPU시간', d:'같은 데이터로 학습한 자체 ARM 베이스라인과 직접 비교'},
 {k:'MMLU (5-shot)', v:'LLaDA 65.9 vs LLaMA3 8B 65.4 vs LLaMA2 7B 45.9', d:'ARM과 대등, 같은 세대 최고 모델과 거의 동일'},
 {k:'GSM8K (4-shot)', v:'LLaDA 70.3 vs LLaMA3 8B 48.7', d:'수학 추론에서는 LLaDA가 오히려 크게 앞섬'},
 {k:'BBH (3-shot)', v:'LLaDA 49.7 vs LLaMA3 8B 62.1', d:'복잡한 추론 벤치마크에서는 뒤처지는 항목도 있음'},
 {k:'역전 저주 (시 완성, forward/reversal)', v:'LLaDA-8B 51.8/45.6 vs GPT-4o 82.7/34.3', d:'forward는 GPT-4o가 우세하지만 reversal은 LLaDA가 GPT-4o를 앞섬 — 방향에 따른 격차가 훨씬 작음'},
 {k:'추론 구조상 제약', v:'KV 캐시 미사용 (논문에 명시)', d:'매 스텝 전체 시퀀스를 다시 처리 — 자기회귀 대비 스텝당 비용이 다름'}
],

impact:'LLaDA는 "다음 토큰 예측"이 LLM 능력의 필수조건이 아니라 최대우도 생성 모델링의 여러 구현 중 하나일 뿐임을 8B 규모에서 처음 실증했다. 마스크 예측이라는 [BERT](#/p/bert)의 오래된 목적함수를 마스크 비율을 확률변수로 바꿔 원칙 있는 생성모델로 승격시킨 것이 핵심 전환이다. 역전 저주에서 GPT-4o를 능가한 결과는, 양방향성이 특정 실패 모드(방향 의존적 추론)를 구조적으로 없앨 수 있음을 보여준다.',

legacy:[
 '"자기회귀가 유일한 스케일링 가능 경로"라는 가정에 실증적 반례를 제공 — 이후 확산 기반 언어모델 연구(예: block diffusion 계열)의 참조점이 됨',
 '[BERT](#/p/bert)식 마스크 예측과 [DDPM](#/p/ddpm)식 반복 정제를 하나의 목적함수(변분 상한)로 통합한 것이 후속 마스크 확산 모델(MDM) 연구의 공통 틀이 됨',
 '역전 저주 완화 결과가, 양방향 의존성이 특정 추론 실패를 구조적으로 줄일 수 있다는 근거로 이후 아키텍처 논의에 인용',
 '저자들 스스로 강화학습 정렬·전용 attention/위치인코딩·KV 캐시 등 시스템 최적화가 전혀 없다는 한계를 명시 — 이 지점들이 후속 연구의 여지로 남음'
],

pitfalls:[
 '**"확산 모델"이지만 이미지 확산([DDPM](#/p/ddpm))과 노이즈의 성격이 다르다.** 연속 공간의 가우시안 노이즈가 아니라 이산 토큰의 마스킹이 "노이즈"다 — 수학적으로는 이산 상태 확산(masked diffusion) 계열에 속한다.',
 '**병렬 생성이 곧 더 빠른 생성을 의미하지 않는다.** 매 확산 스텝마다 전체 시퀀스에 대해 forward pass를 다시 돌려야 하고 KV 캐시를 쓸 수 없어서, 스텝 수가 많으면 오히려 자기회귀보다 느릴 수 있다 — 저자들도 시스템 최적화가 안 됐음을 명시했다.',
 '**BBH·ARC-C·HellaSwag·MBPP 등 일부 과제에서는 LLaMA3 8B에 못 미친다.** "LLaMA3와 경쟁력 있다"는 전 과제 우위가 아니라 평균적·부분적 대등함을 뜻한다.'
],

figures:[
 {f:'fig2-overview.png', cap:'왼쪽(a) 사전학습: 마스크 비율 t를 매번 무작위로 뽑아 토큰을 가리고 Mask predictor가 복원. 가운데(b) SFT: 응답(response) 토큰만 마스킹 대상. 오른쪽(c) 샘플링: t=1(전부 마스크)에서 t=0까지, 각 중간 스텝에서 예측 후 확신도 낮은 토큰만 다시 마스킹(Remask)하며 점진적으로 확정한다.', src:'원문 Figure 2, p.3'},
 {f:'fig1-radar.png', cap:'8개 축(General Tasks·Math·Code·Chinese 등) 각각의 zero/few-shot 점수를 방사형으로 비교. 빨강(LLaDA 8B Base)이 보라(LLaMA3 8B Base)와 거의 겹치는 축이 많고, 파랑(LLaMA2 7B Base)보다는 전 축에서 확실히 크다 — "LLaMA2보다 우위, LLaMA3와 대등"이라는 주장을 한눈에 보여준다.', src:'원문 Figure 1(좌), p.2'}
],

quotes:[
 {t:'The capabilities of large language models (LLMs) are widely regarded as relying on autoregressive models (ARMs). We challenge this notion by introducing LLaDA, a diffusion model trained from scratch under the pre-training and supervised fine-tuning (SFT) paradigm.', src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2502.09992 — Large Language Diffusion Models', u:'https://arxiv.org/abs/2502.09992'},
 {t:'프로젝트 페이지 (데모)', u:'https://ml-gsai.github.io/LLaDA-demo/'}
]
});
