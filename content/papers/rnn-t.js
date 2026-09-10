WIKI.paper({
slug:'rnn-t',
venue:'arXiv 2012 (Graves, ICML 2012 Representation Learning Workshop)',
authors:'Alex Graves (University of Toronto)',
arxiv:'1211.3711',

tldr:'[CTC](#/p/ctc)가 깔고 가던 "각 프레임의 출력은 서로 독립"이라는 가정을 깨고, 이전에 낸 출력을 되먹이는 **예측 네트워크**를 추가한 시퀀스 변환 구조. 왼쪽 문맥만 있으면 다음 출력을 낼 수 있어, 이후 스트리밍 음성 인식의 사실상 표준이 됐다.',

context:'[CTC](#/p/ctc)는 정렬을 몰라도 학습할 수 있게 해줬지만 두 가지 한계가 있었다. 하나는 출력 길이가 입력 길이를 넘을 수 없다는 것(예: 텍스트-음성 변환처럼 출력이 더 긴 과제엔 못 씀), 다른 하나는 매 시점의 출력이 **다른 시점의 출력과 독립**이라는 가정이다. 이 독립 가정 때문에 CTC 자체는 "지금까지 무슨 글자를 냈는지"를 전혀 참조하지 못하고, 언어모델 역할을 하는 어떤 내부 상태도 가질 수 없다. 저자(Graves)는 CTC를 만든 바로 그 사람으로, 이 논문에서 "출력끼리의 의존성까지 모델이 직접 학습하게 하려면 무엇을 더해야 하는가"라는 질문에 답한다.',

ideas:[
 {h:'예측 네트워크: 출력 쪽에 자기만의 언어모델을 둔다',
  lead:'이전 출력 라벨들만 보고 다음 라벨을 예측하는 별도 RNN을 추가한다.',
  d:'[CTC](#/p/ctc)에는 입력을 읽는 네트워크(transcription network) 하나만 있었다. 여기서는 그 옆에 **이전 출력 라벨** $y_1,\\dots,y_{u-1}$만 입력으로 받는 두 번째 RNN(prediction network)을 둔다. 이 네트워크는 사실상 다음 글자를 예측하는 독립적인 언어모델처럼 학습되며, 표준 next-step RNN과 유일한 차이는 "null(빈칸)을 예측할 수도 있다"는 옵션뿐이다.'},
 {h:'두 네트워크의 출력을 합쳐 최종 분포를 만든다',
  lead:'입력 인코더의 벡터와 예측 네트워크의 벡터를 더한 뒤 softmax로 결합한다.',
  d:'시점 $t$의 transcription 벡터 $f_t$와 시점 $u$의 prediction 벡터 $g_u$를 받아 $h(k,t,u)=\\exp(f_t^k+g_u^k)$라는 밀도를 정의하고 정규화해 $\\Pr(k\\mid t,u)$를 얻는다. 이 결합이 지금 흔히 "joint network"라 불리는 부분의 원형이다 — 원 논문은 덧셈 하나로 처리했지만, 이후 구현들은 여기에 별도의 feedforward층을 끼워 넣는다.'},
 {h:'격자(lattice) 위의 모든 경로를 forward-backward로 합산',
  lead:'입력·출력 두 축의 격자에서 가능한 모든 정렬 경로 확률을 동적계획법으로 더한다.',
  d:'[CTC](#/p/ctc)가 시간축 하나 위의 정렬을 주변화했다면, RNN-T는 **입력 시간축 $t$와 출력 라벨축 $u$ 두 축으로 이뤄진 격자** 위에서 왼쪽 아래(시작)부터 오른쪽 위(끝)까지의 모든 경로를 주변화한다. 각 노드에서 오른쪽(blank, 아무 것도 안 냄)으로 갈지 위(다음 라벨을 냄)로 갈지가 갈림길이고, forward 변수 $\\alpha$와 backward 변수 $\\beta$를 재귀식으로 계산해 전체 경로 합을 지수 시간이 아니라 다항 시간에 구한다.'},
 {h:'왼쪽 문맥만 있으면 다음 출력을 낼 수 있다',
  lead:'예측 네트워크가 미래 입력을 보지 않으므로 스트리밍 인식에 그대로 들어맞는다.',
  d:'transcription network는 원 논문에서 양방향 LSTM을 쓰지만, 이는 필수가 아니라 선택이다. 단방향으로 바꾸면 매 입력 프레임이 들어올 때마다 지금까지 나온 라벨만으로 다음 확률을 계산할 수 있어, 문장이 끝나기를 기다릴 필요가 없다. 이 성질 때문에 RNN-T는 이후 실시간 자막·음성비서처럼 지연시간이 중요한 스트리밍 ASR의 사실상 표준 손실/구조가 됐다.'}
],

diagram:{type:'compare', cap:'CTC의 조건부 독립 가정을 RNN-T가 예측 네트워크로 깨는 지점.',
 left:{t:'CTC', items:['프레임 출력끼리 독립 가정','이전 출력을 참조 못함','언어모델 역할 불가']},
 right:{t:'RNN-T', items:['예측 네트워크가 이전 출력 참조','두 네트워크 출력을 joint로 결합','왼쪽 문맥만으로 스트리밍 가능']}
},

math:[
 {expr:'h(k,t,u) = exp(f_t^k + g_u^k),   Pr(k|t,u) = h(k,t,u) / Σ_k′ h(k′,t,u)',
  tex:'h(k,t,u)=\\exp\\!\\left(f_t^{k}+g_u^{k}\\right),\\qquad \\Pr(k\\mid t,u)=\\frac{h(k,t,u)}{\\sum_{k^\\prime} h(k^\\prime,t,u)}',
  d:'입력 인코더의 $t$번째 벡터와 예측 네트워크의 $u$번째 벡터를 더해 지수화한 뒤 정규화한다 — 두 네트워크의 정보를 합치는 가장 단순한 방식.'},
 {expr:'α(t,u) = α(t−1,u)·∅(t−1,u) + α(t,u−1)·y(t,u−1)',
  tex:'\\alpha(t,u)=\\alpha(t-1,u)\\,\\varnothing(t-1,u)+\\alpha(t,u-1)\\,y(t,u-1)',
  d:'격자 위 forward 변수의 재귀식. 노드 $(t,u)$에 도달하는 경로는 "바로 왼쪽에서 blank로 온 경우"와 "바로 아래에서 라벨을 내며 온 경우" 둘뿐이라, 이 둘의 합으로 전체를 재귀적으로 쌓는다.'}
],

numbers:[
 {k:'TIMIT 음소 오류율 · Transducer', v:'23.2%', d:'논문 저자가 재현한 실험, RNN 단독 결과 중 최고라고 주장'},
 {k:'TIMIT 음소 오류율 · standalone CTC', v:'25.5%', d:'같은 조건에서 예측 네트워크 없이 CTC만 쓴 비교군'},
 {k:'TIMIT 음소 오류율 · standalone 예측 네트워크', v:'72.9%', d:'입력 없이 이전 라벨만으로 예측 — 그 자체로는 형편없음'},
 {k:'디코딩 beam width', v:'4000', d:'테스트 시 빔서치 폭 — 이후 실무 구현보다 훨씬 넓다'},
 {k:'총 파라미터 (transducer)', v:'261,328', d:'128유닛 LSTM 두 개 규모, 오늘날 기준 극소형'}
],

figures:[
 {f:'fig1-lattice.png',
  cap:'가로축 t는 입력 프레임, 세로축 u는 지금까지 낸 출력 라벨 수. 오른쪽 화살표는 blank(아무 것도 안 냄), 위쪽 화살표는 라벨 하나를 냄. 맨 아래 검은 노드가 "아직 아무 것도 안 낸" 시작 상태이고, 빨간 경로가 하나의 구체적인 정렬 — 학습은 이런 경로 전부를 forward-backward로 합산한다.',
  src:'원문 Figure 1, p.4'}
],

quotes:[
 {t:'However, as well as precluding tasks, such as text-to-speech, where the output sequence is longer than the input sequence, CTC does not model the interdependencies between the outputs.',
  src:'Introduction, p.2'}
],

impact:'"출력끼리의 의존성을 모델 안에 넣는다"는 선택이 이후 스트리밍 음성 인식의 표준 손실/구조가 됐다. 2012년 당시엔 TIMIT 음소 인식이라는 작은 벤치마크에 그쳤지만, 예측 네트워크가 사실상 내장 언어모델 역할을 하고 왼쪽 문맥만으로 동작한다는 두 성질이 결합해, 스마트폰 온디바이스 음성 인식처럼 지연시간이 핵심인 실전 시스템의 표준 아키텍처로 자리잡았다.',

legacy:[
 '**구글 스트리밍 ASR** — Gboard 음성 입력 등 온디바이스 실시간 인식이 RNN-T 계열 구조를 표준으로 채택',
 '**[Conformer](#/p/conformer)** — transcription network 자리를 convolution+attention 블록으로 교체하며 RNN-T 손실 자체는 그대로 계승',
 '**joint network 정교화** — 원 논문의 단순 덧셈 결합이 이후 별도 feedforward+비선형층으로 확장됨',
 '**[CTC](#/p/ctc) 계열과의 공존** — CTC는 여전히 사전학습·미세조정의 단순 헤드로, RNN-T는 실시간 스트리밍 시스템으로 역할이 갈라짐'
],

pitfalls:[
 '**"RNN-T가 attention seq2seq다"는 착각.** 예측 네트워크가 언어모델처럼 동작해 attention 기반 [LAS](#/p/las)와 혼동하기 쉽지만, RNN-T는 여전히 [CTC](#/p/ctc)처럼 격자 위 모든 정렬을 주변화하는 **정렬 기반** 방법이다. attention이 전혀 없다.',
 '**논문의 실험 규모를 오늘날 시스템과 동일시하면 안 된다.** TIMIT 음소 인식(3696개 발화, 39개 음소)이라는 소규모 과제 결과이고, 저자 스스로 "transducer가 CTC보다 나은 정도가 미미한 것은 예측 네트워크를 학습하기엔 데이터가 너무 적기 때문일 것"이라고 밝혔다.',
 '**"실시간이니까 항상 빠르다"는 아니다.** 왼쪽 문맥만 필요한 것은 이론적 성질이고, 원 논문의 transcription network는 오히려 양방향 LSTM이었다. 단방향으로 바꾸는 것은 이후 스트리밍 구현들이 추가한 선택이다.'
],

links:[
 {t:'arXiv 1211.3711 — Sequence Transduction with Recurrent Neural Networks', u:'https://arxiv.org/abs/1211.3711'}
]
});
