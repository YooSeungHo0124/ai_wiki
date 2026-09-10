WIKI.paper({
slug:'tensorflow',
venue:'백서 (Preliminary White Paper, 2015) / OSDI 2016',
authors:'Abadi, Agarwal, Barham, Brevdo, Chen, Citro et al. (Google Brain)',
arxiv:'1603.04467',

tldr:'계산을 **데이터플로 그래프**로 표현하고, 그 그래프를 CPU·GPU부터 휴대폰까지 이기종 장치에 자동으로 배치·분산 실행하는 머신러닝 프레임워크. Google의 1세대 시스템 DistBelief를 대체한 2세대이며, 2015년 11월 Apache 2.0으로 오픈소스화됐다.',

context:'Google은 2011년경부터 `DistBelief`라는 1세대 분산 학습 시스템으로 대규모 신경망을 돌리고 있었지만, 이는 특정 레이어 구조를 가정한 파라미터 서버 아키텍처라 새로운 모델 종류를 실험하려면 코드를 다시 짜야 했고, 연구용으로 쓰기엔 유연성이 부족했다. 당시 다른 프레임워크인 [Caffe](#/p/caffe)는 레이어를 조합하는 방식이라 CNN 계열엔 빠르고 단순했지만, 순환·재귀 구조나 강화학습처럼 그래프 형태가 동적으로 바뀌는 모델을 표현하기 어려웠다. TensorFlow의 질문은 **하나의 추상화(데이터플로 그래프)로 연구용 유연성과 프로덕션 규모의 분산 실행을 동시에 만족시킬 수 있는가**였다.',

ideas:[
 {h:'계산을 노드-엣지 데이터플로 그래프로 표현한다',
  lead:'연산은 노드, 다차원 배열(tensor)은 그래프를 흐르는 엣지가 된다.',
  d:'그래프의 각 노드는 `MatMul`, `Add`, `ReLU` 같은 연산(operation)이고, 엣지는 그 사이를 흐르는 tensor다. `Variable`은 그래프 실행 사이에도 값이 유지되는 특수 노드로, 모델 파라미터를 담는다. 사용자는 Python으로 그래프를 조립한 뒤 `Session.run()`으로 원하는 출력 노드까지의 부분그래프만 실행시킨다 — 그래프 전체가 아니라 필요한 연산만 지연 계산(lazy)되는 구조다.'},
 {h:'장치 배치를 그래프 위에서 자동으로 결정한다',
  lead:'비용 모델과 그리디 휴리스틱으로 각 노드를 CPU·GPU 중 어디서 돌릴지 자동 선택한다.',
  d:'노드마다 실행 시간·출력 크기를 추정하는 비용 모델을 두고, 그래프를 위상순회하며 각 노드를 "가장 빨리 끝낼 수 있는" 장치에 그리디하게 배치한다. 서로 다른 장치에 걸친 엣지는 `Send`/`Receive` 노드 쌍으로 자동 치환돼, 실제 데이터 전송이 그래프 실행 메커니즘 안으로 흡수된다 — 사용자가 통신 코드를 직접 짤 필요가 없다.'},
 {h:'자동 미분도 그래프 변환으로 구현한다',
  lead:'역전파를 별도 엔진이 아니라 그래프에 gradient 노드를 추가하는 그래프 변환으로 처리한다.',
  d:'`C`를 계산하는 순전파 그래프가 있으면, 각 연산에 대응하는 gradient 함수를 이용해 `dC/dx`를 계산하는 노드들을 원래 그래프에 **덧붙인다**. 결과적으로 미분 계산도 똑같은 데이터플로 그래프 실행 메커니즘, 같은 장치 배치·분산 로직을 그대로 재사용한다.'},
 {h:'동기·비동기 두 방식의 데이터 병렬 학습을 같은 그래프 모델로 표현',
  lead:'그래프를 여러 장치에 복제해 동기(파라미터 서버 대기) 또는 비동기(각자 갱신)로 학습한다.',
  d:'동기 방식은 여러 replica가 gradient를 계산한 뒤 파라미터 서버가 이를 모아 한 번에 갱신하고, 비동기 방식은 각 replica가 독립적으로 파라미터를 읽고 갱신한다. 두 방식 모두 별도 시스템이 아니라 **같은 데이터플로 그래프의 다른 배선**일 뿐이라는 것이 핵심 — 그래프 추상화 하나로 표현 가능한 실행 전략의 폭을 보여준다.'},
 {h:'단일 시스템으로 휴대폰부터 수천 노드 클러스터까지',
  lead:'같은 코드가 스마트폰 추론과 대규모 분산 학습 양쪽에서 동작하도록 설계했다.',
  d:'DistBelief는 대규모 분산 학습 전용이었지만, TensorFlow는 그래프 실행 런타임을 장치 수·클러스터 규모와 무관하게 통일해, 연구자가 노트북에서 실험한 모델을 코드 변경 없이 그대로 프로덕션 클러스터나 모바일 기기로 옮길 수 있게 했다.'}
],

diagram:{type:'flow', cap:'파이썬으로 짠 그래프(W·x·b→ReLU→C)가 Session.run() 호출 시 장치별 서브그래프로 나뉘어 실행되는 흐름.',
 nodes:[
  {t:'그래프 구성', s:'Python API'},
  {t:'Session.run()', s:'필요한 노드만'},
  {t:'장치 배치', s:'비용모델+그리디', acc:true, note:'CPU/GPU 자동 선택'},
  {t:'Send/Recv 삽입', s:'장치 경계마다'},
  {t:'분산 실행', s:'커널 단위 실행'}
 ]},

numbers:[
 {k:'공개 시점·라이선스', v:'2015년 11월 · Apache 2.0', d:'DistBelief를 대체하는 2세대 시스템'},
 {k:'Inception 그래프 규모', v:'36,000개 노드 이상', d:'TensorBoard 시각화 예시로 언급'},
 {k:'LSTM 언어모델 그래프 규모', v:'15,000개 이상 노드', d:'깊은 순환 구조도 하나의 그래프로 표현'},
 {k:'미니배치 크기', v:'100~1000', d:'SGD 데이터 병렬 학습 실험 전제'},
 {k:'성능 평가', v:'"추후 버전에서 다룸"', d:'이 백서 자체엔 정량 벤치마크 섹션이 없다'}
],

impact:'데이터플로 그래프 + 자동 장치 배치라는 조합이, 연구자의 파이썬 코드와 프로덕션 분산 클러스터 사이의 벽을 허물었다. TensorBoard 같은 그래프 시각화·디버깅 도구, `SavedModel`/서빙 인프라(TensorFlow Serving 계열)까지 하나의 생태계로 묶이면서, 이후 5년 이상 산업계 딥러닝 인프라의 사실상 표준이 됐다. 다만 그래프를 먼저 전부 정의(define-then-run)해야 하는 정적 그래프 방식은 디버깅이 어렵고 동적 제어흐름(가변 길이 시퀀스, 조건부 구조) 표현이 번거로웠다.',

legacy:[
 '**정적 그래프의 전성기와 쇠퇴** — Eager execution(2017), `tf.function`(2019)으로 뒤늦게 동적 실행을 흡수했지만, define-by-run을 처음부터 채택한 PyTorch에 연구 커뮤니티의 주도권을 넘겨줌',
 '**서빙·배포 생태계로 확장** — TensorFlow Lite(모바일), TensorFlow.js(브라우저), TF Serving까지 "하나의 그래프, 여러 장치"라는 원 설계가 그대로 이어짐',
 '**분산 학습 개념의 표준화** — 동기/비동기 데이터 병렬, 모델 병렬이라는 이 논문의 분류가 이후 다른 프레임워크에서도 그대로 쓰이는 표준 용어가 됨',
 '**라이브러리 계층의 후속 경쟁** — [HuggingFace Transformers](#/p/huggingface) 같은 상위 라이브러리가 TensorFlow와 PyTorch를 모두 지원하는 시대로 이어지며, 프레임워크 자체는 다시 인프라 계층으로 내려감'
],

pitfalls:[
 '**이 백서에는 성능 벤치마크가 없다.** "A future version of this white paper will have a comprehensive performance evaluation section"이라고 원문에 명시돼 있다 — 이 논문을 속도 비교의 근거로 인용하면 안 된다.',
 '**"TensorFlow가 데이터플로 그래프를 처음 발명했다"는 과장이다.** 논문 스스로 Naiad 등 기존 데이터플로 시스템을 언급하며, 기여는 새 패러다임이 아니라 **머신러닝에 맞춘 조합**(자동 미분·이기종 장치 배치·Variable 노드)이다.',
 '**정적 그래프(define-then-run)가 기본이었다.** 오늘날 흔히 쓰는 즉시 실행(eager) 방식은 이 논문 이후 별도로 추가된 기능이며, 원 논문이 기술하는 실행 모델과는 다르다.'
],

figures:[
 {f:'fig2-dataflow-graph.png',
  cap:'`b`, `W`, `x` 세 텐서가 `MatMul`→`Add`→`ReLU`로 흐르는 계산 그래프. 원 코드의 각 파이썬 줄이 정확히 노드 하나에 대응한다 — 이것이 "코드를 그래프로 컴파일한다"는 설계를 보여주는 가장 단순한 예.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'TensorFlow computations are expressed as stateful dataflow graphs... we describe the TensorFlow dataflow model and demonstrate the compelling performance that TensorFlow achieves for several real-world applications.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1603.04467 — TensorFlow: Large-Scale Machine Learning on Heterogeneous Distributed Systems', u:'https://arxiv.org/abs/1603.04467'},
 {t:'TensorFlow 공식 사이트', u:'https://www.tensorflow.org/'}
]
});
