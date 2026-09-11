WIKI.concept({
slug:'attention-c',

tldr:'디코더가 매 스텝마다 인코더 전체 상태 중 지금 필요한 부분에 가중치를 몰아주는 메커니즘으로, query·key 유사도로 만든 가중치로 value 를 가중평균한다.',

why:'어텐션을 모르면 Transformer 를 "그런 구조가 있다" 수준으로만 알게 된다. self-attention·multi-head·[RoPE](#/c/positional-encoding) 전부 이 하나의 연산 — query·key·value 로 가중평균을 만든다 — 위에 얹힌 변형이다. 이걸 원리로 이해해야 attention mask, KV 캐시, attention sink 같은 실무 용어가 전부 한 그림 안에서 이해된다.',

sections:[
 {h:'왜 필요했나', d:'2014년 seq2seq(encoder-decoder RNN)는 입력 문장 전체를 고정 길이 벡터 하나(마지막 은닉 상태)로 압축한 뒤 디코더가 그 벡터 하나만 보고 번역을 생성했다. 문장이 길어질수록 이 고정 길이 병목(fixed-length bottleneck)에 정보가 다 담기지 못해 번역 품질이 떨어졌다. [Bahdanau attention](#/p/bahdanau)은 이 병목을 없애자는 제안이다 — 디코더가 인코더의 마지막 상태 하나가 아니라 **모든 스텝의 은닉 상태**에 접근하되, 지금 생성할 단어와 관련 있는 스텝에 더 큰 가중치를 주자는 것이다.'},
 {h:'query·key·value 는 역할이다', d:'셋 다 벡터지만 비유가 아니라 역할로 구분해야 한다. **query** 는 "지금 내가 무엇을 찾고 있는가"를 나타내는 벡터(디코더의 현재 상태). **key** 는 "각 후보가 무엇을 제공하는가"를 요약한 인덱스 벡터(인코더의 각 스텝). **value** 는 실제로 가져올 내용물이다. query 와 key 의 유사도를 점수로 바꾼 뒤, 그 점수로 value 들을 가중평균한다 — key 는 검색에 쓰이고 value 는 결과로 반환된다는 점에서 해시맵의 lookup 과 구조적으로 같다.'},
 {h:'가중 평균이라는 본질', d:'어텐션이 하는 일은 결국 "유사도로 정규화한 가중치로 value 들을 평균 내는 것" 하나뿐이다. 유사도를 계산하는 함수(내적, MLP, 코사인 유사도 등)와 value 를 뽑는 소스가 무엇이냐에 따라 Bahdanau attention, self-attention, cross-attention 이 갈릴 뿐 골격은 동일하다.'},
 {h:'Transformer 로의 확장', d:'Bahdanau attention 은 RNN 인코더-디코더에 얹힌 부가 기능이었지만, [Transformer](#/p/transformer)는 "RNN 자체를 없애고 어텐션만으로 시퀀스를 처리하자"는 제안이다. 이때 같은 시퀀스 안에서 query·key·value 를 모두 뽑는 특수한 경우가 [self-attention](#/c/self-attention)이고, 인코더 출력을 key·value 로 쓰고 디코더 상태를 query 로 쓰는 경우가 cross-attention — Bahdanau attention과 형태가 사실상 같다.'}
],

math:[
 {tex:'e_{i}=\\text{score}(q,k_i),\\qquad \\alpha_i=\\dfrac{\\exp(e_i)}{\\sum_j \\exp(e_j)},\\qquad \\text{out}=\\sum_i \\alpha_i\\,v_i',
  expr:'attention as weighted average', d:'$q$ 는 query 하나, $k_i$ 는 $i$번째 key, $v_i$ 는 $i$번째 value 다. score 함수로 query-key 유사도 $e_i$ 를 구하고, softmax 로 합이 1인 가중치 $\\alpha_i$ 로 바꾼 뒤, 그 가중치로 value 를 가중평균한 것이 출력이다. Bahdanau 원 논문의 score 함수는 작은 MLP($v^\\top\\tanh(W_1 q+W_2 k_i)$, additive attention)였고, 이후 [Transformer](#/p/transformer)는 내적(dot-product)을 쓴다.'}
],

diagram:{type:'flow', cap:'어텐션의 공통 골격: query-key 유사도 → softmax 정규화 → value 가중평균.',
 nodes:[
  {t:'query', s:'무엇을 찾는가'},
  {t:'key 유사도'},
  {t:'softmax 가중치'},
  {t:'value 가중평균', s:'출력'}
 ]},

confuse:[
 {a:'attention', b:'self-attention', d:'attention 은 가중평균이라는 연산 전체를 가리키는 일반 용어이고, self-attention 은 그중 query·key·value 를 전부 같은 시퀀스에서 뽑는 특수한 경우다. Transformer 인코더-디코더 사이의 cross-attention 은 attention이지만 self-attention은 아니다.'},
 {a:'attention weight', b:'gradient', d:'attention weight($\\alpha_i$)는 순전파에서 value 를 얼마나 섞을지 정하는 계수이고, 역전파 때 흐르는 gradient 와는 다른 값이다. attention weight 가 크다고 해서 그 위치의 gradient 기여가 항상 큰 것도 아니다 — 해석(interpretability) 도구로 attention weight 를 곧바로 "중요도"라 읽는 것은 논쟁거리다.'}
],

pitfalls:[
 '어텐션 가중치를 "모델이 그 토큰을 중요하게 여긴다"는 설명으로 그대로 받아들이면 안 된다. 여러 연구가 attention weight 와 실제 모델 판단 근거가 항상 일치하지는 않는다는 것을 보였다.',
 'attention 은 원래 RNN 인코더-디코더에 얹는 보조 장치로 나왔다. "attention = Transformer"로 착각하면 Bahdanau attention 같은 이전 형태나 CNN+attention 조합을 이해하기 어려워진다.'
],

papers:['bahdanau','transformer'],
terms:['self-attention','multi-head','positional-encoding','encoder-decoder']
});
