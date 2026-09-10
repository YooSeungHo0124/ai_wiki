WIKI.paper({
slug:'centerpoint',
venue:'CVPR 2021',
authors:'Yin, Zhou, Krähenbühl (UT Austin)',
arxiv:'2006.11275',

tldr:'라이다 포인트클라우드에서 3D 물체를 **회전 상자가 아니라 중심점**으로 찾고, 그 중심을 그대로 추적점으로 써서 검출과 추적을 함께 단순화한 논문. [nuScenes](#/p/nuscenes) 2019 챌린지 우승작 CBGS를 mAP +14.3, NDS +8.1로 앞섰다.',

context:'2020년 라이다 3D 검출은 [PointPillars](#/p/pointpillars)·[VoxelNet](#/p/voxelnet) 계열이 표준이었지만, 전부 **anchor 기반**이었다 — bird-eye-view 격자마다 미리 정한 크기·방향의 상자 후보를 깔고 IoU로 맞는지 분류한다. 문제는 3D 물체가 임의의 방향을 향한다는 점이다. 좌회전하는 차처럼 회전한 물체에는 axis-aligned anchor가 잘 안 맞고, 방향별로 anchor를 늘리면 연산량과 오탐이 함께 는다. 2D 검출에서는 이미 [CenterNet](#/p/centernet)이 anchor 없이 중심점 히트맵만으로 상자를 찾는 방식을 보였다. 이 논문의 질문은 같은 발상을 3D 라이다에 그대로 옮기면 무엇이 좋아지는가이다.',

ideas:[
 {h:'중심점 검출: 회전 상자 대신 점 하나',
  lead:'BEV 히트맵에서 물체 중심의 피크를 찾고 나머지 속성은 그 점에서 회귀한다.',
  d:'[PointPillars](#/p/pointpillars)나 VoxelNet으로 포인트클라우드를 map-view 특징 $\\mathbf{M}\\in\\mathbb{R}^{W\\times L\\times F}$ 로 만든 뒤, 클래스별 히트맵에서 국소 최댓값을 물체 중심으로 본다. 점은 고유한 방향이 없으므로 회전 anchor를 열거할 필요가 사라지고, 3D 크기·yaw·속도는 그 중심 위치의 특징 벡터에서 바로 회귀한다.'},
 {h:'점이면 추적도 최근접 매칭으로 끝난다',
  lead:'물체 중심이 곧 추적점이 되어 프레임 간 매칭이 greedy closest-point로 단순화된다.',
  d:'중심점 표현을 추적까지 그대로 밀고 가면 tracklet은 시공간상의 경로가 된다. CenterPoint는 검출 헤드에 2차원 속도 $v$ 를 추가로 회귀시켜, 현재 프레임의 중심을 이전 프레임으로 투영한 뒤 **가장 가까운 이전 트랙과 매칭**한다. 칼만 필터나 학습된 매칭 네트워크 같은 전용 3D 추적기 없이, greedy 거리 매칭만으로 SORT류보다 빠르고 정확한 추적을 만든다.'},
 {h:'2단계 정제: 상자 면의 중심에서 특징을 다시 뽑는다',
  lead:'예측된 3D 상자의 네 옆면 중심에서 점 특징을 뽑아 점수와 위치를 재조정한다.',
  d:'1단계는 물체 중심 하나의 특징만으로 크기·방향까지 전부 추정하는데, 라이다는 물체의 한쪽 면만 보는 경우가 많아 중심 자체의 특징이 정확도를 담기에 부족하다. 2단계는 1단계가 예측한 상자의 **네 바깥쪽 면 중심**에서 map-view 특징 $\\mathbf{M}$ 을 bilinear interpolation으로 뽑아 concat하고 MLP에 넣어, IoU 기반 confidence score와 상자 보정값을 예측한다. 기존 2단계 검출기처럼 PointNet 기반 RoI 특징 추출이나 RoIAlign이 필요 없어 연산 오버헤드가 10% 미만이다.'},
 {h:'백본에 무관한 head 교체',
  lead:'검출 헤드만 바꾸는 방식이라 VoxelNet이든 PointPillars든 그대로 얹힌다.',
  d:'CenterPoint의 기여는 3D 인코더가 아니라 **출력 표현**에 있다. 기존 anchor 헤드를 이 중심점 헤드로 교체하기만 하면 되므로, VoxelNet·PointPillars 두 백본 모두에서 같은 이득이 재현된다. 논문은 같은 백본에서 anchor 헤드와 center 헤드를 직접 대조해 이 이득이 백본이 아니라 표현 방식에서 온다는 것을 보인다.'}
],

diagram:{type:'flow', cap:'포인트클라우드 → 3D 백본으로 BEV 특징 → 1단계 중심점 검출 → 2단계에서 상자 면 특징으로 재점수화.',
 nodes:[
  {t:'포인트클라우드', s:'(x,y,z,r)'},
  {t:'3D 백본', s:'VoxelNet/PointPillars', a:'BEV로'},
  {t:'중심 히트맵', s:'클래스별 피크', acc:true, a:'1단계'},
  {t:'상자 회귀', s:'크기·yaw·속도'},
  {t:'2단계 재점수화', s:'상자 면 특징 MLP'}
 ]},

math:[
 {expr:'σ = max(f(wl), τ),  τ = 2',
  tex:'\\sigma=\\max\\big(f(wl),\\,\\tau\\big),\\quad \\tau=2',
  d:'히트맵 학습 타깃의 가우시안 반경. BEV는 이미지보다 물체가 작고 희소해 감독 신호가 지나치게 드물어지므로, [CornerNet](#/p/centernet) 식 반경 함수 $f$ 로 피크 주변을 넓혀 더 조밀한 supervision을 준다.'},
 {expr:'I = min(1, max(0, 2·IoU_t − 0.5))',
  tex:'I=\\min\\!\\big(1,\\ \\max(0,\\ 2\\times \\mathrm{IoU}_t-0.5)\\big)',
  d:'2단계 confidence score의 학습 타깃. 예측 상자와 GT의 3D IoU를 [0,1]로 재매핑해 binary cross-entropy로 학습시킨다 — IoU 0.25 이하는 0점, 0.75 이상은 만점.'}
],

numbers:[
 {k:'nuScenes val · mAP/NDS', v:'58.0 / 65.5', d:'단일 모델, test 셋 기준. `mAP`는 클래스 평균 정밀도, `NDS`는 mAP에 속도·방향 등 5개 오차를 가중 평균한 종합 점수 — 둘은 별개 지표'},
 {k:'nuScenes tracking · AMOTA', v:'63.8', d:'중심점 속도 기반 greedy 매칭만으로 달성, 전용 3D 추적기 없음'},
 {k:'Waymo val · vehicle/ped mAPH(L2)', v:'71.8 / 66.4', d:'단일 모델 기준 당시 공개 최고'},
 {k:'표현 전환 효과', v:'+3~4 mAP', d:'같은 백본에서 anchor 헤드를 center 헤드로만 바꿨을 때의 이득'},
 {k:'2단계 정제 효과', v:'+2 mAP', d:'연산 오버헤드는 10% 미만'},
 {k:'2019 챌린지 대비', v:'mAP +14.3, NDS +8.1', d:'NeurIPS 2020 nuScenes 챌린지에서 2019년 우승작 CBGS 대비 개선폭'}
],

impact:'anchor를 버리고 점으로 검출한다는 [CenterNet](#/p/centernet)의 아이디어가 라이다 3D에서도 그대로 통한다는 것을 보이면서, 이후 3D 검출기 다수가 anchor-free 중심점 헤드를 기본값으로 채택했다. 검출과 추적을 별개 모듈로 만들지 않고 **속도 회귀 하나로 통합**한 것도 이후 end-to-end 인지 스택(예: [UniAD](#/p/uniad))의 설계에 영향을 줬다. 카메라 BEV 검출기([BEVDet](#/p/bevdet) 등)도 라이다 대신 이 중심점 헤드를 그대로 재사용한다.',

legacy:[
 '**카메라 BEV로 확산** — [BEVDet](#/p/bevdet)이 CenterPoint 검출 헤드를 카메라 기반 BEV 특징 위에 그대로 얹어, 라이다·카메라 공용 헤드가 됐다',
 '**추적-검출 통합의 선례** — 속도 회귀로 검출과 추적을 잇는 설계가 이후 통합 인지 스택 논의의 참조점이 됨',
 '**nuScenes 리더보드 표준 베이스라인** — 이후 다수의 라이다·멀티모달 3D 검출기가 CenterPoint 헤드를 기본 비교군으로 사용',
 '**anchor-free 3D 검출의 정착** — VoxelNet/PointPillars 세대의 anchor 튜닝(방향·크기별 anchor 설계) 부담을 줄임'
],

pitfalls:[
 '**CenterPoint는 카메라가 아니라 라이다(포인트클라우드) 검출기다.** 이름이 비슷해 카메라 BEV 계열로 혼동하기 쉽지만, 입력은 3D 포인트클라우드이고 백본은 VoxelNet/PointPillars다 — [LSS](#/p/lss) 이후 카메라 전용 계열과는 입력 모달리티가 다르다.',
 '**mAP와 NDS를 같은 수치로 혼동하지 않는다.** nuScenes test 58.0 mAP / 65.5 NDS처럼 두 지표는 스케일과 정의가 다르고, 논문 내 다른 표(Table 14 ablation 등)에는 val 셋 수치도 섞여 있어 val/test를 구분해 인용해야 한다.',
 '**추적은 학습된 모델이 아니라 후처리 규칙이다.** greedy closest-point 매칭은 검출 모델이 예측한 속도값에 의존하는 단순 알고리즘이지, 별도로 학습되는 추적 네트워크가 아니다.'
],

figures:[
 {f:'fig2-overview.png',
  cap:'(a)→(b) 3D 백본이 포인트클라우드를 BEV 특징 격자로 바꾼다. (c) 1단계 head가 이 격자에서 중심점(빨간 점)과 3D 상자를 바로 회귀한다. (d) 2단계는 그 상자의 네 바깥 면 중심에서 특징을 다시 뽑아(색칠된 화살표) MLP로 IoU 기반 score와 보정값을 낸다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'In this paper, we instead propose to represent, detect, and track 3D objects as points.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2006.11275 — Center-based 3D Object Detection and Tracking', u:'https://arxiv.org/abs/2006.11275'},
 {t:'CenterPoint 공식 코드', u:'https://github.com/tianweiy/CenterPoint'}
]
});
