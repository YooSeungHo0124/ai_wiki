WIKI.paper({
slug:'deepinversion',
venue:'CVPR 2020',
authors:'Yin, Molchanov, Li, Alvarez, Mallya, Hoiem, Jha & Kautz (NVIDIA · Princeton · UIUC)',
arxiv:'1912.08795',

tldr:'생성기를 따로 학습시키지 않고, 노이즈 이미지 자체를 최적화해 교사 네트워크가 "기억하는" 이미지를 복원한다. 핵심은 [BatchNorm](#/p/batchnorm) 레이어에 저장된 평균·분산이 원본 학습 데이터의 통계를 그대로 담고 있다는 관찰이다. ImageNet 사전학습 ResNet-50 하나만으로 사실적인 클래스별 이미지를 만들어내고, 이를 데이터-프리 증류·가지치기·연속학습에 재사용한다.',

context:'[DAFL](#/p/dafl) 같은 데이터-프리 증류 연구들은 별도 생성기를 GAN처럼 학습시켜 교사를 속이는 이미지를 만들지만, 결과 이미지는 사람이 보기에 부자연스러운 "속임수 이미지"에 가까웠다. 더 오래된 DeepDream 계열 방법은 노이즈를 직접 최적화해 특정 클래스의 출력을 높이지만, 중간 표현에 아무 제약이 없어 이미지가 비현실적이고 지식 전달에도 쓸모가 적었다. 이 논문은 "네트워크가 원본 데이터에 대해 실제로 무엇을 기억하고 있는가"라는 질문을 던지고, 그 답이 이미 널리 쓰이는 [BatchNorm](#/p/batchnorm) 레이어 안에 있다고 본다.',

ideas:[
 {h:'BatchNorm의 running mean/var가 곧 데이터 분포의 지문이다',
  lead:'학습 중 쌓인 채널별 평균·분산이 원본 데이터의 특징 분포를 근사한다.',
  d:'BatchNorm은 학습 동안 각 층 활성값의 채널별 평균 $\\mu_l$ 과 분산 $\\sigma_l^2$ 을 이동평균으로 저장해 둔다. 저자들은 이 저장된 값이 곧 원본 학습 데이터에 대한 $\\mathbb{E}[\\mu_l(x)|X]$, $\\mathbb{E}[\\sigma_l^2(x)|X]$ 의 추정치와 같다는 점에 주목한다. 즉 **원본 데이터셋 없이도, 이미 배포된 모델의 BatchNorm 파라미터만으로 그 데이터의 통계적 지문을 읽을 수 있다.**'},
 {h:'DeepInversion: 그 지문에 맞도록 입력을 역전파로 복원한다',
  lead:'이미지 대신 픽셀 자체를 업데이트해, 생성된 입력의 활성 통계가 BN 저장값과 일치하게 만든다.',
  d:'무작위 노이즈에서 출발해 교사 네트워크의 교차엔트로피 손실(목표 클래스로 분류되도록)과 $R_{feature}=\\sum_l \\|\\mu_l(\\hat x)-BN_l(\\text{running mean})\\|_2 + \\|\\sigma_l^2(\\hat x)-BN_l(\\text{running var})\\|_2$ 라는 정규화 항을 함께 역전파해 **입력 이미지 자체를 업데이트**한다. DeepDream류의 단순한 사전 정규화($R_{prior}$, 전체 변동·L2)만 썼을 때보다 이 feature 정규화가 40~69%p의 정확도 개선을 가져왔다.'},
 {h:'Adaptive DeepInversion: 학생과의 의견 불일치로 다양성을 확보한다',
  lead:'이미 생성된 이미지들과 겹치지 않도록, 학생이 헷갈리는 "더 어려운" 이미지를 유도한다.',
  d:'단순 DeepInversion은 같은 클래스에 대해 비슷한 이미지를 반복 생성하기 쉽다. Adaptive DeepInversion(ADI)은 학습 중인 학생 네트워크의 출력과 교사 출력 사이의 Jensen-Shannon divergence를 추가로 최대화해, 교사에게는 여전히 맞지만 **학생에게는 아직 어려운** 새로운 이미지를 유도한다. 이는 GAN의 경쟁(min-max)과 비슷한 효과를 데이터 없이 재현한다.'},
 {h:'세 가지 응용: 가지치기·증류·연속학습',
  lead:'원본 데이터 접근 없이도 기존 데이터-기반 파이프라인을 그대로 재현할 수 있음을 보인다.',
  d:'생성된 이미지만으로 (1) Taylor 근사 기반 필터 가지치기, (2) 무작위 초기화 학생으로의 지식 전달, (3) 새 클래스를 추가하는 연속학습(catastrophic forgetting 완화)을 수행한다. 세 응용 모두에서 실제 데이터를 쓰는 oracle에 근접하거나, 기존 데이터-프리 대안(DAFL·DeepDream)을 능가한다.'}
],

diagram:{type:'flow', cap:'왼쪽부터 오른쪽으로: 노이즈를 이미지로 최적화 → 합성 이미지 배치 → 이 이미지로 학생을 증류. 가운데 상자가 이 논문의 핵심 산출물이다.',
 nodes:[
  {t:'노이즈 입력', s:'역전파로 갱신'},
  {t:'교사 (고정)', s:'BN 통계 보유', acc:true},
  {t:'합성 이미지', s:'클래스 조건부'},
  {t:'학생 네트워크', s:'KL 발산으로 증류'}
 ]},

math:[
 {expr:'R_feature(x̂) = Σ_l || μ_l(x̂) - BN_l(mean) ||_2 + || σ_l²(x̂) - BN_l(var) ||_2',
  tex:'R_{feature}(\\hat x)=\\sum_{l}\\lVert\\mu_l(\\hat x)-\\mathrm{BN}_l(\\text{mean})\\rVert_2+\\lVert\\sigma_l^2(\\hat x)-\\mathrm{BN}_l(\\text{var})\\rVert_2',
  d:'각 층 $l$ 에서 생성 이미지의 배치 통계와 BatchNorm에 저장된 통계 사이의 차이를 벌점화한다. 이 항이 없으면(DeepDream) 이미지가 비현실적인 텍스처로 수렴한다.'},
 {expr:'R_DI(x̂) = R_prior(x̂) + α_f · R_feature(x̂)',
  tex:'R_{DI}(\\hat x)=R_{prior}(\\hat x)+\\alpha_f R_{feature}(\\hat x)',
  d:'전체 정규화 항. $R_{prior}$ 는 전체 변동(total variation)과 L2 항으로 이미지가 매끈하고 과도하게 크지 않도록 만드는 기존 DeepDream류 항이다.'}
],

numbers:[
 {k:'CIFAR-10 (ResNet-18 학생, 최강 교사)', v:'91.43%', d:'DeepInversion($R_{feature}$)만으로, teacher acc 95.42%; ADI 추가 시 93.26%'},
 {k:'DAFL과 비교 (같은 설정)', v:'92.22% (DAFL) vs 93.26% (ADI)', d:'같은 CIFAR-10 ResNet-18 학생 조건에서 ADI가 근소하게 앞섬'},
 {k:'ImageNet 지식전달, 90 epoch', v:'68.0%', d:'DeepInversion 합성 이미지 140k장, 베이스 모델(실제 데이터) 77.26% 대비'},
 {k:'ImageNet 지식전달, 250 epoch + mixup', v:'73.8%', d:'같은 DeepInversion 이미지, 학습을 늘리고 mixup을 추가하면 격차가 크게 좁혀짐'},
 {k:'ImageNet 가지치기 (50% 필터 제거)', v:'55.9% → 60.7%', d:'DeepInversion(DI) 단독 대비 Adaptive DeepInversion(ADI)의 개선폭'}
],

impact:'"모델을 배포하면 원본 데이터가 안전하다"는 가정에 의문을 던졌다 — [BatchNorm](#/p/batchnorm) 통계만으로도 훈련 데이터의 클래스별 이미지 분포를 상당히 복원할 수 있다는 것이 실증됐다. 데이터-프리 압축·양자화 연구가 이 방법을 표준 구성요소로 채택했고, 모델 배포 시 통계치 노출 자체가 프라이버시 표면이 될 수 있다는 인식을 넓혔다.',

legacy:[
 '[DAFL](#/p/dafl)의 생성기 기반 접근을 입력 직접 최적화 방식으로 대체하며 생성 이미지의 시각적 사실성을 크게 개선',
 '데이터-프리 양자화(ZeroQ 등)가 이 논문의 BN 통계 정합 아이디어를 그대로 차용',
 '모델 인버전(model inversion) 공격 연구 계열에서 "정상적으로 배포된 분류기가 얼마나 많은 정보를 새어 보낼 수 있는가"를 보여준 사례로 재인용'
],

pitfalls:[
 '**BatchNorm이 없는 아키텍처에는 이 방법이 곧바로 적용되지 않는다.** feature 정규화 항이 BN의 저장 통계에 의존하므로, LayerNorm이나 GroupNorm만 쓰는 모델은 같은 신호를 얻지 못한다.',
 '**"데이터가 전혀 새지 않는다"는 생각은 틀렸다.** 원본 이미지 자체는 저장되지 않지만, 배포된 가중치(특히 BN 통계)만으로도 훈련 데이터의 클래스별 시각 패턴이 상당 부분 복원 가능하다는 것이 이 논문의 방어적 함의다 — 모델을 공유하는 것이 데이터를 공유하지 않는 것과 동일하지 않을 수 있다.',
 '**단순 DeepInversion만으로는 다양성이 부족하다.** Adaptive DeepInversion(학생과의 경쟁)을 추가하지 않으면 같은 클래스에서 유사한 이미지가 반복 생성되기 쉽다.'
],

figures:[
 {f:'fig1-pipeline.png',
  cap:'왼쪽: 노이즈 입력이 고정된 교사(Pretrained model)를 통과하며 Feature distribution regularization(BatchNorm 통계 정합)과 교차엔트로피 손실로 역전파되어 이미지 자체가 갱신된다. Adaptive DeepInversion(주황)은 여기에 학생과의 Jensen-Shannon divergence를 더한다. 가운데: 이렇게 만들어진 클래스 조건부 합성 이미지들. 오른쪽: 이 이미지들로 학생을 KL 발산으로 증류하는 표준 지식 전달 단계.',
  src:'원문 Figure 1, p.1'}
],

links:[
 {t:'arXiv 1912.08795 — Dreaming to Distill: DeepInversion', u:'https://arxiv.org/abs/1912.08795'}
]
});
