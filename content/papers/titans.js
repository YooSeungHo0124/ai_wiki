WIKI.paper({
slug:'titans',
venue:'arXiv 2025 (Google Research)',
authors:'Behrouz, Zhong, Mirrokni (Google Research)',
arxiv:'2501.00663',

tldr:'attention을 사람의 **단기 기억**, 별도의 신경망 모듈을 **장기 기억**으로 나누고, 그 장기 기억이 **테스트 시점(추론 중)에도 경사하강으로 계속 학습**하게 만든 아키텍처. 문맥 창을 200만 토큰 이상으로 늘려도 needle-in-haystack 정확도가 baseline보다 높았다.',

context:'[Transformer](#/p/transformer)의 attention은 문맥 창 안의 모든 토큰 쌍을 직접 비교해 정확하지만 $O(n^2)$ 비용을 낸다. [Mamba](#/p/mamba) 같은 선형 순환 모델은 상태를 고정 크기로 압축해 선형 비용으로 만들지만, 그 압축이 학습이 끝난 뒤에는 고정돼 새 입력에 적응하지 못한다. 이 논문은 둘의 역할을 재정의한다 — attention은 **현재 문맥 안의 정확한 의존관계**를 다루는 단기 기억이고, 순환 모델류가 노리는 것은 사실 **오래된 정보를 압축해 들고 다니는** 장기 기억이라는 것이다. 문제는 기존 순환 모델의 장기 기억이 학습 시점에만 만들어지고 테스트 시점에는 그대로 얼어붙는다는 점 — Titans는 이 장기 기억 자체를 추론 중에도 계속 갱신되는 별도 신경망으로 만든다.',

ideas:[
 {h:'놀라움(surprise) 기반 메모리 갱신',
  lead:'입력에 대한 손실의 그래디언트가 클수록 "놀라운" 입력으로 보고 메모리를 더 크게 갱신한다.',
  d:'신경 장기 기억 $M$ 은 key-value 연상 손실 $\\|M(k_t)-v_t\\|^2$ 을 스스로 최소화하는 메타 모델이다. 이 손실의 그래디언트 크기를 "놀라움" 점수로 쓴다 — 과거 데이터와 많이 다른 입력일수록 그래디언트가 크고, 메모리를 더 강하게 갱신한다. 순간적인 놀라움만 쓰면 큰 사건 직후의 흐름을 놓치므로, **과거 놀라움(모멘텀)** 과 **현재 놀라움**을 합쳐 갱신량을 정한다.'},
 {h:'데이터 의존적 망각(weight decay)',
  lead:'게이트가 문맥마다 다르게 열려, 필요 없어진 메모리를 지우는 것도 학습된다.',
  d:'모멘텀 갱신 식에 데이터 의존적 감쇠 항 $\\alpha_t$ 를 추가해, 더 이상 필요 없는 정보를 능동적으로 지울 수 있게 했다. 저자들은 이 망각 메커니즘이 Mamba·Mamba2 같은 현대 순환 모델의 게이팅(forget gate)을 일반화한 형태라고 밝힌다. 즉 Titans의 장기 기억은 순환 상태 공간 모델(SSM)의 갱신 규칙을 신경망 파라미터 갱신으로 재해석한 것에 가깝다.'},
 {h:'세 가지 결합 방식: MAC · MAG · MAL',
  lead:'장기 기억을 attention과 어디서 합칠지에 따라 문맥으로 넣기(MAC)·게이트로 섞기(MAG)·층으로 쌓기(MAL) 세 변형을 실험한다.',
  d:'**MAC(Memory as Context)**는 검색된 장기 기억과 고정된 persistent 메모리를 attention의 입력 시퀀스 앞에 이어붙여, attention이 "장기 기억 중 무엇을 볼지"까지 결정하게 한다. **MAG(Memory as Gate)**는 sliding window attention과 장기 기억의 출력을 게이트로 섞는다. **MAL(Memory as Layer)**은 장기 기억을 attention과 별도의 층으로 순차 배치한다. 실험에서는 MAC·MAG가 MAL보다 일관되게 나았다 — 대부분의 기존 하이브리드 모델(Mamba+attention 등)이 택하는 MAL 방식이 최선이 아닐 수 있다는 뜻이다.'}
],

diagram:{type:'stack', cap:'MAC(Memory as Context) 구조. 장기 기억에서 검색한 내용과 persistent 메모리를 시퀀스 앞에 붙여 attention에 넣는다.',
 layers:[
  {t:'Persistent 메모리', s:'고정 파라미터', note:'작업 지식, 학습 후 동결'},
  {t:'장기 기억 검색', s:'과거 요약 벡터'},
  {t:'입력 시퀀스', s:'현재 문맥'},
  {t:'Self-Attention', s:'무엇을 저장할지 결정', acc:true},
  {t:'장기 기억 갱신', s:'테스트 시점에도 계속 학습', note:'놀라움+망각'}
 ]},

math:[
 {expr:'S_t = η_t S_{t-1} - θ_t ∇ℓ(M_{t-1}; x_t),   M_t = (1-α_t) M_{t-1} + S_t',
  tex:'\\begin{aligned} S_t &= \\eta_t S_{t-1} - \\theta_t \\nabla \\ell(M_{t-1}; x_t) \\\\ M_t &= (1-\\alpha_t) M_{t-1} + S_t \\end{aligned}',
  d:'$S_t$ 는 놀라움의 모멘텀(과거 놀라움 $\\eta_t$ 와 현재 놀라움 $\\theta_t \\nabla\\ell$ 의 합), $\\alpha_t$ 는 데이터 의존적 망각(weight decay)이다. $\\eta_t,\\theta_t,\\alpha_t$ 모두 입력 $x_t$ 의 함수 — 고정 학습률이 아니라 문맥마다 달라진다.'},
 {expr:'ℓ(M_{t-1}; x_t) = ||M_{t-1}(k_t) - v_t||²',
  tex:'\\ell(\\mathcal{M}_{t-1};x_t) = \\lVert \\mathcal{M}_{t-1}(\\mathbf{k}_t) - \\mathbf{v}_t \\rVert_2^2',
  d:'장기 기억이 스스로 최소화하는 연상 기억 손실. $M$ 이 key를 넣으면 대응하는 value를 뱉도록 만드는 것이 "기억"의 정의다.'}
],

numbers:[
 {k:'모델 규모 · 학습 토큰', v:'170M/340M/400M(15B 토큰), 760M(30B 토큰)', d:'FineWeb-Edu 데이터, LLaMA2 토크나이저(32K), 학습 길이 4K'},
 {k:'340M 평균 정확도(9개 과제)', v:'Titans(MAG) 47.54 vs Gated DeltaNet 45.42 vs Transformer++ 42.92', d:'PIQA·HellaSwag·Winogrande·ARC·SIQA·BoolQ 등'},
 {k:'S-NIAH-W 16K(단일 needle 검색)', v:'Titans(MAC) 95.2% vs Mamba2 0.0% vs TTT 0.0%', d:'RULER 벤치마크, 길이 2K~16K 중 최장 조건'},
 {k:'유효 문맥 창', v:'200만 토큰 이상으로 확장 가능', d:'needle-in-haystack에서 baseline보다 높은 정확도 유지(논문 주장)'},
 {k:'속도 이득 조건', v:'학습은 청크 단위 matmul로 병렬화, 추론은 빠른 순환', d:'Yu Sun et al.(TTT)의 미니배치 경사하강 텐서화 기법을 확장'}
],

impact:'attention·순환 모델을 경쟁 관계가 아니라 **단기/장기 기억의 역할 분담**으로 재구성한 것이 이 논문의 핵심 제안이다. 특히 장기 기억이 추론 중에도 그래디언트로 계속 갱신된다는 설정은, "학습이 끝나면 가중치는 고정"이라는 표준 추론 패러다임에 균열을 낸다. [TTT](https://arxiv.org/abs/2407.04620)(Test-Time Training)의 청크 단위 텐서화를 그대로 확장해 사용했다는 점에서, 놀라움 기반 갱신을 이 계열의 병렬화 기법과 결합한 사례로 볼 수 있다.',

legacy:[
 'Mamba류 SSM의 forget gate를 "메타 학습되는 망각"으로 일반화 — 순환 상태 갱신을 명시적인 손실 최소화 문제로 재해석',
 'MAC/MAG(장기 기억을 attention과 병렬 결합)가 MAL(순차 결합)보다 낫다는 결과가 이후 하이브리드 아키텍처 설계에서 결합 방식 재검토의 근거로 인용',
 '"테스트 시점 학습(test-time training)" 계열 연구의 확장 사례로, 추론 중 파라미터 갱신이라는 아이디어를 언어모델 규모로 실증',
 '**주의: 논문 발표 시점에 학습·평가 코드가 공개되지 않아**("we intend to make the code... publicly available"), 커뮤니티의 독립적 재현·검증이 제한적이었다는 점이 이후 논의된 바 있다 — 결과 자체를 반박하는 근거는 아니지만 재현성 확인은 별도로 필요하다'
],

pitfalls:[
 '**"장기 기억"이 attention의 KV 캐시와 다른 개념이다.** KV 캐시는 과거 토큰을 그대로 저장하지만, Titans의 장기 기억은 고정 크기 신경망 파라미터에 정보를 압축·갱신하는 것이라 저장 방식과 검색 방식이 근본적으로 다르다.',
 '**"테스트 시점 학습"이 매 추론마다 역전파를 새로 돈다는 뜻은 아니다.** 청크 단위로 텐서화된 갱신식(식 16~18)을 forward pass 안에서 matmul로 계산하는 것이지, 별도의 학습 루프를 도는 것이 아니다.',
 '**실험 규모가 170M~760M 파라미터로, 현재 대형 LLM 기준으로는 작다.** 수십억~수백억 파라미터 규모에서도 같은 이점이 유지되는지는 이 논문만으로 확인되지 않는다.'
],

figures:[
 {f:'fig2-mac-architecture.png', cap:'MAC 구조. 왼쪽 Contextual Memory에서 검색(Retrieval)한 장기 기억과 아래 Persistent Memory(고정 가중치)가 가운데 Core의 입력 시퀀스 앞에 이어붙는다. attention이 이 확장된 시퀀스를 처리한 뒤, 그 출력이 다시 장기 기억을 Update한다 — 오른쪽 열의 Learning/In-context Learning/Fixed가 테스트 시점에 각 부분이 갱신되는지 여부를 표시.', src:'원문 Figure 2, p.8'}
],

quotes:[
 {t:'We argue that attention due to its limited context but accurate dependency modeling performs as a short-term memory, while neural memory due to its ability to memorize the data, acts as a long-term, more persistent, memory.', src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2501.00663 — Titans: Learning to Memorize at Test Time', u:'https://arxiv.org/abs/2501.00663'}
]
});
