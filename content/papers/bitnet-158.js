WIKI.paper({
slug:'bitnet-158',
venue:'arXiv 2024 (Microsoft Research)',
authors:'Shuming Ma, Hongyu Wang, Furu Wei et al. (Microsoft Research)',
arxiv:'2402.17764',

tldr:'[BitNet](#/p/bitnet)의 1비트 가중치에 0을 하나 더 허용해 **삼진({-1,0,1})**으로 바꾼 논문. 가중치가 정수 세 값뿐이라 행렬곱의 곱셈이 사실상 사라지고, **같은 모델 크기·같은 학습 토큰 수**로 비교했을 때 FP16 Transformer와 동등한 성능을 보인다고 주장한다.',

context:'[BitNet](#/p/bitnet)은 가중치를 $\\pm1$ 두 값으로 이진화해 학습부터 낮은 정밀도를 겪게 하는 데 성공했지만, 순수 이진 가중치는 표현력이 제한적이라 성능 격차가 완전히 닫히지는 않았다. 이 논문의 질문은 단순하다 — **한 비트를 더 안 쓰고, 그 사이 어딘가에서 표현력과 효율의 균형점을 찾을 수 있는가?** 답은 $0$ 이라는 세 번째 값이다. 0을 허용하면 가중치가 "이 입력을 아예 무시한다"를 표현할 수 있어 명시적인 **특성 선택(feature filtering)** 이 가능해지고, 삼진 곱셈은 부호에 따라 더하거나 빼거나 건너뛰는 것으로 환원되어 곱셈이 여전히 필요 없다.',

ideas:[
 {h:'삼진 가중치: {-1, 0, 1}',
  lead:'가중치에 0을 추가해 부호뿐 아니라 "무시"까지 표현할 수 있게 한다.',
  d:'가중치를 평균이 아니라 **전체 절댓값의 평균**으로 나눈 뒤 반올림해 $\\{-1,0,1\\}$ 로 양자화한다(absmean quantization). $0$ 이 하나 늘었을 뿐이지만, 이 값을 가진 가중치는 해당 입력 차원을 곱셈·덧셈 계산에서 완전히 빼버릴 수 있어 [BitNet](#/p/bitnet)의 순수 이진 가중치보다 표현력이 넓어진다.'},
 {h:'1.58비트라는 이름의 유래',
  lead:'세 가지 값을 구분하는 데 필요한 정보량이 $\\log_2 3 \\approx 1.58$ 비트다.',
  d:'$n$ 개의 서로 다른 값을 이진수로 표현하려면 $\\log_2 n$ 비트가 필요하다. 값이 두 개($\\pm1$)면 정확히 1비트지만, 세 개($-1,0,1$)면 $\\log_2 3 \\approx 1.585$ 비트가 필요하다 — 1비트와 2비트 사이의 어중간한 자리다. "1.58비트 LLM"이라는 제목은 이 정보이론적 계산을 그대로 딴 것이다.'},
 {h:'행렬곱이 덧셈·뺄셈·건너뛰기로 바뀐다',
  lead:'가중치가 정수 세 값뿐이라 곱셈 없이 더하거나 빼거나 아무것도 안 하면 된다.',
  d:'$Y=WX$ 에서 $W$ 의 각 원소가 $-1,0,1$ 이면 곱셈 $W_{ij}X_j$ 는 $-X_j$, $0$, $X_j$ 세 경우로 끝난다. FP16의 "곱한 뒤 더하기"가 "더하거나 빼거나 아무것도 안 하기"로 바뀌면서, 전용 하드웨어에서는 곱셈기 자체가 필요 없는 연산 패턴이 된다.'},
 {h:'LLaMA 호환 구성요소로 갈아끼운다',
  lead:'RMSNorm·SwiGLU·RoPE 등 LLaMA식 구성요소를 채택해 오픈소스 생태계에 바로 얹는다.',
  d:'[BitNet](#/p/bitnet)과 달리 BitNet b1.58은 [LLaMA](#/p/llama)류 구조를 그대로 따르면서 `nn.Linear`만 삼진 `BitLinear`로 바꾼다. 그 덕분에 Huggingface·vLLM·llama.cpp 같은 기존 오픈소스 도구에 최소한의 수정만으로 편입될 수 있다고 저자들은 강조한다.'}
],

diagram:{type:'compare', cap:'같은 곱셈 Y=WX 를 계산하는 두 방식. 삼진 가중치는 곱셈기 없이 덧셈/뺄셈 회로만으로 계산된다.',
 left:{t:'FP16 Transformer', items:['가중치 16비트 실수','모든 원소쌍에 곱셈 필요','GPU 곱셈기 자원 소모']},
 right:{t:'BitNet b1.58 (삼진)', items:['가중치 {-1,0,1}만','곱셈 대신 덧셈/뺄셈/스킵','전용 저전력 하드웨어 여지','acc:true']}},

math:[
 {expr:'W~ = RoundClip(W / (mean(|W|)+ε), -1, 1)',
  tex:'\\widetilde{W}=\\text{RoundClip}\\!\\left(\\frac{W}{\\gamma+\\epsilon},\\,-1,\\,1\\right),\\qquad \\gamma=\\text{mean}(|W|)',
  d:'가중치 전체의 절댓값 평균 $\\gamma$ 로 나눈 뒤 반올림·클리핑해 $\\{-1,0,1\\}$ 로 만든다. [BitNet](#/p/bitnet)의 부호 함수(2값)와 달리 3값을 만드는 absmean 양자화다.'},
 {expr:'#bits = log2(3) ≈ 1.58',
  tex:'\\#\\text{bits}=\\log_2 3 \\approx 1.58',
  d:'세 가지 상태를 구분하는 데 필요한 최소 정보량. "1.58비트 LLM"이라는 이름 그대로다.'}
],

numbers:[
 {k:'perplexity 동등 시작점', v:'3B (모델 크기), 100B 토큰', d:'같은 크기·같은 학습 토큰 수(RedPajama, 100B)에서 BitNet b1.58 3B가 LLaMA 3B와 같은 perplexity(9.91 vs 10.04)'},
 {k:'GPU 메모리 절감 · 3B', v:'3.55배 감소', d:'2.22GB vs LLaMA 7.89GB'},
 {k:'지연시간 절감 · 3B', v:'2.71배 빠름', d:'1.87ms vs LLaMA 5.07ms (per output token)'},
 {k:'70B 처리량', v:'8.9배', d:'같은 A100 두 장에서 배치 크기를 11배(176 vs 16)까지 키울 수 있어 처리량 2977 vs 333 tokens/s'},
 {k:'70B 지연시간', v:'4.1배 빠름', d:'모델이 커질수록 nn.Linear 비중이 커져 절감폭도 커짐 (Figure 2)'},
 {k:'행렬곱 에너지 절감 (7nm)', v:'71.4배', d:'[Hor14] 에너지 모델 기준 arithmetic 연산 에너지'}
],

impact:'"삼진 가중치가 같은 크기·같은 토큰 수 조건에서 FP16과 동등하다"는 주장은 **모델 크기와 학습 토큰 수가 같을 때만** 성립하는 조건부 결과다. 3B보다 작은 모델(700M, 1.3B)에서는 BitNet b1.58이 LLaMA보다 perplexity가 오히려 나쁘고, 3B에서 "따라잡기" 시작해 3.9B에서 앞선다. 이 논문은 **낮은 비트 수가 곧 성능 손실이라는 통념을 깨고**, 정밀도 대신 모델 크기·데이터로 트레이드오프를 옮길 수 있음을 보여 1비트 LLM을 하나의 스케일링 축으로 자리잡게 했다.',

legacy:[
 '**전용 하드웨어 요구 촉발** — 곱셈이 없는 연산 패턴은 저자들이 논문에서 직접 "1비트 LLM 전용 하드웨어(LPU 등)"를 요청하는 근거가 됨',
 '**BitNet 계열의 표준 참조점** — 이후 1비트/저비트 LLM 연구 대부분이 이 논문의 "3B에서 동률" 결과를 기준선으로 인용',
 '**llama.cpp·vLLM 등 오픈소스 추론 스택에 커널 통합 시도** — LLaMA 호환 설계 덕분에 기존 서빙 파이프라인에 최소 수정으로 편입',
 '**absmean 삼진화가 이후 저비트 양자화 연구의 참조 레시피가 됨**'
],

pitfalls:[
 '**"항상 FP16과 동등하다"가 아니다.** 700M·1.3B 같은 작은 크기에서는 BitNet b1.58의 perplexity가 LLaMA보다 나쁘다. "동등"은 **3B 이상, 같은 학습 토큰 수(100B)** 라는 조건이 붙는다.',
 '**1.58비트는 저장 단위가 아니라 정보량이다.** 실제 GPU 커널은 2비트 단위로 패킹해 계산하므로(논문도 2-bit 커널을 사용), 디스크·메모리상 압축률이 문자 그대로 1.58배인 것은 아니다.',
 '**비교 대상은 저자들이 직접 재현한 LLaMA다.** 공개된 LLaMA 체크포인트를 그대로 쓴 것이 아니라 같은 데이터·설정으로 다시 학습시킨 버전과 비교했다는 점을 감안해야 한다.'
],

figures:[
 {f:'fig1-ternary.png',
  cap:'위: 삼진 가중치 행렬(왼쪽)과 FP16 가중치 행렬(오른쪽)을 나란히 놓은 개념도. 아래: 같은 Y=WX 계산에서 FP16은 "곱한 뒤 더하기"(빨간 글씨)가 필요하지만 삼진 가중치는 "곱셈 없는 덧셈"만으로 끝난다는 것을 보여준다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'It matches the full-precision (i.e., FP16 or BF16) Transformer LLM with the same model size and training tokens in terms of both perplexity and end-task performance, while being significantly more cost-effective in terms of latency, memory, throughput, and energy consumption.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2402.17764 — The Era of 1-bit LLMs', u:'https://arxiv.org/abs/2402.17764'},
 {t:'BitNet (원조 1비트 논문)', u:'https://arxiv.org/abs/2310.11453'}
]
});
