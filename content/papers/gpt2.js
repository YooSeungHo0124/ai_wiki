WIKI.paper({
slug:'gpt2',
venue:'OpenAI 기술 보고서 (2019, 미출판)',
authors:'Radford, Wu, Child, Luan, Amodei, Sutskever (OpenAI)',

tldr:'[GPT-1](#/p/gpt1)의 decoder-only 구조를 거의 그대로 두고 **데이터와 모델을 각각 10배 이상 키우자**, 미세조정 없이 프롬프트만으로 요약·번역·독해가 되기 시작했다. "언어모델은 사실 멀티태스크 학습기다"라는 주장과, 오용 우려로 가중치를 단계적으로 공개한 결정으로 함께 기억된다.',

context:'[BERT](#/p/bert) 이후 NLP의 표준 흐름은 "사전학습하고 태스크마다 미세조정한다"였다. 그러나 미세조정에는 태스크마다 수천~수만 개의 레이블과 별도 체크포인트가 필요하다. [GPT-1](#/p/gpt1) 논문은 이미 사전학습 스텝이 늘수록 zero-shot 성능이 오른다는 것을 관찰했었다. 여기서 나온 가설은 이렇다 — 웹 텍스트에는 이미 "질문: … 답: …", "요약하면 …", "프랑스어로 …" 같은 **태스크 시연이 자연스럽게 섞여 있다**. 그렇다면 충분히 좋은 언어모델은 별도 지도 없이도 $P(\\text{출력} \\mid \\text{입력}, \\text{태스크})$ 를 이미 학습했을 것이다. 남은 문제는 **데이터 품질과 규모**뿐이다.',

ideas:[
 {h:'태스크 조건화를 아키텍처가 아니라 텍스트로 준다',
  lead:'TL;DR 같은 텍스트 프롬프트만으로 태스크를 지정한다.',
  d:'기존 멀티태스크 학습은 태스크마다 head를 붙였다. 여기서는 태스크를 **입력 텍스트의 일부**로 넣는다. 요약은 문서 끝에 `TL;DR:` 을 붙이고, 번역은 `영어 문장 = 프랑스어 문장` 쌍을 몇 개 보인 뒤 이어쓰게 한다. 모델 구조도, 손실 함수도, 파라미터도 바뀌지 않고 오직 프롬프트만 바뀌는 이 방식이 오늘날 프롬프팅의 직접적 기원이다.'},
 {h:'WebText: 사람의 큐레이션을 데이터 필터로 쓴다',
  lead:'Reddit 추천수를 대리 지표로 써서 고품질 웹 문서만 고른다.',
  d:'Common Crawl은 양은 많지만 품질이 들쭉날쭉하다. 대신 Reddit에서 **karma 3 이상**을 받은 게시물의 외부 링크만 긁었다 — "사람이 흥미롭거나 유용하다고 판단한 문서"라는 대리 지표다. 4,500만 링크에서 중복과 2017년 12월 이후 문서를 제거해 **800만 문서 · 40GB**를 얻었다. 평가 오염을 줄이려 Wikipedia 문서는 통째로 뺐다.'},
 {h:'byte-level BPE: 어떤 문자열도 UNK 없이 처리한다',
  lead:'바이트 단위 BPE로 어떤 문자열도 UNK 없이 처리한다.',
  d:'유니코드 단위 BPE는 기본 어휘가 13만 개를 넘지만, **바이트 단위**로 하면 256개면 충분하다. 다만 순수 바이트 BPE는 `dog.`·`dog!`·`dog?` 처럼 같은 단어의 변형을 낭비하므로, 문자 카테고리를 넘는 병합을 막았다. 결과 어휘 50,257개로 **모든 입력을 손실 없이** 표현한다 — 전처리·토큰화·UNK 처리가 사라져 zero-shot 평가가 공정해진다.'},
 {h:'구조 변경은 최소한: pre-LN과 스케일된 초기화',
  lead:'LayerNorm을 입력 쪽으로 옮기고 잔차 층 가중치를 스케일링한다.',
  d:'[Transformer](#/p/transformer) 블록에서 LayerNorm을 각 서브블록의 **입력 쪽으로 옮기고**(pre-LN) 마지막 self-attention 블록 뒤에 LayerNorm을 하나 더 뒀다. 잔차 경로에 깊이만큼 값이 누적되는 문제를 완화하려고 잔차 층 가중치를 $1/\\sqrt{N}$ 배로 초기화했다($N$ = 잔차 층 수). 48층을 안정적으로 학습시킨 것이 이 두 가지다. 논문 그림보다 이 디테일이 현대 구현에 더 오래 남았다.'},
 {h:'모든 크기에서 아직 과소적합이었다',
  lead:'모델을 키울수록 성능이 꺾이지 않고 계속 좋아진다.',
  d:'117M부터 1542M까지 네 크기를 학습했는데, **모든 모델이 WebText에 여전히 underfit**이었고 크기를 키울 때마다 성능이 로그 선형으로 계속 올랐다. 포화 지점이 안 보인다는 이 관찰이 곧 [스케일링 법칙](#/p/scaling-laws)의 체계적 측정과 [GPT-3](#/p/gpt3)로 직결된다.'}
],

diagram:{type:'split', cap:'하나의 가중치, 하나의 목적함수. 태스크는 프롬프트 문자열로만 구분된다.',
 from:{t:'GPT-2 1.5B', s:'미세조정 없음 · 다음 토큰 예측만'},
 branches:[
  {t:'요약', s:'문서 + "TL;DR:"'},
  {t:'번역', s:'"eng = fra" 예시 몇 개'},
  {t:'독해 QA', s:'문서 + Q:/A: 대화'},
  {t:'언어모델링', s:'그대로 perplexity'}
 ],
 join:'8개 LM 벤치마크 중 7개에서 zero-shot SOTA'},

math:[
 {expr:'P(output | input, task)  ←  P(x) = Π P(s_n | s_1 … s_{n-1})',
  tex:'\\begin{aligned} P(\\text{output}\\mid \\text{input},\\text{task}) &\\;\\Leftarrow\\; P(x)\\\\ P(x) &= \\prod_n P(s_n \\mid s_1,\\dots,s_{n-1})\\end{aligned}',
  d:'논문의 핵심 주장을 한 줄로 압축하면 이렇다. 태스크 조건부 분포를 **따로 학습하는 대신**, 태스크 서술과 예시가 이미 포함된 자연어 시퀀스의 결합 분포를 학습하면 조건부는 그 안에 부산물로 들어 있다는 것이다.'}
],

numbers:[
 {k:'모델 크기 4종', v:'117M / 345M / 762M / 1542M', d:'각각 12·24·36·48층, d 768/1024/1280/1600. 가장 작은 것이 [GPT-1](#/p/gpt1), 두 번째가 [BERT-large](#/p/bert)와 같은 규모'},
 {k:'WebText', v:'800만 문서 · 40GB', d:'Reddit karma 3+ 외부 링크 4,500만 개에서 정제'},
 {k:'어휘 · 문맥', v:'50,257 토큰 · 1024', d:'byte-level BPE. 문맥 길이는 GPT-1의 512에서 두 배, 배치 512'},
 {k:'LAMBADA', v:'PPL 8.63 · 정확도 63.24%', d:'직전 SOTA는 PPL **99.8** · 정확도 59.23%. zero-shot으로 낸 값'},
 {k:'WikiText-103 PPL · CBT-NE', v:'17.48 · 89.05%', d:'각각 SOTA 18.3 · 82.3%. 해당 데이터로 학습한 적 없이 달성'},
 {k:'1B Word Benchmark PPL', v:'42.16', d:'8개 중 **유일하게 실패한** 데이터셋(SOTA 21.8). 문장 단위 셔플·전처리가 심해 WebText 분포와 크게 다르다'}
],

impact:'세 가지가 남았다. **(1) 프롬프팅의 발명** — 태스크를 코드가 아니라 문자열로 지정한다는 인터페이스가 여기서 실용화됐고, 지금 우리가 LLM을 쓰는 방식 그 자체다. **(2) 스케일이 답이라는 확신** — 구조를 거의 바꾸지 않고 데이터·크기만 키워 질적으로 다른 능력을 얻었다는 결과가 [스케일링 법칙](#/p/scaling-laws)과 [GPT-3](#/p/gpt3)로 이어졌다. **(3) 공개 규범 논쟁** — OpenAI는 2019년 2월 논문 발표 시 1.5B 가중치를 보류하고 작은 모델부터 순차 공개해 11월에야 전체를 풀었다. "위험할 수 있으니 안 낸다"는 선례가 이때 만들어졌고, 과장이라는 비판과 함께 이후 모든 프론티어 모델 릴리스 정책의 참조점이 되었다.',

legacy:[
 '**few-shot으로의 확장** — 프롬프트 안에 예시를 넣는 방식이 [GPT-3](#/p/gpt3)에서 in-context learning으로 체계화',
 '**스케일 측정** — "아직 과소적합"이라는 관찰이 [스케일링 법칙](#/p/scaling-laws)·[Chinchilla](#/p/chinchilla)의 정량화로 이어짐',
 '**작은 실험대** — 124M/355M 체크포인트가 [Prefix-Tuning](#/p/prefix-tuning)·[Grokking](#/p/grokking) 등 수많은 후속 연구의 기본 실험 모델이 됨',
 '**단계적 공개** — 위험 평가 후 순차 릴리스라는 관행이 [GPT-4](#/p/gpt4)·[Llama 2](#/p/llama2) 등 이후 모델 공개 방식의 기준선이 됨'
],

pitfalls:[
 '**zero-shot 수치를 미세조정 모델과 직접 비교하면 안 된다.** 표의 상대 비교 대상은 대부분 해당 데이터셋으로 학습된 모델이며, 그럼에도 이겼다는 점이 논지다. 절대 성능만 보면 요약·번역 품질은 당시 전용 시스템에 한참 못 미쳤다.',
 '**데이터 오염이 완전히 배제되지는 않았다.** 논문 자체가 부록에서 WebText와 벤치마크 테스트셋의 8-gram 중복을 측정해 평균 3.2%(1~6%)라고 보고했다. 오염 규모가 결과를 뒤집을 정도는 아니라고 결론지었지만, 이후 LLM 평가에서 오염 검증이 필수가 된 출발점이다.',
 '**"GPT-2 = 117M"이라는 표기가 흔하지만 논문의 GPT-2는 1542M 모델이다.** 나머지 셋은 비교용 크기이고, HuggingFace의 `gpt2` 기본 체크포인트는 그 중 가장 작은 것(124M로 재보고됨)이다. 벤치마크 수치를 인용할 때 크기를 반드시 명시해야 한다.'
],

figures:[
 {f:'fig1-zeroshot-scaling.png',
  cap:'x축은 4개 패널 모두 모델 파라미터 수(117M~1542M, log 아님 등간격 표기), y축은 각 과제 지표(F1·BLEU·ROUGE·Accuracy). 점선은 그 과제의 기존 지도학습 기준선(Human, PGNet, Seq2seq 등)이고, 파란 선은 미세조정 없이 프롬프트만 준 GPT-2의 zero-shot 성능이다. 네 과제 모두 모델이 커질수록 zero-shot 점수가 단조 증가한다는 것이 이 그림의 핵심 — 아직 기존 기준선을 다 넘지는 못하지만(왼쪽 Reading Comprehension 제외) 추세선이 꺾이지 않는다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We demonstrate that language models can perform down-stream tasks in a zero-shot setting – without any parameter or architecture modification.',
  src:'Introduction, p.2'}
],

links:[
 {t:'Language Models are Unsupervised Multitask Learners (원문 PDF)', u:'https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf'},
 {t:'OpenAI — GPT-2: 1.5B Release (단계적 공개 결정 설명)', u:'https://openai.com/index/gpt-2-1-5b-release/'},
 {t:'openai/gpt-2 (코드와 체크포인트)', u:'https://github.com/openai/gpt-2'}
]
});
