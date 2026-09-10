WIKI.paper({
slug:'qanet',
venue:'ICLR 2018',
authors:'Yu, Dohan, Luong, Zhao, Chen, Norouzi, Le (CMU · Google Brain)',
arxiv:'1804.09541',

tldr:'독해(reading comprehension)를 순환 구조 없이 **합성곱 + self-attention**만으로 푼 모델. [SQuAD](#/p/squad)에서 RNN 기반 모델과 동등한 정확도를 내면서 학습은 최대 13배, 추론은 최대 9배 빨랐고, 그 속도로 확보한 여유를 역번역(back-translation) 데이터 증강에 써서 당시 최고 F1을 갱신했다.',

context:'2018년 초 [SQuAD](#/p/squad) 리더보드는 BiDAF 계열처럼 양방향 attention 위에 RNN(LSTM/GRU) 인코더를 얹은 구조가 지배적이었다. 문제는 [Transformer](#/p/transformer)가 기계번역에서 이미 보여준 것과 같은 병목 — RNN은 시퀀스 길이만큼 순차 계산을 해야 해서 학습과 추론 모두 느리다는 것이다. 독해 과제는 문서가 길어서(SQuAD 맥락문이 수백 토큰) 이 순차성 비용이 특히 컸다. QANet은 이 병목을 없애 학습을 빠르게 만든 다음, 그렇게 절약한 시간을 **데이터를 늘리는 데** 재투자한다는 이차적인 아이디어까지 함께 담았다.',

ideas:[
 {h:'국소 패턴은 합성곱, 전역 관계는 self-attention',
  lead:'CNN이 인접 단어 패턴을, self-attention이 문장 전체의 장거리 의존을 각각 맡는다.',
  d:'저자들은 두 연산의 역할을 분업시켰다 — 합성곱은 좁은 윈도우 안의 국소 구조(구, 관용구)를 잡는 데 강하고, self-attention은 멀리 떨어진 단어 사이의 관계를 한 홉에 연결하는 데 강하다. 이 둘을 같은 인코더 블록 안에 순서대로 쌓은 조합이 처음이며, self-attention만 쓴 것보다 **F1 2.7점**을 더 얻었다고 보고한다.'},
 {h:'하나의 Encoder Block을 반복 재사용하는 규격화',
  lead:'[conv×n + self-attention + FFN]을 residual·LayerNorm으로 감싼 블록 하나를 임베딩·모델링 인코더 전체에서 재사용한다.',
  d:'포지션 인코딩(sin/cos, [Transformer](#/p/transformer)와 동일한 방식)을 블록 입구에서 더한 뒤, depthwise separable convolution을 여러 겹 통과시키고 self-attention, feed-forward를 차례로 거친다. 각 서브레이어는 LayerNorm 뒤에 residual 연결로 감싸여 있다. 문맥(context) 인코더와 질문(question) 인코더가 이 블록을 가중치까지 공유한다.'},
 {h:'Context-Query Attention은 BiDAF 그대로 가져온다',
  lead:'문서↔질문 양방향 attention 자체는 새로 만들지 않고 기존 기법을 재사용한다.',
  d:'QANet의 기여는 인코더를 순환 없는 구조로 바꾼 것이지, 문서와 질문을 잇는 attention 메커니즘 자체는 아니다. Context-to-Query, Query-to-Context 양방향 attention은 BiDAF에서 쓰던 것을 그대로 가져와, 두 인코더의 출력을 이 레이어에서 결합한 뒤 모델링 인코더로 넘긴다.'},
 {h:'역번역으로 학습 데이터를 늘린다',
  lead:'문서를 프랑스어 등으로 번역했다가 다시 영어로 되돌려 **의미는 같고 표현이 다른** 문장을 만든다.',
  d:'신경망 번역 모델로 영어 문서를 피벗 언어로 번역한 뒤 다시 영어로 역번역하면, 원문과 의미는 같지만 어휘·구문이 다른 패러프레이즈가 생긴다. 이렇게 만든 합성 데이터로 원본 SQuAD를 2~3배까지 불려 학습시켰다. 속도가 느린 RNN 모델이었다면 이만큼 늘어난 데이터로 같은 시간 안에 학습을 마칠 수 없었을 것이라는 점에서, 속도 개선이 데이터 증강을 가능하게 한 전제 조건이다.'}
],

diagram:{type:'stack', cap:'하나의 Encoder Block. 이 블록을 문맥·질문 인코더와 모델링 인코더에서 반복 재사용한다.',
 layers:[
  {t:'위치 인코딩', s:'sin/cos 더함'},
  {t:'Depthwise Conv', s:'× 여러 층 반복', note:'국소 패턴'},
  {t:'LayerNorm', s:'서브레이어마다'},
  {t:'Self-Attention', s:'multi-head', acc:true, note:'전역 관계'},
  {t:'Feed-Forward', s:'position-wise'},
  {t:'Residual 연결', s:'매 서브레이어 감쌈'}
 ]},

numbers:[
 {k:'학습 속도', v:'RNN 대비 3~13배', d:'동일 정확도 기준'},
 {k:'추론 속도', v:'RNN 대비 4~9배', d:'배치·GPU 조건에 따라'},
 {k:'F1 (단일 모델, 증강 데이터, 테스트셋)', v:'84.6', d:'당시 최고 공개 기록 81.8 갱신'},
 {k:'EM/F1 (증강 전, 대비 실험)', v:'개선폭 EM +1.5 · F1 +1.1', d:'역번역 데이터 증강의 순수 효과'},
 {k:'합성곱+self-attention 조합 효과', v:'self-attention 단독 대비 F1 +2.7', d:'같은 조건 ablation'},
 {k:'인코더 채널 수 · 커널 크기', v:'d=128 · kernel=7', d:'depthwise separable convolution'}
],

impact:'Transformer가 번역에서 증명한 "순환 없이도 된다"는 명제를 독해라는 다른 과제로 옮기면서, 속도 개선을 다시 **데이터 증강**이라는 별도 축의 성능 개선으로 연결한 것이 특징이다. 이후 독해·QA 연구는 QANet류의 합성곱-attention 하이브리드보다는 [BERT](#/p/bert) 같은 대규모 사전학습 encoder로 급격히 옮겨갔지만, "학습이 빠르면 더 많은 데이터로, 더 많은 실험으로 이어진다"는 이 논문의 메시지 자체는 이후 스케일링 연구 전반에 반복해서 등장하는 논리다.',

legacy:[
 '**RNN-free 독해 모델의 실증 사례** — [Transformer](#/p/transformer)의 인코더 설계가 번역을 넘어 다른 시퀀스 이해 과제에도 옮겨 붙을 수 있음을 SQuAD에서 보임',
 '**역번역 데이터 증강의 QA 적용** — 기계번역에서 흔하던 back-translation을 독해 데이터 증강에 쓴 초기 사례로, 이후 저자원 QA·NLI 데이터 증강 기법의 참고 대상이 됨',
 '**곧 사전학습 encoder에 자리를 내줌** — [BERT](#/p/bert)·[SQuAD 2.0](#/p/squad2) 시대로 넘어가며, 처음부터 학습하는 CNN+attention 하이브리드 대신 대규모 사전학습 후 미세조정하는 패러다임이 SQuAD 리더보드를 장악',
 '**합성곱+attention 하이브리드 설계의 참고점** — 이후 일부 효율 지향 아키텍처가 전역 attention과 국소 합성곱을 나눠 맡기는 이 설계 철학을 재사용'
],

pitfalls:[
 '**정확도 향상의 상당 부분이 아키텍처가 아니라 데이터 증강에서 온다.** 증강 데이터 없이는 EM/F1 개선폭이 1.5/1.1에 그친다 — "QANet 구조 자체가 SOTA를 만들었다"고만 이해하면 절반만 맞다.',
 '**Context-Query Attention은 이 논문의 기여가 아니다.** BiDAF의 양방향 attention을 그대로 재사용한 부분이며, QANet의 새로움은 인코더를 합성곱+self-attention으로 바꾼 것에 있다.',
 '**속도 비교는 같은 하드웨어·배치 조건에서의 상대값이다.** "3~13배", "4~9배"는 범위로 보고되며 조건(배치 크기, 시퀀스 길이)에 따라 갈린다는 점을 원문도 명시한다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽이 전체 모델: 문맥·질문을 각각 임베딩→인코더 블록 스택에 통과시킨 뒤 Context-Query Attention에서 결합하고, Stacked Model Encoder Block을 거쳐 시작/끝 위치 확률을 예측한다. 오른쪽이 그 안에서 반복 재사용되는 Encoder Block 하나 — 위치 인코딩 뒤에 합성곱을 여러 번(Repeat), 그다음 self-attention, 마지막 FFN을 residual+LayerNorm으로 감싼 순서를 눈여겨본다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'We propose a new Q&A architecture called QANet, which does not require recurrent networks: Its encoder consists exclusively of convolution and self-attention.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1804.09541 — QANet: Combining Local Convolution with Global Self-Attention for Reading Comprehension', u:'https://arxiv.org/abs/1804.09541'},
 {t:'OpenReview (ICLR 2018)', u:'https://openreview.net/forum?id=B14TlG-RW'}
]
});
