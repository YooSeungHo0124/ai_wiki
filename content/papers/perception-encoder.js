WIKI.paper({
slug:'perception-encoder',
venue:'arXiv 2025 (Meta FAIR)',
authors:'Bolya, Huang, Sun, Cho, Madotto et al. (Meta FAIR)',
arxiv:'2504.13181',

tldr:'단순한 [CLIP](#/p/clip)류 대조학습만 제대로 스케일링해도, 캡셔닝·자기지도 전용 모델에 필적하는 특징이 내부에 이미 생긴다는 것을 발견했다. 문제는 그 특징이 **마지막 층이 아니라 중간층에 숨어 있다**는 것이고, 이를 끌어내는 정렬(alignment) 기법 두 가지를 더해 분류·VLM·dense 예측 전 영역에서 최상급 인코더를 만들었다.',

context:'시각 인코더의 사전학습 목표는 용도별로 갈라져 있었다 — 대조학습(CLIP류)은 제로샷 분류·검색에, 캡셔닝 손실은 멀티모달 언어모델(MLLM) 연결에, [DINOv2](#/p/dinov2) 같은 공간 자기지도 손실은 검출·분할 같은 dense 과제에 각각 더 적합하다고 여겨졌다. 여러 손실을 한 모델에 섞으려는 시도들이 있었지만 스케일링이 어려웠다. 이 논문은 반대 방향으로 묻는다 — 손실을 섞지 않고 **대조학습 하나만 제대로 스케일링**하면 어디까지 가는가?',

ideas:[
 {h:'PEcore: 강건한 이미지 사전학습을 먼저 완성한다',
  lead:'데이터·FLOPs를 고정한 채 vanilla CLIP 대비 강건성(robustness)을 크게 끌어올리는 레시피를 조정한다.',
  d:'ImageNet-A/R/Sketch 등 6개 강건성 벤치마크 평균으로 측정했을 때, ImageNet val 정확도만 보고 고른 vanilla 레시피는 강건성이 훨씬 낮았다. 학습 스케줄을 절반의 FLOPs로 나눠 배치하고, attention pooling으로 CLIP 임베딩을 구성하며, 해상도·2D RoPE를 조정하는 등 일련의 조정을 거쳐 ImageNet val보다 강건성 지표가 훨씬 크게(예: +1.4%p 대 +0.5%p) 개선되는 레시피를 만들었다.'},
 {h:'영상 데이터 엔진으로 이미지 인코더를 영상까지 확장',
  lead:'PEcore를 프레임 인코더로 써서 합성 영상 캡션을 만들고, 그 데이터로 파인튜닝해 영상 분류·검색까지 키운다.',
  d:'이미지 전용 대조학습 인코더를 프레임 단위 인코더로 재사용해 영상에 대한 정합된 캡션을 자동 생성하는 데이터 엔진을 만들고, 이 합성 영상-텍스트 데이터로 파인튜닝한다. 이 과정에서 만든 PE Video Dataset(PVD, 100만 개 영상·12만 개 사람이 다듬은 주석)을 공개했다. 이 레시피를 20억 파라미터까지 키운 PEcore G는 [SigLIP 2](#/p/siglip2)를 이미지 제로샷에서, InternVideo2를 대부분의 영상 제로샷 과제에서 앞선다.'},
 {h:'발견: 최적 임베딩은 출력층이 아니라 중간층에 있다',
  lead:'CLIP 손실로 학습했는데도 중간층 특징이 언어·공간 특화 모델([AIMv2](https://arxiv.org/abs/2411.14402)·DINOv2-g)에 필적한다.',
  d:'PEcore G의 중간층을 얼린 채 그대로 뽑아보면, 언어 과제에서는 캡셔닝으로 학습된 AIMv2-3B급 특징에, 공간 과제에서는 DINOv2-g급 특징에 필적하는 층이 존재한다. 문제는 이 특징들이 **과제마다 서로 다른 층**에 있고, 모델이 이를 자연스럽게 마지막 층으로 출력하지 않는다는 것 — 즉 일반적인 표현은 이미 학습됐지만 인코더가 그것을 내놓지 않는 상태다.'},
 {h:'언어 정렬: 끝단으로 끌어와 MLLM에 바로 붙인다',
  lead:'중간층의 언어 관련 특징을 네트워크 끝으로 정렬해 PElang을 만들고, MLLM 성능을 높인다.',
  d:'언어 과제에 유리한 중간층 특징을 최종 출력으로 끌어오는 alignment tuning을 적용해 PElang G를 얻는다. 다른 인기 있는 시각 인코더들보다 MLLM 과제에서 개별적으로 앞서고, 자체 Perception Language Model(PLM)과 결합하면 [InternVL3](#/p/internvl3) 같은 최신 MLLM과도 경쟁한다.'},
 {h:'공간 정렬: 자기 자신을 teacher로, SAM 2로 보강한다',
  lead:'모델 자신의 얼린 특징을 증류의 1차 목표로 삼고, SAM 2 기반 공간 대응 증류로 다듬어 PEspatial을 만든다.',
  d:'공간 과제에 적합한 레이어의 특징을 우선 자기 자신에게서 증류(self-distillation)해 대부분의 정렬을 얻고, 여기에 [SAM 2](#/p/sam2)를 이용한 공간 대응(correspondence) 증류를 더해 다듬는다. 그 결과 PEspatial G는 깊이 추정·추적·의미분할에서 다른 인기 모델들을 능가하고, 더 단순한 디코더로 COCO 검출에서 새 절대 SOTA(66.0 box mAP)를 찍었다.'}
],

diagram:{type:'split', cap:'하나의 대조학습 PE Core에서, 정렬(alignment) 기법으로 서로 다른 층의 잠재 특징을 끌어낸다.',
 from:{t:'PE Core', s:'대조 사전학습', acc:true},
 branches:[
  {t:'PE Language', s:'§4 언어 정렬'},
  {t:'PE Spatial', s:'§5 공간 정렬'}
 ],
 join:'중간층에 이미 있던 특징을 끝단으로 끌어옴'
},

numbers:[
 {k:'ImageNet 강건성 평균', v:'86.6%', d:'제로샷, 6개 강건성 벤치마크 평균 (ImageNet-A/R/Sketch 등)'},
 {k:'Kinetics-400 제로샷', v:'76.9%', d:'영상 분류, PEcore G'},
 {k:'COCO box 검출', v:'66.0 mAP', d:'PEspatial G + 상대적으로 단순한 디코더(DETA). 논문이 주장하는 새 절대 SOTA'},
 {k:'DocVQA / InfographicVQA / PerceptionTest', v:'94.6 / 80.9 / 82.7', d:'8B LLM과 결합한 PElang 기준'}
],

impact:'"임베딩 품질은 사전학습 목표가 결정한다"는 통념에, "목표가 아니라 **어느 층을 꺼내 쓰는가**가 결정한다"는 대안을 제시했다. 대조학습 하나로 스케일링이 단순한 채로 캡셔닝·자기지도 전용 모델의 성과를 내부적으로 이미 담고 있었다는 관찰은, 여러 손실을 뒤섞어 복잡도를 키우던 흐름과 반대 방향이다. 실무적으로는 [SAM 3](#/p/sam3)의 비전·텍스트 인코더로 그대로 채택되는 등, "범용 대조학습 백본 + 후처리 정렬"이라는 조합이 실제 응용에 이어졌다.',

legacy:[
 '**[SAM 3](#/p/sam3)의 백본으로 채택** — Perception Encoder가 SAM 3 검출기의 비전·텍스트 인코더로 그대로 쓰임',
 '**중간층 활용이라는 진단이 다른 대조학습 인코더 분석에도 확산** — "출력층만 보지 말고 중간층을 프로브하라"는 분석 방법론이 이후 비전 인코더 비교 연구의 기본 체크리스트가 될 가능성',
 '**[SigLIP 2](#/p/siglip2)와의 경쟁·비교축** — 같은 시기 나온 두 대조학습 계열 인코더가 서로의 baseline으로 반복 인용됨'
],

pitfalls:[
 '**"최적 임베딩이 중간층에 있다"는 사전학습되지 않은 vanilla CLIP에는 해당하지 않을 수 있다.** 이 발견은 저자들의 강건화된 대규모 사전학습 레시피(PEcore)에서 나온 것이며, 논문 스스로 이 능력을 "강건한 이미지 사전학습 전략" 덕으로 돌린다.',
 '**PElang·PEspatial은 PEcore에 대한 후처리 정렬 단계이지, 처음부터 다시 학습한 별도 모델이 아니다.** "정렬 튜닝"이 무엇을 바꾸고 무엇을 그대로 두는지(가중치 대부분은 유지) 구분해서 읽어야 한다.',
 '**66.0 box mAP는 상대적으로 단순한 디코더 조건에서의 결과다.** 더 무거운 검출 전용 디코더와 비교할 때는 조건이 다르다는 점을 염두에 둬야 한다.'
],

figures:[
 {f:'fig1-family.png',
  cap:'왼쪽 PE Core가 대조학습으로 이미지·영상 분류/검색을 배운다. §3의 분석에서 이 모델 내부에 이미 언어·공간 특화 특징이 있다는 것이 드러나고, §4·§5의 정렬 튜닝이 그 특징을 각각 PE Language(OCR·캡셔닝·VQA·grounding)와 PE Spatial(검출·분할·추적·깊이)로 끌어낸다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'These embeddings are hidden within the intermediate layers of the network.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2504.13181 — Perception Encoder', u:'https://arxiv.org/abs/2504.13181'},
 {t:'facebookresearch/perception_models (공식 구현)', u:'https://github.com/facebookresearch/perception_models'}
]
});
