WIKI.paper({
slug:'tied-embeddings',
venue:'EACL 2017 (arXiv 2016)',
authors:'Ofir Press, Lior Wolf (Tel-Aviv University)',
arxiv:'1608.05859',

tldr:'언어모델의 **입력 임베딩**(단어→벡터)과 **출력 사영 행렬**(벡터→단어 점수)을 같은 행렬로 묶으면(weight tying) 파라미터가 줄어들 뿐 아니라 perplexity도 낮아진다는 것을 보였다. 두 행렬이 본질적으로 같은 종류의 대상을 표현한다는 것을 업데이트 규칙 분석으로 증명한다.',

context:'언어모델의 마지막 두 층은 대칭적으로 생겼다 — 입력 단어 $c$ 를 임베딩 행렬 $U$ 로 사영해 $U^\\top c$ 를 만들고, 은닉층 계산 뒤 출력 행렬 $V$ 로 다시 어휘 크기만큼의 점수 $h_3=Vh_2$ 를 낸다. 그런데 [word2vec](#/p/word2vec) 이래로 실무에서는 관행적으로 $U$(입력 임베딩)만 "단어 벡터"로 취급하고 $V$(출력 임베딩)는 버려왔다. [Inan et al. 2016](https://arxiv.org/abs/1611.01462)이 독립적으로 비슷한 시기에 지식 증류 관점에서 weight tying을 설명했지만, 이 논문은 **왜 $U=V$ 로 묶는 것이 word2vec에서는 오히려 해가 되고 언어모델에서는 이득이 되는지**를 그래디언트 업데이트 식으로 정면 대응했다.',

ideas:[
 {h:'출력 임베딩도 valid word embedding이다',
  lead:'$V$ 의 각 행을 단어 벡터로 뽑아 표준 임베딩 평가에 넣어도 그럴듯한 유사도를 낸다.',
  d:'Simlex999·MEN 등 5개 벤치마크로 입력 임베딩 $U$ 와 출력 임베딩 $V$ 를 각각 평가했다(표 2, 3). word2vec에서는 $V$ 가 $U$ 에 살짝 못 미치지만, NNLM에서는 오히려 **$V$ 가 $U$ 보다 유의미하게 낫다** — PTB에서 Simlex999 상관계수가 입력 0.02, 출력 0.13. 출력 임베딩을 버려온 관행이 NNLM에서는 손해였다는 뜻이다.'},
 {h:'그래디언트로 보면 두 행렬은 애초에 비대칭이다',
  lead:'입력 임베딩은 현재 단어 한 행만, 출력 임베딩은 매 스텝 전체 행이 업데이트된다.',
  d:'학습 스텝마다 입력 임베딩 $U$ 는 그 시점의 입력 단어에 해당하는 행 $U_{i_t}$ 만 갱신되는 반면, 출력 임베딩 $V$ 는 softmax 분모 때문에 **어휘 전체 행**이 매 스텝 갱신된다(식으로 도출). 그래서 희귀 단어의 $U$ 행은 훈련 중 거의 안 갱신되는데 $V$ 행은 꾸준히 갱신된다 — 출력 임베딩이 더 잘 학습되는 이유다.'},
 {h:'묶은 임베딩은 입력보다 출력 쪽에 더 가깝게 진화한다',
  lead:'$U=V=S$ 로 묶으면 $S$ 의 업데이트가 입력 역할보다 출력 역할의 업데이트에 지배된다.',
  d:'묶인 행렬 $S$ 에서 현재 입력 단어가 아닌 행($k\\neq i_t$)의 업데이트는 순수하게 출력 임베딩 업데이트와 같은 형태고, 현재 입력 단어인 행조차 입력 쪽 항은 $p_t(i_t\\mid i_{1:t})$(거의 0에 가까운 확률)에 눌려 출력 쪽 항이 지배한다. Spearman 상관계수로 tied 임베딩과 (묶지 않은 모델의) 입력·출력 임베딩 사이 유사도를 재봐도(표 4) tied는 출력 임베딩과 압도적으로 더 가깝다(NNLM Large 기준 ρ=0.77 vs 0.16).'},
 {h:'word2vec에서 묶으면 오히려 나빠지는 이유',
  lead:'word2vec은 $h_2$ 항이 항등함수라 $U$·$V$ 가 서로 다른 대칭성을 요구해 묶으면 붕괴한다.',
  d:'NNLM은 [LSTM](#/p/lstm)이 입력·출력 임베딩 사이를 비선형으로 분리(decouple)하지만, word2vec skip-gram은 은닉층 변환이 항등함수라 [Goldberg & Levy 2014](https://arxiv.org/abs/1402.3722)가 지적한 대로 $p_t(i_t)\\to 0$ 이면 $i_t$ 의 임베딩 노름 자체가 0으로 눌린다. 이 논문은 이 주장을 재확인하되, "그래서 NNLM은 다르다"는 대비를 명시적으로 추가한다.'},
 {h:'dropout 없는 모델을 위한 사영 정규화(PR)',
  lead:'출력 앞에 사영 행렬 $P$ 를 끼우고 $\\lambda\\lVert P\\rVert^2$ 로 정규화해 tying을 보완한다.',
  d:'큰 모델은 dropout으로 정규화되지만 작은 모델은 그렇지 않다. $h_3=VPh_2$ 형태로 $P\\in\\mathbb{R}^{H\\times H}$ 를 추가하고 그 자체를 L2 정규화하면, 하나의 임베딩을 입력·출력 두 역할에 억지로 맞추는 대신 적당히 적응할 여지를 준다. PTB에서 WT+PR을 같이 쓰면 perplexity가 단독보다 더 낮아진다(표 6).'}
],

diagram:{type:'compare', cap:'묶지 않은 모델과 tied 모델의 차이. 파라미터 하나가 두 역할을 겸한다.',
 left:{t:'기존: U, V 분리', items:['입력 임베딩 U: 현재 단어만 갱신','출력 임베딩 V: 매 스텝 전체 갱신','파라미터 2×(어휘×hidden)','출력 임베딩은 버려짐']},
 right:{t:'weight tying: U=V=S', items:['S: 매 스텝 전체 행 갱신','파라미터 1×(어휘×hidden)','perplexity·크기 동시 개선']}},

math:[
 {expr:'∂Lt/∂Vk = (pt(ot|i1:t) − 1)·h2  (k=ot),   pt(k|i1:t)·h2  (k≠ot)',
  tex:'\\frac{\\partial L_t}{\\partial V_k}=\\begin{cases}(p_t(o_t\\mid i_{1:t})-1)\\,h_2^{(t)} & k=o_t\\\\ p_t(k\\mid i_{1:t})\\,h_2^{(t)} & k\\neq o_t\\end{cases}',
  d:'출력 임베딩은 softmax 정규화 때문에 정답 단어뿐 아니라 어휘의 **모든 행**이 매 스텝 0이 아닌 그래디언트를 받는다. 이것이 입력 임베딩(현재 입력 단어 행만 갱신)과의 근본적 비대칭이다.'},
 {expr:'pt(ot | i1:t) = exp(Vot·h2) / Σx exp(Vx·h2)',
  tex:'p_t(o_t\\mid i_{1:t})=\\dfrac{\\exp(V_{o_t}^{\\top}h_2^{(t)})}{\\sum_{x=1}^{C}\\exp(V_x^{\\top}h_2^{(t)})}',
  d:'표준 softmax 언어모델 식. $U,V$ 를 같은 행렬 $S$ 로 두면 이 식과 입력 사영 $S^\\top c$ 가 같은 파라미터를 공유하게 되고, 그 결과가 위의 비대칭적 그래디언트 흐름을 만든다.'}
],

numbers:[
 {k:'PTB perplexity (Large, dropout)', v:'82.2→77.7 (val) / 78.4→74.3 (test)', d:'weight tying만 추가, 파라미터는 66M→51M로 감소'},
 {k:'PTB perplexity (Small, no dropout, WT+PR)', v:'120.7→104.9 (val) / 114.5→100.9 (test)', d:'tying과 projection regularization을 함께 쓴 최선의 조합'},
 {k:'NMT 파라미터 절감 (3-way tying)', v:'168M → 80M (EN→FR)', d:'BLEU는 29.49→29.43로 사실상 유지'},
 {k:'word2vec 임베딩 품질(Simlex999)', v:'입력 0.30 · 출력 0.29 · tied 0.17', d:'NNLM과 반대로 tied가 더 나쁨 — 묶지 말아야 할 사례'},
 {k:'NNLM 출력 임베딩 우위(PTB, Simlex999)', v:'입력 0.02 · 출력 0.13', d:'표 3 — 관행적으로 버려온 출력 임베딩이 더 나은 표현'}
],

impact:'weight tying을 "파라미터 절반 절감 트릭"이 아니라 **입력·출력 임베딩이 같은 대상을 다른 방식으로 학습하고 있다는 사실의 그래디언트 수준 증명**으로 정당화했다. 이후 거의 모든 트랜스포머 기반 언어모델([GPT](#/p/gpt1) 계열 포함)이 기본값으로 입출력 임베딩을 묶으며, 3-way tying은 인코더·디코더 어휘가 겹치는 다국어·BPE 기반 번역·요약 모델에서 표준 관행이 됐다.',

legacy:[
 '**사실상 모든 현대 언어모델의 기본 설정** — 어휘가 큰 모델일수록 embedding 파라미터 비중이 커서 절감 효과가 그대로 전체 모델 크기에 반영됨',
 '**BPE·서브워드 시대와 시너지** — 소스·타겟 어휘가 겹치는 [BPE](#/p/bpe) 기반 번역 모델에서 3-way tying이 특히 큰 절감을 냄',
 '**정규화 이론으로 재해석** — 이후 연구들이 tying을 단순 파라미터 공유가 아니라 암묵적 정규화(implicit regularization)로 분석하는 계기가 됨'
],

pitfalls:[
 '**word2vec과 NNLM에서 결론이 정반대다.** "weight tying은 항상 이득"이라고 일반화하면 안 된다 — 이 논문 자체가 word2vec skip-gram에서는 tying이 임베딩 품질을 오히려 떨어뜨린다는 것을 명시적으로 보여준다. LSTM 같은 비선형 은닉층이 입력·출력을 분리해주는 구조에서만 이득이 성립한다.',
 '**PR(사영 정규화)은 dropout 모델에는 도움이 안 된다.** 논문이 명시하듯 큰 모델(dropout 사용)에서는 PR 효과가 없고, 작은 모델(dropout 미사용)에서만 WT와 시너지를 낸다.',
 '**3-way tying은 인코더·디코더 어휘가 실제로 겹칠 때만 의미 있다.** 저자들도 EN→FR/DE에서 BPE 서브워드의 최대 90%가 공유된다는 것(표 1)을 먼저 확인한 뒤 이 방법을 적용했다 — 어휘가 겹치지 않는 언어쌍에 그대로 옮기면 근거가 약해진다.'
],

quotes:[
 {t:'We show that this matrix constitutes a valid word embedding. When training language models, we recommend tying the input embedding and this output embedding.',
  src:'Abstract, p.1'},
 {t:'This argument does not hold for NNLMs, since the LSTM layers cause a decoupling of the input and output embeddings.',
  src:'Section 3, p.3'}
],

links:[
 {t:'arXiv 1608.05859 — Using the Output Embedding to Improve Language Models', u:'https://arxiv.org/abs/1608.05859'},
 {t:'Tying Word Vectors and Word Classifiers (Inan et al. 2016)', u:'https://arxiv.org/abs/1611.01462'}
]
});
