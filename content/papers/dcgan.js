WIKI.paper({
slug:'dcgan',
venue:'ICLR 2016',
authors:'Radford, Metz, Chintala (indico Research · Facebook AI Research)',
arxiv:'1511.06434',

tldr:'GAN을 CNN으로 안정적으로 학습시키는 **구조 규칙 다섯 줄**을 정리한 논문. 덕분에 GAN이 "가끔 되는 신기한 실험"에서 남들도 재현 가능한 기본 도구가 되었고, 잠재벡터 산술이 가능하다는 것까지 보였다.',

context:'[GAN](#/p/gan) 논문 이후 1년 반 동안 GAN은 대체로 MLP 기반의 작은 모델에 머물러 있었다. [AlexNet](#/p/alexnet) 이후 지도학습 비전은 이미 전부 CNN이었는데, 같은 CNN을 GAN에 그대로 넣으면 학습이 발산하거나 모드 붕괴로 끝나기 일쑤였다. 문제는 이론이 아니라 **레시피의 부재**였다 — 어떤 층을 쓰고 어디에 정규화를 넣고 어떤 활성화를 쓸지에 대한 합의가 없었다. 이 논문은 새로운 목적함수를 제안하지 않는다. 수많은 조합을 실험해서 "이렇게 하면 대부분의 데이터셋에서 학습이 된다"는 구조 규칙을 뽑아낸, 철저히 경험적인 논문이다.',

ideas:[
 {h:'풀링을 없애고 stride로 해상도를 바꾼다',
  lead:'고정된 풀링 대신 strided conv로 다운·업샘플링 자체를 네트워크가 학습하게 한다.',
  d:'판별자의 max-pooling을 **stride 2 convolution**으로, 생성자의 upsampling을 **fractionally-strided convolution**(전치 합성곱)으로 바꾼다. 다운/업샘플링 방식 자체를 네트워크가 학습하게 만드는 것이다. 고정된 풀링은 생성자 쪽 gradient 경로를 거칠게 만들어 학습을 불안정하게 했다.'},
 {h:'완전연결 은닉층을 전부 제거한다',
  lead:'생성자와 판별자 모두 전부 합성곱만으로 구성한다.',
  d:'생성자는 100차원 $z$ 를 한 번의 투영으로 4×4×1024 텐서로 reshape한 뒤 전치 합성곱만 쌓고, 판별자는 마지막 특징맵을 flatten해 바로 시그모이드로 보낸다. 전역 평균 풀링은 안정성은 올렸지만 수렴 속도를 떨어뜨려 쓰지 않았다. 결과적으로 **전부 합성곱**인 구조가 된다.'},
 {h:'BatchNorm은 넣되, 두 곳은 반드시 뺀다',
  lead:'생성자 출력층과 판별자 입력층만 빼고 나머지 전 층에 BatchNorm을 넣는다.',
  d:'[배치 정규화](#/p/batchnorm)를 생성자와 판별자 양쪽에 넣으면 gradient 흐름이 좋아지고 초기화에 덜 민감해진다. 다만 **생성자의 출력층과 판별자의 입력층에는 넣지 않는다** — 모든 층에 넣으면 샘플이 진동하며 학습이 불안정해졌다. 이 예외 두 개가 규칙의 핵심이다.'},
 {h:'활성화 함수: G는 ReLU/tanh, D는 LeakyReLU',
  lead:'판별자에 ReLU를 쓰면 음수 gradient가 죽어 생성자로 가는 신호가 끊긴다.',
  d:'생성자는 은닉층에 ReLU, 출력층에만 tanh를 쓴다(데이터를 $[-1,1]$ 로 정규화). 판별자는 전 층에 기울기 0.2의 LeakyReLU를 쓴다 — 판별자에서 ReLU를 쓰면 음수 영역의 gradient가 0이 되어 생성자로 되돌아가는 학습 신호 자체가 끊긴다. **생성자를 학습시키는 것은 판별자의 gradient이므로, 판별자의 죽은 뉴런은 곧 생성자의 학습 정지다.**'},
 {h:'잠재공간이 매끄럽고, 벡터 산술이 성립한다',
  lead:'z를 보간하면 이미지가 매끄럽게 변하고, z의 덧셈·뺄셈이 의미론적으로 작동한다.',
  d:'$z$ 를 두 점 사이에서 보간하면 이미지가 급변하지 않고 의미 있게 변형된다(창문이 서서히 TV가 되는 식). 나아가 "안경 쓴 남자 $-$ 남자 $+$ 여자"에 해당하는 $z$ 평균 벡터를 계산하면 안경 쓴 여자가 나온다. 단순 암기라면 나올 수 없는 성질로, **생성자가 표현을 배웠다**는 근거로 제시되었다. 방향을 찾아 조작한다는 이 아이디어는 [StyleGAN](#/p/stylegan)의 $W$ 공간 연구로 이어진다.'}
],

diagram:{type:'stack', cap:'DCGAN 생성자. 100차원 노이즈에서 64×64 이미지까지, 전치 합성곱만으로 해상도를 4배씩 키운다.',
 layers:[
  {t:'노이즈 z', s:'Uniform(-1,1) 100차원'},
  {t:'선형 투영', s:'reshape → 4×4×1024', note:'← 유일한 FC'},
  {t:'전치conv+BN+ReLU', s:'8×8×512'},
  {t:'전치conv+BN+ReLU', s:'16×16×256', acc:true, note:'← stride 2로 업샘플 학습'},
  {t:'전치conv+BN+ReLU', s:'32×32×128'},
  {t:'전치conv+tanh', s:'64×64×3', note:'← 출력층엔 BN 없음'}
 ]},

figures:[
 {f:'fig1-generator-architecture.png',
  cap:'왼쪽의 100차원 노이즈 z가 "project and reshape"로 4×4×1024 텐서가 된 뒤, stride 2의 전치 합성곱(CONV1~4)을 네 번 거치며 4×4→8×8→16×16→32×32→64×64로 해상도가 두 배씩 커진다. 채널 수(1024→512→256→128→3)는 반대로 줄어든다. 완전연결층도 풀링층도 전혀 없다는 것이 이 그림에서 확인해야 할 핵심.',
  src:'원문 Figure 1, p.4'},
 {f:'fig7-latent-vector-arithmetic.png',
  cap:'위 세 열은 각각 "안경 쓴 남자", "안경 없는 남자", "안경 없는 여자" 샘플 세 장씩의 z 벡터를 평균낸 것. 그 평균 벡터끼리 뺄셈·덧셈을 한 결과를 생성자에 넣으면 오른쪽의 "안경 쓴 여자"가 나온다 — 학습 데이터에 그런 조합이 있었던 게 아니라 z 공간의 산술만으로 나온 것이다.',
  src:'원문 Figure 7, p.10'}
],

numbers:[
 {k:'Adam 학습률', v:'0.0002', d:'기본값 0.001은 너무 커서 발산했다'},
 {k:'Adam β₁', v:'0.5', d:'권장값 0.9는 학습 진동을 유발 — GAN 구현의 사실상 표준값이 됨'},
 {k:'LeakyReLU 기울기', v:'0.2', d:'판별자 전 층'},
 {k:'가중치 초기화', v:'N(0, 0.02²)', d:'배치 크기 128'},
 {k:'LSUN 침실 학습 데이터', v:'300만 장 이상', d:'GAN을 이 규모 데이터로 안정적으로 돌린 첫 사례급'},
 {k:'CIFAR-10 분류 정확도', v:'82.8%', d:'판별자 특징 + L2-SVM. 생성자를 안 쓰고 **표현 학습기**로 평가한 것'},
 {k:'SVHN 오류율 (라벨 1000개)', v:'22.48%', d:'준지도 세팅에서 당시 경쟁력 있는 수치'}
],

quotes:[
 {t:'We introduce a class of CNNs called deep convolutional generative adversarial networks (DCGANs), that have certain architectural constraints, and demonstrate that they are a strong candidate for unsupervised learning.',
  src:'Abstract, p.1'}
],

impact:'세 가지가 바뀌었다. **(1) 재현성** — 이 규칙을 따르면 대부분의 데이터셋에서 학습이 되었고, 이후 몇 년간 나온 GAN 논문의 baseline은 거의 다 DCGAN이었다. `beta1=0.5`, LeakyReLU 0.2, tanh 출력 같은 값은 지금도 GAN 코드에 그대로 남아 있다. **(2) 평가 관점의 전환** — 판별자를 떼어내 분류 특징 추출기로 쓰는 실험은 GAN을 생성기가 아니라 **비지도 표현 학습기**로 보는 시각을 열었다. **(3) 잠재공간 조작** — 보간과 벡터 산술 데모는 "생성 모델의 잠재공간을 편집한다"는 응용 분야 전체의 출발점이 되었다.',

legacy:[
 '**조건부 변환** — 이 생성자/판별자 규격 위에 조건 입력을 얹은 것이 [pix2pix](#/p/pix2pix), 짝 없는 데이터로 확장한 것이 [CycleGAN](#/p/cyclegan)',
 '**안정화의 다음 단계** — 구조로 안정화를 시도한 이 논문 이후, [WGAN](#/p/wgan)은 목적함수 자체를 바꾸는 방향으로 같은 문제를 공격',
 '**잠재공간 제어** — 보간·벡터 산술 실험이 [StyleGAN](#/p/stylegan)의 $W$ 공간과 스케일별 스타일 제어로 발전',
 '**표현 학습 계열** — 판별자 특징을 재사용하는 발상은 이후 [SimCLR](#/p/simclr)·[MoCo](#/p/moco) 같은 자기지도 학습 흐름과 문제의식을 공유'
],

pitfalls:[
 '**이 규칙은 이론이 아니라 경험칙이다.** 논문 스스로 "모델이 오래 학습되면 일부 필터가 하나의 진동 모드로 붕괴한다"고 인정한다. 규칙을 지켜도 모드 붕괴는 여전히 일어나며, 해상도를 올리면(128×128 이상) 다시 무너진다.',
 '**전치 합성곱은 체커보드 아티팩트를 만든다.** kernel 크기가 stride로 나누어떨어지지 않으면 출력에 격자 무늬가 생긴다. 이후 구현들은 "최근접 업샘플 + 일반 conv"로 갈아타는 경우가 많다. 논문 그림을 그대로 옮기면 이 아티팩트를 그대로 물려받는다.',
 '**잠재공간 산술을 word2vec 수준의 성질로 과대해석하면 안 된다.** 논문도 단일 $z$ 로는 결과가 불안정해 **여러 샘플의 평균 벡터**를 써야 했다고 명시한다. 축이 깔끔하게 분리(disentangle)돼 있다는 뜻이 아니며, 그 문제를 정면으로 다룬 것이 [StyleGAN](#/p/stylegan)이다.'
],

links:[
 {t:'arXiv 1511.06434 — Unsupervised Representation Learning with DCGANs', u:'https://arxiv.org/abs/1511.06434'},
 {t:'Deconvolution and Checkerboard Artifacts (Distill)', u:'https://distill.pub/2016/deconv-checkerboard/'},
 {t:'PyTorch DCGAN Tutorial', u:'https://pytorch.org/tutorials/beginner/dcgan_faces_tutorial.html'}
]
});
