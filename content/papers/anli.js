WIKI.paper({
slug:'anli',
venue:'ACL 2020',
authors:'Nie, Williams, Dinan, Bansal, Weston, Kiela (UNC Chapel Hill · Facebook AI Research)',
arxiv:'1910.14599',

tldr:'사람이 현재 최고 모델을 직접 속이는 문장을 만들고, 그 문장으로 모델을 재학습시키기를 3라운드 반복해 만든 자연어추론(NLI) 벤치마크. 정적인 벤치마크가 금방 포화되는 문제에 대해 "끝나지 않는" 데이터 수집 절차 자체를 제안했다.',

context:'2018~2019년 NLU 벤치마크는 수명이 급격히 짧아지고 있었다. MNIST가 "인간 수준"에 도달하기까지 15년, ImageNet은 7년 걸렸지만, [GLUE](#/p/glue)는 [BERT](#/p/bert) 등장 이후 채 몇 달 만에 [SuperGLUE](#/p/superglue)로 교체해야 했다. 동시에 SNLI·MNLI 같은 NLI 데이터셋에 통계적 허점(spurious pattern)이 있어, 모델이 실제 추론 없이 표면적 단서만으로 높은 점수를 낸다는 연구도 쌓이고 있었다. 저자들의 질문은 두 가지였다 — **더 오래가는 벤치마크를 만들 수 있는가**, 그리고 **현재 모델이 벤치마크 점수만큼 정말 잘하는가**.',

ideas:[
 {h:'HAMLET: 사람이 모델을 속이는 문장을 직접 쓴다',
  lead:'작성자가 현재 모델을 오분류시키는 가설 문장을 만들고, 검증자가 정답을 확인한다.',
  d:'Human-And-Model-in-the-Loop Enabled Training(HAMLET) 절차는 4단계다. (1) 작성자가 맥락(context)과 목표 라벨을 보고 현재 모델을 속이는 가설(hypothesis)을 쓴다. (2) 모델이 그 문장에 예측을 낸다. (3) 모델이 틀린 문장만 다른 사람 검증자 2명 이상이 정답을 재확인한다 — 검증에 실패하면 버린다. (4) 검증된 오분류 문장을 학습 데이터에 넣어 다음 라운드의 더 강한 모델을 만든다.',
 },
 {h:'라운드가 갈수록 모델도 세지고 시험도 어려워진다',
  lead:'라운드 1은 [BERT](#/p/bert)-Large, 라운드 2·3은 갈수록 강한 [RoBERTa](#/p/roberta) 앙상블을 상대로 문장을 만든다.',
  d:'라운드 1은 SNLI+MNLI로 학습한 BERT-Large를 속이는 문장(위키피디아 맥락)을 모았다. 라운드 2는 SNLI+MNLI+FEVER로 학습한 RoBERTa 앙상블을 상대로, 라운드 3은 그 위에 라운드 1·2 데이터까지 더해 재학습한 RoBERTa를 상대로 문장을 모았다. 대상 모델이 세질수록 검증된 오류율이 낮아지는 것이 곧 "더 어려워졌다"는 증거다.',
 },
 {h:'"이기는" 문장만 개발·테스트셋에 넣는다',
  lead:'모델이 맞힌 문장은 학습셋에, 모델이 틀리고 검증까지 통과한 문장만 dev/test에 들어간다.',
  d:'이렇게 하면 테스트셋 자체가 "당대 최고 모델도 실패하는 사례"로만 구성된다. 정적 벤치마크처럼 쉬운 문제가 섞여 점수가 쉽게 포화되는 일이 구조적으로 줄어든다.'},
 {h:'문장을 왜 틀렸다고 생각하는지 이유도 함께 받는다',
  lead:'작성자에게 오분류 이유(reason)를 함께 쓰게 해 오류 유형을 분석할 수 있게 한다.',
  d:'수집된 이유는 표준(Standard)·어휘적(Lexical)·까다로운 추론(Tricky)·근거 필요(reasoning/외부 지식) 등으로 분류됐다. 라운드가 진행될수록 Tricky·Lexical 비중이 늘어, 사람이 점점 더 교묘한 함정을 찾아낸다는 것을 보여준다.'},
 {h:'끝나지 않는(never-ending) 데이터 수집',
  lead:'이 절차를 계속 반복하면 벤치마크가 모델을 뒤쫓는 게 아니라 모델을 계속 앞서갈 수 있다.',
  d:'저자들은 이 방식을 일회성 데이터셋이 아니라 **절차**로 제시한다. 모델이 강해지면 다시 라운드를 돌려 새 테스트셋을 만들면 되므로, 원리적으로 벤치마크가 영원히 포화되지 않는 "움직이는 표적"이 된다.'}
],

diagram:{type:'loop', cap:'HAMLET 한 라운드. 검증된 오분류 문장만 다음 라운드 학습 데이터로 들어가 순환한다.',
 center:'라운드 반복 → 모델 강화',
 nodes:[
  {t:'작성자', s:'모델을 속이는 가설 작성'},
  {t:'모델 예측', s:'맞음/틀림 판정'},
  {t:'검증자', s:'2명 이상 정답 재확인'},
  {t:'분리 저장', s:'틀린 것만 dev/test', acc:true},
  {t:'재학습', s:'다음 라운드 기반 모델'}
 ]},

numbers:[
 {k:'라운드별 규모', v:'~19k → ~47k → ~103k', d:'R1(BERT-Large) → R2 → R3(RoBERTa 앙상블), 갈수록 수집 난도 상승'},
 {k:'라운드별 검증 오류율', v:'18.5%(R1 계열 최종) 안팎', d:'모델이 세질수록 사람이 속이는 데 필요한 시도 수·시간이 늘어남'},
 {k:'RoBERTa(S,M,F,ANLI) 정확도', v:'A1 73.8 · A2 48.9 · A3 44.4', d:'같은 모델이 라운드 3(가장 최근·어려운 데이터)에서 가장 크게 떨어짐'},
 {k:'ANLI 전체 테스트', v:'53.7% (RoBERTa)', d:'A1+A2+A3 통합 테스트셋, SNLI(92.6%)·MNLI(91.0%)와 대조적으로 낮음'},
 {k:'같은 모델의 SNLI/MNLI', v:'92.6% / 91.0%', d:'기존 정적 벤치마크에서는 이미 포화 수준의 점수'}
],

impact:'ANLI 학습 데이터를 더하면 SNLI·MNLI 자체 성능도 떨어지지 않으면서 어려운 사례에 대한 강건성이 올라간다는 것을 보여, "적대적 데이터를 더하면 일반 성능이 희생된다"는 우려를 반박했다. 이후 다이나벤치([Dynabench](https://dynabench.org))로 이어지는 human-in-the-loop 동적 벤치마킹 흐름의 대표 사례가 됐다. 다만 이 절차는 사람이 매 라운드 새 문장을 직접 작성해야 하므로 수집 비용이 순수 알고리즘 필터링보다 훨씬 크다.',

legacy:[
 '**동적 벤치마크 계열의 표준 참조** — 정적 리더보드가 포화되는 문제에 대한 해법으로 이후 여러 태스크(QA, 혐오발화 탐지)가 같은 human-and-model-in-the-loop 절차를 채택',
 '**적대적 데이터 수집의 두 갈래로 갈라짐** — 사람이 직접 문장을 쓰는 ANLI 방식과, 알고리즘이 후보를 걸러내는 [HellaSwag](#/p/hellaswag)의 AFLite 방식이 이후 나란히 인용됨',
 '**설명(reason) 라벨링의 선례** — 오분류 이유를 함께 수집하는 방식이 이후 NLI 해석가능성 연구의 데이터로 재사용',
 '**"높은 벤치마크 점수 ≠ 강건한 이해"라는 경고가 이후 [GLUE](#/p/glue) 계열 비판의 근거로 반복 인용**'
],

pitfalls:[
 '**ANLI는 SNLI/MNLI를 대체하지 않는다.** 논문의 최종 모델도 ANLI로만 학습하지 않고 S+M+F+ANLI를 합쳐 쓴다 — ANLI는 보강용 어려운 사례 집합이지 전체 학습 데이터가 아니다.',
 '**HellaSwag의 적대적 필터링(AFLite)과 다른 메커니즘이다.** ANLI는 **사람**이 매번 새 문장을 창작하지만, [HellaSwag](#/p/hellaswag)는 기존 후보들 중 **분류기 앙상블이 쉽게 맞히는 것을 알고리즘으로 골라 제거**한다 — 사람이 개입하는 지점이 다르다.',
 '**"모델이 세질수록 검증 오류율이 낮아진다"는 상대적 지표다.** 절대적인 사람 정확도 상한(ceiling)은 논문에 별도로 보고되지 않으므로, 라운드 간 난이도를 다른 논문의 human accuracy 수치와 직접 비교하면 안 된다.'
],

figures:[
 {f:'fig1-hamlet.png',
  cap:'왼쪽 점선 상자(Collection Phase): 작성자가 Target Label·Context를 보고 Hypothesis를 쓰면(①) 모델이 Prediction을 내고(②), 모델이 틀린 것만 Verifier가 Agree/Disagree로 재확인한다(③, 주황 화살표). 오른쪽(Training Phase): 검증된 오류만 Dev/Test로, 나머지는 Train으로 들어가 모델을 재학습(④, 빨간 화살표)한 뒤 다음 라운드로 넘어간다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We introduce a new large-scale NLI benchmark dataset, collected via an iterative, adversarial human-and-model-in-the-loop procedure.',
  src:'Abstract, p.1'},
 {t:'The data collection method can be applied in a never-ending learning scenario, becoming a moving target for NLU, rather than a static benchmark that will quickly saturate.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1910.14599 — Adversarial NLI', u:'https://arxiv.org/abs/1910.14599'},
 {t:'GitHub — facebookresearch/anli', u:'https://github.com/facebookresearch/anli'},
 {t:'Dynabench demo', u:'https://dynabench.org'}
]
});
