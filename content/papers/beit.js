WIKI.paper({
slug:'beit',
venue:'ICLR 2022',
authors:'Bao, Dong, Piao & Wei (Harbin Institute of Technology · Microsoft Research)',
arxiv:'2106.08254',

tldr:'`[BERT](#/p/bert)`의 masked language modeling을 이미지에 옮기되, **가려진 패치의 원본 픽셀이 아니라 이산 시각 토큰을 맞히게** 만든 self-supervised `[ViT](#/p/vit)` 사전학습법. 같은 시기 픽셀을 직접 복원하는 `[MAE](#/p/mae)`와 정반대 선택을 했고, 두 접근이 이후 비전 사전학습의 두 갈래를 이룬다.',

context:'`[BERT](#/p/bert)`가 텍스트에서 토큰을 가리고 맞히는 방식으로 성공을 거두자, 같은 아이디어를 이미지에 옮기려는 시도가 이어졌다. 문제는 이미지에 **BERT의 vocabulary에 해당하는 자연스러운 이산 단위가 없다**는 점이다. `[ViT](#/p/vit)`는 가려진 패치의 평균 3비트 색상을 예측하는 실험을 했지만 픽셀 수준 복원은 성능이 나빴고, iGPT는 RGB를 k-means로 클러스터링한 9비트 팔레트를 입력과 출력 양쪽에 써서 원본 해상도 정보를 잃었다. BEiT는 이 둘 사이에서 **입력은 원본 패치를 그대로 쓰고, 예측 대상만 이산 토큰으로 바꾸는** 절충안을 택한다.',

ideas:[
 {h:'이미지의 두 가지 표현: 패치와 시각 토큰',
  lead:'같은 이미지를 16×16 패치(입력용)와 14×14 시각 토큰(예측 타깃)으로 동시에 표현한다.',
  d:'입력 쪽은 `[ViT](#/p/vit)`와 동일하게 이미지를 패치로 잘라 원본 픽셀 정보를 그대로 유지한다. 반면 예측 타깃은 사전에 학습된 `[VQ-VAE](#/p/vqvae)`(정확히는 DALL·E의 discrete VAE, vocabulary 크기 8192)로 이미지를 14×14 = 196개의 이산 토큰으로 인코딩한 것이다. 같은 이미지를 두 개의 서로 다른 "view"로 동시에 다루는 이 설계가 BEiT의 핵심 트릭이다.'},
 {h:'블록 단위 마스킹으로 40%를 가린다',
  lead:'패치를 무작위 개별 선택이 아니라 사각형 블록 단위로 최소 16개씩 묶어 약 40%를 가린다.',
  d:'단순 무작위 마스킹 대신 Algorithm 1처럼 블록 크기와 종횡비를 무작위로 뽑아 사각형 영역을 반복해서 가리고, 전체 패치의 40%가 가려질 때까지 이를 반복한다. 가려진 위치는 학습 가능한 `[M]` 임베딩으로 대체되어 `[BERT](#/p/bert)`의 `[MASK]` 토큰과 같은 역할을 한다.'},
 {h:'MIM: 가려진 위치에서 원본 시각 토큰을 맞힌다',
  lead:'가려진 패치의 인코더 출력에 softmax 분류기를 얹어 원본 이미지의 시각 토큰을 예측한다.',
  d:'가려진 위치 $i$ 의 마지막 은닉 벡터 $h_i^L$ 을 받아 `Wc·h + bc` 를 8192-way softmax에 통과시키고, 원본(마스킹 전) 이미지에서 얻은 토큰 $z_i$ 를 정답으로 log-likelihood를 최대화한다. `[BERT](#/p/bert)`가 마스킹된 단어를 그대로 맞히는 것과 정확히 같은 구조지만, 여기서 맞히는 대상은 픽셀이 아니라 토큰 vocabulary의 인덱스다.'},
 {h:'변분 하한으로 두 단계 학습을 정당화한다',
  lead:'전체 목적함수를 토큰화(dVAE)와 MIM 두 단계로 쪼갠 것을 evidence lower bound로 설명한다.',
  d:'원본 이미지 $x$, 마스킹된 이미지 $\\tilde x$, 시각 토큰 $z$ 를 함께 고려하면 로그우도 $\\log p(x|\\tilde x)$ 에 대한 evidence lower bound가 "토큰화기 학습"과 "마스킹된 이미지로 토큰 복원"이라는 두 개의 항으로 분해된다는 것을 보인다. 이 유도가 왜 토큰화기를 먼저 고정하고 MIM을 나중에 학습해도 되는지에 대한 이론적 근거가 된다.'},
 {h:'AdaGN 없이도 되는 표준 fine-tuning: task layer만 교체',
  lead:'사전학습된 인코더는 그대로 두고 분류·분할용 task layer만 얹어 downstream에 적용한다.',
  d:'사전학습이 끝나면 BEiT 인코더 위에 이미지 분류용 average-pooling+선형층, 또는 semantic segmentation용 `SETR`류 task layer를 얹어 전체를 fine-tune한다. `[BERT](#/p/bert)`가 `[CLS]` 위에 헤드를 얹는 것과 같은 패턴을 비전에 그대로 적용한 것이다.'}
],

diagram:{type:'flow', cap:'BEiT 사전학습 파이프라인. 입력은 패치 그대로, 정답은 토큰화기가 만든 시각 토큰.',
 nodes:[
  {t:'원본 이미지', s:'H×W×3'},
  {t:'dVAE 토큰화', s:'14×14 토큰, vocab 8192', note:'사전학습된 tokenizer'},
  {t:'블록 마스킹', s:'약 40% 패치 [M]', acc:true},
  {t:'BEiT 인코더', s:'ViT 구조'},
  {t:'MIM 헤드', s:'가려진 위치의 토큰 예측'}
 ]},

math:[
 {expr:'max Σ_x E_M [ Σ_{i∈M} log p_MIM(z_i | x^M) ]',
  tex:'\\max \\sum_{x\\in\\mathcal{D}} \\mathbb{E}_{M}\\left[\\sum_{i\\in M} \\log p_{\\text{MIM}}(z_i \\mid x^{M})\\right]',
  d:'MIM의 사전학습 목적함수. $x^M$ 은 마스킹된 이미지, $M$ 은 가려진 위치 집합, $z_i$ 는 토큰화기가 만든 원본 이미지의 정답 토큰이다.'},
 {expr:'log p(x|x~) ≥ E_{z~q_φ(z|x)}[ log p_ψ(x|z) ] − D_KL[q_φ(z|x) || p_θ(z|x~)]',
  tex:'\\log p(x\\mid \\tilde x) \\ge \\mathbb{E}_{z\\sim q_\\phi(z|x)}\\big[\\log p_\\psi(x\\mid z)\\big] - D_{\\mathrm{KL}}\\big[q_\\phi(z\\mid x)\\,\\|\\,p_\\theta(z\\mid \\tilde x)\\big]',
  d:'variational autoencoder 관점의 evidence lower bound. $q_\\phi$ 는 토큰화기, $p_\\psi$ 는 dVAE 디코더, $p_\\theta$ 는 BEiT의 MIM 예측이다. 두 단계 학습(토큰화기 먼저, MIM 나중)을 정당화한다.'}
],

numbers:[
 {k:'ImageNet-1K top-1 (BEiT-B, 224)', v:'83.2%', d:'같은 크기 `[ViT](#/p/vit)`를 무작위 초기화로 학습한 것보다 크게 개선, MoCo v3-B와 동률'},
 {k:'ImageNet-1K top-1 (BEiT-L, 384)', v:'86.3%', d:'large 스케일에서 개선 폭이 base보다 더 커짐(2.0 vs 1.7 포인트)'},
 {k:'70M 라벨로 미세조정 시', v:'89.5% / mIoU 58.4', d:'ImageNet top-1과 ADE20K mIoU 모두 당시 대형 ViT 최고 기록'},
 {k:'ADE20K mIoU (BEiT, 300 epoch)', v:'44.65', d:'ImageNet 지도학습 사전학습보다 라벨 없이 더 나은 분할 성능'},
 {k:'마스킹 비율', v:'약 40%', d:'블록 단위로 최소 16패치씩 묶어 가림, 196개 패치 중 약 75개'},
 {k:'토큰 vocabulary 크기', v:'8192', d:'DALL·E dVAE 토큰화기 재사용, 14×14=196개 토큰/이미지'}
],

impact:'BEiT는 "이미지의 BERT"를 만들 때 무엇을 예측 타깃으로 삼을지가 아키텍처만큼 중요하다는 것을 보였다. Ablation(Table 4)에서 시각 토큰 대신 픽셀을 직접 복원하도록 바꾸면 ImageNet이 82.86%→81.04%, ADE20K mIoU가 44.65→41.38로 함께 떨어져, "무엇을 맞히게 하는가"가 단순한 설계 선택이 아니라 실측으로 검증된 성능 차이임을 논문 스스로 보였다. 또한 self-attention map이 사람 라벨 없이도 객체 경계를 분리해낸다는 관찰(Figure 2)은 masked image modeling이 단순 복원을 넘어 의미론적 구조를 학습한다는 근거로 널리 인용됐다.',

legacy:[
 '**`[MAE](#/p/mae)`와의 갈림길** — 같은 2021년, MAE는 정반대로 픽셀을 직접 복원하는 쪽을 택했고 더 단순하면서도 비슷하거나 더 나은 성능을 보이면서, "이산 토큰이 꼭 필요한가"라는 논쟁이 비전 사전학습의 한 축이 됨',
 '**토큰화기 의존성 논의** — BEiT의 성능이 별도로 학습된 dVAE 토큰화기 품질에 묶여 있다는 점이 이후 연구(BEiT v2 등)에서 토큰화기 자체를 개선하는 방향으로 이어짐',
 '**비전에서 "무엇을 맞힐 것인가" 설계공간을 연 것** — 픽셀·이산 토큰·특징 벡터(예: 교사 모델의 표현) 중 어느 것을 타깃으로 할지가 이후 self-supervised vision 연구의 핵심 축이 됨',
 '**`[ViT](#/p/vit)` 백본에 그대로 얹히는 사전학습 레시피** — 아키텍처 변경 없이 사전학습 목적함수만 바꿔 downstream 성능을 올리는 패턴이 비전 트랜스포머 생태계의 표준 관행이 됨'
],

pitfalls:[
 '**BEiT는 사전학습된 외부 토큰화기(dVAE)에 의존한다.** 이 토큰화기 자체는 별도의 대규모 이미지-텍스트 데이터로 학습된 것이라, "순수하게 라벨 없는 자기지도학습"이라는 설명은 토큰화기 학습 과정까지 포함하면 다소 과장이다.',
 '**"토큰을 맞혀야 더 좋다"는 이 논문의 ablation 안에서의 결론이다.** 같은 시기 `[MAE](#/p/mae)`는 다른 마스킹 비율(75%)·다른 디코더 구조에서 픽셀 복원만으로도 강한 성능을 보였으므로, 두 결과를 직접 비교할 때는 실험 조건 차이를 감안해야 한다.',
 '**self-attention map이 객체를 "분리"하는 것과 "이해"하는 것은 다르다.** Figure 2는 흥미로운 정성적 관찰이지만, 이것이 곧 semantic segmentation 성능으로 직결된다는 정량적 인과관계를 논문이 증명한 것은 아니다.'
],

figures:[
 {f:'fig1-overview.png',
  cap:'전체 파이프라인. 왼쪽 위에서 아래로 원본 이미지 → 패치(입력용) → 블록마스킹된 패치가 인코더로 들어가고, 오른쪽 위에서는 같은 원본이 미리 학습된 토큰화기를 거쳐 시각 토큰 격자가 된다. 초록 점선이 "가려진 위치의 인코더 출력으로 어떤 토큰을 맞혀야 하는지"를 잇는다. 디코더(점선 상자)는 토큰화기 학습에만 쓰이고 BEiT 사전학습 자체에는 관여하지 않는다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-attention-map.png',
  cap:'각 이미지에서 화살표로 가리킨 기준 패치 하나가 self-attention으로 어디를 보는지 히트맵으로 표시. 기차·도넛·지브라 예시 모두 사람이 그린 라벨 없이도 attention이 같은 객체 영역 안에 몰려 있다 — 클래스 지도 없이 학습됐는데도 객체 경계를 어느 정도 구분한다는 논문의 주장을 뒷받침하는 그림.',
  src:'원문 Figure 2, p.9'}
],

quotes:[
 {t:'Rather than using heuristically designed pre-training tasks, our proposed model leverages visual tokens learned by discrete VAE, which not only achieves better performance but also is better theoretically motivated.',
  src:'Related Work, p.9'},
 {t:'We propose that the self-supervised BEiT can learn reasonable semantic regions via pre-training, unleashing the rich supervision signals contained in images.',
  src:'Introduction, p.2'}
],

links:[
 {t:'arXiv 2106.08254 — BEiT: BERT Pre-Training of Image Transformers', u:'https://arxiv.org/abs/2106.08254'},
 {t:'공식 코드 (microsoft/unilm/beit)', u:'https://github.com/microsoft/unilm/tree/master/beit'}
]
});
