WIKI.paper({
slug:'moco-v2',
venue:'arXiv 2020 (tech note)',
authors:'Chen, Fan, Girshick, He (Facebook AI Research)',
arxiv:'2003.04297',

tldr:'[SimCLR](#/p/simclr)가 검증한 두 기법(MLP projection head, 강한 데이터 증강)을 그대로 [MoCo](#/p/moco)에 이식한 3쪽짜리 짧은 보고서. 8-GPU 한 대로 SimCLR의 대형 배치 결과를 넘어서면서, 두 기법이 프레임워크에 무관하게 통한다는 것을 보였다.',

context:'2020년 초, 대조학습(contrastive learning) 진영은 두 갈래로 갈려 있었다. [MoCo](#/p/moco)는 큐(queue)와 momentum encoder로 배치 크기와 negative 샘플 수를 분리해 일반 8-GPU 서버에서도 돌아갔지만, 같은 시기 [SimCLR](#/p/simclr)는 MLP projection head와 강한 증강으로 더 높은 정확도를 냈지만 4k~8k의 거대 배치가 필요해 TPU가 있어야 재현할 수 있었다. 두 기법(MLP head, 증강)이 SimCLR라는 프레임워크의 성과인지, 대조학습 일반에 통하는 개선인지가 불분명했다.',

ideas:[
 {h:'MLP projection head를 MoCo에 그대로 이식',
  lead:'fc 한 층이던 head를 2층 MLP(은닉 2048d)로 바꾸자 정확도가 뛰었다.',
  d:'기존 MoCo는 인코더 출력에 fc 한 층만 얹어 대조 손실을 계산했다. 이를 SimCLR처럼 은닉층 2048차원의 2층 MLP로 바꾸면, 이 MLP는 비지도 사전학습 단계에서만 쓰이고 이후 linear evaluation·전이 단계에서는 버려지는데도 ImageNet 정확도가 60.6%에서 62.9%로, 온도 $\\tau$ 를 재탐색하면 66.2%까지 올랐다.'},
 {h:'강한 증강을 더하면 head 없이도 오른다',
  lead:'blur 증강을 추가하면 MLP 없이도 정확도가 오르지만, 정확도 향상과 검출 성능 향상이 어긋난다.',
  d:'SimCLR의 blur 증강을 MoCo 원 증강에 더하기만 해도(MLP 없이) 정확도가 60.6%에서 63.4%로 오른다. 흥미롭게도 이 조합은 linear classification 정확도는 MLP 단독(66.2%)보다 낮은데 VOC 검출 성능은 오히려 더 높다 — **linear 정확도가 전이 성능과 단조적으로 대응하지 않는다**는 것을 직접 보여준 사례다.'},
 {h:'MLP + 증강 + cosine 스케줄을 합쳐 SimCLR를 배치 없이 넘는다',
  lead:'세 기법을 모두 더한 MoCo v2가 배치 256으로 SimCLR의 배치 8192 결과를 이겼다.',
  d:'MLP head, 추가 증강, cosine learning rate 스케줄을 모두 합친 것이 "MoCo v2"다. 배치 256·200 에폭으로 67.5%를 내 같은 조건의 SimCLR(61.9%)를 5.6%p, SimCLR의 대형 배치 결과(66.6%)까지 앞섰다. 800 에폭으로 늘리면 71.1%로, SimCLR가 1000 에폭에 4096 배치로 낸 69.3%도 넘는다.'}
],

diagram:{type:'compare', cap:'같은 두 기법을 다른 프레임워크에 꽂았을 때의 결과 대비.',
 left:{t:'end-to-end (SimCLR류)', items:['negative가 같은 배치에서만 나옴','큰 배치(4k~8k) 필수','q·k 인코더 둘 다 역전파 → 메모리 큼']},
 right:{t:'MoCo v2', items:['negative를 큐에 누적, 배치와 분리','배치 256으로 충분','MLP head + 강한 증강만 이식']}},

numbers:[
 {k:'MoCo v2, 200ep·배치256', v:'67.5%', d:'같은 조건 SimCLR(61.9%)보다 +5.6%p, SimCLR 대형배치(66.6%)도 상회'},
 {k:'MoCo v2, 800ep', v:'71.1%', d:'SimCLR 1000ep·배치4096(69.3%)보다 높음'},
 {k:'MLP head 단독 효과', v:'60.6% → 66.2%', d:'fc를 2층 MLP(2048d)로 교체 + 온도 재탐색'},
 {k:'GPU 메모리(배치256)', v:'MoCo 5.0G vs end-to-end 7.4G', d:'8×V100 16G, MoCo는 q 인코더만 역전파'},
 {k:'end-to-end 배치4096 메모리', v:'약 93.0G(추정)', d:'8-GPU 한 대로는 사실상 불가능한 수준'}
],

impact:'대조학습의 성능 향상이 특정 프레임워크의 트릭이 아니라 **기법 자체가 프레임워크 독립적**이라는 것을 3쪽짜리 보고서로 명쾌하게 정리했다. 이후 self-supervised 비전 연구에서 MoCo v2는 "가벼운 8-GPU 환경에서 재현 가능한 강한 베이스라인"으로 널리 쓰였고, MLP projection head는 이후 거의 모든 대조학습·[SimCLR](#/p/simclr) 계열 후속 연구([BYOL](#/p/byol), SwAV 등)의 기본 구성요소로 굳어졌다.',

legacy:[
 '**MLP projection head가 표준 부품으로 정착** — 이후 self-supervised 학습 논문 대부분이 별도 검증 없이 채택',
 '**"대형 배치 없이도 SOTA급"이라는 접근성 논리** — 이후 효율적 self-supervised 학습 연구의 동기가 됨',
 '**MoCo v3, [DINO](#/p/dino) 등 후속 MoCo 계열의 출발점** — v2의 조합이 이후 버전에서 아키텍처(ViT 인코더 등)로 확장됨',
 '**"linear 정확도와 전이 성능이 다를 수 있다"는 경고** — 이후 self-supervised 평가에서 linear probe 단일 지표에 대한 경계심을 남김'
],

pitfalls:[
 '**단순 조합 실험이지 새 알고리즘이 아니다.** 논문 스스로 "note"라고 부르듯, MoCo나 SimCLR의 핵심 메커니즘(큐, momentum encoder, InfoNCE)은 그대로이고 기존 두 기법을 재조합했을 뿐이다.',
 '**linear classification 정확도가 오르는 방향과 object detection 전이 성능이 오르는 방향이 항상 같지 않다.** Table 1(a) vs (b) 비교가 이를 직접 보여준다 — 한 지표만 보고 표현 품질을 단정하면 안 된다.'
],

figures:[
 {f:'fig1-mechanisms.png',
  cap:'왼쪽(end-to-end): q·k 두 인코더를 같은 배치에서 역전파해 affinity 행렬(정사각형)을 만든다. 오른쪽(MoCo): q만 인코더로, k는 momentum encoder로 만들고 이전 배치들의 표현을 담은 queue와 concat해 negative 수를 배치 크기와 분리한다 — affinity 행렬이 가로로 길어지는 것이 이 분리를 보여준다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'With simple modifications to MoCo—namely, using an MLP projection head and more data augmentation—we establish stronger baselines that outperform SimCLR and do not require large training batches.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2003.04297 — Improved Baselines with Momentum Contrastive Learning', u:'https://arxiv.org/abs/2003.04297'}
]
});
