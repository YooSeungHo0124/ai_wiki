WIKI.paper({
slug:'medusa',
venue:'arXiv 2024 (Princeton · UIUC · Together AI)',
authors:'Tianle Cai, Yuhong Li, Zhengyang Geng, Hongwu Peng, Jason D. Lee, Deming Chen, Tri Dao',
arxiv:'2401.10774',

tldr:'별도 draft 모델 없이 원래 모델의 마지막 은닉 상태 위에 **여러 개의 추가 디코딩 헤드**만 얹어서, 트리 구조로 여러 후보를 한 번에 검증하는 방식으로 [Speculative Decoding](#/p/speculative)의 속도를 재현한 논문. 새 모델을 구하고 서빙할 필요가 사라진다.',

context:'[Speculative Decoding](#/p/speculative)은 작은 draft 모델로 여러 토큰을 미리 만들고 원본 모델이 한 번에 검증해 순차 디코딩의 메모리 대역폭 병목을 줄인다. 문제는 이 draft 모델을 **구하고 유지하는 일** 자체다. 성능이 맞는 소형 모델이 항상 있는 것도 아니고, 분산 서빙 환경에 모델을 하나 더 얹으면 배포 복잡도가 커진다. 이 논문의 질문은 "별도 모델 없이, 원본 모델 자체에 병렬 예측 능력을 붙일 수 없는가"이다.',

ideas:[
 {h:'Medusa 헤드: 원본 모델에 붙는 미래 토큰 예측기',
  lead:'마지막 은닉 상태 위에 K개의 얕은 헤드를 달아 $t+2, t+3, ...$ 번째 토큰을 동시에 예측한다.',
  d:'원본 LM 헤드는 위치 $t+1$ 토큰만 예측한다. Medusa는 같은 은닉 상태 $h_t$ 에 잔차 연결이 있는 1층 FFN 헤드를 $K$ 개 추가로 붙여, $k$번째 헤드가 $t+k+1$ 위치를 예측하게 한다. 헤드는 원본 LM 헤드와 가중치를 공유하는 대신 새로 초기화하고, forward pass 한 번에 다음 여러 토큰의 후보 분포를 동시에 얻는다.'},
 {h:'트리 어텐션: 여러 후보를 배치 없이 한 번에 검증',
  lead:'각 헤드의 top-k 예측을 카르테시안 곱으로 묶어 트리를 만들고 attention mask로 가지끼리 격리한다.',
  d:'헤드마다 top-$s_k$개 후보를 뽑아 조합하면(예: $s_1{=}2, s_2{=}3$ 이면 6가지 연속) 여러 후보 시퀀스가 만들어진다. 이걸 배치로 늘리는 대신, **하나의 forward pass 안에서** attention mask를 조정해 같은 조상을 공유하는 토큰끼리만 서로를 보게 하고 다른 가지는 서로 못 보게 만든다. 위치 인코딩도 트리 구조에 맞춰 조정한다. 이렇게 하면 배치를 늘리지 않고도 여러 후보를 동시에 검증할 수 있다.'},
 {h:'Medusa-1과 Medusa-2: 얼릴지 같이 학습할지',
  lead:'백본을 얼린 채 헤드만 학습(1)하거나, 헤드와 백본을 함께 학습(2)해 정확도를 더 끌어올린다.',
  d:'Medusa-1은 백본을 고정하고 헤드에만 cross-entropy loss를 건다 — 원본 모델의 분포가 그대로 보존되어 손실 없는(lossless) 가속이 된다. Medusa-2는 헤드 손실에 원본 LM 손실을 더해 백본까지 같이 학습시켜, 헤드의 예측 정확도(따라서 수용 길이)를 더 끌어올리되 원본 모델의 생성 품질이 무너지지 않게 손실 가중치로 균형을 맞춘다.'},
 {h:'typical acceptance: 분포를 정확히 맞추는 대신 그럴듯한 후보를 받아들인다',
  lead:'rejection sampling 대신 temperature 임계값으로 "합리적인" 후보를 통과시켜 수용률을 더 높인다.',
  d:'[Speculative Decoding](#/p/speculative)의 rejection sampling은 원본 모델과 정확히 같은 분포를 보장하지만 그 이상으로 가속하기 어렵다. Medusa는 원본 모델 확률이 임계값을 넘으면 후보를 그대로 받아들이는 typical acceptance를 제안해, 분포를 완벽히 맞추는 것을 약간 포기하는 대신 수용 길이를 늘린다.'}
],

diagram:{type:'flow', cap:'원본 모델의 LM Head 옆에 Medusa Head들이 나란히 붙어 각자 다른 미래 위치를 예측한다.',
 nodes:[
  {t:'마지막 은닉상태', s:'h_t'},
  {t:'LM Head', s:'→ t+1 예측'},
  {t:'Medusa 헤드들', s:'→ t+2..t+K+1', acc:true},
  {t:'트리 어텐션 검증', s:'후보 동시 처리'},
  {t:'최장 접두사 채택', s:'다음 스텝 시작점'}
 ]},

math:[
 {expr:'p_t^(k) = softmax( W2^(k) · ( SiLU(W1^(k) · h_t) + h_t ) )',
  tex:'p_t^{(k)} = \\text{softmax}\\!\\left(W_2^{(k)}\\cdot\\left(\\text{SiLU}(W_1^{(k)}\\cdot h_t)+h_t\\right)\\right)',
  d:'$k$번째 Medusa 헤드의 정의. 잔차 연결(`+ h_t`) 덕분에 $W_1^{(k)}$ 를 0으로 초기화하면 헤드의 초기 예측이 원본 LM 헤드와 일치해서 학습이 안정적으로 시작된다.'},
 {expr:'L_MEDUSA-1 = Σ_k -λ_k log p_t^(k)(y_{t+k+1})',
  tex:'\\mathcal{L}_{\\text{MEDUSA-1}} = \\sum_{k=1}^{K} -\\lambda_k \\log p_t^{(k)}(y_{t+k+1})',
  d:'헤드별 cross-entropy를 $\\lambda_k$ 로 가중합한다. $k$가 커질수록(더 먼 미래를 예측할수록) 예측이 어려워 손실이 커지므로, 논문은 $\\lambda_k$ 를 0.8의 $k$제곱처럼 감쇠시켜 균형을 맞춘다.'},
 {expr:'L_MEDUSA-2 = L_LM + λ0 · L_MEDUSA-1',
  tex:'\\mathcal{L}_{\\text{MEDUSA-2}} = \\mathcal{L}_{\\text{LM}} + \\lambda_0\\,\\mathcal{L}_{\\text{MEDUSA-1}}',
  d:'백본의 원래 다음 토큰 손실 $\\mathcal{L}_{LM}$ 을 더해 헤드와 백본을 함께 학습하면서도 백본의 원래 예측 능력이 무너지지 않게 한다.'}
],

numbers:[
 {k:'Medusa-1 속도 향상', v:'2.18×', d:'Vicuna-7B, 손실 없는(lossless) 가속'},
 {k:'Medusa-2 속도 향상', v:'2.83×', d:'같은 Vicuna-7B, 백본까지 함께 학습'},
 {k:'카테고리 최고 속도', v:'3.62×', d:'MT-Bench 카테고리 중 Medusa-2 Vicuna-7B 최고치'},
 {k:'Medusa-1 학습 시간', v:'약 5시간', d:'A100 PCIe 1장, ShareGPT 6만 샘플, Vicuna-7B 기준'},
 {k:'헤드 구조', v:'1층 FFN + 잔차', d:'헤드 하나당 파라미터가 원본 모델보다 훨씬 작음'}
],

impact:'Medusa는 "speculative decoding의 속도 = 반드시 별도 draft 모델이 필요하다"는 전제를 깼다. 헤드가 원본 모델에 직접 붙어 파라미터를 공유하다시피 하므로 배포·서빙 파이프라인이 단순해지고, 기존 [vLLM](#/p/vllm) 같은 서빙 스택에 얹기도 쉬워졌다. 트리 어텐션으로 배치를 늘리지 않고 여러 후보를 동시 검증한다는 아이디어는 이후 여러 병렬 디코딩 기법의 표준 부품이 되었다.',

legacy:[
 '**Eagle·Lookahead Decoding** 등 후속 연구가 "draft 없는 병렬 예측 + 트리 검증"이라는 이 논문의 틀을 이어받아 수용 길이를 더 늘림',
 '트리 attention mask는 이후 배치 추론·구조화 생성 프레임워크([SGLang](#/p/sglang) 등)에서 여러 후보·여러 경로를 한 forward에 처리하는 일반 기법으로 재사용됨',
 'typical acceptance는 "정확히 같은 분포"를 고집하지 않는 근사적 가속 기법 계열의 출발점이 됨',
 '헤드를 백본과 함께 학습하는 Medusa-2 레시피는 이후 "추론 가속을 위한 보조 헤드 공동학습" 패턴의 참고 사례가 됨'
],

pitfalls:[
 '**Medusa-2는 손실 없는(lossless) 가속이 아니다.** 백본까지 함께 학습하므로 원본 모델의 출력 분포가 미세하게 바뀔 수 있고, 논문도 품질을 보존하기 위한 별도 손실 가중치 전략이 필요하다고 명시한다.',
 '**속도 향상은 배치 크기 1을 전제로 측정됐다.** 논문은 개인이 로컬에서 LLM을 호스팅하는 시나리오(배치=1, 메모리 대역폭 병목)에 초점을 맞췄고, 서버가 이미 큰 배치로 처리량 병목 상태라면 이득이 줄어든다.',
 '**헤드 수를 늘린다고 항상 빨라지지 않는다.** 트리가 커질수록 검증할 토큰 수와 계산량도 늘어, 최적의 트리 구성(각 헤드의 $s_k$)을 찾는 것 자체가 튜닝 대상이다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'원본 모델의 Transformer Layers 위에서 뻗어나온 Last Hidden이 왼쪽 LM Head(원본 다음 토큰)와 오른쪽 Medusa Head 1~3(그 다음다음 토큰들)에 동시에 들어간다. 각 헤드가 내놓은 top 후보들을 조합해 Candidates를 만들고, 검증 후 맞는 것만(초록 체크) 채택한다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-tree-attention.png',
  cap:'왼쪽 트리: Head 1의 top-2("It","I")와 Head 2의 top-3("is","\'","the")를 조합해 6개 후보 경로가 생긴다. 오른쪽 격자는 그 트리에 대응하는 attention mask로, 체크 표시가 있는 칸만 서로를 볼 수 있다 — 즉 같은 조상을 공유하는 토큰끼리만 attend하고 다른 가지는 서로 격리된다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'While methods such as speculative decoding have been suggested to address this issue, their implementation is impeded by the challenges associated with acquiring and maintaining a separate draft model.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2401.10774 — Medusa', u:'https://arxiv.org/abs/2401.10774'},
 {t:'GitHub — FasterDecoding/Medusa', u:'https://github.com/FasterDecoding/Medusa'}
]
});
