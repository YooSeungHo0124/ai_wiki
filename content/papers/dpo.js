WIKI.paper({
slug:'dpo',
venue:'NeurIPS 2023',
authors:'Rafailov, Sharma, Mitchell et al. (Stanford)',
arxiv:'2305.18290',

tldr:'RLHF의 목적함수를 풀어보면 **보상모델도 강화학습 루프도 필요 없다**는 것을 보인 논문. 선호 쌍 데이터에 대해 단순한 이진 분류 손실 하나를 언어모델에 직접 걸면 [PPO](#/p/ppo) 기반 RLHF와 같거나 더 나은 정책이 나온다. 정렬이 "RL 인프라를 갖춘 곳만 하는 일"에서 "미세조정 스크립트 한 개"로 내려왔다.',

context:'[InstructGPT](#/p/instructgpt) 이후 정렬 레시피는 정해져 있었지만 실행이 무거웠다. [PPO](#/p/ppo) 단계에서는 **정책·참조·보상·가치 네 개의 모델을 동시에 메모리에 올려야** 하고, 학습 도중 정책이 직접 샘플링을 해야 하며(온폴리시), 보상 스케일·KL 계수·클리핑·GAE 등 하이퍼파라미터가 얽혀 재현이 어렵다. 게다가 보상모델은 진짜 목적의 **대리 지표**일 뿐이라 정책이 그 허점을 파고드는 reward hacking을 KL 페널티로 계속 눌러야 한다. 여기서 자연스러운 의문이 생긴다 — 우리가 원하는 건 결국 선호를 만족하는 **정책**인데, 왜 굳이 중간에 보상함수라는 물체를 세우고 그것을 다시 RL로 좇는가?',

ideas:[
 {h:'KL 제약 보상 최대화의 해는 이미 닫힌 형태로 알려져 있다',
  lead:'RLHF 목적함수의 최적 정책은 RL 없이도 수식으로 이미 알려져 있다.',
  d:'"보상 $r$ 을 최대화하되 참조 정책에서 KL로 멀어지지 말 것"이라는 RLHF 목적의 최적해는 $\\pi_r(y|x) \\propto \\pi_{ref}(y|x)\\exp(r(x,y)/\\beta)$ 다. RL로 찾을 필요 없이 수식으로 적을 수 있다. 다만 정규화 상수 $Z(x)$ 가 모든 응답에 대한 합이라 계산이 불가능해서, 지금까지는 이 식을 쓸 수 없다고 여겼다.'},
 {h:'식을 뒤집는다 — 언어모델이 곧 보상모델이다',
  lead:'닫힌 해를 보상에 대해 풀면 보상이 정책의 로그비로 표현된다.',
  d:'위 식을 $r$ 에 대해 풀면 $r(x,y) = \\beta\\log(\\pi(y|x)/\\pi_{ref}(y|x)) + \\beta\\log Z(x)$ 가 된다. **보상은 정책의 로그비로 표현된다.** 즉 별도의 보상 헤드를 학습할 이유가 없고, 언어모델 자신이 암묵적 보상모델 역할을 한다.'},
 {h:'$Z(x)$ 가 소거된다는 것이 결정타',
  lead:'선호 쌍의 보상 차이를 취하면 계산 불가능하던 정규화 상수가 사라진다.',
  d:'선호 학습에 쓰는 Bradley-Terry 모델은 두 응답의 **보상 차이**만 본다. 같은 프롬프트 $x$ 에서 나온 $y_w$ 와 $y_l$ 의 보상을 빼면 계산 불가능하던 $\\beta\\log Z(x)$ 가 그대로 사라진다. 남는 것은 네 번의 로그확률 계산뿐이고, 전체가 미분 가능한 지도학습 손실이 된다.'},
 {h:'그래디언트가 하는 일은 직관적이다',
  lead:'암묵적 보상이 순서를 틀린 쌍일수록 크게 반응해 선호 응답 확률을 올린다.',
  d:'DPO 손실의 그래디언트는 **암묵적 보상이 순서를 틀리게 매긴 쌍일수록 큰 가중치**를 주면서, 선호된 응답의 확률은 올리고 거부된 응답의 확률은 내린다. 이미 잘 맞히는 쌍은 자동으로 가중치가 줄어드는 자기 조절 항이 붙어 있어, 이것이 없으면 모델이 붕괴한다고 논문은 지적한다.'},
 {h:'KL 제약은 사라진 게 아니라 손실 안에 내장됐다',
  lead:'참조 모델 대비 로그비가 손실에 직접 들어가 별도 KL 항이 필요 없다.',
  d:'참조 모델 $\\pi_{ref}$ 로 나눈 비율이 손실에 직접 들어가 있어서, PPO처럼 별도의 KL 페널티 항이나 계수 조정이 필요 없다. $\\beta$ 하나가 참조 모델에 얼마나 묶어둘지를 조절한다. 참조 모델은 학습되지 않으므로 forward만 돌리면 되고, 보상·가치 모델은 아예 없다.'}
],

diagram:{type:'compare', cap:'같은 목적함수의 최적해를 찾는 두 경로. DPO는 보상함수라는 중간 물체를 건너뛴다.',
 left:{t:'기존 RLHF (PPO)',
  items:['① 선호 데이터로 보상모델 학습','② PPO로 보상 최대화 + KL 페널티','정책·참조·보상·가치 4개 모델 상주','학습 중 온폴리시 샘플링 필요','KL 계수·클리핑·GAE 등 튜닝 민감']},
 right:{t:'DPO',
  items:['보상모델 없음 — 정책이 암묵적 보상','이진 교차엔트로피 손실 한 개','정책 + 고정된 참조 모델 2개','오프라인 선호 데이터로 지도학습','β 하나로 KL 강도 조절']}},

math:[
 {tex:'\\pi^{*}(y|x) = \\frac{1}{Z(x)}\\,\\pi_{ref}(y|x)\\,\\exp\\!\\left(\\frac{r(x,y)}{\\beta}\\right)',
  expr:'π*(y|x) = (1/Z(x)) · π_ref(y|x) · exp( r(x,y) / β )',
  d:'KL 제약 하 보상 최대화의 닫힌 해. 참조 정책을 보상에 비례해 지수적으로 재가중한 분포다. $Z(x)=\\sum_y \\pi_{ref}(y|x)\\exp(r(x,y)/\\beta)$ 는 모든 가능한 응답에 대한 합이라 직접 계산할 수 없다.'},
 {tex:'r(x,y) = \\beta\\log\\frac{\\pi^{*}(y|x)}{\\pi_{ref}(y|x)} + \\beta\\log Z(x)',
  expr:'r(x,y) = β · log( π*(y|x) / π_ref(y|x) ) + β · log Z(x)',
  d:'위 식을 보상에 대해 정리한 것. **모든 보상함수는 어떤 정책의 로그비로 다시 쓸 수 있다.** 보상모델을 따로 파라미터화할 필요가 사라지는 지점이다.'},
 {tex:'\\mathcal{L}_{DPO} = -\\mathbb{E}\\left[\\log\\sigma\\!\\left(\\beta\\log\\frac{\\pi_\\theta(y_w|x)}{\\pi_{ref}(y_w|x)} - \\beta\\log\\frac{\\pi_\\theta(y_l|x)}{\\pi_{ref}(y_l|x)}\\right)\\right]',
  expr:'L_DPO = −E[ log σ( β log(π_θ(y_w|x)/π_ref(y_w|x)) − β log(π_θ(y_l|x)/π_ref(y_l|x)) ) ]',
  d:'최종 손실. 보상 차이를 취하면서 $\\beta\\log Z(x)$ 가 소거됐고, 형태는 선호 쌍에 대한 **로지스틱 회귀**와 동일하다. 필요한 것은 정책과 참조 모델 각각에서 두 응답의 로그확률을 구하는 forward 네 번뿐이다.'}
],

numbers:[
 {k:'TL;DR 요약 승률', v:'DPO 61% vs PPO 57%', d:'GPT-4 심판, 샘플링 온도 0 기준. 참조 요약 대비 승률'},
 {k:'온도 민감도', v:'DPO가 더 견고', d:'온도를 올리면 PPO 승률은 크게 떨어지지만 DPO는 유지됨'},
 {k:'상주 모델 수', v:'4개 → 2개', d:'정책·참조·보상·가치 → 정책 + (고정)참조. 그중 학습 대상은 1개'},
 {k:'실험 규모', v:'최대 6B', d:'감성 제어(GPT-2), TL;DR 요약, Anthropic-HH 대화. 대형 모델 검증은 후속 연구들이 채움'}
],

figures:[
 {f:'fig1-rlhf-vs-dpo.png',
  cap:'왼쪽 RLHF: 선호 데이터로 별도의 reward model을 최대가능도로 학습시킨 뒤, 그 reward model이 준 점수로 LM 정책을 강화학습(화살표로 이어지는 label rewards ↔ sample completions 순환)으로 갱신한다. 오른쪽 DPO: 같은 선호 데이터에서 곧바로 최종 LM을 최대가능도로 학습한다 — 가운데의 별도 reward model과 순환하는 강화학습 루프가 통째로 사라진 것이 이 그림에서 봐야 할 차이.',
  src:'원문 Figure 1, p.2'},
 {f:'fig3-dialogue-win-rate.png',
  cap:'x축은 샘플링 온도, y축은 GPT-4가 매긴, 데이터셋의 정답(chosen) 응답 대비 승률. 점선(0.5)을 넘으면 정답보다 낫다는 뜻인데, 온도 전 구간에서 주황(DPO)이 점선 위에 있고 온도가 높아져도 크게 떨어지지 않는다 — 다른 방법(Preferred-FT, Pythia-2.8B)은 점선 아래이거나 온도에 더 민감하다.',
  src:'원문 Figure 3 (좌), p.8'}
],

quotes:[
 {t:'The resulting algorithm, which we call Direct Preference Optimization (DPO), is stable, performant, and computationally lightweight, eliminating the need for sampling from the LM during fine-tuning or performing significant hyperparameter tuning.',
  src:'Abstract, p.1'},
 {t:'Intuitively, the DPO update increases the relative log probability of preferred to dispreferred responses, but it incorporates a dynamic, per-example importance weight that prevents the model degeneration that we find occurs with a naive probability ratio objective.',
  src:'Section 1, p.2'}
],

impact:'정렬의 **진입 장벽**이 무너졌다. PPO 파이프라인은 분산 RL 인프라와 하이퍼파라미터 경험을 요구했지만, DPO는 기존 SFT 학습 코드에 손실 함수만 갈아끼우면 된다 — 참조 모델의 로그확률은 미리 계산해둘 수도 있다. 그 결과 발표 몇 달 만에 TRL·Axolotl 등 주요 미세조정 라이브러리에 기본 탑재됐고, 오픈 가중치 채팅 모델 대부분이 SFT 다음 단계로 DPO를 쓰게 됐다. 이론적으로도 의미가 크다. **RLHF의 "RL"이 본질이 아니라 구현 선택이었음**을 보였고, 정렬 문제를 확률 모델의 최대가능도 추정으로 재해석하는 관점을 열었다.',

legacy:[
 '**변형 폭발** — 참조 모델을 없앤 ORPO/SimPO, 쌍이 아닌 이진 라벨을 쓰는 KTO, 확률 대신 순위를 쓰는 IPO 등 같은 골격 위의 손실 함수 변형이 대량으로 파생됐다',
 '**오프라인의 한계와 온라인 회귀** — 고정된 데이터셋만 쓰면 정책이 이동한 뒤의 분포를 볼 수 없어, 반복적으로 샘플을 뽑아 다시 선호를 매기는 iterative/online DPO가 표준 보완책이 됐다',
 '**RL의 재부상** — 검증 가능한 정답이 있는 추론 태스크에서는 온폴리시 샘플링이 여전히 유리해서, 가치 모델만 제거한 [GRPO](#/p/grpo)와 [DeepSeek-R1](#/p/deepseek-r1)이 다시 RL 쪽으로 돌아갔다. DPO는 취향·안전 정렬, RL은 능력 향상으로 역할이 갈리는 중이다',
 '**경량 미세조정과의 결합** — 학습 대상이 정책 하나뿐이라 [LoRA](#/p/lora)·[QLoRA](#/p/qlora)와 궁합이 좋아, 단일 GPU에서 선호 정렬을 돌리는 것이 현실이 됐다'
],

pitfalls:[
 '**DPO가 PPO를 항상 이기는 것은 아니다.** 논문 실험은 6B 이하 규모이며, 이후 대규모 비교 연구들은 충분한 튜닝과 온폴리시 데이터가 주어지면 PPO 계열이 더 높은 상한을 보이는 경우를 보고했다. DPO의 강점은 최고 성능이 아니라 **비용 대비 안정성**이다.',
 '**선호 데이터 분포를 벗어나면 무너진다.** 오프라인 학습이라 데이터에 없는 영역에서는 암묵적 보상이 임의로 커질 수 있고, 실제로 **선호·거부 응답의 확률이 함께 내려가는** 현상이 흔히 관찰된다. 두 로그확률을 따로 로깅하며 학습하는 것이 사실상 필수다.',
 '**β와 참조 모델 선택이 전부다.** $\\beta$ 를 너무 낮추면 참조에서 멀어지며 장황해지거나 붕괴하고, 너무 높이면 아무것도 학습되지 않는다. 또 참조 모델은 반드시 **같은 데이터로 SFT를 마친 체크포인트**여야 한다 — base 모델을 참조로 쓰면 로그비가 의미를 잃는다.'
],

links:[
 {t:'arXiv 2305.18290 — Direct Preference Optimization: Your Language Model is Secretly a Reward Model', u:'https://arxiv.org/abs/2305.18290'},
 {t:'Hugging Face TRL — DPOTrainer 문서', u:'https://huggingface.co/docs/trl/dpo_trainer'},
 {t:'GitHub — eric-mitchell/direct-preference-optimization (원본 구현)', u:'https://github.com/eric-mitchell/direct-preference-optimization'}
]
});
