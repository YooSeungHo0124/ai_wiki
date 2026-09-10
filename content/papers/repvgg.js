WIKI.paper({
slug:'repvgg',
venue:'CVPR 2021',
authors:'Ding, Zhang, Ma, Han, Ding, Sun (Tsinghua · MEGVII · HKUST)',
arxiv:'2101.03697',

tldr:'**학습할 때는 다분기(residual + 1×1) 구조**로 정확도를 얻고, **추론할 때는 그 분기들을 대수적으로 합쳐 3×3 conv만 일렬로 쌓은 VGG 형태**로 되돌리는 구조 재매개화(re-parameterization) 기법. 순수 VGG 스타일 모델이 처음으로 ImageNet top-1 80%를 넘었다.',

context:'[ResNet](#/p/resnet) 이후 정확도를 올리는 표준 수단은 다분기(multi-branch) 구조였다 — residual 덧셈, [Inception](#/p/googlenet)의 concat, [ShuffleNet](#/p/shufflenet)의 채널 셔플처럼 여러 경로를 두고 합치는 방식이다. 그런데 이 논문은 **다분기 구조의 장점이 오직 학습에만 있고 추론에는 순전히 손해**라고 주장한다. 다분기는 (1) 여러 갈래의 중간 결과를 덧셈/concat 시점까지 메모리에 들고 있어야 해서 메모리 점유가 크고, (2) 작은 연산이 여러 개로 쪼개져 GPU의 병렬성을 활용하기 어렵고, (3) [ShuffleNet](#/p/shufflenet)의 채널 셔플이나 depthwise convolution처럼 메모리 접근 비용(MAC)이 큰 연산을 포함하는 경우가 많다. 저자들은 VGG-16이 [EfficientNet](#/p/efficientnet)-B3보다 이론 FLOPs는 8.4배 많은데도 1080Ti GPU에서 1.8배 더 빠르다는 사실을 근거로, **FLOPs가 실제 속도의 좋은 대리 지표가 아니다**라고 못박는다.',

ideas:[
 {h:'학습-추론 구조 분리: 다분기로 배우고 단일 경로로 서빙',
  lead:'학습 때만 identity·1×1 분기를 더해 사실상 여러 얕은 모델의 앙상블 효과를 낸다.',
  d:'학습용 RepVGG 블록은 $y = x + g(x) + f(x)$ 형태로, 3×3 conv 주경로에 identity 분기(차원이 맞을 때만)와 1×1 conv 분기를 병렬로 더한다. [ResNet](#/p/resnet)이 residual을 암묵적으로 $2^n$개 얕은 모델의 앙상블로 만드는 것과 같은 논리를 확장해, RepVGG 블록 $n$개를 쌓으면 $3^n$개 구성원의 앙상블 효과를 낸다는 것이 저자들의 해석이다. 이 다분기는 오직 **기울기 흐름을 돕기 위한 학습용 장치**이고, 추론 시점에는 필요 없다는 것이 핵심 전제다.'},
 {h:'구조 재매개화: BN까지 포함해 세 분기를 하나의 3×3 커널로 합친다',
  lead:'conv+BN을 먼저 bias 있는 conv로 합친 뒤, identity·1×1·3×3 세 커널을 한 3×3 커널로 더한다.',
  d:'각 분기의 conv와 그 뒤 BN을 $W\'_{i} = \\frac{\\gamma_i}{\\sigma_i}W_i$, $b\'_i = \\beta_i - \\frac{\\mu_i\\gamma_i}{\\sigma_i}$ 식으로 먼저 "bias 있는 conv" 하나로 흡수한다. identity 분기는 항등행렬을 커널로 갖는 1×1 conv로, 1×1 분기는 zero-padding해서 3×3 커널의 중앙에 더하면 세 분기가 **하나의 3×3 conv 가중치와 하나의 bias**로 정확히 합쳐진다. 이 변환은 근사가 아니라 대수적으로 동치라서 정확도 손실이 전혀 없다.'},
 {h:'왜 일렬 3×3이 실제 하드웨어에서 빠른가',
  lead:'연산자 종류가 하나뿐이라 병렬화하기 쉽고, 분기가 없어 메모리 점유가 절반으로 준다.',
  d:'추론용 몸통은 3×3 conv + ReLU **단 한 종류의 연산자**만 반복한다. 분기가 여러 개면 GPU가 여러 개의 작은 커널을 따로 실행하고 동기화해야 해 launch 오버헤드가 커지지만, 단일 경로는 큰 연산 하나로 처리돼 병렬도가 높다. 메모리 측면에서도 residual 블록은 덧셈 시점까지 입력과 출력을 동시에 들고 있어야 해 피크 메모리가 입력의 2배인 반면, 일렬 구조는 한 층이 끝나면 바로 그 메모리를 해제할 수 있어 1배로 끝난다. 게다가 3×3 conv는 cuDNN·MKL 같은 라이브러리가 Winograd 알고리즘으로 곱셈 수를 $4/9$로 더 줄여주는 유일한 크기라, 이론 FLOPs 대비 실제 연산 밀도(TFLOPS)가 1×1·5×5·7×7보다 약 4배 높다.'}
],

diagram:{type:'compare', cap:'학습 시점의 다분기 블록(위)이 추론 시점에는 3×3 conv 하나로 재매개화된다.',
 left:{t:'RepVGG 학습', items:['3×3 + 1×1 + identity 병렬','BN 세 개, 분기별로 따로','$y=x+g(x)+f(x)$ 로 기울기 흐름 보조']},
 right:{t:'RepVGG 추론', items:['3×3 conv 하나로 대수적 병합','연산자 단일 종류 → 높은 병렬도','메모리 피크 학습 대비 1/2']}},

math:[
 {expr:"W'_i = (γ_i/σ_i) W_i,   b'_i = β_i − μ_i γ_i / σ_i   [conv+BN → bias 있는 conv]",
  tex:"W'_{i,:,:,:} = \\frac{\\gamma_i}{\\sigma_i} W_{i,:,:,:},\\qquad b'_i = \\beta_i - \\frac{\\mu_i \\gamma_i}{\\sigma_i}",
  d:'각 분기의 conv 가중치 $W$와 BN 파라미터($\\mu,\\sigma,\\gamma,\\beta$)를 하나의 bias 있는 conv로 흡수하는 식. 세 분기 모두에 이 변환을 적용한 뒤 커널을 더한다.'},
 {expr:'y = M∗W(3)+b(3)  +  M∗W(1)+b(1)  +  M+b(0)   →   y = M∗(W(3)+pad(W(1))+I)+(b(3)+b(1)+b(0))',
  tex:'y = M*W^{(3)} + M*W^{(1)} + M \\;\\longrightarrow\\; y = M * \\big(W^{(3)} + \\text{pad}(W^{(1)}) + I\\big)',
  d:'identity를 항등행렬을 가진 1×1 conv로, 1×1을 zero-padding해 3×3 크기로 맞추면 세 항이 커널 덧셈만으로 하나의 3×3 conv가 된다.'}
],

numbers:[
 {k:'ImageNet Top-1 (RepVGG-B3, 200 epoch)', v:'80.52%', d:'플레인(단일 경로) 모델이 80%를 넘긴 최초 사례라고 저자들이 명시'},
 {k:'속도 측정 하드웨어', v:'NVIDIA 1080Ti GPU, batch 128, fp32', d:'examples/second로 측정, GPU 100% 활용을 노린 배치 크기 선택'},
 {k:'RepVGG-A0 vs ResNet-18', v:'정확도 +1.25%p · 속도 +33%', d:'같은 조건에서 ResNet-18 대비 정확도·속도 모두 우위'},
 {k:'RepVGG-A2 vs ResNet-50', v:'정확도 +0.17%p · 속도 +83%', d:'RepVGG-B1g4는 ResNet-101 대비 속도 +101%'},
 {k:'VGG-16 vs EfficientNet-B3 FLOPs·속도', v:'FLOPs 8.4배 많지만 1080Ti에서 1.8배 빠름', d:'FLOPs가 실제 속도의 대리 지표로 부적절함을 보여주는 논문의 핵심 근거'},
 {k:'3×3 conv 연산 밀도', v:'38.10 TFLOPS', d:'같은 1080Ti에서 1×1(9.96)·5×5(10.57)·7×7(9.38) 대비 약 4배, Winograd 지원 덕분(Table 1)'}
],

impact:'"다분기=정확도, 단일 경로=속도"라는 이분법을 깨고, **학습 그래프와 추론 그래프를 다르게 설계해도 된다**는 재매개화 관점을 널리 퍼뜨렸다. 이후 검출·세그멘테이션 백본들이 RepVGG 블록을 그대로 인코더로 채택했고, 특히 실시간 검출기 계열에서 "학습 때 복잡한 구조 → 추론 때 단순 병합"이라는 설계 패턴이 표준 도구가 됐다.',

legacy:[
 '**[YOLOv7](#/p/yolov7)의 재매개화 계열 블록** — RepVGG의 구조 재매개화 아이디어를 확장한 RepConv를 백본과 보조 헤드에 사용',
 '**RepLKNet·RepOptimizer 등 후속 연구** — 같은 저자 계열이 재매개화를 대형 커널·최적화 과정으로 확장(이 위키에는 없음)',
 '**Winograd·MAC·병렬도를 명시한 속도 분석의 재조명** — FLOPs만으로 효율을 주장하던 관행에 경종을 울림',
 '**하드웨어 특화 설계로의 확장** — 연산자 종류를 줄이는 설계가 전용 추론 칩 설계에도 유리하다는 논의를 촉발'
],

pitfalls:[
 '**재매개화는 근사가 아니라 정확한 대수적 동치다.** conv+BN을 bias 있는 conv로 묶는 식(부록 (3))과 zero-padding으로 커널을 맞추는 과정을 정확히 구현하지 않으면 추론 결과가 학습 때와 미세하게 달라진다.',
 '**identity 분기는 입출력 채널·해상도가 같을 때만 존재한다.** 스트라이드가 있거나 채널 수가 바뀌는 층(각 스테이지 첫 블록)은 identity 분기 없이 3×3+1×1만 쓴다 — 이 조건을 놓치면 구현이 논문과 달라진다.',
 '**"단순 VGG 스타일이 항상 빠르다"가 아니라 "1080Ti·cuDNN Winograd 환경에서" 빠르다.** 다른 하드웨어·라이브러리에서는 3×3 conv의 연산 밀도 우위가 논문만큼 크지 않을 수 있다.'
],

figures:[
 {f:'fig1-reparam-sketch.png',
  cap:'왼쪽 (A) ResNet은 identity·1×1 분기가 여러 블록에 걸쳐 겹쳐 있다. 가운데 (B) RepVGG 학습 구조는 매 3×3 conv마다 identity(있으면)와 1×1 분기를 병렬로 더한다. 오른쪽 (C) RepVGG 추론 구조는 분기가 전부 사라지고 3×3 conv만 일렬로 남는다 — (B)에서 (C)로 가는 것이 재매개화.',
  src:'원문 Figure 2, p.2'},
 {f:'fig2-memory.png',
  cap:'(A) Residual 블록은 덧셈 직전까지 입력(점선 화살표, 1×memory)과 conv 출력(2×memory)을 동시에 메모리에 들고 있어야 한다. (B) Plain(일렬) 구조는 각 층이 끝나면 바로 이전 메모리를 해제할 수 있어 항상 1×memory만 필요하다.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'RepVGG models run 83% faster than ResNet-50 or 101% faster than ResNet-101 with higher accuracy and show favorable accuracy-speed trade-off compared to the state-of-the-art models like EfficientNet and RegNet.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2101.03697 — RepVGG', u:'https://arxiv.org/abs/2101.03697'},
 {t:'공식 코드 (megvii-model/RepVGG)', u:'https://github.com/megvii-model/RepVGG'}
]
});
