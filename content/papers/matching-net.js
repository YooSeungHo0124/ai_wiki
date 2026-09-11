WIKI.paper({
slug:'matching-net',
venue:'NeurIPS 2016',
authors:'Vinyals, Blundell, Lillicrap, Kavukcuoglu, Wierstra (Google DeepMind)',
arxiv:'1606.04080',

tldr:'클래스 하나당 사진 한 장만 보고도 새 범주를 분류하게 만드는 **원샷 학습**을, 파라미터를 다시 학습하지 않는 **비모수적 최근접 이웃**으로 푼 논문. "학습 조건과 시험 조건을 맞춘다"는 **에피소드 학습** 방식과 miniImageNet 벤치마크를 남겼다.',

context:'2016년의 딥러닝은 클래스당 수백~수천 장이 있어야 잘 작동했다. 새 클래스가 등장하면 fine-tuning으로 파라미터를 다시 조정해야 했고, 데이터가 한두 장뿐이면 그마저도 과적합됐다. 반면 최근접 이웃 같은 비모수 모델은 새 예시를 그 자리에서 바로 쓸 수 있지만 성능이 거리 함수 선택에 좌우된다는 약점이 있었다. 이 논문은 [seq2seq](#/p/seq2seq)의 attention과 메모리 증강 신경망 계열에서 쓰던 미분 가능한 주소 지정 메커니즘을 가져와, "거리 함수 자체를 학습"하면 두 세계의 장점을 합칠 수 있다고 봤다.',

ideas:[
 {h:'분류를 파라미터 학습이 아니라 attention 가중합으로 정의',
  lead:'새 클래스마다 네트워크를 다시 학습하지 않고, 지지집합에 대한 attention으로 라벨을 바로 예측한다.',
  d:'예측값은 $\\hat{y}=\\sum_i a(\\hat{x},x_i)y_i$ 로, 지지집합(support set) $S=\\{(x_i,y_i)\\}$ 의 라벨들을 attention 가중치 $a$ 로 섞은 것이다. $a$ 가 코사인 유사도의 softmax이면 커널 밀도 추정에 가깝고, 가장 먼 것들을 0으로 자르면 k-최근접이웃과 같아진다. 핵심은 임베딩 함수 $f,g$ 를 학습해서 "어떤 거리로 비교할지"를 데이터로 정한다는 것이다.'},
 {h:'에피소드 학습: 시험 조건을 학습 조건으로 그대로 복제',
  lead:'매 학습 스텝을 작은 N-way K-shot 문제로 만들어, 시험 때 겪을 상황을 미리 시뮬레이션한다.',
  d:'미니배치 하나가 곧 "클래스 N개, 클래스당 예시 K개"짜리 지지집합 $S$ 와 그로부터 뽑은 배치 $B$ 로 이루어진 하나의 **에피소드(episode)**다. 목적함수는 $\\theta=\\arg\\max_\\theta \\mathbb{E}_{L\\sim T}\\mathbb{E}_{S,B\\sim L}\\left[\\sum_{(x,y)\\in B}\\log P_\\theta(y|x,S)\\right]$ 로, 매번 다른 클래스 집합 $L$ 을 뽑아 학습 자체를 "적은 예시로 새 클래스 구분하기" 연습으로 바꾼다. 저자들의 표현으로는 "학습과 시험의 조건이 일치해야 한다"는 단순한 원칙이 전부다.'},
 {h:'Full Context Embedding: 지지집합 전체를 보고 임베딩을 다시 계산',
  lead:'각 예시를 독립적으로 임베딩하지 않고 지지집합 전체 맥락에서 bidirectional LSTM으로 다시 인코딩한다.',
  d:'기본형에서 $g(x_i)$ 는 다른 지지집합 원소와 무관하게(myopic) 독립적으로 계산된다. FCE는 $g$ 를 bidirectional LSTM으로 바꿔 $S$ 전체를 문맥으로 재인코딩하고, 질의 임베딩 $f$ 도 $S$ 에 대해 $K$ 스텝 read-attention을 반복하는 attLSTM으로 다시 만든다. miniImageNet처럼 어려운 과제에서 약 2%p의 추가 이득을 냈다(Omniglot에서는 거의 차이가 없었다).'},
 {h:'miniImageNet 벤치마크의 제안',
  lead:'전체 ImageNet은 실험 회전이 느려서, 100클래스·클래스당 600장짜리 84×84 축소판을 새로 만들었다.',
  d:'ImageNet 전체로 원샷 실험을 반복하는 것은 공학적으로 부담이 커서, 100개 클래스에서 각 600장씩 뽑은 6만 장짜리 miniImageNet을 만들고 80/20으로 학습/평가 클래스를 나눴다. 이 데이터셋은 이후 거의 모든 few-shot 논문의 표준 벤치마크가 됐다.'}
],

diagram:{type:'flow', cap:'질의 이미지 하나를 지지집합 S와 비교해 라벨을 바로 만들어낸다. 파라미터 갱신 없이 새 클래스에 적용된다.',
 nodes:[
  {t:'지지집합 4장', s:'클래스별 1~5장'},
  {t:'g_θ 임베딩', s:'CNN 또는 LSTM'},
  {t:'질의 x̂', s:'f_θ 임베딩', acc:true},
  {t:'코사인 attention', s:'softmax 유사도'},
  {t:'라벨 가중합', s:'ŷ = Σ a·y_i'}
 ]},

math:[
 {expr:'ŷ = Σ_i a(x̂, x_i) · y_i',
  tex:'\\hat{y}=\\sum_{i=1}^{k} a(\\hat{x},x_i)\\,y_i',
  d:'지지집합의 라벨 $y_i$ 를 attention 가중치 $a$ 로 선형 결합해 예측을 만든다. $a$ 가 kNN이면 이 식은 k-최근접이웃 투표와 같아진다.'},
 {expr:'a(x̂,x_i) = softmax over c(f(x̂), g(x_i))',
  tex:'a(\\hat{x},x_i)=\\dfrac{e^{c(f(\\hat{x}),g(x_i))}}{\\sum_{j=1}^{k} e^{c(f(\\hat{x}),g(x_j))}}',
  d:'$c$ 는 코사인 유사도. 임베딩 함수 $f,g$ 를 학습해 "어떤 특징 공간에서 가까움이 곧 같은 클래스"가 되도록 만드는 것이 학습의 전부다.'},
 {expr:'θ = argmax E_L~T E_{S,B~L} [ Σ log P_θ(y|x,S) ]',
  tex:'\\theta=\\arg\\max_{\\theta}\\;\\mathbb{E}_{L\\sim T}\\,\\mathbb{E}_{S,B\\sim L}\\left[\\sum_{(x,y)\\in B}\\log P_\\theta(y|x,S)\\right]',
  d:'매 스텝 새 클래스 집합 $L$ 을 과제 분포 $T$ 에서 뽑아 지지집합 $S$ 와 배치 $B$ 로 나누는 에피소드 학습. 이후 [MAML](#/p/maml)·[Prototypical Networks](#/p/prototypical) 모두 이 형식을 그대로 물려받는다.'}
],

numbers:[
 {k:'miniImageNet 5-way 1-shot', v:'46.6%', d:'FCE + fine-tune 조합. baseline classifier(softmax, fine-tune) 38.4%보다 높음'},
 {k:'miniImageNet 5-way 5-shot', v:'60.0%', d:'같은 FCE+fine-tune 설정'},
 {k:'Omniglot 5-way 1-shot / 20-way 1-shot', v:'98.1% / 93.8%', d:'Convolutional Siamese Net(96.7%/88.0%)를 능가'},
 {k:'ImageNet(전체) rand 5-way 1-shot', v:'87.6% → 93.2%', d:'Inception 기반 baseline 대비'},
 {k:'miniImageNet 구성', v:'100클래스 · 클래스당 600장 · 84×84', d:'80클래스 학습 / 20클래스 시험'},
 {k:'샷 수 실험 범위', v:'1-shot·5-shot, 5-way·20-way', d:'Omniglot 표(Table 1)의 네 조합 전부 보고'}
],

impact:'분류를 "가중치를 다시 학습하는 문제"에서 "지지집합에 대한 attention 문제"로 바꿔, 새 클래스에 그레이디언트 업데이트 없이 즉시 적용 가능한 모델을 처음 보였다. 더 크게는 **에피소드 학습**이라는 방법론이 이후 few-shot 학습 전체의 표준 학습 절차가 됐고, [프로토타입 네트워크](#/p/prototypical)·[MAML](#/p/maml)·[Reptile](#/p/reptile)까지 전부 "N-way K-shot 에피소드를 반복해서 메타 학습한다"는 이 틀 위에서 서로 다른 적응 메커니즘을 제안한 것이다. miniImageNet은 이후 수백 편의 few-shot 논문이 공유하는 공통 잣대가 됐다.',

legacy:[
 '**에피소드 학습 표준화** — [MAML](#/p/maml)·[Prototypical Networks](#/p/prototypical)·[Reptile](#/p/reptile) 모두 N-way K-shot 에피소드로 메타 학습을 정의하는 이 틀을 그대로 물려받음',
 '**벤치마크로서의 miniImageNet** — 이후 few-shot 학습 논문 대부분이 1-shot/5-shot, 5-way 정확도를 이 데이터셋 위에서 비교',
 '**메트릭 학습 계열의 시작** — 거리/유사도를 학습해 분류하는 접근은 이후 [Prototypical Networks](#/p/prototypical)에서 훨씬 단순한 형태로 재구성됨',
 '**최적화 기반 메타 학습으로의 분화** — 비모수 방식의 한계(지지집합이 커지면 계산량도 커짐)는 [MAML](#/p/maml) 계열의 "경사 하강으로 적응"이라는 대안적 흐름을 자극'
],

pitfalls:[
 '**비모수적이라 "학습이 필요 없다"는 뜻이 아니다.** 임베딩 함수 $f,g$ 자체는 여전히 대량의 에피소드로 사전학습돼야 하고, 그 이후에야 새 클래스에 fine-tuning 없이 적응할 수 있다.',
 '**FCE의 이득은 데이터셋에 따라 다르다.** Omniglot처럼 쉬운 과제에서는 거의 차이가 없었고, miniImageNet처럼 어려운 과제에서만 유의미했다 — "항상 문맥 임베딩이 낫다"는 일반화는 원문 근거가 약하다.',
 '**지지집합 크기가 커지면 추론 비용도 커진다.** 파라미터 개수는 고정이지만 매 예측마다 지지집합 전체와 비교해야 해서, 대규모 지지집합에서는 프로토타입 기반 방법보다 느리다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽 4장이 지지집합 S(색 사각형이 클래스 라벨), g_θ가 각 예시를 임베딩한다. 아래 질의 이미지는 f_θ로 별도 임베딩되고(점선은 S에 대한 attention으로 f_θ를 조건화하는 FCE 경로), ⊗가 코사인 유사도·softmax attention, Σ가 라벨 가중합으로 최종 예측(빨간 사각형)을 만든다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'Secondly, our training procedure is based on a simple machine learning principle: test and train conditions must match.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 1606.04080 — Matching Networks for One Shot Learning', u:'https://arxiv.org/abs/1606.04080'},
 {t:'DeepMind Blog', u:'https://deepmind.google/'}
]
});
