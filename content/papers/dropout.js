WIKI.paper({
slug:'dropout',
venue:'JMLR 2014 (초기 아이디어는 arXiv 2012)',
authors:'Srivastava, Hinton, Krizhevsky, Sutskever, Salakhutdinov (U. Toronto)',

tldr:'학습 중 매 스텝마다 **은닉 유닛을 확률적으로 절반씩 꺼버리는** 것만으로 과적합이 크게 줄어든다. 테스트 때는 모두 켜고 가중치를 $p$ 배 하는 것으로, 지수적으로 많은 얇은(thinned) 신경망의 앙상블을 한 번의 forward pass로 근사한다.',

context:'2012년 전후의 신경망은 파라미터가 데이터보다 압도적으로 많았다. 대표적으로 [AlexNet](#/p/alexnet)은 6천만 파라미터를 [ImageNet](#/p/imagenet) 120만 장에 맞춘다. 이 조건에서 망은 학습 데이터의 노이즈까지 외운다. 당시 처방은 L2 weight decay, early stopping, 그리고 **앙상블**이었다. 앙상블은 확실히 잘 듣지만 모델 $k$ 개를 따로 학습시키고 추론 때 $k$ 번 돌려야 해서 큰 망에서는 현실성이 없다. 저자들이 지목한 더 근본적인 문제는 **공적응(co-adaptation)**이다 — 유닛 A가 유닛 B의 실수를 보정하는 식으로 서로 의존해 버리면, 각 유닛은 독립적으로 유용한 특징이 아니라 "특정 조합 안에서만 의미 있는 부품"이 된다. 이런 조합은 학습 데이터에는 잘 맞지만 새 데이터에서 함께 무너진다.',

ideas:[
 {h:'유닛을 무작위로 지운다 — 학습할 때만',
  lead:'매 스텝 베르누이 마스크로 다른 서브네트워크 하나를 학습시킨다.',
  d:'각 유닛을 확률 $p$ 로 유지(= $1-p$ 로 0으로 만듦)하는 베르누이 마스크를 매 미니배치, 매 샘플마다 새로 뽑는다. forward와 backward 모두 살아남은 유닛만 통과하므로, **매 스텝 서로 다른 서브네트워크 하나가 학습된다.** 구현은 활성값에 0/1 마스크를 곱하는 한 줄이며, 기존 학습 루프를 바꾸지 않는다.'},
 {h:'$2^n$ 개 망의 가중치 공유 앙상블',
  lead:'유닛 켜짐·꺼짐 조합 2ⁿ개가 가중치를 공유하며 함께 학습된다.',
  d:'유닛이 $n$ 개인 망은 켜고 끄는 조합이 $2^n$ 가지다. 논문은 dropout 학습을 이 $2^n$ 개 얇은 망들을 **가중치를 공유한 채** 조금씩 훈련시키는 것으로 해석한다. 각각은 거의 학습되지 않지만 파라미터를 공유하므로 전체는 수렴한다. 앙상블의 이득을 학습 비용 증가 없이 얻는 것이 이 해석의 핵심이다.'},
 {h:'테스트 시의 근사: 가중치에 $p$ 를 곱한다',
  lead:'모든 유닛을 켜고 가중치에 p를 곱해 앙상블 평균을 근사한다.',
  d:'$2^n$ 개 망의 예측을 실제로 평균낼 수는 없다. 대신 **모든 유닛을 켜고 나가는 가중치를 $p$ 배** 한 단일 망을 쓴다. 그러면 각 유닛의 출력 기댓값이 학습 때와 같아진다. 이 스케일링은 정확한 기하평균이 아니라 근사지만 실험적으로 매우 잘 맞고, 추론 비용이 앙상블의 $1/k$ 가 아니라 **평범한 망 한 개**로 끝난다. (현대 프레임워크는 학습 때 $1/p$ 를 곱하는 inverted dropout으로 구현해 추론 코드를 아예 건드리지 않는다.)'},
 {h:'각 유닛이 스스로 쓸모 있어지도록 강제한다',
  lead:'이웃이 언제 사라질지 몰라 각 유닛이 독립적으로 유용해진다.',
  d:'옆의 유닛이 언제 사라질지 모르므로 어떤 유닛도 특정 이웃에 의존하는 전략을 세울 수 없다. 결과적으로 각 유닛은 **혼자서도 의미 있는 특징**을 학습하게 된다. 논문의 자기부호화기 시각화에서, dropout 없이 학습한 은닉 유닛은 산만한 패턴을 보이는 반면 dropout을 쓴 유닛은 획·엣지 같은 뚜렷한 국소 구조로 정리된다.'},
 {h:'노이즈 주입이라는 더 큰 그림',
  lead:'핵심은 유닛 제거가 아니라 표현에 곱셈적 노이즈를 주는 것이다.',
  d:'베르누이 마스크 대신 평균 1인 가우시안 노이즈를 곱해도 비슷하게 동작한다는 것을 보인다(Gaussian dropout). 즉 본질은 "유닛 제거"가 아니라 **은닉 표현에 곱셈적 노이즈를 주어 해가 노이즈에 강건해지도록 만드는 것**이다. 이 관점이 이후 [batch normalization](#/p/batchnorm)의 미니배치 통계 노이즈, 데이터 증강, label smoothing을 같은 계열로 묶어 보게 했다.'}
],

diagram:{type:'compare', cap:'앙상블의 효과를 원하지만 비용은 지불하지 않는 방법. 학습 때 매번 다른 서브네트워크, 추론 때는 스케일링된 단일 망.',
 left:{t:'기존: 명시적 앙상블', items:[
  '모델 k개를 따로 학습 → 학습 비용 k배',
  '추론 때 k번 forward → 지연 k배',
  '유닛 간 공적응은 각 모델 안에서 그대로 남음',
  '큰 CNN에서는 현실적으로 불가능']},
 right:{t:'Dropout: 암묵적 앙상블', items:[
  '매 스텝 마스크 하나 = 얇은 망 하나 학습',
  '가중치 공유로 $2^n$ 개를 동시에 훈련',
  '추론은 가중치 ×p 한 단일 망, 1회 forward',
  'ImageNet·CIFAR-10 오류 모두 감소']}},

math:[
 {expr:'r_j ~ Bernoulli(p),   ỹ = r ⊙ y,   z = W ỹ + b',
  tex:'r_j \\sim \\mathrm{Bernoulli}(p), \\qquad \\tilde{y} = r \\odot y, \\qquad z = W\\tilde{y} + b',
  d:'학습 시. $r$ 은 유닛마다 독립으로 뽑는 0/1 마스크이고 $\\odot$ 은 원소별 곱. 마스크는 매 학습 샘플마다 새로 뽑는다.'},
 {expr:'테스트:  W_test = p · W',
  tex:'W_{\\text{test}} = p \\cdot W',
  d:'학습 시 유닛의 출력 기댓값이 $p\\,y$ 이므로, 추론에서 모든 유닛을 켜는 대신 가중치를 $p$ 배 해 스케일을 맞춘다. 이 한 줄이 $2^n$ 개 망의 평균을 대신한다.'},
 {expr:'max-norm:  ||w||₂ ≤ c',
  tex:'\\lVert w \\rVert_2 \\le c',
  d:'논문이 dropout과 짝지어 권장한 제약. 큰 학습률로 오래 탐색하되 가중치 노름이 $c$ 를 넘으면 되돌려 놓는다. dropout 단독보다 이 조합에서 성능이 더 좋았다.'}
],

numbers:[
 {k:'표준 유지 확률', v:'은닉 p=0.5, 입력 p=0.8', d:'$p=0.5$ 는 $2^n$ 개 마스크의 분산이 최대가 되는 값. 입력은 정보 손실이 커서 덜 지운다'},
 {k:'MNIST (fc망)', v:'1.60% → 1.35%', d:'같은 구조에 dropout만 추가. 여기에 ReLU와 max-norm 제약까지 더하면 1.06%'},
 {k:'CIFAR-10', v:'14.98% → 12.61%', d:'FC층에만 넣으면 14.32%, **합성곱층까지** 넣어야 12.61%'},
 {k:'CIFAR-100', v:'43.48% → 37.20%', d:'클래스당 데이터가 적을수록 효과가 크다'},
 {k:'SVHN', v:'3.95% → 2.55%', d:'파라미터가 적은 합성곱층에 넣는 것도 이득이라는 반직관적 결과'},
 {k:'ImageNet ILSVRC-2012', v:'top-5 16.4%', d:'dropout을 쓴 [AlexNet](#/p/alexnet)의 우승 기록. 당시 최고 수준의 고전 특징 기반 방법은 약 26%'}
],

impact:'2012~2015년 사이 dropout은 **깊은 망의 기본 옵션**이 됐다. 큰 모델을 작은 데이터에 학습시켜도 되는 면허가 생기면서, 연구의 관심이 "과적합을 어떻게 막을까"에서 "얼마나 더 깊게 쌓을까"로 넘어갔다. 동시에 정규화를 **손실 함수의 페널티 항**(L1/L2)이 아니라 **학습 절차에 섞는 확률적 노이즈**로 보는 사고방식을 대중화했다. 데이터 증강, label smoothing, stochastic depth, [batch normalization](#/p/batchnorm)의 미니배치 노이즈가 모두 이 계보에 놓인다.',

legacy:[
 '**변형의 확산** — DropConnect(가중치를 지움), Spatial Dropout(피처맵 채널 단위), stochastic depth(층 단위)로 "무엇을 지울 것인가"가 설계 변수가 됨',
 '**BN에 자리를 내줌** — [batch normalization](#/p/batchnorm) 자체에 정규화 효과가 있어 CNN에서는 dropout이 사실상 빠졌다. BN 논문은 dropout을 제거하는 것이 학습을 빠르게 한다고 명시한다',
 '**Transformer에서 부활** — [Transformer](#/p/transformer)는 attention 확률과 각 sublayer 출력에 dropout(기본 0.1)을 쓴다. 다만 사전학습 데이터가 조 단위로 커진 현대 LLM에서는 과적합 자체가 사라져 다시 0으로 두는 경우가 많다',
 '**해석의 확장** — MC dropout(추론 때도 켜서 여러 번 샘플링 → 불확실성 추정), 그리고 "학습 가능한 부분망이 이미 안에 있다"는 [로또 티켓 가설](#/p/lottery)로 이어짐'
],

pitfalls:[
 '**추론에서 dropout을 끄는 것을 잊으면 조용히 망가진다.** 프레임워크에서 `model.eval()` / `training=False` 를 빠뜨리면 예측이 매번 달라지고 성능이 떨어지는데, 에러가 나지 않아 발견이 늦다.',
 '**dropout과 [batch normalization](#/p/batchnorm)을 나란히 쓰면 서로 방해할 수 있다.** dropout이 활성값의 분산을 학습/추론에서 다르게 만들어 BN이 저장한 이동통계와 어긋나는 "분산 불일치"가 생긴다. 굳이 함께 쓴다면 BN 뒤에 두는 편이 낫다.',
 '**만능 스위치가 아니다.** dropout은 데이터 대비 모델이 클 때 듣는 처방이며, 데이터가 충분하거나 모델이 작으면 학습만 느려지고 성능은 오히려 떨어진다. $p$ 는 층 위치와 데이터 규모에 따라 조정해야 하는 하이퍼파라미터다.'
],

figures:[
 {f:'fig1-dropout-network.png',
  cap:'왼쪽은 평소의 완전연결망. 오른쪽은 dropout을 적용해 일부 유닛(가위표)과 그 유닛으로 들어오고 나가는 연결을 통째로 지운 "얇아진(thinned)" 네트워크 — 매 학습 스텝마다 이렇게 무작위로 다른 부분망이 뽑혀 학습된다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-test-time-scaling.png',
  cap:'학습 때(왼쪽)는 유닛이 확률 p로만 존재하고 가중치는 w 그대로다. 테스트 때(오른쪽)는 유닛을 항상 켜두는 대신 가중치를 p배로 줄인다(pw) — 이 한 번의 스케일링으로 지수적으로 많은 부분망의 평균 예측을 근사한다는 것이 dropout 추론 방식의 핵심.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'The key idea is to randomly drop units (along with their connections) from the neural network during training. This prevents units from co-adapting too much.',
  src:'Abstract, p.1'}
],

links:[
 {t:'JMLR 15(56) — Dropout: A Simple Way to Prevent Neural Networks from Overfitting', u:'https://jmlr.org/papers/v15/srivastava14a.html'},
 {t:'arXiv 1207.0580 — Improving neural networks by preventing co-adaptation of feature detectors', u:'https://arxiv.org/abs/1207.0580'}
]
});
