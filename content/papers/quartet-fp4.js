WIKI.paper({
slug:'quartet-fp4',
venue:'arXiv 2025 (ISTA / Red Hat AI / ETH Zürich)',
authors:'Castro, Panferov, Tabesh, Sieberling et al. (ISTA · Red Hat AI · ETH Zürich)',
arxiv:'2505.14669',

tldr:'[FP4 학습](#/p/fp4-training)이 정확도를 지키기 위해 일부 연산을 높은 정밀도로 남기는 것과 달리, **순전파·역전파의 모든 GeMM을 MXFP4로** 통일하고도 Blackwell GPU에서 FP8보다 빠르면서 손실은 동등하게 만든 방법. 저비트 학습을 "손실 없이 되는가"가 아니라 "같은 연산 예산에서 최적인가"라는 스케일링 법칙 문제로 재구성한다.',

context:'Blackwell 세대 GPU(B200, RTX 5090)의 텐서 코어는 FP4를 FP8 대비 최대 2배의 처리량으로 지원한다. 그런데 기존 저비트 학습 방법(SwitchBack, JetFire, HALO, INT4-Transformers)은 여전히 일부 행렬곱을 더 높은 정밀도로 되돌리는 **혼합 정밀도 폴백**에 의존했다 — 완전히 FP4로만 학습을 돌리면 정확도가 무너졌기 때문이다. [FP4 training](#/p/fp4-training) 역시 이상치 클램핑 같은 보정 장치를 두지만 실제 FP4 텐서 코어에서의 속도 이득은 측정하지 않았다. 이 논문의 질문은 다르다 — 애초에 "손실 없는 FP4"를 목표로 삼는 것 자체가 잘못된 기준이 아닌가? 연산 예산이 고정되어 있다면, 정확도 손실을 감수하고 더 낮은 정밀도로 더 많이/더 빠르게 학습하는 쪽이 나을 수도 있다.',

ideas:[
 {h:'스케일링 법칙으로 양자화 기법을 비교한다',
  lead:'정밀도의 효과를 파라미터 수·데이터 양에 곱해지는 효율 계수로 모델링한다.',
  d:'순전파 정밀도는 "유효 파라미터 수"를 $N \\cdot \\text{eff}_N(P_{fwd})$ 로 깎고, 역전파 정밀도는 "유효 데이터 양"을 $D \\cdot \\text{eff}_D(P_{bwd})$ 로 깎는다고 모델링한 뒤 실제 학습 곡선에 피팅한다. 이렇게 하면 서로 다른 양자화 기법을 단일 숫자(효율 계수) 두 개로 비교할 수 있고, **연산 예산과 하드웨어 실측 속도를 곱하면 어느 정밀도가 "최적"인지 계산할 수 있다** — 정확도만 보던 기존 비교법과의 근본적 차이다.'},
 {h:'순전파는 오차를, 역전파는 편향을 최소화해야 한다',
  lead:'순전파는 MSE가 작은 양자화가, 역전파는 편향(misalignment)이 작은 양자화가 이긴다.',
  d:'순전파 정밀도를 바꾸는 여러 방식(stochastic rounding, RTN, LSQ, QuEST)을 비교하면 **양자화 오차(MSE)가 작을수록 파라미터 효율이 높다**. 그런데 역전파에서는 반대 경향이 나온다 — 오차가 작아도 그래디언트 추정이 편향되면 수렴이 나빠진다. 저자들은 새 지표인 projection magnitude misalignment로 이 편향을 측정해, 순전파는 QuEST(Hadamard 회전 + RMSE 클리핑), 역전파는 RTN(round-to-nearest)이 최적이라는 "베스트 오브 both worlds" 조합에 도달한다.'},
 {h:'Quartet: 전 구간 MXFP4 + Hadamard 회전',
  lead:'세 GeMM 전부를 MXFP4로 돌리되 양자화 직전에 Hadamard 변환으로 이상치를 흩어 놓는다.',
  d:'선형 레이어 하나의 순전파·입력 그래디언트·가중치 그래디언트 GeMM **세 개 모두**를 MXFP4로 수행한다. 양자화 직전에 고정 크기(양자화 그룹과 같은 32) Hadamard 변환을 적용해 이상치를 여러 원소에 분산시키고, 순전파는 QuEST 투영, 역전파는 RTN + 스케일 보정을 적용한 뒤 역방향으로 Hadamard 역변환을 되돌린다. MXFP4가 이미 32개 단위로 스케일을 공유하므로, Hadamard 블록 크기를 그 32에 맞춰 추가 비용을 $O(g\\log g)$ 로 억제한다.'},
 {h:'CUTLASS 기반 Blackwell 전용 커널로 실제 속도를 낸다',
  lead:'Hadamard·양자화·클리핑을 한 커널로 융합하고 tcgen05.mma로 블록 스케일 GeMM을 돌린다.',
  d:'알고리즘이 아무리 정확해도 소박하게 구현하면 FP16보다도 느려진다. Quartet은 CUTLASS 3.9 위에 두 단계로 구현된다 — 1단계는 Hadamard 변환·양자화·스케일 계산·QuEST 클리핑 마스크 생성을 **하나의 커널로 융합**해 레지스터 파일에서 처리하고, 2단계는 Blackwell의 `tcgen05.mma` 명령으로 블록 스케일 GeMM을 수행한다. 이 구현은 오픈소스 QuTLASS로 공개됐다.'}
],

diagram:{type:'compare', cap:'FP4 training(2501.17116)과 Quartet의 범위·목표 차이.',
 left:{t:'FP4 training', items:[
  '가중치·활성값만 FP4',
  '옵티마이저·통신은 FP8/FP16 유지',
  '목표: BF16과 손실 동등',
  '실제 FP4 코어 속도는 미측정']},
 right:{t:'Quartet (MXFP4)', items:[
  '순전파·역전파 GeMM 전부 MXFP4',
  'Hadamard 회전 + QuEST/RTN 조합',
  '목표: 연산 예산당 손실 최적',
  'Blackwell 실측 FP8 대비 가속']}},

math:[
 {expr:'L(N,D,Pf,Pb) = A/(N·effN(Pf))^α + B/(D·effD(Pb))^β)^γ + E',
  tex:'L(N,D,P_{fwd},P_{bwd}) = \\frac{A}{(N\\cdot\\text{eff}_N(P_{fwd}))^{\\alpha}} + \\left(\\frac{B}{(D\\cdot\\text{eff}_D(P_{bwd}))^{\\beta}}\\right)^{\\gamma} + E',
  d:'저비트 스케일링 법칙. $\\text{eff}_N$ 은 순전파 정밀도가 파라미터 수를 얼마나 "유효하게" 깎는지, $\\text{eff}_D$ 는 역전파 정밀도가 데이터 양을 얼마나 깎는지를 나타내는 $(0,1]$ 계수다.'},
 {expr:'q(x) = round(x/s; grid),   x̂ = s·q(x)',
  tex:'q(x) = \\text{round}\\!\\left(\\frac{x}{s};\\,\\text{grid}\\right),\\quad \\hat{x} = s\\cdot q(x)',
  d:'MXFP4는 32개 원소 단위 1D 블록마다 E8M0(8비트 지수, 가수 없음) 스케일 $s$ 를 공유하는 마이크로스케일링 포맷이다.'}
],

numbers:[
 {k:'순전파 가속', v:'FP8 대비 최대 2× · BF16 대비 최대 4×', d:'RTX 5090, 배치 64·seq 512, 52B 모델 규모까지 블록 단위 실측'},
 {k:'역전파 가속', v:'FP8 대비 최대 1.5× · BF16 대비 최대 2.6×', d:'같은 조건. 역전파 연산량이 전체의 약 2/3이라 순전파보다 이득이 작음'},
 {k:'학습 전체 가속', v:'FP8 대비 최대 ~1.6× · BF16 대비 최대 ~2.9×', d:'순전파(1/3)·역전파(2/3) 가중평균'},
 {k:'30M 모델 C4 검증 손실 (D/N=100×)', v:'Quartet 3.29 vs LUQ-INT4 3.66', d:'기존 최강 4비트 기법(LUQ) 대비 상대 손실 약 10% 개선'},
 {k:'효율 계수 (Quartet)', v:'eff_N 0.65 · eff_D 0.95', d:'LUQ-INT4는 eff_N 0.49·eff_D 0.15 — Quartet은 같은 손실에 파라미터 약 15% · 데이터 약 5배 적게 필요'},
 {k:'7B 모델 학습 안정성', v:'10B 토큰까지 FP8과 거의 겹치는 손실 곡선', d:'소규모 스케일링 법칙 결과가 7B까지 유지됨을 확인'}
],

figures:[
 {f:'fig4-speedup.png',
  cap:'(a)(b) 모델 크기(800M·7B·52B)별 블록 단위 속도 배수. 주황=순전파, 파랑=역전파, 빨강=학습 전체. FP8 대비(a)는 배수가 대체로 1~2배, BF16 대비(b)는 2~4배로 더 크다 — 모델이 커질수록(연산 강도가 높을수록) 이득이 커진다. (c) 7B 모델의 C4 검증 손실이 10B 토큰까지 FP8 기준선과 거의 겹친다.',
  src:'원문 Figure 4, p.9'}
],

impact:'저비트 학습 연구의 평가 기준 자체를 바꿨다 — "정확도를 안 잃는 최저 비트가 무엇인가"가 아니라 "고정된 연산 예산에서 어떤 정밀도 조합이 손실을 최소화하는가"로 질문을 재정의했다. 그 결과 순전파·역전파 전부를 FP4로 내리는 선택이 도그마가 아니라 **조건부로 최적**이라는 것을 스케일링 법칙과 실측 커널 속도로 함께 보였다. [FP4 training](#/p/fp4-training)이 "FP4로도 학습이 된다"를 보였다면, Quartet은 "Blackwell에서는 FP4가 FP8보다 실제로 더 낫다"까지 나아간 것이다.',

legacy:[
 '**QuTLASS 오픈소스 커널** — Blackwell 마이크로스케일링 포맷을 지원하는 최초의 공개 CUTLASS 기반 구현으로, 이후 FP4 학습 연구의 공통 인프라가 됨',
 '**순전파/역전파 비대칭 처리 원칙 확산** — "순전파는 오차 최소화, 역전파는 편향 최소화"라는 구분이 이후 저비트 학습 기법 설계의 기본 틀이 됨',
 '**스케일링 법칙 기반 양자화 비교법** — 단일 벤치마크 정확도 대신 효율 계수로 기법을 비교하는 방법론이 후속 연구(저자들이 언급하는 동시대·후속 확장 연구)에 채택됨'
],

pitfalls:[
 '**"MXFP4가 항상 FP8보다 낫다"가 아니다.** 논문 자체가 Figure 1(b)(c)에서 보이듯 최적 정밀도는 모델 크기·데이터 비율에 따라 달라지는 영역별 결과다. 작은 모델·적은 데이터 구간에서는 FP8:FP4나 FP8:FP8이 여전히 낫다.',
 '**속도 수치는 RTX 5090 단일 레이어/블록 측정치다.** 논문이 밝히듯 배치 64·시퀀스 512라는 특정 설정에서의 블록 단위 벤치마크이며, 전체 end-to-end 학습 파이프라인의 실측 처리량이 아니다.',
 '**Hadamard 회전의 비용을 "무시할 만하다"고 가정한다.** $O(g\\log g)$ 로 이론상 작지만, $g\\le 256$ 이라는 조건이 붙어 있고 실제로는 전용 CUTLASS 커널 융합이 있어야만 그 가정이 성립한다.'
],

links:[
 {t:'arXiv 2505.14669 — Quartet: Native FP4 Training Can Be Optimal for LLMs', u:'https://arxiv.org/abs/2505.14669'},
 {t:'IST-DASLab/Quartet (GitHub)', u:'https://github.com/IST-DASLab/Quartet'}
]
});
