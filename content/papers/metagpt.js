WIKI.paper({
slug:'metagpt',
venue:'ICLR 2024',
authors:'Hong, Zhuge, Chen et al. (DeepWisdom · KAUST · CUHK-Shenzhen 등)',
arxiv:'2308.00352',

tldr:'다중 에이전트에게 자유 대화 대신 **소프트웨어 회사의 표준 운영 절차(SOP)** 를 이식한 프레임워크. 제품기획자·설계자·개발자 같은 역할이 자연어 잡담이 아니라 PRD·설계문서 같은 **구조화된 산출물**을 주고받게 만들어, 대화가 길어질수록 정보가 왜곡되는 문제를 줄였다.',

context:'[CAMEL](#/p/camel)과 [AutoGen](#/p/autogen)이 보여준 것처럼 LLM 에이전트를 여럿 붙이면 협업이 가능하지만, 에이전트끼리 **자유 형식 자연어**로만 대화하면 문제가 생긴다. 대화가 길어질수록 마치 "전화 게임(Chinese whispers)"처럼 정보가 조금씩 왜곡되고, 서로 안부 인사만 반복하는 무의미한 턴이 늘어나며, 이런 오류가 다음 단계로 그대로 전파되는 **cascading hallucination**이 누적된다. 저자들은 사람 조직이 이미 이 문제를 SOP로 풀어 왔다는 데서 착안한다 — 제품기획자는 PRD를, 설계자는 설계 문서를 정해진 형식으로 넘기지 잡담으로 넘기지 않는다.',

ideas:[
 {h:'역할 특화: 다섯 개의 고정 직군',
  lead:'제품기획자·설계자·프로젝트관리자·엔지니어·QA 다섯 역할이 소프트웨어 회사처럼 나뉜다.',
  d:'각 에이전트에는 이름·프로필·목표·제약이라는 프로필이 부여되고, 역할에 맞는 도구도 다르다 — 제품기획자는 웹 검색을, 엔지니어는 코드 실행을 쓴다. 모든 에이전트는 [ReAct](#/p/react) 스타일로 환경(메시지 풀)을 관찰하고 행동한다. 역할을 명확히 나누는 것 자체가 복잡한 작업을 더 작고 구체적인 하위 작업으로 쪼개는 장치다.'},
 {h:'구조화된 통신: 대화가 아니라 문서로 주고받는다',
  lead:'PRD·시스템 설계·태스크 목록처럼 정해진 스키마의 문서로 소통해 정보 왜곡을 막는다.',
  d:'ChatDev 같은 이전 다중 에이전트 시스템은 대화(dialogue)로 정보를 주고받았지만, MetaGPT는 각 역할이 **정해진 형식**(PRD, File List, Data Structures, Interface Definitions 등)의 산출물을 만들어 다음 역할에 넘긴다. 형식이 고정돼 있으므로 다음 역할이 필요한 정보를 놓치거나 무관한 잡담에 묻히는 일이 줄어든다는 것이 논문의 핵심 논거다.'},
 {h:'공유 메시지 풀 + 구독: 1:1 문의를 없앤다',
  lead:'모든 산출물을 전역 풀에 발행하고, 각 역할은 자기 역할과 관련된 것만 구독해 받는다.',
  d:'모두에게 모든 정보를 뿌리면 정보 과부하가 생기므로, 역할별 관심사에 따라 필요한 문서만 구독(subscribe)하게 한다. 예컨대 Architect는 주로 Product Manager의 PRD를 구독하고, QA Engineer가 만든 문서에는 상대적으로 관심이 적다. 에이전트는 자신이 필요로 하는 선행 의존성이 모두 도착한 뒤에야 행동을 시작한다.'},
 {h:'실행 가능한 피드백: 코드를 실제로 돌려서 자가수정',
  lead:'생성한 코드를 실제로 실행해 에러를 관찰하고 반복적으로 고치는 루프를 넣었다.',
  d:'초기 구현에서는 LLM의 환각 때문에 리뷰 단계가 실제 오류를 놓치는 경우가 있었다. 이를 보완하기 위해 Engineer가 코드를 작성한 뒤 **실제로 실행**해서 나온 에러를 다시 피드백으로 받아 반복 수정하는 메커니즘을 추가했다. 이 피드백만으로 HumanEval Pass@1이 4.2%p, MBPP가 5.4%p 개선됐다.'}
],

diagram:{type:'flow', cap:'요구사항 한 줄에서 시작해 다섯 역할이 SOP 순서대로 문서를 만들어 넘기며 완성된 소프트웨어에 도달한다.',
 nodes:[
  {t:'PM: PRD 작성', s:'요구사항 → 문서'},
  {t:'Architect', s:'시스템 설계', acc:true, a:'설계문서'},
  {t:'Project Mgr', s:'태스크 분배'},
  {t:'Engineer', s:'코드 작성+실행'},
  {t:'QA Engineer', s:'테스트 케이스'}
 ]},

numbers:[
 {k:'HumanEval Pass@1', v:'85.9%', d:'MBPP는 87.7% — 논문 시점 기준 두 벤치마크 새 SOTA'},
 {k:'실행 가능성(SoftwareDev)', v:'3.75 / 4.0', d:'ChatDev 2.25 대비 — 4점 만점 중 "거의 완벽"'},
 {k:'실행 시간', v:'541초', d:'ChatDev 762초보다 짧음 (feedback 포함 버전)'},
 {k:'토큰 비용', v:'31,255 토큰', d:'ChatDev 19,292보다 많지만, 코드 한 줄당 토큰은 124.3 < ChatDev 248.9'},
 {k:'역할 수에 따른 비용·품질(ablation)', v:'Engineer만: $0.915·실행성1.0 → 4역할: $1.385·실행성4.0', d:'역할을 늘릴수록 비용은 소폭 증가하지만 실행 가능성이 크게 개선'},
 {k:'실행 가능 피드백의 효과', v:'HumanEval +4.2%p · MBPP +5.4%p', d:'Pass@1 기준, 피드백 유무 비교'}
],

impact:'다중 에이전트 협업의 병목이 "더 똑똑한 대화 능력"이 아니라 **정보 전달 방식** 자체에 있다는 것을 보였다. 자연어 대화 대신 문서라는 중간 산출물로 소통하면, 사람 조직에서 이미 검증된 SOP를 그대로 프롬프트 시퀀스로 인코딩할 수 있다는 것이 이 논문의 실용적 기여다. 코드를 실제로 실행해 피드백을 받는 loop 역시, 순수 텍스트 리뷰만으로는 못 잡는 오류를 잡는다는 것을 정량적으로 보였다.',

legacy:[
 '**구조화된 산출물 기반 협업**이 이후 코드 생성 다중 에이전트 프레임워크(ChatDev 계열, 여러 후속 SWE 에이전트)의 공통 설계 요소로 자리잡음',
 '**공유 메시지 풀 + 구독** 패턴이 [AutoGen](#/p/autogen)의 `GroupChat`류 오케스트레이션과 별도로, "누가 무엇을 볼지"를 명시적으로 제한하는 대안 설계로 참조됨',
 '**실행 가능한 피드백**이라는 아이디어가 코드 에이전트 전반에서 "생성 후 정적 리뷰"보다 "실제 실행 후 관찰"이 낫다는 흐름을 강화',
 '**AgentStore/SoftwareDev 같은 벤치마크·데모**가 이후 소프트웨어 생성 에이전트 평가의 참고 사례로 인용됨'
],

pitfalls:[
 '**"문서로 소통하면 오류가 안 생긴다"가 아니라 "덜 생긴다"이다.** 표 1의 실행성 3.75/4.0도 완벽(4.0)은 아니며, 사람 리비전 비용(Human Revision Cost)이 0.83으로 줄었을 뿐 0은 아니다.',
 '**비용을 숨기지 않는 편이지만 절대 금액(API 요금)은 논문에 없다.** 토큰 사용량(24,613~31,255)과 ablation의 상대 비용($0.915~$1.385, 아마 특정 시점의 GPT-4 가격 기준 추정치)만 보고되므로, 현재 모델 가격으로 환산해 재계산해야 실무 판단에 쓸 수 있다.',
 '**역할을 늘릴수록 무조건 좋아지는 것은 아니다.** Table 3 ablation에서 4역할 조합(Engineer+PM+Architect+Project)의 Lines(191.0)가 3역할 조합(Architect 포함, 205.0)보다 오히려 적은 등, 역할 추가의 효과가 항상 선형적이지 않다는 점이 수치에 그대로 드러난다.'
],

figures:[
 {f:'fig1-sop.png',
  cap:'왼쪽이 MetaGPT 내부 SOP: Product Manager→Architect→Project Manager→Engineer→QA Engineer 순서로 각 화살표가 문서(요구사항 문서·시스템 설계·태스크·코드)를 나타낸다. 오른쪽 "Human interaction"은 사람이 한 줄 요구사항만 주고 마지막에 인수 검사만 하면 된다는 것을 보여준다 — 사람 개입은 시작과 끝 두 지점뿐이다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'MetaGPT encodes Standardized Operating Procedures (SOPs) into prompt sequences for more streamlined workflows, thus allowing agents with human-like domain expertise to verify intermediate results and reduce errors.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2308.00352 — MetaGPT', u:'https://arxiv.org/abs/2308.00352'},
 {t:'geekan/MetaGPT (GitHub)', u:'https://github.com/geekan/MetaGPT'}
]
});
