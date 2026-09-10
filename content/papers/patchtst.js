WIKI.paper({
slug:'patchtst',
venue:'ICLR 2023',
authors:'Nie, Nguyen, Sinthong, Kalagnanam (Princeton · IBM Research)',
arxiv:'2211.14730',

tldr:'[DLinear](#/p/dlinear)의 "attention은 시계열에 안 맞는다"는 비판을 받아들이면서도, **패치 단위 입력 + 채널 독립(channel-independence)** 으로 설계를 바꿔 Transformer를 되살린 논문. [ViT](#/p/vit)의 패치 아이디어를 시계열에 이식했고, 실제로 DLinear를 원문 수치로 다시 앞섰다.',

context:'[DLinear](#/p/dlinear)는 [Informer](#/p/informer)·[Autoformer](#/p/autoformer) 같은 Transformer 계열이 순열 불변 attention 때문에 시간 순서 정보를 제대로 못 쓴다는 것을 셔플 테스트로 보이며, 선형 모델 하나로 이들을 능가했다. 이 논문의 저자들은 그 진단 자체는 받아들이되, 원인을 다르게 짚는다 — 문제는 attention이라는 연산 자체가 아니라, **개별 시점 하나를 토큰으로 쓰는 입력 방식**이다. 낱개 시점은 그 자체로 의미 있는 의미 단위(semantic unit)가 아니고, 주변 맥락 없이는 국소 패턴(예: 상승·하강 구간)을 전혀 표현하지 못한다. [ViT](#/p/vit)가 이미지 픽셀 대신 16×16 패치를 토큰으로 써서 성공했던 것처럼, 시계열도 점이 아니라 구간(patch)을 토큰으로 삼으면 attention이 제대로 작동할 수 있다는 것이 이 논문의 가설이다.',

ideas:[
 {h:'서브시리즈 패치를 입력 토큰으로',
  lead:'길이 P짜리 겹치는(또는 안 겹치는) 구간을 하나의 토큰으로 묶어 시퀀스 길이를 L/S로 줄인다.',
  d:'길이 $L$ 인 시계열을 패치 길이 $P$, 스트라이드 $S$ 로 잘라 $N \\approx L/S$ 개의 패치를 만들고, 각 패치를 선형 투영해 하나의 토큰으로 쓴다. 토큰 수가 $L$ 에서 $L/S$ 로 줄어 attention 복잡도가 제곱으로 감소하고, 동시에 각 토큰이 국소 추세·변화 패턴을 담은 의미 단위가 된다.'},
 {h:'채널 독립: 변수마다 완전히 독립된 forward',
  lead:'다변량 시계열의 각 변수를 같은 가중치를 공유하는 별개의 단변량 시계열로 처리한다.',
  d:'입력 $x \\in \\mathbb{R}^{M\\times L}$ 의 $M$ 개 채널을 하나로 섞어 넣는(channel-mixing) 기존 방식 대신, 채널마다 독립적으로 같은 Transformer backbone을 통과시킨 뒤 결과만 이어 붙인다($\\hat x^{(i)} \\in \\mathbb{R}^{1\\times T}$, $i=1,\\dots,M$). 채널 간 정보 누출 없이 각 단변량 시계열이 자기 자신의 과거만 보고 예측하므로 과적합이 줄고, 서로 다른 스케일의 변수를 억지로 한 표현공간에 밀어넣지 않아도 된다.'},
 {h:'긴 lookback window를 그대로 감당',
  lead:'패치로 토큰 수를 줄인 덕분에 과거 512스텝처럼 훨씬 긴 lookback을 계산 비용 안에서 쓸 수 있다.',
  d:'토큰 단위가 시점이면 lookback을 늘릴수록 시퀀스 길이·attention 비용이 그대로 늘어 실무적으로 짧게 자를 수밖에 없었다. 패치는 스트라이드만큼 토큰 수를 줄여주므로 같은 계산 예산으로 훨씬 긴 과거(L=512, N=64패치)를 볼 수 있고, 논문은 이것이 곧 정확도 향상으로 이어진다는 것을 Table 1 케이스 스터디로 보인다.'},
 {h:'마스크 자기지도 사전학습으로 재사용 가능한 표현',
  lead:'패치 일부를 0으로 가리고 복원하도록 사전학습한 뒤 다운스트림 예측에 전이한다.',
  d:'[BERT](#/p/bert)·[MAE](#/p/mae)식 마스킹을 패치 단위로 적용한다 — 겹치지 않는 패치 중 40%를 무작위로 골라 0으로 채우고, 나머지 패치로부터 마스크된 패치를 MSE 손실로 복원하도록 학습한다. 이렇게 사전학습된 backbone은 linear probing이나 fine-tuning만으로 지도학습 성능을 능가하거나 근접해, 시계열에서도 마스크 오토인코더식 표현학습이 통한다는 것을 보인다.'}
],

diagram:{type:'flow', cap:'채널 독립 처리: 변수마다 같은 Transformer backbone을 독립적으로 통과시킨 뒤 결과만 다시 합친다.',
 nodes:[
  {t:'다변량 입력', s:'M채널 × L'},
  {t:'채널별 분리', s:'M개 단변량'},
  {t:'패치 분할', s:'N ≈ L/S', a:'토큰화'},
  {t:'Transformer', s:'가중치 공유', acc:true},
  {t:'채널별 concat', s:'M × T 출력'}
 ]},

math:[
 {expr:'N = ⌊(L-P)/S⌋ + 2',
  tex:'N = \\left\\lfloor \\frac{L-P}{S} \\right\\rfloor + 2',
  d:'패치 개수. 마지막 값을 $S$ 번 반복해 패딩한 뒤 패치를 나누므로 입력 길이 $L$ 이 패치 길이 $P$·스트라이드 $S$ 로 이 정도의 토큰 수가 된다.'},
 {expr:'x_d^(i) = W_p x_p^(i) + W_pos',
  tex:'x_d^{(i)} = W_p\\, x_p^{(i)} + W_{\\text{pos}}, \\qquad W_p \\in \\mathbb{R}^{D\\times P}',
  d:'패치를 트랜스포머 잠재 차원 $D$ 로 선형 투영하고, 학습 가능한 위치 임베딩 $W_{\\text{pos}}$ 을 더해 패치 순서를 표시한다. 이후 표준 multi-head self-attention이 그대로 적용된다.'},
 {expr:'복잡도: O((L/S)²) vs O(L²)',
  tex:'\\mathcal{O}\\!\\left(\\left(\\frac{L}{S}\\right)^{2}\\right) \\quad \\text{vs.} \\quad \\mathcal{O}(L^2)',
  d:'토큰 수가 $S$ 배 줄면 attention 맵의 시간·메모리는 제곱으로 줄어, 같은 예산에서 훨씬 긴 lookback을 감당할 수 있다.'}
],

numbers:[
 {k:'MSE 개선 (Transformer 계열 대비)', v:'PatchTST/64 −21.0%, PatchTST/42 −20.2%', d:'9개 벤치마크 평균, 기존 Transformer 최고 결과 대비 (Table 3, 본문)'},
 {k:'Traffic MSE (horizon 96)', v:'0.360 (PatchTST/64) vs 0.410 (DLinear) vs 0.733 (Informer)', d:'Table 3 — 채널 수가 많은 데이터셋에서 DLinear를 확실히 앞섬'},
 {k:'Weather MSE (horizon 96)', v:'0.149 (PatchTST/64) vs 0.176 (DLinear)', d:'Table 3'},
 {k:'ILI MSE (horizon 24)', v:'1.319 (PatchTST/64) vs 2.215 (DLinear)', d:'Table 3 — 격차가 가장 큰 데이터셋 중 하나'},
 {k:'패치 유무 효과 (Traffic 케이스 스터디)', v:'MSE 0.447(down-sampled) → 0.367(패치, L=336)', d:'Table 1 — 같은 긴 lookback도 점 단위 토큰이면 성능이 오히려 나쁘고, 패치로 바꾸면 개선됨'},
 {k:'채널 독립 효과 (Electricity)', v:'토큰 수 300(패치) vs 5730(패치 없음) — 약 19배 차이', d:'Table 1 우측 — patch가 토큰 수를 줄여 학습을 가능하게 함을 보이는 수치'}
],

impact:'[DLinear](#/p/dlinear)가 던진 "Transformer가 시계열에서 순서를 못 쓴다"는 도전에 회피가 아니라 **입력 표현을 바꾸는 정면 대응**으로 답했다. 결과적으로 어텐션 자체가 문제가 아니라 토큰화 방식이 문제였다는 것을 보여, [ViT](#/p/vit)의 패치 레시피가 이미지를 넘어 시계열까지 확장될 수 있음을 증명했다. 채널 독립 설계는 이후 시계열 Transformer의 사실상 표준 관행이 되었고, 마스크 사전학습 결과는 시계열에도 범용 표현학습이 가능하다는 근거를 제공했다.',

legacy:[
 '**"패치+채널독립"이 시계열 Transformer의 새 표준으로 자리잡음** — 이후 iTransformer, TimesNet 등 후속 아키텍처가 채널 독립 여부를 핵심 설계 축으로 계속 논의',
 '**DLinear와의 논쟁에 실증적 종지부** — 같은 벤치마크·같은 평가 프로토콜에서 attention 기반 모델이 선형 모델을 다시 앞서는 사례를 만들어, "Transformer 무용론"을 완화',
 '**시계열 자기지도 사전학습의 실증** — 마스크 복원 방식이 시계열에서도 통한다는 것을 보여 시계열 파운데이션 모델 연구의 초석 중 하나가 됨',
 '**[ViT](#/p/vit) 패치 레시피의 재확인** — "토큰 단위를 바꾸면 attention이 산다"는 원리가 비전을 넘어 시계열에서도 성립함을 보임'
],

pitfalls:[
 '**채널 독립은 변수 간 상관관계를 아예 포기하는 설계다.** 변수들이 서로 강하게 상호작용하는 도메인(예: 여러 센서가 물리적으로 연결된 시스템)에서는 이 가정이 정보 손실로 이어질 수 있다 — [DeepAR](#/p/deepar)류의 channel-mixing 설계와는 반대 방향의 트레이드오프다.',
 '**PatchTST/64는 lookback L=512라는 훨씬 긴 입력을 쓴다.** DLinear·다른 Transformer 계열과 비교할 때 lookback 길이가 다르면 공정한 비교가 아닐 수 있어, 저자들도 L=336인 PatchTST/42를 "공정한 비교"용으로 별도 표기한다.',
 '**패치 길이·스트라이드는 하이퍼파라미터이며 데이터셋마다 최적값이 다르다.** 논문 기본값(P=16, S=8)을 다른 도메인·다른 샘플링 주기 데이터에 그대로 쓰면 최적이 아닐 수 있다.'
],

figures:[
 {f:'fig1a-overview.png',
  cap:'다변량 입력(왼쪽, M채널)을 채널별로 쪼개 각각 독립적으로 같은 Transformer backbone(가운데 회색 상자)에 통과시킨 뒤, 채널별 출력을 다시 이어 붙여(concatenate) 최종 예측을 만든다. 채널 사이에는 어떤 정보 교환도 없다.',
  src:'원문 Figure 1(a), p.4'},
 {f:'fig1b-backbone.png',
  cap:'단변량 시리즈 하나가 backbone을 통과하는 경로. Instance Norm+Patching에서 시점들이 겹치는 구간(회색 막대)으로 묶여 토큰이 되고, Projection+Position Embedding을 거쳐 표준 Transformer Encoder에 들어간 뒤 Flatten+Linear Head로 예측 길이 T로 펼쳐진다.',
  src:'원문 Figure 1(b), p.4'}
],

quotes:[
 {t:'We propose an effective design of Transformer-based models for multivariate time series forecasting and self-supervised representation learning. It is based on two key components: (i) segmentation of time series into subseries-level patches which are served as input tokens to Transformer; (ii) channel-independence.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2211.14730 — A Time Series is Worth 64 Words', u:'https://arxiv.org/abs/2211.14730'},
 {t:'공식 코드 (yuqinie98/PatchTST)', u:'https://github.com/yuqinie98/PatchTST'}
]
});
