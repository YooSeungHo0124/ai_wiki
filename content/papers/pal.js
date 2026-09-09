WIKI.paper({
slug:'pal',
venue:'ICML 2023',
authors:'Gao, Madaan, Zhou et al. (CMU · Inspired Cognition)',
arxiv:'2211.10435',

tldr:'추론 과정을 자연어 문장이 아니라 **실행 가능한 프로그램**으로 쓰게 하고, 계산은 Python 인터프리터에게 넘기는 방법. [Chain-of-Thought](#/p/cot)가 옳은 추론을 세우고도 산수를 틀리는 문제를 구조적으로 없앤다.',

context:'[Chain-of-Thought](#/p/cot)는 문제를 단계별 자연어 문장으로 풀게 해서 few-shot 추론 능력을 크게 끌어올렸다. 그런데 CoT의 실패를 들여다보면 **추론(무엇을 계산할지)은 맞는데 계산(실제 산수)은 틀리는** 경우가 많다. LLM은 "5 + 6"이 무엇을 의미하는지는 알아도 자릿수가 커지면 곱셈·나눗셈에서 흔히 틀린다. 계산기를 붙이는 시도들도 있었지만 자연어 문장 중간에서 어디까지가 "숫자"이고 어떤 연산인지를 다시 파싱해야 해서 개선폭이 작았다. 질문은 단순하다 — 애초에 중간 단계를 **모호한 자연어가 아니라 실행 가능한 코드로** 쓰게 하면 어떨까?',

ideas:[
 {h:'추론은 LLM, 계산은 인터프리터로 역할 분리',
  lead:'LLM은 문제를 프로그램으로 옮기는 것까지만 하고, 그 프로그램을 실제로 실행해 답을 내는 일은 Python에 맡긴다.',
  d:'CoT는 "생성"과 "계산"을 모두 LLM 혼자 한다. PAL은 LLM에게 자연어 문제를 읽고 **변수와 수식으로 이루어진 Python 코드**를 생성하게 한 뒤, 그 코드를 실제 인터프리터로 실행해서 최종 답을 얻는다. LLM은 계산 절차(무엇을 어떤 순서로 계산할지)는 잘 알지만 계산 자체(그 절차를 정확히 수행하는 것)는 못한다는 통찰에서 나온 역할 분리다.'},
 {h:'few-shot 예시도 자연어 주석 + 코드로 짝짓는다',
  lead:'in-context 예시의 각 자연어 문장 옆에 그에 대응하는 한 줄 코드를 나란히 적어 프롬프트를 구성한다.',
  d:'CoT가 예시에 자연어 thought $t_i$ 를 붙이듯이, PAL은 각 자연어 단계 뒤에 `tennis_balls = 5` 같은 대응 코드를 주석과 함께 붙인다. 모델은 이 패턴을 모방해 테스트 질문에 대해서도 "자연어 주석 + 코드"를 번갈아 생성하고, 마지막 줄에서 `answer = ...` 형태로 답을 조립한다. 코드가 아닌 자연어 부분은 Python 주석(`#`)으로 처리돼 인터프리터가 무시한다.'},
 {h:'변수명이 grounding 역할을 한다',
  lead:'`x = 5` 대신 `tennis_balls = 5`처럼 의미 있는 이름을 써서 코드와 문제 속 개체를 서로 묶는다.',
  d:'변수를 의미 없는 기호(`x`, `y`)로 바꾸면(PAL−var) 정확도가 CoT보다도 낮아진다. 자연어 주석을 지워도 변수명만 의미 있게 유지하면(PAL−comment) 정확도가 소폭만 떨어진다. 즉 코드 자체의 실행 가능성보다, **변수명이 자연어 개체와 코드 기호를 잇는 접착제** 역할을 한다는 것이 소거 실험으로 드러난다.'},
 {h:'백엔드가 코드에 강해야 이 방법이 통한다',
  lead:'코드 생성 능력이 약한 모델(`text-davinci-001`)에서는 오히려 CoT가 PAL을 이긴다.',
  d:'PAL은 Codex(`code-davinci-002`) 기준으로 설계됐지만, 코드가 아닌 순수 언어모델 `text-davinci-002/003`에도 적용해봤다. 코딩 능력이 충분히 높아지는 지점부터 PAL이 CoT를 역전한다. 즉 PAL의 이득은 "프로그램으로 쓰기"라는 형식 자체가 아니라, **그 형식을 실제로 잘 실행할 수 있는 백엔드가 있을 때만** 발휘된다.'}
],

diagram:{type:'compare', cap:'같은 문제를 CoT와 PAL이 어떻게 다르게 풀이 단계를 표현하는지.',
 left:{t:'Chain-of-Thought', items:['자연어 문장으로 추론+계산','LLM이 산수까지 직접 수행','틀린 계산이 섞여도 티가 안 남']},
 right:{t:'PAL', items:['자연어 주석 + Python 코드 생성','계산은 인터프리터가 실행','실행 가능하니 계산 오류가 없음']}},

math:[
 {expr:'p ≡ <x1 · t1 · c1 · y1> || ... || <xk · tk · ck · yk>',
  tex:'p \\equiv \\langle x_1\\!\\cdot\\! t_1 \\!\\cdot\\! c_1 \\!\\cdot\\! y_1\\rangle \\Vert \\dots \\Vert \\langle x_k \\!\\cdot\\! t_k \\!\\cdot\\! c_k \\!\\cdot\\! y_k\\rangle',
  d:'few-shot 프롬프트는 입력 $x_i$, 자연어 단계 $t_i$, 그에 대응하는 코드 $c_i$, 정답 $y_i$ 를 이어 붙인 것이다. 테스트 시점엔 $x_{test}$ 만 채우고 모델이 $t_{test}, c_{test}$ 를 생성하면, 인터프리터가 $c_{test}$ 를 실행해 $y_{test}$ 를 얻는다.'}
],

numbers:[
 {k:'GSM8K few-shot', v:'72.0%', d:'CoT + PaLM-540B(56.9%) 대비 **+15%p** — Codex 기반 PAL이 훨씬 큰 모델을 이김'},
 {k:'GSM-HARD (숫자를 크게 바꾼 변형)', v:'61.2%', d:'CoT Codex는 65.6%에서 23.1%로 폭락하는데 PAL은 72.0%→61.2%로 완만하게만 하락'},
 {k:'DATE understanding', v:'+11.4%p', d:'CoT Codex·PaLM-540B·LaMDA-137B 대비 PAL의 개선폭'},
 {k:'REPEAT COPY (문자열 조작)', v:'96.7%', d:'CoT 대비 절대 **+21.8%p** — 상태 추적이 필요한 알고리즘 과제에서 격차가 특히 큼'},
 {k:'변수명 제거(PAL−var)', v:'CoT보다 낮음', d:'변수를 의미 없는 기호로 바꾸면 이득이 사라짐 — grounding이 핵심임을 보여주는 소거 실험'},
 {k:'평가 과제 수', v:'13개', d:'수학·기호·알고리즘 추론 벤치마크(BIG-Bench Hard 포함)'}
],

impact:'PAL은 "LLM이 도구를 호출한다"는 이후 agent 계열의 원형 중 하나다. 계산기·검색·코드 실행처럼 LLM이 서투른 부분을 외부 도구에 위임하고 LLM은 **무엇을 언제 호출할지**만 맡는다는 분업 원칙을 산수라는 가장 단순한 도구로 처음 명확히 보였다. 이 원칙은 [ReAct](#/p/react)의 행동-관찰 루프, [Toolformer](#/p/toolformer)의 도구 호출 학습으로 곧장 이어졌고, 오늘날 코드 인터프리터를 붙인 LLM 에이전트의 기본 전제가 되었다.',

legacy:[
 '**도구 사용 에이전트의 원형** — "LLM은 계획, 외부 실행기는 계산"이라는 역할 분리가 [ReAct](#/p/react)·[Toolformer](#/p/toolformer)로 일반화됨',
 '**코드를 사고의 매체로 쓰는 흐름** — 이후 코드 생성 모델([StarCoder](#/p/starcoder) 등)이 수학·논리 벤치마크에서 강세를 보이는 근거 중 하나로 인용됨',
 '**GSM-HARD 데이터셋** — 큰 수로 바꾼 변형 벤치마크가 이후 "LLM이 진짜 추론하는가, 암기했는가"를 가르는 진단 도구로 재사용됨',
 '**[Self-Consistency](#/p/self-consistency)·[Tree of Thoughts](#/p/tot)와 상호보완** — 이들이 "여러 추론 경로 중 고르는 법"을 다룬다면 PAL은 "각 경로의 계산을 틀리지 않게 하는 법"을 다뤄, 실무에서는 흔히 함께 쓰인다'
],

pitfalls:[
 '**프롬프트 문구·예시 선택에 민감하다.** few-shot 예시의 변수명·주석 스타일이 조금만 바뀌어도 정확도가 흔들린다 — PAL−var 소거 실험이 보여주듯 변수명 하나로도 CoT보다 나빠질 수 있다.',
 '**수학·기호 조작처럼 "코드로 옮기기 쉬운" 문제에 유리가 쏠려 있다.** 상식 추론이나 개방형 서술처럼 결정적 프로그램으로 환원하기 어려운 과제에는 이 방식이 그대로 옮겨가지 않는다.',
 '**코드 생성 능력이 약한 백엔드에서는 역효과다.** `text-davinci-001`처럼 코딩이 서툰 모델에서는 CoT가 PAL을 이긴다 — "프로그램으로 쓰면 무조건 낫다"가 아니라 그 프로그램을 잘 쓸 수 있어야 한다는 전제가 숨어 있다.'
],

figures:[
 {f:'fig1-pal-vs-cot.png',
  cap:'PAL의 Input(위)은 few-shot 예시에서 자연어 문장(파란 강조) 뒤에 대응 코드(분홍 강조)를 붙인 모습. Model Output(아래)은 테스트 질문에 대해 모델이 같은 패턴으로 코드를 이어 생성하고, 맨 아래 `>>> print(answer)`가 인터프리터 실행 결과(초록 74)임을 보여준다 — 이 실행은 모델이 아니라 Python이 한 것.',
  src:'원문 Figure 1, p.2 (우측 절반)'}
],

quotes:[
 {t:'PAL: a novel approach that uses the LLM to read natural language problems and generate programs as the intermediate reasoning steps, but offloads the solution step to a runtime such as a Python interpreter.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2211.10435 — PAL: Program-aided Language Models', u:'https://arxiv.org/abs/2211.10435'},
 {t:'reasonwithpal.com (공식 코드·데이터)', u:'http://reasonwithpal.com'}
]
});
