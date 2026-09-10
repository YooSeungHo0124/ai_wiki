WIKI.paper({
slug:'florence',
venue:'arXiv 2021 (Microsoft)',
authors:'Yuan, Chen, Chen, Codella et al. (Microsoft Cloud and AI · Microsoft Research)',
arxiv:'2111.11432',

tldr:'`[CLIP](#/p/clip)`이 이미지-텍스트 정렬 하나에 집중했다면, Florence는 비전 foundation model이 커버해야 할 문제를 **공간(장면→객체)·시간(정지→영상)·모달리티(RGB→깊이 등)** 세 축의 공간으로 정의하고, 하나의 사전학습 backbone에 어댑터를 갈아 끼워 그 공간 전체를 커버하려 한 논문이다.',

context:'2021년의 `[CLIP](#/p/clip)`·ALIGN은 웹 규모 이미지-텍스트 대조학습으로 zero-shot 분류와 검색에서 강력했지만, 딱 거기까지였다 — 객체 탐지처럼 영역 단위 인식이 필요한 과제, 영상처럼 시간 축이 있는 과제, 깊이 추정처럼 RGB가 아닌 모달리티를 다루는 과제로는 그대로 확장되지 않았다. 저자들은 "컴퓨터 비전의 foundation model이란 무엇인가"라는 질문에, NLP처럼 하나의 축(언어)이 아니라 비전 과제들이 흩어져 있는 **다차원 공간**을 먼저 정의해야 한다고 답한다. Florence의 질문은 CLIP류의 대조학습 backbone 하나를 두고, 그 위에 **어댑터만 바꿔 끼우면** 이 공간 전체를 커버할 수 있는가이다.',

ideas:[
 {h:'Space-Time-Modality: 비전 과제의 좌표계',
  lead:'객체 탐지·영상 인식·깊이 추정을 각각 공간·시간·모달리티 축의 확장으로 본다.',
  d:'**공간(Space)**은 장면 수준 분류(coarse)에서 객체 탐지·분할(fine-grained)로, **시간(Time)**은 정지 이미지(static)에서 행동 인식·추적(dynamic)으로, **모달리티(Modality)**는 RGB 단일 입력에서 캡션·깊이 같은 다중 감각(multi-sense)으로 뻗는다. Florence는 비전 foundation model을 "이 세 축의 공간 전체에서 최소한의 커스터마이징으로 동작하는 사전학습 모델과 그 어댑터"로 정의한다.'},
 {h:'CoSwin backbone + UniCL 사전학습',
  lead:'`[Swin](#/p/swin)`의 계층적 구조에 통합 이미지-텍스트 대조 손실(UniCL)을 적용한다.',
  d:'이미지 encoder로 `[Swin](#/p/swin)` 계열의 계층적 Transformer(CoSwin, 최대 637M 파라미터의 CoSwin-H)를 쓰고, 텍스트 encoder와 함께 **UniCL(Unified Contrastive Learning)**로 사전학습한다. UniCL은 같은 언어 설명(해시로 판별)을 가진 이미지들을 하나의 라벨로 묶어 image-to-text·text-to-image 양방향 대조 손실과 지도학습 분류 신호를 하나의 목적함수로 합친 것으로, CLIP의 단순 쌍대조보다 판별적인 표현을 학습하게 한다. 데이터는 웹에서 큐레이션한 **FLD-900M**(이미지-텍스트 쌍 9억, 순수 쿼리 970만)을 쓴다.'},
 {h:'세 어댑터로 축마다 확장',
  lead:'같은 backbone에 Dynamic Head·METER·Video CoSwin 세 어댑터를 갈아 끼운다.',
  d:'**공간 확장**은 CoSwin이 이미 만드는 다중 스케일 특징 피라미드에 Dynamic Head(scale·space·task 세 attention을 얹은 검출 헤드)를 붙여 객체 탐지·분할로, **모달리티 확장**은 METER 어댑터로 co-attention 기반 V+L 표현을 만들어 VQA로, **시간 확장**은 CoSwin의 2D 컨볼루션 토큰화를 3D로, shifted window를 3D shifted window로 바꾼 Video CoSwin으로 영상 행동 인식까지 커버한다. 세 어댑터 모두 **사전학습된 CoSwin 가중치를 그대로 이어받아** 처음부터 다시 학습하지 않는다.'},
 {h:'Object365 프리트레인으로 검출 어댑터를 먼저 데운다',
  lead:'Dynamic Head를 Object365로 12 에폭 먼저 학습한 뒤 COCO로 파인튜닝한다.',
  d:'검출 어댑터는 CoSwin 특징을 그대로 쓰기엔 탐지 데이터가 상대적으로 적어, Object365의 의사 라벨로 배치 크기 128, 7일간 12 에폭을 먼저 학습해 어댑터를 데운 뒤 COCO에 파인튜닝한다. 이 2단계가 없으면 대조학습으로만 얻은 특징이 영역 단위 탐지에 곧바로 맞지 않는다는 것을 시사한다.'}
],

diagram:{type:'flow', cap:'하나의 사전학습 backbone(왼쪽)에서 세 축(공간·모달리티·시간)으로 갈라진 어댑터를 거쳐 다운스트림 과제로 나간다.',
 nodes:[
  {t:'이미지-텍스트 데이터', s:'FLD-900M'},
  {t:'CoSwin + 언어', s:'UniCL 사전학습', acc:true},
  {t:'Dynamic Head', s:'공간 확장 → 탐지'},
  {t:'METER', s:'모달리티 확장 → VQA'},
  {t:'Video CoSwin', s:'시간 확장 → 행동인식'}
 ]},

math:[
 {expr:'L_UniCL = L_(i→t) + L_(t→i),  where positives = all pairs sharing the same language label (hash)',
  tex:'\\mathcal{L}_{\\text{UniCL}}=\\mathcal{L}_{i\\to t}+\\mathcal{L}_{t\\to i},\\quad \\mathcal{L}_{i\\to t}=-\\sum_{i\\in B}\\frac{1}{|\\mathcal{P}(i)|}\\sum_{k\\in \\mathcal{P}(i)}\\log\\frac{\\exp(\\tau\\,u_i^{\\top}v_k)}{\\sum_{j\\in B}\\exp(\\tau\\,u_i^{\\top}v_j)}',
  d:'같은 텍스트(해시로 동일하다고 판정된 캡션)를 공유하는 모든 이미지-텍스트 쌍을 양성으로 묶어 대조한다. `[CLIP](#/p/clip)`의 대조 손실이 배치 내 정확히 1개의 양성만 두는 것과 달리, UniCL은 여러 개의 양성을 허용해 지도 분류의 신호를 함께 흡수한다.'}
],

numbers:[
 {k:'사전학습 데이터', v:'FLD-900M', d:'이미지-텍스트 쌍 9억 개, 순수 텍스트 쿼리 970만'},
 {k:'ImageNet-1K zero-shot', v:'top-1 83.74 / top-5 97.18', d:'CoSwin-H, 12개 분류 데이터셋 중 zero-shot 비교'},
 {k:'COCO 객체 탐지', v:'62.4 mAP', d:'파인튜닝, Dynamic Head 어댑터'},
 {k:'VQA', v:'80.36', d:'METER 어댑터로 파인튜닝'},
 {k:'Kinetics-600 행동인식', v:'87.8% top-1', d:'Video CoSwin 어댑터'},
 {k:'CoSwin-H 파라미터', v:'637M', d:'이미지 encoder 최대 구성'}
],

impact:'Florence는 "비전 foundation model이 무엇을 커버해야 하는가"를 축으로 명시함으로써, 이후 비전 대형 모델 평가가 **분류 하나가 아니라 탐지·분할·영상·다중 모달리티를 아우르는 벤치마크 세트**로 확장되는 흐름에 초기 기준점을 놓았다. 동시에 "하나의 backbone + 과제별 경량 어댑터"라는 설계는, 매번 새 아키텍처를 만드는 대신 **사전학습된 표현을 재사용**하는 방식을 비전 쪽에서도 표준화했다.',

legacy:[
 '**공간·시간·모달리티라는 문제 정의**가 이후 범용 비전 모델(예: 이후 Microsoft의 후속 Florence-2)이 탐지·분할·캡셔닝·grounding을 하나의 시퀀스-투-시퀀스 인터페이스로 통합하는 방향의 출발점이 됨',
 '**UniCL의 다중 양성 대조**는 라벨이 있는 데이터와 노이즈 섞인 웹 alt-text를 같은 손실로 섞어 쓰는 방식으로, `[CoCa](#/p/coca)`가 라벨을 텍스트로 취급해 두 데이터를 합치는 것과 같은 문제의식을 공유',
 '`[Swin](#/p/swin)`의 계층적 구조를 대조학습 backbone으로 채택한 선택은, ViT 기반 CLIP류와 달리 **탐지·분할에 필요한 다중 스케일 특징**을 처음부터 갖춘 비전 foundation model 계열을 열었다'
],

pitfalls:[
 '**"CLIP의 상위호환"이 아니다.** Florence는 CoSwin·UniCL이라는 구체적 선택에 묶여 있고, 비교 대상인 CLIP-ResNet-50x64 등과 데이터 규모·아키텍처가 달라 zero-shot 수치를 그대로 방법론 우위로 해석하기 어렵다.',
 '**어댑터는 backbone과 별도로 학습된다.** Dynamic Head·METER·Video CoSwin은 CoSwin 가중치를 이어받지만 각자 추가 데이터(Object365 등)와 별도 학습 스케줄이 필요해, "하나의 모델"이라기보다 "하나의 backbone을 공유하는 여러 모델"에 가깝다.',
 '**Florence(2021, 이 논문)와 Florence-2(2023, 후속작)를 혼동하기 쉽다.** 이 논문은 CoSwin+UniCL 기반 대조학습 모델이고, Florence-2는 완전히 다른 통합 시퀀스 생성 아키텍처다.'
],

figures:[
 {f:'fig1-space-time-modality.png',
  cap:'파란 화살표(Space)는 장면 분류→객체 탐지·분할로, 초록 화살표(Time)는 정지 이미지→행동 인식·추적으로, 주황 화살표(Modality)는 RGB 전용→캡션·깊이로 뻗는다. 가운데 회색 "Flower Classification"이 세 축이 만나는 기본 좌표.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-overview.png',
  cap:'왼쪽 파란 점선 박스가 UniCL로 함께 학습되는 언어 encoder + CoSwin(사전학습 backbone), 오른쪽 초록 박스 네 개가 각 축에 대응하는 어댑터(분류/검색, Dynamic Head, METER, Video CoSwin). 화살표를 따라가면 데이터 큐레이션 → 사전학습 → 어댑터 → 실제 과제로 이어지는 전체 파이프라인이 보인다.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'we introduce a new computer vision foundation model, Florence, to expand the representations from coarse (scene) to fine (object), from static (images) to dynamic (videos), and from RGB to multiple modalities (caption, depth).',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2111.11432 — Florence: A New Foundation Model for Computer Vision', u:'https://arxiv.org/abs/2111.11432'}
]
});
