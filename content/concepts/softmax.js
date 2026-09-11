WIKI.concept({
slug:'softmax',

tldr:'로짓(logit, 정규화 전 실수 점수) 벡터를 합이 1인 확률분포로 바꾸는 함수로, 각 값을 지수화한 뒤 전체 합으로 나눈다.',

why:'분류기 마지막 층, LLM의 다음 토큰 확률, 어텐션 가중치까지 — 딥러닝에서 "이것들 중 하나를 골라라"는 계산은 거의 다 softmax를 거친다. 로짓을 그대로 확률처럼 읽거나, softmax 구현의 수치 안정화 트릭을 모르고 직접 짜다가 NaN을 만나거나, temperature와의 관계를 헷갈리는 것은 실무에서 흔한 실수다. 이 함수 하나를 제대로 이해하면 샘플링·보정·손실 함수까지 이어지는 여러 개념을 한 번에 정리할 수 있다.',

sections:[
 {h:'로짓이란', d:'로짓(logit)은 softmax를 거치기 **전**, 신경망 마지막 층이 내놓는 정규화되지 않은 실수 점수다. 값의 절대 크기 자체는 확률이 아니고, 클래스 간의 **상대적 크기**만 의미를 가진다. 모든 로짓에 같은 상수를 더해도 softmax 출력은 변하지 않는다는 성질이 바로 이 상대성에서 나온다. "logit"이라는 이름은 통계학의 로지스틱 함수의 역함수에서 왔으며, [로지스틱 회귀](#/c/logistic-regression)에서 쓰는 용어를 신경망이 그대로 이어받았다.'},
 {h:'수식', d:'클래스 $i$ 의 로짓을 $z_i$ 라 하면 확률은 $p_i=\\exp(z_i)/\\sum_j \\exp(z_j)$ 로, 모든 값을 양수로 만든 뒤(지수) 전체 합으로 나눠(정규화) 합이 1인 분포를 만든다. 로짓이 클수록 지수화 후 값이 기하급수적으로 커지므로, 가장 큰 로짓을 가진 클래스가 확률 대부분을 가져가는 "승자 독식"에 가까운 분포가 된다.'},
 {h:'수치 안정화', d:'로짓이 크면(예: 1000) $\\exp(1000)$ 은 부동소수점 표현 범위를 넘어 `inf`가 되고, `inf/inf`는 `NaN`이 된다. 이를 막기 위해 모든 로짓에서 최댓값 $m=\\max_j z_j$ 를 뺀 뒤 지수화한다: $p_i=\\exp(z_i-m)/\\sum_j\\exp(z_j-m)$. 로짓을 상수만큼 이동해도 softmax 값은 그대로라는 성질(위 문단) 덕분에 결과는 수학적으로 동일하면서, 지수의 최댓값이 $\\exp(0)=1$ 로 묶여 오버플로가 사라진다. 딥러닝 프레임워크의 `softmax`·`log_softmax` 구현은 내부적으로 항상 이 트릭을 쓴다.'},
 {h:'temperature 관계', d:'softmax에 들어가기 전 로짓을 [temperature](#/c/temperature) $T$ 로 나누면 $p_i=\\exp(z_i/T)/\\sum_j\\exp(z_j/T)$ 가 된다. $T>1$ 이면 로짓 간 차이가 줄어들어 분포가 평평해지고(다양성 증가), $T\\to 0$ 이면 가장 큰 로짓 하나에 확률이 몰려 argmax와 같아진다. 즉 temperature는 softmax 자체를 바꾸는 게 아니라 softmax에 넣기 **전** 로짓의 스케일을 조절하는 후처리다.'},
 {h:'실무에서', d:'학습 손실로 [교차 엔트로피](#/c/entropy-kl)를 쓸 때는 softmax와 로그를 따로 계산하지 않고 `log_softmax`+`nll_loss` 또는 프레임워크의 결합 함수(`CrossEntropyLoss`)를 쓴다 — 두 단계를 결합해서 계산하면 위의 최댓값 빼기 트릭과 로그의 상쇄가 함께 적용되어 수치적으로 더 안정하고 빠르다. 직접 softmax 출력에 `log()`를 씌우면 작은 확률값에서 정밀도를 잃기 쉽다.'},
 {h:'어휘가 클 때', d:'LLM처럼 클래스 수(어휘 크기)가 수만~수십만이면, 마지막 softmax 층의 $Vd_{model}$ 크기 출력 투영 자체가 파라미터·연산의 상당 부분을 차지한다. 이 비용을 줄이려고 계층적 softmax, 샘플 기반 근사(negative sampling 등)를 쓰던 시절도 있었지만, 현대 LLM은 GPU 연산이 충분히 빨라져 전체 어휘에 대한 완전한 softmax를 그대로 계산하는 것이 표준이 됐다.'}
],

math:[
 {tex:'p_i=\\dfrac{\\exp(z_i)}{\\sum_{j=1}^{K}\\exp(z_j)}', expr:'softmax', d:'$z$ 는 $K$ 차원 로짓 벡터. 모든 $p_i>0$ 이고 $\\sum_i p_i=1$ 이 항상 성립한다.'},
 {tex:'p_i=\\dfrac{\\exp(z_i-\\max_j z_j)}{\\sum_j\\exp(z_j-\\max_j z_j)}', expr:'numerically stable softmax', d:'최댓값을 뺀 뒤 지수화해 오버플로를 막는다. 수학적으로 위 정의와 완전히 같은 값이다.'}
],

code:{lang:'python', d:'수치 안정한 softmax를 직접 구현한 예. 프레임워크의 log_softmax도 내부적으로 같은 최댓값 빼기 트릭을 쓴다.', src:'import numpy as np\n\ndef softmax(z):\n    z = z - np.max(z, axis=-1, keepdims=True)  # 오버플로 방지\n    exp_z = np.exp(z)\n    return exp_z / np.sum(exp_z, axis=-1, keepdims=True)\n\ndef softmax_with_temperature(z, T=1.0):\n    return softmax(z / T)  # T>1: 평평하게, T<1: 뾰족하게'},

diagram:{type:'flow', cap:'로짓에서 확률분포가 만들어지는 순서.',
 nodes:[
  {t:'로짓 z', s:'정규화 전 점수'},
  {t:'최댓값 빼기', s:'수치 안정화'},
  {t:'exp', s:'모두 양수화'},
  {t:'합으로 나눔', s:'합 1인 분포'}
 ]},

confuse:[
 {a:'Softmax', b:'시그모이드(Sigmoid)', d:'시그모이드 $1/(1+e^{-z})$ 는 클래스 하나의 독립적인 "예/아니오" 확률을 낸다 — 이진 분류나 멀티라벨(한 샘플에 여러 정답 가능)에 쓴다. Softmax는 $K$ 개 클래스 점수를 서로 경쟁시켜 합이 1인 분포로 만든다 — 클래스가 상호배타적인 멀티클래스 분류에 쓴다. 실제로 $K=2$ 일 때 softmax는 시그모이드와 수학적으로 동등하다.'},
 {a:'로짓(logit)', b:'확률', d:'로짓은 임의의 실수(음수 가능, 합이 1이 아님)이고 확률은 softmax를 거친 뒤의 $[0,1]$ 값이다. 로짓의 절대 크기를 "이 클래스일 확률이 80이다" 식으로 직접 해석하면 안 된다.'},
 {a:'Softmax', b:'[temperature](#/c/temperature)', d:'Softmax 자체는 고정된 함수다. temperature는 softmax에 넣기 전 로짓을 스케일링하는 하이퍼파라미터로, 둘을 합쳐 "temperature가 적용된 softmax"라고 부를 뿐 별개의 함수는 아니다.'}
],

pitfalls:[
 '지수화 전에 최댓값을 빼는 트릭을 생략하고 직접 `exp(z)`를 계산하면 로짓이 조금만 커도 `inf`/`NaN`이 나기 쉽다.',
 '멀티라벨(한 샘플에 정답이 여러 개) 문제에 softmax+cross-entropy를 그대로 쓰면 클래스들이 서로 확률을 뺏도록 강제되어 틀린 목적함수가 된다 — 이때는 클래스마다 독립적인 시그모이드+BCE를 써야 한다.',
 '온도(temperature)를 0에 매우 가깝게 두면 나눗셈이 불안정해질 수 있으므로, argmax와 같은 효과를 원할 때는 temperature를 0으로 나누기보다 직접 argmax를 쓰는 편이 안전하다.',
 'softmax 출력을 그대로 "모델의 확신도"로 해석하면 위험하다 — 잘 학습된 모델도 과신(overconfident)하는 경향이 흔해, 실제 정답률과 softmax 확률이 어긋나는 경우가 많다. 이 간극을 다루는 것이 [보정(calibration)](#/c/calibration)이다.'
],

papers:['transformer','temperature-scaling'],
terms:['temperature','entropy-kl','logistic-regression','mlp','calibration']
})
