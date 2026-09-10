WIKI.paper({
slug:'df-gan',
venue:'CVPR 2022',
authors:'Tao et al. (Nanjing U. Posts & Telecom · ETH Zürich · Peng Cheng Lab)',
arxiv:'2008.05865',

tldr:'텍스트→이미지 생성에서 다단계(stacked) 생성기 구조를 통째로 버리고, **생성기 1개 + 판별기 1개**만으로 고해상도 이미지를 직접 뽑아낸 논문. 대신 판별기 쪽에 "이 이미지가 이 텍스트와 실제로 맞는가"를 직접 벌점으로 물어보는 장치(MA-GP)를 넣어 텍스트-이미지 정합성을 보완했다.',

context:'StackGAN 계열 이후 text-to-image GAN은 저해상도 생성기 $G_0$가 대략적 형태를 만들고, $G_1, G_2$가 이를 단계적으로 고해상도로 다듬는 **다단계 구조**가 정석이었다. AttnGAN은 여기에 단어 단위 cross-modal attention과 DAMSM이라는 보조 네트워크를 더해 정합성을 높였다. 그런데 이 구조는 세 가지 대가를 치른다. 서로 다른 해상도의 생성기들이 얽혀 최종 이미지가 "흐릿한 형태 + 몇 개의 디테일 조합"처럼 보이고(entanglement), DAMSM·cycle consistency 같은 추가 네트워크를 고정해 붙여야 하고, cross-modal attention은 계산 비용 때문에 몇몇 해상도에서만 쓸 수 있다. 질문은 단순하다 — **여러 생성기를 얽어 쌓지 않고도 고해상도·정합성을 둘 다 얻을 수 있는가?**',

ideas:[
 {h:'One-stage 백본: 생성기 하나로 끝까지 간다',
  lead:'저해상도→고해상도로 이어지던 다단계 생성기를 생성기 1개로 대체한다.',
  d:'노이즈 $z$를 FC로 펼친 뒤 UPBlock을 여러 번 통과시켜 한 번에 목표 해상도까지 upsample한다. 생성기가 하나뿐이라 서로 다른 스케일의 생성기끼리 얽히는 entanglement가 원천적으로 없다. 대신 깊어진 네트워크를 안정적으로 학습시키기 위해 UPBlock 내부에 residual block을 넣고 [BigGAN](#/p/biggan) 계열처럼 hinge loss로 적대적 학습을 안정화한다. gradient penalty 자체는 [WGAN](#/p/wgan) 계열에서 온 개념을 조건부로 확장한 것이다.'},
 {h:'Matching-Aware Gradient Penalty: 판별기를 텍스트에 민감하게 만든다',
  lead:'실제 이미지-일치 텍스트 쌍에서만 gradient penalty를 걸어 정합성을 직접 학습시킨다.',
  d:'DAMSM 같은 별도의 정합성 판정 네트워크를 붙이는 대신, 판별기 자체의 loss surface를 조정한다. 실제 이미지와 그에 맞는 텍스트의 조합 $(x, e)$에서만 판별기 출력의 gradient(이미지에 대한 것과 텍스트 임베딩에 대한 것 모두)에 벌점을 준다. 이러면 판별기가 "진짜인지"뿐 아니라 "이 텍스트와 맞는지"에 대해서도 매끄러운 loss surface를 만들어, 생성기가 그 방향으로 수렴하기 쉬워진다.'},
 {h:'One-Way Output: 대칭적 실수/텍스트 결합을 없앤다',
  lead:'이미지 특징과 텍스트 벡터를 대칭적으로 합치던 방식을 한 방향 출력으로 단순화한다.',
  d:'기존 판별기는 이미지 특징과 텍스트 벡터를 concat한 뒤 대칭적으로 처리해 정합성 점수를 냈다. DF-GAN은 이 결합을 단순화한 One-Way Output으로 바꿔, MA-GP와 결합했을 때 학습이 더 잘 수렴하도록 만든다. 소거 실험에서 MA-GP만 넣었을 때보다 One-Way Output까지 더했을 때 FID가 32.52→23.16(COCO)으로 크게 줄었다.'},
 {h:'DFBlock: 텍스트를 이미지 특징에 계속 다시 주입한다',
  lead:'Conditional Batch Normalization을 변형해 모든 해상도의 UPBlock마다 텍스트를 다시 섞는다.',
  d:'생성기가 하나뿐이면 텍스트 조건을 초반에 한 번만 넣고 끝나기 쉬운데, DFBlock은 Affine layer 두 개로 텍스트 임베딩에서 뽑은 scale·shift를 이미지 특징 맵의 채널마다 반복 적용한다. 여러 UPBlock에 걸쳐 이 fusion을 쌓으면 텍스트 정보가 해상도 전 구간에서 계속 다시 섞여, cross-modal attention 없이도 세밀한 속성(부리 색, 날개 무늬)까지 반영된다.'},
 {h:'네트워크 하나로 파라미터를 10배 이상 줄인다',
  lead:'생성기·판별기·정합성 판정을 한 쌍의 네트워크에 몰아 넣어 모델을 극단적으로 가볍게 만든다.',
  d:'[AttnGAN](https://arxiv.org/abs/1711.10485)은 230M, DM-GAN은 46M 파라미터를 쓰지만 DF-GAN은 19M으로 더 낮은 FID를 낸다. 추가 네트워크(DAMSM, cycle consistency, Siamese)를 전혀 쓰지 않고도 이 결과를 얻었다는 점이 "복잡한 보조 장치가 정합성의 필수 조건은 아니다"를 보여준다.'}
],

diagram:{type:'compare', cap:'기존 다단계 GAN과 DF-GAN의 구조 차이. 생성기 개수 자체가 다르다.',
 left:{t:'기존: StackGAN/AttnGAN', items:['G0→G1→G2 다단계 생성','생성기 간 entanglement 발생','DAMSM 등 보조망 고정 부착','cross-attn은 일부 해상도만']},
 right:{t:'DF-GAN: 1단계', items:['생성기 1개가 끝까지 upsample','MA-GP로 판별기가 정합성 학습','One-Way Output으로 결합 단순화','DFBlock이 전 해상도에 텍스트 재주입']}},

math:[
 {expr:'L_D = -E[min(0,-1+D(x,e))] - 1/2 E[min(0,-1-D(G(z),e))] - 1/2 E[min(0,-1-D(x,e_mis))]',
  tex:'\\begin{aligned}\\mathcal{L}_D = &-\\mathbb{E}_{x\\sim\\mathbb{P}_r}[\\min(0,-1+D(x,e))]\\\\ &-\\tfrac{1}{2}\\mathbb{E}_{G(z)\\sim\\mathbb{P}_g}[\\min(0,-1-D(G(z),e))]\\\\ &-\\tfrac{1}{2}\\mathbb{E}_{x\\sim\\mathbb{P}_{mis}}[\\min(0,-1-D(x,e))]\\end{aligned}',
  d:'판별기 loss는 세 항을 본다 — 진짜 이미지+맞는 텍스트, 가짜 이미지, 그리고 진짜 이미지지만 **틀린 텍스트**($\\mathbb{P}_{mis}$)와 짝지은 경우. 이 세 번째 항이 정합성 판별의 핵심이다.'},
 {expr:'MA-GP: k·E[(||∇_x D(x,e)|| + ||∇_e D(x,e)||)^p], 단 (x,e) ~ P_r 이고 이미지-텍스트가 일치할 때만',
  tex:'k\\,\\mathbb{E}_{(x,e)\\sim\\mathbb{P}_r}\\left[\\left(\\lVert\\nabla_x D(x,e)\\rVert + \\lVert\\nabla_e D(x,e)\\rVert\\right)^{p}\\right]',
  d:'이미지에 대한 gradient뿐 아니라 텍스트 임베딩 $e$ 에 대한 gradient에도 동시에 벌점을 준다는 점이 일반 gradient penalty와 다르다. 이 항이 실제 정답 쌍 근처에서 판별기의 loss surface를 평탄하게 만들어 생성기가 그쪽으로 수렴하도록 유도한다.'}
],

numbers:[
 {k:'FID · COCO', v:'19.32', d:'AttnGAN 35.49, DM-GAN 32.64 대비 대폭 개선'},
 {k:'FID · CUB', v:'14.81', d:'AttnGAN 23.98 대비 개선, 당시 TIME(14.30)에는 근소하게 뒤짐'},
 {k:'Inception Score · CUB', v:'5.10', d:'AttnGAN 4.36, DM-GAN 4.75보다 높음'},
 {k:'파라미터 수', v:'19M', d:'AttnGAN 230M · DM-GAN 46M 대비 최소'},
 {k:'평가 이미지 수', v:'30,000장', d:'IS·FID 계산에 사용, 테스트셋에서 샘플링'},
 {k:'소거: MA-GP + One-Way Output', v:'FID 43.45→23.16 (COCO)', d:'baseline one-stage 백본 대비, DFBlock 추가 전 단계'}
],

impact:'"고해상도 text-to-image에는 다단계 생성기가 필수"라는 당시의 암묵적 전제를 깼다. 정합성을 얻는 방법을 **판별기 쪽 손실 설계**(MA-GP)로 옮기면서, 이미지 생성 파이프라인 자체는 단일 GAN으로 단순화할 수 있음을 보였다. 이는 이후 diffusion 기반 text-to-image([Imagen](#/p/imagen), [DALL-E 2](#/p/dalle2))가 다단계 refine 대신 **단일 모델 + 조건 강화**(classifier-free guidance 등) 방향으로 가는 흐름과 방향이 같다. GAN 계열에서는 복잡한 보조 네트워크 없이도 경쟁력 있는 정합성을 낼 수 있다는 근거를 제공했다.',

legacy:[
 '**One-stage 계열의 정착** — 이후 GAN 기반 text-to-image 연구가 다단계 대신 단일 생성기 + 강한 조건화 손실 설계로 무게중심을 옮김',
 '**Gradient penalty의 조건부 확장** — MA-GP처럼 "정답 쌍에서만" 벌점을 거는 아이디어가 이후 조건부 GAN의 정합성 손실 설계에 참고됨',
 '**diffusion 계열과의 대비** — 같은 시기 [DALL-E](#/p/dalle)·[GLIDE](#/p/glide)류의 diffusion 모델이 GAN을 밀어내면서, DF-GAN은 GAN 기반 text-to-image의 마지막 세대에 가까운 위치에 놓임',
 '**경량 모델의 가능성** — 19M 파라미터로 230M 모델급 정합성을 낸 결과는 이후 효율적 text-to-image 벤치마킹에서 자주 인용되는 baseline이 됨'
],

pitfalls:[
 '**MA-GP가 일반 WGAN-GP와 같은 것은 아니다.** 모든 실제 데이터에 벌점을 거는 게 아니라 **이미지-텍스트가 실제로 매칭되는 쌍**에서만 걸어야 정합성 효과가 난다. 틀린 텍스트와 짝지은 실제 이미지($\\mathbb{P}_{mis}$)는 별도 항으로 처리된다.',
 '**"보조 네트워크가 전혀 없다"는 DAMSM류의 고정된 사전학습망을 안 쓴다는 뜻이지, 텍스트 인코더 자체가 없다는 뜻은 아니다.** 텍스트 인코더(bi-[LSTM](#/p/lstm))는 AttnGAN이 제공한 사전학습 가중치를 그대로 재사용한다.',
 '**CUB에서는 TIME 같은 동시대 모델에 FID가 근소하게 뒤진다.** "모든 지표에서 SOTA"가 아니라 "훨씬 단순한 구조로 경쟁력 있는 성능"이 논문의 실제 주장이다.'
],

figures:[
 {f:'fig1-onestage-vs-stacked.png',
  cap:'(a) 기존 방식은 $G_0→G_1→G_2$ 가 저해상도부터 순서대로 이미지를 다듬고 각 단계마다 별도 판별기($D_0, D_1, D_2$)가 붙는다. (b) DF-GAN은 생성기 $G$ 하나가 Deep Text-Image Fusion Block으로 텍스트를 계속 주입받으며 한 번에 최종 이미지를 만들고 판별기도 하나다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-architecture.png',
  cap:'위쪽 G가 생성기: 노이즈 $z$를 FC로 편 뒤 UPBlock 7개를 통과하며 매 UPBlock에서 문장 벡터(sentence vector)를 다시 주입한다. 아래쪽 D가 판별기: DownBlock으로 이미지 특징을 뽑은 뒤 One-Way Output과 Matching-Aware Gradient Penalty로 정합성을 판정한다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'Existing text-to-image Generative Adversarial Networks generally employ a stacked architecture as the backbone yet still remain three flaws.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2008.05865 — DF-GAN', u:'https://arxiv.org/abs/2008.05865'},
 {t:'GitHub — tobran/DF-GAN', u:'https://github.com/tobran/DF-GAN'}
]
});
