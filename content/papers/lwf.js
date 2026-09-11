WIKI.paper({
slug:'lwf',
venue:'ECCV 2016 / IEEE TPAMI',
authors:'Li & Hoiem (UIUC)',
arxiv:'1606.09282',

tldr:'옛 과제의 데이터를 하나도 저장하지 않고, **옛 모델의 출력 자체를 목표(target)로 삼아 증류**함으로써 새 과제를 배우면서도 옛 과제 성능을 지키는 방법. 연속 학습 계보의 출발점이다.',

context:'CNN을 새 과제에 맞추는 표준 방법은 두 가지였다. **feature extraction**은 합성곱층을 얼리고 새 출력층만 학습해 옛 성능은 지키지만 새 과제 정확도가 낮고, **fine-tuning**은 전체를 새 데이터로 재학습해 새 과제는 잘 풀지만 옛 과제 정확도가 크게 떨어진다(파국적 망각). 두 방법의 절충인 **joint training**(멀티태스크 학습)은 옛 과제 데이터까지 함께 쓰면 되지만, 과제가 늘어날수록 원본 데이터를 전부 보관하고 매번 다시 돌리는 비용이 감당이 안 된다. 이 논문은 묻는다 — 옛 데이터 없이, 옛 모델이 새 데이터에 대해 내놓는 **출력만으로** 옛 지식을 지킬 수 있는가?',

ideas:[
 {h:'옛 데이터 대신 옛 모델의 응답을 기록한다',
  lead:'새 과제 이미지를 옛 네트워크에 통과시켜 옛 과제 출력을 미리 기록해 둔다.',
  d:'새 파라미터 $\\theta_n$ 을 추가하기 전에, 새 과제 이미지 $X_n$ 을 원본 네트워크 $(\\theta_s,\\theta_o)$ 에 통과시켜 옛 과제들에 대한 출력 $Y_o$ 를 먼저 기록한다. 이후 학습 내내 이 기록값이 옛 과제의 "정답"을 대신한다. 원본 학습 데이터는 한 장도 필요 없다.'},
 {h:'지식 증류 손실로 옛 출력을 목표로 고정한다',
  lead:'[지식 증류](#/p/distillation)의 modified cross-entropy를 옛 과제 손실로 그대로 쓴다.',
  d:'새 과제는 보통의 cross-entropy로, 옛 과제는 [Hinton의 지식 증류](#/p/distillation) 손실로 학습한다. 온도 $T$ 로 확률을 누그러뜨려 작은 확률값의 비중을 키우면, 정답 클래스 하나만이 아니라 클래스 간 유사도 구조까지 보존하려는 압력이 생긴다. 저자들은 그리드 서치로 $T=2$ 를 골랐다.'},
 {h:'워밍업 후 공동 최적화',
  lead:'새 출력층만 먼저 수렴시킨 뒤 전체 파라미터를 함께 학습한다.',
  d:'먼저 $\\theta_s,\\theta_o$ 를 얼린 채 무작위 초기화한 $\\theta_n$ 만 수렴할 때까지 학습(warm-up)하고, 그다음 $\\theta_s,\\theta_o,\\theta_n$ 을 전부 함께 최적화한다(joint-optimize). 워밍업 없이 바로 전체를 학습하면 새 출력층의 큰 초기 그래디언트가 공유 가중치를 흔들어 옛 과제 손실이 튄다.'},
 {h:'가중치 $\\lambda_o$ 로 옛/새 과제 균형을 조절한다',
  lead:'하나의 목적함수에서 옛 과제 손실 가중치를 올리면 새 과제를 희생해 옛 과제를 더 지킨다.',
  d:'전체 목적함수는 옛 과제 증류 손실과 새 과제 분류 손실의 가중합이다. $\\lambda_o$ 를 키우면 옛 과제 성능이 fine-tuning보다 훨씬 좋아지지만 joint training보다는 살짝 못하고, 새 과제 성능은 그 반대로 움직인다. 저자들은 대부분의 실험에서 $\\lambda_o=1$ 을 썼다.'}
],

diagram:{type:'compare', cap:'네 가지 적응 방식의 입력·목표 비교. LwF만 옛 데이터 없이 옛 출력을 목표로 쓴다.',
 left:{t:'기존: fine-tuning', items:['새 데이터만 사용','공유층까지 새 정답으로 갱신','옛 과제 정확도 급락']},
 right:{t:'LwF: 증류로 대체', items:['새 데이터만 사용','옛 모델 출력을 옛 과제 목표로 고정','옛 데이터 저장 불필요']}
},

math:[
 {expr:'L_new(y_n, ŷ_n) = -y_n · log ŷ_n',
  tex:'\\mathcal{L}_{new}(\\mathbf{y}_n,\\hat{\\mathbf{y}}_n) = -\\mathbf{y}_n \\cdot \\log \\hat{\\mathbf{y}}_n',
  d:'새 과제는 보통의 multinomial logistic loss(cross-entropy)로 학습한다. $\\hat{y}_n$ 은 softmax 출력, $y_n$ 은 원-핫 정답.'},
 {expr:"y'_o^(i) = (y_o^(i))^(1/T) / Σ_j (y_o^(j))^(1/T)",
  tex:"y_o'^{(i)} = \\frac{(y_o^{(i)})^{1/T}}{\\sum_j (y_o^{(j)})^{1/T}}, \\quad \\hat{y}_o'^{(i)} = \\frac{(\\hat{y}_o^{(i)})^{1/T}}{\\sum_j (\\hat{y}_o^{(j)})^{1/T}}",
  d:'온도 $T$ 로 확률을 재조정한 뒤(기록값 $y_o$, 현재 출력 $\\hat{y}_o$) 그 사이의 modified cross-entropy $\\mathcal{L}_{old}=-\\sum_i y_o\'^{(i)}\\log \\hat{y}_o\'^{(i)}$ 를 옛 과제 손실로 쓴다. $T=2$ 로 작은 확률값의 가중치를 키워 클래스 간 유사도까지 보존한다.'},
 {expr:'θs*, θo*, θn* = argmin  λo·L_old(Yo, Ŷo) + L_new(Yn, Ŷn) + R(·)',
  tex:'\\theta_s^{*},\\theta_o^{*},\\theta_n^{*} \\leftarrow \\arg\\min_{\\hat{\\theta}_s,\\hat{\\theta}_o,\\hat{\\theta}_n} \\lambda_o \\mathcal{L}_{old}(Y_o,\\hat{Y}_o) + \\mathcal{L}_{new}(Y_n,\\hat{Y}_n) + \\mathcal{R}(\\hat{\\theta}_s,\\hat{\\theta}_o,\\hat{\\theta}_n)',
  d:'전체 목적함수. 공유 파라미터 $\\theta_s$, 옛 과제 전용 층 $\\theta_o$, 새 과제 전용 층 $\\theta_n$ 을 옛 데이터 없이 이 하나의 식만으로 동시에 최적화한다.'}
],

numbers:[
 {k:'ImageNet→VOC (AlexNet)', v:'옛 56.2 · 새 76.1', d:'LwF 절대 정확도(mAP). fine-tuning은 옛 과제에서 **-0.9**p 더 낮음'},
 {k:'옛 과제 손실 폭', v:'fine-tuning 대비 우위', d:'7개 과제 쌍 중 대부분에서 LwF가 fine-tuning보다 옛 과제 정확도를 크게 보존'},
 {k:'예외', v:'ImageNet→MNIST', d:'과제 간 도메인 차이가 클 때 LwF도 옛 과제 성능을 잘 지키지 못하는 유일한 예외'},
 {k:'증류 온도', v:'T = 2', d:'held-out set 그리드 서치로 결정, Hinton 등의 권고와 일치'},
 {k:'학습 데이터셋 규모', v:'VOC 5,717 · CUB 5,994 · Scenes 5,360장', d:'원본(ImageNet/Places365) 대비 작은 새 과제 데이터셋'}
],

impact:'파국적 망각을 막는 데 **원본 데이터가 필수**라는 당시 통념(A-LTM 등)에 반례를 제시했다. 지식 증류를 압축(작은 모델 만들기)이 아니라 **시간축의 지식 보존**에 쓴 첫 사례로, 이후 연속 학습 연구의 두 축 중 "리허설 없이"쪽을 열었다. 다만 논문 스스로도 밝히듯 과제 도메인이 서로 멀면(ImageNet→MNIST) 이 접근이 무너진다는 한계가 드러났고, 이 한계가 다음 세대 방법들(가중치 중요도 기반 EWC, 예시 리허설 기반 iCaRL)이 등장하는 배경이 된다.',

legacy:[
 '**가중치 중요도 접근으로 분화** — [EWC](#/p/ewc)는 옛 출력을 증류하는 대신 옛 과제에 중요한 가중치 자체를 페널티로 고정하는 다른 경로를 택함',
 '**리허설 접근으로 분화** — [iCaRL](#/p/icarl)은 소량의 예시를 저장해 LwF의 증류 손실과 결합, 도메인이 먼 과제에서도 버티게 만듦',
 '**연속 학습 벤치마크의 표준 베이스라인화** — 이후 거의 모든 continual learning 논문이 LwF를 비교 대상으로 삼음',
 '**증류의 용도 확장** — "작은 모델 압축"이 아니라 "이전 지식 보존"이라는 지식 증류의 두 번째 쓰임을 연 사례로 자주 인용됨'
],

pitfalls:[
 '**"리허설이 전혀 필요 없다"는 과장이다.** ImageNet→MNIST처럼 새 과제 도메인이 옛 과제와 멀면 옛 모델의 출력 자체가 새 데이터에 대해 신뢰할 수 없어져 증류가 힘을 잃는다.',
 '**과제 수가 늘어나면 순서 의존성이 커진다.** 논문 실험은 대부분 옛 과제 1개 + 새 과제 1개 시나리오이고, 여러 과제를 순차로 계속 추가하는 설정에서는 오차가 누적된다는 점은 후속 연구가 지적한 한계다.',
 '**$\\lambda_o$ 는 데이터마다 재탐색이 필요하다.** 논문은 대부분 $\\lambda_o=1$ 을 썼지만 과제 쌍에 따라 최적값이 달라, 고정값을 그대로 가져다 쓰면 균형이 무너질 수 있다.'
],

figures:[
 {f:'fig2-methods.png',
  cap:'(e)가 이 논문의 방법. 다른 넷과 달리 입력은 새 과제 이미지뿐인데, 목표(Target) 중 옛 과제 쪽이 "정답 라벨"이 아니라 "원본 모델 (a)의 응답"이다 — 데이터 없이 옛 지식을 옮기는 지점이 여기.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'We propose our Learning without Forgetting method, which uses only new task data to train the network while preserving the original capabilities.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1606.09282 — Learning without Forgetting', u:'https://arxiv.org/abs/1606.09282'},
 {t:'IEEE TPAMI version', u:'https://ieeexplore.ieee.org/document/8107520'}
]
});
