WIKI.paper({
slug:'mamba2',
venue:'arXiv 2024 (Princeton · CMU)',
authors:'Tri Dao, Albert Gu',
arxiv:'2405.21060',

tldr:'[Mamba](#/p/mamba)의 선택적 SSM과 attention이 겉보기엔 다른 두 계열이 아니라 **구조화된 준분리(semiseparable) 행렬**이라는 같은 수학적 틀의 두 얼굴임을 증명한 논문. 이 이론적 다리(SSD)를 통해 SSM 커널을 행렬곱 중심으로 다시 짜서 Mamba의 스캔 구현보다 2-8배 빠른 Mamba-2를 만들었다.',

context:'[Mamba](#/p/mamba)는 선택적 SSM으로 [Transformer](#/p/transformer)에 맞먹는 언어모델 성능을 처음으로 보였지만, 그 스캔(scan) 기반 구현은 GPU의 행렬곱 전용 유닛(Tensor Core)을 거의 쓰지 못하는 순차적 연산이었다. Transformer 진영은 지난 수년간 [FlashAttention](#/p/flashattention) 같은 하드웨어 최적화, 텐서 병렬화, 스케일링 법칙 등 방대한 엔지니어링 생태계를 쌓아왔는데, SSM은 이 생태계와 단절된 채 독자적으로 발전해 왔다. 이 논문의 질문은 "SSM과 attention이 사실은 같은 수학적 대상이라면, attention을 위해 개발된 그 최적화 기법들을 SSM에도 그대로 옮길 수 있지 않을까"이다.',

ideas:[
 {h:'SSD: SSM과 attention을 잇는 이론적 다리',
  lead:'상태공간모델의 순차적 형태와 attention의 이차형 형태가 같은 준분리 행렬의 두 분해임을 보인다.',
  d:'SSM의 recurrence $h_t = A_t h_{t-1} + B_t x_t$ 를 행렬로 풀어 쓰면 $Y=MX$ 형태가 되는데, 이 $M$ 이 **1-준분리(semiseparable) 행렬**이다. 같은 $M$ 을 다르게 분해하면 선형시간 재귀 형태(SSM처럼)로도, $QK^\\top$ 마스킹 꼴의 이차시간 형태(attention처럼)로도 계산할 수 있다. 즉 SSM과 (마스킹된) 선형 attention은 서로 다른 모델이 아니라 **같은 행렬을 계산하는 두 가지 알고리즘**이다.'},
 {h:'구조화 마스크 attention(SMA)으로 일반화',
  lead:'softmax를 떼고 마스크 행렬 L을 곱하는 attention의 일반형에 SSM을 하나의 사례로 편입시킨다.',
  d:'표준 attention을 $M = QK^\\top$, $Y=MV$ 로 보는 대신, 여기에 구조화된 마스크 $L$ 을 elementwise로 곱한 $M = QK^\\top \\circ L$ 을 생각하면 Linear Attention·RetNet 같은 기존 변형들이 전부 이 틀 안에 들어간다. SSD(1-준분리 SMA)는 이 $L$ 이 준분리 구조를 갖는 특수 사례이며, 저자들은 **재귀 형태를 갖는 커널 attention은 반드시 SSM이어야 한다**는 역방향 증명까지 제시한다.'},
 {h:'블록 분해로 스캔과 행렬곱의 장점을 동시에',
  lead:'시퀀스를 청크로 나눠 청크 내부는 행렬곱으로, 청크 사이는 작은 재귀로 처리한다.',
  d:'순수 재귀(스캔)는 상태 크기에 선형이지만 병렬화가 안 되고, 순수 이차형은 병렬화는 잘 되지만 시퀀스 길이에 제곱으로 커진다. SSD 알고리즘은 시퀀스를 블록(청크) 단위로 잘라 **블록 내부는 $QK^\\top$ 이차형 행렬곱으로, 블록 사이 상태 전달은 작은 재귀로** 처리한다. 이렇게 하면 대부분의 연산이 GPU의 Tensor Core가 잘 하는 행렬곱이 되면서도, 상태 크기가 커져도 느려지지 않는다.'},
 {h:'Mamba-2 블록: attention의 관행을 SSM에 이식',
  lead:'A·B·C·X를 병렬 투영하고 head 개념·추가 정규화를 더해 텐서 병렬화가 되는 블록으로 재설계한다.',
  d:'Mamba-1은 SSM 입력 $X$ 를 먼저 만들고 그 함수로 $A,B,C$ 를 순차적으로 계산했다. Mamba-2는 attention의 $Q,K,V$ 처럼 $A,X,B,C$ 를 **한 번에 병렬 투영**해서 만들고, multi-head attention의 head 개념을 SSM에 대응시킨다(B·C를 여러 head가 공유하는 구조는 multi-value attention과 유사). 이 재설계 덕분에 Megatron 스타일 텐서 병렬화가 자연스럽게 적용된다.'}
],

diagram:{type:'compare', cap:'Mamba-1과 Mamba-2 블록의 차이. 이론적으로는 같은 SSD 프레임워크 안의 구현 선택이다.',
 left:{t:'Mamba (스캔)', items:['A,B,C가 X의 함수로 순차 계산','순수 재귀 스캔 커널','텐서 병렬화 어려움']},
 right:{t:'Mamba-2 (SSD)', items:['A,X,B,C를 한 번에 병렬 투영','청크 단위 행렬곱+재귀 혼합','추가 정규화로 대형 모델 안정화']}},

math:[
 {expr:'Y = M X,  M_ij = (a_i × ... × a_{j+1}) for i≥j, else 0   (순차/재귀 형태)',
  tex:'Y=MX,\\qquad M_{ij}=\\begin{cases}a_i\\times\\cdots\\times a_{j+1} & i\\ge j\\\\ 0 & i<j\\end{cases}',
  d:'SSM recurrence를 행렬로 풀어 쓴 형태. $M$ 이 1-준분리 행렬이라는 것이 SSD의 핵심 관찰이다. 이 $M$ 을 만드는 방법이 여러 개면, 그만큼 계산 알고리즘도 여러 개가 된다.'},
 {expr:'(L ∘ QKᵀ) · V   (이차형/attention 형태, 같은 M을 다르게 계산)',
  tex:'(L\\circ QK^{\\top})\\cdot V',
  d:'같은 $M$ 을 attention과 같은 $QK^\\top$ 형태에 데이터 종속 마스크 $L$ 을 곱한 것으로도 쓸 수 있다. softmax가 없고 $L$ 이 곱해진다는 점이 표준 attention과 다르다 — $L$ 은 학습된 위치 인코딩이 아니라 **입력에 따라 결정되는 위치 마스크**로 볼 수 있다.'}
],

numbers:[
 {k:'커널 속도', v:'2-8×', d:'Mamba의 최적화된 selective scan 대비 SSD 알고리즘'},
 {k:'상태 크기', v:'8× 이상', d:'같은 속도 손실 내에서 다룰 수 있는 recurrent state 크기'},
 {k:'FlashAttention-2 대비', v:'seq len 2K에서 역전, 16K에서 6×', d:'SSD가 더 빨라지는 교차점과 그 이후 격차'},
 {k:'학습 모델 규모', v:'125M~2.7B', d:'Chinchilla 스케일링 법칙 실험, Pile 데이터셋 기준'},
 {k:'Mamba-2-2.7B 평균 정확도', v:'60.2', d:'8개 zero-shot 다운스트림 태스크 평균, 같은 규모 Mamba-2.8B(59.9)·Pythia-2.8B(55.7) 상회'}
],

impact:'이 논문은 SSM을 "Transformer의 대안"이 아니라 "같은 수학적 틀 안의 다른 알고리즘 선택"으로 재배치했다. 그 결과 attention을 위해 쌓아온 하드웨어 최적화·병렬화 노하우를 SSM에 이식하는 길이 열렸고, 실제로 SSD 커널은 순수 스캔보다 훨씬 빠르면서 큰 상태 크기를 다룰 수 있게 됐다. 이후 SSM과 attention을 섞은 하이브리드 아키텍처들이 "둘 중 하나를 고르는 문제"가 아니라 "같은 틀의 부품을 섞는 문제"로 설계되기 시작했다.',

legacy:[
 '**하이브리드 아키텍처**(Jamba, Zamba 등)가 SSD 레이어와 attention 레이어를 같은 블록 설계 언어로 섞어 쓰는 흐름으로 이어짐',
 '**GVA(grouped-value attention)** 헤드 구조가 [GQA](#/p/gqa)의 SSM판으로 자리잡아, 이후 SSM 아키텍처 설계의 기본 어휘가 됨',
 'SSD의 "청크 단위 행렬곱+재귀" 알고리즘 패턴은 이후 선형 attention·RetNet 계열 커널 최적화에도 참고 틀로 쓰임',
 '이 논문이 확립한 "구조화 행렬" 프레임은 이후 상태공간모델을 [FlashAttention](#/p/flashattention)식 하드웨어 인지 설계로 분석하는 표준 언어가 됨'
],

pitfalls:[
 '**Mamba-2가 Mamba-1보다 항상 우월한 것은 아니다.** 속도·확장성 면에서 이득이지만, 논문 자체가 MQAR 등 일부 과제에서 어떤 아키텍처 요소가 성능 차이의 주 원인인지 명확히 규명하지 못했다고 밝힌다.',
 '**SSD의 이론(Theorem 6.1 등)은 특정 구조(1-준분리, 스칼라 $A$)에 한정된다.** "SSM 일반"과 "attention 일반"이 완전히 동치라는 뜻이 아니라, 그 교집합에 속하는 사례들 사이의 쌍대성이다.',
 '**속도 향상 수치(2-8×)는 상태 크기가 클 때의 비교다.** 상태 크기가 작으면 기존 Mamba 스캔과의 차이가 크지 않을 수 있다 — Figure 10 우측 그래프가 이 관계를 보여준다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽 Sequential Mamba Block: SSM 입력 X를 만든 뒤 그 함수로 A·B·C를 순차적으로 계산(사다리꼴 → SSM). 오른쪽 Parallel Mamba Block: A·X·B·C를 맨 위에서 한 번에 병렬 투영하고, SSM 출력 뒤에 정규화(N)를 하나 더 추가했다 — 이 병렬 구조 덕분에 Megatron식 텐서 병렬화가 가능해진다.',
  src:'원문 Figure 6, p.23'},
 {f:'fig2-efficiency.png',
  cap:'왼쪽: 시퀀스 길이가 늘어날 때 실행 시간(로그축). SSD(보라)는 Scan(Mamba, 빨강)보다 항상 빠르고, seq len 약 2K를 넘으면 FlashAttention-2(파랑)보다도 빨라진다. 오른쪽: state dim(상태 크기)을 키울 때, Mamba의 스캔(빨강)은 선형으로 느려지지만 SSD(보라)는 거의 평평하다 — 큰 상태를 거의 손해 없이 쓸 수 있다는 뜻.',
  src:'원문 Figure 10, p.29'}
],

quotes:[
 {t:'We show that these families of models are actually quite closely related, and develop a rich framework of theoretical connections between SSMs and variants of attention, connected through various decompositions of a well-studied class of structured semiseparable matrices.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2405.21060 — Transformers are SSMs (Mamba-2)', u:'https://arxiv.org/abs/2405.21060'},
 {t:'GitHub — state-spaces/mamba', u:'https://github.com/state-spaces/mamba'}
]
});
