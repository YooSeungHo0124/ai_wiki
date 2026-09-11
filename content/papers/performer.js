WIKI.paper({
slug:'performer',
venue:'ICLR 2021',
authors:'Choromanski, Likhosherstov, Dohan, Song et al. (Google · Cambridge · DeepMind · Alan Turing Institute)',
arxiv:'2009.14794',

tldr:'softmax attention을 **커널 함수로 재해석**하고, 그 커널을 양의 직교 랜덤 특징(FAVOR+)으로 근사해 attention을 $O(L^2)$이 아니라 $O(L)$ 시간·공간으로 계산한다. 희소성이나 저랭크 가정 없이, softmax attention을 **명시적 근사**로 선형화하는 접근이라는 점이 [Reformer](#/p/reformer) 같은 이산적 근사와 구별된다.',

context:'[Transformer](#/p/transformer)의 self-attention은 $QK^\\top$ 행렬을 명시적으로 만들기 때문에 시퀀스 길이 $L$에 대해 시간·공간 모두 $O(L^2)$이 든다. [Reformer](#/p/reformer)는 LSH로 가까운 토큰만 묶어 근사하고, [Linformer](#/p/linformer)는 저랭크 투영으로 근사하는 식으로 각기 다른 구조적 가정을 건다. 이 논문은 다른 각도에서 접근한다 — softmax attention 자체가 사실은 $\\exp(q^\\top k)$라는 **커널 함수**이고, 커널은 랜덤 특징(random features)으로 근사할 수 있다는 커널 방법론의 오래된 도구를 가져온다. 목표는 희소성·저랭크 같은 구조적 전제 없이, softmax의 값 자체를 임의 정밀도로 근사하는 것이다.',

ideas:[
 {h:'softmax attention을 커널로 다시 쓴다',
  lead:'attention 행렬의 각 항 $\\exp(q^\\top k)$를 커널 $K(x,y)=\\mathbb{E}[\\phi(x)^\\top\\phi(y)]$로 재해석한다.',
  d:"attention 행렬 $A(i,j)=\\exp(q_i^\\top k_j/\\sqrt d)$는 softmax 커널의 값이다. 커널 방법론에서는 어떤 커널이든 \"특징 사상(feature map)\" $\\phi$로 $K(x,y)=\\mathbb{E}[\\phi(x)^\\top\\phi(y)]$처럼 쓸 수 있다는 것이 잘 알려져 있다. 이렇게 쓰면 $A\\approx Q_r K_r^\\top$로 근사할 수 있어, $QK^\\top$를 명시적으로 만들지 않고 $Q_r(K_r^\\top V)$ 순서로 계산해 $L\\times L$ 행렬을 아예 만들지 않는다."},
 {h:'FAVOR+: 양의 값만 나오는 랜덤 특징을 쓴다',
  lead:'삼각함수(sin/cos) 대신 지수함수 기반의 **양수 전용** 랜덤 특징으로 softmax를 근사해 분산을 줄인다.',
  d:'softmax 커널을 랜덤 특징으로 근사하는 가장 자연스러운 방법은 sin/cos 기반 삼각 특징이다. 그런데 attention 점수는 원래 전부 양수(볼록결합 가중치)인데, sin/cos 특징은 음수 값도 낼 수 있어 점수가 0에 가까운(즉 관련성이 낮은) 영역에서 분산이 커지고 학습이 불안정해진다(부록에서는 NaN까지 관찰). FAVOR+는 $\\phi(x)=h(x)\\exp(\\omega^\\top x)/\\sqrt m$ 형태의 **항상 양수인** 특징 사상을 써서 이 문제를 없애고, 이론적으로 softmax를 편향 없이(unbiased) 추정한다.'},
 {h:'직교화(Orthogonal)로 분산을 한 번 더 줄인다',
  lead:'랜덤 방향 벡터 $\\omega_i$들을 서로 직교하게(iid 대신) 뽑아 추정 분산을 더 낮춘다.',
  d:'표준 랜덤 특징은 $\\omega_i$를 독립적으로(iid) 뽑지만, 이 논문은 Gram-Schmidt로 직교화한 $\\omega_i$를 쓰면 같은 개수의 랜덤 특징으로도 추정 오차의 상한이 더 좁아진다는 것을 증명한다(정리 1~4). 이 OR+ 부분이 FAVOR+라는 이름의 "OR"에 해당하며, 실험적으로도 IID보다 직교 특징이 더 낮은 근사 오차를 낸다.'},
 {h:'attention 순서만 바꿔 시간·공간을 선형으로 만든다',
  lead:'$(QK^\\top)V$ 대신 $Q(K^\\top V)$ 순서로 계산해 $L\\times L$ 행렬 생성을 피한다.',
  d:'랜덤 특징으로 $Q,K\\in\\mathbb{R}^{L\\times d}$를 $Q_r,K_r\\in\\mathbb{R}^{L\\times r}$($r\\ll L$)로 바꾼 뒤, 곱셈 순서를 $Q_r(K_r^\\top V)$로 바꾸면 중간 결과가 $r\\times d$ 크기에 그친다. 그 결과 시간 복잡도가 $O(L^2d)$에서 $O(Lrd)$로, 공간 복잡도가 $O(L^2+Ld)$에서 $O(Lr+Ld+rd)$로 줄어 둘 다 $L$에 대해 선형이 된다.'}
],

diagram:{type:'flow', cap:'FAVOR+가 attention 계산 순서를 바꿔 L×L 행렬을 아예 만들지 않는 과정.',
 nodes:[
  {t:'Q, K', s:'L×d'},
  {t:'랜덤 특징 사상 φ', s:'양수·직교', acc:true, a:'φ 적용'},
  {t:'Q_r, K_r', s:'L×r, r≪L'},
  {t:'K_rᵀV 먼저 계산', s:'r×d 크기만'},
  {t:'Q_r(K_rᵀV)', s:'O(Lrd) 시간'}
 ]},

math:[
 {expr:'A(i,j) = K(qᵢ, kⱼ),  K(x,y) = E[φ(x)ᵀφ(y)]',
  tex:'A(i,j)=K(q_i,k_j),\\qquad K(x,y)=\\mathbb{E}\\!\\left[\\phi(x)^{\\top}\\phi(y)\\right]',
  d:'softmax attention 행렬의 각 원소를 커널 값으로, 커널을 랜덤 특징의 내적 기댓값으로 쓴 것이 FAVOR+ 전체 이론의 출발점이다.'},
 {expr:'φ(x) = h(x)/√m · ( f₁(ω₁ᵀx), …, f_l(ω_mᵀx) )',
  tex:'\\phi(x)=\\frac{h(x)}{\\sqrt m}\\Big(f_1(\\omega_1^{\\top}x),\\dots,f_l(\\omega_m^{\\top}x)\\Big)',
  d:'FAVOR+가 쓰는 랜덤 특징의 일반형. softmax($\\text{SM}(x,y)=\\exp(x^\\top y)$)를 편향 없이 근사하려면 $h(x)=\\exp(\\lVert x\\rVert^2/2)$를 쓰고, $f$를 지수함수로 택해 특징 값이 **항상 양수**가 되게 한다 — sin/cos을 쓰는 기존 방식과의 결정적 차이.'},
 {expr:'time O(L d² log d), space O(Lr + Ld + rd)   vs 원본 O(L²d), O(L²+Ld)',
  tex:'\\underbrace{O(Ld^2\\log d)}_{\\text{FAVOR+ 시간}}\\ \\ \\text{vs}\\ \\ \\underbrace{O(L^2d)}_{\\text{원본}},\\qquad \\underbrace{O(Lr{+}Ld{+}rd)}_{\\text{FAVOR+ 공간}}\\ \\ \\text{vs}\\ \\ \\underbrace{O(L^2{+}Ld)}_{\\text{원본}}',
  d:'$L$에 대한 지수가 제곱에서 선형으로 떨어지는 것이 전부다. 다만 이 이득은 $L$이 충분히 커야 실제로 체감된다 — $r,d$가 고정 상수이므로 짧은 시퀀스에서는 상수항(오버헤드)이 오히려 더 크게 작용할 수 있다.'}
],

numbers:[
 {k:'복잡도', v:'O(L) 시간·공간', d:'원본 $O(L^2)$ 대비, $r\\ll L$일 때'},
 {k:'ImageNet64 비교', v:'Performer 6층 ≈ Reformer 12층', d:'L=12288 기준, 같은 정확도에 절반 층수'},
 {k:'Reformer 대비 속도', v:'최대 2배', d:'(U) 설정, TPU/GPU Jax 최적화 기준'},
 {k:'단백질 시퀀스 길이', v:'L=8192', d:'TrEMBL 단백질 상호작용 벤치마크, 일반 Transformer로는 다루기 힘든 길이'},
 {k:'근사 오차 실험', v:'L=4096, d=16', d:'랜덤 특징 수 $m$을 바꿔가며 양수 vs 삼각함수 특징의 MSE 비교'}
],

impact:'Performer는 "softmax attention을 근사할 뿐 다른 구조적 가정을 걸지 않는다"는 점에서 희소·저랭크 계열 효율 attention과 다른 갈래를 만들었다. 정확한 attention과 이론적으로 임의 정밀도로 가까워질 수 있다는 보장(정리 3, 4)은, 어떤 근사인지 불분명한 다른 방법들과 달리 오차를 정량적으로 통제할 수 있게 했다. 그러나 실무에서는 이 근사 자체가 대가다 — 랜덤 특징 수 $m$을 늘리면 정확도는 좋아지지만 그만큼 이득이 줄고, 짧은 시퀀스에서는 근사 오버헤드가 정확한 attention보다 오히려 느릴 수 있다.',

legacy:[
 '**효율 attention의 커널화 계열의 기준점** — [Reformer](#/p/reformer)(LSH 근사)·Linformer(저랭크)와 나란히 인용되며 "구조적 가정 없는 근사"라는 갈래를 대표',
 '**[FlashAttention](#/p/flashattention)과의 대비** — FlashAttention은 근사 없이 정확한 attention을 메모리 접근 패턴 최적화로 빠르게 만드는 반면, Performer는 근사를 대가로 점근 복잡도 자체를 낮춤 — "정확도 유지 + 하드웨어 최적화" vs "근사 허용 + 점근 복잡도 개선"이라는 두 갈래가 이후 효율 attention 연구를 나눔',
 '**커널 방법론의 재조명** — 랜덤 특징(random features)이라는 고전 커널 근사 기법을 대규모 attention에 재적용한 사례로, 이후 선형 attention 계열 연구에 이론적 도구를 제공',
 '**긴 시퀀스 도메인 확장** — 단백질 상호작용 모델링처럼 $L$이 수천~수만에 이르는 생물정보학 응용에 attention을 적용 가능하게 함'
],

pitfalls:[
 '**짧은 시퀀스에서는 이득이 없거나 오히려 손해다.** 복잡도 개선은 점근적($L\\to\\infty$)인 이야기이고, 랜덤 특징 계산 자체의 오버헤드와 근사 오차가 있어 $L$이 작을 때는 일반 attention보다 느리거나 부정확할 수 있다 — Figure 3의 속도 곡선도 $L$이 작은 구간에서는 Transformer와 Performer 곡선이 거의 붙어 있다.',
 '**"희소성·저랭크 가정이 없다"는 것이 "오차가 없다"는 뜻은 아니다.** FAVOR+는 여전히 몬테카를로 근사이며, 랜덤 특징 수 $r$(또는 $m$)이 작으면 분산이 커진다. 정확도와 속도는 $r$을 통해 트레이드오프된다.',
 '**sin/cos 기반 랜덤 특징을 그대로 쓰면 학습이 망가질 수 있다.** softmax 점수가 항상 양수라는 성질을 무시하고 삼각함수 특징을 쓰면 점수가 0에 가까운 영역에서 분산이 폭발해 NaN까지 관찰됐다(부록 D.3) — FAVOR+의 양수 특징 설계가 이 문제를 해결하기 위한 핵심 장치다.'
],

figures:[
 {f:'fig3-speed-memory.png',
  cap:'가로축이 시퀀스 길이 $L$(로그 스케일), 세로축이 처리 시간(로그 스케일). 점선이 일반 Transformer, 실선이 Performer, 검은 X가 이론적 최대 속도(attention을 항등함수로 대체한 경우). $L$이 작을 때(그래프 왼쪽)는 Performer와 Transformer 곡선이 거의 붙어 있다가, $L$이 커질수록(오른쪽) 격차가 벌어진다 — Performer의 이득이 긴 시퀀스에서만 뚜렷하다는 것을 보여준다.',
  src:'원문 Figure 3, p.6'}
],

quotes:[
 {t:'We introduce Performers, Transformer architectures which can estimate regular (softmax) full-rank-attention Transformers with provable accuracy, but using only linear (as opposed to quadratic) space and time complexity, without relying on any priors such as sparsity or low-rankness.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2009.14794 — Rethinking Attention with Performers', u:'https://arxiv.org/abs/2009.14794'},
 {t:'Google AI Blog: Rethinking Attention with Performers', u:'https://research.google/blog/rethinking-attention-with-performers/'}
]
});
