WIKI.paper({
slug:'spatial-transformer',
venue:'NeurIPS 2015',
authors:'Jaderberg, Simonyan, Zisserman, Kavukcuoglu (Google DeepMind)',
arxiv:'1506.02025',

tldr:'CNN 안에 **미분 가능한 공간 변환 모듈**을 끼워 넣어, 네트워크가 스스로 "어디를 보고 어떻게 정렬할지"를 역전파만으로 배우게 만든 논문. 정답 변환을 알려주는 지도 없이도 회전·크기·워핑에 대한 불변성을 학습한다.',

context:'2015년의 CNN은 [AlexNet](#/p/alexnet) 이후 max-pooling으로 약간의 이동 불변성을 얻고 있었지만, pooling의 수용 영역이 보통 2×2로 작아서 큰 회전·스케일 변화에는 무력했다. 그 불변성도 여러 층의 pooling과 convolution을 깊게 쌓아야 서서히 얻어지는 간접적인 결과였다. 이미지 내 객체의 위치·자세·크기를 미리 정규화해 줄 수 있다면 이후 분류기의 일이 훨씬 쉬워지겠지만, 그런 정렬은 보통 별도의 전처리이거나 [강화학습](#/p/gan) 같은 비미분 방식의 attention으로 접근했다. 이 논문의 질문은 "정렬 자체를 [역전파](#/p/backprop)만으로 학습할 수 있는 층으로 만들 수 있는가"이다.',

ideas:[
 {h:'3단 구조: localisation → grid generator → sampler',
  lead:'변환 파라미터를 예측하고, 격자를 왜곡하고, 그 격자로 샘플링하는 세 부품으로 모듈을 나눈다.',
  d:'입력 feature map을 받아 소형 네트워크(`localisation net`)가 변환 파라미터 θ를 회귀한다. `grid generator`가 출력 좌표계의 규칙적인 격자 G를 θ로 워핑해 입력 좌표계 위의 샘플링 위치 $\\mathcal{T}_\\theta(G)$ 를 만든다. 마지막으로 `sampler`가 그 위치에서 입력을 보간해 워핑된 출력을 만든다. 세 부품 모두 미분 가능해서 통째로 역전파가 관통한다.'},
 {h:'양선형 샘플링으로 미분 가능성을 확보',
  lead:'격자 좌표가 정수가 아니어도 양선형 보간의 서브그래디언트로 역전파가 가능하다.',
  d:'grid generator가 만드는 샘플 좌표는 실수이므로 픽셀 격자에 정확히 맞아떨어지지 않는다. 인접 4개 픽셀에 대한 양선형(bilinear) 보간을 쓰면 출력이 입력 픽셀 값과 샘플 좌표 양쪽에 대해 미분 가능해지고, 좌표에 대한 그래디언트는 어디서나 0이 아닌 서브그래디언트를 갖는다. 이 덕분에 θ를 만드는 localisation net까지 그래디언트가 그대로 흘러간다.'},
 {h:'affine 6개 파라미터로 이동·회전·크기·전단을 한 번에',
  lead:'2×3 affine 행렬 하나로 crop·이동·회전·비등방 스케일링을 모두 표현한다.',
  d:'가장 널리 쓰는 변환 $\\mathcal{T}_\\theta$ 는 2×3 affine 행렬이다. 대각 성분만 제약하면 attention처럼 순수한 crop-and-scale이 되고, 6개 전부를 자유롭게 두면 회전·전단까지 포함한다. 논문은 affine 외에도 projective 변환, thin-plate spline까지 같은 프레임워크로 다룰 수 있음을 보인다.'},
 {h:'지도 없이 정렬을 배운다 — 손실은 분류 손실뿐',
  lead:'변환 정답 라벨 없이, 최종 분류 손실의 그래디언트만으로 localisation net이 정렬을 학습한다.',
  d:'학습에 쓰는 것은 오직 이미지의 클래스 라벨뿐이다. 분류 손실을 최소화하는 과정에서 localisation net은 "이렇게 잘라내고 정렬하면 분류가 쉬워진다"는 변환을 스스로 발견한다. 별도의 attention 지도나 bounding box 라벨이 전혀 없다는 점이 이 논문을 이후 attention 연구와 구분 짓는다.'},
 {h:'어디에나 삽입 가능한 층',
  lead:'입력 크기와 개수에 제약이 없어 CNN의 어느 지점에도, 여러 개를 병렬로 꽂을 수 있다.',
  d:'spatial transformer는 표준 convolution/pooling 층처럼 다룰 수 있어 네트워크 앞단(입력 정규화)에도, 중간 feature map 위(멀티 객체를 각각 담당하는 여러 개의 병렬 transformer)에도 삽입할 수 있다. 논문은 두 자리 숫자를 동시에 인식하는 실험에서 두 개의 transformer가 각각 한 숫자씩 담당하도록 자발적으로 분화하는 것을 보인다.'}
],

diagram:{type:'flow', cap:'입력 feature map U가 세 부품을 거쳐 정렬된 출력 V가 된다. localisation net만 학습되는 부분이고 나머지는 결정적 연산이다.',
 nodes:[
  {t:'입력 U', s:'H×W×C'},
  {t:'Localisation', s:'변환 θ 회귀', acc:true},
  {t:'Grid generator', s:'T_θ(G) 계산'},
  {t:'Sampler', s:'양선형 보간'},
  {t:'출력 V', s:'정렬된 feature map'}
 ]},

math:[
 {expr:'Aθ = [[θ1, θ2, θ3], [θ4, θ5, θ6]]',
  tex:'A_\\theta=\\begin{pmatrix}\\theta_1 & \\theta_2 & \\theta_3\\\\ \\theta_4 & \\theta_5 & \\theta_6\\end{pmatrix}',
  d:'affine 변환의 2×3 행렬. localisation net이 이 6개 값을 입력마다 다르게 회귀한다.'},
 {expr:'(xi_s, yi_s)^T = Aθ · (xi_t, yi_t, 1)^T',
  tex:'\\begin{pmatrix}x_i^{s}\\\\ y_i^{s}\\end{pmatrix} = A_\\theta \\begin{pmatrix}x_i^{t}\\\\ y_i^{t}\\\\ 1\\end{pmatrix}',
  d:'출력 좌표계의 정규 격자점 $(x_i^t, y_i^t)$ 마다, 이 점을 만들기 위해 입력의 어느 좌표 $(x_i^s, y_i^s)$ 를 샘플링해야 하는지를 역으로 계산한다.'},
 {expr:'Vi_c = Σ Σ Uc(n, m) · max(0, 1-|xi_s-m|) · max(0, 1-|yi_s-n|)',
  tex:'V_i^{c} = \\sum_{n}^{H}\\sum_{m}^{W} U_{nm}^{c}\\,\\max(0,1-|x_i^s-m|)\\,\\max(0,1-|y_i^s-n|)',
  d:'양선형 샘플링 커널. $x_i^s, y_i^s$ 가 정수가 아니어도 값이 정의되고, 입력 픽셀 값 $U$ 와 좌표 $x_i^s,y_i^s$ 양쪽에 대해 미분 가능하다.'}
],

numbers:[
 {k:'Cluttered MNIST 오류율', v:'ST-CNN 1.7%', d:'같은 CNN 3.5%, 순수 FC 13.2% 대비 큰 개선 (60×60, 배경 잡음 포함)'},
 {k:'SVHN 시퀀스 오류율(64px)', v:'ST-CNN 3.6%', d:'이전 SOTA 3.9%(RNN 기반) 대비 우위, 단일 forward pass로 달성'},
 {k:'CUB-200-2011 새 분류', v:'84.1%', d:'baseline Inception 대비 **+1.8%**, 2×ST-CNN이 서로 다른 부위(머리·몸통)에 자발적으로 정렬'},
 {k:'MNIST addition (2×ST-FCN)', v:'5.8% 오류', d:'단일 spatial transformer 18.5% 대비, 두 개를 쓰면 각각 숫자 하나씩 담당해 정확도 급증'},
 {k:'추가 연산', v:'ST-CNN Multi 6% 느림', d:'localisation net의 파라미터 외에는 계산 비용이 거의 늘지 않음'}
],

impact:'"attention은 곧 미분 가능한 연산이어야 한다"는 관점을 정착시켰다. 이전까지 이미지의 특정 영역에 주목하는 메커니즘은 강화학습으로 학습하는 hard attention이 흔했는데, spatial transformer는 좌표 변환을 양선형 보간으로 매끄럽게 만들어 표준 역전파만으로 학습 가능함을 보였다. affine grid sampling은 이후 사실상 모든 딥러닝 프레임워크의 표준 연산(`grid_sample`)이 되어, 워핑·정렬·초해상도·[GAN](#/p/gan) 기반 이미지 생성 어디서나 쓰이는 기본 부품이 됐다.',

legacy:[
 '**미분 가능한 워핑 연산의 표준화** — `grid_sample`/`affine_grid`류 함수로 PyTorch·TensorFlow에 내장되어 정렬·데이터 증강·optical flow warping 등에 범용적으로 쓰임',
 '**hard attention에서 soft/미분 가능 attention으로의 흐름** — 이후 [Transformer](#/p/transformer)의 attention이 완전히 다른 형태이긴 하지만, "attention을 역전파로 학습한다"는 태도 전환에 이 논문이 초기 이정표 역할을 했다',
 '**detection·pose 분야로 확산** — 객체 정렬이 필요한 여러 후속 연구(얼굴 정렬, 텍스트 인식, few-shot 분류)가 spatial transformer를 전처리 모듈로 채택',
 '**"모듈을 네트워크 안에 넣는다"는 설계 패턴** — 이후 [SENet](#/p/senet)의 채널 재보정 블록처럼, 특정 연산을 학습 가능한 삽입형 서브모듈로 만드는 흐름의 초기 사례'
],

pitfalls:[
 '**attention과 완전히 같은 개념은 아니다.** affine 파라미터를 crop/scale로만 제약하면 attention과 유사해지지만, 기본형은 회전·전단·thin-plate spline까지 포함하는 훨씬 일반적인 기하 변환이다.',
 '**localisation net이 나쁜 초기화에서 학습이 안 될 수 있다.** θ를 항등 변환(identity)으로 초기화하지 않으면 처음부터 극단적인 워핑을 만들어 그래디언트가 불안정해지기 쉽다.',
 '**전역 변환만 다룬다는 오해.** 하나의 spatial transformer는 feature map 전체에 같은 변환을 적용하지만, 여러 개를 병렬로 쓰면 서로 다른 지역/객체를 각각 담당하게 만들 수 있다 — 이는 자동이 아니라 학습으로 유도되는 결과다.'
],

figures:[
 {f:'fig1-mnist.png',
  cap:'(a) 회전·크기·이동·잡음으로 왜곡된 MNIST 입력. (b) localisation net이 예측한 변환을 입력 위에 겹쳐 그린 것(색이 있는 사각형) — 숫자를 감싸는 형태로 스스로 정렬됐다. (c) 그 변환을 적용해 정규화한 출력. (d) 이후 분류기가 맞춘 라벨. 변환 정답 라벨 없이 분류 손실만으로 (b)가 학습됐다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-module.png',
  cap:'U가 localisation net에 들어가 θ를 만들고, grid generator가 출력 격자 G를 θ로 왜곡해 $\\mathcal{T}_\\theta(G)$ 를 계산한 뒤, sampler가 U에서 그 위치들을 읽어 V를 만든다. U→sampler로 가는 아래쪽 화살표가 실제 픽셀 데이터, 위쪽 경로가 변환 파라미터 흐름.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'This differentiable module can be inserted into existing convolutional architectures, giving neural networks the ability to actively spatially transform feature maps, conditional on the feature map itself, without any extra training supervision or modification to the optimisation process.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1506.02025 — Spatial Transformer Networks', u:'https://arxiv.org/abs/1506.02025'},
 {t:'PyTorch affine_grid / grid_sample 문서', u:'https://pytorch.org/docs/stable/generated/torch.nn.functional.grid_sample.html'}
]
});
