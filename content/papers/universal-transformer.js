WIKI.paper({
slug:'universal-transformer',
venue:'ICLR 2019',
authors:'Dehghani et al. (Google Brain · DeepMind · U. Amsterdam)',
arxiv:'1807.03819',

tldr:'`[Transformer](#/p/transformer)`의 층 스택을 **같은 파라미터를 반복 적용하는 재귀**로 바꾸고, 위치마다 몇 번 반복할지를 적응적 계산 시간(ACT)으로 동적으로 정한 모델. 문자열 복사 같은 알고리즘 과제에서 원조 Transformer가 실패하는 지점을 정확히 겨냥했다.',

context:'`[Transformer](#/p/transformer)`는 순차성을 버려 병렬화를 얻었지만, 그 대가로 RNN이 가진 "같은 연산을 필요한 만큼 반복한다"는 귀납 편향을 잃었다. 층은 6개면 6개로 고정돼 있고, 각 층은 서로 다른 파라미터를 쓴다. 그 결과 문자열 복사, 간단한 논리 추론처럼 **학습 때 본 길이보다 긴 입력에 일반화**해야 하는 과제에서 Transformer는 Neural GPU나 Neural Turing Machine 같은 순환 기반 모델에 밀렸다. 질문은 단순하다 — attention의 병렬성과 RNN의 반복 편향을 동시에 가질 수 없는가?',

ideas:[
 {h:'깊이 방향이 아니라 시간 방향으로 반복한다',
  lead:'서로 다른 층을 쌓는 대신 같은 self-attention+transition 블록을 T번 되풀이한다.',
  d:'표준 Transformer는 층마다 별도 파라미터를 갖는 6~24개의 서로 다른 블록을 쌓는다. Universal Transformer는 **단 하나의 블록**(self-attention + transition function)을 만들어 모든 위치의 표현에 반복 적용한다. 층수가 아니라 반복 횟수 $T$ 가 "깊이"를 결정하므로, 학습 후에도 $T$ 를 늘려 더 깊게 추론할 수 있는 길이 열린다.'},
 {h:'파라미터를 위치와 시간에 걸쳐 공유한다',
  lead:'모든 시퀀스 위치, 모든 반복 스텝이 같은 가중치를 쓴다.',
  d:'RNN이 시간축으로 파라미터를 공유하듯, UT는 시간축(반복 스텝)으로도 위치축(시퀀스 내 모든 토큰)으로도 같은 self-attention과 transition function을 공유한다. 이 공유가 곧 "반복"이라는 귀납 편향이고, 표준 Transformer 대비 파라미터 수를 크게 늘리지 않고도 임의 깊이로 확장 가능하게 만든다.'},
 {h:'적응적 계산 시간(ACT): 위치마다 반복 횟수를 다르게 정한다',
  lead:'각 위치가 스스로 계산한 정지 확률로 "이제 됐다"를 판단해 멈춘다.',
  d:'모든 토큰이 똑같이 $T$ 번 계산할 필요는 없다 — 쉬운 토큰은 일찍 멈추고 어려운 토큰은 더 오래 다듬어야 한다. `[Graves, 2016]`의 ACT를 각 위치에 적용해, 매 스텝 정지 확률을 계산하고 누적 확률이 임계값을 넘으면 그 위치는 이후 상태를 그대로 복사(더 계산하지 않음)한다. bAbI 실험에서 실제로 위치별 ponder time(반복 횟수)이 크게 갈리는 것으로 확인됐다.'},
 {h:'특정 조건에서 Turing-complete함을 증명한다',
  lead:'메모리와 시간 제한을 풀면 UT가 임의의 튜링 머신을 흉내낼 수 있음을 보인다.',
  d:'표준 Transformer는 고정 층수 때문에 계산 능력이 제한된 함수 클래스에 갇힌다. UT는 반복 횟수에 제한이 없다는 가정 아래 Neural GPU류 모델처럼 튜링 완전성을 가짐을 이론적으로 보인다. 이는 실용적 성능 개선이라기보다, "attention 기반 모델도 원칙적으로 알고리즘을 표현할 수 있다"는 이론적 정당화다.'}
],

diagram:{type:'compare', cap:'같은 attention 메커니즘, 반복 방식만 다르다.',
 left:{t:'Transformer', items:['층마다 별도 파라미터','고정된 층수 = 고정된 깊이','긴 입력·알고리즘 과제에 약함']},
 right:{t:'UT (본 논문)', items:['하나의 블록을 T번 반복','ACT로 위치별 반복 횟수 조절','Turing-complete (이론상)']}},


math:[
 {expr:'H^t = LayerNorm( A^t + Transition(A^t) ),  A^t = LayerNorm( H^{t-1} + SelfAttention(H^{t-1}) )',
  tex:'\\begin{aligned}A^t &= \\text{LayerNorm}\\big(H^{t-1} + \\text{SelfAttention}(H^{t-1})\\big)\\\\ H^t &= \\text{LayerNorm}\\big(A^t + \\text{Transition}(A^t)\\big)\\end{aligned}',
  d:'시간 스텝 $t=1,\\dots,T$ 에 걸쳐 같은 self-attention·transition 파라미터를 반복 적용해 위치별 표현 $H^t$ 를 갱신한다. $T$ 가 곧 반복 "깊이".'},
 {expr:'halting: 누적 정지확률 Σp_t 가 1-ε 넘으면 그 위치는 계산을 멈춘다 (ACT)',
  tex:'\\text{halt at } t \\text{ if } \\sum_{\\tau \\le t} p_\\tau \\ge 1-\\epsilon',
  d:'위치별 정지 확률 $p_t$ 를 매 스텝 계산해 누적하고, 임계값을 넘으면 그 위치의 상태를 이후 스텝에 그대로 복사한다. 논문의 LAMBADA 실험에서 평균 반복 횟수는 8.2±2.1이었다.'}
],

numbers:[
 {k:'WMT14 En-De BLEU', v:'28.9 (UT base)', d:'Transformer base 28.0 대비 **+0.9**'},
 {k:'LAMBADA perplexity', v:'새 SOTA (UT w/ ACT)', d:'LSTM·표준 Transformer를 모두 앞섬'},
 {k:'평균 ACT 반복 횟수', v:'8.2 ± 2.1', d:'LAMBADA 테스트셋 전체 위치·예시 평균, 고정 6스텝 모델보다 더 깊게 감'},
 {k:'bAbI 과제', v:'20개 과제 중 일부에서 0 오류', d:'20-task 학습·테스트 모두에서 UT+ACT가 LSTM·Transformer를 크게 앞섬'}
],

impact:'UT는 "attention과 재귀는 양자택일이 아니다"를 보여준 실험이었지만, 실제 확산은 **재귀 대신 규모**로 향했다. GPU 병렬성을 온전히 살리는 표준 Transformer의 이점이 워낙 컸기 때문에, 몇 배 느린 반복 계산을 감수하면서까지 UT를 채택한 대형 모델은 거의 없었다. 다만 ACT가 보여준 "토큰마다 다른 계산량"이라는 아이디어는 이후 조건부 계산·[MoE](#/p/moe-shazeer) 계열 연구, 그리고 "레이어를 동적으로 건너뛴다"는 초기 형태의 계산 효율화 연구에 영향을 남겼다.',

legacy:[
 '**조건부 계산의 초기 사례** — 위치별로 계산량을 다르게 쓴다는 ACT의 아이디어가 이후 [MoE](#/p/moe-shazeer) 계열의 "토큰마다 다른 파라미터/연산"이라는 발상과 정신적으로 이어짐',
 '**깊이 일반화 연구의 참조점** — "학습 때보다 더 깊게/길게 추론 가능한가"를 다루는 이후 알고리즘 일반화·length generalization 연구들이 UT를 기준선으로 인용',
 '**규모가 재귀를 이겼다는 반례로 자주 언급됨** — 이후 [스케일링 법칙](#/p/scaling-laws) 시대에 "귀납 편향보다 파라미터·데이터"라는 흐름을 설명할 때 UT가 대조 사례로 소환됨'
],

pitfalls:[
 '**"UT가 Transformer의 상위 호환"이 아니다.** 반복 계산 때문에 같은 반복 횟수 기준으로 학습·추론 비용이 늘어나고, 실제로 번역에서 순수 UT(ACT 없이)는 개선폭이 크지 않다 — ACT를 더했을 때 MT 성능이 오히려 소폭 떨어진다고 논문 스스로 언급한다.',
 '**병렬화 이점이 줄어든다.** 반복 스텝은 여전히 순차적으로 실행돼야 해서, Transformer가 얻은 "층을 한 번에 처리"하는 병렬성 일부를 다시 깎아 먹는다.',
 '**"주류가 되지 못한 이유"를 단순 성능 문제로 오해하기 쉽다.** 알고리즘 과제·LAMBADA 등에서 실제로 이겼음에도, 대규모 사전학습에서는 GPU 활용률·구현 단순성 면에서 표준 Transformer가 압도적으로 유리해 채택되지 않았다는 것이 더 정확한 설명이다.'
],

figures:[
 {f:'fig1-recurrence.png',
  cap:'가로축이 시간(반복 스텝) t → t+1 → t+2, 세로축이 시퀀스 위치 h₁~hₘ. 같은 "Self-Attention → Transition Function" 블록이 매 스텝 모든 위치에 반복 적용되고(교차선이 self-attention의 위치 간 정보 교환), 이 블록의 파라미터는 시간·위치에 걸쳐 전부 공유된다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We propose the Universal Transformer (UT), a parallel-in-time self-attentive recurrent sequence model which can be cast as a generalization of the Transformer model.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1807.03819 — Universal Transformers', u:'https://arxiv.org/abs/1807.03819'},
 {t:'Google AI Blog: Moving Beyond Translation with the Universal Transformer', u:'https://research.google/blog/moving-beyond-translation-with-the-universal-transformer/'}
]
});
