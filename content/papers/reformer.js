WIKI.paper({
slug:'reformer',
venue:'ICLR 2020',
authors:'Kitaev, Kaiser, Levskaya (UC Berkeley & Google Research)',
arxiv:'2001.04451',

tldr:'[Transformer](#/p/transformer)의 두 가지 독립적인 병목 — attention의 $O(n^2)$ 계산량과 층마다 activation을 저장하는 $O(N)$ 메모리 — 을 각각 **근사 해싱**과 **가역 잔차층**으로 줄인 논문. 64K 토큰 시퀀스를 단일 가속기 한 장에서 학습 가능하게 만들었다.',

context:'2020년 초, 대형 Transformer는 층당 파라미터 0.5B, 층수 64까지 올라가고 있었고 시퀀스 길이도 11K 토큰을 넘어서고 있었다. 문제는 메모리다 — attention의 $QK^T$ 는 시퀀스 길이 $L$ 에 대해 $[L, L]$ 크기라 $L=64K$ 에서 배치 1만으로도 32비트 기준 16GB를 먹는다. 게다가 activation은 역전파를 위해 **층마다 따로** 저장돼야 해서, $N$ 층이면 메모리가 $N$ 배로 불어난다. 저자들은 BERT 전체 학습 코퍼스가 17GB밖에 안 된다는 점을 들어, 이 자원 소모가 모델 자체의 한계가 아니라 **비효율** 때문이라고 지적한다.',

ideas:[
 {h:'LSH attention: 해싱으로 가까운 키만 본다',
  lead:'무작위 회전 기반 해싱으로 유사한 벡터를 같은 버킷에 모아, 버킷 안에서만 attention을 계산한다.',
  d:'softmax는 가장 큰 값 몇 개가 지배하므로, 쿼리 $q_i$ 는 사실 가장 가까운 소수의 키만 봐도 충분하다. 이 논문은 정확한 최근접 이웃 대신 **locality-sensitive hashing**을 쓴다 — 구면에 투영한 벡터를 무작위 행렬 $R$ 로 회전시키고 부호가 가장 큰 축을 버킷 번호로 삼는다. 가까운 벡터는 높은 확률로 같은 버킷에 떨어진다. 쿼리·키를 버킷 번호로 정렬한 뒤 같은 버킷(과 바로 앞 청크)에서만 attention을 계산하면, 전체 $n \\times n$ 행렬을 만들 필요가 없다.'},
 {h:'해시 충돌을 다중 라운드로 보정',
  lead:'해시를 여러 개 독립적으로 돌려 한 라운드에서 놓친 이웃을 다른 라운드가 잡게 한다.',
  d:'해싱은 확률적이라 가까운 두 벡터가 다른 버킷에 떨어질 수 있다. 서로 다른 해시 함수 $n_{rounds}$ 개를 병렬로 돌려 그 합집합을 attend 대상으로 삼으면 이 확률이 줄어든다. 실험상 $n_{rounds}=8$ 이면 거의 완전 attention과 같아지고, 평가 시점에만 라운드 수를 늘려 정확도를 더 올릴 수도 있다.'},
 {h:'가역(reversible) 잔차층: 층마다 activation을 안 남긴다',
  lead:'RevNet처럼 출력에서 입력을 역산할 수 있게 만들어 역전파용 activation 저장을 없앤다.',
  d:'이 아이디어는 계산량과 무관하고 **메모리** 문제만 겨냥한다. 보통의 residual은 $y=x+F(x)$ 라 $x$ 를 몰라도 되게 만들려면 저장해야 하지만, 가역층은 $(x_1,x_2)\\to(y_1,y_2)$ 쌍으로 동작해 $y_1, y_2$ 만 있으면 뺄셈만으로 $x_1, x_2$ 를 복원할 수 있다. attention을 $F$, FFN을 $G$ 로 두고 이 구조를 Transformer 블록에 그대로 적용하면, 역전파가 출력에서 입력 쪽으로 진행하며 그때그때 activation을 재계산한다 — $N$ 층분 저장이 **한 층분**으로 줄어든다.'},
 {h:'청크 단위 FFN: 넓은 중간층도 쪼갠다',
  lead:'토큰별로 독립적인 FFN 계산을 청크로 나눠 한 번에 다 올리지 않는다.',
  d:'FFN의 중간 차원 $d_{ff}$ 는 보통 $d_{model}$ 의 4배라 여기서도 메모리가 크게 든다. FFN은 위치마다 완전히 독립적인 계산이므로, 시퀀스를 $c$개 청크로 나눠 한 청크씩 순서대로 계산하면 추가 메모리 없이 같은 결과를 얻는다. 수치적으로는 원래 Transformer와 동일하고, 구현 방식만 다르다.'},
 {h:'Shared-QK: Q와 K를 같은 투영으로 만든다',
  lead:'쿼리와 키를 같은 선형층에서 만들어 LSH가 같은 공간에서 작동하게 한다.',
  d:'LSH attention이 성립하려면 쿼리와 키가 같은 벡터 공간에 있어야 하므로, $Q$ 와 $K$ 를 같은 선형 변환으로 만든다(shared-QK). 실험적으로 이 제약은 **성능을 깎지 않았고** enwik8에서는 오히려 학습이 약간 더 빨랐다. 단, 자기 자신을 attend하는 것을 막아야 하는 부작용이 있어 다른 컨텍스트가 없을 때만 예외적으로 허용한다.'}
],

diagram:{type:'flow', cap:'LSH attention 파이프라인 (원문 Figure 2를 개념화). 버킷 정렬 후 같은 버킷(+이전 청크)끼리만 attend한다.',
 nodes:[
  {t:'Q=K 벡터', s:'shared-QK, 길이 L'},
  {t:'LSH 해싱', s:'무작위 회전 argmax', a:'버킷화'},
  {t:'버킷별 정렬', s:'유사 벡터가 인접'},
  {t:'청크 내 attention', s:'버킷+이전 청크만', acc:true}
 ]},

math:[
 {expr:'h(x) = argmax([xR ; -xR])',
  tex:'h(x)=\\arg\\max\\big([xR;\\,-xR]\\big)',
  d:'무작위 행렬 $R$ 로 벡터를 회전시켜 부호가 가장 큰 축을 버킷 번호로 쓰는 각도 기반 LSH. 가까운 벡터일수록 같은 버킷에 떨어질 확률이 높다.'},
 {expr:'P_i = { j : h(q_i) = h(k_j) }',
  tex:'\\mathcal{P}_i=\\{\\,j : h(q_i)=h(k_j)\\,\\}',
  d:'쿼리 $i$ 가 attend할 수 있는 대상 집합을 "같은 해시 버킷에 속한 키"로 제한한다. 이것이 $O(n^2)$ 을 $O(n\\log n)$ 으로 줄이는 근사의 정의 그 자체다.'},
 {expr:'Y1 = X1 + Attention(X2),   Y2 = X2 + FeedForward(Y1)',
  tex:'\\begin{aligned}Y_1 &= X_1 + \\text{Attention}(X_2)\\\\ Y_2 &= X_2 + \\text{FeedForward}(Y_1)\\end{aligned}',
  d:'가역 블록의 순전파. 역방향은 뺄셈 $X_2=Y_2-\\text{FeedForward}(Y_1)$, $X_1=Y_1-\\text{Attention}(X_2)$ 으로 activation을 저장 없이 복원한다.'}
],

numbers:[
 {k:'attention 계산 복잡도', v:'O(L²) → O(L log L)', d:'LSH attention이 근사로 얻는 이득, L은 시퀀스 길이'},
 {k:'activation 메모리', v:'N배 → 1배', d:'가역 잔차층으로 층 수 N에 무관해짐'},
 {k:'실험 시퀀스 길이', v:'enwik8 64K · imagenet64 12K', d:'3층 모델로 ablation, 최종은 최대 20층까지 학습'},
 {k:'WMT14 En→De BLEU', v:'29.1 (big, 30만 step)', d:'Vaswani et al. big 모델의 28.4보다 높음, reversible 인코더·디코더 사용'},
 {k:'해시 라운드', v:'n_rounds = 8', d:'이 정도면 full attention과 거의 같은 정확도에 도달'},
 {k:'enwik8 bits/dim', v:'1.05', d:'12층 Reformer를 추가 튜닝 후 도달한 최종 test set 성능(1.19에서 개선)'}
],

impact:'Reformer는 "큰 모델이 원래 이만큼 자원을 먹어야 하는가"라는 질문에 직접 답했다 — 같은 파라미터 수로도 activation 메모리를 층수와 무관하게 만들 수 있음을 보였다. 다만 LSH attention 자체는 **근사**라 품질 손실 위험이 있고 shared-QK 같은 제약이 따라붙어서, 실무 채택은 가역층 아이디어보다 제한적이었다. 오히려 이후 긴 시퀀스 문제는 두 갈래로 갈라졌다 — 근사를 감수하는 [희소 attention](#/p/sparse-attn)/[Linformer](#/p/linformer) 계열과, 근사 없이 정확히 계산하는 [메모리 효율 attention](#/p/memory-efficient-attn)/[FlashAttention](#/p/flashattention) 계열이다.',

legacy:[
 '**근사 attention 계열** — [희소 attention](#/p/sparse-attn)(Longformer/BigBird), [Linformer](#/p/linformer)가 "전체 $n^2$ 을 다 안 봐도 된다"는 같은 전제를 이어받아 각자 다른 방식으로 부분집합을 고름',
 '**가역/체크포인팅 계열은 IO 최적화로 대체** — 이후 주류는 activation을 안 남기는 대신 재계산하는 방식보다, [FlashAttention](#/p/flashattention)처럼 커널을 타일링해 애초에 메모리에 올리지 않는 방식으로 수렴',
 '**긴 문맥 모델링의 표준 벤치마크화** — enwik8 64K·imagenet64 12K 같은 긴 시퀀스 실험 설계가 이후 긴 문맥 아키텍처 논문들의 공통 비교 대상이 됨',
 '**[Transformer-XL](#/p/transformer-xl)과 다른 축의 해법** — Transformer-XL이 세그먼트 재사용으로 문맥을 늘렸다면 Reformer는 한 시퀀스 자체를 길게 통째로 처리하는 쪽을 택함'
],

pitfalls:[
 '**LSH attention은 근사다 — [메모리 효율 attention](#/p/memory-efficient-attn)·[FlashAttention](#/p/flashattention)과 혼동하면 안 된다.** 후자 둘은 $O(n^2)$ 계산 자체는 그대로 두고 메모리 사용만 줄이는 **정확한** 방법이고, Reformer의 LSH는 애초에 $n^2$ 개 쌍 중 일부만 계산하는 **근사**다. 해시 라운드를 늘리지 않으면 품질이 떨어질 수 있다.',
 '**가역 잔차층은 계산량을 줄이지 않는다.** 메모리만 $N$ 배에서 1배로 줄고, 역전파 때 activation을 다시 계산하는 비용이 추가로 붙는다. "Reformer는 빠르다"고 뭉뚱그리면 안 되고, 이득은 어디까지나 메모리 축(그리고 그 덕에 가능해진 긴 시퀀스·큰 배치)이다.',
 '**WMT14 실험에는 LSH attention을 아예 쓰지 않았다.** 문장이 128토큰보다 짧아 청크가 의미 없다고 논문이 명시한다. "Reformer=LSH+가역층" 세트로 항상 같이 쓰인 게 아니라, 두 기법은 독립적으로도 적용 가능하다.'
],

figures:[
 {f:'fig2-lsh-attention.png',
  cap:'왼쪽: Q=K 시퀀스를 해싱해 색으로 버킷을 표시하고, 버킷 번호로 정렬한 뒤 청크로 나눠 같은 버킷+이전 청크끼리만 연결선(attend)을 긋는다. 오른쪽 (a)-(d): 같은 과정을 attention 행렬로 본 것 — (a) 원래는 전체가 후보, (b) 버킷별로 몰림, (c) Q=K라 대각선 근처에 몰림, (d) 청크 경계(검은 박스)로 한 번 더 제한.',
  src:'원문 Figure 2, p.4'},
 {f:'fig5-speed.png',
  cap:'전체 토큰 수를 고정한 채 시퀀스 길이를 늘려가며 스텝당 소요 시간을 잰 그래프. full attention(점선)은 길이가 늘수록 계속 느려지는데, LSH attention(실선들)은 해시 수를 늘려도 거의 평평하다 — $O(n\\log n)$ 과 $O(n^2)$ 의 실측 차이.',
  src:'원문 Figure 5(우), p.9'}
],

quotes:[
 {t:'Furthermore, we use reversible residual layers instead of the standard residuals, which allows storing activations only once in the training process instead of N times, where N is the number of layers.',
  src:'Abstract, p.1'},
 {t:'LSH attention is an approximation for full attention that, as evidenced in Figure 4, becomes more accurate as the number of hashes increases.',
  src:'Section 5, p.9'}
],

links:[
 {t:'arXiv 2001.04451 — Reformer: The Efficient Transformer', u:'https://arxiv.org/abs/2001.04451'},
 {t:'공식 구현 (Trax)', u:'https://github.com/google/trax/tree/master/trax/models/reformer'}
]
});
