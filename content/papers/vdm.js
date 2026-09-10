WIKI.paper({
slug:'vdm',
venue:'NeurIPS 2021',
authors:'Kingma, Salimans, Poole, Ho (Google Research)',
arxiv:'2107.00630',

tldr:'확산모델의 변분 하한(VLB)이 **신호대잡음비(SNR)만의 함수**로 정리된다는 것을 보이고, 잡음 일정 자체를 학습 가능한 파라미터로 두어 이미지 우도(likelihood) 벤치마크에서 자기회귀 모델을 처음으로 앞선 논문.',

context:'[DDPM](#/p/ddpm)은 지각적으로 뛰어난 샘플을 만들었지만, CIFAR-10·ImageNet 같은 표준 우도(bits-per-dim) 벤치마크에서는 여전히 PixelCNN 계열 자기회귀 모델에 뒤처졌다. 잡음 스케줄(noise schedule)은 보통 사람이 손으로 고정해 두는 하이퍼파라미터였고, 이산 시간(discrete-time)과 연속 시간(continuous-time) 정식화 사이의 관계도 불분명했다. 이 논문은 확산모델을 [VAE](#/p/vae)와 같은 변분추론 언어로 다시 쓰면 이 문제들이 한 번에 풀린다는 것을 보인다 — 무한히 깊은(T→∞) 계층적 VAE로 확산모델을 보면, ELBO가 놀랍도록 단순한 형태로 닫힌다.',

ideas:[
 {h:'VLB를 SNR만의 함수로 재정리',
  lead:'확산 손실 전체가 시점 $t$ 마다의 신호대잡음비 $\\text{SNR}(t)=\\alpha_t^2/\\sigma_t^2$ 로만 표현된다.',
  d:'디코더 $x_i$ 하나하나의 분포, 노이즈 예측 오차, 가중치 함수까지 복잡해 보이던 항들이 정리되면, 손실은 결국 각 시점의 SNR과 노이즈 예측 오차의 곱으로 귀결된다. 이 덕분에 DDPM·Score SDE 등 서로 다르게 유도된 기존 확산모델들이 사실 데이터의 시간 의존적 재스케일링 차이만 있을 뿐 **동등하다**는 것도 증명된다.'},
 {h:'연속시간 VLB는 스케줄 모양에 불변',
  lead:'연속시간 극한에서 VLB는 $\\text{SNR}(0)$·$\\text{SNR}(1)$ 두 경계값에만 의존하고 중간 곡선 모양과는 무관하다.',
  d:'$T\\to\\infty$ 로 보내면 이산합이 적분으로 바뀌는데, 이 적분을 변수를 $t$ 대신 $v=\\text{SNR}(t)$ 로 치환해서 계산하면 적분 구간 $[\\text{SNR}_{\\min},\\text{SNR}_{\\max}]$ 만 남고 그 사이 경로는 사라진다. 잡음 스케줄을 아무리 다르게 잡아도 두 끝점만 같으면 VLB 값이 완전히 같다는 뜻이다.'},
 {h:'그러면 스케줄을 학습해서 분산을 줄인다',
  lead:'VLB 값 자체는 스케줄에 무관하니, 대신 몬테카를로 추정량의 **분산**을 줄이는 방향으로 스케줄을 학습한다.',
  d:'스케줄 모양이 기댓값을 바꾸지 못한다면 자유도가 남는데, 이 자유도를 손실 추정의 분산을 최소화하는 데 쓴다. $\\sigma_t^2=\\text{sigmoid}(\\gamma_\\eta(t))$ 를 단조 신경망으로 파라미터화해 끝점(우도에 직접 영향)과 중간 모양(분산에만 영향)을 동시에 학습한다. 결과적으로 학습이 눈에 띄게 빨라진다.'},
 {h:'Fourier 특징으로 픽셀 단위 디테일을 잡는다',
  lead:'입력에 고주파 Fourier 특징을 덧붙여 우도가 민감하게 반응하는 미세 디테일을 따로 표현한다.',
  d:'지각 품질(FID)은 거친 구조가 좌우하지만 우도는 각 픽셀의 정확한 값 하나하나에 민감하다. 원본 입력의 선형 투영을 여러 주파수로 만든 Fourier 특징을 U-Net 입력에 추가하면, 이 고주파 정보가 없을 때보다 bits-per-dim이 크게 개선된다. 저자들은 같은 특징을 PixelCNN++에 추가했을 때는 개선이 없었다고 보고한다 — 확산모델 고유의 효과다.'},
 {h:'우도 최적화와 지각 품질은 서로 다른 목표',
  lead:'VLB(우도)를 그대로 최적화한 모델은 FID가 최적이 아니며, [DDPM](#/p/ddpm)의 가중 손실을 쓰면 FID가 개선된다.',
  d:'이 논문의 CIFAR-10 모델은 우도(2.65 BPD)에 맞춰 튜닝되어 FID 7.41에 그친다. 그런데 같은 모델에 [Ho et al. 2020](#/p/ddpm)이 쓴 가중치 함수 $w(\\text{SNR})$ 를 적용하면 FID가 4.0으로 개선된다. 즉 우도 하한과 지각 품질은 같은 목표가 아니고, 가중치 함수가 그 사이를 조절하는 손잡이라는 것을 명시적으로 보여준다.'}
],

diagram:{type:'flow', cap:'VLB를 SNR 함수로 정리하는 흐름. 학습된 스케줄이 분산 최소화로 이어진다.',
 nodes:[
  {t:'데이터 x', s:'0~1 정규화'},
  {t:'확산 z_t', s:'N(α_t x, σ_t² I)'},
  {t:'SNR(t)', s:'α_t²/σ_t²', acc:true, a:'끝점만 남음'},
  {t:'VLB', s:'SNR만의 함수'},
  {t:'스케줄 학습', s:'분산 최소화'}
 ]},

math:[
 {expr:'SNR(t) = αt² / σt²',
  tex:'\\text{SNR}(t)=\\alpha_t^2/\\sigma_t^2',
  d:'시점 $t$ 에서 신호(원 데이터 성분)와 잡음(주입된 가우시안)의 비율. $t=0$ 에서 최대, $t=1$ 에서 최소가 되도록 단조 감소하게 정의한다.'},
 {expr:'L∞(x) = -E[ ∫ SNR\'(t) ||x - x̂θ(zt;t)||² dt ] / 2',
  tex:"L_{\\infty}(x) = -\\tfrac{1}{2}\\,\\mathbb{E}_{\\epsilon,\\,t\\sim U(0,1)}\\!\\left[\\text{SNR}'(t)\\,\\lVert x-\\hat{x}_\\theta(z_t;t)\\rVert^2\\right]",
  d:'연속시간(T→∞) 극한에서의 확산 손실. 노이즈 예측 오차에 SNR의 시간 미분을 곱해 적분한 값이며, 뒤에 변수를 $v=\\text{SNR}(t)$ 로 치환하면 경로 적분이 구간 $[\\text{SNR}(1),\\text{SNR}(0)]$ 위의 적분으로 바뀌어 중간 스케줄 모양이 사라진다.'},
 {expr:'σt² = sigmoid(γη(t)),  SNR(t) = exp(-γη(t))',
  tex:'\\sigma_t^2=\\text{sigmoid}(\\gamma_\\eta(t)),\\qquad \\text{SNR}(t)=\\exp(-\\gamma_\\eta(t))',
  d:'단조 신경망 $\\gamma_\\eta$ 로 잡음 스케줄 자체를 파라미터화한다. 이 함수의 두 끝값 $\\gamma_\\eta(0),\\gamma_\\eta(1)$ 이 곧 우도를 결정하고, 중간 모양은 추정량의 분산만 조절한다.'}
],

numbers:[
 {k:'CIFAR-10 BPD (증강 없음)', v:'2.65', d:'같은 조건 이전 최고(Sparse Transformer 2.80)를 능가, 자기회귀 모델을 처음 앞선 확산모델'},
 {k:'CIFAR-10 BPD (증강)', v:'2.49', d:'flip·회전·채널 스왑 증강 시 최저값'},
 {k:'ImageNet 64×64 BPD', v:'3.40', d:'Routing Transformer 3.43 대비 개선'},
 {k:'FID (우도 최적화 모델)', v:'7.41 → 4.0', d:'[DDPM](#/p/ddpm) 가중치 함수로 재가중하면 4.0까지 개선 — 우도 최적화와 별개'},
 {k:'학습 속도', v:'2.5시간 만에 SOTA 추월', d:'CIFAR-10, 8×TPUv3, 배치 128 — 2.80 BPD(당시 최고)를 2.5시간 만에 넘어섬'},
 {k:'최종 학습량', v:'10M 업데이트 · 9일', d:'BPD 2.65 도달까지 걸린 총 학습 시간'}
],

impact:'확산모델이 지각 품질뿐 아니라 **우도 기반 밀도추정에서도** 자기회귀 모델을 이길 수 있음을 처음 보였다. 더 중요한 것은 SNR 재정리 자체다 — DDPM, Score SDE, NCSN 등 서로 다른 유도로 제안된 확산모델들이 본질적으로 동등한 손실을 최적화하고 있었음이 드러났고, 이후 연구들이 잡음 스케줄과 가중치 함수를 독립적인 설계 변수로 다루는 언어를 이 논문에서 물려받았다. `v-prediction`, 학습 가능 스케줄, SNR 기반 손실 가중치 같은 기법들이 여기서 갈라져 나온다.',

legacy:[
 '**SNR 언어의 표준화** — 이후 확산모델 논문들이 손실을 노이즈 예측 대신 SNR·`v-parameterization`으로 서술하는 관행이 이 논문에서 굳어졌다',
 '**스케줄과 목적함수의 분리** — 잡음 스케줄은 분산 최소화용, 손실 가중치는 지각 품질용이라는 구분이 [Imagen](#/p/imagen) 등 후속 대형 모델의 학습 레시피에 반영됨',
 '**모델 동등성 증명** — DDPM·Score SDE·NCSN이 재스케일링 차이일 뿐이라는 결과가, 서로 다른 확산모델 변종을 하나의 틀로 비교하는 이후 이론 연구(예: [Score SDE](#/p/score-sde))의 토대가 됨',
 '**우도 vs 품질의 명시적 분리** — 우도 최적화가 FID와 다른 목표라는 관찰이 이후 대형 텍스트-이미지 확산모델들이 우도 대신 지각 가중 손실을 기본값으로 쓰는 선택을 정당화함'
],

pitfalls:[
 '**"VDM이 처음 SNR을 도입했다"는 과장이다.** SNR 자체는 신호처리의 표준 개념이고, 이 논문의 기여는 확산 VLB **전체**가 SNR만의 함수로 닫힌다는 것을 증명한 데 있다.',
 '**연속시간 불변성은 VLB(기댓값)에 대한 결과이지, 몬테카를로 추정량의 분산에 대한 결과가 아니다.** 스케줄이 우도를 못 바꾼다고 아무 스케줄이나 써도 된다는 뜻은 아니며, 분산 차이는 실제 학습 속도에 크게 영향을 준다.',
 '**표 1의 수치는 데이터 증강 여부에 따라 다른 값이다.** CIFAR-10 2.65는 증강 없음, 2.49는 증강 적용 값이며 서로 비교 기준이 다르다.'
],

figures:[
 {f:'fig1-bpd-results.png',
  cap:'막대그래프가 연도별 당시 SOTA를 나타낸다. 파란 막대는 전부 자기회귀 모델(PixelRNN부터 Sparse/Routing Transformer까지)이고, 맨 오른쪽 초록 막대가 VDM — 처음으로 자기회귀 계열을 우도(bits per dim, 낮을수록 좋음)에서 앞선 확산모델이라는 것이 이 그림의 요지다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We show that the variational lower bound (VLB) simplifies to a remarkably short expression in terms of the signal-to-noise ratio of the diffused data, thereby improving our theoretical understanding of this model class.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2107.00630 — Variational Diffusion Models', u:'https://arxiv.org/abs/2107.00630'},
 {t:'공식 코드 (Google Research)', u:'https://github.com/google-research/vdm'}
]
});
