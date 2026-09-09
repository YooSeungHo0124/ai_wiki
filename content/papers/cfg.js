WIKI.paper({
slug:'cfg',
venue:'NeurIPS 2021 Workshop on Deep Generative Models',
authors:'Ho, Salimans (Google Research · Brain)',
arxiv:'2207.12598',

tldr:'조건부 생성의 품질을 올리려고 별도 분류기를 붙이던 관행을, **하나의 네트워크가 내놓는 조건부 예측과 무조건부 예측의 차이를 외삽하는 것**으로 대체했다. 학습 중 조건을 10~20% 확률로 버리기만 하면 되는 세 줄짜리 변경이고, guidance scale이라는 다이얼 하나로 다양성과 프롬프트 충실도를 맞바꾼다. 오늘날 모든 text-to-image 모델이 켜고 쓰는 기능이다.',

context:'[DDPM](#/p/ddpm)/[Score SDE](#/p/score-sde)로 학습한 조건부 확산 모델은 클래스나 텍스트를 그냥 입력으로 받으면 조건을 **느슨하게만** 따랐다. 샘플이 다양하긴 한데 지정한 클래스의 전형적인 모습에서 멀어지는, 즉 [GAN](#/p/gan)의 truncation trick 같은 "품질을 위해 다양성을 깎는" 손잡이가 없었다. Dhariwal & Nichol의 classifier guidance가 이 문제를 풀었다 — 노이즈 낀 이미지로 따로 학습한 분류기의 그래디언트 $\\nabla_x \\log p(y|x_t)$ 를 스코어에 더하면 샘플이 클래스 쪽으로 끌려간다. 다만 대가가 컸다. **분류기를 노이즈 수준마다 따로 학습해야 하고**, 텍스트처럼 클래스가 아닌 조건에는 적용하기 어렵고, 결정적으로 분류기 그래디언트를 타고 올라가는 것은 사실상 적대적 예제를 만드는 절차라 "IS/FID 점수만 좋아지는 것 아닌가"라는 의심을 받았다.',

ideas:[
 {h:'조건을 무작위로 버리며 한 모델에 두 모델을 담는다',
  lead:'학습 중 조건을 확률적으로 널 토큰으로 바꿔 한 네트워크가 조건부·무조건부를 동시에 배운다.',
  d:'학습할 때 각 샘플의 조건 $c$ 를 확률 $p_{uncond}$ 로 **널 토큰 $\\emptyset$ 으로 바꿔치기**한다. 그러면 같은 가중치가 조건부 $\\epsilon_\\theta(x_t,c)$ 와 무조건부 $\\epsilon_\\theta(x_t,\\emptyset)$ 를 동시에 표현하게 된다. 추가 파라미터도, 별도 학습 단계도 없다. 논문은 $p_{uncond}$ 를 0.1이나 0.2로 두는 것이 0.5보다 낫다고 보고한다 — 무조건부 능력은 guidance에 쓸 만큼만 있으면 충분하고, 용량 대부분은 조건부에 써야 한다.'},
 {h:'분류기를 쓰지 않고 분류기의 그래디언트를 만든다',
  lead:'베이즈 정리로 분류기 그래디언트를 두 노이즈 예측의 차이로 재현한다.',
  d:'베이즈 정리에서 $\\nabla_x\\log p(c|x) \\propto \\nabla_x\\log p(x|c) - \\nabla_x\\log p(x)$ 다. 우변은 이미 가진 두 스코어의 **차이**이므로, 분류기를 학습하는 대신 두 번 forward하면 된다. classifier guidance가 하던 일을 정확히 같은 형태로 재현하면서 외부 모델을 없앤 것이 이 논문의 전부이자 핵심이다.'},
 {h:'보간이 아니라 외삽이다',
  lead:'조건부·무조건부 예측의 차이를 s배 증폭해 조건 방향으로 지나쳐 간다.',
  d:'최종 예측 $\\tilde\\epsilon = \\epsilon_\\emptyset + s(\\epsilon_c - \\epsilon_\\emptyset)$ 에서 $s>1$ 이면 조건부 예측을 **지나쳐서** 간다. 즉 "조건이 있을 때와 없을 때의 차이"를 증폭해, 조건과 무관한 성분은 억누르고 조건이 만들어낸 성분만 과장한다. $s=1$ 이면 guidance가 없는 평범한 조건부 모델이고, $s<1$ 은 오히려 조건을 흐린다.'},
 {h:'guidance scale = 다양성과 충실도의 교환 손잡이',
  lead:'s를 올릴수록 전형성(IS)은 오르고 분포 일치도(FID)는 어느 지점부터 무너진다.',
  d:'$s$ 를 올리면 확률밀도의 봉우리 쪽으로 샘플이 몰린다. 결과적으로 **Inception Score(전형성·선명도)는 계속 올라가고 FID(분포 일치도·다양성)는 어느 지점을 지나면 급격히 나빠진다**. 논문의 ImageNet 128×128 실험이 이를 극단적으로 보여준다 — $w=0.3$ 에서 FID 2.43이 최저인데, $w=4.0$ 으로 올리면 IS가 421까지 치솟는 대신 FID는 21.53으로 무너진다. **어느 한 값이 정답이 아니라 무엇을 얻고 무엇을 버릴지의 선택**이다.'},
 {h:'대가는 정확히 2배의 연산',
  lead:'스텝마다 조건부·무조건부를 각각 forward해야 해서 샘플링 비용이 2배가 된다.',
  d:'매 디노이징 스텝마다 조건부·무조건부 forward를 각각 해야 하므로 샘플링 비용이 2배다. 실무에서는 두 입력을 배치로 묶어 한 번에 돌리는데, 그만큼 배치 메모리를 더 쓴다. [DDIM](#/p/ddim)이 스텝을 20배 줄여둔 덕에 이 2배가 감당 가능한 비용이 됐다는 점에서 두 논문은 사실상 짝이다.'}
],

diagram:{type:'split', cap:'같은 가중치로 두 번 예측한 뒤, 그 차이를 s배 증폭해 다시 더한다. 새 모델도 분류기도 없다. (ε_θ(x_t,·), 조건 10~20%를 ∅ 로 교체해 학습)',
 from:{t:'노이즈 예측 U-Net', s:'조건 일부를 ∅ 로 교체 학습'},
 branches:[
  {t:'조건부 예측', s:'ε_θ(x_t, c)'},
  {t:'무조건부 예측', s:'ε_θ(x_t, ∅)'}
 ],
 join:'ε̃ = ε_∅ + s · (ε_c − ε_∅)   ← s>1 이면 조건 방향으로 외삽'},

figures:[
 {f:'fig1-guidance-strength-samples.png',
  cap:'같은 말라뮤트 클래스, 같은 모델에서 왼쪽부터 오른쪽으로 guidance 강도만 올려가며 뽑은 샘플들. 왼쪽(비guided)은 자세·배경·품종 디테일이 뒤섞여 있고, 오른쪽으로 갈수록 "전형적인 말라뮤트" 이미지로 수렴한다 — 다양성이 줄어드는 대신 클래스 충실도가 올라가는 것을 눈으로 보여준다.',
  src:'원문 Figure 1, p.1'}
],

math:[
 {expr:'ε̃_θ(x_t, c) = (1 + w) · ε_θ(x_t, c) − w · ε_θ(x_t, ∅)',
  tex:'\\tilde\\epsilon_\\theta(x_t,c) = (1+w)\\,\\epsilon_\\theta(x_t,c) - w\\,\\epsilon_\\theta(x_t,\\emptyset)',
  d:'논문 표기. 구현에서 흔히 쓰는 guidance scale은 $s = 1+w$ 이며, $s=7.5$ 는 $w=6.5$ 에 해당한다. **$w=0$ 이 guidance 없음**이라는 점에서 두 표기를 혼동하기 쉽다.'},
 {expr:'∇ₓ log p(c | x_t) ∝ ∇ₓ log p(x_t | c) − ∇ₓ log p(x_t)',
  tex:'\\nabla_x \\log p(c \\mid x_t) \\propto \\nabla_x \\log p(x_t \\mid c) - \\nabla_x \\log p(x_t)',
  d:'왜 이것이 분류기를 대신하는가에 대한 답. 우변이 곧 두 노이즈 예측의 차이이므로, 암묵적 분류기의 그래디언트를 별도 모델 없이 얻는다.'},
 {expr:'p̃(x | c) ∝ p(x | c) · p(c | x)^w',
  tex:'\\tilde p(x \\mid c) \\propto p(x \\mid c) \\cdot p(c \\mid x)^w',
  d:'guidance가 바꾸는 목표 분포. $w$ 만큼 "조건에 잘 맞는 정도"로 재가중된 분포에서 샘플링하는 셈이라, 데이터의 진짜 분포와는 의도적으로 달라진다. FID가 나빠지는 이유가 여기 있다.'}
],

quotes:[
 {t:'We show that guidance can be indeed performed by a pure generative model without such a classifier: in what we call classifier-free guidance, we jointly train a conditional and an unconditional diffusion model.',
  src:'Abstract, p.1'}
],

numbers:[
 {k:'ImageNet 64×64 최저 FID', v:'1.55 (w=0.1)', d:'$p_{uncond}=0.1$. FID가 좋은 지점은 **아주 약한 guidance**다'},
 {k:'ImageNet 64×64 최고 IS', v:'260.2 (w=4.0)', d:'같은 모델, 같은 가중치. 손잡이만 돌린 결과'},
 {k:'ImageNet 128×128 최저 FID', v:'2.43 (w=0.3)', d:'T=256 스텝'},
 {k:'ImageNet 128×128 · w=4.0', v:'IS 421.03 / FID 21.53', d:'교환 관계의 극단. 선명하지만 분포는 크게 무너진다'},
 {k:'무조건부 학습 비율', v:'p_uncond = 0.1 ~ 0.2', d:'0.5는 두 설정 모두에서 더 나빴다'},
 {k:'샘플링 비용', v:'스텝당 forward 2회', d:'조건부 + 무조건부. 실무에서는 배치로 묶어 처리'}
],

impact:'text-to-image가 실제로 프롬프트를 따르게 만든 부품이다. 조건이 클래스 레이블일 필요가 없어지면서 [CLIP](#/p/clip) 텍스트 임베딩, 세그멘테이션 맵, 레이아웃 등 **어떤 조건이든 널 값만 정의하면** 같은 방식으로 강화할 수 있게 됐고, GLIDE·Imagen·DALL·E 2·[Stable Diffusion](#/p/ldm)이 전부 이것을 기본으로 채택했다. 개념적으로 더 중요한 것은 **guidance가 학습이 아니라 추론 시점의 선택**이 됐다는 점이다. 모델을 하나만 학습해두고 사용자가 슬라이더로 원하는 지점을 고르는 구조가 여기서 굳었고, 이후 ControlNet·negative prompt·이미지 편집 기법이 모두 "무조건부 항을 무엇으로 대체할까"라는 같은 자리에 끼워 넣는 방식으로 만들어졌다.',

legacy:[
 '**text-to-image의 표준 부품** — GLIDE·Imagen·DALL·E 2·[Stable Diffusion](#/p/ldm)이 예외 없이 채택, guidance scale이 사용자 노출 파라미터가 됨',
 '**negative prompt** — 무조건부 항 $\\epsilon_\\emptyset$ 자리에 "원하지 않는 것"의 조건부 예측을 넣는 변형으로, 별도 논문 없이 실무에서 파생된 대표 응용',
 '**증류의 표적** — guidance가 forward를 2배로 늘리는 문제를 없애려는 guidance distillation, 그리고 [Consistency Models](#/p/consistency) 계열 소수 스텝 모델의 설계 제약이 됨',
 '**후속 개선** — guidance를 노이즈 수준에 따라 다르게 주는 guidance interval, CFG++ 등 "스케일 하나를 상수로 두는 것이 최선인가"를 파고드는 연구 계열이 형성'
],

pitfalls:[
 '**guidance scale을 올리는 것은 품질 개선이 아니라 분포 왜곡이다.** 색이 과포화되고 구도가 판에 박히며 같은 프롬프트의 결과가 서로 비슷해진다. 벤치마크 FID가 나빠지는데도 사람 눈에는 좋아 보이는 구간이 있어서, 논문 수치와 실사용 감각이 어긋나기 쉽다.',
 '**$w$ 와 $s$ 는 1만큼 어긋난 표기다.** 논문의 $w=0$ 이 guidance 없음인 반면 구현체의 `guidance_scale=1.0` 이 guidance 없음이다. 논문 값을 코드에 그대로 넣으면 의도한 것보다 약한 guidance가 걸린다.',
 '**결정론적 샘플러와 함께 쓰면 역변환이 깨진다.** guidance가 강할수록 [DDIM](#/p/ddim) inversion의 정방향·역방향 궤적이 크게 벌어져 원본 이미지가 재현되지 않는다. 편집 파이프라인에서 흔히 밟는 함정이다.'
],

links:[
 {t:'arXiv 2207.12598 — Classifier-Free Diffusion Guidance', u:'https://arxiv.org/abs/2207.12598'},
 {t:'Diffusion Models Beat GANs on Image Synthesis (classifier guidance 원본)', u:'https://arxiv.org/abs/2105.05233'},
 {t:'An overview of classifier-free guidance (AI Summer)', u:'https://theaisummer.com/classifier-free-guidance/'}
]
});
