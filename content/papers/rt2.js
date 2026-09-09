WIKI.paper({
slug:'rt2',
venue:'arXiv 2023 (CoRL 2023)',
authors:'Brohan, Brown, Carbajal, Chebotar, Driess, Finn, Hausman, Levine et al. (Google DeepMind)',
arxiv:'2307.15818',

tldr:'웹 규모 vision-language model을 새 아키텍처 없이 그대로 가져다, 로봇 행동을 **텍스트 토큰**으로 출력하도록 co-fine-tuning한 논문. 로봇이 한 번도 본 적 없는 물체·기호·언어를 다루는 창발적 일반화가 나타났다.',

context:'[RT-1](#/p/rt1)은 트랜스포머로 로봇 행동을 예측했지만 처음부터 로봇 데이터만으로 학습한 35M 파라미터 모델이라, 학습 데이터에 없던 물체·개념은 다루지 못했다. 한편 [PaLM](#/p/palm)·[CLIP](#/p/clip) 같은 vision-language model은 웹의 수십억 이미지-텍스트 쌍으로 학습해 개방 어휘 인식과 추론이 가능하지만, 이런 모델을 로봇에 쓰려는 이전 시도들은 대부분 VLM을 고수준 플래너로만 썼다 — [SayCan](#/p/saycan)처럼 VLM이 "무엇을 할지"만 정하고, 실제 팔을 움직이는 저수준 제어는 별도의 작은 정책이 맡았다. 그 결과 저수준 제어기는 웹 지식의 혜택을 전혀 받지 못했다. 로봇 시연 데이터는 많아야 수십만 에피소드인데 웹 데이터는 수십억 장이라는 자릿수 격차가 이 문제의 근본 원인이다. RT-2의 질문은 단순하다 — **VLM이 저수준 행동까지 직접 출력하게 만들면 어떻게 되는가?**',

ideas:[
 {h:'행동을 텍스트 토큰으로 표현',
  lead:'6-DoF 델타 자세와 그리퍼 개폐를 256개 구간으로 이산화해 언어 토큰처럼 취급한다.',
  d:'end-effector의 위치·회전 변화량 6개 값과 그리퍼 개폐, 에피소드 종료 플래그를 각각 256개 구간(bin)으로 균등 이산화한다. PaLI-X는 정수 0~1000에 이미 전용 토큰이 있어 그 토큰을 그대로 행동 bin에 대응시키고, PaLM-E는 거의 안 쓰는 기존 토큰 256개를 행동 bin으로 덮어쓴다. 새 파라미터를 전혀 추가하지 않고, VLM이 원래 하던 "다음 토큰 예측"을 그대로 로봇 제어에 쓸 수 있게 된다.'},
 {h:'Co-fine-tuning: 로봇 데이터와 웹 데이터를 함께 학습',
  lead:'로봇 궤적만으로 파인튜닝하지 않고 원래의 웹 VQA 데이터와 섞어서 파인튜닝한다.',
  d:'로봇 데이터만으로 파인튜닝하면 모델이 사전학습 때 배운 개념을 빠르게 잊는다(**catastrophic forgetting**). 대신 매 배치에 로봇 궤적과 원본 VQA/캡셔닝 데이터를 일정 비율로 섞어 함께 학습시키면, 모델이 저수준 행동을 배우면서도 웹에서 배운 추상적 시각 개념을 유지한다. 이 co-fine-tuning 하나가 세부 실험에서 순수 fine-tuning 대비 일반화 성능을 가장 크게 끌어올린 요인이다.'},
 {h:'VLA: 두 개의 기존 VLM을 개조',
  lead:'PaLI-X(최대 55B)와 PaLM-E(12B)라는 이미 존재하는 VLM 두 종류를 그대로 행동 출력기로 개조했다.',
  d:'RT-2-PaLI-X는 ViT 인코더 + 대형 언어모델 구조의 [PaLI-X](#/p/palm)를, RT-2-PaLM-E는 멀티모달 embodied 모델 PaLM-E를 기반으로 한다. 둘 다 원래 논문의 아키텍처·사전학습 가중치를 그대로 쓰고, 로봇 궤적에 대해 이미지+지시문을 입력으로, 행동 토큰 시퀀스를 출력으로 하는 fine-tuning만 추가한다. 새 모듈을 설계하지 않고 "이미 존재하는 최강의 VLM을 가져다 쓴다"는 태도 자체가 이 논문의 핵심 주장이다.'},
 {h:'창발적 능력: 로봇 데이터에 없던 개념의 전이',
  lead:'기호 이해·시각 추론·다국어·인물 인식까지, 로봇 시연에 전혀 없던 지시를 수행한다.',
  d:'"사과를 3번 위치로 옮겨라", "콜라 캔을 하트 위에 올려라" 같은 지시는 로봇 학습 데이터에 등장한 적이 없는데도 RT-2는 이를 수행한다. 정량 평가에서 RT-2-PaLI-X는 이런 창발 과제 평균 성공률에서 [RT-1](#/p/rt1) 대비 3배 이상 앞섰다. 이는 웹 데이터의 시각·언어 개념이 행동 토큰 예측 경로를 통해 실제로 로봇 제어에 전이된다는 증거다.'},
 {h:'Chain-of-thought로 다단계 추론 연결',
  lead:'행동 앞에 "Plan:" 자연어 계획 단계를 끼워 넣어 다단계 semantic reasoning을 유도한다.',
  d:'"배고파"라는 지시에 곧바로 좌표를 뱉는 대신, "Plan: pick rxbar chocolate. Action: 1 128 124 …"처럼 자연어 계획을 먼저 생성하고 그다음 행동 토큰을 낸다. 이 데이터 증강을 PaLM-E 버전에 수백 스텝만 추가 학습시키면, "즉석 망치로 쓸 물건 고르기(돌)", "피곤한 사람에게 맞는 음료 고르기(에너지 드링크)"처럼 [Chain-of-Thought](#/p/cot)식 다단계 추론이 행동으로 이어진다.'}
],

diagram:{type:'flow', cap:'웹 VQA와 로봇 궤적을 같은 토큰 형식으로 묶어 co-fine-tuning한 뒤, 출력 토큰을 실제 행동으로 de-tokenize한다.',
 nodes:[
  {t:'이미지+지시문', s:'로봇 관측 또는 웹 이미지'},
  {t:'ViT 인코더', s:'PaLI-X / PaLM-E'},
  {t:'LLM 디코더', s:'토큰 자기회귀 생성', acc:true},
  {t:'행동 토큰', s:'256bin × 7차원'},
  {t:'De-tokenize', s:'ΔT, ΔR, 그리퍼'}
 ]},

math:[
 {expr:'a = [Δx, Δy, Δz, Δroll, Δpitch, Δyaw, gripper, terminate], 각 성분을 256개 구간으로 균등 이산화',
  tex:'a_i \\in \\{0,1,\\dots,255\\},\\quad a_i = \\text{quantize}\\!\\left(\\frac{v_i - v_{\\min}}{v_{\\max}-v_{\\min}}\\times 255\\right)',
  d:'8차원 연속 행동을 8개의 정수 토큰으로 바꾸는 것이 전부다. 이 이산화 덕분에 언어모델의 다음 토큰 예측 목적함수(cross-entropy)를 그대로 행동 예측에 쓸 수 있다.'}
],

numbers:[
 {k:'최대 모델 크기', v:'55B (RT-2-PaLI-X)', d:'RT-2-PaLM-E는 12B, 비교용 [RT-1](#/p/rt1)은 35M'},
 {k:'평가 규모', v:'6,000회 실제 로봇 시행', d:'seen task + unseen 3범주(물체·배경·환경)'},
 {k:'미본 상황 평균 성공률', v:'62% (PaLI-X-55B / PaLM-E-12B 동률)', d:'RT-1 32%, MOO 35% 대비 **약 2배**'},
 {k:'창발 과제 평균 성공률', v:'60% (PaLI-X) vs RT-1 17%', d:'로봇 데이터에 없던 기호·추론·인물 인식 과제'},
 {k:'추론 주기', v:'55B 모델 1-3Hz, 5B 모델 5Hz', d:'클라우드 서비스에 올려 멀티-TPU로 서빙'},
 {k:'스크래치 학습 성능', v:'5B 모델 9%(unseen 평균)', d:'사전학습 가중치 없이는 co-fine-tuning보다 **훨씬 저조**'}
],

impact:'RT-2는 "로봇 정책 = 별도로 설계한 작은 신경망"이라는 전제를 깨고, **웹 스케일 VLM 자체가 곧 로봇 정책이 될 수 있음**을 보였다. 이후 "vision-language-action(VLA)"이라는 범주 이름이 이 논문에서 처음 정의되어 분야 명칭으로 굳어졌다. 행동을 텍스트 토큰으로 표현하는 방식은 새 아키텍처 없이 기존 VLM 생태계(사전학습·파인튜닝·서빙 인프라)를 그대로 재사용할 수 있게 해, 이후 [OpenVLA](#/p/openvla) 등 오픈소스 VLA가 같은 레시피를 따르는 출발점이 되었다.',

legacy:[
 '**VLA라는 범주 자체가 여기서 시작** — 이후 [OpenVLA](#/p/openvla), [π0](#/p/pi0)를 비롯한 대부분의 로봇 파운데이션 모델이 "웹 사전학습 VLM + 행동 출력"이라는 이 틀을 계승',
 '**추론 속도 문제를 다음 세대가 이어받음** — 55B 모델의 1-3Hz라는 한계가 [OpenVLA](#/p/openvla)의 경량화, [π0](#/p/pi0)의 별도 action expert 설계로 이어짐',
 '**행동 토큰화 방식 자체도 개선 대상이 됨** — 균등 256bin 이산화는 이후 FAST 토크나이저, [flow matching](#/p/flow-matching) 기반 연속 행동 생성 등으로 대체',
 '**co-fine-tuning이 표준 관행으로 정착** — 로봇 데이터만으로 파인튜닝하면 웹 지식을 잊는다는 관찰이 이후 VLA 학습 레시피의 기본 전제가 됨'
],

pitfalls:[
 '**창발 능력이 "새로운 동작"을 만드는 것은 아니다.** 논문도 명시하듯 RT-2는 로봇 데이터에 있던 물리적 동작(집기·밀기 등)의 범위 안에서, **어떤 대상에 그 동작을 적용할지**를 웹 지식으로 결정하는 것이지 안 배운 손동작을 만들어내는 게 아니다.',
 '**55B 모델의 1-3Hz는 클라우드 서빙 환경 수치다.** 온보드 GPU나 엣지 디바이스에서 그대로 재현되는 속도가 아니며, 이후 논문들의 "더 빠르다"는 비교는 대개 다른 하드웨어·배치 조건이라 직접 비교가 어렵다.',
 '**성공률 수치는 Google 자체 로봇·환경에서 측정된 것.** 다른 실험실의 하드웨어·조명·물체 세트에서 재현한 수치가 아니므로, 이후 논문들과의 %p 비교는 참고치일 뿐 엄밀한 벤치마크가 아니다.'
],

figures:[
 {f:'fig1-vla-overview.png',
  cap:'왼쪽: 웹 VQA와 로봇 궤적이 같은 "이미지+질문→토큰 응답" 형식으로 나란히 준비된다. 가운데: 하나의 LLM이 두 종류 데이터를 co-fine-tuning으로 함께 학습하며, 로봇 궤적에 대해서는 행동 토큰(예 "132 114 128 5 25 156")을 출력한다. 오른쪽: 그 토큰을 ΔTranslation·ΔRotation으로 de-tokenize해 실제 팔을 움직인다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig4-generalization-results.png',
  cap:'다섯 그룹(Seen Tasks / Unseen Objects·Backgrounds·Environments / Unseen 평균) 각각에서 막대 높이가 성공률. 초록·파랑(RT-2 두 버전)이 Seen Tasks에서는 RT-1(빨강)과 비슷하지만, 오른쪽 네 그룹 unseen 상황으로 갈수록 다른 baseline과의 격차가 크게 벌어지는 것이 이 논문의 핵심 증거다.',
  src:'원문 Figure 4, p.8'}
],

quotes:[
 {t:'We refer to such category of models as vision-language-action models (VLA) and instantiate an example of such a model, which we call RT-2.',
  src:'Abstract, p.1'},
 {t:'We do not expect such transfer to enable new robotic motions, but we do expect semantic and visual concepts, including relations and nouns, to transfer effectively, even in cases where those concepts were not seen in the robot data.',
  src:'Section 4.2, p.9'}
],

links:[
 {t:'arXiv 2307.15818 — RT-2', u:'https://arxiv.org/abs/2307.15818'},
 {t:'프로젝트 페이지', u:'https://robotics-transformer2.github.io'}
]
});
