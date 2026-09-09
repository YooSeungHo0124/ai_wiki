WIKI.paper({
slug:'swin',
venue:'ICCV 2021 (Best Paper)',
authors:'Liu et al. (Microsoft Research Asia)',
arxiv:'2103.14030',

tldr:'attention을 이미지 전체가 아니라 **작은 윈도우 안에서만** 계산하고, 층마다 윈도우를 절반씩 밀어(shift) 경계를 넘나들게 한 [ViT](#/p/vit). 복잡도가 이미지 크기에 **선형**이 되고 CNN처럼 **계층적 특징맵**이 생겨서, 분류뿐 아니라 검출·분할의 범용 백본이 됐다.',

context:'[ViT](#/p/vit)는 분류에서는 통했지만 그 밖에서는 곤란했다. 이유가 두 가지다. **(1) 해상도** — 전역 self-attention은 토큰 수의 제곱이라 224×224/16 = 196 토큰까지는 괜찮아도, 검출·분할이 요구하는 800×1333 입력에서는 감당이 안 된다. **(2) 단일 스케일** — ViT는 처음부터 끝까지 16배 다운샘플된 하나의 해상도만 유지한다. 반면 검출·분할은 [FPN](#/p/fpn)이 그랬듯 4×·8×·16×·32× 여러 스케일의 특징맵을 필요로 하고, 객체 크기 편차가 큰 실제 이미지에서 이건 선택이 아니라 필수다. 결국 ViT는 [ResNet](#/p/resnet)을 대체할 **백본**이 되기에는 인터페이스 자체가 맞지 않았다. Swin의 목표는 성능 갱신이 아니라 그 인터페이스를 맞추는 것이다.',

ideas:[
 {h:'윈도우 안에서만 attention — 제곱을 선형으로',
  lead:'전역이 아니라 7×7 윈도우 내부에서만 attention을 계산해 복잡도를 선형으로 낮춘다.',
  d:'특징맵을 $M \\times M$(논문 기본 $M=7$) 크기의 겹치지 않는 윈도우로 나누고, **각 윈도우 내부의 49개 토큰끼리만** self-attention을 한다. 토큰 수 $hw$ 가 늘어도 윈도우 개수만 비례해 늘 뿐 윈도우 하나의 비용은 고정이므로, 전체 복잡도가 $O((hw)^2)$ 에서 $O(hw)$ 로 떨어진다. 이건 CNN이 커널 크기를 고정해 지역성을 강제하는 것과 같은 발상을, attention 위에서 다시 하는 것이다.'},
 {h:'Shifted window — 윈도우 경계를 층마다 옮긴다',
  lead:'연속된 두 블록마다 윈도우 격자를 대각으로 밀어 경계 너머 정보도 섞이게 한다.',
  d:'윈도우를 고정하면 경계를 가로지르는 정보가 영원히 섞이지 않는다. Swin은 **연속된 두 블록을 짝으로** 쓴다. 첫 블록은 격자 그대로(W-MSA), 둘째 블록은 윈도우 격자를 $(\\lfloor M/2 \\rfloor, \\lfloor M/2 \\rfloor)$ 만큼 대각으로 밀어서(SW-MSA) 계산한다. 이전 층에서 다른 윈도우에 있던 토큰들이 이번 층에서는 한 윈도우에 들어오므로, 층을 쌓을수록 수용 영역이 넓어진다 — CNN에서 층을 쌓아 수용 영역을 키우는 것과 정확히 같은 메커니즘이다.'},
 {h:'Cyclic shift + 마스킹 — 시프트를 공짜로 만든다',
  lead:'특징맵을 순환 이동시켜 조각 윈도우를 없애고, 마스크로 엉뚱한 영역 간 attention을 막는다.',
  d:'윈도우를 밀면 가장자리에 $M$ 보다 작은 조각 윈도우들이 생기고, 그대로 패딩하면 윈도우 개수가 늘어 비효율적이다. Swin은 특징맵을 **순환 이동(torch.roll)** 시켜 조각들을 한데 모아 정상 크기 윈도우로 채우고, 원래 인접하지 않았던 영역끼리 attention이 새지 않도록 **마스크를 씌운다**. 윈도우 개수가 시프트 전과 동일해져서 시프트가 실질적으로 추가 비용 없이 구현된다.'},
 {h:'Patch merging으로 계층 만들기',
  lead:'인접 2×2 패치를 합쳐 해상도는 절반, 채널은 두 배로 — CNN의 다운샘플과 같은 규격을 만든다.',
  d:'스테이지가 넘어갈 때마다 인접한 2×2 패치를 concat(4C)하고 선형층으로 2C로 줄인다. 해상도는 절반, 채널은 두 배 — CNN의 stride-2 다운샘플과 같은 규격이다. 결과적으로 4×·8×·16×·32× 네 단계 특징맵이 나오고, 이걸 그대로 [FPN](#/p/fpn)·[Mask R-CNN](#/p/mask-rcnn)·UperNet에 꽂을 수 있다. **ResNet과 출력 인터페이스가 동일**하다는 점이 Swin이 빠르게 표준 백본이 된 실질적 이유다.'},
 {h:'상대 위치 바이어스',
  lead:'절대 위치 대신 윈도우 내부 상대 좌표마다 학습되는 스칼라를 attention 점수에 더한다.',
  d:'절대 위치 임베딩 대신, 윈도우 내부의 상대 좌표마다 학습되는 스칼라 $B$ 를 attention 로짓에 더한다. 윈도우 크기가 $M$ 이면 상대 좌표는 $(2M-1)^2$ 가지뿐이라 작은 테이블로 충분하고, 입력 해상도가 바뀌어도 재사용된다. 논문의 ablation에서 절대 위치 임베딩보다 일관되게 낫다.'}
],

diagram:{type:'stack', cap:'Swin의 4스테이지 계층 구조(블록 수 2·2·6·2). 해상도는 224×224 입력 기준으로 ResNet의 C2~C5와 대응되며, ViT는 이 중 16× 해상도 하나만 유지한다. 각 Swin Block은 W-MSA 블록과 SW-MSA(윈도우를 (3,3) 시프트) 블록이 짝을 이룬다.',
 layers:[
  {t:'패치 임베딩', s:'4×4 패치 → 56×56×C', note:'4× 다운샘플'},
  {t:'Stage 1', s:'56×56 × C', note:'Swin Block ×2'},
  {t:'Stage 2', s:'28×28 × 2C', note:'Merging → Block×2'},
  {t:'Stage 3', s:'14×14 × 4C', note:'Merging → Block×6'},
  {t:'Stage 4', s:'7×7 × 8C', note:'Merging → Block×2'},
  {t:'Swin Block 구조', s:'W-MSA → SW-MSA', acc:true, note:'윈도우 7×7 · 시프트'}
 ]},

math:[
 {expr:'Ω(MSA) = 4hwC² + 2(hw)²C     Ω(W-MSA) = 4hwC² + 2M²hwC',
  tex:'\\begin{aligned} \\Omega(\\text{MSA}) &= 4hwC^2 + 2(hw)^2C \\\\ \\Omega(\\text{W-MSA}) &= 4hwC^2 + 2M^2hwC \\end{aligned}',
  d:'논문의 핵심 부등식. 전역 attention은 토큰 수 $hw$ 에 **제곱**이지만, 윈도우 attention은 윈도우 크기 $M$ 이 상수이므로 $hw$ 에 **선형**이다. $M=7$ 고정, $hw=56^2$ 이면 두 번째 항이 수백 배 차이 난다.'},
 {expr:'Attention(Q,K,V) = softmax( Q Kᵀ / √d + B ) V',
  tex:'\\text{Attention}(Q,K,V)=\\text{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d}}+B\\right)V',
  d:'$B \\in \\mathbb{R}^{M^2 \\times M^2}$ 는 상대 위치 바이어스로, 실제로는 $(2M-1)^2$ 개 파라미터 테이블 $\\hat{B}$ 에서 상대 좌표로 인덱싱해 만든다.'}
],

numbers:[
 {k:'COCO test-dev box AP', v:'58.7', d:'당시 SOTA 대비 **+2.7 AP**'},
 {k:'COCO test-dev mask AP', v:'51.1', d:'당시 SOTA 대비 **+2.6 AP**'},
 {k:'ADE20K val mIoU', v:'53.5', d:'의미 분할, 당시 SOTA 대비 **+3.2 mIoU**'},
 {k:'ImageNet-1k top-1', v:'87.3%', d:'Swin-L · ImageNet-22k 사전학습 · 384 해상도'},
 {k:'Swin-T', v:'29M · 4.5 GFLOPs · 81.3%', d:'ResNet-50(25M·4.1G·76.2%)과 같은 예산대에서 비교하도록 설계'},
 {k:'윈도우 크기 M', v:'7', d:'모든 스테이지 공통. 시프트량은 3'}
],

figures:[
 {f:'fig2-shifted-window.png',
  cap:'왼쪽 Layer l에서는 8×8 특징 맵을 4×4 윈도우(빨간 테두리) 4개로 딱 맞게 나눠 각 윈도우 안에서만 attention을 계산한다. 오른쪽 Layer l+1에서는 그 경계를 (M/2, M/2)만큼 대각선으로 밀어(shift) 새 윈도우를 만든다 — 그러면 이전 레이어에서 서로 다른 윈도우에 있던 패치들이 이번엔 같은 윈도우에 묶여 정보가 오간다. 이 교대(shift↔no-shift)가 윈도우 간 연결을 만드는 유일한 장치다.',
  src:'원문 Figure 2, p.2'},
 {f:'fig1-hierarchical.png',
  cap:'같은 이미지를 처리하는 두 방식의 대비. (a) Swin은 얕은 층에서 작은 회색 패치로 시작해 깊어질수록 4배씩 병합(4×→8×→16×)하며 특징 맵 해상도를 줄인다 — CNN처럼 계층적 피라미드가 생겨서 FPN·U-Net에 바로 꽂을 수 있다. (b) ViT는 처음부터 끝까지 16× 해상도 한 장뿐이라 세밀한 예측(검출·분할)에 불리하다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'The shifted windowing scheme brings greater efficiency by limiting self-attention computation to non-overlapping local windows while also allowing for cross-window connection.',
  src:'Abstract, p.1'},
 {t:'While the CNN and its variants are still the primary backbone architectures for computer vision applications, we highlight the strong potential of Transformer-like architectures for unified modeling between vision and language.',
  src:'Section 2, p.2'}
],

impact:'ViT를 "분류용 모델"에서 **비전 백본**으로 승격시켰다. Swin이 나온 뒤 COCO·ADE20K 리더보드가 몇 달 만에 Transformer 백본으로 갈아치워졌고, `mmdetection`·`mmsegmentation` 같은 프레임워크에 ResNet과 나란히 기본 옵션으로 들어갔다. 설계 관점에서 더 중요한 건 방향 전환이다 — [ViT](#/p/vit)가 CNN의 귀납적 편향을 버려서 성능을 얻었다면, Swin은 **지역성과 계층성이라는 편향만 골라 다시 넣는 것이 오히려 이득**임을 보였다. 이 "무엇을 버리고 무엇을 남길 것인가"의 재조정이 이후 비전 아키텍처 설계의 표준 질문이 됐고, 곧바로 [ConvNeXt](#/p/convnext)의 반론(그럼 CNN에 Swin의 레시피를 넣으면?)을 불렀다.',

legacy:[
 '**표준 검출/분할 백본** — [Mask R-CNN](#/p/mask-rcnn)·[FPN](#/p/fpn)·Cascade R-CNN·UperNet의 ResNet 자리를 그대로 대체하며 수년간 기본 옵션으로 자리잡음',
 '**CNN의 재검증을 촉발** — [ConvNeXt](#/p/convnext)가 Swin의 매크로 설계와 학습 레시피를 순수 CNN에 이식해 대등한 성능을 내며 "Transformer라서 좋은 것인가"를 되물음',
 '**Swin V2로 확장** — 시프트 윈도우 구조를 유지한 채 30억 파라미터·1536² 해상도까지 스케일업, 대형 비전 모델 학습의 안정화 기법(post-norm·scaled cosine attention)을 추가',
 '**희소·지역 attention 계열의 대표 사례** — 언어 쪽의 [희소 attention](#/p/sparse-attn)과 같은 문제의식이 비전에서 이 형태로 수렴'
],

pitfalls:[
 '**"선형 복잡도"는 attention 항에 대한 것이다.** $4hwC^2$ 짜리 선형 투영 항은 그대로 남아 있고, 실제로 작은 입력에서는 이 항이 지배적이다. 이론 복잡도만 보고 항상 빠를 것이라 기대하면 안 된다.',
 '**입력 해상도가 윈도우 크기의 배수가 아니면 패딩이 필요하다.** 특히 검출처럼 임의 크기 이미지를 넣을 때 구현이 까다롭고, 윈도우 크기 $M$ 을 바꾸면 상대 위치 바이어스 테이블의 크기가 달라져 사전학습 가중치를 보간해야 한다.',
 '**shifted window는 전역 attention의 근사가 아니다.** 한 층에서 두 토큰이 직접 상호작용할 수 있는 거리는 여전히 윈도우 크기로 제한되며, 먼 거리 관계는 층을 여러 개 통과해야만 전달된다 — 이 점에서는 [ViT](#/p/vit)의 $O(1)$ 경로 길이라는 장점을 반납한 것이다.'
],

links:[
 {t:'arXiv 2103.14030 — Swin Transformer: Hierarchical Vision Transformer using Shifted Windows', u:'https://arxiv.org/abs/2103.14030'},
 {t:'microsoft/Swin-Transformer (공식 코드)', u:'https://github.com/microsoft/Swin-Transformer'}
]
});
