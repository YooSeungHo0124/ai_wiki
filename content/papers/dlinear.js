WIKI.paper({
slug:'dlinear',
venue:'AAAI 2023',
authors:'Zeng, Chen, Zhang, Xu (中国科学院大学 · Alibaba)',
arxiv:'2205.13504',

tldr:'[Informer](#/p/informer)·[Autoformer](#/p/autoformer)를 비롯한 "복잡한 Transformer 시계열 모델"들을, **선형 레이어 하나(LTSF-Linear)** 가 9개 벤치마크 대부분에서 20~50% 앞선다는 것을 실증한 논문. 어텐션이 시계열에서 실제로 순서 정보를 얼마나 쓰는지 직접 검증해 "쓰지 않는다"는 답을 냈다.',

context:'[Informer](#/p/informer)의 ProbSparse, [Autoformer](#/p/autoformer)의 Auto-Correlation처럼 2020~2021년 사이 장기 시계열 예측(LTSF) 분야는 "attention을 어떻게 더 정교하게 만들 것인가"라는 방향으로 빠르게 복잡해졌다. 그런데 이 논문의 저자들은 근본적인 질문을 던진다 — self-attention은 본질적으로 **순열 불변(permutation-invariant)** 연산이다. 토큰 순서를 섞어도 attention 가중치 계산 자체는 바뀌지 않고, 위치/시간 임베딩을 더해 순서를 흉내낼 뿐이다. 그런데 시계열 예측은 순서(시간 흐름) 자체가 핵심 신호다. "정교한 attention 근사들이 실은 순서 정보를 제대로 못 쓰면서 정확도만 자랑하고 있는 것 아닌가"가 이 논문의 출발점이다.',

ideas:[
 {h:'LTSF-Linear: 한 층의 선형 회귀가 베이스라인',
  lead:'과거 L 스텝을 입력받아 미래 T 스텝을 한 번에 내는 가중치 행렬 하나가 전부다.',
  d:'$\\hat X_i = W X_i$, $W \\in \\mathbb{R}^{T\\times L}$. 변수(variate)마다 가중치를 공유하고 변수 간 상관관계는 전혀 모델링하지 않는, 정말로 "한 줄"짜리 모델이다. 그런데 이 모델이 direct multi-step(DMS) 방식으로 $T$ 스텝을 한 번에 예측한다는 점은 최근 Transformer 계열과 동일하다 — 저자들은 최근 성능 향상의 상당 부분이 attention이 아니라 이 **DMS 전략 자체** 덕분이라 가설을 세운다.',
  },
 {h:'DLinear: Autoformer의 분해를 선형층 두 개에',
  lead:'이동평균으로 추세·계절성을 나눈 뒤 각각 독립된 선형층에 통과시켜 더한다.',
  d:'[Autoformer](#/p/autoformer)와 [FEDformer](https://arxiv.org/abs/2201.12740)가 쓰는 이동평균 분해를 그대로 가져와 입력을 추세 성분과 나머지(계절성) 성분으로 나누고, 각각에 별도의 1층 선형모델을 적용한 뒤 결과를 더한다. attention 없이 분해 아이디어만 남긴 구성이며, 추세가 뚜렷한 데이터셋(Electricity, Traffic 등)에서 Linear보다 낫다.'},
 {h:'NLinear: 마지막 값을 빼고 더하는 정규화',
  lead:'입력에서 마지막 시점 값을 빼 선형층에 넣고 예측 후 다시 더해 분포 이동(distribution shift)에 대응한다.',
  d:'테스트 구간의 값 범위가 학습 구간과 달라지는 분포 이동 문제에 대응하기 위해, 입력 시퀀스의 마지막 값을 기준으로 감산·가산하는 아주 단순한 정규화만 추가한다. Exchange-Rate처럼 변동성이 큰 금융 데이터에서 이 정규화 하나가 큰 폭의 개선을 만든다.'},
 {h:'입력을 섞어서 "정말 순서를 쓰는가"를 검증',
  lead:'입력 시퀀스를 무작위로 섞거나 앞뒤 절반을 바꿔치기해도 Transformer 계열의 정확도가 거의 떨어지지 않는다는 것을 보인다.',
  d:'Exchange-Rate 데이터에서 입력을 통째로 랜덤 셔플(Shuf.)해도 FEDformer·Autoformer·Informer의 MSE는 원본과 거의 같다(평균 하락 -0.09%~1.12%, 즉 사실상 무변화). 반면 LTSF-Linear는 셔플 시 27~47% 성능이 떨어진다 — **역설적으로 이는 Linear가 순서를 실제로 학습해 쓰고 있고, Transformer 계열은 애초에 순서를 별로 쓰지 않고 있었다**는 뜻이다.'}
],

diagram:{type:'compare', cap:'같은 문제(장기 시계열 예측)에 대한 두 진영의 답. 저자들은 왼쪽의 복잡성 상당수가 실제로는 불필요하다고 주장한다.',
 left:{t:'LTSF-Transformer 계열', items:['position/timestamp 임베딩 필요','정교한 attention 근사(ProbSparse 등)','파라미터·연산량 크고 학습 느림']},
 right:{t:'LTSF-Linear', items:['가중치 행렬 하나(선형 회귀)','분해+정규화만 추가','9개 중 대부분서 SOTA 능가']}
 },

math:[
 {expr:'X̂_i = W X_i,  W ∈ R^{T×L}',
  tex:'\\hat X_i = W X_i, \\qquad W \\in \\mathbb{R}^{T\\times L}',
  d:'LTSF-Linear의 전부. 과거 길이 $L$, 예측 길이 $T$ 사이를 잇는 단일 선형 변환이며 변수 $i$ 마다 같은 $W$ 를 공유한다.'},
 {expr:'X̂ = Linear(X_trend) + Linear(X_seasonal),  X_trend = AvgPool(Padding(X))',
  tex:'\\hat X = \\text{Linear}(X_{\\text{trend}}) + \\text{Linear}(X_{\\text{seasonal}}), \\qquad X_{\\text{trend}} = \\text{AvgPool}(\\text{Padding}(X))',
  d:'DLinear의 구조. [Autoformer](#/p/autoformer)와 동일한 이동평균 분해를 쓰되, 그 뒤에 attention 대신 선형층 두 개만 둔다.'}
],

numbers:[
 {k:'평균 개선폭', v:'20~50%', d:'9개 벤치마크 멀티변량 예측에서 LTSF-Linear가 당시 SOTA인 FEDformer 대비 (Table 2, 초록)'},
 {k:'Exchange-Rate MSE (horizon 96/720, Linear)', v:'0.140 / 0.203', d:'FEDformer 0.193/0.246, Autoformer 0.201/0.254 대비 낮음 (Table 2)'},
 {k:'ETTh2 MSE (horizon 96, DLinear)', v:'0.289', d:'Informer 3.755, Autoformer 0.358 대비 큰 격차 (Table 2)'},
 {k:'셔플 시 평균 성능 하락 (ETTh1, Shuf.)', v:'Linear 81.06% vs Autoformer 56.91% vs Informer 1.98%', d:'입력을 랜덤 셔플했을 때 MSE 상승폭(Table 5) — Linear가 가장 크게 떨어진다는 것은 원래 순서 정보를 가장 많이 쓰고 있었다는 뜻'},
 {k:'셔플 시 평균 성능 하락 (Exchange, Shuf.)', v:'Linear 27.26% vs FEDformer -0.09% vs Autoformer 0.09%', d:'Transformer 계열은 입력을 섞어도 사실상 변화 없음(Table 5) — 순서를 거의 안 쓰고 있었다는 근거'},
 {k:'파라미터/추론 속도 (DLinear)', v:'139.7K parameter · 0.4ms', d:'Table 8, Transformer 계열 대비 훨씬 가볍고 빠름'}
],

impact:'"복잡한 아키텍처가 곧 발전"이라는 당시 LTSF 분야의 관성에 실험 하나로 제동을 걸었다. 이 논문 이후 시계열 Transformer 논문들은 **선형 베이스라인을 반드시 비교 대상으로 넣는 것이 표준**이 되었고, "attention이 시계열에서 실제로 무엇을 하는가"를 검증하지 않은 채 SOTA를 주장하는 관행에 경종을 울렸다. 동시에 이 논문 자체가 [PatchTST](#/p/patchtst)의 직접적인 반박 대상이 되며 "그렇다면 attention을 제대로 쓰면 어떻게 되는가"라는 다음 질문을 촉발했다.',

legacy:[
 '**LTSF 분야의 필수 베이스라인화** — 이후 논문은 거의 예외 없이 Linear/DLinear/NLinear를 비교 대상에 포함시킴',
 '**[PatchTST](#/p/patchtst)의 직접적인 반박 대상이자 출발점** — "attention이 순서를 못 쓴다"는 지적을 패치 단위 입력 + 채널 독립으로 정면 돌파하며 Transformer 계열을 부활시킴',
 '**실험 설계에 대한 경각심 확산** — "셔플 테스트"처럼 모델이 실제로 주장하는 메커니즘을 쓰고 있는지 검증하는 소거 실험이 이후 시계열 논문의 관행이 됨',
 '**분해 아이디어의 재확인** — Autoformer의 이동평균 분해가 attention 없이도 유효하다는 것을 보여, 분해 자체는 계속 쓰이는 부품으로 남음'
],

pitfalls:[
 '**"Transformer가 시계열에 항상 나쁘다"는 과장이다.** 이 논문의 결론은 "당시 벤치마크·설정에서 검증된 Transformer 변형들이 순서 정보를 효과적으로 못 썼다"는 것이지, attention 자체가 시계열에 원리적으로 부적합하다는 증명이 아니다 — [PatchTST](#/p/patchtst)가 반례를 보인다.',
 '**LTSF-Linear는 변수 간 상관관계를 전혀 모델링하지 않는다.** 변수 수가 많고 서로 강하게 얽힌 데이터(다변량 상호작용이 중요한 경우)에서는 이 단순함이 오히려 한계가 될 수 있다.',
 '**Exchange-Rate에서 naive Repeat(마지막 값 반복)이 모든 Transformer를 이긴다는 결과(약 45% 우위)를 "Transformer가 못 배운다"로만 읽으면 안 된다.** 저자들은 이를 Transformer가 학습 데이터의 급격한 변화(노이즈)에 과적합해 추세를 잘못 예측하기 때문이라고 설명한다 — 데이터 특성(금융 시계열의 낮은 예측가능성)의 영향도 크다.'
],

figures:[
 {f:'fig1-pipeline.png',
  cap:'기존 Transformer 기반 LTSF 방법들의 공통 파이프라인. (c) 인코더에서 각 논문(LogTrans/Informer/Autoformer/Pyraformer/FEDformer)이 서로 다른 방식으로 self-attention을 근사·대체하지만, 저자들은 이 복잡성 대부분이 (b)의 위치/시간 임베딩에 기대고 있어 순서 정보를 온전히 살리지 못한다고 지적한다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig2-linear.png',
  cap:'LTSF-Linear의 전부. 과거 L 스텝(아래 원)의 각 시점이 미래 스텝(위 원) 각각으로 완전연결(가중치 행렬 W)되는 것이 유일한 연산이다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'The premise of Transformer models is the semantic correlations between paired elements, while the self-attention mechanism itself is permutation-invariant, and its capability of modeling temporal relations largely depends on positional encodings associated with input tokens.',
  src:'Section 3, p.3'},
 {t:'Surprisingly, the performance of LTSF-Linear surpasses the SOTA FEDformer in most cases by 20% ~ 50% improvements on the multivariate forecasting, where LTSF-Linear even does not model correlations among variates.',
  src:'Section 5.2, p.4'}
],

links:[
 {t:'arXiv 2205.13504 — Are Transformers Effective for Time Series Forecasting?', u:'https://arxiv.org/abs/2205.13504'},
 {t:'공식 코드 (cure-lab/LTSF-Linear)', u:'https://github.com/cure-lab/LTSF-Linear'}
]
});
