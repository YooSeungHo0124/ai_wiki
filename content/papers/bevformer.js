WIKI.paper({
slug:'bevformer',
venue:'ECCV 2022',
authors:'Li, Wang, Li, Xie, Sima, Lu, Qiao, Dai (Shanghai AI Lab · Nanjing Univ. · SenseTime · HKU)',
arxiv:'2203.17270',

tldr:'BEV 격자를 학습 가능한 질의(query)로 두고, **공간 교차 어텐션**으로 여러 카메라 특징을, **시간 자기 어텐션**으로 직전 시점의 BEV 특징을 RNN처럼 재귀적으로 끌어모으는 카메라 전용 검출기. nuScenes test에서 56.9% NDS로 당시 최고 카메라 기반 검출기(DETR3D)를 9.0%p 앞섰고, 특히 속도 추정 오차를 큰 폭으로 줄였다.',

context:'`[LSS](#/p/lss)`·`[BEVDet](#/p/bevdet)` 계열은 픽셀마다 깊이 분포를 명시적으로 예측해 BEV로 들어올린다. 이 방식은 깊이 추정이 부정확하면 오차가 그대로 전달되고, 단일 프레임만 쓰다 보니 가려진 물체나 속도 추정에 약하다는 한계가 있었다. `[Deformable DETR](#/p/deformable-detr)`은 전역 attention 대신 참조점 주변 몇 개의 점만 샘플링하는 변형 가능 attention으로 연산량을 줄이면서도 2D 검출에서 강력한 성능을 보였다. BEVFormer의 질문은, 깊이를 명시적으로 예측하는 대신 **BEV 위치마다 질의를 하나씩 두고, 그 질의가 attention으로 카메라 특징 중 관련된 곳만 찾아가게 하면 어떨까**이다 — 그리고 그 질의가 과거 프레임의 BEV 특징도 함께 찾아가게 하면 시간 정보까지 한 틀에 들어온다.',

ideas:[
 {h:'BEV 질의: 격자 위치마다 학습 가능한 벡터',
  lead:'H×W 격자의 각 칸을 학습 파라미터인 질의로 두고 attention으로 채운다.',
  d:'BEV 평면을 $H\\times W$ 격자로 나누고 각 칸에 학습 가능한 질의 벡터 $Q_p$ 를 배치한다. 명시적인 깊이 예측이나 unprojection 없이, 이 질의들이 attention을 통해 "자신이 담당하는 3D 공간에 무엇이 있는지"를 카메라 특징으로부터 직접 끌어온다 — 깊이 추정이라는 중간 단계를 우회한다.'},
 {h:'공간 교차 어텐션: 카메라마다 보이는 곳만 본다',
  lead:'BEV 질의를 기둥 모양으로 세워 여러 높이에서 카메라에 투영하고, `[Deformable DETR](#/p/deformable-detr)`식 변형 가능 attention으로 히트된 뷰만 샘플링한다.',
  d:'각 BEV 질의 위치 $(x,y)$ 에 여러 높이 $z_j$ 를 가진 기둥형 3D 참조점을 만들고, 카메라 투영 행렬로 각 참조점을 이미지 평면에 투영한다. 한 질의가 실제로 투영되는 카메라 뷰($V_{hit}$)는 보통 1~2개뿐이므로, 그 뷰들에서만 변형 가능 attention으로 특징을 샘플링해 가중합한다. 전역 attention과 달리 연산량이 카메라 수·이미지 크기에 선형으로만 늘어 6-카메라 입력을 그대로 감당한다.'},
 {h:'시간 자기 어텐션: 이전 BEV를 RNN처럼 재귀적으로 반영',
  lead:'직전 시점 BEV 특징 $B_{t-1}$ 하나만 자기위치 정렬 후 attention으로 합쳐 시간 정보를 누적한다.',
  d:'과거 여러 프레임을 쌓아 채널을 늘리는 기존 방식과 달리, BEVFormer는 자차 이동(ego-motion)으로 정렬한 직전 시점 BEV $B_{t-1}$ 하나만 현재 질의 $Q$ 와 함께 변형 가능 attention에 입력한다. RNN의 은닉 상태처럼 $B_{t-1}$ 자체가 그 이전의 모든 과거를 압축해 담고 있어, 매 프레임 상수 시간의 추가 연산만으로 임의 길이의 과거 정보가 누적된다. 시퀀스 첫 프레임에서는 과거가 없으므로 이 층이 일반 self-attention으로 대체된다.'},
 {h:'검출과 분할 헤드를 하나의 BEV 위에서 공유',
  lead:'같은 BEV 인코더 출력에 검출 헤드와 분할 헤드를 동시에 붙여도 성능이 오른다.',
  d:'6개의 인코더 레이어(시간 자기 어텐션 → 공간 교차 어텐션 → FFN, 각각 Add&Norm)를 쌓아 만든 BEV 특징 $B_t$ 위에 `[Deformable DETR](#/p/deformable-detr)` 계열 검출 헤드와 map-segmentation 헤드를 함께 얹을 수 있다. 두 태스크를 함께 학습시키면 모듈을 공유하는 만큼 연산과 추론 시간도 줄어든다.'}
],

diagram:{type:'stack', cap:'BEVFormer 인코더 레이어 하나. 시간 어텐션으로 과거를, 공간 어텐션으로 여러 카메라를 같은 BEV 질의에 모은다 — 6층 반복.',
 layers:[
  {t:'BEV 질의', s:'H×W 학습 파라미터'},
  {t:'시간 자기 어텐션', s:'Q + 정렬된 Bₜ₋₁', acc:true, note:'RNN처럼 재귀'},
  {t:'Add & Norm'},
  {t:'공간 교차 어텐션', s:'히트된 카메라 뷰만', note:'변형 가능 attention'},
  {t:'Add & Norm'},
  {t:'FFN', s:'→ 다음 레이어로'}
 ]},

math:[
 {expr:'DeformAttn(q,p,x) = Σᵢ Wᵢ Σⱼ Aᵢⱼ · Wᵢ′ x(p+Δpᵢⱼ)',
  tex:'\\text{DeformAttn}(q,p,x)=\\sum_{i=1}^{N_{head}}W_i\\sum_{j=1}^{N_{key}}A_{ij}\\cdot W_i^{\\prime}x(p+\\Delta p_{ij})',
  d:'`[Deformable DETR](#/p/deformable-detr)`의 변형 가능 attention. 참조점 $p$ 주변 $N_{key}$ 개의 오프셋 위치만 bilinear interpolation으로 샘플링해 가중합하므로, 전역 attention의 $O(n^2)$ 대신 참조점 수에 선형인 비용만 든다.'},
 {expr:'SCA(Qp, Ft) = (1/|V_hit|) Σᵢ∈V_hit Σⱼ DeformAttn(Qp, P(p,i,j), Ftⁱ)',
  tex:'\\text{SCA}(Q_p,F_t)=\\frac{1}{|\\mathcal{V}_{hit}|}\\sum_{i\\in\\mathcal{V}_{hit}}\\sum_{j=1}^{N_{ref}}\\text{DeformAttn}\\big(Q_p,\\mathcal{P}(p,i,j),F_t^{i}\\big)',
  d:'공간 교차 어텐션. 카메라 투영 함수 $\\mathcal{P}$ 로 얻은 참조점들에 대해, 실제로 그 점이 보이는 뷰($V_{hit}$)에서만 변형 가능 attention을 수행해 평균 낸다.'},
 {expr:'TSA(Qp, {Q, B′ₜ₋₁}) = Σ_{V∈{Q,B′ₜ₋₁}} DeformAttn(Qp, p, V)',
  tex:'\\text{TSA}(Q_p,\\{Q,B^{\\prime}_{t-1}\\})=\\sum_{V\\in\\{Q,\\,B^{\\prime}_{t-1}\\}}\\text{DeformAttn}(Q_p,p,V)',
  d:'시간 자기 어텐션. 현재 질의 $Q$ 와 ego-motion으로 정렬한 이전 BEV $B^{\\prime}_{t-1}$ 를 모두 value로 두고 변형 가능 attention을 적용 — 오프셋도 이 둘의 concat에서 예측한다.'}
],

numbers:[
 {k:'nuScenes val · NDS/mAP', v:'51.7 / 41.6', d:'ResNet-101 백본, DETR3D(42.5 NDS) 대비 **+9.2%p NDS**'},
 {k:'nuScenes test · NDS/mAP', v:'56.9 / 48.1', d:'VoVNet-99 백본, DETR3D(47.9 NDS) 대비 +9.0%p'},
 {k:'nuScenes test · mAVE(속도오차)', v:'0.378 m/s', d:'시간 정보 없는 BEVFormer-S는 0.925 m/s — 시간 self-attention이 속도 추정을 절반 이하로 줄임'},
 {k:'BEV vs LSS·VPN(공정 비교)', v:'+11.0%p NDS', d:'같은 헤드·설정에서 뷰 생성 방식만 `[LSS](#/p/lss)`로 바꾼 베이스라인(41.0 NDS) 대비'},
 {k:'BEV 질의 격자', v:'300 × 220', d:'해상도 0.5m/격자, 인지 범위 X:[-35,75]m Y:[-75,75]m'},
 {k:'인코더 레이어 수', v:'6층', d:'각 층은 시간 자기 어텐션 → 공간 교차 어텐션 → FFN 순'}
],

impact:'[nuScenes](#/p/nuscenes)와 Waymo 양쪽에서 검증되며, `[Deformable DETR](#/p/deformable-detr)`의 변형 가능 attention을 3D 인지로 확장해, 명시적 깊이 추정 없이도 attention만으로 2D-3D 대응을 학습할 수 있다는 것을 보였다. 특히 과거 BEV 특징을 **RNN처럼 재귀적으로** 잇는 시간 self-attention은 프레임을 쌓아 채널을 늘리던 기존 방식보다 연산 효율이 좋으면서 속도 추정·가림 처리를 크게 개선해, 이후 카메라 BEV 검출기 대부분이 시간 정보를 다루는 기본 방식이 됐다. 검출·분할 헤드를 하나의 BEV 인코더 위에 공유하는 구도는 `[UniAD](#/p/uniad)`류 통합 인지 스택의 직접적인 전신이다.',

legacy:[
 '**시간 정보의 표준 처리 방식** — RNN식 재귀적 BEV 융합이 이후 카메라 BEV 검출기 다수의 기본 설계가 됨',
 '**깊이 예측 없는 뷰 변환의 대안 축** — `[LSS](#/p/lss)`/`[BEVDet](#/p/bevdet)`의 명시적 깊이 예측과 대비되는, attention 기반 암묵적 매핑이라는 축을 세움',
 '**통합 인지 스택의 BEV 백본으로 채택** — `[UniAD](#/p/uniad)`가 BEVFormer를 검출·추적·지도·예측·계획을 잇는 공용 BEV 인코더로 사용',
 '**속도 추정을 카메라만으로 실용 수준까지** — mAVE 0.378 m/s는 라이다 기반 방법에 근접해, 카메라 전용 파이프라인의 속도 추정 신뢰도를 실질적으로 끌어올림'
],

pitfalls:[
 '**시간 정보는 "여러 프레임을 쌓는" 것이 아니라 "직전 1스텝을 재귀적으로 잇는" 것이다.** 논문은 명시적으로 이를 RNN 방식이라 부르며, 고정된 과거 프레임 수를 채널에 쌓는 이전 방식과 대비시킨다. "N프레임을 본다"는 식으로 설명하면 부정확하다.',
 '**BEVFormer-S(시간 없음)와 BEVFormer(시간 포함)를 구분해서 인용한다.** 논문 표에 둘 다 등장하며 NDS·mAVE 차이가 크다 — 어느 쪽 수치인지 반드시 명시해야 한다.',
 '**백본에 따라 수치가 다르다.** ResNet-101(val 51.7 NDS)과 VoVNet-99(test 56.9 NDS)는 별개 설정이며, VoVNet-99는 depth estimation으로 추가 데이터에 사전학습된 버전이라는 각주가 원문에 있다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'(a) 인코더 한 층: BEV 질의가 먼저 시간 자기 어텐션으로 이전 BEV $B_{t-1}$ 을, 이어 공간 교차 어텐션으로 카메라 특징을 흡수한다. (b) 공간 교차 어텐션은 질의를 기둥형 3D 참조점으로 세워 실제로 투영되는 카메라 뷰(Hit Views)만 샘플링한다. (c) 시간 자기 어텐션은 정렬된 이전 BEV와 현재 질의를 함께 attention한다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'BEVFormer, which can effectively aggregate spatiotemporal features from multi-view cameras and history BEV features via attention mechanisms.',
  src:'Introduction, p.2'}
],

links:[
 {t:'arXiv 2203.17270 — BEVFormer', u:'https://arxiv.org/abs/2203.17270'},
 {t:'BEVFormer 공식 코드', u:'https://github.com/fundamentalvision/BEVFormer'}
]
});
