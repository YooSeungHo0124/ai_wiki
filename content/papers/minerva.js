WIKI.paper({
slug:'minerva',
venue:'arXiv 2022 (NeurIPS 2022)',
authors:'Lewkowycz et al. (Google Research)',
arxiv:'2206.14858',

tldr:'[PaLM](#/p/palm)을 arXiv 논문과 수학 웹페이지 388억 토큰으로 계속 사전학습시켜, 외부 계산기 없이 순수 언어모델만으로 대학 수준 수학·물리 문제를 단계별로 풀게 만든 논문. MATH·GSM8k에서 당시 SOTA를 큰 폭으로 갱신했다.',

context:'2022년 초까지 언어모델은 자연어 이해에서는 강했지만 수학 문제 앞에서 무너졌다. [MATH 데이터셋](#/p/math-dataset) 논문 자체가 GPT-3류 모델의 정확도가 한 자릿수%에 그친다고 보고했을 정도다. 원인은 두 가지였다. 학습 데이터가 일반 웹 텍스트라 수식·기호가 깨진 채 들어가고, 추론 방식이 답을 바로 내뱉는 방식이라 중간 계산을 담을 공간이 없었다. [Chain-of-Thought](#/p/cot)가 중간 추론을 유도하는 법을 보였지만, 그 추론이 실제로 옳은 계산을 담으려면 모델 자체가 수식을 다루는 법을 알아야 했다. Minerva는 이 질문을 정면으로 다룬다 — **모델을 수학 전용으로 다시 학습시키면, 계산기 없이도 단계별 풀이가 가능한가?**',

ideas:[
 {h:'arXiv + 수학 웹페이지로 계속 사전학습',
  lead:'LaTeX 수식이 깨지지 않게 보존한 388억 토큰으로 PaLM을 이어서 학습시킨다.',
  d:'일반 웹 크롤은 HTML 렌더링 과정에서 수식 기호가 사라지거나 깨진다. Minerva는 arXiv 소스 파일과, MathJax 수식을 보존하도록 따로 처리한 수학 웹페이지를 모아 학습 코퍼스를 만들었다. `\\int`, `\\sum` 같은 LaTeX 명령이 그대로 토큰 시퀀스에 남아, 모델이 자연어와 수식을 한 시퀀스 안에서 같이 다루는 법을 배운다.'},
 {h:'외부 도구 없이 chain-of-thought로 계산',
  lead:'계산기·기호처리기 없이 few-shot CoT 프롬프트만으로 중간 계산을 서술한다.',
  d:'Codex 계열 접근이 코드를 생성해 실행기에 넘기는 것과 달리, Minerva는 순수하게 다음 토큰을 예측해 풀이를 이어간다. 4-shot 프롬프트로 "질문 → 단계별 풀이 → 답" 형식을 보여 주면, 모델이 자체적으로 방정식을 정리하고 대입하는 과정을 텍스트로 생성한다.'},
 {h:'majority voting: k개 샘플 중 가장 흔한 답을 채택',
  lead:'temperature>0으로 여러 번 샘플링해 최종 답이 가장 많이 나온 것을 고른다.',
  d:'틀리는 방법은 다양하지만 맞는 방법은 적다는 직관을 이용한다. [Self-Consistency](#/p/self-consistency)와 같은 방식이며, `maj1@k`로 표기한다. `pass@k`(k개 중 하나만 맞아도 성공)보다 majority voting이 훨씬 적은 k에서 성능이 포화된다 — MATH는 k=64, GSM8k는 k=16에서 이미 큰 k 성능의 97%에 도달한다.'},
 {h:'스케일 3단(8B·62B·540B)로 규모의 효과를 분리',
  lead:'같은 방법을 8B·62B·540B에 반복해 성능이 데이터 품질과 모델 크기 중 무엇에서 오는지 본다.',
  d:'세 크기 모두 같은 수학 코퍼스로 계속학습시켜 MATH·GSM8k·MMLU-STEM에서 PaLM 대비 향상 폭을 비교했다. 540B는 540.35B 파라미터 중 26B 토큰만 파인튜닝해 상대적으로 덜 학습된 상태인데도 가장 큰 향상을 보여, 모델이 클수록 같은 데이터에서 더 많은 것을 뽑아낸다는 것을 시사한다.'},
 {h:'false positive와 암기(memorization)를 직접 감사',
  lead:'정답은 맞지만 풀이가 틀린 사례와, 정답을 외워서 맞힌 사례를 저자가 직접 세었다.',
  d:'최종 답만 자동 채점하면 우연히 맞는 경우를 놓친다. 저자들은 100문제를 손으로 검사해 오답 추론에서 정답이 나온 비율(false positive rate)을 난이도별로 측정했고, 학습 코퍼스에 문제·정답이 그대로 들어있는지, 문제를 변형해도 성능이 유지되는지도 별도로 조사했다.'}
],

diagram:{type:'flow', cap:'PaLM에서 Minerva로: 수학 코퍼스로 이어 학습한 뒤 few-shot CoT + majority voting으로 추론한다.',
 nodes:[
  {t:'PaLM 8/62/540B', s:'일반 웹 사전학습'},
  {t:'수학 계속학습', s:'38.5B 토큰 · arXiv+웹', acc:true},
  {t:'Minerva', s:'수식 보존 토큰화'},
  {t:'4-shot CoT 추론', s:'중간 계산 서술'},
  {t:'다수결 투표', s:'k개 샘플 중 최빈 답'}
 ]},

math:[
 {expr:'maj1@k: k개 샘플에서 최종 답이 가장 흔한 것을 채택',
  tex:'\\hat{y} = \\operatorname*{arg\\,max}_{y} \\sum_{i=1}^{k} \\mathbb{1}[y_i = y]',
  d:'k개의 독립 샘플 $y_1,\\dots,y_k$ 중 가장 많이 등장한 답 $\\hat y$ 를 최종 답으로 쓴다. [Self-Consistency](#/p/self-consistency)에서 가져온 방법이며, `pass@k`(하나라도 맞으면 성공)와 달리 실제 배포 가능한 단일 답을 만든다.'},
 {expr:'false positive rate = (정답이지만 풀이가 틀린 샘플 수) / (최종 답이 정답인 샘플 수)',
  tex:'\\text{FPR} = \\frac{\\#\\{\\text{correct answer, wrong reasoning}\\}}{\\#\\{\\text{correct final answer}\\}}',
  d:'자동 채점은 최종 답만 보므로, 우연히 맞은 추론을 걸러내려면 이 비율을 사람이 직접 측정해야 한다.'}
],

numbers:[
 {k:'MATH · Minerva 540B maj1@k', v:'50.3%', d:'PaLM 540B 8.8% 대비, 당시 published SOTA 6.9%를 크게 앞섬'},
 {k:'GSM8k · Minerva 540B maj1@k', v:'78.5%', d:'greedy 기준 58.8%에서 majority voting으로 추가 상승'},
 {k:'학습 코퍼스', v:'38.5B 토큰', d:'arXiv + 수식 보존 수학 웹페이지'},
 {k:'MATH false positive rate', v:'평균 8%', d:'난이도 5(최고난도)에서는 30%까지 상승'},
 {k:'62B 모델 오답 유형', v:'추론 오류 82건 · 계산 오류 70건', d:'201개 표본 중, 문제 오해·사실 오류·환각은 그보다 적음'},
 {k:'10자리 덧셈 정확도', v:'80%대', d:'540B 기준. 18자리는 20%대로 급락 — 순수 자릿수 연산조차 한계가 뚜렷'}
],

impact:'Minerva는 "언어모델이 수학을 못 하는 건 아키텍처의 한계가 아니라 데이터의 한계였다"는 것을 보였다. 계산기나 기호처리기 같은 외부 도구 없이, 수식을 보존한 코퍼스로 이어 학습하고 CoT + majority voting만으로 대학 수준 문제의 상당수를 풀어낸 것이다. 동시에 false positive·암기 분석을 직접 공개해, 벤치마크 숫자 하나만으로 "이해했다"고 말할 수 없다는 경각심도 남겼다.',

legacy:[
 '**도구 없는 순수 추론의 상한선**을 보여줘, 이후 [PAL](#/p/pal)·계산기 연동 접근과의 비교 기준점이 됨',
 '**majority voting/[Self-Consistency](#/p/self-consistency)를 벤치마크 표준 관행**으로 정착시킴 — 이후 추론 논문 대부분이 maj@k를 함께 보고',
 '**false positive 분석 관행**이 이후 추론 평가 논문들이 "정답률"만으로 능력을 주장하지 않도록 하는 선례가 됨',
 '수식 보존 코퍼스 구축 방식이 이후 코드/수학 특화 continued pretraining(Llemma, DeepSeekMath 등) 흐름의 원형이 됨'
],

pitfalls:[
 '**정답률 50.3%가 곧 "수학을 이해했다"는 뜻이 아니다.** 저자들 스스로 MATH 난이도 5 문제에서 false positive rate가 30%까지 오른다고 밝혔다 — 어려운 문제일수록 우연히 답만 맞을 확률이 높다.',
 '**majority voting은 추론 비용을 k배로 늘린다.** MATH는 k=256(540B는 64)까지 샘플링했으므로, 단일 forward pass 대비 실사용 배포 비용이 크게 늘어난다.',
 '**암기 분석은 "완전히 결백하다"가 아니라 "강한 형태의 암기 증거는 적었다"는 정도다.** 저자들도 삼각함수 값·제곱근 같은 중간 사실의 암기는 풀이의 핵심 요소라고 인정한다.'
],

figures:[
 {f:'fig1-example.png',
  cap:'위 파란 상자가 문제와 정답, 아래 회색 상자가 Minerva 62B의 실제 출력. 모델이 정답과 다른 경로(기울기-절편 대입 대신 점-기울기 공식)로도 같은 답 -10에 도달하는 것을 보여준다 — 풀이 형식을 외운 게 아니라는 근거로 제시된 예시.',
  src:'원문 Figure 1, p.2'},
 {f:'fig4-subtopics.png',
  cap:'왼쪽이 MATH, 오른쪽이 MMLU-STEM 세부 주제별 정확도. 막대 색이 짙을수록 8B, 밝을수록 540B이고 노란 막대가 maj1@k. 모든 주제에서 모델 크기와 majority voting이 각각 정확도를 밀어올리는 것이 한눈에 보이지만, IntermedAlg·NumTheory처럼 여전히 낮은 과목도 뚜렷하다.',
  src:'원문 Figure 4, p.7'}
],

quotes:[
 {t:'We introduce Minerva, a large language model pretrained on general natural language data and further trained on technical content.',
  src:'Abstract, p.1'},
 {t:'This leaves open the possibility of false positives: samples which have the correct final answer, but for which the reasoning is incomplete or incorrect.',
  src:'Section 4.2, p.10'}
],

links:[
 {t:'arXiv 2206.14858 — Solving Quantitative Reasoning Problems with Language Models', u:'https://arxiv.org/abs/2206.14858'},
 {t:'Google AI Blog — Minerva: Solving Quantitative Reasoning Problems', u:'https://ai.googleblog.com/2022/06/minerva-solving-quantitative-reasoning.html'}
]
});
