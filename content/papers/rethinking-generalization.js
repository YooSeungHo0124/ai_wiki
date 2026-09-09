WIKI.paper({
slug:'rethinking-generalization',
venue:'ICLR 2017',
authors:'Zhang, Bengio, Hardt, Recht, Vinyals (MIT · Google Brain · UC Berkeley)',
arxiv:'1611.03530',

tldr:'표준 CNN에 CIFAR10의 **진짜 라벨을 완전히 무작위 라벨로 바꿔도** 학습 정확도 100%로 외워버린다는 것을 실험으로 보였다. 그런데 그 똑같은 네트워크가 진짜 라벨에서는 일반화한다 — 그렇다면 일반화를 설명하던 고전 이론들은 애초에 틀린 질문을 하고 있었다는 뜻이다.',

context:'2016년까지 일반화를 설명하는 도구는 VC-dimension, Rademacher complexity, uniform stability 같은 **모델의 복잡도(capacity)에 기반한 경계**였다. 이런 이론의 공통 전제는 "capacity가 낮을수록, 혹은 명시적 정규화(weight decay·[dropout](#/p/dropout))가 강할수록 일반화가 잘된다"는 것이다. 그런데 실무에서는 파라미터 수가 학습 데이터보다 몇 배 많은 네트워크가 정규화 없이도 잘 일반화하는 사례가 이미 흔했다. 이 논문 이전에는 "그래도 뭔가 암묵적인 규제가 있어서겠지" 정도로 넘어갔다. 저자들은 그 직관을 직접 실험으로 무너뜨리기로 한다 — **모델이 순수한 잡음을 완벽히 외울 수 있는지**를 확인하면, capacity 기반 이론이 왜 실패하는지 명확해진다는 것이다.',

ideas:[
 {h:'무작위 라벨도 훈련 정확도 100%',
  lead:'CIFAR10 라벨을 완전히 무작위로 섞어도 표준 CNN이 훈련 오차 0에 도달한다.',
  d:'Inception·AlexNet·MLP 모두 **하이퍼파라미터를 전혀 바꾸지 않고** 무작위 라벨의 CIFAR10을 100% 정확도로 외운다. 심지어 이미지 픽셀 자체를 셔플하거나 가우시안 잡음으로 바꿔도 마찬가지다. 이것은 네트워크가 특정 입력-출력 쌍을 순수 암기(rote memorization)할 **충분한 용량**을 갖고 있음을 뜻한다. 진짜 라벨에서 얻는 일반화가 아키텍처의 어떤 근본적 제약에서 온 게 아니라는 최초의 직접 증거다.'},
 {h:'수렴은 느려질 뿐, 여전히 쉽다',
  lead:'라벨 손상 비율이 늘수록 수렴 시간은 늘지만 SGD는 여전히 전역 최적(훈련 오차 0)에 도달한다.',
  d:'라벨 손상률 $p$ 를 0에서 1까지 올리면 수렴에 걸리는 시간은 완만하게 증가하지만(Figure 1b), 최적화 자체가 실패하는 지점은 없다. 이는 "손실 지형이 국소최적에 갇혀 학습을 방해한다"는 식의 최적화 난이도 논증이 일반화의 병목이 아님을 보여준다. 최적화는 쉬웠다 — 어려운 건 **왜 이 최적해가 새 데이터에도 통하는가**라는 질문이다.'},
 {h:'명시적 정규화는 필요조건이 아니다',
  lead:'weight decay·dropout·data augmentation을 모두 꺼도 일반화 격차가 크게 벌어지지 않는다.',
  d:'Table 1에서 Inception은 augmentation과 weight decay를 전부 뺀 상태에서도 CIFAR10 테스트 정확도 85.75%를 기록한다(전부 켰을 때 89.05%). 몇 퍼센트포인트 도움은 되지만 **없어도 여전히 잘 작동**한다. 반면 같은 모델이 정규화를 켠 채로도 무작위 라벨은 완벽히 외운다 — 즉 정규화는 일반화를 보장하지도, 암기를 막지도 못한다. 저자들은 이를 "정규화는 명시적 정규화가 필수였던 볼록 최적화의 전통과 달리, **딥러닝에서는 튜닝 파라미터에 가깝다**"고 정리한다.'},
 {h:'2n+d개의 파라미터로 임의 라벨링을 표현할 수 있다',
  lead:'폭이 표본 수 정도인 2층 ReLU 네트워크는 어떤 n개 샘플의 어떤 라벨링도 표현 가능하다.',
  d:'저자들은 Theorem 1에서, $d$차원 입력 $n$개 샘플에 대해 **$2n+d$개의 가중치**를 가진 2층 ReLU 네트워크가 그 $n$개 샘플 위에서 어떤 목표 함수든 정확히 맞출 수 있음을 증명한다. 즉 파라미터 수가 표본 수 정도만 되면 표현력 관점에서 일반화를 설명할 수 없다 — 네트워크는 애초에 "외우기에 충분한" 것을 넘어 **무엇이든 표현할 수 있는** 용량을 갖는다. 그렇다면 실제로 관찰되는 일반화는 표현력이 아니라 SGD가 어떤 해를 찾아가느냐, 즉 **암묵적 정규화(implicit regularization)**의 문제로 넘어간다.'},
 {h:'선형 모델에서도 이미 답이 없다',
  lead:'과소결정된 선형회귀조차 SGD가 어떤 최소노름해로 수렴하는지가 일반화를 좌우한다.',
  d:'저자들은 문제를 극단적으로 단순화해, 파라미터가 데이터보다 많은 **선형 모델**에서도 같은 질문이 이미 미해결임을 보인다. SGD로 학습한 과소결정 선형회귀는 종종 최소 $\\ell_2$ 노름(norm) 해로 수렴하는데, 이 노름이 낮을수록 일반화가 잘된다는 관찰은 있지만 왜 SGD가 하필 그 해를 고르는지, 그리고 그것이 왜 일반화와 연결되는지는 당시 답이 없었다. 이 절은 "암묵적 정규화가 SGD의 최적화 궤적 자체에서 나온다"는 이후 연구 흐름의 출발점이 된다.'}
],

diagram:{type:'compare', cap:'같은 네트워크·같은 하이퍼파라미터가 라벨만 바뀌었을 때 보이는 대조. 이 격차를 설명하는 것이 이 논문 이후 이론의 과제가 됐다.',
 left:{t:'진짜 라벨', items:['훈련 오차 0으로 수렴','테스트 정확도 80~90%대','일반화 격차 작음']},
 right:{t:'무작위 라벨', items:['훈련 오차 0으로 수렴','테스트 정확도 ≈ 무작위 추측','일반화 격차 최대']}},

math:[
 {expr:'∃ 2-layer ReLU net with 2n+d weights that fits any labeling of n points in R^d',
  tex:'\\exists\\, f_{\\theta}\\ \\text{with}\\ |\\theta| = 2n+d\\quad\\text{s.t.}\\quad f_{\\theta}(x_i) = y_i\\ \\ \\forall i \\in \\{1,\\dots,n\\}',
  d:'Theorem 1. 표본 수 $n$ 에 선형인 파라미터 수만 있으면, 그 $n$개 표본 위에서 **어떤 목표 함수도** 정확히 맞출 수 있다. 표현력만으로는 일반화와 암기를 구분할 수 없다는 뜻.'},
 {expr:'Rademacher(H, S) grows with model capacity, but empirical models achieve R(train)=0 on noise',
  tex:'\\hat{\\mathfrak{R}}_S(\\mathcal{H}) \\;\\approx\\; 1 \\quad\\text{whenever}\\quad \\mathcal{H}\\ \\text{fits arbitrary labels of}\\ S',
  d:'무작위 라벨을 완벽히 맞출 수 있는 가설 클래스 $\\mathcal{H}$ 는 그 표본 집합 $S$ 위에서 경험적 Rademacher complexity가 최댓값 근처에 있다는 뜻이 된다. 이런 $\\mathcal{H}$ 로 유도한 일반화 경계는 공허(vacuous)해서, 진짜 라벨에서 관찰되는 작은 일반화 격차를 전혀 설명하지 못한다.'}
],

numbers:[
 {k:'CIFAR10 무작위 라벨 훈련 정확도', v:'100%', d:'Inception·AlexNet·MLP 모두 라벨을 완전히 무작위로 섞어도 도달'},
 {k:'CIFAR10 무작위 라벨 테스트 정확도', v:'≈9.8~10.6%', d:'클래스 10개 무작위 추측 수준 — 일반화가 전혀 없음을 확인'},
 {k:'Inception 진짜 라벨 테스트 정확도(정규화 전부 켬)', v:'89.05%', d:'random crop + weight decay 사용'},
 {k:'Inception 진짜 라벨 테스트 정확도(정규화 전부 끔)', v:'85.75%', d:'격차는 약 3%p — 정규화가 없어도 크게 무너지지 않음'},
 {k:'최소 표현 용량', v:'2n + d 가중치', d:'2층 ReLU 네트워크가 n개 샘플의 임의 라벨링을 표현하는 데 필요한 파라미터 수(Theorem 1)'},
 {k:'실험 아키텍처', v:'Inception V3 · AlexNet · MLP', d:'CIFAR10 + ImageNet(Inception V3)에서 검증'}
],

impact:'이 논문 이후 "왜 딥러닝이 일반화되는가"라는 질문이 이론 분야의 중심 문제로 재설정됐다. 고전적 capacity 기반 경계(VC-dimension, Rademacher complexity, uniform stability)는 무작위 라벨도 맞출 수 있는 모델 클래스에 적용하면 전부 공허한 경계가 된다는 것이 실험으로 증명됐기 때문이다. 연구의 초점은 "모델이 무엇을 표현할 수 있는가"에서 "SGD가 그 많은 해 중 **어떤 해를 실제로 찾아가는가**"(implicit bias/regularization)로 옮겨갔다. 이 질문은 [이중 하강](#/p/double-descent)·[NTK](#/p/ntk)·flat minima 연구로 이어지는 이 분야 전체의 출발점이 됐다.',

legacy:[
 '**"암묵적 정규화" 연구 계열의 기폭제** — SGD의 최적화 궤적 자체가 특정 해(예: 최소 노름, flat minima)를 편향적으로 선택한다는 후속 연구들의 문제의식이 여기서 시작',
 '**[이중 하강](#/p/double-descent)의 배경** — 파라미터가 데이터보다 많아도 잘 일반화된다는 관찰을 정량적으로 보여준 것이 이 논문, 그 현상의 곡선 형태를 그린 것이 double descent',
 '**PAC-Bayes·compression 기반 경계로의 전환** — 고전 uniform convergence 경계가 실패를 보이자, 이후 이론은 압축 가능성·flatness·PAC-Bayes 사전분포에 기반한 새 경계를 모색',
 '**"딥러닝은 왜 작동하는가"라는 질문 자체의 정당화** — 이 논문 전에는 다소 주변적이던 일반화 이론이, 이후 NeurIPS/ICLR 이론 트랙의 주류 주제가 됨'
],

pitfalls:[
 '**"정규화가 필요 없다"는 뜻이 아니다.** 저자들도 weight decay·augmentation이 테스트 정확도를 몇 %p 개선한다고 명시했다. 주장은 "정규화가 일반화의 **필요조건은 아니다**"이지 "무의미하다"가 아니다.',
 '**이 논문은 원인을 설명하지 않는다.** 무작위 라벨을 외울 수 있다는 것과 진짜 라벨에서 왜 일반화가 되는지는 별개의 질문이며, 논문 스스로도 "이것이 왜 그런지는 우리도 모른다"고 인정한다 — 문제 제기이지 해답이 아니다.',
 '**후속 이론이 이 결과를 완전히 뒤집지는 않았다.** NTK·flat minima 등은 특정 조건(극단적으로 넓은 네트워크, 특정 손실 지형)에서의 부분적 설명이며, 2017년 이후로도 딥러닝 일반화에 대한 합의된 통일 이론은 없다.'
],

figures:[
 {f:'fig1-random-labels.png',
  cap:'(a) x축은 학습 스텝(천 단위), true labels(파랑)가 가장 빨리 손실 0으로 내려가고 random labels(빨강)가 가장 늦게 내려가지만 결국 전부 0에 도달한다. (b) x축이 라벨 손상 비율 0→1로 커질수록 수렴까지 걸리는 시간(상대값)이 완만히 증가한다. (c) 같은 x축에서 테스트 오차가 손상 비율에 거의 선형으로 증가해 1.0(완전 무작위)에서 무작위 추측 수준(빨간 점선 0.9 부근)에 도달한다.',
  src:'원문 Figure 1, p.4'}
],

quotes:[
 {t:'Deep neural networks easily fit random labels.',
  src:'Section 1, p.1'},
 {t:'Explicit regularization may improve generalization performance, but is neither necessary nor by itself sufficient for controlling generalization error.',
  src:'Section 1, p.2'}
],

links:[
 {t:'arXiv 1611.03530 — Understanding Deep Learning Requires Rethinking Generalization', u:'https://arxiv.org/abs/1611.03530'},
 {t:'OpenReview (ICLR 2017)', u:'https://openreview.net/forum?id=Sy8gdB9xx'}
]
});
