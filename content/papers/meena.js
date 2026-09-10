WIKI.paper({
slug:'meena',
venue:'arXiv 2020 (Google Research)',
authors:'Adiwardana et al. (Google Research, Brain Team)',
arxiv:'2001.09977',

tldr:'26억 파라미터 [Transformer](#/p/transformer) [seq2seq](#/p/seq2seq)를 그냥 **다음 토큰 perplexity만 낮추도록** 학습시켰더니, 사람이 평가한 대화 품질이 손으로 짠 규칙·의도 기반 챗봇들을 앞질렀다는 것을 보인 논문. 사람 평가 지표 **SSA**(Sensibleness and Specificity Average)를 제안하고, 그것이 perplexity와 강하게 상관한다는 것이 핵심 발견이다.',

context:'2020년 이전의 open-domain 챗봇은 두 갈래였다. XiaoIce·Mitsuku·Cleverbot처럼 대화 관리자·규칙·검색을 얹은 복잡한 시스템이거나, DialoGPT처럼 end-to-end로 학습하지만 규모가 제한적인 모델이었다. 대화 품질을 재는 방법도 문제였다. BLEU 같은 자동 지표는 사람 평가와 상관이 약하다는 연구가 여럿 있었고, 그래서 대화 연구는 값비싼 사람 평가에 의존하면서도 **무엇을 물어야 품질을 재는지**조차 합의가 없었다. 이 논문의 질문은 두 가지다 — 대화 품질을 어떻게 하나의 숫자로 잴 것인가, 그리고 그 숫자가 흔히 쓰는 자동 지표(perplexity)와 관계가 있는가.',

ideas:[
 {h:'SSA: 감각성과 구체성의 평균',
  lead:'말이 되는가(sensibleness)와 알맹이가 있는가(specificity)를 각각 사람이 라벨링해 평균한다.',
  d:'첫 축인 sensibleness는 문맥에 비추어 응답이 말이 되는지, 모순이 없는지를 본다. 이것만 최적화하면 "잘 모르겠어요" 같은 안전하지만 공허한 응답으로 도망갈 수 있어서, 두 번째 축인 specificity를 더했다 — 그 문맥에서만 나올 법한 구체적인 응답인지를 본다. 두 라벨의 평균이 SSA다. 사람 평가자는 27%를 sensible이지만 specific하지 않다고 라벨링했는데, 이는 "말은 되지만 아무 말도 안 한" 응답의 비중을 정확히 짚어낸다.'},
 {h:'perplexity와 SSA가 강하게 상관한다',
  lead:'모델을 여러 버전 학습시켜 perplexity 대 SSA를 찍었더니 $R^2=0.93$~$0.96$의 직선이 나왔다.',
  d:'BLEU 등 기존 자동 지표는 사람 평가와 상관이 약하다는 것이 통념이었는데, Meena의 여러 체크포인트·구성을 perplexity 대 interactive SSA로 찍으면 결정계수 $R^2=0.93$짜리 거의 직선 관계가 나온다. static 평가에서는 $R^2=0.96$까지 나온다. 즉 **다음 토큰을 더 잘 맞히도록 학습하는 것만으로 사람이 느끼는 대화 품질이 함께 좋아진다**는 뜻이다. 이 결과는 "무엇을 최적화해야 좋은 대화가 되는가"라는 질문에 놀랍도록 단순한 답을 준다.'},
 {h:'복잡한 프레임워크 없이 순수 end-to-end',
  lead:'대화 관리자·의도 분류기 없이 소셜미디어 대화로 학습한 seq2seq 하나로 승부한다.',
  d:'구조는 [Evolved Transformer](#/p/transformer)(신경망 구조 탐색으로 찾은 Transformer 변형) 기반 seq2seq다. 최근 최대 7턴의 대화 맥락을 통째로 입력 시퀀스로 넣고 다음 응답을 출력으로 학습한다. XiaoIce나 Mitsuku가 쌓아온 수년치 수작업 규칙과 달리, 모델이 하는 일은 오직 다음 토큰의 확률을 맞히는 것뿐이다.'},
 {h:'대규모로 걸러낸 소셜미디어 대화 데이터',
  lead:'공개 소셜미디어에서 867M개의 (문맥, 응답) 쌍을 추출해 341GB·40B 단어로 정제했다.',
  d:'서브워드 수가 2 미만이거나 128을 넘는 경우, URL을 포함하는 경우 등을 걸러내는 여러 규칙으로 노이즈를 줄였다. 최종 데이터셋은 GPT-2 학습 데이터보다 훨씬 크다. 8K BPE 서브워드 vocabulary를 썼고, 최종 모델은 이 데이터를 30일 동안 TPU-v3 Pod(2,048 코어)로 학습해 10.2의 test perplexity를 얻었다.'},
 {h:'sample-and-rank로 디코딩 자체도 SSA를 올린다',
  lead:'N개를 뽑아 로그우도가 가장 높은 것을 고르는 sample-and-rank가 빔서치보다 응답 품질을 높인다.',
  d:'온도 $T$로 여러 후보를 샘플링한 뒤 길이 정규화된 log-likelihood가 가장 높은 것을 선택하는 sample-and-rank 방식을 쓴다. $N=20$, $T=0.88$일 때가 최적이었고, $N=1$ 대비 SSA가 유의하게 올랐지만 $N=400$까지 늘리면 오히려 성능이 떨어졌다. 여기에 안전·독성 필터링까지 더한 전체 시스템이 base 모델의 72%에서 79% SSA로 올라간다.'}
],

diagram:{type:'compare', cap:'기존 open-domain 챗봇과 Meena의 접근 차이.',
 left:{t:'기존: 규칙+검색 결합', items:['대화 관리자·의도 분류기 수작업','수년치 규칙 축적(XiaoIce 등)','BLEU 등 약한 자동 지표에 의존']},
 right:{t:'Meena: 순수 end-to-end', items:['seq2seq 하나, perplexity만 최적화','SSA로 사람 품질 직접 측정','perplexity가 SSA의 대리 지표가 됨',]}
},

math:[
 {expr:'SSA = (Sensibleness + Specificity) / 2',
  tex:'\\text{SSA} = \\frac{\\text{Sensibleness} + \\text{Specificity}}{2}',
  d:'문맥마다 사람 평가자가 두 이진 라벨(말이 되는가, 구체적인가)을 매기고 그 비율의 평균을 낸다. 사람 평균은 86%, Meena 최종 버전은 79%다.'}
],

numbers:[
 {k:'파라미터', v:'2.6B', d:'1개 Evolved Transformer encoder 블록 + 13개 decoder 블록'},
 {k:'학습 데이터', v:'341GB · 40B 단어', d:'소셜미디어 대화에서 867M개의 (문맥,응답) 쌍을 필터링'},
 {k:'test perplexity', v:'10.2', d:'8K BPE vocabulary 기준'},
 {k:'interactive SSA (perplexity–SSA 상관)', v:'$R^2=0.93$', d:'static 평가는 $R^2=0.96$'},
 {k:'SSA · base 모델 / 전체 시스템 / 사람', v:'72% / 79% / 86%', d:'전체 시스템 = 필터링 + sample-and-rank 디코딩'},
 {k:'학습 규모', v:'TPU-v3 Pod 2,048코어 × 30일', d:'기존 최고 대화모델 대비 압도적으로 큰 학습 연산량'}
],

impact:'이 논문은 대화 생성 연구의 축을 옮겼다. **(1) 목적함수의 단순화** — 대화 관리자·의도 분류·규칙 대신 perplexity 하나만 낮춰도 품질이 따라온다는 것을 보였다. **(2) 측정의 표준화** — SSA는 이후 대화형 언어모델 평가의 기본 틀이 되었고, [LaMDA](#/p/lamda)가 SSA를 그대로 이어받아 확장했다. **(3) 스케일의 증거** — 대화 품질도 다른 NLP 과제처럼 모델·데이터를 키우면 개선되는 영역임을 데이터로 보여, 이후 대화 모델 경쟁이 파라미터 수 경쟁으로 이어지는 근거가 되었다.',

legacy:[
 '**[LaMDA](#/p/lamda)** — Meena의 직접 후속으로, SSA를 안전성·근거성 지표와 함께 확장하고 파라미터를 137B까지 키움',
 '**대화 평가 지표의 정착** — SSA 이후 사람 평가에 "말이 되는가/구체적인가"를 나누어 묻는 방식이 대화 벤치마크의 관례가 됨',
 '**perplexity 신뢰 회복** — BLEU 계열이 대화 품질과 상관이 약하다는 통념 속에서, 잘 설계된 학습 목적함수(perplexity)는 여전히 유효한 대리 지표임을 재확인',
 '**instruction-tuned 대화모델로의 이행** — ChatGPT류 모델은 여기에 [RLHF](#/p/instructgpt) 단계를 더 얹는 방식으로 발전'
],

pitfalls:[
 '**"perplexity만 낮추면 안전한 챗봇이 된다"는 아니다.** 논문도 최종 시스템에 별도의 안전·독성 필터링을 추가해서야 배포 가능한 수준에 이르렀다. perplexity–SSA 상관은 사실성·안전성과는 별개다.',
 '**static 평가 데이터셋(1,477개 문맥)의 편향 문제**를 저자들도 인정한다. 사전에 고정된 문맥 집합이 실제 대화의 다양성을 다 담지 못해, interactive 평가와 결과가 다소 갈릴 수 있다.',
 '**$N=400$처럼 후보를 과도하게 늘리면 sample-and-rank 성능이 오히려 떨어진다.** "더 많이 뽑고 고르면 무조건 좋다"는 단순한 직관이 여기서는 성립하지 않는다.'
],

figures:[
 {f:'fig1-ssa-vs-perplexity.png',
  cap:'x축이 perplexity(낮을수록 좋음), y축이 interactive SSA. 점 하나가 Meena의 서로 다른 학습 버전이고, 점선은 사람(86%)·Meena 최종판(79%)·Meena base(72%)·경쟁 챗봇들의 SSA 수준. 우하향 직선이 곧 perplexity를 낮출수록 SSA가 오른다는 핵심 상관관계.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-ssa-vs-humanlikeness.png',
  cap:'x축 SSA, y축은 별도로 물은 "사람 같은가" 라벨의 비율. 점 하나가 챗봇 하나(맨 오른쪽 위가 사람). SSA 하나만으로 별도 질문인 human-likeness까지 거의 직선으로 예측되어, SSA가 대리 지표로 타당함을 보여준다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'This 2.6B parameter neural network is simply trained to minimize perplexity of the next token.',
  src:'Abstract, p.1'},
 {t:'the better that Meena fit its training data, the more sensible and specific its chat responses became.',
  src:'Section 1, p.2'}
],

links:[
 {t:'arXiv 2001.09977 — Towards a Human-like Open-Domain Chatbot', u:'https://arxiv.org/abs/2001.09977'},
 {t:'Google AI Blog — Towards a Conversational Agent that Can Chat About…Anything', u:'https://ai.googleblog.com/2020/01/towards-conversational-agent-that-can.html'}
]
});
