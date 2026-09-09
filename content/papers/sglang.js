WIKI.paper({
slug:'sglang',
venue:'arXiv 2023 (Stanford · UC Berkeley · SJTU · Texas A&M)',
authors:'Lianmin Zheng, Liangsheng Yin, Zhiqiang Xie, Ying Sheng et al.',
arxiv:'2312.07104',

tldr:'프롬프트를 하나의 독립 요청으로 보지 않고, 여러 호출이 **공유하는 접두사**로 보고 KV 캐시를 자동으로 재사용하는 RadixAttention을 제안한 논문. 여기에 구조화된 생성을 위한 프론트엔드 언어를 더해, LLM을 "여러 번 호출하는 프로그램"으로 다루는 시스템을 만들었다.',

context:'[vLLM](#/p/vllm)의 PagedAttention은 요청 하나의 KV 캐시를 페이지 단위로 관리해 메모리 낭비를 줄였지만, 요청이 끝나면 그 KV 캐시는 버려진다. 그런데 실제 LLM 사용은 이미 단발성 채팅을 넘어섰다 — few-shot 예시, self-consistency로 같은 프롬프트를 여러 번 샘플링, 멀티턴 대화, 에이전트의 반복 호출처럼 **여러 생성 호출이 똑같은 접두사를 공유**하는 패턴이 흔하다. 기존 서빙 엔진은 워크로드를 모르는 범용 스케줄러라 이런 공유 기회를 놓치고 매번 접두사를 다시 계산한다. SGLang의 질문은 "여러 호출에 걸친 접두사 재사용을 시스템이 자동으로 해줄 수 없는가"이다.',

ideas:[
 {h:'RadixAttention: KV 캐시를 요청이 끝나도 버리지 않는다',
  lead:'생성이 끝난 뒤에도 KV 캐시를 radix tree에 남겨 이후 요청과의 공통 접두사를 재사용한다.',
  d:'기존 시스템은 요청 처리가 끝나면 그 KV 캐시를 해제한다. SGLang은 대신 완료된 요청의 KV 캐시를 **radix tree**(공통 접두사를 압축해 표현하는 트리)에 계속 보관한다. 새 요청이 들어오면 트리에서 가장 긴 공통 접두사를 찾아 그 부분의 KV 캐시를 그대로 재사용하고, 갈라지는 지점부터만 새로 계산한다. 메모리가 차면 LRU(least-recently-used) 정책으로 트리의 리프부터 evict한다.'},
 {h:'cache-aware 스케줄링: 접두사가 겹치는 요청을 몰아서 처리',
  lead:'요청 순서를 접두사 공유가 큰 순서로 재배열해 캐시 적중률을 끌어올린다.',
  d:'요청을 들어온 순서 그대로 처리하면 서로 다른 접두사를 가진 요청이 번갈아 배치에 들어와 캐시가 자주 뒤바뀐다(cache thrashing). SGLang은 대기 중인 요청들을 **가장 긴 공유 접두사 우선(longest-shared-prefix-first)** 순서로 재정렬한다. 이는 radix tree를 깊이우선(DFS) 순서로 순회하는 것과 동치이며, 논문은 이 순서가 오프라인 상황에서 최적 캐시 적중률을 낸다는 것을 증명한다.'},
 {h:'compressed FSM: 정해진 다음 토큰은 여러 개를 한 번에 디코딩',
  lead:'정규식 제약을 압축된 유한상태기계로 표현해, 다음 토큰이 확정된 구간을 한 forward에 묶어 낸다.',
  d:'JSON 같은 구조화 출력을 정규식 제약으로 강제할 때, 기존 시스템은 매 스텝 허용 토큰만 masking하며 **토큰 하나씩** 디코딩한다. 하지만 `{"summary": ` 처럼 다음에 올 문자열이 하나로 확정된 구간은 사실 토큰마다 forward pass를 돌릴 필요가 없다. SGLang은 FSM에서 다음 상태가 유일하게 정해지는 연속 구간을 하나의 엣지로 압축해, 그 구간 전체를 한 번의 forward pass로 채워 넣는다.'},
 {h:'구조화 생성을 위한 프론트엔드 언어',
  lead:'`gen`·`select`·`fork`·`join` 같은 Python 내장 프리미티브로 멀티콜 프로그램을 자연스럽게 표현한다.',
  d:'LLM 프로그램은 흔히 여러 번의 생성 호출과 제어 흐름이 뒤섞여 있다. SGLang은 Python에 내장된 DSL로 `extend`(프롬프트 이어붙이기)·`gen`(생성)·`select`(분류)와 `fork`/`join`(병렬 분기)을 제공해, 이런 멀티콜 구조를 코드로 그대로 표현하면서 인터프리터가 그 구조를 런타임에 알 수 있게 한다. 이 구조 정보가 있어야 RadixAttention이 어디서 접두사가 갈라지는지 힌트를 받을 수 있다.'}
],

diagram:{type:'flow', cap:'SGLang의 프론트엔드-런타임 분리 구조. 인터프리터가 언어 프리미티브를 최적화된 런타임에 넘긴다.',
 nodes:[
  {t:'SGLang 프로그램', s:'gen/select/fork'},
  {t:'인터프리터', s:'프롬프트 스트림 관리'},
  {t:'RadixAttention', s:'KV 캐시 재사용', acc:true},
  {t:'압축 FSM', s:'다중 토큰 디코딩'},
  {t:'실행 결과', s:'생성/구조화 출력'}
 ]},

math:[
 {expr:'cache hit rate = (캐시된 프롬프트 토큰 수) / (전체 프롬프트 토큰 수)',
  tex:'\\text{cache hit rate} = \\frac{\\text{number of cached prompt tokens}}{\\text{number of prompt tokens}}',
  d:'RadixAttention 효과를 측정하는 핵심 지표. 논문 실험에서 워크로드에 따라 50%에서 99%까지 관측되며, 적중률이 높을수록 배치를 더 키울 수 있어 처리량이 올라간다.'}
],

numbers:[
 {k:'처리량 향상', v:'최대 6.4×', d:'vLLM·Guidance·LMQL 등 기존 시스템 대비, 다양한 워크로드·모델·하드웨어에서'},
 {k:'지연시간 감소', v:'최대 3.7×', d:'Llama-7B, A10G GPU 기준'},
 {k:'실측 캐시 적중률', v:'52.4% / 74.1%', d:'프로덕션 배포 1개월 관측치, LLaVA-Next-34B / (비교 대상) 기준'},
 {k:'실험 캐시 적중률 범위', v:'50%~99%', d:'워크로드별로 RadixAttention이 달성한 적중률'}
],

impact:'SGLang은 KV 캐시를 "요청 하나의 자원"이 아니라 "여러 호출이 공유하는 자원"으로 재정의했다. RadixAttention은 이후 여러 서빙 엔진에 이식되는 표준 캐시 재사용 기법이 되었고, 프론트엔드 언어가 런타임에 힌트를 주는 "co-design" 방식은 구조화 생성·에이전트 워크로드가 늘어나는 흐름과 맞물려 실제 프로덕션 서빙 스택의 설계 방향에 영향을 줬다. [FlashAttention](#/p/flashattention) 커널 위에서 캐시 관리 계층을 어떻게 짜야 하는지를 보여준 사례이기도 하다.',

legacy:[
 'RadixAttention은 이후 [vLLM](#/p/vllm)을 포함한 여러 서빙 엔진에 접두사 캐싱(prefix caching) 기능으로 부분 이식됨',
 '"프롬프트를 트리로 관리한다"는 아이디어는 [Medusa](#/p/medusa)류 트리 attention과 함께 배치 추론에서 여러 후보/분기를 다루는 일반적 데이터 구조로 자리잡음',
 '구조화 출력(JSON 모드)을 위한 압축 FSM은 이후 grammar-constrained decoding 라이브러리들의 성능 최적화 참고점이 됨',
 '"LLM 프로그램"이라는 프레이밍은 에이전트·멀티콜 워크로드가 표준이 된 이후 서빙 시스템 설계의 공통 어휘가 됨'
],

pitfalls:[
 '**RadixAttention은 무조건 이득이 아니다.** 요청들이 서로 접두사를 공유하지 않는 워크로드(예: 완전히 독립적인 프롬프트들)에서는 캐시 적중률이 낮아 관리 오버헤드만 남을 수 있다.',
 '**cache-aware 스케줄링은 굶주림(starvation) 위험이 있다.** 논문도 탐욕적으로 캐시 적중률만 최적화하면 특정 요청이 계속 뒤로 밀릴 수 있다고 인정하며, 공정성 스케줄링과의 결합은 향후 과제로 남겼다.',
 '**온라인 상황에서는 이론적 최적(Theorem 3.1)이 보장되지 않는다.** DFS 순서 최적성은 오프라인 배치 기준이고, 요청이 계속 들어오는 온라인 설정에서는 근사만 가능하다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'프론트엔드(SGLang Client)에서 짠 언어 프리미티브를 인터프리터가 실행 스트림으로 바꿔 런타임(SGLang Runtime)에 넘긴다. 이 논문의 세 가지 기법 — RadixAttention·압축 FSM·API 추측 실행 — 이 전부 오른쪽 런타임 안에 들어간다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig1-radixtree.png',
  cap:'시간이 흐르며 radix tree가 어떻게 변하는지 보여주는 9단계 중 앞부분. (2)에서 첫 대화가 트리에 노드로 들어가고, (3)에서 같은 시스템 프롬프트를 공유하는 새 턴이 그 위에 이어붙는다. (4)에서 두 번째 대화 세션이 시작되며 공유 노드가 갈라지고, (5)에서 메모리가 부족해지자 파란 점선 X 표시된 노드가 LRU 정책으로 evict된다.',
  src:'원문 Figure 3, p.5 (9단계 중 1~5단계)'}
],

quotes:[
 {t:'Instead, our system maintains an LRU cache of the KV cache for all requests within a radix tree.',
  src:'Introduction, p.2'}
],

links:[
 {t:'arXiv 2312.07104 — SGLang', u:'https://arxiv.org/abs/2312.07104'},
 {t:'GitHub — sgl-project/sglang', u:'https://github.com/sgl-project/sglang'}
]
});
