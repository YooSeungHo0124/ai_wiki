WIKI.paper({
slug:'bloomz',
venue:'ACL 2023 (BigScience)',
authors:'Muennighoff, Wang, Sutawika, Roberts et al. (Hugging Face · EleutherAI · Google Research 등)',
arxiv:'2211.01786',

tldr:'[BLOOM](#/p/bloom)·mT5를 **영어 프롬프트로만** 멀티태스크 파인튜닝(xP3 데이터셋)했을 뿐인데, 파인튜닝 중 한 번도 보지 못한 언어에서도 지시 따르기 능력이 나타난다는 것을 보인 논문. 결과물이 BLOOMZ(decoder-only)와 mT0(encoder-decoder)다.',

context:'[T0](#/p/t0)는 영어 전용 모델에 다수의 태스크를 프롬프트 형태로 파인튜닝하면 본 적 없는 태스크로 zero-shot 일반화가 된다는 것을 보였다. 하지만 이 결과는 전부 영어 안에서의 이야기였다. [BLOOM](#/p/bloom)이나 mT5 같은 다국어 사전학습 모델은 zero-shot 성능이 파인튜닝 성능보다 크게 낮아, 실무에서는 여전히 언어별·태스크별 파인튜닝이 표준이었다. 문제는 저자원 언어일수록 태스크 데이터를 모으기 어렵다는 것이다. 질문은 **다국어 사전학습 모델에 영어로만 멀티태스크 지시 파인튜닝을 해도, 그 언어능력이 사전학습에서만 보고 파인튜닝에서는 못 본 언어로까지 전이되는가**였다.',

ideas:[
 {h:'xP3: P3를 46개 언어로 확장한 멀티태스크 코퍼스',
  lead:'영어 전용 P3에 46개 언어의 태스크를 더하고 프롬프트는 영어로 유지한다.',
  d:'[T0](#/p/t0)의 학습 데이터인 P3를 확장해, 다국어 데이터셋에 **영어 프롬프트**를 붙인 xP3를 만든다. 언어 분포는 [BLOOM](#/p/bloom)의 사전학습 코퍼스 ROOTS를 최대한 따라가도록 설계했다 — xP3의 39%가 영어다. 프롬프트까지 기계번역한 변형인 xP3mt도 함께 만들어, "프롬프트 언어 자체가 중요한가"를 분리해서 실험할 수 있게 했다.'},
 {h:'영어 전용 파인튜닝만으로도 사전학습 언어 전체가 좋아진다',
  lead:'영어 프롬프트로만 학습해도 사전학습에서 본 다른 언어의 held-out 태스크 성능이 오른다.',
  d:'held-out 태스크(coreference resolution, sentence completion, NLI)에서 BLOOMZ·BLOOMZ-P3가 원본 [BLOOM](#/p/bloom)과 XGLM을 큰 폭으로 앞섰다. 심지어 100% 영어인 P3로 학습한 BLOOMZ-P3조차 다국어 sentence completion에서 BLOOM 대비 50% 이상 향상됐다 — 태스크를 영어로만 가르쳐도 "지시를 따르는 법" 자체가 다른 언어로 새어나간다는 뜻이다.'},
 {h:'놀라운 결과: 의도적으로 파인튜닝에 넣지 않은 언어로도 전이된다',
  lead:'xP3로 멀티태스크 학습만 해도 파인튜닝 중 한 번도 못 본 언어의 미학습 태스크를 풀 수 있다.',
  d:'일본어·러시아어처럼 xP3에 의도적으로 포함하지 않은 언어에서도 XNLI·XWinograd 등 미학습 태스크의 zero-shot 성능이 원본 BLOOM보다 올랐다(Figure 5). 저자들은 이를 "모델이 태스크 수행 능력과 언어 이해 능력을 어느 정도 분리해서 학습한다"는 가설로 설명한다. 단, 이 전이는 완전하지 않다 — 부록 실험에서 프롬프트를 그 미학습 언어로 기계번역하면 오히려 성능이 떨어진다(BLOOMZ-MT가 BLOOMZ보다 낮음), 파인튜닝 때 보지 못한 언어의 프롬프트 형태 자체에는 적응하지 못했기 때문이다.'},
 {h:'기계번역 프롬프트는 사람이 쓴 프롬프트에도 도움이 된다',
  lead:'xP3mt(기계번역 프롬프트)로 학습하면 인간이 직접 쓴 프롬프트에서도 성능이 오른다.',
  d:'XNLI에서 BLOOMZ-MT(xP3mt로 학습)는 사람이 작성한 프롬프트(HT)에서 BLOOMZ보다 높은 정확도를 낸다(43.88 vs 40.4 근방 대비, 영어 학습 대비 개선). 즉 프롬프트를 그 언어의 문법·어순으로 다양하게 노출시키는 것 자체가 "해당 언어로 지시받는 상황"에 대한 일반화를 돕는다 — 이는 파인튜닝 언어 커버리지가 최종 모델의 강건성에 직접 영향을 준다는 실무적 시사점이다.'},
 {h:'전이되지 않는 것: 짧은 태스크로 학습하면 생성이 짧아진다',
  lead:'다수 태스크가 한 문장짜리라서 멀티태스크 파인튜닝이 생성형 태스크(번역·코드)를 오히려 해친다.',
  d:'xP3의 태스크 대부분이 단문 완성형이라, 파인튜닝 후 모델이 **짧게 끊어 답하는 편향**을 학습한다. 그 결과 [HumanEval](#/p/humaneval) 코드 생성 pass@1이 BLOOM 15.52%에서 BLOOMZ 12.06%로 오히려 떨어졌고, 번역 BLEU도 짧은 생성 탓에 낮게 나왔다. 추론 시 EOS 토큰의 확률을 일정 길이까지 강제로 억제하는 최소 생성 길이 트릭으로 번역 BLEU를 9점 정도 회복시켰지만, 근본적으로는 파인튜닝 데이터의 태스크 길이 분포가 생성 스타일에 편향을 남긴다는 것을 보여준다.'}
],

diagram:{type:'compare', cap:'무엇이 전이되고 무엇이 전이되지 않는가.',
 left:{t:'전이되는 것', items:['영어로만 배운 지시 따르기 → 다른 사전학습 언어','미학습 언어의 미학습 태스크에도 일부 전이','기계번역 프롬프트 학습 → 사람 프롬프트 강건성']},
 right:{t:'전이되지 않는 것', items:['미학습 언어용 프롬프트 형식 자체','장문 생성 능력(코드·번역이 오히려 저하)','구조화된 프롬프트 스타일(mTk-Instruct 방식)']}},

math:[
 {expr:'xP3 언어 비율: 영어 39%, 나머지 45개 언어가 사전학습 코퍼스 ROOTS 분포를 따름',
  tex:'p_{\\text{xP3}}(\\ell) \\approx p_{\\text{ROOTS}}(\\ell), \\quad p_{\\text{xP3}}(\\text{en}) = 0.39',
  d:'파인튜닝 코퍼스의 언어 분포를 사전학습 분포에 최대한 맞춘 설계 선택. 저자들은 이 정렬 덕분에 고자원 언어(영어·스페인어·프랑스어)에서 파인튜닝 효과가 특히 크게 나타난다고 분석한다(§4.6).'}
],

numbers:[
 {k:'xP3 언어 수', v:'46개', d:'P3(영어 전용)에 다국어 태스크·데이터셋을 추가해 확장'},
 {k:'모델 크기 범위', v:'560M ~ 176B', d:'BLOOM/BLOOMZ 계열, mT0는 최대 13B(mT0-13B)'},
 {k:'NLI held-out 평균 정확도', v:'BLOOM 33.6% → BLOOMZ 55.3%', d:'영어 프롬프트, 언어 평균(XNLI), Figure 4'},
 {k:'coreference 평균 정확도', v:'BLOOM 50.6% → BLOOMZ 66.3%', d:'XWinograd, mT0-13B는 74.6%로 더 높음'},
 {k:'HumanEval pass@1', v:'BLOOM 15.52% → BLOOMZ 12.06%', d:'멀티태스크 파인튜닝이 코드 생성엔 오히려 역효과'},
 {k:'증류 아님 — 파라미터 규모 역전', v:'mT0-13B > BLOOMZ-176B', d:'held-out 태스크에서 13B encoder-decoder가 176B decoder-only를 앞섬(§4.1)'}
],

impact:'"지시 따르기 능력이 언어에 종속적"이라는 암묵적 전제를 깼다. 영어로만 학습한 지시 튜닝이 다른 언어로 새어나간다는 발견은 이후 다국어 [instruction tuning](#/p/flan)에서 **모든 언어의 태스크 데이터를 갖출 필요가 없다**는 실무적 근거가 됐다. 동시에 mT0(encoder-decoder)가 같은 데이터로 훨씬 작은 크기로 BLOOMZ(decoder-only)를 앞선 결과는, 사전학습 목적함수·아키텍처 선택이 멀티태스크 전이 효율에 미치는 영향을 재조명했다.',

legacy:[
 '**다국어 instruction tuning의 표준 관행 정립** — 이후 다국어 LLM 정렬 연구가 "전 언어 데이터 수집" 대신 "영어 중심 태스크 + 언어 커버리지 확보"로 균형을 맞추는 근거가 됨',
 '**xP3 계열의 확장** — 저자들이 후속으로 277개 언어·10배 규모의 xP3x를 공개했지만 이 논문 자체에서 그 모델을 학습시키지는 않음',
 '**encoder-decoder 재조명** — mT0가 훨씬 큰 BLOOMZ를 앞선 결과가 이후 다국어 정렬 연구에서 아키텍처·사전학습 목적함수 선택을 다시 따져보게 만듦',
 '**짧은 생성 편향에 대한 경고** — 최소 생성 길이 강제 트릭이 이후 instruction-tuned 모델의 생성형 태스크 평가에서 흔한 보정 기법으로 언급됨'
],

pitfalls:[
 '**"영어 프롬프트로 배우면 아무 언어나 다 된다"가 아니다.** 전이는 **사전학습 때 이미 본 언어**로 훨씬 잘 되고, 완전히 미학습 언어에서는 성능 하락 폭이 크며 그 언어로 프롬프트를 번역하면 오히려 더 나빠진다(Table 9).',
 '**BLOOMZ의 코드 생성 능력은 원본 BLOOM보다 떨어진다.** 멀티태스크 파인튜닝이 항상 이득인 것은 아니고, 학습 태스크 길이 분포(대부분 단문)와 다른 성격의 태스크(장문 생성)는 오히려 손해를 볼 수 있다.',
 '**mT0-13B가 BLOOMZ-176B를 앞서는 것은 "작은 모델이 항상 낫다"는 뜻이 아니다.** 저자들은 이를 encoder-decoder 구조·masked LM 사전학습 목적함수·더 긴 사전학습 토큰 수(mT5 1T vs BLOOM 366B) 등 여러 요인이 얽힌 결과로 설명하며, 단일 원인으로 단정하지 않는다.'
],

figures:[
 {f:'fig4-zeroshot-multilingual.png',
  cap:'세 가지 held-out 태스크(문장완성·NLI·상호참조해결) 각각에서 막대가 왼쪽부터 XGLM·BLOOM·mTk-Instruct(파인튜닝 안 됨 계열)와 BLOOMZ-P3·BLOOMZ·mT0-13B(파인튜닝 계열)를 비교한다. 파인튜닝 계열 막대가 세 태스크 모두에서 확실히 더 높다는 것이 핵심.',
  src:'원문 Figure 4, p.5'}
],

quotes:[
 {t:'Surprisingly, we find models are capable of zero-shot generalization to tasks in languages they have never intentionally seen.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2211.01786 — Crosslingual Generalization through Multitask Finetuning', u:'https://arxiv.org/abs/2211.01786'},
 {t:'GitHub — bigscience-workshop/xmtf', u:'https://github.com/bigscience-workshop/xmtf'}
]
});
