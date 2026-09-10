WIKI.paper({
slug:'zero-shot-planner',
venue:'arXiv 2022 (CoRL 2022)',
authors:'Huang, Abbeel, Pathak, Mordatch (UC Berkeley · CMU · Google)',
arxiv:'2201.07207',

tldr:'"아침 만들기" 같은 고수준 목표를 [GPT-3](#/p/gpt3) 같은 언어모델이 별도 학습 없이 중간 단계 계획으로 쪼갤 수 있음을 보인 논문. 문제는 그 계획이 로봇이 실제로 실행 가능한 행동과 정확히 맞아떨어지지 않는다는 것이었고, 저자들은 생성된 문구를 가장 비슷한 실행 가능 행동으로 의미상 번역하는 절차를 제안한다.',

context:'2022년 초 임베디드 에이전트 연구는 두 갈래로 갈려 있었다. 한쪽은 시연 데이터로 저수준 정책을 학습하는 모방학습·RL이고, 다른 쪽은 사람이 직접 고수준 계획을 규칙으로 짜 넣는 방식이었다. 둘 다 새로운 작업마다 데이터나 규칙을 다시 만들어야 했다. 한편 [GPT-3](#/p/gpt3)는 요리·청소 같은 일상 작업에 관한 방대한 상식을 텍스트로 갖고 있었지만, 그 지식이 로봇이 실제로 실행할 수 있는 이산적인 행동 집합과 연결된다는 보장은 없었다. 이 논문의 질문은 **언어모델이 이미 가진 절차적 지식을 추가 학습 없이 실행 가능한 단계로 뽑아낼 수 있는가**이다.',

ideas:[
 {h:'별도 학습 없이 고수준 목표를 중간 단계로 분해',
  lead:'충분히 큰 사전학습 모델은 프롬프트만으로 "아침 만들기"를 여러 단계로 쪼갠다.',
  d:'모델 크기가 커질수록(GPT-2 0.1B → GPT-3 175B) 사람이 쓴 계획과 거의 구별되지 않는 자연어 계획을 생성했다. 하지만 이 결과는 놀라움과 동시에 문제였다 — 자유 형식 텍스트로 나온 계획이 VirtualHome 환경의 42개 원자 행동 중 무엇에 대응하는지 전혀 보장되지 않았다.'},
 {h:'실행가능성(executability) vs 정확성(correctness)의 트레이드오프',
  lead:'계획이 문법적으로 실행 가능한 것과 사람이 보기에 올바른 것은 서로 다른 축이다.',
  d:'실행가능성은 계획이 파싱되고 사전조건·사후조건(냉장고를 열어야 우유를 꺼낼 수 있다)을 만족하는지를 측정하고, 정확성은 사람 10명이 채점한다. 작은 모델은 예시를 그대로 반복해 우연히 실행가능성이 높고, 큰 모델은 표현력이 좋아 정확하지만 문법을 벗어나 실행가능성이 낮다는 역설이 드러난다.'},
 {h:'Translation LM: 생성 문구를 실행 가능 행동에 투영',
  lead:'Sentence-BERT 임베딩의 코사인 유사도로 자유 형식 출력을 가장 가까운 admissible action에 매핑한다.',
  d:'모든 admissible action을 미리 나열해 두고, Planning LM이 생성한 각 단계 문구를 Translation LM(RoBERTa 기반 Sentence-BERT)으로 임베딩해 코사인 유사도가 가장 높은 행동으로 치환한다. 이 치환된 행동을 다시 프롬프트에 append해 다음 단계를 그 admissible action에 조건화시킨다 — 매 스텝 생성과 투영을 번갈아(interleave) 하는 것이 핵심이다.'},
 {h:'가장 유사한 시연으로 프롬프트 선택',
  lead:'질의 작업과 임베딩이 가장 가까운 예시 하나를 골라 few-shot 프롬프트를 만든다.',
  d:'별도 학습 데이터셋 전체를 프롬프트에 넣는 대신, Translation LM으로 질의 작업 이름과 가장 유사한 시연 하나(T*, E*)만 골라 프롬프트에 붙인다. 이것이 모델을 재학습시키지 않고도 도메인 형식에 맞추는 유일한 적응 장치다.'}
],

diagram:{type:'flow', cap:'질의 작업이 Planning LM으로 문구를 만들고, Translation LM이 그 문구를 실행 가능 행동으로 투영해 다시 프롬프트에 넣는 과정을 매 스텝 반복한다.',
 nodes:[
  {t:'고수준 목표', s:'"아침 만들기"'},
  {t:'유사 시연 검색', s:'임베딩 코사인 유사도'},
  {t:'Planning LM', s:'다음 단계 문구 생성'},
  {t:'Translation LM', s:'admissible action에 투영', acc:true},
  {t:'환경 실행', s:'사전/사후조건 검사'}
 ]},

math:[
 {expr:'ranking score = cos(LM_T(â), LM_T(a_e)) + β · P(â)',
  tex:'\\text{score}(a_e) = C\\big(LM_T(\\hat a), LM_T(a_e)\\big) + \\beta \\cdot P(\\hat a)',
  d:'생성된 문구 $\\hat a$ 와 후보 admissible action $a_e$ 의 임베딩 코사인 유사도 $C$ 에, Planning LM이 매긴 평균 로그확률 $P(\\hat a)$ 를 $\\beta$ 가중치로 더해 최종 점수를 낸다. 가장 점수가 높은 $a_e^*$ 를 다음 프롬프트에 추가한다.'}
],

numbers:[
 {k:'GPT-3 175B 실행가능성', v:'7.79%', d:'번역 없이 그대로 생성한 계획. 정확성은 77.86%로 사람(70.05%)보다도 높게 채점됨'},
 {k:'Translated GPT-3 175B 실행가능성', v:'73.05%', d:'같은 모델에 Translation LM을 적용, 정확성은 66.13%로 소폭 하락'},
 {k:'GPT-2 117M 실행가능성', v:'18.66%', d:'LCS 3.19%로 매우 낮음 — 예시를 그대로 반복해 우연히 실행가능한 것으로 확인됨'},
 {k:'Fine-tuned GPT-3 13B 실행가능성', v:'66.07%', d:'프롬프팅만 쓴 Translated 방식과 비슷한 수준을 파인튜닝으로 달성'},
 {k:'평가 규모', v:'88개 작업 × 7개 가정 시나리오', d:'VirtualHome 환경, 42개 원자 행동'}
],

impact:'이 논문은 언어모델이 로봇 계획에 필요한 상식을 이미 갖고 있다는 것과, 그 지식을 실행 가능한 형태로 접지(grounding)하는 것이 별개의 공학 문제라는 것을 분리해서 보였다. 재학습 없이 프롬프팅 + 사후 투영만으로 실행가능성을 7.79%에서 73.05%까지 끌어올린 것은 이후 "LLM을 플래너로 쓰고 접지는 별도 모듈이 맡는다"는 구조의 원형이 되었다. 다만 실행가능성이 오르면 정확성이 떨어지는 트레이드오프를 실측으로 드러내, 접지 문제가 여전히 열려 있음을 인정한 점이 중요하다.',

legacy:[
 '**LLM-플래너 + 접지 모듈 분리** 구조가 [SayCan](#/p/saycan)에서 "가능성(affordance) 점수로 접지"라는 형태로 발전',
 '[PaLM-E](#/p/palm-e)를 비롯한 이후 로보틱스 LLM들이 텍스트 계획과 저수준 실행기를 잇는 인터페이스 설계의 참조점이 됨',
 'executability–correctness 트레이드오프 측정 방식이 이후 임베디드 에이전트 평가의 표준 축으로 자리잡음',
 '사전학습 지식만으로 zero-shot 분해가 된다는 결과가 로봇 작업 데이터 수집 비용을 낮추는 방향의 연구를 촉발'
],

pitfalls:[
 '**"정확성이 사람보다 높다"는 결과를 액면 그대로 받아들이면 안 된다.** 저자들은 GPT-3가 상식적 단계를 생략하거나 과제를 그대로 되풀이해도 사람 평가자가 이를 눈치채지 못해 정확성이 부풀려졌다고 직접 밝혔다.',
 '**작은 모델의 높은 실행가능성은 능력이 아니라 결함이다.** GPT-2 계열은 주어진 예시를 그대로 반복해 우연히 실행 가능한 것이지, 질의 작업을 실제로 이해한 것이 아니다 — LCS가 극히 낮다는 것이 그 증거다.',
 '**VirtualHome이라는 시뮬레이션 환경, 42개 행동이라는 제한된 어휘에서 나온 결과다.** 실제 로봇의 연속적 행동 공간이나 물리적 실패까지 다루지는 않으며, [SayCan](#/p/saycan)이 이 접지 문제를 실제 로봇 affordance로 확장한 이유이기도 하다.'
],

figures:[
 {f:'fig1-scatter.png',
  cap:'x축이 실행가능성, y축이 사람이 채점한 정확성. 원본(옅은 색) GPT 계열은 오른쪽 위로 갈수록(모델이 클수록) 정확성은 높지만 실행가능성이 낮고, Translated 버전(진한 색, Ours)은 점선(사람 수준 실행가능성)에 가깝게 오른쪽으로 이동한 대신 정확성이 소폭 떨어진다.',
  src:'원문 Figure 1 좌측, p.1'},
 {f:'fig1-execution.png',
  cap:'"우유 가져오기" 작업이 실제 VirtualHome 3D 환경에서 부엌으로 이동→냉장고 열기→우유 집기→냉장고 닫기 순으로 실행되는 장면. 텍스트 계획이 실제 시뮬레이션 상태 전이로 이어진다는 것을 보여준다.',
  src:'원문 Figure 1 하단, p.1'}
],

quotes:[
 {t:'Can world knowledge learned by large language models (LLMs) be used to act in interactive environments?',
  src:'Abstract, p.1'},
 {t:'we surprisingly find that if pre-trained LMs are large enough and prompted appropriately, they can effectively decompose high-level tasks into mid-level plans without any further training',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2201.07207 — Language Models as Zero-Shot Planners', u:'https://arxiv.org/abs/2201.07207'},
 {t:'프로젝트 페이지 (코드·영상)', u:'https://huangwl18.github.io/language-planner'}
]
});
