WIKI.paper({
slug:'lut-gemm',
venue:'ICLR 2024',
authors:'Park, Kim, Ahn, Yang, Yang, Kim, Song, Kim et al. (Samsung Research · SAIT)',
arxiv:'2206.09557',

tldr:'양자화된 가중치를 곱셈 전에 FP16으로 되돌리는 **역양자화 없이**, 활성값과 이진 가중치 조합을 미리 계산해 둔 **룩업 테이블(LUT)**을 조회해 행렬곱을 수행하는 GPU 커널. OPT-175B에서 GPU 1대로 [GPTQ](#/p/gptq) 대비 2.1배 빠른 토큰 생성을 낸다.',

context:'가중치만 저비트로 양자화하는 `weight-only quantization`([GPTQ](#/p/gptq), AWQ 계열)은 메모리 사용량을 크게 줄이지만, 곱셈 자체는 여전히 FP16으로 해야 하므로 매 순전파마다 저장된 저비트 값을 FP16으로 **역양자화(dequantization)** 하는 과정이 필요하다. 생성(decode) 단계는 배치가 작아 본질적으로 메모리 대역폭에 묶인 작업인데, 역양자화가 그 자체로 추가 연산과 메모리 접근을 발생시켜 저비트 압축이 주는 이득의 상당 부분을 깎아 먹는다. 이 논문의 질문은 — **역양자화를 아예 건너뛰고 양자화된 값을 그대로 곱할 방법이 있는가**이다.',

ideas:[
 {h:'BCQ 포맷: 가중치를 ±1 이진 벡터의 합으로 표현',
  lead:'가중치를 스케일 α와 이진 벡터 b의 합 Σαᵢbᵢ 로 근사해 곱셈을 덧셈으로 바꾼다.',
  d:'`binary-coding quantization(BCQ)`은 원소 $n$개짜리 가중치 벡터 $w$를 $\\sum_{i=1}^{q} \\alpha_i b_i$ 로 근사한다. 여기서 $\\alpha_i$는 실수 스케일, $b_i \\in \\{-1,+1\\}^n$은 이진 벡터다. 이 논문은 기존 균등(uniform) 양자화도 이 BCQ 형식으로 재표현할 수 있음을 보여, LUT-GEMM 커널 하나로 **균등·비균등 양자화 방식을 모두** 처리할 수 있게 만들었다.'},
 {h:'룩업 테이블: 활성값 조합을 미리 계산해 조회로 대체',
  lead:'활성값 μ개 묶음이 가질 수 있는 모든 이진 조합의 부분합을 미리 계산해 둔다.',
  d:'FP16 활성값 $\\mu$개를 한 묶음으로 놓고, 그 묶음이 이진 가중치와 만들 수 있는 $2^\\mu$가지 부분합을 모두 미리 계산해 LUT에 저장한다. 실제 행렬곱 때는 이진 가중치 비트열을 그대로 **인덱스**로 써서 LUT를 조회하기만 하면 되므로, 중복되는 부분합을 다시 계산하지 않는다. $\\mu$를 키울수록 LUT 재사용률은 올라가지만 사전계산·저장 비용도 커지는 트레이드오프가 있다.'},
 {h:'바이어스 항을 더해 BCQ의 표현력을 확장',
  lead:'기존 BCQ에 바이어스 항 하나를 추가해 근사 오차를 줄인다.',
  d:'원래 BCQ는 원점 대칭인 $\\{-1,+1\\}$ 조합만 표현할 수 있어 비대칭 분포를 가진 실제 가중치에 오차가 남는다. 여기에 바이어스 항을 하나 추가한 확장 BCQ 포맷을 제안해, 같은 비트 수에서 더 낮은 양자화 오차로 균등 양자화를 정확히 재현할 수 있게 했다.'},
 {h:'역양자화 제거가 곧 GPU 수 감소로 이어진다',
  lead:'커널이 빨라지는 만큼 모델이 적은 GPU에 올라가, 통신 오버헤드 자체가 사라진다.',
  d:'대형 모델은 여러 GPU에 나눠 텐서 병렬화를 해야 하는데, GPU 간 통신 오버헤드 때문에 [scaling-inference](#/p/scaling-inference)가 보여주듯 GPU를 늘려도 성능이 선형으로 늘지 않는다. LUT-GEMM으로 3비트까지 압축하면 OPT-175B가 GPU 8대 대신 **1대**에 들어가 통신 오버헤드 자체가 사라지고, 오히려 GPU 수를 줄이면서 지연시간도 개선된다.'}
],

diagram:{type:'compare', cap:'같은 W4/A16(가중치 4bit·활성값 FP16) 조합을 처리하는 두 방식 비교(원문 Figure 1).',
 left:{t:'기존: On-the-fly 역양자화', items:['4bit 가중치 → FP16 복원','FP16끼리 행렬곱','역양자화 연산이 매번 추가']},
 right:{t:'LUT-GEMM (이 논문)', items:['활성값 조합을 LUT로 사전계산','이진 가중치를 인덱스로 조회','역양자화 단계 자체가 없음']}
},

math:[
 {expr:'w ≈ Σ_{i=1}^{q} α_i b_i,   α_i ∈ R+,  b_i ∈ {-1,+1}^n',
  tex:'w \\approx \\sum_{i=1}^{q}\\alpha_i b_i,\\quad \\alpha_i\\in\\mathbb{R}^{+},\\; b_i\\in\\{-1,+1\\}^n',
  d:'BCQ의 정의. $q$가 비트폭에 해당하며, $q$개의 이진 벡터와 스케일의 합으로 원래 가중치 벡터를 근사한다.'},
 {expr:'LUT 크기 = 2^μ 항목,  LUT 재사용 = μ개의 활성값 묶음마다 1회 계산',
  tex:'|\\text{LUT}| = 2^{\\mu}\\ \\text{entries}',
  d:'$\\mu$는 한 LUT가 커버하는 활성값 개수(하이퍼파라미터). 커질수록 조회당 계산 재사용은 늘지만 LUT 생성 비용도 지수적으로 커진다.'}
],

numbers:[
 {k:'OPT-175B 토큰 생성 지연', v:'3bit 기준 2.1배 개선', d:'GPTQ(OPTQ) 대비, A100 80GB 1장 — Table 4'},
 {k:'FFN 첫 층 지연(A100)', v:'INT3 0.225ms vs FP16 cuBLAS 0.726ms', d:'m=12288, g=128 기준 — Table 1, 최대 3.22배'},
 {k:'AWQ 결합 · LLaMA-30B', v:'3bit LUT-GEMM 18.1ms vs FP16 43.6ms', d:'1-GPU, A100 — Table 3, perplexity는 4.10→4.88로 소폭 상승'},
 {k:'OPT-175B 필요 GPU 수', v:'FP16 8장 → BCQ 1장', d:'3비트 양자화로 단일 GPU 추론 가능 — Table 4'},
 {k:'LLaMA-65B/30B 결합 속도', v:'3bit 기준 2.04배 / 2.41배', d:'GPTQ 3bit 양자화 + LUT-GEMM 커널, g=128'}
],

impact:'LUT-GEMM은 "가중치를 몇 비트로 압축하느냐"라는 알고리즘 문제와 "그 압축된 표현으로 실제 GPU에서 얼마나 빨리 곱셈하느냐"라는 커널 문제를 분리해서, 후자를 역양자화 없이 해결하는 구체적인 방법을 제시했다. [GPTQ](#/p/gptq)·[AWQ](#/p/awq)처럼 양자화 알고리즘 자체를 개선하는 연구와 결합 가능한 실행 계층을 제공해, 양자화 방식과 무관하게 커널 수준에서 속도를 더 짜낼 수 있음을 보였다.',

legacy:[
 '[GPTQ](#/p/gptq)·AWQ가 만든 저비트 가중치를 그대로 받아 커널만 교체해 추가 가속을 낼 수 있음을 보여, 양자화 알고리즘과 실행 커널이 독립적으로 발전하는 계기가 됨',
 'BCQ가 균등 양자화를 포함한다는 재정식화는 이후 다양한 비균등 양자화 방식이 같은 커널 인프라를 공유하게 하는 근거가 됨',
 '역양자화를 없애는 접근은 [BitNet](#/p/bitnet) 같은 극저비트(1-bit급) 연구가 추론 시점에 곱셈 자체를 덧셈으로 치환하는 방향과 같은 축을 공유',
 '[SmoothQuant](#/p/smoothquant)의 활성값-가중치 균형 조정과는 다른 축 — SmoothQuant는 양자화 오차를 줄이는 전처리, LUT-GEMM은 양자화된 값을 곱하는 커널 자체를 바꾼다'
],

pitfalls:[
 '**LUT-GEMM은 배치가 작을 때(메모리 대역폭 병목) 이득이 크다.** 배치가 커져 연산이 지배적인 구간에서는 LUT 생성·조회 오버헤드가 상대적으로 커져 이점이 줄어든다.',
 '**활성값은 여전히 FP16이다.** 이 논문은 weight-only 양자화 커널이지, [LLM.int8()](#/p/llm-int8)처럼 활성값까지 정수로 양자화하는 방식이 아니다.',
 '**μ(LUT가 커버하는 활성값 개수)는 하이퍼파라미터다.** 크게 잡으면 조회 재사용이 늘지만 LUT 생성 비용이 커지므로, 하드웨어와 비트폭에 맞춰 조정해야 한다.'
],

figures:[
 {f:'fig1-schemes.png',
  cap:'세 가지 행렬곱 경로 비교. (a) 활성값까지 INT8로 양자화하는 방식, (b) 4bit 가중치를 곱셈 직전에 FP16으로 되돌리는 기존 weight-only 방식(Dequant 상자가 추가 비용), (c) 이 논문의 LUT-GEMM — Dequant 없이 오른쪽 확대 박스처럼 활성값을 Pre-computation한 뒤 이진 가중치를 인덱스 삼아 LUT를 바로 조회한다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'we introduce LUT-GEMM, an efficient kernel for quantized matrix multiplication, which not only eliminates the resource-intensive dequantization process but also reduces computational costs compared to previous kernels for weight-only quantization.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2206.09557 — LUT-GEMM', u:'https://arxiv.org/abs/2206.09557'}
]
});
