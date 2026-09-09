WIKI.paper({
slug:'vit',
venue:'ICLR 2021',
authors:'Dosovitskiy et al. (Google Research, Brain Team)',
arxiv:'2010.11929',

tldr:'이미지를 16×16 패치로 잘라 **단어 토큰처럼** 취급하면, 합성곱을 한 층도 쓰지 않은 순수 [Transformer](#/p/transformer)로도 이미지 분류가 된다는 것을 보인 논문. 단 그 승리에는 조건이 붙는다 — **충분히 큰 사전학습 데이터**.',

context:'2020년까지 비전은 [ResNet](#/p/resnet) 계열 CNN의 독무대였다. attention을 이미지에 붙이려는 시도는 계속 있었지만, 대부분 CNN 백본에 attention 블록을 얹거나(non-local), 픽셀 단위 self-attention을 특수 커널로 구현하는 식이어서 **하드웨어 효율이 나쁘고 규모를 못 키웠다**. 문제의 뿌리는 계산량이다. 224×224 이미지를 픽셀 토큰으로 보면 $n=50176$ 이고 $O(n^2)$ attention은 물리적으로 불가능하다. 한편 NLP에서는 같은 Transformer를 데이터만 늘려 계속 키우면 성능이 포화하지 않는다는 것이 이미 확인된 상태였다. 이 논문의 질문은 그래서 **"이미지에서 토큰의 단위를 픽셀이 아니라 패치로 바꾸면, NLP의 그 스케일링을 그대로 가져올 수 있는가?"** 이다.',

ideas:[
 {h:'패치 = 토큰. 그게 전부다',
  lead:'이미지를 16×16 패치로 잘라 토큰처럼 만들고, 기존 Transformer 인코더를 그대로 재사용한다.',
  d:'224×224 이미지를 겹치지 않는 16×16 패치 196개로 자르고, 각 패치(16·16·3=768차원 벡터)를 하나의 선형층으로 $d$ 차원에 투영한다. 그러면 길이 196짜리 토큰 시퀀스가 나오고, 그 다음은 **NLP Transformer 인코더를 글자 그대로 재사용**한다. 패치 크기를 P로 두면 토큰 수가 $(HW)/P^2$ 로 줄어 $O(n^2)$ 이 감당 가능해진다. 논문의 기여 대부분은 "아무것도 바꾸지 않았다"는 데 있다.'},
 {h:'CNN의 귀납적 편향을 의도적으로 버린다',
  lead:'지역성·평행이동 등변성 같은 CNN의 내장 편향을 없애고, 공간 관계를 전부 데이터로부터 배우게 한다.',
  d:'CNN에는 **지역성**(가까운 픽셀끼리 관계 있다), **평행이동 등변성**(필터를 이미지 전체에 공유), **계층적 스케일**이 아키텍처에 내장돼 있다. ViT는 이걸 거의 전부 버린다. 남은 건 패치를 자를 때의 지역성과 위치 임베딩뿐이고, 나머지 공간 관계는 전부 데이터로부터 학습해야 한다. 이 선택이 이 논문의 성공 조건이자 실패 조건이다.'},
 {h:'[CLS] 토큰과 학습되는 1D 위치 임베딩',
  lead:'BERT식 [class] 토큰의 출력만 분류에 쓰고, 위치는 학습되는 1D 임베딩으로 준다.',
  d:'[BERT](#/p/bert)처럼 학습 가능한 `[class]` 토큰을 시퀀스 맨 앞에 붙이고, 마지막 층에서 그 토큰의 출력만 MLP head에 통과시켜 분류한다. 위치는 sin/cos 대신 **학습되는 1D 임베딩**을 쓴다. 2D 인식 위치 임베딩도 실험했지만 유의미한 차이가 없었다 — 모델이 1D 인덱스만으로 2D 격자 구조를 스스로 복원한다.'},
 {h:'데이터 스케일이 편향을 대체한다 — 조건부 승리',
  lead:'ImageNet-1k에서는 ResNet에 밀리지만, JFT-300M 규모에서야 ViT가 앞선다.',
  d:'이 논문의 진짜 결과는 하나의 숫자가 아니라 **교차점**이다. ImageNet-1k만으로 학습하면 ViT는 같은 규모 ResNet보다 **못한다**. ImageNet-21k(약 1400만 장)에서 비슷해지고, 사내 데이터셋 **JFT-300M(3억 장)** 에 와서야 ViT가 확실히 앞선다. 귀납적 편향은 데이터가 적을 때의 정규화이며, 데이터가 충분하면 오히려 제약이라는 것이다.'},
 {h:'같은 정확도를 더 싼 연산으로',
  lead:'ViT-H/14는 같은 성능의 CNN보다 4~5배 적은 연산으로 도달한다.',
  d:'ViT-H/14는 88.55%를 **2.5k TPUv3-core-day**로 얻는다. 비슷한 성능의 CNN 기반 BiT-L·Noisy Student는 그 4~5배가 든다. 즉 ViT는 "더 정확한 모델"이라기보다 **연산 대비 성능 곡선이 더 유리한 모델**이고, 이 성질이 이후 비전 백본을 전부 갈아치우는 실질적 이유가 된다.'}
],

diagram:{type:'flow', cap:'ViT의 전체 파이프라인. 회색 상자는 전부 기존 Transformer 인코더 그대로이고, 새로 추가된 것은 앞의 패치 분할·선형 투영뿐이다.',
 nodes:[
  {t:'입력 이미지', s:'224×224×3'},
  {t:'16×16 패치 분할', s:'→ 196개 토큰', acc:true},
  {t:'선형 투영 + 위치 임베딩', s:'각 768d · [CLS] 추가'},
  {t:'Transformer 층', s:'MSA+MLP · pre-LN · L개'},
  {t:'MLP 분류 head', s:'[CLS] 출력 → 1000-way'}
 ]},

math:[
 {expr:'z₀ = [ x_class ; x¹_p E ; x²_p E ; … ; x^N_p E ] + E_pos,   N = HW / P²',
  tex:'z_0=\\left[x_{\\text{class}};\\,x_p^1E;\\,x_p^2E;\\,\\dots;\\,x_p^NE\\right]+E_{pos},\\quad N=\\frac{HW}{P^2}',
  d:'패치 $x^i_p \\in \\mathbb{R}^{P^2 \\cdot C}$ 를 공유 행렬 $E$ 로 투영하고 위치 임베딩을 더한 것이 입력 시퀀스다. $P=16$, 224×224 이면 $N=196$, $P=14$ 면 $N=256$.'},
 {expr:'z\'_ℓ = MSA(LN(z_{ℓ-1})) + z_{ℓ-1},   z_ℓ = MLP(LN(z\'_ℓ)) + z\'_ℓ',
  tex:'\\begin{aligned} z\'_\\ell &= \\text{MSA}(\\text{LN}(z_{\\ell-1})) + z_{\\ell-1} \\\\ z_\\ell &= \\text{MLP}(\\text{LN}(z\'_\\ell)) + z\'_\\ell \\end{aligned}',
  d:'원 [Transformer](#/p/transformer)의 post-LN이 아니라 **pre-LN** 구성이다. ViT 이후 사실상 모든 비전/언어 Transformer가 이 형태를 쓴다.'}
],

numbers:[
 {k:'ImageNet top-1 · ViT-H/14', v:'88.55%', d:'JFT-300M 사전학습 후 파인튜닝 — 당시 최고 수준'},
 {k:'ImageNet top-1 · ViT-L/16 (21k)', v:'85.30%', d:'ImageNet-21k만으로도 CNN과 대등'},
 {k:'사전학습 연산량', v:'2.5k TPUv3-core-day', d:'같은 성능의 BiT-L(9.9k) · Noisy Student(12.3k) 대비 **1/4 이하**'},
 {k:'토큰 수', v:'196', d:'224×224 ÷ 16×16 패치. 픽셀 토큰이면 50,176개'},
 {k:'모델 크기', v:'86M / 307M / 632M', d:'Base(12층·768d) / Large(24층·1024d) / Huge(32층·1280d)'},
 {k:'JFT-300M', v:'3억 장 · 18,291 클래스', d:'비공개 사내 데이터셋 — 재현의 최대 장벽'}
],

figures:[
 {f:'fig1-patch-split.png',
  cap:'왼쪽이 ViT 전체 그림, 오른쪽이 그 안에 L번 반복되는 Transformer Encoder 블록 하나를 펼친 것. 왼쪽 하단의 이미지가 겹치지 않는 패치로 잘리고(0~9번), 각 패치가 선형 투영을 거쳐 토큰이 된 뒤 맨 앞에 학습되는 [class] 토큰(0*)이 붙는다. 이 시퀀스 전체가 표준 Transformer 인코더(오른쪽 회색 상자)에 그대로 들어가고, 마지막에 [class] 토큰의 출력만 MLP Head를 거쳐 분류로 나온다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig3-data-scaling.png',
  cap:'x축이 사전학습 데이터셋 크기(ImageNet → ImageNet-21k → JFT-300M), y축이 ImageNet 파인튜닝 top-1 정확도. 회색 음영이 BiT(ResNet) 계열이 도달하는 범위다. ImageNet만으로 학습하면 점(ViT)들이 음영 아래에 있어 ResNet에 못 미치지만, 오른쪽으로 갈수록(데이터가 커질수록) ViT-L/16·ViT-H/14가 음영 위로 올라선다 — 이 교차가 논문의 핵심 주장이다.',
  src:'원문 Figure 3, p.7'}
],

quotes:[
 {t:'We show that this reliance on CNNs is not necessary and a pure transformer applied directly to sequences of image patches can perform very well on image classification tasks.',
  src:'Abstract, p.1'},
 {t:'When trained on mid-sized datasets such as ImageNet without strong regularization, these models yield modest accuracies of a few percentage points below ResNets of comparable size.',
  src:'Section 1, p.1'}
],

impact:'비전 연구의 기본 가정을 바꿨다. **(1) 백본의 교체** — 검출·분할·생성까지 CNN 자리에 ViT가 들어가기 시작했고, [DETR](#/p/detr)·[SAM](#/p/sam)·[DINOv2](#/p/dinov2) 같은 후속 시스템이 이 위에 세워졌다. **(2) 모달리티 통합** — 이미지가 토큰 시퀀스가 되면서 텍스트와 같은 모델에 넣을 수 있게 됐고, [CLIP](#/p/clip)·[LLaVA](#/p/llava) 계열 멀티모달의 전제가 되었다. **(3) 데이터가 병목이라는 자각** — "더 나은 아키텍처"가 아니라 "더 많은 데이터"가 성능을 결정한다는 결론이 나오면서, 다음 4~5년의 비전 연구가 통째로 **데이터 요구를 줄이는 방향**([DeiT](#/p/deit)의 증류, [MAE](#/p/mae)의 자기지도)으로 재편됐다.',

legacy:[
 '**데이터 요구를 깎는 계열** — [DeiT](#/p/deit)가 [지식 증류](#/p/distillation)로 ImageNet-1k만으로 학습 가능하게 만들고, [MAE](#/p/mae)·[DINO](#/p/dino)가 레이블 없는 자기지도로 그 요구를 다시 낮춤',
 '**편향을 다시 넣는 계열** — [Swin](#/p/swin)이 지역 윈도우와 계층 구조를 되살려 detection/segmentation 백본이 되고, [ConvNeXt](#/p/convnext)는 거꾸로 CNN에 ViT의 설계를 이식해 "편향이 아니라 학습 레시피가 차이였다"고 반박',
 '**멀티모달의 시각 인코더** — [CLIP](#/p/clip)·[SigLIP](#/p/siglip)·[BLIP-2](#/p/blip2)·[Qwen-VL](#/p/qwen-vl)까지 거의 모든 비전-언어 모델이 ViT를 눈으로 씀',
 '**생성 모델로 이식** — [DiT](#/p/dit)가 [확산 모델](#/p/ddpm)의 U-Net을 ViT로 갈아끼우며 Sora 계열 영상 생성의 골격이 됨'
],

pitfalls:[
 '**"ViT가 CNN보다 좋다"는 데이터 조건을 뗀 채로는 틀린 문장이다.** 논문 자체가 ImageNet-1k 규모에서는 ViT가 ResNet보다 못하다고 명시한다. 소규모 데이터셋에 ViT를 그냥 얹으면 대개 CNN보다 나쁘다 — 사전학습 가중치를 쓰거나 [DeiT](#/p/deit)식 레시피가 필요하다.',
 '**핵심 결과의 재현이 불가능하다.** 88.55%는 비공개 JFT-300M에 의존한다. 공개된 ImageNet-21k 체크포인트가 실질적인 대체재이며, 논문의 최고 수치를 그대로 기대하면 안 된다.',
 '**패치 크기를 바꾸면 계산량이 제곱으로 움직인다.** ViT-L/16과 ViT-L/14는 파라미터 수가 거의 같지만 토큰이 196 → 256으로 늘어 연산은 훨씬 비싸다. 모델 이름의 `/숫자`는 크기가 아니라 **해상도 비용**을 가리킨다.'
],

links:[
 {t:'arXiv 2010.11929 — An Image is Worth 16x16 Words', u:'https://arxiv.org/abs/2010.11929'},
 {t:'google-research/vision_transformer (공식 코드·체크포인트)', u:'https://github.com/google-research/vision_transformer'}
]
});
