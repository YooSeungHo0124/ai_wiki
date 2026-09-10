WIKI.paper({
slug:'agieval',
venue:'arXiv 2023 (Microsoft)',
authors:'Zhong, Cui et al. (Microsoft)',
arxiv:'2304.06364',

tldr:'모델이 얼마나 똑똑한지를 재려고 벤치마크를 새로 만드는 대신, **사람이 실제로 치르는 표준화 시험**(수능·SAT·LSAT·사법시험·GRE)을 그대로 갖다 쓴 평가다. 이미 그 시험엔 수백만 명이 만든 사람 기준선이 있으니, "GPT-4가 몇 등급인가"를 바로 물을 수 있다.',

context:'[MMLU](#/p/mmlu)가 등장하면서 "다양한 과목 지식을 묻는 객관식"이라는 평가 형식은 자리를 잡았다. 하지만 MMLU의 문항은 온라인에서 긁어모은 것으로, 출처가 불분명하고 난이도 기준이 명확하지 않다. GPT-4 출시 직후 사람들은 "이 모델이 변호사 시험에 붙을까, 수능 영어에서 몇 점을 받을까" 같은 질문을 던졌지만, 각 보고서가 서로 다른 시험을 임의로 골라 채점 방식도 제각각이었다. 정작 "사람은 이 시험에서 평균 몇 점을 받는가"라는, 비교의 기준이 될 숫자가 벤치마크 안에 없었다. AGIEval은 이 공백을 메운다 — 채점 기준과 합격선이 이미 공인된 실제 시험 문제를 모아, 사람 평균·상위권 점수를 **같은 척도 위에** 나란히 놓는다.',

ideas:[
 {h:'인공 데이터셋이 아니라 실제 시험 원문',
  lead:'수능·LSAT·사법시험·GRE 원문 문제를 그대로 수집해 정답률을 사람 기준과 비교한다.',
  d:'중국 대학수학능력시험(Gaokao), 미국 SAT, 로스쿨 입학시험 LSAT, 중국 사법시험(JEC-QA), 수학경시대회(AMC/AIME), 공무원 시험까지 총 20개 과제·8,062문항을 모았다. 전부 객관식·빈칸채우기 형태로 제한해 채점을 자동화할 수 있게 했고, 주관식 서술형은 채점 신뢰도 문제로 아예 제외했다.'},
 {h:'사람 기준선을 같은 척도로 함께 보고',
  lead:'평균(50%)과 상위 1% 응시자 점수를 모델 점수 옆에 나란히 싣는다.',
  d:'MATH·LogiQA·JEC-QA는 원 논문에 보고된 사람 정답률을 그대로 가져왔고, LSAT·SAT·Gaokao·GRE/GMAT은 실제 시험 만점 대비 평균 응시자(50번째 백분위)와 상위 1% 응시자의 원점수를 100점 척도로 환산했다. 이 덕에 "GPT-4가 56점을 받았다"가 아니라 "GPT-4가 응시자 평균을 넘었다"처럼 **사람이 이해할 수 있는 문장**으로 결과를 말할 수 있다.'},
 {h:'영어·중국어 이중언어 벤치마크',
  lead:'같은 잣대로 두 언어권의 표준시험을 함께 평가해 언어별 격차를 드러낸다.',
  d:'Gaokao·JEC-QA·중국 공무원 시험은 중국어, SAT·LSAT·GRE/GMAT·MATH는 영어다. LogiQA는 애초에 이중언어 데이터셋이라 영어판·중국어판을 별도 과제로 뒀다. 이 구성 덕에 같은 모델이 같은 유형의 문제를 언어만 바꿔 풀었을 때 점수가 어떻게 달라지는지를 직접 비교할 수 있다.'},
 {h:'zero-shot / few-shot / CoT 네 가지 설정을 전부 측정',
  lead:'프롬프트 방식 4가지 × 모델 3~4개로 같은 문항을 반복 채점한다.',
  d:'각 문항을 zero-shot, zero-shot [Chain-of-Thought](#/p/cot), few-shot(5-shot), few-shot CoT 네 가지 설정으로 [GPT-4](#/p/gpt4)·ChatGPT·Text-Davinci-003·Vicuna-13B에 돌렸다. 이렇게 얻은 4×N 행렬에서 "CoT가 항상 도움이 되는가", "few-shot이 zero-shot보다 나은가" 같은 질문에 표 하나로 답할 수 있게 설계했다.'},
 {h:'이해·지식·추론·계산 네 능력으로 오답을 분해',
  lead:'문항을 요구 능력별로 태깅해 어떤 능력이 병목인지 짚어낸다.',
  d:'단순 벤치마크 점수만으로는 "왜 틀렸는지"를 알 수 없다. AGIEval은 문항이 요구하는 능력을 이해(understanding)·지식(knowledge)·추론(reasoning)·계산(calculation) 네 축으로 나눠 질적으로 분석했다. 그 결과 LSAT의 분석추론(analytical reasoning)과 물리·화학처럼 전문지식이 필요한 과목에서 모델의 약점이 뚜렷이 드러났다.'}
],

diagram:{type:'compare', cap:'MMLU와의 핵심 차이 — 문항 출처와 비교 기준.',
 left:{t:'MMLU식 벤치마크', items:['출처 불분명한 온라인 문제','영어 단일 언어','사람 기준선 없음','정답률만 단독 보고']},
 right:{t:'AGIEval', items:['공인 표준시험 원문','영어·중국어 이중언어','응시자 평균·상위 1% 병기','합격선 대비 위치로 해석']}},

numbers:[
 {k:'과제 수 · 문항 수', v:'20개 시험 · 8,062문항', d:'전부 객관식/빈칸채우기, 자동 채점 가능한 형태만 포함'},
 {k:'SAT-Math (zero-shot CoT)', v:'GPT-4 95.0%', d:'같은 시험 응시자 평균(66%)·상위 1%(94%)를 모두 넘어섬'},
 {k:'Gaokao-영어 (zero-shot CoT)', v:'GPT-4 92.5%', d:'중국 수능 영어 영역, 응시자 평균 69% 대비 크게 앞섬'},
 {k:'전체 20과제 평균 (zero-shot CoT)', v:'GPT-4 58.4% · ChatGPT 43.2% · TD-003 37.4%', d:'사람 평균 67%에는 아직 못 미치는 수치'},
 {k:'LSAT-분석추론 (zero-shot CoT)', v:'GPT-4 34.4%', d:'사람 평균 56%에도 못 미치는, 전 과제 중 최하위권 성능'},
 {k:'응시 규모', v:'Gaokao 연 1,200만 명 · SAT 연 170만 명', d:'사람 기준선이 소수 전문가가 아니라 이 규모의 모집단에서 나온 값'}
],

impact:'AGIEval 이후 "이 모델이 변호사 시험/의사 시험/수능에서 몇 점인가"라는 질문이 LLM 발표 자료의 표준 항목이 됐다. GPT-4 기술보고서 자체도 변호사 시험 등 사람 시험 성적을 대표 지표로 내세웠는데, AGIEval은 그런 산발적 주장들을 **재현 가능한 벤치마크**로 통합했다. 또한 "사람 평균/상위 1%"라는 두 기준선을 표준 관행으로 정착시켜, 이후 벤치마크들이 정답률 숫자만 던지지 않고 사람과의 상대적 위치로 결과를 서술하게 만들었다.',

legacy:[
 '**시험 기반 평가의 확산** — 이후 의료 면허시험(MedQA), 각국 사법시험 등 "특정 국가 자격시험을 통과하는가"를 재는 후속 벤치마크들이 같은 방법론을 반복',
 '**[HELM](#/p/helm)류 종합평가와의 역할 분담** — HELM/[BIG-bench](#/p/bigbench)가 광범위한 태스크를 커버한다면, AGIEval은 "사람 기준선이 있는 시험"이라는 좁지만 해석 가능한 축을 담당',
 '**CoT 평가의 표준 세팅화** — zero-shot/few-shot과 CoT 유무를 교차한 2×2 평가 설계가 이후 벤치마크 논문들의 기본 표 구성으로 자리잡음',
 '**사람 기준선 명시 관행** — 벤치마크에 "인간 정답률"을 나란히 싣는 것이 이후 [Chatbot Arena](#/p/chatbot-arena) 등 사람 비교 평가 흐름과 맞물려 표준 관행이 됨'
],

pitfalls:[
 '**LSAT·SAT·Gaokao의 "사람 점수"는 실측이 아니라 추정치다.** 원 시험의 평균/상위 1% 원점수를 100점 척도로 스케일링한 값이라, 실제로 사람에게 이 정확한 8,062문항을 풀린 결과가 아니다.',
 '**시험 데이터의 데이터 오염(contamination) 문제를 원천적으로 피하기 어렵다.** LSAT은 1991~2016년 기출, Gaokao·SAT도 공개 기출을 썼기 때문에, GPT-4 같은 모델의 사전학습 코퍼스에 같은 문제(와 해설)가 이미 포함됐을 가능성을 배제하지 못한다.',
 '**"사람 평균을 넘었다"가 "그 시험이 요구하는 능력을 갖췄다"는 뜻은 아니다.** SAT-English에서 지문 없이(w/o Psg.) 풀게 하면 GPT-4 점수가 88.8%에서 25.2%로 급락하는데(few-shot CoT 기준 63.6%), 이는 사전학습 지식으로 지문 없이도 답을 맞히는 경우가 섞여 있었다는 뜻이라 원 논문도 이 항목을 따로 분리해 보고한다.'
],

figures:[
 {f:'fig1-radar.png',
  cap:'8각 레이더 차트. 각 축이 시험 하나(SAT·LSAT·GMAT&GRE·수학경시·공무원시험·사법시험·수능)이고, 값이 클수록 바깥쪽. 하늘색 두 겹이 사람 평균/상위 1%, 노란선이 GPT-4다. GPT-4가 SAT·LSAT·수학경시 축에서는 사람 평균(안쪽 하늘색)을 넘어 상위권 하늘색에 가깝지만, 나머지 축에서는 사람 평균 안쪽에 머문다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'Traditional benchmarks, which rely on artificial datasets, may not accurately represent human-level capabilities.',
  src:'Abstract, p.1'},
 {t:'GPT-4 surpasses average human performance on SAT, LSAT, and math competitions, attaining a 95% accuracy rate on the SAT Math test and a 92.5% accuracy on the English test of the Chinese national college entrance exam.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2304.06364 — AGIEval', u:'https://arxiv.org/abs/2304.06364'},
 {t:'GitHub — ruixiangcui/AGIEval', u:'https://github.com/ruixiangcui/AGIEval'},
 {t:'GPT-4 Technical Report (사람 시험 성적 보고)', u:'https://arxiv.org/abs/2303.08774'}
]
});
