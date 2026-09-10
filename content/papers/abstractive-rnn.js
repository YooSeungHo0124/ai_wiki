WIKI.paper({
slug:'abstractive-rnn',
venue:'CoNLL 2016 (SIGNLL)',
authors:'Nallapati, Zhou, dos Santos, Gulcehre, Xiang (IBM Watson · Université de Montréal)',
arxiv:'1602.06023',

tldr:'[Bahdanau attention](#/p/bahdanau) encoder-decoder RNN을 요약에 그대로 옮기는 것만으로 당시 SOTA를 넘어선 뒤, 미등록 단어·계층 구조·키워드라는 요약 고유의 세 문제를 각각 별도 메커니즘으로 풀었다. 그 과정에서 만든 **CNN/Daily Mail 데이터셋**이 이후 거의 모든 문서 요약 논문의 표준 벤치마크가 됐다.',

context:'[neural-summarization](#/p/neural-summarization)(ABS)은 feed-forward NNLM 디코더와 bag-of-words 인코더로 **문장 하나**를 헤드라인으로 압축했다. 이 논문은 두 가지를 동시에 밀어붙인다. 첫째, 디코더를 RNN으로, 인코더를 양방향 GRU로 바꿔 [Bahdanau attention](#/p/bahdanau)의 기계번역 레시피를 거의 그대로 가져온다. 둘째, **여러 문장·문서 전체**를 입력으로 받는 진짜 문서 요약으로 과제를 확장한다. 문제는 번역과 달리 요약은 (1) 출력이 입력 길이에 거의 의존하지 않고, (2) 입력의 핵심 단어·문장을 선별적으로 압축해야 하며, (3) 정답 요약 안에 원문에 없던 단어보다 원문의 고유명사·희귀어가 그대로 복사되는 경우가 많다는 점이다. 이 세 가지가 기계번역 모델을 그대로 쓸 수 없게 만드는 지점이다.',

ideas:[
 {h:'기본 encoder-decoder RNN을 그대로 이식',
  lead:'양방향 GRU 인코더 + attention + 단방향 GRU 디코더를 요약에 그대로 적용한다.',
  d:'[Bahdanau et al. 2014](#/p/bahdanau)의 번역 모델 구조를 구조 변경 없이 요약에 적용한 것만으로 두 개 코퍼스에서 SOTA를 달성했다는 것이 첫 번째 발견이다. 계산 병목인 softmax를 줄이기 위해 [Jean et al. 2014](https://arxiv.org/abs/1412.2007)의 large vocabulary trick(LVT)도 함께 썼다 — 미니배치 안에서 등장한 원문 단어 + 최빈 단어로만 디코더 어휘를 제한한다.'},
 {h:'Feature-rich encoder: 품사·개체명·TF-IDF를 임베딩으로 붙인다',
  lead:'단어 임베딩에 POS·NER·이산화된 TF/IDF 임베딩을 이어붙여 입력 표현을 키운다.',
  d:'요약은 핵심 개체·핵심 개념을 골라내는 과제인데, 단어 임베딩만으로는 "이 단어가 문법적으로 무엇이고 얼마나 중요한 개체인가"가 드러나지 않는다. 품사 태그·개체명 태그·연속값을 구간화한 TF·IDF 각각에 대해 별도 임베딩 행렬을 두고 단어 임베딩과 concat해 인코더 입력으로 쓴다.'},
 {h:'Switching Generator-Pointer: 만들지 복사할지 매 스텝 결정',
  lead:'매 디코딩 스텝마다 sigmoid 스위치로 "어휘에서 생성"과 "원문 위치를 가리켜 복사"를 선택한다.',
  d:'디코더 어휘는 학습시 고정되므로 테스트 시점의 희귀 고유명사는 UNK로만 나올 수밖에 없었다. 이 논문은 은닉 상태·이전 출력 임베딩·attention 컨텍스트로 스위치 확률 $P(s_i)$ 를 계산하고, 꺼지면 attention 분포에서 argmax로 원문 위치를 골라 그 단어를 그대로 복사한다. 학습시에는 정답 요약 단어가 어휘에 없을 때만 명시적 포인터 정답을 준다.'},
 {h:'Hierarchical Attention: 단어 수준과 문장 수준을 동시에 본다',
  lead:'문장 단위 RNN을 하나 더 얹어 단어 attention을 그 문장의 중요도로 다시 가중한다.',
  d:'문서가 길면 "어느 단어"뿐 아니라 "어느 문장"이 중요한지도 갈린다. 단어 수준·문장 수준 양방향 RNN을 각각 두고 $P^a(j) = P_w^a(j)P_s^a(s(j)) / \\sum_k P_w^a(k)P_s^a(s(k))$ 로 단어 attention을 소속 문장의 attention으로 재정규화한다. 문장 RNN 은닉 상태에는 문장의 위치 임베딩도 이어붙여 "앞쪽 문장이 더 중요하다"는 편향까지 함께 학습한다.'},
 {h:'CNN/Daily Mail: 다중 문장 요약 데이터셋을 직접 만든다',
  lead:'질의응답용 CNN/Daily Mail 코퍼스를 원래 순서의 불릿 요약으로 복원해 요약 데이터셋으로 재활용한다.',
  d:'Gigaword·DUC는 요약이 한 문장뿐이라 문서 구조를 다루는 모델의 이점을 보여줄 수 없다. [Hermann et al. 2015](https://arxiv.org/abs/1506.03340)의 QA용 CNN/Daily Mail 크롤링 스크립트를 살짝 고쳐, 빈칸 채우기용으로 흩어놨던 하이라이트 불릿을 원래 순서로 복원해 문서당 평균 3.72문장짜리 다중 문장 요약 28만 6천 쌍을 만들었다.'}
],

diagram:{type:'compare', cap:'ABS(Rush 2015)와 이 논문의 차이. 구조는 기계번역 레시피를 그대로 쓰되, 요약 고유 문제마다 별도 부품을 덧붙였다.',
 left:{t:'ABS (2015)', items:['feed-forward NNLM 디코더','bag-of-words 인코더','문장 1개 → 헤드라인','미등록어는 MERT 추출 특성으로 보완']},
 right:{t:'이 논문 (2016)', items:['양방향 GRU + attention RNN','feature-rich 인코더(POS/NER/TF)','switching pointer로 희귀어 복사','계층 attention으로 문서 단위 확장']}},

math:[
 {expr:'P(si=1) = σ(vs · (Whs·hi + Wes·E[oi-1] + Wcs·ci + bs))',
  tex:'P(s_i=1)=\\sigma\\!\\big(v^s\\cdot(W_h^s h_i + W_e^s E[o_{i-1}] + W_c^s c_i + b^s)\\big)',
  d:'디코더 은닉상태 $h_i$, 직전 출력 임베딩, attention 컨텍스트 $c_i$ 를 모두 넣어 "생성할지 복사할지"를 매 스텝 sigmoid로 결정한다. 학습 목적함수는 이 스위치 확률과 생성/포인팅 확률을 지시함수 $g_i$ 로 섞은 로그우도다.'},
 {expr:'Pᵃ(j) = Pwᵃ(j)·Psᵃ(s(j)) / Σk Pwᵃ(k)·Psᵃ(s(k))',
  tex:'P^{a}(j)=\\dfrac{P_w^{a}(j)\\,P_s^{a}(s(j))}{\\sum_{k=1}^{N_d}P_w^{a}(k)\\,P_s^{a}(s(k))}',
  d:'단어 attention $P_w^a(j)$ 를 그 단어가 속한 문장의 attention $P_s^a(s(j))$ 로 곱한 뒤 전체 합으로 재정규화한다. 문장 자체가 안 중요하면 그 안의 단어가 아무리 두드러져도 최종 가중치는 낮아진다.'}
],

numbers:[
 {k:'Gigaword ROUGE-1 (테스트, ABS+와 동일 세트)', v:'35.30', d:'ABS+ 29.78, RAS-Elman 33.78보다 높음(표 1)'},
 {k:'CNN/Daily Mail 쌍 수', v:'28만 6817 학습 / 1만 3368 검증 / 1만 1487 테스트', d:'문서 평균 766단어·29.74문장, 요약 평균 53단어·3.72문장'},
 {k:'포인터 모델 src. copy rate', v:'78.70%', d:'참조 요약 자체의 45%보다 훨씬 높게 원문 단어를 재사용'},
 {k:'Optimizer', v:'Adadelta, lr 0.001', d:'[AdaDelta](#/p/adadelta) 채택, 배치 크기 50'},
 {k:'Gigaword 학습 시간', v:'epoch당 약 10시간 (Tesla K40 1장)', d:'계층 attention 모델은 12시간, 수렴까지 6~8일'},
 {k:'CNN/DM 계층 attention 개선폭', v:'미미 (32.75 vs 32.49 ROUGE-1)', d:'저자들도 "marginally"라고 명시 — 반복 생성 문제가 더 큰 병목이었음'}
],

impact:'기계번역용 attention encoder-decoder가 **구조 변경 없이도** 요약에서 SOTA를 낼 수 있음을 보여, 요약 전용 아키텍처 경쟁의 출발선을 사실상 [Bahdanau attention](#/p/bahdanau) 레시피로 되돌렸다. 동시에 제시한 세 가지 보완(포인터, 계층 attention, feature-rich 인코더) 중 특히 **포인터로 원문 단어를 복사한다**는 아이디어는 이후 요약 연구의 핵심 축이 됐다. 하지만 이 논문에서 가장 오래 남은 유산은 모델보다 **CNN/Daily Mail 데이터셋**이다 — 다중 문장 문서 요약을 다루는 이후 거의 모든 논문이 이 벤치마크로 비교한다.',

legacy:[
 '**CNN/Daily Mail이 표준 벤치마크로 정착** — 이후 문서 요약 논문 대부분이 이 데이터셋으로 보고',
 '**포인터를 구조로 승격** — 스위치+argmax 방식의 한계를 [pointer-generator](#/p/pointer-generator)가 미분 가능한 softmax 혼합(copy distribution)으로 대체',
 '**반복 생성 문제의 노출** — 저자들이 관찰한 "같은 구절 반복" 현상이 이후 coverage 메커니즘·intra-attention 연구의 동기가 됨',
 '**ROUGE를 직접 최적화하는 흐름** — [rl-summarization](#/p/rl-summarization)이 이 논문 이후 강화학습으로 평가지표 자체를 목적함수로 씀'
],

pitfalls:[
 '**"Nallapati 2016 = pointer-generator"가 아니다.** 이 논문의 스위치는 argmax로 하드하게 생성/복사를 택하는 비미분적 결정이라 별도의 지도 신호(명시적 포인터 정답)가 필요했다. 완전히 미분 가능한 소프트 혼합은 이듬해 [pointer-generator](#/p/pointer-generator)의 기여다.',
 '**계층 attention의 효과는 제한적이었다.** Gigaword 2문장 설정에서는 이득이 있었지만 CNN/Daily Mail 전체 문서에서는 개선폭이 미미했다고 저자들이 직접 보고한다 — "계층 구조를 모델링하면 항상 좋아진다"고 일반화하면 안 된다.',
 '**평가 지표가 두 코퍼스에서 다르다.** Gigaword/CNN·DM은 full-length ROUGE-F1, DUC는 75바이트 제한 recall을 쓴다. 표를 볼 때 어느 지표인지 반드시 확인해야 한다(같은 논문 안에서도 표 1과 표 2가 다른 지표).'
],

figures:[
 {f:'fig2-switch-pointer.png',
  cap:'디코더 출력 위 다이아몬드가 그 스텝의 스위치 값. G면 softmax로 생성(보라 박스), P면 원문 위치를 가리켜(구부러진 화살표) 그 단어를 그대로 복사한다 — 복사된 경우 다음 스텝 입력도 원문 쪽 임베딩을 그대로 쓴다(맨 아래 인코더→디코더 화살표).',
  src:'원문 Figure 2, p.3'},
 {f:'fig3-hierarchical-attn.png',
  cap:'맨 아래 단어층 RNN 위에 문장층 RNN(붉은 상자)이 하나 더 있다. 점선 화살표가 문장 수준 attention, 파선 화살표가 단어 수준 attention이고, 최종 가중치는 둘을 곱해 만든다 — 문장이 중요해야 그 안의 단어도 비로소 높은 가중치를 받는 구조.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'We apply the off-the-shelf attentional encoder-decoder RNN that was originally developed for machine translation to summarization, and show that it already outperforms state-of-the-art systems on two different English corpora.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 1602.06023 — Abstractive Text Summarization using Sequence-to-sequence RNNs and Beyond', u:'https://arxiv.org/abs/1602.06023'},
 {t:'CNN/DailyMail 데이터셋 생성 스크립트 (abisee/cnn-dailymail)', u:'https://github.com/abisee/cnn-dailymail'}
]
});
