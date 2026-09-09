WIKI.paper({
slug:'score-sde',
venue:'ICLR 2021 (Oral)',
authors:'Song, Sohl-Dickstein, Kingma, Kumar, Ermon, Poole (Stanford · Google Brain)',
arxiv:'2011.13456',

tldr:'[DDPM](#/p/ddpm)의 1000개 이산 스텝을 **연속 시간의 확률미분방정식(SDE)** 하나로 다시 쓴 논문. 이 틀 안에서 스코어 매칭 계열과 확산 계열이 같은 방정식의 두 사례임이 드러나고, 같은 주변분포를 갖는 결정론적 ODE(probability flow ODE)가 유도되면서 정확한 우도 계산과 임의의 ODE 솔버 사용이 가능해졌다.',

context:'2020년 말, 노이즈로 데이터를 망가뜨렸다가 되돌리는 생성 모델에는 겉보기에 다른 두 계보가 있었다. 하나는 Song & Ermon의 **NCSN/SMLD** — 여러 노이즈 수준에서 스코어 $\\nabla_x\\log p(x)$ 를 추정하고 어닐링 Langevin 동역학으로 샘플링한다. 다른 하나는 [DDPM](#/p/ddpm) — 변분 하한에서 출발해 노이즈 예측 MSE로 학습한다. 둘은 유도 과정도, 노이즈 스케줄도(전자는 분산이 폭발하고 후자는 신호가 보존된다), 샘플러도 달랐다. 게다가 양쪽 모두 "스텝 수 1000"은 그냥 손으로 고른 하이퍼파라미터였고, 스텝을 바꾸면 모델을 다시 학습해야 했다. 이 논문의 질문은 **스텝 수를 무한대로 보내면 무엇이 남는가**이다.',

ideas:[
 {h:'노이즈 추가는 하나의 SDE다',
  lead:'이산 스텝을 무한히 잘게 쪼개면 노이즈 주입 과정이 연속시간 SDE 하나로 수렴한다.',
  d:'$dx = f(x,t)\\,dt + g(t)\\,dw$ 라는 전방 SDE 하나가 데이터 분포를 시간 $t\\in[0,1]$ 에 걸쳐 단순한 사전분포로 옮긴다. 이산 스텝은 이 SDE의 오일러 이산화일 뿐이다. **Variance Exploding(VE)** SDE는 $f=0$ 이고 $g$ 가 커지는 형태로 NCSN에 대응하고, **Variance Preserving(VP)** SDE는 $f=-\\tfrac12\\beta(t)x$ 형태로 [DDPM](#/p/ddpm)에 대응한다. 두 계보가 같은 방정식의 계수 선택 차이로 정리된다.'},
 {h:'생성은 시간을 거꾸로 흐르게 하는 것',
  lead:'모든 확산 SDE는 시간을 되돌리는 짝을 갖고, 거기 필요한 미지수는 스코어 하나뿐이다.',
  d:'Anderson(1982)의 결과에 따르면 모든 확산 SDE는 시간을 되돌리는 SDE를 갖고, 그 식에는 **스코어 $\\nabla_x\\log p_t(x)$ 딱 하나만** 미지수로 들어간다. 즉 학습해야 할 것은 전 시간대의 스코어를 하나의 네트워크 $s_\\theta(x,t)$ 로 근사하는 것뿐이며, 이것은 denoising score matching으로 학습된다. [DDPM](#/p/ddpm)의 노이즈 예측 $\\epsilon_\\theta$ 는 이 스코어의 상수배다.'},
 {h:'Predictor-Corrector 샘플러',
  lead:'수치 솔버(predictor)와 Langevin 보정(corrector)을 번갈아 쓰면 항상 더 낫다.',
  d:'역방향 SDE를 수치적으로 푸는 방법(predictor)과, 각 시점에서 이미 아는 스코어로 Langevin MCMC를 몇 번 돌려 분포를 바로잡는 방법(corrector)은 서로 독립이다. 논문은 둘을 번갈아 쓰면 어느 한쪽만 쓸 때보다 항상 낫다는 것을 보인다. **샘플러가 학습과 완전히 분리된 부품**이 된 첫 사례로, 이후 DPM-Solver 같은 샘플러 연구가 전부 여기서 갈라진다.'},
 {h:'Probability flow ODE — 잡음 없는 쌍둥이',
  lead:'무작위성을 없애도 같은 주변분포를 갖는 결정론적 ODE가 존재해 우도 계산과 보간을 연다.',
  d:'확산항을 절반으로 줄이고 무작위성을 없앤 $dx = [f - \\tfrac12 g^2 s_\\theta]dt$ 는 **모든 시점에서 원래 SDE와 동일한 주변분포**를 갖는다. 확률적 궤적이 결정론적 궤적으로 바뀌면서 세 가지가 따라온다 — (1) 연속 정규화 흐름과 같은 방식으로 **정확한 우도**를 계산할 수 있고, (2) 데이터 하나가 잠재변수 하나에 유일하게 대응해 편집·보간이 가능해지며, (3) 고차 ODE 솔버로 적은 스텝에 풀 수 있다. [DDIM](#/p/ddim)은 이 ODE의 특정 이산화에 해당한다.'},
 {h:'조건부 생성을 사후분포로 처리',
  lead:'베이즈 정리로 조건부 스코어를 두 무조건부 스코어의 합으로 분해한다.',
  d:'베이즈 정리로 $\\nabla_x\\log p_t(x|y) = \\nabla_x\\log p_t(x) + \\nabla_x\\log p_t(y|x)$ 이므로, 무조건부 모델을 재학습하지 않고 **스코어에 항을 더하는 것만으로** 클래스 조건 생성·인페인팅·컬러화·초해상도를 전부 처리할 수 있다. 이 두 번째 항을 분류기로 주는 것이 classifier guidance이고, 분류기 없이 흉내내는 것이 [CFG](#/p/cfg)다.'}
],

diagram:{type:'split', cap:'하나의 스코어 네트워크를 학습하면, 그것을 푸는 방법은 여러 갈래로 나뉜다. 학습과 샘플링이 분리된 것이 이 논문의 구조적 기여다.',
 from:{t:'스코어 네트워크', s:'DSM 학습 · 연속 t∈[0,1]'},
 branches:[
  {t:'역방향 SDE', s:'확률적 · 다양성 ↑'},
  {t:'PC 샘플러', s:'수치해법 + Langevin 보정'},
  {t:'flow ODE', s:'결정론적 · 정확한 우도'}
 ],
 join:'세 경로 모두 같은 주변분포 p_t(x) 를 따른다'},

figures:[
 {f:'fig1-forward-reverse-sde.png',
  cap:'위 줄이 전방 SDE(데이터→노이즈), 아래 줄이 역방향 SDE(노이즈→데이터). 강아지 사진이 오른쪽으로 갈수록 노이즈에 묻히는 것이 전방, 왼쪽 화살표가 그 과정을 되돌리는 역방향이다. 역방향 식의 파란 박스 안 항이 유일한 미지수인 스코어 함수 — 이것 하나만 신경망으로 배우면 화살표를 거꾸로 돌릴 수 있다는 것이 논문 전체의 요지.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'Creating noise from data is easy; creating data from noise is generative modeling.',
  src:'Abstract, p.1'}
],

math:[
 {expr:'전방:  dx = f(x,t) dt + g(t) dw',
  tex:'dx = f(x,t)\\,dt + g(t)\\,dw, \\quad w: \\text{Wiener process}',
  d:'$f=0$ 이면 Variance Exploding(NCSN), $f=-\\tfrac12\\beta(t)x$ 이면 Variance Preserving([DDPM](#/p/ddpm)). 논문은 여기에 sub-VP라는 변형을 추가로 제안한다.'},
 {expr:'역방향:  dx = [ f(x,t) − g(t)² ∇ₓ log p_t(x) ] dt + g(t) dw̄',
  tex:'dx = \\left[ f(x,t) - g(t)^2 \\nabla_x \\log p_t(x) \\right] dt + g(t)\\,d\\bar w',
  d:'미지수는 스코어 하나뿐이다. 확산 모델을 학습한다는 것은 결국 **모든 노이즈 수준에서의 스코어 필드를 하나의 네트워크에 밀어넣는 것**이다.'},
 {expr:'probability flow ODE:  dx = [ f(x,t) − ½ g(t)² ∇ₓ log p_t(x) ] dt',
  tex:'dx = \\left[ f(x,t) - \\tfrac12 g(t)^2 \\nabla_x \\log p_t(x) \\right] dt',
  d:'계수의 $\\tfrac12$ 하나가 확률적 샘플러를 결정론적 흐름으로 바꾼다. 같은 학습된 모델을 그대로 쓰면서 궤적만 달라진다.'}
],

numbers:[
 {k:'CIFAR-10 FID', v:'2.20', d:'[DDPM](#/p/ddpm)의 3.17에서 갱신. 당시 무조건부 생성 최고'},
 {k:'CIFAR-10 Inception Score', v:'9.89', d:'GAN 계열을 포함해도 최상위'},
 {k:'우도', v:'2.99 bits/dim', d:'sub-VP + probability flow ODE. 확산 모델로 얻은 첫 경쟁력 있는 우도'},
 {k:'최대 해상도', v:'1024×1024', d:'스코어 기반 모델로 이 해상도의 고품질 생성을 보인 첫 사례(CelebA-HQ)'},
 {k:'시간 축', v:'연속 t ∈ [0,1]', d:'스텝 수가 하이퍼파라미터에서 **솔버의 선택**으로 바뀐다'}
],

impact:'확산 모델의 **공용어**를 만들었다. 이후 논문들은 "몇 스텝"이 아니라 "어떤 SDE, 어떤 솔버, 어떤 전처리"로 서로를 비교하게 됐고, 노이즈 스케줄·손실 가중치·샘플러가 각각 독립적인 설계 축임이 분명해졌다. 실용적으로 더 컸던 것은 probability flow ODE다 — 확산 모델을 **결정론적 궤적**으로 볼 수 있게 되면서 소수 스텝 샘플러, 궤적 증류, 잠재공간 편집, 정확한 우도 평가가 전부 같은 문에서 나왔다. 나중에 Karras 등의 EDM이 이 틀 위에서 설계 공간을 체계적으로 정리하고, [Flow Matching](#/p/flow-matching)은 아예 SDE를 버리고 ODE만 남기는 데까지 간다.',

legacy:[
 '**ODE 관점의 확산** — [DDIM](#/p/ddim)이 probability flow ODE의 이산화로 재해석되고, DPM-Solver 등 고차 솔버 계열이 여기서 파생',
 '**증류와 소수 스텝 생성** — [Consistency Models](#/p/consistency)는 ODE 궤적 위의 임의의 점을 시작점으로 곧장 매핑하도록 학습해 1~2스텝 생성을 달성',
 '**흐름 기반으로의 재정식화** — [Flow Matching](#/p/flow-matching)/rectified flow가 스코어 대신 속도장을 직접 회귀하며 학습을 더 단순화',
 '**조건부 생성의 이론적 근거** — 스코어 덧셈 형태의 조건화가 classifier guidance와 [CFG](#/p/cfg), 그리고 인페인팅·초해상도 같은 역문제 해법의 공통 기반이 됨'
],

pitfalls:[
 '**"연속이니까 더 정확하다"가 아니다.** 연속 SDE는 분석의 틀이고, 실제 샘플링은 결국 유한 스텝으로 이산화한다. 스텝을 줄이면 이산화 오차가 곧바로 품질 저하로 나타나므로 솔버 선택이 여전히 결정적이다.',
 '**VE와 VP는 서로 갈아끼울 수 없다.** 두 SDE는 노이즈 스케일의 범위 자체가 다르므로, 전처리·네트워크 스케일링·샘플러 하이퍼파라미터를 함께 바꾸지 않고 스케줄만 교체하면 학습이 무너진다.',
 '**probability flow ODE의 우도는 모델 우도이지 데이터 우도가 아니다.** 스코어 추정 오차가 있는 상태의 ODE로 계산한 값이라, 우도가 좋아져도 샘플 품질(FID)은 오히려 나빠지는 구간이 존재한다.'
],

links:[
 {t:'arXiv 2011.13456 — Score-Based Generative Modeling through SDEs', u:'https://arxiv.org/abs/2011.13456'},
 {t:'공식 구현 (yang-song/score_sde_pytorch)', u:'https://github.com/yang-song/score_sde_pytorch'},
 {t:'Generative Modeling by Estimating Gradients (Yang Song 블로그)', u:'https://yang-song.net/blog/2021/score/'}
]
});
