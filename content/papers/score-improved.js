WIKI.paper({
slug:'score-improved',
venue:'NeurIPS 2020',
authors:'Song & Ermon (Stanford)',
arxiv:'2006.09011',

tldr:'`[확산 모델의 원조](#/p/diffusion-original)`와는 별도로 발전한 **스코어 기반 생성모델**(NCSN)을 대규모 이미지에서도 안정적으로 작동시킨 실용화 논문. 노이즈 스케일 선택·노이즈 조건화·EMA를 이론적으로 정당화된 다섯 가지 규칙으로 정리해, CIFAR-10을 넘어 256×256 이미지까지 처음으로 스코어 모델을 확장했다.',

context:'저자들의 이전 논문(NCSN)은 데이터에 여러 세기의 가우시안 노이즈를 섞어 각 노이즈 수준에서 score function $\\nabla_x \\log p(x)$ 를 학습하고, annealed Langevin dynamics로 노이즈를 걷어내며 샘플을 생성하는 아이디어를 처음 보였다. 문제는 노이즈 스케일 $\\{\\sigma_i\\}$, step size, 네트워크가 노이즈 정보를 받는 방식 같은 **하이퍼파라미터를 어떻게 정해야 하는지가 전부 경험칙**이었다는 점이다. CIFAR-10보다 큰 이미지로 넘어가면 이 값들이 어긋나 학습이 불안정해지고 FID가 훈련 내내 요동쳤다. 이 논문은 "왜 그 값이어야 하는가"를 수학적으로 분석해 스케일이 큰 이미지에서도 통하는 다섯 개의 기법으로 정리한다.',

ideas:[
 {h:'초기 노이즈 스케일: 데이터의 최대 쌍거리만큼',
  lead:'σ₁을 데이터 포인트 간 최대 유클리드 거리 수준으로 잡아야 Langevin이 모드 사이를 오간다.',
  d:'서로 다른 데이터 점 $x^{(i)}, x^{(j)}$ 사이를 Langevin dynamics가 오가려면 $\\mathbb{E}[r^{(j)}(x)]$ 가 너무 작으면 안 되는데, 이 값은 $\\exp(-\\lVert x^{(i)}-x^{(j)}\\rVert^2/8\\sigma_1^2)$ 로 위로 묶인다. CIFAR-10의 중앙값 쌍거리는 약 18인데 원 논문은 $\\sigma_1=1$ 을 썼다 — 이러면 $\\mathbb{E}[r(x)] < 10^{-17}$ 로 사실상 모드 간 이동이 불가능하다. $\\sigma_1=50$ 으로 올리자 샘플 다양성(평균 쌍거리 18.65)이 실제 데이터(17.78)에 근접했다.'},
 {h:'나머지 노이즈 스케일: 등비수열 + 겹침 비율 C≈0.5',
  lead:'σ_i를 등비수열로 잡고 인접 노이즈 분포의 반지름 분포가 절반쯤 겹치게 공비를 정한다.',
  d:'고차원에서 등방 가우시안의 반지름은 $r \\approx \\mathcal{N}(\\sqrt{D}\\sigma, \\sigma^2/2)$ 로 근사되므로, $\\sigma_{i-1}$ 의 반지름 분포와 $\\sigma_i$ 의 반지름 분포가 충분히 겹쳐야 각 단계의 Langevin이 이전 단계 샘플에서 안정적으로 출발할 수 있다. 이 겹침을 $C\\approx 0.5$ 로 맞추면 공비 $\\gamma=\\sigma_{i-1}/\\sigma_i$ 가 자동으로 정해지고, 원 논문의 $L=10$ 보다 훨씬 촘촘한 스케일이 필요하다는 결론이 나온다.'},
 {h:'노이즈 조건화: 1/σ로 나누기만 하면 된다',
  lead:'네트워크를 노이즈마다 따로 정규화 파라미터를 두는 대신 출력을 σ로 나눠 스케일을 준다.',
  d:'스코어의 norm이 $\\mathbb{E}\\lVert \\nabla_x \\log p_\\sigma(x)\\rVert_2 \\approx \\sqrt{D}/\\sigma$ 로 σ에 반비례한다는 관찰에서, $s_\\theta(x,\\sigma) = s_\\theta(x)/\\sigma$ 로 무조건부 네트워크의 출력을 노이즈 크기로 나누기만 해도 노이즈 정보가 전달된다. 원래 방식(노이즈별 정규화 파라미터)은 메모리가 $L$ 에 비례해 커지고 정규화층이 없는 아키텍처엔 아예 쓸 수 없었는데, 이 방법은 그런 제약이 없다.'},
 {h:'step size와 샘플링 스텝 수의 닫힌 형식 관계',
  lead:'한 점 데이터셋을 가정한 해석으로 step size와 T를 노이즈 스케일에 맞춰 유도한다.',
  d:'데이터가 한 점만 있다고 단순화하면 annealed Langevin의 종료 분산 $s_T^2$ 를 $\\gamma,\\, \\epsilon,\\, T$ 의 닫힌 식으로 쓸 수 있다. 등비수열 노이즈에서는 이 비율이 모든 단계에서 동일해지므로, 원 논문이 고정값으로 썼던 $\\epsilon=2\\times10^{-5}$, $T=100$ 대신 노이즈 스케일 설계에 맞춰 값을 고를 수 있게 됐다.'},
 {h:'EMA: 샘플링에는 학습 파라미터의 지수이동평균을 쓴다',
  lead:'모멘텀 0.999의 파라미터 EMA를 샘플링에 쓰면 FID가 학습 내내 요동치던 것이 안정된다.',
  d:'vanilla NCSN은 학습 중 FID가 크게 진동하고 색 왜곡 아티팩트가 반복적으로 나타났다. 샘플링 시 현재 가중치 $\\theta_i$ 대신 EMA $\\theta_0$ 를 쓰는 것만으로 이 진동이 사라지고 대부분의 경우 FID도 더 좋아졌다 — 다섯 기법 중 구현이 가장 간단하지만 효과는 여러 데이터셋에서 일관됐다.'}
],

diagram:{type:'flow', cap:'annealed Langevin dynamics 한 사이클. 큰 노이즈로 시작해 점점 작은 노이즈로 옮겨가며 표본을 정제한다.',
 nodes:[
  {t:'큰 노이즈 σ₁', s:'σ₁=최대 쌍거리'},
  {t:'스코어 추정', s:'s_θ(x)/σ', acc:true, note:'노이즈 조건화'},
  {t:'Langevin 스텝', s:'T번 반복'},
  {t:'다음 σᵢ로 이동', s:'등비수열, C≈0.5'},
  {t:'σ_L, 최종 샘플', s:'EMA 가중치 사용'}
 ]},

math:[
 {expr:'x_t ← x_t-1 + α ∇x log p(x_t-1) + √(2α) z_t',
  tex:'x_t \\leftarrow x_{t-1} + \\alpha\\,\\nabla_x \\log p(x_{t-1}) + \\sqrt{2\\alpha}\\,z_t,\\quad z_t \\sim \\mathcal{N}(0, I)',
  d:'Langevin dynamics 자체의 정의. score function만 알면 이 식을 반복해 $p(x)$ 에서 샘플링할 수 있다는 것이 스코어 기반 생성모델의 출발점.'},
 {expr:'E[r(i)(x)] ≤ (1/2) exp(-‖x(i)-x(j)‖² / 8σ₁²)',
  tex:'\\mathbb{E}_{p^{(i)}(x)}[r^{(j)}(x)] \\le \\frac{1}{2}\\exp\\!\\left(-\\frac{\\lVert x^{(i)}-x^{(j)}\\rVert_2^2}{8\\sigma_1^2}\\right)',
  d:'σ₁이 데이터 점 사이 거리보다 작으면 이 값이 지수적으로 0에 가까워져, Langevin이 다른 모드로 전혀 넘어가지 못한다는 것을 보이는 핵심 부등식.'},
 {expr:'s_θ(x, σ) = s_θ(x) / σ',
  tex:'s_\\theta(x,\\sigma) = s_\\theta(x)/\\sigma',
  d:'무조건부 스코어 네트워크의 출력을 노이즈 크기로 나누기만 하는 조건화 방법(Technique 3). 정규화층 유무와 무관하게 적용된다.'}
],

numbers:[
 {k:'CIFAR-10 σ₁ 권장값', v:'50 (기존 1)', d:'중앙값 쌍거리 18을 근거로 유도, 다양성 지표(평균 쌍거리)가 데이터 수준(17.78)에 근접'},
 {k:'CIFAR-10 FID (NCSNv2, denoising)', v:'10.87', d:'기존 NCSN(25.32)·SNGAN(21.7) 대비 큰 개선'},
 {k:'CelebA 64×64 FID (NCSNv2, denoising)', v:'10.23', d:'기존 NCSN(25.30) 대비 절반 이하'},
 {k:'EMA 모멘텀', v:'m = 0.999', d:'샘플링에 EMA 가중치를 쓰면 학습 중 FID 진동과 색 왜곡이 크게 감소'},
 {k:'노이즈 겹침 비율 C', v:'≈0.5', d:'등비수열 공비를 정하는 기준값. 원 논문 L=10은 사실상 C=0(겹침 없음)이었음'},
 {k:'생성 해상도', v:'최대 256×256', d:'FFHQ·LSUN 등에서 스코어 기반 모델 최초로 이 해상도까지 확장'}
],

impact:'이 논문 이전까지 스코어 기반 생성모델은 CIFAR-10 규모에서만 검증된 이론적으로 흥미로운 대안이었는데, 다섯 가지 기법을 정리한 뒤 FFHQ·LSUN 같은 고해상도 데이터셋으로 처음 확장됐다. 여기서 다듬어진 "노이즈 스케일을 어떻게 설계하는가"라는 질문은 곧 노이즈 스케일을 이산 집합이 아니라 연속적인 SDE로 일반화하는 `[Score SDE](#/p/score-sde)`로 이어졌고, 그 과정에서 확산(DDPM 계열)과 스코어 기반(NCSN 계열) 두 흐름이 사실상 같은 수학의 다른 표현이라는 것이 드러난다.',

legacy:[
 '**`[Score SDE](#/p/score-sde)`로의 이산→연속 일반화** — 이 논문이 등비수열로 고른 노이즈 스케일이 SDE의 노이즈 스케줄로 자연스럽게 확장되며, 두 계열(확산·스코어)이 같은 프레임워크 안에서 통합됨',
 '**노이즈 조건화 레시피의 재사용** — $s_\\theta(x)/\\sigma$ 식의 노이즈 조건화 아이디어는 이후 확산 모델의 시간 임베딩 설계에도 영향을 줌',
 '**EMA가 확산/생성모델 학습의 표준 관행이 됨** — 여기서 검증된 파라미터 EMA는 이후 `[DDPM](#/p/ddpm)`을 비롯한 거의 모든 확산 모델 학습 코드에 기본으로 들어감',
 '**하이퍼파라미터를 이론으로 유도하는 선례** — 노이즈 스케일·step size를 그리드서치가 아니라 닫힌 형식 분석으로 고른다는 접근이 후속 확산 연구의 스케줄 설계 방식에 영향을 줌'
],

pitfalls:[
 '**FID가 항상 시각적 품질과 일치하지 않는다.** 논문 스스로 NCSNv2가 FID 28.9로 NCSN(26.9)보다 수치상 나쁘지만 육안으로는 훨씬 낫다고 지적한다 — 두 계열을 FID 하나로만 비교하면 오판할 수 있다.',
 '**σ₁=50 같은 값은 CIFAR-10 전용이다.** Technique 1의 결론(최대 쌍거리)은 원리이지, 다른 데이터셋에 그대로 옮길 숫자가 아니다. 데이터셋마다 쌍거리를 다시 계산해야 한다.',
 '**이 논문은 `[DDPM](#/p/ddpm)`과 별도 계보에서 나왔다.** 같은 해(2020)에 나온 두 논문이 서로를 인용하지 않고 발전했으며, 수학적으로 같은 과정을 서로 다른 언어(스코어 vs 노이즈 예측)로 기술했다는 사실은 나중에 `[Score SDE](#/p/score-sde)`가 통합하면서 드러났다.'
],

figures:[
 {f:'fig-noise-scale-diversity.png',
  cap:'같은 ground-truth score function으로 CIFAR-10 10000개 이미지를 중심으로 한 혼합 가우시안에서 샘플링한 결과. (a) 실제 데이터, (b) σ₁=1(기존 값, 다양성 부족), (c) σ₁=50(Technique 1 권장값, 데이터에 필적하는 다양성) — 초기 노이즈 스케일 하나가 다양성을 얼마나 좌우하는지 보여준다.',
  src:'원문 Figure 2, p.4'},
 {f:'fig-samples.png',
  cap:'다섯 기법을 모두 적용한 NCSNv2로 생성한 FFHQ 256×256(왼쪽)과 LSUN bedroom 128×128(가운데) 샘플. 원 논문(NCSN)이 CIFAR-10 32×32에 머물렀던 것과 달리 처음으로 고해상도까지 확장됐다는 것이 이 그림의 핵심.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'It remains unclear how we should change ε and T for different sets of noise scales.',
  src:'Section 4, p.5'},
 {t:'As a result, it is necessary for σ1 to be numerically comparable to the maximum pairwise distances of data to facilitate transitioning of Langevin dynamics and hence improving sample diversity.',
  src:'Section 3.1, p.4'}
],

links:[
 {t:'arXiv 2006.09011 — Improved Techniques for Training Score-Based Generative Models', u:'https://arxiv.org/abs/2006.09011'},
 {t:'공식 코드 (ermongroup/ncsnv2)', u:'https://github.com/ermongroup/ncsnv2'}
]
});
