WIKI.paper({
slug:'youtube-dnn',
venue:'RecSys 2016',
authors:'Covington, Adams & Sargin (Google)',
tldr:'YouTube 추천을 **후보 생성(candidate generation) → 랭킹(ranking)**의 두 단계 딥러닝 파이프라인으로 재구성한 산업 논문. 추천을 수백만 클래스짜리 극단적 다중분류로 정의하고, 근사 최근접 탐색으로 서빙하는 레시피가 이후 대규모 추천 시스템의 표준 골격이 되었다.',

context:'2016년 이전 YouTube의 추천 엔진은 순위 손실(rank loss)로 학습한 [행렬 분해](#/p/mf) 방식이 주축이었다. 행렬 분해는 사용자·아이템을 각각 임베딩으로 표현하지만, 사용자 인구통계나 검색 이력 같은 이종 신호를 자연스럽게 섞기 어렵고 표현력도 두 임베딩의 내적으로 제한된다. 동시에 YouTube는 수억 명의 사용자와 계속 자라나는 수백만~수십억 규모 영상 코퍼스를 다뤄야 했다. 코퍼스 전체에 대해 매 요청마다 정교한 모델을 돌리는 것은 지연시간(수십 ms) 제약상 불가능하다. 질문은 "이종 신호를 다 쓰는 표현력 있는 모델을, 이 규모에서 어떻게 서빙 가능하게 만드는가"였다.',

ideas:[
 {h:'후보 생성 → 랭킹의 2단계 깔때기',
  lead:'수백만 개 중 수백 개를 거르는 모델과, 그 수백 개를 정밀하게 줄세우는 모델을 분리한다.',
  d:'후보 생성 네트워크는 협업 필터링 수준의 성긴 신호(시청 ID, 검색어, 인구통계)로 코퍼스 전체(수백만)에서 수백 개 후보만 골라 **재현율**을 높인다. 랭킹 네트워크는 그 수백 개에 대해서만 훨씬 풍부한 피처를 써서 **정밀도** 높은 순서를 만든다. 두 단계로 나누면 다른 소스가 만든 후보도 같은 랭커에 섞어 넣을 수 있고, 각 단계를 독립적으로 개선할 수 있다.'},
 {h:'추천을 극단적 다중분류로 재정의',
  lead:'다음에 볼 영상을 맞히는 문제를 수백만 클래스 softmax 분류로 푼다.',
  d:'사용자·문맥 임베딩 `u`와 후보 영상 임베딩 `v_i`의 내적을 모든 클래스에 대해 softmax한 확률로 다음 시청 영상을 예측한다. 명시적 평점 대신 시청 완료라는 **암묵적 피드백**을 양성 레이블로 쓰는데, 이는 명시적 피드백보다 압도적으로 많아서 롱테일 영상까지 추천할 수 있게 해준다.'},
 {h:'수백만 클래스를 감당하는 네거티브 샘플링',
  lead:'배경 분포에서 수천 개만 샘플링해 softmax를 100배 빠르게 근사한다.',
  d:'매 스텝 전체 클래스에 대해 softmax 정규화 상수를 계산하는 대신, 배경 분포에서 네거티브 클래스 몇천 개만 뽑아 중요도 가중치로 보정한 cross-entropy를 최소화한다. 대안이던 hierarchical softmax는 시도했지만 트리의 각 노드가 무관한 클래스들을 함께 분류해야 해서 정확도가 떨어졌다.'},
 {h:'example age: 학습 시점의 시간 편향을 데이터로 상쇄',
  lead:'학습 예시가 학습 기간 중 언제 발생했는지를 피처로 넣어 최신 영상 편향을 보정한다.',
  d:'몇 주치 로그로 학습하면 모델은 그 기간의 평균 시청 확률만 배워, 막 업로드된 신선한 영상의 급격한 초기 인기를 반영하지 못한다. 학습 시 "업로드 후 며칠"이라는 특징을 넣고, 서빙 시에는 이 값을 0(또는 살짝 음수)으로 고정해 "지금이 학습 구간의 맨 끝"이라고 모델에 알려준다. 이 한 가지 피처로 신규 영상 추천의 실사용 시청량이 크게 늘었다.'},
 {h:'서빙 시 softmax를 최근접 이웃 탐색으로 치환',
  lead:'추론에서는 확률 보정이 필요 없으므로 내적 공간 최근접 이웃 탐색으로 바꾼다.',
  d:'서빙 시점에는 보정된 확률값 자체가 필요 없고 순위만 있으면 되므로, softmax 계산을 **사용자 벡터와 가장 가까운 영상 벡터를 찾는 근사 최근접 이웃(ANN) 탐색**으로 바꾼다. 클래스 수에 대해 선형인 softmax 대신 sub-linear한 탐색으로 tens-of-milliseconds 지연 제약을 만족시킨다.'}
],

diagram:{type:'flow', cap:'수백만 규모 코퍼스가 두 단계를 거쳐 수십 개로 좁혀진다. 후보 생성은 재현율, 랭킹은 정밀도를 담당.',
 nodes:[
  {t:'영상 코퍼스', s:'수백만'},
  {t:'후보 생성', s:'→ 수백 개', acc:true},
  {t:'랭킹', s:'풍부한 피처 재정렬'},
  {t:'최종 노출', s:'수십 개'}
 ]},

math:[
 {expr:'P(w_t = i | U, C) = exp(v_i · u) / Σ_{j∈V} exp(v_j · u)',
  tex:'P(w_t = i \\mid U, C) = \\dfrac{e^{v_i \\cdot u}}{\\sum_{j \\in V} e^{v_j \\cdot u}}',
  d:'사용자·문맥 임베딩 `u`와 후보 영상 임베딩 `v_i`의 내적을 코퍼스 `V` 전체에 대해 softmax. 후보 생성 모델의 학습 목적함수 전체가 이 한 식이다.'},
 {expr:'weighted odds ≈ E[T](1 + P) ≈ E[T]',
  tex:'\\text{odds} \\approx E[T](1+P) \\approx E[T]\\quad (P \\text{가 작을 때})',
  d:'랭킹 모델은 클릭이 아니라 **기대 시청 시간**을 예측하려고 weighted logistic regression을 쓴다. 양성(클릭) 샘플은 시청 시간으로 가중하고 음성은 단위 가중치를 주면, 학습된 odds가 기대 시청 시간 `E[T]`에 근사한다. 추론 시 활성함수로 `exp(x)`를 써서 이 odds를 직접 얻는다.'}
],

numbers:[
 {k:'서비스 규모', v:'10억+ 사용자', d:'계속 성장하는 코퍼스에서 개인화 추천을 제공'},
 {k:'모델 규모', v:'약 10억 파라미터 · 수천억 학습 예시', d:'TensorFlow(Google Brain) 기반 분산 학습'},
 {k:'네거티브 샘플링 속도', v:'전체 softmax 대비 100배+', d:'수천 개 네거티브만 샘플링해 근사'},
 {k:'후보→최종 축소', v:'수백만 → 수백 → 수십', d:'코퍼스 → 후보 생성 → 랭킹 → 노출'},
 {k:'임베딩 구성', v:'영상·검색어 각 100만 vocab · 256차원', d:'최근 시청 50개·검색 50개까지 bag으로 평균'},
 {k:'깊이 효과', v:'1024→512→256 ReLU 3층', d:'가중 손실 41.6%(깊이 0) → 34.6%(3층)로 개선'}
],

impact:'이 논문은 이후 거의 모든 대규모 산업 추천 시스템이 채택한 **retrieval(후보 생성) + ranking(정밀 랭킹)** 2단계 구조를 명문화했다. "추천 = 극단적 다중분류"라는 관점은 임베딩 기반 검색(retrieval)을 사실상 표준 문제로 만들었고, 서빙 시 ANN을 쓰는 패턴은 이후 [Two-Tower](#/p/two-tower) 계열이 그대로 물려받았다. example age처럼 "모델이 못 배우는 분포 변화를 피처로 명시한다"는 아이디어는 다른 시계열 민감 추천 시스템에도 널리 재사용됐다.',

legacy:[
 '**후보 생성의 정식화** — 임베딩 내적 + ANN 서빙이라는 레시피가 [Two-Tower](#/p/two-tower) 모델의 직접적 전신이 됨',
 '**2단계 구조의 표준화** — retrieval/ranking 분리가 검색·광고·추천 전반의 기본 아키텍처로 굳어짐',
 '**후보군 정교화** — [DIN](#/p/din)류의 attention 기반 랭커가 이 논문의 랭킹 단계 자리를 이어받아 후보를 더 정밀하게 재정렬',
 '**암묵적 피드백·surrogate 문제 설계 논의 확산** — "무엇을 예측하게 학습시킬 것인가"가 오프라인 지표와 별개의 연구 주제로 자리잡음'
],

pitfalls:[
 '**arXiv에 없는 논문이다.** ACM RecSys 2016 프로시딩과 Google Research 저자 페이지에서만 원문을 구할 수 있어, 인용 시 DOI(`10.1145/2959100.2959190`)를 함께 적어야 한다.',
 '**"softmax 다중분류"라고 매 순간 전체 코퍼스에 대해 softmax를 계산하는 것으로 오해하기 쉽다.** 실제 학습은 네거티브 샘플링으로 근사하고, 서빙은 아예 softmax를 쓰지 않고 ANN 탐색으로 대체한다 — 학습·서빙의 계산 경로가 다르다.',
 '**example age는 "최신 영상을 무조건 우대"하는 장치가 아니다.** 학습 구간 내 실제 인기 추이를 재현하도록 돕는 피처이고, 서빙 시 0으로 고정하는 것은 "지금 시점"을 알려주는 역할이지 신선도 보너스를 주는 것이 아니다.'
],

figures:[
 {f:'fig1-funnel.png',
  cap:'video corpus(수백만)가 candidate generation을 거쳐 hundreds로, 다시 ranking을 거쳐 dozens로 좁혀진다. ranking 입력에는 candidate generation 출력뿐 아니라 video features와 other candidate sources도 함께 들어간다 — 다른 소스의 후보를 같은 랭커에 섞을 수 있다는 설계를 보여준다.',
  src:'원문 Figure 2, p.2'},
 {f:'fig2-example-age.png',
  cap:'x축은 업로드 후 경과일, y축은 예측 클래스 확률. 초록(실측 분포)은 업로드 직후 인기가 치솟았다가 감쇠하는 전형적 패턴을 보이는데, example age를 넣은 모델(빨강)은 이 곡선을 거의 그대로 추적하는 반면 baseline(파랑)은 평균값 근처에 평평하게 머문다.',
  src:'원문 Figure 4, p.3'}
],

quotes:[
 {t:'We pose recommendation as extreme multiclass classification where the prediction problem becomes accurately classifying a specific video watch wt at time t among millions of videos i (classes) from a corpus V based on a user U and context C.',
  src:'Section 3.1, p.2'}
],

links:[
 {t:'논문 PDF (UC San Diego 미러)', u:'https://cseweb.ucsd.edu/classes/fa17/cse291-b/reading/p191-covington.pdf'},
 {t:'ACM DOI — Deep Neural Networks for YouTube Recommendations', u:'https://dl.acm.org/doi/10.1145/2959100.2959190'}
]
});
