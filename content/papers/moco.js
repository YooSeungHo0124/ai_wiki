WIKI.paper({
slug:'moco',
venue:'CVPR 2020',
authors:'He, Fan, Wu, Xie, Girshick (Facebook AI Research)',
arxiv:'1911.05722',

tldr:'대조학습을 **사전(dictionary) 조회 문제**로 다시 정의하고, negative를 배치가 아니라 **큐**에 쌓아 재사용한다. 큐에 담긴 오래된 표현이 낡지 않도록 인코더를 EMA로 천천히 따라가게 만들어서, GPU 8장으로도 [SimCLR](#/p/simclr)가 4096 배치로 얻던 negative 규모를 확보했다.',

context:'[SimCLR](#/p/simclr)가 보여준 것은 대조학습이 통한다는 사실과 동시에, 그 성능이 **배치 크기에 인질로 잡혀 있다**는 사실이었다. negative를 같은 배치에서만 조달하니 negative를 65536개 쓰려면 배치를 65536으로 키워야 하는데, 이는 TPU pod 없이는 불가능하다. 우회로로 이전부터 쓰이던 것이 memory bank — 전체 데이터셋의 표현을 한 벌 저장해두고 거기서 negative를 꺼내 쓰는 방식이다. 그런데 memory bank에 든 표현은 **그 샘플이 마지막으로 등장한 에폭의 인코더**가 만든 것이다. 인코더는 매 스텝 바뀌므로, 한 배치 안에서 비교되는 negative들이 서로 다른 시점의 서로 다른 모델에서 나온 셈이 된다. 이 **비일관성**이 memory bank 계열의 성능을 눌러왔다. 이 논문은 문제를 "크고(large) 일관된(consistent) 사전을 어떻게 동시에 만드는가"로 정확히 좁힌 뒤, 큐와 모멘텀 두 부품으로 답한다.',

ideas:[
 {h:'대조학습 = 동적 사전에서의 조회',
  lead:'쿼리가 사전에서 자기 짝을 찾아내는 K+1 지선다 분류로 대조학습을 재정의한다.',
  d:'쿼리 $q$(현재 뷰)가 있고, 키 $k_0, k_1, \\dots$ 로 채워진 사전이 있다. 이 중 $q$ 와 같은 이미지에서 나온 $k_+$ 하나만 positive이고 나머지는 전부 negative다. 학습은 $q$ 가 사전에서 $k_+$ 를 찾아내게 하는 것 — 형태는 $K+1$ 지선다 분류다. 이 관점으로 옮기면 SimCLR·memory bank·MoCo가 전부 "사전을 어떻게 채우는가"의 변종으로 정리되고, 좋은 사전의 조건이 **크기**와 **일관성** 둘이라는 것이 드러난다.'},
 {h:'큐: 사전 크기를 배치 크기에서 떼어낸다',
  lead:'키를 FIFO 큐에 쌓아 사전 크기를 배치 크기와 무관한 값으로 만든다.',
  d:'사전을 FIFO 큐로 유지한다. 매 스텝 현재 배치의 키를 큐에 넣고 가장 오래된 배치를 밀어낸다. 그러면 사전 크기 $K$ 는 배치 크기와 무관한 **독립 하이퍼파라미터**가 된다. 배치 256으로 학습하면서 negative 65536개를 쓸 수 있다. 게다가 큐에는 gradient가 흐르지 않으므로(키 쪽은 backprop 대상이 아니다) 메모리 비용이 표현 벡터 크기뿐이다 — 65536×128 float은 32MB 남짓이다.'},
 {h:'모멘텀 인코더: 급하게 바꾸면 사전이 깨진다',
  lead:'키 인코더를 쿼리 인코더의 느린 이동평균으로 만들어 큐의 일관성을 지킨다.',
  d:'큐를 도입하면 곧바로 일관성 문제가 온다. 큐의 앞쪽 항목은 수천 스텝 전 인코더가 만든 것이기 때문이다. 그렇다고 키 인코더에 gradient를 흘리면(end-to-end) 매 스텝 파라미터가 크게 튀어 큐 전체가 무의미해진다. MoCo는 키 인코더 $\\theta_k$ 를 학습시키지 않고 쿼리 인코더 $\\theta_q$ 를 **아주 천천히** 따라가게 한다. $m=0.999$ 면 키 인코더는 사실상 최근 1000스텝의 이동평균이라, 큐 안 표현들이 거의 같은 모델에서 나온 것처럼 보인다.'},
 {h:'모멘텀이 클수록 좋다 — 그리고 없으면 아예 안 된다',
  lead:'모멘텀을 키울수록 좋아지고, 0이면(즉시 복사) 학습이 아예 실패한다.',
  d:'ablation이 인상적이다. $m$ 을 0.9 → 0.99 → 0.999로 키울수록 정확도가 단조 증가하고, **$m=0$(키 인코더를 매 스텝 쿼리 인코더로 그냥 복사)일 때는 학습이 실패한다.** "천천히 변하는 것이 좋다"가 아니라 "천천히 변하는 것이 필수"라는 뜻이다. 이 관찰은 negative를 없앤 [BYOL](#/p/byol)에서 붕괴를 막는 핵심 장치로 재해석되고, [DINO](#/p/dino)의 teacher로 이어진다.'},
 {h:'Shuffling BN — 조용하지만 없으면 무너지는 디테일',
  lead:'배치를 GPU 간에 섞어 BN 통계로 정답을 알아내는 지름길을 막는다.',
  d:'BatchNorm이 배치 안의 통계를 공유한다는 성질 때문에, 같은 GPU에 positive 쌍이 함께 있으면 모델이 **BN 통계로 정답을 알아내는 지름길**을 찾는다. 손실은 잘 떨어지는데 표현은 쓸모없어진다. MoCo는 키를 계산하기 전에 배치를 GPU 간에 섞어(shuffle) 이 누수를 막는다. 자기지도 학습에서 [BatchNorm](#/p/batchnorm)이 정보 누수 통로가 될 수 있다는 이 지적은 이후 여러 논문에서 반복 확인된다.'}
],

figures:[
 {f:'fig1-moco-overview.png',
  cap:'왼쪽 query encoder는 보통 인코더(gradient로 학습), 오른쪽 momentum encoder(파란 상자)는 역전파가 아니라 query encoder를 따라가는 이동평균으로만 갱신된다. 오른쪽 아래 $x_0^{key}, x_1^{key}, x_2^{key}, \\ldots$ 가 queue에 쌓인 과거 미니배치들 — 이 queue 덕분에 사전(dictionary) 크기가 현재 미니배치 크기와 무관하게 커질 수 있다는 것이 그림의 핵심 포인트.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-three-mechanisms.png',
  cap:'세 방식이 "negative를 어디서 조달하는가"로 갈린다. (a) end-to-end는 encoder q와 encoder k를 둘 다 역전파로 학습 — 사전 크기가 배치 크기에 묶인다. (b) memory bank는 key encoder 없이 저장된 표현을 memory bank에서 sampling — 크지만 표현이 최신 encoder와 점점 어긋난다(inconsistent). (c) MoCo는 momentum encoder를 둬서 사전을 배치와 분리하면서도(a의 장점) key 표현을 부드럽게 최신 상태로 유지한다(b의 단점 해결) — 회색 encoder 상자와 파란 momentum encoder 상자의 색 구분에 주목.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'We show that MoCo can outperform its supervised pre-training counterpart in 7 detection/segmentation tasks on PASCAL VOC, COCO, and other datasets, sometimes surpassing it by large margins.',
  src:'Abstract, p.1'}
],

diagram:{type:'compare', cap:'같은 대조 손실이지만 negative 조달처가 다르다. 왼쪽은 사전 크기 = 배치 크기, 오른쪽은 θ_k ← m·θ_k+(1−m)·θ_q (m=0.999)로 분리된다.',
 left:{t:'SimCLR: 배치 기반',
  items:['negative = 같은 배치의 나머지','사전 크기 = 배치 크기에 묶임','65536개 negative → 배치 65536 필요','양쪽 인코더 모두 backprop','TPU pod 급 자원이 전제']},
 right:{t:'MoCo: 큐 + 모멘텀 인코더',
  items:['negative = FIFO 큐 K=65536','사전 크기와 배치 크기가 독립','배치 256, GPU 8장으로 학습','gradient는 쿼리 인코더에만','키 인코더는 EMA로만 갱신']}},

math:[
 {expr:'L_q = −log[ exp(q·k₊/τ) / Σ_{i=0}^{K} exp(q·kᵢ/τ) ]',
  tex:'L_q = -\\log\\frac{\\exp(q\\cdot k_+/\\tau)}{\\sum_{i=0}^{K}\\exp(q\\cdot k_i/\\tau)}',
  d:'InfoNCE. $K+1$ 개 후보 중 positive 하나를 고르는 softmax cross-entropy이며, $K$ 가 큐 크기다. SimCLR의 NT-Xent와 수식 형태는 같고 **합의 범위가 어디서 오느냐**만 다르다.'},
 {expr:'θ_k ← m·θ_k + (1 − m)·θ_q,   m = 0.999',
  tex:'\\theta_k \\leftarrow m\\,\\theta_k + (1-m)\\,\\theta_q,\\quad m=0.999',
  d:'키 인코더는 gradient로 갱신되지 않고 쿼리 인코더의 지수이동평균으로만 움직인다. $1-m=0.001$ 이므로 한 스텝에 0.1%만 반영된다 — 사전에 든 낡은 키와 지금 만드는 키의 차이를 이 느림이 흡수한다.'}
],

numbers:[
 {k:'ImageNet 선형 평가 top-1', v:'60.6%', d:'ResNet-50, 비슷한 크기 모델 중 당시 최고'},
 {k:'큐 크기 K', v:'65536', d:'배치 크기와 완전히 독립. memory bank와 달리 최근 스텝의 키만 남는다'},
 {k:'모멘텀 계수 m', v:'0.999', d:'0.9보다 확실히 좋고, **m=0이면 학습이 실패**한다'},
 {k:'학습 배치', v:'256 (GPU 8장)', d:'SimCLR가 요구하던 4096과 대비되는 지점'},
 {k:'MoCo v2 top-1', v:'67.5% (200 epoch)', d:'MLP head·blur augmentation·cosine 스케줄만 이식. 800 epoch에서 71.1%'}
],

impact:'가장 큰 기여는 정확도 숫자가 아니라 **접근성**이다. 대조학습이 8-GPU 서버에서 재현 가능해지면서 자기지도 연구의 참여 폭이 넓어졌다. 내용 면에서는 두 가지가 남았다. 첫째, 논문이 강조한 대로 MoCo 표현은 선형 평가보다 **전이(transfer)에서 더 빛났다** — PASCAL VOC·COCO의 7개 검출/분할 태스크에서 [ImageNet](#/p/imagenet) 지도학습 사전학습을 앞질렀고, 이는 "사전학습은 라벨로 한다"는 10년짜리 관행에 실질적인 균열을 냈다. 둘째, **모멘텀 인코더**라는 부품이 이 논문에서 확립되어 [BYOL](#/p/byol)·[DINO](#/p/dino)로 그대로 넘어간다. 아이러니하게도 MoCo가 negative를 잘 조달하려고 만든 장치가, 곧 negative를 없애는 논문들의 핵심 부품이 된다.',

legacy:[
 '**모멘텀 인코더의 정착** — [BYOL](#/p/byol)의 target network, [DINO](#/p/dino)의 teacher가 모두 같은 EMA 갱신식을 쓴다',
 '**MoCo v2 / v3** — v2는 [SimCLR](#/p/simclr)의 MLP head와 augmentation을 흡수했고, v3는 백본을 [ViT](#/p/vit)로 바꾸며 트랜스포머 자기지도의 불안정성(패치 임베딩 freeze)을 진단',
 '**지도학습 사전학습의 상대화** — 검출/분할 전이에서 라벨 사전학습을 이긴 첫 사례군으로 인용되며, [DINOv2](#/p/dinov2)의 "라벨 없는 범용 특징" 주장의 근거가 됨',
 '**BN 누수에 대한 경각심** — shuffling BN 이후 자기지도 구현에서 SyncBN·LayerNorm 선택이 표준 점검 항목이 됨'
],

pitfalls:[
 '**큐를 무한정 키운다고 좋아지지 않는다.** $K$ 를 늘리면 이득이 빠르게 포화하고, 너무 크면 큐 뒤쪽 키가 다시 낡아 일관성이 깨진다. 큐 크기와 모멘텀은 **함께** 맞춰야 하는 한 쌍이다.',
 '**MoCo v1과 v2의 숫자를 섞어 인용하는 경우가 많다.** 60.6%는 v1, 67.5%/71.1%는 v2이며 v2가 추가한 것은 구조가 아니라 [SimCLR](#/p/simclr)에서 가져온 MLP head와 augmentation이다.',
 '**분산 학습 없이 그대로 옮기면 성능이 안 나온다.** shuffling BN은 GPU가 여러 장이라는 전제 위에 있어서, 단일 GPU 구현에서는 BN 누수를 다른 방식(SyncBN 제거, GN 사용 등)으로 따로 막아야 한다.'
],

links:[
 {t:'arXiv 1911.05722 — Momentum Contrast for Unsupervised Visual Representation Learning', u:'https://arxiv.org/abs/1911.05722'},
 {t:'arXiv 2003.04297 — Improved Baselines with Momentum Contrastive Learning (MoCo v2)', u:'https://arxiv.org/abs/2003.04297'},
 {t:'facebookresearch/moco (공식 구현)', u:'https://github.com/facebookresearch/moco'}
]
});
