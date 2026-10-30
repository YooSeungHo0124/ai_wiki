WIKI.paper({
slug:'alltracker',
venue:'ICCV 2025 (arXiv 2025)',
authors:'Harley et al. (Stanford · CMU · TRI · ARL)',
arxiv:'2506.07310',

tldr:'점 추적을 "쿼리 프레임에서 나머지 모든 프레임으로 가는 **장거리 optical flow**"로 다시 정의한 모델. 저해상도 격자에서 2D conv와 픽셀 정렬 시간 attention으로 반복 정제하고 마지막에 업샘플해, 16.48M 파라미터로 고해상도 전 픽셀 궤적을 낸다.',

context:'[PIPs](#/p/pips)에서 [CoTracker3](#/p/cotracker3)까지의 점 추적기는 장기 시간 문맥을 얻는 대신 공간 정보를 희생했다. 트랙마다 따로 처리하거나 소수의 가상 점으로 공간 정보를 압축했고, 결과는 사용자가 고른 희소한 점 집합에만 나온다. 반대로 [RAFT](#/p/raft) 계열 optical flow는 전 픽셀 밀집 출력과 공간적 일관성이 강점이지만 보통 인접 두 프레임만 본다. 기준 프레임과 먼 프레임 사이의 flow를 직접 구하면 드리프트 없이 가림도 넘길 수 있지만, 시간 간격이 벌어질수록 시점·조명·기하 변화로 어려워진다. 저자들은 두 흐름의 장점을 한 모델에 합치려 한다.',

ideas:[
 {h:'점 추적 = 기준 프레임 대 전 프레임의 flow',
  lead:'출력을 쿼리 프레임 픽셀이 각 프레임에서 어디로 가는지의 flow 맵으로 통일한다.',
  d:'입력은 $T\\times H\\times W\\times3$ 영상과 쿼리 프레임 인덱스이고, 출력은 $T\\times H\\times W\\times4$ 이다. 앞 두 채널이 쿼리 프레임 각 픽셀의 변위(flow)이고 뒤 두 채널이 가시성과 신뢰도다. 길이 $S=16$ 의 윈도를 stride $S/2$ 로 밀면서 이전 윈도의 추정을 겹치는 구간의 초기값으로 쓴다. 희소한 점은 이 밀집 출력에서 샘플링하면 되므로, 저자들은 비슷한 속도·정확도의 희소 추적기가 필요 없어진다고 주장한다.'},
 {h:'저해상도 격자에서 공간·시간을 번갈아 전파',
  lead:'1/8 해상도에서 2D ConvNeXt 블록과 픽셀 정렬 시간 attention을 교대로 쌓는다.',
  d:'모든 텐서가 쿼리 프레임에 정렬되어 있어, 시간 블록은 같은 쿼리 픽셀의 $S$ 개 시점 사이에서만 attention하고 이를 모든 픽셀에 병렬로 적용한다. 비용은 $S^2$ 에 비례한다. 공간 블록은 2D conv라서 이웃 픽셀 사이의 메시지 전달을 싸게 해결한다. DTF·DELTA가 희소한 anchor 토큰에 cross-attention으로 전역 공간 전파를 근사하는 것과 다른 선택이다.'},
 {h:'RAFT식 반복 정제와 픽셀 셔플 업샘플',
  lead:'상관 피라미드를 조회해 위치·가시성·신뢰도 잔차를 4번 더하고, 마지막에 전해상도로 올린다.',
  d:'쿼리 특징 맵을 모든 시점에 복사하고 5개 스트라이드 $\\{1,2,4,8,16\\}$ 의 풀링된 특징 피라미드와 내적해 4D 상관을 만든다. 정제 모듈은 반경 4 패치를 L=5 레벨에서 뽑아 위치 변위·가시성·신뢰도와 함께 입력받는다. 이 값에 잔차를 더하는 갱신을 가중치 공유로 4번 반복한다. 마지막에 픽셀 셔플 업샘플링으로 1/8 해상도의 출력을 전해상도로 올린다.'},
 {h:'optical flow 데이터와 점 추적 데이터를 섞어 학습',
  lead:'flow 지도와 희소 점 궤적을 모두 길이가 다른 궤적으로 취급해 한 모델에 같이 학습한다.',
  d:'Kubric으로 20만 스텝 학습한 뒤, FlyingThings3D·Spring·VIPER·KITTI 같은 flow 데이터셋과 Kubric·DynamicReplica·PointOdyssey 같은 점 추적 데이터를 균등 샘플링으로 40만 스텝 더 학습한다. 의사 레이블 부트스트랩을 쓰지 않고 합성 데이터를 늘리는 쪽을 택했다. 논문은 이 혼합 학습과 긴 학습 스케줄이 최고 성능에 결정적이라고 말한다.'}
],

diagram:{type:'flow', cap:'AllTracker의 한 윈도 처리 흐름. 저해상도(1/8) 격자에서 정제한 뒤 전해상도 flow로 올린다.',
 nodes:[
  {t:'특징 추출', s:'ConvNeXt, 1/8 해상도'},
  {t:'상관 피라미드', s:'쿼리 대 전 프레임'},
  {t:'반복 정제 ×4', s:'공간 conv+시간 attn', acc:true, a:'잔차 갱신'},
  {t:'픽셀 업샘플', s:'1/8 → 전해상도'},
  {t:'밀집 궤적', s:'flow·가시성·신뢰도'}
 ]},

math:[
 {expr:'L_track = α Σ_k γ^(K-k) (1_occ/5 + 1_vis) ‖P_k − P̂‖₁',
  tex:'\\mathcal{L}_{\\text{track}}=\\alpha\\sum_{k=1}^{K}\\gamma^{K-k}\\left(\\tfrac{1}{5}\\mathbb{1}_{\\text{occ}}+\\mathbb{1}_{\\text{vis}}\\right)\\left\\lVert P_k-\\hat P\\right\\rVert_1',
  d:'정제 단계 $k$ 마다 L1 손실을 걸고 뒤 단계에 더 큰 가중($\\gamma=0.8$)을 준다. 보이는 점에는 가려진 점의 5배 가중을 준다. 손실이 픽셀 좌표 기준이라 $\\alpha=0.05$ 로 스케일을 맞춘다.'},
 {expr:'x_new = x_old + δx,  x ∈ {v, c, m}',
  tex:'x^{\\text{new}}=x^{\\text{old}}+\\delta x,\\qquad x\\in\\{v,\\,c,\\,m\\}',
  d:'가시성 $v$, 신뢰도 $c$, 위치 변위 $m$ 이 모두 더하기 방식의 잔차로 갱신된다. 가시성과 신뢰도는 확률이 아니라 logit 위에서 더한다. 신뢰도는 위치 추정이 정답의 12픽셀 이내인지를 BCE로 학습한다.'}
],

numbers:[
 {k:'9개 벤치마크 평균 δ_avg · 384×512 (표 1)', v:'AllTracker 66.1 / CoTracker3 65.0', d:'CoTracker3는 Kubric+15k 실영상 의사 레이블 변형. Kubric만 쓴 CoTracker3-Kub는 64.5, LocoTrack 61.5, BootsTAPIR 60.9'},
 {k:'파라미터 수 (표 1)', v:'16.48M (Tiny 6.29M)', d:'CoTracker3 25.39M, DELTA 59.17M, BootsTAPIR 54.70M. Tiny는 Kubric+mix 학습에서 평균 63.3'},
 {k:'고해상도 평균 δ_avg · 768×1024 (표 2)', v:'AllTracker 69.5 / CoTracker3 66.9', d:'448×768에서는 68.3 대 67.5. CoTracker3는 448×768 이후 정체하고 AllTracker는 해상도가 오를수록 오른다. 768×1024에서 Tiny(67.5)도 CoTracker3를 앞선다'},
 {k:'TAP-Vid 4개 데이터셋 평균 AJ (표 3)', v:'68.9 / CoTracker3 63.1', d:'DAVIS, Kinetics, RGB-Stacking, RoboTAP 평균. 같은 4개의 occlusion 정확도 평균은 91.5 대 89.3 (표 4)'},
 {k:'메모리·실시간', v:'768×1024에서 786,432개 트랙을 40G GPU 1장으로', d:'CoTracker3는 같은 해상도에서 OOM이 나서 96G GPU로 평가. 512×512 스트리밍 실행은 57.9 FPS, δ_avg 62.6 (기본 66.1)'},
 {k:'Sintel 광류 EPE · clean / final', v:'1.673 / 3.244', d:'SEA-RAFT 1.309 / 2.601보다 나쁘고 GMFlow 1.736 / 2.902와 비슷하다. 광류 전용 파인튜닝 없이 주 모델 그대로 제출한 값'}
],

impact:'AllTracker는 점 추적과 optical flow를 서로 다른 문제로 나눠 온 구분을 허물었다. 장기 시간 prior를 갖춘 밀집 flow로 풀자 희소 점 추적기가 가졌던 정확도를 유지하면서 전 픽셀 출력이 되었다. 메모리 효율이 좋아 고해상도 입력에서 오히려 성능이 오르는 점도 눈에 띈다. 반면 저자들 스스로 짧은 거리 광류에서는 SEA-RAFT를 못 넘고 underfitting하는 듯하다고 인정해, 모든 광류 모델을 대체하는 것은 아니라고 선을 긋는다.',

legacy:[
 '**[RAFT](#/p/raft)·SEA-RAFT의 저해상도 반복 정제 + 업샘플 구조를 다중 프레임으로 확장** — 한 번에 16프레임을 푼다',
 '**[CoTracker3](#/p/cotracker3)와 정면 비교한 뒤 "희소 점 vs 밀집 flow" 논의의 기준점이 됨** — 의사 레이블 없이 합성 + flow 데이터 혼합으로 더 높은 평균을 냈다',
 '**점 추적 학습에 optical flow 데이터를 정식으로 포함시킨 사례** — 기존 점 추적기는 flow 데이터를 쓰지 않았다고 논문은 지적한다',
 '**[TAPNext](#/p/tapnext) 등 이후 모델과 효율·해상도 측면에서 비교되는 밀집 추적 설계**'
],

pitfalls:[
 '**CoTracker3 비교는 논문이 인정하듯 CoTracker3에 유리한 쪽으로 단순화된 설정이다.** CoTracker3는 원래 질의를 따로 돌리고 지원 점을 더하라고 권하지만, 평가 비용 때문에 모든 질의를 한 번에 넣었다. 저자들은 이 설정이 오히려 CoTracker3의 정확도를 과대평가한다고 밝힌다.',
 '**데이터셋마다 승자가 다르다.** 표 1에서 CoTracker3(+15k)가 CroHD·DAVIS·DriveTrack에서 앞서고, AllTracker는 RGB-Stacking 같은 무텍스처 장면에서 큰 차이로 앞선다. 평균 하나로 모든 도메인의 우위를 말할 수 없다.',
 '**쿼리는 한 기준 프레임에 묶인다.** 모델이 쿼리 프레임 픽셀 전체를 추적하는 구조라서, 서로 다른 시점의 임의 쿼리를 섞어 받는 설정과는 입력 형태가 다르다. 윈도 길이 16 때문에 긴 가림은 한계로 남는다고 논문도 말한다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'맨 위 입력 프레임에서 CNN이 1/8 해상도 특징 맵을 만들고, 쿼리 프레임(0번) 특징을 모든 시점에 복사해(파란 점선) 각 시점마다 상관 볼륨 피라미드를 만든다. 가운데 RNN이 공간 conv와 시간 attention으로 반복 정제하고, 맨 아래가 업샘플된 flow 맵이다.',
  src:'원문 Figure 2, p.3'},
 {f:'fig3-throughput.png',
  cap:'x축은 초당 처리 점 수(로그), y축은 평균 δ_avg다. 오른쪽 위 빨간 점(AllTracker)이 광류 모델(RAFT, SEA-RAFT)과 같은 처리량에 점 추적기 수준 이상의 정확도를 낸다. 마커 모양은 입력 해상도다.',
  src:'원문 Figure 3, p.7'}
],

quotes:[
 {t:'AllTracker makes sparse point trackers (of similar speed and accuracy) redundant, but interestingly it does not make optical flow methods redundant',
  src:'Conclusion, p.8'}
],

links:[
 {t:'arXiv 2506.07310 — AllTracker', u:'https://arxiv.org/abs/2506.07310'},
 {t:'프로젝트 페이지 — alltracker.github.io', u:'https://alltracker.github.io'}
]
});
