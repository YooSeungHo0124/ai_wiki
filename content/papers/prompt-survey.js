WIKI.paper({
slug:'prompt-survey',
venue:'arXiv 2021 (ACM Computing Surveys 게재)',
authors:'Liu, Yuan, Fu, Jiang, Hayashi, Neubig (Carnegie Mellon University)',
arxiv:'2107.13586',

tldr:'프롬프트 기반 학습(prompt-based learning)이라는 **두 번째 패러다임 전환**을 체계화한 서베이. "사전학습 → 파인튜닝" 대신 "사전학습 → 프롬프트로 변형 → 예측"이라는 이름과 통일된 표기법을 붙이고, 프롬프트 설계·답 설계·튜닝 전략을 각각 독립된 축으로 분해했다.',

context:'2017~2019년 NLP는 첫 번째 전환("pre-train, fine-tune")을 겪었다 — [BERT](#/p/bert)류의 사전학습 모델에 과제별 출력층을 얹고 전체를 파인튜닝하는 방식이 표준이 됐다. 그런데 [GPT-3](#/p/gpt3) 이후로는 파인튜닝 없이 **입력을 프롬프트 형태로 바꿔주는 것만으로** LM이 과제를 풀게 만드는 사례가 쏟아졌다. 문제는 이 흐름을 부르는 용어도, 비교할 공통 틀도 없었다는 점이다 — cloze test, priming, in-context learning 같은 이름이 논문마다 따로 쓰였다. 이 서베이는 이들을 "prompt-based learning"이라는 하나의 우산 아래 통일된 수식과 분류 체계로 묶는다.',

ideas:[
 {h:'프롬프트의 3단계: 추가 → 답 탐색 → 답 매핑',
  lead:'입력 $x$ 를 프롬프트 $x\\prime$ 로 바꾸고, 빈칸을 채운 뒤, 그 답을 최종 출력으로 옮긴다.',
  d:'모든 프롬프트 방법을 (1) 템플릿에 입력을 끼워 빈칸 [Z]를 남긴 프롬프트 $x\\prime=f_{prompt}(x)$ 를 만드는 **prompt addition**, (2) 허용된 답 집합 $\\mathcal{Z}$ 안에서 LM이 채울 값 $\\hat z$ 를 찾는 **answer search**, (3) $\\hat z$ 를 실제 과제의 출력 $\\hat y$ 로 바꾸는 **answer mapping** 세 단계로 분해한다. 이 표기법이 서베이 전체의 공통 언어가 된다.'},
 {h:'프롬프트 형태: cloze vs prefix',
  lead:'빈칸이 문장 중간이면 cloze, 문장 끝에서 이어 쓰면 prefix 프롬프트다.',
  d:'[BERT](#/p/bert)류 masked LM은 빈칸이 문장 중간에 있는 cloze 프롬프트와 잘 맞고, [GPT](#/p/gpt1) 계열 자기회귀 LM이나 생성 과제는 입력 뒤에 답을 이어 붙이는 prefix 프롬프트와 잘 맞는다. 이 구분이 이후 모든 프롬프트 엔지니어링 논의의 출발점이다 — 어떤 사전학습 목적함수를 쓴 모델인지가 어떤 프롬프트 형태를 쓸지를 결정한다.'},
 {h:'답 설계: 모양(shape)과 탐색 방법을 분리',
  lead:'답이 토큰·구간·문장 중 무엇인지, 그 답 공간을 사람이 짜는지 자동으로 찾는지를 나눠 본다.',
  d:'답의 모양은 토큰(분류에 흔함) · 짧은 구간(cloze와 함께) · 문장(prefix와 함께, 생성 과제)으로 나뉜다. 답 공간을 만드는 방법도 사람이 직접 정하는 수작업 설계와, discrete/continuous 자동 탐색으로 나눠 정리한다. 프롬프트 설계와 답 설계를 **독립된 두 축**으로 떼어놓은 것이 이 서베이의 핵심 기여 중 하나다.'},
 {h:'튜닝 전략: LM과 프롬프트 파라미터를 각각 얼리는가/학습하는가',
  lead:'다섯 가지 전략을 "LM 파라미터를 학습하는가"와 "프롬프트에 학습 가능한 파라미터가 있는가"로 가른다.',
  d:'Promptless Fine-tuning([BERT](#/p/bert) 식 전체 파인튜닝, 프롬프트 없음), Tuning-free Prompting([GPT-3](#/p/gpt3) 식 in-context learning, 아무것도 안 학습), Fixed-LM Prompt Tuning([Prompt Tuning](#/p/prompt-tuning)처럼 LM은 얼리고 프롬프트만 학습), Fixed-prompt LM Tuning(프롬프트는 고정, LM만 파인튜닝), Prompt+LM Fine-tuning(둘 다 학습) 다섯 가지로 조직화한다.'}
],

diagram:{type:'split', cap:'프롬프트 기반 학습을 조직하는 세 축. 이 위키 관점에서 가장 유용한 절단면만 뽑았다(원문 Figure 1은 더 세분화됨).',
 from:{t:'프롬프트 방법'},
 branches:[
  {t:'프롬프트 형태', s:'cloze vs prefix'},
  {t:'답 매핑', s:'토큰/구간/문장 · 설계법', acc:true},
  {t:'학습 여부', s:'LM·프롬프트 각각 tuned?'}
 ]},

math:[
 {expr:"z_hat = argmax_{z in Z} P(f_fill(x', z); θ)",
  tex:'\\hat z=\\operatorname*{search}_{z\\in\\mathcal{Z}}P\\bigl(f_{\\text{fill}}(x\\prime,z);\\theta\\bigr)',
  d:'answer search 단계의 정의. $\\mathcal{Z}$ 는 허용된 답 후보 집합(생성 과제면 언어 전체, 분류면 소수의 단어)이고, $f_{fill}$ 은 프롬프트의 빈칸 [Z]를 후보 $z$ 로 채우는 함수다. search는 argmax일 수도, 샘플링일 수도 있다.'}
],

numbers:[],

impact:'프롬프트라는 흩어진 현상들에 공통 수식과 분류 체계를 줘서, 이후 연구자들이 "이건 fixed-prompt LM tuning이다" 식으로 자기 방법을 바로 위치시킬 수 있게 만들었다. [Prompt Tuning](#/p/prompt-tuning)·[Prefix-Tuning](#/p/prefix-tuning) 같은 PEFT 계열과 in-context learning 계열을 같은 좌표계(LM 튜닝 여부 × 프롬프트 파라미터 존재·튜닝 여부) 위에 놓았다는 점이 이 위키의 여러 논문을 잇는 데도 유용하다.',

legacy:[
 '**PEFT 계열의 좌표계로 자리잡음** — Fixed-LM Prompt Tuning 범주가 [Prompt Tuning](#/p/prompt-tuning)·[Prefix-Tuning](#/p/prefix-tuning) 등을 하나로 묶어 이후 [PEFT](#/p/prompt-tuning) 연구의 분류 기준으로 자주 인용됨',
 '**in-context learning 용어 정착** — Tuning-free Prompting + 프롬프트에 정답 예시를 채운 형태를 in-context learning으로 명명한 것이 [GPT-3](#/p/gpt3) 이후 표준 용어로 굳어짐',
 '**지시학습으로의 자연스러운 연결** — 이 서베이의 "프롬프트 = 과제 명세"라는 틀은 [natural-instructions](#/p/natural-instructions)·[T0](#/p/t0)·[FLAN](#/p/flan)이 자연어 지시문 자체를 학습 신호로 쓰는 흐름과 문제의식을 공유한다',
 '**답 설계(answer engineering)의 독립적 중요성 환기** — 프롬프트 설계에 가려져 있던 답 공간 설계를 별도 축으로 세운 것이, 이후 분류·추출 과제의 프롬프트 연구에서 답 매핑을 명시적으로 다루게 만듦'
],

pitfalls:[
 '**이 서베이가 어떤 방법을 "발명"한 것은 아니다.** 체계화와 통일 표기가 기여이며, cloze prompting·in-context learning·prefix tuning 등 개별 기법의 원저자는 각각 다르다(본문 인용 참고).',
 '**2021년 7월 시점의 지형도다.** [InstructGPT](#/p/instructgpt)·[FLAN](#/p/flan) 계열의 "자연어 지시문 학습"이 본격화되기 전이라, 이후 지시학습 흐름은 이 분류 체계의 다섯 튜닝 전략 중 어디에도 깔끔히 들어맞지 않을 수 있다(대개 Prompt+LM Fine-tuning에 가깝지만 프롬프트가 고정 파라미터가 아니라 자연어 지시문이라는 점이 다르다).',
 '**"프롬프트가 있으면 다 zero-shot"이 아니다.** 저자들은 프롬프트 검증에 이미 라벨 데이터를 썼다면 엄밀히는 진짜 zero-shot이 아니라고 명시적으로 경고한다(Perez et al. 2021 인용).'
],

figures:[
 {f:'fig1-typology.png',
  cap:'원문 전체 분류 체계. 왼쪽부터 사전학습 모델 종류 → 프롬프트 엔지니어링(형태·수작업/자동) → 답 엔지니어링(형태·수작업/자동) → 멀티프롬프트 학습 → 프롬프트 기반 학습 전략(파라미터 업데이트 방식·학습 샘플 크기). 이 노트의 ideas는 이 중 프롬프트 형태·답 매핑·학습 전략(맨 아래 분홍 박스) 세 갈래만 뽑아 정리했다.',
  src:'원문 Figure 1, p.7'}
],

quotes:[
 {t:'We are in the middle of a second sea change, in which the "pre-train, fine-tune" procedure is replaced by one in which we dub "pre-train, prompt, and predict".',
  src:'Section 1, p.3'}
],

links:[
 {t:'arXiv 2107.13586 — Pre-train, Prompt, and Predict', u:'https://arxiv.org/abs/2107.13586'},
 {t:'NLPedia–Pretrain (동반 웹사이트)', u:'http://pretrain.nlpedia.ai/'}
]
});
