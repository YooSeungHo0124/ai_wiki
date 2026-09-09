WIKI.paper({
slug:'gnmt',
venue:'arXiv 2016',
authors:'Wu, Schuster, Chen, Le, Norouzi et al. (Google)',
arxiv:'1609.08144',

tldr:'구글 번역의 프로덕션 엔진을 통계 기반 phrase-based 시스템에서 신경망으로 통째로 교체한 시스템 논문. [seq2seq](#/p/seq2seq)+[Bahdanau attention](#/p/bahdanau)이라는 연구실 아키텍처를, 실제 서비스가 요구하는 정확도·속도·안정성으로 끌어올리기 위해 필요했던 모든 공학적 결정을 기록했다.',

context:'2016년까지 신경망 번역(NMT)은 WMT 같은 연구 벤치마크에서는 phrase-based 통계 번역(PBMT)을 이겼지만, 구글 규모의 실서비스에는 쓰이지 못했다. 이유는 셋이다. **(1) 속도** — [seq2seq](#/p/seq2seq)의 깊은 LSTM과 [Bahdanau attention](#/p/bahdanau)의 매 스텝 전체 소스 참조는 추론이 느려 대량 트래픽을 감당하기 어렵다. **(2) 희귀 단어** — 단어 단위 어휘는 학습 때 못 본 단어를 `<UNK>`로 뭉개버린다. **(3) 신뢰성** — 연구 논문의 BLEU 개선이 가끔 문장을 통째로 빠뜨리거나 지어내는 실패로 이어져, 통계 시스템만큼의 견고함을 보장하지 못했다. 이 논문은 새 아키텍처를 제안하는 논문이 아니라, **이미 알려진 아이디어들을 실서비스 제약 아래서 다시 설계**한 기록이다.',

ideas:[
 {h:'8층 encoder-decoder + residual 연결',
  lead:'LSTM을 8층까지 쌓되 3층째부터 residual을 더해 깊은 스택의 그래디언트 소실을 막는다.',
  d:'저자들은 단순 스택 LSTM이 "4층까지는 잘 되고, 6층은 간신히, 8층은 매우 나쁘다"고 명시한다. 해결책은 [ResNet](#/p/resnet) 식의 덧셈 지름길이다 — $i$번째 층 입력을 그 층 출력에 그대로 더해 $(i{+}1)$번째 층에 넘긴다(식 6). 이 한 장치로 8층까지 안정적으로 학습해, 층마다 번역 품질이 꾸준히 좋아지는 것을 확인했다.'},
 {h:'첫 층만 양방향, 나머지는 단방향',
  lead:'인코더 맨 아래 층만 양방향으로 두고 위층은 단방향으로 만들어 병렬화를 지킨다.',
  d:'양방향 RNN은 문장 전체를 봐야 하지만, 전체 층을 양방향으로 만들면 각 층이 앞뒤 계산을 다 기다려야 해서 GPU 파이프라이닝이 깨진다. GNMT는 **맨 아래 층 하나만 양방향**(순방향은 분홍, 역방향은 초록 노드)으로 두고, 그 위 7개 층은 단방향으로 쌓아 나머지 7개 GPU가 순차적으로 파이프라인을 이루게 했다. 실질적으로 인코더는 "논리적으로 9개의 LSTM 패스"를 갖는다.'},
 {h:'모델을 GPU 단위로 물리적으로 쪼갠다',
  lead:'encoder·decoder 각 8층을 GPU 8장에 한 층씩 배치해 모델 병렬로 학습·추론한다.',
  d:'단일 GPU에 못 올라갈 만큼 큰 모델을 층 단위로 쪼개 8개 GPU에 배치했다(모델 병렬). attention은 decoder의 **맨 아래 층 출력**만 받아 encoder 맨 위 층에 연결했는데, 이는 정확도를 위한 선택이 아니라 **병렬성을 지키기 위한 선택**이다 — 아래층 출력을 쓰면 나머지 decoder 층들이 이전 attention 계산을 기다릴 필요가 없다.'},
 {h:'Wordpiece: 문자와 단어 사이의 절충',
  lead:'8k~32k개의 서브워드 단위로 어휘를 만들어 미등록 단어 문제를 원천적으로 없앤다.',
  d:'단어 단위 어휘는 희귀어에서, 문자 단위는 시퀀스 길이와 의미 단위 손실에서 문제가 생긴다. GNMT는 언어모델 우도를 최대화하도록 그리디하게 학습한 wordpiece 사전으로 단어를 쪼갠다 — 예를 들어 "Jet"은 `_J`+`et`로 분해된다. 어떤 문자열도 유한한 wordpiece 조합으로 표현되므로 `<UNK>` 자체가 사라진다. [BPE](#/p/bpe)와 목적함수는 다르지만(우도 최대화 vs 빈도 병합) 결과물은 비슷한 서브워드 사전이라는 점에서 같은 계열이다.'},
 {h:'추론은 8비트 양자화로, 학습은 그대로',
  lead:'학습 때 누적값 범위를 제한해 두고 추론 시 행렬곱을 8비트 정수 연산으로 바꾼다.',
  d:'실서비스 지연시간을 줄이려면 추론에 저정밀 연산이 필요하지만, 깊은 LSTM을 그냥 양자화하면 오차가 누적돼 품질이 무너진다. GNMT는 **학습 단계에서부터** residual 누적기 $c_t, m_t$ 의 값이 $[-\\delta,\\delta]$ 범위를 넘지 않도록 제약을 걸어 두고, 추론 시에만 가중치·활성값을 8비트 정수로 바꿔 행렬곱을 수행한다. TPU에서 로그 퍼플렉시티 손실은 0.0072에 불과했고 BLEU 손실은 없었다.'},
 {h:'beam search를 length normalization과 coverage penalty로 고친다',
  lead:'길이로 나눈 점수와 attention 커버리지 보너스를 더해 짧고 미완성인 번역을 벌준다.',
  d:'순수 로그확률 beam search는 매 스텝 음의 로그확률이 더해지므로 **짧은 문장을 부당하게 선호**한다. GNMT는 점수를 길이의 거듭제곱 $lp(Y)$ 로 나누고, source 단어들이 attention으로 충분히 "커버"됐는지를 보상하는 $cp(X;Y)$ 를 더한다. $\\alpha=\\beta=0$ 이면 원래의 순수 beam search로 되돌아간다.'}
],

diagram:{type:'compare', cap:'연구 프로토타입(seq2seq+Bahdanau)과 GNMT가 같은 아이디어를 다른 제약 아래서 구현한 차이.',
 left:{t:'연구용 NMT', items:['얕은 층, 속도 고려 없음','단어 단위 어휘 → OOV 문제','float32 추론','순수 beam search']},
 right:{t:'GNMT (서비스용)', items:['8층 + residual, GPU 8장 파이프라인','wordpiece로 OOV 제거','8비트 양자화 추론','길이정규화+coverage penalty 보정']}
},

math:[
 {expr:'residual: c_t^i, m_t^i = LSTM_i(...),  x_t^i = m_t^i + x_t^{i-1}',
  tex:'\\mathbf{x}_t^{i} = \\mathbf{m}_t^{i} + \\mathbf{x}_t^{i-1}',
  d:'$i$번째 LSTM 층의 출력 $m_t^i$ 에 그 층의 **입력**(바로 아래 층 출력) $x_t^{i-1}$ 을 더해 다음 층 입력으로 쓴다. residual이 없으면 $x_t^i = m_t^i$ 뿐이다(식 5).'},
 {expr:'s(Y,X) = log P(Y|X) / lp(Y) + cp(X;Y)',
  tex:'s(Y,X)=\\log P(Y\\mid X)/lp(Y) + cp(X;Y)',
  d:'디코딩 시 후보 $Y$ 를 이 점수로 순위 매긴다. $lp$ 는 길이 보정, $cp$ 는 커버리지 보너스로 아래 두 식에서 정의된다.'},
 {expr:'lp(Y) = (5+|Y|)^α / (5+1)^α,   cp(X;Y) = β Σᵢ log(min(Σⱼ p_{i,j}, 1.0))',
  tex:'\\begin{aligned} lp(Y) &= \\frac{(5+|Y|)^{\\alpha}}{(5+1)^{\\alpha}}\\\\ cp(X;Y) &= \\beta\\sum_{i=1}^{|X|}\\log\\!\\left(\\min\\!\\left(\\sum_{j=1}^{|Y|} p_{i,j},\\,1.0\\right)\\right)\\end{aligned}',
  d:'$p_{i,j}$ 는 target 단어 $y_j$ 가 source 단어 $x_i$ 에 준 attention 확률. $\\alpha\\in[0.6,0.7]$ 이 대체로 최적이었고, $\\alpha=\\beta=0$ 이면 보정 없는 순수 beam search가 된다.'}
],

numbers:[
 {k:'모델 규모', v:'encoder 8층 · decoder 8층', d:'encoder는 양방향 1층 + 단방향 7층, 층당 LSTM 1024개'},
 {k:'BLEU · WMT14 EN→FR', v:'38.95', d:'단일 모델, 외부 정렬모델 없는 이전 최고 대비 **+7.5**'},
 {k:'BLEU · WMT14 EN→DE', v:'24.17', d:'이전 최고 대비 **+3.4**'},
 {k:'학습 데이터', v:'EN→FR 3600만 문장쌍 · EN→DE 500만 문장쌍', d:'프로덕션 데이터는 이보다 2~3자릿수 더 큼'},
 {k:'wordpiece 어휘 크기', v:'8k~32k', d:'정확도와 디코딩 속도의 절충 구간'},
 {k:'번역 오류 감소(인간 평가)', v:'평균 60%', d:'프로덕션 phrase-based 시스템 대비, 언어쌍별 58~87%'}
],

impact:'이 논문 이후 구글 번역은 실제로 신경망 시스템으로 전환됐고, "연구 벤치마크에서 이긴 아키텍처를 실서비스로 옮기려면 무엇이 더 필요한가"라는 질문에 대한 최초의 대규모 공개 사례가 됐다. Wordpiece는 [BPE](#/p/bpe)와 함께 이후 거의 모든 NLP 모델의 표준 토큰화 방식이 됐고, residual이 적용된 깊은 LSTM은 [Transformer](#/p/transformer)가 등장하기 전 NMT의 사실상 최종 형태였다. 저자들이 직접 언급하듯 강화학습으로 BLEU를 더 올려도 사람 평가는 개선되지 않아, **자동 지표와 실제 품질의 괴리**를 시스템 논문 수준에서 드러낸 것도 중요한 기록이다.',

legacy:[
 '**아키텍처 자체는 [Transformer](#/p/transformer)에 완전히 대체됐다** — 순차적인 8층 LSTM이 병렬화 가능한 self-attention으로 바뀌며 이후 NMT 연구는 이 논문의 문제의식(속도·병렬성)을 다른 방식으로 재해결했다',
 'wordpiece·[BPE](#/p/bpe) 계열 서브워드 토큰화는 GPT·BERT를 거쳐 현대 LLM의 기본 토크나이저 방식으로 정착',
 'length normalization + coverage penalty는 이후 다양한 시퀀스 생성 디코딩 전략(beam search 변형)의 참조점이 됨',
 '"BLEU 개선이 사람 평가와 어긋난다"는 관찰은 자동 지표 대신 인간 평가·LLM-as-judge를 병행하는 현재 관행의 초기 근거가 됨'
],

pitfalls:[
 '**GNMT의 attention은 [Bahdanau](#/p/bahdanau)와 본질적으로 같은 additive attention이다.** 새 attention 메커니즘을 제안한 논문이 아니라, 그것을 어디에 연결하느냐(decoder 최하층 → encoder 최상층)를 병렬성 때문에 바꾼 것이다.',
 '**강화학습(RL) 미세조정은 BLEU를 올렸지만 사람 평가는 개선하지 못했다.** "BLEU가 오르면 품질이 오른다"는 가정이 이 논문 자체 실험에서 깨진다.',
 '**60% 오류 감소는 특정 언어쌍·평가셋 기준이다.** 언어쌍별로 58%~87%까지 편차가 크고, 위키피디아·뉴스 500문장이라는 상대적으로 작은 표본에서 나온 side-by-side 점수다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽 encoder: 맨 아래 줄(분홍+초록)만 양방향이고 그 위 7개 층은 단방향, GPU1~8에 한 층씩 배치된 것이 색과 "GPU n" 라벨로 표시된다. 가운데 파란 상자가 attention — decoder 맨 아래층 출력만 받는다. 오른쪽 decoder 맨 위 Softmax에서 나온 예측이 다시 다음 스텝 입력(아래쪽 점선)으로 들어가는 자기회귀 구조.',
  src:'원문 Figure 1, p.4'},
 {f:'fig2-residual.png',
  cap:'왼쪽이 일반 스택 LSTM: 아래층 출력 $x^1$이 그대로 위층 입력이 된다. 오른쪽이 GNMT 방식: 위층에 들어가기 전 "+" 표시에서 아래층의 **입력**이 출력에 더해진다 — 이 덧셈 경로가 8층까지 그래디언트를 살려 보낸다.',
  src:'원문 Figure 2, p.5'}
],

quotes:[
 {t:'Our model consists of a deep LSTM network with 8 encoder and 8 decoder layers using residual connections as well as attention connections from the decoder network to the encoder.',
  src:'Abstract, p.1'},
 {t:'We consider refining the models by using reinforcement learning, but we found that the improvement in the BLEU scores did not reflect in the human evaluation.',
  src:'Abstract, p.1'}
],

links:[
 {t:"arXiv 1609.08144 — Google's Neural Machine Translation System", u:'https://arxiv.org/abs/1609.08144'},
 {t:'Google AI Blog — A Neural Network for Machine Translation, at Production Scale', u:'https://ai.googleblog.com/2016/09/a-neural-network-for-machine.html'}
]
});
