WIKI.paper({
slug:'densenet',
venue:'CVPR 2017 (Best Paper)',
authors:'Huang, Liu, van der Maaten, Weinberger (Cornell · Tsinghua · Facebook AI Research)',
arxiv:'1608.06993',

tldr:'[ResNet](#/p/resnet)이 이전 층의 출력을 **더했다면**, DenseNet은 이전 모든 층의 출력을 **이어붙인다**. 층마다 새로 만드는 채널 수(growth rate)를 12~32개로 극단적으로 줄여도 성능이 유지되며, 결과적으로 같은 정확도를 절반 이하의 파라미터로 달성한다.',

context:'[ResNet](#/p/resnet)이 152층을 학습 가능하게 만든 뒤, 후속 연구들은 "왜 residual이 작동하는가"를 파고들었다. 이 무렵 나온 stochastic depth 실험이 힌트를 줬다 — **학습 중 층을 무작위로 통째로 건너뛰어도 ResNet은 잘 학습된다**. 즉 많은 층이 기여가 거의 없고 서로 중복된 특징을 다시 만들고 있다는 뜻이다. 실제로 ResNet의 각 블록은 자기만의 가중치를 갖고 자기만의 채널 전체를 새로 생성한다. DenseNet의 질문은 여기서 출발한다 — 앞 층이 만든 특징을 **버리지 않고 그대로 볼 수 있다면**, 각 층은 남들이 안 만든 몇 개만 추가하면 되지 않는가?',

ideas:[
 {h:'덧셈이 아니라 연결(concatenation)',
  lead:'이전 층 출력을 더하지 않고 채널 축으로 이어붙여 원본 그대로 보존한다.',
  d:'ResNet은 $x_l = H_l(x_{l-1}) + x_{l-1}$ 로 이전 신호를 **합산**한다. 합산은 두 신호를 섞어버려서 원래 특징이 뒤의 층에서 그대로 보이지 않는다. DenseNet은 채널 축으로 이어붙여 $x_l = H_l([x_0, x_1, \\ldots, x_{l-1}])$ 로 만든다. 앞선 모든 특징 맵이 **원본 그대로** 뒤의 모든 층의 입력이 되고, 블록 안 $L$ 개 층 사이에 $L(L+1)/2$ 개의 직접 연결이 생긴다.'},
 {h:'growth rate $k$ — 층당 새로 만드는 채널은 12개면 충분하다',
  lead:'집단 지식에 접근 가능해 각 층은 새 채널을 $k$ 개만 만들면 된다.',
  d:'각 층은 딱 $k$ 개의 특징 맵만 생성한다. CIFAR 실험의 기본값은 $k=12$ 로, VGG나 ResNet의 층당 수백 채널에 비하면 극단적으로 좁다. 그래도 되는 이유는 층이 "지금까지의 집합적 지식(collective knowledge)"에 접근할 수 있어 **이미 있는 특징을 다시 만들 필요가 없기** 때문이다. $l$ 번째 층의 입력 채널은 $k_0 + k(l-1)$ 로 선형 증가한다.'},
 {h:'Bottleneck과 compression으로 폭발을 막는다 (DenseNet-BC)',
  lead:'1×1로 채널을 미리 줄이고 transition에서 다시 절반으로 압축한다.',
  d:'입력 채널이 선형으로 늘어나므로 3×3 conv 비용도 같이 는다. 그래서 각 층 앞에 1×1 conv를 두어 $4k$ 채널로 먼저 줄이고(B), 해상도가 바뀌는 transition layer에서 채널 수에 $\\theta = 0.5$ 를 곱해 절반으로 압축한다(C). 이 두 장치를 넣은 DenseNet-BC가 파라미터 효율의 대부분을 만든다.'},
 {h:'Dense block + transition — 연결은 블록 안에서만',
  lead:'전결합은 해상도가 같은 dense block 내부로만 한정된다.',
  d:'모든 층을 다 잇는다는 말은 **같은 해상도 구간 안에서만** 참이다. 연결 대상은 특징 맵 크기가 같아야 하므로, 네트워크는 3~4개의 dense block으로 나뉘고 블록 사이에 BN → 1×1 conv → 2×2 average pooling 의 transition layer가 들어가 해상도를 반으로 줄인다.'},
 {h:'감독 신호가 짧아진다 (implicit deep supervision)',
  lead:'출력이 모든 중간 층과 거의 직접 연결돼 gradient가 얕은 층까지 바로 간다.',
  d:'출력 직전의 classifier가 모든 중간 층과 최대 2~3개의 transition layer만 거쳐 연결되므로, 손실의 gradient가 얕은 층까지 거의 직행한다. 저자들은 이것을 각 층에 별도 분류기를 붙이는 deep supervision의 **암묵적 버전**으로 해석하며, DenseNet이 정규화 효과를 갖는 이유로 든다.'}
],

diagram:{type:'compare', cap:'같은 "지름길"이라도 더하느냐 이어붙이느냐가 파라미터 효율을 가른다.',
 left:{t:'ResNet: 덧셈 지름길', items:[
  '덧셈으로 이전 층 출력과 결합',
  '채널 수 유지 — 층마다 전체를 새로 생성',
  '합산되어 앞 특징의 원형은 소실',
  '층 간 연결 L개',
  '층당 수백 채널이 필요']},
 right:{t:'DenseNet: 연결 지름길', items:[
  'concat으로 이전 모든 출력과 결합',
  '층당 새 채널은 k개(=12~32)뿐',
  '앞 특징이 원본 그대로 재사용됨',
  '층 간 연결 L(L+1)/2개',
  '같은 정확도를 절반 이하 파라미터로']}},

figures:[
 {f:'fig1-dense-block.png',
  cap:'5층짜리 dense block 하나. $H_1$~$H_4$ 각 층 입력으로 빨강·초록·보라·노랑 곡선이 이전 모든 층의 출력을 그대로 실어 나른다. 층이 늘수록 들어오는 화살표(곡선) 수가 늘어나는 것이 $L(L+1)/2$ 연결의 그림.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-full-network.png',
  cap:'dense block은 해상도가 같은 구간에만 존재한다. 블록 사이 회색 막대(Conv+Pooling)가 transition layer로, 여기서 해상도와 채널이 줄어든 뒤 다음 블록이 다시 처음부터 조밀하게 연결된다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'Recent work has shown that convolutional networks can be substantially deeper, more accurate, and efficient to train if they contain shorter connections between layers close to the input and those close to the output.',
  src:'Abstract, p.1'}
],

math:[
 {expr:'x_l = H_l( [x_0, x_1, ..., x_{l-1}] )',
  tex:'x_l = H_l\\left([x_0, x_1, \\ldots, x_{l-1}]\\right)',
  d:'논문 전체가 이 한 줄이다. $[\\cdot]$ 은 채널 축 concatenation, $H_l$ 은 **BN → ReLU → 3×3 Conv** 순서의 pre-activation 합성함수다. ResNet의 $+$ 가 $[\\,]$ 로 바뀐 것이 유일한 구조적 차이다.'},
 {expr:'입력 채널(l번째 층) = k_0 + k × (l - 1)',
  tex:'C_l = k_0 + k \\cdot (l - 1)',
  d:'$k_0$ 는 블록 입력 채널. 채널이 층 수에 대해 **선형**으로만 늘기 때문에, 연결 수가 제곱($L(L+1)/2$)으로 늘어도 연산량은 통제된다.'},
 {expr:'transition: C_out = floor(θ · C_in),   θ = 0.5',
  tex:'C_{out} = \\lfloor \\theta \\cdot C_{in} \\rfloor,\\quad \\theta = 0.5',
  d:'compression 계수. 블록을 지날 때마다 누적된 채널을 절반으로 잘라내 다음 블록이 다시 좁은 상태에서 시작하게 한다.'}
],

numbers:[
 {k:'CIFAR-10+ 오차', v:'3.46%', d:'DenseNet-BC ($L{=}190, k{=}40$) — 당시 최고 기록'},
 {k:'CIFAR-100+ 오차', v:'17.18%', d:'같은 모델. 데이터 증강 포함 기준'},
 {k:'기본 growth rate', v:'k = 12', d:'CIFAR 실험 기본값. ImageNet 모델은 $k=32$'},
 {k:'DenseNet-201 파라미터', v:'약 20M', d:'ImageNet에서 **40M 이상**인 ResNet-101과 비슷한 검증 오차'},
 {k:'DenseNet-121', v:'약 8.0M 파라미터', d:'오늘날까지 쓰이는 가장 가벼운 표준 구성'},
 {k:'블록 내 연결 수', v:'L(L+1)/2', d:'$L=12$ 면 78개 — 층 수는 같아도 정보 경로가 훨씬 조밀하다'}
],

impact:'DenseNet은 "**정확도를 올리려면 더 크게**"라는 [ResNet](#/p/resnet) 이후의 관성에 처음으로 정면 반론을 냈다. 같은 정확도를 절반 이하의 파라미터와 FLOPs로 낼 수 있다면, 경쟁의 축은 크기가 아니라 **효율**이 된다. 이 관점은 곧 [MobileNet](#/p/mobilenet)의 연산량 절감과 [EfficientNet](#/p/efficientnet)의 스케일링 법칙으로 이어졌다. 또한 "이전 특징을 이어붙여 재사용한다"는 패턴 자체가 [U-Net](#/p/unet)의 skip connection, [FPN](#/p/fpn)의 다중 스케일 융합처럼 dense prediction 계열의 표준 문법으로 정착했다. 실무에서는 의료 영상처럼 데이터가 적은 도메인에서 과적합에 강한 백본으로 오래 쓰였다.',

legacy:[
 '**효율 경쟁의 개시** — [MobileNet](#/p/mobilenet)·[EfficientNet](#/p/efficientnet)으로 이어지는 "파라미터당 정확도" 지표가 논문의 1급 평가 축으로 자리잡음',
 '**특징 재사용 문법** — [U-Net](#/p/unet)·[FPN](#/p/fpn)류의 concat 기반 skip이 detection·segmentation 백본의 기본형이 됨',
 '**메모리 최적화라는 후속 과제** — 순진한 구현의 concat 메모리 폭발이 곧바로 shared-storage 재계산 기법(memory-efficient DenseNet)을 낳음',
 '**깊이 대신 연결 밀도** — 층을 더 쌓는 대신 정보 경로를 늘린다는 발상이 [ConvNeXt](#/p/convnext) 시대의 구조 재검토에서도 반복 인용됨'
],

pitfalls:[
 '**파라미터가 적다고 빠른 것은 아니다.** DenseNet의 병목은 곱셈이 아니라 **메모리 대역폭**이다. 매 층마다 커지는 텐서를 반복 concat하면 GPU 메모리 접근이 급증해, FLOPs가 비슷한 [ResNet](#/p/resnet)보다 오히려 학습·추론이 느린 경우가 흔하다.',
 '**순진하게 구현하면 학습 메모리가 $O(L^2)$ 로 터진다.** 중간 concat 결과를 전부 저장하기 때문이며, 실제 프레임워크 구현은 공유 버퍼 + 역전파 시 재계산으로 이를 우회한다. 논문 수치만 보고 배치 크기를 잡으면 OOM이 난다.',
 '**"모든 층이 모든 층에 연결된다"는 전역이 아니다.** 연결은 해상도가 같은 dense block **내부**로 한정되며, 블록 경계의 transition layer에서 채널은 $\\theta=0.5$ 로 압축되어 잘려나간다.'
],

links:[
 {t:'arXiv 1608.06993 — Densely Connected Convolutional Networks', u:'https://arxiv.org/abs/1608.06993'},
 {t:'공식 구현 (liuzhuang13/DenseNet)', u:'https://github.com/liuzhuang13/DenseNet'},
 {t:'Memory-Efficient Implementation of DenseNets (arXiv 1707.06990)', u:'https://arxiv.org/abs/1707.06990'}
]
});
