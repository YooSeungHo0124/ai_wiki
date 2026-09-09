WIKI.paper({
slug:'gqa',
venue:'EMNLP 2023',
authors:'Joshua Ainslie et al. (Google Research)',
arxiv:'2305.13245',

tldr:'[MQA](#/p/mqa)의 K·V 1벌과 MHA의 head마다 1벌 사이에 **$g$ 개 그룹**을 두는 중간항. 여기에 "이미 학습된 MHA 체크포인트를 원래 학습 연산의 5%만 더 써서 GQA로 갈아끼우는" uptraining 절차를 붙여, 새로 학습하지 않고도 전환할 수 있게 만들었다.',

context:'[MQA](#/p/mqa)는 KV 캐시를 head 수만큼 줄여 디코딩을 10배 이상 빠르게 했지만 두 가지 문제가 남았다. 첫째, **품질 저하**다. 원 논문의 번역 실험에서는 미미했지만 대형 모델에서는 무시하기 어려웠고 학습 불안정도 보고됐다. 둘째, **전환 비용**이다. 이미 수천 GPU-일을 들여 MHA로 학습해 둔 체크포인트를 MQA로 바꾸려면 처음부터 다시 학습해야 했다. 한편 [FlashAttention](#/p/flashattention)이 attention 커널의 IO 병목을 걷어내자, 긴 문맥 디코딩에서 남은 최대 병목은 다시 **KV 캐시를 HBM에서 읽어오는 시간**이 되었다. 이 논문은 두 문제를 한꺼번에 다룬다.',

ideas:[
 {h:'head를 그룹으로 묶고, 그룹마다 K·V 한 벌',
  lead:'Query head를 G개 그룹으로 묶어 그룹당 K·V 한 벌만 두는 MHA-MQA 사이 손잡이다.',
  d:'Query head $H$ 개를 $G$ 개 그룹으로 나누고, 같은 그룹의 head들이 하나의 K·V를 공유한다. $G=H$ 면 MHA, $G=1$ 이면 MQA다. 즉 GQA는 두 극단을 잇는 **연속적인 손잡이**이며, 논문의 기여는 새 메커니즘이 아니라 이 축의 중간이 실제로 좋은 지점이라는 실증이다. KV 캐시는 $H/G$ 배 줄어든다.'},
 {h:'Uptraining — 있는 체크포인트를 재사용한다',
  lead:'MHA의 K·V를 그룹별 평균 풀링하고 학습 연산의 5%만 추가 학습한다.',
  d:'MHA 체크포인트의 K·V 투영 행렬을 그룹별로 **평균 풀링**해 하나로 합친 뒤, 원래 사전학습 연산의 $\\alpha$ 배만큼만 추가 학습한다. 논문은 $\\alpha = 0.05$(5%)로 충분함을 보인다. 평균 풀링이 무작위 초기화나 한 head만 골라 쓰는 것보다 일관되게 낫다는 것이 ablation의 결론이다.'},
 {h:'그룹 수를 텐서 병렬 파티션 수에 맞춘다',
  lead:'그룹 수를 GPU 파티션 수와 맞춰 KV head 복제 낭비를 없앤다.',
  d:'MQA의 숨은 비용이 여기 있다. 모델을 $p$ 개 GPU로 쪼갤 때 KV head가 1개면 그 head를 **모든 파티션에 복제**해야 해서 실제 절감이 이론치보다 작다. 그룹 수를 파티션 수와 같게 잡으면 각 파티션이 자기 몫의 KV head를 정확히 하나씩 갖고, 복제 낭비가 사라진다. 논문이 $G=8$ 을 표준으로 제시한 이유는 순수 알고리즘이 아니라 **분산 학습 토폴로지**다.'},
 {h:'품질 곡선이 평평한 구간을 노린다',
  lead:'품질이 평평해지는 지점과 속도가 급격히 좋아지는 지점이 겹치는 G를 고른다.',
  d:'$G$ 를 1에서 $H$ 로 올릴 때 품질은 금방 MHA 수준으로 수렴하지만 속도는 $G$ 에 거의 반비례해 나빠진다. T5-XXL 실험에서 $G=8$ 은 MHA 대비 평균 점수 47.1 vs 47.2로 사실상 동일하면서 추론 시간은 0.28초 vs 1.51초다. **품질 곡선의 평평한 구간과 속도 곡선의 가파른 구간이 겹치는 지점**을 고르는 것이 GQA의 실무적 요령이다.'}
],

diagram:{type:'split', cap:'Query head는 그대로 두고 K·V만 묶는다. G를 1↔H로 움직이면 MQA와 MHA 사이 어디든 갈 수 있다.',
 from:{t:'입력 토큰 x', s:'d_model'},
 branches:[
  {t:'그룹 1', s:'Q head 1–4'},
  {t:'그룹 2', s:'Q head 5–8'},
  {t:'…'},
  {t:'그룹 8', s:'Q head 29–32'}
 ],
 join:'KV 캐시 = MHA의 1/4 (H=32, G=8) · 그룹 수 = 텐서 병렬 파티션 수'},

math:[
 {expr:'KV cache = 2 · b · n · G · d_head    (MHA: G=H,  MQA: G=1)',
  tex:'\\text{KV cache}=2bnGd_{\\text{head}}\\quad(\\text{MHA: }G{=}H,\\ \\text{MQA: }G{=}1)',
  d:'캐시 크기가 그룹 수에 정비례한다. $H=32, G=8$ 이면 4분의 1. 배치를 4배 키우거나 문맥을 4배 늘릴 수 있다는 뜻이며, 서빙 처리량은 대개 여기에 직결된다.'},
 {expr:'W_K^(group g) = mean( W_K^i : head i ∈ group g )',
  tex:'W_K^{(g)} = \\text{mean}\\big(W_K^{i} : i \\in \\text{group } g\\big)',
  d:'uptraining의 초기화. 그룹에 속한 head들의 K·V 투영 행렬을 평균한다. 무작위 초기화보다 훨씬 빠르게 회복되며, 이것이 5%라는 적은 추가 학습으로 되는 이유다.'}
],

numbers:[
 {k:'Uptraining 비율 α', v:'0.05', d:'원래 사전학습 연산의 5%. T5-XXL 기준 약 600 TPUv3 chip-day'},
 {k:'T5-XXL 추론 시간', v:'MHA 1.51s · GQA-8 0.28s · MQA 0.24s', d:'샘플당. GQA는 MQA 속도의 대부분을 가져온다'},
 {k:'T5-XXL 평균 점수', v:'MHA 47.2 · GQA-8 47.1 · MQA 46.6', d:'GQA는 MHA와 사실상 동률, MQA는 눈에 띄게 손실'},
 {k:'표준 그룹 수', v:'G = 8', d:'텐서 병렬 파티션 수와 맞춘 값'}
],

impact:'GQA는 논문의 새로움보다 **채택 속도**로 기억된다. 발표 직후 [Llama 2](#/p/llama2) 70B가 GQA를 채택했고, [Mistral 7B](#/p/mistral) 이후로는 사실상 모든 신규 오픈 LLM의 기본 구성이 되었다 — 소형 모델까지 포함해서다. 이유는 uptraining 절차 덕분에 **아키텍처 결정을 사후에 바꿀 수 있게** 되었기 때문이다. 그 전까지 "MHA냐 MQA냐"는 사전학습 시작 전에 되돌릴 수 없이 정해야 하는 선택이었지만, GQA 이후로는 학습이 끝난 뒤에도 서빙 예산에 맞춰 조정 가능한 손잡이가 됐다. 오늘날 오픈 LLM의 기본 골격 — [RoPE](#/p/rope) + GQA + [FlashAttention](#/p/flashattention) 커널 — 에서 이 논문이 담당하는 것은 KV 캐시 축이다.',

legacy:[
 '**사실상의 표준** — [Llama 2](#/p/llama2) 70B, [Mistral](#/p/mistral), [Mixtral](#/p/mixtral), Qwen, Gemma 등 이후 오픈 모델 대부분이 GQA를 기본으로 채택',
 '**KV 캐시 압축의 다음 단계** — [DeepSeek-V3](#/p/deepseek-v3)의 MLA는 K·V를 그룹으로 묶는 대신 저랭크 잠재 벡터 하나로 압축해, 같은 축을 더 밀어붙인 결과다',
 '**서빙 설계와의 결합** — 캐시가 작아지면 동시 요청을 더 올릴 수 있어 [vLLM](#/p/vllm)의 연속 배칭·페이징과 곱셈적으로 이득이 난다',
 '**아키텍처 사후 수정이라는 발상** — 평균 풀링 + 소량 추가 학습으로 구조를 바꾸는 uptraining 패턴은 이후 깊이·폭 축소, MoE 변환 등 다른 구조 변경에도 응용됐다'
],

pitfalls:[
 '**G를 줄이면 그만큼 빨라진다는 오해.** 속도 이득은 디코딩이 KV 캐시 대역폭에 묶여 있을 때만 나온다. 짧은 프롬프트, 작은 배치, prefill 위주 워크로드에서는 차이가 거의 없다.',
 '**품질 손실이 태스크마다 다르다.** 평균 점수는 MHA와 같아도, 긴 문맥 검색이나 세밀한 참조 해결처럼 head 다양성이 중요한 태스크에서는 GQA가 더 손해를 볼 수 있다. 평균 하나로 판단하지 않는 편이 좋다.',
 '**uptraining을 건너뛰면 안 된다.** MHA 가중치를 평균 풀링만 하고 추가 학습 없이 바로 쓰면 성능이 크게 떨어진다. 5%라는 수치는 "거의 공짜"라는 뜻이지 "생략 가능"이라는 뜻이 아니다.'
],

figures:[
 {f:'fig2-head-group-comparison.png',
  cap:'세 구조를 나란히 놓은 그림. 맨 아래 Queries 줄은 세 경우 모두 8개로 같다. 차이는 그 위 Keys·Values 줄의 개수뿐이다 — Multi-head는 query마다 자기 key/value를 하나씩 갖고(점선이 1대1), Multi-query는 모든 query가 key/value 단 1개를 공유하며(점선이 8대1로 모임), 가운데 Grouped-query는 query를 4묶음으로 나눠 묶음마다 key/value 하나씩(점선이 2대1)을 공유한다 — 두 극단 사이의 손잡이라는 것이 한 눈에 보인다.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'Grouped-query attention divides query heads into G groups, each of which shares a single key head and value head.',
  src:'Section 2.2, p.2'}
],

links:[
 {t:'arXiv 2305.13245 — GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints', u:'https://arxiv.org/abs/2305.13245'},
 {t:'arXiv 1911.02150 — MQA (전신)', u:'https://arxiv.org/abs/1911.02150'}
]
});
