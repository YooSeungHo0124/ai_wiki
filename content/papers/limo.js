WIKI.paper({
slug:'limo',
venue:'COLM 2025',
authors:'Ye, Huang, Xiao, Chern, Xia, Liu (Shanghai Jiao Tong University · SII-GAIR)',
arxiv:'2502.03387',

tldr:'복잡한 수학 추론에 수만~수십만 개의 학습 데이터가 필요하다는 통념을 반박하고, 엄선한 **800개** 예시만으로 SFT해도 AIME24 63.3%·MATH500 95.6%에 도달한다는 것을 보인 논문. [s1](#/p/s1-simple)과 같은 시기·같은 결론에 도달한 독립 연구다.',

context:'추론 능력을 끌어내려면 대규모 CoT 데이터가 필요하다는 것이 당시 지배적 가정이었다 — 비교 대상인 NuminaMath 계열은 **10만 개** 샘플을 쓴다. 이 논문은 그 가정을 정면으로 뒤집는다. 근거는 두 가지 변화다. 첫째, Llama 2(1.8T 토큰)에서 Llama 3(3.7T 토큰)로 오면서 현대 LLM은 이미 사전학습 단계에서 방대한 수학 지식을 흡수했다. 둘째, [test-time-scaling](#/p/test-time-scaling)류 연구가 보여준 것처럼 긴 추론 사슬이 성능을 크게 끌어올린다. 두 조건이 갖춰졌다면, 남은 문제는 "지식을 새로 넣는 것"이 아니라 "이미 있는 지식을 **어떻게 꺼내 쓰게 할지 보여주는 것**"일 수 있다.',

ideas:[
 {h:'LIMO 가설: 지식은 이미 있고, 필요한 건 인지 템플릿',
  lead:'사전학습에 지식이 충분하면, 추론 능력은 소수의 "인지 과정 시범"만으로 끌어낼 수 있다.',
  d:'저자들은 추론 능력을 끌어내는 데 필요한 데이터량의 하한이 과제의 복잡도가 아니라 (1) 모델 파라미터 안에 이미 있는 사전지식의 완결성과 (2) 소수 예시가 문제 해결 과정을 얼마나 효과적인 "인지 템플릿"으로 보여주는가에 의해 결정된다고 주장한다. 이것이 이름의 유래인 Less-Is-More Reasoning(LIMO) 가설이다.'},
 {h:'800개로 줄이는 다단계 큐레이션',
  lead:'거친 난이도 필터 → 정밀 난이도 평가 → 지식 다양화 → 추론 사슬 품질 필터를 순서대로 거친다.',
  d:'큰 QA 풀에서 시작해 먼저 지나치게 쉬운 문제를 거르고(coarse filtering), 남은 문제의 난이도를 정밀 평가하고, 지식 포인트가 겹치지 않도록 다양성을 맞춘 뒤, 추론 사슬을 논리적 일관성·단계별 명확성·정답 정확도 기준으로 필터링해 최종 **800개**를 남긴다. 추론 사슬은 [DeepSeek-R1](#/p/deepseek-r1), DeepSeek-R1-Distill-Qwen-32B, QwQ-32B 등 여러 강한 추론 모델에서 샘플링해 만들었다.'},
 {h:'같은 백본, 100배 적은 데이터로 뒤집는다',
  lead:'NuminaMath(10만 개)와 완전히 같은 Qwen2.5-32B-Instruct 백본에서 800개로 더 높은 정확도를 낸다.',
  d:'NuminaMath로 파인튜닝한 모델은 AIME24에서 6.5%에 그치지만, 같은 백본을 LIMO 800개로 파인튜닝하면 63.3%에 도달한다 — 데이터는 1%인데 정확도는 절대값으로 훨씬 높다(논문은 이를 "874% 상대 개선"으로 표현한다). 이는 데이터의 **양**이 아니라 **질과 인지 템플릿으로서의 적합성**이 관건이라는 주장의 핵심 증거다.'},
 {h:'분포 밖 일반화: 수학 밖으로도 퍼진다',
  lead:'수학으로만 학습했는데 GPQA(과학)·중국 고사(Gaokao) 등 out-of-domain에서도 큰 폭으로 개선된다.',
  d:'AIME24·MATH500 같은 in-domain 벤치마크뿐 아니라 GPQA, Gaokao, Kaoyan(중국 대학원 입시), MinervaMath 등 분포 밖 벤치마크에서도 전 벤치마크 평균 **45.8%p 절대 개선**을 보인다. 이는 학습한 것이 특정 문제 유형이 아니라 "길게 검증하며 사고하는 방식" 자체라는 해석을 뒷받침한다.'},
 {h:'난이도 구성 자체가 성능을 좌우한다는 ablation',
  lead:'문제 선택만 바꿔도(같은 개수) AIME24가 16%p 오른다 — 양이 아니라 구성이 원인임을 분리해서 보인다.',
  d:'MATH 난이도별로 Simple-500·Complex-500·Advanced-500(AIME급) 세 세트를 만들어 같은 개수로 비교하면, 어려운 문제로만 구성한 Advanced-500이 AIME24를 51.5%까지 끌어올리고 MATH500에서도 도메인 내 학습 데이터가 전혀 없는데 91.2%에 도달한다. 데이터 개수가 아니라 **난이도 구성**이 원인 변수임을 분리해서 보여주는 실험이다.'}
],

diagram:{type:'compare', cap:'같은 백본(Qwen2.5-32B-Instruct)에 데이터 양만 다르게 SFT한 두 모델의 비교.',
 left:{t:'NuminaMath', items:['~100,000개 샘플','AIME24 6.5%','양으로 승부']},
 right:{t:'LIMO (Ours)', items:['800개 큐레이션 샘플','AIME24 63.3%','질·인지템플릿으로 승부'], acc:true}},

math:[],

numbers:[
 {k:'학습 데이터', v:'800개', d:'다단계 큐레이션(난이도·다양성·품질)을 거쳐 최종 선정된 SFT 샘플 수'},
 {k:'AIME24 (pass@1)', v:'63.3%', d:'LIMO, zero-shot CoT — QwQ-32B-Preview(50.0%)·OpenAI o1-preview(44.6%)를 능가'},
 {k:'MATH500 (pass@1)', v:'95.6%', d:'LIMO — QwQ-32B-Preview(89.8%)·o1-preview(85.5%)보다 높음'},
 {k:'GPQA (pass@1)', v:'70.7%', d:'분포 밖 벤치마크. o1-preview(73.3%)에 근접'},
 {k:'비교 기준선', v:'NuminaMath 6.5% (AIME24)', d:'같은 Qwen2.5-32B-Instruct 백본, 약 100배 많은 데이터로 SFT'},
 {k:'분포 밖 평균 개선', v:'+45.8%p', d:'다양한 벤치마크 평균에서 100배 많은 데이터로 학습한 모델 대비 절대 개선폭'}
],

impact:'[s1](#/p/s1-simple)과 거의 동시에, 서로 독립적으로 "추론 능력을 끌어내는 데는 소량의 고품질 데이터면 충분하다"는 같은 결론에 도달했다. 두 논문 모두 대규모 RL(예: [DeepSeek-R1](#/p/deepseek-r1))이 유일한 길이 아님을 보였고, "능력은 사전학습에 이미 있고 후처리는 그것을 꺼내는 열쇠일 뿐"이라는 관점을 데이터 큐레이션 쪽에서 뒷받침했다. 다만 LIMO는 budget forcing 같은 추론 시점 개입 없이 **순수하게 SFT 데이터 구성**만으로 이 결과를 낸다는 점에서 s1과 결이 다르다.',

legacy:[
 '[s1](#/p/s1-simple)과 함께 "적은 데이터로 추론 유도"라는 2025년 초 흐름을 이룸 — 접근은 다르지만(LIMO는 순수 SFT 데이터 큐레이션, s1은 데이터+추론 시점 개입) 결론은 같음',
 '난이도 구성이 성능을 좌우한다는 ablation 결과가 이후 추론 데이터셋 구축 연구에서 "양보다 난이도 분포"를 우선하는 근거로 자주 인용됨',
 '분포 밖 일반화 결과가 "추론 사슬 학습이 특정 도메인 지식이 아니라 사고 방식 자체를 전이시킨다"는 해석에 실증적 근거를 더함'
],

pitfalls:[
 '**"데이터가 적어도 된다"가 아니라 "적어도 되는 조건이 있다"는 논문이다.** 이미 강한 사전학습(Qwen2.5-32B-Instruct)과, 그 지식을 꺼내는 데 적합한 추론 사슬 품질이 전제 조건이다 — 지식이 부족한 베이스 모델에 그대로 적용된다는 보장은 없다.',
 '벤치마크 수치는 전부 pass@1이지만 평가 방식이 두 갈래다: 큰 벤치마크(MATH500 등)는 1회 생성, 작은 벤치마크(AIME24·AMC23 등)는 온도 0.6에서 4회 샘플링한 unbiased pass@1이다. 조건이 다른 수치를 그대로 비교하면 안 된다.',
 '"874% 개선"은 상대 개선률(6.5%→63.3%)이라는 표현 방식일 뿐이며, 절대 정확도 차이(약 57%p)로 이해하는 것이 더 정확하다.'
],

figures:[
 {f:'fig1-less-is-more.png',
  cap:'왼쪽 막대그래프: x축은 NuminaMath(약 10만 샘플) vs LIMO(800 샘플), y축은 AIME24 정확도. 데이터가 1%로 줄었는데 정확도 막대는 6.5%에서 63.3%로 오히려 크게 높아진다 — 같은 백본이라는 전제가 이 비교의 핵심.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'We propose the Less-Is-More Reasoning Hypothesis (LIMO Hypothesis): In foundation models where domain knowledge has been comprehensively encoded during pre-training, sophisticated reasoning can emerge through minimal but strategically designed demonstrations of cognitive processes.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2502.03387', u:'https://arxiv.org/abs/2502.03387'},
 {t:'GitHub — GAIR-NLP/LIMO', u:'https://github.com/GAIR-NLP/LIMO'}
]
});
