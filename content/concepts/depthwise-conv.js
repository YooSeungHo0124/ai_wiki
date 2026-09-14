WIKI.concept({
slug:'depthwise-conv',

tldr:'표준 합성곱 하나를 "채널별로 공간 필터링"과 "위치별로 채널 섞기" 두 단계로 쪼갠 것으로, 이론 연산량을 8~9배 줄이지만 실제 속도 이득은 하드웨어 특성 때문에 그보다 훨씬 작다.',

why:'MobileNet·EfficientNet 계열이 "파라미터 수가 적다"는 말만 듣고 실제 기기에서 돌려보면 기대만큼 안 빠른 경험을 하게 된다. FLOPs 감소와 실제 지연시간(latency) 감소가 왜 같지 않은지를 이해하지 못하면 모바일·엣지 배포에서 계속 같은 실수를 반복하게 된다.',

sections:[
 {h:'표준 합성곱의 연산량', d:'입력 채널 $C_{in}$, 출력 채널 $C_{out}$, 커널 크기 $K\\times K$, 출력 공간 크기 $H\\times W$ 인 표준 합성곱은 출력의 각 위치·각 출력 채널마다 입력의 **모든** 채널과 $K\\times K$ 영역을 함께 훑어야 한다. 곱셈 횟수는 $H\\cdot W\\cdot C_{in}\\cdot C_{out}\\cdot K^2$ 이다 — 출력 채널 하나를 만드는 데도 입력의 모든 채널 정보를 다 써야 한다는 점이 연산량을 키우는 근본 원인이다.'},
 {h:'두 단계로 쪼개기', d:'depthwise separable convolution 은 이 하나의 연산을 두 단계로 나눈다. **(1) depthwise convolution**: 채널마다 독립적으로 $K\\times K$ 필터 하나씩만 적용한다 — 채널을 섞지 않고 공간 방향으로만 필터링한다. 연산량은 $H\\cdot W\\cdot C_{in}\\cdot K^2$ 로, 표준 합성곱에서 $C_{out}$ 에 대한 의존이 사라진 것과 같다. **(2) pointwise convolution**: $1\\times1$ 커널로 depthwise 출력을 가로질러 채널만 섞는다 — 공간 방향 필터링 없이 채널 방향 선형결합만 한다. 연산량은 $H\\cdot W\\cdot C_{in}\\cdot C_{out}$ 이다. 두 단계를 합치면 "공간 필터링"과 "채널 혼합"이라는 표준 합성곱의 두 역할을 분리해서 각각 더 싸게 수행하는 셈이다.'},
 {h:'연산량 비율 — 직접 계산', d:'표준 합성곱 대비 depthwise separable 의 연산량 비율은 두 방식의 곱셈 횟수를 나누면 바로 나온다: $\\dfrac{H W C_{in}K^2 + HWC_{in}C_{out}}{HWC_{in}C_{out}K^2}=\\dfrac{1}{C_{out}}+\\dfrac{1}{K^2}$. $K=3$(가장 흔한 3×3 커널), $C_{out}$ 이 충분히 크다고 하면 이 값은 대략 $\\frac19\\approx0.11$ 이 된다 — 즉 이론적으로 연산량이 **약 8~9배** 줄어든다. $K=5$ 로 늘리면 $\\frac{1}{25}=0.04$ 로 줄어드는 비율이 더 커진다 — 커널이 클수록 depthwise separable 의 이득이 커진다는 뜻이다.'},
 {h:'이론과 실제 속도차', d:'이 계산은 곱셈-덧셈 횟수(FLOPs) 만 비교한 것이고, 실제 실행 시간은 FLOPs 가 아니라 **메모리 접근 패턴과 하드웨어 활용률**이 좌우한다. depthwise convolution 은 채널마다 아주 작은 연산(공간 필터 하나)을 독립적으로 수행하므로 GPU 의 대규모 병렬 행렬곱 유닛(cuDNN 이 최적화한 GEMM 커널)을 제대로 활용하지 못한다 — 연산 강도(arithmetic intensity, 연산량 대비 메모리 접근량)가 낮아 메모리 대역폭에 병목이 걸리는 memory-bound 연산이 된다. 반면 표준 합성곱은 채널을 다 섞는 큰 행렬곱으로 환원되어 하드웨어가 훨씬 효율적으로 처리한다. 그 결과 FLOPs 는 8~9배 줄었어도 실제 벽시계 시간(wall-clock latency)은 그 비율만큼 줄지 않고, 커널 실행 오버헤드·데이터 이동 비용이 상대적으로 커진다.'},
 {h:'실무에서', d:'MobileNet 은 depthwise separable convolution 을 표준 블록으로 채택해 파라미터·FLOPs 를 극적으로 줄였고, EfficientNet 은 여기에 채널·해상도·깊이를 함께 조절하는 compound scaling 을 더했다. 실무에서는 "FLOPs 가 적으니 빠르겠지"라고 가정하지 말고, 실제 배포 대상 하드웨어(모바일 NPU, 특정 GPU)에서 직접 지연시간을 측정해야 한다 — 하드웨어에 따라 depthwise conv 전용 가속 유닛이 있는지 없는지에 따라 실제 이득이 크게 갈린다. 예컨대 같은 depthwise separable 모델이라도 모바일 NPU 에서는 이론에 가까운 배속을 보이는 반면, depthwise 연산에 특화된 커널이 없는 구형 GPU 에서는 표준 합성곱보다 오히려 느리게 측정되는 경우도 보고된다. 벤치마크를 돌릴 때는 FLOPs 표만 보고 판단하지 말고, 실제 배치 크기·입력 해상도 조건에서 프로파일러로 커널별 실행 시간을 직접 재는 것이 유일하게 믿을 수 있는 확인 방법이다.'}
],

math:[
 {tex:'\\text{표준}=HWC_{in}C_{out}K^2,\\qquad \\text{depthwise separable}=HWC_{in}K^2+HWC_{in}C_{out}',
  expr:'연산량(곱셈 횟수) 비교', d:'$H,W$ 는 출력 공간 크기, $C_{in},C_{out}$ 은 입출력 채널 수, $K$ 는 커널 한 변의 길이. depthwise separable 은 표준 합성곱의 두 항(공간 필터링·채널 혼합)을 분리해 각각 더 적은 연산으로 수행한다.'},
 {tex:'\\dfrac{1}{C_{out}}+\\dfrac{1}{K^2}',
  expr:'연산량 절감 비율', d:'$K=3,\\ C_{out}\\gg1$ 이면 약 $1/9$ — 이론상 8~9배 연산량 감소. $K$ 가 커질수록 절감 폭이 커진다.'}
],

diagram:{type:'flow', cap:'표준 합성곱 하나를 depthwise(공간)와 pointwise(채널) 두 단계로 쪼갠다.',
 nodes:[
  {t:'입력', s:'C_in 채널'},
  {t:'depthwise K×K', s:'채널별 독립'},
  {t:'pointwise 1×1', s:'채널 혼합'},
  {t:'출력', s:'C_out 채널'}
 ]},

confuse:[
 {a:'depthwise convolution', b:'grouped convolution', d:'depthwise 는 그룹 수가 입력 채널 수와 같은(그룹당 채널 1개) 극단적인 grouped convolution 이다. AlexNet 이 GPU 메모리 제약으로 썼던 grouped convolution 은 그룹 수가 더 적어(예: 2그룹) 그룹마다 여러 채널을 함께 다룬다.'},
 {a:'FLOPs 감소', b:'실제 지연시간(latency) 감소', d:'이 문서의 핵심 구분이다 — FLOPs 는 연산 횟수만 세고, latency 는 메모리 접근·병렬화 효율까지 반영한다. depthwise conv 는 FLOPs 는 크게 줄지만 memory-bound 특성 때문에 latency 감소 폭은 그보다 작다.'},
 {a:'pointwise convolution(1×1)', b:'[FFN](#/c/ffn)의 선형 층', d:'수학적으로는 둘 다 채널 방향 선형결합이라는 점에서 동일하다 — 1×1 합성곱은 공간의 각 위치에 대해 독립적으로 완전연결층 하나를 적용하는 것과 같다.'}
],

pitfalls:[
 '"depthwise separable 은 표준 합성곱보다 항상 8~9배 빠르다"고 단정하면 안 된다 — 그건 FLOPs 비율이지 실측 latency 비율이 아니다.',
 'depthwise convolution 을 단독으로만 쓰면 채널 간 정보 교환이 전혀 없다는 것을 놓치기 쉽다 — 반드시 pointwise(1×1) 단계와 짝을 이뤄야 표준 합성곱의 표현력에 근접한다.',
 '커널 크기 $K$ 가 작을수록(예: 1×1) depthwise separable 의 이득이 거의 없어진다는 것을 잊으면 안 된다 — 이득은 $K^2$ 이 클 때 커진다.'
],

papers:['mobilenet','efficientnet'],
terms:['convolution','cnn','ffn']
});
