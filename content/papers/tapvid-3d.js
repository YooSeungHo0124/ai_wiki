WIKI.paper({
slug:'tapvid-3d',
venue:'NeurIPS 2024 (Datasets and Benchmarks)',
authors:'Koppula, Rocco et al. (Google DeepMind · UCL · Oxford)',
arxiv:'2407.05921',

tldr:'2D 점 추적 벤치마크 [TAP-Vid](#/p/tap-vid)를 3D로 확장한 벤치마크. 실제 영상 4,000여 편에 미터 단위 3D 궤적과 가시성 정답을 붙이고, 깊이 스케일 모호성까지 다루는 3D-AJ·APD 지표를 정의했다. 당시 베이스라인은 2D 추적에 비해 3D 성능이 크게 낮았다.',

context:'2D 점 추적(TAP)에는 TAP-Vid-DAVIS 같은 실제 영상 벤치마크가 있었지만, 3D 점 추적에는 정답 3D 궤적이 달린 실제 영상 평가셋이 없었다. 합성 환경(Kubric, RGB-Stacking, PointOdyssey)은 3D 정답을 줄 수 있어도 실제 영상과의 도메인 격차가 크다. 단안 깊이 추정은 면이 프레임 사이에서 어떻게 움직이는지 평가하지 못하고, 3D 자세 추적은 객체마다 3D 모델이 필요하다. scene flow는 순간 움직임만 재서 긴 영상에서 가림을 넘는 연관을 평가하지 못한다. 저자들은 "세계는 각자 3D 궤적을 그리는 입자로 이뤄졌다"는 관점에서, 3D 모델 없이도 모든 표면 점의 장기 3D 움직임을 재는 평가를 만들려 했다.',

ideas:[
 {h:'기존 데이터셋 세 곳에서 3D 정답을 뽑아낸다',
  lead:'Aria Digital Twin, DriveTrack, Panoptic Studio에서 각각 다른 센서·방식으로 3D 궤적을 만든다.',
  d:'Aria Digital Twin은 스튜디오의 디지털 복제본이 주는 깊이·분할·물체 자세로, 쿼리 점을 물체 좌표계에 고정한 뒤 물체 자세를 따라 궤적을 얻는다. DriveTrack은 Waymo 차량의 LiDAR 점군과 3D 박스로 강체 차량 위의 점을 추적한다. Panoptic Studio는 다시점 3D Gaussian으로 재구성한 비강체 사람 움직임에서 가장 가까운 Gaussian 중심을 따라간다. 실내 1인칭, 실외 주행, 비강체 인체라서 서로 다른 약점을 드러낸다.'},
 {h:'가시성은 깊이 비교로 정한다',
  lead:'점의 깊이가 관측 깊이와 비슷하고 손 마스크 밖이면 보이는 것으로 본다.',
  d:'프레임 $t$ 에서 궤적의 3D 점을 영상에 투영해 그 깊이 $Z$ 와 해당 픽셀의 관측 깊이 $D_t$ 를 비교한다. 차이가 임계값 $\\delta$ 이내이면 보이는 것이다. Aria에서는 디지털 복제본에 없는 조작자의 손 마스크를 추가로 제외하고, DriveTrack에서는 관측 깊이보다 5% 이상 멀면 가려진 것으로 처리한다. 데이터 정리 단계에서는 가시성 플래그가 전체 프레임 수의 10%보다 자주 바뀌는 궤적을 걸러낸다.'},
 {h:'3D 지표: 깊이 의존 임계값과 스케일 보정',
  lead:'픽셀 임계값을 깊이에 비례해 3D로 올려, 깊이가 정확하면 2D 지표와 같아지도록 한다.',
  d:'3D 임계값은 $\\delta_{3D}=Z\\cdot\\delta_{2D}/f$, $\\delta_{2D}\\in\\{1,2,4,8,16\\}$ 로 정의해 가까운 점일수록 엄격하게 본다. 이 정의에서는 예측의 깊이가 모두 맞으면 APD$_{3D}$ 가 2D APD와 수치로 일치한다. 단안 방법은 절대 스케일을 모르므로 평가 전에 중앙값 깊이비로 예측을 맞추는 global median rescaling을 쓰고, 궤적별로 따로 맞추는 per-trajectory 방식도 제공한다.'},
 {h:'2D 추적기 + 깊이 추정기 베이스라인',
  lead:'TAPIR·CoTracker·BootsTAPIR의 2D 궤적에 ZoeDepth나 COLMAP의 깊이를 붙여 3D로 올린다.',
  d:'지도 학습된 3D 추적 전용 모델이 거의 없던 시점이라, 2D 추적기를 ZoeDepth의 단안 깊이 또는 COLMAP의 SfM 깊이와 결합한 조합을 비교 기준으로 세웠다. 여기에 3D 전용 모델 SpatialTracker, 합성 데이터로만 학습한 TAPIR-3D, 점이 정지해 있다고 가정하는 static 기준선을 더했다.'}
],

diagram:{type:'split', cap:'세 데이터 소스가 서로 다른 센서와 가정으로 3D 궤적·가시성 정답을 만들고, 하나의 TAP-3D 평가로 합쳐진다.',
 from:{t:'TAPVid-3D', s:'4,569 클립', acc:true},
 branches:[
  {t:'Aria ADT', s:'실내 1인칭·디지털 트윈'},
  {t:'DriveTrack', s:'Waymo LiDAR·강체 차량'},
  {t:'Panoptic', s:'돔 촬영·비강체 사람'}
 ],
 join:'3D 궤적 + 가시성 정답'},

math:[
 {expr:'δ_3D(P) = Z(P) · δ_2D / f,  δ_2D ∈ {1,2,4,8,16}',
  tex:'\\delta_{3D}(P_t^i)=\\frac{Z(P_t^i)\\,\\delta_{2D}}{f},\\qquad \\delta_{2D}\\in\\{1,2,4,8,16\\}',
  d:'픽셀 임계값을 초점거리 $f$ 와 정답 깊이 $Z$ 로 3D 거리로 환산한다. 멀리 있는 점에는 더 큰 오차를 허용한다.'},
 {expr:'AJ_3D = Σ v v̂ α / (Σ v + Σ (1-v) v̂ + Σ v v̂ (1-α))',
  tex:'\\mathrm{AJ}_{3D}=\\frac{\\sum v_t^i\\hat v_t^i\\alpha_t^i}{\\sum v_t^i+\\sum(1-v_t^i)\\hat v_t^i+\\sum v_t^i\\hat v_t^i(1-\\alpha_t^i)}',
  d:'$\\alpha_t^i$ 는 예측이 3D 임계값 안에 있는지를 나타내는 지시 함수이다. TAP의 AJ와 같은 모양이지만 위치 판정이 3D 거리 기준이라서, 위치·깊이·가시성이 모두 맞아야 true positive가 된다.'}
],

numbers:[
 {k:'벤치마크 규모 (표 2)', v:'클립 4,569개 (minival 150개)', d:'Aria 1,956, DriveTrack 2,457, Panoptic Studio 156. 클립 길이 25~300프레임, 클립당 궤적 50~1,024개. 영상 수는 2,828편'},
 {k:'3D-AJ 평균 · CoTracker + ZoeDepth (표 3)', v:'8.7', d:'full_eval 평균. APD 14.8, OA 83.4'},
 {k:'3D-AJ 평균 · BootsTAPIR + COLMAP (표 3)', v:'9.3', d:'표의 평균 열 최고값(CoTracker + COLMAP도 9.3). DriveTrack에서는 11.8이지만 Panoptic에서는 6.9'},
 {k:'3D-AJ 평균 · SpatialTracker (표 3)', v:'9.0', d:'3D 전용 모델도 비슷한 수준. APD 15.5로 평균 APD 열에서는 가장 높다'},
 {k:'3D-AJ 평균 · static 기준선 / TAPIR-3D', v:'4.9 / 3.1', d:'TAPIR-3D는 궤적을 독립적으로 내서 장면 전체의 스케일 일관성이 없어 낮다고 논문이 설명한다'},
 {k:'같은 데이터 2D-AJ · BootsTAPIR (표 4)', v:'59.1', d:'정답 3D 궤적을 2D로 투영해 평가한 값. 같은 모델의 3D 성능과 큰 격차가 난다'}
],

impact:'TAPVid-3D는 3D 점 추적이라는 과제에 처음으로 실제 영상 기반의 대규모 공통 평가를 제공했다. 표 3과 표 4의 대비가 핵심 메시지다. 2D 궤적은 정확해 보여도 깊이 스케일의 시간·공간 불일치 때문에 3D 궤적은 크게 어긋난다. 또 세 데이터 소스에서 방법별 강약이 갈려 하나의 평균 숫자로는 가려지는 약점이 드러난다. 저자들은 단안 깊이, SfM, 3D 전용 추적의 요소를 합쳐야 한다고 결론짓는다.',

legacy:[
 '**[TAP-Vid](#/p/tap-vid)의 3D 확장** — 같은 AJ·APD·OA 체계를 3D 거리와 깊이 스케일 보정으로 일반화했다',
 '**[TAPIR](#/p/tapir)·[CoTracker](#/p/cotracker) 같은 2D 추적기를 깊이 추정과 결합하는 기준선 방식을 제시**',
 '**3D 전용 점 추적 모델(SpatialTracker 등)이 실제 영상에서 비교되는 공통 장대가 됨**',
 '**2D 추적에서 3D로 넘어가는 연구에서 단안 깊이·SfM·점 추적의 결합 필요성을 수치로 보여준 출발점**'
],

pitfalls:[
 '**학습용 데이터가 아니라 평가용이다.** 저자들이 이 데이터셋은 학습 용도가 아니라고 명시한다. 정답은 디지털 복제본·LiDAR·재구성에서 나온 자동 생성 pseudo-GT라 센서 노이즈가 남아 있을 수 있다.',
 '**절대 스케일은 평가 전에 보정된다.** 중앙값 스케일링을 쓰므로 이 지표는 미터 단위의 절대 깊이 정확도가 아니라, 하나의 전역 스케일 안에서의 상대적 3D 일관성을 잰다. 방법 간 비교는 스케일 방식을 맞춰서 봐야 한다.',
 '**딱딱하고 불투명한 물체만 다룬다.** 논문이 한계로 밝히듯 2D TAP와 단안 깊이의 한계를 이어받아 반투명·반사 표면은 평가하지 않는다.'
],

figures:[
 {f:'fig2-failure-modes.png',
  cap:'파란 실선이 정답, 빨간 점선이 BootsTAPIR + ZoeDepth의 예측이다. 위 줄은 영상에 투영한 2D 궤적, 아래 줄은 3D 궤적이다. (a) 정확히 추적, (b) 깊이 노이즈로 3D 궤적이 떨림, (c) 시간에 따라 깊이 스케일이 흔들림, (d) 점마다 스케일이 달라 하나의 전역 스케일로 맞출 수 없음. 위 줄은 모두 비슷해 보이는데 아래 줄이 갈리는 점을 본다.',
  src:'원문 Figure 2, p.8'}
],

quotes:[
 {t:'While point tracking in two dimensions (TAP) has many benchmarks measuring performance on real-world videos, such as TAPVid-DAVIS, three-dimensional point tracking has none.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2407.05921 — TAPVid-3D', u:'https://arxiv.org/abs/2407.05921'},
 {t:'프로젝트 페이지 — tapvid3d.github.io', u:'https://tapvid3d.github.io/'}
]
});
