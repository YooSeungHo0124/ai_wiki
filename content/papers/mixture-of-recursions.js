WIKI.paper({
slug:'mixture-of-recursions',
venue:'arXiv 2025 (KAIST AI · Mila · Google DeepMind/Research/Cloud)',
authors:'Sangmin Bae, Yujin Kim, Reza Bayat et al. (KAIST AI · Mila · Google)',
arxiv:'2507.10524',

tldr:'파라미터를 공유하는 재귀 블록(Recursive Transformer)에, **토큰마다 몇 번 재귀를 반복할지**를 학습된 라우터가 결정하게 만든 아키텍처. 135M~1.7B 규모에서 같은 학습 FLOPs로 vanilla Transformer보다 낮은 검증 손실·높은 few-shot 정확도를 내면서, 재귀 단계별 KV 캐싱으로 처리량도 함께 올린다.',

context:'효율화는 보통 두 축으로 따로 다뤄졌다 — **파라미터 공유**(같은 레이어를 반복 사용해 고유 파라미터 수를 줄임)와 **적응적 계산**(쉬운 토큰엔 적게, 어려운 토큰엔 많이 계산). [Universal Transformer](#/p/universal-transformer)가 파라미터 공유 자체로도 비공유 깊은 스택과 맞먹는 표현력을 낼 수 있음을 보였지만, 대부분의 후속 재귀 모델은 **모든 토큰에 같은 재귀 깊이**를 고정 적용해 진짜 적응적 계산으로 이어지지 못했다. MoR는 "두 축을 동시에 얻을 수 있는가"라는 질문에서 출발한다.',

ideas:[
 {h:'재귀 블록 + 라우터: 몇 번 반복할지를 토큰마다 결정',
  lead:'고정된 레이어 스택을 공유 재귀 블록으로 묶고, 라우터가 각 토큰을 최대 N_r번까지 통과시킬지 정한다.',
  d:'모델은 하나의 공유된 "재귀 블록"(레이어 스택)을 갖고, 토큰은 이 블록을 최대 $N_r$번 반복 통과한다. 매 재귀 단계마다 경량 라우터가 그 토큰이 **한 번 더 통과할지(계속 "생각"할지) 아니면 여기서 멈출지**를 결정한다. 파라미터는 재귀 블록 하나만 있으면 되므로(파라미터 공유), 고유 파라미터 수는 재귀 횟수와 무관하게 고정된다.'},
 {h:'Expert-choice vs token-choice 라우팅',
  lead:'각 재귀 단계가 상위 k개 토큰을 뽑거나(expert-choice), 토큰이 처음부터 갈 깊이를 한 번에 정하거나(token-choice) 둘 중 하나를 쓴다.',
  d:'expert-choice는 재귀 깊이 하나하나를 "전문가"로 보고 그 단계에서 점수 $g_t^r=\\mathcal{G}(\\theta_r^\\top \\mathcal{H}_t^r)$가 높은 상위 $k$개 토큰만 다음 재귀로 통과시킨다 — 깊이가 깊어질수록 활성 토큰 집합이 점점 좁아진다. token-choice는 맨 처음에 토큰마다 재귀 깊이 전체를 한 번에 결정해, 그 뒤로는 라우팅 판단이 필요 없다. expert-choice는 부하 균형이 완벽하지만 미래 정보를 참조하는 인과성 위반 문제가 있고, token-choice는 인과적이지만 부하 불균형이 생길 수 있다는 트레이드오프가 있다.'},
 {h:'재귀 단계별 KV 캐싱: 활성 토큰의 KV만 저장',
  lead:'그 재귀 단계에서 아직 활성인 토큰의 key-value만 캐싱해, attention 연산과 메모리 접근을 함께 줄인다.',
  d:'적응적 재귀 깊이는 그 자체로 KV 캐시 전략과 자연스럽게 맞물린다 — "recursion-wise caching"은 특정 재귀 단계에서 아직 탈락하지 않은 토큰의 KV만 저장해서, 그 단계의 attention이 **활성 토큰들 사이에서만** 계산되게 한다. 대안인 "recursive KV sharing"은 첫 재귀에서 모든 토큰의 KV를 한 번 캐싱해 이후 단계들이 공유하는 방식으로, 메모리는 더 아끼지만 정밀도는 recursion-wise보다 낮다.'},
 {h:'KV 캐시 효율이 함께 좋아지는 이유',
  lead:'깊은 재귀에 도달하는 토큰이 적어질수록 그 단계에서 attention이 봐야 할 KV 집합도 함께 줄어든다.',
  d:'적응적 깊이 라우팅이 "이 토큰은 몇 번 더 생각해야 하는가"만 정하는 게 아니라, 재귀가 깊어질수록 활성 토큰 수 자체가 줄어드는 구조(특히 expert-choice)이기 때문에, **quadratic attention 연산과 KV 캐시 크기가 동시에** 얕아진 활성 집합에 비례해 줄어든다. 이것이 계산 효율과 메모리 효율이 하나의 라우팅 결정에서 함께 나오는 이유다.'}
],

diagram:{type:'loop', cap:'재귀 블록을 공유 파라미터로 최대 N_r번 반복하되, 매 단계 라우터가 토큰별로 계속할지를 정한다.',
 center:'라우터가 토큰별 계속/종료 판단',
 nodes:[
  {t:'토큰 입력', s:'x_t'},
  {t:'재귀 블록', s:'공유 파라미터', acc:true},
  {t:'라우터 판단', s:'통과 or 종료'},
  {t:'다음 재귀', s:'최대 N_r회'}
 ]},

math:[
 {expr:'g_t^r = G(θ_r^T · H_t^r) ;  top-k 토큰만 다음 재귀로 통과',
  tex:'g_t^r = \\mathcal{G}\\!\\left(\\theta_r^{\\top}\\mathcal{H}_t^r\\right)',
  d:'expert-choice 라우팅에서 재귀 단계 $r$의 라우터가 토큰 $t$에 매기는 점수. $\\mathcal{G}$는 sigmoid·tanh 같은 활성함수. 이 점수의 상위 $k$개(β-percentile 임계값 이상)만 다음 재귀 블록을 통과한다.'}
],

numbers:[
 {k:'실험 규모', v:'135M~1.7B 파라미터, 동일 FLOPs 비교', d:'FineWeb-Edu로 사전학습, 2e18/5e18/16.5e18 FLOPs 예산 3단계'},
 {k:'few-shot 정확도(예시 규모)', v:'MoR 43.1% > vanilla 기준선', d:'동일 FLOPs 예산에서 검증 손실도 낮음(본문 §3.1 비교)'},
 {k:'추론 처리량 가속', v:'최대 2.06× (MoR-4, B=Max)', d:'360M 규모, 16.5e18 FLOPs 학습, continuous depth-wise batching 적용, 성능은 소폭 저하'},
 {k:'소형 모델 열위 구간', v:'135M에서는 vanilla보다 열세, 360M부터 역전/우위', d:'저자들은 "재귀 용량 병목"으로 추정 — 규모가 커지면 격차 해소'}
],

impact:'MoR는 파라미터 공유와 적응적 계산이라는 두 효율화 축을 "재귀 깊이를 토큰마다 다르게 학습"하는 하나의 메커니즘으로 통합했다. 라우터를 처음부터 함께 학습시켜 추론 시점 행동과 학습을 일치시킨 점은, 기존 early-exit 방법들이 필요로 했던 사후(post-hoc) 라우팅 단계를 없앴다. 재귀 깊이별 KV 캐싱이 계산과 메모리 효율을 동시에 얻는 설계로 제시되면서, "적응적 깊이"와 "효율적 캐싱"을 분리된 문제가 아니라 한 설계의 두 결과로 보는 관점을 남겼다.',

legacy:[
 '[Universal Transformer](#/p/universal-transformer)의 "반복 적용으로 깊이를 대체한다"는 아이디어에 토큰별 적응적 깊이를 더한 직계 후속',
 'expert-choice/token-choice 라우팅 비교가 이후 재귀·조건부 계산 아키텍처의 라우팅 설계 선택지로 참조됨',
 '재귀 단계별 KV 캐싱 전략(recursion-wise vs recursive sharing)이 적응적 깊이 모델의 메모리 최적화 표준 논의로 자리잡음',
 '"test-time scaling"을 recursion 횟수로 구현할 수 있다는 관찰이, 추론 시점에 더 생각하게 만드는 다른 접근들과 비교되는 참조점이 됨'
],

pitfalls:[
 '**작은 모델(135M)에서는 vanilla Transformer보다 못하다.** 저자들도 "재귀 용량 병목"으로 추정할 뿐 완전히 규명하지는 않았다 — 규모가 작을 때는 이 아키텍처의 이점을 기대하기 어렵다.',
 '**2.06× 처리량 가속은 360M 모델·continuous depth-wise batching·B=Max(최대 배치) 조건에서 나온 수치이며, 약간의 성능 저하를 동반한다.** 조건 없이 "2배 빠르다"로 일반화하면 안 된다.',
 '**expert-choice 라우팅은 학습 중 미래 토큰 정보를 참조하는 인과성 위반 문제가 있다.** 이를 보완하려면 보조 라우터나 정규화가 필요하며, 이는 완전히 해결된 문제가 아니라 트레이드오프로 남아 있다.'
],

figures:[
 {f:'fig1-overview.png',
  cap:'가운데: 공유 재귀 블록(회색 상자)을 레이어 0부터 최대 N_r번 반복 통과. 오른쪽: 실제 라우팅 패턴 — 진한 칸일수록 그 토큰이 그 재귀 단계에서 활성(계산됨), 연한 칸은 이미 종료(스킵)된 토큰. 아래 문장은 토큰마다 실제로 거친 재귀 횟수를 색으로 표시(1/2/3).',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'MoR reuses a shared stack of layers across recursion steps to achieve parameter efficiency, while lightweight routers enable adaptive token-level thinking by dynamically assigning different recursion depths to individual tokens.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2507.10524 — Mixture-of-Recursions: Learning Dynamic Recursive Depths for Adaptive Token-Level Computation', u:'https://arxiv.org/abs/2507.10524'},
 {t:'GitHub — raymin0223/mixture_of_recursions', u:'https://github.com/raymin0223/mixture_of_recursions'}
]
});
