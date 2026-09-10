WIKI.paper({
slug:'wide-resnet',
venue:'BMVC 2016',
authors:'Zagoruyko & Komodakis (École des Ponts ParisTech)',
arxiv:'1605.07146',

tldr:'"더 깊게"만 밀어붙이던 ResNet 경쟁에 제동을 건 논문. 16층짜리 **얕고 넓은** ResNet이 1000층짜리 얇은 ResNet과 같은 정확도를 내면서 몇 배 더 빨리 학습된다는 것을 보였다.',

context:'[ResNet](#/p/resnet)은 residual connection 덕에 층을 1000개 넘게 쌓아도 학습이 된다는 것을 보였고, 이후 연구는 그 최적의 정답이 "더 깊게"라고 여겼다. 하지만 층 하나를 늘릴 때마다 얻는 정확도 개선은 점점 작아지는데 학습 시간은 거의 층 수에 비례해 늘어난다. 저자들은 이 **diminishing feature reuse** 문제를 지적한다 — gradient가 identity 경로로 그냥 흘러가 버릴 수 있어서, 아주 깊은 네트워크에서는 많은 블록이 사실상 아무것도 배우지 않거나 서로 거의 같은 정보만 반복해서 나른다는 것이다. 그렇다면 "깊이"가 정말 성능의 원천인가, 아니면 단지 파라미터 수가 늘어난 효과인가?',

ideas:[
 {h:'깊이(depth)와 너비(width)를 분리해서 측정',
  lead:'파라미터 수를 맞춘 채 깊이 인자 $l$과 너비 인자 $k$를 각각 바꿔가며 비교한다.',
  d:'블록 안의 conv 개수를 **deepening factor** $l$, 채널 수 배수를 **widening factor** $k$로 정의하고 표기법 WRN-$n$-$k$($n$=총 conv층 수)를 쓴다. 같은 파라미터 예산에서 $l$을 늘리는 것과 $k$를 늘리는 것을 비교하면, 너비를 키우는 쪽이 일관되게 더 낫거나 같았다.'},
 {h:'WRN-16-8이 ResNet-1000보다 낫다',
  lead:'16층 넓은 네트워크가 1000층 얇은 네트워크와 같은 정확도를 몇 배 빠르게 낸다.',
  d:'원 ResNet 논문의 결론과 반대로, 극단적인 깊이는 정규화 효과를 주지 않는다. CIFAR-10/100에서 WRN-28-10(36.5M 파라미터)은 ResNet-1001(10.2M)을 각각 0.92%p·3.46%p 앞섰고, 파라미터는 3.6배 많지만 forward+backward 시간은 오히려 더 빠르다 — GPU는 얇고 긴 순차 연산보다 넓고 병렬적인 행렬곱을 훨씬 잘 소화하기 때문이다.'},
 {h:'residual block 안에 dropout을 다시 넣는다',
  lead:'conv와 conv 사이(항등 경로가 아니라)에 dropout을 넣어야 효과가 있다.',
  d:'너비가 커지면 파라미터도 늘어 과적합 위험이 커진다. 이전 시도들은 residual identity 경로에 dropout을 걸었지만 이 논문은 **두 conv 사이**에 넣는 wide-dropout 블록을 제안한다. 이 배치가 identity 경로의 정보 흐름은 건드리지 않으면서 정규화 효과만 준다.'},
 {h:'block type 자체는 큰 차이를 만들지 않는다',
  lead:'conv3x3 두 겹의 기본(basic) 블록이 bottleneck 등 다른 변형과 비슷하거나 더 낫다.',
  d:'B(3,3) 같은 기본 블록, B(1,3,1) bottleneck, B(3,1) 등 여러 블록 구성을 같은 파라미터 수로 비교했다. 파라미터가 비슷하면 성능 차이는 크지 않았고, 오히려 conv 개수가 적은 블록(파라미터당 비선형성이 적은 쪽)이 약간 유리했다 — 블록 내부 설계보다 **전체 너비**가 지배적 변수라는 뜻이다.'}
],

diagram:{type:'compare', cap:'같은 파라미터 예산이라도 깊이 대신 너비에 쓰는 편이 정확도·속도 모두에서 이겼다.',
 left:{t:'ResNet-1001', items:['1001층 · 10.2M 파라미터','CIFAR-100 22.71%','얇고 순차적 → GPU 저활용']},
 right:{t:'WRN-28-10', items:['28층 · 36.5M 파라미터','CIFAR-100 19.25%','넓고 병렬적 → 1.6배 빠름'], acc:true}
},

numbers:[
 {k:'CIFAR-10 test error', v:'4.00%', d:'WRN-28-10, ResNet-1001(4.92%)보다 낮고 파라미터는 3.6배'},
 {k:'CIFAR-100 test error', v:'19.25%', d:'WRN-28-10, ResNet-1001(22.71%) 대비 -3.46%p'},
 {k:'속도', v:'1.6~8배 빠름', d:'WRN-28-10은 ResNet-1001보다 1.6배, 동정확도 WRN-40-4는 8배 빠름'},
 {k:'dropout 효과', v:'1.85% → 1.64%', d:'WRN-16-4에 block 내부 dropout 추가 시 CIFAR-10 오류 감소'},
 {k:'ImageNet', v:'50층 wide > 152층 thin', d:'50층 wide ResNet이 152층 원 ResNet을 능가'}
],

math:[
 {expr:'params(l, k) ∝ l · k² · d  (블록 conv 수 l, 너비 배수 k, 블록 수 d)',
  tex:'\\text{params}(l,k)\\;\\propto\\; l\\cdot k^{2}\\cdot d',
  d:'파라미터 수는 깊이 인자 $l$과 블록 수 $d$에는 선형으로, 너비 인자 $k$에는 제곱으로 비례한다. 같은 파라미터 예산에서 $k$를 조금만 키워도 표현력이 크게 늘어나는 이유다.'}
],

impact:'ResNet 이후 "더 깊이"가 곧 정답이라는 암묵적 합의에 실험적으로 반박한 논문이다. WRN-28-10은 이후 몇 년간 CIFAR 벤치마크의 사실상 표준 백본이 되어 [SGDR](#/p/sgdr) 같은 최적화 기법 논문들이 공통으로 채택하는 실험 플랫폼 역할을 했다. "파라미터가 같다면 넓게 쌓는 편이 GPU 효율이 좋다"는 관찰은 이후 [EfficientNet](#/p/efficientnet)류의 depth-width-resolution 균형 탐구로 이어졌다.',

legacy:[
 '**CIFAR 벤치마크의 표준 백본화** — [SGDR](#/p/sgdr)을 비롯해 학습률 스케줄·정규화 논문 다수가 WRN-28-10을 실험 대상으로 채택',
 '**깊이 vs 너비 논쟁의 재점화** — 이후 [EfficientNet](#/p/efficientnet)의 compound scaling이 깊이·너비·해상도를 함께 조정하는 방향으로 발전',
 '**dropout 재도입** — [배치정규화](#/p/batchnorm) 시대에 밀려났던 [드롭아웃](#/p/dropout)을 residual block 내부라는 새 위치에 다시 배치해 유효성을 보임',
 '**GPU 효율이 설계 변수로 편입** — 정확도뿐 아니라 "얼마나 병렬화되는가"가 아키텍처 비교의 명시적 축이 됨'
],

pitfalls:[
 '**"항상 넓을수록 좋다"가 결론이 아니다.** 너비를 과도하게 늘리면 과적합이 커지고, 논문도 $k$가 커질수록 dropout 같은 정규화가 필요하다고 명시한다.',
 '**깊이가 무의미하다는 주장이 아니다.** 저자들은 depth의 효과가 "보조적(supplementary)"이라 했을 뿐, 일정 수준의 깊이 자체는 여전히 필요하다.',
 '**속도 이득은 하드웨어 의존적이다.** 논문의 8배 수치는 Titan X + cuDNN v5 기준이며, 넓은 conv가 병렬화에 유리하다는 경향은 일반적이지만 절대 배율은 GPU·프레임워크에 따라 달라진다.'
],

figures:[
 {f:'fig1-blocks.png',
  cap:'네 가지 residual block 변형. (a) 기본 conv3x3 두 겹, (b) 1x1-3x3-1x1 bottleneck, (c) 채널을 넓힌 basic-wide, (d) 두 conv 사이에 dropout을 끼운 wide-dropout — 이 논문이 제안하는 배치.',
  src:'원문 Figure 1, p.2'},
 {f:'fig4-speed.png',
  cap:'왼쪽 두 막대(연보라)가 얇은 ResNet(164·1004층), 오른쪽 세 막대(분홍)가 wide ResNet. 막대 높이가 forward+backward 시간(ms), 막대 위 숫자가 CIFAR-10 test error. WRN-40-4(68ms)가 ResNet-1004(512ms)와 비슷한 정확도를 8배 빠르게 낸다.',
  src:'원문 Figure 4, p.12'}
],

quotes:[
 {t:'we demonstrate that even a simple 16-layer-deep wide residual network outperforms in accuracy and efficiency all previous deep residual networks, including thousand-layer-deep networks',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1605.07146 — Wide Residual Networks', u:'https://arxiv.org/abs/1605.07146'},
 {t:'저자 공개 코드', u:'https://github.com/szagoruyko/wide-residual-networks'}
]
});
