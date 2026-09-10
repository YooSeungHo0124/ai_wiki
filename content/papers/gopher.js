WIKI.paper({
slug:'gopher',
venue:'arXiv 2021 (DeepMind)',
authors:'Rae et al. (DeepMind)',
arxiv:'2112.11446',

tldr:'280B 파라미터 모델 Gopher를 152개 과제에 걸쳐 평가해, **스케일이 어디서 통하고 어디서 안 통하는지**를 최초로 체계적으로 갈라낸 논문. 독해·사실 확인·일반 지식은 크게 개선되지만 수학·논리 추론은 파라미터를 키워도 거의 늘지 않았다.',

context:'2020년 [GPT-3](#/p/gpt3) 이후 모델 크기는 계속 커졌다 — Jurassic-1 178B, Megatron-Turing NLG 530B. 그러나 "더 키우면 어디가 좋아지는가"에 대한 답은 대부분 언어모델링 손실(perplexity) 곡선 하나로만 제시됐다. DeepMind는 44M부터 280B까지 여섯 개 모델을 **똑같은 데이터·똑같은 토큰 수**로 학습시켜 놓고, 152개의 다운스트림 과제에 전부 돌려본다. 크기만 다른 모델 family를 갖추면 "이 과제는 규모로 풀리는가"를 과제별로 직접 답할 수 있다는 것이 이 논문의 실험 설계다. 데이터는 새로 큐레이션한 **MassiveText**(2.35억 문서, 10.5TB)에서 3000억 토큰을 샘플링해 썼다.',

ideas:[
 {h:'과제 152개 전수 평가로 스케일의 경계를 그린다',
  lead:'같은 데이터로 학습한 44M~280B 여섯 모델을 152개 과제에 돌려 규모의 효과를 분리한다.',
  d:'Gopher family는 파라미터 수만 다르고 학습 데이터·토큰 수는 동일하다. 이 덕분에 "이 과제 점수가 오른 것은 데이터가 아니라 순수하게 크기 때문"이라고 말할 수 있다. 280B와 7.1B 이하 최고 모델을 비교한 결과, 152개 중 79개(51.2%)가 25% 이상의 유의미한 개선을 보였고 16개(10.5%)는 개선이 거의 없었다.'},
 {h:'읽기·지식·사실 확인은 스케일이 잘 듣는다',
  lead:'Reading Comprehension·Fact Checking·Humanities 범주에서 스케일 효과가 가장 크게 나타난다.',
  d:'RACE-h 고교 독해에서 47.9%(이전 LM SOTA) → 75.1%(Gopher)로 뛰었고, MMLU 57개 과목 평균 정확도는 GPT-3 43.9% · UnifiedQA 48.9% 대비 **60.0%**를 기록했다. 152개 과제 중 이전 언어모델 SOTA와 비교 가능한 124개에서 **100개(81%)**를 갱신했다. 저자들은 이 패턴을 "사실을 더 많이 암기하는 것"으로 설명한다 — 세상 지식을 압축하는 것은 상대적으로 쉬운 목표라는 뜻이다.'},
 {h:'수학·논리 추론은 스케일이 거의 안 듣는다',
  lead:'Maths·Logical Reasoning 범주는 280B에서도 개선폭이 가장 작다.',
  d:'BIG-bench의 Abstract Algebra, Temporal Sequences, MMLU의 High School Mathematics 같은 과제는 오히려 7.1B보다 280B 성능이 낮은 경우도 있었다. 저자들은 다단계 추론처럼 "정답에 이르는 경로 자체가 복잡한" 과제는 다음 토큰 예측 손실을 줄이는 것만으로는 저절로 좋아지지 않는다고 결론짓는다. 이는 이후 [CoT](#/p/cot) 계열이 별도의 프롬프팅·[RL](#/p/instructgpt) 개입을 필요로 하게 되는 배경이 된다.',},
 {h:'MassiveText: 고품질 텍스트를 직접 큐레이션한다',
  lead:'품질 필터링·중복 제거를 강하게 거친 2.35억 문서 데이터셋을 새로 구축한다.',
  d:'웹(MassiveWeb), 책, 뉴스, GitHub 코드, 위키피디아를 섞어 10.5TB를 모으고, 그중 3000억 토큰(12.8%)만 샘플링해 학습에 쓴다. 데이터 소스별 샘플링 비율을 학습 데이터 구성의 핵심 설계 변수로 다뤘다는 점에서, 이후 데이터 품질 자체를 스케일링 축으로 보는 [RefinedWeb](#/p/refinedweb) 류 연구의 전신이다.'},
 {h:'스케일과 별개로 독성·편향을 분리해 측정한다',
  lead:'모델이 커질수록 독성 프롬프트에 더 정확히(=더 독성으로) 반응한다는 것을 보인다.',
  d:'RealToxicityPrompts로 측정하면, 입력 프롬프트의 독성이 높을수록 큰 모델일수록 더 독성 있는 답을 생성하는 경향이 7.1B 근처에서 정체(plateau)된다. 동시에 독성 텍스트를 **분류**하는 능력도 스케일에 따라 좋아진다 — "더 잘 흉내내면서 동시에 더 잘 탐지한다"는 이중적 결과다.'}
],

diagram:{type:'compare', cap:'같은 데이터·같은 토큰 수로 크기만 다른 모델을 학습시켜, "커지면 좋아지는 과제"와 "안 좋아지는 과제"를 분리한 실험 설계.',
 left:{t:'스케일이 잘 듣는 과제', items:['독해(RACE) · 사실 확인(FEVER)','일반 지식 · MMLU 57과목','STEM·인문학 시험형 문제']},
 right:{t:'스케일이 안 듣는 과제', items:['수학(Abstract Algebra 등)','다단계 논리 추론','일부는 280B가 7.1B보다 낮음']}},

math:[
 {expr:'relative improvement = (score_280B − score_best≤7.1B) / score_best≤7.1B',
  tex:'\\text{RelImp} = \\frac{\\text{score}_{280B} - \\text{score}_{\\le 7.1B}^{\\text{best}}}{\\text{score}_{\\le 7.1B}^{\\text{best}}}',
  d:'논문이 152개 과제를 분류하는 기준. 이 값이 25%를 넘으면 "유의미한 개선"(79개 과제), 0 이하이면 "개선 없음"(16개 과제)으로 분류했다.'}
],

numbers:[
 {k:'모델 크기', v:'280B (Gopher family 최대)', d:'44M~280B 여섯 모델, 전부 300B 토큰·2048 컨텍스트로 동일 학습'},
 {k:'MassiveText', v:'2.35억 문서 · 10.5TB', d:'그중 3000억 토큰(12.8%)만 샘플링해 실제 학습에 사용'},
 {k:'LM SOTA 갱신', v:'124개 중 100개 (81%)', d:'비교 가능한 과제 기준. Fact-checking·일반지식에서 특히 큼'},
 {k:'MMLU (5-shot)', v:'60.0%', d:'GPT-3 43.9% · UnifiedQA 48.9%. 인간 전문가 평균은 89.8%로 아직 격차 큼'},
 {k:'RACE-h 정확도', v:'47.9% → 75.1%', d:'이전 LM SOTA 대비 Gopher. 인간 평가자 수준에 근접'},
 {k:'유의미 개선 과제 비율', v:'51.2% (79/152)', d:'25% 이상 개선. 개선 없음은 16개(10.5%)'}
],

impact:'이 논문 이후 "모델을 키우면 다 좋아진다"는 단순한 서사가 깨졌다. 152개 과제를 지식형과 추론형으로 나눠 보여준 것 자체가 이후 벤치마크 설계([BIG-bench](#/p/gpt3), MMLU 확산)에 영향을 줬고, "어떤 능력이 스케일로 해결되지 않는가"라는 질문이 [CoT](#/p/cot)·도구 사용·RL 기반 정렬 연구의 동기가 됐다. 그러나 이 논문의 연산 배분 자체는 곧바로 도전받는다 — 같은 연산 예산으로 학습된 70B [Chinchilla](#/p/chinchilla)가 280B Gopher를 전 영역에서 이기며, Gopher가 파라미터 대비 데이터가 부족한 **"과소학습(undertrained)"** 상태였음을 보였다. Gopher의 성능 갭 중 일부는 "능력의 한계"가 아니라 "토큰 수 부족"이었던 셈이다.',

legacy:[
 '**[Chinchilla](#/p/chinchilla)의 표적** — 같은 연산 예산·1/4 크기·4배 데이터로 Gopher를 전 벤치마크에서 이기며, 파라미터를 늘리기 전에 토큰부터 늘리라는 [스케일링 법칙](#/p/scaling-laws) 수정을 이끌어냄',
 '**MassiveText → 데이터 큐레이션 계열** — 웹 텍스트 품질 필터링을 정면 과제로 다룬 것이 이후 [RefinedWeb](#/p/refinedweb) 등 데이터 중심 연구로 이어짐',
 '**과제별 스케일 곡선 분석** — "능력이 규모로 뜨는지, 안 뜨는지"를 나누는 이 논문의 방법론이 이후 emergent ability 논쟁의 초기 근거 자료가 됨',
 '**독성·편향의 스케일 종속성** — 모델이 커질수록 유해 콘텐츠를 더 정교하게 흉내내면서 동시에 더 잘 탐지한다는 결과가, 이후 안전 정렬 연구에서 반복 인용됨'
],

pitfalls:[
 '**"Gopher가 수학을 못한다"는 능력의 한계가 아니라 데이터·학습 설계의 문제일 수 있다.** Chinchilla가 보여줬듯 같은 연산으로 더 많은 토큰을 학습했다면 격차 일부는 좁혀졌을 것이다 — 이 논문만으로 "스케일의 절대적 한계"를 단정할 수 없다.',
 '**81% 과제에서 SOTA를 갱신했다는 수치는 "비교 가능한 124개 과제" 기준이다.** 전체 152개 과제 전부에서 이전 최고 모델을 이겼다는 뜻이 아니다.',
 '**독성·MMLU 등 벤치마크 수치는 특정 프롬프트 형식(5-shot 등)에 의존한다.** 저자들 스스로도 독성 정의 자체가 주관적이라고 명시한다.'
],

figures:[
 {f:'fig-scale-by-task.png',
  cap:'막대 하나가 과제 하나. y축은 7.1B 이하 최고 모델 대비 280B Gopher의 상대 성능 개선율(%). Maths·Logical Reasoning·Common Sense 그룹은 막대가 낮고 일부는 음수(주황)인 반면, Fact Checking·STEM & Medicine·Humanities & Ethics·Reading Comprehension은 오른쪽으로 갈수록 150~300%까지 치솟는다 — 이 논문의 핵심 결론이 그래프 하나에 요약된 그림.',
  src:'원문 Figure 4, p.12'}
],

quotes:[
 {t:'Gains from scale are largest in areas such as reading comprehension, fact-checking, and the identification of toxic language, but logical and mathematical reasoning see less benefit.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2112.11446 — Scaling Language Models: Methods, Analysis & Insights from Training Gopher', u:'https://arxiv.org/abs/2112.11446'},
 {t:'DeepMind blog: Language modelling at scale', u:'https://deepmind.google/discover/blog/language-modelling-at-scale-gopher-ethical-considerations-and-retrieval/'}
]
});
