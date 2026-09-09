WIKI.paper({
slug:'general-assistant',
venue:'arXiv 2021 (Anthropic)',
authors:'Askell, Bai, Chen, Drain, Ganguli et al. (Anthropic)',
arxiv:'2112.00861',

tldr:'정렬(alignment) 연구를 추상적 논의에서 **측정 가능한 실험**으로 끌어내린 논문. 프롬프팅·모방학습·이진 판별·순위 선호모델링을 같은 조건에서 비교하고, "정렬시키면 성능이 떨어진다"는 alignment tax가 모델 크기가 커질수록 사라짐을 보였다.',

context:'2021년 시점에는 [GPT-3](#/p/gpt3) 같은 대형 언어모델이 광범위한 능력을 갖췄지만, 이를 "정렬됐다"고 할 수 있는 어시스턴트로 만드는 표준 실험 절차가 없었다. 정렬을 다루는 연구 대부분은 좁은 하위 문제 하나에 국한되거나, 실증 없이 이론적으로만 논의됐다. 이 논문의 문제의식은 실용적이다 — 이미 범용에 가까운 모델이 있는데 정렬을 이론으로만 논할 핑계가 사라졌으니, **직접 여러 베이스라인 기법을 같은 잣대로 재보자**는 것이다. 그러려면 먼저 "정렬됐다"는 것이 무엇을 뜻하는지부터 조작적으로 정의해야 했다.',

ideas:[
 {h:'HHH: helpful·honest·harmless 세 단어로 정렬을 정의',
  lead:'정렬을 helpful·honest·harmless 세 기준으로 조작적으로 정의하고 평가셋을 직접 만든다.',
  d:'"정렬된 AI"를 유용함(helpful)·정직함(honest)·무해함(harmless) 세 기준으로 정의했다. 각 기준마다 무엇을 요구하는지 세부 항목을 나열했다 — 예를 들어 honest는 "80% 확신한다고 말하면 실제로 80%는 맞아야 한다"는 보정(calibration)까지 포함한다. 이 HHH 기준과 평가셋은 이후 [anthropic-hh](#/p/anthropic-hh)를 비롯한 후속 연구가 그대로 물려받아 쓴다.'},
 {h:'프롬프팅만으로도 상당한 정렬 효과가 난다',
  lead:'14개 가상 대화로 구성된 4,600단어 프롬프트 하나로 HHH 평가 정확도가 크게 오른다.',
  d:'따로 학습시키지 않고, 정중하고 도움이 되는 어시스턴트가 등장하는 가상 대화 14개(약 4,600단어)를 프롬프트 앞에 붙이는 것만으로 HHH 평가 정확도가 크게 향상됐다. 이 프롬프트는 위험한 요청에 저항하는 예시를 하나도 포함하지 않았는데도, 모델이 유해 행동을 스스로 피하는 모습을 보였다 — 성격(persona)만으로 일반화가 일어난 것이다.'},
 {h:'Alignment tax는 모델이 클수록 사라진다',
  lead:'작은 모델은 프롬프트로 성능이 깎이지만, 큰 모델은 같은 프롬프트로 성능이 거의 안 깎인다.',
  d:'정렬 개입이 능력을 희생시키는 대가를 alignment tax라 부른다. 작은 모델에 HHH 프롬프트를 걸면 다른 과제 성능이 떨어지지만, 모델이 커질수록 이 손실이 줄어들어 큰 모델에서는 거의 공짜에 가까워진다. Codex 코드 생성 과제(HumanEval)에서도 같은 패턴이 나타나, 대형 모델은 프롬프트를 걸어도 Pass@10이 거의 그대로 유지됐다.'},
 {h:'Context distillation: 프롬프트를 파인튜닝으로 흡수',
  lead:'긴 프롬프트가 만드는 출력 분포를 프롬프트 없는 모델에 파인튜닝으로 옮겨 담는다.',
  d:'매번 긴 프롬프트를 붙이는 대신, 프롬프트가 있을 때의 출력 분포를 목표로 삼아 프롬프트 없는 모델을 그 분포에 맞게 미세조정했다. 이렇게 "증류"된 모델은 컨텍스트 창을 프롬프트에 뺏기지 않으면서도 프롬프트를 준 것과 비슷한 성능을 냈다.'},
 {h:'순위 선호모델링이 모방학습보다 낫고 더 잘 스케일한다',
  lead:'같은 데이터로도 순위 비교 학습이 정답 모방보다 크게 앞서고 격차가 모델이 클수록 벌어진다.',
  d:'같은 데이터를 놓고 세 가지 학습 방식 — 정답을 그대로 흉내 내는 모방학습(imitation learning), 좋다/나쁘다만 이진 판별하는 방식, 두 응답 중 더 나은 쪽을 고르는 순위 선호모델링(ranked preference modeling) — 을 비교했다. 순위가 있는 평가(요약·HellaSwag 등)에서는 선호모델링이 모방학습을 크게 앞섰고 그 격차가 모델 크기에 따라 더 벌어졌다. 반면 이진 평가에서는 세 방식 간 차이가 거의 없었다. 이 결과가 곧 [InstructGPT](#/p/instructgpt) 류의 RLHF가 순위 비교 데이터를 쓰는 이유의 실증적 근거가 된다.'}
],

diagram:{type:'compare', cap:'같은 alignment 목표에 대해 세 가지 개입 방식이 얼마나 다른 비용·효과를 갖는지.',
 left:{t:'프롬프팅 / 컨텍스트 증류', items:['재학습 없이 즉시 적용','대형 모델은 tax 거의 없음','컨텍스트 창을 소모함(증류로 해결)']},
 right:{t:'순위 선호모델링(PM)', items:['모방학습보다 크게 우수','모델 클수록 격차 확대','PM 사전학습(PMP)으로 표본효율 개선']}
},

math:[],

numbers:[
 {k:'프롬프트 길이', v:'약 4,600단어', d:'14개 가상 인간-어시스턴트 대화, 특별히 최적화되지 않은 즉흥 작성'},
 {k:'테스트 모델 크기', v:'10M~52B (4배씩)', d:'13M, 42M, 197M, 810M, 2.7B, 13B, 52B 비임베딩 파라미터'},
 {k:'PM vs IL 정확도 격차', v:'약 +0.21', d:'순위형 평가(요약·HellaSwag·공리주의 윤리) 평균, 52B 모델 기준'},
 {k:'이진형 평가 격차', v:'약 0', d:'Code Correctness·Lambada·상식도덕 등에서는 PM과 IL 차이가 거의 없음'},
 {k:'Codex Pass@10', v:'프롬프트 유무 무관하게 수렴', d:'대형 모델일수록 HHH 프롬프트가 있어도 코드 생성 성능 손실이 사라짐'}
],

impact:'정렬 연구를 "논의"에서 "측정"으로 옮긴 실질적인 첫 실험실이 됐다. HHH 정의와 평가셋, 프롬프팅/증류/선호모델링 비교 프레임은 이후 Anthropic 정렬 연구 계열([anthropic-hh](#/p/anthropic-hh), [Constitutional AI](#/p/constitutional))이 그대로 물려받았다. 특히 "선호 비교 데이터로 학습하는 것이 정답 모방보다 낫다"는 결론은 RLHF가 왜 순위 비교 방식을 택하는지에 대한 초기 실증 근거를 제공했다.',

legacy:[
 '**HHH 기준이 표준 정렬 정의로 자리잡음** — [anthropic-hh](#/p/anthropic-hh)의 helpfulness/harmlessness 분리 수집도 이 정의를 그대로 계승',
 '**PM 우위 관찰이 RLHF 설계를 뒷받침** — [InstructGPT](#/p/instructgpt)를 비롯해 이후 정렬 파이프라인 대부분이 순위 비교(pairwise preference) 데이터를 채택',
 '**alignment tax가 스케일에 따라 사라진다는 관찰** — "정렬이 성능을 깎는다"는 초기 우려를 완화하며, 정렬 개입을 대형 모델에 적극 적용할 근거가 됨',
 'context distillation은 이후 시스템 프롬프트를 파라미터에 굽는(distill) 기법들의 초기 형태로 남음'
],

pitfalls:[
 '**HHH 프롬프트가 "안전을 가르친" 것이 아니다.** 저자들 스스로 프롬프트에 위험한 요청에 저항하는 예시가 전혀 없었다고 강조한다 — 관찰된 효과는 페르소나 일반화에 가깝고, 견고한 안전장치로 보면 안 된다.',
 '**alignment tax 소멸은 "정렬이 공짜"라는 뜻이 아니다.** 이 논문이 측정한 것은 프롬프팅이라는 얕은 개입의 tax일 뿐, RLHF 같은 깊은 파인튜닝 개입의 tax는 별도로 측정해야 한다(이는 [anthropic-hh](#/p/anthropic-hh)에서 다뤄진다).',
 '**PM의 우위는 "순위가 있는 평가"에서만 뚜렷했다.** 이진 평가에서는 모방학습과 차이가 거의 없었으므로, "선호모델링이 항상 낫다"로 일반화하면 안 된다.'
],

figures:[
 {f:'fig2-prompting-tax.png',
  cap:'왼쪽: 파라미터 수(x축, 로그)가 늘수록 HHH 평가 정확도(y축)가 오르는데, No Intervention(빨강)보다 Full Prompt(검정)·Context Distilled(주황)가 전 구간에서 위에 있다. 오른쪽: Codex Pass@10에서 점선(프롬프트 없음)과 실선(HHH 프롬프트)이 대형 모델 구간에서 거의 겹친다 — 큰 모델일수록 프롬프트의 "세금"이 사라진다는 뜻.',
  src:'원문 Figure 2, p.5'},
 {f:'fig3-pm-vs-il.png',
  cap:'y축은 선호모델링이 모방학습보다 나은 정확도 차이. 파란 굵은선(순위형 평가 평균)은 모델이 커질수록 우상향해 최대 +0.30 가까이 벌어지는데, 주황 굵은선(이진형 평가 평균)은 0 근처에 거의 평평하게 붙어 있다.',
  src:'원문 Figure 3, p.6'}
],

quotes:[
 {t:'We will define an AI as "aligned" if it is, in three words, helpful, honest, and harmless or \'HHH\'.',
  src:'Introduction, p.5'},
 {t:'We find that the benefits from modest interventions increase with model size, generalize to a variety of alignment evaluations, and do not compromise the performance of large models.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2112.00861 — A General Language Assistant as a Laboratory for Alignment', u:'https://arxiv.org/abs/2112.00861'}
]
});
