WIKI.paper({
slug:'large-batch',
venue:'ICLR 2017',
authors:'Keskar, Mudigere, Nocedal, Smelyanskiy, Tang (Northwestern University · Intel)',
arxiv:'1609.04836',

tldr:'배치 크기를 키워 학습을 병렬화하면 훈련 정확도는 그대로인데 **테스트 정확도만 뚝 떨어지는** 일반화 격차가 생긴다는 것을 실험으로 확인하고, 그 원인을 손실 지형의 **sharp minima**(뾰족한 최솟값)로 지목했다. 이후 8년간 이어진 "왜 큰 배치는 일반화가 나쁜가" 논쟁의 시작점.',

context:'[SGD](#/p/adam)의 미니배치는 GPU 병렬화의 자연스러운 단위라, 배치를 키우면 한 스텝에서 더 많은 데이터를 동시에 처리해 학습을 가속할 수 있어 보인다. 그런데 실무자들은 오래전부터 배치를 키우면 같은 에폭 수를 학습해도 **테스트 정확도가 나빠진다**는 것을 경험적으로 알고 있었다. 문제는 이 격차의 원인이 불명확했다는 것이다 — 단순 과적합인지, 최적화가 나쁜 saddle point에 걸려서인지, 아니면 애초에 큰 배치와 작은 배치가 **질적으로 다른 해**에 도달하는지 구분이 안 됐다. 이 논문은 이 질문에 정면으로 답하는 최초의 체계적 실험 연구다.',

ideas:[
 {h:'배치를 키우면 훈련은 그대로, 테스트만 나빠진다',
  lead:'같은 아키텍처를 SB(소규모 배치)와 LB(전체의 10%)로 학습하면 훈련 정확도는 비슷한데 테스트 정확도만 벌어진다.',
  d:'6개 네트워크(완전연결 F1·F2, CNN C1~C4)에 [Adam](#/p/adam)을 소규모 배치(SB, 보통 256)와 큰 배치(LB, 학습 데이터의 10%)로 각각 학습시켰다. Table 2에서 훈련 정확도는 거의 항상 99% 이상으로 둘 다 비슷하지만, 테스트 정확도는 모든 네트워크에서 LB가 SB보다 낮다 — C1은 80.04%→77.26%, C3는 49.58%→46.45%. 저자들은 이 격차가 **과적합이 아니라고 강조**한다. 테스트 정확도 곡선이 정점을 찍고 내려가는 전형적 과적합 패턴이 아니라, 처음부터 낮은 지점에서 평평하게 수렴하기 때문이다.'},
 {h:'Sharp minima 가설',
  lead:'LB는 손실 곡면이 뾰족한(sharp) 최솟값으로, SB는 완만한(flat) 최솟값으로 수렴한다는 가설.',
  d:'저자들의 핵심 주장은 다음과 같다 — flat minimizer는 주변 넓은 영역에서 손실이 완만하게 유지되므로, 학습·테스트 데이터 분포가 살짝 어긋나도(shift) 손실이 크게 튀지 않는다. 반대로 sharp minimizer는 훈련 손실은 낮지만 아주 좁은 골짜기에 있어서, 테스트 분포로 살짝만 이동해도 손실이 급격히 커진다. 이를 최소 기술 길이(MDL) 이론으로도 정당화한다 — flat minimum은 낮은 정밀도로도 표현 가능해 **모델 복잡도가 낮다**는 것과 같고, 낮은 복잡도는 더 나은 일반화와 연결된다는 고전적 직관이다.'},
 {h:'Sharpness를 실측 가능한 지표로 정의',
  lead:'Hessian 전체를 구하는 대신, 해 주변 작은 상자에서 손실이 최대 얼마나 튀는지로 sharpness를 근사한다.',
  d:'딥러닝에서 Hessian 고윳값을 직접 계산하는 것은 비현실적이므로, 해 $x$ 주변의 제약 상자 $C_\\epsilon$ 안에서 손실을 최대화한 값과 $f(x)$ 의 차이를 정규화해 sharpness 지표 $\\phi_{x,f}$ 로 정의했다(Metric 2.1). 전체 공간뿐 아니라 무작위로 뽑은 100차원 부분공간에서도 같은 지표를 재보는데, 두 경우 모두 LB 해의 sharpness가 SB 해보다 **1~2 자릿수 크다**는 것을 Table 3·4로 확인했다.'},
 {h:'두 최솟값을 잇는 직선상의 손실 지형(parametric plot)',
  lead:'SB와 LB 해를 잇는 직선을 따라 손실을 그리면 LB 쪽 끝에서만 급격한 벽이 나타난다.',
  d:'SB 해 $x_s^*$ 와 LB 해 $x_\\ell^*$ 를 잇는 직선 위 점 $\\alpha x_\\ell^* + (1-\\alpha)x_s^*$ 에서 손실을 그리면(Figure 3), $\\alpha=0$(SB) 근처는 완만하고 $\\alpha=1$(LB) 근처에서 훈련·테스트 손실 모두 가파르게 치솟는 뾰족한 골짜기가 보인다. 이는 Goodfellow et al.의 시각화 기법을 두 해 사이에 적용한 것으로, sharpness 가설을 1차원 단면에서 직접 눈으로 보여준다.'},
 {h:'Gradient noise가 flat minimum으로 밀어낸다는 설명',
  lead:'소규모 배치의 잡음 섞인 gradient가 좁은 골짜기를 빠져나가게 만들어 결과적으로 넓은 minimum에 정착시킨다.',
  d:'SB는 배치마다 gradient 추정이 노이즈를 포함하므로, 학습 궤적이 sharp minimum의 좁은 attraction basin에 갇히지 않고 빠져나와(escape) 결국 더 넓은 flat minimum에 정착한다는 직관을 제시한다. 반대로 LB는 배치 크기가 특정 임계값(F2에서 약 15000)을 넘으면 gradient noise가 basin을 벗어날 만큼 충분치 않아 sharp minimum에 갇힌다. 이 절이 이후 [empirical-batch](#/p/empirical-batch)가 정량화하는 "gradient noise scale" 개념의 정성적 원형이다.'}
],

diagram:{type:'compare', cap:'같은 아키텍처·같은 데이터, 배치 크기만 다를 때 저자들이 관찰한 대조. 훈련 정확도는 거의 같은데 테스트만 갈린다는 것이 핵심.',
 left:{t:'소규모 배치(SB)', items:['gradient에 노이즈 많음','flat minimum에 정착','테스트 정확도 높음']},
 right:{t:'큰 배치(LB, 10%)', items:['gradient 노이즈 적음','sharp minimum에 정착','테스트 정확도 낮음']}},

math:[
 {expr:'φ_x,f(ε, A) = [ max_{y∈C_ε} f(x+Ay) − f(x) ] / (1+f(x)) × 100',
  tex:'\\varphi_{x,f}(\\epsilon, A) \\;=\\; \\frac{\\max_{y\\in C_{\\epsilon}} f(x+Ay) - f(x)}{1+f(x)} \\times 100',
  d:'sharpness 지표(Metric 2.1). $A$ 는 부분공간을 고르는 랜덤 투영 행렬, $C_\\epsilon$ 은 해 주변의 상자. $A=I$ 이면 전체 공간, 아니면 무작위 100차원 부분공간에서 잰다. 값이 클수록 해 주변에서 손실이 쉽게 튄다는 뜻.'},
 {expr:'C_ε = { z ∈ R^p : −ε(|(A⁺x)_i|+1) ≤ z_i ≤ ε(|(A⁺x)_i|+1) }',
  tex:'C_{\\epsilon} = \\{\\, z \\in \\mathbb{R}^{p} : -\\epsilon\\big(|(A^{+}x)_i|+1\\big) \\le z_i \\le \\epsilon\\big(|(A^{+}x)_i|+1\\big) \\,\\}',
  d:'상자의 크기를 해 $x$ 자체의 성분 크기에 비례시켜, 파라미터 스케일이 달라도 sharpness 비교가 공정하도록 정규화한다.'},
 {expr:'f(α x*_ℓ + (1−α) x*_s), α ∈ [−1, 2]',
  tex:'f\\big(\\alpha\\, x_{\\ell}^{*} + (1-\\alpha)\\, x_{s}^{*}\\big),\\qquad \\alpha \\in [-1, 2]',
  d:'SB 해($\\alpha=0$)와 LB 해($\\alpha=1$)를 잇는 직선상의 손실 단면. $\\alpha$가 1을 넘어 LB 쪽으로 더 가면 손실이 급격히 커지는 비대칭이 sharp minimum의 시각적 증거다.'}
],

numbers:[
 {k:'LB 배치 크기', v:'학습 데이터의 10%', d:'SB는 256(고정) — 두 값 모두 6개 네트워크 전체에 동일 적용'},
 {k:'C1 테스트 정확도', v:'80.04% (SB) → 77.26% (LB)', d:'훈련 정확도는 99.89%·99.66%로 거의 동일'},
 {k:'C3 테스트 정확도', v:'49.58% (SB) → 46.45% (LB)', d:'6개 네트워크 중 격차가 뚜렷한 예'},
 {k:'sharpness 차이', v:'1~2 자릿수', d:'전체공간·100차원 무작위 부분공간 모두에서 LB가 SB보다 훨씬 큼(Table 3·4)'},
 {k:'부분공간 차원 p', v:'100', d:'sharpness 측정 시 사용한 무작위 투영 차원'},
 {k:'F2·C1 임계 배치 크기', v:'≈15,000', d:'이 값을 넘으면 sharpness가 급격히 커지는 문턱이 관찰됨(Figure 4)'}
],

impact:'"큰 배치=나쁜 일반화"라는 실무 관찰에 처음으로 실험적 근거와 sharp/flat minima라는 설명 틀을 제공했다. 이후 대규모 분산 학습을 시도하는 모든 연구가 이 논문을 배치 크기 확장의 한계로 인용하게 됐고, 이는 곧 배치를 키우면서도 일반화를 지키는 방법(학습률 스케일링·warmup)을 찾는 [lr-scaling](#/p/lr-scaling) 같은 후속 연구의 동기가 됐다. 다만 이 논문의 sharp minima 설명 자체는 이후 논쟁의 대상이 됐다 — 특히 신경망의 재매개변수화(reparametrization) 아래에서 sharpness 값 자체가 임의로 바뀔 수 있다는 반박이 나오며, "sharp/flat"이라는 개념이 관측(scale-dependent)에 불과할 수 있다는 지적이 이어졌다.',

legacy:[
 '**[lr-scaling](#/p/lr-scaling)의 직접적 동기** — 큰 배치의 일반화 격차를 학습률 선형 스케일링 + warmup으로 메울 수 있음을 보이며 이 논문의 우려를 상당 부분 반박',
 '**[empirical-batch](#/p/empirical-batch)의 정량화** — "gradient noise가 flat minimum으로 이끈다"는 정성적 설명을, gradient noise scale이라는 측정 가능한 양으로 대체해 임계 배치 크기를 예측',
 '**sharpness 정의 자체에 대한 반박 촉발** — Dinh et al.(2017) 등이 ReLU 네트워크의 스케일 불변성 때문에 sharpness 지표가 재매개변수화에 취약함을 지적하며 이론적 지위가 흔들림',
 '**flat minima를 겨냥한 최적화 기법 계열** — SAM(Sharpness-Aware Minimization) 등 손실 곡면의 평탄함을 직접 최적화 목표에 넣는 후속 연구로 이어짐'
],

pitfalls:[
 '**"큰 배치는 항상 일반화가 나쁘다"는 최종 결론이 아니다.** 이 논문 이후 [lr-scaling](#/p/lr-scaling)이 학습률·warmup을 함께 조정하면 배치 8000 이상에서도 정확도를 거의 유지할 수 있음을 보였다 — 배치 크기 하나만의 문제가 아니라 **하이퍼파라미터 전체를 함께 조정했는가**의 문제였다.',
 '**sharpness 지표는 재매개변수화에 불변이 아니다.** 같은 함수를 표현하는 다른 가중치 스케일링(예: ReLU 층의 양쪽에 $c$, $1/c$를 곱하는 변환)에서 이 논문의 sharpness 값이 임의로 바뀔 수 있다는 지적이 나왔다 — sharp/flat이 물리적 실재라기보다 측정 방식에 의존한다는 반박.',
 '**저자들 스스로도 "완전한 해법이 아니다"라고 명시했다.** data augmentation·conservative training·adversarial training으로 격차를 줄일 수는 있지만 sharpness 자체는 남는다고 부록에서 인정한다 — 문제를 처음 정식화한 논문이지, 원인을 확정한 논문은 아니다.'
],

figures:[
 {f:'fig1-flat-sharp.png',
  cap:'가로축이 파라미터, 세로축이 손실값인 개념도. 검은 실선(Training Function)의 왼쪽 골짜기가 넓고 완만한 Flat Minimum, 오른쪽이 좁고 가파른 Sharp Minimum. 빨간 점선(Testing Function)이 학습 곡선에서 살짝 이동했을 때, flat minimum 위치에서는 두 곡선의 손실 차이가 작지만 sharp minimum 위치에서는 훈련 손실은 여전히 낮은데 테스트 손실만 급격히 치솟는다 — 이 그림이 논문 주장의 요약이다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig3-parametric-c1.png',
  cap:'C1 네트워크에서 SB 해($\\alpha=0$)와 LB 해($\\alpha=1$)를 잇는 직선을 따라 그린 손실(파랑, 왼쪽 축)과 정확도(빨강, 오른쪽 축). $\\alpha$가 1을 넘어 LB 쪽으로 더 가면 손실이 급격히 치솟고 정확도가 급락한다 — LB 해가 좁고 가파른 골짜기 안에 있다는 직접 증거.',
  src:'원문 Figure 3(c), p.6'}
],

quotes:[
 {t:'The lack of generalization ability is due to the fact that large-batch methods tend to converge to sharp minimizers of the training function.',
  src:'Section 2, p.3'},
 {t:'We emphasize that the generalization gap is not due to over-fitting or over-training as commonly observed in statistics.',
  src:'Section 2.1, p.5'}
],

links:[
 {t:'arXiv 1609.04836 — On Large-Batch Training for Deep Learning', u:'https://arxiv.org/abs/1609.04836'},
 {t:'OpenReview (ICLR 2017)', u:'https://openreview.net/forum?id=H1oyRlYgg'}
]
});
