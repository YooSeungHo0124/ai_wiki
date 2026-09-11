WIKI.paper({
slug:'bitnet',
venue:'arXiv 2023 (Microsoft Research)',
authors:'Hongyu Wang, Shuming Ma, Li Dong, Furu Wei et al. (Microsoft Research)',
arxiv:'2310.11453',

tldr:'가중치를 학습이 끝난 뒤가 아니라 **처음부터 1비트로 두고 학습**하는 Transformer, BitNet을 제안한 논문. `nn.Linear`를 `BitLinear`로 바꾸는 것만으로 [LLM.int8()](#/p/llm-int8) 같은 사후 양자화보다 낮은 정밀도에서도 성능을 지키고, 메모리·에너지를 원문 수치로 10배 안팎 줄인다.',

context:'2023년 시점 LLM 양자화는 거의 전부 **사후 양자화(post-training quantization)** 였다. [LLM.int8()](#/p/llm-int8), [GPTQ](#/p/gptq), [SmoothQuant](#/p/smoothquant)처럼 FP16으로 학습을 끝낸 모델을 나중에 8비트·4비트로 눌러 담는 방식이다. 문제는 정밀도를 더 낮출수록 손실이 급격히 커진다는 것 — 모델이 애초에 낮은 정밀도에 맞춰 학습되지 않았기 때문이다. 양자화를 인식하며 학습하는 **quantization-aware training**은 정확도는 낫지만 극단적인 1비트에서는 최적화 자체가 어려워, 그때까지 이진 신경망 연구는 CNN이나 BERT류 인코더에 머물렀다. 이 논문은 질문을 바꾼다 — **디코더 전용 대규모 언어모델을 처음부터 1비트로 학습시킬 수 있는가?**',

ideas:[
 {h:'BitLinear: nn.Linear를 통째로 대체',
  lead:'모든 선형 투영의 가중치를 학습 중에 {+1,-1}로 이진화하는 드롭인 교체 레이어.',
  d:'residual·LayerNorm·임베딩·attention의 QKV 계산 같은 나머지 구성요소는 8비트로 남기고, 연산량 대부분을 차지하는 **선형 투영의 가중치만** 1비트로 만든다. 가중치를 평균이 0이 되게 센터링한 뒤 부호 함수로 이진화하고, 스케일 $\\beta$ 를 곱해 원래 값과의 $l_2$ 오차를 줄인다.'},
 {h:'LayerNorm으로 양자화 분산을 지켜준다',
  lead:'activation quantization 앞에 LayerNorm을 둬 출력 분산이 무너지지 않게 한다.',
  d:'FP32 초기화에서는 출력 분산이 1 근처로 유지되도록 설계돼 있는데, 가중치를 이진화하면 이 가정이 깨진다. BitLinear는 activation을 양자화하기 직전에 LayerNorm을 넣어 분산을 다시 1 근처로 되돌린다 — 구현상 [SubLN](#/p/transformer)과 동일하다. 이 한 층이 없으면 깊은 BitNet은 학습이 불안정해진다.',},
 {h:'straight-through estimator로 역전파',
  lead:'이진화는 미분 불가능하므로 역전파 때는 양자화를 건너뛰어 gradient를 그대로 흘린다.',
  d:'`Sign` 함수의 gradient는 거의 모든 곳에서 0이라 그대로는 학습이 안 된다. forward에서는 이진 가중치를 쓰지만 backward에서는 straight-through estimator로 실수값 가중치에 직접 gradient를 전달하고, 옵티마이저 상태(1차·2차 모멘트)와 실수값 latent weight는 고정밀도로 유지한다. **학습 중에 양자화를 겪게 한다**는 것이 사후 양자화와의 근본적 차이다.'},
 {h:'Group Quantization으로 모델 병렬화를 지킨다',
  lead:'가중치·activation을 그룹으로 나눠 통신 없이 병렬로 양자화 파라미터를 추정한다.',
  d:'모델을 여러 장비에 나눠 돌릴 때, $\\alpha,\\beta,\\gamma$ 같은 양자화 파라미터는 원래 텐서 전체에서 계산돼야 해서 장비 간 all-reduce가 필요해진다. 대신 텐서를 파티션 축을 따라 $G$ 개 그룹으로 나눠 그룹별로 독립적으로 파라미터를 추정하면, 통신 없이 지역적으로 계산할 수 있다.'},
 {h:'추론 에너지를 곱셈에서 덧셈으로 옮긴다',
  lead:'가중치가 ±1이라 행렬곱의 곱셈 연산이 사실상 덧셈으로 바뀐다.',
  d:'FP16 행렬곱의 에너지 비용은 곱셈과 덧셈 모두에서 나온다. BitNet은 가중치가 1비트이므로 곱셈은 출력을 스케일링하는 데만 쓰이고 주된 연산은 덧셈이 된다. 저자들은 [Hor14] 에너지 모델로 이 비용을 직접 계산해, 모델이 커질수록 절감폭이 커짐을 보인다.'}
],

diagram:{type:'compare', cap:'사후 양자화 대 BitNet의 quantization-aware training. BitNet은 학습 루프 안에서 이진화를 겪는다.',
 left:{t:'사후 양자화 (GPTQ 등)', items:['FP16으로 학습 끝까지 완료','학습 후 가중치를 반올림해 압축','낮은 비트에서 손실 급증']},
 right:{t:'BitNet: 처음부터 1비트 학습', items:['BitLinear로 nn.Linear 교체', 'forward 이진화 + STE backward', 'FP16과 비슷한 스케일링 법칙', 'acc:true']}},

math:[
 {expr:'W~ = Sign(W - α),   α = mean(W)',
  tex:'\\widetilde{W}=\\text{Sign}(W-\\alpha),\\qquad \\alpha=\\frac{1}{nm}\\sum_{ij}W_{ij}',
  d:'가중치를 평균이 0이 되도록 센터링한 뒤 부호만 남긴다. $\\pm1$ 두 값만 가능하므로 문자 그대로 1비트다.'},
 {expr:'x~ = Clip(x · Q_b/γ, -Q_b+ε, Q_b-ε),   γ = ||x||_∞',
  tex:'\\tilde{x}=\\text{Clip}\\!\\left(x\\times\\frac{Q_b}{\\gamma},-Q_b+\\epsilon,Q_b-\\epsilon\\right),\\quad \\gamma=\\lVert x\\rVert_\\infty',
  d:'activation은 absmax 방식으로 8비트($Q_b=2^{b-1}$)로 양자화한다. 학습 때는 텐서 전체 기준, 추론 때는 토큰별로 계산해 안정성과 효율을 동시에 맞춘다.'},
 {expr:'E_mul(BitLinear) = (m·p + m·n) · Ê_mul   ≪   E_mul(FP16) = m·n·p · Ê_mul',
  tex:'E_{\\text{mul}}^{\\text{BitLinear}}=(m\\!\\times\\!p+m\\!\\times\\!n)\\hat{E}_{\\text{mul}},\\qquad E_{\\text{mul}}^{\\text{FP16}}=m\\!\\times\\!n\\!\\times\\!p\\,\\hat{E}_{\\text{mul}}',
  d:'FP16은 모든 원소쌍마다 곱셈이 필요하지만($m n p$ 회), BitNet은 가중치가 $\\pm1$이라 진짜 곱셈은 출력 스케일링($mp$)과 입력 스케일링($mn$) 정도로 줄어든다.'}
],

numbers:[
 {k:'에너지 절감 (7nm, 6.7B, 곱셈)', v:'약 71x', d:'BitNet 1비트 0.02pJ vs FP16 1.14pJ (Table 1)'},
 {k:'에너지 절감 (7nm, 30B, 곱셈)', v:'약 87x', d:'모델이 커질수록 절감폭이 증가 (Table 1)'},
 {k:'학습 설정', v:'1.3B~6.7B (13B·30B는 스케일링 법칙 추정)', d:'실제 학습은 125M~6.7B, 13B/30B는 fitted scaling law로 예측한 값'},
 {k:'활성화 정밀도', v:'8-bit (W1A8)', d:'가중치만 1비트, activation은 8비트로 유지'},
 {k:'스케일링 법칙', v:'FP16과 유사한 power-law', d:'irreducible loss term을 포함한 power-law로 BitNet의 loss가 FP16 Transformer와 같은 형태로 예측됨'}
],

impact:'사후 양자화 일변도였던 LLM 압축 연구에 "**처음부터 낮은 정밀도로 학습시킨다**"는 대안 축을 세웠다. 1비트에서도 FP16과 유사한 스케일링 법칙이 성립함을 보임으로써, 극단적 양자화가 단순한 압축 트릭이 아니라 **모델을 키우면 계속 따라오는 별도의 학습 패러다임**이 될 수 있음을 시사했다. 이 결과는 곧바로 [BitNet b1.58](#/p/bitnet-158)의 삼진 가중치로 이어졌다.',

legacy:[
 '**BitNet b1.58** — 가중치에 0을 허용한 삼진화로 발전, [BitNet b1.58](#/p/bitnet-158) 참고',
 '**QAT 대 PTQ 논쟁 재점화** — [LLM.int8()](#/p/llm-int8)·GPTQ류 사후 양자화와 처음부터 학습하는 방식 사이의 트레이드오프가 이후 양자화 연구의 표준 비교축이 됨',
 '**전용 하드웨어 논의 촉발** — 곱셈이 사라진 연산 패턴은 이후 1비트 전용 가속기·커널(Ladder 등) 연구로 이어짐',
 '**decoder-only LLM에 처음 적용** — 그 이전 이진 Transformer 연구는 번역·BERT류 인코더에 머물렀는데, 이 논문이 처음으로 자기회귀 LLM 스케일에서 검증'
],

pitfalls:[
 '**"BitNet = 사후 양자화"로 혼동하기 쉽다.** BitNet은 학습을 처음부터 1비트로 진행하는 것이지, 학습이 끝난 FP16 모델을 나중에 누르는 방식이 아니다. 그래서 기존 체크포인트에 바로 적용할 수 없고 재학습이 필요하다.',
 '**모든 레이어가 1비트인 것은 아니다.** embedding·QKV·LayerNorm·residual 등은 8비트로 남긴다. "BitNet은 전부 1비트"라고 말하면 원문 설계와 어긋난다.',
 '**에너지 수치는 실측이 아니라 연산량 기반 추정치다.** Table 1·2의 에너지는 [Hor14] 논문의 45nm/7nm 공정 에너지 모델로 계산한 값이지, 실제 칩에서 측정한 값이 아니다.'
],

figures:[
 {f:'fig2-bitlinear.png',
  cap:'왼쪽 BitLinear: LayerNorm → absmax 양자화(activation) 와 1-bit 가중치가 만나 곱해진 뒤 β·γ로 역양자화. 오른쪽 BitNet 전체 구조: 빨간 BitLinear가 attention의 Q/K/V와 출력 투영, FFN의 두 선형층 자리를 모두 차지한다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'BitNet significantly reduces memory footprint and energy consumption compared to the baselines.',
  src:'Abstract/Introduction, p.1'}
],

links:[
 {t:'arXiv 2310.11453 — BitNet: Scaling 1-bit Transformers for Large Language Models', u:'https://arxiv.org/abs/2310.11453'},
 {t:'BitNet b1.58 (후속 논문)', u:'https://arxiv.org/abs/2402.17764'}
]
});
