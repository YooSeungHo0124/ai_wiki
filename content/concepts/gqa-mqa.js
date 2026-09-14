WIKI.concept({
slug:'gqa-mqa',

tldr:'MQA 는 모든 query head 가 key·value head 하나를 공유하고, GQA 는 query head 를 몇 개의 그룹으로 묶어 그룹마다 하나의 key·value head 를 공유해 [KV 캐시](#/c/kv-cache) 크기를 줄인다.',

why:'긴 문맥으로 대화형 LLM 을 서빙해 보면 GPU 메모리를 잡아먹는 건 파라미터가 아니라 [KV 캐시](#/c/kv-cache)라는 걸 바로 알게 된다. MQA·GQA 를 모르면 왜 최신 LLM 들이 attention head 수는 그대로 두고 key/value head 수만 줄여 놓았는지, 그리고 그 선택이 추론 처리량(throughput)에 왜 그렇게 큰 영향을 주는지 이해할 수 없다. 서빙 비용을 논의할 때 파라미터 수만 보고 메모리를 추정하면 실제 배포 시 캐시 크기 때문에 크게 어긋난다.',

sections:[
 {h:'병목은 KV 캐시', d:'자기회귀 생성에서는 매 스텝마다 이전 모든 토큰의 key·value 를 다시 계산하지 않으려고 [KV cache](#/c/kv-cache)에 저장해 재사용한다. 표준 [multi-head attention](#/c/multi-head)에서는 head 수만큼 key·value 도 따로 있어서, 캐시 크기가 (레이어 수)×(head 수)×(head 차원)×(시퀀스 길이)×2(K 와 V) 에 비례해 커진다. 배치를 키우거나 컨텍스트를 늘릴수록 이 캐시가 GPU 메모리를 지배하게 되고, 결국 한 번에 처리할 수 있는 배치 크기(=처리량)를 제한하는 실질적 병목이 된다 — 이게 MQA·GQA 가 나온 이유다.'},
 {h:'MQA: 하나로 공유', d:'[Multi-Query Attention](#/p/mqa)은 query head 는 기존처럼 여러 개(예: 32개) 두되, key·value head 는 **딱 하나**만 두고 모든 query head 가 그것을 공유한다. 캐시 크기가 head 수만큼 줄어들어(예: 32배) 메모리 병목이 거의 사라지고 디코딩 속도가 크게 빨라진다. 대가는 품질 저하 — key·value 표현의 다양성이 사라지므로 head 마다 다른 종류의 관계를 포착하던 능력이 줄어 번역·요약 등에서 약간의 성능 하락이 보고됐다.'},
 {h:'GQA — 그 중간', d:'[GQA](#/p/gqa)는 MQA 의 극단과 표준 MHA 사이를 절충한다. query head 를 $G$ 개의 그룹으로 묶고, **그룹 하나당 key·value head 하나**를 공유한다 — $G=1$ 이면 MQA, $G=$(head 수) 면 표준 MHA 와 같아지는 일반화된 형태다. 그룹 수를 늘릴수록 캐시는 커지지만 품질은 MHA 에 가까워지고, 그룹 수를 줄일수록 캐시는 작아지지만 품질은 MQA 에 가까워진다 — 실무에서는 head 수의 8분의 1 정도(예: 32개 query head 에 4~8개의 key/value head)를 흔히 쓴다.'},
 {h:'uptraining', d:'GQA 논문의 실용적인 기여 중 하나는 이미 표준 MHA 로 학습된 체크포인트를 **적은 추가 학습만으로** GQA 로 전환하는 uptraining 절차다. 같은 그룹에 속할 key/value head 들의 가중치를 평균 내어 head 수를 줄인 뒤, 원래 사전학습 연산량의 일부(수 % 수준)만 추가로 학습해 성능을 회복시킨다. 이 덕분에 새 아키텍처를 처음부터 학습하는 대신 기존 대형 모델을 GQA 로 "개조"해 서빙 비용을 낮출 수 있다. GQA 논문이 보고한 수치로는 원래 사전학습 연산량의 약 5% 만 추가로 uptraining 에 쓰고도, 처음부터 GQA 로 학습한 모델에 근접하는 품질을 회복했다.'},
 {h:'실무에서', d:'[Llama 2](#/p/llama2)의 큰 모델들과 이후 대다수 오픈소스 LLM 이 GQA 를 채택했다. 서빙 관점에서는 그룹 수(query head 수 대비 key/value head 수의 비율)가 곧 KV 캐시 절감 배율이므로, 같은 파라미터 수라도 GQA 그룹 수가 다르면 동시 처리 가능한 배치 크기가 크게 달라진다. 모델을 고를 때 "head 수"만 보지 말고 config 의 `num_key_value_heads`(또는 유사 필드)를 따로 확인해야 실제 서빙 메모리를 가늠할 수 있다. 배치 처리량을 늘리고 싶을 때 모델 파라미터 수를 줄이는 것보다 KV 캐시를 줄이는 쪽(그룹 수 축소, 양자화)이 더 직접적인 해법이 되는 경우가 많다는 것도 기억해 둘 만하다.'}
],

math:[
 {tex:'\\text{KV 캐시 크기} \\propto L \\times h_{kv} \\times d_h \\times n \\times 2',
  expr:'KV cache footprint', d:'$L$ 은 레이어 수, $h_{kv}$ 는 key/value head 수(표준 MHA 는 전체 head 수 $h$ 와 같고, MQA 는 1, GQA 는 그룹 수 $G$), $d_h$ 는 head 차원, $n$ 은 시퀀스 길이, 2 는 key 와 value 두 종류다. $h_{kv}$ 를 $h$ 에서 $G$ 로 줄이면 캐시가 정확히 $h/G$ 배로 줄어든다.'}
],

diagram:{type:'compare', cap:'query head 수는 그대로, key/value head 수만 다르다.',
 left:{t:'MHA(표준)', items:['query head h개','key/value head h개','캐시 최대, 품질 최고']},
 right:{t:'GQA(그룹 G) → MQA(G=1)', items:['query head h개','key/value head G개','캐시 h/G배 감소']}},

confuse:[
 {a:'MQA', b:'GQA', d:'MQA 는 key/value head 가 정확히 1개인 극단적인 경우이고, GQA 는 그 head 수를 그룹 수 $G$(1과 h 사이 임의의 값)로 일반화한 것이다. GQA 에서 $G=1$ 로 두면 MQA 와 같아진다.'},
 {a:'head 수를 줄이는 것', b:'head 차원을 줄이는 것', d:'GQA·MQA 는 key/value **head 의 개수**만 줄이지, head 하나의 차원($d_h$)은 건드리지 않는다. head 차원을 줄이는 것은 표현력 자체를 낮추는 별개의 선택이다.'},
 {a:'KV 캐시 절감', b:'[FlashAttention](#/p/flashattention) 같은 커널 최적화', d:'GQA·MQA 는 **저장해야 할 KV 데이터의 양** 자체를 줄이는 아키텍처 변경이고, FlashAttention 은 그 데이터를 가지고 attention 을 계산하는 **방식**(메모리 접근 패턴)을 최적화한 것이다. 둘은 상호 배타적이지 않고 함께 쓴다.'}
],

pitfalls:[
 '"GQA 는 속도만 위한 근사"라고 생각하기 쉬운데, 실제로는 uptraining 을 거치면 원래 MHA 대비 품질 저하가 거의 없다고 보고된다 — 완전히 공짜는 아니지만 체감상 손실이 작다는 것이지 이론적으로 손실이 0이라는 뜻은 아니다.',
 'query head 수와 key/value head 수를 혼동해서 "head 수를 줄였다"고 뭉뚱그려 말하면 안 된다 — GQA·MQA 는 query head 는 그대로 두고 key/value head 만 줄인다.',
 'GQA 를 처음부터 학습하는 것과 uptraining 으로 전환하는 것은 다른 시나리오다 — 기존 체크포인트가 있다면 재학습 없이 uptraining 만으로도 상당한 메모리 절감을 얻을 수 있다.',
 'KV 캐시 절감을 [RoPE](#/c/rope-c) 컨텍스트 확장과 무관한 문제로 여기면 안 된다 — 둘 다 긴 컨텍스트를 다루기 위한 장치이지만, 하나는 캐시 크기(메모리)를, 다른 하나는 위치 표현의 유효 범위를 다룬다는 점에서 서로 독립적으로 함께 적용된다.',
 '그룹 수를 정할 때 "무조건 작게"가 정답이라고 생각하면 안 된다 — 그룹 수를 지나치게 줄이면 품질 저하가 눈에 띄게 커질 수 있으므로, 목표 서빙 환경의 메모리 제약과 품질 요구 사이에서 실측을 거쳐 정해야 한다.'
],

papers:['gqa','mqa','llama2'],
terms:['kv-cache','multi-head','rope-c']
});
