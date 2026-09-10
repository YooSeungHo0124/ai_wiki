WIKI.paper({
slug:'las',
venue:'arXiv 2015 (ICASSP 2016)',
authors:'Chan, Jaitly, Le, Vinyals (CMU · Google Brain)',
arxiv:'1508.01211',

tldr:'[CTC](#/p/ctc) 계열이 깔던 "출력끼리 독립"이라는 정렬 가정을 아예 버리고, 음성 인식을 **어텐션 기반 seq2seq** 문제로 통째로 재구성한 논문. 정렬을 몰라도 되는 대신, 한 글자씩 순차 생성해야 해서 스트리밍은 오히려 어려워졌다.',

context:'2015년 종단간 음성 인식은 [CTC](#/p/ctc) 손실을 얹은 RNN이 표준이었지만, CTC는 프레임별 출력이 서로 조건부 독립이라고 가정한다는 근본적 한계가 있었다(→ [RNN-T](#/p/rnn-t)가 같은 문제를 예측 네트워크로 풀었다). 한편 기계번역에서는 [seq2seq](#/p/seq2seq)에 [Bahdanau attention](#/p/bahdanau)을 얹어 정렬을 아예 모델이 배우게 하는 방식이 자리잡고 있었다. 이 논문의 질문은 단순하다 — 음성도 그냥 "오디오를 읽고(Listen) 어디를 볼지 정하고(Attend) 문자를 뱉는(Spell)" seq2seq 문제로 풀면 안 되는가?',

ideas:[
 {h:'Listener: 피라미드 구조로 시간축을 8분의 1로 줄인다',
  lead:'양방향 LSTM을 층마다 2개씩 묶어 쌓아 매 층 시간 해상도를 절반으로 줄인다.',
  d:'오디오 프레임 수 $T$는 문자 수 $U$보다 훨씬 크다(수백 대 수십). 일반 BLSTM 위에 어텐션을 바로 얹으면 얼마 안 되는 학습 데이터로도 수렴이 느리고 과적합이 심하다. 그래서 인접한 두 시점의 출력을 이어붙여 다음 층에 넣는 pyramidal BLSTM(pBLSTM)을 3층 쌓아, 시간 해상도를 $2^3=8$배 줄인다. 어텐션이 훑어야 할 시점 수가 줄어야 실제로 학습이 된다는 것이 저자들의 핵심 관찰이다.'},
 {h:'Speller: 문자 단위 어텐션 디코더',
  lead:'디코더 상태와 인코더 특징을 매칭해 만든 문맥 벡터로 한 글자씩 생성한다.',
  d:'디코더(speller)는 매 스텝 이전 상태 $s_i$와 인코더 출력 $h$ 전체를 content-based attention으로 매칭해 문맥 벡터 $c_i$를 만들고, 이를 바탕으로 다음 문자의 분포를 낸다. [CTC](#/p/ctc)처럼 "이 프레임이 이 글자"라는 하드한 정렬이 아니라, 매 출력 시점마다 입력 전체에 걸친 부드러운 가중치를 다시 계산한다.'},
 {h:'출력끼리 독립 가정을 버린 대가와 이득',
  lead:'이전에 낸 문자에 조건부로 다음 문자를 생성해 언어모델 역할까지 겸한다.',
  d:'CTC는 `Pr(y|x) = Π_t Pr(y_t|x)` 형태로 각 출력이 독립이었지만, LAS는 `Pr(y|x) = Π_i Pr(y_i|x, y_{<i})`로 이전 출력 전체에 조건화한다. 그 결과 같은 발음 "aaa"가 문맥에 따라 "triple a"로도 "aaa"로도 나올 수 있는데, CTC 계열은 이런 동음이철 표기를 원리적으로 다루기 어렵다.'},
 {h:'훈련-추론 불일치를 샘플링으로 메운다',
  lead:'학습 때도 가끔 모델 자신의 예측을 입력해 추론 시 오차 누적에 대비시킨다.',
  d:'학습 중에는 정답 이전 문자를 디코더에 넣어주지만(teacher forcing), 추론 때는 모델이 스스로 낸 문자를 다음 입력으로 써야 해서 한 번 틀리면 오차가 누적된다. 학습 시 10% 확률로 정답 대신 이전 스텝의 모델 예측을 샘플링해 넣어주는 간단한 트릭만으로 clean/noisy WER이 16.2/19.0%에서 14.1/16.5%로 개선됐다.'}
],

diagram:{type:'stack', cap:'Listener(피라미드 BLSTM)가 오디오를 8배 압축한 h로 만들고, Speller가 그 위에서 어텐션으로 문자를 하나씩 생성한다.',
 layers:[
  {t:'오디오 프레임', s:'log-mel, T 프레임'},
  {t:'BLSTM', s:'1층, 압축 없음'},
  {t:'pBLSTM ×3', s:'매 층 시간 1/2', acc:true, note:'← 총 1/8 압축'},
  {t:'인코더 출력 h', s:'U ≈ T/8'},
  {t:'AttendAndSpell', s:'문맥벡터 c_i 생성'},
  {t:'문자 출력', s:'한 글자씩 순차 생성'}
 ]},

math:[
 {expr:'P(y|x) = Π_i P(y_i | x, y_<i)',
  tex:'P(\\mathbf{y}\\mid \\mathbf{x})=\\prod_{i} P(y_i \\mid \\mathbf{x}, y_{<i})',
  d:'CTC의 `Π_t P(y_t|x)`(프레임별 독립)와 대비되는 지점 — LAS는 체인룰로 이전 출력 전체에 조건화해 문자 사이의 의존성을 명시적으로 모델링한다.'}
],

numbers:[
 {k:'Google 음성검색 clean WER (LM 없음)', v:'16.2%', d:'베이스 LAS, beam=32, 표 1'},
 {k:'Google 음성검색 clean WER (LM 없음 + 샘플링)', v:'14.1%', d:'초록에 인용된 수치, 학습-추론 불일치 완화 후'},
 {k:'clean WER + LM 재점수 + 샘플링', v:'10.3%', d:'top-32 빔을 4-gram LM으로 재점수, 초록 인용값'},
 {k:'CLDNN-HMM(당시 SOTA) clean/noisy WER', v:'8.0% / 8.9%', d:'같은 데이터셋에서 하이브리드 시스템과의 격차 — LAS가 아직 못 넘어선 기준선'},
 {k:'noisy WER + LM 재점수 + 샘플링', v:'12.0%', d:'표 1, clean보다 항상 나쁨 — 조건 구분 필수'}
],

impact:'음성 인식을 CTC 계열의 "정렬 없는 프레임 분류"에서 기계번역과 같은 "어텐션 기반 seq2seq"로 옮겨, 이후 음성 연구가 NLP의 seq2seq·어텐션 도구를 그대로 가져다 쓸 수 있게 만들었다. 대신 디코더가 한 글자씩 순차 생성해야 하고 어텐션이 단조롭다는 보장이 없어, CTC/[RNN-T](#/p/rnn-t) 계열이 여전히 유리한 스트리밍 상황과는 정반대의 트레이드오프를 만들었다.',

legacy:[
 '**어텐션 기반 음성 인식의 원형** — 이후 Google의 프로덕션 시스템까지 LAS 계열 attention 디코더가 채택됨',
 '**[Transformer](#/p/transformer)** 등장 이후 Speller의 RNN 디코더 자리가 self-attention 디코더로 대체되며 "어텐션으로 정렬을 배운다"는 아이디어만 계승',
 '스트리밍이 어렵다는 한계 때문에, 실시간 인식 쪽은 여전히 [RNN-T](#/p/rnn-t) 계열이 담당하는 역할 분담이 굳어짐',
 '피라미드 인코더(pBLSTM)의 "시간축을 층마다 접는다"는 아이디어는 이후 여러 음성 인코더의 다운샘플링 설계에 재사용됨'
],

pitfalls:[
 '**초록의 14.1%/10.3%을 "LAS의 기본 성능"으로 잘못 인용하기 쉽다.** 이 수치는 학습-추론 불일치를 메우는 샘플링 트릭을 적용한 이후 값이다. 트릭 없는 베이스 LAS는 clean 16.2%(LM 없음)·12.6%(LM 재점수)로 더 나쁘다.',
 '**clean과 noisy 테스트셋 수치를 섞어 쓰면 안 된다.** 표 1에 clean/noisy 네 가지 조합(LM 유무 × 샘플링 유무)이 모두 있고, 같은 논문 안에서도 조건이 다르면 최대 6%p 이상 차이난다.',
 '**"CTC보다 항상 낫다"는 주장은 아니다.** 이 논문 시점에는 여전히 CLDNN-HMM 하이브리드(8.0%)보다 못했고, 저자들도 이를 명시했다 — LAS의 기여는 정렬 가정을 없앤 새로운 프레이밍이지 당시 최고 성능 경신이 아니다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'맨 아래 회색 영역이 Listener — 3층 pBLSTM이 입력 x1…xT를 h1…hU로 압축한다(짝지어진 화살표가 인접 두 프레임을 다음 층에서 합치는 지점). 위쪽이 Speller — 각 디코더 스텝의 원이 어텐션 컨텍스트 c_i를 계산해 CharacterDistribution으로 다음 문자를 낸다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'The network produces character sequences without making any independence assumptions between the characters. This is the key improvement of LAS over previous end-to-end CTC models.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1508.01211 — Listen, Attend and Spell', u:'https://arxiv.org/abs/1508.01211'}
]
});
