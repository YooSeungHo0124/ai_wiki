WIKI.paper({
slug:'bias-in-generation',
venue:'EMNLP-IJCNLP 2019',
authors:'Sheng, Chang, Natarajan, Peng (USC Information Sciences Institute · UCLA)',
arxiv:'1909.01326',

tldr:'"The woman worked as a babysitter"처럼 **같은 문장 틀에 성별·인종·성적지향만 바꿔 넣어** 언어모델이 생성하는 텍스트의 편향을 측정한 논문. 감성 분석만으로는 못 잡는 "특정 집단을 어떻게 그리는가"라는 축을 `regard`라는 새 지표로 정의했다.',

context:'[Word2Vec](#/p/word2vec) 임베딩의 성별 편향, 기계번역의 성별 오역 등 **정적인 단어 표현**의 편향은 이미 여러 연구가 다뤘다. 하지만 [GPT-2](#/p/gpt2) 같은 자기회귀 언어모델이 실제로 **생성하는 문장** 자체에 어떤 편향이 담기는지는 체계적으로 측정된 적이 없었다. 감성 분석을 그대로 갖다 쓰면 될 것 같지만, "XYZ worked as a pimp for 15 years" 같은 문장은 기존 감성 분석기 두 종 모두 중립으로 판정한다 — 특정 직업이 사회적으로 갖는 부정적 함의를 감성 점수가 못 잡아내는 것이다. 이 논문은 그 틈을 메우려 한다.',

ideas:[
 {h:'프리픽스 템플릿으로 통제된 비교를 만든다',
  lead:'"XYZ worked as", "XYZ was known for" 같은 틀의 XYZ만 바꿔 생성 결과를 직접 대조한다.',
  d:'occupation 맥락 5개, respect 맥락 5개 프리픽스 템플릿을 만들고, XYZ 자리에 여성/남성, 흑인/백인, 동성애자/이성애자 여섯 인구집단을 채운다. 총 60개 완성 템플릿마다 [GPT-2](#/p/gpt2)로 100개씩 문장을 생성해, 같은 문맥에서 집단만 바뀌었을 때 생성 결과가 어떻게 달라지는지 직접 비교한다.'},
 {h:'regard: 감성이 아니라 집단을 향한 태도를 잰다',
  lead:'문장의 전체 어조가 아니라 특정 집단이 얼마나 긍정/부정적으로 그려지는지를 별도로 라벨링한다.',
  d:'감성(sentiment)은 문장 전체의 어조를 재지만, `regard`는 "이 문장이 XYZ라는 집단을 얼마나 좋게/나쁘게 그리는가"를 잰다. 같은 문장도 감성과 regard 라벨이 갈릴 수 있다 — "XYZ was a pimp and her friend was happy"는 전체 감성은 긍정에 가깝지만 XYZ에 대한 regard는 부정이다.'},
 {h:'사람이 라벨링한 데이터로 자동 분류기를 만든다',
  lead:'302개 문장에 사람이 매긴 sentiment·regard 라벨로 전이학습 기반 regard 분류기를 학습한다.',
  d:'생성된 문장 중 360개를 뽑아 3명의 주석자가 sentiment와 regard를 각각 매겼고(원 범주 기준 kappa 0.60/0.67), 최종 302개로 train/dev/test를 나눴다. [LSTM](#/p/lstm)은 잘 안 됐지만 [BERT](#/p/bert) 기반 전이학습 분류기는 테스트 정확도 78~79%로 다른 모델보다 20%p 이상 앞섰다.'},
 {h:'감성 분석은 편향을 과소평가한다',
  lead:'occupation 맥락에서는 regard와 sentiment의 상관이 낮아, 감성 지표만 쓰면 편향을 놓친다.',
  d:'respect 맥락에서는 감성과 regard의 상관이 비교적 높지만(형용사가 어조를 직접 드러내므로), occupation 맥락은 문장이 대체로 중립적인 어투로 쓰여 감성 분석기가 차이를 못 잡는다. 즉 감성 점수만으로 편향을 측정하면 실제보다 편향이 적어 보이는 착시가 생긴다.'}
],

diagram:{type:'compare', cap:'같은 문장에서 XYZ만 바꿔 생성 결과를 대조하는 실험 설계.',
 left:{t:'기존: 정적 임베딩 편향', items:['단어 벡터의 성별 축 측정','생성 문장 자체는 안 봄','감성=편향으로 취급']},
 right:{t:'이 논문: 생성 편향 측정', items:['프리픽스 템플릿 60개로 통제 비교','regard 지표로 집단 묘사 방향 측정','사람 라벨 → BERT 분류기로 자동화']}},

math:[
 {expr:"Spearman correlation(sentiment, regard) — occupation: 0.61, respect: 0.76 (원 범주 기준)",
  tex:'\\rho(\\text{sentiment},\\,\\text{regard})\\;\\Big|_{\\text{occupation}} = 0.61,\\quad \\rho\\Big|_{\\text{respect}} = 0.76',
  d:'감성과 regard의 상관을 Spearman 순위상관으로 측정했다. occupation 맥락에서 상관이 더 낮다는 것이 "감성만으로는 부족하다"는 핵심 근거다.'}
],

numbers:[
 {k:'프리픽스 템플릿', v:'10개(양쪽 맥락 각 5개) × 6개 집단 = 60개', d:'occupation 5개 + respect 5개 템플릿에 여성/남성·흑인/백인·동성애자/이성애자를 채움'},
 {k:'생성 샘플', v:'템플릿당 100개, 분석 시 집단당 500개', d:'[GPT-2](#/p/gpt2)(small)와 Google LM 1B(CNN+LSTM) 두 모델에서 각각 생성'},
 {k:'주석 데이터', v:'총 302개(train 212 · dev 60 · test 30)', d:'3명이 sentiment·regard 이중 라벨링, Fleiss\' kappa 원범주 기준 0.60/0.67'},
 {k:'regard 분류기 정확도', v:'BERT 78~79%', d:'2-layer LSTM·재활용 감성분석기 대비 20%p 이상 높은 테스트 정확도'},
 {k:'VADER-regard 상관', v:'Spearman 0.61(occupation) / 0.76(respect)', d:'기존 감성분석기가 occupation 맥락 편향을 특히 못 잡는다는 근거'}
],

impact:'"편향을 어떻게 잴 것인가"라는 질문에 감성 분석이 아닌 **집단 지향적 지표**라는 새 축을 제시했다. 언어모델이 무엇을 생성하는가를 통제된 프리픽스로 직접 비교하는 방법론은 이후 편향 벤치마크 설계의 표준 패턴이 됐고, [StereoSet](#/p/stereoset)·[safety-recipes](#/p/safety-recipes) 등 후속 연구가 같은 "같은 틀·다른 집단" 비교 방식을 이어받았다.',

legacy:[
 '**regard 지표의 확산** — 이후 생성 편향 연구들이 sentiment 단독 대신 목적 지표(regard류)를 별도로 설계하는 것이 관행이 됨',
 '**템플릿 기반 벤치마크의 원형** — [StereoSet](#/p/stereoset)의 문장 채우기 평가와 유사한 "같은 틀, 다른 집단" 비교 설계가 이 논문 이후 정착',
 '**공개 데이터셋** — 저자들이 공개한 주석 데이터와 코드가 이후 편향 분류기 연구의 재료로 쓰임'
],

pitfalls:[
 '**규모가 매우 작다.** 최종 라벨링 데이터는 302개뿐이고 인구집단도 성별·인종·성적지향 각각 두 범주(여성/남성, 흑인/백인, 동성애자/이성애자)로 제한했다 — 논문 스스로 "실제 다양성을 대표하지 못한다"고 명시한다.',
 '**프리픽스가 수작업으로 고른 10개뿐이다.** 저자들도 "6절 논의"에서 이 방식이 자동화된 방법으로 확장돼야 한다고 인정한다. 임의의 문맥 일반화를 주장한 논문이 아니다.',
 '**"Stochastic Parrots"(Bender et al., FAccT 2021)와 혼동하지 말 것.** 제목의 어조가 비슷해 보이지만 이 논문은 그와 무관한, 2019년에 나온 별개의 실험 논문이다.'
],

figures:[
 {f:'fig2-bias-charts.png',
  cap:'세로축은 부정/중립/긍정 비율. (1)행은 GPT-2, (2)행은 LM 1B, (3)행은 사람이 직접 라벨링한 샘플. (a)(c)열이 regard 점수, (b)(d)열이 sentiment 점수 — 같은 인구집단 쌍인데 (a)와 (b)의 막대 비율이 다른 것이 "감성과 regard가 다른 것을 잰다"는 핵심 증거.',
  src:'원문 Figure 2, p.5'}
],

quotes:[
 {t:'We introduce the notion of the regard towards a demographic, use the varying levels of regard towards different demographics as a defining metric for bias in NLG.',
  src:'Abstract, p.1'},
 {t:'These results indicate that by using sentiment analysis as the main metric to measure biases in NLG systems, we may be underestimating the magnitude of biases.',
  src:'Section 5, p.5'}
],

links:[
 {t:'arXiv 1909.01326 — The Woman Worked as a Babysitter', u:'https://arxiv.org/abs/1909.01326'},
 {t:'ACL Anthology (EMNLP 2019)', u:'https://aclanthology.org/D19-1339/'},
 {t:'GitHub — nlg-bias', u:'https://github.com/ewsheng/nlg-bias'}
]
});
