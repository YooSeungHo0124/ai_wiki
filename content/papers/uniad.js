WIKI.paper({
slug:'uniad',
venue:'CVPR 2023 (Best Paper Award)',
authors:'Hu, Yang, Chen, Li, Sima, Zhu, Chai, Du, Lin, Wang, Lu, Jia, Liu, Dai, Qiao, Li (Shanghai AI Lab · SenseTime · 香港大学 · 武汉大学)',
arxiv:'2212.10156',

tldr:'검출·추적·온라인 지도·모션 예측·점유 예측·계획을 **하나의 transformer 네트워크**로 잇고, 각 모듈을 독립적으로 최적화하지 않고 오직 **최종 계획 품질을 목표로** 함께 학습시킨 논문. nuScenes에서 이전 vision 기반 end-to-end 계획기 ST-P3 대비 L2 오차 51.2%, 충돌률 56.3% 낮췄다.',

context:'자율주행 인지 스택은 전통적으로 검출→추적→예측→계획을 **독립된 모듈**로 나눠 각자 최적화한 뒤 이어 붙였다. 이 방식은 각 모듈이 자기 지표(mAP, ADE 등)에서는 좋은 점수를 내더라도, 정작 최종 목표인 안전한 계획에 그 성능이 도움이 되는지는 보장하지 않는다 — 모듈 경계마다 정보 손실과 오차가 쌓인다("accumulative error"). `[BEVFormer](#/p/bevformer)`가 여러 카메라·과거 프레임을 하나의 BEV 표현으로 모으는 공용 인코더를 제공하면서, 그 위에 인지·예측 모듈들을 태스크별 head가 아니라 **서로 정보를 주고받는 transformer decoder들의 사슬**로 이을 수 있는 토대가 마련됐다. UniAD의 질문은, 어떤 선행 태스크를 어떤 순서로 엮어야 계획이라는 최종 목표에 실제로 기여하는가이다. [nuScenes](#/p/nuscenes) 벤치마크에서 이를 검증한다.',

ideas:[
 {h:'계획이 목적, 인지는 그 수단이라는 설계 원칙',
  lead:'검출·지도·예측 모듈 각각의 지표를 올리는 것이 아니라 최종 계획 손실이 전체를 지휘한다.',
  d:'기존 멀티태스크 학습(MTL)은 여러 head를 한 backbone에 붙여 각자 손실을 합산하는 식이라, 태스크 간 negative transfer가 흔하다. UniAD는 대신 검출·추적·지도·모션·점유 예측을 계획에 필요한 **중간 산출물**로 명시적으로 배치하고, query라는 공용 인터페이스로 다음 모듈에 정보를 전달한다. 논문은 이를 "planning-oriented"라 부르며, 어떤 선행 태스크가 실제로 계획 성능에 기여하는지를 ablation으로 하나씩 검증한다.'},
 {h:'query 사슬: TrackFormer → MapFormer → MotionFormer → OccFormer → Planner',
  lead:'각 모듈이 transformer decoder이고, query가 그 출력이자 다음 모듈의 입력이 된다.',
  d:'`[BEVFormer](#/p/bevformer)`가 만든 BEV 특징 $B$ 위에서, TrackFormer는 track query로 에이전트를 검출·추적하고(그 중 하나는 자차 자신을 표현하는 ego-vehicle query), MapFormer는 map query로 차선·경계를 파놉틱 분할한다. MotionFormer는 이 두 query 집합으로 에이전트 간·에이전트-지도 상호작용을 모델링해 미래 궤적을 예측하고, OccFormer는 BEV 특징을 query로 미래 점유 격자를 예측한다. 마지막 Planner는 MotionFormer가 다듬은 ego-vehicle query 하나로 미래 waypoint를 예측하며, OccFormer가 예측한 점유 영역을 피하도록 최적화된다.'},
 {h:'장면 중심(scene-centric) 모션 예측',
  lead:'에이전트마다 좌표계를 바꿔가며 따로 예측하지 않고 한 번의 forward로 전체 장면의 궤적을 함께 낸다.',
  d:'기존 모션 예측은 에이전트마다 좌표를 자기 중심으로 정렬해 따로 추론하는 경우가 많아 에이전트 수만큼 연산이 늘었다. MotionFormer는 모든 에이전트의 top-k 다중 모달 궤적 $\\{\\hat{x}_{i,k}\\}$ 을 장면 좌표계 하나에서 한 번에 예측해 연산을 줄이면서, 에이전트 간 상호작용(자차 포함)을 자연스럽게 모델링한다.'},
 {h:'충돌 회피를 명시적 손실로 넣은 계획',
  lead:'예측된 미래 점유 영역을 피하도록 계획 궤적을 뉴턴법으로 사후 최적화한다.',
  d:'Planner가 1차로 낸 궤적 $\\hat{\\tau}$ 를 OccFormer의 점유 예측과 대조해, 점유된 영역과 겹치면 충돌 항을 손실에 더해 뉴턴법으로 $\\tau^{*}$ 로 보정한다. 계획을 순수 회귀로만 두지 않고 예측된 장애물 지도를 명시적 제약으로 사용하는 것이 충돌률을 크게 낮춘 핵심이다.'}
],

diagram:{type:'flow', cap:'카메라 → BEVFormer BEV 인코더 → 검출/추적·지도(query) → 모션·점유 예측 → 계획. 전 구간이 query로 이어진 하나의 네트워크다.',
 nodes:[
  {t:'멀티카메라', s:'BEVFormer 인코더'},
  {t:'Track/Map', s:'검출·추적·차선 분할'},
  {t:'MotionFormer', s:'장면중심 궤적예측'},
  {t:'OccFormer', s:'미래 점유 예측'},
  {t:'Planner', s:'충돌회피 최적화', acc:true}
 ]},

numbers:[
 {k:'추적 AMOTA', v:'0.359', d:'vision-only end-to-end MOT 중 최고, MUTR3D(0.294) 대비 +0.065'},
 {k:'온라인 지도 · lane IoU', v:'31.3%', d:'`[BEVFormer](#/p/bevformer)` 단독(23.9%) 대비 +7.4%p'},
 {k:'모션예측 minADE/minFDE', v:'0.71m / 1.02m', d:'PnPNet-vision 대비 minADE 38.3% 감소, ViP3D 대비 65.4% 감소'},
 {k:'점유예측 IoU-near', v:'63.4%', d:'가까운 영역(30×30m) 기준, FIERY 대비 +4.0%p'},
 {k:'계획 평균 L2 오차', v:'1.03m', d:'1~3초 구간 평균, ST-P3(2.11m) 대비 **51.2%** 감소'},
 {k:'계획 평균 충돌률', v:'0.31%', d:'ST-P3(0.71%) 대비 **56.3%** 감소, 일부 라이다 기반 방법보다도 낮음'}
],

impact:'검출부터 계획까지를 별도 지표로 따로 최적화하지 않고 **하나의 목적(안전한 계획)** 아래 묶을 수 있다는 것을 실증하며 CVPR 2023 최우수 논문에 선정됐다. query 사슬로 태스크를 잇는 구조는 이후 end-to-end 자율주행 연구에서 "어떤 중간 태스크를 계획에 연결할 것인가"를 논의하는 기본 틀이 됐다. 다만 검출·추적 등 개별 모듈 성능은 전용 모델보다 낮을 수 있다는 trade-off도 드러냈다 — 계획에 필요한 정보만 잘 전달되면 개별 태스크의 완벽함이 필수는 아니라는 것이 논문의 논지다.',

legacy:[
 '**query 기반 통합 인지-예측-계획 스택의 정석** — TrackFormer/MapFormer/MotionFormer/OccFormer/Planner라는 모듈 명명과 연결 방식이 이후 end-to-end 자율주행 논문들의 비교 기준이 됨',
 '**"planning-oriented" 설계 철학의 확산** — 개별 태스크 지표보다 최종 계획 기여도로 모듈을 평가하자는 논지가 후속 연구의 표준 프레이밍이 됨',
 '**`[BEVFormer](#/p/bevformer)`를 교체 가능한 BEV 백본으로 명시** — 논문 스스로 다른 BEV 인코더로 대체 가능하다고 밝혀, 이후 다양한 BEV 백본 위에 같은 파이프라인을 재현하는 연구가 이어짐',
 '**계획 평가 방법론 논쟁의 출발점** — 후속 연구들(예: 자차 상태만으로도 유사한 L2·충돌률이 나온다는 지적)이 nuScenes 개방루프(open-loop) L2/충돌률 지표가 계획 품질을 충분히 변별하는지 문제를 제기했다. 원문 자체의 주장이 아니라 이후 커뮤니티에서 제기된 후속 논의이므로 UniAD의 수치를 인용할 때는 이 논쟁을 함께 염두에 둘 필요가 있다'
],

pitfalls:[
 '**UniAD의 mAP·NDS를 다른 BEV 검출기와 직접 비교하지 않는다.** 이 논문은 검출 단일 지표 최적화가 목표가 아니라서, 원문은 검출 성능표 대신 추적(AMOTA)·지도(IoU)·모션(minADE/FDE)·점유(IoU)·계획(L2·충돌률) 지표를 각 모듈별로 따로 보고한다.',
 '**"5개 태스크를 전부 써야 계획이 좋아진다"는 결론이 아니다.** 논문의 ablation(Table 2)은 어떤 선행 태스크 조합이 계획에 기여하는지 단계적으로 검증하는 실험이며, 일부 태스크는 기여가 제한적이라는 것도 함께 보고한다.',
 '**개방루프(open-loop) 평가라는 한계를 원문도 인지한다.** nuScenes 로그 재생 기반의 L2·충돌률 평가이며 폐쇄루프(closed-loop) 시뮬레이션 평가가 아니다 — 이는 이후 다른 연구들이 지적한 지점이기도 하다.'
],

figures:[
 {f:'fig2-pipeline.png',
  cap:'왼쪽부터: 멀티카메라 입력이 BEV 특징 $B$ 로 변환되고(Backbone), TrackFormer·MapFormer가 에이전트·지도 query를 뽑고(Perception), MotionFormer·OccFormer가 미래 궤적·점유를 예측하며(Prediction), 마지막 Planner가 ego-vehicle query와 점유 예측을 받아 주행 경로를 낸다(Planning).',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'We argue that a favorable framework should be devised and optimized in pursuit of the ultimate goal, i.e., planning of the self-driving car.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2212.10156 — Planning-oriented Autonomous Driving', u:'https://arxiv.org/abs/2212.10156'},
 {t:'UniAD 공식 코드', u:'https://github.com/OpenDriveLab/UniAD'}
]
});
