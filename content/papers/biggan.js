WIKI.paper({
slug:'biggan',
venue:'ICLR 2019',
authors:'Brock, Donahue, Simonyan (DeepMind)',
arxiv:'1809.11096',

tldr:'GAN을 **그냥 크게** 키우면 (배치 8배, 파라미터 2~4배) ImageNet 클래스-조건부 생성 품질이 극적으로 좋아진다는 것을 보인 논문. 128×128에서 Inception Score를 기존 52.5에서 **166.5**로 끌어올렸고, 그 과정에서 나온 **truncation trick**과 대규모 학습 붕괴(collapse) 분석이 이후 대형 생성모델의 표준 도구가 되었다.',

context:'2018년까지 class-conditional ImageNet GAN의 최고 성능(Zhang et al., 2018 SAGAN)은 Inception Score 52.5에 머물러 있었다 — 실제 데이터의 IS(233)와는 큰 격차였다. GAN 학습은 최적화 하이퍼파라미터부터 아키텍처까지 거의 모든 요소에 민감해 안정화 기법 연구가 활발했지만, "그냥 더 크게 만들면 어떻게 되는가"라는 가장 단순한 질문은 체계적으로 답해지지 않은 상태였다. [DCGAN](#/p/dcgan)이 합성곱으로 GAN을 안정시켰고 [WGAN](#/p/wgan)이 손실 함수로 안정성을 개선했지만, 이들은 모두 상대적으로 작은 모델·배치에서 검증된 것이었다.',

ideas:[
 {h:'배치와 채널을 극단적으로 키운다',
  lead:'배치 크기를 기존 대비 8배로, 채널 폭을 50% 키워 IS를 크게 끌어올린다.',
  d:'배치를 키우자 즉각적인 성능 향상이 나타났지만 동시에 학습이 더 빨리 붕괴하는 부작용이 따라왔다. 채널 수(레이어당 유닛 수)를 50% 늘리는 것도 추가 이득을 줬다. 두 변경 모두 "왜 되는지"보다 "실제로 크게 개선된다"는 실증에 무게를 둔다 — 이 논문 전체의 태도가 그렇다.',
  },
 {h:'공유 임베딩과 skip-z로 조건 정보를 매 층에 공급',
  lead:'클래스 임베딩을 층마다 따로 두지 않고 공유하고, 잠재벡터 $z$ 조각을 여러 해상도에 직접 꽂는다.',
  d:'클래스별 conditional BatchNorm 임베딩을 층마다 독립적으로 두는 대신 하나의 공유 임베딩을 각 층에 선형 투영해서 씀으로써 연산·메모리를 줄이고 학습 속도를 37% 개선했다. 또 $z$ 를 처음 층에만 넣지 않고 여러 해상도 층에 나눠 꽂는 skip-z 연결로 성능 4%·속도 18%를 추가로 얻었다.'},
 {h:'Truncation trick: 잠재분포를 잘라 품질-다양성을 교환',
  lead:'샘플링 시 $z$ 를 절단된 정규분포에서 뽑아, 다양성을 희생하고 개별 샘플 품질을 높인다.',
  d:'학습은 $z \\sim \\mathcal{N}(0,I)$ 로 하지만, 생성 시에는 절대값이 임계값을 넘는 $z$ 성분을 다시 샘플링(절단)해서 0(분포의 최빈값) 쪽으로 밀어 넣는다. 임계값을 낮출수록 개별 샘플은 더 전형적이고 고품질이 되지만 전체 다양성은 줄어든다 — 학습 후에 사후적으로 조절 가능한 품질-다양성 트레이드오프 손잡이다. 다만 일부 모델은 이 절단된 입력에 대해 **saturation artifact**를 일으키는데, 이를 막기 위해 Orthogonal Regularization으로 생성기를 매끄럽게(smooth) 만든다.'},
 {h:'대규모 학습 붕괴(training collapse)를 정면으로 분석',
  lead:'G·D 각 층의 최대 특이값 $\\sigma_0$ 을 추적해 붕괴 직전 급격히 폭주하는 패턴을 찾는다.',
  d:'큰 배치·채널에서는 이전엔 안정적이던 설정도 학습 중 갑자기 붕괴한다. 저자들은 각 가중치 행렬의 최상위 특이값들을 학습 내내 기록했고, G의 일부 층에서 $\\sigma_0$ 이 서서히 커지다가 붕괴 시점에 폭발하는 패턴을 발견했다. D 쪽은 스펙트럼이 더 노이즈하지만 학습 데이터에 과적합하는 것으로 보이는 별도 징후가 나타난다. 완전한 안정성은 D를 강하게 제약해 얻을 수 있지만 그 대가로 성능이 크게 떨어져, 저자들은 결국 조기 종료(early stopping)를 실용적 타협으로 택한다.'}
],

diagram:{type:'flow', cap:'배치·채널을 키운 조건부 생성기의 forward 경로. skip-z가 여러 해상도에 z를 직접 공급한다.',
 nodes:[
  {t:'z + 클래스 임베딩', s:'공유 임베딩 투영'},
  {t:'조건부 BatchNorm', s:'층마다 gain·bias'},
  {t:'Self-Attention', s:'전역 의존성'},
  {t:'Residual 블록×N', s:'채널 1.5배 확장', acc:true, note:'배치 8배로 학습'},
  {t:'128~512px 이미지', s:'클래스 조건부'}
 ]},

math:[
 {expr:'R_β(W) = β‖WᵀW ⊙ (1 − I)‖²_F',
  tex:'R_{\\beta}(W)=\\beta\\left\\|W^{\\top}W\\odot(\\mathbf{1}-I)\\right\\|_F^2',
  d:'대각 성분을 제외한 orthogonal regularization. 필터 간 코사인 유사도만 억제하고 노름 자체는 제약하지 않아, 표준 직교 정규화보다 덜 제한적이면서도 truncation에 대한 안정성(16%→60%의 모델이 truncation에 견딤)을 크게 높였다.'}
],

numbers:[
 {k:'IS · 128px (기존 SOTA → BigGAN)', v:'52.5 → 166.5', d:'ImageNet class-conditional, 저자 표 기준'},
 {k:'FID · 128px', v:'18.65 → 7.4', d:'같은 설정, 낮을수록 좋음'},
 {k:'IS/FID · 256px', v:'232.5 / 8.1', d:'해상도를 올려도 품질 유지'},
 {k:'IS/FID · 512px', v:'241.5 / 11.5', d:'명시적 multi-scale 기법 없이 512px까지 확장'},
 {k:'배치 크기', v:'기존 대비 ×8', d:'가장 큰 단일 개선 요인'},
 {k:'모델 규모', v:'파라미터 ×2~4', d:'배치 확대와 함께 적용'}
],

impact:'"모델을 그냥 키우면 잘 된다"는 것을 GAN에서도 실증해, 이후 생성모델 전반의 스케일업 흐름에 힘을 실었다. Truncation trick은 사후 샘플링만으로 품질-다양성을 조절하는 표준 기법이 되어 StyleGAN 계열을 포함한 이후 GAN에도 채택되었고, 학습 붕괴를 스펙트럼 분석으로 진단한 접근은 대형 생성모델 학습 안정성 연구의 참고점이 되었다. 동시에 이 논문은 완전한 안정성과 최고 성능이 상충한다는 것을 명시적으로 보여, "안정성 대 성능"이라는 트레이드오프를 이후 연구의 공통 화두로 남겼다.',

legacy:[
 '**StyleGAN 계열과의 교차 수정** — [StyleGAN](#/p/stylegan)이 style 기반 생성과 BigGAN의 스케일업·truncation 아이디어를 함께 흡수하며 고해상도 GAN의 양대 축을 형성',
 '**대형 모델 학습 안정성 분석의 참조점** — spectral norm 추적으로 붕괴를 진단한 방식이 이후 대규모 생성모델 디버깅에 참고 프레임으로 남음',
 '**diffusion 모델과의 비교 대상** — [Diffusion Beats GANs](#/p/diffusion-beats-gan)이 BigGAN을 강력한 baseline으로 삼아 확산모델의 우위를 논증',
 '**truncation trick의 일반화** — 학습 분포와 다른 샘플링 분포를 쓰는 아이디어가 이후 다른 생성모델의 품질-다양성 조절 기법에도 영향'
],

pitfalls:[
 '**"BigGAN은 완전히 안정적으로 학습된다"는 오해다.** 논문 스스로 대규모 설정에서는 학습이 결국 붕괴하며 조기 종료가 필요하다고 명시한다. 완전한 안정성은 D를 강하게 제약해야 얻어지고, 그 경우 성능이 크게 희생된다.',
 '**truncation trick은 모든 모델에 공짜로 적용되지 않는다.** Orthogonal Regularization 없이는 다수 모델이 절단된 입력에서 saturation artifact를 일으킨다 — 저자들 보고로도 정규화 없이는 16%만 truncation에 잘 견딘다.',
 '**IS·FID 수치는 truncation 임계값에 따라 달라지는 곡선이다.** 논문의 "IS 166.5" 같은 숫자는 단일 지점이 아니라 품질-다양성 곡선 위 한 점을 인용한 것이므로, 다른 truncation 설정과 단순 비교하면 오독하기 쉽다.'
],

figures:[
 {f:'fig2-truncation.png',
  cap:'(a) 왼쪽에서 오른쪽으로 truncation 임계값을 2→1→0.5→0.04로 낮출수록 강아지 이미지가 점점 더 전형적이고 획일적인 포즈로 수렴한다. (b) 임계값을 너무 낮추면 정규화가 부족한 모델은 색이 번지는 saturation artifact를 낸다.',
  src:'원문 Figure 2, p.4'},
 {f:'fig3-collapse.png',
  cap:'x축은 학습 iteration, y축은 각 층 가중치의 최대 특이값 $\\sigma_0$. (a) 생성기 G는 대부분 층이 평평하게 유지되지만 일부 층(빨강)이 서서히 커지다 붕괴(Collapse) 지점에서 폭발한다. (b) 판별기 D는 노이즈가 많지만 전반적으로 덜 폭주한다.',
  src:'원문 Figure 3, p.5'}
],

quotes:[
 {t:'We find that current GAN techniques are sufficient to enable scaling to large models and distributed, large-batch training. ... Despite these improvements, our models undergo training collapse, necessitating early stopping in practice.',
  src:'Section 3.2, p.5'}
],

links:[
 {t:'arXiv 1809.11096 — Large Scale GAN Training for High Fidelity Natural Image Synthesis', u:'https://arxiv.org/abs/1809.11096'},
 {t:'BigGAN 공식 코드/체크포인트 (DeepMind)', u:'https://github.com/ajbrock/BigGAN-PyTorch'}
]
});
