WIKI.concept({
slug:'backprop-c',

tldr:'연쇄 법칙(chain rule)을 출력층에서 입력층 방향으로 반복 적용해 모든 파라미터에 대한 손실의 경사를 한 번의 역방향 계산으로 구하는 알고리즘이다.',

why:'경사 하강법이 "어디로 움직일지" 정하려면 경사가 먼저 있어야 하는데, 역전파가 바로 그 경사를 계산해준다. PyTorch 의 `loss.backward()` 뒤에서 실제로 벌어지는 일이 이것이고, 그래디언트 체크포인팅·믹스드 프리시전·메모리 최적화 같은 실무 이슈들이 전부 이 계산 그래프 위에서 벌어진다.',

sections:[
 {h:'핵심 아이디어 — 연쇄 법칙을 거꾸로', d:'신경망은 함수의 합성이다: $\\mathcal{L}=f_L(f_{L-1}(\\cdots f_1(x)))$. 임의의 층 $l$ 의 가중치에 대한 손실의 경사를 구하려면 연쇄 법칙을 층 수만큼 곱해야 하는데, 출력에서 입력 쪽으로 한 번 거슬러 올라가면서 계산하면 중간 결과(층별 경사)를 **재사용**할 수 있다. 이것이 순전파를 거꾸로 도는 것처럼 보이는 이유다.'},
 {h:'작은 예제로 직접 계산', d:'$x=2$, $w_1=3$, $w_2=4$, 은닉 $h=w_1 x=6$, 출력 $\\hat y=w_2 h=24$, 정답 $y=20$, 손실 $\\mathcal{L}=\\tfrac12(\\hat y-y)^2=8$. 역전파는 $\\partial\\mathcal{L}/\\partial\\hat y=\\hat y-y=4$ 에서 시작해, 이 값을 각 층의 국소 미분과 곱하며 거슬러 올라간다 — 아래 수식과 코드 참고.'},
 {h:'왜 역방향이 더 싼가', d:'순전파와 같은 방향으로(입력에서부터) 경사를 계산하면(forward-mode AD) 파라미터마다 별도로 계산해야 해 비용이 파라미터 수에 비례한다. 역전파는 출력 하나(손실)에서 시작해 **모든 파라미터의 경사를 한 번의 역방향 패스로 동시에** 얻는다 — 그래서 출력이 하나(스칼라 손실)이고 파라미터가 수백만~수십억 개인 신경망에 정확히 맞는 방식이다.'},
 {h:'자동 미분과의 관계', d:'PyTorch/TensorFlow 가 구현한 것은 역전파를 일반화한 **역방향 자동 미분(reverse-mode autodiff)**이다. 순전파 때 각 연산을 계산 그래프에 기록해두고(`requires_grad=True`), `backward()` 호출 시 그 그래프를 거꾸로 훑으며 연쇄 법칙을 자동으로 적용한다. "역전파"는 신경망 맥락에서 이 알고리즘을 부르는 이름이고, "자동 미분"은 임의의 미분가능 프로그램에 적용되는 더 일반적인 이름이다.'}
],

math:[
 {tex:'\\frac{\\partial \\mathcal{L}}{\\partial w_2}=\\frac{\\partial \\mathcal{L}}{\\partial \\hat y}\\cdot\\frac{\\partial \\hat y}{\\partial w_2}=4\\times 6=24',
  expr:'output-layer gradient', d:'$\\hat y=w_2 h$ 이므로 $\\partial\\hat y/\\partial w_2=h=6$. 위 예제 숫자를 그대로 대입한 값이다.'},
 {tex:'\\frac{\\partial \\mathcal{L}}{\\partial w_1}=\\frac{\\partial \\mathcal{L}}{\\partial \\hat y}\\cdot\\frac{\\partial \\hat y}{\\partial h}\\cdot\\frac{\\partial h}{\\partial w_1}=4\\times 4\\times 2=32',
  expr:'hidden-layer gradient (chain rule)', d:'$\\partial\\hat y/\\partial h=w_2=4$, $\\partial h/\\partial w_1=x=2$. 앞 층의 경사($\\partial\\mathcal{L}/\\partial\\hat y=4$)를 그대로 재사용해 곱하는 것이 핵심 — 처음부터 다시 계산하지 않는다.'},
 {tex:'\\delta^{(l)}=\\big((W^{(l+1)})^\\top \\delta^{(l+1)}\\big)\\odot f\\prime(z^{(l)})',
  expr:'general backward recursion', d:'$\\delta^{(l)}$ 은 층 $l$ 의 사전활성값에 대한 손실의 경사. 한 층 뒤의 경사 $\\delta^{(l+1)}$ 를 가중치로 되돌리고 그 층의 활성 함수 미분 $f\\prime$ 을 곱하는 재귀식 — 이걸 층마다 반복하는 것이 역전파의 일반형이다.'}
],

diagram:{type:'flow', cap:'순전파는 오른쪽으로, 경사는 왼쪽으로 — 같은 그래프를 두 방향으로 사용한다.',
 nodes:[
  {t:'x=2'},
  {t:'h=w₁x=6', a:'순전파 →'},
  {t:'ŷ=w₂h=24'},
  {t:'L=½(ŷ-y)²=8'}
 ]},

code:{lang:'python', d:'위 예제를 그대로 코드로 — backward() 가 연쇄 법칙을 자동으로 적용한다.', src:
`import torch
x = torch.tensor(2.0)
w1 = torch.tensor(3.0, requires_grad=True)
w2 = torch.tensor(4.0, requires_grad=True)
y = torch.tensor(20.0)

h = w1 * x          # 6
y_hat = w2 * h       # 24
loss = 0.5 * (y_hat - y) ** 2   # 8

loss.backward()
print(w2.grad)  # 24.0  (dL/dw2)
print(w1.grad)  # 32.0  (dL/dw1, chain rule)`},

confuse:[
 {a:'역전파', b:'경사 하강법', d:'역전파는 경사를 **계산**하는 알고리즘, 경사 하강법은 그 경사로 파라미터를 **갱신**하는 규칙이다. `loss.backward()`가 역전파, `optimizer.step()`이 경사 하강법(혹은 Adam 등 그 변형) 쪽 코드다.'},
 {a:'역전파', b:'자동 미분', d:'역전파는 신경망의 손실 하나를 기준으로 한 역방향 자동 미분의 특수 사례다. 자동 미분은 forward-mode 도 있고 임의의 미분가능 프로그램에 적용되는 더 넓은 개념이다.'},
 {a:'경사(gradient)', b:'델타(δ, 사전활성값 경사)', d:'경사는 파라미터(가중치)에 대한 미분이고, 델타는 각 층의 사전활성값 $z$ 에 대한 미분이다. 역전파는 델타를 층별로 먼저 구하고, 거기서 가중치 경사를 유도한다.'}
],

pitfalls:[
 '역전파는 경사를 정확히 계산할 뿐, 그 경사가 항상 "좋은 방향"이라는 보장은 없다 — 층이 깊어지면 경사가 소실되거나 폭주할 수 있다([경사 소실·폭주](#/c/gradient-problem) 참고).',
 '`loss.backward()`를 두 번 호출하면 경사가 **누적**된다(덮어쓰지 않음) — 매 스텝 `optimizer.zero_grad()`를 빼먹으면 이전 스텝의 경사가 섞여 들어간다.',
 '역전파는 순전파에서 만든 중간 활성값을 메모리에 들고 있어야 한다 — 깊은 모델에서 메모리 병목의 주범이며, 이를 줄이려는 기법이 gradient checkpointing 이다.'
],

papers:['backprop'],
terms:['gradient-descent','gradient-problem','activation']
});
