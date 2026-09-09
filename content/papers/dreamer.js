WIKI.paper({
slug:'dreamer',
venue:'ICLR 2020',
authors:'Hafner et al. (Google Brain · University of Toronto · DeepMind)',
arxiv:'1912.01603',

tldr:'[World Models](#/p/world-models)처럼 잠재 공간에서 미래를 상상해 정책을 학습시키되, 진화전략 대신 **가치 함수의 그래디언트를 잠재 동역학을 통해 직접 역전파**해 학습 효율을 크게 끌어올린 논문. 20개 시각 제어 과제에서 온라인 계획 기반 [PlaNet](#/p/muzero)과 경험재생 기반 model-free 방법을 모두 능가했다.',

context:'[World Models](#/p/world-models)는 잠재 공간에서 상상으로 정책을 훈련할 수 있다는 것을 보였지만, 컨트롤러 학습에 그래디언트 없는 진화전략([CMA-ES](#/p/world-models))을 썼다. PlaNet은 같은 잠재 동역학 모델로 매 스텝 온라인 계획(planning)을 해 행동을 고르지만, 계획에는 큰 연산 비용이 들고 유한한 상상 지평(imagination horizon) 안의 보상만 고려해 근시안적인 행동을 낳는다. 한편 D4PG·SAC 같은 model-free 방법은 세계 모델 없이 방대한 환경 상호작용(D4PG는 $10^9$ 스텝)으로 성능을 얻는다. 질문은 이렇다 — 신경망 동역학 모델은 이미 미분 가능한데, 왜 그래디언트를 버리고 진화전략이나 계획으로 되돌아가는가?',

ideas:[
 {h:'가치의 그래디언트를 동역학을 통해 역전파한다',
  lead:'상상된 궤적에서 가치를 계산하고, 그 값의 그래디언트를 정책까지 직접 흘려보낸다.',
  d:'상상된 상태 $s_\\tau$ 에서 예측된 보상과 가치는 모두 신경망 함수이므로, 가치 추정치 $V_\\lambda(s_\\tau)$ 를 행동 $a_\\tau$ 에 대해 미분할 수 있다. Dreamer는 이 해석적(analytic) 그래디언트를 재파라미터화(reparameterization)로 계산해 정책을 직접 업데이트한다. 진화전략처럼 수많은 샘플로 그래디언트를 추정할 필요가 없어 표본 효율이 크게 오른다.'},
 {h:'유한 지평 너머까지 보는 λ-리턴',
  lead:'상상 지평 H 끝에서 가치로 부트스트랩해 근시안 문제를 완화한다.',
  d:'PlaNet처럼 딱 H 스텝만 보고 멈추면 그 이후의 보상을 완전히 무시하는 근시안적 정책이 나온다. Dreamer는 [TD(λ)](#/p/dqn) 스타일의 λ-리턴으로 여러 길이의 부트스트랩 추정을 가중평균해, H 이후의 보상을 가치 함수가 대신 요약하게 만든다. 그 결과 상상 지평의 길이에 상대적으로 둔감해진다.'},
 {h:'세 단계 루프: 동역학 학습 · 행동 학습 · 환경 상호작용',
  lead:'세계 모델은 실제 경험으로, 정책·가치는 그 세계 모델 속 상상만으로 학습한다.',
  d:'(a) 과거 경험 데이터셋으로 잠재 동역학(표현·전이·보상 모델)을 재구성 손실로 학습하고, (b) 그 잠재공간에서 뽑은 궤적 위에서 정책·가치를 그래디언트로 학습하고, (c) 학습된 정책을 실제 환경에서 실행해 데이터를 더 모은다. 정책·가치 학습(b) 단계에서는 실제 환경과 전혀 상호작용하지 않는다는 것이 핵심이다.'},
 {h:'표현 학습 목표는 갈아끼울 수 있는 부품이다',
  lead:'재구성·보상예측·contrastive 세 가지 표현학습을 비교해 재구성이 대체로 가장 강함을 확인.',
  d:'세계 모델이 이미지 재구성 대신 보상만 예측하거나 대조학습(contrastive)으로 훈련되어도 Dreamer의 행동학습 알고리즘 자체는 그대로 쓸 수 있다. 실험 결과 재구성이 대부분의 과제에서 가장 좋았고, 보상 예측만으로는 대부분 과제를 풀지 못해 표현학습이 여전히 병목임을 보였다.'}
],

diagram:{type:'loop', cap:'동역학 학습 → 잠재공간 상상 속 행동학습 → 실제 환경 실행이 반복된다. 정책·가치 갱신은 오직 (b) 상상 단계에서만 일어난다.', center:'반복 루프',
 nodes:[
  {t:'경험 데이터셋', s:'과거 (o,a,r)'},
  {t:'잠재 동역학 학습', s:'재구성 손실'},
  {t:'상상 속 행동학습', s:'가치 그래디언트 역전파', acc:true},
  {t:'환경에서 실행', s:'정책으로 데이터 수집'}
 ]},

math:[
 {tex:'\\max_{\\phi}\\ \\mathbb{E}_{q_\\theta,q_\\phi}\\!\\left(\\sum_{\\tau=t}^{t+H} V_\\lambda(s_\\tau)\\right)',
  expr:'max_φ E[ Σ_{τ=t..t+H} V_λ(s_τ) ]',
  d:'정책(행동 모델) $q_\\phi$ 의 목적함수. 상상된 궤적 전체에서 λ-리턴 가치 추정치의 합을 최대화하도록 파라미터 $\\phi$ 를 그래디언트로 직접 갱신한다.'},
 {tex:'\\min_{\\psi}\\ \\mathbb{E}_{q_\\theta,q_\\phi}\\!\\left(\\sum_{\\tau=t}^{t+H} \\tfrac{1}{2}\\big\\|v_\\psi(s_\\tau) - V_\\lambda(s_\\tau)\\big\\|^{2}\\right)',
  expr:'min_ψ E[ Σ (1/2)||v_ψ(s_τ) − V_λ(s_τ)||² ]',
  d:'가치 모델 $v_\\psi$ 는 자신이 만든 λ-리턴 타깃을 회귀하도록 학습된다(타깃에는 그래디언트를 흘리지 않음). 정책과 가치가 서로의 출력을 주고받으며 액터-크리틱처럼 번갈아 갱신된다.'}
],

numbers:[
 {k:'20개 과제 평균 점수(5×10⁶ 스텝)', v:'823', d:'DeepMind Control Suite 시각 제어 과제 평균'},
 {k:'PlaNet 평균 점수(동일 스텝)', v:'332', d:'같은 잠재 동역학, 온라인 계획으로 행동 선택'},
 {k:'D4PG 평균 점수', v:'786', d:'$10^8$ 스텝(20배 더 많은 환경 상호작용) 소요'},
 {k:'A3C 평균 점수', v:'244', d:'proprioceptive 입력, $10^9$ 스텝'},
 {k:'학습 시간 · Dreamer', v:'약 3시간 / 10⁶ 스텝', d:'V100 GPU 1개 + CPU 10코어 기준'},
 {k:'학습 시간 · PlaNet / D4PG', v:'11시간 / 24시간', d:'비슷한 성능에 도달하는 데 필요한 시간(같은 스텝 기준 아님)'}
],

impact:'World Models 이후 "잠재 공간에서 상상하며 학습"하는 흐름을 그래디언트 기반으로 완전히 재정식화해, 세계 모델 기반 강화학습이 model-free 방법과 표본 효율에서 실질적으로 경쟁할 수 있음을 보였다. 특히 정책·가치 학습을 환경과의 상호작용에서 완전히 분리해, 세계 모델만 정확하면 상상 속 훈련량을 사실상 무제한으로 늘릴 수 있다는 실용적 이점을 확립했다. 이후 DreamerV2·DreamerV3로 이어지며 Atari, Minecraft 등으로 스케일이 확장된다.',

legacy:[
 '**DreamerV2 · DreamerV3** — 같은 액터-크리틱-잠재상상 구조를 이산 잠재변수, 더 큰 스케일, 더 다양한 도메인(Atari, Minecraft, 로봇)으로 확장',
 '**[MuZero](#/p/muzero)** 계열과의 대비 — MuZero는 세계 모델을 가치·보상 예측에 맞춰 학습하고 계획으로 행동을 고르는 반면, Dreamer는 재구성 기반 모델과 그래디언트 기반 정책을 고수하며 서로 다른 두 축의 세계모델 RL 계보를 형성',
 '**해석적 가치 그래디언트의 재조명** — DDPG·SAC류의 1-step 그래디언트를 다단계 상상 궤적으로 확장하는 후속 연구들의 참조점이 됨',
 '**표현학습 목표를 갈아끼우는 실험 설계** — 세계 모델의 학습 목표(재구성/보상예측/contrastive)와 행동학습 알고리즘을 분리해 비교하는 방법론이 이후 world-model 논문들의 표준 ablation이 됨'
],

pitfalls:[
 '**"모델이 없어도 된다"가 아니라 "모델이 있으면 계획이 필요 없다"는 주장이다.** Dreamer는 세계 모델을 계획이 아니라 정책 학습의 그래디언트 소스로만 쓴다 — 추론(실행) 시점에는 학습된 정책을 그냥 실행할 뿐 온라인 계획을 하지 않는다.',
 '**λ-리턴이 상상 지평 H를 완전히 없애주진 않는다.** H가 지나치게 짧으면 여전히 정보가 부족하고, 논문은 H=15(연속 제어) 같은 구체적인 값을 튜닝해 사용한다.',
 '**표현학습이 재구성에 크게 의존한다.** 보상 예측만으로 세계 모델을 학습하면 대부분의 과제에서 실패했다 — "좋은 잠재표현은 저절로 나온다"고 가정할 수 없다는 반증이기도 하다.'
],

figures:[
 {f:'fig3-components.png',
  cap:'(a) 과거 경험으로 인코더·전이모델을 학습(재구성은 학습 신호로만 사용). (b) 상상 속에서 가치(트로피)와 행동을 예측하며 그 그래디언트를 동역학을 통해 역전파. (c) 학습된 정책으로 실제 환경에서 행동 — 이 단계에서는 그래디언트가 흐르지 않는다.',
  src:'원문 Figure 3, p.3'},
 {f:'fig7-results.png',
  cap:'8개 과제에서 Dreamer(파랑)가 대부분 PlaNet(보라)·"가치 없이 상상 보상만 최적화"(초록)보다 빠르고 높게 수렴한다. Walker Run처럼 장기 신용할당이 덜 중요한 과제에서는 격차가 좁혀진다.',
  src:'원문 Figure 7, p.7'}
],

quotes:[
 {t:'We present Dreamer, a reinforcement learning agent that solves long-horizon tasks from images purely by latent imagination.',
  src:'Abstract, p.1'},
 {t:'The values optimize Bellman consistency for imagined rewards and the policy maximizes the values by propagating their analytic gradients back through the dynamics.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 1912.01603 — Dream to Control', u:'https://arxiv.org/abs/1912.01603'},
 {t:'danijar.com/dreamer (코드·영상)', u:'https://danijar.com/dreamer'}
]
});
