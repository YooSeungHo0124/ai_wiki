WIKI.paper({
slug:'kimi-linear',
venue:'arXiv 2025 (Technical Report, Moonshot AI)',
authors:'Kimi Team (Moonshot AI)',
arxiv:'2510.26692',

tldr:'**Kimi Delta Attention(KDA)**라는 개선된 선형 attention을 [MLA](#/p/deepseek-v2) 풀 attention과 **3:1 비율로 레이어 단위 교차** 배치한 하이브리드. 3B 활성/48B 총 파라미터 모델을 1.4T 토큰으로 학습해, **동일한 학습 레시피에서** 처음으로 풀 attention을 능가했다고 주장하며 1M 문맥에서 KV 캐시 최대 75% 절감·디코딩 처리량 최대 6배를 보고한다.',

context:'[Mamba2](#/p/mamba2)·Gated DeltaNet 계열 선형 attention은 추론 비용을 줄이지만, 장문맥 정밀 검색(retrieval) 성능이 순수 [softmax attention](#/p/transformer)에 못 미치는 것이 일관된 관찰이었다. 그래서 실용적 타협으로 **선형 레이어 다수 + 전역 attention 레이어 소수**를 섞는 하이브리드가 등장했는데, 대부분은 "효율은 얻지만 성능은 풀 attention에 못 미친다"는 트레이드오프를 전제로 했다. Kimi Linear는 이 전제 자체에 도전한다 — **같은 데이터·같은 FLOPs로 공정하게 비교했을 때도** 하이브리드가 풀 attention보다 나을 수 있는지를 묻는다.',

ideas:[
 {h:'KDA: 채널별(fine-grained) 게이트로 델타 규칙을 정제',
  lead:'Gated DeltaNet의 헤드 단위 스칼라 게이트를 채널마다 다른 대각 게이트로 세분화한다.',
  d:'KDA의 상태 갱신은 $S_t=(I-\\beta_t k_t k_t^\\top)\\text{Diag}(\\alpha_t)S_{t-1}+\\beta_t k_t v_t^\\top$ 형태다. 기존 Gated DeltaNet(=Mamba2류)이 헤드 전체에 스칼라 하나로 망각 속도를 정하는 것과 달리, KDA는 $\\text{Diag}(\\alpha_t)$로 **채널마다 다른 감쇠 속도**를 둬 유한한 RNN 상태 메모리를 더 세밀하게 배분한다. 저자들은 이를 DPLR(Diagonal-Plus-Low-Rank) 전이행렬의 특수화된 변형으로 정식화하되, 일반 DPLR보다 계산량을 줄이면서 고전적 델타 규칙과의 일관성은 유지했다.'},
 {h:'레이어 단위 3:1 하이브리드: KDA 3개 + MLA 1개',
  lead:'헤드를 섞는 대신 레이어 전체를 번갈아 쌓아, KDA 3층마다 MLA 1층을 배치한다.',
  d:'같은 레이어 안에서 헤드를 KDA/MLA로 나누는 headwise 방식 대신, 레이어 전체를 번갈아 쌓는 layerwise 방식을 택했다 — 인프라가 단순하고 학습이 안정적이라는 이유다. ablation에서 7:1(더 적은 attention)은 학습 손실은 비슷해도 검증 성능이 떨어지고, 1:1(더 많은 attention)은 검증 손실은 비슷해도 추론 비용이 늘어, **3:1이 품질-처리량 균형점**으로 나왔다.'},
 {h:'NoPE MLA + KDA가 위치 인코딩을 전담',
  lead:'MLA 레이어에는 위치 인코딩을 아예 빼고, 위치·최신성 정보는 KDA 레이어가 전담하게 한다.',
  d:'전역 attention(MLA) 레이어에는 위치 인코딩을 주지 않는 NoPE를 적용하고, 순서·최신성(recency) 정보는 전적으로 KDA 레이어가 책임진다. KDA의 게이트 자체가 위치를 암묵적으로 인코딩하는 역할을 해, 슬라이딩 윈도우 attention(SWA)이나 짧은 컨볼루션 같은 보조 장치보다 더 강한 위치 인식 능력을 제공한다고 저자들은 주장한다.'}
],

diagram:{type:'stack', cap:'Kimi Linear 블록. KDA 레이어 3개마다 MLA 레이어 1개를 쌓고, 각 레이어 뒤에 MoE 채널 믹싱이 붙는다.',
 layers:[
  {t:'입력', s:'토큰 임베딩'},
  {t:'Norm + KDA', s:'채널별 게이트', acc:true, note:'3회 반복(N=3)'},
  {t:'Norm + MoE', s:'채널 믹싱'},
  {t:'Norm + MLA', s:'NoPE, 전역 attention', note:'1회, KV 캐시 필요'},
  {t:'Norm + MoE', s:'채널 믹싱'}
 ]},

math:[
 {expr:'S_t = (I − β_t k_t k_tᵀ) Diag(α_t) S_{t-1} + β_t k_t v_tᵀ ,  o_t = S_tᵀ q_t',
  tex:'S_t=(I-\\beta_t k_t k_t^{\\top})\\,\\text{Diag}(\\alpha_t)\\,S_{t-1}+\\beta_t k_t v_t^{\\top},\\qquad o_t=S_t^{\\top}q_t',
  d:'KDA의 상태 갱신 재귀식. $\\text{Diag}(\\alpha_t)$가 채널별 감쇠를 담당하는 부분이며, 이 대각 게이트 위에서 delta rule의 rank-1 갱신 $(I-\\beta_t k_t k_t^\\top)$을 적용한다.'},
 {expr:'o_t = W_o( Sigmoid(W_g↑ W_g↓ x_t) ⊙ RMSNorm(KDA(q_t,k_t,v_t,α_t,β_t)) )',
  tex:'o_t = W_o\\Big(\\text{Sigmoid}\\big(W_g^{\\uparrow}W_g^{\\downarrow}x_t\\big)\\odot \\text{RMSNorm}\\big(\\text{KDA}(q_t,k_t,v_t,\\alpha_t,\\beta_t)\\big)\\Big)',
  d:'KDA 출력에 저랭크 파라미터화된 데이터 종속 게이트를 곱해 attention sink 문제를 완화한다. 공정한 파라미터 비교를 위해 GDN·Mamba와 같은 저랭크 게이트 형태를 유지했다.'}
],

numbers:[
 {k:'모델 규모', v:'3B 활성 / 48B 총 파라미터', d:'MoE 채널 믹싱, 사전학습 1.4T 토큰'},
 {k:'하이브리드 비율', v:'KDA 3 : MLA 1', d:'ablation에서 7:1보다 검증 성능 우수, 1:1보다 추론 비용 우수'},
 {k:'KV 캐시 절감', v:'최대 75%', d:'풀 MLA 대비, 긴 시퀀스 생성 시'},
 {k:'디코딩 처리량', v:'최대 6×', d:'1M 문맥 길이 기준, 풀 MLA 대비'},
 {k:'TPOT(1M 토큰)', v:'Kimi Linear 1.84ms vs MLA 11.48ms (6.3×)', d:'디코딩 길이가 길어질수록 격차 확대 — 128K~256K에서는 4.8×, 512K에서 5.7×'},
 {k:'MMLU-Pro(4k) / RULER(128k)', v:'51.0 / 84.3', d:'1.4T 토큰 동일 학습 레시피 기준, MLA(47.2/81.3)·GDN-H(47.9/80.5) 상회'}
],

impact:'"선형+전역 하이브리드는 효율은 얻지만 성능은 손해 본다"는 통념에, 같은 학습 토큰 수·같은 레시피로 비교했을 때는 성립하지 않을 수 있다는 반례를 대형 모델 스케일에서 제시했다. NoPE MLA에 위치 인코딩 책임을 KDA로 완전히 넘기는 설계는, 하이브리드에서 "누가 위치를 담당하는가"를 명시적으로 나누는 참조 패턴이 됐다. KDA 커널과 vLLM 구현을 공개해 후속 하이브리드 연구가 처음부터 커널을 새로 짤 필요를 줄였다.',

legacy:[
 '[Mamba2](#/p/mamba2)/Gated DeltaNet의 헤드 단위 스칼라 게이트를 채널 단위로 세분화하는 설계가 이후 선형 attention 변형의 참조점이 됨',
 'layerwise 3:1 비율이 [Nemotron-H](#/p/nemotron-h)류 층 단위 혼합 설계와 함께, 하이브리드 비율 튜닝의 실증 사례로 인용됨',
 'NoPE 전역 레이어 + 위치 인코딩을 선형 레이어에 위임하는 패턴이 이후 하이브리드 아키텍처의 위치 인코딩 설계 지침으로 참고됨',
 'RL 스케일링 실험(Math RL)까지 공정 비교에 포함시켜, 하이브리드 검증 범위를 사전학습 벤치마크 너머로 확장한 선례'
],

pitfalls:[
 '**"처음으로 풀 attention을 이겼다"는 주장은 이 논문 자신의 학습 레시피·데이터·1.4T 토큰 규모 내에서의 공정 비교다.** 다른 데이터 구성이나 훨씬 큰 토큰 수에서도 같은 결론이 유지되는지는 별개 문제다.',
 '**처리량·TPOT 수치는 1M 문맥·특정 배치 설정에서 측정된 것이다.** 짧은 문맥에서는 가속 배수가 훨씬 작다 — Figure 1(b)에서 128K~256K 구간은 4.8배, 4K 근처에서는 격차가 거의 없다.',
 '**KV 캐시가 완전히 사라지는 것은 아니다.** 3:1 비율이라도 4개 층 중 1개(MLA)는 여전히 전역 attention이라 그만큼의 KV 캐시는 남는다 — "최대 75% 절감"이지 100%가 아니다.'
],

figures:[
 {f:'fig3-architecture.png',
  cap:'왼쪽 아래(N×)가 KDA 블록, 왼쪽 위(1×)가 MLA 블록 — 이 둘을 3:1 비율로 번갈아 쌓는다(N=3). 오른쪽은 각 블록 내부: KDA는 Linear→Conv→게이트들을 거쳐 Kimi Delta Attention을 계산하고, MoE는 공유 전문가(초록)와 라우팅 전문가(회색)를 Router가 섞는다.',
  src:'원문 Figure 3, p.6'},
 {f:'fig1-perf-tpot.png',
  cap:'왼쪽: MMLU-Pro(별)·RULER(원) 두 벤치마크 모두에서 Kimi Linear가 같은 디코딩 가속 대비 더 높은 성능(좌상단에 위치). 오른쪽: 디코딩 길이가 늘수록 MLA(점선)의 TPOT가 Kimi Linear(실선)보다 훨씬 빠르게 증가 — 1M 토큰에서 6.3배 차이.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'We introduce Kimi Linear, a hybrid linear attention architecture that, for the first time, outperforms full attention under fair comparisons across various scenarios.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2510.26692 — Kimi Linear: An Expressive, Efficient Attention Architecture', u:'https://arxiv.org/abs/2510.26692'},
 {t:'GitHub — MoonshotAI/Kimi-Linear', u:'https://github.com/MoonshotAI/Kimi-Linear'}
]
});
