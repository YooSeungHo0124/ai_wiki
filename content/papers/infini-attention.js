WIKI.paper({
slug:'infini-attention',
venue:'arXiv preprint 2024',
authors:'Munkhdalai, Faruqui, Gopal (Google)',
arxiv:'2404.07143',

tldr:'하나의 attention 층 안에 **압축 메모리(compressive memory)**를 내장해, 지역 causal attention과 장기 선형 attention을 한 층에서 결합한다. 세그먼트가 넘어갈 때마다 KV를 버리는 대신 고정 크기 연상 행렬에 흡수시켜, 메모리 사용량을 일정하게 유지한 채 이론상 무한 길이 입력을 처리한다.',

context:'[StreamingLLM](#/p/streaming-llm)은 캐시 밖으로 밀려난 정보를 그냥 버렸다 — 저자들 스스로 "장기 기억을 향상시키지 않는다"고 명시한 한계였다. [Transformer-XL](#/p/transformer-xl) 이후의 세그먼트 단위 모델들(Transformer-XL, Compressive Transformer, Memorizing Transformer 등)은 이전 세그먼트의 정보를 어떻게든 이어 붙이려 했지만, 각각 오래된 상태를 버리거나(Transformer-XL), kNN 검색으로 방대한 캐시를 그대로 유지하거나(Memorizing Transformer), 메모리 크기가 입력 길이에 따라 계속 자라는 문제가 있었다. 이 논문은 "세그먼트가 넘어갈 때 버려지는 KV를 완전히 버리지 않고 고정 크기 메모리에 압축해 넣으면 어떨까"라는 질문에서 출발한다.',

ideas:[
 {h:'하나의 층에 지역 attention과 장기 선형 attention을 함께',
  lead:'같은 Q·K·V를 지역 causal attention과 압축 메모리 조회 양쪽에 재사용한다.',
  d:'Infini-attention은 새로운 파라미터를 거의 추가하지 않는다. 표준 scaled dot-product attention이 쓰는 Q·K·V를 그대로 재사용해, 하나는 보통의 지역 causal attention($A_{dot}$)을 계산하고 다른 하나는 압축 메모리에서 장기 문맥을 조회($A_{mem}$)하는 데 쓴다. 두 attention 메커니즘이 한 층 안에서 공존한다.'},
 {h:'압축 메모리: 연상 행렬로 KV를 흡수',
  lead:'세그먼트가 끝나면 그 세그먼트의 K·V를 버리지 않고 고정 크기 연상 행렬에 더해 넣는다.',
  d:'메모리는 $M_{s-1}\\in\\mathbb{R}^{d_{key}\\times d_{value}}$라는 고정 크기 행렬이다. 세그먼트 $s$의 attention 계산이 끝나면 $\\sigma(K)^\\top V$(연상 결합, associative binding)를 더해 $M_s$를 갱신하고, 다음 세그먼트로 넘긴다. 이 덕분에 메모리 크기는 세그먼트 개수·입력 길이와 무관하게 **층당 상수**로 고정된다(Table 1에서 Transformer-XL·Memorizing Transformer는 $N\\times l$ 또는 $N\\times S$로 계속 자라는 것과 대비).'},
 {h:'조회는 선형 attention, 갱신은 delta rule로 보강',
  lead:'쿼리로 메모리를 조회할 때 선형 attention 형태를 쓰고, 이미 저장된 바인딩은 다시 쓰지 않도록 delta rule로 갱신한다.',
  d:'조회는 $A_{mem}=\\sigma(Q)M_{s-1}/(\\sigma(Q)z_{s-1})$로, 소프트맥스 대신 ELU+1 활성화를 쓰는 선형 attention 형태다. 기본 갱신 규칙(Linear)은 새 KV를 무조건 더하지만, delta rule 버전은 기존 메모리에서 먼저 같은 키에 대한 값을 빼고 차이만 더해, 이미 저장된 바인딩을 중복해서 쌓지 않는다.'},
 {h:'학습 가능한 게이트로 지역·장기 정보를 섞는다',
  lead:'헤드마다 스칼라 하나로 지역 attention과 메모리 조회 결과의 비중을 학습한다.',
  d:'최종 출력은 $A=\\text{sigmoid}(\\beta)\\odot A_{mem}+(1-\\text{sigmoid}(\\beta))\\odot A_{dot}$로, 헤드당 파라미터 하나($\\beta$)만 추가된다. 학습 후 관찰하면 일부 헤드는 $\\beta$가 0 또는 1 근처로 수렴해 순수하게 지역 또는 장기 정보만 쓰는 식으로 전문화되고, 나머지는 둘을 섞는 mixer 헤드로 남는다.'}
],

diagram:{type:'split', cap:'한 세그먼트를 처리할 때 Infini-attention 층 내부에서 갈라지는 두 경로. 두 결과를 게이트로 섞어 하나의 출력으로 합친다.',
 from:{t:'Q, K, V', s:'세그먼트 X_s'},
 branches:[
  {t:'지역 attention', s:'표준 causal softmax'},
  {t:'압축 메모리 조회', s:'선형 attention', acc:true}
 ],
 join:'게이트 β로 가중합'},

math:[
 {expr:'A_mem = σ(Q) M_{s-1} / (σ(Q) z_{s-1})',
  tex:'A_{mem}=\\dfrac{\\sigma(Q)M_{s-1}}{\\sigma(Q)z_{s-1}}',
  d:'쿼리로 압축 메모리를 조회하는 식. $\\sigma$는 ELU+1, $z_{s-1}$은 정규화를 위한 키 합. 소프트맥스 대신 커널화된 선형 attention 형태라 $O(N)$으로 계산된다.'},
 {expr:'M_s ← M_{s-1} + σ(K)ᵀ(V − σ(K) M_{s-1} / (σ(K) z_{s-1})),   z_s ← z_{s-1} + Σ σ(K_t)',
  tex:'M_s \\leftarrow M_{s-1} + \\sigma(K)^{\\top}\\!\\left(V-\\dfrac{\\sigma(K)M_{s-1}}{\\sigma(K)z_{s-1}}\\right),\\qquad z_s \\leftarrow z_{s-1}+\\sum_{t=1}^{N}\\sigma(K_t)',
  d:'delta rule 버전의 메모리 갱신. 이미 저장된 키-값 바인딩이 있으면 그 값을 먼저 빼고 차이만 더해, 같은 정보를 중복해서 누적하지 않는다.'},
 {expr:'A = sigmoid(β) ⊙ A_mem + (1 − sigmoid(β)) ⊙ A_dot',
  tex:'A=\\text{sigmoid}(\\beta)\\odot A_{mem} + (1-\\text{sigmoid}(\\beta))\\odot A_{dot}',
  d:'헤드마다 하나의 학습 가능한 스칼라 $\\beta$로 지역 attention과 장기 메모리 조회 결과를 섞는다.'}
],

numbers:[
 {k:'메모리 압축비', v:'114×', d:'Memorizing Transformer(65K 길이 벡터 캐시) 대비 압축률, 비슷하거나 더 나은 perplexity로'},
 {k:'passkey 검색 길이', v:'최대 1M 토큰', d:'1B LLM, 4K 길이로 continual pre-training 후 5K 길이 입력으로만 파인튜닝했는데도 1M에서 토큰 단위 검색 정확도 거의 100%(Linear+Delta, fine-tuned)'},
 {k:'책 요약 길이', v:'500K 토큰(BookSum)', d:'8B 모델, continual pre-training + 태스크 파인튜닝 후 Rouge-L 17.9(Linear+Delta)로 BART/PRIMERA+Unlimiformer 상회'},
 {k:'세그먼트 길이 N', v:'2048', d:'실험 전반에서 고정한 Infini-attention 세그먼트(로컬 attention 윈도우) 크기'},
 {k:'추가 파라미터', v:'헤드당 스칼라 1개(β)', d:'게이트 하나만 추가 — 압축 메모리 자체는 Q·K·V를 재사용하므로 새 가중치가 거의 없음'}
],

impact:'"긴 문맥을 다룬다"를 캐시 축출 정책([H2O](#/p/h2o), [StreamingLLM](#/p/streaming-llm))이나 위치 인코딩 재조정([LongRoPE](#/p/longrope))이 아니라, **attention 층 자체의 구조**로 풀려 한 축을 더했다. Q·K·V를 압축 메모리와 공유해 새 파라미터를 거의 안 늘리면서 기존 LLM에 plug-in 형태로 적용 가능하다고 주장한 점, 그리고 5K 길이로만 파인튜닝해도 1M 길이 검색이 된다는 결과가 당시로서는 파격적이었다. 다만 preprint(under review) 상태로 공개돼 공식 코드가 없었고, 이후 커뮤니티의 독립적인 재현 시도들에서 논문 수준의 결과를 그대로 재현하기 어렵다는 보고가 나오며 선형 attention 기반 압축 메모리의 안정성에 대한 논쟁이 이어졌다.',

legacy:[
 '**세그먼트 단위 메모리 계열의 최신 갈래** — Transformer-XL → Compressive Transformer → Memorizing Transformer로 이어진 "세그먼트 넘어 정보를 어떻게 유지할까" 계보의 연장선에 있으며, 압축 메모리를 attention 층 내부로 완전히 통합한 것이 차별점',
 '**선형 attention과의 결합점** — 압축 메모리 조회를 커널화 선형 attention(Katharopoulos et al.)으로 정식화해, [Mamba](#/p/mamba) 등 SSM 계열과 마찬가지로 "고정 크기 상태로 시퀀스를 압축한다"는 아이디어를 attention 진영에서 구현한 사례로 자주 인용됨',
 '**재현성 논쟁** — 공식 코드가 공개되지 않은 채 preprint로 남아, 이후 여러 독립 재구현 시도가 원 논문만큼의 1M 검색 정확도를 재현하지 못했다는 보고가 나오면서 실무 채택보다는 아이디어 차원의 참조로 더 많이 인용됨'
],

pitfalls:[
 '**"무한 문맥"은 이론적 상한이지, 검증된 상한이 1M 토큰이라는 뜻이다.** 논문이 실제로 측정한 것은 passkey 검색(1M)과 책 요약(500K)이며, "메모리가 상수 크기니 얼마든지 늘려도 된다"는 주장과 "실제로 그 길이에서 정보 손실이 없다"는 것은 다른 문제다 — 압축 메모리는 결국 고정 크기 행렬이라 정보가 무한히 쌓이면 간섭(interference)이 생길 수 있다.',
 '**delta rule 유무에 따라 결과가 갈린다.** Table 3에서 파인튜닝 없이(zero-shot) 쓰면 Linear와 Linear+Delta의 passkey 정확도가 들쭉날쭉하지만(6~14%대), 파인튜닝 후에는 둘 다 거의 100%로 수렴한다 — "Infini-attention이라 바로 긴 문맥을 이해한다"가 아니라 **파인튜닝을 전제로 한 결과**라는 점을 놓치기 쉽다.',
 '**공식 구현이 공개되지 않았다.** preprint(2024, under review) 상태로 남아 있고 저자들이 코드를 릴리스하지 않아, 이 위키 작성 시점 기준으로 결과를 독립적으로 검증하려면 재구현이 필요하다 — 수치를 인용할 때 원 논문의 실험 조건(모델 크기, continual pre-training 스텝 수)을 함께 명시해야 한다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'한 세그먼트($Q_s$, 초록 상자가 압축 메모리+선형 attention, 보라 상자가 인과적 dot-product attention)의 두 경로. 이전 세그먼트의 KV({KV}_{s-1})는 메모리에서 Retrieve/Update되고, 현재 세그먼트의 KV({KV}_s)는 보통의 attention으로 처리된 뒤 위에서 Concat되어 합쳐진다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'The Infini-attention incorporates a compressive memory into the vanilla attention mechanism and builds in both masked local attention and long-term linear attention mechanisms in a single Transformer block.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2404.07143 — Leave No Context Behind: Efficient Infinite Context Transformers with Infini-attention', u:'https://arxiv.org/abs/2404.07143'}
]
});
