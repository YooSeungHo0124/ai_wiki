WIKI.paper({
slug:'msp-baseline',
venue:'ICLR 2017',
authors:'Hendrycks & Gimpel (UC Berkeley · TTI-Chicago)',
arxiv:'1610.02136',

tldr:'오분류·out-of-distribution(OOD) 탐지에 **소프트맥스 최댓값(MSP)** 하나만 쓰는 극도로 단순한 기준선을 세우고, 비전·NLP·음성 전반에서 "맞은 예측은 확신도가 높고 틀린·이상한 예측은 낮다"는 경향을 수치로 보였다. 이후 이 분야의 모든 새 방법은 이 baseline을 이기는 것으로 평가된다.',

context:'2016년 무렵 신경망이 실제 서비스에 배포되면서, 학습·시험 분포가 다를 때 **조용히 틀리는** 문제가 드러났다. [FGSM](#/p/fgsm) 같은 적대적 예시 연구가 "높은 확신으로 완전히 틀린 예측"을 만들 수 있음을 보였고, 안전성 논의(Amodei et al. 2016)에서도 모델이 자기 실수를 아는지가 핵심 쟁점이 되었다. 그런데 정작 "모델이 이 입력을 얼마나 확신하는가"를 잴 표준 절차도, 표준 평가지표도, 표준 데이터셋 구성도 없었다. 이 논문은 새 알고리즘을 내놓기 전에 **문제 자체를 정의**한다 — 무엇을 어떻게 측정할 것인가.',

ideas:[
 {h:'소프트맥스 최댓값(MSP)을 그대로 점수로 쓴다',
  lead:'추가 학습도 구조 변경도 없이, softmax 출력의 최댓값을 신뢰도 점수로 사용한다.',
  d:'분류기가 이미 뱉고 있는 $\\max_i S_i(x)$ 를 신뢰도 점수로 그대로 쓴다. 맞게 분류된 예시일수록, 그리고 학습 분포 안의 예시일수록 이 값이 크다는 경험적 경향을 여러 도메인에서 확인한다. 새 모듈이 전혀 없다는 것 자체가 baseline으로서의 강점이다 — 이보다 못하면 그 방법은 쓸 이유가 없다.'},
 {h:'오분류 탐지와 OOD 탐지를 같은 틀로 묶는다',
  lead:'"이 예측이 틀렸을 확률"과 "이 입력이 학습 분포 밖일 확률"을 같은 점수·같은 지표로 평가한다.',
  d:'두 문제 모두 본질적으로 "모델이 지금 신뢰할 만한가"를 이진 판별하는 문제로 정식화된다. 오분류 탐지는 같은 분포 안에서 맞음/틀림을 가르고, OOD 탐지는 in-distribution/out-of-distribution을 가른다 — 점수 함수도 평가 방식도 공유할 수 있다는 것이 이 논문의 틀 정리다.'},
 {h:'AUROC·AUPR로 임계값 선택 문제를 피한다',
  lead:'특정 threshold 하나를 고르지 않고 ROC·PR 곡선 아래 면적으로 threshold-독립적 성능을 잰다.',
  d:'AUROC는 무작위로 뽑은 양성 예시가 음성 예시보다 높은 점수를 받을 확률이며, 무작위 분류기는 50%다. AUPR은 양성/음성 비율이 극단적으로 다를 때(OOD 예시가 희귀할 때) AUROC보다 정보량이 크며, 완벽한 분류기는 100%다. 양쪽 클래스를 번갈아 양성으로 놓고 AUPR-In/AUPR-Out을 모두 보고하는 관행도 이 논문에서 정착됐다.'},
 {h:'놀랍도록 높은 확신을 보이는 무작위 잡음',
  lead:'MNIST 분류기에 가우시안 잡음을 넣으면 평균 91% 확신으로 특정 클래스를 예측한다.',
  d:'소프트맥스가 지수함수 기반이라 로짓의 사소한 차이도 극단적인 확률 분포로 증폭된다. 그 결과 완전히 무의미한 입력에도 소프트맥스는 거의 균등분포가 아니라 한쪽으로 쏠린 분포를 낸다 — "소프트맥스 확률 = 모델 확신"이라는 통념이 왜 위험한지를 보여주는 핵심 관찰이다.'},
 {h:'보조 디코더로 만든 abnormality module',
  lead:'baseline을 능가하는 두 번째 방법으로, 재구성 오차 기반의 별도 이상탐지 모듈을 제안한다.',
  d:'분류기에 입력을 복원하는 보조 디코더를 붙이고, 디코더의 내부 표현에 깨끗한 예시/잡음 섞인 예시를 구분하도록 작은 모듈을 추가로 학습시킨다. 일부 과제에서 MSP baseline을 능가하지만 모든 과제에서 그런 것은 아니며, 저자들 스스로 "향후 연구의 여지"로 제시한다.'}
],

diagram:{type:'flow', cap:'MSP baseline의 전체 파이프라인 — 기존 분류기에 아무것도 더하지 않는다.',
 nodes:[
  {t:'입력 x', s:'이미지/텍스트/음성'},
  {t:'기존 분류기', s:'재학습 없음'},
  {t:'소프트맥스 출력', s:'S(x), K차원'},
  {t:'최댓값 취함', s:'max_i S_i(x)', acc:true},
  {t:'AUROC·AUPR', s:'오분류/OOD 판별'}
 ]},

math:[
 {expr:'confidence(x) = max_i S_i(x)',
  tex:'\\text{score}(x) = \\max_i S_i(x)',
  d:'$S(x)$ 는 소프트맥스 출력 벡터. 이 스칼라 하나가 baseline의 전부다 — 별도 학습 파라미터가 없다.'},
 {expr:'AUROC = P(score(양성) > score(음성))',
  tex:'\\text{AUROC} = P\\big(\\text{score}(x^{+}) > \\text{score}(x^{-})\\big)',
  d:'무작위로 뽑은 양성(정답/in-distribution) 예시의 점수가 음성 예시의 점수보다 클 확률. 무작위 분류기는 50%, 완벽한 분류기는 100%.'}
],

numbers:[
 {k:'MNIST 잡음 확신도', v:'91%', d:'가우시안 잡음 입력에 대한 평균 예측 확률 — 소프트맥스가 확신을 과장한다는 핵심 증거'},
 {k:'CIFAR-10 오분류 탐지 AUROC', v:'93 / 50', d:'baseline(무작위) 대비 — 40-4 wide [ResNet](#/p/resnet)으로 측정'},
 {k:'CIFAR-100 오분류 탐지 AUROC', v:'87 / 50', d:'클래스가 늘수록(100개) 오분류 탐지가 더 어려워짐'},
 {k:'CIFAR-10 / SUN OOD AUROC', v:'95 / 50', d:'서로 다른 이미지 데이터셋 쌍의 OOD 탐지 성능'},
 {k:'MNIST 오분류 시 평균 확신도', v:'86%', d:'"틀렸는데도 86% 확신"이라는 값 자체가 소프트맥스 확률의 한계를 보여줌'}
],

impact:'이 논문의 진짜 기여는 알고리즘이 아니라 **측정법의 표준화**다. AUROC/AUPR로 threshold-독립적으로 평가하는 관행, in/out 데이터셋 쌍을 명시하는 관행, "baseline을 이겼는가"를 보고하는 관행이 모두 여기서 시작했다. 이후 나온 [ODIN](#/p/odin), [temperature-scaling](#/p/temperature-scaling), [deep-ensembles](#/p/deep-ensembles) 모두 이 논문의 평가 프로토콜 위에서 수치를 비교한다. 가장 중요한 교훈은 "아무것도 안 해도(MSP) 꽤 잘 된다"는 것 — 새 방법이 baseline보다 얼마나 나은지가 이 분야 논문의 공통 질문이 됐다.',

legacy:[
 '**ODIN** — 온도 스케일링과 입력 섭동을 더해 MSP baseline의 in/out 분리를 정면으로 키운 후속작. [ODIN](#/p/odin) 참고',
 '**보정 연구와의 접점** — [temperature-scaling](#/p/temperature-scaling)이 지적한 "소프트맥스는 보정되어 있지 않다"는 문제의식이 이 논문의 관찰과 정확히 겹친다',
 '**OOD 벤치마크 관행 정착** — in-distribution/out-of-distribution 데이터셋 쌍을 명시하고 AUROC·AUPR로 보고하는 형식이 이후 수백 편의 논문에서 그대로 반복된다',
 '**에너지·거리 기반 후속 점수** — MSP 대신 로짓의 log-sum-exp("에너지"), 특징 공간 거리(Mahalanobis) 등을 쓰는 후속 연구들이 모두 이 baseline을 출발점이자 비교 대상으로 삼는다'
],

pitfalls:[
 '**"AUROC 95%"가 절대적 성능이 아니다.** 어떤 in-distribution/out-distribution 데이터셋 쌍을 썼는지에 따라 수치가 크게 흔들린다 — CIFAR-10/Gaussian(97)과 CIFAR-100/SUN(91)처럼 같은 방법도 짝에 따라 갈린다.',
 '**소프트맥스 확률 자체를 "확신도"로 오해하면 안 된다.** 이 논문의 핵심 관찰이 바로 그 반례(무작위 잡음 91% 확신)이며, MSP baseline이 쓰는 것은 확률값 자체가 아니라 "맞았을 때와 틀렸을 때 최댓값의 상대적 차이"라는 경향성이다.',
 '**abnormality module(보조 디코더)은 일부 과제에서만 baseline을 이긴다.** 모든 실험에서 우월한 것이 아니므로, 이 논문을 "MSP보다 항상 나은 방법을 제시했다"로 요약하면 틀린다.'
],

quotes:[
 {t:'Correctly classified examples tend to have greater maximum softmax probabilities than erroneously classified and out-of-distribution examples, allowing for their detection.',
  src:'Abstract, p.1'},
 {t:'Indeed, random Gaussian noise fed into an MNIST image classifier gives a "prediction confidence" or predicted class probability of 91%, as we show later.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 1610.02136 — A Baseline for Detecting Misclassified and OOD Examples', u:'https://arxiv.org/abs/1610.02136'},
 {t:'Code — github.com/hendrycks/error-detection', u:'https://github.com/hendrycks/error-detection'}
]
});
