WIKI.concept({
slug:'positional-encoding',

tldr:'토큰 순서 정보가 없는 self-attention 에 위치 정보를 주입하는 방법으로, 절대 위치를 더하는 사인파 방식에서 회전으로 상대 위치를 주는 RoPE 까지 여러 세대가 있다.',

why:'컨텍스트 길이를 늘리는 거의 모든 기법 — [RoPE](#/p/rope) 스케일링, [YaRN](#/p/yarn), [LongRoPE](#/p/longrope), [ALiBi](#/p/alibi) — 는 결국 position encoding 을 어떻게 바꾸느냐의 문제다. 왜 attention 자체가 위치를 모르는지, 그래서 위치 정보를 "따로" 주입해야 한다는 게 무슨 뜻인지 이해해야 이 기법들이 서로 무엇을 절충하는지 보인다.',

sections:[
 {h:'attention 은 순서를 모른다', d:'[self-attention](#/c/self-attention)의 연산 — $QK^\\top$ 내적과 value 가중합 — 은 입력 토큰들의 **집합**에만 반응한다. 토큰 순서를 뒤섞어도 각 토큰이 받는 attention 가중치 계산 자체는 (같은 토큰 집합이라면) 수학적으로 대칭이다 — RNN 처럼 순서대로 처리하는 재귀 구조가 없기 때문이다. 즉 "고양이가 개를 물었다"와 "개가 고양이를 물었다"를 self-attention 혼자서는 구분하지 못한다. 그래서 위치 정보를 명시적으로 주입해야 한다.'},
 {h:'사인파 절대 위치', d:'원 Transformer 논문은 각 위치 $pos$ 마다 고정된(학습되지 않는) 사인·코사인 벡터를 만들어 토큰 임베딩에 **더한다**. 서로 다른 주파수의 사인파를 차원마다 배치해, 위치가 다르면 벡터도 달라지되 인접한 위치는 비슷한 벡터를 갖도록 설계했다. 삼각함수의 덧셈 정리 덕분에 위치 $pos+k$ 의 인코딩이 위치 $pos$ 인코딩의 선형 변환으로 표현될 수 있어, 모델이 상대적 거리도 어느 정도 학습할 수 있다는 것이 원 논문의 주장이다.'},
 {h:'학습된 위치 임베딩', d:'BERT·GPT-2 등은 사인파 대신 위치마다 학습 가능한 임베딩 벡터를 테이블로 두고 토큰 임베딩에 더한다. 구현이 단순하고 데이터에 맞춰 최적화되지만, 학습 시 본 최대 길이(예: 1024)를 넘는 위치는 테이블에 아예 없어 외삽(extrapolation)이 안 된다는 한계가 있다 — 컨텍스트 길이를 늘리려면 테이블 자체를 다시 학습해야 한다.'},
 {h:'상대 위치와 RoPE', d:'절대 위치 대신 "두 토큰 사이의 거리"만을 attention 계산에 반영하는 상대 위치(relative position) 방식들이 이어졌다. [RoPE](#/p/rope)는 이 아이디어를 우아하게 구현한다 — query·key 벡터를 위치에 비례하는 각도만큼 **회전**시키면, 회전된 두 벡터의 내적이 정확히 두 위치의 **차이**에만 의존하게 된다(회전의 성질). 즉 절대 위치를 각 벡터에 인코딩하면서도 attention 스코어에는 상대 거리만 드러나는 효과를 얻는다. 이 성질 덕분에 학습 때보다 긴 시퀀스로도 비교적 잘 확장되고, Llama 계열을 포함한 대부분의 최신 LLM 이 RoPE 를 쓴다. [ALiBi](#/p/alibi)는 회전 대신 거리에 비례하는 페널티를 attention 스코어에 직접 빼는 더 단순한 방식으로 같은 목표(먼 토큰일수록 낮은 가중치, 길이 외삽)를 노린다.'},
 {h:'컨텍스트 길이 확장으로 이어지는 흐름', d:'RoPE 는 학습 때 본 위치 범위를 벗어나면(예: 4K 로 학습 후 32K 로 추론) 성능이 급격히 떨어지는 문제가 있는데, 이는 회전 각도가 훈련 분포 밖에서 처음 보는 값이 되기 때문이다. [YaRN](#/p/yarn)과 [LongRoPE](#/p/longrope)는 이 회전 주파수를 재조정(interpolation/extrapolation 혼합)해 추가 학습을 거의 없이도 컨텍스트를 몇 배로 늘리는 기법이다. 즉 positional encoding 설계 하나가 "모델이 얼마나 긴 문서를 다룰 수 있는가"([context window](#/c/kv-cache))를 직접 좌우한다.'}
],

math:[
 {tex:'PE_{(pos,2i)}=\\sin\\!\\left(\\dfrac{pos}{10000^{2i/d}}\\right),\\quad PE_{(pos,2i+1)}=\\cos\\!\\left(\\dfrac{pos}{10000^{2i/d}}\\right)',
  expr:'sinusoidal positional encoding', d:'$pos$ 는 시퀀스 내 위치, $i$ 는 차원 인덱스, $d$ 는 임베딩 차원. 차원 쌍마다 주파수가 다른 사인·코사인 값을 배정해, 위치가 하나의 고차원 벡터로 유일하게 결정되도록 만든다. 이 값을 토큰 임베딩에 더한 뒤 self-attention 에 넣는다.'},
 {tex:'q\\cdot k \\ \\text{(RoPE 적용 후)}=\\text{Re}\\big[(q e^{i\\,pos_q\\theta})(k e^{i\\,pos_k\\theta})^*\\big]=f(q,k,\\,pos_q-pos_k)',
  expr:'RoPE relative-position property', d:'query·key 벡터를 각각 자신의 위치 $pos_q,pos_k$ 에 비례하는 각도 $\\theta$ 로 회전시키면, 회전된 두 벡터의 내적은 절대 위치가 아니라 오직 상대 위치 차이 $pos_q-pos_k$ 의 함수가 된다 — 복소평면에서 두 회전 벡터의 내적이 두 각도의 차이에만 의존하는 성질을 이용한 것이다.'}
],

diagram:{type:'flow', cap:'위치 정보를 주입하는 방식의 세대 흐름.',
 nodes:[
  {t:'사인파 절대 위치', s:'고정 함수'},
  {t:'학습된 절대 위치', s:'길이 확장 불가'},
  {t:'RoPE·ALiBi', s:'상대 위치(거리 기반)'},
  {t:'YaRN·LongRoPE', s:'긴 컨텍스트 확장'}
 ]},

confuse:[
 {a:'절대 위치 인코딩', b:'상대 위치 인코딩', d:'절대 위치는 "이 토큰이 몇 번째인가"를 인코딩하고, 상대 위치는 "이 두 토큰이 몇 칸 떨어져 있는가"를 attention 계산에 반영한다. 상대 위치 방식(RoPE·ALiBi)이 학습 시 본 적 없는 길이로도 더 잘 확장되는 경향이 있다.'},
 {a:'position embedding', b:'token embedding', d:'token embedding 은 "무엇인가"(단어의 의미)를, position encoding 은 "어디인가"(시퀀스 내 위치)를 나타낸다. 원 Transformer 는 둘을 단순히 더해서 하나의 벡터로 합치는데, 이 때문에 두 정보가 같은 벡터 공간에 뒤섞인다는 비판도 있다(RoPE 는 이를 곱셈적 회전으로 분리해 해결한다).'}
],

pitfalls:[
 'positional encoding 이 없으면 모델이 아예 학습을 못 하는 게 아니라, 순서에 의존하는 과제(문법, 인과관계)에서 성능이 크게 떨어진다 — "안 되는" 것과 "덜 되는" 것을 구분해야 한다.',
 'RoPE 를 쓰는 모델을 학습 때보다 훨씬 긴 컨텍스트로 그냥 밀어넣으면(추가 조치 없이) 성능이 급격히 무너진다. 이것이 관행이 아니라 회전 각도의 분포가 훈련 범위를 벗어나기 때문이라는 원인을 알아야 YaRN 같은 완화책의 필요성이 납득된다.'
],

papers:['transformer','rope','alibi'],
terms:['self-attention','transformer-block','kv-cache']
});
