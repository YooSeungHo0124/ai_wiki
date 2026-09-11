WIKI.paper({
slug:'maskgan',
venue:'ICLR 2018',
authors:'Fedus, Goodfellow & Dai (Google Brain)',
arxiv:'1801.07736',

tldr:'텍스트에 GAN을 적용하되, 문장을 처음부터 생성하는 대신 **가려진 부분을 채우는(in-filling)** 과제로 바꿔 학습을 안정시킨 논문. 이산 토큰이라 미분이 안 되는 문제를 policy gradient(actor-critic)로 우회한다.',

context:'2018년까지 신경망 텍스트 생성은 거의 전부 `[seq2seq](#/p/seq2seq)`나 자기회귀 언어모델을 최대우도(MLE)·teacher forcing으로 학습하는 방식이었다. 이 방식은 검증 perplexity를 낮추는 데는 잘 맞지만, 실제 생성 시점에는 학습 때 한 번도 보지 못한 자기 자신의 출력을 조건으로 계속 이어가야 해서(exposure bias) 샘플 품질이 perplexity가 시사하는 것만큼 좋지 않다. `[GAN](#/p/gan)`은 이미지에서 "그럴듯함" 자체를 직접 최적화해 이 문제를 우회했지만, 텍스트는 토큰 샘플링이 **이산적**이라 판별자의 그래디언트를 생성자로 역전파할 수 없다는 근본적인 장벽이 있었다. SeqGAN 등 선행 연구가 policy gradient로 이 장벽을 넘으려 했지만, 문장 전체가 끝나야만 보상 신호가 생겨 학습이 불안정했다.',

ideas:[
 {h:'문장 생성을 빈칸 채우기로 바꾼다',
  lead:'전체를 처음부터 생성하는 대신 가려진 구간만 문맥 조건으로 채워 넣는다.',
  d:'원문의 일부를 삭제(마스킹)하고, 모델이 나머지 진짜 문맥을 조건으로 그 구간만 원문과 구별되지 않게 채우도록 학습한다. 전체 구간이 가려지면 이 과제는 일반 언어모델링으로 자연스럽게 환원된다. 문맥이 있는 상태에서 빈 부분만 채우므로, 처음부터 끝까지 아무 근거 없이 생성해야 하는 순수 언어모델보다 오차가 누적될 여지가 훨씬 적다.'},
 {h:'토큰 단위 보상으로 credit assignment을 세분화한다',
  lead:'판별자가 문장 전체가 아니라 매 토큰마다 진짜/가짜 확률을 매겨 보상을 준다.',
  d:'in-filling 과제는 판별자가 채워진 각 토큰이 진짜 문맥과 얼마나 자연스럽게 맞는지를 토큰별로 평가할 수 있게 만든다. 판별자는 마스킹된 시퀀스 $m(x)$ 라는 진짜 문맥을 함께 받아, "director director"처럼 애매한 반복이 나와도 어느 쪽이 가짜인지 문맥으로 판단할 수 있다. 문장 끝까지 기다려야 신호가 생기던 기존 방식보다 credit assignment가 훨씬 조밀해진다.'},
 {h:'actor-critic으로 이산 토큰의 미분 불가능성을 우회한다',
  lead:'REINFORCE 계열 policy gradient에 critic이 학습한 가치함수를 baseline으로 써 분산을 줄인다.',
  d:'판별자 출력의 로그값을 토큰별 보상 $r_t = \\log D_\\phi$ 로 정의하고, 생성자를 이 보상의 기대값을 최대화하는 정책으로 학습시킨다. REINFORCE 그래디언트 $\\nabla_\\theta \\mathbb{E}[R_t] = (R_t - b_t)\\nabla_\\theta \\log G_\\theta(\\hat x_t)$ 의 분산을 줄이기 위해, 판별자에 critic 헤드를 추가로 달아 가치함수 $b_t$ 를 baseline으로 추정한다.'},
 {h:'seq2seq 구조로 인코더가 마스킹된 문맥을 읽고 디코더가 채운다',
  lead:'인코더가 빈칸 있는 전체 문장을 먼저 읽고, 디코더가 자기회귀로 빈칸을 순서대로 채운다.',
  d:'인코더는 마스킹된 시퀀스 $m(x)$ 전체를 양방향으로 읽어 문맥 표현을 만들고, 디코더는 그 표현에 attention하면서 빈칸을 하나씩 자기회귀적으로 채워 넣는다. 언어모델 가중치로 먼저 사전학습한 뒤 in-filling 과제로 이어서 학습하는 것이 최종 절차다.'}
],

diagram:{type:'loop', cap:'생성자가 빈칸을 채우면 판별자+critic이 토큰별 보상을 주고, policy gradient로 생성자를 갱신하는 순환.',
 center:'빈칸 채우기 반복',
 nodes:[
  {t:'마스킹된 문장', s:'일부 토큰 삭제'},
  {t:'seq2seq 생성자', s:'인코더-디코더', acc:true},
  {t:'토큰별 판별자', s:'진짜/가짜 확률'},
  {t:'critic', s:'가치함수 baseline'},
  {t:'생성자 갱신', a:'REINFORCE'}
 ]},

math:[
 {expr:'∇θ E_G[R_t] = (R_t − b_t) ∇θ log G_θ(x̂_t)',
  tex:'\\nabla_{\\theta}\\mathbb{E}_G[R_t] = (R_t - b_t)\\,\\nabla_{\\theta}\\log G_{\\theta}(\\hat{x}_t)',
  d:'생성자 파라미터 $\\theta$ 에 대한 단일 토큰의 그래디언트 기여분. $R_t$ 는 판별자 보상의 할인 누적합, $b_t$ 는 critic이 추정한 baseline — RL 용어로는 어드밴티지 $A(a_t,s_t)=Q-V$ 에 해당한다.'},
 {expr:'D_φ(x̃_t | x̃_0:T, m(x)) = P(x̃_t = x_t^real | x̃_0:T, m(x))',
  tex:'D_{\\phi}(\\tilde{x}_t \\mid \\tilde{x}_{0:T}, m(\\mathbf{x})) = P(\\tilde{x}_t = x_t^{\\text{real}} \\mid \\tilde{x}_{0:T}, m(\\mathbf{x}))',
  d:'판별자가 진짜 마스킹 문맥 $m(x)$ 를 함께 조건으로 받아 각 토큰의 진위를 판정한다. 문맥 없이 채워진 시퀀스만 보면 애매한 반복 토큰(둘 중 어느 쪽이 가짜인지)을 구별할 수 없다는 것이 이 설계의 동기다.'}
],

numbers:[
 {k:'IMDB 사람 평가, MaskGAN vs MLE 언어모델', v:'전체 품질 58.0% vs 15.7%', d:'Mechanical Turk 블라인드 비교, 40단어 샘플 300쌍'},
 {k:'IMDB 사람 평가, MaskGAN vs MaskMLE', v:'44.3% vs 40.3%', d:'in-filling으로 학습한 MLE 베이스라인과도 근소하게 우위'},
 {k:'IMDB, Real samples vs MaskGAN', v:'62.3% vs 16.7%', d:'실제 텍스트에는 여전히 크게 못 미침 — 품질 격차가 남아있음'},
 {k:'PTB, MaskGAN vs SeqGAN', v:'37.0% vs 32.0%', d:'20단어 짧은 샘플에서는 우위 폭이 IMDB보다 좁음'},
 {k:'PTB 검증 perplexity (마스킹률 0.5)', v:'55.3', d:'MaskMLE 사전학습 단계 기준'},
 {k:'IMDB 검증 perplexity (마스킹률 0.5)', v:'87.1', d:'MaskMLE 사전학습 단계 기준'}
],

impact:'"텍스트 GAN이 왜 어려운가"라는 질문에 과제 재설계로 답한 사례다 — 이산 토큰이라는 근본 장벽 자체는 여전히 policy gradient로 우회할 수밖에 없지만, in-filling이라는 과제 선택이 토큰별 보상을 자연스럽게 제공해 학습 안정성을 실질적으로 개선했다. 검증 perplexity가 생성 품질의 직접적인 척도가 아니라는 주장을 사람 평가로 정량 입증한 것도 이 논문의 기여로, 이후 텍스트 생성 평가에서 자동 지표와 사람 평가를 병행하는 관행을 강화했다. 다만 저자들 스스로 인정하듯, 긴 연속 빈칸을 채우는 과제에서는 GAN 학습의 이득이 줄어들고 정책 그래디언트의 분산도 여전히 학습을 불안정하게 만든다.',

legacy:[
 '텍스트 GAN 학습을 안정시키려는 시도(과제 재설계, 보상 신호 세분화)는 이후 `[BERT](#/p/bert)` 류의 마스킹 언어모델링이 판별적 사전학습 목표로 자리잡는 흐름과 문제의식이 맞닿아 있음',
 '토큰 단위 보상으로 credit assignment을 조밀하게 만드는 아이디어는 이후 RLHF의 토큰/구간 단위 보상 설계 논의에 앞선 참조점으로 언급됨',
 '이산 시퀀스에 GAN을 적용하는 시도 자체는 이후 diffusion 기반 텍스트 생성 연구가 등장하며 상대적으로 비주류가 됨 — 이산 토큰의 미분 불가능성 문제를 정면 돌파하기보다 우회하는 접근이 이후 주류가 되었기 때문',
 'perplexity와 사람이 느끼는 생성 품질이 다를 수 있다는 실증은 이후 언어모델 평가에서 자동 지표에 대한 회의적 태도를 강화하는 데 기여'
],

pitfalls:[
 '**"GAN이라 완전히 미분 가능하게 학습된다"는 오해다.** 토큰 샘플링 자체는 여전히 미분 불가능하며, 생성자는 policy gradient(REINFORCE)로 학습되는 강화학습 문제로 남는다 — 저자들도 "우리 모델은 완전히 미분 가능하지 않다"고 3.3절에서 명시한다.',
 '**실제 텍스트와의 격차는 여전히 크다.** IMDB 사람 평가에서 real samples가 MaskGAN을 62.3% vs 16.7%로 크게 앞선다 — MLE 베이스라인 대비 개선이지 "사람이 구별 못 할 수준"이 아니다.',
 '**긴 연속 빈칸에서는 GAN 학습의 이득이 줄어든다.** 저자들은 연속된 단어 블록을 마스킹하는 실험에서 in-filling이 사실상 짧은 언어모델링 문제로 수렴해 GAN 학습의 효과가 크지 않았다고 결론(Discussion, §6)에서 직접 밝힌다.'
],

figures:[
 {f:'fig1-seq2seq-generator.png',
  cap:'파란 박스가 원문 그대로인 알려진 토큰, 보라 박스가 모델이 채워 넣은 토큰. 왼쪽 인코더 5개가 마스킹된 시퀀스(a, _, _, d, e)를 읽고, 오른쪽 디코더가 자기회귀로 x, y를 채운 뒤 다시 d, e를 이어 생성한다 — 점선 화살표가 샘플링 연산이다.',
  src:'원문 Figure 1, p.4'}
],

quotes:[
 {t:'We claim that validation perplexity alone is not indicative of the quality of text generated by a model.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1801.07736 — MaskGAN', u:'https://arxiv.org/abs/1801.07736'}
]
});
