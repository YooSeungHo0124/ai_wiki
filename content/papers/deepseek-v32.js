WIKI.paper({
slug:'deepseek-v32',
venue:'arXiv 2025 (DeepSeek-AI)',
authors:'DeepSeek-AI',
arxiv:'2512.02556',

tldr:'DeepSeek-V3.1-Terminus를 이어받아 **DeepSeek Sparse Attention(DSA)**으로 continued training한 모델. 경량 lightning indexer가 모든 이전 토큰을 훑어 점수를 매기고, 쿼리마다 상위 k(=2048)개 토큰에만 full attention을 적용해 core attention 복잡도를 $O(L^2)$에서 $O(Lk)$로 낮췄다.',

context:'2025년 하반기 오픈소스 LLM의 병목은 순수 성능이 아니라 **구조**였다 — [vanilla attention](#/p/transformer)은 문맥이 길어질수록 posttraining과 서빙 비용을 제곱으로 불린다. [NSA](#/p/nsa)나 [MoBA](#/p/moba) 같은 학습 가능 희소 attention이 처음부터 새로 사전학습하는 방식을 취한 반면, DeepSeek-V3.2는 이미 128K까지 확장된 [DeepSeek-V3.1-Terminus](#/p/deepseek-v3) 체크포인트에서 **continued training**만으로 희소 attention을 이식할 수 있는지를 묻는다. 아키텍처를 거의 바꾸지 않고 [MLA](#/p/deepseek-v2) 위에 얹을 수 있어야 기존 서빙 스택을 재사용할 수 있기 때문이다.',

ideas:[
 {h:'Lightning indexer: 저비용으로 전체를 훑는 점수기',
  lead:'헤드 수가 적고 FP8로 도는 작은 indexer가 모든 과거 토큰에 인덱스 점수를 매긴다.',
  d:'쿼리 토큰 $h_t$와 이전 토큰 $h_s$ 사이의 인덱스 점수는 $I_{t,s}=\\sum_j w^I_{t,j}\\cdot\\text{ReLU}(q^I_{t,j}\\cdot k^I_s)$로 계산한다. 헤드 수 $H^I$가 적고 ReLU를 쓰며 FP8로 구현되어, 이 점수 계산 자체는 $O(L^2)$이어도 메인 attention보다 훨씬 싸다. 이 점수가 "어떤 과거 토큰이 지금 쿼리와 관련 있는가"를 전체 시퀀스에 대해 매긴다.'},
 {h:'Fine-grained token selection: 정적 패턴이 아니라 쿼리마다 다른 top-k',
  lead:'슬라이딩 윈도처럼 고정된 이웃이 아니라, 쿼리마다 indexer 점수 상위 k개 KV만 골라 full attention한다.',
  d:'선택된 집합은 $\\{s\\mid I_{t,s}\\in\\text{Top-}k(I_{t,:})\\}$이고, 그 KV 항목들에만 표준 attention을 적용한다($u_t=\\text{Attn}(h_t,\\{c_s\\})$). 슬라이딩 윈도우·블록 단위 국소 패턴은 토큰 위치로 희소성이 **미리 결정**되지만, DSA는 위치와 무관하게 **내용 기반으로 매 쿼리마다 다시 결정**된다 — 문맥 앞부분의 토큰도 관련 있으면 선택되고, 바로 앞 토큰도 관련 없으면 버려진다.'},
 {h:'Dense warm-up → sparse training: indexer를 먼저 메인 attention에 정렬시킨다',
  lead:'indexer 점수 분포를 메인 attention 분포에 KL로 맞춘 뒤에야 top-k 선택을 켠다.',
  d:'먼저 dense attention을 유지한 채 indexer만 학습한다 — 헤드 합산 후 L1 정규화한 메인 attention 분포 $p_{t,:}$에 indexer의 softmax 출력을 KL 손실로 맞춘다(식 3). 이후 sparse training 단계에서 top-k 선택을 켜고, 선택된 집합 $\\mathcal{S}_t$ 안에서만 같은 KL 정렬을 계속하며 언어모델링 손실로 본모델을 학습한다(식 4). indexer 입력은 그래프에서 detach해 본모델과 독립적으로 최적화한다.'},
 {h:'MLA의 MQA 모드 위에 DSA를 얹는다',
  lead:'커널 효율을 위해 KV 캐시 하나를 모든 쿼리 헤드가 공유하는 MQA 모드로 DSA를 구현한다.',
  d:'[MLA](#/p/deepseek-v2)는 MHA·MQA 두 모드로 쓸 수 있는데, DSA는 각 KV 항목(잠재 벡터)이 여러 쿼리에 공유돼야 커널이 빨라지므로 [MQA](#/p/mqa) 모드 위에 구현했다. Figure 2가 보여주듯 indexer는 입력 hidden에서 바로 파생되는 별도 경로이고, top-k selector가 고른 KV만 core attention(Multi-Query Attention)에 들어간다.'}
],

diagram:{type:'compare', cap:'슬라이딩 윈도우 같은 정적 희소 패턴과 DSA의 동적 선택 비교.',
 left:{t:'정적 희소(슬라이딩 윈도)', items:['이웃 범위가 위치로 고정','최근 토큰만 항상 포함','먼 문맥의 관련 토큰을 놓침']},
 right:{t:'DSA (동적)', items:['indexer가 매 쿼리마다 채점','내용 기반 top-k 선택','먼 토큰도 관련 있으면 선택']}},

math:[
 {expr:'I_t,s = sum_j w_t,j^I * ReLU(q_t,j^I · k_s^I)',
  tex:'I_{t,s}=\\sum_{j=1}^{H^I} w^I_{t,j}\\cdot \\text{ReLU}\\!\\left(q^I_{t,j}\\cdot k^I_s\\right)',
  d:'lightning indexer의 점수 함수. 헤드 수 $H^I$가 작고 FP8로 구현돼 이 계산 자체가 병목이 되지 않는다.'},
 {expr:'u_t = Attn(h_t, {c_s | I_t,s ∈ Top-k(I_t,:)})',
  tex:'u_t = \\text{Attn}\\!\\left(h_t,\\; \\{c_s \\mid I_{t,s}\\in \\text{Top-}k(I_{t,:})\\}\\right)',
  d:'선택된 top-k KV 항목에만 attention을 적용한다. $k\\ll L$이라 core attention 복잡도가 $O(L^2)$에서 $O(Lk)$로 줄어든다.'},
 {expr:'L^I = Σ_t D_KL(p_t,: || Softmax(I_t,:))',
  tex:'\\mathcal{L}^I=\\sum_t D_{\\mathrm{KL}}\\!\\left(p_{t,:}\\,\\|\\,\\text{Softmax}(I_{t,:})\\right)',
  d:'dense warm-up 단계의 indexer 학습 목표. $p_{t,:}$는 메인 attention의 헤드 합산·L1 정규화 분포. sparse training 단계에서는 선택된 집합 $\\mathcal{S}_t$로만 범위를 좁혀 같은 형태의 손실을 계속 쓴다(식 4).'}
],

numbers:[
 {k:'core attention 복잡도', v:'O(L²) → O(Lk)', d:'k는 선택 토큰 수, indexer 자체는 여전히 O(L²)이지만 메인 attention보다 훨씬 저렴'},
 {k:'sparse training 선택 토큰 수', v:'2048개', d:'쿼리 하나당 top-k로 고정, 128K 길이 시퀀스 기준'},
 {k:'dense warm-up 규모', v:'1000 step · 16×128K seq/step · 총 2.1B 토큰', d:'indexer만 학습, 본모델은 동결'},
 {k:'sparse training 규모', v:'15000 step · 480×128K seq/step · 총 943.7B 토큰', d:'lr 7.3×10⁻⁶, 본모델+indexer 동시 학습'},
 {k:'추론 비용(H800, 128K 위치)', v:'prefill $0.68→$0.19, decode $2.15→$0.25 (백만 토큰당)', d:'DeepSeek-V3.1-Terminus 대비, H800 렌탈가 시간당 $2 기준(Figure 3)'},
 {k:'벤치마크·롱컨텍스트', v:'V3.1-Terminus와 동등 이상', d:'AA-LCR에서 reasoning mode 기준 +4점, ChatbotArena Elo는 근접'}
],

impact:'DSA는 "희소 attention은 새 아키텍처를 처음부터 학습해야 한다"는 전제를 깨고, **이미 학습된 dense 모델 위에 continued training만으로 이식 가능함**을 대규모(수백B 파라미터급)에서 보였다. lightning indexer가 메인 attention과 별도 손실(KL)로 정렬되기 때문에 top-k 선택이 미분 불가능해도 학습이 안정적으로 진행된다는 점도 실용적으로 중요하다. 이후 오픈소스 진영에서 "기존 dense 체크포인트를 희소화하는" 레시피의 참조 사례가 되었다.',

legacy:[
 '[NSA](#/p/nsa)·[MoBA](#/p/moba)가 사전학습부터 희소 구조로 가는 것과 달리, DSA는 **continued training으로 희소성을 이식**하는 대안 경로를 제시',
 '[MLA](#/p/deepseek-v2)의 MQA 모드와 결합하는 구현 패턴이 이후 잠재벡터 기반 attention에 희소성을 얹는 참조 설계가 됨',
 'indexer를 KL 손실로 메인 attention에 정렬시키는 방식이, top-k처럼 미분 불가능한 선택 연산을 우회하는 방법으로 재사용됨',
 'H800 클러스터·실서비스 기준 토큰당 비용 곡선을 논문에 직접 공개해, 이후 희소 attention 논문들이 속도 대신 **비용**으로 이득을 보고하는 관행에 영향'
],

pitfalls:[
 '**DSA는 DeepSeek-V3.2의 유일한 구조 변경이다.** DeepSeek-V3.1-Terminus 대비 다른 아키텍처 차이는 없다 — 성능 개선은 대부분 post-training(강화학습 규모 확대·agentic 데이터)에서 온다.',
 '**비용 수치는 H800 클러스터·시간당 $2 렌탈가·실서비스 배포 기준이다.** 다른 하드웨어나 가격 조건에서는 절대 수치가 달라진다. 또한 짧은 문맥 prefilling에는 DSA를 흉내 낸 별도의 masked MHA 모드를 썼다고 명시한다.',
 '**indexer 자체는 여전히 $O(L^2)$이다.** 줄어드는 것은 core attention이며, indexer 연산량이 작다는 것이지 사라지는 것은 아니다.'
],

figures:[
 {f:'fig2-dsa-architecture.png',
  cap:'입력 hidden에서 MLA 경로(왼쪽, 검정)와 lightning indexer 경로(오른쪽, 초록)가 갈라진다. indexer가 만든 점수로 top-k selector가 KV 항목을 고르고, 그 결과만 위쪽 Multi-Query Attention(core attention)에 들어간다.',
  src:'원문 Figure 2, p.4'},
 {f:'fig3-inference-cost.png',
  cap:'토큰 위치(x축)가 늘수록 백만 토큰당 비용(y축)이 V3.1-Terminus(파랑)는 거의 선형으로 증가하지만 V3.2(주황)는 훨씬 완만하다. 왼쪽이 prefill, 오른쪽이 decode — decode 쪽 격차가 더 크다.',
  src:'원문 Figure 3, p.6'}
],

quotes:[
 {t:'DSA reduces the core attention complexity of the main model from O(L^2) to O(Lk), where k (≪ L) is the number of selected tokens.',
  src:'Section 2.3, p.5'}
],

links:[
 {t:'arXiv 2512.02556 — DeepSeek-V3.2: Pushing the Frontier of Open Large Language Models', u:'https://arxiv.org/abs/2512.02556'},
 {t:'DeepSeek-V3.2-Exp (Hugging Face) — 추론 구현 공개', u:'https://huggingface.co/deepseek-ai/DeepSeek-V3.2-Exp'}
]
});
