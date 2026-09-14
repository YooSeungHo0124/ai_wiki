WIKI.concept({
slug:'layernorm-c',

tldr:'LayerNorm 은 한 샘플의 feature 축을 따라, BatchNorm 은 같은 채널의 배치 축을 따라 평균·분산을 낸다는 차이 하나가 배치 크기 의존성과 추론 시 동작을 모두 가른다.',

why:'[normalization](#/c/normalization)이 왜 필요한지는 일반론이지만, "어느 축으로 평균을 내는가"를 놓치면 왜 Transformer 는 LayerNorm 을 쓰고 CNN 은 BatchNorm 을 쓰는지, 왜 배치 크기 1로 추론해도 LayerNorm 은 멀쩡한데 BatchNorm 은 망가지는지를 설명할 수 없다. 시퀀스 길이가 가변인 NLP 에서 BatchNorm 을 그대로 쓰면 왜 통계가 불안정해지는지도 이 축 차이에서 나온다.',

sections:[
 {h:'같은 목적, 다른 축', d:'입력 텐서를 (batch, feature) 또는 (batch, sequence, feature) 로 생각하면, [BatchNorm](#/p/batchnorm)은 **하나의 feature(채널)를 고정하고 배치 전체(그리고 CNN 이면 공간 축까지)**에 걸쳐 평균·분산을 낸다 — 즉 "이 채널이 배치 안에서 평균 0, 분산 1이 되게" 정규화한다. [LayerNorm](#/p/layernorm)은 반대로 **하나의 샘플(토큰 하나)을 고정하고 그 샘플의 feature 축 전체**에 걸쳐 평균·분산을 낸다 — "이 토큰의 표현 벡터가 평균 0, 분산 1이 되게" 정규화한다. 수식의 형태($\\gamma\\hat x+\\beta$)는 똑같고 **어느 축으로 통계를 내는가**만 다르다.'},
 {h:'배치 크기 의존성', d:'BatchNorm 의 평균·분산은 배치 안의 다른 샘플들에 의존한다. 배치 크기가 작으면(예: 2~4) 이 통계 추정이 노이즈가 심해져 학습이 불안정해지고, 배치 크기가 1이면 분산이 정의조차 안 된다. LayerNorm 은 한 샘플 안에서만 통계를 내므로 배치 크기와 무관하다 — 배치 크기 1로 학습하든 추론하든, 문장 길이가 매번 바뀌든 계산이 그대로 성립한다. 가변 길이 시퀀스를 다루는 RNN·Transformer 에서 LayerNorm 이 표준이 된 이유가 이것이다.'},
 {h:'추론 시 동작 차이', d:'BatchNorm 은 학습 중 미니배치마다 계산한 평균·분산을 지수이동평균(EMA)으로 누적해 **running mean/running var** 로 저장해 두고, 추론(eval mode)에서는 현재 배치 통계 대신 이 저장된 이동평균을 사용한다. 그래서 배치 크기 1로 추론해도 문제가 없다 — 통계를 그 배치에서 다시 구하지 않기 때문이다. 이는 동시에 함정이기도 하다: `model.train()`/`model.eval()` 모드를 잘못 두면 BatchNorm 은 완전히 다른 통계를 쓰게 되어 결과가 크게 달라진다. LayerNorm 은 애초에 배치 통계를 쓰지 않으므로 이동평균을 따로 유지할 필요가 없고, 학습과 추론에서 정확히 같은 연산을 한다 — train/eval 모드 차이가 없다(단, Dropout 등 다른 층은 여전히 영향을 받는다).'},
 {h:'RMSNorm 이 뺀 것', d:'RMSNorm 은 LayerNorm 의 정규화 효과 중 **분산을 1로 맞추는 스케일링만 남기고 평균을 0으로 맞추는 재중심화(recentering, $-\\mu$)를 뺀다.** $\\text{RMSNorm}(x)=\\dfrac{x}{\\text{RMS}(x)}\\odot\\gamma$, $\\text{RMS}(x)=\\sqrt{\\frac1d\\sum_i x_i^2}$ 로, 평균을 빼는 대신 제곱평균제곱근만으로 나눈다. 저자들의 주장은 LayerNorm 의 효과 대부분이 재중심화가 아니라 재스케일링(re-scaling)에서 온다는 것이고, 평균 계산과 편향(bias) 항을 빼면 연산이 줄어 LLaMA·PaLM 등 대형 LLM 이 학습 속도를 위해 채택했다.'},
 {h:'실무에서', d:'CNN 계열(ResNet, EfficientNet)은 여전히 BatchNorm 이 기본이고, 배치가 너무 작아지는 상황(고해상도 이미지, 멀티 GPU 분산으로 GPU 당 배치가 작아지는 경우)에서는 GroupNorm 처럼 배치에 의존하지 않는 대안으로 바꾸는 것이 흔한 처방이다. Transformer·LLM 계열은 거의 예외 없이 LayerNorm 또는 RMSNorm 이고, 최신 대형 모델(LLaMA, Mistral 계열)은 속도 때문에 RMSNorm 쪽으로 많이 넘어갔다. eval() 을 빼먹고 BatchNorm 모델을 추론했는데 출력이 이상하다면 가장 먼저 의심할 것이 바로 이 train/eval 모드다.'}
],

math:[
 {tex:'\\text{BN}(x)_{n,c}=\\gamma_c\\cdot\\dfrac{x_{n,c}-\\mu_c}{\\sqrt{\\sigma_c^2+\\epsilon}}+\\beta_c,\\qquad \\mu_c,\\sigma_c^2 \\ \\text{는 배치(및 공간) 축 평균}',
  expr:'BatchNorm', d:'채널 $c$ 하나를 고정하고 배치(그리고 CNN 이면 공간 위치)에 걸쳐 $\\mu_c,\\sigma_c^2$ 를 구한다. 학습 때는 매 배치마다 새로 구하고, 추론 때는 학습 중 EMA 로 누적한 값을 고정해서 쓴다.'},
 {tex:'\\text{LN}(x)_n=\\gamma\\odot\\dfrac{x_n-\\mu_n}{\\sqrt{\\sigma_n^2+\\epsilon}}+\\beta,\\qquad \\mu_n,\\sigma_n^2 \\ \\text{는 샘플 } n\\text{ 의 feature 축 평균}',
  expr:'LayerNorm', d:'샘플(토큰) $n$ 하나를 고정하고 그 feature 벡터 전체에 걸쳐 $\\mu_n,\\sigma_n^2$ 를 구한다. 배치의 다른 샘플과 무관하므로 학습·추론에서 동일한 연산이다.'}
],

diagram:{type:'compare', cap:'같은 텐서에서 평균·분산을 내는 축이 다르다.',
 left:{t:'BatchNorm', items:['채널 고정, 배치·공간 축 평균','배치 크기에 의존','추론 시 EMA 통계 사용','train/eval 동작 다름']},
 right:{t:'LayerNorm', items:['샘플 고정, feature 축 평균','배치 크기 무관','추론 시도 즉석 계산','train/eval 동작 동일']}},

confuse:[
 {a:'normalization(정규화)', b:'regularization(정규화)', d:'한국어로 둘 다 "정규화"라 옮겨지지만 다른 개념이다. normalization 은 [BatchNorm](#/p/batchnorm)·LayerNorm 처럼 활성값의 분포를 안정시키는 기법이고, regularization 은 dropout·weight decay 처럼 과적합을 막는 기법이다.'},
 {a:'LayerNorm', b:'InstanceNorm', d:'InstanceNorm 은 BatchNorm 과 LayerNorm 사이에 있다 — 채널도 고정하고 샘플도 고정한 채 공간 축(H,W)만으로 평균을 낸다. 스타일 정보가 채널별 통계에 실린다고 보는 스타일 변환(style transfer) 계열에서 주로 쓴다.'},
 {a:'LayerNorm', b:'RMSNorm', d:'RMSNorm 은 LayerNorm 에서 평균을 빼는 재중심화 단계를 없애고 제곱평균제곱근(RMS)으로 나누는 재스케일링만 남긴 경량 버전이다. 편향 항도 보통 없앤다.'},
 {a:'Pre-LN', b:'Post-LN', d:'이건 LayerNorm 자체의 정의가 아니라 **어디에 배치하는가**의 문제다 — 자세한 비교는 [Pre-LN vs Post-LN](#/c/prenorm-postnorm) 참고.'}
],

pitfalls:[
 'BatchNorm 을 배치 크기 1~2로 학습하면서 "왜 학습이 불안정하지"라고 묻기 전에, 배치 통계 자체가 노이즈라는 것부터 의심해야 한다.',
 'BatchNorm 모델을 배포할 때 eval() 모드로 전환하는 것을 잊으면, 추론 배치의 실시간 통계를 쓰게 되어 학습 때와 다른 결과가 나온다 — 특히 배치 크기가 작을수록 티가 크게 난다.',
 'LayerNorm 이 "배치 정규화의 배치 버전"이라고 생각하면 안 된다 — 평균·분산을 내는 축이 다른 것이지, 배치를 샘플 하나로 줄인 BatchNorm 이 아니다.'
],

papers:['layernorm','batchnorm'],
terms:['normalization','prenorm-postnorm','residual','gradient-problem']
});
