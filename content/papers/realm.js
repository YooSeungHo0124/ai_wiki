WIKI.paper({
slug:'realm',
venue:'ICML 2020',
authors:'Guu, Lee, Tung, Pasupat, Chang (Google Research)',
arxiv:'2002.08909',

tldr:'검색기를 미세조정 단계에 갖다 붙이는 대신, **마스크 언어모델 사전학습 자체를 검색기의 학습 신호로** 쓴 논문. "이 문서를 읽었더니 빈칸을 더 잘 맞혔다"는 것만으로 무엇을 찾아야 하는지를 배운다.',

context:'[BERT](#/p/bert)와 [T5](#/p/t5)는 사실 지식을 파라미터 안에 욱여넣는 방식으로 작동한다. 문제는 세 가지다 — 얼마나 많이 아는지 **측정할 수 없고**, 왜 그렇게 답했는지 **볼 수 없고**, 더 많이 알려면 모델을 키우는 수밖에 없다. 실제로 같은 시기 T5는 110억 파라미터를 써서 오픈도메인 QA를 풀고 있었다. 반대편의 검색 기반 시스템은 근거 문서를 보여줄 수 있지만, 검색기는 대개 BM25처럼 학습되지 않은 부품이거나 QA 라벨로만 지도학습됐다. REALM의 질문은 이것이다 — **검색기를 언어모델 사전학습의 일부로 만들 수 있는가?** 그러면 라벨 없이, 위키피디아 전체를 읽으며 "무엇을 찾아야 유용한지"를 배우게 된다.',

ideas:[
 {h:'지식 검색을 잠재 변수로 놓는다',
  lead:'검색 문서를 잠재변수로 두고 MLM 손실의 gradient를 검색기까지 흘려보낸다.',
  d:'$p(y|x) = \\sum_z p(y|z,x)\\,p(z|x)$ 로 분해한다. $z$ 는 검색된 문서(관측되지 않는 **잠재 변수**), $x$ 는 빈칸이 뚫린 문장, $y$ 는 정답 단어다. 두 항이 모두 미분 가능한 신경망이므로, 정답 단어의 로그 확률을 올리는 gradient가 그대로 **검색기까지 흘러간다.** 유용한 문서를 검색하면 검색 확률이 올라가고, 쓸모없는 문서는 내려간다 — 사람이 "이 질문에는 이 문서"라고 라벨링한 적이 없는데도.'},
 {h:'비동기 MIPS 인덱스 리프레시',
  lead:'인덱스 빌더를 트레이너와 병렬로 돌려 약 500 스텝마다 통째로 교체한다.',
  d:'문서 인코더가 매 스텝 바뀌므로, 원칙대로면 1300만 개 문서 벡터를 매 스텝 다시 계산해 인덱스를 다시 세워야 한다. REALM은 **트레이너와 인덱스 빌더를 별도 잡으로 병렬 실행**한다. 빌더는 트레이너의 파라미터 스냅샷으로 인덱스를 다시 굽고, 다 되면 갈아끼운다 — 대략 **500 스텝마다 한 번**. 인덱스는 항상 조금 낡아 있지만 후보를 고르는 데만 쓰이고, 최종 확률은 최신 파라미터로 다시 계산하므로 학습은 유지된다.'},
 {h:'Salient span masking: 무엇을 가릴지가 결정적이다',
  lead:'개체명·날짜 같은 salient span만 가려야 검색이 필수가 되어 신호가 흐른다.',
  d:'무작위 토큰을 가리면 대부분 주변 문맥만으로 맞출 수 있어서 검색이 필요 없어지고, 따라서 검색기에 학습 신호가 흐르지 않는다. REALM은 **개체명과 날짜 같은 salient span**만 가린다 — "1969년 7월 20일"을 가리면 문서를 찾아오는 것 외에 방법이 없다. ablation에서 무작위 토큰 마스킹은 NQ EM 38.2 → 32.3, 무작위 span은 35.3으로 떨어진다. 검색이 필요한 문제를 만들어야 검색을 배운다.'},
 {h:'상위 k개만 취하는 근사',
  lead:'전체 문서 합을 상위 k개(사전학습 8, 추론 5)로 잘라 근사한다.',
  d:'모든 문서에 대한 합은 계산 불가능하므로 상위 $k$ 개로 자른다. 사전학습에서는 **8개(빈 문서 $\\emptyset$ 포함)**, 미세조정 추론에서는 5개다. 확률 질량 대부분이 상위 문서에 몰려 있다는 가정에 기댄 절단이다.'},
 {h:'ICT로 검색기를 웜스타트한다',
  lead:'Inverse Cloze Task로 검색기를 미리 데워 콜드스타트 붕괴를 막는다.',
  d:'초기 검색기가 무작위면 검색된 문서가 전부 무관하고, 그러면 인코더가 문서를 무시하는 법을 배워 버려 검색기에 gradient가 영영 흐르지 않는 **콜드스타트**에 빠진다. REALM은 Inverse Cloze Task(문장을 질의로, 그 문장이 있던 문단을 정답으로)로 검색기를 미리 데워 이 붕괴를 피한다.'}
],

diagram:{type:'stack', cap:'REALM 사전학습 한 스텝. 회색 화살표(gradient)가 검색기까지 내려간다는 점이 이 논문의 전부다.',
 layers:[
  {t:'입력 x', s:'salient span 마스킹', note:'예: "달 착륙은 [MASK]년"'},
  {t:'Embed_input(x)', s:'BERT-base → 질의 벡터'},
  {t:'MIPS 검색', s:'1300만 문서 인덱스 · top-8', acc:true, note:'← 여기까지 gradient가 흐른다'},
  {t:'지식 증강 인코더', s:'문서+질문 결합 인코딩'},
  {t:'주변화', s:'8개 문서에 대한 가중합'},
  {t:'인덱스 비동기 리프레시', s:'약 500 스텝마다 재구축', note:'← 별도 잡'}
 ]},

math:[
 {expr:'p(y|x) = Σ_{z ∈ top-k} p(y | z, x) · p(z | x)',
  tex:'p(y\\mid x)=\\sum_{z\\in\\text{top-}k} p(y\\mid z,x)\\cdot p(z\\mid x)',
  d:'검색–예측 2단계 분해. 두 항 모두 미분 가능하므로 $\\log p(y|x)$ 의 gradient가 검색기 파라미터에 도달한다.'},
 {expr:'p(z|x) = softmax_z ( Embed_input(x)ᵀ Embed_doc(z) )',
  tex:'p(z\\mid x)=\\operatorname{softmax}_z\\big(\\text{Embed}_{\\text{input}}(x)^{\\top}\\text{Embed}_{\\text{doc}}(z)\\big)',
  d:'[DPR](#/p/dpr)과 같은 dual-encoder 내적 점수를 문서 집합 전체에 대한 softmax로 정규화한 것. 차이는 이 softmax를 **QA 라벨이 아니라 MLM 손실**이 학습시킨다는 점이다.'}
],

numbers:[
 {k:'NQ Exact Match', v:'40.4', d:'T5-11B의 34.5를 넘음 — **파라미터 30배 차이**로'},
 {k:'파라미터 수', v:'330M', d:'검색기+인코더 합계. 지식은 파라미터가 아니라 인덱스에 있다'},
 {k:'WebQuestions / CuratedTrec', v:'40.7 / 46.8', d:'직전 최고 ORQA는 36.4 / 30.1'},
 {k:'지식 코퍼스', v:'약 1300만 후보', d:'2018년 12월 위키피디아를 최대 288 wordpiece 청크로 분할'},
 {k:'인덱스 staleness 영향', v:'38.2 → 28.7 EM', d:'리프레시 주기를 **30배** 늘렸을 때. 인덱스 신선도가 성능을 좌우한다'},
 {k:'사전학습 비용', v:'200k 스텝 · TPU 64개 · 배치 512', d:'검색기까지 함께 사전학습하는 대가'}
],

impact:'"검색을 나중에 붙이는 부품"에서 "**사전학습 목적함수가 직접 가르치는 대상**"으로 위치를 옮긴 논문이다. 파라미터 30배 큰 T5-11B를 이겼다는 결과는 지식을 파라미터에 넣는 것과 인덱스에 넣는 것 사이의 교환 관계를 처음으로 선명하게 보여줬고, 이후 지식을 **모듈로 분리**하는 설계(모델은 그대로 두고 코퍼스만 갈아끼우기)의 근거가 됐다. 잠재 검색 문서에 대한 주변화라는 형식은 같은 해의 [RAG](#/p/rag)가 거의 그대로 물려받았다.',

legacy:[
 '**생성으로의 확장** — 추출형 인코더 대신 seq2seq 생성기를 붙이고 검색기는 [DPR](#/p/dpr)로 초기화한 것이 [RAG](#/p/rag)',
 '**검색기 공동학습 계열** — 이후 Atlas·[RETRO](#/p/retro) 등이 검색기와 언어모델을 함께 사전학습하는 노선을 이어감',
 '**salient span masking의 재사용** — 지식 집약 태스크를 겨냥한 마스킹 전략으로 널리 인용되며, T5+SSM 같은 파라미터 전용 모델에도 역수입됨',
 '**인덱스 갱신 공학** — 비동기 리프레시, 임베딩 stale 관리 문제는 오늘날 프로덕션 벡터 DB 운영의 그대로의 과제로 이어짐'
],

pitfalls:[
 '**검색기 공동학습은 비싸고 까다롭다.** 인덱스 재구축 인프라, ICT 웜스타트, 마스킹 전략이 하나라도 어긋나면 검색기가 학습되지 않고 조용히 무너진다. 실무에서 REALM 방식이 널리 채택되지 않고 [RAG](#/p/rag)처럼 **검색기를 얼려 두는** 구성이 표준이 된 이유가 여기 있다.',
 '**REALM은 답을 생성하지 않는다.** 검색된 문서에서 span을 **추출**하는 구조라, 여러 문서를 종합해 문장을 써야 하는 작업은 애초에 할 수 없다. 오늘날 "RAG"라 부르는 것과 구조가 다르다.',
 '**인덱스가 낡으면 성능이 무너진다.** 리프레시 주기를 30배 늘리자 EM이 38.2에서 28.7로 떨어졌다. 문서 인코더를 계속 학습시키는 시스템은 임베딩 버전 관리가 곧 성능 관리다.'
],

figures:[
 {f:'fig1-retriever-architecture.png',
  cap:'[MASK] 채우기 문제(x)가 초록색 지식 코퍼스에서 Neural Knowledge Retriever(파란 박스, retrieve)를 거쳐 문서 z 하나를 가져온다. 이 문서와 원래 질문을 이어붙인 (x,z)가 Knowledge-Augmented Encoder(파란 박스)로 들어가 답 y를 낸다. 그림 오른쪽 보라색 점선 "End-to-end backpropagation"이 핵심 — 화살표가 답에서 시작해 인코더를 지나 맨 위 검색기까지 거슬러 올라간다. 즉 "이 문서를 가져온 게 도움이 됐는가"라는 신호가 검색기 자체를 학습시킨다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'To capture knowledge in a more interpretable and modular way, we propose a novel framework, Retrieval-Augmented Language Model (REALM) pre-training, which augments language model pre-training algorithms with a learned textual knowledge retriever.',
  src:'Section 1, p.1'}
],

links:[
 {t:'arXiv 2002.08909 — REALM: Retrieval-Augmented Language Model Pre-Training', u:'https://arxiv.org/abs/2002.08909'},
 {t:'구현 (google-research/language · realm)', u:'https://github.com/google-research/language/tree/master/language/realm'}
]
});
