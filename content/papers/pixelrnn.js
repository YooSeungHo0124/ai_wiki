WIKI.paper({
slug:'pixelrnn',
venue:'ICML 2016',
authors:'van den Oord, Kalchbrenner, Kavukcuoglu (Google DeepMind)',
arxiv:'1601.06759',

tldr:'이미지를 왼쪽 위부터 오른쪽 아래까지 **픽셀 하나씩 자기회귀로** 생성하는 모델. 잠재변수를 두지 않고 픽셀 간 의존관계를 전부 명시적으로 모델링해, 당시 최고의 정확한 로그 우도를 냈다.',

context:'2015년까지 이미지 생성은 [VAE](#/p/vae) 계열이 주류였는데, 근사 사후분포를 쓰는 탓에 우도 하한만 최적화하고 독립성 가정을 곳곳에 깔아야 했다. 자기회귀 밀도 추정 자체는 [NADE](#/p/nice)류로 알려져 있었지만 1차원 시퀀스 대상이었다. 문제는 이미지에 그대로 적용하면 픽셀 간 비선형·장거리 상관을 표현할 만큼 강력한 시퀀스 모델이 필요하다는 점, 그리고 2차원 구조를 순서 있는 1차원 시퀀스로 다뤄야 한다는 점이다.',

ideas:[
 {h:'이미지를 조건부 확률의 곱으로 완전히 분해',
  lead:'모든 픽셀을 이전 픽셀들에 대한 조건부 곱 $\\prod p(x_i|x_{<i})$ 로 정확히 표현한다.',
  d:'이미지를 행 우선으로 나열한 시퀀스 $x_1,\\dots,x_{n^2}$ 로 보고, 각 픽셀의 R·G·B 채널까지 순서를 매겨 $p(x_{i,R}|x_{<i})$, $p(x_{i,G}|x_{<i},x_{i,R})$, $p(x_{i,B}|x_{<i},x_{i,R},x_{i,G})$ 로 쪼갠다. 독립성 가정이 전혀 없어 잠재변수 모델보다 픽셀 간 의존을 더 온전히 포착한다는 것이 핵심 주장이다.'},
 {h:'픽셀 값을 연속이 아니라 256-way 이산 분류로',
  lead:'픽셀값을 회귀 대상이 아니라 256개 범주에 대한 softmax로 예측한다.',
  d:'당시 관행은 픽셀을 연속 값으로 보고 혼합 밀도(MCGSM 등)로 모델링하는 것이었다. 이 논문은 대신 각 채널값을 0~255의 다항분포로 학습한다. 다봉·비대칭 분포를 형태 가정 없이 표현할 수 있고, 같은 Row LSTM 구조에서 softmax가 MCGSM보다 CIFAR-10에서 더 낮은 bits/dim(3.06 vs 3.22)을 냈다.'},
 {h:'Diagonal BiLSTM: 대각선으로 스캔해 전체 문맥을 본다',
  lead:'입력을 행마다 한 칸씩 밀어(skew) 대각선 방향 합성곱으로 전체 receptive field를 확보한다.',
  d:'Row LSTM은 위쪽의 삼각형 영역만 보는 한계가 있다. Diagonal BiLSTM은 각 행을 한 칸씩 오프셋(skew)해 대각선을 세로줄로 바꾼 뒤 $2\\times1$ 커널의 열 방향 합성곱으로 처리한다. 두 방향(좌상→우하, 우상→좌하)을 모두 계산해 합치면 미래 픽셀을 보지 않으면서도 이미지 크기와 무관하게 **전체 문맥**에 닿는다.'},
 {h:'PixelCNN: 순환 없이 마스크된 합성곱만으로',
  lead:'LSTM 없이 마스크된 합성곱만 쌓아 병렬 학습이 되는 대신 receptive field가 유한하다.',
  d:'Row/Diagonal LSTM은 매 스텝을 순차 계산해야 해 학습이 느리다. PixelCNN은 15개의 마스크된 합성곱 층만으로 같은 조건부 분포를 근사한다. 학습·평가는 완전히 병렬화되지만(생성은 여전히 순차적) 받아들이는 문맥이 유한해, 실험에서 세 모델 중 성능이 가장 낮다.'},
 {h:'마스크 A/B로 인과성과 채널 순서를 강제',
  lead:'미래 픽셀과 자기 자신(첫 층)을 못 보게 합성곱 가중치를 0으로 지운 마스크를 쓴다.',
  d:'첫 합성곱 층에는 mask A를 써서 현재 픽셀의 아직 예측되지 않은 채널까지 차단하고, 이후 층에는 mask B를 써서 이미 계산된 자기 채널로의 연결만 허용한다. 이 두 마스크가 R→G→B, 좌상→우하라는 생성 순서를 아키텍처 차원에서 강제한다.'}
],

diagram:{type:'compare', cap:'세 아키텍처의 receptive field 차이. 문맥을 넓게 볼수록(우측) 성능이 좋아진다.',
 left:{t:'PixelCNN · Row LSTM', items:['고정된 유한 문맥','병렬 학습 가능(Row는 부분순차)','문맥이 좁아 성능 하위']},
 right:{t:'Diagonal BiLSTM', items:['대각선 스캔으로 전체 이미지 문맥','두 방향 결합, 미래는 마스킹','CIFAR-10·MNIST 최고 성능']}},

math:[
 {expr:'p(x) = Π_i p(xi | x1, ..., x_{i-1})',
  tex:'p(\\mathbf{x}) = \\prod_{i=1}^{n^2} p(x_i \\mid x_1,\\dots,x_{i-1})',
  d:'이미지 전체 결합분포를 픽셀 순서에 따른 조건부 곱으로 정확히 분해한 것. 근사나 잠재변수가 없다.'},
 {expr:'p(xi|x<i) = p(xi,R|x<i) p(xi,G|x<i,xi,R) p(xi,B|x<i,xi,R,xi,G)',
  tex:'p(x_i\\mid x_{<i}) = p(x_{i,R}\\mid x_{<i})\\,p(x_{i,G}\\mid x_{<i},x_{i,R})\\,p(x_{i,B}\\mid x_{<i},x_{i,R},x_{i,G})',
  d:'한 픽셀 내부의 R·G·B 채널마저 순서를 매겨 조건부로 쪼갠다 — 채널 간 상관도 독립으로 가정하지 않는다.'},
 {expr:'[oi,fi,ii,gi] = σ(Kss * h_{i-1} + Kis * xi);  ci = fi·c_{i-1} + ii·gi;  hi = oi·tanh(ci)',
  tex:'[o_i,f_i,i_i,g_i]=\\sigma(K^{ss}\\ast h_{i-1}+K^{is}\\ast x_i),\\quad c_i=f_i c_{i-1}+i_i g_i,\\quad h_i=o_i\\tanh(c_i)',
  d:'한 행(row) 전체의 LSTM 게이트를 합성곱 $K^{is}$·$K^{ss}$로 한 번에 계산하는 Row LSTM의 스텝 업데이트.'}
],

numbers:[
 {k:'MNIST 음의 로그우도', v:'79.20 nats', d:'Diagonal BiLSTM 7층, h=16 — 당시 최고 기록'},
 {k:'CIFAR-10', v:'3.00 bits/dim', d:'Diagonal BiLSTM, PixelCNN 3.14 · Row LSTM 3.07보다 우수'},
 {k:'softmax vs MCGSM', v:'3.06 vs 3.22 bits/dim', d:'같은 Row LSTM에서 이산 softmax 출력이 혼합밀도보다 나음'},
 {k:'ImageNet 32×32', v:'3.86 bits/dim (검증)', d:'당시 이 데이터셋에 보고된 첫 우도 벤치마크'},
 {k:'깊이 효과', v:'12층 CIFAR-10 3.06 vs 1층 3.30', d:'residual 연결로 최대 12층까지 성능이 계속 개선'},
 {k:'PixelCNN 층수', v:'15층, h=128(자연영상)', d:'MNIST는 h=32'}
],

impact:'명시적 자기회귀가 이미지 규모에서도 정확한 우도와 경쟁력 있는 샘플을 동시에 낼 수 있음을 보였다. 같은 논문에서 나온 **PixelCNN**은 학습 병렬화 덕분에 이후 자기회귀 이미지 모델의 표준 백본이 됐고, 마스크 합성곱이라는 장치는 오디오([WaveNet](#/p/wavenet))로도 그대로 옮겨졌다. 다만 생성이 픽셀 수만큼 순차적이라는 근본적 느림은 이 논문에서 이미 드러난 한계로, 이후 연구는 이 느림을 우회하는 쪽으로 갈라졌다.',

legacy:[
 '**PixelCNN 계열 확장** — Gated PixelCNN, [VQ-VAE](#/p/vqvae)·[VQ-VAE-2](#/p/vqvae2)의 이산 잠재코드에 대한 사전분포로 PixelCNN 변형이 재사용됨',
 '**마스크 합성곱의 이식** — 동일한 인과 마스킹 원리가 오디오 자기회귀 모델인 [WaveNet](#/p/wavenet)의 dilated causal convolution으로 이어짐',
 '**순차 생성의 느림과의 싸움** — 한 픽셀씩 생성하는 비용이 문제로 남아, 이후 확산 모델([DDPM](#/p/ddpm))·병렬 디코딩 계열이 이 병목을 다른 방식으로 우회',
 '**이산 softmax 출력의 정착** — 픽셀·오디오 값을 연속 회귀 대신 이산 분류로 다루는 관행이 WaveNet 등 후속 생성 모델에 그대로 계승됨'
],

pitfalls:[
 '**학습이 병렬이라고 생성도 빠른 것은 아니다.** PixelCNN조차 학습·평가는 한 forward pass로 병렬화되지만, 이미지 생성은 각 픽셀을 만들 때마다 그 결과를 다시 입력으로 넣어야 해서 $n^2$번의 순차 스텝이 필요하다.',
 '**Row LSTM은 전체 문맥을 못 본다.** 삼각형 receptive field만 가지므로, "PixelRNN"이라는 이름만 보고 세 아키텍처(PixelCNN·Row LSTM·Diagonal BiLSTM)가 동등하다고 착각하면 안 된다 — 성능 차이가 그대로 문맥 범위 차이다.',
 '**PixelCNN이 VQ-VAE-2의 사전분포라고 단정하면 틀린다.** VQ-VAE-2는 실제로는 PixelSnail을 prior로 쓴다 — PixelCNN 계열이라는 것과 이 논문의 PixelCNN 자체를 혼동하지 말 것.'
],

figures:[
 {f:'fig4-receptive-fields.png', cap:'빨간 점이 현재 예측할 픽셀, 파란 점이 그 예측에 실제로 쓰이는 문맥. PixelCNN·Row LSTM은 위쪽 일부만 보는 삼각형 문맥인 반면, Diagonal BiLSTM(오른쪽)은 옅은 파란색까지 포함해 이미지 전체에 닿는 문맥을 갖는다.',
  src:'원문 Figure 4, p.4'},
 {f:'fig7-samples-cifar.png', cap:'CIFAR-10에 학습된 모델이 생성한 비지도 샘플. 국소적인 질감(털, 물, 하늘)은 그럴듯하게 재현되지만 전역적인 물체 형태는 뭉개진다 — 자기회귀 모델이 근접 픽셀 상관에는 강하고 장거리 구조에는 약함을 보여준다.',
  src:'원문 Figure 7 (좌측 CIFAR-10 부분), p.7'}
],

quotes:[
 {t:'Our method models the discrete probability of the raw pixel values and encodes the complete set of dependencies in the image.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1601.06759 — Pixel Recurrent Neural Networks', u:'https://arxiv.org/abs/1601.06759'},
 {t:'PixelCNN 후속: Conditional Image Generation with PixelCNN Decoders', u:'https://arxiv.org/abs/1606.05328'}
]
});
