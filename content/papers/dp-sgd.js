WIKI.paper({
slug:'dp-sgd',
venue:'CCS 2016',
authors:'Abadi, Chu, Goodfellow, McMahan, Mironov, Talwar, Zhang (Google)',
arxiv:'1607.00133',

tldr:'경사하강법에 **개별 예시 gradient 클리핑 + 가우시안 노이즈**를 넣어 차등 프라이버시를 만족시키고, 그 대가로 치르는 프라이버시 비용을 **moments accountant**로 훨씬 촘촘하게 계산해 낸 논문. "학습된 모델이 학습 데이터를 얼마나 흘리는가"를 처음으로 수치 보증으로 바꿨다.',

context:'신경망은 학습 데이터를 기억한다. 크라우드소싱으로 모은 의료 기록이나 사용자 입력으로 모델을 학습시키면, 그 모델이 개별 기록을 되뱉을 수 있다. 차등 프라이버시는 이 문제에 수학적 정의를 준다 — 데이터셋에서 한 사람을 빼도 결과 분포가 거의 안 바뀌면, 결과를 봐도 그 사람에 대해 알아낼 수 없다. 문제는 비용이었다. 기존 방식으로 딥러닝에 이 보증을 붙이면 노이즈가 너무 커져 모델이 쓸모없어지거나, 프라이버시 손실을 헐겁게 계산해 보증이 무의미해졌다. 이 논문은 **알고리즘과 회계를 동시에** 손봤다.',

ideas:[
 {h:'예시 하나씩 클리핑한 뒤 노이즈를 더한다',
  lead:'배치 gradient가 아니라 개별 예시 gradient의 노름을 $C$로 자른 뒤 합에 노이즈를 넣는다.',
  d:'배치 전체의 gradient에 노이즈를 넣으면 한 사람이 결과에 얼마나 기여했는지 상한을 알 수 없다. 그래서 **예시별 gradient를 따로 계산해 각각의 $L_2$ 노름을 $C$ 이하로 자른다**. 그러면 한 예시가 합에 미치는 영향이 최대 $C$로 묶이고, 여기에 표준편차 $\\sigma C$인 가우시안 노이즈를 더하면 정해진 프라이버시 보증이 성립한다. 클리핑이 민감도를 강제로 만들어 내는 장치인 셈이다.'},
 {h:'moments accountant — 프라이버시 비용을 촘촘히 센다',
  lead:'매 스텝의 프라이버시 손실을 더하는 대신 로그 적률의 상한을 누적해 훨씬 낮은 $\\varepsilon$을 얻는다.',
  d:'수천 스텝을 학습하면 스텝마다 발생한 프라이버시 손실이 쌓인다. 기존 합성 정리로 더하면 상한이 빠르게 커져 $\\varepsilon$이 실용 범위를 벗어난다. 이 논문은 프라이버시 손실 확률변수의 **로그 적률 생성함수**를 스텝마다 누적하고 마지막에 한 번 꼬리 확률로 변환한다. 같은 조건($q=0.01$, $\\sigma=4$, $\\delta=10^{-5}$)에서 강한 합성 정리가 주는 값보다 훨씬 작은 $\\varepsilon$이 나온다.'},
 {h:'lot과 batch를 분리한다',
  lead:'노이즈는 큰 단위(lot)에 한 번 넣고, 계산은 메모리에 맞는 작은 배치로 쪼갠다.',
  d:'프라이버시 회계에는 표본추출 비율 $q = L/N$이 들어가므로 노이즈를 넣는 단위 $L$이 클수록 유리하다. 하지만 예시별 gradient를 다 들고 있으려면 메모리가 부족하다. 그래서 노이즈를 더하는 논리적 단위(lot)와 실제 계산 단위(batch)를 분리했다. 실험에서 최적 lot 크기는 대략 $\\sqrt{N}$ 근처였다.'},
 {h:'프라이버시 예산과 정확도의 교환을 그래프로 보였다',
  lead:'$\\varepsilon$을 조일수록 정확도가 떨어지는 곡선을 실측해 실무 선택의 근거를 만들었다.',
  d:'MNIST에서 비공개 기준선이 98.30%인데, $\\varepsilon$을 0.5·2·8로 두면 각각 90%·95%·97%가 된다. CIFAR-10은 격차가 더 크다 — 기준선 약 80%에 대해 $\\varepsilon$ 2·4·8에서 67%·70%·73%다. **모델이 어려울수록 프라이버시 대가가 커진다**는 것이 이 표의 교훈이다.'}
],

diagram:{type:'flow', cap:'핵심은 두 번째와 세 번째 상자다. 예시별로 잘라서 한 사람의 영향에 상한을 만든 뒤, 그 상한에 비례하는 노이즈를 더한다.',
 nodes:[
  {t:'lot 표본추출', s:'확률 q = L/N'},
  {t:'예시별 gradient', s:'배치 평균이 아님'},
  {t:'노름 클리핑', s:'‖g‖₂ ≤ C', acc:true},
  {t:'가우시안 노이즈', s:'N(0, σ²C²I)', acc:true},
  {t:'평균 내어 갱신', s:'÷ L'},
  {t:'적률 누적', s:'moments accountant'}
 ]},

math:[
 {tex:'\\bar{g}_t(x_i) \;=\; g_t(x_i) \\Big/ \\max\\!\\left(1,\; \\frac{\\lVert g_t(x_i)\\rVert_2}{C}\\right)',
  expr:'ḡ(x) = g(x) / max(1, ‖g(x)‖₂ / C)',
  d:'노름이 $C$ 이하면 그대로 두고, 넘으면 $C$로 줄인다. 이 한 줄이 **민감도를 $C$로 고정**해 뒤에 붙일 노이즈 크기를 정할 수 있게 만든다.'},
 {tex:'\\tilde{g}_t \;=\; \\frac{1}{L}\\left(\\sum_i \\bar{g}_t(x_i) \;+\; \\mathcal{N}\\!\\left(0,\; \\sigma^2 C^2 \\mathbf{I}\\right)\\right)',
  expr:'g̃ = (Σ ḡ(x_i) + N(0, σ²C²I)) / L',
  d:'클리핑된 gradient 합에 노이즈를 더하고 lot 크기로 나눈다. $\\sigma$가 클수록 스텝당 프라이버시 손실이 작아져 같은 예산으로 더 오래 학습할 수 있다.'},
 {tex:'\\alpha_{\\mathcal{M}}(\\lambda) \;\\triangleq\; \\max_{\\text{aux},\\, d, d\'} \; \\log \\mathbb{E}\\!\\left[\\exp\\!\\left(\\lambda\\, c(o;\\mathcal{M},\\text{aux},d,d\')\\right)\\right]',
  expr:'α(λ) = max log E[exp(λ · 프라이버시 손실)]',
  d:'프라이버시 손실의 로그 적률. 이 값은 **스텝마다 단순히 더할 수 있고**, 마지막에 한 번만 $(\\varepsilon,\\delta)$로 바꾼다. 매 스텝 꼬리 확률로 변환한 뒤 더하는 기존 방식보다 훨씬 촘촘한 상한이 나온다.'}
],

numbers:[
 {k:'MNIST · 비공개 기준선', v:'98.30%', d:'60차원 PCA + 은닉 1,000, lot 600'},
 {k:'MNIST · ε = 0.5 / 2 / 8', v:'90% / 95% / 97%', d:'모두 $\\delta = 10^{-5}$'},
 {k:'CIFAR-10 · 비공개 기준선', v:'약 80%', d:'공개 데이터(CIFAR-100)로 사전학습한 합성곱망'},
 {k:'CIFAR-10 · ε = 2 / 4 / 8', v:'67% / 70% / 73%', d:'lot 2,000~4,000, $\\sigma = 6$, 클리핑 3'},
 {k:'실험 설정', v:'q = 0.01 · σ = 4 · δ = 10⁻⁵', d:'표본추출 비율·노이즈 배율·실패 확률'},
 {k:'최적 lot 크기', v:'약 √N', d:'너무 작으면 노이즈가 지배하고, 너무 크면 스텝 수가 줄어든다'}
],

impact:'차등 프라이버시가 이론에서 딥러닝 실무로 넘어온 지점이다. 이후 TensorFlow Privacy·Opacus 같은 라이브러리가 이 알고리즘을 그대로 구현했고, 모바일 키보드 예측처럼 민감한 데이터를 쓰는 서비스의 표준 학습 절차가 됐다. 더 중요한 것은 **논쟁의 언어를 바꿨다**는 점이다. "이 모델이 개인정보를 흘리나요?"라는 질문에 정성적으로 답하는 대신 $(\\varepsilon, \\delta)$라는 숫자를 제시할 수 있게 됐다.',

legacy:[
 '**공격 쪽과의 대치** — [멤버십 추론 공격](#/p/membership-inference)과 [학습 데이터 추출](#/p/extracting-training-data)이 실제 유출을 실증하면서, DP-SGD 는 그에 대한 표준 방어로 자리 잡았다',
 '**분산 학습과의 결합** — [FedAvg](#/p/fedavg)의 연합학습에 DP 를 얹는 조합이 모바일 환경의 기본 구성이 됐다',
 '**대규모 모델로의 확장** — 예시별 gradient 계산 비용이 병목이라, 이후 연구는 [LoRA](#/p/lora) 같은 저랭크 미세조정과 결합해 비용을 낮추는 방향으로 갔다',
 '**중복 제거와의 연결** — [학습 데이터 중복 제거](#/p/dedup)가 암기를 줄인다는 발견은, 프라이버시가 알고리즘만의 문제가 아니라 데이터 문제이기도 함을 보였다'
],

pitfalls:[
 '**$\\varepsilon$ 값이 실제로 무엇을 보장하는지 해석하기 어렵다.** $\\varepsilon = 8$ 은 이론적으로 매우 느슨한 보증이지만 실무에서 흔히 쓰인다. 논문의 수치도 대부분 이 영역이고, "DP 를 적용했다"는 말만으로는 안전성을 판단할 수 없다.',
 '**보호 단위가 무엇인지 확인해야 한다.** 기본 정의는 **예시 하나**를 보호한다. 한 사람이 데이터를 여러 개 제공했다면 그 사람에 대한 보증은 그만큼 약해진다(user-level DP 가 따로 필요하다).',
 '**비용이 정확도만이 아니다.** 예시별 gradient 를 따로 구해야 해서 메모리와 연산이 크게 늘고, 클리핑 임계값 $C$·노이즈 $\\sigma$·lot 크기가 서로 얽혀 하이퍼파라미터 탐색 자체가 프라이버시 예산을 소모한다.'
],

figures:[
 {f:'fig1-algorithm.png', cap:'알고리즘 1. 4행에서 예시별 gradient를 구하고, 5행에서 노름을 C로 자르고, 6행에서 가우시안 노이즈를 더한다. 마지막 행의 accountant가 누적 프라이버시 손실을 센다.', src:'원문 Algorithm 1, p.3'}
],

quotes:[
 {t:'We demonstrate that, by tracking detailed information (higher moments) of the privacy loss, we can obtain much tighter estimates on the overall privacy loss, both asymptotically and empirically.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1607.00133 — Deep Learning with Differential Privacy', u:'https://arxiv.org/abs/1607.00133'},
 {t:'TensorFlow Privacy — 이 알고리즘의 참조 구현', u:'https://github.com/tensorflow/privacy'},
 {t:'Opacus (PyTorch) — 예시별 gradient를 효율적으로 계산하는 구현', u:'https://opacus.ai/'}
]
});
