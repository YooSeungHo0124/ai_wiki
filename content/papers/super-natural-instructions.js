WIKI.paper({
slug:'super-natural-instructions',
venue:'EMNLP 2022 (arXiv)',
authors:'Wang, Mishra, Alipoormolabashi, Kordi et al. (Allen Institute for AI · U. Washington · Arizona State U. 외 대규모 공저)',
arxiv:'2204.07705',

tldr:'[Natural Instructions](#/p/natural-instructions)의 61개 과제를 **1,616개 과제 · 76개 과제 유형 · 55개 언어**로 25배 넘게 확장하고, 전문가가 직접 쓴 지시문으로 T5를 파인튜닝한 Tk-Instruct가 175B [InstructGPT](#/p/instructgpt)를 능가함을 보였다. "과제 수를 늘리면 일반화가 log-linear하게 좋아진다"는 스케일링 관계를 처음 정량적으로 제시했다.',

context:'[Natural Instructions](#/p/natural-instructions)는 61개 과제로 "지시문이 낯선 과제 일반화에 도움이 되는가"라는 질문에 그렇다고 답했지만, 규모가 작아 그 효과가 얼마나 더 커질 수 있는지는 알 수 없었다. 비슷한 시기 [T0](#/p/t0)는 기존 NLP 데이터셋에 수작업 프롬프트를 씌우는 방식(PromptSource)으로 같은 문제에 접근했는데, 이 논문은 그와 다르게 **전문가가 작성한 선언적 지시문**(task definition + 긍정/부정 예시 + 설명)을 훨씬 큰 규모로 모으는 쪽을 택했다. 목표는 "지시문을 따르는 능력이 과제 수·모델 크기와 어떤 관계인가"를 실측하는 것이었다.',

ideas:[
 {h:'1,616개 과제로 25배 확장, 다양성 중심 설계',
  lead:'76개 과제 유형·55개 언어에 걸쳐 지시문 스타일을 표준화한 초대형 벤치마크를 만든다.',
  d:'분류·추출·infilling·시퀀스 태깅·텍스트 재작성·텍스트 구성 등 76개 과제 유형, 55개 언어에 걸친 1,616개 과제를 모았다. 총 5M개 인스턴스이며 지시문은 평균적으로 P3([T0](#/p/t0)가 쓰는 PromptSource)의 간결한 템플릿보다 **더 상세한 선언적 정의**를 담도록 설계했다.'},
 {h:'Tk-Instruct: 정의 + 긍정/부정 예시로 T5를 파인튜닝',
  lead:'T5를 757개 학습 과제의 지시문·예시로 멀티태스크 파인튜닝해 in-context instruction을 따르게 만든다.',
  d:'Tk-Instruct는 [T5](#/p/t5) 체크포인트에서 시작해, 과제 정의(Definition)와 소수의 긍정/부정 예시(+설명)를 입력에 붙인 형태로 757개 영어 학습 과제 전체에 걸쳐 멀티태스크 파인튜닝한다. 평가는 119개의 학습에 없던 영어 과제(비영어는 mT5 기반 mTk-Instruct로 35개 과제)에서 수행한다.'},
 {h:'11B 모델이 175B InstructGPT를 ROUGE-L로 앞선다',
  lead:'파라미터 수는 1/16이지만 다양한 과제로 파인튜닝된 Tk-Instruct가 InstructGPT를 능가한다.',
  d:'119개 영어 unseen 과제에서 Tk-Instruct(11B)는 ROUGE-L 62.0으로 InstructGPT(175B, 52.1)보다 **9.9점** 높다. mTk-Instruct(13B)는 다국어 트랙에서 InstructGPT보다 **13.3점** 높다. 모델 크기가 아니라 **파인튜닝에 쓰인 과제의 다양성**이 일반화의 핵심 변수임을 시사한다.'},
 {h:'과제 수는 log-linear, 인스턴스 수는 빠르게 포화',
  lead:'같은 데이터양이라도 "몇 과제인가"가 "과제당 몇 개인가"보다 일반화에 훨씬 중요하다.',
  d:'학습 과제 수를 늘리면(최대 757개까지 실험) 일반화 성능이 로그-선형으로 계속 좋아진다. 반면 과제당 학습 인스턴스 수는 **64개**만 넘으면 성능이 포화돼, 더 늘려도 이득이 거의 없고 학습 시간만 늘어난다. 저자들은 T5-large를 757개 과제로 학습한 결과(48.0)가 T5-3B를 128개 과제로 학습한 결과(48.4)와 비슷함을 보여, 과제 다양성 확장이 **모델 크기 확장의 대안**이 될 수 있다고 결론짓는다.'}
],

diagram:{type:'compare', cap:'같은 계보의 두 접근 — 지시문을 어디서 가져오는가.',
 left:{t:'T0: 데이터셋 + 수작업 템플릿', items:['기존 NLP 데이터셋에 프롬프트 씌움','템플릿은 비교적 간결(P3)','인코더-디코더(T5) zero-shot']},
 right:{t:'Tk-Instruct: 지시문 확장', items:['1,616과제 · 76유형 · 55언어','정의+긍/부정 예시로 상세 지시','과제 수 늘릴수록 log-linear 개선'], acc:true}},

math:[
 {expr:'ROUGE-L(Tk-Instruct, 11B) = 62.0  >  ROUGE-L(InstructGPT, 175B) = 52.1',
  tex:'\\text{ROUGE\\text{-}L}_{\\text{Tk-Instruct(11B)}} = 62.0 \\;>\\; \\text{ROUGE\\text{-}L}_{\\text{InstructGPT(175B)}} = 52.1',
  d:'119개 영어 unseen 과제에서의 격차(+9.9점)다. 모델 크기가 16분의 1인데도 지시문 다양성만으로 이 격차를 만들었다.'}
],

numbers:[
 {k:'과제 · 과제유형 · 언어', v:'1,616개 · 76종 · 55개', d:'[Natural Instructions](#/p/natural-instructions)의 61과제 대비 약 26배'},
 {k:'인스턴스 총량', v:'약 5M', d:'과제당 학습 인스턴스는 **64개**를 넘으면 성능 포화'},
 {k:'학습/평가 과제 분할', v:'757 학습 · 119 영어 평가 · 35 비영어 평가', d:'Tk-Instruct/mTk-Instruct의 실제 학습·평가 셋'},
 {k:'Tk-Instruct vs InstructGPT', v:'+9.9 ROUGE-L (영어) · +13.3 (다국어)', d:'11B/13B 모델이 175B InstructGPT를 능가'},
 {k:'지도학습 상한(oracle)', v:'ROUGE-L 74.3(영어) · 94.0(다국어)', d:'평가 과제의 정답으로 직접 파인튜닝한 추정 상한. Tk-Instruct(62.0)와 여전히 큰 격차'}
],

impact:'과제 수를 1,600여 개로 밀어붙이면서 "지시문 기반 일반화는 규모가 커질수록 실제로 좋아지는가"라는 질문에 처음으로 로그-선형 스케일링 곡선으로 답했다. 동시에 모델 크기보다 **파인튜닝 과제의 다양성**이 일반화에 더 결정적일 수 있음을 보여, 이후 [FLAN](#/p/flan) 계열과 [flan-collection](#/p/flan-collection)이 "무엇을 얼마나 다양하게 섞어야 하는가"를 파고드는 연구로 이어질 발판을 놓았다.',

legacy:[
 '**데이터 구성 자체의 연구로 확장** — [flan-collection](#/p/flan-collection)이 과제 균형·zero/few-shot 혼합 등 "무엇이 실제로 기여하는가"를 통제 실험으로 파고듦',
 '**자동 지시문 생성으로 병목 해소** — 전문가가 1,616개 과제 지시문을 직접 쓰는 비용은 [Self-Instruct](#/p/self-instruct)가 모델이 스스로 지시문을 생성하게 하는 방식으로 우회',
 '**다국어 지시학습의 선례** — mTk-Instruct의 55개 언어 실험은 이후 [BLOOMZ · mT0](#/p/bloomz)의 다국어 지시학습 설계에 직접 참고됨',
 '**"과제 다양성 vs 모델 크기" 트레이드오프 논쟁** — 이 논문의 log-linear 스케일링 결과는 "매우 많은 과제에서는 모델 크기 영향이 작다"는 이전 주장(Xu et al., 2022)을 반박하며, 이후 스케일링 연구에서 반복 인용됨'
],

pitfalls:[
 '**T0와 헷갈리지 않는다.** 둘 다 T5 기반 zero-shot 일반화를 다루지만, T0는 기존 데이터셋에 수작업 템플릿을 씌운 것이고 이 논문은 별도로 수집한 전문가 작성 지시문을 쓴다 — 데이터 출처와 지시문 상세도가 다르다.',
 '**"설명(explanation)을 추가하면 더 좋아진다"는 아니다.** 논문은 긍정 예시 추가는 도움이 되지만 설명(explanation)을 넣으면 오히려 성능이 떨어진다고 명시적으로 보고한다 — 지시 요소를 무조건 많이 넣을수록 좋다는 직관은 틀렸다.',
 '**ROUGE-L 62.0이 "사람 수준"을 뜻하지 않는다.** 같은 표의 지도학습 상한(74.3/94.0)과 여전히 10점 이상 격차가 있고, 저자들도 "sizable gap"이라고 명시한다.'
],

figures:[
 {f:'fig1-schema.png',
  cap:'한 과제의 지시문 구조. 위에서부터 Definition(과제 정의), Positive Examples(입력·출력·근거 설명), Negative Examples(오답과 그 이유), 마지막으로 Tk-Instruct가 실제로 풀어야 하는 Evaluation Instances. Natural Instructions보다 근거(Explanation) 필드가 명시적으로 강조된 점이 다르다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'An 11B-parameter Tk-Instruct can outperform the 175B-parameter InstructGPT model by 9.9 ROUGE-L points when evaluated on 119 English held-out tasks.',
  src:'Abstract 인근, p.1'}
],

links:[
 {t:'arXiv 2204.07705 — Super-NaturalInstructions', u:'https://arxiv.org/abs/2204.07705'},
 {t:'Super-NaturalInstructions 데이터셋 · 리더보드', u:'https://instructions.apps.allenai.org'}
]
});
