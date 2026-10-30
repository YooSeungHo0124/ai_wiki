WIKI.paper({
slug:'sam2mot',
venue:'arXiv 2025',
authors:'Jiang, Wang et al. (Huawei Cloud)',
arxiv:'2504.04519',

tldr:'탐지-연관 대신 **SAM2의 분할 추적을 중심에 놓는** MOT. 사전학습 검출기가 프롬프트만 주고 SAM2가 물체별 마스크를 추적하며, 파인튜닝 없이 DanceTrack test에서 75.8 HOTA / 83.9 IDF1을 기록했다.',

context:'[SORT](#/p/sort) 이래 MOT는 검출 박스를 프레임 사이에 연관하는 구조였고, 가려짐이 심하면 검출이 흔들려 연관이 무너진다. 이를 피하려는 query 기반 end-to-end 방식([MOTR](#/p/motr) 등)은 ID가 달린 대규모 추적 데이터가 필요하고, 그런 데이터는 비싸다. 분할은 지금까지 연관의 보조 단서(예: [MASA](#/p/masa)의 외형 마스크)나 SAM과 VOS 모델의 단순 결합으로 쓰였다. 저자들은 [SAM2](#/p/sam2)의 메모리 기반 비디오 분할이 단일 객체에서 충분히 강하다고 보고, 이를 다중 객체 추적의 중심에 놓는다.'
 ,

ideas:[
 {h:'검출기는 프롬프트, 추적은 SAM2가 한다',
  lead:'검출 박스는 SAM2의 초기 프롬프트로만 쓰고, 이후 박스는 SAM2 마스크에서 나온다.',
  d:'SAM2는 사용자 프롬프트로 시작하는 단일 객체 추적기이므로, MOT의 새 객체 등장을 위해 사전학습 검출기(Co-DINO-L, Grounding-DINO-L)가 프롬프트를 생성한다. 최종 박스는 검출기가 아니라 SAM2의 물체별 마스크에서 나오므로 매 프레임 정확한 위치 검출은 필요 없다. 이 구조가 검출기를 파인튜닝하지 않고도 쓰는 이유라고 저자들은 설명한다.'},
 {h:'Cross-object Interaction: 오염된 메모리를 막는다',
  lead:'가려진 물체가 가린 물체의 ID로 끌려가는 현상을 마스크 겹침과 logit으로 찾아내 메모리 기록을 막는다.',
  d:'두 트랙의 마스크 IoU가 0.8을 넘으면 같은 물체를 인식하는 혼동으로 본다. 어느 쪽이 틀렸는지는 두 단계로 가린다. 1단계는 SAM2 logit 점수가 두 점 넘게 낮은 쪽을 오인식으로 판정하고, 점수가 비슷하면 2단계에서 최근 $N=10$ 프레임의 logit 분산이 큰 쪽(점수가 급락한 쪽)을 고른다. 판정된 물체의 현재 프레임은 메모리 뱅크에 쓰지 않는다.'},
 {h:'Trajectory Manager: 추가·삭제·품질 복원',
  lead:'SAM2는 한번 잘못 시작하면 계속 따라가므로, 추가에는 3단계 필터, 삭제에는 상태 기반 유예를 둔다.',
  d:'새 물체는 (1) 저점수 검출 제거, (2) SAM2 박스와 헝가리안 매칭 후 미매칭만 후보, (3) 이미 추적 중인 마스크를 뺀 영역과 후보 박스의 겹침 비율이 $r=0.7$ 을 넘을 때만 등록한다. 삭제는 logit으로 reliable, pending, suspicious, lost 상태를 나누고 lost가 25프레임 이어지면 제거한다. pending 물체가 고점수 검출과 매칭되면 그 박스로 키프레임 프롬프트를 갱신한다.'},
 {h:'파인튜닝 없는 zero-shot 시스템',
  lead:'검출기와 SAM2.1-large 모두 사전학습 가중치 그대로, 데이터셋 전체에 한 설정을 쓴다.',
  d:'DanceTrack, UAVDT-MOT, BDD100K-MOT에 같은 하이퍼파라미터로 적용한다(logit 임계값 $\\tau_r=8.0$, $\\tau_p=6.0$, $\\tau_s=2.0$). 저자들은 이 zero-shot 능력으로 추적 데이터의 사전 주석을 만들어 라벨링 비용을 줄일 수 있다고 제안한다.'}
],

diagram:{type:'flow', cap:'SAM2MOT의 프레임당 흐름. 검출기는 새 물체의 프롬프트만 제공하고, 박스는 SAM2 마스크에서 나온다.',
 nodes:[
  {t:'검출기', s:'Co-DINO-L 등', a:'프롬프트'},
  {t:'SAM2 트래커', s:'물체별 마스크'},
  {t:'객체 간 상호작용', s:'혼동 시 메모리 차단', acc:true},
  {t:'궤적 관리', s:'추가·삭제·복원'},
  {t:'박스 출력', s:'마스크에서 산출'}
 ]},

math:[
 {tex:'\\sigma^2_{logits}=\\frac{1}{N}\\sum_{i=1}^{N}\\left(logits_i-\\overline{logits}\\right)^2,\\quad N=10',
  expr:'σ² = (1/N) Σ (logit_i - 평균)²,  N=10',
  d:'최근 $N$ 프레임 logit의 분산. 점수가 서서히 떨어지는 가린 쪽보다 급락하는 쪽이 분산이 커서, 혼동된 쪽을 구분하는 단서로 쓴다.'},
 {tex:'M_{non}=I-\\bigcup_{i=1}^{n}M_i',
  expr:'M_non = I - (M_1 ∪ ... ∪ M_n)',
  d:'추적 중인 모든 마스크를 합쳐 뒤집은 영역. 새 후보 박스가 이 영역과 겹치는 비율이 $r=0.7$ 을 넘어야 새 물체로 등록한다.'}
],

numbers:[
 {k:'DanceTrack test · HOTA/IDF1/AssA (Grounding-DINO-L)', v:'75.8 / 83.9 / 72.2', d:'같은 표의 MOTIP은 73.7 / 79.4 / 65.9. 단 MOTA는 88.5로 MOTIP(92.7)보다 낮다'},
 {k:'DanceTrack test · 같은 검출기 비교 (Co-DINO-L)', v:'ByteTrack 56.1 · OC-SORT 56.2 · SAM2MOT 75.5 HOTA', d:'검출기를 고정하면 연관 구조 차이만 드러난다'},
 {k:'모듈 ablation (Co-DINO-L, HOTA)', v:'62.9 → +Add 67.9 → +Add+CoI 73.8 → 전체 75.5', d:'객체 추가(Add), 객체 간 상호작용(CoI), 품질 복원(Q-R). CoI가 연관 향상에 가장 크게 기여'},
 {k:'UAVDT-MOT test · MOTA/IDF1 (IoU 0.5, Co-DINO-L)', v:'55.6 / 74.4', d:'DroneMOT 50.1 / 69.6. IoU 0.4 기준으로는 66.1 / 79.3'},
 {k:'BDD100K-MOT val · MOTA/IDF1 (Co-DINO-L)', v:'3-class 63.0 / 73.7, 8-class 57.5 / 70.8', d:'8-class에서는 파인튜닝이 없어 유사 카테고리를 헷갈려 MOTA가 낮다'}
],

impact:'SAM2MOT은 MOT에서 분할을 연관의 보조가 아니라 추적의 뼈대로 쓰는 구성이 가능하며, 특히 연관 지표(IDF1, AssA)에서 크게 앞선다는 것을 보였다. 저자들은 이를 첫 체계적 zero-shot MOT 연구라고 주장한다. 반면 속도가 가장 큰 한계이고, 보이는 부분만 박스로 잡는 holistic modeling 부족과 긴 가림에서의 메모리 한계도 논문이 직접 인정한다.',

legacy:[
 '[SAM2](#/p/sam2)의 메모리 뱅크 기반 비디오 분할을 다중 객체 MOT에 맞게 고쳐 쓴 사례이다',
 '[MASA](#/p/masa)가 SAM 마스크를 연관 학습에 쓴 것과 달리, 이쪽은 분할 모델 자체를 추적기로 쓴다',
 '[DanceTrack](#/p/dancetrack)에서 end-to-end 계열 [MOTIP](#/p/motip)을 연관 지표로 넘어선 zero-shot 시스템으로 비교된다',
 '추적 데이터 사전 주석 생성이라는 용도를 직접 제안한다'
],

pitfalls:[
 '**"파인튜닝 없음"은 사전학습 검출기와 SAM2를 그대로 쓴다는 뜻이다.** 두 모델은 이미 큰 데이터로 학습되었고, 표에서도 검출기별(Co-DINO-L, Grounding-DINO-L) 성능 차이가 크게 난다(UAVDT에서 55.6 대 51.0 MOTA).',
 '**DanceTrack에서 HOTA·IDF1·AssA는 최고지만 MOTA·DetA는 아니다.** 연관은 강하지만 박스가 보이는 영역만 덮어, 검출 지표는 MOTIP·DiffMOT 등에 못 미치거나 비슷하다.',
 '**속도와 비용을 저자도 한계로 든다.** 물체마다 SAM2 트래커를 돌리는 구조이며 FPS 수치는 논문에 제시되지 않았다. 실시간 시스템에 그대로 쓰기는 어렵다.'
],

figures:[
 {f:'fig2-overview.png',
  cap:'검출기가 비디오에서 검출 박스를 만들어 궤적 관리(추가·삭제·품질 복원)에 공급한다. SAM2 트래커는 물체별 마스크를 만들고, 객체 간 상호작용 모듈이 메모리 뱅크의 오염된 항목(X 표시)을 걸러 낸 뒤 박스를 출력한다.',
  src:'원문 Figure 2(a), p.3'}
],

quotes:[
 {t:'SAM2MOT places it at the heart of the tracking process, systematically tackling challenges like false positives and occlusions.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2504.04519 — SAM2MOT', u:'https://arxiv.org/abs/2504.04519'},
 {t:'GitHub — TripleJoy/SAM2MOT', u:'https://github.com/TripleJoy/SAM2MOT'}
]
});
