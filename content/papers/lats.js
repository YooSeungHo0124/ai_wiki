WIKI.paper({
slug:'lats',
venue:'ICML 2024',
authors:'Zhou, Yan, Shlapentokh-Rothman et al. (UIUC · Lapis Labs)',
arxiv:'2310.04406',

tldr:'[ToT](#/p/tot)의 트리 탐색, [ReAct](#/p/react)의 행동, [Reflexion](#/p/reflexion)의 자기반성을 **몬테카를로 트리 탐색(MCTS)** 하나로 묶은 프레임워크. 환경에서 받은 실제 피드백을 가치 함수에 반영한다는 점이 순수 추론 트리 탐색과 다르다.',

context:'[ToT](#/p/tot)는 여러 추론 경로를 트리로 탐색하지만 각 경로의 가치를 LLM 스스로 매길 뿐 **외부 환경의 실제 피드백**을 받지 않는다. [ReAct](#/p/react)는 환경과 상호작용하며 행동하지만 앞을 내다보는 탐색이 없어 한 번 잘못된 방향으로 가면 되돌리기 어렵다. [Reflexion](#/p/reflexion)은 실패 후 자기반성으로 다음 시도를 개선하지만 그 반성이 트리 구조 탐색과 결합되지는 않았다. 저자들의 질문은 **"추론(reasoning)·행동(acting)·계획(planning)을 하나의 탐색 알고리즘으로 통합할 수 있는가"**다.',

ideas:[
 {h:'MCTS를 언어 에이전트에 맞게 재해석',
  lead:'상태를 "입력+행동열+관측열"로 정의하고, LLM 자신을 정책·가치함수·피드백 생성기로 동시에 쓴다.',
  d:'표준 MCTS는 시뮬레이션을 위해 환경을 되돌릴 수 있는 world model이 필요하지만, 많은 LM 과제는 상태를 편하게 리셋할 수 있어 이 가정이 부담스럽지 않다. LATS는 $p_\\theta$ 하나를 재활용해 다음 행동을 제안하는 에이전트, 상태를 평가하는 가치 함수, 실패를 설명하는 피드백 생성기 역할을 모두 맡긴다 — 별도의 world model 학습이 필요 없다는 점이 RAP류 내부 시뮬레이션 방식과의 차이다.'},
 {h:'여섯 연산의 루프: 선택→확장→평가→시뮬레이션→역전파→반성',
  lead:'UCT로 유망한 노드를 고르고, 실패하면 반성을 다음 시도의 맥락에 추가하는 루프를 돈다.',
  d:'선택(UCT로 트리를 내려감)·확장($n$개의 행동을 샘플링해 자식 노드 생성)·평가(가치 함수로 스칼라 점수 부여)·시뮬레이션(터미널 상태까지 진행)·역전파(결과를 경로의 모든 노드에 반영)·반성(실패 시 자연어 반성을 생성해 다음 시도에 추가) 여섯 단계를 예산 소진 또는 성공까지 반복한다.'},
 {h:'가치 함수에 환경 피드백을 넣는다',
  lead:'점수를 LLM 스스로 매기지 않고 환경 관측을 받은 뒤에 매겨, ToT보다 정확한 가치 평가를 얻는다.',
  d:'[ToT](#/p/tot)에서 빌려온 아이디어는 "LLM에게 상태의 정답 가능성을 스스로 추론시켜 점수화"하는 것이지만, LATS는 이 점수를 **환경 피드백을 받은 뒤**에 매긴다는 점이 다르다. 여기에 같은 상태에서 여러 번 샘플링한 행동들의 self-consistency 점수를 섞어 $V(s)=\\lambda \\cdot LM(s) + (1-\\lambda)\\cdot SC(s)$ 형태의 가치 함수를 만든다.'},
 {h:'반성(reflection)을 탐색의 다음 회차에 주입',
  lead:'시도가 실패하면 왜 실패했는지 자연어로 반성해, 다음 트리 탐색의 맥락으로 재사용한다.',
  d:'[Reflexion](#/p/reflexion)의 핵심 아이디어를 트리 탐색 루프 안에 넣은 것이다. 한 번의 root-to-leaf 시도가 실패로 끝나면 그 경로에 대한 반성을 생성해 저장하고, 이후 탐색에서 같은 실수를 반복하지 않도록 맥락에 포함시킨다.'}
],

diagram:{type:'loop', cap:'선택부터 반성까지 여섯 연산이 예산 소진 혹은 성공까지 반복된다. 트리 탐색(ToT)에 환경 피드백과 자기반성이 결합된 것이 핵심.',
 center:'예산 소진 또는 성공까지 반복',
 nodes:[
  {t:'Selection', s:'UCT로 유망 노드 선택'},
  {t:'Expansion', s:'n개 행동 샘플링'},
  {t:'Evaluation', s:'환경 피드백 후 채점', acc:true},
  {t:'Simulation', s:'터미널까지 진행'},
  {t:'역전파+반성', s:'값 갱신 + 실패 반성'}
 ]},

math:[
 {expr:'V(s) = λ·LM(s) + (1-λ)·SC(s)',
  tex:'V(s) = \\lambda \\cdot \\text{LM}(s) + (1-\\lambda)\\cdot \\text{SC}(s)',
  d:'LLM 자기평가 점수 LM(s)와 같은 상태에서 반복 샘플링한 행동들의 self-consistency 점수 SC(s)를 하이퍼파라미터 $\\lambda$로 섞은 값 함수. 학습 없이(gradient-free) 가치 함수를 만드는 것이 핵심이다.'}
],

numbers:[
 {k:'HotpotQA EM (CoT+ReAct 결합)', v:'0.71', d:'GPT-3.5, ReAct 0.32·Reflexion 0.51·RAP 0.60 대비 최고'},
 {k:'HumanEval Pass@1 (GPT-4)', v:'92.7%', d:'논문 발표 시점 기준 최고 성능(SOTA), Reflexion 91.0% 대비 소폭 우위'},
 {k:'HumanEval Pass@1 (GPT-3.5)', v:'83.8%', d:'ReAct 56.9%, Reflexion 68.1% 대비 큰 폭 우위'},
 {k:'성공까지 평균 확장 노드 수', v:'LATS 28.4 vs RAP 31.5 vs ToT 34.0', d:'k=10 기준, HotpotQA — 같은 시행 예산에서 더 적은 탐색으로 성공'},
 {k:'노드 수 절감', v:'RAP 대비 평균 3.55개 · ToT 대비 12.12개 적음', d:'성공한 탐색만 집계 — 실패 궤적까지 포함하면 격차는 더 커진다고 저자가 언급'}
],

impact:'추론 전용 탐색(ToT)과 행동 전용 에이전트(ReAct), 사후 반성(Reflexion)이 서로 다른 논문에서 따로 검증된 세 가지 축이었는데, LATS는 이들이 MCTS라는 하나의 탐색 루프 안에서 같이 작동할 수 있음을 보였다. 특히 **가치 함수가 실제 환경 관측 이후에 매겨진다**는 설계가, 순수 자기평가에 의존하는 트리 탐색보다 더 적은 탐색으로 더 높은 성공률을 낸다는 것을 수치로 보여준 것이 실용적 기여다.',

legacy:[
 '**탐색+행동+반성 통합 패턴**이 이후 에이전트형 벤치마크(SWE-bench류 코딩 에이전트 등)에서 "가치 함수 기반 트리 탐색" 계열 방법의 참조점이 됨',
 '[GoT](#/p/got)가 그래프로 일반화하는 방향을 택한 것과 달리, LATS는 **탐색 알고리즘(MCTS)과 환경 피드백**으로 일반화하는 다른 축을 취해 이후 연구가 "구조를 바꿀지 탐색 방식을 바꿀지"를 나누어 고민하게 만듦',
 '**gradient-free 가치 함수**라는 설계가, 별도의 보상 모델이나 파인튜닝 없이 탐색 품질을 올릴 수 있다는 근거로 후속 에이전트 연구에 인용됨',
 '저자들이 직접 지적한 "reversion(상태 되돌리기) 가정"의 한계가, 이후 되돌릴 수 없는 실환경(웹·로봇)에서의 탐색형 에이전트 연구의 출발점이 됨'
],

pitfalls:[
 '**탐색 비용이 명시적으로 더 높다.** 저자들이 논문 말미 Limitations에서 "LATS has a higher computational cost compared to simpler prompting methods like ReAct or Reflexion"이라고 직접 인정한다 — 트리 탐색 자체가 여러 후보 행동을 매 단계 샘플링하므로 단일 경로 방법보다 LLM 호출이 근본적으로 많다.',
 '**"노드 수가 적다"는 비교는 성공한 탐색만 집계한 것이다.** 실패한 궤적까지 포함하면 토큰 격차가 더 벌어진다고 논문이 스스로 밝히므로, Table 9·10의 절감 수치를 전체 평균 비용으로 오해하면 안 된다.',
 '**상태를 되돌릴 수 있어야 한다는 가정이 있다.** 논문이 "LATS assumes the ability to revert to earlier states"라고 명시하며, 이는 코딩·QA처럼 리셋이 쉬운 과제에서는 문제없지만 실제 웹 트랜잭션이나 로봇 조작처럼 되돌릴 수 없는 환경에서는 그대로 적용하기 어렵다.'
],

figures:[
 {f:'fig1-overview.png',
  cap:'LLM Agent가 행동을 내면 Environment가 관측/보상을 돌려주고, 이것이 Context·Memory를 거쳐 Tree Search의 값(Values)으로 들어간다. Tree Search가 고른 Best Node가 다시 LLM Agent의 다음 행동을 결정하는 폐루프 구조.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-operations.png',
  cap:'왼쪽부터 Selection(빨간 화살표로 유망한 자식 선택)→Expansion(자식 노드 생성)→Evaluation(LM이 값 산출)→Simulation(터미널까지 진행, 위쪽 화살표는 상위 값 갱신 신호)→Backpropagation→Reflection(실패 시 반성문 생성) 순서. 빨간 노드·화살표가 "지금 탐색 중인" 경로다.',
  src:'원문 Figure 2, p.5'}
],

quotes:[
 {t:'LATS has a higher computational cost compared to simpler prompting methods like ReAct or Reflexion, which may limit its practicality in certain situations.',
  src:'Limitations and future directions, p.9'}
],

links:[
 {t:'arXiv 2310.04406 — LATS', u:'https://arxiv.org/abs/2310.04406'},
 {t:'lapisrocks/LanguageAgentTreeSearch (GitHub)', u:'https://github.com/lapisrocks/LanguageAgentTreeSearch'}
]
});
