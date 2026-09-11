WIKI.concept({
slug:'mle',

tldr:'관측된 데이터가 나올 확률(우도)을 가장 크게 만드는 파라미터를 찾는 추정 방법으로, 딥러닝의 표준 학습 목표(교차 엔트로피 최소화) 대부분이 사실 이 원리의 다른 표현이다.',

why:'"왜 언어 모델은 다음 토큰의 cross-entropy 를 최소화하도록 학습하는가"에 대한 답이 바로 최대우도추정(MLE)이다. loss function 이 어디서 왔는지, 왜 하필 그 수식인지를 설명하지 못하면 새로운 손실 함수를 설계하거나 평가할 때 "그냥 관행"으로만 이해하게 된다.',

sections:[
 {h:'우도: 뒤집힌 확률', d:'파라미터 $\\theta$ 를 가진 모델이 데이터 $x$ 를 만들 확률은 $P(x\\mid\\theta)$ 다. [확률](#/c/probability-dist)은 $\\theta$ 를 고정하고 $x$ 가 변할 때 이 함수를 보는 관점이고, 우도(likelihood) $\\mathcal{L}(\\theta\\mid x)=P(x\\mid\\theta)$ 는 반대로 관측된 $x$ 를 고정하고 $\\theta$ 가 변할 때 같은 함수를 보는 관점이다 — 수식은 똑같지만 "무엇을 변수로 보는가"가 바뀐다.'},
 {h:'최대우도추정', d:'MLE 는 관측된 데이터 $x_1,\\ldots,x_n$ 이 나올 우도를 최대로 만드는 $\\theta$ 를 고른다: $\\hat\\theta=\\arg\\max_\\theta \\prod_i P(x_i\\mid\\theta)$. 데이터가 독립이라 가정하면 우도는 각 데이터의 확률의 곱이 되고, 곱셈은 다루기 어려우니 로그를 씌워 합으로 바꾼 로그우도 $\\sum_i \\log P(x_i\\mid\\theta)$ 를 최대화한다(로그는 단조증가라 최댓값의 위치가 안 변한다).'},
 {h:'cross-entropy', d:'로그우도를 최대화하는 것은 그 음수(negative log-likelihood, NLL) $-\\sum_i\\log P(x_i\\mid\\theta)$ 를 최소화하는 것과 같다. 분류 모델에서 $P(x_i\\mid\\theta)$ 를 정답 클래스에 대한 모델의 softmax 확률로 두면, 이 식은 정확히 [교차 엔트로피 손실](#/c/entropy-kl)이다 — "cross-entropy loss 를 최소화한다"는 실무의 관행이 사실은 "관측된 정답 레이블의 우도를 최대화한다"는 MLE 원리의 다른 표현일 뿐이다.'},
 {h:'다음 토큰 예측=MLE', d:'언어 모델은 각 위치에서 $P(x_t\\mid x_1,\\ldots,x_{t-1};\\theta)$(이전 토큰들이 주어졌을 때 다음 토큰의 확률)를 예측하고, 학습은 전체 코퍼스의 로그우도 $\\sum_t \\log P(x_t\\mid x_{<t};\\theta)$ 를 최대화하도록 $\\theta$ 를 조정한다. 즉 사전학습의 next-token prediction 목표 자체가 "실제 텍스트가 나올 확률을 최대로 만드는 파라미터를 찾는다"는 순수한 MLE 다.'}
],

math:[
 {tex:'\\hat\\theta_{MLE}=\\arg\\max_\\theta \\sum_{i=1}^n \\log P(x_i\\mid\\theta)',
  expr:'로그우도 최대화', d:'$x_i$ 는 $i$ 번째 관측 데이터(언어 모델에서는 $i$ 번째 위치의 다음 토큰), $\\theta$ 는 모델 파라미터. 곱셈이던 우도에 로그를 씌워 합으로 바꾸면 미분·최적화가 훨씬 쉬워진다.'},
 {tex:'-\\log P(y\\mid x;\\theta)=-\\log q_\\theta(y)=\\text{cross-entropy loss}',
  expr:'NLL과 cross-entropy 의 등가', d:'정답 $y$ 가 원-핫일 때 cross-entropy $H(p,q)=-\\sum_c p(c)\\log q(c)$ 는 정답 클래스 하나만 남아 $-\\log q(y)$ 가 된다 — 이것이 바로 negative log-likelihood(NLL)다.'}
],

diagram:{type:'flow', cap:'MLE 에서 cross-entropy loss 까지 한 줄로 이어진다.',
 nodes:[
  {t:'우도 최대화'},
  {t:'로그 씌움'},
  {t:'음수 취함(NLL)'},
  {t:'정답=원-핫'},
  {t:'cross-entropy'}
 ]},

confuse:[
 {a:'MLE', b:'MAP(최대사후확률)', d:'MLE 는 우도 $P(x\\mid\\theta)$ 만 최대화한다. MAP 는 여기에 [사전 확률](#/c/bayes) $P(\\theta)$ 를 곱해($\\arg\\max_\\theta P(x\\mid\\theta)P(\\theta)$) 최대화한다 — L2 정칙화(weight decay)를 우도에 곱해진 가우시안 사전 분포로 해석하면 MAP 추정이 된다. "정칙화 항이 붙은 손실"은 사실 MAP 다.'},
 {a:'우도(likelihood)', b:'확률(probability)', d:'같은 함수 $P(x\\mid\\theta)$ 를 $\\theta$ 를 변수로 보면 우도, $x$ 를 변수로 보면 확률이다. 우도는 $\\theta$ 에 대해 적분(합)해도 1이 될 필요가 없다는 점도 확률과 다르다.'}
],

pitfalls:[
 '우도를 "확률"이라 부르며 $\\theta$ 에 대해서도 확률처럼 합이 1이어야 한다고 착각하는 경우가 있다 — 우도는 $\\theta$ 의 함수로서는 정규화되어 있지 않다.',
 'MLE 는 데이터가 많을수록 참값에 가까워진다는 좋은 성질(일치성)이 있지만, 데이터가 적을 때는 과적합에 취약하다 — 정칙화 없는 순수 MLE 를 작은 데이터셋에 그대로 쓰면 분산이 큰 추정이 나온다.',
 '학습 loss 곡선이 내려가는 것을 "모델이 좋아지고 있다"로만 읽기 쉬운데, MLE 는 어디까지나 학습 데이터의 우도를 올리는 것이다 — 검증셋 성능과의 괴리(과적합)는 별도로 반드시 확인해야 한다.'
],

code:{lang:'python', d:'동전 던지기 데이터로 MLE 가 관측 빈도와 같아짐을 확인.',
 src:'import numpy as np\nflips = np.array([1,1,0,1,0,1,1,0,1,1])  # 1=앞면\n# 로그우도 L(p) = sum(log(p) if x=1 else log(1-p))\np_grid = np.linspace(0.01, 0.99, 99)\nll = [ (flips*np.log(p) + (1-flips)*np.log(1-p)).sum() for p in p_grid ]\nprint(p_grid[np.argmax(ll)], flips.mean())  # 둘이 거의 같다'},

papers:['vae','nnlm'],
terms:['probability-dist','entropy-kl','bayes']
});
