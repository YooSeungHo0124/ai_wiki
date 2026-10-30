WIKI.paper({
slug:'dancetrack',
venue:'CVPR 2022 (arXiv 2021)',
authors:'Sun, Cao et al. (HKU · CMU · ByteDance)',
arxiv:'2111.14690',

tldr:'모두 비슷한 옷을 입고 크게 움직이며 자주 엇갈리는 그룹 댄스 영상 100편으로 만든 다중 인물 추적 데이터셋. 검출은 거의 완벽한데 연관(association)에서 기존 트래커들이 무너진다는 것을 보여, 외형 매칭에만 기댄 MOT의 편향을 드러냈다.',

context:'MOT17·MOT20 같은 기존 벤치마크의 보행자는 서로 외형이 뚜렷이 다르고 움직임도 규칙적이다. 그래서 [DeepSORT](#/p/deepsort) 계열이나 FairMOT 계열처럼 외형 임베딩으로 연관을 푸는 방식이 잘 통했고, 연구 흐름도 검출 뒤에 re-ID를 붙이는 쪽으로 쏠렸다. 저자들은 이것이 알고리즘의 한계가 아니라 데이터셋의 편향일 수 있다고 본다. 외형 단서가 통하지 않고 움직임이 복잡한 상황이 실제로 흔한데도 그걸 재는 벤치마크가 없었다. MOT20은 사람 수는 늘렸지만 움직임이 여전히 규칙적이라 "혼잡"만으로는 이 문제를 시험하지 못한다고 논문은 지적한다.',

ideas:[
 {h:'균일한 외형 + 다양한 움직임',
  lead:'외형으로 구분할 수 없고 움직임이 복잡한 장면만 골라 지름길(re-ID)을 막았다.',
  d:'영상은 거리 댄스, 팝, 클래식, 대규모 군무, 체조 등을 검색 엔진에서 모았다. 출연자들이 같은 옷을 입어 외형 임베딩이 구별력을 잃고, 큰 범위의 이동과 극단적인 자세 변화로 가림과 교차(crossover)가 잦다. 군집의 크기가 아니라 상대 위치가 자주 뒤바뀌는 정도가 핵심이며, 가려진 상태에서 다시 나타난 인물은 이전과 같은 ID를 유지하도록 주석을 달았다.'},
 {h:'정량적 지표로 편향을 증명',
  lead:'외형 유사도와 상대 위치 교체 빈도를 직접 재서 MOT17·MOT20과 비교했다.',
  d:'외형 쪽은 사전학습 re-ID 특징으로 같은 프레임 안 객체 쌍의 코사인 거리를 평균해 DanceTrack이 MOT17보다 낮음을 보인다(객체끼리 더 닮았다). 움직임 쪽은 두 가지를 쓴다. 인접 프레임 IoU는 세 데이터셋이 비슷해 속도가 비현실적으로 빠르지는 않다는 점을, 상대 위치 교체 빈도는 DanceTrack이 MOT17·MOT20·KITTI보다 높다는 점을 확인한다. 어려움이 속도가 아니라 엇갈림에서 나온다는 뜻이다.'},
 {h:'Oracle 분석: 병목은 검출이 아니라 연관',
  lead:'정답 상자를 주고 연관만 바꿔 보면 DanceTrack에서는 AssA가 크게 떨어진다.',
  d:'정답 박스를 검출 결과로 쓰고 IoU, 칼만 필터, 외형 매칭의 조합을 바꿔 연관 성능의 상한을 잰다. MOT17에서는 IoU만으로도 거의 만점인 반면, DanceTrack에서는 DetA가 98.9인데 AssA가 53.6에 그친다. 외형을 더하면 오히려 나빠진다. 즉 이 데이터셋의 어려움은 검출이 아니라 연관 자체다. 저자들은 이를 두고 기존 데이터셋이 검출 품질 쪽에 편향돼 있다고 결론 짓는다.'},
 {h:'벤치마크와 개선 단서',
  lead:'최신 트래커 9종을 같은 조건으로 돌리고, 움직임·세밀한 표현·깊이 단서를 시험했다.',
  d:'MOT17과 DanceTrack 테스트셋에서 모든 트래커의 HOTA가 크게 내려간다. 반면 MOTA와 DetA는 DanceTrack이 더 높아, 문제가 연관에 있음이 다시 확인된다. 연관 알고리즘을 YOLOX 검출 위에서 비교하면 순수 모션 기반 [OC-SORT](#/p/ocsort) 가 가장 높고, LSTM 모션 모델이 칼만 필터보다 낫다. 마스크나 포즈를 함께 학습하면 박스만 쓸 때보다 오르지만, KITTI 깊이는 도메인 차이로 도움이 되지 않는다.'}
],

diagram:{type:'compare', cap:'기존 보행자 벤치마크와 DanceTrack의 차이. 같은 oracle(정답 상자 + IoU 매칭)에서도 DanceTrack의 HOTA가 크게 낮다.',
 left:{t:'MOT17 · MOT20', items:['외형이 서로 구별됨','움직임이 규칙적','IoU만으로 HOTA 98.1','영상 14개 · 11,235장']},
 right:{t:'DanceTrack', items:['같은 옷, 외형 구별 불가','교차·가림 잦고 비선형','IoU만으로 HOTA 72.8','영상 100개 · 105,855장'], acc:true}},

math:[
 {expr:'S = Σ_i Σ_{j≠i} Σ_t sw(B_i^t, B_j^t, B_i^{t+1}, B_j^{t+1}) / (2N(T-1)(N-1))',
  tex:'S=\\frac{\\sum_{i}\\sum_{j\\neq i}\\sum_{t=1}^{T-1}\\text{sw}(B_i^t,B_j^t,B_i^{t+1},B_j^{t+1})}{2N(T-1)(N-1)}',
  d:'상대 위치 교체 빈도. 겹치는 두 객체의 좌우 또는 상하 순서가 인접 프레임 사이에 뒤바뀌면 $\\text{sw}=1$ 이다. 가림과 교차가 얼마나 잦은지를 전역적으로 재는 값이다.'}
],

numbers:[
 {k:'규모 (DanceTrack vs MOT17 vs MOT20)', v:'영상 100 / 14 / 8, 이미지 105,855 / 11,235 / 13,410', d:'영상당 평균 트랙 수는 9 / 96 / 432. 이미지·영상 모두 MOT 계열의 약 10배. 학습 40·검증 25·테스트 35'},
 {k:'Oracle, IoU만 사용 (HOTA / AssA)', v:'MOT17 98.1 / 97.3 · DanceTrack 72.8 / 53.6', d:'정답 박스를 검출로 쓴 검증셋. DanceTrack의 DetA는 98.9로 거의 만점이라 하락은 전부 연관에서 나온다'},
 {k:'Oracle, 외형 매칭만 사용 (AssA)', v:'MOT17 87.9 · DanceTrack 47.4', d:'DanceTrack에서 외형만 쓴 AssA(47.4)가 IoU만 쓴 값(53.6)보다 낮다. 외형 단서가 오히려 손해'},
 {k:'테스트셋 HOTA: MOT17 → DanceTrack', v:'ByteTrack 63.1 → 47.7, OC-SORT 63.2 → 55.1, FairMOT 59.3 → 39.7', d:'MOTR는 57.2 → 54.2, QDTrack은 53.9 → 54.2로 하락폭이 작거나 없다. 같은 표의 DanceTrack MOTA는 ByteTrack 89.6, OC-SORT 92.0'},
 {k:'연관 알고리즘 비교 (YOLOX, 검증셋 HOTA)', v:'IoU 44.7 · SORT 47.8 · DeepSORT 45.8 · BYTE 47.1 · OC-SORT 52.1', d:'DeepSORT가 SORT보다 낮은 것이 외형 매칭의 부정적 효과로 해석된다. 모션 모델은 IoU 44.7, 칼만 47.8, LSTM 51.6'},
 {k:'포즈 정보 추가 (CenterNet 기반, 검증셋 HOTA)', v:'36.9 → 40.6 (+3.7)', d:'COCO 포즈를 함께 학습한 효과. 마스크는 +1.2, KITTI 깊이를 함께 학습하면 오히려 -2.5'}
],

impact:'DanceTrack은 MOT의 진전이 검출 성능과 외형 임베딩에 얼마나 기대고 있었는지를 숫자로 보여준 데이터셋이다. 외형이 같다는 조건 하나만으로 [ByteTrack](#/p/bytetrack) 의 HOTA가 MOT17의 63.1에서 47.7로 내려갔고, 연관만 개선한 [OC-SORT](#/p/ocsort) 는 55.1을 기록했다. 평가 지표는 [HOTA](#/p/hota) 를 주 지표로, AssA·IDF1을 연관 지표로 쓴다. 저자들은 새로운 알고리즘을 내놓지 않고 이를 열린 문제로 남겼다고 한계 절에서 밝힌다.',

legacy:[
 '**[HOTA](#/p/hota)를 주 지표로 쓰는 MOT 벤치마크의 한 사례** — DetA와 AssA를 분리해 병목을 읽는 평가 관행을 이어감',
 '**[ByteTrack](#/p/bytetrack)·[OC-SORT](#/p/ocsort)의 비교 무대** — 같은 검출기 위에서 연관 알고리즘만 바꿔 비교하는 실험이 논문 안에 포함됨',
 '**[MOTR](#/p/motr)·GTR 같은 end-to-end 트래커의 평가 대상** — v2 개정에서 테스트 결과표에 추가됨',
 '**모션 모델링의 재조명** — 외형이 통하지 않을 때 칼만·LSTM 같은 시간 동역학이 도움이 된다는 분석 제시'
],

pitfalls:[
 '**DanceTrack 점수가 낮다고 검출기가 나쁜 것이 아니다.** 같은 표에서 MOTA와 DetA는 MOT17보다 오히려 높다. 하락은 연관 지표(HOTA·AssA·IDF1)에서만 나타난다.',
 '**"외형 정보가 무용하다"가 아니라 "외형이 구별력을 잃는 상황이 있다"는 주장이다.** MOT17에서는 외형 매칭도 AssA 87.9를 낸다. 다만 이 데이터셋만 보고 모든 환경에서 re-ID를 빼라는 결론을 내리면 안 된다.',
 '**표의 일부 수치는 개정판 값이다.** MOTR·GTR·OC-SORT는 v2, QDTrack은 v3(YOLOX 기반으로 재학습)에서 갱신되었고, arXiv 버전마다 숫자가 다를 수 있다. 인용할 때 버전을 확인해야 한다.'
],

figures:[
 {f:'fig3-statistics.png',
  cap:'(a) 같은 영상 안 객체들의 re-ID 특징 코사인 거리, DanceTrack이 MOT17보다 낮아 서로 더 닮았다. (b) 인접 프레임 IoU는 세 데이터셋이 비슷하다. (c) 상대 위치 교체 빈도는 DanceTrack이 가장 높다.',
  src:'원문 Figure 3, p.5'}
],

quotes:[
 {t:'we would like to re-emphasize that methods for multi-object tracking should also work when object appearance is not sufficiently discriminative.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2111.14690 — DanceTrack', u:'https://arxiv.org/abs/2111.14690'},
 {t:'GitHub — DanceTrack', u:'https://github.com/DanceTrack'}
]
});
