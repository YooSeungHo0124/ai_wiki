WIKI.paper({
slug:'dqn-2013',
venue:'NIPS 2013 Deep Learning Workshop',
authors:'Mnih et al. (DeepMind)',
arxiv:'1312.5602',

tldr:'raw 픽셀만 보고 여러 Atari 게임을 플레이하도록 강화학습으로 학습시킨 최초 성공 사례. CNN + Q-learning + **경험 재생(experience replay)**을 결합해, 게임마다 손으로 특징을 설계하지 않고도 동일한 구조·하이퍼파라미터로 7개 게임을 학습했다.',

context:'2013년까지 강화학습은 손으로 만든 특징(feature)과 선형 함수 근사에 의존했다. 비선형 함수 근사(신경망)로 Q-value를 추정하면 발산하기 쉽다는 것이 통념이었고, 실제로 TD-gammon 이후 체스·바둑 등에 같은 방식을 옮기려는 시도는 대부분 실패했다. 강화학습 데이터는 지도학습과 달리 **보상이 희소·지연**되고, 연속된 샘플끼리 **상관관계가 강하며**, 정책이 바뀌면 데이터 분포 자체가 바뀐다 — 딥러닝이 가정하는 "고정된 분포의 독립 샘플"과 정반대다. 이 논문은 CNN 하나로 raw RGB 화면만 보고 여러 아케이드 게임을 사람 수준 근처까지 플레이할 수 있는지를 물었다.',

ideas:[
 {h:'CNN을 Q-function 근사기로',
  lead:'상태(화면 4장)를 입력으로, 각 행동의 Q값을 출력으로 하는 CNN 하나로 통일한다.',
  d:'입력은 84×84×4 흑백 프레임 스택(직전 4프레임), 은닉층은 8×8/stride4 conv 16개 → 4×4/stride2 conv 32개 → FC 256 유닛이고, 출력은 **행동별로 하나씩** Q값을 내는 선형층이다. 상태-행동 쌍마다 forward pass를 따로 돌리는 대신, 한 번의 forward로 모든 행동의 Q값을 동시에 얻는다.'},
 {h:'경험 재생: 시간 순서를 깨서 상관관계를 없앤다',
  lead:'과거 전이 $(s,a,r,s_{t+1})$ 를 버퍼에 모았다가 무작위로 섞어 미니배치를 만든다.',
  d:'매 스텝의 전이를 replay memory(최대 100만개)에 저장하고, 학습 시에는 그중 32개를 무작위로 뽑아 SGD 업데이트를 한다. 이렇게 하면 ①연속 프레임 간 강한 상관관계가 깨지고 ②한 전이가 여러 번 재사용돼 데이터 효율이 오르며 ③현재 정책이 다음 샘플을 결정하는 되먹임 루프(예: 왼쪽으로만 이동하는 정책이 왼쪽 데이터만 만드는 것)가 완화된다. 재생을 쓰면 필연적으로 **off-policy** 학습이 되므로 Q-learning이 자연스러운 선택이다.'},
 {h:'보상 클리핑과 프레임 스킵',
  lead:'보상을 {-1,0,1}로 자르고 k프레임마다 한 번만 행동을 선택해 7개 게임에 같은 학습률을 쓴다.',
  d:'게임마다 점수 스케일이 크게 다르므로(Pong은 ±1, Q*bert는 수천) 양의 보상은 전부 +1, 음의 보상은 전부 -1로 잘라 오차의 크기를 게임 간에 통일했다. 또 매 프레임마다 행동을 고르는 대신 k번째 프레임마다만 고르고 그 사이엔 마지막 행동을 반복해(Space Invaders만 k=3, 나머지는 k=4) 에이전트가 실제로 겪는 게임 수를 늘렸다.'},
 {h:'평가 지표로 평균 보상 대신 평균 Q값',
  lead:'가중치가 조금만 바뀌어도 방문 상태 분포가 크게 바뀌어 보상 곡선이 매우 시끄럽다.',
  d:'학습 중 에피소드 평균 보상은 진동이 심해 학습이 되고 있는지 판단하기 어렵다. 대신 고정된 상태 집합(학습 전 무작위 정책으로 수집)에 대해 예측된 최대 Q값의 평균을 추적하면 훨씬 매끄럽게 우상향하는 것을 관찰했고, 이것이 이후 DQN 계열 연구에서 표준 진단 도구가 되었다.'}
],

diagram:{type:'flow', cap:'raw 화면에서 행동까지. 타깃 네트워크가 없어 손실의 타깃 $y_j$ 도 같은 네트워크 $\\theta$ 로 계산된다.',
 nodes:[
  {t:'화면 4프레임', s:'84×84×4 스택'},
  {t:'Conv 8×8 s4', s:'16채널 · ReLU'},
  {t:'Conv 4×4 s2', s:'32채널 · ReLU'},
  {t:'FC 256', s:'ReLU'},
  {t:'행동별 Q값', s:'4~18개 출력', acc:true, note:'단일 forward'}
 ]},

math:[
 {expr:'y_j = r_j            (terminal), r_j + γ max_a\' Q(s_{j+1}, a\'; θ)   (non-terminal)',
  tex:'y_j=\\begin{cases}r_j & \\text{terminal}\\\\ r_j+\\gamma\\max_{a\'}Q(s_{j+1},a\';\\theta) & \\text{non-terminal}\\end{cases}',
  d:'미니배치의 각 전이 $j$ 에 대해 이 타깃 $y_j$ 를 만들고, $(y_j - Q(s_j,a_j;\\theta))^2$ 를 SGD로 줄인다. 타깃과 예측이 **같은 파라미터 $\\theta$** 를 쓴다는 점이 2015년 Nature 버전과 다른 지점이다.'},
 {expr:'L_i(θ_i) = E[(y_i − Q(s,a;θ_i))²],  y_i = E[r + γ max_a\' Q(s\',a\';θ_{i−1}) | s,a]',
  tex:'L_i(\\theta_i)=\\mathbb{E}_{s,a\\sim\\rho}\\big[(y_i-Q(s,a;\\theta_i))^2\\big]',
  d:'Bellman 최적 방정식을 반복 적용하는 value iteration을 신경망 파라미터 $\\theta$ 에 대한 회귀 문제로 바꾼 것. $\\theta_{i-1}$ 은 그 스텝 동안만 고정해 지도학습처럼 취급한다.'}
],

numbers:[
 {k:'대상 게임 수', v:'7개', d:'Beam Rider·Breakout·Enduro·Pong·Q*bert·Seaquest·Space Invaders'},
 {k:'인간 대비 우위', v:'3개 게임', d:'Breakout·Enduro·Pong에서 인간 전문가를 능가'},
 {k:'기존 방법 대비 우위', v:'6/7개 게임', d:'Sarsa·Contingency(손수 설계한 특징 기반)를 큰 차로 앞섬'},
 {k:'replay memory 크기', v:'100만 전이', d:'최근 N개만 유지, 균일 무작위 샘플링'},
 {k:'학습량', v:'1000만 프레임', d:'ε는 100만 프레임에 걸쳐 1→0.1로 선형 감소'},
 {k:'Breakout 점수', v:'DQN 168 vs Human 31', d:'Q*bert(1952 vs 18900)·Seaquest(1705 vs 28010)는 반대로 사람이 크게 앞섬 — 장기 전략이 필요한 게임에서 격차'}
],

impact:'딥러닝과 강화학습을 결합해도 "발산한다"는 통념을 깨고, 손으로 설계한 특징 없이 raw 픽셀만으로 여러 게임을 하나의 네트워크·하이퍼파라미터로 학습할 수 있음을 처음 보였다. 여기서 검증된 CNN+experience replay 조합은 이후 [DQN](#/p/dqn) (2015 Nature판)에서 **타깃 네트워크**를 더해 49개 게임으로 확장되며 완성된 알고리즘이 되었다. 이 워크숍판은 그 알고리즘의 최소 골격을 보여준 원형이다.',

legacy:[
 '**Nature DQN(2015)** — [DQN](#/p/dqn)이 타깃 네트워크를 추가하고 게임 수를 7→49로 늘려, 이 논문의 핵심 아이디어(CNN + replay)를 안정화·일반화',
 '**개선 계열** — [Rainbow](#/p/rainbow)가 double Q, prioritized replay, dueling 등 이후 제안된 개선들을 한데 묶어 검증',
 '**연속 행동으로 확장** — [DDPG](#/p/ddpg)가 같은 replay+off-policy 아이디어를 연속 제어로 이식',
 '**분산·비동기 학습** — [A3C](#/p/a3c)는 반대로 replay 없이 여러 액터를 병렬로 돌려 상관관계를 깨는 대안 경로를 제시'
],

pitfalls:[
 '**타깃 네트워크가 없다.** 손실의 타깃 $y_j$ 를 계산할 때도 학습 중인 같은 $\\theta$ 를 그대로 쓴다. 이 때문에 타깃이 매 스텝 흔들려 이론적으로는 불안정할 수 있는데, 저자들도 발산을 겪지는 않았다고만 보고할 뿐 안정성을 보장하는 장치는 아직 없다.',
 '**"DQN"이라는 이름이 이 논문과 2015 Nature판 둘 다를 가리켜 혼동되기 쉽다.** 위키의 [DQN](#/p/dqn) 항목은 타깃 네트워크가 있는 49게임 Nature판이고, 이 항목(dqn-2013)은 그 전신인 7게임 워크숍판이다.',
 '**보상 클리핑의 부작용.** 모든 양의 보상을 +1로 자르면 학습은 안정되지만, 보상 크기 차이(예: 적을 잡는 것과 보너스 아이템의 가치 차이)를 에이전트가 구별하지 못하게 된다.'
],

figures:[
 {f:'fig2-training-curves.png',
  cap:'왼쪽 두 그래프(Breakout·Seaquest 평균 보상)는 위아래로 크게 진동해 학습 여부를 판단하기 어렵다. 오른쪽 두 그래프(평균 최대 예측 Q값)는 같은 학습 과정인데도 매끄럽게 우상향한다 — 그래서 논문은 Q값을 학습 진단 지표로 쓴다.',
  src:'원문 Figure 2, p.7'},
 {f:'fig3-value-function.png',
  cap:'Seaquest 30프레임 구간의 예측 가치 곡선. A(적 등장)에서 값이 뛰고, B(어뢰가 적에 명중 직전)에서 정점을 찍은 뒤, C(적 소멸)에서 원래 수준으로 떨어진다 — 학습된 가치함수가 게임 사건을 실제로 반영한다는 근거.',
  src:'원문 Figure 3, p.7'}
],

quotes:[
 {t:'We present the first deep learning model to successfully learn control policies directly from high-dimensional sensory input using reinforcement learning.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1312.5602 — Playing Atari with Deep Reinforcement Learning', u:'https://arxiv.org/abs/1312.5602'},
 {t:'DeepMind DQN (Nature 2015)', u:'https://www.nature.com/articles/nature14236'}
]
});
