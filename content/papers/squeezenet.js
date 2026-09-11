WIKI.paper({
slug:'squeezenet',
venue:'ICLR 2017 (arXiv 2016)',
authors:'Iandola et al. (DeepScale · UC Berkeley · Stanford)',
arxiv:'1602.07360',

tldr:'`[AlexNet](#/p/alexnet)` 과 같은 ImageNet 정확도를 **50배 적은 파라미터**로, 모델 압축까지 더하면 **0.5MB 미만**으로 담아낸 논문. "정확도가 같다면 작은 모델이 이긴다"는 관점을 CNN 아키텍처 설계의 명시적 목표로 세웠다.',

context:'2016년까지 ImageNet 연구는 거의 전부 정확도 극대화가 목표였다. `[AlexNet](#/p/alexnet)`(240MB) 이후 `[GoogLeNet](#/p/googlenet)` 같은 모델은 정확도는 올렸지만 파라미터 수를 줄이는 데는 부차적으로만 신경 썼다. 한편 별도 트랙에서는 이미 학습된 큰 모델을 가지치기·양자화로 압축하는 연구(SVD, Network Pruning, Deep Compression)가 진행되고 있었다. 이 논문의 질문은 달랐다 — **압축 후 결과물을 처음부터 아키텍처 설계로 만들어낼 수 없을까?** 작은 모델은 분산 학습 시 통신량이 적고, 클라우드에서 단말로 내려받을 대역폭이 작으며, FPGA처럼 메모리가 제한된 하드웨어에 올리기 쉽다는 실용적 동기가 있었다.',

ideas:[
 {h:'Fire 모듈: squeeze로 조인 뒤 expand로 편다',
  lead:'1×1 squeeze 층으로 채널을 줄인 뒤 1×1+3×3 expand 층으로 다시 넓힌다.',
  d:'Fire 모듈은 두 층으로 구성된다. 먼저 **squeeze** 층(1×1 필터만, 채널 수 $s_{1x1}$)이 입력 채널 수를 줄이고, 이어서 **expand** 층(1×1과 3×3 필터를 섞음, 각각 $e_{1x1}$·$e_{3x3}$)이 다시 채널을 넓힌다. $s_{1x1}$ 을 $(e_{1x1}+e_{3x3})$ 보다 작게 둬서, 뒤이은 3×3 필터가 보는 입력 채널 수 자체를 줄이는 것이 핵심이다.'},
 {h:'전략 1 — 3×3을 1×1로 바꾼다',
  lead:'1×1 필터는 3×3보다 파라미터가 9배 적다.',
  d:'필터 하나의 파라미터 수는 (입력 채널) × (필터 수) × (커널 크기)² 에 비례한다. 커널을 3×3에서 1×1로 바꾸면 그 항이 9배 줄어든다. SqueezeNet은 필터 예산의 대부분을 1×1에 배정해 이 비용을 직접 깎는다.'},
 {h:'전략 2 — 3×3 필터가 보는 입력 채널 수를 줄인다',
  lead:'squeeze 층이 3×3 필터 앞단의 채널 폭 자체를 좁힌다.',
  d:'파라미터 수는 필터 크기뿐 아니라 **입력 채널 수**에도 비례한다. squeeze 층으로 3×3 필터에 들어가는 채널 수를 먼저 줄이면, 남은 3×3 필터들의 총 파라미터도 함께 줄어든다. 전략 1이 필터의 모양을 바꾼다면, 전략 2는 그 필터가 보는 입력의 폭을 바꾼다.'},
 {h:'전략 3 — 다운샘플링을 뒤로 미룬다',
  lead:'stride>1을 네트워크 뒤쪽에 몰아 활성화 맵을 오래 크게 유지한다.',
  d:'같은 파라미터 예산이라도 활성화 맵(feature map)이 클수록 분류 정확도가 높아진다는 관찰(He & Sun, 2015)에 따라, conv1·fire4·fire8·conv10 뒤에만 stride-2 max-pooling을 둬 다운샘플링을 네트워크 뒤쪽에 집중시켰다. 전략 1·2가 파라미터를 줄이는 전략이라면, 전략 3은 같은 예산에서 정확도를 최대화하는 전략이다.'},
 {h:'파라미터를 줄인 모델도 여전히 압축이 먹힌다',
  lead:'Fire 모듈로 이미 작아진 4.8MB 모델에 Deep Compression을 또 적용해도 정확도가 유지된다.',
  d:'"작은 모델은 이미 밀도가 높아서 압축이 잘 안 먹힐 것"이라는 우려가 있었다. 그러나 SqueezeNet(4.8MB)에 6비트 Deep Compression을 적용해도 top-1 57.5%가 그대로 유지되며 0.47MB까지 줄었다. 즉 **아키텍처 설계로 줄이는 파라미터**와 **사후 압축으로 줄이는 파라미터**는 독립적으로 누적된다는 것을 보였다.'}
],

diagram:{type:'stack', cap:'Fire 모듈 하나의 내부 구조. squeeze(주황)가 채널을 조이고 expand(초록)가 다시 편다.',
 layers:[
  {t:'입력', s:'채널 수 C'},
  {t:'squeeze 1×1', s:'채널 → s1x1', acc:true, note:'3x3 앞단 채널 폭 축소'},
  {t:'ReLU', s:''},
  {t:'expand 1×1', s:'e1x1 필터', note:'expand 절반'},
  {t:'expand 3×3', s:'e3x3 필터', note:'expand 나머지 절반'},
  {t:'채널 방향 concat', s:'e1x1 + e3x3'},
  {t:'ReLU', s:''}
 ]},

math:[
 {expr:'3x3 conv 파라미터 = 입력채널 × 필터수 × 9',
  tex:'\\#\\text{params} = C_{in}\\times C_{out}\\times 3\\times 3',
  d:'3×3 필터의 파라미터 수는 입력 채널과 필터 수에 선형 비례하고 커널 크기의 제곱(9)이 곱해진다. 커널을 1×1로 바꾸면 이 9가 1이 되고(전략 1), squeeze로 $C_{in}$ 을 줄이면 그 항도 함께 줄어든다(전략 2).'}
],

numbers:[
 {k:'모델 크기', v:'4.8MB', d:'`[AlexNet](#/p/alexnet)` 240MB 대비 **50배** 작음, 같은 top-5 80.3%'},
 {k:'압축 후 크기', v:'0.47~0.66MB', d:'Deep Compression(6비트/8비트) 적용 시, AlexNet 대비 **510배/363배**'},
 {k:'ImageNet top-1 / top-5', v:'57.5% / 80.3%', d:'AlexNet(57.2%/80.3%)과 동급 이상'},
 {k:'Simple Bypass 적용 시', v:'60.4% / 82.5%', d:'모델 크기 4.8MB 그대로, residual형 우회 연결만 추가'},
 {k:'1×1 필터의 파라미터 절감', v:'3×3 대비 9배 적음', d:'전략 1의 근거'}
],

impact:'SqueezeNet은 "정확도가 같다면 파라미터 수를 아키텍처 설계 목표로 삼는다"는 경량화 연구 계보의 출발점을 열었다. 이후 `[MobileNet](#/p/mobilenet)`의 depthwise separable conv, `[ShuffleNet](#/p/shufflenet)`의 group conv + channel shuffle이 같은 문제의식을 다른 방식으로 풀었다. 다만 SqueezeNet 자체는 1×1 필터를 늘리는 방식이라 **실제 추론 속도(지연시간)** 를 최적화한 것은 아니며, 이는 후속 논문들이 직접 지적하고 개선한 지점이다.',

legacy:[
 '**경량 CNN 계보의 시작** — `[MobileNet](#/p/mobilenet)`(depthwise separable), `[ShuffleNet](#/p/shufflenet)`(group conv + shuffle)로 이어지며 "파라미터/연산량 대비 정확도"가 독립된 설계 축이 됨',
 '**압축과 설계의 분리 확인** — 아키텍처로 줄인 파라미터 위에 양자화·가지치기를 또 적용할 수 있다는 것을 실증해, 이후 경량 모델도 사후 압축 파이프라인을 함께 쓰는 관행을 정착시킴',
 '**엣지·모바일 배포의 실용적 동기 부여** — FPGA·자율주행차·모바일처럼 메모리·대역폭 제약이 있는 환경을 명시적 목표로 삼은 초기 사례',
 '**"파라미터 수 ≠ 속도"라는 반례로도 인용됨** — 1×1 필터가 많다고 항상 빠른 것은 아니라는 점이 이후 논문들에서 SqueezeNet을 반례로 언급하는 계기가 됨'
],

pitfalls:[
 '**파라미터 수와 실제 추론 속도는 다른 지표다.** 이 논문은 모델 크기(저장 공간)를 최적화했지, 지연시간(latency)을 최적화하지 않았다. 1×1 필터 위주 설계가 실제 하드웨어에서 항상 빠른 것은 아니다.',
 '**"AlexNet 수준 정확도"이지 SOTA가 아니다.** 발표 시점 기준으로도 ImageNet 최고 정확도 모델들과는 거리가 있었고, 목표 자체가 "동일 정확도에서 크기 최소화"였다는 점을 혼동하면 안 된다.',
 '**Deep Compression 수치(0.5MB)는 SqueezeNet 자체의 결과가 아니다.** Fire 모듈 아키텍처(4.8MB)에 별도의 사후 압축 기법을 추가로 적용한 결과이며, 두 기여를 하나로 뭉뚱그리면 안 된다.'
],

figures:[
 {f:'fig1-fire-module.png',
  cap:'위(주황 타원)가 squeeze 층 — 1×1 필터만 써서 채널을 조인다. 아래(초록 타원)가 expand 층 — 왼쪽 얇은 상자 4개가 1×1 필터, 오른쪽 두꺼운 상자 4개가 3×3 필터이고 둘의 출력을 채널 방향으로 이어붙인다. 이 예시는 $s_{1x1}{=}3$, $e_{1x1}{=}4$, $e_{3x3}{=}4$.',
  src:'원문 Figure 1, p.4'}
],

quotes:[
 {t:'SqueezeNet achieves AlexNet-level accuracy on ImageNet with 50x fewer parameters. Additionally, with model compression techniques, we are able to compress SqueezeNet to less than 0.5MB (510x smaller than AlexNet).',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1602.07360 — SqueezeNet', u:'https://arxiv.org/abs/1602.07360'},
 {t:'공식 GitHub (DeepScale/SqueezeNet)', u:'https://github.com/DeepScale/SqueezeNet'}
]
});
