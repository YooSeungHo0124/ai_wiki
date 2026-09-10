WIKI.paper({
slug:'rethinking-demos',
venue:'EMNLP 2022',
authors:'Min et al. (University of Washington · Meta AI · Allen Institute for AI)',
arxiv:'2202.12837',

tldr:'few-shot 예시의 **정답 라벨을 무작위로 바꿔치기해도 성능이 거의 떨어지지 않는다**는 것을 12개 모델에 걸쳐 보였다. [GPT-3](#/p/gpt3)가 예시에서 "입력→출력 대응"을 배운다는 통념을 흔들고, 모델이 실제로 배우는 것은 라벨 공간·입력 분포·형식이라는 결론을 냈다.',

context:'[GPT-3](#/p/gpt3) 이후 in-context learning은 "몇 개의 (입력, 정답) 쌍을 프롬프트에 넣으면 모델이 그 대응관계를 보고 새 입력에 답한다"는 그림으로 이해돼 왔다. 이 그림은 지도학습의 직관을 그대로 옮긴 것이다 — 올바른 입력-라벨 쌍이 있어야 모델이 무엇을 예측해야 하는지 배운다는 가정이다. 하지만 실제로 모델이 그 대응관계를 **보고 있는지**, 아니면 예시들이 그저 과제의 형식과 분위기만 알려주는 것인지는 검증된 적이 없었다. 저자들은 라벨을 일부러 틀리게 바꿔서 이 가정을 직접 시험했다.',

ideas:[
 {h:'gold label vs random label: 성능이 거의 안 갈린다',
  lead:'demonstrations의 정답 라벨을 무작위 라벨로 바꿔도 정확도가 0~5%p만 떨어진다.',
  d:'분류 과제에서 평균 2.6%p, 다지선다 과제에서 평균 1.7%p 하락에 그쳤다. GPT-2 Large·[GPT-3](#/p/gpt3)·GPT-J 등 12개 모델에서 일관됐다. 입력-라벨 대응이 뒤죽박죽인 예시를 보고도 모델이 원래 과제를 거의 그대로 수행한다는 뜻이다.'},
 {h:'그래도 예시가 없는 것보다는 훨씬 낫다',
  lead:'라벨이 틀려도 "예시가 있다"는 사실 자체가 zero-shot보다 큰 이득을 준다.',
  d:'no-demonstrations 조건은 gold-label·random-label 조건 둘 다보다 뚜렷이 낮다. 즉 예시가 주는 이득의 대부분은 **개별 입력-라벨 쌍이 맞았는가**가 아니라 **몇 개의 입력과 라벨이 어떤 모양인지 보여줬는가**에서 온다.'},
 {h:'라벨 공간과 입력 분포가 핵심 동인이다',
  lead:'라벨을 실제 라벨 집합에서만 뽑아도, 입력을 실제 분포에서만 가져와도 각각 성능이 오른다.',
  d:'라벨 공간을 정답 라벨 집합이 아닌 무관한 영어 단어로 바꾸면(Random English words) 성능이 뚜렷이 하락한다 — 모델이 "라벨이 어떤 후보들 중 하나여야 하는지"를 예시에서 배운다는 뜻이다. 마찬가지로 입력을 과제와 무관한 분포(OOD 텍스트)로 바꾸면 개선분의 상당 부분이 사라진다. 반대로 라벨이 랜덤이어도 **라벨 공간**과 **입력 분포**만 올바르면 개선의 대부분이 남는다.'},
 {h:'meta-training이 이 경향을 더 강화한다',
  lead:'in-context learning 목적으로 메타학습된 MetaICL은 라벨을 랜덤으로 바꿔도 손실이 0.1~0.9%p뿐이다.',
  d:'명시적으로 "여러 few-shot 과제를 흉내내도록" 메타학습된 [MetaICL](#/p/gpt3)류 모델은 입력-라벨 매핑을 사실상 무시하고 형식 같은 더 단순한 신호에 거의 전적으로 의존하는 경향이 더 심해진다. 메타학습이 "더 정교한 few-shot 학습자"를 만드는 게 아니라 오히려 라벨 대응을 덜 보게 만들 수 있다는 뜻이다.'},
 {h:'direct 모델과 channel 모델의 비대칭',
  lead:'라벨을 직접 생성해야 하는 direct 모델이 채점만 하는 channel 모델보다 라벨 공간에 더 민감하다.',
  d:'입력을 보고 라벨을 생성하는 direct 방식은 라벨 공간을 모르면 아예 엉뚱한 텍스트를 뱉을 수 있어 라벨 공간 정보에 크게 의존한다. 반면 입력의 조건부 확률로 후보를 채점하는 channel 방식은 애초에 후보 라벨 집합을 외부에서 받으므로 이 정보에 덜 민감하다. 같은 현상(라벨 정보 활용)이 추론 방식에 따라 다르게 나타난다는 것을 보여준다.'}
],

diagram:{type:'compare', cap:'같은 in-context learning 결과를 설명하는 두 가설. 이 논문은 왼쪽이 아니라 오른쪽이 실제로 일어나는 일에 가깝다는 것을 실험으로 보였다.',
 left:{t:'통념: 대응관계 학습', items:['예시의 입력→정답 쌍을 본다','추론 시점에 그 매핑을 일반화','라벨이 틀리면 성능이 무너져야 함']},
 right:{t:'실제: 형식·분포 학습', items:['라벨이 틀려도 0~5%p만 하락','라벨 공간·입력 분포가 핵심','예시는 "과제의 모양"을 지정']}
},

math:[
 {expr:'argmax_y P(y | x1, ỹ1, ..., xk, ỹk, x)',
  tex:'\\hat{y} = \\arg\\max_{y \\in \\mathcal{C}} P(y \\mid x_1,\\tilde{y}_1,\\dots,x_k,\\tilde{y}_k,x)',
  d:'demonstrations의 라벨을 $\\tilde{y}_i$ 로 표기해, 정답 라벨 $y_i$ 와 다를 수 있음을 명시했다. random-label 조건은 이 $\\tilde{y}_i$ 를 라벨 공간에서 균등하게 무작위로 뽑는다.'}
],

numbers:[
 {k:'gold→random 라벨, 분류', v:'-2.6%p (평균)', d:'Macro-F1, 12개 모델 평균'},
 {k:'gold→random 라벨, 다지선다', v:'-1.7%p (평균)', d:'Accuracy, gold-label과 거의 근접'},
 {k:'MetaICL의 하락폭', v:'0.1~0.9%p', d:'명시적으로 메타학습된 모델일수록 라벨 정확성에 더 둔감'},
 {k:'실험 모델 수', v:'12개', d:'GPT-2·MetaICL·GPT-J·fairseq 6.7B/13B·GPT-3(175B) × direct/channel'},
 {k:'demonstrations 개수', v:'k=16', d:'주 실험 기본값, ablation은 k=4/8/16/32까지 비교'},
 {k:'항상 오답 라벨일 때 하락', v:'약 10%p', d:'0% correct label 조건, gold label 대비'}
],

impact:'이 논문은 in-context learning의 메커니즘 논쟁을 한 단계 진전시켰다. "예시가 입력-라벨 매핑을 가르친다"는 직관적 설명이 데이터로 반박되면서, 대신 "예시가 과제의 형식·라벨 후보·입력 분포를 지정한다"는 더 정밀한 설명이 자리잡았다. 이 발견은 [Induction Heads](#/p/induction-heads)가 제시한 "attention head가 시퀀스 내 패턴을 복사한다"는 메커니즘적 설명과 나란히 읽으면, in-context learning이 패턴 매칭·형식 모방에 가깝고 지도학습식 함수 근사와는 다르다는 그림을 강화한다. 실무적으로는 예시를 만들 때 라벨의 정확성보다 라벨 공간과 입력 분포를 과제에 맞추는 것이 더 중요할 수 있다는 시사점을 준다.',

legacy:[
 '**"더 큰 모델은 다르게 학습한다"는 반론** — [Wei et al. (2023), "Larger language models do in-context learning differently"](https://arxiv.org/abs/2303.03846)는 충분히 크고 instruction-tuned된 모델은 flipped/random label에서도 실제로 성능이 떨어지는(즉 라벨을 실제로 본다는) 패턴을 관찰해, 이 논문의 결론이 모델 규모·정렬 방식에 따라 달라질 수 있음을 보였다',
 '[Induction Heads](#/p/induction-heads)의 메커니즘 해석 연구와 함께 인용되며, in-context learning을 "회로 수준"과 "행동 수준" 양쪽에서 설명하려는 흐름의 한 축이 됨',
 '이후 프롬프트 설계 연구들이 "라벨의 정확성"보다 "라벨 공간 노출·형식 일관성"을 최적화 대상으로 삼기 시작함',
 '[GPT-3](#/p/gpt3)의 few-shot 결과를 "학습이 일어난 증거"로 해석하는 것에 대한 경계심을 널리 퍼뜨려, 이후 [scratchpad](#/p/scratchpad)·[CoT](#/p/cot) 계열이 "모델이 실제로 무엇을 이용하는가"를 더 조심스럽게 검증하게 만듦'
],

pitfalls:[
 '**"라벨은 전혀 안 본다"로 과장하면 안 된다.** 0% correct label(항상 오답) 조건은 gold label보다 약 10%p 낮아, 극단적으로 라벨을 왜곡하면 여전히 손해를 본다. 이 논문의 주장은 "무작위로 섞은 정도"의 손상에는 놀랍도록 강건하다는 것이지, 라벨이 완전히 무의미하다는 것이 아니다.',
 '**후속 연구와의 재현성 논쟁이 있다.** [Wei et al. 2023]은 모델이 충분히 크고 instruction-tuned되면 flipped label에 민감해진다는 상반된 결과를 보고했다. 즉 "라벨을 무시한다"는 경향은 절대적 성질이 아니라 이 논문이 실험한 모델 규모·세대(2022년 이전 GPT-3/GPT-J 계열)에서 관찰된 패턴에 가깝다.',
 '**"라벨 공간 노출"과 "형식 노출"을 하나로 뭉치면 원인 오독이 쉽다.** 저자들이 5.1~5.3절에서 라벨 공간·입력 분포·입력-라벨 페어링을 각각 분리해 통제했는데, 이를 생략하고 "예시는 형식만 알려준다"로 단순화하면 어떤 요소가 실제로 기여했는지 놓치게 된다.'
],

figures:[
 {f:'fig1-gold-vs-random.png',
  cap:'파란 막대(예시 없음)에서 노란 막대(정답 라벨 예시)로 가면 크게 오르지만, 빨간 막대(무작위 라벨 예시)는 노란 막대와 거의 같은 높이다 — MetaICL·GPT-J·GPT-3 세 모델, 분류(위)·다지선다(아래) 모두에서.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-overview.png',
  cap:'in-context learning의 기본 형태. k개의 (입력, 라벨) 예시를 프롬프트에 나열한 뒤 테스트 입력을 붙이면, 모델이 그 뒤를 이어 라벨을 생성/채점한다. 이 논문은 노란 줄의 라벨을 무작위로 바꿔서 이 구조를 시험했다.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'We show that ground truth demonstrations are in fact not required—randomly replacing labels in the demonstrations barely hurts performance on a range of classification and multi-choice tasks, consistently over 12 different models including GPT-3.',
  src:'Abstract, p.1'},
 {t:'This strongly suggests, counter-intuitively, that the model does not rely on the input-label mapping in the demonstrations to perform the task.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 2202.12837 — Rethinking the Role of Demonstrations', u:'https://arxiv.org/abs/2202.12837'},
 {t:'공식 코드 (Alrope123/rethinking-demonstrations)', u:'https://github.com/Alrope123/rethinking-demonstrations'},
 {t:'후속 반론: Larger LMs do In-Context Learning Differently (Wei et al. 2023)', u:'https://arxiv.org/abs/2303.03846'}
]
});
