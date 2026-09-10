WIKI.paper({
slug:'quantization-survey',
venue:'arXiv 2021 (UC Berkeley)',
authors:'Gholami, Kim, Dong, Yao, Mahoney, Keutzer (UC Berkeley)',
arxiv:'2103.13630',

tldr:'새 방법을 제안하는 논문이 아니라, 흩어져 있던 신경망 양자화 연구를 **하나의 분류 체계**로 정리한 서베이다. uniform/non-uniform, symmetric/asymmetric, static/dynamic range, per-tensor/per-channel, QAT/PTQ라는 축을 세우면, 이후 모든 양자화 논문을 "이 지도의 어디에 있는가"로 읽을 수 있다.',

context:'2021년 시점 신경망은 정확도를 위해 계속 커졌고, 그 크기가 곧 배포의 병목이 됐다. 양자화는 오래된 신호처리 개념이지만, 신경망은 **과매개변수화**돼 있어 정밀도를 낮여도 일반화 성능이 크게 안 깨진다는 독특한 성질을 갖는다. 문제는 그 사이 수백 편의 논문이 각자 다른 용어로 비슷한 아이디어를 재발명하고 있었다는 것이다. 어떤 논문은 "clipping range"를, 어떤 논문은 "dynamic range"를 말하지만 가리키는 대상이 같은 경우가 흔했다. 이 서베이는 새 알고리즘 대신 **공통 좌표계**를 제공해, 독자가 임의의 양자화 논문을 읽을 때 그 논문이 몇 개의 이진 선택(uniform이냐, symmetric이냐, per-tensor냐, 재학습을 하느냐)으로 이미 특징지어진다는 것을 보인다.',

ideas:[
 {h:'정수 매핑의 뼈대: $S$ 와 $Z$',
  lead:'모든 균등 양자화는 스케일 $S$ 와 영점 $Z$ 하나의 아핀 변환으로 환원된다.',
  d:'실수 $r$ 을 정수로 보내는 함수 $Q(r)=\\text{Int}(r/S)-Z$ 하나가 uniform quantization의 전부다. $S$ 는 클리핑 범위 $[\\alpha,\\beta]$ 를 비트 수만큼의 격자로 나눈 간격이고, $Z$ 는 실수 0을 정수 몇에 대응시킬지 정하는 정수 오프셋이다. 이후 등장하는 거의 모든 정수 양자화 기법 — [GPTQ](#/p/gptq)의 오차 보정, [AWQ](#/p/awq)의 채널 스케일링 — 은 결국 $S$ 를 얼마나 잘 정하느냐, 혹은 정하기 전에 가중치·활성값을 어떻게 미리 손봐 $S$ 의 부담을 줄이느냐의 문제로 환원된다.'},
 {h:'균등 vs 비균등 — 격자 간격이 일정한가',
  lead:'격자를 일정 간격으로 자르느냐 분포에 맞춰 자르느냐가 첫 갈림길이다.',
  d:'uniform quantization은 양자화 레벨 사이의 간격이 전부 같다. non-uniform quantization은 $Q(r)=X_i,\\ r\\in[\\Delta_i,\\Delta_{i+1})$ 처럼 레벨과 구간을 값의 분포(흔히 종 모양)에 맞춰 불균등하게 배치해, 같은 비트 수로 더 적은 오차를 낸다. 그런데 논문은 여기서 명확히 못박는다 — **non-uniform이 이론적으로는 유리해도 GPU·CPU 같은 범용 하드웨어에 매핑하기 어려워, 실무의 de-facto 표준은 여전히 uniform quantization**이라는 것이다. 훗날의 [GPTQ](#/p/gptq)·[AWQ](#/p/awq)·[LLM.int8()](#/p/llm-int8)·[QLoRA](#/p/qlora)가 전부 균등 격자(정수 혹은 NF4의 준균등 변형) 위에서 움직이는 것은 이 실용주의의 연장선이다.'},
 {h:'대칭 vs 비대칭 — 영점을 원점에 고정하는가',
  lead:'클리핑 범위가 원점에 대칭이면 $Z=0$ 이 되어 곱셈 직전의 덧셈이 사라진다.',
  d:'클리핑 범위 $[\\alpha,\\beta]$ 를 $-\\alpha=\\beta$ 로 고정하면 symmetric quantization, $\\alpha=r_{min}, \\beta=r_{max}$ 로 신호를 그대로 따라가면 asymmetric quantization이다. 비대칭은 범위를 더 타이트하게 잡아 정밀도에 유리하지만(특히 ReLU 뒤처럼 값이 한쪽으로 쏠린 활성값), 대칭은 $Z=0$ 이 되어 $Q(r)=\\text{Int}(r/S)$ 로 단순해지고 **곱셈 결과에서 영점을 다시 빼는 연산이 사라져 구현이 가볍다**. 그래서 논문은 대칭을 가중치 양자화의 사실상 기본값으로 꼽는다.'},
 {h:'per-tensor vs per-channel — 스케일을 몇 개 두는가',
  lead:'층 전체에 스케일 하나(layerwise)냐 채널마다 따로(channelwise)냐가 정확도를 가른다.',
  d:'layerwise quantization은 층 하나에 클리핑 범위 하나를 쓴다 — 구현은 쉽지만, 같은 층 안에서도 필터마다 값의 범위가 다르면 범위가 좁은 필터가 범위가 넓은 필터에 끌려가 정밀도를 잃는다. channelwise(=groupwise) quantization은 채널·그룹마다 스케일을 따로 둬 이 문제를 줄인다. 논문은 channelwise를 컨볼루션 커널 양자화의 표준으로 꼽는데, [GPTQ](#/p/gptq)·[AWQ](#/p/awq)가 채택한 **group size(예: 128개 가중치마다 스케일 하나)** 는 이 축 위에서 layerwise와 channelwise 사이의 절충점이다.'},
 {h:'QAT vs PTQ — 재학습을 감수하느냐 포기하느냐',
  lead:'양자화 후 학습 데이터로 되돌려 보정하느냐, 소량의 캘리브레이션만 쓰고 끝내느냐.',
  d:'Quantization-Aware Training(QAT)은 양자화된 모델을 학습 데이터로 다시 미세조정해 정확도를 회복한다 — 정확하지만 학습 파이프라인 전체가 필요해 비용이 크다. Post-Training Quantization(PTQ)은 소량의 캘리브레이션 데이터로 클리핑 범위·스케일만 정하고 재학습 없이 끝낸다 — 훨씬 싸지만 QAT보다 정확도가 낮을 수 있다. 논문은 데이터 접근조차 없는 극단인 zero-shot quantization(ZSQ)까지 이 축의 연장으로 다룬다. **[GPTQ](#/p/gptq)와 [AWQ](#/p/awq)는 이 분류에서 명확히 PTQ 진영에 속하고, [QLoRA](#/p/qlora)는 백본은 PTQ로 4-bit 고정한 채 그 위에 얹은 LoRA 어댑터만 학습**하는, 두 축을 섞은 하이브리드로 읽힌다.'}
],

diagram:{type:'compare', cap:'재학습 비용과 정확도를 맞바꾸는 두 축. 훗날 LLM 양자화는 압도적으로 오른쪽(PTQ)에 몰린다.',
 left:{t:'QAT: 양자화 후 재학습', items:['학습 데이터 전체 필요','fine-tuning으로 정확도 회복','비용이 크지만 손실 최소']},
 right:{t:'PTQ: 캘리브레이션만', items:['소량 데이터로 clipping range만 계산','재학습 없이 즉시 배포','GPTQ·AWQ·LLM.int8() 전부 이 갈래']}},

math:[
 {expr:'Q(r) = Int(r/S) − Z',
  tex:'Q(r) = \\text{Int}(r/S) - Z',
  d:'모든 균등 양자화의 출발점. $r$ 은 실수 가중치·활성값, $S$ 는 실수 스케일, $Z$ 는 정수 영점. Int는 반올림·버림 같은 정수화 연산이다.'},
 {expr:'S = (β − α) / (2^b − 1)',
  tex:'S = \\frac{\\beta-\\alpha}{2^{b}-1}',
  d:'클리핑 범위 $[\\alpha,\\beta]$ 를 비트폭 $b$ 가 주는 격자 수로 나눈 것이 스케일. $\\alpha,\\beta$ 를 정하는 과정 자체를 논문은 calibration이라 부른다 — GPTQ·AWQ가 다투는 지점이 바로 이 $\\alpha,\\beta$(또는 그 대리인)를 어떻게 정하느냐다.'},
 {expr:'r̃ = S · (Q(r) + Z)',
  tex:'\\tilde{r} = S\\cdot(Q(r)+Z)',
  d:'역양자화(dequantization). 반올림 때문에 $\\tilde{r}$ 은 원래 $r$ 과 정확히 같지 않다 — 이 복원 오차를 줄이는 것이 사실상 모든 양자화 알고리즘의 공통 목표다.'}
],

numbers:[
 {k:'압축 잠재치', v:'최대 16배', d:'4비트 이하 정수로 내리면 메모리·지연을 이론상 최대 16배 줄일 수 있고, 실무에서는 보통 **4~8배**가 실현된다'},
 {k:'INT8 덧셈 에너지 효율', v:'FP32 대비 30배', d:'45nm 공정 기준. 면적도 **116배** 더 효율적 — 저정밀 하드웨어가 왜 유리한지의 물리적 근거'},
 {k:'ResNet50 INT8 추론', v:'3.89× 속도향상', d:'GTX 1080·TVM 컴파일러 기준(VGG-19는 3.32×, InceptionV3는 5.02×)'},
 {k:'HAWQv3 mixed-precision', v:'INT8 대비 최대 50% 추가 가속', d:'T4 GPU에서 INT4/INT8 혼합정밀을 실제 하드웨어에 배포해 측정한 값'},
 {k:'HAWQv2 탐색 속도', v:'RL 기반 대비 100배 이상', d:'2차 정보(Hessian trace)로 층별 민감도를 계산해 혼합정밀 비트폭을 자동 탐색'},
 {k:'BERT INT8-only 추론', v:'FP32 대비 최대 4.0×', d:'GELU·Softmax·LayerNorm까지 정수 연산으로 근사한 integer-only quantization'}
],

impact:'이 서베이는 새 SOTA를 만들지 않았지만 **어휘를 통일**했다. "calibration", "clipping range", "granularity", "QAT/PTQ" 같은 용어가 이 논문 이후 사실상의 공통어가 되면서, 후속 논문들은 매번 개념을 재정의하지 않고 자신의 위치를 좌표로 말할 수 있게 됐다. 또한 시뮬레이션 양자화(simulated/fake quantization)와 정수 전용 양자화(integer-only quantization)를 구분해, **저장만 줄이는 것과 실제 추론 속도를 얻는 것이 다른 문제**임을 분명히 한 것도 실무적으로 중요하다. 이 구분은 이후 GPTQ·AWQ가 전용 커널(TinyChat 등)을 논문의 일부로 함께 내놓는 관행의 배경이 된다.',

legacy:[
 '**PTQ 축의 만개** — 이 서베이가 정리한 PTQ 카테고리 안에서, [GPTQ](#/p/gptq)는 2차 정보(Hessian)로 clipping/rounding 오차를 사후 보정하는 방식으로, [AWQ](#/p/awq)는 활성값 통계로 클리핑 범위를 미리 조정하는 방식으로 각각 자리한다 — 둘 다 "재학습 없이 $S,Z$ 를 얼마나 잘 정할 것인가"라는 이 논문의 문제의식 위에 있다',
 '**혼합정밀에서 outlier 중심 관점으로** — 이 서베이가 다룬 mixed-precision quantization(민감한 층만 고비트 유지)은, [LLM.int8()](#/p/llm-int8)에 와서 "층"이 아니라 "차원(outlier feature)" 단위로 정밀도를 섞는 형태로 더 정교해진다',
 '**QAT/PTQ 경계의 재조합** — [QLoRA](#/p/qlora)는 백본을 PTQ 스타일로 4-bit(NF4) 고정하고 그 위에 소수의 LoRA 파라미터만 QAT처럼 학습시켜, 이 서베이의 이분법을 그대로 쓰기보다 두 축을 층위로 나눠 재조합한 사례다',
 '**per-channel/group의 세분화** — 이 서베이의 channelwise quantization이 LLM 시대에는 group size라는 구체적 숫자(64, 128)로 표준화되어 GPTQ·AWQ·QLoRA 세 논문 모두의 기본 설정에 그대로 등장한다'
],

pitfalls:[
 '**"non-uniform이 항상 더 정확하다"는 맞지만 실무 답은 아니다.** 논문 스스로 uniform quantization을 하드웨어 매핑 용이성 때문에 "de-facto 표준"이라 부른다. 정확도 표에서 non-uniform이 이겼다고 그 방법을 그대로 GPU 서빙에 쓸 수 있다는 뜻은 아니다.',
 '**시뮬레이션 양자화와 정수 전용 양자화를 같은 것으로 혼동하기 쉽다.** 가중치를 낮은 비트로 "저장"만 하고 연산은 float로 하는 fake quantization은 메모리는 줄지만 실제 연산 속도는 얻지 못한다. 속도 이득을 보려면 integer-only 커널이 필요하다.',
 '**이 서베이는 2021년 CNN·BERT 시대 문헌이 중심이다.** GPTQ·AWQ·LLM.int8()·QLoRA 같은 100B+ 규모 LLM 전용 기법은 이 논문 이후에 나왔고, 이 서베이가 그것들을 예견하거나 언급하지는 않는다. 다만 이 논문이 세운 좌표축은 그대로 유효해서 후속 기법들을 배치하는 틀로 여전히 쓸 수 있다.'
],

figures:[
 {f:'fig1-uniform-vs-nonuniform.png',
  cap:'왼쪽(uniform)은 계단의 높이(양자화 레벨 간 간격)가 전부 같고, 오른쪽(non-uniform)은 원점 근처에서 계단이 촘촘하고 바깥쪽으로 갈수록 넓어진다 — 값이 몰린 구간에 격자를 더 배치한 것. 주황 점이 실제로 쓰이는 양자화 레벨.',
  src:'원문 Figure 1, p.4'},
 {f:'fig4-qat-vs-ptq.png',
  cap:'왼쪽 QAT는 Quantization 다음에 Training data를 써서 Retraining/Finetuning을 한 번 더 거친다. 오른쪽 PTQ는 Calibration data로 Calibration만 하고 바로 Quantization으로 끝난다 — 박스 하나 차이가 재학습 비용 전체의 유무다.',
  src:'원문 Figure 4, p.8'}
],

quotes:[
 {t:'Moving from floating-point representations to low-precision fixed integer values represented in four bits or less holds the potential to reduce the memory footprint and latency by a factor of 16x.',
  src:'Abstract, p.1'},
 {t:'As such, the uniform quantization is currently the de-facto method due to its simplicity and its efficient mapping to hardware.',
  src:'Section III-F, p.7'}
],

links:[
 {t:'arXiv 2103.13630 — A Survey of Quantization Methods for Efficient Neural Network Inference', u:'https://arxiv.org/abs/2103.13630'},
 {t:'Jacob et al. 2018 — Quantization and Training of Neural Networks for Integer-Only Inference (본문이 인용하는 정수 전용 양자화의 대표 선행 연구)', u:'https://arxiv.org/abs/1712.05877'},
 {t:'PyTorch Quantization 공식 문서 (symmetric/asymmetric·per-channel 구현체)', u:'https://pytorch.org/docs/stable/quantization.html'}
]
});
