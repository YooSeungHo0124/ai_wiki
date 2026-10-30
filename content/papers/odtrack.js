WIKI.paper({
slug:'odtrack',
venue:'AAAI 2024',
authors:'Zheng, Zhong et al. (Guangxi Normal Univ. · Wuzhou Univ. · HIT)',
arxiv:'2401.01686',

tldr:'참조 프레임 1장·검색 프레임 1장짜리 이미지 쌍 입력을 버리고, 영상 클립을 통째로 넣어 **프레임마다 하나씩 만든 시간 토큰(temporal token)** 을 다음 프레임으로 넘기는 비디오 수준 단일 객체 추적기. 별도의 온라인 템플릿 갱신 규칙 없이 LaSOT AUC 73.2(ViT-B)를 기록했다.',

context:'[OSTrack](#/p/ostrack)·[MixFormer](#/p/mixformer) 같은 트랜스포머 추적기는 참조 프레임과 검색 프레임 한 쌍을 한 번에 백본에 넣고 박스를 뽑는다. 이 방식은 이미지 쌍 단위로만 상호작용하므로 표적이 시간에 따라 어떻게 움직이고 변하는지를 직접 보지 못한다. 시간 정보를 넣으려는 시도는 있었지만 대부분 템플릿 갱신 브랜치(품질 점수 예측)나 갱신 규칙 같은 별도 장치에 의존했다. 저자들은 이 병목을 "샘플링이 희소하다(프레임 2장)"와 "매칭이 오프라인 이미지 쌍에 갇혀 있다"로 정리한다.',

ideas:[
 {h:'입력을 이미지 쌍에서 비디오 클립으로',
  lead:'넓은 구간에서 프레임 여러 장을 뽑아 임의 길이의 클립을 모델에 넣는다.',
  d:'기존 학습은 50·100·200프레임 같은 짧은 간격에서 이미지 쌍을 뽑는다. ODTrack은 더 큰 샘플링 구간을 잡고 그 안에서 참조 프레임 $R_1..R_k$ 와 검색 프레임 $S_1..S_n$ 을 무작위로 뽑아 클립을 만든다. 학습에서는 참조 3장(192×192)과 검색 2장(384×384)을 쓰고, 추론에서도 참조 프레임 3장을 같은 간격으로 넣는다.'},
 {h:'시간 토큰을 프레임마다 만들어 다음 프레임으로 전달',
  lead:'각 프레임의 표적 정보를 토큰 하나로 압축해 자기회귀 방식으로 이어 붙인다.',
  d:'프레임 $t$ 에서 나온 시간 토큰 $T_t$ 를 비어 있는 토큰 $T_{empty}$ 에 더해 $T_{t+1}$ 로 만들고, 이것을 다음 프레임의 입력 프롬프트로 쓴다. 저자들은 이 토큰이 표적의 외형·위치·궤적 정보를 암묵적으로 실어 나른다고 설명한다. 토큰을 되먹이는 구조라서 템플릿 갱신 브랜치나 갱신 규칙이 필요 없다.'},
 {h:'두 가지 토큰 어텐션: 연결형 vs 분리형',
  lead:'토큰을 어텐션 입력에 이어 붙이는 방식과 세 갈래로 쪼개는 방식을 비교한다.',
  d:'연결형(concatenated)은 $[R_1..R_k, S_t, T_t]$ 를 하나의 시퀀스로 두고 전체 어텐션을 건다. 분리형(separated)은 참조 프레임끼리의 자기 정보 집계, 참조-검색 간 교차 집계, 토큰-비디오 간 교차 집계로 어텐션을 분해해 계산량을 줄인다. 최종 모델은 LaSOT AUC가 더 높은 연결형(72.8)을 기본으로 삼았고, 분리형은 72.2였다.'},
 {h:'ViT 하나로 끝나는 단순한 구조',
  lead:'비디오 트랜스포머를 따로 쓰지 않고 MAE로 초기화한 2D ViT-B를 그대로 쓴다.',
  d:'백본은 [ViT](#/p/vit)이고 MAE 사전학습 가중치로 초기화한다. 헤드는 분류 점수맵·박스 크기·오프셋을 내는 일반적인 컨볼루션 헤드이며 손실은 focal + L1 + GIoU($\\lambda_1=5,\\ \\lambda_2=2$)다. 클립 학습이므로 손실은 검색 프레임마다 따로 계산해 프레임 수로 평균한다.'}
],

diagram:{type:'compare', cap:'기존 이미지 쌍 방식과 ODTrack의 비교. 핵심 차이는 프레임 사이로 흐르는 시간 토큰이다.',
 left:{t:'기존: 이미지 쌍', items:['참조 1장 + 검색 1장','프레임마다 독립 추론','시간 정보는 갱신 규칙에 의존','쌍 단위 오프라인 매칭']},
 right:{t:'ODTrack: 비디오 클립', items:['참조 k장 + 검색 n장','시간 토큰 Tt를 다음 프레임에 전달','갱신 규칙 없이 자기회귀 전파','어텐션 입력 = 프레임 + 토큰']}},

math:[
 {expr:'f_t = Attn([R_1..R_k, S_t, T_t]),  T_{t+1} = T_t + T_empty',
  tex:'f_t=\\text{Attn}\\big([R_1,\\dots,R_k,\\,S_t,\\,T_t]\\big),\\qquad T_{t+1}=T_t+T_{\\text{empty}}',
  d:'프레임 $t$ 의 어텐션은 참조 클립, 현재 검색 프레임, 이전에서 넘어온 시간 토큰을 한 시퀀스로 이어 붙여 계산한다. 갱신된 토큰이 다음 프레임의 입력이 되므로 정보가 프레임 순서대로 전파된다.'},
 {expr:'L = L_cls + λ1 L1 + λ2 L_GIoU',
  tex:'L=L_{cls}+\\lambda_1 L_1+\\lambda_2 L_{GIoU},\\quad \\lambda_1=5,\\ \\lambda_2=2',
  d:'focal loss 분류 항과 L1·GIoU 회귀 항의 합이다. 검색 프레임 각각에 대해 계산한 뒤 검색 프레임 수로 평균한다.'}
],

numbers:[
 {k:'LaSOT · AUC / PNorm / P (ODTrack-B)', v:'73.2 / 83.2 / 80.6', d:'Table 2. ODTrack-L은 74.0 / 84.2 / 82.3. 비교 대상 ARTrack(72.6 / 81.7 / 79.1)을 모두 넘었다'},
 {k:'GOT-10k · AO (ODTrack-B / -L)', v:'77.0 / 78.2', d:'GOT-10k 프로토콜(해당 학습셋만 사용)로 학습. 바로 앞 최고 ARTrack은 75.5'},
 {k:'LaSOText · AUC (ODTrack-B / -L)', v:'52.4 / 53.9', d:'Table 2. ARTrack 51.9, OSTrack 50.5'},
 {k:'속도·연산량 (ViT-B, 384×384, 2080Ti)', v:'32 fps · 73 GFLOPs · 92M', d:'Table 1. 같은 해상도의 SeqTrack-B는 11 fps · 148 GFLOPs · 89M'},
 {k:'토큰 전파 ablation (LaSOT AUC)', v:'w/o Token 71.0 → 분리형 72.2 → 연결형 72.8', d:'Table 4(a). 같은 표의 Baseline은 70.1'},
 {k:'클립 길이 ablation (LaSOT AUC)', v:'길이 2: 72.8, 3: 73.1, 4: 72.5, 5: 72.0', d:'Table 4(b). 길이를 늘린다고 계속 오르지는 않는다'}
],

impact:'ODTrack은 단일 객체 추적에서 "시간 정보를 별도 모듈로 붙이지 않고, 토큰을 프레임 사이로 흘려 보내는 것만으로 해결한다"는 설계를 제시했다. [OSTrack](#/p/ostrack)이 정리한 단일 스트림 ViT 추적기 위에 클립 입력과 시간 토큰이라는 두 요소만 얹었고, 같은 ViT-B 규모에서 LaSOT·GOT-10k·LaSOText 등 여러 벤치마크의 최고 수치를 갱신했다. 구조가 단순해 이후 비디오 수준 추적기의 비교 기준으로 자주 인용된다.',

legacy:[
 '**[SUTrack](#/p/sutrack)** 은 LaSOT·TrackingNet·GOT-10k 표에서 ODTrack-B384(73.2)를 직접 비교 대상으로 삼아 +1.2를 보고했다',
 '**[SAM2Long](#/p/sam2long)·[DAM4SAM](#/p/dam4sam)** 의 VOT 비교표에도 ODTrack(LaSOT 74.0, GOT-10k 78.2)이 박스 추적 기준선으로 올라간다',
 '**시간 정보를 토큰·프롬프트로 전달하는 방식**이 이후 추적기에서 템플릿 갱신 규칙을 대체하는 흐름의 한 사례가 됐다'
],

pitfalls:[
 '**"비디오 수준"이라고 해서 길이 제한이 없는 것은 아니다.** 학습은 참조 3장 + 검색 2장 클립으로 하고, 추론도 참조 3장을 고정 간격으로 쓴다. 클립을 길게 한다고 성능이 계속 오르지도 않는다(길이 4·5에서 AUC가 오히려 내려간다).',
 '**GOT-10k 수치는 해당 학습셋만 쓴 프로토콜 값이다.** LaSOT·TrackingNet 수치와 학습 데이터 구성이 다르므로 같은 모델의 숫자라도 섞어서 비교하면 안 된다.',
 '**VOT2020 EAO 0.581(B)·0.605(L)은 Alpha-Refine 후처리로 마스크를 만든 값이다.** 박스 추적기 단독의 성능이 아니다.'
],

figures:[
 {f:'fig2-framework.png',
  cap:'가로축이 프레임 순서다. 각 프레임마다 참조 클립(왼쪽 위 겹친 프레임)과 검색 프레임이 비주얼 인코더로 들어가고, 토큰 전파 모듈이 박스 결과와 함께 다음 프레임으로 넘길 토큰 T를 낸다. 보라색 화살표가 토큰이 다음 프레임으로 이어지는 경로다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'Notably, we treat each video sequence as a continuous sentence, enabling us to employ language modeling for a comprehensive contextual understanding of the video content.',
  src:'Introduction, p.2'}
],

links:[
 {t:'arXiv 2401.01686 — ODTrack', u:'https://arxiv.org/abs/2401.01686'},
 {t:'GitHub — GXNU-ZhongLab/ODTrack', u:'https://github.com/GXNU-ZhongLab/ODTrack'}
]
});
