WIKI.paper({
slug:'temporal-ensembling',
venue:'ICLR 2017 (arXiv 2016)',
authors:'Laine, Aila (NVIDIA)',
arxiv:'1610.02242',

tldr:'같은 입력에 대해 **과거 예측들의 지수이동평균(EMA)을 목표(target)로 삼아** 라벨 없는 데이터도 학습에 쓰는 준지도 학습 기법. Π-model과 temporal ensembling 두 방식을 제시하고, SVHN·CIFAR-10에서 당시 준지도 학습 SOTA를 크게 경신했다.',

context:'`[Dropout](#/p/dropout)`이 걸린 네트워크는 같은 입력을 두 번 통과시켜도 매번 다른 출력을 낸다. 이 "잡음 섞인 여러 예측"을 단순한 불안정성으로 보지 않고, 저자들은 거꾸로 질문한다 — **이 여러 예측을 앙상블처럼 평균 내면, 그 평균이 지금 네트워크의 단일 출력보다 더 신뢰할 만한 라벨 추정치가 되지 않을까?** 만약 그렇다면, 라벨이 없는 데이터에도 "지금 네트워크가 뭐라 답하든 상관없이, 과거 여러 예측의 합의점에 가깝게" 라는 목표를 줄 수 있다. 이것이 이후 Mean Teacher·`[UDA](#/p/uda)`·`[Noisy Student](#/p/noisy-student)`로 이어지는 **일관성 정칙화(consistency regularization)** 계열의 출발점이다.',

ideas:[
 {h:'Π-model: 같은 입력, 두 번의 서로 다른 통과',
  lead:'같은 이미지를 augmentation·dropout이 다른 두 forward pass에 넣고 두 예측이 같아지도록 규제한다.',
  d:'입력 $x_i$를 서로 다른 확률적 증강(stochastic augmentation)과 dropout 조건으로 두 번 통과시켜 예측 $z_i$·$\\tilde{z}_i$를 얻는다. 라벨이 있는 데이터는 표준 교차 엔트로피로 학습하고, **모든** 데이터(라벨 유무 무관)에 대해 $z_i$와 $\\tilde{z}_i$의 제곱 차이를 최소화하는 비지도 항을 더한다. "같은 대상은 흔들어도 같은 답을 내야 한다"는 것이 이 항의 직관이다.'},
 {h:'temporal ensembling: 두 번 대신 과거 예측의 이동평균',
  lead:'매번 다시 예측하는 대신, 지금까지 epoch별 예측을 누적한 이동평균을 목표로 쓴다.',
  d:'Π-model은 한 스텝에 네트워크를 두 번 평가해야 해서 느리다. temporal ensembling은 각 epoch마다 네트워크를 한 번만 평가하고, 그 출력 $z_i$를 누적 평균 $Z \\leftarrow \\alpha Z + (1-\\alpha)z$ 에 흘려 넣는다. 이 $Z$(편향 보정 후 $\\tilde{z}$)가 다음 epoch의 목표가 된다. 속도가 약 2배 빨라지고, 여러 epoch에 걸친 평균이라 목표가 더 안정적(덜 시끄러움)이다.'},
 {h:'편향 보정은 Adam과 같은 트릭',
  lead:'초기 epoch에 $Z$가 0에 가까운 문제를, $Z/(1-\\alpha^t)$로 나눠 보정한다.',
  d:'지수이동평균은 초기 항의 가중치가 작아서 학습 초반에는 목표가 실제 예측보다 0에 가깝게 쏠린다. `[Adam](#/p/adam)`의 1차 모멘트 보정과 똑같은 방식으로 $\\tilde{z} = Z/(1-\\alpha^t)$ 로 나눠, 초반부터 목표가 최근 예측을 온전히 반영하도록 만든다.'},
 {h:'비지도 손실 가중치는 서서히 올린다(ramp-up)',
  lead:'학습 초반에는 지도 손실만 신뢰하고, 비지도 손실의 가중치 $w(t)$를 점차 키운다.',
  d:'초기 네트워크의 예측은 신뢰할 수 없으므로, 비지도(일관성) 손실 앞에 붙는 가중치 $w(t)$를 학습 초반에는 0에 가깝게 두고 점진적으로 올린다. 이 램프업이 없으면 초반의 엉터리 예측이 스스로를 강화하는 자기확증(confirmation bias) 문제로 훈련이 무너질 수 있다.'},
 {h:'틀린 라벨에도 견고하다',
  lead:'라벨의 일부를 일부러 오염시켜도, 이동평균 목표가 그 잡음을 흡수해 준다.',
  d:'라벨 일부를 의도적으로 잘못 붙인 실험에서도, temporal ensembling은 일관성 손실이 잘못된 개별 라벨에 휘둘리지 않고 견고하게 학습됐다. 여러 epoch의 평균이라는 목표 자체가 개별 스텝의 오류를 평활화하는 효과를 낸다.'}
],

diagram:{type:'compare', cap:'한 스텝에 필요한 forward pass 횟수와 목표(target)의 출처가 다르다.',
 left:{t:'Π-model', items:['같은 입력을 2번 forward','두 예측의 차이를 직접 규제','스텝마다 2배 연산']},
 right:{t:'temporal ensembling', items:['입력마다 1번만 forward','EMA로 누적한 과거 예측이 목표','약 2배 빠르고 목표가 덜 시끄러움']}},

math:[
 {expr:'loss = -(1/|B|) Σ_{i∈B∩L} log zi[yi] + w(t)·(1/(C|B|)) Σ_{i∈B} ||zi - z̃i||²',
  tex:'\\mathcal{L} = -\\frac{1}{|B|}\\sum_{i\\in B\\cap L}\\log z_i[y_i] \\;+\\; w(t)\\frac{1}{C|B|}\\sum_{i\\in B}\\lVert z_i-\\tilde{z}_i\\rVert^2',
  d:'첫째 항은 라벨 있는 데이터에만 걸리는 표준 교차 엔트로피, 둘째 항은 라벨 유무와 무관하게 모든 데이터에 걸리는 일관성(consistency) 항이다. $w(t)$는 점진적으로 커지는 비지도 손실 가중치.'},
 {expr:'Z ← αZ + (1-α)z,   z̃ ← Z / (1 - α^t)',
  tex:'Z \\leftarrow \\alpha Z + (1-\\alpha)z,\\qquad \\tilde{z} \\leftarrow \\dfrac{Z}{1-\\alpha^{t}}',
  d:'temporal ensembling의 목표 갱신식. $Z$는 epoch마다 누적되는 지수이동평균, $\\alpha$는 momentum(감쇠율), $t$는 epoch 번호. 분모의 편향 보정이 없으면 초기 epoch의 목표가 0에 지나치게 쏠린다.'}
],

numbers:[
 {k:'SVHN · 500 라벨', v:'오차 18.44% → 7.05%', d:'증강 없이, 준지도 학습 당시 SOTA를 큰 폭 경신'},
 {k:'SVHN · 500 라벨 + 증강', v:'오차 5.12%', d:'표준 증강(무작위 이동)까지 켰을 때'},
 {k:'CIFAR-10 · 4000 라벨', v:'오차 18.63% → 16.55%', d:'증강 없이; 증강 포함 시 12.16%'},
 {k:'CIFAR-10 · 전체 라벨(완전지도)', v:'오차 6.90%', d:'Π-model을 전부 라벨 있는 데이터에 적용해도 정칙화로서 이득이 남음'},
 {k:'temporal ensembling 속도', v:'Π-model 대비 약 2배', d:'epoch당 forward pass가 1회로 줄어든 결과'}
],

impact:'이 논문은 "라벨 없는 데이터에 무엇을 목표로 줄 것인가"라는 준지도 학습의 핵심 질문에 **자기 자신의 과거 예측**이라는 간단하고 강력한 답을 제시했다. Π-model·temporal ensembling이 직접 쓰이는 경우는 줄었지만, "모델 예측의 이동평균을 목표로 쓴다"는 발상은 곧이어 나온 Mean Teacher(가중치의 EMA로 확장)를 거쳐 `[UDA](#/p/uda)`·`[Noisy Student](#/p/noisy-student)` 등 현대 일관성 정칙화 계열 전체의 공통 뼈대가 되었다.',

legacy:[
 '**일관성 정칙화 계열의 시작점** — 예측의 EMA(temporal ensembling)에서 가중치의 EMA(Mean Teacher)로 발전하며 저장 비용 문제를 해결',
 '**램프업 스케줄·편향 보정** 같은 세부 장치들이 이후 준지도·자기지도 학습 레시피의 표준 관행으로 굳어짐',
 '**틀린 라벨에 대한 견고성**이라는 부수 효과가, 이후 잡음이 있는 라벨(noisy label) 학습 연구에서 참조점으로 쓰임',
 '**"자기 자신의 과거 출력을 목표로 쓴다"는 발상**이 `[BYOL](#/p/byol)` 같은 자기지도 학습의 self-distillation 구조와도 맥이 닿음'
],

pitfalls:[
 '**Π-model과 temporal ensembling을 혼동하면 안 된다.** 전자는 한 스텝에 forward pass 2회로 직접 비교하고, 후자는 1회 forward + 과거 예측의 이동평균을 목표로 쓴다 — 속도와 목표의 안정성이 다르다.',
 '**temporal ensembling은 예측을 저장한다(Mean Teacher는 가중치를 저장한다).** 데이터셋 전체 크기 × 클래스 수 만큼의 행렬 $Z$를 유지해야 해서, 대규모 데이터셋에는 메모리 비용이 크다 — 이 문제를 가중치 EMA로 해결한 것이 후속 Mean Teacher다.',
 '**비지도 손실 가중치 $w(t)$의 램프업을 빼먹으면 재현되지 않는다.** 초기부터 비지도 손실을 강하게 걸면 초반의 부정확한 예측이 스스로 강화되어 오히려 성능이 나빠질 수 있다.'
],

figures:[
 {f:'fig1-pi-vs-temporal.png',
  cap:'위: Π-model — 같은 입력 $x_i$를 서로 다른 증강·dropout으로 두 번 통과시켜 $z_i$·$\\tilde{z}_i$를 얻고 그 제곱차를 손실에 더한다. 아래: temporal ensembling — 네트워크를 한 번만 통과시키고, 과거 예측을 누적한 $\\tilde{z}_i$(그림 왼쪽에서 입력으로 들어옴)와 비교한다. 두 경로 모두 라벨 $y_i$가 있는 입력에만 cross-entropy가 걸리고, $w(t)$가 비지도 항(squared difference)의 가중치를 조절한다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'This ensemble prediction can be expected to be a better predictor for the unknown labels than the output of the network at the most recent training epoch, and can thus be used as a target for training.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1610.02242 — Temporal Ensembling for Semi-Supervised Learning', u:'https://arxiv.org/abs/1610.02242'}
]
});
