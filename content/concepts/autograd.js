WIKI.concept({
slug:'autograd',

tldr:'프로그램이 실행한 연산들을 기록해두고 연쇄 법칙을 자동으로 적용해 임의 함수의 정확한 미분을 계산하는 기법으로, [역전파](#/c/backprop-c)는 신경망 손실에 대한 그 역방향 모드의 특수 사례다.',

why:'`.backward()` 한 줄로 수백만 파라미터의 경사가 전부 나온다는 것이 왜 가능한지 이해해야, 왜 forward-mode 가 아니라 reverse-mode 를 쓰는지, `retain_graph`·`no_grad`·`detach` 를 언제 써야 하는지, 그리고 메모리·속도 트레이드오프를 어디서 조절할 수 있는지 판단할 수 있다.',

sections:[
 {h:'미분을 구하는 세 가지 방법', d:'① **수치 미분**(numerical differentiation)은 $f(x+h)$ 와 $f(x)$ 의 차이를 $h$ 로 나누는 유한차분 근사다 — 구현은 쉽지만 $h$ 선택에 따라 오차가 생기고, 파라미터마다 한 번씩 함수를 다시 평가해야 해 비용이 크다. ② **기호 미분**(symbolic differentiation)은 수식 자체를 미분 규칙에 따라 대수적으로 변환한다(SymPy 처럼) — 정확하지만 식이 복잡해질수록 결과 수식이 기하급수적으로 불어나는 "식 팽창" 문제가 있다. ③ **자동 미분**(automatic differentiation, AD)은 프로그램을 기본 연산(덧셈, 곱셈, sin, exp 등)의 합성으로 보고, 각 기본 연산의 미분은 미리 알고 있다는 전제 아래 연쇄 법칙을 실행 시점에 적용한다 — 수치 미분처럼 근사가 아니라 (부동소수점 오차를 빼면) 정확하고, 기호 미분처럼 식이 불어나지도 않는다.'},
 {h:'forward-mode vs reverse-mode', d:'AD 에는 두 방향이 있다. **forward-mode**는 입력에서 출력 방향으로, 각 중간 변수에 대해 "입력 하나가 바뀔 때 이 값이 얼마나 바뀌는가"를 함께 실어 나른다 — 입력이 $n$ 개, 출력이 $m$ 개일 때 비용이 대략 $O(n)$ 번의 패스다. **reverse-mode**는 먼저 순전파로 전체 그래프를 만든 뒤, 출력에서 입력 방향으로 "출력이 이 중간값에 얼마나 민감한가"를 거슬러 전파한다 — 비용이 대략 $O(m)$ 번의 패스다.'},
 {h:'왜 딥러닝은 reverse-mode 인가', d:'신경망 학습에서는 출력이 손실 하나(스칼라, $m=1$)이고 입력(파라미터)은 수백만~수십억 개($n$이 거대)다. forward-mode 로 하면 파라미터 하나마다 패스를 새로 돌려야 해 $n$ 번, reverse-mode 로 하면 손실 하나에서 시작해 **단 한 번의 역방향 패스로 모든 파라미터의 경사**를 동시에 얻는다. 이 비대칭(출력 1개, 입력 수백만 개) 때문에 [역전파](#/c/backprop-c)가 reverse-mode AD 를 쓰는 것이지, 우연히 고른 방식이 아니다.'},
 {h:'실무에서: no_grad 와 detach', d:'`requires_grad=True` 로 표시된 텐서가 연산에 관여하면 프레임워크는 순전파 때마다 그래프를 만들고 중간값을 저장한다 — 이건 메모리와 시간을 쓴다. 경사가 필요 없는 구간(추론, 검증, 로깅용 지표 계산, 타깃 네트워크 갱신)에서는 `torch.no_grad()` 로 아예 그래프 생성을 끄고, 그래프 일부에서 경사가 더 흘러가면 안 되는 지점(GAN 판별자에 넣는 생성자 출력, 타깃 값으로 쓰는 텐서)에서는 `.detach()` 로 그 텐서만 그래프에서 떼어낸다.'},
 {h:'그래프는 한 번 쓰고 버려진다', d:'PyTorch 의 동적 그래프는 기본적으로 `backward()` 한 번 호출하면 메모리에서 해제된다. 같은 그래프로 backward 를 두 번 부르려면(멀티태스크 손실을 따로 역전파하는 경우 등) `backward(retain_graph=True)` 를 명시해야 한다 — 이걸 잊고 두 번째 `backward()` 를 호출하면 "그래프가 이미 해제되었다"는 런타임 에러가 난다.'}
],

math:[
 {tex:'v_i=\\sum_j \\frac{\\partial y_j}{\\partial x_i}\\bar v_j,\\quad \\bar v_j=\\frac{\\partial \\mathcal{L}}{\\partial y_j}',
  expr:'reverse-mode accumulation (VJP)', d:'reverse-mode AD 의 핵심은 벡터-야코비안 곱(vector-Jacobian product)이다. 출력 쪽에서 내려온 민감도 $\\bar v_j$ 를 야코비안과 곱해 입력 쪽 민감도 $v_i$ 를 구하고, 이걸 그래프의 각 노드에서 반복한다 — 야코비안 전체를 만들지 않고도 이 곱만 계산하면 되는 게 효율의 핵심이다.'}
],

diagram:{type:'compare', cap:'출력이 하나, 입력이 수백만 — 이 비대칭이 reverse-mode 를 고르게 한다.',
 left:{t:'forward-mode', items:[
  '입력 → 출력 방향',
  '비용 ~ 입력 개수(n)',
  '입력 적고 출력 많을 때 유리']},
 right:{t:'reverse-mode', items:[
  '출력 → 입력 방향',
  '비용 ~ 출력 개수(m)',
  '딥러닝(m=1, n=수백만)에 적합']}},

code:{lang:'python', d:'no_grad 와 detach 의 차이를 코드로.', src:
`import torch
w = torch.tensor(3.0, requires_grad=True)

# no_grad: 이 블록 자체가 그래프를 안 만든다
with torch.no_grad():
    y = w * 2          # y.requires_grad == False

# detach: 그래프는 만들되 이 텐서에서 잘라낸다
x = w * 2               # 그래프에 연결됨
x_det = x.detach()      # x_det 은 그래프에서 분리된 값 복사본
loss = (x_det - 1) ** 2
loss.backward()         # w.grad 는 None (경사가 x_det 을 못 지나감)`},

confuse:[
 {a:'자동 미분(autograd)', b:'[역전파](#/c/backprop-c)', d:'자동 미분은 forward/reverse 두 모드를 포함하는 일반적인 기법이고, 역전파는 신경망 손실 하나를 기준으로 한 reverse-mode AD 의 응용 이름이다. "역전파를 구현한다"는 것은 실무에서 대개 "reverse-mode 자동 미분 엔진을 만든다"는 뜻이다.'},
 {a:'수치 미분', b:'자동 미분', d:'수치 미분은 유한차분으로 근사값을 얻고 파라미터 수만큼 함수 재평가가 필요하다. 자동 미분은 정확한 값을 한 번의 역방향 패스로 전부 얻는다. 수치 미분은 주로 자동 미분 구현이 맞는지 검증(gradient checking)하는 용도로 남아 있다.'},
 {a:'`no_grad()`', b:'`detach()`', d:'`no_grad()`는 코드 블록 전체에서 그래프 생성 자체를 끄는 컨텍스트 매니저이고, `detach()`는 이미 존재하는 그래프에서 텐서 하나를 떼어내는 연산이다. 추론 전체는 `no_grad()`로, 그래프 일부만 자르고 싶으면 `detach()`로 처리한다.'}
],

pitfalls:[
 '`retain_graph=True` 없이 같은 그래프에 `backward()`를 두 번 부르면 에러가 난다 — 멀티태스크 손실을 따로 역전파할 계획이면 미리 설계해야 한다.',
 '`.detach()`는 값은 그대로 두고 경사 흐름만 끊는다. 값 자체를 다른 텐서로 바꿔치기하는 것과 혼동해 grad 가 왜 안 나오는지 한참 헤매는 경우가 흔하다.',
 '큰 배치를 검증 루프에 그대로 돌리면서 `no_grad()`를 빼먹으면 학습 때보다 메모리를 더 쓰는 역설적인 상황이 생긴다(배치는 큰데 그래프까지 쌓이므로).'
],

papers:['backprop','tensorflow'],
terms:['backprop-c','forward-pass','checkpointing']
});
