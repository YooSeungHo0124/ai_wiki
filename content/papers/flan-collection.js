WIKI.paper({
slug:'flan-collection',
venue:'arXiv 2023 (Google Research)',
authors:'Longpre, Hou, Vu, Webson, Chung, Tay, Zhou, Le, Zoph, Wei, Roberts (Google Research)',
arxiv:'2301.13688',

tldr:'[FLAN](#/p/flan) 2022 모델이 왜 잘 되는지 **데이터 구성 방법을 하나씩 떼어내며 통제 실험**한 논문. 과제 수를 늘리는 것 자체보다 프롬프트 혼합·입력 반전·데이터 소스 균형 같은 "만드는 방식"이 성능을 좌우한다는 것을 수치로 보였다.',

context:'[Super-NaturalInstructions](#/p/super-natural-instructions)와 [T0](#/p/t0) 이후 공개된 지시학습 컬렉션은 저마다 과제 수·템플릿·학습 방식이 달라서, 어느 컬렉션이 왜 더 나은지 원인을 분리해 말하기 어려웠다. Chung et al.(2022)의 [FLAN](#/p/flan) 2022(Flan-PaLM)는 강한 결과를 보였지만 [PaLM](#/p/palm) 540B라는 초대형 모델과 결합된 결과라 어떤 설계 요소가 실제로 기여했는지 불분명했다. 이 논문은 모델 크기와 체크포인트를 고정(T5-XL, 3B)한 채 Flan 2022 컬렉션의 개별 설계 요소를 하나씩 제거하며 기여도를 분리한다.',

ideas:[
 {h:'zero-shot과 few-shot 템플릿을 섞어서 함께 학습',
  lead:'학습 프롬프트에 few-shot 템플릿을 단 5%만 섞어도 zero-shot 성능이 크게 오른다.',
  d:'기존 관행은 zero-shot용 모델과 few-shot용 모델을 따로 만들거나 한 형식만으로 학습하는 것이었다. 이 논문은 zero-shot·few-shot·[chain-of-thought](#/p/cot) 템플릿을 **한 학습에 함께 섞으면** 세 설정 모두에서 성능이 오른다는 것을 보였다. few-shot 템플릿을 단 5%만 섞어도 zero-shot 성능이 크게 개선되고, zero-shot 데이터를 10% 이상 섞으면 few-shot 성능도 함께 오른다.'},
 {h:'입력-출력 반전(input inversion)으로 과제 다양성 인위 증대',
  lead:'질문→답 과제의 입력·출력을 뒤집어 답→질문 과제를 추가로 만들어낸다.',
  d:'"질문 $x$ 를 보고 답 $y$ 를 맞히는" 지도학습 과제를 뒤집어 "답 $y$ 를 보고 질문 $x$ 를 생성"하게 만드는 것이 input inversion이다. [T0](#/p/t0)와 [Super-NaturalInstructions](#/p/super-natural-instructions)도 이미 일부 쓰던 기법인데, 이 논문은 나머지 데이터셋에도 적용해 30% 비율로 섞었다. Held-In 성능에는 도움이 안 되지만 **Held-Out([MMLU](#/p/mmlu)·BBH) 성능에는 크게 기여**한다는 것을 처음 분리해서 보였다.'},
 {h:'데이터 소스 균형(mixture weight balancing)',
  lead:'Flan2021·T0-SF·SNI·CoT·Dialog 등 소스별 비중을 실측으로 조정한다.',
  d:'과제 수를 1,800여 개로 늘리는 것뿐 아니라, 어느 데이터 소스(Flan 2021, T0-SF, Super-Natural Instructions, Chain-of-Thought, Dialog, Program Synthesis)를 얼마나 섞을지의 **혼합 비율**이 성능에 큰 영향을 준다. 소스 하나씩 제외해 가며 최적 비중을 실측했고, 이 조정이 네 가지 요소 중 가장 폭넓게(Held-In·Held-Out·CoT 전부) 기여했다.'},
 {h:'Flan-T5는 단일 과제 파인튜닝의 더 나은 출발점',
  lead:'Flan-T5는 같은 하위 과제를 파인튜닝할 때 T5보다 더 빠르고 더 높게 수렴한다.',
  d:'5개의 held-out 과제에 대해 단일 과제 파인튜닝을 돌려보면, [Flan-T5](#/p/flan-t5)는 [T5](#/p/t5)보다 학습 초반부터 더 높은 정확도에서 시작해 더 빠르게, 더 높은 지점으로 수렴한다. 지시학습이 단지 zero/few-shot 능력만이 아니라 **다운스트림 파인튜닝의 계산 효율적인 출발 체크포인트**로도 유용함을 보여준다.'}
],

diagram:{type:'compare', cap:'Flan 2022 레시피에서 네 요소를 하나씩 빼봤을 때(Table 1 ablation) 어디에 타격이 가는지.',
 left:{t:'Held-In (학습에 포함된 과제)', items:['Mixture Balancing 제거 시 가장 큰 하락','CoT·Few-shot 템플릿 제거는 영향 작음']},
 right:{t:'Held-Out (MMLU/BBH)', items:['Input Inversion 제거 시 크게 하락','Mixture Balancing 제거도 크게 하락'], acc:true}},

math:[],

numbers:[
 {k:'held-out 개선폭', v:'MMLU +4.2 · BBH +8.5', d:'동일 크기(T5-XL, 3B) 최고 비교 컬렉션 대비. Figure 1, zero-shot 기준'},
 {k:'few-shot MMLU 개선폭', v:'+17.6', d:'같은 비교에서 가장 큰 격차를 보인 평가축'},
 {k:'전체 개선폭', v:'held-out 과제 기준 3–17%+', d:'기존 공개 지시학습 컬렉션(Flan 2021·P3++·SNI·OPT-IML) 대비'},
 {k:'few-shot 템플릿 혼합 효과', v:'few-shot 10%↑ → zero-shot +2%↑', d:'zero-shot 프롬프트만으로 학습한 모델 대비'},
 {k:'실험 고정 모델 크기', v:'T5-XL (3B)', d:'전 실험에서 모델 크기·체크포인트를 통제 변수로 고정'}
],

impact:'"더 많은 과제를 모으면 지시학습이 좋아진다"는 [Super-NaturalInstructions](#/p/super-natural-instructions)식 스케일링 서사에 **"어떻게 섞느냐가 똑같이 중요하다"**는 축을 더했다. 프롬프트 형식 혼합·입력 반전·소스 균형이라는 세 가지 구체적 레버를 수치로 분리해 제시하면서, 이후 지시학습 데이터셋 설계는 "얼마나 많이"뿐 아니라 "어떤 비율로"를 실험하는 것이 표준이 됐다. Flan 2022 데이터 생성 코드를 공개해 재현 가능한 기준점도 남겼다.',

legacy:[
 '**[instruction tuning](#/p/flan) 레시피의 재료비 실험** — 이후 공개 지시학습 컬렉션들이 이 논문의 ablation 축(프롬프트 혼합·입력 반전·소스 균형)을 표준 체크리스트처럼 인용',
 '**Flan-T5 체크포인트의 확산** — 계산 효율적 출발점이라는 결과가 이후 여러 다운스트림 파인튜닝 연구에서 T5 대신 Flan-T5를 기본값으로 쓰게 만든 근거가 됨',
 '**OPT-IML 등 동시기 연구와의 대조 기준** — Table 1의 OPT-IML-Max 비교치가 이후 컬렉션 비교의 참조점으로 남음',
 '**데이터 증강의 재평가** — "사전학습이 길어질수록 데이터 증강 효과가 줄어든다"던 이전 결과(Longpre et al., 2020)와 달리, 지시학습 단계에서는 입력 반전 같은 증강이 여전히 크게 유효함을 재확인'
],

pitfalls:[
 '**Flan 2022 자체를 처음 제안한 논문이 아니다.** Flan 2022 컬렉션과 Flan-PaLM은 Chung et al.(2022)의 [FLAN](#/p/flan) 논문에서 먼저 나왔다. 이 논문은 그 방법론을 사후에 해부한 분석 논문이다.',
 '**모든 ablation은 T5-XL(3B) 기준이다.** 논문이 보고하는 절대 성능(예: Held-In 73.8)은 이 규모에서의 수치이며, 더 큰 모델에서 같은 격차가 그대로 유지된다는 보장은 논문이 직접 주장하지 않는다.',
 '**input inversion은 Held-In에는 오히려 도움이 안 된다.** "더 다양하게 만들면 다 좋아진다"가 아니라 Held-Out에만 강하게 기여하므로, 평가 축을 구분하지 않고 일반화하면 안 된다.'
],

figures:[
 {f:'fig1-comparison.png',
  cap:'같은 크기(T5-XL, 3B)의 모델을 서로 다른 공개 지시학습 컬렉션으로 학습했을 때의 평가 축별 비교. 초록 숫자가 Flan 2022(진한 파랑)와 그 다음으로 좋은 컬렉션의 격차다. Few-Shot MMLU에서 격차(+17.6)가 가장 크다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'We find task balancing and enrichment techniques are overlooked but critical to effective instruction tuning.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2301.13688 — The Flan Collection', u:'https://arxiv.org/abs/2301.13688'},
 {t:'Flan 2022 데이터 생성 코드 (GitHub)', u:'https://github.com/google-research/FLAN/tree/main/flan/v2'}
]
});
