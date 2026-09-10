WIKI.paper({
slug:'closed-book-qa',
venue:'EMNLP 2020 (short paper)',
authors:'Roberts, Raffel, Shazeer (Google)',
arxiv:'2002.08910',

tldr:'검색 없이, 사전학습된 [T5](#/p/t5)를 QA 데이터셋으로 그대로 fine-tune해 질문에 답하게 한다. 모델이 사전학습 중 파라미터에 흡수한 지식만으로 "닫힌 책(closed-book)" 시험을 보는 셈이며, 이 성능이 모델을 키울수록 꾸준히 좋아진다는 것을 보였다.',

context:'오픈도메인 QA의 표준 방식은 "열린 책" 이다 — 질문이 들어오면 위키피디아 같은 외부 코퍼스에서 관련 문서를 검색해 모델에 함께 넣어준다. 그런데 [BERT](#/p/bert)·[T5](#/p/t5) 같은 사전학습 언어모델이 마스킹 목표로 학습되는 과정에서 사실 관계를 암묵적으로 "암기"한다는 관찰(Petroni et al. 2019 등)이 있었다. 이 논문은 그 관찰을 실용적인 질문으로 바꾼다 — **외부 지식을 아예 주지 않고, 질문만 던져서 파라미터 안의 지식만으로 답하게 하면 얼마나 잘하는가?** T5의 text-to-text 프레임이 이 실험에 잘 맞는다. 인코더 전용 모델(BERT류)은 정답이 위치한 컨텍스트에서 span을 골라내는 방식이라 컨텍스트가 없으면 애초에 쓸 수 없지만, encoder-decoder인 T5는 입력이 질문뿐이어도 답 텍스트를 그대로 생성하면 된다.',

ideas:[
 {h:'닫힌 책 QA: 컨텍스트 없이 질문만 넣는다',
  lead:'검색 문서 없이 질문 텍스트만 입력해 답을 직접 생성하게 fine-tune한다.',
  d:'Natural Questions, WebQuestions, TriviaQA를 **오픈도메인 형식**으로 가져와, 정답이 담긴 문서나 문단을 일절 주지 않고 질문 텍스트만 T5에 입력한다. 모델은 정답 span을 추출하는 게 아니라 정답의 **리터럴 텍스트를 생성**한다. 학생이 책을 덮고 시험을 보는 것과 같은 구도라 "closed-book"이라 부른다.'},
 {h:'Salient Span Masking으로 사전학습을 지식 위주로 편향시킨다',
  lead:'개체명·날짜가 든 문장만 골라 마스킹해 세계 지식에 집중하도록 추가 사전학습한다.',
  d:'T5의 기본 사전학습(무작위 span corruption)은 문법·의미 전반을 배우지만 지식 암기에는 비효율적이다. [REALM](#/p/realm)에서 제안한 salient span masking(SSM)은 BERT로 위키피디아 문장에서 개체명·날짜 같은 "핵심 span"을 찾아 그 부분만 마스킹한다. T5 체크포인트에 이 목표로 10만 스텝을 추가 사전학습한 뒤 QA로 fine-tune하면 점수가 크게 오른다.'},
 {h:'모델 크기와 성능이 거의 단조롭게 같이 오른다',
  lead:'T5 Base→Large→3B→11B 순으로 세 데이터셋 모두 예외 없이 점수가 오른다.',
  d:'Base(2.2억)부터 11B(110억)까지 다섯 크기를 전부 같은 절차로 fine-tune해 비교했다. NQ·WQ·TQA 세 데이터셋 전부에서 크기가 커질수록 EM(exact match)이 예외 없이 오르고, 가장 큰 모델이 항상 최고 점수를 낸다. 파라미터 수 자체가 암기 가능한 지식량의 대리 지표로 작동한다는 뜻이다.'},
 {h:'검색 없이도 당시 REALM·DPR급 검색 시스템과 경쟁한다',
  lead:'T5-11B+SSM이 TriviaQA test에서 검색 기반 REALM류 baseline을 앞선다.',
  d:'가장 큰 모델(T5-11B + SSM)은 TriviaQA test에서 60.5 EM을 기록해, 검색을 쓰는 Févry et al.(2020)의 53.4를 앞섰다. 다만 Natural Questions에서는 [DPR](#/p/dpr)(41.5)이 T5-11B+SSM(34.8)을 여전히 앞선다 — "경쟁력이 있다"이지 "항상 이긴다"는 아니다.'},
 {h:'답을 자유생성하므로 채점 방식 자체가 성능을 과소평가한다',
  lead:'exact-match는 정답과 표현만 다른 답도 오답 처리해 실제 성능을 깎아 먹는다.',
  d:'모델이 span을 뽑는 게 아니라 자유 형식으로 텍스트를 생성하기 때문에, 정답과 의미는 같지만 표현이 다른 답("April 15" vs "April 15th")이나 데이터셋에 정답이 일부만 라벨링된 경우도 exact-match 상 오답으로 잡힌다. Natural Questions 150개를 수작업 검토한 결과 이런 **거짓 음성(false negative)**을 제거하면 EM이 57.8까지 오른다.'}
],

diagram:{type:'compare', cap:'같은 질문에 답하는 두 접근 — 검색 기반은 문서를 찾아 근거를 주고, closed-book은 파라미터 기억에만 의존한다.',
 left:{t:'검색 기반 오픈북 QA', items:['질문으로 코퍼스 검색','관련 문서를 컨텍스트로 입력','문서에서 정답 span 추출','근거 문서 확인 가능']},
 right:{t:'Closed-book QA (T5)', items:['질문 텍스트만 입력','외부 문서 조회 없음','파라미터 지식으로 답 생성','근거 확인 불가·환각 위험'],acc:true}
},

math:[],

numbers:[
 {k:'T5-Base (2.2억)', v:'25.9 / 27.9 / 29.1', d:'NQ / WQ / TQA-dev EM — 가장 작은 모델'},
 {k:'T5-Large (7.7억)', v:'28.5 / 30.6 / 35.9', d:'크기만 키워도 세 데이터셋 모두 상승'},
 {k:'T5-3B', v:'30.4 / 33.6 / 43.4', d:'스케일링 곡선이 계속 우상향'},
 {k:'T5-11B + SSM', v:'34.8 / 40.8 / 60.5', d:'가장 큰 모델 + salient span masking, NQ/WQ/TQA-test 전부 최고'},
 {k:'DPR (검색 기반, 2020)', v:'41.5 / 42.4 / 57.9', d:'NQ·WQ에서는 [DPR](#/p/dpr)이 T5-11B+SSM을 여전히 앞섬 — TQA만 역전'},
 {k:'false-negative 보정 후 NQ', v:'57.8 EM', d:'exact-match가 놓친 의미상 정답 150개 수작업 검토 후 재계산'}
],

impact:'"언어모델은 파라미터 안에 얼마나 많은 지식을 담을 수 있는가"라는 질문에 처음으로 **모델 크기별 정량 곡선**을 제시했다. 스케일이 곧 암기 용량이라는 직관을 오픈도메인 QA라는 실용적 벤치마크로 증명하면서, 검색 없는 순수 파라미터 지식만으로도 당시 검색 기반 시스템과 경쟁 가능하다는 것을 보였다. 동시에 한계도 명확히 드러냈다 — 최고 성능은 110억 파라미터 모델에서만 나왔고, 지식이 파라미터에 "설명 불가능한 방식으로" 흩어져 있어 무엇을 근거로 답했는지 확인할 방법이 없다는 점, 그리고 모르는 질문에도 그럴듯한 답을 지어내는(환각) 문제를 논문이 스스로 지적한다.',

legacy:[
 '**해석 불가능성이 다음 세대 연구의 동기가 됨** — "파라미터에 지식을 숨겨두지 말고 검색으로 근거를 명시하자"는 문제의식이 이후 [RAG](#/p/rag)의 핵심 동기로 이어짐',
 '**검색-생성 결합의 직접적 비교축 제공** — 같은 시기 [REALM](#/p/realm)·[DPR](#/p/dpr)이 검색+파라미터 결합으로 이 논문의 순수 파라미터 방식을 능가하는 것을 목표로 발전',
 '**"모델을 키우면 지식도 는다"는 실증 근거** — [Gopher](#/p/gopher)·[GPT-3](#/p/gpt3) 등 이후 대형 모델의 지식 집약 태스크 평가 설계에 참조점이 됨',
 '**SSM 사전학습 레시피의 확산** — salient span masking이 이후 지식 집약형 사전학습 연구에서 반복적으로 재사용됨'
],

pitfalls:[
 '**"검색 기반을 이겼다"로 일반화하면 안 된다.** TriviaQA test에서는 당시 baseline을 앞섰지만, 같은 논문의 표에서 Natural Questions와 WebQuestions는 [DPR](#/p/dpr)이 여전히 더 높다. 데이터셋마다 결과가 갈린다.',
 '**EM 점수를 곧이곧대로 "정답률"로 읽으면 안 된다.** 자유생성 특성상 표현이 다른 정답도 오답 처리되는 거짓 음성이 많아, 저자들 스스로 150개 수작업 검토로 57.8까지 보정된 값을 따로 제시했다.',
 '**11B라는 규모가 결과의 전제 조건이다.** 논문이 밝히듯 SOTA급 결과는 가장 큰 모델에서만 나왔고, 저자들도 이것이 자원 제약 환경에서는 비현실적이라고 명시한다.'
],

figures:[
 {f:'fig1-closed-book.png',
  cap:'위쪽: 사전학습 단계 — 위키피디아 문장에서 마스킹된 span(<M>)을 T5가 채워 넣는다. 아래쪽: fine-tuning 단계 — "When was Franklin D. Roosevelt born?" 같은 질문만 입력하고 컨텍스트 없이 "1882"를 바로 생성한다. 점선이 사전학습과 fine-tuning의 경계.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'It has recently been observed that neural language models trained on unstructured text can implicitly store and retrieve knowledge using natural language queries.',
  src:'Abstract, p.1'},
 {t:"In contrast, our model distributes knowledge in its parameters in an inexplicable way and hallucinates realistic-looking answers when it is unsure.",
  src:'Conclusion, p.9'}
],

links:[
 {t:'arXiv 2002.08910 — How Much Knowledge Can You Pack Into the Parameters of a Language Model?', u:'https://arxiv.org/abs/2002.08910'},
 {t:'공식 코드/체크포인트 (t5-cbqa)', u:'https://goo.gle/t5-cbqa'}
]
});
