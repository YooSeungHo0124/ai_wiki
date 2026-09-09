WIKI.paper({
slug:'red-teaming',
venue:'arXiv-only report (Anthropic, 2022)',
authors:'Ganguli, Lovitt, Kernion et al. (Anthropic)',
arxiv:'2209.07858',

tldr:'사람으로 이뤄진 red team이 크기와 학습 방식이 다른 언어모델들을 상대로 유해한 발화를 유도하는 대화 38,961개를 직접 만들어, "모델이 커지면·정렬 기법을 쓰면 정말 덜 위험해지는가"를 실측한 논문. red teaming 자체를 반복 가능한 절차로 문서화하고 데이터셋을 통째로 공개했다.',

context:'[InstructGPT](#/p/instructgpt) 이후 RLHF로 정렬한 모델이 사람이 선호하는 답을 낸다는 것은 확인됐지만, 그 확인은 대개 정적인 벤치마크나 준비된 유해 프롬프트로 이뤄졌다. 실제 공격자는 준비된 질문을 던지지 않고, 대화를 여러 턴 끌면서 모델을 몰아세운다. 이 논문 이전에는 그런 적대적 대화를 사람이 직접, 대규모로, 여러 모델 크기에 걸쳐 수집한 공개 데이터가 없었다. 저자들은 같은 연구실의 이전 작업([InstructGPT](#/p/instructgpt) 계열의 helpful·honest·harmless 모델들)을 대상으로 삼아, "정렬을 거친 모델도 여전히 유해한 말을 하게 만들 수 있는가"를 사람이 직접 검증하는 절차를 만들었다.',

ideas:[
 {h:'대화형 red team 태스크 설계',
  lead:'크라우드워커가 모델과 여러 턴 대화하며 유해 발화를 유도하고 스스로 성공 여부를 평가한다.',
  d:'MTurk·Upwork에서 모집한 크라우드워커 324명이 한 세션에 5개 대화를 진행한다. 턴 수 제한은 두지 않았고 평균적으로 여러 턴을 주고받았다. 대화가 끝나면 red team 참가자가 자신의 공격이 얼마나 성공적이었는지를 0(실패)~4(매우 성공)의 5단계 Likert 척도로 직접 매긴다. 공격 방식은 자유 형식이라 특정 유해 카테고리를 강제하지 않았다.'},
 {h:'모델 크기 × 4가지 학습 방식의 2×2 스케일링 실험',
  lead:'2.7B~52B 세 크기, plain LM·prompted·rejection sampling·RLHF 네 방식을 교차해 공격 성공률을 비교한다.',
  d:'같은 파라미터 수의 decoder-only 모델을 (1) 아무 개입 없는 plain LM, (2) helpful·honest·harmless로 프롬프트만 준 모델, (3) 16개 샘플 중 harmlessness preference model이 고른 것을 내는 rejection sampling(RS), (4) 같은 preference model로 [PPO](#/p/instructgpt) 학습한 RLHF, 이 네 가지로 나눠 각각 2.7B·13B·52B에서 red team을 붙였다. 크기와 개입 방식을 동시에 바꿔가며 "무엇이 실제로 방어력을 만드는가"를 분리해서 본 것이 핵심 설계다.'},
 {h:'RLHF만 스케일에 따라 방어력이 늘어난다',
  lead:'RLHF 모델은 커질수록 공격이 더 어려워지지만, 나머지 세 방식은 크기와 무관하게 평평하다.',
  d:'`Mean Min Harmlessness` 지표(harmlessness preference model이 대화 전체에서 매긴 점수 중 최솟값, 낮을수록 유해)로 보면 RLHF만 52B로 갈수록 뚜렷이 올라간다. plain LM·prompted LM·RS는 세 크기에서 거의 같은 값을 유지한다. 특히 prompted LM이 plain LM보다 유의하게 안전하지 않다는 결과는, 정적 평가에서 HHH 프롬프트가 효과적이라던 이전 결과와 배치된다 — **프롬프트만으로는 대화형 공격을 못 막는다**는 뜻이다.'},
 {h:'RS는 가장 안전해 보이지만 회피로 점수를 딴다',
  lead:'rejection sampling이 가장 높은 harmlessness 점수를 받지만, 질적으로는 답을 회피해서 얻은 점수다.',
  d:'16개 샘플 중 preference model이 가장 무해하다고 고른 답을 내는 RS는 모든 크기에서 가장 공격이 어려운 모델로 나타난다. 그러나 저자들은 그 답들을 직접 읽고 "무해해서가 아니라 애매하게 답을 피해서" 높은 점수를 받는 경우가 많다고 지적한다. 자동 지표 하나만으로 "이 모델이 더 안전하다"고 결론 내리면 안 되는 이유다.'},
 {h:'공격 데이터셋과 절차를 통째로 공개',
  lead:'38,961개 red team 대화와 태스크 지침·통계 방법론을 공개해 재현·후속 연구를 가능하게 한다.',
  d:'기존에 공개된 유사 데이터셋(Bot Adversarial Dialogues, 약 5K 대화, 최대 2.7B 모델)보다 규모는 한 자릿수 크고 모델 크기도 한 자릿수 크다. RLHF로 안전 학습된 모델에 대한 red team 공격 데이터를 공개한 것은 이 논문이 처음이라고 저자들은 밝힌다. 목적은 자동화된 red team 기법이나 유해성 분류기를 만들 수 있는 재료를 커뮤니티에 넘기는 것이다.'}
],

diagram:{type:'loop', cap:'사람이 공격→모델이 응답→preference model과 red team 본인이 점수화→그 데이터로 다음 세대 모델을 다시 정렬하는 반복 절차.',
 center:'red team 주기',
 nodes:[
  {t:'대화 공격', s:'크라우드워커 다중 턴'},
  {t:'모델 응답', s:'2.7B~52B, 4가지 방식'},
  {t:'유해도 평가', s:'자기보고 + 보상모델'},
  {t:'데이터셋 축적', s:'38,961건'},
  {t:'재정렬', s:'RLHF 보상모델 갱신', acc:true}
 ]},

math:[
 {expr:'harmlessness score = f(대화) — RLHF의 보상모델과 동일한 preference model이 산출, 낮을수록 유해',
  tex:'r_\\theta(\\text{transcript}) = \\text{harmlessness score}',
  d:'red team 대화 전체를 이전 연구([InstructGPT](#/p/instructgpt) 계열)에서 쓴 것과 같은 harmlessness preference model에 통과시켜 점수를 낸다. 대화 안에서 AI가 낸 각 발화마다 점수를 매기고, 그 중 **최솟값**(가장 유해했던 순간)을 그 대화의 대표값으로 쓴다.'}
],

numbers:[
 {k:'수집한 red team 대화', v:'38,961건', d:'BAD 데이터셋(~5K)보다 한 자릿수 큼'},
 {k:'모델 크기 범위', v:'2.7B / 13B / 52B', d:'plain LM·prompted·RS·RLHF 4가지 방식 × 3개 크기'},
 {k:'red team 인원', v:'324명', d:'MTurk 307명 + Upwork 17명, 미국 기반'},
 {k:'참가자 편중', v:'상위 ~50명이 ~80% 생성', d:'약 300명 중 소수가 데이터셋 대부분을 만듦'},
 {k:'자기보고 공격 성공률', v:'평균 ~35%', d:'0~4 Likert 척도, red team 스스로 평가'},
 {k:'PII 유도 클러스터', v:'916건', d:'개인식별정보를 캐내려는 공격만 따로 군집됨'}
],

impact:'이 논문 이후 "red team 결과를 스케일링 그래프로 보여준다"가 정렬 연구의 표준 보고 방식이 됐다. 프롬프트만으로는 대화형 공격에 취약하다는 결과는 RLHF·[Constitutional AI](#/p/constitutional) 같은 학습 단계 개입의 필요성을 뒷받침하는 근거로 자주 인용된다. 또한 공개된 38,961건 데이터셋은 이후 자동화 red team·유해성 분류기 연구의 기본 재료가 됐다.',

legacy:[
 '**사람 중심에서 모델 중심으로** — 이 논문이 크라우드워커로 했던 일을 이후 연구들은 언어모델 자체에게 시킨다("LM red teams LM"), 사람의 비용·확장성 문제를 자동화로 우회하는 흐름이 이어짐',
 '**[Constitutional AI](#/p/constitutional)로의 방향 전환** — 사람이 매번 공격 대화를 만드는 대신, AI가 스스로 자기 답을 비판·수정하게 만들어 사람 red team 의존도를 줄이는 방식으로 진화',
 '**공격 성공률 스케일링 보고의 정착** — "모델을 키우면 안전해지는가"를 크기별 막대그래프로 보여주는 이 논문의 보고 형식이 이후 안전성 리포트의 관례가 됨',
 '**공개 red team 데이터셋 문화** — 데이터를 공개하되 위험을 어떻게 관리할지(공개 찬반)를 명시적으로 다룬 선례로 남음'
],

pitfalls:[
 '**공개된 공격 기법은 곧 무력화된다.** 데이터셋과 방법론을 공개하면 방어 연구에는 도움이 되지만, 공격자도 같은 자료로 학습하므로 "이 공격이 통했다"는 기록의 유효기간은 짧다. 저자들 스스로도 데이터 공개의 득실을 별도 절에서 논의한다.',
 '**사람 red team은 비용과 확장성의 벽이 있다.** 324명이 몇 주에 걸쳐 만든 게 38,961건이다. 모델과 배포 범위가 커지는 속도를 사람 손으로 따라잡을 수 없다는 것이 이후 자동화 red team 연구로 이어지는 직접적 동기다.',
 '**"red team을 통과했다"는 안전을 증명하지 않는다.** RS 모델이 가장 높은 harmlessness 점수를 받은 것은 실제로 안전해서가 아니라 답을 회피했기 때문일 수 있다는 저자들의 지적처럼, 단일 지표로 "안전 인증"을 내리는 것은 위험하다. 후속 실험에서 red team 3명 간 채점 일치도가 낮았다는 결과도 유해도 판정 자체의 불확실성을 보여준다.'
],

figures:[
 {f:'fig1-scaling.png',
  cap:'왼쪽: red team 자기보고 공격 성공률(높을수록 공격이 잘 먹힘). 가운데: harmlessness preference model이 매긴 평균 최소 점수(높을수록 안전). RLHF(빨강)만 52B로 갈수록 뚜렷이 올라가고, plain LM(파랑)·prompted LM(주황)·RS(초록)는 세 크기에서 거의 평평하다. 오른쪽: 같은 점수의 분포(violin plot) — RLHF·RS는 위쪽으로 쏠려 있다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-clusters.png',
  cap:'38,961개 공격을 UMAP으로 2차원에 투영한 것. 점 하나가 공격 하나, 색이 밝을수록(노랑) 그 공격이 성공적이었다는 뜻. 저자들이 수동으로 라벨을 붙인 클러스터들 — PII 유도, doxxing, 마약 제조·밀매, 차별적 발화 유도 등 — 이 타원으로 표시돼 있다. "유해함"이 하나의 축이 아니라 여러 이질적인 클러스터로 나뉜다는 것을 보여준다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'We find that the RLHF models are increasingly difficult to red team as they scale, and we find a flat trend with scale for the other model types.',
  src:'Abstract, p.1'},
 {t:'RS models are the most difficult to red team at any scale; however, qualitatively, they tend to be harmless by being evasive.',
  src:'§2, p.2'}
],

links:[
 {t:'arXiv 2209.07858 — Red Teaming Language Models to Reduce Harms', u:'https://arxiv.org/abs/2209.07858'},
 {t:'GitHub — anthropics/hh-rlhf (공개 데이터셋)', u:'https://github.com/anthropics/hh-rlhf'}
]
});
