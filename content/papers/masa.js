WIKI.paper({
slug:'masa',
venue:'CVPR 2024',
authors:'Li et al. (ETH Zürich · INSAIT)',
arxiv:'2406.04221',

tldr:'추적 라벨 없이 **정지 이미지와 SAM의 마스크만으로** 인스턴스 매칭용 임베딩을 학습한다. 이를 어댑터로 SAM·Detic·Grounding-DINO에 붙이면, 도메인 영상으로 학습한 트래커와 맞먹는 zero-shot 연관 성능이 나온다.',

context:'[ByteTrack](#/p/bytetrack) 등 최신 트래커는 검출이 좋아진 뒤 남은 병목이 연관(association)이라고 보고 인스턴스 임베딩을 학습한다. 그런데 이 임베딩은 영상에 ID를 일일이 붙인 MOT 데이터로 학습하며, 그런 데이터는 소수의 고정 카테고리와 한정된 도메인에 치우쳐 있다. 검출·분할은 파운데이션 모델 덕에 "아무 물체"를 다루게 되었지만 연관 모델은 여전히 도메인에 묶여 있었다. 이 논문의 질문은 영상 라벨 없이 어떤 물체든 프레임 사이에서 맞춰 주는 연관 모델을 만들 수 있느냐는 것이다.',

ideas:[
 {h:'같은 이미지의 두 뷰로 만드는 자기 지도 신호',
  lead:'한 장을 서로 다르게 증강하면 픽셀 대응이 공짜로 생기고, 이것이 영상 속 외형 변화를 흉내 낸다.',
  d:'이미지 $I$ 에 강한 증강 $\\phi(\\cdot)$, $\\varphi(\\cdot)$ 를 각각 적용해 두 뷰를 만들면 두 뷰의 픽셀 대응은 변환식에서 자동으로 알 수 있다. 영상 라벨이 필요 없으므로 SA-1B에서 뽑은 50만 장(SA-1B-500K)처럼 도메인이 다양한 정지 이미지를 그대로 쓸 수 있다.'},
 {h:'SAM으로 픽셀 대응을 인스턴스 대응으로 승격',
  lead:'SAM이 같은 인스턴스의 픽셀을 묶어 주므로, 한 이미지의 모든 마스크가 곧 매칭 후보가 된다.',
  d:'SAM의 everything 모드가 이미지 안의 마스크를 빠짐없이 뽑는다. 이 마스크 각각에 같은 증강을 적용하면 두 뷰 사이의 인스턴스 대응이 정해진다. 한 장에 인스턴스가 많은 이미지를 골랐기 때문에 한 번에 많은 negative가 따라온다. 단일 객체 중심의 ImageNet식 프레임 수준 유사도로는 이런 다중 객체 장면을 구분하기 어렵다는 것이 저자들의 비교 실험이다.'},
 {h:'대조 학습으로 판별적인 임베딩 공간을 만든다',
  lead:'같은 인스턴스의 두 뷰는 가깝게, 다른 인스턴스는 멀게 밀어낸다.',
  d:'positive는 같은 마스크에 서로 다른 증강을 적용한 쌍, negative는 다른 인스턴스이다. 유사도는 코사인 유사도이고 온도 $\\tau=0.07$ 이다. 이는 QDTrack류 밀집 대조 학습과 같은 형태의 손실이지만, 학습 데이터가 라벨이 아니라 SAM 마스크에서 나온다는 점이 다르다.'},
 {h:'MASA 어댑터: 얼린 백본 위에 얹는 범용 트래커',
  lead:'SAM·Detic·Grounding-DINO의 백본은 고정하고, 추적용 특징만 따로 변환해 학습한다.',
  d:'백본 특징을 다중 스케일 피라미드로 만들고 deformable convolution(DyHead 방식)으로 위치 간 정보를 섞는다. RoI-Align으로 뽑은 인스턴스 특징은 4개 conv와 1개 FC의 track head가 임베딩으로 바꾼다. 백본이 고정이라 원래의 검출·분할 능력은 그대로 남는다.'},
 {h:'검출 지식 증류: SAM everything 모드를 빠르게',
  lead:'보조 detection head가 SAM이 만든 박스를 배워 두면 격자 점 프롬프트가 필요 없어진다.',
  d:'학습 때 RCNN 검출 헤드가 SAM 마스크를 감싸는 박스를 따라 배운다. 이 증류 덕에 추적 특징도 좋아지고, SAM을 쓸 때는 이 박스를 프롬프트로 넘겨 후처리 무거운 everything 모드를 대체한다. 추론 시 연관은 bi-softmax 최근접 이웃 탐색으로 단순하게 한다.'}
],

diagram:{type:'flow', cap:'MASA의 학습 흐름. 라벨 없는 이미지에서 두 뷰와 SAM 마스크를 만들고, 인스턴스 단위 대조 학습으로 어댑터를 학습한다.',
 nodes:[
  {t:'무라벨 이미지', s:'SA-1B-500K'},
  {t:'두 뷰 증강', s:'픽셀 대응 확보', a:'SAM'},
  {t:'SAM 마스크', s:'인스턴스 대응으로 승격'},
  {t:'MASA 어댑터', s:'대조 학습 + 증류', acc:true},
  {t:'zero-shot 추적', s:'어떤 검출기든'}
 ]},

math:[
 {tex:'L_C=-\\sum_{q\\in Q}\\log\\frac{e^{\\,\\text{sim}(q,q^{+})/\\tau}}{e^{\\,\\text{sim}(q,q^{+})/\\tau}+\\sum_{q^{-}\\in Q^{-}}e^{\\,\\text{sim}(q,q^{-})/\\tau}}',
  expr:'L_C = -Σ log( e^{sim(q,q+)/τ} / (e^{sim(q,q+)/τ} + Σ e^{sim(q,q-)/τ}) )',
  d:'인스턴스 대조 손실. $q$ 는 인스턴스 임베딩, $q^{+}$ 는 같은 인스턴스의 다른 뷰, $q^{-}$ 는 다른 인스턴스, sim은 코사인 유사도, $\\tau=0.07$ 이다. 전체 손실은 검출 손실과의 합 $L=L_{det}+L_C$ 이다.'}
],

numbers:[
 {k:'TAO TETA · AssocA (같은 검출 입력)', v:'Grounding-DINO 기반 37.6 (TETer 36.7)', d:'영상 라벨 없이 zero-shot으로 완전 지도학습 TETer를 AssocA·TETA(34.9 대 34.6)에서 근소하게 앞선다'},
 {k:'TAO TETA · 통합 Detic 모델 TETA', v:'46.3', d:'검출까지 한 모델이 낸 값. 같은 표의 TETer는 34.6이지만 검출 입력이 다른 비교다'},
 {k:'BDD100K MOTS · mIDF1 / AssocA', v:'49.7 / 54.5 (SAM-H)', d:'같은 검출을 쓴 UNINEXT-H는 48.5 / 53.2'},
 {k:'BDD100K MOT · IDF1 / AssocA', v:'71.7 / 52.9', d:'ByteTrack은 70.4 / 51.5. 단 mMOTA는 ByteTrack(45.5)이 MASA(44.6~44.5)보다 높다'},
 {k:'오픈 보캐뷸러리 MOT · TETA (Base / Novel)', v:'47.0 / 40.8', d:'통합 Detic 모델. OVTrack은 36.3 / 32.0'},
 {k:'UVO 비디오 트랙 · AR100', v:'28.4 (SAM-H)', d:'SeqFormer 21.3. 같은 AR100에서 SAM 기본 모드보다 약 10배 빠르다고 보고'}
],

impact:'MASA는 추적 라벨을 요구하던 연관 학습을 "파운데이션 분할 모델이 만든 가짜 대응"으로 대체해, 연관 모델도 파운데이션 모델처럼 도메인에 묶이지 않을 수 있음을 보였다. 같은 어댑터를 서로 다른 검출기에 꽂아 쓰는 구조라서, 검출은 파운데이션 모델에, 연관은 이 어댑터에 맡기는 분업이 가능해졌다. 다만 비교 대상이 연관 지표(AssocA, IDF1)이고, 검출 품질에 민감한 mMOTA 같은 지표에서는 이득이 없거나 오히려 뒤진다.',

legacy:[
 '[SAM](#/p/sam)이 만든 마스크를 추적의 학습 신호로 재활용하는 방향을 보여 준 사례이다',
 '[ByteTrack](#/p/bytetrack) 같은 라벨 의존 연관 모듈을 대체하는 "라벨 없는 외형 임베딩" 계보의 한 갈래가 되었다',
 '[SAM2MOT](#/p/sam2mot)은 MASA를 분할을 연관의 보조 외형 단서로만 쓰는 접근으로 분류하고, 이와 달리 분할을 추적의 중심에 놓겠다고 주장한다',
 '검출기를 바꿔 끼우는 범용 어댑터라는 구조는 이후 open-vocabulary 추적 연구의 베이스라인으로 쓰이기 좋다'
],

pitfalls:[
 '**"추적 라벨이 전혀 필요 없다"는 연관 학습에 한정된다.** 검출기(Detic·Grounding-DINO)와 SAM은 이미 라벨로 학습된 모델이며, 주 비교 표도 같은 검출을 입력으로 줘서 연관 능력만 잰다.',
 '**표의 두 종류 수치를 섞지 말 것.** "† 같은 검출 입력"과 "통합 모델(자체 검출)"은 비교 조건이 다르고, 통합 Detic의 큰 수치는 검출 능력이 함께 반영된 것이다.',
 '**검출 의존적인 지표에서는 우위가 아니다.** BDD100K MOT에서 ByteTrack은 저점수 박스까지 쓰는 덕에 mMOTA가 더 높다고 논문도 인정한다.'
],

figures:[
 {f:'fig1-pipeline.png',
  cap:'맨 위가 도메인이 다양한 무라벨 이미지 묶음. 한 장에 두 증강을 걸어 픽셀 대응(왼쪽)을 만들고, 얼린 SAM이 이를 인스턴스 대응(오른쪽)으로 바꾼다. 아래의 밀집 유사도 학습에서 초록선이 positive, 붉은선이 negative로 MASA 어댑터를 학습한다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'We treat the SAM outputs as dense object region proposals and learn to match those regions from a vast image collection.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2406.04221 — MASA', u:'https://arxiv.org/abs/2406.04221'},
 {t:'GitHub — siyuanliii/masa', u:'https://github.com/siyuanliii/masa'}
]
});
