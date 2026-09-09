WIKI.paper({
slug:'ntk',
venue:'NeurIPS 2018',
authors:'Jacot, Gabriel, Hongler (EPFL)',
arxiv:'1806.07572',

tldr:'신경망의 폭을 무한대로 보내면, 학습 중 파라미터가 거의 움직이지 않아도 되는 **선형화** 영역에 들어가고, 그 학습 동역학이 초기화 시점에 고정된 커널(Neural Tangent Kernel)에 대한 **커널 회귀**와 정확히 같아진다는 것을 증명했다. "신경망이 왜 학습되는가"를 처음으로 닫힌 형태의 수학으로 설명한 결과.',

context:'2018년까지 신경망 학습의 수렴성은 대체로 경험적으로만 알려져 있었다. 손실 지형에 안장점(saddle point)이 많다는 것도, 국소 최적해가 많다는 것도 알려져 있었지만, 왜 [SGD](#/p/adam)가 실제로 낮은 손실에 잘 도달하는지에 대한 일반적 이론은 없었다. 커널 방법(SVM 등)은 볼록 최적화라 수렴이 보장되지만 표현력이 고정된 커널에 묶여 있고, 신경망은 표현력은 뛰어나지만 비볼록이라 이론적으로 다루기 어려웠다. 저자들은 두 세계를 잇는 극한을 찾는다 — **신경망의 폭을 무한대로 보내면 신경망도 커널 방법처럼 다뤄지지 않을까**라는 질문이다.',

ideas:[
 {h:'Neural Tangent Kernel의 정의',
  lead:'파라미터에 대한 네트워크 출력의 그래디언트끼리 내적한 것이 NTK다.',
  d:'두 입력 $x, x^\\prime$ 에 대해, 네트워크 함수 $f_\\theta$ 를 파라미터 $\\theta$ 로 미분한 벡터 $\\partial_\\theta f_\\theta(x)$ 와 $\\partial_\\theta f_\\theta(x^\\prime)$ 의 내적으로 커널 $\\Theta(x,x^\\prime)$ 을 정의한다. 직관적으로 이 커널은 "파라미터를 조금 바꿨을 때 $x$ 에서의 출력과 $x^\\prime$ 에서의 출력이 얼마나 같이 움직이는가"를 재는 유사도다. 일반적인 유한 폭 네트워크에서는 이 값이 초기화마다 무작위이고 학습 중에도 계속 변한다.'},
 {h:'무한 폭 극한에서 NTK는 결정론적 상수로 수렴한다',
  lead:'폭을 무한대로 보내면 NTK가 초기화 무작위성과 무관한 고정된 커널로 수렴한다(Theorem 1).',
  d:'층의 폭 $n_1,\\dots,n_{L-1} \\to \\infty$ 인 극한에서, NTK $\\Theta^{(L)}$ 은 확률적으로(in probability) 어떤 결정론적 극한 커널 $\\Theta_\\infty^{(L)}$ 로 수렴한다. 이 극한 커널은 activation 함수 $\\sigma$, 깊이, 초기화 분산만으로 재귀적으로 계산되며 **데이터에도, 특정 초기화 결과에도 의존하지 않는다**. 즉 무한히 넓은 네트워크는 "어떤 초기화를 뽑았는가"에 무관하게 항상 같은 커널을 갖는다.'},
 {h:'학습 중에도 NTK가 고정된 채 유지된다',
  lead:'무한 폭에서는 파라미터가 유의미하게 움직이지 않아도 함수 출력은 충분히 바뀔 수 있어, 커널이 학습 내내 초기값에 머문다(Theorem 2).',
  d:'유한 폭 네트워크에서는 학습이 진행되며 파라미터가 크게 이동해 NTK도 함께 변한다. 그런데 폭이 무한대에 가까워질수록 각 파라미터의 상대적 기여가 $1/\\sqrt{n}$ 스케일로 작아지기 때문에, 함수를 원하는 만큼 바꾸는 데 필요한 파라미터의 **절대적 이동량은 0에 수렴**한다. 그 결과 네트워크는 사실상 초기화 지점에서의 **1차 테일러 전개(선형화)**로 행동하고, NTK는 학습 시작부터 끝까지 초기화 시점 값 $\\Theta_\\infty$ 로 고정된다.'},
 {h:'학습 동역학이 커널 gradient descent와 동일해진다',
  lead:'무한 폭 극한에서 신경망 학습은 고정 커널에 대한 (보통 볼록인) 함수공간 gradient descent로 환원된다.',
  d:'NTK가 고정되면, 함수공간에서의 학습 동역학 $\\partial_t f_{\\theta(t)} = -\\nabla_{\\Theta_\\infty} C$ 는 커널 $\\Theta_\\infty$ 에 대한 gradient descent와 정확히 같다. 손실이 볼록(예: 최소제곱)이고 $\\Theta_\\infty$ 가 양의 정부호(positive definite)라면 이 동역학은 전역 최적해로 수렴이 **보장**된다. 신경망의 원래 비볼록 최적화 문제가, 무한 폭에서는 볼록 문제로 정확히 환원되는 것이다.'},
 {h:'수렴 속도는 NTK의 고유값(eigenvalue) 스펙트럼이 결정한다',
  lead:'커널 주성분 방향마다 서로 다른 속도로 수렴하며, 큰 고유값 방향이 먼저 학습된다.',
  d:'커널 gradient descent에서 함수는 커널의 주성분(eigenfunction) 방향으로 분해되고, 각 방향은 그 고유값 $\\lambda_i$ 에 비례하는 속도 $e^{-\\lambda_i t}$ 로 수렴한다. 큰 고유값에 대응하는 "매끄러운" 성분이 먼저 빠르게 학습되고, 작은 고유값의 고주파 성분은 늦게 학습된다 — 이는 신경망이 저주파부터 학습한다는 이후의 spectral bias 관찰과 직접 연결되며, 조기 종료(early stopping)가 암묵적 정규화로 작동하는 이유의 한 설명이 된다.'}
],

diagram:{type:'compare', cap:'신경망 학습의 원래 그림과, 무한 폭 극한에서 벌어지는 단순화. NTK 이론이 성립하는 것은 오른쪽 극한에서다.',
 left:{t:'유한 폭 신경망', items:['손실이 비볼록','커널이 학습 중 계속 변함','수렴 보장 없음']},
 right:{t:'무한 폭 극한(NTK)', items:['함수공간에서 사실상 볼록','커널이 초기값에 고정','양의 정부호면 전역수렴 보장']}},

math:[
 {expr:'Θ^(L)(θ) = Σ_p ∂_θp F^(L)(θ) ⊗ ∂_θp F^(L)(θ)',
  tex:'\\Theta^{(L)}(\\theta) = \\sum_{p} \\partial_{\\theta_p} F^{(L)}(\\theta) \\otimes \\partial_{\\theta_p} F^{(L)}(\\theta)',
  d:'Neural Tangent Kernel의 정의. 파라미터에 대한 네트워크 함수의 야코비안끼리 내적한 것으로, "파라미터 공간의 작은 변화가 함수공간에서 어떻게 나타나는가"를 재는 커널이다.'},
 {expr:'Θ^(L) → Θ_∞^(L) ⊗ Id_{n_L}   as widths → ∞  (Theorem 1)',
  tex:'\\Theta^{(L)} \\;\\xrightarrow{\\ p\\ }\\; \\Theta_{\\infty}^{(L)} \\otimes \\mathrm{Id}_{n_L} \\qquad \\text{as } n_1,\\dots,n_{L-1}\\to\\infty',
  d:'폭이 무한대로 갈 때 NTK가 초기화의 무작위성과 무관한 결정론적 커널 $\\Theta_\\infty^{(L)}$ 로 확률수렴한다는 것이 논문의 첫 번째 핵심 정리다.'},
 {expr:'∂_t f_θ(t) = −∇_{Θ^(L)} C |_{f_θ(t)}',
  tex:'\\partial_t f_{\\theta(t)} = -\\nabla_{\\Theta^{(L)}} C\\big|_{f_{\\theta(t)}}',
  d:'학습 중 네트워크 함수 $f_\\theta$ 자체가 NTK에 대한 커널 gradient를 따라 변화한다는 동역학 방정식. 무한 폭에서 $\\Theta^{(L)}$ 이 상수 $\\Theta_\\infty$ 로 고정되므로, 손실 $C$가 볼록이고 $\\Theta_\\infty$가 양의 정부호이면 전역 수렴이 보장된다.'}
],

numbers:[
 {k:'핵심 정리 개수', v:'Theorem 1·2', d:'각각 초기화에서의 NTK 수렴, 학습 중 NTK 고정을 증명'},
 {k:'실험 네트워크 깊이', v:'L = 4', d:'NTK 수렴 실험(Figure 1)에서 사용한 깊이'},
 {k:'실험 폭 비교', v:'n = 500 vs 10,000', d:'폭이 클수록 NTK의 초기화 간 분산이 줄어드는 것을 시각적으로 확인'},
 {k:'MNIST 커널 PCA 고유값', v:'λ₁=0.0457, λ₂=0.00108, λ₃=0.00078', d:'주성분 방향마다 수렴 속도가 크게 다름을 보여줌(§6.3)'},
 {k:'파라미터 스케일', v:'O(1/√n)', d:'각 파라미터의 함수 출력에 대한 기여도가 폭에 반비례해, 넓을수록 개별 파라미터 이동이 작아짐'}
],

impact:'딥러닝 이론에 "무한 폭 극한"이라는 다루기 쉬운 분석 대상을 제공했다. 이후 연구들이 이 틀 안에서 유한 폭 보정항, 다양한 아키텍처(합성곱·attention)의 NTK, feature learning과의 관계 등을 광범위하게 파고들었다. 동시에 NTK 영역은 "lazy training"(파라미터가 거의 움직이지 않는 영역)이라 불리며, 실제 딥러닝이 보이는 표현 학습(feature learning)과는 다른 체제라는 것도 곧 밝혀졌다 — 이 간극이 NTK 이론의 설명력을 실제 신경망에 대해 제한하는 근본적 이유가 됐다.',

legacy:[
 '**"lazy training" 개념의 정식화** — Chizat & Bach(2019) 등이 NTK 영역을 파라미터가 거의 움직이지 않는 특수 체제로 재해석하며, 실제 신경망의 성공(feature learning)과는 구분되는 극한임을 명확히 함',
 '**유한 폭 보정과 mean-field 이론으로 확장** — 무한 폭 극한을 넘어, 폭이 유한할 때의 NTK 변화나 mean-field 극한에서의 feature learning을 다루는 후속 이론 계열',
 '**아키텍처별 NTK 계산으로 확산** — CNN·[Transformer](#/p/transformer) 등 다양한 구조의 NTK를 유도해, 무한 폭 네트워크를 실제 커널 회귀 알고리즘으로 구현하는 연구(Neural Tangents 라이브러리 등)',
 '**이 논문 자체가 "왜 신경망이 수렴하는가"에 대한 첫 일반 이론** — 이후 [double-descent](#/p/double-descent) 같은 현상을 설명하려는 시도에서 참조점으로 계속 인용됨'
],

pitfalls:[
 '**NTK 체제는 실제 신경망의 학습과 다르다.** 무한 폭 극한에서는 표현(feature)이 학습되지 않고 초기화 시점의 임의 특징에 대한 선형 회귀만 일어난다 — 실제 딥러닝의 강점으로 꼽히는 표현 학습을 이 이론은 설명하지 못한다.',
 '**"무한 폭"은 실무 규모에서 성립하지 않는 근사다.** 실제 네트워크의 폭은 유한하고, 유한 폭에서는 NTK가 학습 중 변하며(feature learning이 일어나며) 이론과 실제 사이에 체계적 간극이 남는다. NTK 예측과 실제 유한 폭 네트워크의 일반화 성능은 여러 벤치마크에서 어긋난다는 보고가 이어졌다.',
 '**"신경망이 커널 방법과 같다"는 과장된 요약은 주의가 필요하다.** 정확히는 "무한 폭·특정 초기화·특정 파라미터화 조건에서, 학습 초기 선형화 영역에서만" 성립하는 결과이며, 이 조건들이 실제 딥러닝 성공 사례(작은 폭, 큰 학습률, 표현 학습에 의존하는 사전학습 등)와 잘 맞지 않는 경우가 많다.'
],

figures:[
 {f:'fig1-ntk-convergence.png',
  cap:'x축은 단위원 위의 각도 $\\gamma$, y축은 NTK 값 $\\Theta^{(4)}(x_0,x)$. 초록(폭 n=500)은 10회 서로 다른 초기화마다 곡선이 넓게 흩어져 있는 반면, 빨강(폭 n=10000)은 실선 근처로 촘촘히 모여 있다 — 폭이 커질수록 NTK가 초기화 무작위성에 무관한 고정된 곡선으로 수렴한다(Theorem 1)는 것을 눈으로 확인시켜 준다.',
  src:'원문 Figure 1, p.8'}
],

quotes:[
 {t:'While the NTK is random at initialization and varies during training, in the infinite-width limit it converges to an explicit limiting kernel and it stays constant during training.',
  src:'Abstract, p.1'},
 {t:'In the next subsections, we show that, in the infinite-width limit, the NTK becomes deterministic at initialization and stays constant during training.',
  src:'Section 4, p.5'}
],

links:[
 {t:'arXiv 1806.07572 — Neural Tangent Kernel', u:'https://arxiv.org/abs/1806.07572'},
 {t:'NeurIPS 2018 proceedings', u:'https://proceedings.neurips.cc/paper/2018/hash/5a4be1fa34e62bb8a6ec6b91d2462f5a-Abstract.html'}
]
});
