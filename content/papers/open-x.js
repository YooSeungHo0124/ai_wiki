WIKI.paper({
slug:'open-x',
venue:'ICRA 2024',
authors:'Open X-Embodiment Collaboration (21개 기관 · Google DeepMind 주도)',
arxiv:'2310.08864',

tldr:'34개 로봇 연구실이 모은 60개 데이터셋을 하나의 포맷으로 통합해 **22종 로봇·1백만 개 이상의 궤적**을 담은 Open X-Embodiment 데이터셋을 공개하고, 이를 학습한 RT-X가 각 로봇 전용 모델보다 더 잘 작동함을 보였다. 로보틱스에서 "여러 출처의 데이터를 모으면 개별 데이터로 학습한 모델을 능가한다"는 것을 처음 실측으로 입증했다.',

context:'2023년까지 로봇 조작 학습은 로봇마다, 환경마다 따로 데이터를 모으고 따로 모델을 학습하는 것이 관행이었다. [RT-1](#/p/rt1)이 13만 개 시연으로 단일 로봇에서 강력한 일반화를 보였고 [RT-2](#/p/rt2)가 웹 규모 vision-language 사전학습을 로봇 제어에 연결했지만, 두 모델 모두 **하나의 로봇, 하나의 액션 공간**을 벗어나지 못했다. 비전·NLP는 이미 [CLIP](#/p/clip)·대형 언어모델처럼 웹 규모 데이터를 한데 모아 사전학습하는 방식으로 수렴했는데, 로보틱스에는 그런 통합 데이터셋과 "여러 로봇 데이터를 섞으면 실제로 도움이 되는가"에 대한 실증이 없었다. 각 로봇의 관측·행동 공간이 카메라 배치부터 자유도, 제어 주파수까지 전부 달라 데이터를 합치는 것 자체가 공학적으로 미해결 문제였다.',

ideas:[
 {h:'RLDS로 이종 로봇 데이터를 한 포맷에 담는다',
  lead:'서로 다른 카메라·행동 공간을 가진 60개 데이터셋을 RLDS 하나의 스키마로 표준화한다.',
  d:'로봇마다 RGB·깊이 카메라 수, 절대/상대 좌표계, 제어 주파수(3~10Hz)가 다르다. 이를 직접 통일하는 대신, `tfrecord` 기반 RLDS 포맷 위에 각 데이터셋을 그대로 얹고 대표 카메라 뷰 하나를 고르고 행동을 7자유도(x,y,z,roll,pitch,yaw,그리퍼) 벡터로 느슨하게 맞춘다. 좌표계 자체는 정렬하지 않아, 같은 행동 벡터가 로봇마다 다른 움직임을 낼 수 있다는 것을 그대로 감수한 절충이다.'},
 {h:'RT-X: 기존 아키텍처를 그대로 쓰고 데이터만 합친다',
  lead:'새 아키텍처를 만들지 않고 [RT-1](#/p/rt1)·[RT-2](#/p/rt2)에 X-embodiment 데이터를 얹어 이득이 데이터에서 오는지 검증한다.',
  d:'저자들은 "새 알고리즘을 제안하는 것이 아니라, 데이터와 도구를 제공해 X-embodiment 연구를 촉진하는 것"이 목표라고 명시한다. RT-1을 그대로 쓴 RT-1-X와 RT-2를 그대로 쓴 RT-2-X를 9개 로봇의 혼합 데이터로 co-training해, 아키텍처는 고정한 채 데이터 통합의 효과만 분리해서 측정했다.'},
 {h:'소규모 데이터 도메인에서의 양의 전이',
  lead:'데이터가 적은 로봇 도메인일수록 다른 로봇 데이터를 섞은 co-training이 크게 도움이 된다.',
  d:'Kitchen Manipulation·Cable Routing·NYU Door Opening 등 자체 데이터가 적은 5개 도메인에서 RT-1-X는 그 도메인 전용 모델(Original Method)을 5개 중 4개에서 능가했다. 반대로 Bridge·RT-1 데이터처럼 이미 자체 데이터가 큰 도메인에서는 RT-1-X가 오히려 RT-1보다 못했는데(underfitting), 이는 35M 파라미터의 RT-1 용량이 22개 로봇의 이질적 데이터를 동시에 담기에 부족하다는 뜻이다.'},
 {h:'RT-2-X: 용량을 키우면 대규모 데이터에서도 전이가 살아난다',
  lead:'55B 파라미터의 RT-2-X는 대규모 데이터 도메인에서도 원래 모델과 RT-1을 모두 능가한다.',
  d:'RT-1-X가 큰 데이터셋에서 부족했던 지점을, 웹 사전학습된 55B VLM 기반 RT-2-X는 넘어선다. 나아가 RT-2-X는 학습 데이터에 전혀 없던 새로운 물체·동작을 다른 로봇의 데이터에서 가져와 수행하는 **emergent skill** 평가에서 RT-2 단독(27.3%) 대비 75.8%로 크게 앞서, 모델 용량이 X-embodiment 데이터를 흡수하는 전제조건임을 보였다.'}
],

diagram:{type:'flow', cap:'34개 연구실의 60개 이종 로봇 데이터셋을 RLDS로 통합해 하나의 정책(RT-1-X/RT-2-X)을 학습시킨다.',
 nodes:[
  {t:'60개 데이터셋', s:'34개 연구실 · 22종 로봇'},
  {t:'RLDS 표준화', s:'카메라·행동 정렬', acc:true},
  {t:'통합 데이터셋', s:'1M+ 궤적'},
  {t:'RT-1-X·RT-2-X', s:'기존 아키텍처 그대로'},
  {t:'개별 로봇 평가', s:'6개 로봇 · 3600 trial'}
 ]},

math:[
 {expr:'action = (x, y, z, roll, pitch, yaw, gripper)  — 7-DoF, 256-bin 이산화',
  tex:'a \\in \\{0,\\dots,255\\}^{8}\\quad (\\text{7 자유도} + \\text{episode 종료 비트})',
  d:'모든 로봇의 행동을 7차원 end-effector 벡터로 느슨히 맞춘 뒤 각 차원을 256개 구간으로 이산화한다. RT-1·RT-2가 공유하는 행동 표현이며, 절대/상대 좌표계 차이는 정렬하지 않는다.'}
],

numbers:[
 {k:'데이터 규모', v:'1M+ 궤적 · 60개 데이터셋', d:'34개 로봇 연구실의 기존 데이터셋을 통합'},
 {k:'로봇 종류', v:'22개 embodiment', d:'단일 팔부터 양팔·四족 보행 로봇까지'},
 {k:'스킬·태스크', v:'527 skills (160,266 tasks)', d:'PaLM으로 언어 지시에서 동사·목적어를 추출해 집계'},
 {k:'소규모 도메인 개선', v:'RT-1-X 평균 성공률 +50%p대', d:'Fig.4, Original Method·RT-1 대비 (예: NYU Door Opening 53→80%)'},
 {k:'대규모 도메인 (RT-1-X)', v:'Bridge 27% vs RT-1 40%', d:'Table I, 35M 파라미터 RT-1-X는 데이터가 많은 도메인에서 오히려 underfitting'},
 {k:'emergent skill', v:'RT-2-X 75.8% vs RT-2 27.3%', d:'55B 모델, 학습 데이터에 없던 물체·동작에 대한 평가'}
],

impact:'로보틱스 데이터에 "많은 소스를 섞으면 실제로 좋아진다"는 정량적 근거를 처음 제공했다. 이후 로봇 학습 연구는 자체 소규모 데이터를 모으는 대신 Open X-Embodiment 같은 공통 데이터셋 위에서 사전학습하는 것을 기본 절차로 채택했고, RT-1-X/RT-2-X는 로봇 정책의 "사전학습된 백본" 개념을 정착시켰다. 동시에 RT-1-X의 underfitting 결과는 "데이터를 합치는 것만으로는 부족하고 그 데이터를 담을 모델 용량이 함께 필요하다"는, 이후 [OpenVLA](#/p/openvla)·[π0](#/p/pi0) 같은 대형 VLA 설계의 근거가 되었다.',

legacy:[
 '**표준 사전학습 데이터셋으로 정착** — 이후 로봇 정책 논문 다수가 자체 데이터 대신 Open X-Embodiment 위에서 시작',
 '**대형 VLA로의 직결** — [OpenVLA](#/p/openvla)가 이 데이터셋을 학습 데이터의 핵심 축으로 사용하며 이 논문의 후속으로 자리매김',
 '**RLDS 포맷의 확산** — 이종 로봇 데이터를 다루는 표준 저장 포맷으로 이후 로봇 학습 파이프라인에 자리잡음',
 '**"모델 용량이 전제조건"이라는 교훈** — RT-1-X의 실패 사례가 이후 대형 VLA 설계에서 스케일을 우선하는 근거로 인용됨'
],

pitfalls:[
 '**"데이터만 합치면 항상 좋아진다"가 아니다.** 대규모 데이터 도메인에서 RT-1-X는 오히려 RT-1보다 성능이 낮았다 — 용량이 부족한 모델에 이종 데이터를 섞으면 underfitting이 난다.',
 '**좌표계를 정렬하지 않은 "coarse alignment"라는 점을 놓치기 쉽다.** 같은 7차원 행동 벡터라도 로봇마다 실제 움직임이 다르게 해석되며, 이는 완전한 embodiment 통일이 아니라 실용적 절충이다.',
 '**21개 기관(저자 소속) vs 34개 연구실(데이터 출처)을 혼동하기 쉽다.** 논문은 "21개 기관의 협업"과 "34개 로봇 연구실에서 가져온 60개 데이터셋"을 구분해서 쓴다.'
],

figures:[
 {f:'fig1-dataset.png',
  cap:'데이터셋 구성 요약 인포그래픽. 1M 에피소드가 311개 장면에서, 34개 연구실이 21개 기관 소속으로 참여해 모았고, 22종 embodiment·527개 스킬·60개 데이터셋으로 구성된다. 맨 아래 1,798개 attribute·5,228개 object·23,486개 spatial relation은 언어 지시문에서 추출한 다양성 지표.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-results.png',
  cap:'5개 소규모 데이터 도메인(각 연구실 로고 아래)에서 회색 막대(RT-1, 같은 데이터로만 학습)와 빨간 막대(RT-1-X, X-embodiment co-training)를 비교한다. Cable Routing만 빼면 전 도메인에서 RT-1-X가 더 높고, 맨 오른쪽 Mean 막대가 평균 63% vs 44%로 약 50% 상대적 개선을 보여준다.',
  src:'원문 Figure 4, p.5'}
],

quotes:[
 {t:'We assemble a dataset from 22 different robots collected through a collaboration between 21 institutions, demonstrating 527 skills (160266 tasks).',
  src:'Abstract, p.1'},
 {t:'Our aim is not to innovate in terms of the particular architectures and algorithms, but rather to provide the model that we trained together with data and tools to energize research around X-embodiment robotic learning.',
  src:'Section I, p.1'}
],

links:[
 {t:'arXiv 2310.08864 — Open X-Embodiment', u:'https://arxiv.org/abs/2310.08864'},
 {t:'프로젝트 페이지 — robotics-transformer-x.github.io', u:'https://robotics-transformer-x.github.io/'}
]
});
