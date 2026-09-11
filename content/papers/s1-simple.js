WIKI.paper({
slug:'s1-simple',
venue:'arXiv 2025 (Stanford · UW · Allen AI · Contextual AI)',
authors:'Muennighoff, Yang, Shi, Li et al. (Stanford University)',
arxiv:'2501.19393',

tldr:'질문-추론과정 쌍 **1,000개**만 SFT로 학습하고, 생성 도중 "생각을 끝내는 토큰"을 강제로 자르거나 "Wait"를 붙여 늘리는 **budget forcing** 하나만 더하면 [DeepSeek-R1](#/p/deepseek-r1)급 추론 능력이 나온다는 것을 보인 논문. 대규모 RL 없이도 추론 시간을 직접 제어할 수 있음을 극단적으로 단순한 레시피로 증명했다.',

context:'2025년 1월, [DeepSeek-R1](#/p/deepseek-r1)이 대규모 RL로 추론 모델을 만드는 법을 공개했지만 그 파이프라인은 수백만 개 샘플과 여러 학습 단계를 필요로 한다. [test-time-scaling](#/p/test-time-scaling) 논문은 "테스트 타임 계산을 늘리면 이득"이라는 것을 보였지만 그것을 **어떻게 제어할지**는 미해결이었다. 이 논문은 질문을 던진다 — o1급 테스트 타임 스케일링을 재현하는 **가장 단순한 방법**은 무엇인가? 저자들은 Gemini 2.0 Flash Thinking Experimental에서 추론 과정을 증류한 뒤, 데이터 큐레이션과 하나의 추론 개입만으로 답한다.',

ideas:[
 {h:'s1K: 난이도·다양성·품질 3기준으로 고른 1,000문항',
  lead:'59K 후보 풀에서 어렵고 다양하고 품질 좋은 문제만 1,000개로 좁힌다.',
  d:'59K개의 (질문, Gemini 추론 흔적, 답) 삼중항 풀에서 시작해 형식이 깨졌거나 API 오류가 있는 것을 걸러 51K로 줄이고, 이 중 정성적으로 어렵고(추론 흔적이 길고 다단계) 50개 도메인에 걸쳐 다양하며 품질이 좋은 문항 1,000개만 남긴다. 무작위로 뽑은 1K나 길이만 기준으로 뽑은 1K는 이 큐레이션된 1K보다 확연히 성능이 떨어진다는 것을 ablation으로 보인다.'},
 {h:'budget forcing: 생각을 강제로 끊거나 늘린다',
  lead:'end-of-thinking 토큰을 강제로 넣어 끊거나, 그 자리에 "Wait"를 붙여 계속 생각하게 만든다.',
  d:'생성 중 사고 구간(thinking) 토큰 수를 상한으로 강제 종료시키면 짧게 생각하고 답하게 되고, 반대로 모델이 사고를 끝내려는 지점에서 종료 구분자 대신 `"Wait"`를 붙이면 모델이 스스로 답을 재검토·수정하며 계속 생각한다. 이 개입 하나가 이 논문에서 유일한 새 추론 시점 기법이다.'},
 {h:'순차 스케일링이 병렬 다수결보다 낫다',
  lead:'같은 토큰 예산이면 Wait로 늘려 순차적으로 더 생각하는 쪽이 병렬 다수결보다 낫다.',
  d:'같은 계산 예산에서 병렬 샘플링 후 다수결(majority voting)과, budget forcing으로 한 번의 사고 흐름을 순차적으로 늘리는 것을 비교하면 후자가 일관되게 낫다. 이는 [test-time-scaling](#/p/test-time-scaling)이 구분한 두 축 중 "제안 분포 수정"이 이 문제 유형에서 "검증기 없는 병렬 탐색"보다 유리함을 보여준다.'},
 {h:'외삽: 개입 없이도 6배까지 성능이 오른다',
  lead:'"Wait"를 여러 번 붙이면 개입 없는 baseline보다 AIME24가 50%에서 57%로 오른다.',
  d:'budget forcing으로 사고를 2·4·6번 연장시키면 AIME24 정확도가 계속 오르다가 6배 지점에서 정체(포화)된다. 저자들은 이를 "test-time scaling이 무한정 이득을 주지는 않고 상한이 있다"는 근거로 제시한다.'}
],

diagram:{type:'flow', cap:'budget forcing의 개입 지점 — 모델이 사고를 끝내려는 순간에 개입한다.',
 nodes:[
  {t:'질문 입력', s:'s1K 1,000문항 학습'},
  {t:'사고 토큰 생성', s:'reasoning trace'},
  {t:'종료 시도 지점', s:'end-of-thinking', acc:true},
  {t:'개입: 절단 or Wait', s:'토큰 상한 / "Wait" 삽입'},
  {t:'최종 답변', s:'thinking 종료 후 출력'}
 ]},

math:[],

numbers:[
 {k:'학습 데이터', v:'1,000문항', d:'s1K — 59K 후보 중 난이도·다양성·품질 기준으로 큐레이션'},
 {k:'AIME24 (pass@1)', v:'56.7%', d:'s1-32B(Qwen2.5-32B-Instruct + s1K SFT + budget forcing), 온도 0 그리디'},
 {k:'MATH500 (pass@1)', v:'93.0%', d:'s1-32B, 같은 조건'},
 {k:'[GPQA](#/p/gpqa) Diamond (pass@1)', v:'59.6%', d:'s1-32B, 같은 조건'},
 {k:'budget forcing 없을 때', v:'AIME24 50.0%', d:'s1K로만 SFT하고 budget forcing 미적용 시(s1 w/o BF)'},
 {k:'외삽 상한', v:'AIME24 57%', d:'budget forcing으로 사고를 최대 6배 연장했을 때 도달하는 포화점(개입 없는 기준 50%에서 상승)'}
],

impact:'DeepSeek-R1 수준의 추론 성능이 대규모 RL 없이도 **SFT 1,000개 + 추론 시점 개입 하나**로 상당 부분 재현 가능함을 보였다. 이는 추론 능력의 원천이 RL 자체보다 (1) 사전학습에 이미 있는 지식과 (2) 그것을 풀어내는 긴 사고 과정에 있다는 관점에 힘을 실었고, [LIMO](#/p/limo)의 결론과 거의 동시에 같은 방향을 가리켰다. 모델·데이터·코드를 전부 공개해 재현 연구의 기준점이 됐다.',

legacy:[
 '**budget forcing류 개입**이 이후 추론 모델들의 "생각 길이 제어" 기법(길이 페널티, 강제 종료)의 원형이 됨',
 '[LIMO](#/p/limo)와 함께 "추론은 소량의 고품질 예시로 끌어낼 수 있다"는 2025년 초의 동시다발적 발견을 이룸',
 'Gemini Thinking Experimental 같은 폐쇄 모델의 추론 흔적을 증류해 오픈 모델을 만드는 방식이 이후 여러 재현 연구의 표준 절차가 됨',
 'AIME24·MATH500·GPQA Diamond를 pass@1(온도 0) 기준으로 나란히 보고하는 관행이 추론 모델 평가의 사실상 표준이 됨'
],

pitfalls:[
 '**"1,000개면 충분하다"는 이 특정 세팅(32B 모델, 이미 강력한 [Qwen2.5](#/p/qwen25)-32B-Instruct 베이스)에서의 결과다.** 더 작은 베이스 모델이나 사전학습에 관련 지식이 부족한 도메인에 그대로 일반화된다고 논문이 주장하지 않는다.',
 '외삽 성능(57%)은 budget forcing으로 사고를 강제 연장했을 때의 결과이며, 그 이상 늘리면 정체(포화)된다 — "더 생각시키면 무한히 좋아진다"는 뜻이 아니다.',
 '`s1 w/o BF`(50.0%)와 `s1-32B`(56.7%) 사이의 차이가 budget forcing의 순수 기여분처럼 보이지만, 두 수치의 평가 프로토콜(최대 사고 토큰 상한 등)이 다르므로 표의 각주 조건을 함께 봐야 한다.'
],

figures:[
 {f:'fig1-scaling.png',
  cap:'세 벤치마크(MATH500·AIME24·GPQA Diamond)에서 x축은 평균 사고 토큰 수(로그 스케일), y축은 정확도. budget forcing으로 사고 시간을 늘릴수록 점들이 오른쪽 위로 이동한다 — "더 오래 생각할수록 더 잘 맞춘다"는 관계를 직접 보여준다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:"Wait, let's re-read the question carefully.",
  src:'Section 3 (budget forcing 예시), p.4'}
],

links:[
 {t:'arXiv 2501.19393', u:'https://arxiv.org/abs/2501.19393'},
 {t:'GitHub — simplescaling/s1', u:'https://github.com/simplescaling/s1'}
]
});
