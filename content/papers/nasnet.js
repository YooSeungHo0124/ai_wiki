WIKI.paper({
slug:'nasnet',
venue:'CVPR 2018',
authors:'Barret Zoph, Vijay Vasudevan, Jonathon Shlens, Quoc V. Le (Google Brain)',
arxiv:'1707.07012',

tldr:'전체 망을 강화학습으로 탐색하는 대신, 작은 **셀(cell) 하나**만 CIFAR-10에서 탐색하고 그 셀을 반복해 쌓아 [ImageNet](#/p/imagenet) 규모의 큰 망을 만드는 접근. 탐색 대상을 셀로 줄여 원조 Neural Architecture Search보다 탐색 비용을 7배 줄이면서 정확도는 더 높였다.',

context:'2016년 Zoph & Le의 원조 Neural Architecture Search(NAS)는 강화학습 컨트롤러로 망 전체의 연결 구조를 처음부터 탐색했다. 이 방식은 800개 GPU로 28일을 태워야 했고, CIFAR-10처럼 작은 데이터셋에서만 시도됐을 뿐 ImageNet 규모로는 그대로 확장할 수 없었다. 탐색 공간이 망 전체 크기에 비례해 커지기 때문이다. 이 논문의 질문은 명확하다 — 탐색 대상을 **망 전체가 아니라 반복되는 작은 빌딩 블록**으로 줄이면, 작은 데이터셋에서 찾은 구조를 큰 데이터셋으로 그대로 옮길 수 있지 않을까?',

ideas:[
 {h:'탐색 공간을 셀 하나로 축소',
  lead:'컨트롤러가 전체 아키텍처가 아니라 반복 적용될 셀 하나의 내부 연결만 예측한다.',
  d:'[VGG](#/p/vgg)·[ResNet](#/p/resnet)·Inception 같은 성공적인 망들이 공통적으로 같은 모듈을 반복해서 쌓은 구조라는 관찰에서 출발한다. 컨트롤러 RNN은 망 전체의 배선이 아니라, 반복될 하나의 **합성곱 셀**만 예측하도록 탐색 공간을 줄인다. 이렇게 찾은 셀은 이미지 크기에 무관하게 몇 번이든 쌓을 수 있어, CIFAR-10에서 찾은 셀을 ImageNet용 더 큰 네트워크로 그대로 옮길 수 있다.'},
 {h:'Normal Cell과 Reduction Cell, 두 종류만 탐색',
  lead:'해상도를 유지하는 Normal Cell과 절반으로 줄이는 Reduction Cell, 두 구조만 찾아 번갈아 쌓는다.',
  d:'입력 해상도를 그대로 유지하는 **Normal Cell**과, stride 2로 특징맵 크기를 절반으로 줄이는 **Reduction Cell** 두 가지를 따로 탐색한다. 최종 망은 이 두 셀을 정해진 패턴으로 번갈아 쌓아 만든다 — 셀 내부 구조는 컨트롤러가 찾고, 몇 번 반복할지(N)와 필터 수는 사람이 나중에 정한다.'},
 {h:'컨트롤러의 블록 단위 순차 예측',
  lead:'RNN이 5개 선택(입력 둘, 연산 둘, 결합 방식)을 B번 반복해 셀 하나를 완성한다.',
  d:'셀 하나는 $B$ 개의 블록으로 구성되고(논문 기본값 $B=5$), 각 블록마다 컨트롤러는 순서대로 5가지를 선택한다 — 첫 번째 은닉 상태, 두 번째 은닉 상태, 각각에 적용할 연산(7×7 depthwise-separable conv, 3×3 max pooling 등), 마지막으로 둘을 합치는 방식(덧셈 또는 concat). 이 선택 하나하나가 softmax 분류 문제로 환원되고, 완성된 자식망의 검증 정확도가 [PPO](#/p/ppo) 방식의 정책 그레이디언트로 컨트롤러를 갱신하는 보상이 된다.'},
 {h:'ScheduledDropPath: 셀 반복 구조에 맞춘 정규화',
  lead:'셀 안의 각 경로를 학습이 진행될수록 점점 더 높은 확률로 드롭시켜 과적합을 줄인다.',
  d:'기존 DropPath는 고정 확률로 경로를 끊었는데, NASNet 실험에서는 이것이 잘 작동하지 않았다. 대신 드롭 확률을 학습 과정 동안 **선형으로 증가**시키는 ScheduledDropPath를 도입했고, 이것이 CIFAR와 ImageNet 양쪽에서 최종 성능을 유의미하게 끌어올렸다.'}
],

diagram:{type:'flow', cap:'셀 하나만 작은 데이터셋에서 탐색하고, 그 셀을 반복해 쌓아 최종 망을 만든다.',
 nodes:[
  {t:'컨트롤러 RNN', s:'셀 구조 예측', acc:true},
  {t:'자식망 구성', s:'CIFAR-10 크기'},
  {t:'수렴까지 학습', s:'검증 정확도 R'},
  {t:'정책 그레이디언트', s:'PPO로 컨트롤러 갱신'},
  {t:'최적 셀 확정 후 확장', s:'ImageNet 크기로 N배 반복'}
 ]},

math:[
 {expr:'controller updates: ∇θ J via policy gradient scaled by validation accuracy R',
  tex:'\\nabla_{\\theta_c} J(\\theta_c)=\\mathbb{E}_{P(A;\\theta_c)}\\big[R\\cdot \\nabla_{\\theta_c}\\log P(A;\\theta_c)\\big]',
  d:'컨트롤러 파라미터 $\\theta_c$ 는 샘플링한 구조 $A$ 의 검증 정확도 $R$ 을 보상으로 삼는 정책 그레이디언트로 갱신된다. NAS 원 논문의 REINFORCE를 이 논문은 PPO로 대체했다.'}
],

numbers:[
 {k:'탐색 비용', v:'500 GPU × 4일 ≈ 2,000 GPU-시간', d:'원조 NAS의 800 GPU × 28일(22,400 GPU-시간) 대비 약 7배 절감(하드웨어 차이 제외 추정치)'},
 {k:'CIFAR-10 오류율', v:'2.4%', d:'당시 state-of-the-art'},
 {k:'ImageNet top-1 / top-5(최대 모델)', v:'82.7% / 96.2%', d:'발표 당시 기존 최고 대비 top-1 +1.2%p'},
 {k:'ImageNet 연산량 절감', v:'FLOPS 9B 감소(-28%)', d:'같은 수준의 기존 최고 모델 대비'},
 {k:'모바일급 최소 모델 top-1', v:'74.0%', d:'기존 모바일 특화 모델 대비 +3.1%p'},
 {k:'블록 수 B', v:'5', d:'셀 하나당 컨트롤러가 5B개의 softmax 예측을 수행'}
],

impact:'"탐색 공간을 셀 단위로 줄이면 작은 데이터셋에서 찾은 구조가 큰 데이터셋으로 전이된다"는 것을 처음 증명해, NAS를 ImageNet 규모까지 실용적으로 끌어올렸다. 탐색 비용을 7배 줄였는데도 여전히 500 GPU·4일이 필요하다는 사실 자체가, 이후 연구가 "탐색 비용을 어떻게 더 줄일 것인가"에 집중하게 만든 직접적인 계기가 됐다.',

legacy:[
 '**가중치 공유로의 전환** — 매번 자식망을 처음부터 학습시키는 비용 자체를 없애려는 시도가 [ENAS](#/p/enas)로 이어짐',
 '**셀 탐색 공간의 표준화** — Normal/Reduction Cell 구조는 이후 대부분의 NAS 논문이 그대로 채택하는 기본 틀이 됨',
 '**이산 탐색에서 연속 완화로** — 강화학습 기반 이산 탐색의 비용 문제는 경사 하강으로 구조를 찾는 [DARTS](#/p/darts)의 동기가 됨',
 '**다목적 탐색으로 확장** — 정확도만 최적화하는 한계는 지연시간을 목적함수에 직접 넣는 [MnasNet](#/p/mnasnet)에서 극복됨'
],

pitfalls:[
 '**"NASNet이 처음으로 신경망 구조를 탐색했다"는 흔한 오해다.** 강화학습으로 아키텍처를 탐색하는 것 자체는 Zoph & Le(2016)의 원조 NAS가 먼저였고, 이 논문의 기여는 **탐색 대상을 셀로 좁힌 것**이다.',
 '**탐색 비용 "7배 절감"은 하드웨어 차이를 보정하지 않은 추정치다.** 원 논문도 각주에서 원조 NAS는 K40, 이 논문은 더 빠른 P100을 썼다고 명시하며 "하드웨어 차이를 무시하면 약 7배"라고 조건을 단다.',
 '**셀 구조는 사람이 자동으로 찾았지만, 셀을 몇 번 반복할지(N)와 채널 수는 여전히 사람이 정한다.** 탐색이 완전 자동화된 것이 아니라 일부만 자동화된 것이라는 점을 놓치기 쉽다.'
],

figures:[
 {f:'fig1-rl-loop.png',
  cap:'NAS의 기본 루프: 컨트롤러(RNN)가 확률 p로 구조 A를 샘플링하면, 그 자식망을 수렴할 때까지 학습시켜 검증 정확도 R을 얻고, R로 스케일한 그레이디언트로 컨트롤러를 다시 갱신한다. NASNet은 이 루프에서 A가 "망 전체"가 아니라 "셀 하나"라는 점만 바꿨다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig3-controller.png',
  cap:'왼쪽: 블록 하나를 만들 때 컨트롤러가 순서대로 내리는 5가지 결정(입력 둘 선택 → 각각의 연산 선택 → 결합 방식 선택), 이 과정을 B번 반복해 셀 하나를 완성한다. 오른쪽: 그렇게 완성된 블록 하나의 예 — hidden layer A·B에 각각 3×3 conv·2×2 maxpool을 적용한 뒤 더해서 새 은닉층을 만든다.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'We propose to search for an architectural building block on a small dataset and then transfer the block to a larger dataset.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1707.07012 — Learning Transferable Architectures for Scalable Image Recognition', u:'https://arxiv.org/abs/1707.07012'}
]
});
