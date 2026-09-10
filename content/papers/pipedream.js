WIKI.paper({
slug:'pipedream',
venue:'SOSP 2019 (arXiv 2018)',
authors:'Harlap, Narayanan, Phanishayee, Seshadri, Devanur, Ganger, Gibbons (Microsoft Research · CMU · Stanford)',
arxiv:'1806.03377',

tldr:'DNN 층을 여러 GPU에 스테이지로 나누고 **1F1B(one-forward-one-backward) 스케줄과 weight stashing**으로 파이프라인 버블을 없앤 시스템. 통신량을 데이터 병렬 대비 최대 95% 줄이면서 최대 5배 빠른 목표 정확도 도달을 보였다.',

context:'2018년 데이터 병렬 학습은 워커마다 모델 전체를 복제하고 매 스텝 기울기를 전부 동기화해야 해서, 통신량이 모델 크기에 비례했다. 저자들의 실측(Figure 1)에 따르면 VGG-16은 통신 오버헤드가 전체 학습 시간의 최대 85%까지 차지했고, GPU 세대가 Kepler→Pascal→Volta로 빨라질수록 연산은 짧아지는데 통신은 그대로라 병목이 더 심해졌다. 전통적 모델 병렬은 층을 워커별로 나눠 통신량은 줄이지만, 한 순간엔 하나의 워커만 활성화되거나(층별 분배) 계산과 통신을 겹칠 수 없어(층 내부 분할) 자원을 놀린다. [Krizhevsky의 관찰](#/p/one-weird-trick)이 층 종류에 따라 병렬화를 바꾸라고 했다면, PipeDream은 여기에 **파이프라이닝**이라는 시간 축을 더한다.',

ideas:[
 {h:'프로파일링 기반 자동 스테이지 분할',
  lead:'짧은 프로파일링 실행으로 층별 연산·통신 시간을 재고 동적계획법으로 최적 분할을 찾는다.',
  d:'PipeDream은 학습 전 일부 미니배치로 각 층의 연산 시간 $T_l$과 통신량 $a_l$을 측정한다. 이후 DP 알고리즘(시간복잡도 $O(N^2M^2)$)으로 층 시퀀스를 $M$대 머신에 스테이지로 쪼개되, 가장 느린 스테이지의 시간을 최소화하는 분할을 찾는다. 한 스테이지가 유독 느리면 그 스테이지만 데이터 병렬로 복제해 균형을 맞춘다(예: VGG16을 "9-5-1-1"처럼 비대칭 복제).'},
 {h:'1F1B: 순방향과 역방향을 번갈아 채운다',
  lead:'각 GPU가 항상 forward 아니면 backward 일감을 갖도록 스케줄링해 파이프라인 버블을 없앤다.',
  d:'시작 단계(startup)에서 입력 스테이지가 NOAM개(파이프라인을 채우는 데 필요한 최소 미니배치 수)의 미니배치를 밀어 넣는다. 이후 정상 상태(steady state)에서는 모든 GPU가 한 미니배치의 forward와 다른 미니배치의 backward를 번갈아 수행해 유휴 시간이 없다. forward보다 backward가 항상 더 오래 걸려도 이 스케줄은 그대로 작동한다.'},
 {h:'Weight stashing: 버전이 섞인 기울기를 막는다',
  lead:'같은 미니배치의 forward·backward가 항상 같은 가중치 버전을 쓰도록 스테이지마다 여러 버전을 보관한다.',
  d:'파이프라인이 깊으면 한 미니배치의 forward를 계산한 시점과 backward를 계산하는 시점 사이에 다른 미니배치들의 가중치 갱신이 여러 번 끼어든다. 순진하게 최신 가중치로 backward를 계산하면 forward 때와 다른 가중치로 기울기를 구하는 셈이 되어 수렴이 깨진다. PipeDream은 미니배치가 진입한 시점의 가중치 버전을 그 미니배치가 파이프라인을 통과하는 내내 보관해뒀다가 backward에 그대로 재사용한다.'},
 {h:'그래도 남는 대가: 스테이지 간 버전 불일치',
  lead:'weight stashing은 한 스테이지 내부의 일관성만 보장하고, 스테이지 사이의 버전 차이는 남는다.',
  d:'weight stashing은 스테이지 $n$의 기울기가 $n$스텝 지연된 가중치로 계산되게 만들 뿐, 스테이지들 사이의 가중치 버전이 서로 다르다는 점은 그대로다. 이를 완전히 없애려는 "vertical sync"(모든 스테이지가 같은 버전을 쓰도록 강제) 옵션도 설계했지만, 저자들은 실험적으로 그 효과가 미미해 기본 설정에서는 끈다 — PipeDream의 기본값은 순수 단일머신 SGD와 완전 동기 데이터 병렬 사이 어딘가의 근사다.'}
],

diagram:{type:'stack', cap:'PipeDream이 한 미니배치를 처리할 때 지나는 파이프라인 스테이지 — 아래가 입력, 위로 갈수록 forward가 진행되고 backward는 반대로 내려온다.',
 layers:[
  {t:'입력 스테이지', s:'GPU 1, NOAM개 투입'},
  {t:'스테이지 2', s:'프로파일 기반 분할'},
  {t:'1F1B 스케줄', s:'forward/backward 교대', acc:true, note:'GPU 유휴시간 제거'},
  {t:'weight 스태싱', s:'미니배치별 버전 보관', note:'forward=backward 가중치 고정'},
  {t:'출력 스테이지', s:'loss 계산 후 역전파 시작'}
 ]},

math:[
 {expr:'w(t+1) = w(t) − ν · ∇f(w1(t−n+1), w2(t−n+2), …, wn(t))',
  tex:'w^{(t+1)}=w^{(t)}-\\nu\\cdot\\nabla f\\!\\left(w_1^{(t-n+1)},\\,w_2^{(t-n+2)},\\,\\dots,\\,w_n^{(t)}\\right)',
  d:'weight stashing을 적용했을 때의 실제 가중치 갱신식. 스테이지 $n$개 파이프라인에서 스테이지 1의 기울기는 $n-1$스텝 지연된 가중치로, 스테이지 $n$(출력)은 지연 없는 최신 가중치로 계산된다 — 표준 SGD($w^{(t+1)}=w^{(t)}-\\nu\\nabla f(w_1^{(t)},\\dots,w_n^{(t)})$)와 다른, 하지만 유효한 근사적 갱신이다.'}
],

numbers:[
 {k:'VGG16, 8-GPU, Cluster-B', v:'BSP 대비 5.12배', d:'통신량 95% 감소, 목표 정확도까지 시간 기준'},
 {k:'AlexNet 계열 speedup', v:'최대 6.76배', d:'5개 모델 중 가장 큰 개선폭(Abstract·Introduction)'},
 {k:'VGG16 통신 오버헤드(BSP)', v:'최대 85%', d:'Figure 1, K80 GPU·다수 워커 조건에서 전체 학습시간 대비'},
 {k:'S2VT(비디오 캡셔닝), 4-GPU', v:'BSP 대비 3.01배', d:'MSVD 데이터셋, RNN 계열 모델에서도 효과 확인'},
 {k:'Inception-v3, 8-GPU Cluster-A', v:'BSP 대비 1.00배(개선 없음)', d:'통신 감소 0% — 이 모델은 원래 통신-계산 비율이 낮아 파이프라이닝 이득이 거의 없었던 사례'}
],

impact:'파이프라인 병렬을 DNN 학습에 처음으로 일반적·자동화된 형태로 적용해, "층을 어떻게 나눌지"를 사람이 아니라 프로파일러와 DP 알고리즘이 정하는 흐름을 열었다. 동시에 weight stashing이 보여준 "정확한 동기화를 포기하는 대신 처리량을 얻는다"는 트레이드오프는 이후 파이프라인 병렬 시스템 전반의 설계 축이 됐다.',

legacy:[
 '**[GPipe](#/p/gpipe)** — 같은 문제(파이프라인 버블)를 반대 방향으로 풀었다. GPipe는 미니배치를 마이크로배치로 쪼개고 **동기적으로 flush**해 가중치 버전 불일치를 원천적으로 없애는 대신 일부 버블을 감수하고, PipeDream은 weight stashing으로 비동기 처리량을 얻는 대신 버전 근사를 감수한다',
 '**1F1B 스케줄의 표준화** — 이후 [Megatron](#/p/megatron)의 파이프라인 병렬 구현, DeepSpeed 등 대부분의 파이프라인 병렬 시스템이 1F1B(또는 그 변형인 interleaved 1F1B)를 기본 스케줄로 채택',
 '**PipeDream-2BW/PipeDream-Flush(후속 연구)** — weight stashing의 메모리 비용을 줄이기 위해 이중 버퍼링(2BW)이나 주기적 flush 같은 절충안으로 발전',
 '**3D 병렬의 한 축으로 정착** — 데이터·텐서 병렬과 결합해 오늘날 초대형 모델 학습의 표준 구성요소가 됨'
],

pitfalls:[
 '**PipeDream 기본 설정은 엄밀한 SGD가 아니다.** weight stashing만 켠 기본 semantics는 단일 머신 SGD와 완전 동기 데이터 병렬 사이의 근사이며, 스테이지 간 가중치 버전 불일치는 vertical sync를 켜지 않는 한 그대로 남는다 — 논문도 이를 감춘 것이 아니라 4.4절에서 명시한다.',
 '**"파이프라인 병렬이면 항상 빠르다"가 아니다.** Inception-v3, Cluster-A 실험에서는 통신 감소가 0%였고 speedup도 1.00배(데이터 병렬과 동일)에 그쳤다 — 원래 통신-계산 비율이 낮은 모델·클러스터 조합에서는 이득이 거의 없다.',
 '**GPipe보다 먼저 나왔지만 같은 문제를 다른 트레이드오프로 푼다.** "PipeDream이 GPipe의 개선판"이라는 오해가 흔한데, 실제로는 동기화 엄밀성(GPipe) 대 처리량(PipeDream)이라는 서로 다른 설계 선택이다.'
],

figures:[
 {f:'fig8-1f1b-schedule.png',
  cap:'4대 머신의 시간대별 작업표. 숫자는 미니배치 번호, 파란=forward, 초록=backward, 빗금=유휴. 시작 구간(왼쪽)에서만 빗금이 보이고, steady state(오른쪽)로 넘어가면 모든 머신이 빈칸 없이 forward·backward를 번갈아 채운다 — 이것이 1F1B가 버블을 없앤다는 것의 직접적 증거다.',
  src:'원문 Figure 8, p.7'}
],

quotes:[
 {t:'PipeDream reduces communication by up to 95% for large DNNs relative to data-parallel training, and allows perfect overlap of communication and computation.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1806.03377 — PipeDream: Fast and Efficient Pipeline Parallel DNN Training', u:'https://arxiv.org/abs/1806.03377'},
 {t:'SOSP 2019 논문 페이지', u:'https://dl.acm.org/doi/10.1145/3341301.3359646'}
]
});
