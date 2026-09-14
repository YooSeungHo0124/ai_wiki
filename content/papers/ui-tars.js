WIKI.paper({
slug:'ui-tars',
venue:'arXiv 2025 (preprint)',
authors:'Qin, Ye, Fang, Wang, Liang et al. (ByteDance)',
arxiv:'2501.12326',

tldr:'GPT-4o를 접근성 트리·HTML 같은 부가 정보와 함께 프레임워크로 조립하던 방식 대신, **스크린샷 하나만 보고 GUI를 끝까지 조작**하는 종단간(end-to-end) 네이티브 에이전트 모델. OSWorld·AndroidWorld 등 10개 넘는 벤치마크에서 GPT-4o·Claude Computer Use를 앞섰다.',

context:'2024년까지 GUI 에이전트의 주류 방식은 GPT-4o 같은 범용 VLM을 **모듈화된 프레임워크**에 끼워 넣는 것이었다 — 화면 인식은 별도 perception 모델이나 접근성 트리(accessibility tree)·DOM에 맡기고, 계획은 LLM이, 클릭 좌표 추정(grounding)은 또 다른 전용 모델이 담당하는 식이다. 이런 조립형 구조는 각 모듈을 따로 만들기는 쉽지만, 한 모듈의 오류가 다음 모듈로 전파되고 실제 배포 환경마다 접근성 트리·DOM 접근이 항상 가능한 것도 아니라 일반화가 잘 안 됐다. UI-TARS는 질문을 바꾼다 — 사람처럼 **화면을 보고 바로 행동**하는 하나의 모델을 만들면 어떨까?',

ideas:[
 {h:'스크린샷만 보는 종단간 네이티브 에이전트',
  lead:'접근성 트리·HTML 없이 화면 이미지만으로 인식·계획·행동을 한 모델이 다 한다.',
  d:'perception·grounding·reasoning을 분리된 모듈로 조립하던 기존 구조를 하나의 모델 안으로 내재화했다. 입력은 오직 스크린샷과 과거 상호작용 기록뿐이고, 출력은 클릭·타이핑 같은 행동이다. 모듈 간 인터페이스 불일치나 접근성 트리 부재 같은 환경 제약에서 자유로워진다.'},
 {h:'통일된 행동 공간',
  lead:'Windows의 click·mobile의 tap처럼 플랫폼마다 다른 행동을 하나의 스키마로 통일했다.',
  d:'데스크톱·모바일·웹마다 "클릭"에 해당하는 동작 이름과 파라미터가 다르다. UI-TARS는 이 차이를 하나의 통일된 행동 공간으로 흡수해, 같은 모델이 플랫폼을 넘나들며 대규모 action trace 데이터로 학습될 수 있게 했다.'},
 {h:'System-2 추론: 행동 전에 "생각"을 명시적으로 생성',
  lead:'각 행동 전에 과제 분해·마일스톤 인식·반성(reflection)을 담은 thought를 만든다.',
  d:'[ReAct](#/p/react)의 반영 메커니즘에서 착안했지만 더 구조화된 형태를 쓴다. 과제를 하위 목표로 쪼개는 task decomposition, 지금까지 진행 상황을 가늠하는 milestone recognition, 과거 행동의 잘못을 찾아 복구 경로를 제시하는 reflection을 명시적 thought로 매 스텝 생성한 뒤에 행동을 낸다. GUI 튜토리얼로 추론을 보강하고(reasoning enrichment), thought를 사람이 보강하는 방식(thought augmentation)으로 이 능력을 주입했다.'},
 {h:'반성 튜닝(reflection tuning)으로 오류 복구를 학습',
  lead:'실패 궤적에 사람이 복구 단계를 덧붙여 오류를 스스로 알아채고 고치게 학습한다.',
  d:'별도 반성 능력이 없으면 에이전트는 같은 클릭을 반복하며 루프에 갇히기 쉽다. UI-TARS는 실패한 궤적을 모아(pre-reflection) 주석자가 복구 단계를 시뮬레이션해 덧붙이고(post-reflection), 이 쌍으로 학습시켜 모델이 실수를 인식하고 스스로 복구하도록 만들었다.'},
 {h:'온라인 트레이스 부트스트래핑과 Agent DPO로 반복 개선',
  lead:'배포 후 쌓인 상호작용 기록을 다시 학습에 넣어 지속적으로 자기개선한다.',
  d:'모델을 한 번 학습시키고 끝내지 않고, 온라인으로 수집한 궤적을 새로운 학습 데이터로 부트스트래핑하고 선호 데이터로 Agent DPO를 적용해 반복적으로 개선한다. 사람이 매번 새 데이터를 만드는 대신 모델 자신의 경험을 학습 신호로 재활용하는 구조다.'}
],

diagram:{type:'loop', cap:'UI-TARS의 실행 루프. 스크린샷을 관찰하고, thought를 생성한 뒤, PyAutoGUI로 행동을 실행한다 — 접근성 트리 없이 화면만 오간다.',
 center:'스크린샷 기반 반복',
 nodes:[
  {t:'관찰', s:'스크린샷만'},
  {t:'Thought 생성', s:'계획·반성', acc:true},
  {t:'행동 실행', s:'PyAutoGUI'},
  {t:'화면 갱신', s:'다음 관찰로'}
 ]},

math:[
 {expr:'(instruction, (o1,t1,a1), (o2,t2,a2), ..., (on,tn,an))',
  tex:'\\big(\\text{instruction},\\ (o_1,t_1,a_1),\\ (o_2,t_2,a_2),\\ \\dots,\\ (o_n,t_n,a_n)\\big)',
  d:'$o_i$는 스크린샷 관찰, $t_i$는 행동 전에 생성되는 System-2 thought, $a_i$는 실행되는 행동. thought를 넣기 전 기본형은 $t_i$가 빠진 $(o_i,a_i)$ 시퀀스였다.'}
],

numbers:[
 {k:'OSWorld (50 스텝)', v:'UI-TARS-72B 24.6', d:'Claude Computer Use의 22.0 상회 (§1 Overall Performance)'},
 {k:'OSWorld (15 스텝)', v:'UI-TARS-72B 22.7', d:'Claude 14.9 대비 우위, 스텝 예산이 적어도 격차 유지 (§1)'},
 {k:'AndroidWorld', v:'UI-TARS 46.6', d:'GPT-4o의 34.5를 상회 (§1)'},
 {k:'VisualWebBench', v:'UI-TARS-72B 82.8', d:'GPT-4o의 78.5 상회, 인식(perception) 능력 벤치마크 (§1)'},
 {k:'ScreenSpot Pro', v:'UI-TARS 38.1 (SOTA)', d:'GUI 요소 좌표 grounding 난이도 높은 벤치마크 (§1)'}
],

impact:'UI-TARS는 "GUI 에이전트는 LLM 계획 + 전용 grounding 모델 + 접근성 트리"라는 조립형 표준을 스크린샷만 보는 종단간 모델로 대체할 수 있음을 여러 벤치마크에서 실증했다. System-2 reasoning과 reflection tuning을 하나의 학습 파이프라인에 엮은 구성은 이후 스크린샷 기반 컴퓨터 사용 에이전트 연구들의 참조 아키텍처가 되었고, 온라인 트레이스 부트스트래핑은 "배포 후에도 계속 개선되는 에이전트"라는 방향을 제시했다.',

legacy:[
 '**스크린샷 전용 네이티브 에이전트 계열의 확산** — 접근성 트리·DOM 의존을 줄이고 시각 입력만으로 동작하는 후속 GUI 에이전트 연구에 영향',
 '**reflection tuning의 재사용** — 실패-복구 쌍으로 오류 회복을 학습시키는 방식이 이후 다른 에이전트 도메인에도 확산',
 '**Agent S2 등 후속 비교 기준** — 이후 컴퓨터 사용 에이전트 연구가 UI-TARS를 grounding·종단간 설계의 비교 대상으로 인용',
 '**온라인 자기개선 파이프라인의 사례** — 배포 후 궤적을 다시 학습에 넣는 구조가 상용 에이전트의 지속 학습 논의에 참조됨'
],

pitfalls:[
 '**"접근성 트리를 쓰면 안 된다"는 결론이 아니다.** 이 논문은 스크린샷만으로도 경쟁력 있는 성능이 가능함을 보였을 뿐, 접근성 트리 등 부가 정보가 항상 해롭다고 주장하지 않는다.',
 '**수치는 2025년 초 발표 시점, 72B 모델 기준이다.** 모델 크기(7B/72B)에 따라 성능 차이가 크므로 어떤 규모의 결과인지 확인해야 한다.',
 '**System-2 reasoning은 매 스텝 thought를 생성하므로 추론 비용이 늘어난다.** 속도·비용 민감한 배포에서는 이 트레이드오프를 고려해야 한다.'
],

figures:[
 {f:'fig4-loop.png',
  cap:'UI-TARS의 실행 루프(Figure 4 상단). 위쪽 모니터 아이콘에서 나온 관찰(Observation)이 흘러 들어가고, 빨간·주황 상자들이 매 스텝의 thought(분홍 말풍선, 예: "Word 아이콘이 있으니 더블클릭해야 한다")와 그에 이어지는 행동(action)이다. PyAutoGUI가 실제 클릭·타이핑을 실행해 화면을 바꾸고, 그 결과가 다시 관찰로 돌아온다.',
  src:'원문 Figure 4, p.14'}
],

links:[
 {t:'arXiv 2501.12326 — UI-TARS', u:'https://arxiv.org/abs/2501.12326'},
 {t:'GitHub — bytedance/UI-TARS', u:'https://github.com/bytedance/UI-TARS'}
]
});
