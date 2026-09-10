WIKI.paper({
slug:'natural-instructions',
venue:'ACL 2022 (arXiv 2021)',
authors:'Mishra, Khashabi, Baral, Hajishirzi (Allen Institute for AI · U. Washington · Arizona State U.)',
arxiv:'2104.08773',

tldr:'크라우드소싱 플랫폼에서 사람 작업자에게 과제를 설명하려고 쓰던 **지시문 자체를 모델 학습 신호로** 쓸 수 있는지 물은 논문. "본 적 없는 과제 유형도 지시문만 읽고 풀 수 있는가"라는, 이후 지시학습(instruction tuning) 전체 계보의 출발 질문을 처음 정식화했다.',

context:'2021년의 지도학습 NLP 모델은 특정 데이터셋 하나에는 강했지만 **과제를 바꾸면 처음부터 다시 학습**해야 했다 — 질의응답 모델이 분류 과제를 못 푸는 식이다. 반면 사람은 크라우드소싱 플랫폼의 작업 설명("문법 오류가 있으면 yes라고 답하시오")을 읽는 것만으로 새 과제를 바로 수행한다. 저자들의 질문은 단순하다. **문법 검사·질의응답 과제의 사례로 학습한 모델이, 그 지시문의 패턴을 이용해 한 번도 보지 못한 "질문 유형 분류" 같은 과제까지 풀 수 있는가?** 이 전이가 되는지를 재는 벤치마크가 아직 없었다.',

ideas:[
 {h:'크라우드소싱 지시문을 통일 스키마로 재구성',
  lead:'기존 NLP 데이터셋을 만들 때 쓰인 작업 지시문을 모아 하나의 스키마로 통일한다.',
  d:'Quoref·QASC 같은 기존 데이터셋은 크라우드워커에게 준 원본 작업 지시문을 갖고 있다. 이 지시문을 그대로 쓰지 않고, 정의(Definition)·주의사항(Things to Avoid)·강조(Emphasis/Caution)·긍정/부정 예시(Positive/Negative Examples)·근거(Reasons)로 이루어진 **공통 스키마**로 재작성했다. 한 크라우드소싱 템플릿이 여러 하위과제(질문 생성, 답 생성 등)로 쪼개지는 경우도 최소 단위로 분리했다.'},
 {h:'61개 과제 · 193k 인스턴스, 6개 category로 분할',
  lead:'61개 과제를 6개 의미 카테고리로 묶어 seen/unseen 과제 분할 실험을 설계한다.',
  d:'question generation·answer generation·classification·incorrect answer generation·minimal modification·verification 6개 카테고리에 61개 과제, 193k 입출력 쌍을 모았다. 이 카테고리 구조 위에서 **random split**(과제 단위로 무작위 분할), **leave-one-category-out**, **leave-one-dataset-out**, **leave-one-task-out** 네 가지 일반화 시나리오를 만들어, "얼마나 낯선 과제까지 전이되는가"를 단계적으로 측정했다.'},
 {h:'인코더-디코더에 지시문을 입력으로 이어붙인다',
  lead:'지시문과 입력 인스턴스를 한 텍스트로 연결해 BART에 넣고 출력을 생성시킨다.',
  d:'모델은 지시문 $I_t$ 와 입력 $x$ 를 하나의 텍스트로 인코딩한 뒤 출력 $y$ 를 생성하는 $M:\\text{enc}(I_t,x)\\to y$ 형태다. 파인튜닝 가능한 [BART](#/p/bart)(base, 140M)를 기본 모델로 쓰고, 파인튜닝이 불가능한 [GPT-3](#/p/gpt3)(175B, few-shot)를 참고 비교군으로 붙였다. 지시문의 어느 요소(정의·주의사항·긍정/부정 예시)가 실제로 기여하는지 요소별 조합으로 나눠 비교했다.'},
 {h:'지시문이 실제로 일반화를 돕는지 수치로 검증',
  lead:'지시문을 준 모델과 안 준 모델의 격차를 여러 분할 시나리오에서 측정한다.',
  d:'random split에서 지시문 없이 학습한 모델은 13점, 전체 지시문(F ULL INSTRUCTIONS)을 준 모델은 32점(ROUGE-L 기준)으로 **+19점**의 격차가 났다. leave-one-category-out처럼 더 낯선 설정에서도 지시문 유무의 격차가 유지돼, 단순 암기가 아니라 지시문 자체에서 정보를 얻고 있음을 보였다.'}
],

diagram:{type:'flow', cap:'seen 과제로 학습하고 unseen 과제를 지시문만으로 평가하는 전체 구조.',
 nodes:[
  {t:'크라우드소싱 지시문', s:'6개 카테고리 · 61과제'},
  {t:'통일 스키마 변환', s:'정의·예시·주의사항'},
  {t:'BART 인코더-디코더', s:'140M · 지시문+입력', acc:true, a:'seen 학습'},
  {t:'unseen 과제 평가', s:'ROUGE-L'}
 ]},

math:[
 {expr:'M: enc(I_t, x) -> y',
  tex:'M:\\ \\text{enc}(I_t,\\,x)\\ \\rightarrow\\ y',
  d:'지시문 $I_t$ 와 입력 인스턴스 $x$ 를 하나의 텍스트로 인코딩해 인코더-디코더 모델에 넣고 출력 $y$ 를 생성한다. 지시문을 "추가 입력 텍스트"로 취급한 이 설계가 이후 [Super-NaturalInstructions](#/p/super-natural-instructions)까지 그대로 이어진다.'}
],

numbers:[
 {k:'과제 · 인스턴스', v:'61개 과제 · 193k', d:'6개 의미 카테고리(질문생성·답생성·분류·오답생성·최소수정·검증)로 분할'},
 {k:'지시문 효과 (random split)', v:'13 → 32', d:'ROUGE-L. 지시문 없음 대비 F ULL INSTRUCTIONS **+19점**'},
 {k:'BART vs GPT-3', v:'BART가 +8점 우세', d:'random split에서 파인튜닝된 BART(140M)가 few-shot GPT-3(175B, 약 1,200배 큼)보다 높음'},
 {k:'사람 상한', v:'66%', d:'사람이 같은 지시문으로 과제를 풀었을 때 ROUGE-L. 모델 최고 일반화(32%)와 큰 격차'},
 {k:'모델 규모', v:'BART-base 140M', d:'파인튜닝 대상. GPT-3(175B)는 few-shot으로만 비교'}
],

impact:'이 논문 자체는 61개 과제라는 작은 규모였지만, **"지시문을 데이터로 취급해 낯선 과제로 일반화시킨다"는 문제 설정**을 최초로 벤치마크화했다. 지시문 요소(정의·긍정/부정 예시·주의사항)를 분해해 각각의 기여를 측정한 방법론은 이후 모든 지시학습 데이터셋 설계의 표준 실험 틀이 됐다. 곧바로 이어진 [Super-NaturalInstructions](#/p/super-natural-instructions)가 과제 수를 61개에서 1,600여 개로 25배 넘게 키우며 같은 질문을 훨씬 큰 스케일에서 재확인한다.',

legacy:[
 '**규모 확장** — [Super-NaturalInstructions](#/p/super-natural-instructions)가 같은 스키마를 1,600여 개 과제·76개 과제 유형으로 확장하고 Tk-Instruct를 학습',
 '**같은 시기의 다른 접근** — [T0](#/p/t0)는 크라우드소싱 지시문 대신 기존 NLP 데이터셋에 수작업 프롬프트 템플릿을 씌우는 방식으로 같은 "지시 기반 zero-shot 일반화" 문제에 접근',
 '**자기지시 데이터 생성으로 이어짐** — 사람이 일일이 지시문을 쓰는 병목은 이후 [Self-Instruct](#/p/self-instruct)가 모델 스스로 지시문을 생성하게 하는 방식으로 우회',
 '**산업 규모 적용** — [FLAN](#/p/flan)과 [InstructGPT](#/p/instructgpt) 계열이 이 "지시문+입력 → 출력" 포맷을 사전학습 후 정렬 단계의 표준 레시피로 채택'
],

pitfalls:[
 '**T5가 아니라 BART 기반이다.** 이 계보의 다른 논문들([T0](#/p/t0), [flan-t5](#/p/flan-t5))이 T5 계열을 쓰다 보니 혼동하기 쉽지만, 이 논문의 파인튜닝 모델은 [T5](#/p/t5)가 아니라 BART-base(140M)다. T5는 본문에 한 번도 등장하지 않는다.',
 '**"모델이 지시문을 이해한다"는 과장이다.** 저자들도 모델 성능(32%)이 사람 상한(66%)에 크게 못 미친다고 명시한다 — 지시문에서 표면적인 패턴은 뽑아내지만 사람 수준의 일반화와는 거리가 멀다.',
 '**GPT-3 비교는 불공정 비교에 가깝다.** GPT-3는 파인튜닝 없이 few-shot으로만 평가됐고 BART는 파인튜닝됐다 — "1,200배 작은 모델이 이겼다"는 결과를 학습 방식의 차이를 빼고 읽으면 안 된다.'
],

figures:[
 {f:'fig1-schema.png',
  cap:'같은 형태의 크라우드소싱 지시문(파란 박스)이 문법 검사·핵심어 태깅·질문 답변 세 과제(seen, 위 점선 위)에 쓰이고, 점선 아래 질문 유형 분류(question typing)는 학습 때 전혀 보지 않은 unseen 과제다. 모델은 같은 스키마의 지시문만으로 이 unseen 과제를 풀어야 한다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'Our results indicate that models benefit from instructions when evaluated in terms of generalization to unseen tasks (19% better for models utilizing instructions).',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2104.08773 — Cross-Task Generalization via Natural Language Crowdsourcing Instructions', u:'https://arxiv.org/abs/2104.08773'},
 {t:'Natural Instructions 데이터셋', u:'https://instructions.apps.allenai.org'}
]
});
