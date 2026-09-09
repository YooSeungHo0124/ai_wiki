WIKI.paper({
slug:'senet',
venue:'CVPR 2018 / IEEE TPAMI (ILSVRC 2017 우승)',
authors:'Hu, Shen, Albanie, Sun, Wu (Momenta · Oxford)',
arxiv:'1709.01507',

tldr:'convolution이 암묵적으로만 다루던 **채널 간 상호의존성**을 squeeze-and-excitation(SE) 블록으로 명시적으로 모델링해, 아주 적은 연산 비용으로 기존 CNN의 정확도를 끌어올린 논문. ILSVRC 2017 분류 부문 1위를 차지했다.',

context:'2017년까지의 CNN 개선은 대부분 **공간(spatial)** 축에 집중돼 있었다 — [ResNet](#/p/resnet)의 깊이, [Inception](#/p/googlenet)의 multi-scale 필터, 더 넓은 수용 영역 설계 등. 반면 convolution 필터가 채널마다 만들어내는 반응을 어떻게 서로 연관지을지는 필터 파라미터 안에 암묵적으로, 그것도 지역적인 수용 영역 안에서만 얽혀 있었다. 즉 한 채널의 반응이 "지금 이 이미지 전체 맥락에서 얼마나 중요한지"를 전역적으로 판단해 다른 채널과 견주는 메커니즘이 없었다. 이 논문은 "채널 간 관계를 별도의 가벼운 서브모듈로 명시적으로 학습하면 어떨까"라는 질문에서 출발한다.',

ideas:[
 {h:'Squeeze: 전역 평균 풀링으로 채널을 숫자 하나로 요약',
  lead:'H×W 공간을 global average pooling으로 눌러 채널마다 하나의 전역 통계값을 만든다.',
  d:'convolution 출력 $U$ 는 지역 수용 영역의 정보만 담고 있어 채널 하나의 반응이 이미지 전체에서 어떤 의미인지 알 수 없다. 채널별로 $H\\times W$ 를 평균 내 $z_c$ 하나의 스칼라로 squeeze하면, 각 채널이 이미지 전역에 걸쳐 얼마나 활성화됐는지를 요약하는 벡터 $z \\in \\mathbb{R}^C$ 를 얻는다. 별도 지도 없이 순전파 한 번으로 계산되는 값이다.'},
 {h:'Excitation: 두 개의 FC층으로 채널 가중치를 만든다',
  lead:'FC-ReLU-FC-sigmoid 병목 구조로 채널 사이의 비선형 의존성을 학습해 게이트 값을 만든다.',
  d:'$z$ 를 reduction ratio $r$ 만큼 줄이는 FC층, ReLU, 다시 $C$ 차원으로 늘리는 FC층, 마지막 sigmoid를 거쳐 채널마다 0~1 사이 값 $s_c$ 를 얻는다. sigmoid를 쓰는 이유는 one-hot이 아니라 **여러 채널이 동시에 강조될 수 있는** 비배타적 관계를 표현하기 위해서다. 병목 구조 덕분에 파라미터 증가가 미미하다.'},
 {h:'Scale: 원래 feature map에 채널별로 곱한다',
  lead:'학습된 게이트 $s_c$ 를 원본 feature map $U$ 의 각 채널에 그대로 곱해 재보정한다.',
  d:'$\\tilde{x}_c = s_c \\cdot u_c$ 로 채널마다 스칼라를 곱하는 것이 전부다. 구조를 바꾸지 않고 기존 convolution 출력을 "재보정(recalibration)"만 하기 때문에 어떤 CNN 블록 뒤에도 끼워 넣을 수 있는 plug-in 모듈이 된다.'},
 {h:'채널에 대한 self-attention으로 볼 수 있다',
  lead:'SE 블록은 입력에 따라 동적으로 달라지는, 수용 영역에 갇히지 않는 채널 축 attention이다.',
  d:'논문은 SE 블록을 "채널에 대한 self-attention 함수"로 해석한다. convolution 필터의 관계는 지역 수용 영역에 고정돼 있지만, squeeze가 만드는 전역 통계 덕분에 SE 블록의 채널 가중치는 이미지 전체 맥락을 반영한다. [spatial transformer](#/p/spatial-transformer)가 공간 축을 다뤘다면, SE는 채널 축을 다루는 셈이다.'},
 {h:'기존 백본에 통째로 이식 가능',
  lead:'ResNet·Inception·ResNeXt의 각 모듈에 SE 블록을 끼워 넣기만 하면 성능이 오른다.',
  d:'SE 블록은 새 아키텍처가 아니라 기존 residual/Inception 모듈의 출력 직후에 삽입하는 부품이다. 저자들은 SE-ResNet, SE-Inception, SE-ResNeXt를 만들어 일관된 개선을 확인했고, 이 조합적 설계 덕분에 하이퍼파라미터 탐색 없이 바로 적용 가능한 실용성을 확보했다.'}
],

diagram:{type:'flow', cap:'convolution 출력 U가 squeeze→excitation을 거쳐 채널 게이트 s를 만들고, 그 s로 U 자신을 재보정해 출력한다.',
 nodes:[
  {t:'Conv 출력 U', s:'H×W×C'},
  {t:'Squeeze', s:'전역평균풀링 → 1×1×C'},
  {t:'Excitation', s:'FC→ReLU→FC→sigmoid', acc:true},
  {t:'Scale', s:'채널별 곱'},
  {t:'출력', s:'재보정된 U'}
 ]},

math:[
 {expr:'z_c = Fsq(uc) = (1/HW) Σ Σ uc(i,j)',
  tex:'z_c=\\mathbf{F}_{sq}(u_c)=\\frac{1}{H\\times W}\\sum_{i=1}^{H}\\sum_{j=1}^{W}u_c(i,j)',
  d:'squeeze 연산. 채널 $c$ 의 공간 전체를 평균 내 전역 기술자(descriptor) $z_c$ 하나를 만든다.'},
 {expr:'s = Fex(z, W) = σ(W2 δ(W1 z))',
  tex:'\\mathbf{s}=\\mathbf{F}_{ex}(\\mathbf{z},\\mathbf{W})=\\sigma\\big(W_2\\,\\delta(W_1\\mathbf{z})\\big)',
  d:'excitation 연산. $\\delta$ 는 ReLU, $\\sigma$ 는 sigmoid. $W_1 \\in \\mathbb{R}^{C/r \\times C}$, $W_2 \\in \\mathbb{R}^{C \\times C/r}$ 로 병목을 만들어 파라미터를 절약한다.'},
 {expr:'x̃c = Fscale(uc, sc) = sc · uc',
  tex:'\\tilde{x}_c=\\mathbf{F}_{scale}(u_c,s_c)=s_c\\,u_c',
  d:'최종 재보정. 스칼라 $s_c$ 를 feature map $u_c \\in \\mathbb{R}^{H\\times W}$ 전체에 곱하는 채널별 스케일링.'}
],

numbers:[
 {k:'ILSVRC 2017 top-5 오류', v:'2.251%', d:'SENet 앙상블 기준, 2016년 우승 대비 상대 **약 25%** 개선'},
 {k:'SE-ResNet-50 vs ResNet-50', v:'top-5 6.62% vs 7.48%', d:'top-5 오류 **0.86%p** 개선, ResNet-101(6.52%)에 근접'},
 {k:'추가 연산량(r=16)', v:'+0.26%', d:'SE-ResNet-50 ∼3.87 GFLOPs, 원본 ResNet-50 ∼3.86 GFLOPs 대비'},
 {k:'추가 파라미터', v:'약 250만 개', d:'ResNet-50의 약 2500만 파라미터 대비 **약 10%** 증가'},
 {k:'SE-ResNeXt-50 top-5', v:'5.49%', d:'같은 깊이의 ResNeXt-50 대비 개선, reduction ratio r=16 사용'}
],

impact:'"어디에 attention을 걸지"를 공간이 아니라 **채널**로 옮긴 최초의 대규모 성공 사례다. 구조를 바꾸지 않고 기존 블록 뒤에 삽입만 하면 되는 형태였기 때문에, ILSVRC 우승이라는 임팩트와 함께 곧바로 산업 표준 백본들에 흡수됐다. squeeze-excitation 패턴 자체가 이후 "가벼운 게이팅 서브모듈을 기존 블록에 꽂는다"는 설계 문법의 대표 사례가 되어, [EfficientNet](#/p/efficientnet)을 포함한 여러 후속 아키텍처의 기본 구성요소로 채택됐다.',

legacy:[
 '**EfficientNet 등 현대 CNN의 기본 구성요소로 채택** — MBConv 블록 안에 SE 모듈이 표준으로 들어가며 모바일·경량 아키텍처까지 확산',
 '**공간 attention과의 결합 연구 계열 형성** — 채널(SE)과 공간을 함께 다루는 attention 모듈들이 뒤이어 등장',
 '**"저비용 플러그인 모듈" 설계 패러다임** — 새 아키텍처를 통째로 설계하는 대신 기존 블록에 삽입 가능한 서브모듈을 만드는 연구 방식이 이후 표준적인 접근이 됨',
 '**attention 개념이 vision 백본 내부로 스며든 이정표** — [Transformer](#/p/transformer)식 self-attention이 vision을 완전히 흡수하기 전에, CNN 내부에 attention 메커니즘이 자리잡은 대표 사례로 남았다'
],

pitfalls:[
 '**공간 attention이 아니라 채널 attention이다.** SE 블록은 "어디를 볼지"가 아니라 "어느 채널을 강조할지"만 정한다 — [spatial transformer](#/p/spatial-transformer)나 이후 공간 attention 모듈과 혼동하지 말 것.',
 '**reduction ratio r은 성능-비용 트레이드오프 하이퍼파라미터다.** r을 너무 크게 잡으면(병목이 좁아지면) 표현력이 줄어 성능이 떨어지고, 너무 작으면 파라미터·연산이 늘어난다. 논문은 r=16을 기본값으로 쓰지만 최적값은 아키텍처마다 다르다.',
 '**추론 지연은 GFLOPs 증가보다 크게 체감될 수 있다.** FC층과 전역 풀링은 이론적 FLOPs는 작아도 실제 하드웨어(특히 저전력 기기)에서는 메모리 접근 패턴 때문에 상대적으로 더 느릴 수 있다.'
],

figures:[
 {f:'fig1-seblock.png',
  cap:'왼쪽부터 입력 X → 기존 convolution $F_{tr}$ → feature map U. 여기서 $F_{sq}$(squeeze)가 U를 1×1×C 벡터로 누르고, $F_{ex}$(excitation)가 그 벡터를 같은 1×1×C 크기의 게이트로 바꾼 뒤, $F_{scale}$이 그 게이트를 U에 채널별로 곱해 출력 $\\tilde{X}$(색깔이 채널마다 다르게 칠해진 이유가 바로 이 재보정)를 만든다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'In this work, we focus instead on the channel relationship and propose a novel architectural unit, which we term the "Squeeze-and-Excitation" (SE) block, that adaptively recalibrates channel-wise feature responses by explicitly modelling interdependencies between channels.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1709.01507 — Squeeze-and-Excitation Networks', u:'https://arxiv.org/abs/1709.01507'},
 {t:'공식 코드 (hujie-frank/SENet)', u:'https://github.com/hujie-frank/SENet'}
]
});
