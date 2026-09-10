WIKI.paper({
slug:'internimage',
venue:'CVPR 2023',
authors:'Wang, Dai, Chen, Huang, Li et al. (Shanghai AI Lab · SenseTime · CUHK)',
arxiv:'2211.05778',

tldr:'ViT 계열이 파라미터·데이터를 늘릴수록 좋아지는 반면 CNN은 그 스케일링 곡선에서 뒤처진다는 통념에 맞서, **변형 가능 합성곱(deformable convolution)** 을 코어 연산자로 키운 10억 파라미터급 CNN. attention 없이도 같은 스케일링 이점을 CNN이 가질 수 있음을 보였다.',

context:'2022년 시점 대형 비전 파운데이션 모델은 [ViT](#/p/vit) 계열이 사실상 독점하고 있었다. attention이 유리한 이유로 꼽힌 것은 **장거리 의존성**(전역 수용영역)과 **입력에 따라 달라지는 적응적 가중치** 두 가지였는데, 두 성질 다 표준 합성곱에는 없다. [ConvNeXt](#/p/convnext)는 ViT의 학습 레시피를 CNN에 그대로 이식해 경쟁력을 보였지만 커널 자체는 여전히 고정 가중치였고, RepLKNet류는 커널을 31×31까지 키워 수용영역만 넓혔을 뿐 가중치는 그대로 고정이었다. 이 논문은 묻는다 — 수용영역과 적응성을 **동시에** 갖는 합성곱이 있다면, CNN도 ViT처럼 스케일링될 수 있지 않은가?',

ideas:[
 {h:'네 연산자를 세 기준으로 정리하면 빈 칸이 보인다',
  lead:'전역 attention·지역 attention·큰 커널·변형 가능 합성곱을 장거리 의존성·적응적 집계·효율성 세 축으로 비교한다.',
  d:'전역 attention(ViT)은 장거리 의존성과 적응성은 있지만 연산·메모리가 비싸다. 지역 attention([Swin](#/p/swin))은 효율적이지만 장거리 의존성을 잃는다. 큰 커널(RepLKNet)은 수용영역은 넓지만 가중치가 위치·입력에 무관하게 고정이라 적응성이 없다. 세 가지를 모두 만족하는 것은 [Deformable DETR](#/p/deformable-detr)에서 쓰인 것과 같은 계열의 **변형 가능 합성곱**뿐이다 — 샘플링 위치 자체가 입력에 따라 움직이므로 성긴(sparse) 계산만으로 장거리 의존성과 적응성을 함께 얻는다.'},
 {h:'DCNv2를 대형 모델용으로 세 군데 고친 것이 DCNv3',
  lead:'샘플링 지점 간 가중치를 공유하고, multi-head처럼 그룹을 나누고, softmax로 정규화해 큰 스케일에서도 안정적으로 만든다.',
  d:'DCNv2는 각 샘플링 지점마다 독립된 투영 가중치를 가져, 지점 수에 비례해 파라미터·메모리가 늘어나 대형화에 불리했다. DCNv3는 (1) depthwise-pointwise 분리처럼 지점 간 가중치를 공유하고, (2) MHSA의 multi-head처럼 채널을 $G$ 개 그룹으로 나눠 그룹마다 독립적인 샘플링 오프셋과 변조 스칼라를 갖게 하고, (3) 변조 스칼라의 정규화를 sigmoid(합이 불안정)에서 softmax(합이 항상 1)로 바꿔 대규모 학습에서 gradient를 안정시켰다.'},
 {h:'stem-4stage 골격은 CNN 그대로, 블록 내부만 Transformer식',
  lead:'전체 뼈대는 표준 CNN의 4단계 다운샘플링을 따르되, 각 블록은 DCNv3 + LayerNorm + FFN으로 Transformer 블록을 흉내 낸다.',
  d:'stem과 각 stage 사이 다운샘플링은 전통적인 strided convolution을 그대로 쓴다. 대신 각 basic block 내부는 attention 자리에 DCNv3를 놓고 LayerNorm·FFN으로 감싸, [Transformer](#/p/transformer) 블록과 같은 형태로 규격화했다. 채널 수 $C_i=2^{i-1}C_1$, 그룹 수 $G_i=C_i/C\'$ 등 4개의 하이퍼파라미터만으로 전체 모델 크기가 정해지는 stacking rule을 둬, 3천만(T)에서 10억(H) 파라미터까지 일관되게 스케일했다.'},
 {h:'라벨 데이터가 아니라 멀티모달 데이터로 10억 스케일을 채운다',
  lead:'InternImage-H는 Laion-400M·YFCC-15M·CC12M을 합친 4.27억 장을 M3I Pre-training으로 사전학습한다.',
  d:'ViT-G·SwinV2-G 같은 동급 모델들이 JFT-3B 같은 비공개 라벨 데이터에 의존한 것과 달리, InternImage-H는 공개된 이미지-텍스트 페어 데이터셋을 모아 라벨이 없어도 되는 M3I Pre-training으로 사전학습해 공개 데이터만으로 최상위권에 도달했다.'}
],

diagram:{type:'compare', cap:'네 가지 공간 집계 연산자의 트레이드오프. DCNv3(우측)만 세 성질을 모두 만족한다.',
 left:{t:'전역·지역 attention', items:['전역: 장거리 O · 효율 X','지역(Swin식): 효율 O · 장거리 X','둘 다 적응적 가중치는 O']},
 right:{t:'DCNv3(변형 가능 합성곱)', items:['장거리 의존성 O(샘플링 위치 이동)','적응적 가중치 O(입력 조건부)','성긴 샘플링이라 효율 O']}},

math:[
 {expr:'y(p0) = Σ_g Σ_k w_g · m_gk · x_g(p0 + p_k + Δp_gk)',
  tex:'y(p_0)=\\sum_{g=1}^{G}\\sum_{k=1}^{K} w_g\\, m_{gk}\\, x_g\\!\\left(p_0+p_k+\\Delta p_{gk}\\right)',
  d:'$G$ 개 그룹마다 독립적인 샘플링 오프셋 $\\Delta p_{gk}$(어디를 볼지)와 변조 스칼라 $m_{gk}$(얼마나 반영할지, softmax 정규화)를 학습한다. $w_g$ 는 그룹 안에서는 공유되는 위치 무관 투영 가중치 — 표준 합성곱의 고정 커널 $w_{i-j}$ 와 self-attention의 입력 의존 가중치 $A_{i,j}$ 사이에 있는 형태다.'}
],

numbers:[
 {k:'최대 모델', v:'InternImage-H · 10.8억(1.08B) 파라미터', d:'C1=320, 그룹수 32, 사전학습 데이터 4.27억 장(Laion-400M+YFCC-15M+CC12M, M3I)'},
 {k:'ImageNet-1K top-1', v:'89.6% (640² 입력)', d:'224²에서는 88.9% · 사전학습 데이터가 JFT류 비공개셋이 아니라 공개 4.27억 장'},
 {k:'COCO test-dev 검출', v:'65.4 box mAP', d:'InternImage-H + [DINO](#/p/dino-detr) 검출기, 당시 신기록. val2017 65.0 mAP로 SwinV2-G 대비 +1.2p (64.2)'},
 {k:'ADE20K 분할', v:'62.9 mIoU', d:'InternImage-H, 1.31B 파라미터 버전(멀티스케일 포함)'},
 {k:'최소 모델', v:'InternImage-T · 30M 파라미터', d:'IN-1K 82.1~83%대, ConvNeXt-T·Swin-T와 동급 비교군'},
 {k:'커널 크기', v:'3×3 (DCNv3)', d:'RepLKNet의 31×31 대형 커널과 달리, 성긴 샘플링 덕에 작은 커널로도 장거리 의존성 확보'}
],

impact:'"대형 비전 모델 = ViT"라는 2022년의 암묵적 전제에 반례를 제시했다. attention의 두 핵심 이점(장거리 의존성, 적응적 가중치)을 합성곱 쪽에서 재현할 수 있음을 DCNv3로 실증하면서, 합성곱 계열도 데이터·파라미터를 늘릴수록 좋아지는 스케일링 곡선을 탈 수 있다는 것을 보여줬다. [ConvNeXt](#/p/convnext)가 "학습 레시피를 이식해도 ConvNet이 경쟁력 있다"를 보였다면, InternImage는 "연산자 자체를 바꿔도 ConvNet이 ViT의 스케일링 이점을 가질 수 있다"는 한 단계 더 나간 주장이다.',

legacy:[
 '**"Transformer만이 스케일링의 답은 아니다"라는 반례의 계보** — [ConvNeXt](#/p/convnext)에 이어 연산자 차원에서 같은 주장을 강화한 사례로 인용됨',
 '**변형 가능 연산의 재조명** — [Deformable DETR](#/p/deformable-detr)의 변형 가능 attention과 계보를 공유하며, "성긴 적응적 샘플링"이 검출·분할용 백본 설계의 한 축으로 자리잡음',
 '**공개 데이터로 10억급 스케일을 채우는 선례** — JFT류 비공개 데이터 없이 Laion 등 공개 데이터만으로 최상위권에 도달한 것이 이후 오픈소스 파운데이션 모델 흐름(OpenGVLab)과 이어짐',
 '**OpenGVLab 생태계의 출발점** — 이후 [InternVL](#/p/internvl) 등 멀티모달 모델의 비전 백본으로 재사용됨'
],

pitfalls:[
 '**"거대 커널(RepLKNet)과 DCNv3는 같은 해법"이 아니다.** 둘 다 수용영역을 넓히지만, 큰 커널은 가중치가 고정이라 적응적 집계가 없고, DCNv3는 샘플링 위치와 변조 스칼라가 입력에 따라 달라진다는 점이 원문이 강조하는 핵심 차이다.',
 '**ImageNet 수치를 볼 때 입력 해상도와 사전학습 데이터를 꼭 함께 봐야 한다.** InternImage-H의 88.9%는 224² 기준이고, 89.6%는 640²로 올려 파인튜닝한 값이며, 둘 다 4.27억 장(공개 데이터) 사전학습이 전제다 — JFT-3B(비공개) 사전학습 모델과 바로 비교하면 데이터 출처가 다르다.',
 '**"CNN이니까 attention보다 연산이 항상 싸다"는 아니다.** DCNv3가 효율적인 이유는 CNN이라서가 아니라 **성긴 샘플링**(3×3개 지점만 봄) 때문이며, 이 성긴 샘플링 자체가 [Deformable DETR](#/p/deformable-detr)에서 온 아이디어다.'
],

figures:[
 {f:'fig1-operator-compare.png',
  cap:'네 연산자의 수용 패턴 비교. (a) 전역 attention은 전 영역에 균일 가중치, (b) 지역 attention은 창 안으로 제한, (c) 큰 커널은 고정 가중치로 넓게, (d) DCNv3는 별표(query) 주변에 샘플링 지점(초록 사각형)이 입력에 따라 움직이며 진하기(가중치)도 달라진다 — 넓으면서도 성기고 적응적이다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'Different from the recent CNNs that focus on large dense kernels, InternImage takes deformable convolution as the core operator, so that our model not only has the large effective receptive field required for downstream tasks such as detection and segmentation, but also has the adaptive spatial aggregation conditioned by input and task information.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2211.05778 — InternImage', u:'https://arxiv.org/abs/2211.05778'},
 {t:'GitHub — OpenGVLab/InternImage', u:'https://github.com/OpenGVLab/InternImage'}
]
});
