WIKI.paper({
slug:'attention-not-explanation',
venue:'NAACL 2019',
authors:'Jain & Wallace (Northeastern University)',
arxiv:'1902.10186',

tldr:'"attention 가중치가 높은 토큰이 예측의 근거"라는, [Transformer](#/p/transformer) 이전부터 널리 퍼져 있던 가정을 실험으로 반증한 논문. 가중치를 완전히 다르게 재배치해도 예측이 거의 그대로인 경우가 흔하다는 것을 보였다.',

context:'[Bahdanau attention](#/p/bahdanau) 이후 NLP 논문들은 attention 가중치 히트맵을 "모델이 무엇을 보고 이 답을 냈는지"에 대한 설명처럼 관행적으로 제시해 왔다. 하지만 저자들은 이 관행의 근거가 형식적으로 검증된 적이 없다는 점을 지적한다 — attention이 높다고 그 입력이 실제로 예측에 인과적으로 기여했다는 보장은 어디에도 없다. 이 논문이 다루는 것은 이 위키의 [내부 회로 해석(mechanistic interpretability)](#/p/induction-heads) 트랙과는 다른 질문이다. 회로 해석은 모델 내부에 실제로 어떤 계산이 있는지를 파고들지만, 이 논문은 그보다 훨씬 이전 세대의 질문 — **모델이 이미 내놓은 부산물(attention 가중치)을 설명으로 재활용해도 되는가** — 을 다룬다.',

ideas:[
 {h:'설명이라면 성립해야 할 두 가지 성질',
  lead:'attention이 설명이라면 (1) feature importance와 상관돼야 하고 (2) 가중치를 바꾸면 예측도 바뀌어야 한다.',
  d:'저자들은 "attention weight가 설명이다"라는 주장이 참이라면 성립해야 할 두 성질을 명시적으로 정의한다. 첫째, attention 가중치는 gradient 기반 feature importance나 leave-one-out(LOO, 그 입력을 지웠을 때 출력이 얼마나 바뀌는지)과 **상관관계**가 있어야 한다. 둘째, attention 가중치를 다른 값으로 바꾸면(counterfactual) 예측도 그에 상응해 **바뀌어야** 한다. BiLSTM + attention 모델에서는 이 둘 다 일관되게 관찰되지 않았다.'},
 {h:'gradient·LOO와의 상관은 약하다',
  lead:'Kendall τ 상관계수가 데이터셋 대부분에서 0.5 미만으로, 있어도 약하다.',
  d:'분류·QA·자연어추론 등 여러 데이터셋에서 BiLSTM의 attention 가중치와 gradient 기반 중요도, LOO 중요도 사이의 Kendall τ 상관을 측정했다. 평균이 대체로 0.5 이하였고, 일부 데이터셋(20News 등)은 0.1 근처로 사실상 무관했다. 반면 순환 구조 없이 단순히 가중합만 하는 "average" 인코더에서는 같은 상관이 0.65~0.8대로 훨씬 강했다 — **BiRNN이 은닉 상태에 입력을 뒤섞기 때문에 attention이 원래 입력과 멀어진다**는 해석이다.'},
 {h:'무작위로 섞어도 예측이 거의 안 변한다',
  lead:'attention 가중치를 무작위로 순열해도 출력 변화의 중앙값이 미미하다.',
  d:'같은 인스턴스에서 attention 가중치의 순서를 무작위로 100번 뒤섞고(Algorithm 2) 예측 변화를 Total Variation Distance로 측정했다. 예로 든 영화 리뷰에서는 순열 후 출력 차이의 중앙값이 0.006에 불과했다 — 가중치가 어디에 몰려 있든 예측은 거의 그대로였다는 뜻이다.'},
 {h:'적대적 attention: 완전히 다른 곳을 보고도 같은 답',
  lead:'원래 가중치와 최대한 다르면서 예측은 거의 그대로인 대안 가중치를 직접 탐색해 찾아낸다.',
  d:'무작위 순열보다 더 강한 반증으로, 예측을 $\\epsilon$ 이내로 유지하면서 원래 분포 $\\hat\\alpha$ 와 최대한 다른(Jensen-Shannon Divergence가 큰) 대안 분포 $\\tilde\\alpha$ 를 최적화로 찾는다(Figure 1의 `waste` 대신 `was`에 집중해도 예측이 동일하게 0.01인 사례). 이런 쌍이 존재한다는 것 자체가 "이 토큰이 근거였다"는 단일한 이야기를 무너뜨린다.'}
],

diagram:{type:'compare', cap:'"attention = 근거"라는 가정이 성립하려면 만족해야 할 조건과, 실제 관찰된 결과의 대비.',
 left:{t:'설명이려면 성립해야 할 것', items:['gradient/LOO와 강한 상관','가중치를 바꾸면 예측도 바뀜','대안 설명이 존재하면 안 됨']},
 right:{t:'BiLSTM+attention의 실제', items:['상관계수 대체로 0.5 미만','순열해도 출력 거의 불변','전혀 다른 적대적 가중치 존재']}},

math:[
 {expr:'TVD(ŷ1, ŷ2) = (1/2) Σ_i |ŷ1_i − ŷ2_i|',
  tex:'\\text{TVD}(\\hat y_1, \\hat y_2) = \\frac{1}{2}\\sum_i |\\hat y_{1i} - \\hat y_{2i}|',
  d:'두 예측 분포 사이의 Total Variation Distance. attention을 순열하거나 적대적으로 바꾼 뒤 예측이 얼마나 달라졌는지를 이 거리로 정량화한다.'},
 {expr:'maximize JSD(α̂, α) subject to TVD[ŷ(x,α), ŷ(x,α̂)] ≤ ε',
  tex:'\\max_{\\alpha}\\; \\text{JSD}(\\hat\\alpha, \\alpha)\\quad \\text{s.t.}\\quad \\text{TVD}\\bigl[\\hat y(x,\\alpha), \\hat y(x,\\hat\\alpha)\\bigr] \\le \\epsilon',
  d:'적대적 attention 탐색의 목적함수. 예측을 원래 값에서 $\\epsilon$ 이상 벗어나지 않게 제약한 채, attention 분포 자체는 원래 분포 $\\hat\\alpha$ 와 최대한 다르게(JS Divergence 최대화) 만든다.'}
],

numbers:[
 {k:'순열 후 출력 변화(중앙값)', v:'0.006', d:'Figure 1 영화 리뷰 사례에서 attention을 100번 무작위 순열했을 때'},
 {k:'BiLSTM ↔ gradient 상관(τg)', v:'대략 0.08~0.47', d:'데이터셋별 평균 Kendall τ, 대부분 약한 상관'},
 {k:'Average 인코더 ↔ gradient 상관(τg)', v:'대략 0.48~0.84', d:'같은 지표가 순환 구조를 뺀 인코더에서는 뚜렷하게 높아짐'},
 {k:'적대적 탐색 예시', v:'ε=0.01(분류) / 0.05(QA)', d:'예측 변화 허용치를 이 값으로 두고 최대한 다른 attention 분포를 탐색'},
 {k:'실험 규모', v:'분류·QA·NLI 등 다수 데이터셋', d:'SST·IMDB·ADR·20News·AG News·Diabetes·Anemia·CNN·bAbI·SNLI'}
],

impact:'이 논문은 attention 가중치를 그대로 캡션에 붙여 "모델이 여기를 봤다"고 설명하던 당시의 관행에 실증적 반례를 제시했다. 이후 attention을 설명으로 쓰려는 논문은 최소한 gradient·LOO와의 상관이나 counterfactual 안정성을 검증해야 한다는 압력을 받게 됐고, "attention이 그 자체로 해석이다"라는 주장은 훨씬 신중하게 다뤄지게 됐다. 다만 이 논문이 "attention은 절대 쓸모없다"고 결론짓지는 않는다는 점이 중요하다 — 순환 구조 없는 단순 인코더에서는 오히려 상관이 강했고, 저자들 스스로도 "다른 설계의 attention은 다른 결론을 낼 수 있다"고 여지를 남긴다.',

legacy:[
 '**"Attention is not not Explanation" (Wiegreffe & Pinter, 2019)의 반박** — 같은 해에 나온 후속 논문은 저자들의 실험 설계(가중치만 재조정하고 나머지 파라미터는 고정) 자체가 편향돼 있으며, 적대적 가중치가 "훈련으로 도달 가능한" 분포인지 확인해야 한다고 반박함 — 이 논쟁은 지금도 완전히 끝나지 않았다',
 '**사후 설명 방법 전체에 대한 경계심 확산** — [LIME](#/p/lime)·[SHAP](#/p/shap)·[Grad-CAM](#/p/grad-cam)처럼 모델 출력에서 거꾸로 근거를 추론하는 모든 사후(post-hoc) 설명 방법에 "그 설명이 실제로 신뢰할 만한가"를 검증하라는 요구가 강해짐',
 '**[Transformer](#/p/transformer) 시대의 재조명** — self-attention이 표준이 된 뒤에도 이 논쟁은 "attention map을 그대로 신뢰하지 말라"는 pitfall로 계속 인용됨',
 '**mechanistic interpretability로의 무게중심 이동** — 부산물(attention)을 해석하는 대신 모델 내부에 실제로 어떤 회로가 있는지 직접 규명하려는 [Induction Heads](#/p/induction-heads) 같은 흐름이 이후 별도로 성장함 — 사후 설명 대 기계적 해석이라는 구도의 한 축'
],

pitfalls:[
 '**"attention이 설명이 아니다"가 "attention이 무의미하다"는 뜻은 아니다.** attention은 여전히 성능을 높이는 유효한 메커니즘이며, 이 논문의 결론은 그것을 인간이 읽는 사후 설명으로 재활용하는 관행에 대한 것이다.',
 '**결과가 인코더 구조에 크게 의존한다.** BiLSTM처럼 은닉 상태에 여러 입력이 뒤섞이는 구조에서 강하게 나타난 현상이며, 단순 가중합(average) 인코더에서는 상관이 훨씬 강했다 — 모든 attention에 똑같이 적용되는 보편 법칙으로 오독하면 안 된다.',
 '**후속 반박("Attention is not not Explanation")이 있다는 것을 함께 봐야 한다.** 실험 설계와 "그럴듯한 설명"의 정의 자체에 대한 이견이 남아 있는, 현재진행형 논쟁이다.'
],

figures:[
 {f:'fig1-adversarial.png',
  cap:'같은 부정적 영화 리뷰에 대해 왼쪽은 실제로 관찰된 attention(단어 `waste`에 집중), 오른쪽은 완전히 다른 단어(`was`)에 집중하도록 적대적으로 만든 attention. 둘 다 예측값이 동일하게 0.01 — 어느 쪽 히트맵을 "근거"라고 믿어야 하는지 답이 없다는 것을 보여준다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig5-feedforward.png',
  cap:'세로축은 데이터셋, 가로축은 attention과 LOO 중요도의 평균 상관 차이(feed-forward 인코더 − BiLSTM 인코더). 모든 막대가 양수라는 것은 순환 구조를 뺀 단순 인코더일수록 attention이 실제 중요도와 더 일치한다는 뜻이다 — 문제가 attention 자체가 아니라 BiRNN이 입력을 뒤섞는 방식에 있다는 저자들의 가설을 뒷받침한다.',
  src:'원문 Figure 5, p.6'}
],

quotes:[
 {t:'We find that they largely do not. For example, learned attention weights are frequently uncorrelated with gradient-based measures of feature importance, and one can identify very different attention distributions that nonetheless yield equivalent predictions.',
  src:'Abstract, p.1'},
 {t:'Our findings show that standard attention modules do not provide meaningful explanations and should not be treated as though they do.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1902.10186 — Attention is not Explanation', u:'https://arxiv.org/abs/1902.10186'},
 {t:'AttentionExplanation (GitHub, successar)', u:'https://github.com/successar/AttentionExplanation'},
 {t:'Attention is not not Explanation (Wiegreffe & Pinter, 2019, 반박)', u:'https://arxiv.org/abs/1908.04626'}
]
});
