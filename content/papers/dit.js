WIKI.paper({
slug:'dit',
venue:'ICCV 2023',
authors:'Peebles & Xie (UC Berkeley · NYU)',
arxiv:'2212.09748',

tldr:'diffusion 모델의 표준 백본이던 **U-Net을 통째로 Transformer로 갈아끼운** 논문. 그 결과 diffusion에도 "연산량(Gflops)을 늘리면 FID가 단조롭게 내려간다"는 **스케일링 법칙이 성립한다**는 것이 처음으로 깔끔하게 드러났다.',

context:'[DDPM](#/p/ddpm) 이후 diffusion 모델의 백본은 사실상 예외 없이 [U-Net](#/p/unet)이었다. 다운샘플–업샘플 + skip connection 구조에 self-attention을 몇 층 끼워 넣은 형태로, ADM·[Stable Diffusion](#/p/ldm)까지 모두 이 골격을 물려받았다. 문제는 이 구조가 **경험적으로 조립된 물건**이라는 점이다. 채널 수, 해상도별 attention 위치, residual 블록 개수 같은 하이퍼파라미터가 서로 얽혀 있어서 "얼마나 키우면 얼마나 좋아지는가"를 하나의 축으로 말할 수 없었다. 같은 시기 언어 모델 쪽은 [Transformer](#/p/transformer) 하나로 통일된 뒤 [스케일링 법칙](#/p/scaling-laws)이라는 예측 가능한 곡선을 이미 손에 넣은 상태였다. 이 논문의 질문은 그래서 단순하다 — **diffusion의 백본이 U-Net일 필연적 이유가 있는가?**',

ideas:[
 {h:'백본을 통째로 ViT로 교체한다',
  lead:'U-Net의 다운·업샘플·skip을 없애고 패치 토큰을 처리하는 평범한 Transformer로 바꾼다.',
  d:'[LDM](#/p/ldm)의 잠재 공간(256×256 이미지 → 32×32×4 latent)을 받아, [ViT](#/p/vit)처럼 $p×p$ 패치로 잘라 토큰 시퀀스로 만든 뒤 평범한 Transformer 블록을 쌓는다. U-Net의 다운샘플·업샘플·skip이 전부 사라지고, 해상도가 끝까지 일정한 **isotropic** 구조가 된다. 잃는 것은 CNN의 지역성 귀납 편향이고, 얻는 것은 "층 수·폭·토큰 수"라는 깔끔한 세 개의 스케일 축이다.'},
 {h:'adaLN-Zero: 조건을 정규화 파라미터로 주입한다',
  lead:'timestep과 클래스를 LayerNorm의 scale·shift·게이트로 회귀해 넣는다.',
  d:'timestep $t$ 와 클래스 $c$ 를 어떻게 넣을지 네 가지를 비교했다 — 토큰으로 붙이기(in-context), cross-attention 층 추가, adaLN, adaLN-Zero. 승자는 **adaLN-Zero**로, 조건 임베딩에서 LayerNorm의 scale·shift $(\\gamma,\\beta)$ 와 residual 직전의 게이트 $\\alpha$ 를 회귀해 낸다. 핵심은 $\\alpha$ 를 출력하는 선형층을 **0으로 초기화**해 학습 시작 시점에 모든 DiT 블록이 항등 함수가 되게 만드는 것이다.'},
 {h:'0 초기화가 왜 그렇게 큰 차이를 내는가',
  lead:'게이트를 0에서 시작시키면 모든 블록이 항등 함수로 출발해 깊은 모델도 안정적으로 수렴한다.',
  d:'residual 분기가 0에서 출발하면 초기 네트워크는 입력을 그대로 통과시키는 얕은 모델과 같고, 깊이가 학습 도중 필요에 따라 서서히 "켜진다". 덕분에 warm-up 튜닝 없이도 깊은 모델이 안정적으로 수렴한다. 동일 Gflops에서 in-context 방식 대비 FID가 크게 벌어졌고, cross-attention은 연산량만 **약 15%** 더 쓰면서 더 나쁜 결과를 냈다.'},
 {h:'패치 크기는 파라미터가 아니라 연산량을 바꾸는 손잡이다',
  lead:'패치를 줄이면 파라미터는 그대로인데 토큰 수와 Gflops만 늘어난다.',
  d:'패치 $p$ 를 8→4→2로 줄이면 토큰 수가 4배씩 늘어 Gflops도 4배씩 늘지만, **파라미터 수는 거의 그대로**다. 즉 모델 크기를 고정한 채 연산량만 독립적으로 키울 수 있다. 실험 결과 FID를 결정하는 것은 파라미터 수가 아니라 **Gflops**였고, 이것이 이 논문의 스케일링 주장을 성립시키는 관찰이다.'},
 {h:'diffusion의 스케일링 법칙',
  lead:'경로와 무관하게 Gflops 하나가 FID를 거의 로그-선형으로 예측한다.',
  d:'S/B/L/XL 네 크기 × 패치 8/4/2 조합 12개를 같은 레시피로 학습시키자, Gflops와 FID가 **거의 로그–선형**으로 정렬됐다. 깊이를 늘리든, 폭을 늘리든, 토큰을 늘리든 — 경로와 무관하게 연산량이 성능을 예측한다. U-Net에서는 이런 단일 축 정렬을 보이기 어려웠다.'}
],

diagram:{type:'stack', cap:'DiT 블록 (adaLN-Zero). Transformer 블록에 조건 주입용 γ,β,α 여섯 개(수식은 math 참고)가 붙은 것이 전부다.',
 layers:[
  {t:'패치 토큰화', s:'32×32×4 → p=2 → 256개'},
  {t:'adaLN 변조', s:'MLP(t+c)에서 γ₁,β₁ 회귀', acc:true, note:'← 조건을 정규화로 주입'},
  {t:'Self-Attention', s:'전 토큰 전역 교환'},
  {t:'게이트 residual', s:'α₁ · 0 초기화'},
  {t:'adaLN + FFN', s:'d → 4d → d'},
  {t:'게이트 residual', s:'α₂ · 0 초기화'},
  {t:'출력 헤드', s:'노이즈 ε · 분산 Σ 예측'}
 ]},

figures:[
 {f:'fig3-dit-architecture.png',
  cap:'왼쪽: 노이즈 낀 latent가 patchify를 거쳐 N개의 DiT Block을 통과하고, 다시 linear+reshape로 노이즈·분산 예측으로 펼쳐진다. 가운데가 실제로 채택된 adaLN-Zero 블록 — self-attention과 MLP 앞에 각각 LayerNorm의 scale/shift(γ,β)가 조건에서 회귀되어 붙고, 두 residual 분기 모두 α로 게이팅된다. 오른쪽 두 변형(cross-attention, in-context)은 논문이 비교만 하고 채택하지 않은 대안.',
  src:'원문 Figure 3, p.3'}
],

math:[
 {expr:'h ← h + α · Block( γ ⊙ LayerNorm(h) + β ),   (γ, β, α) = MLP(emb(t) + emb(c))',
  tex:'h \\leftarrow h + \\alpha \\cdot \\text{Block}\\big(\\gamma \\odot \\text{LayerNorm}(h) + \\beta\\big),\\quad (\\gamma,\\beta,\\alpha) = \\text{MLP}(\\text{emb}(t)+\\text{emb}(c))',
  d:'조건은 attention에 참여하지 않고 **정규화 통계와 게이트로만** 들어간다. $\\alpha$ 를 내는 층이 0 초기화라 학습 초기 $h \\leftarrow h$ 가 되고, 이 블록은 그때부터 필요한 만큼만 기여를 키운다.'},
 {expr:'토큰 수 T = (I / p)²,   Gflops ∝ T   (파라미터 수는 p와 거의 무관)',
  tex:'T = \\left(\\frac{I}{p}\\right)^2,\\qquad \\text{Gflops} \\propto T',
  d:'$I=32$ 인 latent에서 $p=8,4,2$ 는 각각 16·64·256 토큰이 된다. 파라미터를 고정한 채 연산량만 16배 차이 나게 만들 수 있어, "크기 vs 연산량"을 분리해 측정할 수 있다.'}
],

quotes:[
 {t:'We train latent diffusion models of images, replacing the commonly-used U-Net backbone with a transformer that operates on latent patches.',
  src:'Abstract, p.1'}
],

numbers:[
 {k:'FID · ImageNet 256²', v:'2.27', d:'DiT-XL/2, cfg=1.5. 직전 SOTA인 LDM-4-G의 **3.60**을 앞섬'},
 {k:'FID · ImageNet 512²', v:'3.04', d:'ADM-G/ADM-U의 3.85 대비'},
 {k:'DiT-XL/2 규모', v:'675M 파라미터 · 118.6 Gflops', d:'28층 · hidden 1152 · head 16'},
 {k:'연산 효율', v:'118.6 vs ADM 1120 Gflops', d:'ADM 대비 **약 1/10** 연산으로 더 좋은 FID'},
 {k:'조건 주입 방식 비교', v:'adaLN-Zero 118.6 / cross-attn 137.6 Gflops', d:'cross-attention은 15% 더 비싸면서 성능은 뒤짐'},
 {k:'학습량', v:'7M 스텝 (256²)', d:'512² 모델은 3M 스텝'}
],

impact:'"diffusion = U-Net"이라는 암묵적 전제를 깼다. 백본이 Transformer가 되면서 LLM 쪽에서 쌓인 인프라 — 텐서/시퀀스 병렬화, [FlashAttention](#/p/flashattention), 스케일링 곡선으로 최종 성능을 미리 추정하는 관행 — 이 이미지·영상 생성에 그대로 이식됐다. 무엇보다 **"더 키우면 더 좋아진다"가 diffusion에서도 예측 가능한 곡선이라는 것**을 보인 점이 컸다. 이후 대형 이미지·영상 생성 모델의 백본은 사실상 전부 DiT 계열(또는 그 변형인 MM-DiT)로 수렴했다.',

legacy:[
 '**대형 생성 모델의 기본 백본** — Stable Diffusion 3, PixArt-α, Sora 계열 영상 모델이 모두 DiT 골격을 채택하며 [LDM](#/p/ldm)의 U-Net을 대체',
 '**adaLN-Zero의 재사용** — 0 초기화 게이트로 residual 분기를 열어 주는 기법이 조건부 생성 전반의 표준 트릭이 됨 (아이디어 자체는 ADM의 zero-init과 [LoRA](#/p/lora)의 B=0 초기화와 같은 계열)',
 '**목표(objective)와 백본의 분리** — 백본이 Transformer로 통일되자 학습 목표를 [Flow Matching](#/p/flow-matching)으로 갈아끼우는 조합이 자연스러워졌고, 실제로 최신 모델 다수가 "DiT 백본 + flow matching 목표"다',
 '**멀티모달 확장** — 텍스트 토큰과 이미지 토큰을 같은 시퀀스에서 처리하는 MM-DiT로 이어지며 [CLIP](#/p/clip) 임베딩 주입 방식까지 재설계됨'
],

pitfalls:[
 '**"Transformer가 U-Net보다 무조건 낫다"는 결론이 아니다.** 이 논문의 비교는 latent 공간(LDM)·클래스 조건·ImageNet이라는 조건에서의 결과다. 픽셀 공간에서 소규모 데이터로 학습하면 CNN의 지역성 편향이 여전히 유리한 경우가 많다.',
 '**패치를 줄이면 공짜로 좋아지는 것이 아니다.** $p=2$ 는 $p=8$ 대비 토큰이 16배라 학습·추론 비용이 그만큼 늘고, attention은 토큰 수에 $O(T^2)$ 이다. 고해상도에서 이 항이 곧바로 지배적 비용이 된다.',
 '**FID 2.27은 classifier-free guidance를 켠 값이다.** guidance 없이는 수치가 크게 다르고, [CFG](#/p/cfg) 스케일에 따라 FID와 다양성이 반대로 움직이므로 다른 논문의 숫자와 비교할 때는 guidance 설정을 반드시 맞춰야 한다.'
],

links:[
 {t:'arXiv 2212.09748 — Scalable Diffusion Models with Transformers', u:'https://arxiv.org/abs/2212.09748'},
 {t:'프로젝트 페이지 · 코드 (facebookresearch/DiT)', u:'https://www.wpeebles.com/DiT'}
]
});
