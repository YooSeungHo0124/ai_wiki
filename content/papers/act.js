WIKI.paper({
slug:'act',
venue:'RSS 2023',
authors:'Zhao, Kumar, Levine, Finn (Stanford · UC Berkeley · Meta)',
arxiv:'2304.13705',

tldr:'2만 달러 이하의 저가 양팔 원격조작 하드웨어(ALOHA)와, 매 스텝이 아니라 **행동을 묶음(chunk)으로 예측·실행**하는 ACT 알고리즘을 결합해 지퍼백 여닫기·RAM 꽂기처럼 밀리미터 단위 정밀도가 필요한 양손 조작을 소수의 시연만으로 학습시켰다.',

context:'모방 학습은 원래 복합 오차(compounding error) 문제를 갖는다 — 한 스텝의 작은 오차가 학습 분포 밖 상태로 이어지고, 거기서부터는 정책이 무너진다. 정밀 양손 조작은 이 문제가 특히 심하다. 원격조작 시연을 고빈도(50Hz)로 모으면 데이터는 촘촘해지지만, 그만큼 유효 시야(horizon)가 길어져 복합 오차가 더 쌓인다. 값비싼 산업용 양팔 로봇 없이, 그리고 이 문제를 완화하면서 threading a zip tie·조립처럼 손끝 정밀도가 필요한 과제를 배울 수 있는가가 이 논문의 질문이다.',

ideas:[
 {h:'ALOHA: $20k 이하의 오픈소스 양팔 원격조작 하드웨어',
  lead:'저가 leader-follower 팔 두 쌍으로 5~10배 비싼 시스템에 필적하는 정밀도를 낸다.',
  d:'사람이 조작하는 leader 로봇의 관절 위치를 follower 로봇이 실시간으로 추종하는 구조다. follower가 받는 힘은 leader와의 관절 위치 차이로 암묵적으로 결정되기 때문에, 학습 데이터로는 **leader의 관절 위치**를 행동으로 기록해야 한다는 점이 실무적으로 중요하다. 4대의 카메라(정면·상단·양 손목)로 시야를 확보한다.'},
 {h:'Action chunking: k스텝을 한 번에 예측해 유효 horizon을 줄인다',
  lead:'매 스텝 재계획하는 대신 $k$개 행동을 한 번에 내고 순서대로 실행한다.',
  d:'심리학의 action chunking 개념을 빌려, 정책이 $\\pi_\\theta(a_{t:t+k}|s_t)$ 형태로 한 관측에서 $k$개의 미래 행동을 통째로 예측한다. 이는 과제의 유효 horizon을 $k$배 줄이는 효과를 내고, 동시에 "시연 중간의 멈칫거림" 같은 시간적으로 상관된 교란 요인에 단일 스텝 정책보다 덜 흔들리게 한다. 최종 설정은 $k=100$.'},
 {h:'CVAE로 행동 시퀀스의 다봉성(스타일 변이)을 흡수',
  lead:'사람 시연마다 다른 "스타일"을 잠재변수 $z$로 흡수해 평균화로 인한 붕괴를 막는다.',
  d:'같은 상태에서도 사람마다 다르게 움직이는 시연 데이터를 그냥 회귀로 학습하면 여러 그럴듯한 궤적의 평균이라는 물리적으로 말이 안 되는 행동이 나온다. ACT는 CVAE로 학습한다 — 인코더(BERT류 Transformer)가 행동 시퀀스와 관절 관측을 압축해 스타일 변수 $z$를 만들고, 디코더가 $z$·이미지·관절 위치로 행동 시퀀스를 생성한다. 인코더는 학습에만 쓰고 추론 시 $z$는 사전분포 평균인 0으로 고정한다.'},
 {h:'Temporal ensembling으로 chunk 경계의 덜컹거림을 없앤다',
  lead:'매 스텝 새 chunk를 뽑아 겹치는 예측을 지수가중 평균한다.',
  d:'단순 chunking은 $k$스텝마다 행동이 갑자기 바뀌어 로봇 움직임이 뚝뚝 끊긴다. 대신 **매 스텝마다** 새로운 $k$-스텝 chunk를 예측하고, 같은 시점을 겨냥한 여러 chunk의 예측을 지수가중치로 앙상블해 부드럽게 만든다. 추가 추론 비용 없이 관측 빈도를 그대로 유지한다는 것이 요령이다.'},
 {h:'목표 관절 위치를 직접 예측 — delta보다 안정적',
  lead:'상대 변위(delta) 대신 절대 목표 관절 위치를 예측하는 편이 실측상 더 안정적이었다.',
  d:'행동을 다음 시점의 목표 관절 위치(14차원: 양팔 각 7자유도)로 직접 예측하고, 이를 Dynamixel 모터 내부의 고빈도 PID 컨트롤러가 추종한다. delta 위치를 예측하는 대안도 시도했지만 논문은 목표 위치 직접 예측이 더 나은 결과를 냈다고 보고한다.'}
],

diagram:{type:'stack', cap:'ACT는 CVAE로 학습된다. 왼쪽 인코더(학습에만 사용)가 관절+행동 시퀀스를 스타일 변수 z로 압축하고, 오른쪽 디코더(=정책)가 카메라 4대 이미지·관절·z로 k-스텝 행동 시퀀스를 생성한다.',
 layers:[
  {t:'입력', s:'이미지 4대 · 관절 위치'},
  {t:'CVAE 인코더', s:'학습 시에만 사용', note:'z 스타일 변수 생성'},
  {t:'Tf. 인코더', s:'이미지+관절+z 결합', acc:true},
  {t:'Tf. 디코더', s:'k×14 행동 시퀀스 출력'},
  {t:'시간 앙상블', s:'겹치는 chunk 가중 평균'}
 ]},

math:[
 {expr:'π_θ(a_{t:t+k} | o_t) — chunk size k, trained as CVAE',
  tex:'\\min_\\theta -\\sum_{s_t,\\,a_{t:t+k}\\in D}\\log \\pi_\\theta(a_{t:t+k}\\mid s_t) \\;+\\; \\beta\\, D_{KL}\\!\\big(q_\\phi(z\\mid a_{t:t+k},\\bar o_t)\\,\\|\\,\\mathcal N(0,I)\\big)',
  d:'표준 CVAE 목적함수: 재구성 항(행동 시퀀스의 로그우도)과 인코더 사후분포를 표준정규분포에 가깝게 미는 KL 항을 $\\beta$로 가중합한다.'},
 {expr:'a_t = Σ_i w_i · â_t^{(i)},  w_i ∝ exp(-m·i)',
  tex:'a_t=\\sum_{i} w_i\\,\\hat a_t^{(i)},\\qquad w_i \\propto \\exp(-m\\cdot i)',
  d:'시점 $t$를 예측하는 여러 chunk 중 오래된 예측일수록($i$가 클수록) 지수적으로 낮은 가중치를 준다 — temporal ensembling의 식.'}
],

numbers:[
 {k:'하드웨어 비용', v:'< $20,000', d:'ViperX 기반 leader-follower 양팔 시스템'},
 {k:'제어/기록 주파수', v:'50Hz', d:'테스트로 5Hz까지 낮추면 완료 시간이 62% 느려짐'},
 {k:'시연 수', v:'과제당 50개', d:'8~14초/에피소드, 과제당 약 10~20분 분량'},
 {k:'chunk size', v:'k=100', d:'ablation에서 k↑일수록(약 100까지) 성공률 상승 후 완만히 감소'},
 {k:'행동 차원', v:'14차원', d:'양팔 각 7자유도(6+그리퍼) 목표 관절 위치'},
 {k:'대표 성공률', v:'Slot Battery 96% · Thread Velcro 88%', d:'선행 baseline 대비 최대 +59%p 개선(과제별로 상이)'}
],

impact:'ACT는 "정밀 조작에는 비싼 로봇과 방대한 데이터가 필요하다"는 통념을 깨고, 저가 하드웨어 + 소수 시연(과제당 50개) + 알고리즘적 장치(chunking) 조합으로 밀리미터 단위 조작을 성공시켰다. Action chunking과 temporal ensembling은 이후 모방 학습 정책 전반의 표준 구성요소가 됐고, 특히 [Diffusion Policy](#/p/diffusion-policy)가 여기서 "chunk 단위로 행동을 생성한다"는 틀을 그대로 물려받아 생성 방식만 CVAE에서 확산 모델로 바꿨다.',

legacy:[
 '**Action chunking의 보편화** — [Diffusion Policy](#/p/diffusion-policy)를 비롯한 이후 대다수 모방 학습·VLA 정책이 매 스텝이 아니라 chunk 단위로 행동을 생성하는 구조를 기본값으로 채택',
 '**ALOHA 하드웨어 계열 확장** — ALOHA 2, Mobile ALOHA 등 후속 하드웨어가 이 논문의 leader-follower 원격조작 설계를 그대로 계승',
 '**CVAE에서 확산 모델로** — 다봉 행동 분포를 표현하려던 ACT의 CVAE 접근이, [DDPM](#/p/ddpm) 기반 [Diffusion Policy](#/p/diffusion-policy)가 등장하며 더 강력한 생성 모델로 대체되는 계기가 됨',
 '**저가 하드웨어 오픈소스화** — 이후 여러 연구실이 ALOHA 사양을 그대로 재현해 데이터를 모으면서 실제 로봇 조작 연구의 진입장벽을 낮춤'
],

pitfalls:[
 '**"저가 하드웨어"라는 점이 성능 상한을 낮추지 않는다는 뜻은 아니다.** 성공률은 과제마다 크게 갈리며(예: Slot Battery 96% vs 다른 과제는 훨씬 낮음), 모든 정밀 조작이 이 비용으로 항상 잘 된다고 일반화할 수 없다.',
 '**leader 관절 위치를 행동으로 써야 한다는 점을 놓치기 쉽다.** follower의 관절 위치를 그대로 기록하면 접촉력 정보가 사라져 학습이 잘 안 된다 — 이는 하드웨어 설계와 데이터 수집 파이프라인이 얽힌 세부사항이다.',
 '**chunk size $k$는 과제·주파수에 따라 재튜닝이 필요한 하이퍼파라미터다.** 논문의 $k=100$을 다른 제어 주파수나 다른 로봇에 그대로 옮기면 최적이 아닐 수 있다.'
],

figures:[
 {f:'fig4-architecture.png',
  cap:'왼쪽: CVAE 인코더(학습에만 사용)가 [CLS]·관절·행동 시퀀스를 받아 스타일 변수 z를 만든다. 오른쪽: 실제 정책인 디코더 — 4대 카메라 이미지(1~4)를 CNN으로 인코딩하고 관절 위치·z와 함께 transformer encoder에 넣은 뒤, transformer decoder가 고정 위치 임베딩을 쿼리로 사용해 행동 시퀀스를 한 번에 출력한다.',
  src:'원문 Figure 4, p.4'},
 {f:'fig5-ensemble.png',
  cap:'위쪽(잘린 부분)은 순수 chunking — k스텝마다 새 chunk로 갈아타 경계에서 행동이 튄다. 아래쪽 "Action Chunking + Temporal Ensemble"은 매 시점(t=0,1,2,3)마다 새 chunk를 뽑아, 같은 시점을 가리키는 여러 chunk의 예측(세로로 겹친 사각형들)을 지수가중 평균해 부드러운 행동을 만든다.',
  src:'원문 Figure 5, p.4'}
],

quotes:[
 {t:'To combat the compounding errors of imitation learning in a way that is compatible with pixel-to-action policies, we seek to reduce the effective horizon of long trajectories collected at high frequency.',
  src:'Section IV-A, p.4'}
],

links:[
 {t:'arXiv 2304.13705 — Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware', u:'https://arxiv.org/abs/2304.13705'},
 {t:'프로젝트 페이지 — tonyzhaozh.github.io/aloha', u:'https://tonyzhaozh.github.io/aloha/'}
]
});
