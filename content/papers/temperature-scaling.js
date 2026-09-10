WIKI.paper({
slug:'temperature-scaling',
venue:'ICML 2017',
authors:'Guo, Pleiss, Sun & Weinberger (Cornell University)',
arxiv:'1706.04599',

tldr:'2017년의 현대 신경망은 1990년대 모델보다 정확도는 훨씬 높아졌지만 **보정(calibration)은 오히려 나빠졌다**는 것을 실측으로 보이고, 검증셋에서 스칼라 하나(온도 $T$)만 맞추는 극도로 단순한 후처리로 그 문제의 대부분을 해결할 수 있음을 보였다.',

context:'분류기의 소프트맥스 출력을 "확률"이라 부르지만, 그 값이 실제 정답 확률과 일치한다는 보장은 없다. [msp-baseline](#/p/msp-baseline)이 소프트맥스 최댓값이 오분류·OOD를 어느 정도 가려낸다는 것을 보였다면, 이 논문은 그 값 자체가 **숫자로서 얼마나 정확한지**를 묻는다. LeNet 시절에는 신경망이 대체로 잘 보정돼 있었는데, [ResNet](#/p/resnet) 같은 현대 아키텍처에서는 정확도가 오른 것과 반대로 확신이 실제 정답률보다 훨씬 높게 부풀려져 있다는 것이 출발 관찰이다.',

ideas:[
 {h:'신뢰도 구간별로 정확도를 재는 reliability diagram',
  lead:'예측 확신도를 구간으로 나눠 각 구간의 실제 정답률과 비교하면 보정 여부가 한눈에 보인다.',
  d:'예측을 확신도(confidence) 구간 $M$개로 나눠, 각 구간에 속한 예측들의 평균 확신도(conf)와 실제 정답률(acc)을 나란히 그린다. 완벽하게 보정된 모델은 모든 구간에서 acc = conf인 대각선을 그리며, 두 값의 차이(gap)가 클수록 막대가 대각선에서 멀어진다.'},
 {h:'ECE(기대 보정 오차)로 한 숫자에 담기',
  lead:'전체 구간의 acc-conf 격차를 표본 수로 가중평균한 단일 스칼라 지표.',
  d:'reliability diagram은 시각화지만 비교·보고에는 스칼라가 필요하다. ECE는 각 구간의 |acc-conf| 를 그 구간에 속한 표본 비율로 가중평균한 값이다. 완벽히 보정된 모델은 ECE=0이며, 논문은 $M=15$ 구간을 기본으로 쓴다.'},
 {h:'용량과 정규화 부족이 원인이라는 진단',
  lead:'깊이·너비가 커질수록, 그리고 weight decay가 줄어들수록 ECE가 체계적으로 악화된다.',
  d:'네트워크 용량(깊이·필터 수)이 커지면 학습 데이터의 0/1 손실은 이미 포화됐는데도 NLL은 계속 줄어든다 — 이는 모델이 맞는 예측의 확신도를 계속 더 극단적으로 밀어붙인다는 뜻이다. 동시에 최근 아키텍처들이 [Batch Normalization](#/p/batchnorm) 도입 이후 weight decay를 거의 쓰지 않는 경향도 이 확신 과잉을 거든다는 것을 실험으로 확인한다.'},
 {h:'온도 스케일링: Platt scaling의 1-파라미터 버전',
  lead:'로짓 벡터 전체를 스칼라 $T$ 하나로 나누고 다시 소프트맥스를 취하는 것이 전부다.',
  d:'클래스별로 별도 파라미터를 학습하는 vector/matrix scaling과 달리, 온도 스케일링은 모든 클래스에 같은 $T$를 적용한다. $T$는 검증셋 NLL을 최소화하도록 단 하나의 값만 찾으면 되고, 예측 순위(어느 클래스가 1등인지)는 전혀 바꾸지 않으므로 정확도에 영향을 주지 않는다.'}
],

diagram:{type:'flow', cap:'학습이 끝난 모델의 로짓에 스칼라 하나만 끼워 넣는 후처리.',
 nodes:[
  {t:'로짓 z', s:'학습된 모델 출력'},
  {t:'T로 나누기', s:'검증셋 NLL 최소화', acc:true},
  {t:'소프트맥스', s:'다시 정규화'},
  {t:'보정된 확률', s:'순위는 그대로'}
 ]},

math:[
 {expr:'ECE = Σ_m (|B_m|/n) |acc(B_m) - conf(B_m)|',
  tex:'\\text{ECE} = \\sum_{m=1}^{M} \\frac{|B_m|}{n}\\,\\big|\\text{acc}(B_m) - \\text{conf}(B_m)\\big|',
  d:'$M$개의 동일 폭 구간(bin) $B_m$ 에 대해, 구간 표본 비율로 가중평균한 정확도-확신도 격차. $n$은 전체 표본 수.'},
 {expr:'q̂_i = max_k softmax(z_i / T)_k',
  tex:'\\hat{q}_i = \\max_k\\,\\sigma_{SM}(z_i/T)^{(k)}',
  d:'온도 스케일링의 정의 그 자체. $T>1$이면 소프트맥스가 완만해져(entropy 증가) 확신도가 낮아지고, $T \\to \\infty$ 면 $1/K$(최대 불확실성)로, $T=1$이면 원래 확률로 돌아간다.'}
],

numbers:[
 {k:'ResNet-110 (CIFAR-100) ECE', v:'16.53% → 1.26%', d:'보정 전 → 온도 스케일링 후, 15구간 기준'},
 {k:'CIFAR-100 분류 오류율', v:'LeNet 44.9% vs ResNet 30.6%', d:'ResNet이 정확도는 훨씬 높지만(Fig.1), 확신도-정확도 격차(Gap)는 오히려 ResNet 쪽이 더 크게 나타난다'},
 {k:'ImageNet · ResNet-152 ECE', v:'5.48% → 1.86%', d:'온도 스케일링만으로 대형 모델에서도 큰 개선'},
 {k:'binning 계열과 비교', v:'온도 스케일링 ≈ vector/matrix scaling', d:'파라미터 수가 훨씬 적은데도 histogram binning·isotonic·BBQ·vector/matrix scaling과 대등하거나 더 나은 ECE'},
 {k:'CIFAR-100 (SD) 학습 중 역전', v:'test error 29%→27%, NLL은 과적합 시작', d:'NLL 과적합이 시작된 이후에도 분류 정확도는 계속 개선되는 분리 현상(Fig.3)'}
],

impact:'"정확도가 오르면 모델이 더 믿을 만해진다"는 암묵적 가정을 무너뜨렸다. 이후 신경망을 실제 의사결정에 쓰려는 거의 모든 응용(의료·자율주행·능동학습)에서 검증셋 온도 스케일링이 배포 전 기본 후처리로 자리 잡았다. 구현이 몇 줄이고 정확도를 해치지 않는다는 점이 이 방법을 특히 널리 퍼뜨렸다 — [ODIN](#/p/odin)이 이 동일한 온도 파라미터를 보정이 아니라 OOD 탐지 목적으로 재활용한 것도 이 논문 덕분에 가능했다.',

legacy:[
 '**ODIN의 온도** — [ODIN](#/p/odin)이 이 논문의 온도 스케일링을 그대로 가져오되 목적을 "보정"에서 "in/out 분리"로 바꿔 재사용했다',
 '**앙상블·MC dropout과의 결합** — [deep-ensembles](#/p/deep-ensembles)·[mc-dropout](#/p/mc-dropout)이 제공하는 분포 자체의 보정 품질을 평가할 때 ECE가 표준 지표로 쓰이기 시작했다',
 '**post-hoc 보정 계열의 표준** — vector scaling, Dirichlet calibration 등 이후 제안된 보정 기법들이 모두 이 논문의 temperature scaling을 기본 비교 대상으로 삼는다',
 '**LLM 보정 논의로 확장** — 대형 언어모델의 확신도·환각 문제를 다룰 때도 "온도로 얼마나 고칠 수 있는가"가 여전히 반복되는 질문으로 남아 있다'
],

pitfalls:[
 '**정확도를 올려주는 방법이 아니다.** 온도 스케일링은 소프트맥스의 순위를 바꾸지 않으므로 top-1 정확도는 그대로다 — 오직 확신도 수치의 신뢰성만 고친다.',
 '**분포 이동(domain shift)에는 보장이 없다.** 검증셋과 같은 분포에서 보정됐다고 해서 [ODIN](#/p/odin)이 다루는 OOD 입력이나 적대적 입력에서도 보정이 유지된다는 뜻은 아니다.',
 '**단일 $T$ 는 클래스별 편향까지 고치지는 못한다.** vector/matrix scaling처럼 클래스마다 다른 파라미터를 주는 방법이 이론적으로는 더 표현력이 크지만, 이 논문은 데이터가 적을 때 오히려 과적합해 온도 스케일링보다 나빠지는 경우(Birds, CIFAR-100의 matrix scaling)를 함께 보고한다.'
],

figures:[
 {f:'fig1-reliability.png',
  cap:'위: 확신도 히스토그램(막대가 오른쪽에 쏠릴수록 모델이 자주 높은 확신을 보임), 아래: reliability diagram(파란 막대=실제 정확도, 빨간 Gap=대각선과의 격차). 왼쪽 5층 LeNet은 격차가 작고, 오른쪽 110층 ResNet은 확신도가 정확도보다 훨씬 높게 쏠려 있다 — "더 정확한 모델이 더 못 보정될 수 있다"는 이 논문의 핵심 관찰을 한 그림으로 보여준다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'We discover that modern neural networks, unlike those from a decade ago, are poorly calibrated.',
  src:'Abstract, p.1'},
 {t:'On most datasets, temperature scaling – a single-parameter variant of Platt Scaling – is surprisingly effective at calibrating predictions.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1706.04599 — On Calibration of Modern Neural Networks', u:'https://arxiv.org/abs/1706.04599'}
]
});
