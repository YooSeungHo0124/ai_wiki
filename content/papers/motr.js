WIKI.paper({
slug:'motr',
venue:'ECCV 2022 (arXiv 2021)',
authors:'Zeng et al. (MEGVII · SJTU)',
arxiv:'2105.03247',

tldr:'DETR의 object query를 **track query**로 확장해 추적 중인 객체의 hidden state를 프레임마다 갱신·전달하고, IoU 매칭이나 NMS 같은 후처리 없이 MOT를 "시퀀스 집합 예측"으로 푼 end-to-end 트래커. 긴 클립 학습과 temporal aggregation으로 DanceTrack HOTA 54.2를 냈다.',

context:'연관(association)을 Re-ID 유사도, IoU, 칼만 필터 같은 휴리스틱 후처리로 푸는 것이 MOT의 표준이었고, 저자들은 이 후처리가 프레임 간 정보 흐름의 병목이라고 본다. [DETR](#/p/detr)는 검출을 이분 매칭 집합 예측으로 바꿔 NMS를 없앴지만, 시퀀스를 어떻게 다룰지는 열려 있었다. 저자들은 기계 번역의 반복 디코딩에서 착안해 object query를 객체 궤적의 hidden state로 보았다. 같은 시기에 [TransTrack](#/p/transtrack)과 [TrackFormer](#/p/trackformer)가 나왔지만 저자들은 자신들이 독립적으로, 먼저 시작했다고 밝히며 동시기 연구로 취급한다.',

ideas:[
 {h:'Track query: 궤적 하나가 query 하나',
  lead:'query의 hidden state를 프레임마다 갱신·전달해 한 query가 한 객체의 전 궤적을 책임진다.',
  d:'track query 집합은 빈 상태로 시작하고 길이가 가변이다. 신생 객체는 detect query가 검출해 다음 프레임부터 track query가 되고, 사라진 객체의 query는 제거된다. 한 객체의 궤적은 한 track query가 여러 프레임에 낸 예측을 모은 것이다. 추론에 별도의 연관 단계가 없다.'},
 {h:'Tracklet-aware label assignment (TALA)',
  lead:'detect query는 신생 객체만 이분 매칭하고, track query는 이전 프레임의 배정을 그대로 물려받는다.',
  d:'프레임 $i$ 에서 track query의 배정은 이전 프레임의 track 배정과 신생 객체 배정의 합집합이다. 한 번 맺어진 query와 객체의 짝은 변하지 않아 한 track query가 같은 ID의 박스 시퀀스로 감독된다. detect query가 이미 추적 중인 객체를 다시 잡는 것은 decoder의 self-attention이 DETR의 중복 제거처럼 억제한다.'},
 {h:'Query Interaction Module과 TAN',
  lead:'QIM이 입장·퇴장을 처리하고 TAN이 과거 track query를 key-query로 끌어와 장기 문맥을 보탠다.',
  d:'추론에서 detect query의 점수가 입장 임계값 $\\tau_{en}$ 을 넘으면 신생 객체로 받아들이고, track query는 점수가 퇴장 임계값 $\\tau_{ex}$ 아래로 연속 $M$ 프레임 떨어지면 제거한다. TAN은 변형한 Transformer decoder 층이다. 이전 프레임의 track query와 현재 hidden state를 합쳐 key·query로 쓰는 shortcut으로 과거 상태를 합친다.'},
 {h:'Collective Average Loss (CAL)',
  lead:'두 프레임이 아니라 비디오 클립 전체에서 손실을 모아 계산해 장거리 시간 변화를 학습시킨다.',
  d:'클립 안 모든 프레임의 예측을 모은 뒤 클립 전체 객체 수로 나눠 한 번에 손실을 구한다. 클립 길이는 학습 중 2에서 3, 4, 5로 점진적으로 늘린다. 두 프레임 학습으로는 긴 가림이나 큰 움직임 샘플을 만들기 어렵다는 점이 동기이고, 저자들은 이것이 TrackFormer류와의 주요 차이라고 설명한다.'}
],

diagram:{type:'loop', cap:'프레임마다 detect query와 track query를 합쳐 decoder에 넣고, QIM이 다음 프레임용 track query를 만들어 되먹인다.',
 center:'프레임마다 반복',
 nodes:[
  {t:'프레임 특징', s:'CNN + 인코더'},
  {t:'디코더', s:'detect + track query'},
  {t:'예측', s:'박스, 점수, ID 유지'},
  {t:'QIM', s:'입장·퇴장 + TAN', acc:true, a:'다음 쿼리'}
 ]},

math:[
 {tex:'\\omega^{i}_{tr}=\\omega^{i-1}_{tr}\\cup\\omega^{i-1}_{det}',
  expr:'ω_tr(i) = ω_tr(i-1) ∪ ω_det(i-1)',
  d:'track query의 라벨 배정 규칙. 이전 프레임까지의 track 배정에 직전 프레임에서 새로 생긴 detect 배정을 더한다. 첫 프레임에서는 공집합이다.'},
 {tex:'\\mathcal{L}_{o}=\\frac{\\sum_{n=1}^{N}\\big(\\mathcal{L}(\\hat Y^{n}_{tr},Y^{n}_{tr})+\\mathcal{L}(\\hat Y^{n}_{det},Y^{n}_{det})\\big)}{\\sum_{n=1}^{N}V_n}',
  expr:'L = Σ_n (L(tr) + L(det)) / Σ_n V_n',
  d:'Collective Average Loss. $N$ 프레임 클립 전체의 단일 프레임 손실(focal + L1 + GIoU)을 합하고 클립 전체의 정답 객체 수 $V_n$ 으로 정규화한다.'}
],

numbers:[
 {k:'DanceTrack test · HOTA / AssA / DetA', v:'54.2 / 40.2 / 73.5', d:'같은 표의 ByteTrack은 47.7 / 32.1 / 71.0. 같은 표에서 MOTA는 79.7로 ByteTrack 89.6보다 낮다'},
 {k:'MOT17 test (private) · HOTA / IDF1 / MOTA', v:'57.8 / 68.6 / 73.4', d:'IDs 2439. 같은 표의 TransTrack은 IDF1 63.9, MOTA 74.5라 연관은 앞서고 MOTA는 뒤진다'},
 {k:'BDD100K val · mMOTA / mIDF1', v:'32.0 / 43.5', d:'다중 클래스에서 IDSw 3493으로 비교 방법들보다 적음. 클래스 수만 바꿔 적용'},
 {k:'구성 요소 ablation · MOTA / IDF1 / IDs', v:'37.1/49.8/562 → 53.2/70.5/155', d:'track query만 쓴 설정에서 TAN과 CAL까지 더한 전체 구성으로. MOT17로 학습하고 2DMOT15 train으로 검증, C5 단일 feature(Table 6a)'},
 {k:'추론 속도', v:'약 7.5 FPS', d:'Tesla V100, 짧은 변 800 해상도 기준'}
],

impact:'MOTR는 연관 휴리스틱 없이 MOT를 하나의 모델로 푸는 길을 열었고, 특히 외형이 같고 움직임이 복잡한 DanceTrack에서 당시 [ByteTrack](#/p/bytetrack)을 HOTA로 6.5 앞섰다. 반면 MOT17에서는 검출 성능이 좋은 트래커에 못 미쳐, 저자들도 MOT17만으로는 평가가 충분하지 않다고 쓴다. 이 비대칭, 즉 연관은 강하고 검출은 약하다는 점이 후속 연구의 핵심 문제가 됐다.',

legacy:[
 '**검출 약점 보완** — [MOTRv2](#/p/motrv2)가 [YOLOX](#/p/yolox) 검출 결과를 anchor로 넣어 MOTR의 검출-연관 충돌을 푼다.',
 '**ID 예측으로의 전환** — [MOTIP](#/p/motip)은 track query 전파를 쓰지 않고 검출과 연관을 분리해 ID 라벨 예측으로 푼다.',
 '**DanceTrack을 평가 기준으로 확산** — MOTR는 MOT17만으로는 부족하다며 [DanceTrack](#/p/dancetrack)과 [HOTA](#/p/hota) 기준 비교를 전면에 내세웠고, 이후 MOTRv2·MOTIP도 같은 표를 쓴다.'
],

pitfalls:[
 '**"end-to-end"라서 모든 데이터셋에서 낫지는 않다.** MOT17 test에서 MOTR의 MOTA 73.4는 ByteTrack의 80.3에 못 미친다. 저자들은 이를 검출 성능 차이로 해석한다.',
 '**검출과 추적이 한 decoder에서 충돌한다.** detect query는 추적 중인 객체를 억제하도록 학습돼 신생 객체 검출 성능이 제한된다. 저자들이 TransTrack의 MOTA가 더 높은 이유로 추정한 부분이다.',
 '**학습 설정이 까다롭다.** 클립 길이 5, 클립 길이의 점진적 증가, 지우기·삽입 확률($p_{drop}$, $p_{insert}$) 등이 성능에 영향이 크다. Table 6c에서 $p_{drop}$ 을 0.1에서 0.5로 바꾸면 MOTA가 53.2에서 48.5로 내려간다.'
],

figures:[
 {f:'fig3-architecture.png',
  cap:'맨 위 줄이 비디오 프레임이고 Enc는 프레임마다 특징을 뽑는다. 첫 프레임은 detect query $q_d$ 만 쓰고, 이후 프레임은 QIM이 만든 track query $q_{tr}$ 와 $q_d$ 를 이어 붙여(C) Dec에 넣는다. 가로 방향의 QIM 화살표가 프레임 사이로 전달되는 hidden state이다.',
  src:'원문 Figure 3, p.6'}
],

quotes:[
 {t:'Track queries are served as the hidden states of object tracks.',
  src:'Introduction, p.2'}
],

links:[
 {t:'arXiv 2105.03247 — MOTR', u:'https://arxiv.org/abs/2105.03247'},
 {t:'GitHub — megvii-research/MOTR', u:'https://github.com/megvii-research/MOTR'}
]
});
