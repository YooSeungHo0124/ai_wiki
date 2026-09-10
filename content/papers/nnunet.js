WIKI.paper({
slug:'nnunet',
venue:'MICCAI 2018 Workshop (DLMIA) · 원제 "no-new-Net"',
authors:'Isensee, Petersen, Klein, Zimmerer et al. (DKFZ Heidelberg)',
arxiv:'1809.10486',

tldr:'새 아키텍처를 제안하지 **않는 것**이 이 논문의 주장이다. 거의 원본 그대로의 [U-Net](#/p/unet)을 쓰되, 데이터셋의 이미지 기하(해상도·크기·이방성)에서 전처리·네트워크 형태·학습·후처리를 **규칙 기반으로 자동 결정**하는 파이프라인만으로 Medical Segmentation Decathlon 대부분 과제에서 1위를 차지했다.',

context:'2018년 무렵 의료 영상 분할 논문들은 새 블록(residual, dense, attention)을 [U-Net](#/p/unet)에 얹어 특정 데이터셋에서 성능을 개선했다고 보고하는 패턴이 흔했다. 그런데 저자들은 이런 개선 상당수가 **비교 대상(baseline U-Net)이 제대로 튜닝되지 않은 상태에서의 우위**일 수 있다고 의심했다 — 자체 예비 실험에서, 이미 충분히 최적화된 네트워크에는 이런 아키텍처 수정들이 별다른 이득을 주지 못했다. Medical Segmentation Decathlon은 이 의심을 검증하기 좋은 무대였다. 뇌종양·심장·간·해마·전립선·폐·췌장 등 **7개(1단계)+3개(2단계) 완전히 다른 장기·모달리티**에 대해, 데이터셋별 수동 튜닝을 금지하고 완전 자동 파이프라인만 허용하는 챌린지였다.',

ideas:[
 {h:'아키텍처는 원본 U-Net에서 거의 바꾸지 않는다',
  lead:'residual·dense·attention 같은 최신 블록을 전부 배제하고 leaky ReLU·instance norm만 바꾼다.',
  d:'인코더-디코더 구조, 컨볼루션 2개씩, skip connection 전부 원본 [U-Net](#/p/unet) 그대로다. 바꾼 것은 ReLU → leaky ReLU(기울기 0.01), batch norm → instance normalization 두 가지뿐이다. "no-new-Net"이라는 부제가 이 선택을 그대로 요약한다 — 성능 차이는 구조가 아니라 그 주위의 파이프라인에서 난다는 것이 핵심 주장이다.'},
 {h:'2D·3D·Cascade 세 후보를 두고 자동으로 고른다',
  lead:'2D U-Net, 3D U-Net, 저해상도→고해상도 2단계 Cascade를 전부 학습해 최고 성능을 고른다.',
  d:'3D U-Net이 이상적이지만 GPU 메모리 제약으로 패치 단위 학습을 해야 하고, 간처럼 이미지가 큰 데이터셋에서는 패치의 시야(field of view)가 좁아 문맥 정보가 부족해진다. 이를 보완하려고 저해상도 전체 볼륨을 먼저 분할한 뒤(stage 1) 그 결과를 원핫 인코딩해 고해상도 패치 입력에 추가 채널로 얹어 정제하는(stage 2) U-Net Cascade를 제안한다. 어떤 후보를 쓸지는 이미지 이방성·크기에 대한 휴리스틱으로 자동 결정된다.'},
 {h:'네트워크 형태를 이미지 기하에서 자동 계산',
  lead:'패치 크기·풀링 횟수·배치 크기를 데이터셋의 중앙값 이미지 크기에서 규칙적으로 유도한다.',
  d:'간(중앙값 482×512×512)과 해마(중앙값 36×50×35)처럼 데이터셋마다 볼륨 크기가 수백 배 차이 나므로, 축마다 특징 맵 크기가 8 밑으로 떨어질 때까지 풀링을 반복하되 GPU 메모리 한도(최적화 스텝당 복셀 수 상한) 안에서 배치 크기와 패치 크기를 맞바꾼다. 이 계산이 전부 자동이라 사람이 데이터셋마다 손으로 하이퍼파라미터를 고르지 않는다.'},
 {h:'전처리·후처리까지 파이프라인 전체를 규칙화',
  lead:'리샘플링·정규화·데이터 증강까지 데이터셋 특성으로 자동 결정되는 규칙에 따른다.',
  d:'모든 볼륨을 0이 아닌 영역으로 크롭하고, 데이터셋 중앙값 voxel spacing으로 리샘플링하며(영상은 3차 스플라인, 마스크는 최근접 이웃), CT는 데이터셋 전체 강도 통계로 정규화한다. 이 논문의 진짜 기여는 새 블록 하나가 아니라 **이 전체 사슬을 사람 개입 없이 자동으로 연결**한 것이다.'}
],

diagram:{type:'compare', cap:'이 논문이 명시적으로 세우는 대비 구도 — 아키텍처 경쟁 vs 파이프라인 설계.',
 left:{t:'당시 통상적 접근', items:['새 블록을 U-Net에 추가','단일·소수 데이터셋에서 검증','베이스라인 튜닝 수준이 불명확']},
 right:{t:'nnU-Net', items:['원본에 가까운 U-Net 유지','전처리·형태·학습을 규칙으로 자동화','10개 데이터셋 대부분 1위 달성']}},

math:[],

numbers:[
 {k:'선두 성적', v:'phase 1 7개 과제, 거의 전 클래스 1위', d:'BrainTumour 클래스 1 제외 전부 온라인 리더보드 최고 Dice(제출 시점 기준)'},
 {k:'Dice · Heart(심장)', v:'92.77 (test)', d:'2D+3D U-Net Cascade 앙상블'},
 {k:'Dice · Liver(간, 종양 클래스)', v:'52.27 (test)', d:'같은 표의 다른 장기보다 훨씬 낮음 — 종양 클래스가 특히 어려움'},
 {k:'입력 패치 · Liver 3D', v:'128×128×128', d:'중앙값 볼륨(482×512×512)의 극히 일부만 한 번에 보는 패치 학습'},
 {k:'입력 패치 · Hippocampus 3D', v:'40×56×40', d:'볼륨 자체가 작아(중앙값 36×50×35) 사실상 전체를 봄'},
 {k:'모델 후보 수', v:'2D U-Net · 3D U-Net · U-Net Cascade 3종', d:'데이터셋마다 5-fold 교차검증으로 최고 성능 모델(또는 앙상블) 자동 선택'}
],

impact:'"구조를 더 정교하게 만들수록 이긴다"는 당시 통념에 정면으로 반박하며, **파이프라인 설계(전처리·형태 결정·학습 스케줄·후처리)가 구조 자체보다 성능에 더 크게 기여한다**는 것을 실측으로 보였다. 이후 의료 영상 분할 연구는 "새 블록"만으로는 논문이 되기 어려워졌고, 새 구조를 제안하는 논문도 nnU-Net 파이프라인 위에서 비교하는 것이 관행이 되었다. 이 워크숍 논문 이후 저자들은 프레임워크를 계속 확장했고(2021년 Nature Methods판은 국제 대회 다수에서 검증), 오늘날에도 nnU-Net은 의료 분할 연구의 사실상 **기본 baseline**이다.',

legacy:[
 '**의료 분할의 표준 baseline** — 새 구조를 제안하는 논문 대부분이 지금도 nnU-Net 대비 성능을 보고',
 '**AutoML식 자동 구성**이 의료 영상 특화 영역에서 먼저 정착 — 이후 범용 AutoML 분할 도구들에 영향',
 '**[MedSAM](#/p/medsam)** 등 후속 연구가 여전히 nnU-Net을 정량 비교 대상으로 삼음',
 '**"구조 대신 파이프라인" 관점**이 의료 영상을 넘어 다른 분할·탐지 벤치마크의 재현성 논쟁에도 참조됨'
],

pitfalls:[
 '**이 논문 자체는 "23개 과제"를 다루지 않는다.** 이 MICCAI 워크숍판(2018)이 다루는 것은 Medical Segmentation Decathlon의 7개(phase 1) + 3개(phase 2) 과제다. 더 넓은 범위(23개 국제 대회)의 검증은 2021년 Nature Methods 확장판에서 이뤄졌으므로, 수치를 인용할 때 어느 버전인지 구분해야 한다.',
 '**장기·클래스별 성능차가 매우 크다.** 같은 표 안에서 심장 Dice가 92.77인 반면 간 종양 클래스는 52.27에 그친다 — "nnU-Net이 SOTA"라는 요약 한 줄로 모든 과제를 대표할 수 없다.',
 '**3개 모델을 전부 학습해 고르는 방식은 저자들 스스로도 "가장 깔끔한 해법은 아니다"라고 인정한다.** 계산 비용이 크고, 사전에 어느 모델이 나을지 휴리스틱으로 예측하는 연구는 이후 과제로 남겼다.'
],

figures:[
 {f:'fig1-cascade.png',
  cap:'U-Net Cascade의 2단계 구조. stage 1(왼쪽)은 다운샘플링된 전체 볼륨(회색)에서 저해상도 분할(파랑)을 만들고, 이를 원해상도로 업샘플링해 stage 2(오른쪽) 입력에 원핫 채널로 이어붙여(점선) 고해상도 패치(빨간 테두리 크롭)를 정제해 최종 분할(초록)을 낸다. 간·심장·폐·췌장처럼 볼륨이 커서 3D U-Net 패치 하나로는 문맥이 부족한 데이터셋에만 적용된다.',
  src:'원문 Figure 1, p.4'}
],

quotes:[
 {t:'We argue the strong case for taking away superfluous bells and whistles of many proposed network designs and instead focus on the remaining aspects that make out the performance and generalizability of a method.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1809.10486 — nnU-Net', u:'https://arxiv.org/abs/1809.10486'},
 {t:'Medical Segmentation Decathlon', u:'http://medicaldecathlon.com/'}
]
});
