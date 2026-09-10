WIKI.paper({
slug:'got',
venue:'AAAI 2024',
authors:'Besta, Blach, Kubicek et al. (ETH Zurich · Warsaw U. of Tech. · Cledar)',
arxiv:'2308.09687',

tldr:'[ToT](#/p/tot)의 트리 구조를 **임의의 그래프**로 일반화해, 생각(thought)들을 하나로 합치거나(aggregation) 스스로 되먹임(refine)할 수 있게 만든 프레임워크. 트리는 부모 하나에서만 자식이 나오지만, 그래프는 여러 갈래를 다시 하나로 합칠 수 있다는 것이 핵심 차이다.',

context:'[CoT](#/p/cot)는 생각을 사슬 하나로, [ToT](#/p/tot)는 여러 갈래로 뻗는 트리로 모델링했다. 트리는 backtracking(가지 버리기)까지는 되지만, **한 번 갈라진 두 갈래를 다시 합치는 것은 구조적으로 불가능**하다 — 트리의 정의상 노드마다 부모가 하나뿐이기 때문이다. 그런데 사람은 실제로 사고할 때 한 갈래를 따라가다가 되돌아와 다른 갈래와 **결합**하기도 하고, 알고리즘 실행도 흔히 DAG(방향성 비순환 그래프) 형태를 띤다. 저자들의 질문은 "생각의 구조를 트리가 아니라 **임의의 그래프**로 모델링하면 무엇이 가능해지는가"다.',

ideas:[
 {h:'생각을 그래프의 정점으로, 의존관계를 간선으로',
  lead:'LLM이 생성한 생각 하나하나를 정점으로, "이 생각이 저 생각에서 나왔다"는 관계를 간선으로 표현한다.',
  d:'추론 과정을 방향 그래프 $G=(V,E)$ 로 모델링한다. 정점 하나가 문제 해의 일부(정렬 문제라면 숫자 배열, 글쓰기 문제라면 문단)이고, 간선 $(t_1, t_2)$ 는 "$t_2$ 를 만들 때 $t_1$ 을 명시적으로 입력에 썼다"는 뜻이다. 트리·사슬은 이 그래프의 특수한 경우일 뿐이다.'},
 {h:'Aggregation: 여러 갈래를 하나로 합친다',
  lead:'서로 다른 갈래에서 나온 생각 여러 개를 정점 하나로 합쳐 장점만 취하고 단점을 상쇄한다.',
  d:'예를 들어 정렬 문제에서 두 개의 정렬된 부분 배열을 병합해 하나의 정렬된 배열로 합치는 것이 aggregation이다. 트리 구조에서는 각 갈래를 독립적으로 평가하고 그중 하나를 고르는 것만 가능했지만, GoT는 **여러 갈래의 결과를 실제로 병합**해 새 정점을 만들 수 있다 — 이것이 [ToT](#/p/tot) 대비 가장 근본적인 확장이다.'},
 {h:'Refining: 자기 자신으로 돌아가는 루프',
  lead:'정점이 자기 자신을 가리키는 간선을 둬서 같은 생각을 반복 개선한다.',
  d:'refining transformation 은 $E^+=\\{(v,v)\\}$ 형태로, 한 생각을 계속 다듬는 반복을 그래프의 self-loop 로 표현한다. 정렬 결과에 오류가 남아 있으면 같은 정점을 계속 개선하는 식으로 쓰인다.'},
 {h:'Controller/GoO/GRS: 그래프 실행을 프레임워크로 분리',
  lead:'과제별 그래프 분해(GoO)와 진행 상태(GRS)를 분리해 새 변환·과제로 확장하기 쉽게 만들었다.',
  d:'GoT 아키텍처는 Prompter(프롬프트 생성)·Parser(LLM 출력에서 정보 추출)·Scoring & Validation·Controller 네 모듈로 나뉜다. Controller는 정적인 **Graph of Operations**(과제를 어떤 순서로 어떤 변환에 통과시킬지)와 동적인 **Graph Reasoning State**(지금까지의 생각과 그 상태)를 관리한다. 이 분리 덕분에 새로운 변환이나 LLM을 갈아 끼우기 쉽다.'},
 {h:'과제를 잘게 쪼갤수록 이득이 커진다는 실증',
  lead:'문제 크기가 커질수록 GoT가 ToT를 앞서는 폭도 커진다 — 이득이 과제 분해 가능성에 달려 있다.',
  d:'정렬 배열 길이 $P$ 를 키우며 실험한 결과, $P=32$ 에서는 GoT가 ToT2보다 근소하게만 나았지만 $P=64$ 에서 오차가 약 61%, $P=128$ 에서는 약 69% 줄었다. 저자들은 이 경향을 "복잡한 문제일수록 하위 과제로 쪼개 독립적으로 풀고 합치는 GoT의 방식이 유리해진다"고 직접 설명한다.'}
],

diagram:{type:'compare', cap:'ToT는 한 갈래를 버리거나(backtracking) 고르는 것만 가능하지만, GoT는 서로 다른 갈래의 결과를 하나로 합치는 aggregation과 자기 자신을 개선하는 refining이 추가된다.',
 left:{t:'ToT: 트리', items:['부모 하나 → 자식 여러 개','갈래 평가 후 하나 선택','backtracking만 가능','갈래를 다시 합칠 수 없음']},
 right:{t:'GoT: 그래프', items:['여러 부모를 정점 하나로 합침(aggregation)','자기 자신으로 되먹임(refining)','임의의 DAG 구조 허용','복잡한 과제일수록 이득 커짐']}},

math:[
 {expr:"G' = T(G, p_θ) = (V', E'),  V' = (V ∪ V+) \\ V-,  E' = (E ∪ E+) \\ E-",
  tex:"G' = \\mathcal{T}(G,p_\\theta) = (V', E'), \\quad V' = (V\\cup V^+)\\setminus V^-,\\;\\; E' = (E\\cup E^+)\\setminus E^-",
  d:'생각 변환 하나가 그래프에 새 정점/간선($V^+,E^+$)을 더하고 기존 것($V^-,E^-$)을 지우는 연산으로 정의된다. Aggregation·refining·generation 모두 이 틀의 특수한 경우다.'}
],

numbers:[
 {k:'정렬 품질 개선 (vs ToT)', v:'약 62%', d:'P=128에서 median error 감소, 비용은 동시에 >31% 절감'},
 {k:'정렬 품질 개선 (vs CoT/IO)', v:'65% / 83%', d:'P=64에서 median error 기준 각각 낮음'},
 {k:'문제 크기별 이득 변화', v:'P=32 거의 무이득 → P=128 약 69% 오차 감소', d:'과제를 잘게 쪼갤 여지가 클수록 GoT 이득이 커짐(정직하게 과제 의존적)'},
 {k:'실험 LLM', v:'GPT-3.5 (budget 제약)', d:'Llama-2도 시도했으나 성능이 낮고 느려 충분한 샘플을 못 얻음'}
],

impact:'"생각의 구조"라는 설계 공간을 사슬·트리에서 **임의의 그래프**로 열었다. Aggregation이라는 연산 하나가 추가된 것처럼 보이지만, 이는 하위 과제를 독립적으로 풀고 결과를 병합하는 divide-and-conquer 스타일 추론을 프롬프팅 수준에서 가능하게 한다는 점에서 구조적 확장이다. 다만 이 이득은 무료가 아니다 — 그래프가 복잡해질수록 Controller가 관리할 상태(GRS)와 LLM 호출 스케줄도 함께 복잡해진다.',

legacy:[
 '**그래프 기반 추론 프레임워크의 참조점** — 이후 다양한 "OoT류" 변형(계획 그래프, 다중 에이전트 그래프)이 GoT의 Aggregation/Refining 어휘를 재사용',
 '**과제 분해 설계 원칙 정립** — "얼마나 잘게 쪼갤 수 있는가"가 그래프형 프롬프팅의 이득을 결정한다는 논문의 결론이 이후 유사 연구의 설계 기준이 됨',
 '**volume of a thought**라는 새 지표 제안이 프롬프팅 전략 비교 연구에서 참고 지표로 인용됨',
 '[LATS](#/p/lats) 등 트리 탐색에 환경 피드백을 결합하는 후속 연구들이 "탐색 구조를 어떻게 일반화할 것인가"라는 같은 축의 다른 방향(그래프 대신 MCTS)을 취함'
],

pitfalls:[
 '**이득이 과제에 크게 의존한다.** 저자들 스스로 정렬 문제에서 배열이 작을 때(P=32)는 ToT 대비 "negligibly" 개선된다고 밝힌다 — GoT가 항상 큰 폭으로 이기는 것이 아니라, **쪼갤 수 있는 큰 문제**에서 이득이 커진다.',
 '**비용은 IO/CoT보다 항상 높다.** GoT·ToT 모두 Generate 연산마다 $k$개의 새 생각을 만들기 때문에 기본적으로 다중 LLM 호출이 필요하며, 논문도 "GoT와 ToT의 비용은 IO/CoT보다 훨씬 높다"고 명시한다. ToT 대비 절감이지 IO/CoT 대비 절감이 아니다.',
 '**GPT-3.5 중심 실험이며 예산 제약을 저자가 직접 밝힌다.** Llama-2는 느리고 품질이 낮아 충분한 샘플을 못 얻었다고 적혀 있어, 다른 모델 계열에서 같은 폭의 이득이 재현되는지는 이 논문만으로 확정할 수 없다.'
],

figures:[
 {f:'fig1-vs-tot.png',
  cap:'ToT(왼쪽, 이 논문 표에서는 잘려 있음)와 달리 GoT는 화살표가 여러 방향에서 한 정점으로 모이는 "Aggregating thoughts"·"Aggregating chains" 구조를 갖는다. 초록은 긍정 점수, 빨강은 폐기된 생각, 원형 화살표는 refining(자기 자신 개선) 루프.',
  src:'원문 Figure 1, p.3'},
 {f:'fig2-aggregation.png',
  cap:'Aggregation의 실제 예시: 세 개의 정렬된 부분 배열(1 2 7 8 / 2 3 6 7 / 1 1 4 5)이 화살표를 타고 한 정점으로 모여 하나의 정렬된 배열(1 1 1 2 2 3 4 5 6 7 7 8)이 된다 — 트리라면 이 병합이 불가능하다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'We illustrate that GoT offers advantages over state of the art on different tasks, for example increasing the quality of sorting by 62% over ToT, while simultaneously reducing costs by >31%.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2308.09687 — Graph of Thoughts', u:'https://arxiv.org/abs/2308.09687'},
 {t:'spcl/graph-of-thoughts (GitHub)', u:'https://github.com/spcl/graph-of-thoughts'}
]
});
