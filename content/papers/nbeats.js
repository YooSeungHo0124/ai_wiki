WIKI.paper({
slug:'nbeats',
venue:'ICLR 2020',
authors:'Oreshkin, Carpov, Chapados, Bengio (Element AI)',
arxiv:'1905.10437',

tldr:'시계열에 특화된 구조(순환·합성곱·attention) 없이, **순수 완전연결(FC) 블록을 잔차로 깊게 쌓기만** 해서 M3·M4·TOURISM 통계 경진대회의 최상위 통계 기법들을 이긴 논문. 추세·계절성 기저를 넣으면 해석 가능한 변형도 된다.',

context:'2018년 열린 M4 competition은 10만 개 시계열에 대해 통계 기법과 머신러닝 기법을 정면으로 겨루게 했는데, 결과가 통계학 진영에 유리했다 — 순수 ML 방법 6개의 최종 순위는 23·37·38·48·54·57위에 그쳤고, 우승은 [DeepAR](#/p/deepar) 계열의 dilated LSTM과 고전적 Holt-Winters를 섞은 **하이브리드** 모델(Smyl)이었다. 이는 "딥러닝 단독으로는 통계 기법을 못 이긴다"는 통념을 굳혔다. 이 논문은 그 통념에 정면으로 묻는다 — 순수 딥러닝 구조만으로, 시계열 전용 성분(계절성 분해, 지수평활 초기화 등) 없이도 이길 수 있는가?',

ideas:[
 {h:'백캐스트-포캐스트 블록: 예측과 함께 입력을 재구성',
  lead:'각 블록이 미래(forecast)뿐 아니라 자신이 받은 과거 구간(backcast)도 함께 예측한다.',
  d:'블록은 입력 $x_\\ell$을 4개 FC+ReLU 층에 통과시켜 두 계수 $\\theta^b_\\ell, \\theta^f_\\ell$을 뽑고, 이를 기저 함수 $g^b, g^f$에 넣어 backcast $\\hat x_\\ell$과 forecast $\\hat y_\\ell$을 만든다. backcast는 "이 블록이 입력에서 설명할 수 있었던 부분"이고, 다음 블록은 그것을 뺀 나머지 $x_{\\ell+1} = x_\\ell - \\hat x_\\ell$만 받는다.'},
 {h:'이중 잔차 스태킹(doubly residual stacking)',
  lead:'backcast 잔차는 다음 블록으로, forecast는 스택 레벨에서 합산되는 두 개의 잔차 경로를 둔다.',
  d:'일반적인 ResNet은 잔차 경로가 하나지만, 여기서는 backcast 잔차 경로($x_\\ell \\to x_{\\ell+1}$)와 forecast 합산 경로($\\hat y = \\sum_\\ell \\hat y_\\ell$)를 분리한다. 앞 블록이 신호에서 설명하기 쉬운 부분을 제거해 갈수록 뒤 블록의 일이 쉬워지고, 각 블록의 부분 예측이 계층적으로 합산되어 그래디언트도 잘 흐른다.'},
 {h:'Generic 구성: 기저 자체도 학습',
  lead:'기저 함수 $g^b, g^f$를 고정하지 않고 선형 투영 행렬 자체를 학습시킨다.',
  d:'`generic` 구성은 $g^b_\\ell, g^f_\\ell$를 그냥 학습 가능한 선형 투영으로 둔다. 시계열 지식을 전혀 넣지 않은 가장 순수한 버전이며, 학습된 기저 파형에 특별한 구조가 나타나지 않아 해석은 불가능하지만 정확도는 가장 좋다(M4 sMAPE 11.168).'},
 {h:'Interpretable 구성: 추세·계절성 기저를 강제',
  lead:'기저 함수를 다항식(추세)과 푸리에급수(계절성)로 고정해 스택별 출력을 해석 가능하게 만든다.',
  d:'추세 스택은 저차 다항식 $\\sum_i \\theta_i t^i$로, 계절성 스택은 주기함수(푸리에 기저, $\\cos/\\sin$의 조합)로 $g$를 고정한다. 추세 스택을 먼저 통과시켜 신호에서 추세를 제거한 뒤 계절성 스택에 넘기므로, STL 같은 고전적 분해처럼 "이 부분은 추세, 이 부분은 계절성"이라고 나눠 읽을 수 있는 출력이 나온다.'},
 {h:'앙상블로 M4 우승팀 하이브리드를 능가',
  lead:'서로 다른 손실(sMAPE·MASE·MAPE)·입력 길이 배수로 학습한 180개 모델을 앙상블한다.',
  d:'M4 상위권은 전부 앙상블을 썼다. 이 논문도 손실 함수 3종 × 입력 윈도우 배수(2H~7H) × random seed 여러 개로 만든 다수의 모델을 median으로 앙상블해, 단일 모델보다 안정적으로 통계 최강자와 M4 우승팀을 앞선다.'}
],

diagram:{type:'stack', cap:'블록(왼쪽) 하나가 스택(가운데)을 이루고, 스택 여러 개가 쌓여 전체 예측을 합산한다(오른쪽). backcast 잔차가 다음 블록/스택으로 흐르는 것이 핵심.',
 layers:[
  {t:'입력 윈도우 x', s:'lookback nH'},
  {t:'FC × 4 (ReLU)', s:'블록 내부', acc:true, note:'θᵇ, θᶠ 계수 예측'},
  {t:'기저 gᵇ, gᶠ', s:'선형 또는 다항·푸리에'},
  {t:'backcast 잔차', s:'x - x̂ → 다음 블록', note:'이중 잔차 경로'},
  {t:'forecast 합산', s:'ŷ = Σ ŷ_ℓ', note:'스택·블록 전체 합'}
 ]},

math:[
 {expr:'x_ℓ = x_{ℓ-1} - x̂_{ℓ-1},   ŷ = Σ_ℓ ŷ_ℓ',
  tex:'\\mathbf{x}_\\ell = \\mathbf{x}_{\\ell-1} - \\widehat{\\mathbf{x}}_{\\ell-1}, \\qquad \\widehat{\\mathbf{y}} = \\sum_{\\ell} \\widehat{\\mathbf{y}}_\\ell',
  d:'이중 잔차 스태킹의 핵심 식. 각 블록이 설명한 backcast를 입력에서 빼서 다음 블록에 넘기고(위), 모든 블록의 forecast를 더해 최종 예측을 만든다(아래).'},
 {expr:'ŷ_ℓ = Σ_i θ^f_{ℓ,i} v^f_i,   x̂_ℓ = Σ_i θ^b_{ℓ,i} v^b_i',
  tex:'\\widehat{\\mathbf{y}}_\\ell = \\sum_{i=1}^{\\dim(\\theta^f_\\ell)} \\theta^f_{\\ell,i}\\, \\mathbf{v}^f_i, \\qquad \\widehat{\\mathbf{x}}_\\ell = \\sum_{i=1}^{\\dim(\\theta^b_\\ell)} \\theta^b_{\\ell,i}\\, \\mathbf{v}^b_i',
  d:'블록의 FC 서브네트워크가 만든 확장 계수 $\\theta$ 를, 기저 벡터 $v$ 로 선형결합해 실제 시계열 값으로 되돌린다. generic 구성은 $v$ 도 학습, interpretable 구성은 $v$ 를 다항식/푸리에 기저로 고정한다.'},
 {expr:'OWA = (1/2)·(sMAPE/sMAPE_Naive2 + MASE/MASE_Naive2)',
  tex:'\\text{OWA} = \\frac{1}{2}\\left(\\frac{\\text{sMAPE}}{\\text{sMAPE}_{\\text{Naive2}}} + \\frac{\\text{MASE}}{\\text{MASE}_{\\text{Naive2}}}\\right)',
  d:'M4 대회 공식 순위 지표. 계절성 조정 naive 예측 대비 상대 오차이며 1.0이 naive 수준, 낮을수록 좋다.'}
],

numbers:[
 {k:'M4 OWA (N-BEATS-I+G)', v:'0.795', d:'10만 개 시계열 평균, 앙상블 기준 (Table 1)'},
 {k:'M4 개선폭', v:'통계 벤치마크 대비 -11%, 최고 통계기법 대비 -7%, M4 우승팀 대비 -3%', d:'초록에 명시된 sMAPE 기준 상대 개선'},
 {k:'M4 sMAPE', v:'11.135 (I+G) / 11.168 (Generic) / 11.174 (Interpretable)', d:'세 구성 모두 통계 벤치마크(11.986)를 앞섬 (Table 1)'},
 {k:'M3 sMAPE', v:'12.37', d:'3,003개 시계열, 기존 최고 통계기법 Theta의 13.01보다 낮음 (Table 1)'},
 {k:'TOURISM MAPE', v:'18.47 (Generic)', d:'1,311개 관광 수요 시계열 (Table 1)'},
 {k:'블록 구조', v:'FC 4층 × 블록', d:'입력 길이는 forecast 길이 H의 2~7배(2H~7H)를 사용'}
],

impact:'"딥러닝은 시계열 통계기법을 못 이긴다"는 M4 대회의 결론을 뒤집었다 — attention도 순환도 없는 순수 FC 잔차 스택만으로 대회 우승 하이브리드 모델을 앞섰다는 것을 보여, 이후 시계열 딥러닝 연구가 구조적 정교함보다 **잔차 분해와 스케일 설계**에 주목하게 만들었다. Interpretable 구성은 딥러닝 예측을 추세·계절성으로 분해해 보여주는 실무적 관행을 정착시켰고, 이후 N-HiTS 등 N-BEATS 계열 확장으로 이어졌다.',

legacy:[
 '**"단순 구조로도 이긴다"는 선례** — 이후 [DLinear](#/p/dlinear)가 "선형 레이어 하나로도 이긴다"는 훨씬 더 급진적인 주장을 펼 때 참조하는 계보',
 '**해석 가능한 분해를 모델 안에 내장하는 관행** — [Autoformer](#/p/autoformer)의 series decomposition block도 같은 문제의식(추세/계절성을 아키텍처로 분리)의 연장선',
 '**M-시리즈 대회를 딥러닝 검증 무대로 재정착** — 이후 시계열 논문들이 M4/M3 벤치마크를 표준 비교 대상으로 계속 사용',
 '**N-HiTS 등 후속 확장** — 계층적 보간(multi-rate)을 추가해 장기 예측에서 더 확장한 후속 연구로 이어짐'
],

pitfalls:[
 '**"단변량 전용" 모델이다.** N-BEATS는 각 시계열을 그 자체 과거값만으로 예측하며, [DeepAR](#/p/deepar)처럼 여러 관련 시계열의 공변량이나 정적 특징을 직접 공유하는 구조가 아니다(전역 학습은 하지만 외부 공변량 입력 경로가 기본형엔 없다).',
 '**M4/M3는 대부분 짧은 시계열(수십~수백 시점)이다.** 이 결과를 [Informer](#/p/informer)·[Autoformer](#/p/autoformer)가 다루는 96~720 시점의 "장기 예측(long-horizon)" 벤치마크와 같은 선상에서 비교하면 안 된다 — 문제 설정 자체가 다르다.',
 '**Generic 구성의 기저는 정말로 해석 불가능하다.** 저자들도 "학습된 파형에 내재적 구조가 나타나지 않았다"고 명시한다 — 정확도가 가장 높은 구성을 고르면 해석 가능성을 포기하는 트레이드오프가 있다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽: 블록 하나의 내부(FC 4층 → θᵇ·θᶠ → 기저 gᵇ·gᶠ → backcast·forecast). 가운데: 블록들이 이중 잔차(⊖가 backcast 차감, 화살표 합류가 forecast 합산)로 이어진 스택. 오른쪽: 스택 M개가 같은 방식으로 다시 합산되어 최종 global forecast를 만든다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'We focus on solving the univariate times series point forecasting problem using deep learning and show that contrarily to received wisdom, deep learning primitives such as residual blocks are sufficient to design a state-of-the-art interpretable architecture.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1905.10437 — N-BEATS', u:'https://arxiv.org/abs/1905.10437'},
 {t:'M4 Competition 결과', u:'https://www.sciencedirect.com/science/article/pii/S0169207019301128'}
]
});
