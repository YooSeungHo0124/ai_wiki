WIKI.paper({
slug:'fno',
venue:'ICLR 2021',
authors:'Li et al. (Caltech · Purdue)',
arxiv:'2010.08895',

tldr:'편미분방정식(PDE)의 풀이 함수 자체가 아니라 **파라미터 → 해(解)로 가는 연산자(operator)**를 신경망으로 직접 배우는 방법. 적분 커널을 Fourier 공간에서 파라미터화해, 격자 해상도에 무관하게 학습하고 다른 해상도에서 바로 추론(zero-shot super-resolution)할 수 있다.',

context:'전통적 PDE 풀이는 [FEM](https://en.wikipedia.org/wiki/Finite_element_method)/FDM처럼 공간을 격자로 쪼개 하나의 방정식 인스턴스를 매번 새로 푼다. 재료 설계처럼 파라미터를 수천 번 바꿔가며 풀어야 하는 역문제에서는 이게 병목이 된다. 신경망으로 대체하려는 이전 시도(PINN, FCN 기반 CNN)는 **유한 차원 공간 사이의 사상**만 배우므로 학습한 해상도에 결과가 묶인다. GNO·MGNO 같은 초기 neural operator(같은 저자들의 전작)는 물리 공간에서 Nyström 샘플링으로 적분 커널을 근사했지만 계산 비용이 크다. FNO는 질문을 바꾼다 — 커널을 물리 공간이 아니라 **Fourier 공간에서 직접 저주파 모드만 파라미터화**하면 FFT로 빠르게 계산되면서도 함수 공간 사이의 진짜 연산자를 배울 수 있지 않을까.',

ideas:[
 {h:'연산자 학습: 함수를 함수로 사상',
  lead:'입력 함수와 출력 함수 사이의 사상 자체를 배워 한 번 학습으로 전체 PDE family를 푼다.',
  d:'기존 신경망은 하나의 벡터를 하나의 벡터로 보낸다. neural operator는 $a(x)$ 라는 입력 함수(예: 확산계수, 초기조건)를 $u(x)$ 라는 해 함수로 보내는 사상 $G^\\dagger$ 를 통째로 배운다. 학습이 끝나면 파라미터 $a$ 가 바뀔 때마다 방정식을 다시 풀 필요 없이 forward pass 한 번으로 새 해를 얻는다. FNO는 이 사상을 반복적 업데이트 $v_t \\mapsto v_{t+1}$ 로 구성하고, 각 스텝을 비국소 적분 연산 $K$ 와 국소 비선형 $\\sigma$ 의 합성으로 정의한다.'},
 {h:'Fourier layer: FFT → 저주파만 선형변환 → IFFT',
  lead:'적분 커널을 물리 공간이 아니라 Fourier 공간에서 저주파 모드만 직접 파라미터화한다.',
  d:'커널 적분 $\\int \\kappa(x-y)v(y)dy$ 는 convolution 정리에 의해 Fourier 공간에서 곱셈이 된다. 그래서 $v_t$ 를 FFT로 변환하고, 미리 정한 $k_{max}$ 개의 저주파 모드에만 학습 가능한 복소 텐서 $R$ 을 곱한 뒤(고주파는 그냥 버림), IFFT로 물리 공간에 되돌린다. 실험에서는 채널당 $k_{max}=12$(2D 문제) 정도만으로 충분했다. 이와 병렬로 지역 선형변환 $W$ 를 더해 residual처럼 합치고 활성함수를 씌운다.'},
 {h:'격자 해상도 무관성(discretization-invariance)',
  lead:'파라미터가 Fourier 모드에 붙어 있어 학습·평가 격자가 달라도 같은 가중치를 그대로 쓴다.',
  d:'CNN의 커널은 물리 공간 격자 간격에 종속되지만, FNO의 $R$ 은 주파수 모드에 물려 있고 모드는 $e^{2\\pi i \\langle x,k\\rangle}$ 기저로 어디서나 정의된다. 그 결과 저해상도로 학습한 모델을 고해상도 입력에 그대로 적용할 수 있다 — 이른바 **zero-shot super-resolution**. 저자들은 64×64×20 해상도로 학습한 3D 모델을 256×256×80으로 평가해 이를 보였다.'},
 {h:'준선형 복잡도',
  lead:'FFT 덕분에 전체 계산이 $O(n\\log n)$ 로 격자점 수에 거의 선형이다.',
  d:'가중치 텐서 $R$ 은 $k_{max} < n$ 개 모드만 가지므로 모드별 곱셈 자체는 $O(k_{max})$ 다. 병목은 FFT/IFFT인데 이는 $O(n\\log n)$ 이라, 일반 Fourier 변환의 $O(n^2)$ 이나 GNO류의 Nyström 적분보다 훨씬 싸다. 단 이 이점을 그대로 누리려면 **균일 격자**가 필요하다는 전제가 붙는다.'},
 {h:'주기 경계가 아니어도 동작: bias 항 W',
  lead:'국소 선형변환 W가 비주기 경계 정보를 남겨 Fourier 방법의 전통적 한계를 우회한다.',
  d:'전통 Fourier 방법은 주기 경계조건에서만 잘 작동한다. Darcy flow(Dirichlet 경계)처럼 비주기 문제에도 FNO가 통하는 이유는, Fourier 경로와 나란히 더해지는 지역 선형변환 $W$(bias 역할)가 경계 정보를 계속 실어 나르기 때문이라고 저자들은 설명한다.'}
],

diagram:{type:'stack', cap:'입력 a(x)를 P로 고차원 채널에 올린 뒤 Fourier layer T개를 통과, Q로 다시 투영해 u(x) 출력. 각 Fourier layer 내부는 FFT→저주파 선형변환 R→IFFT 경로와 지역변환 W 경로를 합산.',
 layers:[
  {t:'입력 함수 a(x)', s:'점별 관측값'},
  {t:'P: 채널 올리기', s:'→ d_v 채널'},
  {t:'FFT', s:'F(v_t)', acc:true, note:'주파수 영역으로'},
  {t:'저주파 모드만 R 곱셈', s:'k_max개, 고주파 버림', acc:true},
  {t:'IFFT', s:'F⁻¹', acc:true, note:'물리 공간 복귀'},
  {t:'+ W(v_t) 합산', s:'지역 선형항, 활성함수'},
  {t:'Q: 채널 투영', s:'→ u(x) 출력'}
 ]},

math:[
 {expr:'v_{t+1}(x) = σ( W v_t(x) + (K(a;φ) v_t)(x) )',
  tex:'v_{t+1}(x) = \\sigma\\!\\left(Wv_t(x) + \\big(\\mathcal{K}(a;\\phi)v_t\\big)(x)\\right)',
  d:'반복 업데이트의 기본형. 비국소 적분 연산자 $\\mathcal{K}$ 와 지역 선형변환 $W$ 를 더한 뒤 비선형 $\\sigma$ 를 씌운다. $T$ 번 반복해 얕은 신경망을 함수 공간의 깊은 신경망으로 확장한다.'},
 {expr:'(K(φ)v_t)(x) = F⁻¹( R_φ · (F v_t) )(x)',
  tex:'\\big(\\mathcal{K}(\\phi)v_t\\big)(x) = \\mathcal{F}^{-1}\\!\\big(R_\\phi \\cdot (\\mathcal{F}v_t)\\big)(x)',
  d:'Fourier 적분 연산자의 정의. convolution 정리로 물리 공간의 적분이 Fourier 공간의 곱셈이 된다. $R_\\phi$ 는 잘린 저주파 모드에서만 정의된 학습 가능한 복소 텐서다.'},
 {expr:'complexity: O(n log n)  vs  일반 Fourier O(n²)',
  tex:'\\underbrace{O(n\\log n)}_{\\text{FFT/IFFT}} \\;+\\; \\underbrace{O(k_{max})}_{R \\text{ 곱셈}}',
  d:'$k_{max} < n$ 이므로 모드 곱셈은 저렴하고, 전체 비용은 FFT/IFFT에 지배된다. 격자점 $n$ 에 거의 선형으로 스케일한다.'}
],

numbers:[
 {k:'속도 개선', v:'최대 10³배', d:'전통 PDE 솔버 대비. Bayesian 역문제 실험에서 FNO 1회 평가 0.005s vs 전통 솔버 2.2s'},
 {k:'Darcy flow 오차', v:'~1개 자릿수 개선', d:'다른 벤치마크(RBM/FCN/PCANN/GNO/MGNO/LNO) 대비 상대오차가 약 10배 낮음'},
 {k:'MCMC 역문제 총 시간', v:'2.5분 vs 18시간+', d:'25,000샘플 MCMC를 FNO로 대체 시. 학습 오프라인 비용 12시간을 더해도 여전히 더 빠름'},
 {k:'Navier-Stokes 최저오차', v:'0.0086 (FNO-3D, ν=1e-3)', d:'표1, 해상도 64×64 고정, N=1000 학습 샘플 기준 상대 L2 오차'},
 {k:'저주파 모드 수', v:'k_max,j = 12 (2D) / 16 (1D)', d:'채널당 파라미터화된 Fourier 모드 개수. 이 정도로 충분했다고 보고'},
 {k:'zero-shot 초해상도', v:'64×64×20 → 256×256×80', d:'학습 때 본 적 없는 해상도로 공간·시간 동시 초해상도 추론'}
],

impact:'FNO는 "신경망이 벤치마크가 아니라 실제 물리 시뮬레이션을 대체할 수 있는가"라는 질문에 구체적인 숫자로 답한 첫 사례 중 하나다. 논문은 난류(turbulent) Navier-Stokes를 zero-shot super-resolution으로 성공적으로 모델링한 첫 ML 방법이라고 주장한다. 핵심은 아키텍처가 아니라 **어디에 파라미터를 두는가**의 전환 — 물리 공간 대신 Fourier 공간에 학습 가능한 커널을 두면 격자 해상도라는 신경망의 오랜 제약이 사라진다는 것을 보였다. 이후 기상·기후처럼 격자 규모가 크고 다양한 해상도를 다뤄야 하는 과학 도메인에서 neural operator가 실제 후보로 떠올랐다.',

legacy:[
 '**날씨 예보로의 확장** — [GraphCast](#/p/graphcast)와 [Pangu-Weather](#/p/pangu-weather)는 FNO와 계보상 다른 뿌리(GNN, ViT)에서 출발했지만, "전 지구 물리 시스템을 시뮬레이터 대신 신경망으로 대체한다"는 FNO의 문제의식을 공유하며 같은 흐름을 이룬다. Pangu-Weather는 FNO를 직접 조상으로 인용한다.',
 '**Geo-FNO·spherical FNO** — 불규칙 격자·구면 좌표계로 FNO를 확장하는 후속 연구들이 이어져, 균일 격자라는 원 논문의 제약을 완화했다.',
 '**Physics-Informed 결합** — 데이터만으로는 부족한 영역에서 FNO 출력에 PDE 잔차 손실을 더하는 하이브리드(PINO 등)로 발전.',
 '**연산자 학습이라는 분야 자체의 확립** — DeepONet과 함께 FNO는 "함수를 함수로 보내는 신경망"을 하나의 독립된 연구 분야로 자리잡게 했다.'
],

pitfalls:[
 '**"해상도 불변"이 "아무 해상도에서나 정확"을 뜻하지 않는다.** discretization-invariance는 학습·평가 오차가 해상도에 따라 늘지 않는다는 뜻이지, 학습 때 보지 못한 물리 스케일(예: 완전히 다른 Reynolds 수 영역)까지 일반화한다는 보장은 아니다. 논문 자체도 데이터가 부족한 설정(ν=1e-4, N=1000)에서는 모든 방법이 15% 이상 오차를 낸다고 밝힌다.',
 '**전통 솔버 대신 쓰려면 여전히 그 솔버로 학습 데이터를 생성해야 한다.** ν=1e-4 Navier-Stokes를 배우는 데만 N=10,000개의 시뮬레이션이 필요했고, 이는 그 자체로 비싸다. "1000배 빠르다"는 추론 시점 비교이지, 데이터 생성·학습을 포함한 전체 파이프라인 비교가 아니다.',
 '**검증된 PDE가 제한적이다.** 이 논문의 실증은 1D Burgers, 2D Darcy flow(정상상태), 2D Navier-Stokes(주기 공간, 특정 점성 범위)에 국한된다. 균일 격자·FFT 전제 때문에 불규칙 지오메트리나 복잡한 경계를 가진 실제 공학 문제로 일반화하려면 후속 연구(Geo-FNO 등)가 추가로 필요했다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'(a) 전체 구조: 입력 a(x)를 P로 고차원 채널에 올리고 Fourier layer를 T번 쌓은 뒤 Q로 투영해 u(x) 출력. (b) Fourier layer 내부: 위쪽 경로가 F(FFT)→R(저주파 모드만 선형변환, 고주파는 버림)→F⁻¹(IFFT), 아래쪽 경로가 지역 선형변환 W. 두 경로를 더한 뒤 활성함수 σ.',
  src:'원문 Figure 2, p.4'},
 {f:'fig3-benchmarks.png',
  cap:'왼쪽 Burgers·가운데 Darcy는 x축이 격자 해상도, y축이 상대오차(로그축) — FNO(짙은 빨강)만 해상도가 올라가도 오차가 거의 안 늘어나고 FCN 계열은 해상도에 따라 오차가 커진다. 오른쪽 Navier-Stokes는 x축이 학습 epoch, y축이 오차 — FNO-3D(파랑)가 가장 빠르고 낮게 수렴.',
  src:'원문 Figure 3, p.7'}
],

quotes:[
 {t:'The Fourier neural operator is the first ML-based method to successfully model turbulent flows with zero-shot super-resolution. It is up to three orders of magnitude faster compared to traditional PDE solvers.',
  src:'Abstract, p.1'},
 {t:'Invariance to discretization. The Fourier layers are discretization-invariant because they can learn from and evaluate functions which are discretized in an arbitrary way.',
  src:'Section 4, p.5'}
],

links:[
 {t:'arXiv 2010.08895 — Fourier Neural Operator for Parametric PDEs', u:'https://arxiv.org/abs/2010.08895'},
 {t:'공식 코드 (neuraloperator/neuraloperator)', u:'https://github.com/neuraloperator/neuraloperator'},
 {t:'Zongyi Li 블로그: Fourier Neural Operator 소개', u:'https://zongyi-li.github.io/blog/2020/fourier-pde/'}
]
});
