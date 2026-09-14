WIKI.paper({
slug:'patient-kd',
venue:'EMNLP 2019',
authors:'Sun, Cheng, Gan, Liu (Microsoft Dynamics 365 AI Research)',
arxiv:'1908.09355',

tldr:'[BERT](#/p/bert) 증류를 교사의 **마지막 층 출력만** 맞추던 관행에서, **중간 층들의 [CLS] 표현까지 함께** 맞추는 "patient"(참을성 있는) 교사-학생 방식으로 바꾼 논문. 층을 고르는 두 전략(PKD-Skip, PKD-Last)을 비교해 스킵 방식이 더 낫다는 것을 보였다.',

context:'2019년 BERT-Base는 12층·1.1억 파라미터로, 사전학습에 4~16개 Cloud TPU로 나흘이 걸릴 만큼 무거웠다. 이미 존재하던 BERT용 지식 증류는 교사의 최종 로짓(soft label)만 학생에게 전달했는데, 이 논문은 이 방식으로 학생을 오래 학습시키면 **학습 데이터에서는 교사를 거의 따라잡지만 검증 성능이 일찍 정체**되는 현상을 관찰했다. 저자들은 이를 과적합으로 보고, 교사가 최종 답만 알려주는 게 아니라 **문제를 푸는 중간 과정까지 참을성 있게 보여줘야** 학생이 일반화 능력을 제대로 물려받는다고 가정했다.',

ideas:[
 {h:'Patient-KD: 중간 층의 [CLS] 표현까지 맞춘다',
  lead:'마지막 로짓뿐 아니라 여러 중간 층의 [CLS] 벡터도 정규화 후 맞춘다.',
  d:'각 층에서 [CLS] 토큰의 은닉 벡터 $h_{i,j}$를 뽑아, 학생과 교사의 대응 층 벡터를 L2 정규화한 뒤 평균제곱오차(`L_PT`)로 맞춘다. 최종 손실은 정답 교차엔트로피(`L_CE^s`) + 증류 손실(`L_DS`) + patient 손실(`L_PT`)의 가중합이다. 마지막 층은 이미 `L_DS`(로짓 증류)로 다뤄지므로 `L_PT`에서는 제외한다.'},
 {h:'PKD-Skip: 몇 층씩 건너뛰며 골고루',
  lead:'12층 교사에서 2, 4, 6, 8, 10층처럼 일정 간격으로 골라 맞춘다.',
  d:'BERT12→BERT6 예시에서 $I_{pt}=\\{2,4,6,8,10\\}$을 쓴다. 저수준부터 고수준까지 층별로 다른 성격의 표현을 골고루 전달한다는 것이 의도다.'},
 {h:'PKD-Last: 마지막 몇 층에 집중',
  lead:'교사의 마지막 층들(7~11층)만 골라 맞춘다.',
  d:'같은 예시에서 $I_{pt}=\\{7,8,9,10,11\\}$을 쓴다. 고수준 의미 표현에 집중하지만, 실험 결과 PKD-Skip보다 일관되게 조금 낮은 성능을 보였다 — 저자들은 마지막 층들끼리는 상대적으로 동질적인 의미 정보를 담고 있어 다양성이 떨어지기 때문이라고 추정한다.'},
 {h:'과적합 억제라는 관찰된 효과',
  lead:'vanilla KD는 검증 성능이 일찍 정체되지만 Patient-KD는 계속 개선된다.',
  d:'QNLI·MNLI 학습 곡선(Figure 2)에서 vanilla KD로 학습한 학생은 dev set 성능이 빠르게 포화되는 반면, Patient-KD 학생은 더 늦은 단계까지 개선을 이어간다. 이는 중간 층 신호가 단순한 성능 향상을 넘어 **일반화 자체**를 돕는다는 근거로 제시된다.'}
],

diagram:{type:'compare', cap:'교사의 어느 층에서 지식을 가져오느냐 — PKD-Skip vs PKD-Last.',
 left:{t:'PKD-Skip', items:[
   '2,4,6,8,10층에서 [CLS] 맞춤','저·고수준 표현을 골고루 포착','GLUE 대부분에서 근소 우위']},
 right:{t:'PKD-Last', items:[
   '7~11층(마지막 k개)만 맞춤','고수준 의미에 집중','상대적으로 동질적이라 다양성↓']}},

math:[
 {expr:'L_PT = ΣΣ || h_i,j/||h_i,j|| − h_t_i,Ipt(j)/||h_t_i,Ipt(j)|| ||²',
  tex:'\\mathcal{L}_{PT} = \\sum_{i=1}^{N}\\sum_{j=1}^{M} \\left\\| \\frac{\\mathbf{h}^{s}_{i,j}}{\\lVert \\mathbf{h}^{s}_{i,j} \\rVert_2} - \\frac{\\mathbf{h}^{t}_{i,I_{pt}(j)}}{\\lVert \\mathbf{h}^{t}_{i,I_{pt}(j)} \\rVert_2} \\right\\|_2^2',
  d:'학생의 $j$번째 층 [CLS] 벡터와, 그에 대응하는 교사 층 $I_{pt}(j)$의 [CLS] 벡터를 정규화한 뒤 맞추는 patient 손실. $M$은 학생의 층 수, $N$은 학습 샘플 수.'},
 {expr:'L_PKD = (1−α) L_CE^s + α L_DS + β L_PT',
  tex:'\\mathcal{L}_{PKD} = (1-\\alpha)\\mathcal{L}_{CE}^{s} + \\alpha\\mathcal{L}_{DS} + \\beta\\mathcal{L}_{PT}',
  d:'정답 교차엔트로피, 교사 로짓 증류, patient 중간층 손실 세 항의 가중합. $\\alpha, T$는 vanilla KD에서 가장 잘 된 값으로 고정하고 $\\beta$와 학습률만 추가로 탐색했다.'}
],

numbers:[
 {k:'GLUE 평균 (BERT6, MNLI-m 등)', v:'81.5 vs 80.2', d:'PKD-Skip이 vanilla KD 대비 MNLI-m에서 +1.3, MNLI-mm에서 +1.2'},
 {k:'BERT6-PKD 파라미터', v:'67.0M', d:'교사 BERT12(109M) 대비 약 61%. 임베딩층 24M을 공유해 저장공간 1.64배 절약'},
 {k:'BERT3-PKD 파라미터', v:'45.7M', d:'교사 대비 저장공간 2.4배 절약, 추론 속도 3.73배(52.51s → 27.35s, QNLI 10.5만 샘플 기준)'},
 {k:'PKD-Skip vs PKD-Last (SST-2)', v:'92.0 vs 91.9', d:'대부분 태스크에서 Skip이 근소하게 우세 (표 2, BERT6 기준)'},
 {k:'RACE 테스트 정확도', v:'60.34', d:'vanilla KD(58.74) 대비 +1.6, direct fine-tuning(54.32) 대비 +4.42(KD 자체 효과) 이상'},
 {k:'BERT-Large 교사 대비 이득', v:'12.6M/층', d:'BERT-Large의 층 하나가 BERT-Base보다 훨씬 크지만, 더 큰 교사가 항상 더 나은 학생을 만드는지는 절 4.5에서 별도로 검증'}
],

impact:'"증류는 교사의 최종 출력만 옮기면 된다"는 당시 통념에, 중간 층의 표현까지 감독 신호로 쓰면 학생이 더 잘 일반화한다는 실증을 더했다. 이는 이후 BERT 계열 압축 연구가 하나같이 중간 층 정렬 손실을 채택하는 계기가 됐고, 어떤 층을 얼마나 촘촘히 맞출지(스킵이냐 균등 매핑이냐)가 설계 변수로 굳어졌다.',

legacy:[
 '**중간 층 증류의 표준화** — [TinyBERT](#/p/tinybert)가 임베딩·어텐션·은닉 상태 전체로, [MobileBERT](#/p/mobilebert)가 층별 점진 전이로 이 아이디어를 확장',
 '**층 매핑 문제의 시초** — "교사의 어느 층을 학생의 어느 층에 대응시킬 것인가"라는 질문이 이후 [MiniLM](#/p/minilm)에서는 "매핑 자체가 필요 없게" 만드는 방향으로 발전',
 '**과적합 관점의 증류 해석** — vanilla KD의 조기 포화를 과적합으로 설명한 관찰은 이후 증류 연구에서 정규화 관점의 논의로 이어짐'
],

pitfalls:[
 '**"층이 많이 겹칠수록 무조건 좋다"가 아니다.** PKD-Last(마지막 층 집중)도 vanilla KD보다는 낫지만 PKD-Skip보다는 대체로 약간 처진다 — 다양한 깊이의 표현을 섞는 것 자체가 이득이지, 단순히 층 수가 아니다.',
 '**MRPC처럼 데이터가 적은 태스크에서는 PKD가 오히려 vanilla KD보다 낮게 나온다.** 저자들은 이를 데이터 부족으로 인한 dev set 과적합으로 설명하며(3회 평균 시 PKD가 근소 우위), 작은 데이터셋에서의 비교는 평균을 내야 신뢰할 수 있다.',
 '**"더 큰 교사(BERT-Large)면 항상 더 나은 학생이 나온다"를 이 논문이 단순 확인해 주지는 않는다** — 절 4.5는 이를 별도로 검증하는 추가 실험이지, 자명한 결론이 아니다.'
],

figures:[
 {f:'fig1-pkd-skip-last.png',
  cap:'왼쪽 PKD-Skip은 교사·학생 층을 2칸씩 건너뛰며(PT Loss) 연결하고, 오른쪽 PKD-Last는 교사의 마지막 6개 층에서만 연결한다. 맨 위 DS Loss는 최종 출력(로짓) 증류, 중간의 PT Loss가 이 논문이 새로 추가한 중간층 손실이다.',
  src:'원문 Figure 1, p.4'}
],

quotes:[
 {t:'Different from previous knowledge distillation methods, which only use the output from the last layer of the teacher network for distillation, our student model patiently learns from multiple intermediate layers of the teacher model for incremental knowledge extraction.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1908.09355 — Patient Knowledge Distillation for BERT Model Compression', u:'https://arxiv.org/abs/1908.09355'},
 {t:'GitHub — intersun/PKD-for-BERT-Model-Compression', u:'https://github.com/intersun/PKD-for-BERT-Model-Compression'}
]
});
