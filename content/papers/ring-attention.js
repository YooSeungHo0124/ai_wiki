WIKI.paper({
slug:'ring-attention',
venue:'ICLR 2024 (arXiv 2023)',
authors:'Liu, Zaharia, Abbeel (UC Berkeley)',
arxiv:'2310.01889',

tldr:'[FlashAttention](#/p/flashattention)의 블록 단위 계산을 여러 장치로 그대로 확장했다. 장치를 링(ring)으로 연결해 각자 자기 몫의 query 블록을 들고, key-value 블록을 이웃 장치와 주고받으며 도는 동안 그 통신을 계산으로 완전히 가려서, **문맥 길이가 장치 수만큼 선형으로 늘어나는데 추가 비용이 없다.**',

context:'2023년 상용 LLM들은 GPT-4 32K, Claude 100K처럼 문맥을 계속 늘리고 있었지만, self-attention의 메모리는 시퀀스 길이에 제곱으로 커진다. [FlashAttention](#/p/flashattention)과 blockwise parallel transformer(BPT)가 한 장치 안에서 softmax 행렬을 통째로 들고 있지 않고 블록 단위로 흘려 계산해 메모리 문제를 완화했지만, 이는 **한 장치의 메모리 한계** 안에서의 해법이다. 여러 장치에 시퀀스를 쪼개 나눠 담는 sequence parallelism은 있었지만, 매 층마다 통신이 계산과 겹치지 않고 순차적으로 끼어들어 장치를 늘려도 속도가 비례해서 늘지 않았다.',

ideas:[
 {h:'FlashAttention의 블록 계산을 장치 경계 밖으로 확장',
  lead:'한 장치 안에서 SRAM 블록을 스트리밍하듯, 여러 장치 사이에서 KV 블록을 스트리밍한다.',
  d:'[FlashAttention](#/p/flashattention)은 $QK^T$ 를 통째로 만들지 않고 K,V를 블록으로 쪼개 순회하며 running softmax를 갱신한다. Ring Attention은 이 순회 루프의 "다음 블록"을 **같은 장치의 다음 SRAM 조각**이 아니라 **링으로 연결된 다음 장치**로부터 받아온다. 각 장치는 자신의 query 블록 하나를 고정해 두고, key-value 블록이 링을 따라 한 바퀴 돌아 자신에게 다시 돌아올 때까지 attention을 누적한다.'},
 {h:'통신과 계산을 완전히 겹친다',
  lead:'현재 블록을 계산하는 동안 다음 블록을 미리 전송해, 통신 시간이 계산 시간 뒤에 숨는다.',
  d:'각 장치는 attention과 feedforward를 계산하는 동시에 자신이 갖고 있던 key-value 블록을 다음 장치로 보내고, 이전 장치로부터 다음 블록을 받는다. 블록 크기 $c$ 를 장치의 연산 성능 $F$(FLOPS)와 장치 간 대역폭 $B$ 로부터 $c \\geq F/B$ 가 되도록 정하면, 통신 시간이 계산 시간보다 항상 짧아 **통신이 전혀 병목이 되지 않는다** — 표준 [Transformer](#/p/transformer) 대비 추가 오버헤드가 이론상 0이다.'},
 {h:'문맥 길이가 장치 수만큼 선형으로 늘어난다',
  lead:'장치 1개로 문맥 $s$ 를 처리할 수 있으면, 장치 $n$ 개로는 문맥 $ns$ 를 같은 방식으로 처리한다.',
  d:'각 장치는 자기 몫의 query 블록에 대한 activation만 저장하면 되므로, 메모리 요구량이 장치 수와 무관하게 일정하다. 그 결과 장치를 추가할수록 다룰 수 있는 문맥 길이가 정확히 비례해서 늘어난다 — 근사 없이, 정확한(exact) attention을 유지한 채로.'}
],

diagram:{type:'loop', cap:'링으로 연결된 장치들. 각 장치는 자기 query 블록을 고정해 두고, key-value 블록이 이웃 장치로부터 도착할 때마다 attention을 누적한 뒤 자신의 블록을 다음 장치로 넘긴다.',
 center:'KV 블록이 링을 한 바퀴',
 nodes:[
  {t:'Device 1', s:'Query1 고정'},
  {t:'attention 누적', s:'Key_i·Value_i 수신', acc:true},
  {t:'KV 블록 전송', s:'다음 장치로'},
  {t:'Device 2 …', s:'동일 과정 반복'}
 ]},

math:[
 {expr:'c ≥ F / B',
  tex:'c \\geq \\frac{F}{B}',
  d:'통신-계산 완전 중첩을 위한 최소 블록 크기 조건. $F$ 는 장치당 FLOPS, $B$ 는 장치 간 대역폭. 블록당 연산 $4dc^2$ FLOPs이 블록 전송 시간 $4cd/B$ 보다 항상 길어야 통신이 계산 뒤로 완전히 숨는다.'}
],

numbers:[
 {k:'32× A100, 7B 모델', v:'100만+ 토큰', d:'기존 최고 대비 32배 문맥 확장'},
 {k:'TPUv4-512', v:'256× 확장', d:'같은 7B 모델 기준, 3천만 토큰 이상 학습 가능'},
 {k:'통신 오버헤드', v:'0', d:'블록 크기 조건 $c\\ge F/B$ 를 만족하면 표준 Transformer 대비 추가 비용 없음'},
 {k:'메모리 스케일링', v:'장치 수와 무관', d:'호스트당 저장하는 블록 수가 일정 — query 1개 + key/value 각 2개분'},
 {k:'8× A100 대비', v:'8배 개선', d:'이전 최고 방법(BPT) 대비 문맥 길이'}
],

impact:'긴 문맥을 늘리는 문제를 "한 장치 안에서 어떻게 메모리를 아낄까"에서 "여러 장치에 어떻게 무손실로 분산할까"로 옮겼다. [YaRN](#/p/yarn)·[Position Interpolation](#/p/position-interpolation)이 **같은 파라미터로 더 긴 위치를 다루게** 만드는 알고리즘적 해법이라면, Ring Attention은 **동일한 정확한 attention을 그대로 유지한 채 장치를 늘려 문맥을 늘리는** 시스템 레벨 해법이다. 이후 수백만 토큰급 문맥을 표방하는 모델들의 학습 인프라에 이 아이디어가 흡수됐다.',

legacy:[
 '**Blockwise Parallel Transformer 계열의 완성** — [FlashAttention](#/p/flashattention)의 블록 트릭이 단일 GPU에서 GPU 클러스터로 확장되는 마지막 단계를 채움',
 '**"근사 없는" 초장문맥의 표준 레시피** — 이후 수백만 토큰 문맥을 주장하는 모델 학습 인프라에서 ring/sequence parallelism이 기본 구성 요소로 자리잡음',
 '**늘린 문맥의 활용 문제와 분리** — Ring Attention은 "얼마나 긴 문맥을 다룰 수 있는가"를 풀 뿐, [Lost in the Middle](#/p/lost-in-the-middle)이 지적한 "그 문맥을 실제로 고르게 쓰는가"는 별개 문제로 남음',
 '**RL·비디오 등 초장문 시퀀스로 확장** — 텍스트뿐 아니라 긴 액션 시퀀스·비디오 프레임 같은 비언어 모달리티의 장기 문맥 처리에도 같은 방식이 적용됨'
],

pitfalls:[
 '**"무한 문맥"은 이론적 극한이지 공짜가 아니다.** 장치를 늘릴수록 문맥이 선형으로 늘지만, 그만큼 실제 GPU/TPU 대수와 네트워크 대역폭이 필요하다 — 개인 실험 환경에서 그대로 재현하기는 어렵다.',
 '**블록 크기 조건($c\\ge F/B$)이 하드웨어마다 다르다.** 대역폭이 낮은 클러스터에서는 필요한 블록 크기가 커져 SRAM/HBM 여유가 부족해질 수 있고, 이 경우 통신-계산 중첩이 깨져 이론적 무오버헤드가 성립하지 않는다.',
 '**정확한(exact) attention을 유지한다는 것이지 attention 자체의 $O(n^2)$ 연산량을 줄이는 것은 아니다.** 총 FLOPs는 그대로이며, 늘어난 것은 그것을 감당할 수 있는 총 메모리·병렬성이다.'
],

figures:[
 {f:'fig2-ring.png',
  cap:'위(a): 두 장치가 서로 key-value 블록을 주고받는 구조 — 각 장치는 자기 query 블록을 고정한 채 attention→feedforward를 계산하며 옆 장치로 KV를 넘긴다. 아래(b): 4개 장치를 링으로 볼 때의 전체 그림. 세로가 "query 바깥 루프", 가로가 "key-value 안쪽 루프"이고, 노란 점선 화살표(compute, send to next device / receive from previous device)가 계산과 통신이 동시에 일어남을 보여준다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'Our approach enables training and inference of sequences that are up to device count times longer than those achievable by prior memory-efficient Transformers, without resorting to approximations or incurring additional communication and computation overheads.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2310.01889 — Ring Attention with Blockwise Transformers', u:'https://arxiv.org/abs/2310.01889'},
 {t:'GitHub — lhao499/llm_large_context', u:'https://github.com/lhao499/llm_large_context'}
]
});
