WIKI.paper({
slug:'transformer-xl',
venue:'ACL 2019',
authors:'Dai, Yang et al. (CMU · Google Brain)',
arxiv:'1901.02860',

tldr:'[Transformer](#/p/transformer)를 언어모델링에 쓰려면 문맥을 고정 길이 세그먼트로 잘라야 한다는 근본 제약을, **세그먼트 재귀(segment-level recurrence)**와 **상대 위치 인코딩**으로 없앤 논문. RNN보다 80%, 원조 Transformer보다 450% 긴 의존관계를 학습하면서 평가 속도는 최대 1,800배 빨라졌다.',

context:'원조 [Transformer](#/p/transformer)를 언어모델에 쓰는 표준 방법(Al-Rfou et al., 2018)은 말뭉치를 몇백 토큰짜리 **고정 길이 세그먼트**로 잘라 각 조각을 독립적으로 학습하는 것이었다. 여기엔 두 가지 문제가 있다. 첫째, 가장 긴 의존관계 길이가 세그먼트 길이로 상한이 걸린다 — self-attention이 이론적으로는 $O(1)$ 경로를 갖지만 실제로는 세그먼트 밖을 볼 수 없다. 둘째, 세그먼트 경계가 문장이나 의미 단위를 무시하고 기계적으로 잘리기 때문에, 한 세그먼트의 앞부분 토큰들은 맥락 없이 예측을 시작해야 한다 — 논문은 이를 **context fragmentation**이라 부른다. 평가 시에는 한 토큰 예측마다 세그먼트를 통째로 다시 계산해야 해서 극도로 느리다.',

ideas:[
 {h:'세그먼트 재귀: 이전 세그먼트의 은닉 상태를 캐시한다',
  lead:'직전 세그먼트의 hidden state를 고정한 채 캐시해 현재 세그먼트의 추가 문맥으로 재사용한다.',
  d:'매 세그먼트를 처음부터 계산하는 대신, 직전 세그먼트에서 계산한 은닉 상태 $h_\\tau^{n-1}$ 을 `stop-gradient`로 고정해 캐시해 두고, 현재 세그먼트의 은닉 상태와 이어붙여(concat) key·value를 만든다. gradient는 세그먼트 경계를 넘지 않지만, 정보는 넘어간다. RNN처럼 층 안에서 재귀하는 게 아니라 **층을 하나씩 내려가며 재귀**하기 때문에 최대 의존 길이가 층 수 $N$ 과 세그먼트 길이 $L$ 의 곱, $O(N \\times L)$ 로 늘어난다.'},
 {h:'메모리 캐시로 세그먼트 두 개 이상까지 확장',
  lead:'직전 세그먼트뿐 아니라 GPU 메모리가 허락하는 만큼 과거 은닉 상태를 메모리 $m$ 에 쌓아둔다.',
  d:'학습 시엔 메모리 길이 $M$ 을 세그먼트 길이와 같게 두지만, 평가 시엔 이를 여러 배로 늘려 재귀 없이도 훨씬 긴 문맥을 사용할 수 있다. 평가 단계에서 세그먼트를 한 토큰씩 밀며 처음부터 다시 계산하던 vanilla 방식과 달리, 캐시된 표현을 재사용하므로 **최대 1,800배** 빠르다.'},
 {h:'절대 위치 인코딩은 재귀와 상충한다',
  lead:'모든 세그먼트에 같은 절대 위치 $U_{1:L}$ 을 더하면 서로 다른 세그먼트의 같은 상대 위치를 구분할 수 없다.',
  d:'원조 Transformer는 위치 $i$ 에 고정된 벡터 $U_i$ 를 임베딩에 더한다. 세그먼트 재귀에서 이 방식을 그대로 쓰면 $x_{\\tau,j}$ 와 $x_{\\tau+1,j}$ 가 **똑같은 위치 인코딩**을 받아 모델이 둘을 구분하지 못하는 심각한 성능 저하가 생긴다.'},
 {h:'상대 위치 인코딩: attention score 안에 거리를 주입한다',
  lead:'절대 위치 벡터를 입력에 더하는 대신, attention score 계산 안에 상대 거리 $i-j$ 를 직접 넣는다.',
  d:'Query가 Key를 볼 때 필요한 건 절대 위치가 아니라 **상대 거리** $i-j$ 뿐이라는 관찰에서 출발한다. attention score를 content-based 항(a), content 기반 위치 편향(b), 전역 content 편향(c), 전역 위치 편향(d) 네 항으로 재구성하고, 사인·코사인 기반 상대 인코딩 $R_{i-j}$ 를 (b)·(d) 항에 곱한다. 학습 때보다 훨씬 긴 메모리 길이로 평가해도 자연스럽게 일반화된다는 것이 부가 이점이다.'}
],

diagram:{type:'compare', cap:'세그먼트를 독립적으로 처리하는 vanilla 방식과, 이전 세그먼트를 캐시해 재사용하는 Transformer-XL의 차이.',
 left:{t:'Vanilla Transformer', items:['세그먼트마다 처음부터 계산','문맥 길이 = 세그먼트 길이','평가마다 전체 재계산 → 느림']},
 right:{t:'Transformer-XL', items:['직전 은닉 상태를 캐시·재사용','문맥 길이 = O(N×L)로 증가','상대 위치 인코딩으로 재귀 가능']}
},

math:[
 {expr:'h̃τ+1 = [SG(hτ) ∘ hτ+1],  qτ+1,kτ+1,vτ+1 = h̃τ+1 Wq,Wk,Wv,  hτ+1 = TransformerLayer(q,k,v)',
  tex:'\\widetilde{h}_{\\tau+1}^{n-1}=\\left[\\text{SG}(h_{\\tau}^{n-1})\\circ h_{\\tau+1}^{n-1}\\right]',
  d:'세그먼트 재귀의 핵심 한 줄. `SG`(stop-gradient)로 고정한 이전 세그먼트 은닉 상태를 현재 세그먼트와 이어붙여 key·value의 입력으로 쓴다. gradient는 흐르지 않지만 정보는 전달된다.'},
 {expr:'A_rel[i,j] = E_xi Wq Wk,E E_xj + E_xi Wq Wk,R R_(i-j) + u·Wk,E E_xj + v·Wk,R R_(i-j)',
  tex:'A^{rel}_{i,j}=\\underbrace{E_{x_i}^{\\top}W_q^{\\top}W_{k,E}E_{x_j}}_{(a)}+\\underbrace{E_{x_i}^{\\top}W_q^{\\top}W_{k,R}R_{i-j}}_{(b)}+\\underbrace{u^{\\top}W_{k,E}E_{x_j}}_{(c)}+\\underbrace{v^{\\top}W_{k,R}R_{i-j}}_{(d)}',
  d:'상대 위치 attention score. (a)는 순수 content 유사도, (b)는 content에 의존하는 위치 편향, (c)·(d)는 위치·content에 무관한 전역 편향 항으로, 학습 가능한 벡터 $u,v$ 가 절대 위치 벡터의 역할을 대신한다.'}
],

numbers:[
 {k:'enwik8 bpc', v:'0.99', d:'24층 Transformer-XL, 파라미터 277M'},
 {k:'text8 bpc', v:'1.08', d:'같은 24층 구성'},
 {k:'WikiText-103 PPL', v:'18.3', d:'기존 SOTA 20.5에서 개선'},
 {k:'One Billion Word PPL', v:'21.8', d:'파라미터 0.8B'},
 {k:'Penn Treebank PPL', v:'54.5', d:'파인튜닝 없이(without finetuning)'},
 {k:'의존관계 길이', v:'RNN 대비 +80%, vanilla Transformer 대비 +450%', d:'평가는 최대 **1,800배** 빠름(enwiki8 기준)'}
],

impact:'"긴 문맥"이 [Transformer](#/p/transformer) 계열의 별도 연구 트랙으로 독립하는 계기가 된 논문이다. 세그먼트를 재귀로 잇는다는 아이디어 자체보다, **상대 위치 인코딩이 있어야 재귀가 성립한다**는 것을 명확히 증명한 것이 더 오래 남았다 — 이후 긴 문맥·긴 시퀀스 연구는 대부분 위치 인코딩을 먼저 바꾸는 방식으로 문제에 접근하게 됐다. 또한 인과적 언어모델링에서 recurrence와 attention을 결합할 수 있음을 보여, 순수 attention이 아니어도 되는 하이브리드 설계의 선례가 되었다.',

legacy:[
 '**아키텍처 재사용** — [XLNet](#/p/xlnet)이 이 세그먼트 재귀·상대 위치 인코딩을 그대로 가져와 순열 언어모델링에 결합함',
 '**위치 인코딩 트랙의 출발점** — 절대 위치의 한계를 상대 위치로 돌파한 이 접근이 이후 [RoPE](#/p/rope)로, 그리고 학습 후 문맥을 늘리는 [위치 보간](#/p/position-interpolation)으로 이어짐',
 '**긴 문맥이 별도 연구 주제로 독립** — "문맥 길이를 어떻게 늘릴 것인가"가 이 논문 이후 llm/context 트랙 전체의 질문이 됨',
 '**재귀+attention 하이브리드의 선례** — 순수 attention만 고집하지 않고 필요하면 recurrence를 섞어도 된다는 설계 태도가 이후 상태공간모델(SSM) 계열과의 접점을 열어둠'
],

pitfalls:[
 '**gradient는 세그먼트 경계를 넘지 않는다.** 캐시된 이전 세그먼트는 `stop-gradient`로 고정되므로, 모델이 "더 먼 과거를 보고 역전파로 학습"하는 것이 아니라 **순전파 시 참고 정보만 얻는다**는 점을 혼동하면 안 된다.',
 '**세그먼트 재귀만으론 부족하다.** 상대 위치 인코딩 없이 재귀만 적용하면 서로 다른 세그먼트의 같은 상대 위치가 구분되지 않아 성능이 오히려 떨어진다 — 두 기법은 반드시 함께 적용해야 한다.',
 '**메모리 길이 $M$ 은 무한정 키울 수 없다.** GPU 메모리로 캐시 가능한 범위 내에서만 문맥이 늘어나며, [RoPE](#/p/rope) 계열처럼 문맥 길이 자체를 이론적으로 무한히 확장하는 방법은 아니다.'
],

figures:[
 {f:'fig1-vanilla.png',
  cap:'(a) 학습: Segment 1과 Segment 2가 서로 독립적으로 계산돼 정보가 오가지 않는다. (b) 평가: 초록 삼각형이 "Limited Context" — 한 토큰 예측마다 세그먼트 전체를 한 칸씩 밀며 처음부터 다시 계산해야 한다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig2-xl.png',
  cap:'초록 선이 세그먼트 경계를 넘나드는 attention 연결이다. (a) 학습: 이전 세그먼트("Fixed, No Grad")의 은닉 상태가 새 세그먼트 계산에 재사용된다. (b) 평가: 초록 삼각형("Extended Context")이 Figure 1보다 훨씬 넓다 — 매 스텝 전체를 재계산하지 않고 캐시를 확장해서 본다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'Transformer-XL learns dependency that is 80% longer than RNNs and 450% longer than vanilla Transformers, achieves better performance on both short and long sequences, and is up to 1,800+ times faster than vanilla Transformers during evaluation.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1901.02860 — Transformer-XL', u:'https://arxiv.org/abs/1901.02860'},
 {t:'공식 코드 (kimiyoung/transformer-xl)', u:'https://github.com/kimiyoung/transformer-xl'}
]
});
