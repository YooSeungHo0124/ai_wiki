WIKI.paper({
slug:'rt1',
venue:'RSS 2023 (arXiv 2022)',
authors:'Brohan, Brown, Carbajal, Chebotar et al. (Robotics at Google · Everyday Robots)',
arxiv:'2212.06817',

tldr:'13만 개 실제 로봇 시연을 하나의 Transformer로 학습시켜, 700개 이상의 지시를 **97% 성공률**로 수행하고 새 과제·물체·환경으로도 일반화되는 것을 보였다. [Gato](#/p/gato)식 범용 토큰화가 아니라, **실시간 추론이 가능한 압축 아키텍처**로 규모를 실물 로봇에 맞춘 것이 핵심.',

context:'[Gato](#/p/gato)는 하나의 모델로 여러 임무를 처리할 수 있음을 보였지만 로봇 과제의 폭이 좁았고, 다른 지시 따르기 연구들은 새 과제로의 일반화 대신 학습한 과제 자체의 성능에 머물러 있었다. 로봇 학습의 근본 병목은 데이터다 — 비전·NLP는 인터넷 규모 데이터로 일반화를 얻었지만, 로봇 데이터는 사람이 직접 원격조작으로 모아야 해서 몇 자릿수 적다. 이 논문의 질문은 "충분히 크고 다양한 실제 로봇 데이터를 모으고, 그것을 흡수할 만큼 고용량이면서도 실시간으로 도는 아키텍처를 쓰면 일반화가 되는가"이다.',

ideas:[
 {h:'FiLM-EfficientNet으로 이미지·언어를 한 번에 압축',
  lead:'사전학습된 [EfficientNet](#/p/efficientnet)에 지시문 임베딩을 FiLM으로 주입해 언어 조건부 시각 특징을 뽑는다.',
  d:'6장의 최근 이미지를 ImageNet 사전학습 EfficientNet-B3에 통과시키되, 각 층에 지시문 임베딩으로 만든 FiLM 아핀 변환을 끼워 넣는다. FiLM 가중치를 항등변환으로 초기화해 사전학습된 특징을 초반에 보존하는 것이 요령이다. 결과는 81개의 시각-언어 토큰.'},
 {h:'TokenLearner로 81개 토큰을 8개로 압축',
  lead:'Transformer가 처리할 토큰 수를 81개에서 8개로 줄여 추론 속도를 확보한다.',
  d:'요소별 attention으로 중요한 토큰 조합만 골라내는 TokenLearner를 EfficientNet 출력 뒤에 넣어, 이후 Transformer 층이 훨씬 적은 토큰을 처리하게 한다. 이 압축이 없으면 35M 파라미터 모델도 3Hz 실시간 제어를 맞추지 못한다.'},
 {h:'행동을 256개 구간으로 이산화한 8차원 토큰',
  lead:'팔 6자유도+그리퍼, 베이스 3자유도, 모드 전환까지 전부 256-bin 이산 토큰으로 표현한다.',
  d:'행동은 팔의 위치·회전·그리퍼 개폐(7차원), 베이스의 x·y·yaw(3차원), 그리고 팔/베이스/종료를 고르는 이산 모드까지 총 8개 변수이고, 각 변수를 256개 구간 중 하나로 매핑한다. Gato처럼 연속값을 통째로 토큰화하는 대신, 로봇 제어에 필요한 변수만 고정된 스키마로 압축한 것.'},
 {h:'700개 이상 과제를 아우르는 13만 시연, 13대 로봇, 17개월',
  lead:'다양성과 규모를 동시에 확보한 데이터셋 자체가 이 논문의 실질적 기여다.',
  d:'모델 구조보다 데이터 수집이 핵심 병목이라는 전제 아래, 13대의 이동형 매니퓰레이터로 17개월간 부엌 환경에서 13만 에피소드·700+ 과제(동사×명사 조합)를 모았다. 저자들은 명시적으로 "일반화에는 규모와 폭이 함께 필요하다"고 강조한다.'},
 {h:'시뮬레이션·이종 로봇 데이터를 섞어도 성능이 유지된다',
  lead:'Kuka 빈 피킹 데이터·시뮬레이션 데이터를 섞어 넣어도 원래 과제 성능은 떨어지지 않는다.',
  d:'RT-1에 시뮬레이션 데이터나 완전히 다른 로봇(Kuka)의 데이터를 함께 학습시켜도 기존 과제 성능이 유지되면서 새로운 상황에 대한 일반화가 오히려 좋아졌다. 이는 이후 [Open X-Embodiment](#/p/openvla) 같은 다중 로봇 통합 데이터셋 흐름의 실증적 근거가 됐다.'}
],

diagram:{type:'flow', cap:'6프레임 이미지 + 지시문이 FiLM-EfficientNet → TokenLearner로 81개에서 8개 토큰으로 압축된 뒤 Transformer를 거쳐 3Hz로 이산 행동 토큰을 낸다.',
 nodes:[
  {t:'이미지 6프레임', s:'+ 지시문'},
  {t:'FiLM-EffNet', s:'81 토큰', acc:true},
  {t:'TokenLearner', s:'81 → 8 토큰'},
  {t:'Transformer', s:'디코더 전용'},
  {t:'행동 토큰', s:'256-bin × 8차원, 3Hz'}
 ]},

math:[
 {expr:'π(a_t | i, x_{t-5:t}) via BC, action bins = 256',
  tex:'\\pi_\\theta(a_t \\mid i,\\, x_{t-5:t}) = \\prod_{d=1}^{8}\\text{softmax}\\big(f_\\theta^{(d)}(i, x_{t-5:t})\\big)',
  d:'행동의 8개 변수 각각을 256-way 분류 문제로 풀고, 교차 엔트로피 손실로 지도학습한다. 연속 회귀 대신 이산 분류를 쓴 것은 [Gato](#/p/gato)와 같은 선택이지만, RT-1은 행동 스키마를 로봇에 맞춰 훨씬 좁게 고정했다.'}
],

numbers:[
 {k:'파라미터', v:'35M', d:'Gato(1.2B)의 약 1/34 — 실시간 제어를 위한 의도적 축소'},
 {k:'추론 속도', v:'3Hz', d:'closed-loop 실시간 제어 하한'},
 {k:'학습 데이터', v:'~13만 에피소드 · 700+ 과제', d:'13대 로봇 · 17개월 수집'},
 {k:'학습 과제 성공률', v:'97%', d:'700개 이상 훈련 지시 기준'},
 {k:'미학습 과제 일반화', v:'76%', d:'21개 새 과제, baseline 대비 +25%p'},
 {k:'배경/방해물 강건성', v:'배경 59% · 방해물 83%', d:'차선 baseline 대비 각각 +18%p·+36%p'}
],

impact:'RT-1은 "로봇 데이터가 부족하다"는 문제를 새 알고리즘이 아니라 **데이터 수집 파이프라인 자체를 스케일링**하는 것으로 정면 돌파했다. 이 데이터 스케일이 SayCan과 결합해 50단계짜리 초장기 과제 수행까지 가능하게 했고([SayCan](#/p/saycan) 프레임워크에 RT-1을 끼워 넣은 실험), 이후 로봇 파운데이션 모델 연구가 "얼마나 다양한 실제 로봇 데이터를 모았는가"를 핵심 지표로 삼게 만들었다. 동시에 압축 아키텍처(FiLM+TokenLearner)가 실시간 제약과 Transformer 용량을 동시에 만족시킬 수 있음을 보여, 이후 VLA들이 "큰 VLM을 그대로 쓰되 추론을 어떻게 빠르게 할까"를 고민하는 계보의 시작점이 됐다.',

legacy:[
 '**행동 토큰화 스키마의 표준화** — [RT-2](#/p/rt2)가 이 이산 행동 표현을 그대로 물려받아 VLM의 텍스트 어휘 안에 행동 토큰을 끼워 넣는 방식으로 확장',
 '**데이터 스케일 우선주의** — [Open X-Embodiment](#/p/open-x) 데이터셋(970k+ 에피소드)이 RT-1의 "규모+다양성" 논지를 여러 로봇으로 확장한 직접적 후속',
 '**SayCan과의 결합** — [SayCan](#/p/saycan)의 저수준 정책을 RT-1로 교체하면서 50단계 장기 과제까지 성공률이 크게 개선됨을 실증',
 '**압축 아키텍처의 계승** — 이후 경량 VLA들이 TokenLearner류의 토큰 압축 기법을 실시간 제약 해결책으로 재사용'
],

pitfalls:[
 '**97% 성공률은 "학습에 포함된 700여 과제"에 대한 수치다.** 미학습 과제 일반화는 76%로 뚝 떨어지며, 두 수치를 혼동해 RT-1이 임의의 새 과제에서도 97%라고 오해하면 안 된다.',
 '**13대의 특정 이동형 매니퓰레이터·특정 부엌 환경에서 나온 성공률**이라, 하드웨어·환경이 다른 다른 VLA 논문의 성공률과 직접 비교할 수 없다 — 로봇 평가 전반에 공통되는 재현성 문제다.',
 '**35M 파라미터라는 작은 크기는 Gato 대비 "다운그레이드"가 아니라 실시간 제어(3Hz)를 위한 설계 선택이다.** 이후 RT-2가 크기를 다시 55B까지 키우면서, 이 3Hz 제약을 유지하기 위해 별도의 클라우드 추론 구조를 도입해야 했다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽에서 이미지 6프레임과 지시문이 들어가 FiLM EfficientNet(주황·초록 블록)을 통과하며 언어로 조건화된 시각 토큰이 되고, TokenLearner(파랑)가 이를 소수로 압축한 뒤 Transformer(빨강·보라)가 3Hz로 오른쪽의 Mode/Arm/Base 이산 행동 토큰을 출력한다.',
  src:'원문 Figure 1(a), p.2'}
],

quotes:[
 {t:'We argue that one of the keys to the success of general robotic models lies with open-ended task-agnostic training, combined with high-capacity architectures that can absorb all of the diverse, robotic data.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2212.06817 — RT-1: Robotics Transformer for Real-World Control at Scale', u:'https://arxiv.org/abs/2212.06817'},
 {t:'프로젝트 페이지 — robotics-transformer1.github.io', u:'https://robotics-transformer1.github.io/'}
]
});
