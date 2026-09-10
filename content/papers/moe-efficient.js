WIKI.paper({
slug:'moe-efficient',
venue:'arXiv 2021',
authors:'Artetxe, Bhosale, Goyal, Mihaylov, Ott, Shleifer et al. (Meta AI)',
arxiv:'2112.10684',

tldr:'MoE가 밀집 모델보다 정확히 어디서, 얼마나 유리한지를 1.1T 파라미터까지 실측한 논문. 언어모델링·제로/퓨샷은 MoE가 크게 이기지만 **파인튜닝에서는 오히려 밀집 모델보다 나쁠 때가 있다**는 것을 처음 정량적으로 보였다.',

context:'`[GShard](#/p/gshard)`와 `[Switch Transformer](#/p/switch)`가 MoE로 조 단위 파라미터까지 확장 가능함을 보인 뒤, 정작 "밀집 모델 대비 얼마나 효율적인가"는 태스크마다 산발적으로만 보고돼 있었다. 특히 MoE가 언어모델링에서 좋다는 보고는 많았지만 **제로샷·퓨샷·파인튜닝**처럼 실제 활용 시나리오에서 밀집 모델과 나란히, 같은 연산량(FLOPs) 기준으로 비교한 연구가 없었다. 이 논문은 125M부터 1.1T까지 밀집·MoE 쌍을 나란히 학습시켜 이 공백을 채운다.',

ideas:[
 {h:'같은 FLOPs 로 밀집·MoE를 쌍으로 맞춘다',
  lead:'125M~13B 밀집 모델마다 연산량이 비슷한 MoE 짝을 만들어 공정 비교한다.',
  d:'MoE는 파라미터 수는 훨씬 크지만 토큰당 활성화되는 파라미터는 일부뿐이라, 파라미터 수가 아니라 **학습 ZFLOPs**를 기준으로 맞춰야 공정한 비교가 된다. 예컨대 6.7B 밀집 모델(17.12 ZFLOPs)의 짝은 1.1T MoE 모델(22.27 ZFLOPs)이다. `[GShard](#/p/gshard)`의 설계를 따라 홀수 층은 밀집 FFN, 짝수 층은 MoE로 교대시키고 top-2 전문가 라우팅을 쓴다.'},
 {h:'속도 향상 배율(speedup factor)로 효율을 측정한다',
  lead:'같은 성능에 도달하는 데 필요한 연산량의 비율로 MoE의 이득을 정량화한다.',
  d:'밀집 모델이 $x$ ZFLOPs로 도달한 성능을 MoE가 $x/y$ ZFLOPs로 도달하면 배율은 $y$다. in-domain 언어모델링 perplexity, out-of-domain(Pile) perplexity, 6개 태스크 평균 제로샷 정확도 세 기준으로 각각 이 배율을 그려, 스케일이 커질수록 배율이 어떻게 변하는지를 추적했다.'},
 {h:'제로/퓨샷은 이기고, 파인튜닝은 진다',
  lead:'같은 MoE가 태스크 형식에 따라 밀집 모델을 이기기도 지기도 한다.',
  d:'언어모델링과 제로샷·퓨샷 프라이밍에서는 MoE가 밀집 모델 대비 최대 **4배** 적은 연산으로 동일 성능에 도달했다. 하지만 지도 파인튜닝에서는 정반대다 — HellaSwag·PIQA·WinoGrande 등에서 파인튜닝된 MoE가 파인튜닝된 밀집 모델보다 **더 나쁜** 성능을 보였다. 저자들은 두 모델군이 스케일에서 서로 다른 방식으로 일반화한다고 해석한다.'},
 {h:'절대 이득은 스케일에서 좁아지지만 사라지지 않는다',
  lead:'배율 자체는 규모가 커지며 줄지만 1.1T MoE는 여전히 이긴다.',
  d:'작은 스케일에서 관측된 최대 15배 안팎의 속도 향상 배율은 모델이 커질수록 좁아진다. 그럼에도 논문이 학습한 가장 큰 1.1T MoE 모델은 연산량이 거의 같은 6.7B 밀집 모델을 in-domain·out-of-domain·제로샷 세 기준 모두에서 일관되게 앞섰다.'}
],

diagram:{type:'compare', cap:'같은 연산 예산(ZFLOPs)에서 과제 형식에 따라 승부가 갈린다.',
 left:{t:'밀집 모델', items:['제로/퓨샷: MoE에 최대 4배 뒤짐','파인튜닝: 일부 태스크에서 더 나음','스케일 전 구간에서 예측 가능']},
 right:{t:'MoE (top-2, 512 전문가)', items:['언어모델링·제로샷 우세','파인튜닝은 태스크별로 들쭉날쭉','1.1T도 6.7B 밀집 대비 우세 유지']}},

math:[
 {expr:'speedup y : dense가 x ZFLOPs로 낸 성능을 MoE가 x/y ZFLOPs로 냄',
  tex:'\\text{MoE 성능}(x/y \\text{ ZFLOPs}) \\approx \\text{Dense 성능}(x \\text{ ZFLOPs})',
  d:'이 배율 $y$ 를 in-domain perplexity, out-of-domain(Pile) perplexity, 제로샷 평균 정확도 세 지표에서 각각 구해 Figure 1로 나타냈다.'},
 {expr:'expert capacity = C · B / E',
  tex:'\\text{capacity} = C \\cdot \\frac{B}{E}',
  d:'전문가 하나가 한 배치에서 받을 수 있는 최대 토큰 수. $B$ 는 배치의 총 토큰 수, $E$ 는 전문가 수(=512), $C$ 는 용량 계수(=2). 이를 넘는 토큰은 "overflow"로 처리돼 residual 경로로만 전달된다.'}
],

numbers:[
 {k:'최대 MoE 규모', v:'1.1T 파라미터', d:'32층 · hidden 4096 · 전문가 512개, 학습 22.27 ZFLOPs'},
 {k:'비교 대상 밀집 모델', v:'6.7B 파라미터', d:'같은 32층 · hidden 4096 구성, 학습 17.12 ZFLOPs로 연산량 매칭'},
 {k:'언어모델링 효율 이득', v:'최대 ~4배', d:'같은 perplexity에 도달하는 데 필요한 연산량이 밀집 대비 약 1/4'},
 {k:'라우팅', v:'top-2 전문가 · 512개', d:'`[GShard](#/p/gshard)` 방식, 홀수/짝수 층에 밀집 FFN과 MoE층을 교대 배치'},
 {k:'학습 토큰', v:'300B 토큰 · 시퀀스 길이 2048', d:'모든 밀집·MoE 모델 공통'},
 {k:'용량 계수 C', v:'2', d:'배치 토큰 수 대비 전문가당 최대 처리량의 배수'}
],

impact:'MoE 연구가 "확장 가능함을 보인다"(`[GShard](#/p/gshard)`, `[Switch](#/p/switch)`)에서 "**어디서 왜 유리한가**를 실증한다"로 넘어가는 분기점이 됐다. 특히 파인튜닝에서 MoE가 밀집 모델에 밀린다는 관측은 이후 MoE 모델의 지시 조정·정렬 단계 설계(부분 파인튜닝, 라우터 동결 등)에 직접적인 영향을 줬다. 밀집·MoE를 FLOPs 기준으로 짝지어 비교하는 방법론 자체도 이후 MoE 논문들의 표준 비교 틀이 됐다.',

legacy:[
 '**FLOPs 매칭 비교의 표준화** — 파라미터 수가 아니라 학습 연산량으로 밀집·MoE를 짝짓는 방법이 이후 `[Mixtral](#/p/mixtral)` 등 후속 MoE 보고의 기본 관행이 됨',
 '**"MoE는 파인튜닝에 약하다"는 경고가 널리 인용됨** — 이후 MoE 기반 지시 조정 연구들이 라우터 안정화·부분 동결 같은 대응책을 탐색하는 출발점이 됨',
 '**대규모 MoE 학습 인프라 보고** — FP16, activation checkpointing, fully sharded data parallel을 결합해 1.1T를 학습한 공학적 세부사항이 이후 오픈소스 MoE 학습(`[Mixtral](#/p/mixtral)` 등)의 참고 사례가 됨'
],

pitfalls:[
 '**"MoE가 항상 이득"이 아니다.** 이 논문의 핵심 발견 자체가 그 반대다 — 파인튜닝 시나리오에서는 여러 태스크에서 MoE가 밀집 모델보다 못했다. MoE 도입 여부는 최종 사용 방식(제로샷 vs 파인튜닝)을 먼저 정하고 판단해야 한다.',
 '**속도 향상 배율은 스케일에 따라 줄어든다.** 작은 모델에서 관측된 큰 배율(최대 15배 근처)을 그대로 1.1T 스케일에 외삽하면 과대평가다 — 논문 자체가 "이 격차는 스케일에서 좁아진다"고 명시한다.',
 '**MoE 파라미터 수는 착시가 크다.** 1.1T는 총 파라미터일 뿐 토큰당 활성화되는 연산량은 6.7B 밀집 모델과 비슷하다 — "1.1T짜리 모델"이라는 표현만으로 실제 추론 비용을 짐작하면 안 된다.'
],

figures:[
 {f:'fig1-speedup.png',
  cap:'x축은 밀집 모델의 학습 연산량(ZFLOPs, 로그 스케일), y축은 MoE가 같은 성능에 도달하는 데 필요한 연산량 대비 배율. 파란선(in-domain LM)이 스케일이 커지며 배율이 오히려 치솟다가 가장 큰 지점에서 꺾이는 것에 주목 — 제로샷(노란)·out-of-domain(빨강)은 반대로 완만히 줄어든다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'With the exception of fine-tuning, we find MoEs to be substantially more compute efficient.',
  src:'Abstract, p.1'},
 {t:'This gap narrows at scale, but our largest MoE model (1.1T parameters) consistently outperforms a compute-equivalent dense model (6.7B parameters).',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2112.10684 — Efficient Large Scale Language Modeling with Mixtures of Experts', u:'https://arxiv.org/abs/2112.10684'},
 {t:'code (fairseq MoE LM)', u:'https://github.com/pytorch/fairseq/tree/main/examples/moe_lm'}
]
});
