WIKI.paper({
slug:'kimi-k15',
venue:'Technical Report, 2025 (Moonshot AI)',
authors:'Kimi Team (Moonshot AI)',
arxiv:'2501.12599',

tldr:'Moonshot AI가 강화학습만으로 [DeepSeek-R1](#/p/deepseek-r1)·OpenAI o1급 추론 모델을 만든 기술보고서. **몬테카를로 트리 탐색·가치함수·PRM 없이**, RL 문맥 길이를 128k까지 늘리고 온라인 policy mirror descent 변형으로 정책을 최적화하는 것만으로 최상위 성능을 낸다.',

context:'[DeepSeek-R1](#/p/deepseek-r1)이 2025년 1월 대규모 RL로 추론 모델을 학습하는 레시피(다단계 학습, [GRPO](#/p/grpo) 기반 정책 최적화)를 공개한 것과 거의 같은 시기에, Moonshot AI는 독자적인 RL 파이프라인으로 비슷한 목표에 도달했다. 두 연구 모두 "긴 사고 사슬을 RL로 강화한다"는 방향은 같지만, R1이 GRPO(그룹 상대 비교로 어드밴티지를 추정하는 방식)를 쓰는 반면 k1.5는 **가치함수 자체를 두지 않는** 온라인 policy mirror descent 변형을 쓰고, R1이 규칙 기반 보상으로 시작하는 것과 달리 **RL 문맥 길이 확장**을 성능의 핵심 축으로 제시한다.',

ideas:[
 {h:'긴 문맥 RL 스케일링: 128k까지 늘린다',
  lead:'RL 학습의 문맥 창을 128k로 늘릴수록 성능이 계속 오른다는 것을 관찰한다.',
  d:'모델을 먼저 32k 길이로 1 에폭, 이어서 128k 길이로 1 에폭 학습시킨다. 저자들은 사고 사슬 길이(출력 문맥 길이)를 RL의 핵심 스케일링 축으로 놓고, 문맥이 길어질수록 모델이 계획(planning)·반성(reflection)·수정(correction)의 성질을 갖는 CoT를 만들어낸다고 보고한다.'},
 {h:'부분 롤아웃으로 긴 시퀀스의 비용을 줄인다',
  lead:'긴 응답을 여러 조각으로 나눠 롤아웃해, 새 궤적을 처음부터 재생성하는 비용을 없앤다.',
  d:'128k 길이의 응답을 매번 처음부터 끝까지 생성하면 학습 비용이 폭발한다. 부분 롤아웃(partial rollout) 시스템은 긴 응답을 세그먼트로 쪼개 이어서 생성하고, 반복 시퀀스를 감지해 낭비되는 계산을 줄인다. 이것이 "복잡한 기법 없이" 128k 문맥 RL을 실용적으로 만든 인프라 축이다.'},
 {h:'가치함수·MCTS·PRM을 전부 버린 정책 최적화',
  lead:'크레딧 할당에 부적합하다고 판단해 가치함수를 쓰지 않고, 온라인 policy mirror descent 변형만 쓴다.',
  d:'전통적 RL의 가치함수는 한 스텝의 오류가 이후 정답으로 이어지는지 여부에 극도로 민감해, 추론 사슬처럼 한 토큰 차이가 전체 결과를 뒤집는 상황의 크레딧 할당에 부적합하다고 저자들은 주장한다. 대신 상대 엔트로피로 정규화된 정책 최적화 문제를 매 반복마다 풀고, 그 닫힌 형태 해를 이용해 오프폴리시 데이터도 활용할 수 있게 만든다. 이 알고리즘은 [DeepSeek-R1](#/p/deepseek-r1)의 GRPO와 마찬가지로 별도 크리틱 네트워크가 없다는 점은 같지만, 그룹 상대 비교 대신 KL 정규화 목적함수를 직접 최적화한다는 점에서 유도 방식이 다르다.'},
 {h:'long2short: 긴 사고를 짧은 모델로 압축',
  lead:'길이 페널티와 모델 병합으로 long-CoT의 능력을 짧은 응답의 모델에 이식한다.',
  d:'long-CoT 모델은 강하지만 테스트 타임 토큰을 많이 쓴다. 저자들은 길이에 페널티를 주는 보상과, long-CoT 활성화를 짧은 CoT 모델에 병합하는 기법으로 짧은 응답만 내면서도 기존 short-CoT 모델(GPT-4o, Claude 3.5 Sonnet)을 크게 능가하는 모델을 만든다.'}
],

diagram:{type:'compare', cap:'DeepSeek-R1과 Kimi k1.5가 같은 목표(RL로 추론 강화)에 다른 경로로 도달한다.',
 left:{t:'DeepSeek-R1', items:['GRPO(그룹 상대 어드밴티지)','규칙 기반 보상으로 시작','다단계 학습(냉시작→RL→SFT→RL)']},
 right:{t:'Kimi k1.5', items:['온라인 policy mirror descent','가치함수·MCTS·PRM 전부 배제','RL 문맥을 128k로 확장이 핵심 축'], acc:true}},

math:[
 {expr:'max_θ E[r(x,y,y*)] - τ·KL(π_θ(x) || π_θi(x))',
  tex:'\\max_{\\theta}\\; \\mathbb{E}_{(x,y^{*})\\sim D}\\,\\mathbb{E}_{(y,z)\\sim\\pi_{\\theta}}\\big[r(x,y,y^{*})\\big] - \\tau\\,\\mathrm{KL}\\!\\big(\\pi_{\\theta}(x)\\,\\|\\,\\pi_{\\theta_i}(x)\\big)',
  d:'매 반복 $i$에서 현재 정책 $\\pi_{\\theta_i}$를 기준으로 상대 엔트로피(KL) 정규화된 보상을 최대화한다. 이 문제는 닫힌 형태 해를 가져, 별도 가치함수 없이 오프폴리시 데이터를 재사용할 수 있게 해준다.'}
],

numbers:[
 {k:'AIME 2024 (long-CoT, pass@1)', v:'77.5', d:'OpenAI o1(74.4)과 대등, 사고 사슬을 짧게 압축하지 않은 기본 모델'},
 {k:'MATH 500 (long-CoT, EM)', v:'96.2', d:'o1(94.8)을 상회'},
 {k:'Codeforces (long-CoT, percentile)', v:'94th', d:'o1과 동률'},
 {k:'AIME 2024 (short-CoT, pass@1)', v:'60.8', d:'long2short 압축 모델. GPT-4o·Claude 3.5 Sonnet 대비 최대 +550% 우위'},
 {k:'MATH500 (short-CoT)', v:'94.6', d:'long2short 압축 모델'},
 {k:'RL 문맥 길이', v:'32k → 128k', d:'1 에폭씩 두 단계로 학습, 문맥이 길어질수록 성능이 계속 향상'}
],

impact:'[DeepSeek-R1](#/p/deepseek-r1)이 오픈소스 추론 모델의 문을 연 직후, 서로 다른 RL 알고리즘·인프라 설계로도 같은 급의 성능에 도달할 수 있음을 보여 "추론 RL에는 하나의 정답 레시피만 있는 게 아니다"라는 것을 실증했다. 가치함수 없는 정책 최적화, 긴 문맥 RL 스케일링, long2short 압축이라는 세 축은 이후 추론 모델 학습 인프라 설계에서 반복적으로 참조되는 선택지가 됐다.',

legacy:[
 '**가치함수 없는 정책 최적화**라는 선택이 [DeepSeek-R1](#/p/deepseek-r1)의 GRPO와 함께 "크리틱 없는 RL"이 추론 모델 학습의 주류가 되는 데 기여',
 '부분 롤아웃 같은 인프라 기법이 긴 문맥 RL을 실용적 비용으로 돌리는 방법의 참조 사례가 됨',
 'long2short(길이 페널티 + 모델 병합)이 "강한 추론 능력을 짧은 지연시간 모델에 이식"하는 실용적 배포 전략의 사례로 자주 인용됨'
],

pitfalls:[
 '**"MCTS·가치함수·PRM이 필요 없다"는 이 특정 파이프라인(온라인 mirror descent + 긴 문맥 롤아웃)에서의 결론이다.** [test-time-scaling](#/p/test-time-scaling)이 보여준 PRM 기반 탐색의 이득 자체를 부정하는 것은 아니다.',
 'long-CoT 결과(77.5/96.2/94th)와 short-CoT 결과(60.8/94.6)는 같은 모델의 서로 다른 두 버전이다 — 표를 볼 때 어느 버전 수치인지 반드시 구분해야 한다.',
 'AIME 2024 수치는 pass@1이지만, MATH 500은 EM(exact match) 지표로 보고된다 — 서로 다른 채점 방식이므로 다른 논문의 MATH500 pass@1 수치와 그대로 비교하면 안 된다.'
],

figures:[
 {f:'fig1-results.png',
  cap:'long-CoT 버전 k1.5(진한 파랑)를 OpenAI o1·o1-mini·QVQ-72B·QwQ-32B와 비교한 막대그래프. Math(AIME 2024·MATH 500)·Code(Codeforces·LiveCodeBench)·Vision(MathVista·MMMU) 세 그룹으로 나뉘며, 대부분의 막대에서 k1.5가 o1과 동급이거나 근소하게 앞선다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'We establish a simplistic, effective RL framework without relying on more complex techniques such as Monte Carlo tree search, value functions, and process reward models.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2501.12599', u:'https://arxiv.org/abs/2501.12599'}
]
});
