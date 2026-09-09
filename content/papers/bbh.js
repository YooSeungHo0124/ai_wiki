WIKI.paper({
slug:'bbh',
venue:'arXiv 2022 (Findings of ACL 2023)',
authors:'Suzgun et al. (Google Research · Stanford University)',
arxiv:'2210.09261',

tldr:'[BIG-Bench](#/p/bigbench) 중 언어모델이 사람 평균보다 못했던 과제만 23개 추려 **BIG-Bench Hard(BBH)** 로 명명하고, 여기에 `[CoT](#/p/cot)` 프롬프팅을 적용하면 그중 상당수에서 모델이 사람을 넘어선다는 것을 보였다. "규모를 키워도 안 풀린다"던 결론이 사실은 "answer-only 프롬프트로는 안 풀린다"였음을 드러낸 논문이다.',

context:'BIG-Bench 논문은 200개 과제 중 65%에서 최고 모델이 사람 평균을 이겼다고 보고했다. 그런데 나머지 과제들, 특히 다단계 추론이 필요한 과제에서는 모델이 사람보다 한참 못했고, 이는 "언어모델은 결국 여기서 한계에 부딪힌다"는 근거로 종종 인용됐다. 문제는 그 평가가 전부 **answer-only 프롬프팅**(질문 뒤에 바로 정답을 생성시키는 방식)이었다는 점이다. 이 논문은 질문을 뒤집는다 — 모델이 정말 그 과제를 못 푸는 것인지, 아니면 중간 추론 과정을 보여줄 기회 자체가 없었던 것인지.',

ideas:[
 {h:'BIG-Bench를 4단계로 걸러 23개만 남긴다',
  lead:'207개 과제 중 사람 평균을 이긴 모델이 하나도 없던 23개만 BBH로 추린다.',
  d:'BIG-Bench의 전체 과제에서 (1) 사람 채점 기준이 있고 (2) 프로그램적으로 채점 가능하며 (3) 기존에 보고된 최고 모델도 사람 평균을 못 넘은 과제만 남긴다. 그 결과 42개는 이미 어떤 모델이 사람을 이겼고, 나머지 36개 중 수작업 검토 후 23개를 최종 BBH로 확정했다. 논리 추론, 다단계 산술, 날짜 이해 등 대부분 **여러 단계를 거쳐야 답이 나오는** 과제들이다.'},
 {h:'같은 few-shot 예제를 CoT로만 바꿔서 재평가한다',
  lead:'정답만 보여주던 예제를 "단계별로 생각하기" 과정이 담긴 예제로 교체한다.',
  d:'모델·프롬프트 형식·예제 개수는 그대로 두고, 오직 few-shot 예제 안의 정답을 사람이 직접 작성한 **3개의 단계별 풀이 과정**으로 바꾼다. 이것이 answer-only와 CoT 두 조건의 유일한 차이다. 즉 이 논문은 새 능력을 학습시킨 게 아니라, **이미 있던 능력을 꺼낼 프롬프트를 바꾼 것**뿐이다.'},
 {h:'Codex는 CoT로 23개 중 17개에서 사람을 이긴다',
  lead:'answer-only 5/23이던 것이 CoT를 쓰자 17/23으로 뛴다.',
  d:'세 모델 계열(PaLM, InstructGPT, Codex) 모두 CoT에서 두 자릿수 정확도 상승을 보였다. 가장 큰 폭은 Codex의 algorithmic 과제(45.9→74.4, **+28.5**p)였다. 그럼에도 사람 중 최고 채점자 수준(94.4%)에는 여전히 20%p 이상 못 미쳐, "다 풀렸다"는 아니다.'},
 {h:'CoT가 평탄한 스케일링 곡선을 깨운다',
  lead:'모델 크기를 키워도 무반응이던 과제가 CoT를 얹자 규모에 비례해 좋아진다.',
  d:'Multi-Step Arithmetic·Tracking Shuffled Objects·Web of Lies 세 과제는 answer-only 프롬프트에서는 모델을 아무리 키워도 정확도가 무작위 수준에 머물렀다. 같은 모델에 CoT만 추가하면 규모가 커질수록 정확도가 오르는 곡선으로 바뀐다. 저자들은 이를 `[창발](#/p/emergent)` 능력의 사례로 해석한다 — 능력이 원래 없던 게 아니라 **프롬프트가 그 능력의 발현 조건**이었다는 것.'},
 {h:'모든 과제가 CoT로 풀리는 건 아니다',
  lead:'Causal Judgement처럼 CoT를 줘도 무작위 수준에 머무는 과제가 남는다.',
  d:'Causal Judgement 과제는 answer-only에서 57.8%로 이미 무작위(50%)보다 살짝 높지만, CoT를 추가해도 개선되지 않는다. 저자들은 이를 "새로운 프롬프팅 기법이 필요한 과제"로 남겨두며, CoT가 만능 해법이 아님을 스스로 명시한다.'}
],

diagram:{type:'compare', cap:'같은 문제, 같은 few-shot 개수, 다른 것은 예제 속 풀이 과정의 유무뿐.',
 left:{t:'answer-only 프롬프트', items:['질문 + 선택지 뒤 바로 정답','Codex 5/23 과제에서 사람 능가','다단계 과제에서 능력을 과소평가']},
 right:{t:'CoT 프롬프트', items:['정답 앞에 단계별 풀이 삽입','Codex 17/23 과제에서 사람 능가','평탄하던 스케일링 곡선이 상승']}
 },

math:[
 {expr:'Δ(model, task) = Acc_model(task) − Acc_human-avg(task)',
  tex:'\\Delta(\\text{model},\\text{task}) = \\text{Acc}_{\\text{model}}(\\text{task}) - \\text{Acc}_{\\text{human-avg}}(\\text{task})',
  d:'Figure 1의 막대 하나가 이 값이다. 음수(빨강)면 모델이 사람 평균보다 못하고, 양수(파랑)면 넘어선 것. answer-only에서는 대부분 음수였다가 CoT에서 다수가 양수로 뒤집힌다.'}
],

numbers:[
 {k:'BBH 과제 수', v:'23개', d:'BIG-Bench 207개 과제 중 "최고 모델도 사람 평균을 못 넘은" 것만 4단계로 필터링'},
 {k:'사람 평균 정확도', v:'67.7%', d:'23개 과제 전체 평균. 최고 채점자는 94.4%'},
 {k:'Codex: answer-only → CoT', v:'56.6% → 73.9%', d:'**+16.7**p. algorithmic 하위셋만 보면 45.9%→74.4% (+28.5p)'},
 {k:'사람 평균을 넘은 과제 수 (Codex)', v:'5/23 → 17/23', d:'CoT 적용 후 3배 이상으로 증가'},
 {k:'InstructGPT: answer-only → CoT', v:'51.8% → 68.4%', d:'+16.6p, PaLM 540B는 52.3%→65.2% (+12.9p)'},
 {k:'CoT로도 안 풀린 예', v:'Causal Judgement 57.8%', d:'무작위(50%)보다 조금 높은 채 CoT를 줘도 정체'}
],

impact:'BBH는 이후 GPT-4·PaLM 2·Llama 등 거의 모든 주요 모델의 **표준 벤치마크**로 자리 잡았다. 더 중요한 파급은 방법론적인 것이다 — "모델이 이 과제를 못 푼다"는 주장을 평가할 때, 그것이 능력의 한계인지 프롬프트 형식의 한계인지 구분해야 한다는 관행을 정착시켰다. `[CoT](#/p/cot)` 가 단순한 트릭이 아니라 평가 방법론 자체를 흔드는 변수임을 대규모로 입증한 첫 사례이기도 하다.',

legacy:[
 '**표준 벤치마크화** — 이후 대부분의 LLM 기술 보고서(PaLM 2, GPT-4, Llama 2/3 등)가 BBH 점수를 별도로 보고',
 '**Instruction-tuned 모델 평가 세트에 편입** — MMLU·[HumanEval](#/p/humaneval) 등과 묶여 종합 리더보드의 한 축이 됨',
 '**"평가 방법이 능력을 가린다"는 경고의 원형** — 이후 프롬프트 민감도·평가 프로토콜을 다루는 여러 연구가 이 논문을 근거로 인용',
 '**창발 논쟁의 반례 겸 근거** — CoT가 "창발을 만드는 변수"임을 보여, `[창발](#/p/emergent)` 이 모델 고유의 성질만은 아니라는 후속 논쟁의 재료가 됨'
],

pitfalls:[
 '**"모델이 사람을 이겼다"는 23개 중 일부일 뿐이다.** 전체 평균(67.7%)과 최고 채점자(94.4%) 사이에는 여전히 큰 격차가 있고, 최고 인간 채점자 기준으로는 어떤 모델도 넘지 못했다.',
 '**CoT 예제는 사람이 직접 작성했다.** 모델이 스스로 추론 경로를 발견한 게 아니라 사람이 각 과제마다 3개씩 손으로 쓴 풀이를 모방한 것이라, "모델이 추론을 배웠다"보다는 "적절한 시연이 있으면 잠재 능력을 꺼낼 수 있다"는 해석이 더 정확하다.',
 '**모든 평탄한 스케일링 곡선이 CoT로 뒤집히지는 않는다.** Causal Judgement 사례처럼 예외가 있으므로, "CoT = 창발 스위치"로 일반화하면 안 된다.'
],

figures:[
 {f:'fig1-delta.png',
  cap:'막대 하나가 Codex와 사람 평균의 정확도 차이(23개 과제). 왼쪽(answer-only)은 대부분 빨강(사람보다 낮음), 오른쪽(CoT)은 다수가 파랑으로 뒤집힌다 — 같은 모델, 같은 과제, 프롬프트만 바꾼 결과.',
  src:'원문 Figure 1, p.1'},
 {f:'fig3-cot-prompt.png',
  cap:"왼쪽은 answer-only 프롬프트(질문 뒤 바로 정답 (D)), 오른쪽은 CoT 프롬프트(정답 전에 \"Let's think step by step\"으로 시작하는 풀이 과정 삽입). 두 입력의 구조는 동일하고 오직 예제 속 풀이 유무만 다르다.",
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'We find that applying chain-of-thought (CoT) prompting to BBH tasks enables PaLM to surpass the average human-rater performance on 10 of the 23 tasks, and Codex (code-davinci-002) to surpass the average human-rater performance on 17 of the 23 tasks.',
  src:'Abstract, p.1'},
 {t:'This qualitative transition from approximately random to improved performance with scale has been referred to as an emergent ability.',
  src:'Section 4.3, p.6'}
],

links:[
 {t:'arXiv 2210.09261 — Challenging BIG-Bench Tasks and Whether Chain-of-Thought Can Solve Them', u:'https://arxiv.org/abs/2210.09261'},
 {t:'BIG-Bench Hard GitHub (데이터·프롬프트·모델 출력)', u:'https://github.com/suzgunmirac/BIG-Bench-Hard'}
]
});
