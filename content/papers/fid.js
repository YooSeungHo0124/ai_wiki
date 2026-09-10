WIKI.paper({
slug:'fid',
venue:'NeurIPS 2017',
authors:'Heusel, Ramsauer, Unterthiner, Nessler, Hochreiter (Johannes Kepler University Linz)',
arxiv:'1706.08500',

tldr:'GAN 학습이 실제로 수렴한다는 이론적 보장(TTUR)과, 그 결과물의 품질을 재는 지표(FID)를 한 논문에서 함께 내놓았다. 오늘날 생성모델 논문 대부분이 성능표에 싣는 **FID**의 출처가 바로 이 논문이다.',

context:'2017년 GAN 연구는 두 가지 구멍을 안고 있었다. 하나는 이론: [GAN](#/p/gan) 학습은 생성자·판별자가 같은 속도로 번갈아 갱신되는 게임인데, 이 과정이 정말 균형점에 **수렴한다는 증명**이 없었다. 다른 하나는 평가: [Inception Score](#/p/improved-gan)가 표준이었지만 생성 이미지의 통계만 보고 실제 데이터의 통계와는 비교하지 않는다는 약점이 있었다. 그 허점을 정면으로 파고든 [Inception Score 비판](#/p/inception-score-note)도 이미 나와 있었다. 이 논문은 학습 규칙(TTUR)과 평가 지표(FID)를 같은 틀 — 확률적 근사 이론과 특징 공간의 통계 — 안에서 동시에 풀었다.',

ideas:[
 {h:'TTUR: 판별자와 생성자에 서로 다른 학습률',
  lead:'느리게 배우는 생성자와 빠르게 배우는 판별자를 분리해 수렴을 증명한다.',
  d:'기존엔 생성자·판별자에 같은 학습률을 썼다. 이 논문은 판별자 학습률 $b(n)$, 생성자 학습률 $a(n)$ 을 따로 둔다. 판별자가 더 빠르게(먼저) 수렴하면, 생성자 입장에서는 판별자가 거의 정지된 목표물처럼 보여 **두 확률적 근사(stochastic approximation) 과정이 서로 다른 시간 축에서 독립적으로 분석**된다. 확률적 근사 이론(Borkar)을 빌려 이 조건에서 정상적 지역 내시 균형(stationary local Nash equilibrium)으로 수렴함을 증명했다.'},
 {h:'Adam은 마찰이 있는 무거운 공(heavy ball)이다',
  lead:'Adam의 갱신 규칙을 2차 미분방정식으로 재해석해 평평한 최솟값을 선호함을 보인다.',
  d:'Adam의 모멘텀·정규화 갱신식을 연속시간 극한으로 보내면 관성과 마찰이 있는 물리계(heavy ball with friction, HBF)의 운동방정식이 된다. 이 관점에서 Adam은 좁고 뾰족한 극소값을 관성으로 지나쳐 **평평한 극소값에 안착**하는 경향을 갖는다는 것을 보이고, TTUR의 수렴 증명을 SGD에서 Adam으로 확장했다.'},
 {h:'FID: 실제 데이터와 생성 데이터를 같은 통계로 비교',
  lead:'Inception 특징을 가우시안으로 가정하고 두 가우시안 사이 거리로 품질을 잰다.',
  d:'[Inception Score](#/p/improved-gan)는 생성 이미지만 Inception 모델에 통과시켜 클래스 확신도·다양성을 본다 — **실제 이미지의 통계가 아예 들어가지 않는다.** FID는 실제 이미지 집합과 생성 이미지 집합 각각을 Inception-v3의 마지막 풀링층(2048차원)에 통과시켜, 두 집합을 평균·공분산만 가진 다변량 가우시안으로 근사한 뒤 그 둘 사이의 **Fréchet 거리(= Wasserstein-2 거리)**를 잰다. 가우시안 가정은 임의로 고른 것이 아니라 "평균·공분산이 주어졌을 때 최대 엔트로피 분포"라는 근거를 댔다.'},
 {h:'FID는 교란에 단조 반응하는지로 검증했다',
  lead:'노이즈·블러·스월 등 여섯 종류 교란을 단계적으로 키워 FID가 일관되게 증가하는지 확인한다.',
  d:'가우시안 노이즈, 가우시안 블러, 검은 사각형 삽입, 스월(소용돌이) 왜곡, 소금-후추 노이즈, 다른 데이터셋 이미지 섞기 — 여섯 종류의 교란을 0단계에서 최고 단계까지 올려가며 FID를 측정했다. 여섯 경우 모두 FID가 단조 증가했고, 부록에서 같은 실험을 Inception Score(정확히는 이를 거리로 변환한 값)로도 돌려 FID가 **더 일관적으로 반응**함을 보였다.'},
 {h:'실측: TTUR이 표준 학습보다 항상 더 좋은 FID',
  lead:'DCGAN·WGAN-GP를 CelebA·CIFAR-10·SVHN·LSUN에서 같은 학습률로 직접 비교한다.',
  d:'같은 아키텍처([DCGAN](#/p/dcgan), WGAN-GP)를 단일 학습률 학습과 TTUR 학습으로 각각 최적화해 비교했다. 네 이미지 데이터셋 전부에서 TTUR의 최종 FID가 더 낮았고, 특히 CelebA·LSUN에서는 단일 학습률 쪽이 아예 발산하는 경우도 있었다. 텍스트 생성(One Billion Word)에서도 같은 경향이 Jensen-Shannon divergence로 확인됐다.'}
],

diagram:{type:'compare', cap:'Inception Score와 FID의 근본적 차이 — 무엇과 무엇을 비교하는가.',
 left:{t:'Inception Score', items:['생성 이미지만 봄','실제 데이터 통계 미사용','클래스 확신도 + 다양성']},
 right:{t:'FID', items:['실제 vs 생성 둘 다 봄','Inception 특징을 가우시안화','두 가우시안의 Fréchet 거리'], acc:true}},

math:[
 {expr:'d²((m,C), (mw,Cw)) = ||m - mw||² + Tr(C + Cw - 2(C·Cw)^(1/2))',
  tex:'d^2\\big((\\mathbf m,\\mathbf C),(\\mathbf m_w,\\mathbf C_w)\\big)=\\|\\mathbf m-\\mathbf m_w\\|_2^2+\\text{Tr}\\!\\left(\\mathbf C+\\mathbf C_w-2(\\mathbf C\\mathbf C_w)^{1/2}\\right)',
  d:'FID 그 자체다. $(m,C)$ 는 실제 이미지, $(m_w,C_w)$ 는 생성 이미지의 Inception 특징 평균·공분산. 평균 차이 항과 공분산 차이(행렬 제곱근 포함) 항의 합 — 값이 작을수록 두 분포가 가깝다.'},
 {expr:'θ(n+1) = θ(n) + a(n)[h(θ(n),w(n)) + M_θ(n+1)],  w(n+1) = w(n) + b(n)[g(θ(n),w(n)) + M_w(n+1)]',
  tex:'\\begin{aligned}\\theta(n+1) &= \\theta(n) + a(n)\\left[h(\\theta(n),w(n)) + M_\\theta(n+1)\\right]\\\\ w(n+1) &= w(n) + b(n)\\left[g(\\theta(n),w(n)) + M_w(n+1)\\right]\\end{aligned}',
  d:'TTUR의 정의 그 자체 — 생성자 $\\theta$ 는 학습률 $a(n)$, 판별자 $w$ 는 학습률 $b(n)$ 으로 갱신된다. $b(n)$ 이 $a(n)$ 보다 충분히 빨리 줄어들면(더 빠르게 수렴하면) 두 확률적 근사 과정이 분리되어 수렴 증명이 성립한다.'}
],

numbers:[
 {k:'FID 계산 표본 수', v:'50,000장', d:'생성 이미지 5만 장을 Inception-v3에 통과시켜 평균·공분산 추정'},
 {k:'DCGAN · CelebA FID', v:'TTUR 12.5 vs 기존 21.4', d:'같은 아키텍처, 학습률만 TTUR 적용'},
 {k:'WGAN-GP · LSUN FID', v:'TTUR 9.5 vs 기존 20.5', d:'절반 이하로 개선, 분산도 크게 감소'},
 {k:'Inception 특징 차원', v:'2048d', d:'Inception Score와 달리 **마지막 풀링층**(분류 직전)을 사용'},
 {k:'수렴 이론', v:'stationary local Nash equilibrium', d:'Borkar(1997)의 확률적 근사 이론 적용'}
],

impact:'FID는 발표 후 몇 년 안에 GAN 이후 거의 모든 이미지 생성 논문의 표준 벤치마크 지표가 됐다 — [BigGAN](#/p/biggan), [StyleGAN](#/p/stylegan)부터 이후 diffusion 계열까지 성능표 첫 줄에 FID가 오른다. TTUR도 [BigGAN](#/p/biggan)을 포함한 후속 GAN 학습에 그대로 채택됐다. 지표 하나가 이렇게 널리 쓰인 이유는 단순하다 — Inception Score와 달리 **"진짜 이미지와 얼마나 비슷한가"를 직접 재고, 사람 판단과의 상관관계도 더 좋았기 때문**이다.',

legacy:[
 '**GAN 벤치마크의 사실상 표준** — 이후 거의 모든 이미지 생성 논문이 FID를 1순위 지표로 보고',
 '**FID의 한계도 곧 지적됨** — 표본 수가 적으면 추정치가 편향된다는 점을 [Kernel Inception Distance(KID)](https://arxiv.org/abs/1801.01401)가 지적하며 대안을 제시',
 '**TTUR은 이후 GAN 학습의 기본 관행** — 판별자·생성자 학습률을 다르게 주는 것이 특별한 기법이 아니라 당연한 선택이 됨',
 '**"평가 지표 자체가 연구 주제"라는 흐름 형성** — FID·Inception Score 논쟁이 이후 [생성모델 평가 비판](#/p/eval-generative-note)이 제기한 문제의식과 함께 생성모델 평가론을 하나의 하위 분야로 만듦'
],

pitfalls:[
 '**FID는 "가우시안"이라는 강한 가정에 의존한다.** Inception 특징이 실제로 다변량 가우시안을 따른다는 보장은 없고, 평균·공분산(1·2차 모멘트)만 보므로 그 이상의 분포 차이는 놓친다.',
 '**FID는 표본 수에 따라 편향된다.** 생성 이미지 수가 적을수록(특히 수천 장 이하) FID가 체계적으로 높게 나오는 경향이 있어, 서로 다른 논문의 FID 수치를 표본 수 확인 없이 그대로 비교하면 오해하기 쉽다.',
 '**FID가 낮다고 지각 품질이 항상 좋은 것은 아니다.** Inception-v3 특징 공간이라는 렌즈를 통한 거리일 뿐이라, 이 특징이 잘 포착하지 못하는 결함(텍스처 반복, 국소적 왜곡)은 FID에 잘 드러나지 않을 수 있다.'
],

figures:[
 {f:'fig3-sanity-check.png',
  cap:'여섯 종류 교란(가우시안 노이즈·블러·검은 사각형·스월·소금후추 노이즈·타 데이터셋 혼입)을 0→3단계로 키우면서 FID를 측정한 그래프. 모든 경우 FID가 단조 증가 — "더 망가진 이미지일수록 FID가 커진다"는 지표의 최소 요건을 직접 확인한 것.',
  src:'원문 Figure 3, p.6'}
],

quotes:[
 {t:'For the evaluation of the performance of GANs at image generation, we introduce the ‘Fréchet Inception Distance” (FID) which captures the similarity of generated images to real ones better than the Inception Score.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1706.08500 — GANs Trained by a Two Time-Scale Update Rule Converge to a Local Nash Equilibrium', u:'https://arxiv.org/abs/1706.08500'},
 {t:'공식 구현 (bioinf-jku/TTUR)', u:'https://github.com/bioinf-jku/TTUR'}
]
});
