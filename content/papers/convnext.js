WIKI.paper({
slug:'convnext',
venue:'CVPR 2022',
authors:'Zhuang Liu, Hanzi Mao, Chao-Yuan Wu, Feichtenhofer, Darrell, Saining Xie (Facebook AI Research · UC Berkeley)',
arxiv:'2201.03545',

tldr:'[ResNet](#/p/resnet)-50에서 출발해 현대적 학습 레시피와 [Swin](#/p/swin)의 설계 요소를 **한 번에 하나씩** 이식하며 정확도를 추적한 통제 실험. 결론은 도발적이다 — attention 없이 순수 conv만으로도 76.1%에서 82.0%까지 올라가 Swin을 넘어선다. **ViT가 이긴 것이 아니라 2020년대의 학습 방법이 이긴 것**이다.',

context:'2020년 [ViT](#/p/vit)는 대규모 사전학습이 있으면 CNN의 귀납 편향 없이도 이미지 분류가 된다는 것을 보였고, 2021년 [Swin](#/p/swin)은 윈도 기반 지역 attention과 계층적 해상도를 도입해 검출·분할까지 CNN 백본을 밀어냈다. 이 시점의 통념은 "**transformer 구조가 본질적으로 우월하다**"였다. 그러나 저자들은 비교의 공정성을 의심한다. Swin은 300에폭 AdamW 학습에 Mixup·CutMix·RandAugment·Random Erasing·stochastic depth·label smoothing을 전부 쓰는데, 비교 대상인 ResNet-50의 76.1%는 **2015년 레시피(90에폭·SGD·기본 증강)** 로 나온 숫자다. 게다가 Swin이 되살린 지역성·계층 구조·이동 등변성은 원래 CNN의 재산이었다. 그렇다면 조건을 맞추면 어떻게 되는가?',

ideas:[
 {h:'실험 자체가 논문이다 — 한 번에 하나씩 바꾸는 로드맵',
  lead:'한 번에 하나씩 바꾸며 각 변경의 ImageNet top-1 기여도를 기록한다.',
  d:'ResNet-50에서 Swin-T까지 가는 경로를 **학습 기법 → 매크로 설계 → 블록 구조 → 미시 설계** 순으로 나누고, 각 변경마다 ImageNet top-1을 기록한다. FLOPs는 4.5G 근처로 계속 맞춰 비교 가능성을 유지한다. 새로운 모듈을 제안한 논문이 아니라, **기존 요소들의 기여도를 분해한 감사 보고서**에 가깝다.'},
 {h:'첫 단계에서 이미 +2.7%p — 학습 레시피의 몫',
  lead:'구조는 그대로 두고 학습 레시피만 현대화해 76.1%를 78.8%로 올린다.',
  d:'구조를 하나도 안 건드리고 학습만 현대화하자(300에폭, AdamW, Mixup·CutMix·RandAugment·Random Erasing, label smoothing, stochastic depth) ResNet-50이 **76.1% → 78.8%** 가 된다. Swin-T와의 격차 상당 부분이 아키텍처가 아니라 여기서 왔다는 뜻이며, 이 논문의 반론이 서는 지점이다.'},
 {h:'매크로 설계: 스테이지 비율과 패치화 스템',
  lead:'스테이지 블록 비율과 입력 스템을 Swin·ViT 방식에 맞춰 바꾼다.',
  d:'ResNet-50의 스테이지별 블록 수 (3,4,6,3)을 Swin-T의 1:1:3:1 비율에 맞춰 **(3,3,9,3)** 으로 바꾼다(→79.4%). 입력부의 7×7 stride-2 conv + max pool은 ViT처럼 **4×4 stride-4 non-overlapping conv**(patchify stem)로 교체한다(→79.5%). 즉 "패치 임베딩"은 큰 stride의 conv와 다르지 않다.'},
 {h:'블록 구조: depthwise conv를 self-attention 자리에 놓는다',
  lead:'depthwise conv를 self-attention 대체물로 보고 폭과 커널을 키운다.',
  d:'채널 간 섞음 없이 공간만 처리하는 depthwise conv는 **head별 가중 공간 합인 self-attention과 역할이 같다**. 그래서 [MobileNet](#/p/mobilenet)식 depthwise를 도입하고 폭을 64→96으로 넓히며(→80.5%), MLP처럼 중간이 두꺼운 inverted bottleneck으로 뒤집고, 커널을 7×7로 키워 Swin의 윈도 크기와 맞춘다. 3×3을 고수하던 [VGG](#/p/vgg) 이후의 관성이 여기서 깨진다.'},
 {h:'미시 설계: 활성화와 정규화를 덜어낸다',
  lead:'transformer 블록처럼 활성화 1개·정규화 1개만 남기고 걷어낸다.',
  d:'transformer 블록은 잔차 블록 하나에 활성화가 **한 개**, 정규화가 **두 개**뿐이다. ConvNeXt도 ReLU를 GELU로 바꾸고, 블록 내 활성화를 1×1 conv 사이 한 곳만 남기며(→81.3%), BatchNorm을 하나만 남긴 뒤(→81.4%) LayerNorm으로 교체하고(→81.5%), 해상도를 줄이는 downsampling을 별도 층으로 분리한다(→**82.0%**). 각 항목은 0.1~0.7%p씩이지만 합쳐서 격차를 뒤집는다.'}
],

figures:[
 {f:'fig2-modernization-roadmap.png',
  cap:'막대 하나가 변경 한 단계, 숫자는 그 시점의 ImageNet top-1(%). 위(ResNet-50/200)에서 아래(ConvNeXt-T/B)로 내려오며 누적 개선되고, 맨 아래 주황 막대(Swin-T/B)가 비교 기준선. 빗금 막대는 채택하지 않은 시도(9×9, 11×11 커널 — 7×7보다 이득이 없었다).',
  src:'원문 Figure 2, p.3'}
],

diagram:{type:'stack', cap:'ResNet-50에서 시작해 아래에서 위로 한 단계씩. 오른쪽은 그 시점의 ImageNet top-1. 최종 ConvNeXt-T가 Swin-T(81.3%)를 상회.',
 layers:[
  {t:'ResNet-50 기준', s:'76.1%', note:'2015년 레시피'},
  {t:'현대 학습 레시피', s:'78.8%', acc:true, note:'구조 변경 0, +2.7%p'},
  {t:'매크로 설계 변경', s:'79.5%', note:'스테이지·패치 스템'},
  {t:'Depthwise 도입', s:'80.5% · 폭 64→96'},
  {t:'Inverted 병목', s:'80.6%', note:'7×7 커널로 확대'},
  {t:'활성·정규화 축소', s:'81.5%', note:'GELU·LayerNorm 도입'},
  {t:'Downsample 분리', s:'82.0%', note:'ConvNeXt-T 완성'}
 ]},

math:[
 {expr:'Attention: y_i = Σ_j softmax(q_i·k_j) v_j     Depthwise conv: y_i = Σ_{j∈N(i)} w_{j-i} ⊙ x_j',
  tex:'\\begin{aligned} \\text{Attention:}\\ & y_i = \\sum_j \\text{softmax}(q_i\\cdot k_j)\\, v_j \\\\ \\text{Depthwise conv:}\\ & y_i = \\sum_{j\\in N(i)} w_{j-i} \\odot x_j \\end{aligned}',
  d:'둘 다 **채널을 섞지 않고 공간 위치를 가중 합**한다. 차이는 가중치가 입력에 따라 동적으로 계산되느냐(attention), 학습된 상수이며 위치에 대해 공유되느냐(conv)뿐이다. ConvNeXt가 depthwise conv를 self-attention의 대체물로 놓은 근거다.'},
 {expr:'block: x ← x + DropPath( LN → 7×7 DWConv → 1×1 (4d) → GELU → 1×1 (d) )',
  tex:'x \\leftarrow x + \\text{DropPath}\\big(\\text{LN} \\to 7{\\times}7\\,\\text{DWConv} \\to 1{\\times}1\\,(4d) \\to \\text{GELU} \\to 1{\\times}1\\,(d)\\big)',
  d:'ConvNeXt 블록 전체. 순서를 보면 [Transformer](#/p/transformer) 블록과 거의 동형이며, self-attention 자리에 7×7 depthwise conv가, FFN 자리에 1×1 conv 두 장이 들어가 있다.'}
],

numbers:[
 {k:'ResNet-50 · 원 논문 레시피', v:'76.1%', d:'90에폭 · SGD · 기본 증강'},
 {k:'ResNet-50 · 현대 레시피', v:'78.8%', d:'구조 동일, 300에폭 AdamW + 증강 — 격차의 절반 가까이가 여기서 발생'},
 {k:'ConvNeXt-T vs [Swin](#/p/swin)-T', v:'82.1% vs 81.3%', d:'둘 다 약 4.5G FLOPs로 맞춘 동급 비교'},
 {k:'ConvNeXt-B vs Swin-B', v:'83.8% vs 83.5%', d:'규모를 키워도 우위가 유지됨'},
 {k:'ConvNeXt-XL (IN-22K 사전학습)', v:'87.8% top-1', d:'논문 최고 기록. 대규모 사전학습에서도 CNN이 뒤지지 않음을 보임'},
 {k:'커널 크기', v:'7×7', d:'3×3에서 키우며 개선되다 7×7에서 포화 — Swin의 윈도 크기와 일치'}
],

impact:'ConvNeXt의 기여는 새 구조가 아니라 **정확한 귀인**이다. 2020~2021년의 성능 향상 중 어디까지가 attention이고 어디까지가 학습 레시피·매크로 설계인지를 항목별로 분리해, "transformer가 본질적으로 우월하다"는 서사를 상당 부분 무력화했다. 이후 비전 논문에서 baseline을 옛 레시피로 학습해놓고 비교하는 관행이 **공정하지 않은 비교**로 지적받게 되었고, 통제된 ablation이 강한 주장의 전제 조건이 되었다. 실무적으로는 attention의 $O(n^2)$ 이나 특수 커널 없이 표준 conv 연산만으로 [Swin](#/p/swin)급 성능을 내는 백본이 생겼다는 뜻이며, 검출·분할 파이프라인이 기존 CNN 인프라를 그대로 쓸 수 있게 됐다.',

legacy:[
 '**"레시피 대 아키텍처" 논쟁의 표준 참조** — 새 구조를 주장하려면 동일 학습 조건에서 비교해야 한다는 규범이 정착',
 '**ConvNeXt V2 (2023)** — [MAE](#/p/mae)식 마스크 자기지도 학습을 conv 백본에 맞게 이식(FCMAE + GRN)하며, 사전학습 방법 역시 아키텍처와 분리 가능함을 보임',
 '**하이브리드 수렴** — 이후 백본들이 depthwise 대형 커널과 attention을 자유롭게 섞으며, CNN 대 transformer라는 이분법 자체가 흐려짐',
 '**설계 요소의 재분배** — LayerNorm·GELU·적은 활성화·패치 스템 같은 [Transformer](#/p/transformer)발 관용구가 conv 계열의 기본 설정으로 흡수됨'
],

pitfalls:[
 '**"CNN이 ViT를 이겼다"는 결론이 아니다.** 논문이 보인 것은 동급 FLOPs·동일 레시피에서 conv가 뒤지지 않는다는 것이며, 저자들도 [ViT](#/p/vit)의 확장성과 멀티모달 유연성을 부정하지 않는다. 실제로 [CLIP](#/p/clip)·[MAE](#/p/mae) 같은 대규모 사전학습 생태계는 여전히 ViT 중심이다.',
 '**한 항목만 떼어다 쓰면 재현되지 않는다.** 7×7 커널이나 LayerNorm은 inverted bottleneck·적은 활성화·분리된 downsampling과 함께여야 이득이 난다. 로드맵 중간 단계에는 오히려 정확도가 떨어지는 구간(예: depthwise conv를 블록 위로 올리는 단계)도 있다.',
 '**옛 baseline 숫자를 인용해 비교하지 말 것.** 이 논문의 교훈 자체가 그것이다. 문헌의 76.1%는 아키텍처의 상한이 아니라 2015년 학습 절차의 결과다.'
],

links:[
 {t:'arXiv 2201.03545 — A ConvNet for the 2020s', u:'https://arxiv.org/abs/2201.03545'},
 {t:'공식 구현 (facebookresearch/ConvNeXt)', u:'https://github.com/facebookresearch/ConvNeXt'},
 {t:'arXiv 2301.00808 — ConvNeXt V2: Co-designing with Masked Autoencoders', u:'https://arxiv.org/abs/2301.00808'}
]
});
