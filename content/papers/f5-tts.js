WIKI.paper({
slug:'f5-tts',
venue:'arXiv 2024',
authors:'Chen, Niu, Ma et al.',
arxiv:'2410.06885',

tldr:'지속시간 예측기·음소 정렬·의미 코덱 없이, 텍스트를 필러 토큰으로 패딩해 음성 길이만큼 채워 넣는 것만으로 동작하는 **흐름 매칭 기반 비자기회귀(non-autoregressive) TTS**. [E2 TTS](https://arxiv.org/abs/2406.18009)의 단순함을 이어받아 ConvNeXt V2와 Sway Sampling으로 정렬 실패와 느린 추론이라는 약점을 보완했다.',

context:'2024년 zero-shot TTS는 크게 두 갈래였다. [VALL-E](#/p/vall-e)류는 음성을 이산 코덱 토큰으로 바꿔 **자기회귀** 언어모델로 순차 생성했고, Matcha-TTS 같은 diffusion 계열은 음소 수준 지속시간 예측기로 텍스트-음성 정렬을 명시적으로 모델링했다. 두 방식 모두 부가 모듈(코덱의 의미 정보 주입, 별도 지속시간 예측기)이 필요했다. E2 TTS는 음소 정렬도 지속시간 예측기도 없이 문자를 그대로 필러 토큰으로 채워 mel-spectrogram 길이에 맞추는 극단적으로 단순한 방식을 시도했지만, 텍스트-음성 정렬이 종종 실패하는 견고성 문제가 있었다. F5-TTS의 질문은 **이 단순함을 유지하면서 정렬 견고성과 추론 속도를 어떻게 개선할 것인가**이다.',

ideas:[
 {h:'텍스트를 필러 토큰으로 패딩해 길이를 맞춘다',
  lead:'음소 정렬이나 지속시간 예측 없이 문자 시퀀스를 목표 speech 길이만큼 필러 토큰으로 채운다.',
  d:'텍스트를 문자 단위로 쪼갠 뒤, 목표 mel-spectrogram과 같은 길이가 되도록 나머지를 필러 토큰(`<F>`)으로 채워 넣는다. 모델은 이 "듬성듬성한" 문자 시퀀스와 마스킹된 speech를 함께 보고, 마스킹된 구간(정답이 필요한 부분)의 흐름을 예측하는 **speech-infilling** 과제로 학습한다. 별도의 지속시간 예측기가 없어도 모델이 학습 중 각 문자가 차지할 길이를 총 시퀀스 길이로부터 암묵적으로 배운다.'},
 {h:'ConvNeXt V2로 텍스트 표현을 미리 다듬는다',
  lead:'패딩된 문자 시퀀스를 speech와 합치기 전에 ConvNeXt V2 블록으로 먼저 정제해 정렬을 돕는다.',
  d:'E2 TTS는 패딩된 문자를 speech 입력과 바로 concat했는데, 이는 텍스트-음성 정렬 실패의 원인으로 지목됐다. F5-TTS는 문자 임베딩을 concat하기 전에 [ConvNeXt](#/p/convnext) V2 블록에 통과시켜, 인접 문자 간 지역적 문맥을 미리 섞은 표현으로 만든다. 이 정제 단계 하나가 in-context 학습에서 정렬을 크게 안정시킨다는 것이 논문의 핵심 관찰이다.'},
 {h:'DiT + 흐름 매칭으로 조건부 흐름을 학습',
  lead:'[Flow Matching](#/p/flow-matching) 손실로 노이즈에서 mel-spectrogram으로 가는 속도장을 DiT가 회귀한다.',
  d:'마스킹된 mel-spectrogram, 텍스트 조건, timestep을 함께 입력받은 Diffusion Transformer(DiT) 블록이 조건부 흐름 매칭(conditional flow matching) 손실로 학습된다. 추론 시에는 화자 3초 프롬프트와 목표 텍스트를 채운 뒤, 가우시안 노이즈에서 시작해 ODE solver로 몇 스텝만 밟아 mel-spectrogram을 생성하고 vocoder로 파형을 복원한다.'},
 {h:'Sway Sampling: 뒤쪽 흐름 단계를 더 촘촘히',
  lead:'균등 샘플링 대신 단일 봉우리 분포로 후반 흐름 스텝을 더 자주 밟아 품질과 속도를 함께 얻는다.',
  d:'추론 시 흐름 시간 $t$ 를 균등 분포 대신 logit-normal 형태의 단일 봉우리 분포로 샘플링해, 세부 디테일이 정해지는 후반 구간에 스텝을 더 배분하는 **Sway Sampling**을 제안한다. 학습 방식을 바꾸지 않고 추론 시점의 샘플링 스케줄만 바꾸는 것이라, 기존에 학습된 흐름 매칭 모델에도 재학습 없이 그대로 적용할 수 있다.'},
 {h:'추가 텍스트 인코더·의미 코덱을 쓰지 않는다',
  lead:'별도 텍스트 인코더나 semantically-infused 코덱 없이 파이프라인을 최대한 단순하게 유지한다.',
  d:'DiTTo-TTS처럼 사전학습된 언어모델로 텍스트를 인코딩하거나 코덱에 의미 정보를 주입하는 대신, F5-TTS는 문자 임베딩 + ConvNeXt V2만으로 텍스트-음성 정렬을 in-context로 학습한다. 이 설계 단순성이 논문 제목의 "Fairytaler that Fakes Fluent and Faithful Speech"가 강조하는 지점이다.'}
],

diagram:{type:'compare', cap:'자기회귀 코덱 언어모델 vs 비자기회귀 흐름 매칭. 둘 다 zero-shot TTS를 풀지만 정렬을 다루는 방식이 다르다.',
 left:{t:'VALL-E: 자기회귀', items:['이산 코덱 토큰 순차 생성','AR+NAR 2단계 필요','속도 느림, 반복·탈락 가능']},
 right:{t:'F5-TTS: 비자기회귀', items:['텍스트를 필러로 패딩','흐름 매칭 + ODE solver','Sway Sampling으로 소수 스텝']}
},

math:[
 {expr:'L_CFM = E_{t,x0,x1} [ ||v_θ(x_t, t | z) - (x_1 - x_0)||² ]',
  tex:'\\mathcal{L}_{CFM} = \\mathbb{E}_{t, x_0, x_1}\\big[\\lVert v_\\theta(x_t, t \\mid z) - (x_1-x_0) \\rVert^2\\big]',
  d:'조건부 흐름 매칭 손실. $z$ 는 패딩·정제된 텍스트 조건, $x_0$ 는 노이즈, $x_1$ 은 목표 mel-spectrogram이다.'},
 {expr:'t ~ π(t) ∝ 단일 봉우리 밀도 (Sway Sampling)',
  tex:'t \\sim \\pi(t) \\propto \\text{(단일 봉우리 밀도, Sway Sampling)}',
  d:'추론 시 흐름 시간 샘플링 분포. 균등분포 대신 후반 구간에 밀도를 더 실어 적은 NFE로도 품질을 유지한다.'}
],

numbers:[
 {k:'모델 크기', v:'336M (DiT 22층)', d:'ConvNeXt V2 4층 별도'},
 {k:'학습 데이터', v:'100K시간, 다국어(영어·중국어)', d:'Emilia 등 대규모 코퍼스'},
 {k:'WER · LibriSpeech-PC', v:'2.42% (32 NFE) / 2.53% (16 NFE)', d:'[Whisper](#/p/whisper)-Large V3로 전사해 측정'},
 {k:'SIM-o · LibriSpeech-PC', v:'0.66', d:'화자 유사도, WavLM 기반 임베딩'},
 {k:'RTF', v:'0.15 (16 NFE) ~ 0.31 (32 NFE)', d:'Real-Time Factor, NFE가 적을수록 빠름'},
 {k:'Seed-TTS test-en WER', v:'1.74% (SIM-o 0.75)', d:'CMOS·SMOS 등 사람 평가도 함께 보고'}
],

impact:'F5-TTS는 지속시간 예측기와 음소 정렬이라는, 오랫동안 TTS의 필수 요소로 여겨지던 두 모듈을 없애고도 경쟁력 있는 WER·화자 유사도를 낼 수 있음을 흐름 매칭 기반에서 보여줬다. ConvNeXt V2 전처리와 Sway Sampling이라는 두 가지 단순한 개선만으로 E2 TTS의 견고성·속도 문제를 상당 부분 해결했다는 점에서, "복잡한 모듈을 더하기보다 기존 설계의 병목을 정확히 찾아 최소로 고친다"는 접근의 사례로 인용된다. Sway Sampling은 재학습 없이 적용 가능해 다른 흐름 매칭 기반 생성 모델에도 이식 가능한 일반적 기법으로 받아들여졌다.',

legacy:[
 'duration predictor 없는 비자기회귀 TTS 계열(E2 TTS → F5-TTS)이 [VALL-E](#/p/vall-e) 이후 코덱 자기회귀 TTS와 나란한 주류 설계로 자리잡음',
 'Sway Sampling류 "학습은 그대로, 추론 시 시간 샘플링만 바꾸는" 기법이 다른 흐름 매칭 응용에도 일반화될 수 있는 저비용 개선으로 인용됨',
 'ConvNeXt V2 기반 텍스트 전처리가 이후 유사 구조의 TTS 모델에서 정렬 안정화 기법으로 재사용됨',
 '오픈소스 구현이 널리 쓰이며 다국어·개인화 TTS 파생 프로젝트의 기반 모델 중 하나가 됨'
],

pitfalls:[
 '**"duration predictor가 없다"는 것이 지속시간을 전혀 제어하지 않는다는 뜻은 아니다.** 필러 토큰으로 채우는 총 길이 자체가 암묵적인 지속시간 신호이며, 사용자가 발화 길이를 직접 지정하는 방식으로 여전히 작동한다.',
 '**비교 대상마다 NFE(추론 스텝 수)가 다르면 WER·RTF 수치를 직접 비교할 수 없다.** 논문도 16/32 NFE를 구분해 보고하므로 어느 설정의 수치인지 확인해야 한다.',
 '**Whisper 기반 WER은 인식기 자체의 오차를 포함한다.** SIM-o(화자 유사도)와 WER을 같은 표에서 비교할 때 각 지표의 산출 방식(어떤 인식기·임베딩 모델)을 함께 봐야 한다.'
],

figures:[
 {f:'fig1-inference.png',
  cap:'추론 파이프라인(오른쪽 절반). 노이즈 x0에서 시작해 프롬프트 mel(Audio Prompt Mel)과 텍스트(Href+gen, 필러 토큰 `<F>` 포함)를 조건으로 DiT Block을 N번 통과하며 ODE Solver가 Predicted Flow를 적분해 최종 mel을 만들고 Vocoder가 파형으로 복원한다. Sway Sampled Timestep 박스가 후반 구간에 스텝을 더 배분하는 지점.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'F5-TTS achieves a WER of 2.42 on LibriSpeech-PC... with an RTF of 0.15, which is greatly improved compared to state-of-the-art diffusion-based TTS models.',
  src:'p.2'}
],

links:[
 {t:'arXiv 2410.06885 — F5-TTS', u:'https://arxiv.org/abs/2410.06885'},
 {t:'GitHub — SWivid/F5-TTS', u:'https://github.com/SWivid/F5-TTS'}
]
});
