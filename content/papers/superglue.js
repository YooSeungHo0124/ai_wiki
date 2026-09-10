WIKI.paper({
slug:'superglue',
venue:'NeurIPS 2019',
authors:'Wang, Pruksachatkun, Nangia, Singh, Michael, Hill, Levy, Bowman (NYU · FAIR · UW · DeepMind)',
arxiv:'1905.00537',

tldr:'[GLUE](#/p/glue)가 발표 1년 만에 사람 성능을 넘어서자, **더 어렵고 형식이 다양한 8개 과제**로 다시 만든 후속 벤치마크. "벤치마크는 모델과 함께 늙는다"는 것을 스스로 증명한 사례다.',

context:'GLUE는 2018년 발표됐지만 2019년 중반 XLNet 앙상블이 88.4점을 기록하며 사람 추정 성능 87.1점을 넘어섰고, 9개 과제 중 4개에서 사람을 앞질렀다. 문제는 GLUE의 과제 형식이 **문장/문장쌍 분류로 한정**돼 있었다는 점이다. 그 좁은 틀 안에서는 모델이 진짜 이해 없이도 얕은 통계적 신호로 점수를 딸 수 있는 여지가 있었고, 진단셋에서는 여전히 사람과 큰 격차(R3 0.80 대 0.42)가 있었다. 저자 대부분이 GLUE와 동일한 팀이었기에, 벤치마크를 처음부터 다시 설계할 동기와 경험을 모두 갖추고 있었다.',

ideas:[
 {h:'가장 어려운 과제만 남기고 공모로 채운다',
  lead:'GLUE에서 가장 안 풀리던 2개만 남기고 나머지는 공개 과제 공모로 새로 선정했다.',
  d:'GLUE 9개 과제 중 가장 어려웠던 RTE·WiC 계열만 유지하고, 나머지는 연구 커뮤니티에 과제를 공모받아 **당시 최신 NLP 방법으로 풀기 어려운 것** 위주로 골랐다. 결과가 BoolQ·CB·COPA·MultiRC·ReCoRD·RTE·WiC·WSC 8개 과제다.'},
 {h:'과제 형식을 분류 너머로 확장',
  lead:'단일/쌍 문장 분류에 갇혀 있던 GLUE와 달리 지시대명사 해소와 질의응답 형식을 추가했다.',
  d:'GLUE는 문장 또는 문장쌍 분류가 전부였다. SuperGLUE는 WSC(공지시 해소), COPA·MultiRC·ReCoRD(질의응답) 등 **답을 고르거나 채우는 형식**을 넣어, 단순 이진/다중 분류로 환원되지 않는 이해 능력을 요구한다.'},
 {h:'모든 과제에 사람 성능 추정치를 확보',
  lead:'8개 과제 전부에 사람 기준선을 새로 측정해 모델과의 실제 격차를 드러낸다.',
  d:'GLUE는 일부 과제에만 사람 성능 추정이 있었지만, SuperGLUE는 크라우드워커를 고용해 8개 과제 전부와 진단셋까지 사람 성능을 측정했다. 이 수치가 강력한 BERT 베이스라인과 사람 사이에 여전히 큰 간극이 있음을 검증하는 근거가 된다.'},
 {h:'BERT++로 전이학습 효과까지 함께 측정',
  lead:'MultiNLI·SWAG로 중간 미세조정한 BERT++를 추가해 전이학습의 기여도를 분리했다.',
  d:'단순 BERT 미세조정 외에, STILTs 방식대로 BoolQ·CB·RTE는 MultiNLI로, COPA는 SWAG로 먼저 중간 학습시킨 BERT++를 추가 베이스라인으로 두었다. 이를 통해 "사전학습 자체의 힘"과 "관련 과제로부터의 전이"를 분리해서 볼 수 있게 했다.'}
],

diagram:{type:'compare', cap:'GLUE와 SuperGLUE의 설계 차이. 형식·난이도·사람 기준선 세 축 모두에서 SuperGLUE가 더 엄격하다.',
 left:{t:'GLUE (2018)', items:['문장/문장쌍 분류만','9개 과제, 일부만 사람 기준선','1년 만에 사람 성능 초과']},
 right:{t:'SuperGLUE (2019)', items:['공지시·QA 형식 추가','8개 과제 전부 사람 기준선 측정','BERT++도 사람과 20점 격차']}
},

numbers:[
 {k:'과제 수', v:'8개', d:'GLUE에서 2개 유지 + 공모로 선정한 6개 신규'},
 {k:'BERT 평균 점수', v:'69.0', d:'최빈 클래스 베이스라인(47.1) 대비 +25점 이상 향상'},
 {k:'BERT++ 평균 점수', v:'71.5', d:'MultiNLI·SWAG 중간 학습으로 BERT 대비 +2.5점'},
 {k:'사람 평균 점수', v:'89.8', d:'BERT++ 대비 약 20점 격차 — 벤치마크 발표 시점 기준'},
 {k:'WSC 격차', v:'사람 100.0 vs BERT++ 64.3', d:'8개 과제 중 가장 큰 격차, 데이터 규모(554건)가 작은 것도 원인'},
 {k:'GLUE 포화 근거', v:'GLUE Score 88.4 (XLNet 앙상블) > 사람 87.1', d:'SuperGLUE 제작을 촉발한 직접적 수치'}
],

impact:'SuperGLUE는 벤치마크 설계를 "한 번 만들고 끝"이 아니라 **모델 발전에 맞춰 다시 조정해야 하는 과정**으로 자리잡게 했다. 문장 분류를 넘어 공지시 해소·질의응답 형식을 표준 평가 항목에 포함시켰고, 이 확장된 형식은 이후 [BIG-bench](#/p/bigbench) 같은 초대형 종합 벤치마크로 이어졌다. 동시에 SuperGLUE 역시 [RoBERTa](#/p/roberta), [T5](#/p/t5) 등에 의해 2년 안에 다시 포화되면서, 벤치마크 수명이 모델 발전 속도를 따라가지 못한다는 문제를 재확인시켰다.',

legacy:[
 '**벤치마크 수명 주기의 반복 확인** — [SQuAD](#/p/squad)→SQuAD 2.0, GLUE→SuperGLUE에 이어, SuperGLUE도 2021년경 재포화되며 순환이 계속됨을 보여줬다',
 '**적대적 설계로의 전환** — 다음 세대 벤치마크는 아예 처음부터 모델이 못 풀도록 필터링하는 방식(예: [HellaSwag](#/p/hellaswag)의 Adversarial Filtering)으로 옮겨갔다',
 '**초대형 종합 벤치마크로 확장** — 개별 태스크 큐레이션의 한계를 느낀 커뮤니티는 [BIG-bench](#/p/bigbench)처럼 수백 개 과제를 한꺼번에 모으는 방향으로 나아갔다',
 '**사람 평가 자체의 재검토** — 모델이 정적 벤치마크를 계속 넘어서자, 결국 [Chatbot Arena](#/p/chatbot-arena)처럼 사람이 실시간으로 비교 평가하는 방식이 대안으로 떠올랐다'
],

pitfalls:[
 '**SuperGLUE도 결국 다시 포화됐다.** "더 어려운 과제로 다시 만들면 해결된다"는 이 논문의 해법 자체가 항구적이지 않았고, 벤치마크-모델 경쟁은 근본적으로 끝나지 않는 순환이라는 것이 이후 반복 확인됐다.',
 '**높은 벤치마크 점수와 데이터 오염을 혼동하기 쉽다.** 사전학습 코퍼스가 웹 전반을 긁어오면서 테스트 예문이 학습 데이터에 그대로 섞여 들어가는 문제가 이후 대형 언어모델 시대에 본격화됐는데, 이는 SuperGLUE가 겨냥한 "얕은 신호로 풀기" 문제와는 다른 별개의 오염 문제다.',
 '**AXb/AXg 진단 점수는 순위에 들어가지 않는다.** Avg 열은 진단 과제를 제외한 8개 과제만의 평균이므로, 리더보드 상위권이라고 해서 진단셋에서도 사람 수준이라는 뜻은 아니다.'
],

figures:[
 {f:'fig1-saturation.png', cap:'GLUE 리더보드 제출 모델들을 시간순(왼쪽→오른쪽)으로 배치하고 사람 성능을 1.0으로 정규화한 그래프. 파란 점선(종합 GLUE Score)이 BERT 계열부터 빠르게 1.0(검은 실선, 사람 성능)에 근접·초과한다 — 이 그래프가 SuperGLUE 제작의 직접적 동기다.', src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'performance on the benchmark has recently surpassed the level of non-expert humans, suggesting limited headroom for further research.', src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1905.00537 — SuperGLUE', u:'https://arxiv.org/abs/1905.00537'},
 {t:'SuperGLUE Benchmark', u:'https://super.gluebenchmark.com/'}
]
});
