WIKI.paper({
slug:'iterated-amplification',
venue:'arXiv 2018',
authors:'Christiano, Shlegeris, Amodei (OpenAI)',
arxiv:'1810.08575',

tldr:'사람 한 명이 직접 할 수도, 평가할 수도 없는 과제를, **사람과 현재까지 학습된 에이전트의 협업(증폭)을 반복해서 흉내 내는 것으로** 감독하자는 제안. 매 스텝 사람보다 "조금 더 똑똑한" 목표를 추격하게 만드는 것이 핵심이다.',

context:'[구체적 AI 안전 문제](#/p/concrete-safety)가 지적한 확장 가능한 감독 문제를 정면으로 다룬다. 이 논문은 학습 신호의 원천을 알고리즘(자동 채점 가능) · 사람(사람이 시연·판단 가능) · **사람의 한계를 넘는 과제**(경제 정책 설계, 대규모 네트워크 보안 관리처럼 한 사람이 감당 못 하는 규모) 세 범주로 나눈다. 앞의 두 범주는 [지도학습](#/p/backprop)과 [사람 선호 기반 RL(RLHF 원형)](#/p/rlhf-prefs)로 이미 다뤄지지만, 세 번째 범주에는 일반적 방법이 없었다. 저자들은 사람 혼자로는 안 되지만, **사람 + 이미 학습된 AI 여러 카피의 협업**이라면 감당할 수 있는 지점까지 문제를 쪼갤 수 있다는 데서 출발한다.',

ideas:[
 {h:'증폭(Amplify): 사람이 에이전트 카피들을 지휘해 문제를 푼다',
  lead:'질문을 하위 질문으로 쪼개고 현재 에이전트 X의 여러 카피에게 답하게 한 뒤 사람이 종합한다.',
  d:'$\\text{Amplify}^H(X)$ 는 사람 $H$ 가 질문 $Q$를 여러 하위 질문 $Q_1, Q_2, \\dots$ 로 나누고, 각각을 현재 에이전트 $X$의 독립된 카피에게 맡긴 뒤 그 답들을 종합해 최종 답을 내는 합성 절차다. $X$가 아직 아무것도 못 배운 초기에는 $\\text{Amplify}^H(X)$가 사실상 사람 혼자 하는 것과 같다.'},
 {h:'반복 증폭: X가 매 스텝 자신보다 강한 목표를 추격한다',
  lead:'X는 매번 Amplify(X)를 모방하도록 학습되고, 그 결과 다음 Amplify(X)는 한 걸음 더 강해진다.',
  d:'$X$ 를 $\\text{Amplify}^H(X)$의 출력을 예측하도록 지도학습으로 훈련시킨다. $X$가 조금 나아지면 $\\text{Amplify}^H(X)$도 조금 나아지므로(더 나은 재료로 조합하니까), $X$는 계속 움직이는 목표를 뒤쫓는다. 이 과정을 충분히 반복하면 이론상 **사람 카피들로 이뤄진 지수적으로 큰 팀**의 행동을 근사하게 된다는 것이 논문의 핵심 주장이다.'},
 {h:'External vs Internal: 증류를 어디서 하느냐',
  lead:'매 스텝 새로 학습된 H\'로 X를 뽑아내는 방식과, X 자체를 계속 온라인으로 갱신하는 방식 두 갈래가 있다.',
  d:'External 버전은 사람의 결정 과정을 흉내 내는 보조 모델 $H\'$ 를 먼저 학습시킨 뒤 $\\text{Amplify}^{H\'}(X)$ 로 $(Q,A)$ 쌍을 모아 $X$ 를 지도학습시킨다. Internal 버전은 $H$ 를 매번 직접 부르며 $X$ 를 점진적으로 갱신한다. 논문 실험은 사람 대신 손코딩한 알고리즘으로 두 방식을 비교한다.'},
 {h:'알고리즘 과제로 가설을 최소 단위 검증',
  lead:'순열 거듭제곱·최단 경로 등 재귀적으로 분해 가능한 5개 조합론 과제로 실험한다.',
  d:'순열 거듭제곱, 순차 대입, 와일드카드 검색, 최단 경로, union-find 다섯 과제 모두 "작은 문제로 쪼갠 뒤 답을 합친다"는 재귀 구조를 갖는다. 사람 대신 하위 질문을 만들고 답을 합치는 규칙을 손으로 코딩해, 반복 증폭이 지도학습과 비슷한 정확도에 도달하는지 비교했다.'}
],

diagram:{type:'loop', cap:'X가 매 반복마다 자신보다 조금 강한 Amplify(X)를 모방하며 따라잡는 구조. 목표 자체가 학습과 함께 움직인다.',
 center:'X는 Amplify(X)를 뒤쫓는다',
 nodes:[
  {t:'질문 분할', s:'H가 Q → Q1,Q2,…'},
  {t:'하위질문 응답', s:'X의 카피들이 답'},
  {t:'답 종합', s:'H가 답을 결합 = Amplify(X)'},
  {t:'X 갱신', s:'X ← Amplify(X) 모방 학습'}
 ]},

math:[
 {expr:'Amplify_H(X): H가 X의 여러 카피에 하위질문을 위임해 종합한 답',
  tex:'\\text{Amplify}^{H}(X)(Q) = H\\big(Q,\\, X(Q_1), X(Q_2), \\dots\\big)',
  d:'$H$ 는 질문 $Q$ 를 하위 질문 $Q_i$ 로 나누고 $X$ 의 독립된 카피들의 답 $X(Q_i)$ 를 받아 최종 답으로 합친다.'},
 {expr:'X ← argmin_X  E[ loss( X(Q), Amplify_H(X)(Q) ) ]',
  tex:'X \\leftarrow \\arg\\min_{X}\\ \\mathbb{E}_{Q\\sim\\mathcal{D}}\\left[\\ell\\big(X(Q),\\, \\text{Amplify}^{H}(X)(Q)\\big)\\right]',
  d:'X는 매 스텝 Amplify(X)의 출력을 지도학습으로 모방하며, Amplify(X)는 그렇게 갱신된 X를 다시 재료로 쓰므로 목표가 함께 상승한다.'}
],

numbers:[
 {k:'지도학습 필요 예시 수', v:'수천만 개', d:'정답 알고리즘 결과를 직접 학습시킬 때'},
 {k:'반복 증폭 필요 예시 수', v:'수만 개', d:'같은 과제를 분해 방식으로 학습시킬 때 — 자릿수 단위로 적음'},
 {k:'실험 과제 수', v:'5개', d:'순열 거듭제곱·순차 대입·와일드카드 검색·최단 경로·union-find'},
 {k:'Amplify 호출당 X·H\' 호출 횟수', v:'3~10회', d:'하위질문 위임 규모'}
],

impact:'반복 증폭은 "사람보다 강한 모델을 사람이 어떻게 계속 감독할 것인가"라는 질문에 [토론](#/p/debate)과 나란히 놓이는 또 하나의 구체적 설계를 제시했다. 지도학습(수천만 예시) 대비 훨씬 적은 예시(수만 개)로 같은 알고리즘적 행동을 학습시켰다는 실험 결과는, **분해 구조를 학습하는 것이 행동 자체를 직접 학습하는 것보다 훨씬 싸다**는 논문의 핵심 주장을 뒷받침한다. 다만 저자들 스스로 이 실험이 사람 대신 손코딩된 분해 규칙을 쓴 단순화라는 점을 명시하며, 실제 사람의 분해 능력으로 이어질지는 별도 검증이 필요하다고 못박는다.',

legacy:[
 '**[토론](#/p/debate)과의 병렬 관계** — 같은 저자군, 같은 해에 나온 확장 가능 감독의 또 다른 축. 토론은 "반박으로 좁히기", 증폭은 "분해해서 합치기"로 접근 방식이 다름',
 '**[보상 모델링](#/p/reward-modeling)의 재귀적 구상과 연결** — 사람의 판단력을 AI로 증폭해 다시 감독에 쓴다는 재귀 구도가 이후 보상 모델 계열 연구의 문제의식과 겹침',
 '**Expert Iteration과의 관계 정리** — [AlphaGo Zero](#/p/alphago) 류의 Expert Iteration과 구조적으로 유사하지만 외부 보상 함수 없이 사람의 분해 능력만으로 동작한다는 차이를 논문이 직접 명시',
 '**분해 가능성 가정에 대한 후속 비판·검증** — "사람이 실제로 복잡한 과제를 재귀적으로 분해할 수 있는가"라는 질문이 이후 연구의 별도 검증 대상이 됨'
],

pitfalls:[
 '**실험은 사람이 아니라 손코딩된 분해 규칙을 썼다.** 논문 스스로 "사람이 실제 과제를 분해할 수 있는지, 지저분한 실세계 분해를 학습할 수 있는지는 이 실험이 말해주지 않는다"고 명시한다.',
 '**"하이어라키가 사라진다"는 서술을 오독하기 쉽다.** 학습이 끝나면 X가 학습한 실제 절차는 훈련에 쓰인 분해 구조를 그대로 반영하지 않는다 — 트리 구조는 학습의 발판일 뿐 최종 산출물의 설계도가 아니다.',
 '**질문 분포 $\\mathcal{D}$ 설계가 성패를 가른다.** $\\mathcal{D}$ 가 실제 관심 질문뿐 아니라 Amplify 과정에서 나오는 모든 하위질문까지 커버해야 하는데, 실세계에서는 이 분포를 설계하는 것 자체가 별도의 난제로 남는다.'
],

figures:[
 {f:'fig1-amplify-schematic.png',
  cap:'왼쪽: H가 질문 Q를 하위질문 Q1,Q2,…로 나눠 X(현재 에이전트)에게 답하게 하고 그 궤적 τ 전체를 모아 H\'를 그 결정 과정을 흉내 내도록 학습시킨다. 오른쪽: 그렇게 학습된 H\'로 Amplify를 반복해 (Q,A) 쌍을 만들고, X는 그 쌍으로부터 A를 직접 예측하도록 학습된다 — 이것이 external 방식의 한 사이클.',
  src:'원문 Figure 1, p.4'},
 {f:'fig2-sample-efficiency.png',
  cap:'다섯 과제 각각에서 파란선(정답 데이터로 직접 지도학습)과 주황선(반복 증폭)의 정확도를 학습에 쓴 질문 수(가로축, 1억 단위)에 대해 비교한 것. 두 방법이 비슷한 정확도에 도달하지만, 본문 수치를 보면 증폭 쪽이 훨씬 적은 예시로 도달한다.',
  src:'원문 Figure 2, p.7'}
],

quotes:[
 {t:'We propose Iterated Amplification, an alternative training strategy which progressively builds up a training signal for difficult problems by combining solutions to easier subproblems.',
  src:'Abstract, p.1'},
 {t:'If all goes well, at the end of this process we\'re left with an agent that "approximates" the behavior of an exponentially large team of copies of H.',
  src:'Section 2.3, p.4'}
],

links:[
 {t:'arXiv 1810.08575 — Supervising strong learners by amplifying weak experts', u:'https://arxiv.org/abs/1810.08575'},
 {t:'OpenAI Blog: Supervising strong learners by amplifying weak experts', u:'https://openai.com/research/amplifying-ai-training'}
]
});
