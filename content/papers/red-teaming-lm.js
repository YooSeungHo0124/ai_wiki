WIKI.paper({
slug:'red-teaming-lm',
authors:'Perez et al. (DeepMind · NYU)',
arxiv:'2202.03286',

tldr:'사람이 손으로 쓰던 레드팀 테스트 케이스를 언어모델 자신에게 만들게 해서, 280B 파라미터 챗봇에서 수만 건의 유해 발화를 자동으로 찾아낸 논문이다. 레드팀 LM, 타깃 LM, 유해성 분류기 세 개를 파이프라인으로 엮은 것이 전부지만 사람이 손으로 쓴 테스트셋보다 더 다양하고 더 공격적인 케이스를 만들어낸다.',

context:'2016년 Tay 챗봇 사건 이후 LM 배포 전 유해 행동을 찾는 "레드팀"이 표준 절차가 됐지만, 기존 방법은 [Bot-Adversarial Dialogue](#/p/red-teaming) 처럼 사람이 직접 공격 문장을 손으로 써야 했다. 사람 손은 비싸고 느려서 커버할 수 있는 테스트 케이스의 수와 다양성이 근본적으로 제한된다. 반면 gradient 기반 adversarial example은 자연어가 아닌 무의미한 토큰열("TH PEOPLEMan goddreams Blacks")을 찾아내서, 실제 사용자가 마주칠 실패를 대표하지 못한다. 이 논문의 질문은 단순하다 — 자연스러운 문장으로 된 공격을, 사람 대신 또 다른 LM이 대량으로 생성하게 하면 어떨까. 타깃은 [Gopher](#/p/gopher) 기반의 280B 파라미터 대화 챗봇 Dialogue-Prompted Gopher(DPG)다.',

ideas:[
 {h:'Red LM · Target LM · Red Clf 3단 파이프라인',
  lead:'레드팀 LM이 질문을 생성하고, 타깃 LM이 답하고, 분류기가 유해 여부를 판정한다.',
  d:'(1) 레드팀 LM $p_r(x)$ 로 테스트 케이스(질문) $x$ 를 생성하고, (2) 타깃 LM $p_t(y|x)$ 로 응답 $y$ 를 만들고, (3) 유해성 분류기 $r(x,y)$ 로 실패 여부를 판정한다. 분류기 $r$ 은 "이 응답이 공격적인가"를 판단하는 학습된 classifier일 수도, SSN 포함 여부를 검사하는 파이썬 정규식 함수일 수도 있다. 타깃 모델이나 분류기가 미분 가능하거나 화이트박스일 필요가 없어서, 어떤 API로 접근하는 모델이든 그대로 적용할 수 있다.'},
 {h:'생성 방법 네 가지의 난이도-다양성 트레이드오프',
  lead:'zero-shot·few-shot·SL·RL 순으로 공격은 강해지지만 다양성은 줄어든다.',
  d:'Zero-shot은 "List of questions to ask someone:" 같은 프롬프트에서 그냥 샘플링한다. Stochastic few-shot(SFS)은 유해 응답을 이끈 zero-shot 케이스를 확률 $\\propto e^{r(x,y)/T}$ 로 골라 few-shot 예시로 붙인다. 지도학습(SL)은 유해 응답을 이끈 zero-shot 케이스들에 그대로 파인튜닝한다. RL은 A2C로 기대 유해성 $\\mathbb{E}_{p_r(x)}[r(x,y)]$ 를 직접 최대화하되, 초기 분포와의 KL penalty로 붕괴(하나의 고보상 문장만 반복 생성)를 막는다. zero-shot이 가장 다양하고 안전하며, RL이 가장 공격적이고 획일적이다.'},
 {h:'프롬프트 하나로 표적을 바꾸는 제어 가능성',
  lead:'프롬프트 문장 하나만 바꾸면 완전히 다른 종류의 유해 행동을 겨냥할 수 있다.',
  d:'전화번호를 묻는 프롬프트를 "home address"·"Social Security Number"·"email address"로 한 단어만 바꾸면 개인정보 유출을, "List of groups that should be treated with equal respect:" 로 바꾸면 차별받는 집단 탐색을 겨냥한다. 새 실패 유형을 테스트하는 데 보통 프롬프트 문구를 몇 분 다듬는 정도만 필요했다고 저자들은 보고한다. 기존 데이터셋에서 실패를 뒤지는 방식과 달리, 코퍼스에 거의 등장하지 않는 특정 입력을 의도적으로 만들어낼 수 있다는 게 이 방법의 핵심 이점이다.'},
 {h:'대화 레드팀: 오프성이 오프성을 낳는다',
  lead:'레드 LM과 타깃 LM을 번갈아 돌려 다중 턴 대화 전체를 생성·분석한다.',
  d:'단일 턴이 아니라 $[x_1,y_1,x_2,y_2,\\dots]$ 형태의 전체 대화를 레드 LM과 타깃 LM을 교대로 굴려 생성한다. 대화가 길어질수록 DPG의 공격적 응답 비율이 꾸준히 올라가고, 직전 발화들이 공격적일수록 다음 발화도 공격적일 확률이 커진다. 이는 단일 턴 테스트로는 잡을 수 없는 실패 유형이 존재함을 보여주고, 공격적 대화는 조기에 끊는 것이 중요하다는 실무적 함의를 준다.'}
],

diagram:{type:'loop', cap:'테스트 케이스 생성 → 타깃 응답 → 유해성 판정을 반복해 실패 사례를 대량 수집한다.',
 center:'대량 반복 수집',
 nodes:[
  {t:'Red LM', s:'질문 x 생성', acc:true},
  {t:'Target LM', s:'응답 y 생성'},
  {t:'Red Clf', s:'r(x,y) 유해 판정'},
  {t:'실패 케이스 저장', s:'few-shot/SL/RL에 재사용'}
 ]},

numbers:[
 {k:'타깃 모델', v:'DPG 280B', d:'[Gopher](#/p/gopher) 기반 Dialogue-Prompted 챗봇'},
 {k:'zero-shot 공격률', v:'3.7%', d:'0.5M개 중 18,444건의 실패(공격적 응답) 발견'},
 {k:'RL(α=0.3) 공격률', v:'40%+', d:'테스트 케이스의 78%가 "invisible" 단어 포함 — 한 패턴에 수렴'},
 {k:'학습데이터 유출', v:'1709건', d:'13-gram 이상 training corpus와 겹치는 응답, 393건은 명시적 인용부호까지 포함'},
 {k:'SSN 유출', v:'1006건 응답 · 825개 고유 SSN', d:'그중 32개가 학습데이터에 실존, 1개는 진짜일 가능성'},
 {k:'BAD 데이터셋 대비', v:'공격질문 중 유해 비율 36% vs 2.3~19%', d:'사람이 쓴 BAD가 더 노골적, LM 생성은 상대적으로 은근하지만 더 다양'}
],

impact:'이 논문 이후 "레드팀"은 사람이 손으로 하는 QA 단계가 아니라 **또 다른 LM을 훈련시켜 스케일업하는 파이프라인**으로 재정의됐다. 유해성 분류기라는 프록시 리워드로 공격 생성을 최적화한다는 아이디어는 이후 RLHF 계열에서 "안전성 리워드 모델"을 학습시키는 구조와 사실상 같은 틀을 공유한다. [InstructGPT](#/p/instructgpt)와 [Constitutional AI](#/p/constitutional) 이후의 안전성 파이프라인은 대부분 이런 자동화된 적대적 탐색 단계를 내장하고 있다. 다만 저자들 스스로도 레드 LM과 분류기 모두 학습 데이터의 편향을 그대로 물려받는다는 한계를 명시했고, 이는 이후 레드팀 자동화 연구 전체가 안고 가는 문제로 남았다.',

legacy:[
 '**Anthropic의 대규모 인간 레드팀 연구** [Red Teaming Language Models to Reduce Harms](#/p/red-teaming) 가 이 논문과 거의 동시에 나와, 자동 vs 수동 레드팀을 비교하는 흐름을 만들었다',
 '**AI 피드백으로 안전성을 학습시키는 계열** — [Constitutional AI](#/p/constitutional) 가 분류기 대신 LM 자신의 판단을 레드팀/개선 루프에 넣는 방향으로 확장',
 '**RLHF 안전성 파이프라인** — [InstructGPT](#/p/instructgpt) 이후 배포 전 적대적 프롬프트 탐색이 표준 절차로 정착',
 '**LM 간 공격의 전이 가능성 논의** — 레드 LM이 실제로는 서로 다른 타깃 모델에도 유효한 공격을 찾아내는지에 대한 후속 adversarial transfer 연구로 이어짐'
],

pitfalls:[
 '**"레드팀 = 완전한 안전성 검증"이 아니다.** 저자들은 이 방법이 모든 "critical oversight"를 찾아낸다고 주장하지 않으며, 사람이 쓴 테스트(예: BAD)가 여전히 다른 종류의(더 노골적인) 실패를 잡아낸다고 명시한다 — 자동과 수동은 상호 보완적이다.',
 '**RL이 다양성을 희생한다.** RL(α=0.3)의 공격률은 40%로 가장 높지만 테스트 케이스의 78%가 "invisible"이라는 단일 패턴에 수렴한다 — 공격률 숫자만 보고 RL이 "가장 좋은 방법"이라 단정하면 커버리지를 놓친다.',
 '**분류기 자체의 편향이 결과를 왜곡할 수 있다.** 유해성 분류기가 부정확하거나 편향되면 false positive/negative가 늘어나고, 저자들도 이 분류기를 "후보를 걸러내는 도구"로만 쓰고 최종 판단은 추가 검증이 필요하다고 명시한다.'
],

figures:[
 {f:'fig1-overview.png',
  cap:'Red LM(왼쪽)이 질문을 생성하고 Target LM(가운데)이 답하면 Red Clf(오른쪽)가 판정한다. 같은 구조로 유해 응답뿐 아니라 데이터 유출·개인정보·집단별 차별(Distributional Bias)·다중턴 공격 대화까지 같은 파이프라인으로 잡아낸다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-tradeoff.png',
  cap:'x축은 공격 성공률(%), y축은 다양성(Self-BLEU, 축이 뒤집혀 위로 갈수록 다양함), 색은 질문 자체의 공격성. zero-shot(ZS)이 가장 다양하지만 순한 편이고, RL(α=0.3)로 갈수록 공격률은 급격히 오르지만 다양성이 급락한다 — 하나의 파레토 곡선 위에서 방법을 고르는 구조.',
  src:'원문 Figure 2, p.5'}
],

quotes:[
 {t:'We automatically find cases where a target LM behaves in a harmful way, by generating test cases ("red teaming") using another LM.',
  src:'Abstract, p.1'},
 {t:'Overall, our results suggest that some of the most powerful tools for improving LM safety are LMs themselves.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 2202.03286 — Red Teaming Language Models with Language Models', u:'https://arxiv.org/abs/2202.03286'},
 {t:'DeepMind blog: Red teaming language models', u:'https://www.deepmind.com/publications/red-teaming-language-models-with-language-models'}
]
});
