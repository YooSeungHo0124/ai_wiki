WIKI.paper({
slug:'glam',
venue:'ICML 2022 (arXiv 2021)',
authors:'Du, Huang, Dai et al. (Google)',
arxiv:'2112.06905',

tldr:'1.2조 파라미터 MoE 언어모델이지만 토큰 하나당 실제로 켜지는 파라미터는 96.6B뿐이다. [GPT-3](#/p/gpt3)보다 few-shot 평균 점수가 높으면서 추론 FLOPs는 절반, 학습 에너지는 3분의 1이라는 것을 직접 대조해 보였다.',

context:'2021년 시점 few-shot의 기준은 [GPT-3](#/p/gpt3) — 175B 파라미터를 **전부** 활성화하는 dense decoder-only 모델이었다. 반면 [GShard](#/p/gshard)와 [Switch Transformer](#/p/switch)는 이미 MoE로 조 단위 파라미터를 다뤘지만, 둘 다 encoder-decoder 구조이고 fine-tuning 벤치마크(SuperGLUE 등) 중심으로 평가됐다. GPT-3식 in-context few-shot 평가에서 MoE가 dense와 같은 컴퓨트로 붙어본 적이 없었다는 공백이 있었다. GLaM은 "MoE를 decoder-only로 만들고 GPT-3와 똑같은 29개 벤치마크·같은 few-shot 프로토콜로 정면 비교하면 어떻게 되는가"를 묻는다.',

ideas:[
 {h:'격층 MoE: 두 층에 한 번만 교체',
  lead:'Transformer 층을 통째로 MoE로 바꾸지 않고 한 층 걸러 하나만 바꾼다.',
  d:'[GShard](#/p/gshard)와 같은 레시피로, 매 두 번째 Transformer 층의 FFN만 MoE 층으로 바꾼다. 나머지 절반은 일반 dense Transformer 층(attention + 단일 FFN)으로 남는다. 전부 MoE로 바꾸면 라우팅 오버헤드와 통신 비용이 커지는데, 절반만 바꿔도 용량 증가 효과는 충분하다는 것이 이들의 경험적 선택이다.'},
 {h:'top-2 gating: 64개 expert 중 2개만',
  lead:'토큰마다 softmax 게이팅으로 64개 expert 중 상위 2개만 골라 가중합한다.',
  d:'MoE 층마다 독립적인 FFN "expert"가 64개 있고, 학습되는 게이팅 네트워크가 입력 토큰에 대해 softmax 분포를 만들어 상위 2개 expert만 활성화한다. 나머지 62개는 그 토큰에 대해 아예 계산되지 않는다. expert 수를 늘릴수록 $O(E^2)$ 조합이 생겨 표현력은 늘지만 top-1이 아니라 top-2를 고른 것은 "성능과 서빙 효율의 트레이드오프"라고 저자들은 명시한다 — top-1만 쓰면 더 싸지만 성능이 떨어진다.'},
 {h:'파라미터 수와 계산량의 분리',
  lead:'nparams(총 파라미터)와 nact-params(토큰당 활성 파라미터)를 별개 지표로 명시한다.',
  d:'dense 모델은 정의상 `nparams = nact-params`라 파라미터를 늘리면 토큰당 FLOPs도 비례해서 늘어난다. MoE는 이 둘을 분리한다 — GLaM (64B/64E)는 `nparams=1.2T`지만 `nact-params=96.6B`(1.2T의 8%)이다. GPT-3(175B, dense)와 활성 파라미터가 비슷한 모델을 나란히 비교하는 것이 이 논문 실험 설계의 축이다.'},
 {h:'Transformer 뼈대도 같이 손봤다',
  lead:'절대 위치 임베딩 대신 relative positional bias, FFN엔 GLU+GELU를 쓴다.',
  d:'표준 sin/cos 위치 임베딩 대신 Dai et al.(Transformer-XL)의 층별 relative positional bias를 쓰고, dense 층의 FFN 첫 선형변환+활성화 자리를 Gated Linear Unit(입력의 두 선형변환을 성분곱한 뒤 GELU)으로 바꿨다. MoE 구조와는 별개로, 이런 부품 교체가 성능에 얼마나 기여했는지는 논문이 개별 ablation으로 분리해 보이지 않는다.'},
 {h:'데이터 품질이 스케일만큼 중요하다',
  lead:'1.6조 토큰 중 품질 필터를 통과한 143B 토큰짜리 부분집합이 더 나은 성능을 낸다.',
  d:'원시 웹페이지 약 7조 토큰에 텍스트 품질 분류기(Wikipedia·책 등 고품질 텍스트 vs 나머지로 학습)를 적용해 Pareto 분포로 샘플링, 143B 토큰짜리 고품질 부분집합을 걸러낸다. 이 필터링된 데이터로 학습한 모델이 NLG·NLU 모두에서, 특히 생성형(NLG) 과제에서 더 나은 성능을 낸다.'}
],

diagram:{type:'split', cap:'MoE 층 하나. 토큰마다 게이팅이 64개 expert 중 2개만 골라 가중합하고, 그 결과가 다음 Transformer 층으로 올라간다.',
 from:{t:'토큰 임베딩', s:'격층마다'},
 branches:[
  {t:'Gating', s:'softmax', acc:true},
  {t:'Expert 1', s:'FFN'},
  {t:'Expert 2', s:'FFN'},
  {t:'Expert 3…64', s:'선택 안 됨', off:true}
 ],
 join:'top-2 가중합 → 다음 층'},

math:[
 {expr:'g(x) = softmax(x · W_g),  선택 = top-2(g(x))',
  tex:'g(x)=\\text{softmax}(x\\cdot W_g),\\qquad \\text{selected experts} = \\text{top-}2\\big(g(x)\\big)',
  d:'게이팅 네트워크가 입력 $x$에 대해 64개 expert 위의 확률분포 $g(x)$를 만들고, 그중 값이 큰 상위 2개만 골라 그 확률을 가중치로 두 expert의 출력을 섞는다.'},
 {expr:'y = Σ_{i ∈ top2} g(x)_i · FFN_i(x)',
  tex:'y = \\sum_{i\\,\\in\\,\\text{top2}} g(x)_i \\cdot \\text{FFN}_i(x)',
  d:'최종 출력은 선택된 두 expert 출력의 게이팅 확률 가중합. 나머지 62개 expert는 이 토큰에 대해 forward도 backward도 계산되지 않으므로, 파라미터는 1.2T여도 토큰당 실제 곱셈-누산은 훨씬 작은 부분집합에서만 일어난다.'}
],

numbers:[
 {k:'총 파라미터', v:'1.2T', d:'GLaM (64B/64E), 격층 MoE·64 expert 구성'},
 {k:'토큰당 활성 파라미터', v:'96.6B', d:'1.2T의 8% — `n_act-params`. GPT-3(175B, 전부 활성)의 절반 수준'},
 {k:'추론 FLOPs/토큰', v:'180G vs 350G', d:'GPT-3 대비 **−48.6%**, 즉 절반가량'},
 {k:'학습 에너지', v:'456 MWh vs 1287 MWh', d:'GPT-3 대비 **−64.6%**(약 1/3 수준), 원문 Table 1·Abstract의 "1/3" 표현과 일치'},
 {k:'few-shot 평균 정확도', v:'68.1 vs 65.2', d:'GPT-3 대비 **+4.4%p**, 29개 NLP 벤치마크(NLG 8 + NLU 21) 평균'},
 {k:'TriviaQA one-shot', v:'75.0', d:'오픈도메인 테스트 서버 기준, GPT-3 few-shot(71.2)을 **+5.3%** 앞섬'}
],

impact:'GLaM은 "MoE가 dense보다 늘 fine-tuning에서만 유리하다"는 인식을 깨고, **같은 계산 예산에서 MoE가 GPT-3식 few-shot에서도 더 낫다**는 것을 처음 정면으로 보였다. `n_params`와 `n_act-params`를 분리해 보고하는 관행이 이후 MoE 논문들의 표준 표기가 됐고, 에너지·탄소 비용을 학습 비용 비교의 정식 축으로 끌어올렸다(Patterson et al. 2021 탄소발자국 연구와 같은 문제의식). GLaM 자체는 오픈소스로 공개되지 않았지만, 이 결과가 이후 [Mixtral](#/p/mixtral) 같은 공개 top-k MoE 모델들이 "MoE가 fine-tuning뿐 아니라 범용 챗봇 성능에서도 이긴다"고 주장할 근거를 먼저 깔아 두었다.',

legacy:[
 '**decoder-only MoE few-shot 비교의 표준 프레임** — 이후 MoE 논문들이 `n_params` vs `n_act-params`, 그리고 "GPT-3와 같은 활성 파라미터·다른 총 파라미터" 비교표를 거의 그대로 따라 씀',
 '**학습 에너지·탄소를 정량 지표로** — FLOPs뿐 아니라 MWh·tCO2e를 정면에 내세운 보고 방식이 이후 대형 모델 발표의 관행이 됨',
 '**top-2 게이팅의 재확인** — [Mixtral](#/p/mixtral) 등 이후 공개 MoE 모델들이 같은 top-2 라우팅을 채택하며 사실상 기본값으로 굳어짐',
 '**격층 MoE 배치** — 모든 층이 아니라 절반만 MoE로 바꾸는 절충이 이후 대규모 MoE 설계에서 반복됨'
],

pitfalls:[
 '**"에너지 1/3"과 "FLOPs 절반"은 서로 다른 축이다.** 학습 에너지 456 MWh vs 1287 MWh(약 1/3)는 **학습** 비용 비교이고, FLOPs/토큰 180G vs 350G(약 절반)는 **추론** 비용 비교다. 같은 숫자로 섞어 인용하면 틀린다.',
 '**1.2T는 총 파라미터지 "쓰는" 파라미터가 아니다.** 토큰 하나 처리에 실제로 관여하는 것은 96.6B뿐이며, 나머지는 다른 토큰·다른 라우팅에서만 쓰인다. "GLaM이 GPT-3보다 7배 큰 모델"이라는 서술은 총 파라미터 기준일 뿐 서빙 비용 기준이 아니다.',
 '**GLaM은 가중치가 공개되지 않았다.** [Switch Transformer](#/p/switch)나 [Mixtral](#/p/mixtral)과 달리 재현·파인튜닝 가능한 체크포인트가 없어, 수치는 논문 표를 통해서만 확인 가능하다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'아래 회색 블록이 MoE 층, 위 회색 블록이 일반 Transformer 층 — 격층으로 교대. MoE 층 안 파란 격자가 64개 expert, 녹색 Gating이 토큰마다 그중 2개(파란 FFN 박스 2개)를 골라 가중합해 위로 올려보낸다. 다음 토큰에서는 다른 2개가 선택될 수 있다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'It consumes only 1/3 of the energy used to train GPT-3 and requires half of the computation flops for inference, while still achieving better overall zero, one and few-shot performance across 29 NLP tasks.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2112.06905 — GLaM', u:'https://arxiv.org/abs/2112.06905'},
 {t:'Google AI Blog — More Efficient In-Context Learning with GLaM', u:'https://ai.googleblog.com/2021/12/more-efficient-in-context-learning.html'}
]
});
