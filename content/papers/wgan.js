WIKI.paper({
slug:'wgan',
venue:'ICML 2017',
authors:'Arjovsky, Chintala, Bottou (Courant Institute · Facebook AI Research)',
arxiv:'1701.07875',

tldr:'GAN의 불안정성이 아키텍처 문제가 아니라 **거리 선택의 문제**임을 보인 논문. JS divergence를 Wasserstein(Earth-Mover) 거리로 바꾸면 두 분포가 겹치지 않을 때도 gradient가 살아 있고, 판별자의 손실값이 샘플 품질과 상관관계를 갖게 된다.',

context:'[DCGAN](#/p/dcgan) 이후에도 GAN 학습은 여전히 요령의 영역이었다. 학습률을 조금만 바꿔도 발산하고, 모드 붕괴가 나며, 무엇보다 **언제 잘 되고 있는지 알 수 없었다**. 같은 저자들의 선행 논문(Towards Principled Methods)이 원인을 지목했다 — 고해상도 이미지 데이터는 픽셀 공간의 저차원 매니폴드 위에 놓여 있고, 생성 분포도 마찬가지다. 두 저차원 매니폴드는 거의 확실히 겹치지 않으며(측도 0의 교집합), 그러면 [원본 GAN](#/p/gan)이 최소화하는 $JSD$ 는 항상 $\\log 2$ 로 상수다. 상수의 gradient는 0이다. 즉 **판별자가 완벽해질수록 생성자는 아무것도 배우지 못한다.** 실무의 "판별자를 너무 잘 학습시키지 마라"는 요령은 이 병리의 증상이었다.',

ideas:[
 {h:'Earth-Mover 거리: 겹치지 않아도 값이 변한다',
  lead:'분포를 옮기는 최소 운반 비용으로 재면 겹침이 없어도 거리가 연속적으로 변한다.',
  d:'Wasserstein-1 거리는 "한 분포를 다른 분포 모양으로 옮기는 최소 운반 비용"이다. 논문의 평행선 예제가 차이를 명확히 보여준다 — $x=0$ 의 수직선 분포와 $x=\\theta$ 의 수직선 분포에 대해 $JSD$ 는 $\\theta \\ne 0$ 이면 항상 $\\log 2$, KL은 무한대지만, $W = |\\theta|$ 로 **$\\theta$ 에 대해 연속이고 거의 어디서나 미분 가능**하다. 겹침이 없어도 "얼마나 멀리 떨어졌는가"를 알려주므로 gradient가 방향을 준다.'},
 {h:'Kantorovich–Rubinstein 쌍대성으로 계산 가능하게 만든다',
  lead:'1-Lipschitz 함수의 기댓값 차 상한으로 바꿔 신경망이 Wasserstein 거리를 근사하게 한다.',
  d:'운반 계획에 대한 하한(infimum)은 직접 못 푼다. 쌍대 형태를 쓰면 **1-Lipschitz 함수들에 대한 상한** $\\sup_{\\|f\\|_L \\le 1} E_{p_r}[f] - E_{p_g}[f]$ 가 되고, 이 $f$ 를 신경망으로 근사하면 된다. 이 네트워크는 더 이상 진짜/가짜를 분류하지 않으므로 **판별자(discriminator)가 아니라 비평가(critic)** 라 부른다. 출력에 시그모이드가 없고 값의 범위 제한도 없다.'},
 {h:'Lipschitz 제약을 weight clipping으로 강제한다',
  lead:'매 갱신 후 비평가 가중치를 [-c, c]로 잘라 1-Lipschitz 제약을 억지로 맞춘다.',
  d:'$f$ 가 1-Lipschitz여야 쌍대성이 성립한다. 논문은 가장 조잡한 방법을 택한다 — 매 갱신 후 비평가의 모든 가중치를 $[-c, c]$ (기본 $c=0.01$)로 잘라낸다. 파라미터가 컴팩트 집합에 갇히면 함수 전체가 어떤 상수 $K$ 에 대해 $K$-Lipschitz가 되고, 상수배는 거리의 스케일만 바꾸므로 gradient 방향에는 영향이 없다. 논문 스스로 "명백히 형편없는 방법"이라 부르며 더 나은 대안을 촉구한다.'},
 {h:'비평가를 오히려 더 많이 학습시킨다',
  lead:'비평가를 생성자보다 5배 더 학습시켜 W 추정을 정확하게 유지한다.',
  d:'기존 GAN에서는 판별자를 너무 잘 학습시키면 생성자가 죽었다. WGAN에서는 정반대다 — 쌍대 상한을 잘 근사할수록 $W$ 추정이 정확해지므로 **생성자 1스텝당 비평가 5스텝**($n_{critic}=5$)을 돌린다. 두 네트워크의 균형을 아슬아슬하게 맞출 필요가 없다는 것이, 실무에서 체감되는 가장 큰 변화다.'},
 {h:'손실이 드디어 의미를 갖는다',
  lead:'비평가 손실의 음수가 W 추정치가 되어 학습 곡선이 샘플 품질을 반영한다.',
  d:'비평가 손실의 음수값은 $W(p_r, p_g)$ 의 추정치이고, 이 값은 학습이 진행되며 단조롭게 감소하면서 **샘플 품질과 눈에 띄는 상관관계**를 보인다. GAN 3년 역사상 처음으로 "학습 곡선을 보고 진행 상황을 판단"할 수 있게 된 것이다. 논문은 또한 모드 붕괴를 관찰하지 못했다고 보고한다.'}
],

diagram:{type:'compare', cap:'같은 게임, 다른 거리. 바뀐 것은 손실의 형태와 마지막 층이다.',
 left:{t:'원본 GAN (JSD)', items:[
  '판별자 출력에 시그모이드, log 손실',
  '두 분포가 겹치지 않으면 JSD = log 2 (상수)',
  '판별자가 강해질수록 gradient 소실',
  '손실값과 샘플 품질이 무관',
  'D:G 비율을 조심스럽게 맞춰야 함']},
 right:{t:'WGAN (Wasserstein)', items:[
  '비평가 출력은 스칼라 실수, log 없음',
  'W = |θ| 처럼 겹침 없이도 연속·미분 가능',
  '비평가를 5스텝씩 더 학습시킴 (n_critic=5)',
  '손실이 품질과 상관 → 학습 곡선이 읽힌다',
  '가중치를 [-0.01, 0.01]로 clipping']}},

math:[
 {expr:'W(Pr, Pg) = inf_{γ ∈ Π(Pr,Pg)}  E_{(x,y)~γ} [ ||x - y|| ]',
  tex:'W(P_r, P_g) = \\inf_{\\gamma \\in \\Pi(P_r,P_g)} \\mathbb{E}_{(x,y)\\sim\\gamma}\\left[\\|x-y\\|\\right]',
  d:'모든 결합분포(운반 계획) 중 기대 이동거리가 최소인 것. 두 분포의 support가 겹치지 않아도 유한한 값을 갖는다는 것이 JS·KL과의 결정적 차이다.'},
 {expr:'W(Pr, Pg) = sup_{||f||_L ≤ 1}  E_{x~Pr}[f(x)] - E_{x~Pg}[f(x)]',
  tex:'W(P_r,P_g)=\\sup_{\\|f\\|_L\\le 1} \\mathbb{E}_{x\\sim P_r}[f(x)] - \\mathbb{E}_{x\\sim P_g}[f(x)]',
  d:'Kantorovich–Rubinstein 쌍대성. 이 $f$ 를 파라미터 $w$ 의 신경망으로 두고 상한을 근사하는 것이 WGAN의 전부다. 생성자는 $-E_{z}[f(G(z))]$ 를 최소화한다.'},
 {expr:'w ← clip( w + α · RMSProp(∇w [ mean f(x) - mean f(G(z)) ]),  -c,  c )',
  tex:'w \\leftarrow \\text{clip}\\!\\left(w + \\alpha\\cdot\\text{RMSProp}\\!\\left(\\nabla_w\\left[\\tfrac1m\\sum_i f(x^{(i)}) - \\tfrac1m\\sum_i f(G(z^{(i)}))\\right]\\right),\\, -c,\\, c\\right)',
  d:'Algorithm 1의 비평가 갱신. 모멘텀 기반 옵티마이저(Adam)는 손실 지형이 비정상적일 때 학습을 불안정하게 만들어서, 논문은 **RMSProp**을 쓴다.'}
],

numbers:[
 {k:'clipping 상수 c', v:'0.01', d:'가중치를 $[-0.01, 0.01]$ 로 절단. 크면 Lipschitz 제약이 느슨해지고 작으면 gradient가 소실된다'},
 {k:'비평가 스텝 n_critic', v:'5', d:'생성자 1스텝당. 기존 GAN 상식과 정반대 방향'},
 {k:'학습률 α', v:'0.00005', d:'RMSProp. Adam은 불안정해서 배제'},
 {k:'배치 크기 m', v:'64', d:'Algorithm 1의 기본값'},
 {k:'평행선 예제', v:'W = |θ| vs JSD = log 2', d:'거리 선택이 gradient 존재 여부를 가른다는 논문의 핵심 예시'}
],

impact:'GAN 연구의 언어가 바뀌었다. 그 전까지 불안정성은 "요령으로 달래는 것"이었지만, 이후로는 **어떤 divergence를 최소화하고 있으며 그것이 언제 gradient를 주는가**의 문제가 되었다. 실용적으로는 (1) 학습 곡선을 신뢰할 수 있게 되었고, (2) 생성자와 판별자의 균형을 세심하게 맞추는 노동이 줄었으며, (3) 논문 보고 기준 모드 붕괴가 관찰되지 않았다. 다만 weight clipping 자체는 곧 문제로 판명나서, 몇 달 뒤 나온 WGAN-GP(gradient penalty)가 clipping을 gradient norm 페널티로 대체하며 사실상의 표준 자리를 가져갔다.',

legacy:[
 '**WGAN-GP** — clipping 대신 $(\\|\\nabla_{\\hat{x}} f\\|_2 - 1)^2$ 페널티로 Lipschitz를 강제. WGAN 논문이 요청한 개선이 반년 만에 나와 이후 대부분의 GAN이 이 손실을 씀',
 '**스펙트럴 정규화** — 각 층의 최대 특이값으로 나눠 Lipschitz 상수를 직접 통제하는 방식이 판별자 정규화의 표준이 됨',
 '**고해상도 GAN의 전제** — 안정화된 손실 위에서 Progressive Growing과 [StyleGAN](#/p/stylegan)의 1024² 생성이 가능해짐',
 '**최적 수송의 유입** — Wasserstein 거리는 이후 [Flow Matching](#/p/flow-matching) 등 확산·플로우 계열의 이론적 도구로도 계속 등장'
],

pitfalls:[
 '**weight clipping은 논문 스스로 "형편없는 방법"이라 부른 임시 방편이다.** $c$ 가 크면 학습이 오래 걸리고 작으면 gradient가 소실되며, 비평가가 극단적으로 단순한 함수로 수렴해 버리는 부작용이 있다. 지금 WGAN을 쓴다면 clipping이 아니라 gradient penalty나 스펙트럴 정규화를 써야 한다.',
 '**"WGAN을 쓰면 모드 붕괴가 없다"는 보장이 아니다.** 논문의 관찰은 그들의 실험 범위 안에서의 보고다. 비평가가 최적에서 멀면 추정된 $W$ 는 진짜 Wasserstein 거리가 아니며, 이론이 약속한 성질도 그만큼 약해진다.',
 '**비평가 손실값을 모델 간 비교에 쓰면 안 된다.** clipping 상수와 네트워크 용량에 따라 값이 임의의 상수배로 스케일된다. 같은 학습 실행 안에서 시간에 따른 추세를 보는 용도이지, 서로 다른 실험의 절대값을 견주는 지표가 아니다.'
],

figures:[
 {f:'fig2-gradients.png',
  cap:'같은 두 가우시안(파랑=진짜, 초록=가짜)을 분류하도록 학습된 두 판별자를 겹쳐 그렸다. 빨간 곡선(원본 GAN 판별자)은 두 분포 사이에서 순식간에 0 또는 1로 포화돼 그 구간의 기울기가 거의 0이다 — 생성자가 밀어야 할 방향을 못 받는다. 하늘색 곡선(WGAN 비평가)은 전체 구간에서 완만한 직선에 가까워 어디서든 일정한 gradient를 준다.',
  src:'원문 Figure 2, p.9'},
 {f:'fig3-loss-curve.png',
  cap:'x축은 생성자 학습 스텝, y축은 비평가 손실(=Wasserstein 거리 추정치). 곡선 위에 이어 붙인 이미지들이 그 시점에 생성된 침실 샘플이다. 손실이 단조 감소하는 동안 샘플이 노이즈에서 실제 침실 사진으로 점점 또렷해진다 — "손실 곡선만 보고도 학습 진행 상황을 판단할 수 있다"는 이 논문의 핵심 주장을 그대로 보여준다.',
  src:'원문 Figure 3 (DCGAN 부분), p.10'}
],

quotes:[
 {t:'In no experiment did we see evidence of mode collapse for the WGAN algorithm.',
  src:'Section 4.3, p.9'}
],

links:[
 {t:'arXiv 1701.07875 — Wasserstein GAN', u:'https://arxiv.org/abs/1701.07875'},
 {t:'arXiv 1701.04862 — Towards Principled Methods for Training GANs', u:'https://arxiv.org/abs/1701.04862'},
 {t:'arXiv 1704.00028 — Improved Training of Wasserstein GANs (WGAN-GP)', u:'https://arxiv.org/abs/1704.00028'}
]
});
