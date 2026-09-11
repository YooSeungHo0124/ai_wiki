WIKI.paper({
slug:'deepseek-llm',
venue:'arXiv 2024 (DeepSeek-AI)',
authors:'Bi, Chen, Dai, Deng, Ding et al. (DeepSeek-AI)',
arxiv:'2401.02954',

tldr:'DeepSeek 계열의 출발점. [Chinchilla](#/p/chinchilla) 스케일링 법칙을 **자체 데이터로 재측정**해 다른 계수를 얻었고, 그 결과에 따라 7B·67B 두 모델을 2조 토큰으로 학습해 67B가 LLaMA-2 70B를 코드·수학·추론에서 앞섰다.',

context:'2023년 [LLaMA](#/p/llama) 시리즈는 공개 가중치의 사실상 표준이 됐지만, Meta는 7B·13B·34B·70B라는 고정된 크기만 내놓았을 뿐 "이 크기가 왜 최적인가"에 대한 스케일링 법칙 검증은 상대적으로 덜 공개했다. 한편 [스케일링 법칙](#/p/scaling-laws) 원 논문과 [Chinchilla](#/p/chinchilla)는 서로 다른 최적 모델/데이터 배분 결론을 내놓았는데, 그 불일치의 원인이 정리되지 않은 채로 남아 있었다. 이 논문은 자신들이 직접 대규모 학습을 하기 **전에**, 왜 기존 연구들의 결론이 갈렸는지부터 재현 실험으로 규명하려 한다.',

ideas:[
 {h:'모델 크기 척도를 파라미터 수 대신 M(비임베딩 FLOPs/토큰)으로',
  lead:'어텐션 연산은 포함하고 임베딩·어휘 계산은 뺀 새 척도로 컴퓨팅 예산 근사 오차를 줄인다.',
  d:'기존에 쓰이던 비임베딩 파라미터 $N_1$([스케일링 법칙](#/p/scaling-laws))과 전체 파라미터 $N_2$([Chinchilla](#/p/chinchilla))는 둘 다 $6N$ 으로 컴퓨팅 예산을 근사하는데, 어텐션 연산 비용을 빼먹거나($6N_1$) 모델 용량에 기여가 적은 어휘 계산까지 포함해($6N_2$) 작은 모델일수록 최대 50%까지 오차가 났다. 이 논문은 $M = 72\\,n_{layer}d_{model}^2 + 12\\,n_{layer}d_{model}l_{seq}$ 로 어텐션 비용은 넣고 어휘 계산은 뺀 새 척도를 제안해, $C=MD$ 로 더 정확한 컴퓨팅 예산 계산식을 얻는다.'},
 {h:'하이퍼파라미터에도 스케일링 법칙이 있다',
  lead:'배치 크기·학습률의 최적값도 컴퓨팅 예산의 거듭제곱 함수로 미리 추정할 수 있다.',
  d:'본격적인 대규모 학습 전에, 작은 모델들로 컴퓨팅 예산에 따른 최적 배치 크기와 학습률의 관계를 먼저 피팅했다. 이 관계를 이용해 7B·67B 모델의 하이퍼파라미터를 사전에 정하고, 실제 대규모 학습에서 값비싼 하이퍼파라미터 탐색을 반복하지 않았다.'},
 {h:'IsoFLOP으로 재측정한 자체 계수는 Chinchilla와 다르다',
  lead:'a=0.524, b=0.476으로 측정 — Chinchilla의 a=0.49, b=0.51과 다른 배분비를 얻는다.',
  d:'[Chinchilla](#/p/chinchilla)와 같은 IsoFLOP 방법론을 그대로 따라 8개 컴퓨팅 예산($10^{17}\\sim3\\times10^{20}$)에서 곡선을 피팅했는데, 자체 데이터로는 $M_{opt}=0.1715\\cdot C^{0.5243}$, $D_{opt}=5.8316\\cdot C^{0.4757}$ 를 얻었다. 계수 자체가 데이터셋마다 달라진다는 것을 다음 아이디어에서 직접 보여준다.'},
 {h:'데이터 품질이 최적 모델/데이터 배분을 바꾼다',
  lead:'품질 좋은 데이터일수록 컴퓨팅 예산을 데이터보다 모델 크기 쪽에 더 써야 한다.',
  d:'초기 자체 데이터, 개선된 자체 데이터, OpenWebText2 세 데이터셋으로 각각 스케일링 계수를 다시 재보니, 품질이 좋아질수록(초기 데이터 → 현재 데이터 → OpenWebText2) 모델 크기 지수 $a$ 는 0.450→0.524→0.578로 커지고 데이터 지수 $b$ 는 0.550→0.476→0.422로 작아졌다. [스케일링 법칙](#/p/scaling-laws) 원 논문과 Chinchilla가 서로 다른 결론을 낸 이유가 **컴퓨팅 예산 근사 방식의 차이**뿐 아니라 **학습 데이터 품질의 차이**에도 있었다는 뜻이다.'},
 {h:'67B에는 GQA, 7B에는 MHA — 크기별로 다른 어텐션',
  lead:'큰 모델만 GQA로 바꿔 추론 비용을 줄이고, 레이어 수는 늘리되 폭은 좁혔다.',
  d:'7B는 30층·기존 Multi-Head Attention, 67B는 95층에 [GQA](#/p/gqa)를 적용했다. 파라미터 수를 단순히 폭(width)으로 키우는 대신 **깊이(레이어 수)를 늘리는 쪽**을 택했는데, 이는 LLaMA와 다른 구조적 선택이며 저자들은 이것이 67B의 추론 효율과 관련 있다고 설명한다.'}
],

diagram:{type:'compare', cap:'같은 IsoFLOP 방법론으로 얻은 계수가 데이터셋 품질에 따라 달라진다(원문 Table 4).',
 left:{t:'Chinchilla', items:['모델 지수 a = 0.49','데이터 지수 b = 0.51','두 축에 거의 균등 배분']},
 right:{t:'DeepSeek (현재 자체 데이터)', items:['모델 지수 a = 0.524','데이터 지수 b = 0.476','데이터 품질 개선 시 모델 쪽 배분 ↑']}
},

math:[
 {expr:'M = 72·n_layer·d_model² + 12·n_layer·d_model·l_seq',
  tex:'M = 72\\,n_{\\text{layer}}d_{\\text{model}}^{2} + 12\\,n_{\\text{layer}}d_{\\text{model}}l_{\\text{seq}}',
  d:'이 논문이 제안한 비임베딩 FLOPs/토큰 척도. 어텐션의 시퀀스 길이 의존 비용을 포함하되 어휘(vocabulary) 계산은 뺀다.'},
 {expr:'M_opt = 0.1715 · C^0.5243,   D_opt = 5.8316 · C^0.4757',
  tex:'M_{\\text{opt}} = 0.1715\\cdot C^{0.5243},\\qquad D_{\\text{opt}} = 5.8316\\cdot C^{0.4757}',
  d:'IsoFLOP 곡선으로 피팅한 자체 최적 모델/데이터 배분 공식. 컴퓨팅 예산 $C$ 가 주어지면 이 두 식으로 얼마나 큰 모델을, 얼마나 많은 토큰으로 학습할지 미리 계산한다.'}
],

numbers:[
 {k:'사전학습 데이터', v:'2조 토큰', d:'중국어·영어 위주, 지속적으로 확장 중이라고 명시'},
 {k:'모델 구성', v:'7B(30층) · 67B(95층, GQA)', d:'Table 2 — 67B만 Grouped-Query Attention 적용'},
 {k:'자체 스케일링 계수', v:'a=0.5243, b=0.4757', d:'IsoFLOP 재측정, Chinchilla(a=0.49, b=0.51)와 다름 — 데이터 품질 개선 시 a 증가·b 감소'},
 {k:'GSM8K (8-shot)', v:'DeepSeek 67B 63.4 vs LLaMA2-70B 58.4', d:'Table 5, base 모델 비교'},
 {k:'HumanEval (0-shot)', v:'DeepSeek 67B 42.7 vs LLaMA2-70B 28.7', d:'Table 5, base 모델 비교 — 코드 격차가 특히 큼'},
 {k:'MATH (4-shot)', v:'DeepSeek 67B 18.7 vs LLaMA2-70B 13.5', d:'Table 5, base 모델 비교'}
],

impact:'이 논문은 "왜 기존 스케일링 법칙 연구들이 서로 다른 결론을 냈는가"를 컴퓨팅 예산 근사 오차와 데이터 품질이라는 두 요인으로 분해해 설명했다는 점에서, 이후 대규모 학습에 앞서 **자체 데이터로 스케일링 법칙을 다시 측정하는 것**을 표준 관행으로 만드는 데 기여했다. 실제로 이 재측정된 법칙이 가리킨 7B/67B 구성으로 학습한 모델이 동시기 최고 공개 모델이던 LLaMA-2-70B를 코드·수학·추론에서 앞섰다는 점이 그 방법론의 실효성을 입증했다.',

legacy:[
 '[DeepSeekMoE](#/p/deepseek-moe)가 여기서 다진 밀집(dense) 아키텍처·데이터 파이프라인을 MoE 구조로 확장',
 '[DeepSeek-V2](#/p/deepseek-v2)의 MLA(Multi-head Latent Attention)가 이 논문의 GQA 채택 이후 KV 캐시 압축을 한 단계 더 밀어붙임',
 '[DeepSeek-Coder](#/p/deepseek-coder)가 같은 데이터·학습 인프라 계열 위에서 코드 특화 사전학습으로 갈라짐',
 '[GRPO](#/p/grpo)로 이어지는 추론 특화 강화학습 계열(DeepSeekMath → DeepSeek-R1)의 토대가 된 기반 모델 라인'
],

pitfalls:[
 '**스케일링 계수(a=0.524, b=0.476)는 DeepSeek 자체 데이터에서 측정된 값이다.** 데이터 품질이 다르면 계수도 달라진다는 것이 이 논문의 핵심 주장이므로, 이 숫자를 다른 데이터셋에 일반화해서 쓰면 안 된다.',
 '**"Chinchilla가 틀렸다"는 주장이 아니다.** 이 논문은 Chinchilla와 다른 결론이 근사 방식과 데이터 품질 차이에서 온다고 설명할 뿐, Chinchilla의 방법론 자체를 반박하지 않는다.',
 '**Table 5의 비교는 base 모델 기준이다.** SFT·DPO를 거친 DeepSeek Chat 모델과 GPT-3.5의 비교는 별도의 open-ended 평가이며 벤치마크 점수표와 직접 비교할 수 없다.'
],

figures:[
 {f:'fig4a-isoflop.png',
  cap:'x축은 비임베딩 FLOPs/토큰(M, 로그), y축은 검증셋 bits-per-byte. 색이 다른 각 곡선이 하나의 컴퓨팅 예산(1e17~3e20)이고, 곡선의 최저점이 그 예산에서의 최적 모델 크기다 — 예산이 커질수록(위에서 아래로) 최적점이 오른쪽 아래로 이동한다.',
  src:'원문 Figure 4(a), p.11'},
 {f:'fig5-perf-scaling.png',
  cap:'회색 점(작은 모델들)으로 피팅한 점선이 실제 7B·67B(파란 별)의 손실까지 정확히 예측한다는 것을 보여준다 — 작은 규모 실험으로 큰 모델의 성능을 미리 가늠할 수 있다는 근거.',
  src:'원문 Figure 5, p.11'}
],

quotes:[
 {t:'the scaling laws described in previous literature presents varying conclusions, which casts a dark cloud over scaling LLMs. We delve into the study of scaling laws and present our distinctive findings',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2401.02954 — DeepSeek LLM', u:'https://arxiv.org/abs/2401.02954'}
]
});
