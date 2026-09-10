WIKI.paper({
slug:'gshard',
venue:'arXiv 2020 (preprint)',
authors:'Lepikhin, Lee, Xu, Chen, Firat, Huang, Krikun, Shazeer, Chen (Google)',
arxiv:'2006.16668',

tldr:'[Sparse MoE](#/p/moe-shazeer)를 실제로 **6,000억 파라미터** 다국어 번역 모델에 올려, 2048개 TPU v3로 4일 만에 학습해냈다. 핵심은 모델을 어떻게 쪼갤지를 몇 줄의 **샤딩 주석(annotation)**으로만 표시하고, 나머지 병렬화는 컴파일러가 알아서 하게 만든 것이다.',

context:'2020년 시점 대규모 모델 병렬화는 두 갈래로 나뉘어 있었다. 하나는 [Megatron](#/p/megatron)처럼 텐서 연산을 손으로 쪼개 특정 아키텍처에 맞춘 코드를 새로 짜는 방식이고, 다른 하나는 [GPipe](#/p/gpipe)류의 파이프라인 병렬처럼 층 단위로 장치를 나누는 방식이다. 두 방식 모두 장치 수가 늘어나면 계산 그래프 자체가 장치 수에 비례해 커져($O(D)$), 통신 채널까지 고려하면 $O(D^2)$까지 불어나 컴파일 시간이 감당할 수 없이 늘어난다. 게다가 [Sparse MoE](#/p/moe-shazeer)는 전문가(expert)마다 다른 장치에 놓아야 하는데, 이런 조건부 계산 구조를 기존 프레임워크의 그래프 분할 방식으로 표현하기가 까다로웠다. 이 논문의 질문은 "모델 코드를 거의 바꾸지 않고, 임의의 장치 수로 확장 가능한 방식으로 샤딩을 표현할 수 있는가"이다.',

ideas:[
 {h:'샤딩 주석: 병렬화를 컴파일러에 위임',
  lead:'replicate()·split()·shard() 세 API로 텐서 분할만 표시하면 컴파일러가 나머지를 채운다.',
  d:'모델 코드에는 `replicate(tensor)`, `split(tensor, dim, n)`, `shard(tensor, device_assignment)` 몇 줄만 추가한다. 이 주석은 텐서를 실제로 자르지 않고 "이렇게 나눠 달라"는 힌트만 컴파일러(XLA)에 전달하며, 나머지 텐서의 샤딩은 컴파일러가 전파 규칙으로 추론한다. 결과적으로 모델 개발자는 시스템 최적화를 몰라도 되고, 병렬화 전략을 바꿀 때 모델 코드를 다시 쓸 필요가 없다.'},
 {h:'SPMD 컴파일: 장치 수와 무관한 $O(1)$ 컴파일 시간',
  lead:'장치마다 다른 프로그램(MPMD) 대신 하나의 프로그램을 모든 장치에 복제해 돌린다(SPMD).',
  d:'기존 MPMD 방식은 장치별로 별도의 연산 그래프를 만들어 장치 수만큼 컴파일 비용이 늘어난다. GShard는 **하나의 프로그램**을 만들어 모든 장치가 동일 코드를 실행하되 자기 파티션 데이터만 다루게 한다. 그 결과 컴파일 시간이 장치 수에 의존하지 않아, 수천 개 장치로 확장해도 컴파일이 병목이 되지 않는다.'},
 {h:'Position-wise MoE: 층의 절반만 전문가로 교체',
  lead:'Transformer의 FFN 층을 한 칸 걸러 하나씩 top-2 게이팅 MoE 층으로 바꾼다.',
  d:'encoder·decoder 모두에서 FFN 층을 하나 걸러 [Sparse MoE](#/p/moe-shazeer) 층으로 교체한다. 각 토큰은 게이팅 네트워크가 고른 최대 2개의 전문가(FFN)만 통과하므로, 전문가 수(파라미터)를 늘려도 토큰 하나가 실제로 거치는 연산량은 거의 그대로다. 이 성질이 파라미터 수 대비 연산량이 준선형(sub-linear)으로 느는 근거다.'},
 {h:'All-to-All 디스패치와 보조 손실로 부하를 분산',
  lead:'토큰을 전문가로 보내는 통신은 All-to-All로, 쏠림은 auxiliary loss로 막는다.',
  d:'게이팅이 고른 전문가가 다른 장치에 있으므로, 토큰들을 해당 장치로 보내고(dispatch) 결과를 다시 모으는(combine) 과정이 All-to-All 통신 두 번으로 구현된다. 그런데 게이팅을 그대로 두면 소수 전문가에 토큰이 몰려 나머지는 학습이 안 되는 문제가 생긴다. 그래서 전문가별 처리 비율에 비례하는 auxiliary loss 항을 추가해, 게이팅이 균등하게 분산하도록 유도한다. 전문가 하나가 받을 수 있는 토큰 수도 상한(capacity)을 둬 넘치는 토큰은 버린다.'}
],

diagram:{type:'compare', cap:'MPMD와 SPMD 파티셔닝 비교 — 같은 연산을 4개 장치에 나눌 때 컴파일러가 만드는 프로그램 개수가 다르다.',
 left:{t:'기존: MPMD', items:['장치마다 별도 그래프 생성','장치 수만큼 컴파일 비용 증가','조건부 계산 표현이 어려움']},
 right:{t:'GShard: SPMD', items:['하나의 프로그램을 전체 복제','컴파일 시간이 장치 수와 무관','주석만으로 샤딩 지정']}},

math:[
 {expr:'G_s,E = GATE(x_s);  FFN_e(x_s) = wo_e · ReLU(wi_e · x_s);  y_s = Σ_e G_s,e · FFN_e(x_s)',
  tex:'\\begin{aligned}\\mathcal{G}_{s,E} &= \\text{GATE}(x_s)\\\\ \\text{FFN}_e(x_s) &= wo_e \\cdot \\text{ReLU}(wi_e \\cdot x_s)\\\\ y_s &= \\sum_{e=1}^{E}\\mathcal{G}_{s,e}\\cdot \\text{FFN}_e(x_s)\\end{aligned}',
  d:'게이팅 벡터 $\\mathcal{G}_{s,E}$ 는 대부분 0이고 top-2 전문가에 해당하는 두 값만 0이 아니다. 출력 $y_s$ 는 그 두 전문가 출력의 가중합이라, 전문가 수 $E$ 를 늘려도 토큰당 실제 계산량은 늘지 않는다.'}
],

numbers:[
 {k:'최대 모델 크기', v:'6,000억 파라미터', d:'2048E, 36층 MoE Transformer(모델 id (1))'},
 {k:'학습 자원 · 시간', v:'TPU v3 2048코어 · 4일', d:'총 22.4 TPU v3 core-year'},
 {k:'파라미터 대비 연산 증가', v:'16배 → 3.6배', d:'37.5B→600B로 16배 키웠지만 학습 비용은 6→22 core-year로 3.6배만 증가'},
 {k:'품질 비교 기준', v:'100개 언어 → 영어 번역(∆BLEU)', d:'양자 언어쌍 100개 베이스라인 대비 평균 BLEU 향상'},
 {k:'베이스라인 전체 학습 비용', v:'29 TPU v3 core-year', d:'100개 개별 양자 번역 모델을 따로 학습할 때 필요한 비용 — 600B 모델(22 core-year)보다 오히려 큼'},
 {k:'토큰당 활성 경로', v:'top-2 전문가', d:'전문가 총수(최대 2048개)와 무관하게 토큰마다 최대 2개만 활성화'}
],

impact:'GShard는 "모델 코드는 그대로 두고 병렬화 전략만 갈아끼운다"는 관행을 만들었다. 샤딩을 모델 정의와 분리된 **주석**으로 표현하는 아이디어는 이후 GSPMD·JAX의 `pjit`/`shard_map` 같은 컴파일러 기반 병렬화의 직접적인 전신이 됐다. 또한 6,000억 파라미터 MoE를 실제로 4일 만에 학습해내면서, "파라미터 수를 늘려도 연산량이 그만큼 늘지 않는다"는 [Sparse MoE](#/p/moe-shazeer)의 이론적 가능성을 산업 규모에서 처음 증명한 사례가 됐다.',

legacy:[
 '**MoE 시스템의 기준점** — [Switch Transformer](#/p/switch)가 top-1 게이팅으로 단순화하며 GShard의 라우팅·용량 개념을 그대로 계승',
 '**샤딩 주석의 표준화** — 이후 GSPMD로 일반화되어 XLA/JAX 생태계의 `pjit` 기반 병렬화로 이어짐',
 '**오픈 MoE 계열로 확산** — [Mixtral](#/p/mixtral) 등 이후 공개 MoE 모델들이 top-2 게이팅·auxiliary loss라는 GShard·Switch의 설계를 그대로 물려받음',
 '**"조건부 계산이 실전에서 통한다"는 증명** — 이후 대형 모델 설계에서 MoE가 파라미터를 늘리는 표준 수단 중 하나로 자리잡음'
],

pitfalls:[
 '**6,000억은 "학습에 관여한" 파라미터 총량이지, 토큰 하나가 쓰는 연산량이 아니다.** 실제 활성 파라미터는 top-2 게이팅 때문에 훨씬 적다 — 이 구분을 놓치면 MoE 모델의 연산 비용을 과대평가하게 된다.',
 '**All-to-All 통신 비용을 무시하면 안 된다.** 전문가를 장치별로 흩뿌리는 대가로 dispatch·combine 두 번의 All-to-All이 매 MoE 층마다 발생하며, 이 통신이 실제 학습에서 종종 병목이 된다.',
 '**auxiliary loss 계수를 잘못 잡으면 품질이 떨어진다.** 부하 분산을 너무 강하게 강제하면 게이팅이 실제로 유용한 전문가 선택을 포기하고 균등 분배 자체를 목표로 삼는 부작용이 있다.'
],

figures:[
 {f:'fig1-sublinear-scaling.png',
  cap:'왼쪽 축(빨강)이 번역 품질 ∆BLEU, 오른쪽 축이 학습 소요일(파랑)과 TPU core-year(회색 점선). 모델을 37.5B→600B로 16배 키우는 동안 품질은 계속 오르고 학습 일수는 오히려 줄었는데(장치를 함께 늘렸으므로), 총 연산 비용(core-year)은 6→22년으로 파라미터 증가폭보다 훨씬 완만하게 늘었다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig3-moe-sharding.png',
  cap:'왼쪽이 원래 Transformer encoder 블록. 가운데는 FFN 절반을 MoE 층(빨간 테두리, Gating+FFN₁…FFN_E)으로 바꾼 구조. 오른쪽이 그 MoE 층을 Device 1…E에 흩뿌린 뒤 All-to-All Dispatch/Combine으로 토큰을 주고받는 실제 배치도 — attention·FFN은 모든 장치에 복제되고 MoE 층만 샤딩된다.',
  src:'원문 Figure 3, p.5'}
],

quotes:[
 {t:'GShard enabled us to scale up multilingual neural machine translation Transformer model with Sparsely-Gated Mixture-of-Experts beyond 600 billion parameters using automatic sharding.',
  src:'Abstract, p.1'},
 {t:'Note that the compilation time with our SPMD partitioning is not-dependent of the number of devices being used.',
  src:'Figure 2 caption, p.4'}
],

links:[
 {t:'arXiv 2006.16668 — GShard', u:'https://arxiv.org/abs/2006.16668'},
 {t:'Switch Transformer (후속 단순화)', u:'https://arxiv.org/abs/2101.03961'}
]
});
