WIKI.paper({
slug:'pot',
venue:'TMLR 2023 (arXiv 2022/11)',
authors:'Chen, Ma, Wang, Cohen (U. Waterloo · Vector Institute · UC Santa Barbara · Google Research)',
arxiv:'2211.12588',

tldr:'추론 단계를 자연어가 아니라 **실행 가능한 프로그램**으로 쓰게 하고, 계산은 Python 인터프리터에 넘겨 [CoT](#/p/cot)가 옳게 추론하고도 산수에서 틀리는 문제를 없앤 논문. [PAL](#/p/pal)과 같은 시기에 나온 독립 연구로, 수학 문제집을 넘어 표·텍스트가 섞인 금융 QA까지 평가 범위를 넓혔다.',

context:'2022년 후반 [CoT](#/p/cot)는 few-shot 추론의 표준이었지만 약점이 뚜렷했다. 모델이 문제를 어떻게 풀지 올바르게 계획해 놓고도, 그 계획을 자연어 문장 안에서 직접 암산하다가 자릿수 큰 곱셈·나눗셈에서 틀리는 경우가 많았다. 계산기를 붙이는 CoT+calc류 시도도 있었지만 자연어 문장 중간에서 어디가 숫자이고 무슨 연산인지 다시 파싱해야 해서 개선폭이 작았다. 저자들의 질문은 단순하다 — 추론 단계 자체를 처음부터 **모호한 문장이 아니라 실행 가능한 프로그램**으로 쓰게 하면 어떨까?',

ideas:[
 {h:'추론은 프로그램으로, 계산은 인터프리터로',
  lead:'LLM은 자연어 주석과 함께 Python 코드를 생성하고, 그 코드의 실행은 인터프리터가 전담한다.',
  d:'CoT는 "무엇을 계산할지 정하는 것"과 "그 계산을 실제로 수행하는 것"을 모두 LLM 혼자 한다. PoT는 LLM에게 `solver()` 함수 형태의 Python 코드를 생성하게 한 뒤, 그 코드를 실제로 실행해 답을 얻는다. Figure 3의 예시처럼 기차 두 대가 만나는 시간을 구하는 문제에서, LLM은 `train1_speed = distance_of_city / train1_travel_time` 같은 식을 세우기만 하고 실제 나눗셈은 Python이 한다.'},
 {h:'SymPy로 미지수를 남겨둔 채 풀 수 있다',
  lead:'답을 바로 계산하지 못하는 문제는 방정식을 세우고 `solve()`로 넘겨 심볼릭하게 푼다.',
  d:'이자율처럼 답이 방정식의 해로만 구해지는 문제는 `Symbol`로 미지수를 선언하고 관계식을 세운 뒤 SymPy의 `solve` 함수에 넘긴다. 이는 CoT가 못 하는 일이다 — 자연어로는 "방정식을 세웠다"까지는 표현해도 그 방정식을 실제로 푸는 것은 별개의 정확한 대수 연산이기 때문이다.'},
 {h:'zero-shot에서는 `#` 토큰을 억제해 코드로 유도한다',
  lead:'예시 없이 지시문만 줄 때 모델이 주석 속에서만 사고하고 코드를 안 쓰는 것을 막는 트릭.',
  d:'few-shot 없이 지시문만 주면 모델이 여전히 자연어처럼 `#` 주석 줄에서만 사고를 풀어놓고 실행 가능한 코드는 안 쓰는 경우가 생긴다. 이를 막기 위해 생성 중 `#` 토큰의 로짓을 억제해 코드 줄 생성을 유도한다. 이 장치 덕에 zero-shot PoT는 [zero-shot CoT](#/p/zero-shot-cot)처럼 답을 뽑는 추가 단계 없이 실행 결과를 그대로 답으로 쓸 수 있다.'},
 {h:'변수명·다단계 분해 둘 다 없으면 성능이 무너진다',
  lead:'의미 있는 변수명(semantic binding)과 여러 줄로 쪼갠 단계(multi-step) 각각을 없애는 소거 실험으로 기여도를 분리한다.',
  d:'변수명을 `a, b, c`로 바꾸거나(PoT−Binding) 방정식을 한 줄로 직접 생성하게 하면(PoT−MultiStep) GSM8K 정확도가 71.6%에서 각각 60.2%, 45.8%로 떨어진다. 특히 다단계 분해를 없애고 목표 수식을 한 번에 생성하게 하는 쪽이 손실이 훨씬 크다 — 복잡한 수식을 통째로 뽑아내는 일 자체가 여전히 LLM에게 어렵다는 뜻이다.'}
],

diagram:{type:'compare', cap:'CoT와 PoT가 "무엇을 계산할지"와 "실제 계산"을 어떻게 나누는지.',
 left:{t:'Chain-of-Thought', items:['자연어 문장으로 추론+계산','LLM이 산수까지 직접 수행','수학 표·금융 QA에서 오차 누적']},
 right:{t:'PoT', items:['자연어 주석 + Python 코드 생성','SymPy로 방정식도 심볼릭 처리','인터프리터 실행이라 계산은 항상 맞음']}},

math:[
 {expr:'해당 없음 — 프롬프트 형식 자체가 방법론',
  tex:'\\text{solver}() \\;\\Rightarrow\\; \\{\\text{code}_1,\\dots,\\text{code}_k\\} \\;\\xrightarrow{\\text{Python}}\\; \\text{answer}',
  d:'few-shot 프롬프트는 (질문, 자연어 주석이 섞인 코드) 쌍을 예시로 준다. 테스트 질문에 대해 모델이 같은 패턴으로 `solver()` 함수를 생성하면, 그 함수를 실제로 실행해 반환값을 답으로 쓴다. 수식이 아니라 **생성-실행 파이프라인 자체**가 방법의 전부다.'}
],

numbers:[
 {k:'few-shot 평균 개선폭', v:'MWP +8%p · 금융 QA +15%p', d:'Codex(code-davinci-002) 기준, CoT 대비'},
 {k:'zero-shot 평균 개선폭', v:'약 +12%p', d:'MWP 5개 데이터셋에서 zero-shot CoT 대비'},
 {k:'GSM8K few-shot', v:'71.6%', d:'CoT 63.1% 대비 · self-consistency 결합(PoT-SC) 시 80.0%'},
 {k:'FinQA / ConvFinQA', v:'64.5% / 64.6%', d:'CoT(40.4% / 45.5%) 대비 **약 +20%p** — 표+텍스트 혼합 입력에서 격차가 가장 큼'},
 {k:'변수명 제거(PoT−Binding)', v:'GSM8K 60.2%', d:'원래 71.6%에서 하락 — semantic binding 소거'},
 {k:'수식 직접 생성(PoT−MultiStep)', v:'GSM8K 45.8%', d:'다단계 분해를 없애면 하락폭이 더 큼'}
],

impact:'PoT는 PAL과 함께 "LLM은 계획, 외부 인터프리터는 실행"이라는 역할 분리를 수학 문제집을 넘어 표·텍스트가 섞인 실제 업무형 QA(FinQA, TabMWP)로 확장해 보였다. 저자들 스스로 비교 실험(원문 Table 5)을 넣어 **[PAL](#/p/pal)이 동시기 독립 연구**임을 명시하며, GSM8K·GSM8K-Hard에서는 거의 동률, SVAMP·ASDIV에서는 PoT가 약 6%p 앞섬을 보였다. 두 논문의 핵심 아이디어(프로그램으로 추론, 인터프리터로 계산)는 사실상 같고, 차이는 SymPy를 통한 심볼릭 방정식 처리와 훨씬 다양한 입력 형식(표+텍스트+대화 이력)에 대한 평가 범위에 있다.',

legacy:[
 '**[PAL](#/p/pal)과의 동시 발견** — 같은 아이디어가 독립적으로 수렴했다는 사실 자체가, "산수는 언어모델이 아니라 도구에 맡긴다"는 원칙이 그만큼 자명하게 필요했음을 보여준다',
 '**자기비평·자기평가로의 확장** — self-critic, self-eval, plan-and-solve 등 PoT 위에 검증 단계를 얹는 후속 연구들이 뒤따랐다(원문 §4.4)',
 '**도구 호출의 일반화** — Python 하나에 묶여 있던 실행기를 검색·API 호출 등으로 넓히는 흐름이 [ReAct](#/p/react)·Toolformer 계열로 이어졌다',
 '**표·금융 문서 QA 벤치마크의 재사용** — FinQA/ConvFinQA/TabMWP 조합 평가가 이후 도구 사용 에이전트의 표준 테스트베드 중 하나로 굳어졌다'
],

pitfalls:[
 '**PAL과 별개 논문이다.** 같은 시기(2022년 11월)에 독립적으로 나온 두 연구이며, 어느 한쪽이 다른 쪽을 인용해 만든 파생물이 아니다 — 원문 스스로 "contemporary work"라 표기한다.',
 '**수학·표 형태로 환원 가능한 문제에 유리가 쏠려 있다.** 개방형 서술이나 결정적 프로그램으로 옮기기 어려운 추론에는 이 형식이 그대로 옮겨가지 않는다.',
 '**zero-shot 결과의 `#` 토큰 억제는 프롬프트 엔지니어링에 가깝다.** 백엔드나 토크나이저가 바뀌면 같은 트릭이 그대로 통한다는 보장이 없다.'
],

figures:[
 {f:'fig1-example.png',
  cap:'왼쪽은 few-shot: 예시들(초록 카드) 뒤에 실제 질문을 붙이면 LLM이 자연어 주석과 변수 할당이 섞인 코드를 생성한다. 오른쪽은 zero-shot: 예시 없이 `def solver():` 지시만으로도 같은 패턴의 코드가 나온다. 두 경우 모두 마지막 값을 만드는 건 LLM이 아니라 이 코드를 실행하는 Python이다.',
  src:'원문 Figure 3, p.4'},
 {f:'fig2-results.png',
  cap:'위: few-shot, 가운데: few-shot+self-consistency, 아래: zero-shot. 7개 데이터셋 전부에서 빨간 막대(PoT)가 파란 막대(CoT)보다 높다 — 특히 FinQA·ConvFin처럼 표+텍스트가 섞인 금융 데이터셋(오른쪽 절반)에서 격차가 가장 크게 벌어지는 것을 본다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'Unlike CoT, PoT relegates some computation to an external process (a Python interpreter). The LLMs are only responsible for expressing the "reasoning process" in the programming language.',
  src:'Section 2.2, p.4'}
],

links:[
 {t:'arXiv 2211.12588 — Program of Thoughts Prompting', u:'https://arxiv.org/abs/2211.12588'},
 {t:'OpenReview (TMLR)', u:'https://openreview.net/forum?id=YfZ4ZPt8zd'}
]
});
