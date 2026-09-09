WIKI.paper({
slug:'sentence-bert',
venue:'EMNLP 2019',
authors:'Reimers & Gurevych (UKP Lab, TU Darmstadt)',
arxiv:'1908.10084',

tldr:'[BERT](#/p/bert)를 그대로 문장 임베딩에 쓰면 조합 폭발로 못 쓴다는 것을 지적하고, siamese/triplet 구조로 문장을 **독립적으로** 인코딩해 코사인 유사도만 계산하면 되게 바꿨다. 1만 문장 클러스터링이 65시간에서 5초로 줄었다.',

context:'BERT는 문장 쌍을 함께 넣는 **cross-encoder**로 문장 유사도 SOTA를 찍었다. 두 문장을 이어붙여 한 번에 transformer에 통과시키고 유사도 점수를 뽑는 방식이다. 문제는 이 구조가 클러스터링·유사도 검색처럼 **모든 쌍을 비교해야 하는 과제**에는 쓸 수 없다는 것이다. $n$개 문장에서 가장 비슷한 쌍을 찾으려면 $n(n-1)/2$번의 forward가 필요하고, $n=10{,}000$이면 약 5천만 회 — V100 GPU 한 대로 약 65시간이 걸린다. CLS 토큰이나 출력층 평균을 그냥 뽑아 코사인 유사도를 재보는 우회로도 있었지만, BERT는 문장 쌍을 함께 볼 때만 잘 작동하도록 학습돼서 이렇게 뽑은 벡터는 품질이 나쁘다(논문 실험에서 평균 상관 54.81, CLS 벡터는 29.19에 불과했다).',

ideas:[
 {h:'Siamese 구조: 문장을 따로따로 인코딩한다',
  lead:'두 문장을 가중치를 공유하는 같은 BERT에 각각 통과시켜 독립적인 벡터를 얻는다.',
  d:'cross-encoder처럼 두 문장을 이어붙이지 않고, **가중치를 공유하는 두 개의 BERT**(사실상 하나의 BERT를 두 번 호출)에 문장 A와 문장 B를 각각 넣는다. 그 결과 각 문장의 벡터는 상대 문장을 전혀 몰라도 계산되므로, 미리 인코딩해 인덱스에 저장해 두고 코사인 유사도만 나중에 비교하면 된다. $n(n-1)/2$번의 BERT forward가 $n$번의 forward + 벡터 내적으로 바뀐다.'},
 {h:'풀링: 토큰 벡터를 문장 하나로 압축',
  lead:'출력 토큰 벡터를 평균 내는 MEAN 풀링을 기본값으로 쓴다.',
  d:'BERT 자체는 문장 하나짜리 고정 크기 벡터를 내놓지 않는다. SBERT는 출력 위에 풀링을 하나 얹어 CLS 토큰 사용, 전체 토큰 평균(MEAN), 토큰별 최댓값(MAX) 세 가지를 실험했다. 기본값은 MEAN이며, 소거 실험에서 STSb 87.44로 CLS(86.62)·MAX(69.92)보다 나았다.'},
 {h:'세 가지 학습 목적함수',
  lead:'분류·회귀·triplet 세 목적함수로 SNLI/MNLI 데이터에서 미세조정한다.',
  d:'(1) 분류: $u$, $v$, $|u-v|$를 이어붙여 softmax로 함의/모순/중립을 분류. (2) 회귀: $u$와 $v$의 코사인 유사도를 직접 MSE로 STSb 점수에 맞춤. (3) triplet: anchor-positive-negative 세 문장으로 $\\max(\\lVert s_a-s_p\\rVert-\\lVert s_a-s_n\\rVert+\\epsilon,0)$을 최소화. 주 학습은 SNLI+MultiNLI 57만 쌍으로 분류 목적함수를 1 epoch 돌리는 것이 기본 레시피다.'},
 {h:'벡터 하나로 클러스터링·검색이 된다',
  lead:'인코딩을 미리 끝내 두면 이후 비교는 벡터 연산일 뿐이다.',
  d:'SBERT의 실질적 기여는 정확도 자체보다 **비용 구조**를 바꾼 것이다. 문장을 벡터로 한 번만 인코딩해 두면, 새 쌍이 추가돼도 BERT를 다시 돌릴 필요 없이 저장된 벡터끼리 코사인 유사도만 계산하면 된다. 이 성질이 이후 [DPR](#/p/dpr)의 dual-encoder 검색, [RAG](#/p/rag)의 retrieval 파이프라인과 같은 구조로 이어진다.'}
],

diagram:{type:'compare', cap:'BERT cross-encoder(위 학습에서만 쓰던 방식)와 SBERT siamese 구조의 차이.',
 left:{t:'BERT cross-encoder', items:['문장쌍 이어붙여 1회 forward','n(n-1)/2회 forward 필요','1만 문장 유사도 계산 ~65시간','사전 인코딩·캐싱 불가능']},
 right:{t:'SBERT siamese', items:['문장마다 독립적으로 1회 forward','n회 forward + 코사인 유사도','같은 작업 ~5초','벡터 미리 계산해 저장 가능']}},

math:[
 {expr:'triplet loss = max( ||s_a - s_p|| - ||s_a - s_n|| + ε, 0 )',
  tex:'\\mathcal{L}=\\max\\!\\left(\\lVert s_a-s_p\\rVert-\\lVert s_a-s_n\\rVert+\\epsilon,\\;0\\right)',
  d:'anchor $s_a$가 negative $s_n$보다 positive $s_p$에 최소 $\\epsilon$만큼 더 가깝도록 강제한다. 논문은 유클리드 거리와 $\\epsilon=1$을 썼다.'},
 {expr:'o = softmax( W_t · (u, v, |u - v|) )',
  tex:'o=\\text{softmax}\\!\\left(W_t\\,(u,\\,v,\\,|u-v|)\\right)',
  d:'분류 목적함수의 입력 특징은 두 벡터 $u,v$ 자체와 그 원소별 절댓값 차이 $|u-v|$를 이어붙인 것이다. $|u-v|$가 있어야 두 벡터의 "거리" 정보가 분류기에 직접 들어간다.'}
],

numbers:[
 {k:'클러스터링 65시간→5초', v:'10,000문장', d:'BERT cross-encoder $n(n-1)/2=49{,}995{,}000$회 forward(V100 약 65시간) vs SBERT 인코딩 ~5초 + 코사인 유사도 ~0.01초'},
 {k:'STS 평균(비지도, 미세조정만)', v:'74.89 / 76.55', d:'SBERT-NLI-base / -large, 7개 STS 태스크 Spearman ρ 평균(Table 1). BERT 평균 임베딩(54.81)·CLS(29.19)보다 크게 높음'},
 {k:'Universal Sentence Encoder 대비', v:'+3.67', d:'SBERT-NLI-large(76.55) 대비 USE(71.22), STS 평균 기준'},
 {k:'풀링 소거', v:'MEAN 87.44 > CLS 86.62 > MAX 69.92', d:'STSb 개발셋 Spearman ρ, 기본값 MEAN 채택 근거'},
 {k:'추론 속도', v:'InferSent 대비 +9% · USE 대비 +55%', d:'GPU에서 문장 인코딩 처리량 비교(문헌 보고치)'}
],

impact:'SBERT는 "BERT를 미세조정하면 유사도 검색·클러스터링이 된다"는 것을 보여 dense retrieval 계열 연구의 실질적 출발점이 됐다. 문장/구절을 **미리** 벡터로 인코딩해 인덱스에 저장하고 쿼리 시점엔 벡터 검색만 하는 구조는 [DPR](#/p/dpr)의 질문-passage dual-encoder, [REALM](#/p/realm)·[RAG](#/p/rag)의 retrieval-augmented 생성으로 그대로 이어졌다. sentence-transformers 라이브러리가 사실상 표준 도구가 되면서, 임베딩 기반 검색·중복 제거·시맨틱 캐싱 같은 실무 파이프라인의 기본 부품이 됐다.',

legacy:[
 '**dual-encoder 검색의 표준화** — [DPR](#/p/dpr)이 질문·문서를 독립 인코더로 인코딩하는 구조를 그대로 채택해 open-domain QA 검색에 적용',
 '**비지도 대조학습으로의 전환** — [SimCSE](#/p/simcse)가 NLI 라벨 데이터 의존을 버리고 dropout만으로 positive pair를 만드는 방향으로 발전시킴',
 '**늦은 상호작용 계열의 반작용** — [ColBERT](#/p/colbert)는 문장 전체를 벡터 하나로 뭉개는 손실을 지적하며 토큰 단위 late interaction으로 절충',
 '**임베딩 벤치마크 문화 정착** — STS 태스크 중심 평가가 이후 MTEB 같은 표준 임베딩 리더보드로 확장'
],

pitfalls:[
 '**임베딩 모델을 바꾸면 벡터DB 인덱스를 통째로 재구축해야 한다.** SBERT의 벡터 공간은 그 모델 고유의 좌표계라서, 다른 체크포인트로 갈아타면 기존에 저장해 둔 벡터와 코사인 유사도를 직접 비교할 수 없다 — 전체 문서를 다시 인코딩해야 한다.',
 '**MEAN 풀링이 항상 최선은 아니다.** 논문 자체가 STSb에서는 MEAN이 CLS보다 낫지만 SentEval 분류 태스크에서는 CLS·평균 임베딩이 오히려 경쟁력 있다고 보고한다(Table 5) — 태스크에 따라 재검증이 필요하다.',
 '**NLI로 학습했다고 모든 도메인에 잘 옮겨가지 않는다.** SNLI/MultiNLI는 일반 문장 함의 데이터이며, 전문 도메인(법률·의료)이나 비영어 문장에서는 별도 미세조정 없이는 성능이 크게 떨어질 수 있다.'
],

figures:[
 {f:'fig1-classification.png',
  cap:'학습 시점 구조. 두 BERT는 가중치를 공유(siamese)하며, 각각 pooling을 거쳐 u, v를 만든 뒤 (u, v, |u-v|)를 이어붙여 softmax 분류기에 넣는다 — SNLI 미세조정에 쓰는 구성.',
  src:'원문 Figure 1, p.3'},
 {f:'fig2-inference.png',
  cap:'추론 시점 구조. 분류기 없이 u와 v의 cosine-sim만 계산해 -1~1 유사도 점수를 낸다. 학습된 두 BERT는 그대로 두고 위의 분류 헤드만 떼어낸 것.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'This reduces the effort for finding the most similar pair from 65 hours with BERT / RoBERTa to about 5 seconds with SBERT, while maintaining the accuracy from BERT.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1908.10084 — Sentence-BERT', u:'https://arxiv.org/abs/1908.10084'},
 {t:'sentence-transformers (공식 구현)', u:'https://www.sbert.net/'}
]
});
