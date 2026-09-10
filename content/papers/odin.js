WIKI.paper({
slug:'odin',
venue:'ICLR 2018',
authors:'Liang, Li & Srikant (UIUC · U. Wisconsin-Madison)',
arxiv:'1706.02690',

tldr:'사전학습된 신경망을 **전혀 재학습하지 않고**, 소프트맥스에 온도 스케일링을 더하고 입력에 아주 작은 섭동을 가하는 두 가지 전처리만으로 in/out-of-distribution 점수 분포를 크게 벌려 놓는 방법. [msp-baseline](#/p/msp-baseline)의 소프트맥스 최댓값 점수를 그대로 쓰되, 그 점수가 잘 갈라지도록 입력과 온도를 먼저 손본다.',

context:'[msp-baseline](#/p/msp-baseline)이 소프트맥스 최댓값만으로도 OOD를 어느 정도 가려낼 수 있음을 보였지만, in-distribution과 out-of-distribution 예시의 점수 분포가 크게 겹치는 경우가 많아 탐지 성능에 한계가 있었다. 이 논문은 모델 구조나 가중치를 건드리지 않고도 이 겹침을 줄일 수 있는지를 묻는다. 실마리는 두 가지 이미 알려진 기법이었다 — distillation에서 쓰던 **온도 스케일링**, 그리고 [FGSM](#/p/fgsm)이 보여준 "입력에 아주 작은 섭동만 더해도 소프트맥스 출력이 크게 흔들린다"는 사실.',

ideas:[
 {h:'온도 스케일링으로 점수 분포를 벌린다',
  lead:'로짓을 $T$로 나눈 뒤 소프트맥스를 취하면, $T$가 클수록 in/out 점수의 상대적 격차가 커진다.',
  d:'$T=1$인 일반적인 소프트맥스에서는 최댓값이 1에 가깝게 포화되어 있어 in/out 예시가 서로 잘 구분되지 않는다. $T$를 1000처럼 크게 키우면 로짓 간의 상대적 차이가 소프트맥스 점수에 더 민감하게 반영되면서, in-distribution 예시의 최댓값이 OOD 예시보다 유의미하게 높게 벌어진다. $T$는 학습에는 전혀 관여하지 않고 시험 시점에만 적용된다.'},
 {h:'FGSM 방향을 뒤집은 입력 섭동',
  lead:'예측 클래스의 소프트맥스 점수를 낮추는 방향(FGSM)이 아니라 **높이는** 방향으로 입력을 살짝 민다.',
  d:'[FGSM](#/p/fgsm)은 $x + \\varepsilon\\,\\text{sign}(\\nabla_x \\ell)$ 로 손실을 키워 모델을 속인다. ODIN은 부호를 반대로 써서 예측된 클래스의 로그-소프트맥스 점수를 **키우는** 방향으로 입력을 이동시킨다. 이 섭동이 in-distribution 이미지에는 크게, OOD 이미지에는 상대적으로 작게 작용한다는 것이 실험적으로 관찰된 핵심 현상이다 — 모델이 "이미 익숙한" 방향으로는 쉽게 더 확신하지만, 낯선 입력은 그렇게 잘 밀리지 않는다.'},
 {h:'클래스 라벨이 필요 없는 섭동',
  lead:'섭동 계산에 예측된 클래스의 점수만 쓰고 정답 라벨은 쓰지 않아 시험 시점에 라벨 없이도 동작한다.',
  d:'섭동은 $\\arg\\max$ 로 얻은 예측 클래스의 소프트맥스 점수에 대한 그레이디언트로 계산되므로, 정답 라벨이 없는 배포 환경(실제 OOD 탐지 상황)에서도 그대로 쓸 수 있다.'},
 {h:'$T$·$\\varepsilon$ 를 OOD 검증셋으로 튜닝',
  lead:'온도와 섭동 크기라는 두 하이퍼파라미터를 별도의 OOD validation set에서 FPR을 최소화하도록 고른다.',
  d:'$T \\in \\{1,\\dots,1000\\}$, $\\varepsilon$ 은 0~0.004 사이 21개 값 중 TPR 95%에서 FPR을 최소화하는 조합을 고른다. 튜닝에 쓴 OOD 데이터셋과 최종 평가에 쓴 OOD 데이터셋을 분리했고, 튜닝셋을 바꿔도 성능이 크게 흔들리지 않는다는 전이 실험(Table 3)도 함께 제시한다.'}
],

diagram:{type:'flow', cap:'사전학습된 모델은 그대로 두고 시험 시점 전처리 두 단계만 끼워 넣는다.',
 nodes:[
  {t:'입력 x', s:'원본 이미지'},
  {t:'섭동 추가', s:'FGSM 반대 방향', a:'x̃'},
  {t:'사전학습 모델', s:'가중치 고정'},
  {t:'온도 스케일링', s:'T=1000', acc:true},
  {t:'최댓값 점수', s:'in/out 판별'}
 ]},

math:[
 {expr:'S_i(x; T) = exp(f_i(x)/T) / Σ_j exp(f_j(x)/T)',
  tex:'S_i(x;T) = \\frac{\\exp\\big(f_i(x)/T\\big)}{\\sum_{j=1}^{N}\\exp\\big(f_j(x)/T\\big)}',
  d:'로짓 $f_i(x)$ 를 온도 $T$로 나눈 뒤 소프트맥스를 취한다. $T=1$이면 일반적인 학습 시 소프트맥스와 같다.'},
 {expr:'x̃ = x − ε · sign(−∇_x log S_ŷ(x; T))',
  tex:'\\tilde{x} = x - \\varepsilon\\,\\text{sign}\\big(-\\nabla_x \\log S_{\\hat{y}}(x;T)\\big)',
  d:'예측 클래스 $\\hat{y}$ 의 로그-소프트맥스 점수를 높이는 방향으로 입력을 이동시킨다. [FGSM](#/p/fgsm)의 섭동식과 형태는 같지만 목적(점수를 낮출지 높일지)이 반대다.'}
],

numbers:[
 {k:'FPR @ TPR 95%', v:'34.7% → 4.3%', d:'DenseNet, CIFAR-10(in) vs TinyImageNet-crop(out) — baseline(MSP) 대비 ODIN'},
 {k:'최적 온도', v:'T=1000', d:'논문 전 실험에서 공통으로 쓴 값'},
 {k:'최적 섭동 크기(DenseNet)', v:'ε=0.0014(C-10) / 0.002(C-100)', d:'CIFAR-10과 CIFAR-100에서 다르게 튜닝됨'},
 {k:'탐지 파이프라인 변경', v:'0(재학습 없음)', d:'가중치·구조 모두 고정, 시험 시점 전처리만 추가'},
 {k:'하이퍼파라미터 탐색 범위', v:'T 10개 값 × ε 21개 값', d:'별도 OOD validation set에서 FPR 최소화로 선택'}
],

impact:'"모델을 안 건드려도 OOD 분리를 크게 개선할 수 있다"는 것을 실증하며, MSP 위에 값싸게 얹을 수 있는 후처리 기법의 가능성을 열었다. 동시에 이 논문은 스스로 하이퍼파라미터를 OOD 검증셋으로 튜닝한다는 점에서 비판의 대상이 되기도 했다 — 실제 배포 환경에서는 어떤 OOD 분포가 나타날지 미리 알 수 없는 경우가 많은데, 그 정보를 사전에 쓰는 것은 평가를 유리하게 만드는 것 아니냐는 지적이다.',

legacy:[
 '**하이퍼파라미터-프리 후속 연구** — OOD 검증셋 없이도 동작하는 Mahalanobis 거리 기반 탐지, 에너지 기반 점수 등이 ODIN의 한계를 직접 겨냥해 등장했다',
 '**보정과 탐지의 결합** — [temperature-scaling](#/p/temperature-scaling)의 온도 개념을 탐지 목적으로 재활용한 사례로 자주 인용되며, 두 논문이 온도 스케일링의 "용도 차이"를 보여주는 짝으로 거론된다',
 '**입력 섭동 계열의 시초** — 시험 시점에 입력을 그레이디언트 방향으로 미세 조정하는 아이디어가 이후 여러 OOD·적대적 강건성 연구의 전처리 기법으로 재사용됐다',
 '**전이성 평가 관행** — 한 OOD 검증셋에서 고른 하이퍼파라미터를 다른 OOD 테스트셋에 그대로 적용해 일반화를 확인하는 실험(Table 3 방식)이 이후 논문에서도 표준 점검 항목이 됐다'
],

pitfalls:[
 '**하이퍼파라미터를 OOD 데이터로 튜닝했다는 것 자체가 한계다.** 실전에서는 배포 후 마주칠 OOD 분포를 미리 알 수 없는데, 이 논문의 수치는 그 정보를 이미 쓴 상태에서 나온 것이다. "재학습 없이 큰 개선"이라는 홍보 문구와 별개로 이 전제를 놓치면 안 된다.',
 '**입력에 그레이디언트 기반 섭동을 추가하는 것 자체가 추론 비용을 늘린다.** 단순 forward pass 한 번이던 [msp-baseline](#/p/msp-baseline)과 달리, ODIN은 역전파 한 번이 추가로 필요하다.',
 '**섭동 방향이 항상 in-distribution에 유리하게 작동한다는 보장은 없다.** 논문의 관찰은 실험적 경향이며, 모델·데이터셋 조합에 따라 $\\varepsilon$ 을 잘못 고르면 오히려 분리가 나빠질 수 있다(Figure 3-4에서 $\\varepsilon$ 이 너무 크면 성능이 꺾이는 구간이 보고된다).'
],

figures:[
 {f:'fig1-roc.png',
  cap:'DenseNet-BC-100(CIFAR-10 in-distribution) vs TinyImageNet-crop(out) ROC 곡선. 빨간선(MSP baseline)과 파란선(ODIN, T=1000·ε=0.0012)을 비교하면, 같은 TPR 95% 지점에서 FPR이 34.7%에서 4.3%로 줄어드는 것을 화살표로 표시했다 — 곡선이 왼쪽 위로 붙을수록 더 좋은 탐지기.',
  src:'원문 Figure 1, p.5'}
],

quotes:[
 {t:'ODIN reduces the false positive rate from the baseline 34.7% to 4.3% on the DenseNet (applied to CIFAR-10 and Tiny-ImageNet) when the true positive rate is 95%.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1706.02690 — Enhancing The Reliability of OOD Image Detection', u:'https://arxiv.org/abs/1706.02690'}
]
});
