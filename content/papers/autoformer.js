WIKI.paper({
slug:'autoformer',
venue:'NeurIPS 2021',
authors:'Wu, Xu, Wang, Long (Tsinghua University)',
arxiv:'2106.13008',

tldr:'[Informer](#/p/informer)식으로 self-attention을 성기게(sparse) 만드는 대신, 아예 **자기상관(Auto-Correlation)** 으로 바꾸고 추세·계절성 분해를 전처리가 아니라 **모델 내부 블록**으로 넣은 논문. 점 단위 유사도가 아니라 주기 단위 유사도로 시계열을 본다.',

context:'[Informer](#/p/informer)를 비롯한 기존 Transformer 시계열 모델은 여전히 점(point) 대 점의 attention을 계산한다 — 희소화(ProbSparse)로 계산량만 줄였을 뿐, "이 시점과 저 시점이 비슷한가"라는 점 단위 질의는 그대로다. 그런데 실무 장기 시계열(전력·교통·환율)은 대개 **주기성**이 강하고, 정보가 유용한 단위는 개별 시점이 아니라 "하나의 주기 구간"이다. 또한 기존 방법들은 추세-계절성 분해를 학습 전 전처리로만 쓰는데, 미래 구간은 아직 값이 없어 분해할 수 없다는 근본적 모순이 있다. 저자들은 "분해를 전처리가 아니라 모델 내부의 반복 연산으로 넣으면 어떨까"라는 질문에서 출발한다.',

ideas:[
 {h:'Series Decomposition Block: 분해를 모델 안에 내장',
  lead:'이동평균으로 추세를 뽑고 나머지를 계절성으로 두는 분해를, 매 블록마다 반복되는 내부 연산으로 만든다.',
  d:'`AvgPool(Padding(X))` 로 추세-순환 성분 $X_t$ 를 뽑고 $X_s = X - X_t$ 로 계절성 성분을 얻는다. 이 `SeriesDecomp` 를 인코더·디코더의 각 층 사이에 반복 삽입해, 중간 은닉 표현에서도 계속 추세를 걷어내고 계절성만 다음 attention에 넘긴다. 전처리 한 번이 아니라 **모델 전체에 걸쳐 점진적으로(progressive)** 분해가 일어난다.'},
 {h:'디코더가 추세를 누적하며 예측을 조립',
  lead:'디코더는 계절성은 Auto-Correlation으로, 추세는 각 층에서 뽑은 성분을 그대로 더해가며 최종 예측을 만든다.',
  d:'디코더 입력은 최근 관측의 후반부에서 뽑은 계절성·추세 절반과, 0/평균으로 채운 미래 자리 절반을 이어 붙여 만든다($X_{des}=Concat(X_{ens},X_0)$, $X_{det}=Concat(X_{ent},X_{mean})$). 디코더의 각 층은 자기 몫의 추세 성분 $\\mathcal T^{l,i}_{de}$ 를 계속 뽑아 누적하고, 계절성은 Auto-Correlation을 거쳐 최종적으로 두 값을 더해 예측을 만든다.'},
 {h:'Auto-Correlation: 점 유사도 대신 주기 유사도',
  lead:'FFT로 시계열 자기상관을 구해 유사한 지연(lag)을 찾고, 그 주기 단위로 부분열을 통째로 정렬해 평균한다.',
  d:'확률과정 이론에서 정상 시계열의 자기상관 $R(\\tau)$ 는 지연 $\\tau$ 만큼 밀었을 때 자기 자신과 얼마나 닮았는지를 뜻한다. Wiener–Khinchin 정리에 따라 이는 FFT로 $O(L\\log L)$ 에 계산할 수 있다. 자기상관이 가장 큰 top-k 지연 $\\tau_1,\\dots,\\tau_k$ 을 고르고, 그 지연만큼 시계열을 `Roll`(순환 이동)한 뒤 자기상관 값으로 softmax 가중합 — 이것이 self-attention을 완전히 대체하는 Auto-Correlation이다.'},
 {h:'점 대 점이 아니라 부분열 대 부분열 연결',
  lead:'attention이 개별 토큰을 잇는 것과 달리, Auto-Correlation은 같은 주기 위상의 부분열 전체를 통째로 잇는다.',
  d:'ProbSparse나 LogSparse도 결국은 "점과 점" 사이의 sparse한 연결을 고르는 것이다. Auto-Correlation은 애초에 연결 단위가 다르다 — 지연 $\\tau$ 만큼 밀어 겹치는 두 구간 전체를 하나의 단위로 취급해 series-wise connection을 만든다. 이는 정보 활용의 병목(information utilization bottleneck)을 부분열 단위로 넓힌다는 것이 저자들의 주장이다.'}
],

diagram:{type:'stack', cap:'인코더 한 층. Auto-Correlation과 FFN 뒤에 각각 Series Decomp를 둬서, 층을 지날 때마다 추세를 걷어내고 계절성만 다음 층에 전달한다.',
 layers:[
  {t:'인코더 입력', s:'과거 I 스텝'},
  {t:'자기상관', s:'FFT top-k 지연', acc:true, note:'self-attn 대체'},
  {t:'Series Decomp', s:'추세 제거 → 계절성만'},
  {t:'Feed Forward', s:'토큰별 계산'},
  {t:'Series Decomp', s:'다음 층으로 계절성 전달'}
 ]},

math:[
 {expr:'R_XX(τ) = lim (1/L) Σ_t X_t X_{t-τ}',
  tex:'\\mathcal{R}_{XX}(\\tau) = \\lim_{L\\to\\infty}\\frac{1}{L}\\sum_{t=1}^{L} X_t X_{t-\\tau}',
  d:'시계열의 자기상관 함수. 지연 $\\tau$ 만큼 밀었을 때 자기 자신과의 유사도이며, 값이 큰 $\\tau$ 가 곧 그 시계열의 지배적인 주기 후보다.'},
 {expr:'Auto-Correlation(Q,K,V) = Σ_{i=1..k} softmax(R̂(τ_i)) · Roll(V, τ_i)',
  tex:'\\text{Auto-Correlation}(Q,K,V) = \\sum_{i=1}^{k} \\widehat{\\text{Softmax}}\\big(\\mathcal{R}_{Q,K}(\\tau_i)\\big)\\cdot \\text{Roll}(V,\\tau_i)',
  d:'top-k 자기상관 지연 $\\tau_1,\\dots,\\tau_k$ 에 대해 값 $V$ 를 그 지연만큼 순환 이동(Roll)시킨 뒤, 자기상관 크기로 softmax 가중합한다. self-attention의 $QK^\\top$·softmax·$V$ 곱을 그대로 대체하는 자리다.'},
 {expr:'X_t = AvgPool(Padding(X)),  X_s = X - X_t',
  tex:'\\mathcal{X}_t = \\text{AvgPool}(\\text{Padding}(\\mathcal{X})), \\qquad \\mathcal{X}_s = \\mathcal{X} - \\mathcal{X}_t',
  d:'Series Decomposition Block. 이동평균으로 추세-순환 성분을 뽑고 원 신호에서 빼서 계절성 성분을 얻는 단순한 식이지만, 이것이 모델 전체에 반복 삽입된다.'}
],

numbers:[
 {k:'ETTm2 멀티변량 MSE (horizon 96/192/336/720)', v:'0.255 / 0.281 / 0.339 / 0.422', d:'Informer(0.365~3.379)를 전 구간에서 앞섬, 특히 720에서 격차가 커짐 (Table 1)'},
 {k:'평균 MSE 개선', v:'38%', d:'6개 벤치마크(ETT/Electricity/Exchange/Traffic/Weather/ILI) 전체 평균, Informer 등 기존 최고 대비 (본문 명시)'},
 {k:'Traffic MSE 개선', v:'61% (1.357→0.509)', d:'336-step 예측 기준, 개선폭이 가장 큰 데이터셋 중 하나로 본문에 명시'},
 {k:'Electricity MSE 개선', v:'18% (0.280→0.231)', d:'336-step 예측 기준 (본문 명시)'},
 {k:'Auto-Correlation 복잡도', v:'O(L log L)', d:'FFT 계산(식 5) 기반, top-k 선택도 O(L log L)'},
 {k:'실험 데이터셋 6종', v:'ETT · Electricity · Exchange · Traffic · Weather · ILI', d:'horizon은 데이터셋별로 다르며 ILI는 {24,36,48,60}으로 훨씬 짧다'}
],

impact:'"attention을 어떻게 근사할까"에서 "**attention이 애초에 맞는 연산인가**"로 질문을 바꿨다. 시계열의 주기성이라는 도메인 지식을 어텐션 메커니즘 자체에 녹여, 순수 근사(ProbSparse)보다 한 단계 더 도메인 특화된 설계를 제시했다. series decomposition을 모델 내부 블록으로 넣는 방식은 이후 시계열 Transformer 설계의 공통 부품이 되었고, [DLinear](#/p/dlinear)가 정면 비판하면서도 이 분해 아이디어 자체는 인정하고 자기 모델(1개 분해 + 2개 선형층)에 그대로 가져다 쓴다는 점이 논쟁의 흥미로운 지점이다.',

legacy:[
 '**series decomposition을 내부 블록으로 쓰는 설계가 표준화** — [DLinear](#/p/dlinear)조차 Autoformer의 이동평균 분해를 그대로 채택해 자신의 두 선형층에 나눠 얹음',
 '**"attention을 도메인에 맞게 바꾸자"는 흐름** — FEDformer 등 주파수 영역 어텐션 후속 연구로 이어짐',
 '**DLinear의 정면 비판 대상** — [DLinear](#/p/dlinear)가 "attention이 순서 정보를 실질적으로 못 쓴다"고 지적할 때 Informer와 함께 핵심 비교 대상이 됨',
 '**[PatchTST](#/p/patchtst)와 대비되는 설계 축** — Autoformer는 분해+새 어텐션으로 정교함을 더하는 방향, PatchTST는 반대로 패치+채널독립으로 단순화하는 방향을 택함'
],

pitfalls:[
 '**Auto-Correlation은 "주기적인" 시계열을 가정한다.** 뚜렷한 주기가 없는 시계열(예: 추세만 있고 계절성이 약한 데이터)에서는 top-k 지연 선택이 잡음에 가까운 지연을 고를 수 있다.',
 '**이동평균 기반 분해는 매우 단순하다.** STL처럼 정교한 분해가 아니라 AvgPool 한 번이며, 커널 크기(윈도우 길이)를 잘못 고르면 추세와 계절성이 잘 안 갈린다 — 이 단순함이 이후 [DLinear](#/p/dlinear)가 "복잡한 attention 없이 이 분해 하나만으로 충분하다"고 반박하는 빌미가 된다.',
 '**Table 1의 개선폭(38%, 61% 등)은 특정 horizon·특정 데이터셋 기준이다.** 평균 수치를 모든 (데이터셋, horizon) 조합에 그대로 적용하면 안 된다 — 예컨대 ILI처럼 horizon이 훨씬 짧은 데이터셋은 별도로 봐야 한다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'위쪽 인코더는 파란 Series Decomp 블록으로 추세를 계속 걷어내며 계절성만 다루고, 아래쪽 디코더는 초록 Auto-Correlation 두 개(자기 자신 + 인코더 출력과의 cross)를 거치며 오른쪽 회색 원(+)에서 각 층의 추세 성분을 계속 누적해 최종 Prediction을 만든다.',
  src:'원문 Figure 1, p.4'}
],

quotes:[
 {t:'We propose Autoformer as a novel decomposition architecture with an Auto-Correlation mechanism. We break with the pre-processing convention of series decomposition and renovate it as a basic inner block of deep models.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2106.13008 — Autoformer', u:'https://arxiv.org/abs/2106.13008'},
 {t:'공식 코드 (thuml/Autoformer)', u:'https://github.com/thuml/Autoformer'}
]
});
