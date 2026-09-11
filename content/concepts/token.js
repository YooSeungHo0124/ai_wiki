WIKI.concept({
slug:'token',

tldr:'[토크나이저](#/c/tokenizer)가 텍스트를 쪼갠 최소 단위이자, 모델이 실제로 입력·출력하는 정수 ID.',

why:'API 요금, [컨텍스트 윈도우](#/c/context-window) 사용량, 모델의 생성 단위 — 이 세 가지가 전부 "토큰" 기준으로 매겨진다. 토큰이 단어나 글자와 다르다는 것을 모르면 프롬프트 길이도, 비용도, "왜 숫자 계산을 이상하게 하지"도 설명이 안 된다.',

sections:[
 {h:'토큰 ≠ 단어 ≠ 글자', d:'"unbelievable" 은 영어 사전 기준 한 단어지만 BPE 토크나이저에서는 흔히 "un"+"believ"+"able" 3토큰으로 갈린다. 반대로 "the", "is", "a" 처럼 흔한 단어는 통째로 1토큰이다. 숫자는 특히 불규칙해서 "12345" 가 통째로 1토큰이 되기도, "123"+"45" 로 갈리기도 한다 — 이 때문에 LLM 이 자릿수가 큰 산수를 실수하는 원인 중 하나로 꼽힌다.'},
 {h:'토큰 ID 와 어휘 크기', d:'토크나이저는 학습 시 정해진 유한한 어휘집(vocabulary)을 갖고, 각 서브워드 조각은 그 안의 정수 인덱스(토큰 ID)에 대응한다. 어휘 크기는 모델마다 다르다 — GPT-2 는 약 50,257개, GPT-4 계열(cl100k_base)은 약 100,000개, GPT-4o(o200k_base)는 약 200,000개다. 모델의 입력층은 이 ID 를 [임베딩](#/c/embedding) 테이블에서 벡터로 찾아오는 룩업이고, 출력층은 반대로 벡터를 다시 어휘 크기만큼의 logit 벡터로 사영한 뒤 [샘플링](#/c/sampling)해서 다음 토큰 ID 를 고른다.'},
 {h:'특수 토큰', d:'일반 텍스트 조각 외에 모델 동작을 제어하는 예약 토큰이 있다. BOS(beginning-of-sequence)·EOS(end-of-sequence)는 시퀀스의 시작·끝을 표시하고, EOS 가 생성되면 디코딩 루프가 멈춘다. PAD 는 배치 안에서 길이가 다른 시퀀스를 맞추려고 채우는 더미 토큰이다. 챗봇형 모델은 여기에 역할 구분 토큰(예: 시스템/사용자/어시스턴트 턴 경계)까지 추가로 둔다. 이런 특수 토큰도 어휘의 일부이며 토큰 수에 포함된다.'},
 {h:'실무에서', d:'API 응답에는 보통 `usage.prompt_tokens`, `usage.completion_tokens` 같은 필드로 실제 소모 토큰 수가 찍혀 나온다. 프롬프트를 짤 때 "글자 수"가 아니라 "토큰 수"로 예산을 세워야 하고, 긴 few-shot 예시나 시스템 프롬프트를 넣을 때는 tiktoken 같은 라이브러리로 미리 세어보는 게 어림짐작보다 훨씬 정확하다.'}
],

diagram:{type:'flow', cap:'"unbelievable results" 가 토큰 ID 시퀀스로 바뀌는 과정.',
 steps:['원문 "unbelievable results"','서브워드 분할: un / believ / able / _results','토큰 ID: [2938, 6497, 481, 3125]','+ 특수 토큰: [BOS, ...4개..., EOS]']},

confuse:[
 {a:'토큰', b:'[토크나이저](#/c/tokenizer)', d:'토크나이저는 쪼개는 도구이고 토큰은 그 결과물 한 조각이다. "토큰 수가 많다"는 텍스트 얘기고 "토크나이저가 다르다"는 도구 얘기다.'},
 {a:'토큰 ID', b:'[임베딩](#/c/embedding) 벡터', d:'토큰 ID 는 어휘집 안의 정수 인덱스일 뿐 의미 정보가 없다. 실제로 모델이 계산에 쓰는 것은 그 ID 로 임베딩 테이블에서 찾아온 연속 벡터다.'},
 {a:'단어 수', b:'토큰 수', d:'영어는 대략 단어 수 × 1.3 정도가 토큰 수로 알려져 있지만 한국어를 비롯한 비영어권 언어는 이 어림이 크게 어긋난다 — 자세한 수치는 [토크나이저](#/c/tokenizer) 문서 참고.'}
],

code:{lang:'python', d:'tiktoken 으로 텍스트를 토큰 ID 로 바꾸고 개수를 세는 예.', src:
'import tiktoken\n'+
'enc = tiktoken.get_encoding("cl100k_base")\n'+
'ids = enc.encode("unbelievable results")\n'+
'print(ids)                  # [359, 6517, 2205, 3135]\n'+
'print(len(ids))             # 4\n'+
'print(enc.decode(ids))      # "unbelievable results"'},

pitfalls:[
 '토큰 수를 글자 수나 단어 수로 어림잡으면 특히 비영어권 텍스트에서 실제 비용·문맥 소모를 크게 과소평가하게 된다.',
 '같은 텍스트도 앞뒤 공백·개행 유무에 따라 토큰 분할이 달라질 수 있다 — "hello"와 " hello"가 다른 토큰 ID를 가지는 경우가 흔하다.',
 'EOS 토큰이 생성될 때까지 모델이 텍스트를 계속 만든다는 걸 잊으면, 왜 응답이 예상보다 길게 이어지는지(또는 갑자기 끊기는지) 원인을 못 찾는다.'
],

papers:['bpe','gpt3'],
terms:['tokenizer','context-window','embedding']
});
