WIKI.paper({
slug:'mt-dnn',
venue:'ACL 2019',
authors:'Liu, He, Chen, Gao (Microsoft Research · Microsoft Dynamics 365 AI)',
arxiv:'1901.11504',

tldr:'`[BERT](#/p/bert)`의 공유 인코더 위에 GLUE 9개 과제를 **동시에** 학습하는 다중과제 학습(MTL)을 얹어 GLUE 점수를 82.7%(+2.2%p)까지 끌어올렸다. 사전학습과 다중과제 학습이 서로 다른 신호를 주는 **상보적 기법**임을 보이고, 적은 데이터로도 새 과제에 빠르게 적응함을 SNLI·SciTail 도메인 적응 실험으로 입증했다.',

context:'2018년 말 `BERT`는 대규모 비지도 사전학습 후 과제별로 개별 파인튜닝하는 방식으로 GLUE 대부분의 과제에서 최고 성능을 냈다. 그러나 각 과제를 독립적으로 파인튜닝하면 과제 간에 공유될 수 있는 지식이 버려진다. 한편 다중과제 학습(MTL)은 오래전부터 "관련 과제를 같이 배우면 서로 정규화 효과를 준다"는 것이 알려져 있었지만, 대규모 사전학습 모델과 결합한 사례는 드물었다. 저자들은 2015년 자신들이 제안한 MT-DNN 모델(Liu et al., 2015)에 BERT를 공유 인코더로 얹어 두 기법을 합친다.',

ideas:[
 {h:'BERT를 공유 인코더로, 과제별 출력층은 따로',
  lead:'하위 Transformer 인코더는 모든 과제가 공유하고 최상위 출력층만 과제마다 다르게 둔다.',
  d:'입력 $X$는 `[CLS]`/`[SEP]`로 토큰화되어 lexicon encoder → BERT 기반 Transformer encoder를 거쳐 공유 문맥 임베딩 $l_2$가 된다. 이 표현 위에 단일문장 분류(CoLA·SST-2), 텍스트 유사도(STS-B), 문장쌍 분류(RTE·MNLI·QQP·MRPC), 관련성 랭킹(QNLI) 네 종류의 과제별 출력 모듈이 각각 얹힌다.'},
 {h:'문장쌍 분류에는 SAN 답변 모듈로 다단계 추론',
  lead:'전제·가설의 working memory를 GRU로 K번 갱신해 예측을 반복 정제한다.',
  d:'`RTE`/`MNLI` 같은 NLI 과제는 단순히 `[CLS]` 표현을 softmax에 넣지 않고, stochastic answer network(SAN)의 답변 모듈을 재사용한다. 전제·가설 각각의 토큰 임베딩을 working memory로 쌓고, GRU 상태 $s_k$를 K스텝 갱신하며 매 스텝의 예측을 평균 낸다. 학습 중에는 stochastic prediction dropout을 적용해 견고성을 높인다.'},
 {h:'미니배치 단위로 과제를 번갈아 학습',
  lead:'매 스텝 9개 GLUE 과제 중 하나에서 미니배치를 뽑아 그 과제의 손실로만 갱신한다.',
  d:'사전학습(마스크 언어모델링 + 다음 문장 예측) 뒤에, 다중과제 학습 단계에서는 각 epoch마다 미니배치를 무작위 과제에서 뽑아 해당 과제의 목적함수(분류는 cross-entropy, STS-B는 MSE, QNLI는 pairwise ranking loss)로 공유 레이어와 과제별 레이어를 함께 갱신한다. 이는 사실상 모든 과제 손실의 합을 근사적으로 최적화하는 것과 같다.'},
 {h:'파인튜닝 없이도, 파인튜닝을 더해도 이득',
  lead:'MTL만으로도 BERT를 능가하고, 과제별 파인튜닝을 추가하면 더 오른다.',
  d:'MTL로 학습한 표현을 과제별 파인튜닝 없이 그대로 평가한 `MT-DNNno-fine-tune`조차 CoLA를 제외한 모든 GLUE 과제에서 `BERT-large`를 앞선다. CoLA만 예외인 이유는 다른 과제와 태스크 정의·데이터 특성이 이질적이라 MTL이 과소적합하기 때문인데, 여기에 소량의 과제별 파인튜닝을 더하면 58.9%→62.5%로 크게 뛴다.'}
],

diagram:{type:'stack', cap:'MT-DNN 구조. l1·l2가 모든 과제가 공유하는 하위층, 초록 상자가 과제마다 갈라지는 상위층.',
 layers:[
  {t:'입력 X', s:'문장 또는 문장쌍'},
  {t:'Lexicon 인코더', s:'word+segment+position'},
  {t:'Transformer', s:'BERT, 전 과제 공유', acc:true, note:'공유 표현 l2'},
  {t:'단일문장 분류', s:'CoLA·SST-2'},
  {t:'텍스트 유사도', s:'STS-B, 회귀'},
  {t:'문장쌍 분류', s:'RTE·MNLI·QQP·MRPC', note:'SAN 답변모듈'},
  {t:'관련성 랭킹', s:'QNLI'}
 ]},

math:[
 {expr:'Pr(c|X) = softmax(W_SST · x)',
  tex:'P_r(c|X)=\\text{softmax}(\\mathbf{W}_{SST}^{\\top}\\cdot\\mathbf{x})',
  d:'단일문장 분류 출력. $x$는 `[CLS]` 토큰의 공유 문맥 임베딩.'},
 {expr:'Sim(X1,X2) = w_STS · x',
  tex:'\\text{Sim}(X_1,X_2)=\\mathbf{w}_{STS}^{\\top}\\cdot\\mathbf{x}',
  d:'STS-B 유사도 회귀 출력. 목적함수는 MSE, $(y-\\text{Sim})^2$.'},
 {expr:'s_k = GRU(s_{k-1}, x_k),  Pr = avg([Pr_0,...,Pr_{K-1}])',
  tex:'\\begin{aligned}s_k &= \\text{GRU}(s_{k-1}, x_k)\\\\ \\Pr &= \\text{avg}([\\Pr_0,\\dots,\\Pr_{K-1}])\\end{aligned}',
  d:'문장쌍 분류의 SAN 답변 모듈. K스텝에 걸쳐 상태를 갱신하고 각 스텝의 예측을 평균해 최종 확률을 낸다.'}
],

numbers:[
 {k:'GLUE 평균 (test)', v:'82.7%', d:'`BERT-large` 대비 +2.2%p, 9개 중 8개 과제에서 SOTA'},
 {k:'SNLI 정확도', v:'91.6%', d:'기존 SOTA 대비 +1.5%p, 전체 훈련데이터로 도메인 적응'},
 {k:'SciTail 정확도', v:'95.0%', d:'기존 SOTA 대비 +6.7%p'},
 {k:'SNLI 0.1% 데이터 (549개)', v:'MT-DNN 82.1% vs BERT 52.5%', d:'극소량 데이터에서 MTL 표현의 우위가 가장 크게 벌어짐'},
 {k:'SNLI 1% 데이터 (5,493개)', v:'MT-DNN 85.2% vs BERT 78.1%', d:'데이터가 늘수록 격차는 줄지만 MT-DNN이 계속 앞섬'},
 {k:'CoLA (MTL만, 파인튜닝 전/후)', v:'58.9% → 62.5%', d:'MTL이 유일하게 잘 안 먹힌 과제 — 파인튜닝을 더해야 BERT(60.5%)를 넘음'}
],

impact:'사전학습(비지도, 범용)과 다중과제 학습(지도, 과제 간 정규화)이 **경쟁 관계가 아니라 상보적**이라는 것을 대규모 벤치마크로 입증했다. 특히 데이터가 극도로 적은 도메인 적응 상황에서 MTL로 얻은 표현이 단일 BERT 파인튜닝보다 훨씬 빠르게 수렴한다는 결과는, "사전학습 후 소량 데이터로 적응"이라는 이후 연구 흐름에 실질적 근거를 더했다.',

legacy:[
 '이후 `RoBERTa`·`ALBERT` 등 인코더 개선 연구와 별개로, 다중과제 파인튜닝을 사전학습-파인튜닝 파이프라인 사이의 **중간 단계**로 넣는 관행(예: T5의 멀티태스크 프리트레이닝)에 영향',
 '`[GLUE](#/p/glue)` 리더보드 경쟁에서 다중과제 학습이 단일과제 파인튜닝을 능가할 수 있음을 보여, 이후 제출작들이 공유 인코더 + 다중과제 학습을 표준 레시피로 채택',
 'SAN 답변 모듈처럼 단일과제 시절 개발된 과제별 구조를 공유 인코더 위에 그대로 재사용할 수 있음을 보여, "과제별 출력 설계"와 "표현 학습"을 분리해서 다루는 관점을 강화',
 '적은 데이터에서의 우위는 이후 few-shot 도메인 적응·전이학습 연구에서 다중과제 사전학습을 근거로 인용되는 대표 사례가 됨'
],

pitfalls:[
 '**"MTL이 항상 이득"은 아니다.** CoLA처럼 다른 과제와 태스크 성격이 이질적인 경우 MTL만으로는 BERT보다도 낮은 성능(58.9%)을 보였고, 소량의 과제별 파인튜닝을 더해야 개선됐다.',
 '**QNLI를 이진분류가 아니라 pairwise ranking으로 재정의**한 것이 성능 차이에 크게 기여했다 — 이는 MTL 자체의 효과와 별개로 "문제 정의를 바꾼 효과"이므로 두 요인을 섞어서 인용하지 않아야 한다.',
 '**도메인 적응 실험(SNLI·SciTail)은 BERT-base를 기반으로 파인튜닝한 것**이고, 본문 GLUE 결과는 BERT-large 기반 MT-DNN-large다 — 두 실험의 베이스 모델 크기가 다르다는 점을 표를 볼 때 확인해야 한다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'아래 파란 두 블록(Lexicon Encoder·Transformer Encoder)이 모든 과제가 공유하는 부분이고, 위 초록 네 블록이 과제군별로 갈라지는 출력층이다. 화살표를 따라 $l_1$(입력 임베딩)에서 $l_2$(공유 문맥 임베딩)로, 다시 각 과제의 확률/점수로 이어지는 흐름을 본다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'We argue that MTL and language model pre-training are complementary technologies, and can be combined to improve the learning of text representations.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 1901.11504 — MT-DNN', u:'https://arxiv.org/abs/1901.11504'},
 {t:'GitHub — namisan/mt-dnn', u:'https://github.com/namisan/mt-dnn'},
 {t:'GLUE 벤치마크', u:'https://gluebenchmark.com/'}
]
});
