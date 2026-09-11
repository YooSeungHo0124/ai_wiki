WIKI.paper({
slug:'convs2s',
venue:'ICML 2017',
authors:'Gehring, Auli, Grangier, Yarats, Dauphin (Facebook AI Research)',
arxiv:'1705.03122',

tldr:'인코더와 디코더를 **순환 없이 오직 합성곱만으로** 구성한 [seq2seq](#/p/seq2seq) 모델. GLU·residual·다층 attention으로 LSTM 기반 번역 모델보다 더 좋은 BLEU를 내면서 GPU에서 훈련·추론 모두 병렬화해 최대 한 자릿수(GPU 기준 최대 21.3배) 빠른 속도를 얻었다.',

context:'2017년 초의 표준 번역 아키텍처는 [LSTM](#/p/lstm) encoder–decoder에 [Bahdanau attention](#/p/bahdanau)을 얹은 형태([GNMT](#/p/gnmt) 등)였다. 문제는 RNN이 순차적이라는 것이다. $h_t$를 계산하려면 $h_{t-1}$이 끝나야 하므로 문장 길이만큼 스텝을 직렬로 밟아야 하고, 훈련도 추론도 GPU 병렬성을 온전히 못 쓴다. 합성곱은 이 순차성이 없어 병렬화가 쉽지만, 단일 합성곱 층은 커널 폭만큼의 좁은 문맥만 본다는 것이 걸림돌이었다. 이 논문은 합성곱 층을 깊게 쌓아 문맥을 넓히고, 거기에 GLU·residual·다층 attention을 더하면 대규모 번역 과제에서도 RNN을 대체할 수 있다는 것을 보인다.',

ideas:[
 {h:'층을 쌓아 합성곱의 좁은 시야를 넓힌다',
  lead:'커널 폭 $k$인 합성곱을 $n$층 쌓으면 유효 문맥이 $O(nk)$로 늘어난다.',
  d:'커널 폭 5인 합성곱 6층을 쌓으면 각 출력이 25개 입력 토큰 정보를 담게 된다. RNN은 문맥을 늘리려면 스텝 수(즉 시퀀스 길이 $n$)만큼 순차 연산이 필요하지만, 합성곱은 층을 쌓아 $O(n/k)$번의 연산으로 같은 범위를 커버하면서 층 간 연산은 전부 병렬로 처리된다. 멀리 떨어진 두 단어 관계도 하위 층에서 지역적으로, 상위 층에서 점점 넓게 결합되는 계층적 경로를 통해 전달된다.'},
 {h:'GLU: 합성곱 출력에 게이트를 씌운다',
  lead:'합성곱 출력을 반으로 나눠 한쪽을 시그모이드 게이트로 써서 나머지를 통과시킨다.',
  d:'커널 하나가 입력 $d$차원을 $2d$차원으로 매핑한 뒤 $Y=[A\\,B]$로 반을 가르고 $v([A\\,B])=A\\otimes\\sigma(B)$를 계산한다. $\\sigma(B)$가 "지금 문맥에서 $A$의 어느 부분이 중요한지"를 결정하는 게이트 역할을 한다. tanh 비선형보다 언어모델링에서 더 잘 작동한다는 것이 [Dauphin et al. 2016](https://arxiv.org/abs/1612.08083)의 결과이고, 이 논문은 그 GLU를 깊은 합성곱 seq2seq에 그대로 적용했다.'},
 {h:'절대 위치를 임베딩으로 더해 순서를 준다',
  lead:'단어 임베딩에 위치 임베딩을 더해서(학습 가능) 합성곱에 순서 정보를 준다.',
  d:'합성곱은 위치에 무관하게 같은 커널을 슬라이딩하므로 그 자체로는 절대 위치를 모른다. 그래서 입력 단어 임베딩 $w_j$에 학습되는 위치 임베딩 $p_j$를 더해 $e_j=w_j+p_j$로 만든다. [Transformer](#/p/transformer)가 이어받은 것이 바로 이 "위치는 아키텍처가 아니라 입력으로 준다"는 선택이다 — 다만 Transformer는 고정 sin/cos 함수를, 이 논문은 학습 파라미터를 쓴다.'},
 {h:'디코더 층마다 별도의 multi-step attention을 둔다',
  lead:'디코더의 각 층이 독립적으로 인코더를 다시 참조해 attention을 여러 번 반복한다.',
  d:'RNN 기반 attention은 보통 한 번만 계산하지만, 이 논문은 디코더의 층 $l$마다 그 층의 상태로 인코더 출력을 다시 조회한다. 첫 층의 attention이 유용한 소스 문맥을 찾아내면 다음 층은 그 정보를 반영해 다시 조회하는 식으로, memory network의 multi-hop과 비슷한 구조가 된다. attention 값을 계산할 때 인코더 출력 $z_j^u$뿐 아니라 입력 단어 임베딩 $e_j$도 더해 키-값을 분리하는데, 이는 인코더가 큰 문맥을 요약하는 동안 특정 위치의 구체적 정보를 잃지 않기 위해서다.'}
],

diagram:{type:'compare', cap:'RNN 기반 encoder-decoder와 ConvS2S의 핵심 차이.',
 left:{t:'RNN + attention', items:['시퀀스 길이만큼 순차 연산','문맥 확장에 $O(n)$ 스텝 필요','attention은 보통 한 번만 계산']},
 right:{t:'ConvS2S', items:['합성곱 전부 병렬 연산','층 쌓기로 문맥 $O(n/k)$에 확장','GLU 게이트 + residual','디코더 층마다 별도 attention']}},

math:[
 {expr:'v([A B]) = A ⊗ σ(B)',
  tex:'v([A\\,B])=A\\otimes\\sigma(B)',
  d:'GLU. 합성곱 출력 $Y=[A\\,B]\\in\\mathbb{R}^{2d}$를 반으로 갈라 $\\sigma(B)$를 게이트로 삼아 $A$를 통과시킨다. ReLU 계열보다 gradient 경로가 곧아 깊게 쌓기 쉽다.'},
 {expr:'a_ij = softmax_j( d_i · z_j )   (디코더 상태와 인코더 출력의 내적)',
  tex:'a_{ij}^{l}=\\frac{\\exp\\!\\left(d_i^{l}\\cdot z_j^{u}\\right)}{\\sum_{t=1}^{m}\\exp\\!\\left(d_i^{l}\\cdot z_t^{u}\\right)}',
  d:'디코더 층 $l$, 위치 $i$가 인코더 위치 $j$를 얼마나 볼지 정하는 attention 가중치. [Transformer](#/p/transformer)의 $QK^\\top$ softmax와 형태가 같다 — 다만 여기선 여러 디코더 층 각각이 독립적으로 이 계산을 반복한다.'},
 {expr:'c_i^l = Σ_j a_ij^l · (z_j^u + e_j)',
  tex:'c_i^{l}=\\sum_{j=1}^{m}a_{ij}^{l}\\,(z_j^{u}+e_j)',
  d:'조건 입력 $c_i^l$은 인코더 출력 $z_j^u$(요약된 문맥)와 입력 임베딩 $e_j$(구체적 위치 정보)를 더한 값을 attention 가중치로 합한 것. 이 합이 그대로 디코더 층 출력에 더해진다.'}
],

numbers:[
 {k:'WMT14 EN→DE BLEU', v:'26.43', d:'GNMT 우도학습(26.20)보다 우세, GNMT+RL(26.30)도 소폭 앞섬'},
 {k:'WMT14 EN→FR BLEU', v:'40.51 / 41.44(앙상블 없이도 우세)', d:'GNMT 우도학습(39.92) 대비 단일모델 +1.6 BLEU'},
 {k:'WMT16 EN→RO BLEU', v:'30.02', d:'BPE 인코딩 기준, 이전 SOTA 대비 +1.9 BLEU'},
 {k:'GPU 추론 속도', v:'최대 21.3배', d:'GTX-1080ti 기준, GNMT GPU(K80) 대비 (beam=1)'},
 {k:'CPU 추론 속도', v:'최대 9.3배', d:'48코어 기준, GNMT CPU(88코어) 대비'},
 {k:'EN→DE 모델 규모', v:'인코더 15층·디코더 15층', d:'커널 폭 3, 앞쪽은 은닉 512, 뒤로 갈수록 768·2048차원'}
],

impact:'이 논문은 "합성곱만으로도 attention 기반 번역이 가능하고, 심지어 더 빠르고 정확하다"는 것을 대규모 벤치마크로 증명하며 **RNN이 seq2seq의 유일한 선택지가 아님**을 각인시켰다. 그러나 합성곱은 여전히 커널 폭에 비례한 지역적 연산을 층으로 쌓아야 해서, 임의의 두 위치를 잇는 경로 길이가 $O(\\log_k n)$으로 남는다. 같은 해 나온 [Transformer](#/p/transformer)는 이 논문의 위치 임베딩·다층 attention·residual 규격은 그대로 가져오되, 합성곱 자체를 self-attention으로 바꿔 경로 길이를 $O(1)$로 줄였다 — ConvS2S가 놓은 "병렬화 가능한 seq2seq"라는 다리를 Transformer가 마저 건넌 셈이다.',

legacy:[
 '**[Transformer](#/p/transformer)의 직접적 전신** — 위치 임베딩을 입력에 더하는 방식, 여러 층에 attention을 반복하는 구조, residual+비선형 블록 규격을 그대로 물려받고 합성곱만 self-attention으로 교체',
 '**GLU의 확산** — 게이트형 비선형은 이후 여러 시퀀스·언어모델 아키텍처에서 재사용됨',
 '**"병렬화 가능한 seq2seq"라는 화두** — RNN의 순차성을 없애려는 시도(ByteNet 등)와 함께 이후 attention-only 아키텍처로 수렴하는 흐름의 한 갈래',
 '**합성곱 기반 시퀀스 모델링의 재조명** — [TCN](#/p/tcn) 등 합성곱으로 시퀀스를 다루는 후속 연구에 실증 근거를 제공'
],

pitfalls:[
 '**합성곱이 attention을 완전히 대체한 것은 아니다.** 이 논문도 여전히 (multi-step) attention을 쓴다 — "합성곱만으로"는 attention 없는 seq2seq라는 뜻이 아니라 **순환 연산이 없다**는 뜻이다.',
 '**경로 길이는 $O(1)$이 아니라 $O(\\log_k n)$이다.** 임의의 두 위치가 서로 영향을 주려면 여전히 층을 거쳐야 하며, 이 한계가 같은 해 [Transformer](#/p/transformer)가 self-attention으로 완전히 없애려 한 지점이다.',
 '**위치 임베딩은 고정 함수가 아니라 학습 파라미터다.** Transformer의 sin/cos 위치 인코딩과 혼동하기 쉬운데, 이 논문은 위치마다 학습되는 임베딩을 쓴다 — 학습 시 본 최대 길이를 넘는 시퀀스에 일반화하기 어렵다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽 아래가 디코더 입력, 왼쪽 위가 인코더 입력. 각 블록에서 합성곱(삼각형) → GLU(시그모이드·곱셈 기호) → residual(⊕)을 거친다. 가운데 색칠된 행렬이 디코더 상태와 인코더 출력의 내적(attention 점수, 노란색이 높은 가중치), 그 결과가 Σ로 가중합되어 디코더 다음 층으로 들어간다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'Compared to recurrent models, computations over all elements can be fully parallelized during training to better exploit the GPU hardware.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1705.03122 — Convolutional Sequence to Sequence Learning', u:'https://arxiv.org/abs/1705.03122'},
 {t:'Facebook AI: A novel approach to neural machine translation', u:'https://ai.meta.com/blog/a-novel-approach-to-neural-machine-translation/'}
]
});
