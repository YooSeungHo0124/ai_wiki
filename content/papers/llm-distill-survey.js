WIKI.paper({
slug:'llm-distill-survey',
venue:'arXiv 2024 (TKDE 제출)',
authors:'Xu, Li, Tao, Shen, Cheng, Li, Xu, Tao, Zhou (HKU · Maryland · Microsoft · UTS · Peking · Sydney)',
arxiv:'2402.13116',

tldr:'GPT-4 같은 폐쇄형 교사에서 오픈소스 학생으로 지식을 옮기는 LLM 증류 연구를 **알고리즘·능력·수직화**라는 세 축으로 지도화한 서베이. 개별 기법을 나열하지 않고, "무엇을 축으로 구분할지"의 틀 자체가 이 논문의 기여다.',

context:'BERT 시대([DistilBERT](#/p/distilbert), [TinyBERT](#/p/tinybert) 등)의 증류는 교사·학생 모두 파라미터에 접근 가능한 상태에서 로짓·은닉상태를 맞추는 **아키텍처 압축** 문제였다. LLM 시대에는 상황이 바뀐다 — GPT-4 같은 최강 교사는 API 뒤에 감춰진 **블랙박스**라 파라미터도 로짓도 볼 수 없고, 목표도 "같은 크기를 더 작게"가 아니라 "폐쇄형 모델의 능력을 오픈소스 모델에 옮기는 것"으로 이동했다. 그 결과 증류의 초점이 확률분포 모방에서 **지식을 이끌어내는 것(knowledge elicitation)**과 **그렇게 얻은 데이터로 학습시키는 방법**으로 옮겨갔다.',

ideas:[
 {h:'세 기둥: 알고리즘 · 능력 · 수직화',
  lead:'서베이 전체를 KD 알고리즘, 능력(스킬) 증류, 수직 도메인 증류 세 갈래로 나눈다.',
  d:'KD Algorithms는 "교사에서 지식을 어떻게 뽑아내고 학생에 어떻게 넣는가"라는 기술적 토대를, Skill Distillation은 문맥 따르기·정렬·에이전트 능력·NLU/NLG 같은 **구체적 능력** 전이를, Verticalization Distillation은 법률·의료·금융·과학 같은 **특정 도메인**에 특화된 증류를 다룬다. 저자들은 알고리즘 축이 나머지 두 축의 기술적 기반이라고 명시한다 — 능력·도메인 증류는 결국 알고리즘 축의 기법들을 그 목적에 맞게 적용한 것이다.'},
 {h:'지식 이끌어내기(Knowledge Elicitation): 라벨링부터 자기지식까지 6가지',
  lead:'교사에게 무엇을 입력하고 무엇을 받아내는지에 따라 여섯 갈래로 나눈다.',
  d:'Labeling(입력을 주고 라벨을 받음), Expansion(시연 몇 개로 유사 예시를 늘림), Data Curation(원시 데이터에서 통째로 새 데이터를 합성), Feature(입력·출력을 주고 내부 특징을 뽑음), Feedback(학생의 출력에 대한 평가·교정을 받음), Self-Knowledge(모델이 스스로에게 지식을 생성해 학습, teacher=student)로 구분한다. Feature를 제외한 나머지 다섯은 교사 파라미터를 몰라도 되는 블랙박스 방식이다.'},
 {h:'화이트박스 대 블랙박스: 접근 가능성이 알고리즘을 가른다',
  lead:'교사 내부(분포·은닉상태)에 접근 가능하냐가 쓸 수 있는 증류 알고리즘의 종류를 결정한다.',
  d:'교사 파라미터에 접근할 수 있는 화이트박스 상황에서는 Divergence(교사·학생 분포 간 KL 등을 최소화)와 Similarity(은닉 상태·특징 맵을 직접 정렬)를 쓸 수 있다. 반면 GPT-4처럼 API로만 접근하는 블랙박스 교사에게는 이런 내부 신호가 없으므로, 교사가 생성한 텍스트로 학생을 지도학습시키는 **Supervised Fine-Tuning(SFT, 이 논문은 이를 [Seq-KD](#/p/seq-kd)와 동일한 방법으로 규정한다)**과 강화학습·순위 최적화처럼 출력만으로 작동하는 방법이 주로 쓰인다. 화이트박스가 더 깊은 지식을 옮길 수 있지만, 블랙박스 교사(GPT-4 등) 자체의 능력이 더 강력해 학생 성능이 오히려 나은 경우가 많다는 트레이드오프를 짚는다.'},
 {h:'Forward KL 대 Reverse KL: mode-covering 대 mode-seeking',
  lead:'같은 발산 최소화라도 방향에 따라 학생이 모든 모드를 덮으려 하는지, 가장 뚜렷한 모드에 집중하는지가 갈린다.',
  d:'표준 KD의 forward KL(교사 분포에 맞춰 학생을 넓게 펼침)은 모든 모드를 덮으려다 교사가 낮게 평가하는 토큰에도 확률을 배분해 환각을 유발할 수 있다. Reverse KL([MiniLLM](#/p/minillm) 등)은 교사가 높게 평가하는 곳에 집중해 더 정확하지만 다양성이 떨어진다. 이 논문은 기계번역처럼 모드가 적은 과제엔 forward KL이, 대화·지시 따르기처럼 모드가 많은 과제엔 reverse KL이 낫다고 정리한다.'},
 {h:'RL·순위 최적화: 교사의 피드백 자체를 학습 신호로',
  lead:'교사 출력을 그대로 베끼는 대신, 교사가 매긴 선호·보상으로 정책을 최적화한다.',
  d:'RL 기반 증류는 교사 피드백으로 학생 보상모델을 학습시킨 뒤(distilled reward model) 그 보상을 최대화하도록 학생 정책을 PPO 등으로 학습시킨다. 순위 최적화(DPO, RRHF 등)는 교사가 매긴 응답들의 선호 순서를 직접 목적함수에 반영해, 보상모델 학습 단계 자체를 생략한다.'}
],

diagram:{type:'split', cap:'KD 알고리즘이라는 공통 토대 위에, 능력과 도메인이라는 두 응용 축이 갈라진다.',
 from:{t:'KD 알고리즘', acc:true},
 branches:[
  {t:'지식 이끌어내기', s:'라벨링·피드백 등'},
  {t:'SFT·발산·RL·순위'},
  {t:'스킬 증류', s:'정렬·에이전트·NLU'},
  {t:'수직 증류', s:'법률·의료·금융'}
 ]},

math:[
 {expr:'L_Div = E[D(p_T(y|x), p_S(y|x))]',
  tex:'\\mathcal{L}_{Div} = \\mathbb{E}_{x\\sim\\mathcal{X},\\,y\\sim\\mathcal{Y}}\\big[D\\big(p_T(y|x), p_S(y|x)\\big)\\big]',
  d:'발산 기반 화이트박스 증류의 일반형. $D$ 자리에 forward KL, reverse KL 등을 넣을 수 있고, 표준 KD의 목적함수는 forward KL을 근사한 것이다.'},
 {expr:'L_RM = − E[log σ(r_φ(x,y_w) − r_φ(x,y_l))]',
  tex:'\\mathcal{L}_{RM}(r_\\phi, \\mathcal{D}^{(fd)}) = -\\mathbb{E}_{(x,y_w,y_l)\\sim\\mathcal{D}^{(fd)}}\\big[\\log \\sigma\\big(r_\\phi(x,y_w)-r_\\phi(x,y_l)\\big)\\big]',
  d:'교사 선호 데이터로 학생 보상모델을 학습시키는 손실. $y_w, y_l$은 교사가 선호/비선호로 표시한 두 출력.'}
],

numbers:[
 {k:'서베이 구조', v:'3대 축', d:'KD Algorithms · Skill Distillation · Verticalization Distillation (§3~§5)'},
 {k:'지식 이끌어내기 범주', v:'6가지', d:'Labeling·Expansion·Data Curation·Feature·Feedback·Self-Knowledge (§3.1)'},
 {k:'증류 알고리즘 범주', v:'4가지', d:'SFT(=Seq-KD)·Divergence/Similarity·Reinforcement Learning·Ranking Optimization (§3.2)'},
 {k:'스킬 범주', v:'5가지', d:'Context Following·Alignment·Agent·NLP Task Specialization·Multi-Modality (§4)'},
 {k:'수직 도메인 범주', v:'5가지+', d:'Law·Medical & Healthcare·Finance·Science·Misc. (§5)'}
],

impact:'개별 기법 대신 "무엇을 축으로 나눌 것인가"라는 지도를 제공한 것이 이 서베이의 실질적 기여다. 화이트박스/블랙박스 구분, 지식 이끌어내기의 6분류, SFT-발산-RL-순위 4분류는 이후 LLM 증류 논문들이 스스로를 분류하는 어휘로 굳어졌고, seq-kd를 SFT 증류의 원형으로 명시적으로 계보화한 점도 이 분야의 역사적 연속성을 보여준다.',

legacy:[
 '**분류 체계 자체가 후속 연구의 언어가 됨** — 화이트박스/블랙박스, 6종 지식 이끌어내기 구분이 이후 논문들의 관련연구 절에서 표준 어휘로 재사용',
 '**DA(데이터 증강)와 KD의 결합 관점** — 시드 지식에서 교사가 대규모 고품질 데이터를 생성하는 과정을 증류의 필수 구성요소로 명시적으로 편입',
 '**후속 리뷰의 기준점** — [KD·데이터셋 증류 리뷰](#/p/kd-dd-survey)등 이후 서베이가 이 taxonomy를 인용·비교 대상으로 삼음'
],

pitfalls:[
 '**이 서베이가 새 알고리즘을 제안하는 논문이 아니다.** 분류와 정리가 목적이므로, 개별 수치 성능 비교보다 "어떤 범주에 무엇이 속하는가"를 정확히 옮기는 것이 이 노트의 역할이다.',
 '**"화이트박스가 항상 더 나은 학생을 만든다"가 아니다.** 원문은 화이트박스가 더 깊은 지식을 전달할 수 있지만, 블랙박스 교사(GPT-4 등) 자체가 워낙 강력해 그로부터 증류한 학생이 화이트박스 증류 학생보다 나은 경우가 많다고 명시한다.',
 '**forward/reverse KL의 우열은 태스크에 따라 갈린다고 원문이 직접 정리한다.** "reverse KL이 항상 더 좋다"거나 그 반대로 일반화하면 이 서베이의 논지와 어긋난다.'
],

figures:[
 {f:'fig2-overview.png',
  cap:'가운데가 알고리즘 축(③생성된 지식으로 ④학생을 학습), 왼쪽 아래가 지식 이끌어내기 6범주, 오른쪽이 증류 알고리즘 4범주(SFT·발산과 유사성·RL·순위 최적화), 위쪽이 능력·도메인이라는 응용 축이다. 이 그림 한 장이 서베이의 3대 축 구조를 요약한다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'Our survey is meticulously structured around three foundational pillars: algorithm, skill, and verticalization.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2402.13116 — A Survey on Knowledge Distillation of Large Language Models', u:'https://arxiv.org/abs/2402.13116'},
 {t:'GitHub — Tebmer/Awesome-Knowledge-Distillation-of-LLMs', u:'https://github.com/Tebmer/Awesome-Knowledge-Distillation-of-LLMs'}
]
});
