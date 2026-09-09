WIKI.paper({
slug:'lr-scaling',
venue:'arXiv 2017 (Facebook AI Research)',
authors:'Goyal, Dollár, Girshick, Noordhuis, Wesolowski, Kyrola, Tulloch, Jia, He (Facebook)',
arxiv:'1706.02677',

tldr:'배치 크기를 $k$ 배로 키우면 학습률도 $k$ 배로 키우고, 학습 초반 몇 epoch은 학습률을 서서히 올리는 **warmup**을 쓰면, 배치 8192까지도 정확도 손실 없이 ResNet-50을 **256개 GPU로 1시간**에 학습할 수 있음을 보였다. 대규모 분산 학습의 사실상 표준 레시피가 된 논문.',

context:'[large-batch](#/p/large-batch)는 배치를 키우면 일반화가 나빠진다는 것을 보여줬지만, 그 실험은 배치를 키우면서 **다른 하이퍼파라미터를 전혀 조정하지 않은** 조건에서 나온 결과였다. 한편 GPU 클러스터로 학습을 병렬화하려면 워커 하나가 처리하는 미니배치가 커야 통신 오버헤드 대비 계산량이 늘어나 효율이 난다 — 즉 분산 학습의 경제성 자체가 큰 배치를 요구한다. 문제는 배치를 키우면 정말 최적화가 실패하는지, 아니면 그저 배치에 맞게 학습률을 조정하지 않았을 뿐인지가 불분명했다는 것이다. 이 논문은 [ResNet](#/p/resnet)-50 · ImageNet이라는 표준 벤치마크에서 이 질문에 실증적으로 답한다.',

ideas:[
 {h:'선형 스케일링 규칙(Linear Scaling Rule)',
  lead:'미니배치를 k배로 늘리면 학습률도 정확히 k배로 늘린다 — 다른 하이퍼파라미터는 그대로.',
  d:'$k$개의 작은 배치로 $k$ 스텝을 밟는 SGD와, 그것을 합친 큰 배치로 1스텝을 밟는 SGD가 gradient가 스텝 사이에 크게 변하지 않는다는 가정 아래 근사적으로 같아지려면, 큰 배치의 학습률이 작은 배치 학습률의 $k$ 배여야 한다는 유도에서 나온다. 규칙은 **하이퍼파라미터가 하나도 추가되지 않는다**는 점에서 단순하다 — weight decay 등 나머지는 전부 고정한다. 배치 256→8192(32배)로 키울 때 학습률도 0.1→3.2로 32배 키우는 식이다.'},
 {h:'Gradual warmup: 학습 초반만 학습률을 낮춰 서서히 올린다',
  lead:'큰 학습률로 바로 시작하면 발산하므로, 처음 몇 epoch 동안 학습률을 선형으로 target까지 올린다.',
  d:'선형 스케일링이 성립하려면 gradient가 스텝 사이에서 크게 변하지 않아야 하는데, 학습 초반 가중치가 무작위 초기화 근처일 때는 이 가정이 깨져 큰 학습률로 바로 시작하면 훈련 오차가 발산하거나 튄다. 저자들은 처음 5 epoch 동안 학습률을 낮은 값에서 목표 학습률(예: 3.2)까지 **선형으로 증가**시키는 gradual warmup을 제안한다. 이전에 쓰이던 constant warmup(낮은 학습률로 몇 epoch을 고정)은 8k 배치에서는 불충분해서, warmup이 끝나는 순간 오차가 튀는 문제가 있었다.'},
 {h:'"일반화 문제"가 아니라 "최적화 문제"였다는 재해석',
  lead:'큰 배치의 정확도 저하는 최적화 초반의 불안정성 때문이지, 배치 자체가 근본적으로 일반화를 해친다는 증거는 아니다.',
  d:'선형 스케일링+warmup을 적용하면 배치 8192에서도 훈련 곡선이 배치 256 baseline과 거의 겹친다(§2 Training error). 저자들은 이를 근거로 "적어도 ImageNet에서는, 큰 미니배치의 주된 문제는 최적화의 난이도이지 일반화 실패가 아니다"라고 [large-batch](#/p/large-batch)와 다른 결론을 명시적으로 제시한다. 다만 이 결론은 8192까지의 범위에서만 검증됐다는 단서가 붙는다.'},
 {h:'분산 SGD의 통신·구현 함정들을 체계적으로 정리',
  lead:'weight decay 스케일링, 배치정규화 통계, 셔플링 방식 등 사소해 보이지만 정확도를 무너뜨리는 구현 디테일을 명시한다.',
  d:'예컨대 momentum SGD를 쓸 때 학습률과 함께 momentum 보정항을 조정하지 않으면 선형 스케일링이 정확히 성립하지 않는다는 점, [배치정규화](#/p/batchnorm)의 통계는 워커 각각의 로컬 배치로 계산해야 한다는 점, 데이터 셔플링은 매 epoch 전체를 무작위로 섞어야 한다는 점 등을 실험으로 짚는다. 이런 항목들은 논문의 핵심 아이디어는 아니지만, **이후 모든 대규모 분산 학습 구현의 체크리스트**가 됐다.'},
 {h:'큰 배치를 실제 처리량 이득으로 전환하는 통신 엔지니어링',
  lead:'256개 GPU를 표준 이더넷으로 묶고도 약 90% 스케일링 효율을 달성해, 학습 시간을 실제로 선형에 가깝게 줄인다.',
  d:'분산 SGD은 워커 간 gradient를 all-reduce로 합쳐야 하는데, 워커 수가 늘면 통신이 병목이 되기 쉽다. 저자들은 recursive halving-doubling 알고리즘 기반 통신과 backward pass와 gradient 통신을 겹치는(overlap) 기법으로, 8개 GPU에서 256개 GPU로 32배 늘렸을 때 **약 90%의 스케일링 효율**을 달성했다. 이 엔지니어링이 있어야 "학습률만 조정하면 된다"는 알고리즘적 아이디어가 실제 1시간 학습이라는 결과로 이어진다.'}
],

diagram:{type:'flow', cap:'배치를 늘릴 때 정확도를 지키기 위한 처리 순서. 이 순서를 지키지 않으면(학습률만 키우거나 warmup 없이 시작하면) 발산하거나 정확도가 떨어진다.',
 nodes:[
  {t:'배치 256→8192', s:'k=32배'},
  {t:'학습률도 32배', s:'0.1 → 3.2', acc:true, note:'선형 스케일링 규칙'},
  {t:'초반 warmup', s:'5epoch 선형 증가'},
  {t:'나머지 하이퍼파라미터 고정', s:'weight decay 등 불변'},
  {t:'256 GPU 분산 학습', s:'~90% 효율'}
 ]},

math:[
 {expr:'ŵ_{t+1} = w_t − η̂ · (1/(kn)) Σ_{j<k} Σ_{x∈B_j} ∇l(x, w_t)',
  tex:'\\hat{w}_{t+1} = w_t - \\hat{\\eta}\\cdot \\frac{1}{kn}\\sum_{j=0}^{k-1}\\sum_{x\\in B_j} \\nabla l(x, w_t)',
  d:'$k$개의 크기 $n$ 배치를 합친 하나의 배치(크기 $kn$)로 1스텝을 밟는 SGD. 이것이 아래의 $k$스텝짜리 소배치 SGD와 근사적으로 같아지도록 $\\hat{\\eta}$ 를 정하는 것이 목표다.'},
 {expr:'Linear Scaling Rule: η̂ = k · η   (when minibatch n → kn)',
  tex:'\\hat{\\eta} = k \\cdot \\eta \\qquad \\text{when the minibatch size is multiplied by } k',
  d:'gradient가 연속된 $k$ 스텝 사이에서 거의 변하지 않는다는 근사 아래, 학습률을 배치 크기에 정비례해 키우면 큰 배치 1스텝이 작은 배치 $k$스텝의 누적 업데이트와 거의 같아진다. 이 근사는 학습 초반, 즉 가중치가 빠르게 변할 때는 깨진다 — 그래서 warmup이 필요하다.'}
],

numbers:[
 {k:'baseline 배치 256 top-1 오차', v:'23.60% ± 0.12', d:'η=0.1, 8 GPU, ResNet-50, 90 epoch'},
 {k:'배치 8192(gradual warmup) top-1 오차', v:'23.74% ± 0.09', d:'η=3.2 — baseline과 0.14%p 차이로 사실상 동급'},
 {k:'최대 검증 배치 크기', v:'8192', d:'이 지점까지 정확도 손실 없음을 확인(Figure 1)'},
 {k:'학습 시간', v:'1시간', d:'ResNet-50, 256 GPU(Tesla P100), Caffe2'},
 {k:'baseline 학습 시간', v:'29시간', d:'8 GPU · 배치 256 기준 — 32배 GPU로 약 29배 단축'},
 {k:'스케일링 효율', v:'~90%', d:'8→256 GPU로 늘릴 때 이상적 선형 단축 대비 달성한 비율'}
],

impact:'ImageNet 학습 시간을 며칠에서 1시간으로 줄인 실용적 성과 자체도 컸지만, 더 크게는 **"배치 크기를 늘려도 학습률만 같이 조정하면 된다"**는 단순한 레시피를 데이터로 정착시켰다는 점이 중요하다. 이후 모든 대규모 사전학습(비전·언어 불문)이 이 규칙과 warmup을 기본값으로 채택했고, 이는 [GPT](#/p/gpt1) 계열을 포함한 현대 LLM 학습 스크립트의 학습률 스케줄 표준(warmup + decay)의 직접적 뿌리가 됐다. 동시에 [large-batch](#/p/large-batch)가 제기한 "sharp minima" 우려에 대한 실증적 반례로도 인용되며, 일반화 격차 논쟁의 흐름을 최적화 난이도 쪽으로 옮기는 데 기여했다.',

legacy:[
 '**분산 학습의 사실상 표준 레시피** — 선형 스케일링 + warmup은 이후 거의 모든 대규모 이미지·언어 모델 학습 스크립트의 기본값이 됨',
 '**warmup + decay 학습률 스케줄의 정착** — [GPT](#/p/gpt1) 이후 LLM 사전학습 전반에서 "몇 스텝 warmup 후 cosine/linear decay" 패턴의 출발점',
 '**임계 배치 크기 연구로 확장** — [empirical-batch](#/p/empirical-batch)가 "얼마나 더 배치를 키울 수 있는가"를 gradient noise scale로 정량화하며 이 논문의 실증적 관찰을 이론으로 뒷받침',
 '**LARS·LAMB 등 후속 대규모 배치 옵티마이저의 출발점** — 32k 이상의 초대형 배치를 다루기 위한 layer-wise adaptive learning rate 기법들이 이 논문의 한계(8192)를 넘어서려는 시도로 등장'
],

pitfalls:[
 '**"학습률만 키우면 무한히 배치를 키울 수 있다"가 아니다.** 이 논문이 검증한 범위는 배치 8192까지이며, Figure 1은 16k 이상에서 오차가 다시 급격히 나빠짐을 보여준다 — 선형 스케일링에는 명백한 한계가 있다.',
 '**"큰 배치의 일반화 문제는 없다"는 결론이 아니다.** 저자들은 "적어도 ImageNet에서는(at least on ImageNet)"이라는 단서를 달았다. 다른 데이터셋·태스크에서는 [large-batch](#/p/large-batch)의 sharp minima 우려가 여전히 유효할 수 있다.',
 '**구현 디테일을 생략하면 재현되지 않는다.** weight decay를 학습률과 함께 스케일링하지 않거나, batchnorm 통계를 워커 전체로 합치는 등 사소해 보이는 선택 하나가 정확도를 크게 무너뜨릴 수 있다 — 논문 §3의 함정 목록이 핵심 아이디어만큼 중요하다.'
],

figures:[
 {f:'fig1-error-vs-batch.png',
  cap:'x축이 미니배치 크기(로그 스케일, 64~64k), y축이 ImageNet top-1 검증 오차. 64부터 8k까지는 오차가 거의 수평(약 23.5%)으로 유지되다가, 16k를 넘는 순간부터 급격히 치솟는다 — 선형 스케일링 규칙이 통하는 구간과 무너지는 구간의 경계를 한눈에 보여준다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'Linear Scaling Rule: When the minibatch size is multiplied by k, multiply the learning rate by k.',
  src:'Section 2.1, p.2'},
 {t:'Our comprehensive experiments in §5 show that optimization difficulty is the main issue with large minibatches, rather than poor generalization (at least on ImageNet).',
  src:'Section 1, p.1'}
],

links:[
 {t:'arXiv 1706.02677 — Accurate, Large Minibatch SGD', u:'https://arxiv.org/abs/1706.02677'}
]
});
