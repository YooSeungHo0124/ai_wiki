WIKI.paper({
slug:'livecodebench',
venue:'arXiv 2024 (COLM 2024)',
authors:'Jain et al. (UC Berkeley · MIT · Cornell)',
arxiv:'2403.07974',

tldr:'코드 평가의 오염(contamination) 문제를 **시간으로** 푼 벤치마크. 문제마다 대회 출제일을 태깅해, 모델의 학습 데이터 컷오프 이후에 나온 문제만 골라 평가하면 실제 코딩 능력을 오염 없이 잴 수 있다는 것을 실증으로 보였다.',

context:'[HumanEval](#/p/humaneval)·[APPS](#/p/apps)·MBPP 같은 코드 벤치마크는 자연어→코드 생성 한 종류의 태스크만 재고, 무엇보다 **문제 자체가 이미 모델의 학습 데이터에 들어있을 위험**이 크다. 기존 연구들은 정확·퍼지 매칭으로 탈오염(decontamination)을 시도했지만, 살짝 바꿔 쓴 문제는 매칭을 피해가고, 애초에 어떤 데이터가 학습에 들어갔는지 외부에서 알 방법이 없다. 저자들의 질문은 단순하다 — 매칭으로 오염을 찾을 게 아니라, **애초에 모델이 볼 수 없었던 시점의 문제만 쓰면 되지 않는가.**',

ideas:[
 {h:'Live update: 출제일로 오염을 원천 차단한다',
  lead:'LeetCode·AtCoder·CodeForces에서 계속 새 문제를 수집해 출제일을 태깅해 둔다.',
  d:'2023년 5월부터 2024년 5월까지 세 대회 플랫폼에서 511문제를 모아 각각 정확한 출시일을 기록한다. 새 모델을 평가할 때는 그 모델의 학습 데이터 컷오프 날짜 **이후**에 나온 문제만 골라 채점한다. 컷오프 이전 문제에서 성능이 유독 높다면 그것이 곧 오염의 증거가 된다.'},
 {h:'시간을 축으로 실제 오염을 관찰한다',
  lead:'DeepSeek-Instruct는 자기 출시일(2023년 9월) 이후 LeetCode 문제에서, GPT-4-O는 컷오프(2023년 11월) 이후 문제에서 정확도가 뚝 떨어진다.',
  d:'Figure 1이 그 증거다. Code Generation·Test Output Prediction 두 시나리오 모두에서, 두 모델은 자신의 릴리스/컷오프 날짜 이전 문제에서는 Pass@1이 높다가 그 시점을 넘긴 문제부터 급격히 낮아진다. 이는 해당 모델들이 오래된 LeetCode 문제를 학습 데이터로 봤을 가능성이 높다는 뜻이며, 시간 분할 평가가 오염을 실제로 잡아낸다는 것을 보여준다.'},
 {h:'코드 생성 하나가 아니라 네 가지 시나리오로 전면 평가한다',
  lead:'코드 생성·자가 수정(self-repair)·코드 실행·테스트 출력 예측까지 네 능력을 따로 잰다.',
  d:'Code Generation은 기존 벤치마크와 같은 자연어→코드다. Self-Repair는 처음 생성한 코드가 틀렸을 때 실패한 테스트 정보를 주고 고치게 한다. Code Execution은 주어진 코드와 입력에 대해 실행 결과(출력)를 예측하게 한다. Test Output Prediction은 이 논문이 새로 도입한 태스크로, 문제 설명과 입력만 보고 정답 출력을 추론하게 해 코드를 실제로 "이해"하는지를 코드 작성 없이 잰다. 시나리오마다 순위가 달라져 — 예컨대 Claude-3-Opus·Mistral-Large는 코드 실행·테스트 예측에서 상대적으로 강하다 — 생성 능력 하나만으로 코딩 능력을 재는 것이 불완전함을 보인다.'}
],

diagram:{type:'flow', cap:'같은 모델을 컷오프 이전/이후로 나눠 평가하면 오염 여부가 드러난다.',
 nodes:[
  {t:'문제 수집', s:'LeetCode·AtCoder·CF'},
  {t:'출제일 태깅', s:'2023.5~2024.5'},
  {t:'컷오프 기준 분할', s:'모델별 학습 시점', acc:true, note:'이후만 채점'},
  {t:'4개 시나리오 평가', s:'생성·수정·실행·예측'}
 ]},

numbers:[
 {k:'문제 수', v:'511개', d:'LeetCode·AtCoder·CodeForces, 2023.5~2024.5'},
 {k:'평가 시나리오', v:'4개', d:'코드 생성·self-repair·코드 실행·테스트 출력 예측'},
 {k:'평가 모델 수', v:'base 18개 + instruction-tuned 34개', d:'오픈·클로즈드 소스 포함'},
 {k:'오염 증거', v:'DS-Ins 2023.9 / GPT-4-O 2023.11', d:'각 모델의 릴리스·컷오프 시점 이후 LeetCode 문제에서 정확도 급락'}
],

impact:'LiveCodeBench는 "탈오염을 사후에 검증하지 말고, 애초에 시간으로 설계하라"는 방법론을 코드 평가에 정착시켰다. 지속적으로 새 문제를 추가하는 라이브 리더보드 형태 자체가, 벤치마크가 출시 직후부터 오염되기 시작하는 문제에 대한 실용적 대응으로 이후 다른 도메인 평가에도 참고됐다. 코드 생성 하나만 재던 관행을 self-repair·실행·출력 예측까지 넓힌 것도 이후 코드 LLM 평가의 표준 구성 요소가 됐다.',

legacy:[
 '**시간 태깅 평가의 표준화** — 이후 코드·수학 벤치마크들이 "최신 시점 이후 문제만" 방식을 채택',
 '**[HumanEval](#/p/humaneval)·[APPS](#/p/apps) 세대와의 단절** — 정적 스냅샷 벤치마크의 한계를 실증적으로 보여 라이브·지속 갱신형 벤치마크로 무게중심 이동',
 '**멀티 시나리오 코드 평가의 정착** — 생성뿐 아니라 수정·실행·이해까지 함께 재는 구성이 이후 코드 리더보드의 기본 틀이 됨',
 '**[MMLU-Pro](#/p/mmlu-pro)·[GPQA](#/p/gpqa)와 같은 흐름** — "기존 벤치마크가 포화·오염됐다"는 2023~2024년의 공통 문제의식을 코드 도메인에서 실증'
],

pitfalls:[
 '**"contamination-free"는 절대적 보장이 아니다.** 모델 제공사가 공개한 컷오프 날짜를 신뢰해야 하며, 그 날짜 자체가 부정확하거나 공개되지 않으면 시간 분할이 무력화된다.',
 '**LeetCode 등 대회 문제는 일반적인 실무 코딩과 성격이 다르다.** 경쟁 프로그래밍 스타일 문제에서의 성능이 실제 소프트웨어 엔지니어링 능력([SWE-bench](#/p/swe-bench) 류)을 대변하지는 않는다.',
 '**시나리오별 순위가 뒤바뀐다는 것을 "종합 1위 = 전 영역 1위"로 오해하면 안 된다.** 논문 자체가 holistic 평가의 필요성을 강조하는 이유다.'
],

figures:[
 {f:'fig1-contamination.png',
  cap:'x축은 LeetCode 문제의 출제월. 왼쪽(코드 생성)·오른쪽(테스트 출력 예측) 둘 다에서 파란 선(DS-Ins-33B)이 자신의 릴리스일(9월) 근처부터, 빨간 선(GPT-4-O)이 자신의 컷오프일(11월) 근처부터 뚝 떨어진다 — 그 이전 구간(분홍 배경)에서의 높은 점수가 오염의 증거다. 초록 배경이 공정 비교에 쓰는 사후 구간.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'we introduce LiveCodeBench, a holistic and contamination-free evaluation of LLMs for code, which collects new problems over time from contests',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2403.07974 — LiveCodeBench', u:'https://arxiv.org/abs/2403.07974'},
 {t:'LiveCodeBench 리더보드', u:'https://livecodebench.github.io/'}
]
});
