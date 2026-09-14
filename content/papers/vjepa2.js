WIKI.paper({
slug:'vjepa2',
venue:'arXiv 2025 (Meta FAIR)',
authors:'Assran, Bardes, Fan, Garrido, Howes et al. (FAIR at Meta · Mila)',
arxiv:'2506.09985',

tldr:'[V-JEPA](#/p/vjepa)를 100만 시간 규모 인터넷 영상으로 키운 뒤, **62시간 미만의 라벨 없는 로봇 팔 영상**만으로 행동 조건부 예측기를 얹어 실제 로봇에 **제로샷으로** 배치했다. 픽셀이 아니라 표현 공간에서 미래를 예측하는 JEPA 원칙이 이해·예측뿐 아니라 계획까지 이어진다는 것을 보였다.',

context:'영상에서 자기지도로 표현을 배우는 방법은 크게 픽셀을 직접 복원하는 계열(마스킹 오토인코더류)과, 표현 공간에서 예측하는 [JEPA](#/p/ijepa) 계열로 나뉜다. 픽셀 복원은 조명·질감처럼 예측에 불필요한 디테일까지 맞히려 해 학습 신호가 흐려지는 반면, JEPA는 "가려진 부분의 표현이 무엇일지"만 맞히면 된다. 문제는 이 원칙이 이미지([I-JEPA](#/p/ijepa))와 짧은 영상([V-JEPA](#/p/vjepa))에서는 검증됐지만, 실제로 **행동의 결과를 예측해 로봇을 계획에 쓰는 데까지** 이어지는지는 미지수였다. 이 논문은 그 사슬을 인터넷 규모 영상 사전학습 → 소량 로봇 상호작용 데이터로 행동 조건부 예측기 학습 → 새 환경에서의 제로샷 계획, 세 단계로 직접 잇는다.',

ideas:[
 {h:'V-JEPA 2: 마스킹 영상에서 표현을 예측한다',
  lead:'가려진 영상 조각의 표현을, 픽셀이 아니라 EMA teacher가 만든 표현 공간에서 예측한다.',
  d:'영상을 2×16×16 튜블릿으로 패치화하고 일부를 가린 뒤, encoder가 남은 패치를 인코딩하고 predictor가 가려진 위치의 표현을 예측한다. 정답은 encoder의 EMA(지수이동평균) 버전이 원본(비가림) 영상을 인코딩해 만들고, stop-gradient와 EMA 두 장치로 표현이 하나의 점으로 붕괴하는 것을 막는다. 위치 인코딩은 절대 sincos 대신 시간·높이·너비 세 축에 각각 회전을 적용하는 3D-RoPE를 써서 대형 모델 학습을 안정시켰다.'},
 {h:'데이터·모델·해상도를 함께 키운다',
  lead:'영상 2M→22M, 인코더 3억→10억+ 파라미터, 해상도·길이를 점진적으로 늘려 100만 시간 규모까지 확장한다.',
  d:'SSv2·Kinetics·HowTo100M 등을 합쳐 VideoMix22M(2200만 샘플) 데이터셋을 구성하고, ViT-L(3억)에서 ViT-g(10억+)까지 인코더를 키웠다. 짧은 16프레임 클립에서 시작해 해상도와 클립 길이를 점진적으로 늘리는 progressive resolution 전략으로 64프레임까지 효율적으로 학습시켰으며, 128·256프레임까지 실험했지만 이해 과제에서는 64프레임 이상의 추가 이득이 없었다.'},
 {h:'V-JEPA 2-AC: 행동을 조건으로 미래 표현을 예측한다',
  lead:'얼린 encoder 위에 행동·end-effector 상태를 함께 넣는 block-causal predictor를 얹어 자기회귀로 학습한다.',
  d:'사전학습된 V-JEPA 2 encoder를 얼리고, 그 위에 행동(action)과 로봇 end-effector 7차원 상태를 프레임 표현과 교차로 넣는 predictor를 새로 학습시킨다. teacher forcing 손실(한 스텝 예측)과 rollout 손실(예측을 다시 입력으로 되먹여 여러 스텝 예측)을 함께 최소화해 오차 누적을 줄인다. 학습 데이터는 Droid 데이터셋에서 가져온 **62시간 미만**의 라벨 없는(보상·과제 성공 여부 없는) 4초 안팎의 Franka 팔 teleoperation 영상뿐이다.'},
 {h:'목표 이미지와의 거리를 최소화하는 행동을 계획한다',
  lead:'현재·목표 프레임을 표현 공간에 인코딩하고, 그 사이 L1 거리를 최소화하는 행동열을 모델예측제어로 최적화한다.',
  d:'목표 상태의 이미지 하나만 주어지면, world model이 상상한 T스텝 뒤의 표현과 목표 표현 사이 L1 거리를 에너지로 두고 이를 최소화하는 행동열을 최적화한다(수식 참조). 첫 행동만 실행하고 관측을 갱신해 다시 최적화하는 receding horizon 방식이며, 별도의 보상 함수나 과제별 학습이 없다.'},
 {h:'제로샷으로 새 실험실의 로봇에 배치한다',
  lead:'두 곳의 다른 실험실 Franka 팔에, 그 로봇에서 수집한 데이터 없이 같은 가중치를 그대로 올려 검증한다.',
  d:'Droid 데이터로 학습한 V-JEPA 2-AC를 미보정 저해상도 단안 RGB 카메라를 쓰는 두 곳의 실험실 Franka Emika Panda 팔에 **동일한 가중치로** 배치한다. reach, grasp, reach-with-object, pick-and-place 과제를 이미지 목표(픽 앤 플레이스는 잡기·근접·최종 배치 세 단계의 하위 목표 이미지)만으로 수행하며, 해당 로봇 환경에서의 추가 데이터 수집이나 과제별 보상 설계가 전혀 없었다.'}
],

diagram:{type:'stack', cap:'V-JEPA 2 사전학습(아래)과 V-JEPA 2-AC 행동조건부 후속학습(위)의 관계. encoder는 얼린 채 predictor만 새로 학습한다.',
 layers:[
  {t:'인터넷 영상 1M시간', s:'VideoMix22M'},
  {t:'마스킹 표현 예측', s:'EMA teacher로 정답 생성', acc:true, note:'V-JEPA 2 사전학습'},
  {t:'encoder 동결', s:'표현은 더 학습하지 않음'},
  {t:'행동조건부 예측기', s:'Droid 62시간', note:'V-JEPA 2-AC'},
  {t:'모델예측제어 계획', s:'목표 이미지와 L1 거리 최소화'}
 ]},

math:[
 {expr:'min_(θ,φ) || P_φ(Δy, E_θ(x)) − sg(E_θbar(y)) ||_1',
  tex:'\\min_{\\theta,\\phi}\\ \\lVert P_\\phi(\\Delta_y, E_\\theta(x)) - \\text{sg}(E_{\\bar\\theta}(y)) \\rVert_1',
  d:'가려진 view $x$로부터 predictor가 예측한 표현을, 가리지 않은 원본 $y$를 EMA encoder $E_{\\bar\\theta}$가 인코딩한 표현에 L1으로 맞춘다. stop-gradient와 EMA가 표현 붕괴를 막는다.'},
 {expr:'E(a_1:T; z_k, s_k, z_g) = || P(a_1:T; s_k, z_k) − z_g ||_1',
  tex:'\\mathcal{E}(\\hat a_{1:T};\\,z_k,s_k,z_g) := \\lVert P(\\hat a_{1:T}; s_k, z_k) - z_g \\rVert_1',
  d:'목표 조건부 에너지 함수. 현재 표현 $z_k$·상태 $s_k$에서 행동열 $\\hat a_{1:T}$를 적용했을 때 predictor가 상상하는 T스텝 뒤 표현과, 목표 이미지의 표현 $z_g$ 사이 L1 거리를 최소화하는 행동열을 찾는다.'}
],

numbers:[
 {k:'SSv2 top-1', v:'77.3%', d:'동작 이해(모션) 벤치마크. 논문이 강조하는 대표 수치'},
 {k:'Epic-Kitchens-100 action anticipation', v:'recall@5 39.7', d:'과제 특화 이전 모델들을 능가하는 SOTA로 보고'},
 {k:'PerceptionTest / TempCompass', v:'84.0 / 76.9', d:'LLM과 정렬 후 8B 파라미터급 비디오 QA에서 SOTA로 보고'},
 {k:'로봇 학습 데이터', v:'62시간 미만', d:'Droid 데이터셋에서 4초 미만 클립 제외 후 남은 raw teleoperation 영상. 보상·과제 라벨 없음'},
 {k:'사전학습 데이터', v:'100만+ 시간 영상 · 100만 이미지', d:'VideoMix22M: SSv2·Kinetics·HowTo100M 등 통합'},
 {k:'인코더 규모', v:'ViT-L(3억)→ViT-g(10억+)', d:'모델 스케일링 실험 구간'},
 {k:'AC predictor 규모', v:'약 3억 파라미터', d:'24층·16헤드·hidden 1024의 block-causal transformer'}
],

impact:'"표현 공간에서 예측을 배우면 계획에도 쓸 수 있는가"라는 질문에 구체적 조건(과제·데이터양·환경 전이)을 명시하며 그렇다고 답한 사례다. 핵심은 **로봇 데이터가 압도적으로 적어도 된다**는 것 — 인터넷 영상에서 얻은 물리 직관을 얼린 채로 두고, 62시간의 라벨 없는 상호작용 데이터만으로 새 환경 제로샷 전이가 가능함을 보였다. 다만 검증된 과제는 reach·grasp·pick-and-place 같은 단순 prehensile 조작에 국한되고, 도구 사용이나 장기 계획 같은 복잡한 물리적 추론까지 일반화됐다고는 논문이 주장하지 않는다.',

legacy:[
 '**JEPA 계열의 계획 능력 실증** — [I-JEPA](#/p/ijepa)·[V-JEPA](#/p/vjepa)로 이어진 표현공간 예측 원칙이 이해·인식을 넘어 제어까지 닿는다는 첫 구체적 증거',
 '**소량 상호작용 데이터로 world model 얻기** — 대규모 관측 데이터 사전학습 + 소량 행동 데이터 후속학습이라는 구도가 로봇 파운데이션 모델 연구의 참조 패턴이 됨',
 '**Cosmos 등 영상 기반 world model과의 비교축** — [Cosmos](#/p/cosmos) 같은 생성적 world model과 달리 JEPA는 픽셀을 생성하지 않고 표현만 예측한다는 대비가 이후 world model 논의의 기준점이 됨'
],

pitfalls:[
 '**"제로샷 로봇 배치"의 범위를 넘겨짚기 쉽다.** 검증 과제는 단안 카메라·고정 시점의 prehensile 조작(잡기·놓기류)에 한정된다. 양손 조작, 도구 사용, 장기 다단계 과제로 일반화됐다는 근거는 논문에 없다.',
 '**"62시간"은 AC predictor 학습 데이터일 뿐, 전체 학습이 아니다.** 그 앞에 100만 시간 규모 인터넷 영상 사전학습이 있고, 이것이 없으면 62시간만으로는 동작하지 않는다.',
 '**과제 성공률은 절대적으로 높지 않다.** 표 2·3의 성공률은 grasp·reach 계열에서 준수하지만 baseline 대비 상대적 우위로 보고되며, 실전 배포 수준의 신뢰도를 주장하지는 않는다.'
],

figures:[
 {f:'fig6-ac-training.png',
  cap:'왼쪽 teacher forcing: 각 시점의 encoder 출력을 predictor가 한 스텝씩 예측해 L1으로 맞춘다. 오른쪽 rollout: predictor의 출력을 다시 입력으로 되먹여 여러 스텝을 연쇄로 예측한다(점선 화살표가 되먹임 경로). 두 손실을 함께 써서 여러 스텝 앞 예측의 오차 누적을 줄인다.',
  src:'원문 Figure 6, p.10'}
],

quotes:[
 {t:'We deploy V-JEPA 2-AC zero-shot on Franka arms in two different labs and enable picking and placing of objects using planning with image goals... without collecting any data from the robots in these environments, and without any task-specific training or reward.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2506.09985 — V-JEPA 2', u:'https://arxiv.org/abs/2506.09985'},
 {t:'facebookresearch/vjepa2 (공식 구현)', u:'https://github.com/facebookresearch/vjepa2'}
]
});
