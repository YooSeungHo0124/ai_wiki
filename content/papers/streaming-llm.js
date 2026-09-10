WIKI.paper({
slug:'streaming-llm',
venue:'ICLR 2024',
authors:'Xiao, Tian, Chen, Han, Lewis (MIT · Meta AI · CMU)',
arxiv:'2309.17453',

tldr:'슬라이딩 윈도우로 KV 캐시를 고정 크기로 유지하면 **초기 토큰 몇 개만 사라져도 성능이 붕괴**한다는 것을 발견하고, 그 초기 토큰(attention sink)만 항상 남겨 두면 파인튜닝 없이 400만 토큰까지 안정적으로 스트리밍할 수 있음을 보인 논문. [H2O](#/p/h2o)의 동적 점수 계산 없이, 고정된 몇 개의 위치만 고정 유지하는 훨씬 단순한 정책이다.',

context:'[H2O](#/p/h2o)는 어떤 토큰이 중요한지 매 스텝 점수를 계산해 판단했다. 이 논문은 더 단순한 질문에서 출발한다 — 슬라이딩 윈도우로 최근 $L$개 토큰만 캐시에 남기는 **window attention**이 가장 직관적인 캐시 축소법인데, 왜 텍스트 길이가 캐시 크기를 넘는 순간 perplexity가 폭발할까? 정답을 찾는 과정에서 저자들은 초기 토큰 몇 개를 캐시에서 제거하는 순간 성능이 무너진다는 사실을 관찰했고, 그 원인을 소프트맥스의 구조적 성질에서 찾는다.',

ideas:[
 {h:'Window attention은 초기 토큰이 빠지는 순간 무너진다',
  lead:'슬라이딩 윈도우로 최근 토큰만 캐시하면 첫 토큰이 evict되는 순간 perplexity가 치솟는다.',
  d:'PG19의 20K 토큰 텍스트로 언어모델링 perplexity를 측정하면, 텍스트 길이가 캐시 크기를 넘어 **가장 처음 토큰의 KV가 제거되는 시점**에 perplexity가 폭발한다. 거리가 먼 토큰이 사라져서가 아니라, 절대적으로 **처음 몇 개** 토큰이 사라진 것이 원인임을 실험으로 확인했다(Table 1: 4+1020 캐시는 PPL 5.40, 0+1024는 PPL 5158).'},
 {h:'Attention sink: 소프트맥스는 어딘가에는 확률을 줘야 한다',
  lead:'소프트맥스가 항상 합이 1이 되어야 해서, 쓸모없는 attention도 어딘가에 버려야 한다.',
  d:'attention 가중치는 소프트맥스로 정규화되어 모든 컨텍스트 토큰에 대한 합이 반드시 1이 된다. 현재 쿼리가 어떤 토큰과도 강하게 매칭되지 않아도 모델은 그 확률 질량을 **어딘가에** 버려야 하고, 초기 토큰은 자기회귀 구조상 이후 모든 토큰에서 항상 보이는 위치라 이 "쓰레기통" 역할을 학습하기 가장 쉽다. 저자들은 의미와 무관하게 위치만으로 이 현상이 생긴다는 것을 첫 4개 토큰을 개행 문자 `\\n`으로 바꿔도 동일하게 sink 역할을 한다는 실험으로 확인했다.'},
 {h:'StreamingLLM: 싱크 몇 개 + 슬라이딩 윈도우',
  lead:'맨 앞 4개 토큰의 KV를 항상 고정하고 나머지는 최근 토큰만 슬라이딩 윈도우로 유지한다.',
  d:'H2O처럼 매 스텝 점수를 계산하지 않는다. 그냥 **처음 4개 토큰의 KV를 절대 축출하지 않고 고정**한 뒤, 나머지 캐시 슬롯은 보통의 슬라이딩 윈도우로 채운다. 캐시 크기는 $O(TL)$로 일정하고 재계산이 없어, $O(TL^2)$인 "슬라이딩 윈도우+재계산" 방식보다 최대 22.2배 빠르다.'},
 {h:'몇 개의 sink가 필요한가 — 1~2개로는 부족하다',
  lead:'sink 토큰을 1~2개만 남기면 완전히 회복되지 않고, 4개부터 충분하다.',
  d:'초기 토큰을 1~2개만 유지하면 perplexity가 부분적으로만 회복되고, 4개부터 완전히 회복되며 그 이상 추가해도 이득이 거의 없다(Table 2). 원인은 Llama-2 등의 사전학습 데이터에 **일관된 시작 토큰이 없었다**는 것 — 문단 앞에 `<s>`를 붙이긴 하지만 청킹 이후에는 위치 0을 차지하는 경우가 드물어, 모델이 특정 한 위치 대신 여러 초기 위치에 분산해서 sink 역할을 학습했기 때문이다.'},
 {h:'사전학습에 전용 Sink Token을 넣으면 1개로 충분해진다',
  lead:'학습 데이터마다 학습 가능한 sink 토큰 하나를 앞에 붙이면 스트리밍 시 그 하나만 있으면 된다.',
  d:'160M 파라미터 모델을 처음부터 세 버전(vanilla·SoftMax1·learnable Sink Token)으로 사전학습해 검증했다. 전용 Sink Token을 모든 학습 샘플 앞에 붙이면, 스트리밍 시 그 토큰 하나만 캐시에 남겨도 perplexity가 안정적이다(Table 3: Learnable Sink는 1+1023 구성에서 PPL 18.01, vanilla는 같은 구성에서 18.49지만 0+1024에서는 27.87로 vanilla도 나쁘지 않은데 반해 Zero Sink는 29214로 폭발).'}
],

diagram:{type:'compare', cap:'4가지 캐시 전략의 attention 패턴과 복잡도·perplexity 비교(Llama-2-13B, PG19 첫 책 65K 토큰).',
 left:{t:'Window Attention', items:['최근 L개 KV만 유지, O(TL)','초기 토큰 축출 시 PPL 5158로 붕괴','캐시 크기는 작지만 불안정']},
 right:{t:'StreamingLLM', items:['sink 4개 고정 + 슬라이딩 윈도우, O(TL)','PPL 5.40로 안정, 재계산 없음','재계산 대비 최대 22.2배 빠름']}},

math:[
 {expr:'softmax(x)_i = exp(x_i) / Σ_j exp(x_j)   — 항상 Σ_i softmax(x)_i = 1',
  tex:'\\text{softmax}(x)_i=\\frac{\\exp(x_i)}{\\sum_j \\exp(x_j)},\\qquad \\sum_i \\text{softmax}(x)_i = 1',
  d:'attention sink가 생기는 근본 원인. 쿼리가 어떤 키와도 강하게 매칭되지 않아도 소프트맥스는 확률 질량을 어딘가에 나눠줘야 하며, 그 몫이 항상 보이는 초기 토큰에 쌓인다.'},
 {expr:'SoftMax1(x)_i = exp(x_i) / (1 + Σ_j exp(x_j))',
  tex:'\\text{SoftMax}_1(x)_i=\\frac{\\exp(x_i)}{1+\\sum_{j=1}^{N}\\exp(x_j)}',
  d:'분모에 1을 더해 "아무 토큰에도 주지 않는" 선택지를 열어 둔 변형(Miller, 2023의 off-by-one). 값이 0인 Key·Value를 하나 prepend한 것과 동등하지만, 실험 결과 확실한 해법은 아니었다(Zero Sink 구성은 여전히 다른 초기 토큰에 의존).'}
],

numbers:[
 {k:'attention sink 개수', v:'4개', d:'Llama-2 등 기존 사전학습 모델에서 window attention 성능을 회복시키는 데 필요한 최소 초기 토큰 수'},
 {k:'최대 디코딩 속도향상', v:'22.2×', d:'슬라이딩 윈도우+재계산 대비 토큰당 지연시간(A6000, Llama-2-7B/13B)'},
 {k:'검증한 최대 길이', v:'400만 토큰+', d:'Llama-2·MPT·Falcon·Pythia 계열 전체에서 안정적으로 language modeling 수행'},
 {k:'복잡도', v:'O(TL)', d:'window attention과 동일한 복잡도를 유지하면서 안정성만 확보 (dense attention은 O(T²))'},
 {k:'사전학습 sink 토큰', v:'1개', d:'학습 시 전용 Sink Token을 넣으면 스트리밍 때 4개 대신 그 1개만으로 충분(Table 3)'},
 {k:'캐시 크기 증가 효과', v:'비일관적', d:'Table 6에서 캐시를 키워도 perplexity가 꾸준히 내려가지 않음 — 모델이 전체 컨텍스트를 다 활용하지 못한다는 신호'}
],

impact:'"긴 문맥을 다룬다"를 아키텍처 확장이 아니라 **캐시 정책 문제**로 재정의했다. 파인튜닝도 재계산도 없이 소프트맥스 하나의 구조적 성질만 이용해 사실상 무한 길이 생성을 가능하게 했고, [YaRN](#/p/yarn)·[위치 보간](#/p/position-interpolation)처럼 위치 인코딩을 늘리는 접근과는 완전히 다른 축(캐시를 무엇으로 채울지)에서 문제를 풀었다는 점이 핵심이다. 다만 저자들 스스로 이 방법이 컨텍스트 윈도우를 "늘리는" 것이 아니라 **캐시 밖으로 나간 정보는 영구히 사라진다**는 점을 명시해, 이후 연구들이 "안정적 생성"과 "장기 기억"을 구분해 다루는 계기가 됐다.',

legacy:[
 '**H2O와의 분화** — [H2O](#/p/h2o)의 동적 점수 계산 대신 고정 위치만 지키는 더 단순한 정책으로도 무한 스트리밍이 된다는 것을 보여, 이후 캐시 관리 연구가 "정적 규칙 vs 동적 점수" 두 갈래로 나뉘는 계기가 됨',
 '**Infini-attention과의 결합 축** — [Infini-attention](#/p/infini-attention)은 지역 윈도우 바깥의 정보를 그냥 버리지 않고 압축 메모리로 흡수하려 한다는 점에서, 이 논문이 명시한 한계("캐시 밖은 잊는다")를 정면으로 겨냥한 후속 시도',
 '**서빙 시스템에 기본 옵션으로 흡수** — vLLM, TensorRT-LLM 등 다수 서빙 엔진이 attention sink를 캐시 관리 옵션으로 채택',
 '**"perplexity 안정"과 "긴 문맥 이해"의 구분을 명문화** — 이후 LongBench, Needle-in-a-Haystack류 벤치마크가 "PPL이 안 터진다"만으로는 검색·추론 능력을 보장하지 못한다는 것을 검증하는 흐름의 배경이 됨'
],

pitfalls:[
 '**"무한 스트리밍이 된다"가 "문맥을 전부 기억한다"를 뜻하지 않는다.** 저자들이 Limitations에서 직접 명시하듯, StreamingLLM은 컨텍스트 윈도우를 확장하거나 장기 기억을 향상시키지 않는다 — 캐시 밖으로 밀려난 토큰은 그냥 사라지므로, 긴 문서 QA·요약처럼 이전 내용을 다시 끌어와야 하는 과제에는 부적합하다고 스스로 밝힌다.',
 '**sink가 의미적으로 중요해서가 아니다.** 첫 4개 토큰을 개행 문자로 바꿔도 sink 역할이 유지된다는 실험이 보여주듯, sink의 효과는 그 토큰의 **내용이 아니라 절대 위치**(항상 보이는 자리)에서 나온다. "중요한 정보를 앞에 배치하면 보존된다"는 식으로 오해하면 안 된다.',
 '**캐시를 키운다고 성능이 항상 좋아지지 않는다.** Table 6에서 보듯 cache size를 늘려도 perplexity가 일관되게 낮아지지 않아, 모델이 주어진 컨텍스트를 전부 활용하지 못하고 있다는 별개의 한계가 드러난다 — 캐시 확장과 실제 활용 능력은 다른 문제다.'
],

figures:[
 {f:'fig1-methods-compare.png',
  cap:'네 가지 캐시 전략의 attention 패턴(파란색 칸이 실제로 attend하는 위치, 빨간색은 현재 토큰). (b) window attention은 초기 토큰(맨 왼쪽 열)이 회색으로 지워지며 PPL 5158로 붕괴. (d) StreamingLLM은 노란색 sink 열을 항상 남겨 PPL 5.40으로 안정.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We attribute the reason to the Softmax operation, which requires attention scores to sum up to one for all contextual tokens.',
  src:'Section 3.1, p.4'},
 {t:'StreamingLLM does not extend the models\' context window or enhance their long-term memory capabilities.',
  src:'Limitations, p.10'}
],

links:[
 {t:'arXiv 2309.17453 — Efficient Streaming Language Models with Attention Sinks', u:'https://arxiv.org/abs/2309.17453'},
 {t:'GitHub — mit-han-lab/streaming-llm', u:'https://github.com/mit-han-lab/streaming-llm'}
]
});
