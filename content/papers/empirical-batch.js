WIKI.paper({
slug:'empirical-batch',
venue:'arXiv 2018 (OpenAI)',
authors:'McCandlish, Kaplan, Amodei et al. (OpenAI)',
arxiv:'1812.06162',

tldr:'데이터 병렬화로 배치를 아무리 키워도 어느 지점부터는 학습 속도가 늘지 않는다는 것을, **gradient noise scale**이라는 딱 하나의 통계량으로 예측할 수 있음을 보인 논문. MNIST부터 5v5 Dota까지 8개 과제에서 이 예측이 실제로 맞아떨어졌다.',

context:'2018년 무렵 ImageNet은 batch 64K, Dota 에이전트는 timestep 백만 단위로 학습된다는 보고가 이미 나와 있었지만, **왜 어떤 과제는 배치를 이렇게까지 키울 수 있고 어떤 과제는 안 되는지** 설명하는 이론이 없었다. 실무자는 그냥 배치를 바꿔가며 실험할 뿐이었고, 그 결과 최적 배치가 몇 년씩 과소평가되는 일도 있었다(Atari, ImageNet 모두 그랬다). 이 논문은 SGD의 그래디언트 추정 분산이라는 아주 기초적인 통계량 하나로 이 질문에 정량적으로 답한다. 부모 격인 [큰 배치의 함정](#/p/large-batch)이 "배치를 키우면 일반화가 나빠질 수 있다"는 현상을 보고했다면, 여기서는 그 이전 단계 — **배치를 얼마나 키워야 수확 체감이 시작되는가**를 예측하는 모델을 세운다.',

ideas:[
 {h:'gradient noise scale: 그래디언트의 신호 대 잡음비',
  lead:'배치 그래디언트의 분산과 참 그래디언트 크기의 비로 "노이즈 규모" $B_{noise}$를 정의한다.',
  d:'미니배치 그래디언트 $G_{est}$는 참 그래디언트 $G$의 불편추정량이고 분산은 $\\Sigma/B$로 배치 크기에 반비례한다. 파라미터를 한 스텝 갱신했을 때 기대 손실 감소를 2차 근사로 풀면, 최적 스텝 크기와 그로 인한 손실 개선이 $B_{noise}=\\text{tr}(H\\Sigma)/G^{T}HG$ 라는 하나의 상수에 의해 결정된다는 결론이 나온다. 이 값이 그래디언트 노이즈 스케일이다.'},
 {h:'배치 크기가 이 값을 넘는 순간 수확 체감',
  lead:'$B \\ll B_{noise}$ 이면 배치를 키운 만큼 선형으로 빨라지고, $B \\gg B_{noise}$ 이면 거의 안 빨라진다.',
  d:'손실 개선량은 $\\Delta L_{opt}(B) = \\Delta L_{max}/(1+B_{noise}/B)$ 형태를 띤다. 이 식은 두 극한을 자연스럽게 잇는다 — 작은 배치 구간에서는 분모가 $B_{noise}/B$ 항이 지배해 $B$에 선형, 큰 배치 구간에서는 1이 지배해 거의 상수. 전환점이 바로 $B \\approx B_{noise}$ 이고, 이 지점에서 학습 속도는 이론상 최댓값의 50%가 된다.'},
 {h:'Hessian 없이 계산하는 간단 버전 $B_{simple}$',
  lead:'조건수가 1이라고 가정하면 $B_{noise}$가 그래디언트 분산 합을 노름 제곱으로 나눈 값으로 단순화된다.',
  d:'$B_{noise}=\\text{tr}(H\\Sigma)/G^THG$ 는 Hessian $H$를 요구해 계산 비용이 크다. $H\\approx I$로 근사하면 $B_{simple}=\\text{tr}(\\Sigma)/|G|^2$ 로 줄어들고, 이는 데이터 병렬 학습 중 큰 배치 하나와 그 안의 작은 배치들의 그래디언트를 비교하는 것만으로 거의 공짜로 측정된다. 논문은 실전에서 $B_{simple}$과 $B_{noise}$가 상수배 정도로만 다르다는 것을 확인하고, 이후 전 실험에서 $B_{simple}$을 쓴다.'},
 {h:'8개 과제에서 오더 수준으로 들어맞는 예측',
  lead:'critical batch size가 SVHN 오토인코더 20에서 Dota 5v5 1000만 이상까지 걸쳐 있는데도 예측이 맞는다.',
  d:'MNIST·SVHN·CIFAR-10·ImageNet 같은 지도학습, Billion Word 언어모델, Atari·Dota 강화학습, SVHN VAE/오토인코더까지 도메인이 극단적으로 다른 8개 과제에서 배치 크기를 촘촘히 바꿔가며 실제로 훈련해 "50% 효율 지점"인 critical batch size $B_{crit}$을 측정했다. 이 값과 $B_{simple}$을 나란히 그리면(Figure 4) 6자릿수를 넘나드는 범위에서 대각선 위에 놓인다 — 정확한 값은 아니어도 **오더(order of magnitude)는 항상 맞는다**.'},
 {h:'노이즈 규모는 학습이 진행될수록, 과제가 복잡할수록 커진다',
  lead:'손실이 낮아져 $|G|$가 작아질수록, 강화학습처럼 신용 할당이 어려울수록 $B_{noise}$가 커진다.',
  d:'$B_{simple}=\\text{tr}(\\Sigma)/|G|^2$ 이므로 학습이 수렴에 가까워져 그래디언트 크기 $|G|$가 줄면 분모가 작아져 노이즈 규모가 커진다 — 즉 **학습 후반일수록 더 큰 배치가 유리해진다**. 반대로 모델 파라미터 수 자체는 이 비율에서 거의 상쇄되어, 노이즈 규모는 모델 크기보다 손실 수준과 과제의 본질적 난이도(RL의 희소 보상, 긴 시간 지평)에 좌우된다.'}
],

diagram:{type:'flow', cap:'배치 크기를 늘려도 그래디언트 분산이 줄 뿐, 어느 지점(B_noise)을 넘으면 손실 개선은 거의 늘지 않는다.',
 nodes:[
  {t:'미니배치 샘플', s:'B개 example'},
  {t:'그래디언트 추정', s:'분산 ∝ 1/B'},
  {t:'노이즈 규모 측정', s:'B_simple', acc:true},
  {t:'배치 크기 결정', s:'B ≈ B_crit'},
  {t:'선형 병렬화 vs 정체', s:'수확 체감 지점 이후'}
 ]},

math:[
 {expr:'B_noise = tr(H Σ) / (Gᵀ H G)',
  tex:'B_{\\text{noise}} \\;=\\; \\frac{\\text{tr}(H\\Sigma)}{G^{\\top} H G}',
  d:'$H$는 손실의 Hessian, $\\Sigma$는 example별 그래디언트의 공분산, $G$는 참 그래디언트. 데이터셋 크기와 무관하게 정의된 순수 스칼라다.'},
 {expr:'ΔL_opt(B) = ΔL_max / (1 + B_noise / B)',
  tex:'\\Delta L_{\\text{opt}}(B) \\;=\\; \\frac{\\Delta L_{\\max}}{1 + B_{\\text{noise}}/B}',
  d:'배치 $B$로 한 스텝 최적 진행했을 때 얻는 손실 감소. $B \\to \\infty$ 이면 $\\Delta L_{max}$ 에 수렴하고, $B=B_{noise}$ 에서 그 절반이 된다.'},
 {expr:'B_simple = tr(Σ) / |G|²',
  tex:'B_{\\text{simple}} \\;=\\; \\frac{\\text{tr}(\\Sigma)}{|G|^{2}}',
  d:'Hessian이 항등행렬에 비례한다는(조건이 잘 맞는다는) 가정 아래 나오는 계산 가능한 근사치. 데이터 병렬 학습 중 거의 추가 비용 없이 측정할 수 있어 논문 전체의 실질적 도구가 된다.'}
],

numbers:[
 {k:'critical batch size 범위', v:'20 ~ 1000만+', d:'SVHN 오토인코더(20)부터 Dota 5v5(하한 800만 이상)까지'},
 {k:'ImageNet', v:'B_crit ≈ 15,000', d:'학습 후반 평균값 (초반은 약 1,000)'},
 {k:'Billion Word LSTM', v:'B_crit ≈ 100,000 토큰', d:'초반 700에서 학습이 진행되며 크게 증가'},
 {k:'Dota 1v1', v:'B_crit ≈ 300만 (프레임)', d:'B_simple 30만 대비 약 10배 — 그래도 같은 자릿수'},
 {k:'50% 효율 정의', v:'critical batch size', d:'이 지점을 넘으면 배치를 2배로 늘려도 스텝 수는 절반보다 덜 준다'},
 {k:'검증 과제 수', v:'8개 도메인', d:'지도학습 4 · 생성모델 2 · 강화학습(Atari, Dota) 2'}
],

impact:'배치 크기를 정하는 문제가 "경험으로 찾는 것"에서 "측정 가능한 통계량으로 예측하는 것"으로 바뀌었다. 데이터 병렬화의 한계를 사전에 가늠할 수 있게 되면서, 거대 모델을 얼마나 많은 장치에 분산시킬 가치가 있는지 계산하는 실무적 기준이 생겼다. 더 중요하게는, 이 논문의 저자들이 이듬해 내놓은 [스케일링 법칙](#/p/scaling-laws) 연구에서 "모델·데이터·연산을 함께 키운다"는 방법론의 한 축 — **연산을 배치로 어떻게 병렬화할지** — 을 이미 여기서 정량화해 둔 셈이다. 이후 GPT-3급 모델들의 배치 스케줄(학습 중 배치를 점점 키우는 방식)이 이 논문의 예측을 실무적으로 그대로 따른다.',

legacy:[
 '**[스케일링 법칙](#/p/scaling-laws)의 전신** — 저자 상당수가 겹치며, "연산 예산을 어떻게 나눌 것인가"라는 질문의 배치 축을 이 논문이 먼저 풀었다',
 '**동적 배치 스케줄** — GPT-3 등 대형 LLM 학습에서 배치를 훈련 중 점진적으로 키우는 관행이 여기서 제시한 "$B_{noise}$는 학습이 진행될수록 커진다"는 예측을 그대로 반영',
 '**[FedAvg](#/p/fedavg) 등 분산학습 설계**에서 통신 비용과 배치 크기의 트레이드오프를 가늠하는 참조점으로 인용',
 '**후속 노이즈 스케일 측정 도구** — Megatron-LM, DeepSpeed 등 대규모 학습 프레임워크의 배치 크기 자동 튜닝 논의에서 반복 인용'
],

pitfalls:[
 '**$B_{crit}$은 상수가 아니다.** 학습 초반과 후반에 크게 다르며(예: ImageNet은 1,000에서 15,000으로), "이 모델의 critical batch size는 X다"라는 식의 단일 숫자 주장은 어느 시점 기준인지 명시해야 한다.',
 '**오더 수준 예측이지 정밀한 값이 아니다.** Dota 1v1처럼 $B_{simple}$과 $B_{crit}$이 10배 가까이 차이 나는 과제도 있다 — 이 논문의 주장은 "자릿수는 맞는다"이지 "정확히 일치한다"가 아니다.',
 '**노이즈 규모와 [큰 배치의 함정](#/p/large-batch)이 말하는 일반화 격차는 별개 현상이다.** 이 논문은 훈련 손실 최적화 속도만 다루며, 배치를 키웠을 때의 테스트 성능 저하(sharp minima 논쟁)에는 관여하지 않는다고 명시한다.'
],

figures:[
 {f:'fig1-tradeoff.png',
  cap:'왼쪽: 컴퓨팅 비용과 학습 시간은 서로 맞바꿀 수 있는 Pareto 곡선을 이룬다 — 더 큰 배치(더 많은 하드웨어)로 시간을 줄이거나, 작은 배치로 비용을 줄일 수 있다. 오른쪽: Atari Breakout을 두 점수 수준(10, 500)까지 학습시킨 실제 곡선이 이 쌍곡선 모양을 그대로 따른다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig4-critical-batch.png',
  cap:'가로축이 이 논문이 측정한 gradient noise scale($B_{simple}$), 세로축이 실제로 훈련해서 찾은 critical batch size. 로그-로그 스케일로 20부터 1000만까지, 지도학습(주황)·생성모델(파랑)·강화학습(초록)이 모두 대각선 근처에 놓인다.',
  src:'원문 Figure 4, p.10'}
],

quotes:[
 {t:'We find that a simple and easy-to-measure statistic called the gradient noise scale predicts the largest useful batch size across many domains and applications.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1812.06162 — An Empirical Model of Large-Batch Training', u:'https://arxiv.org/abs/1812.06162'},
 {t:'OpenAI Blog: How AI Training Scales', u:'https://openai.com/research/how-ai-training-scales'}
]
});
