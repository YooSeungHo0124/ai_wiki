WIKI.paper({
slug:'hota',
venue:'IJCV 2021 (arXiv 2020)',
authors:'Luiten et al. (RWTH Aachen · TUM · Oxford · MPI-IS/Tübingen)',
arxiv:'2009.07736',

tldr:'다중 객체 추적(MOT)의 평가 지표 **HOTA**. 검출 정확도 DetA와 연관 정확도 AssA의 기하평균을 localisation 임계값 전 범위에서 평균해, 검출 쪽으로 쏠린 MOTA와 연관 쪽으로 쏠린 IDF1 사이의 균형점을 하나의 점수로 만들었다.',

context:'MOT 벤치마크는 2006년 CLEAR MOT 이후 오래도록 MOTA 하나로 트래커 순위를 매겼다. MOTA는 `1 - (FN + FP + IDSW) / gtDet` 이라 오류 개수만 센다. 그런데 실제 트래커에서는 검출 오류(FN+FP)와 연관 오류(IDSW)의 비율이 MOT17 상위 10개 평균으로 약 98.6배라서, 점수의 거의 전부가 검출 품질에서 나온다. 그래서 일부 연구는 연관을 더 잘 반영하는 IDF1로 옮겨갔지만, IDF1은 궤적 단위로 1:1 매칭을 하느라 검출이 좋아져도 점수가 내려갈 수 있다. 검출·연관·localisation 세 가지를 한 숫자에 균형 있게 담으면서 오류 종류별로 분해도 되는 지표가 없었다.',

ideas:[
 {h:'TPA/FNA/FPA: 연관 오류를 검출처럼 센다',
  lead:'각 TP마다 같은 prID·gtID를 가진 매칭을 세어 "연관의 Jaccard"를 정의한다.',
  d:'검출은 TP/FN/FP로 세는데 연관에는 그런 개수가 없었다. 저자들은 TP $c$ 하나를 기준으로 TPA(같은 prID와 같은 gtID를 가진 TP), FNA(같은 gtID인데 prID가 다르거나 놓친 것), FPA(같은 prID인데 gtID가 다르거나 없는 것)를 정의한다. 이 셋으로 $A(c)=|TPA|/(|TPA|+|FNA|+|FPA|)$ 를 구하면, 그 TP가 속한 정답 궤적과 예측 궤적이 영상 전체에서 얼마나 겹치는지가 나온다. MOTA의 IDSW가 직전 한 프레임만 보는 1차 연관인 데 비해 이쪽은 영상 전체를 보는 고차(higher-order) 연관이다.'},
 {h:'이중 Jaccard + 기하평균',
  lead:'검출 Jaccard와 연관 Jaccard를 곱해 제곱근을 취하면 두 쪽이 정확히 같은 비중이 된다.',
  d:'$HOTA_\\alpha=\\sqrt{DetA_\\alpha\\cdot AssA_\\alpha}$ 이다. DetA는 $|TP|/(|TP|+|FN|+|FP|)$ 인 표준 Jaccard이고, AssA는 TP마다의 $A(c)$ 를 평균한 값이다. 기하평균이라 둘 중 하나가 0에 가까우면 전체도 0에 가까워지고, 점수는 항상 두 값 사이에 놓인다. 제곱근은 연관 점수 안에 이미 들어 있는 FN·FP를 이중으로 세지 않게 하는 역할도 한다. 단일 객체 추적(SOT)에서는 HOTA가 정확히 하나의 Jaccard로 줄어든다고 논문이 보인다.'},
 {h:'매칭은 검출 단위, 채점은 궤적 단위',
  lead:'TP 매칭은 프레임별로 하되 연관 점수는 영상 전체 기준이라 단조성이 유지된다.',
  d:'MOTA는 매칭과 채점이 모두 검출 단위이고, IDF1은 둘 다 궤적 단위(1:1)이다. HOTA는 프레임마다 헝가리안으로 검출을 매칭하고, 그 매칭된 검출 각각의 연관 점수를 전 영상에서 센다. 한 정답 궤적이 여러 예측 궤적으로 쪼개져도 어느 것도 버려지지 않고 모두 점수에 기여한다. 저자들은 이 구조 덕에 검출을 하나 더 맞히면 점수가 반드시 오른다는 단조성이 성립한다고 분석한다. IDF1과 Track-mAP는 이 성질이 깨진다.'},
 {h:'α 평균과 5개 하위 지표로의 분해',
  lead:'HOTA는 localisation 임계값을 0.05~0.95로 훑어 평균하고, 오류 종류별 하위 지표로 쪼개진다.',
  d:'최종 HOTA는 $\\alpha\\in\\{0.05,0.10,\\dots,0.95\\}$ 19개 임계값에서 구한 $HOTA_\\alpha$ 의 평균이다. DetA와 AssA는 다시 각각 recall/precision(DetRe, DetPr, AssRe, AssPr)으로, 그리고 별도의 LocA로 나뉜다. 이는 Leichter와 Krupka가 제안한 5가지 기본 오류(FN, FP, fragmentation, merger, deviation)와 대응한다. 순위용 단일 점수와 원인 분석용 분해를 동시에 주는 구조이며, 용도에 따라 어떤 하위 지표를 볼지 고를 수 있다.'}
],

diagram:{type:'flow', cap:'HOTA 계산 순서. 검출을 매칭해 TP를 정하고, 각 TP의 연관 점수를 영상 전체에서 구해 DetA와 합친 뒤 α에 대해 평균한다.',
 nodes:[
  {t:'검출 매칭', s:'프레임별 헝가리안'},
  {t:'TP/FN/FP', s:'DetA'},
  {t:'TPA/FNA/FPA', s:'TP마다 A(c)', acc:true},
  {t:'기하평균', s:'√(DetA·AssA)'},
  {t:'α 평균', s:'0.05 … 0.95'}
 ]},

math:[
 {expr:'HOTA_α = sqrt( Σ_{c∈TP} A(c) / (|TP|+|FN|+|FP|) ),  A(c)=|TPA|/(|TPA|+|FNA|+|FPA|)',
  tex:'\\text{HOTA}_\\alpha=\\sqrt{\\frac{\\sum_{c\\in\\{TP\\}}\\mathcal{A}(c)}{|TP|+|FN|+|FP|}}=\\sqrt{\\text{DetA}_\\alpha\\cdot\\text{AssA}_\\alpha},\\quad \\mathcal{A}(c)=\\frac{|TPA(c)|}{|TPA(c)|+|FNA(c)|+|FPA(c)|}',
  d:'각 TP의 분자 기여가 그 TP의 연관 점수 $\\mathcal{A}(c)$ 로 가중된다. 연관이 완벽하면 $\\mathcal{A}=1$ 이라 DetA와 같아지고, 연관이 나쁘면 TP를 맞혔어도 점수가 깎인다.'},
 {expr:'HOTA = (1/19) Σ_{α=0.05..0.95} HOTA_α',
  tex:'\\text{HOTA}=\\int_0^1\\text{HOTA}_\\alpha\\,d\\alpha\\approx\\frac{1}{19}\\sum_{\\alpha\\in\\{0.05,\\,0.1,\\,\\dots,\\,0.95\\}}\\text{HOTA}_\\alpha',
  d:'매 $\\alpha$ 마다 매칭을 새로 한다. DetA와 AssA는 반드시 합쳐서 HOTA를 만든 뒤에 $\\alpha$ 평균을 내야 하며, 각각 평균을 낸 뒤 합치면 안 된다고 논문이 명시한다.'}
],

numbers:[
 {k:'MOTA 점수에서 검출 오류 : 연관 오류 비율', v:'평균 98.6배 (42.3~186.4)', d:'2020년 4월 MOT17 상위 10개 트래커 기준. 검출 오류의 영향이 연관 오류의 약 100배라는 근거'},
 {k:'MOTA ↔ MODA 회귀 (MOT17, 트래커 175개)', v:'R² 99.4', d:'IDSW를 뺀 검출 전용 지표 MODA가 MOTA 변동의 99% 이상을 설명한다. MOTA와 IDSW 수의 R²는 23.7'},
 {k:'MOT17 37개 트래커에서 DetA / AssA 와의 상관(R²)', v:'MOTA 0.96 / 0.46 · IDF1 0.58 / 0.97 · HOTA 0.67 / 0.94', d:'MOTA는 검출, IDF1은 연관과 강하게 묶이고 HOTA는 둘 사이. 각 항목의 앞 숫자가 DetA, 뒤 숫자가 AssA와의 값'},
 {k:'MOT17 순위 변화 예 (SAS_MOT17)', v:'HOTA 5위 · MOTA 31위 · IDF1 3위', d:'연관에 집중하고 검출을 희생한 트래커라 MOTA에서는 크게 밀리고 IDF1에서는 상위. HOTA는 그 중간'},
 {k:'사용자 연구: 사람의 판단과 일치한 비율', v:'HOTA vs MOTA 61.6% : 38.4%, HOTA vs IDF1 72.0% : 28.0%', d:'참가자 230명(MOT 연구자 62명), 두 지표의 판정이 갈리는 영상 쌍을 비교. MOT 연구자만 보면 HOTA가 MOTA에 79.3%, IDF1에 85.9% 일치'},
 {k:'Fig. 1 장난감 예시 (C 트래커)', v:'DetA 100% · MOTA 97% · HOTA 50% · IDF1 25%', d:'검출은 완벽하나 정답 궤적을 4조각으로 쪼갠 경우. 같은 행의 AssA는 25%'}
],

impact:'HOTA는 "MOTA냐 IDF1이냐"의 논쟁을 한 숫자와 그 분해로 정리한 지표다. 이후 [DanceTrack](#/p/dancetrack) 은 HOTA를 주 지표, AssA·IDF1을 연관 지표, DetA·MOTA를 검출 지표로 쓴다고 명시했고, [ByteTrack](#/p/bytetrack) 의 MOT17·MOT20 결과표에도 HOTA가 함께 실린다. 같은 점수가 나오더라도 DetA와 AssA를 따로 보면 병목이 검출인지 연관인지 곧바로 갈린다. [SORT](#/p/sort) 처럼 연관만 단순한 트래커와 [DeepSORT](#/p/deepsort) 처럼 외형을 더한 트래커의 차이도 이 분해로 읽을 수 있다.',

legacy:[
 '**[DanceTrack](#/p/dancetrack)**: HOTA를 주 지표로 삼고 AssA·DetA를 분리해 보고하는 방식을 데이터셋 표준으로 채택',
 '**BDD100K·KITTI 등 벤치마크**: DanceTrack 논문에 따르면 이들도 HOTA를 주요 지표로 사용',
 '**[ByteTrack](#/p/bytetrack)·[OC-SORT](#/p/ocsort) 계열 논문**: MOTA·IDF1과 함께 HOTA를 결과표에 싣는 방식(ByteTrack, OC-SORT 모두 DanceTrack 논문의 표에서 HOTA로 비교됨)',
 '**확장 변형**: 논문 안에서 Online HOTA, FA-HOTA(fragmentation), W-HOTA, Class-Aware HOTA 등을 함께 제안'
],

pitfalls:[
 '**HOTA는 영상 전체를 보고 연관을 채점한다.** 한 TP의 점수가 미래 프레임의 연관에도 좌우되므로, 논문 스스로도 온라인 트래킹 평가에는 이상적이지 않다고 인정하고 Online HOTA(OHOTA)를 따로 제안한다.',
 '**HOTA는 fragmentation(짧은 구간의 끊김)을 일부러 반영하지 않는다.** 장기 전역 정렬을 재는 설계라서, 끊김이 중요한 응용에는 FA-HOTA 같은 확장이 필요하다.',
 '**표의 HOTA는 α 평균 이후의 값이다.** DetA·AssA를 각각 α 평균하고 곱해서 제곱근을 취해도 같은 값이 나오지 않는다. 공식 구현의 출력과 직접 계산한 값을 섞어 비교하면 어긋날 수 있다.'
],

figures:[
 {f:'fig1-toy-example.png',
  cap:'정답(gt) 궤적 하나를 A·B·C 세 트래커가 점점 잘게 쪼개 예측한다. 위에서 아래로 갈수록 DetA와 MOTA는 오르고 AssA는 내려가는데, MOTA는 검출을 따라 올라가고 IDF1은 연관을 따라 내려간다. HOTA만 세 경우 모두 50%로 균형을 유지한다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig3-decomposition.png',
  cap:'HOTA가 오류 종류별로 쪼개지는 트리. 맨 아래 네 개(DetRe·DetPr·AssRe·AssPr)가 recall/precision이고 LocA는 localisation만 따로 잰다. 위로 올라갈수록 합쳐져 순위용 단일 점수가 된다.',
  src:'원문 Figure 3, p.9'}
],

quotes:[
 {t:"HOTA measures how well the trajectories of matching detections align, and averages this over all matching detections, while also penalising detections that don’t match.",
  src:'Sec. 5, p.8'}
],

links:[
 {t:'arXiv 2009.07736 — HOTA', u:'https://arxiv.org/abs/2009.07736'},
 {t:'GitHub — JonathonLuiten/HOTA-metrics', u:'https://github.com/JonathonLuiten/HOTA-metrics'}
]
});
