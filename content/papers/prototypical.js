WIKI.paper({
slug:'prototypical',
venue:'NeurIPS 2017',
authors:'Jake Snell, Kevin Swersky, Richard S. Zemel (U. Toronto · Twitter · Vector Institute)',
arxiv:'1703.05175',

tldr:'클래스마다 지지집합 임베딩의 **평균 벡터(프로토타입)** 하나만 두고, 쿼리를 가장 가까운 프로토타입에 배정하는 극단적으로 단순한 few-shot 분류기. [MAML](#/p/maml)류의 복잡한 메타 학습 없이도 더 나은 정확도를 낸다는 것이 요점이다.',

context:'[Matching Networks](#/p/matching-net)는 지지집합의 모든 예시 각각과 쿼리를 비교하는 attention 기반 최근접이웃이었고, [MAML](#/p/maml)은 경사 하강 스텝을 메타 학습하는 쪽으로 복잡도를 높였다. 이 논문은 반대 방향으로 간다 — 지지집합을 개별 예시로 다루지 말고, 클래스마다 **평균 벡터 하나**로 뭉뚱그려도 되지 않을까? 저자들은 이 단순화가 성능을 깎지 않고 오히려 올린다는 것을 보인다.',

ideas:[
 {h:'프로토타입: 클래스 임베딩의 산술 평균',
  lead:'지지집합 안 같은 클래스 예시들을 임베딩한 뒤 평균 내 그 클래스의 대표 벡터로 삼는다.',
  d:'임베딩 함수 $f_\\phi$ 로 지지집합의 각 예시를 사상한 뒤, 클래스 $k$ 의 프로토타입 $c_k$ 를 그 클래스에 속한 임베딩들의 평균으로 정의한다. 지지집합 전체가 아니라 **클래스당 벡터 하나**로 요약되므로, 지지집합이 커져도 분류에 드는 비교 연산이 늘지 않는다.'},
 {h:'분류 = 프로토타입까지 거리의 softmax',
  lead:'쿼리 임베딩과 각 프로토타입 사이 거리에 음수 softmax를 취해 클래스 확률을 만든다.',
  d:'쿼리 $x$ 가 클래스 $k$ 에 속할 확률은 $-d(f_\\phi(x),c_k)$ 에 대한 softmax다. 거리 함수 $d$ 로 무엇을 쓰느냐가 결정적인데, 저자들은 널리 쓰이던 코사인 유사도 대신 **제곱 유클리드 거리**를 쓰면 정확도가 크게 오른다는 것을 실험으로 확인했다.'},
 {h:'왜 유클리드인가: Bregman divergence와 혼합 밀도 추정의 등가성',
  lead:'제곱 유클리드 거리 같은 Bregman divergence를 쓰면 평균이 곧 그 클러스터의 최적 대표점이 된다는 것이 수학적으로 보장된다.',
  d:'클래스 평균이 그 클래스에 속한 점들까지의 거리 합을 최소화하는 대표점이 되는 것은 거리 함수가 **Bregman divergence**(제곱 유클리드 거리 포함)일 때만 성립하는 성질이다. 이 조건 아래서 프로토타입 네트워크는 지수족 분포를 가정한 혼합 밀도 추정과 수학적으로 동치가 된다 — 반면 코사인 거리는 Bregman divergence가 아니라서 이 보장이 깨진다. 이것이 유클리드 거리가 코사인보다 잘 되는 이유의 이론적 설명이다.'},
 {h:'1-shot에서는 Matching Networks와 완전히 같아진다',
  lead:'클래스당 지지 예시가 하나뿐이면 평균이 곧 그 예시라서, 프로토타입 분류기와 [Matching Networks](#/p/matching-net)가 정확히 같은 식이 된다.',
  d:'클래스당 지지 예시가 하나뿐인 1-shot 상황에서는 $c_k=x_k$ 이므로 프로토타입까지 거리 비교는 [Matching Networks](#/p/matching-net)의 가중 최근접이웃과 동일해진다. 차이는 5-shot 이상에서 드러난다 — Matching Networks는 여전히 지지집합 전체에 attention을 걸지만, 프로토타입 네트워크는 평균으로 뭉쳐 제곱 유클리드 거리를 쓰면 **선형 분류기**로 재해석된다는 것을 논문이 직접 유도한다.'}
],

diagram:{type:'flow', cap:'클래스별 지지 예시를 평균 내 프로토타입을 만들고, 쿼리는 가장 가까운 프로토타입으로 분류된다.',
 nodes:[
  {t:'지지집합', s:'클래스당 K장'},
  {t:'임베딩 f_φ', s:'CNN'},
  {t:'클래스 평균', s:'프로토타입 c_k', acc:true},
  {t:'쿼리와 거리 계산', s:'제곱 유클리드'},
  {t:'softmax 분류', s:'-d에 대한 softmax'}
 ]},

math:[
 {expr:'c_k = (1/|S_k|) Σ_{(x_i,y_i)∈S_k} f_φ(x_i)',
  tex:'c_k=\\frac{1}{|S_k|}\\sum_{(x_i,y_i)\\in S_k} f_\\phi(x_i)',
  d:'클래스 $k$ 의 프로토타입은 그 클래스에 속한 지지집합 예시들의 임베딩 평균이다. 계산은 한 번의 평균 풀링뿐이다.'},
 {expr:'p_φ(y=k|x) = exp(-d(f_φ(x),c_k)) / Σ_k\' exp(-d(f_φ(x),c_k\'))',
  tex:'p_\\phi(y=k\\mid x)=\\dfrac{\\exp(-d(f_\\phi(x),c_k))}{\\sum_{k\'} \\exp(-d(f_\\phi(x),c_{k\'}))}',
  d:'쿼리 임베딩과 프로토타입 사이 거리의 음수에 softmax를 취해 클래스 분포를 만든다. 학습은 이 확률의 음의 로그가능도를 최소화하는 표준 SGD다.'}
],

numbers:[
 {k:'miniImageNet 5-way 1-shot', v:'49.42%', d:'유클리드 거리, [Matching Networks](#/p/matching-net) 43.56%·MAML 48.70%를 상회'},
 {k:'miniImageNet 5-way 5-shot', v:'68.20%', d:'MAML 63.11%보다 5%p 이상 높음'},
 {k:'Omniglot 5-way 1-shot / 20-way 1-shot', v:'98.8% / 96.0%', d:'Matching Networks·Neural Statistician을 모두 상회'},
 {k:'훈련 에피소드 구성(Omniglot)', v:'60-way · 5 query/class', d:'시험은 5-way·20-way인데 학습은 더 높은 way로 — "way를 늘려 학습"이 유리하다는 저자들의 발견'},
 {k:'학습-시험 샷 일치', v:'훈련 shot = 시험 shot', d:'저자들이 실험적으로 확인한 권장 사항'}
],

impact:'복잡한 메타 학습 장치 없이 "클래스 평균 + 거리"라는 사실상 최근접 중심점(nearest centroid) 분류기가 당대 최고 성능을 냈다는 것은, few-shot 학습에서 **귀납적 편향(inductive bias)을 단순화하는 것 자체가 이득**이 될 수 있음을 보여줬다. 거리 함수 선택(유클리드 vs 코사인)이 알고리즘 구조보다 더 큰 영향을 미친다는 것도 이 논문이 처음 정량적으로 짚은 지점이다.',

legacy:[
 '**단순 baseline의 재발견을 촉발** — 이후 few-shot 학습 연구에서 "복잡한 방법이 단순한 프로토타입/최근접이웃 baseline을 실제로 이기는가"를 검증하는 관행이 자리잡음',
 '**거리 함수 선택의 중요성 환기** — 유클리드 vs 코사인 비교 결과는 이후 metric-learning 계열 논문들이 거리 함수를 하이퍼파라미터로 명시적으로 보고하게 만듦',
 '**Bregman divergence 관점의 재사용** — 클러스터링과 few-shot 분류를 잇는 이론적 프레임이 후속 분석 연구에 인용됨',
 '**zero-shot으로의 자연스러운 확장** — 지지 예시 대신 클래스 메타데이터를 임베딩해 프로토타입을 만드는 변형을 같은 논문에서 함께 제시, few-shot과 zero-shot을 하나의 틀로 묶음'
],

pitfalls:[
 '**"프로토타입 네트워크가 항상 더 단순해서 이긴다"는 과장이다.** 1-shot에서는 [Matching Networks](#/p/matching-net)와 수학적으로 동일한 식이 되며, 차이는 5-shot 이상과 거리 함수 선택에서만 벌어진다.',
 '**유클리드 거리의 우위는 이 논문의 구조 자체보다 거리 함수 선택 효과일 수 있다.** 저자들도 Matching Networks에 유클리드 거리를 적용하면 함께 개선된다고 보고한다 — "Euclidean 거리가 낫다"는 발견과 "프로토타입 구조가 낫다"는 주장은 분리해서 읽어야 한다.',
 '**학습 시 way를 시험보다 높게 잡으라는 권고는 Omniglot 실험에서 나온 경험칙이다.** 모든 데이터셋에 그대로 일반화된다고 논문이 증명한 것은 아니다.'
],

figures:[
 {f:'fig1-fewshot.png',
  cap:'세 클래스(초록·주황·파랑)의 지지 예시(색 점)를 각각 평균 낸 것이 검은 점 c1·c2·c3(프로토타입). 흰 점 x가 쿼리이고, 점선이 각 프로토타입까지의 거리 — 가장 가까운 c2로 분류된다. 배경의 다각형은 프로토타입 사이 거리로 나뉘는 결정 경계.',
  src:'원문 Figure 1(a), p.2'}
],

quotes:[
 {t:'Prototypical networks are simpler and more efficient than recent meta-learning algorithms, making them an appealing approach to few-shot and zero-shot learning.',
  src:'Section 2, p.2'}
],

links:[
 {t:'arXiv 1703.05175 — Prototypical Networks for Few-shot Learning', u:'https://arxiv.org/abs/1703.05175'}
]
});
