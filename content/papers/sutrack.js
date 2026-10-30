WIKI.paper({
slug:'sutrack',
venue:'AAAI 2025',
authors:'Chen, Kang, Geng, Zhu, Liu, Wang, Lu (Dalian Univ. of Technology · Baidu)',
arxiv:'2412.19138',

tldr:'RGB·RGB-Depth·RGB-Thermal·RGB-Event·RGB-Language 다섯 가지 단일 객체 추적(SOT) 과제를 **하나의 모델, 한 번의 학습**으로 처리하는 통합 추적기. 입력 인터페이스(6채널 패치 임베딩, 언어 토큰)만 바꾸고 백본은 단일 스트림 트랜스포머 그대로 쓴다.',

context:'RGB 추적 외에 깊이·열화상·이벤트·언어 정보를 함께 쓰는 다중 모달 추적 과제가 따로 발전했고, 대개 과제마다 별도 구조와 별도 모델을 학습했다. 저자들은 이 분절이 파라미터 중복, 데이터 공유 불가(과적합 위험), 기술 혁신의 중복 검증이라는 세 가지 낭비를 낳는다고 본다. 구조만 통일하고 파라미터는 따로 두거나, 일부 과제만 묶은 선행 연구는 있었지만 다섯 과제를 모델 수준에서 통합한 것은 아니라고 한다. 바탕은 [OSTrack](#/p/ostrack)·[MixFormer](#/p/mixformer)가 닦은 단일 스트림 추적 구조다.',

ideas:[
 {h:'모든 모달리티를 하나의 토큰 형식으로',
  lead:'RGB와 깊이/열/이벤트 이미지를 채널 방향으로 이어 6채널 패치 임베딩에 넣는다.',
  d:'깊이·열화상·이벤트는 3채널 이미지로 저장되므로 RGB와 채널 축으로 이어 붙여 $H\\times W\\times 6$ 입력을 만들고, 패치 임베딩 층만 3채널에서 6채널로 넓힌다. 별도 브랜치가 없어 RGB 전용 추적기 대비 추가 비용이 0.06M 파라미터, 0.7 GFLOPs 미만이다. 보조 모달이 없는 과제는 RGB 채널을 복제해 6채널을 채운다.'},
 {h:'언어는 CLIP 텍스트 토큰 하나로',
  lead:'설명 문장을 CLIP-L 텍스트 인코더로 토큰 하나로 만들어 시각 토큰 뒤에 붙인다.',
  d:'RGB-Language 과제에서는 언어 설명을 동결된 CLIP-L 텍스트 인코더(+선형층)로 단일 토큰 임베딩으로 바꿔 시각 토큰과 이어 넣는다. 언어가 없는 과제에는 CLIP의 패딩 토큰을 고정된 의미 없는 문장으로 대신 넣는다. 이 텍스트 인코더의 약 85M 파라미터는 언어 과제가 아니면 빼도 된다.'},
 {h:'과제 인식 보조 학습',
  lead:'학습할 때만 출력 토큰 평균으로 지금 입력이 다섯 과제 중 무엇인지 분류시킨다.',
  d:'트랜스포머 출력 임베딩의 평균 $E_{avg}$ 를 3층 MLP에 넣어 5개 과제를 분류하고 교차 엔트로피 손실 $L_{task}$ 를 추적 손실에 더한다. 이 헤드는 학습에만 쓰이고 추론에는 비용이 없다. 제거하면 5개 벤치마크 평균이 0.4 떨어졌다.'},
 {h:'Soft 토큰 타입 임베딩',
  lead:'표적 박스 경계에 걸친 패치를 전경과 배경 임베딩의 가중합으로 표현한다.',
  d:'[LoRAT](#/p/lorat)의 토큰 타입 임베딩은 템플릿 패치를 전경·배경 둘 중 하나로 못 박는다. 하지만 박스 경계 패치에는 둘이 섞여 있다. SUTrack은 패치 안에서 박스에 속하는 픽셀 비율 $m_{avg}$ 를 구해 $m_{avg}E_{fg}+(1-m_{avg})E_{bg}$ 를 더한다. 깊이·열·이벤트처럼 RGB보다 단서가 약한 모달에서 구분 정보를 더 정확히 주려는 설계다.'}
],

diagram:{type:'split', cap:'다섯 과제의 입력이 한 가지 토큰 형식으로 합쳐져 같은 인코더와 같은 헤드를 지난다.',
 from:{t:'통합 입력 토큰', s:'6채널 패치 + 언어'},
 branches:[{t:'RGB', s:'채널 복제'},{t:'RGB-Depth', s:'6채널'},{t:'RGB-Thermal', s:'6채널'},{t:'RGB-Event', s:'6채널'},{t:'RGB-Language', s:'CLIP 토큰'}],
 join:'하나의 인코더 + 중심 기반 헤드'},

math:[
 {expr:'E_adj(k) = E(k) + m_avg(k) E_fg + (1 - m_avg(k)) E_bg',
  tex:'E_{adj}^{(k)}=E^{(k)}+m_{avg}^{(k)}\\,E_{fg}+\\big(1-m_{avg}^{(k)}\\big)\\,E_{bg}',
  d:'$k$ 번째 템플릿 패치의 임베딩에 전경·배경 타입 임베딩을 박스 포함 비율 $m_{avg}$ 로 섞어 더한다. 검색 영역 패치에는 검색 타입 임베딩 $E_{search}$ 하나만 더한다.'},
 {expr:'L = L_class + λG L_IoU + λL1 L_L1 + L_task',
  tex:'L=L_{class}+\\lambda_G L_{IoU}+\\lambda_{L1}L_{L1}+L_{task},\\quad \\lambda_G=2,\\ \\lambda_{L1}=5',
  d:'OSTrack과 같은 focal·GIoU·L1 추적 손실에 과제 분류 손실만 더했다. 매 배치에 다섯 과제의 데이터를 섞어 한 번에 학습한다.'}
],

numbers:[
 {k:'LaSOT · AUC (B384 / L384 / B224)', v:'74.4 / 75.2 / 73.2', d:'Table 2. SUTrack-B384는 같은 크기급 ODTrack-B384(73.2)보다 +1.2. TrackingNet 86.5, GOT-10k AO 79.3(B384)'},
 {k:'다중 모달 SOTA 예 (L384)', v:'VOT-RGBD22 EAO 76.6, DepthTrack F 66.4, LasHeR AUC 61.9(L224도 61.9)', d:'Table 4~5. SeqTrackv2-L384는 각각 74.8, 62.3, 61.0'},
 {k:'RGB-Language · TNL2K AUC (L384)', v:'67.9', d:'Table 7. 직전 비교 대상 OneTracker는 58.0'},
 {k:'경량 모델 SUTrack-T224', v:'LaSOT 69.6 · 100 fps(2080Ti) · CPU 23 · AGX 34 fps', d:'Table 1·3. 엣지에서 VOT 실시간 기준(20 fps)을 넘는다'},
 {k:'Multi-Task → Single-Task (B224 ablation)', v:'평균 -7.8', d:'Table 8. VOT-RGBD22 EAO가 76.5에서 57.0으로, LasHeR 59.9에서 50.1로 하락. 데이터가 적은 과제일수록 통합의 이득이 크다'},
 {k:'과제 인식 보조 학습 제거', v:'평균 -0.4', d:'Table 8. soft→hard 타입 임베딩은 -0.3, 타입 임베딩 제거는 -0.6'}
],

impact:'SUTrack은 "추적은 과제마다 모델을 따로 만든다"는 관행에 대해, 입력 인터페이스만 통일해도 한 모델이 다섯 과제에서 과제 전용 모델과 같거나 더 높은 성능을 낸다는 증거를 제시했다. 특히 데이터가 적은 깊이·열·이벤트 과제는 RGB 데이터와 함께 학습할 때 크게 좋아졌다(Single-Task ablation). 크기별(T/B/L)·해상도별 5개 변형을 내놓아 엣지 장치부터 고성능 GPU까지 한 계열로 덮었다.',

legacy:[
 '**토큰 타입 임베딩 계보**: [LoRAT](#/p/lorat)이 도입한 전경·배경 구분을 soft 가중합으로 일반화했다',
 '**통합 수준의 구분**: 논문은 Table 9에서 프레임워크 수준 통합과 모델 수준 통합을 나눠 SeqTrackv2·OneTracker·SDSTrack·UnTrack·ViPT를 정리하고, 다섯 과제를 모델 수준에서 통합한 사례로 자신을 제시한다',
 '**인터페이스 통일 전략**: 모달리티별 브랜치를 붙이는 대신 입력 형식을 맞춰 단순한 단일 스트림 구조를 유지하는 접근이다'
],

pitfalls:[
 '**"하나의 모델"은 과제별 모델이 필요 없다는 뜻이지 체크포인트가 하나라는 뜻이 아니다.** 인코더 크기와 해상도에 따라 L384·L224·B384·B224·T224 다섯 변형이 있다.',
 '**언어 과제를 쓰지 않으면 CLIP-L 텍스트 인코더(약 85M)는 필요 없지만, 표의 파라미터 수에는 "+85"로 따로 표기된다.** 모델 크기를 비교할 때 이 항목을 포함하는지 확인해야 한다.',
 '**RGB 단독 벤치마크에서 항상 1위는 아니다.** LaSOText에서 SUTrack-L384(AUC 53.6)는 LoRAT-L378(56.6)에 뒤져 논문 본문이 "second-best"라고 적는다. RGB와 보조 모달을 따로 패치 임베딩하는 분리 표현은 평균 +0.9로 더 좋지만 연산이 거의 2배라 기본값으로 채택하지 않았다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'왼쪽 아래의 입력부터 읽는다. 템플릿·검색 이미지는 RGB와 D/T/E 이미지를 채널로 이어 한 번에 패치 임베딩하고, 언어는 텍스트 인코더의 토큰 하나로 합류한다. 오른쪽 위 "Task Recognition" 분기는 학습 중에만 켜진다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'SUTrack demonstrates that a single model with a unified input representation can effectively handle various common SOT tasks, eliminating the need for task-specific designs and separate training sessions.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2412.19138 — SUTrack', u:'https://arxiv.org/abs/2412.19138'},
 {t:'GitHub — chenxin-dlut/SUTrack', u:'https://github.com/chenxin-dlut/SUTrack'}
]
});
