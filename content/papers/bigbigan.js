WIKI.paper({
slug:'bigbigan',
venue:'NeurIPS 2019',
authors:'Donahue, Simonyan (DeepMind)',
arxiv:'1907.02544',

tldr:'[BigGAN](#/p/biggan)의 generator에 **인코더**를 붙이고 discriminator를 3-way(데이터·잠재·결합)로 확장해, 생성 품질이 좋아지면 표현 학습 품질도 같이 좋아진다는 것을 보인 논문. ImageNet 비지도 표현 학습에서 당시 최고 수준의 선형 분류 정확도를 달성했다.',

context:'2019년 시점에 GAN 기반 표현 학습(BiGAN·ALI)은 이미 한 차례 시도된 뒤 **대조학습(self-supervision) 계열에 자리를 내준 상태**였다. 2016~2017년의 원조 BiGAN/ALI는 인코더를 붙여 생성자의 역함수를 학습시키는 아이디어 자체는 맞았지만, 당시 generator가 [DCGAN](#/p/dcgan) 수준이라 ImageNet처럼 복잡한 이미지를 제대로 생성하지 못했고, 그래서 인코더가 배울 수 있는 의미 표현도 얕았다. 이 논문의 질문은 단순하다 — **generator 자체를 [BigGAN](#/p/biggan) 수준으로 바꾸면 그 인코더의 표현도 따라서 좋아지는가?**',

ideas:[
 {h:'BigGAN generator에 인코더 E를 추가한다',
  lead:'생성자 G는 그대로 BigGAN을 쓰고, 이미지를 잠재벡터로 되돌리는 인코더 E를 새로 학습시킨다.',
  d:'구조 자체는 [BiGAN](#/p/biggan)/ALI와 같다 — generator $G: z \\to x$ 에 대응하는 인코더 $E: x \\to z$ 를 함께 학습시켜, discriminator가 $(x, E(x))$ 와 $(G(z), z)$ 쌍을 구별 못 하게 만든다. 차이는 이 generator가 DCGAN이 아니라 [BigGAN](#/p/biggan)이라는 것뿐이다. 최적 판별자 극한에서 이 과정은 $\\ell_0$ 재구성 오차를 최소화하는 오토인코더처럼 동작한다는 것이 원 BiGAN 논문에서 이미 증명됐다.'},
 {h:'joint discriminator: 데이터·잠재·결합 세 항으로 분리',
  lead:'discriminator를 F(데이터만)·H(잠재만)·J(결합)로 나눠 각 항을 따로 clamp하는 hinge loss를 쓴다.',
  d:'discriminator를 $x$ 만 보는 서브모듈 $F$, $z$ 만 보는 $H$, 둘을 합친 $J$ 로 나누고, 각각의 unary/joint score를 **개별적으로** hinge loss로 clamp한다. 세 항의 합을 한 번에 hinge하는 단순한 버전보다 이 방식이 안정성 면에서 확연히 나았다고 원문이 보고한다. $F$ 는 ConvNet(이미지용), $H$ 는 MLP(잠재벡터용)로 구성된다.'},
 {h:'생성 품질과 표현 품질이 같이 좋아진다',
  lead:'표현 학습 목적함수를 추가해도 생성 품질(FID)이 떨어지지 않고 오히려 순수 BigGAN보다 좋아진다.',
  d:'표현 학습을 위해 인코더를 추가하는 것이 생성 품질을 희생시키는 트레이드오프라고 예상하기 쉽지만, 실험 결과는 반대였다 — 무조건(unconditional) ImageNet 생성에서 BigBiGAN이 순수 BigGAN(의사 라벨링 버전)보다 더 낮은(좋은) FID를 기록했다. 인코더가 요구하는 "가역성"이 generator로 하여금 더 풍부하고 사실적인 구조를 만들도록 정규화 효과를 준다는 해석이다.'}
],

diagram:{type:'flow', cap:'인코더 E와 생성자 G가 만든 (x,ẑ)/(x̂,z) 쌍을 joint discriminator가 F·H·J 세 갈래로 나눠 비교한다.',
 nodes:[
  {t:'실제 이미지 x', s:'P_x'},
  {t:'인코더 E', s:'x → ẑ', acc:true},
  {t:'잠재 z', s:'P_z'},
  {t:'생성자 G', s:'z → x̂'},
  {t:'joint D', s:'F·H·J 결합'}
 ]},

math:[
 {expr:'L_EG(P_x,P_z) = E_{x,ẑ~E(x)}[ℓ(x,ẑ,+1)] + E_{z,x̂~G(z)}[ℓ(x̂,z,−1)]',
  tex:'L_{EG}(P_{\\mathbf{x}},P_{\\mathbf{z}})=\\mathbb{E}_{\\mathbf{x}\\sim P_{\\mathbf{x}},\\,\\hat{\\mathbf{z}}\\sim E(\\mathbf{x})}[\\ell_{EG}(\\mathbf{x},\\hat{\\mathbf{z}},+1)]+\\mathbb{E}_{\\mathbf{z}\\sim P_{\\mathbf{z}},\\,\\hat{\\mathbf{x}}\\sim G(\\mathbf{z})}[\\ell_{EG}(\\hat{\\mathbf{x}},\\mathbf{z},-1)]',
  d:'인코더·생성자를 함께 학습시키는 목적함수. 인코더가 만든 (실제 이미지, 그 잠재추정) 쌍은 +1로, 생성자가 만든 (가짜 이미지, 진짜 잠재) 쌍은 -1로 판별자를 속이도록 학습한다.'},
 {expr:'ℓ_D(x,z,y) = h(y·s_x(x)) + h(y·s_z(z)) + h(y·s_xz(x,z)),  h(t)=max(0, 1−t)',
  tex:'\\ell_D(\\mathbf{x},\\mathbf{z},y)=h(y\\,s_{\\mathbf{x}}(\\mathbf{x}))+h(y\\,s_{\\mathbf{z}}(\\mathbf{z}))+h(y\\,s_{\\mathbf{xz}}(\\mathbf{x},\\mathbf{z}))',
  d:'세 개의 hinge 항을 각각 따로 clamp하는 discriminator 손실. 세 항의 합을 한 번에 hinge하는 대안보다 이 분리된 형태가 훨씬 안정적이었다.'}
],

numbers:[
 {k:'ImageNet 선형분류 top-1', v:'61.3%', d:'RevNet-50×4 + BN+CReLU 특징, 당시 비지도 표현학습 SOTA권'},
 {k:'CPC 대비', v:'48.7% (CPC) → 60.8%', d:'같은 RevNet-50×4·AvePool 특징 기준, [CPC](#/p/cpc)보다 12%p 이상 높음'},
 {k:'Rotation 예측 대비', v:'55.4% (Rotation) → 60.8%', d:'같은 아키텍처·특징에서 회전예측 사전학습 대비 개선'},
 {k:'무조건 생성 FID', v:'22.34 (500K 스텝)', d:'BigGAN+Clustering 베이스라인(23.2)보다 개선, 1M 스텝에서 20.32까지 추가 개선'},
 {k:'최근접 이웃 분류(k=25)', v:'약 43%', d:'학습된 표현 공간에서 라벨 학습 없이 순수 k-NN만으로 얻은 top-1 정확도'}
],

impact:'생성 모델의 픽셀 품질과 표현 학습 품질이 별개가 아니라 **같이 간다**는 것을 실증적으로 보여준 논문이다. 다만 같은 해 말 공개된 [MoCo](#/p/moco)를 비롯한 대조학습 계열이 곧이어 훨씬 적은 연산으로 이 수준을 넘어서면서, "생성으로 표현을 배운다"는 접근 자체는 주류에서 밀려났다 — BigBiGAN은 GAN 기반 표현학습이 도달할 수 있는 상한을 보여준 마지막 대형 시도에 가깝다.',

legacy:[
 '**대조학습으로 무게중심 이동** — 같은 시기 [MoCo](#/p/moco)·[CPC](#/p/cpc) 계열이 훨씬 적은 연산으로 유사하거나 더 나은 표현을 학습하면서, 이후 self-supervised 연구의 주류는 생성이 아닌 대조학습 쪽으로 굳어짐',
 '**"생성 품질 = 표현 품질" 가설의 근거** — 이후 diffusion 기반 표현학습(예: DiffAE 계열) 논의에서 이 논문의 관찰이 재인용됨',
 '**BiGAN/ALI 계열의 사실상 마지막 대규모 시도** — 이후 GAN 인코더 결합 구조를 표현학습 목적으로 스케일업한 후속 연구는 드물다'
],

pitfalls:[
 '**BiGAN을 이 논문이 처음 제안했다고 착각하기 쉽다.** BiGAN/ALI는 2016~2017년에 이미 나온 아이디어이고, 이 논문의 기여는 그 위에 [BigGAN](#/p/biggan) generator를 얹은 스케일업과 joint discriminator 안정화다.',
 '**인코더가 결정적(deterministic)이라고 가정하면 틀린다.** Base 모델의 인코더는 확률적(stochastic, $z=\\mu+\\sigma\\epsilon$)이며, 원문은 결정적 인코더보다 분류 성능이 확실히 낫다고 명시한다.',
 '**"SOTA"라는 서술은 2019년 중반 기준이다.** 같은 해 말 MoCo가 나오며 순위가 곧 뒤집혔다 — 비교할 때 시점을 반드시 명시해야 한다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽: 인코더 E(x→ẑ)와 생성자 G(z→x̂)가 서로 역함수 관계를 이루도록 학습된다. 오른쪽: joint discriminator D 내부 — F는 이미지만, H는 잠재벡터만, J는 이미지·잠재 결합을 보고 각각 점수를 내며 이 셋을 더해 최종 loss를 만든다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'In this work we show that progress in image generation quality translates to substantially improved representation learning performance.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1907.02544 — Large Scale Adversarial Representation Learning', u:'https://arxiv.org/abs/1907.02544'},
 {t:'TensorFlow Hub 사전학습 모델', u:'https://tfhub.dev/s?publisher=deepmind&q=bigbigan'}
]
});
