WIKI.paper({
slug:'elu',
venue:'ICLR 2016',
authors:'Clevert, Unterthiner & Hochreiter (Johannes Kepler University Linz)',
arxiv:'1511.07289',

tldr:'ReLU 계열이 음수 입력을 전부 0으로 죽이는 대신, 지수함수로 완만하게 음수값에 **포화**시켜 평균 활성값을 0 근처로 당기는 활성함수. [batchnorm](#/p/batchnorm) 없이도 배치정규화에 준하는 효과를 얻겠다는 것이 핵심 주장이다.',

context:'2015년 당시 표준 활성함수는 ReLU였고, 죽은 뉴런과 느린 수렴을 완화하려 LReLU·PReLU처럼 음수 구간에 작은 기울기를 주는 변형이 이미 나와 있었다. 그런데 ReLU·LReLU·PReLU는 모두 출력이 평균적으로 0보다 크다 — 뉴런이 항상 양수 쪽으로 치우친 값을 다음 층에 넘기면, 그 비대칭이 다음 층에 대해 일종의 편향(bias)처럼 작용해 가중치 업데이트 방향을 왜곡한다. 이를 **bias shift**라 부른다. [BatchNorm](#/p/batchnorm)은 매 층의 활성값을 명시적으로 정규화해 이 문제를 없앴지만 계산 비용과 배치 의존성이라는 대가를 치른다. 이 논문은 "정규화 층을 따로 두지 않고, 활성함수 자체의 모양만으로 평균을 0 쪽으로 당길 수 있는가"라는 질문에서 출발한다.',

ideas:[
 {h:'자연 gradient와 bias shift의 관계를 이론으로 연결',
  lead:'평균 활성값이 0에 가까울수록 표준 gradient가 Fisher 자연 gradient에 가까워짐을 증명한다.',
  d:'논문은 Amari의 자연 gradient(natural gradient) 관점에서, 다음 층 가중치 업데이트가 이전 층 활성값의 평균(bias shift)에 얼마나 좌우되는지를 정리(Theorem 1, 2)로 보인다. 결론은 단순하다 — **활성값의 평균이 0에 가까울수록 표준 gradient가 natural gradient에 더 가까워져 학습이 빨라진다.** ReLU처럼 항상 양수인 출력은 이 조건에서 가장 멀리 떨어져 있다.'},
 {h:'음수 구간을 지수함수로 포화시킨다',
  lead:'x>0은 항등, x≤0은 α(exp(x)−1)로 매끄럽게 −α에 수렴시킨다.',
  d:'ELU는 양의 입력에서는 ReLU와 똑같이 항등함수를 쓴다(vanishing gradient를 피하려면 이 구간의 기울기가 1이어야 한다는 점은 ReLU·LReLU와 동일). 음의 입력에서는 직선 대신 지수함수로 값을 눌러 $-\\alpha$ 라는 **유한한 값에 포화**시킨다. LReLU·PReLU도 음수값을 갖지만 입력이 작아질수록 출력도 무한히 작아지는 직선이라 "잡음에 강한 비활성 상태"를 만들지 못한다 — ELU는 포화 구간이 있어야 그것이 가능하다고 본다.'},
 {h:'포화가 주는 노이즈 강건성',
  lead:'큰 음수 입력은 전부 -α 근처로 뭉개져, 그 이하 구간의 미세한 차이가 다음 층에 전달되지 않는다.',
  d:'포화란 미분이 작아진다는 뜻이고, 이는 "얼마나 강하게 없는가"의 정보를 더 전달하지 않는다는 뜻이다. 저자들은 이것을 ReLU의 정확한 0과 같은 성질로 본다 — 어떤 개념이 **있다**는 것은 그 강도까지 코딩하지만, **없다**는 것은 굳이 얼마나 없는지 구분하지 않는 편이, 표현을 저잡음·저복잡도로 만든다는 논리다.'},
 {h:'α 하나로 포화값을 조절',
  lead:'하이퍼파라미터 α가 음수 쪽 포화 지점을 정하며, 실험은 대부분 α=1을 쓴다.',
  d:'$\\alpha$ 는 ELU가 음의 무한대로 갈 때 수렴하는 값을 정한다. GELU의 $\\Phi(x)$ 나 [Swish](#/p/swish)의 $\\beta$ 처럼 추가로 조정할 스칼라가 있다는 점에서, 이후 등장한 무파라미터 활성함수들과 갈라지는 지점이다. 논문의 모든 주요 실험은 $\\alpha=1.0$ 을 고정값으로 쓴다.'}
],

diagram:{type:'compare', cap:'셋 다 x>0에서는 항등이지만, 음수 구간을 어떻게 다루는지가 다르다.',
 left:{t:'ReLU / LReLU / PReLU',
  items:['음수 입력을 0 또는 작은 직선으로 처리','출력 평균이 항상 0보다 큼','LReLU·PReLU는 포화가 없어 무한히 감소','평균 활성 편향이 bias shift를 유발']},
 right:{t:'ELU: 지수 포화',
  items:['음수 구간을 exp로 -α까지 매끄럽게 포화','평균 활성값이 0에 더 가까워짐','포화로 잡음에 강한 비활성 상태 형성','x=0에서도 미분 연속(1차)']}},

math:[
 {expr:'f(x) = x (x>0),  f(x) = α(exp(x) − 1) (x≤0)',
  tex:'f(x)=\\begin{cases}x & x>0\\\\ \\alpha(\\exp(x)-1) & x\\le 0\\end{cases}',
  d:'양의 구간은 ReLU와 동일한 항등함수, 음의 구간은 $\\alpha$ 를 향해 지수적으로 접근하는 곡선이다. 실험에서는 $\\alpha=1.0$ 을 사용한다.'},
 {expr:"f'(x) = 1 (x>0),  f'(x) = f(x) + α (x≤0)",
  tex:"f'(x)=\\begin{cases}1 & x>0\\\\ f(x)+\\alpha & x\\le 0\\end{cases}",
  d:'음의 구간 미분이 $f(x)+\\alpha$ 로 자기 자신을 재사용해 계산이 싸다. $x\\to0^-$ 에서 $f(x)\\to0$ 이므로 미분이 $\\alpha$ 가 아니라 정확히 $1$ 로 수렴해, $x=0$ 에서 함수와 1차 도함수가 모두 연속이다.'}
],

numbers:[
 {k:'CIFAR-100 (BN 비교 실험)', v:'ELU 28.75% vs ReLU 31.56% vs LReLU 30.59% vs SReLU 29.35%', d:'BatchNorm 없이 11층 CNN, 10회 평균 ± 표준편차, ELU가 유의하게 최저(p<0.001)'},
 {k:'CIFAR-100 최종 (18층 CNN, Table 1)', v:'24.28%', d:'당시 multi-view·모델 평균 없이 낸 published 최고 기록'},
 {k:'CIFAR-10 최종 (18층 CNN, Table 1)', v:'6.55%', d:'Fractional Max-Pooling(4.50%)에 이어 2위, 상위 10위권'},
 {k:'ImageNet top-5 (single crop)', v:'10% 미만', d:'단일 모델·단일 center crop 기준'},
 {k:'ImageNet 수렴 속도', v:'top-5 20% 도달: 16만 iter (ELU) vs 20만 iter (ReLU)', d:'같은 15층 아키텍처, 활성함수만 교체'},
 {k:'ImageNet 학습 속도 부담', v:'12.15h vs 11.48h / 1만 iter', d:'exp 계산 때문에 ELU가 약 5% 느림'}
],

impact:'ELU는 "활성함수 하나로 BatchNorm과 비슷한 효과를 노린다"는 아이디어를 처음으로 대규모 실험으로 뒷받침한 논문이다. 실제로 BatchNorm 없이 ELU만 쓴 네트워크가 BatchNorm을 쓴 ReLU 네트워크를 능가하는 결과를 보였고, 발표 당시 CIFAR-100 SOTA를 갱신했다. 이론적으로는 자연 gradient와 bias shift를 연결해 "왜 음수 활성값이 학습에 도움이 되는가"에 답을 제시한 것이 이후 활성함수 연구 전반의 참조점이 되었다. 다만 파라미터 $\\alpha$ 를 갖는다는 점과 exp 연산의 비용은 이후 설계들이 넘어서려 한 지점이다.',

legacy:[
 '**SELU로 확장** — 같은 저자 그룹이 α·λ를 정밀하게 골라 self-normalizing 성질을 증명한 SELU(2017)를 내놓으며 ELU 계열의 이론을 더 밀어붙였다',
 '**탐색 기반 활성함수의 비교군** — [Swish](#/p/swish) 논문이 ReLU·LReLU·**ELU**를 나란히 놓고 강화학습 탐색으로 더 나은 함수를 찾으면서, ELU는 "사람이 설계한 최선"의 기준선이 되었다',
 '**무파라미터·매끄러운 게이팅으로 전환** — [GELU](#/p/gelu)와 Swish 모두 ELU처럼 음수 구간을 완전히 죽이지 않으면서도, α 같은 튜닝값 없이 입력 분포 자체(정규분포 CDF, sigmoid)로 게이팅을 정의하는 방향으로 나아갔다',
 '**BatchNorm과의 공존으로 정리** — 이후 실무는 "활성함수로 정규화를 대체"하기보다 [BatchNorm](#/p/batchnorm)/LayerNorm과 ReLU 계열을 표준 조합으로 굳혔고, ELU의 대안적 접근은 주류가 되지 못했다'
],

pitfalls:[
 '**이론적으로 우아했지만 실무 표준이 되지는 못했다.** CNN 비전 모델은 결국 BatchNorm+ReLU 조합으로 수렴했고, Transformer 계열은 [GELU](#/p/gelu)·[Swish](#/p/swish)를 택하면서 ELU는 두 진영 어디에서도 기본값 자리를 차지하지 못했다.',
 '**exp 연산 비용이 실제로 존재한다.** 논문 스스로 ImageNet에서 약 5% 느리다고 보고한다 — "활성함수는 학습 시간에 미미한 영향만 준다"는 것도 논문 자신의 서술이지만, 그 미미한 차이조차 이후 대규모 학습에서는 누적된다.',
 '**α는 ReLU 계열이 갖지 않던 튜닝 대상이다.** 논문은 $\\alpha=1.0$ 을 고정해 실험했을 뿐 이 값이 모든 과제에 최적이라는 것은 보이지 않는다. 이후 [GELU](#/p/gelu)·[Swish](#/p/swish)처럼 파라미터가 없거나 학습되는 형태가 더 널리 쓰이게 됐다.'
],

figures:[
 {f:'fig1-elu-curve.png',
  cap:'ReLU(자주, x<0에서 항상 0)·LReLU(초록, 완만한 음의 직선)·SReLU(갈색, -1에서 꺾여 평평)·ELU(파랑, α=1.0)를 겹쳐 그린 그래프. ELU만 음수 구간에서 곡선으로 -1을 향해 매끄럽게 포화된다.',
  src:'원문 Figure 1, p.5'}
],

quotes:[
 {t:'In contrast to ReLUs, ELUs have negative values which allows them to push mean unit activations closer to zero like batch normalization but with lower computational complexity.',
  src:'Abstract, p.1'},
 {t:'ELU networks significantly outperform ReLU networks with batch normalization.',
  src:'Section 4.2, p.7'}
],

links:[
 {t:'arXiv 1511.07289 — Fast and Accurate Deep Network Learning by Exponential Linear Units (ELUs)', u:'https://arxiv.org/abs/1511.07289'},
 {t:'OpenReview (ICLR 2016)', u:'https://openreview.net/forum?id=D-yQXsMk4-'}
]
});
