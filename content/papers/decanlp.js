WIKI.paper({
slug:'decanlp',
venue:'arXiv preprint 2018 (Salesforce Research)',
authors:'McCann, Keskar, Xiong, Socher (Salesforce Research)',
arxiv:'1806.08730',

tldr:'번역·요약·NLI·SQL 생성 등 서로 다른 10개 NLP 과제를 전부 **(질문, 문맥, 답)이라는 질의응답 형식**으로 통일하고, 과제별 전용 모듈 없이 하나의 모델(MQAN)로 동시에 학습시킨 논문. `text-to-text`로 모든 과제를 통일한 [T5](#/p/t5)보다 먼저 같은 발상에 도달했다.',

context:'2018년까지의 멀티태스크 학습은 대개 과제마다 다른 출력 형식(분류 헤드, 시퀀스 생성, 스팬 추출 등)을 쓰고, 공유 인코더 위에 과제별 전용 층을 얹는 식이었다. 이 구조는 과제가 늘어날 때마다 새 모듈이 필요하고, 과제 간 지식 전이가 구조적으로 제한된다. 저자들은 "질문에 답하는 능력 하나로 모든 언어 이해 과제를 표현할 수 없는가"라는 질문에서 출발해, 출력 형식 자체를 통일하는 쪽을 택했다.',

ideas:[
 {h:'모든 과제를 (문맥, 질문, 답)으로 통일',
  lead:'번역이든 SRL이든 감성분석이든, 입력은 문맥+질문, 출력은 답이라는 하나의 틀에 넣는다.',
  d:'예를 들어 번역은 "문맥: 영어 문장, 질문: 독일어로 번역하면?"이 되고, 감성분석은 "문맥: 리뷰, 질문: 긍정인가 부정인가?"가 된다. 과제 구분은 모델 구조가 아니라 **질문 문장 자체**가 담당하므로, 새 과제를 추가할 때 모델을 바꿀 필요가 없다.'},
 {h:'전용 모듈 없는 단일 모델 MQAN',
  lead:'하나의 multitask question answering network가 과제 전용 파라미터 없이 10개 과제를 처리한다.',
  d:'MQAN은 이중 coattention으로 질문과 문맥을 서로 조건화한 뒤, self-attention으로 장거리 의존성을 정리하고, 디코더가 질문에서 복사할지·문맥에서 복사할지·고정 어휘에서 생성할지를 매 스텝 결정한다. 과제마다 다른 헤드를 붙이는 대신 이 하나의 디코딩 메커니즘이 모든 출력 형태를 커버한다.'},
 {h:'multi-pointer-generator: 복사 대상이 두 곳',
  lead:'기존 pointer-generator를 확장해 문맥뿐 아니라 질문에서도 복사할 수 있게 한다.',
  d:'[See et al. 2017]의 pointer-generator는 문맥에서만 복사했다. decaNLP의 많은 과제(NLI의 "entailment", MWSC의 인물 이름)는 정답이 질문 쪽에 있으므로, 질문에 대한 포인터를 추가하고 두 개의 게이트(λ, γ)로 "생성/문맥복사/질문복사" 비율을 조절한다.'},
 {h:'anti-curriculum: 어려운 과제부터 학습',
  lead:'쉬운 과제부터 섞는 curriculum이 아니라, 어려운 SQuAD를 먼저 단독 학습한 뒤 합치는 쪽이 더 좋다.',
  d:'직관과 반대로, 가장 어려운 과제인 SQuAD만 먼저 학습시키고 나서 10개 과제를 한꺼번에 학습하는 anti-curriculum 전략이 처음부터 다 섞는 fully-joint보다 decaScore를 더 끌어올렸다. 반대로 쉬운 과제부터 시작하는 curriculum은 오히려 점수를 크게 떨어뜨렸다.'}
],

diagram:{type:'split', cap:'서로 다른 형식의 10개 과제를 모두 (질문, 문맥, 답) 텍스트로 바꿔 하나의 모델에 넣는다.',
 from:{t:'NLP 과제 10종', s:'번역·요약·NLI 등'},
 branches:[
  {t:'SQuAD',s:'질문 답하기'},
  {t:'IWSLT',s:'기계번역'},
  {t:'CNN/DM',s:'요약'},
  {t:'WikiSQL',s:'SQL 생성'},
  {t:'MWSC',s:'대명사 해소'}
 ],
 join:'모두 (질문,문맥,답) 텍스트로 통일 후 MQAN 하나로 학습'
},

math:[
 {expr:'p(w) = γ·p_vocab(w) + (1-γ)·[ λ·p_context(w) + (1-λ)·p_question(w) ]',
  tex:'p(w_t)=\\gamma\\,p_v(w_t)+(1-\\gamma)\\bigl[\\lambda\\,p_c(w_t)+(1-\\lambda)\\,p_q(w_t)\\bigr]',
  d:'디코더가 매 스텝 만드는 최종 출력 분포. `γ`는 "고정 어휘에서 생성할지 vs 복사할지"를, `λ`는 "문맥에서 복사할지 vs 질문에서 복사할지"를 결정하는 학습된 게이트다.'},
 {expr:'decaScore = 10개 과제별 지표(각 0~100)의 합',
  tex:'\\text{decaScore}=\\sum_{i=1}^{10} m_i,\\quad m_i\\in[0,100]',
  d:'과제마다 다른 지표(EM, F1, BLEU, dsEM 등)를 그대로 0~100 스케일로 더해 0~1000 사이 단일 점수로 만든 것. 가중치 없는 단순 합이라 지표 간 스케일 차이의 왜곡 가능성은 남는다.'}
],

numbers:[
 {k:'통합 과제 수', v:'10개', d:'QA·번역·요약·NLI·감성분석·SRL·관계추출·대화상태추적·의미파싱·대명사해소'},
 {k:'decaScore (fully-joint)', v:'562.7', d:'MQAN(+QPtr)을 10개 과제 동시학습, S2S 멀티태스크 기준선 473.6보다 89점 높음'},
 {k:'decaScore (anti-curriculum)', v:'571.7', d:'SQuAD만 먼저 학습한 뒤 합치는 전략이 fully-joint보다 더 좋음'},
 {k:'WikiSQL 단일과제 SOTA', v:'lfEM 72.4% · 실행정확도 80.4%', d:'decaNLP용으로 설계된 MQAN이 단일 과제로도 당시 최고 기록 경신'}
],

impact:'decaNLP는 "과제를 구조가 아니라 자연어 질문으로 지정한다"는 아이디어를 실제로 구현해, 하나의 모델이 과제 전용 모듈 없이도 서로 다른 형식의 과제를 넘나들 수 있음을 보였다. 이 발상은 2년 뒤 [T5](#/p/t5)가 사실상 모든 NLP 과제를 `text-to-text`로 통일하며 사전학습 스케일에서 완성하는 흐름의 직접적인 선례가 되었다. 다만 decaNLP는 사전학습 없이 처음부터 멀티태스크로만 학습했다는 점에서, 사전학습 후 통일된 포맷으로 미세조정하는 이후 패러다임과는 학습 방식이 다르다.',

legacy:[
 '**[T5](#/p/t5)의 `text-to-text` 통일**이 decaNLP의 (질문,문맥,답) 아이디어를 사전학습 스케일로 확장한 직계 후속',
 '**질문 형태의 과제 지정**이 이후 지시조정(instruction tuning)·프롬프트 기반 멀티태스크 학습의 초기 형태로 재조명됨',
 '**anti-curriculum 학습 전략**의 반직관적 결과는 이후 멀티태스크·커리큘럼 학습 연구에서 자주 인용되는 사례가 됨',
 '**pointer-generator의 다중화**(문맥+질문 복사)는 이후 여러 복사원을 다루는 생성 모델 디코더 설계에 참고됨'
],

pitfalls:[
 '**decaNLP는 사전학습 모델이 아니다.** [T5](#/p/t5)와 달리 대규모 사전학습 없이 10개 과제 데이터만으로 처음부터 학습한 것이라, 요즘 기준의 "통일된 사전학습 모델"과는 출발점이 다르다.',
 '**decaScore는 가중치 없는 단순 합이다.** 과제별 지표 스케일과 난이도가 다른데 동일 가중치로 더하므로, 점수 상승이 특정 쉬운 과제에 치우친 결과일 수 있다.',
 '**커리큘럼 전략이 반직관적이라 일반화하기 어렵다.** anti-curriculum이 이 10개 과제 조합에서 잘 작동했다고 해서, 다른 과제 집합에서도 같은 순서가 최선이라는 보장은 없다.'
],

figures:[
 {f:'fig1-tasks.png',
  cap:'왼쪽·오른쪽 각 표는 서로 다른 과제(요약·번역·NLI·감성분석 / SRL·개체 질의응답·대화상태추적·SQL생성·대명사해소)가 어떻게 동일한 (Question, Context, Answer) 형식으로 바뀌는지 보여준다. 답의 색이 빨강이면 문맥에서, 초록이면 질문에서, 파랑이면 고정 어휘에서 복사·생성된 것.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-mqan.png',
  cap:'왼쪽 두 스택(Question·Context)이 인코딩→정렬→coattention→self-attention을 거쳐 최종 표현이 되고, 오른쪽 디코더가 그 표현에 대한 attention으로 Question Pointer·Context Pointer·Vocabulary Distribution 세 분포를 만든 뒤 게이트(λ, γ)로 섞어 다음 토큰을 낸다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'We cast all tasks as question answering over a context.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1806.08730 — The Natural Language Decathlon', u:'https://arxiv.org/abs/1806.08730'},
 {t:'decaNLP 코드 (GitHub, Salesforce)', u:'https://github.com/salesforce/decaNLP'}
]
});
