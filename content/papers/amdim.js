WIKI.paper({
slug:'amdim',
venue:'NeurIPS 2019 (arXiv 2019)',
authors:'Bachman, Hjelm, Buchwalter (Microsoft Research · MILA)',
arxiv:'1906.00910',

tldr:'같은 이미지를 서로 다르게 증강한 두 뷰 사이에서, **여러 해상도(스케일)의 특징들끼리** 상호정보량을 최대화하도록 학습해 ImageNet linear evaluation 68.1%를 낸 자기지도 표현학습 논문. Local [Deep InfoMax](#/p/cpc)를 증강·멀티스케일·강한 인코더로 확장한 것이 전부다.',

context:'2019년 초, [CPC](#/p/cpc)는 "미래 조각을 과거 조각으로부터 맞히는" NCE 기반 상호정보량 하한을 이용해 자기지도 표현을 학습하는 길을 열었지만, 여전히 하나의 이미지 안에서 **전역(global) 특징과 지역(local) 특징 사이**의 관계만 봤다. Local DIM(Deep InfoMax)도 마찬가지로 원본 이미지 하나에서 뽑은 전역 벡터와 지역 벡터를 짝짓는 데 그쳤다. 이 논문의 질문은 단순하다 — **비교 대상을 같은 이미지의 단일 시점이 아니라, 독립적으로 증강한 서로 다른 뷰로, 그것도 여러 스케일에서 동시에 만들면 어떨까?** 사람이 다른 각도·다른 감각으로 같은 사건을 관측하고도 그것이 "같은 사건"이라고 알아채는 것에서 착안했다.',

ideas:[
 {h:'증강된 두 뷰 사이의 상호정보량 최대화',
  lead:'원본 이미지를 두 번 독립적으로 증강해 만든 $x^1, x^2$ 사이에서 정보를 공유시킨다.',
  d:'하나의 이미지 $x$에 random resized crop·color jitter·grayscale 변환을 두 번 독립적으로 적용해 $x^1, x^2$ 를 만든다. $x^1$의 전역 특징(antecedent)이 $x^2$의 지역 특징(consequent)을 다른 이미지들의 특징(negative)들 사이에서 골라내도록 [NCE](#/p/cpc) 손실로 학습한다. 같은 이미지의 단일 시점만 보던 local DIM과 달리, 증강 자체가 만드는 "뷰의 차이"가 신호원이 된다.'},
 {h:'멀티스케일 infomax: 여러 층의 특징을 동시에 짝짓는다',
  lead:'전역-지역 한 쌍이 아니라 1×1·5×5·7×7 여러 해상도 특징 쌍을 동시에 맞춘다.',
  d:'인코더의 최상위층(1×1, 전역 요약)뿐 아니라 중간층의 5×5, 7×7 지역 특징 맵까지 뽑아, 1-to-5·1-to-7·5-to-5 같은 여러 조합에서 동시에 상호정보량을 최대화한다. 특징을 한 쌍만 비교하던 local DIM보다 감독 신호가 훨씬 조밀해진다.'},
 {h:'효율적 NCE: 배치 안에서 네거티브를 재사용',
  lead:'배치 내 다른 이미지들의 특징을 통째로 네거티브 풀로 재사용해 10000개 이상 확보한다.',
  d:'매칭 점수는 단순 내적 $\\phi_1(f_1)^\\top \\phi_7(f_7)$ 로 계산하고, 한 배치의 모든 (antecedent, consequent) 쌍에 대해 다른 이미지의 consequent들을 통째로 negative로 재사용하는 동적 프로그래밍 방식을 써서 $|N_7|\\gg 10000$ 규모의 네거티브를 값싸게 확보한다. 점수가 불안정해지는 것을 막기 위해 제곱 점수에 대한 정규화 항($\\lambda=4\\text{e-}2$)과 $c\\tanh(s/c)$ 형태의 소프트 클리핑($c=20$)을 덧붙인다.'},
 {h:'receptive field를 제어하는 ResNet 인코더',
  lead:'패딩을 없애고 mean pooling으로 보상해, 두 특징의 수용영역이 과도하게 겹치지 않게 한다.',
  d:'표준 [ResNet](#/p/resnet)을 변형해 패딩을 쓰지 않고 각 블록 첫 레이어에서 mean pooling으로 다운샘플링을 대체했다. 두 위치의 수용영역이 지나치게 겹치면 과제가 너무 쉬워져(사실상 같은 픽셀을 보고 맞히는 꼴) 학습된 표현의 품질이 떨어지기 때문이다.'},
 {h:'혼합 표현: 곁다리로 나온 분할(segmentation) 능력',
  lead:'전역 특징을 k개 성분의 혼합으로 확장하면 부산물로 분할과 비슷한 동작이 나타난다.',
  d:'하나의 antecedent 특징 $f_1$ 대신 $k$개의 mixture 성분 $\\{f_1^1,...,f_1^k\\}$ 을 만들어 각각 다른 consequent를 예측하게 하면, 각 성분이 이미지의 서로 다른 영역(예: 전경/배경)에 자연스럽게 특화된다. 라벨을 준 적이 없는데도 분할과 유사한 행동이 부산물로 등장한다.'}
],

diagram:{type:'compare', cap:'(a) Local DIM은 증강 없이 한 이미지의 전역-지역 특징만 비교한다. (b) AMDIM은 두 번 독립 증강한 뷰 사이에서, 그것도 여러 해상도의 특징을 동시에 비교한다.',
 left:{t:'Local DIM', items:['원본 이미지 하나','전역 vs 지역 특징 1쌍','증강·멀티스케일 없음']},
 right:{t:'AMDIM', items:['독립 증강 2뷰 x¹, x²','1↔5, 1↔7, 5↔5 동시 매칭','NCE 정규화 + 클리핑']}},

math:[
 {expr:'L_Φ(f1, f7, N7) = -log[ exp(Φ(f1,f7)) / Σ_{f̃7∈N7∪{f7}} exp(Φ(f1,f̃7)) ]',
  tex:'\\mathcal{L}_\\Phi(f_1,f_7,N_7)=-\\log\\frac{\\exp(\\Phi(f_1,f_7))}{\\sum_{\\tilde f_7\\in N_7\\cup\\{f_7\\}}\\exp(\\Phi(f_1,\\tilde f_7))}',
  d:'표준 log-softmax 형태의 [NCE](#/p/cpc) 손실. antecedent $f_1$ 이 진짜 짝 $f_7$ 을 수많은 방해 요소(negative) $N_7$ 사이에서 골라내도록 한다.'},
 {expr:'Φ(f1, f7) = φ1(f1)ᵀ φ7(f7)',
  tex:'\\Phi(f_1(x),f_7(x)_{ij})\\triangleq\\phi_1(f_1(x))^{\\top}\\phi_7(f_7(x)_{ij})',
  d:'매칭 점수를 단순 내적으로 두어 대규모 negative 집합에 대해서도 $O(1)$ 에 가깝게 계산 가능하게 만든 것이 대규모 NCE를 실용적으로 돌린 핵심 트릭이다.'}
],

numbers:[
 {k:'ImageNet linear eval (AMDIM-large)', v:'68.1%', d:'직전 최고 대비 **+12%p 이상**, 동시기 [CMC](#/p/cmc)(60.1%) 대비 +8%p'},
 {k:'ImageNet linear eval (AMDIM-small)', v:'63.5%', d:'CPC-huge(61.0%)보다도 높음'},
 {k:'Places205 (ImageNet→Places 전이)', v:'55.0%', d:'직전 최고 대비 +7%p'},
 {k:'STL10 linear eval', v:'94.2%', d:'Fast AutoAugment 정책 적용 시 최고 성능'},
 {k:'CIFAR10 / CIFAR100 (large, linear)', v:'91.2% / 70.2%', d:'같은 시기 일부 완전지도 모델에 근접'},
 {k:'NCE negative 집합 크기', v:'|N7| ≫ 10000', d:'배치 내 다른 이미지의 특징을 재사용해 확보'}
],

impact:'CPC류의 "전역-지역 하나만 비교"하던 상호정보량 목적함수를 증강×멀티스케일로 확장해 성능을 크게 끌어올리며, 대조학습이 아직 제한적이던 2019년 중반 ImageNet self-supervised linear eval 68.1%로 SOTA를 갈아치웠다. 같은 시기 나온 [CMC](#/p/cmc)(여러 채널을 뷰로 씀)·[MoCo](#/p/moco)(큐 기반 대량 네거티브)와 함께, "무엇을 뷰로 삼고 무엇을 네거티브로 쓰는가"가 대조학습 성능을 좌우하는 핵심 설계 변수라는 것을 굳혔다. 다만 몇 달 뒤 [SimCLR](#/p/simclr)가 훨씬 단순한 구조(멀티스케일 없이 배치 내 대조만)로 이를 다시 앞지르면서, 멀티스케일·mixture 같은 장치보다 **강한 증강과 큰 배치/네거티브**가 더 결정적이라는 것이 이후 드러났다.',

legacy:[
 '**뷰 설계 경쟁의 시작** — [CMC](#/p/cmc)는 색상 채널을, AMDIM은 독립 증강을, [MoCo](#/p/moco)는 모멘텀 큐를 뷰·네거티브 확보 전략으로 채택하며 2019년 하반기 대조학습이 폭발적으로 갈라졌다',
 '**단순화로의 회귀** — [SimCLR](#/p/simclr)이 멀티스케일·mixture 같은 장치 없이 큰 배치와 강한 증강만으로 AMDIM을 앞지르면서, 복잡한 아키텍처보다 증강·배치 크기가 더 중요하다는 교훈이 자리잡았다',
 '**평가 프로토콜의 표준화** — Kolesnikov et al.의 재구현·재평가 프로토콜을 그대로 따른 것이 이후 self-supervised 논문들의 공정 비교 관행으로 이어졌다',
 '**mixture 기반 표현의 잔향** — 분할이 부산물로 나온다는 관찰은 이후 self-supervised segmentation·object discovery 연구에서 "대조학습이 객체성을 암묵적으로 배운다"는 가설의 초기 근거로 자주 인용됐다'
],

pitfalls:[
 '**"멀티스케일이 핵심 기여"로 오해하기 쉽지만, ablation(Table 3)에서 가장 큰 성능 개선은 증강 강도(특히 Fast AutoAugment)에서 나온다.** 멀티스케일과 NCE 정규화는 보조적 개선이다.',
 '**AMDIM-small과 AMDIM-large의 ImageNet 수치(63.5% vs 68.1%)를 표에서 혼동하기 쉽다.** 같은 논문 안에 크기·에폭이 다른 여러 변형이 있으므로 어느 설정값인지 반드시 확인해야 한다.',
 '**입력 해상도가 128×128로, 표준 ImageNet 224×224보다 작다.** 자원 제약 때문인데, 다른 self-supervised 방법과 비교할 때 이 차이를 간과하면 공정 비교가 아니게 된다.'
],

figures:[
 {f:'fig1-multiscale.png',
  cap:'(a) Local DIM: 원본 이미지 하나를 한 번만 증강해(오른쪽) 왼쪽(첫 통과)의 전역 벡터와 지역 특징을 맞춘다. (b) AMDIM: 왼쪽·오른쪽 모두 독립적으로 증강한 뷰이고, 여러 층(멀티레벨)의 전역·지역 벡터를 동시에 매칭한다(점선이 매칭 대상).',
  src:'원문 Figure 1(a)(b), p.5'}
],

quotes:[
 {t:'Maximizing mutual information between features extracted from these views requires capturing information about high-level factors whose influence spans multiple views.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1906.00910 — Learning Representations by Maximizing Mutual Information Across Views', u:'https://arxiv.org/abs/1906.00910'},
 {t:'공식 코드 (amdim-public)', u:'https://github.com/Philip-Bachman/amdim-public'}
]
});
