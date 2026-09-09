WIKI.paper({
slug:'arc-bench',
venue:'arXiv 2018',
authors:'Clark et al. (Allen Institute for AI)',
arxiv:'1803.05457',

tldr:'초등·중학교 과학 시험 문제 중 **검색과 단어 통계로는 못 푸는 문제만** 걸러내 벤치마크(ARC)를 만든 논문. 벤치마크의 난이도가 문제 자체가 아니라 "어떤 필터를 통과했는가"로 정의될 수 있다는 것을 보였다.',

context:'2018년 QA 연구는 SQuAD·SNLI처럼 지문 안에 답이 표면적으로 드러나는 데이터셋으로 빠르게 발전하고 있었다. 문제는 이런 데이터셋이 **표면 단서**만으로 상당 부분 풀린다는 점이다. 답과 겹치는 단어가 지문에 그대로 있거나, 질문과 오답의 단어 통계만 봐도 정답을 추측할 수 있는 문제가 섞여 있었다. 저자들은 "질문응답을 다 풀었다고 생각하는가?"라는 도발적 질문을 던지며, 표면 단서로는 절대 못 푸는 문제만 남긴 벤치마크가 필요하다고 주장한다. 이전 시도인 2016 Kaggle Allen AI Science Challenge도 비슷한 문제(과학 시험 문제)를 다뤘지만 난이도 분리가 없었다.',

ideas:[
 {h:'Challenge Set: 두 baseline이 다 틀린 문제만 남긴다',
  lead:'IR(정보 검색)과 PMI(단어 공기 통계) 두 solver가 모두 틀린 문제만 Challenge Set으로 분리한다.',
  d:'전체 7787문제 중 **IR solver**(질문+답을 검색 쿼리로 만들어 5×10^10 토큰 코퍼스에서 뒷받침 문장을 찾는 방식)와 **PMI solver**(질문과 답 사이 단어 점별상호정보량을 계산하는 방식) 둘 다 정답을 못 맞힌 문제만 Challenge Set(2590문제)에 넣고, 나머지는 Easy Set(5197문제)이다. 정의 자체가 "현재 알려진 얕은 방법으로는 못 푸는 문제"라는 조작적 기준이다.'},
 {h:'벤치마크 난이도를 사람이 아니라 알고리즘이 정한다',
  lead:'문제의 실제 난이도가 아니라 baseline 알고리즘의 실패 여부로 Challenge/Easy를 가른다.',
  d:'기존 벤치마크는 사람이 주관적으로 "이건 어려운 문제"라고 고르거나, 아예 난이도 구분이 없었다. ARC는 **두 개의 구체적 알고리즘이 둘 다 틀렸다**는 재현 가능한 기준으로 난이도를 정의한다. 이 방식은 "지금 이 방법들로는 못 푼다"는 뜻이지 "본질적으로 어렵다"는 뜻은 아니라는 한계도 스스로 인정한다.'},
 {h:'ARC Corpus: 검색을 막지 않되 함께 공개한다',
  lead:'1.4GB·14M문장짜리 과학 지식 코퍼스를 함께 배포해 지식 접근성 자체는 문제 삼지 않는다.',
  d:'ARC가 어려운 이유가 "필요한 지식이 아예 존재하지 않아서"가 아니라 "검색·통계로는 그 지식을 조합·추론하지 못해서"임을 보이기 위해, 관련 지식이 담긴 코퍼스(ARC Corpus)를 함께 공개했다. 샘플 분석 결과 Challenge 문제의 약 95%에 관련 지식이 이 코퍼스 안에 실제로 존재한다.'},
 {h:'지문 없는 4지선다 — 순수 지식과 추론만 남긴다',
  lead:'독해 지문 없이 질문과 선택지만 주어 배경지식과 추론 능력을 직접 시험한다.',
  d:'SQuAD류는 지문을 주고 그 안에서 답을 찾게 하지만, ARC는 어떤 지문도 주지 않는다. 오직 질문과 3~5개 선택지만 있다. 따라서 시스템은 (1) 관련 지식을 스스로 찾아오고 (2) 그 지식으로 추론해 정답을 골라야 한다. Table 4·5는 이 문제들이 정의·인과 추론·유추·대수적 추론 등 다양한 유형에 걸쳐 있음을 보여준다.'}
],

diagram:{type:'flow', cap:'ARC 문제 필터링 파이프라인. 두 solver를 통과(정답)하면 Easy, 둘 다 실패하면 Challenge.',
 nodes:[
  {t:'과학 시험 문제', s:'7787문제 수집'},
  {t:'IR solver', s:'검색 기반'},
  {t:'PMI solver', s:'단어 공기 통계'},
  {t:'둘 다 실패?', s:'분기', acc:true},
  {t:'Challenge Set', s:'2590문제'}
 ]},

numbers:[
 {k:'전체 문제 수', v:'7,787개', d:'4지선다(일부 3~5지), 지문 없는 과학 문제'},
 {k:'Challenge / Easy', v:'2,590 / 5,197', d:'IR·PMI 두 solver가 모두 틀린 것만 Challenge'},
 {k:'Challenge Set 최고 baseline', v:'27.11%', d:'DGEM. 95% 신뢰구간 ±2.5%인 무작위 추측(약 25%)과 유의한 차이 없음'},
 {k:'Easy Set 최고 baseline', v:'55~65%', d:'같은 모델들이 Easy Set에서는 확연히 높은 점수'},
 {k:'ARC Corpus', v:'14M문장 · 1.4GB', d:'Challenge 문제의 약 95%에 관련 지식이 실제로 존재'},
 {k:'대상 학년', v:'3~9학년', d:'만 8~13세 수준의 grade-school 과학 시험 문제'}
],

impact:'ARC는 "리더보드 점수가 오른다고 이해력이 늘었다는 뜻은 아니다"는 문제의식을 벤치마크 설계 방법론으로 구체화했다. 이후 [HellaSwag](#/p/hellaswag)의 적대적 필터링, [MMLU](#/p/mmlu) 같은 지식 벤치마크로 이어지는 "모델이 못 푸는 문제만 남긴다"는 벤치마크 구축 철학의 초기 사례다. 지문 없이 배경지식과 추론만으로 푸는 4지선다 형식은 오늘날 LLM 리더보드(MMLU, ARC-Challenge)의 표준 항목으로 남아 있다.',

legacy:[
 '**적대적 필터링 계열의 선구** — [HellaSwag](#/p/hellaswag)가 "모델이 헷갈리는 오답을 자동 생성"하는 방식으로 이 아이디어를 한 단계 발전시킴',
 '**리더보드 표준 문항화** — [GPT-3](#/p/gpt3), LLaMA 등 이후 거의 모든 LLM 평가 논문이 ARC-Challenge를 few-shot 벤치마크로 보고',
 '**"벤치마크 자체가 취약할 수 있다"는 경각심** — Challenge Set 정의가 특정 baseline(IR, PMI)에 종속적이라는 한계가 이후 벤치마크 설계 논의의 참고 사례가 됨',
 '**지식+추론 분리형 QA의 원형** — 지문 없는 4지선다 포맷이 [MMLU](#/p/mmlu) 등 오늘날 지식 벤치마크의 기본 형식으로 이어짐'
],

pitfalls:[
 '**"Challenge Set이 본질적으로 더 어렵다"는 뜻이 아니다.** 정의상 "2018년 IR·PMI가 실패한 문제"일 뿐이며, 더 나은 검색 기법이 나오면 일부는 다시 쉬워질 수 있다.',
 '**ARC-Easy를 무시하면 안 된다.** 같은 baseline이 Easy에서는 55~65%를 내므로, Challenge만 보면 "이 모델이 과학 지식을 전혀 못 다룬다"고 과장하기 쉽다.',
 '**표는 Table 6 원문 baseline 비교로, 오늘날 LLM 점수(90%+)와 직접 비교하면 당시 신경망 baseline의 낮은 점수가 무의미해 보이지만, 그 자체가 이 논문의 핵심 주장(당시 표면 단서 기반 방법의 한계)이다.**'
],

figures:[
 {f:'fig1-examples.png',
  cap:'Abstract에서 발췌한 두 Challenge 문제. 첫 문제는 "광택은 보기만 해도 알 수 있다"는 문장이 웹 코퍼스에 없어 IR이 실패하고, 두 번째 문제는 "마찰"이라는 정답 단어가 질문의 어떤 단어와도 강하게 공기하지 않아 PMI가 실패하는 사례다.',
  src:'원문 p.1'},
 {f:'fig2-knowledge-types.png',
  cap:'Challenge Set 100문제 표본을 지식 유형별로 나눈 원그래프. "정의"·"기초 사실"이 각 17.9%로 가장 크지만, 나머지 절반 이상이 인과·목적론·대수·공간 추론처럼 단순 사실 회상을 넘는 유형이라는 점이 핵심이다.',
  src:'원문 Figure 1, p.4'}
],

quotes:[
 {t:'We test several baselines on the Challenge Set, including leading neural models from the SQuAD and SNLI tasks, and find that none are able to significantly outperform a random baseline, reflecting the difficult nature of this task.',
  src:'Abstract, p.1'},
 {t:'The most striking observation is that none of the algorithms score significantly higher than the random baseline on the Challenge set, where the 95% confidence interval is ±2.5%.',
  src:'Results, p.6'}
],

links:[
 {t:'arXiv 1803.05457 — Think you have Solved Question Answering? Try ARC', u:'https://arxiv.org/abs/1803.05457'},
 {t:'ARC Dataset & Leaderboard (AI2)', u:'https://allenai.org/data/arc'}
]
});
