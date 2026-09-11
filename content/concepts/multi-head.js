WIKI.concept({
slug:'multi-head',

tldr:'같은 self-attention 을 차원을 나눠 여러 개 병렬로 돌린 뒤 결과를 이어붙이는 구조로, 헤드마다 서로 다른 종류의 관계(구문·의미·위치 등)를 동시에 포착한다.',

why:'"헤드 수 h"·"KV 캐시 크기"·[MQA](#/p/mqa)·[GQA](#/p/gqa) 같은 실무 용어는 전부 multi-head attention 의 구조를 알아야 의미가 잡힌다. 헤드 수를 늘려도 전체 연산량이 크게 늘지 않는 이유, 추론에서 헤드마다 K·V 캐시가 쌓여 메모리가 병목이 되는 이유를 모르면 서빙 비용 최적화를 이해할 수 없다.',

sections:[
 {h:'왜 하나로는 부족한가', d:'단일 [self-attention](#/c/self-attention) 한 세트는 softmax 로 가중치를 정하는 하나의 "관점"만 만든다. 하지만 문장 안의 관계는 종류가 여럿이다 — "이 대명사가 가리키는 명사가 무엇인가"(지시 관계), "이 동사의 주어가 무엇인가"(구문 관계), "바로 이전 토큰이 무엇인가"(위치 관계) 등은 서로 다른 유사도 기준을 필요로 한다. 하나의 softmax 분포는 이런 여러 기준을 동시에 표현하기 어렵다 — 평균을 내면 각 관계의 날카로움이 뭉개진다.'},
 {h:'헤드로 나눈다', d:'전체 모델 차원 $d_{model}$ 을 $h$ 개의 head 로 쪼개 각 head 가 더 작은 차원 $d_k=d_{model}/h$ 에서 독립적인 $W_Q^{(i)}, W_K^{(i)}, W_V^{(i)}$ 를 갖고 self-attention 을 병렬로 수행한다. 각 head 는 서로 다른 부분공간에서 유사도를 계산하므로 실제로 학습 후 보면 어떤 head 는 구문 관계, 어떤 head 는 인접 토큰, 어떤 head 는 특정 개체명 패턴에 반응하는 식으로 분화되는 경우가 관찰된다. 각 head 출력을 이어붙이고($\\text{Concat}$) 다시 한 번 선형 변환 $W_O$ 로 합친다.'},
 {h:'연산량은 왜 비슷한가', d:'head 하나의 투영 행렬은 $d_{model}\\times d_k$ 이고 head 가 $h$ 개이므로 투영에 드는 파라미터 총량은 $h\\times d_{model}\\times d_k = h\\times d_{model}\\times(d_{model}/h) = d_{model}^2$ 로, head 수 $h$ 와 무관하게 일정하다. 즉 "헤드를 늘린다"는 head 하나의 차원을 그만큼 줄이면서 병렬 개수를 늘리는 것이라, 전체 $Q,K,V$ 투영 파라미터·연산량은 단일 head($d_k=d_{model}$)를 쓸 때와 거의 같다 — 공짜로 여러 관점을 얻는 셈이다.'},
 {h:'추론에서의 대가 — KV 캐시', d:'학습 때는 연산량이 비슷해도, 자기회귀 생성(autoregressive decoding)에서는 매 head 마다 지금까지 생성한 모든 토큰의 K·V 를 캐시에 저장해야 한다. head 수가 $h$ 개면 캐시 크기도 $h$ 배로 커지고, 이것이 긴 컨텍스트·큰 배치에서 GPU 메모리를 압박하는 주된 원인이다. [MQA](#/p/mqa)는 모든 head 가 K·V 를 하나만 공유하게 해 캐시를 $1/h$ 로 줄이고, [GQA](#/p/gqa)는 head 를 몇 개 그룹으로 묶어 그룹마다 K·V 를 공유해 품질과 캐시 크기 사이를 절충한다.'}
],

math:[
 {tex:'\\text{head}_i=\\text{Attention}(QW_Q^{(i)},\\,KW_K^{(i)},\\,VW_V^{(i)}),\\qquad \\text{MultiHead}(Q,K,V)=\\text{Concat}(\\text{head}_1,\\dots,\\text{head}_h)W_O',
  expr:'multi-head attention', d:'$W_Q^{(i)},W_K^{(i)},W_V^{(i)}\\in\\mathbb{R}^{d_{model}\\times d_k}$ 는 $i$번째 head 전용 투영 행렬, $h$ 는 head 개수, $d_k=d_{model}/h$ 는 head 하나의 차원. 각 head 의 출력을 이어붙인 $\\mathbb{R}^{n\\times d_{model}}$ 벡터에 출력 투영 $W_O\\in\\mathbb{R}^{d_{model}\\times d_{model}}$ 를 곱해 원래 차원으로 되돌린다.'}
],

diagram:{type:'split', cap:'multi-head attention: 차원을 h개로 쪼개 병렬 attention 후 이어붙이기.',
 from:{t:'입력 X'},
 branches:[
  {t:'head 1', s:'Q,K,V 부분공간 1'},
  {t:'head 2', s:'Q,K,V 부분공간 2'},
  {t:'head h', s:'Q,K,V 부분공간 h'}
 ]},

confuse:[
 {a:'multi-head attention', b:'MQA', d:'MHA 는 head 마다 독립된 K·V 투영을 갖는다. [MQA](#/p/mqa) 는 Q 투영만 head 별로 두고 K·V 투영은 모든 head 가 하나를 공유한다 — 품질은 약간 떨어지지만 추론 KV 캐시가 $1/h$ 로 줄어든다.'},
 {a:'head 수를 늘리기', b:'d_model 을 늘리기', d:'head 수 $h$ 를 늘리는 것은 표현력을 "관점의 다양성" 쪽으로 늘리는 것이고, $d_{model}$ 을 늘리는 것은 표현력을 "벡터 하나가 담는 정보량" 쪽으로 늘리는 것이다. 실무에서는 보통 $d_k=64$ 근처를 유지한 채(GPT-3, Llama 계열) $d_{model}$ 이 커지는 만큼 $h$ 를 비례해서 늘린다.'}
],

pitfalls:[
 '"head 가 많을수록 무조건 좋다"는 아니다 — $d_k$ 가 너무 작아지면 head 하나가 표현할 수 있는 관계의 복잡도 자체가 줄어든다. 실무에서는 $d_k$ 를 32~128 범위로 유지하는 경향이 관행이다.',
 '학습 시 연산량이 head 수와 거의 무관하다는 것과, 추론 시 KV 캐시가 head 수에 비례해서 커진다는 것은 서로 다른 이야기다. 이 둘을 섞어서 "multi-head 는 비용이 안 든다"고 오해하면 서빙 비용을 잘못 예측하게 된다.'
],

papers:['transformer','mqa','gqa'],
terms:['self-attention','attention-c','transformer-block','kv-cache']
});
