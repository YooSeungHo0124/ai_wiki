WIKI.paper({
slug:'moba',
venue:'Technical Report, 2025',
authors:'Lu, Jiang, Liu et al. (Moonshot AI · Tsinghua University · Zhejiang Lab)',
arxiv:'2502.13189',

tldr:'attention을 [MoE](#/p/switch)처럼 취급해, 각 쿼리가 라우터를 통해 과거 KV를 블록 단위로 top-k개만 골라 attend하게 만든 논문(Moonshot/Kimi). 필요하면 언제든 [Full Attention](#/p/transformer)으로 되돌릴 수 있는 것이 특징이고, 1M 토큰 프리필에서 6.5배, 10M 토큰까지 늘리면 16배 빨라진다.',

context:'긴 문맥을 다루는 기존 접근은 두 극단으로 나뉘어 있었다. 하나는 sliding window나 attention sink처럼 **미리 정해진 구조적 편향**을 넣는 방식으로, 특정 태스크에는 맞지만 일반화가 어렵다. 다른 하나는 선형 attention처럼 **attention 메커니즘 자체를 근본적으로 바꾸는** 방식으로, 복잡한 추론 과제에서의 성능이 충분히 검증되지 않았다. 이 논문은 "구조를 덜 강제하자(less structure)"는 원칙을 세운다 — 어디에 attend할지 미리 정하지 말고 **모델이 스스로 정하게** 하자는 것이다. 비슷한 문제의식을 [NSA](#/p/nsa)도 같은 시기(2025년 2월)에 다뤘지만, MoBA는 이를 [MoE](#/p/switch)의 라우팅 문제로 직접 치환한다는 점이 다르다.',

ideas:[
 {h:'attention을 MoE 라우팅으로 재정의',
  lead:'과거 KV를 블록으로 나누고, 각 쿼리가 라우터로 top-k개 블록만 선택해 attend한다.',
  d:'길이 $N$ 의 컨텍스트를 $n$개 블록(크기 $B=N/n$)으로 나눈다. 각 쿼리는 자신과 블록 평균 키의 내적으로 친화도 점수 $s_i$ 를 계산하고, MoE의 top-k 게이팅을 그대로 가져와 점수가 높은 $k$개 블록만 선택한다(식 5·6). 선택되지 않은 블록은 그 쿼리에 대해 아예 계산되지 않는다 — FFN에서 쓰던 top-k 전문가 선택을 시퀀스 길이 축에 그대로 적용한 것이다.'},
 {h:'인과성 보존: 미래 블록 차단 + 현재 블록 강제 포함',
  lead:'미래 블록의 게이트를 강제로 0으로 만들고, 쿼리가 속한 현재 블록은 causal mask와 함께 항상 포함한다.',
  d:'자기회귀 생성에서는 미래 토큰을 보면 안 되므로, 쿼리 위치보다 뒤에 있는 블록은 점수를 $-\\infty$ 로 만들어 절대 선택되지 않게 한다. 또한 블록 평균 풀링이 미래 토큰 정보를 섞어 넣을 수 있는 "현재 블록" 문제는, 그 블록을 항상 강제로 포함시키고 그 안에서만 causal mask를 적용해 해결한다. 이 현재-블록 강제 포함은 MoE의 **shared expert**와 같은 역할을 한다.'},
 {h:'Full Attention과 자유롭게 전환 가능',
  lead:'MoBA는 파라미터를 추가·삭제하지 않으므로 층마다, 또는 학습 도중에도 Full Attention으로 되돌릴 수 있다.',
  d:'MoBA는 새 파라미터를 만들지 않는 순수한 attention 패턴 변경이라서, 각 층이 초기화 시점에 MoBA와 Full Attention 중 하나를 고를 수 있고 학습 중간에 전환도 가능하다. 실제로 sliding window attention과 attention sink는 각각 "가장 최근 블록만 고르는 라우터"와 "처음+최근 블록을 고정 선택하는 라우터"를 쓰는 MoBA의 특수 사례로 해석할 수 있다 — MoBA가 이 둘을 포함하는 더 일반적인 표현력을 갖는다.'}
],

diagram:{type:'split', cap:'각 쿼리가 라우터를 거쳐 4개 KV 블록 중 top-2 블록만 선택해 attention score를 계산한다.',
 from:{t:'쿼리 q'},
 branches:[
  {t:'라우터(Top-k 게이트)', acc:true},
  {t:'선택된 블록', s:'attention 계산'},
  {t:'미선택 블록', s:'계산 생략', off:true}
 ], join:'선택된 블록끼리만 varlen FlashAttention'},

math:[
 {expr:'MoBA(q,K,V) = softmax(qK[I]ᵀ) V[I]',
  tex:'\\text{MoBA}(q,K,V) = \\text{Softmax}\\!\\left(qK[\\mathcal{I}]^{\\top}\\right)V[\\mathcal{I}]',
  d:'$I$ 는 라우터가 선택한 블록들의 키·값 인덱스 합집합. 선택되지 않은 위치는 attention 계산에서 아예 빠진다.'},
 {expr:'g_i = 1 if s_i ∈ Topk({s_j}, k) else 0,  s_i = ⟨q, mean_pool(K[I_i])⟩',
  tex:'g_i=\\begin{cases}1 & s_i \\in \\text{Topk}(\\{s_j \\mid j\\in[n]\\},k)\\\\0 & \\text{otherwise}\\end{cases},\\quad s_i=\\langle q,\\ \\text{mean\\_pool}(K[I_i])\\rangle',
  d:'블록 친화도 점수는 쿼리와 그 블록 키 평균의 내적. [Switch Transformer](#/p/switch) 등 MoE의 top-k 게이팅 수식을 그대로 시퀀스 블록에 적용했다.'}
],

numbers:[
 {k:'속도 측정 조건', v:'Llama-8B급, FlashAttention 대비, GPU 텐서병렬', d:'1M 컨텍스트로 학습된 모델의 attention 층만 비교'},
 {k:'1M 토큰 프리필 속도향상', v:'최대 6.5×', d:'8K~1M 길이 구간, MoBA vs Flash Attention'},
 {k:'10M 토큰까지 확장', v:'16× 연산시간 감소', d:'희소도 95.31% 고정(블록 64개, top-k=3), 쿼리-헤드 축 텐서병렬로 확장'},
 {k:'속도 이득이 나타나는 시점', v:'512K 이전에는 격차 미미, 이후 급격히 벌어짐', d:'32K~512K 구간에서는 두 방식이 비슷하다가 문맥이 늘수록 격차 확대'},
 {k:'1.5B 모델, 32K 길이 하이브리드', v:'RULER@128K: 0.7818(MoBA) vs 0.7849(Full)', d:'8B 모델을 128K→1M으로 지속학습, 블록 4096·top-12(희소도 95.31%)'},
 {k:'스케일링 법칙', v:'LM loss ≈ 2.622×C^-0.063(MoBA) vs 2.625×C(Full)', d:'Chinchilla 방식 연산량-손실 적합, 두 곡선이 거의 겹침'}
],

impact:'attention 계산량을 줄이는 문제를 "어떤 값을 버릴까"가 아니라 "MoE 라우팅 문제를 어떻게 풀까"로 치환한 것이 이 논문의 실질적 기여다. Full Attention과 파라미터 변경 없이 전환 가능하다는 점은 실무적으로 중요한데, 학습은 저렴한 희소 모드로 하고 품질이 민감한 마지막 몇 층이나 생성 단계에서는 Full Attention으로 되돌리는 하이브리드 배포가 가능해진다. Moonshot이 Kimi의 실제 장문맥 서비스에 이미 배포했다고 명시한 몇 안 되는 희소 attention 논문이기도 하다.',

legacy:[
 '**MoE 라우팅과 attention 희소화의 정식 결합** — [NSA](#/p/nsa)가 압축 attention 점수를 재활용하는 것과 달리, MoBA는 별도의 경량 라우터로 블록을 고른다는 점에서 두 계열의 설계가 갈림',
 'sliding window·attention sink를 "게이팅 방식이 고정된 MoBA의 특수 사례"로 재해석 — 정적 희소 attention과 학습된 희소 attention을 하나의 틀로 통합',
 '층별·학습 단계별로 MoBA↔Full Attention을 전환하는 하이브리드 전략이 이후 장문맥 모델의 실용적 배포 패턴으로 참조됨',
 'Kimi의 실제 서비스에 배포된 사례로, 학술적 벤치마크를 넘어 프로덕션 검증까지 보고한 드문 희소 attention 연구'
],

pitfalls:[
 '**속도 이득은 아주 긴 문맥에서만 뚜렷하다.** 32K~512K 구간에서는 Full Attention과 큰 차이가 없고, 6.5×·16× 같은 수치는 각각 1M·10M 토큰까지 늘렸을 때의 결과다 — 일반적인 짧은 문맥 서빙에 그대로 기대하면 안 된다.',
 '**"성능 저하 없음"의 근거는 1.5B~8B 규모 모델과 특정 벤치마크 세트에 국한된다.** 더 큰 모델이나 다른 태스크 분포에서도 같은 결론이 유지되는지는 이 리포트만으로 보장되지 않는다.',
 '**정식 학회 리뷰를 거친 논문이 아니라 Technical Report다.** arXiv 버전이 실험 세부사항의 최종본이며, 이후 개정될 수 있다.'
],

figures:[
 {f:'fig1a-routing.png', cap:'쿼리 q1·q2가 라우터를 거쳐 4개 블록 중 2개씩만 선택(실선/점선 화살표)한다. 선택된 블록의 키·값만 모아 Attn score를 계산 — 선택되지 않은 블록(옅게 표시)은 그 쿼리에 대해 아예 계산되지 않는다.', src:'원문 Figure 1(a), p.3'},
 {f:'fig2a-speedup.png', cap:'시퀀스 길이가 32K에서 1M으로 늘어날 때 연산 시간(ms). Full Attention(하늘색)은 거의 제곱으로 증가하지만 MoBA(파랑)는 완만하게 늘어 1M에서 격차가 가장 크다 — 짧은 길이(32K~256K)에서는 두 곡선이 거의 붙어 있다는 점도 함께 보면 좋다.', src:'원문 Figure 2(a), p.5'}
],

quotes:[
 {t:'In this work, we propose a solution that adheres to the "less structure" principle, allowing the model to determine where to attend autonomously, rather than introducing predefined biases.', src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2502.13189 — MoBA: Mixture of Block Attention', u:'https://arxiv.org/abs/2502.13189'},
 {t:'GitHub — MoonshotAI/MoBA', u:'https://github.com/MoonshotAI/MoBA'}
]
});
