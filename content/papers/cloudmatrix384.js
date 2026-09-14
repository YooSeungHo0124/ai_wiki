WIKI.paper({
slug:'cloudmatrix384',
venue:'arXiv 2025 (Huawei Cloud, xDeepServe/XDS Team)',
authors:'xDeepServe (XDS) Team @ Huawei',
arxiv:'2508.02520',

tldr:'Huawei Cloud의 실제 프로덕션 MoE 서빙 시스템 보고서. 384장의 Ascend 910C NPU를 전역 공유 메모리로 묶은 CloudMatrix384 슈퍼팟 위에서, transformer를 attention·FFN·MoE 모듈로 쪼개 독립적으로 배치하는 "Transformerless" 아키텍처와 prefill/decode·MoE/attention 분리 서빙으로 칩당 2400 토큰/초, TPOT 약 50ms를 낸다.',

context:'MoE 모델(DeepSeek, Kimi, GLM, Qwen 등)은 토큰마다 일부 전문가만 활성화해 연산은 아끼지만, 수백 개 NPU에 걸친 세밀한 라우팅·동기화·부하 분산이 새로 필요해진다. 동시에 하드웨어는 "스케일 업"되고 있다 — CloudMatrix384는 384개 Ascend 910C 칩을 고대역폭 UB(UnifiedBus) 패브릭으로 전부 연결해 전역 공유 메모리 주소 공간을 제공하는 하나의 스케일업 도메인이다. 문제는 기존 LLM 서빙 시스템이 이런 "수백 NPU가 균일한 저지연으로 서로의 메모리에 접근할 수 있는" 하드웨어 특성을 활용하도록 설계되지 않았다는 점이다. [vLLM](#/p/vllm)·[SGLang](#/p/sglang) 같은 시스템이 다루는 것은 대체로 단일 GPU 서버 또는 소규모 클러스터 규모이고, MoE의 세밀한 라우팅과 슈퍼팟 규모의 자원 분리(disaggregation)를 동시에 다루는 프로덕션 사례는 드물다.',

ideas:[
 {h:'Transformerless: transformer를 모듈로 쪼개 독립 배치한다',
  lead:'attention·FFN·MoE를 서로 다른 NPU 그룹에 독립적으로 배치해 각각 따로 확장한다.',
  d:'하나의 transformer 레이어를 attention·feedforward·MoE라는 모듈 단위로 분해하고, 각 모듈을 전용 NPU 집합에서 독립적으로 실행한다. Prefill과 decode를 분리 배치하고(§5.1), 더 나아가 MoE 전문가와 attention까지 서로 다른 NPU에 분리 배치한다(§5.2). MoE는 무상태(stateless)이고 배치 크기에 따라 연산량이 늘지만, attention은 KV 캐시를 들고 있고 시퀀스 길이에 따라 늘어나 서로 다른 확장 특성을 가진다 — 이 비대칭을 한 덩어리로 묶어 서빙하는 대신 모듈 단위로 쪼개 각자의 자원 배분을 독립적으로 조정한다.'},
 {h:'XCCL: 마이크로초 단위 메모리 시맨틱 통신',
  lead:'UB 패브릭의 전역 공유 메모리 위에서 30만개 이상 NPU 쌍 간 point-to-point/all-to-all 통신을 제공한다.',
  d:'분리 배치가 성립하려면 모듈 간 데이터(예: attention 출력을 MoE로 보내는 A2E, MoE 결과를 attention으로 돌려주는 E2A)가 빠르게 오가야 한다. XCCL은 CloudMatrix384의 분산 공유 메모리 위에 구축된 통신 라이브러리로, 마이크로초 수준의 point-to-point와 all-to-all 프리미티브를 30만개 이상의 NPU 쌍에 걸쳐 제공한다. MoE dispatch/combine 통신 전체 지연의 약 36%를 차지하지만(칩 간 고대역폭 덕에), 이 전역 동기화 커널은 최대/최소 지연 편차가 10배까지 벌어지는 변동성을 보인다 — MLA 계산의 불균형이 dispatch에, MoE 전문가 간 불균형이 combine에 각각 흡수되기 때문이다.'},
 {h:'trampoline 라우팅으로 비대칭 NPU 배분을 흡수한다',
  lead:'MoE-attention을 분리하면 두 그룹의 NPU 수가 다른데, 이를 2단계 중계로 해결한다.',
  d:'DeepSeek-V3/R1을 768개 NPU die에 배치할 때 288개는 MoE, 480개는 attention을 맡는 식으로 **수가 다르다**. 단순 pull 방식으로는 이 비대칭이 비효율을 만든다. trampoline forward는 attention NPU 수와 맞춘 일부 MoE NPU가 먼저 데이터를 받아 나머지 MoE NPU로 중계하는 2단계 라우팅(A2E→A2E\', E2A→E2A\')으로 메타데이터 오버헤드를 줄이고 대역폭을 고르게 쓴다. 여기에 DP(데이터 병렬) 도메인이라는 추상화를 더해, 마이크로배칭만으로는 감당하기 어려운 도메인 간 병렬성(inter-DP)과 도메인 내부 병렬성(intra-DP)을 분리해 관리한다.'},
 {h:'Multi-Token Prediction과 INT8 양자화로 효율을 더 짜낸다',
  lead:'MTP 수용률 약 90%를 실측하고, FP8 미지원 하드웨어 특성에 맞춰 INT8 양자화를 적용한다.',
  d:'FlowServe는 MTP를 분리된 Prefill-Decode 파이프라인에 통합해, decode 반복마다 MTP forward와 본 모델 forward를 함께 수행한다. 실측 MTP 수용률은 DP 전체 평균 약 90%다. 또한 Ascend 910C가 FP8 연산을 네이티브로 지원하지 않는다는 하드웨어 제약 때문에, [FP8](#/p/fp8) 대신 DeepSeek 모델에 INT8 양자화를 적용해 처리량을 끌어올린다 — 하드웨어의 실제 제약이 소프트웨어 선택을 좌우하는 전형적 사례다.'}
],

diagram:{type:'flow', cap:'decode 경로의 모듈 분리. attention과 MoE가 서로 다른 NPU 그룹에서 실행되고 XCCL이 그 사이를 중계한다.',
 nodes:[
  {t:'요청 스케줄러', s:'Job Executor'},
  {t:'Attention TE', s:'480개 NPU die', a:'A2E'},
  {t:'XCCL 통신', s:'trampoline 중계', acc:true},
  {t:'MoE Expert TE', s:'288개 NPU die', a:'E2A'},
  {t:'출력 토큰', s:'~50ms TPOT'}
 ]},

math:[
 {expr:'effective TPOT = (forward_time + sched_gap) / MTP_accept_len',
  tex:'\\text{effective TPOT} = \\frac{\\text{forward\\_time} + \\text{sched\\_gap}}{\\text{MTP accept length}}',
  d:'실측값: forward 약 93ms + 스케줄링 간격 2ms를 MTP 수용 길이 1.9로 나누면 $95/1.9\\approx 50$ ms — 이것이 보고된 TPOT의 실제 산출식이다.'}
],

numbers:[
 {k:'칩당 decode 처리량', v:'2400 토큰/초', d:'peak decoding 설정, TPOT 약 50ms, 다이당 배치 60(칩당 2다이 기준 2×60)'},
 {k:'DP288 시스템 전체 처리량', v:'약 345K 토큰/초', d:'18개 910C 서버·288 NPU die, colocated prefill-decode, DP288/EP288 설정'},
 {k:'MTP 수용률', v:'약 90% (모든 DP 평균)', d:'MTP 레이어 1개, greedy sampling'},
 {k:'분리 MoE-Attention 배치', v:'768 NPU die 중 MoE 288 · attention 480', d:'DeepSeek-V3/R1, 3개 DP 도메인×160 DP 그룹'},
 {k:'디스패치 지연 목표', v:'SuperPod 전역에서 200μs 이하', d:'trampoline 라우팅·persistent kernel 스케줄링 적용 후'},
 {k:'SLA 목표 (프로덕션)', v:'TTFT 2초 이하 · TPOT 35ms (대부분)', d:'DeepSeek-R1은 입력 최대 96K, 추론토큰 32K, 출력 32K까지 지원(128K 컨텍스트 한도 내)'},
 {k:'SuperPod 규모', v:'48서버 · 384 Ascend 910C 칩(768다이)', d:'UB 패브릭이 전역 공유 메모리로 전 칩을 all-to-all 연결, RoCE 대비 수배 높은 대역폭'}
],

figures:[
 {f:'fig2-hardware.png',
  cap:'(a) CloudMatrix384 클러스터 — 48개 서버가 각각 CPU·NIC·8개 NPU를 갖고 VPC(초록)·RoCE(빨강)·UB(파랑) 세 종류의 네트워크로 연결된다. UB가 전역 공유 메모리를 만드는 스케일업 패브릭이다. (b) 910C 칩 내부 — Die 0·1 각각에 AI Cube(행렬 연산)·AI Vector(벡터 연산)·통합 버퍼·MTE2/MTE3 메모리 전송 엔진이 있고, 이들이 UB를 통해 다른 NPU의 온칩 메모리를 직접 읽고 쓴다.',
  src:'원문 Figure 2, p.6'}
],

impact:'이 위키에 흔치 않은 실제 프로덕션 서빙 시스템의 1차 보고서다. 학술 논문이 제안하는 단일 기법이 아니라, 1년 넘게 실서비스로 돌아간 시스템(DeepSeek·Kimi·GLM·Qwen 등을 실제로 서빙)의 아키텍처·수치·실패 처리까지 담았다는 점에서 다른 논문들과 성격이 다르다. 핵심 주장은 MoE 서빙의 병목이 순수 알고리즘이 아니라 **하드웨어-소프트웨어 공동설계**의 문제라는 것 — UB 패브릭이라는 특정 하드웨어의 전역 공유 메모리 성질이 없었다면 Transformerless의 모듈 단위 분리 배치도, trampoline 라우팅의 저지연 중계도 성립하지 않는다.',

legacy:[
 '**prefill/decode 분리 서빙의 슈퍼팟 규모 실증** — [vLLM](#/p/vllm)·DistServe 등이 제안한 아이디어를 384칩·수백 NPU die 규모로 프로덕션 검증',
 '**MoE-Attention 분리라는 한 단계 더 나아간 분해** — prefill/decode 분리를 넘어, 연산 특성이 다른 MoE와 attention까지 별도 자원 풀로 쪼개는 설계가 이후 대규모 MoE 서빙 시스템의 참조 사례가 됨',
 '**비-NVIDIA 하드웨어(Ascend NPU) 위의 대규모 서빙 사례** — FP8 미지원 같은 하드웨어 특성이 시스템 설계(INT8 채택)에 미치는 영향을 구체적으로 문서화'
],

pitfalls:[
 '**2400 토큰/초·TPOT 50ms는 특정 설정(고정 2K+2K 워크로드, greedy sampling, ignore-eos, 특정 DP/EP 구성)에서의 실측치다.** 실제 프로덕션 트래픽(가변 길이, 다양한 SLA)에서는 다른 숫자가 나올 수 있으며, 논문 스스로도 프로덕션 워크로드를 별도 절(§7.2)로 다룬다.',
 '**UB 패브릭·Ascend 910C라는 특정 하드웨어에 강하게 결합된 설계다.** XCCL·trampoline 라우팅 같은 기법은 전역 공유 메모리라는 전제가 있어야 성립하므로, 다른 상호연결(예: 일반 RoCE 클러스터)에 그대로 이식하기는 어렵다.',
 '**저자가 "xDeepServe Team @ Huawei"로 익명화된 회사 리포트다.** 동료 심사를 거친 학술 논문이 아니라 회사의 기술 보고서 형식이므로, 수치의 재현성이나 독립 검증은 외부 학술 논문과 같은 기준으로 보기 어렵다.'
],

links:[
 {t:'arXiv 2508.02520 — Huawei Cloud Model-as-a-Service on the CloudMatrix384 SuperPod', u:'https://arxiv.org/abs/2508.02520'}
]
});
