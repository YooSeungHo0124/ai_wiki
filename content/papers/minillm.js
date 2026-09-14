WIKI.paper({
slug:'minillm',
venue:'ICLR 2024',
authors:'Gu, Dong, Wei, Huang (Tsinghua CoAI · Microsoft Research)',
arxiv:'2306.08543',

tldr:'생성 모델 증류의 표준이던 **정방향 KL을 역 KL로 바꾸고**, 그 목적함수를 정책 경사(policy gradient)로 최적화하는 온폴리시 학습법을 제안한다. 정방향 KL이 교사 분포의 빈 곳까지 덮으려다 확률을 흩뿌리는 문제를 역 KL의 mode-seeking 성질로 해결한다.',

context:'표준 knowledge distillation은 교사와 학생 분포 사이의 **정방향 KL** $KL[p\\Vert q_\\theta]$ 을 최소화한다. 분류처럼 출력 공간이 좁으면 문제가 없지만, 텍스트 생성처럼 출력 공간이 넓고 교사 분포에 많은 최빈값(mode)이 있으면 얘기가 다르다. 학생이 그 모든 최빈값을 다 커버하려 하면 확률질량이 교사 분포의 **거의 0에 가까운 영역**까지 퍼지고, 그 결과 자유 생성(free-run) 시 저품질 텍스트가 나온다. 특히 학생 모델이 교사보다 표현력이 훨씬 작은 LLM 증류에서 이 문제가 두드러진다.',

ideas:[
 {h:'정방향 KL 대신 역 KL을 최소화',
  lead:'$KL[q_\\theta\\Vert p]$ 는 교사의 주요 최빈값에 집중하고 빈 영역은 무시한다.',
  d:'$KL[p\\Vert q_\\theta]$(정방향)는 $q_\\theta$ 가 $p$ 의 모든 최빈값을 커버하도록(mode-covering) 강제해 표현력이 부족한 학생이 억지로 넓게 퍼진 분포를 배우게 만든다. 반대로 $KL[q_\\theta\\Vert p]$(역방향)는 $q_\\theta$ 가 $p$ 의 **큰 최빈값에만** 확률을 몰아주고 작은 최빈값은 무시해도 되는(mode-seeking) 성질을 가진다. 학생의 제한된 용량 안에서 "그럴듯한 문장"에 집중하게 만드는 데는 이쪽이 유리하다.'},
 {h:'역 KL의 그래디언트를 정책 경사로 유도',
  lead:'역 KL 최소화를 학생이 직접 생성한 시퀀스에 대한 강화학습 문제로 재구성한다.',
  d:'역 KL은 학생 분포 $q_\\theta$ 자신에 대한 기댓값이라 정방향 KL처럼 닫힌 형태로 미분할 수 없다. 이를 정책 경사 정리(Policy Gradient Theorem)로 풀어, 학생이 스스로 생성한 시퀀스 $y\\sim q_\\theta$ 에 대해 "각 스텝이 교사 분포 아래 얼마나 그럴듯한가"를 보상으로 주는 강화학습 형태로 바꾼다. 이 과정에서 학생 샘플링 경로로는 역전파하지 않는다.'},
 {h:'단일 스텝 분해로 분산을 줄인다',
  lead:'누적 보상 $R_t$ 대신 스텝별 보상 $r_t$ 의 기댓값을 직접 미분해 학습 분산을 낮춘다.',
  d:'정책 경사의 순진한 형태는 문장 앞부분의 오차가 뒤로 누적돼 분산이 크고, 특히 짧은 문장을 선호하게 만든다. 저자들은 그래디언트를 $(\\nabla L)_{Single}+(\\nabla L)_{Long}$ 두 항으로 분해해, 스텝별 생성 품질 $r_t$ 의 기댓값을 몬테카를로 없이 어휘 전체에 대한 합으로 직접 계산한다. 이 분해가 학습을 안정시키는 핵심 장치다.'},
 {h:'교사-학생 혼합 샘플링으로 보상 해킹을 막는다',
  lead:'매 스텝 교사 분포를 섞은 분포에서 샘플링해 학생이 퇴화된 문장으로 높은 점수를 받는 것을 막는다.',
  d:'학생 혼자 샘플링하면 반복 구절 같은 퇴화된 문장이 우연히 교사에게서 높은 점수를 받는 보상 해킹(reward hacking)이 관찰됐다. 매 스텝 $\\tilde p = \\alpha p + (1-\\alpha) q_\\theta$ 로 교사를 섞은 분포에서 샘플링하고 중요도 샘플링으로 편향을 보정해, 학생이 저품질 생성으로 교사를 속이는 경로를 줄인다.'}
],

diagram:{type:'compare', cap:'정방향 KL(SeqKD류)과 역 KL(MiniLLM)이 학생 분포를 다르게 만든다.',
 left:{t:'정방향 KL(mode-cover)', items:['교사의 모든 최빈값을 커버하려 함','빈 영역에도 확률을 흘림','저품질 생성 위험']},
 right:{t:'역 KL: mode-seeking', items:['교사의 주요 최빈값에 집중','빈 영역은 무시해도 됨','학생 용량 안에서 정확도↑']}},

math:[
 {expr:'θ = argmin KL[q_θ‖p] = argmin −E_{x~px, y~qθ}[log(p(y|x)/q_θ(y|x))]',
  tex:'\\theta=\\arg\\min_\\theta \\mathrm{KL}[q_\\theta\\Vert p]=\\arg\\min_\\theta -\\mathbb{E}_{x\\sim p_x,\\,y\\sim q_\\theta}\\left[\\log\\frac{p(y|x)}{q_\\theta(y|x)}\\right]',
  d:'MiniLLM의 학습 목적함수. 정방향 $KL[p\\Vert q_\\theta]$ 대신 역방향 $KL[q_\\theta\\Vert p]$ 을 최소화한다.'},
 {expr:'∇L(θ) = −E_{x,y~qθ}[ Σ_t (R_t − 1) ∇log q_θ(y_t|y_<t,x) ]',
  tex:'\\nabla L(\\theta)=-\\mathbb{E}_{x\\sim p_x,\\,y\\sim q_\\theta(\\cdot|x)}\\left[\\sum_{t=1}^{T}(R_t-1)\\,\\nabla_\\theta\\log q_\\theta(y_t|y_{<t},x)\\right]',
  d:'정책 경사 정리로 유도한 역 KL의 그래디언트. $R_t$ 는 스텝 $t$ 이후 남은 시퀀스가 교사 분포 아래 얼마나 그럴듯한지의 누적치다.'},
 {expr:'p̃(y_t|y_<t,x) = α·p(y_t|y_<t,x) + (1−α)·q_θ(y_t|y_<t,x)',
  tex:'\\tilde p(y_t|y_{<t},x)=\\alpha\\,p(y_t|y_{<t},x)+(1-\\alpha)\\,q_\\theta(y_t|y_{<t},x)',
  d:'교사-학생 혼합 샘플링(Teacher-Mixed Sampling). $\\alpha$ 가 교사 개입 강도를 조절하며, 이 논문은 $\\alpha=0.2$ 를 썼다.'}
],

numbers:[
 {k:'검증 모델 규모', v:'120M ~ 13B', d:'[GPT-2](#/p/gpt2), OPT, [LLaMA](#/p/llama) 세 계열에서 스케일링 확인'},
 {k:'교사 모델', v:'GPT-2-1.5B · GPT-J 6B · OPT 13B', d:'가족별로 다른 크기의 교사를 사용'},
 {k:'교사-학생 혼합 강도', v:'α = 0.2', d:'전 실험에서 고정'},
 {k:'GPT-4 평가', v:'SeqKD 대비 전 구간에서 우위', d:'120M~13B 전 스케일에서 일관되게 SeqKD를 능가(Figure 1)'}
],

impact:'생성 모델을 위한 KD의 목적함수 선택이 결과를 좌우한다는 것을 명확히 보였다. 분류에서 잘 작동하던 정방향 KL을 텍스트 생성에 그대로 가져다 쓰는 관행에 문제를 제기하고, "학생이 스스로 생성한 분포에 대해 학습한다"는 온폴리시 아이디어를 강화학습의 언어로 정식화했다. 이 정식화는 이후 발산 종류와 온폴리시 비율을 일반화한 [GKD](#/p/gkd)로 곧바로 이어진다.',

legacy:[
 '**발산 선택 논쟁의 출발점** — 역 KL의 mode-seeking을 증류에 도입한 이 논문 이후, 어떤 발산이 어떤 상황에 맞는지가 후속 연구의 핵심 질문이 됨',
 '**[GKD](#/p/gkd)의 직접적 토대** — GKD는 MiniLLM의 온폴리시 정책 경사 아이디어를 발산 종류·데이터 비율이라는 두 축으로 일반화한다',
 '**[DistiLLM](#/p/distillm)의 문제의식으로 이어짐** — 온폴리시 샘플링의 연산 비용과 보상 해킹 문제는 DistiLLM의 skew KL·적응적 오프폴리시 설계로 이어짐'
],

pitfalls:[
 '**역 KL이 항상 우월한 것은 아니다.** mode-seeking은 학생 용량이 부족할 때 유리하지만, 다양성이 중요한 과제에서는 오히려 생성이 단조로워질 위험이 있다.',
 '**정책 경사 기반 학습은 온폴리시 샘플링 비용이 든다.** 매 스텝 학생이 직접 생성해야 하므로, 고정 데이터셋으로 학습하는 SeqKD보다 연산 비용이 높다.',
 '**교사-학생 혼합·단일 스텝 분해 같은 안정화 장치 없이는 학습이 발산하기 쉽다.** 역 KL을 정책 경사로 최적화하는 아이디어 자체보다, 이 안정화 장치들이 실제 성능을 가른다.'
],

figures:[
 {f:'fig1-scaling.png',
  cap:'세 교사-학생 조합(GPT-2, GPT-J, OPT) 모두에서 MiniLLM(실선)이 SeqKD(점선)보다 학생 파라미터 규모 전 구간에서 높은 GPT-4 평가 점수를 받는다. x축이 학생 크기, y축이 평균 GPT-4 점수.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-toy-kld.png',
  cap:'세 개의 봉우리를 가진 target 분포(파랑)를 단일 가우시안으로 근사한 토이 실험. 정방향 KL(주황 점선)은 세 봉우리에 걸쳐 낮고 넓게 퍼지고, 역 KL(초록 점선)은 가장 큰 봉우리 하나에 집중한다 — mode-covering과 mode-seeking의 차이를 그대로 보여준다.',
  src:'원문 Figure 2, p.2'}
],

links:[
 {t:'arXiv 2306.08543 — MiniLLM', u:'https://arxiv.org/abs/2306.08543'},
 {t:'공식 코드 (microsoft/LMOps)', u:'https://github.com/microsoft/LMOps/tree/main/minillm'}
]
});
