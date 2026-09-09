WIKI.paper({
slug:'graves-rnn',
venue:'arXiv 2013',
authors:'Alex Graves (University of Toronto)',
arxiv:'1308.0850',

tldr:'LSTM 하나로 문자 단위 텍스트와 손글씨를 **한 스텝씩 예측해서 생성**할 수 있음을 보인 논문. 자기회귀 생성이라는 방식 자체를 증명한 초기 사례이고, 손글씨 합성에 쓴 위치 기반 attention이 이후 [Bahdanau attention](#/p/bahdanau)의 직접적인 전신이다.',

context:'2013년의 [LSTM](#/p/lstm)은 이미 음성·필기 **인식**(분류)에서 성과를 냈지만, 시퀀스를 새로 **생성**하는 데 쓴 사례는 드물었다. 표준 RNN은 먼 과거를 금방 잊어버려서, 자기 예측을 다시 입력으로 먹이는 생성 루프를 돌리면 몇 스텝 만에 궤도를 벗어나 발산했다. 텍스트라면 의미 없는 글자로, 손글씨라면 지저분한 낙서로 무너진다. 이 논문의 질문은 "충분히 긴 기억을 가진 LSTM이면 이 불안정성이 사라지는가"이다. 저자는 별도의 계획(planning)이나 트리 탐색 없이, **다음 값 하나를 예측하고 그 샘플을 다시 입력으로 넣는 단순한 루프**만으로 답한다.',

ideas:[
 {h:'다음 값 예측 = 생성',
  lead:'매 스텝 확률분포에서 샘플링한 값을 다음 입력으로 되먹여 시퀀스를 만든다.',
  d:'네트워크는 $\\Pr(x_{t+1}\\mid y_t)$ 만 학습한다. 생성할 때는 이 분포에서 샘플을 뽑아 실제 관측치인 것처럼 다시 입력으로 넣는다. 논문 표현으로는 "네트워크가 자신의 발명을 실제인 것처럼 취급한다"— 사람이 꿈을 꾸는 것과 비슷하다는 비유를 쓴다. 결정론적 네트워크 자체가 아니라 **샘플링 과정**이 시퀀스에 확률성을 부여한다.'},
 {h:'깊은 스택 + skip 연결로 기억을 늘린다',
  lead:'LSTM 층을 여러 개 쌓고 입력·출력에 skip 연결을 둬 깊은 네트워크를 안정적으로 학습한다.',
  d:'은닉층을 $N$ 개 쌓아 $h^1,\\dots,h^N$ 을 시간·공간 양쪽으로 깊게 만든다. 입력이 모든 은닉층에 직접 연결되고 모든 은닉층이 출력에 직접 연결되는 skip 연결을 넣었는데, 이것이 없으면 깊은 스택에서 그래디언트가 잘 전달되지 않아 학습이 어렵다고 밝힌다.'},
 {h:'Mixture Density Output: 연속값도 확률분포로 뱉는다',
  lead:'출력층이 이산 클래스 대신 가우시안 혼합의 파라미터(평균·분산·상관·가중치)를 낸다.',
  d:'손글씨는 펜 좌표 $(x_1, x_2)$ 처럼 연속값이라 softmax로는 표현할 수 없다. 대신 네트워크 출력을 이변량 가우시안 혼합의 평균·표준편차·상관계수·혼합가중치로 변환하고(softmax·exp·tanh로 각각 정의역을 맞춤), stroke 종료 여부는 별도 Bernoulli로 예측한다. 손실은 이 혼합분포 아래에서의 로그우도다.'},
 {h:'Soft window: 위치 기반으로 텍스트를 읽는다',
  lead:'가우시안 혼합 커널로 문자열 위의 읽기 위치를 매 스텝 이동시켜 정렬을 학습한다.',
  d:'손글씨 합성은 길이 $T$ 인 펜 궤적과 길이 $U$ 인 문자열 사이의 **정렬을 모른 채** 문자열에 맞춰 써야 한다. 저자는 두 RNN을 따로 두고 결합하는 RNN transducer 대신, $K$개 가우시안 커널로 만든 "부드러운 창" $\\phi(t,u)$ 를 문자열에 얹어 매 스텝 어떤 문자를 보고 있는지 결정한다. 위치 파라미터 $\\kappa_t$ 를 절대값이 아니라 **이전 위치로부터의 양의 오프셋**으로 정의한 것이 정렬 학습의 핵심이었다고 밝힌다.'},
 {h:'문자별 정렬을 잇는 위치 기반 attention의 원형',
  lead:'디코더가 매 스텝 인코더의 어느 위치를 볼지 커널로 계산한다는 점에서 attention의 전신이다.',
  d:'soft window는 "쿼리·키의 내적"이 아니라 위치 파라미터의 이동으로 정렬을 만든다는 점에서 이후 [Bahdanau attention](#/p/bahdanau)의 콘텐츠 기반 attention과는 메커니즘이 다르다. 그러나 "디코더가 매 스텝 인코더 시퀀스의 어디를 볼지 학습된 가중치로 정한다"는 아이디어 자체는 이 논문이 먼저 실증했다.'}
],

diagram:{type:'stack', cap:'예측 네트워크 한 스텝. 손글씨 합성에서는 은닉층 사이에 문자열을 읽는 window 층이 추가된다.',
 layers:[
  {t:'입력 x_t', s:'문자 또는 펜 좌표'},
  {t:'은닉층 1', s:'LSTM, skip 연결'},
  {t:'은닉층 2~N', s:'스택, 층마다 입력 재주입'},
  {t:'Window (합성만)', s:'문자열 위 읽기 위치', acc:true, note:'soft attention 전신'},
  {t:'출력층', s:'softmax 또는 혼합분포 파라미터'},
  {t:'샘플링', s:'다음 입력으로 되먹임'}
 ]},

math:[
 {expr:'Pr(x_{t+1} | y_t) — 다음 입력의 조건부 분포, 매 스텝 y_t 로 파라미터화',
  tex:'\\Pr(x_{t+1}\\mid y_t)',
  d:'생성 전체가 이 한 조건부 분포를 반복 샘플링하는 것으로 정의된다. 텍스트에서는 문자 집합 위의 softmax, 손글씨에서는 아래 혼합분포다.'},
 {expr:'Pr(x_{t+1}|y_t) = Σ_j π_t^j N(x_{t+1} | μ_t^j, σ_t^j, ρ_t^j)  (stroke 미종료 시 (1-e_t) 곱)',
  tex:'\\Pr(x_{t+1}\\mid y_t)=\\sum_{j=1}^{M}\\pi_t^{j}\\,\\mathcal{N}\\!\\left(x_{t+1}\\mid \\mu_t^{j},\\sigma_t^{j},\\rho_t^{j}\\right)',
  d:'$M$ 개 이변량 가우시안의 혼합. 논문 실험에서는 $M=20$ 을 써서 스텝당 120개(가중치 20 + 평균 40 + 표준편차 40 + 상관 20) 혼합 파라미터를 출력한다.'},
 {expr:'φ(t,u) = Σ_k α_t^k exp(-β_t^k (κ_t^k - u)²),   w_t = Σ_u φ(t,u) c_u,   κ_t = κ_{t-1} + exp(κ̂_t)',
  tex:'\\begin{aligned}\\phi(t,u) &= \\sum_{k=1}^{K}\\alpha_t^{k}\\exp\\!\\left(-\\beta_t^{k}(\\kappa_t^{k}-u)^2\\right)\\\\ w_t &= \\sum_{u=1}^{U}\\phi(t,u)\\,c_u\\\\ \\kappa_t &= \\kappa_{t-1} + \\exp(\\hat\\kappa_t)\\end{aligned}',
  d:'$\\alpha,\\beta,\\kappa$ 는 각각 창의 중요도·폭·위치. $\\kappa_t$ 가 이전 값에 **양수 오프셋만** 더하도록 강제한 것이 문자열을 앞으로만 읽어 나가는 단조 정렬을 만든다.'}
],

numbers:[
 {k:'Penn Treebank BPC', v:'1.24', d:'문자 단위 예측, weight noise 정규화 + 동적 평가 적용 시'},
 {k:'Hutter Prize BPC', v:'1.33', d:'검증셋, 동적 평가 적용 시. PAQ-8 압축기(1.28)에 근접'},
 {k:'Wikipedia 네트워크 규모', v:'7층 × 700 LSTM', d:'약 2130만 가중치, 최대 1만 문자 전의 문맥까지 참조'},
 {k:'손글씨 예측 네트워크', v:'3층 × 400 LSTM', d:'약 340만 가중치, 20개 가우시안 혼합'},
 {k:'손글씨 합성 네트워크', v:'약 370만 가중치', d:'window에 10개 가우시안 커널 추가'},
 {k:'IAM-OnDB 규모', v:'필기 궤적 다수 · 문자 알파벳 57종', d:'라틴 문자 + 숫자 + 구두점 부분집합'}
],

impact:'자기회귀 생성이 "다음 토큰 하나를 잘 예측하는 것만으로" 임의 길이의 그럴듯한 시퀀스를 만들 수 있다는 것을 텍스트와 손글씨 양쪽에서 실증했다. 이는 이후 문자 단위 언어모델 연구와 [seq2seq](#/p/seq2seq) 계열의 생성 방식에 직접적인 선례가 되었다. 손글씨 합성에 쓰인 soft window는 "디코더가 인코더 시퀀스 위의 위치를 학습된 커널로 정렬한다"는 아이디어를 먼저 보여줘, 몇 달 뒤 나온 [Bahdanau attention](#/p/bahdanau)의 문제의식과 맞닿아 있다.',

legacy:[
 '자기회귀 샘플링 루프는 이후 문자·바이트 단위 언어모델과 오디오 생성([WaveNet](#/p/wavenet) 계열)의 표준 학습·생성 방식으로 이어졌다',
 '위치 기반 soft window는 콘텐츠 기반 [Bahdanau attention](#/p/bahdanau)으로 대체되며 seq2seq의 정렬 문제를 더 일반적으로 풀게 됐다',
 'Mixture Density Output은 연속값을 다봉분포로 예측해야 하는 궤적·모션 생성 작업에서 지금도 쓰이는 표준 출력 형식이다',
 '"동적 평가"(테스트 중 가중치를 계속 갱신)로 장기 의존성 이득을 보인 실험은 이후 문맥 적응·온라인 학습 논의의 초기 근거로 인용된다'
],

pitfalls:[
 '**이 논문의 attention은 Bahdanau attention과 메커니즘이 다르다.** soft window는 Query-Key 내적이 아니라 위치 파라미터 $\\kappa_t$ 의 단조 이동으로 정렬을 만든다 — "attention의 전신"이지 attention 자체가 아니다.',
 '**BPC 수치는 데이터 전처리에 민감하다.** Hutter Prize 결과(1.33)는 원본 XML·마크업이 포함된 바이트 스트림 기준이고, 텍스트만 남긴 버전(1.54)과 직접 비교할 수 없다.',
 '**손글씨 합성 결과는 진짜 held-out 테스트가 아니다.** 논문 스스로 "독립된 test set이 없어 validation set에 과적합됐을 수 있다"고 명시한다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'세로축이 층(입력 → LSTM 스택 → 출력), 가로축이 시간 $t-1,t,t+1$. 곡선 화살표는 각 은닉층 내부의 순환 연결이고, 점선은 그 시점 출력이 다음 시점 입력에 대한 예측 분포임을 뜻한다. 입력이 모든 은닉층에, 모든 은닉층이 출력에 직접 연결된 것(skip 연결)이 눈여겨볼 지점.',
  src:'원문 Figure 1, p.3'},
 {f:'fig13-window-alignment.png',
  cap:'세로축이 문자열("Thought that the muster from"), 가로축이 펜 궤적의 시간 스텝. 밝은 대각선이 매 순간 네트워크가 "쓰고 있다"고 믿는 문자 $\\phi(t,u)$ 이고, 대각선이 항상 우상향한다는 점이 $\\kappa_t$ 를 양의 오프셋으로 제약한 결과다. 글자 경계에서 선이 퍼지는 것은 전환 구간에서 앞뒤 문자 정보를 동시에 참조한다는 뜻.',
  src:'원문 Figure 13, p.28'}
],

quotes:[
 {t:'This paper shows how Long Short-term Memory recurrent neural networks can be used to generate complex sequences with long-range structure, simply by predicting one data point at a time.',
  src:'Abstract, p.1'},
 {t:'Using offsets was essential to getting the network to align the text with the pen trace.',
  src:'Section 5.1, p.26'}
],

links:[
 {t:'arXiv 1308.0850 — Generating Sequences With Recurrent Neural Networks', u:'https://arxiv.org/abs/1308.0850'},
 {t:'Alex Graves 홈페이지', u:'https://www.cs.toronto.edu/~graves/'}
]
});
