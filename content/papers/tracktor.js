WIKI.paper({
slug:'tracktor',
venue:'ICCV 2019',
authors:'Bergmann, Meinhardt, Leal-Taixé (TU Munich)',
arxiv:'1903.05625',

tldr:'추적 전용 모델을 학습하지 않고, 검출기(Faster R-CNN)의 **bounding box regression 헤드**로 이전 프레임의 박스를 현재 프레임으로 옮기는 것만으로 트래킹을 하는 논문. 연결(association) 단계를 검출기 안으로 흡수해, 당시 MOTChallenge 세 벤치마크에서 공개 검출 기준 최고 MOTA를 냈다.',

context:'tracking-by-detection 은 프레임마다 검출을 하고, 검출들을 시간축으로 잇는 연결 문제를 따로 푸는 구조다. 이 연결 단계에는 그래프 최적화, 외형 모델, 재식별(re-ID), 모션 모델이 계속 덧붙었고, 저자들에 따르면 MOT16 에서 MOTA 가 2년간 2.4%p 밖에 오르지 않을 만큼 복잡도 대비 이득이 작았다. [SORT](#/p/sort) 가 칼만 필터와 IOU 매칭으로 연결을 단순화했지만 여전히 "검출 → 별도 연결" 의 2단계 구조였다. 이 논문은 그 구조 자체를 문제 삼는다: 검출기가 이미 박스를 정교하게 보정하는 회귀기를 갖고 있는데, 왜 그것을 시간 방향으로는 쓰지 않는가.',

ideas:[
 {h:'회귀 헤드를 시간 방향으로 재사용',
  lead:'t-1 프레임의 박스를 t 프레임 특징에 RoI pooling 하고 회귀시키면 t 에서의 새 위치가 나온다.',
  d:'[Faster R-CNN](#/p/faster-rcnn) 의 RoI pooling 에 현재 프레임 특징맵과 이전 프레임의 박스 좌표 $b_{t-1}^k$ 를 넣고 회귀 헤드를 통과시키면 $b_t^k$ 가 나온다. 물체가 프레임 사이에 조금만 움직였다는 가정 위에서, ID 는 이전 박스에서 회귀된 박스로 그대로 넘어간다. 별도의 연결 알고리즘이 없으므로 이것이 곧 궤적이 된다.'},
 {h:'Kill 과 Init 두 규칙으로 트랙 관리',
  lead:'분류 점수가 낮거나 NMS 에서 밀리면 트랙을 끄고, 어떤 트랙과도 안 겹치는 검출만 새 트랙으로 시작한다.',
  d:'회귀 뒤 새 박스의 분류 점수 $s_t^k$ 가 $\\sigma_{active}$ 보다 낮으면(화면 밖으로 나갔거나 비물체에 가려짐) 트랙을 죽이고, 남은 박스들끼리 IoU 임계 $\\lambda_{active}$ 로 NMS 를 걸어 물체 간 가림을 처리한다. 반대로 검출 $D_t$ 중 활성 트랙과의 IoU 가 $\\lambda_{new}$ 보다 작은 것만 새 트랙이 된다. 결국 검출기의 분류·회귀·NMS 만으로 생성·삭제·유지가 모두 결정된다.'},
 {h:'추적 데이터로 학습하지 않는다',
  lead:'검출 데이터(MOT17Det)로만 학습한 검출기를 그대로 쓴다. 바닐라 Tracktor 에는 추적 전용 학습이 없다.',
  d:'ResNet-101 + FPN 의 Faster R-CNN 을 보행자 검출 데이터로 학습한 것이 전부다. 따라서 추적 정답(ID 라벨)이 없고 검출 정답만 있는 새 데이터셋에도 곧바로 옮길 수 있고, 검출기가 좋아지면 추적도 그대로 좋아진다. 같은 검출기를 MOT15·16·17 에 전부 적용했다.'},
 {h:'Tracktor++ : reID 와 모션 보정 두 확장',
  lead:'꺼진 트랙을 Siamese 외형 거리로 단기 재식별하고, ECC 정렬로 카메라 움직임을 보정한다.',
  d:'확장은 두 가지다. 첫째, 죽인 트랙을 일정 프레임 동안 보관했다가 새 검출과 Siamese 임베딩 거리(IoU 가 충분한 쌍만)로 다시 잇는다 — 이 reID 망만은 추적 정답으로 학습한다. 둘째, 카메라가 움직이는 영상에는 ECC 최대화로 프레임을 정렬(CMC)하고, 프레임율이 낮은 영상에는 등속 가정(CVA)을 쓴다. 둘을 합친 것이 Tracktor++ 다.'},
 {h:'어려운 경우가 어디인지 분석',
  lead:'전용 추적기들도 작은 물체·심한 가림에서는 Tracktor 보다 낫지 않다는 것을 가시성별로 보인다.',
  d:'물체 가시성(visibility)별 추적 비율을 비교하면(Fig. 2) 복잡한 추적기들도 가려진 물체에서 Tracktor 를 뚜렷하게 넘지 못한다. 저자들은 정답을 일부 주입하는 oracle 트래커(Table 4)로 개선 여지를 따져, 모션 모델과 reID 가 가장 큰 상한을 가진다고 정리한다.'}
],

diagram:{type:'flow', cap:'프레임 t 의 처리. 연결 단계가 따로 없고, 검출기의 회귀·분류 헤드가 트랙 유지와 종료를 모두 맡는다.',
 nodes:[
  {t:'이전 트랙 박스', s:'b(t-1)', a:'RoI pooling'},
  {t:'박스 회귀', s:'현재 프레임 특징', acc:true, a:'b(t)'},
  {t:'Kill 판정', s:'분류 점수 · NMS'},
  {t:'새 트랙 초기화', s:'IoU < λ_new 인 검출'}
 ]},

math:[
 {expr:'kill if s_t^k < σ_active  or  NMS(B_t, λ_active) removes b_t^k',
  tex:'\\text{kill } b_t^k \;\\text{if}\; s_t^k < \\sigma_{active} \;\\text{ or removed by NMS}(B_t,\\lambda_{active})',
  d:'회귀로 얻은 박스의 분류 점수가 임계 아래이거나, 겹친 박스 중 점수가 밀리면 트랙을 끈다. 시간 방향 연결에 쓰이는 규칙은 이 두 줄이 전부다.'},
 {expr:'new track if IoU(d, b_t^k) < λ_new for all active k',
  tex:'d \\in D_t \;\\Rightarrow\; \\text{new track} \;\\text{if}\; \\mathrm{IoU}(d,\\,b_t^k) < \\lambda_{new}\;\;\\forall k',
  d:'기존 트랙들이 설명하지 못하는 검출만 새 물체로 본다. 공개 검출(public detection)을 쓰는 실험에서는 이 검출 집합 $D_t$ 가 벤치마크가 준 박스다.'}
],

numbers:[
 {k:'MOT17 테스트 (Tracktor++)', v:'MOTA 53.5 / IDF1 52.3', d:'Table 2, 공개 검출 기준. 비교 행 eHAF 51.8, FWT 51.3, jCC 51.2'},
 {k:'MOT16 테스트 (Tracktor++)', v:'MOTA 54.4', d:'Table 2. 같은 모델로 2D MOT 2015 에서도 MOTA 44.1'},
 {k:'확장 효과 (MOT17 학습셋)', v:'ID Sw 1747 → 326', d:'Table 1, Faster R-CNN 공개 검출. Tracktor 에서 reID+CMC 를 붙이면 IDF1 61.1 → 64.7, MOTA 61.5 → 61.9'},
 {k:'Oracle-ALL 상한', v:'MOTA 72.2', d:'Table 4. 킬·회귀·reID 에 정답을 쓴 상한으로, 바닐라 Tracktor 대비 +10.7'},
 {k:'검출기', v:'Faster R-CNN + ResNet-101 + FPN', d:'MOT17Det 보행자 검출로만 학습, 추적 학습 없음(§2.1)'}
],

impact:'"검출기가 곧 트래커"라는 관점을 제시해, 연결을 별도 모듈로 두던 설계를 의심하게 만들었다. 트랙마다 이전 박스를 다음 프레임 질의로 넘기는 구조는 이후 [TrackFormer](#/p/trackformer) 가 [DETR](#/p/detr) 의 object query 로 일반화하는 출발점이 됐다. 동시에 한계도 분명했다: 박스가 크게 안 움직여야 회귀가 성립하므로 낮은 프레임율과 큰 카메라 움직임에는 별도 보정이 필요했고, [CenterTrack](#/p/centertrack) 은 이 가정을 점 기반 오프셋으로 풀었다.',

legacy:[
 '**[TrackFormer](#/p/trackformer)** — 트랙을 object query 로 이어 붙여, 회귀 기반 전파를 Transformer 디코더 안으로 옮김',
 '**[CenterTrack](#/p/centertrack)** — Tracktor 의 박스 겹침 가정을 지적하고, 이전 프레임 히트맵과 중심 오프셋으로 대체',
 '**비교 기준선** — CenterTrack 의 MOT17 표(Table 1)는 Tracktor17·Tracktor v2 를 공개 검출 기준 직전 비교 대상으로 놓는다',
 '**검출-추적 일체화 흐름** — 검출기 하나로 검출과 연결을 함께 푸는 설계(joint detection and tracking)의 한 갈래로 이후 논문들에 인용됨'
],

pitfalls:[
 '**"추적 학습이 없다"는 바닐라 Tracktor 에만 해당한다.** Tracktor++ 의 reID Siamese 망은 추적 정답으로 학습한다(§2.3). 벤치마크 최고 수치(53.5 등)는 Tracktor++ 값이다.',
 '**공개 검출 규칙에 얽혀 있다.** 새 트랙은 공개 검출 박스에서만 시작하지만, 그 박스를 회귀·재점수화한다(§3). 따라서 검출기를 직접 쓰는 private 방식의 수치와 비교할 때는 프로토콜을 먼저 확인해야 한다.',
 '**프레임 간 이동이 작다는 가정이 필수다.** 저프레임율이나 카메라 급이동에서는 이전 박스 안에 물체가 없을 수 있어 CMC·CVA 같은 모션 보정이 필요하다. 가림이 긴 경우도 회귀만으로는 해결되지 않는다.'
],

figures:[
 {f:'fig1-pipeline.png',
  cap:'파란 화살표(위)가 이전 박스를 회귀시켜 현재 위치와 분류 점수를 얻고 Kill 을 판정하는 경로, 빨간 화살표(아래)가 검출 집합에서 기존 트랙과 겹치지 않는 박스를 새 트랙으로 시작하는 경로다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'In this paper, we push tracking-by-detection to the limit by using only an object detection method to perform tracking.',
  src:'Section 1, p.1'}
],

links:[
 {t:'arXiv 1903.05625 — Tracking without bells and whistles', u:'https://arxiv.org/abs/1903.05625'},
 {t:'공식 코드 (phil-bergmann/tracking_wo_bnw)', u:'https://github.com/phil-bergmann/tracking_wo_bnw'}
]
});
