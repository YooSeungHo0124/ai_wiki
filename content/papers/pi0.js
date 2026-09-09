WIKI.paper({
slug:'pi0',
venue:'arXiv 2024 (Physical Intelligence)',
authors:'Black, Brown, Driess, Esmail, Finn, Groom, Hausman, Ichter, Levine, Pertsch, Vuong et al. (Physical Intelligence)',
arxiv:'2410.24164',

tldr:'사전학습된 VLM에 **flow matching으로 연속 행동을 생성하는 별도의 action expert**를 붙여, 세탁물 개기·상자 조립 같은 최대 50Hz 고빈도 양팔 조작까지 다루는 범용 로봇 정책. 서로 다른 로봇 7종·68개 과제를 하나의 모델로 학습했다.',

context:'[RT-2](#/p/rt2)와 [OpenVLA](#/p/openvla)는 행동을 256개 구간으로 이산화해 언어모델처럼 토큰 하나씩 자기회귀로 예측한다. 이 방식은 웹 VLM의 인프라를 그대로 재사용할 수 있지만 두 가지 한계가 뚜렷하다. 첫째, 토큰을 순차적으로 하나씩 뽑는 구조는 세탁물 개기처럼 **손가락 단위의 정밀하고 매끄러운 고빈도 제어**에 적합하지 않다. 둘째, 이산화된 256구간 해상도로는 [ACT](#/p/act)·[Diffusion Policy](#/p/diffusion-policy)가 보여준 것 같은 부드러운 궤적을 표현하기 어렵다. 한편 [Diffusion Policy](#/p/diffusion-policy)는 정밀한 연속 행동을 잘 생성하지만 처음부터 로봇 데이터로만 학습해 웹 지식의 전이가 없다. π0의 질문은 이 둘을 어떻게 합칠 것인가다 — **VLM의 의미 이해와 diffusion 계열의 정밀한 연속 제어를 동시에 가질 수는 없는가?**',

ideas:[
 {h:'Action expert: VLM에 붙는 별도의 작은 흐름 모델',
  lead:'PaliGemma 3B 본체에 300M 파라미터짜리 전용 action expert를 얹어 연속 행동을 flow matching으로 생성한다.',
  d:'VLM 본체(SigLIP 400M + Gemma 2.6B, 합쳐 PaliGemma 3B)는 이미지·언어를 처리하고, 로봇 상태·행동 토큰은 별도 가중치 집합인 action expert가 처리한다. 이는 Transfusion이라는 최근 아키텍처를 확장한 것으로, 이산 토큰(cross-entropy)과 연속 토큰(flow matching loss)을 한 트랜스포머 안에서 각기 다른 목적함수로 학습시키는 구조다. 논문은 이를 두 요소짜리 mixture-of-experts에 비유한다.'},
 {h:'Flow matching으로 행동 청크를 한 번에 생성',
  lead:'토큰 하나씩이 아니라 미래 50스텝 행동 전체(H=50)를 노이즈에서 반복 적분해 만든다.',
  d:'자기회귀 방식처럼 행동을 한 스텝씩 뽑지 않고, 가우시안 노이즈에서 시작해 [Flow Matching](#/p/flow-matching)의 벡터장을 여러 번 적분(forward Euler)해 행동 청크 전체를 한 번에 생성한다. action expert는 완전 양방향 attention을 써서 청크 내 모든 행동 토큰이 서로를 참조하며, 이 구조 덕분에 최대 50Hz까지의 고빈도 제어가 가능해진다. [Diffusion Policy](#/p/diffusion-policy)의 DDPM식 반복 노이즈 제거와 목적은 같지만, flow matching은 직선 경로(optimal transport)를 목표로 해 적은 적분 스텝으로도 수렴한다.'},
 {h:'사전학습/후속학습 분리 레시피',
  lead:'LLM의 pretraining-posttraining 구도를 그대로 가져와 다양성 우선 사전학습과 품질 우선 후속학습을 분리한다.',
  d:'사전학습 데이터는 [Open X-Embodiment](#/p/openvla)의 하위집합("OXE Magic Soup")과 자체 수집 데이터를 섞어 **다양성**을 극대화한다 — 서투른 시연이라도 실수 회복 패턴을 배우게 한다. 후속학습 데이터는 훨씬 적지만 **일관되고 능숙한** 시연만 골라, 실제 배포 시 매끄럽고 신뢰도 높은 실행을 만든다. 두 단계를 분리하지 않고 처음부터 고품질 데이터만 쓰면 오히려 다양한 상황에서의 견고함이 떨어진다는 것이 실험으로 확인됐다.'},
 {h:'7개 로봇 embodiment를 하나의 모델로',
  lead:'단일팔·양팔·이동형 매니퓰레이터까지 서로 다른 자유도의 로봇 7종을 동시에 학습시킨다.',
  d:'로봇마다 자유도(7~18 DoF)와 카메라 수가 다르므로, 상태·행동 벡터를 데이터셋에서 가장 큰 로봇 기준(18차원)으로 통일하고 부족한 로봇은 제로 패딩한다. 이렇게 하나의 가중치로 UR5e·Trossen·ARX·Fibocom 등 서로 다른 하드웨어를 동시에 제어할 수 있어, 로봇마다 별도 정책을 학습시키던 관행을 깬다.'},
 {h:'세탁물 개기: 수십 분짜리 다단계 과제',
  lead:'후속학습으로 5~20분 길이의 세탁물 개기·박스 조립 같은 장기 다단계 과제를 수행한다.',
  d:'옷의 초기 상태가 임의적이고 여러 벌을 순서대로 접어야 하는 세탁물 개기는 물리적 정교함과 조합적 복잡성이 동시에 필요한 과제다. 논문은 이를 "end-to-end 로봇 학습 문헌에서 가장 긴 dexterous task"라고 주장하며, 필요시 고수준 VLM이 "다음에 무엇을 집을지" 같은 하위 지시를 π0에 내려주는 계층 구조([SayCan](#/p/saycan)과 유사한 역할 분담)로 보완한다.'}
],

diagram:{type:'split', cap:'하나의 트랜스포머 안에서 이미지·언어는 PaliGemma 경로로, 로봇 상태·행동은 action expert 경로로 각기 다른 가중치·손실 함수로 처리된다.',
 from:{t:'입력', s:'이미지+언어+로봇상태'},
 branches:[
  {t:'PaliGemma 경로', s:'SigLIP+Gemma 2.6B'},
  {t:'Action Expert', s:'300M, flow matching'}
 ],
 join:'두 경로가 같은 attention에서 상호작용, 행동 청크 H=50 출력'},

math:[
 {expr:'L(θ) = E[ ||v_θ(A_t^τ, o_t) − (A_t − ε)||² ],  A_t^τ = τA_t + (1−τ)ε, ε~N(0,I)',
  tex:'\\mathcal{L}^{\\tau}(\\theta)=\\mathbb{E}_{p(A_t|o_t),\\,q(A_t^{\\tau}|A_t)}\\left\\lVert v_{\\theta}(A_t^{\\tau}, o_t) - u(A_t^{\\tau}|A_t)\\right\\rVert^2,\\quad u(A_t^{\\tau}|A_t)=A_t-\\epsilon',
  d:'조건부 flow matching 손실. 노이즈 $\\epsilon$과 실제 행동 청크 $A_t$를 선형으로 섞은 "noisy action" $A_t^\\tau$에서, 네트워크가 원래 노이즈를 향하는 벡터장 $u$를 맞히도록 학습한다. 추론 시 $\\tau=0$에서 $1$까지 Euler 적분하며 노이즈를 실제 행동으로 변환한다.'}
],

numbers:[
 {k:'총 파라미터', v:'3.3B', d:'PaliGemma 3B(SigLIP 400M+Gemma 2.6B) + action expert 300M'},
 {k:'행동 청크 길이', v:'H = 50', d:'최대 제어 주파수 50Hz까지 지원'},
 {k:'사전학습 규모', v:'10,000시간 이상의 로봇 데이터', d:'자체 수집 903M timestep + OXE 9.1%'},
 {k:'로봇 embodiment 수', v:'7종 구성 · 68개 과제', d:'단일팔·양팔·이동형 매니퓰레이터 포함'},
 {k:'out-of-box 평가', v:'셔츠 개기 등에서 최고 성능', d:'160k step "parity" 버전도 OpenVLA·Octo baseline 전부를 앞섬'},
 {k:'OpenVLA 대비', v:'같은 데이터로 학습해도 큰 격차', d:'OpenVLA는 자기회귀 이산화라 action chunk를 지원하지 않아 부진'}
],

impact:'π0는 "VLA = 자기회귀 토큰 예측"이라는 [RT-2](#/p/rt2) 이후의 암묵적 공식에 균열을 냈다. 행동 생성부를 별도 모듈로 분리해 flow matching이라는 [Diffusion Policy](#/p/diffusion-policy) 계열의 강점(정밀도·고빈도·매끄러움)과 VLM 사전학습의 강점(의미 이해·일반화)을 동시에 취할 수 있음을 실증했다. 사전학습/후속학습 분리라는 LLM식 레시피를 로봇 파운데이션 모델에 명시적으로 도입한 것도, 이후 로봇 학습 프로젝트들이 데이터를 "다양성용"과 "품질용"으로 나눠 설계하는 관행에 영향을 줬다.',

legacy:[
 '**연속 행동 생성이 VLA의 주류 선택지로 부상** — 이후 로봇 파운데이션 모델 다수가 이산 토큰 대신 flow matching/diffusion 기반 action head를 채택',
 '**pretrain/posttrain 분리가 로봇 데이터 설계 원칙으로 확산** — "다양하지만 서투른 데이터"와 "적지만 능숙한 데이터"를 구분하는 설계가 이후 연구의 기본 틀이 됨',
 '**cross-embodiment 단일 모델 학습의 실증 사례 확대** — 자유도가 다른 로봇들을 제로 패딩으로 통일해 하나의 가중치로 다루는 접근이 후속 로봇 파운데이션 모델에 재사용',
 '**action expert라는 이름의 모듈 분리 패턴 정착** — VLM 본체와 저수준 제어기를 분리하되 하나의 트랜스포머 안에서 함께 학습시키는 설계가 이후 변형 연구의 출발점이 됨'
],

pitfalls:[
 '**π0-small(VLM 사전학습 없음) 비교는 완벽한 대조군이 아니다.** 논문도 명시하듯 π0-small은 파라미터 수도 더 작아, VLM 사전학습의 순수한 기여만 분리해서 측정한 것이 아니라 크기 효과가 섞여 있다.',
 '**"최대 50Hz"는 이 논문의 특정 로봇·과제 조건에서 나온 상한이다.** 다른 하드웨어·컨트롤러 지연에서 동일한 주파수가 재현된다는 보장은 없고, 실제 배포 시스템의 엔드투엔드 지연은 별도로 측정해야 한다.',
 '**성공률 대신 "평균 task progress(부분 점수)"로 채점한 과제가 많다.** bussing 점수는 "올바른 통에 넣은 물체 비율"처럼 정의되어, 이진 성공률을 쓰는 [RT-2](#/p/rt2)·[OpenVLA](#/p/openvla) 수치와 그대로 비교할 수 없다.'
],

figures:[
 {f:'fig3-architecture.png',
  cap:'왼쪽 π 데이터셋과 인터넷 사전학습·OXE가 합쳐져 파란색 pre-trained VLM(SigLIP 400M + Gemma 2.6B)으로 들어간다. 오른쪽 초록 action expert(300M)가 로봇 상태 $q_t$와 노이즈를 입력받아 미래 행동 청크 $a_t \\ldots a_{t+H}$를 출력한다 — 두 색이 같은 트랜스포머 안에서 서로 다른 가중치 집합임을 보여준다.',
  src:'원문 Figure 3, p.4'},
 {f:'fig7-outofbox-results.png',
  cap:'다섯 과제(셔츠 개기~토스트 꺼내기) 각각에서 진한 파랑(π0 전체 학습)이 거의 모든 baseline을 크게 앞선다. 흰 테두리 막대(π0-parity, 160k step만 학습)조차 보라색 OpenVLA·초록 Octo보다 높다는 점이 "학습량이 아니라 아키텍처·레시피 차이"라는 논문의 주장을 뒷받침한다.',
  src:'원문 Figure 7, p.8'}
],

quotes:[
 {t:'We propose a novel flow matching architecture built on top of a pre-trained vision-language model (VLM) to inherit Internet-scale semantic knowledge.',
  src:'Abstract, p.1'},
 {t:'OpenVLA struggles on these tasks because its autoregressive discretization architecture does not support action chunks.',
  src:'Section VI-A, p.7'}
],

links:[
 {t:'arXiv 2410.24164 — π0', u:'https://arxiv.org/abs/2410.24164'},
 {t:'Physical Intelligence 블로그', u:'https://physicalintelligence.company/blog/pi0'}
]
});
