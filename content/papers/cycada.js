WIKI.paper({
slug:'cycada',
venue:'ICML 2018',
authors:'Judy Hoffman, Eric Tzeng, Taesung Park, Jun-Yan Zhu, Phillip Isola, Kate Saenko, Alexei A. Efros, Trevor Darrell (BAIR UC Berkeley · OpenAI · Boston University)',
arxiv:'1711.03213',

tldr:'[CycleGAN](#/p/cyclegan)의 픽셀 수준 이미지 변환과 [DANN](#/p/dann)/[ADDA](#/p/adda) 계열의 특징 수준 정렬을 **함께** 써서, 순환 일관성과 의미 일관성 손실로 내용이 바뀌지 않도록 묶은 방법. GTA5→Cityscapes 같은 합성→실제 전이에서 특히 효과적이다.',

context:'특징 공간에서 도메인을 정렬하는 [DANN](#/p/dann)·[ADDA](#/p/adda) 방식은 도메인 불변 표현을 학습하지만, 그 표현이 실제로 무엇을 맞췄는지 시각화하기 어렵고 저수준(색감·질감) 차이를 놓치기 쉽다. 한편 [CycleGAN](#/p/cyclegan) 같은 이미지 변환 GAN은 정렬되지 않은 두 이미지 집합 사이를 시각적으로 그럴듯하게 오가지만, cycle-consistency만으로는 변환 후에도 **의미(클래스)가 보존된다는 보장이 없다** — 예를 들어 자동차가 트럭으로 바뀌어도 순환 재구성 손실은 만족될 수 있다. 합성 게임 엔진(GTA5) 이미지로 학습한 세그멘테이션 모델을 실제 도로 사진(Cityscapes)에 그대로 쓰면 픽셀 정확도가 93%에서 크게 떨어진다는 것이 이 문제의 구체적인 배경이다.',

ideas:[
 {h:'픽셀 수준 + 특징 수준을 동시에',
  lead:'CycleGAN으로 소스 이미지를 타깃처럼 바꾸고, 그 결과에 다시 특징 수준 적대 정렬을 건다.',
  d:'소스→타깃 변환기 $G_{S\\to T}$ 로 GTA5 이미지를 Cityscapes 스타일로 바꿔 "타깃처럼 보이는 소스 이미지"를 만든다(이미지 수준 GAN 손실, [CycleGAN](#/p/cyclegan)과 동일한 구조). 여기에 더해 태스크 네트워크 $f_T$ 가 뽑은 특징에도 판별기 $D_{feat}$ 를 붙여 적대적으로 정렬한다(특징 수준 GAN 손실) — [ADDA](#/p/adda)가 하던 일을 변환된 이미지 위에서 한 번 더 하는 셈이다.'},
 {h:'순환 일관성으로 콘텐츠 보존',
  lead:'소스→타깃→소스로 되돌렸을 때 원본이 복원되도록 L1 재구성 손실을 건다.',
  d:'$G_{T\\to S}(G_{S\\to T}(x_s)) \\approx x_s$ 를 강제하는 cycle-consistency loss는 [CycleGAN](#/p/cyclegan)에서 그대로 가져온 것이다. 이것만으로는 스타일은 맞아도 내용이 뒤틀릴 수 있다는 것이 다음 아이디어의 동기다.'},
 {h:'의미 일관성 손실: 노이즈 있는 레이블러로 내용 고정',
  lead:'변환 전후 이미지를 고정된 소스 분류기에 넣어 같은 예측이 나오도록 강제한다.',
  d:'미리 학습해 고정해 둔 소스 태스크 모델 $f_S$ 를 "노이즈 있는 레이블러"로 써서, 변환 전 이미지의 예측 $p(f_S,x)$ 와 변환 후 이미지의 예측이 같아지도록 손실을 건다. 이것이 스타일 전이의 content loss와 같은 역할을 하며, 자동차가 트럭으로 바뀌는 식의 의미 왜곡(semantic drift)을 억제한다.'},
 {h:'다섯 손실의 결합과 단계적 최적화',
  lead:'태스크·이미지 GAN·특징 GAN·순환·의미 손실 다섯 개를 하나의 min-max 목적함수로 묶는다.',
  d:'전체 목적함수 $\\mathcal{L}_{CyCADA}$ 는 태스크 손실, 이미지 수준 GAN 손실(양방향), 특징 수준 GAN 손실, 순환 손실, 의미 일관성 손실의 합이다. 이를 한 번에 최적화하지 않고, 먼저 이미지 변환기를 cycle+semantic 손실로 학습한 뒤 그 출력 위에서 태스크 모델과 특징 판별기를 학습하는 단계적 절차를 쓴다.'}
],

diagram:{type:'stack', cap:'소스 이미지가 스타일 변환·순환 재구성·태스크 예측까지 통과하는 경로. 아래에서 위로 쌓을수록 손실이 추가된다.',
 layers:[
  {t:'소스 이미지', s:'GTA5'},
  {t:'G_{S→T}', s:'타깃 스타일로 변환', acc:true, note:'CycleGAN 생성기'},
  {t:'D_T + D_feat', s:'이미지·특징 판별', note:'적대적 손실 2종'},
  {t:'f_T (태스크 모델)', s:'세그멘테이션', note:'변환된 이미지로 학습'},
  {t:'G_{T→S}', s:'원복', note:'cycle-consistency'},
  {t:'f_S (고정)', s:'의미 일관성 검사', note:'변환 전후 예측 비교'}
 ]},

math:[
 {expr:'L_cyc = E[‖G_{T→S}(G_{S→T}(xₛ)) − xₛ‖₁] + E[‖G_{S→T}(G_{T→S}(xₜ)) − xₜ‖₁]',
  tex:'\\mathcal{L}_{cyc}(G_{S\\to T},G_{T\\to S},X_S,X_T) = \\mathbb{E}_{x_s\\sim X_S}\\big[\\lVert G_{T\\to S}(G_{S\\to T}(x_s)) - x_s\\rVert_1\\big] + \\mathbb{E}_{x_t\\sim X_T}\\big[\\lVert G_{S\\to T}(G_{T\\to S}(x_t)) - x_t\\rVert_1\\big]',
  d:'[CycleGAN](#/p/cyclegan)과 동일한 순환 재구성 손실. 소스↔타깃을 왕복해도 원본이 복원되도록 강제해 스타일 변환기가 임의의 매핑으로 붕괴하는 것을 막는다.'},
 {expr:'L_sem = L_task(fₛ, G_{T→S}(Xₜ), p(fₛ,Xₜ)) + L_task(fₛ, G_{S→T}(Xₛ), p(fₛ,Xₛ))',
  tex:'\\mathcal{L}_{sem}(G_{S\\to T},G_{T\\to S},X_S,X_T,f_S) = \\mathcal{L}_{task}\\big(f_S, G_{T\\to S}(X_T), p(f_S,X_T)\\big) + \\mathcal{L}_{task}\\big(f_S, G_{S\\to T}(X_S), p(f_S,X_S)\\big)',
  d:'고정된 소스 모델 $f_S$ 가 매긴 "노이즈 있는 레이블" $p(f_S,\\cdot)$ 을 변환 전후 이미지 모두에 강제한다. 이 항이 없으면 GAN+cycle 손실만으로는 클래스가 바뀌는 실패가 관찰된다(Figure 3 ablation).'},
 {expr:'L_CyCADA = L_task(f_T,G_{S→T}(Xₛ),Yₛ) + L_GAN(...)×2 + L_GAN(특징) + L_cyc + L_sem',
  tex:'\\begin{aligned}\\mathcal{L}_{CyCADA} &= \\mathcal{L}_{task}(f_T, G_{S\\to T}(X_S), Y_S) \\\\ &+ \\mathcal{L}_{GAN}(G_{S\\to T},D_T,X_T,X_S) + \\mathcal{L}_{GAN}(G_{T\\to S},D_S,X_S,X_T) \\\\ &+ \\mathcal{L}_{GAN}(f_T,D_{feat},f_S(G_{S\\to T}(X_S)),X_T) \\\\ &+ \\mathcal{L}_{cyc} + \\mathcal{L}_{sem}\\end{aligned}',
  d:'다섯 손실을 모두 더한 전체 목적함수. $\\min_{f_T}\\min_{G}\\max_{D}$ 형태의 min-max로 풀며, $G_{S\\to T}$ 가 픽셀 수준을, $D_{feat}$ 가 특징 수준을 담당해 두 수준의 정렬이 한 목적함수 안에 공존한다.'}
],

numbers:[
 {k:'GTA5→Cityscapes mIoU · source only', v:'17.9', d:'VGG16-FCN8s 기준, 적응 없이 GTA5로만 학습'},
 {k:'GTA5→Cityscapes mIoU · CyCADA(픽셀+특징)', v:'35.4', d:'같은 아키텍처에서 픽셀 전용 34.8, 특징 전용 29.2보다 높음 — 결합의 이득 확인'},
 {k:'GTA5→Cityscapes 픽셀 정확도', v:'73.8%', d:'target-supervised oracle(87.6%)과의 격차를 상당 부분 좁힘'},
 {k:'SVHN→MNIST 분류 정확도', v:'90.4%', d:'픽셀 전용보다 특징 정렬을 더했을 때 개선폭이 가장 큰 shift'},
 {k:'MNIST→USPS 분류 정확도', v:'95.6%', d:'레이블 있는 데이터로 교차검증하는 Pixel-DA(95.9%)에 근접 — CyCADA는 그런 교차검증 없이 도달'}
],

impact:'CyCADA는 "픽셀 정렬이냐 특징 정렬이냐"를 양자택일이 아니라 함께 쓸 수 있는 두 축으로 재정의했고, 의미 일관성 손실이라는 형태로 이미지 변환에 태스크 구조를 주입하는 방법을 제시했다. 이후 합성→실제 세그멘테이션 적응 연구 다수가 이 조합(변환+순환+의미 일관성)을 기본 레시피로 채택했으며, 자율주행 시뮬레이션 데이터 활용 연구에서 특히 자주 인용된다.',

legacy:[
 '**픽셀+특징 결합 레시피의 정착** — 이후 세그멘테이션 도메인 적응 연구 다수가 이미지 변환과 특징 정렬을 함께 쓰는 CyCADA 구조를 기본값으로 채택',
 '**의미 일관성 손실의 재사용** — 고정된 소스 모델을 노이즈 레이블러로 쓰는 아이디어가 이후 이미지 변환 기반 적응 연구에 반복적으로 등장',
 '**소스 데이터 의존을 줄이는 흐름으로 연결** — CyCADA는 여전히 소스·타깃 데이터를 함께 학습에 써야 하며, 이 전제를 완전히 없앤 것이 [TENT](#/p/tent)의 시험시 적응',
 '**시각적 검증 가능성** — 적응된 이미지를 직접 눈으로 볼 수 있다는 점이 특징 전용 방법과 구별되는 실무적 장점으로 이후 논문들에 자주 인용됨'
],

pitfalls:[
 '**의미 일관성 손실은 소스 레이블러 $f_S$ 의 정확도에 의존한다.** $f_S$ 자체가 틀린 예측을 하는 영역에서는 오히려 잘못된 신호로 변환기를 학습시킬 수 있다.',
 '**픽셀 전용과 특징 전용의 우열은 shift 크기에 따라 갈린다.** 작은 격차(USPS↔MNIST)에서는 픽셀 정렬만으로 충분하지만, 큰 격차(SVHN→MNIST)에서는 특징 정렬이 추가로 필요하다 — "픽셀 정렬이 항상 더 낫다"는 결론이 아니다.',
 '**이 논문에서 CycleGAN의 저자(Jun-Yan Zhu)가 공저자로 참여**했지만, cycle-consistency loss 자체는 CyCADA의 기여가 아니라 [CycleGAN](#/p/cyclegan) 및 동시기 논문들(DiscoGAN 등)에서 가져온 것이다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'초록이 이미지 수준 GAN 손실, 주황이 특징 수준 GAN 손실, 검정이 소스·타깃 의미 일관성 손실, 빨강이 소스 순환 손실, 보라가 소스 태스크 손실. 다섯 색이 곧 다섯 개 손실항이며, 모두 "Source Image Stylized as Target" 한 이미지를 중심으로 모인다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'CyCADA adapts representations at both the pixel-level and feature-level, enforces cycle-consistency while leveraging a task loss, and does not require aligned pairs.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1711.03213 — CyCADA: Cycle-Consistent Adversarial Domain Adaptation', u:'https://arxiv.org/abs/1711.03213'}
]
});
