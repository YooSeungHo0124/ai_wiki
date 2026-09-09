WIKI.paper({
slug:'rwkv',
venue:'EMNLP 2023 Findings',
authors:'Bo Peng 외 (RWKV 오픈소스 커뮤니티 · EleutherAI 등 다기관)',
arxiv:'2305.13048',

tldr:'attention의 $QK^T$ 를 **채널별 지수 감쇠 가중치**로 대체해, 학습은 [Transformer](#/p/transformer)처럼 시퀀스 전체를 병렬로 돌리고 추론은 [LSTM](#/p/lstm)처럼 상태 하나만 들고 도는 아키텍처. 같은 파라미터를 병렬 형태와 재귀 형태 두 가지로 쓸 수 있다는 점이 핵심이며, 14B까지 학습해 당시 기준 가장 큰 dense RNN이 되었다.',

context:'2022~2023년의 문제의식은 [S4](#/p/s4)와 같다 — RNN의 선형 추론 비용과 Transformer의 병렬 학습을 동시에 갖고 싶다. 다만 접근이 다르다. RWKV는 상태공간 이론이 아니라 **attention 수식 자체를 뜯어보는 데서** 출발한다. Apple의 Attention Free Transformer(AFT)는 $QK^T$ 행렬 대신 위치 쌍마다 학습된 바이어스를 쓰면 $O(n^2)$ 메모리를 없앨 수 있음을 보였는데, 이 바이어스가 위치 쌍 전체에 대한 학습 파라미터라 길이가 고정된다는 한계가 있었다. RWKV는 그 바이어스를 **채널마다 하나씩의 감쇠율 $w$** 로 바꾼다. 그러면 바이어스가 거리의 함수 $-(t-i)w$ 가 되어 시간에 대해 재귀식으로 접히고, 결과적으로 길이 제한이 사라진 채 RNN이 된다. 덧붙여 이 논문은 대형 연구소가 아니라 오픈소스 커뮤니티가 수년간 굴린 프로젝트가 학회 논문으로 정리된 드문 사례다.',

ideas:[
 {h:'R·W·K·V — 네 글자의 역할',
  lead:'R은 수신 게이트, W는 채널별 감쇠율, K·V는 자기 지수로만 쓰이는 값이다.',
  d:'**R**(receptance)은 "이 위치가 과거 정보를 얼마나 받아들일지"를 정하는 시그모이드 게이트로, attention의 Query 자리를 차지하되 다른 토큰과 비교하지 않는다. **W**(weight)는 **학습되는 채널별 시간 감쇠율**로, 과거가 얼마나 빨리 잊히는지를 채널마다 다르게 만든다 — 어떤 채널은 직전 몇 토큰만, 어떤 채널은 수천 토큰을 기억하도록 분화한다. **K**(key)와 **V**(value)는 Transformer와 같은 역할이지만, K는 다른 토큰의 Q와 내적되는 대신 자기 자신의 가중치 지수로만 쓰인다.'},
 {h:'토큰 간 상호작용이 곱셈이 아니라 감쇠 누적이다',
  lead:'쌍별 비교 없이 과거 전체를 지수가중 누적합 하나로 접는다.',
  d:'attention의 비용은 모든 토큰 쌍의 유사도를 계산하는 데서 나온다. RWKV는 그 쌍별 계산을 아예 하지 않고, **과거 전체를 하나의 지수가중 누적합**으로 접는다. 대신 "현재 토큰이 어떤 과거 토큰과 내용상 유사한가"를 볼 수 없게 되므로, 무엇을 기억할지는 내용이 아니라 **위치(거리)와 채널**이 결정한다. [Mamba](#/p/mamba)가 감쇠율을 입력의 함수로 만들어 이 지점을 공략한 것과 정확히 대비된다.'},
 {h:'time-mixing과 channel-mixing 두 블록',
  lead:'attention 자리는 time-mixing이, FFN 자리는 channel-mixing이 대신한다.',
  d:'블록 하나는 두 부분으로 나뉜다. **time-mixing**은 위의 WKV 연산으로 시간 축을 따라 정보를 섞고(attention 자리), **channel-mixing**은 같은 위치 안에서 채널을 섞는다(FFN 자리). channel-mixing은 $\\max(k,0)^2$ 형태의 squared ReLU를 쓰고 여기에도 receptance 게이트가 붙는다. Transformer 블록의 "토큰 간 교환 + 채널별 계산" 분업을 그대로 유지하면서 앞쪽 부품만 갈아끼운 구조다.'},
 {h:'토큰 시프트 — 공짜로 얻는 국소 문맥',
  lead:'현재와 직전 토큰 임베딩을 학습된 비율로 섞어 국소 문맥을 싸게 얻는다.',
  d:'두 블록 모두 입력을 만들 때 현재 토큰과 **직전 토큰의 임베딩을 학습된 비율로 선형 보간**한다($x_t$ 와 $x_{t-1}$ 사이). 파라미터도 연산도 거의 들지 않지만, 각 채널이 "지금"과 "직전" 중 무엇을 볼지 고를 수 있게 되어 커널 폭 2짜리 합성곱과 같은 효과를 낸다. [Mamba](#/p/mamba)가 블록 안에 짧은 1D 합성곱을 넣은 것과 같은 목적이다.'},
 {h:'같은 가중치, 두 개의 실행 형태',
  lead:'학습은 병렬 WKV 계산으로, 추론은 상수 크기 상태 갱신으로 돌린다.',
  d:'학습 시에는 시퀀스 전체에 대해 WKV를 한 번에 계산해 $O(BTd)$ 로 병렬 처리하고(커스텀 CUDA 커널), 추론 시에는 분자·분모 누적값과 최대값 상태만 들고 토큰마다 갱신한다. 후자는 **문맥 길이와 무관한 상수 메모리·상수 시간**이다. KV 캐시가 없으므로 8k든 100k든 토큰당 생성 비용이 같고, 노트북·모바일처럼 메모리가 좁은 환경에서 실질적 이점이 된다.'}
],

diagram:{type:'stack', cap:'RWKV 블록. attention 자리에 time-mixing(WKV)이, FFN 자리에 channel-mixing이 들어간다.',
 layers:[
  {t:'입력 임베딩', s:'T × d'},
  {t:'토큰 시프트', s:'μ·x_t + (1−μ)·x_{t−1}', note:'← 채널마다 다른 보간 비율 μ'},
  {t:'Time-mixing', s:'σ(Rt)⊙지수감쇠(WKV)', acc:true, note:'← 토큰 간 교환 · O(T)'},
  {t:'Residual+LN', s:''},
  {t:'Channel-mixing', s:'σ(R) ⊙ V(max(K,0)²)', note:'← 위치별 계산 (FFN 자리)'},
  {t:'Residual+LN', s:''}
 ]},

math:[
 {expr:'wkv_t = ( Σ_{i<t} e^{−(t−1−i)w + k_i} v_i + e^{u + k_t} v_t ) / ( Σ_{i<t} e^{−(t−1−i)w + k_i} + e^{u + k_t} )',
  tex:'wkv_t = \\frac{\\sum_{i<t} e^{-(t-1-i)w+k_i}v_i + e^{u+k_t}v_t}{\\sum_{i<t} e^{-(t-1-i)w+k_i} + e^{u+k_t}}',
  d:'논문의 핵심 연산. softmax의 분모/분자 구조는 유지하되, 점수가 $q \\cdot k$ 가 아니라 **거리 기반 감쇠 $-(t-1-i)w$ 에 $k_i$ 를 더한 값**이다. $u$ 는 현재 토큰에만 붙는 보너스로, 감쇠가 자기 자신까지 깎아버리는 것을 막는다.'},
 {expr:'a_t = e^{−w} a_{t-1} + e^{k_t} v_t,   b_t = e^{−w} b_{t-1} + e^{k_t}',
  tex:'a_t = e^{-w}a_{t-1} + e^{k_t}v_t,\\quad b_t = e^{-w}b_{t-1} + e^{k_t}',
  d:'위 식이 재귀로 접히는 이유. 분자 $a$ 와 분모 $b$ 만 상태로 들고 있으면 매 스텝 상수 연산으로 갱신된다. 실제 구현은 지수 폭주를 막기 위해 running max를 함께 들고 다니는 수치 안정화 형태를 쓴다.'},
 {expr:'o_t = W_o · ( σ(r_t) ⊙ wkv_t )',
  tex:'o_t = W_o \\cdot (\\sigma(r_t) \\odot wkv_t)',
  d:'receptance $r_t$ 의 시그모이드가 출력 게이트 역할을 한다. attention 가중치가 없는 대신, "이번 위치에서 누적 상태를 얼마나 내보낼지"를 이 게이트가 조절한다.'}
],

numbers:[
 {k:'최대 모델 크기', v:'14B 파라미터', d:'논문 시점 기준 **학습된 가장 큰 dense RNN**'},
 {k:'공개 모델 계열', v:'169M · 430M · 1.5B · 3B · 7B · 14B', d:'RWKV-4 기준. 동일 아키텍처로 스케일링 곡선을 그렸다'},
 {k:'학습 데이터', v:'The Pile (825GB)', d:'동일 데이터로 학습한 Pythia·GPT-Neo 계열과 직접 비교하기 위한 선택'},
 {k:'학습 복잡도', v:'O(B·T·d)', d:'Transformer의 $O(B \\cdot T^2 \\cdot d)$ 와 대비 — 길이에 선형'},
 {k:'추론 비용', v:'토큰당 상수 시간·상수 메모리', d:'KV 캐시가 없고 상태만 갱신하므로 문맥이 길어져도 느려지지 않는다'}
],

figures:[
 {f:'fig3-rwkv-architecture.png',
  cap:'가로축이 토큰 시퀀스("My"→"name"→"is"), 세로축이 한 블록 내부다. 각 토큰은 Time Mix(다이아몬드, attention을 대체하는 선형 재귀 — 옆 토큰으로 States 화살표가 이어져 정보가 전달된다)와 Channel Mix(초록, FFN에 대응)를 순서대로 거친다. Token shift 화살표는 각 블록이 현재 토큰뿐 아니라 바로 이전 토큰의 값도 함께 섞어 쓴다는 뜻이다. 이 States 화살표 한 줄만 따라가면 RNN의 재귀식이고, 전체를 가로로 펼쳐 병렬로 계산하면 Transformer식 학습이 된다 — 같은 그림이 두 계산 모드를 다 표현한다.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'We propose a novel model architecture, Receptance Weighted Key Value (RWKV), that combines the efficient parallelizable training of transformers with the efficient inference of RNNs.',
  src:'Abstract, p.1'}
],

impact:'RWKV는 "RNN은 대규모 언어모델로 못 키운다"는 통념을 실물로 반박했다. 같은 데이터(Pile)로 학습한 동급 Transformer와 비슷한 성능을 내면서 추론이 선형이라는 점이 확인되자, attention 없는 계열이 벤치마크용 장난감이 아니라 **배포 가능한 선택지**로 인식되기 시작했다. 실무적 임팩트는 특히 엣지 쪽에서 컸다 — KV 캐시가 없어 메모리 상한이 문맥 길이에 묶이지 않으므로, CPU·모바일·브라우저에서 긴 대화를 돌리는 구현이 빠르게 등장했다. 또한 대형 연구소 밖의 오픈소스 커뮤니티가 아키텍처 자체를 설계·학습·공개한 사례로서, [Mamba](#/p/mamba)와 함께 2023년 "attention 대안" 논의를 실증 단계로 끌어올렸다.',

legacy:[
 '**RWKV-5 Eagle / RWKV-6 Finch** — 스칼라 감쇠를 행렬값 상태로 확장하고, 감쇠율 $w$ 를 입력에 따라 변하게(data-dependent) 만들어 [Mamba](#/p/mamba)식 선택성을 흡수했다',
 '**게이트 선형 attention 계열과의 수렴** — RetNet·GLA·Mamba-2와 함께 "선형 attention = 게이트 달린 선형 RNN"이라는 통합 관점이 정착했고, 서로의 커널 최적화를 공유하게 됐다',
 '**엣지 추론** — 상수 메모리 덕에 CPU·모바일·웹어셈블리 구현이 활발했고, 양자화([GPTQ](#/p/gptq)·[AWQ](#/p/awq)) 파이프라인과 결합해 소형 배포에 쓰였다',
 '**커뮤니티 주도 아키텍처의 선례** — 이후 여러 오픈 아키텍처 프로젝트가 RWKV의 개발·공개 방식을 참고했다'
],

pitfalls:[
 '**"Transformer를 대체했다"는 과장이다.** 고정 크기 상태에 과거를 압축하므로, 긴 문맥에서 특정 구절을 정확히 찾아 그대로 복사하는 태스크(정밀 검색·다중 질의 회상)에서는 attention에 뒤진다. 논문 스스로도 회상 능력의 한계를 명시하며, 프런티어급 모델은 여전히 Transformer이거나 attention을 섞은 하이브리드다.',
 '**RWKV-4의 감쇠율 $w$ 는 입력과 무관한 학습 상수다.** 즉 "이 토큰은 중요하니 오래 기억"이라는 내용 기반 선택이 원리적으로 안 된다. 이 약점이 [Mamba](#/p/mamba)의 선택적 SSM이 공략한 지점이고, RWKV 자신도 5/6세대에서 같은 방향으로 움직였다. 세대별로 성질이 크게 다르므로 "RWKV"라고 뭉뚱그려 말하면 틀린 이야기가 되기 쉽다.',
 '**프롬프트 형식에 민감하다.** 논문도 인정하는 한계로, 상태가 순차적으로 압축되기 때문에 앞쪽에 놓인 지시를 뒤에서 되짚어 재해석하기 어렵다. Transformer라면 순서를 바꿔도 되는 프롬프트가 RWKV에서는 성능 차이를 만들 수 있어, 중요한 지시를 뒤쪽에 배치하는 편이 유리하다는 실무 조언이 따라붙는다.'
],

links:[
 {t:'arXiv 2305.13048 — RWKV: Reinventing RNNs for the Transformer Era', u:'https://arxiv.org/abs/2305.13048'},
 {t:'Eagle and Finch: RWKV with Matrix-Valued States (RWKV-5/6)', u:'https://arxiv.org/abs/2404.05892'},
 {t:'BlinkDL/RWKV-LM — 공식 구현', u:'https://github.com/BlinkDL/RWKV-LM'}
]
});
