WIKI.paper({
slug:'senteval',
venue:'LREC 2018 (arXiv)',
authors:'Conneau & Kiela (Facebook AI Research)',
arxiv:'1803.05449',

tldr:'새 모델이 아니라 **평가 방법을 표준화한 도구**다. 문장 임베딩을 17개 하류 과제에 한 번에 돌리는 고정 파이프라인을 제공해, 논문마다 제각각이던 전처리·하이퍼파라미터·과제 선택을 하나로 묶었다.',

context:'2013~2017년 사이 [word2vec](#/p/word2vec)·[GloVe](#/p/glove) 이후 문장 단위의 범용 임베딩(SkipThought, InferSent 등)이 쏟아졌지만, 저자마다 자기 파이프라인으로 평가했다. 같은 SICK 데이터셋 하나도 전처리·분류기·하이퍼파라미터가 다르면 점수가 크게 흔들렸고, 데이터셋 자체도 작아서 이 차이가 논문 간 비교를 무의미하게 만들었다. 이 논문은 "SkipThought 논문이 정착시킨" 관행적인 과제 묶음을 커뮤니티 합의로 고정하고, 고정 하이퍼파라미터의 단일 파이프라인으로 감싼다. 이때는 아직 인코더를 **고정한 채 그 위에 얕은 분류기**를 얹어 평가하는 시대였고, 몇 달 뒤 나온 [GLUE](#/p/glue)가 인코더 자체를 각 과제에 **미세조정**하는 쪽으로 관행을 옮기면서 이 방식은 빠르게 저물었다.',

ideas:[
 {h:'17개 과제를 하나의 합의된 스위트로 고정',
  lead:'분류 7종·NLI/STS/Paraphrase 5종·이미지-캡션 검색까지 한 번에 돌리는 표준 세트.',
  d:'감정·주제·의견 분류(MR, CR, SUBJ, MPQA, TREC, SST-2, SST-5), 함의·의미 유사도(SICK-E, SICK-R, STS12-16, SNLI), 표현 재작성 탐지(MRPC), 이미지-캡션 검색(COCO)까지 묶었다. "무엇을 평가할지"를 매번 새로 정하지 않게 만든 것이 이 논문의 핵심 기여다.'},
 {h:'프로토콜을 고정해 하이퍼파라미터 잡음을 제거',
  lead:'분류기 종류·kfold·optimizer·batch size까지 논문 간 비교가 가능하도록 못박는다.',
  d:'분류 과제에는 Logistic Regression 또는 은닉층 1개짜리 MLP를 얹고, Adam·batch 64·10-fold cross-validation을 기본값으로 고정한다. 데이터셋이 작을수록 이런 세부 설정 차이가 점수를 크게 흔든다는 것이 저자들의 문제의식이었다.'},
 {h:'학습형 평가와 비지도 평가를 구분',
  lead:'분류/NLI는 임베딩 위에 분류기를 학습시키고, STS는 코사인 유사도만으로 사람 점수와 상관을 잰다.',
  d:'STS 계열 과제는 별도 분류기 없이 두 문장 임베딩의 코사인 거리와 사람이 매긴 0~5점 유사도의 Pearson·Spearman 상관을 그대로 비교한다. 나머지 분류·함의·재작성탐지 과제는 임베딩 위에 얕은 분류기를 학습시켜 성능을 잰다. 두 방식은 측정하는 것이 다르므로 점수를 그대로 합산 비교할 수 없다.'},
 {h:'`prepare`/`batcher` 두 함수만 구현하면 끝',
  lead:'PyTorch·TensorFlow·Theano 등 어떤 프레임워크의 인코더든 두 함수로 꽂을 수 있다.',
  d:'사용자는 데이터셋 전체를 보고 전처리를 준비하는 `prepare`와, 문장 배치를 받아 임베딩을 반환하는 `batcher`만 구현하면 된다. 나머지 다운로드·전처리·분류기 학습·점수 집계는 전부 도구가 처리한다.'},
 {h:'베이스라인 표가 곧 공용 참조점이 됨',
  lead:'GloVe/fastText 평균, SkipThought, InferSent를 같은 파이프라인으로 돌려 공정 비교표를 만들었다.',
  d:'같은 프로토콜로 재현한 baseline 수치이기 때문에, 이후 논문들이 자기 인코더를 이 표의 숫자와 직접 비교하는 관행이 생겼다. 도구 자체보다 이 "공정하게 재현된 참조 수치"가 실질적 기여였다.'}
],

diagram:{type:'split', cap:'같은 문장 인코더 하나를 고정 파이프라인에 꽂으면 17개 과제 점수가 한 번에 나온다.',
 from:{t:'문장 인코더', s:'batcher()', acc:true},
 branches:[
  {t:'분류 7종', s:'MR·CR·SST 등'},
  {t:'NLI·STS', s:'SICK·SNLI·STS12-16'},
  {t:'Paraphrase', s:'MRPC'},
  {t:'이미지-캡션 검색', s:'COCO R@K'}
 ],
 join:'전부 같은 kfold·optimizer로 채점'},

math:[
 {expr:'L_cir(x, y) = Σ max(0, α − s(Vy, Ux) + s(Vy, Uxₖ)) + Σ max(0, α − s(Ux, Vy) + s(Ux, Vyₖ′))',
  tex:'L_{cir}(x,y)=\\sum_{k}\\max(0,\\alpha-s(Vy,Ux)+s(Vy,Ux_k)) + \\sum_{k\'}\\max(0,\\alpha-s(Ux,Vy)+s(Ux,Vy_{k\'}))',
  d:'이미지-캡션 검색 과제의 pairwise ranking loss. $U,V$는 각각 캡션·이미지를 같은 임베딩 공간으로 보내는 선형 변환이고, $s$는 코사인 유사도. 정답 쌍의 유사도가 오답(negative) 쌍보다 마진 $\\alpha$ 이상 크도록 학습한다.'}
],

numbers:[
 {k:'표준 평가 과제 수', v:'17개', d:'분류 7종 + NLI·STS·Paraphrase 5종 + 이미지-캡션 검색(COCO) — 전부 같은 명령 하나로 실행'},
 {k:'SICK-E 정확도(InferSent)', v:'86.3%', d:'GloVe 평균벡터 baseline 78.5%, SkipThought 79.5%와 같은 파이프라인으로 비교 가능'},
 {k:'SNLI 규모', v:'560k 쌍', d:'표 2 기준 — NLI(entailment) 과제 학습에 쓰이는 사람이 쓴 전제-가설 쌍'},
 {k:'COCO 이미지-캡션 검색 규모', v:'565k 쌍', d:'11.3만 이미지 × 캡션 5개, Recall@{1,5,10}·median rank로 평가'},
 {k:'기본 분류기 프로토콜', v:'10-fold · Adam · batch 64', d:'`epoch_size:4`, `tenacity:5` 등 하이퍼파라미터까지 논문 전체가 공유하도록 고정'}
],

impact:'문장 임베딩이 "무엇에 좋은가"를 재는 방법 자체를 하나로 묶어, SkipThought·InferSent 이후 우후죽순으로 나오던 인코더들을 같은 잣대로 비교할 수 있게 했다. 다만 이 방식은 인코더를 **고정**한 채 얕은 분류기만 학습시키는 "frozen representation" 시대의 산물이라, 같은 해 등장한 [GLUE](#/p/glue)가 과제별로 인코더 자체를 미세조정하는 쪽으로 평가 관행을 옮기면서 곧 주류에서 밀려났다. 그럼에도 "고정 인코더 위에 얕은 분류기를 얹어 전이 성능을 잰다"는 틀 자체는 이후 문장 임베딩 전용 벤치마크에 그대로 이어졌다.',

legacy:[
 '**InferSent·SkipThought 비교표가 공용 참조점이 됨** — 이후 문장 인코더 논문들이 자기 모델을 이 표의 숫자에 직접 맞대는 관행이 굳음',
 '**[GLUE](#/p/glue)/SuperGLUE로 무게중심 이동** — "고정 인코더 + 얕은 분류기" 대신 "과제별 미세조정"이 표준이 되며 SentEval류 평가는 보조 지표로 밀려남',
 '**Sentence-BERT 등 이후 문장 임베딩 모델의 표준 평가셋으로 잔존** — 임베딩을 고정한 채 전이 성능을 재는 용도 자체는 여전히 필요했기 때문',
 '**MTEB(Massive Text Embedding Benchmark)로 확장** — LLM 시대의 임베딩 모델 경쟁이 격화되며, SentEval의 문제의식(파편화된 평가 통일)을 다국어·다과제 규모로 훨씬 키운 후속 벤치마크가 등장했다'
],

pitfalls:[
 '**분류 과제와 STS 과제는 측정 방식이 다르다.** 전자는 임베딩 위에 분류기를 학습시킨 점수, 후자는 순수 코사인 유사도의 상관계수다. 표 3·4의 숫자를 단순 평균해 "종합 점수"로 쓰면 서로 다른 것을 섞는 셈이다.',
 '**이 논문 자체는 새 SOTA를 주장하지 않는다.** Table 3/4의 GloVe·fastText·SkipThought·InferSent 수치는 재현된 baseline이지, 이 논문의 기여가 아니다. 기여는 그것들을 **같은 조건**으로 비교 가능하게 만든 파이프라인이다.',
 '**"frozen encoder + 얕은 분류기" 점수는 미세조정 성능과 다르다.** 같은 인코더라도 [GLUE](#/p/glue) 방식으로 전체를 미세조정하면 SentEval 점수보다 크게 오를 수 있어, 두 체계의 숫자를 직접 비교하면 안 된다.'
],

quotes:[
 {t:'We introduce SentEval, a toolkit for evaluating the quality of universal sentence representations.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1803.05449 — SentEval', u:'https://arxiv.org/abs/1803.05449'},
 {t:'SentEval GitHub (facebookresearch)', u:'https://github.com/facebookresearch/SentEval'}
]
});
