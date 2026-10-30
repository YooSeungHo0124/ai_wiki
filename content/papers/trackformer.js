WIKI.paper({
slug:'trackformer',
venue:'CVPR 2022 (arXiv 2021)',
authors:'Meinhardt et al. (TUM · Meta AI FAIR)',
arxiv:'2101.02702',

tldr:'MOT를 프레임 사이의 집합 예측 문제로 바꾸고, 객체 하나를 따라가는 **autoregressive track query**를 DETR decoder에 넣어 검출과 데이터 연관을 attention 한 번으로 처리한 end-to-end 트래커. 저자들은 이를 tracking-by-attention이라 부른다.',

context:'MOT의 주류는 프레임마다 검출한 뒤 연관을 따로 푸는 tracking-by-detection이었다. [Tracktor](#/p/tracktor)와 [CenterTrack](#/p/centertrack) 같은 tracking-by-regression은 검출기가 이전 위치를 새 위치로 회귀해 연관 단계를 없앴다. 그러나 이 방식은 각 상자를 따로 회귀하기 때문에 객체 정체성이나 트랙 사이의 전역 소통이 없다. 그래서 최고 성능을 내려면 그래프 최적화나 모션·외형 모델을 덧붙여야 했다. 한편 [DETR](#/p/detr)는 object query와 이분 매칭으로 검출을 집합 예측으로 풀었고, 저자들은 이 틀을 시간 축으로 확장했다.',

ideas:[
 {h:'Track query: 정체성을 나르는 decoder query',
  lead:'검출된 객체의 decoder 출력 embedding을 다음 프레임의 query로 넘겨 ID를 유지한다.',
  d:'프레임 $t-1$ 에서 유효하게 검출된 객체마다 그 출력 embedding이 track query가 된다. 프레임 $t$ 에서 이 query는 같은 identity를 달고 새 위치를 attention으로 찾아간다. 별도의 매칭 알고리즘이 없고 query의 순서가 곧 ID이다. 이 점이 위치를 회귀하는 tracking-by-regression과의 차이다.'},
 {h:'Object query와 track query를 한 decoder에서 함께 처리',
  lead:'새 객체는 고정 object query가, 기존 객체는 track query가 맡고 self-attention이 중복을 막는다.',
  d:'decoder 입력은 $N_{object}+N_{track}$ 개 query의 합집합이다. 새 객체는 object query가 검출해 다음 프레임부터 track query가 된다. self-attention이 이미 추적 중인 객체를 다시 검출하는 일을 줄이지만, 강하게 겹친 중복은 해결하지 못해 IoU 임계값이 높은 NMS를 추가로 쓴다.'},
 {h:'두 프레임 학습과 track augmentation',
  lead:'인접 두 프레임으로 학습하되 프레임 간격·누락·가짜 트랙을 섞어 추적 상황을 풍부하게 만든다.',
  d:'손실은 두 단계로 계산한다. 프레임 $t-1$ 에서 object query로 검출하고, 그 결과를 track query로 삼아 프레임 $t$ 에서 전체 query를 디코딩한다. 같은 ID는 track query가 그대로 정답에 대응하고, 새 객체만 이분 매칭으로 맞춘다. 프레임 범위 샘플링(카메라 움직임·낮은 프레임레이트 모사)과 false positive 삽입이 특히 중요하다.'},
 {h:'attention 기반 단기 재식별',
  lead:'사라진 track query를 일정 프레임 동안 계속 디코딩해 점수가 오르면 같은 ID로 복귀시킨다.',
  d:'제거된 track query를 최대 $T_{track\\text{-}reid}$ 프레임 동안 비활성 상태로 계속 디코딩하다가 분류 점수가 임계값을 넘으면 되살린다. 별도의 Re-ID 학습이 필요 없다. 다만 query에 공간 정보가 들어 있어 큰 이동을 동반한 장기 가림에는 쓸 수 없다고 저자들이 명시한다.'}
],

diagram:{type:'flow', cap:'프레임마다 decoder가 query 전체를 처리하고, 객체로 판정된 출력 embedding이 다음 프레임의 track query가 된다.',
 nodes:[
  {t:'프레임 t', s:'CNN + 인코더'},
  {t:'디코더', s:'object + track query', acc:true, a:'박스·클래스'},
  {t:'MLP 헤드', s:'박스, 클래스'},
  {t:'트랙 갱신', s:'점수·NMS로 제거'},
  {t:'다음 프레임', s:'track query로 전달'}
 ]},

math:[
 {tex:'\\mathcal{L}_{query}=\\begin{cases}-\\lambda_{cls}\\log\\hat p_i(c_{\\pi=i})+\\mathcal{L}_{box}(b_{\\pi=i},\\hat b_i) & i\\in\\pi\\\\ -\\lambda_{cls}\\log\\hat p_i(0) & i\\notin\\pi\\end{cases}',
  expr:'Lquery = -λcls·log p(c) + Lbox  (i∈π), -λcls·log p(배경)  (i∉π)',
  d:'매칭된 query는 분류와 박스 손실을, 매칭되지 않은 query는 배경 클래스 손실을 받는다. 매칭 $\\pi$ 는 전 프레임과 같은 ID이면 ID로, 새로 등장한 객체만 이분 매칭으로 정한다.'}
],

numbers:[
 {k:'MOT17 test (private) · MOTA / IDF1 / IDs', v:'74.1 / 68.0 / 2829', d:'CrowdHuman 사전학습 모델. FPS 7.4(저자 측정)'},
 {k:'MOT17 test (public) · MOTA / IDF1 / IDs', v:'62.3 / 57.6 / 4018', d:'public detection은 IoU 조건으로 트랙 시작을 걸러 비교. 같은 표의 CenterTrack과 같은 방식'},
 {k:'MOT17 train 50-50 분할 ablation · MOTA / IDF1', v:'71.3 / 73.4', d:'전체 구성. track query까지 제거하고 중심 거리 greedy 매칭만 쓰면 61.0 / 45.1 (Table 3)'},
 {k:'프레임 범위 augmentation 제거', v:'MOTA -4.4, IDF1 -10.8', d:'Table 3에서 가장 큰 단일 하락. 두 프레임 학습만으로는 부족하다는 근거'},
 {k:'MOTS20 test · sMOTSA', v:'54.9 (Track R-CNN 40.6)', d:'mask head를 붙여 분할까지 확장. 같은 표에서 IDF1 63.6 (Track R-CNN 42.4)'}
],

impact:'TrackFormer는 tracking-by-regression이 부족했던 "정체성과 전역 추론"을 query와 attention으로 채운 첫 사례 중 하나다. 저자들도 자신들이 Transformer를 MOT에 처음 적용했다고 쓴다. 검출·연관·재식별을 하나의 attention 메커니즘으로 설명했고, mask head를 붙여 MOTS20까지 같은 틀로 다뤘다. 다만 두 프레임 학습과 NMS 후처리가 남아 있어 장기 시간 모델링은 후속 연구의 몫이 됐다.',

legacy:[
 '**query 전파 계열의 공통 조상** — [MOTR](#/p/motr)은 TrackFormer가 두 프레임 안에서만 학습하고 NMS·Re-ID 같은 휴리스틱에 의존한다는 점을 차이로 들며 긴 클립 학습으로 확장한다.',
 '**TransTrack과의 대비** — [TransTrack](#/p/transtrack)은 query를 한 번만 전파하고 IoU 매칭으로 잇지만, TrackFormer는 query를 프레임마다 이어받는다.',
 '**검출-연관 충돌 문제의 제기** — 한 decoder가 검출과 추적을 동시에 맡을 때의 갈등이 [MOTRv2](#/p/motrv2)가 외부 검출기를 붙이는 동기가 된다.'
],

pitfalls:[
 '**public detection 점수를 일반 트래커와 같은 줄에 놓으면 안 된다.** TrackFormer는 검출을 입력으로 받지 못해 IoU 조건으로 트랙 시작만 거른다. 저자들도 부록에서 이 비교가 완전히 공정하지 않다고 논의한다.',
 '**object query 수가 상한이다.** 프레임당 검출 가능한 새 객체 수가 $N_{object}$ 로 정해진다. MOT17은 프레임당 최대 52명인데 저자들은 500개를 썼다. 객체가 더 많은 장면에서는 이 수를 키워야 한다.',
 '**데이터가 곧 성능이다.** Transformer는 학습 데이터가 많이 필요해서 CrowdHuman 정지 영상으로 인접 프레임을 모사한다. 사전학습을 빼면 MOT17 train 분할에서 MOTA -2.0, IDF1 -1.6이다. 같은 구조라도 학습 데이터가 다르면 점수 비교가 어렵다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'가운데 열(프레임 t-1)에서 decoder 입력 아래쪽의 흰 상자가 object query이고, 앞 프레임에서 넘어온 색칠된 상자가 track query이다. 출력 쪽 X 표시는 배경(객체 없음)으로 판정된 embedding이다. 오른쪽(프레임 t)에서 색이 같은 상자가 같은 ID를 이어가고, 보라색은 새로 시작된 트랙이다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'We formulate this task as a frame-to-frame set prediction problem and introduce TrackFormer, an end-to-end trainable MOT approach based on an encoder-decoder Transformer architecture.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2101.02702 — TrackFormer', u:'https://arxiv.org/abs/2101.02702'},
 {t:'GitHub — timmeinhardt/trackformer', u:'https://github.com/timmeinhardt/trackformer'}
]
});
