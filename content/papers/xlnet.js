WIKI.paper({
slug:'xlnet',
venue:'NeurIPS 2019',
authors:'Yang et al. (CMU · Google AI Brain Team)',
arxiv:'1906.08237',

tldr:'[BERT](#/p/bert)의 마스크 기반 사전학습이 갖는 두 결함 — 사전학습·미세조정 불일치와 마스크 토큰 간 독립 가정 — 을 자기회귀 언어모델링을 유지한 채로 없앤 논문. 문장을 무작위 순서로 "다시 인수분해"해서 양방향 문맥을 얻는 **순열 언어모델링**을 제안했다.',

context:'2019년 상반기, BERT류의 마스크 언어모델(MLM)이 GLUE·SQuAD 등을 휩쓸고 있었다. 그런데 MLM에는 두 구조적 문제가 있다. 첫째 **사전학습-미세조정 불일치** — 학습 때는 입력에 `[MASK]` 토큰이 섞이지만, 실제 미세조정·추론 입력에는 그런 토큰이 없다. 둘째 **독립 가정** — BERT는 마스크된 여러 토큰을 동시에 예측하면서 그 토큰들이 서로 독립이라고 가정하는데, 자연어의 장거리 의존성을 생각하면 이는 지나친 단순화다. 반대로 GPT 같은 자기회귀(AR) 모델은 이 두 문제가 없지만 한쪽 방향 문맥만 본다. XLNet의 질문은 "AR 모델의 형식을 유지하면서 양방향 문맥을 얻을 수 있는가"였다.',

ideas:[
 {h:'순열 언어모델링: 인수분해 순서를 섞는다',
  lead:'문장 순서는 그대로 두고 예측 순서(인수분해 순서)만 무작위로 섞어 양방향성을 얻는다.',
  d:'길이 $T$ 인 시퀀스에는 $T!$ 개의 유효한 인수분해 순서가 있다. 각 학습 스텝마다 순서 하나를 샘플링해 그 순서대로 다음 토큰을 예측하되, 파라미터는 모든 순서에 공유한다. 기댓값 관점에서 각 위치는 왼쪽·오른쪽 모든 위치를 문맥으로 보게 되어 양방향 정보를 얻으면서도, 목적함수 자체는 여전히 곱 법칙을 쓰는 순수 AR이라 독립 가정이 없다. 실제 토큰의 물리적 순서는 바꾸지 않고 **attention mask만으로** 인수분해 순서를 구현한다 — 미세조정 때는 자연 순서 그대로 쓰면 되므로 불일치도 사라진다.'},
 {h:'Two-Stream Self-Attention: content stream과 query stream',
  lead:'"무엇을 예측할지 위치"와 "그 위치의 내용"을 분리해 두 개의 은닉 상태 스트림으로 관리한다.',
  d:'순열 목적함수를 표준 Transformer에 그대로 적용하면 다음 토큰 분포가 예측할 위치 $z_t$ 자체에 의존하지 않는 문제가 생겨 붕괴한다. 그래서 content stream $h$(표준 self-attention과 동일, 문맥과 자기 자신의 내용을 모두 봄)와 query stream $g$(문맥과 위치 정보만 보고 자기 내용은 보지 못함)를 따로 둔다. 미세조정·추론 때는 query stream을 버리고 content stream만 쓴다.'},
 {h:'Partial Prediction: 뒤쪽 일부만 예측한다',
  lead:'인수분해 순서의 앞부분은 문맥으로만 쓰고 뒤쪽 일부만 예측 대상으로 삼아 학습을 안정시킨다.',
  d:'순서의 앞쪽 토큰일수록 문맥이 거의 없어 최적화가 느리고 분산이 크다. 그래서 순서를 자른 지점 이후, 즉 문맥이 충분히 쌓인 뒤쪽 토큰들만 실제 손실에 포함시킨다. 비율은 하이퍼파라미터로 조절하며, 대략 마지막 $1/K$ 토큰만 예측한다.'},
 {h:'Transformer-XL의 재귀와 상대 위치 인코딩을 이식',
  lead:'세그먼트 재귀 메커니즘과 상대 위치 인코딩을 사전학습에 통합해 긴 문맥을 다룬다.',
  d:'이름 그대로 Transformer-**XL**의 아이디어를 가져왔다. 이전 세그먼트의 은닉 상태를 캐시(`mem`)해 다음 세그먼트 계산에 재사용하는 세그먼트 재귀와, 절대 위치 대신 상대 거리를 쓰는 위치 인코딩을 순열 언어모델링에 맞게 확장했다. 절대 위치 인코딩은 세그먼트가 재귀적으로 이어질 때 위치가 꼬이기 때문에 상대 인코딩이 필수적이다.'},
 {h:'다중 세그먼트에 대한 상대 인코딩',
  lead:'두 세그먼트 사이의 관계도 절대 위치가 아니라 "같은 세그먼트인가"만으로 인코딩한다.',
  d:'두 세그먼트를 이어 학습할 때(질문-지문 쌍 등) 각 위치 쌍이 같은 세그먼트인지 아닌지만 나타내는 학습 가능한 벡터를 attention에 편향으로 더한다. 절대 위치를 쓰지 않으므로 학습보다 긴 세그먼트에도 일반화가 된다는 것이 저자들의 주장이다.'}
],

diagram:{type:'compare', cap:'BERT의 두 가지 결함과 XLNet이 이를 우회하는 방식.',
 left:{t:'BERT: 마스크 AE', items:['`[MASK]`는 학습에만 존재','마스크 토큰들이 서로 독립이라 가정','양방향이지만 곱 법칙 없음']},
 right:{t:'XLNet: 순열 AR', items:['순서만 섞고 자연 입력 유지','곱 법칙으로 결합확률 그대로 계산','기댓값상 양방향 문맥 획득']}},

math:[
 {expr:'max_θ E_{z~Z_T} [ Σ_t log p_θ(x_zt | x_z<t) ]',
  tex:'\\max_{\\theta}\\;\\mathbb{E}_{z\\sim\\mathcal{Z}_T}\\left[\\sum_{t=1}^{T}\\log p_\\theta\\left(x_{z_t}\\mid \\mathbf{x}_{z_{<t}}\\right)\\right]',
  d:'순열 언어모델링의 목적함수. $\\mathcal{Z}_T$ 는 길이 $T$ 인 인덱스 수열의 모든 순열 집합이다. 순서 $z$ 하나를 뽑아 그 순서대로 곱 법칙 인수분해를 학습하고, 파라미터를 모든 순서에 공유해 기댓값을 취한다.'},
 {expr:'p_θ(X_zt = x | x_z<t) = exp(e(x)ᵀ g_θ(x_z<t, z_t)) / Σ_x′ exp(e(x′)ᵀ g_θ(x_z<t, z_t))',
  tex:'p_\\theta\\!\\left(X_{z_t}=x \\mid \\mathbf{x}_{z_{<t}}\\right)=\\frac{\\exp\\!\\left(e(x)^{\\top} g_\\theta(\\mathbf{x}_{z_{<t}}, z_t)\\right)}{\\sum_{x\\prime} \\exp\\!\\left(e(x\\prime)^{\\top} g_\\theta(\\mathbf{x}_{z_{<t}}, z_t)\\right)}',
  d:'표준 softmax를 그대로 쓰면 예측 분포가 목표 위치 $z_t$ 자체와 무관해져 붕괴한다. 그래서 위치 $z_t$ 를 명시적으로 입력받는 새 표현 $g_\\theta$(query stream)로 재매개변수화한다.'}
],

numbers:[
 {k:'파라미터 규모', v:'BERT-Large급 · 24층', d:'RACE·ClueWeb09-B 비교는 24층·유사 크기로 통일'},
 {k:'RACE 정확도', v:'85.4%', d:'BERT 72.0% · RoBERTa 83.2% 대비 개선 (test set)'},
 {k:'SQuAD1.1 EM/F1', v:'88.2 / 94.0', d:'같은 데이터·하이퍼파라미터로 학습한 BERT-Large(86.7/92.8) 대비 향상'},
 {k:'GLUE 대비 폭', v:'20개 과제', d:'질의응답·자연어추론·감성분석·문서랭킹 등에서 BERT를 앞섬'},
 {k:'ClueWeb09-B NDCG@20', v:'31.10', d:'문서 랭킹 과제, BERT 30.53 대비 소폭 개선'}
],

impact:'XLNet은 "마스크 언어모델이 아니어도 양방향 문맥을 얻을 수 있다"는 것을 실증했고, 순열 목적함수·two-stream attention·상대 위치 인코딩이라는 세 부품을 각각 독립적인 유산으로 남겼다. 다만 파급력은 절제됐다 — 같은 시기 나온 [RoBERTa](#/p/roberta)가 "BERT를 더 오래, 더 많은 데이터로 학습시키기만 해도" 비슷하거나 더 나은 성능을 냈기 때문에, 굳이 순열이라는 복잡한 장치를 쓸 유인이 줄었다. 이후 사전학습 목적함수 설계는 XLNet의 정교함보다 RoBERTa의 단순함 쪽으로 수렴했다.',

legacy:[
 '**[UL2](#/p/ul2)**가 XLNet의 순열/자기회귀 목적을 [T5](#/p/t5)·[BART](#/p/bart)의 denoising 목적과 함께 Mixture-of-Denoisers라는 한 틀로 통합',
 '**RoBERTa의 반증** — 같은 시기 "더 단순한 BERT + 더 많은 학습"이 유사 성능을 내면서, 목적함수를 정교하게 바꾸는 것보다 스케일을 늘리는 쪽이 더 값싸다는 교훈을 남김',
 '**relative position encoding 계열** — [Transformer-XL](#/p/transformer-xl)에서 XLNet을 거쳐 다듬어진 상대 위치 아이디어는 이후 [RoPE](#/p/rope) 등 더 단순한 대안으로 대체됨',
 '**two-stream attention**은 이후 순열 기반·비자기회귀 생성 연구에서 "위치와 내용을 분리한다"는 패턴으로 간간이 재등장'
],

pitfalls:[
 '**"양방향 문맥을 본다"는 것이 BERT처럼 매 스텝 전체를 동시에 본다는 뜻이 아니다.** 특정 순서 하나를 샘플링해 그 순서를 따라가는 것이므로, 한 스텝에서 실제로 보는 문맥은 그 순열에서 자신보다 앞선 위치들뿐이다.',
 '**계산 비용이 BERT보다 크다.** 두 스트림을 유지해야 하고, 긴 순열을 샘플링·마스킹하는 구현이 복잡해 실무 채택률이 낮았던 이유 중 하나다.',
 '**RoBERTa와 직접 비교할 때 데이터 차이를 걷어내야 한다.** 논문의 "Fair comparison with BERT"(Table 1)와 "Comparison with RoBERTa"(Table 2)는 서로 다른 데이터 조건이므로 섞어 인용하면 안 된다.'
],

figures:[
 {f:'fig1-two-stream.png',
  cap:'(a) content stream attention 은 표준 self-attention과 동일 — Q도 K,V도 자기 자신을 포함한 문맥 전체를 본다. (b) query stream attention 은 Q만 목표 위치의 벡터이고 K,V는 자기 자신을 제외한 문맥 — 빨간 선이 "자신은 빠진" 연결을 보여준다. (c) 오른쪽의 Attention Masks 두 장이 content/query 스트림이 서로 다른 마스크를 쓴다는 것, 아래 e(x)+w 입력에서 위로 두 단계 Masked Two-stream Attention을 거쳐 h,g 표현이 갱신되는 전체 흐름.',
  src:'원문 Figure 1, p.4'}
],

quotes:[
 {t:'We propose XLNet, a generalized autoregressive pretraining method that (1) enables learning bidirectional contexts by maximizing the expected likelihood over all permutations of the factorization order and (2) overcomes the limitations of BERT thanks to its autoregressive formulation.',
  src:'Abstract, p.1'},
 {t:'BERT assumes the predicted tokens are independent of each other given the unmasked tokens, which is oversimplified as high-order, long-range dependency is prevalent in natural language.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 1906.08237 — XLNet', u:'https://arxiv.org/abs/1906.08237'},
 {t:'공식 코드 (zihangdai/xlnet)', u:'https://github.com/zihangdai/xlnet'}
]
});
