WIKI.paper({
slug:'alexnet',
venue:'NIPS 2012',
authors:'Krizhevsky, Sutskever, Hinton (University of Toronto)',

tldr:'[LeNet](#/p/lenet)의 CNN을 [ImageNet](#/p/imagenet) 규모로 키우고 GPU 두 장에 욱여넣어, ILSVRC-2012 top-5 오류율을 **26.2% → 15.3%** 로 끌어내린 논문. 손설계 특징의 시대를 한 대회에서 끝냈다.',

context:'2012년 이전 ImageNet 대회의 표준 파이프라인은 SIFT/HOG 같은 손설계 지역 특징 → Fisher vector 등으로 인코딩 → 선형 SVM이었다. 상위 팀들의 top-5 오류율은 26% 부근에서 정체돼 있었고, 매년의 개선은 특징 인코딩 단계의 세부 튜닝에서 나왔다. CNN이 안 될 이유는 원리가 아니라 물량이었다 — 라벨된 이미지가 수만 장 수준이라 큰 모델은 곧바로 과적합했고, 학습에 몇 달이 걸렸다. 그 사이 [ImageNet](#/p/imagenet)이 1,000 클래스 120만 장을 만들었고, GPU의 범용 연산이 쓸 만해졌다. 이 논문은 새 원리를 제안한 게 아니라 **"이제 조건이 갖춰졌으니 크게 만들면 된다"를 실행하고, 그 과정에서 필요한 공학 장치들을 한 세트로 묶었다.**',

ideas:[
 {h:'ReLU — 포화하지 않는 활성화',
  lead:'양수 구간 기울기가 항상 1이라 tanh보다 학습이 훨씬 빠르다.',
  d:'tanh·sigmoid는 입력이 크면 기울기가 0으로 죽어 깊은 망의 학습이 기어간다. $f(x)=\\max(0,x)$ 는 양수 구간에서 기울기가 항상 1이라 포화가 없다. 논문의 CIFAR-10 실험에서 동일 구조가 학습 오류 25%에 도달하는 데 ReLU는 tanh보다 **약 6배 빠르다**. 원리적 통찰이라기보다, 이 속도차가 없었으면 6일짜리 학습이 한 달이 되어 실험 자체가 불가능했다는 점이 핵심이다.'},
 {h:'GPU 2장 모델 병렬 — 메모리 제약이 만든 구조',
  lead:'GPU 메모리 한계 때문에 채널을 절반씩 나눠 두 GPU에서 학습했다.',
  d:'GTX 580의 메모리가 3GB뿐이라 모델이 한 장에 안 들어갔다. 그래서 채널을 절반씩 두 GPU에 나누고 **특정 층에서만 GPU 간 통신**을 허용했다. 순전히 하드웨어 제약에서 나온 설계인데, 결과적으로 두 GPU가 서로 다른 종류의 필터(한쪽은 색상, 한쪽은 방향성 엣지)를 학습하는 흥미로운 부작용이 관찰됐다. 이후 하드웨어가 커지자 사라진 요소다.'},
 {h:'Dropout — 과적합에 대한 정면 대응',
  lead:'완전연결층 뉴런을 절반씩 꺼서 공적응을 깨고 과적합을 줄인다.',
  d:'60M 파라미터를 120만 장으로 학습하면 과적합이 기본값이다. 완전연결 첫 두 층에서 뉴런을 확률 0.5로 끄면 매 스텝마다 다른 부분망이 학습되고, 뉴런들이 특정 이웃에 의존하는 공적응이 깨진다. 논문은 이것 없이는 "상당한 과적합"이 관찰됐다고 명시한다. → [Dropout 논문](#/p/dropout)'},
 {h:'데이터 증강을 사실상 공짜로',
  lead:'무작위 크롭·반전·색상 변형을 CPU에서 겹쳐 실행해 공짜로 증강한다.',
  d:'256×256 이미지에서 224×224 패치와 좌우 반전을 무작위로 뽑고(2048배 확대), PCA로 구한 RGB 주성분 방향으로 조명 색을 흔든다. 이 변환들은 CPU에서 돌면서 GPU 학습과 겹쳐 실행되므로 **추가 시간 비용이 0**이다. 규제를 데이터 쪽에서 거는 이 관행이 이후 비전 학습의 기본이 된다.'},
 {h:'LRN — 계승되지 않은 부품',
  lead:'채널 간 경쟁으로 정규화하는 LRN을 넣었지만 후속 연구에서 폐기됐다.',
  d:'같은 위치의 인접 채널 활성 사이에 경쟁을 걸어 정규화하는 Local Response Normalization을 넣고 top-5를 1.2%p 낮췄다고 보고한다. 하지만 이후 [VGG](#/p/vgg)가 효과 없음을 실험으로 보였고, [Batch Normalization](#/p/batchnorm)이 나오면서 완전히 사라졌다.'}
],

diagram:{type:'compare', cap:'2012년 대회의 두 접근. 오른쪽은 특징 추출기까지 오류 신호로 학습된다.',
 left:{t:'기존: 손설계 특징 + SVM', items:[
  'SIFT / HOG 로 지역 특징 추출',
  'Fisher vector 등으로 인코딩',
  '선형 SVM 만 학습됨',
  '특징 단계는 오류로부터 배우지 못함',
  'ILSVRC-2012 2위: top-5 26.2%']},
 right:{t:'AlexNet: 8층 CNN', items:[
  'conv 5층 + 완전연결 3층',
  '픽셀→소프트맥스 한 번에 학습',
  'ReLU · dropout · 데이터 증강',
  'GTX 580 2장 · 5~6일',
  'top-5 15.3%']}},

math:[
 {expr:'f(x) = max(0, x)',
  tex:'f(x)=\\max(0,x)',
  d:'ReLU. 미분이 0 아니면 1이라 곱해도 값이 줄지 않고, 계산이 비교 한 번이라 싸다. 음수 구간이 통째로 0이 되면서 활성이 자연스럽게 희소해지는 부수 효과도 있다.'},
 {expr:'v ← 0.9·v − 0.0005·ε·w − ε·⟨∂L/∂w⟩,   w ← w + v',
  tex:'v \\leftarrow 0.9v - 0.0005\\,\\epsilon w - \\epsilon\\left\\langle \\dfrac{\\partial L}{\\partial w}\\right\\rangle,\\quad w\\leftarrow w+v',
  d:'논문이 쓴 갱신 규칙. 모멘텀 0.9, weight decay 0.0005다. 여기서 weight decay는 단순 규제가 아니라 **학습 오류 자체를 낮추는 데도 필요했다**고 논문이 특기하고 있다.'}
],

numbers:[
 {k:'ILSVRC-2012 top-5', v:'15.3%', d:'2위 팀은 **26.2%** — 한 대회에서 10%p 이상 격차'},
 {k:'ILSVRC-2010 top-1 / top-5', v:'37.5% / 17.0%', d:'테스트 라벨이 공개된 2010 데이터에서의 정식 비교치'},
 {k:'파라미터', v:'6,000만 · 뉴런 65만', d:'conv 5층 + FC 3층, 마지막은 1000-way softmax'},
 {k:'학습', v:'GTX 580 3GB × 2, 5~6일', d:'90 epoch. 메모리 3GB가 2-GPU 분할 설계의 직접적 원인'},
 {k:'ReLU 가속', v:'약 6배', d:'CIFAR-10에서 학습 오류 25% 도달까지, tanh 대비'},
 {k:'데이터', v:'1,000 클래스 · 약 120만 장', d:'[ImageNet](#/p/imagenet) 없이는 이 크기의 모델을 학습시킬 수 없었다'}
],

impact:'단일 대회 결과가 분야 전체의 연구 주제를 바꾼 드문 사례다. **(1)** 2013년 ILSVRC부터 상위권이 전부 CNN으로 갈아탔고, 손설계 특징 연구는 사실상 멈췄다. **(2)** "특징 추출기까지 오류 신호로 학습한다"는 원칙이 분류를 넘어 검출([R-CNN](#/p/rcnn))·분할([FCN](#/p/fcn))·생성([DCGAN](#/p/dcgan))·강화학습([DQN](#/p/dqn))으로 이식됐다. **(3)** 딥러닝이 GPU 산업의 수요처가 됐다 — 이 논문이 GPU를 연구 필수 장비로 만든 출발점이다. **(4)** 동시에 다음 질문을 남겼다: 8층이 이만큼이면, 더 깊게 가면 어떻게 되는가. 그 질문을 [VGG](#/p/vgg)와 [GoogLeNet](#/p/googlenet)이 정면으로 받는다.',

legacy:[
 '**깊이 경쟁의 개시** — 2년 뒤 [VGG](#/p/vgg)(19층)와 [GoogLeNet](#/p/googlenet)(22층)이 top-5를 7% 아래로, 다시 1년 뒤 [ResNet](#/p/resnet)(152층)이 3.57%까지 내린다',
 '**전이학습의 표준화** — ImageNet 사전학습 가중치를 떼어다 다른 과제에 붙이는 관행이 [R-CNN](#/p/rcnn)을 시작으로 비전 전 분야의 기본 절차가 됨',
 '**규제 삼종 세트** — [dropout](#/p/dropout) · 데이터 증강 · weight decay 조합이 이후 수년간 기본 레시피로 고정',
 '**LRN의 퇴장** — 정규화 자리는 [Batch Normalization](#/p/batchnorm)이 가져가고, AlexNet의 LRN·2-GPU 분할은 역사적 유물이 됨'
],

pitfalls:[
 '**"AlexNet이 CNN을 처음 만들었다"는 오해.** 구조적으로는 [LeNet](#/p/lenet)의 확대판에 가깝다. 새로웠던 것은 규모(120만 장 × 60M 파라미터)와 그 규모를 감당하기 위한 공학 — ReLU·dropout·GPU 구현·증강 — 의 **조합**이다.',
 '**논문 그림의 두 갈래 구조를 아키텍처적 통찰로 읽지 말 것.** 3GB GPU 두 장이라는 제약의 산물이고, 오늘날 재현 구현은 대부분 단일 경로로 합쳐서 쓴다.',
 '**LRN을 따라 넣을 이유가 없다.** [VGG](#/p/vgg)가 무효과를 보고했고 [BatchNorm](#/p/batchnorm)으로 대체됐다. 논문을 그대로 복각하는 것과 지금 쓸 만한 모델을 만드는 것은 다른 일이다.'
],

figures:[
 {f:'fig2-two-gpu-architecture.png',
  cap:'위아래 두 줄이 GPU 1과 GPU 2다. 대부분의 화살표가 자기 줄 안에서만 이어지고, conv3 앞뒤 등 몇 군데서만 줄을 건너뛰는 점선이 보인다 — "두 GPU가 특정 층에서만 통신한다"는 문장의 실제 그림이다. 왼쪽 끝 224×224×3 입력에서 오른쪽 끝 1000-way 출력까지, 텐서 크기(55, 27, 13 …)가 층을 지날 때마다 줄어드는 것도 함께 보인다.',
  src:'원문 Figure 2, p.5'},
 {f:'fig3-first-layer-kernels.png',
  cap:'첫 conv층이 학습한 11×11×3 커널 96개 중 절반씩을 위(GPU 1)·아래(GPU 2) 줄에 배치했다. 위 줄은 대부분 흑백의 방향성 에지·격자 무늬(주파수·방향 검출기)이고, 아래 줄은 색 얼룩(color blob) 위주다 — **두 GPU가 서로 다른 종류의 특징으로 역할을 나눠 가졌다는 것**을 저자들이 설계한 게 아니라 학습 후에 관찰했다.',
  src:'원문 Figure 3, p.6'}
],

quotes:[
 {t:'We trained a large, deep convolutional neural network to classify the 1.2 million high-resolution images in the ImageNet LSVRC-2010 contest into the 1000 different classes.',
  src:'Abstract, p.1'}
],

links:[
 {t:'ImageNet Classification with Deep Convolutional Neural Networks (NIPS 2012)', u:'https://papers.nips.cc/paper_files/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html'},
 {t:'ILSVRC 2012 results', u:'https://image-net.org/challenges/LSVRC/2012/results.html'}
]
});
