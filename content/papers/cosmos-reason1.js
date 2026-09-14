WIKI.paper({
slug:'cosmos-reason1',
venue:'arXiv 2025 (NVIDIA)',
authors:'NVIDIA',
arxiv:'2503.15558',

tldr:'물리 세계를 이해하고 체화된 행동을 결정하는 VLM. **물리 상식**과 **체화 추론**을 각각 온톨로지로 명시적으로 정의한 뒤, SFT와 규칙 기반 검증 보상 RL 두 단계로 학습해 로봇·자율주행·사람 행동 벤치마크에서 일관된 개선을 측정했다.',

context:'2024~2025년 추론 특화 LLM은 수학·코딩처럼 정답이 명확한 도메인에서 규칙 기반 보상으로 RL을 걸어 큰 성과를 냈다. 그런데 물리 세계와 상호작용해야 하는 **Physical AI**(로봇, 자율주행 등)는 사정이 다르다. 인터넷 텍스트로 학습한 LLM은 "공은 아래로 떨어진다" 같은 상식은 알아도, 그 지식을 실제 비디오 속 행동·인과관계와 연결하지 못하는 경우가 많다. 문제는 두 가지다 — (1) "물리 상식"과 "체화 추론"이 정의조차 합의돼 있지 않았고, (2) 수학처럼 채점하기 쉬운 검증 가능한 보상을 물리 세계 이해에 어떻게 설계할지가 불분명했다. Cosmos-Reason1은 이 둘을 온톨로지 설계와 규칙 기반 MCQ 보상으로 정면 돌파한다.',

ideas:[
 {h:'물리 상식 온톨로지: Space·Time·Fundamental Physics',
  lead:'물리 상식을 공간·시간·기초물리 3대 범주와 16개 세부 범주로 계층화한다.',
  d:'Space(관계·타당성·affordance·환경), Time(계획·카메라·인과관계·순서·행동), Fundamental Physics(속성·상태·object permanence·역학·전자기·열역학·anti-physics) 세 범주 아래 총 16개 세부 범주를 정의했다(Figure 2). 이 온톨로지에 따라 426개 비디오에서 604개 질문으로 구성된 벤치마크를 만들었다.'},
 {h:'체화 추론의 2차원 온톨로지',
  lead:'4가지 추론 능력 × 5가지 체화 유형(사람·동물·로봇팔·휴머노이드·자율주행차)을 교차한 표로 정의한다.',
  d:'"복잡한 감각 입력 처리", "행동 효과 예측", "물리적 제약 존중", "상호작용에서 학습"이라는 4개 능력을, 자연 에이전트(사람·동물)와 로봇 시스템(로봇팔·휴머노이드·자율주행차) 각각에 대한 구체적 예시로 짝지었다(Table 2). 추상적 정의로 끝내지 않고 각 조합마다 실제 사례를 명시해 벤치마크 설계의 근거로 삼았다.'},
 {h:'비디오 구조 자체에서 만드는 검증 가능한 보상',
  lead:'셔플된 시공간 패치 순서 맞추기, 영상의 시간 방향 판별 같은 자기지도적 MCQ로 규칙 기반 보상을 만든다.',
  d:'수학·코딩은 정답이 명확해 규칙 기반 보상을 걸기 쉽지만 물리 이해는 그렇지 않다. 이 논문은 사람이 만든 MCQ뿐 아니라, 비디오의 시공간 패치를 섞은 뒤 원래 순서를 맞히게 하거나 영상이 정방향인지 역방향인지 판별하게 하는 **자기지도적 MCQ**를 자동 생성해 두 번째 보상원으로 쓴다. 답이 MCQ 형식이므로 문자열 매칭만으로 정확도 보상을 줄 수 있고, `<think>`/`<answer>` 태그 형식을 지키는지 검사하는 포맷 보상을 더한다.'},
 {h:'GRPO로 두 단계 학습: Physical AI SFT → RL',
  lead:'4M 규모 비디오-텍스트 주석으로 SFT한 뒤, GRPO로 규칙 기반 보상 RL을 이어 붙인다.',
  d:'사람 주석과 DeepSeek-R1 증류로 만든 약 4백만 개의 비디오-텍스트 쌍(캡션·MCQ·긴 CoT 추론 트레이스)으로 먼저 SFT한다. 이후 [GRPO](#/p/grpo)로 정확도 보상과 포맷 보상을 결합해 RL을 진행하며, 별도 critic 모델 없이 그룹 내 보상을 정규화해 advantage를 얻는다.'},
 {h:'7B와 56B, 두 가지 백본으로 실험',
  lead:'7B는 Transformer, 56B는 [Mamba](#/p/mamba)-MLP-Transformer 하이브리드 백본으로 구성해 비교한다.',
  d:'Cosmos-Reason1-7B는 순수 dense Transformer LLM 백본(28층)을, 56B는 Mamba-MLP-Transformer 하이브리드(118층)를 쓴다. 비전 인코더도 크기가 다르다 — 7B는 ViT-676M에 동적 입력 크기, 56B는 ViT-300M에 고정 448×448 입력이다. 비디오는 시공간 다운샘플링(2×2×2 또는 2×2×1)을 거쳐 프로젝터로 LLM 토큰 공간에 맞춰진다.'}
],

diagram:{type:'flow', cap:'비디오·텍스트를 인코딩해 LLM에 넣고, SFT 이후 규칙 기반 보상 RL로 물리 추론을 강화한다.',
 nodes:[
  {t:'입력 비디오+텍스트', s:'MCQ·CoT'},
  {t:'Vision Encoder', s:'ViT'},
  {t:'Projector', s:'시공간 다운샘플'},
  {t:'LLM 백본', s:'Transformer/Mamba-MLP'},
  {t:'Physical AI RL', s:'GRPO + 규칙 보상', acc:true}
 ]},

math:[
 {expr:'GRPO advantage: normalize rewards within a group',
  tex:'A_i = \\frac{R(o_i) - \\text{mean}(\\{R(o_j)\\}_{j=1}^{G})}{\\text{std}(\\{R(o_j)\\}_{j=1}^{G})}',
  d:'critic 없이, 같은 프롬프트에 대해 생성한 $G$개 응답의 보상을 그룹 내에서 정규화해 advantage로 쓰는 [GRPO](#/p/grpo) 방식. 정확도 보상(문자열 매칭)과 포맷 보상(정규식 매칭)을 합쳐 $R(o_i)$ 를 구성한다.'}
],

numbers:[
 {k:'모델 크기', v:'7B / 56B', d:'§1 — 7B는 dense Transformer, 56B는 Mamba-MLP-Transformer 하이브리드 백본'},
 {k:'학습 데이터', v:'약 4M 비디오-텍스트 주석', d:'§1 — 사람 주석 + [DeepSeek-R1](#/p/deepseek-r1) 증류로 구성한 Physical AI SFT 데이터'},
 {k:'물리 상식 벤치마크', v:'604문항 / 426비디오', d:'§1 — Space·Time·Fundamental Physics 3개 벤치마크 합계'},
 {k:'Physical AI RL 평균 개선', v:'60.7 → 65.7 (+5.0)', d:'Table 9, Cosmos-Reason1-7B, 6개 체화 추론 벤치마크(BridgeData V2·RoboVQA·Agibot·HoloAssist·AV·RoboFail) 평균'},
 {k:'RoboVQA 개선', v:'83.8 → 86.8', d:'Table 9 — RL 후 개별 벤치마크 중 하나, RL이 전 벤치마크에서 일관되게 개선시킨 것은 아님(HoloAssist는 63.0→60.0으로 소폭 하락)'},
 {k:'RL 학습 설정', v:'배치 128 · 질문당 9샘플 · 500 iter', d:'§7.2.1 — 학습률 4×10⁻⁶, KL 계수 0.005, 응답 길이 상한 6144토큰'}
],

impact:'"물리 상식"과 "체화 추론"을 막연한 목표가 아니라 명시적 온톨로지와 벤치마크로 정의해, Physical AI를 위한 VLM 평가에 재사용 가능한 기준을 남겼다. 또한 수학·코딩 밖의 도메인에서도 규칙 기반 검증 가능한 보상을 설계할 수 있음(비디오 구조 자체를 이용한 self-supervised MCQ)을 보여, RL 훈련이 어려운 open-ended 영역에 규칙 기반 보상을 적용하는 방법론을 제시했다.',

legacy:[
 '**Physical AI 평가 온톨로지의 재사용** — Space/Time/Fundamental Physics, 체화 유형×추론 능력 매트릭스가 이후 embodied VLM 평가의 참조 구조로 쓰임',
 '**비디오 구조 기반 자기지도 보상** — 셔플 패치 순서·시간 방향 판별처럼 라벨 없이 만드는 검증 가능한 보상 설계가 다른 물리 이해 RL 연구에 참조됨',
 '[NVIDIA Cosmos](#/p/cosmos) 플랫폼의 이해·추론 축을 담당하며, 이후 Physical AI 관련 NVIDIA 오픈모델 계열의 기반이 됨'
],

pitfalls:[
 '**Physical AI RL이 모든 벤치마크를 개선시킨 것은 아니다.** Table 9에서 HoloAssist는 RL 후 63.0→60.0으로 오히려 떨어졌다 — "RL이 전부 올렸다"고 뭉뚱그리면 틀린다.',
 '**RL 단계는 MCQ에만 적용됐다.** 논문은 "we exclusively use MCQs for RL"이라고 명시한다 — 자유 서술형 응답에 규칙 기반 보상을 직접 적용한 것이 아니라, 검증 가능성을 위해 MCQ 형식으로 제한한 것이다.',
 '**7B와 56B는 비전 인코더·LLM 백본이 둘 다 다르다.** 56B가 단순히 7B를 스케일업한 것이 아니라 Mamba-MLP-Transformer 하이브리드로 백본 자체가 바뀐다 — "같은 아키텍처의 큰 버전"으로 오해하지 않는다.'
],

figures:[
 {f:'fig2-ontology.png',
  cap:'물리 상식 온톨로지 파이 차트. 안쪽 3개 조각이 Space(빨강)·Time(초록)·Fundamental Physics(파랑) 대분류, 바깥쪽 16개 조각이 세부 범주(예: Fundamental Physics 아래 Object Permanence·Mechanics·Thermodynamics 등). 이 구조 그대로 물리 상식 벤치마크 3종이 만들어졌다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'Constructing rule-based, verifiable rewards at scale has been critical for the reasoning LLMs’ success in solving math and coding problems. Can we design rule-based, verifiable rewards for training Physical AI reasoning models with reinforcement learning?',
  src:'Section 1, p.2'}
],

links:[
 {t:'arXiv 2503.15558 — Cosmos-Reason1', u:'https://arxiv.org/abs/2503.15558'},
 {t:'GitHub — nvidia-cosmos/cosmos-reason1', u:'https://github.com/nvidia-cosmos/cosmos-reason1'}
]
});
