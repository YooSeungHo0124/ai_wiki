WIKI.paper({
slug:'datacomp',
venue:'NeurIPS 2023 (Datasets and Benchmarks Track)',
authors:'Gadre, Ilharco, Fang et al. (UW · Columbia · Tel Aviv · Apple · UT Austin · LAION 등 공동)',
arxiv:'2304.14108',

tldr:'모델과 학습 코드는 고정하고 **데이터셋 자체를 실험 변인**으로 바꾼 벤치마크. 12.8B개 이미지-텍스트 쌍 후보 풀(CommonPool)에서 어떻게 골라내느냐만 바꿔 [CLIP](#/p/clip)을 학습시키고 38개 downstream 과제로 순위를 매긴다.',

context:'2023년 초 시점, [CLIP](#/p/clip)·Stable Diffusion·GPT-4 같은 멀티모달 모델의 성능 차이는 아키텍처보다 학습에 쓴 데이터셋에서 갈리는 경우가 많았다. 그런데 데이터셋 쪽은 연구 관행이 정반대였다. 손실 함수·아키텍처는 수천 건의 ablation으로 다뤄지는 반면, [LAION-5B](#/p/laion5b) 같은 대형 데이터셋은 "어떤 필터링을 거쳤는가"가 결과에 얼마나 영향을 주는지 체계적으로 검증된 적이 없었다. 벤치마크 관행 자체가 "데이터셋은 고정, 모델을 바꿔가며 경쟁"하는 구조였기 때문이다(ImageNet 고정 후 아키텍처 경쟁이 대표적이다). DataComp은 이 축을 뒤집는다. **학습 코드·아키텍처·연산량을 전부 고정하고, 참가자가 제출하는 것은 오직 데이터셋(또는 데이터를 고르는 함수)뿐**이다.',

ideas:[
 {h:'모델을 고정하고 데이터를 변인으로',
  lead:'학습 코드·연산량을 통제해 "어떤 데이터가 좋은가"를 재현 가능한 실험으로 바꾼다.',
  d:'기존 벤치마크는 데이터셋을 고정한 채 모델을 경쟁시켰다. DataComp은 반대로 CLIP 학습 코드와 하이퍼파라미터, 총 연산량(MACs)을 스케일별로 고정하고, 참가자가 바꿀 수 있는 것은 학습에 넣는 이미지-텍스트 쌍의 구성뿐으로 제한한다. 그 결과 데이터셋 A와 B의 성능 차이가 온전히 데이터 선택의 효과로 귀속된다.'},
 {h:'CommonPool: 12.8B쌍짜리 공유 원재료',
  lead:'Common Crawl에서 추출한 128억 쌍의 미가공 이미지-텍스트 풀을 공개 인덱스로 배포한다.',
  d:'2014~2022년 Common Crawl 스냅샷에서 이미지 URL과 alt-text를 추출해 약 88B 후보를 만들고, 다운로드·NSFW 제거·평가셋과의 중복 제거·얼굴 블러링을 거쳐 최종 12.8B쌍을 확정했다. CC-BY-4.0 라이선스의 URL-텍스트 인덱스로 배포되며, filtering 트랙 참가자는 이 풀에서 부분집합을 골라내는 방식으로만 경쟁한다.'},
 {h:'두 트랙: filtering vs BYOD',
  lead:'CommonPool에서 걸러내는 filtering 트랙과, 외부 데이터를 자유롭게 쓰는 BYOD 트랙을 분리한다.',
  d:'filtering 트랙은 CommonPool 안에서만 필터링 함수를 설계해 부분집합을 만든다. BYOD(Bring Your Own Data) 트랙은 CC12M·YFCC100M 같은 외부 소스를 자유롭게 조합해도 되지만, 평가셋과 겹치면 안 된다. 데이터셋을 만드는 두 축 — "주어진 소스를 어떻게 거를 것인가"와 "어떤 소스를 모을 것인가" — 을 별개 문제로 분리한 것이다.'},
 {h:'네 개 스케일로 비용 장벽을 낮춘다',
  lead:'풀 크기와 연산량을 12.8M부터 12.8B까지 4자릿수로 나눠 자원별 참여를 허용한다.',
  d:'small(1,280만)·medium(1.28억)·large(12.8억)·xlarge(128억) 네 스케일은 풀 크기와 학습 연산량을 동시에 10배씩 늘린다. small은 A100 1장으로 4시간, xlarge는 GPU 512장으로 81시간이 걸려 개인 연구자부터 대형 랩까지 같은 벤치마크에 참여할 수 있게 설계됐다.'},
 {h:'38개 downstream 과제로 순위를 매긴다',
  lead:'ImageNet·retrieval·분포 이동 등 38개 표준 평가셋으로 데이터셋 품질을 하나의 점수로 환산한다.',
  d:'제출된 데이터셋으로 학습한 CLIP을 ImageNet, ImageNetV2, DTD, EuroSAT, SUN-397, MSCOCO 등 38개 분류·검색 과제에 zero-shot으로 평가해 평균 성능을 낸다. 여기에 1년 뒤 공개될 비밀 테스트셋 3개를 더해 벤치마크에 대한 과적합(오버피팅)을 견제한다.'}
],

diagram:{type:'flow', cap:'DataComp 참가자 워크플로 — A) 스케일 선택 B) CommonPool 필터링 또는 BYOD로 후보 데이터셋 구성 C) 고정 CLIP 학습 D) 38개 과제 평가.', nodes:[
 {t:'스케일 선택', s:'small~xlarge'},
 {t:'CommonPool', s:'12.8B 후보 쌍'},
 {t:'필터링/BYOD', s:'참가자가 유일하게 바꾸는 부분', acc:true},
 {t:'고정 CLIP 학습', s:'아키텍처·연산량 동일'},
 {t:'38개 과제 평가', s:'zero-shot 평균'}
]},

numbers:[
 {k:'CommonPool 크기', v:'12.8B 쌍', d:'Common Crawl(2014-2022)에서 추출, NSFW·중복 제거 후 확정된 xlarge 풀 크기'},
 {k:'스케일', v:'12.8M / 128M / 1.28B / 12.8B', d:'small/medium/large/xlarge — 풀 크기·학습 샘플 수가 10배씩 증가, 연산량은 $9.5\\times10^{16}$ ~ $1.1\\times10^{21}$ MACs'},
 {k:'평가 과제 수', v:'38개', d:'ImageNet·ImageNetV2·retrieval·분포 이동 등 zero-shot 분류·검색 과제(+비공개 3개)'},
 {k:'best filtering의 개선폭', v:'+6.9pp', d:'xlarge(12.8B) 스케일에서 최고 filtering 베이스라인이 필터링 없는 풀 대비 ImageNet 정확도를 끌어올린 폭'},
 {k:'DataComp-1B', v:'1.4B 쌍 · ImageNet 79.2%', d:'CLIP ViT-L/14를 처음부터 학습, 동일 연산량의 OpenAI CLIP ViT-L/14(75.5%)보다 +3.7pp, [LAION-2B](#/p/laion5b) 기반 ViT-g/14(78.5%)보다도 높으면서 연산량은 약 9분의 1'}
],

impact:'DataComp이 바꾼 것은 결과 하나가 아니라 **연구 관행**이다. "데이터셋은 그냥 있는 걸 쓴다"에서 "데이터셋도 통제된 실험으로 비교 가능하다"로 넘어가면서, 필터링 기법 하나하나를 같은 학습 레시피 위에서 공정하게 줄 세울 수 있게 됐다. 실험적으로도 "무작정 큰 데이터셋"보다 CLIP 점수 기준 상위 30%만 남긴 **더 작고 엄격하게 거른 데이터셋**이 더 잘 일반화된다는, 직관에 반하는 결과를 300건 넘는 베이스라인 실험으로 보였다. 그 최종 산출물인 DataComp-1B는 [LAION-2B](#/p/laion5b)보다 작으면서도 더 높은 zero-shot 정확도를 냈다.',

legacy:[
 '[LAION-5B](#/p/laion5b) 이후 "누가 더 큰 이미지-텍스트 풀을 공개하느냐" 경쟁에, "같은 풀에서 누가 더 잘 거르느냐"라는 별도의 축을 세운 최초의 표준 벤치마크가 됐다',
 'CommonPool과 동일한 URL-인덱스 배포 방식·안전 전처리 파이프라인이 이후 대규모 웹 데이터셋 공개의 참고 관행으로 자리잡았다',
 '텍스트 전용 사전학습 데이터에도 같은 아이디어를 옮긴 DCLM(DataComp-LM) 등, "학습 절차 고정 + 데이터만 경쟁"이라는 방법론이 멀티모달을 넘어 확산됐다',
 '[CLIP](#/p/clip) 학습 레시피 자체를 필터링 품질 측정의 기준자(ruler)로 굳혀, 이후 데이터 큐레이션 논문들이 DataComp 프로토콜 위에서 결과를 보고하는 관례를 남겼다'
],

pitfalls:[
 '**벤치마크 순위는 DataComp이 고정한 CLIP 학습 레시피에 종속적이다.** 필터링 방법의 우열이 다른 아키텍처·목적함수(예: SigLIP류 sigmoid loss)에서도 그대로 유지된다는 보장은 없다.',
 '**전 스케일을 도는 비용 자체가 진입 장벽이다.** xlarge 스케일 한 번이 GPU 512장으로 81시간이 걸려, 소규모 연구팀은 사실상 small/medium 스케일 결과만으로 필터링 기법을 검증하게 된다.',
 '**"더 작고 엄격히 거른 데이터가 낫다"는 결과는 무작정 일반화하기 어렵다.** Figure 2가 보이듯 최적 비율(풀의 약 30%)은 필터링 방식·스케일에 따라 달라지며, 무작위 부분집합에서는 반대로 클수록 항상 나았다.'
],

figures:[
 {f:'fig1-workflow.png',
  cap:'참가자 워크플로 4단계. A) 자원에 맞춰 스케일 선택 → B) CommonPool을 거르거나(주황 점선 filtering track) 외부 데이터를 섞어(BYOD track) 후보 데이터셋 구성 → C) 고정 아키텍처·하이퍼파라미터로 CLIP 학습 → D) 38개 zero-shot 과제로 평가. 참가자가 손댈 수 있는 곳은 오직 B 단계뿐이다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'DATACOMP flips the traditional benchmarking paradigm in machine learning where the dataset is fixed and researchers propose new training algorithms. Instead, we hold the entire training code and computational budget constant so that participants innovate by proposing new training sets.',
  src:'Section 1, p.2'}
],

links:[
 {t:'arXiv 2304.14108 — DataComp', u:'https://arxiv.org/abs/2304.14108'},
 {t:'DataComp 공식 사이트', u:'https://www.datacomp.ai/'},
 {t:'DataComp GitHub', u:'https://github.com/mlfoundations/datacomp'}
]
});
