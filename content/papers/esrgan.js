WIKI.paper({
slug:'esrgan',
venue:'ECCV 2018 Workshops (PIRM2018-SR 1위)',
authors:'Wang et al. (CUHK · SenseTime · NTU · CUHK(SZ))',
arxiv:'1809.00219',

tldr:'[SRGAN](#/p/srgan)의 생성기·판별기·손실 셋 전부를 절제 실험으로 하나씩 뜯어고친 논문. 배치정규화를 없앤 RRDB 블록, 절대값 대신 상대 진위를 예측하는 상대적 판별기(RaGAN), 활성화 이전 VGG 특징으로 계산하는 지각 손실 — 이 세 변경이 각각 왜 필요했는지를 보여준다.',

context:'[SRGAN](#/p/srgan)은 "PSNR을 버리고 지각 품질을 최적화한다"는 방향은 옳았지만 결과에 눈에 띄는 흠이 있었다. 생성기의 배치정규화(BN)는 학습·테스트 데이터의 통계가 다를 때 얼룩(artifact)을 만들었고, 표준 GAN 판별기는 "이 이미지가 진짜냐"만 절대적으로 판단해 상대적으로 어느 쪽이 더 사실적인지에 대한 정보를 버렸다. VGG 지각 손실도 ReLU **활성화 이후** 특징을 썼는데, 이 특징은 대부분 0이라 희소해서(sparse) 유용한 그래디언트가 적었다. ESRGAN은 이 세 지점을 각각 겨냥한다.',

ideas:[
 {h:'RRDB: 배치정규화를 빼고 dense connection을 residual-in-residual로 쌓는다',
  lead:'BN을 제거하고 Dense Block 3개를 residual-in-residual 구조로 겹쳐 표현력을 키운다.',
  d:'SRGAN의 residual block은 conv-BN-ReLU-conv-BN이었다. ESRGAN은 먼저 BN을 통째로 제거해(BN이 배치 통계에 의존해 학습·추론 간 불일치로 인한 아티팩트를 만든다는 관찰 때문) 안정성과 일반화를 높인다. 그 자리에 [DenseNet](#/p/densenet) 스타일 Dense Block 3개를 residual 경로 안에 또 residual로 감싼 RRDB(Residual-in-Residual Dense Block)를 넣어, 더 깊고 복잡한 구조로도 안정적으로 학습되게 한다.'},
 {h:'상대적 판별기(RaGAN): "진짜냐"가 아니라 "더 진짜 같냐"를 예측한다',
  lead:'실제 이미지가 가짜 이미지보다 상대적으로 더 진짜 같을 확률을 판별기가 예측하게 한다.',
  d:'표준 판별기 $D(x)=\\sigma(C(x))$는 절대적 진위만 본다. Relativistic average GAN은 $D_{Ra}(x_r,x_f)=\\sigma(C(x_r)-\\mathbb{E}[C(x_f)])$처럼 **평균적인 가짜 데이터에 비해 이 진짜 데이터가 얼마나 더 사실적인가**를 예측하게 한다. 생성기는 이제 가짜뿐 아니라 진짜의 판별 결과에도 그래디언트를 받아, 더 선명한 경계와 디테일을 만드는 방향으로 학습된다.'},
 {h:'활성화 이전 VGG 특징으로 지각 손실을 계산한다',
  lead:'ReLU 통과 후가 아니라 통과 직전의 조밀한 특징 맵으로 지각 손실을 잰다.',
  d:'SRGAN은 ReLU 활성화 **이후**의 특징 맵으로 VGG 손실을 계산했는데, 이 맵은 깊은 층일수록 대부분 0인 희소 신호라 유용한 정보가 적고, 재구성한 이미지의 밝기가 실제와 달라지는 문제도 생긴다. ESRGAN은 활성화 **이전** 특징을 쓴다. 이렇게 하면 (1) 특징이 더 조밀해 감독 신호가 강해지고 (2) 밝기 일관성과 텍스처 복원이 모두 개선된다.'},
 {h:'네트워크 보간: 두 모델의 가중치를 섞어 PSNR과 지각 품질을 연속적으로 조절한다',
  lead:'PSNR 지향 모델과 GAN 지향 모델의 파라미터를 선형 보간해 원하는 절충점을 고른다.',
  d:'먼저 L1 손실만으로 PSNR 지향 생성기 $G_{PSNR}$을 학습시키고, 이를 초기화로 GAN 손실까지 더해 $G_{GAN}$을 학습시킨다. 두 모델의 가중치를 $\\theta_G^{INTERP}=(1-\\alpha)\\theta_G^{PSNR}+\\alpha\\theta_G^{GAN}$로 선형 보간하면, 재학습 없이 $\\alpha$ 하나로 노이즈가 적은 매끄러운 결과와 텍스처가 풍부한 결과 사이를 오갈 수 있다.'}
],

diagram:{type:'compare', cap:'SRGAN의 residual block과 ESRGAN의 RRDB — 셋 다 구조상의 병목을 하나씩 겨냥한다.',
 left:{t:'SRGAN', items:['conv-BN-ReLU-conv-BN','표준 판별기(절대 진위)','ReLU 이후 VGG 특징']},
 right:{t:'ESRGAN', items:['RRDB, BN 없음','상대적 판별기(RaGAN)','ReLU 이전 VGG 특징']}},

math:[
 {expr:'D_Ra(x_r, x_f) = σ(C(x_r) − E[C(x_f)])',
  tex:'D_{Ra}(x_r,x_f)=\\sigma\\big(C(x_r)-\\mathbb{E}_{x_f}[C(x_f)]\\big)',
  d:'실제 이미지 $x_r$이 평균적인 가짜 이미지 $x_f$보다 상대적으로 더 사실적일 확률. 표준 판별기의 절대 확률 $\\sigma(C(x))$ 대신 상대 비교를 쓴다.'},
 {expr:'θ_G^INTERP = (1 − α) θ_G^PSNR + α θ_G^GAN',
  tex:'\\theta_G^{INTERP} = (1-\\alpha)\\,\\theta_G^{PSNR} + \\alpha\\,\\theta_G^{GAN}',
  d:'두 학습된 생성기의 가중치를 직접 선형 보간한다. $\\alpha \\in [0,1]$ 하나로 재학습 없이 PSNR-지각 품질 트레이드오프를 조절한다.'}
],

numbers:[
 {k:'PIRM2018-SR', v:'Region 3 1위', d:'perceptual index = ((10−Ma)+NIQE)/2 최저(우수)'},
 {k:'Set5 PSNR/PI', v:'32.93dB / 6.89(PSNR-지향) vs 30.47dB / 3.63 부근(GAN-지향)', d:'PSNR-지향은 PI(perceptual index)가 나쁘고 그 반대도 성립'},
 {k:'학습률 스케줄', v:'1e-4, [50k,100k,200k,300k]에서 절반', d:'PSNR-지향(1단계) 학습 설정'},
 {k:'적대 손실 비교', v:'표준 GAN → RaGAN', d:'RaGAN 도입이 경계 선명도·수렴 안정성 모두 개선(절제실험)'},
 {k:'입력 데이터셋', v:'DIV2K + Flickr2K', d:'PSNR-지향 대비 데이터셋을 키워 성능 추가 개선 확인'}
],

impact:'ESRGAN은 GAN 기반 초해상의 사실상 표준 베이스라인이 됐다. RRDB·RaGAN·활성화 이전 지각 손실이라는 세 개선이 이후 대부분의 GAN 기반 복원 모델(특히 [Real-ESRGAN](#/p/real-esrgan))에 그대로 상속됐고, 논문이 공개한 사전학습 가중치는 GitHub에서 가장 널리 쓰이는 초해상 모델 중 하나로 남았다. 절제 실험으로 "왜 이 부품이 필요한가"를 하나씩 증명하는 방식론 자체도 이후 복원 논문들의 표준 보고 형식이 됐다.',

legacy:[
 '**[Real-ESRGAN](#/p/real-esrgan)의 생성기 백본** — RRDB 구조를 그대로 물려받고 학습 데이터 쪽을 실사 대응으로 바꾼다',
 '**RaGAN의 확산** — 상대적 판별기 아이디어가 이후 다른 이미지 생성·복원 GAN에도 채택된다',
 '**GitHub 실사용 1순위 초해상 모델** — 사전학습 가중치가 애니메이션·게임 텍스처·사진 업스케일링 도구에 폭넓게 재사용된다',
 '**perceptual index 기반 대회 문화** — PIRM Challenge 이후 지각-왜곡 트레이드오프를 공식 평가 축으로 쓰는 관행이 자리잡는다'
],

pitfalls:[
 '**"ESRGAN이 항상 SRGAN보다 PSNR이 높다"는 오해.** GAN-지향 버전은 PSNR·SSIM이 오히려 SRGAN과 비슷하거나 낮을 수 있다 — 개선 대상은 지표가 아니라 지각 품질(perceptual index)이었다.',
 '**BN 제거는 만능이 아니다.** 저자들은 BN 제거가 안정성을 높인다고 관찰했지만, 이는 학습·테스트 데이터 분포가 다를 때의 문제이며 다른 세팅에서까지 일반화되는 보장은 없다.',
 '**네트워크 보간(interpolation)은 임의의 두 모델 사이에서 항상 안전하지 않다.** 같은 초기화에서 파생된 $G_{PSNR}$과 $G_{GAN}$처럼 가중치 공간이 가까운 경우에만 의미 있게 작동한다.'
],

figures:[
 {f:'fig1-rrdb-block.png',
  cap:'왼쪽: SRGAN의 residual block(위)에서 BN 두 개를 제거한 것(아래). 오른쪽: RRDB — Dense Block 세 개를 순서대로 이어 붙이고, 그 전체를 다시 residual 경로로 감싼 residual-in-residual 구조. 확대된 원 안이 Dense Block 내부의 조밀한 skip connection.',
  src:'원문 Fig. 4, p.5'},
 {f:'fig2-relativistic-gan.png',
  cap:'a) 표준 GAN: 진짜 $x_r$을 1로, 가짜 $x_f$를 0으로 수렴시킬 뿐 서로를 비교하지 않는다. b) Relativistic GAN: $D_{Ra}$가 "진짜가 가짜보다 얼마나 더 진짜 같은가"를 직접 계산해, 두 확률이 상대적으로 밀고 당기며 수렴한다.',
  src:'원문 Fig. 5, p.6'}
],

quotes:[
 {t:'However, the hallucinated details are often accompanied with unpleasant artifacts. To further enhance the visual quality, we thoroughly study three key components of SRGAN.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1809.00219 — ESRGAN', u:'https://arxiv.org/abs/1809.00219'},
 {t:'GitHub — xinntao/ESRGAN', u:'https://github.com/xinntao/ESRGAN'}
]
});
