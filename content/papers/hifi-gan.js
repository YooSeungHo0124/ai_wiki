WIKI.paper({
slug:'hifi-gan',
venue:'NeurIPS 2020',
authors:'Kong, Kim, Bae (Kakao Enterprise)',
arxiv:'2010.05646',

tldr:'mel spectrogram을 파형으로 바꾸는 vocoder를 [GAN](#/p/gan)으로 만들어, 자기회귀 [WaveNet](#/p/wavenet)과 맞먹는 음질을 내면서 **V100 GPU에서 실시간의 167배 속도**로 생성한 논문. mel→파형 단계에서 자기회귀를 완전히 걷어냈다.',

context:'[Tacotron 2](#/p/tacotron2) 이후 TTS는 텍스트→mel과 mel→파형(vocoder)의 2단계로 굳어졌다. mel 쪽은 [FastSpeech](#/p/fastspeech)가 duration 기반 병렬 생성으로 속도를 해결했지만, vocoder 쪽은 여전히 자기회귀 [WaveNet](#/p/wavenet)이거나 Flow 기반 WaveGlow처럼 무거운 모델이 많아 실시간 서비스에 부담이었다. 앞서 MelGAN이 GAN으로 vocoder를 병렬화하는 방향을 열었지만 WaveNet 수준의 음질에는 못 미쳤다. 이 논문의 질문은 **왜 GAN vocoder가 아직 자기회귀 모델의 음질을 따라잡지 못했는가**였고, 답은 "음성 신호가 여러 주기(period)의 정현파가 겹친 것"이라는 관찰에서 나온다.',

ideas:[
 {h:'Multi-Period Discriminator(MPD): 주기마다 다른 눈으로 본다',
  lead:'파형을 소수 주기 [2,3,5,7,11]로 나눠 2D 재배열한 뒤 각 주기 전용 판별기로 본다.',
  d:'사람 음성은 여러 주기의 정현파가 겹쳐 만들어지는데, 1D convolution 판별기는 인접 샘플만 보므로 특정 주기의 패턴을 놓치기 쉽다. MPD는 파형을 겹치지 않는 소수(prime) 주기 $[2,3,5,7,11]$ 로 2D 텐서로 재배열한 뒤, 주기마다 독립된 서브 판별기를 둔다. 각 서브 판별기는 폭(width) 방향 커널 크기를 1로 고정해 재배열된 주기 샘플들을 서로 독립적으로 처리한다. 이 다중 주기 관점이 자연스러운 정현파 구조를 포착하는 핵심이다.'},
 {h:'Multi-Scale Discriminator(MSD): 연속 구간도 함께 본다',
  lead:'MelGAN에서 가져온 3단 평균풀링 판별기로 MPD가 놓치는 연속 샘플 패턴을 보완한다.',
  d:'MPD는 서로소인 샘플만 골라 보기 때문에 연속된 샘플 사이의 패턴은 놓친다. MSD는 원본·평균풀링 ×2·×4로 세 해상도에서 연속 구간을 그대로 훑는 판별기를 둬 MPD를 보완한다. MPD가 사실상 새로운 아이디어이고 MSD는 검증된 기존 구조를 재사용한 조합이다.'},
 {h:'Multi-Receptive Field Fusion(MRF): 여러 크기의 패턴을 병렬로 합친다',
  lead:'커널·dilation이 다른 residual block 여러 개의 출력을 더해 다양한 길이의 패턴을 동시에 본다.',
  d:'generator는 mel spectrogram을 transposed convolution으로 파형 해상도까지 업샘플링하는데, 업샘플링 블록마다 커널 크기와 dilation이 서로 다른 residual block 여러 개를 병렬로 두고 그 출력을 합산하는 MRF 모듈을 붙인다. 하나의 receptive field로는 짧은 패턴과 긴 패턴을 동시에 잘 못 잡는데, MRF는 여러 receptive field를 병렬로 융합해 이 문제를 완화한다.'},
 {h:'GAN + mel-spectrogram loss + feature matching loss',
  lead:'적대적 손실만으로는 부족해 mel 재구성 손실과 판별기 중간층 특징 손실을 함께 쓴다.',
  d:'순수 GAN 손실만 쓰면 학습이 불안정하고 생성음이 실제와 미세하게 어긋난다. 생성 파형을 다시 mel spectrogram으로 변환해 원본 mel과의 L1 거리를 최소화하는 **mel-spectrogram loss**, 그리고 판별기 중간층 활성값을 진짜·가짜 사이에서 맞추는 **feature matching loss**를 GAN 손실에 더해 세 손실을 함께 최적화한다. mel loss가 학습 초기 수렴을 크게 돕고 생성 품질을 안정시킨다.'}
],

diagram:{type:'split', cap:'하나의 generator 출력을 서로 다른 관점의 판별기 두 종류(MPD·MSD)가 동시에 평가한다. 이 다중 판별기 조합이 HiFi-GAN 음질의 핵심.',
 from:{t:'생성 파형', s:'generator 출력'},
 branches:[
  {t:'MPD', s:'주기 2,3,5,7,11'},
  {t:'MSD', s:'원본·½·¼ 스케일'}
 ],
 join:'GAN + mel + feature matching loss'},

math:[
 {expr:'L_G = L_adv(G;D) + λ_fm * L_FM(G;D) + λ_mel * L_mel(G)',
  tex:'\\mathcal{L}_G=\\mathcal{L}_{\\text{adv}}(G;D)+\\lambda_{fm}\\mathcal{L}_{FM}(G;D)+\\lambda_{mel}\\mathcal{L}_{mel}(G)',
  d:'generator의 최종 손실. $\\lambda_{fm}=2$, $\\lambda_{mel}=45$ 로 mel loss에 큰 가중치를 줘, 판별기가 아직 약한 학습 초반에도 생성 파형이 실제 mel과 어긋나지 않게 잡아준다.'},
 {expr:'L_mel(G) = E[|| mel(x) - mel(G(s)) ||_1]',
  tex:'\\mathcal{L}_{mel}(G)=\\mathbb{E}_{(x,s)}\\big[\\lVert \\phi(x)-\\phi(G(s))\\rVert_1\\big]',
  d:'생성 파형 $G(s)$ 와 실제 파형 $x$ 를 각각 mel spectrogram으로 변환($\\phi$)한 뒤 L1 거리를 최소화한다. 재구성 목표를 원시 파형이 아니라 사람 청각에 가까운 mel 공간에서 준다.'}
],

numbers:[
 {k:'MOS · HiFi-GAN V1', v:'4.36 ± 0.05', d:'ground truth(4.45) 대비 격차 0.09, 13.92M 파라미터'},
 {k:'MOS · HiFi-GAN V2', v:'4.23', d:'0.92M 파라미터로 V1에 근접하는 음질'},
 {k:'GPU 생성 속도(V1)', v:'167.9배 실시간', d:'22.05kHz 오디오, V100 GPU 기준'},
 {k:'CPU 생성 속도(V3)', v:'13.44배 실시간', d:'경량 모델, on-device 목표'},
 {k:'MPD 주기 집합', v:'[2, 3, 5, 7, 11]', d:'서로소를 골라 겹치는 패턴을 최소화'},
 {k:'GPU 생성 속도(V3)', v:'1,186배 실시간', d:'단일 V100 기준, 가장 가벼운 구성'}
],

impact:'HiFi-GAN은 vocoder 단계에서 자기회귀·flow 기반 모델을 걷어내고도 WaveNet 수준의 음질(MOS 격차 0.09)을 GAN만으로 낼 수 있음을 보였다. mel→파형 변환이 실시간을 훨씬 웃도는 속도로 가능해지면서, TTS 파이프라인의 병목이 사실상 텍스트→mel 단계로 완전히 옮겨갔다. Multi-Period Discriminator가 제시한 "신호를 여러 주기로 재배열해 본다"는 아이디어는 이후 오디오 GAN 전반의 표준 판별기 설계가 됐다.',

legacy:[
 '**GAN vocoder의 표준이 됨** — MPD+MSD 조합은 이후 대부분의 신경망 vocoder(BigVGAN 등)가 그대로 채택하는 기본 판별기 구성',
 '**엔드투엔드 통합의 재료 제공** — [VITS](#/p/vits)가 HiFi-GAN의 generator·판별기 구조를 그대로 가져와 텍스트→파형 단일 모델의 후단으로 흡수',
 '**neural codec의 판별기 설계에도 영향** — [SoundStream](#/p/soundstream)·[EnCodec](#/p/encodec)의 적대적 학습 구성 요소들이 HiFi-GAN 계열 판별기 아이디어를 계승',
 '**vocoder 자체가 더 이상 병목이 아니게 됨** — 이후 연구의 초점이 mel 생성 품질과 화자·감정 제어 쪽으로 이동'
],

pitfalls:[
 '**generator만으로는 학습이 안 된다.** MPD·MSD 판별기와 mel-spectrogram loss·feature matching loss가 함께 있어야 안정적으로 수렴한다. GAN 손실 하나만 쓰면 원 논문에서도 불안정하다고 보고한다.',
 '**ground truth mel로 학습·평가한 결과다.** 실제 서비스에서는 텍스트→mel 모델(FastSpeech·Tacotron 2)이 예측한 mel을 입력받으므로, 그 mel의 오차가 그대로 HiFi-GAN 출력에 전달된다 — mismatch에 대한 강건성은 이 논문의 핵심 주장이 아니다.',
 '**V1·V2·V3는 트레이드오프 스펙트럼이다.** "HiFi-GAN이 빠르다"는 주로 경량 버전(V2·V3) 이야기이고, 최고 음질(V1)은 상대적으로 느리다 — 어떤 버전을 인용하는지 구분해야 한다.'
],

figures:[
 {f:'fig1-generator.png',
  cap:'generator(왼쪽)는 mel spectrogram을 transposed conv로 업샘플링하며, 업샘플링 블록마다 커널·dilation이 다른 residual block들(MRF, 가운데)을 병렬로 더한다. 오른쪽은 MRF 안의 residual block 하나의 dilated conv 스택.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'As speech audio consists of sinusoidal signals with various periods, we demonstrate that modeling periodic patterns of an audio is crucial for enhancing sample quality.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2010.05646 — HiFi-GAN: Generative Adversarial Networks for Efficient and High Fidelity Speech Synthesis', u:'https://arxiv.org/abs/2010.05646'}
]
});
