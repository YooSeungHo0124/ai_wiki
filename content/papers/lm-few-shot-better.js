WIKI.paper({
slug:'lm-few-shot-better',
venue:'ACL-IJCNLP 2021',
authors:'Gao, Fisch, Chen (Princeton University · MIT)',
arxiv:'2012.15723',

tldr:'175B [GPT-3](#/p/gpt3)가 아니어도, RoBERTa-large 같은 작은 언어모델에 **프롬프트 템플릿을 자동 탐색**하고 **예시(demonstration)를 잘 골라 붙이면** few-shot 미세조정이 크게 좋아진다는 것을 보인 논문(LM-BFF). 파인튜닝 대비 최대 30%p, 평균 11%p의 정확도 개선을 얻었다.',

context:'[GPT-3](#/p/gpt3)는 파라미터 업데이트 없이 프롬프트와 몇 개의 예시만으로 놀라운 few-shot 성능을 보였지만, 175B 파라미터라는 규모 자체가 현실적 장벽이었다. 저자들은 "굳이 GPT-3 규모가 아니어도, [BERT](#/p/bert)·[RoBERTa](#/p/roberta) 정도의 중간 크기 모델을 **적게 있는 라벨로 파인튜닝**하면서 GPT-3식 프롬프팅 아이디어를 결합하면 어떨까"라는 실용적 질문을 던졌다. 문제는 프롬프트 템플릿을 사람이 직접 설계하는 일이 도메인 전문성과 모델 내부에 대한 직관을 동시에 요구하는 **예술에 가까운 작업**이라는 점이었다.',

ideas:[
 {h:'프롬프트 기반 파인튜닝: 분류를 빈칸 채우기로 바꾼다',
  lead:'`[CLS] 문장. It was [MASK].`처럼 과제를 MLM 문제로 재구성해 head를 새로 학습할 필요를 없앤다.',
  d:'표준 파인튜닝은 `[CLS]` 표현 위에 새 분류 head를 얹어 처음부터 학습해야 해서 데이터가 적으면 불안정하다. 대신 [MASK] 자리에 채워질 단어("great"/"terrible")를 라벨에 매핑하는 프롬프트 형식으로 문제를 바꾸면, 사전학습 때 이미 쓰던 MLM head를 그대로 재사용할 수 있어 적은 데이터로도 안정적이다.'},
 {h:'T5로 프롬프트 템플릿을 자동 생성',
  lead:'사람이 일일이 문구를 고르는 대신, T5의 spans-fill 생성 능력으로 템플릿 후보를 자동으로 뽑는다.',
  d:'학습 예시 $(x_{in}, y)$ 를 T5 입력 형식으로 바꿔 템플릿 토큰을 채우도록 생성시키고, 넓은 beam search로 여러 후보를 뽑은 뒤 개발셋 성능으로 최종 템플릿을 선택한다. 라벨 단어(label word) 역시 같은 방식으로 자동 탐색해, 사람이 고른 수작업 프롬프트와 맞먹거나 앞서는 결과를 냈다.'},
 {h:'예시(demonstration)를 무작위가 아니라 유사도 기반으로 고른다',
  lead:'GPT-3처럼 무작위로 32개를 붙이는 대신, 클래스마다 하나씩 뽑아 만든 여러 최소 demonstration 집합을 쓴다.',
  d:'무작위로 뒤섞인 demonstration은 컨텍스트만 길어지고 어떤 예시가 유용한지 모델이 판단하기 어렵다. 각 클래스에서 하나씩 뽑아 최소 집합을 구성하고, 입력과 **의미적으로 유사한 예시**를 우선 선택하는 샘플링 전략으로 더 판별력 있는 비교를 제공한다.'},
 {h:'분류뿐 아니라 회귀 과제까지 프롬프트 프레임으로 통일',
  lead:'STS-B 같은 연속값 예측 과제도 두 라벨 단어 사이를 보간하는 방식으로 프롬프트화한 첫 시도다.',
  d:'회귀는 이산 라벨 단어로 직접 표현할 수 없으므로, 두 극단(예: "terrible"과 "great")의 확률을 보간해 연속값 점수를 만드는 방법을 제안했다. 이로써 분류-회귀를 가리지 않는 하나의 프롬프트 기반 프레임워크가 완성됐다.'}
],

diagram:{type:'compare', cap:'표준 파인튜닝과 LM-BFF의 프롬프트 기반 파인튜닝 비교.',
 left:{t:'표준 파인튜닝', items:['[CLS] 위에 새 분류 head 학습','적은 데이터에서 불안정(고분산)','프롬프트·예시 활용 없음']},
 right:{t:'LM-BFF', items:['MLM head 재사용, 새 head 없음','T5로 프롬프트 자동 탐색','유사도 기반 demonstration 첨부']}
},

numbers:[
 {k:'실험 모델·shot 수', v:'RoBERTa-large · K=16(클래스당)', d:'15개 NLP 과제(단일문장 8 + 문장쌍 7)에서 평가'},
 {k:'표준 파인튜닝 대비 개선', v:'최대 30%p, 평균 11%p', d:'같은 K=16 조건에서 프롬프트+데모 결합 결과'},
 {k:'SNLI 정확도', v:'48.4 → 79.7', d:'표준 파인튜닝 vs 프롬프트+데모(수작업 템플릿), K=16'},
 {k:'SST-2 정확도', v:'81.4 → 92.6~93.0', d:'표준 파인튜닝 vs LM-BFF(수작업/자동 템플릿+데모)'},
 {k:'GPT-3 in-context 대비', v:'대부분 과제에서 LM-BFF가 우세', d:'파라미터 업데이트 없는 RoBERTa-large in-context와 비교(같은 모델, 다른 학습 방식)'},
 {k:'예외 사례', v:'CoLA는 표준 파인튜닝(33.9)이 LM-BFF(9.3~21.8)보다 우세', d:'문법성 판단처럼 label word로 잘 표현되지 않는 과제에서는 역전됨'}
],

impact:'"모델을 키운다" 대신 "프롬프트와 예시를 잘 고른다"로 few-shot 성능을 끌어올릴 수 있다는 것을 실증하면서, 프롬프트 엔지니어링이 GPT-3 같은 초대형 모델 전유물이 아니라 **중간 크기 모델의 파인튜닝 기법**으로도 자리잡는 계기가 됐다. 자동 템플릿 탐색과 demonstration 선택이라는 두 축은 이후 prompt tuning·prefix tuning 계열 연구가 "프롬프트를 이산 텍스트가 아니라 연속 벡터로 학습하자"는 다음 단계로 나아가는 발판이 됐다.',

legacy:[
 '**prompt tuning·P-tuning·prefix-tuning** 등 연속 프롬프트 학습 계열이 "이산 템플릿 탐색"의 다음 단계로 이어짐',
 '**demonstration 선택 전략**(유사도 기반 샘플링)이 이후 in-context learning 예시 선택 연구의 초기 참고점이 됨',
 '회귀 과제를 label word 보간으로 프롬프트화하는 아이디어가 이후 다양한 연속값 과제의 프롬프트 설계에 재사용됨',
 '작은 모델 + 좋은 프롬프트 조합이 자원 제약 환경에서 대형 모델 in-context learning의 실용적 대안으로 자리잡음'
],

pitfalls:[
 '**모든 과제에서 프롬프트 기반이 이기는 것은 아니다.** CoLA(문법성 판단)에서는 표준 파인튜닝이 오히려 더 나았다 — label word로 잘 표현되지 않는 과제 특성 때문이다.',
 '**GPT-3의 in-context learning과 같은 것이 아니다.** LM-BFF는 파라미터를 실제로 업데이트하는 **파인튜닝** 방법이다. 파라미터 업데이트 없이 프롬프트만으로 추론하는 GPT-3 방식과 결과를 직접 동일시하면 안 된다.',
 '**K=16이라는 특정 few-shot 설정에서의 결과다.** shot 수가 달라지면 표준 파인튜닝과의 격차도 달라질 수 있어, 이 논문의 개선폭을 모든 저자원 상황에 그대로 일반화할 수는 없다.'
],

figures:[
 {f:'fig1-approach.png',
  cap:'(a) MLM 사전학습은 마스크 자리에 원래 단어를 맞히도록 학습된다. (b) 표준 파인튜닝은 `[CLS]` 위에 새 분류 head를 얹는다. (c) LM-BFF는 입력 뒤에 `It was [MASK].`같은 템플릿을 붙이고, 같은 템플릿으로 만든 다른 예시들("A fun ride. It was great.")을 데모로 이어붙인 뒤 MLM head로 그대로 라벨 단어를 예측한다 — 새 head 없이 사전학습 때 쓰던 메커니즘을 그대로 재사용하는 것이 핵심.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'Our experiments demonstrate that our methods combine to dramatically outperform standard fine-tuning procedures in this low resource setting, achieving up to 30% absolute improvement, and 11% on average across all tasks.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2012.15723 — Making Pre-trained Language Models Better Few-shot Learners', u:'https://arxiv.org/abs/2012.15723'},
 {t:'LM-BFF GitHub', u:'https://github.com/princeton-nlp/LM-BFF'}
]
});
