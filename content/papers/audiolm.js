WIKI.paper({
slug:'audiolm',
venue:'IEEE/ACM TASLP 2023 (arXiv 2022)',
authors:'Borsos et al. (Google Research)',
arxiv:'2209.03143',

tldr:'텍스트 없이 오디오만으로 오디오를 이어 쓴다 — [SoundStream](#/p/soundstream) 코덱 토큰과 [HuBERT](#/p/hubert)류 자기지도 표현에서 뽑은 토큰을 계층적으로 자기회귀 예측해, 4초 프롬프트만 듣고 화자·운율을 유지하며 문법적으로 그럴듯한 발화를 이어가는 오디오 생성을 순수 언어모델링 문제로 재정의했다.',

context:'[SoundStream](#/p/soundstream)·[EnCodec](#/p/encodec)이 오디오를 RVQ로 이산 토큰화하면서, 텍스트에 쓰던 [GPT](#/p/gpt2)류 자기회귀 언어모델을 오디오 토큰 시퀀스에 그대로 적용하는 길이 열렸다. 그런데 순진하게 RVQ 토큰만 예측하면 문제가 생긴다 — RVQ 토큰은 짧은 구간의 음향 디테일(음색·잡음)은 잘 담지만 초 단위를 넘는 **언어적·구조적 장기 일관성**은 잘 담지 못한다. 반대로 [wav2vec 2.0](#/p/wav2vec2)·[HuBERT](#/p/hubert) 같은 자기지도 음성 표현은 음소·의미 정보는 잘 담지만 화자 음색 등 음향 디테일은 버린다. AudioLM의 질문은 **이 두 토큰을 계층으로 나눠 순서대로 예측하면 둘 다 얻을 수 있지 않을까**였다.',

ideas:[
 {h:'Semantic token: 장기 구조를 위한 골격',
  lead:'w2v-BERT 중간층 표현을 k-means로 군집화해 문법·의미 흐름을 담는 토큰을 만든다.',
  d:'자기지도 학습된 w2v-BERT의 특정 중간층 임베딩을 k-means로 군집화해 그 중심 인덱스를 semantic token으로 쓴다. 이 토큰은 음향 디테일을 버리는 대신 음소 판별력(ABX 오류율)이 높아, 긴 시퀀스에 걸친 문법적·의미적 일관성을 예측하기에 적합하다. 반면 이 토큰만으로 오디오를 재합성하면 화자·억양이 사라진 "옹알이" 같은 소리가 난다.'},
 {h:'Acoustic token: 음질과 화자 정체성을 위한 디테일',
  lead:'SoundStream RVQ 코드로 화자 음색·녹음 환경 같은 음향 디테일을 복원 가능하게 담는다.',
  d:'[SoundStream](#/p/soundstream)으로 만든 RVQ 토큰은 semantic token과 반대 성질을 가진다 — 원음을 거의 그대로 복원할 만큼 음향 디테일을 잘 보존하지만, 그 시퀀스만 자기회귀로 모델링하면 4초 이상에서 화자·환경은 유지돼도 말의 내용이 뒤죽박죽이 된다(의미 일관성이 약함). 두 토큰이 서로의 약점을 정확히 메운다는 것이 이 논문의 핵심 관찰이다.'},
 {h:'3단계 계층적 자기회귀: semantic → coarse acoustic → fine acoustic',
  lead:'semantic 토큰을 먼저 전부 예측한 뒤, 이를 조건으로 RVQ의 앞쪽·뒤쪽 코드북을 순서대로 예측한다.',
  d:'1단계는 semantic 토큰 시퀀스 $z_{1:T_S}$ 를 자기회귀로 예측해 장기 구조를 정한다. 2단계는 이 semantic 토큰을 조건으로 RVQ의 앞쪽 $Q\'$ 개 coarse 코드북(화자·환경 같은 굵직한 음향 정보)을 예측한다. 3단계는 coarse 토큰을 조건으로 나머지 fine 코드북(세부 음질)을 예측한다. 각 단계가 서로 다른 시간 스케일과 정보량을 담당하도록 나눈 것이, 하나의 Transformer로 전체 오디오를 통짜로 예측하는 것보다 훨씬 다루기 쉬운 문제로 만든다.'},
 {h:'RVQ 코드의 계층 구조를 행 우선(row-major) 평탄화로 다룬다',
  lead:'각 시간 스텝의 여러 코드북 토큰을 한 줄로 펼쳐 표준 자기회귀 Transformer 입력으로 만든다.',
  d:'RVQ는 한 시간 스텝마다 $Q$ 개의 토큰(코드북마다 하나)을 내놓는다. AudioLM은 이를 $y_{11},y_{12},\\dots,y_{1Q},y_{21},\\dots$ 식으로 시간·코드북 순서로 한 줄로 펼쳐 표준 디코더 전용 Transformer가 다음 토큰 하나를 예측하는 익숙한 문제로 바꾼다. coarse/fine 단계 구분도 이 평탄화된 시퀀스 안에서 조건부 확률의 범위를 나누는 방식으로 구현된다.'}
],

diagram:{type:'loop', cap:'세 단계가 순서대로 실행되며 각 단계 출력이 다음 단계의 조건이 된다. 마지막 SoundStream 디코더가 fine acoustic token을 파형으로 복원한다.',
 center:'단계별 조건화',
 nodes:[
  {t:'Semantic 예측', s:'w2v-BERT 토큰'},
  {t:'Coarse 음향토큰', s:'RVQ 앞단', acc:true},
  {t:'Fine Acoustic', s:'RVQ 뒷단'},
  {t:'SoundStream 복원', s:'토큰→파형'}
 ]},

math:[
 {expr:'p(z_1..T_S) = Π p(z_t | z_<t)  — semantic 단계',
  tex:'p(z_{1:T_S})=\\prod_{t=1}^{T_S} p(z_t \\mid z_{<t})',
  d:'1단계: semantic 토큰의 순수 자기회귀 언어모델. 이 확률만으로 장기 문법·의미 구조가 결정된다.'},
 {expr:'p(y_tq | z, y_{<t}^{<=Q\'}, y_t^{<q})  q<=Q\' (coarse),  q>Q\' (fine)',
  tex:'p\\big(y_{t}^{q}\\mid z,\\;y_{<t}^{\\le Q\'},\\;y_{t}^{<q}\\big),\\quad q\\le Q\'',
  d:'2단계(coarse acoustic)의 조건부 확률. semantic 토큰 $z$ 전체와 이전에 예측한 coarse 토큰들을 조건으로 다음 coarse 토큰을 예측한다. 3단계(fine)는 여기에 coarse 토큰 전체를 추가 조건으로 더한 동일한 형태다.'}
],

numbers:[
 {k:'학습 데이터', v:'Libri-Light 6만 시간', d:'영어 음성, 비지도(텍스트 라벨 없음)'},
 {k:'프롬프트 길이', v:'4초', d:'이 정도만 들려줘도 화자·운율을 유지한 채 이어 말함'},
 {k:'SoundStream 다운샘플', v:'320배(16kHz)', d:'16000/50 = 320, 초당 50 프레임'},
 {k:'acoustic 토큰 비트레이트', v:'2000~6000 bps', d:'RVQ 코드북 수에 따라 조절'},
 {k:'화자 판별 분류기 정확도', v:'거의 100%(실제) vs 생성 3.2%보다 높음', d:'같은 semantic 토큰에서도 생성마다 다른 화자가 나옴을 확인'},
 {k:'생성 음성 판별기 정확도', v:'98.6%', d:'사람 귀로는 구분 힘든 연속체도 별도 분류기로는 높은 정확도로 탐지됨'}
],

impact:'AudioLM은 텍스트 조건이나 별도의 mel spectrogram 예측 없이, 순수하게 "다음 오디오 토큰을 맞히는" 언어모델링만으로 화자·운율을 보존한 채 그럴듯한 음성을 이어 쓸 수 있음을 보였다. 음성뿐 아니라 피아노 연주 이어쓰기에도 같은 프레임이 통한다는 것도 확인해, 이 계층적 토큰 예측이 도메인에 얽매이지 않는 일반적인 오디오 생성 레시피임을 시사했다. semantic-acoustic 이중 토큰이라는 발상은 텍스트 조건을 다시 더한 [VALL-E](#/p/vall-e)로 곧장 이어진다.',

legacy:[
 '**semantic+acoustic 이중 토큰 구조가 이후 오디오 생성 모델의 표준 설계가 됨** — 장기 구조와 음향 디테일을 분리해 모델링하는 접근이 음악·범용 오디오 생성으로 확산',
 '**텍스트 조건을 더하면 [VALL-E](#/p/vall-e)의 제로샷 TTS가 됨** — semantic 토큰 자리에 텍스트(음소)를, acoustic 토큰 예측 구조는 거의 그대로 물려받아 "3초로 화자 복제"를 구현',
 '**[HuBERT](#/p/hubert) 등 자기지도 표현이 생성 모델의 조건 신호로 재사용되는 흐름을 열음** — 원래 인식(ASR)을 위해 설계된 표현이 생성 파이프라인의 골격으로 쓰이는 사례',
 '**RVQ 코드의 계층 구조(coarse/fine)를 명시적으로 활용하는 다단계 예측이 이후 코덱 기반 생성 모델의 공통 패턴이 됨**'
],

pitfalls:[
 '**텍스트가 전혀 관여하지 않는다.** AudioLM은 무조건부(또는 오디오 프롬프트 조건부) 음성/음악 연속 생성 모델이며, 이 논문 자체는 TTS가 아니다 — 텍스트로 원하는 말을 지정할 수 없다.',
 '**semantic 토큰만으로 생성하면 내용이 옹알이 수준이 된다.** 반대로 acoustic 토큰만으로 생성하면 화자·환경은 유지돼도 4초 이상에서 말의 내용이 무너진다 — 저자들이 ablation으로 명시적으로 보여주는 실패 모드이며, 두 토큰을 함께 써야 하는 이유다.',
 '**생성물이 사람 귀로는 실제 화자와 구분하기 어렵지만, 분류기로는 98.6% 정확도로 탐지된다.** "구분 불가능"이라는 인상과 별개로, 이 논문 스스로 오용 가능성과 탐지기의 필요성을 broader impact 절에서 명시한다.'
],

figures:[
 {f:'fig2-hierarchy.png',
  cap:'3단계 계층 구조. 1단계 semantic 토큰이 장기 구조를 정하고, 2단계가 이를 조건으로 RVQ 앞단(coarse) 토큰을, 3단계가 앞단을 조건으로 RVQ 뒷단(fine) 토큰을 예측한다. 마지막에 SoundStream 디코더가 fine 토큰까지 모두 모아 파형을 복원한다.',
  src:'원문 Fig. 2, p.5'}
],

quotes:[
 {t:'When trained on speech, and without any transcript or annotation, AudioLM generates syntactically and semantically plausible speech continuations while also maintaining speaker identity and prosody for unseen speakers.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2209.03143 — AudioLM: a Language Modeling Approach to Audio Generation', u:'https://arxiv.org/abs/2209.03143'}
]
});
