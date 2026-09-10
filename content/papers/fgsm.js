WIKI.paper({
slug:'fgsm',
venue:'ICLR 2015',
authors:'Goodfellow, Shlens, Szegedy (Google)',
arxiv:'1412.6572',

tldr:'[Intriguing Properties](#/p/intriguing)가 발견한 적대적 예제의 원인을 **비선형성이 아니라 고차원에서의 선형성**이라고 재해석하고, gradient 부호 한 번으로 예제를 만드는 FGSM과 그것을 학습에 섞는 적대적 학습(adversarial training)을 제안한 논문.',

context:'[Intriguing Properties](#/p/intriguing)는 적대적 예제의 존재를 실험으로 보였지만 **왜** 생기는지는 설명하지 못했고, 당시 통설은 "신경망이 극도로 비선형이고 정규화가 부족해서"였다. 이 설명에는 구멍이 있다 — 서로 다른 구조·다른 데이터로 학습한 모델들이 **같은** 적대적 예제에 **같은** 방식으로 속는 현상을 비선형·과적합 가설로는 설명하기 어렵다. 게다가 당시 유일한 공격법인 box-constrained L-BFGS는 각 예제마다 반복 최적화가 필요해 느렸고, 그래서 적대적 학습을 대규모로 시도하는 것 자체가 비현실적이었다.',

ideas:[
 {h:'선형 모델만으로도 적대적 예제가 생긴다',
  lead:'고차원 입력에서 $w^\\top\\eta$ 항이 차원 수만큼 선형으로 누적돼 작은 섭동이 큰 활성화 변화를 만든다.',
  d:'$\\|\\eta\\|_\\infty<\\varepsilon$ 인 섭동을 $\\eta=\\text{sign}(w)$ 로 고르면 내적 $w^\\top\\eta$ 는 가중치 평균 크기 $m$, 차원 $n$ 에 대해 대략 $\\varepsilon mn$ 만큼 커진다. $\\varepsilon$ 은 차원과 무관하게 작게 유지되는데 활성화 변화는 $n$ 에 비례해 커지므로, 픽셀 하나하나는 무의미할 만큼 작은 변화라도 수천 차원이 합쳐지면 출력을 뒤집는다. 이건 순수한 선형 모델(softmax 회귀)에서도 일어나는 현상이라 비선형성은 필요조건이 아니다.'},
 {h:'FGSM: gradient 부호 한 번으로 공격을 끝낸다',
  lead:'비용함수를 입력에서 선형화해 $\\eta=\\varepsilon\\,\\text{sign}(\\nabla_x J)$ 로 최적 섭동을 즉시 계산한다.',
  d:'L-BFGS의 반복 탐색 대신, 비용함수를 현재 파라미터 근방에서 1차 근사(선형화)하면 max-norm 제약 안에서 손실을 가장 키우는 방향이 그대로 gradient의 부호가 된다는 것을 보인다. 역전파 한 번이면 계산이 끝나므로 데이터셋 전체에 대해 공격을 대량 생성할 수 있게 됐고, 이것이 적대적 학습을 실용적으로 만든 핵심이다.'},
 {h:'적대적 학습: 공격을 손실 함수에 직접 섞는다',
  lead:'매 스텝 깨끗한 손실과 적대적 손실을 $\\alpha=0.5$ 로 섞은 목적함수로 학습해 강건성과 정확도를 함께 얻는다.',
  d:'$\\tilde J=\\alpha J(\\theta,x,y)+(1-\\alpha)J(\\theta,x+\\eta,y)$ 를 최소화하며, $\\eta$ 는 매 스텝 현재 모델 기준으로 새로 계산되어 계속 갱신되는 표적을 따라간다. MNIST maxout 네트워크에서 오류율을 0.94%→0.84%로 낮췄고, FGSM 오분류율도 89.4%에서 17.9%로 떨어졌다. dropout만으로는 이 정도의 강건성 향상이 나오지 않는다는 대조 실험도 함께 제시한다.'},
 {h:'적대적 예제는 좁은 틈이 아니라 넓은 방향으로 존재한다',
  lead:'옳은 분류는 데이터가 실제로 있는 얇은 다양체 위에서만 성립하고, 그 밖은 대부분 적대적·쓰레기 영역이다.',
  d:'하나의 입력에서 $\\varepsilon$을 연속적으로 바꿔가며 softmax 입력값을 그려보면(원문 Figure 4) 오분류가 **넓은 구간**에서 안정적으로 유지된다 — 유리수처럼 실수 속에 촘촘히 박힌 특이점이 아니라, 방향만 맞으면 폭넓게 존재하는 영역이다. 이 관찰이 "왜 여러 모델이 같은 적대적 예제에 같은 방식으로 속는가"라는 질문에 대한 답으로 이어진다: 서로 다른 모델도 같은 데이터로 학습되면 비슷한 결정 경계 방향(가중치)을 배우기 때문이다.'},
 {h:'RBF 네트워크는 선형이 아니라서 강건하다',
  lead:'국소적으로만 반응하는 RBF 유닛은 학습 밖 영역에서 confidence가 낮아져 적대적 예제에 상대적으로 안전하다.',
  d:'$p(y=1|x)=\\exp(-(x-\\mu)^\\top\\beta(x-\\mu))$ 형태의 RBF는 $\\mu$ 근방에서만 확신 있게 반응하고 나머지 공간에서는 낮은 확신을 유지한다. $\\varepsilon=0.25$ FGSM 공격에서 오류율은 55.4%로 여전히 높지만 틀렸을 때의 평균 confidence는 1.2%에 불과했다 — "확신을 갖고 확실하게 틀리는" 선형 모델과 대조된다. 다만 RBF는 일반화력이 낮아 정확도-강건성의 트레이드오프를 보여주는 사례로 제시된다.'}
],

diagram:{type:'flow', cap:'FGSM 한 스텝. 역전파 한 번으로 원본 이미지를 다른 라벨로 뒤집는 섭동을 만든다.',
 nodes:[
  {t:'입력 x, 정답 y', s:'예: panda 57.7%'},
  {t:'역전파 1회', s:'∇ₓJ(θ,x,y)'},
  {t:'부호만 취함', s:'sign(∇ₓJ)', acc:true},
  {t:'ε 배 스케일', s:'ε=.007'},
  {t:'x + η', s:'gibbon 99.3%'}
 ]},

math:[
 {expr:'η = ε · sign(∇ₓ J(θ, x, y))',
  tex:'\\eta=\\varepsilon\\,\\text{sign}\\!\\left(\\nabla_x J(\\theta,x,y)\\right)',
  d:'FGSM의 정의. 비용함수를 $x$ 에서 선형화했을 때 max-norm 제약 $\\|\\eta\\|_\\infty\\le\\varepsilon$ 아래 손실을 최대로 키우는 방향이 정확히 gradient의 부호다.'},
 {expr:'w·η = w·x + w·η,  η = sign(w) ⇒ 활성화 변화 ≈ εmn',
  tex:'w^{\\top}\\tilde{x}=w^{\\top}x+w^{\\top}\\eta,\\qquad \\eta=\\text{sign}(w)\\ \\Rightarrow\\ \\Delta \\approx \\varepsilon m n',
  d:'선형 모델의 적대적 취약성을 보이는 핵심 부등식. $n$은 입력 차원, $m$은 가중치 평균 크기. $\\varepsilon$이 고정이어도 $n$이 커지면 활성화 변화가 선형으로 커진다.'},
 {expr:'J̃(θ,x,y) = α·J(θ,x,y) + (1−α)·J(θ, x+sign(∇ₓJ(θ,x,y)), y)',
  tex:'\\tilde{J}(\\theta,x,y)=\\alpha J(\\theta,x,y)+(1-\\alpha)J\\!\\left(\\theta,\\,x+\\text{sign}(\\nabla_x J(\\theta,x,y)),\\,y\\right)',
  d:'적대적 학습의 목적함수. 논문은 모든 실험에서 $\\alpha=0.5$ 를 썼다.'}
],

numbers:[
 {k:'ImageNet GoogLeNet 예시', v:'ε=.007', d:'panda(57.7%)→gibbon(99.3%), 8비트 인코딩 최소 단위와 일치'},
 {k:'MNIST softmax 오류율', v:'99.9%', d:'ε=.25 FGSM, 평균 confidence 79.3%'},
 {k:'MNIST maxout 오류율', v:'89.4% → 17.9%', d:'적대적 학습 전후 비교(같은 FGSM 공격 기준)'},
 {k:'적대적 학습 후 테스트 오류', v:'0.94% → 0.84%', d:'dropout 규제 위에 적대적 학습을 추가로 얹은 효과'},
 {k:'앙상블(12개 maxout) 오류율', v:'91.1%', d:'앙상블도 적대적 섭동에 대한 저항력은 제한적'}
],

impact:'"적대적 예제 = 비선형성/과적합의 부작용"이라는 통념을 "적대적 예제 = 고차원에서 선형 모델이 어차피 갖는 성질"로 뒤집으면서, 이후 방어·공격 연구가 훨씬 명확한 이론적 토대 위에 서게 됐다. FGSM 자체는 역전파 한 번으로 끝나는 공격이라 이후 모든 공격·방어 벤치마크의 기본 베이스라인이 되었고, 적대적 학습은 오늘날까지 가장 널리 쓰이는 강건성 확보 기법의 원형이다.',

legacy:[
 '**반복형 공격으로 발전** — FGSM의 단일 스텝을 여러 번 반복하는 BIM/PGD가 사실상의 표준 강한 공격이 됨',
 '**적대적 학습의 정식화** — $\\alpha$ 로 섞는 목적함수가 이후 min-max 강건 최적화(robust optimization) 정식화로 이어짐',
 '**"강건성-정확도 트레이드오프" 논쟁의 출발점** — RBF vs 선형 모델 비교가 이후 강건 정확도(robust accuracy)와 표준 정확도 사이의 근본적 긴장 논의로 확장됨',
 '**프라이버시/안전 공격 계보의 두 번째 벽돌** — [Intriguing Properties](#/p/intriguing)에서 시작된 입력 조작 공격이 여기서 실용적 도구가 되며, 이후 [멤버십 추론](#/p/membership-inference)·[범용 탈옥 공격](#/p/universal-jailbreak) 같은 다양한 공격 표면으로 방법론이 확산'
],

pitfalls:[
 '**"FGSM이 최강 공격"이 아니다.** 단일 스텝 선형 근사이므로, 이후 나온 반복형 공격(PGD 등)에 비해 훨씬 약하다. 논문 자체도 "빠른" 방법이라고만 주장하지 최적이라고 하지 않는다.',
 '**적대적 학습이 반드시 일반화되지 않는다.** 이 논문의 적대적 학습은 FGSM 공격에 대해서만 강건성을 얻은 것이며, 다른 종류(회전, 반복 공격)의 섭동에는 별도로 저항력을 확인해야 한다.',
 '**선형성 설명이 모든 사례를 설명하진 않는다.** 저자들도 maxout의 오분류 중 일부만 선형 가설과 일치한다고 명시했다(softmax가 maxout 예측을 맞추는 비율 84.6% vs RBF 54.3%) — 전부가 아니라 "상당 부분"이라는 표현을 썼다.'
],

figures:[
 {f:'fig1-panda.png',
  cap:'왼쪽이 원본(panda, 57.7%), 가운데가 sign(gradient) 노이즈에 ε=.007을 곱한 섭동, 오른쪽이 둘을 더한 결과 — 사람 눈엔 원본과 구별 안 되지만 GoogLeNet은 99.3% 확신으로 gibbon이라 답한다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig4-linear-region.png',
  cap:'하나의 MNIST 입력(정답 4, 굵은 자홍색 선)에서 ε을 -15~15로 바꿔가며 각 클래스의 softmax 입력값을 그린 그래프. 직선(선형)으로 변하고, 오분류가 ε=0 근처의 좁은 예외가 아니라 넓은 구간에서 안정적으로 유지된다.',
  src:'원문 Figure 4(왼쪽), p.8'}
],

quotes:[
 {t:"We argue instead that the primary cause of neural networks' vulnerability to adversarial perturbation is their linear nature.", src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1412.6572 — Explaining and Harnessing Adversarial Examples', u:'https://arxiv.org/abs/1412.6572'}
]
});
