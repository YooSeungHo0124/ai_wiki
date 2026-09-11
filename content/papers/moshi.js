WIKI.paper({
slug:'moshi',
venue:'arXiv 2024 (Kyutai)',
authors:'Défossez, Mazaré, Orsini, Royer et al. (Kyutai)',
arxiv:'2410.00037',

tldr:'STT→LLM→TTS 파이프라인을 없애고, **듣는 동시에 말하는 전이중(full-duplex) 실시간 음성 대화**를 하나의 다중스트림 transformer로 만든 모델. Mimi 코덱으로 음성을 저지연 토큰화하고, 텍스트를 먼저 속으로 예측하는 Inner Monologue로 언어모델의 추론력을 음성 생성에 이식했다.',

context:'2024년까지 음성 대화 시스템의 표준은 음성인식(STT) → 텍스트 LLM → 음성합성(TTS) 파이프라인이었다. 이 구조는 세 단계를 순차로 거치므로 **지연이 누적**돼 실제 대화에서 몇 초씩 걸리고, 텍스트라는 병목을 지나며 억양·감정·겹침 발화 같은 **음성 고유의 정보가 소실**된다. 무엇보다 파이프라인은 화자가 말을 끝낼 때까지 기다렸다 응답하는 반이중(half-duplex) 구조라, 자연스러운 대화의 끼어들기·백채널("음", "어") 같은 겹침 발화를 다루지 못한다. Moshi는 질문을 바꾼다 — **텍스트를 거치지 않고, turn-taking을 명시적으로 모델링하지 않고, 음성을 그냥 언어모델의 토큰으로 다루면서도 실시간으로 듣고 말하게 할 수 있는가?**',

ideas:[
 {h:'다중 스트림 transformer로 전이중을 구현',
  lead:'사용자 오디오와 모델 오디오를 별도 스트림으로 항상 동시에 흘려보내 turn-taking을 없앤다.',
  d:'Moshi는 사용자 오디오 입력 스트림과 자신의 오디오 출력 스트림을 **항상 동시에** 모델에 흘려보낸다. 별도의 turn-taking 모듈이나 침묵 감지 없이, 모델이 매 스텝마다 "무엇을 들었는지"와 "무엇을 말할지"를 동시에 처리하므로 사용자가 말하는 도중에도 자연스럽게 반응하거나 끼어들 수 있다. 이전 유일한 전이중 시도인 dGSLM이 두 화자를 대칭적인 별도 네트워크로 처리한 것과 달리, Moshi는 하나의 모델 안에서 두 스트림을 함께 다룬다.'},
 {h:'Mimi: 의미와 음향을 함께 담는 저지연 코덱',
  lead:'12.5Hz·1.1kbps로 압축하면서 자기지도 의미 정보를 distill해 RVQ에 함께 담는다.',
  d:'Mimi는 24kHz 오디오를 12.5Hz 토큰 스트림, 1.1kbps 비트레이트로 압축하는 causal(스트리밍 가능) 신경 오디오 코덱이다. residual vector quantization(RVQ) 구조에 자기지도 음성 모델의 의미 정보를 distillation으로 주입해, 화자 정체성 같은 음향 정보뿐 아니라 "무엇을 말하는지"에 대한 의미 정보도 같은 토큰 공간에 함께 담는다. 이 설계는 [EnCodec](#/p/encodec)의 RVQ 코덱 구조를 계승하면서 [AudioLM](#/p/audiolm)이 의미/음향 토큰을 별도 모델로 분리했던 것과 다른 지점이다.'},
 {h:'Inner Monologue: 말하기 전에 속으로 텍스트를 예측',
  lead:'음성 토큰을 생성하기 직전에 대응하는 텍스트 토큰을 먼저 예측해 언어모델의 추론력을 빌린다.',
  d:'텍스트 사전학습된 언어모델은 추론·문법 능력이 강하지만 음성 토큰만으로 그 능력을 그대로 유지하기 어렵다. Moshi는 각 오디오 프레임마다 대응하는 텍스트 토큰을 먼저 예측한 뒤 그것을 조건으로 음성(의미+음향) 토큰을 생성하는 **Inner Monologue**를 도입한다. 텍스트가 최종 출력으로 나가지는 않지만 매 스텝의 "생각의 사슬"처럼 작동해, 텍스트 전용으로 학습된 언어 능력을 음성 생성에 이식하는 다리가 된다.'},
 {h:'RQ-Transformer로 시간축과 코드북축을 분리',
  lead:'Temporal transformer가 시간 흐름을, 작은 Depth transformer가 한 프레임 안의 여러 코드북을 처리한다.',
  d:'한 프레임에는 Mimi RVQ의 여러 코드북 레벨이 있는데, 이를 전부 하나의 시퀀스로 펼치면 시퀀스 길이가 폭증한다. Moshi는 Helium(7B) 기반의 큰 Temporal transformer가 프레임 단위 시간 흐름을 처리하고, 작은 Depth transformer가 그 시간적 문맥을 받아 한 프레임 내 여러 코드북(텍스트·의미·음향)을 순서대로 생성하는 RQ-Transformer 구조를 쓴다.'},
 {h:'이론 지연 160ms, 실측 200ms',
  lead:'파이프라인형 시스템의 수 초 지연을 실시간 대화 수준인 200ms대로 줄인다.',
  d:'자연스러운 대화의 평균 반응 지연이 약 230ms로 알려져 있는데, Moshi는 이론적으로 160ms, 실제 환경에서 약 200ms의 지연으로 응답한다. 이는 STT→LLM→TTS 파이프라인이 통상 수 초가 걸리는 것과 대비되며, 다중 스트림 설계와 저지연 Mimi 코덱이 함께 만든 결과다.'}
],

diagram:{type:'stack', cap:'Moshi 한 스텝. Helium이 시간축 문맥을 만들고, Depth Transformer가 그 안에서 텍스트→의미·음향 순으로 한 프레임을 채운다. 사용자 입력과 모델 출력 오디오가 별도 스트림으로 항상 함께 흐른다.',
 layers:[
  {t:'사용자 오디오', s:'Mimi 인코딩'},
  {t:'Helium 시간축', s:'7B 텍스트 LM 기반', acc:true, note:'매 프레임 문맥 갱신'},
  {t:'Depth TF', s:'텍스트→의미→음향', note:'Inner Monologue'},
  {t:'모델 오디오 출력', s:'Mimi 디코딩'}
 ]},

math:[
 {expr:'bitrate = frame_rate × Σ_q log2(codebook_size_q) = 12.5Hz × 1.1kbps 상당',
  tex:'\\text{bitrate} = f_{\\text{frame}} \\times \\sum_{q} \\log_2(|\\mathcal{C}_q|)',
  d:'Mimi의 비트레이트는 프레임레이트(12.5Hz)와 각 RVQ 코드북의 크기 합으로 정해지며, 논문에서 실측치는 약 1.1kbps다.'}
],

numbers:[
 {k:'이론/실측 지연', v:'160ms / 200ms', d:'자연 대화 평균 지연 230ms보다 짧음'},
 {k:'Helium 크기', v:'7B 파라미터 · 2.1T 토큰 사전학습', d:'Moshi의 텍스트 LM 백본'},
 {k:'Mimi 프레임레이트·비트레이트', v:'12.5Hz · 1.1kbps', d:'오디오 in/out은 24kHz'},
 {k:'ASR WER', v:'5.7%', d:'스트리밍 ASR 구성에서 측정'},
 {k:'TTS WER', v:'4.7% (LibriSpeech test-clean)', d:'[VALL-E](#/p/vall-e)의 5.9%보다 낮음, NaturalSpeech 3보다는 높음'},
 {k:'음질 평가', v:'MUSHRA · MOSNet · VisQOL', d:'Mimi 코덱 재구성 품질을 다각도로 측정, 사람 평가(MUSHRA) 포함'}
],

impact:'Moshi는 파이프라인 없이 음성을 언어모델의 1급 시민으로 다루면서도 실시간 전이중 대화가 가능함을 처음으로 증명한 공개 시스템이다. Mimi 코덱은 이후 다른 음성 언어모델의 토크나이저로도 채택되며 "의미+음향을 함께 담는 저지연 코덱"이라는 설계가 하나의 표준 선택지가 되었다. Inner Monologue가 보여준 "텍스트를 매 스텝의 잠재 사고로 재활용"하는 아이디어는 텍스트 사전학습 자산을 음성·멀티모달 생성에 이식하는 방법론으로 이후 연구에 참고가 되었다.',

legacy:[
 '**Mimi 코덱의 확산** — 의미 정보를 distill한 저지연 RVQ 코덱 설계가 이후 음성 언어모델의 표준 구성 요소로 재사용됨',
 '전이중 실시간 대화가 연구 데모를 넘어 공개 코드([kyutai-labs/moshi](https://github.com/kyutai-labs/moshi))로 검증 가능해지며 후속 오픈소스 음성 대화 모델의 기준점이 됨',
 'Inner Monologue류 "텍스트를 먼저 속으로 생성" 설계가 음성 생성에서 텍스트 LLM 능력을 빌려오는 일반적 기법으로 자리잡음',
 '다중 스트림 아키텍처가 겹침 발화·끼어들기 등 대화 역학을 명시적 turn-taking 모듈 없이 다루는 대안적 설계로 인용됨'
],

pitfalls:[
 '**Moshi는 텍스트를 아예 안 쓰는 것이 아니다.** Inner Monologue가 매 프레임 텍스트 토큰을 내부적으로 먼저 예측하며, 다만 그것이 별도 STT/TTS 단계로 분리되지 않고 하나의 모델·하나의 forward pass 안에 통합돼 있을 뿐이다.',
 '**"전이중"은 두 화자가 물리적으로 동시에 말할 수 있다는 뜻이지, 항상 동시에 이해한다는 뜻은 아니다.** 겹침 발화 처리 품질은 데이터·학습 방식에 크게 의존하며 논문도 이를 평가 대상으로 다룬다.',
 '**Mimi의 1.1kbps는 매우 낮은 비트레이트에서 최적화된 수치다.** 비교 대상 코덱들과 비트레이트를 맞추지 않은 채 재구성 품질만 단순 비교하면 오해하기 쉽다.'
],

figures:[
 {f:'fig1-overview.png',
  cap:'가운데 회색 박스가 Helium Temporal Transformer로 매 스텝(step s, s+1) 문맥을 갱신하고, 그 문맥이 위쪽 작은 Depth Transformer로 들어가 텍스트→Semantic & acoustic 순으로 한 프레임을 채운다. 아래 세 줄(사용자 오디오 입력·Moshi 오디오 출력·Inner Monologue)이 항상 함께 흐르는 다중 스트림.',
  src:'원문 Figure 1, p.7'}
],

quotes:[
 {t:'Our resulting model is the first real-time full-duplex spoken large language model, with a theoretical latency of 160ms, 200ms in practice.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2410.00037 — Moshi', u:'https://arxiv.org/abs/2410.00037'},
 {t:'GitHub — kyutai-labs/moshi', u:'https://github.com/kyutai-labs/moshi'}
]
});
