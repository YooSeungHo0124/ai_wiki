WIKI.paper({
slug:'srgan',
venue:'CVPR 2017',
authors:'Ledig et al. (Twitter)',
arxiv:'1609.04802',

tldr:'PSNR을 최대화하도록 학습하면 초해상 결과가 흐릿해진다는 것을 정면으로 보이고, [VGG](#/p/vgg) 특징 공간의 지각 손실 + 적대 손실로 4배 확대에서도 사실적인 질감을 만든 첫 GAN 기반 초해상 논문. 이 분야 전체를 관통하는 "지표 대 지각 품질" 긴장을 처음 명시적으로 다뤘다.',

context:'2016년의 초해상(SISR)은 SRCNN 이후 대부분 픽셀별 MSE를 최소화하도록 CNN을 학습시키는 방식이었다. MSE를 줄이면 PSNR이 올라가므로 벤치마크 표는 계속 좋아졌지만, 결과 이미지는 눈으로 보면 흐릿했다. 이유는 단순하다 — 한 저해상도 패치에 대응하는 고해상도 텍스처는 여러 그럴듯한 답이 있는데, MSE는 그 답들의 **평균**을 찾도록 강제해 고주파 디테일을 지워버린다. 4배 같은 큰 배율에서는 이 문제가 특히 심해서, "복원"이 아니라 사실상 그럴듯한 텍스처를 **새로 만들어내야** 하는 일이 된다. 이 논문은 이 지점에서 질문을 바꾼다 — PSNR을 더 올리는 대신, 사람이 봤을 때 진짜처럼 보이는 이미지를 만들 수는 없는가?',

ideas:[
 {h:'생성기: SRResNet, 16개 residual block',
  lead:'배치정규화·PReLU가 있는 residual block 16개와 sub-pixel conv로 4배 업샘플링한다.',
  d:'저해상도 이미지를 입력받아 [ResNet](#/p/resnet) 스타일 residual block 16개를 통과시킨 뒤, sub-pixel convolution(PixelShuffle) 두 단계로 해상도를 4배 키운다. 이 생성기를 MSE만으로 학습시킨 버전이 SRResNet이고, 논문은 이 자체만으로도 당시 PSNR/SSIM 기준 SOTA임을 먼저 보인다 — 즉 "우리 아키텍처가 나빠서 GAN을 쓴 게 아니다"를 먼저 증명한 것.'},
 {h:'지각 손실: 픽셀이 아니라 VGG 특징 공간에서 비교한다',
  lead:'생성 이미지와 정답 이미지의 차이를 픽셀이 아니라 VGG19 ReLU 특징 맵의 유클리드 거리로 잰다.',
  d:'`l_VGG`는 사전학습된 VGG19의 특정 ReLU 활성화 맵에서 생성 이미지와 정답 이미지의 유클리드 거리다. 픽셀 공간에서 "다른" 텍스처라도 VGG가 뽑아내는 고수준 특징(질감의 통계적 구조)이 비슷하면 손실이 작다. 이 때문에 픽셀 단위로는 정답과 다른 텍스처를 만들어도 지각적으로는 그럴듯한 결과가 나온다.'},
 {h:'적대 손실: 자연 이미지 매니폴드로 밀어낸다',
  lead:'판별기가 SR/HR을 구분하지 못하게 만드는 표준 GAN 손실을 지각 손실에 더한다.',
  d:'[GAN](#/p/gan)의 표준 min-max 목적함수를 그대로 가져와, 생성기가 판별기를 속이는 방향으로 학습시킨다. VGG 손실이 "질감의 통계가 비슷한가"를 보는 데 비해 적대 손실은 "이 이미지가 자연 이미지 분포에 속하는가"를 직접 판단하게 만들어, 결과를 자연 이미지 매니폴드 쪽으로 밀어낸다. 최종 지각 손실은 콘텐츠 손실과 $10^{-3}$ 배 가중한 적대 손실의 합이다.'},
 {h:'MOS 테스트로 지표와 사람 평가를 분리한다',
  lead:'26명의 평가자에게 1~5점을 매기게 해 PSNR/SSIM이 놓치는 것을 정량화한다.',
  d:'NN 보간을 1점, 원본 HR을 5점으로 고정 교정한 뒤 26명의 평가자가 Set5·Set14·BSD100 이미지의 12가지 버전을 평가하게 했다. 이렇게 하면 "PSNR은 낮은데 사람은 더 좋아하는" 경우를 표로 직접 보여줄 수 있다 — 이 분야에서 이후 표준이 되는 검증 방식이다.'},
 {h:'판별기: VGG 스타일 8층 CNN',
  lead:'strided conv로 해상도를 낮추며 채널을 64→512로 늘리는 표준 판별기를 쓴다.',
  d:'LeakyReLU(α=0.2)를 쓰고 max-pooling은 쓰지 않는 [DCGAN](#/p/dcgan) 가이드라인을 따른다. 3×3 conv 8개가 채널 수를 두 배씩 늘리며 해상도를 낮추고, 마지막에 dense layer 두 개와 sigmoid로 확률을 낸다. 이후 [ESRGAN](#/p/esrgan)이 이 판별기 구조 자체를 상대적 판별기로 바꾼다.'}
],

diagram:{type:'compare', cap:'같은 생성기를 어떤 손실로 학습시키느냐에 따라 결과가 정반대 방향으로 갈린다.',
 left:{t:'MSE 손실 (SRResNet)', items:['픽셀 오차 최소화','PSNR 최고','텍스처는 평균화·흐림']},
 right:{t:'지각+적대 손실 (SRGAN)', items:['VGG 특징 거리 + GAN','PSNR/SSIM은 오히려 하락','MOS(사람 평가)는 최고']}},

math:[
 {expr:'l_SR = l_X^SR (content loss) + 10^-3 · l_Gen^SR (adversarial loss)',
  tex:'l^{SR} = \\underbrace{l_{X}^{SR}}_{\\text{content loss}} + \\underbrace{10^{-3}\\,l_{Gen}^{SR}}_{\\text{adversarial loss}}',
  d:'전체 손실은 콘텐츠 손실과 적대 손실의 가중합이다. 적대 손실 가중치가 $10^{-3}$로 작은 이유는, 적대 손실이 너무 크면 판별기를 속이는 데만 최적화돼 콘텐츠와 무관한 이미지가 나오기 때문이다.'},
 {expr:'l_VGG/i,j = (1/W_ij H_ij) Σ (φ_ij(I^HR) − φ_ij(G(I^LR)))²',
  tex:'l^{SR}_{VGG/i,j}=\\frac{1}{W_{i,j}H_{i,j}}\\sum_{x=1}^{W_{i,j}}\\sum_{y=1}^{H_{i,j}}\\big(\\phi_{i,j}(I^{HR})_{x,y}-\\phi_{i,j}(G_{\\theta_G}(I^{LR}))_{x,y}\\big)^2',
  d:'$\\phi_{i,j}$는 VGG19의 $i$번째 max-pooling 이전, $j$번째 conv(활성화 후) 특징 맵이다. 픽셀이 아니라 이 특징 맵끼리의 거리를 재는 것이 지각 손실의 핵심이다.'}
],

numbers:[
 {k:'Set5 ×4 PSNR', v:'32.05dB(MSE) → 29.40dB(SRGAN-VGG54)', d:'GAN으로 갈수록 PSNR은 **오히려 떨어진다**'},
 {k:'Set5 ×4 MOS', v:'3.37(MSE) → 3.58(SRGAN-VGG54)', d:'같은 방향에서 사람 평가는 **올라간다** — 핵심 어긋남'},
 {k:'BSD100 ×4 SSIM', v:'0.8184(MSE) → 0.7397(SRGAN-VGG54)', d:'SSIM도 PSNR과 같은 방향으로 하락'},
 {k:'생성기 깊이', v:'B=16 residual block', d:'skip connection 유무는 추론 속도에 영향 없음(부록 실험)'},
 {k:'MOS 평가자', v:'26명', d:'NN 보간=1점, 원본 HR=5점으로 교정 후 1~5점 채점'},
 {k:'적대 손실 가중치', v:'10⁻³', d:'콘텐츠 손실 대비 적대 손실의 상대 크기'}
],

impact:'이 논문 이후 초해상 연구는 "PSNR 표에서 한 줄 더 올리기"에서 "사람이 보기에 그럴듯한 텍스처 만들기"로 목표 자체가 갈라졌다. **지표(PSNR/SSIM)를 최적화하는 모델과 지각 품질(GAN 계열)을 최적화하는 모델**은 이후 별도 계열로 발전하며, 같은 논문 안에서도 둘을 나눠 보고하는 관행이 생겼다. MOS 테스트로 사람 평가를 정량 비교하는 방식도 이후 표준이 됐다.',

legacy:[
 '**GAN 기반 초해상 계열의 시작점** — [ESRGAN](#/p/esrgan)이 아키텍처·판별기·손실 셋을 전부 개선하며 직계로 잇는다',
 '**"지각-왜곡 트레이드오프"의 실증적 첫 사례** — 이후 PIRM Challenge 등에서 이 트레이드오프 자체가 평가 축이 된다',
 '**VGG 지각 손실의 표준화** — [pix2pix](#/p/pix2pix), 스타일 전이 등 다른 이미지 생성 과제에도 VGG 특징 거리 손실이 퍼진다',
 '**MOS 기반 인간 평가 관행** — 이후 초해상·복원 논문 대부분이 정량 지표와 별도로 사람 평가를 병기한다'
],

pitfalls:[
 '**표의 PSNR/SSIM만 보고 "성능이 나쁘다"고 오해하기 쉽다.** SRGAN은 SRResNet(MSE)보다 PSNR이 낮은 게 논문의 **의도된 결과**다 — 지표가 아니라 MOS·질감을 봐야 한다.',
 '**GAN 계열 초해상은 없는 디테일을 "만들어낸다".** 글자나 패턴처럼 정확해야 하는 영역에서는 원본에 없던 구조가 생길 수 있어, 의료·문서 스캔 등에는 부적합하다.',
 '**원 논문의 4× 결과도 완벽하지 않다.** 저자들도 부록에서 일부 이미지에 여전히 아티팩트가 남음을 인정하며, 이 문제는 [ESRGAN](#/p/esrgan)의 RRDB·RaGAN 개선으로 이어진다.'
],

figures:[
 {f:'fig1-mos-comparison.png',
  cap:'같은 부분을 bicubic·SRResNet(MSE)·SRGAN·원본 순으로 확대. 괄호 안 PSNR/SSIM은 SRGAN이 가장 낮은데도 머리 장식·목걸이의 미세한 금속 질감은 SRGAN에서만 살아 있다.',
  src:'원문 Figure 2, p.2'},
 {f:'fig2-architecture.png',
  cap:'위: 생성기. k9n64s1처럼 kernel·채널수·stride를 표기했고, B개 residual block(파란 반복 블록) 뒤 PixelShuffler ×2가 두 번 있어 총 4배 업샘플링. 아래: 판별기. conv가 반복되며 채널이 64→512로 늘고 해상도는 줄어 마지막에 Dense(1024)→Dense(1)→sigmoid로 확률을 낸다.',
  src:'원문 Figure 4, p.4'}
],

quotes:[
 {t:'However, while achieving particularly high PSNR, these methods often lack high-frequency details and are perceptually unsatisfying in the sense that they fail to match the fidelity expected at the higher resolution.',
  src:'Introduction, p.1'},
 {t:'The MOS scores obtained with SRGAN are closer to those of the original high-resolution images than to those obtained with any state-of-the-art method.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1609.04802 — Photo-Realistic Single Image Super-Resolution Using a GAN', u:'https://arxiv.org/abs/1609.04802'},
 {t:'PIRM 2018 Perception-Distortion Challenge', u:'https://www.pirm2018.org/PIRM-SR.html'}
]
});
