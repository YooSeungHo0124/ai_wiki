WIKI.paper({
slug:'ntm',
venue:'arXiv 2014',
authors:'Graves, Wayne, Danihelka (Google DeepMind)',
arxiv:'1410.5401',

tldr:'신경망 controller 에 **미분 가능한 외부 메모리**와 읽기/쓰기 헤드를 붙여, 역전파만으로 복사·정렬 같은 알고리즘을 배우게 만든 논문. RNN의 은닉 상태에 갇혀 있던 "기억"을 별도의 주소 지정 가능한 저장소로 떼어냈다.',

context:'2014년의 [LSTM](#/p/lstm) 은 시퀀스를 잘 기억하지만, 그 기억은 고정 크기 은닉 벡터 안에 뭉개져 있다. 파라미터 수를 늘리지 않고는 저장 용량을 늘릴 수 없고, 정보를 특정 "칸"에 정확히 쓰고 나중에 그 칸만 읽는 식의 변수 결합(variable-binding)이 근본적으로 서툴다. 튜링 머신은 이 문제를 무한 테이프와 헤드로 풀지만 이산적이라 미분이 안 된다. 저자들의 질문은 — **읽기/쓰기 위치를 이산 선택이 아니라 메모리 전체에 대한 연속적인 가중치 분포로 두면, 역전파로 주소 지정 자체를 학습할 수 있지 않을까**다.',

ideas:[
 {h:'블러리(blurry) 읽기/쓰기: 주소를 확률 분포로',
  lead:'한 칸을 딱 찍는 대신 전체 메모리에 대한 정규화된 가중치로 흐릿하게 읽고 쓴다.',
  d:'메모리는 $N\\times M$ 행렬이고, 헤드는 $\\sum_i w_t(i)=1$ 인 가중치 벡터 $w_t$ 를 만든다. 읽기는 이 가중치로 메모리 행들을 볼록결합해 값을 얻고, 쓰기는 지우기(erase)와 더하기(add) 두 벡터로 각 위치를 갱신한다. 모든 연산이 가중치와 메모리에 대해 미분 가능하므로, 어디를 얼마나 강하게 볼지 자체가 gradient descent 로 학습된다.'},
 {h:'내용 기반 주소 지정: 키로 유사한 칸을 찾는다',
  lead:'저장할 때 쓴 키와 코사인 유사도가 높은 메모리 행에 가중치를 몰아준다.',
  d:'헤드가 키 벡터 $k_t$ 와 세기 $\\beta_t$ 를 내면, 메모리의 각 행과 코사인 유사도를 계산해 softmax 로 정규화한다. 연상 회상(associative recall)처럼 "이런 내용을 가진 칸을 찾아라"는 과제에 필요한 메커니즘이며, [Bahdanau attention](#/p/bahdanau)의 query-key 유사도 계산과 사실상 동일한 형태다.'},
 {h:'위치 기반 주소 지정: 회전 이동으로 순회한다',
  lead:'보간 게이트와 순환 shift 로 "다음 칸으로 한 칸씩" 같은 반복 접근을 가능하게 한다.',
  d:'내용만으로는 "이전에 쓴 순서대로 하나씩 읽어라" 같은 순수 반복 작업을 표현하기 어렵다. 보간 게이트 $g_t$ 로 이전 스텝 가중치와 이번 내용 기반 가중치를 섞고, shift 분포로 그 가중치를 원형으로 회전시킨 뒤, 샤프닝 계수 $\\gamma_t$ 로 분포가 시간이 지나며 뭉개지는 것을 막는다. 내용 기반과 위치 기반을 같이 쓰는 이유는 두 종류의 과제(연상 검색 vs 순차 반복)가 서로 다른 메커니즘을 요구하기 때문이다.'},
 {h:'controller는 feedforward 또는 LSTM 둘 다 가능',
  lead:'메모리가 상태를 대신 들고 있으므로 controller 자체는 순환이 없어도 된다.',
  d:'LSTM controller 는 자체 은닉 상태로도 정보를 나를 수 있지만, feedforward controller 는 오직 메모리를 통해서만 시간을 가로질러 정보를 전달한다. 실험에서 두 controller 모두 일반 LSTM보다 크게 나은 일반화를 보여, "기억"이 controller 파라미터가 아니라 메모리 구조 자체에서 나온다는 것을 입증한다.'},
 {h:'파라미터 수가 메모리 크기와 독립적이다',
  lead:'메모리 위치 $N$ 을 늘려도 controller 파라미터 수는 그대로다.',
  d:'표준 RNN/LSTM은 은닉 유닛 수를 늘리면(=기억 용량을 늘리면) 순환 가중치가 유닛 수의 제곱으로 늘어난다. NTM 은 메모리 행렬 크기 $N\\times M$ 을 독립적으로 키울 수 있어, 학습된 알고리즘을 더 긴 테이프에도 그대로 적용하는 일반화가 가능해진다.'}
],

diagram:{type:'stack', cap:'controller가 입출력을 처리하며 read/write head를 통해서만 메모리와 상호작용한다. 점선이 미분 가능한 회로의 경계.',
 layers:[
  {t:'외부 입력', s:'매 시점 벡터'},
  {t:'Controller', s:'FF 또는 LSTM', acc:true, note:'헤드 파라미터 산출'},
  {t:'Read Head', s:'가중치 → 읽기벡터'},
  {t:'Write Head', s:'erase + add 벡터'},
  {t:'Memory', s:'N×M 행렬', note:'외부 상태 저장소'}
 ]},

math:[
 {expr:'r_t = Σ_i w_t(i) M_t(i)',
  tex:'\\mathbf{r}_t \\longleftarrow \\sum_i w_t(i)\\,\\mathbf{M}_t(i)',
  d:'읽기 벡터는 가중치로 메모리 행들을 볼록결합한 것 — 가중치가 $w_t(i)=1$ 인 한 칸에 집중하면 정확히 그 칸을 읽는 이산 주소 지정으로 수렴한다.'},
 {expr:'M̃_t(i)=M_{t-1}(i)[1-w_t(i)e_t],  M_t(i)=M̃_t(i)+w_t(i)a_t',
  tex:'\\tilde{\\mathbf{M}}_t(i) \\leftarrow \\mathbf{M}_{t-1}(i)\\left[\\mathbf{1}-w_t(i)\\mathbf{e}_t\\right],\\qquad \\mathbf{M}_t(i) \\leftarrow \\tilde{\\mathbf{M}}_t(i)+w_t(i)\\mathbf{a}_t',
  d:'LSTM의 forget/input 게이트에서 착안한 지우기·더하기 분해. 가중치와 지우기 벡터가 둘 다 1일 때만 완전히 리셋되고, 나머지는 부분적으로만 바뀐다.'},
 {expr:'w_t^c(i) = exp(β_t K[k_t, M_t(i)]) / Σ_j exp(β_t K[k_t, M_t(j)]),  K[u,v]=u·v/(‖u‖‖v‖)',
  tex:'w_t^{c}(i) = \\frac{\\exp\\!\\big(\\beta_t K[\\mathbf{k}_t,\\mathbf{M}_t(i)]\\big)}{\\sum_j \\exp\\!\\big(\\beta_t K[\\mathbf{k}_t,\\mathbf{M}_t(j)]\\big)},\\qquad K[\\mathbf{u},\\mathbf{v}]=\\frac{\\mathbf{u}\\cdot\\mathbf{v}}{\\lVert\\mathbf{u}\\rVert\\,\\lVert\\mathbf{v}\\rVert}',
  d:'키와 각 메모리 행의 코사인 유사도를 softmax 로 정규화한 것 — Q·K를 스케일해 softmax 를 취하는 [Transformer](#/p/transformer) attention과 형태가 사실상 같다.'}
],

numbers:[
 {k:'Copy 학습 길이', v:'8비트 × 1~20', d:'훈련 시퀀스 길이 범위'},
 {k:'Copy 일반화', v:'~120까지 유지', d:'메모리 128칸을 넘으면 순환 shift가 겹쳐 깨짐(각주 2)'},
 {k:'FF controller Copy 설정', v:'1 head · 은닉 100 · 128×20 메모리', d:'Table 1'},
 {k:'FF controller 파라미터', v:'17,162', d:'Copy 과제, Table 1'},
 {k:'LSTM 비교 파라미터', v:'1,352,969', d:'같은 Copy 과제의 순수 LSTM(3×256), Table 3 — NTM의 약 80배'},
 {k:'과제 종류', v:'5개', d:'Copy · Repeat Copy · Associative Recall · Dynamic N-Grams · Priority Sort'}
],

impact:'NTM 은 신경망이 스스로 "포인터를 옮기고, 칸에 쓰고, 나중에 그 칸을 다시 찾아 읽는" 절차를 gradient 만으로 익힐 수 있음을 보였다. Copy 과제에서 학습된 head 이동 패턴을 분석하자 실제로 "처음 위치로 이동 → 순차적으로 쓰기 → 처음 위치로 복귀 → 순차적으로 읽기"라는, 사람이 짤 법한 저수준 프로그램과 같은 패턴이 나타났다. 이는 신경망이 파라미터 자체가 아니라 **외부에 명시적으로 분리된 상태**를 조작하는 방식으로도 알고리즘을 표현할 수 있다는 증거였고, 이후 몇 년간 미분 가능한 메모리·컨트롤러 계열 연구의 출발점이 되었다.',

legacy:[
 '**주소 지정을 학습한다는 아이디어** — 같은 시기 [Memory Networks](#/p/memory-networks)는 메모리를 정적으로 두고 attention만 학습하는 대안 노선을 취했고, NTM은 쓰기와 주소 지정 규칙 자체를 학습한다는 점에서 갈라졌다',
 '**Differentiable Neural Computer** — 저자들이 직접 후속작으로 발전시켜 메모리 재사용·연결 추적 등을 추가',
 '**End-to-End Memory Networks** 등 완화된 attention-메모리 결합이 이후 QA·독해 모델의 표준 부품이 됨',
 '**content+location 주소 지정의 흔적** — 유사도 기반 검색과 순차 이동을 함께 쓰는 설계는 이후 여러 외부 메모리·검색 증강 모델에 재등장'
],

pitfalls:[
 '**"메모리가 크면 무조건 좋다"가 아니다.** shift 기반 위치 주소 지정은 메모리 크기(논문 실험 128칸)를 넘어서면 원형으로 감겨 이전에 쓴 내용을 덮어써 버린다.',
 '**LSTM controller 가 항상 더 강한 것은 아니다.** 논문 자체에서 feedforward controller 가 일부 과제(Associative Recall 등)에서 LSTM controller 보다 더 빠르고 잘 일반화한다 — 기억을 controller 상태가 아니라 메모리가 담당하기 때문.',
 '**"이산 튜링 머신을 그대로 미분 가능하게 만들었다"는 과장이다.** 실제로는 모든 주소를 매 스텝 확률적으로 흐리게 섞는 근사이며, 학습이 진행되며 그 분포가 한 칸에 가깝게 뾰족해지길(sharpening) 바라는 설계다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'controller는 external input/output만 다루고, 메모리에는 항상 Read Heads / Write Heads를 거쳐서만 접근한다. 점선 상자가 전체 회로의 미분 가능한 경계.',
  src:'원문 Figure 1, p.5'},
 {f:'fig3-copy-curves.png',
  cap:'x축이 학습에 사용한 시퀀스 수(천 단위), y축이 시퀀스당 비용(bits). LSTM(파랑)은 100만 개를 봐도 완전히 수렴하지 못하는데 NTM 둘 다(초록·빨강) 수만 개 만에 거의 0으로 떨어진다.',
  src:'원문 Figure 3, p.11'}
],

quotes:[
 {t:'We extend the capabilities of neural networks by coupling them to external memory resources, which they can interact with by attentional processes.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1410.5401 — Neural Turing Machines', u:'https://arxiv.org/abs/1410.5401'}
]
});
