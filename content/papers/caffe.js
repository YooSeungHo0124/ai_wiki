WIKI.paper({
slug:'caffe',
venue:'ACM Multimedia 2014 (Open Source Software Competition)',
authors:'Jia, Shelhamer et al. (UC Berkeley EECS / BVLC)',
arxiv:'1408.5093',

tldr:'CNN을 config 파일로 정의하고 CPU/GPU를 한 줄로 전환해 학습·배포할 수 있게 만든 C++ 딥러닝 프레임워크. 사전학습 가중치를 배포하는 "Model Zoo" 문화의 시작점이자, 2014~2016년 비전 연구 대부분이 그 위에서 돌아간 공용 인프라였다.',

context:'2012년 [AlexNet](#/p/alexnet) 이후 CNN이 비전 벤치마크를 휩쓸기 시작했지만, 매 논문마다 연구자가 CUDA 커널과 역전파를 직접 짜야 했다. cuda-convnet·Decaf·OverFeat 같은 도구가 있었지만 저마다 개발이 중단되거나(cuda-convnet, Decaf), 특정 언어·플랫폼에 묶여 있었다. 연구 결과를 재현하려면 논문과 별개로 그 구현 전체를 다시 짜야 하는 경우가 흔했고, 학습된 가중치가 공개되더라도 그것만으로는 새로운 데이터에 적용하거나 실험을 확장하기 어려웠다.',

ideas:[
 {h:'네트워크 정의와 구현을 분리한다',
  lead:'Protocol Buffer 텍스트 config로 네트워크를 정의하고, 실행 엔진은 그 정의를 그대로 해석한다.',
  d:'Caffe 모델은 C++ 코드가 아니라 Protocol Buffer 형식의 config 파일로 정의된다. 네트워크는 임의의 방향성 비순환 그래프(DAG)로 표현되고, Caffe는 이 정의만 보고 필요한 만큼만 메모리를 예약한다. **CPU와 GPU 사이의 전환이 함수 호출 하나**라서, 같은 모델 정의를 재작성 없이 노트북에서 클러스터까지 그대로 옮길 수 있다.'},
 {h:'Blob: 4차원 배열 하나로 모든 데이터를 통일',
  lead:'이미지·파라미터·그래디언트를 전부 같은 4차원 Blob 구조로 다뤄 CPU/GPU 동기화를 감춘다.',
  d:'이미지 배치든, 가중치든, 그래디언트든 Caffe 안에서는 전부 Blob이라는 4차원 배열이다. Blob은 필요할 때만 호스트-디바이스 메모리를 동기화해, 사용자는 "이 데이터가 지금 CPU에 있는지 GPU에 있는지"를 신경 쓰지 않고 레이어를 이어붙일 수 있다.'},
 {h:'레이어는 forward/backward 두 함수만 구현하면 된다',
  lead:'입력을 출력으로 바꾸는 forward와 그래디언트를 전파하는 backward만 있으면 새 레이어를 추가할 수 있다.',
  d:'레이어는 하나 이상의 Blob을 입력받아 하나 이상의 Blob을 출력하는 단위로, forward pass(출력 계산)와 backward pass(파라미터·입력에 대한 그래디언트 계산) 두 책임만 지면 된다. Convolution·Pooling·ReLU·Softmax 손실 등 표준 레이어가 이미 CPU/GPU 양쪽 구현으로 갖춰져 있어, 새 레이어는 이 인터페이스만 맞추면 기존 네트워크에 바로 끼워 넣을 수 있다.'},
 {h:'사전학습 가중치와 재현 코드를 함께 공개한다',
  lead:'AlexNet·R-CNN 같은 참조 모델의 가중치와 재현 레시피를 나란히 배포한다.',
  d:'학습된 가중치만 공개하면 재현이나 확장이 어렵다는 문제의식 아래, Caffe는 [AlexNet](#/p/alexnet)이나 [R-CNN](#/p/rcnn) 같은 참조 모델의 **가중치와 이를 만든 config·코드**를 함께 배포했다. 이 가중치를 가져와 새 데이터셋에 맞게 마지막 층만 다시 학습시키는 fine-tuning이 이 논문에서 이미 표준 워크플로로 제시된다.'}
],

diagram:{type:'stack', cap:'Caffe에서 네트워크 하나는 데이터 레이어에서 손실 레이어까지 이어지는 Blob들의 사슬로 정의된다.',
 layers:[
  {t:'Data 레이어', s:'디스크 → Blob'},
  {t:'Convolution', s:'CPU/GPU 동일 구현'},
  {t:'Pooling', s:'다운샘플링'},
  {t:'Inner Product', s:'완전연결'},
  {t:'ReLU', s:'비선형'},
  {t:'Loss 레이어', s:'Softmax 등', acc:true, note:'그래디언트 시작점'}
 ]},

numbers:[
 {k:'처리 속도', v:'4천만 장/일', d:'단일 K40 또는 Titan GPU 기준, 이미지당 약 2.5ms'},
 {k:'LevelDB 처리량', v:'150MB/s', d:'대용량 데이터 저장 벤치마크, 커밋 CPU 사용량 최소'},
 {k:'라이선스', v:'BSD', d:'코드는 BSD, 일부 참조 모델은 비상업적 용도로 별도 제한'},
 {k:'개발 방식', v:'분산형', d:'BVLC 주도 + GitHub 오픈소스 기여, Table 1에서 cuda-convnet·Decaf는 "discontinued"로 대비됨'}
],

impact:'Caffe는 "좋은 아키텍처를 논문으로 설명하는 것"과 "그 아키텍처를 실제로 돌려볼 수 있는 것" 사이의 간극을 크게 좁혔다. 공개 첫 6개월 만에 버클리 안팎의 다수 연구 프로젝트에 쓰였고, Facebook·Adobe 같은 업계 파트너와의 협업에도 사용됐다. 무엇보다 [R-CNN](#/p/rcnn)·[FCN](#/p/fcn) 등 2014~2015년의 핵심 비전 논문들이 전부 Caffe 위에서 구현되면서, 프레임워크 자체가 그 시대 비전 연구의 공용 인프라가 됐다.',

legacy:[
 '**Model Zoo 문화의 시작** — 사전학습 가중치를 논문과 함께 공개하는 관행이 이후 거의 모든 딥러닝 생태계의 기본값이 됨',
 '**[R-CNN](#/p/rcnn) · [FCN](#/p/fcn)** — 두 논문 모두 Caffe 위에서 구현되어 발표됨, 프레임워크가 연구 속도 자체를 좌우한다는 것을 보여준 사례',
 '**Caffe2 → PyTorch로의 계보** — Caffe2가 이후 PyTorch에 흡수 합병되며, 오늘날 연구 표준이 된 PyTorch 생태계의 초기 계보 한 축을 이룸',
 '**"config로 네트워크를 정의한다"는 관행의 반작용** — Caffe의 정적 config 방식이 갖는 유연성 한계가, 이후 TensorFlow·PyTorch의 동적 계산 그래프 채택으로 이어지는 배경이 됨'
],

pitfalls:[
 '**config 기반 정의는 유연성이 떨어진다.** 조건부 분기나 동적 구조를 표현하려면 Protocol Buffer config만으로는 부족해, 이후 세대 프레임워크는 파이썬 코드로 직접 그래프를 짜는 방식(define-by-run)으로 넘어갔다.',
 '**"참조 모델 공개"가 전부 BSD는 아니다.** 논문이 명시하듯 사전학습 가중치 상당수는 학술·비상업적 용도로만 허용돼, Caffe 코드 자체의 BSD 라이선스와는 별개로 취급해야 한다.',
 '**Caffe = Model Zoo만 있는 도구가 아니다.** 이 논문의 핵심 주장은 속도(4천만 장/일)와 모듈성(테스트 커버리지, 레이어 인터페이스)이지, 단순히 미리 학습된 모델 모음이 아니다.'
],

figures:[
 {f:'fig1-network.png',
  cap:'파란 상자가 레이어, 노란 팔각형이 Blob이다. 왼쪽 data 레이어에서 시작해 conv→pool을 두 번 반복하고 완전연결(ip)·ReLU를 거쳐 오른쪽 loss 레이어까지 이어지는, MNIST 분류용 LeNet 스타일 네트워크 정의 하나가 그대로 config 파일 하나에 대응한다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'Caffe fits industry and internet-scale media needs by CUDA GPU computation, processing over 40 million images a day on a single K40 or Titan GPU (≈ 2.5 ms per image).',
  src:'Abstract, p.1'},
 {t:'We are strong proponents of reproducible research: we hope that a common software substrate will foster quick progress in the search over network architectures and applications.',
  src:'Section 2, p.2'}
],

links:[
 {t:'arXiv 1408.5093 — Caffe', u:'https://arxiv.org/abs/1408.5093'},
 {t:'Caffe (GitHub, BVLC)', u:'https://github.com/BVLC/caffe'}
]
});
