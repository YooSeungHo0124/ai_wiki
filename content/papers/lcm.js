WIKI.paper({
slug:'lcm',
venue:'arXiv 2023 (Preprint, Tsinghua)',
authors:'Luo et al. (Institute for Interdisciplinary Information Sciences, Tsinghua University)',
arxiv:'2310.04378',

tldr:'`[Consistency Models](#/p/consistency)`를 픽셀 공간에서 [Stable Diffusion](#/p/ldm)의 **잠재 공간**으로 옮겨, 사전학습된 어떤 SD든 **2~4 스텝**(심지어 1스텝)만으로 고해상도 이미지를 생성하게 만든 증류 기법. 768×768 LCM 학습에 A100 GPU **32시간**이면 충분하다.',

context:'`[Consistency Models](#/p/consistency)`는 PF-ODE 궤적 위의 임의 점을 궤적의 출발점(원본 데이터)으로 직접 매핑하는 함수를 학습해 단일 스텝 생성을 가능케 했지만, ImageNet 64×64·LSUN 256×256 같은 저해상도 무조건부 생성에 한정돼 있었고 [classifier-free guidance](#/p/cfg) 적용법도 불명확했다. 한편 SD 같은 [LDM](#/p/ldm)은 고해상도 텍스트-이미지 생성에서 최고 품질을 내지만 반복적 디노이징 때문에 느리다. 기존 가속 방법 중 Guided-Distillation(2단계 증류)은 2-스텝 추론 모델 하나를 얻는 데만 A100 GPU **45일** 규모의 연산이 필요할 만큼 비쌌다. 이 논문은 "SD를 통째로 다시 학습하지 않고, consistency 개념을 잠재 공간·가이던스 조건부로 확장하면 훨씬 싸게 같은 결과를 얻을 수 있는가"라는 질문에서 출발한다.',

ideas:[
 {h:'잠재 공간에서의 Consistency Distillation (LCD)',
  lead:'SD의 오토인코더 잠재 공간 위에서 PF-ODE 해를 직접 예측하는 함수를 증류한다.',
  d:'CM이 픽셀 공간에서 하던 일을, SD의 잠재 벡터 $z$ 위에서 그대로 한다. Consistency 함수 $f_\\theta(z_t, c, t) \\mapsto z_0$ 를 SD의 노이즈 예측 파라미터화로 구성하고, 교사 모델(사전학습된 SD)과 같은 초기 가중치에서 시작해 self-consistency 손실로 미세조정한다. 잠재 공간을 쓰는 것 자체는 [LDM](#/p/ldm)의 이점을 그대로 물려받는 것이다.'},
 {h:'한 번의 증류로 가이던스까지 통째로 배우는 augmented PF-ODE',
  lead:'CFG 항을 ODE 자체에 포함시켜 2단계 증류 대신 1단계로 끝낸다.',
  d:'기존 Guided-Distillation은 (1) 가이드된 교사를 따로 증류하고 (2) 그 결과를 다시 few-step으로 증류하는 2단계 과정이라 비용이 크고 오차가 누적된다. LCM은 CFG 수식 $\\tilde\\epsilon_\\theta=(1+\\omega)\\epsilon_\\theta(c)-\\omega\\epsilon_\\theta(\\varnothing)$ 을 PF-ODE에 직접 대입한 **augmented PF-ODE**를 정의하고, 가이던스 스케일 $\\omega$ 자체를 입력으로 받는 augmented consistency 함수 $f_\\theta(z_t,\\omega,c,t)$ 하나로 증류를 1단계에 끝낸다. 그 결과 2-스텝 모델 학습 비용이 A100 45일에서 **32시간**으로 줄었다.'},
 {h:'Skipping-Step: 시간 스텝을 건너뛰어 수렴을 가속',
  lead:'인접 스텝 대신 k칸 떨어진 스텝끼리 비교해 학습 신호를 키운다.',
  d:'SD의 1000단계 스케줄을 그대로 쓰면 인접한 $t_{n+1}, t_n$ 이 너무 가까워 두 예측이 이미 비슷해서 학습 신호가 약하고 수렴이 느리다. LCM은 ODE 솔버가 $k$ 스텝만큼 건너뛴 지점을 목표로 삼아(예: $k{=}20$) 한 번의 그래디언트 업데이트가 더 큰 궤적 구간에 대한 정보를 담게 만든다. 이 기법이 32 A100시간이라는 저비용을 가능케 한 핵심 트릭이다.'},
 {h:'Latent Consistency Fine-tuning (LCF)으로 커스텀 데이터에 이식',
  lead:'교사 모델 없이도 사전학습된 LCM을 커스텀 이미지셋에 few-step 그대로 미세조정한다.',
  d:'일반 파인튜닝처럼 커스텀 데이터셋에서 LCM 자체를 직접 미세조정하는 절차를 별도로 제안한다. 증류 대상이 되는 교사 모델을 따로 두지 않고도, 이미 few-step인 모델의 few-step 생성 능력을 유지한 채 새 도메인에 적응시킬 수 있다.'}
],

diagram:{type:'compare', cap:'2단계 증류(Guided-Distillation)와 LCM의 1단계 augmented 증류 비교.',
 left:{t:'2단계 증류', items:['가이드 교사 증류 → 별도 few-step 증류','A100 45일급 연산(2-step)','오차가 두 단계에 걸쳐 누적']},
 right:{t:'LCM: 1단계 증류', items:['augmented PF-ODE에 ω 포함','A100 32시간(2~4-step)','Skipping-Step으로 수렴 가속']}
},

math:[
 {expr:"f_θ(z,c,t) = c_skip(t)·z + c_out(t)·((z − σ_t·ε̂_θ(z,c,t)) / α_t)",
  tex:"f_{\\theta}(z,c,t)=c_{\\text{skip}}(t)\\,z+c_{\\text{out}}(t)\\left(\\frac{z-\\sigma_t\\hat\\epsilon_\\theta(z,c,t)}{\\alpha_t}\\right)",
  d:'노이즈 예측 모델 $\\hat\\epsilon_\\theta$ 를 이용해 consistency 함수를 구성한다. $c_{skip}(0){=}1, c_{out}(0){=}0$ 이라 $t{\\to}0$ 에서 항등함수가 되도록 설계되어 있다.'},
 {expr:"ε̃_θ(z,ω,c,t) = (1+ω)ε_θ(z,c,t) − ω·ε_θ(z,∅,t)",
  tex:"\\tilde\\epsilon_\\theta(z_t,\\omega,c,t) := (1+\\omega)\\epsilon_\\theta(z_t,c,t)-\\omega\\,\\epsilon_\\theta(z_t,\\varnothing,t)",
  d:'표준 [CFG](#/p/cfg) 노이즈 예측식. 이 항을 PF-ODE의 drift에 그대로 대입한 것이 augmented PF-ODE이고, LCM은 이를 만족하는 해를 직접 예측하도록 학습된다.'},
 {expr:"L_CD(θ,θ⁻;Ψ) = E[ d( f_θ(z_{t_{n+1}},c,t_{n+1}), f_θ⁻(ẑ_{t_n},c,t_n) ) ]",
  tex:"\\mathcal L_{CD}(\\theta,\\theta^-;\\Psi)=\\mathbb E_{z,c,n}\\Big[d\\big(f_\\theta(z_{t_{n+1}},c,t_{n+1}),\\,f_{\\theta^-}(\\hat z^{\\Psi}_{t_n},c,t_n)\\big)\\Big]",
  d:'궤적 위 인접 지점에서의 consistency 함수 값이 같아야 한다는 self-consistency 손실. $\\theta^-$ 는 $\\theta$ 의 EMA(target network)이고, $\\hat z_{t_n}$ 은 ODE 솔버 $\\Psi$(DDIM/DPM-Solver 등)로 한 스텝 적분한 추정치다.'}
],

numbers:[
 {k:'학습 비용 (768×768, 2~4-step)', v:'A100 32시간', d:'4000 스텝 — 2단계 Guided-Distill의 45 A100일 대비 압도적으로 저렴'},
 {k:'FID · 1-step (512², LAION-Aes 6+)', v:'35.36', d:'같은 조건 DDIM(183.29)·Guided-Distill(108.21) 대비 대폭 낮음'},
 {k:'FID · 4-step (512²)', v:'11.10', d:'DDIM 4-step(22.38) 대비 절반 수준, ω=8 기준'},
 {k:'CLIP Score · 1-step (512²)', v:'24.14', d:'DDIM 1-step(6.03)·Guided-Distill 1-step(12.08) 대비 크게 높음'},
 {k:'스텝 간 CLIP 격차', v:'2~8스텝 사이 거의 무시할 수준', d:'저자 주장 — 4-step 이후로는 품질 향상이 급격히 둔화됨을 시사'},
 {k:'Skipping-Step 값', v:'k=20', d:'Table 1·2 실험에서 사용한 값, DDIM-Solver 기준'}
],

impact:'few-step 확산 생성을 "느리지만 고품질"에서 "실시간에 가까운" 영역으로 옮겼다. 학습 비용이 A100 32시간 수준으로 낮아지면서 개인·소규모 팀도 자신의 파인튜닝된 SD 체크포인트에 few-step 능력을 이식하는 실험이 가능해졌고, 이는 곧이어 나온 **LCM-LoRA**(별도 후속 연구, 이 논문 자체에는 없음)가 어댑터 형태로 임의의 SD 파생 모델에 few-step 능력을 "얹는" 방식으로 이어졌다. ComfyUI·A1111 같은 도구에서 "4-step 생성" 옵션이 널리 쓰이는 실무적 기반이 이 논문이다.',

legacy:[
 '**LCM-LoRA로 이어진 어댑터화** — 후속 연구가 LCM 증류 자체를 [LoRA](#/p/lora) 가중치로 만들어, 재학습 없이 임의의 SD 체크포인트에 few-step 능력을 얹을 수 있게 함',
 '**SDXL·비디오 확산으로 확장** — 동일한 augmented PF-ODE 증류 레시피가 더 큰 백본과 [AnimateDiff](#/p/animatediff) 류의 비디오 모델에도 적용됨',
 '**Skipping-Step이 이후 증류 연구의 표준 트릭으로 재사용** — 인접 스텝 대신 멀리 떨어진 스텝을 비교하는 방식이 다른 few-step distillation 기법에도 채택됨',
 '**실시간 생성형 UI의 기반** — 4-step 이하 추론이 상용 서비스의 "빠른 미리보기" 모드로 정착'
],

pitfalls:[
 '**LCM-LoRA는 이 논문의 내용이 아니다.** 이 논문(2310.04378)은 LoRA를 전혀 언급하지 않으며, LCM-LoRA는 같은 저자 그룹의 별도 후속 논문이다. "LCM = LCM-LoRA"로 혼동하지 않는다.',
 '**1-step 생성은 품질 손실이 뚜렷하다.** 논문 자체 결과(Figure 1)에서도 1-step 이미지는 2-step 대비 디테일·얼굴 왜곡이 눈에 띈다. "1-step도 충분히 쓸만하다"는 과장이고, 실무에서는 보통 4-step 전후를 쓴다.',
 '**CFG 스케일 ω가 커질수록 CLIP Score는 오르지만 FID는 나빠지는 트레이드오프가 있다** — ω를 무조건 키우면 다양성이 줄어든다.'
],

figures:[
 {f:'fig1-fewstep-samples.png',
  cap:'같은 CFG 스케일(ω=8)에서 2-step(왼쪽 4장)과 1-step(오른쪽) 결과 비교. 2-step은 구조·질감이 안정적이지만 1-step 초상화(맨 오른쪽)는 얼굴 디테일이 뭉개지는 등 품질 손실이 육안으로 보인다 — "몇 스텝까지 줄여도 되는가"에 대한 원문의 직접적 증거.',
  src:'원문 Figure 1, p.2 (하단 2-Step/1-Step 행)'}
],

quotes:[
 {t:'Efficiently distilled from pre-trained classifier-free guided diffusion models, a high-quality 768x768 2~4-step LCM takes only 32 A100 GPU Hours for training.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2310.04378 — Latent Consistency Models', u:'https://arxiv.org/abs/2310.04378'},
 {t:'Project Page', u:'https://latent-consistency-models.github.io/'}
]
});
