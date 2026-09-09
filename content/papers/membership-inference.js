WIKI.paper({
slug:'membership-inference',
venue:'IEEE S&P 2017',
authors:'Shokri, Stronati, Song, Shmatikov (Cornell Tech · INRIA · Cornell)',
arxiv:'1610.05820',

tldr:'모델의 출력값(확률 벡터)만 보고 "이 데이터가 학습에 쓰였는가"를 맞히는 공격. 자기 데이터로 여러 **shadow model**을 학습시켜 in/out 출력 패턴을 흉내 낸 뒤, 그 패턴으로 target 모델을 공격하는 attack model을 훈련시킨다.',

context:'2016년경 Google Prediction API, Amazon ML 같은 "machine learning as a service"가 확산됐다. 사용자는 데이터를 업로드해 모델을 학습시키고 API로 예측만 받을 뿐, 모델 내부 구조·하이퍼파라미터·정규화 설정은 볼 수 없다. 이 논문 이전까지 프라이버시 논의는 주로 학습 알고리즘 자체(예: 노이즈를 섞는 [DP-SGD](#/p/dp-sgd) 같은 방어)에 집중돼 있었고, "블랙박스로 공개된 예측 API만으로 학습 데이터를 얼마나 캐낼 수 있는가"는 정량화되지 않았다. 저자들은 모델이 학습에 쓴 샘플과 처음 보는 샘플에 **다르게 반응**한다는 직관에서 출발해, 이 차이를 API 응답만으로 탐지하는 공격을 설계했다.',

ideas:[
 {h:'공격 목표: 멤버십 이진 분류',
  lead:'레코드 하나와 그 예측 벡터를 넣으면 in/out을 답하는 이진 분류기를 만든다.',
  d:'attack model의 입력은 (정답 레이블, target 모델이 내놓은 확률 벡터)이고 출력은 "in"(학습셋에 있었다) 또는 "out"이다. target 모델의 파라미터나 구조는 전혀 몰라도 되고, 오직 쿼리에 대한 예측 벡터만 있으면 된다. 이것이 논문 전체가 가정하는 블랙박스 위협 모델이다.'},
 {h:'Shadow model: 정답을 아는 가짜 target을 여러 개 만든다',
  lead:'target과 같은 방식으로 학습된 shadow model 여러 개를 직접 만들어 정답 라벨(in/out)을 확보한다.',
  d:'attack model을 지도학습으로 훈련하려면 "이 예측 벡터는 학습셋 멤버의 것"이라는 정답이 필요한데, target 모델에 대해서는 그 정답을 알 수 없다. 그래서 공격자는 target과 같은 서비스(같은 API)로 자기 데이터를 학습시킨 shadow model $k$개를 만든다. 이 shadow model은 자기가 직접 학습시켰으므로 어떤 레코드가 in이고 어떤 레코드가 out인지 정확히 안다. shadow model의 학습셋은 target 모델의 학습셋과 겹치지 않아야 하며(worst case 가정), shadow model끼리는 겹쳐도 된다.'},
 {h:'Attack model 훈련: in/out 출력 분포의 차이를 학습',
  lead:'각 shadow model에 학습셋과 테스트셋을 모두 질의해 in/out 라벨이 붙은 데이터셋을 만든다.',
  d:'shadow model $i$ 에 자기 학습셋을 질의하면 "in"으로, 학습에 쓰지 않은 별도 테스트셋을 질의하면 "out"으로 라벨링한다. 이렇게 모은 (예측 벡터, 클래스, in/out) 튜플들을 모아 attack model을 지도학습시킨다. 논문은 클래스마다 별도의 attack model을 두는데, 클래스에 따라 확률 벡터의 분포가 크게 다르기 때문에 이렇게 나누면 정확도가 올라간다.'},
 {h:'Shadow 학습 데이터가 없어도 합성으로 채운다',
  lead:'target 모델 자체를 오라클로 써서 그럴듯한 합성 레코드를 탐색해 만든다.',
  d:'실제 배포 환경에서는 공격자가 target과 비슷한 분포의 데이터를 갖고 있지 않을 수 있다. 논문은 target 모델에 무작위 레코드를 질의해 높은 confidence로 분류되는 입력을 언덕오르기(hill-climbing) 방식으로 탐색하는 **model-based synthesis**, 그리고 속성들의 주변 분포를 안다고 가정하는 **statistics-based synthesis** 두 방법을 제안한다. 완전 합성 데이터로도 Google 모델 기준 90% 정확도가 나왔다.'},
 {h:'공격 성공은 과적합(overfitting)과 강하게 상관된다',
  lead:'train-test 정확도 격차가 클수록 멤버십 추론 precision이 높아진다.',
  d:'모델이 학습셋에 과적합될수록 학습 샘플에 대한 출력(예: 정답 클래스에 몰린 매우 확신에 찬 확률)이 테스트 샘플의 출력과 뚜렷이 달라지고, attack model이 그 차이를 더 쉽게 구분한다. 다만 저자들은 **과적합이 유일한 원인은 아니다**라고 명시한다 — 학습 데이터의 다양성(diversity)이 낮아 모델이 그 분포에 특화되는 경우도 같은 결과를 낳는다.'}
],

diagram:{type:'flow', cap:'공격자가 shadow model들로 attack model을 훈련시킨 뒤 target 모델에 적용하는 전체 파이프라인.',
 nodes:[
  {t:'그림자 학습셋', s:'공격자가 보유/합성'},
  {t:'Shadow Model', s:'target과 동일 API, ×k'},
  {t:'in/out 라벨링', s:'학습셋=in, 테스트셋=out'},
  {t:'Attack Model', s:'클래스별 이진분류기', acc:true},
  {t:'Target 질의', s:'예측 벡터 획득'},
  {t:'멤버십 판정', s:'레코드 ∈ 학습셋?'}
 ]},

math:[
 {expr:'Pr{ (x, y) ∈ D_target^train | y_hat = f_target(x) }',
  tex:'\\Pr\\{(\\mathbf{x},y)\\in D_{\\text{target}}^{\\text{train}} \\mid \\hat{\\mathbf{y}}=f_{\\text{target}}(\\mathbf{x})\\}',
  d:'공격이 계산하는 것은 결국 이 확률이다 — 정답 레이블 $y$ 와 target 모델의 예측 벡터 $\\hat{\\mathbf{y}}$ 를 보고, 이 레코드가 target의 학습셋에 있었을 확률을 추정한다.'}
],

numbers:[
 {k:'CIFAR-10 median 정확도', v:'~0.79', d:'CNN, 클래스별 median precision (recall은 거의 1)'},
 {k:'CIFAR-100 median 정확도', v:'~1.0', d:'클래스 수가 많고 클래스당 데이터가 적어 과적합이 심함'},
 {k:'Google Prediction API', v:'median 94%', d:'구매 이력(purchase) 데이터셋, 기본 설정'},
 {k:'Amazon ML', v:'median 74%', d:'같은 데이터셋, 기본 설정 — 서비스별로 격차가 큼'},
 {k:'완전 합성 데이터 공격', v:'90%', d:'target 분포에 대한 사전지식 없이 model-based synthesis만으로 (Google)'},
 {k:'Texas 병원 퇴원기록', v:'70%+', d:'의료 데이터셋 — 민감도가 높은 도메인에서도 유효'}
],

impact:'이 논문은 "모델을 공개하면 학습 데이터가 새어나갈 수 있다"는 것을 추상적 우려가 아니라 **구체적이고 재현 가능한 공격**으로 처음 정량화했다. shadow model 기법은 이후 프라이버시 공격 연구의 표준 실험 틀이 됐고, ML-as-a-service 제공자들이 confidence 벡터를 top-k로 자르거나 엔트로피를 조정하는 등 API 응답을 제한하는 계기가 됐다. 동시에 "과적합이 프라이버시 문제이기도 하다"는 프레이밍은 이후 [DP-SGD](#/p/dp-sgd) 같은 방어 기법들이 방어해야 할 구체적 위협 시나리오를 제공했다 — DP-SGD 자체는 이 논문보다 먼저 나왔지만, 두 계열 모두 "일반화가 안 된 모델은 학습 데이터를 누출한다"는 같은 문제의식을 공유한다.',

legacy:[
 '**공격→방어의 축** — 이 논문이 드러낸 위협은 [DP-SGD](#/p/dp-sgd)처럼 학습 과정에 노이즈를 섞어 개별 샘플의 기여를 감추는 방어의 구체적 정당화 사례로 인용된다',
 '**더 강력한 추출 공격으로 확장** — 멤버십(있다/없다) 판정을 넘어 실제 학습 텍스트 문자열 자체를 복원하는 [학습 데이터 추출](#/p/extracting-training-data) 공격으로 이어졌다',
 '**섀도 모델이 표준 도구가 됨** — 이후 모델 역전(model inversion), 속성 추론(attribute inference) 등 다른 프라이버시 공격에서도 "라벨을 아는 대리 모델을 학습시켜 공격 분류기를 훈련"하는 패턴이 반복 사용된다',
 '**정량적 프라이버시 감사(auditing)의 시작점** — 이후 연구에서 멤버십 추론 정확도가 학습 알고리즘의 프라이버시 손실을 실험적으로 재는 표준 벤치마크로 자리잡았다'
],

pitfalls:[
 '**과적합이 유일한 원인이 아니다.** 저자들 스스로 명시하듯, 학습 데이터의 다양성 부족만으로도 공격이 먹힌다. "내 모델은 정규화가 잘 돼 있으니 안전하다"는 결론은 성급하다.',
 '**방어에는 비용이 따른다.** 논문이 실험한 top-k 제한·정규화 등은 공격 정확도를 낮추지만 모델의 예측 정확도도 같이 떨어진다. 프라이버시와 유용성은 이 논문의 설정에서 진짜 트레이드오프다.',
 '**실험 조건이 실제 배포보다 유리하다.** shadow model이 target과 같은 API·같은 아키텍처를 쓴다는 가정, 그리고 클래스 수가 많고 클래스당 샘플이 적은(CIFAR-100 같은) 데이터셋일수록 공격이 잘 먹힌다는 점을 감안하면, 잘 정규화된 대규모 프로덕션 모델에서는 이 논문 수치만큼의 정확도가 나오지 않는 경우가 많다.'
],

figures:[
 {f:'fig1-attack-overview.png',
  cap:'블랙박스 공격의 전체 그림. target model에 (레코드, 레이블)을 질의해 prediction 벡터를 얻고, 그 벡터와 레이블을 attack model에 넣어 "학습셋에 있었는가"를 판정한다.',
  src:'원문 Figure 1, p.4'},
 {f:'fig4-precision-cifar.png',
  cap:'CIFAR-10 CNN에 대한 클래스별 precision. 학습셋 크기(2500~15000)가 커질수록 median precision이 0.78→0.71로 떨어진다 — 학습 데이터가 많아질수록 모델이 개별 샘플을 덜 "암기"하게 됨을 보여준다.',
  src:'원문 Figure 4, p.8'}
],

quotes:[
 {t:'Overfitting is a common reason but not the only one (see Section VII).',
  src:'Section V-A, p.4'},
 {t:'In this paper, we show another harm of overfitting: the leakage of sensitive information about the training data.',
  src:'Section VIII, p.9'}
],

links:[
 {t:'arXiv 1610.05820 — Membership Inference Attacks Against Machine Learning Models', u:'https://arxiv.org/abs/1610.05820'},
 {t:'IEEE S&P 2017 원문', u:'https://ieeexplore.ieee.org/document/7958568'}
]
});
