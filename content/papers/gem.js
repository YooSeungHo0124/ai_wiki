WIKI.paper({
slug:'gem',
venue:'NeurIPS 2017',
authors:'Lopez-Paz & Ranzato (Facebook AI Research)',
arxiv:'1706.08840',

tldr:'새 과제를 배울 때 **옛 과제의 손실이 늘어나지 않는 방향으로만** 경사를 사영(projection)하는 방법. 페널티가 아니라 **부등식 제약이 있는 이차계획법(QP)**으로 문제를 풀어, [EWC](#/p/ewc)·[iCaRL](#/p/icarl)과 달리 옛 과제 성능이 오히려 좋아지는 양의 역전이(positive backward transfer)까지 허용한다.',

context:'연속 학습 평가는 흔히 "마지막에 전체 평균 정확도가 얼마인가"만 본다. 이 논문은 그것만으로는 부족하다고 지적하며 **역방향 전이(BWT)**와 **순방향 전이(FWT)**를 따로 측정하는 프로토콜을 제안한다. 또한 [EWC](#/p/ewc)처럼 옛 손실에 이차 페널티를 더하는 방식과 [iCaRL](#/p/icarl)처럼 옛 출력을 증류로 고정하는 방식은 공통적으로 "옛 손실이 변하지 않기를" 바라는 데 그친다 — 이렇게 하면 옛 과제 손실이 **더 낮아지는 것조차 막힌다**. 새 과제를 배우다 우연히 옛 과제에도 도움이 되는 경우(양의 역전이)를 원천 차단하지 않으면서 망각만 막을 방법이 필요했다.',

ideas:[
 {h:'옛 손실 증가 금지를 부등식 제약으로 명시한다',
  lead:'옛 과제 손실이 이전 값보다 커지지 않는다는 조건을 직접 최적화 제약으로 건다.',
  d:'새 예시 $(x,t,y)$ 를 볼 때 GEM은 $\\min_\\theta \\ell(f_\\theta(x,t),y)$ 를 풀되, $k<t$ 인 모든 이전 과제에 대해 메모리 $M_k$ 위 손실이 과제 $t-1$ 학습 종료 시점 값을 넘지 않는다는 제약을 건다. 페널티로 부드럽게 유도하는 EWC와 달리 **명시적 제약**이라, 옛 손실이 줄어드는 것은 자유롭게 허용된다.'},
 {h:'경사 내적의 부호로 제약 위반을 진단한다',
  lead:'제안된 경사와 옛 과제 경사의 내적이 음수면 그 과제 손실이 늘어난다는 뜻이다.',
  d:'손실이 국소적으로 선형이라 가정하면, 파라미터 업데이트 $g$ 가 과제 $k$ 의 손실을 늘리지 않을 조건은 $\\langle g, g_k\\rangle \\ge 0$ 이다($g_k$ 는 메모리 $M_k$ 에 대한 경사). 옛 예측기를 따로 저장할 필요 없이, 매 스텝 메모리에서 계산한 경사들과의 내적 부호만 보면 된다.'},
 {h:'위반 시 가장 가까운 유효 경사로 사영한다',
  lead:'모든 제약을 만족하는 경사 중 원래 경사 $g$ 와 가장 가까운 $\\tilde g$ 를 이차계획법으로 구한다.',
  d:'하나라도 $\\langle g,g_k\\rangle<0$ 이면, $\\|g-\\tilde g\\|^2$ 를 최소화하면서 모든 $k$ 에 대해 $\\langle \\tilde g, g_k\\rangle \\ge 0$ 을 만족하는 $\\tilde g$ 를 찾는다. 이는 표준 QP이고, 파라미터 차원(수백만) 대신 **관측한 과제 수 $t-1$** 차원의 쌍대 문제로 바꾸면 실시간으로 풀 수 있을 만큼 작아진다.'},
 {h:'메모리는 과제당 균등 할당, 마지막 m개만 보관',
  lead:'전체 예산 $M$ 을 과제 수 $T$ 로 나눈 $m=M/T$ 개를 과제마다 저장한다.',
  d:'[iCaRL](#/p/icarl)의 허딩 같은 정교한 선택 없이 각 과제에서 본 마지막 $m$ 개 예시를 그대로 메모리에 쓴다. 저자들은 더 나은 선택 전략(과제별 coreset 구성 등)이 있을 수 있다고 인정하면서도, 이 단순한 방식만으로 EWC·iCaRL을 능가하는 결과를 보인다.'}
],

diagram:{type:'compare', cap:'옛 손실을 다루는 방식의 차이. GEM만 부등식 제약으로 풀어 손실 감소(양의 역전이)를 막지 않는다.',
 left:{t:'기존: 페널티/증류', items:['옛 손실에 이차 페널티(EWC)','또는 옛 출력을 증류로 고정(iCaRL)','옛 손실이 줄어드는 것도 억제']},
 right:{t:'GEM: 부등식 제약 + 사영', items:['옛 손실 ≤ 이전 값만 강제','위반 시 경사를 QP로 사영','양의 역전이 허용']}
},

math:[
 {expr:'minimize_θ ℓ(f_θ(x,t), y)  subject to  ℓ(f_θ, M_k) ≤ ℓ(f_{θ^{t-1}}, M_k) for all k < t',
  tex:'\\min_{\\theta}\\; \\ell(f_\\theta(x,t),y) \\quad \\text{s.t.}\\quad \\ell(f_\\theta, M_k) \\le \\ell(f_{\\theta^{t-1}}, M_k),\\;\\; \\forall k<t',
  d:'GEM의 원래 목적식. 새 예시의 손실을 최소화하되, 이전 모든 과제의 메모리 손실이 과제 $t-1$ 학습 직후 값을 넘지 않아야 한다.'},
 {expr:'⟨g, g_k⟩ ≥ 0  for all k < t',
  tex:'\\langle g, g_k \\rangle := \\left\\langle \\frac{\\partial \\ell(f_\\theta(x,t),y)}{\\partial \\theta}, \\frac{\\partial \\ell(f_\\theta, M_k)}{\\partial \\theta} \\right\\rangle \\ge 0,\\quad \\forall k<t',
  d:'국소 선형 근사 하에서의 제약 재작성. 새 경사 $g$ 와 각 옛 과제 경사 $g_k$ 의 내적이 음수가 아니면 그 과제의 손실이 늘지 않는다.'},
 {expr:'min_v̅  (1/2) v^T GG^T v + g^T G^T v   subject to  v ≥ 0',
  tex:'\\min_{v}\\; \\tfrac{1}{2} v^{\\top} GG^{\\top} v + g^{\\top}G^{\\top}v \\quad \\text{s.t.}\\quad v \\ge 0',
  d:'사영 QP(식 8)의 쌍대 문제. $G=(g_1,\\dots,g_{t-1})$. 파라미터 수 $p$ 대신 과제 수 $t-1$ 차원에서 풀리므로, $\\tilde g = G^{\\top}v^{*}+g$ 로 사영된 경사를 값싸게 복원한다.'}
],

numbers:[
 {k:'과제 수', v:'T = 20', d:'MNIST 순열·회전·Incremental CIFAR-100 모두 20개 과제를 순차 학습'},
 {k:'메모리(MNIST)', v:'과제당 1,000예시', d:'permutations/rotations 각 과제 10클래스 중 1,000개를 저장'},
 {k:'메모리(CIFAR-100)', v:'과제당 2,500예시 · 5클래스', d:'100클래스를 20과제로 쪼개 각 과제가 서로 다른 5클래스를 담당'},
 {k:'CIFAR-100 ACC', v:'GEM 최고, iCaRL·EWC·single 순', d:'Fig.1 막대그래프에서 GEM의 평균 정확도가 비교 방법 중 가장 높음'},
 {k:'CIFAR-100 BWT', v:'GEM만 양(+)의 값에 근접', d:'single·iCaRL·EWC는 음의 backward transfer(망각), GEM은 거의 0 또는 소폭 양의 값'},
 {k:'학습 비용(MNIST)', v:'GEM 77~135초 vs EWC 169~179초', d:'CPU 학습 시간 기준 GEM이 EWC보다 오히려 빠름(Table 1)'}
],

impact:'BWT·FWT를 분리해 측정하는 평가 프로토콜을 제시해, 이후 연속 학습 논문들이 "평균 정확도 하나"가 아니라 전이 방향까지 보고하게 만들었다. 방법론적으로는 파국적 망각 방지를 **페널티 최소화**가 아니라 **제약 충족 문제**로 재정식화해, 옛 손실을 "그대로 유지"가 아니라 "늘리지만 않으면 됨"으로 완화함으로써 양의 역전이라는 개념 자체를 실증했다. 다만 매 스텝 QP를 풀어야 해서 과제 수·메모리 크기가 커지면 연산 비용이 늘어난다는 대가가 있다.',

legacy:[
 '**Averaged GEM(A-GEM)** 등 후속 연구가 매 스텝 QP를 단일 제약(메모리 전체 평균 경사와의 내적)으로 근사해 계산 비용을 크게 낮춤',
 '**BWT/FWT 평가 지표의 표준화** — 이후 연속 학습 벤치마크 논문 다수가 GEM의 ACC·BWT·FWT 프로토콜을 그대로 채택',
 '**제약 최적화 관점의 확산** — 경사를 사영한다는 아이디어가 멀티태스크 학습의 경사 충돌 해소(gradient surgery류) 연구에도 영향을 줌',
 '**리허설 메모리 선택 전략에 대한 후속 논의를 촉발** — GEM은 "마지막 m개"라는 단순한 저장 규칙을 썼는데, 이후 연구들이 iCaRL의 허딩 같은 더 나은 선택 전략과 결합을 시도'
],

pitfalls:[
 '**메모리 크기 $M$ 이 곧 성능이다.** 과제당 $m=M/T$ 로 균등 분배하므로 과제 수가 늘면 과제당 저장량이 줄어 QP 제약의 근거(메모리가 과제를 대표한다는 가정)가 약해진다.',
 '**매 스텝 QP를 푸는 비용을 과소평가하기 쉽다.** 과제 수 $t-1$ 차원의 QP라 파라미터 차원보다는 싸지만, 과제가 아주 많아지면(수백 개) 이마저 누적 비용이 커진다 — 이 문제를 겨냥해 A-GEM이 나왔다.',
 '**국소 선형 근사가 전제다.** $\\langle g,g_k\\rangle\\ge 0$ 진단은 작은 업데이트 스텝에서만 유효한 근사이며, 큰 학습률이나 급격한 파라미터 변화에서는 보장이 깨질 수 있다.'
],

figures:[
 {f:'fig1-cifar100.png',
  cap:'Incremental CIFAR-100(20과제) 결과. 왼쪽 막대: GEM(보라)이 ACC 최고, BWT도 0 근처(iCaRL·EWC는 음수). 오른쪽 선그래프: 과제를 계속 추가하는 동안 **첫 번째 과제**의 테스트 정확도 추이 — GEM만 시간이 지나도 떨어지지 않고 오히려 오르는 구간이 있다(양의 역전이).',
  src:'원문 Figure 1(하단), p.6'}
],

quotes:[
 {t:'We propose a model for continual learning, called Gradient Episodic Memory (GEM), that alleviates forgetting, while allowing beneficial transfer of knowledge to previous tasks.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1706.08840 — Gradient Episodic Memory for Continual Learning', u:'https://arxiv.org/abs/1706.08840'},
 {t:'공식 코드 (facebookresearch/GradientEpisodicMemory)', u:'https://github.com/facebookresearch/GradientEpisodicMemory'}
]
});
