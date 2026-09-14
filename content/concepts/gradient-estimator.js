WIKI.concept({
slug:'gradient-estimator',

tldr:'argmax나 샘플링처럼 미분 불가능한 이산 선택을 통과해 그래디언트를 역전파시키기 위한 근사 기법들이다.',

why:'신경망은 연쇄법칙으로 미분 가능한 연산만 역전파할 수 있는데, 어휘에서 토큰 하나를 고르거나 코드북에서 벡터 하나를 고르는 것처럼 "이산적인 선택"은 그 지점에서 그래디언트가 정의되지 않는다. VQ-VAE의 벡터 양자화, 이산 잠재변수를 쓰는 생성모델, 강화학습의 정책 등 이산 선택이 모델 안에 들어가는 순간 이 문제를 피할 방법이 필요해진다.',

sections:[
 {h:'문제의 본질', d:'argmax(z)나 categorical 샘플링 같은 연산은 입력이 조금 바뀌어도 출력이 계단식으로 바뀌거나 아예 바뀌지 않는다 — 이 지점의 그래디언트는 거의 모든 곳에서 0이거나 정의되지 않는다(미분 불가능). 이 연산을 모델 중간에 두면 그 이전 층의 파라미터에는 손실의 그래디언트가 전혀 전달되지 않아 학습이 안 된다. 그래디언트 추정기들은 이 지점을 우회하거나 근사해 학습 신호를 통과시키는 서로 다른 방법이다.'},
 {h:'Straight-Through Estimator', d:'순전파에서는 이산 선택(예: argmax, 또는 임계값 이상이면 1, 아니면 0)을 그대로 쓰되, 역전파에서는 그 연산이 마치 항등함수(identity)인 것처럼 취급해 그래디언트를 그대로(또는 약간 변형해) 통과시킨다. 수학적으로 정당화되는 방법은 아니고 편향된 근사(biased estimator)이지만, 구현이 극히 단순하고 실무에서 놀랄 만큼 잘 작동해 이산 병목이 있는 여러 모델에서 기본 선택지로 쓰인다.'},
 {h:'Gumbel-Softmax', d:'[Gumbel-Softmax](#/p/gumbel-softmax)는 categorical 분포에서의 샘플링을 Gumbel 잡음을 더한 뒤 softmax(온도 τ로 조절)로 근사해, 순전파부터 역전파까지 전 구간이 미분 가능한 완화(relaxation)를 제공한다. 온도 τ가 0에 가까우면 one-hot에 가까운 이산 선택을 흉내 내고, τ가 크면 부드러운 분포가 되어 학습 초반에는 크게, 후반에는 작게 온도를 낮추는 어닐링이 흔히 쓰인다. Straight-Through와 달리 편향 없는(정확히는 완화된 분포에 대해 정확한) 그래디언트를 주지만, 근사 대상이 원래의 이산 분포가 아니라 완화된 연속 분포라는 차이가 있다.'},
 {h:'REINFORCE', d:'REINFORCE(정책 그래디언트)는 이산 선택 자체를 미분하는 대신, "그 선택으로 인해 받은 보상(또는 손실)"과 "그 선택이 나올 로그확률"의 곱으로 그래디언트를 추정한다 — 선택 연산 내부를 우회하지 않고, 선택 확률을 높이거나 낮추는 방향으로 직접 그래디언트를 만든다. 편향 없는 추정량이지만 분산이 매우 커서, 실무에서는 베이스라인(평균 보상 등)을 빼 분산을 줄이는 것이 필수적이다. 강화학습의 정책 최적화 전반이 이 원리 위에 서 있다.'},
 {h:'VQ-VAE가 실제로 쓰는 것', d:'[VQ-VAE](#/p/vqvae)는 인코더 출력을 코드북에서 가장 가까운 벡터로 바꾸는 벡터 양자화(argmin 최근접 탐색) 단계를 갖는데, 이 단계는 미분 불가능하다. VQ-VAE는 Gumbel-Softmax나 REINFORCE를 쓰지 않고 Straight-Through Estimator를 택했다 — 역전파 시 양자화된 벡터에 대한 그래디언트를 양자화 이전의 인코더 출력에 그대로 복사해 전달한다. 이는 편향된 근사이지만, 코드북 벡터와 인코더 출력이 학습이 진행되며 서로 가까워지도록(commitment loss와 코드북 손실로) 별도로 유도하기 때문에 실무적으로 잘 작동한다. "이산 병목이 있으면 무조건 Gumbel-Softmax를 쓴다"는 것은 오해이고, VQ-VAE 계열은 여전히 Straight-Through가 표준이다.'}
],

math:[
 {tex:'\\dfrac{\\partial z_q}{\\partial z_e}:=I\\quad(\\text{Straight-Through})', expr:'Straight-Through 그래디언트', d:'$z_e$는 양자화 이전 인코더 출력, $z_q$는 양자화된 벡터. 순전파는 $z_q=\\text{argmin}$ 탐색으로 계산하지만, 역전파는 이 연산의 야코비안을 항등행렬 $I$로 대체해 $z_q$로 들어온 그래디언트를 그대로 $z_e$로 흘려보낸다.'},
 {tex:'y_i=\\dfrac{\\exp((\\log\\pi_i+g_i)/\\tau)}{\\sum_j\\exp((\\log\\pi_j+g_j)/\\tau)},\\quad g_i=-\\log(-\\log u_i),\\ u_i\\sim U(0,1)', expr:'Gumbel-Softmax', d:'$\\pi_i$는 원래 categorical 분포의 확률, $g_i$는 Gumbel 잡음(균등분포 $u_i$에서 변환), $\\tau$는 온도. $\\tau\\to0$이면 $y$가 one-hot 벡터에 수렴해 이산 샘플링을 재현하고, 이 전체 식은 $u_i$를 통해 미분 가능한 경로로 샘플링을 표현한다(reparameterization trick의 이산판).'},
 {tex:'\\nabla_\\theta\\, \\mathbb{E}_{a\\sim\\pi_\\theta}[R(a)]=\\mathbb{E}_{a\\sim\\pi_\\theta}[R(a)\\,\\nabla_\\theta\\log\\pi_\\theta(a)]', expr:'REINFORCE', d:'좌변은 정책 $\\pi_\\theta$로 뽑은 이산 행동 $a$에 대한 기대 보상의 그래디언트로, $a$가 이산적이라 직접 미분할 수 없다. 우변은 로그 미분 트릭(log-derivative trick)으로 이를 "보상 $R(a)$를 가중치로 한 로그확률의 그래디언트"의 기댓값으로 바꿔, $\\pi_\\theta$에서 샘플링만 가능하면 몬테카를로로 추정할 수 있게 만든다.'}
],

diagram:{type:'compare', cap:'같은 문제(이산 선택 미분)를 다른 방식으로 우회한다.',
 left:{t:'Straight-Through', items:['순전파 이산 유지','역전파 항등함수 근사','편향 있음·분산 작음']},
 right:{t:'완화·정책그래디언트', items:['연속 완화 또는 확률 가중','온도·베이스라인 필요','편향 적음·분산 큼(REINFORCE)']}},

confuse:[
 {a:'Straight-Through Estimator', b:'Gumbel-Softmax', d:'Straight-Through는 순전파에서 이산 선택을 그대로 쓰고 역전파에서만 근사하는 반면, Gumbel-Softmax는 순전파 자체를 연속적인 완화 분포로 바꿔 전 구간을 진짜로 미분 가능하게 만든다. 전자는 편향되지만 간단하고, 후자는 온도 조절이 필요하지만 이론적 근거가 더 명확하다.'},
 {a:'REINFORCE', b:'Straight-Through/Gumbel-Softmax', d:'REINFORCE는 연산 내부를 우회하지 않고 보상과 로그확률의 곱으로 그래디언트를 새로 구성하는 방식이라 분산이 크지만 어떤 이산 연산에도 적용 가능한 일반적 방법이다. Straight-Through와 Gumbel-Softmax는 연산 자체를 근사하거나 완화하는 방식이라 적용 범위가 더 제한적이지만 분산이 작아 실무에서 더 안정적으로 학습된다.'},
 {a:'편향(bias)', b:'분산(variance)', d:'Straight-Through는 그래디언트 추정치가 참값과 체계적으로 다를 수 있다는 의미의 편향은 있지만 추정치 자체의 변동(분산)은 작다. REINFORCE는 편향은 없지만(기댓값은 맞다) 추정치가 샘플마다 크게 흔들려 분산이 크다 — 어느 쪽이 실제로 더 잘 학습되는지는 문제마다 다르다.'}
],

pitfalls:[
 '이산 병목이 있으면 무조건 Gumbel-Softmax를 써야 한다고 가정하면 안 된다 — VQ-VAE처럼 Straight-Through가 표준으로 쓰이는 경우가 많다.',
 'REINFORCE를 베이스라인 없이 그대로 쓰면 분산이 너무 커서 학습이 사실상 진행되지 않는 경우가 흔하다 — 베이스라인은 선택이 아니라 사실상 필수다.',
 'Gumbel-Softmax의 온도를 고정해 두면 학습 후반까지 완화된 분포가 진짜 이산 분포에서 멀리 남아, 추론 시 이산화했을 때 학습과 다른 결과가 나올 수 있다 — 온도 어닐링이 필요한 이유다.'
],

papers:['straight-through','gumbel-softmax'],
terms:['numerical-stability']
});
