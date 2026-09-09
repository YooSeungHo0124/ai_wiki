WIKI.paper({
slug:'encodec',
venue:'TMLR 2023 (arXiv 2022)',
authors:'Défossez, Copet, Synnaeve, Adi (Meta AI)',
arxiv:'2210.13438',

tldr:'[SoundStream](#/p/soundstream)의 RVQ 코덱 골격에 **손실 균형 장치(balancer)**와 **RVQ 토큰 위를 예측하는 작은 Transformer 언어모델(추가 엔트로피 코딩)**을 얹어, 같은 비트레이트에서 더 안정적으로 학습되고 더 낮은 실효 대역폭을 내는 신경망 오디오 코덱. 이 논문이 만든 RVQ 토큰이 곧바로 [AudioLM](#/p/audiolm)·[VALL-E](#/p/vall-e)의 입력 어휘가 된다.',

context:'[SoundStream](#/p/soundstream)이 RVQ 기반 신경망 코덱과 quantizer dropout으로 가변 비트레이트를 이미 증명했지만, 두 가지가 남아 있었다. 하나는 **학습 안정성** — 재구성 손실·적대적 손실·판별기 손실의 크기가 서로 달라 가중치를 수동으로 튜닝해야 했다. 다른 하나는 **압축률의 여지** — RVQ 코드는 균일한 확률로 취급됐지만 실제로는 코드 간 통계적 의존성이 있어, 이를 모델링하면 추가로 압축할 수 있다. EnCodec은 이 두 문제를 각각 손실 balancer와, RVQ 코드 시퀀스 위에 얹은 작은 언어모델(엔트로피 코딩용)로 풀었다.',

ideas:[
 {h:'Loss balancer: 손실마다 그래디언트 크기를 정규화',
  lead:'각 손실의 그래디언트 노름을 손실 가중치가 아니라 그래디언트 스케일로 직접 통제한다.',
  d:'재구성 손실 $\\ell_t,\\ell_f$ 와 적대적 손실 $\\ell_g,\\ell_{feat}$ 은 서로 스케일이 크게 다르고 학습 중에도 변한다. 기존처럼 손실에 고정 가중치를 곱하면 특정 손실의 그래디언트가 다른 손실을 압도할 수 있다. balancer는 각 손실이 decoder 출력에 만드는 그래디언트의 **지수이동평균 노름**을 구해, 미리 정한 목표 비율대로 각 손실의 기여를 재조정한 뒤 역전파한다. 결과적으로 손실 가중치가 실제 최적화 동역학을 더 직접적으로 반영하게 되어 학습이 안정된다.'},
 {h:'RVQ 코드 위에 작은 Transformer 언어모델을 얹어 엔트로피 코딩',
  lead:'RVQ 코드 시퀀스의 확률분포를 Transformer로 예측해 산술 부호화로 추가 압축한다.',
  d:'RVQ가 만드는 각 코드북의 토큰은 균일 분포로 가정하면 $\\log_2 N$ 비트가 필요하지만, 실제로는 이전 코드들과 통계적으로 연관돼 있다. 코드북별로 작은 Transformer 언어모델을 학습해 다음 코드의 확률분포를 예측하고, 이 분포를 **산술 부호화(entropy coding)**에 넘겨 실제 필요한 비트 수를 줄인다. 이 언어모델은 스트리밍과 호환되도록 인과적으로 설계되며, 예측이 빗나가도 손실 없는 복원은 보장된다(압축률만 달라짐).'},
 {h:'멀티스케일 STFT 판별기(MS-STFT)로 위상·주파수 디테일을 잡는다',
  lead:'여러 시간-주파수 해상도의 STFT에서 판별기를 돌려 파형 판별기가 놓치는 디테일을 보완한다.',
  d:'파형 도메인 판별기만으로는 특정 주파수 대역의 미세한 아티팩트를 놓치기 쉽다. 여러 STFT 해상도(윈도우 크기별)에서 2D 합성곱 판별기를 돌리는 MS-STFT discriminator를 도입해, 시간·주파수 양쪽에서 생성 파형과 원본을 구분하도록 학습시킨다. ablation에서 이 판별기 하나만으로도 강한 품질을 냈고, 여기에 [HiFi-GAN](#/p/hifi-gan) 계열 MPD를 추가하면 소폭 더 개선됐다.'},
 {h:'스트리밍 우선 설계: causal conv + 경량 LSTM',
  lead:'모든 합성곱을 causal하게, 시간축 문맥은 2층 LSTM으로 저비용으로 확보한다.',
  d:'인코더·디코더의 합성곱을 전부 causal하게 두고, 다운샘플링 이후 2층 LSTM을 추가해 긴 시간적 문맥을 낮은 연산 비용으로 포착한다. batch normalization은 스트리밍(가변 길이·실시간)에 맞지 않아 weight normalization을 쓴다. 이 구성으로 노트북 CPU 한 스레드에서도 실시간보다 빠르게 인코딩·디코딩이 가능함을 보인다.'}
],

diagram:{type:'compare', cap:'SoundStream이 확립한 RVQ 코덱 골격을 EnCodec이 안정적 학습과 추가 압축이라는 두 축으로 확장했다.',
 left:{t:'SoundStream', items:['RVQ + quantizer dropout','손실 가중치 수동 설정','코드는 균일분포로 전송']},
 right:{t:'EnCodec', items:['loss balancer로 자동 균형','작은 LM으로 엔트로피 코딩','MS-STFT 판별기로 디테일 보강']}},

math:[
 {expr:'g_balanced_i = (lambda_i / <||g_i||>) * g_i,  then sum and backprop',
  tex:'\\tilde{g}_i=R\\cdot\\frac{\\lambda_i}{\\langle\\lVert g_i\\rVert_2\\rangle_\\beta}\\,g_i,\\qquad \\ell=\\sum_i \\tilde{g}_i\\cdot x',
  d:'balancer의 핵심. 손실 $\\ell_i$ 가 decoder 출력에 만드는 그래디언트 $g_i$ 를 그 지수이동평균 노름 $\\langle\\lVert g_i\\rVert\\rangle_\\beta$ 로 나눠 정규화한 뒤, 목표 비율 $\\lambda_i$ 와 전체 스케일 $R$ 을 곱해 합산한다. 손실값이 아니라 그래디언트 크기를 직접 통제한다는 점이 핵심.'},
 {expr:'code_i ~ P_theta(code_i | code_1..i-1)  — 작은 Transformer가 다음 코드 분포 예측',
  tex:'\\hat{p}_\\theta(c_i \\mid c_1,\\dots,c_{i-1})',
  d:'RVQ 코드 시퀀스 위에서 학습된 언어모델이 다음 코드의 조건부 분포를 예측하고, 이 분포로 산술 부호화를 수행해 실제 필요한 비트 수를 이론적 하한(엔트로피)에 가깝게 줄인다.'}
],

numbers:[
 {k:'MUSHRA · 24kHz 3kbps', v:'67.0 ± 1.5', d:'Lyra-v2 6kbps(66.2)·Opus 12kbps(76.5)와 비교 가능한 수준을 절반 이하 비트레이트로 달성'},
 {k:'MUSHRA · 24kHz 12kbps', v:'90.6 ± 2.6', d:'EVS 9.6kbps(84.4) 대비 우세'},
 {k:'엔트로피 코딩 후 실효 대역폭', v:'~25~40% 감소', d:'3kbps 모델을 언어모델+산술부호화로 약 1.9kbps까지 축소'},
 {k:'48kHz 스테레오 6kbps', v:'MP3 64kbps와 comparable', d:'MUSHRA 82.9 vs 82.7, 약 10배 낮은 비트레이트'},
 {k:'실행 속도', v:'실시간보다 빠름', d:'MacBook Pro 2019 CPU 단일 스레드, 6kbps 기준(원문 §4.5)'}
],

impact:'EnCodec은 SoundStream이 연 신경망 코덱 트랙을 실제 서비스 수준의 안정성(loss balancer)과 압축 효율(엔트로피 코딩용 언어모델)로 끌어올렸다. 더 결정적인 것은, **RVQ 코드 위에 언어모델을 얹어 확률을 예측한다는 이 논문의 부산물**이 그대로 다음 세대 연구의 청사진이 됐다는 점이다 — 여기서는 압축을 위해 다음 코드의 확률을 예측했지만, [AudioLM](#/p/audiolm)·[VALL-E](#/p/vall-e)는 같은 구조로 압축이 아니라 **생성**을 위해 다음 코드를 예측한다.',

legacy:[
 '**RVQ 토큰이 오디오 생성 언어모델의 표준 어휘가 됨** — [AudioLM](#/p/audiolm)·[VALL-E](#/p/vall-e)·MusicGen이 EnCodec 코드북을 그대로 토큰으로 사용',
 '**압축용 언어모델과 생성용 언어모델의 경계가 이 지점에서 갈림** — 같은 "다음 코드 예측"이 엔트로피 코딩(EnCodec)과 오디오 생성(AudioLM 이후)이라는 서로 다른 목적으로 재사용됨',
 '**loss balancer가 이후 오디오·비디오 생성 모델의 다중 손실 학습에 참고 기법으로 확산**',
 '**멀티코드북 구조가 [VALL-E](#/p/vall-e)의 AR+NAR 이중 예측 구조로 직접 이어짐** — 첫 코드북은 자기회귀로, 나머지는 병렬로 예측하는 설계의 전제가 EnCodec의 다단 RVQ'
],

pitfalls:[
 '**엔트로피 코딩(언어모델)은 손실 압축률만 바꾸며 손실 없는 복원을 해치지 않는다.** "언어모델을 쓴다"고 해서 RVQ 코드 자체가 바뀌는 것이 아니라, 같은 코드를 더 적은 비트로 표현하는 후처리 단계다.',
 '**MUSHRA 수치는 24kHz와 48kHz 스테레오 실험이 따로 있다.** 두 설정의 비트레이트·비교 대상(Opus/EVS vs MP3)이 다르므로 수치를 인용할 때 어느 설정인지 반드시 구분해야 한다.',
 '**"작은 Transformer 언어모델"은 EnCodec 자체의 인코더·디코더와는 별도 모듈이다.** 코덱 압축 단계의 부속품이며, [AudioLM](#/p/audiolm) 등에서 쓰는 대규모 생성용 언어모델과는 크기·목적이 다르다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'파형이 causal conv 인코더(+LSTM)를 거쳐 RVQ로 양자화되고, 그 코드가 디코더로 복원됨과 동시에 오른쪽 Transformer 언어모델의 입력이 되어 엔트로피 코딩에 쓰인다. 아래쪽은 학습에 쓰이는 판별기(파형+MS-STFT).',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We introduce a novel loss balancer mechanism to stabilize training: the weight of a loss now defines the fraction of the gradient it should represent.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2210.13438 — High Fidelity Neural Audio Compression', u:'https://arxiv.org/abs/2210.13438'}
]
});
