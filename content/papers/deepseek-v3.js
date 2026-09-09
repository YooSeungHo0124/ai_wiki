WIKI.paper({
slug:'deepseek-v3',
venue:'arXiv 2024 (DeepSeek-AI)',
authors:'DeepSeek-AI',
arxiv:'2412.19437',

tldr:'671B 총 파라미터 중 토큰당 **37B만 활성**되는 MoE 모델을, MLA·세분화된 전문가·FP8 학습으로 **2.788M H800 GPU-hours**에 완성하고 그 비용을 논문에 그대로 적어 공개했다. 최전선 성능이 프런티어 랩만의 예산 규모를 필요로 하지 않음을 보인 사례다.',

context:'[Mixtral](#/p/mixtral)이 MoE를 오픈 웨이트로 가져왔지만 두 개의 벽이 남아 있었다. 첫째, **전문가 8개·top-2는 성기다** — 활성 비율이 총 파라미터의 약 28%라 "파라미터를 늘리되 계산은 안 늘린다"는 MoE의 약속이 절반만 지켜진다. 둘째, **KV 캐시가 여전히 병목이다** — [GQA](#/p/gqa)로 head를 줄여도 128K 문맥에서는 캐시가 감당이 안 된다. 여기에 산업 전체의 문제가 겹쳐 있었다: 프런티어급 학습 비용이 얼마인지 아무도 공개하지 않아, "따라잡을 수 있는가"가 추정의 영역에 머물렀다. DeepSeek-V3는 이 세 가지에 각각 답을 낸다.',

ideas:[
 {h:'MLA — KV를 저차원 잠재 벡터 하나로 압축한다',
  lead:'K·V를 512차원 잠재 벡터로 압축해 캐시 크기를 줄인다.',
  d:'Multi-head Latent Attention은 [GQA](#/p/gqa)처럼 head 수를 줄이는 대신, **K와 V를 512차원 잠재 벡터로 저랭크 압축해서 캐시한다**. 추론 시에는 이 잠재 벡터만 저장하고 필요할 때 각 head의 K·V로 되펼친다. 캐시되는 것이 head 개수만큼의 K·V가 아니라 토큰당 벡터 하나이므로 KV 메모리가 크게 줄고, 그 덕에 128K 문맥이 실용 영역에 들어온다. [RoPE](#/p/rope)는 압축과 호환되지 않으므로 위치 정보를 담는 별도의 소형 차원을 분리해 따로 둔다.'},
 {h:'DeepSeekMoE — 전문가를 잘게 쪼개고 공유 전문가를 둔다',
  lead:'전문가를 256개로 잘게 쪼개고 공유 전문가 1개를 추가한다.',
  d:'[Mixtral](#/p/mixtral)의 층당 8개 대신 **256개의 라우팅 전문가 + 1개의 공유 전문가**를 두고 토큰당 8개를 활성화한다. 전문가를 잘게 나누면 조합의 수가 폭발적으로 늘어 같은 활성 파라미터로 더 다양한 특화가 가능해지고, 모든 토큰이 반드시 통과하는 공유 전문가가 공통 지식을 떠맡아 나머지 전문가들이 중복 학습하는 낭비를 줄인다. 결과적으로 활성 비율이 총량의 **약 5.5%** 까지 내려간다.'},
 {h:'보조 손실 없는 부하 균형',
  lead:'전문가별 bias만 동적으로 조정해 gradient 오염 없이 균형을 맞춘다.',
  d:'MoE의 고질병은 라우터가 소수 전문가에만 몰리는 붕괴다. 기존 해법은 균형을 강제하는 auxiliary loss를 더하는 것인데, 이 항은 언어 모델링 목표와 충돌해 성능을 깎는다. DeepSeek-V3는 대신 **전문가별 bias 항을 학습 중에 동적으로 조정한다** — 과부하 전문가의 라우팅 점수 bias를 내리고 한산한 전문가의 것을 올린다. 이 bias는 어느 전문가를 고를지에만 관여하고 최종 가중치 계산에는 쓰이지 않아, gradient를 오염시키지 않는다.'},
 {h:'Multi-Token Prediction — 다음 한 개 대신 두 개를 본다',
  lead:'다음 두 토큰을 함께 예측하게 해 학습 신호를 조밀하게 만든다.',
  d:'각 위치에서 다음 토큰뿐 아니라 그 다음 토큰까지 예측하도록 별도의 얕은 모듈을 붙여 학습한다(깊이 1). 학습 신호가 조밀해지고 모델이 더 먼 미래를 미리 계획하게 되어 본 모델의 성능 자체가 올라간다. 부수 효과로 이 모듈을 추론에 그대로 재사용해 [speculative decoding](#/p/speculative)의 초안 모델로 쓸 수 있어 생성 속도도 빨라진다.'},
 {h:'FP8 혼합 정밀도로 학습 전체를 돌린다',
  lead:'타일·블록 단위로 스케일을 따로 둬 FP8 사전학습을 안정시킨다.',
  d:'대부분의 GEMM을 FP8(E4M3)로 수행한다. 문제는 FP8의 좁은 표현 범위인데, **미세 단위 양자화**로 해결한다 — 활성값은 1×128 타일, 가중치는 128×128 블록마다 별도의 스케일을 둬서 이상치 하나가 블록 전체를 망치지 않게 한다. 누적은 128 원소 간격으로 CUDA 코어에 올려 FP32 정밀도로 처리한다. 이 규모에서 FP8 학습이 실제로 수렴함을 보인 것이 이 논문의 공학적 핵심이며, 학습 전 과정에서 **복구 불가능한 loss spike나 롤백이 한 번도 없었다.**'}
],

diagram:{type:'compare', cap:'MoE 한 세대의 변화 — 전문가를 잘게 쪼개면 같은 계산량으로 더 많은 조합이 나온다 (Mixtral 2024.01 → DeepSeek-V3 2024.12)',
 left:{t:'Mixtral 8x7B', items:[
  '층당 전문가 8개 · top-2',
  '총 47B / 활성 13B (약 28%)',
  'GQA로 KV 캐시 절감',
  'auxiliary loss로 부하 균형']},
 right:{t:'DeepSeek-V3', items:[
  '라우팅 전문가 256개 + 공유 1개 · top-8',
  '총 671B / 활성 37B (약 5.5%)',
  'MLA — KV를 512차원으로 압축',
  'bias 조정으로 손실 항 없이 균형']}},

math:[
 {expr:'c_t^KV = W^DKV · h_t     (저장)      k_t^i, v_t^i = W^UK_i · c_t^KV, W^UV_i · c_t^KV     (복원)',
  tex:'\\begin{aligned} c_t^{KV} &= W^{DKV} h_t \\quad \\text{(저장)}\\\\ k_t^i,\\ v_t^i &= W^{UK}_i c_t^{KV},\\ W^{UV}_i c_t^{KV} \\quad \\text{(복원)}\\end{aligned}',
  d:'MLA의 뼈대. 토큰당 캐시하는 것은 head별 K·V가 아니라 압축된 잠재 벡터 $c_t^{KV}$(512차원) 하나뿐이다. 상향 투영 행렬 $W^{UK}$ 는 attention 계산 시 $W^Q$ 에 흡수시킬 수 있어 복원 연산이 추론 시 추가 비용으로 잡히지 않는다.'},
 {expr:'g_i = TopK( s_i + b_i )  로 선택,  가중치에는 s_i 만 사용',
  tex:'g_i = \\text{TopK}(s_i + b_i)',
  d:'보조 손실 없는 부하 균형의 전부. bias $b_i$ 는 **선택 단계에만** 개입하고 최종 가중합에는 원래 점수 $s_i$ 를 쓴다. 균형 조정이 언어 모델링 gradient를 건드리지 않는 이유다.'}
],

numbers:[
 {k:'총 / 활성 파라미터', v:'671B / 토큰당 37B', d:'활성 비율 약 5.5%'},
 {k:'MoE 구성', v:'라우팅 전문가 256 + 공유 1 · top-8', d:'61층 · hidden 7168'},
 {k:'MLA 압축 차원', v:'512', d:'토큰당 캐시하는 잠재 벡터 크기'},
 {k:'학습 토큰', v:'14.8T', d:'이후 YaRN으로 32K → 128K 두 단계 문맥 확장'},
 {k:'학습 비용', v:'2.788M H800 GPU-hours', d:'사전학습 2.664M · GPU-hour당 $2 가정 시 총 약 $5.576M'},
 {k:'학습 효율', v:'1조 토큰당 180K GPU-hours', d:'복구 불가능한 loss spike·롤백 0회'},
 {k:'MMLU / MMLU-Pro', v:'88.5 / 75.9', d:'베이스 모델 기준 · 당시 오픈 모델 최고'}
],

impact:'**(1) 비용의 공개.** 프런티어급 모델의 학습 비용이 구체적 GPU-hour 단위로 논문에 실린 첫 사례에 가깝다. "수억 달러가 필요하다"는 통념 대비 한 자릿수 낮은 숫자가 나오면서, 오픈 모델과 폐쇄 모델의 격차가 자본이 아니라 공학의 문제로 재프레이밍됐다. **(2) MoE 설계의 세대 교체.** 성긴 전문가 몇 개가 아니라 수백 개를 잘게 쪼개는 방향, 그리고 auxiliary loss 없는 균형 조정이 이후 대형 MoE의 기본 설계가 됐다. **(3) 저정밀 학습의 실증.** FP8이 파인튜닝이나 추론이 아니라 **수천억 파라미터 사전학습**에서 동작함을 보이면서, 하드웨어 세대별 정밀도 지원이 곧 학습 비용 곡선을 결정한다는 점이 분명해졌다. **(4) 후속 추론 모델의 토대** — 이 베이스 위에서 [DeepSeek-R1](#/p/deepseek-r1)의 강화학습이 진행된다.',

legacy:[
 '**[DeepSeek-R1](#/p/deepseek-r1)** — 이 모델을 베이스로 [GRPO](#/p/grpo) 기반 RL만으로 긴 사고 사슬 능력을 끌어내며 추론 모델 경쟁의 판을 바꿈',
 '**MLA의 확산** — [MQA](#/p/mqa)/[GQA](#/p/gqa)로 이어지던 KV 캐시 절감 계열에 "head를 줄인다"가 아닌 "저랭크로 압축한다"는 세 번째 답이 추가됨',
 '**FP8 학습의 표준화** — Hopper 이후 세대 하드웨어에서 저정밀 사전학습이 선택지가 아니라 기본 전제가 되는 흐름',
 '**MTP와 speculative decoding의 결합** — 학습 목표로 붙인 모듈이 그대로 추론 가속기가 되는 설계가 다른 모델들로 확산'
],

pitfalls:[
 '**$5.576M은 최종 학습 한 번의 계산 비용이다.** 논문 스스로 명시하듯 이 숫자에는 아키텍처 탐색, 실패한 실험, 데이터 구축, 사람의 시간, GPU 구매·감가상각이 전혀 포함되지 않는다. "600만 달러면 프런티어 모델을 만들 수 있다"로 요약하는 것은 논문이 하지 않은 주장이다.',
 '**활성 37B라고 37B 모델처럼 배포되지 않는다.** [Mixtral](#/p/mixtral)과 같은 함정이 더 큰 규모로 나타난다 — 671B 전체를 메모리에 올려야 하므로 다중 노드 전문가 병렬화가 사실상 필수이고, 단일 서버 로컬 실행은 현실적이지 않다.',
 '**MLA는 [GQA](#/p/gqa)의 드롭인 교체가 아니다.** [RoPE](#/p/rope)를 저랭크 압축된 K에 그대로 적용할 수 없어 위치 정보용 차원을 분리하는 설계가 필요하다. 기존 GQA 모델의 attention만 갈아끼우는 식으로는 적용되지 않는다.'
],

figures:[
 {f:'fig2-mla-moe-architecture.png',
  cap:'왼쪽이 Transformer 블록 하나(×L번 반복) — attention과 FFN을 각각 MLA, DeepSeekMoE로 확대한 것이 오른쪽 두 상자. 위쪽 DeepSeekMoE: 초록 Shared Expert(항상 켜짐) + 파랑 Routed Expert 여러 개 중 Router가 Top-K개만 골라(점선 화살표) 가중합. 아래쪽 MLA: 원 모양 아이콘에 빗금(⊘⊘, "Cached During Inference")이 쳐진 것이 실제로 KV 캐시에 저장되는 저차원 latent(c_t^KV)뿐이라는 표시 — 원래 크기의 K·V 전체가 아니라 압축된 latent만 캐싱해 메모리를 줄인다.',
  src:'원문 Figure 2, p.7'}
],

quotes:[
 {t:'DeepSeek-V3 pioneers an auxiliary-loss-free strategy for load balancing and sets a multi-token prediction training objective for stronger performance.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2412.19437 — DeepSeek-V3 Technical Report', u:'https://arxiv.org/abs/2412.19437'},
 {t:'DeepSeek-V3 GitHub (모델 가중치 · 추론 코드)', u:'https://github.com/deepseek-ai/DeepSeek-V3'},
 {t:'arXiv 2405.04434 — DeepSeek-V2 (MLA·DeepSeekMoE 최초 제안)', u:'https://arxiv.org/abs/2405.04434'}
]
});
