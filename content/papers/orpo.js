WIKI.paper({
slug:'orpo',
venue:'EMNLP 2024',
authors:'Hong, Lee, Thorne (KAIST AI)',
arxiv:'2403.07691',

tldr:'지도 미세조정(SFT)과 선호 정렬을 **참조 모델 없이 한 단계로** 합친다. [DPO](#/p/dpo)가 여전히 메모리에 올려야 했던 참조 모델을 완전히 없애고, 확률비(odds ratio) 벌점 하나를 NLL 손실에 더하는 것만으로 정렬 효과를 낸다.',

context:'[DPO](#/p/dpo)는 RLHF의 별도 보상 모델과 PPO 루프를 없앴지만, 여전히 **두 가지 비용**이 남아 있었다. 하나는 SFT로 워밍업한 뒤 다시 선호 데이터로 정렬하는 **2단계 파이프라인**이고, 다른 하나는 정책이 참조 분포에서 너무 벗어나지 않게 잡아주는 **참조 모델을 메모리에 동시에 올려야 한다**는 것이다. 저자들은 먼저 SFT 단계 자체를 분석해, SFT만으로도 학습 후반부에 비선호 응답의 로그 확률이 오히려 같이 오르는 현상(선호·비선호 응답의 우도가 함께 증가)을 관찰하고, 이 부작용을 SFT 손실 안에서 직접 억제하는 방법을 설계한다.',

ideas:[
 {h:'SFT 손실에 확률비 벌점을 그냥 더한다',
  lead:'NLL 손실에 선호·비선호 응답의 odds ratio 항 하나를 얹어 참조 모델 없이 정렬한다.',
  d:'ORPO의 전체 손실은 $L_{SFT}$ 와 $L_{OR}$ 의 가중합이다. $L_{SFT}$ 는 평소의 언어모델 학습 손실 그대로이고, $L_{OR}$ 만이 선호 응답 $y_w$ 의 확률비를 비선호 응답 $y_l$ 의 확률비보다 키우도록 강제한다. 별도의 정렬 단계나 참조 모델 forward pass가 필요 없다.'},
 {h:'확률(probability)이 아니라 확률비(odds)를 비교한다',
  lead:'odds = P/(1-P)를 쓰면 이미 확률이 높은 응답을 더 밀어붙이는 낭비가 줄어든다.',
  d:'odds$_\\theta(y|x) = P_\\theta(y|x) / (1-P_\\theta(y|x))$ 로 정의하고, $y_w$ 의 odds가 $y_l$ 의 odds보다 상대적으로 얼마나 큰지를 log-sigmoid로 감싸 손실로 쓴다. 확률 자체의 차이보다 완만하게 반응해, 이미 잘 맞추고 있는 예에 과도한 그래디언트를 쏟지 않는다.'},
 {h:'그래디언트가 벌점과 대비(contrast) 두 항으로 자연히 나뉜다',
  lead:'틀린 예측에 대한 벌점 항과 선호/비선호 우도 격차를 벌리는 대비 항이 곱해진다.',
  d:'$L_{OR}$ 을 미분하면 $\\delta(d) \\cdot h(d)$ 형태가 되는데, $\\delta(d)$ 는 모델이 비선호 응답을 더 그럴듯하게 여길수록 커지는 **벌점 가중치**이고, $h(d)$ 는 $1-P(y|x)$ 로 나눠 우도가 낮은 쪽의 그래디언트를 증폭시키는 **대비 항**이다. 저자들은 이 구조가 "비선호 응답에는 약한 벌점, 선호 응답에는 강한 적응 신호"로 자연스럽게 작동한다고 설명한다.'}
],

diagram:{type:'compare', cap:'RLHF·DPO는 SFT 이후 별도의 참조 모델(Ref.)과 정책(Policy)을 동시에 다뤄야 하지만, ORPO는 사전학습 모델에서 한 번에 끝난다.',
 left:{t:'RLHF / DPO', items:['SFT 워밍업 단계 필요','참조 모델을 메모리에 유지','2단계(또는 RM+RL) 파이프라인']},
 right:{t:'ORPO', items:['SFT와 정렬을 한 번에','참조 모델 불필요','odds ratio 벌점만 추가'],}
},

math:[
 {expr:'L_ORPO = E[L_SFT + λ·L_OR]',
  tex:'L_{ORPO} = \\mathbb{E}_{(x,y_w,y_l)}\\left[L_{SFT} + \\lambda \\cdot L_{OR}\\right]',
  d:'전체 손실. $L_{SFT}$ 는 표준 언어모델링 NLL, $L_{OR}$ 이 이 논문이 추가하는 항이다. $\\lambda$ 는 둘의 비중을 조절하는 하이퍼파라미터(실험에서는 0.1~1.0 범위로 스윕).'},
 {expr:'L_OR = -log σ( log( odds_θ(y_w|x) / odds_θ(y_l|x) ) )',
  tex:'L_{OR} = -\\log \\sigma\\!\\left(\\log \\frac{\\text{odds}_\\theta(y_w|x)}{\\text{odds}_\\theta(y_l|x)}\\right)',
  d:'선호 응답과 비선호 응답의 odds 비율의 로그를 시그모이드로 감싸 최대화하는 형태 — DPO의 손실과 겉모습이 닮았지만, 참조 모델 확률비가 아니라 **정책 자신의 odds 비율**만 쓴다는 점이 다르다.'}
],

numbers:[
 {k:'Mistral-ORPO-α (7B) AlpacaEval2.0', v:'11.33%', d:'Zephyr-α(8.35%)를 능가'},
 {k:'Mistral-ORPO-β (7B) AlpacaEval2.0', v:'12.20%', d:'Zephyr-β(10.99%)·Llama-2-Chat(13B)도 능가'},
 {k:'MT-Bench', v:'7.23 / 7.32', d:'Mistral-ORPO-α / β 각각의 점수'},
 {k:'IFEval (instruction-level loose)', v:'66.19%', d:'같은 Mistral-ORPO-β 체크포인트 기준'},
 {k:'λ 스윕 범위', v:'{0.1, 0.5, 1.0}', d:'과제·모델에 따라 최적값이 달라짐'}
],

impact:'DPO가 없앤 보상 모델·PPO에 이어, **참조 모델과 별도 SFT 단계까지** 없애면서 정렬 파이프라인을 사실상 "언어모델 학습에 항 하나 추가"로 축소했다. 7B급 모델 하나로 학습 파이프라인을 단순화하면서도 Zephyr·Llama-2-Chat(13B)급 공개 정렬 모델을 능가하는 결과를 보여, 참조 모델 메모리 비용이 정렬 품질에 필수적이지 않을 수 있음을 시사했다.',

legacy:[
 '**참조 모델 제거 계열**의 대표 사례로 자리잡아, 이후 메모리 제약이 큰 환경에서의 정렬 방법 설계에 자주 인용됨',
 '[KTO](#/p/kto)와 함께 "DPO의 비용 요소(쌍 데이터, 참조 모델)를 하나씩 제거하는" 2024년 정렬 연구 흐름을 이룸',
 'Mistral-ORPO 체크포인트 공개로 후속 오픈소스 정렬 실험의 베이스라인으로 널리 채택됨',
 'odds ratio라는 비교적 단순한 통계량이 선호 정렬에 유효하다는 것을 보여, 이후 손실 함수 설계에서 확률비 기반 벌점을 재검토하게 함'
],

pitfalls:[
 '**"참조 모델이 필요 없다"가 "선호 데이터가 필요 없다"는 뜻이 아니다.** ORPO도 여전히 선호 쌍 $(y_w, y_l)$ 을 필요로 한다 — 없어진 것은 참조 모델과 별도 SFT 단계이지 선호 데이터 자체가 아니다.',
 '$\\lambda$ 값에 성능이 상당히 민감하다. 논문의 ablation에서도 과제·모델에 따라 최적값이 다르게 나왔으므로, 특정 논문의 하이퍼파라미터를 그대로 가져다 쓰면 재현이 어려울 수 있다.',
 '검증은 주로 7B급 모델(Llama-2, Mistral, Phi-2)에 국한된다. 이후 [KTO](#/p/kto)가 30B까지 스케일을 검증한 것과 달리, ORPO 자체 논문에서는 더 큰 모델에서의 거동이 확인되지 않았다.'
],

figures:[
 {f:'fig2-orpo-vs-rlhf-dpo.png',
  cap:'왼쪽 두 열(RLHF·DPO)은 SFT와 별도의 참조 모델(Ref.)·정책(Policy) 쌍을 거치지만, 세 번째 열의 ORPO는 사전학습 모델에서 화살표 하나로 바로 끝난다. 오른쪽 상자가 그 정렬 신호 — 선호 응답에는 강한 적응, 비선호 응답에는 약한 벌점을 주는 log odds ratio 항이다.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'ORPO aligns the language model without a reference model in a single-step manner by assigning a weak penalty to the rejected responses and a strong adaptation signal to the chosen responses.',
  src:'Figure 2 caption, p.2'}
],

links:[
 {t:'arXiv 2403.07691 — ORPO: Monolithic Preference Optimization without Reference Model', u:'https://arxiv.org/abs/2403.07691'},
 {t:'GitHub — ORPO 공식 구현', u:'https://github.com/xfactlab/orpo'}
]
});
