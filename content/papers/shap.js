WIKI.paper({
slug:'shap',
venue:'NeurIPS 2017',
authors:'Lundberg & Lee (University of Washington)',
arxiv:'1705.07874',

tldr:'[LIME](#/p/lime)·DeepLIFT·layer-wise relevance propagation 등 서로 달라 보이는 특징 기여도 방법들이 사실은 **같은 종류의 근사**를 하고 있으며, 그 종류 안에서 세 가지 공리를 만족하는 해는 게임이론의 **Shapley 값 하나뿐**임을 증명한 논문.',

context:'2017년까지 특징 기여도(feature attribution) 방법은 [LIME](#/p/lime), DeepLIFT, layer-wise relevance propagation처럼 각자 다른 동기와 수식으로 제안되어 있었다. 문제는 이들 사이의 관계가 불분명했다는 것이다 — 같은 모델의 같은 예측에 대해 LIME과 DeepLIFT는 서로 다른 기여도 값을 내놓는데, 어느 쪽이 더 옳은지 판단할 기준이 없었다. 저자들은 이 방법들을 "additive feature attribution method"라는 공통 형식(가산적 선형 결합)으로 다시 쓸 수 있음을 보이고, 그 형식 안에서 어떤 성질을 요구해야 좋은 설명인지 공리로 정한다.',

ideas:[
 {h:'모든 방법을 하나의 형식으로 통일한다',
  lead:'LIME·DeepLIFT·LRP를 전부 $g(z\\prime) = \\phi_0 + \\sum \\phi_i z_i\\prime$ 형태로 다시 쓸 수 있다.',
  d:'서로 다른 동기로 제안된 6개 방법(Shapley regression/sampling values, Quantitative Input Influence, [LIME](#/p/lime), DeepLIFT, layer-wise relevance propagation)이 사실은 전부 이진 표현 $z\\prime$ 에 대한 가산적 선형 모델이라는 것을 보인다. 이 공통 형식으로 다시 쓰면, 방법들 사이의 차이는 결국 "가중치 $\\phi_i$ 를 어떻게 정하는가"라는 한 가지 질문으로 좁혀진다.'},
 {h:'세 공리가 해를 유일하게 결정한다',
  lead:'local accuracy·missingness·consistency, 이 세 성질을 동시에 만족하는 가산적 방법은 오직 하나뿐이다.',
  d:'**local accuracy**는 설명 모델의 합이 원래 모델의 출력과 정확히 같아야 한다는 것, **missingness**는 입력에 없는 특징의 기여도는 0이어야 한다는 것, **consistency**는 모델이 바뀌어 어떤 특징의 기여가 커지거나 그대로면 그 특징의 기여도가 줄어들면 안 된다는 것이다. Theorem 1은 이 세 조건을 만족하는 $\\phi_i$ 가 정확히 협조게임이론의 **Shapley 값**과 같다는 것을 증명한다. 즉 이 조건들을 받아들이면 선택의 여지가 없다.'},
 {h:'SHAP: 조건부 기댓값으로 정의한 Shapley 값',
  lead:'특징을 안다고 가정했을 때의 조건부 기댓값 $E[f(z)\\mid z_S]$ 차이를 모든 순서에 대해 평균한다.',
  d:'Shapley 값은 원래 "특징 부분집합 $S$ 에 그 특징을 추가했을 때 모델 출력이 얼마나 바뀌는가"를 모든 가능한 추가 순서에 대해 평균한 값이다. SHAP은 이 "부분집합만 안다"는 상태를 조건부 기댓값 $E[f(z) \\mid z_S]$ 로 구현해, 어떤 모델에도 적용 가능한 통일된 정의를 만든다. Figure 1처럼 기준값 $E[f(z)]$ 에서 시작해 특징을 하나씩 알아갈 때마다 예측이 이동하는 양이 그 특징의 $\\phi_i$ 다.'},
 {h:'Kernel SHAP: LIME의 커널을 고쳐서 Shapley 값을 복원한다',
  lead:'LIME과 같은 가중 선형회귀 형식에 **이론적으로 유도된 커널**을 쓰면 Shapley 값이 그대로 나온다.',
  d:'LIME은 근접도 커널 $\\pi_x$ 를 휴리스틱하게 고른다. Theorem 2는 그 대신 특정 형태의 커널 $\\pi_{x\\prime}(z\\prime)$ 을 쓰면 같은 가중 최소제곱 문제의 해가 정확히 Shapley 값이 됨을 보인다. 이 커널은 부분집합의 크기가 아주 작거나($|z\\prime|\\approx 0$) 아주 클 때($|z\\prime|\\approx M$) 무한대에 가까운 가중치를 주는데 — 즉 "거의 아무것도 모를 때"와 "거의 다 알 때"의 정보가 결정적이라는 뜻이다. LIME의 커널은 이런 모양을 따르지 않으므로 local accuracy와 consistency를 어길 수 있다.'},
 {h:'Deep SHAP: 구조를 이용한 빠른 근사',
  lead:'신경망을 작은 구성요소로 쪼개, 각 구성요소의 Shapley 값을 DeepLIFT 방식으로 역전파해 합성한다.',
  d:'딥러닝 모델은 선형·max·활성화 함수 같은 단순한 구성요소의 합성이다. 각 구성요소에 대해서는 Shapley 값을 해석적으로 빠르게 구할 수 있으므로, 이를 DeepLIFT의 연쇄법칙 스타일 역전파로 이어 붙이면 전체 네트워크에 대한 근사를 얻는다. 지수적으로 커지는 $2^M$ 항을 모델 구조를 이용해 우회하는 방식이다.'}
],

diagram:{type:'compare', cap:'같은 문제를 서로 다른 방식으로 근사한다 — SHAP은 그 근사들을 하나의 유일해로 통합한다.',
 left:{t:'LIME: 휴리스틱 근사', items:['국소 선형회귀로 근사','근접도 커널을 임의로 선택','local accuracy 보장 없음']},
 right:{t:'SHAP: 공리로 유도', items:['Shapley 커널로 같은 회귀를 풂','세 공리를 모두 충족','유일해임을 증명(Theorem 1)']}},

math:[
 {expr:'f(x) = g(x′) = φ₀ + Σ φᵢ x′ᵢ',
  tex:'f(x) = g(x\\prime) = \\phi_0 + \\sum_{i=1}^{M} \\phi_i x\\prime_i',
  d:'가산적 특징 기여도 방법의 공통 형식(local accuracy, Property 1). 기준값 $\\phi_0$ 에서 시작해 각 특징의 기여 $\\phi_i$ 를 더하면 원래 모델의 출력과 정확히 같아져야 한다.'},
 {expr:'φᵢ(f,x) = Σ_{z′⊆x′} |z′|!(M−|z′|−1)!/M! · [f_x(z′) − f_x(z′∖i)]',
  tex:'\\phi_i(f,x) = \\sum_{z\\prime \\subseteq x\\prime} \\frac{|z\\prime|!\\,(M-|z\\prime|-1)!}{M!}\\bigl[f_x(z\\prime) - f_x(z\\prime\\setminus i)\\bigr]',
  d:'Theorem 1의 유일해, 즉 Shapley 값. 특징 $i$ 를 이미 가진 모든 부분집합 $z\\prime$ 에 대해 "그 특징을 뺐을 때 예측이 얼마나 떨어지는가"를, 그 부분집합이 나올 수 있는 순서의 개수로 가중평균한 것이다.'}
],

numbers:[
 {k:'통합한 기존 방법 수', v:'6개', d:'Shapley regression/sampling values·Quantitative Input Influence·LIME·DeepLIFT·layer-wise relevance propagation'},
 {k:'공리 개수', v:'3개', d:'local accuracy · missingness · consistency — 이 셋을 동시에 만족하는 해가 유일함(Theorem 1)'},
 {k:'Kernel SHAP 복잡도', v:'O(2^M + M^3)', d:'특징 수 $M$ 이 작을 때는 실용적, 커지면 근사(Shapley sampling 등)가 필요'},
 {k:'Max SHAP 개선', v:'O(M^2)', d:'순진한 $O(M \\cdot 2^M)$ 대신 순열 확률로 계산해 max 함수의 Shapley 값을 구하는 시간'},
 {k:'모델별 근사 방법 수', v:'2개(model-agnostic) + 4개(model-specific)', d:'Kernel SHAP·Shapley sampling(모델 무관), Linear·Low-Order·Max·Deep SHAP(모델별)'}
],

impact:'SHAP 이후로 "왜 이 특징 기여도 방법이 저 방법보다 나은가"라는 질문에 임의의 직관이 아니라 **공리 위반 여부**로 답할 수 있게 됐다. [LIME](#/p/lime)의 커널 선택이 휴리스틱이었다는 것, DeepLIFT의 역전파 규칙이 참조값 선택에 따라 consistency를 어길 수 있다는 것이 이 논문에서 구체적으로 드러난다. 그 결과 SHAP은 게임이론이라는 이미 확립된 수학 위에 사후 설명(post-hoc explanation)을 올려놓은 첫 통합 시도가 되었고, 이후 `shap` 라이브러리는 정형 데이터·트리 모델·딥러닝 전반에서 사실상의 실무 표준 설명 도구가 되었다.',

legacy:[
 '**TreeSHAP으로 확장** — 후속 연구(Lundberg et al. 2020)가 트리 앙상블(XGBoost·LightGBM)에서 지수 시간 없이 정확한 Shapley 값을 다항 시간에 계산하는 방법을 제시하며 정형 데이터 실무의 기본값이 됨',
 '**LIME과의 공존** — 계산이 무거운 SHAP 대신 여전히 빠른 국소 근사가 필요한 경우 [LIME](#/p/lime)이 쓰이며, 두 방법은 경쟁이 아니라 정확도-속도 트레이드오프의 양 끝으로 자리잡음',
 '**공리적 접근의 한계 노출** — 조건부 기댓값 $E[f(z)\\mid z_S]$ 를 근사할 때 특징 간 상관관계를 어떻게 다룰지에 대한 논쟁(대체 특징 사용 시 비현실적인 입력 생성)이 뒤이어 제기됨',
 '**Attention 해석 논쟁과 별개 축** — SHAP·[Grad-CAM](#/p/grad-cam) 모두 사후 설명이라는 점에서, [attention 가중치 자체를 근거로 볼 수 있는가](#/p/attention-not-explanation)라는 별도의 논쟁과는 구분되는 축을 이룸'
],

pitfalls:[
 '**정확한 Shapley 값은 계산량이 $2^M$ 에 비례한다.** 특징이 많으면 Kernel SHAP도 결국 근사이며, "정확한 유일해"라는 이론적 우아함과 "실용적으로 근사한다"는 실제 구현 사이에는 여전히 간극이 있다.',
 '**조건부 기댓값 근사가 특징 독립을 가정하는 경우가 많다.** 실제로는 상관된 특징 조합(예: 존재하지 않는 조합)에 대해 모델을 평가하게 되어, 기여도가 모델이 실제로 학습한 것과 어긋날 수 있다.',
 '**"SHAP이 유일하게 옳다"는 세 공리를 받아들일 때만 성립한다.** consistency·missingness가 항상 바람직한 성질인지는 응용에 따라 다를 수 있고, 공리 자체를 재검토하는 후속 연구도 있다.'
],

figures:[
 {f:'fig1-additive.png',
  cap:'아무 정보도 없을 때의 기준 예측 $E[f(z)]$ 에서 시작해, 특징을 하나씩 알아갈 때마다($z_1=x_1$, 그다음 $z_{1,2}=x_{1,2}$…) 예측이 오른쪽(양의 기여, 파란 화살표) 또는 왼쪽(음의 기여, 빨간 화살표)으로 이동하는 양이 각 특징의 $\\phi_i$ 다. 이 그림은 특징을 더하는 한 가지 순서만 보여주며, 실제 SHAP 값은 모든 순서에 대한 평균이다.',
  src:'원문 Figure 1, p.5'},
 {f:'fig2-kernel.png',
  cap:'가로축은 부분집합 크기(카디널리티)별로 정렬한 샘플, 세로축은 그 샘플에 부여되는 가중치(로그 스케일). Shapley 커널(파란선)은 양 끝 — 거의 빈 집합이거나 거의 전체 집합 — 에서 급격히 커지는데, LIME이 쓰는 두 커널(초록 실선·점선)은 이런 모양을 따르지 않는다. 이 차이가 LIME이 Shapley 값과 다른 답을 내는 이유다.',
  src:'원문 Figure 2(A), p.7'}
],

quotes:[
 {t:'The new class unifies six existing methods, notable because several recent methods in the class lack the proposed desirable properties.',
  src:'Abstract, p.1'},
 {t:'Only one possible explanation model g follows Definition 1 and satisfies Properties 1, 2, and 3.',
  src:'Theorem 1, p.4'}
],

links:[
 {t:'arXiv 1705.07874 — A Unified Approach to Interpreting Model Predictions', u:'https://arxiv.org/abs/1705.07874'},
 {t:'shap (GitHub, slundberg)', u:'https://github.com/slundberg/shap'}
]
});
