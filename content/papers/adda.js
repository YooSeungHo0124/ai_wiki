WIKI.paper({
slug:'adda',
venue:'CVPR 2017',
authors:'Eric Tzeng, Judy Hoffman, Kate Saenko, Trevor Darrell (UC Berkeley · Stanford · Boston University)',
arxiv:'1702.05464',

tldr:'그동안 나온 적대적 도메인 적응 방법들을 **생성/판별·가중치 공유·적대적 손실**의 세 축으로 정리한 일반 프레임워크를 세우고, [DANN](#/p/dann)과 달리 비대칭(untied) 가중치와 표준 GAN 손실을 조합한 ADDA를 그 안에서 도출했다.',

context:'DANN 이후 CoGAN 같은 생성적 방법, DANN 같은 판별적 방법이 각자 다른 설계 선택으로 적대적 도메인 적응을 풀고 있었지만, 이들을 나란히 놓고 비교할 공통 틀이 없었다. 생성적 방법은 이미지를 직접 생성해 보여줄 수 있지만 판별 과제에는 최적이 아니었고, 판별적 방법(DANN 등)은 소스·타깃 인코더의 **가중치를 공유**하는 제약을 뒀다. 이 논문의 질문은 — **기존 방법들을 몇 개의 독립적인 설계 축으로 분해하면, 아직 아무도 시도하지 않은 조합이 남아있지 않은가?**',

ideas:[
 {h:'세 축으로 정리한 통합 프레임워크',
  lead:'모든 적대적 도메인 적응을 생성/판별 · 가중치 공유 · 적대적 손실 세 선택으로 환원한다.',
  d:'(1) 기반 모델이 **생성적**(이미지를 재구성/생성)인가 **판별적**(태스크에 필요한 특징만 뽑는가), (2) 소스 인코더 $M_s$ 와 타깃 인코더 $M_t$ 가 **가중치를 공유(tied)**하는가 **독립(untied)**인가, (3) 도메인 판별기를 속이는 손실로 **min-max**·**confusion**·**GAN** 중 무엇을 쓰는가. 이 세 축의 조합표에 [DANN](#/p/dann)("gradient reversal": 판별적·공유·min-max), domain confusion(판별적·공유·confusion), CoGAN(생성적·비공유·GAN)을 나란히 배치할 수 있다.'},
 {h:'ADDA의 선택: 판별적 + 비대칭 가중치 + GAN 손실',
  lead:'판별적 기반 모델에, 소스·타깃 인코더를 독립시키고, 표준 GAN 손실로 학습한다.',
  d:'가중치를 공유하면 타깃 인코더가 소스 분포에 과하게 묶여 큰 도메인 격차를 흡수하기 어렵다. ADDA는 소스 인코더 $M_s$ 를 먼저 지도학습으로 고정한 뒤, 별도의 타깃 인코더 $M_t$ 를 **판별기를 속이도록만** 적대적으로 학습시킨다. 두 인코더가 서로 다른 파라미터를 가지므로 각 도메인에 맞는 저수준 특징을 따로 학습할 여지가 생긴다.'},
 {h:'3단계 학습: 사전학습 → 적대적 적응 → 테스트',
  lead:'소스 인코더+분류기를 먼저 고정하고, 그 다음에만 타깃 인코더를 적대적으로 학습한다.',
  d:'1단계: 레이블 있는 소스 데이터로 $M_s$ 와 분류기 $C$ 를 지도학습한다. 2단계: $M_s$ 를 고정한 채 판별기 $D$ 와 타깃 인코더 $M_t$ 를 번갈아 적대적으로 학습한다($M_t$ 는 $M_s$ 의 가중치로 초기화). 3단계: 테스트 시 타깃 이미지를 $M_t$ 로 인코딩해 소스에서 학습한 분류기 $C$ 에 그대로 통과시킨다 — 별도 타깃 분류기가 필요 없다.'},
 {h:'역전된 라벨 GAN 손실로 학습 안정화',
  lead:'표준 GAN의 min-max 대신 생성자 쪽에 역전된 라벨을 써서 그래디언트 소실을 피한다.',
  d:'초기 학습에서 판별기가 너무 강해지면 $\\log(1-D(\\cdot))$ 항의 그래디언트가 죽는 GAN 특유의 문제가 생긴다. ADDA는 이를 피하기 위해 타깃 인코더를 "판별기가 타깃을 소스로 오인하도록" 직접 학습하는 손실을 쓴다 — [DCGAN](#/p/dcgan)에서 쓰인 것과 같은 실용적 트릭이다.'}
],

diagram:{type:'compare', cap:'DANN과 ADDA는 같은 min-max 게임을 풀지만 가중치 공유 여부와 손실 함수 선택이 다르다.',
 left:{t:'DANN', items:['판별적 모델','인코더 가중치 공유','GRL + min-max 손실','소스·타깃 동시 학습']},
 right:{t:'ADDA', items:['판별적 모델','인코더 가중치 비공유','표준 GAN 손실','소스 먼저, 타깃은 그 다음']}},

math:[
 {expr:'min_{Mₛ,C} L_cls = E[−Σₖ 1[k=yₛ] log C(Mₛ(xₛ))]',
  tex:'\\min_{M_s,C}\\; \\mathcal{L}_{cls}(\\mathbf{X}_s,Y_s) = \\mathbb{E}_{(\\mathbf{x}_s,y_s)\\sim(\\mathbf{X}_s,Y_s)}\\left[-\\sum_{k=1}^{K}\\mathbb{1}_{[k=y_s]}\\log C(M_s(\\mathbf{x}_s))\\right]',
  d:'1단계: 소스 인코더 $M_s$ 와 분류기 $C$ 를 표준 교차엔트로피로 지도학습한다.'},
 {expr:'L_advD = −E[log D(Mₛ(xₛ))] − E[log(1−D(Mₜ(xₜ)))]',
  tex:'\\mathcal{L}_{adv_D}(\\mathbf{X}_s,\\mathbf{X}_t,M_s,M_t) = -\\mathbb{E}_{\\mathbf{x}_s}\\big[\\log D(M_s(\\mathbf{x}_s))\\big] - \\mathbb{E}_{\\mathbf{x}_t}\\big[\\log(1-D(M_t(\\mathbf{x}_t)))\\big]',
  d:'판별기 $D$ 는 소스 인코딩과 타깃 인코딩 중 어느 쪽에서 왔는지 구분하도록 학습된다.'},
 {expr:'min_D L_advD,   min_{Mₛ,Mₜ} L_advM,   s.t. ψ(Mₛ,Mₜ)',
  tex:'\\min_{D}\\; \\mathcal{L}_{adv_D}(\\mathbf{X}_s,\\mathbf{X}_t,M_s,M_t), \\qquad \\min_{M_s,M_t}\\; \\mathcal{L}_{adv_M}(\\mathbf{X}_s,\\mathbf{X}_t,D), \\qquad \\text{s.t.}\\;\\; \\psi(M_s,M_t)',
  d:'논문이 제시하는 일반 프레임워크. $\\psi(M_s,M_t)$ 가 가중치 공유 제약이고, ADDA는 이를 사실상 비워 둔(비공유) 경우에 해당한다.'}
],

numbers:[
 {k:'SVHN→MNIST', v:'76.0%', d:'source only 60.1%, DANN(gradient reversal) 73.9% 대비 개선'},
 {k:'MNIST→USPS', v:'89.4%', d:'source only 75.2% 대비 큰 폭 개선. CoGAN 91.2%에는 근소하게 못 미침'},
 {k:'USPS→MNIST', v:'90.1%', d:'CoGAN 89.1%를 넘어섬 — 네 shift 중 유일하게 CoGAN 대비 우위'},
 {k:'CoGAN의 SVHN→MNIST', v:'수렴 실패', d:'도메인 격차가 큰 SVHN↔MNIST에서 생성적 방법(CoGAN)은 결합 생성기 학습이 아예 되지 않음'},
 {k:'NYUD 모달리티 적응', v:'+50% 이상(상대)', d:'RGB→깊이 모달리티 전이에서 무적응 대비 상대 개선폭'}
],

impact:'ADDA는 DANN 이후 흩어져 있던 적대적 도메인 적응 방법들을 하나의 설계 공간으로 묶어, 이후 연구가 "완전히 새 방법"이 아니라 "이 세 축 중 무엇을 바꿀 것인가"로 사고하게 만들었다. 비대칭 가중치라는 선택은 소스·타깃의 저수준 통계가 크게 다른 상황(합성→실제, RGB→깊이)에서 특히 유효함을 보여, 이후 [CyCADA](#/p/cycada)를 포함한 여러 방법이 인코더를 독립적으로 두는 설계를 채택하는 근거가 되었다.',

legacy:[
 '**픽셀+특징 결합으로 확장** — [CyCADA](#/p/cycada)가 ADDA류 특징 적대 정렬에 CycleGAN 기반 픽셀 변환을 더함',
 '**설계 공간 언어의 정착** — "생성/판별·가중치 공유·손실 선택" 세 축이 이후 도메인 적응 논문들의 공통 어휘가 됨',
 '**비대칭 인코더의 재사용** — 소스 모델을 고정하고 타깃 인코더만 적응시키는 패턴이 이후 소스-프리 적응 연구의 전신이 됨',
 '**시험시 적응으로의 흐름** — 소스 데이터 접근 자체를 없애는 [TENT](#/p/tent)는 ADDA가 유지한 "소스 모델은 고정하되 접근 가능"이라는 가정마저 제거'
],

pitfalls:[
 '**"discriminative"의 의미가 DANN·CyCADA 논의와 혼동되기 쉽다.** 여기서는 생성 모델(이미지를 만드는가) 대 판별 모델(태스크 특징만 뽑는가)의 구분이며, 분류기의 판별력과는 다른 축이다.',
 '**비대칭 가중치가 항상 유리한 것은 아니다.** 논문 스스로 밝히듯 도메인 격차가 작을 때(MNIST↔USPS)는 가중치 공유가 최적화를 더 잘 조건화해 줄 수 있다.',
 '**Table 1의 "Gradient reversal"은 DANN 자체를 가리킨다.** ADDA 논문은 DANN을 자신들의 프레임워크로 재서술한 것이지 별개의 방법이 아니다 — 두 논문을 비교할 때 이 재서술을 원 논문의 주장과 혼동하지 않아야 한다.'
],

figures:[
 {f:'fig2-framework.png',
  cap:'소스/타깃 입력이 각각 매핑을 거쳐 판별기로 들어가는 공통 골격. "Generative or discriminative model?", "Weights tied or untied?", "Which adversarial objective?" 세 점선 박스가 이 논문이 제안하는 설계 축이다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'Prior generative approaches show compelling visualizations, but are not optimal on discriminative tasks and can be limited to smaller shifts. Prior discriminative approaches could handle larger domain shifts, but imposed tied weights on the model and did not exploit a GAN-based loss.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1702.05464 — Adversarial Discriminative Domain Adaptation', u:'https://arxiv.org/abs/1702.05464'}
]
});
