WIKI.paper({
slug:'shufflenet',
venue:'CVPR 2018',
authors:'Zhang, Zhou, Lin, Sun (Megvii/Face++)',
arxiv:'1707.01083',

tldr:'그룹 합성곱으로 $1\\times1$ 합성곱(pointwise)의 연산량까지 줄이되, 그룹 간 정보 단절이라는 부작용을 **채널 셔플**이라는 파라미터 없는 연산 하나로 해결한 초경량 CNN. 10~150 MFLOPs급 모바일 예산에서 [MobileNet](#/p/mobilenet)을 앞섰다.',

context:'[MobileNet](#/p/mobilenet)의 depthwise separable convolution은 $3\\times3$ 공간 필터링은 depthwise로 값싸게 처리했지만, 채널을 섞는 $1\\times1$ pointwise convolution은 그대로 남겨뒀다. 문제는 극도로 작은 모델(10~150 MFLOPs)에서는 이 pointwise 층이 전체 연산의 대부분을 차지한다는 점이다 — 논문은 ResNeXt 잔차 유닛에서 pointwise 합성곱이 전체 연산의 **93.4%**를 차지한다고 지적한다. [AlexNet](#/p/alexnet) 이래로 그룹 합성곱은 채널을 그룹으로 나눠 각 그룹 안에서만 합성곱해 연산을 줄이는 기법으로 알려져 있었지만, pointwise 층에 그대로 적용하면 그룹 사이에 정보가 전혀 오가지 못해 표현력이 떨어지는 부작용이 있었다.',

ideas:[
 {h:'채널 셔플: 그룹 경계를 파라미터 없이 허문다',
  lead:'그룹 합성곱 출력을 재배열해 다음 층의 각 그룹이 이전 층 모든 그룹의 정보를 받게 한다.',
  d:'그룹 $g$개, 그룹당 $n$채널인 GConv 출력을 $(g, n)$ 형태로 reshape한 뒤 **전치(transpose)**하고 다시 펼쳐서 다음 GConv에 넣는다. 이렇게 하면 다음 층의 각 그룹이 이전 층의 서로 다른 모든 그룹에서 한 채널씩 받게 되어, 그룹을 나눠 연산량을 줄이면서도 그룹 간 정보 교환이 살아난다. 연산은 순수한 인덱스 재배열이라 **추가 파라미터도 추가 FLOPs도 거의 없다**. 저자들은 이 아이디어가 cuda-convnet의 "random sparse convolution"과 사실상 같은 효과지만, 별도 모듈로 명시해 작은 모델 설계에 체계적으로 적용한 것은 이 논문이 처음이라고 말한다.'},
 {h:'ShuffleNet 유닛: 두 GConv 사이에 셔플 하나',
  lead:'ResNet 병목 유닛의 두 pointwise 합성곱을 그룹 합성곱으로 바꾸고 사이에 셔플을 끼운다.',
  d:'기본 유닛은 `1x1 GConv → 채널 셔플 → 3x3 DWConv → 1x1 GConv`를 잔차로 더한다. 두 번째 GConv 뒤에는 셔플을 추가로 넣지 않는데, 실험상 성능 차이가 없었기 때문이다. Stride=2 다운샘플링 유닛에서는 shortcut 경로에 $3\\times3$ average pooling을 넣고, 덧셈 대신 **concat**으로 바꿔 채널 수를 늘리는 데 드는 추가 연산을 거의 없앤다.'},
 {h:'FLOPs 예산을 채널 수로 바꾼다',
  lead:'같은 연산 예산에서 그룹 수를 늘릴수록 남는 여유를 채널 폭 확장에 쓴다.',
  d:'ShuffleNet 유닛의 연산량은 $hw(2cm/g + 9m)$로, 그룹 수 $g$가 커질수록 pointwise 비용이 줄어든다. 같은 FLOPs 예산 안에서 그 여유를 **채널 수를 늘리는 데** 재투자하면 표현력이 커진다는 것이 논문의 핵심 관찰이다. 실제로 38 MFLOPs 예산에서 Stage 4의 출력 채널 수는 VGG류 50, ResNet 192, Xception류 288인 데 비해 ShuffleNet은 576까지 늘릴 수 있었고, 이것이 정확도 우위로 이어진다는 상관관계를 논문이 직접 보고한다.'}
],

diagram:{type:'flow', cap:'ShuffleNet 유닛의 잔차 분기: 1x1 그룹 합성곱 뒤 채널을 재배열(셔플)하고서 depthwise 3x3, 다시 1x1 그룹 합성곱.',
 nodes:[
  {t:'1x1 GConv', s:'그룹별 채널 압축', acc:false},
  {t:'채널 셔플', s:'reshape+전치, 무파라미터', acc:true},
  {t:'3x3 DWConv', s:'depthwise 필터링'},
  {t:'1x1 GConv', s:'그룹별 채널 복원'}
 ]},

math:[
 {expr:'ShuffleNet unit FLOPs = hw(2cm/g + 9m)   vs ResNet: hw(2cm + 9m²)   vs ResNeXt: hw(2cm + 9m²/g)',
  tex:'\\text{ShuffleNet: } hw\\!\\left(\\frac{2cm}{g}+9m\\right) \\quad\\text{vs}\\quad \\text{ResNet: } hw(2cm+9m^2) \\quad\\text{vs}\\quad \\text{ResNeXt: } hw\\!\\left(2cm+\\frac{9m^2}{g}\\right)',
  d:'$c$는 입력 채널, $m$은 병목(중간) 채널, $g$는 그룹 수. ShuffleNet만 pointwise 항($2cm$)에도 $g$로 나누는 효과가 들어가 있어, 그룹 수가 커질수록 같은 $m$에서 훨씬 싸진다.'}
],

numbers:[
 {k:'ImageNet Top-1 오차 (40 MFLOPs급)', v:'MobileNet 대비 절대 -7.8%p', d:'같은 연산 예산에서 ShuffleNet이 훨씬 낮은 오차'},
 {k:'ShuffleNet 2× (g=3)', v:'26.3% 오차 · 524 MFLOPs', d:'VGG-16(28.5%·15300 MFLOPs) 대비 오차도 낮고 연산량은 30분의 1'},
 {k:'ShuffleNet 0.5× (g=4)', v:'41.6% 오차 · 38 MFLOPs', d:'AlexNet(42.8%·720 MFLOPs) 급 정확도를 19배 적은 연산으로'},
 {k:'실측 지연 (Snapdragon 820)', v:'15.2ms @224², 87.4ms @480×640', d:'ARM 기반 **Qualcomm Snapdragon 820**, 단일 스레드 실측(Table 8)'},
 {k:'AlexNet 대비 실측 속도', v:'약 13배', d:'이론적 FLOPs 감소는 18배지만 메모리 접근 등 오버헤드로 실측은 그보다 낮음'},
 {k:'FLOPs↔실측 속도 비율', v:'4× 연산 감소 → 약 2.6× 실측 가속', d:'논문이 직접 관찰한 이론과 실측의 괴리'}
],

impact:'"연산량(FLOPs)을 줄이는 방법"에서 "그 연산량 절감분을 어디에 재투자할지"로 설계 관점을 옮겼다. 그룹 합성곱과 채널 셔플의 조합은 이후 여러 경량 아키텍처에 재사용됐고, 무엇보다 이 논문 스스로 실측 지연을 함께 보고하면서 **FLOPs가 실제 속도의 완전한 대리 지표가 아니라는 문제의식**을 처음으로 명시적으로 드러냈다.',

legacy:[
 '**ShuffleNet V2** — 저자들이 이후 논문에서 "FLOPs는 속도의 부정확한 대리 지표"라고 정면으로 반박하며 메모리 접근 비용(MAC)·병렬도·플랫폼 특성을 반영한 실용적 설계 가이드라인을 제시(이 위키에는 없음)',
 '**그룹 합성곱의 재조명** — ResNeXt에서 시작된 그룹 합성곱이 초경량 모델의 표준 도구로 자리잡는 계기',
 '**실측 지연시간 보고의 관행화** — 이후 경량 모델 논문들이 FLOPs와 함께 특정 모바일 칩 실측치를 나란히 싣는 관례로 이어짐',
 '**모바일 검출·세그멘테이션 백본** — ShuffleNet 유닛이 실시간 검출기의 경량 인코더로 널리 쓰임'
],

pitfalls:[
 '**이 논문이 최적화한 지표는 FLOPs다.** 정확도-대-FLOPs 곡선에서는 우수하지만, 그룹 합성곱과 채널 셔플의 인덱스 재배열은 실제 하드웨어에서 메모리 접근 패턴이 불리해 FLOPs만큼 빨라지지 않을 수 있다 — 후속 ShuffleNet V2가 바로 이 지점을 비판한다.',
 '**채널 셔플이 "그룹 합성곱을 없앤다"는 뜻이 아니다.** 그룹 구조 자체는 유지한 채 그룹 사이의 정보 흐름만 재배열로 복구하는 것이다. 그룹 수를 늘릴수록 연산은 싸지지만 무한정 늘리면 오히려 정확도가 떨어지는 지점이 있다(논문 Table 3).',
 '**두 번째 GConv 뒤에는 셔플을 넣지 않는다.** 첫 GConv 뒤에만 셔플을 적용하는 것이 논문의 설계이며, 구현 시 이 위치를 놓치면 원 논문과 다른 구조가 된다.'
],

figures:[
 {f:'fig1-channel-shuffle.png',
  cap:'(a) 그룹 합성곱을 두 번 쌓으면 출력 채널이 같은 그룹의 입력 채널하고만 연결된다(색이 안 섞임). (b) GConv2가 GConv1의 서로 다른 그룹에서 입력을 받도록 하면 색이 섞인다 — 이것이 목표. (c) 그 목표를 화살표 없이 구현하는 방법이 채널 셔플: reshape 후 전치로 그룹을 섞은 뒤 다음 GConv에 넣는다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-shufflenet-unit.png',
  cap:'(a) 표준 depthwise 병목 유닛. (b) ShuffleNet 유닛: 두 1x1 합성곱이 그룹 합성곱(GConv)이고 그 사이에 Channel Shuffle이 끼어든다. (c) stride=2 버전: shortcut에 average pooling을 넣고 마지막에 Add 대신 Concat으로 채널을 늘린다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'Compared with the state-of-the-art architecture MobileNet, ShuffleNet achieves superior performance by a significant margin, e.g. absolute 7.8% lower ImageNet top-1 error at level of 40 MFLOPs.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1707.01083 — ShuffleNet', u:'https://arxiv.org/abs/1707.01083'},
 {t:'ShuffleNet V2 (후속, 실측 속도 지침)', u:'https://arxiv.org/abs/1807.11164'}
]
});
