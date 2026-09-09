WIKI.paper({
slug:'layernorm',
venue:'arXiv 2016 (NIPS 2016 Deep Learning Symposium)',
authors:'Jimmy Lei Ba, Jamie Ryan Kiros, Geoffrey Hinton (U. Toronto · Google)',
arxiv:'1607.06450',

tldr:'[batch normalization](#/p/batchnorm)의 통계를 **배치 방향이 아니라 특징 방향으로 90도 돌린** 것. 샘플 하나의 은닉 벡터 $H$ 차원만으로 평균과 분산을 내므로 배치 크기와 무관하고, 학습과 추론이 완전히 같은 계산이 된다. RNN과 [Transformer](#/p/transformer)가 BN 대신 이것을 쓰는 이유다.',

context:'BN은 CNN 학습을 바꿔놨지만 순환망에는 잘 붙지 않았다. 이유가 여럿이다. **(1) 시점마다 통계가 다르다** — RNN은 같은 가중치를 매 시점에 재사용하는데 $t$ 가 커질수록 합산 입력의 분포가 달라져, BN을 제대로 쓰려면 시점별로 별도 통계를 저장해야 한다. **(2) 가변 길이** — 배치 안 문장 길이가 제각각이라 긴 시점에는 통계를 낼 샘플이 몇 개 남지 않고, 학습 때 본 적 없는 길이가 추론에 들어오면 저장된 통계 자체가 없다. **(3) 배치 1이나 온라인 학습에서는 아예 성립하지 않는다.** 저자들의 관찰은 단순하다 — 정규화에 꼭 여러 샘플이 필요한 것은 아니다. **한 샘플 안의 여러 뉴런**으로 통계를 내면 된다.',

ideas:[
 {h:'정규화 축을 바꾼다: 배치 방향 → 특징 방향',
  lead:'같은 샘플의 H개 뉴런을 가로질러 평균 내 배치 의존성을 없앤다.',
  d:'BN은 채널 $c$ 를 고정하고 배치 $N$ 개 샘플을 가로질러 평균을 낸다. LN은 반대로 **샘플 $i$ 를 고정하고 그 층의 $H$ 개 뉴런을 가로질러** 평균과 분산을 낸다. 배치의 다른 샘플을 전혀 참조하지 않으므로 배치 크기 1도, 온라인 학습도, 길이가 뒤죽박죽인 시퀀스도 문제가 되지 않는다. 계산량은 벡터 하나의 평균/분산이라 사실상 공짜다.'},
 {h:'학습과 추론이 같은 함수다',
  lead:'이동평균 버퍼가 없어 학습과 추론이 완전히 동일하게 계산된다.',
  d:'BN은 학습 시 배치 통계, 추론 시 이동평균이라는 **두 개의 다른 함수**를 쓴다. 이 비대칭이 `model.eval()` 실수, 파인튜닝 시 통계 불일치, 배치 구성에 따라 예측이 흔들리는 문제의 원인이다. LN에는 이동평균 버퍼가 없다. 저장할 상태가 없으므로 학습/추론 모드 구분 자체가 필요 없고, 재현성이 보장된다.'},
 {h:'RNN의 은닉 상태 폭주/소멸을 억제한다',
  lead:'매 시점 스케일을 재조정해 은닉 상태의 지수적 드리프트를 막는다.',
  d:'표준 RNN은 시점이 진행될수록 합산 입력의 평균 크기가 지수적으로 커지거나 작아지는 경향이 있다. LN을 매 시점에 적용하면 은닉 상태의 스케일이 항상 재조정되므로 이 드리프트가 사라진다. 논문은 이를 **은닉 상태 동역학의 안정화**로 설명하며, 시점마다 독립적으로 통계를 내면 되므로 시점별 버퍼도 필요 없다.'},
 {h:'BN과 다른 불변성을 갖는다',
  lead:'가중치 전체 스케일링과 입력 이동에 불변한, BN과 다른 대칭성이다.',
  d:'논문은 세 정규화의 불변성을 표로 정리한다. LN은 **가중치 행렬 전체의 스케일링**과 **입력 데이터 전체의 이동(shift)**에 불변하지만, 개별 특징의 스케일 조정에는 BN처럼 불변하지 않는다. 즉 LN과 BN은 같은 것의 변주가 아니라 **서로 다른 대칭성을 모델에 부여하는 서로 다른 장치**다. 어느 쪽이 맞는지는 데이터의 축이 무엇을 의미하느냐에 달려 있다.'},
 {h:'CNN에서는 오히려 BN이 낫다 — 저자들이 직접 밝힌 한계',
  lead:'CNN은 유닛 간 통계 편차가 커서 LN이 BN에 미치지 못한다.',
  d:'논문 6.7절은 합성곱망 실험에서 LN이 정규화 없는 기준선보다는 낫지만 **BN에는 못 미친다**고 보고한다. 이유로는 완전연결층에서는 한 층의 유닛들이 대체로 비슷한 기여를 하는 반면, CNN에서는 이미지 경계 근처 수용영역을 가진 유닛들이 거의 활성화되지 않아 **같은 층 안에서도 통계가 크게 다르다**는 점을 든다. LN이 전 분야를 대체한 것이 아니라, 시퀀스라는 특정 조건에서 이겼다는 뜻이다.'}
],

diagram:{type:'compare', cap:'무엇을 가로질러 평균을 내는가. 이 한 가지 선택의 차이가 두 정규화의 성질을 거의 전부 결정한다.',
 left:{t:'BatchNorm: 배치 축으로 평균', items:[
  '채널마다 배치 N개를 가로질러 μ, σ',
  '배치가 작으면 통계 추정이 무너짐',
  '가변 길이 시퀀스에서 시점마다 표본 수가 다름',
  '추론용 이동평균 버퍼 필요 → 학습/추론 계산이 다름',
  'CNN에서는 여전히 가장 강력']},
 right:{t:'LayerNorm: 특징 축으로 평균', items:[
  '샘플마다 H개 뉴런을 가로질러 μ, σ',
  '배치 크기 1·온라인 학습도 동일하게 동작',
  '시퀀스 길이와 완전히 무관',
  '저장 상태 없음 → 학습/추론이 같은 함수',
  'RNN·Transformer의 표준']}},

math:[
 {expr:'μ = (1/H) Σ_{i=1..H} a_i,   σ = √( (1/H) Σ_{i=1..H} (a_i − μ)² )',
  tex:'\\mu = \\frac{1}{H}\\sum_{i=1}^{H} a_i, \\qquad \\sigma = \\sqrt{\\frac{1}{H}\\sum_{i=1}^{H} (a_i-\\mu)^2}',
  d:'$H$ 는 그 층의 뉴런 수. 합은 **배치가 아니라 은닉 차원**에 대해 이루어진다. 배치 안의 각 샘플이 자기만의 $\\mu,\\sigma$ 를 갖는다는 점이 BN과의 유일한 구조적 차이다.'},
 {expr:'y = g ⊙ (a − μ)/√(σ² + ε) + b',
  tex:'y = g \\odot \\frac{a-\\mu}{\\sqrt{\\sigma^2+\\varepsilon}} + b',
  d:'정규화 뒤 뉴런별 gain $g$ 와 bias $b$ 로 복원한다(BN의 $\\gamma,\\beta$ 에 대응). 파라미터는 층당 $2H$ 개.'},
 {expr:'RMSNorm:  y = g ⊙ a / √( (1/H) Σ a_i² )',
  tex:'y = g \\odot \\frac{a}{\\sqrt{\\frac{1}{H}\\sum_i a_i^2}}',
  d:'논문 이후 나온 경량 변형. 평균을 빼는 단계(re-centering)를 생략하고 스케일만 맞춘다. 성능은 거의 같은데 연산이 줄어 [LLaMA](#/p/llama) 이후 대부분의 오픈 LLM이 LayerNorm 대신 이것을 쓴다.'}
],

numbers:[
 {k:'통계 계산 축', v:'H개 뉴런 (1개 샘플)', d:'BN은 N개 샘플(1개 채널). 이 축 선택이 모든 차이의 원인'},
 {k:'추가 파라미터', v:'층당 2H개 (g, b)', d:'뉴런마다 gain·bias 하나씩'},
 {k:'추론용 저장 상태', v:'0', d:'BN의 running mean/var에 해당하는 버퍼가 없다'},
 {k:'배치 크기 의존성', v:'없음', d:'배치 1에서도 학습 때와 동일한 계산'},
 {k:'CNN 성능', v:'BN에 미달', d:'논문 6.7절이 직접 보고한 한계 — 기준선보다는 빠르지만 BN이 더 낫다'}
],

impact:'LN은 CNN에서 BN을 밀어내지 못했지만, **시퀀스 모델에서는 사실상 유일한 선택지**가 되었다. 이듬해 나온 [Transformer](#/p/transformer)가 모든 sublayer에 LN을 쓰면서 이 층은 현대 LLM의 필수 부품이 되었고, 결과적으로 오늘날 세상에서 가장 많이 실행되는 정규화 연산이 되었다. 더 넓게는 "정규화 = 배치 통계"라는 등식을 깨고, **어떤 축으로 통계를 낼 것인가**를 아키텍처 설계 변수로 만들었다. Instance Norm(샘플·채널별), Group Norm(채널 묶음별)은 모두 같은 축 선택 문제의 다른 답이다.',

legacy:[
 '**[Transformer](#/p/transformer)의 기본 부품** — attention과 FFN 각 sublayer마다 LN이 붙는다. 가변 길이 배치를 패딩해 처리하는 구조에서 BN은 애초에 쓸 수 없다',
 '**post-LN → pre-LN 이동** — 원 Transformer는 sublayer 뒤에 LN을 뒀으나 깊이 쌓으면 warm-up 없이 발산해, [GPT-2](#/p/gpt2) 이후 거의 모든 모델이 sublayer **앞**에 LN을 두는 pre-LN으로 바뀜',
 '**RMSNorm으로의 단순화** — 평균 빼기를 생략한 변형이 [LLaMA](#/p/llama)·[Mistral](#/p/mistral) 등 오픈 LLM의 표준이 됨',
 '**축 선택의 일반화** — Group Norm·Instance Norm, 그리고 이미지 생성의 AdaIN/adaLN([DiT](#/p/dit))처럼 정규화 파라미터를 조건 입력으로 생성하는 계열까지 확장'
],

pitfalls:[
 '**"LN이 BN의 개선판"이 아니다.** 두 방법은 서로 다른 불변성을 부여하며, 저자들 스스로 CNN에서는 BN이 낫다고 적었다. 시퀀스에는 LN, 이미지 분류에는 BN, 작은 배치의 검출·분할에는 Group Norm 식으로 조건에 따라 고르는 것이 맞다.',
 '**"Transformer가 LN을 쓰는 이유는 성능이 더 좋아서"가 아니다.** 1차 이유는 **구조적 제약**이다 — 배치 안 문장 길이가 다르고 패딩 위치가 섞여 있어 배치 축 통계 자체가 의미를 갖기 어렵고, 추론은 보통 배치 1의 토큰 단위 자기회귀다. 배치 차원에 의존하는 어떤 연산도 여기서는 쓸 수 없다.',
 '**LN의 위치가 성능을 좌우한다.** post-LN인지 pre-LN인지, RMSNorm인지에 따라 필요한 warm-up 길이와 안정적으로 쌓을 수 있는 깊이가 달라진다. 논문 그림을 그대로 옮기면 깊은 모델에서 학습이 발산할 수 있다.'
],

figures:[
 {f:'fig2-attentive-reader.png',
  cap:'Attentive reader 모델의 학습 곡선. x축이 학습 스텝(천 단위), y축이 검증 오류율. 네 가지 정규화 방식(LSTM=정규화 없음, BN-LSTM, BN-everywhere, LN-LSTM) 중 LN-LSTM(하늘색)이 가장 먼저, 가장 가파르게 떨어진다 — mini-batch 크기에 의존하는 BN과 달리 LN은 RNN에서도 안정적으로 빠르게 수렴한다는 주장의 근거.',
  src:'원문 Figure 2, p.7'}
],

quotes:[
 {t:'In this paper, we transpose batch normalization into layer normalization by computing the mean and variance used for normalization from all of the summed inputs to the neurons in a layer on a single training case.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1607.06450 — Layer Normalization', u:'https://arxiv.org/abs/1607.06450'},
 {t:'arXiv 1910.07467 — Root Mean Square Layer Normalization (RMSNorm)', u:'https://arxiv.org/abs/1910.07467'},
 {t:'arXiv 2002.04745 — On Layer Normalization in the Transformer Architecture (pre-LN)', u:'https://arxiv.org/abs/2002.04745'}
]
});
