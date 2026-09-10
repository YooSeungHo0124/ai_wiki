WIKI.paper({
slug:'opt-iml',
venue:'arXiv 2022 (Meta AI)',
authors:'Iyer, Lin, Pasunuru et al. (Meta AI)',
arxiv:'2212.12017',

tldr:'[OPT](#/p/opt)를 2,000개에 가까운 NLP 과제로 지시 미세조정하면서, **과제 수·과제 다양성·프롬프트 형식·보조 데이터** 같은 설계 선택지를 하나씩 떼어내며 무엇이 일반화에 실제로 기여하는지 통제 실험으로 분리한 논문이다.',

context:'2022년 말 [FLAN](#/p/flan)·[Super-NaturalInstructions](#/p/super-natural-instructions)·PromptSource 같은 지시학습 컬렉션이 잇달아 공개되며 "과제 수를 늘리면 좋다"는 권고가 굳어지고 있었다. 문제는 이런 결과 대부분이 [PaLM](#/p/palm) 540B 같은 초대형·비공개 모델과 결합돼 있어, 어떤 설계 요소가 실제로 기여했는지 분리해 말하기 어렵다는 점이었다. 이 논문은 모델 계열을 [OPT](#/p/opt) 30B로 고정한 채, 8개 벤치마크에서 뽑은 약 2,000개 과제를 하나의 통합 벤치마크(OPT-IML Bench)로 만들고 개별 설계 선택을 하나씩 켜고 끄며 기여도를 측정한다. 얻은 통찰로 최종 30B·175B 모델을 학습시켜 OPT-IML이라 부른다.',

ideas:[
 {h:'세 층위의 일반화를 나눠서 잰다',
  lead:'완전 미지 카테고리, 카테고리는 봤지만 과제는 처음, 과제도 본 새 인스턴스 — 세 층위를 각각 평가한다.',
  d:'기존 연구는 대개 "완전히 held-out인 과제 카테고리"에 대한 일반화만 쟀다. 이 논문은 여기에 두 층위를 더한다 — 학습 때 본 카테고리의 새 과제(partially held-out), 그리고 학습에 쓰인 과제의 새 인스턴스(fully supervised). 100개 이상의 과제 카테고리를 이 세 층위로 나누고 각각을 따로 추적하면, "과제 다양성을 늘리는 것"이 어느 층위에는 도움이 되고 어느 층위에는 무관한지가 드러난다.'},
 {h:'과제 수를 늘리면 미지 카테고리에서만 는다',
  lead:'16→1024개로 과제 수를 늘려도 이미 학습에 쓰인 과제의 성능은 그대로다.',
  d:'16, 64, 256, 1024개로 학습 과제 수를 늘려가며 세 일반화 층위를 측정하면, **완전 held-out과 partially held-out 카테고리는 과제 수가 늘수록 뚜렷이 개선**되지만 **fully supervised 과제(이미 학습에 쓰인 과제류)의 성능은 거의 변하지 않는다**. "과제를 더 넣으면 전반적으로 좋아진다"는 통념과 달리, 이득은 처음 보는 것에 대한 일반화에만 집중된다는 뜻이다.'},
 {h:'카테고리 다양성은 few-shot에서 오히려 손해',
  lead:'training cluster를 4→64개로 늘리면 zero-shot은 늘지만 few-shot 성능은 되레 떨어지는 경향을 보인다.',
  d:'과제 수와 별개로 카테고리(cluster) 수 자체를 4, 16, 64, 93개로 늘리는 실험에서는, zero-shot의 완전 held-out·partially held-out 성능은 개선되지만 few-shot 결과는 뒤섞이며 전반적으로 하락 경향을 보인다. 저자들은 이를 최종 모델에서는 **가능한 모든 과제·카테고리를 그대로 쓰는** 선택으로 정리했다 — 이 실험 자체는 다양성이 공짜가 아니라는 반증 사례로 남는다.'},
 {h:'추론 데이터는 소량만 섞어도 크게 는다',
  lead:'reasoning(CoT류) 데이터를 단 1%만 섞어도 held-out 추론 과제 Rouge-L이 12.2에서 31.6으로 뛴다.',
  d:'reasoning 체인을 요구하는 프롬프트를 1%, 2%, 4% 비율로 학습 혼합에 넣어 보면, 1%만으로도 held-out 추론 과제 성능이 크게 뛰고 Cause-Effect·Toxicity·Word Analogy 같은 무관해 보이는 카테고리에도 파급 효과가 있다. 반대로 비율을 4%까지 올리면 MMLU·Toxicity 등에서는 이득이 줄어들어, 최종 모델은 **1%**로 고정했다.'},
 {h:'대화 데이터를 섞으면 0-shot이 오히려 나빠진다',
  lead:'BlenderBot3 대화 데이터를 0.5%만 넣어도 stereotype·word analogy 0-shot 성능이 떨어진다.',
  d:'32만 개의 대화를 0.5% 비율로 섞어 학습시키면 5-shot 성능은 거의 그대로지만 0-shot 성능, 특히 Stereotype Detection과 Word Analogy에서 하락이 나타난다. "보조 데이터를 섞으면 다다익선"이라는 가정이 성립하지 않는 또 다른 사례이며, 어떤 보조 데이터를 얼마나 섞을지는 목표 능력별로 따로 검증해야 한다는 것을 보여준다.'}
],

diagram:{type:'flow', cap:'OPT-IML Bench의 구조. 왼쪽(학습) 카테고리와 오른쪽(평가) 카테고리가 완전 겹침·부분 겹침·전혀 안 겹침의 세 관계를 만들어 세 층위의 일반화를 동시에 측정한다.',
 nodes:[
  {t:'8개 벤치마크', s:'NIV2·FLAN·PromptSrc'},
  {t:'과제 통합', s:'1,991개 과제 · 100+ 카테고리', acc:true},
  {t:'OPT 미세조정', s:'30B · 175B'},
  {t:'3층위 평가', s:'미지 카테고리/과제/인스턴스'}
 ]},

math:[],

numbers:[
 {k:'벤치마크 규모', v:'1,991개 과제', d:'8개 기존 메타데이터셋(NIV2·FLAN·PromptSource·CrossFit 등)을 100개 이상의 카테고리로 통합'},
 {k:'reasoning 최적 비율', v:'1%', d:'held-out 추론 과제 Rouge-L **12.2 → 31.6**으로 개선; 2~4%에서는 다른 카테고리 이득이 줄어듦'},
 {k:'MMLU (0/5-shot)', v:'OPT-IML-Max 175B 49.1/47.1', d:'같은 크기 OPT 175B(24.2/26.1) 대비 크게 개선되지만 FLAN-PaLM 540B(–/73.5)에는 못 미침'},
 {k:'BBH (3-shot)', v:'OPT-IML-Max 175B 35.7', d:'OPT 175B(30.2) 대비 개선; FLAN-T5 11B(45.3)보다는 낮음'},
 {k:'대화 데이터 비율', v:'0.5%', d:'BlenderBot3 대화 32만 건 포함 시 0-shot 성능(특히 stereotype·word analogy)이 하락'}
],

impact:'이 논문은 새 아키텍처나 새 데이터셋이 아니라 **"왜 지시학습이 되는가"에 대한 원인 분리**를 남겼다. 과제 수 확대의 이득이 미지 과제 일반화에 국한된다는 것, 카테고리 다양성이 few-shot에는 해가 될 수 있다는 것, reasoning·dialogue 같은 보조 데이터는 소량으로도 크든 작든 효과가 갈린다는 것을 같은 모델·같은 벤치마크에서 직접 비교해 보였다. OPT-IML Bench 자체도 이후 지시학습 벤치마크 설계의 참고 자료로 남았다.',

legacy:[
 '**[Flan Collection](#/p/flan-collection)과의 교차검증** — 두 논문 모두 "혼합 비율·형식 다양성이 단순 과제 수보다 중요하다"는 결론에 독립적으로 도달했다. 다만 Flan Collection은 input inversion·zero/few-shot 템플릿 혼합처럼 데이터 **만드는 방식**에, OPT-IML은 reasoning·dialogue 같은 **보조 데이터 혼합 비율**에 초점을 맞춰 서로 다른 축을 파고들었다',
 '**held-out 3층위 프레임** — "카테고리/과제/인스턴스"로 일반화를 나눠 재는 방식은 이후 지시학습 벤치마크가 결과를 보고하는 표준 틀 중 하나가 됐다',
 '**RLHF와의 성능 격차를 스스로 인정** — OpenAI davinci 계열(RLHF 적용)과의 MMLU·BBH 격차를 지도학습 지시튜닝만으로는 못 메운다고 명시해, 이후 [InstructGPT](#/p/instructgpt)류 RLHF 연구의 필요성을 역설적으로 뒷받침했다'
],

pitfalls:[
 '**"과제를 많이 넣을수록 좋다"는 절반만 맞다.** 이 논문이 실제로 보인 것은 held-out 일반화에 대한 이득이지, 이미 학습에 쓰인 과제의 성능 향상이 아니다. 두 지표를 섞어 인용하면 논문 주장을 과장하게 된다.',
 '**카테고리 다양성 확대 실험은 "역효과"를 보인 드문 사례다.** 대부분의 지시학습 논문이 다양성 증가 = 성능 증가를 보고하는 것과 달리, 이 논문의 cluster 확장 실험은 few-shot에서 혼재된 결과를 냈다 — 결론을 일반화해 인용하지 않도록 주의.',
 '**MMLU·BBH에서 FLAN-PaLM·davinci보다 낮은 것은 지시튜닝 방법의 실패가 아니다.** 논문 스스로 사전학습 토큰 수(OPT 180B vs T5 1T vs FLAN-PaLM 800B)·아키텍처·RLHF 유무 등 교란 요인이 너무 많아 원인을 단정할 수 없다고 명시한다.'
],

figures:[
 {f:'fig1-taskbench.png',
  cap:'왼쪽이 학습에 쓴 카테고리, 오른쪽이 평가 카테고리. Sentiment Analysis는 완전히 겹치고(왼쪽 위·오른쪽 아래), Question Answering은 부분적으로 겹치고, Cause-Effect는 오른쪽에만 있어 완전 held-out이다 — 같은 그림 안에 세 일반화 층위가 동시에 표현돼 있다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We develop an extensive large-scale fine-tuning and evaluation framework of 2000 NLP tasks (which we call OPT-IML Bench) and use it to characterize the tradeoffs of different decisions relating to instruction meta-learning (IML) on the OPT models.', src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 2212.12017 — OPT-IML', u:'https://arxiv.org/abs/2212.12017'},
 {t:'OPT-IML Bench (GitHub, Meta AI)', u:'https://github.com/facebookresearch/metaseq/tree/main/projects/OPT-IML'}
]
});
