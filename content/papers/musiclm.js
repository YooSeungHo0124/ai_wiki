WIKI.paper({
slug:'musiclm',
venue:'arXiv 2023 (Google Research)',
authors:'Agostinelli, Denk et al. (Google Research)',
arxiv:'2301.11325',

tldr:'"찌그러진 기타 리프를 받쳐주는 차분한 바이올린 선율" 같은 텍스트 설명으로 24kHz 음악을 몇 분 동안 일관되게 생성한 모델. [AudioLM](#/p/audiolm)의 계층적 오디오 토큰 생성에 MuLan이라는 음악-텍스트 공동 임베딩을 조건으로 얹어, **텍스트-음악 쌍 데이터 없이도** 텍스트 조건부 생성을 학습했다.',

context:'텍스트 조건부 이미지 생성(DALL·E 2 등)은 대량의 이미지-텍스트 쌍 덕분에 발전했지만, 음악은 사정이 다르다. 먼저 텍스트-음악 쌍 데이터 자체가 희소하고, 멜로디·리듬·음색·여러 악기의 조합을 몇 단어로 모호함 없이 적는 것 자체가 어렵다. 게다가 오디오는 시간축을 따라 구조를 갖는데, 문장 하나짜리 캡션은 이미지 캡션보다 훨씬 약한 수준의 주석이다. 선행 연구 [AudioLM](#/p/audiolm)은 오디오만으로(텍스트 없이) 의미(semantic) 토큰과 음향(acoustic) 토큰의 계층 구조로 수십 초 분량의 고품질·장기 일관적 오디오를 생성하는 데는 성공했지만, 텍스트로 그 생성을 조종하는 방법은 없었다.',

ideas:[
 {h:'MuLan: 텍스트-음악 쌍 없이 조건을 거는 우회로',
  lead:'음악과 텍스트를 같은 임베딩 공간에 투영하는 MuLan을 이용해, 학습은 오디오만으로 하고 추론에서만 텍스트를 넣는다.',
  d:'MuLan은 오디오 타워(ResNet-50)와 텍스트 타워([BERT](#/p/bert))를 대조학습으로 128차원 공동 공간에 맞춘 모델이다. 학습 때는 각 오디오 클립 자체에서 뽑은 MuLan **오디오** 임베딩을 조건으로 쓰고, 추론 때는 같은 자리에 텍스트 프롬프트의 MuLan **텍스트** 임베딩을 대신 넣는다. 두 임베딩이 같은 공간에 있으므로 모델은 학습 때 텍스트를 한 번도 보지 않고도 텍스트로 조종된다 — 이렇게 텍스트-음악 쌍 데이터의 희소성 문제를 완전히 우회한다.'},
 {h:'세 개의 독립 사전학습 모델을 냉동해서 쌓는다',
  lead:'SoundStream(음향 토큰)·w2v-BERT(의미 토큰)·MuLan(조건 임베딩)을 각각 따로 학습해 고정한 뒤 조합한다.',
  d:'[SoundStream](#/p/soundstream) RVQ가 12단 양자화기로 24kHz 오디오를 초당 600개 acoustic 토큰(6kbps)으로 압축한다. w2v-BERT의 7번째 층 임베딩을 k-means로 양자화해 초당 25개 semantic 토큰을 얻는다. MuLan 오디오 임베딩은 10초 창을 1초 간격으로 슬라이딩해 평균한 뒤 RVQ 12단으로 양자화해 12개 MuLan 토큰을 만든다. 세 모델 모두 [AudioLM](#/p/audiolm) 방식 그대로 독립적으로 사전학습되고 이후 고정된다.'},
 {h:'계층적 2단계 생성: 의미 먼저, 음향은 나중',
  lead:'MuLan 토큰에서 semantic 토큰을 먼저 생성하고, 그 둘을 조건으로 acoustic 토큰을 생성한다.',
  d:'1단계(semantic modeling)는 $p(S_t\\mid S_{<t}, M_A)$ 를 모델링해 MuLan 토큰으로부터 semantic 토큰 $S$ 를 예측한다. 2단계(acoustic modeling)는 $p(A_t\\mid A_{<t}, S, M_A)$ 로, MuLan 토큰과 1단계에서 얻은 semantic 토큰을 모두 조건으로 삼아 acoustic 토큰 $A$ 를 예측한다. [AudioLM](#/p/audiolm)과 마찬가지로 acoustic 단계는 다시 거친(coarse, RVQ 앞 4단)·세밀한(fine, 나머지 8단) 두 하위 단계로 쪼개, 각 단계를 별도의 디코더 전용 Transformer(430M 파라미터)로 자기회귀 모델링한다.'},
 {h:'평가가 본질적으로 주관적이라는 것을 정면으로 다룬다',
  lead:'객관적 지표(FAD·KLD·MuLan Cycle Consistency)와 사람 청취 A/B 테스트를 함께 쓴다.',
  d:'오디오 품질은 참조 없이 계산하는 Fréchet Audio Distance(FAD)로, 텍스트 충실도는 오디오 분류기의 클래스 분포 KL divergence(KLD)와 생성 음악·텍스트의 MuLan 임베딩 코사인 유사도(MuLan Cycle Consistency, MCC)로 잰다. 다만 이 지표들은 대리 지표일 뿐이라 저자들도 최종적으로 사람 평가자에게 두 샘플 중 텍스트에 더 부합하는 쪽을 고르게 하는 A-vs-B 테스트를 병행한다.'}
],

diagram:{type:'stack', cap:'세 개의 독립 사전학습 모델(SoundStream·w2v-BERT·MuLan)을 고정한 뒤, 그 위에 두 단계 자기회귀 생성을 쌓는다.',
 layers:[
  {t:'세 모델 사전학습', s:'각각 독립 학습 후 고정'},
  {t:'조건 토큰', s:'학습=오디오, 추론=텍스트'},
  {t:'의미 모델링', s:'p(S|M_A)', acc:true, note:'장기 구조 담당'},
  {t:'음향 모델링', s:'p(A|S,M_A), 거친→세밀', note:'음질·음색 담당'},
  {t:'디코더', s:'토큰 → 24kHz 파형'}
 ]},

math:[
 {expr:'p(S_t | S_<t, M_A)',
  tex:'p(S_t \\mid S_{<t},\\, M_A)',
  d:'의미(semantic) 모델링 단계. MuLan 오디오 토큰 $M_A$ 를 조건으로 semantic 토큰 시퀀스를 자기회귀적으로 예측한다.'},
 {expr:'p(A_t | A_<t, S, M_A)',
  tex:'p(A_t \\mid A_{<t},\\, S,\\, M_A)',
  d:'음향(acoustic) 모델링 단계. 1단계에서 만든 semantic 토큰 $S$ 와 MuLan 토큰을 모두 조건으로 acoustic 토큰을 예측한다.'}
],

numbers:[
 {k:'FAD_VGG (오디오 품질, 낮을수록 좋음)', v:'MusicLM 4.0 vs Mubert 9.6 · Riffusion 13.4', d:'표 1, MusicCaps 평가셋 기준'},
 {k:'KLD (텍스트 충실도, 낮을수록 좋음)', v:'MusicLM 1.01 vs Mubert 1.58 · Riffusion 1.19', d:'표 1, LEAF 분류기 클래스 분포 비교'},
 {k:'MuLan Cycle Consistency', v:'MusicLM 0.51 vs Mubert 0.32 · Riffusion 0.34', d:'표 1, 생성 음악과 텍스트의 MuLan 코사인 유사도'},
 {k:'사람 평가 승수(Wins)', v:'MusicLM 312 vs Mubert 97 · Riffusion 158', d:'표 1, 쌍대 비교 A/B 테스트 승리 횟수(참조 음악 472)'},
 {k:'사전학습 데이터', v:'500만 클립 · 28만 시간 (24kHz)', d:'토크나이저·자기회귀 모델은 이 오디오만으로 학습, 텍스트 쌍 불필요'},
 {k:'학습 데이터 완전 일치(exact match) 비율', v:'10초 프롬프트에도 0.2% 미만', d:'저작권 관련 암기(memorization) 분석, semantic 단계 기준'}
],

impact:'텍스트-오디오 쌍이 부족한 상황에서 공동 임베딩 모델(MuLan)을 매개로 "학습은 오디오만으로, 조건은 텍스트로"라는 비대칭 학습·추론 패턴을 음악 생성에 정착시켰다. 이 패턴은 이후 텍스트 조건부 오디오 생성 전반의 표준 설계가 되었다. 동시에 저자들은 학습 데이터 암기(창작물 재현) 문제를 LLM 연구의 방법론을 그대로 가져와 정량적으로 점검했는데, 음악 생성 모델의 저작권 논쟁이 본격화되기 전에 이 문제를 스스로 측정하려 한 시도로 남았다.',

legacy:[
 '**[MusicGen](#/p/musicgen)** 이 3단계 계층 구조 대신 단일 단계 언어모델 + 코드북 인터리빙으로 단순화하며 이 논문의 복잡한 파이프라인을 정면으로 대체',
 '**[Stable Audio](#/p/stable-audio)** 는 자기회귀 대신 잠재 확산으로 접근을 바꾸면서도, "텍스트 조건으로 긴 음악을 얼마나 일관되게 생성하는가"라는 동일한 문제의식을 이어받음',
 'MuLan류 음악-텍스트 공동 임베딩이 이후 음악 검색·태깅·추천에도 재사용되는 범용 컴포넌트로 자리잡음',
 '공개된 MusicCaps(5.5k 전문가 작성 캡션)가 이후 음악 생성 모델들의 표준 평가셋으로 채택됨'
],

pitfalls:[
 '**저자 스스로 코드를 공개하지 않았다** — "잠재적 창작물 오남용" 우려 때문에 모델 가중치·추론 코드를 공개하지 않고 예시 페이지만 제공한다. 이후 구현체들은 전부 비공식 재현이다.',
 '**MCC(MuLan Cycle Consistency) 지표는 MuLan 자체에 유리하게 편향돼 있다.** 저자들도 결론에서 "MCC가 MuLan에 의존하므로 우리 방법에 유리한 지표"라고 명시한다 — 이 지표만으로 우월성을 단정하면 안 된다.',
 '**부정(negation)과 시간 순서를 제대로 못 따른다.** "기타 솔로 없이"처럼 부정문이나 "처음에는 조용하다가 나중에 커지는" 같은 정확한 시간 순서 지시는 MuLan이 상속한 한계로 잘 반영되지 않는다.'
],

figures:[
 {f:'fig1-components.png',
  cap:'MusicLM을 구성하는 세 모델이 각각 독립적으로 사전학습된다는 것을 보여준다. 왼쪽 SoundStream은 인코더-RVQ-디코더로 acoustic 토큰(고음질 복원용)을, 가운데 w2v-BERT는 중간층에서 semantic 토큰(장기 구조용)을, 오른쪽 MuLan은 오디오·텍스트 두 타워로 같은 128차원 공간의 임베딩을 만든다 — 세 모델 모두 학습이 끝나면 고정되어 다음 단계의 "부품"으로만 쓰인다.',
  src:'원문 Figure 1, p.4'},
 {f:'fig2-hierarchical.png',
  cap:'학습 시(왼쪽) 실제 오디오에서 MuLan 오디오 토큰·semantic 토큰·acoustic 토큰을 전부 추출해, semantic 모델링(MuLan→semantic)과 acoustic 모델링(semantic+MuLan→acoustic) 두 단계를 지도학습한다. 추론 시에는 이 MuLan 오디오 토큰 자리에 텍스트 프롬프트의 MuLan 텍스트 토큰을 대신 넣는 것이 핵심 트릭이다(원문 그림의 오른쪽 절반, 이 크롭에는 포함하지 않음).',
  src:'원문 Figure 2, p.5'}
],

quotes:[
 {t:'We introduce MusicLM, a model for generating high-fidelity music from text descriptions such as "a calming violin melody backed by a distorted guitar riff".',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2301.11325 — MusicLM: Generating Music From Text', u:'https://arxiv.org/abs/2301.11325'},
 {t:'예시 페이지 (Google Research)', u:'https://google-research.github.io/seanet/musiclm/examples'}
]
});
