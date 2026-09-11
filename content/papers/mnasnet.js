WIKI.paper({
slug:'mnasnet',
venue:'CVPR 2019',
authors:'Mingxing Tan, Bo Chen, Ruoming Pang, Vijay Vasudevan, Mark Sandler, Andrew Howard, Quoc V. Le (Google)',
arxiv:'1807.11626',

tldr:'[NASNet](#/p/nasnet)·[DARTS](#/p/darts) 계열이 정확도만 최적화하던 것과 달리, **실제 휴대폰에서 측정한 지연시간**을 목적함수에 직접 넣은 다목적 NAS. 정확도를 "제약 아래" 최적화하지 않고 정확도·지연시간을 하나의 보상으로 묶어, Pixel 폰에서 MobileNetV2보다 빠르면서 더 정확한 모델을 찾았다.',

context:'모바일 CNN 설계는 정확도와 자원 효율(연산량·지연시간) 사이 트레이드오프를 사람이 손으로 조율해야 하는 문제였다. [NASNet](#/p/nasnet)·[DARTS](#/p/darts) 등 기존 NAS는 정확도만 목적함수로 삼거나, 지연시간 대신 **FLOPS**를 대리 지표로 썼다. 그런데 FLOPS가 같아도 실제 기기에서 재는 지연시간은 연산 종류·메모리 접근 패턴에 따라 크게 달라진다. 이 논문은 대리 지표를 버리고 **실제 휴대폰에서 모델을 실행해 잰 지연시간**을 탐색 루프 안에 직접 넣는다.',

ideas:[
 {h:'다목적 보상: 정확도와 지연시간을 하나의 스칼라로',
  lead:'지연시간을 하드 제약이 아니라, 목표 지연시간 대비 비율에 지수를 매겨 보상에 곱하는 소프트 제약으로 다룬다.',
  d:'기존 방식은 $\\text{maximize } ACC(m) \\text{ s.t. } LAT(m)\\le T$ 처럼 지연시간을 하드 제약으로 걸어 파레토 최적해 하나만 냈다. 이 논문은 $ACC(m)\\times(LAT(m)/T)^w$ 를 보상으로 써서, 지연시간이 목표 $T$ 근처에서 완만하게 패널티를 주는 **소프트 제약**으로 바꾼다. 지연시간이 2배가 되면 정확도가 약 5% 상대적으로 좋아져야 보상이 같다는 실측 관찰로 지수 $w=\\alpha=\\beta=-0.07$ 을 정했다.'},
 {h:'실제 기기 실행으로 지연시간을 측정',
  lead:'FLOPS 같은 대리 지표 대신, 후보 모델을 Pixel 폰에 직접 올려 실행 시간을 잰다.',
  d:'샘플링된 자식 모델마다 목표 과제(ImageNet)로 정확도 $ACC(m)$ 을 학습·측정하는 동시에, Pixel 1 폰의 단일 스레드 big CPU 코어에서 실제로 실행시켜 지연시간 $LAT(m)$ 을 잰다. 이 실측값을 그대로 보상에 넣기 때문에, 탐색 결과가 특정 대리 지표의 편향을 물려받지 않는다.'},
 {h:'계층별로 다른 블록을 고르는 계층적 탐색 공간',
  lead:'망 전체에 같은 셀을 반복하는 대신, 망을 여러 블록으로 나눠 블록마다 서로 다른 연산·커널 크기를 따로 탐색한다.',
  d:'[NASNet](#/p/nasnet)·[DARTS](#/p/darts)는 셀 하나를 찾아 망 전체에 똑같이 반복해 쌓았는데, 이 논문은 이것이 **계층 다양성**을 막는다고 지적한다. 대신 망을 여러 블록으로 나누고, 각 블록마다 커널 크기·확장 비율·squeeze-excitation 사용 여부 등을 독립적으로 탐색하는 **계층적(factorized hierarchical) 탐색 공간**을 쓴다. 입력 해상도가 큰 초반 블록일수록 지연시간에 미치는 영향이 크다는 직관이 이 설계의 동기다.'},
 {h:'하나의 탐색으로 여러 지연시간대 모델을 동시에 확보',
  lead:'같은 탐색 실험에서 목표 지연시간을 달리하면, 재탐색 없이 정확도-지연시간 곡선 위의 여러 모델을 얻는다.',
  d:'MnasNet-A1·A2·A3은 모두 같은 탐색 실험에서 나온 서로 다른 후보들로, 목표 지연시간을 달리 잡아 얻은 파레토 곡선 위의 점들이다. 강화학습 컨트롤러가 지연시간에 따라 완만하게 보상을 조절하므로, 탐색을 반복하지 않고도 여러 배포 시나리오에 맞는 모델을 한 번에 얻을 수 있다.'}
],

diagram:{type:'loop', cap:'컨트롤러가 샘플링한 모델을 학습해 정확도를 얻고 동시에 실제 휴대폰에서 실행해 지연시간을 재, 두 값을 하나의 보상으로 합쳐 컨트롤러를 갱신한다.',
 center:'다목적 보상으로 반복',
 nodes:[
  {t:'컨트롤러(RNN)', s:'모델 샘플링', acc:true},
  {t:'학습·검증', s:'ImageNet 정확도'},
  {t:'휴대폰 실행', s:'Pixel 1 실측 지연시간'},
  {t:'다목적 보상', s:'ACC×(LAT/T)^w'}
 ]},

math:[
 {expr:'maximize ACC(m) × (LAT(m)/T)^w',
  tex:'\\max_{m}\\; ACC(m)\\times\\left(\\dfrac{LAT(m)}{T}\\right)^{w}',
  d:'가중곱(weighted product) 방식의 다목적 보상. 목표 지연시간 $T$ 근처에서는 정확도와 지연시간을 함께 고려하고, 벗어날수록 지수 $w$ 가 패널티를 조절한다.'},
 {expr:'w = α (if LAT ≤ T) else β,   α = β = −0.07 (실측으로 결정)',
  tex:'w=\\begin{cases}\\alpha,& LAT(m)\\le T\\\\ \\beta,& \\text{otherwise}\\end{cases}\\qquad \\alpha=\\beta=-0.07',
  d:'지연시간이 2배, 정확도가 5% 상대적으로 오른 두 모델의 보상이 같아지도록 역산한 값. 목표 지연시간을 하드 제약이 아니라 부드러운 트레이드오프로 다루는 근거다.'}
],

numbers:[
 {k:'ImageNet top-1(MnasNet-A1)', v:'75.2% · 78ms', d:'Pixel 1 폰, MobileNetV2 대비 1.8배 빠르면서 +0.5%p 높은 정확도'},
 {k:'ImageNet top-1(MnasNet-A3)', v:'76.7% · 103ms', d:'같은 탐색에서 나온 더 정확한 버전'},
 {k:'NASNet-A 대비', v:'2.3배 빠름 · +1.2%p 정확도', d:'183ms(NASNet-A) vs 78ms(MnasNet-A1)'},
 {k:'탐색 비용', v:'64 TPUv2 × 4.5일', d:'실측 지연시간 측정 오버헤드를 포함한 강화학습 탐색'},
 {k:'보상 지수', v:'α = β = −0.07', d:'지연시간 2배 ≈ 정확도 5% 상대적 향상과 동가로 실측 보정'},
 {k:'파라미터 수(A1)', v:'3.9M', d:'MobileNetV2의 3.4M과 비슷한 규모에서 정확도만 더 높음'}
],

impact:'"정확도를 하드 제약 아래 최적화"에서 "정확도와 실측 지연시간을 하나의 보상으로 함께 최적화"로 NAS의 목적함수 자체를 바꿨다. FLOPS라는 대리 지표를 실제 기기 실측으로 대체한 것은, 이후 하드웨어 인지형(hardware-aware) NAS 전체의 표준 관행이 됐다. 계층적 탐색 공간이 주는 층별 다양성은 이후 효율적 모바일 아키텍처 설계의 기본 전제가 됐고, 이 결과는 곧바로 [MobileNetV2](#/p/mobilenetv2)의 후속 설계와 [EfficientNet](#/p/efficientnet)의 베이스라인 탐색으로 이어진다.',

legacy:[
 '**하드웨어 인지형 NAS의 표준화** — 대리 지표 대신 실측 지연시간을 보상에 넣는 방식이 이후 온디바이스 NAS 연구 전반의 기본 설계가 됨',
 '**[EfficientNet](#/p/efficientnet)의 출발점** — MnasNet 탐색 공간에서 찾은 베이스라인 망(EfficientNet-B0)에 복합 스케일링을 적용해 전체 모델 군을 확장하는 후속 연구로 직결됨',
 '**계층적 탐색 공간의 재사용** — 층마다 다른 연산을 고르는 factorized 탐색 공간이 이후 모바일 특화 NAS 논문들의 기본 틀로 자리잡음',
 '**다목적 보상 함수 설계의 참조점** — 가중곱 방식의 소프트 제약이 이후 에너지·메모리 등 다른 자원 목표를 추가하는 NAS 연구들의 출발 공식이 됨'
],

pitfalls:[
 '**지연시간 수치는 특정 기기·특정 코어에 종속적이다.** 이 논문의 지연시간은 Pixel 1 폰의 단일 스레드 big CPU 코어 기준이며, 다른 기기·다른 실행 환경(GPU·NPU·멀티스레드)에서는 같은 모델이라도 상대적 우위가 달라질 수 있다.',
 '**탐색 비용이 저렴하지 않다.** 실측 지연시간을 매 후보마다 재야 하므로 64 TPUv2로 4.5일이 들었다 — [ENAS](#/p/enas)·[DARTS](#/p/darts)의 가중치 공유형 저비용 탐색과는 다른 비용 구조다.',
 '**보상 지수 α=β=−0.07은 이 논문의 실험 관찰(지연시간 2배 ≈ 정확도 5% 향상)에서 역산된 값이다.** 다른 과제·다른 하드웨어에서는 이 트레이드오프 비율 자체가 달라질 수 있어 그대로 재사용하면 안 된다.'
],

figures:[
 {f:'fig1-overview.png',
  cap:'컨트롤러가 샘플링한 모델을 트레이너가 학습시켜 정확도를 얻고, 동시에 실제 휴대폰에 올려 지연시간을 재는 두 갈래 평가가 다목적 보상 하나로 합쳐져 컨트롤러를 갱신한다 — "정확도만 보는 루프"가 아니라는 것이 이 도식의 핵심.',
  src:'원문 Figure 1, p.1'},
 {f:'fig2-acc-latency.png',
  cap:'x축이 Pixel 폰 실측 지연시간, y축이 ImageNet top-1 정확도. 빨간 점들(MnasNet)이 같은 지연시간대의 MobileNetV2·NASNet-A·AmoebaNet-A보다 왼쪽 위(더 빠르고 더 정확한 쪽)에 위치한다.',
  src:'원문 Figure 2, p.1'}
],

quotes:[
 {t:'Unlike previous work, where latency is considered via another, often inaccurate proxy (e.g., FLOPS), our approach directly measures real-world inference latency by executing the model on mobile phones.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1807.11626 — MnasNet: Platform-Aware Neural Architecture Search for Mobile', u:'https://arxiv.org/abs/1807.11626'}
]
});
