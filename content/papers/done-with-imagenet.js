WIKI.paper({
slug:'done-with-imagenet',
venue:'arXiv 2020 (preprint)',
authors:'Beyer, Hénaff, Kolesnikov, Zhai, van den Oord (Google Brain · DeepMind)',
arxiv:'2006.07159',

tldr:'[ImageNet](#/p/imagenet) 검증셋 라벨을 19개 모델의 예측과 사람 검증으로 다시 만들어 보니, 원본의 이미지당 단일 라벨 자체가 부정확한 경우가 많았다. 이 ReaL 라벨로 재평가하면 최근 모델들의 발전 폭이 원래 보고치보다 훨씬 작아진다.',

context:'2012년 [AlexNet](#/p/alexnet) 이후 8년간 [ImageNet](#/p/imagenet) top-1 정확도는 계속 올라 2020년 무렵 최고 모델은 88% 선까지 도달했다. 그런데 이 논문은 근본적인 질문을 던진다 — **정답 라벨 자체가 맞는가?** ImageNet은 한 이미지에 정확히 하나의 라벨만 허용하지만, 실제 사진에는 여러 물체가 동시에 등장하는 경우가 흔하다. 저자들은 최근 모델의 정확도 향상이 진짜 일반화 능력의 향상인지, 아니면 원래 라벨링 절차의 특이성(idiosyncrasy)에 과적합한 결과인지를 검증하려 했다.',

ideas:[
 {h:'단일 라벨이 강요하는 세 가지 실패 유형',
  lead:'다중 객체·체계적 오분류·불가피하게 모호한 클래스, 세 종류의 라벨 오류를 구분했다.',
  d:'첫째, 사진에 여러 물체가 동시에 두드러지는데도 하나만 정답으로 강제되는 경우("퍼스"가 있는 사진의 정답이 "지갑"인 경우 등). 둘째, 단일 물체만 있어도 수집 절차의 편향으로 체계적으로 틀린 라벨이 붙는 경우. 셋째, "sunglass/sunglasses", "laptop/notebook"처럼 [ImageNet](#/p/imagenet) 클래스 정의 자체가 겹쳐 사람도 구별할 수 없는 경우다.'},
 {h:'19개 모델의 예측을 후보로, 사람이 다중 선택으로 검증',
  lead:'모델 예측을 라벨 후보로 모으고 사람이 "예/아니오/모르겠음"으로 각각 판정한다.',
  d:'다양한 아키텍처·학습 목표의 모델 19개를 모아 이미지마다 원본 라벨과 각 모델의 top-1 예측을 후보로 모은다. 이 중 recall 97.1%·precision 28.3%를 내는 6개 모델 부분집합으로 후보를 이미지당 평균 7.4개로 줄인 뒤, 크라우드소싱 평가자 5명이 각 후보에 대해 "있다/없다/모르겠다"로 응답하게 했다. Dawid-Skene 방법으로 평가자별 오류율을 추정해 최종 라벨을 확정했다.'},
 {h:'ReaL accuracy: 정답 집합에 포함되면 맞은 것으로 본다',
  lead:'모델의 top-1 예측이 재검증된 라벨 **집합** 안에 있으면 정답으로 인정한다.',
  d:'기존 top-1 정확도는 모델이 복수의 타당한 라벨 중 하나를 골라도 "정답"이 단 하나뿐이라 틀렸다고 처리했다. ReaL accuracy는 한 이미지에 여러 라벨이 허용되므로, 진짜 그럴듯한 답을 내는 모델에게 불이익을 주지 않는다.'},
 {h:'초기 모델은 원본 라벨과 잘 맞지만, 최근 모델은 아니다',
  lead:'ImageNet 정확도와 ReaL 정확도의 상관관계 기울기가 초기 모델군 0.86에서 최근 모델군 0.51로 줄었다.',
  d:'모델을 ImageNet 정확도 순으로 절반씩 나눠 회귀분석한 결과, 오래된 모델(70~80%대)에서는 두 지표가 거의 선형으로 함께 움직이지만(기울기 0.86), 최근 모델(80%대 후반)에서는 그 관계가 눈에 띄게 약해졌다(기울기 0.51, $p<0.001$). 즉 최근의 ImageNet 점수 향상은 ReaL 기준으로는 그만큼 반영되지 않는다.'},
 {h:'모델이 원본 라벨보다 사람의 선호를 더 잘 맞히기 시작했다',
  lead:'상위 모델 3개의 앙상블은 ReaL 정확도 91.2%로, 원본 ImageNet 라벨 자체의 ReaL 정확도 90.0%를 넘어섰다.',
  d:'모델의 예측과 원본 라벨이 서로 다를 때 어느 쪽이 맞는지 사람에게 다시 물으면, 초기 모델은 원본 라벨보다 사람의 판단과 덜 일치했지만 최근 모델은 오히려 사람의 판단과 더 잘 일치했다. 저자들은 이것을 원본 라벨이 평가 기준으로서 수명이 다해가는 신호로 해석한다.'}
],

diagram:{type:'compare', cap:'ImageNet 원본 라벨링 방식과 이 논문이 제안한 ReaL 재평가 절차.',
 left:{t:'기존: 단일 라벨', items:['이미지당 정답 1개 강제','다중 객체 사진에 불이익','top-1 정답률로만 평가']},
 right:{t:'ReaL: 라벨 집합', items:['19개 모델 예측을 후보로 수집','5인 크라우드 검증 + Dawid-Skene','정답 집합 포함 여부로 채점']}},

numbers:[
 {k:'재검증 대상 이미지', v:'50,000 → 24,889', d:'모든 모델이 원본 라벨에 동의한 이미지는 재검증 생략'},
 {k:'라벨링 태스크 수', v:'37,988건', d:'후보 8개 초과 이미지는 WordNet 계층으로 분할'},
 {k:'최종 라벨/이미지 수', v:'57,553 라벨 · 46,837 이미지', d:'3,163개 이미지는 합의된 라벨 없음으로 제외'},
 {k:'후보 축소 모델 부분집합', v:'6개 모델 · recall 97.1% · precision 28.3%', d:'19개 전체 대신 이 6개만으로 이미지당 후보 7.4개'},
 {k:'ImageNet vs ReaL 회귀 기울기', v:'초기군 0.86 → 최근군 0.51', d:'최근 모델일수록 두 지표의 연동이 약해짐'},
 {k:'최상위 앙상블 ReaL vs 원본 라벨', v:'91.20% vs 90.02%', d:'모델이 원본 라벨 자체의 ReaL 정확도를 처음으로 추월'}
],

impact:'이 논문은 ImageNet의 신뢰성을 부정하기보다 **보정**했다. ReaL 라벨을 공개해 이후 논문들이 원본 top-1 정확도와 나란히 ReaL accuracy를 함께 보고하는 관행이 자리 잡았고, 벤치마크 정확도 격차가 실제 능력 격차인지 라벨 잡음인지를 구분해야 한다는 경각심을 남겼다. 다만 저자들은 ImageNet을 폐기하자는 것이 아니라 라벨을 고치면 여전히 강력한 벤치마크로 쓸 수 있다고 결론짓는다.',

legacy:[
 '**ReaL 라벨의 공개** — github.com/google-research/reassessed-imagenet 로 배포돼 이후 벤치마크 논문들의 보조 지표로 정착',
 '**[ImageNet](#/p/imagenet) 계보의 라벨 품질 재검토 흐름의 시초** — 이후 ImageNet-ReaL, ImageNetV2 재현성 연구 등 "벤치마크 자체를 감사하는" 연구가 이어짐',
 '**단일 라벨의 한계는 이후 멀티라벨·오픈보캐뷸러리 인식 연구의 동기로 재인용**',
 '**top-1 정확도 격차가 좁아지면서 새 비전 벤치마크([VTAB](#/p/vtab) 등) 쪽으로 평가 축이 옮겨가는 흐름과 시기적으로 맞물림**'
],

pitfalls:[
 '**ReaL accuracy는 원본 top-1 accuracy를 대체하는 새 벤치마크가 아니다.** 같은 ImageNet 검증셋 이미지에 대한 보정된 채점 방식일 뿐, 학습 데이터나 이미지 자체를 바꾼 것은 아니다.',
 '**"기울기가 낮아졌다"는 것이 최근 모델이 더 나빠졌다는 뜻이 아니다.** 오히려 ReaL 기준으로는 여전히 개선되고 있지만, 원본 ImageNet 지표가 그 개선을 온전히 반영하지 못한다는 뜻이다.',
 '**재라벨링은 검증셋(5만 장)에만 적용됐다.** 128만 장의 학습셋 라벨은 그대로이므로, 학습 데이터 자체의 라벨 잡음 문제는 이 논문의 범위 밖이다.'
],

figures:[
 {f:'fig2-relabel-examples.png',
  cap:'각 열의 빨간 글씨가 원본 ImageNet 라벨, 초록 글씨가 ReaL이 인정한 라벨(복수 가능). 예를 들어 "hammer"로만 라벨된 사진에 실제로는 스크류드라이버·전동드릴·목공 도구세트가 함께 찍혀 있고, ReaL은 이 전부를 정답으로 인정한다.',
  src:'원문 Figure 2, p.3'},
 {f:'fig4-real-vs-imagenet.png',
  cap:'x축 ImageNet 정확도, y축 ReaL 정확도. 검은 점(모델)이 실선(구형 모델군, 기울기 0.86)에서는 대각선을 잘 따르지만 점선(최근 모델군, 기울기 0.51)에서는 완만해진다. 빨간 점은 원본 ImageNet 라벨 자체의 ReaL 정확도(90.0%)로, 오른쪽 위 검은 점들이 이미 이 선을 넘어섰다.',
  src:'원문 Figure 4, p.5'}
],

quotes:[
 {t:'Yes, and no. We ask whether recent progress on the ImageNet classification benchmark continues to represent meaningful generalization, or whether the community has started to overfit to the idiosyncrasies of its labeling procedure.',
  src:'Abstract, p.1'},
 {t:'We find the original ImageNet labels to no longer be the best predictors of this independently-collected set, indicating that their usefulness in evaluating vision models may be nearing an end.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2006.07159 — Are we done with ImageNet?', u:'https://arxiv.org/abs/2006.07159'},
 {t:'GitHub — reassessed-imagenet (ReaL labels)', u:'https://github.com/google-research/reassessed-imagenet'}
]
});
