WIKI.paper({
slug:'alpaca-eval',
venue:'arXiv 2024 (COLM 2024 제출)',
authors:'Dubois, Galambosi, Liang, Hashimoto (Stanford University)',
arxiv:'2404.04475',

tldr:'LLM 심판이 답의 질과 무관하게 **길이가 긴 답을 선호**하는 편향을, 회귀 모델로 그 효과만 상쇄하는 간단한 사후 보정법을 제안한 논문. 모델·길이·문항 난이도 세 항으로 나눈 로지스틱 회귀에서 길이 항만 0으로 놓고 반사실적 승률을 계산해, AlpacaEval과 [Chatbot Arena](#/p/chatbot-arena) 사이 스피어만 상관을 0.94에서 0.98로 끌어올렸다.',

context:'2024년 초 LLM 평가는 GPT-4를 심판으로 쓰는 자동 평가([AlpacaEval](https://github.com/tatsu-lab/alpaca_eval), MT-Bench, WildBench)가 [Chatbot Arena](#/p/chatbot-arena) 같은 값비싼 사람 평가를 대체하는 표준 관행이 되어 있었다. 문제는 이 LLM 심판들이 정답의 질과 무관한 표면적 특징 — 특히 **응답 길이** — 에 강하게 낚인다는 것이었다. 개발자가 그냥 "최대한 자세히 답하라"는 프롬프트 한 줄만 추가해도 리더보드 순위가 흔들릴 정도였다. 저자들은 AlpacaEval의 저자 그룹 자신으로서, 길이라는 스푸리어스 상관을 인과추론의 **매개변수 통제(controlled direct effect)** 관점에서 제거하는 방법을 제시한다.',

ideas:[
 {h:'길이를 매개변수로 보는 인과 그래프',
  lead:'모델 정체성이 응답 품질(직접 효과)과 응답 길이(간접 효과) 둘 다에 영향을 준다고 본다.',
  d:'모델이 무엇이냐(model identity)는 응답의 실제 품질에 직접 영향을 주는 동시에, 응답이 얼마나 기냐(length)에도 영향을 준다. 이 길이가 다시 심판의 판정(preference)에 영향을 준다면, 길이는 원치 않는 매개변수(undesirable mediator)다. 목표는 "모델과 베이스라인의 출력 길이가 같았다면 승률이 어땠을까"라는 반사실적 질문에 답하는 것 — 이것이 **통제된 직접 효과**의 정의 그대로다.'},
 {h:'모델·길이·문항 난이도 세 항의 로지스틱 회귀',
  lead:'승률을 모델 항, 길이 차 항, 문항 난이도 항의 합으로 분해해 회귀로 각각의 기여를 추정한다.',
  d:'AlpacaEval의 원 판정 확률을 로지스틱 회귀 $q_{\\theta,\\phi,\\psi}$ 로 근사한다. 모델 항 $\\theta_m-\\theta_b$ 은 브랜드 자체의 기본 승률, 길이 항은 정규화된 길이 차이를 $\\tanh$ 로 눌러 diminishing return을 반영, 문항 난이도 항 $\\gamma_x$ 는 "이 질문이 베이스라인에게 원래 유리한가"를 흡수한다. 문항 난이도는 모델에 의해 인과적으로 발생하는 게 아니지만, 조건으로 넣으면 회귀 추정의 분산이 줄어든다(Pearl 2009) — 그래서 포함한다.'},
 {h:'길이 항만 0으로 놓고 반사실적 승률을 계산한다',
  lead:'학습된 회귀에서 length 항을 제거한 채 예측하면 곧 길이 보정 승률이 된다.',
  d:'길이 차이가 0이라고 가정하면 $\\tanh$ 항이 그대로 사라지므로, 남은 모델 항과 문항 항만으로 예측 확률을 계산한다 — 이것이 길이 보정(LC) 승률이다. 이 절차는 AlpacaEval의 두 성질(항등성: 자기 자신과 비교하면 50%, 대칭성: `winrate(m,b)=100%-winrate(b,m)`)을 수학적으로 그대로 보존한다. 시그모이드의 대칭성과 $\\tanh$ 가 홀함수라는 성질이 이걸 보장한다.'},
 {h:'적대적 트렁케이션 공격에 대비한 정규화',
  lead:'길이 항 계수에 약한 정규화를 걸어 "짧게 잘라서 이득 보기" 공격을 무력화한다.',
  d:'모델 출력을 의도적으로 짧게 잘라 베이스라인과 길이를 맞추면, 원래는 나쁜 답이었는데도 회귀가 "품질이 원래 좋았다"고 착각해 반사실적 승률을 과대평가할 수 있다(정규화 없이 GPT-4 트렁케이션 공격 시 3.7% → 25.9%로 폭등). $\\phi_{m,b}$(길이-모델 상호작용 계수)에 약한 L2 정규화를 걸면 이 편법의 이득이 12.2%로 크게 줄어들고, 정상적인 모델의 점수에는 감지할 수 없는 수준의 영향만 남는다.'},
 {h:'한 베이스라인으로 학습해도 임의의 베이스라인 쌍을 예측할 수 있다',
  lead:'회귀 계수를 한 번 추정하면 리더보드 전체의 모든 모델 쌍 승률을 재구성할 수 있다.',
  d:'회귀가 모델별 계수 $\\theta_m, \\phi_{m,b}, \\psi_m$ 를 개별적으로 추정하므로, 고정된 베이스라인 하나로 학습한 뒤에도 리더보드에 있는 임의의 두 모델 사이 승률을 계산해낼 수 있다. 이 성질 덕분에 새 베이스라인으로 리더보드를 다시 계산하는 것도 재학습 없이 가능하다.'}
],

diagram:{type:'flow', cap:'AlpacaEval-LC의 계산 순서. 마지막 단계에서 길이 항만 지워 반사실을 만든다.',
 nodes:[
  {t:'원 판정 데이터', s:'{x,zm,zb,m,b,y}'},
  {t:'GLM 적합', s:'모델+길이+문항 3항', acc:true},
  {t:'길이 항 0으로', a:'반사실'},
  {t:'LC 승률 계산', s:'winrate_LC(m,b)'}
 ]},

math:[
 {expr:'q(y=1|·) = logistic( θm−θb + φm,b·tanh((len(zm)−len(zb))/std) + (ψm−ψb)γx )',
  tex:'q_{\\theta,\\phi,\\psi}(y{=}1\\mid \\cdot) = \\text{logistic}\\Big(\\underbrace{\\theta_m-\\theta_b}_{\\text{Model}} + \\underbrace{\\phi_{m,b}\\cdot\\tanh\\!\\Big(\\tfrac{\\text{len}(z_m)-\\text{len}(z_b)}{\\text{std}(\\text{len}(z_m)-\\text{len}(z_b))}\\Big)}_{\\text{Length}} + \\underbrace{(\\psi_m-\\psi_b)\\gamma_x}_{\\text{Instruction}}\\Big)',
  d:'AlpacaEval 판정을 근사하는 3항 로지스틱 회귀(식 1). 정규화된 길이 차이를 $\\tanh$ 로 눌러 큰 길이 차이일수록 한계 효과가 줄어들게 만든다.'},
 {expr:'winrate_LC(m,b) = 100 · E_x[ logistic(θm−θb + (ψm−ψb)γx) ]',
  tex:'\\text{winrate}_{LC}(m,b) = 100 \\cdot \\mathbb{E}_x\\big[\\text{logistic}(\\theta_m-\\theta_b + (\\psi_m-\\psi_b)\\gamma_x)\\big]',
  d:'길이 항을 제거(반사실: $\\text{len}(z_m)=\\text{len}(z_b)$)한 뒤 얻는 길이 보정 승률(식 2). 전체 파라미터 수는 모델 $M$개·문항 $N$개에 대해 $3M+N$개이고, $M{>}128,\\ N{=}805$ 규모에서 5-fold 교차검증과 L2 정규화로 과적합을 막는다.'}
],

numbers:[
 {k:'AlpacaEval 원 규모', v:'805개 고정 문항 · 120개+ 모델', d:'GPT-4 turbo가 베이스라인이자 심판'},
 {k:'Chatbot Arena 스피어만 상관', v:'0.94 → 0.98', d:'AlpacaEval 대비 LC 적용 후. 25개 이상 Arena 모델을 포함한 벤치마크 중 최고치'},
 {k:'장황함 프롬프트에 대한 민감도', v:'22.9~64.3% → 41.9~51.6%', d:'gpt4_1106_preview 기준. 변동폭의 정규화 표준편차는 25% → 10%로 감소'},
 {k:'적대적 트렁케이션 공격 승률', v:'3.7 → 25.9(무정규화) → 12.2(정규화)', d:'GPT-4 출력을 짧게 잘라 길이를 맞추는 공격 시나리오'},
 {k:'다른 보정법과 비교 (Chatbot Arena 상관)', v:'LC 0.98 > 길이정규화 0.96 > 길이균형 0.95 > 원 승률 0.94', d:'게임가능성(변동성)도 LC가 10%로 최저'}
],

impact:'AlpacaEval-LC는 "자동 평가가 결국 사람 선호를 대신한다"는 전제를 유지하면서도, 그 근사가 갖는 구체적 편향 하나를 **재학습 없이, 사후 통계 보정만으로** 없앨 수 있음을 보였다. 이후 리더보드 다수가 원 승률 대신 길이 보정 버전을 기본값으로 채택했고, "평가 지표를 편향 원인별로 회귀 분해해 통제한다"는 접근이 서식(마크다운 사용량)·자기 선호 같은 다른 편향에도 같은 틀로 적용 가능하다는 방법론적 선례를 남겼다. 다만 이것은 LLM 심판이라는 근본 장치 자체의 한계(사실성 오류를 못 잡는다는 등)를 없애는 것은 아니라고 저자들이 명시한다.',

legacy:[
 '**"게임 가능한 벤치마크"에 대한 표준 대응 사례** — 벤치마크가 뚫리면 재설계 대신 회귀 기반 사후 보정으로 먼저 대응한다는 패턴을 남김',
 '**RLHF 보상모델의 길이 편향 연구와 접속** — 명시적/암묵적 보상모델에서 길이를 분리하려는 연구([DPO](#/p/dpo) 계열 포함)와 문제의식을 공유하며 상호 인용됨',
 '**[Chatbot Arena](#/p/chatbot-arena)의 스타일 통제 순위 도입 촉발** — Arena 쪽도 길이·마크다운 사용량을 회귀로 통제한 style-controlled 순위를 이후 도입',
 '**다른 자동 평가자로의 방법 확산** — 같은 회귀 분해 틀이 길이 외에 리스트 사용·자기 선호 같은 다른 편향 특징에도 그대로 적용 가능하다는 것이 후속 논의의 출발점이 됨'
],

pitfalls:[
 '**자동 평가는 여전히 사람 평가의 근사일 뿐이다.** 이 논문이 정답으로 삼는 [Chatbot Arena](#/p/chatbot-arena) 자체도 저자들이 "은(silver) 표준"이라 부르며 완전한 정답으로 취급하지 않는다 — 인터넷 사용자가 사실성보다 표면적 특징에 끌릴 수 있다는 한계를 그대로 물려받는다. 스피어만 상관 0.98을 "사람 선호와 사실상 같다"로 과잉 해석하면 안 된다.',
 '**길이 편향 하나만 다룬다.** 논문이 명시하듯 자기 선호(self-bias)·리스트 서식 등 다른 편향은 다루지 않으며, Table 2는 심판을 바꿔도 순위가 크게 변하지 않는다는 예비 결과일 뿐 다른 편향이 없다는 증거는 아니다.',
 '**길이 정규화(length-normalized) 방법이 실은 수치상 큰 차이 없이 비슷한 성능을 낸다.** 저자들도 Table 1에서 LN이 게임가능성 면에서 오히려 근소하게 나을 수 있음을 인정하며, LC를 택한 이유는 성능 우위가 아니라 **해석 가능성**(승률 성질 유지)과 인과적 정당성 때문이라고 명시한다 — "LC가 모든 지표에서 압도적으로 최고"라고 읽으면 논문의 실제 주장보다 과장된다.'
],

figures:[
 {f:'fig1-correlation.png',
  cap:'x축은 다양한 정적 벤치마크, 막대 색과 숫자가 각각의 Chatbot Arena와의 스피어만 상관. Output Length(단순 길이만으로 예측)조차 0.35의 상관을 보인다는 것이 길이 편향이 실재함을 보여주는 근거이고, 맨 오른쪽 빨간 글씨 LC AlpacaEval 2.0이 0.98로 모든 벤치마크 중 최고치를 찍는다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-causal.png',
  cap:'파란 Model m이 원인, 흰 Preference y가 결과. 주황 두 노드(Other mediator, Output length)를 거쳐가는 간접 경로를 차단하고, 파란 곡선으로 표시된 "Desired interaction"(직접 효과)만 남기는 것이 이 논문 전체의 목표를 한 장으로 요약한다. 회색 Instruction x는 통제는 하되 인과 경로 차단 대상은 아니다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'What would the AlpacaEval win rate be, if the outputs of the evaluated model m had the same length as those of the baseline b?',
  src:'Section 3, p.3'}
],

links:[
 {t:'arXiv 2404.04475 — Length-Controlled AlpacaEval: A Simple Way to Debias Automatic Evaluators', u:'https://arxiv.org/abs/2404.04475'},
 {t:'AlpacaEval 공식 저장소 및 리더보드', u:'https://github.com/tatsu-lab/alpaca_eval'}
]
});
