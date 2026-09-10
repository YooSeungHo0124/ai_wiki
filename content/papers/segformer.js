WIKI.paper({
slug:'segformer',
venue:'NeurIPS 2021',
authors:'Xie et al. (HKU · Nanjing University · NVIDIA · Caltech)',
arxiv:'2105.15203',

tldr:'계층적 Transformer 인코더와 **MLP만으로 된 디코더**를 결합해, ASPP 같은 복잡한 문맥 모듈이나 위치 인코딩 없이도 CNN 계열을 앞서는 분할 성능을 낸 논문. SegFormer-B4가 이전 최고 대비 **파라미터 1/5로 mIoU +2.2%p**를 얻는다.',

context:'[ViT](#/p/vit)를 그대로 분할에 쓰면 두 가지가 걸린다. 첫째, ViT는 단일 해상도 특징 맵만 내놓아서 [DeepLabv3+](#/p/deeplabv3plus)식으로 저수준·고수준 특징을 섞는 CNN 스타일 디코더를 쓰기 어렵다. 둘째, ViT는 고정 해상도의 위치 인코딩을 쓰는데, 학습과 다른 해상도로 테스트하면 위치 코드를 보간해야 하고 정확도가 떨어진다. 실제로 SETR(ViT를 분할에 처음 적용한 논문)은 이 문제를 그대로 안고 있었다. SegFormer는 인코더를 계층적으로 바꾸고 위치 인코딩 자체를 없애는 방식으로 두 문제를 동시에 없앤다.',

ideas:[
 {h:'계층적 Mix Transformer(MiT) 인코더',
  lead:'4×4 패치로 시작해 4단계에서 해상도를 절반씩 줄이며 CNN처럼 다중 스케일 특징을 만든다.',
  d:'ViT의 16×16 패치 대신 **4×4 패치**로 시작하고, overlapping patch merging(겹치는 패치 병합, K=7·S=4·P=3 등)으로 stage마다 해상도를 1/4→1/8→1/16→1/32로 줄인다. 그 결과 CNN 백본처럼 4단계의 다중 스케일 특징 $F_1..F_4$ 가 나와, 이후 디코더가 저수준·고수준 정보를 모두 쓸 수 있다.'},
 {h:'Efficient Self-Attention: 시퀀스를 줄여 복잡도를 낮춘다',
  lead:'K를 R배 축소한 뒤 attention을 계산해 $O(N^2)$ 을 $O(N^2/R)$ 로 낮춘다.',
  d:'attention의 $O(N^2)$ 복잡도가 고해상도 특징 맵에서는 감당이 안 되므로, PVT에서 쓴 sequence reduction을 그대로 가져온다. K를 $N/R \\times (C{\\cdot}R)$ 로 reshape한 뒤 선형층으로 다시 $C$ 차원으로 줄인다. 실험에서는 R을 stage 1→4에 걸쳐 [64,16,4,1]로 설정해, 해상도가 높은 초기 stage일수록 더 세게 줄인다.'},
 {h:'Mix-FFN: 위치 인코딩을 3×3 conv로 대체한다',
  lead:'FFN 안에 depthwise 3×3 conv를 끼워 넣어 위치 정보를 새게 하고, 명시적 위치 인코딩을 없앤다.',
  d:'ViT의 고정 해상도 위치 인코딩(PE)은 테스트 해상도가 달라지면 보간이 필요해 정확도가 떨어진다. SegFormer는 PE를 아예 제거하고, FFN 안에 $3{\\times}3$ depthwise conv를 끼워 넣어 zero-padding이 만드는 위치 단서를 흘려보내는 방식(Mix-FFN)으로 대체한다. `x_out = MLP(GELU(Conv3x3(MLP(x_in)))) + x_in`. 실험에서 PE를 쓸 때는 테스트 해상도를 낮추면 정확도가 3.3%p 떨어지지만 Mix-FFN은 0.7%p만 떨어진다.'},
 {h:'All-MLP 디코더: conv도 attention도 없이 합친다',
  lead:'4단계 특징을 각각 선형층으로 채널 통일 → 업샘플 → concat → 선형층으로 합치는 것이 전부다.',
  d:'인코더가 큰 유효 수용영역(ERF)을 이미 갖고 있기 때문에, 디코더는 ASPP 같은 별도의 문맥 확장 모듈이 필요 없다는 것이 논문의 핵심 관찰이다. $\\hat F_i=\\text{Linear}(F_i)$ 로 채널을 맞추고 모두 1/4 해상도로 업샘플해 concat한 뒤, 선형층 하나로 합치고 다시 선형층으로 클래스 로짓을 만든다. 전부 MLP(=1×1 conv와 동일)이지 conv 커널을 쓰는 문맥 모듈이 없다.'}
],

diagram:{type:'flow', cap:'MiT 인코더 4단계(패치 오버랩 병합 → Efficient Self-Attn + Mix-FFN 반복)가 만든 4개 해상도의 특징을 All-MLP 디코더가 업샘플+concat으로 합친다.',
 nodes:[
  {t:'입력', s:'H×W×3'},
  {t:'패치 임베딩', s:'4×4, 겹침'},
  {t:'MiT 4단계', s:'1/4→1/32', acc:true, a:'계층적'},
  {t:'MLP 디코더', s:'업샘플+concat'},
  {t:'분할 마스크', s:'H/4×W/4×N_cls'}
 ]},

math:[
 {expr:'Attention(Q,K,V) = softmax(QKᵀ/√d_head) V,  단 K,V는 R배 축소 후 사용',
  tex:'\\text{Attention}(Q,K,V)=\\text{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d_{head}}}\\right)V',
  d:'표준 스케일드 닷프로덕트 attention 자체는 그대로이나, $K$ 를 $\\hat K=\\text{Reshape}(N/R,\\,C{\\cdot}R)(K)$ 로 줄이고 선형층을 통과시켜 복잡도를 $O(N^2)$ 에서 $O(N^2/R)$ 로 낮춘다.'},
 {expr:'Mix-FFN: x_out = MLP(GELU(Conv3x3(MLP(x_in)))) + x_in',
  tex:'\\mathbf{x}_{out} = \\text{MLP}\\big(\\text{GELU}(\\text{Conv}_{3\\times3}(\\text{MLP}(\\mathbf{x}_{in})))\\big) + \\mathbf{x}_{in}',
  d:'FFN 내부에 depthwise 3×3 conv를 끼워 위치 정보를 암묵적으로 제공한다 — 명시적 위치 인코딩을 전혀 쓰지 않는다.'},
 {expr:'디코더: F̂ᵢ=Linear(Fᵢ) → Upsample(1/4) → F=Linear(Concat(F̂ᵢ)) → M=Linear(F)',
  tex:'\\begin{aligned}\\hat F_i &= \\text{Linear}(C_i, C)(F_i)\\\\ \\hat F_i &= \\text{Upsample}\\!\\left(\\tfrac{H}{4}\\times\\tfrac{W}{4}\\right)(\\hat F_i)\\\\ F &= \\text{Linear}(4C, C)(\\text{Concat}(\\hat F_i))\\\\ M &= \\text{Linear}(C, N_{cls})(F)\\end{aligned}',
  d:'디코더 네 단계 전부가 선형층(=MLP)과 업샘플·concat뿐이다. conv 기반 문맥 모듈이 전혀 없다.'}
],

numbers:[
 {k:'ADE20K val mIoU (SegFormer-B4)', v:'50.3%', d:'파라미터 64M, 이전 최고 대비 5배 작고 +2.2%p 높음'},
 {k:'Cityscapes val mIoU (SegFormer-B5)', v:'84.0%', d:'논문 최고 모델, 파라미터 84.7M'},
 {k:'복잡도', v:'O(N²) → O(N²/R)', d:'Efficient Self-Attention, R=[64,16,4,1] (stage 1→4)'},
 {k:'해상도 변화 시 정확도 하락', v:'PE 3.3%p vs Mix-FFN 0.7%p', d:'위치 인코딩 제거의 실질적 효과(ADE20K, 훈련·테스트 해상도 상이)'},
 {k:'패치 크기', v:'4×4', d:'ViT의 16×16보다 작게 — dense prediction에 유리'}
],

impact:'"큰 문맥을 보려면 ASPP 같은 무거운 모듈이 필요하다"는 CNN 시대의 전제를, Transformer 인코더가 이미 큰 유효 수용영역을 갖고 있다는 관찰(Figure 3의 ERF 비교)로 뒤집었다. 그 결과 디코더를 MLP 몇 층으로 단순화할 수 있음을 보여, 이후 분할 모델 설계에서 "복잡한 디코더" 대신 "충분히 좋은 인코더 + 가벼운 디코더" 쪽으로 무게중심이 옮겨갔다. Cityscapes-C 등 손상된 입력에 대한 zero-shot 강건성도 DeepLabv3+보다 뚜렷이 높게 보고되어, 실무 배치 관점에서도 주목을 받았다.',

legacy:[
 '**[DeepLabv3+](#/p/deeplabv3plus)와의 직접 비교** — 같은 ERF 분석 틀로 CNN의 근본적 한계(4단계에서도 국소적인 수용영역)를 시각적으로 드러냈다',
 '**[Mask2Former](#/p/mask2former) 등 후속 Transformer 분할기** — 쿼리 기반 디코더로 계보가 이어지지만, "무거운 문맥 모듈 없이도 된다"는 SegFormer의 관찰이 그 설계들의 전제를 뒷받침한다',
 '**MiT 백본의 독립적 재사용** — PVT 계열의 sequence reduction과 결합한 MiT 인코더 자체가 검출·분할 등 다른 과제의 백본으로도 쓰이기 시작했다',
 '**위치 인코딩 없는 설계의 확산** — Mix-FFN처럼 conv로 위치 정보를 암묵적으로 흘리는 방식이 이후 여러 비전 Transformer에서 반복해 채택됐다'
],

pitfalls:[
 '**"위치 인코딩이 없다"는 "위치 정보가 없다"는 뜻이 아니다.** Mix-FFN의 3×3 depthwise conv와 zero-padding이 암묵적으로 위치 단서를 제공한다 — 완전한 순서 불변(permutation-invariant) 모델이 아니다.',
 '**All-MLP 디코더는 CNN 백본에는 잘 안 맞는다.** 논문이 직접 확인했듯, CNN은 Stage-4에서도 수용영역이 작아서 같은 디코더를 CNN에 붙이면 성능이 나오지 않는다 — SegFormer의 단순함은 Transformer 인코더의 큰 ERF에 의존한다.',
 '**50.3%는 B4, 84.0%는 B5의 수치다.** SegFormer는 B0~B5로 스케일이 여럿이라 어느 모델인지 반드시 명시해야 한다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'왼쪽(Encoder): Overlap Patch Embeddings로 시작해 4개의 Transformer Block(각각 Efficient Self-Attn + Mix-FFN + Overlap Patch Merging을 N번 반복)이 해상도를 1/4→1/8→1/16→1/32로 줄인다. 오른쪽(Decoder): 각 단계 특징을 MLP Layer로 채널을 맞추고 업샘플해 합친 뒤 MLP 하나로 최종 마스크를 예측 — conv 기반 문맥 모듈이 없다.',
  src:'원문 Figure 2, p.3'},
 {f:'fig3-erf.png',
  cap:'같은 4단계+Head 구성에서 DeepLabv3+(위)와 SegFormer(아래)의 유효 수용영역(ERF)을 비교. DeepLabv3+는 Stage-4에서도 밝은 영역이 작게 뭉쳐 있지만(국소적), SegFormer는 Stage-4·Head에서 넓게 퍼진다 — "Transformer 인코더가 이미 큰 문맥을 본다"는 주장의 직접적 증거.',
  src:'원문 Figure 3, p.5'}
],

quotes:[
 {t:'We argue that positional encoding is actually not necessary for semantic segmentation.',
  src:'Section 3.1, p.4'}
],

links:[
 {t:'arXiv 2105.15203 — SegFormer', u:'https://arxiv.org/abs/2105.15203'},
 {t:'공식 코드 (NVlabs/SegFormer)', u:'https://github.com/NVlabs/SegFormer'}
]
});
