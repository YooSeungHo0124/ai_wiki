WIKI.paper({
slug:'video-diffusion',
venue:'NeurIPS 2022',
authors:'Ho, Salimans, Gritsenko, Chan, Norouzi, Fleet (Google Brain)',
arxiv:'2204.03458',

tldr:'이미지 [DDPM](#/p/ddpm)을 비디오로 확장한 최초의 diffusion 비디오 생성 모델. 2D U-Net을 **공간-시간으로 분해된(factorized) 3D U-Net**으로 바꾸고, 이미지와 비디오를 함께 학습시켜 데이터 부족과 계산량 폭증을 동시에 완화했다.',

context:'2022년 초 diffusion 모델은 이미지 생성에서 이미 GAN을 앞서고 있었지만, 비디오로 확장하는 것은 별개의 문제였다. 프레임 하나가 늘 때마다 필요한 연산·메모리가 함께 늘고, 텍스트-비디오 쌍 데이터는 텍스트-이미지 쌍보다 훨씬 적다. 단순히 2D U-Net을 3D conv로 바꾸면 이미지 diffusion에서 검증된 구조·가중치를 재사용할 수 없고 메모리도 감당하기 어렵다. 이 논문은 "표준 Gaussian diffusion 공식을 거의 그대로 두고, 비디오라는 새 축을 최소한의 구조 변경으로 얹을 수 있는가"를 묻는다.',

ideas:[
 {h:'공간-시간 분해 3D U-Net',
  lead:'3×3 conv를 1×3×3 conv로, 그 뒤에 시간 attention 블록을 끼워 넣는다.',
  d:'이미지 U-Net의 각 2D convolution을 **공간에만 작용하는 3D convolution**(예: 3×3 → 1×3×3)으로 바꿔 프레임 축은 배치 축처럼 다룬다. 이어서 각 공간 attention 블록 뒤에 **시간 축에만 작용하는 attention 블록**을 추가한다 — [TimeSformer](#/p/timesformer)류 비디오 Transformer에서 검증된 시공간 분해 전략을 diffusion U-Net에 그대로 적용한 것이다. 프레임 순서를 구분하기 위해 시간 attention에는 상대 위치 임베딩을 쓴다.'},
 {h:'이미지·비디오 공동 학습',
  lead:'비디오 끝에 독립된 이미지 프레임을 이어 붙여 같은 배치로 함께 학습한다.',
  d:'시공간 분해 구조 덕분에 시간 attention 블록의 attention 행렬을 항등행렬로 고정하면 모델이 비디오 대신 개별 이미지를 처리하도록 손쉽게 전환할 수 있다. 이를 이용해 학습 배치마다 비디오와 무작위 독립 이미지 프레임을 함께 넣어 학습시키면, 미니배치 gradient의 분산이 줄고 텍스트-비디오 쌍 데이터 부족을 텍스트-이미지 데이터로 보완할 수 있다. 논문은 이 공동 학습이 표본 품질에 **중요한 기여**를 한다는 것을 직접 ablation으로 확인했다.'},
 {h:'재구성 가이던스로 조건부 샘플링',
  lead:'비조건부로 학습된 모델을 replacement 대신 gradient 항으로 조건부 확장한다.',
  d:'기존 replacement 방법은 이미 학습된 조건부 프레임 $\\mathbf{x}^a$ 를 매 스텝 forward process 샘플로 강제 치환하는데, 이는 $\\mathbb{E}_q[\\mathbf{x}^b|\\mathbf{z}_t]$ 방향으로만 업데이트해 정작 필요한 $\\mathbb{E}_q[\\mathbf{x}^b|\\mathbf{z}_t,\\mathbf{x}^a]$ 항이 빠진다는 문제가 있다. 이 논문은 모델의 재구성 $\\hat{\\mathbf{x}}^a_\\theta(\\mathbf{z}_t)$ 를 이용한 gradient 보정 항을 denoising 예측에 더해 조건부 샘플링을 근사한다. 이 방법으로 **긴 영상으로의 자기회귀적 확장**과 **저해상도→고해상도 초해상도 확장**을 같은 메커니즘으로 처리한다.'},
 {h:'고정 프레임 수 학습, 가변 길이 샘플링',
  lead:'16프레임만 학습해 두고 재구성 가이던스로 임의 길이·해상도로 늘려 생성한다.',
  d:'메모리 제약 때문에 학습은 16프레임 같은 고정된 짧은 클립으로만 진행하지만, 추론 시점에는 이미 생성한 클립을 조건으로 다음 클립을 이어 붙이거나(자기회귀적 확장), 저프레임률 영상의 중간 프레임을 채우거나(시간 보간), 저해상도 영상을 고해상도로 업샘플링하는 식으로 임의 길이·해상도의 영상을 만들 수 있다.'}
],

diagram:{type:'stack', cap:'입력 노이즈 비디오가 공간 다운샘플링·업샘플링을 거치며, 각 해상도 단계마다 공간 conv 다음에 시간 attention이 붙는다(그림에서 반복 생략 부호 부분).',
 layers:[
  {t:'노이즈 비디오 z_t', s:'프레임×H×W×채널'},
  {t:'1×3×3 공간 conv', s:'2D conv를 공간에만 적용'},
  {t:'공간 attention', s:'프레임을 배치축으로 취급'},
  {t:'시간 attention', acc:true, s:'상대 위치 임베딩', note:'← 비디오만의 신규 블록'},
  {t:'다운/업샘플 반복', s:'K개 해상도 단계'},
  {t:'출력 예측 x̂', s:'디노이즈된 비디오'}
 ]},

math:[
 {expr:'x̃ᵇ_θ(z_t) = x̂ᵇ_θ(z_t) - (w_r·α_t/2)∇_{z_t^b} ||x^a - x̂ᵃ_θ(z_t)||²',
  tex:'\\tilde{\\mathbf{x}}_{\\theta}^{b}(\\mathbf{z}_t)=\\hat{\\mathbf{x}}_{\\theta}^{b}(\\mathbf{z}_t)-\\frac{w_r\\alpha_t}{2}\\nabla_{\\mathbf{z}_t^{b}}\\left\\|\\mathbf{x}^{a}-\\hat{\\mathbf{x}}_{\\theta}^{a}(\\mathbf{z}_t)\\right\\|_2^{2}',
  d:'재구성 가이던스 식. 조건 $\\mathbf{x}^a$ 를 모델이 얼마나 잘 재구성했는지에 대한 gradient를 denoising 예측에 더해, replacement 방법이 놓치는 조건-생성 간 결합 항을 근사한다. $w_r$ 이 클수록 조건에 더 강하게 맞춘다.'}
],

numbers:[
 {k:'UCF101 Inception Score', v:'57 ± 0.62', d:'비조건부 생성, 실제 데이터 IS 60.2에 근접 — 당시 SOTA'},
 {k:'UCF101 FVD', v:'295 ± 3', d:'TGAN-v2(3431~3497) 대비 대폭 개선'},
 {k:'Kinetics-600 FVD', v:'16.2', d:'조건부 5→11프레임 예측 과제. 샘플링 방식에 따라 16.9까지 변동'},
 {k:'학습 클립 길이', v:'16프레임', d:'학습은 짧게, 추론은 재구성 가이던스로 확장'},
 {k:'해상도 확장 예시', v:'16×64×64 → 64×128×128', d:'프레임 수·해상도를 동시에 늘리는 시공간 초해상도'}
],

impact:'DDPM의 표준 공식을 거의 바꾸지 않고도 비디오 생성이 가능함을 보여, 이후 비디오 생성 연구의 기본 틀을 diffusion으로 정착시켰다. "이미지 diffusion 구조를 최대한 재사용하고 시간 축만 추가한다"는 이 논문의 접근은 [Make-A-Video](#/p/make-a-video)·[Video LDM](#/p/videoldm) 등 후속 연구가 공유하는 핵심 전략이 되었고, 재구성 가이던스는 별도 조건부 모델 학습 없이 하나의 비조건부 모델로 예측·보간·초해상도를 모두 처리하는 방법을 제시했다.',

legacy:[
 '**시공간 분해 U-Net의 표준화** — 공간 conv + 시간 attention을 번갈아 쌓는 구조가 이후 대부분의 비디오 diffusion 모델(Make-A-Video, Video LDM, [SVD](#/p/svd))의 기본 골격이 됨',
 '**이미지·비디오 공동 학습 전략의 계승** — "이미지 생성은 이미지 데이터로, 움직임은 비디오 데이터로 분업 학습"하는 아이디어가 [Make-A-Video](#/p/make-a-video)의 명시적 설계 원칙으로 발전',
 '**잠재 공간으로의 이동** — 픽셀 공간에서의 비디오 diffusion은 비용이 커서, 후속 연구는 [LDM](#/p/ldm)의 잠재 공간 압축을 비디오에 적용하는 방향([Video LDM](#/p/videoldm))으로 급속히 이동',
 '**재구성/가이던스 기반 확장의 재사용** — 긴 시퀀스 자기회귀 확장, 초해상도 확장이라는 문제 설정 자체가 이후 비디오 생성 논문들의 표준 평가 축이 됨'
],

pitfalls:[
 '**생성 영상 평가는 이미지보다 훨씬 어렵다.** FVD·Inception Score 같은 자동 지표는 I3D 등 사전학습된 분류기의 특징 분포 거리를 잴 뿐, 실제 시간적 일관성(깜빡임·형태 붕괴)이나 지각 품질을 직접 재지 못한다. 이 논문도 같은 지표를 샘플링 방식(복원 추출 여부)만 바꿔도 FVD가 16.2→16.9로 흔들리는 것을 스스로 보고했다 — 지표 하나로 모델을 서열화하는 것은 위험하다.',
 '**"고정 16프레임 학습"이 짧은 영상만 만든다는 뜻은 아니다.** 재구성 가이던스 덕분에 임의 길이로 확장 가능하지만, 자기회귀적으로 이어붙일수록 오차가 누적되어 뒤로 갈수록 화질·일관성이 떨어지는 경향은 논문에서도 완전히 해결되지 않았다.',
 '**Replacement 방법을 "틀린 방법"으로 오해하면 안 된다.** 다른 조건부 생성 설정에서는 여전히 쓰이는 표준 기법이며, 이 논문은 비디오 확장이라는 특정 상황에서 시간적 일관성이 깨지는 문제를 재구성 가이던스로 개선했을 뿐이다.'
],

figures:[
 {f:'fig1-3d-unet.png',
  cap:'왼쪽에서 오른쪽으로 공간 해상도가 절반씩 줄었다가(다운샘플) 다시 늘어나는(업샘플) 표준 U-Net 모양이되, 각 색칠된 블록이 공간 conv/attention과 시간 attention을 번갈아 쌓은 구간이다. 위쪽 곡선 화살표가 스킵 연결.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'We show that high quality videos can be generated using essentially the standard formulation of the Gaussian diffusion model, with little modification other than straightforward architectural changes to accommodate video data.',
  src:'Section 1, p.1'}
],

links:[
 {t:'arXiv 2204.03458 — Video Diffusion Models', u:'https://arxiv.org/abs/2204.03458'},
 {t:'프로젝트 페이지 (샘플 영상)', u:'https://video-diffusion.github.io/'}
]
});
