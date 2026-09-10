WIKI.paper({
slug:'sort',
venue:'ICIP 2016 (arXiv)',
authors:'Bewley, Ge, Ott, Ramos, Upcroft (QUT · U. Sydney)',
arxiv:'1602.00763',

tldr:'외형(appearance) 정보 없이 **칼만 필터 + 헝가리안 알고리즘**만으로 다중 객체 추적을 푼 논문. 추적 품질의 대부분이 사실 검출기 품질에서 온다는 것을 보이며, 260Hz라는 압도적 속도로 정확도-속도 트레이드오프를 깼다.',

context:'2016년 이전의 multi-object tracking(MOT)은 [MHT](https://en.wikipedia.org/wiki/Multiple_hypothesis_tracking)나 JPDA처럼 여러 프레임의 후보를 쌓아두고 나중에 애매한 결정을 내리는 배치(batch) 방식이 주류였다. 여기에 외형 모델, 재식별(re-ID), occlusion 처리 같은 부품이 계속 붙으면서 시스템이 무거워졌고, 실시간 로봇·자율주행 응용에는 너무 느렸다. 저자들은 당시 MOT 벤치마크 결과를 보고 이상한 점을 발견했다 — **최상위권 트래커들이 대부분 같은 약한 검출기(ACF)를 쓰고 있었고**, 유일하게 다른 검출기를 쓴 트래커가 가장 높은 순위였다. 즉 추적 알고리즘 자체보다 검출 품질이 성능을 좌우하고 있을 가능성이 컸다. 이 논문은 그 가설을 검증하기 위해, 추적 로직을 일부러 극단적으로 단순하게 만들고 검출기만 좋은 것으로 바꿔본다.',

ideas:[
 {h:'검출기 교체가 곧 추적 성능이다',
  lead:'ACF를 [Faster R-CNN](#/p/faster-rcnn)으로 바꾸는 것만으로 MOTA가 최대 18.9%p 올랐다.',
  d:'같은 추적 로직을 ACF 검출과 FrRCNN(VGG16) 검출에 각각 붙여 비교했다(Table 1). MDP 트래커도 SORT도 검출기를 바꾸는 순간 MOTA가 크게 뛰었다 — SORT 기준 15.1 → 34.0. 트래킹 알고리즘을 정교하게 만드는 것보다 [Faster R-CNN](#/p/faster-rcnn) 같은 좋은 검출기를 쓰는 것이 훨씬 값싸게 성능을 올리는 길이라는 실증이다.'},
 {h:'등속도 칼만 필터로 위치만 예측한다',
  lead:'외형은 무시하고 bbox의 중심·크기·종횡비만 상태로 삼아 칼만 필터로 propagate한다.',
  d:'각 타겟의 상태를 중심 좌표 $(u,v)$, 넓이 $s$, 종횡비 $r$과 그 속도로 표현하고, 프레임 간 등속도(linear constant velocity) 모델로 다음 프레임 위치를 예측한다. 종횡비는 상수로 취급한다. 검출이 붙으면 칼만 필터로 상태를 보정하고, 붙지 않으면 예측값을 그대로 쓴다. 외형·움직임 방향·카메라 모션 같은 부가 정보는 전부 뺐다.'},
 {h:'IOU만으로 매칭 비용을 만든다',
  lead:'예측 bbox와 검출 bbox 사이 IOU 거리로 비용 행렬을 만들고 헝가리안으로 최적 매칭한다.',
  d:'각 타겟의 예측 위치와 현재 프레임 검출들 사이 IOU를 계산해 비용 행렬을 만들고, 헝가리안 알고리즘으로 전역 최적 1:1 매칭을 구한다. $IOU_{min}$ 미만인 매칭은 거부한다. 저자들은 IOU 기반 매칭이 부수적으로 **단기 가림(occlusion)을 암묵적으로 처리**한다고 관찰했다 — 가려진 타겟 위에 가리는 물체만 검출되면 크기가 비슷한 가리는 물체 쪽으로 매칭되고, 가려진 타겟은 매칭 없이 예측만으로 유지되기 때문이다.'},
 {h:'트랙 생성·삭제도 최소한으로',
  lead:'미매칭 검출은 새 트랙, `T_lost=1`프레임만 놓치면 즉시 트랙을 삭제한다.',
  d:'기존 어떤 트랙과도 $IOU_{min}$ 이상 겹치지 않는 검출은 새 타겟으로 간주해 속도 0으로 초기화하고, 속도의 불확실성이 크므로 공분산을 크게 잡는다. 반대로 `T_lost` 프레임 이상 검출이 붙지 않으면 트랙을 바로 삭제한다. 논문은 `T_lost=1`을 썼는데, 이는 등속도 모델이 오래 예측을 유지하기엔 부정확하고 재식별은 이 논문의 범위 밖이라는 설계 판단 때문이다.'},
 {h:'속도-정확도 트레이드오프를 깼다',
  lead:'복잡한 트래커들이 느려질 때 SORT는 단순함 그 자체로 정확도와 속도를 동시에 잡았다.',
  d:'Fig. 1이 보여주듯 당시 MOT 벤치마크의 트래커들은 "정확하면 느리고, 빠르면 부정확한" 경향이 뚜렷했다. SORT는 온라인 트래커 중 최고 MOTA를 내면서도 **초당 260회** 갱신되어, 정확도와 속도 두 축 모두에서 우상단에 위치한 유일한 방법이었다.'}
],

diagram:{type:'flow', cap:'프레임마다 반복되는 SORT 파이프라인. 외형 정보는 어디에도 없다 — bbox 기하학만 흐른다.',
 nodes:[
  {t:'검출', s:'FrRCNN bbox', a:'매 프레임'},
  {t:'칼만 예측', s:'등속도 모델', acc:true, a:'다음 위치'},
  {t:'IOU 비용행렬', s:'예측 × 검출'},
  {t:'헝가리안 매칭', s:'전역 최적 1:1'},
  {t:'상태 갱신/생성/삭제', s:'T_lost=1'}
 ]},

math:[
 {expr:'x = [u, v, s, r, u̇, v̇, ṡ]ᵀ',
  tex:'\\mathbf{x} = [u,\\,v,\\,s,\\,r,\\,\\dot{u},\\,\\dot{v},\\,\\dot{s}]^{T}',
  d:'타겟 상태 벡터. $(u,v)$는 bbox 중심, $s$는 넓이(scale), $r$은 종횡비(상수로 취급, 속도 없음). 검출이 붙으면 칼만 필터가 $\\dot u,\\dot v,\\dot s$를 최적으로 추정한다.'},
 {expr:'cost(i,j) = 1 - IOU(predicted_i, detection_j)',
  tex:'\\text{cost}(i,j) = 1 - \\text{IOU}(\\hat{b}_i,\\, d_j)',
  d:'예측 bbox $\\hat b_i$와 검출 bbox $d_j$ 사이 IOU를 거리로 바꿔 비용 행렬을 만들고, 헝가리안 알고리즘으로 총 비용을 최소화하는 매칭을 구한다. $IOU_{min}$ 미만인 칸은 매칭 후보에서 제외한다.'}
],

numbers:[
 {k:'MOTA (MOT benchmark)', v:'33.4', d:'2015 MOT 벤치마크에서 온라인 트래커 중 최고. **MOTA**는 FP+FN+ID switch를 합쳐 100%에서 뺀 종합 정확도 지표'},
 {k:'검출기 교체 효과', v:'MOTA +18.9%p', d:'같은 추적 로직에서 ACF(15.1) → FrRCNN VGG16(34.0)로 검출기만 바꿨을 때(Table 1)'},
 {k:'속도', v:'260 Hz', d:'Intel i7 2.5GHz 단일 코어, 최고 정확도 트래커 대비 **20배 이상** 빠름'},
 {k:'ID switch', v:'1001', d:'MOT benchmark Table 2 — NOMT(442)·MDP(680) 등 경쟁 트래커보다 뚜렷이 많음, 외형 정보 부재의 대가'},
 {k:'ML (mostly lost)', v:'30.9%', d:'생애의 80% 이상을 놓친 트랙 비율 — 프레임 간 연결에 집중한 덕에 경쟁 트래커 중 최저'},
 {k:'MOTP', v:'72.1', d:'매칭된 박스들의 평균 겹침 정확도(위치 정밀도)'}
],

impact:'검출과 추적을 분리해서 생각하게 만든 실증 논문이다. 이후 연구자들은 "더 똑똑한 트래킹 로직"보다 **더 좋은 검출기**에 투자하는 것이 비용 대비 효과가 크다는 것을 당연하게 받아들이게 됐다. 동시에 SORT의 약점 — 외형을 안 쓰기 때문에 가려짐이 조금만 길어져도 ID가 끊긴다는 것 — 이 명확한 다음 과제로 남았다. 코드가 공개되고 구조가 워낙 단순해서, 이후 수많은 tracking-by-detection 시스템의 **기본 베이스라인**이자 골격이 됐다.',

legacy:[
 '**[DeepSORT](#/p/deepsort)** — SORT의 IOU 매칭에 외형 임베딩(CNN re-ID feature)을 추가해 ID switch 문제를 직접 겨냥',
 '**[ByteTrack](#/p/bytetrack)** — 낮은 신뢰도 검출까지 버리지 않고 매칭에 활용해 SORT 계열의 프레임 연결 안정성을 더 끌어올림',
 '**tracking-by-detection 표준화** — "검출은 검출기에, 연결은 칼만+헝가리안에" 라는 역할 분리가 이후 대부분의 온라인 MOT 시스템의 기본 골격이 됨',
 '**실시간 응용 확산** — 260Hz라는 속도 덕분에 자율주행·로보틱스처럼 지연에 민감한 분야에서 참조 구현으로 널리 쓰임'
],

pitfalls:[
 '**외형 정보가 없어 ID switch가 잦다.** 가려짐(occlusion)이 조금만 길어지거나 두 타겟이 교차하면 매칭이 끊기고, 재등장한 객체는 새 ID를 받는다(`T_lost=1`이라 더 심함). 이 논문 스스로도 ID switch(1001)가 경쟁 트래커보다 많다는 것을 표로 그대로 보여준다.',
 '**"단순해서 느슨하다"와 혼동하면 안 된다.** SORT는 검출 품질이 나쁘면(예: ACF) 성능이 함께 무너진다 — 추적 로직이 검출 오류를 보정해주지 않는다. 이 트레이드오프를 명시적으로 받아들인 설계다.',
 '**MOTA 수치는 벤치마크·검출기 조합에 종속적이다.** Table 1과 Table 2의 MOTA는 서로 다른 조건(검증셋 vs 테스트서버, 표기 방식)에서 나온 값이라 같은 표 안에서만 비교해야 한다.'
],

figures:[
 {f:'fig1-accuracy-vs-speed.png',
  cap:'x축이 MOTA(정확도), y축이 로그 스케일 속도(Hz). 대부분의 트래커가 "정확하면 느리고 빠르면 부정확한" 대각선 아래쪽에 몰려 있는데, SORT(짙은 남색 다이아몬드, Proposed)만 정확도 최상위권이면서 속도도 압도적으로 높은 우상단에 위치한다. 점선은 실시간(realtime) 기준선.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'This paper explores a pragmatic approach to multiple object tracking where the main focus is to associate objects efficiently for online and realtime applications.',
  src:'Abstract, p.1'},
 {t:"Keeping in line with Occam's Razor, appearance features beyond the detection component are ignored in tracking and only the bounding box position and size are used for both motion estimation and data association.",
  src:'Section 1, p.1'}
],

links:[
 {t:'arXiv 1602.00763 — Simple Online and Realtime Tracking', u:'https://arxiv.org/abs/1602.00763'},
 {t:'공식 코드 (abewley/sort)', u:'https://github.com/abewley/sort'}
]
});
