WIKI.paper({
slug:'test-time-scaling',
venue:'arXiv 2024 (Google DeepMind / UC Berkeley)',
authors:'Snell, Lee, Xu, Kumar (UC Berkeley · Google DeepMind)',
arxiv:'2408.03314',

tldr:'모델을 더 키우는 대신 **추론(테스트 타임)에 계산을 더 쓰면 얼마나 이득인가**를 체계적으로 측정한 논문. 정답은 "문제 난이도에 따라 다르다"이며, 그 난이도별 최적 전략을 고르는 것만으로 best-of-N 대비 **4배 이상** 적은 계산으로 같은 정확도를 낸다.',

context:'2024년 중반까지 테스트 타임 계산 확장에 대한 결과는 엇갈렸다. best-of-N 샘플링이나 [Self-Consistency](#/p/self-consistency) 같은 다수결 기법은 되기도 하고 안 되기도 했고, 왜 그런지 체계적으로 설명한 연구가 없었다. OpenAI o1 발표 이전 시점에 나온 이 논문은 "무작정 더 생성해서 고르기"와 "생성 과정 자체를 바꾸기"를 구분하고, 각각을 어떻게 최적으로 쓸지 정량적으로 답한다. [PaLM 2](#/p/palm2)-S* 하나만 갖고, 튜닝을 통해 [DeepSeek-R1](#/p/deepseek-r1) 이전 시대에 "생각을 더 시키면 작은 모델이 큰 모델을 이길 수 있는가"라는 질문에 처음으로 정량적 조건을 붙였다.',

ideas:[
 {h:'테스트 타임 계산의 두 축: 검증기 탐색 vs 분포 수정',
  lead:'PRM으로 탐색하는 방법과, 모델 스스로 답을 고쳐 쓰게 하는 방법은 서로 다른 축이다.',
  d:'축 (1)은 process reward model(PRM)을 학습해 **여러 후보 중 어느 것이 맞는지 탐색**하는 것 — best-of-N, beam search, lookahead search가 여기 속한다. 축 (2)는 모델이 자기 답을 순차적으로 **수정(revision)**하도록 파인튜닝해 제안 분포 자체를 바꾸는 것이다. 둘은 배타적이지 않고 섞어 쓸 수 있으며, 논문은 각각의 확장 곡선을 따로 측정한다.'},
 {h:'난이도별 compute-optimal 전략',
  lead:'쉬운 문제는 순차 수정이, 어려운 문제는 병렬 탐색이 유리하다 — 하나의 전략은 없다.',
  d:'PRM이 매긴 난이도(정답률 기반 5단계 bin)별로 최적 전략이 갈린다. 쉬운 문제는 모델의 초기 답이 방향은 맞고 다듬기만 하면 되므로 **순차적 revision**이 유리하고, 어려운 문제는 애초에 다른 풀이 전략을 여러 번 시도하는 **병렬 샘플링**이 유리하다. 프롬프트마다 이 배분을 적응적으로 고르는 것이 "compute-optimal scaling strategy"이며, 고정 배분(예: 항상 best-of-N)보다 일관되게 낫다.'},
 {h:'compute-optimal이 best-of-N보다 4배 효율적',
  lead:'같은 정확도를 내는 데 필요한 생성 예산이 best-of-N의 4분의 1이면 충분하다.',
  d:'MATH 데이터셋에서 compute-optimal 배분 정책은 고정된 best-of-N(파라미터를 조정하지 않는) 기준선과 같은 정확도를 **4배 이상 적은 생성 예산**으로 달성한다. revision 설정과 PRM 탐색 설정 모두에서 이 격차가 예산이 커질수록 벌어진다.'},
 {h:'FLOPs 매칭 비교: 14배 큰 모델을 이기는 조건',
  lead:'추론 부하가 작고(R≪1) 문제가 쉬우면 작은 모델+테스트 타임 계산이 14배 큰 모델을 이긴다.',
  d:'사전학습 FLOPs를 $X=6ND_{pretrain}$, 추론 FLOPs를 $Y=2ND_{inference}$로 근사하고, 파라미터를 14배 키운 모델과 총 FLOPs를 맞춰 비교했다. **추론 토큰 대비 사전학습 토큰의 비율 $R$**이 작을 때(즉 앞으로 감당할 추론량이 적을 때, $R\\ll1$)와 문제가 쉽거나 중간 난이도일 때는 작은 모델+테스트 타임 계산이 14배 큰 모델의 그리디 pass@1을 이긴다. 반대로 $R\\gg1$(대규모 서빙처럼 추론량이 사전학습량보다 훨씬 클 때)이거나 문제가 어려우면 사전학습에 투자하는 쪽이 낫다.'},
 {h:'PRM 학습은 인간 라벨 없이',
  lead:'몬테카를로 롤아웃으로 스텝별 reward-to-go를 추정해 PRM을 만든다.',
  d:'PRM800K 같은 사람이 라벨링한 데이터 대신, [Self-Consistency](#/p/self-consistency) 계열 연구(Wang et al.)의 방식을 따라 각 스텝에서 여러 번 롤아웃해 최종 정답 도달률을 그 스텝의 가치로 쓴다. 이렇게 학습한 PRM이 ORM(전체 답만 채점)보다 일관되게 나은 탐색 신호를 준다.'}
],

diagram:{type:'compare', cap:'테스트 타임 계산을 쓰는 두 가지 축과, 그것을 고르는 기준.',
 left:{t:'검증기 탐색 (PRM)', items:['N개 답 생성 후 최고점 선택','beam/lookahead로 스텝별 탐색','어려운 문제에 유리']},
 right:{t:'제안 분포 수정 (Revision)', items:['모델이 자기 답을 순차 수정','초기 답이 맞는 방향일 때 유리','쉬운 문제에 유리']}},

math:[
 {expr:'X = 6·N·D_pretrain,   Y = 2·N·D_inference',
  tex:'X=6ND_{\\text{pretrain}},\\qquad Y=2ND_{\\text{inference}}',
  d:'사전학습·추론 FLOPs 근사식. 파라미터 $N$을 $M$배 키우면 두 항 모두 $M$배로 늘어 총 FLOPs가 $M(X+Y)$가 된다.'},
 {expr:'R = D_inference / D_pretrain',
  tex:'R=\\dfrac{D_{\\text{inference}}}{D_{\\text{pretrain}}}',
  d:'추론 토큰 대 사전학습 토큰의 비율. $R\\ll1$이면 테스트 타임 계산이, $R\\gg1$이면 사전학습이 유리한 쪽으로 결론이 갈린다.'}
],

numbers:[
 {k:'효율 개선', v:'>4×', d:'compute-optimal 배분이 고정 best-of-N과 같은 정확도를 내는 데 필요한 생성 예산의 비율(MATH)'},
 {k:'FLOPs 매칭 비교', v:'14× 파라미터', d:'쉬운/중간 난이도 문제·낮은 추론부하($R\\ll1$)에서 작은 모델+테스트 타임 계산이 14배 큰 모델의 그리디 pass@1을 능가'},
 {k:'R 실험값', v:'0.16 / 0.79 / 22', d:'각각 $R\\ll1$, $R\\approx1$, $R\\gg1$ 상황을 대표하는 세 비율'},
 {k:'쉬운 문제 개선폭', v:'+21.6%~+27.8%', d:'$R\\ll1$일 때 easy/medium 문제에서 test-time compute가 얻는 상대 정확도 개선(revision 설정)'},
 {k:'어려운 문제 손해폭', v:'-37.2%', d:'$R\\gg1$일 때 hard 문제에서 test-time compute가 오히려 정확도를 깎는 폭(revision 설정)'}
],

impact:'이 논문 이후 "추론 능력은 학습이 아니라 추론 시점에도 늘릴 수 있다"는 아이디어가 정량적 근거를 갖게 됐다. 검증기 탐색과 분포 수정이라는 구분, 그리고 난이도 적응적 배분이라는 틀은 이후 [DeepSeek-R1](#/p/deepseek-r1)·[s1](#/p/s1-simple)·[Kimi k1.5](#/p/kimi-k15) 같은 추론 모델들이 "얼마나 생각하게 할 것인가"를 설계할 때의 공통 어휘가 됐다. 다만 이 논문 자체는 새 모델을 내놓은 것이 아니라, 기존 PaLM 2-S*로 **측정 방법론**을 세운 연구다.',

legacy:[
 '**난이도 적응적 사고** — [s1](#/p/s1-simple)의 budget forcing, [Kimi k1.5](#/p/kimi-k15)의 길이 페널티가 모두 "얼마나 생각할지"를 조절하는 후속 구현체다',
 '**작은 모델 + 추론 계산** vs **큰 모델**이라는 트레이드오프 프레임이 이후 추론 모델 스케일링 논의의 표준 어휘가 됨',
 '**PRM 기반 탐색**의 한계(어려운 문제에서 정체)가 이후 [DeepSeek-R1](#/p/deepseek-r1)이 PRM 대신 순수 결과 기반 RL로 방향을 튼 배경 중 하나',
 '"test-time compute optimal scaling"이라는 용어 자체가 2025년 추론 모델 논문들의 표준 인용구가 됨'
],

pitfalls:[
 '**"테스트 타임 계산이 항상 이득"이 아니다.** 어려운 문제나 추론 부하가 큰 배포 환경($R\\gg1$)에서는 오히려 사전학습에 투자하는 편이 낫다는 것이 이 논문의 핵심 조건부 결론이다.',
 '**14배 모델을 이긴다는 결과는 조건부다.** "쉬운/중간 난이도 문제 + 낮은 추론 부하"라는 전제가 빠지면 반대 결론(사전학습이 낫다)이 나온다는 것을 Figure 9가 명시한다.',
 '실험은 PaLM 2-S* 하나, MATH 데이터셋 하나로 수행됐다. AIME·[GPQA](#/p/gpqa) 같은 최신 추론 벤치마크나 [DeepSeek-R1](#/p/deepseek-r1)류의 RL 학습 모델에 그대로 일반화된다고 논문이 주장하지는 않는다.'
],

figures:[
 {f:'fig1-compute-optimal.png',
  cap:'왼쪽: MATH 정확도 대 생성 예산(로그 스케일). Compute Optimal(파랑)이 Parallel/best-of-N(빨강)보다 같은 예산에서 항상 높거나, 같은 정확도를 훨씬 적은 예산으로 낸다. 오른쪽: FLOPs 매칭 비교의 막대그래프 — 추론:사전학습 토큰 비율(x축, ≪1/≈1/≫1) 별로 easy/medium/hard 문제에서 test-time compute가 14배 큰 모델 대비 얻는 상대 개선률. 비율이 커질수록(오른쪽으로 갈수록) 특히 hard 문제에서 막대가 마이너스로 뒤집힌다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'Using this compute-optimal strategy, we can improve the efficiency of test-time compute scaling by more than 4x compared to a best-of-N baseline.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2408.03314', u:'https://arxiv.org/abs/2408.03314'}
]
});
