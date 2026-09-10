WIKI.paper({
slug:'mmlu-pro',
venue:'NeurIPS 2024 (Datasets and Benchmarks Track)',
authors:'Wang et al. (U. Waterloo · U. Toronto · CMU)',
arxiv:'2406.01574',

tldr:'[MMLU](#/p/mmlu)가 포화되고 잡음이 많고 프롬프트에 민감해진 문제를 선택지를 4개에서 10개로 늘리고 추론 중심 문항으로 재구성해 고친 벤치마크. 흥미롭게도 MMLU에서는 CoT가 별 도움이 안 됐던 것과 반대로, MMLU-Pro에서는 **CoT가 성능을 크게 끌어올린다**.',

context:'MMLU는 57개 과목을 아우르는 사실상의 표준 LLM 평가였지만, 2024년 무렵 [GPT-4](#/p/gpt4)가 86.4%를 찍은 뒤 GPT-4-Turbo·Gemini-1.5-Pro·Claude·Llama-3-400B가 전부 86~87%에 몰려 모델 간 변별력을 잃었다. 원인은 세 가지로 지목됐다 — (1) 선택지가 3개뿐인 오답이라 추측으로 뚫기 쉽고, (2) 문항 대부분이 지식 암기형이라 추론 없이 direct answering이 CoT보다 오히려 나은 경우가 많으며, (3) 정답이 잘못 라벨링되거나 답이 여러 개인 잡음 문항이 섞여 있다. `[GPQA](#/p/gpqa)`가 전문가 작성으로 난이도를 올렸다면, 이 논문은 기존 MMLU 문항을 확장·재검증하는 쪽을 택했다.',

ideas:[
 {h:'선택지 4개 → 10개로 확장 (Option Augmentation)',
  lead:'GPT-4-Turbo로 오답 보기를 6개 더 만들어 추측으로 맞힐 확률을 60%p 낮춘다.',
  d:'기존 4지선다에 GPT-4-Turbo가 그럴듯한 오답 6개를 추가로 생성해 10지선다로 만든다. 무작위 추측 정답률이 25%에서 10%로 떨어져, 얕은 패턴 매칭이나 소거법만으로 정답을 맞히는 지름길이 크게 줄어든다.'},
 {h:'추론 중심 문항으로 재구성하고 잡음을 제거',
  lead:'STEM Website·TheoremQA 등에서 추론이 필요한 문항을 추가하고 전문가 2단계 검토로 오류를 걸러냈다.',
  d:'단순 지식 암기형 문항 비중을 줄이고, 수학·공학처럼 다단계 추론이 필요한 과목의 문항을 STEM Website·TheoremQA 등에서 가져와 4지선다로 만든 뒤 10지선다로 확장했다. 1차로 전문가가 검증하고, 2차로 SOTA LLM이 잡아낸 잠재 오류를 사람이 다시 확인하는 이중 검증을 거쳤다. 14개 분야·12,000여 문항 규모다.'},
 {h:'CoT가 MMLU-Pro에서는 정반대로 작동한다',
  lead:'GPT-4o 기준 CoT가 MMLU에서는 +1.5%p, MMLU-Pro에서는 +19.1%p를 끌어올린다.',
  d:'원문 Table 3 기준 GPT-4-Turbo는 MMLU에서 CoT를 쓰면 오히려 -0.2%p 손해를 보지만, MMLU-Pro에서는 +15.3%p 이득을 본다. Llama-3-8B·Gemma-7B 같은 작은 모델은 MMLU에서 CoT가 -3.9%p·-3.6%p로 **해롭기까지** 한데, MMLU-Pro에서는 +3.9%p·+6.7%p로 뒤집힌다. 이는 MMLU-Pro의 문항이 실제로 다단계 추론을 요구하도록 설계됐음을 보여주는 직접적인 증거다.'},
 {h:'프롬프트 민감도(robustness)를 24개 프롬프트로 측정',
  lead:'같은 모델에 24가지 다른 프롬프트 스타일을 줘서 점수가 얼마나 흔들리는지 표준편차로 비교한다.',
  d:'MMLU에서는 프롬프트를 바꾸면 점수가 4~5%p씩 출렁였지만, MMLU-Pro에서는 그 편차가 약 2%p로 줄었다. 선택지가 많아지고 추론 중심으로 바뀌면서 모델이 우연한 프롬프트 패턴에 덜 기댄다는 뜻이다.'}
],

diagram:{type:'compare', cap:'MMLU와 MMLU-Pro의 설계 차이. 오른쪽으로 갈수록 추측·잡음에 덜 취약해진다.',
 left:{t:'MMLU', items:['4지선다·추측 25%','지식 암기 중심 문항','CoT가 오히려 손해인 경우 많음','프롬프트 편차 4~5%p']},
 right:{t:'MMLU-Pro', items:['10지선다·추측 10%','다단계 추론 문항 강화','CoT가 최대 +19%p 개선','프롬프트 편차 약 2%p']}
},

numbers:[
 {k:'규모', v:'14개 분야 · 12,000여 문항', d:'10지선다로 통일'},
 {k:'MMLU 대비 정확도 하락', v:'16~33%p', d:'같은 모델이 MMLU-Pro에서 훨씬 낮은 점수'},
 {k:'GPT-4o (CoT)', v:'72.6%', d:'MMLU 88.7%(CoT) 대비 개선 여지 27.4%p 확보'},
 {k:'GPT-4o: CoT − Direct', v:'+19.1%p', d:'MMLU에서는 +1.5%p에 불과'},
 {k:'GPT-4-Turbo: CoT − Direct', v:'+15.3%p (MMLU-Pro) vs −0.2%p (MMLU)', d:'MMLU에서는 CoT가 오히려 손해'},
 {k:'프롬프트 민감도', v:'약 2% (MMLU-Pro) vs 4~5% (MMLU)', d:'24개 프롬프트 스타일로 측정'}
],

impact:'MMLU-Pro는 발표 직후 여러 모델 카드에서 [MMLU](#/p/mmlu)를 보완·대체하는 표준 리포팅 항목이 됐다. "선택지를 늘리고 추론 문항 비중을 올리면 CoT 효과가 되살아난다"는 관찰은, 벤치마크가 포화됐을 때 그 원인이 모델의 한계가 아니라 **문항 설계의 한계**일 수 있음을 보여준 사례로 자주 인용된다. [GPQA](#/p/gpqa)와 함께 "지식형 벤치마크에서 추론형 벤치마크로" 넘어가는 흐름을 대표한다.',

legacy:[
 '**모델 카드의 표준 항목화** — GPT, Claude, Gemini, Llama 계열 발표에서 MMLU-Pro가 MMLU와 나란히 보고됨',
 '**포화 문제의 재발** — 이후 최상위 모델들이 다시 MMLU-Pro에서도 80%대에 근접하면서, 같은 문제의식이 [LiveCodeBench](#/p/livecodebench)류의 "시간 태깅" 접근으로 이어짐',
 '**옵션 증강(4→10) 기법의 확산** — 선택지를 LLM으로 늘려 추측 확률을 낮추는 기법이 이후 다른 객관식 벤치마크 재구성에도 쓰임'
],

pitfalls:[
 '**"MMLU-Pro가 항상 더 어렵다"는 표면적 이해로 끝내면 안 된다.** 핵심은 난이도 자체보다, CoT 효과가 뒤집히는 데서 보이듯 **문항이 실제로 추론을 요구하는가**라는 설계 문제다.',
 '**옵션을 GPT-4-Turbo로 증강했다는 점이 순환 의존을 만들 수 있다.** 오답 보기 자체가 특정 LLM의 "그럴듯함" 판단에서 나왔다는 한계가 있다.',
 '**16~33%p 하락 폭을 모델 능력 저하로 오해하면 안 된다.** 같은 모델의 절대적 지식은 그대로이고, 추측으로 뚫리던 문항이 줄었을 뿐이다.'
],

figures:[
 {f:'fig1-mmlu-vs-pro.png',
  cap:'왼쪽 막대그래프: 같은 모델이 MMLU(주황)보다 MMLU-Pro(파랑)에서 훨씬 낮은 점수를 받는다. 가운데 분포도: 24개 프롬프트로 잰 점수의 봉우리가 MMLU-Pro(초록)에서 더 뾰족하고 좁다 — 프롬프트를 바꿔도 점수가 덜 흔들린다는 뜻. 오른쪽 막대: 모델별로 CoT(파랑)와 Direct Answer(주황)를 비교했을 때 MMLU-Pro 쪽 막대 쌍의 격차가 더 크다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'we found that models utilizing Chain of Thought (CoT) reasoning achieved better performance on MMLU-Pro',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2406.01574 — MMLU-Pro', u:'https://arxiv.org/abs/2406.01574'},
 {t:'MMLU-Pro Hugging Face 리더보드', u:'https://huggingface.co/spaces/TIGER-Lab/MMLU-Pro'}
]
});
