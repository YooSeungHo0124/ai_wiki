WIKI.paper({
slug:'zephyr',
venue:'Technical Report (HuggingFace H4)',
authors:'Tunstall, Beeching et al. (Hugging Face)',
arxiv:'2310.16944',

tldr:'**증류 지도학습(dSFT)** 으로 지시를 따르게 만든 뒤, 사람 라벨 없이 **AI 피드백(AIF) 선호쌍**만으로 **증류 DPO(dDPO)** 를 적용한다. 사람 라벨 없이도 7B 모델이 70B RLHF 모델을 MT-Bench에서 앞선다.',

context:'Alpaca류 연구는 더 큰 모델의 출력을 모방하는 dSFT가 태스크 정확도를 크게 올린다는 것을 보였지만, 그렇게 만든 모델은 **정렬(alignment)이 안 돼 있다** — 자연스러운 프롬프트에 엉뚱하게 반응한다. 정렬을 개선하는 표준 방법은 사람이 단 선호 데이터로 RLHF를 하는 것인데, 이는 사람 주석 비용이 크고 PPO 같은 RL 파이프라인이 무겁다. 마침 [DPO](#/p/dpo)가 강화학습 없이 선호쌍에서 직접 정책을 최적화하는 방법을 제시했고, UltraFeedback 같은 **교사 모델이 매긴 선호 데이터셋**도 등장했다. 질문은 명확했다 — 이 둘을 합치면 사람 없이 정렬까지 증류할 수 있는가?',

ideas:[
 {h:'3단계 파이프라인: dSFT → AIF 수집 → dDPO',
  lead:'대규모 자기지시 대화로 dSFT하고, 여러 모델 응답을 교사가 순위 매겨 dDPO한다.',
  d:'(1) UltraChat(147만 개 자기정제 대화)으로 원시 LLM을 dSFT해 지시를 따르게 만든다. (2) 같은 프롬프트에 4개의 서로 다른 모델이 응답하게 하고 GPT-4가 채점한 UltraFeedback으로 "선호(chosen)/비선호(rejected)" 이진쌍을 만든다. (3) 이 AIF 쌍으로 dSFT 모델을 dDPO로 다듬는다. 세 단계 모두 사람 주석이 필요 없다.'},
 {h:'AI 피드백만으로 만든 이진 선호쌍',
  lead:'프롬프트당 최고 점수 응답을 chosen, 나머지 중 무작위 하나를 rejected로 삼는다.',
  d:'UltraFeedback은 프롬프트당 4개 모델 응답에 GPT-4가 지시 따름·정직성·유용성 점수를 매긴다. 최저 점수 대신 **무작위로 rejected를 고른 것**이 핵심 선택인데, 이렇게 하면 DPO 목적함수가 극단적으로 쉬운 쌍만 보지 않고 더 다양한 난이도의 대비를 학습해 일반화가 좋아진다.'},
 {h:'DPO로 RL 없이 정렬을 직접 최적화',
  lead:'보상 모델을 따로 학습해 PPO로 최적화하는 대신, 선호 로그우도를 직접 최대화한다.',
  d:'DPO는 최적 보상함수를 최적 정책과 원래 정책(dSFT)의 비율로 표현할 수 있다는 관찰에서 출발해, 보상을 명시적으로 학습하지 않고도 같은 목적을 최적화하는 닫힌 형태의 손실을 유도한다. 그 결과 학습 절차는 매 AIF 삼중항 $(x, y_w, y_l)$ 에 대해 dSFT 모델과 현재 모델에서 각각 확률을 계산해 그 차이를 역전파하는 것으로 단순화된다 — 정책에서 별도로 샘플링할 필요가 없다.'},
 {h:'추가 샘플링 없이 단 몇 시간 만에 학습',
  lead:'dDPO는 정적 AIF 데이터셋에서 한 번에 계산되므로 온폴리시 생성이 필요 없다.',
  d:'PPO 기반 RLHF는 학습 중 정책으로부터 계속 샘플링해야 하지만, DPO는 고정된 선호 데이터셋에 대해서만 forward-only 확률을 계산하면 된다. Zephyr-7B는 16개 A100으로 2~4시간 만에 전체 파이프라인을 마쳤다.'}
],

diagram:{type:'flow', cap:'Zephyr의 3단계: 자기지시 대화 생성 → AI 피드백 수집 → 증류 DPO.',
 nodes:[
  {t:'UltraChat 대화', s:'147만 개', a:'dSFT'},
  {t:'π_dSFT', s:'지시 따르기 모델'},
  {t:'4개 모델 응답', a:'GPT-4 채점'},
  {t:'AIF 선호쌍', s:'(x, y_w, y_l)'},
  {t:'dDPO', s:'π_dSFT 갱신', acc:true}
 ]},

math:[
 {expr:'r*(x,y) = β·log(π*(y|x)/π_dSFT(y|x)) + β·log Z(x)',
  tex:'r^{*}(x,y)=\\beta\\,\\frac{\\pi^{*}(y|x)}{\\pi_{\\text{dSFT}}(y|x)}+\\beta\\log Z(x)',
  d:'DPO의 출발점. 최적 보상을 최적 정책 $\\pi^*$ 와 원래 정책 $\\pi_{\\text{dSFT}}$ 의 로그 비율로 표현한다.'},
 {expr:'π_θ = argmax E[log σ(β·log(π(yw|x)/πdSFT(yw|x)) − β·log(π(yl|x)/πdSFT(yl|x)))]',
  tex:'\\pi_\\theta=\\arg\\max_\\pi\\ \\mathbb{E}_{(x,y_w,y_l)\\sim\\mathcal D}\\left[\\log\\sigma\\!\\left(\\beta\\log\\frac{\\pi(y_w|x)}{\\pi_{\\text{dSFT}}(y_w|x)}-\\beta\\log\\frac{\\pi(y_l|x)}{\\pi_{\\text{dSFT}}(y_l|x)}\\right)\\right]',
  d:'dDPO의 최종 학습 목적함수. 선호 응답 $y_w$ 의 상대 확률을 비선호 응답 $y_l$ 보다 높이는 방향으로만 학습하면 된다.'}
],

numbers:[
 {k:'MT-Bench 점수', v:'7.34', d:'Zephyr-7B, dDPO 적용. Llama2-Chat-70B(6.86)를 능가'},
 {k:'AlpacaEval 승률', v:'90.60%', d:'text-davinci-003 대비, GPT-4 채점'},
 {k:'대비 모델', v:'Mistral-Instruct v0.1 6.84', d:'같은 베이스 모델([Mistral 7B](#/p/mistral))의 dSFT만 적용한 버전보다 dDPO 후 더 높음(7.34)'},
 {k:'UltraChat 필터링 후 규모', v:'약 20만 개', d:'원본 147만 개에서 truecasing·품질 필터링 후'},
 {k:'UltraFeedback 규모', v:'6.4만 개 프롬프트', d:'프롬프트당 4개 응답에 GPT-4가 점수 매김'},
 {k:'학습 시간', v:'16×A100, 2~4시간', d:'전체 파이프라인 기준'}
],

impact:'RLHF의 핵심 이득(정렬 개선)을 **사람 라벨 없이, PPO 없이** 재현할 수 있음을 보였다. dSFT + AIF + DPO라는 조합은 이후 오픈소스 정렬 파이프라인의 사실상 표준 레시피가 되었고, "정렬도 증류할 수 있다"는 이 논문의 제목 그대로의 주장이 오픈소스 커뮤니티의 정렬 모델 제작 방식을 바꿨다.',

legacy:[
 '**Alignment Handbook 레시피의 원형** — dSFT+AIF+dDPO 조합이 이후 여러 오픈소스 정렬 모델의 표준 학습 파이프라인으로 재사용됨',
 '**교사 모델의 역할 확장** — [Orca](#/p/orca)가 교사의 설명을 증류했다면, Zephyr는 교사의 **선호 판단**을 증류한다는 점에서 증류 대상의 범위를 넓힘',
 '**AI 피드백(AIF) 데이터셋의 실용성 입증** — 사람 라벨 없이 GPT-4 평가만으로 만든 UltraFeedback류 데이터가 실제 정렬 성능 개선에 충분함을 실증'
],

pitfalls:[
 '**dDPO는 dSFT가 이미 어느 정도 되어 있다는 전제 위에서 작동한다.** 원시 모델에 곧바로 DPO를 적용하는 방법이 아니라, 지시 따르기가 된 모델을 다듬는 두 번째 단계다.',
 '**AlpacaEval 승률에서는 Zephyr가 Llama2-Chat-70B(92.66%)보다 낮다.** MT-Bench에서는 앞서지만 벤치마크에 따라 순위가 달라진다 — 단일 지표로 "이겼다"고 단정하기 어렵다.',
 '**GPT-4 채점 기반 벤치마크(MT-Bench, AlpacaEval) 자체의 편향 가능성**은 이 논문의 평가에도 그대로 적용된다 — [Orca](#/p/orca)가 지적한 LLM-judge 평가의 함정과 같은 문제를 안고 있다.'
],

figures:[
 {f:'fig2-three-steps.png',
  cap:'Step 1(dSFT): 프롬프트로 다중턴 대화를 만들어 지도학습. Step 2(AIF): 같은 프롬프트에 4개 모델이 답하고 GPT-4가 순위를 매겨 (yw, yl) 쌍을 만듦. Step 3(dDPO): 그 쌍으로 dSFT 모델을 직접 최적화.',
  src:'원문 Figure 2, p.3'}
],

links:[
 {t:'arXiv 2310.16944 — Zephyr', u:'https://arxiv.org/abs/2310.16944'},
 {t:'Alignment Handbook (공식 코드)', u:'https://github.com/huggingface/alignment-handbook'}
]
});
