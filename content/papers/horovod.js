WIKI.paper({
slug:'horovod',
venue:'arXiv 2018 (Uber Engineering)',
authors:'Sergeev & Del Balso (Uber)',
arxiv:'1802.05799',

tldr:'파라미터 서버 없이 **링 올리듀스(ring-allreduce)** 로 다중 GPU 데이터 병렬 학습을 단순화한 라이브러리. TensorFlow 표준 분산 API가 128 GPU에서 자원의 절반을 통신 오버헤드로 잃는 문제를, MPI 기반 올리듀스 한 줄(`allreduce()`)로 대체해 90% 이상의 확장 효율을 냈다.',

context:'Uber는 모델이 한 서버 안에 들어갈 만큼 작아도 데이터셋이 커지면서 학습에 일주일 이상 걸리는 문제에 부딪혔다. 표준 분산 TensorFlow(파라미터 서버 방식)를 써보니 두 가지 벽이 있었다. 첫째, `tf.Server()`·`tf.ClusterSpec()`·`SyncReplicasOptimizer` 같은 개념을 전부 이해해야 코드를 고칠 수 있어 진입장벽이 높았다. 둘째, 실측 결과 128개 NVIDIA Pascal GPU로 Inception V3·ResNet-101을 학습시키면 **GPU 자원의 거의 절반을 통신 오버헤드로 날렸다**. 같은 시기 Facebook이 [ResNet-50을 256 GPU로 1시간에](#/p/lr-scaling) 학습시킨 성과가 나오면서, 분산 학습이 제대로 확장되기만 하면 얻을 수 있는 이득이 명확해졌다.',

ideas:[
 {h:'파라미터 서버를 없애고 올리듀스로 대체한다',
  lead:'중앙 서버가 경사를 모으는 대신, 모든 워커가 대등하게 통신해 평균을 나눠 가진다.',
  d:'파라미터 서버 방식은 워커가 경사를 중앙 서버로 보내고 평균을 받아오는 star 토폴로지라, 서버 수와 워커 수의 비율을 잘못 잡으면 서버가 병목이 되거나 자원이 낭비된다. Horovod는 이 역할 구분 자체를 없애고, 모든 노드가 동등하게 참여하는 **올리듀스** 연산 하나로 경사 평균을 구한다.'},
 {h:'링 올리듀스: 노드끼리 이웃과만 통신해 대역폭을 최적으로 쓴다',
  lead:'N개 노드가 원형으로 배치돼 각자 이웃 2개와만 $2(N-1)$번 통신해 경사를 합산·분배한다.',
  d:'각 노드는 자기 버퍼를 청크로 나눠 옆 노드로 보내고 받는다. 처음 $N-1$번의 라운드에서는 받은 값을 자기 버퍼에 더하고(reduce), 다음 $N-1$번의 라운드에서는 받은 값으로 버퍼를 교체한다(broadcast). Patarasuk과 Yuan(2009)이 보인 것처럼 버퍼가 충분히 크면 이 방식이 **대역폭 최적**이다 — 중앙 서버를 거치지 않아 병목 노드가 생기지 않는다.'},
 {h:'MPI로 구현을 감추고 한 줄 API로 노출한다',
  lead:'`mpirun`으로 여러 노드에 프로세스를 띄우고, 사용자는 옵티마이저를 `allreduce()`로 감싸기만 하면 된다.',
  d:'Baidu가 먼저 TensorFlow 포크로 시연한 ring-allreduce 아이디어를 가져와, MPI(Open MPI)로 프로세스 배치·통신 설정을 자동화하고 NCCL로 GPU 간 통신을 최적화했다. 사용자 코드 변경은 옵티마이저를 HorovodOptimizer로 감싸는 것과 rank별 데이터 분할 정도로 최소화된다.'},
 {h:'텐서 퓨전으로 작은 텐서들의 통신 오버헤드를 줄인다',
  lead:'여러 작은 텐서를 하나의 버퍼에 모아 한 번의 올리듀스로 합쳐 보낸다.',
  d:'링 올리듀스는 텐서가 충분히 커야 대역폭을 최적으로 쓴다. 층이 많은 모델은 작은 텐서(경사)가 많아 이 조건이 깨지므로, 준비된 텐서들을 기본 64MB 버퍼에 복사해 한 번의 올리듀스로 처리하는 Tensor Fusion을 추가했다. 최적화되지 않은 TCP 네트워크에서 최대 65% 성능 향상을 관측했다.'}
],

diagram:{type:'compare', cap:'파라미터 서버 방식과 링 올리듀스 방식의 통신 구조 차이.',
 left:{t:'기존: 파라미터 서버', items:['워커→서버로 경사 전송','서버가 평균 계산 후 재배포','서버:워커 비율 튜닝 필요']},
 right:{t:'Horovod: 링 올리듀스', items:['중앙 서버 없음','이웃 노드와만 2(N-1)번 통신','대역폭 최적, 병목 노드 없음']}
},

numbers:[
 {k:'표준 분산 TF 손실', v:'128 GPU에서 자원 절반 소실', d:'통신 오버헤드로 이상적 선형 확장 대비 거의 50% 성능 손실(Fig.1)'},
 {k:'Horovod 확장 효율', v:'90% 초과', d:'Inception V3·ResNet-101을 NVIDIA Pascal GPU 128개, 25GbE TCP 환경에서 측정(RDMA 없이도 달성)'},
 {k:'Tensor Fusion 효과', v:'최대 65% 향상', d:'레이어 수가 많은 모델을 최적화되지 않은 TCP 네트워크에서 학습할 때'},
 {k:'기준 성과(Facebook)', v:'ResNet-50, 256 GPU, 1시간', d:'Horovod 개발 동기가 된 대규모 분산 학습의 선행 사례로 원문이 직접 인용'},
 {k:'Tensor Fusion 버퍼', v:'기본 64MB', d:'여러 작은 텐서를 이 버퍼에 모아 한 번에 올리듀스 수행'}
],

impact:'분산 학습을 "파라미터 서버 개념을 이해해야 쓸 수 있는 것"에서 "옵티마이저를 한 줄로 감싸는 것"으로 단순화했다. 성능 면에서도 파라미터 서버 방식의 구조적 병목(서버:워커 비율 튜닝)을 없애고 90%대 확장 효율을 실측으로 보여, 이후 PyTorch `DistributedDataParallel`을 비롯한 여러 프레임워크가 링 올리듀스를 기본 데이터 병렬 통신 방식으로 채택하는 흐름을 이끌었다. 다만 이 논문 자체는 데이터 병렬만 다루며, 모델이 한 GPU 메모리를 넘어서는 경우(모델 병렬)는 다루지 않는다는 한계를 스스로 명시한다.',

legacy:[
 '**데이터 병렬 통신의 사실상 표준화** — 이후 PyTorch DDP 등 주요 프레임워크가 링 올리듀스를 기본 그래디언트 동기화 방식으로 채택',
 '**모델 병렬 계열과의 역할 분담** — Horovod가 다루지 않는 "모델이 GPU 하나에 안 들어가는" 문제는 [Megatron](#/p/megatron)의 텐서 병렬, [GSPMD](#/p/gspmd)·[Alpa](#/p/alpa)의 자동 병렬화로 이어짐',
 '**메모리 샤딩과의 결합** — [ZeRO](#/p/zero)·[FSDP](#/p/fsdp)는 데이터 병렬 통신 자체는 유지하면서 옵티마이저·파라미터 상태를 샤딩해, Horovod류 통신 패턴의 메모리 한계를 보완하는 다음 단계를 열었다',
 '**프로파일링 도구의 선례** — 통신 병목을 시각적으로 진단하는 Horovod Timeline이 이후 분산 학습 디버깅 도구들의 참조 사례가 됨'
],

pitfalls:[
 '**링 올리듀스가 항상 파라미터 서버보다 낫다는 뜻은 아니다.** 텐서가 작을 때(레이어가 잘게 쪼개진 모델)는 통신 라운드 수가 많아져 오버헤드가 커지므로 Tensor Fusion 같은 보완이 필요하다.',
 '**MPI 클러스터 설치 자체가 진입장벽으로 남는다.** 워크스테이션에서는 쉽지만, 클러스터 환경에서 MPI·네트워크 드라이버를 세팅하는 과정은 논문이 스스로 "앞으로 개선할 점"으로 남겨둔 부분이다.',
 '**Horovod는 데이터 병렬 전용이다.** 모델 자체가 한 GPU 메모리를 넘는 경우를 다루지 않으며, 이는 이후 등장한 모델 병렬·파이프라인 병렬 연구의 영역이다.'
],

figures:[
 {f:'fig4-ring-allreduce.png',
  cap:'3개 워커가 각자의 버퍼 조각을 옆 노드로 주고받으며 단계별로 합산(②③)한 뒤 결과를 전파(④⑤)한다. 중앙 서버 없이 이웃끼리만 통신한다는 점이 파라미터 서버 방식과의 핵심 차이.',
  src:'원문 Figure 4, p.4'},
 {f:'fig6-scaling.png',
  cap:'GPU 수를 1→128로 늘릴 때 초당 처리 이미지 수. 흰 막대(Ideal)에 가장 가까운 것이 Horovod(청록)이고, 표준 분산 TensorFlow(주황)는 GPU가 늘수록 이상적 확장에서 점점 멀어진다.',
  src:'원문 Figure 6, p.7'}
],

quotes:[
 {t:'We found that using a version of the ring-allreduce algorithm, we could significantly improve both usability and performance of distributed training.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1802.05799 — Horovod: fast and easy distributed deep learning in TensorFlow', u:'https://arxiv.org/abs/1802.05799'},
 {t:'공식 저장소 (horovod/horovod)', u:'https://github.com/horovod/horovod'}
]
});
