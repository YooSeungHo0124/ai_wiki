WIKI.paper({
slug:'vqvae2',
venue:'NeurIPS 2019',
authors:'Razavi, van den Oord, Vinyals (DeepMind)',
arxiv:'1906.00446',

tldr:'[VQ-VAE](#/p/vqvae)의 이산 잠재공간을 **계층적으로(top·bottom)** 쌓아 256×256, 심지어 1024×1024 고해상도 이미지를 생성한 논문. 전역 구조는 상위 레벨이, 국소 텍스처는 하위 레벨이 나눠 담당하게 하고, 그 위에 자기회귀 사전분포를 학습해 샘플링한다.',

context:'[VQ-VAE](#/p/vqvae)는 이미지를 연속 잠재가 아닌 **이산 코드북 인덱스**로 압축해, VAE의 posterior collapse 문제를 피하면서도 사후에 강력한 자기회귀 모델로 사전분포를 학습할 수 있게 했다. 하지만 원래 VQ-VAE는 단일 해상도의 잠재 맵 하나만 썼기 때문에, 고해상도 이미지를 표현하려면 그 잠재 맵을 매우 크게 키워야 했고, 그러면 자기회귀 사전분포가 학습해야 할 시퀀스가 너무 길어져 전역 일관성(구도·형태)을 놓치기 쉬웠다. 동시에 [BigGAN](#/p/biggan) 등 GAN 계열은 이미 ImageNet에서 높은 IS/FID를 냈지만, GAN 특유의 모드 붕괴로 **다양성**이 떨어진다는 지적이 있었다.',

ideas:[
 {h:'계층적 VQ-VAE: 전역과 국소를 잠재 레벨로 분리',
  lead:'256×256 이미지를 64×64(bottom)와 32×32(top) 두 이산 잠재 맵으로 나눠 인코딩한다.',
  d:'인코더가 이미지를 4배 다운샘플해 64×64 bottom 잠재를 만들고, 다시 2배 다운샘플해 32×32 top 잠재를 만든다. top 잠재는 물체의 형태·구도 같은 전역 정보를, bottom 잠재는 top에 조건화된 채로 질감 같은 국소 정보를 담당한다. bottom을 top에 조건화하지 않으면 top 혼자 모든 디테일을 인코딩해야 하므로, 두 레벨이 서로 다른 정보를 나눠 갖도록 강제한 것이 핵심이다.'},
 {h:'2단계 파이프라인: 재구성 학습 후 사전분포 학습',
  lead:'1단계로 VQ-VAE를 재구성 손실로 학습하고, 2단계로 그 잠재 코드 위에 자기회귀 사전분포를 별도로 학습한다.',
  d:'1단계에서 인코더·디코더·코드북을 오토인코더처럼 학습해 각 레벨의 이산 코드를 얻는다. 2단계에서는 top 잠재 위에 PixelCNN 계열(자기회귀) 사전분포를, bottom 잠재 위에는 top 코드로 조건화된 별도의 사전분포를 학습한다. 학습된 사후분포에 가까운 사전분포를 만들수록 디코딩된 샘플이 더 사실적이라는 것이 논문의 논리다.'},
 {h:'PixelCNN + self-attention(PixelSnail)으로 긴 의존성을 다룬다',
  lead:'top 사전분포에 causal self-attention을 섞은 PixelSnail을 써서 32×32 시퀀스의 장거리 의존성을 포착한다.',
  d:'top 레벨 사전분포는 32×32=1024 토큰 시퀀스에 5개 층마다 causal multi-head self-attention을 끼워 넣은 게이트 합성곱(PixelSnail 구조)으로 학습한다. bottom 레벨은 시퀀스가 64×64=4096으로 훨씬 길어 메모리 제약상 attention 없이 top 레벨을 강한 조건(conditioning stack)으로 주는 방식을 택했다. 참고로 이 논문이 실제로 쓴 것은 self-attention을 더한 PixelCNN(PixelSnail)이며, `Sparse Transformer` 자체를 사전분포로 쓴 것은 아니다 — 긴 이산 시퀀스에 self-attention을 결합해 사전분포를 강화한다는 문제의식은 [Sparse Transformer](#/p/sparse-transformers)와 같은 계열이다.'},
 {h:'생성 시 다양성 대 품질 트레이드오프도 사후 조절',
  lead:'분류기 기반 reject sampling(critic)으로 GAN의 truncation trick과 비슷한 품질-다양성 조절을 흉내낸다.',
  d:'학습된 분류기로 생성 샘플을 걸러내는 rejection sampling을 적용해 품질을 높일 수 있음을 보였다. Precision-Recall 지표에서 VQ-VAE-2는 BigGAN-deep보다 precision(정밀도)은 약간 낮지만 recall(다양성)은 더 높게 나타나, GAN 대비 "다양성은 강하지만 개별 샘플 선명도는 약간 못 미친다"는 특성을 뒷받침한다.'}
],

diagram:{type:'stack', cap:'인코딩(아래→위)과 디코딩이 대칭인 2-레벨 계층. 사전분포 학습은 별도 2단계에서 이 이산 코드 위에 이뤄진다.',
 layers:[
  {t:'입력 이미지', s:'256×256'},
  {t:'Encoder ×4', s:'→ 64×64'},
  {t:'Bottom 양자화', s:'코드북 인덱스', note:'국소 텍스처'},
  {t:'Encoder ×2', s:'→ 32×32', acc:true},
  {t:'Top 양자화', s:'코드북 인덱스', note:'전역 구조'},
  {t:'Decoder', s:'top+bottom → 이미지'}
 ]},

math:[
 {expr:'L = ‖x − D(e)‖² + ‖sg[E(x)] − e‖² + β‖E(x) − sg[e]‖²',
  tex:'L=\\|x-D(e)\\|^2+\\|\\text{sg}[E(x)]-e\\|^2+\\beta\\|E(x)-\\text{sg}[e]\\|^2',
  d:'[VQ-VAE](#/p/vqvae)와 동일한 목적함수를 각 레벨에 적용한다. 첫 항은 재구성 오차, 둘째 항은 코드북을 인코더 출력 쪽으로 당기는 codebook loss(EMA로 대체 가능), 셋째 항은 인코더가 코드북에서 너무 자주 벗어나지 않도록 하는 commitment loss다. $\\text{sg}$ 는 stop-gradient.'}
],

numbers:[
 {k:'잠재 해상도 (256px 입력)', v:'top 32×32 · bottom 64×64', d:'각각 원본 대비 약 3072배·192배 압축(3-레벨 실험 기준)'},
 {k:'Top/Bottom prior NLL', v:'3.40 / 3.45 (train)', d:'validation과 거의 동일(3.41/3.45) — 과적합 없음'},
 {k:'VQ 디코더 MSE', v:'0.0047 (train) / 0.0050 (val)', d:'재구성 오차, train·val 차이 미미'},
 {k:'CAS Top-1 (real data)', v:'73.09%', d:'실제 이미지로 학습한 분류기 상한'},
 {k:'CAS Top-1 (VQ-VAE 샘플)', v:'54.83% → 58.74%', d:'재구성 이미지로 평가하면 도메인 갭이 줄어 상승'},
 {k:'CAS Top-1 (BigGAN-deep)', v:'42.65%', d:'같은 지표에서 VQ-VAE-2가 더 높음 — recall(다양성) 우위를 시사'}
],

impact:'단일 해상도 이산 잠재의 한계를 계층 구조로 풀어, 자기회귀 사전분포 기반 생성모델을 256px를 넘어 1024px 초상화까지 확장했다. GAN이 지배하던 고해상도 이미지 생성 영역에서 우도 기반·비적대적 학습으로도 경쟁력 있는 품질과 더 나은 다양성(recall)을 낼 수 있음을 보여, 이산 잠재 계보([VQ-VAE](#/p/vqvae) → VQ-VAE-2 → [VQGAN](#/p/vqgan) → [DALL·E](#/p/dalle))가 이어지는 발판이 되었다. 전역/국소를 잠재 레벨로 분리한다는 아이디어는 이후 계층적 생성모델 설계의 공통 어휘가 되었다.',

legacy:[
 '**적대적 학습과의 결합** — [VQGAN](#/p/vqgan)이 같은 이산 코드북 아이디어에 GAN 판별기를 더해 재구성 품질과 사전분포 학습 효율을 동시에 개선',
 '**텍스트-이미지 생성으로 확장** — [DALL·E](#/p/dalle)가 이산 이미지 토큰이라는 이 계보의 핵심 개념을 그대로 가져와 텍스트 조건부 생성에 적용',
 '**음악·오디오로 이식** — [Jukebox](#/p/jukebox)가 계층적 VQ 코드 + [Sparse Transformer](#/p/sparse-transformers) 사전분포 조합을 오디오 도메인에 적용, VQ-VAE-2가 남긴 "계층 + 강력한 자기회귀 사전분포" 레시피를 그대로 계승',
 '**품질 지표 논쟁에 기여** — FID/IS만으로는 과적합·다양성을 못 잡아낸다는 문제의식을 NLL·CAS·Precision-Recall 등 복수 지표 비교로 구체화'
],

pitfalls:[
 '**"VQ-VAE-2가 Sparse Transformer를 사전분포로 쓴다"는 것은 부정확하다.** 실제로는 self-attention을 결합한 PixelCNN 계열(PixelSnail)을 썼다. Sparse Transformer 자체를 사전분포로 쓰는 것은 이 계보의 후속 연구([Jukebox](#/p/jukebox) 등)에서다.',
 '**FID/IS 개선을 그대로 "GAN보다 우월"로 읽으면 안 된다.** 논문 스스로 이 지표들이 과적합(단순 암기)에도 만점을 줄 수 있다고 지적하며, 그래서 NLL·CAS 같은 별도 지표를 병행 보고한다.',
 '**2단계 파이프라인이라 end-to-end 학습이 아니다.** VQ-VAE와 자기회귀 사전분포를 따로 학습하므로, 사전분포가 실제 사후분포에 잘 맞지 않으면 재구성은 좋아도 생성 샘플 품질이 떨어질 수 있다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'(a) 학습 단계 — 인코더가 이미지를 bottom(64×64)·top(32×32) 두 잠재로 압축하고 VQ로 양자화한 뒤 디코더가 복원한다. (b) 생성 단계 — top 사전분포가 클래스 라벨로 조건화돼 top 코드를 먼저 샘플링하고, bottom 사전분포가 top 코드로 조건화돼 국소 디테일을 채운 뒤 디코더가 한 번의 forward로 픽셀을 만든다.',
  src:'원문 Figure 2, p.4'},
 {f:'fig3-hierarchical-recon.png',
  cap:'왼쪽부터 $h_{top}$ 만 쓴 재구성(흐릿한 저주파 형태만), $h_{top}+h_{middle}$, 세 레벨 전부 사용, 마지막이 원본. 레벨을 더할수록 고주파 디테일(머리카락 질감, 피부 텍스처)이 살아난다 — 계층 분리가 실제로 각기 다른 정보를 담고 있다는 근거.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'we use a hierarchy of vector quantized codes to model large images. The main motivation behind this is to model local information, such as texture, separately from global information such as shape and geometry of objects.',
  src:'Section 3.1, p.4'}
],

links:[
 {t:'arXiv 1906.00446 — Generating Diverse High-Fidelity Images with VQ-VAE-2', u:'https://arxiv.org/abs/1906.00446'},
 {t:'VQ-VAE (원조) 블로그 (DeepMind)', u:'https://deepmind.google/discover/blog/generating-diverse-high-fidelity-images-with-vq-vae-2/'}
]
});
