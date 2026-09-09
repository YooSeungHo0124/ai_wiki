WIKI.paper({
slug:'swe-agent',
venue:'NeurIPS 2024',
authors:'Yang, Jimenez et al. (Princeton Language and Intelligence)',
arxiv:'2405.15793',

tldr:'GPT-4를 그대로 쓰면서 **인터페이스만 다시 설계**해 [SWE-bench](#/p/swe-bench) 해결률을 3.8%에서 12.5%로 끌어올린 논문. 모델이 아니라 "모델이 컴퓨터를 만지는 방식"이 성능을 좌우한다는 것을 실측으로 보였다.',

context:'[SWE-bench](#/p/swe-bench)는 실제 GitHub 이슈를 푸는 벤치마크로 나왔지만, 당시 최선의 접근은 이슈를 읽고 **파일을 검색해 검색된 조각을 모델에 넣은 뒤 patch를 한 번에 생성**하는 비대화형 RAG 방식이었고 해결률은 3.8%에 그쳤다. 반면 LM에게 Linux 셸을 그대로 주고 [ReAct](#/p/react) 식으로 추론과 명령 실행을 반복시키는 에이전트 설정도 있었지만, 셸은 사람 사용자를 위해 설계된 인터페이스라 LM에게는 잘 맞지 않았다. 모델은 `sed`로 한 줄만 잘못 고치거나, 파일 전체를 한 번에 쏟아내 컨텍스트를 낭비하거나, 편집이 실패해도 아무 피드백 없이 다음 턴으로 넘어가는 실수를 반복했다. 저자들은 여기서 질문을 바꾼다 — 모델을 더 키우거나 더 정교한 프롬프트를 쓰는 대신, **LM이라는 새로운 종류의 사용자에게 맞는 인터페이스를 따로 설계하면 어떨까?**',

ideas:[
 {h:'ACI: LM 전용 컴퓨터 인터페이스',
  lead:'사람용 셸 대신 LM 전용 명령 집합을 만들어 에이전트와 컴퓨터 사이에 끼운다.',
  d:'사람이 VSCode·PyCharm 같은 IDE로 raw 파일시스템을 다루듯, LM 에이전트에게도 raw 셸 대신 전용 계층을 준다. 이를 **agent-computer interface(ACI)** 라 부른다. ACI는 파일 보기·검색·편집을 위한 소수의 명령만 노출하고, 각 명령이 실행되면 LM이 다음 판단에 바로 쓸 수 있는 형태로 피드백을 되돌려준다.'},
 {h:'파일 뷰어: 한 번에 100줄만',
  lead:'파일을 통째로 보여주지 않고 100줄 창으로만 보여줘 컨텍스트 낭비를 막는다.',
  d:'파일 전체를 보여주면(entire file) 성능이 12.7%로 떨어지고, 반대로 30줄만 보여줘도 14.3%로 떨어진다. 100줄 창일 때가 18.0%로 가장 좋았다. 너무 적으면 문맥을 놓치고 너무 많으면 컨텍스트가 관련 없는 내용으로 채워져 다음 판단이 흐려진다는 뜻이다.'},
 {h:'편집 명령: 한 번에, 그리고 자동 lint',
  lead:'편집을 한 명령으로 묶고 문법 오류가 나면 그 편집 자체를 되돌린다.',
  d:'`sed`나 파일 전체 재작성(redirection) 대신 범위를 지정해 한 번에 고치는 `edit` 명령 하나로 통합했다. 여기에 편집 직후 자동으로 lint를 돌려 들여쓰기 오류 같은 문법 문제가 생기면 **그 편집을 적용하지 않고 되돌리는** 가드레일을 추가했다. lint가 없으면 15.0%, 편집 명령 자체가 없으면(No edit) 10.3%까지 떨어져, 이 두 장치의 기여가 가장 컸다.'},
 {h:'검색은 무조건 도움이 되지 않는다',
  lead:'결과를 하나씩 보여주는 Iterative search는 오히려 성능을 깎았다.',
  d:'Vim/VSCode식으로 검색 결과를 next/prev로 하나씩 보여주는 Iterative search를 붙이면 12.0%로, 검색 기능이 아예 없을 때(15.7%)보다 낮아졌다. 에이전트가 모든 결과를 지치지 않고 끝까지 순회하다 예산과 컨텍스트를 소진했기 때문이다. 결과를 요약해 한 번에 보여주는 Summarized search가 18.0%로 가장 좋았다 — **더 많은 도구가 항상 더 나은 것은 아니라는** 발견.'},
 {h:'ReAct 루프 자체는 그대로, 그 안의 행동공간을 바꿨다',
  lead:'추론→행동→관찰 루프는 유지하되 행동공간을 사람 셸에서 ACI 명령으로 교체했다.',
  d:'SWE-agent는 새 에이전트 알고리즘을 발명하지 않는다. [ReAct](#/p/react)가 정립한 "생각을 말하고 행동하고 관찰을 받는" 루프를 그대로 쓰되, 그 루프 안에서 LM이 고를 수 있는 **행동의 목록과 각 행동이 돌려주는 관찰의 형식**을 다시 설계했다. 알고리즘이 아니라 행동공간(action space) 자체가 병목이었다는 것이 이 논문의 실증이다.'}
],

diagram:{type:'loop', cap:'ACI를 낀 ReAct 루프. 왼쪽 셸 직접 조작과 달리, 매 턴 LM 친화적 명령과 축약된 피드백만 오간다.',
 center:'ACI 경유 반복',
 nodes:[
  {t:'추론', s:'다음 행동 계획'},
  {t:'ACI 명령 선택', s:'뷰어·편집·검색'},
  {t:'컴퓨터 실행', s:'파일시스템·터미널'},
  {t:'축약 피드백', s:'lint 결과 포함', acc:true}
 ]},

numbers:[
 {k:'SWE-bench 해결률', v:'12.47%', d:'GPT-4 Turbo, 2,294개 전체 test set — 286/2,294 해결'},
 {k:'이전 SOTA 대비', v:'3.8% → 12.47%', d:'비대화형 retrieval-augmented 시스템 대비 **약 3.3배**'},
 {k:'SWE-bench Lite', v:'18.00%', d:'300개 부분집합, ACI 전체 구성 기준(ablation 비교 baseline)'},
 {k:'셸 전용 대비 향상', v:'+10.7%p', d:'같은 GPT-4 Turbo로 default Linux shell만 줬을 때 대비'},
 {k:'HumanEvalFix pass@1', v:'87.7%', d:'Python 87.7 · JS 89.7 · Java 87.9, 기존 SOTA(WaveCoder 57.9) 크게 상회'},
 {k:'Claude 3 Opus 이식', v:'10.5%', d:'ACI는 GPT-4 Turbo용으로 설계됐지만 다른 LM에도 그대로 이식 가능함을 확인'}
],

impact:'이 논문 이후 "에이전트 성능 = 모델 성능"이라는 암묵적 전제가 깨졌다. 같은 GPT-4를 쓰고도 인터페이스 설계만으로 해결률이 3배 넘게 벌어진다는 사실은, 이후 코딩 에이전트 연구의 초점을 **프롬프트 튜닝에서 행동공간·피드백 형식 설계**로 옮겼다. SWE-agent는 오픈소스로 공개되어 이후 SWE-bench 리더보드에 오르는 여러 상용·오픈소스 에이전트(OpenHands, Devin 계열 포함)의 참조 구현이자 비교 기준이 되었다.',

legacy:[
 '**ACI라는 용어의 정착** — "LM을 위한 인터페이스를 따로 설계한다"는 발상이 이후 코딩 에이전트 전반의 설계 원칙으로 자리잡음',
 '**SWE-bench 생태계 확장** — 이 시스템의 trajectory와 파이프라인이 이후 SWE-bench Verified, 여러 후속 에이전트(AutoCodeRover, OpenHands 등)의 출발점이 됨',
 '**"모델이 아니라 인터페이스" 논쟁 촉발** — 이후 tool-use·computer-use 연구에서 행동공간 설계를 모델 스케일링과 별개의 축으로 다루기 시작',
 '**guardrail·lint 통합 편집이 표준화** — 편집 직후 정적 검사로 되돌리는 패턴이 이후 코딩 에이전트 도구 대부분의 기본 구성요소가 됨'
],

pitfalls:[
 '**"셸을 주면 안 된다"는 뜻이 아니다.** 논문의 결론은 특정 셸 명령이 나쁘다는 게 아니라, **어떤 행동공간을 노출하고 어떤 형식으로 피드백을 주는지**가 성능을 좌우한다는 것이다. 더 많은 도구·더 정교한 검색이 항상 이득은 아니라는 Iterative search 결과가 이를 보여준다.',
 '**12.47%는 GPT-4 Turbo 기준의 2024년 수치다.** 이후 더 강한 모델과 개선된 ACI로 SWE-bench 해결률은 빠르게 갱신됐다 — 이 숫자를 현재 SOTA로 오해하면 안 된다.',
 '**비용 제약이 있었다.** 인스턴스당 $4 예산 상한이 있었고, 해결한 인스턴스의 93.0%가 예산을 다 쓰기 전에 제출됐다 — 예산을 늘리면 해결률이 더 올라갈 여지가 있었다는 뜻이지, ACI 설계만으로 성능이 포화됐다는 의미는 아니다.'
],

figures:[
 {f:'fig1-aci.png',
  cap:'SWE-agent(왼쪽) 는 Agent-Computer Interface를 거쳐서만 Computer(오른쪽)와 상호작용한다. 위쪽 화살표가 LM-friendly commands(경로 탐색·검색·보기·편집), 아래쪽 화살표가 LM-friendly environment feedback — 이 왕복이 매 턴 반복되는 ReAct 루프의 한 스텝이다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-aci-vs-ui.png',
  cap:'같은 Computer를 놓고 LM Agent는 ACI(File Viewer·File Editor·Code Search)를, Human은 VSCode·PyCharm 같은 UI를 통해 접근한다. 사람에게 IDE가 필요하듯 LM에게도 전용 인터페이스가 필요하다는 논문의 핵심 비유.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'We show that ACIs tailored specifically for LMs outperform existing user interfaces (UIs) designed for human users, such as the Linux shell.',
  src:'Introduction, p.2'},
 {t:'We argue that LM agents represent a new category of end user, with their own needs and abilities.',
  src:'Section 2, p.2'}
],

links:[
 {t:'arXiv 2405.15793 — SWE-agent', u:'https://arxiv.org/abs/2405.15793'},
 {t:'swe-agent.com (공식 사이트·코드·리더보드)', u:'https://swe-agent.com'},
 {t:'SWE-bench (평가 벤치마크)', u:'#/p/swe-bench'}
]
});
