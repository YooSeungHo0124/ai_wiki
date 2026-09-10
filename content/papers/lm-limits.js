WIKI.paper({
slug:'lm-limits',
venue:'ICML 2016 (arXiv 2016)',
authors:'Jozefowicz, Vinyals, Schuster, Shazeer, Wu (Google Brain)',
arxiv:'1602.02410',

tldr:'One Billion Word Benchmark에서 `LSTM`을 최대한 키우고 문자 단위 CNN 임베딩·importance sampling 같은 공학을 총동원해, 단일 모델 perplexity를 51.3에서 30.0으로, 앙상블로는 23.7까지 끌어내린 논문. **`Transformer` 이전에도 "모델을 키우면 좋아진다"를 실측한** 대규모 언어모델 실험이다.',

context:'2016년의 언어모델은 대부분 Penn Treebank(PTB) 같은 수백만 단어짜리 소규모 코퍼스에서 평가됐다. PTB는 어휘가 1만 단어 수준이라 `[LSTM](#/p/lstm)`이나 `[신경망 언어모델](#/p/nnlm)`의 큰 모델과 작은 모델의 차이가 잘 드러나지 않았다. 반면 대규모 어휘·대규모 데이터로 가면 소프트맥스 출력층 자체가 병목이 된다 — 어휘가 80만 단어면 마지막 선형층만 수억 파라미터가 되고, 정규화 상수 계산에 전체 어휘를 훑어야 한다. 이 논문은 질문을 명확히 좁힌다. **PTB를 버리고 1B Word Benchmark(약 8억 단어, 793,471 어휘)로 가면, LSTM을 계속 키웠을 때 정말 계속 좋아지는가, 그리고 그 큰 소프트맥스를 어떻게 감당할 것인가.**',

ideas:[
 {h:'그냥 LSTM을 최대한 키운다',
  lead:'2048차원 은닉 상태의 LSTM을 32개 GPU로 학습시켜 규모 자체를 실험 변수로 삼는다.',
  d:'저자들은 새 아키텍처를 제안하는 대신, `LSTM-512-512`부터 시작해 은닉 크기·투영 크기·층 수를 키워가며 perplexity가 어떻게 변하는지 관찰했다. 최종 "BIG LSTM"은 2층에 은닉 8192·투영 1024 차원이다. GPU 메모리에 들어가는 한 가장 큰 모델을 쓴다는 원칙이 전부였고, 실제로 규모가 커질수록 perplexity가 꾸준히 떨어졌다.'},
 {h:'Importance Sampling으로 소프트맥스 정규화를 피한다',
  lead:'전체 어휘 대신 표본으로 뽑은 부분집합만으로 소프트맥스 분모를 근사한다.',
  d:'80만 단어 전체에 대해 매 스텝 정규화 상수를 계산하는 것은 감당할 수 없다. Importance sampling은 정답 단어와 소수의 noise 단어만 뽑아 이진 분류 문제로 근사하는데, 이 논문은 이것이 **noise contrastive estimation(NCE)과 본질적으로 같은 유도**에서 나온다는 것을 보이며 둘의 관계를 정리했다. 실험적으로 IS가 계층적 소프트맥스보다 이 규모에서 더 잘 작동했다.'},
 {h:'CNN Softmax: 문자로 출력층 파라미터를 압축한다',
  lead:'출력 임베딩을 문자 CNN으로 생성해 소프트맥스 파라미터 수를 크게 줄인다.',
  d:'표준 소프트맥스는 단어마다 독립된 임베딩 벡터를 학습한다. CNN Softmax는 각 단어의 출력 임베딩을 문자열에 대한 CNN으로 **생성**해서, 어휘 크기와 무관하게 파라미터가 늘어난다. 다만 CNN이 만든 임베딩들은 서로 지나치게 비슷해지는 경향이 있어, 저차원 보정(correction) 항을 더해 이 문제를 완화했다.'},
 {h:'Char LSTM: 문자 단위로 다음 단어를 예측한다',
  lead:'단어 LSTM의 은닉 상태를 문자 단위 LSTM에 넘겨 한 글자씩 단어를 생성한다.',
  d:'출력층을 아예 없애고, 단어 수준 LSTM의 은닉 상태 $h$ 를 조건으로 받는 작은 문자 단위 LSTM이 다음 단어를 한 글자씩 생성하게 했다. 어휘 크기에 완전히 독립적이라는 장점이 있지만, 논문은 이 방식이 CNN Softmax보다 오히려 perplexity가 나빴다고 솔직히 보고한다.'},
 {h:'앙상블로 최종 기록을 만든다',
  lead:'서로 다른 하이퍼파라미터의 여러 모델을 평균해 단일 모델보다 한 단계 더 낮춘다.',
  d:'단일 최고 모델(BIG LSTM+CNN Inputs)이 30.0을 찍은 뒤, 이것과 다른 구성의 모델 여러 개를 모아 로그 확률을 평균하는 표준 앙상블을 적용해 23.7까지 내렸다. 새로운 기법이 아니라, "이미 만든 서로 다른 모델들을 버리지 않고 합친다"는 실용적 마무리다.'}
],

diagram:{type:'compare', cap:'같은 LSTM LM에서 입력·출력 임베딩을 무엇으로 만드는가에 따라 세 변형이 갈린다 (원문 Figure 1).',
 left:{t:'표준 LSTM LM', items:['단어마다 임베딩 벡터 학습','소프트맥스 파라미터 = 어휘×차원','어휘 커지면 파라미터 폭증']},
 right:{t:'문자 기반 변형', items:['입력을 문자 CNN으로 생성','CNN Softmax로 출력도 압축','Char LSTM은 한 글자씩 생성']}},

math:[
 {expr:'p(Y=true|w) = pd(w) / (pd(w) + k·pn(w))',
  tex:'p(Y=\\text{true}\\mid w)=\\frac{p_d(w)}{p_d(w)+k\\,p_n(w)}',
  d:'noise contrastive estimation의 이진 분류 목적식. $p_d$ 는 데이터 분포, $p_n$ 은 noise 분포, $k$ 는 정답 하나당 뽑는 noise 단어 수다. 이 논문은 importance sampling이 이 식의 근사와 같은 뿌리에서 나온다는 것을 보였다.'},
 {expr:'PPL = exp( -(1/N) · Σ ln p(w_i) )',
  tex:'\\text{PPL}=\\exp\\!\\left(-\\frac{1}{N}\\sum_{i=1}^{N}\\ln p(w_i)\\right)',
  d:'언어모델 평가의 표준 지표인 perplexity. 전체 단어에 대한 평균 로그우도의 지수이며, 값이 작을수록 모델이 다음 단어를 더 정확히 예측한다.'}
],

numbers:[
 {k:'단일 모델 perplexity', v:'51.3 → 30.0', d:'파라미터는 오히려 **20분의 1**로 줄이면서 달성'},
 {k:'앙상블 perplexity', v:'41.0 → 23.7', d:'여러 모델의 로그확률 평균으로 만든 신기록'},
 {k:'학습 데이터', v:'약 0.8B 단어 · 어휘 793,471개', d:'One Billion Word Benchmark, PTB의 약 1000배 규모'},
 {k:'최대 모델', v:'2층 LSTM, 은닉 8192 · 투영 1024', d:'"BIG LSTM" — GPU 메모리에 들어가는 한도까지 키움'},
 {k:'학습 인프라', v:'Tesla K40 GPU 32장, 비동기 SGD', d:'BIG LSTM은 35 perplexity까지 약 5일, 32.5까지 10일 소요'}
],

impact:'이 논문이 남긴 것은 새 아키텍처가 아니라 **실측된 스케일 곡선**이다 — LSTM을 계속 키우면 대규모 데이터에서 perplexity가 계속 떨어진다는 것을 보여, `Transformer`와 GPT 계열이 등장하기 전부터 "크기가 곧 성능"이라는 가설에 실증적 근거를 댔다. 동시에 대규모 어휘 소프트맥스 문제(CNN Softmax, importance sampling)를 정면으로 다뤄, 이후 대규모 언어모델 학습의 표준 공학 레퍼토리 일부가 여기서 정리됐다. 저자 중 Noam Shazeer는 이후 `[Transformer](#/p/transformer)`와 `[MoE](#/p/moe-shazeer)`, `[GLU 변형](#/p/glu-variants)`까지 이어지는 스케일링 계열 연구를 계속 주도한다.',

legacy:[
 '**"키우면 좋아진다"의 실측 선례** — `[스케일링 법칙](#/p/scaling-laws)`이 정식으로 정리되기 전, 대규모 LSTM으로 이 관계를 먼저 보여준 실험적 증거',
 '**대규모 소프트맥스 문제의 공식화** — importance sampling·NCE·계층적 소프트맥스의 관계 정리는 이후 대규모 어휘를 다루는 모든 시퀀스 모델의 참고점이 됨',
 '**문자 단위 입출력** — 이 논문의 Char CNN 입력 임베딩은 이후 서브워드 토크나이저(`[BPE](#/p/bpe)` 등)로 대체되며 자연스럽게 흡수됨',
 '`Transformer` 등장 이후 순환 구조 자체가 병렬화 병목으로 밝혀지며, 이 계열의 "LSTM을 더 키우자"는 방향은 attention 기반 스케일링으로 넘어감'
],

pitfalls:[
 '**RNN 스케일링과 Transformer 스케일링을 같은 곡선으로 착각하기 쉽다.** 이 논문의 결과는 순환 구조 안에서의 스케일 관계이고, attention 기반 모델의 스케일링 법칙과는 계산 구조(순차 vs 병렬)가 다르다.',
 '**Char LSTM이 가장 정교한 방법이라 성능도 가장 좋았을 것이라 생각하기 쉽지만, 실제로는 CNN Softmax보다 perplexity가 더 나빴다**고 논문이 직접 보고한다. 어휘 독립성과 정확도는 별개 축이다.',
 '**이 논문의 "대규모"는 오늘 기준으로는 소규모다.** 8억 단어·수억 파라미터는 이후 `GPT-3` 등의 수천억 토큰·수천억 파라미터에 비하면 훨씬 작은 스케일에서의 실험이라는 점을 감안해야 한다.'
],

figures:[
 {f:'fig1-architectures.png',
  cap:'같은 LSTM 골격에서 입력·출력을 어떻게 만드는지가 다르다. (a) 단어 임베딩을 그대로 쓰는 표준형. (b) 입력·출력 임베딩을 모두 문자 CNN으로 대체. (c) 출력층을 소프트맥스 대신 문자 단위 LSTM(보라색 상자, Char LSTM)으로 바꿔 한 글자씩 단어를 생성.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'Our best single model significantly improves state-of-the-art perplexity from 51.3 down to 30.0 (whilst reducing the number of parameters by a factor of 20), while an ensemble of models sets a new record by improving perplexity from 41.0 down to 23.7.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1602.02410 — Exploring the Limits of Language Modeling', u:'https://arxiv.org/abs/1602.02410'},
 {t:'One Billion Word Benchmark (Chelba et al., 2013)', u:'https://arxiv.org/abs/1312.3005'}
]
});
