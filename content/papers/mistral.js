WIKI.paper({
slug:'mistral',
venue:'arXiv 2023 (Mistral AI)',
authors:'Jiang et al. (Mistral AI)',
arxiv:'2310.06825',

tldr:'7B 크기에 **sliding window attention과 [GQA](#/p/gqa)**를 넣어 [Llama 2](#/p/llama2) 13B를 전 벤치마크에서, [LLaMA](#/p/llama) 1 34B를 추론·수학·코드에서 이긴 모델. 제약 없는 Apache 2.0으로 배포되며 "작은 모델의 상한"에 대한 기대치를 다시 그렸다.',

context:'[Llama 2](#/p/llama2)가 오픈 웨이트를 산업 기본값으로 만든 직후, 남은 질문은 **"7B라는 크기에서 실제로 어디까지 갈 수 있는가"** 였다. 당시의 암묵적 답은 "13B보다는 확실히 못하다"였고, 크기별 성능 순위는 고정된 것처럼 취급됐다. 동시에 실무의 병목은 성능이 아니라 추론 비용 쪽에 있었다 — 문맥을 늘리면 attention이 $O(n^2)$ 로 늘고 KV 캐시가 배치 크기에 비례해 부풀어, 서빙 처리량이 먼저 무너졌다. Mistral 7B는 이 둘을 같은 답으로 푼다: **attention이 보는 범위 자체를 제한한다.**',

ideas:[
 {h:'Sliding Window Attention — 각 토큰은 최근 W개만 본다',
  lead:'각 토큰이 최근 W개만 보되, 층을 쌓아 수용 영역을 곱으로 넓힌다.',
  d:'전체 시퀀스를 보는 대신 각 토큰이 직전 $W=4096$ 개 토큰만 참조한다. attention 계산이 길이에 대해 $O(n^2)$ 에서 $O(n \\cdot W)$ 로 떨어진다. 문제는 "그러면 4096칸 밖의 정보는 못 보는 것 아닌가"인데, **층을 쌓으면 해결된다** — 1층에서 4096칸을 보고, 그 결과를 2층에서 다시 4096칸 보면 실질 수용 영역이 8192가 되고, 32개 층이면 이론적 범위는 약 131K 토큰까지 늘어난다. [CNN](#/p/lenet)의 수용 영역이 층을 쌓을수록 넓어지는 것과 정확히 같은 논리다.'},
 {h:'Rolling Buffer Cache — KV 캐시 크기를 고정한다',
  lead:'윈도우 밖 토큰을 링 버퍼로 덮어써 캐시 크기를 W로 고정한다.',
  d:'윈도우 밖의 토큰은 어차피 참조되지 않으므로 KV 캐시에 남겨둘 이유가 없다. 캐시를 크기 $W$ 의 링 버퍼로 만들어 위치 $i$ 의 토큰을 $i \\bmod W$ 슬롯에 덮어쓴다. 시퀀스가 아무리 길어져도 캐시는 $W$ 개에서 멈춘다. 32k 토큰 시퀀스에서 **메모리 사용량이 8배 줄었고**, 품질 저하는 없었다.'},
 {h:'GQA로 남은 KV 메모리를 한 번 더 줄인다',
  lead:'query head 4개가 KV 1세트를 공유해 캐시를 다시 4분의 1로 줄인다.',
  d:'32개 query head에 대해 KV head는 8개만 둔다([GQA](#/p/gqa)). 4개의 query head가 하나의 K·V를 공유하므로 KV 캐시가 다시 4분의 1이 된다. sliding window가 캐시의 **길이 방향**을, GQA가 **head 방향**을 줄이는 직교적인 두 절감이라 효과가 곱해진다.'},
 {h:'Pre-fill과 chunking',
  lead:'긴 프롬프트를 윈도우 크기 청크로 잘라 순차적으로 채운다.',
  d:'프롬프트는 미리 알고 있으므로 KV 캐시를 통째로 채워둘 수 있는데, 프롬프트가 길면 이때 메모리가 터진다. 그래서 프롬프트를 윈도우 크기 단위 청크로 잘라 순차 처리한다. 각 청크는 자기 자신(causal mask)과 직전 청크(캐시)만 보면 되므로 윈도우 밖은 계산조차 하지 않는다.'},
 {h:'가중치를 아무 조건 없이 푼다',
  lead:'MAU 제한이 없는 Apache 2.0으로 풀어 채택 장벽을 없앤다.',
  d:'[Llama 2](#/p/llama2)의 커뮤니티 라이선스에 붙어 있던 MAU 제한과 파생 모델 학습 금지 조항이 없는 **Apache 2.0**으로 배포됐다. 실무 채택에서 이 차이는 아키텍처만큼이나 크게 작용했다.'}
],

diagram:{type:'stack', cap:'sliding window는 층을 쌓으면 수용 영역이 곱해진다. 4096칸 윈도우 × 32층 ≈ 131K 토큰.',
 layers:[
  {t:'Layer 1', s:'윈도우 W=4096 · 4K'},
  {t:'Layer 2', s:'8K', note:'앞 층 출력이 4K 요약'},
  {t:'…', s:''},
  {t:'Layer 32', s:'이론범위 ≈131K', acc:true, note:'k × W'},
  {t:'KV 캐시', s:'항상 W개 고정(링버퍼)'},
  {t:'GQA', s:'32 q-head / 8 kv-head', note:'캐시 다시 1/4'}
 ]},

math:[
 {expr:'attention span at layer k  ≈  k × W',
  tex:'\\text{span}(k) \\approx k \\times W',
  d:'각 층이 윈도우 $W$ 만큼 정보를 앞으로 밀어주므로, $k$ 층을 지나면 이론상 $k \\cdot W$ 떨어진 토큰의 정보까지 도달한다. 다만 이는 **정보가 전달될 수 있는 상한**이지 모델이 그 거리를 실제로 잘 활용한다는 보장은 아니다.'},
 {expr:'cache slot(i) = i mod W',
  tex:'\\text{slot}(i) = i \\bmod W',
  d:'링 버퍼 인덱싱. 위치 $i$ 의 KV가 이전의 $i-W$ 번째 것을 덮어쓴다. 시퀀스 길이와 무관하게 캐시 메모리가 상수로 유지되는 것이 서빙에서의 핵심 이득이다.'}
],

numbers:[
 {k:'파라미터', v:'7.3B', d:'dim 4096 · 32층 · hidden 14336 · vocab 32000'},
 {k:'슬라이딩 윈도우 W', v:'4096', d:'문맥 길이 8192 · 이론적 attention 범위 약 131K'},
 {k:'GQA 구성', v:'q-head 32 / kv-head 8', d:'query 4개가 KV 1세트를 공유'},
 {k:'KV 캐시 절감', v:'8배', d:'32k 토큰 시퀀스에서 rolling buffer 적용 시 · 품질 저하 없음'},
 {k:'MMLU', v:'60.1%', d:'같은 표에서 Llama 2 7B 44.4%, Llama 2 13B 55.6%'},
 {k:'코드 생성', v:'HumanEval 30.5% · MBPP 47.5%', d:'코드 특화 모델 CodeLlama 7B에 근접'},
 {k:'MT-Bench (Instruct)', v:'6.84', d:'Llama 2 13B Chat(6.65)보다 높음'}
],

impact:'**(1) 크기 순위가 무너졌다.** 7B가 13B를 전 항목에서 이기면서 "파라미터 수 = 성능"이라는 어림짐작이 통하지 않게 됐고, 데이터 품질과 아키텍처 선택이 크기만큼 중요하다는 인식이 자리 잡았다. **(2) 서빙 관점의 아키텍처.** sliding window와 rolling buffer cache는 loss를 낮추는 기법이 아니라 **KV 캐시 메모리를 상수로 만드는 기법**이다. 모델 설계가 학습 목표뿐 아니라 추론 시스템([vLLM](#/p/vllm) 같은 서빙 레이어)을 염두에 두고 이루어지는 흐름이 여기서 뚜렷해졌다. **(3) Apache 2.0.** 조건 없는 라이선스로 배포된 첫 고성능 모델로서, 파인튜닝·양자화·상용 배포 전 과정에서 법무 검토가 필요 없는 기본 선택지가 됐다.',

legacy:[
 '**MoE로의 확장** — 같은 팀이 이 블록을 전문가 8개로 늘려 [Mixtral 8x7B](#/p/mixtral)를 만들며 sliding window 대신 32k 전체 문맥으로 전환',
 '**7B 파인튜닝 베이스의 표준** — Zephyr, OpenHermes 등 [DPO](#/p/dpo) 기반 정렬 실험의 기본 출발점이 됨',
 '**긴 문맥 접근의 분기** — 윈도우를 좁히는 이 방향과, [RoPE](#/p/rope) 스케일링으로 전체 attention을 늘리는 방향이 갈라짐',
 '**서빙 최적화와의 결합** — [FlashAttention](#/p/flashattention)·[vLLM](#/p/vllm)의 페이지 단위 KV 관리와 맞물려 긴 문맥 추론 비용 구조를 다시 계산하게 만듦'
],

pitfalls:[
 '**131K는 "문맥 길이"가 아니다.** 이론적 정보 전달 범위이지 모델이 학습된 문맥 길이가 아니다. 학습·설정상의 문맥은 8192이고, 그 이상에서 멀리 있는 사실을 정확히 인용할 것이라 기대하면 안 된다.',
 '**나중 버전에서는 sliding window가 빠졌다.** Mistral 계열 후속 모델과 [Mixtral](#/p/mixtral)은 SWA 대신 32k 전체 attention을 쓴다. "Mistral = sliding window"로 외워두면 실제 구현과 어긋난다.',
 '**학습 데이터가 전혀 공개되지 않았다.** 논문은 아키텍처와 성능 표만 담고 있고 사전학습 코퍼스에 대한 서술이 없다. [Llama 2](#/p/llama2) 13B와의 성능 차이 중 얼마가 아키텍처 덕이고 얼마가 데이터 덕인지는 논문만으로는 분리할 수 없다.'
],

figures:[
 {f:'fig1-sliding-window.png',
  cap:'왼쪽 Vanilla Attention 행렬은 대각선 아래(과거 토큰) 전부가 1 — 모든 과거를 본다. 가운데 Sliding Window Attention은 대각선에서 W=3칸까지만 1이고 그 밖은 0 — 한 층에서는 최근 W개만 본다. 오른쪽 Effective Context Length는 층을 쌓을수록(위로 갈수록) 삼각형으로 참조 범위가 넓어지는 것을 보여준다 — 한 층의 window는 좁아도 k개 층을 통과하면 최대 k×W 토큰 전의 정보까지 간접적으로 도달한다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'Our model leverages grouped-query attention (GQA) for faster inference, coupled with sliding window attention (SWA) to effectively handle sequences of arbitrary length with a reduced inference cost.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2310.06825 — Mistral 7B', u:'https://arxiv.org/abs/2310.06825'},
 {t:'Mistral AI — Announcing Mistral 7B', u:'https://mistral.ai/news/announcing-mistral-7b'},
 {t:'mistral-inference — 참조 구현', u:'https://github.com/mistralai/mistral-inference'}
]
});
