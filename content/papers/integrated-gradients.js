WIKI.paper({
slug:'integrated-gradients',
venue:'ICML 2017',
authors:'Sundararajan, Taly, Yan (Google)',
arxiv:'1703.01365',

tldr:'귀속(attribution) 방법을 직관이 아니라 **공리(axiom)에서 거꾸로 유도**한 논문. 기준선(baseline)에서 입력까지 직선 경로를 따라 경사를 적분하는 Integrated Gradients를 제안하고, 이 방법만이 Sensitivity와 Implementation Invariance를 동시에 만족한다는 것을 증명한다.',

context:'[saliency map](#/p/saliency)처럼 입력에 대한 경사를 그대로 쓰는 방법, [Grad-CAM](#/p/grad-cam)처럼 특징맵을 가중평균하는 방법, DeepLift·LRP처럼 층별로 역전파 규칙을 바꾸는 방법이 모두 "그럴듯한 설명"을 내놓고 있었지만, 어느 것이 더 나은 방법인지 비교할 기준이 없었다. 성능처럼 정답 라벨과 비교할 수 없는 문제라서, 평가 자체가 주관적이었다. 이 논문은 접근을 바꾼다 — 좋은 귀속 방법이라면 반드시 만족해야 할 성질을 먼저 정의하고, 그 성질을 만족하는 방법을 수학적으로 유도한다.',

ideas:[
 {h:'Sensitivity 공리: 기여가 있으면 귀속도 0이 아니어야 한다',
  lead:'입력과 기준선이 한 특징만 다르고 예측도 다르면, 그 특징의 귀속값은 반드시 0이 아니어야 한다.',
  d:'순수 경사(gradient) 방법은 이 공리를 깬다. $f(x)=1-\\text{ReLU}(1-x)$ 예시에서 기준선 $x=0$, 입력 $x=2$ 로 이동하면 함수값은 0에서 1로 바뀌지만, $x=1$ 이후 함수가 평평해져 $x=2$ 지점의 경사는 0이다. 특징이 실제로 예측을 바꿨는데도 경사만 보는 방법은 기여를 0으로 판정하는 것이다. DeconvNet과 Guided Backprop도 ReLU가 입력에서 꺼져 있으면 역전파를 막아버려서 같은 문제를 겪는다.'},
 {h:'Implementation Invariance 공리: 같은 함수면 같은 귀속',
  lead:'기능적으로 동일한 두 네트워크는 내부 구현이 달라도 같은 귀속값을 내야 한다.',
  d:'귀속은 "입력이 출력에 얼마나 기여했는가"를 묻는 것이지 "그 네트워크가 내부적으로 어떻게 계산했는가"를 묻는 것이 아니다. 순수 경사 기반 방법은 연쇄법칙 $\\partial f/\\partial g=(\\partial f/\\partial h)(\\partial h/\\partial g)$ 자체가 구현 불변이라 이 공리를 자동으로 만족하지만, DeepLift와 LRP는 층마다 다른 역전파 규칙(예: 이산 경사 근사)을 쓰기 때문에 겉보기에 같은 함수를 다르게 구현하면 다른 귀속값을 낼 수 있다.'},
 {h:'Integrated Gradients: 기준선에서 입력까지 경사를 적분한다',
  lead:'기준선 $x^0$ 에서 입력 $x$ 로 가는 직선 경로를 따라 경사를 쌓아(적분해) 귀속값을 만든다.',
  d:'단일 지점의 경사 대신, 기준선부터 입력까지 이어지는 직선 위의 모든 점에서 경사를 구해 더한다. 경로 위 어느 지점에서는 함수가 평평해도(경사가 0이어도) 경로의 다른 구간에서 변화가 잡히므로 Sensitivity가 회복되고, 전체가 경사만으로 정의돼 있어 Implementation Invariance도 그대로 유지된다. 이 두 공리를 동시에 만족하는 것이 이 방법의 핵심 주장이다.'},
 {h:'Completeness: 귀속값의 합이 점수 변화량과 정확히 같다',
  lead:'모든 특징의 귀속값을 더하면 $F(x)-F(x^0)$, 즉 입력과 기준선의 점수 차이와 정확히 일치한다.',
  d:'이것은 미적분의 기본정리를 경로 적분에 적용한 결과다. 귀속값의 합이 실제 점수 변화와 맞아떨어지므로, "설명이 전체 예측을 빠짐없이 나눠 담았는가"를 바로 검산할 수 있다. 구현 시 이 합이 실제 점수차와 맞는지 확인하고, 안 맞으면 적분 구간을 더 잘게 쪼개라고(스텝 수를 늘리라고) 권고한다.'},
 {h:'기준선 선택이 결과를 좌우한다',
  lead:'기준선은 "그 특징이 없는 상태"를 대표해야 하는데, 이 선택 자체가 귀속값을 바꾼다.',
  d:'이미지 모델에서는 검은 이미지(모든 픽셀 0)를 기준선으로 쓰는 것이 자연스럽다 — 예측이 거의 중립($F(x^0)\\approx 0$)이 되기 때문이다. 텍스트 모델은 0 임베딩 벡터를 쓴다. 그러나 검은 이미지가 유일한 선택은 아니며, 저자들도 $\\min(x_1,x_2)$ 같은 간단한 예에서 기준선과 대칭성 사이의 긴장을 직접 지적한다 — 기준선을 어떻게 잡느냐에 따라 "무엇이 없다"의 의미 자체가 달라진다.'}
],

diagram:{type:'flow', cap:'기준선에서 입력까지의 직선 경로를 따라 경사를 쌓는 과정. m 스텝으로 근사해 계산한다.',
 nodes:[
  {t:'기준선', s:'x⁰, 보통 검은 이미지'},
  {t:'경로 위 m개 점', s:'x⁰+α(x−x⁰)', a:'각 점서 경사'},
  {t:'경사 합산', s:'Σ ∂F/∂xᵢ', acc:true},
  {t:'(x−x⁰) 곱', s:'차원별 스케일'},
  {t:'귀속값', s:'ΣIG = F(x)−F(x⁰)'}
 ]},

math:[
 {expr:'IntegratedGradsᵢ(x) = (xᵢ − x⁰ᵢ) × ∫₀¹ ∂F(x⁰+α(x−x⁰))/∂xᵢ dα',
  tex:'\\text{IG}_i(x) := (x_i-x_i^{0})\\times\\int_{0}^{1}\\frac{\\partial F\\big(x^{0}+\\alpha(x-x^{0})\\big)}{\\partial x_i}\\,d\\alpha',
  d:'특징 $i$ 의 귀속값. 기준선에서 입력까지의 직선 경로 $\\alpha\\in[0,1]$ 를 따라 경사를 적분한 뒤, 입력과 기준선의 차이로 스케일한다.'},
 {expr:'Σᵢ IntegratedGradsᵢ(x) = F(x) − F(x⁰)',
  tex:'\\sum_{i=1}^{n}\\text{IG}_i(x)=F(x)-F(x^{0})',
  d:'Completeness 공리. 모든 특징의 귀속값 합이 실제 점수 변화량과 정확히 일치한다 — 미적분 기본정리를 경로 적분에 적용한 결과다.'},
 {expr:'IntegratedGradsᵢ ≈ (xᵢ−x⁰ᵢ) × (1/m) Σₖ₌₁..ₘ ∂F(x⁰+(k/m)(x−x⁰))/∂xᵢ',
  tex:'\\text{IG}_i\\approx (x_i-x_i^{0})\\times\\frac{1}{m}\\sum_{k=1}^{m}\\frac{\\partial F\\big(x^{0}+\\frac{k}{m}(x-x^{0})\\big)}{\\partial x_i}',
  d:'실제 구현은 적분을 $m$개 구간의 리만 합으로 근사한다. 경사 연산 $m$번 호출로 끝나며, 경로 위 점들을 한 번에 배치 처리할 수 있다.'}
],

numbers:[
 {k:'적분 근사 스텝 수', v:'20~300', d:'대부분의 경우 이 범위면 적분값이 5% 오차 이내로 수렴한다고 보고'},
 {k:'비교 대상 · 네트워크 종류', v:'이미지 2 · 텍스트 2 · 화학 1', d:'GoogLeNet(ImageNet), 당뇨망막병증 예측망 등 서로 다른 5개 모델에 동일 기법을 그대로 적용해 구조 무관성을 실증'},
 {k:'사용 모델 · 사물 인식', v:'GoogLeNet / ImageNet', d:'가장 높은 점수를 받은 클래스에 대한 픽셀별 귀속을 시각화(그림 2)'},
 {k:'기준선 조건', v:'F(x⁰) ≈ 0', d:'이미지 모델의 검은 이미지처럼, 기준선에서의 예측이 거의 중립이어야 귀속이 해석 가능해진다'}
],

impact:'"어떤 설명이 더 좋은가"를 주관적 시각 비교가 아니라 **증명 가능한 성질**로 따질 수 있게 만들었다. Integrated Gradients는 구현이 단순해(경사 호출 반복뿐) 실무에 빠르게 퍼졌고, Captum·SHAP 등 해석 라이브러리의 표준 기법 중 하나가 됐다. 동시에 이 논문이 제시한 공리적 틀은 이후 귀속 방법을 설계할 때 "직관적으로 그럴듯한가"가 아니라 "어떤 공리를 만족하는가"를 먼저 따지는 관행을 만들었다.',

legacy:[
 '**공리적 설계의 표준화** — 이후 제안되는 귀속 방법들이 Sensitivity·Completeness·Implementation Invariance 같은 공리 충족 여부를 검증 항목으로 삼게 됐다',
 '**경로 방법(path method)이라는 범주** — 직선 경로가 유일한 선택이 아니라는 점에서 다른 경로를 쓰는 변형(Expected Gradients 등 여러 기준선의 평균을 쓰는 방법)들이 뒤이어 나왔다',
 '**기준선 의존성 문제의 재조명** — 이 논문 스스로 지적한 기준선 선택의 주관성이, 이후 "기준선을 어떻게 고를 것인가"라는 하위 연구 주제를 낳았다',
 '**개념 단위 해석으로의 전환** — 픽셀·경로 기반 귀속의 한계(사람이 이해하기 어려운 저수준 신호)를 넘어서려는 시도로 [TCAV](#/p/tcav)가 사람이 정의한 개념 단위 해석을 제안했다'
],

pitfalls:[
 '**기준선이 결과를 좌우한다.** 검은 이미지가 관용적으로 쓰이지만 유일한 정답이 아니며, 다른 기준선(회색·노이즈·데이터 평균)을 쓰면 귀속 지도가 달라진다. "기준선이 곧 없음(absence)"이라는 전제 자체가 항상 자명하지 않다.',
 '**적분 근사 스텝이 부족하면 Completeness가 깨진다.** 귀속값 합이 $F(x)-F(x^0)$ 과 크게 어긋나면 스텝 수 $m$ 이 부족하다는 신호이므로, 구현 시 반드시 이 합을 검산해야 한다.',
 '**직선 경로가 유일한 선택은 아니다.** Sensitivity·Implementation Invariance를 만족하는 경로 방법은 이론상 여럿(예: 곡선 경로) 가능하며, 이 논문은 직선 경로가 대칭성(symmetry-preserving)을 만족하는 유일한 선택임을 보이지만 그 대칭성 공리 자체를 반드시 받아들여야 하는 것은 아니다.'
],

figures:[
 {f:'fig2-comparison.png',
  cap:'왼쪽 두 열이 원본 이미지와 최고 점수 클래스, 오른쪽 두 열이 Integrated Gradients(왼쪽)와 단순 gradient×image(오른쪽) 시각화. 카메라·학교버스 예시에서 IG는 렌즈·라디에이터그릴처럼 클래스를 실제로 규정하는 부분에 집중하는 반면, 단순 경사×이미지는 배경까지 노이즈처럼 밝게 뜬다.',
  src:'원문 Figure 2, p.6 (좌측 절반)'}
],

quotes:[
 {t:'We identify two fundamental axioms—Sensitivity and Implementation Invariance that attribution methods ought to satisfy. We show that they are not satisfied by most known attribution methods.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1703.01365 — Axiomatic Attribution for Deep Networks', u:'https://arxiv.org/abs/1703.01365'},
 {t:'ankurtaly/Attributions (예제 코드)', u:'https://github.com/ankurtaly/Attributions'}
]
});
