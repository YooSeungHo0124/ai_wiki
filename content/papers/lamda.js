WIKI.paper({
slug:'lamda',
venue:'arXiv 2022 (Google)',
authors:'Thoppilan et al. (Google)',
arxiv:'2201.08239',

tldr:'137B 파라미터 대화 전용 모델. 품질(SSI)·안전·사실성(groundedness)을 **서로 다른 지표로 쪼개고**, 사실성은 스케일만으로는 거의 개선되지 않는다는 것을 보인 뒤 검색·계산기·번역기 같은 외부 도구를 호출해 답을 검증하는 구조로 메운 논문.',

context:'2020년대 초 대화 모델의 표준 관행은 "그럴듯한 다음 발화"를 만드는 것 하나에 최적화하는 것이었다 — perplexity를 낮추면 자연스러움은 좋아지지만, 모델이 지어낸 사실을 검증할 방법이 없었다. [GPT-3](#/p/gpt3)류 범용 언어모델도 대화에 쓸 수는 있지만 도메인 대화 데이터로 특화되지 않았고, 사실 오류를 자체적으로 걸러내지 못했다. LaMDA는 두 갈래로 문제를 나눈다. 첫째는 "사람이 원하는 대화란 무엇인가"를 **감각성(sensibleness)·구체성(specificity)·흥미도(interestingness)** 로 정의하는 것, 둘째는 "모델이 하는 말이 사실인가"를 별도의 **groundedness** 지표로 검증하는 것이다. [Transformer](#/p/transformer) decoder를 2.97B 문서·1.56T 단어(대화 데이터+웹 텍스트)로 사전학습한 뒤, 이 두 갈래를 각각 파인튜닝으로 공략한다.',

ideas:[
 {h:'품질을 SSI 세 축으로 분해한다',
  lead:'"좋은 대화"를 감각성·구체성·흥미도 세 개의 독립 지표로 쪼개 각각 측정한다.',
  d:'감각성은 발화가 맥락에 모순 없이 말이 되는지, 구체성은 일반적인 대답이 아니라 그 맥락에 특정된 답인지, 흥미도는 사람의 주의를 끌 만큼 통찰력 있는지를 크라우드워커가 채점한다. 이 세 지표를 평균한 것이 SSI 점수다. 지표를 쪼갠 덕분에 어떤 파인튜닝이 어느 축을 개선하는지 디버깅할 수 있다.'},
 {h:'안전은 품질과 별개의 축이다',
  lead:'품질(SSI) 점수가 높아도 유해할 수 있어 안전을 독립된 지표·데이터로 다룬다.',
  d:'사전학습만으로는 안전성이 스케일에 따라 거의 개선되지 않는다 — 다음 토큰 예측 손실은 학습 코퍼스에 섞인 안전한 발화와 위험한 발화를 구분하지 않기 때문이다. 그래서 사람이 정의한 안전 목표(safety objectives)에 대해 크라우드워커가 라벨링한 데이터로 별도 분류기를 파인튜닝하고, 생성된 후보 응답을 이 분류기로 걸러낸다.'},
 {h:'외부 도구를 호출해 사실성을 검증한다',
  lead:'검색·계산기·번역기로 구성된 툴셋(TS)에 질의해 근거 있는 답만 내놓는다.',
  d:'LaMDA-Base가 초안을 만들면 LaMDA-Research가 그 주장을 검증할 질의를 TS에 보낸다. TS는 계산기 → 번역기 → 정보검색 순으로 입력을 파싱해 결과를 반환하고, 모델은 그 결과를 근거로 최종 답을 다시 쓴다. 이 루프는 모델이 "TS" 또는 "User" 중 어디로 보낼지를 스스로 결정할 때까지(최대 4회) 반복된다. **검색엔진 API를 규칙 기반으로 호출하는 게 아니라, 언제·무엇을 검색할지까지 모델 스스로 생성한다**는 점이 핵심이다.'},
 {h:'groundedness와 informativeness를 나눠 잰다',
  lead:'외부 사실을 언급한 발화 중 출처로 뒷받침되는 비율(groundedness)과, 그 정보가 실제로 유용했는지(informativeness)를 분리한다.',
  d:'"라파엘 나달은 2020 롤랑가로스 우승자다"처럼 사실이 맞아도 사용자가 원하지 않은 정보면 informativeness에는 반영되지만 groundedness와는 무관하게 처리한다. 파인튜닝 후 LaMDA는 73.2% groundedness · 65% 인용 정확도(citation accuracy)를 달성한다 — 사전학습 단독보다 크게 개선됐지만 여전히 사람(정보검색 도구 접근 시)에는 못 미친다.'},
 {h:'적은 라벨로도 스케일 격차를 메운다',
  lead:'파인튜닝 데이터는 사전학습 데이터의 0.001% 미만인데도 스케일이 주는 이득을 대체한다.',
  d:'137B 사전학습 단독 모델의 감각성은 92.3%에 못 미치는데, 파인튜닝만으로 그 이상을 달성한다. 저자들은 이를 "감각성 92.3%에 도달하려면 파인튜닝 없이는 지금보다 수 자릿수 더 큰 모델이 필요했을 것"이라고 설명한다 — 정렬(alignment)을 위한 사람 라벨이 파라미터 규모보다 값싼 지렛대임을 보여준 사례다.'}
],

diagram:{type:'loop', cap:'LaMDA-Research가 스스로 검색 질의를 만들고, 결과를 근거로 최종 답을 사용자에게 낼지 재검색할지 반복 판단한다.',
 center:'최대 4회 반복',
 nodes:[
  {t:'초안 생성', s:'LaMDA-Base'},
  {t:'검증 질의 생성', s:'LaMDA-Research', acc:true},
  {t:'툴셋 호출', s:'계산기·번역기·검색'},
  {t:'근거로 재작성', s:'출처 있으면 종료'}
 ]},

math:[
 {expr:'quality = mean(sensibleness, specificity, interestingness)',
  tex:'\\text{SSI} = \\frac{1}{3}\\big(\\text{Sensibleness} + \\text{Specificity} + \\text{Interestingness}\\big)',
  d:'논문 전체의 품질 지표. 세 하위 점수 모두 크라우드워커가 맥락 대비 응답을 보고 이진(0/1)으로 채점한 뒤 평균한다.'}
],

numbers:[
 {k:'모델 크기', v:'최대 137B (non-embedding)', d:'decoder-only Transformer, 64층 · $d_{model}=8192$ · head 128'},
 {k:'사전학습 데이터', v:'1.56T 단어 (2.97B 문서)', d:'대화 데이터+웹 텍스트. Meena 대비 데이터 약 40배, 파라미터 약 50배'},
 {k:'감각성 (fine-tuned)', v:'92.3%', d:'같은 정확도를 사전학습만으로 내려면 수 자릿수 더 큰 모델이 필요하다고 저자들은 추정'},
 {k:'groundedness', v:'73.2% · 인용 정확도 65%', d:'외부 세계에 대한 주장 중 알려진 출처로 뒷받침되는 비율. 사전학습 단독보다 크게 개선'},
 {k:'안전성', v:'스케일 단독으로는 정체', d:'파인튜닝(분류기 필터링) 결합 시에만 유의미하게 개선'},
 {k:'파인튜닝 데이터 비율', v:'사전학습 데이터의 0.001% 미만', d:'적은 사람 라벨로 스케일 격차를 상당 부분 메움'}
],

impact:'LaMDA는 [InstructGPT](#/p/instructgpt)와 같은 시기에, 그러나 **다른 경로**로 정렬 문제에 접근했다. InstructGPT가 사람 선호를 보상 모델로 만들어 PPO로 정책을 갱신하는 RLHF 경로를 택한 반면, LaMDA는 품질·안전·groundedness라는 명시적 지표별로 분류기를 파인튜닝해 후보를 필터링·재순위화하는 경로를 택했다. 두 접근 모두 "사전학습만으로는 부족하고, 사람이 정의한 목적함수로 추가 학습해야 한다"는 결론에 수렴한다는 점에서 같은 시대 문제의식을 공유한다. 사실성 문제를 외부 도구 호출로 푼 것은 이후 [ReAct](#/p/react)·[Toolformer](#/p/toolformer)가 정식화하는 "LLM이 스스로 도구 사용을 결정한다"는 패턴을 실제 배포 규모에서 먼저 보여준 사례다.',

legacy:[
 '**대화 모델의 다지표 평가 관행** — 품질/안전/사실성을 분리해 측정하는 방식이 이후 대화형 LLM 평가의 표준 틀이 됨',
 '**Google Assistant/Bard(현 Gemini)의 기반** — LaMDA는 이후 Google의 대화형 제품 라인의 사전 단계로 이어짐',
 '**도구 호출을 모델이 스스로 결정** — [ReAct](#/p/react)의 reasoning-acting 교대 패턴, [Toolformer](#/p/toolformer)의 자기지도 도구 호출 학습보다 먼저 "검색 질의 생성 자체를 언어모델 태스크로" 다룬 실용 사례',
 '**분류기 필터링 vs RLHF** — [InstructGPT](#/p/instructgpt)의 보상모델+PPO 경로와 대비되는, "지표별 판별기로 후보를 거른다"는 대안 정렬 경로를 제시'
],

pitfalls:[
 '**LaMDA는 RLHF가 아니다.** 후보 응답을 생성한 뒤 안전·품질 분류기로 필터링·재순위화하는 방식이며, [InstructGPT](#/p/instructgpt)식 보상모델·정책 그래디언트(PPO) 최적화와는 메커니즘이 다르다.',
 '**groundedness 73.2%는 "검증 가능한 주장" 중 비율이다.** 응답 전체가 사실이라는 뜻이 아니고, 저자들 스스로도 복잡한 추론을 요구하는 사실 검증에는 한계가 있다고 명시한다.',
 '**크라우드워커를 "Human" 기준선으로 쓴 비교는 약한 기준이다.** 저자들은 크라우드워커가 고품질 응답을 낼 금전적 유인이 부족해 흥미도 등에서 기준 자체가 낮게 잡혔을 수 있다고 밝힌다.'
],

figures:[
 {f:'fig3-tool-use.png',
  cap:'노란 상자는 그 시점까지의 전체 대화+내부 메시지 기록이 모델 입력으로 통째로 들어간다는 뜻이다. LaMDA-Base가 초안("1887년")을 내면, LaMDA-Research가 검증 질의를 만들어 TS(초록)에 보내고, 돌아온 결과가 다시 입력에 누적된다. 세 번째 질의 후 LaMDA-Research가 충분한 근거를 확보했다고 판단해 "User"로 보내는 순간 최종 답이 나온다.',
  src:'원문 Figure 3, p.9'},
 {f:'fig4-six-metrics.png',
  cap:'각 그래프의 파란 선(PT, 사전학습만)과 분홍 선(LaMDA, 파인튜닝) 간격을 보면 된다. sensibleness·safety·specificity는 모델 크기(x축)를 키워도 PT와 LaMDA 간 격차가 안 줄어드는데, groundedness·informativeness는 파인튜닝이 있어야만 초록 점선(Human)에 근접한다 — "스케일이 안 듣는 지표는 파인튜닝이 대신 메운다"는 이 논문의 주장이 여기 압축돼 있다.',
  src:'원문 Figure 4, p.12'}
],

quotes:[
 {t:'While model scaling alone can improve quality, it shows less improvements on safety and factual grounding.',
  src:'Abstract, p.1'},
 {t:'The second challenge, factual grounding, involves enabling the model to consult external knowledge sources, such as an information retrieval system, a language translator, and a calculator.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2201.08239 — LaMDA: Language Models for Dialog Applications', u:'https://arxiv.org/abs/2201.08239'},
 {t:'Google AI Blog: LaMDA — our breakthrough conversation technology', u:'https://blog.google/technology/ai/lamda/'}
]
});
