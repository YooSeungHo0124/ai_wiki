WIKI.paper({
slug:'soundstream',
venue:'IEEE/ACM TASLP 2021',
authors:'Zeghidour, Luebs, Omran, Skoglund, Tagliasacchi (Google Research)',
arxiv:'2107.03312',

tldr:'오디오 신호를 재구성이 아니라 **압축을 목표로** encoder–decoder와 함께 학습하는 신경망 코덱. **residual vector quantization(RVQ)**으로 오디오를 정수 토큰 시퀀스로 바꿔, 3~18kbps 범위에서 기존 코덱(Opus·EVS)보다 낮은 비트레이트로 더 나은 음질을 냈고, 오디오를 "이산 토큰"으로 취급해 언어모델을 얹는 이후 트랙 전체의 재료를 만들었다.',

context:'[WaveNet](#/p/wavenet)류 신경망은 음질 좋은 오디오를 만들 수 있음을 보였지만, 그 표현은 파형 자체이거나 mel spectrogram처럼 여전히 연속값이었다. 전통적 오디오 코덱(Opus·EVS)은 신호처리 기반 변환+양자화+엔트로피 코딩으로 압축률은 뛰어나지만 낮은 비트레이트에서 음질이 급격히 나빠진다. 이 논문의 질문은 **압축(코덱)이라는 목표 자체를 신경망으로 엔드투엔드 학습하면, 더 낮은 비트레이트에서 더 나은 음질을 낼 수 있지 않을까**였다. 답을 찾는 과정에서 나온 RVQ라는 장치가, 뜻하지 않게 오디오를 언어모델이 다룰 수 있는 **이산 토큰**으로 바꾸는 열쇠가 된다.',

ideas:[
 {h:'Residual Vector Quantizer(RVQ): 코드북 하나로는 안 되니 여러 개를 겹친다',
  lead:'양자화 잔차를 다음 코드북이 다시 양자화하는 것을 Nq번 반복해 비트레이트를 잘게 쪼갠다.',
  d:'목표 비트레이트 6000bps, 프레임률 75Hz라면 프레임당 80비트, 즉 $2^{80}$ 크기의 코드북이 필요해 단일 VQ는 불가능하다. RVQ는 입력을 첫 VQ로 양자화한 뒤 남은 잔차를 두 번째 VQ가 양자화하고, 이를 $N_q$ 번 반복한다(Algorithm 1). $N_q=8$ 이면 각 코드북 크기는 $N=2^{80/8}=1024$ 로 현실적인 크기가 된다. 각 단계의 출력은 이전 단계가 놓친 오차만 표현하므로, 코드북들의 합이 갈수록 정교해지는 근사를 이룬다.'},
 {h:'Quantizer dropout: 하나의 모델이 여러 비트레이트를 커버',
  lead:'학습 때마다 사용할 코드북 개수를 무작위로 잘라, 추론 시 원하는 만큼만 써도 되게 만든다.',
  d:'RVQ 단계 수 $N_q$ 가 비트레이트를 정하므로, 원래는 목표 비트레이트마다 모델을 따로 학습해야 한다. 이 논문은 매 학습 예제마다 사용할 코드북 수 $n_q$ 를 $[1,N_q]$ 에서 무작위로 뽑아 그만큼만 RVQ를 적용하는 **structured dropout**을 도입한다. 이렇게 학습한 단일 모델은 추론 시 $n_q$ 를 바꾸는 것만으로 3kbps~18kbps 전 구간을 커버하며, 고정 비트레이트로 학습한 모델과 품질 차이가 거의 없다.'},
 {h:'완전 합성곱 encoder–decoder + 적대적 학습',
  lead:'스트라이드 합성곱으로 파형을 320배 다운샘플링하고, GAN 손실로 디테일을 복원한다.',
  d:'encoder는 스트라이드 $(2,4,5,8)$ 의 1D 합성곱 블록을 쌓아 입력 샘플 320개마다 하나의 임베딩을 만든다(24kHz 기준 초당 75프레임). decoder는 대칭 구조로 파형을 복원한다. 재구성 손실(멀티스케일 spectral loss)만으로는 양자화로 인한 정보 손실을 못 메워 음질이 흐려지므로, wave 도메인 다중 판별기와 STFT 기반 판별기를 함께 쓰는 적대적 손실을 더한다.'},
 {h:'인코더 또는 디코더 측에서 잡음 억제를 공짜로 겸한다',
  lead:'조건 신호 하나를 추가해 압축과 노이즈 억제를 같은 latency로 동시에 수행한다.',
  d:'배경 잡음 억제를 켤지 끌지를 나타내는 조건 임베딩을 FiLM 방식으로 encoder(또는 decoder)에 주입하도록 학습하면, 별도의 추가 지연 없이 압축과 동시에 잡음을 제거할지 선택할 수 있다. 압축 코덱이 신호 향상(enhancement)까지 겸하는 것은 기존 코덱 구조에서는 없던 결합이다.'},
 {h:'실시간 스트리밍이 가능한 완전 causal 구조',
  lead:'모든 합성곱을 causal하게 설계해 미래 프레임을 보지 않고, 스마트폰 CPU에서 실시간으로 돈다.',
  d:'인코더·디코더 전부 causal convolution으로만 구성해(WaveNet과 달리 미래 컨텍스트를 쓰지 않아) 스트리밍 추론이 가능하다. 이 덕분에 스마트폰 CPU 한 코어에서 실시간보다 빠르게 인코딩·디코딩이 가능함을 보였다 — 서버가 아니라 기기 위에서 도는 코덱을 목표로 한 설계다.'}
],

diagram:{type:'flow', cap:'파형이 encoder로 압축된 뒤 RVQ가 여러 코드북을 순차로 통과시키며 토큰 시퀀스를 만든다. 이 토큰 시퀀스가 이후 [AudioLM](#/p/audiolm)·[VALL-E](#/p/vall-e)가 다루는 "오디오 언어"가 된다.',
 nodes:[
  {t:'파형(24kHz)', s:'입력'},
  {t:'Conv 인코더', s:'320배 다운샘플'},
  {t:'RVQ', s:'Nq단 코드북', acc:true},
  {t:'토큰 시퀀스', s:'75Hz × Nq'},
  {t:'Conv 디코더', s:'GAN 손실 학습'}
 ]},

math:[
 {expr:'y_hat = sum_{i=1..Nq} Q_i(residual_i),  residual_1 = enc(x)',
  tex:'\\hat{y}=\\sum_{i=1}^{N_q} Q_i(r_i),\\qquad r_1=\\mathrm{enc}(x),\\;\\; r_{i+1}=r_i-Q_i(r_i)',
  d:'RVQ의 핵심 반복. 각 단계 $Q_i$ 는 직전 잔차 $r_i$ 를 가장 가까운 코드북 벡터로 양자화하고, 그 오차만 다음 단계로 넘긴다 — Algorithm 1 그대로다.'},
 {expr:'N = 2^(r/Nq),  r = R / S  (S = fs / M)',
  tex:'r=\\frac{R}{S},\\qquad N=2^{\\,r/N_q}',
  d:'프레임당 비트 수 $r$ 은 목표 비트레이트 $R$ 을 초당 프레임 수 $S=f_s/M$ 로 나눈 값이고, 코드북 크기 $N$ 은 이를 $N_q$ 단으로 나눠 지수적으로 줄인 것. 예: $R=6000$bps, $S=75$, $N_q=8$ 이면 $N=1024$.'}
],

numbers:[
 {k:'스트라이드(다운샘플 비율)', v:'2·4·5·8 = 320배', d:'24kHz 입력 → 75Hz 임베딩 시퀀스'},
 {k:'비트레이트 범위', v:'3~18 kbps', d:'단일 모델이 quantizer dropout으로 전 구간 커버'},
 {k:'RVQ 코드북 크기(예시)', v:'N=1024 (Nq=8)', d:'6kbps 목표 시 코드북당 비트 수 10bit'},
 {k:'MUSHRA · 3kbps SoundStream vs Opus 12kbps', v:'SoundStream 우세', d:'절반 이하 비트레이트로 더 높은 주관 품질(원문 §V)'},
 {k:'MUSHRA · 3kbps vs EVS 9.6kbps', v:'근접 또는 우세', d:'약 3배 낮은 비트레이트로 근접한 품질'},
 {k:'저비트레이트 개선폭', v:'Opus·EVS 대비 2.2~2.6배 비트 절감', d:'동일 품질 기준(원문 §V-A)'}
],

impact:'SoundStream은 신경망 코덱이 전통 코덱을 낮은 비트레이트에서 능가할 수 있음을 보였지만, 더 중요한 파급은 **RVQ가 오디오를 정수 토큰의 시퀀스로 바꿔놓았다**는 점이다. 이 토큰은 이산적이고 유한한 어휘를 가지므로, 텍스트 토큰을 다루던 언어모델 기법(자기회귀 [Transformer](#/p/transformer))을 오디오에 그대로 적용할 길이 열렸다. 오디오 생성 연구는 이 지점부터 "파형을 직접 만들기"에서 "오디오 토큰 시퀀스를 언어모델로 예측하기"로 무게중심이 옮겨간다.',

legacy:[
 '**RVQ가 오디오 토큰화의 표준이 됨** — [EnCodec](#/p/encodec)이 같은 RVQ 골격에 LSTM·트랜스포머 언어모델을 결합해 압축률을 더 끌어올림',
 '**"오디오 토큰 + 언어모델" 트랙의 시작점** — [AudioLM](#/p/audiolm)이 SoundStream/유사 코덱의 토큰 시퀀스를 자기회귀로 예측하는 프레임을 확립',
 '**화자 복제·제로샷 TTS의 재료 제공** — [VALL-E](#/p/vall-e)가 EnCodec 토큰 위에서 in-context learning으로 3초 음성 복제를 구현할 때 바탕이 된 토큰화 방식의 원형',
 '**압축과 향상(enhancement)의 결합이라는 아이디어가 후속 코덱 연구에도 계승** — 인코더/디코더에 조건을 주입해 부가 기능을 겸하는 설계'
],

pitfalls:[
 '**RVQ 토큰은 "의미" 단위가 아니라 "재구성 오차를 줄이는" 단위다.** 코드북이 음소나 화자 정체성 같은 해석 가능한 축과 일치하도록 설계된 것이 아니라, 순전히 파형 재구성 손실을 최소화하도록 학습된다.',
 '**quantizer dropout은 비트레이트 스케일러빌리티를 위한 것이지, 품질 향상 기법이 아니다.** 목적은 "여러 비트레이트를 한 모델로" 이지, 고정 비트레이트 모델보다 더 좋은 품질을 내는 것이 아니다(원문도 "negligible quality loss"라고만 표현).',
 '**엔트로피 코딩은 이 논문의 핵심이 아니다.** RVQ 출력에 추가로 엔트로피 코더를 적용해 비트레이트를 더 줄이는 실험도 있지만, 논문이 강조하는 것은 학습된 표현 자체의 압축 효율이지 후처리 엔트로피 코딩이 아니다.'
],

figures:[
 {f:'fig2-overview.png',
  cap:'encoder가 파형을 latent 시퀀스로 압축하고, 그 출력을 residual vector quantizer(RVQ)가 순차적으로 양자화한다. discriminator(파형 및 STFT 기반)는 학습 때만 쓰여 decoder 출력을 실제 파형에 가깝게 만드는 적대적 신호를 준다.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'By training with structured dropout applied to quantizer layers, a single model can operate across variable bitrates from 3 kbps to 18 kbps, with a negligible quality loss when compared with models trained at fixed bitrates.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2107.03312 — SoundStream: An End-to-End Neural Audio Codec', u:'https://arxiv.org/abs/2107.03312'}
]
});
