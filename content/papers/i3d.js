WIKI.paper({
slug:'i3d',
venue:'CVPR 2017',
authors:'Carreira & Zisserman (DeepMind · University of Oxford)',
arxiv:'1705.07750',

tldr:'ImageNet으로 학습된 2D CNN의 필터를 시간 축으로 복제해 3D 필터로 "부풀리고"(inflate), 여기에 맞춰 40만 개 클립·400 클래스 규모의 **Kinetics** 데이터셋을 함께 제시한 논문. [Two-Stream](#/p/two-stream)의 RGB+flow 이중 구조는 유지하되, 각 스트림 자체를 3D-inflated Inception으로 바꿔 시공간 필터를 직접 학습하게 만들었다.',

context:'[Two-Stream](#/p/two-stream) 이후에도 UCF-101(9.5K개)·HMDB-51(3.7K개) 같은 작은 데이터셋 위에서는 어떤 비디오 아키텍처가 진짜 나은지 구별하기 어려웠다 — 데이터가 작아서 대부분의 방법이 비슷한 성능에 수렴했기 때문이다. C3D류 순수 3D ConvNet은 이론적으로는 시공간을 한 번에 학습할 수 있지만, [ImageNet](#/p/imagenet) 사전학습 이미지 모델의 축적된 지식을 재사용할 방법이 없어 얕은 구조로 처음부터 학습해야 했고 결과도 신통치 않았다. 이 논문은 두 문제를 동시에 겨냥한다. 하나는 **"3D 모델도 2D ImageNet 지식을 물려받게 하자"**는 아키텍처 문제, 다른 하나는 **"제대로 비교하려면 데이터가 훨씬 커야 한다"**는 벤치마크 문제다.',

ideas:[
 {h:'2D 필터를 시간 축으로 부풀리기(inflation)',
  lead:'N×N 2D 필터를 시간 축으로 N번 복제해 N×N×N 3D 필터를 만든다.',
  d:'[GoogLeNet](#/p/googlenet)(Inception-v1) 같은 검증된 2D 이미지 분류 아키텍처를 처음부터 다시 설계하는 대신, 모든 필터와 풀링 커널에 **시간 차원을 추가**해 그대로 3D로 확장한다. $N\\times N$ 정사각 필터는 $N\\times N\\times N$ 정육면체 필터가 되고, 네트워크 토폴로지(Inception 모듈 구조)는 그대로 유지된다.'},
 {h:'Boring-video fixed point로 ImageNet 가중치 재사용',
  lead:'정지 이미지를 같은 프레임을 반복한 "지루한 비디오"로 보고 가중치를 그대로 물려받는다.',
  d:'2D 필터 가중치를 시간 방향으로 $N$ 번 그대로 복제한 뒤 $1/N$ 로 스케일하면, 같은 프레임을 반복한 "지루한 비디오"를 넣었을 때 3D conv의 출력이 원래 2D conv의 출력과 정확히 같아진다. 이 성질(boring-video fixed point) 덕분에 ImageNet에서 학습한 가중치를 처음부터 다시 배우지 않고 3D 네트워크의 초기값으로 그대로 이식할 수 있다.'},
 {h:'시공간 receptive field를 비대칭으로 키운다',
  lead:'초반 max-pooling은 시간 축을 건드리지 않고 공간만 줄여 조기 융합을 피한다.',
  d:'이미지 모델은 가로세로를 항상 대칭으로 취급하지만, 시간축까지 같은 속도로 줄이면 서로 다른 물체의 경계가 조기에 뒤섞여 특징 학습이 망가질 수 있다. 그래서 앞쪽 두 max-pooling 층은 $1\\times3\\times3$ 커널(시간 방향 stride 1)을 써서 공간만 먼저 줄이고, 이후 층부터 대칭 $2\\times2\\times2$ 로 시공간을 함께 줄여나간다.'},
 {h:'그래도 optical flow 스트림은 남긴다',
  lead:'3D ConvNet은 순수 순전파라 optical flow 알고리즘의 반복 최적화가 주는 정보를 대체하지 못한다.',
  d:'3D ConvNet이 RGB만으로 움직임을 직접 배울 수 있어야 한다는 것이 직관이지만, 저자들은 optical flow 스트림을 추가로 써도 여전히 성능이 크게 오르는 것을 관찰했다. RGB-I3D와 Flow-I3D를 따로 학습해 예측을 평균 내는 [Two-Stream](#/p/two-stream)식 구조를 그대로 유지한 이유다.'},
 {h:'Kinetics — 아키텍처를 가르는 대규모 벤치마크',
  lead:'400 클래스 · 클래스당 400개 이상 · 총 24만 개 학습 비디오로 아키텍처 간 진짜 차이를 드러낸다.',
  d:'UCF-101보다 두 자릿수 많은 규모의 Kinetics를 새로 만들어, 같은 다섯 아키텍처(LSTM, 3D-ConvNet, Two-Stream, 3D-Fused, Two-Stream I3D)를 동일 조건에서 비교했다. 데이터가 커지자 아키텍처 간 격차가 뚜렷하게 드러났고, Kinetics로 사전학습한 뒤 UCF-101/HMDB-51로 옮기면(fine-tune) 거의 모든 아키텍처의 성능이 크게 올랐다 — 비디오도 이미지처럼 대규모 사전학습이 통한다는 것을 처음 정량적으로 보여줬다.'}
],

diagram:{type:'compare', cap:'Two-Stream의 2D CNN 스트림을 3D-inflated Inception으로 바꾼 것이 I3D의 핵심 변화. 이중 스트림 구조 자체는 그대로다.',
 left:{t:'Two-Stream (2014)', items:['RGB 한 프레임 → 2D CNN','optical flow 스택 → 2D CNN','작은 데이터셋(UCF-101 등)에서 학습']},
 right:{t:'I3D (이 논문)', items:['RGB 클립 → 3D-inflated Inception','flow 클립 → 3D-inflated Incep.','ImageNet 상속 + Kinetics 사전학습']}},

math:[
 {expr:'W_3D(t,x,y) = W_2D(x,y) / N  for t = 1..N  (boring-video fixed point)',
  tex:'W_{3D}(t,x,y)=\\dfrac{W_{2D}(x,y)}{N},\\qquad t=1,\\dots,N',
  d:'2D 필터 가중치 $W_{2D}$ 를 시간 방향으로 $N$ 번 복제하고 $1/N$ 로 나눠 3D 필터를 만든다. 같은 이미지를 $N$ 번 반복한 "지루한 비디오"에 대해 3D conv 출력이 원래 2D conv 출력과 동일해지도록 하는 조건이다.'}
],

numbers:[
 {k:'Kinetics 규모', v:'400 클래스 · 클래스당 400+ 클립 · 학습 24만 개', d:'UCF-101(101 클래스·9.5K개) 대비 두 자릿수 큰 스케일'},
 {k:'Kinetics 사전학습 → UCF-101 (Two-Stream I3D)', v:'98.0%', d:'표 4, ImageNet+Kinetics 사전학습 후 3-split 평균'},
 {k:'Kinetics 사전학습 → HMDB-51 (Two-Stream I3D)', v:'80.9%', d:'논문 abstract에 명시된 대표 수치'},
 {k:'UCF-101 split1 (사전학습 없이 직접학습, RGB+Flow)', v:'93.4%', d:'표 2 (e) Two-Stream I3D, Two-Stream 원조(91.2%)보다 우위'},
 {k:'순수 3D-ConvNet (C3D류) · UCF-101 split1', v:'51.6%', d:'ImageNet 부트스트랩 없이 처음부터 학습 — I3D(93.4%)와 격차가 큼'},
 {k:'학습 입력 클립 길이', v:'RGB 64프레임 / 25fps', d:'테스트는 비디오 전체를 컨볼루션으로 통과시켜 시간 방향으로 예측을 평균'}
],

impact:'비디오 인식에도 "ImageNet 스타일 대규모 사전학습"이 통한다는 것을 처음 확실히 보여준 논문이다. inflation 트릭 덕분에 매번 새 3D 아키텍처를 처음부터 설계·학습할 필요 없이, 검증된 2D 백본의 지식을 그대로 재활용할 수 있게 됐다. 그리고 Kinetics는 이후 거의 모든 비디오 이해 논문의 **표준 사전학습·평가 데이터셋**이 되어, 이 논문 자체보다도 데이터셋의 영향력이 더 오래갔다고 볼 수 있다.',

legacy:[
 '**optical flow의 최종 퇴출** — [SlowFast](#/p/slowfast)는 I3D가 여전히 남겨둔 flow 스트림마저 없애고 순수 RGB 두 경로만으로 그와 비슷하거나 더 나은 성능을 냄',
 '**Kinetics가 사실상의 표준 벤치마크로 정착** — 이후 [TimeSformer](#/p/timesformer), [VideoMAE](#/p/videomae) 등 대부분의 비디오 이해 논문이 Kinetics 사전학습·미세조정을 기본 평가 프로토콜로 채택',
 '**inflation 아이디어의 재사용** — "2D에서 검증된 것을 시간/다른 축으로 확장"하는 전략이 이후 다양한 3D 백본 설계의 출발점이 됨',
 '**ImageNet+Kinetics 이중 사전학습 관행** — 표 3에서 보이듯 ImageNet과 Kinetics를 순차로 쓰는 것이 Kinetics 단독보다 나은 경우가 많아, 이후 비디오 모델은 대개 이미지 사전학습을 먼저 거친다'
],

pitfalls:[
 '**"3D CNN이니 순수 RGB로 다 배운다"는 이 논문의 실제 결론이 아니다.** I3D도 여전히 RGB와 flow 두 스트림을 따로 학습해 평균 내는 two-stream 구조이며, flow 스트림을 빼면 정확도가 확연히 떨어진다(표 2·3). flow를 완전히 없앤 것은 [SlowFast](#/p/slowfast)다.',
 '**Kinetics 클립은 유튜브에서 수집된 트리밍 영상으로, 장면·배경 정보가 매우 풍부하다.** 저자들도 flow만으로는 사람 눈으로도 행동을 구분하기 어려운 경우가 많았다고 언급하는데(RGB가 flow보다 종종 더 강함), 이는 이후 Kinetics의 **외형 편향(appearance bias)** — 배경만 보고도 상당수 클래스를 맞힐 수 있다는 논쟁 — 의 초기 신호로 볼 수 있다.',
 '**inflation은 "필터 모양만" 부풀리는 것이고 시간 stride·풀링 설계는 여전히 수작업이다.** 첫 두 max-pooling에서 시간 방향 풀링을 생략하는 등 세부 설계를 원문 그대로 따르지 않으면 성능 재현이 잘 안 될 수 있다.'
],

figures:[
 {f:'fig2-architectures.png',
  cap:'이 논문이 Kinetics 위에서 비교한 5개 아키텍처. a) LSTM, b) 순수 3D-ConvNet(C3D류), c) 원조 Two-Stream(2D CNN 두 개), d) 3D-Fused Two-Stream, e) 이 논문이 제안하는 Two-Stream I3D(3D-inflated ConvNet 두 개). c)와 e)를 비교하면 "2D 스트림을 3D로 바꾼 것"이라는 핵심 변화가 바로 보인다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'We also introduce a new Two-Stream Inflated 3D ConvNet (I3D) that is based on 2D ConvNet inflation: filters and pooling kernels of very deep image classification ConvNets are expanded into 3D.',
  src:'Abstract, p.1'},
 {t:'While a 3D ConvNet should be able to learn motion features from RGB inputs directly, it still performs pure feedforward computation, whereas optical flow algorithms are in some sense recurrent.',
  src:'Section 2.4, p.4'}
],

links:[
 {t:'arXiv 1705.07750 — Quo Vadis, Action Recognition? A New Model and the Kinetics Dataset', u:'https://arxiv.org/abs/1705.07750'},
 {t:'Kinetics Dataset (DeepMind)', u:'https://www.deepmind.com/open-source/kinetics'}
]
});
