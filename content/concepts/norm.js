WIKI.concept({
slug:'norm',

tldr:'벡터의 크기를 하나의 숫자로 재는 함수로, L1(절댓값 합)과 L2(제곱합의 제곱근)가 가장 흔히 쓰이며 정칙화·경사 클리핑·LayerNorm 등 이름이 다른 여러 기법이 실은 서로 다른 노름을 고른 것에 불과하다.',

why:'"L1 정칙화는 왜 희소성을 만드는가", "gradient clipping 은 무엇을 자르는가", "LayerNorm 은 무엇을 정규화하는가" — 이 세 질문 모두 답이 노름이다. 노름을 모르고 이 기법들을 외우면 "그냥 그렇게 쓴다"는 암기에 그치지만, 노름의 기하학을 알면 왜 L1 이 0을 만들고 L2 는 안 만드는지가 그림으로 보인다.',

sections:[
 {h:'노름: 벡터 크기', d:'노름 $\\lVert x\\rVert$ 은 벡터 $x$ 를 음이 아닌 스칼라 하나로 대응시키는 함수로, $x=0$ 일 때만 0이고, 스케일과 삼각부등식을 만족해야 한다. 가장 흔한 두 가지가 L1 노름 $\\lVert x\\rVert_1=\\sum_i |x_i|$(성분 절댓값의 합)과 L2 노름 $\\lVert x\\rVert_2=\\sqrt{\\sum_i x_i^2}$(유클리드 거리, 익숙한 "길이")이다.'},
 {h:'L1·L2 정칙화', d:'과적합을 막기 위해 손실에 가중치의 노름을 페널티로 더한다. L2 정칙화(weight decay) $\\lambda\\lVert w\\rVert_2^2$ 는 모든 가중치를 골고루 작게 만들지만 정확히 0으로 만들지는 않는다 — L2 노름의 등고선이 원(구)이라 손실의 최적점이 축 위에 정확히 걸릴 확률이 낮기 때문이다. L1 정칙화 $\\lambda\\lVert w\\rVert_1$ 은 등고선이 마름모(다면체)라 꼭짓점(축 위, 즉 어떤 성분이 정확히 0)에서 최적점을 만나기 쉬워 **희소한**(많은 가중치가 정확히 0인) 해를 만든다 — 이게 L1 이 feature selection 효과를 내는 기하적 이유다.'},
 {h:'경사 클리핑', d:'[gradient clipping](#/c/grad-clipping)은 gradient 벡터 전체의 L2 노름이 임계값 $c$ 를 넘으면 방향은 유지한 채 크기만 줄인다: $g \\leftarrow g \\cdot \\min(1, c/\\lVert g\\rVert_2)$. RNN·LSTM 학습에서 gradient 폭주로 한 스텝에 파라미터가 터지는 것을 막는 표준 처방이며, 여기서 "gradient 의 크기"가 바로 L2 노름이다.'},
 {h:'LayerNorm 다름', d:'[LayerNorm](#/c/normalization)은 한 토큰(샘플)의 활성값 벡터를 평균 0, 분산 1이 되도록 재조정한다 — 이때 쓰이는 것은 앞의 L1/L2 노름이 아니라 평균과 [분산](#/c/expectation-variance)이지만, "벡터를 표준적인 크기로 맞춘다"는 목적 자체는 노름 정규화와 같은 계열의 발상이다. 이름에 "norm"이 들어가는 이 세 기법 — L1/L2 정칙화, gradient clipping, LayerNorm — 은 무엇의 크기를 재고 무엇을 조정하는지가 전부 다르므로 절대 같은 것으로 혼동하면 안 된다.'}
],

math:[
 {tex:'\\lVert x\\rVert_1=\\sum_i |x_i|,\\qquad \\lVert x\\rVert_2=\\sqrt{\\sum_i x_i^2}',
  expr:'L1 노름과 L2 노름', d:'L1 은 절댓값의 합, L2 는 제곱합의 제곱근(유클리드 거리). L2 의 제곱 $\\lVert x\\rVert_2^2=\\sum_i x_i^2$ 은 제곱근이 없어 미분이 더 매끄러워서 weight decay 계산에 자주 그대로 쓰인다.'},
 {tex:'g \\leftarrow g\\cdot\\min\\!\\left(1,\\ \\dfrac{c}{\\lVert g\\rVert_2}\\right)',
  expr:'gradient norm clipping', d:'$g$ 는 전체 파라미터에 대한 gradient 벡터, $c$ 는 임계값. $\\lVert g\\rVert_2$ 가 $c$ 를 넘으면 비율만큼 줄이고, 넘지 않으면 그대로 둔다(방향은 항상 보존).'}
],

diagram:{type:'compare', cap:'L1과 L2 정칙화의 등고선 모양이 다른 결과를 만든다.',
 left:{t:'L1 정칙화', items:['등고선이 마름모','꼭짓점에서 만남','희소한 해(0이 많음)']},
 right:{t:'L2 정칙화', items:['등고선이 원','축 밖에서 만남','고르게 작은 해']}},

confuse:[
 {a:'정칙화(regularization) L2', b:'정규화(normalization) LayerNorm', d:'한국어로 둘 다 "정규화"로 번역되곤 해 혼동이 잦다. L2 정칙화는 손실에 페널티를 더해 가중치 크기를 억제하는 학습 기법이고, LayerNorm 은 순전파 중 활성값의 분포를 재조정하는 층이다 — 원어(regularization vs normalization)를 병기해 구분하는 습관이 필요하다.'},
 {a:'L1 노름', b:'L0 "노름"', d:'L0 은 0이 아닌 성분의 개수를 세는 것으로 엄밀한 의미의 노름은 아니다(스케일 조건을 만족 안 함). "진짜 희소성"을 직접 최적화하려면 L0 이 이상적이지만 미분 불가능해 최적화가 어렵고, 그래서 L1 을 매끄러운 대체(convex relaxation)로 쓰는 것이다.'}
],

pitfalls:[
 '"L2 정칙화 = weight decay"로 완전히 동일시하는 경우가 있는데, [Adam](#/p/adam) 계열 optimizer 에서는 둘이 수학적으로 다르게 구현된다 — 이 차이를 바로잡은 것이 [AdamW](#/p/adamw)다.',
 'gradient clipping 의 임계값 $c$ 를 아무렇게나 크게 잡으면 사실상 클리핑이 작동하지 않는데도 "clipping 을 쓰고 있다"고 안심하는 경우가 있다 — 실제로 gradient norm 이 얼마나 되는지 로깅해서 임계값이 의미 있게 작동하는지 확인해야 한다.',
 '노름(norm)과 정규화(normalization)라는 단어 자체가 뿌리는 같지만, "L2 노름"은 크기를 재는 함수이고 "정규화"는 그 크기를 이용해(또는 평균·분산을 이용해) 값을 재조정하는 행위다 — 명사와 동작을 헷갈리면 문장이 뒤틀린다.'
],

code:{lang:'python', d:'L1과 L2 페널티가 만드는 최적해의 차이를 직접 확인.',
 src:'import numpy as np\nw = np.array([3.0, 0.1])\nl1 = np.abs(w).sum()      # L1 노름\nl2 = np.sqrt((w**2).sum())  # L2 노름\nprint(l1, l2)\n# L1 정칙화는 작은 성분(0.1)을 0으로 밀어내는 경향이 강하다'},

papers:['adamw','deep-compression'],
terms:['vector-matrix','normalization','grad-clipping']
});
