WIKI.paper({
slug:'s4',
venue:'ICLR 2022 (Outstanding Paper Honorable Mention)',
authors:'Albert Gu, Karan Goel, Christopher Ré (Stanford)',
arxiv:'2111.00396',

tldr:'제어이론의 **연속 시간 상태공간 모델(SSM)** $x\'(t)=Ax(t)+Bu(t)$ 를 딥러닝 층으로 만든 논문. 상태 행렬 $A$ 를 "대각 + 저계수" 구조로 제한해 계산 병목을 풀었고, 길이 16,384 시퀀스를 다루는 Long Range Arena의 Path-X를 **처음으로 푼** 모델이 되었다. 학습은 합성곱처럼 병렬, 추론은 RNN처럼 상태 하나만 들고 가는 두 얼굴이 여기서 시작된다.',

context:'2021년 시점의 긴 시퀀스 처리는 막다른 길이었다. [Transformer](#/p/transformer)는 $O(n^2)$ 라 길이 16k에서 메모리가 터지고, [희소 attention](#/p/sparse-attn) 계열은 복잡도는 낮췄지만 Long Range Arena(LRA)의 어려운 태스크에서 전부 무작위 수준이었다. 반대편의 [LSTM](#/p/lstm)은 메모리는 상수지만 수천 스텝의 의존성을 실제로 못 배우고, 무엇보다 **학습이 순차적**이라 GPU를 못 쓴다. 같은 저자들의 직전 연구인 HiPPO와 LSSL은 "연속 시간 상태공간 모델이 장기 기억의 올바른 수학적 틀"이라는 것을 보였지만, 매 스텝 $A^k$ 를 곱하며 커널을 만드는 비용이 감당이 안 돼 장난감 크기를 벗어나지 못했다. S4는 그 **계산 병목 하나만** 정면으로 뚫는다.',

ideas:[
 {h:'연속 시간 시스템을 먼저 정의하고, 그 다음에 이산화한다',
  lead:'이산 재귀 대신 연속 미분방정식을 먼저 놓고 스텝 크기로 이산화한다.',
  d:'보통의 시퀀스 모델은 처음부터 이산 스텝 $h_t = f(h_{t-1}, x_t)$ 로 정의된다. S4는 순서를 뒤집어 **연속 신호** $u(t)$ 에 대한 미분방정식 $x\'(t)=Ax(t)+Bu(t)$, $y(t)=Cx(t)$ 를 먼저 놓고, 스텝 크기 $\\Delta$ 로 이산화해 층을 얻는다. 실익은 $\\Delta$ 가 학습 가능한 파라미터가 되어 모델이 스스로 시간 해상도를 고른다는 것, 그리고 같은 층이 오디오 파형·픽셀열·텍스트에 구조 변경 없이 붙는다는 것이다.'},
 {h:'HiPPO 초기화: $A$ 를 아무렇게나 두면 장기 기억은 생기지 않는다',
  lead:'A를 과거를 다항식으로 압축하는 HiPPO 행렬로 초기화해야 장기 기억이 생긴다.',
  d:'S4의 성능은 대부분 **$A$ 의 초기값**에서 나온다. HiPPO-LegS 행렬은 "지금까지 본 입력 전체를 르장드르 다항식 기저로 압축해 상태에 담아라"라는 최적 온라인 함수 근사 문제의 해다. 즉 상태 $x(t)$ 는 과거 신호의 **다항식 계수 요약본**이 되고, 오래된 정보가 지수적으로 사라지는 대신 낮은 차수 성분으로 남는다. 논문의 ablation에서 $A$ 를 랜덤 행렬로 초기화하면 sequential CIFAR 정확도가 크게 무너진다 — 구조가 아니라 **초기화가 장기 기억을 만든다**는 것이 이 논문의 가장 반직관적인 부분이다.'},
 {h:'같은 층의 두 가지 계산 모드',
  lead:'같은 파라미터를 학습 때는 합성곱, 추론 때는 재귀로 굴린다.',
  d:'선형 시불변(LTI) 시스템이므로 출력은 입력과 **커널의 합성곱**으로 쓸 수 있다. 학습할 때는 길이 $L$ 짜리 커널 $\\bar{K}$ 를 한 번에 만들어 FFT로 곱하면 $O(L \\log L)$ 에 전 타임스텝을 병렬 처리한다. 추론할 때는 같은 파라미터를 재귀식 $x_k = \\bar{A}x_{k-1} + \\bar{B}u_k$ 로 굴려 **토큰당 상수 시간·상수 메모리**로 생성한다. 이 이중 표현이 [Mamba](#/p/mamba)·[RWKV](#/p/rwkv)로 이어지는 계열 전체의 공통 자산이 된다.'},
 {h:'DPLR 파라미터화 — 논문 제목의 "Structured"',
  lead:'A를 정규+저계수로 분해해 커널 계산을 Cauchy 커널 문제로 바꾼다.',
  d:'문제는 커널 $\\bar{K} = (\\bar{C}\\bar{B}, \\bar{C}\\bar{A}\\bar{B}, \\dots, \\bar{C}\\bar{A}^{L-1}\\bar{B})$ 를 만들려면 $A$ 의 거듭제곱이 필요하고, 이게 LSSL의 병목이었다는 점이다. S4는 HiPPO 행렬이 **정규 행렬 + 저계수 보정(normal plus low-rank, DPLR)** 으로 분해된다는 사실을 이용한다. 그러면 커널 계산이 주파수 영역에서의 **Cauchy 커널 계산**으로 환원되고, 저계수 항은 Woodbury 항등식으로 처리된다. 결과적으로 $O(N^2 L)$ 이던 비용이 $\\tilde{O}(N + L)$ 급으로 떨어진다 — LSSL 대비 최대 30배 빠르고 400배 적은 메모리.'},
 {h:'차원마다 독립 SSM + 채널 믹싱',
  lead:'채널마다 독립 SSM을 돌리고 결과를 선형 변환으로 다시 섞는다.',
  d:'실제 층은 $d$ 개 채널 각각에 스칼라 입출력 SSM을 독립으로 돌린 뒤(즉 $d$ 개의 1D 필터), 그 결과를 position-wise 선형 변환으로 섞는다. "토큰 간 교환 + 채널별 계산"이라는 [Transformer](#/p/transformer)의 분업을 그대로 따르되, **토큰 간 교환을 attention 대신 긴 합성곱이 담당**한다.'}
],

diagram:{type:'compare', cap:'같은 파라미터를 학습 때는 합성곱으로, 추론 때는 재귀로 쓴다 — S4가 만든 이중 표현.',
 left:{t:'학습: 합성곱 모드', items:[
  'HiPPO A에서 커널 K̄ 생성 (Cauchy)',
  'y = u * K̄ 를 FFT로 한 번에',
  '전 타임스텝 병렬 · O(L log L)',
  'GPU 사용률이 Transformer와 대등']},
 right:{t:'추론: 재귀 모드', items:[
  'x_k = Ā x_{k-1} + B̄ u_k',
  '상태 x는 N차원 하나뿐 (KV 캐시 없음)',
  '토큰당 상수 시간 · 상수 메모리',
  '자기회귀 생성이 Transformer 대비 약 60배']}},

math:[
 {expr:'x\'(t) = A x(t) + B u(t),   y(t) = C x(t) + D u(t)',
  tex:'x\'(t) = Ax(t) + Bu(t),\\quad y(t) = Cx(t) + Du(t)',
  d:'연속 시간 상태공간 모델. $u$ 는 1차원 입력 신호, $x$ 는 $N$ 차원 은닉 상태(논문 기본 $N=64$), $y$ 는 출력. $D u$ 항은 residual 연결과 같은 역할이라 구현에서는 skip으로 흡수한다.'},
 {expr:'Ā = (I − Δ/2 · A)⁻¹ (I + Δ/2 · A),   B̄ = (I − Δ/2 · A)⁻¹ Δ B',
  tex:'\\bar{A} = \\left(I-\\tfrac{\\Delta}{2}A\\right)^{-1}\\left(I+\\tfrac{\\Delta}{2}A\\right),\\quad \\bar{B} = \\left(I-\\tfrac{\\Delta}{2}A\\right)^{-1}\\Delta B',
  d:'사다리꼴(bilinear) 이산화. 스텝 $\\Delta$ 가 작을수록 세밀한 시간 해상도를 본다. $\\Delta$ 는 로그 스케일로 학습되며, 채널마다 다른 $\\Delta$ 를 갖게 해서 **여러 시간 스케일을 동시에** 커버하는 것이 실전 성능의 핵심이다.'},
 {expr:'K̄ = (C̄B̄, C̄ĀB̄, C̄Ā²B̄, …, C̄Ā^{L−1}B̄),   y = u * K̄',
  tex:'\\bar{K} = (\\bar{C}\\bar{B},\\ \\bar{C}\\bar{A}\\bar{B},\\ \\bar{C}\\bar{A}^2\\bar{B},\\ \\dots,\\ \\bar{C}\\bar{A}^{L-1}\\bar{B}),\\quad y = u * \\bar{K}',
  d:'길이 $L$ 짜리 **전역 합성곱 커널**. CNN과 달리 커널 폭이 시퀀스 전체이고, 파라미터 수는 $L$ 과 무관하게 $O(N)$ 이다. 이 커널을 직접 저장하지 않고 $(A,B,C,\\Delta)$ 에서 매번 생성한다는 점이 S4를 "암묵적 긴 합성곱"으로 만든다.'}
],

numbers:[
 {k:'LRA 평균 (6개 태스크)', v:'86.09%', d:'같은 벤치마크에서 Transformer는 **53.66%**'},
 {k:'Path-X', v:'88.10% (길이 16,384)', d:'이전의 모든 모델이 50% 무작위 수준이던 태스크를 처음으로 통과. 논문 개정판에서는 96.35%'},
 {k:'sequential CIFAR-10', v:'91.13%', d:'픽셀을 길이 1,024 시퀀스로 편 채로. 증강 없는 2D ResNet에 필적'},
 {k:'Speech Commands (원시 파형)', v:'98.32% (길이 16,000)', d:'MFCC 같은 전처리 없이 파형 그대로 입력'},
 {k:'LSSL 대비', v:'최대 30배 빠름 · 400배 적은 메모리', d:'DPLR 파라미터화가 만든 차이. S4를 실용 크기로 끌어올린 지점'},
 {k:'자기회귀 생성', v:'Transformer 대비 약 60배', d:'재귀 모드는 토큰당 상수 비용이라 길이가 늘어도 느려지지 않는다'}
],

figures:[
 {f:'fig1-ssm-overview.png',
  cap:'왼쪽 상자는 SSM의 기본형(연속시간 미분방정식 x˙=Ax+Bu, y=Cx+Du)이 신호를 잠재 상태 x를 거쳐 출력으로 바꾸는 구조를 보여준다. 가운데 상자는 A 행렬을 특수하게(HiPPO) 고르면 곡선(빨간 점선 화살표)의 과거 전체를 상태에 압축해 장거리 의존성을 잡을 수 있음을 보여준다. 오른쪽 상자가 이 논문의 기여로, 같은 SSM을 이산 재귀식(왼쪽 화살표 체인, 학습·추론에 O(1))과 합성곱 커널 K̄(오른쪽 종 모양 곡선들, 학습을 병렬화)로 **양쪽 다** 계산할 수 있게 만든 것이다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We propose the Structured State Space sequence model (S4) based on a new parameterization for the SSM, and show that it can be computed much more efficiently than prior approaches while preserving their theoretical strengths.',
  src:'Abstract, p.1'}
],

impact:'S4는 "긴 시퀀스는 attention을 잘 근사하는 문제"라는 당시의 공통 전제를 깼다. 성능을 만든 것은 attention의 근사가 아니라 **상태공간 + HiPPO 초기화**라는 다른 계보였다. 또 "학습은 병렬, 추론은 상수 메모리"라는 조합이 실제로 가능하다는 존재 증명이 되면서, 이후 3년간 S4D·S5·H3·[Mamba](#/p/mamba)로 이어지는 SSM 연구 계열 전체가 여기서 파생됐다. 다만 이 논문 단계에서는 언어 모델링 성능이 Transformer에 명백히 못 미쳤고, 그 격차의 원인을 진단한 것이 Mamba다.',

legacy:[
 '**단순화 경쟁** — DSS·S4D는 DPLR 없이 $A$ 를 그냥 대각 행렬로 두어도 거의 같은 성능이 난다는 것을 보여 구현 난이도를 크게 낮췄다',
 '**언어로의 확장** — H3는 SSM이 언어에서 왜 지는지를 "이전 토큰 회상"과 "토큰 간 비교" 두 능력의 부재로 분해했고, 이 진단이 [Mamba](#/p/mamba)의 선택적 SSM으로 직결된다',
 '**비언어 도메인** — 오디오 생성(SaShiMi), 유전체, 시계열, 비디오처럼 시퀀스가 수만~수십만 스텝인 영역에서는 SSM이 지금도 기본 선택지다',
 '**하이브리드 설계** — Jamba·Zamba·Samba 같은 최신 모델은 SSM 층과 attention 층을 섞어 쌓는다. 순수 대체가 아니라 **역할 분담**이 실무의 결론이 되었다'
],

pitfalls:[
 '**"S4는 Transformer 대체재"가 아니다.** 원 논문의 강세 영역은 LRA·오디오·픽셀열처럼 **연속 신호에 가까운 긴 시퀀스**이고, 언어 모델링에서는 같은 크기 Transformer에 밀렸다. LRA 점수만 보고 일반 대체를 기대하면 어긋난다.',
 '**HiPPO 초기화를 빼면 다른 모델이 된다.** $A$ 를 랜덤으로 두면 장기 의존성 성능이 무너진다. "구조가 좋아서"가 아니라 "초기값이 과거의 다항식 요약을 인코딩해서" 되는 것이라, 구현할 때 초기화 코드가 사실상 논문의 절반이다.',
 '**수치적으로 까다롭다.** Cauchy 커널·Woodbury 보정·복소수 연산이 얽혀 있어 저정밀도에서 쉽게 발산하고, 순진하게 짜면 논문의 속도가 나오지 않는다. 이 부담이 이후 대각 파라미터화(S4D)로 옮겨간 실질적 이유다.'
],

links:[
 {t:'arXiv 2111.00396 — Efficiently Modeling Long Sequences with Structured State Spaces', u:'https://arxiv.org/abs/2111.00396'},
 {t:'HiPPO: Recurrent Memory with Optimal Polynomial Projections (선행 논문)', u:'https://arxiv.org/abs/2008.07669'},
 {t:'The Annotated S4 (Sasha Rush · Sidd Karamcheti)', u:'https://srush.github.io/annotated-s4/'}
]
});
