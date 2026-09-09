WIKI.paper({
slug:'lime',
venue:'KDD 2016',
authors:'Ribeiro, Singh & Guestrin (University of Washington)',
arxiv:'1602.04938',

tldr:'모델 내부를 전혀 몰라도, 예측 하나 주변만 국소적으로 선형 모델로 근사하면 "왜 이렇게 예측했는가"를 설명할 수 있다는 것을 보인 논문. **모델 무관(model-agnostic)** 설명가능성이라는 트랙을 열었다.',

context:'2016년까지 해석 가능성 논의는 대체로 두 갈래였다. 하나는 [역전파](#/p/backprop)의 gradient를 직접 들여다보는 방법으로, 미분 가능한 모델에서만 쓸 수 있고 신뢰도 높은 예측에서는 gradient가 0에 가까워 해석이 어렵다. 다른 하나는 애초에 선형 모델·결정 트리처럼 **내재적으로 해석 가능한 모델**만 쓰자는 입장인데, 정확도를 포기해야 한다. 실무에서는 랜덤포레스트·SVM·신경망처럼 정확하지만 불투명한 모델을 그대로 블랙박스로 배포해야 하는 경우가 대부분이었다. 저자들은 검증 데이터의 정확도만으로는 신뢰할 수 없다는 점을 지적한다 — held-out 정확도가 94%인 분류기가 실제로는 `Posting`, `Host` 같은 무의미한 토큰으로 예측하고 있을 수 있다.',

ideas:[
 {h:'모델을 열지 않고 주변만 흔들어 본다',
  lead:'설명 대상 $x$ 주변을 무작위로 교란해 만든 데이터로 블랙박스를 다시 질의한다.',
  d:'LIME은 분류기 $f$ 를 $f:\\mathbb{R}^d \\to \\mathbb{R}$ 형태의 블랙박스로만 다룬다. 내부 가중치나 구조는 보지 않고, 설명할 인스턴스 $x$ 근처에서 입력을 조금씩 지우거나 바꾼 샘플 $z$ 를 만들어 $f(z)$ 를 관찰한다. 텍스트라면 단어를 무작위로 지우고, 이미지라면 superpixel을 회색으로 지운다. 모델이 무엇이든 이 절차는 똑같이 적용되므로 **model-agnostic**하다.'},
 {h:'국소 충실도: 전역이 아니라 그 주변만 맞으면 된다',
  lead:'설명이 전역적으로 옳을 필요는 없고, $x$ 주변에서만 $f$ 의 행동과 일치하면 된다.',
  d:'논문은 "local fidelity는 global fidelity를 함의하지 않는다"는 점을 명시한다. 전역적으로 중요한 특징이 국소적으로는 무의미할 수 있고 그 반대도 성립한다. 그래서 근접도 함수 $\\pi_x(z)$ 로 $x$ 에 가까운 샘플일수록 손실에 더 크게 반영되게 가중치를 준다 — 멀리 있는 샘플은 흐리게, 가까운 샘플은 진하게 취급하는 식이다.'},
 {h:'해석 가능한 표현으로 바꾼 뒤 sparse linear로 맞춘다',
  lead:'원래 특징 공간이 아니라 사람이 읽을 수 있는 이진 표현 위에서 K-Lasso로 근사한다.',
  d:'모델이 실제로 쓰는 특징(단어 임베딩, 픽셀 텐서)은 사람이 읽기 어렵다. 그래서 "이 단어가 있다/없다", "이 superpixel이 있다/없다"는 이진 벡터 $x\\prime \\in \\{0,1\\}^{d\\prime}$ 를 별도로 두고, 그 위에서 비영 가중치가 $K$ 개 이하인 선형 모델을 Lasso로 찾는다(K-LASSO). 결과는 "이 $K$ 개 단어가 이 방향으로 기여했다"는 사람이 읽을 수 있는 설명이다.'},
 {h:'SP-LIME: 어떤 예측을 보여줄지도 고른다',
  lead:'개별 설명을 넘어, 모델 전체를 대표하는 인스턴스 집합을 submodular 최적화로 고른다.',
  d:'예측 하나의 설명만으로는 모델 전체를 신뢰할 근거가 안 된다. 그래서 여러 인스턴스의 설명이 겹치지 않고 서로 다른 특징을 커버하도록 고르는 submodular pick(SP) 알고리즘을 함께 제안한다. **탐욕적으로 커버리지를 최대화**하는 방식이라 무작위로 고르는 것보다 사용자가 더 나은 모델을 골라내게 만든다(실험에서 정량적으로 확인됨).'}
],

diagram:{type:'flow', cap:'설명 하나를 만드는 절차. 모델 f 는 끝까지 블랙박스로 남는다.',
 nodes:[
  {t:'인스턴스 x', s:'설명 대상'},
  {t:'주변 교란', s:'단어/superpixel 삭제'},
  {t:'블랙박스 질의', s:'f(z) 관찰', acc:true},
  {t:'근접도 가중', s:'π_x(z)'},
  {t:'K-Lasso 적합', s:'sparse linear g'}
 ]},

math:[
 {expr:'ξ(x) = argmin_g L(f, g, π_x) + Ω(g)',
  tex:'\\xi(x) = \\underset{g \\in G}{\\text{argmin}}\\; \\mathcal{L}(f, g, \\pi_x) + \\Omega(g)',
  d:'설명 $\\xi(x)$ 는 국소 불충실도 $\\mathcal{L}$ 과 설명의 복잡도 $\\Omega(g)$ 를 함께 최소화하는 해석 가능 모델 $g$ 다. 둘 사이의 트레이드오프가 이 식 하나에 들어있다.'},
 {expr:'L(f, g, π_x) = Σ_{z,z′∈Z} π_x(z) (f(z) − g(z′))²',
  tex:'\\mathcal{L}(f,g,\\pi_x) = \\sum_{z,z\\prime \\in Z} \\pi_x(z)\\,\\bigl(f(z) - g(z\\prime)\\bigr)^2',
  d:'국소적으로 가중된 최소제곱. $\\pi_x(z) = \\exp(-D(x,z)^2/\\sigma^2)$ 로, $x$ 에서 멀어질수록 그 샘플의 오차가 손실에 덜 반영된다.'}
],

numbers:[
 {k:'허스키 대 늑대 신뢰도(설명 전)', v:'10/27명 신뢰', d:'눈 배경으로만 판단하는 나쁜 분류기를 진짜라고 믿음'},
 {k:'허스키 대 늑대 신뢰도(설명 후)', v:'3/27명 신뢰', d:'superpixel 설명을 보자 대부분 눈을 근거로 지목한 오류를 알아챔'},
 {k:'눈 배경을 특징으로 지목', v:'12/27 → 25/27', d:'같은 실험, 설명 전후 비교'},
 {k:'분류기 정확도(원본 vs 정제)', v:'94.0% vs 88.6%', d:'held-out 정확도는 더 높지만 실제로는 스푸리어스 상관에 의존하는 사례'},
 {k:'설명 1건 계산 시간', v:'RF 3초 / Inception 10분', d:'랜덤포레스트 5000샘플 vs 딥넷 이미지 1건'},
 {k:'SP-LIME 정확도', v:'89.0%', d:'무작위 pick(75.0%) 대비 사용자가 더 나은 분류기를 고름'}
],

impact:'LIME은 "설명 가능성 = 특정 아키텍처의 부산물"이라는 가정을 깼다. 그래프 형태의 모델이든, 텐서 연산이든, 예측 함수만 호출할 수 있으면 똑같은 절차로 설명을 만들 수 있다는 것을 보였기 때문이다. 이후 사후 설명(post-hoc explanation) 연구 전체가 "국소 근사"라는 이 틀 위에서 갈라져 나왔고, [SHAP](#/p/shap)은 이 틀을 게임이론으로 통합해 재정의한다. 다만 저자들 스스로도 인정하듯, 설명 자체는 근사이므로 원래 모델의 결정 경계가 국소적으로도 심하게 비선형이면 설명이 부정확해질 수 있다.',

legacy:[
 '**게임이론적 통합** — [SHAP](#/p/shap)이 LIME을 포함한 여러 방법을 하나의 공리적 프레임워크(additive feature attribution)로 재구성',
 '**비전으로의 분화** — 이미지에서는 gradient 기반의 [Grad-CAM](#/p/grad-cam)이 훨씬 빠른 대안으로 자리잡음(LIME은 Inception 한 장에 10분이 걸린다는 한계)',
 '**국소 설명 대 인과성 논쟁** — perturbation 기반 설명이 실제 인과적 기여를 반영하는지에 대한 회의론이 뒤이어 [Attention is not Explanation](#/p/attention-not-explanation) 같은 반증 연구로 이어짐',
 '**실무 표준화** — scikit-learn 생태계에 `lime` 패키지로 편입되어, 딥러닝 이전부터 이어진 "왜 그렇게 예측했나"라는 질문에 대한 사실상의 실무 기본값이 됨'
],

pitfalls:[
 '**설명은 근사이지 모델의 실제 내부 계산이 아니다.** 국소적으로도 결정 경계가 심하게 비틀려 있으면(Figure 3의 배경처럼) 선형 근사가 그 자리에서만 우연히 맞을 수 있다.',
 '**perturbation 방식(무엇을 지우고 무엇을 남길지)이 설명을 좌우한다.** 텍스트는 단어 삭제, 이미지는 superpixel 삭제인데 이 선택 자체가 설명의 결과를 바꾸므로, 같은 모델도 perturbation 설계가 다르면 다른 설명이 나올 수 있다.',
 '**"model-agnostic"이 "항상 빠르다"는 뜻은 아니다.** 예측 함수를 매번 수천 번 다시 호출해야 하므로, 딥러닝 이미지 모델 한 장 설명에 10분이 걸린 사례처럼 실시간 서비스에는 부적합할 수 있다.'
],

figures:[
 {f:'fig3-intuition.png',
  cap:'파란/분홍 배경이 실제 블랙박스의 (알 수 없는) 결정 경계, 굵은 빨간 십자가 설명 대상 $x$. LIME이 뽑은 샘플(원의 크기가 $x$ 와의 근접도 가중치)로 점선(=국소 선형 근사)을 맞춘다 — 전역적으로는 완전히 틀렸지만 $x$ 주변에서는 경계와 거의 일치한다.',
  src:'원문 Figure 3, p.4'},
 {f:'fig11-husky-wolf.png',
  cap:'왼쪽은 눈 배경 때문에 "늑대"로 오분류된 허스키 원본, 오른쪽은 LIME이 지목한 근거 superpixel. 실제로 강조된 영역이 개가 아니라 배경의 눈이라는 점이 한눈에 드러난다 — 분류기가 동물이 아니라 날씨를 보고 있었다는 증거.',
  src:'원문 Figure 11, p.9'}
],

quotes:[
 {t:'We argue that explaining predictions is an important aspect in getting humans to trust and use machine learning effectively, if the explanations are faithful and intelligible.',
  src:'Section 2, p.1'},
 {t:'The classifier predicts “Wolf” if there is snow (or light background at the bottom), and “Husky” otherwise, regardless of animal color, position, pose, etc.',
  src:'Section 6.4, p.9'}
],

links:[
 {t:'arXiv 1602.04938 — "Why Should I Trust You?"', u:'https://arxiv.org/abs/1602.04938'},
 {t:'lime (GitHub, marcotcr)', u:'https://github.com/marcotcr/lime'}
]
});
