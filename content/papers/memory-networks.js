WIKI.paper({
slug:'memory-networks',
venue:'ICLR 2015',
authors:'Weston, Chopra & Bordes (Facebook AI Research)',
arxiv:'1410.3916',

tldr:'신경망에 **읽고 쓸 수 있는 외부 장기 메모리**를 붙여, 추론 컴포넌트와 메모리를 분리한 구조를 제안한 논문. 여러 문장을 순서대로 참조해야 답이 나오는 질의응답을 처음으로 풀어 보였다.',

context:'2014년의 시퀀스 모델은 [LSTM](#/p/lstm)이나 [seq2seq](#/p/seq2seq)처럼 상태를 **고정 크기 은닉 벡터**에 압축했다. 문제는 은닉 상태가 매 스텝 덮어써진다는 점이다 — 긴 이야기를 읽고 여러 문장을 조합해야 답이 나오는 질문에는 구조적으로 불리하다. 저자들은 RNN이 "복사하기"조차 잘 못한다는 관찰(Zaremba & Sutskever, 2014)을 인용하며, 추론 능력과 기억 용량이 같은 벡터에 뒤엉켜 있는 것이 근본 원인이라고 본다. 이 논문의 제안은 단순하다 — **기억을 별도 컴포넌트로 떼어내 그대로 저장하고, 추론 모듈이 필요할 때 그 기억을 검색해서 쓰게 하자.**',

ideas:[
 {h:'I·G·O·R: 메모리를 네 개의 컴포넌트로 분해',
  lead:'입력 변환·메모리 갱신·출력 계산·응답 생성을 독립된 학습 가능 모듈로 나눈다.',
  d:'memory network는 배열 `m`(메모리)과 네 함수로 정의된다. I는 입력을 내부 표현으로 바꾸고, G는 그 표현으로 메모리를 갱신하며, O는 현재 입력과 메모리로 출력 특징을 계산하고, R은 그것을 최종 응답으로 디코딩한다. 각 함수는 SVM이든 신경망이든 무엇이든 될 수 있는 **틀**이고, 논문은 이 틀 위에 신경망 버전(MemNN)을 구현해 검증한다.'},
 {h:'메모리는 슬롯에 원문 그대로 저장한다',
  lead:'입력 문장을 압축하지 않고 다음 빈 슬롯에 그대로 써서 정보 손실을 없앤다.',
  d:'가장 단순한 G는 `m_{H(x)} = I(x)` — 새 입력을 다음 빈 슬롯에 저장하고 기존 슬롯은 건드리지 않는다. RNN처럼 매 스텝 상태를 겹쳐 쓰지 않으므로, 100번째 문장이 1번째 문장을 지우지 않는다. 대신 슬롯이 늘어날수록 검색 비용이 커지는데, 이 논문은 단어 해싱·클러스터 해싱으로 14M개 메모리에서도 80배 속도 향상을 얻는다.'},
 {h:'k-hop 추론: 지지 문장을 순차적으로 찾는다',
  lead:'질문에 가장 관련된 문장을 찾고, 그 문장을 근거로 다시 다음 문장을 찾는다.',
  d:'O 모듈은 질문 $x$ 와 가장 잘 맞는 메모리 $m_{o_1}$ 을 먼저 찾고(식 2), 다음엔 $[x, m_{o_1}]$ 을 근거로 두 번째 메모리 $m_{o_2}$ 를 찾는다(식 3). "우유가 지금 어디 있는가"라는 질문에 "Joe가 우유를 놓았다"를 먼저 찾고 "Joe가 사무실로 갔다"를 이어서 찾는 식이다. 이것이 오늘날 "multi-hop retrieval"의 원형이다.'},
 {h:'임베딩 기반 매칭 함수 하나로 검색과 응답을 통일',
  lead:'질문과 문장을 같은 형태의 bilinear 스코어 함수로 비교해 검색·응답을 모두 처리한다.',
  d:'문장 매칭과 단어 응답 선택 모두 $s(x,y) = \\Phi_x(x)^\\top U^\\top U \\Phi_y(y)$ 형태의 임베딩 내적으로 계산한다. bag-of-words를 세 종류의 사전(질문용, 지지문장용, 답변용)으로 나눠 같은 단어라도 역할에 따라 다르게 표현되게 한다. margin ranking loss로 정답 지지 문장·정답 단어의 점수를 오답보다 높이도록 학습한다.'}
],

diagram:{type:'flow', cap:'질문이 들어오면 I가 표현을 만들고, G가 메모리에 쓰고, O가 지지 문장을 순서대로 검색하고, R이 최종 답을 만든다.',
 nodes:[
  {t:'입력 문장', s:'"Joe left the milk"'},
  {t:'I: 특징 변환', s:'bag-of-words'},
  {t:'G: 메모리에 저장', s:'슬롯에 원문 유지', acc:true},
  {t:'O: k-hop 검색', s:'지지 문장 1개→2개'},
  {t:'R: 응답 생성', s:'단어/문장 출력'}
 ]},

math:[
 {expr:'s(x, y) = Φx(x)ᵀ Uᵀ U Φy(y)',
  tex:'s(x,y)=\\Phi_x(x)^{\\top}U^{\\top}U\\,\\Phi_y(y)',
  d:'질문 $x$ 와 메모리(또는 후보 단어) $y$ 를 같은 임베딩 공간에 투영해 내적으로 매칭 점수를 낸다. $U$ 는 $n \\times D$ 행렬, $\\Phi$ 는 bag-of-words 특징 추출.'},
 {expr:'o1 = argmax_i sO(x, mi),   o2 = argmax_i sO([x, mo1], mi)',
  tex:'o_1=\\operatorname*{arg\\,max}_i s_O(x,m_i),\\qquad o_2=\\operatorname*{arg\\,max}_i s_O([x,m_{o_1}],m_i)',
  d:'k=2 지지 문장 검색. 두 번째 검색은 원 질문과 첫 지지 문장을 함께 조건으로 써서, 첫 홉이 찾은 단서를 바탕으로 다음 단서를 찾는다.'}
],

numbers:[
 {k:'대규모 QA F1 (Fader et al. 데이터셋)', v:'0.82', d:'BoW 특징 추가 MemNN. 기존 최고(Bordes et al. 2014b) 0.73 대비 우위'},
 {k:'메모리 클러스터 해싱 속도', v:'약 80배', d:'14M 후보 → 177k 후보로 줄이면서 F1은 0.82→0.80으로 소폭 하락'},
 {k:'시뮬레이션 QA (난이도5, actor+object)', v:'MemNN k=2: 99.9%', d:'같은 조건 RNN 17.8%, LSTM 29.0% — 다중 지지문장 추론에서 격차가 크다'},
 {k:'단일 지지문장(k=1)만 쓸 때', v:'44.4%', d:'k=2로 두 번째 지지문장을 찾게 하자 99.9%로 급등 — multi-hop의 효과'},
 {k:'학습 데이터량', v:'500문항으로 99%대 달성', d:'시뮬레이션 과제에서는 소량 데이터로도 빠르게 포화'}
],

impact:'추론 모듈과 기억 저장소를 분리한다는 발상이, 정보를 압축해 은닉 벡터에 욱여넣던 RNN 계열과 확실히 갈라섰다. 이 논문 자체의 검색은 미분 불가능한 argmax 였고 지지 문장 라벨이 있어야 학습됐지만, 곧이어 나온 End-to-End Memory Networks와 [Bahdanau attention](#/p/bahdanau) 계열이 "부드러운(soft) 검색"으로 이 한계를 없앴다. "외부에 저장하고 검색해서 쓴다"는 골격은 이후 [Transformer](#/p/transformer)의 self-attention, 그리고 대규모 문서에서 검색해 오는 [RAG](#/p/rag) 로 이어졌다.',

legacy:[
 '**소프트 어텐션으로 미분 가능화** — 같은 저자 그룹의 End-to-End Memory Networks(2015)가 argmax 검색을 softmax 가중합으로 바꿔 지지 문장 라벨 없이 학습 가능하게 만들었다',
 '**평가 벤치마크 파생** — 이 논문이 쓴 시뮬레이션 QA 과제가 정제되어 [bAbI](#/p/babi) 20개 과제로 독립 발표됐다',
 '**검색-증강 생성으로 확장** — "메모리에서 찾아와 답을 만든다"는 구조가 문서 전체를 검색 대상으로 삼는 [RAG](#/p/rag) 로 이어졌다',
 '**attention과의 수렴** — [Transformer](#/p/transformer)의 self-attention은 결국 모든 토큰을 매 층마다 다시 "검색"하는 것과 같은 발상이다'
],

pitfalls:[
 '**이 논문의 MemNN은 완전한 end-to-end 학습이 아니다.** 훈련 시 어떤 문장이 정답 근거인지(지지 문장 라벨)가 주어져야 하고, 테스트 시에만 라벨 없이 검색한다 — 오늘날의 비지도 dense retrieval과는 전제가 다르다.',
 '**"메모리"가 곧 attention은 아니다.** 여기서의 O 모듈은 argmax 로 하나(또는 k개)의 슬롯만 하드하게 골라내는 것이라 미분 불가능하다. 소프트 가중합으로 부드럽게 바뀐 것은 후속 논문(End-to-End Memory Networks)에서다.',
 '**시뮬레이션 과제 성능이 실제 언어 이해를 뜻하지 않는다.** 4명의 캐릭터·3개의 사물·5개의 방으로 만든 장난감 세계의 99% 정확도는, 이후 bAbI 도 겪듯 표면적 패턴 매칭으로 풀릴 여지가 있다는 비판을 받았다.'
],

figures:[
 {f:'fig1-example.png',
  cap:'토이 시뮬레이션이 생성한 이야기와 질문. "우유가 지금 어디 있는가"에 답하려면 "집었다"→"놓았다"의 순서를 추적해야 하고, "사무실 가기 전 어디에 있었나"는 시간 순서 자체를 추론해야 한다.',
  src:'원문 Figure 1, p.4'}
],

quotes:[
 {t:'Most machine learning models lack an easy way to read and write to part of a (potentially very large) long-term memory component, and to combine this seamlessly with inference.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 1410.3916 — Memory Networks', u:'https://arxiv.org/abs/1410.3916'},
 {t:'End-To-End Memory Networks (Sukhbaatar et al., 2015)', u:'https://arxiv.org/abs/1503.08895'}
]
});
