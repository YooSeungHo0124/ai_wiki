WIKI.concept({
slug:'adamw-c',

tldr:'가중치 감쇠는 SGD 에서 L2 정칙화와 수학적으로 같지만, Adam 에서는 L2 항이 적응적 학습률 계산에 섞여 달라진다 — AdamW 는 이 둘을 분리한다.',

why:'Adam 에 그냥 L2 정칙화를 걸면 기대한 만큼 정칙화가 안 된다는 것이 실무에서 반복적으로 관찰됐다. 왜 SGD 에서 통하던 등가성이 Adam 에서 깨지는지 수식으로 정확히 알아야, 지금 거의 모든 Transformer 사전학습이 왜 plain Adam 이 아니라 AdamW 를 쓰는지 설명할 수 있다.',

sections:[
 {h:'L2 정칙화', d:'손실에 파라미터 크기의 제곱합 $\\tfrac{\\lambda}{2}\\|\\theta\\|^2$ 을 더해 파라미터가 너무 커지지 않게 벌점을 준다. 이 항을 손실에 넣고 경사를 구하면, 원래 경사 $g_t$ 에 $\\lambda\\theta_t$ 가 그대로 더해진다.'},
 {h:'가중치 감쇠', d:'손실을 건드리지 않고, 갱신할 때 파라미터에 $(1-\\eta\\lambda)$ 를 곱해 매 스텝 일정 비율만큼 파라미터 자체를 줄인다(weight decay). "손실에 벌점을 더하는 것"과 "파라미터를 직접 깎는 것"은 얼핏 다른 조작처럼 보인다.'},
 {h:'SGD 에서 왜 같은가', d:'L2 항이 섞인 경사 $g_t+\\lambda\\theta_t$ 로 SGD 갱신을 풀어 쓰면 $\\theta_{t+1}=(1-\\eta\\lambda)\\theta_t-\\eta g_t$ 가 되어, 가중치 감쇠 갱신식과 정확히 같은 식이 나온다. SGD 에서는 학습률 $\\eta$ 가 경사와 감쇠 항에 똑같이 곱해지기 때문에 두 방식이 완전히 등가다.'},
 {h:'Adam 에서 왜 다른가', d:'Adam 에 L2 정칙화를 걸면 $\\lambda\\theta_t$ 가 섞인 경사 $g_t+\\lambda\\theta_t$ 가 1차·2차 모멘트 $m_t,v_t$ 계산에 그대로 들어간다. 그 결과 감쇠 효과가 파라미터별 실효 학습률 $\\eta/\\sqrt{\\hat v_t}$ 로 나뉘어 적용된다 — 최근 경사가 컸던(즉 $\\hat v_t$ 가 큰) 파라미터는 감쇠가 약해지고, 경사가 작았던 파라미터는 감쇠가 세진다. 의도한 것은 "모든 파라미터를 균일하게 줄이자"였는데, 실제로는 경사 크기에 따라 감쇠 강도가 제각각 달라지는 것이다.'},
 {h:'AdamW 의 분리', d:'[AdamW](#/p/adamw) 는 감쇠 항 $\\lambda\\theta_t$ 를 $m_t,v_t$ 계산에서 완전히 빼고, 모멘트로 구한 갱신량에 더한 뒤 마지막에 파라미터에 직접 적용한다. 이렇게 분리(decouple)하면 감쇠 강도가 더 이상 $\\hat v_t$ 에 휘둘리지 않고, SGD 에서처럼 모든 파라미터에 균일하게 걸린다.'},
 {h:'실무에서', d:'지금 거의 모든 Transformer 사전학습(BERT, GPT, ViT 계열)이 plain Adam 이 아니라 AdamW 를 기본값으로 쓴다 — 파라미터 수가 많고 층마다 경사 스케일이 크게 다른 모델일수록 감쇠가 뒤섞이는 문제가 두드러지기 때문이다. `weight_decay` 는 보통 0.01~0.1 범위를 쓰고, LayerNorm·bias 파라미터는 관행적으로 감쇠 대상에서 제외한다.'}
],

math:[
 {tex:'\\mathcal{L}_{L2}(\\theta)=\\mathcal{L}(\\theta)+\\tfrac{\\lambda}{2}\\|\\theta\\|^2 \\;\\Rightarrow\\; \\nabla_\\theta \\mathcal{L}_{L2}=g_t+\\lambda\\theta_t',
  expr:'L2 regularization', d:'$\\lambda$ 는 정칙화 강도, $g_t=\\nabla_\\theta\\mathcal{L}(\\theta_t)$. L2 정칙화는 "경사에 $\\lambda\\theta_t$ 를 더하는 것"으로 구현된다.'},
 {tex:'\\theta_{t+1}=\\theta_t-\\eta(g_t+\\lambda\\theta_t)=(1-\\eta\\lambda)\\theta_t-\\eta g_t',
  expr:'SGD: L2 = weight decay', d:'L2 를 섞은 SGD 갱신을 풀어 쓰면 파라미터에 $(1-\\eta\\lambda)$ 를 곱하는 가중치 감쇠와 정확히 같은 식이 된다 — SGD 에서 둘이 등가인 이유.'},
 {tex:'m_t=\\beta_1 m_{t-1}+(1-\\beta_1)(g_t+\\lambda\\theta_t),\\quad v_t=\\beta_2 v_{t-1}+(1-\\beta_2)(g_t+\\lambda\\theta_t)^2',
  expr:'Adam + L2 (coupled, 문제가 되는 방식)', d:'감쇠 항 $\\lambda\\theta_t$ 가 2차 모멘트 $v_t$ 계산에까지 섞여 들어간다 — 최종 갱신에서 감쇠의 실효 크기가 $\\hat v_t$ 에 의해 파라미터마다 달라진다.'},
 {tex:'m_t=\\beta_1 m_{t-1}+(1-\\beta_1)g_t,\\quad v_t=\\beta_2 v_{t-1}+(1-\\beta_2)g_t^2,\\qquad \\theta_{t+1}=\\theta_t-\\eta\\Big(\\dfrac{\\hat m_t}{\\sqrt{\\hat v_t}+\\epsilon}+\\lambda\\theta_t\\Big)',
  expr:'AdamW (decoupled)', d:'모멘트 $m_t,v_t$ 는 순수 경사 $g_t$ 로만 계산하고, 감쇠 항 $\\lambda\\theta_t$ 는 적응적 학습률 계산 바깥에서 갱신량에 직접 더한다 — 그래서 "decoupled weight decay".'}
],

diagram:{type:'compare', cap:'감쇠 항이 적응적 학습률 계산 안에 섞이느냐 밖에 있느냐가 전부다.',
 left:{t:'Adam + L2 (결합)', items:['$\\lambda\\theta_t$ 가 모멘트에 섞임','감쇠 강도가 $\\hat v_t$ 에 좌우됨','파라미터별로 감쇠가 불균일']},
 right:{t:'AdamW (분리)', items:['$m_t,v_t$ 는 순수 경사로만 계산','감쇠는 갱신량에 별도로 더함','모든 파라미터에 균일한 감쇠']}},

confuse:[
 {a:'정칙화(regularization)', b:'정규화(normalization)', d:'한국어로 둘 다 "정규화"로 옮겨질 때가 많아 혼동되지만 전혀 다른 개념이다. 정칙화는 과적합을 줄이려 손실이나 파라미터에 제약·벌점을 거는 것(L2, dropout, weight decay 등)이고, 정규화는 [배치정규화](#/c/normalization) 처럼 중간 활성값의 분포를 안정시키는 것이다.'},
 {a:'L2 정칙화', b:'가중치 감쇠(weight decay)', d:'SGD 에서는 수학적으로 완전히 같지만 Adam 에서는 다르다 — 이 항목의 핵심. Adam 처럼 적응적 학습률을 쓰는 옵티마이저에서는 반드시 "decoupled weight decay(AdamW)"인지, "L2 를 경사에 섞은 것"인지 구분해야 한다.'},
 {a:'weight decay 계수 $\\lambda$', b:'학습률 $\\eta$', d:'AdamW 갱신식에서 실제로 적용되는 감쇠량은 $\\eta\\lambda\\theta_t$ 로, $\\eta$ 와 $\\lambda$ 의 곱이다. 학습률 스케줄로 $\\eta$ 가 시간에 따라 변하면 감쇠 강도도 함께 변한다는 뜻이라, 스케줄과 감쇠 강도를 독립적으로 다루고 싶다면 이 결합을 별도로 신경 써야 한다.'}
],

pitfalls:[
 'PyTorch 의 `optim.Adam(weight_decay=...)` 는 L2 를 경사에 섞는 결합 방식이고, `optim.AdamW(weight_decay=...)` 만 실제로 분리된 감쇠다 — 이름이 있다고 자동으로 decouple 되는 게 아니라 클래스 자체가 다르다.',
 'SGD 에서 쓰던 weight_decay 값을 그대로 AdamW 에 옮기면 안 된다 — 두 옵티마이저에서 감쇠가 작동하는 스케일 감각이 다르다.',
 'LayerNorm 이나 bias 파라미터에까지 감쇠를 걸면 성능이 떨어지는 경우가 많아, 보통 이런 파라미터는 감쇠 대상에서 제외하는 것이 관행이다.'
],

papers:['adamw','adam'],
terms:['regularization','adaptive-optimizer','sgd','optimizer-choice']
});
