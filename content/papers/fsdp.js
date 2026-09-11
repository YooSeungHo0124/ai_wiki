WIKI.paper({
slug:'fsdp',
venue:'VLDB 2023 (PVLDB)',
authors:'Zhao, Gu, Varma, Luo et al. (Meta AI)',
arxiv:'2304.11277',

tldr:'파라미터·경사·옵티마이저 상태를 GPU들에 **균등하게 샤딩**해, 단일 GPU 메모리를 넘는 모델도 DDP와 거의 같은 사용 경험으로 학습하게 만든 PyTorch 공식 구현 보고서. [ZeRO](#/p/zero)에서 영감을 받았지만 Broadcast/Gather 대신 **all-gather/reduce-scatter**를 쓰는 다른 통신 설계를 택했다.',

context:'PyTorch의 기존 분산 학습 표준인 DDP는 각 GPU가 모델 전체 복제본과 옵티마이저 상태를 들고 있다 — 파라미터 10억 개만 넘어도 40GB GPU에서 메모리 부족이 난다. [Megatron](#/p/megatron)류 파이프라인·텐서 병렬은 모델 코드를 수정하고 마이크로배치·스테이지 수를 세밀히 튜닝해야 해 진입장벽이 높다. DeepSpeed의 [ZeRO](#/p/zero)는 파라미터·경사·옵티마이저 상태를 샤딩해 메모리를 줄이는 길을 열었지만, PyTorch 코어와 별도로 개발된 외부 라이브러리라 프레임워크 변화에 취약하다. Meta는 PyTorch 자체에 통합된 네이티브 솔루션으로 같은 목표를 다시 설계한다.',

ideas:[
 {h:'모델을 FSDP 유닛으로 쪼개고 유닛 단위로만 파라미터를 복원한다',
  lead:'전체 모델을 한 번에 들지 않고, 계산 중인 유닛 하나의 파라미터만 잠깐 all-gather로 모았다가 바로 버린다.',
  d:'모델을 여러 FSDP 유닛으로 나누고, forward·backward 내내 대부분의 시간에는 각 GPU가 샤딩된 조각만 갖고 있는다. 지금 계산할 유닛 차례가 오면 all-gather로 그 유닛의 파라미터만 잠깐 완전한 형태로 복원(unshard)해 계산한 뒤 즉시 다시 해제한다. 그 결과 피크 메모리는 "샤딩된 모델 전체 + 가장 큰 유닛 하나"에 비례한다.'},
 {h:'FlatParameter: 유닛 안의 파라미터를 하나로 합쳐 통신을 묶는다',
  lead:'한 유닛의 모든 파라미터를 1차원 텐서 하나로 이어붙여, 통신 횟수를 유닛당 1번으로 줄인다.',
  d:'유닛에 속한 파라미터들을 펼쳐서(flatten) 이어붙이고 샤딩 인자 $F$ 로 나누어떨어지도록 오른쪽을 패딩한 뒤, $F$개의 균등한 청크로 잘라 각 랭크에 하나씩 배정한다. 작은 텐서마다 따로 통신하면 컬렉티브 효율이 급격히 떨어진다는 실측(대략 3,300만 원소 미만에서 통신 시간이 급증)이 이 설계의 근거다.'},
 {h:'샤딩 인자 F로 메모리-처리량 트레이드오프를 연속적으로 조절한다',
  lead:'F=1이면 완전 복제(DDP와 동일), F=W면 완전 샤딩, 그 사이는 하이브리드 샤딩이다.',
  d:'전역 GPU 수 $W$ 에 대해 샤딩 인자 $F$ 를 정하면, 랭크들은 $W/F$개의 샤딩 그룹으로 나뉘어 그룹 내에서는 샤딩, 그룹 간에는 복제된다. 데이터센터가 흔히 쓰는 fat-tree 토폴로지에서 $F$를 노드 내부 GPU 수로 맞추면 all-gather·reduce-scatter가 고대역폭 노드 내부로 한정돼 cross-host 트래픽을 크게 줄인다.'},
 {h:'통신과 계산을 겹쳐 유닛 전환의 병목을 숨긴다',
  lead:'다음 유닛의 all-gather를 별도 CUDA 스트림에서 미리 시작해 현재 유닛의 계산과 겹친다.',
  d:'forward는 이전 계산이 끝나야 다음 유닛의 파라미터가 필요한지 알 수 있어(DDP의 backward처럼 통신이 계산에 선행하는 구조와 달리) 별도 스트림으로 backward prefetch·forward prefetch를 걸어 통신을 계산 뒤에 겹친다. 또한 in-flight 파라미터 수를 제한하는 rate limiter로 CPU가 GPU 메모리 할당을 과도하게 앞서가는 것을 막는다.'}
],

diagram:{type:'stack', cap:'6층 모델을 3개 FSDP 유닛으로 감싼 예. forward에서 유닛 실행 직전 all-gather로 완전한 파라미터를 모으고, 끝나면 즉시 peer shard를 버린다.',
 layers:[
  {t:'Unit0 layer0', s:'상시 샤딩 유지'},
  {t:'Unit1 layer1-2', s:'실행 직전 all-gather', acc:true, note:'실행 후 즉시 해제'},
  {t:'Unit2 layer4-5', s:'실행 직전 all-gather'},
  {t:'backward 경사', s:'reduce-scatter로 동기화'}
 ]},

math:[
 {expr:'Σ_{r=1..W} g_r = Σ_{i=1..W/F} Σ_{r∈S_i} g_r',
  tex:'\\sum_{r=1}^{W} g_r = \\sum_{i=1}^{W/F} \\sum_{r \\in S_i} g_r',
  d:'하이브리드 샤딩에서 경사 총합을 두 단계로 분해하는 식. 전체 all-reduce 하나 대신, 샤딩 그룹 $S_i$ 내부의 reduce-scatter와 복제 그룹 간의 all-reduce로 나눠 수행해도 같은 결과를 얻는다.'}
],

numbers:[
 {k:'평가 규모', v:'최대 512개 80GB A100', d:'GPT-175B(minGPT 스타일)·T5-11B·DHEN 추천 모델 등으로 검증'},
 {k:'GPT-175B TFLOPS/GPU', v:'배치1: 173+ · 배치2: 186+', d:'BF16 텐서코어 이론 최대 312 TFLOPS 대비 실측치, 128 GPU 기준'},
 {k:'backward prefetch 효과', v:'약 18% 속도 향상', d:'통신 오버헤드가 큰 GPT-175B에서 prefetch를 켰을 때 TFLOPS 이득'},
 {k:'DDP 대비', v:'소형 모델에서 동등 성능', d:'모델이 작을 때는 FSDP도 DDP와 비슷한 처리량을 내면서, 큰 모델에서는 거의 선형적으로 확장'},
 {k:'컬렉티브 효율 임계값', v:'약 3,300만 원소', d:'All-Gather 크기가 이보다 작아지면 통신 시간이 급격히 늘어남 — FlatParameter로 묶어야 하는 이유'}
],

impact:'"모델이 GPU 메모리보다 크면 코드를 다시 짜야 한다"는 장벽을, PyTorch 네이티브 API 수준에서 DDP와 거의 동일한 사용 경험으로 낮췄다. [ZeRO](#/p/zero)가 증명한 "상태를 샤딩해 메모리를 줄인다"는 아이디어를 유지하면서도, 프레임워크 외부 라이브러리가 아니라 autograd·컬렉티브 통신과 직접 맞물리는 네이티브 구현으로 재설계해 배포 안정성과 커스터마이징 가능성을 높였다. deferred initialization으로 거대 모델을 더미 디바이스에서 만들고 유닛 단위로만 실제 GPU에 올리는 설계는, 이후 초대형 모델 초기화 문제 전반의 참조 패턴이 됐다.',

legacy:[
 '**PyTorch 표준 분산 학습 API로 정착** — PyTorch 2.0부터 베타로 포함되어 이후 버전에서 DDP와 나란한 주요 병렬화 옵션이 됨',
 '**[ZeRO](#/p/zero)와의 계보를 명시** — 저자들 스스로 ZeRO와 cross-replica sharding이 설계에 영감을 줬다고 밝히면서도, Broadcast/Gather 대신 all-gather/reduce-scatter라는 다른 통신 원시 연산을 택해 워크로드 불균형을 줄였다고 구분함',
 '**하이브리드 샤딩이 후속 대형 모델 학습 레시피의 기본값으로 확산** — 노드 내부는 완전 샤딩, 노드 간은 복제하는 조합이 데이터센터 토폴로지를 활용하는 표준 패턴으로 자리잡음',
 '**[Alpa](#/p/alpa)류 자동 병렬화와의 역할 분담** — FSDP는 데이터 병렬 통신 패턴 안에서 메모리를 줄이는 축이고, 연산 배치·파이프라인 스테이지 결정은 별도 컴파일러 계열(Alpa, Megatron)의 영역으로 남음'
],

pitfalls:[
 '**"ZeRO를 그대로 재구현한 것"이 아니다.** 파라미터를 유닛 단위 FlatParameter로 묶고 all-gather/reduce-scatter로 통신한다는 점에서 ZeRO의 per-parameter 샤딩·Broadcast/Gather 방식과 통신 설계가 다르다 — 목표는 같지만 구현은 "본질적으로 다르다"고 원문이 명시한다.',
 '**FlatParameter 세분화는 메모리-처리량 트레이드오프다.** 유닛을 잘게 쪼갤수록 피크 메모리는 줄지만 컬렉티브 통신 횟수가 늘어 처리량이 떨어질 수 있다 — 무조건 잘게 쪼개는 것이 능사가 아니다.',
 '**하이브리드 샤딩의 이득은 클러스터 토폴로지에 의존한다.** 샤딩 인자 $F$ 를 노드 내부 GPU 수에 맞추는 이득은 fat-tree형 오버서브스크라이브 네트워크를 전제로 한 것이라, 다른 토폴로지에서는 그대로 적용되지 않을 수 있다.'
],

figures:[
 {f:'fig1-overview.png',
  cap:'6층 모델을 3개 FSDP 유닛(Unit0·1·2)으로 감싼 예. 오른쪽 Forward/Backward 열이 핵심 — 유닛을 실행하기 직전에만 "gather full params"로 완전한 파라미터를 모으고, 실행이 끝나면 곧바로 "free peer shards"로 자기 몫만 남기고 버린다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'ZeRO and cross-replica sharding inspired the FSDP design, but FSDP is intrinsically different. Prior work employs model partitioning or per-parameter sharding to distribute parameter tensors, and rely on Broadcast and Gather collective communication primitives to synchronize values.',
  src:'Related Work, p.13'}
],

links:[
 {t:'arXiv 2304.11277 — PyTorch FSDP: Experiences on Scaling Fully Sharded Data Parallel', u:'https://arxiv.org/abs/2304.11277'},
 {t:'PyTorch FSDP 공식 문서', u:'https://pytorch.org/docs/stable/fsdp.html'}
]
});
