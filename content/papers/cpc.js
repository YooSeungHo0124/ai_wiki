WIKI.paper({
slug:'cpc',
venue:'arXiv 2018 / preprint (DeepMind)',
authors:'van den Oord, Li, Vinyals (DeepMind)',
arxiv:'1807.03748',

tldr:'미래를 **재구성하지 않고 대조(contrast)로 예측**하는 자기지도 학습 프레임워크. 픽셀·파형을 직접 복원하는 대신, 진짜 미래 표현을 여러 개의 가짜(negative) 후보 사이에서 골라내는 분류 문제로 바꾸면서 InfoNCE 손실을 제안했다. 오디오·이미지·텍스트·강화학습 네 도메인에서 같은 방식이 통한다는 것을 보였다.',

context:'2018년 당시 비지도 표현학습의 주류는 **생성적 재구성**이었다 — 오토인코더나 픽셀 단위 생성모델처럼 입력을 그대로 복원하도록 학습시키는 방식이다. 문제는 고차원 데이터의 디테일 대부분이 다운스트림 과제에 무의미하다는 점이다. 이미지 한 장은 수천 비트를 담지만, 클래스 레이블 하나는 1024개 범주라 해도 10비트면 충분하다. $p(x|c)$ 를 픽셀 단위까지 정확히 모델링하려는 노력은 계산 비용만 키우고 정작 유용한 고수준 정보(음소, 사물, 줄거리 같은 "느린 특징")에는 집중하지 못한다. 저자들은 [word2vec](#/p/word2vec)이 단어를 하나하나 재구성하지 않고 **주변 단어를 예측하는 대조 학습**만으로 좋은 표현을 얻었다는 사실에서 힌트를 얻어, 이를 임의의 고차원 시계열로 일반화하는 것을 목표로 삼았다.',

ideas:[
 {h:'재구성 대신 상호정보량 하한을 최대화',
  lead:'미래 $x$를 직접 생성하지 않고 현재 문맥 $c$와의 상호정보량 $I(x;c)$ 만 키운다.',
  d:'목표를 $p(x|c)$ 재구성에서 $I(x;c)=\\sum p(x,c)\\log\\frac{p(x|c)}{p(x)}$ 최대화로 바꾼다. 이렇게 하면 $x$ 와 $c$ 가 공유하는 고수준 정보만 남기고, $c$ 와 무관한 저수준 디테일(노이즈, 텍스처)은 자동으로 버려진다. 무엇을 예측할지 사람이 설계하지 않아도 손실 함수 자체가 "공유된 만큼만" 남기도록 강제한다.'},
 {h:'인코더 + 자기회귀 모델의 2단 구조',
  lead:'$g_{enc}$가 관측을 압축하고 $g_{ar}$가 그 압축열을 요약해 미래를 예측한다.',
  d:'입력 $x_t$ 를 비선형 인코더 $g_{enc}$ 로 잠재 벡터 $z_t=g_{enc}(x_t)$ 로 압축한 뒤, 자기회귀 모델 $g_{ar}$ 이 $z_{\\le t}$ 를 요약해 문맥 벡터 $c_t$ 를 만든다. 논문은 인코더로 strided convolution + ResNet 블록을, 자기회귀 모델로 GRU를 썼지만 어떤 조합도 가능하다고 못박는다.'},
 {h:'밀도 비율을 log-bilinear 스코어로 근사',
  lead:'$p(x|c)/p(x)$ 를 직접 계산하는 대신 $\\exp(z^\\top W c)$ 형태의 점수로 대체한다.',
  d:'미래 $x_{t+k}$ 를 조건부 확률로 직접 모델링하는 대신, 비율 $f_k(x_{t+k},c_t)\\propto p(x_{t+k}|c_t)/p(x_{t+k})$ 을 근사하는 함수를 학습한다. 이 함수가 정규화될 필요가 없다는 점(합이 1이 아니어도 됨)이 핵심이며, 스텝 $k$ 마다 다른 가중치 행렬 $W_k$ 를 쓴다.'},
 {h:'InfoNCE: 진짜 미래 vs 가짜 미래 분류',
  lead:'긍정 샘플 1개와 음성 샘플 N-1개 중에서 진짜를 고르는 categorical cross-entropy를 최소화한다.',
  d:'같은 배치 안의 다른 위치·다른 시퀀스에서 뽑은 $N-1$ 개의 negative와 진짜 미래 $x_{t+k}$ 를 섞어 놓고, 모델이 점수 $f_k$ 로 진짜를 골라내게 한다. 이 손실을 최소화하면 $f_k$ 가 정확히 목표했던 밀도 비율에 수렴한다는 것을 증명했고, $I(x_{t+k};c_t)\\ge \\log N - \\mathcal{L}_N$ 이라는 하한도 함께 유도해 negative 개수 $N$ 이 많을수록 하한이 타이트해짐을 보였다.'},
 {h:'하나의 메커니즘으로 네 도메인을 통과',
  lead:'같은 예측-대조 구조를 오디오·이미지·텍스트·RL에 그대로 적용해 각각 강력한 결과를 냈다.',
  d:'오디오에서는 음소·화자 식별, 이미지에서는 ResNet-101 패치를 7×7 격자로 나눠 아래쪽 행을 예측, 텍스트에서는 BookCorpus로 문장 표현을 학습, 강화학습에서는 A2C 정책에 보조 손실로 CPC를 얹었다. 도메인마다 인코더만 바뀌고 대조 손실 구조는 동일하다는 것이 "범용" 표현학습이라는 주장의 근거다.'}
],

diagram:{type:'flow', cap:'오디오 예시: 과거 $x_{t-3..t}$가 $z_t$를 거쳐 $c_t$로 요약되고, $c_t$가 미래 $z_{t+1..t+4}$를 예측한다(점선). 실제 학습은 이 예측을 negative들과 대조하는 분류로 이뤄진다.',
 nodes:[
  {t:'원시 신호', s:'x_t-3 … x_t+4'},
  {t:'인코더 g_enc', s:'→ z_t (압축 표현)'},
  {t:'자기회귀 g_ar', s:'z≤t → c_t', acc:true, note:'문맥 요약'},
  {t:'미래 예측', s:'ẑ_t+1 … ẑ_t+4'},
  {t:'InfoNCE 분류', s:'진짜 1 vs 가짜 N-1'}
 ]},

math:[
 {expr:'I(x;c) = Σ p(x,c) log( p(x|c) / p(x) )',
  tex:'I(x;c)=\\sum_{x,c} p(x,c)\\,\\log\\frac{p(x|c)}{p(x)}',
  d:'상호정보량. CPC의 목표는 이를 직접 계산하는 것이 아니라 그 하한을 최대화하는 것이다.'},
 {expr:'f_k(x_t+k, c_t) = exp( z_t+k^T W_k c_t )',
  tex:'f_k(x_{t+k},c_t)=\\exp\\!\\left(z_{t+k}^{\\top}W_k c_t\\right)',
  d:'밀도 비율 $p(x_{t+k}|c_t)/p(x_{t+k})$ 에 비례하도록 학습되는 log-bilinear 점수 함수. $W_k$ 는 예측 스텝마다 다른 선형 변환이다.'},
 {expr:'L_N = -E[ log( f_k(x_t+k,c_t) / Σ_{x_j∈X} f_k(x_j,c_t) ) ]',
  tex:'\\mathcal{L}_N=-\\,\\mathbb{E}_X\\!\\left[\\log\\frac{f_k(x_{t+k},c_t)}{\\sum_{x_j\\in X} f_k(x_j,c_t)}\\right]',
  d:'InfoNCE 손실. $X$ 는 긍정 샘플 1개 + negative $N-1$ 개. 이 손실의 최적값은 negative 개수와 무관하게 참 밀도 비율에 비례하며, $I(x_{t+k};c_t)\\ge \\log N-\\mathcal{L}_N$ 이 성립한다.'}
],

numbers:[
 {k:'ImageNet top-1 (linear probe)', v:'48.7%', d:'ResNet-v2-101 인코더, 이전 최고(Colorization, 39.6%) 대비 +9%p'},
 {k:'ImageNet top-5 (linear probe)', v:'73.6%', d:'이전 최고(MS+Ex+RP+Col 조합, 69.3%) 대비 +4%p'},
 {k:'LibriSpeech 음소 분류', v:'64.6%', d:'MFCC 특징(39.7%)과 완전지도 학습(74.6%) 사이'},
 {k:'LibriSpeech 화자 식별', v:'97.4%', d:'251명 중 분류, 완전지도(98.5%)에 근접'},
 {k:'예측 스텝 수 영향', v:'12스텝일 때 최고(64.6%)', d:'2스텝(28.5%)보다 훨씬 멀리 예측할 때 표현이 더 좋아짐'},
 {k:'NLP 5개 벤치마크 평균', v:'skip-thought와 대등', d:'MR·CR·Subj·MPQA·TREC, TREC에서는 96.8%로 최고'}
],

impact:'CPC는 "무엇을 예측할지"를 사람이 설계하지 않고도, **대조 손실 하나로 고수준 표현을 뽑아낼 수 있다**는 것을 오디오·이미지·텍스트·RL 네 도메인에서 동시에 입증했다. InfoNCE는 이후 자기지도 학습에서 사실상 표준 손실이 되었고, "재구성 대신 대조"라는 전환은 비전 분야의 [SimCLR](#/p/simclr)·[MoCo](#/p/moco), 음성의 [wav2vec 2.0](#/p/wav2vec2), 멀티모달의 [CLIP](#/p/clip)까지 곧바로 이어졌다. 다만 이 논문 자체의 성능은 이후 등장한 방법들에 빠르게 추월당했고, 이 논문의 진짜 유산은 결과 수치가 아니라 **손실 함수 설계**에 있다.',

legacy:[
 '**InfoNCE의 전파** — [SimCLR](#/p/simclr)의 NT-Xent, [MoCo](#/p/moco)의 momentum queue 모두 이 논문의 InfoNCE를 배치/큐 구조만 바꿔 그대로 사용',
 '**음성 표현학습의 직계 후손** — [wav2vec 2.0](#/p/wav2vec2)이 CPC의 "미래 잠재 예측 vs negative 대조" 구조를 quantized target으로 발전시킴',
 '**멀티모달 대조 학습으로 확장** — [CLIP](#/p/clip)은 시간축 예측을 이미지-텍스트 쌍 매칭으로 바꿔 같은 InfoNCE 골격을 재사용',
 '**"몇 스텝 앞을 예측할까"라는 설계축을 남김** — 너무 가까운 미래는 저수준 정보로도 풀리고, 너무 먼 미래는 신호가 약해진다는 트레이드오프가 후속 연구의 공통 튜닝 포인트가 됨'
],

pitfalls:[
 '**word2vec과 손실 형태는 비슷하지만 목적이 다르다.** word2vec의 negative sampling은 어휘 전체에 대한 softmax 계산을 근사하려는 공학적 트릭에 가깝고, CPC의 InfoNCE는 상호정보량 하한이라는 명시적 이론적 근거를 갖는다 — 이 논문이 그 증명을 처음 제시했다.',
 '**negative 개수 $N$ 을 늘릴수록 무조건 좋아지는 것은 아니다.** 하한이 타이트해지는 것은 맞지만, 논문의 화자 식별 실험에서도 negative를 같은 화자로만 제한하면 오히려 성능이 떨어지는 등(65.5%→57.3%) negative 구성 방식 자체가 중요한 설계 변수다.',
 '**"어떤 표현($z_t$ 인지 $c_t$ 인지)을 쓸지"는 과제마다 다르다.** 논문은 추가 문맥이 필요한 과제엔 $c_t$, 그렇지 않으면 $z_t$ 를 권하는데, 이를 무시하고 항상 같은 표현을 가져다 쓰면 성능이 떨어질 수 있다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽에서 오른쪽으로 시간이 흐른다. 각 $x_t$가 $g_{enc}$를 거쳐 $z_t$가 되고, $g_{ar}$이 누적해 $c_t$(빨간 상자)를 만든다. $c_t$에서 뻗어나온 점선 화살표가 미래 $z_{t+1}\\dots z_{t+4}$를 향하는 "예측"이며, 실제 학습은 이 예측 벡터와 negative 후보들을 대조하는 방식으로 이뤄진다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'The key insight of our model is to learn such representations by predicting the future in latent space by using powerful autoregressive models.',
  src:'Abstract, p.1'},
 {t:'Optimizing this loss will result in fk(xt+k, ct) estimating the density ratio... independent of the choice of the number of negative samples N − 1.',
  src:'Section 2.3, p.3'}
],

links:[
 {t:'arXiv 1807.03748 — Representation Learning with Contrastive Predictive Coding', u:'https://arxiv.org/abs/1807.03748'}
]
});
