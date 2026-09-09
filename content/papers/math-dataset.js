WIKI.paper({
slug:'math-dataset',
venue:'NeurIPS 2021 (Datasets and Benchmarks Track)',
authors:'Hendrycks, Burns et al. (UC Berkeley · U. Chicago)',
arxiv:'2103.03874',

tldr:'중·고교 경시대회 수준 수학 문제 12,500개를 **정답뿐 아니라 단계별 풀이와 함께** 모은 벤치마크(MATH). 당시 최대 규모 Transformer로도 정답률이 3~7%에 그쳐, 스케일만 키우는 접근이 수학 추론에는 통하지 않는다는 것을 실측으로 보였다.',

context:'2020~2021년 언어모델은 [GPT-3](#/p/gpt3)의 성공 이후 "모델을 키우면 대부분의 텍스트 과제가 풀린다"는 낙관이 지배적이었다. SuperGLUE 같은 종합 벤치마크가 빠르게 정복됐고, 코드 생성·기호 적분처럼 어려워 보이던 과제도 스케일로 뚫리는 사례가 보고됐다. 그런데 수학 문제 데이터셋은 대부분 **형식 정리 증명**(Metamath, HOList)이거나 사칙연산·정렬 같은 **plug-and-chug**(DeepMind Mathematics) 수준이어서, "여러 개념을 조합하는 진짜 문제 해결 능력"을 재는 벤치마크가 없었다. 저자들은 사람도 노력해야 푸는 경시대회 문제로 이 공백을 메우려 했다.',

ideas:[
 {h:'경시대회 문제 12,500개 + 단계별 풀이',
  lead:'AMC·AIME 등 경시대회 문제를 LaTeX 자연어 풀이와 함께 수집해 정답만이 아니라 과정을 학습·평가 대상으로 삼는다.',
  d:'훈련 7,500 · 테스트 5,000문제로 구성되며, 각 문제에 최종 답뿐 아니라 사람이 쓴 **단계별 풀이**가 딸려 있다. 표준 K-12 공식을 그대로 적용해서는 못 풀고, 여러 풀이 기법(heuristics)을 조합해야 하는 문제가 대부분이다. 도형은 래스터 이미지 대신 Asymptote 언어로 텍스트화해 순수 언어모델도 기하 문제를 다룰 수 있게 했다.'},
 {h:'\\boxed{} 하나로 자동 채점한다',
  lead:'최종 답을 \\boxed{}로 감싸고 분수·다항식 표기를 정규화해 BLEU 없이 정확 일치로 채점한다.',
  d:'분수는 항상 `\\frac{x}{y}` 형태로, 다항식은 차수 내림차순으로 쓰는 등 표기 규칙을 강제해 답이 문자열로 유일해지도록 만들었다. 이 덕분에 모델이 자유 형식으로 생성한 답도 `\\boxed{}` 안쪽만 파싱해 정답과 정확히 비교할 수 있다 — 서술형 수학 문제를 exact-match로 채점 가능하게 만든 설계다.'},
 {h:'AMPS: 사전학습용 2,300만 문제 보조 코퍼스',
  lead:'Khan Academy 10만 문제 + Mathematica로 생성한 500만 문제로 23GB 규모의 수학 사전학습 데이터를 만든다.',
  d:'수학은 일반 텍스트 코퍼스에서 차지하는 비중이 작아, 기초 개념부터 따로 가르칠 사전학습 데이터가 필요하다고 보고 AMPS(Auxiliary Mathematics Problems and Solutions)를 만들었다. Khan Academy 문제·풀이 10만여 개와, 직접 작성한 100개의 Mathematica 스크립트로 생성한 약 500만 문제(37개 스크립트는 단계별 풀이 포함)로 이뤄지며 총 23GB — [BERT](#/p/bert) 학습에 쓰인 16GB 텍스트보다 크다.'},
 {h:'스케일링이 안 통한다는 것을 실측으로 보인다',
  lead:'모델 크기를 키워도 정확도가 로그선형으로만 늘어, 40% 도달에 약 $10^{35}$ 파라미터가 필요하다는 외삽을 제시한다.',
  d:'GPT-2(0.1B~1.5B)와 GPT-3(13B, 175B)로 실험한 결과 정확도는 3.0~6.9% 구간에 머물렀고, AMPS로 사전학습한 0.1B 모델이 사전학습 없는 130배 큰 모델과 비슷한 성능을 냈다. 즉 **데이터 품질(AMPS)은 도움이 되지만 순수 규모 확장은 거의 안 통한다**는 것이 이 논문의 핵심 실측 결과다.'}
],

diagram:{type:'compare', cap:'기존 수학 데이터셋 계열과 MATH의 차이.',
 left:{t:'기존: 증명·계산 과제', items:['Metamath 등 형식 정리 증명','DeepMind Math 사칙연산·정렬','최종 답만 채점']},
 right:{t:'MATH: 경시대회 문제', items:['자연어+LaTeX 서술형 풀이 포함','\\boxed{}로 exact-match 채점','7과목 × 난이도 1~5 세분화']}},

numbers:[
 {k:'문제 수', v:'12,500개', d:'훈련 7,500 · 테스트 5,000, AMC·AIME 등 경시대회 출처'},
 {k:'대형 언어모델 정확도', v:'3.0~6.9%', d:'GPT-2(0.1~1.5B)·GPT-3(13B·175B) 전 모델 과목 평균 범위'},
 {k:'AMPS 사전학습 효과', v:'0.1B 모델 ≈ 파인튜닝 13B 모델', d:'23GB AMPS로 사전학습하면 130배 큰 모델과 비슷한 성능'},
 {k:'사람 성능', v:'40%(수학 싫어하는 CS 박사생) ~ 90%(IMO 금메달 3회)', d:'무작위 20문제·1시간 제한·손 계산 조건'},
 {k:'가장 쉬운 난이도(레벨1) 정확도', v:'최대 15%', d:'전체 평균(3~7%)보다 훨씬 높아 모델이 기초 지식은 일부 갖췄음을 시사'},
 {k:'40% 도달 추정 파라미터 수', v:'약 $10^{35}$', d:'로그선형 스케일링 추세를 그대로 외삽한 값 — 현실적으로 불가능한 규모'}
],

impact:'MATH는 "스케일이 곧 정답"이라는 당시 통설에 실측 반례를 제시한 첫 대규모 벤치마크였다. 동시에 정답이 아니라 **풀이 과정 자체를 학습·평가 대상**으로 삼음으로써, 이후 chain-of-thought 계열 연구가 "왜 단계별로 생각하면 더 잘 푸는가"를 검증할 표준 무대를 제공했다. 흥미롭게도 이 논문은 모델이 스스로 생성한 풀이를 참고하면 오히려 정확도가 떨어진다고 보고했는데, 이는 이후 [Chain-of-Thought](#/p/cot) 프롬프팅이 이 문제를 어떻게 해결하는지 비교할 기준점이 됐다.',

legacy:[
 '**[GSM8K](#/p/gsm8k)와 상호보완적 표준 쌍** — GSM8K가 초등 수준 서술형 문제로 검증기(verifier) 아이디어를 냈다면, MATH는 경시대회 난이도로 그 위 단계를 맡아 오늘날까지 LLM 수학 능력 리더보드의 표준 두 축을 이룸',
 '**[Chain-of-Thought](#/p/cot) 검증 무대** — "정답만 내지 말고 풀이 과정을 생성하라"는 프롬프팅이 실제로 정확도를 올리는지 보이는 대표 벤치마크로 이후 논문들이 채택',
 '**"스케일만으로는 안 되는 영역이 있다"는 초기 반증 사례** — 이후 도구 사용(계산기 호출), RL 기반 검증(과정보상모델), 코드 실행 연계 등 알고리즘적 접근이 수학 추론 연구의 주류가 되는 계기',
 '**서술형 답 자동 채점 레시피의 표준화** — `\\boxed{}` + 정규화 규칙으로 exact-match를 가능하게 한 채점 방식이 이후 수학 벤치마크 다수에 재사용됨'
],

pitfalls:[
 '**"3~7%라는 낮은 숫자"를 오늘날 LLM과 그대로 비교하면 안 된다.** 이후 [GSM8K](#/p/gsm8k) 스타일 검증기, [CoT](#/p/cot) 프롬프팅, 코드 실행 연동 등 알고리즘 개선이 누적되며 현대 LLM은 MATH에서 수십~90%대까지 올라갔다 — 이 논문의 결론은 "당시 순수 스케일링으로는 안 된다"는 것이지 "영원히 안 된다"가 아니다.',
 '**단계별 풀이를 학습에 쓰는 것과 추론(생성) 시점에 쓰는 것은 다른 효과를 낸다.** 논문은 훈련 시 풀이 학습은 정확도를 올리지만, 모델이 스스로 만든 풀이를 보고 참고하면 오히려 떨어진다고 보고했다 — CoT 이전 세대 모델의 한계였다.',
 '**AMC/AIME 문제는 공개 웹(AoPS 포럼 등)에 존재해 이후 LLM 사전학습 데이터 오염 논란의 소지가 있다.** 최신 모델의 높은 MATH 점수를 볼 때 이 가능성을 감안해야 한다.'
],

figures:[
 {f:'fig1-examples.png',
  cap:'MATH 문제 예시 두 개. 위는 조합론(경우의 수) 문제, 아래는 복소수 방정식 문제로, 둘 다 자연어+LaTeX 풀이 뒤에 최종 답이 박스로 감싸여 있다 — 이 박스 부분만 파싱해 자동 채점한다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-difficulty-bar.png',
  cap:'기존 수학 관련 벤치마크(정리 증명·기호 적분 등)는 모두 최신 모델이 70~99% 정확도를 내는 반면, 맨 오른쪽 MATH만 10% 미만이다. 막대 높이 차이 자체가 "이 데이터셋이 훨씬 어렵다"는 논문의 핵심 주장을 시각적으로 보여준다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'While scaling Transformers is automatically solving most other text-based tasks, scaling is not currently solving MATH.',
  src:'Abstract, p.1'},
 {t:'Interestingly, we found that having models generate step-by-step solutions before producing an answer actually decreased accuracy relative to immediately outputting a final answer without generating solutions, indicating the solutions are currently not useful for models at test time.',
  src:'Introduction, p.2'}
],

links:[
 {t:'arXiv 2103.03874 — Measuring Mathematical Problem Solving With the MATH Dataset', u:'https://arxiv.org/abs/2103.03874'},
 {t:'MATH / AMPS 데이터셋 (GitHub)', u:'https://github.com/hendrycks/math'}
]
});
