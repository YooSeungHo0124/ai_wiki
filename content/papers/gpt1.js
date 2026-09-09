WIKI.paper({
slug:'gpt1',
venue:'OpenAI 기술 보고서 (2018, 미출판)',
authors:'Radford, Narasimhan, Salimans, Sutskever (OpenAI)',

tldr:'[Transformer](#/p/transformer)의 **decoder만** 떼어내 대량의 책 텍스트로 다음 단어 예측을 시킨 뒤, 그 가중치를 그대로 각 태스크에 미세조정하면 태스크별 특수 아키텍처를 이긴다는 것을 보였다. **비지도 사전학습 → 지도 미세조정**이라는 2단계 레시피가 여기서 확립된다.',

context:'2018년 초 NLP의 표준은 태스크마다 다른 모델을 처음부터 짜는 것이었다. 사전학습의 혜택은 [word2vec](#/p/word2vec)·[GloVe](#/p/glove) 같은 **단어 임베딩 한 층**에만 머물렀고, 그 위에 얹는 LSTM·attention 구조는 데이터셋마다 새로 설계·학습해야 했다. [ELMo](#/p/elmo)가 문맥 의존 표현을 제공하며 한 걸음 나아갔지만, 여전히 태스크 모델에 **feature로 끼워 넣는** 방식이라 아키텍처 설계 부담은 그대로였다. 한편 레이블이 붙은 NLP 데이터는 희소하고 비싼 반면, 레이블 없는 텍스트는 사실상 무한했다. 질문은 이것이다 — **하나의 범용 모델을 텍스트만으로 미리 학습시키고, 태스크에는 최소한의 변경만 가할 수 없는가?**',

ideas:[
 {h:'2단계: 언어모델링으로 사전학습, 그 다음 미세조정',
  lead:'하나의 모델을 언어모델링으로 사전학습한 뒤 그대로 이어서 미세조정한다.',
  d:'1단계는 순수 자기회귀 언어모델링이다. BooksCorpus의 긴 문장들로 $P(u_i \\mid u_{i-k} \\ldots u_{i-1})$ 을 최대화한다. 2단계는 그 **동일한 가중치**를 초기값으로 삼아 분류·함의·유사도 태스크에 지도 학습을 돌린다. 태스크마다 모델을 새로 만드는 대신 **하나의 모델을 이어서 계속 학습**한다는 이 발상이 이후 모든 사전학습 모델의 골격이 된다.'},
 {h:'왜 decoder-only인가',
  lead:'cross-attention을 없애고 masked self-attention decoder만 12층 쌓는다.',
  d:'원 [Transformer](#/p/transformer)는 encoder–decoder였지만 언어모델링에는 입력 시퀀스가 따로 없다. 그래서 **decoder 스택만** 남기고, cross-attention을 제거한 채 masked self-attention(미래 토큰 차단)만 12층 쌓았다. 이 선택 덕분에 모델은 오직 "다음 토큰"이라는 단일 목적함수로 학습되며, 나중에 [GPT-2](#/p/gpt2)·[GPT-3](#/p/gpt3)로 이어지는 계보 전체가 이 구조를 그대로 물려받는다.'},
 {h:'아키텍처가 아니라 입력을 바꾼다 (traversal-style transformation)',
  lead:'태스크를 하나의 토큰 시퀀스로 직렬화해 아키텍처 변경을 없앤다.',
  d:'태스크마다 모델을 고치면 사전학습 가중치를 못 쓴다. 대신 **입력을 하나의 토큰 시퀀스로 직렬화**한다. 함의 태스크는 `<s> 전제 $ 가설 <e>`, 유사도는 두 문장의 순서를 바꾼 두 시퀀스를 각각 통과시켜 더하고, 객관식 QA는 보기 개수만큼 `문맥 $ 보기` 시퀀스를 만들어 softmax를 씌운다. 추가되는 파라미터는 **마지막 선형 분류층과 구분자 임베딩뿐**이다.'},
 {h:'미세조정 때도 언어모델링 손실을 함께 쓴다',
  lead:'미세조정 손실에 언어모델링 손실을 더해 사전학습 표현 붕괴를 막는다.',
  d:'지도 손실 $L_2$ 만 쓰면 사전학습된 표현이 빠르게 망가진다. 논문은 보조 목적함수로 언어모델링 손실을 가중치 $\\lambda$ 로 더한 $L_3 = L_2 + \\lambda L_1$ 를 쓴다. 일반화가 좋아지고 수렴도 빨라지며, 특히 데이터셋이 클수록 효과가 컸다. 오늘날 "정규화로서의 사전학습 목적함수"라는 아이디어의 원형이다.'},
 {h:'사전학습만으로 이미 태스크를 어느 정도 안다',
  lead:'미세조정 없이도 사전학습이 진행될수록 zero-shot 성능이 오른다.',
  d:'논문은 미세조정 없이 사전학습 모델의 표현만으로 태스크를 푸는 zero-shot 실험을 하고, **사전학습 스텝이 늘수록 zero-shot 성능이 꾸준히 오른다**는 것을 관찰했다. 이 관찰이 곧장 다음 논문의 논지가 된다 — 미세조정 자체를 없애버리자는 [GPT-2](#/p/gpt2).'}
],

diagram:{type:'compare', cap:'ELMo식 "임베딩 제공자" vs GPT식 "모델 전체 이전". 태스크 적응의 무게중심이 아키텍처에서 가중치로 옮겨간다.',
 left:{t:'기존: 태스크마다 새 모델', items:[
  '사전학습은 단어/문맥 임베딩까지만',
  '그 위 LSTM·attention 구조는 태스크별 설계',
  '데이터셋마다 하이퍼파라미터 재탐색',
  '레이블 데이터가 적으면 그대로 성능 하락']},
 right:{t:'GPT: 한 모델을 이어서 학습', items:[
  '12층 decoder를 LM으로 사전학습',
  '태스크는 입력 직렬화로 흡수',
  '추가 파라미터 = 선형층 1개 + 구분자',
  '12개 데이터셋 중 9개에서 SOTA']}},

math:[
 {expr:'L1(U) = Σ_i log P(u_i | u_{i-k}, …, u_{i-1}; Θ)',
  tex:'\\mathcal{L}_1(\\mathcal{U})=\\sum_i \\log P(u_i \\mid u_{i-k},\\dots,u_{i-1};\\Theta)',
  d:'1단계 목적함수. 문맥 창 $k$ 안의 이전 토큰들로 다음 토큰의 로그 확률을 최대화한다. 레이블이 전혀 필요 없다.'},
 {expr:'L3(C) = L2(C) + λ · L1(C)',
  tex:'\\mathcal{L}_3(\\mathcal{C})=\\mathcal{L}_2(\\mathcal{C})+\\lambda\\cdot\\mathcal{L}_1(\\mathcal{C})',
  d:'2단계 목적함수. 지도 손실 $L_2$ 에 언어모델링 손실을 $\\lambda$ 배로 더한다. 논문 실험에서 $\\lambda = 0.5$.'}
],

numbers:[
 {k:'모델 크기', v:'12층 · d 768 · head 12', d:'FFN 내부 차원 3072, 문맥 길이 512 토큰'},
 {k:'사전학습 데이터', v:'BooksCorpus · 약 7,000권', d:'출간되지 않은 책. **긴 연속 문맥**을 담고 있어 장거리 의존 학습에 유리하다고 논문이 명시'},
 {k:'GLUE 점수', v:'72.8', d:'직전 최고 68.9'},
 {k:'MultiNLI 정확도', v:'82.1%', d:'문장 함의. 기존 최고 대비 **+1.5%p**'},
 {k:'Story Cloze', v:'86.5%', d:'상식 추론. **+8.9%p** — 12개 태스크 중 가장 큰 향상폭'},
 {k:'RACE', v:'59.0%', d:'독해. **+5.7%p**. 12개 데이터셋 중 9개에서 SOTA'}
],

impact:'"사전학습 가중치를 통째로 이전한다"는 방식이 NLP에서 처음으로 광범위하게 통한다는 증거였다. 결과적으로 연구의 초점이 **태스크별 아키텍처 설계**에서 **사전학습 코퍼스·목적함수·규모**로 이동했다. 다만 논문이 당시 받은 주목은 크지 않았고, 넉 달 뒤 같은 레시피를 양방향으로 바꾼 [BERT](#/p/bert)가 훨씬 큰 반향을 일으켰다. 그럼에도 decoder-only + 순수 언어모델링이라는 이 논문의 선택은 스케일을 키웠을 때 생성·[in-context learning](#/p/gpt3)까지 자연스럽게 얻는 유일한 경로였고, 결국 현대 LLM의 표준이 되었다.',

legacy:[
 '**미세조정 제거로 가는 길** — 사전학습만으로도 태스크가 풀린다는 관찰이 [GPT-2](#/p/gpt2)의 zero-shot, [GPT-3](#/p/gpt3)의 few-shot으로 이어짐',
 '**양방향 분기** — 같은 2단계 레시피에 encoder + 마스킹을 결합한 [BERT](#/p/bert)가 이해 태스크 계열을 가져감',
 '**입력 직렬화의 일반화** — "태스크를 텍스트로 바꾼다"는 발상이 [T5](#/p/t5)의 text-to-text와 프롬프트 패러다임으로 확장',
 '**PEFT의 전제** — 전체 미세조정이 표준이 되면서, 그 비용을 줄이려는 [Adapter](#/p/adapter)·[LoRA](#/p/lora) 계열이 파생'
],

pitfalls:[
 '**"GPT-1은 프롬프트로 쓰는 모델"이 아니다.** 이 논문의 사용법은 어디까지나 **태스크별 미세조정**이며, 프롬프팅으로 태스크를 지시하는 방식은 [GPT-2](#/p/gpt2)부터다. 이름이 같다고 사용 방식을 소급 적용하면 안 된다.',
 '**"decoder-only가 처음부터 우월해서 선택됐다"는 사후 해석이다.** 2018~2019년 벤치마크에서 이해 태스크는 [BERT](#/p/bert)·[RoBERTa](#/p/roberta) 쪽이 명확히 앞섰다. decoder-only의 우위는 규모가 커지고 생성·범용성이 평가 기준에 들어온 뒤에야 드러났다.',
 '**BooksCorpus는 오늘날 그대로 재현할 수 없다.** 저작권 문제로 원본 배포가 중단됐고, 유통되는 사본들은 구성이 서로 다르다. 이 논문 수치를 정확히 재현하려는 시도는 데이터 단계에서 막힌다.'
],

figures:[
 {f:'fig1-decoder-tasks.png',
  cap:'왼쪽은 사전학습에 쓰는 decoder-only Transformer 블록(Masked Multi Self Attention → Layer Norm → Feed Forward → Layer Norm, 12번 반복). 오른쪽은 같은 Transformer를 4가지 다운스트림 과제에 미세조정할 때 입력을 어떻게 직렬화하는지 — 과제마다 [Start]/[Delim]/[Extract] 같은 특수 토큰으로 문장(들)을 하나의 토큰 시퀀스로 이어붙이고, 그 뒤에 태스크별 Linear 층 하나만 얹는다. 즉 아키텍처는 그대로 두고 **입력 형식만** 바꿔 다양한 과제에 대응하는 것이 이 그림의 핵심.',
  src:'원문 Figure 1, p.4'}
],

quotes:[
 {t:'We demonstrate that large gains on these tasks can be realized by generative pre-training of a language model on a diverse corpus of unlabeled text, followed by discriminative fine-tuning on each specific task.',
  src:'Abstract, p.1'}
],

links:[
 {t:'Improving Language Understanding by Generative Pre-Training (원문 PDF)', u:'https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf'},
 {t:'OpenAI Blog — Improving Language Understanding with Unsupervised Learning', u:'https://openai.com/index/language-unsupervised/'},
 {t:'The Illustrated GPT-2 (Jay Alammar) — decoder-only 구조 시각화', u:'https://jalammar.github.io/illustrated-gpt2/'}
]
});
