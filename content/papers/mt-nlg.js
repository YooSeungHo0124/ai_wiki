WIKI.paper({
slug:'mt-nlg',
venue:'arXiv 2022 (preprint · NVIDIA·Microsoft)',
authors:'Smith, Patwary, Norick, Rajbhandari et al. (NVIDIA · Microsoft)',
arxiv:'2201.11990',

tldr:'[Megatron](#/p/megatron)의 텐서 병렬과 DeepSpeed의 파이프라인·데이터 병렬을 한 시스템으로 결합해 **5,300억 파라미터** 단일 트랜스포머를 4,480장 A100으로 학습해낸 시스템 논문. "일단 크게 만들면 좋아진다"는 GPT-3식 스케일링을 물리적으로 가능하게 만든 엔지니어링이 핵심이다.',

context:'2020~2021년, [GPT-3](#/p/gpt3)가 1,750억 파라미터로 놀라운 few-shot 성능을 보이면서 "모델을 더 키우면 더 좋아진다"는 경험 법칙이 업계 표준이 됐다. 문제는 순수 공학이다. 530B 파라미터를 FP16 가중치·gradient·Adam optimizer state로만 잡아도 **10테라바이트가 넘는 메모리**가 필요한데, A100 한 장의 메모리는 80GB에 불과하다. 데이터 병렬만으로는 모델 자체가 GPU 하나에 안 들어가고, [Megatron](#/p/megatron)식 텐서 병렬만 쓰면 노드를 넘어가는 순간 통신 비용이 급증하며, 파이프라인 병렬만 쓰면 stage 수가 늘수록 채우고 비우는 bubble 오버헤드가 커진다. 이 논문 이전까지 세 병렬화를 동시에, 그것도 수천 장 규모에서 실전으로 조합한 사례가 없었다.',

ideas:[
 {h:'3D 병렬: 텐서·파이프라인·데이터를 층별로 배치',
  lead:'노드 안은 텐서 병렬, 노드 사이는 파이프라인, 그 바깥은 데이터 병렬로 겹겹이 감싼다.',
  d:'530B 모델 복제본 하나가 280장의 A100에 걸쳐 있다. 노드 하나(8 GPU) 안에서는 **8-way 텐서 슬라이싱**으로 각 층의 행렬을 쪼개고, 노드들 사이에는 **35-way 파이프라인 병렬**로 층 구간을 나눈다. 이 280장짜리 복제본을 다시 **데이터 병렬**로 여러 개 두어 총 4,480장(560노드×8)까지 확장한다. 텐서·파이프라인은 메모리를, 데이터 병렬은 처리량(throughput)을 각각 담당한다.'},
 {h:'토폴로지 인식 배치로 통신을 대역폭에 맞춘다',
  lead:'통신량이 가장 큰 텐서 병렬을 노드 내부(고대역폭)에, 데이터 병렬은 지역적으로 묶는다.',
  d:'세 병렬화 중 통신량이 가장 큰 텐서 병렬을 노드 내부의 고대역폭 NVLink 구간에 우선 배치하고, 통신량이 가장 적은 파이프라인 병렬을 노드 간 저대역폭 InfiniBand 구간에 배치한다. 데이터 병렬 그룹도 가능한 한 물리적으로 가까운 노드끼리 묶어(topology-aware mapping) gradient AllReduce의 유효 대역폭을 끌어올린다.'},
 {h:'배치 크기를 점진적으로 키워 학습 안정성 확보',
  lead:'배치 32에서 시작해 1,920까지 서서히 늘리며 학습 초반의 불안정을 피한다.',
  d:'대형 모델은 학습 초반 loss spike로 발산하기 쉽다. 처음 120억 토큰 동안 배치 크기를 32에서 32씩 늘려 최종 1,920까지 도달시키고, 가중치 초기화 표준편차를 $\\sqrt{1/(3H)}$($H$=은닉차원)로 정하며, Adam의 $\\beta_2$ 를 관행값 0.99보다 낮은 0.95로 낮춰 스파이크를 줄였다. 이런 세부 레시피가 없으면 이 규모에서 학습이 실제로 발산한다.'},
 {h:'품질 우선의 데이터 큐레이션 — Pile + 2개 Common Crawl 스냅샷',
  lead:'The Pile 11개 데이터셋에 필터링한 Common Crawl 2개 스냅샷을 더해 339B 토큰을 구성한다.',
  d:'단순히 텍스트를 긁는 대신, fastText 분류기로 고품질 문서를 골라내고(파레토 분포 필터링), 해시 기반 LSH로 중복 문서를 제거하고, 다운스트림 평가 태스크와 겹치는 n-gram을 잘라내는 오염 방지까지 거친다. 총 339B 토큰 중 270B 토큰으로 실제 학습을 마쳤다.'}
],

diagram:{type:'stack', cap:'3D 병렬의 층위 구조. 안쪽(텐서)일수록 통신량이 크고 고대역폭 구간에, 바깥쪽(데이터)일수록 통신량이 적어 노드를 넘나들어도 된다.',
 layers:[
  {t:'텐서 병렬', s:'노드 내 8-way', note:'NVLink, 통신량 최대'},
  {t:'파이프라인 병렬', s:'노드 간 35-way', note:'층 구간 분할'},
  {t:'데이터 병렬', s:'복제본 간 16-way', acc:true, note:'InfiniBand, 처리량 확장'},
  {t:'모델 복제본 1개', s:'280 × A100', note:'8×35'},
  {t:'전체 클러스터', s:'4,480 × A100', note:'560 DGX 노드'}
 ]},

math:[
 {expr:'efficiency = MB / (MB + PP - 1)',
  tex:'\\text{efficiency} = \\frac{MB}{MB + PP - 1}',
  d:'파이프라인 병렬 효율은 마이크로배치 수 $MB$ 와 파이프라인 스테이지 수 $PP$ 로 결정된다. $MB$ 가 $PP$ 의 4배면 81%, 8배면 90%의 효율이 나온다 — 스테이지를 늘릴수록 마이크로배치도 함께 늘려야 bubble 손실을 줄일 수 있다.'}
],

numbers:[
 {k:'파라미터 수', v:'5,300억', d:'GPT-3(1,750억)의 약 3배 — 논문 시점 최대의 단일(monolithic) 트랜스포머'},
 {k:'GPU 규모', v:'4,480장 A100(80GB)', d:'560 DGX A100 노드 × 8장, HDR InfiniBand로 연결'},
 {k:'모델 병렬 구성', v:'8-way 텐서 × 35-way 파이프라인', d:'복제본 하나당 280장 GPU 사용'},
 {k:'모델 구조', v:'105층 · 은닉 20,480 · 헤드 128', d:'시퀀스 길이 2,048, 전역 배치 1,920'},
 {k:'메모리 요구량', v:'10TB+', d:'가중치·gradient·optimizer state만으로 A100(80GB) 125장 이상 분량'},
 {k:'학습 데이터', v:'339B 토큰 구성 · 270B 토큰 학습', d:'검증 손실(cross-entropy)이 1B 토큰 시점 3.15에서 270B 시점 1.85로 하락'}
],

impact:'MT-NLG는 [Megatron](#/p/megatron)의 텐서 병렬과 DeepSpeed의 파이프라인·데이터 병렬(그리고 [ZeRO](#/p/zero)의 메모리 분할 아이디어)이 **서로 배타적이지 않고 겹쳐 쓸 수 있다**는 것을 수천 장 GPU 규모에서 실증했다. 이 3D 병렬 조합은 이후 대형 언어모델 학습 인프라의 사실상 표준 패턴이 됐다. 동시에 이 논문은 [Chinchilla](#/p/chinchilla)가 "파라미터 대비 데이터가 너무 적다"고 지적하기 직전, **파라미터 수만 극대화하면 된다**는 시대의 정점을 보여주는 사례이기도 하다 — 5,300억 파라미터에 270B 토큰만 학습시킨 것은 Chinchilla 기준으로는 명백한 과소학습(undertrained)이다.',

legacy:[
 '**3D 병렬의 표준화** — 텐서·파이프라인·데이터 병렬을 토폴로지 인식 배치로 겹쳐 쓰는 패턴이 이후 대형 모델 학습 인프라(Megatron-DeepSpeed, NeMo 등)의 기본 틀이 됨',
 '**"일단 크게"에서 "비율을 맞춰서"로의 전환점** — 이 모델이 보여준 파라미터 극대화 전략은 곧 [Chinchilla](#/p/chinchilla)의 데이터·파라미터 비율 재검토로 반박됨',
 '**단일(monolithic) 대형 모델의 사실상 정점** — 이후 최대 모델 경쟁은 [GShard](#/p/gshard)·[Switch Transformer](#/p/switch) 같은 MoE 희소 모델 쪽으로 무게중심이 이동',
 '**데이터 큐레이션 레시피의 참고 사례** — fastText 품질 필터링 + LSH 중복 제거 + n-gram 오염 방지 조합이 이후 대형 LLM 데이터 파이프라인에서 반복 채택됨'
],

pitfalls:[
 '**"3배 더 크니까 3배 더 좋다"가 아니다.** MT-NLG는 여러 벤치마크에서 GPT-3를 앞섰지만 격차는 크지 않았고, [Chinchilla](#/p/chinchilla) 이후 관점에서 보면 270B 토큰은 530B 파라미터 대비 데이터가 부족해 파라미터당 성능이 최적이 아니었다.',
 '**"단일 모델 중 최대"라는 표현에 유의.** 저자들도 명시했듯 MoE 같은 희소 모델은 총 파라미터가 이보다 훨씬 크다(예: [GShard](#/p/gshard) 6,000억) — 비교 대상은 어디까지나 **하나의 조밀한(dense) 트랜스포머** 안에서다.',
 '**3D 병렬 설정값(8×35×16 등)은 이 클러스터 토폴로지에 맞춘 값**이라 다른 하드웨어 구성에 그대로 옮기면 최적이 아닐 수 있다.'
],

figures:[
 {f:'fig1-model-size-trend.png',
  cap:'2018~2022년 SOTA 언어모델 파라미터 수(로그 스케일). ELMo(94M)에서 MT-NLG(530B)까지 4년간 파라미터가 약 5,600배 늘었고, GPT-3(2020) 이후 성장 곡선이 점선(지수 추세선) 위로 꺾여 올라간다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-validation-loss.png',
  cap:'x축이 학습에 사용한 토큰 수(billion), y축이 검증 cross-entropy. 초반 급락 구간(배치 크기를 32→1,920으로 늘리는 구간)을 지나 270B 토큰까지 완만하게 우하향한다 — 곡선이 끝까지 평평해지지 않아 더 학습했다면 손실이 더 낮아질 여지가 있었음을 보여준다.',
  src:'원문 Figure 2, p.11'}
],

quotes:[
 {t:'It is, to the best of our knowledge, the largest monolithic language model trained to date, with 3x more parameters than GPT-3.',
  src:'Introduction, p.2'},
 {t:'Our work further extends this line of work, situating ourselves at the largest monolithic transformer language model to date at 530 billion parameters, achieving unprecedented training efficiency and model quality.',
  src:'Section 5 (Related Work), p.19'}
],

links:[
 {t:'arXiv 2201.11990 — Using DeepSpeed and Megatron to Train MT-NLG 530B', u:'https://arxiv.org/abs/2201.11990'},
 {t:'Microsoft Research blog — Turing-NLG/MT-NLG', u:'https://www.microsoft.com/en-us/research/blog/using-deepspeed-and-megatron-to-train-megatron-turing-nlg-530b-the-worlds-largest-and-most-powerful-generative-language-model/'}
]
});
