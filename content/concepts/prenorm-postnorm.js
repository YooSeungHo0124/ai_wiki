WIKI.concept({
slug:'prenorm-postnorm',

tldr:'[LayerNorm](#/c/layernorm-c)을 sub-layer 뒤에 두면(Post-LN) 원 Transformer 처럼 표현력은 좋지만 워밍업 없이는 발산하고, sub-layer 안쪽에 두면(Pre-LN) 잔차 경로가 정규화를 우회해 훨씬 안정적으로 학습된다.',

why:'대형 모델을 밑바닥부터 학습해 보면 warmup 스케줄이 왜 그렇게 예민한지, 왜 최신 LLM 은 거의 다 Pre-LN 인지, 그런데도 왜 일부 최신 모델은 Post-LN 이나 두 방식을 섞은 변형으로 돌아가는지를 이 배치 하나의 차이가 설명한다. 이걸 모르면 "층을 더 쌓았더니 loss 가 NaN 이 됐다"는 흔한 사고를 워밍업 늘리기 말고는 디버깅할 방법이 없다.',

sections:[
 {h:'원조는 Post-LN', d:'[Transformer](#/p/transformer) 원 논문의 sub-layer 는 $\\text{LN}(x+\\text{Sublayer}(x))$ — 잔차를 먼저 더한 뒤에 그 합을 LayerNorm 에 통과시키는 **Post-LN** 이었다. 문제는 층을 깊게 쌓을수록 이 방식이 학습 초반에 극도로 불안정해서, 학습률을 아주 작은 값에서 서서히 올리는 **warmup** 없이는 발산(loss 가 NaN 으로 튀는 것)하기 일쑤였다는 점이다. 원 논문의 학습률 스케줄이 warmup + 역제곱근 감쇠라는 복잡한 형태를 취한 것도 이 불안정성을 다스리기 위해서였다. 층이 6개 정도로 얕았던 원 논문에서는 이 문제가 warmup 몇 천 스텝으로 다스려질 정도였지만, 이후 모델이 수십~수백 층으로 깊어지면서 같은 문제가 훨씬 다루기 어려운 형태로 재발했다.'},
 {h:'Pre-LN 의 원리', d:'Pre-LN 은 순서를 바꿔 $x+\\text{Sublayer}(\\text{LN}(x))$ 로 쓴다 — LayerNorm 을 sub-layer **입력**에 적용하고, [잔차 연결](#/c/residual)은 정규화되지 않은 $x$ 를 그대로 더한다. 이러면 [residual](#/c/residual) 문서에서 본 "$x_0$ 가 모든 층을 그대로 관통하는 지름길"이 정규화 연산에 전혀 가로막히지 않는다 — 역전파 시 $\\partial x_L/\\partial x_0$ 에 남는 항등 성분(1)이 LayerNorm 의 스케일링에 의해 매 층마다 늘어나거나 줄어들지 않는다. 그 결과 층을 훨씬 깊게 쌓아도, 그리고 warmup 을 거의 없애거나 짧게 줘도 학습이 안정적으로 시작된다. 최근 분석들은 이걸 "각 sub-layer 의 야코비안 노름이 초기화 시점에 층 깊이와 거의 무관하게 유지된다"는 식으로 정량화하기도 한다.'},
 {h:'대신 무엇을 잃는가', d:'Pre-LN 은 안정성의 대가로 표현력 손실을 겪는다는 것이 여러 분석의 공통된 결론이다. 잔차가 정규화 없이 계속 누적되므로 층을 지날수록 residual stream 의 분산(scale)이 커지는데, 이는 결과적으로 각 sub-layer 의 출력이 전체 표현에서 차지하는 상대적 영향력이 층이 깊어질수록 작아지는 효과를 낸다 — 깊은 층일수록 "미세 조정"만 하는 셈이 되어 사실상의 유효 깊이(effective depth)가 이름만큼 깊지 않다는 지적이 있다. 실제로 같은 층 수라면 Post-LN 이 (학습만 안정적으로 시킬 수 있다면) 더 높은 성능을 낸다는 보고도 있어, "Pre-LN 이 항상 더 좋다"는 것은 아니다.'},
 {h:'절충 시도', d:'이 트레이드오프 때문에 안정성과 표현력을 둘 다 취하려는 변형이 계속 나왔다. 대표적으로 [GPT-2](#/p/gpt2) 는 Pre-LN 을 채택했고, 이후 연구들은 sub-layer 출력에 작은 스케일 계수를 곱하거나(예: 마지막 프로젝션 가중치를 층 수에 반비례해 초기화) Post-LN 의 안정성 문제를 다른 방식으로 해결하려 했다. "Pre-LN 대 Post-LN" 논쟁은 지금도 완전히 끝나지 않았고, 실무적으로는 처음 학습하는 대형 모델이라면 Pre-LN(또는 그 변형)을 기본값으로 놓는 것이 안전하다.'},
 {h:'실무에서', d:'수십~수백 층을 처음부터 학습하는 대형 LLM 은 거의 전부 Pre-LN 계열이다(GPT-2 이후 GPT 계열, LLaMA 등). 반대로 층 수가 얕고 안정성보다 최종 성능이 중요한 세팅에서는 Post-LN 이 여전히 고려 대상이다. 학습 초반에 loss 가 튀거나 NaN 이 나오면 (1) warmup 스텝이 너무 짧은지, (2) LayerNorm 이 Post-LN 위치에 있는지부터 확인하는 것이 표준적인 디버깅 순서다.'}
],

math:[
 {tex:'\\text{Post-LN}:\\ x_{l+1}=\\text{LN}\\big(x_l+\\text{Sublayer}(x_l)\\big)',
  expr:'post-normalization', d:'sub-layer 출력을 잔차와 더한 **뒤에** 정규화한다. 다음 층으로 넘어가는 $x_{l+1}$ 자체가 항상 정규화된 값이라는 장점이 있지만, 역전파 경로에 매 층 LayerNorm 의 야코비안이 곱해져 깊이가 커지면 그 곱이 불안정해질 수 있다.'},
 {tex:'\\text{Pre-LN}:\\ x_{l+1}=x_l+\\text{Sublayer}\\big(\\text{LN}(x_l)\\big)',
  expr:'pre-normalization', d:'정규화는 sub-layer **안으로 들어가는 입력**에만 적용되고, 바깥의 잔차 덧셈 $x_l+(\\cdot)$ 은 정규화되지 않은 $x_l$ 을 그대로 쓴다. 역전파 시 $\\partial x_{l+1}/\\partial x_l$ 에는 항상 항등(identity) 항이 그대로 남는다.'}
],

diagram:{type:'compare', cap:'LayerNorm 을 sub-layer 안쪽(Pre)에 두느냐 바깥쪽(Post)에 두느냐.',
 left:{t:'Post-LN(원조)', items:['LN(x+Sublayer(x))','표현력 우수','워밍업 없이 발산 위험','깊이 확장에 취약']},
 right:{t:'Pre-LN', items:['x+Sublayer(LN(x))','학습 안정적','짧은 워밍업으로도 수렴','유효 깊이 손실 지적']}},

confuse:[
 {a:'Pre-LN', b:'Post-LN', d:'같은 LayerNorm 을 어디에 배치하는가의 차이다. Pre-LN 은 sub-layer 입력에, Post-LN 은 잔차를 더한 다음 결과에 적용한다.'},
 {a:'warmup', b:'learning rate decay', d:'warmup 은 학습 극초반에 학습률을 0 근처에서 목표값까지 서서히 올리는 것이고, decay 는 그 이후 학습률을 서서히 낮추는 것이다. Post-LN Transformer 가 특히 warmup 에 민감한 이유는 초반 몇 스텝의 큰 gradient 가 불안정한 정규화 통계와 만나 발산을 일으키기 쉽기 때문이다.'},
 {a:'Pre-LN 의 표현력 손실', b:'경사 소실(vanishing gradient)', d:'Pre-LN 이 잃는 것은 경사가 사라지는 문제가 아니라 — 오히려 [residual](#/c/residual) 경로 덕분에 경사는 잘 흐른다 — 층이 깊어질수록 각 sub-layer 가 전체 표현에 기여하는 상대적 비중이 작아지는 표현력 문제다. 서로 다른 실패 모드다.'}
],

pitfalls:[
 '"Pre-LN 이 Post-LN 보다 항상 더 좋은 방식"이라고 단정하면 안 된다 — 안정성과 표현력의 트레이드오프이고, 같은 깊이에서 둘 다 안정적으로 학습시킬 수 있다면 Post-LN 이 더 나은 성능을 보인 사례들이 있다.',
 'Post-LN 모델에서 warmup 을 줄이거나 없애고 "왜 이렇게 학습이 불안정하지"라고 묻는 것은 원인과 증상을 거꾸로 짚은 것이다 — Post-LN 의 알려진 특성이다.',
 '다음 층으로 넘어가는 activation 의 스케일이 Pre-LN 에서는 층이 깊어질수록 계속 커진다는 점을 잊으면, 왜 마지막에 최종 LayerNorm 을 한 번 더 추가로 두는지(final LN) 이해하기 어렵다.'
],

papers:['transformer','gpt2'],
terms:['layernorm-c','residual','gradient-problem','transformer-block']
});
