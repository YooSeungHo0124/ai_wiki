WIKI.paper({
slug:'memory-efficient-attn',
venue:'arXiv preprint (2021)',
authors:'Markus N. Rabe and Charles Staats (Google Research)',
arxiv:'2112.05682',

tldr:'self-attention이 $O(n^2)$ 메모리를 필요로 한다는 통념을 반박한 8쪽짜리 짧은 논문. 나눗셈 순서만 바꿔서 **근사 없이 정확히 같은 값을** 훨씬 적은 메모리로 계산할 수 있음을 보였고, 이 수식이 그대로 [FlashAttention](#/p/flashattention)의 출발점이 됐다.',

context:'2021년 시점 긴 문맥 attention 연구는 거의 전부 "근사"로 흘렀다. [희소 attention](#/p/sparse-attn)이나 [Linformer](#/p/linformer)처럼 $QK^\\top$ 를 어떻게든 덜 계산해서 $O(n)$ 이나 $O(n\\log n)$ 으로 낮추는 식이었고, 그 대가로 정확도를 포기했다. 그런데 정작 문제의 근원을 들여다보면, 시간 복잡도 $O(n^2)$ 는 어쩔 수 없어도 **메모리** $O(n^2)$ 는 구현의 선택일 뿐 수학적 필연이 아니었다. GPU·TPU에서는 흔히 연산량보다 메모리가 먼저 바닥나므로, 시간을 그대로 두고 메모리만 줄여도 실질적으로 더 긴 시퀀스를 처리할 수 있다는 것이 이 논문의 출발점이다.',

ideas:[
 {h:'나눗셈을 맨 끝으로 미루는 분배법칙 한 줄',
  lead:'softmax의 정규화 나눗셈을 합산이 끝난 뒤로 미뤄 누적 계산이 가능하게 만든다.',
  d:'표준 softmax attention은 모든 점수 $s_i$ 를 구해 지수화하고 합을 낸 뒤 나눠야 하므로, 그 $n$ 개의 점수를 전부 들고 있어야 한다. 이 논문은 분배법칙으로 나눗셈을 **가장 마지막으로** 옮긴다. 그러면 키·값을 하나씩 순회하며 분자 벡터 $v^*$ 와 분모 스칼라 $s^*$ 만 누적하면 되고, 다 끝난 뒤 한 번만 나누면 된다. 저자들은 발표 후 이것이 Jang et al.(2019)의 "lazy softmax"와 사실상 같은 아이디어였음을 알게 됐다고 밝힌다.'},
 {h:'온라인 max 추적으로 오버플로를 막는다',
  lead:'실행 중 최댓값을 계속 갱신하며 지수 계산 전에 빼서 overflow를 막는다.',
  d:'점수가 89 이상이면 `exp()`가 float32/bfloat16에서 그대로 `inf`가 된다. 표준 softmax는 전체 점수 중 최댓값을 먼저 구해 빼고 지수화하지만, 누적 방식에서는 마지막 값이 최댓값일 수도 있어 미리 뺄 수 없다. 그래서 지금까지 본 최댓값 $m^*$ 을 스칼라 하나로 계속 갱신하고, 새 최댓값이 나올 때마다 이미 누적된 합을 $e^{m_{old}-m_{new}}$ 로 재조정한다.'},
 {h:'TPU용 구현: 청크로 나눠 병렬화',
  lead:'query·key를 청크로 잘라 순차 누적을 병렬 스캔으로 바꾼다.',
  d:'위 알고리즘은 본질적으로 순차적이라 가속기의 병렬성을 못 쓴다. 실전 구현은 query를 일정 크기로, key·value를 $\\sqrt{n}$ 크기로 청크를 나눠 각 청크를 독립적으로 요약(`summarize_chunk`)한 뒤 재조정해서 합친다. 이렇게 하면 이론상 $O(\\log n)$ 대신 $O(\\sqrt{n})$ 메모리로 타협하지만, 계산은 청크 단위로 병렬화된다.'},
 {h:'체크포인팅으로 역전파도 메모리를 아낀다',
  lead:'순전파에서 버린 중간값을 역전파 때 재계산해 미분에서도 이득을 유지한다.',
  d:'순전파는 청크를 요약한 뒤 버리며 메모리를 아끼는데, 그대로 미분하면 역전파가 그 중간값을 전부 요구해 이득이 사라진다. 저자들은 청크 요약 함수에 gradient checkpointing을 적용해, 순전파 때는 잊고 역전파 때 그 청크만 다시 계산하게 만들었다. 대가는 속도 — 재계산 비용만큼 역전파가 느려진다.'},
 {h:'근사가 아니라 정확히 같은 함수',
  lead:'출력값이 표준 attention과 수치오차 범위 안에서 완전히 동일하다.',
  d:'이 논문이 다른 긴 문맥 연구들과 구분되는 지점이다. [희소 attention](#/p/sparse-attn)이나 저순위 근사 계열은 다른 함수를 계산해서 메모리를 아끼지만, 이 방법은 계산 순서만 바꿨을 뿐 **똑같은 softmax attention을 정확히** 계산한다. 그래서 기존 attention 모듈을 그대로 대체할 수 있는 drop-in replacement라고 저자들은 강조한다.'}
],

diagram:{type:'compare', cap:'표준 attention은 n×n 점수 행렬을 한꺼번에 들고 있다가 나누지만, 이 논문은 키·값을 순회하며 누적만 하다가 맨 마지막에 한 번만 나눈다.',
 left:{t:'기존: 표준 attention', items:['n×n 점수 행렬 전부 저장','O(n²) 메모리','긴 n에서 OOM']},
 right:{t:'이 논문: 순차 누적', items:['키·값 순회하며 누적만','O(log n)~O(1) 메모리','TPU 구현은 O(√n)']}
},

math:[
 {expr:'attention(q,k,v) = (Σ vi·e^si) / (Σj e^sj)',
  tex:'\\text{attention}(q,k,v)=\\frac{\\sum_i v_i\\, e^{s_i}}{\\sum_j e^{s_j}},\\quad s_i=\\text{dot}(q,k_i)',
  d:'표준 정의(분자·분모를 따로 정규화한 뒤 곱하는 것)와 수학적으로 동일하지만, 분배법칙으로 나눗셈을 맨 끝으로 미뤘다는 점이 다르다. 이 순서 하나로 $s_i$ 를 전부 저장할 필요가 없어진다.'},
 {expr:'v* ← v*·e^(m_old-m_new) + vi·e^(si-m_new),  s* ← s*·e^(m_old-m_new) + e^(si-m_new)',
  tex:'v^{*} \\leftarrow v^{*} e^{m^{*}-m_i} + v_i e^{s_i-m_i},\\quad s^{*} \\leftarrow s^{*} e^{m^{*}-m_i} + e^{s_i-m_i},\\quad m_i=\\max(m^{*}, s_i)',
  d:'수치 안정 버전의 갱신식. $v^*, s^*$ 는 지금까지의 누적값, $m^*$ 는 지금까지 본 최댓값이다. 새 최댓값이 나올 때마다 기존 누적값을 $e^{m^*-m_i}$ 로 재조정한 뒤 새 항을 더한다.'}
],

numbers:[
 {k:'메모리 복잡도', v:'O(1)/O(log n)', d:'단일 query는 $O(1)$, self-attention 전체는 인덱스 저장 때문에 $O(\\log n)$'},
 {k:'TPU 실전 구현', v:'O(√n)', d:'청크 병렬화를 위해 이론적 최적 대신 타협한 값'},
 {k:'메모리 절감 (n=16384)', v:'추론 59배 · 미분 32배', d:'Table 2·3, 표준 attention이 2GB 쓸 때 이 방법은 64MB'},
 {k:'실행시간 오버헤드', v:'추론 -13%, 미분 -35% (n=2¹⁴)', d:'작은 n에서는 ±5% 이내, 체크포인팅 재계산 때문에 미분이 더 느림'},
 {k:'WMT en-de 정확도', v:'62.69 vs 62.59', d:'100K 스텝 학습 후 memory-eff. vs 표준 attention, 사실상 동일'},
 {k:'분량', v:'8쪽', d:'짧은 preprint — 알고리즘과 실험이 전부, 새 아키텍처 제안 없음'}
],

impact:'"self-attention은 $O(n^2)$ 메모리가 필요하다"는 당시 거의 모든 후속 연구의 출발 전제를 뒤집었다. 시간 복잡도는 여전히 $O(n^2)$ 로 그대로지만, 메모리가 병목인 가속기에서는 이것만으로 기존에 OOM 나던 길이까지 처리할 수 있게 됐다. 무엇보다 이 결과는 근사가 아니라 **정확히 같은 함수**라서, 정확도를 희생하는 [희소 attention](#/p/sparse-attn) 계열과 다른 선택지를 열었다. 다만 이 논문의 TPU/JAX 구현 자체는 GPU의 메모리 계층(SRAM vs HBM)을 겨냥한 것이 아니어서 실측 속도 이득은 미미했다 — 그 부분을 채운 것이 바로 [FlashAttention](#/p/flashattention)이다.',

legacy:[
 '**[FlashAttention](#/p/flashattention)** — 이 논문의 "분모를 나중에 나눈다 + 온라인 max" 수식을 그대로 가져와, GPU의 SRAM/HBM 계층을 고려한 IO-aware CUDA 커널과 타일링으로 실제 수 배의 실측 속도 향상까지 만들어냈다',
 '**Perceiver AR** 등 긴 문맥 아키텍처가 이 메모리 효율 알고리즘을 실전에 적용한 초기 사례로 논문 자체에 언급된다',
 '"근사 없이 정확한 attention을 메모리만 줄여 계산한다"는 프레임이, 이후 [Ring Attention](#/p/ring-attention)처럼 여러 장치에 attention을 분산시키는 계열의 전제가 됐다'
],

pitfalls:[
 '**"O(1) 메모리"는 단일 query 케이스 얘기다.** self-attention 전체는 query 인덱스를 추가로 들고 있어야 해서 $O(\\log n)$ 이고, TPU 실전 구현은 병렬화를 위해 $O(\\sqrt{n})$ 으로 한 번 더 타협한다. 세 숫자를 섞어 인용하지 않도록 주의한다.',
 '**"공짜"가 아니다.** 추론은 거의 손해가 없지만(±5~13%), 미분(학습)은 체크포인팅 재계산 때문에 표준 대비 -30~35% 더 느리다. 메모리와 속도를 맞바꾸는 트레이드오프이지 둘 다 이기는 결과가 아니다.',
 '**FlashAttention과 같은 논문이 아니다.** 여기서는 알고리즘 수준의 청크·재정규화만 제시했고, GPU 메모리 계층을 겨냥한 타일링·커널 융합·IO 인식 최적화는 FlashAttention이 추가한 것이다. 이 논문 자체의 실측 속도 이득은 크지 않다.'
],

figures:[
 {f:'fig4-bleu.png',
  cap:'WMT en-de 번역 학습 곡선. 점선(표준 attention)과 실선(memory-efficient attention)이 10만 스텝 내내 거의 겹쳐 있다 — 메모리를 줄여도 학습 동역학이 바뀌지 않았다는 근거.',
  src:'원문 Figure 4, p.5'}
],

quotes:[
 {t:'We present a very simple algorithm for attention that requires O(1) memory with respect to sequence length and an extension to self-attention that requires O(log n) memory.',
  src:'Abstract, p.1'},
 {t:'our algorithm never forms the full attention matrix at all',
  src:'Section 5.2, p.5'}
],

links:[
 {t:'arXiv 2112.05682 — Self-attention Does Not Need O(n²) Memory', u:'https://arxiv.org/abs/2112.05682'},
 {t:'Google Research 공식 구현 (memory_efficient_attention)', u:'https://github.com/google-research/google-research/tree/master/memory_efficient_attention'}
]
});
