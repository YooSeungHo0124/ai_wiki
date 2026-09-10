WIKI.paper({
slug:'mobilenetv2',
venue:'CVPR 2018',
authors:'Sandler, Howard, Zhu, Zhmoginov, Chen (Google)',
arxiv:'1801.04381',

tldr:'좁은 채널(bottleneck)에서는 ReLU를 빼고, 넓은 채널에서 ReLU를 쓰는 **역 잔차(inverted residual) + 선형 병목** 구조로 [MobileNet](#/p/mobilenet)보다 정확도는 올리고 연산량은 더 줄인 논문. 모바일 CNN 블록 설계의 표준이 되었다.',

context:'[MobileNet](#/p/mobilenet)의 depthwise separable convolution은 연산량을 크게 줄였지만, 채널 수를 그대로 좁은 층에 [ResNet](#/p/resnet) 식 잔차 연결을 적용하면 정확도가 떨어지는 문제가 있었다. 저자들은 그 원인을 **비선형 함수(ReLU)가 저차원 표현을 파괴한다**는 데서 찾는다. ReLU는 음수를 전부 0으로 눌러버리는데, 채널 수가 이미 적은 병목(bottleneck) 층에서 이 짓을 하면 정보가 아예 복구 불가능하게 사라진다. 반대로 채널이 넉넉히 많으면 ReLU가 죽이는 정보를 다른 채널이 중복으로 보존한다. 이 관찰에서 "병목은 선형으로, 확장된 층에서만 비선형으로"라는 설계 원칙이 나온다.',

ideas:[
 {h:'선형 병목: 저차원에서 ReLU를 빼는 이유',
  lead:'ReLU는 저차원 부분공간에 놓인 다양체를 되돌릴 수 없이 붕괴시킨다.',
  d:'저자들은 $n$차원 공간에 저차원 나선(manifold)을 무작위 행렬 $T$로 임베딩한 뒤 ReLU를 통과시키고 $T^{-1}$로 복원하는 실험을 한다. $n$이 입력 차원과 비슷하게 작으면(2, 3차원) 나선의 점들이 겹쳐 사라지고 복원이 실패한다. $n$이 15~30으로 크면 정보는 보존되지만 변환이 심하게 비선형적으로 뒤틀린다. 결론은 "관심 있는 다양체가 저차원이라면, 그 저차원 층에서는 ReLU 대신 선형 변환을 써야 정보가 안 죽는다"는 것. 그래서 각 블록의 마지막 $1\\times1$ 합성곱(병목으로 되돌아가는 지점)에는 활성화 함수를 넣지 않는다.'},
 {h:'역 잔차: 잔차 연결을 좁은 층끼리 잇는다',
  lead:'좁은 곳→넓은 곳→좁은 곳 순서로 확장하고, 잔차는 좁은 층끼리 연결한다.',
  d:'[ResNet](#/p/resnet)의 병목 블록은 넓은 채널 → 좁은 채널(압축) → 넓은 채널 순서로 가며, 잔차 연결도 넓은 채널끼리 잇는다. 이 논문은 그 반대로 간다: **좁은 채널(병목) → 확장(1x1 conv로 t배) → depthwise 3x3 → 다시 좁은 채널로 압축**. 잔차 연결은 좁은 병목 층 사이에 놓인다. 저자들의 근거는 "필요한 정보는 이미 병목에 다 있고, 넓은 중간층은 depthwise convolution이 비선형 변환을 표현하기 위한 임시 작업 공간일 뿐"이라는 것 — 그래서 굳이 넓은 층을 잔차로 이어 메모리에 남겨둘 이유가 없다.'},
 {h:'Depthwise separable + 확장을 하나의 블록으로',
  lead:'1x1 확장 → 3x3 depthwise → 1x1 선형 압축, 세 단계로 블록을 표준화한다.',
  d:'기본 블록은 $1\\times1$ 합성곱으로 채널을 확장 계수 $t$배로 늘리고(ReLU6), $3\\times3$ depthwise convolution으로 공간 필터링을 한 뒤(ReLU6), 다시 $1\\times1$ 합성곱으로 압축한다(활성화 없음). 논문 전체 실험에서 확장 계수는 $t=6$을 기본값으로 쓴다. Depthwise separable 자체는 [MobileNet](#/p/mobilenet)에서 가져온 것이고, 이 논문의 기여는 그 앞뒤에 확장·압축과 잔차·선형성을 규격화해 얹은 것이다.'},
 {h:'메모리 효율적 추론: 넓은 텐서를 통째로 들고 있지 않는다',
  lead:'블록 내부에서 확장된 텐서를 채널 단위로 쪼개 계산해 최대 메모리 사용량을 줄인다.',
  d:'모바일 추론에서는 연산량(MAdd)뿐 아니라 **한 시점에 메모리에 올려야 하는 최대 텐서 크기**도 병목이다. 역 잔차 구조는 확장된 넓은 텐서가 병목 안에서만 살아있고 블록 경계에서는 다시 좁아지므로, 컴파일러가 확장-압축 연산을 채널별로 쪼개 스트리밍하면 넓은 중간 텐서를 통째로 메모리에 유지할 필요가 없다. 논문의 Table 3은 16비트 활성값 기준 최대 메모리를 MobileNetV1 1600KB, ShuffleNet 600KB 대비 MobileNetV2가 **400KB**로 가장 작다고 보고한다.'}
],

diagram:{type:'compare', cap:'ResNet 병목 블록(넓→좁→넓, 잔차는 넓은 층끼리) vs MobileNetV2 역 잔차(좁→넓→좁, 잔차는 좁은 층끼리).',
 left:{t:'ResNet 병목 블록', items:['넓은 채널 → 압축 → 넓은 채널','잔차는 넓은 채널끼리 연결','병목에도 ReLU 사용']},
 right:{t:'MobileNetV2 역 잔차', items:['좁은 채널 → 확장(t=6) → 압축','잔차는 좁은 병목끼리 연결','병목 출력은 선형(ReLU 없음)']}},

math:[
 {expr:'cost = h·w·d_in·(k² + d_out)  [depthwise separable, MobileNet 기준]',
  tex:'\\text{cost} = h_i \\cdot w_i \\cdot d_i \\cdot (k^2 + d_j)',
  d:'표준 합성곱의 $h\\cdot w\\cdot d_i\\cdot d_j\\cdot k^2$ 대비, depthwise($k^2$항)와 pointwise($d_j$항)의 합으로 줄어든다. $k=3$이면 표준 합성곱 대비 연산량이 약 $1/9$ 근처로 준다.'},
 {expr:'block: x → Conv1x1,ReLU6 (d→td) → DWConv3x3,ReLU6 → Conv1x1,Linear (td→d′) [+x if d=d′, stride=1]',
  tex:'y = \\text{Linear}\\big(\\text{DWConv}_{3\\times3}(\\text{ReLU6}(W_1 x))\\big),\\quad \\text{out} = x + y \\text{ if } \\text{stride}=1,\\ d_{in}=d_{out}',
  d:'확장 계수 $t$(기본 6)만큼 채널을 늘렸다가 depthwise로 필터링하고 선형으로 되돌린다. 입출력 채널 수와 stride가 같을 때만 잔차를 더한다.'}
],

numbers:[
 {k:'ImageNet Top-1', v:'72.0%', d:'[MobileNet](#/p/mobilenet) V1 70.6% 대비 정확도는 오르고 MAdds는 더 적음(300M vs 575M)'},
 {k:'MAdds', v:'300M', d:'MobileNetV1(575M)의 절반 수준, 파라미터도 3.4M으로 더 적음(V1 4.2M)'},
 {k:'추론 지연', v:'75ms', d:'Google **Pixel 1 폰**의 단일 대형 코어, TensorFlow Lite 내부 버전으로 측정. MobileNetV1은 같은 조건에서 113ms'},
 {k:'확장 계수 t', v:'6', d:'병목 채널을 6배로 확장한 뒤 depthwise 필터링, 논문 전 실험의 기본값'},
 {k:'최대 활성값 메모리', v:'400KB', d:'16비트 float 기준, MobileNetV1 1600KB·ShuffleNet(2x,g=3) 600KB 대비 가장 작음'},
 {k:'SSDLite 검출(COCO)', v:'mAP 22.1 · 0.8B MAdd · 200ms', d:'MobileNetV1+SSDLite(22.2 mAP·1.3B·270ms) 대비 비슷한 정확도에 지연·연산량 감소'}
],

impact:'모바일·엣지 배포용 CNN 블록의 사실상 표준 단위가 됐다. "역 잔차 + 선형 병목" 블록은 이후 나온 거의 모든 경량 백본([EfficientNet](#/p/efficientnet), [MobileViT](#/p/mobilevit) 등)의 기본 구성 요소로 재사용됐고, NAS(신경망 구조 탐색) 계열 연구들도 이 블록을 탐색 공간의 기본 단위로 채택했다. 분류뿐 아니라 SSDLite(검출)·모바일 세그멘테이션까지 같은 블록으로 확장 가능함을 논문 자체가 보였다.',

legacy:[
 '**탐색 공간의 기본 단위화** — MnasNet·[EfficientNet](#/p/efficientnet) 계열 NAS 연구가 역 잔차 블록을 그대로 탐색 대상으로 채택',
 '**MobileNetV3** — Squeeze-and-Excitation과 h-swish를 얹어 같은 블록을 더 다듬음(이 위키에는 없음)',
 '**하이브리드 백본으로 확장** — [MobileViT](#/p/mobilevit)가 이 블록의 지역 처리와 Transformer의 전역 문맥을 결합',
 '**경량 검출기의 백본** — SSDLite 외에도 다수의 모바일 검출·세그멘테이션 모델이 이 블록을 인코더로 사용'
],

pitfalls:[
 '**"역 잔차"라는 이름 때문에 잔차 연결 자체가 새롭다고 오해하기 쉽다.** 새로운 것은 잔차를 넓은 층이 아니라 좁은 병목끼리 잇는 방향이지, 잔차 연결 개념 자체는 [ResNet](#/p/resnet)에서 그대로 가져온 것이다.',
 '**FLOPs/MAdds 감소가 곧 실제 속도 향상은 아니다.** 이 논문도 Pixel 1 CPU 지연을 별도로 측정해 함께 보고하는데, depthwise convolution은 산술 강도가 낮아 하드웨어에 따라 이론 연산량만큼 빨라지지 않을 수 있다.',
 '**병목에 비선형을 넣지 말라는 규칙은 이 블록 안에서의 경험적 결론이지 일반 법칙이 아니다.** 논문 스스로도 "저차원 다양체 가정"이라는 전제를 달고 있고, 다른 구조·데이터에서는 다르게 작동할 수 있다.'
],

figures:[
 {f:'fig1-inverted-residual.png',
  cap:'왼쪽이 ResNet 잔차 블록: 두꺼운(채널 많은) 층 사이를 곡선 잔차가 잇는다. 오른쪽이 역 잔차: 얇은(병목) 층 사이를 잔차가 잇고, 사선 무늬 층(마지막 1x1)은 비선형이 없는 선형 층이다. 블록 두께가 채널 수를 나타낸다.',
  src:'원문 Figure 3, p.3'},
 {f:'fig2-mbv2-block.png',
  cap:'MobileNetV2 블록의 실제 연산 순서(아래→위): input → Conv1x1+ReLU6(확장) → Dwise3x3,stride=2+ReLU6 → Conv1x1,Linear(선형 압축). 마지막 화살표에만 활성화 함수가 없는 것에 주목.',
  src:'원문 Figure 4(d), p.5'}
],

quotes:[
 {t:'Experimental evidence suggests that using linear layers is crucial as it prevents non-linearities from destroying too much information.',
  src:'Section 3.2, p.3'}
],

links:[
 {t:'arXiv 1801.04381 — MobileNetV2', u:'https://arxiv.org/abs/1801.04381'},
 {t:'TensorFlow MobileNetV2 구현', u:'https://github.com/tensorflow/models/tree/master/research/slim/nets/mobilenet'}
]
});
