WIKI.paper({
slug:'scratchpad',
authors:'Nye et al. (MIT · Google Research)',
arxiv:'2112.00114',

tldr:'모델에게 최종 답 대신 **중간 계산 과정을 먼저 적게 하면** 덧셈·다항식 평가·프로그램 실행 같은 다단계 과제의 정확도가 극적으로 오른다는 것을 보인 논문. 이 "결과 이전에 과정을 쓰게 한다"는 착상이 [Chain-of-Thought](#/p/cot)의 직접적 선행 연구다.',

context:'2021년 말, [GPT-3](#/p/gpt3) 같은 대형 언어모델은 자연스러운 글을 "한 번에" 생성하는 데는 강했지만 **여러 단계를 거쳐야 하는 계산**에는 약했다. GPT-3는 세 자리를 넘는 덧셈에서 few-shot으로 실패했고, 자신이 짠 코드조차 실행 결과를 예측하지 못했다. Transformer는 한 forward pass 안에서 레이어 수만큼의 고정된 연산만 할 수 있으므로, 문제가 요구하는 계산 단계 수가 그보다 많으면 구조적으로 불가능하다. 이 논문은 질문을 뒤집는다 — **계산 능력을 모델 내부에 욱여넣는 대신, 중간 결과를 텍스트로 출력하게 해서 다음 토큰의 입력으로 되돌려주면 어떨까?**',

ideas:[
 {h:'scratchpad: 정답 전에 중간 상태를 적는다',
  lead:'최종 답 앞에 계산 과정을 토큰으로 명시적으로 적게 학습·프롬프트한다.',
  d:'예를 들어 29+57을 배울 때, 목표(target) 시퀀스에 바로 `86`을 두는 대신 `<scratch> 2 9 + 5 7, C: 0 / 2 + 5, 6 C: 1 # added 9+7=6 carry 1 / ...` 같은 그레이드스쿨 장덧셈의 자리별 계산을 전부 적게 한다. 모델이 이미 출력한 중간 결과를 다시 attention으로 읽어들일 수 있으므로, 계산 상태를 감추지 않고 시퀀스 자체에 저장하는 것이다.'},
 {h:'적응적 계산 시간을 시퀀스 길이로 산다',
  lead:'scratchpad 토큰 수만큼 실질적인 계산 스텝이 늘어나 문제 난이도에 맞춰 연산량이 늘어난다.',
  d:'표준 Transformer는 입력이 무엇이든 레이어 수만큼의 고정된 계산만 수행한다. scratchpad는 문제가 어려울수록(자릿수가 많을수록, 반복문이 많을수록) 더 긴 중간 시퀀스를 뱉게 만들어, **모델이 필요한 만큼 더 많은 forward pass를 쓰도록** 우회한다. 또한 중간 상태가 이산 토큰으로 양자화되어 출력되므로, 연속적인 hidden state에 압축해서 저장할 때보다 오차가 누적되기 어렵다.'},
 {h:'핵심 실험은 few-shot이 아니라 파인튜닝이다',
  lead:'덧셈·다항식 실험의 대표 결과는 프롬프트만이 아니라 모델을 직접 fine-tuning해서 얻은 것이다.',
  d:'이 논문은 few-shot과 fine-tuning 둘 다 시도하지만, **자릿수 일반화 같은 가장 극적인 결과는 fine-tuning 조건**에서 나온다. 2M~1B 파라미터 모델을 1~8자리 덧셈 10만 예제로 5,000스텝 fine-tuning한 뒤 9~10자리(분포 밖) 입력에서 테스트한다. `[Chain-of-Thought](#/p/cot)`는 정확히 이 지점에서 갈라진다 — 모델을 전혀 건드리지 않고 프롬프트에 몇 개의 풀이 예시만 넣어 같은 효과를 얻어낸다. scratchpad는 "가르쳐서" 되고, CoT는 "부탁해서" 된다는 차이다.'},
 {h:'프로그램 실행 트레이스로 일반화한다',
  lead:'변수 상태를 한 줄씩 갱신하는 트레이스를 출력시키면 임의 Python 프로그램의 실행 결과 예측이 좋아진다.',
  d:'덧셈·다항식은 손으로 스크래치패드 형식을 설계했지만, 매 새로운 알고리즘마다 그렇게 할 수는 없다. 5장에서는 Python 함수 실행을 각 줄이 실행될 때마다 지역 변수 값을 JSON으로 적어나가는 트레이스로 바꾼다. 137B 모델로 합성 프로그램과 사람이 작성한 MBPP 계열 문제 양쪽에서, 직접 최종 출력을 예측하는 것보다 한 줄씩 상태를 추적하는 쪽이 일관되게 낫다.'},
 {h:'모델이 생성한 트레이스로 데이터를 증강한다',
  lead:'모델 스스로 생성한 프로그램의 트레이스를 학습 데이터로 추가하면 실제 코드에서 트레이싱 성능이 더 오른다.',
  d:'사람이 쓴 MBPP 문제는 트레이싱 학습 데이터로 쓰기엔 양이 적다. 저자들은 137B few-shot 모델로 새 프로그램을 생성시켜 만든 데이터(MBPP-aug)와, CodeNet에서 뽑은 670,904개 트레이스로 추가 fine-tuning을 시도한다. 같은 증강 데이터가 직접 실행 예측 성능은 오히려 낮추면서 트레이싱 성능만 끌어올린다는 점이, 중간 과정을 명시하는 방식이 데이터 품질 잡음에 더 강함을 보여준다.'}
],

diagram:{type:'compare', cap:'같은 덧셈 문제를 직접 답만 내게 할 때와, 중간 계산을 scratchpad에 적게 할 때의 차이.',
 left:{t:'직접 예측', items:['입력 → 정답만 출력','자릿수 늘면 급격히 붕괴','고정된 연산량만 사용']},
 right:{t:'Scratchpad', items:['입력 → 중간 계산 → 정답','분포 밖 자릿수도 어느 정도 일반화','토큰 수만큼 연산량 확장']}},

numbers:[
 {k:'덧셈 · 분포 내(≤8자리)', v:'baseline 30%대 vs scratchpad ~100%', d:'가장 큰 모델(약 1B) 기준, fine-tuning 5k스텝'},
 {k:'덧셈 · OOD 9자리', v:'baseline 0% vs scratchpad ~90%', d:'훈련 때 못 본 자릿수. baseline은 모델 크기를 키워도 0%에 고정'},
 {k:'덧셈 · OOD 10자리', v:'baseline 0% vs scratchpad ~52%', d:'scratchpad도 성능이 떨어지지만 baseline과 달리 완전히 무너지진 않는다'},
 {k:'다항식 평가 · few-shot(137B)', v:'직접 8.8% vs scratchpad 20.1%', d:'프롬프트만 바꾼 few-shot 조건'},
 {k:'다항식 평가 · fine-tuning(8B)', v:'직접 31.8% vs scratchpad 50.7%', d:'2000스텝 fine-tuning'},
 {k:'Python 실행 · fine-tuned', v:'직접 20% vs scratchpad 41.5%', d:'137B 모델, 합성 프로그램 200개 테스트 세트'}
],

impact:'이 논문 이후 "모델에게 답을 바로 내지 말고 과정을 쓰게 한다"는 아이디어가 추론 연구의 표준 도구가 됐다. 차이는 방법론에 있다 — scratchpad는 **fine-tuning으로 이 행동을 가르쳤고**, 몇 달 뒤 [Chain-of-Thought](#/p/cot)는 같은 관찰을 **프롬프트에 몇 개의 예시를 넣는 것만으로** 재현해 훨씬 적은 비용으로 같은 효과를 냈다. CoT 논문은 이 연구를 직접 인용하며 자신의 few-shot 결과를 대조한다. 이후 [PAL](#/p/pal)은 스크래치패드의 "중간 계산" 자리에 자연어 대신 실행 가능한 Python 코드를 넣어 산술 오류 자체를 인터프리터에 위임했고, [Self-Consistency](#/p/self-consistency)는 여러 개의 (scratchpad-style) 추론 경로를 샘플링해 다수결로 답을 고르는 방향으로 발전시켰다.',

legacy:[
 '**프롬프트만으로 재현** — [Chain-of-Thought](#/p/cot)가 fine-tuning 없이 few-shot 예시만으로 동일한 "과정을 적어야 정확도가 오른다"는 현상을 대형 모델에서 보여주며 접근 비용을 없앴다',
 '**중간 계산을 코드로 대체** — [PAL](#/p/pal)은 scratchpad의 자연어 계산 스텝을 Python 코드로 바꿔, 산술은 인터프리터가 하고 모델은 문제를 코드로 번역하는 역할만 맡게 했다',
 '**여러 경로를 모아 다수결** — [Self-Consistency](#/p/self-consistency)는 하나의 추론 경로 대신 여러 scratchpad형 경로를 샘플링해 최빈값으로 답을 정하는 앙상블 아이디어를 도입했다',
 '**적응적 계산량이라는 프레이밍** — "시퀀스 길이로 연산량을 산다"는 발상은 이후 도구 사용·에이전트 루프([ReAct](#/p/react), [Reflexion](#/p/reflexion))에서 반복적으로 재등장한다'
],

pitfalls:[
 '**"scratchpad = Chain-of-Thought"로 뭉뚱그리면 안 된다.** 이 논문의 핵심 결과는 대부분 fine-tuning으로 얻어진 것이고, few-shot 결과는 존재하지만 상대적으로 약하다. CoT의 기여는 "fine-tuning 없이도 된다"는 것이지, "중간 과정을 적으면 좋다"는 관찰 자체가 아니다.',
 '**중간 계산이 항상 옳다는 보장은 없다.** 트레이스가 그럴듯해 보여도 각 단계가 실제로 다음 단계의 근거였는지는 별개이며, scratchpad 형식 자체가 정답을 보장하지 않는다(이 문제는 이후 self-consistency·검증 연구로 이어진다).',
 '**모든 태스크가 손으로 만든 형식을 필요로 하지는 않는다.** 덧셈·다항식은 저자가 직접 스크래치패드 포맷을 설계했지만, 5장의 프로그램 실행처럼 형식을 일반화하기 어려운 태스크에서는 트레이스 설계 자체가 병목이 된다.'
],

figures:[
 {f:'fig2-example.png',
  cap:'29+57 덧셈 문제의 입력과 목표(target). `<scratch>...</scratch>` 안에 자리별로 두 자리를 더하고 캐리(C:)를 명시적으로 남긴 뒤에야 최종 답 `8 6`이 나온다 — 이 캐리 값이 다음 자리 계산의 입력으로 다시 attention된다.',
  src:'원문 Figure 2, p.3'},
 {f:'fig3-accuracy.png',
  cap:'왼쪽부터 분포 내(≤8자리), OOD 9자리, OOD 10자리 정확도. 세 그래프 모두 파란선(baseline)은 모델을 키워도 정체하거나 0에 붙어 있는 반면, 주황선(scratchpad)은 어떤 임계 크기를 넘는 순간 급격히 치솟는다.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'Surprisingly, we find that these same models are able to perform complex multi-step computations—even in the few-shot regime—when asked to perform the operation “step by step”, showing the results of intermediate computations.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2112.00114 — Show Your Work: Scratchpads for Intermediate Computation', u:'https://arxiv.org/abs/2112.00114'}
]
});
