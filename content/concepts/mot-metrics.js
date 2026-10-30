WIKI.concept({
slug:'mot-metrics',

tldr:'MOTA 는 검출 오류 위주, IDF1 은 ID 유지 위주, HOTA 는 검출과 연관을 균형 있게 분리해 평가하는 다중 객체 추적 지표다.',

why:'추적 논문 표에는 MOTA, IDF1, HOTA 가 같이 나오고, 어떤 방법은 MOTA 에서 이기고 어떤 방법은 IDF1 에서 이긴다. 각 지표가 무엇을 세는지 알아야 "이 추적기는 검출이 좋은 건지 ID 를 잘 지키는 건지"를 읽어낼 수 있고, 서비스 목적에 맞는 지표를 고를 수 있다.',

sections:[
 {h:'MOTA', d:'프레임마다 정답과 예측을 IoU 0.5 이상으로 맞추고, 놓친 정답(FN), 헛짚은 예측(FP), ID 전환(IDSW)을 전부 센다. 이 세 오류의 합을 정답 박스 총수 GT 로 나눠 1 에서 뺀 값이 MOTA 다. 오류가 정답 수보다 많으면 음수도 될 수 있다. FN 과 FP 는 프레임 수에 비례해 쌓이지만 ID 전환은 드문 사건이라, 실제로는 검출 품질이 점수 대부분을 결정한다.'},
 {h:'IDF1', d:'MOTA 가 프레임별로 세는 것과 달리 IDF1 은 영상 전체에서 정답 궤적과 예측 궤적을 일대일로 맞춘다. 맞은 박스를 IDTP, 못 맞은 쪽을 IDFN·IDFP 로 세어 F1 을 구한다. 한 사람이 중간에 ID 가 한 번 바뀌면 그 뒤 구간은 전부 틀린 것으로 처리되므로, 얼마나 오래 같은 ID 를 유지했는지에 민감하다. 사람 동선 분석처럼 정체성이 중요한 용도에 맞다.'},
 {h:'HOTA', d:'[HOTA](#/p/hota)는 MOTA 가 검출에, IDF1 이 연관에 치우친다는 비판에서 나왔다. 한 IoU 임계값 α 에서 검출 정확도 DetA 와 연관 정확도 AssA 를 따로 구하고 기하평균을 취한다. 그다음 α 를 0.05 에서 0.95 까지 0.05 간격으로 바꿔 가며 평균한다. DetA, AssA 가 각각 따로 보고되므로 "검출이 약한가, 연관이 약한가"를 바로 분해할 수 있다. 더구나 α 가 높을수록 박스 위치 정확도도 반영된다.'},
 {h:'어떻게 읽나', d:'세 숫자가 엇갈리면 이유가 있다. MOTA 는 높은데 IDF1 이 낮으면 검출은 좋으나 ID 가 자주 바뀐다는 뜻이다. [ByteTrack](#/p/bytetrack)처럼 낮은 신뢰도 박스를 살리는 방법은 FN 을 줄여 MOTA 를 올리기 쉽고, 외형 임베딩을 쓰는 방법은 IDF1 과 AssA 를 올리기 쉽다. 데이터셋(MOT17, MOT20, DanceTrack 등) 마다 장면 특성이 달라 숫자 크기를 직접 비교할 수 없고, 비공개 검출기를 쓰는지(private vs public detection)에 따라서도 조건이 다르다.'}
],

math:[
 {tex:'\\text{MOTA}=1-\\dfrac{\\sum_t(\\text{FN}_t+\\text{FP}_t+\\text{IDSW}_t)}{\\sum_t \\text{GT}_t}', expr:'Multiple Object Tracking Accuracy', d:'t 는 프레임, GT_t 는 그 프레임의 정답 박스 수다. 세 오류를 같은 무게로 더하므로 ID 전환 한 건과 놓친 박스 한 건이 똑같이 벌점 1 이다.'},
 {tex:'\\text{IDF1}=\\dfrac{2\\,\\text{IDTP}}{2\\,\\text{IDTP}+\\text{IDFP}+\\text{IDFN}}', expr:'ID F1', d:'IDTP 는 궤적 전체 수준의 일대일 대응에서 맞은 박스 수, IDFP·IDFN 은 못 맞은 예측·정답 박스 수다. ID 정밀도와 ID 재현율의 조화평균과 같다.'},
 {tex:'\\text{HOTA}_\\alpha=\\sqrt{\\text{DetA}_\\alpha\\cdot\\text{AssA}_\\alpha},\\quad \\text{DetA}=\\dfrac{|TP|}{|TP|+|FN|+|FP|}', expr:'HOTA', d:'AssA 는 맞은 검출 각각에서 그 정체성 궤적이 얼마나 일치하는지(궤적 단위의 TPA/(TPA+FNA+FPA))를 평균한 값이다. 최종 HOTA 는 α 를 0.05 부터 0.95 까지 움직여 얻은 HOTA_α 의 평균이다.'}
],

diagram:{type:'compare', cap:'지표마다 무게가 실리는 오류 종류가 다르다.',
 left:{t:'MOTA', items:['프레임별 FN·FP·IDSW','검출 품질에 지배됨','음수가 될 수 있음']},
 right:{t:'IDF1 · HOTA', items:['IDF1: 궤적 단위 대응','HOTA: DetA 와 AssA 분리','ID 유지에 민감']}},

confuse:[
 {a:'MOTA', b:'IDF1', d:'MOTA 는 오류 건수를 프레임마다 합산해 검출에 민감하고, IDF1 은 궤적을 통째로 맞춰 ID 유지에 민감하다. 같은 추적기도 순위가 뒤집힐 수 있다.'},
 {a:'IDF1', b:'HOTA', d:'IDF1 은 연관 쪽으로 치우치고, HOTA 는 DetA 와 AssA 를 같은 비중으로 합친다. HOTA 가 분해 가능하다는 점이 진단에 유리하다.'},
 {a:'추적 지표', b:'탐지 mAP', d:'탐지 mAP 는 프레임 독립적인 박스 품질을 보지만 추적 지표는 시간에 따른 ID 일관성을 본다. 탐지 쪽은 [IoU · mAP](#/c/iou-map)를 참고하라.'}
],

pitfalls:[
 'MOTA 만 보고 "추적을 잘한다"고 결론 내리기 쉽다. ID 가 계속 바뀌어도 검출이 좋으면 높게 나온다.',
 '논문 표의 public detection 과 private detection 결과를 같은 줄에서 비교하면 검출기 차이를 추적기 차이로 오해한다.',
 '지표 값은 평가 도구(TrackEval 등)와 설정에 따라 달라지므로 직접 돌린 값과 보고된 값을 바로 비교하지 마라.',
 '지표 하나를 올리려고 임계값을 튜닝하면 다른 지표가 떨어진다. 서비스 목적에 맞는 대표 지표를 미리 정하라.'
],

papers:['hota','sort','bytetrack','fairmot'],
terms:['tracking-c','tracking-by-detection','iou-map','precision-recall','confusion-matrix']
});
