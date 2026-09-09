WIKI.paper({
slug:'self-refine',
venue:'NeurIPS 2023',
authors:'Madaan, Tandon, Gupta et al. (CMU · AI2 · UW · NVIDIA · Google Research)',
arxiv:'2303.17651',

tldr:'같은 모델이 **자기 출력을 스스로 비평(feedback)하고 그 비평을 반영해 고치기(refine)**를 반복하는, 추가 학습이 필요 없는 테스트 타임 방법. 과제 평균 절대 20%p 개선을 보였지만, 수학 추론처럼 자기 검증이 어려운 과제에서는 거의 개선이 없었다.',

context:'[Chain-of-Thought](#/p/cot)와 [Least-to-Most](#/p/least-to-most)는 첫 시도에서 좋은 출력을 만들려고 프롬프트를 정교화한다. 하지만 사람은 초안을 쓰고 다시 읽고 고친다 — 이메일을 "데이터 빨리 보내"에서 "보내주실 수 있을까요"로 다듬는 식이다. 이 개정 과정은 별도의 채점자나 강화학습 보상 없이, **글쓴이 자신의 판단만으로** 이루어진다. 문제는 LLM에게 같은 일을 시킬 수 있는가였다. 당시 반복 개선 연구들은 대체로 외부 검증기·별도로 학습된 비평 모델·인간 피드백([RLHF](#/p/rlhf-prefs))에 의존했고, **모델 자신이 자신의 출력에 대한 비평자 역할까지 겸하는** 완전히 self-contained한 방법은 아니었다.',

ideas:[
 {h:'FEEDBACK와 REFINE을 같은 모델이 번갈아 수행',
  lead:'모델 M이 초안을 만들고, 같은 M에게 그 초안을 비평시킨 뒤, 다시 같은 M에게 비평을 반영해 고치게 한다.',
  d:'초기 출력 $y_0$ 를 만든 뒤 이를 같은 모델에 다시 넣어 피드백 $fb_0$ 을 얻고, $(y_0, fb_0)$ 을 모델에 넣어 개선된 $y_1$ 을 얻는다. 별도의 비평 모델이나 보상 모델을 학습시키지 않고, **하나의 모델을 세 가지 역할(생성·비평·수정)의 프롬프트만 바꿔가며 재사용**한다는 점이 핵심이다.'},
 {h:'피드백은 구체적이고 실행 가능해야 한다',
  lead:'"더 좋게 만들어라" 같은 막연한 지시 대신 "무엇이 문제고 어떻게 고칠지"를 짚는 피드백만 refine 단계에서 쓸모가 있다.',
  d:'저자들은 few-shot 예시에서 피드백이 **actionable**(구체적 행동을 지시)하도록 설계했다. "코드 효율을 개선하라"처럼 일반적인 피드백은 실제 개선으로 이어지지 않았고, "이 반복문이 $O(n^2)$ 이니 해시맵으로 바꿔라"처럼 구체적인 지적이라야 refine이 반영할 수 있는 지점을 찾아냈다.'},
 {h:'반복하며 이전 피드백 이력을 누적한다',
  lead:'매 iteration마다 이전 피드백들을 컨텍스트에 남겨 같은 실수를 반복하지 않게 한다.',
  d:'최대 4회까지 FEEDBACK-REFINE을 반복하며, 과거 iteration의 피드백 이력을 프롬프트에 유지한다. Code Optimization에서는 초기 점수 22.0이 3회 반복 후 28.8로 오르는 등 점진적 개선이 관찰되지만, 개선폭은 반복할수록 줄어드는 diminishing return을 보인다.'},
 {h:'개선폭은 과제마다 극단적으로 다르다',
  lead:'선호 기반 과제에서는 최대 절대 49%p 개선되지만, 수학 추론에서는 개선이 거의 0에 가깝다.',
  d:'Dialogue Response Generation에서는 GPT-4 기준 25.4%→74.6%(+49.2%p)까지 개선됐지만, Math Reasoning(GSM8K)에서는 GPT-3.5 64.1%→64.1%(변화 없음), GPT-4 92.9%→93.1%(+0.2%p)에 그쳤다. 원인은 **모델이 자기 풀이의 오류를 스스로 찾아내지 못하기 때문**이다 — ChatGPT는 94%의 사례에서 "이미 다 맞다"는 피드백을 냈다.'}
],

diagram:{type:'loop', cap:'입력을 넣으면 모델이 초안을 만들고, 같은 모델이 피드백과 수정을 번갈아 반복한다 — 사람이나 별도 모델 개입 없이.',
 center:'정지 조건까지 반복',
 nodes:[
  {t:'초기 생성', s:'y0'},
  {t:'FEEDBACK', s:'같은 모델 M', acc:true},
  {t:'REFINE', s:'y_t → y_t+1'}
 ]},

math:[
 {expr:'y_0 = M(p_gen || x);   fb_t = M(p_fb || x || y_t);   y_{t+1} = M(p_refine || x || y_t || fb_t)',
  tex:'y_0 = \\mathcal{M}(p_{\\text{gen}} \\Vert x),\\quad fb_t = \\mathcal{M}(p_{\\text{fb}} \\Vert x \\Vert y_t),\\quad y_{t+1} = \\mathcal{M}(p_{\\text{refine}} \\Vert x \\Vert y_t \\Vert fb_t)',
  d:'세 프롬프트($p_{gen}, p_{fb}, p_{refine}$) 모두 같은 모델 $\\mathcal{M}$ 을 부른다. 정지 조건(최대 iteration 수 도달 또는 모델이 "더 고칠 것 없음"으로 판단)까지 $fb_t, y_{t+1}$ 을 반복한다.'}
],

numbers:[
 {k:'과제 평균 개선', v:'약 20%p', d:'GPT-3.5·ChatGPT·GPT-4 기준, 7개 생성 과제에서 절대 5~40% 범위'},
 {k:'Dialogue Response (GPT-4-pref)', v:'25.4% → 74.6%', d:'+49.2%p — 선호 기반 과제 중 최대 개선폭'},
 {k:'Code Optimization (GPT-4)', v:'27.3% → 36.0%', d:'+8.7%p, 프로그램 최적화 성공률'},
 {k:'Math Reasoning · GSM8K (GPT-3.5)', v:'64.1% → 64.1%', d:'개선 0 — 자기 오류를 못 찾는 대표 사례'},
 {k:'Math Reasoning · GSM8K (GPT-4)', v:'92.9% → 93.1%', d:'+0.2%p에 불과, 통계적으로 유의미하지 않은 수준'},
 {k:'ChatGPT의 "이상 없음" 피드백 비율', v:'94%', d:'수학 문제에서 실제 오답에도 "everything looks good"이라 답한 비율'}
],

impact:'Self-Refine은 "모델이 자기 자신의 검증자가 될 수 있는가"라는 질문을 실험적으로 좁혔다. 자연어 생성·코드처럼 **품질 판단이 상대적으로 쉬운 과제**에서는 self-feedback만으로 큰 개선이 가능하지만, 수학처럼 **정답이 명확하고 오류가 미묘한 과제**에서는 모델이 자기 오류를 인식하지 못해 개선이 거의 없다는 경계선을 그었다. 이는 이후 self-correction 연구 전체의 핵심 쟁점 — 외부 검증 신호 없이 LLM이 스스로를 고칠 수 있는가 — 를 정면으로 제기한 실증 자료가 되었다.',

legacy:[
 '**self-correction 논쟁의 기준점** — 이후 "Large Language Models Cannot Self-Correct Reasoning Yet" 등 후속 반박 논문들이 이 논문의 Math Reasoning 결과(개선 거의 0)를 근거로 인용',
 '**[Reflexion](#/p/reflexion)과의 대비** — Reflexion은 환경의 외부 신호(성공/실패)를 언어적 피드백으로 바꾸는 반면, Self-Refine은 외부 신호 없이 같은 모델의 판단만으로 반복한다는 점이 이후 비교 연구의 축이 됨',
 '**"검증 가능성"이 반복 개선의 성패를 가른다는 원칙** — 코드 실행 결과·단위 테스트처럼 외부에서 옳고 그름을 확인할 수 있는 과제에서만 self-refine류 방법이 안정적으로 통한다는 설계 원칙으로 자리잡음',
 '**agent 루프의 표준 부품화** — feedback-refine 루프가 이후 다단계 agent 파이프라인의 "자기 점검" 단계로 흔히 삽입됨'
],

pitfalls:[
 '**"모델이 좋다고 하면 좋은 것"이 아니다.** 수학 추론에서 보듯 모델은 실제로 틀린 답을 "이상 없음"으로 판단하는 경우가 매우 흔하다(ChatGPT 94%) — self-refine의 개선은 모델이 자기 오류를 실제로 탐지할 수 있는 과제에 한정된다.',
 '**후속 연구의 반박: 자기 교정은 만병통치약이 아니다.** 이후 "LLM은 외부 신호 없이 추론 오류를 스스로 고치지 못한다"는 계열의 논문들이, 이 논문이 다룬 것과 같은 수학·논리 과제에서 self-refine이 오히려 성능을 떨어뜨릴 수 있음을 보였다. 균형 잡힌 결론은 "생성 품질 과제에서는 되고, 정답이 있는 추론 과제에서는 잘 안 된다"는 것.',
 '**프롬프트·예시 선택에 민감한 CoT 계열 공통 함정을 그대로 물려받는다.** 피드백 프롬프트의 few-shot 예시가 "actionable"하게 설계되지 않으면 refine 단계가 아무 실질적 변화 없이 문장만 바꾸는 경우가 많다.'
],

figures:[
 {f:'fig1-loop.png',
  cap:'Input(위)이 Model M(가운데)으로 들어가 초기 출력을 만들면, 같은 M이 ①에서 Feedback을, ②에서 그 Feedback을 반영한 Refine을 수행한다. Feedback·Refine 박스 모두 "같은 모델 M"이 수행한다는 것이 화살표가 전부 M으로 돌아오는 이유.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'Like humans, large language models (LLMs) do not always generate the best output on their first try.',
  src:'Abstract, p.1'},
 {t:'The modest performance gains in Math Reasoning can be traced back to the inability to accurately identify whether there is any error.',
  src:'Section 3.3, p.5'}
],

links:[
 {t:'arXiv 2303.17651 — Self-Refine: Iterative Refinement with Self-Feedback', u:'https://arxiv.org/abs/2303.17651'},
 {t:'selfrefine.info (공식 프로젝트 페이지)', u:'https://selfrefine.info/'}
]
});
