WIKI.paper({
slug:'falcon-h1',
venue:'Technical Report 2025 (TII)',
authors:'TII (Technology Innovation Institute)',
arxiv:'2507.22448',

tldr:'attention 헤드와 [Mamba-2](#/p/mamba2) 헤드를 같은 입력에 대해 **병렬로** 돌리고 출력을 concat하는 하이브리드 블록. 0.5B~34B까지 7개 크기로 공개했고, 두 헤드 종류의 채널 비율을 독립적으로 조정할 수 있는 자유도를 체계적으로 탐색해 34B 모델이 절반 크기로 70B급 모델과 경쟁하는 성능을 냈다고 보고한다.',

context:'SSM과 attention을 섞는 하이브리드 설계는 대개 **직렬(sequential)** 방식이었다 — 어떤 레이어는 attention, 어떤 레이어는 SSM으로 하고 이를 번갈아 쌓는([Nemotron-H](#/p/nemotron-h) 등) 식이다. 이 경우 "어느 레이어를 무엇으로 할지"는 결정할 수 있어도, **한 레이어 안에서 두 메커니즘을 얼마나 섞을지**는 정하기 어렵다. Falcon-H1은 직렬 대신 **병렬(parallel)** 통합을 택해, 레이어 단위가 아니라 채널 단위로 attention과 SSM의 비율을 조정할 수 있는 자유도를 만든다.',

ideas:[
 {h:'병렬 하이브리드 블록: 같은 입력을 SSM과 attention에 동시에',
  lead:'입력 투영 후 SSM 경로와 attention 경로가 동시에 돌고, 두 출력을 concat해 출력 투영에 넣는다.',
  d:'RMSNorm을 거친 입력을 한 번의 input projection으로 SSM용(gate·input·B·C·discretization) 성분과 attention용(Q·K·V) 성분으로 나눠 만든다. SSM과 attention은 **서로 다른 입력을 순차적으로 거치는 것이 아니라 같은 시점에 병렬로** 계산되고, 그 결과를 concat한 뒤 하나의 output projection을 통과시킨다. 이전 병렬 설계([Dong et al. 2024])는 두 출력을 평균 내 차원이 같아야 했지만, Falcon-H1은 concat이라 **차원이 달라도 된다**.'},
 {h:'채널 배분: 레이어 단위가 아니라 채널 단위로 attention/SSM 비율 결정',
  lead:'전체 채널을 8청크로 나눠 SSM·attention·MLP에 자유롭게 배분하고, 이 비율 자체를 그리드 탐색한다.',
  d:'$d_{ssm}=\\alpha_S\\times 4096$, $d_{attn}=\\alpha_A\\times 6144$, $d_{MLP}=\\alpha_M\\times 4864$로 파라미터화해 $(\\alpha_S,\\alpha_A,\\alpha_M)$의 21가지 가능한 조합을 300M~1.5B 규모 proxy 모델에서 훑었다. 결과: **attention 채널을 늘리면 성능이 뚜렷하게 나빠지고**, SSM↔MLP 채널을 바꾸는 효과는 그보다 훨씬 약하다 — attention은 소량만 정밀도 유지용으로 남기고 SSM이 대부분의 일을 하게 하는 것이 유리하다는 근거다.'},
 {h:'SAM 블록 배치: 완전 병렬이 순차·반병렬보다 우수',
  lead:'SSM·Attention·MLP를 완전 병렬(SAM)로 배치하는 것과 순차·반병렬 배치를 비교해 완전 병렬을 택한다.',
  d:'완전 병렬(SAM: SSM·Attention·MLP 모두 병렬), 반병렬(SSM+Attention만 병렬, MLP는 분리), 완전 순차 세 가지 블록 배치를 깊은(L=60) 모델에서 비교했다. 채널 배분 탐색과 함께 진행한 이 비교에서 SAM 완전 병렬 구성이 가장 나은 손실을 보였다.'}
],

diagram:{type:'compare', cap:'직렬(레이어 단위 교차) 하이브리드와 Falcon-H1의 병렬(채널 단위) 하이브리드 비교.',
 left:{t:'직렬 하이브리드', items:['레이어마다 SSM 또는 attention','레이어 비율로만 조정','채널 단위 배분 불가']},
 right:{t:'Falcon-H1 (병렬)', items:['한 레이어 안에서 동시 계산','채널 단위로 비율 조정','concat이라 차원 자유도 있음']}},

math:[
 {expr:'d_ssm = α_S × 4096,  d_attn = α_A × 6144,  d_MLP = α_M × 4864',
  tex:'d_{\\text{ssm}}=\\alpha_S\\times 4096,\\quad d_{\\text{attn}}=\\alpha_A\\times 6144,\\quad d_{\\text{MLP}}=\\alpha_M\\times 4864',
  d:'채널 배분 실험의 파라미터화. $\\alpha_S,\\alpha_A,\\alpha_M$을 8청크 안에서 조합해 SSM·attention·MLP 각각에 배정되는 채널 수를 결정한다. 기준 비율 4096:6144:4864 ≈ 2:3:2.375는 각 블록의 파라미터 수를 대략 맞추도록 고른 값이다.'}
],

numbers:[
 {k:'모델 라인업', v:'0.5B / 1.5B / 1.5B-Deep / 3B / 7B / 34B', d:'전부 공개, bfloat16 및 양자화 버전 함께 제공'},
 {k:'34B 학습 토큰', v:'약 18T', d:'72층, d_model 5120, attn 20Q/4KV헤드+SSM 32헤드(Table 1)'},
 {k:'문맥 길이', v:'최대 256K', d:'7B·34B 모델 기준, 소형 모델은 16K~128K'},
 {k:'채널 배분 탐색 규모', v:'300M~1.5B proxy 모델, 21개 (α_S,α_A,α_M) 조합', d:'L=60 깊은 모델에서 SAM/반병렬/순차 3가지 블록 배치도 비교'},
 {k:'34B vs 70B급 비교', v:'Qwen3-32B·Qwen2.5-72B·Llama3.3-70B와 경쟁 또는 상회', d:'약 절반 크기, 저자 보고 기준(구체적 벤치마크 점수는 본문 표 참조)'}
],

impact:'Falcon-H1은 하이브리드 설계의 자유도를 "레이어마다 어느 메커니즘을 쓸지"에서 "채널마다 얼마나 섞을지"로 한 단계 세분화했다. attention 채널 비율을 늘릴수록 성능이 나빠진다는 그리드 탐색 결과는, 하이브리드 설계에서 attention을 "정밀도 유지용 소수 자원"으로 취급해야 한다는 근거를 실험적으로 제공했다. 여러 크기(0.5B~34B)를 동일한 아키텍처 언어로 공개해 하이브리드 설계의 스케일링 비교를 가능하게 했다.',

legacy:[
 '[Nemotron-H](#/p/nemotron-h)의 레이어 단위(직렬) 혼합과 대비되는 채널 단위(병렬) 혼합의 대표 사례로 인용됨',
 '채널 배분을 8청크로 나눠 그리드 탐색하는 방법론이 이후 하이브리드 아키텍처의 비율 탐색 절차로 참고됨',
 '"attention 채널이 많을수록 나쁘다"는 관찰이 병렬형 하이브리드 설계에서 attention을 최소화하는 근거로 재인용됨',
 'MLP 블록까지 병렬 배치(SAM)에 포함시킨 설계가 순차·반병렬 대안과 함께 비교 기준점이 됨'
],

pitfalls:[
 '**채널 배분·블록 배치 탐색은 300M~1.5B 규모 proxy 모델에서 수행됐다.** 34B 최종 모델에서 같은 최적 비율이 그대로 유지된다는 보장은 proxy 실험 설계에 의존한다.',
 '**"70B급과 경쟁한다"는 주장은 특정 벤치마크 묶음과 특정 비교 모델(Qwen3-32B, Qwen2.5-72B, Llama3.3-70B) 기준이다.** 저자들 스스로도 극단적으로 긴 문맥(long QA)에서는 Qwen3-32B·Llama-3.3-70B에 뒤처진다고 밝힌다.',
 '**"attention 채널이 많을수록 나쁘다"는 결과는 이 논문의 탐색 범위(21개 조합, 특정 규모) 안에서의 관찰이다.** 모든 태스크·모든 규모에 일반화된다고 단정할 근거는 논문 안에 없다.'
],

figures:[
 {f:'fig1-parallel-block.png',
  cap:'하나의 블록 안에서 input projection이 SSM용 성분(gate·ssm input·B·C·discretization)과 attention용 성분(Q·K·V)을 동시에 만들고, SSM과 Attention이 병렬로 계산된 뒤 Concat → Output projection으로 합쳐진다.',
  src:'원문 Figure 1, p.5'}
],

quotes:[
 {t:'Our parallel hybrid design has the freedom to choose the ratio of attention and SSM channels, and we are able to keep a small share of attention heads for precision while SSMs handle most of the work.',
  src:'Section 2, p.4'}
],

links:[
 {t:'arXiv 2507.22448 — Falcon-H1: A Family of Hybrid-Head Language Models', u:'https://arxiv.org/abs/2507.22448'},
 {t:'Hugging Face — tiiuae/Falcon-H1', u:'https://huggingface.co/collections/tiiuae/falcon-h1'}
]
});
