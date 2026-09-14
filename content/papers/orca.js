WIKI.paper({
slug:'orca',
authors:'Mukherjee, Mitra et al. (Microsoft Research)',
arxiv:'2306.02707',

tldr:'Alpaca류 지시 따르기 모델이 GPT의 **응답 스타일만** 모방하고 추론 과정은 배우지 못한다는 것을 진단하고, GPT-4의 **설명 추적(explanation traces)** 을 단계적으로 모방시켜 13B 모델을 만든다. 평가 방식 자체의 함정도 같이 드러낸다.',

context:'2023년 상반기, Alpaca·Vicuna류 모델은 ChatGPT 출력을 모방 학습해 GPT-4 심사에서 ChatGPT의 90%대 품질을 받았다고 보고됐다. 그런데 이 평가는 **GPT-4에게 "어느 쪽 답이 더 그럴듯한가"를 묻는** 방식이라, 답의 스타일이 유창하면 점수가 올라간다. Orca 저자들은 같은 Vicuna-13B를 SAT·LSAT 같은 **정답이 정해진 시험**으로 재평가했고, 점수가 급락하는 것을 확인했다. 문제는 모방 데이터 자체에 있었다 — self-instruct류 방법은 짧고 단순한 질문·답 쌍만 만들고, ShareGPT류 대화 데이터는 창작·정보 검색에 편중돼 **추론 과정을 보여주는 신호가 거의 없었다.**',

ideas:[
 {h:'GPT-4 심판 평가는 품질을 과대평가한다',
  lead:'같은 Vicuna-13B가 GPT-4 심사로는 92점, 실제 시험 채점으로는 64점·48점을 받는다.',
  d:'Vicuna-13B는 GPT-4를 심판으로 쓴 평가(Vicuna 평가셋)에서 ChatGPT 대비 92%의 품질로 평가됐다. 그런데 정답이 있는 전문 시험(AGIEval)에서는 64%, 복잡한 추론 벤치마크(BigBench-Hard)에서는 48%로 떨어진다. 저자들은 이를 "**유창하지만 추론은 약하다**"는 신호로 해석했다.'},
 {h:'응답이 아니라 설명 추적을 모방',
  lead:'GPT-4의 최종 답이 아니라 그 답에 이르는 단계별 사고 과정을 학습 신호로 쓴다.',
  d:'system message로 "단계별로 생각하라", "근거를 설명하라" 같은 지시를 줘 GPT-4가 사고 과정을 노출하도록 유도하고, 그 설명 추적 전체를 학습 데이터로 쓴다. 16종의 system message를 만들어 답변 길이·형식·어조를 다양화했다(예: CoT 유도, 간결한 답, 상세한 답).'},
 {h:'ChatGPT를 교사 보조로 쓰는 점진적 학습',
  lead:'약한 교사(ChatGPT)로 먼저 데이터 규모를 키운 뒤 강한 교사(GPT-4)로 다듬는다.',
  d:'FLAN-v2에서 뽑은 500만 개 지시문 전체에 ChatGPT 응답을 모으고, 그중 100만 개에는 GPT-4 응답도 추가로 모았다. GPT-4 데이터(FLAN-1M)만으로 학습한 모델보다, ChatGPT 500만 + GPT-4 100만을 함께 학습한 모델이 AGIEval 평균 41.7점으로 GPT-4 단독(37.18점)보다 4.5점 높았다 — 데이터 규모를 늘리는 "교사 보조"가 실제로 도움이 된다.'},
 {h:'대규모·다양한 지시문 풀 자체가 핵심',
  lead:'FLAN-v2의 1500여 과제를 샘플링해 단순 self-instruct보다 다양한 지시문을 확보한다.',
  d:'FLAN-CoT, Public Pool of Prompts, NIv2, T0 등 기존 대규모 지시 데이터셋을 재활용해 다양한 과제 유형·난이도를 확보했다. Alpaca나 WizardLM이 self-instruct/Evol-Instruct로 생성한 지시문보다 훨씬 넓은 분포를 커버한다.'}
],

diagram:{type:'compare', cap:'응답 모방(Alpaca류) vs 설명 추적 모방(Orca)의 차이.',
 left:{t:'응답 모방', items:['짧은 self-instruct 질문','최종 답만 학습','스타일은 닮지만 추론은 약함']},
 right:{t:'Orca: 설명 추적 모방', items:['system message로 사고과정 유도','GPT-4의 단계별 설명 학습','ChatGPT로 규모, GPT-4로 품질']}},

numbers:[
 {k:'BBH 상대 개선', v:'Vicuna 대비 +100% 이상', d:'zero-shot BigBench-Hard에서 ChatGPT와 동률'},
 {k:'AGIEval 상대 개선', v:'Vicuna 대비 +42%', d:'SAT·LSAT·GRE·GMAT 등 zero-shot MCQ'},
 {k:'ChatGPT 대비 격차', v:'system message 최적화 시 4.4점', d:'AGIEval 영어 객관식 기준'},
 {k:'GPT-4 판정 vs 실채점', v:'92% → 64%(AGIEval) → 48%(BBH)', d:'Vicuna-13B, 같은 모델의 평가 방식별 점수 차'},
 {k:'교사 보조 효과', v:'+4.5점(AGIEval 평균)', d:'ChatGPT 500만+GPT-4 100만 조합 vs GPT-4 100만 단독(37.18→41.7)'}
],

impact:'"모델이 그럴듯하게 말한다"와 "모델이 실제로 추론한다"를 구분해야 한다는 경각심을 남겼다. 특히 GPT-4를 심판으로 쓰는 평가 관행 전체에 의문을 제기하면서, 이후 지시 따르기 모델 평가에서 **정답이 있는 벤치마크 병행 검증**이 표준적 요구가 되는 데 기여했다. 방법론 측면에서는 응답 자체보다 "왜 그런 답에 도달했는가"를 모방 대상으로 삼는 설명 기반 증류의 대표 사례가 되었다.',

legacy:[
 '**설명 기반 증류의 확장** — [Zephyr](#/p/zephyr)의 dSFT 단계도 넓은 의미에서 이 계열의 응용이며, 추론 traces를 학습 신호로 쓰는 흐름이 이후 reasoning 모델 증류로 이어짐',
 '**평가 방법론에 대한 경고** — LLM-as-judge 평가의 한계를 실증적으로 보여, 이후 벤치마크 설계에서 사람 채점·정답 기반 평가 병행이 강조됨',
 '**교사 보조(teacher assistance) 개념** — 여러 층위의 교사를 조합해 데이터 규모와 품질을 동시에 확보하는 아이디어가 후속 다중 교사 증류 연구로 이어짐'
],

pitfalls:[
 '**"모델 모방은 거짓 약속이다"라는 선행 비판을 정면 반박했지만, 여전히 GPT-4 자체의 한계를 넘지는 못한다.** Orca도 GPT-4에는 계속 뒤처진다.',
 '**BigBench-Hard 자체가 ChatGPT/GPT-4의 데이터 오염 가능성이 있다는 점을 저자들도 인정한다.** 완전히 깨끗한 비교는 아니다.',
 '**시스템 메시지 설계가 성능에 크게 영향을 준다** — "어떤 system message를 쓰느냐"에 따라 같은 모델의 점수가 수 점씩 흔들려서, 단일 숫자로 모델을 비교하는 것 자체가 조심스럽다.'
],

figures:[
 {f:'fig1-gpt4-judge.png',
  cap:'GPT-4를 심판으로 쓴 평가에서 Orca-13B(103)가 ChatGPT(100)보다도 높게 나온다. 이 수치만 보면 이미 ChatGPT를 능가한 것처럼 보인다.',
  src:'원문 Figure 1, p.4'},
 {f:'fig2-exam-scores.png',
  cap:'같은 Orca-13B를 정답이 있는 전문/학술 시험(SAT·LSAT·GRE·GMAT)으로 채점하면 47점으로, ChatGPT의 42점보다는 앞서지만 GPT-4 judge가 보여준 것과는 전혀 다른 그림이 나온다 — 이 대비가 논문이 지적하는 평가 함정의 핵심 증거다.',
  src:'원문 Figure 2, p.4'}
],

links:[
 {t:'arXiv 2306.02707 — Orca', u:'https://arxiv.org/abs/2306.02707'}
]
});
