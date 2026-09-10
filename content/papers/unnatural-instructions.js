WIKI.paper({
slug:'unnatural-instructions',
venue:'ACL 2023',
authors:'Honovich, Scialom, Levy, Schick (Tel Aviv University · Meta AI)',
arxiv:'2212.09689',

tldr:'사람이 쓴 시드 15개만으로 언어모델 스스로에게 instruction-input-output 삼중항을 생성시켜 **64,000개(확장 시 240,670개)의 지시 데이터**를 만들어낸 논문. 노이즈가 섞여 있음에도 이 데이터로 학습한 모델이 사람이 직접 만든 Super-NaturalInstructions로 학습한 모델과 맞먹거나 능가했다.',

context:'2022년 말 지시학습은 [Super-NaturalInstructions](#/p/super-natural-instructions)·[FLAN](#/p/flan) 같은 사람이 손으로 구축한 대규모 과제 컬렉션에 의존하고 있었다. 이런 컬렉션은 비용이 크고, 작성자가 익숙한 NLP 과제 유형에 쏠려 다양성이 제한된다. [InstructGPT](#/p/instructgpt)는 OpenAI API 사용자 로그라는 비공개 데이터로 이 병목을 우회했지만 재현이 불가능하다. 이 논문의 질문은 "instruction 데이터 자체를 모델에게 생성시키면 안 되나"이다.',

ideas:[
 {h:'구조화된 형식으로 생성을 쉽게 만든다',
  lead:'instruction·input·constraints·output 네 필드로 생성과 필터링을 둘 다 쉽게 한다.',
  d:'자유 형식 문장 대신 "instruction / input / constraints(출력 제약, 분류 과제일 때 유효) / output" 네 필드로 고정된 구조를 쓴다. 구조가 고정돼 있어 모델이 예측하기 쉽고, 필드 누락·중복 같은 결함을 **자동 필터**로 걸러내기 쉬워진다. constraints 필드는 출력을 생성할 때만 쓰고 이후에는 버려진다.'},
 {h:'seed 3개로 4번째를 생성하는 부트스트래핑',
  lead:'Super-NaturalInstructions에서 뽑은 시드 3개를 few-shot으로 주고 네 번째 예시를 nucleus sampling으로 뽑는다.',
  d:'Super-NaturalInstructions에서 가져온 예시 $x_1, x_2, x_3$ 을 구조화된 형식으로 제시하고, 모델(text-davinci-002)에게 네 번째 예시 $x_4$ 를 만들게 한다. 창의성을 위해 이 단계는 nucleus sampling($p{=}0.99$)을 쓴다. **5종류의 3개 시드 세트만으로 전체 68,478개 코어 데이터셋**을 생성했다 — 사람이 실제로 작성한 예시는 총 15개뿐이다.'},
 {h:'입력은 확률적으로, 출력은 결정적으로 생성한다',
  lead:'instruction·input은 다양성을 위해 샘플링하고, output만은 정확성을 위해 greedy decoding한다.',
  d:'같은 모델이 두 단계를 다른 디코딩 전략으로 수행한다. instruction과 input은 nucleus sampling으로 다양하게 뽑고, 그렇게 만들어진 input에 대한 정답 output은 greedy decoding으로 뽑는다. 같은 모델을 생성기와 라벨러 둘 다로 쓰되 목적에 따라 디코딩만 바꾸는 것이 핵심 설계다.'},
 {h:'템플릿 확장으로 형식 다양성을 3배로 늘린다',
  lead:'core 데이터셋의 딱딱한 구조를 자유 형식 문장 2개로 다시 써서 240,670개까지 늘린다.',
  d:'core 데이터셋은 instruction-input-output 형식이 지나치게 획일적이라, 각 instruction을 짧고 격식 없는 자유 문장 형태로 재작성(paraphrase)시키는 2단계를 추가한다. 97.5% 이상의 instruction이 2개의 유효한 재작성을 얻어 총 240,670개로 늘어난다. 이 단계가 **Super-NaturalInstructions 형식에 대한 과적합을 줄여** 다른 벤치마크로의 일반화를 돕는다.'},
 {h:'56.5%만 정확해도 학습 신호로는 충분하다',
  lead:'200개 표본 수작업 검수에서 정확도 56.5%인 잡음 섞인 데이터가 그래도 강한 학습 신호를 낸다.',
  d:'200개를 사람이 직접 검수한 결과 논리적이고 실행 가능하며 입력·출력이 지시와 맞는 예시는 56.5%(113개)였다. 나머지 오류의 상당수는 "지시와 입력이 안 맞음"(17.5%) 같은 형식 오류였다. 그럼에도 §5의 실험은 이 잡음 섞인 데이터로 학습한 모델이 손으로 만든 데이터 기준선과 맞먹거나 능가한다는 것을 정량적으로 보인다.'}
],

diagram:{type:'flow', cap:'핵심 생성 파이프라인. 같은 모델 M이 입력은 샘플링으로, 출력은 greedy decoding으로 만들어 데이터를 완성한다.',
 nodes:[
  {t:'시드 3개', s:'사람이 쓴 예시'},
  {t:'입력 생성', s:'nucleus sampling', a:'M'},
  {t:'출력 생성', s:'greedy decoding', a:'M', acc:true},
  {t:'지시 미세조정', s:'같은 모델을 재학습'}
 ]},

math:[],

numbers:[
 {k:'코어 데이터셋', v:'68,478개 (64,000개 사용)', d:'사람이 작성한 것은 시드 15개(세트 5개 × 예시 3개)뿐'},
 {k:'템플릿 확장 후', v:'240,670개', d:'core를 자유 문장으로 재작성해 3배 이상 확장'},
 {k:'수작업 정확도', v:'56.5%', d:'200개 표본 검수, 113개가 지시·입력·출력 모두 정확'},
 {k:'Super-NatInst 벤치마크 성능', v:'기준선 54.0 vs 확장 49.3', d:'사람이 만든 Super-NaturalInstructions 64k로 학습한 기준선(54.0) 대비, 형식이 다양해진 확장판(240,670개)은 이 벤치마크에서는 오히려 낮음 — 형식 다양성의 트레이드오프'},
 {k:'BIG-bench Hard (원 형식)', v:'10.2 → 28.1', d:'template expansion 적용 시 큰 폭 개선(240,670개 기준)'},
 {k:'LMentry 점수', v:'34.6 → 50.7', d:'Super-NatInst 64k 기준선(34.6) 대비 확장 데이터(240,670개)가 앞섬'}
],

impact:'모델이 스스로 만든, 사람이 거의 손대지 않은 데이터로도 사람이 만든 대규모 컬렉션과 경쟁할 수 있다는 것을 정량적으로 보였다. 특히 노이즈가 섞인 데이터라도 학습 신호로서 유효하다는 관찰은, 이후 데이터 생성 파이프라인들이 "완벽한 필터링"보다 "충분한 양과 다양성"에 무게를 두게 만드는 근거가 됐다. template expansion처럼 같은 내용을 형식만 바꿔 늘리는 기법도 단순 증식이 아니라 실제 일반화 성능을 끌어올린다는 것을 보였다.',

legacy:[
 '**[Self-Instruct](#/p/self-instruct)와 같은 시기, 다른 경로** — Self-Instruct는 반복적 부트스트래핑으로 **과제 풀 자체(instruction 다양성)**를 키우고 ROUGE-L 유사도로 중복을 거르는 반면, Unnatural Instructions는 고정된 4필드 구조로 **한 번에 대량 생성**하고 형식은 별도의 template expansion 단계에서 늘린다. 전자는 "무엇을 물을지"를 반복해서 발산시키고, 후자는 "어떻게 표현할지"를 나중에 다양화한다',
 '**noisy-but-useful 데이터라는 관찰** — 56.5% 정확도로도 강한 신호가 난다는 결과는 이후 합성 데이터 생성 연구들이 필터링 강도와 데이터 양 사이의 트레이드오프를 재는 근거로 자주 인용됐다',
 '**모델 자체 생성 데이터의 재현성** — 강한 teacher 모델의 생성물로 다른 모델을 학습시키는 이후의 여러 instruction-tuning 데이터셋 연구들이 참조하는 초기 사례 중 하나다'
],

pitfalls:[
 '**"거의 사람 손을 안 씀"이 "전혀 검수 안 함"은 아니다.** 자동 필터(필드 누락·중복 제거)는 여전히 있고, 200개 표본에 대한 수작업 품질 분석도 수행했다 — 완전 무검증 파이프라인으로 오해하지 말 것.',
 '**core 데이터셋만으로는 Super-NaturalInstructions 기준선을 못 이긴다.** 우위는 template expansion을 적용한 240,670개 버전에서 나타난다. "Unnatural Instructions가 항상 더 낫다"고 뭉뚱그리면 표 4의 조건별 결과를 놓친다.',
 '**정확도 56.5%는 세 조건(논리적 실행 가능·입력 일치·출력 정확)을 모두 만족한 비율이다.** 부분적으로만 맞는 예시(예: 형식은 안 맞지만 답은 우연히 정확)도 오답으로 집계됐으므로, 실제 "쓸모 있는" 데이터 비율은 이 수치보다 높을 수 있다는 점을 저자들도 지적한다.'
],

figures:[
 {f:'fig3-pipeline.png',
  cap:'왼쪽 파란 상자가 시드 $x_1,x_2,x_3$, 첫 번째 M이 nucleus sampling으로 instruction·input·constraints를 생성하고, 두 번째 M이 greedy decoding으로 output만 채워 넣는다. 같은 모델이 두 화살표에서 디코딩 방식만 다르게 쓰인다는 점이 이 그림의 핵심.',
  src:'원문 Figure 3, p.3'}
],

quotes:[
 {t:'We collect 64,000 examples by prompting a language model with three seed examples of instructions and eliciting a fourth.', src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2212.09689 — Unnatural Instructions', u:'https://arxiv.org/abs/2212.09689'},
 {t:'GitHub — orhonovich/unnatural-instructions', u:'https://github.com/orhonovich/unnatural-instructions'}
]
});
