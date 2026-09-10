WIKI.paper({
slug:'hyde',
venue:'ACL 2023',
authors:'Gao, Ma (CMU/Waterloo), Lin, Callan',
arxiv:'2212.10496',

tldr:'질의를 곧바로 임베딩하지 않고, **LLM에게 먼저 가짜 답변(문서)을 쓰게 한 뒤 그 가짜 문서를 임베딩해서 검색**한다. 라벨도, 추가 학습도 전혀 없이 [Contriever](#/p/contriever) 하나만으로 파인튜닝된 검색기에 맞먹는 제로샷 성능을 낸다.',

context:'밀집 검색은 질의 벡터와 문서 벡터의 내적으로 관련도를 계산하는데, 이 둘을 **같은 임베딩 공간**에 정확히 정렬하려면 보통 대량의 질의-문서 관련성 라벨이 필요하다. [Contriever](#/p/contriever)처럼 라벨 없이 대조학습만으로 학습한 검색기도 있지만, 짧고 단정적인 질의와 길고 서술적인 문서는 애초에 형태가 달라서("질의-문서 형태 불일치") 관련성을 벡터 유사도만으로 포착하기가 쉽지 않다. 한편 [InstructGPT](#/p/instructgpt) 같은 instruction-following LLM은 지시만 주면 특정 형식의 텍스트를 그럴듯하게 생성해낸다. 저자들은 묻는다 — 질의를 억지로 문서 공간에 끼워 맞추는 대신, **LLM이 그 질의에 대한 "가상의 문서"를 직접 써주면 어떨까?**',

ideas:[
 {h:'질의 대신 가상 문서를 임베딩한다',
  lead:'InstructGPT에게 "이 질문에 답하는 문단을 써라"라고 시킨 뒤 그 결과물을 임베딩한다.',
  d:'질의 $q$ 를 그대로 인코딩하는 대신, instruction-following LLM에 "write a passage to answer the question"이라는 지시와 질의를 함께 주고 가상의 답변 문서 $\\hat d$ 를 생성시킨다. 이 문서는 사실 관계가 틀릴 수 있고 실존하지 않지만, **질의가 아니라 문서 형태**를 하고 있다는 점이 핵심이다.'},
 {h:'대조학습 인코더가 환각을 걸러내는 손실 압축기 역할을 한다',
  lead:'Contriever로 가상 문서를 인코딩하면 틀린 세부사항은 벡터의 병목에서 씻겨나간다.',
  d:'가상 문서에는 없는 사실이나 틀린 숫자가 섞여 있을 수 있다. 하지만 문서-문서 유사도를 인코딩하도록 대조학습된 [Contriever](#/p/contriever)에 통과시키면, 저차원 벡터로 압축되는 과정에서 세부적인 오류는 사라지고 "이런 주제·문체의 문서"라는 큰 방향만 남는다. 그 벡터로 실제 코퍼스를 검색하면 진짜 관련 문서들이 모여 있는 이웃을 찾아낸다 — 최종 결과는 항상 실존 문서이므로 환각이 사용자에게 그대로 노출되지 않는다.'},
 {h:'질의-질의 유사도가 아니라 문서-문서 유사도 문제로 환원',
  lead:'질의·문서 벡터를 함께 정렬하는 대신 생성 모델이 "형태 변환"을 떠맡는다.',
  d:'기존 밀집 검색은 $\\text{sim}(q,d)=\\langle enc_q(q), enc_d(d)\\rangle$ 하나의 함수로 질의-문서 관련성 전체를 모델링해야 했다. HyDE는 이를 (1) LLM의 생성 작업과 (2) 대조 인코더의 문서-문서 유사도 작업, 두 개로 쪼갠다. 이렇게 하면 관련성 점수를 명시적으로 계산하는 단계 자체가 사라진다.'},
 {h:'라벨도 추가 학습도 필요 없다',
  lead:'InstructGPT와 Contriever 둘 다 그대로 두고 아무것도 파인튜닝하지 않는다.',
  d:'HyDE에서 학습되는 파라미터는 없다. InstructGPT는 instruction-following 정렬 단계에서만 supervision을 받았고, Contriever는 원래부터 비지도 대조학습 모델이다. 새 태스크나 새 언어로 옮길 때는 프롬프트의 지시문(예: "scientific paper passage" vs "financial article passage")만 바꾸면 된다.'}
],

diagram:{type:'flow', cap:'질의를 바로 임베딩하지 않고, LLM이 쓴 가상 문서를 거쳐서 검색한다.',
 nodes:[
  {t:'질의', s:'예: 사랑니 발치 시간?'},
  {t:'InstructGPT', s:'"답하는 문단을 써라"', acc:true, a:'가상 문서 생성'},
  {t:'가상 문서', s:'사실 오류 가능, 비실존'},
  {t:'Contriever 인코딩', s:'환각 세부사항 걸러짐', a:'벡터화'},
  {t:'실제 코퍼스 검색', s:'벡터 유사도 top-k'}
 ]},

math:[
 {expr:'v_q = f( g(q, INST) ),  g = InstructLM',
  tex:'\\hat v_{q}=\\mathbb{E}_{\\hat d \\sim g(q,\\text{INST})}\\big[f(\\hat d)\\big] \\approx \\frac{1}{N}\\sum_{k=1}^{N} f(\\hat d_k)',
  d:'질의 $q$ 와 지시문 INST를 instruction-following LM $g$ 에 넣어 가상 문서 $\\hat d$ 를 샘플링하고, 문서 인코더 $f$(=Contriever)로 인코딩한 뒤 평균을 질의 벡터로 쓴다. 실제 구현은 InstructGPT에서 문서를 여러 번 샘플링한 평균 임베딩을 사용한다.'}
],

numbers:[
 {k:'TREC DL19 nDCG@10 (라벨 없음)', v:'BM25 50.6 / Contriever 44.5 / HyDE 61.3', d:'Contriever 단독보다 크게 개선, 지도학습 DPR(62.2)에 근접'},
 {k:'TREC DL20 nDCG@10 (라벨 없음)', v:'BM25 48.0 / Contriever 42.1 / HyDE 57.9', d:'같은 표, [MS MARCO](#/p/ms-marco) 지도학습 없이'},
 {k:'BEIR 저자원 6종 평균 방향', v:'TREC-COVID 제외 전부 BM25·Contriever 능가', d:'Scifact·Arguana·FiQA·DBPedia·TREC-NEWS nDCG@10, 라벨 없는 조건'},
 {k:'BEIR TREC-COVID nDCG@10', v:'BM25 59.5 vs HyDE 59.3', d:'유일하게 HyDE가 BM25에 근소하게 뒤진 데이터셋(0.2점 차)'},
 {k:'Mr.TyDi 스와힐리 MRR@100', v:'BM25 38.9 / mContriever 38.3 / HyDE 41.7', d:'교차언어·저자원 언어에서도 라벨 없이 개선'}
],

impact:'HyDE는 "검색 품질을 올리려면 검색기를 더 학습시켜야 한다"는 전제를 깨고, **생성 모델의 능력을 검색 파이프라인에 끼워 넣는** 방식을 보여줬다. 이후 query expansion·query rewriting 계열 RAG 전처리 기법들이 HyDE의 "LLM으로 형태를 바꾼 뒤 임베딩"이라는 아이디어를 다양하게 변형해 사용했고, 특히 라벨이 전혀 없는 새 도메인에 RAG를 처음 배포할 때 쓸 수 있는 실전적 선택지를 제공했다.',

legacy:[
 '이후 다양한 **query rewriting / query expansion via LLM** 기법들이 HyDE의 "생성 후 임베딩" 구조를 재사용',
 '**멀티홉 검색·대화형 검색**으로의 확장을 저자들이 후속 과제로 직접 제시',
 '지도학습된 인코더와 결합해도(HyDE + fine-tuned encoder) 소폭 이득이 있다는 관찰이, 이후 "생성 기반 질의 재작성 + 학습된 검색기" 하이브리드 구조에 영향',
 '실무에서는 "서비스 초기(라벨 없음)엔 HyDE, 로그가 쌓이면 지도학습 검색기로 점진 전환"이라는 저자들의 제안이 콜드스타트 검색 시스템 설계 논의에 인용됨'
],

pitfalls:[
 '**HyDE가 이기는 이유는 "가상 문서가 정확해서"가 아니다.** 논문은 가상 문서가 사실 오류를 담을 수 있다고 명시하며, 관련성 판단을 LLM의 사전지식으로 대체하고 대조 인코더가 그 잡음을 걸러내는 구조이지 사실 검증 메커니즘이 아니다.',
 '**HyDE로 fine-tuned encoder(ContrieverFT)를 대체하려 하면 안 된다.** 저자들은 이 조합이 "의도된 사용법이 아니다"라고 명시했고, 약한 instruction LM을 쓰면 이미 파인튜닝된 인코더의 성능을 오히려 깎아먹을 수 있다(Table 4).',
 '**다국어에서는 생성 모델의 언어별 역량 차이가 그대로 병목이 된다.** 저·중자원 언어(한국어·일본어 등)에서는 mContrieverFT 같은 파인튜닝 모델과의 격차가 남아있는데, 이는 HyDE 자체의 결함이 아니라 InstructGPT가 해당 언어에서 상대적으로 덜 학습됐기 때문이라고 저자들이 분석했다.'
],

figures:[
 {f:'fig1-hyde-pipeline.png',
  cap:'질의(초록)와 지시문(노랑)이 GPT로 들어가 가상 문서(주황)가 나오고, 그 가상 문서를 Contriever가 인코딩해 실제 문서(파랑)를 찾아온다. 세 예시 모두 최종적으로 나오는 것은 실존 문서라는 점에 주목.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'Given a query, HyDE first zero-shot instructs an instruction-following language model to generate a hypothetical document. The document captures relevance patterns but is unreal and may contain false details.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2212.10496 — Precise Zero-Shot Dense Retrieval without Relevance Labels', u:'https://arxiv.org/abs/2212.10496'},
 {t:'texttron/hyde (공식 코드)', u:'https://github.com/texttron/hyde'}
]
});
