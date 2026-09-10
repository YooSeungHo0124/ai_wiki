WIKI.paper({
slug:'prompt-tuning',
venue:'EMNLP 2021',
authors:'Lester, Al-Rfou, Constant (Google Research)',
arxiv:'2104.08691',

tldr:'사전학습 모델 전체를 얼려 두고, 입력 앞에 붙일 **연속 벡터(soft prompt) k개만** 역전파로 학습한다. [Prefix Tuning](#/p/prefix-tuning)을 입력층 하나로 단순화한 것인데, 모델이 [T5](#/p/t5)-XXL(11B) 규모에 이르면 이 몇만 개짜리 프롬프트만으로 **전체 미세조정과 SuperGLUE 성능이 같아진다** — 제목의 "The Power of Scale".',

context:'2021년 초 언어모델 적응 방법은 두 극단에 있었다. **모델 튜닝**(전체 미세조정)은 성능은 좋지만 과제마다 11B짜리 T5-XXL 전체를 복사해 저장해야 한다. GPT-3식 **프롬프트 설계**(few-shot priming)는 모델을 얼린 채 텍스트만 바꾸면 되지만, 사람이 쓴 프롬프트로는 미세조정 품질을 못 따라간다 — GPT-3 175B few-shot이 미세조정 T5-XXL보다 SuperGLUE에서 17.5점 낮았다. [Prefix Tuning](#/p/prefix-tuning)은 이 틈을 메우려 각 encoder 레이어 앞에 학습 가능한 prefix 활성값을 붙였지만, 구조가 복잡하고 레이어마다 별도 파라미터가 필요했다. 질문은 단순하다 — **입력층 하나에만 연속 벡터를 붙이는 것만으로 충분한가?**',

ideas:[
 {h:'Soft prompt: 입력 임베딩 앞에 붙는 학습 가능한 벡터',
  lead:'모델은 전부 얼리고, 입력 앞에 붙는 k개의 연속 임베딩만 역전파로 학습한다.',
  d:'이산 토큰이 아니라 임베딩 공간의 연속 벡터 $P \\in \\mathbb{R}^{p \\times e}$ 를 직접 학습한다. 이 벡터를 입력 임베딩 $X_e$ 앞에 이어붙인 $[P; X_e]$ 를 통째로 인코더에 흘려보내고, 그래디언트는 $P$ 로만 흐른다. 사람이 고른 단어가 아니라 손실을 최소화하는 방향으로 직접 최적화된 벡터라서, 어떤 이산 프롬프트보다 그 과제에 맞는 표현을 담을 수 있다.'},
 {h:'Prefix Tuning보다 단순: 입력층 하나, 레이어당 재매개변수화 없음',
  lead:'모든 레이어에 prefix를 넣던 Prefix Tuning과 달리 입력 임베딩 층 하나에만 벡터를 붙인다.',
  d:'[Prefix Tuning](#/p/prefix-tuning)은 encoder의 모든 레이어 앞에 활성값을 넣고, 학습 안정을 위해 MLP로 재매개변수화까지 필요했다. 이 논문은 **입력 임베딩 하나**에만 프롬프트를 붙이고 나머지는 모델의 self-attention이 알아서 그 신호를 깊은 레이어까지 전파하게 둔다. 구조가 단순해지는 대신 표현력은 줄어드는데, 그 손실이 모델 규모로 상쇄된다는 것이 이 논문의 핵심 주장이다.'},
 {h:'"The Power of Scale": 모델이 커지면 미세조정과의 격차가 사라진다',
  lead:'프롬프트 길이는 그대로인데, 모델 파라미터가 억 단위를 넘으면 model tuning 성능을 따라잡는다.',
  d:'T5 Small부터 XXL(11B)까지 다섯 크기에서 같은 방법을 비교하면, 작은 모델에서는 model tuning과 몇 점 차이가 나던 SuperGLUE 점수가 모델이 커질수록 좁혀져 XXL에서는 사실상 같아진다($\\approx$ 90점대). 사람이 짠 프롬프트(prompt design)는 모델을 아무리 키워도 이 격차를 좁히지 못한다 — 즉 "격차가 스케일로 닫히는" 현상은 **학습 가능한** 연속 프롬프트에서만 나타난다.'},
 {h:'파라미터 효율: 과제당 20K 파라미터로 11B 모델과 동급',
  lead:'프롬프트 길이 5~100 토큰이면 과제당 파라미터가 전체 미세조정 대비 5자릿수 이상 줄어든다.',
  d:'T5-XXL을 통째로 미세조정하면 과제마다 11B 파라미터 복사본이 필요하다. 프롬프트 길이 5토큰짜리 soft prompt는 임베딩 차원 $E$와 곱해 20,480개 파라미터면 되고, 이는 **5자릿수(20만 배) 이상 작다.** 여러 과제를 동시에 서빙할 때도 얼린 모델 하나를 공유하고 과제별로 짧은 프롬프트만 갈아 끼우는 mixed-task batch가 가능해진다.'},
 {h:'프롬프트 앙상블: 모델 앙상블보다 싸다',
  lead:'같은 과제에 대해 서로 다른 프롬프트 여러 개를 학습해 앙상블하면 모델을 통째로 여러 벌 학습하지 않고도 성능이 오른다.',
  d:'전통적인 모델 앙상블은 전체 모델을 $N$번 학습·저장·추론해야 한다. 프롬프트는 크기가 작으므로 같은 얼린 모델에 서로 다른 초기화로 학습한 프롬프트 5개를 붙여 앙상블해도 비용이 거의 늘지 않는다. 이 "prompt ensembling"이 단일 프롬프트보다 나은 성능을 보인다.'}
],

diagram:{type:'compare', cap:'모델 튜닝(과제마다 전체 복사) vs 프롬프트 튜닝(얼린 모델 하나 공유).',
 left:{t:'모델 튜닝', items:['과제마다 11B 전체 복사본 저장','추론도 과제별 배치로 분리','성능은 최고, 서빙 비용도 최고']},
 right:{t:'프롬프트 튜닝', items:['과제당 프롬프트 20K 파라미터','같은 얼린 모델로 mixed-task 추론','대형 모델에서 model tuning과 동급']}
},

math:[
 {expr:'Pr_theta,theta_P(Y | [P; X])  — theta는 고정, theta_P(=P)만 학습',
  tex:'\\Pr_{\\theta,\\,\\theta_P}(Y \\mid [P; X]),\\quad \\theta \\text{ 고정, } \\theta_P = P \\text{ 만 학습}',
  d:'전체 미세조정은 $\\theta$ 전체에 대해 $\\log\\Pr_\\theta(Y|X)$ 를 최대화하지만, 프롬프트 튜닝은 $\\theta$ 를 고정한 채 $P$ 에 대해서만 같은 목적함수를 최대화한다. 파라미터 비용은 $E \\times P$(임베딩 차원 × 프롬프트 길이) 뿐이다.'}
],

numbers:[
 {k:'파라미터 비용 · T5-XXL', v:'20,480 / 11,000,000,000', d:'프롬프트 길이 5토큰 기준, model tuning 대비 5자릿수 이상 감소'},
 {k:'GPT-3 175B few-shot vs 미세조정 T5-XXL', v:'71.8 vs 89.3 SuperGLUE', d:'파라미터는 GPT-3가 16배 많은데도 격차 17.5점'},
 {k:'프롬프트 튜닝 T5-XXL', v:'model tuning과 SuperGLUE 동급', d:'Figure 1에서 두 곡선이 $10^{10}$ 파라미터 부근에서 수렴'},
 {k:'프롬프트 길이', v:'과제당 5~100 토큰', d:'실험에서 20~100 토큰이 대체로 충분, 더 늘려도 이득 적음'},
 {k:'적은 파라미터 배수', v:'"20,000배 이상 적은 과제별 파라미터"', d:'model tuning 대비, XXL 크기 기준'}
],

impact:'이 논문은 PEFT(parameter-efficient fine-tuning) 계열의 표준 베이스라인 중 하나를 만들었다. 모델이 계속 커지는 흐름에서 "**과제별 전체 복사본**"이라는 서빙 비용 문제를 정면으로 겨냥했고, 그 해법이 구조 변경이 아니라 **입력에 붙는 벡터 몇 개**로 충분하다는 것을 보였다. 이후 continuous prompt/soft prompt 연구(P-tuning 등)가 이 프레임을 그대로 계승했고, [LoRA](#/p/lora)·[Adapter](#/p/adapter)와 함께 "모델을 얼리고 작은 모듈만 학습한다"는 PEFT 삼각형의 한 축이 되었다.',

legacy:[
 '**[LoRA](#/p/lora)와의 대조** — LoRA는 가중치 행렬에 저랭크 업데이트를 더하고, 프롬프트 튜닝은 입력 시퀀스에 벡터를 더한다. 위치는 다르지만 "얼린 모델 + 소수 파라미터"라는 목표는 같다.',
 '**[Adapter](#/p/adapter)와의 대조** — 어댑터는 레이어 사이에 작은 MLP를 끼워 넣어 추론 시 지연이 늘지만, 프롬프트 튜닝은 시퀀스 길이만 늘려 구조 변경이 없다.',
 '**P-tuning류로 확장** — 소프트 프롬프트를 여러 레이어에 다시 주입하는 후속 연구들이 작은 모델에서의 성능 저하를 메우려 시도',
 '**instruction tuning과의 분기** — [FLAN](#/p/flan)·[T0](#/p/t0)류의 "자연어 지시문으로 zero-shot"과 달리, 이 계열은 "과제마다 학습된 벡터"라는 다른 해법으로 남아 오늘날에도 저자원 적응에 쓰인다'
],

pitfalls:[
 '**작은 모델에서는 model tuning을 못 따라간다.** "The Power of Scale"이라는 제목 자체가 이 방법이 대형 모델에서만 유효하다는 조건부 주장임을 뜻한다. 억 단위 이하 모델에서는 격차가 여전히 크다.',
 '**Prefix Tuning과 혼동하기 쉽다.** Prefix Tuning은 모든 레이어에 활성값을 주입하고 재매개변수화 MLP가 필요하지만, 이 논문은 입력 임베딩 층 하나에만 벡터를 붙인다. 이름이 비슷해 두 방법을 같은 것으로 오해하기 쉽다.',
 '**학습이 불안정할 수 있다.** 프롬프트 초기화 방식(무작위 vs 어휘 임베딩에서 샘플링)에 성능이 민감하며, 논문도 여러 초기화 전략을 별도로 비교한다.'
],

figures:[
 {f:'fig1-scale-closes-gap.png',
  cap:'x축이 로그 스케일 모델 파라미터, y축이 SuperGLUE 점수. 빨강/주황이 model tuning(단일·다중과제), 초록 X가 이 논문의 prompt tuning, 파랑 사각형이 GPT-3식 few-shot prompt design. 모델이 커질수록 초록 선이 빨강/주황에 붙는 것이 "격차가 스케일로 닫힌다"는 핵심 결과.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-model-vs-prompt-tuning.png',
  cap:'왼쪽 Model Tuning: 과제 A/B/C마다 11B 전체 모델을 따로 복사해 저장하고 배치도 분리해야 한다. 오른쪽 Prompt Tuning: 20K 파라미터짜리 task prompt만 과제별로 갈아 끼우고, 하나의 얼린 pre-trained 모델로 서로 다른 과제(A/B/C)를 한 배치(Mixed-task Batch)에 섞어 추론할 수 있다.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'as models exceed billions of parameters, our method "closes the gap" and matches the strong performance of model tuning',
  src:'Abstract, p.1'},
 {t:'By contrast, our tuned prompts would only require 20,480 parameters per task—a reduction of over five orders of magnitude—assuming a prompt length of 5 tokens.',
  src:'Section 1, p.2'}
],

links:[
 {t:'arXiv 2104.08691 — The Power of Scale for Parameter-Efficient Prompt Tuning', u:'https://arxiv.org/abs/2104.08691'},
 {t:'GitHub — google-research/prompt-tuning', u:'https://github.com/google-research/prompt-tuning'}
]
});
