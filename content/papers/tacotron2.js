WIKI.paper({
slug:'tacotron2',
venue:'ICASSP 2018',
authors:'Shen et al. (Google)',
arxiv:'1712.05884',

tldr:'텍스트를 mel spectrogram으로 바꾸는 seq2seq 모델과, mel spectrogram을 파형으로 바꾸는 [WaveNet](#/p/wavenet) vocoder를 이어붙여 **거의 사람 음성에 가까운 MOS 4.53**을 달성한 2단계 TTS 파이프라인. 사람이 듣기에 자연 음성(4.58)과 통계적으로 구분하기 어려운 수준에 처음 도달했다.',

context:'[WaveNet](#/p/wavenet)은 파형을 직접 자기회귀로 생성해 음질은 뛰어났지만, 원 논문에서는 언어학적 특징(음소 지속시간·F0 등)이라는 복잡한 중간 표현을 입력으로 받았다. 이 프론트엔드는 언어별로 전문가가 손으로 설계해야 하는 공학적 병목이었다. 한편 Tacotron(1세대)은 [seq2seq](#/p/seq2seq) + [Bahdanau attention](#/p/bahdanau)으로 텍스트에서 곧장 spectrogram을 만드는 데 성공했지만, 후단 vocoder로 품질이 제한적인 Griffin-Lim 알고리즘을 썼다. 이 논문의 질문은 단순하다 — **Tacotron이 만든 mel spectrogram으로 WaveNet을 조건화하면, 언어학적 특징 없이도 WaveNet 수준의 음질을 낼 수 있지 않을까?**',

ideas:[
 {h:'80채널 mel spectrogram을 공용 인터페이스로',
  lead:'선형 STFT 대신 mel spectrogram을 두 모델 사이의 표준 표현으로 채택한다.',
  d:'선형 주파수 spectrogram은 위상 정보를 버려 재구성이 어렵고 차원도 크다. 이 논문은 80채널 mel filterbank(125Hz~7.6kHz)로 압축한 mel spectrogram을 예측 대상으로 삼는다. WaveNet이 원래 쓰던 언어학적 특징보다 **더 낮은 수준(low-level)이면서 시간-주파수 구조가 명확한** 표현이라, 두 모델을 잇는 인터페이스로 적합하다는 것이 핵심 관찰이다.'},
 {h:'Location-sensitive attention으로 반복·생략 억제',
  lead:'이전 스텝의 attention 가중치를 다음 스텝 계산에 누적해 단조적으로 진행시킨다.',
  d:'[Bahdanau attention](#/p/bahdanau)을 확장해, 누적된 attention 가중치를 합성곱으로 처리한 위치 특징을 추가로 사용한다. 이렇게 하면 decoder가 입력 시퀀스를 순서대로 훑도록 유도되어, 긴 문장에서 흔한 **단어 반복이나 생략** 같은 attention 실패 모드가 줄어든다.'},
 {h:'Pre-net + 2층 LSTM + Post-net 구조의 decoder',
  lead:'이전 프레임을 좁은 병목(pre-net)에 통과시켜 attention이 과거에 과의존하지 않게 한다.',
  d:'decoder는 이전 타임스텝의 mel 프레임을 256유닛 pre-net(사실상 정보 병목)에 통과시킨 뒤 2층 LSTM으로 다음 프레임을 예측한다. 이 pre-net에 추론 시에도 dropout을 유지하는 것이 중요한 정규화 역할을 한다. 예측된 mel spectrogram 전체는 다시 5층 합성곱 **post-net**을 통과해 잔차를 더해 다듬는다 — post-net을 빼면 MOS가 4.526에서 4.429로 떨어진다.'},
 {h:'Stop token: 언제 멈출지 모델 스스로 예측',
  lead:'매 디코딩 스텝마다 종료 확률을 같이 출력해 고정 길이 가정을 없앤다.',
  d:'RNN decoder가 매 프레임마다 "이 시퀀스가 끝났는가"를 나타내는 스칼라를 함께 예측하고, 이 확률이 임계값을 넘으면 생성을 멈춘다. 문장 길이를 미리 정할 필요가 없어 가변 길이 발화를 자연스럽게 처리한다.'},
 {h:'WaveNet vocoder를 mel spectrogram 전용으로 단순화',
  lead:'언어학적 특징 대신 mel spectrogram만으로 WaveNet을 조건화하고 층 수를 절반으로 줄인다.',
  d:'[WaveNet](#/p/wavenet) 원 구조에서 30개 dilated conv층(3 dilation cycle)만 남기고 언어학적 특징 입력을 mel spectrogram으로 교체했다. 출력 분포도 256-way softmax 대신 **mixture of logistic distributions(MoL)**로 바꿔 16비트, 24kHz 샘플을 직접 생성한다. mel spectrogram이 이미 프레임 간 장기 의존성을 압축해 담고 있어서, receptive field가 WaveNet 원 논문(256ms)보다 훨씬 짧은(10.5ms) 모델로도 충분했다.'}
],

diagram:{type:'flow', cap:'텍스트 → mel spectrogram → 파형의 2단계 파이프라인. Tacotron 2라는 이름은 이 전체 시스템(seq2seq+vocoder)을 가리킨다.',
 nodes:[
  {t:'문자 임베딩', s:'char-level'},
  {t:'Conv+BiLSTM', s:'인코더'},
  {t:'Location Attn', s:'단조 정렬 유도', acc:true},
  {t:'LSTM 디코더', s:'mel 80채널'},
  {t:'WaveNet 보코더', s:'MoL·24kHz'}
 ]},

math:[
 {expr:'y_hat = f_decoder(prev mel frame, attention context); stop_prob = sigmoid(...)',
  tex:'\\hat{y}_t=\\text{Decoder}(y_{t-1},\\,c_t),\\qquad c_t=\\sum_i \\alpha_{t,i}\\,h_i',
  d:'디코더는 이전 프레임 $y_{t-1}$ 과 location-sensitive attention이 만든 context 벡터 $c_t$ 로 다음 mel 프레임을 예측한다. $\\alpha_{t,i}$ 는 인코더 상태 $h_i$ 에 대한 attention 가중치.'},
 {expr:'alpha_t = Attend(s_t, alpha_{t-1}, h)  — 누적 attention을 conv로 특징화',
  tex:'f_{t,i}=F * \\alpha_{t-1},\\qquad e_{t,i}=v^{\\top}\\tanh(Ws_t+Vh_i+Uf_{t,i}+b)',
  d:'location-sensitive attention의 핵심. 이전 스텝의 attention 가중치 $\\alpha_{t-1}$ 을 1D 합성곱 $F$ 로 처리한 위치 특징 $f_{t,i}$ 를 점수 계산에 추가해, attention이 입력을 순서대로 진행하도록 유도한다.'}
],

numbers:[
 {k:'MOS · Tacotron 2', v:'4.526 ± 0.066', d:'20 무작위 문장, 자연 음성과 유의한 차이 없음(원문 Table 1)'},
 {k:'MOS · 자연 음성', v:'4.582 ± 0.053', d:'상한선. Tacotron 2와의 격차가 통계적으로 유의하지 않다고 보고'},
 {k:'MOS · WaveNet(언어특징 기반)', v:'4.341 ± 0.051', d:'기존 방식. mel 기반 파이프라인이 이를 능가'},
 {k:'mel 채널 수', v:'80채널', d:'125Hz~7.6kHz mel filterbank'},
 {k:'WaveNet vocoder', v:'30층 · 3 dilation cycle', d:'원 WaveNet의 receptive field 256ms → 10.5ms로 축소해도 충분'},
 {k:'Post-net 유무 MOS', v:'4.526 vs 4.429', d:'post-net 제거 시 유의하게 하락 — 필수 구성요소'}
],

impact:'텍스트-투-스피치가 처음으로 통계적으로 사람 음성과 구분하기 힘든 수준(MOS 4.53 vs 4.58)에 도달했다. 언어학적 특징 프론트엔드를 mel spectrogram이라는 학습 가능한 중간 표현으로 대체하면서, TTS는 "전문가가 설계한 파이프라인"에서 "데이터로 끝까지 학습하는 두 모델의 연결"로 바뀌었다. 다만 여전히 **두 모델을 각각 학습**하고, decoder도 [WaveNet](#/p/wavenet) vocoder도 자기회귀라 추론이 느렸다 — 이 병목이 [FastSpeech](#/p/fastspeech)와 [HiFi-GAN](#/p/hifi-gan)의 출발점이 된다.',

legacy:[
 '**mel spectrogram이 TTS의 표준 중간 표현으로 정착** — 이후 거의 모든 신경망 TTS([FastSpeech](#/p/fastspeech), [VITS](#/p/vits) 포함)가 텍스트→mel→파형 구조를 계승하거나 그 경계를 없애는 방향으로 개선',
 '**자기회귀 decoder의 속도 문제가 다음 세대 연구 의제로** — attention 정렬 실패와 느린 프레임 단위 생성을 [FastSpeech](#/p/fastspeech)가 duration predictor로 해결',
 '**vocoder 자체의 세대교체** — 자기회귀 WaveNet vocoder는 병렬 생성이 가능한 GAN 기반 [HiFi-GAN](#/p/hifi-gan)으로 대체됨',
 '**2단계 파이프라인의 통합 시도** — 텍스트→mel과 mel→파형을 각각 학습하는 구조 자체를 하나의 end-to-end 모델로 합친 것이 [VITS](#/p/vits)'
],

pitfalls:[
 '**두 모델은 따로 학습된다.** WaveNet vocoder는 Tacotron 2가 예측한 mel spectrogram으로 학습해야 실제 추론 조건과 맞는다 — ground truth mel로만 학습하면 MOS가 4.526→4.449로 떨어진다(원문 Table 2, 예측/정답 mismatch 실험).',
 '**attention 정렬은 완벽하지 않다.** location-sensitive attention이 반복·생략을 줄이지만 없애지는 못하며, 긴 문장이나 반복적인 단어에서 여전히 실패할 수 있다. 이 불안정성이 duration 기반 비자기회귀 모델([FastSpeech](#/p/fastspeech))로 넘어가는 주된 이유였다.',
 '**"end-to-end"라는 말에 주의.** 텍스트에서 파형까지 이어지지만 학습·추론 모두 두 개의 독립된 모델이 순차 실행되는 구조다. 하나의 목적함수로 동시에 최적화되는 진짜 단일 모델은 [VITS](#/p/vits)에 가서야 나온다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽 인코더(문자 임베딩→conv→BiLSTM)가 만든 표현을 Location Sensitive Attention이 매 스텝 요약해 오른쪽 decoder(Pre-Net→LSTM→Linear)로 보낸다. decoder 출력이 Post-Net을 거쳐 최종 mel spectrogram이 되고, 별도의 Stop Token 출력이 종료 시점을 정한다. 맨 오른쪽 WaveNet MoL이 mel을 샘플로 바꾸는 vocoder.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'Our model achieves a mean opinion score (MOS) of 4.53 comparable to a MOS of 4.58 for professionally recorded speech.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1712.05884 — Natural TTS Synthesis by Conditioning WaveNet on Mel Spectrogram Predictions', u:'https://arxiv.org/abs/1712.05884'},
 {t:'Google AI blog — Tacotron 2', u:'https://ai.googleblog.com/2017/12/tacotron-2-generating-human-like.html'}
]
});
