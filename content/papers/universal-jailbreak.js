WIKI.paper({
slug:'universal-jailbreak',
venue:'arXiv 2023 (CMU · Center for AI Safety · Google DeepMind · Bosch)',
authors:'Zou, Wang, Carlini, Nasr, Kolter, Fredrikson',
arxiv:'2307.15043',

tldr:'Vicuna 같은 오픈소스 모델 몇 개만 gradient로 공격해 찾은 하나의 적대적 접미사(suffix)가, 전혀 접근권이 없는 ChatGPT·Claude·Bard·Llama-2에도 그대로 먹힌다는 것을 보인 논문. "정렬은 겉보기 방어일 뿐, 모델을 조금만 뜯어보면(white-box) 뚫는 방법이 다른 모델에도 전이된다"는 구조적 취약성을 실증했다.',

context:'RLHF와 [Constitutional AI](#/p/constitutional) 이후 상용 LLM들은 노골적인 유해 요청을 대체로 거부하도록 정렬돼 있었지만, 사람이 손으로 찾은 탈옥 문구("역할극을 해줘", "DAN 모드"등)는 패치되는 즉시 무력화되는 두더지 잡기였다. 자동으로 적대적 프롬프트를 찾으려는 이전 시도(AutoPrompt, GBDA, PEZ)는 [레드팀](#/p/red-teaming) 논문들이 정리한 화이트박스 세팅에서조차 정렬된 모델을 안정적으로 뚫지 못했다. 이 논문은 이산 토큰 최적화 방법 자체를 개선하고(GCG), 여러 모델·여러 요청에 동시에 최적화한 접미사가 뜻밖에도 **완전히 다른 아키텍처·토크나이저를 쓰는 블랙박스 모델에도 전이**된다는 것을 보여, 자동 공격이 실전에서 의미 있는 위협임을 처음 입증했다.',

ideas:[
 {h:'목표를 "정답 생성"이 아니라 "긍정 응답 유도"로 바꾼다',
  lead:'특정 유해 문자열을 그대로 뱉게 하는 대신 "Sure, here is how to..."로 응답을 시작하게만 만든다.',
  d:'초기 목표(정확한 유해 문자열 생성)는 질의마다 하나의 정답만 있다고 가정하는 문제였고, 범용 접미사를 만들기 어렵게 만들었다. 대신 "모델이 요청을 긍정적으로 반복하며 답을 시작"하는 상태로만 밀어 넣으면, 일단 그 상태에 들어간 모델은 자기 힘으로 나머지 유해한 내용을 이어서 생성하는 경향이 있다는 관찰에 기반한다.'},
 {h:'Greedy Coordinate Gradient(GCG): 그래디언트로 후보를 줄이고 정확히 평가',
  lead:'모든 위치의 토큰에 대해 그래디언트로 top-k 대체 후보를 뽑은 뒤, 무작위로 뽑은 배치를 실제 forward pass로 평가해 최선을 고른다.',
  d:'이산 토큰 공간에서 모든 대체를 다 평가할 수 없으므로, 원-핫 벡터에 대한 그래디언트 $\\nabla_{e_{x_i}}L$ 로 손실을 가장 낮출 가능성이 큰 top-k 토큰을 후보로 추리고, 그 후보들 중 일부를 실제로 대입해 손실을 계산해 가장 좋은 것으로 교체한다. 기존 AutoPrompt는 매 스텝 하나의 위치만 골라 후보를 평가했는데, GCG는 **모든 위치에서 후보를 모아 한꺼번에 경쟁**시키는 것만으로 같은 연산 예산에서 큰 성능 차이를 냈다.'},
 {h:'multi-prompt·multi-model 최적화가 전이성의 핵심',
  lead:'하나의 모델·하나의 요청이 아니라 Vicuna-7B/13B 여러 모델과 25개 유해 행동에 동시에 최적화해야 접미사가 범용화된다.',
  d:'단일 모델·단일 요청에 맞춘 접미사는 그 조합에 과적합돼 다른 모델로 잘 넘어가지 않는다. 여러 모델의 손실을 합산해 동시에 최소화하면, 접미사가 특정 모델의 사소한 특이성이 아니라 여러 정렬 모델이 공유하는 더 일반적인 취약점을 파고들게 된다.'},
 {h:'전이성: 토크나이저와 아키텍처가 달라도 뚫린다',
  lead:'Vicuna로만 최적화한 접미사가 Pythia·Falcon·Guanaco는 물론 GPT-3.5·[GPT-4](#/p/gpt4)·PaLM-2·Claude까지 넘어갔다.',
  d:'접미사 자체는 특정 토큰 시퀀스인데, 완전히 다른 어휘·토크나이저를 쓰는 모델에서도 유사한 효과를 낸다는 것은 이 취약점이 표면적인 토큰 매칭이 아니라 더 근본적인 정렬 학습의 공통 결함을 반영함을 시사한다. GPT 계열에 특히 잘 먹힌 것은 Vicuna 자체가 ChatGPT 출력으로 학습된 모델이라 어느 정도 분포가 겹쳤을 가능성이 있다고 논문은 추정한다.'}
],

diagram:{type:'flow', cap:'Vicuna 몇 개 모델·25개 유해 요청에 동시에 최적화한 접미사 하나가, 전혀 접근하지 못한 상용 모델들에도 그대로 전이된다.',
 nodes:[
  {t:'유해 요청 + 접미사', s:'"! ! ! ! ..." 초기화'},
  {t:'그래디언트로 후보 추출', s:'top-k, 위치별'},
  {t:'배치 평가·최선 교체', s:'GCG 반복', acc:true},
  {t:'다중 모델 손실 합산', s:'Vicuna 7B·13B'},
  {t:'블랙박스 전이', s:'GPT-4·Claude·PaLM-2'}
 ]},

math:[
 {expr:'L(x_1:n) = −log p(x*_{n+1:n+H} | x_1:n)',
  tex:'L(x_{1:n}) \\;=\\; -\\log p\\!\\left(x^{\\star}_{n+1:n+H}\\mid x_{1:n}\\right)',
  d:'목표 문자열("Sure, here is how to...")을 생성할 로그확률의 음수. 이 값을 최소화하도록 접미사 토큰 $x_I$만 바꾼다.'},
 {expr:'X_i = Top-k( −∇_{e_{x_i}} L(x_1:n) )',
  tex:'X_i \\;=\\; \\text{Top-}k\\!\\left(-\\nabla_{e_{x_i}} L(x_{1:n})\\right)',
  d:'위치 $i$의 토큰을 원-핫 벡터로 보고 그래디언트를 취하면, 손실을 가장 크게 낮출 것으로 "선형 근사"되는 $k$개의 대체 토큰 후보를 얻는다. 모든 접미사 위치에서 이 후보를 구한 뒤 무작위로 섞어 배치로 정확히 평가하는 것이 GCG의 전부다.'}
],

numbers:[
 {k:'개별 유해 문자열 ASR (Vicuna-7B)', v:'88%', d:'AutoPrompt 25% 대비 GCG의 우위'},
 {k:'개별 유해 행동 ASR (Llama-2-7B-Chat)', v:'88%', d:'AutoPrompt는 36%에 그침'},
 {k:'전이 ASR · GPT-3.5', v:'87.9%', d:'ensemble GCG 접미사, 표는 86.6%(Table 2 Ensemble 행)로 보고'},
 {k:'전이 ASR · GPT-4', v:'53.6% (46.9%, ensemble)', d:'Table 1 본문 요약치와 Table 2 상세치가 약간 다름 — 둘 다 논문에 명시'},
 {k:'전이 ASR · PaLM-2', v:'66.0%', d:'ensemble GCG 접미사, 388개 held-out 유해 행동 평균'},
 {k:'전이 ASR · Claude-2', v:'2.1%', d:'가장 견고 — 다른 상용 모델 대비 두드러지게 낮음'}
],

impact:'"인간이 손으로 찾는 탈옥"에서 "그래디언트로 자동 생성하고 전이시키는 공격"으로 위협 모델 자체가 바뀌었다. 공개 직후 저자들이 OpenAI·Anthropic·Google에 사전 공지했고, 이후 업계 전반이 시스템 프롬프트 하드닝, 입력 필터링, 접미사 탐지 같은 방어를 서둘러 추가하는 계기가 됐다. 동시에 "화이트박스 오픈소스 모델을 공격 도구로 써서 블랙박스 상용 모델을 뚫는다"는 패턴은 이후 나온 거의 모든 자동 탈옥 연구(PAIR, TAP 등)의 기본 위협 모델이 되었다.',

legacy:[
 '**자동 탈옥 연구 계열의 기준선** — PAIR, TAP, AutoDAN 등 후속 자동 탈옥 방법들이 모두 GCG를 베이스라인으로 비교',
 '**[레드팀](#/p/red-teaming)의 자동화 축을 극단으로 밀어붙인 사례** — 사람이 대화로 취약점을 찾던 레드팀 작업의 상당 부분을 그래디언트 최적화로 대체할 수 있음을 보임',
 '**정렬 방어 연구 촉발** — perplexity 필터, SmoothLLM, 입력 패러프레이징 등 GCG류 접미사를 탐지·무력화하는 방어 기법 연구가 이 논문 직후 대거 등장',
 '**[슬리퍼 에이전트](#/p/sleeper-agents)와 함께 "정렬이 표면적일 수 있다"는 우려의 실증적 근거**로 자주 나란히 인용됨'
],

pitfalls:[
 '**접미사가 사람 눈에는 무의미한 토큰 나열이라 눈으로 걸러내기 쉽다는 오해가 있다.** 그러나 논문은 이 접미사를 사람이 읽기 자연스러운 문장으로 다듬는 후속 시도("manual fine-tuning")도 어느 정도 성립함을 보여, 가독성이 방어책이 될 수 없음을 시사한다.',
 '**모든 모델에 똑같이 잘 먹히는 것은 아니다.** Claude-2는 다른 상용 모델 대비 ASR이 확연히 낮아(2.1%), "정렬이 전부 무력하다"가 아니라 "정렬 방식에 따라 견고성 차이가 크다"는 것이 정확한 결론이다.',
 '**공개된 벤치마크(AdvBench)의 문자열/행동에 최적화한 결과이므로, 실전에서 마주치는 더 다양한 유해 요청 전반에 같은 전이율이 보장되지는 않는다.**'
],

figures:[
 {f:'fig1-transfer-demo.png',
  cap:'위: Vicuna-7B/13B 두 모델과 여러 유해 요청에 동시에 최적화한 적대적 접미사(ADV PROMPT) 하나. 아래: 같은 접미사를 전혀 접근권이 없는 ChatGPT·Claude(Anthropic 로고)·Bard·Llama-2에 그대로 붙였을 때 실제로 나온 응답 — 네 모델 모두 "인류를 파괴하는 계획"을 순순히 나열한다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig3-asr-bars.png',
  cap:'가로축이 테스트 모델, 세로축이 공격 성공률(%). 회색(공격 없음)·주황("Sure, here\'s"만 추가) 대비 파랑(GCG)이 대부분의 모델에서 압도적으로 높고, GPT-3.5·GPT-4 같은 블랙박스 상용 모델에서도 파랑 막대가 회색·주황을 크게 앞선다 — Vicuna로만 최적화했는데도 전이된다는 것이 이 그래프의 핵심.',
  src:'원문 Figure 3, p.12'}
],

quotes:[
 {t:'Surprisingly, we find that the adversarial prompts generated by our approach are highly transferable, including to black-box, publicly released, production LLMs.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2307.15043 — Universal and Transferable Adversarial Attacks on Aligned Language Models', u:'https://arxiv.org/abs/2307.15043'},
 {t:'공식 구현 (GitHub: llm-attacks/llm-attacks)', u:'https://github.com/llm-attacks/llm-attacks'}
]
});
