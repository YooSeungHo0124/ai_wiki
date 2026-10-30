WIKI.paper({
slug:'jde',
venue:'ECCV 2020',
authors:'Wang, Zheng, Liu, Li, Wang (Tsinghua · ANU)',
arxiv:'1909.12605',

tldr:'검출기와 외형 임베딩(re-ID) 모델을 **하나의 단일 단계(single-shot) 네트워크**로 합쳐, 한 번의 forward 로 박스와 임베딩을 동시에 뽑는 MOT 시스템. 검출과 임베딩을 따로 돌리던 방식(SDE)의 속도 병목을 없애 22 FPS 안팎의 준실시간 추적을 보였다.',

context:'당시 주류인 [DeepSORT](#/p/deepsort) 류 tracking-by-detection 은 검출기 하나와 re-ID 모델 하나, 두 개의 무거운 네트워크를 순서대로 돌렸다. 저자들은 이를 SDE(Separate Detection and Embedding)라 부르며, 전체 추론 시간이 두 부품의 합이고 화면 속 인원이 많을수록 re-ID 비용이 커진다고 지적한다. Faster R-CNN 의 두 번째 단계를 임베딩 헤드로 바꾸는 two-stage 대안은 속도가 10 FPS 미만에 머물렀다. 기존 "실시간 MOT" 연구들도 연결 단계만 빠르게 만들었을 뿐 검출기 시간은 제외한 경우가 많았다.',

ideas:[
 {h:'검출과 임베딩을 한 네트워크에서',
  lead:'FPN 구조의 예측 헤드가 박스 분류·회귀와 함께 D 차원 임베딩 맵을 같이 출력한다.',
  d:'백본의 1/32·1/16·1/8 세 스케일 특징을 위에서 아래로 융합하고, 각 스케일의 예측 헤드가 $(6A+D)\\times H\\times W$ 맵을 낸다. 이 맵은 박스 분류 $2A$, 박스 회귀 $4A$, 임베딩 $D$ 채널로 나뉜다. 검출된 박스의 임베딩은 같은 forward 에서 이미 계산돼 있으므로 박스마다 crop 해 re-ID 망을 다시 돌릴 필요가 없다.'},
 {h:'임베딩은 cross-entropy 로 학습',
  lead:'triplet 대신 아이덴티티 분류 손실을 쓰면 임베딩 품질(TPR)이 크게 좋아진다.',
  d:'전경 앵커의 임베딩을 공유 FC 층에 통과시켜 ID 클래스 로짓을 만들고 cross-entropy 를 건다. 신원 라벨이 없는 전경(라벨 -1)은 임베딩 손실에서 제외한다. Table 3 에서 같은 설정으로 triplet 계열(TPR 42~44)보다 cross-entropy 가 88.2 로 압도적이었다. 저자들은 원인으로, 미니배치 안의 샘플 negative 만 밀어내는 triplet 과 달리 모든 negative 클래스를 한꺼번에 밀어낸다는 점을 든다.'},
 {h:'태스크 불확실성으로 손실 자동 가중',
  lead:'분류·회귀·임베딩 세 손실의 크기가 달라서, 학습 가능한 불확실성 파라미터로 가중치를 맞춘다.',
  d:'세 손실을 고정 가중치로 합치면(Uniform) 임베딩 손실이 지배해서 검출이 무너진다(AP 6.8). 손으로 탐색한 근사 최적 가중치(App.Opt)도 쓸 만하지만, task-dependent uncertainty 방식이 AP 83.0, MOTA 65.8 로 그것을 넘었다. 이 논문은 이를 스케일마다 헤드별 손실에 적용한다.'},
 {h:'단순한 온라인 연결',
  lead:'외형 코사인 거리와 모션 마할라노비스 거리를 섞어 헝가리안 한 번으로 매칭한다.',
  d:'트랙은 외형 상태 $e_i$ 와 칼만 필터 모션 상태를 갖고, 비용은 외형·모션 친화도의 가중합으로 만든다. 외형 상태는 모멘텀 $\\alpha=0.9$ 로 갱신하고, 2프레임 연속 나타나야 새 트랙이 되며, 30프레임 갱신이 없으면 종료한다. 캐스케이드 매칭 대신 프레임당 한 번 매칭하고 짧게 놓친 트랙은 풀(pool)에 보관한다. 벡터화한 칼만 필터가 높은 FPS 에 필수였다고 한다.'},
 {h:'여섯 데이터셋을 합친 학습셋',
  lead:'검출 전용과 ID 라벨 보유 데이터셋 6개를 섞어, 일부만 ID 가 있는 부분 라벨 학습을 한다.',
  d:'ETH·CityPersons(박스만)와 CalTech·MOT16·CUHK-SYSU·PRW(박스+ID)를 합쳐 박스 270K, ID 8.7K 인 학습셋을 만들었다. 작은 데이터셋 결과가 큰 데이터에서도 유지되지 않을 수 있다는 이유다. 이 데이터 구성은 후속 [FairMOT](#/p/fairmot) 이 같은 학습셋을 그대로 가져다 쓴다.'}
],

diagram:{type:'compare', cap:'SDE 는 검출 뒤 박스마다 crop 해 임베딩 모델을 다시 돌리고, JDE 는 한 번의 forward 로 박스와 임베딩을 같이 낸다.',
 left:{t:'SDE (분리 방식)', items:['검출기 → crop → re-ID 망','시간 = 두 모델의 합','사람이 많을수록 re-ID 느려짐','부품마다 따로 학습']},
 right:{t:'JDE (단일 네트워크)', items:['한 번의 forward','박스 + 임베딩 동시 출력','임베딩 비용이 인원과 무관','손실 자동 가중으로 공동 학습']}},

math:[
 {expr:'L_total = Σ_i Σ_{j∈{α,β,γ}} ½ ( e^{-s_j^i} L_j^i + s_j^i )',
  tex:'L_{total}=\\sum_{i}^{M}\\sum_{j=\\alpha,\\beta,\\gamma}\\frac{1}{2}\\left(\\frac{1}{e^{s_j^i}}L_j^i+s_j^i\\right)',
  d:'$M$ 개 예측 헤드마다 분류($\\alpha$)·회귀($\\beta$)·임베딩($\\gamma$) 손실에 학습 가능한 $s_j^i$ 를 둔다. 손실이 큰 태스크는 $e^{-s}$ 로 자동 감쇠되고, $+s$ 항이 모든 가중치가 0 으로 가는 자명해를 막는다.'},
 {expr:'C = λ A_e + (1-λ) A_m,  e_i^t = α e_i^{t-1} + (1-α) f_i^t',
  tex:'C=\\lambda A_e+(1-\\lambda)A_m,\\qquad e_i^{t}=\\alpha\\,e_i^{t-1}+(1-\\alpha)\\,f_i^{t}',
  d:'외형 친화도 $A_e$ 는 코사인 유사도, 모션 친화도 $A_m$ 는 마할라노비스 거리로 만들고 헝가리안으로 푼다. 매칭된 트랙의 외형 상태를 모멘텀($\\alpha=0.9$)으로 갱신한다.'}
],

numbers:[
 {k:'MOT-16 테스트 (1088×608)', v:'MOTA 64.4 / IDF1 55.8', d:'Table 4, private 데이터 프로토콜. 전체 시스템 22.2 FPS, ID 스위치 1,544'},
 {k:'MOT-16 테스트 (864×408)', v:'MOTA 62.1 / 30.3 FPS', d:'Table 4. 해상도를 낮추면 속도가 오르고 MOTA 는 2.6%p 하락'},
 {k:'임베딩 손실 비교', v:'TPR 88.2 (CE) vs 42.2 (triplet)', d:'Table 3, TPR@FAR=0.1. 같은 가중치 설정(App.Opt)에서 cross-entropy 가 triplet 대비 +46.0'},
 {k:'손실 가중 전략', v:'Uncertainty MOTA 65.8', d:'Table 3. Uniform 36.9, 근사 최적 App.Opt 64.3 (검증 세트)'},
 {k:'합친 학습셋', v:'박스 270K · ID 8.7K', d:'Table 2, 데이터셋 6개 합계, 이미지 54K'}
],

impact:'JDE 는 "검출과 re-ID 를 한 네트워크에서"라는 구조를 MOT 에서 실용적인 기준선으로 만들었다. 이후 [FairMOT](#/p/fairmot) 은 JDE 의 앵커 기반 설계가 re-ID 를 소홀히 한다고 분석해 앵커 없는 [CenterNet](#/p/centernet) 위로 옮겼다. 저자들은 JDE 의 IDF1 이 낮은 이유를 임베딩이 약해서가 아니라 사람이 겹칠 때 박스가 흔들려 ID 스위치가 생기는 데서 찾았다.',

legacy:[
 '**[FairMOT](#/p/fairmot)** — JDE 의 앵커 기반 공동 학습을 앵커 프리·저차원 임베딩으로 고쳐 같은 학습셋에서 MOTA·IDF1 을 크게 올림',
 '**joint detection and embedding 계열** — 검출과 임베딩을 한 모델에서 내는 one-shot 트래커라는 갈래의 기준 구현',
 '**통합 학습셋과 설정** — 6개 데이터셋 합본과 TPR·AP·MOTA 3종 평가 설정이 후속 연구에서 재사용됨'
],

pitfalls:[
 '**속도 숫자가 글 안에서 다르다.** 초록은 22~40 FPS, 서론은 20.2 FPS, Table 4 는 22.2 FPS(1088×608)와 30.3 FPS(864×408)다. 또 FPS 에는 GPU 검출과 연결이 포함되지만 SDE 쪽 숫자는 상한 추정치다.',
 '**ID 스위치가 많고 IDF1 이 낮다.** MOTA 는 경쟁 방법과 비슷해도 JDE 의 IDF1(55.8)과 ID 스위치(1,544)는 비교 대상보다 나쁘다. 저자들은 밀집 장면에서 박스가 흔들리는 탓으로 분석한다.',
 '**private 데이터 프로토콜의 수치다.** JDE 는 MOT-16 학습셋 외에 추가 데이터를 쓰므로 공개 검출을 쓰는 [Tracktor](#/p/tracktor) 등과 공정하게 비교할 수 없다.'
],

figures:[
 {f:'fig1-sde-vs-jde.png',
  cap:'(a) SDE 는 검출 뒤 박스 픽셀을 재샘플링해 별도 임베딩 모델에 넣고, (b) two-stage 는 특징맵을 재샘플링하며, (c) JDE 는 검출 결과와 임베딩을 한 번에 낸다. 재샘플링 단계가 없어지는 부분을 보면 된다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-architecture.png',
  cap:'(a) 백본의 세 스케일 특징을 융합해 각 스케일에 예측 헤드를 붙인다. (b) 헤드 안에서 분류·회귀·임베딩 세 손실이 각자의 불확실성 항을 거쳐 하나의 Fused Loss 로 합쳐진다.',
  src:'원문 Figure 2, p.5'}
],

quotes:[
 {t:'Specifically, we incorporate the appearance embedding model into a single-shot detector, such that the model can simultaneously output detections and the corresponding embeddings.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1909.12605 — Towards Real-Time Multi-Object Tracking', u:'https://arxiv.org/abs/1909.12605'},
 {t:'공식 코드 (Zhongdao/Towards-Realtime-MOT)', u:'https://github.com/Zhongdao/Towards-Realtime-MOT'}
]
});
