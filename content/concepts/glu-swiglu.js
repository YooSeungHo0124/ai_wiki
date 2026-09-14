WIKI.concept({
slug:'glu-swiglu',

tldr:'GLU 는 [FFN](#/c/ffn)의 은닉 표현을 한 번 더 게이트로 걸러내는 구조이고, SwiGLU·GeGLU 는 그 게이트의 활성 함수를 Swish·GELU 로 바꾼 변형으로, LLaMA·PaLM 등 최신 LLM 의 FFN 표준이 됐다.',

why:'"SwiGLU를 쓴다"는 말이 config 파일마다 나오는데, 이게 그냥 활성 함수 하나를 바꾼 것인지 구조 자체가 다른 것인지 모르면 파라미터 수·연산량을 잘못 계산하게 된다. 특히 은닉 차원을 원래의 2/3로 줄이는 관례를 모르면 "SwiGLU 로 바꿨는데 왜 모델 크기가 안 늘었지"라는 질문에 답할 수 없다. 아키텍처 리포트나 config 파일을 읽을 때마다 마주치는 이름이라, 그 구조를 정확히 그릴 수 있어야 다른 모델과 공정하게 비교할 수 있다.',

sections:[
 {h:'GLU: 게이트로 거르기', d:'Gated Linear Unit 은 입력을 두 개의 서로 다른 선형 변환에 통과시켜, 하나는 그대로 값(content)으로 쓰고 다른 하나는 시그모이드를 걸어 [0,1] 범위의 게이트로 만든 뒤 둘을 원소별로 곱한다: $\\text{GLU}(x)=(xW)\\otimes\\sigma(xV)$. 게이트 쪽이 0에 가까우면 그 차원의 정보를 거의 통과시키지 않고, 1에 가까우면 그대로 통과시킨다 — 즉 각 차원마다 "이 정보를 얼마나 흘려보낼지"를 입력 자체로부터 학습하는 셈이다. LSTM 의 forget gate 와 발상이 같다.'},
 {h:'FFN 에 게이트 끼워넣기', d:'Transformer 의 표준 [FFN](#/c/ffn) 은 $\\text{FFN}(x)=\\max(0,xW_1)W_2$ 처럼 선형-활성-선형 두 층뿐이다. GLU 변형은 여기에 게이트 갈래를 하나 더 추가해 $\\text{FFN}_{\\text{GLU}}(x)=\\big(\\phi(xW)\\otimes xV\\big)W_2$ 형태로 만든다 — 활성 함수 $\\phi$ 를 무엇으로 쓰느냐에 따라 이름이 갈린다: $\\phi=\\text{sigmoid}$ 면 GLU, $\\phi=\\text{GELU}$ 면 GeGLU, $\\phi=\\text{Swish}(=\\text{SiLU})$ 면 SwiGLU 다. [GLU Variants Improve Transformer](#/p/glu-variants) 논문은 여러 활성 조합을 실험적으로 비교했을 뿐 — 저자 스스로도 "왜 이게 더 잘 되는지 확실한 설명은 없다"고 밝혔고 이 개선을 신의 은총(divine benevolence) 이라 농담조로 돌렸다. 즉 이론적 근거보다는 경험적으로 검증된 구조라는 점을 정확히 알아야 한다. 원 논문은 GLU·ReGLU·GeGLU·SwiGLU·Bilinear 등 여러 변형을 T5 구조에 끼워 넣고 사전학습·미세조정 벤치마크에서 비교했는데, 게이트가 없는 표준 ReLU FFN 대비 대부분의 게이트 변형이 소폭이나마 꾸준히 앞섰다는 것이 실질적 근거다.'},
 {h:'은닉 차원 2/3 축소', d:'게이트를 추가하면 가중치 행렬이 $W_1,W_2$ 두 개에서 $W,V,W_2$ 세 개로 늘어난다. 은닉 차원 $d_{ff}$ 를 그대로 두면 파라미터 수가 약 1.5배로 늘어나 같은 파라미터 예산으로 다른 모델과 공정 비교가 안 된다. 그래서 실무 관례는 $d_{ff}$ 를 원래 값의 **약 2/3**로 줄여 전체 파라미터 수를 표준 FFN 과 거의 맞춘다 — 세 개의 $d\\times d_{ff}$ 행렬의 총합이 두 개의 $d\\times d_{ff,\\text{orig}}$ 행렬 총합과 비슷해지도록 $d_{ff}\\approx \\frac23 d_{ff,\\text{orig}}$ 로 잡는 식이다. [PaLM](#/p/palm)과 [LLaMA](#/p/llama)가 SwiGLU 를 채택하면서 이 비례를 그대로 따랐다.'},
 {h:'실무에서', d:'실무에서 은닉 차원을 계산할 때 "SwiGLU 니까 그냥 4d 로 잡으면 되겠지"라고 표준 FFN 배율(보통 $d_{ff}=4d$)을 그대로 쓰면 파라미터 수가 예상보다 크게 나온다 — LLaMA 계열 config 를 보면 $d_{ff}$ 가 $4d$ 가 아니라 그 2/3 근처의 값(그리고 하드웨어 정렬을 위해 64의 배수로 반올림한 값)으로 잡혀 있는 것을 확인할 수 있다. 활성 함수 선택 자체(GeGLU 대 SwiGLU)는 최종 성능 차이가 크지 않다는 것이 일반적인 관찰이라, 어느 쪽을 골라도 치명적이지 않다. 반면 은닉 차원 축소를 빠뜨리는 실수는 파라미터 예산과 학습 속도에 직접 영향을 주므로, 새 모델을 config 부터 설계할 때 가장 먼저 검산해야 할 항목이다.'}
],

math:[
 {tex:'\\text{FFN}_{\\text{SwiGLU}}(x)=\\big(\\text{Swish}(xW)\\otimes xV\\big)W_2,\\qquad \\text{Swish}(z)=z\\cdot\\sigma(z)',
  expr:'SwiGLU feed-forward', d:'$W,V\\in\\mathbb{R}^{d\\times d_{ff}}$ 는 각각 게이트용·값용 투영, $\\otimes$ 는 원소별 곱, $W_2\\in\\mathbb{R}^{d_{ff}\\times d}$ 는 출력 투영이다. GeGLU 는 $\\text{Swish}$ 자리에 GELU 를 넣은 것뿐, 나머지 구조는 동일하다.'}
],

diagram:{type:'flow', cap:'GLU 계열 FFN: 같은 입력이 값 경로와 게이트 경로로 갈라졌다가 곱해진다.',
 nodes:[
  {t:'x', s:'입력'},
  {t:'xW, xV', s:'두 투영'},
  {t:'φ(xW)⊗xV', s:'게이트 곱'},
  {t:'×W₂', s:'출력 투영'}
 ]},

confuse:[
 {a:'GLU', b:'gating in LSTM', d:'둘 다 시그모이드로 정보 흐름을 제어하는 게이트지만, LSTM 의 게이트는 시점 간(time step) 정보를 얼마나 유지·망각할지를 제어하고, GLU 는 같은 시점 안에서 feed-forward 층을 통과할 정보의 양을 제어한다.'},
 {a:'SwiGLU', b:'Swish/SiLU', d:'Swish(=SiLU, $z\\sigma(z)$)는 활성 함수 하나이고, SwiGLU 는 그 활성 함수를 게이트로 쓰는 GLU 구조 전체를 가리킨다. "SwiGLU 를 쓴다"는 것은 활성 함수 교체가 아니라 FFN 구조 자체를 게이트형으로 바꾼 것이다.'},
 {a:'게이트(gate)', b:'[attention](#/c/attention-c) 가중치', d:'둘 다 [0,1] 근처 값으로 무언가를 스케일링하지만, 게이트는 입력 그 자체의 선형 변환에서 나오고 같은 위치의 값을 걸러낸다. attention 가중치는 서로 다른 위치들 사이의 유사도에서 나오고 여러 위치의 값을 가중합하는 데 쓰인다.'}
],

pitfalls:[
 'GLU 변형을 도입하면서 은닉 차원을 그대로 두면 파라미터 수가 약 1.5배로 늘어난다는 것을 놓치기 쉽다 — 다른 모델과 파라미터 수를 맞춰 비교하려면 반드시 2/3 축소 관례를 확인해야 한다.',
 '원 논문조차 "왜 성능이 좋아지는지 확실한 이론은 없다"고 밝힌 경험적 개선이라는 점을 무시하고, SwiGLU 를 마치 이론적으로 증명된 최선의 선택처럼 서술하면 과장이다.',
 'GeGLU 와 SwiGLU 의 성능 차이를 활성 함수 선택 하나로 크게 좌우되는 것처럼 취급하지 마라 — 실무에서는 둘 다 표준 FFN 대비 이득이 있다는 정도의 차이지, 둘 사이 우열은 크지 않다.',
 '게이트 갈래($xV$)를 값 경로와 헷갈려 순서를 바꿔 구현하면(게이트에 활성 함수를 안 걸거나 값 쪽에 거는 식) 논문이 보고한 성능과 다른 결과가 나올 수 있으니 어느 투영에 활성 함수를 거는지 정확히 확인해야 한다.',
 '오픈소스 구현마다 $\\phi(xW)\\otimes xV$ 와 $\\phi(xV)\\otimes xW$ 처럼 게이트·값 변수명이 뒤바뀌어 있는 경우가 있으니, 논문 수식과 코드를 나란히 대조하지 않고 이름만 보고 옮겨 쓰면 안 된다.'
],

papers:['glu-variants','palm','llama'],
terms:['ffn','activation','transformer-block']
});
