WIKI.paper({
slug:'deepseek-v2',
venue:'arXiv 2024',
authors:'DeepSeek-AI',
arxiv:'2405.04434',

tldr:'236B 파라미터 MoE 모델인데 토큰당 21B만 활성화하면서도, **KV 캐시를 93.3% 줄이고** 생성 처리량을 5.76배로 끌어올린 논문. 핵심은 K/V를 저차원 latent 벡터로 압축해서 캐싱하는 **MLA(Multi-head Latent Attention)**다.',

context:'자기회귀 생성에서는 매 스텝마다 이전 토큰들의 attention을 다시 계산하지 않으려고 모든 레이어·모든 head의 Key·Value 벡터를 GPU 메모리에 캐싱해 둔다. 이 KV 캐시는 시퀀스 길이와 배치 크기에 비례해서 선형으로 커지고, 문맥이 길어지거나 동시 요청이 많아지면 GPU 메모리를 다 잡아먹어 **동시에 처리 가능한 배치 크기 자체를 제한**한다. 매 스텝 이 캐시를 메모리에서 읽어오는 대역폭도 지연의 큰 부분을 차지한다. [MQA](#/p/mqa)는 모든 query head가 K/V head 하나를 공유해서 캐시를 $n_h$분의 1로 줄이고, [GQA](#/p/gqa)는 몇 개의 그룹으로 절충하는데, 둘 다 **K/V head 자체의 개수를 줄이는** 방식이라 캐시가 작아질수록 품질(MHA 대비 표현력)이 떨어진다. DeepSeek-V2는 다른 축을 잡는다 — head 개수를 줄이는 대신 K와 V를 **저차원 latent 벡터로 압축**해서 캐싱하고, attention을 계산할 때만 그 자리에서 복원한다.',

ideas:[
 {h:'MLA: K/V를 저차원 latent로 압축해 캐싱',
  lead:'K·V를 공유가 아니라 저랭크 압축으로 줄여, 캐시는 작지만 표현력은 유지한다.',
  d:'표준 MHA는 입력 $\\mathbf{h}_t$ 로부터 만든 $\\mathbf{k}_t,\\mathbf{v}_t \\in \\mathbb{R}^{d_h n_h}$ 를 그대로 캐싱해야 해서 토큰당 $2n_h d_h l$ 개 원소가 필요하다. MLA는 대신 $\\mathbf{c}_t^{KV}=W^{DKV}\\mathbf{h}_t$ 로 차원 $d_c \\ll d_h n_h$ 인 latent 벡터 하나만 만들어 **이것만** 캐싱하고, attention을 계산할 때 $W^{UK}, W^{UV}$ 로 K/V를 다시 복원한다. [MQA](#/p/mqa)·[GQA](#/p/gqa)가 "K/V head 복사본 개수"를 줄이는 것과 달리, MLA는 "K/V 자체의 정보량"을 저랭크로 압축하는 것이라 캐시는 GQA의 2.25개 그룹 수준으로 작으면서도 논문은 MHA보다 강한 성능을 보고한다. 추론 시 $W^{UK}$ 는 $W^Q$ 에, $W^{UV}$ 는 $W^O$ 에 흡수시킬 수 있어 K/V를 명시적으로 복원할 필요조차 없다.'},
 {h:'decoupled RoPE: 압축과 회전위치인코딩의 충돌 해결',
  lead:'RoPE는 위치에 민감해 압축된 K에 바로 못 씌우므로, RoPE 전용 작은 성분을 따로 둔다.',
  d:'[RoPE](#/p/rope)를 압축된 키 $\\mathbf{k}_t^C$ 에 직접 적용하면 위치별로 달라지는 회전행렬이 $W^{UK}$ 와 뒤섞여, 그 흡수 트릭이 깨지고 매 스텝 이전 토큰들의 키를 다시 계산해야 한다. 그래서 MLA는 RoPE를 얹는 작은 차원의 query/key 성분($\\mathbf{q}_t^R, \\mathbf{k}_t^R$)을 압축 경로와 분리해서 따로 두고, attention에서는 압축 성분과 concat해서 쓴다. 이 decoupled key도 캐싱해야 하므로 실제 토큰당 캐시는 $(d_c+d_h^R)l$ 개 원소다.'},
 {h:'DeepSeekMoE: 잘게 쪼갠 expert + 상시 활성 shared expert',
  lead:'expert를 잘게 쪼개 조합을 늘리고, 일부는 항상 켜서 공통 지식을 맡긴다.',
  d:'[Switch Transformer](#/p/switch)류의 MoE가 적은 수의 큰 expert 중 하나를 고르는 것과 달리, DeepSeekMoE는 expert를 더 작고 많은 단위로 세분화(fine-grained segmentation)해서 top-K 조합의 표현력을 늘린다. 그중 일부(shared expert)는 라우팅과 무관하게 **항상 활성화**해서 여러 expert에 중복 학습될 공통 지식을 떠맡기고, 나머지 routed expert만 게이트로 top-K개 선택한다. DeepSeek-V2는 layer당 shared expert 2개 + routed expert 160개 중 6개를 활성화하는 구성을 쓴다.'},
 {h:'용량 대비 저렴한 학습, 그러나 대형 모델',
  lead:'236B 중 21B만 활성화해 학습·추론 연산을 줄이면서 총 파라미터가 주는 표현력은 유지한다.',
  d:'DeepSeek-V2는 토큰당 21B 파라미터만 forward에 관여하므로 같은 활성 파라미터의 dense 모델과 연산량이 비슷하지만, 236B의 총 용량에 걸쳐 지식을 분산 저장할 수 있다. 8.1T 토큰으로 사전학습했고, 같은 학습 토큰 기준으로 DeepSeek 67B 대비 GPU 시간을 42.5% 절약했다고 보고한다.'}
],

diagram:{type:'compare', cap:'K/V를 어떻게 캐싱하는지의 차이. MQA/GQA는 head 복사본 수를 줄이고, MLA는 K/V를 저차원 latent로 압축해 그 latent만 캐싱한다.',
 left:{t:'MQA / GQA', items:['모든 head가 K/V 소수 집합 공유','head 복사본 개수를 줄여 캐시 축소','캐시 작을수록 MHA보다 품질 하락']},
 right:{t:'MLA (이 논문)', items:['K·V를 저랭크 latent로 압축해 저장','attention 시점에 up-projection 복원','decoupled RoPE로 압축과 위치인코딩 분리']}},

math:[
 {expr:'c_t^KV = W^DKV h_t,   k_t^C = W^UK c_t^KV,   v_t^C = W^UV c_t^KV',
  tex:'\\mathbf{c}_t^{KV}=W^{DKV}\\mathbf{h}_t,\\quad \\mathbf{k}_t^{C}=W^{UK}\\mathbf{c}_t^{KV},\\quad \\mathbf{v}_t^{C}=W^{UV}\\mathbf{c}_t^{KV}',
  d:'MLA의 핵심 세 줄. 입력을 $d_c \\ll d_h n_h$ 차원 latent로 내려 압축(down-projection)한 뒤, attention 시점에 K·V로 다시 올려(up-projection) 쓴다. 캐싱 대상은 이 $\\mathbf{c}_t^{KV}$ 뿐이다.'},
 {expr:'MHA cache = 2 n_h d_h l  vs  MLA cache = (d_c + d_h^R) l ≈ 92 d_h l',
  tex:'\\text{MHA: } 2 n_h d_h l \\quad\\text{vs}\\quad \\text{MLA: } (d_c+d_h^{R})\\,l \\approx 92\\,d_h l',
  d:'토큰당 캐시 원소 수 비교. 논문은 DeepSeek-V2 설정( $d_c=4d_h$, $d_h^R=d_h/2$ )에서 이 값이 GQA를 그룹 수 2.25로 설정한 것과 같은 크기라고 명시한다.'}
],

numbers:[
 {k:'총 파라미터 / 활성 파라미터', v:'236B / 21B', d:'토큰당 forward에는 21B만 관여'},
 {k:'KV 캐시 절감', v:'93.3%', d:'DeepSeek 67B(MHA) 대비, 논문 Abstract 명시 수치'},
 {k:'최대 생성 처리량', v:'5.76배', d:'DeepSeek 67B 대비, H800 8장 단일 노드에서 초당 5만 토큰 이상'},
 {k:'학습 비용 절감', v:'42.5%', d:'1조 토큰당 GPU 시간 기준, DeepSeek 67B 대비'},
 {k:'지원 문맥 길이', v:'128K', d:'[YaRN](#/p/yarn)으로 4K→128K로 확장, NIAH 테스트로 검증'},
 {k:'MMLU (5-shot)', v:'78.5', d:'DeepSeek-V2 base, LLaMA3 70B(78.9)에 근접'}
],

impact:'MLA는 KV 캐시 축소를 "head 공유"가 아니라 "저랭크 압축"으로 접근할 수 있다는 것을 보여, [MQA](#/p/mqa)/[GQA](#/p/gqa) 이후 정체돼 있던 추론 효율 논의에 새 축을 열었다. DeepSeekMoE의 fine-grained expert + shared expert 조합은 이후 DeepSeek-V3, DeepSeek-R1 등 후속 모델의 기본 아키텍처로 그대로 이어졌다. 실제 서빙 환경에서 배치 크기와 문맥 길이가 KV 캐시로 제한된다는 문제를 구체적 수치(93.3%, 5.76배)로 정량화해, "MoE는 학습만 싸고 추론 서빙은 여전히 무겁다"는 통념에 반박 사례를 제시했다.',

legacy:[
 '**[DeepSeek-V3](#/p/deepseek-v3) / [DeepSeek-R1](#/p/deepseek-r1)** — MLA와 DeepSeekMoE 구조를 그대로 계승하며 총 파라미터 규모를 더 키움',
 '**vLLM 등 서빙 엔진** — MLA를 위한 별도 커널·캐시 레이아웃 최적화가 추가됨',
 '**KV 캐시 압축 계열** — quantization(6bit 캐시), 저랭크 압축 등 KV 캐시를 줄이는 여러 기법이 MLA 이후 같이 조명받음',
 '**오픈소스 MoE 생태계** — DeepSeek-V2-Lite(15.7B/2.4B 활성) 공개로 MLA·DeepSeekMoE를 작은 규모에서 실험할 수 있는 기준점을 제공'
],

pitfalls:[
 '**"MLA도 결국 GQA처럼 head를 줄인 것"이라는 오해.** MLA는 head 수나 K/V 복사본 수를 줄이지 않는다. 각 head는 그대로 두고 K·V의 **정보 자체를 저랭크로 압축**해서 그 압축된 latent만 캐싱하는 방식이라, 원리가 다르고 그래서 캐시는 작으면서 성능은 MHA에 가깝다는 결과가 나온다.',
 '**93.3%와 5.76배는 서로 다른 실험 조건의 수치다.** 93.3%는 아키텍처상 KV 캐시 원소 수 비교(Table 1 근거)이고, 5.76배는 FP8 변환·6bit KV 캐시 양자화까지 적용한 실제 배포 환경에서 측정한 처리량이다. 둘을 같은 조건의 숫자로 섞어 인용하지 않는다.',
 '**decoupled RoPE는 부가 트릭이지, MLA 압축의 본체가 아니다.** RoPE 호환을 위해 추가한 작은 차원의 별도 경로일 뿐이고, 이 경로도 캐싱 대상에 포함되므로 실제 캐시 크기는 $d_c$ 만이 아니라 $d_c+d_h^R$ 로 계산해야 한다.'
],

figures:[
 {f:'fig2-mla-block.png',
  cap:'입력 $h_t$ 에서 latent $c_t^Q$(query용)와 $c_t^{KV}$(key/value용)를 각각 down-projection한 뒤, RoPE가 필요한 부분만 별도 경로(오른쪽 $k_t^R$)로 분리해 concat하고 attention을 계산한다. 사선 무늬 상자가 "추론 중 실제로 캐싱되는" 벡터 — $k_t^R$ 과 $c_t^{KV}$ 뿐이다.',
  src:'원문 Figure 2 (MLA 부분), p.5'},
 {f:'fig3-mha-gqa-mqa-mla.png',
  cap:'왼쪽부터 MHA(모든 head가 각자 K/V), GQA(그룹별 공유), MQA(전체가 K/V 하나 공유), MLA(오른쪽, 사선 무늬가 캐싱 대상). MLA만 K/V를 그대로 두지 않고 오른쪽의 작은 "Compressed Latent KV"로 투영해서 캐싱한다는 점이 그림에서 화살표로 드러난다.',
  src:'원문 Figure 3, p.7'}
],

quotes:[
 {t:'MLA guarantees efficient inference through significantly compressing the Key-Value (KV) cache into a latent vector, while DeepSeekMoE enables training strong models at an economical cost through sparse computation.',
  src:'Abstract, p.1'},
 {t:'MLA requires only a small amount of KV cache, equal to GQA with only 2.25 groups, but can achieve stronger performance than MHA.',
  src:'Section 2.1.4, p.8'}
],

links:[
 {t:'arXiv 2405.04434 — DeepSeek-V2', u:'https://arxiv.org/abs/2405.04434'},
 {t:'DeepSeek-V2 GitHub', u:'https://github.com/deepseek-ai/DeepSeek-V2'}
]
});
