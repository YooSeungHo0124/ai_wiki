WIKI.paper({
slug:'vitpose',
venue:'NeurIPS 2022',
authors:'Xu, Zhang, Zhang, Tao (U. Sydney · JD Explore Academy)',
arxiv:'2204.12484',

tldr:'자세 추정 전용으로 설계된 정교한 구조들을 **평범한 비계층적 ViT + 가벼운 디코더** 하나로 능가한다는 것을 보인 논문. "이 태스크는 특수한 구조가 필요하다"는 통념을 정면으로 반박한다.',

context:'2022년 초 자세 추정의 transformer 계열은 대부분 CNN이 특징을 뽑고 transformer가 이를 다듬는 하이브리드였다. TokenPose·TransPose는 CNN이 뽑은 특징을 encoder-only transformer로 정제했고, `[HRNet](#/p/hrnet)`을 그대로 transformer로 옮긴 HRFormer는 다중해상도 병렬 가지를 유지한 채 각 단계에서 feature를 융합했다. 셋 다 "CNN이 필요하거나, transformer 구조를 태스크에 맞춰 정교하게 설계해야 한다"는 전제를 공유했다. 저자들은 반대로 묻는다 — **아무 도메인 지식도 없는 평범한 ViT만으로 이 태스크가 되는가?**',

ideas:[
 {h:'구조는 ViT 그대로, 디코더만 얹는다',
  lead:'비계층적 `[ViT](#/p/vit)` 백본 뒤에 deconv 2개짜리 디코더만 붙인다.',
  d:'입력 사람 이미지를 패치 임베딩한 뒤 표준 transformer 블록(MHSA+FFN)을 그대로 L번 쌓는다. `[HRNet](#/p/hrnet)`처럼 다중 해상도 가지를 두거나 HRFormer처럼 태스크 맞춤 융합 모듈을 넣지 않는다. 디코더는 deconv 2개 + BN/ReLU + 1×1 conv로 heatmap을 뽑는 "classic decoder"가 기본이고, 더 단순화해 4배 bilinear 업샘플 + 3×3 conv 하나로 줄인 "simple decoder"도 성능 저하가 미미하다.'},
 {h:'MAE 사전학습이 구조의 빈틈을 메운다',
  lead:'ImageNet에서 `[MAE](#/p/mae)`로 사전학습한 백본을 얹는 것이 성능의 핵심 전제다.',
  d:'백본을 무작위 초기화 대신 masked image modeling으로 사전학습된 MAE 가중치로 시작한다. 도메인 지식이 구조에 없는 대신, 사전학습이 그 역할을 대신 떠맡는 셈이다. 저자들은 나아가 ImageNet 전체가 아니라 더 작은 비라벨 자세 데이터로 사전학습해도 좋은 초기화가 된다는 것도 보인다.'},
 {h:'모델 크기를 그냥 키우면 성능이 따라온다',
  lead:'ViT-B/L/H/ViTAE-G로 스택 깊이·채널만 늘려도 COCO AP가 단조 증가한다.',
  d:'HRNet 계열은 폭(W32→W48)을 넓혀도 이득이 빠르게 줄지만, ViTPose는 파라미터를 86M(ViTPose-B)에서 632M(ViTPose-H), 나아가 1B(ViTPose-G)까지 늘릴 때 COCO val AP가 75.8→79.1→80.9로 꾸준히 오른다. 저자들은 이를 처리량-정확도의 새 Pareto 전선이라 부른다 — 같은 처리량대에서 기존 CNN·하이브리드보다 항상 위에 있다.'},
 {h:'attention 타입·해상도·학습 방식에 유연하다',
  lead:'윈도우 attention, 여러 입력 해상도, 다중 데이터셋 동시학습에 구조 변경 없이 적응한다.',
  d:'메모리가 부족하면 shifted-window attention으로 바꿔도(구조 자체는 그대로) 성능 손실이 작다. 여러 자세 데이터셋(COCO·AI Challenger·MPII)을 동시에 학습시킬 때도 태스크별 디코더만 갈아 끼우면 되고, 이 추가 비용은 디코더가 가벼워 무시할 만하다. 하나의 백본이 그대로 다목적 자세 추정기가 된다.'},
 {h:'지식 토큰으로 큰 모델의 지식을 작은 모델에 이식',
  lead:'학습 가능한 토큰 하나를 패치 토큰에 덧붙여 teacher의 출력을 흡수시킨다.',
  d:'거대 ViTPose를 teacher로 두고, 작은 student에 별도의 학습 가능한 "지식 토큰"을 입력에 추가한 뒤 이 토큰이 teacher의 heatmap 출력을 재현하도록 증류 손실을 건다. 파라미터를 거의 늘리지 않고도 student의 AP가 오르며, 출력 증류와 결합하면 효과가 더 커진다.'}
],

diagram:{type:'stack', cap:'ViTPose 전체 구조. 인코더는 평범한 ViT를 그대로 L번 반복 쌓은 것뿐이고, 태스크 특화 설계는 디코더 두 층에만 있다.',
 layers:[
  {t:'패치 임베딩', s:'16×16 패치'},
  {t:'Transformer ×L', s:'MHSA+FFN', acc:true, note:'HRNet식 다중해상도 없음'},
  {t:'MAE 사전학습', s:'가중치 초기화'},
  {t:'Deconv ×2', s:'BN·ReLU, 4배 업샘플'},
  {t:'1×1 Conv 예측', s:'17채널 heatmap'}
 ]},

math:[
 {expr:'F_{i+1} = F_i + MHSA(LN(F_i)),   F_{i+1} = F_{i+1} + FFN(LN(F_{i+1}))',
  tex:'F_{i+1}=F_i+\\text{MHSA}(\\text{LN}(F_i)),\\quad F_{i+1}=F_{i+1}+\\text{FFN}(\\text{LN}(F_{i+1}))',
  d:'`[Transformer](#/p/transformer)` 블록 그대로다. 자세 추정을 위한 추가 항이 전혀 없다는 것이 핵심 — 이 식이 백본의 전부다.'},
 {expr:'K = Conv_{1x1}(Deconv(Deconv(F_out)))',
  tex:'K=\\text{Conv}_{1\\times1}(\\text{Deconv}(\\text{Deconv}(F_{out})))',
  d:'classic decoder. 두 번의 deconv로 4배 업샘플한 뒤 1×1 conv로 17개 keypoint의 heatmap $K$를 얻는다.'},
 {expr:'K = Conv_{3x3}(Bilinear(ReLU(F_out)))',
  tex:'K=\\text{Conv}_{3\\times3}(\\text{Bilinear}(\\text{ReLU}(F_{out})))',
  d:'simple decoder. 학습 파라미터가 있는 upsample 층 자체를 없애고 bilinear 보간 하나로 대체해도 classic decoder와 성능 차이가 크지 않다.'}
],

numbers:[
 {k:'COCO test-dev AP', v:'80.9', d:'ViTPose-G(ViTAE-G 백본, 1B 파라미터), 입력 576×432, BigDet 검출기(person AP 68.5) 사용 — 단일모델 기준 기존 17모델 앙상블 UDP++(80.8)를 넘음'},
 {k:'ViTPose-B COCO val AP', v:'75.8', d:'입력 256×192, ViT-B(86M), SimpleBaseline 검출기 사용, 단일 A100·배치64 기준 944 fps'},
 {k:'ViTPose-H COCO val AP', v:'79.1 / 241fps', d:'동일 조건에서 HRFormer-B(75.6 AP·158fps)보다 정확도·속도 모두 우위'},
 {k:'디코더 단순화 손실', v:'< 0.3 AP', d:'ViT 백본에서는 classic→simple 디코더 교체 손실이 미미하지만, 같은 실험을 ResNet-50/152에 적용하면 약 18 AP나 떨어짐 — ViT 표현력이 단순 디코더를 버텨준다는 근거'},
 {k:'모델 스케일 범위', v:'86M → 1B', d:'ViTPose-B/L/H/G(ViTAE-G) 전 구간에서 AP가 단조 증가'}
],

impact:'자세 추정 분야에 "정교한 태스크 특화 구조가 필요하다"는 전제를 깼다. 사전학습(특히 `[MAE](#/p/mae)`)만 충분하면 평범한 `[ViT](#/p/vit)`가 손으로 설계한 multi-resolution·cross-attention 구조를 능가한다는 것을 수치로 증명했고, 이는 이후 dense prediction 태스크 전반에서 "백본은 범용 ViT, 태스크 특화는 가벼운 헤드로"라는 설계 원칙을 다시 확인시켰다. 실용적으로는 동일 백본으로 다중 데이터셋·다중 태스크를 헤드 교체만으로 처리하는 흐름을 넓혔다.',

legacy:[
 '**단순 baseline의 재확인** — BERT·ViT가 이미 증명한 "사전학습 + 평범한 구조" 공식이 dense prediction(픽셀 단위 위치 예측) 태스크에서도 통한다는 것을 보여준 사례로 자주 인용됨',
 '**엔지니어링 후속작으로 이어짐** — 학술적 단순성 증명 이후 `[RTMPose](#/p/rtmpose)` 같은 연구는 반대 방향에서 "실배포에 맞게 가볍고 빠르게" 만드는 쪽으로 문제를 옮김',
 '**지식 토큰 증류** — 별도 모듈 없이 학습 가능한 토큰 하나로 teacher-student 지식 이전을 수행하는 방식이 이후 경량화 파생 연구(ViTPose++)에 재사용됨',
 '**멀티태스크 헤드 패턴** — 하나의 백본에 태스크별 디코더만 붙이는 구조가 이후 다양한 dense prediction 멀티태스크 설계의 표준 패턴으로 반복 사용됨'
],

pitfalls:[
 '**top-down 방식이라 검출기 성능이 AP에 섞인다.** ViTPose는 사람 검출기(val: SimpleBaseline, test-dev의 최고 성능: BigDet, person AP 68.5)가 먼저 사람을 잘라내고, 그 안에서만 keypoint를 추정한다. 따라서 80.9 AP라는 수치는 ViTPose 자체의 실력과 검출기 실력이 합쳐진 값이며, 더 좋은 검출기로 바꾸면 같은 모델이라도 AP가 오른다.',
 '**"단순함"은 인코더에 한정된다.** 디코더·사전학습·학습 스케줄까지 전부 단순한 것은 아니다 — MAE 사전학습, UDP 후처리, AdamW+210 epoch 학습 등 성능에 기여하는 요소가 여러 겹 있고, 인코더 구조만 단순화한 것이라는 점을 논문도 명시한다.',
 '**속도 수치의 비교 조건이 제각각이다.** Table 9의 fps는 전부 단일 A100·배치64로 통일했지만, 입력 해상도(256×192 vs 384×288)와 feature 해상도(1/16 vs 1/4)가 모델마다 달라 같은 "fps" 숫자를 단순 비교하면 왜곡된다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'(a) 인코더는 패치 임베딩 뒤 Transformer Block을 L번 반복하는 것이 전부 — 다중 해상도 가지가 없다. (b) 블록 내부는 표준 LN→MHSA→잔차, LN→FFN→잔차. (c)(d) 디코더 두 변형: deconv 2개짜리 classic과 bilinear 업샘플 하나짜리 simple. (e) 데이터셋마다 디코더만 갈아끼워 멀티태스크를 처리.',
  src:'원문 Figure 2, p.4'},
 {f:'fig1-throughput.png',
  cap:'x축 처리량(fps), y축 COCO val AP, 원 크기가 파라미터 수. ViTPose 계열(주황)이 HRNet·HRFormer·TokenPose(파랑·연두 계열)보다 같은 처리량대에서 더 높은 AP에 위치 — 이것이 "새 Pareto 전선"의 근거.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'Although no specific domain knowledge is considered in the design, plain vision transformers have shown excellent performance in visual recognition tasks.',
  src:'Abstract, p.1'},
 {t:'It should be noted that this paper does not claim the algorithmic superiority but rather presents a simple and solid transformer baseline with superior performance for pose estimation.',
  src:'Introduction, p.2'}
],

links:[
 {t:'arXiv 2204.12484 — ViTPose', u:'https://arxiv.org/abs/2204.12484'},
 {t:'GitHub — ViTAE-Transformer/ViTPose', u:'https://github.com/ViTAE-Transformer/ViTPose'}
]
});
