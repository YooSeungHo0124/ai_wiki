WIKI.paper({
slug:'vall-e',
venue:'arXiv 2023 (Microsoft)',
authors:'Wang, Chen, Wu, Zhang, Zhou, Liu et al. (Microsoft)',
arxiv:'2301.02111',

tldr:'TTS를 mel-spectrogram 회귀 문제가 아니라 **[EnCodec](#/p/encodec) 이산 코드 위의 조건부 언어모델링**으로 다시 정의한 논문. 3초짜리 목소리 샘플을 프롬프트로 주면 그 화자의 억양·감정·녹음 환경까지 그대로 이어서 텍스트를 읽어주는데, 별도의 화자 임베딩 학습이나 미세조정 없이 GPT식 in-context learning만으로 해낸다.',

context:'2023년 초까지 zero-shot TTS의 표준 해법은 화자 적응(speaker adaptation, 소량의 목표 화자 데이터로 미세조정)이나 화자 인코딩(speaker encoding, 별도 인코더로 화자 임베딩을 뽑아 조건으로 넣기)이었다. 두 방법 다 처음 보는 화자에서는 자연스러움과 화자 유사도가 뚝 떨어졌고, 학습 데이터도 수백 시간을 넘기지 못했다(LibriTTS 등 깨끗한 스튜디오 녹음 필요). 반면 텍스트 쪽에서는 [GPT-3](#/p/gpt3)가 파라미터·데이터를 극단적으로 키우기만 해도 few-shot in-context learning이 창발한다는 것을 보였다. VALL-E의 질문은 단순하다 — **음성도 mel-spectrogram 대신 이산 토큰으로 표현하면, 텍스트처럼 "그냥 언어모델을 크게 키우는" 레시피가 통하지 않을까?** [AudioLM](#/p/audiolm)이 오디오 코덱을 언어모델링 대상으로 쓴 선례를 TTS에 그대로 적용해, 60,000시간(LibriLight, 7000명 이상의 화자)이라는 기존 TTS 학습 데이터보다 수백 배 큰 코퍼스로 학습한다.',

ideas:[
 {h:'TTS = 조건부 코덱 언어모델링',
  lead:'mel-spectrogram 회귀 대신 이산 코덱 코드를 다음 토큰 예측으로 생성한다.',
  d:'기존 TTS는 텍스트 → mel-spectrogram(연속값 회귀) → vocoder 파이프라인이었다. VALL-E는 텍스트 → [EnCodec](#/p/encodec) 이산 코드 → EnCodec 디코더로 바꾼다. 목표를 연속 신호 회귀에서 이산 토큰의 다음 토큰 예측으로 바꾸는 순간, [GPT-3](#/p/gpt3)류 언어모델의 스케일링·프롬프팅 레시피를 그대로 가져다 쓸 수 있다.'},
 {h:'3초의 목소리가 곧 in-context 프롬프트다',
  lead:'화자 인코더를 학습하지 않고 프롬프트 코드 자체를 접두어로 이어붙여 화자를 지정한다.',
  d:'화자 임베딩을 별도로 뽑는 인코더가 없다. 대신 3초 분량의 등록 음성을 EnCodec으로 인코딩한 코드 행렬 $\\tilde C$를 생성할 코드 $C$ 앞에 그대로 이어붙여 학습·추론한다. 언어모델은 학습 중 이 접두어를 "같은 화자의 연속"으로 취급하도록 자연히 배우고, 추론 시에는 한 번도 본 적 없는 화자의 3초 녹음도 똑같이 접두어로 넣으면 그 목소리를 이어서 말한다. 화자 정보를 구조가 아니라 **프롬프트로** 준다는 점이 [wav2vec 2.0](#/p/wav2vec2) 이후 자기지도학습이 특징을 데이터에서 뽑아내던 흐름과 이어진다.'},
 {h:'AR + NAR 2단계 — RVQ의 계층 구조를 그대로 따라간다',
  lead:'1번째 코드북은 자기회귀로, 2~8번째 코드북은 비자기회귀 7회 반복으로 생성한다.',
  d:'EnCodec은 residual vector quantization(RVQ) 구조라 8개 codebook이 계층적이다 — 1번째 codebook이 화자 정체성 같은 굵직한 음향 특성을, 뒤로 갈수록 미세한 디테일(잔차)을 담는다. VALL-E는 이 구조에 맞춰 두 모델을 쓴다. 1번째 codebook $c_{:,1}$은 decoder-only **자기회귀(AR)** 모델로 생성한다 — 발화 길이·리듬이 화자마다 다르므로 가변 길이에 자연스러운 AR이 맞다. 2~8번째 codebook은 **비자기회귀(NAR)** 모델이 이전 codebook들을 조건으로 한 번에 채우며, 이 NAR 모델이 총 7번 호출돼 나머지 7개 codebook을 순서대로 채운다. NAR은 병렬 생성이라 AR만 8번 반복하는 것보다 추론이 훨씬 빠르다.'},
 {h:'AudioLM과의 차이 — 의미 토큰 없이 텍스트가 그 역할을 대신한다',
  lead:'AudioLM의 3단 계층(semantic→coarse→fine) 대신 텍스트 음소를 조건으로 곧장 acoustic 토큰만 다룬다.',
  d:'[AudioLM](#/p/audiolm)은 음성-to-음성 생성을 위해 [HuBERT](#/p/hubert) semantic token(무엇을 말할지) → coarse acoustic token → fine acoustic token 3단 계층을 언어모델로 순서대로 생성한다. VALL-E는 **텍스트(음소) 자체가 이미 "무엇을 말할지"를 명시**하므로 semantic token 단계가 필요 없다 — 곧바로 phoneme을 조건으로 EnCodec의 acoustic token만 AR+NAR 2단계로 생성한다. AudioLM이 음성을 음성으로 이어 말하는 speech-to-speech 모델이라면, VALL-E는 텍스트를 음성으로 바꾸는 TTS 모델이라는 것이 저자들이 명시하는 차이다.'},
 {h:'스케일이 곧 일반화다',
  lead:'스튜디오급 600시간 대신 노이즈 섞인 60,000시간을 써서 화자 다양성으로 일반화를 얻는다.',
  d:'기존 TTS 데이터셋(LibriTTS 등)은 사람이 정제한 대본과 깨끗한 녹음이 특징이지만 규모가 수백 시간에 그친다. VALL-E는 원음만 있는 LibriLight 60,000시간에 ASR 모델로 자동 전사를 붙여 쓴다 — 전사는 더 부정확하고 녹음 환경도 제각각이지만, 화자 수(7000명 이상)와 총량이 기존 대비 100배 이상이라 훈련 중 못 본 화자·억양·감정에 대한 일반화가 오히려 좋아진다는 것이 저자들의 핵심 주장이다.'}
],

diagram:{type:'flow', cap:'추론 흐름. 텍스트는 음소로, 3초 프롬프트 음성은 EnCodec으로 각각 이산화된 뒤 하나의 조건으로 언어모델에 들어간다. AR이 1번째 codebook을, NAR이 나머지 7개를 채운 뒤 EnCodec 디코더가 파형을 복원한다.',
 nodes:[
  {t:'텍스트', s:'→ 음소 시퀀스'},
  {t:'3초 프롬프트', s:'→ EnCodec 8코드'},
  {t:'AR 언어모델', s:'1번째 codebook', acc:true},
  {t:'NAR 언어모델', s:'7회 반복 · 2~8번째'},
  {t:'EnCodec 디코더', s:'8코드 → 파형'}
 ]},

math:[
 {expr:'p(c:,1 | x, C̃:,1; θ_AR) = Π_t p(c_{t,1} | c_{<t,1}, c̃:,1, x; θ_AR)',
  tex:'p(\\mathbf{c}_{:,1}\\mid x,\\tilde{\\mathbf{C}}_{:,1};\\theta_{AR})=\\prod_{t=1}^{T} p(c_{t,1}\\mid \\mathbf{c}_{<t,1},\\tilde{\\mathbf{c}}_{:,1},x;\\theta_{AR})',
  d:'1번째 codebook에 대한 자기회귀 언어모델. 음소열 $x$와 프롬프트 코드 $\\tilde c_{:,1}$을 조건으로, 이전에 생성한 코드에 이어 다음 코드를 예측한다. 학습 시 프롬프트와 생성 대상을 구분하는 별도 토큰 없이 하나의 시퀀스로 이어붙인다.'},
 {expr:'p(C:,2:8 | x, C̃; θ_NAR) = Π_{j=2}^{8} p(c:,j | C:,<j, x, C̃; θ_NAR)',
  tex:'p(\\mathbf{C}_{:,2:8}\\mid x,\\tilde{\\mathbf{C}};\\theta_{NAR})=\\prod_{j=2}^{8} p(\\mathbf{c}_{:,j}\\mid \\mathbf{C}_{:,<j},x,\\tilde{\\mathbf{C}};\\theta_{NAR})',
  d:'2~8번째 codebook을 채우는 비자기회귀 모델. 각 단계 $j$는 이전 단계까지의 코드 전부와 전체 프롬프트 $\\tilde C$를 조건으로 한 번에 생성되며, 같은 시점의 다른 토큰끼리는 서로 참조하지 않는 대신 전체 시퀀스를 동시에 attend할 수 있다.'}
],

numbers:[
 {k:'학습 데이터', v:'LibriLight 60,000시간 · 7000+ 화자', d:'기존 TTS 학습 데이터(≤600시간) 대비 수백 배'},
 {k:'프롬프트 길이', v:'3초', d:'추론 시 요구되는 등록 음성의 최소 길이'},
 {k:'EnCodec 설정', v:'24kHz · 75Hz 프레임 · RVQ 8단계 × 1024엔트리', d:'320배 다운샘플, 6K bitrate 설정'},
 {k:'모델 크기', v:'12층 · 16헤드 · d=1024', d:'AR·NAR 각각 decoder-only Transformer'},
 {k:'화자 유사도(SMOS) 개선', v:'+0.93 (LibriSpeech) · +0.11 (VCTK)', d:'YourTTS 대비, 5점 척도 crowdsourcing 평가'},
 {k:'자연스러움(CMOS) vs 실제 음성', v:'+0.04 (VCTK)', d:'ground truth와 통계적으로 유의한 차이 없음'}
],

impact:'VALL-E는 TTS를 "정교한 음향 모델링" 문제에서 "데이터와 파라미터를 키우면 풀리는 언어모델링" 문제로 재정의했다. 화자 인코더·미세조정 없이 프롬프트만으로 목소리를 복제하는 in-context learning이 텍스트뿐 아니라 음성에서도 성립함을 보였고, 이후 VALL-E 2·NaturalSpeech 2·Voicebox 등 코덱-언어모델 기반 TTS 계열 전체의 출발점이 됐다. 동시에 3초 샘플만으로 화자를 복제할 수 있다는 결과는 음성 딥페이크·사칭 위험을 실용적 수준으로 끌어올린 첫 사례이기도 하다.',

legacy:[
 '**코덱-언어모델 TTS 계열의 시작** — VALL-E 2, NaturalSpeech 2/3, Voicebox 등이 "이산 코덱 + 언어모델/확산모델" 골격을 이어받아 발전',
 '**[AudioLM](#/p/audiolm) 레시피의 TTS 특화** — semantic token 단계를 텍스트로 대체할 수 있음을 보여, 이후 멀티모달 오디오 생성에서 "무엇을 생성할지"와 "어떻게 들리게 할지"를 분리하는 설계가 표준화',
 '**AR+NAR 하이브리드의 확산** — 가변 길이가 필요한 부분은 자기회귀로, 병렬화 가능한 부분은 비자기회귀로 나누는 구조가 이후 코덱 기반 음성·음악 생성 모델 다수에서 재사용',
 '**스케일이 화자 일반화를 푼다는 증거** — 소량의 정제된 데이터보다 대량의 노이즈 섞인 데이터가 zero-shot 일반화에 더 유리하다는 사례가 이후 음성 파운데이션 모델 학습 전략에 영향'
],

pitfalls:[
 '**저자들이 직접 명시한 오남용 위험이다.** 논문의 Broader Impacts 절은 화자 신원을 유지한 채 합성할 수 있다는 것이 "음성 인증 스푸핑이나 특정 화자 사칭"으로 이어질 수 있다고 밝히고, 완화책으로 **VALL-E가 생성한 오디오인지 판별하는 탐지 모델을 구축**할 것과 Microsoft AI 원칙 적용을 언급한다. 논문에 학습 코드는 있지만 사전학습된 체크포인트는 공개하지 않은 것도 이 우려와 무관하지 않다.',
 '**LibriLight는 오디오북이라 스타일이 편향돼 있다.** 대부분 낭독체(reading style)라 대화체·감정 표현의 다양성이 부족하고, 억양이 강한 화자(VCTK)에서는 LibriSpeech보다 성능이 떨어진다 — 저자들도 이를 데이터 커버리지 한계로 인정한다.',
 '**AR과 NAR은 별개 모델이다.** 하나의 통합 언어모델이 8개 codebook을 전부 자기회귀로 생성하는 것이 아니라, 1번째만 AR이고 나머지 7개는 완전히 다른 NAR 모델이 별도로 학습·추론한다는 점을 놓치기 쉽다.'
],

figures:[
 {f:'fig1-overview.png',
  cap:'왼쪽 아래 "Text Prompt"가 음소로, "Acoustic Prompt"(3초 녹음)가 EnCodec 인코더로 각각 이산화돼 "Neural Codec Language Modeling" 한 블록에 조건으로 들어간다. 출력된 코드들을 Audio Codec Decoder가 파형으로 복원한다 — 기존 파이프라인의 mel-spectrogram 단계가 통째로 사라진 것이 핵심.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-rvq-codec.png',
  cap:'EnCodec의 residual vector quantization 구조. 왼쪽부터 VQ1~VQ8이 순서대로 이전 단계의 잔차(residual)를 양자화한다 — VQ1이 가장 굵직한 정보(화자 정체성 포함)를, 뒤로 갈수록 미세한 디테일을 담당한다는 것이 VALL-E가 AR·NAR을 나눈 근거다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'We introduce VALL-E, a language model approach for TTS, using audio codec codes as intermediate representations... and enables prompt-based approaches for zero-shot TTS, which does not require additional structure engineering, pre-designed acoustic features, or fine-tuning.',
  src:'Introduction, p.2'},
 {t:'To mitigate such risks, it is possible to build a detection model to discriminate whether an audio clip was synthesized by VALL-E.',
  src:'Broader impacts, p.12'}
],

links:[
 {t:'arXiv 2301.02111 — VALL-E', u:'https://arxiv.org/abs/2301.02111'},
 {t:'공식 데모 페이지', u:'https://aka.ms/valle'}
]
});
