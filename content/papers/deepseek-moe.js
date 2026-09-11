WIKI.paper({
slug:'deepseek-moe',
venue:'arXiv 2024 (DeepSeek-AI)',
authors:'Damai Dai, Chengqi Deng, Chenggang Zhao, R.X. Xu, Huazuo Gao, Deli Chen, Jiashi Li et al.',
arxiv:'2401.06066',

tldr:'MoE 전문가를 더 잘게 쪼개고(**fine-grained segmentation**) 항상 활성화되는 **공유 전문가**를 따로 두면, 같은 계산량·파라미터로 전문가 전문화가 훨씬 강해진다는 논문. 16B 총 파라미터·2.8B 활성 파라미터 모델이 LLaMA2 7B(6.7B 전체·전량 활성)와 맞먹는 성능을 낸다.',

context:'[Switch Transformer](#/p/switch)·GShard 같은 top-K MoE는 전문가 수가 적으면 한 전문가가 서로 무관한 여러 종류의 지식을 동시에 담아야 하는 **지식 혼재(knowledge hybridity)** 문제와, 서로 다른 전문가들이 겹치는 공통 지식을 각자 중복해서 저장하는 **지식 중복(knowledge redundancy)** 문제를 함께 겪는다. 두 문제 모두 "전문가가 좁고 뚜렷한 영역에 특화된다"는 MoE의 이상과 어긋난다. 저자들은 이 근본 원인이 **전문가 개수 자체가 적어서** 활성화 조합의 자유도가 낮다는 데 있다고 보고, 계산량은 그대로 둔 채 전문가를 잘게 쪼개는 쪽으로 접근한다.',

ideas:[
 {h:'세분화(Fine-Grained Segmentation): 전문가를 잘게 쪼개 조합의 자유도를 높인다',
  lead:'전문가 N개를 mN개로 쪼개고 활성 개수도 m배로 늘려 계산량은 그대로 유지한다.',
  d:'각 전문가 FFN의 중간 차원을 $1/m$로 줄여 전문가 하나를 $m$개의 작은 전문가로 쪼갠 뒤, 활성화하는 전문가 수도 $m$배로 늘려 토큰당 계산량을 원래와 같게 유지한다. 예컨대 $N=16$일 때 기존 top-2 조합은 $\\binom{16}{2}=120$가지지만, 4등분해 $N{=}64$·top-8로 바꾸면 $\\binom{64}{8}\\approx44$억 가지 조합이 가능해진다. 조합의 자유도가 커질수록 토큰이 자신에게 필요한 지식 조각만 정밀하게 골라 쓸 수 있어 전문화가 강해진다.'},
 {h:'공유 전문가 격리(Shared Expert Isolation): 공통 지식은 따로 뗀다',
  lead:'라우팅과 무관하게 모든 토큰이 항상 거치는 공유 전문가 $K_s$개를 별도로 둔다.',
  d:'라우터가 고르는 일반 전문가와 별개로, $K_s$개의 전문가를 **모든 토큰이 예외 없이** 거치는 공유 전문가로 고정한다. 계산량을 맞추기 위해 라우팅 대상 전문가의 활성 개수를 $K_s$만큼 줄인다. 어휘 빈도나 문법처럼 거의 모든 토큰에 공통으로 필요한 지식을 공유 전문가가 전담하게 되므로, 나머지 라우팅 전문가들은 더 이상 그 공통 지식을 중복해서 배우지 않고 각자의 특화 영역에만 집중할 수 있다.'},
 {h:'적은 활성 파라미터로 더 큰 dense/MoE 모델과 맞먹는 성능',
  lead:'2B 규모에서 GShard 2.9B(전문가 파라미터·연산량 1.5배)와 동등한 성능을 냄을 먼저 확인했다.',
  d:'2B 파라미터 규모의 통제 실험에서 DeepSeekMoE는 같은 활성 파라미터의 GShard보다 크게 앞서고, 전문가 파라미터·연산량이 1.5배 더 많은 GShard 2.9B와 맞먹는 성능을 냈다. 이 검증을 거친 뒤에야 16B, 그리고 145B로 스케일을 올렸다 — 작은 규모에서 아키텍처 효과를 먼저 확인하고 키우는 절차를 밟았다.'}
],

diagram:{type:'compare', cap:'같은 계산량 예산 안에서 전문가를 어떻게 나누고 쓰느냐가 다르다.',
 left:{t:'기존 top-2 MoE(N=16)', items:['전문가 16개, top-2 활성','조합 120가지(C(16,2))','공통지식이 각 전문가에 중복']},
 right:{t:'DeepSeekMoE', items:['전문가 4등분+세분화, top-8','조합 약 44억가지(C(64,8))','공유 전문가가 공통지식 전담']}},

math:[
 {expr:'h_t = Σ_{i=1..Ks} FFN_i(u_t) + Σ_{i=Ks+1..mN} g_{i,t}·FFN_i(u_t) + u_t',
  tex:'h_t=\\sum_{i=1}^{K_s}\\text{FFN}_i(u_t)+\\sum_{i=K_s+1}^{mN}g_{i,t}\\,\\text{FFN}_i(u_t)+u_t',
  d:'첫째 항이 항상 활성화되는 $K_s$개의 공유 전문가, 둘째 항이 라우터 게이트 $g_{i,t}$로 top-$(mK{-}K_s)$만 선택되는 세분화된 라우팅 전문가. 게이트는 $s_{i,t}=\\text{Softmax}_i(u_t^{T}e_i)$의 상위 값만 남기고 나머지는 0.'}
],

numbers:[
 {k:'DeepSeekMoE 2B vs GShard', v:'2.9B(전문가 파라미터 1.5배)와 동등', d:'같은 활성 파라미터의 GShard 2B는 크게 앞섬'},
 {k:'DeepSeekMoE 16B', v:'총 16.4B · 활성 2.8B', d:'DeepSeek 7B(dense, 6.9B 전량 활성) 대비 계산량 약 40%로 comparable 성능'},
 {k:'FLOPs per 4K 토큰', v:'74.4T (dense 7B는 183.5T)', d:'DeepSeekMoE 16B vs DeepSeek 7B, 계산량 약 40.5%'},
 {k:'LLaMA2 7B 대비', v:'활성 파라미터 약 1/2.5로 comparable', d:'DeepSeekMoE 16B(2.8B 활성) vs LLaMA2 7B(6.7B 전량 활성)'},
 {k:'추론 속도', v:'7B dense 대비 약 2.5배', d:'단일 40GB GPU 배포 가능, 연산자 최적화 적용 시'},
 {k:'145B 예비 실험', v:'GShard 대비 일관된 우위 확인', d:'세분화+공유전문가 구조를 더 큰 스케일에서도 검증'}
],

impact:'"전문가를 몇 개로 나누고, 그중 무엇을 공유시킬지"를 MoE 설계의 명시적 변수로 다뤄, 같은 계산 예산에서 전문화 품질을 끌어올리는 구체적인 두 손잡이(세분화 비율 $m$, 공유 전문가 수 $K_s$)를 제시했다. 활성 파라미터 대비 성능이라는 기준으로 [Switch](#/p/switch) 계열보다 명확히 앞선 실측을 대규모(16B, 145B)로 보여, 이후 DeepSeek 계열(DeepSeek-V2/V3)과 여러 오픈소스 MoE가 이 두 설계를 기본값으로 채택하게 만들었다.',

legacy:[
 '**세분화된 전문가 + 공유 전문가 조합이 이후 DeepSeek-V2·V3의 MoE 설계 기본값으로 계승**',
 '**"활성 파라미터당 성능"이 MoE 모델을 비교하는 표준 축으로 자리잡는 데 기여**',
 '**공유 전문가라는 아이디어 자체는 [Expert Choice](#/p/expert-choice) 이전 엔지니어링 관행(DeepSpeed-MoE)에서 왔음을 논문이 직접 명시** — 이 논문의 기여는 이를 알고리즘적으로 정식화하고 세분화와 결합한 것',
 '**오픈소스 대형 MoE(Qwen-MoE, Mixtral 후속 등)가 세분화 비율·공유 전문가 수를 하이퍼파라미터로 명시적으로 튜닝하는 관행으로 확산**'
],

pitfalls:[
 '**"16B 모델"이라는 말이 활성 파라미터를 뜻하지 않는다.** DeepSeekMoE 16B는 총 파라미터가 16.4B이고 실제 활성 파라미터는 2.8B다 — 총/활성을 혼동하면 계산 비용을 10배 가까이 오판하게 된다.',
 '**다지선다형 과제(MMLU·CEval 등)에서는 오히려 dense 7B보다 낮다.** 저자들은 이를 attention 파라미터가 적기 때문(0.5B vs DeepSeek 7B의 2.5B)이라고 설명한다 — MoE 이득이 모든 과제에 균일하지 않다.',
 '**[Expert Choice](#/p/expert-choice)와는 라우팅 방향 자체가 다르다.** DeepSeekMoE는 여전히 토큰이 전문가를 고르는 top-K 방식이며, 세분화·공유전문가는 그 위에 얹는 구조적 개선이지 라우팅 주체를 바꾸는 것이 아니다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'(a) 기존 top-2 라우팅: 전문가 N개 중 2개만 활성화. (b) 세분화: 같은 파라미터를 2N개의 작은 전문가로 쪼개고 top-4를 활성화(계산량 동일). (c) 여기에 공유 전문가(초록, 전문가 1번)를 추가해 모든 토큰이 항상 거치게 하고, 라우팅 전문가는 top-3만 선택 — 이 (c)가 최종 DeepSeekMoE 구조.',
  src:'원문 Figure 2, p.5'}
],

quotes:[
 {t:'We propose the DeepSeekMoE architecture towards ultimate expert specialization. It involves two principal strategies: (1) finely segmenting the experts into mN ones... (2) isolating Ks experts as shared ones, aiming at capturing common knowledge and mitigating redundancy in routed experts.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2401.06066 — DeepSeekMoE', u:'https://arxiv.org/abs/2401.06066'},
 {t:'GitHub — deepseek-ai/DeepSeek-MoE', u:'https://github.com/deepseek-ai/DeepSeek-MoE'}
]
});
