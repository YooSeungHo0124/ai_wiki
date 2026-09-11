WIKI.concept({
slug:'normalization',

tldr:'층의 활성값을 어떤 축을 기준으로 평균 0·분산 1로 맞춘 뒤 학습 가능한 스케일·이동을 다시 적용하는 신경망 층.',

why:'BatchNorm, LayerNorm, InstanceNorm, GroupNorm, RMSNorm 은 전부 "정규화 층"이라 뭉뚱그려지지만 평균·분산을 **어느 축으로 계산하느냐**만 다르고 그 선택이 배치 크기 의존성, 시퀀스 길이 의존성, 스타일 정보 보존 여부를 완전히 바꾼다. CNN 에 기본이던 BatchNorm 을 Transformer 에 그대로 쓰면 왜 잘 안 되는지, LayerNorm 을 블록의 앞에 두느냐 뒤에 두느냐가 왜 대형 모델 학습 안정성을 가르는지를 모르면 구조를 그대로 베낄 뿐 왜 그렇게 생겼는지 설명할 수 없다.',

sections:[
 {h:'정규화 층 vs 정칙화 vs 전처리 표준화', d:'세 가지가 자주 섞인다. ① 정규화 층(normalization layer, 이 글)은 신경망 중간의 활성값을 매 forward 마다 재조정하는 층이다. ② [정칙화](#/c/regularization)(regularization)는 과적합을 줄이는 기법군으로 목적 자체가 다르다 — 한국어가 겹쳐서 생기는 혼동은 [정칙화](#/c/regularization) 문서에서 정면으로 다룬다. ③ 입력 데이터 표준화(standardization, 전처리)는 학습 시작 전 데이터셋 전체 통계로 **한 번** 입력을 정규화하는 것이고, 정규화 층은 학습 내내 **매 스텝, 중간 표현**에 대해 반복하는 것이다. 표준화는 전처리 파이프라인에, 정규화 층은 모델 구조 안에 있다.'},
 {h:'무엇을 기준으로 평균·분산을 내는가', d:'입력을 (배치 N, 채널 C, 공간/시퀀스 위치)로 생각하면 차이가 명확해진다. **BatchNorm** 은 같은 채널을 배치 전체와 공간 위치에 걸쳐 통계를 낸다 — 배치가 클수록 추정이 안정적이지만 배치 크기에 성능이 의존하고 추론 때는 학습 중 이동평균을 따로 저장해 써야 한다. **LayerNorm** 은 배치·시퀀스 축은 그대로 두고 한 샘플의 한 위치 안에서 채널 축으로 통계를 낸다 — 배치 크기와 무관하고 시퀀스 길이가 가변적인 텍스트에 적합하다. **InstanceNorm** 은 샘플 하나, 채널 하나 안에서 공간 축으로만 통계를 낸다 — 이미지 스타일(전체 명암·대비)을 지워 스타일 변환에 쓰인다. **GroupNorm** 은 채널을 몇 개 그룹으로 묶어 그룹 안에서 통계를 내 배치 크기가 아주 작을 때(검출·분할처럼 고해상도라 배치를 못 키우는 경우) BatchNorm 을 대체한다. **RMSNorm** 은 평균을 빼는 과정 없이 분산(정확히는 제곱평균)만으로 스케일을 맞춰 LayerNorm 보다 계산이 가볍다 — 대형 LLM 이 많이 채택했다.'},
 {h:'왜 Transformer 는 LayerNorm 인가', d:'Transformer 는 시퀀스 길이가 문장마다 다르고, 추론 시 배치 크기가 1인 경우(생성 중 토큰 하나씩)가 흔하다. BatchNorm 은 배치 안의 다른 샘플들에 의존해 통계를 내므로 이런 상황에서 불안정하다. LayerNorm 은 한 샘플, 한 토큰 안에서만 통계를 내기 때문에 배치 구성이나 시퀀스 길이와 무관하게 항상 같은 방식으로 동작한다. 이 배치 독립성이 가변 길이 시퀀스를 다루는 구조에 잘 맞아 [Transformer](#/p/transformer) 이후 사실상 표준이 됐다.'},
 {h:'Pre-LN vs Post-LN', d:'원 Transformer 논문은 sublayer 출력 뒤에 LayerNorm 을 두는 Post-LN 을 썼다 — 잔차 경로 자체가 정규화되어 표현력은 좋지만, 층이 깊어질수록 기울기가 불안정해져 warmup 을 세심하게 조정해야 학습이 된다. Pre-LN 은 sublayer 에 들어가기 **전**에 LayerNorm 을 적용하고 잔차 연결은 정규화되지 않은 값을 그대로 더한다 — 잔차 경로가 항등에 가까워 기울기가 층을 그대로 통과하므로 warmup 없이도, 더 깊게도 안정적으로 학습된다. 그 대가로 표현력이 약간 떨어질 수 있어 깊은 층 수가 그 손실을 상쇄한다. GPT 계열을 포함한 대부분의 현대 대형 모델이 Pre-LN 을 쓰는 이유다.'}
],

math:[
 {expr:'y = γ · (x − μ)/√(σ² + ε) + β',
  tex:'y = \\gamma \\cdot \\frac{x-\\mu}{\\sqrt{\\sigma^2+\\varepsilon}} + \\beta',
  d:'모든 정규화 층이 공유하는 형태다. $\\mu,\\sigma^2$ 을 계산하는 축(배치/채널/공간 중 무엇을 평균 내는가)만 층마다 다르다. $\\gamma,\\beta$ 는 학습되는 스케일·이동 파라미터로, 정규화가 표현력을 해치지 않도록 원래 스케일을 되살릴 여지를 준다.'},
 {expr:'RMSNorm:  y = γ · x / √(mean(x²) + ε)',
  tex:'y = \\gamma \\cdot \\dfrac{x}{\\sqrt{\\mathrm{mean}(x^2)+\\varepsilon}}',
  d:'평균을 빼는(재중심화) 단계가 없다 — 분산 안정화만으로 충분히 효과가 있다는 관찰에서 나왔다. 평균 계산이 빠져 LayerNorm 보다 연산이 적다.'}
],

diagram:{type:'compare', cap:'같은 LayerNorm 을 sublayer 앞에 두느냐 뒤에 두느냐가 학습 안정성을 가른다.',
 left:{t:'Post-LN (원 논문)', items:[
  '잔차 후 LayerNorm 적용',
  '표현력 좋지만 깊을수록 불안정',
  'warmup 을 세심히 조정해야 함']},
 right:{t:'Pre-LN (GPT 계열)', items:[
  'sublayer 진입 전 LayerNorm',
  '잔차 경로가 항등에 가까움',
  'warmup 덜 민감, 더 깊게 안정적']}},

confuse:[
 {a:'정규화 층(normalization)', b:'정칙화(regularization)', d:'한국어로 둘 다 "정규화"로 옮겨지지만 목적이 다르다. 정규화 층은 활성값 분포를 안정시켜 학습을 빠르게 하고, 정칙화는 과적합을 줄인다. 자세히는 [정칙화](#/c/regularization) 문서.'},
 {a:'입력 표준화(전처리)', b:'정규화 층', d:'전처리 표준화는 학습 시작 전 데이터셋 통계로 입력을 한 번 맞추는 것이고, 정규화 층은 모델 내부에서 매 forward 마다 중간 활성값을 다시 맞추는 것이다.'},
 {a:'BatchNorm', b:'LayerNorm', d:'BatchNorm 은 배치·공간 축으로, LayerNorm 은 채널 축으로 통계를 낸다. 배치 크기에 의존하느냐 아니냐가 실무에서 가장 크게 갈리는 지점이다.'},
 {a:'LayerNorm', b:'RMSNorm', d:'RMSNorm 은 평균을 빼는 재중심화 단계를 생략하고 스케일만 맞춘다 — 성능은 비슷하면서 연산이 가벼워 대형 LLM 에서 LayerNorm 을 대체하는 경우가 늘고 있다.'}
],

pitfalls:[
 '배치 크기가 아주 작으면(검출·분할처럼 고해상도 입력 때문에) BatchNorm 의 배치 통계 추정이 부정확해져 성능이 떨어진다 — 이때는 GroupNorm 이 대안이다.',
 'BatchNorm 은 학습 모드와 추론 모드에서 다르게 동작한다(추론은 이동평균 사용). eval 모드 전환을 빼먹으면 조용히 성능이 나빠진다.',
 'Post-LN Transformer 를 warmup 없이 학습시키면 초반에 발산하기 쉽다 — Pre-LN 이면 이 문제가 훨씬 덜하다.',
 '정규화 층을 넣었다고 정칙화(과적합 억제)가 된다고 기대하면 안 된다 — BatchNorm 의 부수적 정칙화 효과는 미니배치 노이즈에서 오는 약한 것이지 본래 목적이 아니다.'
],

papers:['batchnorm','layernorm','instance-norm'],
terms:['regularization','residual','transformer-block','gradient-problem']
})
