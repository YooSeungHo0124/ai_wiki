WIKI.paper({
slug:'dinov2',
venue:'TMLR 2024',
authors:'Oquab, Darcet, Moutakanni et al. (Meta AI Research · FAIR)',
arxiv:'2304.07193',

tldr:'[DINO](#/p/dino)의 자기증류에 [MAE](#/p/mae) 계열의 패치 마스킹 목표를 합치고, 무엇보다 **데이터를 자동으로 큐레이션**해서 라벨도 텍스트도 없이 범용 시각 특징을 만들었다. 파인튜닝 없이 특징을 얼린 채 선형 헤드만 붙여도 분류·분할·깊이 추정에서 두루 통한다.',

context:'2023년 시점에 "범용 시각 특징"의 자리는 [CLIP](#/p/clip)이 차지하고 있었다. 다만 CLIP의 감독 신호는 결국 사람이 쓴 **alt-text**이고 텍스트는 이미지에 담긴 정보의 일부만 기술하므로(캡션에 "개"라고 적혀 있을 뿐 개의 윤곽이나 앞뒤 거리는 어디에도 없다), CLIP 특징은 이미지 수준 의미에는 강하지만 픽셀 수준 과제에서는 약했다. 한편 순수 자기지도([DINO](#/p/dino)·[MAE](#/p/mae))는 그런 제약이 없는 대신 실험이 대부분 ImageNet-1k 규모에 머물러 있었고, 웹에서 긁은 데이터를 그냥 늘리면 오히려 성능이 떨어지는 현상이 반복 보고됐다. 이 논문의 진단은 명확하다 — 자기지도 학습에서 정체를 만든 것은 알고리즘이 아니라 **데이터의 질**이며, 그래서 논문의 절반이 모델이 아니라 **데이터 파이프라인**에 할애된다.',

ideas:[
 {h:'자동 큐레이션: 검색으로 데이터셋을 짓는다',
  lead:'소량의 큐레이션 데이터셋을 시드 삼아 웹 이미지 중 임베딩이 가까운 것만 검색해 끌어온다.',
  d:'사람이 라벨을 붙이는 대신, 이미 신뢰할 만한 소규모 큐레이션 데이터셋들(ImageNet-22k, Google Landmarks, 세분화 분류 데이터셋 등)을 **시드**로 삼는다. 웹에서 모은 12억 장의 무큐레이션 이미지를 자기지도 ViT로 임베딩한 뒤, 시드 이미지와 가까운 것들을 최근접 이웃으로 **검색**해 끌어온다. 여기에 복사 탐지 기반 중복 제거(벤치마크 테스트셋과의 누수 제거 포함)를 걸어 1억 4200만 장의 **LVD-142M**을 만든다. 핵심은 이것이 "많이 모으기"가 아니라 **분포를 시드 쪽으로 정렬하면서 다양성을 유지하는** 작업이라는 점이다.'},
 {h:'이미지 수준 + 패치 수준, 두 손실을 함께',
  lead:'[CLS] 수준 DINO 손실에 패치 마스킹을 맞추는 iBOT 손실을 더해 국소 구조까지 학습한다.',
  d:'[DINO](#/p/dino) 손실은 [CLS] 토큰, 즉 이미지 전체의 표현에만 신호를 준다. 여기에 iBOT의 마스킹 목표를 더한다 — student 입력의 일부 패치를 가리고, 가려진 자리의 출력이 teacher가 본 원래 패치의 출력을 맞추게 한다. [BERT](#/p/bert)의 마스킹 복원을 픽셀이 아니라 **teacher의 특징 공간에서** 하는 셈이다. 이미지 수준 목표는 의미를, 패치 수준 목표는 국소 구조를 만들고, 이 조합 덕분에 분할·깊이처럼 픽셀 단위 출력이 필요한 과제에서 특징을 그대로 쓸 수 있게 된다. 두 손실은 헤드를 공유하지 않는다(untied heads).'},
 {h:'붕괴 방지와 다양성 유지를 위한 잔손질',
  lead:'Sinkhorn-Knopp와 KoLeo 정규화로 표현이 뭉치지 않고 공간에 고르게 퍼지도록 만든다.',
  d:'DINO의 centering을 Sinkhorn-Knopp 정규화로 바꿔 teacher 분포가 배치 안에서 고르게 퍼지도록 하고, **KoLeo** 정규화를 추가한다. KoLeo는 배치 안 특징들의 최근접 이웃 거리를 균일하게 만드는 항으로, 표현이 몇 군데에 뭉치지 않고 공간에 퍼지게 한다. 검색 계열 과제에서 특히 효과가 크다. 마지막에 짧게 고해상도(518px)로 학습을 이어 붙여, 저해상도로만 배운 특징이 분할·깊이에서 손해 보는 부분을 보정한다.'},
 {h:'큰 모델을 먼저 만들고, 작은 모델은 증류로 얻는다',
  lead:'ViT-g를 먼저 학습시키고 작은 모델은 밑바닥 학습 대신 ViT-g에서 증류로 얻는다.',
  d:'ViT-g/14(11억 파라미터)를 먼저 학습시킨 뒤 ViT-S/B/L을 **처음부터 자기지도로 학습시키지 않고** ViT-g에서 [증류](#/p/distillation)한다. 같은 자기증류 프레임을 쓰되 teacher를 EMA가 아니라 고정된 ViT-g로 두는 것뿐이라, 코드가 거의 그대로 재사용된다. 결과적으로 작은 모델이 같은 크기를 밑바닥부터 학습시킨 것보다 낫다. "큰 모델 하나를 잘 만들고 나머지는 증류"라는 LLM 쪽 관행이 시각 쪽에서도 확인된 사례다.'},
 {h:'엔지니어링이 곧 스케일의 전제다',
  lead:'FlashAttention·sequence packing·FSDP를 조합해 대규모 자기증류를 실제로 감당 가능하게 만든다.',
  d:'11억 파라미터를 1억 4천만 장에 대해 자기증류로 돌리려면 속도가 곧 실현 가능성이다. FlashAttention 계열의 자체 구현, 여러 crop을 하나의 시퀀스로 묶는 sequence packing, 효율적인 stochastic depth, FSDP 기반 분산을 조합해 iBOT 구현 대비 **약 2배 빠르고 메모리는 1/3**로 줄였다. 논문이 알고리즘 못지않게 이 부분을 길게 다루는 것 자체가 시대의 특징이다.'}
],

diagram:{type:'flow', cap:'LVD-142M 구축 파이프라인. 라벨을 붙이는 대신 임베딩 공간에서의 검색으로 데이터를 고른다.',
 nodes:[
  {t:'웹 크롤 이미지', s:'약 12억 장 · 무큐레이션'},
  {t:'자기지도 ViT로 임베딩', s:'ImageNet-22k 사전학습'},
  {t:'중복 제거', s:'복사 탐지 · 벤치마크 누수 제거'},
  {t:'시드 최근접 검색', s:'큐레이션 데이터셋 ← 유사 이미지', acc:true},
  {t:'LVD-142M', s:'1억 4200만 장'}
 ]},

math:[
 {expr:'L = L_DINO([CLS]) + L_iBOT(masked patches) + λ·L_KoLeo',
  tex:'\\mathcal{L}=\\mathcal{L}_{\\text{DINO}}([\\text{CLS}])+\\mathcal{L}_{\\text{iBOT}}(\\text{masked patches})+\\lambda\\cdot\\mathcal{L}_{\\text{KoLeo}}',
  d:'이미지 수준 자기증류, 패치 수준 마스킹 증류, 그리고 특징 분산을 유지하는 정규화의 합. 앞의 두 항은 각각 별도의 헤드를 쓴다.'},
 {expr:'L_KoLeo = − (1/n) Σ_i log( min_{j≠i} ‖z_i − z_j‖ )',
  tex:'\\mathcal{L}_{\\text{KoLeo}}=-\\frac{1}{n}\\sum_i \\log\\!\\left(\\min_{j\\ne i}\\|z_i-z_j\\|\\right)',
  d:'배치 안에서 각 특징의 최근접 이웃까지의 거리를 크게 만든다. 거리가 0에 가까워지면 $-\\log$ 가 폭발하므로, 표현이 서로 겹치는 것에 강한 벌점이 붙는다.'}
],

numbers:[
 {k:'LVD-142M', v:'1억 4200만 장', d:'12억 장의 무큐레이션 풀에서 검색·중복제거로 추림. 사람 라벨 없음'},
 {k:'ViT-g/14', v:'11억 파라미터', d:'임베딩 차원 1536, SwiGLU FFN. 여기서 S/B/L을 증류'},
 {k:'ImageNet-1k 선형 프로브', v:'86.5%', d:'백본은 **얼린 채** 선형 헤드만 학습'},
 {k:'ImageNet-1k k-NN', v:'83.5%', d:'학습 없는 최근접 이웃 분류. [DINO](#/p/dino)의 78.3%에서 크게 올라감'},
 {k:'학습 효율', v:'약 2배 속도 · 1/3 메모리', d:'iBOT 구현 대비. FlashAttention·sequence packing·FSDP'}
],

figures:[
 {f:'fig1-pca-correspondence.png',
  cap:'각 열(a~d)마다 왼쪽이 원본 사진 4장, 오른쪽이 그 패치 특징들을 함께 PCA한 뒤 상위 3개 성분을 RGB 색으로 칠한 것. 같은 열 안에서 종·자세·화풍(사진/그림/조각상)이 달라도 같은 신체 부위(날개, 다리, 바퀴)가 비슷한 색으로 칠해진다 — 레이블 없이 학습한 특징이 부위 단위 대응을 스스로 알고 있다는 뜻이다. 배경은 첫 PCA 성분을 기준으로 제거했다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We train a ViT model with 1B parameters and distill it into a series of smaller models that surpass the best available general-purpose features, OpenCLIP, on most of the benchmarks at image and pixel levels.',
  src:'Abstract, p.1'},
 {t:'This is explained by the lack of control over the data quality and diversity, which are essential to produce good features.',
  src:'Section 1, p.2'}
],

impact:'텍스트 감독 없이도 [CLIP](#/p/clip)급 범용성을 얻을 수 있음을 보이면서, "범용 시각 특징 = 언어 감독"이라는 등식을 깼다. 특히 강점이 갈리는 지점이 뚜렷하다 — 이미지 전체의 의미와 제로샷 분류는 여전히 CLIP/[SigLIP](#/p/siglip) 계열이 강하지만, **깊이 추정·의미론적 분할·의미론적 대응처럼 픽셀 수준 구조가 필요한 과제에서는 DINOv2 특징이 앞선다.** 그 결과 오늘날 DINOv2는 백본을 얼려서 헤드만 갈아끼우는 방식으로 널리 쓰이고, Depth Anything 같은 후속 모델이 DINOv2 백본 위에 세워졌다. 멀티모달 쪽에서도 언어 정렬 인코더 단독으로는 세밀한 공간 인식이 부족하다는 진단에서, [LLaVA](#/p/llava)류 VLM에 SigLIP과 DINOv2 특징을 함께 넣는 하이브리드 인코더 구성이 자주 시도된다.',

legacy:[
 '**얼린 백본 + 가벼운 헤드**라는 사용 패턴이 시각 분야의 기본 워크플로로 정착 — 분류·분할·깊이·검색을 하나의 특징으로 처리',
 '**깊이/기하 과제로의 확산** — Depth Anything을 비롯해 DINOv2 백본 위에 태스크 헤드를 얹은 모델군이 형성',
 '**하이브리드 비전 인코더** — 언어 정렬 특징([SigLIP](#/p/siglip))과 자기지도 특징(DINOv2)을 함께 쓰는 VLM 구성이 [LLaVA](#/p/llava) 계열에서 반복 시도됨',
 '**데이터 큐레이션의 부상** — 모델보다 데이터 파이프라인이 성능을 가른다는 관찰이 이후 시각 사전학습 연구의 기본 전제가 됨',
 '**후속 진단** — DINOv2 특징 맵에 정보가 몰린 이상 토큰이 존재한다는 관찰에서 "registers" 연구가 파생되어 v2 계열 모델의 아티팩트가 교정됨'
],

pitfalls:[
 '**제로샷 분류를 기대하면 안 된다.** DINOv2에는 텍스트 인코더가 없어서 "고양이 사진 찾기" 같은 언어 프롬프트가 불가능하다. 반드시 라벨이 붙은 소량 데이터로 선형 헤드나 k-NN 인덱스를 따로 만들어야 한다. 이 점에서 [CLIP](#/p/clip)의 대체재가 아니라 보완재다.',
 '**"라벨 없음"이 "감독 없음"은 아니다.** 큐레이션 파이프라인의 시드가 ImageNet-22k 같은 사람이 만든 데이터셋이고, 검색은 그 분포 쪽으로 데이터를 끌어온다. 사람의 선택이 라벨이 아니라 **데이터 분포의 형태로** 들어가 있다는 점은 짚고 가야 한다.',
 '**파인튜닝하면 오히려 나빠질 수 있다.** 논문의 주된 사용법은 백본을 얼리는 것이고, 소량 데이터로 전체를 파인튜닝하면 범용성이 무너지기 쉽다. 성능이 부족하면 먼저 헤드 용량과 입력 해상도를 올려보는 편이 낫다.'
],

links:[
 {t:'arXiv 2304.07193 — DINOv2: Learning Robust Visual Features without Supervision', u:'https://arxiv.org/abs/2304.07193'},
 {t:'facebookresearch/dinov2 (공식 구현 · 사전학습 가중치)', u:'https://github.com/facebookresearch/dinov2'},
 {t:'arXiv 2309.16588 — Vision Transformers Need Registers', u:'https://arxiv.org/abs/2309.16588'}
]
});
