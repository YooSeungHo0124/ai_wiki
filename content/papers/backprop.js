WIKI.paper({
slug:'backprop',
venue:'Nature 323, 533–536 (1986)',
authors:'Rumelhart, Hinton & Williams (UC San Diego · Carnegie-Mellon · Northeastern)',

tldr:'은닉층에 정답이 없어도 **연쇄법칙으로 오차의 미분을 아래층까지 되돌려 보내면** 다층 신경망을 학습시킬 수 있음을 보인 논문. 사람이 특징을 설계하지 않아도 은닉 유닛이 스스로 유용한 내부 표현을 만든다는 것을 실험으로 증명했다.',

context:'[퍼셉트론](#/p/perceptron) 이후 문제는 명확했다. 층을 쌓으면 XOR도 대칭성 판별도 풀 수 있다는 것은 알지만, **중간층 유닛에는 "정답 상태"가 없다**. 출력층은 목표와 비교해 오차를 계산할 수 있지만, 은닉 유닛에게는 무엇이 옳은 활성값인지 아무도 알려주지 않는다. 이것이 이른바 credit assignment 문제다. Minsky·Papert(1969) 이후 연결주의는 이 벽에 막혀 있었다. 이 논문의 답은 놀랍도록 단순하다 — **은닉 유닛의 목표 값을 알 필요가 없다. 필요한 것은 그 유닛이 오차에 얼마나 기여했는지, 즉 $\\partial E/\\partial y_j$ 뿐이고, 그것은 위층의 미분에서 연쇄법칙으로 계산된다.**',

ideas:[
 {h:'미분 가능한 유닛으로의 교체',
  lead:'계단 함수 대신 매끈한 시그모이드로 바꿔 gradient가 흐르게 한다.',
  d:'퍼셉트론의 계단 함수는 미분이 0 아니면 정의되지 않아 gradient를 흘릴 수 없다. 이 논문은 유닛의 출력을 **매끄러운 비선형(로지스틱 시그모이드)** 으로 바꾼다. 그러면 $dy/dx = y(1-y)$ 라는 깔끔한 형태가 나오고, 네트워크 전체가 가중치에 대해 미분 가능한 하나의 합성 함수가 된다. 논문은 "경계가 있는 도함수를 가진 어떤 입출력 함수든 상관없다"고 명시한다.'},
 {h:'두 번의 패스: forward는 값을, backward는 미분을',
  lead:'같은 가중치를 반대 방향으로 써서 forward와 같은 비용에 미분을 얻는다.',
  d:'순전파에서 각 층의 활성값을 아래에서 위로 계산해 저장하고, 역전파에서는 출력층의 $\\partial E/\\partial y = y - d$ 에서 시작해 **같은 가중치를 반대 방향으로 사용해** 미분을 아래로 전파한다. 핵심은 계산량이다 — 파라미터가 몇 백만 개여도 gradient 전체를 구하는 비용이 forward 한 번과 같은 차수다. 파라미터 하나씩 흔들어보는 수치 미분 대비 파라미터 수만큼 싸다.'},
 {h:'은닉 유닛이 스스로 의미 있는 특징을 만든다',
  lead:'설계하지 않은 국적·세대 같은 특징을 은닉 유닛이 스스로 분화시킨다.',
  d:'논문의 진짜 주장은 알고리즘이 아니라 제목에 있다 — *Learning **Representations***. 가족관계 실험에서 입력은 사람마다 유닛 하나씩 할당한 one-hot이라 어떤 구조도 담겨 있지 않은데, 학습 후 은닉 유닛 6개는 각각 **국적(영국/이탈리아)**, **세대**, **가계의 어느 쪽 갈래인지**를 인코딩했다. 아무도 그런 특징을 설계하지 않았다. 이 "표현이 학습된다"는 관찰이 이후 [word2vec](#/p/word2vec)부터 모든 임베딩 개념의 조상이다.'},
 {h:'대칭성 문제: 은닉 유닛 2개짜리 우아한 해',
  lead:'대칭 위치의 가중치를 부호만 반대로 맞춰 대칭 입력에서만 0이 되게 한다.',
  d:'6비트 입력이 좌우 대칭인지 판별하는 과제는 단층으로 불가능하다. 학습된 해는 중심을 기준으로 대칭 위치의 가중치가 **크기는 같고 부호는 반대**, 그리고 한쪽의 가중치 비가 1:2:4 가 되도록 배치된다. 그러면 대칭 패턴일 때만 두 은닉 유닛의 순입력이 정확히 0이 되어 둘 다 꺼지고, 양의 바이어스를 가진 출력 유닛이 켜진다. 사람이 짜 넣지 않은 알고리즘을 gradient가 발견한 첫 사례다.'},
 {h:'모멘텀과 배치 누적',
  lead:'이전 갱신량을 속도처럼 더해 좁은 골짜기에서의 진동을 줄인다.',
  d:'단순 경사하강 대신 $\\Delta w(t) = -\\varepsilon\\,\\partial E/\\partial w(t) + \\alpha\\,\\Delta w(t-1)$ 를 쓴다. 현재 gradient가 위치가 아니라 **속도**를 바꾸는 형태로, 좁은 골짜기에서의 진동을 줄인다. 또 사례마다 갱신하지 않고 한 sweep 전체의 $\\partial E/\\partial w$ 를 누적한 뒤 갱신한다(full-batch). 이 두 선택은 훗날 미니배치 SGD + 모멘텀, 그리고 [Adam](#/p/adam)으로 이어진다.'}
],

diagram:{type:'loop', cap:'학습 한 스텝. 이 순환이 오늘날까지 모든 딥러닝 학습 루프의 골격이다.',
 center:'sweep마다 반복',
 nodes:[
  {t:'순전파', s:'x → y, 층별 활성 저장'},
  {t:'오차 계산', s:'E = ½Σ(y − d)²'},
  {t:'역전파', s:'국소 미분을 아래로 전달', acc:true},
  {t:'gradient 누적', s:'∂E/∂w = ∂E/∂x_j · y_i'},
  {t:'가중치 갱신', s:'모멘텀 포함 가중치 갱신'}
 ]},

math:[
 {expr:'E = ½ Σ_c Σ_j ( y_{j,c} − d_{j,c} )²',
  tex:'E = \\frac{1}{2}\\sum_c \\sum_j (y_{j,c} - d_{j,c})^2',
  d:'논문이 정의한 총 오차. 모든 사례 $c$ 와 출력 유닛 $j$ 에 대한 제곱 오차 합이며, $\\frac{1}{2}$ 는 미분했을 때 계수를 없애기 위한 관습이다.'},
 {expr:'∂E/∂x_j = (∂E/∂y_j) · y_j (1 − y_j)',
  tex:'\\frac{\\partial E}{\\partial x_j} = \\frac{\\partial E}{\\partial y_j}\\, y_j (1 - y_j)',
  d:'로지스틱 유닛의 국소 미분. 이 항이 곱해지며 아래층으로 내려가는데, $y(1-y)$ 의 최댓값이 0.25 라서 층이 깊어질수록 계속 곱해져 gradient가 0으로 죽는다 — **vanishing gradient의 수학적 원인이 이 한 줄에 이미 들어 있다.**'},
 {expr:'∂E/∂y_i = Σ_j (∂E/∂x_j) · w_{ij}',
  tex:'\\frac{\\partial E}{\\partial y_i} = \\sum_j \\frac{\\partial E}{\\partial x_j}\\, w_{ij}',
  d:'논문의 핵심 재귀식. 아래층 유닛 $i$ 의 미분은 위층 유닛들의 미분을 **순전파에 쓴 그 가중치로 다시 가중합**한 것이다. 이 한 줄 덕분에 층 수와 무관하게 같은 절차를 반복하면 된다.'}
],

numbers:[
 {k:'대칭성 과제', v:'은닉 2개 · 1,425 sweep', d:'6비트 입력의 64가지 경우 전체를 매 sweep 통과. $\\varepsilon=0.1$, 모멘텀 $\\alpha=0.9$'},
 {k:'가중치 비율', v:'1 : 2 : 4', d:'학습이 스스로 찾아낸 구조 — 중심 기준 대칭 위치는 부호만 반대'},
 {k:'가족관계 과제', v:'5층 · 100/104 triple 학습', d:'나머지 4개 triple에 대해서도 정답을 냄 — 일반화의 증거'},
 {k:'가족관계 학습량', v:'1,500 sweep', d:'초기 20 sweep은 $\\varepsilon=0.005,\\ \\alpha=0.5$, 이후 $\\varepsilon=0.01,\\ \\alpha=0.9$'},
 {k:'weight decay', v:'갱신마다 0.2% 감쇠', d:'가중치를 해석 가능하게 만들려고 넣었다 — 정규화 항의 초기 사례'},
 {k:'초기 가중치', v:'U(−0.3, 0.3)', d:'대칭을 깨기 위한 작은 난수. 초기화가 학습의 전제조건이라는 인식이 여기서 이미 나온다'}
],

impact:'이 논문 이후 신경망 연구의 문법이 바뀐다. **(1) 아키텍처와 학습의 분리** — 미분 가능한 연산으로만 조립하면 무엇을 쌓든 같은 절차로 학습된다. 오늘날 [CNN](#/p/lenet)·[LSTM](#/p/lstm)·[Transformer](#/p/transformer)·[NeRF](#/p/nerf)가 전부 같은 optimizer를 공유하는 이유가 이것이다. **(2) 특징 공학의 종말 예고** — 표현을 사람이 아니라 gradient가 만든다는 주장이 실험으로 뒷받침됐다. **(3) 자동 미분이라는 소프트웨어 범주** — 논문의 역전파 절차를 일반화한 것이 오늘날 PyTorch·JAX의 autograd다. 다만 산업적 성공까지는 데이터와 연산이 더 필요했고, 그 격차를 [ImageNet](#/p/imagenet)과 GPU가 메우기까지 26년이 더 걸린다.',

legacy:[
 '**깊이의 문제로 이동** — $y(1-y)$ 가 반복해 곱해지는 구조가 vanishing gradient를 낳고, 그 해법으로 [LSTM](#/p/lstm)의 게이트, [ResNet](#/p/resnet)의 스킵 연결, [배치 정규화](#/p/batchnorm)/[레이어 정규화](#/p/layernorm)가 나옴',
 '**옵티마이저 계보의 시작** — 이 논문의 $\\varepsilon$·모멘텀 수동 튜닝이 곧 병목이 되면서 AdaGrad·RMSProp을 거쳐 [Adam](#/p/adam)으로 이어짐',
 '**recurrent net으로의 확장** — 논문 Fig.5의 "반복 신경망은 층을 펼친 것과 같다"는 관찰이 그대로 BPTT가 되어 [seq2seq](#/p/seq2seq)까지 연결됨',
 '**미분 가능성이 설계 제약이 됨** — 이산 선택·argmax·샘플링을 어떻게 미분 가능하게 만들지가 이후 모든 분야(예: [MoE](#/p/moe-shazeer)의 라우팅)의 반복되는 숙제가 됨'
],

pitfalls:[
 '**"역전파는 1986년에 발명됐다"는 부정확하다.** 논문 스스로 Parker와 [Le Cun](#/p/lenet)이 독립적으로 같은 절차를 발견했다고 각주에 밝히고 있으며, 더 거슬러 올라가면 Linnainmaa(1970)의 자동 미분 역방향 모드, Werbos(1974)의 박사논문이 있다. 이 논문의 기여는 **발명이 아니라 "이걸로 유용한 내부 표현이 학습된다"는 증명과 설득**이다.',
 '**역전파는 학습 알고리즘이 아니라 gradient 계산 절차다.** 실제로 가중치를 바꾸는 것은 SGD·[Adam](#/p/adam) 같은 optimizer이며, 둘을 한 덩어리로 부르면 "optimizer를 바꾼다"는 이야기가 이해되지 않는다.',
 '**국소 최소값 걱정은 과장이었다.** 논문도 "경험상 나쁜 국소 최소에 빠지는 일은 매우 드물고, 연결을 조금 더 늘리면 우회 경로가 생긴다"고 관찰했다. 고차원에서 진짜 문제는 국소 최소가 아니라 안장점과 조건수라는 것이 나중에 밝혀진다.'
],

figures:[
 {f:'fig1-symmetry-network.png',
  cap:'입력 벡터의 좌우 대칭을 판별하도록 학습된 은닉층 2개짜리 망. 화살표 위 숫자가 가중치, 동그라미 안 숫자가 편향이다. 왼쪽·오른쪽 은닉 유닛으로 들어가는 가중치가 서로 부호만 반대인 거울 대칭을 이루는데, 이는 사람이 설계한 게 아니라 1,425번의 학습 스윕 끝에 역전파가 스스로 찾아낸 해다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-family-tree.png',
  cap:'서로 동형(isomorphic)인 두 가족 계보(영국인·이탈리아인). "누가 누구의 이모인가" 같은 관계를 그물망이 배우게 하는 실험에 쓰인 입력 구조 — 이름 자체가 아니라 관계의 패턴을 은닉층이 분산 표현으로 학습한다는 논문의 핵심 사례다.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'The ability to create useful new features distinguishes back-propagation from earlier, simpler methods such as the perceptron-convergence procedure.',
  src:'Abstract, p.1'}
],

links:[
 {t:'Nature 323, 533–536 — Learning representations by back-propagating errors', u:'https://www.nature.com/articles/323533a0'},
 {t:'원문 PDF (gwern 아카이브)', u:'https://gwern.net/doc/ai/nn/1986-rumelhart-2.pdf'},
 {t:'Calculus on Computational Graphs (Chris Olah)', u:'https://colah.github.io/posts/2015-08-Backprop/'}
]
});
