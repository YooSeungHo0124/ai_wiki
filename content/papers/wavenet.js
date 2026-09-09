WIKI.paper({
slug:'wavenet',
venue:'arXiv 2016 (SSW9 2016)',
authors:'van den Oord et al. (Google DeepMind)',
arxiv:'1609.03499',

tldr:'음성 파형을 mel spectrogram 같은 중간 표현 없이 **샘플 하나하나를 직접 자기회귀로 생성**한 모델. 이후 8년간 이어지는 "음성 생성 속도와의 싸움"이라는 트랙 전체가 이 논문에서 시작된다.',

context:'2016년까지 TTS의 주류는 concatenative 합성(녹음 조각 이어붙이기)이거나, 통계 파라메트릭 합성(HMM·LSTM으로 vocoder 파라미터를 예측한 뒤 신호처리로 파형을 복원)이었다. 두 방식 모두 사람 음성보다 확연히 "기계적"으로 들린다는 한계가 있었다. 한편 PixelRNN/PixelCNN 계열은 이미지를 픽셀 단위 자기회귀로 생성해 사실적인 결과를 냈다. 질문은 자연스러웠다 — **오디오도 샘플 단위로 직접 자기회귀 생성하면 되지 않을까?** 문제는 음성이 초당 최소 16,000개 샘플이라는 극단적으로 긴 시퀀스라는 점이다. RNN으로 이 길이를 직렬 처리하는 것은 학습조차 비현실적이었다.',

ideas:[
 {h:'Dilated causal convolution: RNN 없이 긴 문맥',
  lead:'합성곱 사이에 구멍을 벌려 층을 몇 개만 쌓아도 수천 샘플의 문맥을 본다.',
  d:'causal convolution은 미래 $x_{t+1},\\dots$ 를 보지 않도록 마스킹된 1D 합성곱으로, $t$ 시점 출력이 오직 과거 입력에만 의존한다. 문제는 receptive field가 층 수에 비례해 선형으로만 늘어난다는 것 — 5층이면 5샘플뿐이다. 여기에 **dilated convolution**을 도입해, 층마다 필터 간격(dilation)을 $1, 2, 4, \\dots, 512$ 식으로 두 배씩 늘린다. 그러면 receptive field가 층 수에 대해 지수적으로 커져, 10층짜리 블록 하나로 1024샘플을 덮는다. RNN의 순환 연결 없이도 긴 시간적 의존성을 확보한 것이 이 논문의 핵심 기여다.'},
 {h:'256-way softmax + µ-law: 연속값을 분류 문제로',
  lead:'16비트 진폭을 µ-law로 압축해 256개 값으로 양자화한 뒤 softmax로 분류한다.',
  d:'오디오 샘플은 16비트 정수, 즉 65,536개 값을 가질 수 있어 그대로 softmax를 쓰면 출력층이 감당하기 어렵다. 사람 청각이 작은 진폭 차이에 더 민감하다는 점을 이용해 $\\mu$-law 압축(companding)으로 진폭을 비선형 압축한 뒤 256단계로 양자화하고, 매 타임스텝마다 256-way softmax로 "다음 샘플 값"을 분류 문제처럼 예측한다. 회귀 대신 분류를 쓴 것은 PixelCNN과 같은 선택으로, 분포 모양을 가정하지 않아 다봉·비대칭 분포도 표현할 수 있다.'},
 {h:'Gated activation unit',
  lead:'tanh 필터와 sigmoid 게이트를 곱해 PixelCNN과 같은 비선형을 쓴다.',
  d:'각 층의 출력은 $z=\\tanh(W_f * x)\\odot\\sigma(W_g * x)$ 형태다. ReLU보다 이 gated 구조가 오디오 모델링에서 유의하게 더 잘 작동한다고 실험으로 확인했으며, 이는 gated PixelCNN에서 그대로 가져온 설계다.'},
 {h:'조건화: 화자·언어 정보를 global/local로 주입',
  lead:'화자 임베딩은 전 구간에 고정으로, 언어 특징은 업샘플링해 시간축에 맞춰 주입한다.',
  d:'조건 없이 학습하면 화자마다 다른 목소리·호흡을 무작위로 섞어 "여러 사람이 번갈아 말하는" 샘플이 나온다. **global conditioning**은 화자 임베딩처럼 시간에 무관한 벡터를 모든 타임스텝에 방송하고, **local conditioning**은 언어학적 특징처럼 오디오보다 낮은 주파수를 갖는 시계열을 transposed convolution으로 업샘플링해 시간축을 맞춘 뒤 활성화 함수에 더한다. TTS에 쓸 때는 언어 특징을 local conditioning으로 넣는다.'},
 {h:'Residual + skip connection으로 수십 층을 학습',
  lead:'각 dilated conv 블록을 residual·skip 연결로 감싸 깊은 스택도 수렴하게 만든다.',
  d:'dilation 스택을 깊게 쌓을수록 receptive field는 커지지만 학습이 불안정해진다. 각 블록에 residual 연결을 두고, 동시에 모든 블록의 출력을 skip connection으로 모아 최종 softmax 앞에서 합산한다. 이 구조 덕에 수십 층을 쌓고도 안정적으로 학습이 됐다.'}
],

diagram:{type:'stack', cap:'Dilated causal conv 블록 하나. dilation을 1→2→4→…로 두 배씩 늘려 쌓으면 receptive field가 지수적으로 자란다.',
 layers:[
  {t:'입력 파형', s:'과거 샘플만'},
  {t:'Causal Conv', s:'미래 마스킹'},
  {t:'Dilated Conv', s:'dilation 1,2,4…512', acc:true, note:'receptive field 지수 증가'},
  {t:'Gated 활성화', s:'tanh ⊙ sigmoid'},
  {t:'Residual/Skip', s:'다음 블록 + 출력 누적'},
  {t:'Softmax(256)', s:'µ-law 양자화'}
 ]},

math:[
 {expr:'p(x) = Π_t p(x_t | x_1, ..., x_{t-1})',
  tex:'p(\\mathbf{x})=\\prod_{t=1}^{T} p\\left(x_t \\mid x_1,\\dots,x_{t-1}\\right)',
  d:'파형 전체의 결합확률을 이전 모든 샘플에 조건화된 곱으로 분해한다. 생성 시 샘플을 하나 뽑을 때마다 그것을 다시 입력에 넣어 다음 샘플을 예측하는 완전 자기회귀 구조다.'},
 {expr:'f(x_t) = sign(x_t) * ln(1 + μ|x_t|) / ln(1 + μ),  μ = 255',
  tex:'f(x_t)=\\text{sign}(x_t)\\,\\frac{\\ln(1+\\mu|x_t|)}{\\ln(1+\\mu)},\\quad \\mu=255',
  d:'µ-law companding 변환. 진폭이 작을 때 더 촘촘한 양자화 간격을 주어, 선형 양자화보다 적은 비트(8비트=256단계)로도 청감상 원음에 가까운 복원이 가능하다.'},
 {expr:'z = tanh(W_f * x) ⊙ σ(W_g * x)',
  tex:'z=\\tanh(W_{f,k} * x)\\;\\odot\\;\\sigma(W_{g,k} * x)',
  d:'gated activation. $*$ 는 dilated convolution, $\\odot$ 는 원소별 곱. filter 경로와 gate 경로를 따로 학습해 정보 흐름을 조절한다.'}
],

numbers:[
 {k:'MOS · 북미영어 TTS', v:'4.21', d:'기존 최고 파라메트릭·concatenative 대비 유의하게 높음(원문 Table 1)'},
 {k:'자연음성(16bit PCM) MOS', v:'4.55', d:'상한선. WaveNet과의 격차가 이전 최선 대비 크게 줄었다고 보고'},
 {k:'양자화', v:'16bit → 8bit(256단계)', d:'µ-law companding 후 softmax 분류'},
 {k:'샘플레이트', v:'16,000 samples/sec', d:'최소 요구 해상도로 명시'},
 {k:'receptive field(최대 dilation 512 스택)', v:'1024 샘플', d:'약 240ms(48kHz 기준), 층 수 대비 지수적 확장의 결과'}
],

impact:'WaveNet은 파라메트릭 vocoder 없이 파형을 직접 만들어도 사람 음성에 근접한 자연스러움이 가능함을 입증했다. 하지만 대가가 있었다 — 샘플을 하나씩 순차 생성해야 해서 1초 음성을 만드는 데 수 분이 걸렸고, **실시간 서비스에 쓸 수 없었다**. 이 속도 문제가 이후 음성 합성 연구 전체의 의제를 정했다. 곧바로 mel spectrogram을 중간 표현으로 쓰고 WaveNet을 vocoder로만 쓰는 [Tacotron 2](#/p/tacotron2)가 나왔고, 그다음은 자기회귀 자체를 없애는 방향([FastSpeech](#/p/fastspeech), [HiFi-GAN](#/p/hifi-gan))으로 흘러갔다.',

legacy:[
 '**Vocoder로 재배치** — [Tacotron 2](#/p/tacotron2)가 WaveNet을 텍스트→파형 전체가 아니라 mel spectrogram→파형 후단 vocoder로만 사용하며 파이프라인이 2단계로 분리됨',
 '**속도와의 전쟁의 시작점** — Parallel WaveNet·WaveGlow 같은 비자기회귀 vocoder를 거쳐 [HiFi-GAN](#/p/hifi-gan)의 GAN 기반 병렬 생성으로 이어짐',
 '**dilated convolution의 표준화** — 시계열·오디오·시퀀스 모델링 전반에서 긴 문맥을 저비용으로 확보하는 기법으로 자리잡음',
 '**오디오 자기회귀 생성의 재등장** — 이산 토큰 위에서 자기회귀를 다시 쓰는 [AudioLM](#/p/audiolm)·[VALL-E](#/p/vall-e)는 원시 샘플이 아니라 codec 토큰 단위로 같은 아이디어를 재현한 것'
],

pitfalls:[
 '**"WaveNet = 엔드투엔드 TTS"가 아니다.** 이 논문의 TTS 실험은 여전히 기존 텍스트→언어특징 프론트엔드가 만든 특징을 local conditioning으로 받는다. 텍스트에서 곧바로 파형까지 가는 것은 이후 [Tacotron 2](#/p/tacotron2)의 몫이다.',
 '**추론이 학습만큼 병렬적이지 않다.** 학습은 teacher forcing으로 전체 시퀀스를 한 번에 병렬 계산할 수 있지만, 생성은 샘플 하나마다 이전 출력을 다시 먹여야 해서 완전히 순차적이다. 원 논문 자체는 실시간성보다 음질에 집중했고, 속도 개선은 후속 연구(Parallel WaveNet 등)의 과제로 남았다.',
 '**receptive field가 커도 무한 문맥은 아니다.** dilation 스택 크기로 receptive field가 정해지므로, 그보다 긴 장기 의존성(문장 전체 억양 등)은 여전히 놓칠 수 있다.'
],

figures:[
 {f:'fig3-dilated.png',
  cap:'dilation 1→2→4→8로 층마다 두 배씩 늘어나는 필터 간격. 4개 층만으로 맨 위 출력 하나가 입력 16개 샘플 전체를 덮는 receptive field를 갖는다 — 선형이 아니라 지수적으로 문맥이 커지는 게 핵심.',
  src:'원문 Figure 3, p.3'},
 {f:'fig4-architecture.png',
  cap:'하나의 residual block. 입력이 dilated conv → gated activation(tanh×sigmoid) → 1×1 conv를 거쳐 residual로 다음 블록에, 동시에 skip 경로로 최종 출력단에 더해진다. 이 블록이 k번 반복돼 전체 네트워크를 이룬다.',
  src:'원문 Figure 4, p.4'}
],

quotes:[
 {t:'WaveNets are autoregressive and combine causal filters with dilated convolutions to allow their receptive fields to grow exponentially with depth, which is important to model the long-range temporal dependencies in audio signals.',
  src:'Conclusion, p.9'}
],

links:[
 {t:'arXiv 1609.03499 — WaveNet: A Generative Model for Raw Audio', u:'https://arxiv.org/abs/1609.03499'},
 {t:'DeepMind blog — WaveNet', u:'https://deepmind.google/discover/blog/wavenet-a-generative-model-for-raw-audio/'}
]
});
