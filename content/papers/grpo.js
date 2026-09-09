WIKI.paper({
slug:'grpo',
venue:'arXiv 2024 (DeepSeekMath)',
authors:'Shao, Wang, Zhu, Xu, Song et al. (DeepSeek-AI · 칭화대 · 베이징대)',
arxiv:'2402.03300',

tldr:'[PPO](#/p/ppo)에서 **가치망(critic)을 통째로 제거**하고, 같은 질문에 대해 뽑은 여러 응답의 점수를 서로 비교해 advantage를 구하는 RL 알고리즘. 정책과 같은 크기의 모델 하나를 안 들고 다녀도 되면서 수학 추론 성능은 오히려 올랐고, 이후 [DeepSeek-R1](#/p/deepseek-r1)의 학습 알고리즘이 된다.',

context:'[요약 RLHF](#/p/summarize-hf)와 [InstructGPT](#/p/instructgpt)를 거치며 LLM의 후처리 학습은 사실상 PPO 한 가지로 굳었다. 그런데 PPO를 LLM에 쓰면 메모리에 **모델 네 개**가 동시에 올라간다 — 정책, 참조 정책, 보상 모델, 그리고 가치망. 이 중 가치망이 특히 성가시다. 보통 정책과 비슷한 크기로 잡아야 하고, 별도로 학습시켜야 하며, 무엇보다 **LLM 환경에서 잘 맞지도 않는다**. 보상은 마지막 토큰에서 한 번만 나오는데(정답이냐 아니냐), 가치망은 중간의 모든 토큰마다 "여기서부터의 기대 보상"을 예측해야 한다. 부분적으로 쓰다 만 수식의 가치를 정확히 매기는 일은 원래 어렵다. 이 논문의 관찰은 단순하다 — **보상 모델이 어차피 같은 질문의 응답들을 비교해 학습됐다면, baseline도 같은 질문의 응답들에서 뽑으면 되지 않나?**',

ideas:[
 {h:'baseline을 학습하지 말고 표본에서 만든다',
  lead:'가치망 대신 같은 질문에서 뽑은 응답 그룹의 평균 보상을 baseline으로 쓴다.',
  d:'정책 경사에서 가치망의 역할은 오직 **분산 감소용 baseline**이다. "이 응답이 평균보다 나았나"를 알려주는 기준선이면 무엇이든 된다. GRPO는 질문 $q$ 하나마다 현재 정책에서 응답을 $G$ 개 뽑고, **그 그룹의 보상 평균**을 baseline으로 쓴다. 학습해야 할 모델이 하나 줄고, baseline은 정의상 현재 정책에 대해 항상 최신이다.'},
 {h:'그룹 내 z-정규화된 상대 우위',
  lead:'보상을 그룹 평균으로 빼고 표준편차로 나눠 문제 난이도에 무관한 advantage를 만든다.',
  d:'advantage를 $\\hat A_i = (r_i - \\text{mean}(r)) / \\text{std}(r)$ 로 둔다. 평균을 빼는 것은 baseline이고, 표준편차로 나누는 것이 실용적으로 중요하다 — 쉬운 문제(다 맞음)와 어려운 문제(다 틀림) 사이의 보상 스케일 차이를 없애 **문제 난이도에 무관하게 같은 크기의 경사**를 만든다. 결과 감독(outcome supervision)에서는 이 스칼라 하나가 응답 안의 모든 토큰에 그대로 붙는다.'},
 {h:'보상 모델의 비교적 성질과 형태를 맞춘다',
  lead:'보상 모델 자체가 상대 비교로 학습됐으니 advantage도 상대 비교로 만드는 게 자연스럽다.',
  d:'논문이 강조하는 정당화는 이것이다. 보상 모델은 **같은 질문에 대한 응답들의 비교**로 학습됐으므로, 그 출력의 절대값은 의미가 흐리고 상대 순위가 의미를 갖는다. 그런 보상에 절대값을 예측하는 가치망을 붙이는 것은 애초에 어긋난 조합이고, 그룹 안에서 상대 비교로 advantage를 만드는 쪽이 보상 모델의 성질과 자연스럽게 들어맞는다.'},
 {h:'KL 벌점을 보상이 아니라 손실에 직접 넣는다',
  lead:'참조 정책과의 KL을 advantage에 섞지 않고 목적 함수에 별도 항으로 더한다.',
  d:'PPO 기반 RLHF는 보통 KL 항을 토큰별 보상에서 빼서 advantage 계산에 섞는다. GRPO는 참조 정책과의 KL을 **목적 함수에 별도 항으로** 더한다. advantage 계산이 KL로 오염되지 않아 구조가 단순해지고, 이때 쓰는 추정량은 $\\pi_{ref}/\\pi_\\theta - \\log(\\pi_{ref}/\\pi_\\theta) - 1$ 형태로 **항상 양수이며 분산이 낮은** 불편 추정량이다.'},
 {h:'과정 감독과 반복 RL도 같은 틀에 얹힌다',
  lead:'단계별 보상이면 이후 단계 합으로, 보상 모델이 뒤처지면 재라벨로 같은 틀 안에서 확장한다.',
  d:'추론 단계마다 보상을 주는 과정 감독(process supervision)에서는 각 토큰의 advantage를 **그 이후 단계들의 정규화된 보상 합**으로 두면 된다. 또 학습이 진행되면 보상 모델이 뒤처지므로, 새 정책의 표본을 다시 라벨해 보상 모델을 갱신하는 반복 루프도 같은 알고리즘 안에서 돈다.'}
],

diagram:{type:'compare', cap:'PPO와 GRPO의 차이는 사실상 "baseline을 어디서 얻는가" 한 가지다. GRPO의 advantage는 Â=(r−mean)/std로 그룹 내 상대 우위를 z-정규화한 값이다.',
 left:{t:'PPO: 학습된 가치망',
  items:['모델 4개 상주 (정책·참조·보상·가치)','가치망은 정책과 비슷한 크기','토큰마다 미래 보상 예측 — LLM에선 어려움','KL 벌점을 토큰별 보상에 섞음','GAE로 advantage 계산']},
 right:{t:'GRPO: 그룹 표본',
  items:['모델 3개 (가치망 제거)','질문 하나당 응답 G개 샘플','그룹 내 z-정규화 상대우위','KL을 손실에 별도 항으로 추가','응답 전체에 같은 advantage (결과 감독)']}},

figures:[
 {f:'fig1-ppo-vs-grpo.png',
  cap:'위쪽 PPO 줄에서는 Policy Model의 출력 o가 Reference/Reward/Value 세 모델을 모두 거쳐야 advantage A 하나가 나온다 — Value Model이 별도로 학습되는 상주 모델이라는 점(노란 박스 = 학습 대상, 파란 박스 = 고정)에 주목. 아래쪽 GRPO 줄에서는 Value Model 자리가 통째로 사라지고, 대신 같은 질문 q에서 응답 o1…oG를 여러 개 뽑아 각각 보상 r1…rG를 매긴 뒤 "Group Computation" 한 단계에서 바로 A1…AG를 계산한다 — 즉 advantage가 학습된 모델이 아니라 그룹 안 다른 응답들과의 비교에서 나온다.',
  src:'원문 Figure 4, p.13'},
 {f:'fig2-training-curves.png',
  cap:'x축은 학습 스텝, y축은 정확도. 같은 데이터 소스·1.3B 모델에서 알고리즘만 바꿔 비교한 그래프로, 아래에서 위로 RFT(보라, 오프라인) < Online RFT(초록, 온라인이지만 규칙 기반 보상) < GRPO+OS(주황, 결과 감독) ≤ GRPO+PS(파랑, 과정 감독) 순으로 곡선이 쌓인다. GRPO 두 변형이 꾸준히 가장 위에 있고, 특히 과정 감독(PS)이 결과 감독(OS)보다 근소하게 더 높은 지점에서 안정된다는 것이 이 그림의 요지.',
  src:'원문 Figure 5, p.19'}
],

quotes:[
 {t:'we introduce Group Relative Policy Optimization (GRPO), a variant of Proximal Policy Optimization (PPO), that enhances mathematical reasoning abilities while concurrently optimizing the memory usage of PPO.',
  src:'Abstract, p.1'},
 {t:'However, it is impossible to ensure the reward signal is always reliable, especially in extremely complex tasks. For example, even the PRM800K datasets (Lightman et al., 2023), which have been carefully annotated by well-trained annotators, still contain approximately 20% of incorrectly annotations.',
  src:'Section 6 (Conclusion, Limitation, and Future Work), p.21'}
],

math:[
 {expr:'Â_{i,t} = ( r_i − mean(r₁ … r_G) ) / std(r₁ … r_G)',
  tex:'\\hat{A}_{i,t} = \\dfrac{r_i - \\mathrm{mean}(r_1,\\ldots,r_G)}{\\mathrm{std}(r_1,\\ldots,r_G)}',
  d:'GRPO의 전부라 해도 되는 한 줄. 같은 질문에서 뽑은 $G$ 개 응답의 보상을 z-정규화한 값이 곧 advantage다. 결과 감독에서는 응답 $i$ 안의 모든 토큰 $t$ 가 이 값을 공유한다.'},
 {expr:'J(θ) = E_q, {o_i}~π_old [ (1/G) Σ_i (1/|o_i|) Σ_t min( ρ_{i,t} Â_{i,t}, clip(ρ_{i,t}, 1−ε, 1+ε) Â_{i,t} ) − β D_KL[π_θ ‖ π_ref] ]',
  tex:'\\mathcal{J}(\\theta)=\\mathbb{E}_{q,\\{o_i\\}\\sim\\pi_{old}}\\!\\left[\\frac{1}{G}\\sum_{i=1}^{G}\\frac{1}{|o_i|}\\sum_{t}\\min\\!\\big(\\rho_{i,t}\\hat{A}_{i,t},\\,\\mathrm{clip}(\\rho_{i,t},1-\\epsilon,1+\\epsilon)\\hat{A}_{i,t}\\big) - \\beta D_{KL}[\\pi_\\theta\\Vert\\pi_{ref}]\\right]',
  d:'$\\rho_{i,t} = \\pi_\\theta / \\pi_{old}$ 는 PPO와 같은 중요도 비율이고, clip도 그대로다. 달라진 것은 $\\hat A$ 의 출처와, KL이 보상이 아니라 **목적 함수 바깥에서** 빠진다는 점이다.'},
 {expr:'D_KL[π_θ ‖ π_ref] = π_ref/π_θ − log(π_ref/π_θ) − 1',
  tex:'D_{KL}[\\pi_\\theta\\Vert\\pi_{ref}] = \\frac{\\pi_{ref}}{\\pi_\\theta} - \\log\\frac{\\pi_{ref}}{\\pi_\\theta} - 1',
  d:'로그 비율을 그대로 쓰는 대신 이 형태를 쓴다. 값이 항상 0 이상이라 벌점으로서 성질이 좋고, 표본 분산이 낮다.'}
],

numbers:[
 {k:'GSM8K (Instruct → RL)', v:'82.9% → 88.2%', d:'GRPO만 적용한 결과. 추가 데이터 없이 SFT 데이터 범위 안에서 상승'},
 {k:'MATH (Instruct → RL)', v:'46.8% → 51.7%', d:'외부 도구·투표 없이 7B 모델이 도달한 값'},
 {k:'DeepSeekMath-Base 7B', v:'GSM8K 64.2% · MATH 36.2%', d:'RL 이전 사전학습 단계의 출발점'},
 {k:'Self-consistency (64 표본)', v:'MATH 60.9%', d:'투표를 허용하면 여기까지 오름'},
 {k:'수학 사전학습 코퍼스', v:'120B 토큰', d:'Common Crawl에서 반복 수집. Minerva가 쓴 수학 웹페이지의 약 7배'},
 {k:'RL 학습 질문 수', v:'약 144K', d:'SFT 데이터 중 GSM8K·MATH 관련 CoT 형식 질문'}
],

impact:'GRPO의 의미는 두 겹이다. 좁게는 **PPO의 가치망을 없앤 엔지니어링 절감**이고, 넓게는 **보상이 검증 가능한 영역에서 RL의 사용법을 바꾼 것**이다. 수학·코드처럼 정답 판정이 자동으로 되는 과제에서는 보상 모델조차 규칙 기반 검증기로 대체할 수 있고, 그러면 남는 것은 "정책에서 여러 답을 뽑아 서로 비교하고 잘한 쪽을 밀어주는" 극도로 단순한 루프뿐이다. [사람 비교로 보상을 배우던](#/p/rlhf-prefs) 계보가 여기서 **사람 없이 자동 채점으로** 넘어간다. 실무적으로는 같은 GPU 예산으로 더 큰 정책을 RL 학습시킬 수 있게 되면서, 오픈소스 진영에서 RLHF/RLVR 실험의 진입 장벽이 눈에 띄게 낮아졌다.',

legacy:[
 '**[DeepSeek-R1](#/p/deepseek-r1)의 학습 알고리즘** — 지도학습 CoT 데이터 없이 정답 검증 보상만으로 GRPO를 돌려 긴 추론 사슬이 스스로 길어지는 현상을 이끌어냄',
 '**RLVR(검증 가능한 보상 RL)의 표준 도구** — 수학·코드·형식 준수처럼 자동 채점이 가능한 과제에서 보상 모델 자리를 규칙 기반 검증기가 대체하는 흐름의 기본 알고리즘이 됨',
 '**변형의 폭발** — KL 항 제거, 클리핑 비대칭화, 길이 정규화 방식 변경, 전부 정답/전부 오답 그룹 걸러내기 등 GRPO를 손본 파생 알고리즘이 2024~2025년 오픈소스 학습 스택의 기본 옵션으로 자리잡음',
 '**[DPO](#/p/dpo)와의 대비 재정립** — 오프라인 선호 학습(DPO)과 온라인 표본 기반 RL(GRPO)이 후처리 학습의 두 축으로 갈리며, 검증기가 있는 과제에서는 후자가 우세하다는 인식이 굳어짐'
],

pitfalls:[
 '**보상 모델 과최적화는 가치망을 없앤다고 사라지지 않는다.** 오히려 baseline이 현재 정책 표본에 묶여 있어, 정책이 보상 모델의 허점을 파고들면 그룹 전체가 함께 그쪽으로 쏠리고 정규화된 advantage는 여전히 "잘했다"고 말한다. 학습된 보상 모델을 쓸 때는 정답 검증기를 쓸 때보다 훨씬 이른 시점에 멈춰야 한다.',
 '**KL 계수 $\\beta$ 는 여기서도 주 손잡이다.** 참조 정책과의 KL을 손실에 직접 넣는 형태로 바뀌었을 뿐, 역할은 [요약 RLHF](#/p/summarize-hf)에서와 같다 — 너무 작으면 문체가 붕괴하고 반복·언어 혼용이 나오며, 너무 크면 사실상 아무것도 학습되지 않는다. 후속 변형들이 이 항을 아예 빼기도 하는데, 그 경우 정책이 원본에서 얼마나 멀어지는지를 별도로 감시해야 한다.',
 '**그룹 정규화에는 자체 편향이 있다.** 그룹 안의 응답이 전부 맞거나 전부 틀리면 std가 0에 가까워져 경사가 사라지거나 폭주한다 — 즉 **너무 쉽거나 너무 어려운 문제는 학습 신호를 주지 못하고**, 학습 커리큘럼이 은근히 중간 난이도에 편향된다. 또 응답 길이로 나누는 정규화 방식 때문에 길이에 대한 미묘한 선호가 생긴다는 지적이 이후 여러 후속 연구에서 제기됐다.'
],

links:[
 {t:'arXiv 2402.03300 — DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models', u:'https://arxiv.org/abs/2402.03300'},
 {t:'GitHub — deepseek-ai/DeepSeek-Math', u:'https://github.com/deepseek-ai/DeepSeek-Math'},
 {t:'arXiv 1707.06347 — Proximal Policy Optimization (비교 대상)', u:'https://arxiv.org/abs/1707.06347'}
]
});
