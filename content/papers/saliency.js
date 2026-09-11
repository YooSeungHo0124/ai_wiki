WIKI.paper({
slug:'saliency',
venue:'ICLR 2014 (Workshop)',
authors:'Simonyan, Vedaldi, Zisserman (Visual Geometry Group, Oxford)',
arxiv:'1312.6034',

tldr:'ConvNet이 예측을 내리기까지 무엇을 봤는지, 입력에 대한 출력의 **경사(gradient)** 하나로 들여다볼 수 있음을 보인 논문. 역전파 한 번이면 되는 값싼 방법으로, 이후 모든 gradient 기반 해석 기법의 출발점이 되었다.',

context:'2013년의 [AlexNet](#/p/alexnet) 계열 ConvNet은 ImageNet 분류에서 압도적 성능을 냈지만 내부가 블랙박스였다. Erhan et al.은 은닉 뉴런을 최대화하는 입력을 경사 상승으로 찾아 비지도 모델을 들여다봤고, Zeiler와 Fergus는 DeconvNet으로 각 층의 활성을 역재구성해 특징을 시각화했다. 두 접근 모두 무겁거나 별도의 구조를 요구했다. 이 논문은 질문을 뒤집는다 — 이미 학습된 분류기에 **역전파를 한 번** 걸어서 얻는 경사만으로 같은 것을 할 수 없는가?',

ideas:[
 {h:'클래스 모델 시각화: 경사 상승으로 이미지를 만든다',
  lead:'클래스 점수 $S_c(I)$ 를 입력 이미지에 대해 경사 상승시켜 그 클래스의 "원형" 이미지를 합성한다.',
  d:'분류층의 (softmax 이전) 클래스 점수 $S_c(I)$ 를 $L2$ 정규화 항과 함께 최대화하는 이미지 $I$ 를 역전파로 찾는다. 가중치는 고정하고 입력 픽셀만 갱신한다는 점에서 학습의 반대 방향이다. softmax 확률이 아니라 정규화 전 점수를 쓰는 이유는, 확률은 다른 클래스 점수를 낮춰도 오를 수 있어 최적화가 원하는 클래스에 집중하지 않기 때문이다.'},
 {h:'클래스별 saliency map: 1차 테일러 전개가 곧 중요도',
  lead:'$S_c(I)$ 를 $I_0$ 근방에서 선형 근사하면 그 기울기 $w=\\partial S_c/\\partial I$ 자체가 픽셀별 중요도가 된다.',
  d:'선형 모델 $S_c(I)=w^Tc I + b_c$ 라면 $w$ 의 크기가 곧 픽셀 중요도임은 자명하다. 딥넷은 비선형이지만 특정 이미지 $I_0$ 주변에서 1차 테일러 전개하면 같은 형태가 된다. 이때 $w=\\partial S_c/\\partial I|_{I_0}$ 이고, 이 미분의 크기가 큰 픽셀일수록 "조금만 바꿔도 점수가 크게 움직이는" 픽셀 — 즉 클래스 판단에 민감한 위치다. 이 값을 이미지 모양으로 재배열한 것이 saliency map이고, 계산은 **역전파 단 한 번**이다.'},
 {h:'다채널 이미지는 채널 최대값으로 축약',
  lead:'RGB 각 채널의 미분 절댓값 중 최댓값을 취해 픽셀 하나에 값 하나를 준다.',
  d:'그레이스케일이면 $M_{ij}=|w_{h(i,j)}|$ 로 바로 지도가 된다. RGB처럼 픽셀당 채널이 여럿이면 $M_{ij}=\\max_c |w_{h(i,j,c)}|$ 로 채널 중 가장 민감한 값을 대표로 쓴다. 별도 학습이나 라벨 없이, 이미 있는 분류기 하나로 곧바로 얻는 지도라는 점이 실무적 강점이다.'},
 {h:'지도만으로 약지도 객체 위치 찾기',
  lead:'saliency map을 GraphCut 색 분할의 전경/배경 씨앗으로 써서 바운딩박스를 뽑아낸다.',
  d:'saliency 상위 95% 분위 픽셀을 전경 씨앗, 하위 30% 분위를 배경 씨앗으로 삼아 GraphCut 색 분할을 돌리고, 가장 큰 연결 성분을 객체 영역으로 잡는다. 바운딩박스나 마스크 라벨을 전혀 쓰지 않고, 이미지 라벨만으로 학습된 분류기에서 위치 정보를 뽑아낸 것이다.'},
 {h:'DeconvNet과의 관계: 사실상 같은 연산',
  lead:'ReLU를 통과할 때 DeconvNet의 재구성 규칙과 saliency의 역전파 규칙이 거의 같음을 보인다.',
  d:'DeconvNet은 $n$번째 층 입력 $X_n$ 을 $R_n=R_{n+1}\\star K$ 형태로 재구성하고, ReLU에서는 $R_{n+1}$ 자체의 부호로 지시자를 만든다. 반면 일반 역전파는 순전파 때의 활성 $X_n$ 의 부호로 지시자를 만든다는 차이만 있을 뿐, 나머지 연산은 동일하다. 이 관찰이 이후 guided backpropagation 같은 변형들의 이론적 배경이 된다.'}
],

diagram:{type:'compare', cap:'같은 경사 계산을 이미지 쪽에 쓰느냐 픽셀 중요도 쪽에 쓰느냐의 차이.',
 left:{t:'클래스 모델 시각화', items:['빈 이미지에서 시작','$S_c$ 를 경사 상승으로 최대화','결과: 클래스의 "원형" 이미지']},
 right:{t:'클래스 saliency map', items:['주어진 이미지 $I_0$ 사용','1차 미분을 역전파 1회로 계산','결과: 픽셀별 중요도 지도'], acc:false}
},

math:[
 {expr:'S_c(I) ≈ wᵀI + b,   w = ∂S_c/∂I |_{I0}',
  tex:'S_c(I)\\approx w^{\\top}I+b,\\qquad w=\\left.\\frac{\\partial S_c}{\\partial I}\\right|_{I_0}',
  d:'클래스 점수를 이미지 $I_0$ 근방에서 1차 테일러 전개한 것. $w$ 는 역전파 한 번으로 얻고, 그 절댓값이 saliency map이 된다.'},
 {expr:'M_ij = max_c |w_h(i,j,c)|',
  tex:'M_{ij}=\\max_{c}\\left|w_{h(i,j,c)}\\right|',
  d:'RGB 등 다채널 이미지에서 픽셀 $(i,j)$ 의 saliency 값을 채널별 미분 절댓값의 최댓값으로 정의한다.'},
 {expr:'arg max_I  S_c(I) − λ‖I‖₂²',
  tex:'\\operatorname*{arg\\,max}_{I}\\; S_c(I)-\\lambda\\lVert I\\rVert_2^2',
  d:'클래스 모델 시각화의 목적함수. $L2$ 항은 픽셀 값이 발산하지 않도록 잡아주는 정규화다.'}
],

numbers:[
 {k:'분류 오차 · ILSVRC-2013', v:'top-1/top-5 39.7%/17.7%', d:'실험에 쓴 단일 ConvNet(AlexNet 유사 구조)의 검증셋 성능'},
 {k:'약지도 위치 찾기 오차', v:'top-5 localisation 46.4%', d:'클래스 라벨만으로 학습한 분류기의 saliency map으로 얻은 ILSVRC-2013 테스트셋 결과'},
 {k:'완전지도 대비', v:'50.0%', d:'같은 데이터셋에서 파트 기반 모델 + Fisher vector를 쓴 저자들의 2012년 완전지도 방법의 오차 — 이보다 낮음'},
 {k:'ILSVRC-2013 우승자', v:'29.9%', d:'참고 기준선. 약지도 방법이 이보다 나쁜 것은 당연하지만, 라벨만으로 이 정도가 나온다는 것이 요점'},
 {k:'계산 비용', v:'역전파 1회', d:'saliency map 하나를 얻는 데 forward + backward 한 번이면 충분하다'}
],

impact:'해석 방법을 "무거운 별도 절차"에서 "이미 있는 역전파 한 줄"로 바꿨다. 클래스 모델 시각화는 이후 DeepDream류의 특징 시각화 연구로, saliency map은 [Grad-CAM](#/p/grad-cam)·[Integrated Gradients](#/p/integrated-gradients) 등 gradient 기반 귀속(attribution) 방법 전체의 원조가 됐다. 동시에 이 논문이 보인 raw saliency map의 시각적 노이즈 문제(그림에서 보이듯 지도가 듬성듬성하고 지저분하다)는 이후 십여 년간 "더 깨끗한 귀속 지도를 어떻게 만들 것인가"라는 연구 계열 전체의 출발선이 되었다.',

legacy:[
 '**gradient 기반 귀속의 원조** — [Grad-CAM](#/p/grad-cam)은 마지막 합성곱 특징맵을 경사로 가중해, [Integrated Gradients](#/p/integrated-gradients)는 경로 적분으로 saliency의 노이즈·포화 문제를 해결하려 했다',
 '**guided backpropagation·SmoothGrad 등 후속 변형** — 이 논문이 밝힌 DeconvNet과 역전파의 관계를 바탕으로, ReLU 역전파 규칙을 바꾸거나 노이즈를 여러 번 평균 내는 식으로 지도를 정제하는 연구가 이어졌다',
 '**개념 단위 해석으로의 전환** — 픽셀 중요도만으로는 부족하다는 문제의식이 [TCAV](#/p/tcav) 같은 사람이 이해하는 개념 단위 해석으로 이어졌다',
 '**"saliency map은 얼마나 믿을만한가" 논쟁** — 이후 saliency 지도가 모델 파라미터를 무작위화해도 크게 안 변한다는 sanity check 연구들이 이 계열 방법 전체의 신뢰도를 되묻는 계기가 되었다'
],

pitfalls:[
 '**클래스 모델 시각화와 saliency map은 다른 절차다.** 전자는 빈 이미지에서 경사 상승으로 새 이미지를 만들고, 후자는 주어진 이미지 하나에 대한 1차 미분이다. 둘 다 "경사를 본다"는 점은 같지만 입력과 산출물이 다르다.',
 '**raw saliency map은 노이즈가 많다.** 그림에서 보듯 지도가 매끈한 객체 윤곽이 아니라 듬성듬성한 점들로 나오는데, 이는 ReLU의 비선형성과 saturation 때문이다. 이 문제를 고치려는 후속 연구가 이후 십 년간 이어졌다.',
 '**약지도 위치 찾기는 분할이 아니라 GraphCut 후처리의 결과다.** saliency map 자체는 바운딩박스나 마스크를 주지 않으며, 색 분할이라는 별도 알고리즘을 얹어야 위치 정보가 나온다.'
],

figures:[
 {f:'fig1-classmodel.png',
  cap:'클래스 점수를 경사 상승으로 최대화해 얻은 "원형" 이미지 3장(dumbbell·cup·dalmatian). 특정 사진이 아니라 그 클래스를 판단할 때 ConvNet이 반응하는 패턴들이 한 이미지 안에 여러 번 겹쳐 나타난다(예: 아령이 여러 각도로 중첩).',
  src:'원문 Figure 1, p.3'},
 {f:'fig2-saliencymap.png',
  cap:'각 열 위쪽이 원본, 아래쪽이 그 이미지의 top-1 예측 클래스에 대한 saliency map. 밝을수록 그 클래스 점수에 민감한 픽셀이며, 배 사진(왼쪽 위)에서는 돛 윤곽이, 강아지 사진에서는 몸통 부분이 밝게 나온 것을 볼 수 있다.',
  src:'원문 Figure 2, p.5'}
],

quotes:[
 {t:'The first one generates an image, which maximises the class score, thus visualising the notion of the class, captured by a ConvNet. The second technique computes a class saliency map, specific to a given image and class.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1312.6034 — Deep Inside Convolutional Networks', u:'https://arxiv.org/abs/1312.6034'},
 {t:'VGG iseg (GraphCut 구현)', u:'http://www.robots.ox.ac.uk/~vgg/software/iseg/'}
]
});
