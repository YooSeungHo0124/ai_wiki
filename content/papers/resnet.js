WIKI.paper({
slug:'resnet',
venue:'CVPR 2015 (Best Paper)',
authors:'He, Zhang, Ren, Sun (Microsoft Research)',
arxiv:'1512.03385',

tldr:'층을 쌓으면 오히려 나빠지는 **degradation 문제**를 지적하고, 층이 $H(x)$ 대신 $F(x)=H(x)-x$ 를 학습하도록 **덧셈 지름길 `y = F(x) + x`** 를 넣어 해결한 논문. 152층으로 ImageNet top-5 3.57%를 기록하며 ILSVRC/COCO 2015의 5개 트랙을 모두 가져갔다.',

context:'2014년의 [VGG](#/p/vgg)와 [GoogLeNet](#/p/googlenet)이 도달한 곳은 19~22층이었고, 그 이상에서는 이득이 멎었다. 통상적인 설명은 gradient vanishing이었지만, [BatchNorm](#/p/batchnorm)과 적절한 초기화를 쓰면 56층 망도 gradient는 멀쩡히 흐르고 수렴도 한다. 그런데도 성능이 나빠진다. 저자들이 측정한 것은 결정적이다 — CIFAR-10에서 56층 plain 망이 20층 plain 망보다 **테스트뿐 아니라 학습 오류까지 높다**. 과적합이 아니고, gradient가 사라져서도 아니다. 논리적 모순도 명확하다: 20층 망에 항등 함수 36개를 얹으면 56층 망이 되므로, 56층의 해집합은 20층의 해집합을 포함한다. 더 나쁠 이유가 없는데 SGD가 그 해를 못 찾는다. **문제는 표현력이 아니라 최적화 가능성이다.**',

ideas:[
 {h:'잔차 재정의 — 항등 함수를 기본값으로 만든다',
  lead:'층은 $H(x)$ 대신 잔차 $F(x)=H(x)-x$ 만 학습하고 출력에서 $x$ 를 더한다.',
  d:'목표 매핑 $H(x)$ 를 직접 학습시키지 말고, 층은 $F(x) = H(x) - x$ 만 학습하고 출력에서 $x$ 를 다시 더한다. 항등 매핑이 최적일 때 plain 망은 여러 비선형 층의 조합으로 $H(x)=x$ 를 정확히 만들어내야 하지만, 잔차 형태에서는 **가중치를 0으로 밀기만 하면** 된다. 즉 "아무것도 하지 않기"가 학습하기 쉬운 기본값이 된다. 깊이를 추가하는 것이 최소한 손해는 아닌 구조로 바뀐다.'},
 {h:'지름길은 파라미터가 없어야 한다',
  lead:'skip 경로는 순수 덧셈이며, 이득은 투영이 아니라 항등 경로 자체에서 나온다.',
  d:'skip 경로는 단순 덧셈이라 파라미터도 곱셈도 추가하지 않는다. 차원이 바뀌는 지점에서만 1×1 conv로 투영($W_s x$)을 쓰는데, 논문의 비교 실험에서 **모든 지름길에 투영을 쓰는 것이 항등 지름길보다 크게 낫지 않았다.** 이 관찰이 중요하다 — 이득은 추가 파라미터가 아니라 항등 경로 자체에서 나온다는 뜻이다. 후속 연구(pre-activation ResNet)는 이 경로를 활성화나 정규화로도 막지 말라는 결론으로 이어진다.'},
 {h:'bottleneck 블록으로 깊이 예산을 확보',
  lead:'1×1로 채널을 줄인 뒤 3×3을 돌리고 1×1로 복원해 깊이를 더 산다.',
  d:'50층 이상에서는 3×3 두 개 대신 **1×1(축소) → 3×3 → 1×1(복원)** 세 층을 쓴다. 값비싼 3×3을 좁은 채널에서만 수행하는 [GoogLeNet](#/p/googlenet)의 1×1 병목 아이디어를 그대로 가져온 것으로, 덕분에 152층 ResNet의 연산량이 19층 [VGG](#/p/vgg)보다도 **적다**.'},
 {h:'gradient에 항등 고속도로가 생긴다',
  lead:'미분에 남는 항등항 1 덕분에 신호가 층 수와 무관하게 감쇠 없이 전달된다.',
  d:'$y = F(x) + x$ 를 미분하면 $\\partial y/\\partial x = 1 + \\partial F/\\partial x$ 다. 앞의 1이 남아 있는 한, 역전파되는 신호는 곱셈들의 연쇄로 지수적으로 감쇠하지 않고 **어떤 깊이에서도 손실 gradient가 그대로 앞층까지 도달**한다. 논문은 이를 vanishing gradient 해결로 설명하기보다 최적화 지형이 쉬워진 결과로 서술하지만, 실무적 효과는 이 항등 항으로 요약된다.'},
 {h:'실험이 주장을 앞선다',
  lead:'지름길 유무만 다른 대조 실험으로 degradation의 원인을 특정했다.',
  d:'이 논문에는 새로운 손실 함수도 정규화도 없다. plain 18/34층과 residual 18/34층의 학습 곡선 네 개를 나란히 놓은 그림 하나가 논증의 전부다 — plain은 34층이 18층보다 나쁘고, residual은 34층이 18층보다 좋다. 개입 하나만 바꾼 대조 실험으로 원인을 특정한 사례다.'}
],

diagram:{type:'compare', cap:'같은 34층, 지름길 유무만 다르다. Plain은 18층보다 학습 오류가 높았고(degradation), ResNet은 낮았다.',
 left:{t:'Plain 34층', items:[
  'conv → BN → ReLU 를 그대로 적층',
  '항등 매핑도 층들이 직접 학습해야 함',
  '학습 오류가 18층보다 높음',
  '깊이를 늘릴수록 악화',
  '표현력이 아니라 최적화가 병목']},
 right:{t:'ResNet 34층', items:[
  '2~3층마다 입력을 출력에 그대로 더함',
  '가중치를 0으로 보내면 곧 항등 매핑',
  '학습·검증 오류 모두 18층보다 낮음',
  '추가 파라미터·연산 거의 0',
  '152층까지 확장 가능']}},

math:[
 {expr:'y = F(x, {W_i}) + x',
  tex:'y = F\\left(x, \\{W_i\\}\\right) + x',
  d:'ResNet 전체가 이 한 줄이다. $F$ 는 보통 conv–BN–ReLU–conv–BN 이고, 덧셈 뒤에 ReLU가 온다. 차원이 다를 때만 $y = F(x) + W_s x$ 로 투영을 넣는다.'},
 {expr:'∂y/∂x = 1 + ∂F/∂x',
  tex:'\\frac{\\partial y}{\\partial x} = 1 + \\frac{\\partial F}{\\partial x}',
  d:'역전파에서 항등 항 1이 살아남아, $L$ 층을 거슬러 올라가도 신호가 $\\prod$ 형태로 소멸하지 않는다. 이 성질 때문에 residual 연결은 CNN을 넘어 **깊은 망 일반의 학습 장치**가 됐다.'},
 {expr:'1×1 (C→C/4) → 3×3 (C/4→C/4) → 1×1 (C/4→C)',
  tex:'1\\times1\\,(C\\to C/4) \\;\\to\\; 3\\times3\\,(C/4\\to C/4) \\;\\to\\; 1\\times1\\,(C/4\\to C)',
  d:'bottleneck 블록. 채널을 4배 줄인 뒤에만 3×3을 수행하므로, 같은 예산으로 훨씬 많은 층을 쌓을 수 있다.'}
],

numbers:[
 {k:'ImageNet top-5 (테스트)', v:'3.57%', d:'6개 모델 앙상블. **ILSVRC-2015 분류 1위** — 전년 [GoogLeNet](#/p/googlenet) 6.67%의 거의 절반'},
 {k:'깊이', v:'최대 152층', d:'[VGG-19](#/p/vgg)의 8배 깊이. 연산량은 **113억 FLOPs 대 VGG-19의 196억** 으로 오히려 적다'},
 {k:'degradation 증거', v:'CIFAR-10 56층 > 20층 오류', d:'테스트뿐 아니라 **학습** 오류도 더 높다 — 과적합이 아니라는 결정적 근거'},
 {k:'극한 실험', v:'CIFAR-10 1202층', d:'최적화는 여전히 되지만 과적합으로 110층보다 나빴다. 깊이가 만능은 아니라는 저자들 자신의 단서'},
 {k:'COCO 검출', v:'상대 +28%', d:'백본만 VGG에서 ResNet으로 교체. 분류 개선이 하위 과제로 그대로 전이됨'},
 {k:'ILSVRC/COCO 2015', v:'5개 트랙 전부 1위', d:'분류·검출·로컬라이제이션 + COCO 검출·분할'}
],

impact:'ResNet은 "깊이를 얼마나 쌓을 수 있는가"라는 질문을 사실상 종료시켰다. 하지만 더 큰 결과는 residual connection이 **CNN용 기법이 아니라 깊은 신경망 일반의 인프라**가 됐다는 점이다. 그 이유는 구조적이다 — $y = F(x) + x$ 는 입력·출력 차원만 같으면 $F$ 가 무엇이든 상관없이 끼워 넣을 수 있고, 파라미터를 늘리지 않으며, 항등 경로가 gradient와 신호를 양방향으로 보존한다. 2년 뒤 [Transformer](#/p/transformer)가 attention과 FFN을 감싼 방식이 정확히 이 형태이며(`x ← x + Sublayer(x)`), 이후 [BERT](#/p/bert)·[GPT](#/p/gpt1) 계열이 12층에서 100층 너머로 커지는 동안 이 덧셈은 한 번도 교체되지 않았다. [U-Net](#/p/unet)의 skip, [ViT](#/p/vit) 블록까지 — 깊이를 쓰는 거의 모든 현대 모델이 이 한 줄을 공유한다. [LayerNorm](#/p/layernorm) 배치 논쟁(pre-LN 대 post-LN)도 결국 **항등 경로를 얼마나 깨끗하게 유지할 것인가**의 문제다.',

legacy:[
 '**보편 부품이 됨** — [Transformer](#/p/transformer) 블록의 `x + Sublayer(x)`, [U-Net](#/p/unet)/[FPN](#/p/fpn)의 skip, [DenseNet](#/p/densenet)의 concat 변형까지 residual은 아키텍처 중립적 장치로 정착',
 '**백본의 기본값** — [Faster R-CNN](#/p/faster-rcnn)·[Mask R-CNN](#/p/mask-rcnn)·[SimCLR](#/p/simclr)·[MoCo](#/p/moco)·[AlphaGo](#/p/alphago)까지 "일단 ResNet-50"이 10년간 기본 선택지',
 '**정제 연구 계열** — pre-activation ResNet(항등 경로를 완전히 비움), ResNeXt(그룹 conv), [DenseNet](#/p/densenet)·[EfficientNet](#/p/efficientnet)·[ConvNeXt](#/p/convnext)로 이어지는 후속 분화',
 '**비교 기준선** — [ViT](#/p/vit)가 등장했을 때 이겨야 했던 상대가 ResNet이었고, [ConvNeXt](#/p/convnext)는 반대로 ResNet을 현대 레시피로 재조율해 Transformer와 겨뤘다'
],

pitfalls:[
 '**"residual이 gradient vanishing을 푼다"는 절반만 맞다.** 논문 자신이 [BatchNorm](#/p/batchnorm)만으로도 gradient는 흐른다고 명시했고, 문제로 지목한 것은 **degradation(최적화 곤란)** 이다. 두 현상을 뭉뚱그리면 왜 항등 경로가 필요한지를 놓친다.',
 '**깊이는 공짜가 아니다.** 저자들의 CIFAR-10 1202층 실험은 110층보다 나빴다. residual이 푼 것은 최적화이지 일반화가 아니며, 데이터 대비 과한 깊이는 여전히 과적합한다.',
 '**덧셈 지름길에 무엇이든 끼워 넣으면 이득이 사라진다.** 지름길 경로에 스케일링·게이팅·정규화를 넣은 변형들은 대부분 원본보다 나빴다(pre-activation 논문의 실험). residual의 효과는 그 경로가 **정확히 항등**이라는 데서 나온다.'
],

figures:[
 {f:'fig2-residual-block.png',
  cap:'입력 x가 두 weight layer를 통과하는 경로(F(x))와, 아무 연산 없이 그대로 건너뛰는 화살표(오른쪽 곡선)가 덧셈 지점에서 합쳐진다. 이 그림 하나가 논문의 구조 전부다 — 곡선 화살표가 "identity"라고 적힌 부분이 지름길 경로.',
  src:'원문 Figure 2, p.2'},
 {f:'fig4-learning-curves.png',
  cap:'왼쪽(plain)에서 굵은 빨강(34층) 검증 오류가 굵은 청록(18층)보다 위에 있다 — 더 깊은데 더 나쁘다. 오른쪽(ResNet)에서는 순서가 뒤집혀 34층이 18층보다 아래에 있다. 가는 선은 학습 오류, 굵은 선은 검증 오류.',
  src:'원문 Figure 4, p.5'}
],

quotes:[
 {t:'Deeper neural networks are more difficult to train.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1512.03385 — Deep Residual Learning for Image Recognition', u:'https://arxiv.org/abs/1512.03385'},
 {t:'Identity Mappings in Deep Residual Networks (pre-activation)', u:'https://arxiv.org/abs/1603.05027'},
 {t:'ILSVRC 2015 results', u:'https://image-net.org/challenges/LSVRC/2015/results.php'}
]
});
