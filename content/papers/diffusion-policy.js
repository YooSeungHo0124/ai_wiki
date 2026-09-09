WIKI.paper({
slug:'diffusion-policy',
venue:'RSS 2023',
authors:'Chi, Xu, Feng, Cousineau, Du, Burchfiel, Tedrake, Song (Columbia · TRI · MIT)',
arxiv:'2303.04137',

tldr:'로봇의 행동을 회귀가 아니라 [DDPM](#/p/ddpm) 스타일의 **조건부 잡음 제거 과정**으로 생성한다. 사람 시연의 다봉(multimodal) 행동 분포 — "이번엔 왼쪽으로 돌아가고 저번엔 오른쪽으로 돌아갔다" — 를 평균으로 뭉개지 않고 그대로 표현할 수 있다는 게 핵심 이점이며, 15개 과제 평균 46.9% 성능 개선을 보였다.',

context:'[ACT](#/p/act)를 비롯한 모방 학습 정책 대부분은 회귀나 단순 가우시안 혼합으로 행동을 예측한다. 그런데 사람 시연은 본질적으로 다봉적이다 — 같은 상태에서 사람은 물체를 왼쪽으로도, 오른쪽으로도 돌아갈 수 있고, 둘 다 "옳은" 행동이다. 평균 제곱 오차로 이를 학습하면 두 최빈값의 평균이라는 물리적으로 불가능한 행동이 나온다. Implicit Behavior Cloning(에너지 기반 모델) 같은 대안도 있었지만 학습이 불안정했다. 이미지 생성에서 다봉 분포를 안정적으로 학습하는 데 이미 성공한 DDPM을, 행동 시퀀스 생성에 그대로 옮기면 어떻게 될까 — 가 이 논문의 질문이다.',

ideas:[
 {h:'행동 생성을 조건부 잡음 제거로 재정의',
  lead:'가우시안 노이즈에서 시작해 $K$번 반복적으로 노이즈를 빼 실행 가능한 행동 시퀀스를 만든다.',
  d:'DDPM은 원래 이미지 $x$를 생성하지만, Diffusion Policy는 $x$ 자리에 행동 시퀀스 $A_t$를 놓고 관측 $O_t$를 조건으로 준다. 노이즈 예측망 $\\epsilon_\\theta(O_t, A_t^k, k)$ 가 매 반복마다 노이즈를 추정해 빼는 것을 $K$번 반복하면, 가우시안 노이즈였던 $A_t^K$가 그럴듯한 행동 시퀀스 $A_t^0$로 수렴한다.'},
 {h:'관측은 조건으로만 쓰고 액션만 생성 — inference 속도 확보',
  lead:'관측-행동 결합분포 대신 조건부 분포 $p(A_t\\mid O_t)$만 모델링해 노이즈 제거 대상에서 관측을 뺀다.',
  d:'planning에 쓰이던 이전 diffusion 방법은 관측과 행동을 함께 생성했지만, Diffusion Policy는 관측을 조건으로 고정하고 행동만 생성 대상으로 삼는다. 이는 노이즈 제거해야 할 차원을 줄여 추론을 빠르게 하고, end-to-end로 비전 인코더를 함께 학습할 수 있게 한다.'},
 {h:'Receding horizon: 관측 $T_o$, 예측 $T_p$, 실행 $T_a$를 분리',
  lead:'매 스텝 $T_p$개 행동을 예측하되 그중 $T_a$개만 실행하고 다시 관측해 재계획한다.',
  d:'[ACT](#/p/act)의 action chunking과 같은 문제의식이지만 구현이 다르다 — $T_o$ 스텝의 최근 관측으로 $T_p$ 스텝의 행동을 예측하고, 그중 앞쪽 $T_a$ 스텝만 실행한 뒤 다시 관측해 재계획한다. $T_a>1$ 이면 매 스텝 재계획하는 것보다 행동이 시간적으로 일관되면서도, $T_a$가 너무 크면 반응성이 떨어지는 trade-off가 있다.'},
 {h:'다봉성은 확산 과정의 확률적 초기화·샘플링에서 자연히 나온다',
  lead:'가우시안 초기 샘플 $A_t^K$ 마다 서로 다른 수렴 분지(basin)로 떨어져 여러 행동 모드를 만든다.',
  d:'Stochastic Langevin Dynamics 관점에서, 매번 다른 가우시안 노이즈에서 출발한 샘플들이 서로 다른 최빈값(왼쪽으로 돌기/오른쪽으로 돌기)으로 수렴한다. 회귀 모델처럼 단일 점 추정을 강요하지 않기 때문에, 두 유효한 궤적을 실제 데이터에 그런 시연이 없어도 정성적으로 재현할 수 있었다(Figure 3, Push-T 과제).'},
 {h:'CNN 백본이 기본값, Transformer 백본은 고빈도 변화 과제에 유리',
  lead:'1D temporal CNN + FiLM 조건화가 대부분 과제에서 튜닝 없이 잘 되고, 급격한 행동 변화가 있으면 Transformer가 낫다.',
  d:'CNN 기반은 Janner et al.(2022)의 1D temporal CNN에 FiLM으로 관측을 매 conv층에 주입하는 구조이며 하이퍼파라미터에 덜 민감하다. 다만 temporal convolution의 저주파 편향 때문에 속도 명령처럼 빠르게 바뀌는 행동에는 약하고, 이때는 causal attention을 쓰는 Transformer 기반 diffusion이 낫지만 튜닝이 더 까다롭다.'}
],

diagram:{type:'loop', cap:'매 스텝 최근 $T_o$ 관측을 조건으로, 가우시안 노이즈에서 시작해 $K$번 반복적으로 노이즈를 제거하며 $T_p$ 길이의 행동 시퀀스를 만들고, 그중 $T_a$ 스텝만 실행한 뒤 다시 관측한다.',
 center:'K회 반복 후 T_a 스텝 실행',
 nodes:[
  {t:'관측 O_t', s:'최근 T_o 스텝'},
  {t:'노이즈 A_t^K', s:'가우시안 초기화'},
  {t:'ε_θ 예측·제거', s:'K회 반복', acc:true},
  {t:'행동 A_t^0', s:'T_p 스텝 생성'},
  {t:'실행', s:'앞 T_a 스텝만'}
 ]},

math:[
 {expr:'A_t^{k-1} = α(A_t^k − γ·ε_θ(O_t, A_t^k, k) + N(0, σ²I))',
  tex:'\\mathbf{A}_t^{k-1}=\\alpha\\big(\\mathbf{A}_t^{k}-\\gamma\\,\\epsilon_\\theta(\\mathbf{O}_t,\\mathbf{A}_t^{k},k)+\\mathcal N(0,\\sigma^2 I)\\big)',
  d:'DDPM의 역방향(잡음 제거) 업데이트 식. $K$번 반복하면 $A_t^K\\sim\\mathcal N(0,I)$ 이 관측 $O_t$ 에 조건화된 그럴듯한 행동 시퀀스 $A_t^0$ 로 수렴한다.'},
 {expr:'L = MSE(ε^k, ε_θ(O_t, A_t^0 + ε^k, k))',
  tex:'\\mathcal L=\\mathrm{MSE}\\big(\\epsilon^{k},\\,\\epsilon_\\theta(\\mathbf{O}_t,\\mathbf{A}_t^{0}+\\epsilon^{k},k)\\big)',
  d:'학습 손실은 표준 DDPM과 동일하게 "더해진 노이즈를 얼마나 잘 예측하는가"의 MSE다. 관측 $O_t$는 조건으로만 들어가고 노이즈 제거 대상에서는 제외된다는 점이 이미지 생성용 DDPM과의 차이.'}
],

numbers:[
 {k:'벤치마크 평균 개선', v:'+46.9%', d:'4개 벤치마크 15개 과제 평균, 기존 SOTA 대비'},
 {k:'평가 과제 수', v:'15개 · 4벤치마크', d:'시뮬레이션 + 실물 로봇(Push-T 등)'},
 {k:'추론 지연', v:'0.1초', d:'DDIM 학습 100 iter → 추론 10 iter, RTX 3080 기준'},
 {k:'noise schedule', v:'Square Cosine (iDDPM)', d:'실험적으로 로봇 제어 과제에 가장 적합했던 스케줄'},
 {k:'백본 2종', v:'CNN(FiLM) / Transformer', d:'CNN이 기본값, 고빈도 행동 변화 과제엔 Transformer가 유리'}
],

impact:'Diffusion Policy는 모방 학습에서 "행동 분포를 어떻게 표현할 것인가"라는 질문에 확산 모델이라는 명확한 답을 제시했다. [ACT](#/p/act)의 action chunking·receding horizon 아이디어를 계승하면서, CVAE의 단일 잠재변수 대신 반복적 정제 과정으로 분포를 표현해 다봉성을 훨씬 안정적으로 다뤘다. 이 논문 이후 "정책 = 확산 모델"이 로봇 모방 학습의 사실상 표준 선택지가 됐고, 이후 VLA 계열(예: [pi0](#/p/pi0))이 행동 헤드를 확산·[flow matching](#/p/flow-matching)으로 대체하는 흐름의 직접적 출발점이 됐다.',

legacy:[
 '**행동 헤드로서의 확산 모델 정착** — 이후 다수의 모방 학습·VLA 연구가 이산 토큰 분류나 CVAE 대신 확산 기반 행동 생성을 채택',
 '**Flow matching으로의 전환** — [pi0](#/p/pi0)가 diffusion policy의 반복적 정제 아이디어를 계승하되 샘플링을 더 빠르게 하려고 [flow matching](#/p/flow-matching)으로 대체',
 '**receding horizon 제어의 재확인** — $T_o$/$T_p$/$T_a$ 분리가 이후 정책 설계에서 반복적으로 재사용되는 표준 프레임이 됨',
 '**VLA의 행동 디코더 부품화** — VLM 인코더는 그대로 두고 행동 생성만 확산 모듈로 교체하는 조합형 설계(예: 여러 후속 VLA)가 이 논문 이후 일반화됨'
],

pitfalls:[
 '**46.9% 개선은 특정 4개 벤치마크·15개 과제의 평균값이다.** 과제별 편차가 크고, 다른 벤치마크·다른 로봇에서의 개선폭을 이 숫자로 예단할 수 없다.',
 '**DDIM으로 줄여도 여전히 여러 번의 순전파(10 iteration)가 필요해, 단일 순전파로 행동을 내는 회귀·토큰 분류 방식보다 추론이 느리다.** 실시간 제약이 빡빡한 시스템에서는 이 비용을 반드시 감안해야 한다.',
 '**"다봉 분포를 잘 표현한다"는 것이 "항상 더 잘 작동한다"는 뜻은 아니다.** 논문도 CNN 백본이 급격한 행동 변화(고주파 신호)에는 약하다는 것을 명시하며, 과제 특성에 따라 백본 선택이 갈린다.'
],

figures:[
 {f:'fig2a-formulation.png',
  cap:'왼쪽 위: 카메라 관측 $O_t$. 왼쪽 아래: 노이즈 상태 $A_t^K$(색이 흩어진 점들)에서 시작해 $A_t^k$를 거쳐 $A_t^0$(파란 궤적)으로 수렴하는 잡음 제거 과정 — 이것이 이 논문의 핵심 그림이다. 오른쪽: 시간축 위에서 관측 구간(회색) 다음에 예측 구간 $T_p$(보라) 중 실제로 로봇에 실행되는 것은 앞쪽 일부뿐이고, $T_a$ 이후에는 새 관측으로 다시 예측한다.',
  src:'원문 Figure 2(a), p.3'}
],

quotes:[
 {t:'We find that the diffusion formulation yields powerful advantages when used for robot policies, including gracefully handling multimodal action distributions, being suitable for high-dimensional action spaces, and exhibiting impressive training stability.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2303.04137 — Diffusion Policy: Visuomotor Policy Learning via Action Diffusion', u:'https://arxiv.org/abs/2303.04137'},
 {t:'프로젝트 페이지 — diffusion-policy.cs.columbia.edu', u:'https://diffusion-policy.cs.columbia.edu/'}
]
});
