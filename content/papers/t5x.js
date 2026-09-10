WIKI.paper({
slug:'t5x',
venue:'arXiv 2022 (Google Research)',
authors:'Roberts, Chung, Levskaya, Mishra, Bradbury et al. (Google Research)',
arxiv:'2203.17189',

tldr:'[T5](#/p/t5)를 지탱하던 TensorFlow/Mesh TensorFlow 학습 인프라를 JAX 기반으로 완전히 새로 짠 논문. 모델 코드(t5x)와 데이터 파이프라인(seqio)을 분리해, 수백억 파라미터 모델을 재현 가능하게 학습·평가하는 표준 틀을 제공한다.',

context:'2019년 [T5](#/p/t5) 논문 자체는 Mesh TensorFlow 위에서 학습됐는데, 이 스택은 [Megatron-LM](#/p/megatron) 세대의 수동 병렬화 기법과 마찬가지로 특정 클러스터 구성에 강하게 결합돼 있었다. 모델이 수백억 파라미터로 커지면서 문제가 누적됐다 — 병렬화 코드를 새 모델마다 다시 손봐야 했고, 데이터 파이프라인이 학습 프레임워크마다 따로 구현돼 같은 벤치마크를 공정하게 비교하기 어려웠으며, 체크포인트 저장 방식이 클러스터 구성이 바뀌면 깨지기 쉬웠다. t5x는 이 인프라 부채를 겨냥한다 — **모델 크기가 바뀌어도, 클러스터 구성이 바뀌어도 코드를 다시 쓰지 않고 스케일링할 수 있는가?**',

ideas:[
 {h:'JAX + jax.pjit로 병렬화를 선언적으로 처리',
  lead:'XLA GSPMD 컴파일러가 데이터·모델·활성화 파티셔닝을 자동으로 분배한다.',
  d:'`jax.pjit`은 사용자가 텐서를 어떻게 나눌지 명시하면 나머지 통신·샤딩을 컴파일러가 알아서 처리하는 SPMD 프로그래밍 모델이다. [Megatron-LM](#/p/megatron)류가 병렬화 로직을 모델 코드에 직접 손으로 박아 넣는 것과 달리, t5x는 같은 모델 코드를 그대로 두고 파티셔닝 설정만 바꿔 8B에서 500B+까지 스케일을 옮겨간다.'},
 {h:'모델(t5x)과 데이터(seqio)를 별도 라이브러리로 분리',
  lead:'seqio는 task 기반 API로 데이터 전처리·평가를 JAX·TensorFlow·PyTorch에 공통으로 제공한다.',
  d:'`tensorflow.data`를 기반으로 하되 SPMD 데이터 병렬성을 얹어, 학습 프레임워크와 무관하게 같은 데이터 파이프라인을 재사용할 수 있게 했다. 이 분리 덕분에 데이터 처리 버그와 모델 버그를 독립적으로 디버깅할 수 있다.'},
 {h:'결정적(deterministic) 데이터 파이프라인으로 재현성 확보',
  lead:'같은 Task/Mixture를 실행하면 항상 같은 순서로 배치를 만들어 벤치마크 비교를 공정하게 만든다.',
  d:'중단된 학습을 정확히 같은 지점에서 재개하거나, 두 모델을 같은 데이터 순서로 비교하는 것은 대규모 분산 학습에서 뜻밖에 어려운 문제다. seqio는 이를 라이브러리 차원의 기본값으로 제공해, 디버깅과 공정한 벤치마킹을 가능하게 한다.'},
 {h:'TensorStore 기반 분산 체크포인팅',
  lead:'파라미터가 여러 호스트에 쪼개져 있어도 슬라이스 단위로 안전하게 읽고 쓴다.',
  d:'파라미터·옵티마이저 상태가 파티셔닝돼 여러 TPU 호스트에 흩어져 있을 때, 단순한 체크포인트 저장 방식은 잘 깨진다. t5x는 자체 체크포인팅 레이어를 `TensorStore` 위에 구축해 분산 상태를 안정적으로 저장·복원한다.'},
 {h:'Gin 기반 설정으로 코드 수정 없이 실험을 바꾼다',
  lead:'의존성 주입(dependency injection)으로 하이퍼파라미터부터 커스텀 모듈까지 설정 파일만으로 교체한다.',
  d:'연구자가 체크포인터·모델 객체 같은 핵심 컴포넌트까지 라이브러리 코드를 건드리지 않고 갈아끼울 수 있어, 빠른 실험 반복이라는 연구 인프라 본연의 목적에 맞춰져 있다.'}
],

diagram:{type:'flow', cap:'t5x가 감싸는 다섯 기능 축과 그 아래에서 실제로 일하는 오픈소스 컴포넌트. 진한 상자가 t5x가 제공하는 상위 API, 아래 옅은 상자가 그 구현을 담당하는 라이브러리다.',
 nodes:[
  {t:'데이터 · 평가', s:'seqio'},
  {t:'체크포인팅', s:'TensorStore'},
  {t:'설정', s:'Gin'},
  {t:'모델', s:'Flax/Flaxformer', acc:true},
  {t:'파티셔닝', s:'jax.pjit · XLA GSPMD'}
 ]},

numbers:[
 {k:'내부 사용자', v:'1,000명 이상', d:'Google 내부에서 t5x·seqio를 쓰는 팀·개인 수'},
 {k:'TPU 실행 횟수', v:'수십만 회', d:'논문 발표 시점까지 Google 내부에서 t5x가 TPU에 launch된 횟수'},
 {k:'학습 규모', v:'수백억 파라미터 · 수 TB 데이터셋', d:'논문이 명시한 실사용 학습 스케일'},
 {k:'개발 시작 ~ 오픈소스화', v:'2020년 가을 → 2021년 10월', d:'프로젝트 시작부터 공개까지 약 1년'},
 {k:'공개 체크포인트', v:'T5 · T5.1.1 · mT5 · ByT5', d:'"Minimal" 구현으로 재현 가능하게 제공되는 모델 계열'}
],

impact:'t5x는 [T5](#/p/t5) 계열 모델을 계속 발전시키는 데 필요한 학습 인프라를 프레임워크 전환(TF→JAX)까지 감수하며 다시 짠 사례다. 모델 코드와 데이터 파이프라인을 분리하고 파티셔닝을 선언적으로 다루게 하면서, 새 아키텍처 변형이나 새 스케일로 옮겨갈 때마다 병렬화 코드를 다시 짜는 비용을 크게 줄였다. 결정적 데이터 파이프라인 같은 지루하지만 필수적인 재현성 장치를 라이브러리 기본값으로 만든 것이, 이후 대규모 모델 연구에서 "결과가 재현되는가"를 인프라 수준에서 보장하는 선례가 되었다.',

legacy:[
 '이후 [PaLM](#/p/palm)을 비롯한 Google의 대형 언어모델 학습 스택이 JAX + pjit 계열로 수렴하는 데 t5x가 참조 구현 역할을 함',
 'seqio의 task 기반 데이터 API가 프레임워크에 종속되지 않는 평가 파이프라인 설계의 참조점이 됨',
 '결정적 파이프라인·분산 체크포인팅 같은 "지루한 인프라"를 논문으로 공개한 선례가, 이후 학습 프레임워크 논문들이 재현성 장치를 명시적으로 다루게 만듦',
 'Flax/Flaxformer와 결합해 JAX 생태계가 대규모 Transformer 학습의 실전 선택지로 자리잡는 데 기여'
],

pitfalls:[
 '**t5x 자체는 새 모델 아키텍처가 아니다.** T5·mT5·ByT5·LaMDA류 decoder-only 설정을 재현 가능하게 학습시키는 인프라 논문이며, 모델 성능 개선을 주장하지 않는다.',
 '**파이프라인 병렬성(pipeline parallelism)을 의도적으로 지원하지 않는다.** 저자들은 TPU의 칩 간 상호연결이 이미 GPU 노드 내 수준으로 빠르면서도 수천 칩까지 확장되기 때문에 데이터·모델 병렬성만으로 충분하다고 설명한다 — 이는 TPU에 최적화된 설계 선택이지, 모든 하드웨어에 보편적으로 적용되는 결론이 아니다.',
 '**"수백억 파라미터를 학습했다"는 수치는 t5x 자체의 벤치마크가 아니라 Google 내부 사용 실적이다.** 이 논문은 특정 태스크에서의 성능 표를 제시하지 않으므로, 다른 학습 인프라(Megatron, DeepSpeed)와의 정량적 속도·효율 비교 자료로 쓸 수 없다.'
],

figures:[
 {f:'fig1-structure.png',
  cap:'t5x가 감싸는 다섯 기능(진한 상자: Datasets & Eval, Checkpointing, Config, Models, Partitioning) 각각이 실제로 어떤 오픈소스 라이브러리(옅은 상자) 위에서 구현되는지 보여준다. Models 아래 Flaxformer와 Minimal은 같은 Flax 기반이지만 추상화 수준이 다른 두 구현 경로다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'t5x simplifies the process of building and training large language models at scale while maintaining ease of use, and seqio provides a task-based API for simple creation of fast and reproducible training data and evaluation pipelines.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2203.17189 — Scaling Up Models and Data with t5x and seqio', u:'https://arxiv.org/abs/2203.17189'},
 {t:'GitHub — google-research/t5x', u:'https://github.com/google-research/t5x'},
 {t:'GitHub — google/seqio', u:'https://github.com/google/seqio'}
]
});
