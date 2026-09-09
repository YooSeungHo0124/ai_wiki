WIKI.paper({
slug:'vqgan',
venue:'CVPR 2021 (oral)',
authors:'Esser, Rombach, Ommer (Heidelberg University)',
arxiv:'2012.09841',

tldr:'[VQ-VAE](#/p/vqvae)의 재구성 손실을 **지각 손실 + 적대적 손실**로 갈아끼워, 같은 토큰 개수로 훨씬 선명한 이미지를 복원하는 토크나이저를 만들고, 그 위에 [Transformer](#/p/transformer)를 자기회귀 prior로 올린 논문. CNN이 "무엇을 그릴지"의 어휘를 배우고 Transformer가 "어떻게 배치할지"를 배우는 분업을 정착시켰다.',

context:'2020년의 Transformer는 텍스트에서 압도적이었지만 이미지에는 붙일 수가 없었다. attention이 $O(n^2)$ 이라 $256\\times256$ 픽셀을 그대로 시퀀스로 넣으면 65,536 토큰이 되어 계산이 불가능하다. Image GPT는 이미지를 $32\\times32$ 로 다운샘플해 픽셀을 직접 자기회귀했지만, 저해상도라는 대가를 치렀다. 한편 [VQ-VAE](#/p/vqvae)는 이미지를 이산 토큰으로 줄이는 길을 이미 열어 두었으나, 픽셀 L2 재구성 손실을 쓰는 탓에 압축률을 높이면 복원이 흐려져서 **압축률과 화질 중 하나를 포기해야** 했다. 이 논문의 진단은 명확하다 — 병목은 Transformer가 아니라 **토크나이저의 손실 함수**다. 픽셀 단위 거리 대신 "사람 눈에 같아 보이는가"를 최적화하면, 압축률을 유지한 채로 화질을 되찾을 수 있다.',

ideas:[
 {h:'재구성 손실을 지각 손실 + discriminator로 교체',
  lead:'픽셀 L2 대신 지각 손실과 discriminator로 고주파 디테일을 되살린다.',
  d:'픽셀 L2는 여러 그럴듯한 텍스처의 평균을 정답으로 만들어 결과를 뭉갠다. 대신 사전학습된 CNN 특징 공간에서의 거리(**LPIPS 지각 손실**)와, 패치 단위 discriminator가 주는 **적대적 손실**을 쓴다. 지각 손실은 구조를 맞추고, discriminator는 "이 패치가 진짜 사진처럼 보이는가"를 강제해 고주파 디테일을 되살린다. VQ-VAE와 아키텍처는 거의 같지만 결과물은 완전히 다르다.'},
 {h:'압축률 f를 밀어붙일 수 있게 된다',
  lead:'손실을 바꿔 압축률 f=16, 256 토큰에서도 복원 품질을 유지한다.',
  d:'손실을 바꾸자 $f=16$(가로세로 16배 축소)에서도 복원 품질이 유지된다. 즉 $256\\times256$ 이미지가 $16\\times16=256$ 토큰이 된다. 논문은 $f$ 를 바꿔가며 절충점을 보인다 — $f=1$(픽셀 직접)은 시퀀스가 너무 길어 문맥을 못 잡아 비일관적인 이미지가 나오고, $f$ 가 너무 크면 얼굴 같은 세밀한 구조가 깨진다. **256 토큰**이 GPT-2 medium을 12GB GPU에서 돌릴 수 있는 최대 길이라는 점이 설계를 규정했다.'},
 {h:'Transformer가 코드북 인덱스를 자기회귀로 예측',
  lead:'얼어붙은 토크나이저 위에서 코드북 인덱스를 GPT-2로 자기회귀 예측한다.',
  d:'토크나이저가 얼어붙으면 이미지는 그냥 정수 시퀀스다. 격자를 래스터 순서로 펼쳐 $p(s) = \\prod_i p(s_i | s_{<i})$ 를 학습하는데, 이것은 언어모델과 문자 그대로 같은 문제다. 그래서 GPT-2 아키텍처를 수정 없이 가져다 쓴다. 조건부 생성도 간단하다 — 클래스 레이블이나 세그멘테이션 맵을 앞에 붙여 넣으면 그만이다.'},
 {h:'슬라이딩 윈도우로 메가픽셀까지',
  lead:'attention 윈도우를 이미지 위에서 미끄러뜨려 학습 해상도 이상으로 생성한다.',
  d:'학습은 256 토큰 길이로 하지만, 생성 시에는 attention 윈도우를 이미지 위에서 미끄러뜨리며 패치별로 이어 붙인다. 데이터셋이 공간적으로 대략 균질하거나 조건 정보(세그멘테이션 맵 등)가 전역 배치를 잡아 주는 경우, 학습 해상도보다 훨씬 큰 이미지를 일관되게 만들 수 있다.'},
 {h:'"어휘는 CNN이, 문법은 Transformer가"',
  lead:'국소 텍스처는 CNN에, 멀리 떨어진 요소의 배치는 Transformer에 맡긴다.',
  d:'논문의 프레이밍이 이 분업이다. 국소적 텍스처·재질처럼 **귀납 편향이 도움이 되는 부분**은 합성곱에 맡기고, 멀리 떨어진 요소들의 배치·구성처럼 **장거리 관계**는 attention에 맡긴다. Transformer로 모든 것을 대체하려던 당시 흐름에 대한 반례이자, 이후 잠재 공간 생성 모델의 표준 레시피가 되었다.'}
],

diagram:{type:'flow', cap:'2단계 구조. 1단계 토크나이저는 한 번 학습해 얼려 두고, 2단계 Transformer만 태스크별로 바꾼다.',
 nodes:[
  {t:'이미지', s:'256×256×3'},
  {t:'CNN Encoder', s:'f=16 다운샘플'},
  {t:'코드북 양자화', s:'16×16 = 256 토큰', acc:true},
  {t:'Transformer', s:'GPT-2 medium · 자기회귀'},
  {t:'CNN Decoder', s:'+ 지각/적대 손실로 학습'},
  {t:'출력 이미지', s:'256×256'}
 ]},

math:[
 {expr:'L_VQ = ‖x − x̂‖² + ‖sg[E(x)] − e‖² + β‖E(x) − sg[e]‖²  →  + L_perceptual + λ·L_GAN',
  tex:'L_{VQ} = \\|x-\\hat{x}\\|^2 + \\|\\text{sg}[E(x)]-e\\|^2 + \\beta\\|E(x)-\\text{sg}[e]\\|^2 \\;\\to\\; +\\,L_{perceptual} + \\lambda\\cdot L_{GAN}',
  d:'VQ-VAE의 세 항은 그대로 두고 **지각 손실과 적대적 손실을 추가**한 것이 1단계의 전부다. 이 손실 교체가 이 논문의 실질적 기여다.'},
 {expr:'λ = ∇_{G_L}[L_rec] / ( ∇_{G_L}[L_GAN] + δ )',
  tex:'\\lambda = \\frac{\\nabla_{G_L}[L_{rec}]}{\\nabla_{G_L}[L_{GAN}] + \\delta}',
  d:'적대적 손실의 가중치를 고정값으로 두지 않고, decoder 마지막 층에서의 **두 손실 gradient 노름 비율**로 매 스텝 자동 조정한다. GAN 학습의 고질적인 균형 문제를 하이퍼파라미터 튜닝 없이 다루는 장치.'},
 {expr:'p(s) = Π_i p(s_i | s_1 … s_{i−1})',
  tex:'p(s) = \\prod_i p(s_i \\mid s_1,\\ldots,s_{i-1})',
  d:'2단계. $s_i$ 는 코드북 인덱스. 완전히 표준적인 자기회귀 언어모델링이며, 여기에 조건 $c$ 를 시퀀스 앞에 붙이면 $p(s|c)$ 가 된다.'}
],

numbers:[
 {k:'다운샘플 f', v:'16', d:'$256\\times256$ → $16\\times16$. $f=1$(픽셀 직접)은 비일관, $f=8$은 얼굴 디테일이 흔들림'},
 {k:'시퀀스 길이', v:'256 토큰', d:'12GB VRAM에서 GPT-2 medium을 학습할 수 있는 최대치라는 실용적 제약에서 결정'},
 {k:'Transformer 크기', v:'307M (GPT-2 medium)', d:'아키텍처를 바꾸지 않고 그대로 가져다 씀'},
 {k:'코드북 |Z|', v:'1024 (ImageNet은 16384)', d:'클래스 조건부 ImageNet 모델에서는 어휘를 키워 품질을 올림'},
 {k:'ImageNet FID', v:'17.04', d:'혼합 top-k 샘플링. classifier 기반 rejection sampling(수용률 5%)을 쓰면 **5.20**'},
 {k:'메가픽셀 생성', v:'1280×832', d:'슬라이딩 윈도우로 학습 해상도를 넘겨 생성'}
],

impact:'가장 큰 유산은 **재사용 가능한 이미지 토크나이저**라는 부품이다. 한 번 잘 학습해 두면 그 위에서 어떤 생성 모델을 돌릴지는 자유이며, 실제로 이후 이미지 생성 연구의 상당수가 "VQGAN 오토인코더 + 무언가" 구조를 취한다. 동시에 "Transformer를 이미지에 쓰려면 픽셀을 포기하고 잠재 토큰으로 가야 한다"는 결론을 실증했고, $O(n^2)$ 이라는 비용을 아키텍처 개선이 아니라 **입력 표현 압축**으로 푸는 접근이 표준이 되었다. 자기회귀 모델 기준 클래스 조건부 ImageNet에서 당시 최고 성능을 냈다.',

legacy:[
 '**[Stable Diffusion](#/p/ldm)의 오토인코더가 바로 여기서 나왔다** — 저자 Rombach·Esser·Ommer가 같은 연구실에서 후속으로 낸 논문이며, VQGAN 오토인코더의 잠재 공간에서 diffusion을 돌리는 것이 LDM의 정의다. 다만 LDM은 양자화를 약화시킨 KL 정규화 변형을 주로 쓴다',
 '**토크나이저 부품화** — SDXL, [DiT](#/p/dit) 등 이후 잠재 공간 생성 모델들이 VQGAN 계열 오토인코더를 사실상 표준 전처리기로 채택',
 '**이미지 토큰 자기회귀 계열** — [DALL·E](#/p/dalle), Parti, MaskGIT 등 "이미지를 토큰으로 보고 시퀀스 모델을 돌린다"는 노선이 이 논문 전후로 굳어짐',
 '**적대적 손실의 역할 축소** — GAN이 생성기 본체에서 밀려나고 **토크나이저의 재구성 품질을 올리는 보조 손실**로 자리를 옮긴 전환점'
],

pitfalls:[
 '**VQGAN은 생성 모델의 이름이 아니라 토크나이저의 이름으로 쓰이는 경우가 많다.** 논문의 절반은 2단계 Transformer지만, 실무에서 "VQGAN을 쓴다"고 하면 대개 1단계 오토인코더만 가져다 쓴다는 뜻이다.',
 '**재구성 품질에 상한이 있다.** $f=16$ 으로 압축하면 작은 글자, 사람 얼굴의 미세 구조, 규칙적 격자 패턴 같은 정보는 복원 단계에서 이미 손실된다. 2단계 모델이 아무리 좋아도 **오토인코더가 복원하지 못하는 것은 생성될 수 없다** — 잠재 공간 생성 모델의 화질 천장이 여기서 정해진다.',
 '**래스터 순서 자기회귀는 전역 구조에 약하다.** 왼쪽 위부터 한 토큰씩 채우기 때문에 이미지 전체의 구도를 미리 잡지 못하고, 생성이 순차적이라 느리다. 이 약점이 MaskGIT 류의 병렬 디코딩과 diffusion 기반 접근이 파고든 지점이다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'아래 회색 박스가 1단계(VQGAN): CNN encoder E가 이미지를 특징 격자 ẑ로 만들고, 코드북 Z의 항목 중 가장 가까운 것으로 각 위치를 스냅(quantization)해 z_q를 얻은 뒤 CNN decoder G로 복원한다. 이때 CNN discriminator D가 patch 단위 real/fake를 판정(오른쪽 위)해 복원 품질을 GAN 손실로 끌어올린다. 위쪽이 2단계: z_q의 코드 인덱스들을 좌상단부터 순서대로 나열한 시퀀스(1,42,3,3,94,60,22,…)로 펴서, transformer가 이전 인덱스들로부터 다음 인덱스를 예측하도록 autoregressive하게 학습한다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'We show how to (i) use CNNs to learn a context-rich vocabulary of image constituents, and in turn (ii) utilize transformers to efficiently model their composition within high-resolution images.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2012.09841 — Taming Transformers for High-Resolution Image Synthesis', u:'https://arxiv.org/abs/2012.09841'},
 {t:'프로젝트 페이지 · 사전학습 모델', u:'https://compvis.github.io/taming-transformers/'},
 {t:'CompVis/taming-transformers (공식 구현)', u:'https://github.com/CompVis/taming-transformers'}
]
});
