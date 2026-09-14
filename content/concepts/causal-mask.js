WIKI.concept({
slug:'causal-mask',

tldr:'self-attention에서 각 위치가 자기 자신과 그 이전 위치까지만 보게 미래 위치의 어텐션 점수를 $-\\infty$로 덮어써 softmax 후 가중치를 0으로 만드는 삼각 마스크다.',

why:'디코더 전용 [Transformer](#/p/transformer)가 학습 때 전체 시퀀스를 한 번에 병렬로 넣으면서도 각 위치가 미래를 "커닝"하지 못하게 하는 장치가 이것이다. 이걸 정확히 모르면 왜 [MLM(BERT)](#/c/mlm-vs-clm)과 [CLM(GPT)](#/c/mlm-vs-clm)이 같은 Transformer 인코더 블록을 쓰고도 완전히 다르게 학습되고 쓰이는지 설명할 수 없고, 파인튜닝·추론 코드에서 마스크 모양이 하나만 틀려도 미래 정보가 새어 들어가 검증 지표만 비정상적으로 좋아 보이는 문제(정보 누수)를 디버깅할 때도 이 구조를 정확히 알아야 한다.'
,

sections:[
 {h:'왜 필요한가', d:'[autoregressive](#/c/autoregressive) 생성 모델은 $t$번째 토큰을 예측할 때 $1,\\dots,t-1$까지만 봐야 한다. 그런데 teacher forcing으로 학습할 때는 정답 시퀀스 전체를 한 번에 입력으로 넣는다 — 그래야 [self-attention](#/c/self-attention)의 병렬 계산 이점을 살릴 수 있다. 문제는 [self-attention](#/c/self-attention) 자체는 원래 모든 위치가 모든 위치를 보는 연산이라, 아무 제약이 없으면 $t$번째 위치가 $t+1,t+2,\\dots$번째(자신이 맞혀야 할 정답 토큰 자체)를 그대로 참조해버려 학습이 무의미해진다. causal mask는 이 "미래를 보는 경로"만 정확히 차단해, 시퀀스 전체를 한 번에 넣으면서도 각 위치의 예측이 오직 과거에만 의존하게 만든다.'},
 {h:'구현 방법', d:'$n\\times n$ 어텐션 점수 행렬 $QK^\\top/\\sqrt{d_k}$에 같은 크기의 마스크 행렬 $M$을 더한다. $M$은 하삼각(자기 자신 포함 이전 위치)은 $0$, 상삼각(미래 위치)은 $-\\infty$인 행렬이다. softmax는 $\\exp(-\\infty)=0$이 되므로, 마스킹된 위치는 정규화 후 가중치가 정확히 0이 된다 — 값을 나중에 0으로 지우는 게 아니라 softmax 이전에 $-\\infty$를 더해 애초에 확률질량이 그리로 갈 수 없게 만드는 방식이다. 실제 구현에서는 $-\\infty$ 대신 float 자료형에서 충분히 작은 값(예: -1e9, FlashAttention 등은 전용 마스킹 커널)을 쓴다.'},
 {h:'추론에서는 자연 해소', d:'추론 때는 애초에 미래 토큰이 존재하지 않는다 — 한 스텝씩 생성하며 이미 만들어진 토큰까지만 입력에 있으므로 마스크가 막을 대상 자체가 없다. 다만 [KV 캐시](#/c/kv-cache)를 쓰지 않고 매번 전체 시퀀스를 다시 넣는 구현이라면 여전히 마스크를 유지해야 한다. causal mask는 학습을 병렬화하기 위한 장치이지, 생성 자체의 순차성(autoregressive함)을 없애주는 장치가 아니다 — 마스크가 있어도 생성은 여전히 한 토큰씩 순차적이다.'},
 {h:'MLM과 CLM의 갈림', d:'같은 Transformer 인코더 블록에 causal mask를 씌우면 [CLM(causal LM, GPT류)](#/c/mlm-vs-clm)이 되고, 마스크 없이 양방향으로 다 보게 하되 입력의 일부 토큰을 [MASK]로 가리고 그것만 맞히게 하면 [MLM(masked LM, BERT류)](#/c/mlm-vs-clm)이 된다. 마스킹 대상이 다르다 — CLM은 "볼 수 있는 위치"를 어텐션 패턴으로 제한하고, MLM은 "입력 토큰 자체"를 가린다. 이 차이 때문에 CLM은 자연스럽게 왼쪽에서 오른쪽으로 생성할 수 있지만, MLM은 양방향 문맥을 다 쓸 수 있는 대신 그 자체로는 순차 생성에 쓰기 어렵다.'}
],

math:[
 {tex:'\\text{Attention}(Q,K,V)=\\text{softmax}\\!\\left(\\dfrac{QK^\\top}{\\sqrt{d_k}}+M\\right)V,\\qquad M_{ij}=\\begin{cases}0 & j\\le i\\\\ -\\infty & j>i\\end{cases}',
  expr:'causal mask가 더해진 attention', d:'$i$는 query 위치(현재 예측하려는 위치), $j$는 key 위치(참조하려는 위치). $j>i$(미래)일 때만 $-\\infty$를 더해 softmax 후 해당 가중치가 정확히 0이 되게 한다. $j\\le i$인 하삼각 부분은 그대로 두어 자기 자신을 포함한 과거 전체를 볼 수 있게 한다.'}
],

diagram:{type:'matrix', cap:'4토큰 시퀀스의 causal mask (1=참조 가능, 0=차단).',
 cols:['key t1','key t2','key t3','key t4'],
 rows:[
  {t:'query t1', v:[1,0,0,0]},
  {t:'query t2', v:[1,1,0,0]},
  {t:'query t3', v:[1,1,1,0]},
  {t:'query t4', v:[1,1,1,1]}
 ]},

code:{lang:'python', d:'causal mask를 어텐션 점수에 더하는 전형적인 구현.',
 src:`n = seq_len
scores = (Q @ K.T) / sqrt(d_k)          # (n, n)
mask = torch.triu(torch.ones(n, n), diagonal=1).bool()
scores = scores.masked_fill(mask, float('-inf'))
weights = softmax(scores, dim=-1)       # 상삼각은 정확히 0
out = weights @ V`},

confuse:[
 {a:'causal mask', b:'padding mask', d:'causal mask는 "미래 위치"를 구조적으로 차단하는 삼각 마스크다. padding mask는 배치 내 길이를 맞추려 채운 [PAD] 토큰을 어느 위치에서든 참조하지 못하게 막는 것으로, 시퀀스 구조와 무관하게 배치마다 다르게 적용된다. 실무에서는 두 마스크를 더해(또는 논리곱해) 함께 적용하는 경우가 많다.'},
 {a:'CLM (causal LM)', b:'MLM (masked LM)', d:'CLM은 어텐션 자체를 마스킹해 미래를 아예 못 보게 하고 왼쪽에서 오른쪽으로 다음 토큰을 예측한다. MLM은 어텐션은 양방향으로 전부 열어두고 대신 입력 토큰 일부를 [MASK]로 가려 그 자리를 맞히게 한다. 자세한 비교는 [MLM vs CLM](#/c/mlm-vs-clm) 참고.'},
 {a:'-inf 더하기', b:'가중치를 0으로 곱하기', d:'가중치를 나중에 0으로 곱하면 softmax 정규화(분모의 합) 계산에 미래 위치가 이미 끼어든 뒤라 결과가 미묘하게 오염된다. softmax 이전에 $-\\infty$를 더하면 정규화 자체에서 그 위치가 처음부터 배제돼 정확히 올바른 확률분포가 나온다.'}
],

pitfalls:[
 'causal mask가 "생성을 병렬로 만들어준다"는 오해가 흔하다. 실제로 병렬화되는 것은 **학습**(전체 시퀀스를 한 번에 손실 계산)이고, **추론**(생성)은 causal mask 유무와 무관하게 여전히 한 토큰씩 순차적이다.',
 '마스크를 단순히 "미래를 가린다"로만 기억하면 자기 자신(대각선, $j=i$)을 볼 수 있다는 점을 놓치기 쉽다 — 하삼각은 대각선을 포함한다.',
 'MLM에 causal mask를 씌우면 그냥 CLM이 되는 것으로 오해하기 쉽지만, BERT류 MLM은 애초에 마스크 없는 양방향 어텐션 위에서 입력 토큰 마스킹으로 학습 신호를 만드는 다른 설계다 — 두 마스킹은 별개의 축이다.',
 '$-\\infty$를 "정확히 0을 만들기 위한 수학적 편의"로만 여기면, 실제 구현에서 float16 등 낮은 정밀도에서 진짜 $-\\infty$ 대신 매우 작은 유한 값(예: -1e4~-1e9)을 쓰는 이유(오버플로·NaN 방지)를 놓친다.'
],

papers:['gpt1','transformer'],
terms:['self-attention','mlm-vs-clm','autoregressive','transformer-block']
});
