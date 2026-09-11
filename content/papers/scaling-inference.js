WIKI.paper({
slug:'scaling-inference',
venue:'arXiv 2022 (Google)',
authors:'Pope, Douglas, Chowdhery, Devlin, Bradbury, Levskaya, Heek, Xiao, Agrawal, Dean (Google)',
arxiv:'2211.05102',

tldr:'500B+ 파라미터 모델을 실제로 서빙할 때 어떻게 여러 칩에 나눠 실행해야 하는지를 비용 모형으로 분석한 논문. 결론은 하나 — **지연시간이 목표인지 처리량이 목표인지에 따라 최적 분할 방식이 완전히 달라진다.**',

context:'2022년까지 대형 모델 연구는 [PaLM](#/p/palm)처럼 학습 스케일에 집중했지만, 학습과 추론은 완전히 다른 병목을 가진다. 학습은 시퀀스 전체를 한 번에 병렬로 처리하지만, 생성(decode)은 토큰을 하나씩 순차적으로 만들며 매 스텝마다 파라미터와 [KV 캐시](#/p/vllm)를 HBM에서 다시 읽어야 한다. 500B급 모델은 단일 칩 메모리에 들어가지 않으니 여러 칩에 쪼개야 하는데, 기존 [FasterTransformer](https://github.com/NVIDIA/FasterTransformer) 같은 서빙 스택은 텐서 병렬화 방식을 고정해 둔 채 칩 수만 늘리는 식이었다. 이 논문의 질문은 — 모델 크기·시퀀스 길이·칩 수·배치 크기가 바뀔 때 **어느 분할이 최적인지 미리 계산할 수 있는가**이다.',

ideas:[
 {h:'추론 비용을 지연시간·처리량·MFU 세 축으로 쪼갠다',
  lead:'prefill과 decode를 분리하고 각각을 칩-밀리초 비용과 지연시간으로 측정한다.',
  d:'추론을 입력 처리(prefill)와 토큰 생성(decode) 두 단계로 나눈다. prefill은 시퀀스 전체를 한 번에 행렬곱하므로 학습과 비슷하게 병렬적이지만, decode는 매 스텝 파라미터 전체를 다시 읽어야 해서 메모리 대역폭이 지배한다. 비용은 `칩-밀리초/토큰`, 효율은 이론적 최대 처리량 대비 실측 처리량인 `model FLOPS utilization(MFU)`로 잰다. 같은 모델도 이 두 지표에서 정반대 결론이 나올 수 있다.'},
 {h:'분할 전략을 배치 크기의 함수로 전환한다',
  lead:'1D/2D weight-stationary와 weight-gathered 사이를 배치 크기에 따라 전환한다.',
  d:'가장 단순한 `1D weight-stationary`(Megatron 방식)는 칩이 늘어나도 통신량이 줄지 않는다. 가중치를 두 축으로 나누는 `2D weight-stationary`는 통신 시간이 $O(1/\\sqrt{n_{chips}})$ 로 줄어 칩을 늘릴수록 계속 빨라진다. 배치가 아주 커지면 오히려 가중치를 칩 사이로 모으는 `weight-gathered(XYZ)` 방식이 더 싸진다 — **배치 크기가 커질수록 최적 분할이 바뀐다는 것 자체가 발견**이다.'},
 {h:'멀티쿼리 attention은 메모리 절약이 아니라 분할 자유도를 준다',
  lead:'Query 헤드는 쪼개고 K·V는 복제해, 적은 메모리 대역폭으로 배치를 더 키운다.',
  d:'[MQA](#/p/mqa)는 모든 Query 헤드가 K·V 헤드 하나를 공유해 KV 캐시를 $h$ 배(헤드 수) 줄인다. 이 논문은 여기서 한 걸음 더 나가, K·V를 각 칩에 통째로 복제하고 Query만 칩별로 쪼개는 분할을 제안한다. 그 결과 같은 칩 수에서 허용 가능한 컨텍스트 길이가 **최대 32배** 늘어난다. 단순히 파라미터가 준 게 아니라, 분할 설계가 바뀐 것.'},
 {h:'저지연·고처리량은 서로 다른 설정을 요구한다',
  lead:'대화형은 batch 1의 prefill과 batch 32~64의 decode를 섞어 쓴다.',
  d:'챗봇처럼 대화형 응답은 입력 처리(prefill)는 배치 1로 지연을 줄이고, 생성(decode)은 배치를 32~64까지 올려도 지연 손실이 거의 없어 처리량 이득만 챙긴다. 반대로 오프라인 대량 처리는 배치를 512까지 키워 MFU를 극대화한다. 같은 모델, 같은 칩 수라도 **목표(지연 vs 처리량)에 따라 배치와 분할 레이아웃을 다르게** 골라야 한다.'},
 {h:'int8 가중치 양자화로 메모리 대역폭 병목을 줄인다',
  lead:'저지연 구간에서는 가중치를 int8로 읽어 메모리 시간을 절반으로 줄인다.',
  d:'저배치 구간은 파라미터를 HBM에서 읽는 시간이 지배하므로, 가중치를 int8로 양자화하면 읽어야 할 바이트가 절반이 돼 지연이 줄어든다. 반대로 대배치·고처리량 구간에서는 이미 연산이 지배적이라 int8의 이점이 작고, 당시 int8 커널의 소프트웨어 최적화가 부족해 오히려 bfloat16을 쓴다. [LUT-GEMM](#/p/lut-gemm)·[SmoothQuant](#/p/smoothquant)가 다루는 양자화 커널 최적화는 이 지점을 더 밀어붙인 후속 연구다.'}
],

diagram:{type:'compare', cap:'같은 PaLM 540B를 같은 64개 TPU v4에 올려도 목표에 따라 설정이 완전히 달라진다(원문 Table 2 축약).',
 left:{t:'저지연 목표', items:['prefill 배치 1 · decode 배치 32','int8 가중치로 메모리 시간 절반','decode MFU 8~14%로 낮음']},
 right:{t:'고처리량 목표', items:['prefill·decode 배치 512','bfloat16 가중치 유지','decode MFU 33~37%']}
},

math:[
 {expr:'T_comm = 2·B·L·E / network_bandwidth',
  tex:'T_{\\text{comm}}=\\frac{2BLE}{\\text{network bandwidth}}',
  d:'1D weight-stationary 레이아웃의 통신 시간. 배치 $B$·시퀀스 길이 $L$·모델 차원 $E$ 에 선형으로 늘어나고 칩 수를 늘려도 줄지 않는 것이 문제의 핵심이다.'},
 {expr:'MFU = 실측 처리량 / 이론적 최대 처리량(peak FLOPS 가정)',
  tex:'\\text{MFU}=\\frac{\\text{observed throughput}}{\\text{theoretical peak-FLOPS throughput}}',
  d:'하드웨어가 이론적 최대 FLOPS로 아무 오버헤드 없이 돌았을 때와 비교한 비율. 메모리·통신 지연이 클수록 MFU가 낮아지므로, 이 논문은 분할 방식을 이 값으로 비교한다.'}
],

numbers:[
 {k:'저지연 decode', v:'29ms/토큰 · MFU 8~17%', d:'PaLM 540B, int8 가중치, 저배치 — Table 2 low-latency 열'},
 {k:'고처리량 decode/prefill', v:'MFU 최대 76%', d:'PaLM 540B, 대배치·bfloat16 — Figure 1/Table 2 high-throughput 열'},
 {k:'컨텍스트 길이 확장', v:'최대 32배', d:'멀티쿼리 attention 분할로 같은 칩 메모리에서 늘릴 수 있는 시퀀스 길이'},
 {k:'대화형 예시', v:'입력 64 + 캐시 1920 + 출력 64 → 1.9초', d:'PaLM 540B·int8, TPU v4 64칩, 컨텍스트 2048'},
 {k:'대량 처리 예시', v:'입력 1984 + 출력 64 → FLOPS 효율 73%', d:'같은 하드웨어, 오프라인 배치 처리 시나리오'},
 {k:'2D weight-stationary 통신', v:'$O(1/\\sqrt{n_{chips}})$', d:'1D 방식은 칩 수와 무관하게 일정 — 2D가 칩을 늘릴수록 계속 유리해지는 이유'}
],

impact:'이 논문 이후 "모델을 어떻게 학습할까"와 "모델을 어떻게 서빙할까"가 분리된 별도의 공학 분야로 굳어졌다. 지연시간과 처리량이라는 두 목표가 서로 다른 분할·배치·정밀도를 요구한다는 것을 정량적 비용 모형으로 보여줬고, TPU v4 3D 토폴로지에 맞춘 분할 레이아웃 설계가 이후 [vLLM](#/p/vllm)의 [PagedAttention](#/p/vllm) 같은 GPU 서빙 스택에도 같은 프레임(prefill/decode 분리, 배치 스케줄링)으로 이어졌다.',

legacy:[
 '**prefill/decode 분리**라는 관측이 이후 모든 서빙 스택의 기본 구조가 됨 — [vLLM](#/p/vllm)의 연속 배칭, [SGLang](#/p/sglang)의 스케줄러가 이 구분을 그대로 이어받음',
 '**멀티쿼리·그룹쿼리 계열**의 실전 효과를 처음 정량화 — [GQA](#/p/gqa)가 품질과 메모리를 절충하는 다음 단계로 이어짐',
 '**KV 캐시 관리** 문제의 중요성을 부각시켜 [H2O](#/p/h2o)의 축출, [StreamingLLM](#/p/streaming-llm)의 attention sink 같은 캐시 압축 연구가 뒤따름',
 '**저지연 디코딩** 병목은 이후 [Medusa](#/p/medusa)의 추측 디코딩, [QLoRA](#/p/qlora) 계열의 저정밀도 서빙으로 다른 각도에서 공략됨'
],

pitfalls:[
 '**"MFU가 높을수록 좋다"가 항상 맞지 않는다.** 저지연 목표에서는 MFU가 8~17%로 낮아도 그것이 최적 설정이다 — MFU는 처리량 목표에서만 의미 있는 지표다.',
 '**TPU v4 + 3D 토러스 토폴로지에 특화된 결과다.** 통신 비용 공식과 최적 분할 경계는 인터커넥트 구조에 의존하므로, GPU 클러스터에 그대로 옮기면 숫자가 달라진다.',
 '**int8이 항상 더 빠른 것은 아니다.** 저배치 구간에서만 메모리 대역폭 절약 효과가 크고, 대배치·고처리량 구간에서는 당시 int8 커널 최적화 부족으로 bfloat16보다 못했다.'
],

figures:[
 {f:'fig1-latency-cost.png',
  cap:'x축이 토큰당 지연시간(ms, 로그), y축이 칩-밀리초 비용(로그). 각 선이 하나의 모델·정밀도 조합이고, 점 위 라벨(C:칩 수, B:배치)이 커질수록 오른쪽(느려짐)으로 이동하며 비용은 낮아진다 — 같은 모델도 배치를 올리면 지연·비용 트레이드오프가 반대 방향으로 움직인다.',
  src:'원문 Figure 1(좌), p.2'}
],

quotes:[
 {t:'We develop a simple analytical model for inference efficiency to select the best multi-dimensional partitioning techniques optimized for TPU v4 slices based on the application requirements.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2211.05102 — Efficiently Scaling Transformer Inference', u:'https://arxiv.org/abs/2211.05102'}
]
});
