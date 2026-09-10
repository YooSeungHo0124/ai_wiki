WIKI.paper({
slug:'ernie',
venue:'arXiv 2019 (Baidu)',
authors:'Sun, Wang, Li, Feng et al. (Baidu Inc.)',
arxiv:'1904.09223',

tldr:'[BERT](#/p/bert)의 무작위 낱말조각 마스킹 대신 **개체(entity)·구(phrase) 단위로 통째로 마스킹**해, 모델이 개체 사이의 관계 같은 사전 지식을 암묵적으로 배우게 만든 모델. 중국어 5개 과제에서 BERT를 앞섰다.',

context:'[BERT](#/p/bert)의 masked LM은 WordPiece 낱말조각 하나를 무작위로 가려서 맞히게 한다. 문제는 "Harry Potter is a series of fantasy novels written by J. K. Rowling"에서 "Potter"만 가리면, 모델은 "Harry Potter"라는 개체 내부의 단어 공기(word collocation)만으로 쉽게 맞힐 수 있다는 점이다. Harry Potter와 J. K. Rowling 사이의 저자 관계 같은 **문장 밖 지식**은 전혀 배우지 않아도 빈칸을 채울 수 있다. 이 논문은 마스킹 단위를 낱말조각에서 개체·구 전체로 넓히면, 모델이 어쩔 수 없이 주변 개체와의 관계로부터 빈칸을 추론하게 되지 않겠냐는 질문에서 출발한다. **주의: 같은 이름의 ERNIE가 하나 더 있다(칭화대 · 지식그래프 임베딩을 직접 주입하는 버전, Zhang et al. 2019). 이 노트가 다루는 것은 Baidu의 arXiv 1904.09223이며, 지식을 임베딩으로 주입하지 않고 마스킹 전략만으로 암묵적으로 학습시킨다는 점이 다르다.**',

ideas:[
 {h:'3단계 지식 마스킹: 낱말 → 구 → 개체',
  lead:'같은 문장을 세 단계로 나눠 마스킹 단위를 점점 넓혀 가며 반복 학습한다.',
  d:'1단계 Basic-level masking은 BERT와 같은 중국어 한자 단위 15% 무작위 마스킹이다. 2단계 Phrase-level masking은 어휘분석·청킹 도구로 찾은 구(개념적 단위)를 통째로 가려 그 안의 모든 낱말을 동시에 예측하게 한다. 3단계 Entity-level masking은 사람·장소·기관 같은 개체명을 통째로 가린다. 세 단계를 거치며 "표층 통계"에서 "구·개체 단위 사전 지식"으로 학습 신호가 넓어진다.'},
 {h:'지식을 임베딩이 아니라 마스킹 전략으로 주입',
  lead:'지식그래프 벡터를 따로 모델에 넣지 않고, 무엇을 가리느냐만 바꿔 지식을 암묵적으로 학습시킨다.',
  d:'다른 지식 강화 모델들은 흔히 별도의 지식 임베딩을 입력에 더한다. ERNIE는 그렇게 하지 않고, **가릴 토큰의 경계를 개체·구 단위로 넓히는 것만으로** 개체 간 관계·개체 속성·이벤트 유형 같은 정보를 모델이 스스로 복원하게 유도한다. 구조는 표준 Transformer 인코더 그대로다.'},
 {h:'DLM: 대화 데이터로 query-response 관계를 학습',
  lead:'Baidu Tieba 대화 데이터에 query/response 세그먼트 임베딩을 부여해 진짜 대화와 가짜 대화를 구별하게 학습한다.',
  d:'Dialogue Language Model(DLM) 과제는 QRQ·QRR·QQR 같은 멀티턴 대화 구조에 대화 임베딩을 부여하고, MLM과 같은 방식으로 query·response에 걸쳐 마스킹된 토큰을 예측한다. 동시에 query나 response를 무작위 문장으로 바꿔치기한 가짜 샘플을 만들어 진짜/가짜를 판별하게 해, 대화 속 암묵적 관계를 추가로 학습시킨다.'},
 {h:'이질적 대규모 중국어 코퍼스',
  lead:'백과사전·뉴스·포럼 대화를 섞어 사전학습해 격식체뿐 아니라 구어체 지식도 흡수한다.',
  d:'중국어 위키(21M 문장), Baidu Baike(51M), Baidu 뉴스(47M), Baidu Tieba 포럼(54M)를 섞어 사전학습한다. Tieba는 Reddit과 비슷한 토론 포럼으로 DLM 과제 전용 데이터로 쓰인다. 공유 vocabulary는 유니코드 문자 17,964개다.'}
],

diagram:{type:'compare', cap:'같은 문장에서 가려지는 단위가 다르다 — BERT는 낱말조각 하나씩, ERNIE는 개체·구 전체를.',
 left:{t:'BERT: 낱말조각 마스킹', items:['낱말조각 하나씩 띄엄띄엄 마스킹','개체 내부 단어 공기로 쉽게 복원','개체 간 관계는 학습 안 돼도 됨']},
 right:{t:'ERNIE: 개체·구 단위 마스킹', items:['개체·구 전체를 통째로 마스킹','개체 전체가 가려져 주변 문맥 필요','관계·속성을 추론해야 복원 가능'],},
},

math:[],

numbers:[
 {k:'모델 크기', v:'12층 · hidden 768 · head 12', d:'`BERT-base`와 동일 크기로 맞춰 비교'},
 {k:'사전학습 코퍼스', v:'중국어 위키 21M + Baike 51M + 뉴스 47M + Tieba 54M 문장', d:'이질적 소스를 혼합'},
 {k:'XNLI 정확도', v:'78.4 (test)', d:'BERT 77.2 대비 **+1.2**'},
 {k:'MSRA-NER F1', v:'93.8 (test)', d:'BERT 92.6 대비 **+1.2**'},
 {k:'ChnSentiCorp 정확도', v:'95.4 (test)', d:'BERT 94.3 대비 **+1.1**'},
 {k:'NLPCC-DBQA F1', v:'82.7 (test)', d:'BERT 80.8 대비 **+1.9**, 5개 과제 중 최대 폭 개선'}
],

impact:'마스킹 **단위**만 바꿔도 모델이 개체 간 관계 같은 사전 지식을 상당 부분 암묵적으로 배운다는 것을 보여줬다. XNLI·LCQMC·MSRA-NER·ChnSentiCorp·NLPCC-DBQA 5개 중국어 과제 전부에서 동일 크기 BERT를 앞섰고, 특히 개체명을 지워야 답할 수 있는 cloze 테스트에서 BERT가 문맥의 다른 이름을 베껴 쓰는 오답을 내는 동안 ERNIE는 올바른 개체를 추론해 냈다. 이후 등장한 [SpanBERT](#/p/spanbert) 등 스팬(연속 구간) 단위 마스킹 계열과 함께, "무엇을 가릴 것인가"가 "어떻게 예측할 것인가"만큼 중요한 설계 축임을 보여준 사례로 인용된다.',

legacy:[
 '**마스킹 단위를 낱말에서 스팬/구로 넓힌다는 설계**가 영어권의 [SpanBERT](#/p/spanbert)(연속 스팬 마스킹)와 사실상 같은 문제의식을 독립적으로 다룸',
 'Baidu는 이후 continual multi-task 사전학습으로 확장한 `ERNIE 2.0`, 지식 강화를 더 키운 `ERNIE 3.0`을 발표하며 계열을 이어감',
 '지식그래프 임베딩을 직접 주입하는 접근(칭화대 ERNIE, `ERNIE-THU`)과 대비되는 "마스킹만으로 지식을 암묵적으로 학습"이라는 갈래를 대표하는 사례로 자주 인용됨',
 '중국어 NLP 벤치마크(XNLI 중국어 서브셋, LCQMC, MSRA-NER 등)에서 사전학습 모델을 비교하는 표준 참조점 중 하나가 됨'
],

pitfalls:[
 '**같은 이름의 다른 논문과 혼동하기 쉽다.** 이 논문(Baidu, arXiv 1904.09223)은 마스킹 전략만 바꾼 모델이고, 칭화대의 별도 논문(지식그래프 엔티티 임베딩을 Transformer에 직접 융합)도 똑같이 "ERNIE"라는 이름을 쓴다. 인용할 때 저자·소속·방법을 반드시 확인해야 한다.',
 '**실험이 전부 중국어 과제 5개에 한정된다.** 영어 GLUE 등에서의 비교는 이 논문에 없으며, 개체·구 경계 추출에 쓰는 어휘분석 도구도 중국어(및 저자들이 다룬 일부 언어) 전제로 설계됐다.',
 '구조 자체는 표준 Transformer 인코더로 [BERT](#/p/bert)와 동일하다 — 성능 개선의 원인은 아키텍처가 아니라 전적으로 **마스킹 전략과 데이터**이므로, 다른 아키텍처 개선과는 독립적으로 결합 가능하다.'
],

figures:[
 {f:'fig1-masking.png',
  cap:'같은 문장 "Harry Potter is a series of fantasy novels written by J. K. Rowling"에서 BERT(위)는 [mask] 토큰이 낱말조각 단위로 띄엄띄엄 흩어져 있어 개체 내부 공기만으로 복원 가능하지만, ERNIE(아래)는 "J. K. Rowling" 같은 개체 전체가 통째로 [mask]로 바뀌어 있어 주변 문맥에서 관계를 추론해야 복원할 수 있다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'Instead of adding the knowledge embedding directly, ERNIE implicitly learned the information about knowledge and longer semantic dependency, such as the relationship between entities, the property of a entity and the type of a event, to guide word embedding learning.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 1904.09223 — ERNIE (Baidu)', u:'https://arxiv.org/abs/1904.09223'},
 {t:'PaddlePaddle/LARK/ERNIE (GitHub)', u:'https://github.com/PaddlePaddle/LARK/tree/develop/ERNIE'}
]
});
