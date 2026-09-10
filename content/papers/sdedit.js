WIKI.paper({
slug:'sdedit',
venue:'ICLR 2022',
authors:'Meng, He, Song, Song, Wu, Zhu, Ermon (Stanford · CMU)',
arxiv:'2108.01073',

tldr:'확산모델로 이미지를 편집하는 가장 단순한 방법 — 스케치나 대충 합성한 이미지에 적당량의 잡음을 섞은 뒤 [Score SDE](#/p/score-sde)의 역방향 과정으로 되돌리기만 하면, 별도 학습이나 손실 함수 설계 없이 사실적인 이미지가 나온다.',

context:'2021년 당시 스트로크(색칠) 스케치를 사진으로 바꾸거나 이미지를 합성하는 작업은 conditional GAN이나 GAN inversion에 의존했다. 두 방법 모두 태스크마다 학습 데이터를 새로 모으거나 전용 손실 함수를 설계해야 했고, GAN inversion은 잠재 공간에 guide를 투영하는 과정 자체가 어렵고 불안정했다. 반면 [Score SDE](#/p/score-sde)·[DDPM](#/p/ddpm) 계열 확산모델은 이미 사실적인 이미지의 분포를 학습해 뒀다. 이 논문의 질문은 단순하다 — **guide를 처음부터(t=1) 생성하는 대신, 이미 어느 정도 그려진 guide에서 중간 시점부터 역과정을 시작하면 되지 않을까?**',

ideas:[
 {h:'guide에 잡음을 섞고 SDE를 거꾸로 푼다',
  lead:'guide 이미지를 중간 시점 $t_0$ 까지만 순방향 확산시킨 뒤, 거기서부터 역방향 SDE로 되돌린다.',
  d:'거친 스트로크 그림이나 대충 오려붙인 합성 이미지 $x^{(g)}$ 에 $\\sigma^2(t_0)$ 만큼의 가우시안 잡음을 더해 자연 이미지 매니폴드 근처로 밀어 넣은 뒤, 사전학습된 score 모델로 $t_0$ 에서 $0$ 까지 역방향 SDE를 풀어 되돌린다. guide의 부자연스러운 경계·색상은 잡음에 씻겨나가고, 전체적인 배치·구도는 남는다.'},
 {h:'$t_0$ 하나가 사실성-충실도 트레이드오프의 손잡이',
  lead:'$t_0$ 가 클수록 더 사실적이지만 원본 guide에서 멀어지고, 작을수록 guide에 충실하지만 부자연스러움이 남는다.',
  d:'$t_0=0$ 은 guide 자체(충실하지만 비사실적), $t_0=1$ 은 완전한 무작위 샘플(사실적이지만 guide와 무관)이다. 그 사이 어딘가에 "sweet spot"이 있고, 저자들은 LSUN 실험에서 경험적으로 $t_0\\in[0.3, 0.6]$ 구간이 잘 작동함을 보인다. 사용자와 상호작용하며 이분 탐색으로 적절한 $t_0$ 를 찾는 절차도 제시한다.'},
 {h:'태스크별 재학습이 필요 없는 통일된 프레임워크',
  lead:'같은 사전학습 모델 하나로 스트로크→이미지, 스트로크 편집, 이미지 합성을 전부 처리한다.',
  d:'conditional GAN처럼 태스크별 쌍(paired) 데이터나 손실 함수를 새로 설계할 필요가 없다. guide를 만드는 방식(고수준 스트로크·기존 이미지 위 부분 수정·이미지 합성)만 바뀔 뿐, "잡음을 섞고 되돌린다"는 절차 자체는 동일하다.'},
 {h:'이론: 잡음이 충분하면 사실성이 확률적으로 보장된다',
  lead:'score 함수가 유계라는 가정 아래, $t_0$ 가 클수록 출력이 guide와 멀어질 확률적 상한이 커진다는 것을 증명한다(Proposition 1).',
  d:'score $s_\\theta$ 의 노름이 상수로 유계라고 가정하면, SDEdit 출력과 guide 사이의 $L_2$ 거리 제곱이 $\\sigma^2(t_0)$ 에 비례하는 값으로 확률적으로 상한이 잡힌다. 이는 사실성-충실도 트레이드오프가 우연한 경험적 관찰이 아니라 SDE의 구조에서 나오는 필연적 결과임을 보여준다.'}
],

diagram:{type:'loop', cap:'guide에 잡음을 섞고 역방향 SDE로 되돌리는 절차. t0가 유일한 손잡이.',
 center:'t0 만큼만 되돌림',
 nodes:[
  {t:'guide 이미지', s:'스트로크·합성'},
  {t:'가우시안 잡음 주입', s:'σ²(t0)까지', acc:true},
  {t:'역방향 SDE', s:'t0 → 0'},
  {t:'출력 이미지', s:'사실적+충실'}
 ]},

math:[
 {expr:'x(g)(t0) ~ N(x(g), σ²(t0) I),  이후 역방향 SDE로 x(0) 생성',
  tex:'\\mathbf{x}^{(g)}(t_0)\\sim\\mathcal{N}\\!\\left(\\mathbf{x}^{(g)};\\,\\sigma^2(t_0) I\\right)',
  d:'SDEdit 절차의 전부. guide $x^{(g)}$ 에 분산 $\\sigma^2(t_0)$ 의 잡음을 더한 뒤, 사전학습된 [Score SDE](#/p/score-sde) 모델의 역방향 과정을 $t_0$ 에서 $0$ 까지 풀어 최종 이미지를 만든다. 새로운 학습이 전혀 필요 없다.'},
 {expr:'‖x(g) − SDEdit(x(g); t0, θ)‖² ≤ σ²(t0)(Cσ²(t0) + d + 2√(−d·logδ) − 2logδ), 확률 1−δ 이상',
  tex:'\\left\\lVert \\mathbf{x}^{(g)}-\\text{SDEdit}(\\mathbf{x}^{(g)};t_0,\\theta)\\right\\rVert_2^2 \\le \\sigma^2(t_0)\\!\\left(C\\sigma^2(t_0)+d+2\\sqrt{-d\\cdot\\log\\delta}-2\\log\\delta\\right)',
  d:'score $\\|s_\\theta(x,t)\\|_2^2\\le C$ 로 유계라는 가정 아래 성립하는 확률적 상한(Proposition 1). $t_0$(따라서 $\\sigma^2(t_0)$)가 커질수록 guide와 출력의 거리 상한도 커진다 — 충실도가 왜 $t_0$ 에 단조적으로 나빠지는지를 수식으로 보여준다.'}
],

numbers:[
 {k:'스트로크→이미지 사실성', v:'최대 +98.09%', d:'LSUN bedroom, StyleGAN2-ADA 대비 MTurk 선호도'},
 {k:'종합 만족도', v:'최대 +91.72%', d:'사실성+충실도 종합, GAN 베이스라인 대비 MTurk 선호도'},
 {k:'충실도(L2)', v:'32.55', d:'LSUN bedroom, SDEdit — 최고 GAN 베이스라인(53.76, e4e)보다 낮음(작을수록 좋음)'},
 {k:'권장 t0 범위', v:'0.3 ~ 0.6', d:'LSUN 스트로크 실험에서 사실성·충실도 균형이 맞는 구간'},
 {k:'이미지 합성 L2', v:'21.70', d:'CelebA-HQ 합성 실험, 최고 GAN 베이스라인(36.67, in-domain GAN)보다 낮음'}
],

impact:'이미지 편집을 "guide에서 재생성으로 이어지는 하나의 확산 과정"으로 단순화해, 편집·합성·스케치-투-이미지를 하나의 학습 없는 절차로 통일했다. Conditional GAN이 필요로 했던 태스크별 데이터·손실 설계가 사라지고, 사전학습된 생성모델 하나로 여러 편집 작업을 처리할 수 있음을 보였다. $t_0$(또는 이후 논문들의 노이즈 강도·strength 파라미터)를 편집 강도의 손잡이로 노출하는 방식은 이후 diffusion 기반 이미지 편집 도구 대부분의 기본 인터페이스가 되었다.',

legacy:[
 '**"strength" 슬라이더의 기원** — Stable Diffusion 등 공개 도구의 img2img 기능이 쓰는 노이즈 강도 파라미터가 이 논문의 $t_0$ 개념을 그대로 물려받음',
 '**태스크별 재학습 없는 편집의 표준화** — 이후 [DreamBooth](#/p/dreambooth)류의 개인화 편집과 달리, SDEdit 계열은 모델을 전혀 건드리지 않고 추론 시점 조작만으로 편집을 수행하는 계열을 열었다',
 '**guide 기반 이미지 합성의 벤치마크화** — 스트로크·컴포지팅 실험 설정이 이후 확산 기반 이미지 편집 논문들의 표준 평가 태스크로 굳어짐',
 '**결정론적 inversion 계열과의 분기** — 이후 등장한 DDIM inversion·null-text inversion 같은 정밀 편집 기법들은 SDEdit의 "잡음 후 되돌리기"보다 원본 보존을 강화하는 방향으로 발전함'
],

pitfalls:[
 '**$t_0$ 가 모든 guide에 대해 보편적으로 최적인 값이 아니다.** 논문도 guide 품질에 따라 최적 $t_0$ 가 달라질 수 있다고 명시하며, 같은 태스크 안에서 공유 $t_0$ 를 쓰는 것은 경험적 근사다.',
 '**"학습이 필요 없다"는 사전학습된 강력한 score 모델이 이미 있다는 전제 하의 얘기다.** SDEdit 자체는 생성모델을 새로 학습하지 않지만, 그 바탕이 되는 [Score SDE](#/p/score-sde)/[DDPM](#/p/ddpm) 모델은 대규모 데이터로 미리 학습돼 있어야 한다.',
 '**원본을 정확히 보존하는 편집과는 다르다.** SDEdit은 guide를 잡음으로 흐린 뒤 다시 생성하는 확률적 과정이라, 편집하지 않으려는 영역까지 세부가 바뀔 수 있다 — 이는 이후 마스크 채널을 추가하는 확장으로 부분적으로 보완된다.'
],

figures:[
 {f:'fig1-overview.png',
  cap:'왼쪽 절반이 스트로크 그림 → 이미지, 오른쪽 절반이 스트로크로 기존 사진을 수정하는 편집. 각 줄에서 왼쪽이 사용자가 만든 거친 guide, 오른쪽이 SDEdit 출력이다. 같은 절차 하나로 서로 다른 두 태스크를 처리한다는 점이 이 그림의 핵심.',
  src:'원문 Figure 1, p.1'},
 {f:'fig3-tradeoff.png',
  cap:'왼쪽 그래프: $t_0$ 가 커질수록 KID(파란선, 낮을수록 사실적)는 내려가고 $L_2$(주황선, guide와의 거리)는 올라간다 — 두 선이 교차하는 근처가 "sweet spot". 오른쪽: 같은 침실 guide를 $t_0=0$(guide 그대로)부터 $t_0=1$(guide와 무관한 무작위 샘플)까지 늘려가며 생성한 결과로, 오른쪽으로 갈수록 사실적이지만 원래 배치를 잃는다.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'The key intuition of SDEdit is to "hijack" the generative process of SDE-based generative models.',
  src:'Section 1, p.2'}
],

links:[
 {t:'arXiv 2108.01073 — SDEdit: Guided Image Synthesis and Editing with Stochastic Differential Equations', u:'https://arxiv.org/abs/2108.01073'},
 {t:'프로젝트 페이지', u:'https://sde-image-editing.github.io/'}
]
});
