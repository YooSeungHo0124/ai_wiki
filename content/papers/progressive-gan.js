WIKI.paper({
slug:'progressive-gan',
venue:'ICLR 2018',
authors:'Karras, Aila, Laine, Lehtinen (NVIDIA)',
arxiv:'1710.10196',

tldr:'GAN을 처음부터 고해상도로 학습시키지 않고 **4×4부터 시작해 층을 하나씩 덧붙여가며** 1024×1024까지 키우는 학습법. 이 절차만으로 당시 가장 크고 안정적인 얼굴 생성 결과를 냈고, CelebA-HQ 데이터셋과 등화 학습률 같은 부산물도 함께 남겼다.',

context:'2017년의 GAN은 고해상도로 갈수록 급격히 불안정해졌다. 해상도가 커지면 생성 이미지와 실제 이미지를 구별하기가 쉬워져 [WGAN-GP](#/p/wgan) 같은 개선된 손실을 써도 gradient 문제가 증폭되고, 메모리 제약 때문에 미니배치를 줄여야 해서 안정성이 한 번 더 나빠진다. 그 결과 대부분의 GAN 연구는 64×64~128×128 수준에 머물러 있었다. 이 논문의 질문은 "한 번에 어려운 문제(고해상도 매핑 전체)를 풀지 말고, 쉬운 문제부터 순서대로 풀면 어떨까"였다 — 저해상도에서 큰 구조를 먼저 배우고, 해상도를 올리며 세부만 추가로 배우게 하자는 것이다.',

ideas:[
 {h:'점진적 성장: 4×4에서 시작해 층을 덧붙인다',
  lead:'낮은 해상도로 학습을 시작하고 훈련이 진행될수록 G·D에 층을 추가해 해상도를 2배씩 키운다.',
  d:'generator와 discriminator를 서로 거울상으로 두고, 둘 다 4×4 해상도에서 학습을 시작한다. 어느 정도 수렴하면 8×8을 다루는 층을 새로 추가하고, 이 과정을 1024×1024까지 반복한다. 기존에 학습된 저해상도 층은 계속 학습 가능한 채로 남아 있다. 큰 구조(포즈·전체 색감)를 먼저 배우고 세부(모발·질감)를 나중에 배우게 되어, 전체를 한 번에 배우는 것보다 훨씬 안정적이다.'},
 {h:'Fade-in: 새 층을 충격 없이 끼워 넣는다',
  lead:'새로 추가한 고해상도 층을 residual처럼 가중치 α를 0에서 1로 선형 증가시키며 섞는다.',
  d:'새 층을 그냥 붙이면 이미 잘 학습된 저해상도 층에 갑작스러운 충격을 준다. 그래서 새 층의 출력과 기존 출력을 `toRGB`/`fromRGB` 뒤에서 `(1-α)×기존 + α×신규` 로 섞고, α를 학습이 진행되며 0→1로 선형 증가시킨다. discriminator에 넣는 실제 이미지도 같은 방식으로 두 해상도를 보간해서 대응시킨다.'},
 {h:'미니배치 표준편차로 다양성을 직접 주입',
  lead:'미니배치 전체의 특징 표준편차를 스칼라 하나로 요약해 discriminator에 추가 채널로 얹는다.',
  d:'GAN은 훈련 데이터의 다양성 일부만 포착하는 경향(mode collapse)이 있다. 기존 minibatch discrimination은 학습 가능한 파라미터가 필요했지만, 이 논문은 **파라미터 없이** 각 위치·채널의 표준편차를 미니배치 전체에 대해 계산하고 하나의 평균값으로 축약해 discriminator 끝부분에 상수 특징맵으로 붙인다. discriminator가 "이 배치는 실제 데이터만큼 다양한가"를 직접 볼 수 있게 되어 다양성이 늘어난다.'},
 {h:'등화 학습률: 초기화 대신 실행 시점에 스케일',
  lead:'가중치를 He 초기화값으로 정규화하지 않고 $\\mathcal{N}(0,1)$ 로 둔 뒤 매 forward마다 상수로 나눈다.',
  d:'세심한 초기화 대신 가중치를 단순한 $\\mathcal{N}(0,1)$ 로 두고, 실행할 때마다 층별 정규화 상수 $c$(He 초기화 기준)로 나눠 $\\hat{w}_i = w_i / c$ 를 쓴다. Adam·RMSProp 같은 옵티마이저는 그래디언트를 파라미터별 추정 표준편차로 정규화하므로, 파라미터의 동적 범위가 서로 다르면 일부는 너무 빨리, 일부는 너무 느리게 학습된다. 이 트릭은 모든 가중치의 학습 속도를 동일하게 맞춘다.'},
 {h:'픽셀별 정규화로 신호 폭주를 막는다',
  lead:'generator의 각 픽셀 특징 벡터를 채널 방향으로 단위 길이로 정규화해 batchnorm 없이 신호를 억제한다.',
  d:'G와 D의 경쟁이 과열되면 신호 크기가 통제 없이 커지는 현상이 흔하다. 기존에는 batch normalization으로 이를 막았지만, 이 논문은 covariate shift가 GAN의 실제 문제가 아니라 신호 크기 제어가 문제라고 보고, generator의 각 conv층 뒤에서 픽셀마다 채널 벡터를 그 자체 길이로 나눠 단위 길이로 만든다. 학습 파라미터가 전혀 없는 정규화다.'}
],

diagram:{type:'loop', cap:'4×4에서 시작해 해상도를 두 배씩 늘려가며 G·D에 층을 추가한다. 오른쪽 얼굴 6장이 최종 1024×1024 산출물.',
 center:'해상도 2배마다 반복',
 nodes:[
  {t:'4×4 학습', s:'G·D 최소 구조'},
  {t:'수렴 대기', s:'저해상도 안정화'},
  {t:'층 추가', s:'다음 해상도용', acc:true},
  {t:'fade-in', s:'α: 0→1 선형'},
  {t:'1024×1024', s:'CelebA-HQ'}
 ]},

math:[
 {expr:'ŵ_i = w_i / c   (c: He 초기화 기준 층별 정규화 상수)',
  tex:'\\hat{w}_i=\\frac{w_i}{c}',
  d:'등화 학습률. 가중치는 단순 $\\mathcal{N}(0,1)$ 로 초기화하고, forward 때마다 이 상수로 나눠 실질적인 동적 범위를 He 초기화와 같게 맞춘다.'},
 {expr:'toRGB_out = (1-α)·toRGB(x_{16}) + α·toRGB(x_{32})',
  tex:'\\text{out}=(1-\\alpha)\\cdot\\text{toRGB}(x_{16})+\\alpha\\cdot\\text{toRGB}(x_{32})',
  d:'fade-in 구간에서 저해상도 경로와 신규 고해상도 경로를 α로 선형 보간한다. α는 residual 연결의 가중치처럼 학습이 진행되며 0에서 1로 커진다.'}
],

numbers:[
 {k:'최종 해상도', v:'1024×1024', d:'CelebA-HQ 3만 장으로 학습, 8×Tesla V100으로 4일'},
 {k:'CIFAR10 inception score', v:'8.80', d:'비지도(라벨 없이) 학습 기준 당시 최고 기록'},
 {k:'학습 속도', v:'2~6배 단축', d:'최종 해상도에 따라 다르지만 대부분의 iteration이 저해상도에서 끝남'},
 {k:'Sliced Wasserstein distance', v:'2.02~5.13 ×10⁻³', d:'전체 개선(minibatch stddev + 등화 학습률 + 픽셀 정규화) 적용 시 baseline 대비 크게 감소'},
 {k:'CelebA-HQ 규모', v:'3만 장 × 1024²', d:'이 논문이 직접 구축해 공개한 고해상도 얼굴 데이터셋'}
],

impact:'저해상도부터 순서대로 학습시킨다는 절차 하나로 GAN이 다루던 최대 해상도를 한 세대 끌어올렸고, 이 방법론은 이후 [StyleGAN](#/p/stylegan)의 generator 백본으로 그대로 흡수되었다. 등화 학습률·픽셀별 정규화 같은 장치들도 StyleGAN 계열에 계승됐다. 또한 CelebA-HQ는 이후 몇 년간 얼굴 생성 GAN의 사실상 표준 벤치마크가 되었고, 미니배치 표준편차는 지금도 discriminator에 다양성 신호를 주는 표준 기법으로 쓰인다.',

legacy:[
 '**[StyleGAN](#/p/stylegan)** — progressive growing의 저해상도→고해상도 백본을 그대로 물려받고, 대신 latent를 스타일로 주입하는 방식을 새로 얹었다',
 '**CelebA-HQ** — 이 논문이 만든 데이터셋이 이후 여러 세대의 얼굴 GAN·diffusion 벤치마크로 재사용됨',
 '**안정화 장치의 표준화** — 등화 학습률·미니배치 표준편차·픽셀별 정규화가 이후 GAN 구현체들의 기본 구성 요소가 됨',
 '**progressive 학습의 재해석** — 이후 StyleGAN2는 층 추가 없이 residual/skip 구조만으로 같은 효과를 내며 fade-in 스케줄 자체는 폐기됨'
],

pitfalls:[
 '**"1024×1024를 처음 만든 논문"은 아니다.** 이 논문의 핵심 기여는 해상도 자체가 아니라 **그 해상도까지 안정적으로 도달하는 학습 절차**다.',
 '**progressive growing이 StyleGAN2에도 그대로 남아있다고 착각하기 쉽다.** StyleGAN2는 fade-in·층 추가 스케줄을 없애고 처음부터 전체 해상도로 학습하되 residual/skip 연결로 같은 효과를 낸다.',
 '**미니배치 표준편차와 batch normalization을 혼동하기 쉽다.** 전자는 discriminator에 다양성 신호를 주는 통계 삽입이고, 후자는 이 논문이 오히려 불필요하다고 보고 뺀 정규화다.'
],

figures:[
 {f:'fig1-growing.png',
  cap:'왼쪽부터 학습 진행 순서. G·D가 4×4에서 시작해(맨 왼쪽) 8×8을 거쳐 최종 1024×1024까지(맨 오른쪽) 층이 계속 추가된다. 오른쪽 얼굴 6장이 최종 해상도의 생성 결과.',
  src:'원문 Figure 1, p.3'},
 {f:'fig2-fadein.png',
  cap:'16×16(a)에서 32×32(c)로 넘어가는 전환 구간(b)의 구조. 신규 고해상도 층(회색 2x/0.5x 블록)의 출력이 α 가중치로 기존 경로와 섞이며, α가 0→1로 커지면 기존 경로 비중이 사라지고 신규 층만 남는다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'The key idea is to grow both the generator and discriminator progressively: starting from a low resolution, we add new layers that model increasingly fine details as training progresses.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1710.10196 — Progressive Growing of GANs', u:'https://arxiv.org/abs/1710.10196'},
 {t:'공식 코드 (NVIDIA)', u:'https://github.com/tkarras/progressive_growing_of_gans'}
]
});
