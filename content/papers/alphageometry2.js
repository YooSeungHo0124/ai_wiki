WIKI.paper({
slug:'alphageometry2',
venue:'Google DeepMind, 2025',
authors:'Chervonyi, Trinh, Olšák, Yang, Nguyen, Menegali, Jung, Kim, Verma, Le, Luong (Google DeepMind)',
arxiv:'2502.03544',

tldr:'[AlphaGeometry](#/p/alphageometry)의 도메인 언어·기호 엔진·탐색 알고리즘을 전부 개선해, 국제수학올림피아드(IMO) 2000~2024년 기하 문제 풀이율을 54%에서 **84%**로 끌어올려 평균 금메달리스트 수준에 도달했다고 보고한 후속 논문. AG2는 IMO 2024에서 은메달 수준을 달성한 시스템의 일부였다.',

context:'[AlphaGeometry](#/p/alphageometry)는 사람 시연 없이 기호 연역 엔진(DDAR)과 언어모델을 결합해 올림피아드 기하 문제를 풀었지만, 세 가지 벽에 막혀 있었다. 도메인 언어가 좁아 2000~2024년 IMO 기하 문제의 66%만 표현할 수 있었고, 움직이는 점의 궤적(locus)이나 각·비율·거리의 선형방정식을 다루는 문제는 애초에 언어로 옮길 수조차 없었다. 기호 엔진 DDAR은 느렸고, 탐색은 단순한 빔서치 하나뿐이었다. AlphaGeometry2(AG2)는 이 세 축 — **언어·엔진·탐색** — 을 동시에 손봐 같은 문제 설정 안에서 상한을 다시 끌어올린다.',

ideas:[
 {h:'도메인 언어를 궤적·선형방정식·비구성적 문제까지 확장',
  lead:'움직이는 점의 궤적 정리와 각·비율·거리의 선형방정식을 표현할 수 있도록 언어를 넓힌다.',
  d:'AG1의 아홉 개 기본 술어(predicate)로는 점 하나가 두 조건으로만 정의되는 구성적(constructive) 문제만 다룰 수 있었다. AG2는 여러 술어가 동시에 한 점(또는 여러 점)을 정의하는 비구성적 문제, 그리고 각·거리·비율 사이의 선형 관계(IMO 2009 P4 등)까지 표현하도록 언어를 확장했다. 이 확장만으로 IMO 2000-2024 기하 문제의 언어 커버리지가 66%에서 88%로 올랐다.'},
 {h:'DDAR2: 300배 이상 빨라진 기호 엔진',
  lead:'닮은삼각형·원에 내접하는 사각형 탐색 알고리즘을 재설계하고 구현을 Python 바인딩으로 교체한다.',
  d:'DDAR(Deductive Database Arithmetic Reasoning)이 가장 많은 시간을 쓰는 부분은 닮은삼각형과 원에 내접하는 사각형(cyclic quadrilateral)을 찾는 탐색이었다. AG2는 이 탐색 알고리즘 자체를 개선하고 C++로 재구현해 pybind11로 파이썬에 노출시켰다. 기존 DDAR로 못 풀던 25개 IMO 문제를 대상으로 측정한 결과, 평균 처리 시간이 1179.57초에서 그 1/300 이하로 줄었다.'},
 {h:'SKEST: 여러 탐색 트리가 증명 사실을 공유한다',
  lead:'서로 다르게 설정된 여러 빔서치를 병렬로 돌리고, 한 트리가 증명한 사실을 다른 트리와 실시간 공유한다.',
  d:'AG1은 단일 빔서치로 보조점을 탐색했다. AG2는 Classic LM Search·LM multi-aux search·LM operator search처럼 서로 다르게 구성된 여러 탐색 트리를 동시에 돌리는 **Shared Knowledge Ensemble of Search Trees(SKEST)**를 쓴다. 한 트리의 노드가 보조점을 추가해 기호 엔진으로 새 사실을 증명하면, 그 사실이 원 문제와 관련된 것인 한(그 노드만의 보조점에 국한되지 않는 한) 공유 저장소에 기록돼 다른 트리들도 즉시 활용할 수 있다. 어느 트리든 증명에 성공하면 전체 탐색이 종료된다.'},
 {h:'Gemini 기반 언어모델과 자동 형식화 파이프라인',
  lead:'Gemini 아키텍처로 언어모델을 교체하고, 자연어 문제를 AG 언어로 옮기는 과정도 Gemini로 자동화한다.',
  d:'AG2의 언어모델은 Gemini 아키텍처를 기반으로 한 mixture-of-experts 트랜스포머로 교체됐고, 학습 데이터 규모도 한 자릿수 이상 늘었다. 또한 사람이 손으로 하던 "자연어 문제 → AG 도메인 언어" 번역 단계를 Gemini에게 몇 개의 예시로 프롬프트해 자동화하는 실험을 함께 보고한다 — IMO 2000-2024의 형식화 가능한 문제 44개 중 33개를 자동으로 옮기는 데 성공했다.'}
],

diagram:{type:'loop', cap:'여러 탐색 트리가 각자 보조점을 시도하며 기호 엔진(DDAR)을 돌리고, 증명한 사실을 공유 저장소에 남겨 서로의 탐색을 돕는다. 어느 한 트리가 성공하면 전체가 멈춘다.',
 center:'SKEST 병렬 탐색',
 nodes:[
  {t:'Classic LM'},
  {t:'LM multi-aux'},
  {t:'LM operator'},
  {t:'공유 사실 저장소', s:'DDAR 증명 결과', acc:true}
 ]},

numbers:[
 {k:'전체 풀이율 (2000~2024 IMO 기하)', v:'54% → 84%', d:'AG1 대비 AG2, 전체 25년치 기하 문제 기준'},
 {k:'AG 언어 커버리지', v:'66% → 88%', d:'언어 확장으로 표현 가능해진 IMO 기하 문제 비율'},
 {k:'DDAR2 속도 개선', v:'300배 이상', d:'DDAR1이 못 풀던 25개 문제 기준, 평균 1179.57초 대비'},
 {k:'자동 형식화 성공률', v:'33/44', d:'Gemini로 자연어 문제를 AG 언어로 자동 번역한 결과'},
 {k:'IMO 2024', v:'은메달 수준 시스템의 구성요소', d:'AG2가 포함된 전체 시스템 기준(기하 외 영역 별도 시스템 포함)'}
],

impact:'"금메달리스트 수준"이라는 표현이 시사하듯, 특정 좁은 영역(올림피아드 기하)에서는 전문화된 신경-기호 결합 시스템이 사람 최상위권과 맞먹거나 넘어설 수 있음을 다시 확인시켰다. 언어·엔진·탐색을 각각 따로 개선해 누적 효과를 낸 구성은 신경-기호 시스템을 개선할 때 "언어모델만 키우기"가 아니라 **표현력·연산 속도·탐색 전략을 함께 손보는 것**이 더 크게 작동한다는 것을 보여준 사례로 인용된다.',

legacy:[
 '기하라는 좁은 영역에서 신경-기호 결합 시스템이 사람 최상위권과 맞먹는다는 것을 다시 확인시켜, 이후 올림피아드 수준 수학 추론 연구에 참조점이 됨',
 'SKEST 같은 "여러 탐색기가 증명된 사실을 공유하는" 아이디어가 이후 정리증명·탐색 기반 추론 시스템의 설계에 참고됨',
 '자연어 → 형식언어 자동 형식화 파이프라인이 완전 자동화된 수학 문제 해결 시스템으로 가는 다음 단계로 제시됨'
],

pitfalls:[
 '**평가 대상이 올림피아드 기하 문제에 한정된다.** "금메달리스트 수준"은 IMO 기하 영역에 국한된 결과이며, 대수·정수론·조합론 등 다른 올림피아드 영역이나 일반적인 수학 추론 능력을 의미하지 않는다.',
 '**AG 언어로 표현 안 되는 12%는 여전히 못 푼다.** 3차원 기하·부등식 등은 확장된 언어로도 커버되지 않아, 88%라는 커버리지 자체가 상한이다.',
 '**IMO 2024 은메달 수준은 AG2 단독 성과가 아니다.** AG2는 기하 문제를 담당하는 하위 시스템이었고, 다른 영역은 별도의 시스템이 처리한 전체 파이프라인의 결과다.',
 '**자동 형식화(33/44)는 아직 사람이 손으로 만든 few-shot 예시와 다이어그램 생성 개입에 의존한다.** "완전 자동화"라고 단정하면 과장이며, 저자들도 "진행 상황을 보고한다"는 표현을 쓴다.'
],

figures:[
 {f:'fig4-skest.png',
  cap:'자연어 문제가 형식화를 거쳐 여러 언어모델이 각각 담당하는 탐색 트리(Classic LM Search·LM multi-aux search·LM operator search 등)로 들어가고, 각 트리의 증명 시도 결과가 하단의 공유 저장소(Shared workspace of interesting facts)에 쌓여 다른 트리들이 재사용한다.',
  src:'원문 Figure 4, p.10'}
],

quotes:[
 {t:'We present AlphaGeometry2 (AG2), a significantly improved version of AlphaGeometry... which has now surpassed an average gold medalist in solving Olympiad geometry problems.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2502.03544 — AlphaGeometry2', u:'https://arxiv.org/abs/2502.03544'},
 {t:'GitHub — google-deepmind/alphageometry2', u:'https://github.com/google-deepmind/alphageometry2'}
]
});
