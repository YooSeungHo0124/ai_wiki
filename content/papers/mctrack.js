WIKI.paper({
slug:'mctrack',
venue:'arXiv 2024',
authors:'Wang, Qi, Zhao et al. (Mach Drive · NUDT · MEGVII)',
arxiv:'2409.16149',

tldr:'KITTI·nuScenes·Waymo 세 데이터셋에 **같은 파이프라인**으로 상위권 성적을 내는 3D MOT. BEV 평면 매칭 뒤 매칭 실패분을 이미지(RV) 평면에서 다시 맞추고, 속도·가속도 품질을 재는 motion metric과 통일 포맷 BaseVersion도 함께 제안한다.',

context:'3D MOT는 자율주행에서 인지와 계획을 잇는 단계이며, 지배적인 방식은 [AB3DMOT](#/p/ab3dmot) 이래의 tracking-by-detection이다. 문제는 방법마다 한 데이터셋에서만 최고이고 다른 데이터셋에서는 평범하다는 점이다. 논문은 Fast-Poly가 nuScenes에서, DetZero가 Waymo에서 강한 사례를 든다. 데이터셋마다 검출 포맷이 달라 전처리 코드를 따로 짜야 하는 부담도 있다. 또 HOTA·AMOTA 같은 기존 지표는 궤적이 올바르게 이어졌는지만 재고, 예측·계획이 쓰는 속도·가속도·각속도의 정확도는 보지 않는다. 카메라 기반 검출은 깊이가 10 m까지 틀릴 수 있어 BEV 매칭만으로는 ID 스위치가 난다는 실무 문제도 있다.',

ideas:[
 {h:'BaseVersion: 세 데이터셋의 검출 포맷 통일',
  lead:'KITTI·nuScenes·Waymo의 검출 결과를 한 형식으로 바꿔 알고리즘 연구에만 집중하게 한다.',
  d:'월드 좌표계 기준으로 장면 ID, 프레임, 타임스탬프, 검출 박스(점수, 카테고리, 전역 xyz·lwh·yaw·속도·가속도)를 한 구조에 담는다. 이 덕분에 같은 추적 코드를 세 데이터셋에 그대로 돌릴 수 있다.'},
 {h:'상태를 분리한 칼만 필터 3개',
  lead:'단위와 성질이 다른 변수를 한 벡터에 넣지 않고 위치·크기·방향을 따로 필터링한다.',
  d:'11차원까지 커지는 단일 상태 벡터는 단위(m, 도, 0~1 점수)가 달라 수치적으로 불안정하고, 각도의 주기성 같은 비선형도 섞인다고 본다. 그래서 위치는 BEV의 $(x,y)$ 에 등가속도 모델, 크기는 $(l,w)$ 에 등속 모델, 방향은 인지 yaw $\\theta_p$ 와 속도에서 계산한 방향 $\\theta_v=\\arctan(v_y/v_x)$ 에 등속 모델을 쓴다.'},
 {h:'Ro_GDIoU: 방향과 중심 거리를 함께 보는 BEV 비용',
  lead:'GIoU와 DIoU의 약점을 합쳐, 박스가 안 겹치거나 중심 거리가 같아도 유사도를 구분한다.',
  d:'GIoU는 한 박스가 다른 박스에 포함되면 IoU와 같아지고, DIoU는 IoU가 0이면서 중심 거리가 같은 경우를 구분하지 못한다. Ro_GDIoU는 yaw를 반영한 BEV 박스에서 이 두 항을 가중 합친 값이다. 비용은 칼만 예측(앞으로)과 현재 검출을 되돌린 값(뒤로) 양쪽에서 계산해 섞는다.'},
 {h:'BEV 1차 매칭, RV 2차 매칭',
  lead:'임계값만 느슨하게 푸는 대신 시점을 바꿔 두 번 맞춘다.',
  d:'1차는 BEV 평면에서 Ro_GDIoU와 헝가리안으로 대부분을 매칭한다. 남은 트랙과 검출을 이미지 평면(RV)에 투영해 SDIoU 비용과 그리디로 다시 맞춘다. 깊이가 부정확해 BEV에서는 어긋나도 이미지에서는 가까운 경우를 구제하며, 차량 앞쪽 물체만 투영해 비용을 줄인다.'},
 {h:'Motion metric: 속도의 품질을 따로 잰다',
  lead:'궤적이 이어진 뒤에도 속도 방향·크기·지연·부드러움을 평가한다.',
  d:'VAE(속도 각도 오차), VNE(속도 크기 오차), VAIE·VIR(방향이 반대로 뒤집힌 비율), VSE(Savitzky-Golay 필터 기준 매끄러움), VDE(속도 신호의 시간 지연)를 정의한다. 선행차 급감속을 늦게 알아채는 상황이 이 지표가 겨냥한 예이다.'}
],

diagram:{type:'flow', cap:'MCTrack 파이프라인. 월드 좌표에서 BEV 매칭을 먼저 하고, 남은 것을 RV에서 다시 매칭한 뒤 세 개의 칼만 필터를 갱신한다.',
 nodes:[
  {t:'BaseVersion', s:'3D 검출 통일'},
  {t:'BEV 매칭', s:'Ro_GDIoU + 헝가리안', acc:true},
  {t:'RV 매칭', s:'남은 것만, 그리디'},
  {t:'궤적 관리', s:'초기화·갱신·소멸'},
  {t:'칼만 필터 3개', s:'위치·크기·방향', a:'속도 출력'}
 ]},

math:[
 {tex:'Ro\\_GDIoU=Ro\\_IoU-\\omega_1\\frac{C-U}{C}-\\omega_2\\frac{c^{2}}{d^{2}},\\quad \\omega_1+\\omega_2=2',
  expr:'Ro_GDIoU = Ro_IoU - w1·(C-U)/C - w2·c²/d²',
  d:'$Ro\\_IoU=I/U$ 는 방향을 반영한 BEV 박스의 IoU, $C$ 는 최소 외접 사각형 면적, $c$ 는 중심 거리, $d$ 는 외접 사각형 대각선 길이이다. 완전히 겹치면 1, 멀리 떨어지면 -2에 가까워진다.'},
 {tex:'L_{cost}=\\alpha\\,C(D_\\tau,T_\\tau)+(1-\\alpha)\\,C(D_{\\tau-1},T_{\\tau-1})',
  expr:'L = α·C(D_τ, T_τ) + (1-α)·C(D_{τ-1}, T_{τ-1})',
  d:'앞으로 예측한 트랙과 현재 검출의 비용, 뒤로 되돌린 검출과 이전 트랙의 비용을 $\\alpha$ 로 섞는다.'}
],

numbers:[
 {k:'KITTI test · HOTA (VirConv 검출)', v:'online 80.78 / offline 82.56', d:'online에서는 LEGO 80.75, offline에서는 BiTrack 82.39. 본문은 82.46으로 쓰지만 표는 82.56이다'},
 {k:'nuScenes test · AMOTA', v:'76.3', d:'LargeKernel3D 검출. Fast-Poly 75.8, Poly-MOT 75.4'},
 {k:'Waymo test · MOTA (전체)', v:'73.44 (CTRL 검출)', d:'DetZero 75.05가 1위. 논문은 DetZero의 검출기가 더 좋아 직접 비교가 어렵다고 설명'},
 {k:'Ro_GDIoU ablation (nuScenes, CenterPoint 검출 · AMOTA)', v:'Ro_GDIoU 74.0 · GIoU 73.7 · DIoU 73.1', d:'KITTI train에서는 HOTA 83.90 대 83.55 / 83.69로 차이가 더 작다'},
 {k:'RV 2차 매칭 ablation (KITTI, MOTA)', v:'PointRCNN 63.5 → 64.2, VirConv 85.9 → 85.9', d:'검출기가 약할수록 효과가 크고 최고 검출기에서는 거의 없다'},
 {k:'속도 추정 비교 (nuScenes · VAE / VNE)', v:'칼만 6.30° / 0.56 m/s', d:'원 검출 속도 6.50° / 0.60, 미분 8.03° / 0.85, 곡선 피팅 8.48° / 2.48'}
],

impact:'MCTrack은 알고리즘 자체보다 "한 파이프라인, 세 데이터셋, 통일 입력 포맷"이라는 평가 방식을 앞세운 3D MOT 베이스라인이다. 저자들은 세 데이터셋 모두에서 SOTA를 낸 첫 방법이라고 주장하지만, Waymo는 2위이고 그나마 검출기가 다르다. CPU의 Python만으로 구현해 차량 탑재 연산 제약을 의식한 점이 특징이며, 속도 품질 지표는 추적 평가가 연결 정확도 너머를 봐야 한다는 제안이다.',

legacy:[
 '[AB3DMOT](#/p/ab3dmot)의 칼만+헝가리안 구조를 잇되, 상태 분리와 시점이 다른 2단계 매칭으로 다듬은 계보에 속한다',
 '[CenterPoint](#/p/centerpoint) 계열 검출 결과 위에서도 통하는 연관 모듈로 ablation에 쓰였다',
 'Poly-MOT·PC3T 같은 기존 트래커에 Ro_GDIoU만 꽂아도 AMOTA나 HOTA가 오르는 것을 보였다',
 '속도·가속도 정확도를 재는 motion metric은 연결 정확도 중심이던 3D MOT 평가를 보완하자는 제안이다'
],

pitfalls:[
 '**"세 데이터셋 모두 SOTA"는 조건이 붙는다.** KITTI·nuScenes는 1위이지만 Waymo는 2위이고, 데이터셋마다 검출기가 다르다(VirConv, LargeKernel3D, CTRL). 연관 기여만 분리한 비교가 아니다.',
 '**논문 본문과 표의 수치가 어긋난다.** KITTI offline HOTA를 본문은 82.46, 표는 82.56으로 적고 AssA도 86.55 대 86.64이다. 인용할 때는 표 값을 확인해야 한다.',
 '**RV 매칭의 이득은 LiDAR 검출에서는 작다.** 실험은 대부분 깊이가 정확한 LiDAR 검출이라 개선폭이 작고, 논문도 카메라 중심 실환경에서 효과가 클 것이라고 추정할 뿐 직접 검증하지는 않았다.'
],

figures:[
 {f:'fig2-pipeline.png',
  cap:'왼쪽에서 BaseVersion 검출과 과거 궤적이 전처리되어 BEV 연관(위쪽 점선 그림의 BEV)을 거치고, 남은 것은 RV 연관(이미지 평면)에서 다시 매칭된다. 오른쪽의 궤적 관리와 칼만 필터 3개가 위치·크기·속도·가속도·yaw rate를 출력한다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'To our best knowledge, our method is the first to achieve SOTA performance across the three most popular tracking datasets: KITTI, nuScenes, and Waymo.',
  src:'Introduction, p.2'}
],

links:[
 {t:'arXiv 2409.16149 — MCTrack', u:'https://arxiv.org/abs/2409.16149'},
 {t:'GitHub — megvii-research/MCTrack', u:'https://github.com/megvii-research/MCTrack'}
]
});
