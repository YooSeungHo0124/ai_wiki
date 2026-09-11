WIKI.paper({
slug:'cosyvoice',
venue:'arXiv 2024 (Alibaba)',
authors:'Du, Chen, Yao, Ma, Chen et al. (Alibaba, Tongyi Speech Team)',
arxiv:'2407.05407',

tldr:'자기지도학습 대신 **지도학습된 음성인식 인코더에서 뽑은 의미 토큰**으로 다국어 zero-shot TTS를 만든 논문. LLM이 텍스트→의미 토큰을, 흐름 매칭 모델이 의미 토큰→mel-spectrogram을 각각 맡는 2단 파이프라인으로 화자 유사도와 내용 일치도를 함께 잡는다.',

context:'[VALL-E](#/p/vall-e)·[AudioLM](#/p/audiolm) 이후 zero-shot TTS의 표준은 [EnCodec](#/p/encodec) 같은 **자기지도 신경 코덱**에서 뽑은 음향 토큰을 언어모델로 생성하는 방식이었다. 이런 토큰은 화자·음향 디테일은 잘 담지만, 자기지도 목표(재구성)가 텍스트 내용과 직접 정렬되도록 학습되지 않아 **내용 일치(content consistency)** 가 흔들릴 수 있다. CosyVoice는 반대 방향을 택한다 — 음성인식(ASR)이라는 **지도학습** 과제로 훈련된 인코더에서 토큰을 뽑으면, 그 토큰이 애초에 "무엇을 말하는지"에 정렬되어 있지 않겠냐는 것이다. 이 지도학습 신호를 $S^3$(Supervised Semantic Speech) 토크나이저로 구현하고, 이를 다국어(중국어·영어·광둥어·일본어·한국어) zero-shot TTS에 적용한다.',

ideas:[
 {h:'ASR 인코더에 벡터양자화를 끼워 의미 토큰을 만든다',
  lead:'Conformer 기반 ASR 인코더의 중간층에 VQ를 삽입해 지도학습 신호가 담긴 이산 토큰을 뽑는다.',
  d:'표준 [Conformer](#/p/conformer) 인코더-디코더 구조에서, 인코더의 앞쪽 6개 층을 통과한 은닉표현에 vector quantizer를 끼워 넣고 그 뒤 인코더 층과 ASR 디코더를 이어 학습한다. ASR 손실로 전체를 학습하므로, VQ가 뽑는 이산 코드는 자연히 "텍스트 인식에 필요한 정보"에 정렬된다 — 이것이 $S^3$(Supervised Semantic Speech) 토크나이저다. 코드북 하나(4,096개 코드)만 쓰는 단순한 VQ로도 충분한 의미 정보가 보존됨을 확인했다.'},
 {h:'텍스트-투-토큰 LLM + 토큰-투-음성 흐름 매칭의 2단 구조',
  lead:'자기회귀 LLM이 의미 토큰을 생성하고 [Flow Matching](#/p/flow-matching) 모델이 그 토큰을 mel-spectrogram으로 바꾼다.',
  d:'첫 단계는 텍스트·화자 임베딩(x-vector)·의미 토큰을 하나의 시퀀스로 이어 붙여 자기회귀로 다음 의미 토큰을 예측하는 LLM이다. 두 번째 단계는 그렇게 생성된 의미 토큰과 화자 임베딩, 마스킹된 speech 특징을 조건으로 optimal-transport 조건부 흐름 매칭(OT-CFM)으로 mel-spectrogram을 생성한다. 이 분업 덕분에 "무엇을 말할지"는 LLM이, "어떻게 들릴지"는 흐름 매칭 모델이 맡는다.'},
 {h:'화자 인코더 없이 in-context로 화자를 지정',
  lead:'참조 음성의 x-vector와 speech 토큰을 프롬프트로 이어붙여 화자를 zero-shot으로 재현한다.',
  d:'참조(prompt) 화자의 x-vector 임베딩과 그 화자의 텍스트·의미 토큰을 시퀀스 앞부분에 이어붙이고, 이어서 목표 텍스트의 토큰을 생성하게 한다. 학습 중 별도의 화자 분류 손실 없이도, 이 in-context 구성만으로 처음 보는 화자의 목소리를 재현하는 zero-shot 능력을 얻는다.'},
 {h:'지시문 기반 제어 가능한 생성(CosyVoice-instruct)',
  lead:'화자 정체성·말투·세부 억양을 자연어 지시문으로 조절하도록 후속 미세조정한다.',
  d:'기본 CosyVoice-base를 화자 정체성(캐릭터 설명), 말하는 스타일(감정·성별·속도·피치), 세부 준언어적 표현(웃음·숨소리 등)을 명시하는 텍스트 지시문으로 미세조정한 CosyVoice-instruct를 만든다. 이 미세조정에는 화자 임베딩을 함께 쓰지 않아, 지시문 자체가 화자·스타일 조건을 대체하도록 학습된다.'},
 {h:'대규모 다국어·다방언 데이터로 학습',
  lead:'중국어·영어·광둥어·일본어·한국어 등 17만 시간 규모의 음성 데이터를 지도학습 토크나이저로 통일해 처리한다.',
  d:'중국어 13만 시간, 영어 3만 시간을 중심으로 광둥어·일본어·한국어까지 총 5개 언어·방언의 데이터를 학습에 쓴다. $S^3$ 토크나이저가 언어에 상관없이 같은 방식(ASR 기반)으로 토큰을 뽑기 때문에, 별도의 언어별 특수 처리 없이 하나의 LLM+흐름 매칭 파이프라인으로 다국어를 함께 다룬다.'}
],

diagram:{type:'flow', cap:'CosyVoice 추론 파이프라인. 텍스트가 LLM으로 의미 토큰이 되고, 흐름 매칭 모델이 그 토큰을 화자 조건과 함께 mel로 바꾼다.',
 nodes:[
  {t:'텍스트+x-vector', s:'프롬프트로 결합'},
  {t:'Text-to-token', s:'LM · 자기회귀', acc:true},
  {t:'의미 토큰', s:'S³ 토크나이저 코드'},
  {t:'흐름 매칭 모델', s:'OT-CFM'},
  {t:'Mel → 파형', s:'vocoder'}
 ]},

math:[
 {expr:'L_LM = -(1/(L+1)) Σ_{l=1}^{L+1} log q(μ_l)',
  tex:'\\mathcal{L}_{LM} = -\\frac{1}{L+1}\\sum_{l=1}^{L+1}\\log q(\\mu_l)',
  d:'텍스트-투-토큰 LLM의 학습 손실. $\\mu_l$ 은 $S^3$ 토크나이저가 뽑은 의미 토큰이고, teacher-forcing으로 다음 토큰의 posterior를 최대화한다.'},
 {expr:'P(Y|X) = ASRDecoder(H̃, Y^{Z-1})',
  tex:'P(Y\\mid X) = \\text{ASRDecoder}\\big(\\tilde H,\\, Y^{Z-1}\\big)',
  d:'$S^3$ 토크나이저를 학습시키는 보조 ASR 목표. $\\tilde H$ 는 VQ를 통과한 은닉표현, $Y^{Z-1}$ 은 한 칸 밀린 정답 텍스트 레이블이다.'}
],

numbers:[
 {k:'학습 데이터', v:'약 17만 시간 (5개 언어)', d:'중국어 13만 · 영어 3만 · 광둥어 0.5만 · 일본어 0.46만 · 한국어 0.22만 시간'},
 {k:'S³ 토크나이저 코드북', v:'4,096 코드 (단일 codebook)', d:'6개 인코더 층 뒤에 VQ 삽입'},
 {k:'의미 보존 WER (VQ 삽입 후)', v:'test-clean 3.18% · test-other 7.56%', d:'Librispeech, VQ 삽입이 ASR 성능을 크게 해치지 않음을 확인'},
 {k:'다국어 CER/WER (Common Voice)', v:'zh-CN 12.24% · en 15.43%', d:'S³ 토큰만으로 인식했을 때(w/o lid) 수치'},
 {k:'평가 지표', v:'WER/CER · 화자유사도(SS) · CMOS/SMOS', d:'내용 일치도는 ASR 재인식, 화자유사도는 임베딩 코사인 유사도로 측정'},
 {k:'감정 제어 정확도', v:'instruct 버전이 base 대비 향상', d:'CosyVoice-instruct-300M vs base-300M 비교'}
],

impact:'CosyVoice는 "의미 토큰은 반드시 자기지도학습으로 뽑아야 한다"는 당시의 암묵적 전제에 반례를 제시했다. ASR이라는 지도학습 신호가 코덱보다 텍스트-음성 정렬을 더 직접적으로 보장한다는 것을 다국어·대규모 데이터에서 실증하면서, 이후 zero-shot TTS 설계에서 토크나이저를 자기지도/지도학습 중 무엇으로 만들지가 하나의 설계 축으로 명시적으로 논의되기 시작했다. 지시문 기반 제어(CosyVoice-instruct)는 화자 임베딩 없이 자연어만으로 스타일을 지정하는 인터페이스를 상용 TTS 제품에 앞서 학술적으로 검증한 사례로도 인용된다.',

legacy:[
 '지도학습 기반 의미 토큰이라는 설계가 후속 다국어 TTS·음성 언어모델의 토크나이저 선택지로 자리잡음',
 '텍스트-투-토큰 LLM + 토큰-투-음성 흐름 매칭이라는 2단 분업 구조가 [f5-tts](#/p/f5-tts) 이후 흐름 매칭 기반 TTS들과 함께 비교되는 표준 파이프라인 중 하나가 됨',
 'CosyVoice2 등 후속 버전에서 스트리밍·저지연 추론으로 확장되며 실시간 다국어 TTS 제품에 적용됨',
 '생성된 음성을 다시 데이터 증강에 쓰는(as a data generator) 실험이 합성 데이터의 ASR 학습 활용 가능성을 보여줌'
],

pitfalls:[
 '**"Supervised"는 화자 지도학습이 아니라 ASR(음성인식) 지도학습을 뜻한다.** 토크나이저가 화자 정체성을 지도학습으로 분류하도록 훈련된 것이 아니라, 텍스트 인식 목표로 훈련된 인코더에서 토큰을 뽑는다는 뜻이다.',
 '**화자유사도(SS) 수치는 논문마다 사용하는 화자 임베딩 모델이 다르면 직접 비교할 수 없다.** CosyVoice는 자체 사전학습 화자 인식 모델(3D-Speaker)을 쓴다.',
 '**같은 표 안에서도 w/ lid(언어 식별자 제공)와 w/o lid 수치가 다르다.** 어느 조건의 WER/CER인지 확인하지 않고 인용하면 값이 어긋난다.'
],

figures:[
 {f:'fig1-tokenizer-lm.png',
  cap:'왼쪽 (a)가 S³ 지도학습 토크나이저 — Speech Tokenizer(Encoder1+Vector Quantizer) 뒤에 점선으로 표시된 Encoder2·ASR Decoder는 학습 때만 붙는다. 오른쪽 (b)가 CosyVoice LM — x-Vec(화자), Text(S로 시작), Speech Tokenizer 출력이 한 시퀀스로 이어져 Text-to-token LM에 들어간다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'we propose CosyVoice... a scalable multilingual zero-shot text-to-speech synthesizer based on supervised semantic tokens.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2407.05407 — CosyVoice', u:'https://arxiv.org/abs/2407.05407'},
 {t:'GitHub — FunAudioLLM/CosyVoice', u:'https://github.com/FunAudioLLM/CosyVoice'}
]
});
