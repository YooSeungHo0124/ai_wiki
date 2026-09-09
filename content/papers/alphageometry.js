WIKI.paper({
slug:'alphageometry',
venue:'Nature 625, 476–482 (2024)',
authors:'Trinh, Wu, Le, He & Luong (Google DeepMind · NYU)',

tldr:'사람이 만든 증명 데이터 없이, 무작위 도형에 기호 연역 엔진을 돌려 스스로 만든 **1억 개의 합성 정리·증명**만으로 언어모델을 학습시켜 국제수학올림피아드(IMO) 기하 문제를 사람 금메달리스트 수준으로 푼 논문.',

context:'올림피아드 수준의 정리 증명은 인간 수준 자동추론의 상징적 과제였지만, 학습 기반 방법은 대부분 **사람이 쓴 증명을 기계검증 언어로 번역한 데이터**에 의존했다. 기하는 이 문제가 특히 심하다. [Lean](#/p/transformer)류의 범용 수학 언어로는 복소수 좌표 같은 기하 특유의 증명 기법을 표현하기 어려워, 번역 가능한 인간 증명 자체가 극히 적다. 그래서 기존 기하 정리 증명 프로그램은 대부분 사람이 설계한 탐색 휴리스틱에 의존하는 순수 기호 시스템이었고, 성능은 사람 동메달리스트 수준에 못 미쳤다. 질문은 이것이다 — **번역할 인간 증명이 없다면, 학습 데이터를 아예 기계 스스로 만들 수는 없는가?**',

ideas:[
 {h:'기호 연역 엔진: DD + AR',
  lead:'Horn절 형태의 연역 규칙(DD)에 대수적 추론(AR)을 결합해 순수 논리로 도달 가능한 결론을 모두 찾는다.',
  d:'점·직선 같은 대상에 대해 "공선점이다", "각이 같다" 같은 술어를 전제에서 전방 추론으로 도출하는 deductive database(DD)가 기본 엔진이다. 여기에 각도·비율·거리 계산을 위한 algebraic reasoning(AR)을 결합한 DD+AR이 이 논문의 새 기여로, 순수 기호 추론만으로 기존 최고 기록(10문제)을 갱신했다.'},
 {h:'막히면 언어모델이 보조점을 제안한다',
  lead:'DD+AR이 막히면 언어모델이 "보조선/보조점"을 하나 구성해 다시 기호 엔진에 넘긴다.',
  d:'기호 엔진은 주어진 대상만으로 연역이 막히면 더 진행하지 못한다. 이때 사람이 증명에서 흔히 쓰는 "점 D를 BC의 중점으로 놓자" 같은 보조 구성(auxiliary construction)이 필요하다. 언어모델이 문제 문장과 지금까지의 구성을 조건으로 새 구성 문장 하나를 생성하면, 기호 엔진이 그 새 대상을 포함해 연역을 재개한다. 이 루프가 증명을 찾거나 최대 반복 수에 이를 때까지 반복된다.'},
 {h:'사람 증명 없이 합성 데이터 생성',
  lead:'무작위 도형 전제에 기호 엔진을 돌려 결론과 증명을 통째로 만들어낸다.',
  d:'무작위로 뽑은 정리 전제 집합에 DD+AR을 돌려 도달 가능한 결론들의 방향 비순환 그래프(DAG)를 얻고, 각 결론 노드에서 역추적(traceback)해 최소 필요 전제 부분집합을 구하면 (전제, 결론, 증명) 삼중항이 완성된다. 인간이 만든 문제집은 전혀 쓰지 않았다. 이 과정으로 약 100M개의 정리·증명 쌍을 얻었고, 결론이 원래 전제 중 일부와 독립적인 대상(즉 보조 구성)을 포함하는 경우만 따로 골라 약 9M개의 "보조 구성 포함" 증명으로 모델을 미세조정했다.'},
 {h:'12층 트랜스포머, 151M 파라미터',
  lead:'전제·결론·증명을 하나의 텍스트 시퀀스로 직렬화해 처음부터(from scratch) 학습한다.',
  d:'(전제, 결론, 증명)을 `<premises><conclusion><proof>` 형태의 문자열로 직렬화하고, 사전학습된 언어모델이 아니라 처음부터 학습시킨 12층·임베딩 1024차원·151M 파라미터 트랜스포머로 다음 토큰 예측을 학습한다. 추론 시에는 빔서치로 상위 k개의 보조 구성 후보를 병렬로 탐색한다.'}
],

diagram:{type:'loop', cap:'문제 전제로 시작해 기호 엔진이 막히면 언어모델이 보조점을 하나 제안하고, 다시 기호 엔진으로 돌아가는 루프. 해가 나오면 종료.',
 center:'해 찾을 때까지 반복',
 nodes:[
  {t:'기호 연역 엔진', s:'DD+AR', acc:true, note:'논리로 도달 가능한 것 전부 도출'},
  {t:'막힘 판정', s:'결론 미도달'},
  {t:'언어모델', s:'보조점 1개 생성', note:'ex) D=BC 중점'},
  {t:'증명 완료', s:'인간이 읽는 형태로 출력'}
 ]},

math:[
 {expr:'Q(x) ← P1(x), …, Pk(x)',
  tex:'Q(x) \\leftarrow P_1(x), \\dots, P_k(x)',
  d:'DD의 연역 규칙은 정의 Horn절(definite Horn clause) 형태다. $x$ 는 점 대상, $P_1,\\dots,P_k$ 와 $Q$ 는 "공선이다", "선분이 같다" 같은 술어다. 전제 술어들이 모두 참이면 결론 술어 $Q$ 를 새로 도출한다.'},
 {expr:'(premises, conclusion, proof) = (P, N, G(N))',
  tex:'(\\text{premises},\\,\\text{conclusion},\\,\\text{proof}) = (P,\\, N,\\, G(N))',
  d:'전제 집합에서 나온 도달가능 결론 DAG의 임의 노드 $N$ 에서 역추적하면 그 의존 부분그래프 $G(N)$ 을 얻는다. 이 삼중항 하나가 합성 학습 예제 하나가 된다.'}
],

numbers:[
 {k:'IMO-AG-30 해결', v:'25/30문제', d:'기존 최고(Wu의 방법)는 10문제, 사람 평균 IMO 참가자 환산 15.2문제'},
 {k:'금메달리스트 대비', v:'25.9문제', d:'사람 금메달리스트 환산 점수(25.9)에 근접(AlphaGeometry 25.0)'},
 {k:'합성 정리·증명', v:'약 1억 개', d:'무작위 도형 전제 약 10억 개에서 기호 엔진으로 추출'},
 {k:'보조구성 포함 증명', v:'약 900만 개', d:'전체 100M 중 보조점을 포함하는 것만 골라 미세조정에 사용'},
 {k:'모델 크기', v:'12층 · 151M 파라미터', d:'임베딩 1024차원, 8-head attention, 사전학습 없이 처음부터 학습'},
 {k:'빔 크기 축소', v:'512 → 8', d:'탐색 예산을 2% 미만으로 줄여도 22문제를 풀어 성능이 급격히 무너지지 않음'}
],

impact:'AlphaGeometry는 기하라는, 인간 증명 데이터가 극히 희소해 학습 기반 방법이 손대기 어려웠던 영역에서 **데이터를 스스로 만들어 학습**하는 것이 통한다는 것을 보였다. 사람이 만든 정리·증명을 번역하는 대신, 기호 엔진이 이미 잘하는 순수 연역과 언어모델이 잘하는 "다음에 뭘 시도할지 제안하기"를 분업시킨 신경-기호 결합이 핵심 설계였다. IMO 2000·2015 전 기하 문제를 사람 전문가 평가로 풀어내고 2004년 문제의 일반화된 버전까지 스스로 발견하면서, 좁은 도메인이지만 사람 수준을 넘는 자동 증명이 처음으로 실증됐다.',

legacy:[
 '**AlphaProof**(2024, DeepMind) — 기하 외 대수·정수론까지 확장해 IMO 2024에서 은메달 수준 종합 점수를 기록, 같은 신경-기호 결합 철학의 후속작',
 '**Newclid**(2024) 등 오픈소스 재구현 — DD+AR 엔진과 언어모델 인터페이스를 분리해 재현·확장을 쉽게 만든 커뮤니티 후속 작업',
 '**부등식·조합 기하로 확장** — "Proving Olympiad Algebraic Inequalities without Human Demonstrations"처럼 같은 합성 데이터 레시피를 다른 올림피아드 영역에 이식하는 연구가 뒤따름',
 '**"인간 시연 없이" 패러다임의 확산** — [AlphaZero](#/p/alphazero)의 자기생성 데이터 철학을 자기대국이 아닌 **정적 기호 엔진 합성**으로 구현한 사례로, 이후 수학 추론 데이터 생성 전반에 참조됨'
],

pitfalls:[
 '**"인간 시연 없이"는 증명 예시가 없다는 뜻이지, 인간 설계가 없다는 뜻이 아니다.** 공리계·연역 규칙·기하 환경 자체는 여전히 사람이 만들었고, 무작위로 뽑는 "전제 구성 목록"(Extended Data Table 1)도 사람이 정의했다.',
 '**대회 기하라는 좁은 도메인 성과를 일반 수학 추론 능력으로 확장해석하면 안 된다.** 벤치마크는 기하 부등식·조합기하·대수·정수론을 제외한, 이 논문의 기하 환경으로 표현 가능한 IMO 문제만 포함한다.',
 '**문제를 기호 엔진이 다룰 수 있는 형식으로 변환해야 한다는 제약이 있다.** 좌표기하·복소수 좌표를 쓰는 인간 증명은 애초에 이 환경에서 표현하기 어려워, 종합기하(synthetic geometry) 스타일로 풀리는 문제에 성과가 편중돼 있다.'
],

figures:[
 {f:'fig1-pipeline.png',
  cap:'a~d: 간단한 문제(AB=AC인 삼각형)를 예로 든 전체 루프. b에서 기호 엔진(Symbolic deduce)이 못 풀면(Not solved) 화살표가 Construct로 돌아가 언어모델(c)이 보조점을 하나 만들고, 다시 기호 엔진으로 들어가 Solved!가 뜰 때까지 반복한다. d는 그 결과로 만들어진 실제 증명 텍스트(파란 글씨가 언어모델이 제안한 보조 구성, 초록 글씨가 최종 결론).',
  src:'원문 Figure 1a-d, p.477'},
 {f:'fig2-score.png',
  cap:'IMO-AG-30(2000년 이후 IMO 기하 문제 30개) 기준 해결 개수. 회색 막대는 사람 등급을 0~7점 대회 점수를 0~1 성공/실패로 환산한 값이고, 파란 막대가 AlphaGeometry(25.0)다. 가로 빨간선이 평균 IMO 참가자(15.2), 맨 오른쪽 막대(25.9)가 금메달리스트 환산 점수로 AlphaGeometry가 여기에 근접한다.',
  src:'원문 Figure 2, p.477'}
],

quotes:[
 {t:'We propose AlphaGeometry, a theorem prover for Euclidean plane geometry that sidesteps the need for human demonstrations by synthesizing millions of theorems and proofs across different levels of complexity.',
  src:'Abstract, p.476'},
 {t:'AlphaGeometry advances the current state of geometry theorem prover from below human level to near gold-medallist level.',
  src:'Figure 2 caption, p.477'}
],

links:[
 {t:'Nature 625, 476–482 (2024) — Solving olympiad geometry without human demonstrations', u:'https://www.nature.com/articles/s41586-023-06747-5'},
 {t:'GitHub — google-deepmind/alphageometry', u:'https://github.com/google-deepmind/alphageometry'},
 {t:'Google DeepMind 연구 소개', u:'https://research.google/pubs/solving-olympiad-geometry-without-human-demonstrations/'}
]
});
