WIKI.paper({
slug:'agent-s2',
venue:'arXiv 2025 (preprint)',
authors:'Agashe, Wong, Tu, Yang, Li, Wang (Simular Research)',
arxiv:'2504.00906',

tldr:'컴퓨터 사용 에이전트의 진짜 병목은 "무엇을 할지"가 아니라 "화면의 그 버튼이 정확히 어디 있는지"(grounding)라는 진단에서 출발해, 계획은 범용 모델에 맡기고 **좌표 추정만 전문가 그룹(Mixture-of-Grounding)에 위임**하는 계층적 구조를 제안한다. OSWorld·WindowsAgentArena·AndroidWorld에서 Claude Computer Use·UI-TARS를 상회했다.',

context:'컴퓨터 사용 에이전트는 크게 두 갈래로 만들어져 왔다 — (1) 하나의 범용(monolithic) 모델이 계획·실행·grounding을 전부 담당하게 하거나, (2) 계획·실행·grounding을 여러 모델로 나눈 계층적(hierarchical) 파이프라인을 조립하는 방식이다. 범용 모델 방식은 대규모 데이터로 grounding까지 함께 학습시켜야 해서 비용이 크고, 계층적 방식은 실행(Worker)을 맡은 모듈이 행동 생성과 요소 위치추정을 동시에 떠안으면서 그 모듈 자체가 병목이 되는 문제가 있었다. [OSWorld](#/p/osworld) 기준 사람과 에이전트 사이에는 약 40%p의 성능 격차가 있었는데, 저자들은 이 격차의 상당 부분이 **계획의 실패가 아니라 화면 속 요소를 정확히 못 찍는 grounding 실패**에서 온다고 진단한다.',

ideas:[
 {h:'Manager-Worker 계층 구조로 역할을 분리',
  lead:'상위 Manager가 하위목표를 쪼개고, 하위 Worker가 그 목표를 실제 행동으로 옮긴다.',
  d:'Manager $M$은 사용자 지시 $I$를 상위 하위목표 시퀀스 $g_0, g_1, \\dots, g_N$으로 분해하는 상위 의미 공간에서 동작한다. Worker $W$는 그중 현재 하위목표 하나를 받아 클릭·타이핑 같은 원자적 행동 $a_0, a_1, \\dots, a_t$로 구체화하는 하위 의미 공간에서 동작한다. 계획과 실행을 다른 인지 수준으로 명확히 나눈다.'},
 {h:'Mixture-of-Grounding: 좌표 추정을 전문가에게 위임',
  lead:'Worker는 행동만 언어로 기술하고, 실제 픽셀 좌표는 grounding 전문가가 계산한다.',
  d:'Worker가 "저장 버튼을 클릭"처럼 목표 위치를 언어로 기술한 행동을 만들면, 이 행동을 [Mixture-of-Experts](#/c/moe)처럼 게이팅해 알맞은 grounding 전문가 $G_i$로 라우팅한다. 시각 기반(스크린샷만으로 좌표 추정), 텍스트 기반(세밀한 텍스트 위치 찾기), 구조 기반(표의 행·열처럼 구조화된 UI 요소) 등 성격이 다른 grounding 전문가를 따로 둬, Worker는 "무엇을 클릭할지"만 추론하고 "어디에 있는지"는 전문가가 맡는다.'},
 {h:'스크린샷 전용 시각 grounding 전문가',
  lead:'접근성 트리·HTML 없이 스크린샷만으로 좌표를 추정하는 전문가를 둔다.',
  d:'시각 grounding 전문가는 현재 관찰(스크린샷)과 행동 기술을 입력받아 좌표를 직접 낸다. 이는 접근성 트리·HTML처럼 항상 확보할 수 없는 부가 정보에 의존하지 않아도 되게 하며, [UI-TARS](#/p/ui-tars)가 강조한 "스크린샷만으로 충분하다"는 방향과 맞닿는다.'},
 {h:'Proactive Hierarchical Planning: 매 하위목표마다 다시 계획',
  lead:'하나의 하위목표가 끝날 때마다 Manager가 남은 계획을 다시 세운다.',
  d:'긴 호흡의 과제는 중간에 화면 상태가 예상과 달라지는 일이 잦다. Agent S2는 Worker가 하위목표 하나를 SUCCESS/FAILURE로 마칠 때마다 제어권을 Manager에게 돌려주고, Manager는 이전 하위목표들의 맥락을 유지하면서 최신 관찰을 반영해 남은 계획을 다시 세운다. 계획을 한 번만 세우고 끝까지 밀어붙이는 반응형(reactive) 방식의 한계를 이렇게 보완한다.'},
 {h:'지식 베이스 재사용',
  lead:'이전 Agent S의 상위·하위 상호작용 경험과 웹 지식을 그대로 활용한다.',
  d:'컴퓨터 사용 과제는 애플리케이션마다 특화된 지식이 필요하다. Agent S2는 전작 Agent S의 지식 베이스(고수준 과제 경험, 저수준 하위목표 경험, 웹 지식)를 이어받아 별도 처음부터 다시 쌓지 않고 재사용한다.'}
],

diagram:{type:'stack', cap:'Agent S2 계층 구조. Manager가 하위목표를 내면 Worker가 반복 실행하고, 각 행동은 Mixture-of-Grounding 전문가로 라우팅된다.',
 layers:[
  {t:'Manager', s:'하위목표 분해', note:'상위 의미 공간'},
  {t:'하위목표 gₜ', s:'매 완료마다 재계획'},
  {t:'Worker', s:'원자 행동 생성', acc:true, note:'클릭·타이핑 등'},
  {t:'MoG 전문가', s:'시각·텍스트·구조', note:'좌표만 전담'},
  {t:'행동 실행', s:'픽셀 좌표로 클릭'}
 ]},

numbers:[
 {k:'OSWorld 15-step', v:'27.0%', d:'OpenAI CUA 19.7%·Agent S 20.6% 상회, Claude Computer Use 대비 18.9% 상대 개선 (Table, §1)'},
 {k:'OSWorld 50-step', v:'34.5%', d:'UI-TARS 대비 32.7% 상대 개선 (Abstract)'},
 {k:'WindowsAgentArena', v:'이전 최고 대비 +52.8% 상대 개선', d:'다른 OS로 일반화되는지 확인하는 벤치마크 (Abstract)'},
 {k:'AndroidWorld', v:'54.3%, 이전 최고 대비 +16.5% 상대 개선', d:'데스크톱뿐 아니라 모바일 환경으로도 확장 검증 (Abstract, §1)'}
],

impact:'Agent S2는 "컴퓨터 사용 에이전트가 왜 실패하는가"라는 질문을 계획 실패가 아니라 grounding 실패로 재조준했다. Mixture-of-Grounding은 하나의 범용 모델이나 단일 grounding 모델에 의존하지 않고 UI 요소의 성격(시각·텍스트·구조)에 따라 전문가를 나눠 쓴다는 발상을 구체화했고, Proactive Hierarchical Planning은 계층적 에이전트가 흔히 겪는 "한 번 세운 계획을 끝까지 못 바꾼다"는 경직성 문제에 대한 구체적 해법으로 제시되어 이후 컴퓨터/GUI 사용 에이전트 설계에서 참조되는 패턴이 되었다.',

legacy:[
 '**grounding 병목 진단의 재확인** — 계획보다 좌표 추정이 실패 원인이라는 관찰이 이후 GUI 에이전트 연구의 진단 프레임으로 자주 인용됨',
 '**전문가 혼합형 grounding의 사례** — 단일 grounding 모델 대신 성격별 전문가를 두는 구조가 후속 컴퓨터 사용 에이전트 설계에 참조됨',
 '**동적 재계획 패턴의 확산** — 하위목표마다 다시 계획하는 구조가 장기 호흡 계층적 에이전트의 표준 설계 요소 중 하나로 자리잡음'
],

pitfalls:[
 '**수치는 발표 시점(2025년 상반기) 기준 OSWorld/WindowsAgentArena/AndroidWorld 리더보드다.** 이후 UI-TARS 후속판이나 다른 에이전트가 이 기록을 갱신했을 수 있으므로 "현재 최고"로 오해하면 안 된다.',
 '**15-step과 50-step 평가는 서로 다른 조건이다.** 같은 OSWorld라도 스텝 예산이 다르면 절대 수치를 직접 비교할 수 없다.',
 '**grounding을 전문가로 나눴다고 해서 grounding 오류가 사라지는 것은 아니다.** 라우팅 자체가 틀리면 잘못된 전문가에게 행동이 넘어갈 수 있다는 구조적 한계는 남는다.'
],

figures:[
 {f:'fig2-framework.png',
  cap:'Manager(M, 보라)가 하위목표 gₜ를 만들어 Worker(W, 초록)에게 넘기고, Worker는 매 행동마다 Mixture of Grounding(MoG, 파랑)의 전문가 G1·G2·G3 중 하나로 라우팅해 실제 행동 at를 만든다. 하위목표가 끝날 때마다(gₜ₊₃, gₜ₊₅ 시점) Manager가 다시 개입해 남은 계획을 갱신한다.',
  src:'원문 Figure 2, p.4'}
],

links:[
 {t:'arXiv 2504.00906 — Agent S2', u:'https://arxiv.org/abs/2504.00906'},
 {t:'GitHub — simular-ai/Agent-S', u:'https://github.com/simular-ai/Agent-S'},
 {t:'UI-TARS (스크린샷 전용 종단간 에이전트)', u:'#/p/ui-tars'}
]
});
