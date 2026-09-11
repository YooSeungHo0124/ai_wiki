WIKI.paper({
slug:'musicgen',
venue:'NeurIPS 2023 (Meta AI)',
authors:'Copet, Kreuk, Gat, Remez, Kant, Synnaeve, Adi & Défossez (Meta AI)',
arxiv:'2306.05284',

tldr:'[MusicLM](#/p/musiclm)처럼 여러 모델을 계층적으로 쌓는 대신, **단일 언어모델 하나**로 [EnCodec](#/p/encodec) 코드북 여러 개를 동시에 모델링하는 텍스트-음악 생성기. 코드북 사이 시간차를 두는 "지연(delay) 패턴"으로 병렬 코드북 예측을 근사적으로 자기회귀화한 것이 핵심이다.',

context:'[MusicLM](#/p/musiclm)은 semantic 토큰과 acoustic 토큰을 각각 별도 Transformer로, 그것도 acoustic 단계는 다시 거친·세밀한 두 하위 단계로 나눠 총 여러 단계를 순서대로 캐스케이딩한다. 문제는 [EnCodec](#/p/encodec)·[SoundStream](#/p/soundstream) 같은 잔차 벡터 양자화(RVQ) 코덱이 한 시점마다 $K$개의 코드북(보통 4개)을 동시에 내놓는다는 점이다 — 이 $K$개를 그대로 한 줄로 펼치면(flatten) 시퀀스가 $K$배로 길어지고, 단순히 $K$개를 매 시점 병렬로 예측하면 코드북끼리의 의존관계(뒤 코드북은 앞 코드북이 남긴 양자화 오차를 보정하는 구조)를 무시하게 된다. MusicGen은 "여러 모델을 캐스케이딩하지 않고, 이 코드북 간 의존성 문제를 단일 모델 안에서 어떻게 풀 것인가"를 묻는다.',

ideas:[
 {h:'코드북 인터리빙 패턴이라는 일반적 틀',
  lead:'시간-코드북 좌표 집합을 어떤 순서로 예측할지 정의하는 패턴 $P$ 로 기존 방식들을 통합한다.',
  d:'시간·코드북 인덱스의 전체 집합 $\\Omega$ 를 부분집합들의 순서열 $P=(P_0,P_1,\\dots,P_S)$ 로 분할하고, 각 $P_s$ 의 위치들을 이전 $P_0,\\dots,P_{s-1}$ 에 조건부로 동시에 예측한다. 이 하나의 틀로 (1) 전부 펼치는 flattening, (2) $K$개를 완전히 동시에 예측하는 parallel, (3) 코드북 1을 다 예측한 뒤 나머지를 예측하는 coarse-first, (4) 코드북마다 한 스텝씩 어긋나게 예측하는 delay까지 전부 표현할 수 있다.'},
 {h:'지연(delay) 패턴: MusicGen이 실제로 쓰는 선택',
  lead:'코드북 $k$의 예측을 $k-1$스텝만큼 늦춰서, 뒤 코드북이 앞 코드북의 같은 시점 결과를 보게 한다.',
  d:'$P_s=\\{(s-k+1,k): k=1..K,\\, s-k\\ge 0\\}$ 로 정의되는 패턴이다. 코드북 1은 그대로, 코드북 2는 한 스텝 늦게, 코드북 3은 두 스텝 늦게 예측되는 식이라, 코드북 $k$를 예측할 때 이미 생성된 코드북 $1,\\dots,k-1$의 **같은 시간 스텝** 값을 조건으로 쓸 수 있다. Parallel 패턴처럼 시퀀스 길이는 원래 프레임 수 그대로 유지하면서도, RVQ 코드북 사이의 위계적 의존성을 근사적으로 반영한다.'},
 {h:'정확한 분해 vs 부정확한 분해',
  lead:'flattening은 정확한 결합확률 분해지만 느리고, parallel/delay는 근사라서 빠르지만 오차가 누적될 수 있다.',
  d:'모든 코드북을 순서대로 하나씩 예측하는 flattening만이 진짜 결합확률 $P(V)$ 를 정확히 분해한다. 시간 스텝을 유지한 채 코드북을 동시에 예측하는 parallel·delay류는, 같은 시점의 코드북들이 조건부 독립이라는 근사를 깔고 들어가 엄밀하게는 틀린 분해다. 다만 이 근사 덕분에 시퀀스 길이가 $K$배로 늘지 않아 긴 시퀀스에서 학습·추론이 훨씬 빠르다.'},
 {h:'같은 모델로 텍스트 조건과 멜로디 조건을 함께',
  lead:'입력 오디오의 크로마그램(화성 정보)을 조건으로 얹어 텍스트 설명대로 편곡하면서 원래 멜로디를 유지한다.',
  d:'T5 텍스트 인코더로 캡션을 조건화하는 것 외에, 입력 참조 오디오의 크로마그램(각 시점의 음높이 클래스 분포)을 양자화해 함께 조건으로 준다. 원본 크로마그램을 그대로 쓰면 모델이 원본을 그대로 재구성해버리는 문제가 있어, 정보량을 줄인(argmax로 양자화한) 형태로만 제공한다.'}
],

diagram:{type:'compare', cap:'MusicLM류의 다단계 캐스케이드 대 MusicGen의 단일 단계 + 코드북 인터리빙.',
 left:{t:'MusicLM 방식', items:['semantic·coarse·fine 3단계','단계마다 별도 Transformer','MuLan 임베딩으로 텍스트 우회 조건']},
 right:{t:'MusicGen 방식', items:['단일 Transformer LM 하나','코드북을 지연 패턴으로 인터리빙','텍스트+멜로디 동시 조건 가능']}
},

math:[
 {expr:'P_s = { (s-k+1, k) : k = 1..K, s-k ≥ 0 }',
  tex:'P_s=\\{(s-k+1,k)\\ :\\ k\\in\\{1,\\dots,K\\},\\ s-k\\ge 0\\}',
  d:'지연 패턴의 정의. 코드북 $k$의 시간 스텝 예측을 $k-1$만큼 지연시켜, 같은 시퀀스 스텝 $s$에서 서로 다른 시간의 코드북들을 동시에 배치한다.'},
 {expr:'P[Ṽ_t,k] = p_t,k( Ṽ_{t-1}, …, Ṽ_0 )',
  tex:'\\forall t>0,\\forall k,\\quad P\\!\\left[\\tilde V_{t,k}\\right]=p_{t,k}\\!\\left(\\tilde V_{t-1},\\dots,\\tilde V_0\\right)',
  d:'같은 시점의 코드북들이 조건부 독립이라고 근사하는 비정확(inexact) 분해. $t$가 커질수록 참 분포와의 오차가 누적될 수 있음을 논문이 명시한다.'}
],

numbers:[
 {k:'FAD_VGG (300M, 멜로디 조건 없음)', v:'3.1', d:'표 — MusicCaps 테스트셋, [MusicLM](#/p/musiclm)(4.0)보다 낮음(좋음), Noise2Music(2.1)보다는 높음'},
 {k:'사람 평가 종합 점수', v:'MusicGen 84.8 vs 최고 베이스라인 80.5', d:'100점 만점 주관 평가(OVL·REL 종합), 논문 서두에 명시된 대표 수치'},
 {k:'모델 크기별 OVL(전반적 품질)', v:'300M 78.4 → 1.5B 80.7 → 3.3B 84.8', d:'표, 사람 평가 기준 모델이 커질수록 품질이 꾸준히 상승'},
 {k:'EnCodec 설정', v:'32kHz 모노, 50Hz 프레임, 코드북 4개(각 2048)', d:'RVQ 스트라이드 640, 30초 오디오 = 1500 자기회귀 스텝'},
 {k:'학습 데이터', v:'라이선스 음악, 메타데이터(텍스트+장르 등) 포함', d:'30초 랜덤 크롭으로 학습, 528곡 별도 held-out 평가셋(아티스트 겹침 없음)'}
],

impact:'단일 언어모델 + 코드북 인터리빙이라는 단순한 구조로 MusicLM급 이상의 품질을 내면서, 텍스트 음악 생성의 구현·학습 복잡도를 크게 낮췄다. 코드북 인터리빙 패턴이라는 일반적 틀은 이후 오디오뿐 아니라 RVQ 기반 토큰을 다루는 다른 생성 모델에도 참조점이 되었다. 오픈소스로 코드와 가중치를 공개(`audiocraft`)한 것도 후속 연구가 빠르게 늘어난 이유 중 하나다.',

legacy:[
 '**[Stable Audio](#/p/stable-audio)** 는 자기회귀 코드북 예측 자체를 버리고 잠재 확산으로 전환하면서, MusicGen이 남긴 "긴 시퀀스를 어떻게 빠르게 생성할까"라는 질문에 다른 답을 냄',
 '`audiocraft` 오픈소스 공개로 다양한 파생 연구·응용(개인화, 파인튜닝)이 활발해짐',
 '코드북 인터리빙 패턴이라는 개념이 다른 RVQ 기반 오디오·음성 생성 모델의 설계 어휘로 정착',
 '단일 단계 언어모델이 계층적 캐스케이드와 대등하거나 더 나은 품질을 낼 수 있다는 결과가, 오디오 생성 전반에서 "단순한 구조 먼저 시도"하는 흐름에 힘을 실음'
],

pitfalls:[
 '**"단일 단계"가 "코드북 1개"라는 뜻이 아니다.** 여전히 $K=4$개의 병렬 코드북을 다루지만, 그것들을 하나의 Transformer가 지연 패턴으로 동시에 처리한다는 뜻이다 — 계층적으로 분리된 별도 모델이 없다는 것이 핵심.',
 '**지연 패턴은 근사다.** 논문이 스스로 명시하듯, parallel·delay류 패턴은 결합확률의 정확한 분해가 아니라 조건부 독립을 가정한 근사이며 시간이 지날수록 오차가 누적될 수 있다. flattening만 정확하지만 느리다.',
 '**FAD·KL·CLAP 점수만으로 MusicLM보다 우월하다고 단정하기 어렵다.** 표의 각 지표는 평가 환경(모델 버전, 재구현 여부)이 달라질 수 있어, 논문도 사람 평가(OVL/REL)를 함께 제시해 종합 판단을 유도한다.'
],

figures:[
 {f:'fig1-interleaving.png',
  cap:'4개 코드북($k_1$~$k_4$)을 시퀀스 스텝에 배치하는 네 가지 방식. 왼쪽 위 Flattening은 코드북을 전부 순서대로 풀어써 스텝 수가 4배로 늘어난다(주황 $t_1,t_2$가 각각 4칸에 걸쳐 나타남). 오른쪽 위 Parallel은 모든 코드북을 같은 스텝에 동시에 배치한다. 오른쪽 아래 Delay(MusicGen이 실제로 쓰는 패턴)는 코드북마다 한 스텝씩 밀려 있어, 대각선으로 색이 어긋난 것이 보인다 — 이 어긋남이 코드북 간 의존성을 살리면서도 스텝 수는 늘리지 않는 절충이다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'Unlike prior work, MusicGen is comprised of a single-stage transformer LM together with efficient token interleaving patterns, which eliminates the need for cascading several models.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2306.05284 — Simple and Controllable Music Generation', u:'https://arxiv.org/abs/2306.05284'},
 {t:'audiocraft (GitHub)', u:'https://github.com/facebookresearch/audiocraft'}
]
});
