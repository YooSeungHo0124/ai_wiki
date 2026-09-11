WIKI.paper({
slug:'maml',
venue:'ICML 2017',
authors:'Chelsea Finn, Pieter Abbeel, Sergey Levine (UC Berkeley)',
arxiv:'1703.03400',

tldr:'모델 구조를 가리지 않고 **경사 하강 몇 스텝으로 새 과제에 적응하기 좋은 초기 파라미터**를 메타 학습하는 알고리즘. [Matching Networks](#/p/matching-net)처럼 새 아키텍처를 설계하는 대신, 어떤 분류·회귀·강화학습 모델에도 얹을 수 있는 학습 절차를 제안했다.',

context:'[Matching Networks](#/p/matching-net)와 그 뒤를 이은 metric-learning 방법들은 전부 분류 전용 아키텍처였다 — 비모수적 최근접이웃 구조라 회귀나 강화학습에는 그대로 쓸 수 없었다. 다른 갈래는 데이터셋 전체를 읽어 학습 규칙 자체를 출력하는 순환 신경망(RNN 메타러너)이었는데, 구조가 복잡하고 태스크 도메인마다 따로 설계해야 했다. 이 논문은 질문을 바꾼다 — 모델을 통째로 학습하는 대신, **일반적인 경사 하강 학습기가 몇 스텝 만에 좋아지도록 시작점만 잘 잡아주면** 되지 않을까?',

ideas:[
 {h:'초기 파라미터 자체를 메타 학습 대상으로',
  lead:'경사 하강 몇 스텝 뒤 손실이 최소가 되는 시작점 θ를 과제 분포 전체에서 찾는다.',
  d:'표준 지도학습은 파라미터 $\\theta$ 를 손실이 낮아지는 방향으로 갱신한다. MAML은 한 단계 더 나아가 "이 $\\theta$ 에서 몇 스텝 경사 하강을 밟은 뒤의 손실"을 목적함수로 삼는다. 모델 $f_\\theta$ 의 형태(합성곱망이든 MLP든 정책망이든)에 아무 제약을 두지 않아 **모델에 무관(model-agnostic)** 하다.'},
 {h:'내부 루프(적응)와 외부 루프(메타 갱신)의 이중 구조',
  lead:'과제마다 몇 스텝 적응시킨 뒤, 적응된 파라미터의 성능으로 원래 초기값을 갱신한다.',
  d:'매 메타 스텝에서 과제 배치 $\\mathcal{T}_i\\sim p(\\mathcal{T})$ 를 뽑는다. 각 과제마다 지지집합 $K$ 개로 **내부 루프**를 돌려 $\\theta_i\'=\\theta-\\alpha\\nabla_\\theta \\mathcal{L}_{\\mathcal{T}_i}(f_\\theta)$ 를 구한 뒤, 그 적응된 파라미터 $\\theta_i\'$ 가 **새로운** 쿼리 데이터에서 내는 손실을 모아 원래 $\\theta$ 를 갱신하는 **외부 루프**를 밟는다. 즉 "적응 후 성능"이 메타 학습의 목적이지, "적응 전 성능"이 아니다.'},
 {h:'2차 미분: gradient의 gradient',
  lead:'외부 루프의 갱신이 내부 루프 갱신식을 통과하므로 손실의 2차 미분(Hessian-vector product)이 필요하다.',
  d:'외부 손실 $\\mathcal{L}_{\\mathcal{T}_i}(f_{\\theta_i\'})$ 는 $\\theta_i\'=\\theta-\\alpha\\nabla_\\theta \\mathcal{L}_{\\mathcal{T}_i}(f_\\theta)$ 를 통해 $\\theta$ 에 의존하므로, $\\theta$ 에 대해 미분하면 $\\nabla_\\theta \\mathcal{L}_{\\mathcal{T}_i}(f_\\theta)$ 자체의 미분, 즉 2차 미분이 나온다. 이것이 MAML의 계산 비용 대부분을 차지한다.'},
 {h:'1차 근사(FOMAML): 2차 항을 버리는 실용적 타협',
  lead:'내부 루프 갱신을 상수로 취급해 Hessian 계산을 생략하면 속도가 약 33% 빨라지고 정확도는 거의 그대로다.',
  d:'2차 미분에서 오는 Hessian-vector product 역전파를 생략하고, $\\theta_i\'$ 에서 계산한 그레이디언트를 그대로 $\\theta$ 의 갱신 방향으로 쓰는 것이 1차 근사(first-order MAML)다. miniImageNet 실험에서 전체 MAML(48.70%)과 1차 근사(48.07%)의 1-shot 정확도 차이는 통계적으로 거의 없었고, 계산은 약 33% 빨라졌다. 이 선택이 이후 [Reptile](#/p/reptile)로 이어지는 1차 메타학습 계열의 출발점이다.'}
],

diagram:{type:'loop', cap:'여러 과제(점선 화살표, 각기 다른 손실 지형)에서 동시에 잘 적응할 수 있는 공통 시작점 θ를 찾는다.',
 center:'과제 배치로 반복',
 nodes:[
  {t:'초기 파라미터 θ', s:'메타 학습 대상', acc:true},
  {t:'과제 T_i 샘플링', s:'p(T)에서 배치'},
  {t:'내부 루프 적응', s:'K샷, α로 1~수 스텝'},
  {t:'쿼리 손실 평가', s:'적응된 θ_i\''},
  {t:'외부 루프 갱신', s:'β로 θ 갱신'}
 ]},

math:[
 {expr:'θ_i\' = θ − α ∇_θ L_{T_i}(f_θ)',
  tex:'\\theta_i\'=\\theta-\\alpha\\nabla_\\theta \\mathcal{L}_{\\mathcal{T}_i}(f_\\theta)',
  d:'과제 $\\mathcal{T}_i$ 에 대한 내부 루프 한 스텝. $\\alpha$ 는 적응 학습률. 여러 스텝을 밟는 것도 직접적인 확장이다.'},
 {expr:'θ ← θ − β ∇_θ Σ_i L_{T_i}(f_{θ_i\'})',
  tex:'\\theta \\leftarrow \\theta-\\beta\\nabla_\\theta \\sum_{\\mathcal{T}_i\\sim p(\\mathcal{T})}\\mathcal{L}_{\\mathcal{T}_i}(f_{\\theta_i\'})',
  d:'외부 루프. 적응된 파라미터 $\\theta_i\'$ 에서 계산한 손실의 합을 **원래** $\\theta$ 에 대해 미분해 메타 학습률 $\\beta$ 로 갱신한다. $\\theta_i\'$ 자체가 $\\theta$ 의 함수라서 이 미분에 2차 항이 포함된다.'}
],

numbers:[
 {k:'miniImageNet 5-way 1-shot', v:'48.70%', d:'FOMAML은 48.07% — 거의 동일, 계산은 약 33% 절감'},
 {k:'miniImageNet 5-way 5-shot', v:'63.11%', d:'[Matching Networks](#/p/matching-net) 55.31%, meta-learner LSTM 60.60%를 상회'},
 {k:'Omniglot 5-way 1-shot / 20-way 1-shot', v:'98.7% / 95.8%', d:'합성곱망 기준, 20-way는 5-way보다 어려운 설정'},
 {k:'FOMAML 속도 향상', v:'약 33%', d:'Hessian-vector product 역전파 생략분'},
 {k:'적응 스텝 수', v:'1~수 스텝', d:'회귀 실험은 1 스텝으로도 곡선 형태를 추정'},
 {k:'RL 실험 적응', v:'2~3 그레이디언트 스텝', d:'2D 내비게이션·MuJoCo locomotion 과제, 스텝마다 새 롤아웃 필요'}
],

impact:'"메타 학습 = 새 아키텍처 설계"라는 공식을 깨고, **표준 경사 하강 위에서 초기화만 바꾸는** 방법으로도 분류·회귀·강화학습을 하나의 알고리즘으로 통일했다. [Matching Networks](#/p/matching-net)의 에피소드 학습 틀은 그대로 물려받되, 비모수적 거리 비교 대신 그레이디언트 자체를 적응 메커니즘으로 삼은 것이 핵심 전환이다. 이후 2차 미분의 계산·메모리 비용을 어떻게 줄일 것인가가 메타 학습 연구의 중심 문제 중 하나가 됐다.',

legacy:[
 '**1차 근사 계열의 분기** — FOMAML의 성공은 2차 미분 없이도 되는지를 정면으로 묻는 [Reptile](#/p/reptile)로 이어짐',
 '**비교 기준으로서의 단순 baseline** — [Prototypical Networks](#/p/prototypical)가 "이만큼 단순해도 MAML급 성능이 나온다"고 반박하는 대상이 됨',
 '**RL로의 확장 레시피** — 정책망 초기화에 메타 학습을 적용하는 후속 연구(RL² 계열과 비교되며)들의 참조점이 됨',
 '**모델-무관성이라는 설계 원칙** — 이후 메타 학습 연구가 "어떤 아키텍처에 얹을 수 있는가"를 설계 목표로 명시하는 관행을 남김'
],

pitfalls:[
 '**"MAML은 그저 좋은 초기값을 찾는다"는 설명은 절반만 맞다.** 논문의 목적함수는 초기값 자체가 아니라 "적응 후 성능"이라, 사전학습(pretraining) 후 fine-tuning과는 다른 목적을 최적화한다 — 원문은 이 둘을 직접 비교해 MAML이 우세함을 보인다.',
 '**2차 미분 비용을 과소평가하기 쉽다.** Hessian-vector product를 위한 추가 역전파가 필요해, 순수 1차 방법보다 메모리·연산이 늘어난다. FOMAML은 이 비용을 줄이는 근사이지 다른 알고리즘이 아니다.',
 '**K-shot의 K는 지지집합 크기이지 적응 스텝 수가 아니다.** 논문에서 샷 수와 그레이디언트 스텝 수는 독립적인 하이퍼파라미터이며, 혼동해서 읽으면 실험 설정을 잘못 재현하게 된다.'
],

figures:[
 {f:'fig1-theta-diagram.png',
  cap:'실선이 메타 학습으로 θ가 움직이는 경로, 점선이 각 과제 T1·T2·T3에서의 개별 적응(∇L1·∇L2·∇L3)이다. θ는 어느 방향으로 적응하든 짧은 거리로 각 과제의 최적점 θ*에 도달할 수 있는 지점에 놓인다 — "좋은 초기값"의 기하학적 의미.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'In effect, our proposed method aims to optimize the model parameters such that one or a small number of gradient steps on a new task will produce maximally effective behavior on that task.',
  src:'Section 2.2, p.2'}
],

links:[
 {t:'arXiv 1703.03400 — Model-Agnostic Meta-Learning', u:'https://arxiv.org/abs/1703.03400'},
 {t:'저자 프로젝트 페이지 (BAIR)', u:'https://sites.google.com/view/maml'}
]
});
