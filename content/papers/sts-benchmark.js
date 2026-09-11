WIKI.paper({
slug:'sts-benchmark',
venue:'SemEval 2017',
authors:'Cer, Diab, Agirre, Lopez-Gazpio, Specia (Google Research · GWU · UPV/EHU · Sheffield)',
arxiv:'1708.00055',

tldr:'SemEval-2017 Task 1 보고서 안에서, 2012~2017년 STS 공유 과제 영어 데이터를 하나로 추려 고정된 train/dev/test 분할로 묶은 **STS Benchmark**를 함께 공개했다. 이후 문장 임베딩 모델을 평가하는 사실상의 표준 벤치마크가 됐다.',

context:'**의미 텍스트 유사도(STS)**는 두 문장이 의미상 얼마나 같은지를 0~5의 연속값으로 매기는 과제로, 2012년부터 매년 SemEval 공유 과제로 열려왔다. 문제는 해마다 서로 다른 장르(뉴스·이미지 캡션·포럼)와 서로 다른 분할로 데이터가 흩어져 있어서, 논문마다 다른 부분집합으로 성능을 보고해 **결과를 직접 비교하기 어려웠다**는 점이다. 2017년 과제는 아랍어·스페인어·교차언어 트랙으로 범위를 넓히는 동시에, 그동안 쌓인 영어 데이터를 정리해 재사용 가능한 고정 벤치마크로 묶어냈다.',

ideas:[
 {h:'6년치 영어 STS 데이터를 하나의 train/dev/test로 통합',
  lead:'뉴스·캡션·포럼 세 장르에서 2012~2017년 데이터를 모아 5,749/1,500/1,379개로 고정 분할했다.',
  d:'MSRpar·headlines·MSRvid·images·deft-forum·ans-forums 등 해마다 다른 이름으로 나뉘어 있던 데이터셋을 장르별로 정리하고, "개발셋으로 설계·튜닝하고 테스트셋은 마지막에 한 번만 쓴다"는 명확한 프로토콜을 못박았다. 이 고정 분할 자체가 이후 연구들이 서로의 숫자를 직접 비교할 수 있게 한 핵심 장치다.'},
 {h:'0~5 연속 척도와 해석 가능한 단계',
  lead:'완전 무관(0)부터 의미 동일(5)까지, 사람이 합의하기 쉬운 해석 가능한 단계로 라벨링한다.',
  d:'단순 이진 판별(같다/다르다)이 아니라 "일부 세부사항만 다르다", "같은 주제지만 다른 내용이다" 같은 중간 단계를 명시적으로 정의했다. 텍스트 함의(entailment)나 의미 관련성과 달리, 반대되는 내용(밤과 낮처럼 관련은 있지만 유사하지 않은 경우)이 높은 점수를 받지 않도록 설계했다.'},
 {h:'평가지표로 정확도 대신 Pearson 상관계수를 쓴다',
  lead:'모델 점수와 사람 점수가 정확히 같을 필요 없이, 순위·경향이 일치하는지를 잰다.',
  d:'STS는 분류가 아니라 회귀에 가까운 연속값 예측 과제이고, 모델마다 점수의 절대 스케일이 다를 수 있다(0~5로 내는 모델도 있고 0~1로 내는 모델도 있다 — Figure 1이 이를 보여준다). 절대값 일치가 아니라 **사람 판단과 얼마나 같은 방향으로 움직이는가**를 재는 것이 Pearson 상관계수를 쓰는 이유다.'},
 {h:'교차언어·MT 품질추정과의 관계도 함께 분석',
  lead:'번역 품질 점수와 STS 점수의 상관은 겨우 0.41 — 둘은 다른 것을 잰다는 것을 실측으로 보였다.',
  d:'번역 품질 추정(MTQE)은 원문과의 모든 불일치를 벌점으로 매기지만 STS는 **의미의 차이**만 본다. 두 지표의 상관이 낮다는 사실은 "번역이 정확하다"와 "의미가 같다"가 다른 질문임을 데이터로 확인해준 것이다.'}
],

diagram:{type:'flow', cap:'STS Benchmark 구성 과정. 6년치 흩어진 데이터를 장르별로 모아 고정 분할로 묶고, Pearson 상관으로 평가한다.',
 nodes:[
  {t:'STS 2012~2017', s:'뉴스·캡션·포럼'},
  {t:'장르별 통합', s:'MSRpar/headlines 등'},
  {t:'고정 분할', s:'5,749/1,500/1,379', acc:true},
  {t:'Pearson 상관 평가', s:'모델 점수 vs 사람 라벨'}
 ]},

numbers:[
 {k:'STS Benchmark 크기', v:'train 5,749 · dev 1,500 · test 1,379', d:'뉴스·캡션·포럼 3개 장르, 2012~2017년 영어 STS 데이터 통합'},
 {k:'당시 SOTA 상관', v:'70~80%대 Pearson r', d:'서론에서 인용한 기존 영어 STS 시스템들의 전형적 성능 범위'},
 {k:'Track 5(영어) 최고 성능', v:'ECNU, dev 84.7 / test 81.0', d:'Table 14, Pearson r × 100, feature-eng.+딥러닝 앙상블'},
 {k:'문장 임베딩 baseline', v:'InferSent test 75.8, SIF test 72.0, GloVe 평균 test 40.6', d:'같은 표에서 비교된 비지도/지도 문장 임베딩 baseline들'},
 {k:'참가 규모', v:'31개 팀, 84개 제출', d:'2017년 과제 전체(다국어 트랙 포함) 참가 규모'},
 {k:'MT 품질추정 vs STS 상관', v:'Pearson r = 0.41', d:'번역 품질 점수와 의미 유사도 점수는 중간 정도로만 상관'}
],

impact:'개별 STS 서브태스크 점수가 아니라 **하나의 고정된 벤치마크 숫자**가 생기면서, 문장 임베딩 연구가 "어느 트랙에서 얼마"가 아니라 "STS-B test Pearson r 몇 점"이라는 단일 지표로 비교 가능해졌다. 이후 [Sentence-BERT](#/p/sentence-bert), [SimCSE](#/p/simcse), [GloVe](#/p/glove) 후속 임베딩 모델까지 사실상 모든 범용 문장 임베딩 논문이 이 벤치마크를 표준 평가 루틴으로 채택했다.',

legacy:[
 '**[Sentence-BERT](#/p/sentence-bert)**·**[SimCSE](#/p/simcse)** 등 문장 임베딩 모델의 표준 평가 지표로 정착',
 '[SentEval](#/p/senteval) 같은 범용 문장 표현 평가 툴킷에 STS-B가 기본 태스크로 포함됨',
 '고정 train/dev/test 분할이라는 설계가 이후 GLUE·[SuperGLUE](#/p/superglue) 같은 벤치마크 모음의 "과제별 고정 분할" 관행에 영향',
 '다국어·교차언어 STS 확장(STS 2017의 아랍어·스페인어 트랙)이 이후 다국어 문장 임베딩 평가의 출발점이 됨'
],

pitfalls:[
 '**Pearson r만 보고하면 스케일 차이를 놓칠 수 있다.** Figure 1이 보여주듯 모델마다 점수 스케일(0-5 vs 0-1)이 달라도 상관계수는 높게 나올 수 있으므로, 실제 배포에는 스케일 보정이 별도로 필요하다.',
 '**annotator 간 완전한 합의를 전제하지 않는다.** 저자들도 "girl"과 "boy" 같은 semantic blending, 부정어 처리처럼 사람도 헷갈리는 사례(Table 12)를 직접 제시했다 — 최고 성능도 사람 라벨의 주관성 한계 안에 있다.',
 '**번역 품질과 의미 유사도를 같은 지표로 혼동하면 안 된다.** 논문이 실측한 상관계수 0.41이 이를 명시적으로 경고한다.'
],

figures:[
 {f:'fig1-model-vs-human.png',
  cap:'x축이 참가 시스템의 예측 점수, y축이 사람이 매긴 정답. (a) 영어에서는 점들이 대각선(완벽한 일치)에 가깝게 모이지만, (b) 아랍어는 훨씬 흩어져 있고, (c) 스페인어-영어 MT 트랙은 사실상 무작위에 가까운 분포 — 언어·도메인에 따라 같은 과제도 난이도가 크게 다르다는 것을 한눈에 보여준다.',
  src:'원문 Figure 1, p.9'}
],

quotes:[
 {t:'Performance is measured by the Pearson correlation of machine scores with human judgments.',
  src:'Section 2, p.2'}
],

links:[
 {t:'arXiv 1708.00055 — SemEval-2017 Task 1: Semantic Textual Similarity', u:'https://arxiv.org/abs/1708.00055'},
 {t:'STS Benchmark data (ixa2.si.ehu.es)', u:'http://ixa2.si.ehu.es/stswiki/index.php/STSbenchmark'}
]
});
