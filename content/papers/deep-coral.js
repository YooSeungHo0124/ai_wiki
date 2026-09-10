WIKI.paper({
slug:'deep-coral',
venue:'ECCV 2016 Workshop (TASK-CV)',
authors:'Baochen Sun, Kate Saenko (UMass Lowell · Boston University)',
arxiv:'1607.01719',

tldr:'적대적 학습도, 판별기도 없이 **소스와 타깃 특징의 공분산 행렬 차이를 손실 하나로 줄이는** 도메인 적응. [DANN](#/p/dann) 같은 min-max 게임 없이도 경쟁력 있는 성능을 낸다는 것을 보였다.',

context:'DANN을 비롯한 적대적 도메인 적응은 특징 추출기와 도메인 판별기를 동시에 학습해야 해서, 두 네트워크의 균형을 맞추는 튜닝이 필요하고 학습이 불안정해지기 쉽다. 한편 얕은 방법인 CORAL(Sun et al., 2016)은 선형 변환 하나로 소스·타깃의 2차 통계량(공분산)을 맞춰 "frustratingly easy"한 도메인 적응을 이미 보여준 바 있다. 이 논문의 질문은 단순하다 — **그 선형 CORAL을 신경망 안에 손실 함수로 집어넣어 end-to-end로 미분 가능하게 만들면 어떻게 되는가?**',

ideas:[
 {h:'CORAL 손실: 공분산 행렬의 거리',
  lead:'소스·타깃 특징의 공분산 행렬 차이를 Frobenius 노름으로 줄이는 손실 하나를 추가한다.',
  d:'같은 네트워크(가중치 공유)로 소스와 타깃 배치를 통과시켜 마지막 층 활성화 $D_S, D_T$ 를 얻고, 그 공분산 $C_S, C_T$ 의 차이를 손실로 쓴다. 판별기도, 적대적 min-max도 없다 — 그냥 하나의 스칼라 손실을 분류 손실에 더해서 역전파하면 끝이다.'},
 {h:'분류 손실과의 공동 학습이 필수',
  lead:'CORAL 손실만 최소화하면 특징이 한 점으로 붕괴할 수 있어 분류 손실과 함께 학습한다.',
  d:'CORAL 손실만 줄이려 하면 네트워크가 소스·타깃 데이터를 전부 같은 점으로 매핑해 공분산을 trivial하게 0으로 만들 수 있다. 그러면 분류가 불가능해진다. 그래서 분류 손실과 CORAL 손실을 가중합해 함께 최적화하고, 학습 말미에는 두 손실의 크기가 비슷해지도록 가중치 $\\lambda$ 를 정한다.'},
 {h:'배치 공분산 + 임의의 층에 적용 가능',
  lead:'미니배치 단위로 공분산을 추정하고, 어느 층에든 CORAL 손실을 붙일 수 있다.',
  d:'전체 데이터셋의 공분산 대신 미니배치 안에서 공분산을 계산해 SGD와 자연스럽게 맞춘다. 논문은 단순성을 위해 마지막 fc8 층 하나에만 CORAL 손실을 적용하지만, 여러 층에 동시에 적용하도록 일반화한 손실식도 함께 제시한다.'}
],

diagram:{type:'compare', cap:'같은 CNN을 두 도메인에 가중치 공유로 통과시키고, 마지막에 분류 손실과 CORAL 손실을 함께 건다.',
 left:{t:'DANN: 적대적 정렬', items:['도메인 판별기 별도 학습','GRL로 min-max 게임','λ 스케줄링 필요']},
 right:{t:'Deep CORAL: 통계량 정렬', items:['판별기 없음','공분산 거리만 최소화','손실 하나만 추가']}},

math:[
 {expr:'ℓ_CORAL = (1/4d²) ‖Cₛ − Cₜ‖²_F',
  tex:'\\ell_{CORAL} = \\frac{1}{4d^2}\\,\\lVert C_S - C_T \\rVert_F^2',
  d:'$d$ 차원 특징의 소스 공분산 $C_S$ 와 타깃 공분산 $C_T$ 의 차이를 Frobenius 노름 제곱으로 잰다. $4d^2$ 로 나눈 것은 차원에 따라 손실 크기가 폭발하지 않도록 하는 정규화.'},
 {expr:'Cₛ = 1/(nₛ−1) · (Dₛᵀ Dₛ − (1/nₛ)(1ᵀDₛ)ᵀ(1ᵀDₛ))',
  tex:'C_S = \\frac{1}{n_S-1}\\Big(D_S^{\\top} D_S - \\frac{1}{n_S}(\\mathbf{1}^{\\top} D_S)^{\\top}(\\mathbf{1}^{\\top} D_S)\\Big)',
  d:'배치 내 $n_S$ 개 소스 표본의 특징 행렬 $D_S$ 로부터 공분산을 구하는 표준식(평균을 뺀 뒤 외적 평균). 타깃도 $C_T$ 로 동일하게 계산한다.'},
 {expr:'ℓ = ℓ_CLASS + Σᵢ λᵢ ℓ_CORAL',
  tex:'\\ell = \\ell_{CLASS} + \\sum_{i=1}^{t} \\lambda_i\\, \\ell_{CORAL}^{(i)}',
  d:'전체 손실은 분류 손실에 CORAL 손실(들)을 가중합한다. $t$ 는 CORAL 손실을 적용한 층의 개수 — 논문 실험은 $t=1$(fc8 하나)이다.'}
],

numbers:[
 {k:'Office-31 평균 · 6 shift', v:'72.1%', d:'A→D·A→W·D→A·D→W·W→A·W→D 평균. CNN(무적응) 70.1%, DAN 71.3%보다 높음'},
 {k:'Office-31 · A→D', v:'66.8%', d:'CNN 63.8%, 얕은 CORAL 65.7% 대비 개선 — 6개 shift 중 개선폭이 가장 큼'},
 {k:'Office-31 · A→W', v:'66.4%', d:'CNN 61.6%, DAN 63.8%보다 우세'},
 {k:'추가 손실 종류', v:'1개', d:'판별기·GAN 손실 없이 CORAL 손실 하나만 추가'},
 {k:'적용 층 수', v:'1개(fc8)', d:'다층 확장은 이론상 가능하지만 본 실험은 단일 층으로도 SOTA급'}
],

impact:'Deep CORAL은 도메인 적응에 굳이 적대적 학습이 필요하지 않다는 것을 보여준 대조군 역할을 했다. [DANN](#/p/dann)·[ADDA](#/p/adda) 계열이 판별기 학습의 안정성 문제와 씨름하는 동안, Deep CORAL은 "두 분포의 1·2차 모멘트를 맞추면 상당 부분 해결된다"는 더 단순한 가설을 실증했다. 이후 방법들을 평가할 때 "복잡한 적대적 정렬이 단순한 통계량 정렬보다 실제로 얼마나 나은가"를 따지는 기준선으로 자주 인용된다.',

legacy:[
 '**모멘트 매칭 계열의 기준선** — MMD 기반 DAN·DDC와 함께 "적대적이지 않은" 도메인 적응 갈래를 대표',
 '**단순함이 강점이라는 선례** — 손실 하나 추가로 끝나는 설계가 이후 여러 경량 도메인 적응 방법의 출발점이 됨',
 '**평가 기준선으로 정착** — [CyCADA](#/p/cycada) 등 이후 논문들이 비교 대상으로 CORAL 계열을 포함시킴',
 '**단일 손실의 한계도 함께 드러남** — 큰 도메인 격차(합성→실제 등)에서는 통계량 정렬만으로 부족해 [CyCADA](#/p/cycada) 같은 픽셀+특징 결합이 필요해짐'
],

pitfalls:[
 '**CORAL 손실만으로는 특징 붕괴를 막지 못한다.** 분류 손실과의 균형(λ)이 깨지면 공분산은 같아지지만 클래스 구분력을 잃은 표현이 나올 수 있다.',
 '**Office-31은 클래스 수 31개, 이미지 수 2,817장으로 소규모다.** 이 벤치마크의 성능 차이(0.7~1%p)는 대형 벤치마크로 일반화를 보장하지 않는다.',
 '**"적대적 학습보다 항상 낫다"는 주장이 아니다.** 이 논문은 Office-31 같은 비교적 작은 도메인 격차에서 단순함으로 경쟁력을 보인 것이며, GTA5→Cityscapes 같은 큰 격차는 다룬 적이 없다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'위·아래 CNN은 같은 가중치를 공유(shared)하며 소스·타깃 배치를 각각 통과시킨다. fc8 출력에서 classification loss(소스만)와 CORAL loss(소스·타깃 공분산 차이) 두 갈래로 갈라지는 것이 그림의 핵심.',
  src:'원문 Fig. 1, p.3'}
],

quotes:[
 {t:'CORAL is a "frustratingly easy" unsupervised domain adaptation method that aligns the second-order statistics of the source and target distributions with a linear transformation.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1607.01719 — Deep CORAL', u:'https://arxiv.org/abs/1607.01719'}
]
});
