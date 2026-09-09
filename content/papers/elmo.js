WIKI.paper({
slug:'elmo',
venue:'NAACL 2018 (Best Paper)',
authors:'Peters et al. (Allen Institute for AI · University of Washington)',
arxiv:'1802.05365',

tldr:'단어 벡터를 룩업 테이블에서 꺼내는 대신, **문장 전체를 읽은 양방향 LSTM 언어모델의 내부 상태에서 매번 새로 계산**하는 방식. 같은 단어라도 문맥이 다르면 다른 벡터가 나오고, 이 표현을 기존 모델의 입력에 얹는 것만으로 6개 과제에서 SOTA가 갈렸다.',

context:'[word2vec](#/p/word2vec)·[GloVe](#/p/glove)·[fastText](#/p/fasttext)까지 정적 임베딩은 서브워드와 전역 통계를 흡수하며 발전했지만, 넘지 못하는 벽이 하나 있었다 — **단어 하나에 벡터 하나**다. `"통장에서 돈을 뽑다"`의 `뽑다`와 `"이를 뽑다"`의 `뽑다`는 같은 점으로 뭉개진다. 다의어의 여러 의미가 빈도로 가중 평균된 그 점은, 사실 어떤 의미도 정확히 가리키지 않는다. 게다가 정적 임베딩은 문장 안에서의 문법적 역할(주어인지 목적어인지)이나 조응 관계를 담을 수 없다. 당시 대안이던 CoVe는 지도 학습된 번역 encoder에서 문맥 벡터를 뽑았는데, 병렬 코퍼스가 필요해서 규모를 키우기 어려웠다. 이 논문의 선택은 **레이블이 필요 없는 언어모델링**으로 되돌아가되, 그 내부 상태를 표현으로 쓰는 것이다.',

ideas:[
 {h:'표현은 벡터가 아니라 함수다',
  lead:'문장 전체를 입력받아 위치별로 다른 벡터를 내놓는 함수다.',
  d:'ELMo는 임베딩 파일이 아니라 **문장을 받아 위치별 벡터를 내놓는 함수**다. 토큰 $k$ 의 표현은 그 문장 전체에 의존하므로, 같은 단어가 문장마다 다른 벡터를 갖는다. 이것 하나로 다의어 문제와 문법 역할 문제가 동시에 정의부터 달라진다. 사전학습 임베딩을 "다운로드해서 첫 레이어에 붙이는 상수"로 보던 습관이 여기서 끝난다.'},
 {h:'양방향 언어모델 (biLM)',
  lead:'정방향과 역방향 LM을 따로 학습해 은닉 상태를 이어 붙인다.',
  d:'앞에서 뒤로 읽는 LM과 뒤에서 앞으로 읽는 LM을 **따로** 학습하고 각 층에서 두 방향의 은닉 상태를 이어 붙인다. 토큰 임베딩과 softmax 가중치는 두 방향이 공유하지만 LSTM 파라미터는 독립적이다. 진짜 양방향 조건부가 아니라 두 단방향의 결합이라는 점이 한계이고, 이 지점을 [BERT](#/p/bert)가 masked LM으로 정면 돌파하게 된다.'},
 {h:'모든 층을 쓴다 — 그리고 섞는 비율은 과제가 정한다',
  lead:'모든 층의 표현을 과제가 학습한 비율로 섞어 쓴다.',
  d:'가장 중요하면서 자주 간과되는 기여다. 최상단 층만 쓰지 않고 **$L+1$ 개 층 전부의 선형 결합**을 쓰되, 결합 가중치 $s_j$ 를 다운스트림 과제와 함께 학습한다. 왜 이게 중요한가 — 층마다 담는 정보가 다르기 때문이다. 논문의 프로빙 실험에서 **1층은 품사 태깅에 97.3%**(2층은 96.8%), **2층은 의미 중의성 해소에 F1 69.0**(1층은 67.4)으로 아래층이 문법, 위층이 의미를 담으며, 과제마다 필요한 비율이 다르니 그 비율 자체를 학습시킨다.'},
 {h:'문자 단위 CNN 입력 — 여기도 OOV가 없다',
  lead:'문자 CNN으로 입력을 만들어 여기서도 OOV가 사라진다.',
  d:'biLM의 입력 층은 단어 룩업이 아니라 **문자 CNN**(2048개 문자 n-gram 필터 + highway 층 + 512차원 투영)이다. 덕분에 학습 때 못 본 단어도 철자만으로 입력 표현이 만들어진다. [fastText](#/p/fasttext)의 서브워드 아이디어가 문맥 모델의 입력단에 들어온 형태다.'},
 {h:'기존 모델을 갈아엎지 않는다',
  lead:'biLM은 고정한 채 결합 가중치만 학습해 기존 모델에 얹는다.',
  d:'이 논문의 실용적 설계는 "붙이기만 하면 된다"는 것이다. 각 과제의 기존 SOTA 모델을 그대로 두고, 그 입력 임베딩 옆에 ELMo 벡터를 concat하기만 한다(일부 과제는 출력단에도 추가). biLM은 동결한 채 결합 가중치 $s_j, \\gamma$ 만 학습한다. 전면 미세조정(fine-tuning)이 아니라 **특징 추출(feature-based)** 전이이며, 몇 달 뒤 [GPT-1](#/p/gpt1)과 [BERT](#/p/bert)가 이 선택을 뒤집는다.'}
],

diagram:{type:'stack', cap:'문장을 한 번 통과시키면 층마다 다른 성격의 표현이 나오고, 과제가 그 배합비를 배운다. 최종 결합식은 $\\text{ELMo}_k=\\gamma\\sum_j s_j h_{k,j}$.',
 layers:[
  {t:'문자CNN+Highway', s:'2048 필터 → 512d', note:'← OOV 없음'},
  {t:'biLSTM 층1(→/←)', s:'4096 unit → 512 투영', note:'← 문법 (POS 97.3%)'},
  {t:'biLSTM 층2(→/←)', s:'4096→512·residual', note:'← 의미 (WSD F1 69.0)'},
  {t:'과제별 층 가중합', s:'s는 softmax 정규화 · 학습 대상', acc:true},
  {t:'기존 모델에 concat', s:'biLM은 동결'}
 ]},

math:[
 {expr:'ELMo_k^task = γ^task · Σ_{j=0..L}  s_j^task · h_{k,j}^LM',
  tex:'\\text{ELMo}_k^{task}=\\gamma^{task}\\sum_{j=0}^{L} s_j^{task}\\, h_{k,j}^{LM}',
  d:'토큰 $k$ 의 표현. $h_{k,j}$ 는 $j$ 번째 층의 (양방향 결합된) 상태, $s^{task}$ 는 softmax로 정규화된 층 가중치, $\\gamma^{task}$ 는 전체 크기를 맞추는 스칼라. 학습되는 것은 이 $L+2$ 개 숫자뿐이다.'},
 {expr:'Σ_k [ log p(t_k | t_1…t_{k−1}; Θ_x, Θ→_LSTM, Θ_s) + log p(t_k | t_{k+1}…t_N; Θ_x, Θ←_LSTM, Θ_s) ]',
  tex:'\\sum_{k=1}^{N}\\Big[\\log p(t_k\\mid t_1,\\dots,t_{k-1};\\Theta_x,\\overrightarrow{\\Theta}_{LSTM},\\Theta_s) + \\log p(t_k\\mid t_{k+1},\\dots,t_N;\\Theta_x,\\overleftarrow{\\Theta}_{LSTM},\\Theta_s)\\Big]',
  d:'biLM 목적함수. 두 방향의 로그우도를 더한다. 토큰 표현 $\\Theta_x$ 와 softmax $\\Theta_s$ 는 공유하고 LSTM은 방향마다 따로 둔다 — 즉 **한 모델이 양방향 문맥을 동시에 조건으로 삼는 것이 아니다**.'}
],

numbers:[
 {k:'SQuAD F1', v:'81.1 → 85.8', d:'베이스라인 → +ELMo. 당시 SOTA 84.4를 넘음'},
 {k:'SRL F1', v:'81.4 → 84.6', d:'의미역 결정. 상대 오차 17.2% 감소'},
 {k:'Coref F1', v:'67.2 → 70.4', d:'상호참조 해결 — 문맥 의존 표현의 효과가 직접 드러나는 과제'},
 {k:'NER F1 (CoNLL 2003)', v:'90.15 → 92.22', d:'SNLI 88.0 → 88.7, SST-5 51.4 → 54.7까지 6개 과제 전부 개선'},
 {k:'biLM 구성', v:'2층 × 4096 unit → 512 투영', d:'1층에서 2층으로 residual 연결, 입력은 문자 CNN 2048 필터'},
 {k:'사전학습', v:'1B Word Benchmark · 10 epoch', d:'약 3천만 문장. 순·역방향 평균 perplexity 39.7 (단방향 CNN-BIG-LSTM은 30.0)'}
],

impact:'단어 표현의 정의를 **테이블 조회에서 모델 forward pass로** 옮겼다. 6개 서로 다른 과제에서, 각 과제의 정교하게 튜닝된 SOTA 모델에 벡터를 concat하기만 해서 전부 갱신했다는 결과는 매우 강한 메시지였다 — 과제별 아키텍처 설계보다 **큰 코퍼스로 사전학습한 표현**이 더 중요하다. 이 메시지가 몇 달 안에 [GPT-1](#/p/gpt1)과 [BERT](#/p/bert)로 이어지며 NLP 전체가 "사전학습 → 전이" 패러다임으로 넘어갔고, ELMo가 실제로 쓰인 기간은 1년이 채 안 됐다. 그럼에도 남긴 것이 둘 있다. **층마다 다른 추상화 수준을 담는다**는 관찰은 이후 BERT 프로빙 연구 전체의 출발점이 되었고, **레이블 없는 언어모델링이 범용 표현을 만든다**는 확인은 오늘날 사전학습의 논리 그 자체다.',

legacy:[
 '**사전학습 패러다임의 개막** — 몇 달 뒤 [GPT-1](#/p/gpt1)이 Transformer 디코더로, [BERT](#/p/bert)가 masked LM으로 같은 아이디어를 이어받아 NLP의 표준 절차를 바꿨다',
 '**feature-based → fine-tuning** — 동결된 표현을 붙이는 방식이 곧 모델 전체를 미세조정하는 방식에 밀려났고, 이후 [adapter](#/p/adapter)·[LoRA](#/p/lora)가 그 중간 지점을 다시 탐색한다',
 '**층별 프로빙 연구** — "아래층은 문법, 위층은 의미"라는 관찰이 [induction head](#/p/induction-heads)·[SAE](#/p/sae)로 이어지는 내부 해석 연구의 초기 근거가 됐다',
 '**진짜 양방향으로** — 두 단방향 LM을 이어 붙인 근사가 [BERT](#/p/bert)의 masked LM으로 대체되며, RNN 기반 문맥 표현은 [Transformer](#/p/transformer) 계열에 완전히 흡수됐다'
],

pitfalls:[
 '**ELMo의 biLM은 진정한 양방향이 아니다.** 순방향 LM과 역방향 LM을 독립적으로 학습해 상태를 concat한 것이라, 어떤 시점에도 한 모델이 좌우 문맥을 **동시에** 조건으로 삼지 않는다. [BERT](#/p/bert) 논문이 이 점을 명시적으로 비판하며 masked LM을 도입했다.',
 '**최상단 층만 쓰면 논문 결과가 재현되지 않는다.** 기여의 상당 부분이 층별 가중합에 있다. 마지막 층 하나만 뽑아 쓰면 과제에 따라 이득이 크게 줄어든다 — 실제로 문법 위주 과제에서는 1층이 더 유용하다.',
 '**추론 비용이 정적 임베딩과 차원이 다르다.** 룩업 한 번이면 끝나던 것이 문장마다 2층 4096-unit LSTM을 양방향으로 돌리는 일이 됐고, LSTM은 토큰 단위로 순차 실행이라 병렬화도 안 된다. 표현 품질을 계산량으로 산 것이며, 이 비용 구조가 곧 [Transformer](#/p/transformer) 기반 사전학습으로 넘어가는 실용적 동기이기도 했다.'
],

figures:[
 {f:'fig2-layer-weights.png',
  cap:'각 열이 하나의 다운스트림 과제, 각 칸의 색이 그 과제가 그 층에 준 정규화 가중치다(어두울수록 0에 가깝고 점무늬는 2/3 이상). 왼쪽(input layer) 블록에서 Coref·SQuAD는 LSTM 1(하위 문법층)에 점무늬로 몰려 있고, 오른쪽(output layer) 블록에서 SNLI는 Token(하위 어휘층)에 크게 의존한다. 과제마다 선호하는 층이 다르다는 것이 한눈에 보인다.',
  src:'원문 Figure 2, p.8'}
],

quotes:[
 {t:'Unlike previous approaches for learning contextualized word vectors, ELMo representations are deep, in the sense that they are a function of all of the internal layers of the biLM.',
  src:'Abstract–Introduction, p.1'}
],

links:[
 {t:'arXiv 1802.05365 — Deep Contextualized Word Representations', u:'https://arxiv.org/abs/1802.05365'},
 {t:'NAACL 2018 (ACL Anthology)', u:'https://aclanthology.org/N18-1202/'},
 {t:'AllenNLP — ELMo 사전학습 모델과 사용법', u:'https://allenai.org/allennlp/software/elmo'}
]
});
