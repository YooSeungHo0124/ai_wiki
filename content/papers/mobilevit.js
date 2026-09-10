WIKI.paper({
slug:'mobilevit',
venue:'ICLR 2022',
authors:'Mehta, Rastegari (Apple)',
arxiv:'2110.02178',

tldr:'합성곱으로 지역 정보를, Transformer로 전역 정보를 처리하되 **같은 텐서 안에서 이 둘을 붙여쓰는** 방식으로 [ViT](#/p/vit)를 모바일 예산(5~6M 파라미터)에 맞춘 하이브리드 백본. FLOPs가 아니라 iPhone 12 실측 지연으로 설계를 검증했다.',

context:'[ViT](#/p/vit)는 이미지를 패치로 잘라 Transformer에 넣어 전역 문맥을 direct하게 모델링하지만, 합성곱이 가진 **공간적 귀납 편향(spatial inductive bias)**이 없다. 그 결과 대규모 데이터·무거운 정규화·긴 학습 없이는 최적화가 잘 안 되고([ViT](#/p/vit) 자신도 JFT-300M 같은 초대형 데이터셋이 있어야 CNN 수준에 도달), 파라미터 대비 성능도 떨어진다. 예를 들어 DPT(ViT 기반)는 [DeepLab](#/p/deeplab)v3(CNN 기반)와 비슷한 세그멘테이션 성능을 내는 데 **6배 많은 파라미터**(345M vs 59M)가 필요했다. 더 중요한 문제는 모바일 배포다 — ViT 계열인 PiT는 [DeiT](#/p/deit)보다 이론 FLOPs가 3배 적은데도 iPhone 12 실측 지연은 거의 같다(10.56ms vs 10.99ms). FLOPs를 아무리 줄여도 모바일 기기에서 실제로 빨라지지 않는다는 것이 이 논문의 출발점이다.',

ideas:[
 {h:'MobileViT 블록: 합성곱으로 펴고, Transformer로 섞고, 합성곱으로 접는다',
  lead:'국소 합성곱 표현을 패치로 unfold해 Transformer에 넣고 다시 fold해 합성곱과 합친다.',
  d:'입력에 $n\\times n$ 합성곱(지역 정보)과 $1\\times1$ 합성곱(채널 확장)을 먼저 적용해 $X_L$을 만든다. 이를 겹치지 않는 $P=h\\times w$ 크기 패치 $N$개로 unfold한 뒤, **패치 안의 같은 위치(픽셀)들끼리** [Transformer](#/p/transformer)를 적용해 패치 간 관계를 학습하고 다시 fold한다. 표준 합성곱을 "unfold → 행렬곱 → fold"의 조합으로 보면, 이 블록은 그 가운데 행렬곱 자리를 Transformer로 바꾼 것과 같다 — 그래서 저자들은 이를 "transformers as convolutions"라 부른다.'},
 {h:'패치 안의 같은 위치를 이어서 전역 수용장을 얻는다',
  lead:'각 픽셀은 자기 패치 안에서 지역 정보를, 같은 위치의 다른 패치들과는 전역 정보를 얻는다.',
  d:'Transformer는 패치 인덱스 $p\\in\\{1,\\dots,P\\}$마다 독립적으로 적용되는데, 이때 비교 대상은 서로 다른 $N$개 패치에서 **같은 상대 위치**에 있는 픽셀들이다. 이미 합성곱이 그 픽셀 주변의 지역 정보를 인코딩해 뒀으므로, 이 픽셀들을 Transformer로 이으면 결과적으로 한 픽셀이 이미지 전체 $H\\times W$ 영역의 정보를 간접적으로 흡수하게 된다. [ViT](#/p/vit)처럼 패치의 공간 순서나 픽셀 순서를 잃지 않는 것이 핵심 차이다.'},
 {h:'왜 모바일에서 ViT가 불리한가',
  lead:'GPU용 전용 CUDA 커널과 BN 융합 같은 최적화가 모바일 하드웨어에는 없다.',
  d:'저자들은 MobileViT·[DeiT](#/p/deit)·PiT가 [MobileNetV2](#/p/mobilenetv2)보다 iPhone 12에서 느린 이유를 두 가지로 짚는다. (1) Transformer는 GPU에서는 전용 CUDA 커널로 가속되지만 모바일 추론 그래프에는 그런 최적화가 없고, (2) CNN은 배치정규화를 합성곱에 흡수하는 등 기기 수준 최적화의 혜택을 이미 받고 있는데 Transformer 연산에는 그런 최적화가 아직 없다는 것이다. 이는 [ViT](#/p/vit)가 "더 확장성이 좋다"는 통념이 모바일 환경에서는 뒤집힐 수 있음을 실측으로 보여준 사례다.'}
],

diagram:{type:'flow', cap:'MobileViT 블록: 합성곱으로 지역 표현을 만들고, 패치 단위로 펼쳐 Transformer로 전역 관계를 학습한 뒤, 다시 접어 원래 텐서와 합친다.',
 nodes:[
  {t:'Conv n×n + 1×1', s:'지역 표현 X_L'},
  {t:'Unfold', s:'패치 N개로 분해', a:'패치화'},
  {t:'Transformer', s:'L층, 패치 간 전역 관계', acc:true},
  {t:'Fold', s:'원래 H×W로 복원'},
  {t:'융합 Conv', s:'입력 X와 concat 후 conv'}
 ]},

math:[
 {expr:'X_G(p) = Transformer(X_U(p)),  1 ≤ p ≤ P   [P=patch 내 위치, N=패치 개수]',
  tex:'X_G(p) = \\text{Transformer}\\big(X_U(p)\\big),\\quad 1 \\le p \\le P',
  d:'패치 내 상대 위치 $p$마다 독립적으로, $N$개 패치에서 같은 위치의 벡터들을 모아 Transformer를 적용한다. Self-attention의 계산량은 $O(N^2 P d)$로 픽셀 전체가 아니라 패치 개수 $N$에 대해서만 제곱이라 [ViT](#/p/vit)의 $O(N^2d)$(여기서 $N$은 전체 패치 수, 픽셀 단위 아님)보다 훨씬 저렴하다.'}
],

numbers:[
 {k:'ImageNet Top-1 (MobileViT-S)', v:'78.4%', d:'파라미터 5.6M, MobileNetV3 대비 +3.2%p (학습은 300 epoch·배치 1024로 MobileNetV3의 600 epoch·배치 4096보다 단순)'},
 {k:'iPhone 12 실측 지연', v:'MobileViT 7.28ms vs MobileNetV2 0.92ms', d:'CoreML 변환 후 **iPhone 12**, 100회 반복 평균. 같은 조건에서 DeiT 10.99ms·PiT 10.56ms로 ViT 계열이 전반적으로 더 느림'},
 {k:'PiT vs DeiT FLOPs·지연 역전', v:'FLOPs 3배 적어도 지연은 비슷(10.56 vs 10.99ms)', d:'iPhone 12 실측, FLOPs가 모바일 지연의 신뢰할 수 있는 대리 지표가 아님을 보여주는 논문의 핵심 근거'},
 {k:'SSDLite 검출(COCO)', v:'MNASNet 대비 mAP +1.8%p · 크기 1.8배 작음', d:'MobileViT를 특징 추출기로 교체했을 때'},
 {k:'DPT vs DeepLabv3 파라미터', v:'345M vs 59M (약 6배)', d:'비슷한 세그멘테이션 성능에 ViT 기반 DPT가 훨씬 많은 파라미터를 요구한다는 배경 근거'}
],

impact:'"모바일에서 쓸 수 있는 ViT"라는 문제를 FLOPs가 아니라 **실제 기기 지연**으로 검증하며 제기한 첫 사례에 가깝다. 합성곱과 Transformer를 같은 블록 안에서 순차 결합하는 "transformers as convolutions" 패턴은 이후 여러 경량 하이브리드 백본의 참조점이 됐고, 모바일 비전 논문들이 FLOPs 단독 보고 대신 실기기 지연을 나란히 제시하는 관행을 강화했다.',

legacy:[
 '**하이브리드 경량 백본 계열 확산** — MobileViTv2·EfficientFormer 등 CNN+Transformer 결합 모바일 백본 연구가 이어짐(이 위키에는 없음)',
 '**"FLOPs ≠ 모바일 속도" 논증의 재확인** — [ShuffleNet](#/p/shufflenet)·[RepVGG](#/p/repvgg)가 GPU/서버에서 보인 문제의식을 모바일 ViT 맥락으로 확장',
 '**검출·세그멘테이션 백본으로의 재사용** — SSDLite·DeepLabv3 등 기존 태스크 전용 아키텍처에 백본만 교체해 이득을 보임을 직접 시연',
 '**단순한 학습 레시피로도 경쟁력** — 무거운 증류·데이터 증강 없이 기본 augmentation만으로 ViT 계열 대비 안정적으로 학습됨을 보여 후속 연구의 학습 설계 부담을 줄임'
],

pitfalls:[
 '**"MobileViT가 ViT보다 항상 빠르다"가 아니다.** 논문 스스로 MobileViT가 MobileNetV2보다 iPhone 12에서 느리다고 명시한다 — 이 논문의 기여는 속도 우위가 아니라 파라미터 대비 정확도와, 모바일 배포가 가능한 수준으로 격차를 좁혔다는 데 있다.',
 '**Unfold/Fold 연산 자체가 모바일에서 최적화돼 있지 않다.** 저자들은 PyTorch의 Fold/Unfold를 그대로 썼고, 이는 GPU 가속 연산이라 모바일에서 지원되지 않는다고 부록에서 밝힌다 — 실제 배포 시 별도 구현이 필요할 수 있다.',
 '**패치 크기(h, w) 선택이 정확도-속도 트레이드오프를 크게 바꾼다.** 작은 패치(Config-A)는 정확하지만 느리고, 큰 패치(Config-B)는 같은 이론 복잡도라도 병렬도가 높아 더 빠르다 — "이론 복잡도가 같다"는 이유로 속도가 같을 것이라 가정하면 틀린다.'
],

figures:[
 {f:'fig1-mobilevit-block.png',
  cap:'왼쪽 X에서 지역 표현(작은 회색 conv 박스)을 만든 뒤 Unfold로 패치 단위로 펼치고, Transformer(L회 반복)로 패치 간 전역 관계를 학습한 뒤 Fold로 되접는다. 오른쪽에서 1x1 conv로 채널을 줄이고 원래 X와 합쳐(Fusion) Conv n×n으로 최종 Y를 만든다.',
  src:'원문 Figure 1(b), p.2'},
 {f:'fig2-ssdlite-tradeoff.png',
  cap:'가로축 ImageNet Top-1, 세로축 SSDLite 검출 mAP(COCO). 같은 파라미터 예산대(원 크기가 파라미터 수)에서 MobileViT(빨강)가 MobileNet 계열보다 왼쪽 위가 아니라 오른쪽 위에 위치 — 정확도·mAP 모두 우위이면서 크기는 더 작다는 것을 보여준다.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'Note that floating-point operations (FLOPs) are not sufficient for low latency on mobile devices because FLOPs ignore several important inference-related factors such as memory access, degree of parallelism, and platform characteristics.',
  src:'Section 2, p.2'}
],

links:[
 {t:'arXiv 2110.02178 — MobileViT', u:'https://arxiv.org/abs/2110.02178'},
 {t:'Apple ml-cvnets 공식 구현', u:'https://github.com/apple/ml-cvnets'}
]
});
