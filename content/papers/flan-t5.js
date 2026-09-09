WIKI.paper({
slug:'flan-t5',
venue:'arXiv 2022 (Google)',
authors:'Chung, Hou, Longpre, Zoph, Tay et al. (Google)',
arxiv:'2210.11416',

tldr:'지시 미세조정 과제 수를 **1,836개**로 늘리고, 그 안에 chain-of-thought(CoT) 주석 데이터를 섞어 넣으면 성능뿐 아니라 **추론 능력까지 함께 좋아진다**는 것을 보인 논문. 공개된 Flan-T5 체크포인트가 이후 몇 년간 연구용 기본 베이스라인이 되었다.',

context:'[FLAN](#/p/flan)과 T0가 지시문 형태로 여러 과제를 섞어 미세조정하면 미학습 과제로 일반화된다는 것을 보였지만, 과제 수는 수십~수백 개 수준에 머물렀다. 동시에 문제가 하나 있었다. 지시 미세조정 데이터는 대부분 "정답만 바로 내놓는" 형식인데, 이 형식으로만 학습하면 [CoT](#/p/cot) 프롬프팅으로 단계적 추론을 시켰을 때 오히려 성능이 떨어졌다. 지시를 따르는 능력과 추론하는 능력이 서로 상충하는 것처럼 보인 것이다. 이 논문은 두 축 — 과제 수 스케일링과 CoT 데이터 포함 — 을 동시에 밀어붙이면 이 상충이 사라지는지를 확인한다.',

ideas:[
 {h:'과제 수를 1,836개로: 네 개 기존 믹스처를 합친다',
  lead:'Muffin·T0-SF·NIV2·CoT 네 믹스처를 합쳐 473개 데이터셋 · 146개 과제 범주를 만든다.',
  d:'Muffin(80개 과제, Flan 원본 62개+신규 26개), T0-SF(193개, T0과 겹치지 않는 것만), NIV2(1,554개), 그리고 새로 만든 CoT 믹스처(9개)를 합쳐 총 1,836개 과제를 구성했다. 평가에 쓰는 [MMLU](#/p/mmlu) 관련 44개 과제는 학습셋에서 제거해 오염을 막았다.'},
 {h:'CoT 데이터 9개를 섞으면 추론 능력이 살아난다',
  lead:'사람이 직접 쓴 CoT 주석 9개 데이터셋을 학습에 넣으면 CoT 프롬프팅 성능이 오히려 오른다.',
  d:'산술 추론, 다중 홉 추론, 자연어 추론 과제에 사람이 직접 CoT 풀이를 써 넣은 9개 데이터셋을 만들어 학습 믹스처에 추가했다. 이 CoT 데이터를 빼고 지시 미세조정만 하면 CoT 프롬프팅 성능이 심하게 떨어지는데, 단 9개 데이터셋만 추가해도 이 저하가 사라지고 오히려 향상된다. 같은 체크포인트 하나로 CoT/비-CoT 양쪽 프롬프팅을 다 잘 받아낼 수 있다는 뜻이다.'},
 {h:'모델 크기 × 과제 수, 두 축의 스케일링',
  lead:'8B~540B 세 모델 크기에서 과제 수를 9→1,836개로 늘려가며 두 축을 함께 스케일한다.',
  d:'PaLM 8B·62B·540B 세 크기에 대해 과제 수를 9, 89, 282, 682, 1,836개로 늘려가며 held-out 벤치마크 평균을 측정했다. 두 축 모두 이득이 있지만 형태가 다르다 — 모델 크기는 꾸준히 이득을 주는 반면, 과제 수는 282개 근처에서 이득이 크게 꺾인다.'},
 {h:'제로샷·퓨샷·CoT 세 프롬프팅 모두에서 검증',
  lead:'MMLU·BBH·TyDiQA·MGSM 등 held-out 벤치마크를 직접 예측과 CoT 두 방식으로 모두 평가한다.',
  d:'단일 프롬프팅 방식에서만 좋아지는 것을 막기 위해 direct(정답 직접 예측)와 CoT(단계적 추론) 두 방식을 모두 평가에 포함했다. Flan-PaLM은 CoT에 self-consistency([Wang et al., 2022](#/p/cot))를 더해 5-shot MMLU에서 **75.2%**를 달성했다.'},
 {h:'Flan-T5: 작아도 강한 공개 체크포인트',
  lead:'80M~11B 크기의 T5를 같은 방식으로 미세조정해 공개한다.',
  d:'PaLM/U-PaLM은 공개되지 않았지만, [T5](#/p/t5)에 동일한 절차를 적용한 Flan-T5(80M~11B)는 그대로 공개했다. Flan-T5 11B는 원본 T5 11B를 두 자릿수 격차로 앞서고, 파라미터 수가 훨씬 큰 PaLM 62B의 BBH-direct 점수(37.5%)마저 43.7%로 앞섰다 — 미세조정 레시피가 크기 격차를 상당 부분 메꿀 수 있음을 보여준 사례다.'}
],

diagram:{type:'compare', cap:'같은 질문에 대해 CoT 없이 학습한 지시 데이터 vs CoT 주석을 섞은 지시 데이터의 형식 차이.',
 left:{t:'CoT 없는 지시 미세조정', items:['질문 → 정답만 바로 출력','CoT 프롬프팅 시 성능 오히려 하락','과제 수만 늘려도 추론력은 안 늘어남']},
 right:{t:'CoT 데이터 9개 포함', items:['질문 → 단계적 풀이 → 정답','CoT·비CoT 양쪽 프롬프팅 모두 향상','한 체크포인트로 두 모드 다 대응']}
},

math:[
 {expr:'정규화 평균 = mean(MMLU-direct, MMLU-CoT, BBH-direct, BBH-CoT, TyDiQA, MGSM)',
  tex:'\\overline{S}=\\tfrac{1}{6}\\left(S_{\\text{MMLU-direct}}+S_{\\text{MMLU-CoT}}+S_{\\text{BBH-direct}}+S_{\\text{BBH-CoT}}+S_{\\text{TyDiQA}}+S_{\\text{MGSM}}\\right)',
  d:'held-out 벤치마크 6개 지표를 평균 낸 단일 스칼라로 스케일링 곡선(그림 4)을 그렸다. 학습 데이터에 없는 과제들이라 미세조정 데이터로 직접 오염되지 않는다.'}
],

numbers:[
 {k:'미세조정 과제 수', v:'1,836개', d:'473개 데이터셋 · 146개 과제 범주를 네 믹스처(Muffin·T0-SF·NIV2·CoT)로 통합'},
 {k:'CoT 데이터셋', v:'9개', d:'사람이 직접 쓴 추론 풀이. 빠지면 CoT 프롬프팅 성능이 급락'},
 {k:'5-shot MMLU (CoT+SC)', v:'75.2%', d:'Flan-PaLM 540B, 당시 SOTA'},
 {k:'Flan-PaLM 540B 대 PaLM 540B', v:'+9.4%', d:'held-out 벤치마크 평균, 지시 미세조정만으로 얻은 이득'},
 {k:'미세조정 컴퓨트 비중', v:'0.2%', d:'PaLM 540B 사전학습 대비. 512개 v4 TPU로 37시간'},
 {k:'Flan-T5 크기', v:'80M~11B', d:'공개 체크포인트, T5 span-corruption 사전학습 위에 동일 레시피 적용'}
],

impact:'이 논문 이후 "일단 지시 미세조정은 기본으로 깐다"가 업계 표준이 됐다. 특히 CoT 데이터를 학습 믹스처에 섞는 관행은 이후 대부분의 지시 모델·정렬 파이프라인에 그대로 흡수됐다. Flan-T5 체크포인트는 라이선스가 열려 있어 RLHF 이전 단계의 베이스 모델, 임베딩 백본, 소형 실험용 모델로 지금까지도 널리 재사용된다.',

legacy:[
 '**CoT를 지시 데이터에 섞는 관행이 표준이 됨** — 이후 [InstructGPT](#/p/instructgpt) 계열 이후의 정렬 데이터 믹스처들이 대부분 이 구성을 따라감',
 '**Flan-T5가 연구용 기본 베이스가 됨** — 인코더-디코더가 필요한 요약·분류·검색 파이프라인에서 지금도 자주 쓰이는 체크포인트',
 '**"과제 수보다 다양성"이라는 교훈** — 282개를 넘기면 이득이 급격히 줄어든다는 관찰이, 이후 데이터 품질·다양성 중심 지시 데이터 연구([자기지시](#/p/self-instruct) 등)로 이어짐',
 '이 논문의 지시 미세조정은 여전히 지도학습(정답 모방)이라, 선호 기반 정렬인 [InstructGPT](#/p/instructgpt)·[anthropic-hh](#/p/anthropic-hh) 계열과는 다른 축의 개선으로 남는다'
],

pitfalls:[
 '**"과제 수를 늘리면 무조건 좋아진다"가 아니다.** 282개를 넘기면 이득이 크게 둔화된다 — 저자들도 다양성 부족 또는 "새 지식보다 표현 방식 학습"이라는 두 가설을 함께 제시했을 뿐, 정답을 내리지 않았다.',
 '**CoT 향상은 CoT 데이터를 넣었을 때의 이야기다.** 지시 미세조정 자체가 추론 능력을 만들어내는 게 아니라, 사전학습에서 이미 있던 추론 능력을 CoT 형식으로 "꺼내 쓰는 법"을 가르치는 것에 가깝다.',
 '**Flan-T5는 정렬(alignment) 모델이 아니다.** 유해 응답 억제나 선호 학습은 다루지 않으므로, 대화형 어시스턴트로 바로 배포하기보다 다운스트림 미세조정의 출발점으로 쓰는 것이 맞다.'
],

figures:[
 {f:'fig3-cot-format.png',
  cap:'왼쪽 두 칸은 CoT 없이 정답만 내놓는 형식, 오른쪽 두 칸은 "단계적으로 추론하라"는 지시와 함께 풀이 과정을 답으로 준 형식. 위/아래는 각각 exemplar(few-shot 예시) 없음/있음 조합 — 네 조합을 모두 학습에 섞는다.',
  src:'원문 Figure 3, p.4'},
 {f:'fig4-scaling.png',
  cap:'왼쪽: 모델 크기(x축, 로그)를 키울수록 held-out 벤치마크 평균(y축)이 오르고, 과제 수(선 색)가 많을수록 더 높은 선에 위치한다. 오른쪽: 같은 540B/62B/8B 모델에서 과제 수(x축, 로그)를 늘렸을 때 곡선이 282개 근처부터 눕기 시작하는 지점을 본다.',
  src:'원문 Figure 4, p.6'}
],

quotes:[
 {t:'Flan-PaLM 540B instruction-finetuned on 1.8K tasks outperforms PaLM 540B by a large margin (+9.4% on average).',
  src:'Abstract, p.1'},
 {t:'We also publicly release Flan-T5 checkpoints, which achieve strong few-shot performance even compared to much larger models, such as PaLM 62B.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2210.11416 — Scaling Instruction-Finetuned Language Models', u:'https://arxiv.org/abs/2210.11416'},
 {t:'Flan-T5 checkpoints (google-research/t5x)', u:'https://github.com/google-research/t5x/blob/main/docs/models.md#flan-t5-checkpoints'}
]
});
