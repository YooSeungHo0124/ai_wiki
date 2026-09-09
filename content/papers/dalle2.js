WIKI.paper({
slug:'dalle2',
venue:'arXiv 2022 (OpenAI, "unCLIP")',
authors:'Ramesh, Dhariwal, Nichol et al. (OpenAI)',
arxiv:'2204.06125',

tldr:'CLIP의 텍스트·이미지 결합 잠재공간을 뒤집어(un-CLIP) 쓰는 2단계 생성기 — 캡션에서 CLIP 이미지 임베딩을 만드는 **prior**와, 그 임베딩에서 실제 이미지를 그리는 **diffusion decoder**로 나눈다. 임베딩을 거치기 때문에 같은 의미를 유지한 채 스타일·디테일만 다른 변주(variation) 이미지가 자연스럽게 나온다.',

context:'[GLIDE](#/p/glide)는 텍스트를 곧바로 diffusion decoder에 넣어 사실적인 이미지를 만들었지만, 텍스트 인코더의 출력이 이미지의 "무엇을 그릴지"를 압축한 별도 표현은 아니었다. 반면 [CLIP](#/p/clip)은 이미 수억 장의 이미지-캡션 쌍으로 텍스트와 이미지를 **같은 벡터 공간**에 정렬해 두었고, 그 공간은 의미(semantics)와 스타일을 동시에 포착한다고 알려져 있었다. 문제는 CLIP은 인코더일 뿐 생성기가 아니라는 것 — 이미지를 벡터로 압축할 수는 있어도 벡터에서 이미지를 복원하는 방법이 없었다. 이 논문의 질문은 — **CLIP의 이미지 임베딩을 역으로 디코딩할 수 있다면, 그 잠재공간을 생성의 인터페이스로 쓸 수 있지 않을까?**',

ideas:[
 {h:'2단계 분리: prior + decoder',
  lead:'캡션→CLIP 이미지 임베딩(prior)과 임베딩→이미지(decoder)를 독립된 두 모듈로 학습한다.',
  d:'생성 확률을 $P(x|y) = P(x|z_i,y)\\,P(z_i|y)$ 로 인수분해한다. prior가 캡션 $y$ 에서 CLIP 이미지 임베딩 $z_i$ 를 만들고, decoder가 그 $z_i$ (와 선택적으로 $y$)를 조건으로 이미지 $x$ 를 생성한다. CLIP 자체는 두 모듈을 학습하는 동안 **고정**한다.'},
 {h:'decoder는 GLIDE를 그대로 재사용',
  lead:'3.5B GLIDE 모델의 텍스트 조건 자리에 CLIP 이미지 임베딩을 추가로 얹는다.',
  d:'[GLIDE](#/p/glide)와 같은 아키텍처·diffusion 하이퍼파라미터를 쓰되, CLIP 이미지 임베딩을 토큰으로 투영해 GLIDE 텍스트 인코더 출력 시퀀스에 이어 붙인다. 원래의 텍스트 조건 경로도 그대로 남겨 둔다. 학습 중 CLIP 임베딩을 확률적으로 0으로 바꿔 **classifier-free guidance([CFG](#/p/cfg))**를 그대로 적용한다.'},
 {h:'prior 두 후보: 자기회귀 vs diffusion',
  lead:'이미지 임베딩을 이산 토큰으로 예측하는 AR과, 연속 벡터를 직접 학습하는 diffusion을 비교한다.',
  d:'AR prior는 $z_i$ 를 PCA로 차원을 줄인 뒤 이산 코드로 양자화해 causal Transformer로 예측한다. diffusion prior는 노이즈 낀 $z_i^{(t)}$ 에서 원래 벡터를 직접 회귀하는 MSE 손실 $L_{prior}=\\mathbb{E}[\\|f_\\theta(z_i^{(t)},t,y)-z_i\\|^2]$ 로 학습한다. 두 방식 모두 **비슷한 성능**을 내지만 diffusion prior가 학습 연산량 대비 더 효율적이었다.'},
 {h:'CLIP 잠재공간을 거치므로 의미 보존 변주가 공짜로 나온다',
  lead:'이미지를 인코딩→디코딩하면 같은 뜻·스타일을 유지한 채 디테일만 다른 이미지가 나온다.',
  d:'decoder는 $z_i$ 로부터 이미지를 근사 역변환(GAN inversion과 유사한 역할)하는데, $z_i$ 는 이미지 전체가 아니라 CLIP이 포착한 의미·스타일 정보만 담고 있다. 그래서 같은 $z_i$ 에서 diffusion noise만 바꿔 여러 번 디코딩하면 "같은 그림의 다른 버전"이 나오고, 두 이미지의 $z_i$ 를 보간(interpolate)하면 개념 사이를 잇는 이미지가, 텍스트 방향 벡터를 더하면 **언어로 이미지를 zero-shot 편집**하는 것도 가능해진다.'}
],

diagram:{type:'flow', cap:'unCLIP 파이프라인. CLIP은 학습 중 고정되고, prior와 decoder만 새로 학습한다.',
 nodes:[
  {t:'캡션', s:'텍스트'},
  {t:'CLIP 텍스트 임베딩', s:'zt'},
  {t:'Prior', s:'AR 또는 diffusion', acc:true},
  {t:'CLIP 이미지 임베딩', s:'zi (예측)'},
  {t:'Decoder', s:'diffusion · GLIDE 3.5B'},
  {t:'이미지', s:'64→256→1024'}
 ]},

math:[
 {expr:'P(x|y) = P(x, zi|y) = P(x|zi, y) · P(zi|y)',
  tex:'P(x|y) = P(x,z_i|y) = P(x|z_i,y)\\cdot P(z_i|y)',
  d:'$z_i$ 가 이미지 $x$ 의 결정론적 함수(=CLIP 인코더 출력)라는 사실과 연쇄법칙만으로 유도된다. 오른쪽 두 항이 각각 decoder와 prior이며, 이 분해가 unCLIP 전체 설계의 근거다.'},
 {expr:'L_prior = E[ || fθ(zi^(t), t, y) − zi ||² ]',
  tex:'L_{prior} = \\mathbb{E}_{t\\sim[1,T],\\,z_i^{(t)}\\sim q_t}\\big[\\lVert f_\\theta(z_i^{(t)}, t, y) - z_i \\rVert^2\\big]',
  d:'diffusion prior의 학습 목표. 노이즈 예측(ε-prediction) 대신 **노이즈 없는 $z_i$ 자체를 직접 회귀**하는 편이 더 좋은 결과를 냈다고 보고한다. 샘플링 시에는 $z_i$ 를 두 번 뽑아 $z_i \\cdot z_t$ 가 더 큰 쪽을 채택해 품질을 더 높인다.'}
],

numbers:[
 {k:'decoder 크기', v:'3.5B (GLIDE 재사용)', d:'같은 아키텍처·diffusion 하이퍼파라미터, 250 스텝 샘플링'},
 {k:'prior Transformer', v:'width 2048 · 24 블록', d:'AR·diffusion prior 공통 규모'},
 {k:'해상도 파이프라인', v:'64 → 256 → 1024', d:'업샘플러 2단, attention 미사용'},
 {k:'unCLIP vs GLIDE · 다양성', v:'70.5%', d:'diffusion prior 사용 시 사람 평가에서 다양성 선호율(95% CI)'},
 {k:'unCLIP vs GLIDE · 사실성', v:'48.9%', d:'같은 비교, photorealism은 GLIDE와 근소한 차이로 열세'},
 {k:'조건 신호별 FID', v:'9.16 / 7.99 / 16.55', d:'텍스트만 / prior 사용(unCLIP) / CLIP 텍스트 임베딩을 그대로 넣은 경우 — prior가 있을 때가 최저'}
],

impact:'"텍스트 → 임베딩 → 이미지"라는 계층적 구조를 표준 패턴으로 만들었다. CLIP 잠재공간을 생성의 인터페이스로 쓰면서, 같은 프롬프트에서 매번 다른 그러나 의미는 일관된 이미지를 뽑는 **variation** 기능과 이미지 임베딩 보간·언어 방향 편집 같은 조작이 파인튜닝 없이 가능해졌다. 반면 사람 평가에서 순수 사실성은 [GLIDE](#/p/glide)보다 근소하게 낮아, "임베딩을 거치는 대가"도 함께 드러난 논문이다.',

legacy:[
 '**계층적 생성의 원형** — 텍스트를 바로 픽셀로 매핑하지 않고 중간 임베딩을 거치는 구조가 이후 여러 text-to-image 파이프라인의 참고 설계가 됨',
 '**CFG 확산의 연속선** — [GLIDE](#/p/glide)가 검증한 classifier-free guidance를 decoder에 그대로 채택해 정착시킴',
 '**공개 재구현: Karlo, Kandinsky** 등 CLIP 임베딩 기반 prior+decoder 구조를 오픈소스로 재현한 후속 프로젝트들이 등장',
 '**한계가 다음 세대의 과제로** — attribute binding 실패와 diffusion prior의 비효율은 [Imagen](#/p/imagen)이 CLIP 임베딩 대신 대형 언어모델(T5) 텍스트 임베딩을 직접 조건으로 쓰는 선택으로 이어짐'
],

pitfalls:[
 '**이름과 달리 [DALL·E](#/p/dalle)와 아키텍처가 전혀 다르다.** DALL·E는 텍스트+이미지 토큰을 하나의 자기회귀 Transformer로 모델링하는 VQ-VAE 기반 구조였고, DALL·E 2(unCLIP)는 CLIP 임베딩을 매개로 한 prior+diffusion decoder 2단계 구조다. 이름의 연속성이 구조의 연속성을 뜻하지 않는다.',
 '**속성 결합(attribute binding)에 약하다.** "빨간 정육면체 위에 파란 정육면체" 같이 두 물체에 서로 다른 속성을 정확히 매칭시켜야 하는 프롬프트에서 GLIDE보다 더 자주 실패한다 — CLIP 임베딩 자체가 속성-객체 결합을 명시적으로 표현하지 않기 때문이라고 저자들은 추정한다.',
 '텍스트 렌더링(예: "DEEP LEARNING"이라는 간판)에도 취약하다. **CLIP 임베딩이 철자 정보를 정밀하게 담지 못하는 것**이 원인으로 지목된다.'
],

figures:[
 {f:'fig2-unclip-arch.png',
  cap:'위쪽 점선 위는 이미 학습된 CLIP(고정). 아래는 이 논문이 새로 학습하는 부분 — 캡션이 prior(자기회귀 또는 diffusion)를 거쳐 CLIP 이미지 임베딩을 예측하고, 그 임베딩이 decoder에 들어가 최종 이미지를 만든다.',
  src:'원문 Figure 2, p.3'},
 {f:'fig3-variations.png',
  cap:'맨 위가 원본(달리 그림), 아래 격자가 같은 이미지를 CLIP으로 인코딩한 뒤 decoder로 여러 번 디코딩한 결과. 시계·나뭇가지 같은 의미와 초현실적 화풍은 유지된 채 구도·디테일만 매번 달라진다.',
  src:'원문 Figure 3, p.5'}
],

quotes:[
 {t:'We propose a two-stage model: a prior that generates a CLIP image embedding given a text caption, and a decoder that generates an image conditioned on the image embedding.',
  src:'Abstract, p.1'},
 {t:'unCLIP is worse at binding attributes to objects than a corresponding GLIDE model.',
  src:'Section 7, p.16'}
],

links:[
 {t:'arXiv 2204.06125 — Hierarchical Text-Conditional Image Generation with CLIP Latents', u:'https://arxiv.org/abs/2204.06125'},
 {t:'OpenAI — DALL·E 2', u:'https://openai.com/index/dall-e-2/'}
]
});
