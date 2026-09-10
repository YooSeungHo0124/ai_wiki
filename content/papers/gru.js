WIKI.paper({
slug:'gru',
venue:'EMNLP 2014',
authors:'Cho et al. (Université de Montréal · Jacobs University)',
arxiv:'1406.1078',

tldr:'인코더 RNN이 문장을 고정 길이 벡터로 압축하고 디코더 RNN이 그 벡터로부터 다른 문장을 생성하는 **RNN Encoder–Decoder** 구조를 제안하고, 그 안에서 쓸 **GRU(Gated Recurrent Unit)** 를 처음 도입한 논문. [seq2seq](#/p/seq2seq)와 같은 해, 같은 문제의식에서 나온 자매 논문이다.',

context:'통계 기계번역(SMT)은 $p(f|e) \\propto p(e|f)p(f)$ 형태의 로그선형 모델에 다양한 특징(feature)을 더해 점수를 매기는 방식이 표준이었다. 신경망은 이미 언어모델링·단어 임베딩에서 성과를 냈지만, SMT 파이프라인 안에 어떻게 자연스럽게 끼워 넣을지가 문제였다. 당시 RNN은 대개 다음 기호를 예측하는 언어모델로만 쓰였고, **가변 길이 입력을 가변 길이 출력으로 바꾸는** 일반적인 방법은 없었다. 또한 vanilla RNN·[LSTM](#/p/lstm)의 게이트 구조는 계산량이 커서, 더 가볍게 장기 의존성을 다룰 방법이 필요했다.',

ideas:[
 {h:'RNN Encoder–Decoder: 압축과 복원을 한 쌍으로',
  lead:'인코더가 문장을 고정 길이 벡터 $c$ 로 압축하고 디코더가 그 벡터로부터 문장을 복원한다.',
  d:'인코더 RNN이 입력 시퀀스 $x_1,\\dots,x_T$ 를 순서대로 읽어 마지막 은닉 상태를 요약 벡터 $c$ 로 만든다. 디코더 RNN은 $c$ 와 이전 출력 $y_{t-1}$ 을 조건으로 다음 기호 $y_t$ 를 생성한다. 두 RNN을 조건부 로그우도 $\\frac{1}{N}\\sum \\log p_\\theta(y_n|x_n)$ 를 최대화하도록 **함께** 학습시킨다는 점이 핵심이며, 학습 후에는 번역을 생성하는 용도로도, 기존 SMT의 구절 쌍에 점수를 매기는 특징(feature)으로도 쓸 수 있다.'},
 {h:'GRU: 게이트 둘, 셀 상태 없음',
  lead:'reset 게이트와 update 게이트 두 개만으로 은닉 상태를 직접 갱신한다.',
  d:'[LSTM](#/p/lstm)은 별도의 셀 상태 $c_t$ 와 입력·출력·망각 게이트 3개(총 4개 게이트)를 쓴다. GRU는 셀 상태를 없애고 은닉 상태 $h_t$ 자체를 갱신 대상으로 삼아, reset 게이트 $r$ 과 update 게이트 $z$ 두 개만 둔다. **reset 게이트**는 이전 상태를 얼마나 무시하고 현재 입력만으로 리셋할지, **update 게이트**는 이전 상태를 얼마나 그대로 들고 갈지를 정한다. 저자들은 이를 LSTM보다 "계산·구현이 훨씬 간단하다"고 명시한다.'},
 {h:'적응적 시간 스케일: 유닛마다 다른 리듬',
  lead:'유닛마다 reset·update 게이트가 서로 다르게 활성화돼 각기 다른 시간 스케일을 학습한다.',
  d:'단기 의존성을 담당하는 유닛은 reset 게이트가 자주 열려 상태를 자주 초기화하고, 장기 의존성을 담당하는 유닛은 update 게이트가 대부분 열려 이전 정보를 오래 유지한다. 저자들은 예비 실험에서 게이트 없는 tanh 유닛으로는 의미 있는 결과를 전혀 얻지 못했다고 보고한다 — 게이팅 자체가 필수 조건이었다.'},
 {h:'구절 점수화(phrase scoring)로 기존 SMT에 얹기',
  lead:'RNN Encoder–Decoder를 처음부터 번역기로 쓰지 않고 기존 log-linear 모델의 추가 특징으로 삽입한다.',
  d:'학습된 모델로 구절 표(phrase table)의 각 (source, target) 쌍에 조건부 확률 점수를 매겨, Moses 기반 baseline SMT의 로그선형 모델에 특징 하나로 추가했다. end-to-end 생성기가 아니라 **기존 파이프라인의 부품**으로 검증했다는 점이 이후 seq2seq류 순수 생성 접근과 다른 실용적 절충이다.'}
],

diagram:{type:'compare', cap:'LSTM과 GRU의 게이트 구조 차이 — 셀 상태의 유무가 핵심.',
 left:{t:'LSTM', items:['게이트 4개 (입력·출력·망각·후보)','별도 셀 상태 $c_t$ 유지','파라미터·연산량 더 큼']},
 right:{t:'GRU', items:['게이트 2개 (reset·update)','셀 상태 없이 $h_t$ 직접 갱신','reset이 0이면 이전 상태 무시']}},

math:[
 {expr:'r_j = σ([W_r x]_j + [U_r h_{t-1}]_j)',
  tex:'r_j=\\sigma\\!\\left([\\mathbf{W}_r\\mathbf{x}]_j+[\\mathbf{U}_r\\mathbf{h}_{\\langle t-1\\rangle}]_j\\right)',
  d:'reset 게이트. 0에 가까우면 이전 은닉 상태를 버리고 현재 입력만으로 상태를 새로 만든다.'},
 {expr:'z_j = σ([W_z x]_j + [U_z h_{t-1}]_j)',
  tex:'z_j=\\sigma\\!\\left([\\mathbf{W}_z\\mathbf{x}]_j+[\\mathbf{U}_z\\mathbf{h}_{\\langle t-1\\rangle}]_j\\right)',
  d:'update 게이트. 1에 가까우면 이전 상태를 거의 그대로 들고 간다.'},
 {expr:'h_j(t) = z_j·h_j(t-1) + (1-z_j)·h̃_j(t),  h̃_j(t) = φ([Wx]_j + [U(r⊙h_{t-1})]_j)',
  tex:'\\begin{aligned}h_j^{\\langle t\\rangle}&=z_jh_j^{\\langle t-1\\rangle}+(1-z_j)\\tilde{h}_j^{\\langle t\\rangle}\\\\ \\tilde{h}_j^{\\langle t\\rangle}&=\\phi\\!\\left([\\mathbf{Wx}]_j+[\\mathbf{U}(\\mathbf{r}\\odot\\mathbf{h}_{\\langle t-1\\rangle})]_j\\right)\\end{aligned}',
  d:'최종 은닉 상태는 이전 상태와 후보 상태 $\\tilde h$ 의 $z$ 가중 선형보간이다. LSTM의 forget/input 게이트가 각각 따로 있는 것과 달리, 여기선 $z$ 하나가 "얼마나 유지·얼마나 갱신"을 동시에 결정한다.'}
],

numbers:[
 {k:'인코더·디코더 은닉 유닛', v:'1000개', d:'제안된 게이트 구조를 encoder·decoder 양쪽에 사용'},
 {k:'단어 임베딩 차원', v:'100', d:'입력 행렬을 rank-100 저랭크로 근사'},
 {k:'BLEU (baseline)', v:'33.30', d:'Moses 기본 설정 phrase-based SMT, WMT14 En-Fr test'},
 {k:'BLEU (+RNN Encoder-Decoder)', v:'33.87', d:'phrase 점수에 제안 모델 특징을 추가한 결과'},
 {k:'BLEU (+CSLM+RNN)', v:'34.64', d:'신경망 언어모델(CSLM)까지 결합한 최고 설정'},
 {k:'어휘 크기', v:'15,000 단어', d:'영·불 각각 최빈 15k 단어만 사용, 나머지는 [UNK]'}
],

impact:'가변 길이 시퀀스를 고정 길이 벡터로 압축했다가 다시 가변 길이로 복원하는 encoder–decoder 틀을 처음 정식화해, 번역뿐 아니라 요약·대화·음성 등 시퀀스 변환 문제 전반에 쓰이는 표준 골격을 세웠다. 동시에 제안된 GRU는 LSTM보다 파라미터가 적어 계산이 가볍고 구현이 단순하면서도 비슷한 성능을 내, 이후 수많은 시퀀스 모델에서 LSTM의 경량 대안으로 쓰이게 되었다. 다만 이 논문 자체는 encoder–decoder를 독립 번역기가 아니라 **기존 SMT의 특징 점수기**로 검증했다는 점에서, 곧이어 나온 [seq2seq](#/p/seq2seq)의 end-to-end 접근과 위치가 다르다.',

legacy:[
 '**attention과의 결합** — 고정 길이 벡터 $c$ 하나에 모든 정보를 욱여넣는 병목이 곧 지적되었고, [Bahdanau](#/p/bahdanau) attention이 이 encoder–decoder 틀에 매 스텝 다른 context를 주는 방식으로 해결',
 '**LSTM과의 경량 대안 경쟁** — 이후 다양한 벤치마크에서 GRU와 [LSTM](#/p/lstm)이 비슷한 성능을 내며 "게이트를 몇 개 둘 것인가" 논쟁의 시작점이 됨',
 '**seq2seq와의 병행 발전** — 같은 해 나온 [seq2seq](#/p/seq2seq)가 encoder–decoder를 SMT 특징이 아닌 순수 생성 모델로 확장하며 이 틀을 일반화',
 '**GRU의 확산** — 음성 인식·시계열·경량 온디바이스 모델 등 LSTM보다 적은 연산이 필요한 영역에서 표준 선택지 중 하나로 자리잡음'
],

pitfalls:[
 '**"GRU가 LSTM보다 항상 낫다"는 근거 없는 통설이다.** 이 논문은 GRU가 더 간단하다는 것만 보였을 뿐, 어느 쪽이 일관되게 우월하다는 주장은 하지 않는다. 실제로 어느 게이트 구조가 나은지는 과제마다 다르다.',
 '**이 논문의 encoder–decoder는 end-to-end 번역기로 제안된 것이 아니다.** 실험은 phrase table 점수화라는 SMT 보조 역할로 한정돼 있어, 순수 신경망 번역([seq2seq](#/p/seq2seq))과 실험 설계 자체가 다르다.',
 '**고정 길이 벡터 $c$ 의 병목을 이 논문은 인지했지만 풀지 않았다.** 긴 문장일수록 성능이 떨어지는 문제는 이듬해 attention이 등장하고서야 해소된다.'
],

figures:[
 {f:'fig1-encdec.png',
  cap:'아래 박스가 encoder — $x_1,\\dots,x_T$ 를 순서대로 읽어 마지막 은닉 상태가 요약 벡터 $c$ 로 흘러 들어간다. 위 박스가 decoder — $c$ 와 이전 출력을 받아 $y_1,\\dots,y_{T\\prime}$ 을 순서대로(오른쪽에서 왼쪽으로) 생성한다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-gru-unit.png',
  cap:'입력 $x$ 가 들어와 $r$(reset)이 이전 상태 $h$ 를 얼마나 반영할지를 스위치처럼 조절하고, $z$(update)가 새 후보 $\\tilde h$ 와 이전 $h$ 를 섞는 비율을 정한다. 셀 상태 없이 $h$ 순환 하나로 정보가 흐른다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'we also propose a new type of hidden unit that has been motivated by the LSTM unit but is much simpler to compute and implement.',
  src:'Section 2.3, p.3'}
],

links:[
 {t:'arXiv 1406.1078 — Learning Phrase Representations using RNN Encoder–Decoder', u:'https://arxiv.org/abs/1406.1078'},
 {t:'Understanding LSTM Networks (colah)', u:'https://colah.github.io/posts/2015-08-Understanding-LSTMs/'}
]
});
