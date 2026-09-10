WIKI.paper({
slug:'glu-variants',
venue:'arXiv 2020 (Noam Shazeer, Google)',
authors:'Noam Shazeer (Google)',
arxiv:'2002.05202',

tldr:'`Transformer` FFN의 활성함수 자리에 Gated Linear Unit(GLU) 계열을 넣으면 좋아진다는 것을 실험으로 확인한 짧은 논문. 그중 **SwiGLU**가 `[LLaMA](#/p/llama)`·`[Qwen2](#/p/qwen2)`·`[Mistral](#/p/mistral)`을 비롯한 오늘날 거의 모든 오픈 언어모델의 FFN 표준이 됐다.',

context:'`[Transformer](#/p/transformer)`의 position-wise FFN은 `max(0, xW₁)W₂` 형태로, 두 개의 선형변환 사이에 ReLU 하나를 끼운 것이 전부였다. 이후 `GELU`, `Swish` 같은 매끄러운 활성함수로 ReLU를 교체하는 시도는 있었지만, 모두 "선형변환 → 비선형 → 선형변환"이라는 **두 행렬** 구조는 그대로였다. 한편 별개 계열로 [Dauphin et al. 2016]의 Gated Linear Unit(GLU)이 있었다 — 입력을 두 개로 각각 선형변환한 뒤 하나는 시그모이드를 거쳐 게이트로 쓰고 나머지와 원소별로 곱하는, **세 행렬** 구조다. 이 논문은 단순한 질문 하나를 던진다. **GLU와 그 변형들을 FFN의 활성함수 자리에 그냥 넣어보면 어떻게 되는가?**',

ideas:[
 {h:'GLU 계열을 activation이 아니라 layer로 취급한다',
  lead:'시그모이드 게이트의 비선형 함수를 ReLU·GELU·Swish로 바꿔가며 5가지 변형을 만든다.',
  d:'원래 GLU는 `σ(xW+b) ⊗ (xV+c)` 로 시그모이드 게이트 하나를 곱하는 층이다. 이 논문은 게이트에 쓰는 비선형 함수를 바꿔 `ReGLU`(ReLU), `GEGLU`(GELU), `SwiGLU`(Swish), 그리고 비선형을 아예 뺀 `Bilinear`까지 다섯 변형을 정의한다. 공통점은 항상 **두 갈래로 선형변환한 뒤 원소별 곱**이라는 구조뿐이다.'},
 {h:'FFN 전체를 GLU 변형으로 교체한다',
  lead:'FFN의 첫 선형변환+활성함수 자리를 통째로 GLU 계열로 바꿔 넣는다.',
  d:'기존 FFN은 `W₁, W₂` 두 행렬을 쓴다. GLU 계열 FFN은 `W, V, W₂` 세 행렬을 쓴다 — 입력을 `W`와 `V`로 각각 투영해 하나는 게이트로, 하나는 값으로 곱한 뒤 `W₂`로 다시 투영한다. 행렬이 하나 늘어난 만큼, 은닉 차원 $d_{ff}$ 를 3072에서 2048로 줄여(약 32분의 1이 아니라 3분의 2 비율) 파라미터 수와 연산량을 원래 FFN과 동일하게 맞췄다.'},
 {h:'T5 사전학습·미세조정 파이프라인 그대로 비교한다',
  lead:'새 벤치마크를 만들지 않고 T5의 학습 코드·데이터·과제 그대로 활성함수만 바꿔 비교한다.',
  d:'`[T5](#/p/t5)` base 모델(encoder·decoder 각 12층, $d_{model}=768$)을 그대로 가져와 C4 데이터셋의 span-filling 사전학습, 이어서 SQuAD·GLUE·SuperGLUE 미세조정까지 동일한 절차로 8가지 FFN 변형을 돌렸다. 변수를 활성함수 하나로 고정한 깨끗한 대조 실험이다.'},
 {h:'결과는 나오지만 이유는 모른다고 솔직히 말한다',
  lead:'GEGLU·SwiGLU가 꾸준히 더 낮은 perplexity를 보이지만 원인은 설명하지 않는다.',
  d:'사전학습 perplexity와 대부분의 다운스트림 과제에서 GEGLU·SwiGLU가 ReLU·GELU·Swish 기반 FFN을 앞섰다. 그러나 저자는 결론에서 이 성공을 설명할 이론적 근거를 제시하지 않고, 다른 모든 경험적 성공과 마찬가지로 **"신의 은총"** 덕으로 돌린다고 농담처럼 적었다.'}
],

diagram:{type:'compare', cap:'기존 FFN은 활성함수 하나로 비선형을 주지만, GLU 계열은 게이트로 곱해 정보를 통과시킨다.',
 left:{t:'기존 FFN', items:['행렬 2개(W1, W2)','ReLU/GELU 활성함수 1개','x → 선형 → 비선형 → 선형']},
 right:{t:'GLU 계열 FFN', items:['행렬 3개(W, V, W2)','게이트 ⊗ 값의 원소별 곱','파라미터 맞추려 은닉차원 축소']}},

math:[
 {expr:'FFN_ReLU(x, W1, W2) = max(xW1, 0) W2',
  tex:'\\text{FFN}_{\\text{ReLU}}(x,W_1,W_2)=\\max(xW_1,\\,0)\\,W_2',
  d:'`Transformer` 원본 FFN(bias 생략 버전). 행렬 두 개와 활성함수 하나로 이뤄진 기존 구조.'},
 {expr:'SwiGLU(x, W, V, b, c, β) = Swish_β(xW + b) ⊗ (xV + c)',
  tex:'\\text{SwiGLU}(x,W,V,b,c,\\beta)=\\text{Swish}_\\beta(xW+b)\\otimes(xV+c)',
  d:'게이트 쪽에 Swish($x\\sigma(\\beta x)$)를 쓰는 GLU 변형. $\\otimes$ 는 원소별(element-wise) 곱이다. $\\beta=1$ 로 고정한 것이 실무 표준 SwiGLU.'},
 {expr:'FFN_SwiGLU(x, W, V, W2) = (Swish1(xW) ⊗ xV) W2',
  tex:'\\text{FFN}_{\\text{SwiGLU}}(x,W,V,W_2)=\\left(\\text{Swish}_1(xW)\\otimes xV\\right)W_2',
  d:'SwiGLU를 FFN 전체에 적용한 최종형. 행렬이 3개(W, V, W2)로 늘어난 만큼 은닉 차원을 줄여 파라미터·연산량을 기존 FFN과 맞춘다.'}
],

numbers:[
 {k:'사전학습 log-perplexity(524,288 step)', v:'ReLU 1.677 → SwiGLU 1.636', d:'GEGLU가 가장 낮은 1.633, SwiGLU가 근소한 차이로 2위'},
 {k:'GLUE 평균', v:'83.80(ReLU) → 84.67(ReGLU)', d:'8개 변형 중 ReGLU가 최고, SwiGLU 84.36으로 근소 차'},
 {k:'SuperGLUE 평균', v:'72.76(ReLU) → 74.56(SwiGLU)', d:'SwiGLU가 8개 변형 중 최고'},
 {k:'SQuAD v1.1 F1', v:'90.87(ReLU) → 91.18(ReGLU)', d:'GEGLU 91.12, SwiGLU 91.03도 근접'},
 {k:'FFN 은닉 차원', v:'3072(기존) → 2048(GLU 계열)', d:'행렬이 2개→3개로 늘어난 만큼 축소해 파라미터·연산량 동일하게 유지'},
 {k:'모델 규모', v:'T5-base, 12+12층, d_model=768', d:'대형 모델이 아닌 base 크기에서의 대조 실험'}
],

impact:'이 논문 자체는 화려한 결과 없이 "여러 변형 중 GEGLU·SwiGLU가 대체로 낫다"는 담백한 보고서였지만, 몇 년 뒤 `[LLaMA](#/p/llama)`가 FFN에 SwiGLU를 채택하면서 상황이 완전히 바뀌었다. LLaMA의 성공 이후 SwiGLU는 `[Qwen2](#/p/qwen2)`, `[Mistral](#/p/mistral)`을 비롯해 사실상 모든 주요 오픈소스 LLM의 기본 FFN 구성이 되었고, 원 논문이 스스로 "이유를 모르겠다"고 인정했던 개선이 업계 표준으로 굳어진 드문 사례가 됐다.',

legacy:[
 '**LLaMA 계열의 기본값** — `LLaMA`, `LLaMA 2`, `Qwen2`, `Mistral` 등 2023년 이후 공개된 주요 디코더 전용 모델 대부분이 FFN에 SwiGLU를 사용',
 '**"세 행렬 FFN"이 표준 관행으로 정착** — $d_{ff}$ 를 줄여 파라미터를 맞추는 이 논문의 관례(보통 $8/3 \\cdot d_{model}$ 근방)가 그대로 이어짐',
 '**활성함수 탐색 연구의 재현 가능한 모범 사례** — 변수 하나만 바꾸는 깨끗한 대조 실험 설계가 이후 아키텍처 소거 연구(ablation)의 참고가 됨',
 '저자 Noam Shazeer는 `[Transformer](#/p/transformer)`·`[MoE](#/p/moe-shazeer)`에 이어 이 논문으로 FFN 설계까지, 현대 LLM 블록의 거의 모든 구성 요소에 관여함'
],

pitfalls:[
 '**"SwiGLU가 이 논문에서 최고 성능이었다"는 정확하지 않다.** 표를 보면 과제별로 최고 성능 변형이 갈린다 — GLUE는 ReGLU, SuperGLUE는 SwiGLU, 사전학습 perplexity는 GEGLU가 근소하게 앞선다. SwiGLU의 승리는 이후 LLaMA의 채택과 업계 관행이 만든 것이지, 이 논문 자체가 SwiGLU 하나를 승자로 지목한 것은 아니다.',
 '**"신의 은총" 문구는 저자의 자조적 농담이지, 실제로 원리가 미스터리라는 학계 정설은 아니다.** 이후 연구들이 게이팅이 표현력·최적화 지형에 주는 영향을 부분적으로 설명하려 시도했다.',
 '**연산량이 "그대로"라는 말은 근사치다.** 은닉 차원을 조정해 파라미터·FLOPs를 맞췄지만, 행렬 3개로 인한 메모리 접근 패턴·구현 효율성 차이까지 완전히 동일하지는 않다.'
],

quotes:[
 {t:'We offer no explanation as to why these architectures seem to work; we attribute their success, as all else, to divine benevolence.',
  src:'Conclusions, p.3'},
 {t:'We test these variants in the feed-forward sublayers of the Transformer sequence-to-sequence model, and find that some of them yield quality improvements over the typically-used ReLU or GELU activations.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2002.05202 — GLU Variants Improve Transformer', u:'https://arxiv.org/abs/2002.05202'},
 {t:'Language Modeling with Gated Convolutional Networks (원조 GLU, Dauphin et al. 2016)', u:'https://arxiv.org/abs/1612.08083'}
]
});
