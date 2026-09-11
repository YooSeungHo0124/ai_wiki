WIKI.concept({
slug:'probability-dist',

tldr:'확률 변수가 가질 수 있는 값들에 확률을 배정하는 규칙으로, 이산 변수는 확률질량함수(PMF), 연속 변수는 확률밀도함수(PDF)로 나타낸다.',

why:'언어 모델의 출력은 다음 토큰에 대한 확률 분포이고, [VAE](#/p/vae)의 잠재 변수는 정규분포를 가정하며, [GPT-3](#/p/gpt3) 류 모델의 학습 목표 자체가 "데이터 분포를 모델 분포로 근사하는 것"이다. 분포·PMF·PDF 를 구분 못 하면 "왜 softmax 출력의 합이 1인가", "왜 연속 변수의 확률밀도가 1을 넘을 수 있는가" 같은 질문에서 막힌다.',

sections:[
 {h:'확률 변수와 분포', d:'확률 변수(random variable)는 무작위 시행의 결과를 숫자로 대응시킨 것이고, 확률 분포는 그 숫자들에 확률을 배정하는 규칙 전체다. 주사위 눈, 다음 토큰의 vocabulary 인덱스처럼 값이 셀 수 있는(discrete) 경우와, 픽셀 값이나 연속적인 잠재 변수처럼 셀 수 없는(continuous) 경우로 나뉜다.'},
 {h:'이산: PMF', d:'이산 확률 변수 $X$ 에 대해 $p(x)=P(X=x)$ 를 PMF 라 한다. 각 값의 확률은 0 이상이고 전체 합은 1이다: $\\sum_x p(x)=1$. 언어 모델의 다음 토큰 예측이 정확히 이 형태다 — vocabulary 의 각 토큰에 확률을 배정하는 softmax 출력이 PMF이고, 그래서 출력 벡터의 합이 항상 1이 되도록 정규화된다.'},
 {h:'연속: PDF', d:'연속 확률 변수는 특정 값 하나를 가질 확률이 정확히 0이라서(예: 키가 정확히 170.0000...cm 일 확률) PMF 대신 밀도함수 $f(x)$ 를 쓴다. $f(x)$ 자체는 확률이 아니라 밀도이므로 1을 넘을 수 있고, 구간에 대해 적분한 값 $\\int_a^b f(x)\\,dx$ 만이 실제 확률이다. 전체 적분은 1이다: $\\int_{-\\infty}^{\\infty} f(x)\\,dx=1$. VAE 의 잠재 변수가 따르는 정규분포가 대표적인 PDF 예다.'},
 {h:'딥러닝 속 분포 3곳', d:'(1) 모델의 출력 자체가 분포다 — 분류기의 softmax, 언어 모델의 다음 토큰 분포. (2) 생성 모델은 데이터의 분포를 근사한다 — [diffusion](#/c/diffusion-basics) 모델은 노이즈 분포에서 데이터 분포로 가는 변환을 학습한다. (3) 모델 내부의 가정으로 쓰인다 — VAE 의 잠재 변수를 정규분포로 가정하는 것, 가중치 초기화([weight-init](#/c/weight-init))가 특정 분포에서 값을 뽑는 것.'}
],

math:[
 {tex:'\\sum_x p(x)=1 \\quad (\\text{이산}),\\qquad \\int_{-\\infty}^{\\infty} f(x)\\,dx=1 \\quad (\\text{연속})',
  expr:'정규화 조건', d:'PMF 는 모든 값에 걸친 합이, PDF 는 전체 구간에 걸친 적분이 1이어야 한다. softmax 가 출력에 지수함수를 씌운 뒤 합으로 나누는 이유가 바로 이 조건을 강제로 만족시키기 위해서다.'},
 {tex:'f(x)=\\frac{1}{\\sqrt{2\\pi\\sigma^2}}\\exp\\!\\left(-\\frac{(x-\\mu)^2}{2\\sigma^2}\\right)',
  expr:'정규분포(가우시안) PDF', d:'$\\mu$ 는 평균(분포의 중심), $\\sigma^2$ 은 [분산](#/c/expectation-variance)(퍼진 정도). VAE 의 잠재 변수, 가중치 초기화, 확산 모델의 노이즈가 모두 이 분포를 기본 가정으로 쓴다.'}
],

diagram:{type:'compare', cap:'값을 셀 수 있는지 여부로 PMF와 PDF가 갈린다.',
 left:{t:'이산 → PMF', items:['토큰 vocabulary','합이 1','softmax 출력']},
 right:{t:'연속 → PDF', items:['픽셀 값·잠재 변수','적분이 1','정규분포가 대표적']}},

confuse:[
 {a:'PMF의 값', b:'PDF의 값', d:'PMF 값 $p(x)$ 는 그 자체가 확률이라 항상 0~1 사이다. PDF 값 $f(x)$ 는 밀도일 뿐이라 1을 넘어도 된다(예: 분산이 아주 작은 정규분포는 중심에서 밀도가 매우 커진다) — "확률이 1보다 크다"는 오해는 여기서 나온다.'},
 {a:'확률', b:'[우도(likelihood)](#/c/mle)', d:'확률은 파라미터를 고정하고 데이터가 나올 가능성을 묻는다($P(\\text{data}\\mid\\theta)$, $\\theta$ 고정, data 변수). 우도는 관측된 데이터를 고정하고 어떤 파라미터가 그 데이터를 가장 그럴듯하게 만드는지를 묻는다(data 고정, $\\theta$ 변수) — 같은 수식을 무엇을 변수로 보는지만 바꿔 읽는 것이다.'}
],

pitfalls:[
 '연속 변수에서 "$P(X=x)$"를 이산 변수처럼 묻는 경우가 있는데, 연속 변수는 한 점의 확률이 항상 0이다 — 물어야 할 것은 구간의 확률이다.',
 '모델의 softmax 출력을 "모델이 확신하는 정도(신뢰도)"로 그대로 받아들이기 쉬운데, 이는 [보정](#/c/calibration)이 되어 있을 때만 성립한다 — 학습 직후의 확률값은 실제 정확도와 잘 안 맞는 경우가 흔하다.',
 'PMF와 PDF 를 같은 수식으로 다루려다 실수하는 경우가 있다 — 이산 변수의 합 기호 $\\sum$ 을 연속 변수에 그대로 쓰거나, 반대로 적분 $\\int$ 을 이산 변수에 쓰면 정규화 조건 자체가 깨진다.'
],

code:{lang:'python', d:'PMF(softmax) 와 PDF(정규분포)의 정규화 조건을 직접 확인.',
 src:'import numpy as np\nlogits = np.array([2.0, 1.0, 0.1])\np = np.exp(logits) / np.exp(logits).sum()  # PMF: 합이 1\nprint(p.sum())          # 1.0\nx = np.linspace(-5, 5, 100000)\nf = np.exp(-x**2/2) / np.sqrt(2*np.pi)     # PDF: 적분이 1\nprint(np.trapz(f, x))   # 약 1.0'},

papers:['vae','gpt3'],
terms:['expectation-variance','entropy-kl','mle']
});
