WIKI.paper({
slug:'t5',
venue:'JMLR 2020 (arXiv 2019)',
authors:'Raffel, Shazeer, Roberts, Lee, Narang et al. (Google)',
arxiv:'1910.10683',

tldr:'번역·요약·분류·회귀·QA를 전부 **"텍스트 넣고 텍스트 받기"** 하나의 형식으로 통일하고, 그 위에서 목적함수·아키텍처·데이터·규모를 격자로 갈아끼우며 전이학습의 설계 공간을 통째로 측정한 67쪽짜리 논문. 부산물로 [Transformer](#/p/transformer)의 **encoder–decoder를 그대로 쓴** 11B 모델과 750GB 코퍼스 C4를 남겼다.',

context:'2019년은 [BERT](#/p/bert)·[GPT-2](#/p/gpt2)·[RoBERTa](#/p/roberta)·XLNet·ALBERT가 몇 달 간격으로 쏟아진 해였다. 문제는 이들이 **아키텍처·목적함수·데이터·계산량을 동시에 바꿔가며** 비교됐다는 점이다. 어떤 요소가 성능을 만들었는지 아무도 분리하지 못했다. 게다가 출력 형식마저 제각각이었다 — BERT는 `[CLS]` 위의 분류 head, GPT는 자유 텍스트, 회귀 태스크는 또 다른 head. 서로 다른 형식은 서로 다른 손실 함수와 디코딩 절차를 요구하고, 그래서 공정 비교 자체가 불가능했다. 이 논문의 전략은 두 단계다: **(1) 모든 태스크를 한 형식으로 강제 통일하고, (2) 그 통제된 환경에서 나머지 변수를 하나씩 바꿔가며 잰다.**',

ideas:[
 {h:'모든 태스크는 텍스트→텍스트다',
  lead:'입력과 출력을 전부 문자열로 강제해 태스크별 head와 손실 함수를 없앤다.',
  d:'입력 앞에 태스크 접두사를 붙이고, 출력은 항상 문자열로 받는다. 분류는 클래스 이름을 **생성**하고(`entailment`), 회귀인 STS-B의 유사도 점수조차 0.2 단위로 반올림해 `"3.8"` 이라는 문자열로 뱉는다. 그 결과 **모델·손실 함수·디코딩 절차가 모든 태스크에서 동일**해진다 — teacher forcing 크로스엔트로피 하나뿐이다. 태스크별 head가 사라지니 태스크를 추가하는 데 코드 변경이 필요 없다.'},
 {h:'C4: Common Crawl을 규칙으로 깎아 만든 750GB',
  lead:'휴리스틱 필터를 연달아 적용해 잡음을 걷어낸 750GB 코퍼스를 만든다.',
  d:'Common Crawl 한 달치에 휴리스틱을 연달아 적용했다 — 종결부호로 끝나는 줄만 남기고, 문장 5개 미만 페이지와 단어 3개 미만 줄을 버리고, 욕설 목록·`javascript`·`lorem ipsum`·중괄호(코드 흔적)가 든 줄을 지우고, 세 문장 이상 중복 구간을 전역 제거하고, 영어 판별 확률 0.99 미만을 뺐다. 통제 실험에서 **필터링 안 한 Common Crawl은 명확히 성능이 나빴다** — 데이터 정제가 선택이 아님을 수치로 보인 부분이다.'},
 {h:'span corruption: 마스킹을 encoder–decoder에 맞게 고친다',
  lead:'연속 구간을 센티널 토큰 하나로 뭉개 decoder가 지워진 부분만 생성하게 한다.',
  d:'[BERT](#/p/bert)식 MLM은 가려진 자리마다 토큰 하나를 복원한다. 여기서는 **연속된 구간(span) 전체를 센티널 토큰 하나로 치환**하고, decoder는 `<X> 지워진구간 <Y> 지워진구간 <Z>` 형태로 **지워진 부분만** 생성한다. 원문 전체를 다시 뱉을 필요가 없어 타깃 시퀀스가 짧아지고 학습이 빨라진다. 최종 설정은 15% 오염 · 평균 span 길이 3.'},
 {h:'encoder–decoder가 이해와 생성을 동시에 가져간다',
  lead:'양방향 encoder의 이해력과 자기회귀 decoder의 생성력을 한 모델에 합친다.',
  d:'같은 파라미터 예산에서 encoder-only / decoder-only(LM) / prefix-LM / encoder–decoder를 비교했다. 결론은 **encoder–decoder + denoising 목적함수**가 가장 좋았다. 이유는 비대칭성에 있다 — encoder는 입력을 양방향으로 자유롭게 읽고(이해), decoder는 causal mask 아래 자기회귀로 쓴다(생성). [BERT](#/p/bert)가 못 하는 생성과 [GPT](#/p/gpt1)가 아쉬운 양방향 입력 이해를 한 모델이 나눠 갖는다. 파라미터는 두 배지만 계산량은 decoder-only와 비슷하다.'},
 {h:'구조 자체보다 격자 탐색이 본체다',
  lead:'목적함수·데이터·규모 등 변수를 하나씩 바꿔가며 통제 실험으로 잰다.',
  d:'논문 분량의 대부분은 ablation 표다 — 목적함수 종류, 오염률, span 길이, 데이터 크기와 반복 횟수, 미세조정 방식(전체/adapter/gradual unfreezing), 멀티태스크 혼합 비율, 그리고 마지막으로 "같은 계산량을 크기·스텝·앙상블 중 어디에 쓸까". 각 절이 하나의 결론으로 끝나고, 마지막 3.7절이 **그 결론들을 전부 합쳐** 최종 모델을 만든다. 이 서술 구조 자체가 이후 사전학습 논문의 템플릿이 됐다.'}
],

diagram:{type:'flow', cap:'태스크 접두사 하나로 모든 문제를 같은 파이프에 넣는다. 분류도, 회귀도, 번역도 출력은 전부 문자열이다.',
 nodes:[
  {t:'태스크 접두사 + 입력', s:'"cola sentence: …"'},
  {t:'Encoder (양방향)', s:'입력을 마스크 없이 읽음'},
  {t:'Decoder (자기회귀)', s:'cross-attn + 인과 마스크', acc:true},
  {t:'출력 문자열', s:'"acceptable"/"3.8"/요약문'}
 ]},

math:[
 {expr:'입력: "Thank you <X> me to your party <Y> week."   타깃: "<X> for inviting <Y> last <Z>"',
  tex:'\\begin{aligned}&\\text{입력: "Thank you <X> me to your party <Y> week."}\\\\&\\text{타깃: "<X> for inviting <Y> last <Z>"}\\end{aligned}',
  d:'span corruption의 실제 형태. 지워진 구간마다 고유 센티널 `<X>`,`<Y>` 를 넣고, 타깃은 센티널과 원래 내용을 번갈아 나열한 뒤 `<Z>` 로 끝낸다. 원문을 통째로 복원하는 것보다 타깃이 훨씬 짧다.'},
 {expr:'L = Σ_t log P(y_t | y_{<t}, Encoder(x))',
  tex:'L=\\sum_t \\log P(y_t \\mid y_{<t}, \\text{Encoder}(x))',
  d:'사전학습이든 미세조정이든, 분류든 번역이든 손실은 이 한 줄뿐이다. 태스크별 head도, 태스크별 손실도 없다는 것이 text-to-text의 실질적 이득이다.'}
],

figures:[
 {f:'fig1-text-to-text.png',
  cap:'가운데 T5 상자로 서로 다른 네 종류의 입력(번역·문법성 판단 cola·유사도 회귀 stsb·요약)이 들어가고, 나오는 것은 전부 **평범한 문자열**이다 — 회귀 과제(stsb)조차 숫자 "3.8"을 텍스트로 생성한다는 점에 주목할 것. 입력 앞에 붙은 "translate English to German:", "cola sentence:" 같은 접두사가 태스크를 지정하는 유일한 장치이고, 모델·손실 함수·디코딩 절차는 네 태스크 모두 동일하다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'We emphasize that our goal is not to propose new methods but instead to provide a comprehensive perspective on where the field stands.',
  src:'Section 1, p.3'}
],

numbers:[
 {k:'C4 크기', v:'약 750GB', d:'Common Crawl 한 달치를 정제. 반복 없이 오래 학습할 수 있을 만큼 크다는 점이 설계 조건이었다'},
 {k:'모델 크기 5종', v:'60M / 220M / 770M / 3B / 11B', d:'Base는 encoder·decoder 각각 BERT-base 크기. 11B는 $d_{ff}$ 를 65,536까지 키우고 head 128개'},
 {k:'최종 사전학습량', v:'100만 스텝 × 배치 2¹¹ × 512 ≈ **1조 토큰**', d:'baseline은 그 1/32인 2³⁵ ≈ 34B 토큰이었다'},
 {k:'GLUE 평균', v:'90.3', d:'직전 최고 89.4'},
 {k:'SuperGLUE 평균', v:'88.9', d:'직전 최고 84.6. GLUE가 포화되자 만들어진 더 어려운 후속 벤치마크'},
 {k:'SQuAD (EM / F1)', v:'91.26 / 96.22', d:'직전 최고 90.1 / 95.5'}
],

impact:'두 종류의 유산이 있다. **방법론으로는** — 하나의 통일된 형식 위에서 변수를 통제해 비교한다는 절차가 표준이 됐고, 이 논문의 ablation 결론들(정제된 데이터가 중요하다, 데이터를 반복하면 손해다, denoising이 LM 목적함수보다 이해 태스크에 낫다)이 이후 수년간 기본 가정으로 쓰였다. **자산으로는** — C4가 [LLaMA](#/p/llama)를 비롯한 수많은 모델의 학습 데이터에 들어갔고, T5 체크포인트는 [FLAN](#/p/flan)·[Switch Transformer](#/p/switch) 등 후속 연구의 출발점이 됐다. 다만 "모든 태스크를 텍스트로"라는 형식적 통일이 곧 "자연어 지시를 이해한다"는 뜻은 아니었고, 그 간극은 [FLAN](#/p/flan)의 instruction tuning과 [InstructGPT](#/p/instructgpt)에서야 메워진다.',

legacy:[
 '**instruction tuning의 전제** — text-to-text 형식이 있었기에 [FLAN](#/p/flan)이 "태스크 접두사"를 "자연어 지시"로 바꿔 끼우는 실험을 할 수 있었음',
 '**MoE의 실험대** — [Switch Transformer](#/p/switch)가 T5의 FFN을 전문가로 교체해 1조 파라미터까지 확장',
 '**데이터 자산으로서의 C4** — [LLaMA](#/p/llama) 등 이후 오픈 모델의 코퍼스에 포함되고, [mT5](#/p/mt5)·ByT5 같은 다국어·바이트 단위 변형을 파생',
 '**encoder–decoder 계열의 존속** — 순수 decoder-only가 주류가 된 뒤에도 번역·요약·[Whisper](#/p/whisper) 같은 조건부 생성에서는 이 구조가 계속 쓰임'
],

pitfalls:[
 '**T5의 접두사는 "지시"가 아니라 태스크 ID다.** `summarize:` 를 `이 글을 요약해줘:` 로 바꾸면 성능이 무너진다. 학습 때 본 문자열과 정확히 같아야 하며, 자연어 지시를 일반화해 이해하는 능력은 [FLAN](#/p/flan) 이후의 것이다.',
 '**논문의 ablation 결론은 그 계산 예산 안에서의 결론이다.** 예를 들어 "denoising이 LM 목적함수보다 낫다"는 baseline 규모에서 얻은 관찰인데, 규모를 훨씬 키운 [GPT-3](#/p/gpt3) 계열은 순수 LM 목적함수만으로 훨씬 넓은 범용성을 얻었다. 통제 실험의 강점과 한계가 동시에 드러나는 지점이다.',
 '**C4는 중립적인 데이터가 아니다.** 욕설 목록 기반 필터는 특정 커뮤니티의 정상적인 문서까지 함께 걷어내고, 영어 판별 임계값 0.99는 비표준 영어를 배제한다. 이후 C4 감사 연구들이 이 편향을 문제 삼았으며, "정제 = 개선"이라는 단순한 등식은 성립하지 않는다.'
],

links:[
 {t:'arXiv 1910.10683 — Exploring the Limits of Transfer Learning (T5)', u:'https://arxiv.org/abs/1910.10683'},
 {t:'google-research/text-to-text-transfer-transformer (코드 · C4 · 체크포인트)', u:'https://github.com/google-research/text-to-text-transfer-transformer'},
 {t:'Google Research Blog — Exploring Transfer Learning with T5', u:'https://research.google/blog/exploring-transfer-learning-with-t5-the-text-to-text-transfer-transformer/'}
]
});
