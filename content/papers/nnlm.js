WIKI.paper({
slug:'nnlm',
venue:'JMLR 2003 (NIPS 2000 초판)',
authors:'Bengio, Ducharme, Vincent, Jauvin (Université de Montréal)',

tldr:'단어를 원-핫 기호가 아니라 **학습되는 실수 벡터**로 표현하고, 그 벡터들로 다음 단어를 예측하는 신경망 언어모델을 세운 논문. "비슷한 단어는 비슷한 벡터"라는 전제 하나로 n-gram이 절대 못 하던 일반화를 해냈고, 이후 [word2vec](#/p/word2vec)부터 오늘날 LLM 임베딩 층까지 이어지는 계보의 출발점이 되었다.',

context:'2003년의 언어모델은 예외 없이 n-gram 카운트였다. $P(w_t | w_{t-1}, w_{t-2})$ 를 코퍼스에서 세고, 못 본 조합은 back-off와 스무딩으로 메운다. 문제는 **조합 폭발**이다. 어휘가 1만 개일 때 3-gram 조합은 $10^{12}$ 개이고, 어떤 코퍼스도 그 대부분을 한 번도 담지 못한다. 논문은 이것을 "차원의 저주"라고 부른다. 더 근본적인 결함은 n-gram이 단어를 **원자적 기호**로 본다는 점이다. `"고양이가 방에서 자고 있다"` 를 학습해도 `"개가 방에서 자고 있다"` 에 아무 확률도 넘겨주지 못한다 — 모델 입장에서 `고양이`와 `개`는 인덱스 3948번과 7712번일 뿐, 아무 관계가 없다. 스무딩은 이 문제를 완화하는 게 아니라 그냥 무지를 균등하게 나눠줄 뿐이다.',

ideas:[
 {h:'단어를 저차원 실수 벡터에 심는다 (distributed representation)',
  lead:'좁은 벡터 병목 때문에 비슷한 문맥의 단어가 서로 가까워진다.',
  d:'어휘의 각 단어 $i$ 에 학습 가능한 벡터 $C(i) \\in \\mathbb{R}^m$ 을 준다. 논문에서 $m$ 은 30~100 정도로, 어휘 크기(1.6만~1.8만)에 비해 압도적으로 작다. 이 **좁은 병목**이 핵심이다. 파라미터가 부족하므로 모델은 단어를 하나씩 외울 수 없고, 비슷한 문맥에서 쓰이는 단어들을 서로 가까운 위치로 밀어 넣는 것 말고는 손실을 줄일 방법이 없다. 의미적 유사도는 목적함수에 명시되지 않았는데도 부산물로 튀어나온다.'},
 {h:'벡터가 확률 질량을 옆 단어로 옮긴다',
  lead:'한 단어의 학습이 근처 벡터를 통해 못 본 문장에도 확률을 나눠준다.',
  d:'`개`의 벡터가 `고양이` 근처로 이동하면, `고양이`가 등장한 문장으로 계산된 gradient가 `개`가 들어간 한 번도 못 본 문장의 확률까지 같이 올린다. n-gram의 스무딩은 "못 본 것에 균등하게 나눠주기"인 반면, 여기서는 **어느 미관측 조합에 얼마를 줄지를 데이터가 정한다**. 이것이 이 논문이 말하는 차원의 저주 돌파 방식이다.'},
 {h:'표현과 확률모델을 동시에 학습한다',
  lead:'임베딩과 예측기를 하나의 로그우도로 함께 최적화한다.',
  d:'임베딩 행렬 $C$ 와 예측 신경망의 가중치를 **하나의 로그우도 목적함수로 함께** 최적화한다. 표현을 따로 만들어서 갖다 쓰는 2단계 파이프라인이 아니다. 그래서 벡터는 "다음 단어 예측에 유용한 방향"으로만 정렬된다 — 10년 뒤 [word2vec](#/p/word2vec)이 이 예측 과제를 극단적으로 단순화해 표현만 뽑아 쓰는 방향으로 뒤집게 된다.'},
 {h:'구조: 룩업 → concat → tanh 은닉층 → V-way softmax',
  lead:'앞 단어 벡터를 이어 붙여 은닉층을 거쳐 어휘 전체를 예측한다.',
  d:'앞 $n-1$ 개 단어를 각각 $C$ 로 룩업해 $(n-1)m$ 차원으로 이어 붙이고, $\\tanh$ 은닉층을 거쳐 어휘 크기 $|V|$ 의 softmax를 낸다. 입력 특징에서 출력으로 직접 가는 선형 연결(direct connection)도 옵션으로 두었는데, 이걸 빼면 수렴이 2배 느려지지만 최종 perplexity는 오히려 약간 낫다. 오늘날 임베딩 층 + MLP 헤드 구조 그대로다.'},
 {h:'계산 병목은 출력 softmax이고, 이걸 아무도 못 피했다',
  lead:'비용이 어휘 크기에 선형이라 softmax가 전체 계산을 지배한다.',
  d:'예제 하나당 연산량은 대략 $|V| \\cdot (1 + nm + h)$ 로 **어휘 크기에 선형**이다. 앞쪽 은닉층이 아니라 마지막 softmax 정규화가 전체 비용을 지배한다. AP News 실험이 40 CPU로 3주 걸린 이유가 이것이며, 이후 10년간의 연구(계층적 softmax, [negative sampling](#/p/word2vec), NCE)는 사실상 전부 이 한 항을 깎는 이야기다.'}
],

diagram:{type:'compare', cap:'n-gram 카운트 vs 신경망 언어모델. 차이는 "단어를 기호로 보는가, 벡터로 보는가" 하나다.',
 left:{t:'기존: 스무딩 n-gram', items:[
  '단어 = 원자적 인덱스, 단어 간 관계 없음',
  '조합을 세어서 확률 추정 ($10^{12}$ 개 조합)',
  '못 본 조합 → back-off로 균등하게 메움',
  '"고양이"로 배운 것이 "개"에 전이되지 않음',
  '문맥 길이를 늘리면 데이터 희소성이 폭발']},
 right:{t:'NNLM: 분산 표현 + MLP', items:[
  '단어 = 학습되는 m차원 벡터(30~100)',
  '좁은 병목이 유사 단어를 같은 방향으로 모음',
  '미관측 조합의 확률을 이웃 단어에서 빌려옴',
  'Brown PPL 252 (n-gram 312)',
  '비용은 어휘 크기 $|V|$ 의 softmax로 이동']}},

math:[
 {expr:'P(w_t | w_{t-1} … w_{t-n+1}) = softmax( b + W x + U tanh(d + H x) ),   x = [C(w_{t-1}) ; … ; C(w_{t-n+1})]',
  tex:'\\begin{aligned} P(w_t \\mid w_{t-1}\\ldots w_{t-n+1}) &= \\mathrm{softmax}(b + Wx + U\\tanh(d+Hx)), \\\\ x &= [C(w_{t-1}); \\ldots; C(w_{t-n+1})] \\end{aligned}',
  d:'$C$ 는 $|V| \\times m$ 임베딩 행렬, $x$ 는 앞 단어 벡터들을 이어 붙인 것. $Wx$ 항이 입력 특징 → 출력 직접 연결이고, $U \\tanh(\\cdot)$ 이 은닉층 경로다. 오늘날의 임베딩 룩업 + FFN + 어휘 헤드와 정확히 같은 형태다.'},
 {expr:'L = (1/T) Σ_t log P(w_t | w_{t-1} … w_{t-n+1}; θ) − R(θ)',
  tex:'L = \\frac{1}{T}\\sum_t \\log P(w_t \\mid w_{t-1}\\ldots w_{t-n+1}; \\theta) - R(\\theta)',
  d:'평범한 로그우도 최대화에 가중치 감쇠 $R(\\theta)$ 만 붙였다. 별도의 "표현 학습 손실"은 없다 — 단어 벡터는 이 목적함수의 부산물로 정렬된다.'}
],

numbers:[
 {k:'Brown 코퍼스', v:'1,181,041 단어 · |V| 16,383', d:'빈도 3 이하 단어는 하나의 심볼로 병합'},
 {k:'Brown 테스트 perplexity', v:'252', d:'최고 n-gram(클래스 500개 기반) **312**, 보간 트라이그램 336'},
 {k:'개선폭', v:'24%', d:'최고 n-gram 대비. 보간 트라이그램 기준으로는 33%'},
 {k:'AP News', v:'약 1,400만 단어 · |V| 17,964', d:'MLP 테스트 perplexity **109** vs Kneser-Ney 5-gram 117 (약 8%)'},
 {k:'단어 벡터 차원 m', v:'30 ~ 100', d:'어휘 1.6만~1.8만에 대해 극단적으로 좁은 병목'},
 {k:'AP News 학습 시간', v:'5 epoch / 40 CPU로 약 3주', d:'과적합 징후가 보이기도 전에 계산 예산이 먼저 끝났다'}
],

impact:'"단어를 벡터로"라는 아이디어를 **작동하는 확률모델 안에서** 처음으로 증명했다. 그전까지 분산 표현은 개념적 제안에 가까웠지만, 여기서는 실제 언어모델 벤치마크에서 20년 묵은 n-gram을 이겼다. 동시에 이 논문은 앞으로 무엇이 문제가 될지도 정확히 남겼다 — **어휘 크기에 비례하는 softmax 비용**, 그리고 **고정 길이 문맥 창**. 앞의 것은 계층적 softmax와 negative sampling이, 뒤의 것은 [LSTM](#/p/lstm) 언어모델과 결국 [Transformer](#/p/transformer)가 풀게 된다. 임베딩 행렬 → 신경망 → 어휘 softmax라는 골격은 GPT 계열까지 한 번도 바뀌지 않았다.',

legacy:[
 '**표현만 떼어내기** — [word2vec](#/p/word2vec)이 은닉층을 없애고 예측 과제를 극단적으로 싸게 만들어, 벡터 자체를 대량 생산하는 부품으로 바꿨다',
 '**전역 통계로의 반작용** — [GloVe](#/p/glove)는 여기서 시작된 로컬 윈도우 예측 방식 대신 코퍼스 전체 동시등장 행렬을 직접 분해하는 길을 택했다',
 '**softmax 비용과의 싸움** — 계층적 softmax·NCE·negative sampling으로 이어진 계열 전체가 이 논문의 $|V|$ 항에서 파생됐다',
 '**문맥 의존 표현으로** — 여기서 단어당 벡터는 하나뿐이라는 한계가 남았고, [ELMo](#/p/elmo)가 그 벡터를 문장의 함수로 바꾸면서 [BERT](#/p/bert) 시대가 열렸다'
],

pitfalls:[
 '**"단어 임베딩을 처음 발명한 논문"이 아니다.** 분산 표현 자체는 1980년대 연결주의 연구(Hinton 등)에 있었고, 이 논문의 기여는 그것을 **대규모 확률적 언어모델의 학습 가능한 파라미터로 통합해 n-gram을 실제로 이긴 것**이다.',
 '**perplexity 개선폭(24%)을 오늘 기준으로 읽으면 안 된다.** 백만 단어짜리 Brown 코퍼스에 40 CPU로 몇 주를 쓴 실험이며, 절대 perplexity(252)는 현대 모델과 비교 대상이 아니다. 의미가 있는 건 "같은 조건에서 카운트 기반을 이겼다"는 방향성이다.',
 '**문맥은 여전히 고정 길이 창($n$=5~6)이다.** RNN 언어모델이 아니라 앞 $n-1$ 단어만 보는 MLP이며, 더 긴 의존관계는 구조적으로 볼 수 없다. 이 한계는 [LSTM](#/p/lstm)·[seq2seq](#/p/seq2seq) 계열이 따로 풀어야 했다.'
],

figures:[
 {f:'fig1-nnlm-architecture.png',
  cap:'맨 아래 각 단어 인덱스가 공유 행렬 C를 거쳐 word feature vector로 바뀌고(table look-up), 그 벡터들이 이어 붙여져 tanh 은닉층 → softmax 출력으로 흘러가는 구조. 점선 화살표는 word feature에서 출력으로 바로 가는 지름길(direct connection) 연결. 이 그림이 이후 word2vec류 모델의 "임베딩 테이블 + 신경망" 틀의 원형이다.',
  src:'원문 Figure 1, p.6'}
],

quotes:[
 {t:'We propose to fight the curse of dimensionality by learning a distributed representation for words which allows each training sentence to inform the model about an exponential number of semantically neighboring sentences.',
  src:'Abstract, p.1'}
],

links:[
 {t:'JMLR 3 (2003) — A Neural Probabilistic Language Model', u:'https://www.jmlr.org/papers/volume3/bengio03a/bengio03a.pdf'},
 {t:'NIPS 2000 초판 (동일 모델의 첫 발표)', u:'https://papers.nips.cc/paper/1839-a-neural-probabilistic-language-model'}
]
});
