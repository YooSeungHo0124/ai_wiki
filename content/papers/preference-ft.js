WIKI.paper({
slug:'preference-ft',
venue:'arXiv 2019 (OpenAI)',
authors:'Ziegler, Stiennon, Wu, Brown, Radford, Amodei, Christiano, Irving (OpenAI)',
arxiv:'1909.08593',

tldr:'사람이 두 출력 중 더 나은 것을 고르는 비교 데이터로 **보상 모델**을 학습하고, 그 보상 모델을 원본 언어모델에서 너무 멀어지지 않도록 **KL 벌점**을 걸어 **PPO**로 최적화한다. 보상 모델 + KL 벌점 + PPO — 지금 RLHF라고 부르는 표준 레시피가 이 논문에서 처음 완전한 형태로 조립됐다.',

context:'2019년에는 사전학습 언어모델을 지도학습으로 미세조정하는 방식이 자리잡았지만, "긍정적인 글" "잘 요약된 글"처럼 **답이 하나로 정해지지 않는 과제**는 지도학습 라벨을 만들기 어렵다. ROUGE 같은 자동 지표로 보상을 정의해 RL을 돌리는 시도는 있었지만, 자동 지표는 사람이 원하는 것의 근사치일 뿐이다. [Christiano et al. 2017](https://arxiv.org/abs/1706.03741)이 시뮬레이션 로봇 제어에서 사람의 선호 비교로 보상 모델을 학습하는 방법을 보였으나, 언어처럼 복잡한 생성 과제·대규모 사전학습 모델에는 아직 적용되지 않은 상태였다.',

ideas:[
 {h:'보상은 사람이 직접 매기지 않고 비교로 학습한다',
  lead:'절대 점수 대신 4개 중 최선을 고르게 해 보상 모델 `r`을 지도학습으로 학습한다.',
  d:'사람에게 "이 글은 7점"처럼 절대 점수를 매기게 하면 일관성이 떨어진다는 것을 초기 실험에서 확인했다. 대신 문맥 하나에 대해 4개의 후보 continuation을 보여주고 가장 나은 것을 고르게 한다. 이 선택 라벨로 보상 모델 `r`을 언어모델과 같은 사전학습 Transformer 위에 얹어 학습한다. `r`은 정책과 별개의 네트워크다 — 공유하면 정책이 보상 모델에 과적합한다는 것을 4.2절에서 별도로 확인했다.'},
 {h:'KL 벌점: 보상을 높이되 원본 분포를 벗어나지 않는다',
  lead:'보상에 $\\beta\\,\\text{KL}(\\pi,\\rho)$ 벌점을 더해 정책이 원본 언어모델 근처에 머물게 한다.',
  d:'보상 모델 `r`만 최대화하면 정책이 `r`이 신뢰할 수 있는 분포 밖으로 나가 버린다. 그래서 수정된 보상 $R(x,y)=r(x,y)-\\beta\\log(\\pi(y|x)/\\rho(y|x))$ 를 최적화한다. 이 항은 엔트로피 보너스 역할도 하고, `r`이 유효한 범위 안에 정책을 묶어두는 역할도 하며, 문체 과제에서는 "일관성·주제 유지"를 사람 대신 담당하는 과제 정의의 일부이기도 하다.'},
 {h:'PPO로 이 보상을 최적화한다',
  lead:'수정 보상 `R`을 [PPO](https://arxiv.org/abs/1707.06347)로 최적화해 토큰 단위 생성 정책을 갱신한다.',
  d:'보상 모델과 KL 벌점을 합친 `R(x,y)`를 강화학습 목적함수로 놓고 PPO2로 정책 `π`를 갱신한다. 문체 과제는 배치 1024, 요약은 512, 총 200만 에피소드를 쓴다. 시드마다 같은 `β`로도 도달하는 KL 값이 들쭉날쭉해서, 목표 KL을 정해두고 `β`를 로그 공간 비례 제어기로 자동 조절하는 방식도 함께 쓴다.'},
 {h:'온라인 데이터 수집: 보상 모델을 정책과 함께 갱신한다',
  lead:'정책이 바뀌면 그 정책의 출력을 다시 사람이 평가해 보상 모델을 재학습한다.',
  d:'정책이 원본 `ρ`에서 멀어질수록 `ρ`의 샘플로만 학습한 보상 모델은 분포 이동으로 신뢰도가 떨어진다. 그래서 학습 중간중간 현재 정책의 출력을 사람에게 다시 보여주고 라벨을 모아 보상 모델을 20번까지 재학습한다. 요약 과제에서는 온라인 수집이 오프라인보다 뚜렷이 나았고, 문체 과제에서는 차이가 거의 없었다 — 과제가 단순할수록 보상 모델이 분포 밖에서도 덜 무너진다는 뜻으로 해석했다.'}
],

diagram:{type:'loop', cap:'보상 모델 학습(위)과 정책 학습(아래)이 온라인 설정에서는 서로 맞물려 반복된다.',
 center:'정책 π가 출력 → 사람이 비교 → 보상모델 갱신 → 다시 PPO',
 nodes:[
  {t:'정책 π 샘플링', s:'문맥당 후보 4개'},
  {t:'사람 비교 라벨', s:'최선 1개 선택', acc:true},
  {t:'보상모델 r 학습', s:'선택 로그우도 최대화'},
  {t:'PPO로 π 갱신', s:'r − β·KL(π,ρ) 최적화'}
 ]},

math:[
 {expr:'loss(r) = E[ log( e^r(x,y_b) / Σ_i e^r(x,y_i) ) ]',
  tex:'\\text{loss}(r)=-\\,\\mathbb{E}_{(x,\\{y_i\\},b)\\sim S}\\left[\\log\\frac{e^{r(x,y_b)}}{\\sum_i e^{r(x,y_i)}}\\right]',
  d:'사람이 고른 $y_b$ 에 소프트맥스 확률질량이 몰리도록 보상 모델을 학습한다. 4지선다 비교를 다항 로지스틱 회귀로 바꾼 형태다.'},
 {expr:'R(x, y) = r(x, y) − β·log( π(y|x) / ρ(y|x) )',
  tex:'R(x,y)=r(x,y)-\\beta\\log\\frac{\\pi(y|x)}{\\rho(y|x)}',
  d:'정책이 실제로 최적화하는 보상. 두 번째 항이 $\\pi$ 와 원본 $\\rho$ 사이 KL 발산에 대한 벌점이며, 지금도 [InstructGPT](#/p/instructgpt)류 RLHF 목적함수의 핵심 구조로 그대로 남아 있다.'},
 {expr:'π_opt(y|x) ∝ ρ(y|x) · e^(r(x,y)/β)',
  tex:'\\pi_{\\text{opt}}(y|x)\\;\\propto\\;\\rho(y|x)\\,e^{\\,r(x,y)/\\beta}',
  d:'KL 제약 하 보상 최대화 문제의 닫힌 해. 원본 분포 $\\rho$ 를 보상으로 재가중한 형태이며, 이후 [DPO](#/p/dpo)가 보상 모델·PPO 없이 이 관계식을 직접 이용해 정책을 도출하는 출발점이 된다.'}
],

numbers:[
 {k:'기반 모델', v:'[GPT-2](#/p/gpt2) 774M', d:'36층·20head·임베딩 1280, WebText로 사전학습'},
 {k:'문체 과제 라벨 수', v:'5,000개 비교', d:'긍정 감성 continuation, 이 정도로 사람 선호 86% 승률 달성'},
 {k:'요약 라벨 수', v:'60,000개 비교', d:'CNN/DM·TL;DR, "smart copier" 행동이 여기서 나타남'},
 {k:'TL;DR 복사 비율', v:'71%', d:'순수 RL 미세조정 모델이 문장을 그대로 복사한 비율(CNN/DM은 98%)'},
 {k:'TL;DR 사람 선호', v:'96% vs zero-shot', d:'60k 온라인 모델이 원본 대비, 심지어 사람이 쓴 참조 요약 대비도 96%'},
 {k:'PPO 규모', v:'200만 에피소드', d:'$N_\\pi=2\\times10^6$, $\\gamma=1$, 배치당 PPO 4epoch'}
],

impact:'이 논문 이후 "사람 비교로 보상 모델을 학습하고 KL 벌점을 건 PPO로 최적화한다"는 세 조각이 하나의 표준 파이프라인으로 굳어졌다. [요약 RLHF](#/p/summarize-hf)가 같은 저자들 손으로 이 틀을 요약에 특화해 다듬었고, [InstructGPT](#/p/instructgpt)가 이를 범용 instruction following으로 확장하며 지금의 ChatGPT 계열 정렬 파이프라인의 원형이 됐다. [Sparrow](#/p/sparrow)와 [RLAIF](#/p/rlaif)는 각각 검색 증거·AI 라벨로 이 틀의 입력을 바꾼 변형이고, [DPO](#/p/dpo)·[KTO](#/p/kto)는 이 논문의 KL-제약 최적해를 이용해 아예 보상 모델과 PPO 단계를 없애는 방향으로 되짚어간다.',

legacy:[
 '**요약 특화** — [요약 RLHF](#/p/summarize-hf)가 같은 레시피로 사람 선호가 ROUGE보다 신뢰할 만한 지표임을 더 크게 보임',
 '**범용 instruction tuning** — [InstructGPT](#/p/instructgpt)가 이 3단계 파이프라인(SFT→보상모델→PPO)을 [GPT-3](#/p/gpt3) 규모·다목적 과제로 확장',
 '**보상 없는 대안** — [DPO](#/p/dpo)가 $\\pi_{\\text{opt}}\\propto\\rho\\,e^{r/\\beta}$ 관계를 뒤집어 보상 모델·RL 없이 같은 목적을 직접 최적화',
 '**AI 피드백으로 대체** — [RLAIF](#/p/rlaif)가 사람 라벨러 대신 AI 라벨러로 같은 파이프라인을 재현'
],

pitfalls:[
 '**보상 모델을 과최적화하면 사람이 원하는 것과 멀어진다.** 요약 실험에서 보상을 높일수록 모델은 원문을 그대로 베끼는 "smart copier"가 됐고, ROUGE 점수와 사람 선호 순위가 서로 어긋났다 — 대리 지표(보상 모델)를 곧이곧대로 밀어붙이면 실제 목표에서 이탈하는 전형적 사례다.',
 '**KL 벌점의 부호를 뒤집는 버그가 실제로 일어났다.** 코드 리팩터링 중 보상 부호가 뒤집힌 버그가 KL 벌점 부호까지 함께 뒤집어, 모델이 "자연스러운 문장을 유지하면서 최대한 나쁜(성적으로 노골적인) 내용만 생성"하도록 학습된 사례가 논문에 그대로 보고돼 있다. 학습 중 사람이 개입할 안전장치(Andon cord)가 없었다는 반성도 함께 적혀 있다.',
 '**보상 모델과 정책을 파라미터 공유로 합치면 과적합이 심해진다.** 둘 다 같은 사전학습 가중치에서 시작하지만 별도 네트워크로 학습해야 한다는 것을 실험으로 확인했다 — 계산 효율을 위해 합치고 싶은 유혹이 있지만, 이 논문 기준으로는 손해다.'
],

figures:[
 {f:'fig1-pipeline.png',
  cap:'위: 보상 모델 학습 루프 — 정책이 문맥당 4개 continuation을 만들면 사람 라벨러가 최선을 고르고, 그 라벨로 보상 모델의 loss를 계산한다. 아래: 정책 학습 루프 — 같은 보상 모델의 출력을 reward로 삼아 정책을 갱신한다. 온라인 설정에서는 두 루프가 번갈아 돈다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'One of our code refactors introduced a bug which flipped the sign of the reward. Flipping the reward would usually produce incoherent text, but the same bug also flipped the sign of the KL penalty.',
  src:'Section 4.4, p.8'}
],

links:[
 {t:'arXiv 1909.08593 — Fine-Tuning Language Models from Human Preferences', u:'https://arxiv.org/abs/1909.08593'},
 {t:'OpenAI blog: Fine-Tuning GPT-2 from Human Preferences', u:'https://openai.com/research/fine-tuning-gpt-2'}
]
});
