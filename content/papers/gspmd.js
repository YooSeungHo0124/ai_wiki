WIKI.paper({
slug:'gspmd',
venue:'arXiv 2021',
authors:'Xu, Lee, Chen, Hechtman, Huang, Joshi, Krikun, Lepikhin, Ly, Maggioni, Pang, Shazeer, Wang, Wang, Wu, Chen (Google)',
arxiv:'2105.04663',

tldr:'텐서를 어떻게 나눌지 사람이 직접 코드를 고치는 대신, **몇 개의 샤딩 힌트만 주면 XLA 컴파일러가 나머지 연산 그래프 전체로 그 분할을 자동 전파**하도록 만든 시스템. 데이터·모델·파이프라인·MoE 병렬을 하나의 표현으로 통일했다.',

context:'2021년 시점 대규모 모델 학습은 데이터 병렬·[텐서(within-layer) 병렬](#/p/megatron)·[파이프라인 병렬](#/p/pipedream)·MoE 전문가 병렬을 조합해야 했는데, 이들을 조합할 때마다 모델 코드 자체를 병렬화 전략에 맞춰 다시 작성해야 했다. [GShard](#/p/gshard)가 MoE 모델 하나에 한정해 샤딩 어노테이션과 자동 전파라는 아이디어를 처음 보였지만, MoE 바깥의 일반적인 연산 그래프로는 확장되지 않았다. GSPMD는 이 백엔드를 MoE 특화에서 떼어내 XLA의 모든 연산자에 대해 일반화한다 — 사용자는 여전히 단일 장치용 코드를 쓰고, 텐서 몇 개에만 분할 방식을 표시한다.',

ideas:[
 {h:'세 가지 샤딩 타입으로 모든 병렬화를 표현',
  lead:'replicated·tiled·partially-tiled 세 가지 텐서 분할 방식만으로 데이터/모델/MoE 병렬을 통일 표현한다.',
  d:'Replicated는 모든 장치가 전체 데이터를 갖는 것, tiled는 텐서를 장치 격자(device mesh)의 각 축에 나눠 담아 중복이 전혀 없는 것, partially tiled는 장치를 부분군으로 나눠 부분군끼리는 tiled, 부분군 내부에서는 replicated로 두는 것이다. `mesh_split(tensor, device_mesh, dims_mapping)` 하나의 API로 이 세 가지를 전부 표현하며, 데이터 병렬은 배치 차원을 tiled로, 모델 병렬은 feature 차원을 tiled로 지정하는 것일 뿐 근본적으로 같은 연산이다.'},
 {h:'sharding completion: 몇 개의 주석에서 그래프 전체로 전파',
  lead:'사용자가 표시한 일부 텐서의 샤딩에서 출발해 컴파일러가 연쇄적으로 나머지 텐서의 샤딩을 추론한다.',
  d:'예를 들어 `BD,DF→BF` 형태의 Einsum(행렬곱)에서 입력 두 개에만 mesh_split을 걸어두면, GSPMD는 출력 텐서가 배치 차원은 데이터 병렬 축으로, 특징 차원은 모델 병렬 축으로 자동 분할돼야 한다는 것을 유도해 `mesh_split(bf, mesh, [0,1])`을 스스로 채운다. 이 sharding completion과 실제로 각 연산자를 쪼개 통신 연산(AllReduce·AllGather·ReduceScatter 등)을 삽입하는 per-operator partitioning은 서로 독립된 두 컴파일 패스로 분리돼 있다.'},
 {h:'파이프라인 병렬도 텐서 샤딩 문제로 환원',
  lead:'모든 스테이지를 같은 서브계산으로 보고, 레이어 축을 장치 메시의 한 차원으로 다뤄 파이프라이닝을 일반 샤딩과 같은 틀에 넣는다.',
  d:'파이프라인 병렬은 개별 연산자가 아니라 그래프 자체를 스테이지로 나누는 것이라 원래는 텐서 샤딩과 다른 문제다. GSPMD는 "레이어들이 같은 형태의 서브계산을 반복한다"는 흔한 패턴을 이용해, 레이어 축을 장치 메시의 한 차원(L)으로 두고 그 축을 따라 가중치·활성값을 분할하는 방식으로 파이프라이닝을 일반 텐서 샤딩 문제로 환원한다. 그 결과 [GPipe](#/p/gpipe) 스타일 스케줄과 within-layer 샤딩을 같은 프레임워크 안에서 중첩해 쓸 수 있다.'},
 {h:'SPMD: 파티션이 몇 개든 프로그램은 하나',
  lead:'장치마다 다른 프로그램을 컴파일하지 않고 하나의 프로그램을 모든 파티션이 공유해 컴파일 시간을 줄인다.',
  d:'분할된 파티션 수만큼 별도 프로그램을 생성하면 파티션이 수천 개로 늘 때 컴파일 시간이 감당할 수 없이 커진다. GSPMD는 Single Program Multiple Data 방식으로 모든 파티션이 같은 컴파일된 프로그램을 실행하되 자신의 장치 ID에 따라 다른 데이터 조각을 처리하게 해서, TPU 코어 2048개 규모까지 컴파일 시간을 감당 가능하게 만든다.'}
],

diagram:{type:'flow', cap:'사용자는 텐서 몇 개에만 mesh_split 힌트를 주고, 나머지는 컴파일러 패스 두 단계가 채운다.',
 nodes:[
  {t:'단일 장치 코드', s:'병렬화 코드 없음'},
  {t:'mesh_split 주석', s:'입력 텐서 일부만', a:'힌트'},
  {t:'샤딩 완성', s:'그래프 전체로 전파', acc:true, a:'자동 추론'},
  {t:'연산자별 파티셔닝', s:'AllReduce 등 통신 삽입'},
  {t:'파티션된 실행', s:'TPU 최대 2048코어'}
 ]},

math:[
 {expr:'BD, DF → BF  (Einsum 예시)',
  tex:'BD,\\;DF \\;\\rightarrow\\; BF',
  d:'완전연결층의 행렬곱을 아인슈타인 표기로 쓴 것. $B$는 배치(양쪽·출력에 공통인 embarrassingly-parallel 차원), $D$는 contracting 차원(합산되어 사라짐), $F$는 non-contracting 차원(한쪽 피연산자·출력에만 존재). $BD$를 mesh 차원 0으로, $DF$를 mesh 차원 1로 쪼개면 GSPMD가 출력 $BF$의 샤딩을 자동으로 $[0,1]$로 완성해 데이터 병렬과 모델 병렬이 동시에 적용된다.'}
],

numbers:[
 {k:'FLOPS 활용률', v:'50~62%', d:'TPUv3 코어 최대 2048개, 파라미터 최대 1조 개 모델 기준(Abstract)'},
 {k:'1조 파라미터 모델 활용률', v:'47.5%', d:'512B~1T 구간 중 가장 깊고 좁은 512B 구성에서 낮은 값 기록, 1T 구성(더 얕고 넓음)은 오히려 개선'},
 {k:'32층 모델 확장성', v:'장치 2배 → 배치 2배, 스텝시간 오차 10% 이내', d:'거의 선형에 가까운 메모리·성능 확장(5.1절)'},
 {k:'파이프라인 vs 2D 샤딩 비교', v:'최고 파이프라인 설정도 2D 샤딩보다 24% 느림', d:'같은 모델(6.47B) 기준, 버블·rematerialization 오버헤드 때문(5.2절, Table 4)'},
 {k:'MoE 모델, 전문가 2048개', v:'장치 2048개, 배치 8192', d:'전문가 수·배치가 함께 선형으로 늘어나는 구성(Table 6)'}
],

impact:'모델 병렬화를 "사용자가 코드로 짜 넣는 것"에서 "컴파일러가 몇 개의 힌트로부터 완성하는 것"으로 바꿨다. XLA라는 공통 IR 위에서 동작하기 때문에 TensorFlow·JAX·PyTorch 어디서든 같은 방식으로 초대형 모델을 파티션할 수 있게 됐고, 데이터·텐서·파이프라인·MoE 병렬을 하나의 표현(mesh_split)으로 자유롭게 중첩할 수 있는 길을 열었다.',

legacy:[
 '**[GShard](#/p/gshard)에서 일반화** — GShard가 MoE 전용으로 처음 보인 샤딩 어노테이션+자동 전파를 XLA의 전체 연산자 집합으로 확장한 것이 GSPMD',
 '**[PaLM](#/p/palm)** — Google의 Pathways 시스템이 GSPMD를 파티셔너로 써서 TPU 6144개 규모로 학습됨',
 '**JAX의 `pjit`/`shard_map`** — GSPMD의 sharding annotation·완성 방식이 JAX 생태계의 표준 분산 학습 API로 자리잡음',
 '**Alpa 등 후속 자동 병렬화 연구** — "사람이 힌트를 주고 컴파일러가 나머지를 채운다"는 접근 자체가 이후 자동 병렬화 탐색 시스템들의 출발점이 됨'
],

pitfalls:[
 '**파이프라인 병렬은 완전 자동이 아니다.** 3.3절이 명시하듯 GSPMD의 파이프라이닝 지원은 "모든 스테이지가 같은 서브계산을 반복한다"는 제약 하에서만 텐서 샤딩 문제로 환원되며, 별도의 wrapper 라이브러리가 필요하다.',
 '**활용률이 항상 60%대는 아니다.** 512B 파라미터 구성처럼 층이 깊고 배치가 작아지는 조합에서는 47.5%까지 떨어진다 — 논문이 강조하는 50~62%는 여러 구성 중 "대부분"에 해당하는 범위이지 보장치가 아니다.',
 '**파이프라이닝이 2D 샤딩보다 항상 유리하지 않다.** 저자들 스스로 Table 4에서, 버블과 rematerialization 오버헤드 때문에 최적 파이프라인 설정도 순수 2D(데이터+모델) 샤딩보다 24% 느렸다고 보고한다.'
],

figures:[
 {f:'fig1-sharding-types.png',
  cap:'네 장치(0~3)에 걸친 텐서 하나를 세 가지로 나눈 예. 왼쪽 위(Replicated)는 모든 장치가 같은 데이터 전체를, 왼쪽 아래(Tiled)는 4등분해 중복 없이, 오른쪽(Partially Tiled)은 [[0,1],[2,3]] 두 부분군으로 나눠 부분군 안에서는 복제하고 부분군 사이에서는 다른 데이터를 갖는다. 이 세 패턴의 조합만으로 데이터·모델·MoE 병렬이 전부 표현된다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'It allows users to write programs in the same way as for a single device, then give hints through a few annotations on how to distribute tensors, based on which GSPMD will parallelize the computation.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2105.04663 — GSPMD: General and Scalable Parallelization for ML Computation Graphs', u:'https://arxiv.org/abs/2105.04663'},
 {t:'XLA 컴파일러 문서', u:'https://www.tensorflow.org/xla'}
]
});
