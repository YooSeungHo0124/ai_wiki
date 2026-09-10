WIKI.paper({
slug:'distilbert',
venue:'NeurIPS 2019 Workshop (EMC2)',
authors:'Sanh, Debut, Chaumond, Wolf (Hugging Face)',
arxiv:'1910.01108',

tldr:'[지식 증류](#/p/distillation)를 사전학습 단계에 적용해 [BERT](#/p/bert)를 **40% 작고 60% 빠르게** 만들면서 언어 이해 성능의 **97%**를 유지한 모델. 태스크별로 증류하던 기존 관행을 범용 사전학습 단계로 옮겨, 배포용 경량 encoder의 사실상 표준이 됐다.',

context:'2019년 NLP는 사전학습 모델을 계속 키우는 방향으로 갔다 — BERT-large 340M에서 MegatronLM 8300M까지, 반 년 사이 파라미터가 20배 넘게 늘었다. 문제는 이 모델들을 온디바이스·저지연 서비스에 그대로 쓸 수 없다는 것이다. 기존 증류 연구는 대부분 **이미 미세조정된 특정 태스크용 모델**을 압축했는데, 그러면 태스크마다 증류를 새로 해야 한다. 이 논문은 질문을 바꾼다 — **사전학습 자체를 증류로 하면**, 한 번의 압축으로 BERT처럼 여러 태스크에 범용으로 미세조정 가능한 작은 모델을 얻을 수 있지 않을까?',

ideas:[
 {h:'사전학습 단계의 증류: 태스크 특화가 아니라 범용 압축',
  lead:'미세조정 전 사전학습 단계에서부터 교사의 지식을 학생에게 증류한다.',
  d:'교사(BERT-base)의 MLM 출력 분포를 학생(DistilBERT)이 그대로 흉내 내도록 마스킹된 코퍼스 위에서 증류한다. 학생은 사전학습이 끝난 뒤 BERT와 똑같이 **어떤 다운스트림 태스크로도 미세조정** 가능하다 — 태스크별 증류를 반복할 필요가 없다.'},
 {h:'삼중 손실: MLM + 증류 + 코사인',
  lead:'MLM 손실에 소프트 타깃 증류 손실과 은닉벡터 코사인 손실을 더한다.',
  d:'`L = L_MLM + L_ce + L_cos` 세 항의 선형결합을 쓴다. `L_ce`는 교사·학생의 [소프트맥스 온도](#/p/distillation)를 맞춘 출력 분포 간 교차엔트로피로, 정답 하나만이 아니라 교사가 부여한 **전체 확률 분포**(예: "beautiful [MASK]" 다음으로 day뿐 아니라 life, future도 그럴듯하다는 정보)를 전달한다. `L_cos`는 학생·교사의 은닉 상태 방향을 맞춰 표현 공간 자체를 정렬시킨다. 절제 실험에서 두 증류 손실을 빼면 성능 손실이 MLM 손실을 빼는 것보다 훨씬 크다.'},
 {h:'구조: 층 수만 절반으로, 폭은 그대로',
  lead:'은닉 차원은 유지한 채 층 수만 절반으로 줄이고 교사에서 격층 초기화한다.',
  d:'은닉 차원을 줄이는 것보다 **층 수**를 줄이는 것이 같은 파라미터 예산에서 계산 효율에 미치는 영향이 작다는 관찰에 따라, 은닉 차원(768)·헤드 수는 BERT-base와 동일하게 두고 층만 12개에서 6개로 줄였다. token-type 임베딩과 pooler도 제거한다. 학생은 무작위 초기화가 아니라 **교사의 층을 하나 걸러 하나씩** 가져와 시작하는데, 이 초기화가 없으면 수렴 자체가 어렵다.'}
],

diagram:{type:'compare', cap:'같은 BERT 구조를 어디서 압축하느냐의 차이.',
 left:{t:'기존: 태스크별 증류', items:[
   '미세조정된 교사를 압축','태스크마다 증류 반복','범용 사전학습 자산 소실']},
 right:{t:'DistilBERT: 사전학습 증류', items:[
   '사전학습 단계에서 한 번 압축','이후 어떤 태스크든 미세조정 가능','층 6개 · 교사 격층 초기화']}},

math:[
 {expr:'L = L_MLM + L_ce + L_cos',
  tex:'\\mathcal{L} = \\mathcal{L}_{\\text{MLM}} + \\mathcal{L}_{ce} + \\mathcal{L}_{\\cos}',
  d:'MLM 손실(정답 토큰), 증류 교차엔트로피(교사 분포 모방), 코사인 임베딩 손실(은닉 표현 방향 정렬) 세 항의 합. 절제 실험상 증류 관련 두 항의 기여가 가장 크다.'},
 {expr:'L_ce = -Σ_i t_i · log(s_i),   p_i = softmax(z_i / T)',
  tex:'\\mathcal{L}_{ce} = -\\sum_i t_i \\log(s_i), \\qquad p_i = \\frac{\\exp(z_i/T)}{\\sum_j \\exp(z_j/T)}',
  d:'$t_i$ 는 교사, $s_i$ 는 학생의 소프트 타깃 확률. [Hinton의 지식 증류](#/p/distillation)와 동일하게 온도 $T$ 로 분포를 부드럽게 만들어 학습에 쓰고, 추론 시에는 $T=1$ 로 되돌린다.'}
],

numbers:[
 {k:'파라미터', v:'66M', d:'BERT-base(110M) 대비 **40% 감소**, 층 6개(vs 12개)'},
 {k:'추론 속도(CPU)', v:'60% 빠름', d:'GLUE STS-B 태스크 배치1 기준, BERT-base 668초 → DistilBERT'},
 {k:'GLUE macro-score', v:'77.0', d:'BERT-base 79.5의 **약 97%** 유지 (ELMo는 68.7)'},
 {k:'SQuAD1.1 dev F1', v:'85.8', d:'BERT-base(88.5) 대비 3.9점 차이 이내'},
 {k:'모바일 추론(iPhone 7 Plus)', v:'71% 빠름', d:'토크나이징 제외, QA 모델 기준. 전체 모델 용량 207MB'},
 {k:'IMDb 정확도', v:'92.82%', d:'BERT-base(93.46%)에 근접'}
],

impact:'DistilBERT는 "사전학습 모델도 증류할 수 있고, 그러면 범용성을 잃지 않는다"는 것을 보여 지식 증류의 적용 지점을 태스크 이후에서 태스크 이전으로 옮겼다. 이후 Hugging Face `transformers` 라이브러리에 기본 포함되며 온디바이스·저지연 NLP 배포에서 가장 널리 쓰인 경량 encoder가 됐다. 같은 해 [RoBERTa](#/p/roberta)가 "더 오래·더 많이 학습해 성능을 올리는" 방향을 택한 것과 정반대로, DistilBERT는 "학습된 지식을 옮겨 크기를 줄이는" 방향을 택해 두 논문이 BERT 이후 갈라진 두 갈래를 상징적으로 보여준다.',

legacy:[
 '**Hugging Face 생태계의 기본 경량 모델** — `transformers` 라이브러리에 처음부터 포함되어 실무 배포의 기본 선택지로 자리잡음',
 '**증류 시점의 이동** — 이후 TinyBERT·MobileBERT 등 "사전학습 단계 증류" 계열 연구가 뒤따름',
 '**DeiT 등 비전 쪽 증류 사전학습** — 같은 원리가 [DeiT](#/p/deit)처럼 비전 트랜스포머의 데이터 효율적 학습에도 이식됨',
 '**압축 3형제** — [ALBERT](#/p/albert)(파라미터 공유), DistilBERT(증류), 이후의 양자화·프루닝 기법이 서로 다른 축에서 BERT를 가볍게 만드는 계열을 이룸'
],

pitfalls:[
 '**"층이 절반이니 성능도 절반 손실"이 아니다.** 격층 초기화 + 삼중 손실 덕에 성능은 97% 유지되며, 절제 실험에서 초기화를 무작위로 바꾸면 수렴 자체가 크게 나빠진다 — 초기화가 증류 손실 못지않게 중요하다.',
 '**증류 손실이 핵심이지 MLM 손실이 핵심이 아니다.** 절제 실험에서 MLM 손실을 제거해도 GLUE 점수 하락은 작지만, 두 증류 손실(`L_ce`, `L_cos`)을 제거하면 하락폭이 훨씬 크다 — "그냥 작은 BERT를 처음부터 학습해도 될 것"이라는 생각과 다르다.',
 '**CPU 60%·모바일 71%라는 수치는 특정 하드웨어·배치 크기(=1) 기준이다.** GPU·대배치 환경에서는 속도 향상 폭이 달라질 수 있어, 이 논문의 벤치마크 조건을 확인하지 않고 그대로 인용하면 과장이 될 수 있다.'
],

figures:[
 {f:'fig1-parameter-growth.png',
  cap:'2018년 4월(ELMo, 94M)부터 2019년 7월(MegatronLM, 8300M)까지 반 년 남짓 사이 사전학습 모델 파라미터 수가 90배 가까이 늘었다. 맨 오른쪽 DistilBERT(66M)만 이 상승 곡선에서 벗어나 있다 — 이 논문이 문제 삼는 흐름과 제안한 답을 한 그래프에 담은 것.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'It is possible to reduce the size of a BERT model by 40%, while retaining 97% of its language understanding capabilities and being 60% faster.',
  src:'Abstract, p.1'},
 {t:'We leverage knowledge distillation during the pre-training phase and show that it is possible to reduce the size of a BERT model by 40%... we introduce a triple loss combining language modeling, distillation and cosine-distance losses.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1910.01108 — DistilBERT', u:'https://arxiv.org/abs/1910.01108'},
 {t:'GitHub — huggingface/transformers (distillation)', u:'https://github.com/huggingface/transformers/tree/main/examples/research_projects/distillation'}
]
});
