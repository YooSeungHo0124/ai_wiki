WIKI.concept({
slug:'dropout-c',

tldr:'학습 중 매 스텝마다 뉴런 일부를 확률적으로 꺼서(출력을 0으로) 특정 뉴런 조합에 과의존하지 못하게 만드는 정칙화 기법.',

why:'val loss가 안 떨어질 때 가장 먼저 꽂는 스위치가 dropout이지만, train/eval 모드 전환을 빼먹거나 확률 p의 의미(끄는 비율인지 살리는 비율인지), BatchNorm과 같이 쓸 때의 순서를 헷갈리면 오히려 성능을 깎아먹는다. 논문에서 "dropout=0.1을 썼다"는 문장을 읽을 때 정확히 무슨 뜻인지 알아야 재현할 수 있고, 어디에 얼마나 걸어야 할지 감을 잡는 것도 실무 경험이 필요한 부분이다.',

sections:[
 {h:'무엇을 하는가', d:'순전파 때 각 뉴런을 확률 $p$ 로 독립적으로 0으로 만든다(끈다). 매 스텝마다 꺼지는 뉴런 조합이 달라지므로, 모델은 특정 뉴런 몇 개의 조합에만 의존하는 취약한 특징 대신 여러 경로로 중복되게 정보를 표현하도록 강제된다. 이는 서로 다른 부분망(sub-network) 수만 개를 암묵적으로 앙상블하는 것과 비슷한 효과를 낸다고 해석된다.'},
 {h:'학습과 추론의 비대칭', d:'학습 때는 뉴런의 $p$ 비율을 끄고 남은 $(1-p)$ 비율만 쓰지만, 추론 때는 dropout을 끄고 모든 뉴런을 다 쓴다. 이때 출력의 기댓값이 학습·추론 사이에서 달라지지 않도록 스케일을 맞춰야 한다 — 요즘 구현(inverted dropout)은 학습 때 살아남은 활성값을 $1/(1-p)$ 로 미리 나눠 키워 두어, 추론 때는 아무 조정 없이 그대로 쓸 수 있게 한다.'},
 {h:'어디에 거는가', d:'완전연결층 뒤에 거는 것이 가장 흔하고 효과도 크다. 합성곱 층에는 공간적으로 인접한 픽셀들이 이미 서로 강하게 상관되어 있어 뉴런 단위 dropout의 효과가 약하므로, 채널 전체를 통째로 끄는 SpatialDropout류를 쓰는 경우가 많다. 트랜스포머에서는 어텐션 가중치·FFN 출력·임베딩 뒤 등 여러 지점에 낮은 확률(0.1 안팎)로 흔히 건다.'},
 {h:'실무에서', d:'완전연결층이 많은 옛 CNN(AlexNet, VGG)에서는 0.5 같은 높은 확률을 썼지만, BatchNorm이 널리 쓰이면서 dropout의 정칙화 효과 상당 부분이 겹쳐 요즘 CNN은 dropout을 아예 빼거나 아주 약하게(0.1~0.2)만 쓰는 경우가 많다. 데이터가 매우 많은 대규모 사전학습(LLM 등)에서는 과적합 자체가 덜 문제이므로 dropout을 0으로 두는 경우도 흔하다 — 데이터가 부족할수록 dropout의 이득이 커진다.'},
 {h:'변형들', d:'DropConnect는 뉴런이 아니라 가중치(연결) 하나하나를 확률적으로 끄고, DropBlock은 CNN 특징맵에서 인접한 사각형 영역을 통째로 끈다(개별 픽셀 dropout은 주변 픽셀이 정보를 대신 채워 넣어 효과가 약하기 때문). [MC Dropout](#/p/mc-dropout)은 추론 때도 dropout을 켜 둔 채 같은 입력을 여러 번 통과시켜, 출력의 분산으로 모델의 불확실성을 근사 추정하는 용도로 쓴다.'}
],

math:[
 {tex:'\\tilde{h}=\\dfrac{m\\odot h}{1-p},\\quad m_i\\sim\\mathrm{Bernoulli}(1-p)', expr:'inverted dropout', d:'$h$ 는 원래 활성값, $m$ 은 각 뉴런을 살릴지(1) 끌지(0) 결정하는 베르누이 마스크, $p$ 는 끄는 확률. $1/(1-p)$ 로 나눠 학습 시 기댓값을 추론 시(마스크 없음)와 맞춘다.'}
],

code:{lang:'python', d:'PyTorch의 nn.Dropout은 train/eval 모드에 따라 자동으로 동작이 바뀐다 — model.eval()을 빼먹으면 추론 때도 마스킹이 계속 적용된다.', src:'import torch.nn as nn\n\nclass Classifier(nn.Module):\n    def __init__(self, d_in, d_hidden, n_class, p=0.3):\n        super().__init__()\n        self.fc1 = nn.Linear(d_in, d_hidden)\n        self.drop = nn.Dropout(p=p)   # p = 끄는 확률\n        self.fc2 = nn.Linear(d_hidden, n_class)\n    def forward(self, x):\n        h = self.drop(torch.relu(self.fc1(x)))\n        return self.fc2(h)\n\nmodel.train()  # dropout 활성 — 마스킹 O\nmodel.eval()   # dropout 비활성 — 전체 뉴런 사용'},

diagram:{type:'compare', cap:'학습과 추론에서 dropout이 다르게 동작한다는 것이 핵심.',
 left:{t:'학습(train)', items:[
  '뉴런 p 비율을 0으로 끔',
  '남은 값 1/(1-p) 배 확대',
  '스텝마다 다른 조합']},
 right:{t:'추론(eval)', items:[
  '모든 뉴런 사용',
  '추가 스케일링 없음',
  '결정적(deterministic) 출력']}},

confuse:[
 {a:'Dropout', b:'[정칙화](#/c/regularization) 일반', d:'정칙화는 과적합을 줄이는 기법 전체를 가리키는 상위 개념이고, dropout은 그 중 "뉴런을 확률적으로 끈다"는 구체적 한 방법이다. weight decay, 데이터 증강도 같은 정칙화 범주에 속하는 서로 다른 방법이다.'},
 {a:'Dropout', b:'[BatchNorm](#/c/normalization)', d:'BatchNorm은 배치 통계로 활성값을 정규화해 학습을 안정시키는 것이 주목적이고 정칙화는 부수 효과다. 두 층을 같이 쓸 때 BatchNorm 뒤에 dropout을 걸면 추론 시 배치 통계 추정이 흔들려 성능이 떨어진다는 보고가 있어, 보통 dropout을 BatchNorm보다 뒤에(더 늦게) 배치한다.'},
 {a:'확률 p', b:'생존율(keep probability) $1-p$', d:'프레임워크마다 표기가 다르다. PyTorch `nn.Dropout(p=0.5)` 의 $p$ 는 "끄는 확률"이다. 논문·코드를 옮길 때 이 값을 반대로 읽으면 정칙화 강도가 정반대로 바뀐다.'},
 {a:'Dropout', b:'[앙상블](#/c/ensemble)', d:'명시적 앙상블은 서로 다른 모델 여러 개를 각각 학습해 예측을 평균 내는 것이고, dropout은 하나의 네트워크 안에서 스텝마다 다른 부분망을 학습시켜 암묵적으로 수많은 부분망을 공유 가중치로 앙상블하는 효과를 낸다. 별도 모델을 여러 개 학습·저장할 필요가 없다는 점이 실용적 장점이다.'},
 {a:'DropConnect', b:'DropBlock', d:'DropConnect는 가중치(연결) 단위로 끄고, DropBlock은 CNN 특징맵의 공간적으로 인접한 영역을 통째로 끈다. 둘 다 표준 dropout의 변형이지만 무엇을 끄는 단위로 삼는지가 다르다.'}
],

pitfalls:[
 '`model.eval()`(또는 이에 준하는 추론 모드 전환)을 빼먹으면 추론 때도 dropout이 계속 활성화되어 출력이 매번 달라지고 성능이 낮게 측정된다.',
 '작은 데이터셋에서 dropout 확률을 과하게 높이면(0.5 이상) 유효 용량이 너무 줄어 오히려 과소적합이 될 수 있다.',
 '[MC Dropout](#/p/mc-dropout)처럼 추론 때 의도적으로 dropout을 켜 두는 특수한 용도(불확실성 추정)도 있다는 것을 모르면 "추론 때 dropout은 항상 꺼야 한다"는 규칙을 절대시하게 된다.',
 '어텐션 가중치에 dropout을 걸 때 확률을 너무 높이면 트랜스포머가 문맥의 핵심 위치조차 확률적으로 놓치게 되어 학습이 오히려 불안정해질 수 있다 — 보통 0.1 안팎의 작은 값을 쓴다.'
],

papers:['dropout','mc-dropout'],
terms:['regularization','normalization','overfitting','mlp']
})
