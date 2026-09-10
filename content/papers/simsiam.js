WIKI.paper({
slug:'simsiam',
venue:'CVPR 2021',
authors:'Xinlei Chen, Kaiming He (Facebook AI Research)',
arxiv:'2011.10566',

tldr:'대조학습에 필수라고 여겨지던 음성 쌍(negative pair)·큰 배치·모멘텀 인코더가 **전부 없어도** Siamese 네트워크는 붕괴(collapse)하지 않는다는 것을 보인 논문. 남긴 것은 **stop-gradient 연산 하나**뿐이다.',

context:'2020년의 자기지도 표현학습은 두 갈래로 갈렸다. [SimCLR](#/p/simclr)·[MoCo](#/p/moco) 계열은 음성 쌍으로 붕괴를 막지만 음성 쌍을 충분히 확보하려면 큰 배치나 메모리 큐가 필요했다. [BYOL](#/p/byol)은 음성 쌍 없이 한 뷰의 출력을 다른 뷰가 예측하게 했는데, 저자들은 이것이 **모멘텀 인코더** 덕분에 붕괴하지 않는다고 설명했다. 이 논문의 질문은 단순하다 — Siamese 구조가 붕괴하지 않으려면 정말 음성 쌍·큰 배치·모멘텀 인코더 중 하나가 필요한가, 아니면 다른 이유가 있는가?',

ideas:[
 {h:'stop-gradient 하나로 충분하다',
  lead:'한쪽 분기의 gradient만 막으면 음성 쌍·모멘텀 인코더 없이도 붕괴하지 않는다.',
  d:'두 augmented view $x_1, x_2$를 같은 encoder $f$에 통과시켜 $z_1=f(x_1)$, $z_2=f(x_2)$를 얻고, 한쪽에만 predictor $h$를 더해 $p_1=h(f(x_1))$을 만든다. 손실은 $p_1$과 $z_2$의 negative cosine similarity인데, 이때 $z_2$를 **상수로 취급**(stop-gradient)하고 encoder를 업데이트한다. 이 한 줄을 빼면 손실이 즉시 이론적 최솟값인 $-1$로 떨어지며 출력이 상수로 붕괴하고, ImageNet linear 정확도는 $67.7\\%$에서 $0.1\\%$(무작위 추측 수준)로 무너진다.'},
 {h:'BYOL·SimCLR·SwAV를 한 부품씩 뺀 것으로 재해석',
  lead:'SimSiam은 세 방법에서 각각 핵심 부품 하나만 뺀 특수 사례로 볼 수 있다.',
  d:'저자들은 SimSiam을 "모멘텀 인코더 없는 BYOL", "음성 쌍 없는 SimCLR", "온라인 클러스터링 없는 SwAV"로 요약한다. [BYOL](#/p/byol)과 달리 두 분기가 **같은 weight를 직접 공유**하고, [SimCLR](#/p/simclr)·[MoCo](#/p/moco)와 달리 음성 쌍이 없으며, 모멘텀으로 갱신되는 별도 네트워크도 없다. 그런데도 붕괴가 일어나지 않는다는 것이 이 논문의 핵심 반증이다.'},
 {h:'가설: 숨겨진 EM류 alternating optimization',
  lead:'SimSiam을 두 변수 집합을 번갈아 푸는 k-means류 알고리즘으로 볼 수 있다는 가설.',
  d:'손실을 $L(\\theta,\\eta)=\\mathbb{E}[\\|F_\\theta(T(x))-\\eta_x\\|_2^2]$ 형태로 다시 쓰면, $\\theta$(encoder 파라미터)와 $\\eta_x$(이미지별 표현)라는 두 변수 집합을 번갈아 최적화하는 문제로 보인다. $\\theta$를 고정하고 $\\eta$를 풀면 $\\eta_x \\leftarrow \\mathbb{E}_T[F_\\theta(T(x))]$가 되는데, 이 $\\eta$가 SGD 한 스텝 동안 상수로 취급되는 것이 곧 stop-gradient다. k-means에서 클러스터 중심을 고정하고 배정을 풀듯, 두 서브문제를 번갈아 푸는 동안 한쪽은 반드시 상수여야 한다는 것이다.'},
 {h:'proof-of-concept: k-step alternation',
  lead:'stop-gradient 한 스텝 대신 k스텝 alternation을 실제로 돌려 가설을 검증한다.',
  d:'가설이 맞다면 매 SGD 스텝마다 $\\eta$를 갱신하는 대신, $\\eta$를 $k$스텝 동안 고정해 두고 그 사이 $\\theta$만 여러 번 갱신해도 학습이 성립해야 한다. 실제로 10스텝·100스텝 alternation을 돌리면 1스텝(=SimSiam)보다 오히려 정확도가 올라간다(68.1%→68.7%→68.9%). predictor $h$ 역시 $\\eta$ 갱신에서 빠진 기댓값 $\\mathbb{E}_T[\\cdot]$을 근사하는 장치로 설명되며, predictor를 없애면 무너지지만 이동평균으로 대체하면 살아난다.'},
 {h:'단순함이 곧 결과다: 비교적 적은 장치로 경쟁력 확보',
  lead:'배치 256·SGD만으로 100-epoch 기준 경쟁 방법들보다 높은 정확도를 낸다.',
  d:'LARS 같은 large-batch 전용 옵티마이저 없이 일반 SGD와 배치 256을 쓴다. 배치 크기를 64에서 4096까지 바꿔도 대체로 잘 동작하는데(4096에서만 소폭 하락), 이는 large batch가 붕괴 방지의 필수 조건이 아니라는 추가 증거다. symmetrized loss·predictor의 bottleneck 구조·BN 배치 등은 정확도를 소폭 올리지만, 있고 없고가 붕괴 여부를 가르지는 않는다는 점을 ablation으로 일일이 분리해서 보여준다.'}
],

diagram:{type:'compare', cap:'같은 Siamese 골격에서 무엇을 빼는가로 본 네 방법의 관계. SimSiam은 stop-gradient 하나만 남긴다.',
 left:{t:'BYOL/SimCLR/MoCo', items:['BYOL: 모멘텀 인코더 필수','SimCLR: 대량의 음성 쌍 필요','SimCLR: 큰 배치(4096) 필요','MoCo: 큐 + 모멘텀 인코더']},
 right:{t:'SimSiam', items:['모멘텀 인코더 없음','음성 쌍 없음','배치 256으로 충분','stop-gradient만 필수']}},

math:[
 {expr:'D(p1, z2) = - (p1/||p1||2) · (z2/||z2||2)',
  tex:'\\mathcal{D}(p_1,z_2) = -\\frac{p_1}{\\|p_1\\|_2}\\cdot\\frac{z_2}{\\|z_2\\|_2}',
  d:'negative cosine similarity. $p_1=h(f(x_1))$은 predictor를 거친 쪽, $z_2=f(x_2)$는 stop-gradient가 걸리는 쪽이다.'},
 {expr:'L = D(p1, stopgrad(z2))/2 + D(p2, stopgrad(z1))/2',
  tex:'\\mathcal{L}=\\tfrac{1}{2}\\mathcal{D}(p_1,\\text{stopgrad}(z_2))+\\tfrac{1}{2}\\mathcal{D}(p_2,\\text{stopgrad}(z_1))',
  d:'대칭화된 최종 손실. $x_2$ 쪽 encoder는 첫 항에서 gradient를 받지 않지만 둘째 항의 $p_2$를 통해서는 받는다 — 완전히 고정되는 것이 아니라 **역할이 매 항마다 번갈아 바뀐다**는 점이 핵심.'},
 {expr:'L(θ, η) = E[ ||F_θ(T(x)) − η_x||² ] ,  min over θ, η',
  tex:'L(\\theta,\\eta)=\\mathbb{E}_{x,T}\\big[\\|F_\\theta(T(x))-\\eta_x\\|_2^2\\big],\\quad \\min_{\\theta,\\eta} L(\\theta,\\eta)',
  d:'저자들의 가설을 담은 재정식화. $\\eta_x$는 이미지 $x$마다 하나씩 있는 별도 변수(신경망 출력이 아니라 최적화 변수)로, k-means의 클러스터 배정과 유비된다.'}
],

numbers:[
 {k:'ImageNet linear eval · w/ stop-grad', v:'67.7±0.1%', d:'100-epoch 사전학습, ResNet-50, 5회 시행 평균±표준편차'},
 {k:'ImageNet linear eval · w/o stop-grad', v:'0.1%', d:'무작위 추측 수준까지 붕괴 — stop-gradient만 뺀 유일한 차이'},
 {k:'predictor MLP 제거', v:'0.1%', d:'predictor $h$가 없으면 stop-gradient가 있어도 붕괴(Table 1a)'},
 {k:'배치 크기 강건성', v:'64→68.1%(bs256)', d:'배치 64~2048까지 대체로 안정, 4096에서만 64.0%로 하락'},
 {k:'200-epoch linear eval 비교', v:'SimSiam 70.0% vs SimCLR 68.3% vs MoCo v2 69.9%', d:'ResNet-50, 배치 256(SimSiam)·4096(SimCLR)·256(MoCov2), 100-epoch 기준으로는 SimSiam이 비교 대상 중 최고(68.1%)'},
 {k:'800-epoch linear eval', v:'BYOL 74.3% > SimSiam 71.3%', d:'긴 학습에서는 모멘텀 인코더를 쓰는 BYOL이 앞서기 시작 — SimSiam의 이득은 짧은 학습에서 더 크다'}
],

impact:'모든 후속 self-distillation 계열 논문이 "무엇이 실제로 붕괴를 막는가"를 다시 따지게 만들었다. stop-gradient가 핵심이라는 결론은 [BYOL](#/p/byol)의 모멘텀 인코더 설명을 정면으로 반박했고, [DINO](#/p/dino)처럼 모멘텀 teacher를 쓰는 방법들도 이후 "모멘텀은 정확도를 위한 것이지 붕괴 방지의 필수조건이 아닐 수 있다"는 프레임으로 재해석되었다. 무엇보다 불필요한 장치를 하나씩 제거하는 ablation 방법론 자체가 이후 self-supervised 논문들의 표준 검증 절차가 되었다.',

legacy:[
 '**[DINO](#/p/dino)** — 모멘텀 teacher + self-distillation을 유지하면서도 SimSiam이 밝힌 stop-gradient의 역할을 teacher-student 비대칭으로 재구성',
 '**[iBOT](#/p/ibot)** — DINO의 self-distillation과 masked image modeling을 결합하며 SimSiam 계열의 붕괴 방지 논의를 그대로 계승',
 '**아키텍처 대신 최적화 절차를 보는 시각** — "무엇을 더할까"가 아니라 "무엇을 빼도 되는가"를 묻는 ablation 문화가 이후 self-supervised 연구 전반에 정착',
 '**EM/alternating optimization 프레임** — stop-gradient를 숨은 변수 최적화로 보는 해석이 이후 여러 self-distillation 방법의 이론적 설명 시도에 인용됨'
],

pitfalls:[
 '**"BYOL without momentum encoder"라는 요약은 절반만 맞다.** SimSiam은 weight를 직접 공유하는 반면 BYOL은 online/target 두 네트워크를 분리해서 momentum으로만 연결한다 — 구조적으로 동일하지 않고, 붕괴 방지 메커니즘에 대한 **설명**이 다를 뿐이다.',
 '**linear evaluation 수치와 fine-tuning 수치를 섞지 말 것.** 이 논문의 표 4는 전부 frozen feature 위에 supervised linear classifier를 올린 linear evaluation 값이며, VOC/COCO 표(표 5)는 detection/segmentation으로 fine-tune한 전이학습 결과로 서로 다른 프로토콜이다.',
 '**stop-gradient가 "왜" 붕괴를 막는지는 이 논문도 완전히 설명하지 않는다.** 저자들 스스로 "여전히 경험적 관찰로 남아 있다"고 명시한다 — EM 가설은 stop-gradient가 **자연스럽게 나오는 이유**를 설명할 뿐, 붕괴가 실제로 방지되는 이유의 완전한 증명은 아니다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'양쪽 encoder $f$는 가중치를 공유한다. 오른쪽 분기 위의 점선 화살표에 "stop-grad" 표시가 붙어 있는 것이 이 논문의 전부다 — 왼쪽만 predictor $h$를 거쳐 위쪽 similarity로 합류한다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-stopgrad.png',
  cap:'왼쪽 training loss: stop-gradient 없으면(주황) 즉시 이론적 최솟값 $-1$로 붕괴. 가운데 output std: 주황선이 0에 붙어 있어야 붕괴, 파란선은 $1/\\sqrt{d}$ 근처를 유지해 붕괴하지 않음을 보여준다. 오른쪽 kNN 정확도도 stop-gradient 없으면 0 근처에 고정된다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:"Our model directly maximizes the similarity of one image's two views, using neither negative pairs nor a momentum encoder.", src:'Introduction, p.1'},
 {t:'In a nutshell, our method can be thought of as "BYOL without the momentum encoder".', src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 2011.10566 — Exploring Simple Siamese Representation Learning', u:'https://arxiv.org/abs/2011.10566'},
 {t:'공식 코드 (Facebook Research)', u:'https://github.com/facebookresearch/simsiam'}
]
});
