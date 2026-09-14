WIKI.paper({
slug:'dinov3',
venue:'arXiv 2025 (Meta AI Research)',
authors:'Siméoni, Vo, Seitzer, Baldassarre et al. (Meta AI Research · FAIR)',
arxiv:'2508.10104',

tldr:'[DINOv2](#/p/dinov2)를 70억 파라미터·17억 장 규모로 더 오래 학습시키되, 장기 학습이 dense feature를 망가뜨리는 문제를 **Gram Anchoring**이라는 새 정규화 항으로 잡았다. 파인튜닝 없이 얼린 백본만으로 분할·깊이·검출 같은 dense 과제에서 이전 자기지도·약지도 백본을 앞선다.',

context:'[DINOv2](#/p/dinov2)는 라벨 없이도 범용 시각 특징을 만들 수 있음을 보였지만, 모델과 데이터를 더 키우면 더 나아질 것이라는 기대와 달리 실제로는 **오래 학습시킬수록 이미지 수준 분류는 계속 좋아지는데 dense 과제(분할·깊이)는 어느 시점부터 되레 나빠지는** 현상이 있었다. 이 논문은 그 원인을 patch 특징 사이의 지역적 일관성이 무너지는 것으로 진단한다 — CLS 토큰과 patch 출력 사이 코사인 유사도가 학습이 길어질수록 점점 커지면서, patch 특징이 위치 정보를 잃고 전역 의미 쪽으로 쏠린다. 큰 모델을 더 오래 학습시키는 것 자체는 이제 인프라 문제가 아니라 **이 붕괴를 어떻게 막을 것인가**의 문제였다.',

ideas:[
 {h:'문제 진단: patch 일관성이 학습 중 무너진다',
  lead:'학습이 길어질수록 patch 특징이 CLS 토큰 쪽으로 수렴해 지역성을 잃는다.',
  d:'ViT-g와 ViT-7B 모두에서 ImageNet 선형 분류 정확도는 학습 내내 단조 증가하지만, Pascal VOC 분할 mIoU는 약 20만 iteration 이후 하락한다. 원인을 코사인 유사도 지도로 시각화하면, 200k iteration에서는 기준 patch와 주변의 유사도가 매끈하고 국소적인데 600k 이후로는 관련 없는 patch까지 높은 유사도를 보이며 지도가 지저분해진다. 이는 [DINOv2](#/p/dinov2)에서 보고된 고노름 이상치(registers) 문제와는 다른 현상으로, register 토큰이 있어도 patch 노름 자체는 안정적인데 CLS-patch 코사인 유사도만 서서히 커진다.'},
 {h:'Gram Anchoring: 특징이 아니라 특징 간 관계를 고정한다',
  lead:'patch 특징들의 Gram 행렬(내적 행렬)을 초기 teacher의 것에 맞춰, 개별 특징은 자유롭게 두고 상대적 유사도 구조만 고정한다.',
  d:'한 이미지의 $P$개 patch 특징이 이루는 Gram 행렬(모든 patch 쌍의 내적)을 student와 "Gram teacher"(dense 성질이 아직 좋았던 이른 시점의 teacher 체크포인트) 사이에서 맞추도록 손실을 추가한다. 특징 값 자체가 아니라 특징 간 유사도 구조를 맞추기 때문에, 개별 patch 표현은 계속 움직이며 학습할 수 있으면서도 국소 일관성만 원래 수준으로 붙들려 있다. Gram teacher는 1M iteration짜리 최신 teacher가 아니라 100k~200k 근방의 초기 teacher를 쓰는 것이 중요했다 — 너무 늦은 teacher는 이미 일관성이 무너져 있다.'},
 {h:'고해상도 정제 단계에서 Gram anchoring을 한 번 더',
  lead:'512~768px 크롭으로 짧게 이어 학습하며 Gram anchoring을 다시 걸어 고해상도에서도 지역성을 보정한다.',
  d:'주 학습 이후 512·768px 전역 크롭과 112~336px 지역 크롭을 섞어 1만 iteration만 추가로 학습하는 고해상도 적응 단계를 둔다. 이때도 Gram anchoring(teacher는 7B 모델 자신)을 빼면 dense 과제 성능이 크게 떨어져, 이 구성요소가 해상도를 바꿔도 필수적임을 확인했다. 그 결과 학습 때 쓴 최대 해상도(768px)를 훨씬 넘는 4k 이상에서도 안정적인 특징 지도를 얻는다.'},
 {h:'큰 teacher 하나에서 작은 모델들을 병렬로 증류',
  lead:'7B teacher 하나의 추론을 여러 노드에 공유해 S/B/L/H+ 학생을 동시에 증류한다.',
  d:'ViT-7B를 먼저 학습시킨 뒤 ViT-S(21M)·S+(29M)·B(86M)·L(0.3B)·H+(0.8B)를 이 7B를 고정 teacher로 삼아 증류한다. teacher 추론 비용이 학생보다 훨씬 크므로, 여러 학생을 동시에 학습시키면서 teacher 추론 결과를 모든 노드에 공유하는 병렬 증류 파이프라인을 설계했다. 이 단계에는 patch 일관성 붕괴가 관찰되지 않아 Gram anchoring을 쓰지 않는다.'},
 {h:'후처리로 텍스트 정렬과 해상도 유연성을 추가',
  lead:'백본 학습이 끝난 뒤 텍스트 정렬·다중 해상도 지원 같은 활용성 개선을 별도 단계로 얹는다.',
  d:'핵심 자기지도 학습이 끝난 뒤에도 텍스트와의 정렬, 모델 크기·해상도에 대한 유연성을 높이는 post-hoc 전략들을 추가로 적용한다. 이 구성 덕분에 하나의 학습 레시피에서 자연 이미지부터 위성/항공 이미지까지 넓은 도메인에 적용 가능한 모델군을 얻는다.'}
],

diagram:{type:'flow', cap:'DINOv3 학습 파이프라인. 주 자기증류 학습 뒤에 고해상도 Gram 정제와 다중 학생 증류가 이어진다.',
 nodes:[
  {t:'DINO+iBOT 학습', s:'ViT-7B · constant LR'},
  {t:'Gram anchoring', s:'초기 teacher와 Gram 행렬 정합', acc:true, a:'dense 붕괴 방지'},
  {t:'고해상도 정제', s:'512~768px · 10k iter'},
  {t:'다중 학생 증류', s:'S/B/L/H+ 병렬 증류'}
 ]},

math:[
 {expr:'L_Pre = L_DINO + L_iBOT + 0.1 * L_DKoleo',
  tex:'\\mathcal{L}_{\\text{Pre}}=\\mathcal{L}_{\\text{DINO}}+\\mathcal{L}_{\\text{iBOT}}+0.1\\cdot\\mathcal{L}_{\\text{DKoleo}}',
  d:'주 학습 단계의 손실. [DINOv2](#/p/dinov2)와 같은 이미지 수준(DINO)·패치 수준(iBOT) 자기증류에 분산 정규화(DKoleo)를 더한 구성이다.'},
 {expr:'G_S(patches of image i), G_G(patches of image i)  — student와 Gram teacher의 patch 내적 행렬을 맞춘다',
  tex:'\\mathcal{L}_{\\text{Gram}} = \\lVert G(X_S) - G(X_G) \\rVert,\\quad G(X)=XX^{\\top}',
  d:'$X_S$는 student, $X_G$는 Gram teacher의 patch 특징 행렬($P\\times d$). Gram 행렬 $XX^\\top$은 patch 간 내적, 즉 유사도 구조만을 담으므로 개별 특징 값은 자유롭게 움직일 수 있다.'}
],

numbers:[
 {k:'ADE20k 선형 분할', v:'55.9 mIoU', d:'얼린 백본 + 선형 헤드. DINOv2(자기지도) 대비 +6.4, [SigLIP 2](#/p/siglip2)(약지도) 대비 +13.2'},
 {k:'Cityscapes 선형 분할', v:'81.1 mIoU', d:'같은 조건에서 AM-RADIOv2.5 대비 +2.5, 나머지 백본 대비 +5.5 이상'},
 {k:'NYUv2 깊이', v:'0.309 RMSE', d:'DINOv2의 0.372보다 낮음(좋음). 얼린 백본 + 선형 헤드'},
 {k:'ADE20k SOTA 비교', v:'62.6 / 63.0 mIoU', d:'Mask2Former 디코더를 **학습**시킨 조건(얼린 인코더). BEiT3·InternImage-H·ONE-PEACE와 동급'},
 {k:'모델 규모', v:'ViT-7B (주 모델)', d:'DINOv2의 ViT-g(1.1B)보다 대폭 확대. S(21M)~H+(0.8B)로 증류'}
],

impact:'"모델과 데이터를 키우면 특징이 계속 좋아진다"는 가정이 dense 과제에서는 자동으로 성립하지 않음을 보이고, 그 실패 지점을 구체적으로 고쳤다. **주장의 범위는 얼린 백본 + 선형 헤드(또는 가벼운 디코더) 조건에서의 dense 예측**이다 — [DINOv2](#/p/dinov2)와 마찬가지로 제로샷 분류 같은 언어 정렬 능력을 주장하지 않는다. ADE20k 등에서는 SAM으로부터 증류된 AM-RADIOv2.5나 언어 정렬 백본([SigLIP 2](#/p/siglip2))보다 앞서, "파인튜닝 없이 dense 예측이 필요한 자리에는 DINOv3"라는 용도가 굳어졌다.',

legacy:[
 '**Gram anchoring이 장기 자기증류 학습의 표준 처방으로 자리잡을 가능성** — 유사한 patch 일관성 붕괴는 DINOv2 학습에서도 약하게 관찰됐던 문제로, 이번에 처음으로 원인과 처방이 함께 제시됨',
 '**[VGGT](#/p/vggt)류 다운스트림 백본** — DINO 계열 patch 토크나이저가 3D·기하 과제의 표준 입력으로 계속 쓰임',
 '**위성/항공 이미지 등 새 도메인으로 확장** — 같은 자기지도 레시피가 자연 이미지 밖에서도 통한다는 증거로 인용됨'
],

pitfalls:[
 '**"파인튜닝 없이 SOTA"의 범위를 오해하기 쉽다.** 표 3의 선형 프로빙 결과와 표 11의 SOTA 비교 결과는 조건이 다르다 — 후자는 인코더를 얼린 채 Mask2Former류 디코더 자체를 **학습**시킨 결과이지, 선형 헤드만으로 절대 SOTA(63.0 mIoU)를 찍은 것이 아니다.',
 '**제로샷 분류·검색은 여전히 안 된다.** DINOv3 자체는 텍스트 인코더가 없는 순수 시각 백본이고, 텍스트 정렬은 후처리 단계로 별도로 붙인 것이다.',
 '**Gram teacher 선택이 민감하다.** 너무 이른 teacher(과소학습)나 너무 늦은 teacher(이미 붕괴)를 쓰면 효과가 줄어든다 — 논문은 100k~200k 근방을 최적으로 보고한다.'
],

figures:[
 {f:'fig5-dense-degradation.png',
  cap:'(a) 학습이 진행될수록(200k→1M) CLS 토큰과 patch 사이 코사인 유사도 지도가 지저분해진다(같은 물체 안에서도 유사도가 들쭉날쭉). (b)(c) ViT-g·ViT-7B 모두 IN1k 선형 정확도(분홍)는 계속 오르지만 VOC 분할(남색)은 20만 iteration 근방부터 꺾인다 — 이 그래프가 Gram Anchoring을 도입한 직접적 근거다.',
  src:'원문 Figure 5, p.10'}
],

quotes:[
 {t:'Second, we introduce a new method called Gram anchoring, which effectively addresses the known yet unsolved issue of dense feature maps degrading during long training schedules.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2508.10104 — DINOv3', u:'https://arxiv.org/abs/2508.10104'},
 {t:'facebookresearch/dinov3 (공식 구현)', u:'https://github.com/facebookresearch/dinov3'}
]
});
