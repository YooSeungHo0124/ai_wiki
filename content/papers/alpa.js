WIKI.paper({
slug:'alpa',
venue:'OSDI 2022',
authors:'Zheng, Li, Xu, Huang et al. (UC Berkeley · Amazon Web Services · Google · SJTU)',
arxiv:'2201.12023',

tldr:'데이터·연산자·파이프라인 병렬을 사람이 손으로 조합하던 것을, **연산자 간 병렬(inter-op)** 과 **연산자 내 병렬(intra-op)** 두 계층으로 나눠 컴파일러가 자동으로 최적 조합을 찾게 만든 시스템. [Megatron-LM](#/p/megatron)의 손으로 짠 전략과 대등하거나 앞서는 성능을 모델 코드 수정 없이 얻는다.',

context:'대형 모델을 GPU 클러스터에 학습시키려면 데이터 병렬·연산자 병렬(텐서를 쪼개는 [Megatron](#/p/megatron) 식)·파이프라인 병렬을 조합해야 하는데, 기존 시스템은 이 조합을 **사람이 모델별로 손으로 설계**했다. [Megatron-LM](#/p/megatron)은 GPT류 모델에 특화된 수동 전략이라 다른 아키텍처(MoE, ResNet)에는 그대로 쓸 수 없고, [GSPMD](#/p/gspmd) 같은 자동 병렬화 컴파일러는 "어떻게 나눌지"를 하나의 평평한(flat) 탐색 공간에서 찾으려 해 탐색이 비싸다. 이 논문은 병렬화 방식을 **두 계층**으로 나누면 각 계층을 따로 거의 최적으로 풀 수 있다는 관찰에서 출발한다.',

ideas:[
 {h:'병렬화를 inter-operator와 intra-operator 두 계층으로 재분류한다',
  lead:'연산자를 쪼개 여러 장치에 나누는 것(intra-op)과, 그래프를 스테이지로 잘라 파이프라인으로 돌리는 것(inter-op)을 구분한다.',
  d:'intra-operator 병렬은 한 연산자를 텐서 축 방향으로 쪼개 여러 장치에 분산한다([Megatron](#/p/megatron)의 텐서 병렬, [GSPMD](#/p/gspmd)식 샤딩이 여기 속함) — 장치 활용도는 높지만 분할·병합마다 통신이 필요하다. inter-operator 병렬은 그래프를 이어붙은 스테이지로 잘라 서로 다른 장치 집합(device mesh)에 파이프라인으로 돌린다 — 스테이지 경계에서만 통신하지만 스케줄링 제약으로 장치가 노는 시간이 생긴다.'},
 {h:'intra-op 계층은 ILP로 device mesh 안에서 샤딩을 정한다',
  lead:'주어진 device mesh 위에서 한 스테이지의 실행 비용을 정수선형계획법(ILP)으로 최소화한다.',
  d:'같은 서버 안 GPU들처럼 고대역폭으로 묶인 device mesh 하나를 받으면, 그 안에서 각 연산자의 샤딩 스펙(어느 텐서 축을 몇 조각으로 나눌지)을 ILP로 풀어 통신·계산 비용의 합을 최소화한다. 고대역폭 연결에 통신이 잦은 intra-op을 배치하는 것이 핵심 전제다.'},
 {h:'inter-op 계층은 동적계획법으로 스테이지-메시 배정을 정한다',
  lead:'그래프를 몇 개의 스테이지로 자르고 클러스터를 몇 개의 device mesh로 나눠, 동적계획법(DP)으로 배정을 고른다.',
  d:'inter-op 컴파일 패스는 계산 그래프를 스테이지들로, 장치 클러스터를 mesh들로 슬라이스한 뒤 DP로 스테이지-메시 짝을 정한다. 각 배정 후보의 실행 비용은 그 스테이지에 대해 intra-op 패스를 호출해 얻는다 — **inter-op이 intra-op을 비용 함수처럼 반복 호출**하는 계층 구조다.'},
 {h:'두 계층을 분리해 각자 거의 최적으로 푼다',
  lead:'전역 최적은 보장하지 못해도, 계층별 근사 최적해의 조합이 실전에서 강한 성능을 낸다.',
  d:'비대칭적인 클러스터 대역폭(서버 내부는 빠르고 서버 간은 느림)을 그대로 활용해, intra-op을 고대역폭 구간에, inter-op을 저대역폭 구간에 배치하는 전제를 설계에 반영했다. 이 분리 덕분에 각 하위 문제(ILP, DP)가 다루기 쉬운 크기로 줄어든다.'}
],

diagram:{type:'compare', cap:'같은 계산 그래프(a)에 대해 기존 방식은 수동 설계 또는 한 종류의 병렬만 자동화하지만, Alpa는 두 계층을 계층적으로 조합한다.',
 left:{t:'기존: 단일 방식 또는 수동', items:['수동 전략(Megatron-LM)','또는 intra-op만 자동(Tofu)','또는 inter-op만 자동(DAPPLE)']},
 right:{t:'Alpa: 계층적 자동 조합', items:['inter-op: 스테이지-mesh 배정을 DP로','intra-op: mesh 안 샤딩을 ILP로','모델 코드 수정 없이 자동 생성']}
},

numbers:[
 {k:'테스트베드', v:'8노드 × 8GPU = 64 GPU', d:'Amazon EC2 p3.16xlarge, 노드 내 NVLink · 노드 간 표준 네트워크'},
 {k:'GPT 계열', v:'Megatron-LM과 대등·근소 우위', d:'0.35B~39B 파라미터 범위에서 손으로 짠 3D 병렬 전략과 맞먹는 처리량'},
 {k:'GShard MoE', v:'DeepSpeed 대비 3.5배(2노드) · 9.7배(4노드)', d:'전문가(expert) 병렬을 손으로 구현한 DeepSpeed 대비 속도 우위, 0.38B~70B 파라미터'},
 {k:'Wide-ResNet', v:'4노드에서 선형 확장 효율 80%', d:'특화 시스템이 없는 모델에서도 자동 생성 전략이 out-of-box로 동작'},
 {k:'평가 모델 규모', v:'최대 수백억 파라미터', d:'GPT-3 스타일·GShard MoE·Wide-ResNet 세 계열, FP16/FP32'}
],

impact:'"모델마다 병렬화 전략을 사람이 새로 설계한다"는 관행을, "컴파일러가 계층적으로 자동 생성한다"로 바꿨다. 특히 MoE처럼 [Megatron](#/p/megatron)류 수동 전략이 커버하지 못하는 아키텍처에서 손튜닝 시스템(DeepSpeed)을 능가하는 결과를 보여, 자동 병렬화가 특수 목적 수동 구현의 성능을 포기하지 않고도 일반성을 얻을 수 있음을 실증했다. 다만 계층 분리 자체가 근사이므로 전역 최적은 보장하지 않으며, 계산과 통신을 겹치는 스케줄링 최적화 등은 이후 과제로 남겼다.',

legacy:[
 '**계층적 자동 병렬화의 참조 설계** — inter/intra-op 분리라는 문제 정식화가 이후 대형 모델 학습 컴파일러·스케줄러 연구의 공통 어휘가 됨',
 '**[GSPMD](#/p/gspmd)와의 대비** — GSPMD가 단일 계층(주로 intra-op에 해당하는 샤딩 애노테이션)에서 자동화를 시도한 것과 달리, Alpa는 파이프라인 스테이지 분할까지 자동화 범위에 포함시킴',
 '**메모리 샤딩 계열과 직교하는 축** — [ZeRO](#/p/zero)·[FSDP](#/p/fsdp)가 최적화하는 "옵티마이저·파라미터 메모리 절감"과 Alpa가 최적화하는 "연산 배치·통신 최소화"는 서로 다른 축이라 실제 시스템에서는 결합해 쓰임',
 '**JAX 생태계의 대형 모델 학습 도구로 채택** — Alpa 프로젝트 자체가 이후 JAX 기반 대형 모델 학습 파이프라인의 구성 요소로 이어짐'
],

pitfalls:[
 '**전역 최적이 아니라 계층별 근사 최적이다.** intra-op과 inter-op을 분리해 풀기 때문에, 두 계층을 동시에 고려했을 때의 전역 최적 전략보다 못할 수 있다는 것을 저자들도 명시한다.',
 '**계산-통신 오버랩을 최적화하지 않는다.** Alpa는 정적 실행 계획을 생성할 뿐, 통신과 계산을 겹치는 세밀한 스케줄링은 다루지 않아 이 부분은 별도 최적화가 필요하다.',
 '**비용 모델의 정확도에 성능이 좌우된다.** ILP·DP 모두 예측된 실행 비용을 기반으로 최적화하므로, 하드웨어·커널 특성이 비용 모델과 어긋나면 생성된 계획이 실제로는 최적이 아닐 수 있다.'
],

figures:[
 {f:'fig1-parallelism-space.png',
  cap:'같은 계산 그래프 A→B→C→D에 대해 (b) 손으로 짠 계획, (c) intra-op만 자동화한 공간, (d) inter-op만 자동화한 공간, (e) Alpa가 실제로 탐색하는 계층 공간 — 바깥쪽은 inter-op으로 스테이지를 나누고(점선 상자), 그 안에서 intra-op으로 색(장치)을 배정한다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'Alpa is the first compiler that automatically generates parallel execution plans covering all data, operator, and pipeline parallelisms.',
  src:'Introduction, p.2'}
],

links:[
 {t:'arXiv 2201.12023 — Alpa: Automating Inter- and Intra-Operator Parallelism for Distributed Deep Learning', u:'https://arxiv.org/abs/2201.12023'},
 {t:'공식 저장소 (alpa-projects/alpa)', u:'https://github.com/alpa-projects/alpa'}
]
});
