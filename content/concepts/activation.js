WIKI.concept({
slug:'activation',

tldr:'선형 계산 $w\\cdot x+b$ 뒤에 붙는 비선형 함수로, 이게 없으면 층을 아무리 쌓아도 신경망 전체가 선형 함수 하나로 붕괴한다.',

why:'활성 함수 선택은 학습 속도, 경사 소실 여부, 최종 성능에 직접 영향을 준다. CNN 시대의 표준(ReLU)과 지금 Transformer 의 표준(GELU·SwiGLU)이 다르다는 것, 그리고 왜 다른지를 모르면 모델 코드를 읽어도 설계 의도가 안 보인다.',

sections:[
 {h:'왜 비선형이 필요한가', d:'선형 층만 쌓으면 $y=W_2(W_1x+b_1)+b_2=(W_2W_1)x+(W_2b_1+b_2)$ 로, 이는 그냥 $Wx+b$ 꼴의 선형 함수 하나다. 층을 100개 쌓아도 행렬곱을 미리 다 합쳐버리면 표현력이 선형 회귀 한 개와 동일해진다. 활성 함수가 각 층 사이에 비선형을 끼워 넣어야만 층을 쌓는 것이 실제로 더 복잡한 함수를 표현하는 일이 된다.'},
 {h:'죽은 ReLU 문제', d:'$f(x)=\\max(0,x)$ 는 $x<0$ 구간의 미분이 정확히 0이다. 학습 중 어떤 뉴런의 입력이 계속 음수 쪽으로 밀리면 그 뉴런은 영원히 경사를 못 받아 "죽는다" — 특히 학습률이 크거나 편향이 크게 음수로 갱신될 때 흔하다. Leaky ReLU·[ELU](#/p/elu)·[GELU](#/p/gelu)는 이 죽는 구간을 없애거나 완화하려고 나왔다.'},
 {h:'지금 실무에서 무엇을 쓰는가', d:'CNN 계열(ResNet·MobileNet)은 여전히 ReLU 나 그 변형을 쓴다 — 계산이 가장 싸고 충분히 잘 되기 때문이다. Transformer 계열은 GPT·BERT 가 [GELU](#/p/gelu)를 표준으로 만들었고, LLaMA 이후 대형 LLM 은 FFN 을 SwiGLU(게이트 달린 [Swish](#/p/swish))로 바꾸는 쪽이 많다 — 같은 파라미터 수 대비 품질이 낫다는 경험적 보고 때문이다. sigmoid·tanh 는 은닉층 활성으로는 경사 소실 때문에 거의 밀려났고, 게이트 값(LSTM 게이트, 어텐션 밖 확률)이나 출력층에서만 산다.'},
 {h:'출력층은 다르다', d:'은닉층 활성 함수와 출력층 함수는 목적이 다르다. 은닉층은 표현력을 늘리는 것이 목적이고, 출력층(softmax·sigmoid)은 원시 점수(logit)를 확률로 정규화하는 것이 목적이다. 이 둘을 같은 개념으로 섞으면 안 된다 — 아래 confuse 참고.'}
],

math:[
 {tex:'\\text{ReLU}(x)=\\max(0,x)', expr:'ReLU', d:'$x>0$ 이면 그대로, $x\\le 0$ 이면 0. 계산이 max 한 번뿐이라 극단적으로 싸고, 양의 구간에서 미분이 항상 1이라 경사가 잘 흐른다.'},
 {tex:'\\text{GELU}(x)=x\\,\\Phi(x)=x\\cdot\\tfrac12\\Big(1+\\text{erf}\\big(x/\\sqrt2\\big)\\Big)', expr:'GELU', d:'$\\Phi$ 는 표준정규분포의 누적분포함수(CDF). 입력값 $x$ 를 "그 값이 얼마나 클 확률이 높은가"로 확률적으로 게이팅한다고 볼 수 있다. ReLU처럼 꺾이지 않고 매끄럽게 0으로 이어져 미분도 매끄럽다.'},
 {tex:'\\text{Swish}(x)=x\\cdot\\sigma(\\beta x)', expr:'Swish/SiLU', d:'$\\sigma$ 는 sigmoid. $\\beta$ 를 고정(보통 1, 이때 SiLU)하거나 학습 가능하게 둔다. GELU 와 곡선 모양이 거의 같아 실전에서는 상호 대체되는 경우가 많다.'},
 {tex:'\\text{ELU}(x)=\\begin{cases}x & x>0\\\\ \\alpha(e^x-1) & x\\le 0\\end{cases}', expr:'ELU', d:'음수 구간을 0이 아니라 $-\\alpha$ 로 수렴하는 매끄러운 곡선으로 채워, 평균 활성값을 0에 가깝게 밀어주는 효과(정규화와 비슷한 역할)가 있다고 보고됐다.'}
],

diagram:{type:'compare', cap:'CNN 표준과 LLM 표준의 활성 함수 선택이 갈린 이유.',
 left:{t:'CNN · ReLU 계열', items:['계산 1회 max — 가장 저렴','죽은 ReLU 위험 존재','ResNet·MobileNet 기본값']},
 right:{t:'LLM · GELU/SwiGLU', items:['전 구간 매끄러운 미분','음수 구간도 약하게 통과','BERT/GPT/LLaMA FFN 표준']}},

confuse:[
 {a:'활성 함수', b:'출력 함수(softmax)', d:'은닉층의 활성 함수(ReLU·GELU)는 층과 층 사이에서 비선형성을 넣는 것이 목적이고, softmax 는 마지막 층의 logit 을 확률분포로 바꾸는 정규화다. softmax 를 은닉층에 쓰지 않고, ReLU 를 다중분류 출력층에 쓰지 않는다.'},
 {a:'ReLU', b:'Leaky ReLU', d:'ReLU 는 $x\\le0$ 에서 정확히 0(경사도 0). Leaky ReLU 는 그 구간에 작은 기울기(예: 0.01)를 남겨 뉴런이 완전히 죽는 것을 막는다.'},
 {a:'GELU', b:'Swish', d:'수식은 다르지만($\\Phi$ vs sigmoid) 곡선이 거의 겹쳐 실무에서는 상호 교체 가능한 경우가 많다. GELU 는 BERT·GPT 계열에서, Swish/SiLU 는 EfficientNet·LLaMA(SwiGLU 형태로) 계열에서 표준이 됐다.'}
],

pitfalls:[
 '"비선형이면 다 똑같다"가 아니다 — 활성 함수의 미분 형태가 경사 소실/폭주, 학습 속도, 죽은 뉴런 여부를 직접 좌우한다.',
 'sigmoid/tanh 를 깊은 은닉층에 그대로 쓰면 각 층을 지날 때마다 미분값(최대 0.25, 1)이 곱해져 [경사 소실](#/c/gradient-problem)이 빠르게 심해진다.',
 'ReLU 가 "죽었다"는 걸 학습 곡선만 보고는 알아채기 어렵다 — 활성값 히스토그램에서 0이 대다수인지 확인해야 한다.'
],

papers:['gelu','swish','elu'],
terms:['perceptron-c','gradient-problem','loss-function']
});
