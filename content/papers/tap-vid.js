WIKI.paper({
slug:'tap-vid',
venue:'NeurIPS 2022 (Datasets and Benchmarks)',
authors:'Doersch et al. (DeepMind · Oxford VGG)',
arxiv:'2211.03726',

tldr:'"비디오 안의 임의의 물리적 점을 끝까지 따라가라"는 문제를 **TAP(Tracking Any Point)** 로 명명하고, 사람이 주석한 실제 비디오와 합성 비디오로 이뤄진 벤치마크 **TAP-Vid**와 지표(AJ 등), 단순한 기준 모델 TAP-Net을 함께 제시한 논문이다.',

context:'점 추적을 다룬 연구는 있었지만 긴 비디오에서 임의의 표면 점을 평가할 데이터셋이 없었다. 박스·마스크 추적은 표면의 회전과 변형 정보를 잃고, 광학 흐름은 프레임 쌍에만 적용되며 가려짐 추정이 약하다. SfM용 키포인트 매칭은 희소하고 강체 장면을 가정하며, 사람·손 같은 의미 키포인트는 범용이 아니다. 원문은 [PIPs](#/p/pips)를 같은 정신의 동시기 연구로 꼽되, 평가가 BADJA(영상 9개, 표면 점이 아니라 관절 추적)에 거의 의존했다고 지적한다. 학습·평가 데이터의 부재가 병목이었다.',

ideas:[
 {h:'TAP 문제 정의: 질의 점 (x, y, t) → 궤적 + 가림 이진값',
  lead:'질의는 시간 $t$ 의 한 픽셀이고, 출력은 모든 프레임의 위치와 가림 여부다.',
  d:'알고리즘은 비디오와 질의 점 목록 $(x,y,t)$ 를 받아 각 점마다 프레임별 위치 $(x_t,y_t)$ 와 가림 이진값 $o_t$ 를 낸다. 가려진 구간의 위치 출력은 의미 없다고 간주한다. 질의 프레임이 첫 프레임일 필요가 없다는 점이 PIPs와 다르다. 투명체·액체·기체처럼 한 픽셀로 대상이 확정되지 않는 경우는 범위 밖이다.'},
 {h:'광학 흐름으로 보조하는 반자동 주석 파이프라인',
  lead:'주석자가 몇 점만 찍으면 흐름을 따라가는 최적 경로로 사이를 채워 준다.',
  d:'RAFT로 비디오 전체의 흐름을 계산해 두고, 주석자가 시작점과 이후 한 점을 고르면 두 점을 잇되 각 프레임의 흐름과의 제곱 불일치 합이 최소가 되는 경로를 Dijkstra 계열 최단경로로 푼다. 흐름이 드리프트하는 구간은 주석자가 점을 더 찍어 "분할"해 교정한다. 객체 선택, 점 주석, 반복 검수의 3단계이며 10초 비디오 하나에 평균 약 3.3시간이 든다.'},
 {h:'네 개의 평가 데이터셋',
  lead:'실제 영상 2종(Kinetics, DAVIS)과 합성 2종(Kubric, RGB-Stacking)을 한 벤치마크에 담는다.',
  d:'Kinetics는 1,189개 10초 클립(250프레임), DAVIS는 30개 영상이다. Kubric MOVi-E는 학습용 38,325개와 평가용 799개이고, RGB-Stacking은 질감 없는 대칭 물체와 그리퍼 가림이 있는 로봇 환경 50개 에피소드다. 권장 프로토콜은 Kubric으로만 학습하고 나머지 셋은 평가 전용으로 남기며, 검증이 필요하면 DAVIS를 쓰는 것이다.'},
 {h:'위치와 가림을 함께 재는 Average Jaccard',
  lead:'위치 정확도 $<\\delta^x_{avg}$, 가림 정확도 OA, 둘을 합친 AJ 세 지표를 쓴다.',
  d:'프레임을 256×256으로 맞추고 임계값 1, 2, 4, 8, 16 픽셀에서 평가한다. Jaccard는 임계 안에 든 보이는 점(참양성)을 참양성+거짓양성+거짓음성으로 나눈 값이고, AJ는 5개 임계값 평균이다. 위치만 맞고 가림을 틀리거나 그 반대인 경우를 모두 벌점으로 잡는다.'},
 {h:'TAP-Net: 비용 볼륨 + soft argmax의 단순한 기준 모델',
  lead:'질의 특징과 각 프레임 특징맵의 내적(비용 볼륨)에서 위치와 가림을 프레임별로 회귀한다.',
  d:'TSM-ResNet-18로 프레임 특징을 뽑고, 질의 점 특징과 다른 시점 $t^*$ 의 특징맵을 내적해 비용 볼륨을 만든다. 작은 합성곱 네트워크가 위치(공간 softmax 뒤 soft argmax, Huber 손실)와 가림(cross entropy)을 낸다. 원문은 자신들이 아는 한 임의 점 추적용 첫 end-to-end 딥러닝 알고리즘이라고 쓴다.'}
],

diagram:{type:'compare', cap:'TAP-Vid가 정의한 문제와 기존 상관 과제의 차이.',
 left:{t:'기존 대응 과제', items:['박스·마스크: 변형 정보 손실','광학 흐름: 프레임 쌍만','SfM 키포인트: 희소·강체 중심','의미 키포인트: 클래스별 수작업']},
 right:{t:'TAP', items:['질의 점 (x, y, t) 하나','긴 비디오 전체를 추적','프레임별 가림 이진값','임의 표면·변형 물체 허용','실제+합성 벤치마크']}},

math:[
 {expr:'p = Σ 1[‖argmax − (i,j)‖<τ]·S_ij·G_ij / Σ 1[…]·S_ij',
  tex:'p_{qt}=\\frac{\\sum_{ij}\\mathbb{1}\\!\\left[\\lVert(\\hat i,\\hat j)-(i,j)\\rVert_2<\\tau\\right]S_{ij}\\,G_{ij}}{\\sum_{ij}\\mathbb{1}\\!\\left[\\lVert(\\hat i,\\hat j)-(i,j)\\rVert_2<\\tau\\right]S_{ij}}',
  d:'TAP-Net의 위치 추정이다. $S$ 는 공간 softmax 히트맵, $G$ 는 격자 좌표, $(\\hat i,\\hat j)$ 는 argmax 위치다. argmax 주변 반경 $\\tau$(보통 5 격자) 안의 가중 평균을 취한다. 원문은 임계와 argmax가 미분 불가능하지만 기울기는 올바른 방향을 가리킨다고 설명한다.'},
 {expr:'L = Σ_t (1−o_t)·Huber(p̂_t, p_t) + λ·CE(ô_t, o_t)',
  tex:'L=\\sum_t\\Big[(1-o^{gt}_t)\\,L_H(\\hat p_t,p^{gt}_t)+\\lambda\\,\\mathrm{CE}(\\hat o_t,o^{gt}_t)\\Big]',
  d:'위치는 보이는 프레임에서만 Huber 손실로 회귀하고, 가림은 이진 cross entropy로 분류한다. 가끔 생기는 큰 오차를 과하게 벌하지 않으려고 Huber를 쓴다. $\\lambda$ 는 균형 계수다.'}
],

numbers:[
 {k:'TAP-Net · AJ (Kinetics / Kubric / DAVIS / RGB-Stacking)', v:'46.6 / 65.4 / 38.4 / 59.9', d:'Table 3. Kubric 합성 데이터로만 학습한 값'},
 {k:'PIPs · AJ (같은 순서)', v:'35.1 / 59.1 / 42.0 / 37.3', d:'Table 3. DAVIS에서는 TAP-Net(38.4)을 앞선다. 원문은 PIPs가 8프레임 국소 탐색이라 컷·긴 가림에 취약하다고 해석'},
 {k:'RAFT 연쇄 · AJ (Kinetics / DAVIS)', v:'34.5 / 30.0', d:'Table 3. 가림을 따로 처리하지 못하고 오차가 누적된다'},
 {k:'주석 규모', v:'31,951점 / 실제 영상 1,219편 (Kinetics 1,189 + DAVIS 30)', d:'서론 기여 목록. 영상당 평균 점 수는 Kinetics 26.3, DAVIS 21.7(Table 2)'},
 {k:'주석 품질 (Kubric 10편, 정답 대비)', v:'8px 이내 99% 초과 · 4px 96% · 2px 87%', d:'5.2절. 흐름 보조로 주석 시간도 50분에서 36분으로 28% 단축'},
 {k:'사람 간 일치도 (DAVIS, 4px 임계)', v:'가림 95.5% · 위치 92.5%', d:'5.2절. 서로 다른 주석자의 평균 차이는 256×256에서 1.46픽셀'}
],

impact:'TAP-Vid는 점 추적에 공통 문제 정의, 데이터, 지표를 줘서 서로 다른 방법을 같은 표에 올릴 수 있게 했다. 이후 [TAPIR](#/p/tapir), [CoTracker](#/p/cotracker) 등은 모두 이 벤치마크의 AJ와 $<\\delta^x_{avg}$ 로 성능을 보고한다. 또 합성 데이터(Kubric)로만 학습하고 실제 영상으로 평가하는 sim-to-real 프로토콜을 정착시켰다.',

legacy:[
 '**TAPIR**가 TAP-Vid를 기준으로 TAP-Net의 프레임별 초기화와 PIPs식 시간 정제를 결합',
 '**CoTracker**가 TAP-Vid의 Kinetics·DAVIS·RGB-Stacking 점수로 PIPs·TAPIR와 비교',
 '**CoTracker3·TAPNext**도 같은 벤치마크 지표를 그대로 사용',
 '실제 영상 주석이 비싸다는 사실이 이후 의사 라벨링(pseudo-labelling) 연구의 동기가 됨'
],

pitfalls:[
 '**TAP-Vid-Kubric 점수가 실제 영상 성능을 대변하지 않는다.** 원문은 모델이 커질수록 도메인 과적합으로 상관이 약해질 수 있다고 경고하며, 검증에는 DAVIS를 쓰고 나머지는 테스트 전용으로 남기길 권한다.',
 '**AJ는 위치와 가림이 묶인 지표다.** 위치가 좋아도 가림을 틀리면 AJ가 떨어지므로, 위치만 보려면 $<\\delta^x_{avg}$ 를 따로 봐야 한다.',
 '**JHMDB 같은 사람 관절 데이터로 미세조정하면 오히려 해롭다.** Table 4에서 JHMDB로 미세조정한 TAP-Net은 Kinetics AJ가 46.6에서 36.4로 떨어졌고, Kinetics 미세조정은 JHMDB도 소폭 올렸다.'
],

figures:[
 {f:'fig1-tap-problem.png',
  cap:'왼쪽이 입출력 요약이다. 오른쪽에서 이중 원이 질의 점이고, 점선이 예측 궤적이다. 검은 실선 구간은 모델이 "가려짐"이라고 표시한 프레임으로, 위치는 있어도 그 값은 의미가 없다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'This is the first end-to-end deep learning algorithm we are aware of for tracking any point.',
  src:'6.1절, p.10'}
],

links:[
 {t:'arXiv 2211.03726 — TAP-Vid', u:'https://arxiv.org/abs/2211.03726'},
 {t:'GitHub — google-deepmind/tapnet', u:'https://github.com/google-deepmind/tapnet'}
]
});
