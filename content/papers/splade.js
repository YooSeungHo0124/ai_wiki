WIKI.paper({
slug:'splade',
venue:'SIGIR 2021 (short paper)',
authors:'Formal, Lassance, Piwowarski & Clinchant (Naver Labs Europe)',
arxiv:'2109.10086',

tldr:'BERT의 MLM(마스크 언어모델) 헤드를 그대로 재활용해, dense 벡터가 아니라 **어휘(vocabulary) 크기의 sparse 벡터**로 질의·문서를 표현하는 검색 모델. 기존 BM25 역색인 인프라를 그대로 쓰면서 신경망 수준의 term expansion을 얻는다.',

context:'2020년 전후 first-stage retrieval의 주류는 [DPR](#/p/dpr)·[ColBERT](#/p/colbert) 같은 **dense** 표현이었다. 이들은 강력하지만 근사 최근접 이웃(ANN) 인덱스라는 새 인프라가 필요하고, BM25가 가진 정확 매칭(exact term match)·해석 가능성을 잃는다. 반대로 BM25 자체는 역색인만으로 빠르지만 어휘 불일치(vocabulary mismatch, 질의와 문서가 같은 개념을 다른 단어로 쓰는 문제)에 취약하다. SPLADE(원 논문, arXiv 2107.05720)는 이 둘을 절충해 **역색인은 그대로 쓰되 신경망이 sparse 가중치를 학습**하는 방향을 제시했고, 이 SPLADE v2 논문은 그 pooling 방식과 학습 절차를 개선해 효율-정확도 모두를 끌어올린 후속작이다.',

ideas:[
 {h:'MLM 헤드로 어휘 공간에 바로 투영한다',
  lead:'BERT의 각 토큰 출력을 MLM 예측층에 통과시켜 3만여 어휘 각각의 중요도를 얻는다.',
  d:'입력 토큰 $i$ 의 BERT 은닉 벡터 $h_i$ 를 변환 후 BERT 입력 임베딩 $E_j$ 와 내적해, 어휘 전체($|V|=30{,}522$) 각 단어 $j$ 에 대한 중요도 $w_{ij}$ 를 얻는다. 이는 BERT 사전학습에 쓰이는 MLM 예측과 정확히 같은 연산이라, **사전학습된 MLM 가중치를 그대로 초기값으로 재사용**할 수 있다는 것이 SPLADE의 핵심 관찰이다.'},
 {h:'log-saturation + max-pooling으로 문서 벡터를 합친다',
  lead:'토큰별 중요도를 $\\log(1+\\text{ReLU}(w))$ 로 누른 뒤 시퀀스 전체에서 최댓값을 취한다.',
  d:'문서의 각 입력 토큰이 어휘 단어 $j$ 에 부여하는 중요도 $\\log(1+\\text{ReLU}(w_{ij}))$ 를 구한 다음, SPLADE v2는(원 SPLADE의 합산 대신) **토큰 위치에 대해 최댓값(max pooling)**을 취해 그 단어의 최종 가중치 $w_j$ 로 삼는다. log-saturation은 한 토큰이 같은 단어에 비정상적으로 큰 가중치를 몰아주는 것을 막고, max pooling으로 바꾸자 MS MARCO MRR@10이 약 2점 오른다.'},
 {h:'term expansion: 질의에 없는 단어도 활성화된다',
  lead:'문서·질의에 등장하지 않은 관련어의 벡터 차원도 학습을 통해 켜진다.',
  d:'BM25는 문서에 실제로 등장한 단어에만 점수를 준다. SPLADE는 MLM 헤드가 "이 문맥이면 이 단어도 관련 있다"고 예측하는 능력을 그대로 물려받으므로, 예를 들어 문서에 "car"만 있어도 학습된 모델은 "vehicle" 차원에도 0이 아닌 가중치를 부여할 수 있다. 이것이 doc2query류 명시적 확장 없이도 어휘 불일치 문제를 완화하는 방식이다.'},
 {h:'FLOPS 정규화로 희소성을 직접 제어한다',
  lead:'질의·문서 벡터에 각각 다른 세기의 FLOPS 페널티를 주어 희소성-정확도를 조절한다.',
  d:'단순 $\\ell_1$ 정규화는 활성화가 특정 단어에 쏠려도 막지 못해 역색인의 포스팅 리스트가 불균형해진다. FLOPS 정규화는 배치 내 평균 활성화 확률의 제곱합을 벌점으로 줘서, 질의-문서 점수 계산에 드는 예상 곱셈 횟수 자체를 직접 줄인다. 질의용 계수 $\\lambda_q$ 와 문서용 계수 $\\lambda_d$ 를 따로 둬서, 온라인 비용에 더 민감한 질의 쪽 희소성을 더 세게 누른다.'},
 {h:'기존 역색인 인프라를 그대로 재사용한다',
  lead:'출력이 (단어, 가중치) 쌍의 sparse 벡터이므로 BM25용 inverted index 구조를 그대로 쓸 수 있다.',
  d:'SPLADE 벡터의 각 차원은 실제 어휘 단어에 대응하므로, 이미 만들어진 BM25 인프라(포스팅 리스트, WAND/MaxScore 같은 pruning 알고리즘)를 구조 변경 없이 재사용할 수 있다. dense 검색처럼 새 ANN 인덱스를 구축·운영할 필요가 없다는 것이 실무적으로 가장 큰 이점이다.'}
],

diagram:{type:'flow', cap:'SPLADE의 인코딩 경로. dense 벡터를 만드는 [Sentence-BERT](#/p/sentence-bert)류와 달리 출력이 곧 어휘 차원의 sparse 벡터다.',
 nodes:[
  {t:'토큰 시퀀스', s:'WordPiece'},
  {t:'BERT', s:'문맥화 은닉벡터 hᵢ'},
  {t:'MLM 헤드', s:'→ 30522차원 로짓', acc:true},
  {t:'log-sat + max', s:'토큰 축으로 pooling'},
  {t:'sparse 벡터', s:'대부분 0, 수십 개만 활성'}
 ]},

math:[
 {expr:'w_ij = transform(h_i)^T E_j + b_j',
  tex:'w_{ij} = \\text{transform}(h_i)^{\\top} E_j + b_j,\\quad j \\in \\{1,\\dots,|V|\\}',
  d:'토큰 $i$ 의 BERT 은닉벡터를 GeLU+LayerNorm 선형층으로 변환한 뒤, 어휘 $j$ 의 BERT 입력 임베딩 $E_j$ 와 내적한다. 이는 MLM 예측 로짓과 동일한 식이라 MLM 사전학습 가중치를 그대로 초기화에 쓸 수 있다.'},
 {expr:'w_j = max_i  log(1 + ReLU(w_ij))',
  tex:'w_j = \\max_{i \\in t} \\log\\big(1 + \\text{ReLU}(w_{ij})\\big)',
  d:'SPLADE v2(=SPLADE-max)의 pooling 식. 시퀀스의 모든 입력 토큰 $i$ 가 어휘 단어 $j$ 에 부여한 중요도 중 최댓값을 취해 그 문서/질의의 최종 $j$번째 성분으로 삼는다.'},
 {expr:'ℓ_FLOPS = Σ_j ( (1/N) Σ_i w_j^(d_i) )^2',
  tex:'\\ell_{\\text{FLOPS}} = \\sum_{j \\in V} \\bar{a}_j^2, \\qquad \\bar{a}_j = \\frac{1}{N}\\sum_{i=1}^{N} w_j^{(d_i)}',
  d:'배치 내 $N$ 개 문서에 대한 어휘 $j$ 의 평균 활성화를 제곱해 모두 더한 것으로, 질의-문서 점수 계산에 필요한 기대 곱셈 연산 수를 근사한다. 이 항을 손실에 더하면 희소성이 학습 과정에서 직접 유도된다.'}
],

numbers:[
 {k:'MRR@10 (MS MARCO dev)', v:'0.368', d:'DistilSPLADE-max, BM25 0.184 대비 두 배 가까이 상회, RocketQA(dense) 0.370과 대등'},
 {k:'NDCG@10 (TREC DL 2019)', v:'0.729', d:'DistilSPLADE-max — SPLADE(원 논문) 0.665 대비 개선'},
 {k:'BEIR 평균 NDCG@10', v:'0.500', d:'13개 데이터셋 평균, ColBERT 0.455·BM25 0.440·TAS-B 0.435 상회'},
 {k:'문서 벡터 비영(非零) 개수', v:'평균 19개', d:'MRR@10 29.6% 지점 기준 — 30522차원 중 극소수만 활성화'},
 {k:'max pooling 개선폭', v:'+2점', d:'SPLADE(합산) → SPLADE-max(최댓값) 전환만으로 MRR@10·NDCG@10 상승'},
 {k:'어휘 크기', v:'30,522', d:'BERT WordPiece vocabulary — sparse 벡터의 차원 수와 동일'}
],

impact:'SPLADE v2는 "정확도 있는 신경망 검색기를 쓰려면 인프라를 dense ANN으로 갈아엎어야 한다"는 전제에 반례를 제시했다. 기존 BM25 역색인을 그대로 두고 신경망이 학습한 sparse 가중치만 얹으면, [FAISS](#/p/faiss) 같은 별도 인덱스 없이도 BEIR 제로샷 벤치마크에서 dense·late-interaction 모델을 능가하는 결과를 냈다. 학습 가능한 term expansion이 doc2query류 생성 기반 확장을 대체할 수 있음을 보여, sparse neural retrieval을 실전 배포 가능한 선택지로 끌어올렸다.',

legacy:[
 '**SPLADE++, Efficient SPLADE**(2022) 등이 distillation·pruning으로 인덱싱·검색 속도를 더 개선',
 '**BM25 인프라와의 호환성** 덕분에 Elasticsearch·Lucene 기반 상용 검색 스택에 그대로 통합되는 사례가 늘어남',
 '**하이브리드 검색**(sparse + dense 점수 결합)이 사실상 표준 관행이 되며 SPLADE는 그 sparse 축의 대표 모델로 자리잡음',
 '**BEIR** 제로샷 벤치마크에서 sparse-neural 계열의 기준점 역할을 하며 이후 sparse retrieval 연구의 비교 대상이 됨'
],

pitfalls:[
 '**임베딩(가중치) 모델을 바꾸면 역색인을 다시 만들어야 하는 비용은 여전히 남는다.** 다만 [ColBERT](#/p/colbert)처럼 토큰마다 벡터를 저장하는 게 아니라 문서당 sparse 벡터 하나(평균 비영 성분 수십 개)만 저장하므로, 재인덱싱 비용과 저장 공간은 dense multi-vector 방식보다 훨씬 작다는 것이 실무적 차이다.',
 '**BEIR 등 벤치마크 성능이 실제 배포 도메인으로 그대로 옮겨지지 않을 수 있다.** 논문 스스로도 BEIR 일부 데이터셋(CQADupstack, Robust04 등)은 평가에서 제외했고, 학습에 쓰인 MS MARCO의 질의 스타일과 크게 다른 도메인에서는 term expansion이 오히려 노이즈를 늘릴 위험이 있다.',
 '**희소성-정확도 트레이드오프가 정규화 계수 $\\lambda_q, \\lambda_d$ 에 민감하다.** Figure 1이 보여주듯 같은 SPLADE 계열도 $\\lambda$ 값에 따라 FLOPS가 수십 배 차이 나면서 MRR@10이 크게 달라지므로, 배포 환경의 지연시간 예산에 맞춰 재튜닝이 필요하다.'
],

figures:[
 {f:'fig1-flops-tradeoff.png',
  cap:'x축이 질의당 예상 FLOPS(즉 검색 비용), y축이 MRR@10. 같은 FLOPS 예산에서 파란 원(DistilSPLADE-max)이 다른 계열보다 항상 위에 있다는 것이 distillation과 max pooling이 효율-정확도 곡선 자체를 밀어올렸다는 증거다.',
  src:'원문 Figure 1, p.4'}
],

quotes:[
 {t:'SPLADE predicts term importance – in BERT WordPiece vocabulary (|V| = 30522) – based on the logits of the Masked Language Model (MLM) layer.',
  src:'Section 3.1, p.2'},
 {t:'Overall, SPLADE is considerably improved with more than 9% gains on NDCG@10 on TREC DL 2019, leading to state-of-the-art results on the BEIR benchmark.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2109.10086 — SPLADE v2', u:'https://arxiv.org/abs/2109.10086'},
 {t:'SPLADE (원 논문, arXiv 2107.05720)', u:'https://arxiv.org/abs/2107.05720'},
 {t:'SPLADE (GitHub, naver)', u:'https://github.com/naver/splade'}
]
});
