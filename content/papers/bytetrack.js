WIKI.paper({
slug:'bytetrack',
venue:'ECCV 2022 (arXiv 2021)',
authors:'Zhang et al. (HUST · HKU · ByteDance)',
arxiv:'2110.06864',

tldr:'검출기가 낮은 confidence로 뱉은 상자를 버리지 않고 2단계로 매칭해 쓰는 **BYTE** 연관 알고리즘. 검출기를 다시 학습하지도, Re-ID 외형 모델을 새로 붙이지도 않고 MOT17에서 트래킹 SOTA를 큰 폭으로 끌어올렸다.',

context:'Tracking-by-detection 방식의 MOT는 프레임마다 검출기가 뱉은 상자를 이전 트랙과 연관(association)시키는 구조다. [SORT](#/p/deepsort)류와 [DeepSORT](#/p/deepsort)는 칼만 필터로 예측한 위치와 IoU, 또는 Re-ID 외형 특징으로 이 연관을 푼다. 문제는 그 앞 단계다 — 거의 모든 트래커가 검출 상자를 confidence score 임계값(보통 0.5)으로 한 번 걸러 **높은 점수 상자만** 연관에 쓴다. 가려진(occluded) 객체나 모션 블러가 낀 객체는 검출기가 애초에 낮은 점수로만 검출하는 경우가 많아서, 이 필터링 단계에서 실존하는 객체가 통째로 사라지고 트랙이 끊긴다. 기존 연구는 이 병목을 검출기 성능 개선이나 더 정교한 외형 모델로 우회하려 했다.',

ideas:[
 {h:'BYTE: 낮은 점수 상자를 버리지 않고 2단계 매칭',
  lead:'높은 점수 상자로 먼저 매칭하고, 매칭 안 된 트랙만 낮은 점수 상자와 다시 매칭한다.',
  d:'검출 상자를 점수 임계값 $\\tau$ 로 $D_{high}$ 와 $D_{low}$ 로 나눈다. 1단계: $D_{high}$ 를 모든 트랙(칼만 필터로 예측한 위치)과 헝가리안 알고리즘으로 매칭한다. 2단계: 1단계에서 매칭되지 못한 트랙만 골라 $D_{low}$ 와 다시 매칭한다. 배경이나 노이즈로 생긴 낮은 점수 상자는 애초에 매칭될 트랙이 남아있지 않아 자연히 걸러지고, 가려졌던 진짜 객체는 예측 위치와 IoU가 커서 복원된다.'},
 {h:'2단계 매칭에는 IoU만 쓴다',
  lead:'낮은 점수 상자는 외형 특징이 신뢰할 수 없어 2단계는 IoU 유사도만 쓴다.',
  d:'1단계 유사도(Similarity#1)는 IoU 또는 Re-ID 거리 어느 쪽이든 쓸 수 있지만, 2단계 유사도(Similarity#2)는 IoU만 쓴다. 낮은 점수 상자는 대개 심한 가려짐이나 블러 상태라 그 영역에서 뽑은 외형 특징 자체가 신뢰도가 낮기 때문이다. 이 선택 하나로 MOTA가 약 1.0 오른다고 저자들은 ablation에서 보인다.'},
 {h:'검출기와 무관한 플러그인',
  lead:'BYTE는 기존 트래커의 연관 단계만 바꿔 끼우는 모듈이라 어디에나 붙는다.',
  d:'BYTE는 특정 검출기·특정 유사도 계산법에 묶여 있지 않다. Re-ID 기반([FairMOT](#/p/deepsort) 계열), 모션 기반(CenterTrack), 체인 기반(Chained-Tracker), attention 기반(TransTrack) 등 9종의 서로 다른 트래커에 그대로 끼워 넣었더니 IDF1이 1~10점 올랐다. 검출기를 재학습하거나 새 외형 모델을 추가하지 않고, **버려지던 정보를 재활용**한 것만으로 이 정도 개선이 나왔다는 점이 이 논문의 핵심 주장이다.'},
 {h:'ByteTrack: YOLOX + BYTE',
  lead:'고성능 검출기 YOLOX에 BYTE를 붙여 만든 완성형 트래커.',
  d:'BYTE 알고리즘 자체를 보여주는 것과 별개로, 저자들은 [YOLO](#/p/yolo) 계열의 최신 검출기 YOLOX-X를 얹고 칼만 필터 기반 모션 매칭만 사용하는 단순한 트래커 ByteTrack을 만들었다. 외형 모델도, 복잡한 attention도 없이 IoU와 칼만 필터, BYTE만으로 MOT17·MOT20 리더보드 1위를 달성했다.'}
],

diagram:{type:'flow', cap:'BYTE의 프레임당 처리 흐름. 2단계 매칭에서 매칭 안 된 낮은 점수 상자는 배경으로 간주해 버린다.',
 nodes:[
  {t:'검출 상자', s:'점수로 분리'},
  {t:'높은 점수', s:'Dhigh, >τ'},
  {t:'1차 매칭', s:'트랙 전체와', acc:true, a:'IoU/ReID'},
  {t:'낮은 점수 재매칭', s:'미매칭 트랙만', acc:true, a:'IoU만'},
  {t:'트랙 갱신', s:'생성/유지/삭제'}
 ]},

math:[
 {expr:'d.score > τ  →  Dhigh,  아니면 Dlow',
  tex:'d.\\text{score} > \\tau \\;\\Rightarrow\\; d \\in D_{high},\\quad \\text{else}\\; d \\in D_{low}',
  d:'검출 상자를 점수 임계값 $\\tau$ 하나로 이등분하는 규칙. 기본값 $\\tau=0.6$. 이 임계값 자체가 BYTE의 유일한 핵심 하이퍼파라미터다.'},
 {expr:'IoU(예측 박스, 검출 박스) < 0.2 → 매칭 거부',
  tex:'\\text{IoU}(\\hat b_{track}, b_{det}) < 0.2 \\;\\Rightarrow\\; \\text{reject match}',
  d:'헝가리안 매칭에서 IoU가 0.2 미만이면 아무리 비용이 낮아도 매칭을 거부한다. 낮은 점수 상자를 배경과 구분하는 최소 안전장치.'}
],

numbers:[
 {k:'MOT17 test · MOTA/IDF1/HOTA', v:'80.3 / 77.3 / 63.1', d:'private detection 프로토콜, V100에서 30 FPS. 2위 ReMOT 대비 큰 폭 우위'},
 {k:'MOT20 test · MOTA/IDF1/HOTA', v:'77.8 / 75.2 / 61.3', d:'MOT17보다 혼잡한 데이터셋(장당 평균 170명). 2위 SOTMOT 대비 MOTA +9.2'},
 {k:'BYTE 단독 효과 (MOT17 val, SORT 대비)', v:'MOTA 74.6→76.6, IDF1 76.9→79.3, IDs 291→159', d:'검출기·다른 부품 안 바꾸고 연관 단계에 BYTE만 추가한 효과'},
 {k:'9개 트래커에 적용 시 IDF1 개선폭', v:'+1 ~ +10점', d:'Re-ID·모션·체인·attention 기반 트래커 전부 개선. CenterTrack은 IDF1 64.2→74.0, IDs 528→144'},
 {k:'YOLOX-Nano 경량 검출기에서 DeepSORT 대비', v:'MOTA +3점', d:'검출기가 약해도 BYTE의 이득이 유지됨을 보여주는 근거'},
 {k:'2단계 유사도를 IoU로 고정한 효과', v:'MOTA 약 +1.0', d:'외형 특징 대신 IoU만 쓸 때의 ablation 결과 (낮은 점수 상자의 외형 특징이 불안정하기 때문)'}
],

impact:'검출기 성능과 연관 알고리즘을 각각 개선하던 두 갈래 연구 흐름 사이에서, ByteTrack은 **"검출기가 이미 뱉었지만 버려지던 낮은 점수 상자"** 라는 제3의 자원을 찾아냈다. 재학습도, 추가 모델도 없이 트래킹 파이프라인의 연관 단계 로직만 바꿔서 MOT17·MOT20·HiEve·BDD100K 네 벤치마크에서 동시에 SOTA를 갈아치웠다. 구현이 단순해서(IoU + 칼만 필터 + 2단계 매칭) 이후 대부분의 실시간 MOT 시스템에 기본값처럼 채택됐다.',

legacy:[
 '**BYTE는 알고리즘, ByteTrack은 그 위에 얹은 완성 트래커** — 이 구분 덕분에 이후 연구들은 자기 트래커에 BYTE만 이식하는 식으로 널리 채택',
 '**저비용 개선의 재발견** — "버려지는 정보를 재활용한다"는 프레임이 이후 검출·추적 경계 영역 연구에 참고 사례로 자주 인용됨',
 '**OC-SORT·StrongSORT 등 후속 SORT 계열이 BYTE의 2단계 매칭을 표준 구성요소로 흡수**',
 '**실시간 산업 응용의 기본 스택** — YOLOX/YOLO 계열 검출기 + BYTE 조합이 CCTV·자율주행 등 실시간 MOT 파이프라인의 사실상 표준 조합으로 자리잡음'
],

pitfalls:[
 '**검출기 자체가 객체를 아예 못 찾으면 BYTE도 소용없다.** BYTE는 "검출은 됐지만 점수가 낮아 버려지는" 상자를 구하는 방법이지, 검출 자체가 실패한(recall이 낮은) 경우를 구하지 못한다.',
 '**저조도·저해상도처럼 검출기 품질이 근본적으로 나쁜 상황에서는 낮은 점수 상자에 노이즈가 더 많이 섞여, 2단계 매칭의 이득이 줄거나 오탐(false positive)이 늘 수 있다.** 그래서 2단계 유사도는 IoU만 쓰도록 보수적으로 설계됐다.',
 '**임계값 $\\tau=0.6$ 은 데이터셋·검출기마다 재조정이 필요한 하이퍼파라미터다.** 논문은 이 값에 대한 민감도 실험을 별도로 보여주지만, 다른 도메인에 그대로 가져다 쓰면 최적이 아닐 수 있다.'
],

figures:[
 {f:'fig2-byte-example.png',
  cap:'(a) 세 프레임의 검출 상자와 점수. 가려지면서 빨간 트랙의 점수가 0.9→0.4→0.1로 떨어진다. (b) 기존 방식(점수 0.5 임계값)은 빨간 트랙이 끊긴다. (c) BYTE는 칼만 필터 예측 위치(점선 상자)와의 IoU로 낮은 점수 상자를 다시 매칭해 빨간 트랙을 복원하고, 우측의 배경 오탐 상자는 매칭 안 돼 자연히 제거된다.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'Low confidence detection boxes sometimes indicate the existence of objects, e.g. the occluded objects. Filtering out these objects causes irreversible errors for MOT and brings non-negligible missing detection and fragmented trajectories.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 2110.06864 — ByteTrack', u:'https://arxiv.org/abs/2110.06864'},
 {t:'GitHub — ifzhang/ByteTrack', u:'https://github.com/ifzhang/ByteTrack'}
]
});
