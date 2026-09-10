WIKI.paper({
slug:'rl-summarization',
venue:'ICLR 2018 (arXiv 2017)',
authors:'Paulus, Xiong & Socher (Salesforce Research)',
arxiv:'1705.04304',

tldr:'긴 문서 요약에서 반복·비문 문제를 **intra-attention**으로 줄이고, ROUGE를 직접 보상으로 쓰는 **정책 경사 강화학습**과 지도학습을 섞어 학습시킨 논문. 다만 ROUGE만으로 학습하면 점수는 오르지만 사람이 매긴 가독성은 오히려 떨어진다는 것을 스스로 실험으로 보여준, RLHF 이전 시대의 경고 사례이기도 하다.',

context:'2017년 무렵 attention 기반 encoder-decoder([Bahdanau attention](#/p/bahdanau) 계열)는 한두 문장짜리 짧은 입력을 요약하는 데는 잘 통했지만, CNN/Daily Mail처럼 최대 800토큰짜리 긴 기사를 100토큰 요약으로 줄이는 과제에서는 같은 구절을 반복하거나 문법이 무너지는 현상이 흔했다. 또 다른 문제는 학습 방식 자체였다. 표준 teacher-forcing(최대우도) 학습은 학습 때는 항상 정답을 다음 입력으로 주지만 추론 때는 자기 자신이 만든(때로 틀린) 토큰을 이어 붙여야 하는 **노출 편향(exposure bias)**을 만든다. 게다가 사람이 실제로 평가할 지표(ROUGE)는 토큰 단위 교차엔트로피와 다르고 미분도 불가능해서, 손실함수가 최종 목표와 어긋난다는 문제가 있었다.',

ideas:[
 {h:'Intra-temporal attention: 이미 본 곳을 또 보지 않는다',
  lead:'인코더 attention 점수를 과거 스텝들과 정규화해 같은 입력 구간을 반복해서 보지 못하게 한다.',
  d:'디코딩 스텝 $t$ 마다 입력 토큰에 대한 attention 점수를 계산할 때, 지금까지 누적된 attention 값으로 다시 나눠 정규화한다. 이렇게 하면 이미 많이 참조된 입력 구간의 가중치가 자연히 낮아져, 디코더가 같은 문장을 반복해서 베끼는 현상이 줄어든다.'},
 {h:'Intra-decoder attention: 자신이 이미 쓴 말을 참조한다',
  lead:'디코더가 인코더뿐 아니라 자기가 이미 생성한 이전 토큰들에도 attention을 건다.',
  d:'기존 encoder-decoder attention은 디코더가 입력 기사만 쳐다본다. 여기서는 디코더 hidden state들끼리도 별도의 attention을 둬서, 방금 전에 이미 "expanded"라고 썼다면 다음 단어를 고를 때 그 사실을 참조할 수 있게 한다. 긴 요약일수록 이 자기참조가 반복 방지에 특히 중요했다.'},
 {h:'Self-critical 정책 경사로 ROUGE를 직접 최적화',
  lead:'샘플링한 문장과 greedy 문장의 보상 차이를 정책 경사 신호로 쓴다.',
  d:'매 학습 스텝에서 확률분포로부터 샘플링한 요약 $y^s$ 와 greedy 디코딩한 요약 $\\hat y$ 를 각각 만들고, 둘의 ROUGE 보상 차이 $r(\\hat y)-r(y^s)$ 를 샘플 시퀀스의 로그확률에 곱해 손실로 쓴다. 별도의 가치함수 baseline 없이 greedy 출력 자체를 baseline으로 쓰는 self-critical 방식이라, ROUGE 같은 미분 불가능한 지표를 그대로 보상으로 최적화할 수 있다.'},
 {h:'ML+RL 혼합 목적함수로 가독성을 지킨다',
  lead:'교차엔트로피 손실과 RL 손실을 $\\gamma$ 로 섞어 지표 점수와 문장 품질을 함께 잡는다.',
  d:'RL 손실만 쓰면 ROUGE는 오르지만 사람이 보기엔 문장이 뚝뚝 끊기고 부자연스러워진다. 저자들은 최대우도 손실(자연스러운 언어모델 역할)과 RL 손실(전역적인 지표 최적화)을 가중합해, ROUGE 점수를 유지하면서도 가독성을 되살리는 절충안을 택했다.'}
],

diagram:{type:'compare', cap:'같은 인코더-디코더에서, 최대우도만 쓸 때와 ROUGE를 보상으로 하는 RL을 섞을 때의 학습 신호 차이.',
 left:{t:'ML(teacher forcing)', items:['매 스텝 정답 토큰 입력','토큰 단위 교차엔트로피','추론 시 노출 편향 발생']},
 right:{t:'ML+RL(self-critical)', items:['시퀀스 전체를 보상으로 평가','ROUGE-L을 보상으로 사용','가독성 유지하며 지표 개선']}},

math:[
 {expr:'Lml = -Σ log p(yt* | y1*,...,y(t-1)*, x)',
  tex:'L_{ml} = -\\sum_{t=1}^{n\\prime} \\log p(y_t^{*}\\mid y_1^{*},\\dots,y_{t-1}^{*},x)',
  d:'표준 teacher-forcing 손실. 매 스텝 정답 접두어를 입력으로 주고 다음 정답 토큰의 로그확률을 최대화한다.'},
 {expr:'Lrl = (r(ŷ) - r(y^s)) · Σ log p(y_t^s | y_1^s,...,y_(t-1)^s, x)',
  tex:'L_{rl} = \\bigl(r(\\hat y) - r(y^{s})\\bigr)\\sum_{t=1}^{n\\prime}\\log p\\bigl(y_t^{s}\\mid y_1^{s},\\dots,y_{t-1}^{s},x\\bigr)',
  d:'샘플 $y^s$ 가 greedy baseline $\\hat y$ 보다 보상이 낮으면 그 시퀀스의 확률을 낮추는 방향으로, 높으면 높이는 방향으로 학습한다. 보상 $r$ 은 ROUGE-L로 계산한다.'},
 {expr:'Lmixed = γ·Lrl + (1-γ)·Lml',
  tex:'L_{mixed} = \\gamma L_{rl} + (1-\\gamma) L_{ml}',
  d:'두 손실을 스칼라 $\\gamma$ 로 섞은 최종 목적함수. RL만으로는 부자연스러워지는 문장을 ML 항이 붙잡아 준다.'}
],

numbers:[
 {k:'ROUGE-1 · CNN/DM (RL 단독)', v:'41.16', d:'당시 SOTA 갱신, intra-attention 사용'},
 {k:'ROUGE-1 · CNN/DM (ML 단독)', v:'38.30', d:'같은 intra-attention 구조, 지도학습만'},
 {k:'ROUGE-1 · CNN/DM (ML+RL)', v:'39.87', d:'RL 단독보다 낮지만 가독성 회복'},
 {k:'가독성 점수 (사람 평가, ML/RL/ML+RL)', v:'6.76 / 4.18 / 7.04', d:'10점 만점, Mechanical Turk 5인 평가 평균'},
 {k:'관련성 점수 (사람 평가, ML/RL/ML+RL)', v:'7.14 / 6.32 / 7.45', d:'ROUGE 최고인 RL이 사람 평가에선 최하위'}
],

impact:'ROUGE 점수와 사람이 느끼는 요약 품질이 어긋날 수 있다는 것을 정량 실험으로 보여준 것이 가장 중요한 기여다. 지표를 강화학습 보상으로 직접 밀어붙이면 그 지표는 오르지만, 실제 목표(자연스럽고 유용한 요약)와는 괴리가 생길 수 있다는 **Goodhart 문제의 구체적 사례**를 요약이라는 실용 과제에서 재현했다. Intra-attention을 통한 반복 억제 아이디어도 이후 요약 모델들에 흡수됐다.',

legacy:[
 '**지표 기반 RL의 한계를 실증** — 이 논문이 관찰한 "ROUGE는 오르는데 사람 평가는 아니다" 현상이 [요약 RLHF](#/p/summarize-hf)가 자동 지표 대신 **사람 선호 자체**를 보상 모델로 학습하는 방향 전환의 배경이 됨',
 '**self-critical 정책 경사의 확산** — 별도 가치함수 없이 greedy 출력을 baseline으로 쓰는 방식이 이미지 캡셔닝 등 다른 시퀀스 생성 과제로도 퍼짐',
 '**반복 억제 기법의 정착** — intra-temporal/intra-decoder attention이 이후 커버리지 메커니즘 등과 함께 긴 문서 요약의 표준 도구가 됨',
 '**추출 요약·사전학습 모델로의 흐름 전환** — 이후 요약 연구는 순수 RNN+RL보다 사전학습된 seq2seq(예: BART류)와 사람 피드백 결합 쪽으로 무게중심이 옮겨감'
],

pitfalls:[
 '**"RL이 이겼다"고 단순화하면 안 된다.** 이 논문 표 자체가 RL 단독 모델이 ROUGE 최고점(41.16)이면서 가독성 최저점(4.18/10)임을 보여준다. 저자들이 실제로 배포 후보로 제시한 것은 ROUGE가 더 낮은 ML+RL 혼합 모델이다.',
 '**지표를 보상으로 최적화하는 강화학습이 이 논문의 발명은 아니다.** self-critical 정책 경사는 이미지 캡셔닝(Rennie et al., 2016)에서 가져온 기법이며, 이 논문의 기여는 그것을 긴 문서 요약에 적용하고 intra-attention·혼합 목적함수와 결합한 것이다.',
 '**두 데이터셋의 경향이 다르다.** CNN/Daily Mail에서는 intra-attention이 뚜렷하게 도움이 됐지만, 요약이 더 짧은 NYT 데이터셋에서는 개선폭이 작았다 — 문서·요약 길이에 따라 효과가 갈린다.'
],

figures:[
 {f:'fig1-intra-attention.png',
  cap:'왼쪽 인코더가 입력 토큰별 attention을 누적(초록 상자가 이미 많이 참조된 토큰)해 반복 참조를 억제하고, 오른쪽 디코더는 자신이 만든 이전 토큰들(파란 상자)에도 attention을 걸어 두 context 벡터(C)와 현재 hidden state(H)로 다음 단어를 고른다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'This confirms that optimizing for single discrete evaluation metric such as ROUGE with RL can be detrimental to the model quality.',
  src:'Section 6.3, p.8'}
],

links:[
 {t:'arXiv 1705.04304 — A Deep Reinforced Model for Abstractive Summarization', u:'https://arxiv.org/abs/1705.04304'},
 {t:'OpenReview (ICLR 2018)', u:'https://openreview.net/forum?id=HkAClQgA-'}
]
});
