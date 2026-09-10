WIKI.paper({
slug:'rlaif',
venue:'ICML 2024',
authors:'Lee et al. (Google Research)',
arxiv:'2309.00267',

tldr:'사람이 매기는 선호 라벨을 **off-the-shelf LLM(PaLM 2)이 매긴 라벨**로 통째로 바꿔 RLHF 파이프라인을 그대로 돌려도, 사람 라벨로 돌린 RLHF와 **동등한 성능**이 나온다는 것을 요약·대화 세 과제에서 확인한 비교 연구다. "AI 피드백이 더 낫다"가 아니라 "구분이 안 될 만큼 비슷하다"는 결론이다.',

context:'[InstructGPT](#/p/instructgpt) 이후 RLHF는 정렬의 표준이 됐지만, 병목은 언제나 **사람 선호 라벨의 비용과 속도**였다 — 수만 건의 쌍을 사람이 일일이 비교해야 보상 모델을 학습시킬 수 있다. [Constitutional AI](#/p/constitutional)는 AI가 매긴 선호(RLAIF)로 무해성을 학습시켜 SFT보다 낫다는 것을 보였지만, **같은 조건에서 사람 피드백(RLHF)과 직접 맞대결시킨 적은 없었다**. 그래서 "RLAIF가 RLHF의 실질적 대안이 될 수 있는가"라는 질문 자체가 열려 있었다. 이 논문은 그 맞대결을 요약·유용한 대화·무해한 대화 세 과제에서 통제된 조건으로 수행한다.',

ideas:[
 {h:'AI 라벨러로 RM을 학습시켜 RLHF와 같은 파이프라인을 돈다',
  lead:'사람 대신 off-the-shelf LLM이 두 응답 중 하나를 고르게 해 보상 모델을 학습시킨다.',
  d:'RLHF와 RLAIF는 오직 **선호 라벨의 출처**만 다르고 나머지 파이프라인(보상 모델 학습 → PPO)은 동일하다. AI 라벨러에게는 응답 쌍과 함께 "어느 쪽이 더 나은가"를 판단하는 프롬프트를 주고, 1~10점 각 토큰의 확률을 가중합해 소프트 선호 분포를 얻는다. 이 라벨로 훈련한 RM이 정책을 PPO로 최적화하는 구조는 [InstructGPT](#/p/instructgpt)와 같다.'},
 {h:'CoT 프롬프팅이 AI 라벨의 사람 정합성을 끌어올린다',
  lead:'AI 라벨러에게 근거를 먼저 쓰게 하면 사람 선호와의 일치도가 일관되게 오른다.',
  d:'AI 라벨러의 판단 품질(사람 라벨과 얼마나 일치하는가, AI Labeler Alignment)을 끌어올리는 프롬프트 기법을 비교했다. **chain-of-thought로 먼저 이유를 쓰게 한 뒤 선택하게 하는 것**이 모든 과제에서 일관되게 정합성을 높였고, 상세한 서문·few-shot 예시는 과제에 따라서만 도움이 됐다.'},
 {h:'direct-RLAIF: 보상 모델 자체를 건너뛴다',
  lead:'RM을 학습하지 않고 LLM이 매긴 1~10점을 RL 보상으로 그대로 쓴다.',
  d:'canonical RLAIF는 AI 라벨로 RM을 학습시킨 뒤 그 RM으로 RL을 돈다. 문제는 정책이 학습되며 생성 분포가 바뀌면 RM이 초기 분포에 갇혀 "낡는다"(stale)는 것이다. d-RLAIF는 매 RL 스텝마다 off-the-shelf LLM에게 직접 1~10점을 매기게 해 그 점수를 보상으로 쓴다. RM 학습 단계 자체가 없어져 canonical RLAIF보다도 나은 성능을 냈다.'},
 {h:'라벨러가 정책과 같은 크기여도, 심지어 같은 체크포인트여도 개선이 남는다',
  lead:'AI 라벨러가 정책보다 크지 않아도 SFT 대비 유의미하게 개선된다.',
  d:'기본 실험은 큰 라벨러(PaLM 2 L)로 작은 정책(PaLM 2 XS)을 가르치는 구도였다. 라벨러를 정책과 **같은 크기**로 낮춰도(same-size RLAIF) SFT 대비 68% 승률로 여전히 크게 개선됐고, 요약 과제에서는 라벨러와 초기 정책이 **정확히 같은 체크포인트**인 실험도 별도로 수행해 엄밀한 self-improvement 사례를 보였다.'}
],

diagram:{type:'compare', cap:'RLAIF는 RLHF에서 "누가 선호를 매기는가"만 사람에서 LLM으로 바꾼다. 나머지 RM 학습·RL 단계는 동일하다.',
 left:{t:'RLHF', items:['사람이 응답 쌍 중 하나를 평가','평가 비용·시간이 병목','RM 학습 → PPO']},
 right:{t:'RLAIF', items:['off-the-shelf LLM이 평가','10배 이상 저렴·즉시 확장','같은 RM 학습 → PPO', 'd-RLAIF는 RM도 생략'],}
},

math:[
 {expr:'s(y|x) = Σ_{i=1..10} i · P(i|y,x)',
  tex:'s(y|x)=\\sum_{i=1}^{10} i \\cdot P(i \\mid y, x)',
  d:'d-RLAIF에서 "1~10점으로 평가하라"는 프롬프트를 준 뒤, 각 점수 토큰이 나올 확률로 가중합해 하나의 스칼라 점수를 만든다. 이 값을 $[-1,1]$로 정규화해 RL 보상으로 바로 쓴다 — RM 학습이 필요 없다.'},
 {expr:'z_acc = (1/D) Σ 1[argmax_j P^AI_{i,j} = p^H_i]',
  tex:'z_{acc}=\\frac{1}{D}\\sum_{i=1}^{D}\\mathbb{1}\\!\\left[\\arg\\max_j P^{AI}_{i,j} = p^{H}_i\\right]',
  d:'AI Labeler Alignment — AI가 매긴 소프트 선호를 이진화해 사람 라벨과 일치하는 비율을 잰다. 이 값이 높을수록 AI 라벨이 사람을 잘 대신한다는 뜻이다.'}
],

numbers:[
 {k:'RLAIF vs SFT · 요약', v:'71% 승률', d:'RLHF vs SFT는 73% — 통계적으로 유의한 차이 없음'},
 {k:'RLAIF vs RLHF · 요약', v:'50% 승률', d:'헤드투헤드에서 정확히 동률 — "동등하게 선호됨"'},
 {k:'무해성(harmless rate)', v:'RLAIF 88% · RLHF 76% · SFT 64%', d:'세 과제 중 유일하게 RLAIF가 RLHF를 앞선 지표'},
 {k:'라벨링 비용', v:'사람 대비 10배 이상 저렴', d:'AI 라벨러 사용의 핵심 실익 중 하나'},
 {k:'same-size RLAIF vs SFT', v:'68% 승률', d:'라벨러가 정책과 같은 크기(PaLM 2 XS)여도 개선 유지'},
 {k:'d-RLAIF vs same-size RLAIF', v:'60% 승률', d:'RM을 생략한 direct 방식이 canonical RLAIF보다 우세'}
],

impact:'RLHF의 병목이던 **사람 라벨 수집을 LLM 호출로 대체할 수 있다**는 것을 InstructGPT식 파이프라인 그대로 검증한 첫 통제 비교였다. 이후 정렬 연구에서 "사람 선호 데이터가 없거나 비쌀 때 AI 피드백으로 대체한다"는 선택지가 [DPO](#/p/dpo) 계열 방법들의 선호 데이터 생성 단계에도 널리 쓰이는 표준 관행이 됐다. d-RLAIF는 보상 모델이라는 중간 단계 자체를 없앨 수 있다는 것을 보여, 이후 LLM-as-judge를 보상으로 직접 쓰는 흐름과 맞닿는다.',

legacy:[
 '**LLM-as-judge 정렬 파이프라인의 근거** — 이후 다수의 선호 데이터셋(UltraFeedback 등)이 사람 대신 GPT-4급 모델의 판정으로 구축되는 관행의 실증적 뒷받침이 됨',
 '**[KTO](#/p/kto)·[ORPO](#/p/orpo) 등 후속 정렬 방법의 학습 데이터**도 AI 라벨로 채워지는 경우가 흔해짐 — RLAIF가 "누가 라벨을 매기든 파이프라인은 유효하다"는 전제를 깔아줌',
 '**d-RLAIF**의 아이디어(중간 보상 모델 생략)는 이후 GRPO 계열처럼 별도 RM 없이 직접 신호를 쓰는 RL 방법들과 방향을 공유',
 '**AI 피드백의 편향 전이 우려**를 촉발 — 라벨러 LLM 자체의 편향·오류가 그대로 정책에 흡수될 위험을 다룬 후속 연구들의 출발점'
],

pitfalls:[
 '**"RLAIF가 RLHF보다 낫다"는 과장이다.** 이 논문의 결론은 명확히 "comparable"(동등)이지 우월이 아니다. 유일하게 RLAIF가 앞선 것은 무해성 과제의 harmless rate뿐이고, 나머지는 통계적으로 구분 불가능하다.',
 '**과제와 저자 소속이 결과에 영향을 준다.** 라벨러가 Google의 PaLM 2, 평가 대상도 요약·대화 등 상대적으로 짧고 정형화된 응답이다. 더 복잡하거나 논쟁적인 응답(코드, 장문 추론)에서도 같은 정합성이 나온다는 보장은 없다.',
 '**사람+AI 피드백을 섞었더니 더 나아지지 않았다.** 저자들이 직접 시도했지만 사람 피드백만 쓴 것보다 이득이 없었다고 명시한다 — "AI 피드백을 더 섞으면 항상 좋아진다"는 가정은 이 논문의 결과와 배치된다.'
],

figures:[
 {f:'fig2-rlaif-vs-rlhf.png',
  cap:'위(RLAIF)와 아래(RLHF)는 응답 쌍을 평가하는 주체만 다르다(구름 아이콘의 off-the-shelf LLM vs 사람 아이콘). 그 뒤 RM 학습과 강화학습 단계는 완전히 동일한 구조로 이어진다.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'Our results suggest that RLAIF can achieve performance on-par with using human feedback, offering a potential solution to the scalability limitations of RLHF.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2309.00267 — RLAIF vs. RLHF', u:'https://arxiv.org/abs/2309.00267'},
 {t:'Constitutional AI (Bai et al., 2022)', u:'https://arxiv.org/abs/2212.08073'}
]
});
