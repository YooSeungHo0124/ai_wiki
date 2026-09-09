WIKI.paper({
slug:'vits',
venue:'ICML 2021',
authors:'Kim, Kong, Son (Kakao Enterprise)',
arxiv:'2106.06103',

tldr:'텍스트→mel(합성 모델)과 mel→파형([vocoder](#/p/hifi-gan))으로 나뉘어 있던 TTS 2단계 파이프라인을, [VAE](#/p/vae)·normalizing flow·적대적 학습을 하나로 묶어 **텍스트에서 파형까지 단일 모델로 동시에 학습**한 논문. 명칭(VITS) 자체가 "Variational Inference with adversarial learning for end-to-end TTS"의 약자다.',

context:'[Tacotron 2](#/p/tacotron2)에서 시작된 파이프라인은 이후 [FastSpeech](#/p/fastspeech)로 mel 생성이, [HiFi-GAN](#/p/hifi-gan)으로 파형 생성이 각각 병렬화됐지만, 두 모델은 여전히 **따로 학습**됐다. mel 예측 모델은 ground truth mel로 학습되는데 실제 추론에서는 자신이 만든(오차가 낀) mel을 vocoder에 넘기게 되는 **train-inference mismatch**가 구조적으로 남아 있었고, 이를 메우려면 vocoder를 예측된 mel로 다시 fine-tuning해야 했다. VITS의 질문은 **두 모델을 하나의 잠재변수로 잇고 한 번에 학습하면 이 불일치 자체가 사라지지 않을까**였다.',

ideas:[
 {h:'조건부 VAE로 텍스트와 파형을 잇는다',
  lead:'파형을 재구성하는 VAE의 잠재변수 z를 텍스트 조건 prior와 오디오 posterior 양쪽에서 정의한다.',
  d:'posterior encoder가 실제 선형 spectrogram에서 잠재변수 $z$ 를 인코딩하고, decoder가 $z$ 로부터 파형을 복원하며, 동시에 텍스트 인코더가 만드는 prior 분포가 $z$ 를 텍스트 조건으로 근사하도록 [ELBO](#/p/vae)를 최대화한다. 학습 시엔 posterior(실제 오디오 정보)가 있어 안정적으로 학습되고, 추론 시엔 prior(텍스트만으로 만든 분포)에서 $z$ 를 샘플링해 파형을 생성한다 — 두 단계가 하나의 잠재공간을 공유하므로 mismatch가 원천적으로 없다.'},
 {h:'Normalizing flow로 prior의 표현력을 끌어올린다',
  lead:'단순 가우시안이던 prior에 flow 기반 가역 변환을 씌워 실제 음성의 복잡한 분포를 근사한다.',
  d:'텍스트 조건만으로 만든 prior가 지나치게 단순한 가우시안이면 posterior와의 격차가 커 재구성 품질이 떨어진다. 텍스트 인코더의 출력에 [normalizing flow](#/p/vae)(가역 변환의 스택)를 적용해 prior 분포를 훨씬 복잡한 형태로 유연하게 넓힌다. flow는 부피 보존(volume-preserving) 변환으로 설계해 KL 발산 계산이 여전히 다루기 쉽게 유지된다.'},
 {h:'Monotonic Alignment Search(MAS)로 정답 정렬 없이 정렬을 학습',
  lead:'ELBO를 최대화하는 단조 정렬을 동적 계획법으로 탐색해 duration 정답 없이 정렬을 얻는다.',
  d:'[FastSpeech](#/p/fastspeech)는 별도의 teacher attention에서 duration 정답을 뽑아야 했지만, VITS는 정답 정렬 없이 음소-프레임 정렬 자체를 잠재변수로 보고 학습 중에 추정한다. 후보 정렬을 단조(단어 순서를 거스르지 않음) 경로로 제한한 뒤, 매 학습 스텝마다 ELBO를 최대화하는 정렬을 동적 계획법(MAS)으로 찾아 duration 정답처럼 사용한다.'},
 {h:'Stochastic Duration Predictor: 길이 자체를 분포로 모델링',
  lead:'flow 기반 생성모델로 duration을 하나의 숫자가 아니라 확률분포에서 샘플링한다.',
  d:'FastSpeech류의 duration predictor는 음소당 duration을 결정론적 스칼라로 회귀한다. VITS는 같은 텍스트도 발화마다 리듬이 다르다는 점을 반영해, duration을 flow 기반 확률모델로 표현하고 학습 시 variational dequantization으로 이산 duration을 연속화해 가역 변환이 가능하게 만든다. 추론 시 이 분포에서 샘플링하면 매번 미묘하게 다른 리듬의 음성이 나온다.'},
 {h:'VAE 재구성 손실 위에 GAN 적대적 학습을 얹는다',
  lead:'HiFi-GAN의 판별기·손실 구성을 그대로 가져와 decoder의 출력을 사실적인 파형으로 다듬는다.',
  d:'VAE의 재구성 손실(mel 스펙트로그램 L1)만으로는 파형이 흐릿해지기 쉽다. [HiFi-GAN](#/p/hifi-gan)의 multi-period·multi-scale 판별기와 적대적 손실·feature matching 손실을 decoder에 그대로 결합해, ELBO(재구성+KL)와 GAN 손실을 한 번에 최적화한다. 이 결합 덕에 decoder가 사실상 HiFi-GAN급 vocoder 역할까지 겸한다.'}
],

diagram:{type:'compare', cap:'2단계 파이프라인이 하나의 잠재변수 z로 이어진다. z는 학습 시 posterior(실제 오디오)에서, 추론 시 prior(텍스트만)에서 나온다.',
 left:{t:'기존: 2단계 파이프라인', items:['텍스트→mel 모델 별도 학습','mel→파형 vocoder 별도 학습','예측 mel로 vocoder 재학습 필요']},
 right:{t:'VITS: 단일 잠재변수', items:['posterior·prior가 z 공유','MAS로 정렬 자체를 학습','duration도 flow로 확률화']}},

math:[
 {expr:'log p(x|c) >= E[log p(x|z) - log(q(z|x)/p(z|c))]  (ELBO)',
  tex:'\\log p_\\theta(x\\mid c)\\;\\ge\\;\\mathbb{E}_{q_\\phi(z|x)}\\Big[\\log p_\\theta(x\\mid z)-\\log\\frac{q_\\phi(z\\mid x)}{p_\\theta(z\\mid c)}\\Big]',
  d:'조건부 VAE의 목적함수. 우변은 재구성 항 $\\log p_\\theta(x|z)$ 와 posterior·prior 사이 KL 발산 항으로 나뉘며, 이 음의 ELBO를 최소화하는 것이 학습 손실의 뼈대다.'},
 {expr:'L_vae = L_recon + L_kl + L_dur + L_adv(G) + L_fm(G)',
  tex:'\\mathcal{L}_{\\text{vae}}=\\mathcal{L}_{\\text{recon}}+\\mathcal{L}_{\\text{kl}}+\\mathcal{L}_{\\text{dur}}+\\mathcal{L}_{\\text{adv}}(G)+\\mathcal{L}_{\\text{fm}}(G)',
  d:'최종 학습 손실. VAE의 재구성·KL 손실에 duration 손실, 그리고 [HiFi-GAN](#/p/hifi-gan) 계열 적대적 손실·feature matching 손실을 모두 더해 하나의 모델을 한 번에 학습한다.'}
],

numbers:[
 {k:'MOS · VITS', v:'4.43 ± 0.06', d:'LJ Speech, ground truth(4.46) 대비 근접(원문 Table 1)'},
 {k:'MOS · Glow-TTS+HiFi-GAN(fine-tuned)', v:'4.32 ± 0.07', d:'2단계 파이프라인 최상위 베이스라인'},
 {k:'MOS · Tacotron2+HiFi-GAN(fine-tuned)', v:'4.25 ± 0.07', d:'2단계 베이스라인'},
 {k:'CMOS(다화자 VCTK)', v:'-0.106 ~ -0.270', d:'ground truth 대비 7점 비교 평가, 격차가 크지 않음(원문 Table 5)'},
 {k:'추론 속도', v:'실시간보다 빠름', d:'단일 V100에서 병렬 생성, 2단계 파이프라인 대비 합성 지연 감소(원문 §4.3)'}
],

impact:'VITS는 텍스트에서 파형까지 하나의 목적함수로 학습되는 최초의 고품질 TTS를 보여, "두 모델을 잇는" 문제 자체를 없앴다. mel spectrogram이라는 명시적 중간 표현이 더 이상 필수가 아니라 잠재변수로 대체될 수 있음을 증명했고, MOS 4.43으로 기존 2단계 파이프라인의 fine-tuning 없이도 그와 맞먹거나 능가하는 결과를 냈다. 이후 엔드투엔드 TTS 연구는 대부분 VITS의 VAE+flow+GAN 조합을 기본 골격으로 삼는다.',

legacy:[
 '**엔드투엔드 TTS의 기준 아키텍처가 됨** — 이후 다화자·다국어 TTS(YourTTS, VITS2 등)가 VITS 골격을 그대로 확장',
 '**Stochastic Duration Predictor가 리듬 다양성의 표준 해법으로** — 결정론적 duration 대신 확률적 duration을 쓰는 방식이 후속 연구에 널리 채택됨',
 '**MAS가 정렬 학습의 대안 제시** — teacher 모델의 attention 없이도 duration 정답을 학습 중 자체 추정할 수 있음을 보여, [FastSpeech](#/p/fastspeech) 이후의 2단계 teacher-student 구조를 우회',
 '**codec 기반 흐름과는 다른 축** — [SoundStream](#/p/soundstream)·[EnCodec](#/p/encodec)이 오디오를 이산 토큰화해 언어모델을 얹는 방향이라면, VITS는 연속 잠재공간에서 파형을 직접 생성하는 방향을 끝까지 밀어붙인 마지막 세대에 가깝다'
],

pitfalls:[
 '**"end-to-end"는 학습이 하나로 합쳐졌다는 뜻이지, 프론트엔드가 없다는 뜻이 아니다.** 텍스트를 음소로 바꾸는 phonemizer 같은 전처리는 여전히 별도로 필요하다.',
 '**MAS는 학습 중에만 쓰인다.** 추론 시에는 stochastic duration predictor가 예측한 duration으로 길이를 정하며, 학습 때의 정렬 탐색 과정 자체는 추론 경로에 없다.',
 '**posterior encoder·discriminator는 추론에 쓰이지 않는다.** 학습 전용 구성요소라, 파라미터 수나 추론 속도를 이야기할 때 이 부분을 포함하면 안 된다.'
],

figures:[
 {f:'fig1-training.png',
  cap:'학습 시 구조. 왼쪽 파란 블록이 posterior encoder(선형 spectrogram→z), 초록 블록이 normalizing flow와 텍스트 인코더로 이뤄진 conditional prior, 오른쪽이 stochastic duration predictor. z 하나가 posterior와 prior 양쪽에서 정의되는 것이 핵심 — 이 z를 공유하는 decoder가 파형을 만든다.',
  src:'원문 Figure 1(a), p.3'}
],

quotes:[
 {t:'Our method adopts variational inference augmented with normalizing flows and an adversarial training process, which improves the expressive power of generative modeling.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2106.06103 — Conditional Variational Autoencoder with Adversarial Learning for End-to-End Text-to-Speech', u:'https://arxiv.org/abs/2106.06103'}
]
});
