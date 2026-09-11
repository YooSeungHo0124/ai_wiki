WIKI.concept({
slug:'residual',

tldr:'층의 출력을 x+F(x) 로 만들어 입력을 그대로 다음 층까지 더해 보내는 연결로, 이 덧셈 경로 덕분에 경사가 감쇠 없이 깊은 층까지 흐를 수 있다.',

why:'잔차 연결이 없었다면 [ResNet](#/p/resnet) 이전처럼 20층 넘게 쌓으면 오히려 성능이 떨어지는 문제(degradation)를 못 풀었을 것이고, Transformer 도 수십~수백 층을 쌓을 수 없었을 것이다. "왜 깊게 쌓아도 학습이 되는가"에 대한 답의 8할이 이 한 줄 $x+F(x)$ 에 있다.',

sections:[
 {h:'문제 — 깊이가 오히려 독이 된다', d:'직관적으로는 층을 더 쌓으면 모델이 항등 함수(identity)를 포함해 더 복잡한 함수도 표현할 수 있어야 하니 성능이 나빠질 리 없어 보인다. 그런데 [ResNet](#/p/resnet) 이전 실험들은 순수하게 층만 깊게 쌓으면 학습 오차 자체가 더 커지는 현상(degradation problem)을 반복적으로 보였다 — 단순 과적합이 아니라, 깊은 평범한(plain) 네트워크가 얕은 네트워크만큼도 최적화가 안 되는 문제였다. 층을 몇 개든 통과시켜 "아무것도 안 한 것"(항등 함수)을 만드는 것조차 비선형 층들의 조합으로는 SGD 가 쉽게 찾아내지 못했다.'},
 {h:'해법 — 항등을 기본값으로', d:'잔차 연결은 층이 입력 $x$ 에서 목표 출력 $H(x)$ 를 직접 배우게 하는 대신, 그 **차이** $F(x)=H(x)-x$(잔차, residual)만 배우게 하고 최종 출력은 $x+F(x)$ 로 만든다. 이러면 층이 특별히 할 일이 없을 때는 $F(x)\\to 0$ 으로만 수렴하면 되고, 이는 몇 개의 층 가중치를 0 근처로 두면 되는 훨씬 쉬운 목표다 — 즉 항등 함수가 "기본값"으로 공짜로 주어진다.'},
 {h:'경사 흐름 관점', d:'$L$개 층을 잔차로 쌓으면 마지막 층 출력은 $x_L=x_0+\\sum_{l=1}^{L}F_l(x_{l-1})$ 로, 입력 $x_0$ 이 모든 층을 그냥 통과해 더해지는 하나의 "지름길(shortcut)"이 항상 존재한다. 역전파에서 손실 $\\mathcal{L}$ 을 $x_0$ 에 대해 미분하면 이 지름길 덕분에 기울기 항에 상수 1이 그대로 남는다 — 아무리 층이 깊어도 이 1이라는 항은 곱셈으로 사라지지 않으므로 경사 소실을 구조적으로 막는다. Transformer 의 [잔차 연결](#/c/transformer-block)이 하는 역할도 정확히 이것이다 — self-attention 과 FFN 을 아무리 깊게 쌓아도, 입력이 그대로 흐르는 경로가 항상 남아 있게 한다.'},
 {h:'실무 감각', d:'실무에서 새 sub-layer 나 새 모듈을 깊은 네트워크에 끼워 넣을 때 "잔차로 감쌀 것인가"는 거의 기본 체크리스트다 — 감싸지 않으면 그 모듈 하나 때문에 학습 초반 경사 흐름이 막혀 loss 가 잘 안 내려가는 경우가 흔하다. Transformer 계열에서 [Pre-LN 대 Post-LN](#/c/transformer-block) 논쟁도 결국 "잔차 경로를 정규화 없이 얼마나 깨끗하게 유지하는가"의 문제다.'}
],

math:[
 {tex:'y=x+F(x;\\,W)',
  expr:'residual block', d:'$x$ 는 블록 입력, $F(x;W)$ 는 학습되는 sub-layer(합성곱 몇 층 또는 attention/FFN), $y$ 는 블록 출력. $F$ 가 배우는 것은 전체 변환이 아니라 입력에서 벗어난 정도(잔차)뿐이다.'},
 {tex:'x_L=x_0+\\sum_{l=1}^{L} F_l(x_{l-1}),\\qquad \\dfrac{\\partial \\mathcal{L}}{\\partial x_0}=\\dfrac{\\partial \\mathcal{L}}{\\partial x_L}\\left(1+\\dfrac{\\partial}{\\partial x_0}\\sum_{l=1}^{L}F_l(x_{l-1})\\right)',
  expr:'gradient flow through residual stack', d:'$L$개 잔차 블록을 통과한 뒤에도 $x_0$ 로 가는 경사에는 곱셈 항이 아니라 덧셈으로 보존된 "1"이 남는다. 이 1 덕분에 $F_l$ 들의 국소 미분이 아무리 작아도(경사 소실이 일어날 조건이어도) 전체 경사가 0으로 죽지 않는다 — 평범한(plain) 네트워크라면 이 경사는 각 층 미분의 곱 $\\prod_l \\partial x_l/\\partial x_{l-1}$ 으로만 표현돼 층이 깊을수록 지수적으로 작아지거나 커질 수 있다.'}
],

diagram:{type:'flow', cap:'잔차 연결: 입력이 F(x) 를 우회해 그대로 더해지는 지름길을 만든다.',
 nodes:[
  {t:'입력 x'},
  {t:'F(x)', s:'학습되는 변환'},
  {t:'x + F(x)', s:'덧셈'},
  {t:'다음 층으로'}
 ]},

confuse:[
 {a:'residual connection', b:'skip connection', d:'skip connection 은 "층을 건너뛰어 정보를 전달하는 연결"을 가리키는 더 넓은 용어(U-Net 의 인코더-디코더 연결 등도 포함)이고, residual connection 은 그중 **같은 위치에 덧셈으로** 더하는 특정 형태($x+F(x)$)다. 모든 residual connection 은 skip connection 이지만 역은 아니다(U-Net 은 덧셈이 아니라 concat 을 쓴다).'},
 {a:'residual connection', b:'dense connection(DenseNet)', d:'residual 은 이전 층 출력을 **더해서** 채널 수를 그대로 유지하고, dense connection 은 이전 모든 층의 출력을 **이어붙여(concat)** 채널 수가 계속 늘어난다. 전자는 경사 흐름 개선이 주목적, 후자는 특징 재사용 극대화가 주목적이다.'}
],

pitfalls:[
 '"잔차 연결이 있으면 무조건 깊게 쌓아도 안전하다"는 과장이다 — 경사 소실은 완화되지만, 층이 아주 깊으면 Pre-LN/Post-LN 배치, 초기화, 정규화 위치 등 다른 요인도 여전히 학습 안정성에 영향을 준다.',
 '$F(x)$ 가 배우는 것은 "잔차"이지 "전체 출력"이 아니라는 것을 놓치면 왜 초기화 시 $F$ 의 출력을 작게(0에 가깝게) 만드는 관행(예: 마지막 층 가중치를 0으로 초기화)이 학습 초반 안정성에 도움이 되는지 이해하기 어렵다.'
],

papers:['resnet','transformer'],
terms:['transformer-block','self-attention','gradient-problem']
});
