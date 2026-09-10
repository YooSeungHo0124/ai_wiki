WIKI.paper({
slug:'linformer',
venue:'arXiv 2020 (Facebook AI)',
authors:'Wang, Li, Khabsa, Fang, Ma (Facebook AI)',
arxiv:'2006.04768',

tldr:'self-attention의 context mapping 행렬 $P$ 가 사실상 **저랭크(low-rank)**라는 것을 이론과 실측으로 보이고, 이를 이용해 Key·Value를 길이 $n$ 대신 고정된 $k$ 차원으로 투영해 [Transformer](#/p/transformer)의 시간·공간 복잡도를 $O(n^2)$ 에서 $O(n)$ 으로 줄였다.',

context:'[Transformer](#/p/transformer)의 self-attention은 시퀀스 길이 $n$ 에 대해 $O(n^2)$ 의 시간·메모리를 쓴다. 이를 줄이려는 기존 시도는 대개 attention 패턴 자체를 제한했다 — [희소 attention](#/p/sparse-attn)은 대각선 근방만 계산하고, 블록 단위·LSH 기반 방법도 $P_{ij}$ 를 부분적으로만 계산한다. 그런데 이런 방법들은 성능 저하가 있는 데 비해 속도 이득이 제한적이었다(예: 20% 속도 향상에 2% 정확도 하락). 이 논문은 "attention 패턴을 제한하지 않고, 애초에 $n \\times n$ 행렬 자체가 근사 가능한 구조를 갖고 있는가"라는 다른 질문에서 출발한다.',

ideas:[
 {h:'Self-attention의 context mapping 행렬은 저랭크다',
  lead:'RoBERTa의 attention 행렬 $P$ 의 특이값을 실측하면 상위 몇 개에 정보가 집중된다.',
  d:'사전학습된 RoBERTa-base·large에서 $n=512$ 인 context mapping 행렬 $P=\\text{softmax}(QK^T/\\sqrt{d})$ 에 특이값 분해를 적용하면, 누적 특이값이 상위 128개(전체 512개 중)만으로 대부분을 설명한다. 특히 상위 층일수록 이 쏠림이 더 심해, 깊은 층일수록 $P$ 의 실질 랭크가 더 낮다. Theorem 1은 이 관측을 이론으로 뒷받침해, $\\tilde P$ 라는 랭크 $O(\\log n)$ 저랭크 근사가 $P$ 를 $\\epsilon$ 오차 이내로 근사할 수 있음을 증명한다.'},
 {h:'SVD 대신 학습되는 투영 행렬 E, F로 K·V를 압축',
  lead:'Key와 Value에 각각 학습 가능한 $n \\times k$ 투영을 곱해 $n \\times d$ 를 $k \\times d$ 로 줄인다.',
  d:'매 층·매 head마다 SVD를 계산하는 것은 그 자체로 비용이 크다. 대신 Key와 Value 각각에 학습되는 선형 투영 $E_i, F_i \\in \\mathbb{R}^{n \\times k}$ 를 곱해 $(n\\times d)$ 차원을 고정된 $(k \\times d)$ 차원으로 줄인다. Query는 그대로 두므로 attention 행렬이 $n \\times n$ 이 아니라 $n \\times k$ 가 되고, $k$ 를 $n$ 과 무관한 상수로 고정하면 전체 연산이 $O(nk)=O(n)$ 이 된다.'},
 {h:'투영 행렬을 head·층 간에 공유해 파라미터를 더 줄인다',
  lead:'같은 $E, F$ 를 여러 head·여러 층에서 재사용해도 성능 저하가 거의 없다.',
  d:'head마다 다른 $E_i, F_i$ 를 두는 대신, 층 안에서 head들이 공유(headwise)하거나, Key·Value가 같은 투영을 쓰거나(key-value), 전체 층이 하나의 투영만 쓰는(layerwise) 세 단계 공유 전략을 실험했다. 가장 극단적인 layerwise 공유(전체 모델에 투영 행렬 1개)조차 검증 손실이 거의 같아, 저랭크 구조가 head나 층에 크게 의존하지 않는다는 것을 보여준다.'}
],

diagram:{type:'compare', cap:'제곱 복잡도를 줄이는 두 접근의 대비.',
 left:{t:'희소 attention', items:['패턴을 대각선·블록으로 제한','일부 $P_{ij}$ 만 계산','정확도-속도 트레이드오프 큼']},
 right:{t:'Linformer', items:['K·V를 $k$ 차원으로 저랭크 투영','전체 attention 패턴은 유지','$O(n)$, 정확도 손실 거의 없음']}},

math:[
 {tex:'\\text{head}_i = \\text{softmax}\\!\\left(\\frac{Q W_i^{Q} (E_i K W_i^{K})^{\\top}}{\\sqrt{d}}\\right) F_i V W_i^{V}',
  expr:'head_i = softmax(Q Wq (E K Wk)^T / √d) · F V Wv',
  d:'Key에 $E_i \\in \\mathbb{R}^{k\\times n}$, Value에 $F_i \\in \\mathbb{R}^{k\\times n}$ 을 곱해 attention 행렬을 $n\\times n$ 대신 $n\\times k$ 로 줄인다. $k$ 를 $n$ 과 무관하게 고정하면 전체 self-attention이 $O(nk)=O(n)$ 시간·공간이 된다.'}
],

numbers:[
 {k:'복잡도', v:'O(n) 시간·공간', d:'표준 Transformer의 O(n²) 대비'},
 {k:'추론 속도 (n=512, k=128)', v:'1.5배', d:'같은 조건에서 최대 배치 크기는 1.7배'},
 {k:'추론 속도 (n=4096, k=128)', v:'3.4배', d:'시퀀스가 길어질수록 이득이 급격히 커짐'},
 {k:'추론 속도 (n=65536, k=128)', v:'20배', d:'메모리 절감은 같은 조건에서 60배'},
 {k:'다운스트림 성능', v:'RoBERTa와 동등~소폭 상회', d:'n=512·k=128 기준, k=256에서는 RoBERTa를 살짝 능가'},
 {k:'투영 랭크 이론치', v:'rank(P̃) = Θ(log n)', d:'Theorem 1, JL 보조정리 기반 증명'}
],

impact:'attention의 제곱 복잡도를 줄이는 연구를 "어떤 패턴을 버릴 것인가"에서 "행렬 자체가 이미 저랭크이니 그 구조를 이용하자"는 방향으로 넓혔다. [희소 attention](#/p/sparse-attn)이 계산할 위치를 제한하는 것과 달리 전체 시퀀스 정보를 유지한 채 차원만 줄이기 때문에, 긴 문서·긴 시퀀스를 다루는 이후 효율적 Transformer 계열 연구에서 저랭크 근사라는 한 축을 세웠다.',

legacy:[
 '**저랭크 근사 계열의 시초** — 이후 Performer, Nyströmformer 등 커널·저랭크 기반 선형 attention 연구가 뒤를 이음',
 '**희소 vs 저랭크라는 이분법** — [희소 attention](#/p/sparse-attn)(패턴 제한)과 대비되는 접근으로 효율적 attention 분류 체계에 자리잡음',
 '**정확한 계산을 택한 [FlashAttention](#/p/flashattention)과의 대비** — Linformer는 근사로 O(n)을 얻지만 FlashAttention은 근사 없이 메모리 접근만 최적화한다는 점에서 이후 "근사냐 정확한 가속이냐"는 갈림길의 한쪽 극을 대표'
],

pitfalls:[
 '**고정 길이 가정.** 투영 행렬 $E, F$ 의 크기가 시퀀스 길이 $n$ 에 의존해 고정되므로, 학습 시 정한 최대 길이보다 긴 입력에는 그대로 적용하기 어렵다(구조를 다시 만들거나 보간해야 한다).',
 '**causal(디코더) attention에는 그대로 쓸 수 없다.** 미래 토큰의 Key·Value까지 저랭크 투영에 섞이면 인과성이 깨지므로, 논문의 실험은 대부분 인코더(양방향) 모델 기준이다.',
 '**저랭크성은 사전학습된 자연어 모델에서 실측한 경험적 관찰이다.** 다른 도메인(예: 매우 희소하거나 국소적인 신호가 중요한 시퀀스)에서도 같은 정도로 저랭크가 성립한다는 보장은 없다.'
],

figures:[
 {f:'fig1-lowrank-spectrum.png',
  cap:'왼쪽 두 그래프: x축이 특이값 순위, y축이 누적 정규화 특이값. 128번째 특이값(점선)까지 벌써 0.9 근처에 도달하는 것이 저랭크성의 증거다. 오른쪽 히트맵: 층(y축)이 깊어질수록(위로 갈수록) 색이 노랗게 밝아지는 것은 더 적은 특이값으로 더 많은 정보를 설명한다는 뜻, 즉 깊은 층일수록 랭크가 더 낮다.',
  src:'원문 Figure 1, p.4'}
],

quotes:[
 {t:'We demonstrate mathematically that the self-attention mechanism can be approximated by a low-rank matrix.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2006.04768 — Linformer: Self-Attention with Linear Complexity', u:'https://arxiv.org/abs/2006.04768'}
]
});
