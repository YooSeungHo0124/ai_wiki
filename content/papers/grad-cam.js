WIKI.paper({
slug:'grad-cam',
venue:'ICCV 2017',
authors:'Selvaraju, Cogswell, Das, Vedantam, Parikh & Batra (Georgia Tech · Facebook AI Research)',
arxiv:'1610.02391',

tldr:'CNN을 재훈련하거나 구조를 바꾸지 않고, 마지막 합성곱 층으로 흘러드는 **gradient**만으로 "모델이 이미지의 어디를 보고 그 클래스라고 판단했는지" 히트맵을 만든 방법. CNN 시각화의 사실상 표준이 되었다.',

context:'2016년의 Class Activation Mapping(CAM)은 이미 gradient 없이 클래스별 히트맵을 만들 수 있었지만, 전결합층을 전역평균풀링(GAP)으로 바꾼 **특정 구조**에서만 동작했다. 즉 히트맵을 얻으려면 모델을 그 구조로 다시 설계하고 재훈련해야 했고, [VGG](#/p/vgg) 같은 전결합층 기반 모델이나 captioning·VQA처럼 분류가 아닌 작업에는 아예 적용할 수 없었다. 한편 [역전파](#/p/backprop) 자체를 시각화하는 saliency map 계열(Guided Backprop 등)은 어떤 구조에도 적용되지만 고해상도인 대신 클래스 구분력이 없다 — "고양이"를 봐도 "개"를 봐도 거의 같은 그림이 나온다. Grad-CAM은 이 둘 사이의 공백, "구조를 안 바꾸면서 클래스별로 다른 히트맵"을 메운다.',

ideas:[
 {h:'CAM을 gradient로 일반화한다',
  lead:'GAP 가중치 대신 gradient의 전역평균을 채널 중요도로 쓰면 어떤 CNN에도 적용된다.',
  d:'CAM은 마지막 층이 GAP→softmax 구조일 때만 그 가중치를 채널 중요도로 재활용할 수 있었다. Grad-CAM은 대신 클래스 점수 $y^c$ 를 마지막 합성곱 층의 활성화 $A^k$ 로 미분한 gradient를 공간 축으로 전역평균해 같은 역할의 가중치 $\\alpha_k^c$ 를 얻는다. 논문은 전결합층을 가진 구조에서 이 $\\alpha_k^c$ 가 CAM의 GAP 가중치와 **수학적으로 동일**함을 보여, Grad-CAM이 CAM의 strict generalization임을 증명한다.'},
 {h:'가중합 후 ReLU: 양의 증거만 남긴다',
  lead:'채널별 활성화 맵을 $\\alpha_k^c$ 로 가중합한 뒤 ReLU를 씌워 그 클래스에 도움이 된 영역만 남긴다.',
  d:'가중합 자체는 음수 영역도 포함하지만, 관심 있는 것은 "그 클래스일 가능성을 높이는" 위치뿐이다. ReLU로 음수를 잘라내면 실제로 그 클래스에 긍정적으로 기여한 영역만 남는 조악한(coarse) 히트맵이 된다. 마지막 conv 층 출력을 쓰기 때문에 해상도는 낮지만(예: 14×14), 이 층이 고수준 의미와 공간 정보를 동시에 갖는 마지막 지점이라는 절충이다.'},
 {h:'Guided Grad-CAM: 저해상도와 고해상도를 곱한다',
  lead:'클래스 구분력 있는 Grad-CAM과 고해상도 Guided Backprop을 원소별 곱으로 합친다.',
  d:'Grad-CAM 단독은 클래스를 구분하지만 거칠고(coarse), Guided Backpropagation은 세밀하지만 클래스를 구분 못한다. 둘을 업샘플링 후 element-wise 곱으로 합치면 "고양이의 줄무늬"처럼 세밀하면서도 그 클래스에만 반응하는 시각화를 얻는다.'},
 {h:'분류를 넘어 captioning·VQA·강화학습까지',
  lead:'클래스 점수를 미분 가능한 아무 스칼라 출력으로 바꾸면 같은 절차가 그대로 적용된다.',
  d:'$y^c$ 를 반드시 softmax 클래스 점수일 필요는 없다 — captioning 모델의 다음 단어 로그확률, VQA 모델의 답변 점수로 바꿔도 동일한 backward pass로 히트맵을 얻는다. CNN 부분은 그대로 두고 그 뒤에 어떤 task-specific 네트워크(RNN/LSTM 등)가 붙어도 무관하다는 것이 model-agnostic까지는 아니지만 **architecture-agnostic**(CNN이기만 하면 됨)이라는 이 논문의 실질적 기여다.'}
],

diagram:{type:'flow', cap:'forward pass로 점수를 얻고, 그 클래스만 1로 둔 채 마지막 conv 층까지만 역전파한다.',
 nodes:[
  {t:'CNN', s:'마지막 conv까지'},
  {t:'활성화 A^k', s:'채널별 특징맵'},
  {t:'클래스 점수 역전파', s:'∂y^c/∂A^k', acc:true},
  {t:'GAP → α_k^c', s:'채널 중요도'},
  {t:'가중합 + ReLU', s:'coarse 히트맵'}
 ]},

math:[
 {expr:'α_k^c = (1/Z) Σ_i Σ_j ∂y^c/∂A^k_ij',
  tex:'\\alpha_k^c = \\frac{1}{Z}\\sum_i\\sum_j \\frac{\\partial y^c}{\\partial A^k_{ij}}',
  d:'클래스 $c$ 의 점수 $y^c$ 를 $k$ 번째 채널의 각 위치 $(i,j)$ 로 미분한 gradient를 공간 전체에 대해 평균낸 것이 채널 $k$ 의 중요도다.'},
 {expr:'L_Grad-CAM^c = ReLU( Σ_k α_k^c A^k )',
  tex:'L^{c}_{\\text{Grad-CAM}} = \\text{ReLU}\\!\\left(\\sum_k \\alpha_k^c A^k\\right)',
  d:'채널별 활성화 맵 $A^k$ 를 그 중요도 $\\alpha_k^c$ 로 가중합한 뒤 ReLU로 양의 기여만 남긴 것이 최종 히트맵이다.'}
],

numbers:[
 {k:'ILSVRC-15 top-1 localization (VGG-16)', v:'56.51%', d:'CAM 57.20%·backprop 61.12%보다 낮은 오류(낮을수록 좋음)'},
 {k:'분류 정확도 손실', v:'0%p', d:'CAM은 구조 변경·재훈련으로 top-1 분류 오류가 2.98%p 악화되지만 Grad-CAM은 원 모델 그대로 사용'},
 {k:'AlexNet top-1 localization', v:'68.3%', d:'c-MWP(92.6%) 대비 크게 개선'},
 {k:'binarize 임계값', v:'최대 강도의 15%', d:'약지도 localization에서 히트맵을 이진화해 bounding box를 그리는 기준'},
 {k:'적용 대상', v:'VGG-16 · AlexNet · GoogleNet · ResNet', d:'구조 변경 없이 off-the-shelf 사전학습 모델에 그대로 적용'}
],

impact:'Grad-CAM은 "설명 가능성을 얻으려면 모델을 다시 설계해야 한다"는 CAM의 전제를 없앴다. 이미 배포된 어떤 CNN이라도 backward pass 한 번으로 클래스별 히트맵을 뽑을 수 있게 되면서, 딥러닝 실무에서 "이 모델이 배경을 보고 정답을 맞힌 것은 아닌지" 점검하는 표준 디버깅 도구가 되었다. 논문이 직접 보여준 예처럼, ImageNet의 특정 클래스가 실제로는 사람이 아니라 특정 배경·텍스트에 반응해 예측되는 데이터셋 편향을 찾아내는 데도 쓰인다. 이 접근은 gradient 기반 사후 설명이라는 점에서 [LIME](#/p/lime)의 perturbation 기반 접근과 대비되는, 훨씬 빠른 대안 축을 만들었다.',

legacy:[
 '**gradient 기반 사후 설명의 표준 도구** — Grad-CAM++, Score-CAM 등 수많은 변형이 뒤이었고, 지금도 CNN 논문의 정성적 결과 절에 기본으로 들어감',
 '**해석과 편향 진단의 결합** — 모델이 왜 틀렸는지가 아니라 "무엇을 보고 맞혔는지"까지 보여주며, 데이터셋 편향 발견 도구로 자리잡음([LIME](#/p/lime)의 허스키/늑대 사례와 같은 문제의식을 gradient로 재현)',
 '**게임이론적 대안과의 공존** — 특징 기여도를 공리적으로 정의하려는 [SHAP](#/p/shap)과는 별개로, "빠르지만 근사적인" 시각화 축으로 실무에서 나란히 쓰임',
 '**ViT 시대의 재도전 과제** — CNN의 공간적 conv 특징맵에 의존하는 방법이라, [ViT](#/p/vit) 이후에는 attention rollout 등 다른 시각화 기법이 그 자리를 대신 채움'
],

pitfalls:[
 '**마지막 conv 층 해상도만큼만 조악하다.** 보통 14×14 수준이라 업샘플링으로 원본 크기까지 늘리면 경계가 뭉개진다 — 정밀한 픽셀 단위 설명이 필요하면 Guided Grad-CAM처럼 고해상도 방법과 결합해야 한다.',
 '**히트맵이 "그 영역이 원인이다"를 증명하지는 않는다.** gradient가 크다는 것은 그 위치를 조금 바꿨을 때 점수가 민감하게 반응한다는 뜻이지, 그 영역이 실제 인과적 근거라는 보장은 아니다 — [LIME](#/p/lime) 계열의 국소 근사와 마찬가지로 사후 설명(post-hoc)의 한계를 공유한다.',
 '**CNN 전용이다.** attention 기반 모델에는 그대로 적용할 수 없고, [ViT](#/p/vit) 같은 구조에는 별도의 시각화 기법이 필요하다.'
],

figures:[
 {f:'fig1-heatmaps.png',
  cap:'같은 이미지(개+고양이)에서 "고양이" 클래스에 대한 서로 다른 시각화 비교. 왼쪽부터 원본, Guided Backprop(고해상도지만 개·고양이 구분 안 됨), Grad-CAM(붉은 영역이 고양이에 정확히 집중), Guided Grad-CAM(둘을 곱해 고해상도+클래스 구분 동시 달성).',
  src:'원문 Figure 1(a-f), p.3'},
 {f:'fig2-pipeline.png',
  cap:'입력 이미지가 CNN을 통과해 관심 클래스(Tiger Cat)의 점수를 얻고, 그 클래스만 1로 둔 gradient를 마지막 conv 층(A)까지 역전파(파란 화살표)한다. 이 gradient로 만든 Grad-CAM 히트맵(왼쪽 아래)을 Guided Backprop과 원소별 곱해 Guided Grad-CAM을 얻는다. Image Captioning·VQA 줄은 CNN 뒤에 어떤 task 네트워크가 붙어도 같은 절차가 통한다는 것을 보여준다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'Our approach – Gradient-weighted Class Activation Mapping (Grad-CAM), uses the gradients of any target concept... flowing into the final convolutional layer to produce a coarse localization map highlighting the important regions in the image.',
  src:'Abstract, p.1'},
 {t:'Grad-CAM is a strict generalization of CAM.',
  src:'Section 3, p.4 (context)'}
],

links:[
 {t:'arXiv 1610.02391 — Grad-CAM', u:'https://arxiv.org/abs/1610.02391'},
 {t:'grad-cam (GitHub, ramprs)', u:'https://github.com/ramprs/grad-cam/'}
]
});
