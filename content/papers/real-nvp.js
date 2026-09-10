WIKI.paper({
slug:'real-nvp',
venue:'ICLR 2017',
authors:'Dinh, Sohl-Dickstein, Bengio (MILA · Google Brain)',
arxiv:'1605.08803',

tldr:'affine coupling layer라는 **가역 변환**을 쌓아, 정확한 로그 우도 계산·정확한 샘플링·정확한 잠재변수 추론을 동시에 만족하는 생성모델(정규화 흐름)을 제시했다. [VAE](#/p/vae)의 하한 근사나 [GAN](#/p/gan)의 우도 부재 없이, 변환을 뒤집기만 하면 데이터↔잠재공간을 오가는 구조다.',

context:'생성모델은 대개 셋 중 하나를 포기해야 했다. [VAE](#/p/vae)는 정확한 우도 대신 ELBO라는 하한만 계산하고, [GAN](#/p/gan)은 우도 자체를 정의하지 않으며, 자기회귀 모델(PixelRNN 등)은 우도는 정확하지만 샘플링이 픽셀 단위로 순차적이라 느리다. 이 논문 이전에도 NICE가 가역 변환으로 정확한 우도를 계산하는 아이디어를 제시했지만, 변환이 부피 보존(volume-preserving)이라 표현력이 제한적이었다. 질문은 "야코비안 행렬식을 계산 가능하게 유지하면서 표현력을 어떻게 늘릴 것인가"였다.',

ideas:[
 {h:'Affine coupling layer: 절반은 그대로, 절반만 조건부로 변환',
  lead:'입력을 둘로 나눠 한쪽은 통과시키고 다른 쪽만 나머지에 의존해 스케일·이동시킨다.',
  d:'$D$ 차원 입력 $x$를 $x_{1:d}$와 $x_{d+1:D}$로 나눠, $y_{1:d}=x_{1:d}$는 그대로 두고 $y_{d+1:D}=x_{d+1:D}\\odot\\exp(s(x_{1:d}))+t(x_{1:d})$로 변환한다. $s$(scale)와 $t$(translation)는 임의로 복잡한 신경망이어도 되는데, 이는 야코비안 계산이 $s, t$ **자체의 미분을 필요로 하지 않기 때문**이다 — 이 비대칭 설계가 표현력과 계산 가능성을 동시에 얻는 핵심이다.'},
 {h:'삼각 야코비안이라 행렬식이 대각합만으로 계산된다',
  lead:'변환의 야코비안이 삼각행렬이 되어 행렬식이 $\\exp(\\sum s)$ 로 바로 나온다.',
  d:'$y_{1:d}$가 $x_{1:d}$의 항등함수이므로 야코비안의 위쪽 블록은 항등행렬, 아래쪽 대각 블록만 $\\exp(s(x_{1:d}))$ 로 채워진다. 삼각행렬의 행렬식은 대각 원소의 곱이므로, $D\\times D$ 행렬식을 직접 계산하는 $O(D^3)$ 대신 $s$ 값을 더하기만 하면 된다 — 고차원 이미지에서도 감당 가능한 비용이다.'},
 {h:'역변환이 순전파와 같은 비용',
  lead:'$s, t$ 를 뒤집을 필요 없이 대수적으로 바로 역함수를 구할 수 있다.',
  d:'$x_{d+1:D}=(y_{d+1:D}-t(y_{1:d}))\\odot\\exp(-s(y_{1:d}))$ 로 역변환이 닫힌 형태로 나온다. $s, t$ 자체는 뒤집을 필요가 없으므로 순전파(추론)와 역전파(샘플링)의 비용이 동일하다 — 자기회귀 모델과 달리 **샘플링도 학습만큼 빠르다**.'},
 {h:'체커보드·채널 마스킹을 번갈아 쌓아 전체 차원을 갱신',
  lead:'한 층에서 못 바꾼 절반을 다음 층에서 바꾸도록 마스크 패턴을 교대로 쌓는다.',
  d:'coupling layer 하나는 절반만 갱신하므로, 이를 그대로 쌓으면 특정 성분이 계속 그대로 남는다. 공간적 체커보드 패턴과 채널 단위 마스킹을 번갈아 적용해, 어느 층에서 고정됐던 성분이 다음 층에서는 갱신되도록 구성했다. 이미지 국소 상관구조를 살리기 위해 체커보드는 squeeze(공간 해상도를 채널로 접는 연산) 이전에, 채널 마스킹은 그 이후에 쓴다.'}
],

diagram:{type:'compare', cap:'세 생성모델 계열이 우도·샘플링·잠재변수 추론 중 무엇을 정확히 계산하는지의 대비.',
 left:{t:'VAE / GAN', items:['VAE: 우도는 하한(ELBO)만','GAN: 우도 자체가 없음','잠재변수 추론이 근사적']},
 right:{t:'Real NVP', items:['가역 변환으로 정확한 로그우도','역변환으로 정확·효율적 샘플링','인코딩=디코딩, 별도 추론망 불필요']}},

math:[
 {tex:'\\log p_X(x) = \\log p_Z\\big(f(x)\\big) + \\log\\left|\\det\\!\\left(\\frac{\\partial f(x)}{\\partial x^{\\top}}\\right)\\right|',
  expr:'log p_X(x) = log p_Z(f(x)) + log|det(∂f/∂x)|',
  d:'변수변환 공식. $f$가 가역이고 야코비안 행렬식을 계산할 수 있으면, 단순한 잠재분포 $p_Z$(가우시안)의 로그밀도에 이 보정항만 더해 데이터의 정확한 로그우도를 얻는다.'},
 {tex:'y_{d+1:D} = x_{d+1:D} \\odot \\exp\\!\\big(s(x_{1:d})\\big) + t(x_{1:d})',
  expr:'y[d+1:D] = x[d+1:D] ⊙ exp(s(x[1:d])) + t(x[1:d])',
  d:'affine coupling layer의 정의. $\\odot$는 원소별 곱. $s, t$가 임의로 복잡해도 이 변환의 야코비안은 삼각행렬로 남는다.'}
],

numbers:[
 {k:'CIFAR-10 bits/dim', v:'3.49', d:'PixelRNN의 3.00보다는 높지만(나쁘지만) 우도·샘플링·추론을 모두 정확히 계산'},
 {k:'ImageNet 32×32 bits/dim', v:'4.28', d:'검증 4.28, 학습 4.26'},
 {k:'ImageNet 64×64 bits/dim', v:'3.98', d:'검증 3.98, 학습 3.75'},
 {k:'LSUN bedroom bits/dim', v:'2.72', d:'네 자연 이미지 데이터셋(CIFAR-10·ImageNet·LSUN·CelebA) 중 가장 낮은 값'},
 {k:'CelebA bits/dim', v:'3.02', d:'148×148 중앙 크롭 후 학습'}
],

impact:'"가역성만 있으면 정확한 우도로 학습할 수 있다"는 원리를 이미지 스케일에서 처음 실증하면서, 정규화 흐름(normalizing flow)을 VAE·GAN과 나란한 세 번째 생성모델 계열로 세웠다. affine coupling layer의 삼각 야코비안 트릭은 이후 흐름 기반 모델의 사실상 표준 구성요소가 되었고, coupling layer 자체는 이미지 생성을 넘어 밀도 추정 전반에 재사용됐다.',

legacy:[
 '**Glow(2018)** — 1×1 가역 합성곱으로 채널 마스킹을 대체해 실사 수준 이미지 생성으로 확장',
 '**흐름 기반 계보의 시작점** — 이후 연속시간 흐름(FFJORD), 그리고 [Flow Matching](#/p/flow-matching)까지 이어지는 가역 변환 생성모델 흐름의 앞자리',
 '**coupling layer의 범용화** — 오디오(WaveGlow), 강화학습의 정책 표현 등 이미지 밖 밀도 추정에도 재사용됨',
 '**"정확한 우도"라는 평가축 정착** — 이후 생성모델 비교에서 bits/dim(정확한 로그우도)이 VAE의 ELBO와 구별되는 별도 지표로 보고되는 관행에 기여'
],

pitfalls:[
 '**샘플 품질(bits/dim)이 자기회귀 모델보다 낮았다.** PixelRNN 대비 CIFAR-10에서 3.49 vs 3.00으로, "정확한 계산 가능성"과 "최고의 우도"는 이 시점에 별개였다.',
 '**coupling layer 한 층은 입력의 절반만 바꾼다.** 여러 층을 마스킹을 바꿔가며 쌓아야만 전체 차원이 실질적으로 섞이므로, 층 하나만으로는 표현력이 거의 없다.',
 '**"가역적이니 정보 손실이 없다"는 것과 "생성 품질이 좋다"는 것은 다른 이야기다.** 가역성은 우도 계산 가능성을 보장할 뿐, 지각적으로 그럴듯한 샘플을 보장하지 않는다.'
],

figures:[
 {f:'fig2-coupling-layer.png',
  cap:'왼쪽(순전파): $x_1$은 그대로 $y_1$이 되고(등호), $x_1$에서 나온 $s, t$가 $x_2$에 곱해지고(×) 더해져(+) $y_2$가 된다. 오른쪽(역전파): 같은 $s, t$를 이번엔 빼고(−) 나누는(÷) 순서로 적용해 $x_2$를 복원한다 — $s, t$ 자체를 뒤집지 않고도 역변환이 완성되는 것이 이 그림의 핵심.',
  src:'원문 Figure 2, p.4'},
 {f:'fig3-masking.png',
  cap:'왼쪽: 체커보드 패턴 마스크(검은 칸만 갱신). 오른쪽: 채널별 마스크(입력을 채널 축으로 접어 반은 검게). squeeze 연산 전에는 체커보드를, 후에는 채널 마스킹을 써서 같은 패턴이 중복되지 않게 한다.',
  src:'원문 Figure 3, p.5'}
],

quotes:[
 {t:'We extend the space of such models using real-valued non-volume preserving (real NVP) transformations, a set of powerful, stably invertible, and learnable transformations, resulting in an unsupervised learning algorithm with exact log-likelihood computation, exact and efficient sampling, exact and efficient inference of latent variables, and an interpretable latent space.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1605.08803 — Density Estimation using Real NVP', u:'https://arxiv.org/abs/1605.08803'}
]
});
