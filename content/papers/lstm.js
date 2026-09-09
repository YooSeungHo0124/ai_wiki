WIKI.paper({
slug:'lstm',
venue:'Neural Computation 9(8), 1997',
authors:'Hochreiter & Schmidhuber (TU München · IDSIA)',

tldr:'RNN이 긴 시퀀스를 학습하지 못하는 이유가 **역전파 도중 gradient가 지수적으로 죽거나 폭발하기 때문**임을 정면으로 다루고, 곱셈 게이트로 감싼 선형 메모리 셀(constant error carousel)을 도입해 1000 스텝 이상의 시간 지연을 학습 가능하게 만든 논문. 이후 20년간 시퀀스 모델의 기본 부품이 되었다.',

context:'1990년대 초 RNN은 이론적으로는 임의 길이의 문맥을 담을 수 있었지만 실제로는 10 스텝 남짓만 기억했다. 원인은 [역전파](#/p/backprop)를 시간 축으로 펼친 BPTT의 구조 자체에 있다. $t$ 시점의 오차를 $t-k$ 시점으로 보내려면 매 스텝의 야코비안을 $k$ 번 곱해야 하는데, 그 곱이 1보다 작으면 오차가 지수적으로 0으로 수렴하고(vanishing) 1보다 크면 발산한다(exploding). Hochreiter의 1991년 학위논문과 Bengio 등의 1994년 분석이 이것을 수식으로 못박았고, 그 뒤로 나온 처방들(시간 상수 고정, 계층적 압축, 2차 최적화)은 모두 부분적이었다. 이 논문의 접근은 다르다 — **오차가 지나가는 경로 자체를 곱셈이 없는 항등 경로로 설계한다.**',

ideas:[
 {h:'CEC: 오차가 감쇠하지 않는 항등 경로',
  lead:'자기순환 가중치 1의 항등 경로로 야코비안을 1에 고정해 오차를 보존한다.',
  d:'메모리 셀 내부에 자기 자신으로 되돌아가는 가중치 1.0, 활성함수 항등(identity)인 순환 연결을 둔다. 이 경로에서는 야코비안이 정확히 1이므로 오차가 몇 스텝을 지나도 크기가 변하지 않는다. 저자들은 이것을 **constant error carousel**이라 불렀다. LSTM의 나머지 부품은 전부 "이 회전목마에 언제 태우고 언제 내릴 것인가"를 제어하기 위한 장치다.'},
 {h:'곱셈 게이트: 쓰기·읽기를 학습으로 제어',
  lead:'입력·출력 게이트를 곱해 무차별 누적과 상호 간섭을 막는다.',
  d:'항등 경로만 있으면 셀은 들어오는 모든 신호를 무차별적으로 누적해 금방 포화한다. 그래서 입력에 **input gate**를, 출력에 **output gate**를 곱한다. 게이트는 sigmoid 출력(0~1)을 내는 별도의 유닛으로, 0이면 차단 1이면 통과다. 게이트가 닫혀 있는 동안 셀 값은 그대로 보존되고, 관련 없는 입력이 기존 기억을 덮어쓰는 **input weight conflict**와, 지금 필요 없는 기억이 다른 유닛을 교란하는 **output weight conflict**가 동시에 해결된다.'},
 {h:'게이트가 곧 미분 가능한 read/write 명령',
  lead:'게이트 값을 데이터로부터 학습해 미분 가능한 메모리 제어를 만든다.',
  d:'게이트 값은 하드코딩이 아니라 현재 입력과 이전 상태로부터 계산되고, 전체가 미분 가능하므로 gradient descent로 학습된다. 즉 "이 토큰을 기억해 둬라", "이제 꺼내 써라"라는 제어 신호를 데이터로부터 배운다. 명시적 메모리 접근을 미분 가능하게 만든다는 이 발상은 훗날 attention과 메모리 네트워크로 이어진다.'},
 {h:'셀을 묶는 memory block과 절단된 gradient',
  lead:'블록 단위로 게이트를 공유하고 truncated BPTT로 계산량을 O(1)로 유지한다.',
  d:'여러 셀이 게이트를 공유하는 memory block 단위로 구성해 파라미터를 줄인다. 학습에서는 게이트를 통과해 CEC 바깥으로 나가는 gradient를 잘라내는 **truncated BPTT**를 쓴다. 덕분에 시간 스텝·가중치당 계산량이 $O(1)$ 로 유지되어, 당시 경쟁 기법이던 RTRL($O(W^2)$)과 달리 온라인 학습이 가능했다.'},
 {h:'forget gate는 원 논문에 없다',
  lead:'표준 3-게이트의 forget gate는 1999~2000년 후속 연구가 추가했다.',
  d:'오늘날 표준으로 쓰는 3-게이트 LSTM($f, i, o$)의 forget gate는 1997년 논문에 없다. Gers·Schmidhuber·Cummins가 1999–2000년에 추가한 것으로, 끝나지 않는 스트림에서 셀 상태가 무한히 커지는 문제를 막기 위한 장치다. peephole 연결도 마찬가지로 후속 연구의 산물이다.'}
],

diagram:{type:'compare', cap:'바닐라 RNN과 LSTM의 차이는 "상태가 매 스텝 행렬곱을 통과하는가"이다.',
 left:{t:'기존: 바닐라 RNN', items:[
  'h_t = tanh(W·[h_{t-1}, x_t])',
  '상태가 매 스텝 W와 tanh를 통과',
  '오차 역전파 = 야코비안의 k제곱',
  '10 스텝 넘으면 gradient 소멸',
  '기억할지 말지를 제어할 수단 없음']},
 right:{t:'LSTM: 게이트 + CEC', items:[
  'c_t = c_{t-1} + i_t ⊙ g_t (덧셈)',
  '셀 경로의 야코비안 = 1 (CEC)',
  '1000 스텝 이상 오차 전달',
  '게이트로 read·write 제어',
  '가중치당 O(1) 업데이트']}},

math:[
 {expr:'∂E/∂c_t  →  ∂E/∂c_{t-k}  :  야코비안 곱 = 1^k = 1',
  tex:'\\dfrac{\\partial E}{\\partial c_{t-k}} = \\left(\\dfrac{\\partial c_t}{\\partial c_{t-1}}\\right)^{k}\\dfrac{\\partial E}{\\partial c_t} = 1^{k}\\,\\dfrac{\\partial E}{\\partial c_t}',
  d:'바닐라 RNN에서는 이 자리에 $\\prod W^T \\mathrm{diag}(\\sigma\')$ 가 들어가 지수적으로 0 또는 ∞로 간다. CEC는 그 곱을 1로 고정해 소멸/폭발 자체를 없앤다.'},
 {expr:'c_t = c_{t-1} + i_t ⊙ g_t,   h_t = o_t ⊙ h(c_t)',
  tex:'c_t = c_{t-1} + i_t \\odot g_t,\\quad h_t = o_t \\odot h(c_t)',
  d:'1997년 원형의 셀 갱신. 상태 누적이 **덧셈**이라는 점이 핵심이며, 이 구조는 훗날 [ResNet](#/p/resnet)의 residual 연결이 깊이 방향에서 하는 일과 정확히 같다.'},
 {expr:'i_t = σ(W_i·[h_{t-1}, x_t] + b_i),   o_t = σ(W_o·[h_{t-1}, x_t] + b_o)',
  tex:'i_t=\\sigma(W_i[h_{t-1},x_t]+b_i),\\quad o_t=\\sigma(W_o[h_{t-1},x_t]+b_o)',
  d:'게이트는 sigmoid라 0~1 사이의 연속값이다. 이산적 on/off가 아니라 **부분적으로 열 수 있는 밸브**이기 때문에 미분 가능하고 gradient descent로 학습된다.'}
],

numbers:[
 {k:'학습 가능한 시간 지연', v:'1000 스텝 초과', d:'논문 초록의 주장 — "minimal time lags in excess of 1000 discrete-time steps"'},
 {k:'업데이트 복잡도', v:'O(1) / 가중치 · 스텝', d:'시간과 공간에 대해 local. RTRL의 $O(W^2)$ 대비 온라인 학습 가능'},
 {k:'원형의 게이트 수', v:'2개', d:'input · output. **forget gate는 1999–2000년 후속 논문에서 추가**'},
 {k:'CEC 자기 순환 가중치', v:'1.0', d:'활성함수는 항등 — 이 두 조건이 오차 보존의 전부'},
 {k:'게재', v:'Neural Computation 9(8), 1735–1780', d:'1997년. 딥러닝 유행보다 15년 앞섰다'}
],

impact:'단기적으로는 조용했다. 1997년에는 데이터도 GPU도 없어서 LSTM이 이길 만한 벤치마크 자체가 드물었다. 폭발은 2013년 이후에 왔다 — 음성 인식, 필기 인식, 언어 모델링이 차례로 LSTM으로 넘어갔고, [seq2seq](#/p/seq2seq)가 기계번역을 통째로 신경망으로 옮기면서 산업 표준이 되었다. 더 오래 남은 것은 구조적 교훈이다. **"상태를 곱셈으로 갱신하지 말고 덧셈으로 누적하되, 게이트로 흐름을 제어하라"** 는 원칙은 [ResNet](#/p/resnet)의 skip connection, Transformer의 residual 경로, [Mamba](#/p/mamba)의 선택적 상태 갱신까지 형태를 바꿔 계속 재등장한다.',

legacy:[
 '**시퀀스 학습의 실용화** — [seq2seq](#/p/seq2seq)와 [Bahdanau attention](#/p/bahdanau)이 전부 LSTM 위에 지어졌고, 그 연장선에서 [Transformer](#/p/transformer)가 나왔다',
 '**문맥 임베딩의 출발점** — [ELMo](#/p/elmo)는 양방향 LSTM 언어모델의 내부 상태를 단어 표현으로 꺼내 쓰면서 "사전학습 후 전이"라는 흐름을 열었다',
 '**대규모 게이트 구조** — [Sparse MoE](#/p/moe-shazeer)의 최초 실험 무대가 LSTM 층 사이였다는 점에서, 조건부 계산 연구도 여기서 시작한다',
 '**RNN의 귀환** — [S4](#/p/s4), [Mamba](#/p/mamba), [RWKV](#/p/rwkv)는 "attention의 $O(n^2)$ 대신 상태를 순차 갱신한다"는 LSTM의 문제 설정을 현대적 형태로 다시 꺼낸 것이다'
],

pitfalls:[
 '**교과서의 3-게이트 그림은 1997년 논문이 아니다.** 원 논문은 input·output 두 게이트뿐이고 forget gate와 peephole은 후속 연구다. "LSTM 논문에 나온다"고 인용할 때 자주 틀리는 지점이다.',
 '**LSTM은 gradient 소멸을 "완화"하지 "제거"하지 않는다.** 오차가 보존되는 것은 셀 경로 한정이고, 게이트를 거쳐 입력 가중치로 흘러가는 gradient는 여전히 감쇠한다. 게다가 exploding gradient는 전혀 해결되지 않아서 실무에서는 gradient clipping이 사실상 필수다.',
 '**길게 기억한다 ≠ 긴 문맥을 잘 쓴다.** 고정 크기 상태 벡터에 과거 전부를 눌러 담는 구조는 그대로다. 이 한계가 [seq2seq](#/p/seq2seq)에서 고정 길이 벡터 병목으로 다시 드러난다.'
],

figures:[
 {f:'fig1-memory-cell.png',
  cap:'가운데 큰 사각형이 메모리 셀. 안쪽의 원형 화살표(가중치 1.0)가 CEC — 자기 자신에게 그대로 되돌아가는 항등 경로다. 셀 왼쪽의 $g$ 가 입력 변조, 셀에 들어가기 직전 검은 점이 input gate($y^{in_j}$)와의 곱셈, 셀을 나간 뒤 $h$ 와 검은 점이 output gate($y^{out_j}$)와의 곱셈이다. 아래쪽 두 개의 작은 원이 게이트 자신의 유닛인데, **forget gate는 아예 없다** — 왼쪽 input gate와 오른쪽 output gate, 딱 둘뿐이다.',
  src:'원문 Figure 1, p.7'}
],

quotes:[
 {t:'Learning to store information over extended time intervals via recurrent backpropagation takes a very long time, mostly due to insufficient, decaying error backflow.',
  src:'Abstract, p.1'}
],

links:[
 {t:'Long Short-Term Memory (Neural Computation, 1997)', u:'https://direct.mit.edu/neco/article/9/8/1735/6109/Long-Short-Term-Memory'},
 {t:'Learning to Forget: Continual Prediction with LSTM (Gers et al., 2000) — forget gate', u:'https://direct.mit.edu/neco/article/12/10/2451/6415'},
 {t:'Understanding LSTM Networks (Christopher Olah)', u:'https://colah.github.io/posts/2015-08-Understanding-LSTMs/'}
]
});
