WIKI.paper({
slug:'react',
venue:'ICLR 2023 (arXiv 2022.10)',
authors:'Yao et al. (Princeton · Google Brain)',
arxiv:'2210.03629',

tldr:'생각(Thought)과 행동(Action)을 **한 시퀀스 안에 번갈아** 생성하게 만들어, 모델이 스스로 세운 계획을 외부 환경의 관찰(Observation)로 검증하며 나아가게 한 프롬프팅. 오늘날 거의 모든 에이전트 루프의 원형이다.',

context:'[Chain-of-Thought](#/p/cot)는 모델이 머릿속에서 추론 과정을 적게 만들어 산술·상식 문제를 크게 개선했지만, 결정적 약점이 있었다 — **추론이 전부 파라미터 안에서만 일어난다.** 모델이 모르는 사실을 중간에 지어내면 그 오류가 사슬을 타고 끝까지 전파되고, 스스로 그것을 알아챌 방법이 없다. 반대편에는 행동만 내보내는 계열(WebGPT류, 강화학습 정책)이 있었는데, 이쪽은 API를 호출하고 링크를 클릭할 수는 있어도 **왜 그 행동을 하는지**에 대한 내부 상태가 없어서 계획이 조금만 길어지면 헤맸다. 이 논문의 관찰은 단순하다 — 사람은 무언가를 찾을 때 "생각 → 행동 → 본 것 → 다시 생각"을 반복한다. 그 인터리빙을 **언어모델의 출력 형식 자체로** 만들면 어떻게 되는가?',

ideas:[
 {h:'행동 공간을 "언어"로 확장한다',
  lead:'환경을 바꾸지 않는 자유형 사고 문장을 행동 공간에 추가한다.',
  d:'기존 강화학습 에이전트의 행동 공간 $A$ 는 환경이 정의한 것(검색, 클릭, 이동)뿐이다. ReAct는 여기에 **환경을 전혀 바꾸지 않는 행동**, 즉 자유형 사고 문장을 추가한다. `Thought`는 관찰을 만들지 않고 문맥에만 남는다. 그래서 이 사고는 다음 스텝의 행동 선택에 조건으로 걸리는 **작업 메모리**로 기능한다.'},
 {h:'Thought → Action → Observation 의 3박자',
  lead:'생각·행동·관찰을 한 세트로 반복하며 외부 사실을 문맥에 주입한다.',
  d:'루프 한 바퀴는 정확히 세 줄이다. `Thought: 파라마운트 극장의 수용 인원을 먼저 찾아야 한다` / `Action: Search[Paramount Theatre]` / `Observation: ...`. 관찰은 **모델이 쓰지 않고 환경이 문맥에 끼워 넣는다**. 즉 매 스텝마다 외부 사실이 문맥에 주입되므로, 다음 사고는 지어낸 값이 아니라 방금 읽은 값을 근거로 삼는다.'},
 {h:'사고가 하는 일은 한 종류가 아니다',
  lead:'사고는 목표 분해·함의 추출·재계획·질의 수정 등 여러 역할을 한다.',
  d:'논문이 관찰한 사고의 역할은 최소 네 가지다 — (1) 문제를 하위 목표로 **분해**, (2) 관찰에서 상식적 함의를 **추출**, (3) 진행 상황을 **추적·재계획**, (4) 검색이 실패했을 때 질의를 **바꿔 재시도**. 특히 (4)가 중요하다. 사고 없이 행동만 하는 `Act` 방식은 검색이 빗나가도 그 사실을 인식하지 못하고 같은 실패를 반복한다.'},
 {h:'외부 지식이 환각을 끊는다 — 하지만 공짜는 아니다',
  lead:'검색으로 환각은 줄지만 검색 실패가 새로운 실패 원인이 된다.',
  d:'HotpotQA 오답 궤적 50개를 사람이 분류한 결과, CoT는 그중 **56%가 환각**이었던 반면 ReAct는 **0%**였다. 대신 ReAct는 새로운 실패 모드를 얻는다 — 같은 사고·행동을 반복하며 헛도는 **추론 오류가 47%**, 검색 자체가 답을 못 찾은 경우가 23%. 근거를 밖에서 가져오는 대가로, 밖이 답을 주지 않으면 진행이 멈춘다.'},
 {h:'CoT와 ReAct를 섞는 것이 최선',
  lead:'ReAct와 CoT-SC를 서로의 폴백으로 써서 둘을 합치면 더 좋다.',
  d:'그래서 논문은 둘을 합친다. ReAct가 정해진 스텝 안에 답을 못 내면 [CoT-Self-Consistency](#/p/self-consistency)로 넘기고(`ReAct→CoT-SC`), 반대로 CoT-SC의 다수결 신뢰도가 낮으면 ReAct로 넘긴다. 이 조합이 두 방식 각각보다 모두 높다. **내부 지식과 외부 지식은 대체재가 아니라 보완재**라는 것이 이 논문의 실질적 결론이다.'}
],

diagram:{type:'loop', cap:'ReAct 루프. Observation만이 모델 바깥에서 들어오고, Thought는 환경을 바꾸지 않는 "언어 행동"이다.',
 center:'답이 나올 때까지 반복',
 nodes:[
  {t:'Thought', s:'무엇을 모르는가 · 다음에 뭘 할까', acc:true},
  {t:'Action', s:'Search·Lookup·Finish'},
  {t:'환경 실행', s:'환경별 실행 방식'},
  {t:'Observation', s:'환경이 문맥에 주입하는 사실'}
 ]},

numbers:[
 {k:'ALFWorld 성공률', v:'71%', d:'행동만 하는 `Act` 45%, 모방학습 BUTLER 37% — 인컨텍스트 예시 **1~2개**만으로'},
 {k:'WebShop 성공률', v:'40.0%', d:'IL+RL 기반선 28.7% (점수 66.6 vs 62.4)'},
 {k:'FEVER 정확도', v:'60.9', d:'CoT 56.3 · Standard 57.1. 사실 검증은 외부 조회가 직접 이득'},
 {k:'HotpotQA EM', v:'27.4', d:'CoT 29.4보다 **낮다** — 검색이 빗나가면 오히려 손해'},
 {k:'ReAct → CoT-SC', v:'35.1 EM', d:'CoT-SC 단독 33.4를 넘어섬. 두 방식의 결합이 최고'},
 {k:'기반 모델', v:'PaLM-540B', d:'미세조정 없이 프롬프팅만. [GPT-3](#/p/gpt3)로도 재현됨'}
],

math:[
 {expr:'A_hat = A ∪ L,   a_hat ∈ L 이면 환경 상태 불변, 문맥 c ← c + a_hat',
  tex:'\\begin{aligned} \\hat{A} &= A \\cup L \\\\ \\hat{a}\\in L &\\Rightarrow c_{t+1}=c_t+\\hat{a} \\end{aligned}',
  d:'행동 공간 $A$ 에 언어 공간 $L$ 을 합집합한 것이 형식적 정의의 전부다. 언어 행동은 관찰을 만들지 않고 문맥만 늘린다. 정책 $\\pi(a_t | c_t)$ 는 이 늘어난 문맥에 조건화된다.'}
],

impact:'ReAct 이후 "에이전트"라는 말의 실체가 **Thought/Action/Observation 텍스트 루프**로 굳었다. LangChain·AutoGPT를 비롯한 초기 에이전트 프레임워크는 사실상 이 프롬프트 형식의 구현체였고, 이후 함수 호출(function calling)·도구 사용 API가 모델 제공자 쪽으로 흡수되면서 형식은 JSON으로 바뀌었지만 **루프 구조 자체는 그대로**다. 동시에 이 논문은 "추론 능력"과 "행동 능력"을 분리해서 평가하던 관행을 끝냈다 — 둘을 붙이면 각각의 합보다 낫다는 것이 반복 확인됐다.',

legacy:[
 '**도구 호출의 학습화** — 프롬프트로 시키던 것을 [Toolformer](#/p/toolformer)가 자기지도로 학습시키고, 이후 모델 제공자들이 함수 호출을 사전학습·정렬 단계에 내재화',
 '**탐색으로의 확장** — 단일 궤적을 따라가는 대신 여러 갈래를 펼쳐 평가하는 [Tree of Thoughts](#/p/tot)가 같은 저자 그룹에서 이어짐',
 '**추론 자체를 학습** — 프롬프트로 유도하던 사고 사슬을 RL로 내재화하는 [DeepSeek-R1](#/p/deepseek-r1) 계열로 이어지며, 도구 호출도 학습 대상이 됨',
 '**벤치마크 이식** — ALFWorld·WebShop 같은 인터랙티브 환경이 LLM 평가의 표준 축으로 편입'
],

pitfalls:[
 '**"ReAct가 CoT보다 항상 낫다"는 틀렸다.** HotpotQA에서는 ReAct(27.4)가 CoT(29.4)보다 **낮다**. 검색 결과가 좋을 때만 이득이고, 검색이 빗나가면 잘못된 관찰이 오히려 모델을 잘못된 방향으로 고정시킨다.',
 '**루프 고착이 실제 실패 모드다.** 논문 자체가 ReAct 오답의 47%를 추론 오류 — 주로 같은 사고·행동을 반복하며 빠져나오지 못하는 경우 — 로 분류했다. 실무에서는 최대 스텝 수 제한, 중복 행동 탐지, 실패 시 다른 전략으로의 폴백이 반드시 필요하다.',
 '**Thought는 근거가 아니라 출력이다.** 모델이 적은 사고 문장이 실제 내부 계산을 반영한다는 보장은 없다. 그럴듯한 사고를 적고 무관한 행동을 하는 경우가 존재하므로, 사고 텍스트를 감사 로그로 신뢰하면 안 된다.'
],

figures:[
 {f:'fig1-react-loop.png',
  cap:'HotpotQA 한 문제를 ReAct로 푸는 실제 궤적. Thought(다음에 뭘 할지 계획) → Act(Search/Finish 같은 실제 행동) → Obs(행동의 결과, 초록 강조가 다음 Thought에 그대로 인용됨)가 번갈아 반복된다. Thought 2에서 "Front Row"가 언급되자 Act 2가 그대로 Search[Front Row]를 실행하고, 검색이 실패하자(Obs 2) Thought 3이 대안(Front Row (software))으로 방향을 바꾼다 — 사고가 다음 행동을 결정하고 행동의 관찰이 다시 사고를 바꾼다.',
  src:'원문 Figure 1 (1d), p.2'}
],

quotes:[
 {t:'this "chain-of-thought" reasoning is a static black box, in that the model uses its own internal representations to generate thoughts and is not grounded in the external world, which limits its ability to reason reactively or update its knowledge.',
  src:'Section 1, p.2'}
],

links:[
 {t:'arXiv 2210.03629 — ReAct: Synergizing Reasoning and Acting in Language Models', u:'https://arxiv.org/abs/2210.03629'},
 {t:'프로젝트 페이지 · 궤적 예시', u:'https://react-lm.github.io/'},
 {t:'공식 구현 (ysymyth/ReAct)', u:'https://github.com/ysymyth/ReAct'}
]
});
