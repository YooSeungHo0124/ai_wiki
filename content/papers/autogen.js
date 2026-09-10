WIKI.paper({
slug:'autogen',
venue:'arXiv 2023 (Microsoft Research)',
authors:'Wu, Bansal, Zhang et al. (Microsoft Research · Penn State · U. Washington)',
arxiv:'2308.08155',

tldr:'대화 가능한 에이전트를 **프로그래밍 구성 요소**로 다루는 오픈소스 프레임워크. LLM·사람·도구를 같은 인터페이스(`send`/`receive`/`generate_reply`) 뒤에 숨겨, "누가 답하는가"를 코드가 아니라 설정으로 바꿀 수 있게 만들었다.',

context:'[CAMEL](#/p/camel)이 두 에이전트의 역할극이 가능함을 보였지만, 그 대화 패턴은 논문마다 처음부터 새로 짜야 했다 — 사람을 얼마나 끼워 넣을지, 도구 실행을 누가 맡을지, 대화를 언제 끝낼지가 전부 애플리케이션 코드에 하드코딩됐다. 수학 풀이·코드 생성·질의응답처럼 성격이 다른 과제마다 필요한 에이전트 구성과 대화 패턴이 다른데, 매번 새 프레임워크를 짜는 것은 비효율적이다. 저자들의 질문은 **"에이전트를 재사용 가능한 구성 요소로 만들고, 대화 패턴 자체를 프로그램하듯 조립할 수 있는가"**였다.',

ideas:[
 {h:'ConversableAgent: LLM·사람·도구를 같은 인터페이스로',
  lead:'`send`·`receive`·`generate_reply` 세 메서드 뒤에 LLM·사람·도구를 동등하게 숨긴다.',
  d:'모든 에이전트는 `ConversableAgent` 하나를 상속한다. 이 에이전트가 답을 만드는 방식(`generate_reply`)이 LLM 호출인지, 사람에게 입력을 묻는 것인지, 코드를 실행하는 것인지는 설정값(`human_input_mode`, `code_execution_config` 등)으로 정해질 뿐 인터페이스는 동일하다. 그래서 "이 역할을 사람이 맡을지 LLM이 맡을지"를 코드 구조를 바꾸지 않고 스위치 하나로 바꿀 수 있다.'},
 {h:'AssistantAgent / UserProxyAgent라는 기본 두 조합',
  lead:'조수 역할과 실행·검증 역할을 미리 만들어 둔 두 서브클래스로 대부분의 앱을 짠다.',
  d:'`AssistantAgent`는 LLM으로 해법을 생성하는 역할, `UserProxyAgent`는 사람 입력을 받거나 조수가 제안한 코드를 실제로 실행하고 그 결과(에러 포함)를 다시 조수에게 돌려주는 역할이다. 대부분의 응용 사례가 이 두 클래스를 조합하는 것만으로 시작 가능하다는 것이 "재사용 가능한 구성 요소"라는 설계 목표의 실증이다.'},
 {h:'conversation programming: 대화 자체가 제어 흐름',
  lead:'누가 언제 답할지를 조건문이 아니라 메시지 주고받기 흐름으로 표현한다.',
  d:'전통적인 파이프라인은 함수 호출 순서로 제어 흐름을 짜지만, AutoGen은 **연산(각 에이전트가 응답을 계산하는 방식)** 과 **제어 흐름(다음에 누구에게 보낼지)** 을 모두 대화 중심으로 표현한다. 종료 조건이 만족될 때까지 메시지가 오가는 것 자체가 프로그램의 실행이 되므로, 자연어 지시와 코드 등록(`register_reply`)을 섞어 대화 패턴을 조립할 수 있다.'},
 {h:'GroupChatManager: 2인 대화를 넘어선 동적 다자 대화',
  lead:'다음 발언자를 매 턴 동적으로 골라 셋 이상의 에이전트를 하나의 대화방에 묶는다.',
  d:'2인 대화만으로는 부족한 과제(예: Commander·Writer·Safeguard 세 역할이 협업·검증하는 OptiGuide)를 위해 `GroupChatManager`가 매 턴 다음 발언자를 선택한다. 실험에서는 역할극 스타일 프롬프트로 다음 화자를 고르는 편이 과제 기반 프롬프트보다 성공률이 높고 LLM 호출 수도 적었다(아래 numbers).'},
 {h:'여섯 응용으로 유연성을 증명하는 방식의 논문',
  lead:'성능 표 한 장이 아니라 수학·RAG·의사결정·코딩·그룹챗·체스 여섯 응용으로 설계를 검증한다.',
  d:'이 논문은 단일 벤치마크에서 새 SOTA를 내는 논문이 아니라 **프레임워크 논문**이다. 논거는 "같은 두 클래스(`AssistantAgent`/`UserProxyAgent`)로 성격이 전혀 다른 여섯 응용(수학 풀이, 검색 증강 QA/코드생성, ALFWorld 의사결정, 다중 에이전트 코딩, 동적 그룹챗, 대화형 체스)을 다 만들 수 있었다"는 것 — 즉 표가 아니라 **설계의 재사용 폭**이 핵심 증거다.'}
],

diagram:{type:'stack', cap:'AutoGen의 에이전트 계층. ConversableAgent 하나가 LLM·사람·도구를 인터페이스 뒤로 숨기고, 그 위에 세 가지 기본 역할이 얹힌다.',
 layers:[
  {t:'Base 인터페이스', s:'send/receive/reply', acc:true},
  {t:'AssistantAgent', s:'LLM 기반 해법 생성'},
  {t:'UserProxyAgent', s:'사람 입력 · 코드 실행'},
  {t:'GroupChatMgr', s:'다음 발언자 동적 선택'},
  {t:'응용 6종', s:'수학·RAG·의사결정·코딩·그룹챗·체스'}
 ]},

numbers:[
 {k:'그룹챗 vs 2인 대화 성공', v:'GPT-4: 11/12 vs 9/12', d:'12개 과제 중 성공 수 — 역할극식 발언자 선택이 가장 우수'},
 {k:'평균 LLM 호출 수', v:'그룹챗 4.5회 · 2인 대화 6.8회', d:'GPT-4, 같은 12개 과제 — 다자 대화가 오히려 호출을 줄임'},
 {k:'종료 실패(2인 대화)', v:'GPT-4에서 3건', d:'같은 실험에서 그룹챗·역할선택 방식은 0건'},
 {k:'OptiGuide 사용자 상호작용 절감', v:'약 3~5배', d:'2000개 질의 · 5개 응용 평균, 데이터셋별 3.03x~4.88x'},
 {k:'AutoGen vs 대안(MATH 문제)', v:'ChatGPT+Plugin·LangChain ReAct·Multi-Agent Debate 대비 우수', d:'기본 두 에이전트만으로 별도 프롬프트 튜닝 없이 달성(Figure 4a)'}
],

impact:'다중 에이전트를 "논문마다 새로 설계하는 패턴"에서 "재사용 가능한 소프트웨어 구성 요소"로 옮겼다. LLM·사람·도구가 같은 인터페이스 뒤에 있다는 설계 덕에, 개발자는 역할 구성을 코드가 아니라 설정으로 바꿀 수 있게 됐다. 이후 다중 에이전트를 다루는 상용·오픈소스 프레임워크 다수가 "대화 가능한 에이전트 + 오케스트레이터"라는 이 구조를 그대로 채택했다.',

legacy:[
 '**대화 가능 에이전트 패턴의 표준화** — `AssistantAgent`/`UserProxyAgent` 같은 역할 분리가 이후 여러 에이전트 프레임워크의 기본 어휘가 됨',
 '**SOP 기반 확장** — [MetaGPT](#/p/metagpt)가 여기서 한 걸음 더 나가, 자유 대화 대신 표준 운영 절차와 문서 산출물로 에이전트를 묶는 방식을 제안',
 '**GroupChat 오케스트레이션 연구 확산** — 다음 발언자 선택 정책(역할극 vs 과제기반) 자체가 이후 다자 에이전트 연구의 한 갈래가 됨',
 '**Microsoft 생태계 통합** — 이후 AutoGen은 자체 프로젝트로 성장해 Semantic Kernel 등과 결합, 엔터프라이즈 에이전트 오케스트레이션의 참조 구현 중 하나가 됨'
],

pitfalls:[
 '**이 논문은 "AutoGen이 특정 벤치마크에서 SOTA"라고 주장하는 논문이 아니다.** 여섯 응용에 걸친 설계 유연성이 핵심 논거이므로, 표에 있는 수치를 다른 프레임워크와 직접 비교하는 근거로 쓰면 안 된다 — 비교 조건(프롬프트, 평가 문항 수)이 응용마다 다르다.',
 '**다자 대화가 항상 저비용은 아니다.** 이 논문의 12개 과제 실험에서는 그룹챗이 2인 대화보다 호출 수가 *적었지만*, 이는 speaker-selection 정책과 과제 특성에 따라 달라지는 결과이며 일반 법칙으로 확대 해석하면 안 된다.',
 '**human_input_mode=ALWAYS로 시작하라는 저자 권고를 건너뛰기 쉽다.** 논문은 새 응용을 개발할 때 항상 사람 입력을 켠 채로 시작해 프롬프트를 검증한 뒤 자동 모드로 낮추라고 명시하는데, 이 안전장치 없이 바로 완전자동(`NEVER`)으로 배포하면 비용·오류가 눈에 띄지 않게 누적될 수 있다.'
],

figures:[
 {f:'fig2-agents.png',
  cap:'ConversableAgent 하나에서 AssistantAgent(초록, LLM 전용)·UserProxyAgent(파랑, human_input_mode=ALWAYS)·GroupChatManager(빨강, 여러 에이전트를 묶음)가 갈라져 나온다 — 세 박스 모두 같은 send/receive/generate_reply 인터페이스를 공유한다는 점이 핵심.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'AutoGen is an open-source framework that allows developers to build LLM applications via multiple agents that can converse with each other to accomplish tasks.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2308.08155 — AutoGen', u:'https://arxiv.org/abs/2308.08155'},
 {t:'microsoft/autogen (GitHub)', u:'https://github.com/microsoft/autogen'}
]
});
