WIKI.paper({
slug:'monot5',
venue:'arXiv 2020 (SIGIR 2020 short paper)',
authors:'Nogueira, Jiang, Lin (University of Waterloo)',
arxiv:'2003.06713',

tldr:'리랭킹을 분류가 아니라 **"true" 또는 "false"라는 단어를 생성하는 seq2seq 문제**로 바꾼 논문. [monoBERT](#/p/monobert)의 `[CLS]` + 완전연결층을 T5의 디코더로 통째로 교체했더니, 특히 학습 데이터가 적을 때 크게 강해졌다.',

context:'[BM25](#/p/bm25) 같은 1단계 검색기는 재현율은 챙기지만 상위권 정밀도가 낮다. 그래서 후보 상위 1000개 정도를 뽑은 뒤 더 무거운 모델로 다시 순위를 매기는 **2단계 파이프라인**이 표준이 됐고, [monoBERT](#/p/monobert)가 그 2단계를 encoder 분류로 잘 풀었다. 하지만 monoBERT는 `[CLS]` 표현 위에 무작위 초기화된 완전연결층을 새로 얹는 구조라, 이 층은 사전학습의 혜택을 전혀 받지 못하고 파인튜닝 데이터에서 처음부터 배워야 한다. 데이터가 충분하면 문제없지만, 적으면 이 층 하나가 병목이 된다. 마침 [T5](#/p/t5)라는 encoder-decoder 사전학습 모델이 나왔고, 저자들은 "관련성 판단도 디코더가 생성하는 단어로 표현하면 어떨까"를 묻는다.',

ideas:[
 {h:'입력을 통째로 텍스트-투-텍스트로',
  lead:'"Query: q Document: d Relevant:" 다음에 나올 단어를 예측하게 만든다.',
  d:'질의와 문서를 하나의 문자열로 이어붙이고 "Relevant:" 뒤에 올 다음 토큰을 T5 디코더가 생성하게 한다. 학습 시 정답 타깃 단어는 관련 문서면 "true", 아니면 "false" 딱 하나다. 분류기를 얹는 대신 T5가 원래 하던 일(다음 단어 생성)을 그대로 시킨 것이다.'},
 {h:'true/false 두 토큰만의 소프트맥스로 점수화',
  lead:'전체 어휘가 아니라 true·false 두 로짓에만 softmax를 적용해 관련성 확률을 얻는다.',
  d:'추론 시 디코더의 전체 어휘 로짓 중 "true"와 "false" 두 토큰의 로짓만 꺼내 그 둘 사이에서만 softmax를 계산한다. "true" 확률로 문서를 재정렬한다. 저자들은 전체 어휘로 softmax를 하거나 logit 하나만 쓰는 방식은 시도했지만 거의 작동하지 않았다고 밝혔다. `SentencePiece` 토크나이저가 "true"·"false"를 각각 단일 토큰으로 쪼개는 것도 이 설계를 단순하게 만든 조건이다.'},
 {h:'데이터가 적을수록 격차가 커진다',
  lead:'사전학습된 디코더가 있어 라벨이 적어도 "생성 능력"에 기댈 수 있다.',
  d:'monoBERT의 완전연결층은 무작위 초기화라 파인튜닝 데이터에서만 배운다. 반면 T5는 관련성 결정을 사전학습에서 이미 갈고닦은 "자연스러운 텍스트 생성" 회로에 얹기 때문에, 파인튜닝 데이터가 1천~2만 건처럼 적을 때 그 차이가 극명하게 드러난다. 데이터가 충분하면 두 방식의 격차는 줄어든다.'},
 {h:'Robust04 제로샷 전이',
  lead:'MS MARCO로만 학습한 모델을 Robust04에 그대로 적용해도 최고 성능을 낸다.',
  d:'Robust04는 학습에 전혀 쓰지 않고 순수한 테스트셋으로만 사용했다. 기존 최고 모델([CEDR](#/p/monobert), Birch)은 Robust04 자체에서 교차검증하거나 파라미터를 튜닝했는데, monoT5는 그런 튜닝 없이 더 높은 점수를 냈다.'},
 {h:'타깃 단어를 흔들어 잠재지식을 캐묻다',
  lead:'"true/false"를 "hot/cold"·무의미한 subword로 바꿔가며 왜 데이터 효율이 좋은지 검증한다.',
  d:'타깃 단어를 반대로 뒤집거나("false"=관련), 극성만 있는 무관한 단어쌍("hot"/"cold")으로, 또는 의미 없는 subword 조각("_ab"/"_de")으로 바꿔 학습시켰다. 데이터가 적을 때는 원래의 true/false 조합이 가장 좋았고, 의미를 완전히 제거한 subword 조건은 BM25보다도 못한 성능을 보였다. 이는 T5가 사전학습에서 얻은 언어적 지식을 실제로 재활용하고 있다는 증거다.'}
],

diagram:{type:'compare', cap:'monoBERT는 분류층을 새로 학습하고, monoT5는 사전학습된 생성 능력을 그대로 재활용한다.',
 left:{t:'monoBERT: 분류', items:['[CLS] 표현 추출','무작위 초기화 FC층','이진 분류 확률']},
 right:{t:'monoT5: 생성', items:['Query+Document+Relevant: 입력','디코더가 true/false 생성','두 토큰 로짓만 softmax']}
},

math:[
 {expr:'input = "Query: q Document: d Relevant:"',
  tex:'\\text{input}=\\texttt{"Query: }q\\texttt{ Document: }d\\texttt{ Relevant:"}',
  d:'질의 q와 문서 d를 하나의 프롬프트 문자열로 합쳐 T5 인코더에 넣는다. 디코더는 이 뒤에 이어질 한 단어만 생성한다.'},
 {expr:'P(relevant) = exp(z_true) / (exp(z_true) + exp(z_false))',
  tex:'P(\\text{relevant})=\\frac{\\exp(z_{\\text{true}})}{\\exp(z_{\\text{true}})+\\exp(z_{\\text{false}})}',
  d:'디코더 첫 스텝의 전체 어휘 로짓 중 "true" 로짓 $z_{true}$ 와 "false" 로짓 $z_{false}$ 만 꺼내 그 둘 사이에서 softmax를 계산한다. 나머지 어휘는 모두 무시한다.'}
],

numbers:[
 {k:'MRR@10 · [MS MARCO](#/p/ms-marco) dev', v:'BM25 .184 → +BERT-large .372 → +T5-3B .382', d:'T5-large(.383)가 근소하게 최고, 3B는 저자들도 미수렴으로 추정'},
 {k:'NDCG@20 · Robust04 (제로샷)', v:'BM25 .424 → +T5-3B .596', d:'MS MARCO로만 학습한 모델을 Robust04에 그대로 전이, 저자들이 "당시 최고 기록"이라 주장'},
 {k:'데이터 2천 건 · MS MARCO dev', v:'BERT-base .127 vs T5-base .238', d:'적은 데이터에서 BERT는 BM25(.184)보다도 낮다'},
 {k:'데이터 2만 건 · MS MARCO dev', v:'BERT-base .201 vs T5-base .261', d:'T5가 BERT보다 6점 앞섬, 95% 신뢰구간 기준'},
 {k:'타깃 단어 · subword 조건', v:'.163(2k) / .151(20k)', d:'의미를 지운 조건에서 BM25(.184)보다 낮아짐 — 언어지식 재활용의 반증'},
 {k:'학습 비용', v:'T5-base 12h · large 48h · 3B 160h', d:'TPU v3 1개 기준, 3B는 100k 스텝 학습 후에도 수렴 전으로 추정'}
],

impact:'monoT5는 "리랭킹 = 분류"라는 당연해 보이던 틀을 "리랭킹 = 생성"으로 바꿔, 이후 **prompt 기반 relevance judgment**(LLM에게 관련 있는지 물어보는 방식) 전체의 원형이 됐다. 또한 데이터가 적을 때 encoder-only보다 encoder-decoder가 유리하다는 관찰은, 사전학습된 생성 능력을 다운스트림 판별 작업에 재사용하는 이후 연구 흐름과 맞닿아 있다.',

legacy:[
 '**RankT5·RankLLaMA 등 seq2seq/생성 기반 리랭커**가 monoT5의 true/false 생성 레시피를 계승',
 '**LLM 기반 zero-shot 리랭킹**(GPT류에 "관련 있는가"를 직접 묻는 방식)의 사실상 원조',
 '검증 실험(target word probing)이 "사전학습 지식이 파인튜닝에서 재활용된다"는 이후 해석 연구의 초기 증거로 인용',
 '**T5-3B 규모까지의 리랭커 스케일링**을 처음 문서화해, 이후 monoT5-3B가 여러 IR 논문의 강력한 베이스라인으로 자리잡음'
],

pitfalls:[
 '**"true/false"라는 특정 단어가 본질은 아니다.** 저자들은 hot/cold, apple/orange 등으로 바꿔도 데이터가 충분하면 큰 차이가 없다는 것을 보였다 — 중요한 것은 "생성 어휘 전체가 아니라 두 후보 토큰만 비교"하는 설계다.',
 '**T5-large가 T5-base보다 Robust04에서 낮게 나온 것은 모델이 나빠서가 아니라 학습 절차 때문이다.** 고정 스텝 수만 돌리고 체크포인트 선택을 하지 않아, 검증 없는(제로샷 순수성을 지키기 위한) 학습 방식이 낳은 우연한 결과라고 저자들이 직접 밝혔다.',
 '**리랭커는 1단계 검색을 대체하지 않는다.** monoT5는 BM25가 뽑아온 상위 1000개 후보를 다시 정렬할 뿐이고, 처음부터 후보에 없던 문서는 아무리 관련 있어도 찾아내지 못한다.'
],

quotes:[
 {t:"We show how a sequence-to-sequence model can be trained to generate relevance labels as \"target words\", and how the underlying logits of these target words can be interpreted as relevance probabilities for ranking.",
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2003.06713 — Document Ranking with a Pretrained Sequence-to-Sequence Model', u:'https://arxiv.org/abs/2003.06713'},
 {t:'PyGaggle (공식 monoT5 구현)', u:'https://github.com/castorini/pygaggle'}
]
});
