WIKI.paper({
slug:'add-turbo',
venue:'arXiv 2023 (Stability AI)',
authors:'Sauer, Lorenz, Blattmann & Rombach (Stability AI)',
arxiv:'2311.17042',

tldr:'적대적 손실과 증류 손실을 함께 써서 [SDXL](#/p/sdxl)을 1~4 스텝만으로 고해상도 이미지를 뽑는 SDXL-Turbo로 만든다. [progressive-distillation](#/p/progressive-distillation) 계열이 겪던 저스텝에서의 블러·아티팩트를 적대적 손실로 없애면서, 반복적 정제(iterative refinement) 능력은 GAN과 달리 그대로 유지한다. 사람 평가에서 ADD-XL(1스텝)이 자신의 교사 SDXL(50스텝)조차 넘어서는 경우가 나온다.',

context:'[progressive-distillation](#/p/progressive-distillation) 이후로도 확산 모델을 4스텝 이하로 줄이면 이미지가 흐려지고 디테일을 잃는 문제가 여전했다. 반대편에는 [StyleGAN](#/p/stylegan)-T 같은 원스텝 GAN들이 있었지만, 대규모 텍스트-이미지 생성으로 스케일업하기가 어렵고 [classifier-free guidance](#/p/cfg) 같은 확산 모델 전용 도구를 쓸 수 없었다. 이 논문은 "왜 둘 중 하나만 골라야 하는가"라는 질문에서 출발한다 — **증류 손실로 사전학습된 지식을 보존하고, 적대적 손실로 저스텝에서의 블러를 없앤다**는 결합을 시도한다.',

ideas:[
 {h:'적대적 손실: 매 forward pass가 진짜 이미지 매니폴드 위에 있어야 한다',
  lead:'판별자를 속이도록 학습시켜, 몇 스텝만 밟아도 사실적인 이미지가 나오게 만든다.',
  d:'ADD-student가 노이즈 낀 입력 $x_s$ 에서 만든 출력 $\\hat x_\\theta(x_s,s)$ 를 사전학습 ViT 특징 위에 얹은 경량 판별자 헤드들이 실제 이미지와 구분하지 못하도록 hinge loss로 학습한다. 이는 기존 증류 방법들이 4스텝 근처에서 보이던 흐릿함·아티팩트를 직접 억제하는 역할을 한다.'},
 {h:'증류 손실: 교사의 디노이징 예측을 재구성 목표로 삼는다',
  lead:'학생의 출력을 다시 노이즈를 씌운 뒤 교사에게 통과시켜 얻은 예측을 정답처럼 회귀한다.',
  d:'학생 출력 $\\hat x_\\theta$ 을 그대로 교사에 넣지 않고, 다시 확산 순방향 과정으로 노이즈를 씌운 $\\hat x_{\\theta,t}$ 를 교사에 통과시켜 얻은 디노이징 예측 $\\hat x_\\psi$ 를 목표로 삼는다(비노이즈 입력은 교사에게 분포 밖이라 직접 넣을 수 없기 때문). 이는 score distillation sampling(SDS)과 특정 가중치 선택 하에서 동치임을 보인다. 이 손실 하나만으로는 성능이 나오지 않고, 적대적 손실과 **함께** 써야 뚜렷한 개선이 나타난다.'},
 {h:'사전학습 가중치에서 시작해 GAN 학습을 안정시킨다',
  lead:'생성기를 무작위 초기화 대신 교사와 같은 확산 UNet 가중치로 시작한다.',
  d:'GAN을 처음부터 학습시키는 대신 ADD-student를 사전학습된 diffusion UNet 가중치로 초기화한다. 무작위 초기화는 FID 293.6이라는 사실상 붕괴된 결과를 내는 반면, 사전학습 초기화는 FID 20.6까지 내려간다 — 적대적 학습의 불안정성을 크게 줄이는 핵심 요인.'},
 {h:'디코더 전용 GAN이 아니라 표준 확산 UNet 구조를 그대로 쓴다',
  lead:'구조를 바꾸지 않았기 때문에 여러 스텝을 이어 붙이는 반복적 정제가 자연스럽게 가능하다.',
  d:'기존 원스텝 GAN들은 디코더 전용 구조를 쓰는 경우가 많아 한 번 생성하면 끝이었다. ADD-student는 표준 diffusion 프레임워크(노이즈 스케줄·UNet)를 그대로 유지해서, 1스텝만 쓸 수도 있고 필요하면 2~4스텝으로 이어 붙여 점진적으로 다듬을 수도 있다 — GAN에는 없던 능력이다.'}
],

diagram:{type:'split', cap:'ADD-student가 받는 두 갈래 손실. 증류 손실만으로는 부족하고 적대적 손실과의 결합이 핵심이다.',
 from:{t:'ADD-student', s:'diffusion UNet 초기화', acc:true},
 branches:[
  {t:'적대적 손실', s:'판별자를 속이도록'},
  {t:'증류 손실', s:'교사 예측을 회귀 (SDS)'}
 ],
 join:'L = L_adv + λ·L_distill,  λ=2.5'
},

math:[
 {expr:'L = L_adv(x̂_θ(x_s,s), φ) + λ · L_distill(x̂_θ(x_s,s), ψ)',
  tex:'L=L_{adv}(\\hat x_\\theta(x_s,s),\\phi)+\\lambda\\,L_{distill}(\\hat x_\\theta(x_s,s),\\psi)',
  d:'전체 학습 목표. $\\phi$ 는 판별자 가중치, $\\psi$ 는 고정된 교사 가중치. $\\lambda=2.5$ 를 전 실험에서 고정.'},
 {expr:'L_distill = E_{t,ε\'}[ c(t) · d( x̂_θ, x̂_ψ(sg(x̂_θ,t); t) ) ]',
  tex:'L_{distill}=\\mathbb{E}_{t,\\epsilon\'}\\big[c(t)\\,d\\big(\\hat x_\\theta,\\;\\hat x_\\psi(\\mathrm{sg}(\\hat x_{\\theta,t});t)\\big)\\big]',
  d:'$\\hat x_{\\theta,t}=\\alpha_t\\hat x_\\theta+\\sigma_t\\epsilon\'$ 는 학생 출력에 다시 노이즈를 씌운 것. $d$ 는 보통 $\\ell_2$ 거리, $c(t)$ 는 노이즈 수준별 가중치(exponential 또는 SDS식). $sg$ 는 stop-gradient로, 교사 쪽으로는 그래디언트가 흐르지 않는다.'}
],

numbers:[
 {k:'ADD-M zero-shot COCO FID (1스텝)', v:'19.7', d:'SD1.5 기반, 0.09초/장(A100) — 같은 비교표의 다른 1스텝 방법(InstaFlow 22.4~23.4, UFOGen 22.5)보다 우수'},
 {k:'ADD-XL vs SDXL-Base, 4스텝', v:'사람 선호도 우세', d:'교사 SDXL(50스텝, refiner 미포함)을 다수 비교에서 앞섬'},
 {k:'ADD-XL vs LCM-XL, 1 vs 4스텝', v:'ADD-XL 우세', d:'ADD-XL 1스텝이 LCM-XL 4스텝을 사람 평가에서 능가'},
 {k:'사전학습 초기화 효과', v:'FID 293.6 → 20.6', d:'무작위 초기화 대비 사전학습 diffusion 가중치로 시작했을 때 (표 1c)'},
 {k:'distillation weighting factor', v:'λ = 2.5', d:'모든 실험에서 고정한 증류 손실 가중치'}
],

impact:'"few-step 생성은 증류 아니면 GAN 둘 중 하나"라는 이분법을 깨고 두 손실을 결합하는 것이 표준 레시피가 되게 만들었다. SDXL-Turbo로 공개되어 실시간에 가까운 텍스트-이미지 생성을 대중적으로 체감시켰고, 이후 [LCM](#/p/lcm) 계열과 함께 few-step 이미지·비디오 생성 연구의 두 축 중 하나로 자리잡았다.',

legacy:[
 '[progressive-distillation](#/p/progressive-distillation) — 순수 증류만으로 스텝을 줄이는 접근에 적대적 손실을 더해 저스텝 블러 문제를 정면 돌파',
 '[LCM](#/p/lcm) — consistency 증류 기반의 또 다른 few-step 경로와 나란히 실무 표준으로 정착',
 'SDXL-Turbo로 공개되어 실시간 이미지 생성·인터랙티브 생성 도구의 대중화를 이끔'
],

pitfalls:[
 '**증류 손실만으로는 이 결과가 안 나온다.** 논문의 ablation에서 distillation loss 단독은 효과가 미미하고, 적대적 손실과 결합해야 뚜렷한 개선이 보인다.',
 '**"교사보다 학생이 항상 못하다"는 가정이 깨진다.** ADD-XL(1스텝)이 여러 비교에서 교사 SDXL(50스텝)을 사람 선호도로 앞선다 — 스텝 수와 품질이 단순 비례하지 않는다.',
 '**classifier-free guidance를 추론에서 쓰지 않는다.** 메모리·연산을 아끼기 위한 설계 선택이며, 이 때문에 일부 조건부 제어 방식이 원래의 [SDXL](#/p/sdxl) 파이프라인과 다르게 동작할 수 있다.'
],

figures:[
 {f:'fig2-add-architecture.png',
  cap:'ADD-student(파랑, θ)는 노이즈 낀 입력 x_s를 받아 두 목표를 동시에 학습한다. 위쪽: 생성 결과를 판별자 φ가 real/fake로 판정하는 적대적 손실. 아래쪽: 결과에 다시 노이즈를 씌운 뒤 DM-teacher(초록, ψ, 고정)에 통과시켜 얻은 예측과의 거리 c(t)d(·,·)를 재는 증류 손실(stop-grad로 교사는 갱신되지 않음).',
  src:'원문 Figure 2, p.2'}
],

links:[
 {t:'arXiv 2311.17042 — Adversarial Diffusion Distillation', u:'https://arxiv.org/abs/2311.17042'}
]
});
