WIKI.paper({
slug:'self-instruct',
venue:'ACL 2023',
authors:'Wang et al. (University of Washington · Allen Institute for AI)',
arxiv:'2212.10560',

tldr:'사람이 쓴 instruction 데이터 대신, **모델 자신에게 instruction과 예시를 생성시켜** 그 데이터로 같은 모델을 다시 instruction-tune하는 방법. 175개 seed task만으로 시작해 5.2만 개 instruction을 만들어냈고, 이걸로 튜닝한 GPT-3가 사람이 손으로 정렬한 [InstructGPT](#/p/instructgpt)와 5%p 차이까지 따라붙었다.',

context:'[GPT-3](#/p/gpt3)는 few-shot 프롬프트에는 강하지만 "instruction을 따르라"는 지시 자체에는 약했다. 이를 고치려는 [FLAN](#/p/flan)이나 InstructGPT류 방법은 결국 사람이 손으로 쓴 instruction-output 쌍이 대량으로 필요하다는 공통 병목을 갖는다. 사람이 쓰는 instruction은 비용이 크고, 작성자가 익숙한 NLP 태스크 몇 종류에 쏠려 다양성이 떨어진다. InstructGPT는 이 문제를 OpenAI API 사용자 로그라는 비공개 데이터로 우회했는데, 재현이 불가능하다는 뜻이다. 저자들의 질문은 단순하다 — **instruction 데이터 자체를 모델에게 생성시키면 안 되나?**',

ideas:[
 {h:'175개 seed로 시작하는 부트스트래핑',
  lead:'소수의 사람 작성 seed task를 씨앗 삼아 반복적으로 task pool을 불려나간다.',
  d:'사람이 쓴 175개 task(각 1개 instruction + 1개 예시)를 초기 pool로 두고, 매 스텝 pool에서 일부를 뽑아 few-shot 프롬프트를 만들어 GPT-3에게 새 instruction을 생성시킨다. 새로 만들어진 instruction 중 필터를 통과한 것만 pool에 추가돼 다음 스텝의 재료가 된다. 사람이 직접 쓰는 양은 고정된 채, 생성량은 반복 횟수만큼 계속 늘어난다.'},
 {h:'classification 여부를 먼저 판단한다',
  lead:'분류 태스크는 label을 먼저, 일반 태스크는 input을 먼저 생성하는 순서를 나눈다.',
  d:'분류 태스크(예: "이 문장이 찬성/반대 중 어느 쪽인가")를 output-first로 생성하면, output 공간이 몇 개 label에 갇혀 있어 모델이 그 label들을 편식하게 된다. 그래서 12개 분류·19개 비분류 seed instruction으로 few-shot 분류기를 만들어 새 instruction을 먼저 분류한 뒤, 분류 태스크는 **label → input** 순서로, 나머지는 **input → output** 순서로 인스턴스를 생성한다.'},
 {h:'휴리스틱 필터링으로 품질을 거른다',
  lead:'사람 검수 없이 ROUGE-L 유사도·형식 규칙만으로 저품질·중복 생성을 걸러낸다.',
  d:'새 instruction은 기존 pool과의 **ROUGE-L 유사도가 0.7 미만**일 때만 채택하고, 지나치게 길거나 짧은 것, 특정 키워드(예: 이미지·그래프 요구처럼 텍스트 LM이 처리 못 하는 것), instruction 자체를 그대로 반복한 인스턴스는 제외한다. 사람 검수는 최종 데이터 품질 평가 단계에서만 표본적으로 들어간다.'},
 {h:'생성된 데이터로 원본 모델을 되먹임 튜닝한다',
  lead:'생성에 쓴 것과 같은 GPT-3를 그 생성 데이터로 다시 finetune한다.',
  d:'52,445개 instruction과 82,439개 instance를 모아 vanilla GPT-3(davinci)를 OpenAI finetuning API로 2 epoch 학습시켜 `GPT3SELF-INST`를 만든다. 별도의 더 강한 teacher 모델이 없다 — 모델이 스스로 만든 데이터로 스스로를 정렬한다는 점이 이 논문의 핵심 주장이다.'}
],

diagram:{type:'loop', cap:'175개 seed에서 시작해 생성→분류→인스턴스 생성→필터링을 반복하며 task pool을 불려나가는 부트스트래핑 루프.',
 center:'매 스텝 pool 갱신',
 nodes:[
  {t:'175 seed task', s:'초기 pool'},
  {t:'Instruction 생성', s:'pool에서 few-shot 샘플'},
  {t:'분류 여부 판별', s:'생성 순서 분기'},
  {t:'Instance 생성', s:'input·output 채움'},
  {t:'필터링', s:'ROUGE-L < 0.7', acc:true}
 ]},

math:[
 {expr:'ROUGE-L(new, existing) < 0.7  →  채택',
  tex:'\\text{ROUGE\\text{-}L}(x_{\\text{new}}, x_{\\text{existing}}) < 0.7 \\;\\Rightarrow\\; \\text{accept}',
  d:'새 instruction이 기존 pool의 모든 instruction과 ROUGE-L 기준 0.7 미만으로 달라야만 pool에 추가한다. 임계값 하나로 다양성과 중복 억제를 동시에 처리하는 단순한 규칙이다.'}
],

numbers:[
 {k:'seed task', v:'175개', d:'사람이 직접 쓴 초기 instruction + instance, 부트스트래핑의 유일한 사람 개입'},
 {k:'생성된 instruction', v:'52,445개', d:'분류 11,584개 · 비분류 40,861개로 비분류가 압도적으로 많음'},
 {k:'생성된 instance', v:'82,439개', d:'instruction당 input-output 쌍 평균 약 1.6개'},
 {k:'중복 필터 임계값', v:'ROUGE-L 0.7', d:'이 미만일 때만 pool에 새 instruction으로 추가'},
 {k:'SUPERNI 개선폭', v:'+33.1%p', d:'vanilla GPT-3 대비 GPT3SELF-INST의 ROUGE-L 절대 상승폭'},
 {k:'InstructGPT001과 격차', v:'5%p', d:'저자들이 새로 만든 novel task 인간 평가에서 GPT3SELF-INST가 InstructGPT001에 근접한 차이'}
],

impact:'사람이 쓴 instruction 데이터가 필수라는 전제를 깨고, **모델 스스로 정렬용 데이터를 만들 수 있음**을 보였다. 별도의 비공개 인간 피드백이나 강한 teacher 모델 없이, 공개된 GPT-3 하나만으로 InstructGPT급 instruction-following을 상당 부분 재현했다는 점에서 재현 가능한 정렬 연구의 문을 열었다. 이후 강한 teacher 모델(ChatGPT·GPT-4)의 출력을 distill하는 방식으로 변형되며, 오픈소스 instruction-tuning 데이터 제작의 표준 레시피가 됐다.',

legacy:[
 '**Alpaca·Vicuna 등 오픈 instruction-tuning 물결** — self-instruct 파이프라인을 ChatGPT/GPT-4 출력으로 바꿔 LLaMA 계열을 값싸게 정렬하는 방식이 순식간에 표준이 됐다',
 '**합성 데이터 학습 계열** — 사람 대신 강한 LM이 학습 데이터를 만든다는 발상이 [phi-textbooks](#/p/phi-textbooks) 같은 합성 corpus 연구로 이어짐',
 '**Evol-Instruct 등 후속 변형** — 단순 부트스트래핑을 넘어 instruction의 난이도·복잡도를 점진적으로 키우는 변형 기법들이 뒤따랐다',
 '**RLHF 파이프라인의 SFT 단계 대체재** — [InstructGPT](#/p/instructgpt) 방식의 비싼 인간 데이터 수집을, 최소한 SFT 단계에서는 합성 데이터로 대체할 수 있다는 근거를 제공했다'
],

pitfalls:[
 '**사람 검수 없는 자동 필터의 한계.** 저자들의 자체 품질 검사에서도 instruction·input·output 세 필드가 모두 유효한 비율은 **54%**에 그쳤다 — ROUGE-L 임계값과 형식 규칙만으로는 노이즈를 완전히 걸러내지 못한다.',
 '**생성 모델의 편향을 그대로 물려받는다.** 새 instruction과 정답 모두 같은 GPT-3가 만들기 때문에, 원 모델이 가진 편향·오류 패턴이 정렬 후에도 증폭되어 남을 위험이 있다.',
 '**"셀프" 부트스트래핑에는 천장이 있다.** teacher 없이 모델이 자기 데이터로 자기를 가르치는 구조라, 원 모델의 능력 이상으로 품질이 올라가긴 어렵다 — 실제로 InstructGPT001과의 5%p 격차는 끝내 좁히지 못했다.'
],

figures:[
 {f:'fig2-pipeline.png',
  cap:'왼쪽 175개 seed task가 초기 pool. Step 1에서 LM이 pool을 보고 새 instruction을 생성하고, Step 2에서 그 instruction이 분류 태스크인지 판별해 output-first(위, class label을 먼저 정함) 또는 input-first(아래, input을 먼저 만듦) 경로로 나뉜다. Step 3에서 instance(input/output)를 채우고, Step 4 필터링을 통과한 것만 다시 pool로 돌아가 다음 반복의 재료가 된다.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'Applying our method to the vanilla GPT3, we demonstrate a 33% absolute improvement over the original model on SUPER-NATURALINSTRUCTIONS, on par with the performance of InstructGPT001, which was trained with private user data and human annotations.',
  src:'Abstract, p.1'},
 {t:'SELF-INSTRUCT provides an almost annotation-free method for aligning pre-trained language models with instructions.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2212.10560 — Self-Instruct', u:'https://arxiv.org/abs/2212.10560'},
 {t:'GitHub — yizhongw/self-instruct', u:'https://github.com/yizhongw/self-instruct'}
]
});
