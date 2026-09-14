WIKI.paper({
slug:'repa',
venue:'ICLR 2025',
authors:'Yu, Kwak, Jang, Jeong, Huang, Shin, Xie (KAIST · Korea Univ. · Scaled Foundations · NYU)',
arxiv:'2410.06940',

tldr:'확산 트랜스포머([DiT](#/p/dit)/[SiT](#/p/flow-matching))의 중간 층 hidden state를 [DINOv2](#/p/dinov2) 같은 사전학습 표현에 정렬시키는 것만으로 학습 속도가 **17.5배** 빨라진다는 것을 보인 논문. 진단은 단순하다 — 확산 모델이 느린 이유는 노이즈 제거 자체가 아니라, **좋은 내부 표현을 처음부터 스스로 배워야 하기 때문**이다.',

context:'[DiT](#/p/dit) 계열은 노이즈 낀 latent $z_t$ 를 받아 깨끗한 신호(또는 속도)를 예측하도록 학습된다. 이 과정에서 모델은 부산물로 "무엇이 고양이이고 무엇이 배경인지" 같은 의미론적 표현도 배운다는 것이 알려져 있었다. 문제는 이 표현이 [DINOv2](#/p/dinov2) 같은 자기지도학습 인코더가 곧장 만들어내는 표현보다 **훨씬 느리고 약하게** 형성된다는 점이다 — 같은 SiT-XL/2를 7M 스텝 학습해도 DINOv2와의 정렬도(CKNNA 기준)는 낮은 수준에 머문다. 즉 확산 모델의 학습 곡선 대부분은 "노이즈를 지우는 법"이 아니라 "이미지를 이해하는 법"을 처음부터 재발명하는 데 쓰이고 있었다. 질문은 단순하다 — **이미 존재하는 좋은 표현을 그냥 가져다 쓰면 안 되는가?**',

ideas:[
 {h:'표현 정렬(REPA): 중간 층을 외부 인코더에 맞춘다',
  lead:'DiT 중간 층의 노이즈 낀 hidden state를 clean 이미지의 DINOv2 표현에 직접 정렬한다.',
  d:'DiT/SiT의 특정 중간 층 출력 $h_t=f_\\theta(z_t)$ 에 작은 MLP projection head $h_\\phi$ 를 붙여, 사전학습된 인코더 $f$ 가 **깨끗한 원본 이미지** $x^*$ 에서 뽑은 표현 $y^*=f(x^*)$ 와 패치 단위 유사도를 최대화한다. 노이즈 낀 입력에서 나온 표현을 깨끗한 이미지의 표현에 맞춘다는 점이 핵심 — 모델이 "이 노이즈 낀 패치가 원래 무엇이었는지"를 명시적으로 배우게 강제한다.'},
 {h:'손실은 그냥 한 항을 더하는 것',
  lead:'기존 디노이징 손실에 정렬 손실을 가중합으로 더하기만 하면 된다.',
  d:'아키텍처를 바꾸지 않는다. 기존 diffusion/flow-matching 손실 $L_{velocity}$ 에 $\\lambda L_{REPA}$ 를 더한 것이 전부이고, $\\lambda$ 는 두 손실의 비중을 조절하는 하이퍼파라미터 하나뿐이다. projection head는 학습이 끝나면 버리고 원래 backbone만 추론에 쓴다 — 추론 비용이 전혀 늘지 않는다.'},
 {h:'표현이 좋아지면 생성이 좋아진다는 상관관계',
  lead:'DINOv2와의 정렬도가 높을수록 FID가 낮아지는 경향을 직접 측정으로 보인다.',
  d:'논문은 인코더 선택(DINOv2 vs MoCov3 vs CLIP 등)과 정렬 강도를 바꿔가며 정렬도(CKNNA)와 최종 FID의 상관관계를 측정한다. 더 강하게, 더 잘 정렬될수록 생성 품질도 함께 좋아지는 경향이 일관되게 나타나, "좋은 표현이 좋은 생성의 전제조건"이라는 진단을 뒷받침한다.'},
 {h:'외부 지도는 학습 초반에만 필요하다',
  lead:'표현이 충분히 자리잡으면 정렬 손실의 역할이 줄어 순수 디노이징만으로도 이어진다.',
  d:'REPA는 표현 학습을 "대신 해주는" 것이 아니라 **부트스트랩**해주는 역할에 가깝다. 초반에 좋은 표현으로 방향을 잡아주면, 이후 디노이징 목적함수 자체가 그 표현을 계속 다듬어 나가면서 정렬도가 학습이 진행될수록 함께 올라간다.'}
],

diagram:{type:'flow', cap:'REPA 학습 파이프라인. 정렬 손실은 학습에만 관여하고 추론 시 projection head는 버려진다.',
 nodes:[
  {t:'노이즈 latent', s:'z_t'},
  {t:'DiT/SiT 블록들', s:'중간 층까지'},
  {t:'Projection MLP', a:'h_φ', acc:true},
  {t:'DINOv2 표현과 정렬', s:'y* = f(x*)', note:'clean 이미지 기준'}
 ]},

math:[
 {expr:'L_REPA(θ,φ) := -E[ (1/N) Σ_n sim(y*[n], h_φ(h_t)[n]) ]',
  tex:'L_{REPA}(\\theta,\\phi) := -\\mathbb{E}_{x^*,\\epsilon,t}\\left[\\frac{1}{N}\\sum_{n=1}^{N}\\text{sim}\\big(y_*^{[n]},\\, h_\\phi(h_t)^{[n]}\\big)\\right]',
  d:'패치 $n$ 마다 사전학습 표현 $y_*^{[n]}$ 과 diffusion 모델의 (projection을 거친) hidden state를 코사인 유사도 같은 $\\text{sim}(\\cdot,\\cdot)$ 로 맞춘다. $N$ 은 패치 개수.'},
 {expr:'L := L_velocity + λ·L_REPA',
  tex:'L := L_{velocity} + \\lambda L_{REPA}',
  d:'원래의 diffusion/flow-matching 학습 목적함수에 REPA 항을 가중합으로 더한다. 아키텍처·추론 절차는 그대로이고 학습 손실 한 줄만 바뀐다.'}
],

numbers:[
 {k:'수렴 속도 · SiT-XL/2', v:'17.5배', d:'REPA 적용 SiT-XL/2가 400K 스텝에 도달하는 FID를, 원본 SiT-XL/2는 7M 스텝을 써야 도달 (classifier-free guidance 없이, ImageNet 256×256)'},
 {k:'최종 FID · ImageNet 256²', v:'1.42', d:'classifier-free guidance + guidance interval 적용, SiT-XL/2+REPA 기준'},
 {k:'학습 반복 절감 · ImageNet 512²', v:'3배 이상', d:'같은 FID/sFID/IS/Precision 도달에 필요한 학습 반복 수 비교 (부록 실험)'},
 {k:'표현 정렬도(CKNNA) 격차', v:'SiT 7M 스텝도 낮음', d:'DINOv2-g 기준, SiT-XL/2를 7M 스텝 학습해도 CKNNA 절대값이 다른 자기지도 인코더 대비 낮게 유지됨(그림 2b)'}
],

impact:'"확산 모델이 왜 느린가"라는 질문의 답을 **아키텍처나 샘플러가 아니라 표현 학습**에서 찾았다는 점이 핵심이다. 이 진단은 이후 생성 모델 설계에서 사전학습 표현을 적극적으로 끌어오는 흐름(예: [SANA](#/p/sana) 등 후속 연구가 표현·압축 설계를 함께 다루는 방향)에 영향을 줬고, 표현 정렬을 diffusion 학습의 표준 정규화 기법 중 하나로 자리잡게 했다. 동시에 "생성과 이해(표현학습)는 결국 같은 문제의 두 얼굴"이라는 관점을 강화했다.',

legacy:[
 '**표현 정렬을 diffusion 학습의 표준 부품으로 편입** — 이후 여러 text-to-image/video 모델이 학습 초반 표현 정렬 손실을 보조 손실로 채택',
 '**"확산 모델 = 나쁜 표현학습기"라는 통념 반박의 연장선** — 확산 모델도 좋은 표현을 배울 수 있으나 그것을 빠르게 만드는 것이 관건임을 수치로 입증',
 '**생성 속도 개선 계열과의 결합** — REPA의 학습 가속은 [증류로 추론 스텝을 줄이는](#/p/progressive-distillation) 접근과 직교한다 — 이쪽은 "학습을 몇 배 빠르게", 저쪽은 "추론을 몇 스텝으로"의 문제라 함께 쓸 수 있다',
 '**후속 연구의 표준 베이스라인화** — SiT/DiT 기반 논문들이 REPA 유무를 ablation 항목으로 삼는 관행이 자리잡음'
],

pitfalls:[
 '**"표현이 좋아지면 자동으로 FID가 좋아진다"는 인과관계가 아니라 상관관계다.** 논문은 여러 인코더·정렬 강도에서 일관된 경향을 보이지만, 정렬 자체가 생성 품질의 충분조건이라는 엄밀한 증명은 아니다.',
 '**17.5배는 "같은 FID에 도달하는 스텝 수" 비교이지, 최종 성능 상한이 그만큼 오른다는 뜻이 아니다.** 최종 SOTA FID(1.42)는 guidance 등 추가 기법을 더한 값이다.',
 '**projection head와 정렬 대상 층 선택이 결과에 큰 영향을 준다.** 논문은 어느 중간 층을 정렬할지, 어떤 사전학습 인코더를 쓸지에 대한 ablation을 함께 제시하며, 아무 층이나 정렬해도 같은 효과가 나는 것은 아니다.'
],

figures:[
 {f:'fig1-repa-speedup.png',
  cap:'왼쪽: REPA 구조 — DiT/SiT 블록의 중간 출력을 MLP로 투영해 사전학습 visual encoder의 표현과 정렬한다. 오른쪽: FID-50K 대 학습 반복 곡선에서 SiT-XL/2+REPA(빨강)가 원본 SiT-XL/2(파랑)와 같은 FID에 400K 스텝 만에 도달한다 — 원본은 7M 스텝이 필요해 화살표로 "17.5x faster"라고 표시했다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'We argue that one main bottleneck in training large-scale diffusion models for generation lies in effectively learning these representations.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2410.06940 — Representation Alignment for Generation', u:'https://arxiv.org/abs/2410.06940'},
 {t:'프로젝트 페이지', u:'https://sihyun.me/REPA'}
]
});
