WIKI.paper({
slug:'locotrack',
venue:'ECCV 2024 (arXiv 2024)',
authors:'Cho et al. (Korea University · Adobe Research)',
arxiv:'2407.15420',

tldr:'점 추적의 상관(correlation)을 "점 하나 대 영역"의 2D에서 "영역 대 영역"의 **local 4D** 로 바꿔 매칭 모호성을 줄인 모델. 3층짜리 작은 Transformer로 [CoTracker](#/p/cotracker) 대비 약 6배 빠르면서 TAP-Vid 전반에서 더 높은 정확도를 냈다.',

context:'[TAPIR](#/p/tapir)·[CoTracker](#/p/cotracker) 같은 점 추적기는 쿼리 점의 특징 벡터를 타깃 프레임의 국소 영역과 비교하는 **2D 상관 맵**으로 대응점을 찾는다. 이 방식은 하늘·바닥 같은 균질한 영역, 반복 패턴, 겹쳐 있는 비슷한 물체에서 맵의 봉우리가 여럿 생겨 위치가 모호해진다. 기존 연구는 이 모호성을 시간 문맥(1D conv, MLP-Mixer, Transformer)이나 CoTracker처럼 주변 점을 같이 추적하는 방식으로 풀었는데, 후자는 추가 쿼리 점만큼 계산량이 늘어난다. 한편 [RAFT](#/p/raft) 같은 dense correspondence 쪽에서는 모든 점쌍의 유사도인 4D 상관 볼륨이 공간적 문맥을 준다는 것이 알려져 있었지만, 점 추적에는 거의 쓰이지 않았다.',

ideas:[
 {h:'Local 4D correlation: 영역 대 영역 전수 비교',
  lead:'쿼리 점 주변 영역과 타깃 영역의 모든 점쌍 유사도를 4D 텐서로 만든다.',
  d:'쿼리 프레임에서 쿼리 점 $q$ 주변 $(2r_q+1)^2$ 격자, 타깃 프레임에서 현재 추정 위치 $p$ 주변 $(2r_p+1)^2$ 격자를 잡고 모든 쌍의 코사인 유사도를 계산한다. 논문의 설정은 $r_q=r_p=3$ 이라 $7\\times7\\times7\\times7$ 볼륨이다. 전역 4D 볼륨 $H\\times W\\times H\\times W$ 은 감당이 안 되므로 탐색 범위를 국소로 제한해 비용을 잡는다. 4D 볼륨은 양방향 대응(검증)과 이웃 점들 사이의 매칭 평활성이라는 사전 정보를 함께 준다.'},
 {h:'두 갈래 2D conv로 4D 볼륨을 압축',
  lead:'4D를 쿼리 차원·타깃 차원 중 한쪽을 채널로 보는 2D conv 두 갈래로 처리한다.',
  d:'4D 텐서에 4D conv를 쓰면 무겁다. 대신 한 갈래는 쿼리 차원 $(h_q w_q)$ 을 채널로 펼치고 타깃 쪽 $(h_p,w_p)$ 에 2D conv를 건다. 다른 갈래는 볼륨을 전치해 반대로 한다. 각 갈래가 strided conv·GroupNorm·ReLU·average pooling으로 벡터 하나로 압축되고, 둘을 이어 붙인 것이 그 프레임의 correlation embedding $E_t^k$ 가 된다.'},
 {h:'길이에 일반화되는 Transformer',
  lead:'상대 위치 바이어스(ALiBi 방식)로 학습 때와 다른 길이의 영상도 슬라이딩 윈도 없이 처리한다.',
  d:'시간 모델로 Transformer를 택한 이유는 임의 길이 입력이 되고, 한 층에서 전역 수용 영역을 얻기 때문이다. 다만 sinusoidal 위치 인코딩은 학습과 다른 길이에서 성능이 떨어져서, 거리에 비례해 attention 점수를 깎는 상대 위치 바이어스를 쓴다. 이 바이어스는 방향을 구분하지 못하므로 head 절반은 왼쪽 토큰만, 나머지 절반은 오른쪽 토큰만 보게 나눈다. 덕분에 [PIPs](#/p/pips)·CoTracker가 쓰던 슬라이딩 윈도 추론이 필요 없다.'},
 {h:'초기화 + 반복 정제의 2단계 구조',
  lead:'전역 상관으로 거친 궤적을 잡고, 잔차를 K번 더해 다듬는다.',
  d:'1단계는 ResNet18의 3단 피라미드 특징으로 쿼리와 각 프레임의 전역 상관 맵을 만들고 soft-argmax로 초기 위치 $\\mathcal{T}^0$ 와 가림 확률 $\\mathcal{O}^0$ 를 낸다. 초기 궤적은 노이즈 때문에 떨리므로, 2단계에서 local 4D 상관과 Transformer로 잔차 $\\Delta\\mathcal{T},\\Delta\\mathcal{O}$ 를 예측해 $K=4$ 번 갱신한다. 이 2단계 골격은 TAPIR과 같고, 바뀐 것은 상관의 차원과 시간 모델이다.'}
],

diagram:{type:'compare', cap:'핵심 차이는 상관 맵의 차원이다. 2D 상관은 쿼리 점 하나의 특징만 쓰지만, local 4D 상관은 쿼리 주변 영역 전체를 타깃 영역과 맞대 본다.',
 left:{t:'기존: local 2D 상관', items:['쿼리 점 1개 vs 타깃 영역','균질·반복 영역에서 모호','시간 문맥으로 사후 보정','긴 영상은 윈도 체이닝']},
 right:{t:'LocoTrack: local 4D', items:['쿼리 영역 vs 타깃 영역','양방향·평활성 사전 정보','두 갈래 2D conv로 압축','상대 바이어스로 길이 일반화']}},

math:[
 {expr:'L_t(i,j;p) = F_t(i)·F_tq(j) / (|F_t(i)| |F_tq(j)|),  i∈N(p;r_p), j∈N(q;r_q)',
  tex:'\\mathrm{L}_t(i,j;p)=\\frac{F_t(i)\\cdot F_{t_q}(j)}{\\lVert F_t(i)\\rVert_2\\,\\lVert F_{t_q}(j)\\rVert_2},\\quad i\\in\\mathcal{N}(p;r_p),\\; j\\in\\mathcal{N}(q;r_q)',
  d:'local 4D 상관. $F_t$ 는 현재 프레임, $F_{t_q}$ 는 쿼리가 있는 프레임의 특징 맵이고 $\\mathcal{N}(p;r)$ 은 $p$ 중심 반경 $r$ 의 정사각 이웃이다. $p$ 는 현재 추정 위치 $\\mathcal{T}_t^k$ 이므로 반복할 때마다 볼륨이 새로 만들어진다.'},
 {expr:'T^{k+1} = T^k + ΔT^k,  O^{k+1} = O^k + ΔO^k',
  tex:'\\mathcal{T}^{k+1}=\\mathcal{T}^k+\\Delta\\mathcal{T}^k,\\qquad \\mathcal{O}^{k+1}=\\mathcal{O}^k+\\Delta\\mathcal{O}^k',
  d:'정제 단계의 갱신식. 위치 자체 대신 인접 프레임 간 위치 차이를 입력으로 주는 편이 수렴이 빠르다고 저자들은 보고한다.'}
],

numbers:[
 {k:'TAP-Vid-DAVIS · strided · 256×256 · AJ (LocoTrack-S / -B)', v:'66.9 / 67.8', d:'같은 조건의 TAPIR은 61.3. 표 1의 256×256 블록'},
 {k:'TAP-Vid-DAVIS · strided · 384×512 · AJ (LocoTrack-S / -B)', v:'68.4 / 69.4', d:'같은 해상도 블록의 CoTracker는 65.9'},
 {k:'TAP-Vid-RGB-Stacking · strided · 256×256 · AJ (-S)', v:'77.4', d:'TAPIR은 62.7. 같은 표에서 384×512 입력은 71.0으로 오히려 낮아지는데, 저자들은 해상도가 커질수록 국소 상관의 유효 수용 영역이 줄기 때문이라고 설명한다'},
 {k:'처리량 (points/sec, RTX 3090, 24프레임)', v:'S 7,244 / B 4,359', d:'TAPIR 2,097, CoTracker 1,147. 소형 모델이 TAPIR 대비 3.5배, CoTracker 대비 6배'},
 {k:'파라미터 수 / 점당 추가 FLOPs', v:'S 8.2M · 1.08G / B 11.5M · 2.10G', d:'CoTracker 45.5M · 4.65G, TAPIR 29.3M · 5.12G'},
 {k:'상관 방식 ablation (DAVIS AJ)', v:'2D 65.0 → local 4D 67.8', d:'표 4의 (I) 대 (V). 쿼리 이웃을 무작위로 뽑으면 65.7, 가로 한 줄이면 66.5로 전수 격자보다 낮다'}
],

impact:'LocoTrack은 점 추적의 병목을 "시간 모델을 더 크게"가 아니라 **매 프레임의 매칭 신호 자체**에서 찾았다. dense correspondence에서 쓰던 4D 상관을 국소로 잘라 점 추적에 가져오자, 8.2M 파라미터의 소형 모델이 45.5M짜리 CoTracker를 AJ에서 앞섰다. 길이 일반화 가능한 상대 위치 바이어스도 윈도 체이닝을 걷어내는 실용적 기여였다. 효율과 정확도를 함께 올린 모델이어서 이후 효율 지향 추적기와 비교할 때 기준점으로 쓰이는 편이다.',

legacy:[
 '**[TAPIR](#/p/tapir)의 초기화+정제 골격을 잇되 상관과 시간 모델을 교체** — 1D conv 믹서 대신 Transformer, 2D 대신 4D 상관을 넣었다',
 '**[CoTracker](#/p/cotracker)의 "주변 점 같이 추적" 대신 영역 단위 상관으로 공간 문맥을 확보** — 추가 쿼리 점의 비용 없이 같은 목적을 노린다',
 '**[RAFT](#/p/raft)류 dense matching의 4D 상관을 점 추적으로 이식** — 두 분야 사이의 연결 사례로 읽힌다',
 '**후속 [AllTracker](#/p/alltracker) 등의 비교표에 11.5M급 효율형 기준선으로 등장** — 9개 벤치마크 평균 δ_avg 61.5로 실린다'
],

pitfalls:[
 '**해상도를 올린다고 항상 좋아지지 않는다.** 국소 상관의 반경이 고정이라 고해상도에서는 같은 반경이 실제로 덮는 영역이 줄어든다. 표 1에서 384×512가 256×256보다 낮은 데이터셋이 있다.',
 '**"4D 상관"이라고 해서 전역 4D 볼륨을 쓰는 것이 아니다.** 7×7×7×7로 잘라 쓰기 때문에 쿼리와 크게 멀리 이동한 대응은 1단계의 전역 상관과 반복 갱신으로 따라와야 한다.',
 '**학습은 Kubric 합성 데이터(Panning MOVi-E)로만 했다.** 실영상 pseudo-label로 학습하는 [CoTracker3](#/p/cotracker3) 이전 세대의 설정이므로, 학습 데이터 차이를 무시하고 모델 구조 차이만으로 성능 차를 해석하면 안 된다.'
],

figures:[
 {f:'fig2-local-4d.png',
  cap:'(a) 쿼리 점 하나와 타깃 영역을 비교한 2D 상관 맵은 봉우리가 여러 개로 갈라져 있다. (b) 쿼리 영역과 타깃 영역의 모든 쌍을 4D 인코더로 처리하면 맵이 한 점으로 모인다. 오른쪽 작은 히트맵을 비교해서 본다.',
  src:'원문 Figure 2, p.2'},
 {f:'fig3-architecture.png',
  cap:'왼쪽은 전역 상관으로 거친 궤적 $\\mathcal{T}^0$ 를 만드는 초기화, 오른쪽은 local 4D 상관 인코더와 Transformer가 잔차를 K번 반복 예측하는 정제 단계다. Transformer 입력 박스에 위치 차이·가림 상태·상관 임베딩이 함께 들어간다.',
  src:'원문 Figure 3, p.5'}
],

quotes:[
 {t:'LocoTrack overcomes this challenge with a novel approach that utilizes all-pair correspondences across regions, i.e., local 4D correlation, to establish precise correspondences',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2407.15420 — LocoTrack', u:'https://arxiv.org/abs/2407.15420'},
 {t:'GitHub — KU-CVLAB/LocoTrack', u:'https://github.com/KU-CVLAB/LocoTrack'}
]
});
