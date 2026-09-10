WIKI.paper({
slug:'neural-summarization',
venue:'EMNLP 2015',
authors:'Rush, Chopra, Weston (Facebook AI Research / Harvard SEAS)',
arxiv:'1509.00685',

tldr:'제목을 만드는 문제(헤드라인 생성)를 **신경망 언어모델 + attention 인코더**로 직접 풀어, 요약을 신경망과 attention으로 다룬 초기 사례 중 하나를 보였다. 문법 규칙도, 정렬 제약도 없이 입력 문장 전체를 읽고 단어를 하나씩 생성한다.',

context:'2015년 요약은 여전히 대부분 **추출(extractive)** — 원문에서 구를 잘라 붙이거나, 구문 트리를 자르는 압축(compression) 방식이었다. 완전히 새 단어를 만들어내는 **추상(abstractive)** 요약은 언어학적 제약이나 정렬 규칙에 기댄 시스템뿐이었고, 학습 데이터에 자유롭게 스케일하지 못했다. 한편 같은 시기 기계번역에서는 [seq2seq](#/p/seq2seq)와 [Bahdanau attention](#/p/bahdanau)이 정렬 규칙 없이 대량 데이터로 번역을 학습하고 있었다. 이 논문의 질문은 그 레시피를 요약에 그대로 옮기면 되는가였다 — 정답은 "된다"였고, Gigaword 400만 쌍으로 학습한 순수 데이터 기반 모델이 기존 규칙 기반 시스템을 앞질렀다.',

ideas:[
 {h:'헤드라인 생성을 조건부 언어모델로 환원',
  lead:'요약 문제를 매 단어마다 $p(y_{i+1}\\mid x, y_c)$ 를 추정하는 언어모델로 바꾼다.',
  d:'전체 요약의 점수를 각 단어 생성 확률의 합으로 근사한다(식 4). 별도의 정렬 단계나 언어모델·번역모델을 분리 추정하던 noisy-channel 방식(Banko et al. 2000 류)을 버리고, [Bengio 2003 NNLM](#/p/nnlm)처럼 이전 $C$개 단어(context window)와 입력 문장을 함께 조건으로 넣어 하나의 신경망으로 직접 확률을 추정한다.'},
 {h:'Attention-Based Encoder(enc3): 요약에 맞춘 경량 attention',
  lead:'현재 생성 컨텍스트로 입력 단어에 가중치를 매겨 평균 낸다 — MLP도 RNN도 없다.',
  d:'[Bahdanau attention](#/p/bahdanau)처럼 컨텍스트에 따라 입력의 어느 부분을 볼지 바꾸지만, 정렬 점수를 MLP 대신 **가중 내적**으로, 인코더를 양방향 RNN 대신 **평활화된 bag-of-words**로 단순화했다(원문 각주 5에 이 세 가지 차이가 명시돼 있다). 이 단순화 덕에 4백만 쌍 규모로도 GPU에서 며칠 만에 학습이 끝난다.'},
 {h:'bag-of-words와 convolutional 인코더는 대조군',
  lead:'문맥 없는 평균(enc1)·TDNN 합성곱(enc2)과 비교해 attention(enc3)의 이득을 검증한다.',
  d:'세 인코더 모두 같은 NNLM 디코더에 꽂아 검증 perplexity로 비교했다(표 2). bag-of-words는 43.6, 합성곱은 35.9, attention은 27.1로 가장 낮다 — attention이 단어 순서·컨텍스트 정합을 실제로 이용하고 있다는 근거다.'},
 {h:'beam search로 미등록 단어까지 자유롭게 생성',
  lead:'출력 어휘를 입력 단어로 제한하지 않고 전체 어휘 $V$ 에서 beam search로 찾는다.',
  d:'추출 요약은 입력 단어의 부분열만 고를 수 있어 탐색이 $O(N V^C)$ 로 다루기 쉽지만 표현력이 제한된다. 이 모델은 출력 위치마다 전체 어휘에서 고르므로 정렬 제약이 없고, 그 대가로 정확한 argmax는 비실용적이라 beam search(알고리즘 1, $O(KNV)$)로 근사한다.'},
 {h:'Extractive Tuning: 추상 모델에 추출 신호를 섞는다',
  lead:'생성 확률에 unigram/bigram/trigram 일치·재정렬 지표를 더해 MERT로 가중치를 맞춘다.',
  d:'순수 추상 모델(ABS)은 입력에 있는 고유명사·희귀 단어를 그대로 복사하지 못하는 약점이 있다. 로그 확률에 4개의 이진 지표(각주 n-gram 일치, 재정렬)를 추가한 로그선형 모델(식 이후 부분)을 만들고 MERT로 $\\alpha$ 를 튜닝한 ABS+가 이 약점을 부분적으로 메운다.'}
],

diagram:{type:'flow', cap:'ABS의 추론 파이프라인. 인코더가 매 스텝 입력을 다시 훑어 컨텍스트에 맞는 가중 평균을 만들고, NNLM 디코더가 다음 단어를 낸다.',
 nodes:[
  {t:'입력 문장', s:'x₁…x_M'},
  {t:'attention 인코더', s:'enc3: p ∝ exp(x̃Pỹc)', acc:true},
  {t:'가중 평균', s:'x̄ = Σ p·x'},
  {t:'NNLM 디코더', s:'context C개 단어'},
  {t:'beam search', s:'K개 후보 유지', a:'단어별'},
  {t:'헤드라인', s:'y₁…y_N'}
 ]},

math:[
 {expr:'enc3(x, yc) = pᵀx̄,   p ∝ exp(x̃ · P · ỹc)',
  tex:'\\text{enc}_3(x,y_c)=p^{\\top}\\bar{x},\\qquad p \\propto \\exp(\\tilde{x}\\,P\\,\\tilde{y}_c)',
  d:'$\\tilde{x}$ 는 입력 단어 임베딩, $\\tilde{y}_c$ 는 디코더 컨텍스트 임베딩. 두 임베딩의 가중 내적을 softmax에 통과시켜 얻은 $p$ 로 평활화된 입력 $\\bar{x}$ 를 가중 평균한다 — attention 정렬 자체는 학습된 선형 사영 $P$ 하나뿐이다.'},
 {expr:'p(yi+1 | yc, x; θ) ∝ exp(Vh + W·enc(x, yc)),   h = tanh(U·ỹc)',
  tex:'p(y_{i+1}\\mid y_c,x;\\theta)\\propto\\exp\\!\\big(Vh+W\\cdot\\text{enc}(x,y_c)\\big),\\qquad h=\\tanh(U\\tilde{y}_c)',
  d:'표준 NNLM 항(Vh)에 인코더 출력(W·enc)을 더해 다음 단어 점수를 낸다. 인코더를 떼면 그냥 언어모델이라는 점이 핵심 — 입력 조건화가 이 한 항으로 들어간다.'}
],

numbers:[
 {k:'학습 데이터', v:'Gigaword 약 400만 쌍', d:'기사 첫 문장–헤드라인 쌍, 필터링 후'},
 {k:'DUC-2004 ROUGE-1', v:'28.18 (ABS+)', d:'당시 최고였던 TOPIARY(25.12)를 앞섬'},
 {k:'Gigaword ROUGE-1', v:'31.00 (ABS+)', d:'MOSES+ 통계 기계번역 베이스라인(28.77)보다 높음'},
 {k:'인코더별 검증 perplexity', v:'BoW 43.6 · 합성곱 35.9 · attention 27.1', d:'표 2, 같은 NNLM 디코더 기준'},
 {k:'학습 속도', v:'1000 미니배치(D=200,H=400)에 160초', d:'GPU 없이는 비현실적이라고 명시'},
 {k:'요약 길이', v:'평균 헤드라인 8.3단어', d:'DUC 참조 요약(14단어)보다 짧음'}
],

impact:'요약을 **정렬 규칙이나 구문 트리 없이 순수 데이터로 학습되는 신경망 조건부 생성 문제**로 재정의했다. attention 인코더 하나로 사실상 임의의 (문서, 요약) 쌍에서 학습이 가능해지면서, 이후 요약 연구는 "어떤 언어학적 제약을 넣을까"에서 "어떤 신경망 구조를 쓸까"로 완전히 축을 옮겼다. 다만 문장 단위·고정 길이 출력이라는 한계는 이 논문 자체로는 풀리지 않았고, 곧바로 문서 단위 확장이 뒤따랐다.',

legacy:[
 '**문서 단위로 확장** — 같은 attention 레시피가 [abstractive-rnn](#/p/abstractive-rnn)에서 문서 전체와 CNN/DailyMail 벤치마크로 넘어감',
 '**미등록 단어 복사 문제의 정면 해법** — 이 논문의 extractive tuning이 임시방편이었던 자리를 [pointer-generator](#/p/pointer-generator)의 copy 메커니즘이 구조적으로 대체',
 '**RL 기반 요약** — ROUGE를 직접 최적화하려는 흐름이 [rl-summarization](#/p/rl-summarization)으로 이어짐',
 '**사전학습 seq2seq로 수렴** — 전용 요약 아키텍처 경쟁은 결국 [BART](#/p/bart) 같은 범용 사전학습 encoder-decoder로 흡수됨'
],

pitfalls:[
 '**"seq2seq 논문"이 아니다.** 디코더는 RNN이 아니라 고정 윈도 $C$ 의 feed-forward NNLM이다. 저자들도 결론에서 "RNN-LM을 향후 과제로 남긴다"고 명시했다 — RNN 디코더 요약은 다음 세대 논문들의 몫이다.',
 '**출력 길이 $N$ 을 미리 안다고 가정한다.** 이는 기계번역과 다른 지점으로, DUC 평가가 바이트 수를 제한하기 때문에 성립하는 단순화다. 임의 길이 생성 문제는 이 논문의 범위 밖이다.',
 '**ABS와 ABS+를 혼동하지 않는다.** 표 1의 ABS는 순수 신경망 점수만 쓰고, ABS+는 MERT로 추가 추출 지표를 튜닝한 별도 모델이다. ROUGE-1 28.18은 ABS+ 값이지 ABS(26.55) 값이 아니다.'
],

figures:[
 {f:'fig1-attention-heatmap.png',
  cap:'세로축이 입력 단어, 가로축이 생성된 헤드라인 단어. 각 열이 그 단어를 생성할 때 입력 위 어디에 확률질량이 몰렸는지를 보여준다 — "terrorism" 열이 입력의 "terrorism"에, "joint"가 "joint"에 진하게 몰린 대각선에 가까운 패턴에 주목.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'We instead explore a fully data-driven approach for generating abstractive summaries.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 1509.00685 — A Neural Attention Model for Abstractive Sentence Summarization', u:'https://arxiv.org/abs/1509.00685'},
 {t:'Code release (Facebook Research, NAMAS)', u:'https://github.com/facebookarchive/NAMAS'}
]
});
