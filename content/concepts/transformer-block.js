WIKI.concept({
slug:'transformer-block',

tldr:'multi-head self-attention 과 position-wise FFN 을 각각 잔차 연결·정규화로 감싼 뒤 쌓는 단위로, 오늘날 대부분의 LLM 은 이 블록을 수십~수백 번 반복한 구조다.',

why:'"레이어 수 N", "hidden size", "Pre-LN vs Post-LN"처럼 모델 스펙표에 나오는 숫자 대부분이 이 블록 하나의 구성에서 나온다. 블록 안의 순서(attention 먼저인지, 정규화가 어디 있는지)가 왜 그렇게 정해졌는지 알아야 학습이 불안정할 때 무엇을 의심할지 감이 잡힌다.',

sections:[
 {h:'블록의 구성 요소', d:'Transformer 블록 하나는 두 개의 sub-layer 로 이루어진다 — [multi-head self-attention](#/c/multi-head)과 position-wise feed-forward network(FFN). 두 sub-layer 각각을 [잔차 연결](#/c/residual) $x+\\text{Sublayer}(x)$ 로 감싸고, 그 앞이나 뒤에 LayerNorm 을 둔다. 디코더 블록은 여기에 causal self-attention(미래 토큰 마스킹)이 들어가고, 인코더-디코더 구조라면 cross-attention sub-layer 가 하나 더 추가된다.'},
 {h:'Pre-LN 과 Post-LN', d:'원 논문의 Transformer는 Post-LN — $\\text{LayerNorm}(x+\\text{Sublayer}(x))$ — 을 썼다. 이 경우 잔차 경로 자체가 정규화를 거치기 때문에, 층이 깊어질수록 초기 학습에서 경사가 불안정해져 warmup 스케줄 없이는 학습이 잘 발산했다. Pre-LN — $x+\\text{Sublayer}(\\text{LayerNorm}(x))$ — 은 정규화를 sub-layer **안쪽**에 넣어 잔차 경로($x$ 가 그대로 더해지는 경로)를 정규화 없이 깨끗하게 유지한다. 그 결과 warmup 이 덜 민감해지고 층을 더 깊게 쌓기 쉬워져, GPT 계열을 포함한 오늘날 대부분의 대형 LLM 은 Pre-LN 을 기본으로 쓴다. 대가는 출력 분산이 층을 거치며 계속 커질 수 있어 마지막에 별도 LayerNorm(final norm)을 하나 더 둔다는 점이다.'},
 {h:'FFN 은 왜 4배 폭인가', d:'position-wise FFN 은 각 토큰 위치에 독립적으로 적용되는 2층 MLP 다 — $d_{model}\\to 4d_{model}\\to d_{model}$ 로 중간 차원을 보통 4배로 넓힌다. attention 이 "토큰들 사이에서 정보를 섞는" 역할이라면, FFN 은 섞인 정보를 위치마다 독립적으로 "가공·저장"하는 역할을 맡는다고 여겨진다 — Transformer FFN 을 학습된 키-값 메모리(key-value memory)로 보는 해석에서는, 첫 번째 가중치 행렬의 각 행이 입력 패턴을 감지하는 key, 두 번째 가중치 행렬의 각 행이 그에 대응해 더해줄 value 로 기능한다고 본다. 4배라는 배율 자체는 원 논문의 경험적 선택이었고 이후 모델들도 대체로 이를 따르되, 일부는 활성 함수를 GELU/SwiGLU 로 바꾸면서 폭을 조정하기도 한다.'},
 {h:'전체 그림', d:'디코더 전용 LLM 한 층은 대략 다음 순서다: 입력 → LayerNorm → causal self-attention → 잔차 더하기 → LayerNorm → FFN → 잔차 더하기 → 다음 층으로. 이 블록을 $N$ 번(GPT-3 는 96, 소형 모델은 12~32 등) 쌓고 마지막에 최종 LayerNorm 과 출력 projection 을 붙이면 전체 모델이 완성된다.'}
],

math:[
 {tex:'\\text{Post-LN: } x_{l+1}=\\text{LN}\\big(x_l+\\text{Sublayer}(x_l)\\big)\\qquad \\text{Pre-LN: } x_{l+1}=x_l+\\text{Sublayer}\\big(\\text{LN}(x_l)\\big)',
  expr:'Post-LN vs Pre-LN', d:'$x_l$ 은 $l$번째 sub-layer 의 입력, Sublayer 는 self-attention 또는 FFN. Pre-LN 에서는 $x_l$ 자체가 아무 정규화 없이 다음 층까지 그대로 더해지는 항등 경로(identity path)를 유지하므로, 층을 아무리 깊게 쌓아도 이 경로를 통해 gradient 가 감쇠 없이 흐를 수 있다.'},
 {tex:'\\text{FFN}(x)=\\sigma(xW_1+b_1)W_2+b_2,\\qquad W_1\\in\\mathbb{R}^{d\\times 4d},\\ W_2\\in\\mathbb{R}^{4d\\times d}',
  expr:'position-wise feed-forward', d:'$\\sigma$ 는 비선형 활성(원 논문은 ReLU, 이후 모델들은 GELU·SwiGLU 등). 각 토큰 위치 $x$ 에 동일한 $W_1,W_2$ 를 독립적으로 적용하므로 위치 간 정보 교환은 없다 — 그 역할은 attention sub-layer 가 이미 끝냈다는 전제다.'}
],

diagram:{type:'stack', cap:'디코더 블록 하나(Pre-LN)의 순서.',
 layers:[
  {t:'LayerNorm'},
  {t:'causal-attn', s:'self-attention'},
  {t:'+ 잔차'},
  {t:'LayerNorm'},
  {t:'FFN (4× 확장)'},
  {t:'+ 잔차'}
 ]},

confuse:[
 {a:'Pre-LN', b:'Post-LN', d:'Post-LN 은 원 논문 방식으로 정규화가 잔차 더하기 뒤에 온다 — 표현력은 약간 더 좋다고 보고되지만 깊은 모델에서 학습이 불안정하다. Pre-LN 은 정규화가 sub-layer 안쪽에 있어 잔차 경로가 깨끗하게 유지되고 학습이 안정적이라 오늘날 대형 LLM 의 기본값이다.'},
 {a:'self-attention sub-layer', b:'FFN sub-layer', d:'attention 은 토큰들 **사이**에서 정보를 섞고(시퀀스 차원으로 작동), FFN 은 각 토큰 위치에서 **독립적으로** 같은 변환을 적용한다(위치 차원으로는 섞지 않음). 이 둘이 번갈아 쌓이는 것이 Transformer 블록의 본질이다.'}
],

pitfalls:[
 '"attention 이 Transformer 의 전부"라고 여기면 FFN 의 역할을 놓친다. 실제로 FFN 이 전체 파라미터의 절반 이상을 차지하는 경우가 많고, 최근 해석 연구들은 사실적 지식(factual knowledge)의 상당 부분이 FFN 층에 저장된다고 본다.',
 'Pre-LN 이 항상 우월한 것은 아니다 — 표현력 손실을 보완하려 최종 정규화를 추가로 신경 써야 하고, 일부 후속 연구는 Post-LN 변형이나 다른 정규화 배치(예: sandwich norm)를 실험적으로 다시 시도한다.'
],

papers:['transformer','layernorm'],
terms:['self-attention','multi-head','residual','positional-encoding']
});
