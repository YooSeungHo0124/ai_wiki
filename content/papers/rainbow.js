WIKI.paper({
slug:'rainbow',
venue:'AAAI 2018',
authors:'Hessel et al. (DeepMind)',
arxiv:'1710.02298',

tldr:'2015~2017년 사이 [DQN](#/p/dqn)에 제안된 여섯 가지 개선안을 한 에이전트에 모두 합치고, 각각을 하나씩 빼는 ablation으로 "무엇이 실제로 기여하는가"를 실험으로 밝힌 논문. 새 아이디어는 없지만, 서로 다른 저자가 서로 다른 문제를 겨냥해 만든 개선이 실제로 합쳐지는지를 처음으로 검증했다.',

context:'[DQN](#/p/dqn) 이후 몇 년간 Double DQN(과대추정 편향), Prioritized Replay(리플레이 효율), Dueling 구조(가치·이점 분리), Multi-step 학습(부트스트랩 편향-분산 트레이드오프), Distributional RL(기대값 대신 분포 학습), Noisy Nets(탐험을 파라미터 노이즈로 대체)까지 최소 여섯 개의 독립적인 개선안이 각자 논문 하나씩으로 발표됐다. 문제는 이들이 **서로 다른 병목을 겨냥**했다는 점이다 — 어떤 것은 안정성을, 어떤 것은 표본 효율을, 어떤 것은 탐험을 고친다. 일부(Prioritized DDQN, Dueling DDQN)는 이미 둘씩 조합되어 있었지만, 여섯 개를 전부 한 에이전트에 넣어도 서로 상쇄되지 않고 보완적으로 작동하는지는 아무도 확인하지 않았다.',

ideas:[
 {h:'여섯 개를 그대로 이어붙인다',
  lead:'Double + Prioritized + Dueling + Multi-step + Distributional + Noisy를 한 네트워크에 결합.',
  d:'각 구성요소는 손실 함수나 네트워크 구조의 서로 다른 부분을 건드리기 때문에 원칙적으로 충돌하지 않는다. Double Q-learning은 타깃 계산에, Dueling은 출력층 분기에, Noisy Nets는 선형층 대체에, Distributional은 손실 함수 자체에 관여한다. 이 논문의 기여는 새 메커니즘이 아니라 **이 여섯을 하나의 코드베이스에서 실제로 맞물리게 만든 것**이다.'},
 {h:'Multi-step distributional loss로 두 개를 한 번에 확장',
  lead:'n-step 리턴을 범주형 분포 타깃에 그대로 적용해 두 기법을 자연스럽게 결합한다.',
  d:'[Distributional RL](#/p/dqn)의 손실을 1-step이 아니라 n-step 부트스트랩 타깃으로 재정의하고, 그 타깃 선택에는 Double Q-learning의 온라인 네트워크로 행동을 고르고 타깃 네트워크로 평가하는 방식을 그대로 쓴다. 우선순위 리플레이의 priority 역시 TD 오차 대신 이 분포 손실(KL)을 사용하도록 바꿔, 네 가지 요소가 하나의 손실식 안에서 만난다.'},
 {h:'ablation: 빼봐야 기여가 보인다',
  lead:'전체에서 하나씩 제거해 57개 Atari 게임에서 성능 하락 폭을 측정한다.',
  d:'"각 요소가 왜 좋은가"의 이론이 아니라 "실제로 빼면 얼마나 나빠지는가"를 57개 게임 전체에서 측정했다. 그 결과 **Prioritized Replay와 Multi-step 학습**이 median 성능에 가장 크게 기여했고, Double Q-learning의 기여는 게임별 편차는 크지만 median으로는 거의 드러나지 않았다.'},
 {h:'Noisy Nets 제거가 유일하게 median을 낮췄다',
  lead:'입실론-그리디로 되돌리면 median 성능이 뚜렷이 나빠진다.',
  d:'여섯 요소 중 다섯은 "제거해도 median은 별 차이 없지만 개별 게임에서는 갈린다"는 패턴이었던 반면, Noisy Nets만은 제거 시 median 성능이 확실히 떨어졌다. 다만 일부 게임에서는 오히려 Noisy Nets가 없을 때 성능이 더 좋기도 해, 탐험 방식의 효과가 게임마다 크게 갈린다는 것도 함께 드러났다.'}
],

diagram:{type:'compare', cap:'DQN 이후 개별적으로 제안된 여섯 개선을 하나의 에이전트로 통합한 것이 Rainbow다.',
 left:{t:'DQN + 개별 확장', items:['Double DQN 하나만','Prioritized 리플레이 하나만','Dueling 구조 하나만','서로 다른 논문·코드베이스']},
 right:{t:'Rainbow: 여섯 결합', items:['Double + Dueling + Noisy','Multi-step + Distributional','Prioritized 리플레이','ablation으로 기여도 검증',], acc:false}},

math:[
 {tex:'y = (b + Wx) + \\big(b_{\\text{noisy}} \\odot \\epsilon^{b}\\big) + \\big(W_{\\text{noisy}} \\odot \\epsilon^{w}\\big)x',
  expr:'y = (b + Wx) + (b_noisy ⊙ ε_b) + (W_noisy ⊙ ε_w) x',
  d:'Noisy Nets의 선형층. 결정론적 파라미터(b, W)에 학습되는 노이즈 스케일($b_{noisy}, W_{noisy}$)과 매 순전파마다 샘플링되는 노이즈($\\epsilon$)를 더한다. 네트워크가 상태에 따라 탐험의 크기를 스스로 조절하게 된다.'},
 {tex:'d_t^{(n)} = \\sum_{k=0}^{n-1}\\gamma^{k}R_{t+k+1} + \\gamma^{n} z_{t+n}',
  expr:'d_t(n) = Σ γ^k R_{t+k+1} + γ^n z_{t+n}',
  d:'multi-step distributional 타깃. n-step 동안 실제로 받은 보상을 더한 뒤, n 스텝 뒤의 예측 분포 $z_{t+n}$ 을 이어 붙인다. Rainbow는 n=3을 최종값으로 사용했다.'}
],

numbers:[
 {k:'median 정규화 점수 · no-op 시작', v:'223%', d:'57개 Atari 게임 기준, 6개 baseline 중 최고를 능가'},
 {k:'median 정규화 점수 · human 시작', v:'153%', d:'no-op보다 어려운 human-starts 평가 규약'},
 {k:'Distributional DQN(단일 baseline) · no-op', v:'164%', d:'Rainbow 이전 개별 baseline 중 최고'},
 {k:'DQN 최고 성능 도달 시점', v:'7M 프레임', d:'Rainbow가 이 수준을 따라잡는 데 걸린 프레임 수'},
 {k:'모든 baseline을 능가하는 시점', v:'44M 프레임', d:'전체 학습(200M 프레임)의 22% 지점'},
 {k:'가장 크게 기여한 두 요소', v:'Prioritized Replay · Multi-step(n=3)', d:'제거 시 median 성능이 가장 크게 하락'}
],

impact:'"더 나은 단일 기법"이 아니라 "이미 있는 기법들이 실제로 합쳐지는가"를 검증하는 연구 방식을 강화학습 커뮤니티에 정착시켰다. 이후 Atari를 벤치마크로 쓰는 논문들이 새 기법 하나만 비교하지 않고 Rainbow를 기본 baseline으로 삼는 관행이 생겼다. 또한 ablation으로 기여도를 나눠 보는 방법론 자체가, 복잡한 시스템 논문(특히 여러 트릭이 겹쳐진 RL·LLM 학습 레시피)에서 표준적인 검증 절차로 자리잡았다.',

legacy:[
 '**Atari 벤치마크의 기본 baseline화** — 이후 가치기반 RL 논문 다수가 DQN이 아니라 Rainbow를 비교 대상으로 채택',
 '**[MuZero](#/p/muzero)** — Rainbow의 distributional·multi-step 요소를 계획(planning) 기반 세계 모델과 결합해 더 확장',
 '**Agent57 등 후속 통합 에이전트** — Rainbow의 "여러 개선을 합치고 ablation으로 검증" 방법론을 그대로 계승해 더 많은 요소를 추가',
 '**ablation 문화의 확산** — 복잡한 시스템을 발표할 때 구성요소별 기여도를 표로 보이는 관행이 RL을 넘어 퍼짐'
],

pitfalls:[
 '**"모든 요소가 항상 도움이 된다"가 아니다.** median으로는 Double Q-learning과 Dueling의 기여가 거의 안 보이며, 게임별로는 오히려 손해를 보는 경우도 있다 — Figure 4의 게임별 분해를 봐야 실제 그림이 보인다.',
 '**하이퍼파라미터가 재튜닝됐다.** 각 원 논문의 최적값을 그대로 쓴 게 아니라 결합된 상태에서 다시 튜닝했다(예: multi-step n=3, exploration 감소 구간 4M 프레임). 개별 논문 값을 그대로 합치면 이 결과가 재현되지 않을 수 있다.',
 '**여전히 가치기반(value-based) 방법에 한정된다.** 저자들 스스로도 PPO 같은 정책기반 방법은 다루지 않는다고 명시하며, Rainbow의 결론을 정책 경사 계열로 확장할 수는 없다.'
],

figures:[
 {f:'fig1-median-score.png',
  cap:'x축은 학습에 사용한 프레임 수(200M까지), y축은 57개 게임 median 인간 정규화 점수. 회색(DQN)이 가장 낮고 굵은 rainbow색 선이 7M 프레임에서 DQN 최종 성능을 따라잡고 44M 프레임에서 모든 baseline을 앞지른다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig3-ablation.png',
  cap:'전체 Rainbow에서 한 요소씩 뺀 6개 곡선(점선)과 완전한 Rainbow(굵은 선)를 비교한다. "no priority"(파란)와 "no multi-step"(노란)이 가장 아래로 처져 두 요소의 기여가 가장 크다는 것을 보여준다.',
  src:'원문 Figure 3, p.6'}
],

quotes:[
 {t:'This paper examines six extensions to the DQN algorithm and empirically studies their combination.',
  src:'Abstract, p.1'},
 {t:'We have shown that within the integrated algorithm, all but one of the components provided clear performance benefits.',
  src:'Discussion, p.6'}
],

links:[
 {t:'arXiv 1710.02298 — Rainbow', u:'https://arxiv.org/abs/1710.02298'}
]
});
