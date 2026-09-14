WIKI.concept({
slug:'dit-c',

tldr:'확산모델의 노이즈 예측 네트워크를 U-Net 대신 Transformer로 구현한 아키텍처로, 이미지를 패치 토큰으로 만들고 타임스텝·조건을 adaLN으로 주입한다.',

why:'U-Net 기반 확산모델은 CNN처럼 깊이·채널을 늘리는 데 스케일링 법칙이 잘 안 맞았는데, DiT는 이미지 생성에도 [Transformer](#/p/transformer)의 검증된 스케일링 법칙([scaling laws](#/p/scaling-laws) 계열이 언어모델에서 보여준 것과 같은 패턴)을 그대로 적용할 수 있다는 것을 보였다. Sora·[SD3](#/p/sd3) 같은 최신 생성 모델이 왜 U-Net을 버리고 Transformer로 갈아탔는지가 이 한 문장에서 나온다. 모델·데이터를 키우면 성능이 예측 가능하게 좋아진다는 확신이 있어야 대규모 투자를 결정할 수 있으므로, 이 결과는 업계가 U-Net 대신 DiT를 표준으로 채택하게 만든 실질적 근거였다.'
,

sections:[
 {h:'U-Net에서 전환', d:'DDPM류 확산모델은 노이즈가 섞인 이미지에서 노이즈를 예측하는 네트워크로 오랫동안 U-Net(다운샘플링-업샘플링에 skip connection을 더한 CNN 구조)을 썼다. [DiT(Diffusion Transformer)](#/p/dit)는 이 노이즈 예측 네트워크 자체를 [ViT](#/c/vit-c)와 거의 같은 구조로 바꾼다 — 잠재 공간(latent space)의 노이즈 낀 이미지를 패치로 잘라 토큰 시퀀스로 만들고, 표준 [Transformer 블록](#/c/transformer-block)들을 통과시켜 다시 노이즈를 예측한다. U-Net의 골격(계층적 다운/업샘플링)이 통째로 사라지고 균일한 폭의 Transformer 층 반복으로 바뀐 것이 핵심 변화다.'},
 {h:'패치화', d:'DiT는 보통 [LDM](#/p/ldm)처럼 픽셀 공간이 아니라 VAE로 압축된 잠재 공간에서 동작한다. 이 잠재 표현(예: $32\\times32\\times4$)을 ViT와 동일한 방식으로 $p\\times p$ 패치로 잘라 선형 투영하면 토큰 시퀀스가 된다. 패치 크기 $p$가 작을수록 토큰 수가 늘어 계산량은 커지지만 디테일 표현력이 좋아진다 — DiT 논문은 patch size를 모델 크기와 별개의 축으로 스케일링해 "Gflops당 성능"이 patch size에 따라 어떻게 움직이는지 직접 측정했다.'},
 {h:'조건 주입: adaLN', d:'DiT는 타임스텝(현재 얼마나 노이즈가 제거됐는지)과 클래스 라벨 등 조건 정보를 [cross-attention](#/c/cross-attention)이 아니라 **adaLN(adaptive LayerNorm)**으로 주입하는 방식을 기본으로 쓴다 — 조건 벡터를 작은 MLP에 통과시켜 각 층의 LayerNorm이 쓸 scale($\\gamma$)과 shift($\\beta$)를 직접 예측하게 한다(추가로 residual 경로에 곱할 게이트 값까지 예측하는 adaLN-Zero 변형도 쓴다). 조건이 텍스트처럼 **시퀀스**(토큰마다 다른 값)라면 cross-attention이 자연스럽고, 조건이 타임스텝·클래스처럼 **벡터 하나**로 요약되는 정보라면 adaLN이 더 가볍고 효과적이다 — DiT 논문은 실제로 여러 조건 주입 방식(in-context 토큰 추가, cross-attention, adaLN, adaLN-Zero)을 비교해 adaLN-Zero가 가장 효율적이었다고 보고했다.'},
 {h:'스케일링이 잘 된다', d:'DiT 논문의 핵심 실증은 모델 크기(층 수·폭)와 패치 크기를 조절해 Gflops를 바꿔가며 이미지 품질(FID)을 측정했을 때, Gflops가 커질수록 FID가 꾸준히 좋아지는 명확한 스케일링 곡선이 나온다는 것이었다 — 언어모델의 스케일링 법칙과 같은 모양의 관계가 이미지 생성에서도 나타난다는 뜻이다. 이 결과가 이후 Sora 계열의 비디오 생성 Transformer, [SD3](#/p/sd3)의 MM-DiT(텍스트·이미지 두 모달리티를 함께 처리하는 DiT 변형) 같은 후속 작업이 U-Net을 버리고 Transformer 기반으로 옮겨가게 만든 근거가 됐다.'}
],

math:[
 {tex:'\\text{adaLN}(x;\\,c)=\\gamma(c)\\odot \\dfrac{x-\\mu}{\\sigma}+\\beta(c)',
  expr:'adaptive LayerNorm', d:'일반 LayerNorm의 $\\gamma,\\beta$가 학습된 고정 파라미터인 것과 달리, adaLN은 조건 벡터 $c$(타임스텝 임베딩 + 클래스 임베딩 등)를 작은 MLP에 통과시켜 층마다 다른 $\\gamma(c),\\beta(c)$를 그때그때 예측한다 — 정규화 자체가 조건에 따라 적응적으로 바뀐다.'}
],

code:{lang:'python', d:'DiT 한 블록의 forward — adaLN-Zero가 조건 c로 scale·shift·게이트를 예측한다.',
 src:`def dit_block(x, c, mlp_adaln, attn, ffn):
    g1, b1, s1, g2, b2, s2 = mlp_adaln(c).chunk(6, dim=-1)
    h = attn(layernorm(x) * (1+s1) + b1)
    x = x + g1 * h                       # 게이트로 잔차 세기 조절
    h = ffn(layernorm(x) * (1+s2) + b2)
    x = x + g2 * h
    return x`},

diagram:{type:'flow', cap:'DiT 한 블록: 패치 토큰에 adaLN으로 조건(타임스텝·클래스) 주입.',
 nodes:[
  {t:'잠재 노이즈', s:'패치화'},
  {t:'adaLN', s:'t,y 로 γ,β 예측'},
  {t:'attn + FFN'},
  {t:'게이트 잔차', s:'adaLN-Zero'},
  {t:'노이즈 예측'}
 ]},

confuse:[
 {a:'DiT', b:'U-Net 확산모델', d:'U-Net은 계층적 다운/업샘플링과 skip connection을 가진 CNN 구조로 지역적 귀납 편향이 강하다. DiT는 균일한 폭의 Transformer 블록을 반복해 전역 self-attention으로 정보를 섞으며, 패치화 덕에 [ViT](#/c/vit-c)와 같은 방식으로 스케일링한다.'},
 {a:'adaLN(-Zero)', b:'cross-attention', d:'둘 다 조건 주입 방법이지만 adaLN은 조건이 벡터 하나(타임스텝·클래스)일 때 정규화의 scale·shift를 조절하는 가벼운 방식이고, cross-attention은 조건이 텍스트처럼 토큰 시퀀스일 때 위치별로 다른 정보를 끌어오는 방식이다 — 텍스트 조건까지 넣는 SD3의 MM-DiT는 둘을 함께 쓴다.'},
 {a:'DiT의 패치화', b:'ViT의 패치화', d:'연산 자체(이미지/잠재를 패치로 잘라 선형 투영)는 동일하다. 차이는 목적으로, ViT는 분류를 위한 표현을 뽑고 DiT는 매 확산 스텝마다 노이즈를 예측해 다시 이미지(잠재)를 복원하는 데 쓴다.'}
],

pitfalls:[
 '"DiT는 그냥 U-Net을 ViT로 바꾼 것"이라고만 생각하면 adaLN 같은 조건 주입 방식의 선택이 왜 중요한지를 놓친다 — 조건을 어디에 어떻게 넣는지가 DiT 설계의 핵심 실험 축이었다.',
 'DiT의 스케일링 결과를 "Transformer는 다 잘 스케일링된다"는 일반론으로 넘기기 쉽지만, 논문은 patch size·모델 크기를 각각 조절하며 Gflops 대비 FID를 직접 측정해 얻은 실증 결과라는 점이 중요하다.',
 'DiT가 항상 픽셀 공간에서 동작한다고 오해하기 쉽다. 실제 DiT는 [LDM](#/p/ldm)처럼 VAE로 압축한 잠재 공간에서 동작하는 것이 기본 설정이다.',
 'adaLN-Zero의 "Zero"를 단순한 이름으로 넘기기 쉽지만, 실제로는 게이트 값을 학습 초기에 0으로 초기화해 각 블록이 처음에는 항등함수(identity)에 가깝게 시작하도록 만드는 초기화 전략을 가리킨다 — 깊은 네트워크의 학습 안정성에 실질적으로 기여한다.'
],

papers:['dit','sd3'],
terms:['vit-c','cross-attention','transformer-block']
});
