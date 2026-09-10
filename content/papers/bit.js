WIKI.paper({
slug:'bit',
venue:'ECCV 2020',
authors:'Kolesnikov, Beyer, Zhai, Puigcerver, Yung, Gelly, Houlsby (Google Research, Brain Team)',
arxiv:'1912.11370',

tldr:'새 아키텍처나 손실함수 없이, **정규화 선택(GroupNorm+Weight Standardization)** 과 **전이 하이퍼파라미터를 데이터 크기만으로 정하는 규칙(BiT-HyperRule)** 만으로 대규모 사전학습 전이의 표준 레시피를 세운 논문. 클래스당 라벨 1개부터 100만 장까지 같은 레시피로 작동한다.',

context:'[ImageNet](#/p/imagenet) 사전학습 후 미세조정하는 전이학습은 오래된 관행이지만, 데이터셋과 모델이 커질수록 두 가지 문제가 불거졌다. 하나는 [ResNet](#/p/resnet)이 기본으로 쓰는 BatchNorm이 대규모 분산학습에서 배치 통계 동기화 비용과 성능 저하를 동시에 낳는다는 것이고, 다른 하나는 새 다운스트림 과제마다 하이퍼파라미터를 탐색하는 비용이 전이학습의 장점을 갉아먹는다는 것이다. 이 논문은 **새 기법을 발명하지 않고**, 기존에 흩어져 있던 요소들(GroupNorm, Weight Standardization, 대형 데이터셋) 중 무엇이 실제로 전이에 중요한지 골라내는 데 집중한다. [ViT](#/p/vit) 논문이 BiT를 CNN 쪽 강력한 베이스라인으로 직접 비교 대상에 놓을 만큼, 사전학습 스케일링 논의의 CNN 쪽 기준점이 된다.',

ideas:[
 {h:'세 가지 크기의 사전학습: BiT-S/M/L',
  lead:'같은 레시피를 ILSVRC-2012·ImageNet-21k·JFT-300M 세 규모에 그대로 적용해 비교한다.',
  d:'BiT-S는 [ImageNet](#/p/imagenet)(130만 장), BiT-M은 ImageNet-21k(1400만 장), BiT-L은 JFT-300M(3억 장)으로 각각 사전학습한 `ResNet152x4`다. 같은 아키텍처·같은 레시피를 데이터셋 크기만 바꿔 적용했더니 BiT-S(81.30%)에서 BiT-M(85.39%)으로 ILSVRC-2012 전이 정확도가 **+4.09%p** 올랐다 — 데이터 규모 자체가 레시피의 일부라는 것을 보여준다.'},
 {h:'BatchNorm을 버리고 GroupNorm + Weight Standardization',
  lead:'배치 통계에 의존하지 않는 정규화 조합이 대형 배치·전이 양쪽에서 BatchNorm을 이긴다.',
  d:'가속기 128개·배치 4096의 대규모 분산학습에서 GroupNorm 단독은 BatchNorm보다 ILSVRC-2012 정확도가 5.4%p 낮았다. 여기에 컨볼루션 가중치를 정규화하는 Weight Standardization을 더하면 BatchNorm(75.8%)보다 높은 76.0%를 냈다. VTAB-1k 전이 성능에서도 GN+WS(70.39)가 BN+WS(66.78)를 앞서, **사전학습 정확도뿐 아니라 전이 품질까지 정규화 선택에 좌우된다**는 것을 보였다.'},
 {h:'BiT-HyperRule: 탐색 없이 데이터 크기만으로 하이퍼파라미터 결정',
  lead:'과제별 탐색 없이 이미지 해상도와 라벨 수만으로 스케줄 길이·해상도·MixUp 여부를 정한다.',
  d:'다운스트림 20개 이상의 과제 각각에 맞춤 탐색을 하는 대신, 학습률 0.003·모멘텀 0.9·배치 512는 모든 과제에 고정한다. 대신 라벨 수를 **소(2만 미만)·중(50만 미만)·대**로 나눠 각각 500/10k/20k 스텝을 학습하고, 이미지가 96×96보다 작으면 160→128 크기로, 크면 448→384 크기로 자르며, MixUp(α=0.1)은 중·대형 과제에만 적용한다. 단 하나의 규칙으로 클래스당 1장부터 100만 장까지 같은 절차가 작동한다.'},
 {h:'스케일은 모델과 데이터가 함께 커져야 이득',
  lead:'모델만 키우거나 데이터만 키우면 오히려 성능이 떨어질 수 있다.',
  d:'ResNet50x1부터 ResNet152x4까지 다섯 크기를 ILSVRC-2012·ImageNet-21k·JFT-300M 세 데이터셋에 각각 사전학습해 비교하면, 작은 모델을 JFT-300M처럼 매우 큰 데이터로 학습시키면 오히려 중간 크기 데이터보다 다운스트림 성능이 낮아지는 경우가 나타난다. 모델 용량과 사전학습 데이터 규모는 **함께 늘려야** 이득이 나는 짝이라는 것이다.'}
],

diagram:{type:'flow', cap:'사전학습(왼쪽, 데이터셋 규모에 따라 S/M/L)과 전이(오른쪽, 규칙 하나로 하이퍼파라미터 결정)가 분리된다.',
 nodes:[
  {t:'대규모 라벨 데이터', s:'1.3M~300M', a:'S/M/L'},
  {t:'ResNet152x4', s:'GN + WS', acc:true},
  {t:'BiT-HyperRule', s:'해상도·스텝 자동 결정'},
  {t:'다운스트림 미세조정', s:'라벨 1개~100만 개'}
 ]},

numbers:[
 {k:'ILSVRC-2012 Top-1 (BiT-L, 전량 라벨)', v:'87.5%', d:'클래스당 라벨 10개만으로도 76.8%'},
 {k:'CIFAR-10 Top-1 (BiT-L)', v:'99.4%', d:'클래스당 라벨 10개로는 97.0%'},
 {k:'VTAB-1k (19개 과제 평균)', v:'76.3%', d:'과제당 라벨 1000개, 과제별 튜닝 없이'},
 {k:'ImageNet-21k 사전학습 효과', v:'ILSVRC-2012 +4.09%p, Flowers +9.41%p', d:'BiT-S(ILSVRC-2012 사전학습) 대비 BiT-M'},
 {k:'GN+WS vs BN (대형배치 4096)', v:'76.0% vs 75.8%', d:'ResNet-50, 128 가속기 분산학습 기준'},
 {k:'COCO 검출 AP (RetinaNet 백본)', v:'40.8 → 43.8', d:'표준 ImageNet 사전학습 대비 BiT-L 백본'}
],

impact:'BiT는 스케일링이 스토리의 절반일 뿐이고, 나머지 절반은 "큰 배치·큰 모델에서도 무너지지 않는 정규화"와 "탐색 없이도 과제에 맞는 하이퍼파라미터를 고르는 규칙"이라는 것을 보였다. 이 논문 이후 대규모 사전학습 연구에서 BatchNorm 대신 GroupNorm·LayerNorm 계열을 기본값으로 검토하는 관행이 자리잡았고, 무엇보다 [ViT](#/p/vit)가 등장했을 때 "Transformer가 대형 데이터에서 CNN을 이기는가"라는 질문의 CNN 쪽 기준선이 바로 BiT였다. ViT 논문은 BiT-L을 직접 비교 대상으로 놓고, 비슷한 규모의 사전학습 데이터에서 Transformer가 CNN의 이 강한 레시피와 대등하거나 앞선다는 것을 보여야 했다.',

legacy:[
 '**ViT의 직접 비교 기준선** — [ViT](#/p/vit)는 BiT-L을 핵심 베이스라인으로 삼아 "같은 대형 데이터에서 Transformer가 이 CNN 레시피를 넘어서는가"를 검증한다',
 '**정규화 선택이 스케일링의 필수 요소로 인식됨** — BatchNorm의 배치 의존성 문제는 이후 대형 분산학습 레시피 전반에서 GroupNorm·LayerNorm 대안을 기본 검토 대상으로 만든다',
 '**"탐색 없는 전이 규칙"이라는 설계 철학** — BiT-HyperRule처럼 하이퍼파라미터 탐색 비용 자체를 없애는 접근은 이후 대형 파운데이션 모델의 다운스트림 적용 관행에 영향을 준다',
 '**VTAB을 표준 전이 벤치마크로 정착시킴** — 19개 이질적 과제를 한 규칙으로 처리하는 평가 방식이 이후 범용 표현 연구의 공통 벤치마크가 된다'
],

pitfalls:[
 '**"BiT가 새 아키텍처다"는 오해다.** 백본은 표준 `ResNet-v2`이고, 바뀐 것은 정규화층(GN+WS)과 전이 하이퍼파라미터 규칙뿐이다.',
 '**BiT-S/M/L을 같은 모델로 착각하기 쉽다.** 셋 다 ResNet152x4로 아키텍처는 동일하지만 사전학습 데이터셋(ILSVRC-2012/ImageNet-21k/JFT-300M)이 다른, 별도로 학습된 가중치다.',
 '**JFT-300M은 공개 데이터셋이 아니다.** BiT-L 재현은 불가능하고, 논문이 공개·재현 가능하다고 강조하는 것은 ImageNet-21k로 학습한 BiT-M 쪽이다.'
],

figures:[
 {f:'fig1-data-efficiency.png',
  cap:'다섯 데이터셋 각각에서 왼쪽 곡선(파랑)이 클래스당 라벨 수를 늘려가며 미세조정한 BiT-L, 오른쪽 막대 세 개가 전체 라벨로 미세조정했을 때 BiT-L·기존 SOTA·ILSVRC-2012 단독 사전학습 기준선의 비교. 곡선이 매우 적은 라벨에서도 가파르게 올라간다는 점이 핵심.',
  src:'원문 Figure 1, p.2'},
 {f:'fig5-scale-interaction.png',
  cap:'각 패널의 x축이 사전학습 데이터셋 크기, 점 색이 모델 크기(ResNet50x1~152x4). ILSVRC-2012 패널에서 가장 작은 모델(진한 파랑)은 JFT-300M로 갈수록 오히려 떨어지는 반면, 가장 큰 모델(연한 파랑)은 계속 오른다 — 모델과 데이터가 같이 커져야 하는 이유.',
  src:'원문 Figure 5, p.9'}
],

quotes:[
 {t:'We aim not to introduce a new component or complexity, but to provide a recipe that uses the minimal number of tricks yet attains excellent performance on many tasks.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 1912.11370 — Big Transfer (BiT): General Visual Representation Learning', u:'https://arxiv.org/abs/1912.11370'}
]
});
