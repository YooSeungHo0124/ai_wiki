WIKI.paper({
slug:'nice',
venue:'ICLR 2015 워크숍',
authors:'Dinh, Krueger, Bengio (Université de Montréal)',
arxiv:'1410.8516',

tldr:'가역 변환을 쌓아 데이터를 factorized 분포로 바꾸되, **야코비안을 삼각행렬로 만들어** 로그 우도를 정확하게(근사 없이) 계산하는 생성 모델. 정규화 흐름(normalizing flow) 계열의 출발점.',

context:'2014년의 생성 모델은 두 갈래였다. [VAE](#/p/vae)는 근사 사후분포로 우도의 하한(ELBO)만 최적화하고, GAN은 우도 자체를 아예 포기한 채 판별기 신호로 학습한다. 둘 다 **정확한 로그 우도**를 계산하지 못한다. 반면 완전 자기회귀 모델은 정확한 우도를 주지만 조건부를 순서대로 곱하는 구조상 야코비안이 일반적인 삼각행렬이라 계산이 무겁다. 이 논문의 질문은 "역변환과 야코비안 행렬식이 **둘 다 공짜**인 변환을 설계할 수 있는가"이다.',

ideas:[
 {h:'변수 변환 공식을 학습 기준으로 직접 사용',
  lead:'가역 함수 f로 데이터를 단순 분포로 옮기고 log-likelihood를 직접 최대화한다.',
  d:'데이터 $x$에 가역 변환 $h=f(x)$를 적용해 $h$가 factorized 분포(성분끼리 독립)를 따르게 만든다. 변수 변환 공식 $p_X(x)=p_H(f(x))\\,|\\det(\\partial f/\\partial x)|$ 를 그대로 로그우도로 쓰므로, ELBO 같은 하한이 아니라 **정확한 우도**를 최적화한다. 샘플링은 $h\\sim p_H(h)$ 를 뽑고 $x=f^{-1}(h)$ 를 계산하는 ancestral sampling으로 끝난다.'},
 {h:'Coupling layer: 절반은 그대로, 절반만 변환',
  lead:'입력을 둘로 나눠 한쪽은 항등, 다른 쪽만 나머지 함수로 이동시켜 야코비안을 삼각형으로 만든다.',
  d:'입력 $x$를 $(x_1,x_2)$로 쪼개 $y_1=x_1$, $y_2=x_2+m(x_1)$ 로 정의한다. $m$은 임의의 복잡한 신경망이어도 된다 — 이 변환의 가역성과 야코비안 계산은 $m$의 형태와 무관하다. 역변환은 $x_2=y_2-m(y_1)$ 로 계산 비용이 순변환과 같다.'},
 {h:'덧셈 결합(additive coupling)의 단위 야코비안',
  lead:'$y_2=x_2+m(x_1)$ 형태를 쓰면 야코비안 행렬식이 항상 1이 된다.',
  d:'coupling layer의 야코비안은 $\\begin{bmatrix}I&0\\\\\\partial y_2/\\partial x_1&\\partial y_2/\\partial x_2\\end{bmatrix}$ 꼴의 삼각행렬이라 행렬식이 대각 원소($\\partial y_2/\\partial x_2$)의 곱으로 준다. 덧셈 결합을 쓰면 이 대각이 항상 1이라 행렬식 계산 자체가 사라진다. 한 층은 입력 절반을 그대로 통과시키므로, 모든 차원이 서로 영향을 주려면 **최소 3개**, 논문은 보통 **4개**의 coupling layer를 분할 방식을 번갈아 쌓는다.'},
 {h:'스케일링 층으로 부피 보존 문제를 푼다',
  lead:'덧셈 결합만 쌓으면 부피가 항상 보존되므로 마지막에 대각 스케일 행렬을 추가한다.',
  d:'coupling layer는 야코비안 행렬식이 1이라 **부피 보존(volume-preserving)** 변환이다. 이것만 쌓으면 모델이 차원마다 다른 중요도를 배울 수 없다. 그래서 최상단에 대각 스케일 $S$를 곱해 $\\log|S_{ii}|$ 항을 우도에 추가하고, 이 값이 PCA의 고유스펙트럼과 비슷하게 각 잠재 차원의 중요도를 드러낸다.'},
 {h:'인페인팅은 학습 없이 posterior 최적화로',
  lead:'관측된 픽셀을 고정하고 나머지를 log-likelihood에 대해 gradient ascent로 채운다.',
  d:'모델은 인페인팅을 위해 따로 학습되지 않는다. 관측 부분 $x_O$를 고정한 채 은닉 부분 $x_H$에 대해 $\\log p_X((x_O,x_H))$ 를 projected gradient ascent로 최대화하기만 하면 된다. 정확한 우도를 계산할 수 있기 때문에 가능한 활용이다.'}
],

diagram:{type:'flow', cap:'덧셈 coupling layer 하나. 왼쪽 절반은 항등으로 통과하고, 오른쪽 절반만 m(x1)만큼 이동한다.',
 nodes:[
  {t:'입력 분할', s:'(x1, x2)'},
  {t:'x1 → y1', s:'항등', note:'그대로'},
  {t:'m(x1)', s:'임의 신경망', acc:true},
  {t:'x2+m(x1) → y2', s:'덧셈 결합'}
 ]},

math:[
 {expr:'log p_X(x) = log p_H(f(x)) + log |det(df/dx)|',
  tex:'\\log p_X(x) = \\log p_H(f(x)) + \\log\\left|\\det\\frac{\\partial f(x)}{\\partial x}\\right|',
  d:'변수 변환 공식. NICE는 이 식 자체를 학습 목표로 쓴다 — VAE처럼 하한을 쓰지 않는다.'},
 {expr:'y1 = x1,  y2 = x2 + m(x1)   (역: x2 = y2 - m(y1))',
  tex:'y_1=x_1,\\quad y_2=x_2+m(x_1)\\ \\ \\Longleftrightarrow\\ \\ x_1=y_1,\\quad x_2=y_2-m(y_1)',
  d:'덧셈 coupling layer. 순변환과 역변환의 계산량이 완전히 같고, 야코비안 행렬식은 임의의 $m$에 대해 항상 1이다.'},
 {expr:'log p_X(x) = Σ_i [log p_Hi(f_i(x)) + log|S_ii|]',
  tex:'\\log p_X(x) = \\sum_{i=1}^{D}\\Big[\\log p_{H_i}(f_i(x)) + \\log|S_{ii}|\\Big]',
  d:'coupling layer들에 대각 스케일 $S$를 얹은 최종 NICE 학습 기준. $S_{ii}$가 클수록 그 잠재 차원이 덜 중요하다는 뜻이라 PCA 고유값과 유비된다.'}
],

numbers:[
 {k:'구성', v:'coupling layer 4개 + 대각 스케일', d:'분할은 홀수/짝수 인덱스로 번갈아'},
 {k:'로그우도 · MNIST', v:'1980.50', d:'784차원, dequantize 후 로지스틱 prior'},
 {k:'로그우도 · TFD', v:'5514.71', d:'Deep MFA의 5250(변분 하한)을 앞섬'},
 {k:'로그우도 · CIFAR-10', v:'5371.78', d:'Deep MFA의 3622(변분 하한)을 크게 앞섬'},
 {k:'로그우도 · SVHN', v:'11496.55', d:'ZCA 전처리, 로지스틱 prior'},
 {k:'옵티마이저', v:'AdaM, lr 1e-3, 1500 epoch', d:'검증 로그우도로 최적 모델 선택'}
],

impact:'정규화 흐름(normalizing flow)이라는 계열 전체의 시작점이다. **가역+삼각 야코비안**이라는 설계 원칙 하나로 "우도를 정확히, 싸게 계산하면서 표현력도 유지"하는 문제를 처음 실질적으로 풀었다. 이 조합 — 절반은 통과, 절반만 임의 신경망으로 변환 — 은 [Real NVP](#/p/real-nvp)에서 스케일까지 학습하는 아핀 결합으로 확장되고, 이후 연속시간 흐름·[Flow Matching](#/p/flow-matching)으로 이어지는 계보의 첫 매듭이 됐다.',

legacy:[
 '**[Real NVP](#/p/real-nvp)** — 덧셈 결합을 스케일+시프트를 함께 배우는 아핀 결합으로 확장해 표현력을 키움',
 '**Glow(2018)** — 1×1 가역 합성곱을 더해 이미지 생성 품질을 끌어올림 (같은 coupling layer 골격)',
 '**연속시간 흐름** — ODE로 무한히 얇은 층을 쌓는 Neural ODE·CNF, 그리고 [Flow Matching](#/p/flow-matching)까지 "가역 변환으로 분포를 옮긴다"는 아이디어가 확산 모델과 합류',
 '**정확한 우도 vs 샘플 품질** — 정규화 흐름은 우도는 정확하지만 삼각 야코비안 제약 때문에 표현력이 diffusion·GAN에 밀려, 오늘날은 우도가 중요한 응용(이상 탐지, 밀도 추정)에 주로 남음'
],

pitfalls:[
 '**"근사 없는 우도"이지, "좋은 샘플"의 보장이 아니다.** NICE 자체는 부피 보존 변환만 쌓은 초기형이라 표현력이 제한적이고, Fig. 5의 CIFAR-10 샘플은 흐릿하다. 정확한 우도와 지각 품질은 다른 축이다.',
 '**coupling layer 한 층은 입력 절반을 전혀 바꾸지 않는다.** 그래서 모든 차원이 서로 영향을 주려면 분할 방식을 바꿔가며 여러 층(논문은 최소 3, 실제 4)을 쌓아야 한다. 층 하나로는 표현력이 없다.',
 '**"NICE=VAE의 대체"는 과장이다.** 저자들도 부록에서 재구성항을 무시하면 VAE의 SGVB 목적함수가 2-층 아핀 coupling NICE와 사실상 같아짐을 보인다 — 경쟁 관계가 아니라 같은 변수변환 공식의 두 쓰임이다.'
],

figures:[
 {f:'fig2-coupling.png', cap:'coupling layer의 계산 그래프. x_plain은 그대로 y_cipher로 통과(왼쪽 화살표), x_key는 m을 거쳐 값이 더해진 뒤 y_cipher 계산에 쓰이고, x_key 자신은 항등으로 y_key가 된다 — 절반만 변환되는 구조가 그대로 보인다.',
  src:'원문 Figure 2, p.3'},
 {f:'fig5-samples.png', cap:'학습된 NICE로 h~p_H(h)를 뽑아 x=f^{-1}(h)로 생성한 비지도 샘플. MNIST(왼쪽)는 숫자 형태가 뚜렷하지만 TFD·SVHN·CIFAR-10으로 갈수록 흐려진다 — 부피 보존 변환만으로는 복잡한 자연 이미지 분포를 표현하는 데 한계가 있음을 보여준다.',
  src:'원문 Figure 5, p.8'}
],

quotes:[
 {t:'We parametrize this transformation so that computing the determinant of the Jacobian and inverse Jacobian is trivial, yet we maintain the ability to learn complex non-linear transformations.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1410.8516 — NICE: Non-linear Independent Components Estimation', u:'https://arxiv.org/abs/1410.8516'},
 {t:'Real NVP (후속 논문)', u:'https://arxiv.org/abs/1605.08803'}
]
});
