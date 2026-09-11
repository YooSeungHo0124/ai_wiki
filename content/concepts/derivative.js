WIKI.concept({
slug:'derivative',

tldr:'함수의 입력이 아주 조금 바뀔 때 출력이 얼마나 바뀌는지를 나타내는 변화율이며, 여러 변수 중 하나에 대한 것이 편미분, 함수 합성을 뚫고 미분을 전달하는 규칙이 연쇄 법칙이다.',

why:'[역전파](#/c/backprop-c)는 연쇄 법칙을 수백~수천 층에 반복 적용하는 것에 불과하다. gradient 가 왜 소실·폭주하는지, 왜 학습률을 잘못 잡으면 발산하는지, optimizer 가 무엇을 계산하고 있는지 전부 미분·편미분·연쇄 법칙 위에 서 있다 — 이걸 감으로만 알면 학습이 실패했을 때 무엇을 봐야 할지 모른다.',

sections:[
 {h:'미분: 순간 변화율', d:'함수 $f(x)$ 의 도함수 $f\'(x)$ 는 $x$ 를 아주 조금 늘렸을 때 $f(x)$ 가 얼마나 늘거나 주는지의 비율이다. 기울기(slope)가 크면 그 방향으로 조금만 움직여도 출력이 크게 바뀐다는 뜻이고, 0이면(극값 근처) 입력을 바꿔도 출력이 거의 안 변한다 — 최솟값을 찾는 [gradient-descent](#/c/gradient-descent)가 "기울기가 0인 곳"을 목표로 삼는 이유다.'},
 {h:'편미분: 한 변수씩', d:'신경망의 손실 $L$ 은 수백만 개의 가중치 $w_1,\\ldots,w_n$ 에 대한 함수다. 편미분 $\\partial L/\\partial w_i$ 는 "다른 모든 가중치는 고정한 채 $w_i$ 만 살짝 바꿨을 때 손실이 얼마나 바뀌는가"다. 모든 가중치에 대한 편미분을 모은 벡터가 gradient $\\nabla L=(\\partial L/\\partial w_1,\\ldots,\\partial L/\\partial w_n)$ 이고, 이것이 파라미터를 어느 방향으로 얼마나 움직일지 결정한다.'},
 {h:'연쇄 법칙', d:'$y=f(g(x))$ 처럼 함수가 겹쳐 있을 때, $x$ 에 대한 $y$ 의 미분은 각 단계의 미분을 곱해서 구한다: $\\dfrac{dy}{dx}=\\dfrac{dy}{dg}\\cdot\\dfrac{dg}{dx}$. 신경망은 층을 겹겹이 쌓은 거대한 합성 함수이므로, 출력층의 손실에서 입력층 가까운 가중치까지 "얼마나 영향을 미쳤는지"를 구하려면 이 곱셈 사슬을 끝까지 이어야 한다 — 이것이 곧 [backprop](#/p/backprop)의 수학적 정체다.'},
 {h:'역전파는 연쇄 법칙', d:'층이 $L$ 개인 네트워크에서 각 가중치마다 미분을 처음부터 따로 계산하면 중복 계산이 엄청나다. 역전파는 출력에서 입력 방향으로 한 번만 거꾸로 훑으면서 각 층의 국소 미분을 재사용해 모든 가중치의 gradient 를 한 번에 구한다 — 순전파와 비슷한 비용으로 전체 gradient 를 얻는 이유가 이것이다. [자세한 내용은 역전파](#/c/backprop-c) 참고.'}
],

math:[
 {tex:'\\frac{\\partial L}{\\partial x}=\\frac{\\partial L}{\\partial y}\\cdot\\frac{\\partial y}{\\partial x}',
  expr:'연쇄 법칙(단일 경로)', d:'$L$ 이 $y$ 의 함수이고 $y$ 가 $x$ 의 함수일 때, $x$ 가 $L$ 에 미치는 영향은 "$x$ 가 $y$ 에 미치는 영향"과 "$y$ 가 $L$ 에 미치는 영향"의 곱이다. 신경망에서는 이 사슬이 층 수만큼 길게 이어진다.'},
 {tex:'\\frac{\\partial L}{\\partial x}=\\sum_i \\frac{\\partial L}{\\partial y_i}\\cdot\\frac{\\partial y_i}{\\partial x}',
  expr:'연쇄 법칙(여러 경로로 갈라질 때)', d:'$x$ 가 여러 경로($y_1,\\ldots,y_k$)를 거쳐 $L$ 에 영향을 줄 때는 각 경로의 기여를 더한다 — 예를 들어 [residual](#/c/residual) 연결처럼 한 텐서가 두 곳에 쓰이면 gradient 도 두 경로에서 흘러와 합쳐진다.'}
],

diagram:{type:'flow', cap:'연쇄 법칙으로 gradient 가 출력에서 입력 쪽으로 거꾸로 흐른다.',
 nodes:[
  {t:'x'},
  {t:'layer1: y'},
  {t:'layer2: L'},
  {t:'∂L/∂y 계산'},
  {t:'체인룰: ∂L/∂x', s:'= ∂L/∂y·∂y/∂x'}
 ]},

confuse:[
 {a:'미분(derivative)', b:'gradient', d:'미분은 스칼라 함수 하나의 변화율(1차원 x 에 대해서는 숫자 하나)이다. gradient 는 다변수 함수의 모든 편미분을 모은 벡터다 — "이 손실의 gradient"라고 하면 모든 가중치에 대한 편미분 벡터 전체를 가리킨다.'},
 {a:'gradient', b:'[jacobian](#/c/jacobian-hessian)', d:'gradient 는 출력이 스칼라(손실 하나)일 때의 1차 미분 벡터다. 출력이 벡터(여러 개)인 함수의 1차 미분은 행렬이 되는데 이것이 야코비안이다 — 손실 함수는 gradient, 그 외 일반 층의 입출력 관계는 야코비안으로 다룬다.'}
],

pitfalls:[
 '"기울기가 크다 = 중요한 가중치"로 오해하기 쉽지만, 큰 gradient 는 그 가중치를 조금만 바꿔도 손실이 크게 바뀐다는 뜻일 뿐 그 가중치가 최종 성능에 "더 기여한다"는 뜻은 아니다.',
 '연쇄 법칙에서 곱셈이 여러 번 반복되므로, 각 단계의 미분이 1보다 많이 작거나 크면 전체 곱이 지수적으로 작아지거나(소실) 커진다(폭주) — 이게 [gradient-problem](#/c/gradient-problem)의 근본 원인이다.',
 'gradient 를 "정답으로 가는 방향"으로 오해하기 쉬운데, gradient 는 손실이 가장 가파르게 **증가**하는 방향이다 — 그래서 gradient descent 는 그 반대 방향(음의 gradient)으로 움직인다는 부호를 놓치면 학습이 발산한다.'
],

code:{lang:'python', d:'autograd 가 연쇄 법칙을 자동으로 적용하는 것을 직접 확인.',
 src:'import torch\nx = torch.tensor(2.0, requires_grad=True)\ny = x ** 2      # dy/dx = 2x\nz = torch.log(y)  # dz/dy = 1/y\nz.backward()     # 연쇄 법칙: dz/dx = (1/y)*(2x)\nprint(x.grad)    # 1.0  (= 2x/x^2 = 2/x, x=2 -> 1.0)'},

papers:['backprop'],
terms:['backprop-c','jacobian-hessian','gradient-problem']
});
