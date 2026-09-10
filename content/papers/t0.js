WIKI.paper({
slug:'t0',
venue:'ICLR 2022',
authors:'Sanh, Webson, Raffel, Bach et al. (BigScience)',
arxiv:'2110.08207',

tldr:'사람이 손으로 쓴 자연어 프롬프트 템플릿 수천 개로 [T5](#/p/t5) 인코더-디코더를 다과제 학습시키면, 학습 중 전혀 보지 못한 과제에도 zero-shot으로 일반화된다는 것을 보인 논문. 11B 모델 T0가 16배 큰 [GPT-3](#/p/gpt3) 175B의 zero-shot 성능을 11개 held-out 데이터셋 중 9개에서 앞선다.',

context:'GPT-3는 사람이 짠 프롬프트만으로 낯선 과제를 처리하는 zero/few-shot 능력을 보였고, 그 이유로 "사전학습 코퍼스 안에 이미 여러 과제가 암묵적으로 섞여 있다"는 가설이 제시됐다. 이 논문은 그 가설을 뒤집어 묻는다 — **암묵적 다과제 학습을 기다리는 대신, 명시적으로 다양한 과제를 자연어 프롬프트로 바꿔 학습시키면 어떻게 되는가?** 기존의 다과제 학습 연구(Khashabi et al., MetaICL류)는 held-out **데이터셋**에 대한 일반화만 봤을 뿐, 훈련 중 아예 등장하지 않은 **과제 유형**(예: 요약만 배우고 자연어추론을 푸는 것)에 대한 일반화는 검증하지 않았다는 것이 이 논문이 지적하는 공백이다.',

ideas:[
 {h:'PromptSource / P3: 사람이 손으로 쓴 프롬프트를 대량으로 모은다',
  lead:'177개 데이터셋에 2,073개의 크라우드소싱 프롬프트 템플릿을 모아 Public Pool of Prompts(P3)를 구축한다.',
  d:'같은 데이터셋이라도 "이 리뷰의 감성은?"과 "1~5점 중 몇 점?"처럼 서로 다른 표현의 프롬프트를 여러 개 만들어 데이터셋당 평균 11.7개를 확보한다. 이 다양성이 핵심이다 — 모델이 특정 프롬프트 문구를 암기하는 게 아니라 **과제의 의도**를 배우게 하려는 설계다.'},
 {h:'과제 단위 held-out: 데이터셋이 아니라 과제 유형을 통째로 뺀다',
  lead:'요약·감성분석·QA 등으로 학습하고, 자연어추론(NLI) 같은 과제 유형 자체를 평가에서만 본다.',
  d:'62개 데이터셋·12개 과제를 모아 학습 mixture를 구성하되, NLI·coreference resolution·문장완성·word sense disambiguation 같은 과제 군은 아예 학습에서 빼고 평가에만 쓴다. "새로운 데이터셋"이 아니라 "**본 적 없는 과제 형식**"에 대한 일반화를 재는 것이 이전 다과제 연구와 다른 지점이다.'},
 {h:'zero-shot 성능이 16배 큰 GPT-3를 앞선다',
  lead:'11B 파라미터 T0가 175B GPT-3의 zero-shot 성능을 11개 held-out 데이터셋 중 9개에서 맞먹거나 앞선다.',
  d:'특히 NLI에서는 T0도 GPT-3도 그 과제로 학습한 적이 없는데 T0가 모든 NLI 데이터셋에서 GPT-3를 이긴다. T0의 베이스라인인 T5+LM(같은 모델, 다과제 프롬프트 학습만 없앤 버전)은 이 우위를 보이지 않아, **다과제 프롬프트 학습 자체**가 원인임을 대조군으로 확인한다.'},
 {h:'프롬프트 개수·데이터셋 개수를 늘릴수록 견고해진다',
  lead:'학습에 쓰는 프롬프트 수를 늘리면 held-out 성능의 중앙값이 오르고 편차(분산)가 줄어든다.',
  d:'데이터셋당 프롬프트 1개만 쓴 T0와, 여러 개를 다 쓴 T0를 비교하면 후자가 더 높고 더 안정적인 zero-shot 성능을 낸다. 학습 데이터셋 수를 $d=39\\to49\\to55$(T0→T0+→T0++)로 늘려도 held-out 5개 데이터셋의 중앙값 성능이 오른다. 즉 프롬프트의 **다양성**과 과제의 **폭**이 곧 일반화 능력으로 전환된다.'},
 {h:'[FLAN](#/p/flan)과는 같은 시기 독립적으로 나온 결과',
  lead:'FLAN과 연구 질문은 같지만 held-out 방식·모델 구조·규모가 다른, 동시 발견이다.',
  d:'FLAN(Wei et al., 2021)은 이 논문과 동시에 같은 질문(다과제 프롬프트 학습이 zero-shot을 만드는가)을 다뤘지만, **decoder-only 137B** 모델을 과제마다 따로 학습해 단일 held-out 과제만 평가했다. T0는 **encoder-decoder 11B** 모델 하나로 여러 held-out 과제를 동시에 평가한다. 두 논문 중 하나가 다른 하나의 후속이 아니라, 서로 다른 설계로 같은 결론(명시적 다과제 프롬프트 학습이 zero-shot 일반화를 만든다)에 도달한 독립 연구다.'}
],

diagram:{type:'flow', cap:'T0의 학습·평가 파이프라인 — 다과제 프롬프트 학습 후 본 적 없는 과제로 평가.',
 nodes:[
  {t:'62개 데이터셋', s:'12개 과제, P3 프롬프트'},
  {t:'프롬프트 변환', s:'과제→자연어 텍스트'},
  {t:'T5(11B) 다과제 학습', acc:true, s:'encoder-decoder'},
  {t:'held-out 평가', s:'NLI 등 미학습 과제'}
 ]},

math:[
 {expr:'Pr_theta(Y | prompt(X))  — 모든 과제를 동일한 text-to-text 형식으로 통일',
  tex:'\\Pr_\\theta\\bigl(Y \\mid \\text{prompt}(X)\\bigr)',
  d:'분류든 QA든 요약이든 모두 "프롬프트로 감싼 입력 → 텍스트 출력"의 동일한 조건부 생성으로 통일한다. [T5](#/p/t5)의 text-to-text 포맷을 그대로 물려받았고, 초기화는 [Prompt Tuning](#/p/prompt-tuning) 논문이 쓴 LM-adapted T5(T5+LM) 체크포인트에서 시작한다.'}
],

numbers:[
 {k:'P3 프롬프트 컬렉션', v:'2,073개 · 177개 데이터셋', d:'데이터셋당 평균 11.7개 템플릿'},
 {k:'학습 mixture', v:'62개 데이터셋 · 12개 과제', d:'T0/T0+/T0++로 갈수록 데이터셋 39→49→55개'},
 {k:'held-out vs GPT-3', v:'9/11 데이터셋에서 동급 이상', d:'GPT-3 175B 대비 T0는 11B, 약 16배 작음'},
 {k:'BIG-bench 결과', v:'14개 과제 중 13개에서 베이스라인 능가', d:'최대 6배 큰 decoder-only 베이스라인 대비'},
 {k:'모델 크기', v:'11B', d:'T5+LM(Prompt Tuning 논문의 LM-adapted 체크포인트)에서 초기화'}
],

impact:'이 논문은 "zero-shot 일반화는 모델을 무작정 키워야만 나온다"는 통념에 **명시적 다과제 프롬프트 학습**이라는 대안 경로를 세웠다. 11B 모델이 175B 모델을 이기는 결과는, 규모보다 **학습 신호의 형식(다양한 자연어 프롬프트)**이 일반화에 직접 기여할 수 있음을 보여준다. PromptSource/P3는 이후 프롬프트 연구의 공용 인프라가 됐고, "instruction-following"이라는 개념이 명시적 학습 목표로 자리잡는 데 [FLAN](#/p/flan)과 나란히 기초를 놓았다.',

legacy:[
 '**[FLAN](#/p/flan)과의 병행 계보** — 두 논문이 같은 시기 독립적으로 다과제 프롬프트 학습→zero-shot을 입증했고, 이후 instruction tuning 연구가 이 둘을 표준 참조로 삼음',
 '**[Flan-T5](#/p/flan-t5) 계열 통합** — T5 계열에 명시적 다과제 지시학습을 얹는 레시피가 이후 [BLOOM](#/p/bloom) 기반 다국어·오픈 모델로 확산',
 '**PromptSource 인프라화** — 프롬프트를 코드가 아니라 데이터로 관리하는 관행이 이후 instruction 데이터셋 구축(Self-Instruct 등)의 전신이 됨',
 '**RLHF 이전의 "지시 따르기" 기반** — [InstructGPT](#/p/instructgpt)류가 등장하기 전, 순수 지도학습만으로 지시를 따르는 모델을 만들 수 있다는 증거를 제공'
],

pitfalls:[
 '**"프롬프트만 있으면 어떤 과제든 일반화된다"는 아니다.** Winogrande·HellaSwag처럼 문장 완성형 과제에서는 오히려 지시문을 넣는 것이 방해가 됐고, 지시문을 빼야 성능이 회복됐다 — 모든 과제가 자연어 지시로 이득을 보는 것은 아니다.',
 '**FLAN과의 우열 비교는 과제마다 엇갈린다.** T0가 CB·RTE에서는 낫고 Winogrande·ANLI에서는 FLAN이 낫다. "T0가 FLAN보다 우월하다"는 식의 단순 비교는 원 논문 결과와 다르다.',
 '**모델 구조·사전학습 목적의 차이가 결과 해석을 복잡하게 만든다.** T0는 encoder-decoder + span corruption 사전학습에서 출발했고 FLAN은 decoder-only인데, 이 차이가 "다과제 학습이 항상 도움되는가"라는 질문의 답을 규모뿐 아니라 구조에도 의존하게 만든다.'
],

figures:[
 {f:'fig1-multitask-zeroshot.png',
  cap:'왼쪽 네 개 상자가 학습 시 사용한 과제(요약·감성분석·QA 등)를 자연어 프롬프트로 감싼 예시, 오른쪽이 T0가 생성한 응답. 점선 아래 "Natural Language Inference" 상자가 핵심 — 학습에는 전혀 없던 과제 형식을 평가 시점에 처음 준 것이고, 그럼에도 "Yes"라는 올바른 응답을 생성한다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig4-results-vs-gpt3.png',
  cap:'각 열이 held-out 데이터셋(NLI 5개, coreference 2개, 문장완성 3개, word sense 1개), 점 하나가 서로 다른 프롬프트로 평가한 결과 하나. 초록(T0 11B)이 진회색(GPT-3 175B)과 나란하거나 위에 있는 열이 대부분이고, 파랑(T5+LM, 다과제 학습 없는 대조군)은 대체로 낮게 깔려 있어 다과제 프롬프트 학습의 효과가 대조군 차이로 드러난다.',
  src:'원문 Figure 4, p.7'}
],

quotes:[
 {t:'Can zero-shot generalization instead be directly induced by explicit multitask learning?',
  src:'Abstract, p.1'},
 {t:'we find that T0 matches or exceeds the performance of all GPT-3 models on 9 out of 11 held-out datasets... despite being about 16× smaller.',
  src:'Section 1 / Abstract, p.1-2'}
],

links:[
 {t:'arXiv 2110.08207 — Multitask Prompted Training Enables Zero-Shot Task Generalization', u:'https://arxiv.org/abs/2110.08207'},
 {t:'GitHub — bigscience-workshop/promptsource', u:'https://github.com/bigscience-workshop/promptsource'},
 {t:'GitHub — bigscience-workshop/t-zero', u:'https://github.com/bigscience-workshop/t-zero'}
]
});
