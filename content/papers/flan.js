WIKI.paper({
slug:'flan',
venue:'ICLR 2022',
authors:'Wei, Bosma, Zhao et al. (Google Research)',
arxiv:'2109.01652',

tldr:'기존 NLP 데이터셋 수십 개를 **자연어 지시문 형태로 다시 쓴 뒤 한꺼번에 미세조정**하면, 학습에 쓰지 않은 태스크에서도 zero-shot 성능이 크게 오른다는 것을 보인 논문. 137B FLAN이 25개 평가 데이터셋 중 **20개에서 175B [GPT-3](#/p/gpt3)의 zero-shot을 앞섰다**.',

context:'[GPT-3](#/p/gpt3)가 보여준 few-shot 능력에는 불편한 전제가 있었다 — 잘 쓰려면 예시를 몇 개 넣어야 하고, 예시 선택과 순서에 따라 성능이 출렁인다. 예시 없이 지시만 던지는 **zero-shot은 눈에 띄게 약했다**. 원인은 목적함수의 어긋남이다. 사전학습 모델은 "다음 토큰"만 배웠을 뿐 "지시문은 수행하라는 뜻"이라는 규약을 배운 적이 없다. 한편 멀티태스크 학습 자체는 [T5](#/p/t5)가 이미 태스크 접두사(`translate English to German:`)로 여러 태스크를 한 모델에 담는 방식을 썼지만, 그것은 학습 때 본 태스크를 구분하는 **태그**였지 처음 보는 태스크로 일반화하는 장치가 아니었다. 이 논문의 질문은 그 사이를 잇는다 — 태그 대신 **사람이 읽는 자연어 지시문**으로 통일해 여러 태스크를 학습하면, 지시문을 이해하는 능력 자체가 일반화되지 않을까?',

ideas:[
 {h:'모든 태스크를 하나의 지시문 형식으로 캐스팅한다',
  lead:'62개 데이터셋을 자연어 지시문 템플릿으로 다시 써서 단일 인터페이스로 통일한다.',
  d:'62개 공개 데이터셋을 12개 태스크 클러스터(자연어 추론, 상식추론, 감성분석, 요약, 번역, QA 등)로 묶고, 데이터셋마다 **10개의 서로 다른 지시문 템플릿**을 손으로 작성했다. 분류 데이터셋이 "다음 문장의 감성은?"이 되고, 번역이 "이 문장을 독일어로 옮겨라"가 된다. 입출력 스키마가 아니라 지시문이 태스크 인터페이스가 된다.'},
 {h:'평가는 클러스터 단위로 격리한다 — 이것이 이 논문의 방법론적 핵심',
  lead:'평가할 태스크군 전체를 학습에서 빼서 진짜 미지 태스크 전이만 측정한다.',
  d:'"처음 보는 태스크"의 정의가 느슨하면 결과가 무의미해진다. 논문은 NLI 클러스터를 평가하려면 **NLI 클러스터 전체를 학습에서 제외**하고 나머지 11개로만 미세조정한다. 데이터셋 하나가 아니라 태스크군 전체를 빼기 때문에, 성능 향상이 유사 태스크 암기가 아니라 **지시문 따르기의 전이**임을 주장할 수 있다.'},
 {h:'템플릿을 일부러 뒤틀어 다양성을 준다',
  lead:'같은 데이터로 태스크를 뒤집은 지시문도 만들어 형식이 아닌 의미에 반응시킨다.',
  d:'10개 템플릿 중 일부는 태스크를 뒤집는다 — 감성 분류 데이터로 "긍정 리뷰를 하나 생성하라"를 만드는 식이다. 같은 데이터에서 다른 지시를 뽑아내 모델이 **표면 형식이 아니라 지시의 의미**에 반응하도록 강제한다.'},
 {h:'지시문이 실제로 일을 하고 있다는 증명',
  lead:'지시문을 빼거나 태그로 바꾸면 성능이 떨어져 이득의 원천이 지시문임을 확인한다.',
  d:'어블레이션에서 지시문을 빼고 입력만 주거나 데이터셋 이름만 태그로 준 조건과 비교했다. 두 조건 모두 zero-shot 성능이 크게 떨어진다. 즉 이득의 원천은 "여러 데이터를 섞어 학습했다"가 아니라 **자연어 지시문이라는 형식 자체**에 있다.'},
 {h:'규모가 임계값을 넘어야 작동한다',
  lead:'8B 이하 모델에서는 지시 미세조정이 오히려 미지 태스크 성능을 떨어뜨린다.',
  d:'가장 반직관적인 결과다. **8B 이하 모델에서는 지시 미세조정이 처음 보는 태스크 성능을 오히려 떨어뜨렸다.** 논문의 해석은 작은 모델은 약 40개 학습 태스크를 익히는 데 용량을 다 쓰고, 큰 모델만 남는 용량으로 일반화를 배운다는 것이다. [창발](#/p/emergent) 논의와 직접 맞닿는 지점이다.'}
],

diagram:{type:'compare', cap:'같은 데이터를 태스크 태그로 쓸 것인가, 자연어 지시로 쓸 것인가. 이 선택이 미지 태스크 일반화를 갈랐다. FLAN은 25개 중 20개에서 175B GPT-3 zero-shot을 넘었다.',
 left:{t:'기존: few-shot 프롬프트',
  items:['지시 자체는 학습된 적 없음','예시 몇 개를 넣어야 성능이 나옴','예시 선택·순서에 성능이 출렁임','T5식 태스크 접두사는 학습한 태스크 전용 태그']},
 right:{t:'FLAN: 지시 통일 미세조정',
  items:['62개 데이터셋 · 12개 클러스터','데이터셋당 지시문 템플릿 10개','평가 클러스터는 학습에서 통째로 제외','GPT-3 zero-shot을 25개 중 20개서 초과']}},

numbers:[
 {k:'기반 모델', v:'LaMDA-PT 137B', d:'decoder-only 사전학습 모델. FLAN은 여기에 지시 미세조정만 얹은 것'},
 {k:'학습 데이터셋 / 클러스터', v:'62개 / 12개', d:'평가 대상 클러스터는 학습에서 제외'},
 {k:'데이터셋당 템플릿', v:'10개', d:'그중 최대 3개는 태스크를 뒤집은 변형'},
 {k:'zero-shot 우위', v:'25개 중 20개', d:'175B GPT-3 zero-shot 대비'},
 {k:'few-shot GPT-3도 초과', v:'6개 데이터셋', d:'ANLI · RTE · BoolQ · AI2-ARC · OpenbookQA · StoryCloze에서 zero-shot FLAN이 few-shot GPT-3를 넘음'},
 {k:'규모 임계', v:'8B 이하에서 역효과', d:'작은 모델은 지시 미세조정이 미지 태스크 성능을 **떨어뜨렸다**'}
],

figures:[
 {f:'fig1-instruction-tuning-overview.png',
  cap:'왼쪽 상자가 지시 미세조정 단계 — Commonsense Reasoning·Translation 등 여러 태스크를 "지시문 + 옵션 + Target" 형식으로 통일해 한 모델에 한꺼번에 학습시킨다. 오른쪽은 그렇게 학습된 FLAN이 학습 때 전혀 보지 못한 태스크 유형(자연어 추론)에 지시문만으로 답하는 장면 — 화살표가 "본 적 없는 태스크로의 일반화"를 나타낸다.',
  src:'원문 Figure 1 (위), p.1'},
 {f:'fig1-zeroshot-results.png',
  cap:'세 개 미지(unseen) 태스크 그룹(자연어 추론·독해·closed-book QA) 각각에서 노란(GPT-3 zero-shot) < 빨강(GPT-3 few-shot) < 파랑(FLAN zero-shot) 순으로 막대가 높아진다. 특히 파란 막대가 빨간 막대(few-shot)보다도 높다는 것이 핵심 — FLAN은 예시 없이도 few-shot GPT-3를 넘는다.',
  src:'원문 Figure 1 (아래), p.1'}
],

quotes:[
 {t:'We show that instruction tuning—finetuning language models on a collection of datasets described via instructions—substantially improves zero-shot performance on unseen tasks.',
  src:'Abstract, p.1'},
 {t:'FLAN\'s zero-shot also outperforms 175B-parameter GPT-3\'s zero-shot on 20 of 25 datasets that we evaluate, and even outperforms GPT-3\'s few-shot by a large margin on ANLI, RTE, BoolQ, AI2-ARC, OpenbookQA, and StoryCloze.',
  src:'Section 1, p.2'}
],

impact:'지시 미세조정(instruction tuning)이 하나의 독립된 학습 단계로 자리잡았다. 사전학습으로 능력을 넣고, **지시 미세조정으로 그 능력에 접근하는 인터페이스를 만든다**는 2단 구조가 여기서 명확해진다. 값도 싸다 — 사전학습에 비하면 무시할 만한 연산으로 zero-shot 사용성이 통째로 바뀌기 때문에, 이후 모든 오픈 모델이 base 체크포인트와 instruct 체크포인트를 나란히 배포하는 관행이 굳었다. 다만 이 논문이 최적화하는 것은 **정답이 있는 태스크의 정확도**이지 "사람이 더 좋아하는 답변"이 아니라는 점이 중요하다.',

legacy:[
 '**선호 데이터 축과의 분리와 결합** — 지시 데이터로 형식을 가르치는 이 축과, [InstructGPT](#/p/instructgpt)의 선호 데이터로 취향·안전성을 가르치는 축은 서로 다른 신호다. 현대 레시피는 둘을 순서대로 쌓는다: 지시 SFT → 선호 최적화([DPO](#/p/dpo)/[PPO](#/p/ppo))',
 '**데이터 규모 경쟁** — 후속 Flan Collection·T0·Super-NaturalInstructions로 태스크 수가 수백~1800개까지 늘었고, 태스크 다양성이 데이터 양보다 중요하다는 것이 재확인됐다',
 '**합성 지시 데이터** — 사람이 템플릿을 쓰는 대신 강한 모델로 지시-응답 쌍을 생성하는 Self-Instruct·Alpaca 계열로 이어지며, [LLaMA](#/p/llama) 이후 오픈 채팅 모델의 표준 부트스트랩이 됐다',
 '**사고 사슬과의 결합** — 후속 Flan-PaLM이 지시 데이터에 [CoT](#/p/cot) 예제를 섞으면 추론 태스크 zero-shot이 함께 오른다는 것을 보였다'
],

pitfalls:[
 '**FLAN은 RLHF가 아니다.** 학습 신호가 사람이 쓴 **정답 레이블**이지 응답 간 **선호 비교**가 아니다. 그래서 벤치마크 정확도는 올라가도 "어떤 답변이 더 도움되는가"는 직접 최적화되지 않으며, 무해성·정직성 문제도 다루지 않는다. 두 방법은 경쟁 관계가 아니라 서로 다른 축이다.',
 '**작은 모델에 그대로 적용하면 손해를 볼 수 있다.** 8B 이하에서 미지 태스크 성능이 떨어졌다는 결과는 지금도 유효한 경고다. 소형 모델의 지시 미세조정은 "일반화"가 아니라 사용할 태스크에 맞춘 특화로 접근하는 편이 안전하다.',
 '**"처음 보는 태스크"의 기준이 벤치마크마다 다르다.** 이 논문은 클러스터 전체를 제외했지만, 이후 많은 연구가 데이터셋 하나만 빼고 "unseen"이라 부른다. 논문 간 zero-shot 수치를 나란히 비교할 때 이 정의 차이를 먼저 확인해야 한다.'
],

links:[
 {t:'arXiv 2109.01652 — Finetuned Language Models Are Zero-Shot Learners', u:'https://arxiv.org/abs/2109.01652'},
 {t:'Google Research Blog — Introducing FLAN: More generalizable models', u:'https://research.google/blog/introducing-flan-more-generalizable-language-models-with-instruction-fine-tuning/'},
 {t:'GitHub — google-research/FLAN (템플릿 및 Flan Collection)', u:'https://github.com/google-research/FLAN'}
]
});
