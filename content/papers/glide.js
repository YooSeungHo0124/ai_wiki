WIKI.paper({
slug:'glide',
venue:'ICML 2022',
authors:'Nichol, Dhariwal, Ramesh et al. (OpenAI)',
arxiv:'2112.10741',

tldr:'텍스트로 이미지를 만드는 diffusion 모델에서 **classifier guidance 대신 classifier-free guidance를 쓰면** 별도의 (노이즈에 강인한) 분류기나 CLIP 없이도 더 사실적이고 캡션에 더 충실한 이미지가 나온다는 것을 사람 평가로 증명한 논문. 텍스트 지시에 따른 인페인팅 편집도 처음으로 자연스럽게 보였다.',

context:'[DDPM](#/p/ddpm) 이후 diffusion 모델은 이미지 품질은 좋았지만 클래스 라벨 같은 좁은 조건만 다뤘다. Dhariwal & Nichol(2021)의 classifier guidance는 노이즈가 낀 이미지에서도 동작하는 분류기의 gradient로 샘플을 원하는 클래스 쪽으로 밀어 품질을 크게 올렸지만, **분류기를 노이즈 이미지용으로 별도 학습**해야 하고 텍스트처럼 클래스가 아닌 조건에는 적용하기 어려웠다. 한편 [DALL·E](#/p/dalle)는 텍스트로 이미지를 생성했지만 자기회귀 방식이라 느리고, 품질을 올리려면 수천 장을 뽑아 [CLIP](#/p/clip)으로 재순위를 매기는(reranking) 비싼 후처리가 필요했다. 이 논문의 질문은 — **텍스트 조건 diffusion에서, CLIP의 gradient로 이미지를 유도하는 것(CLIP guidance)과 classifier-free guidance 중 어느 쪽이 실제로 더 나은가?**',

ideas:[
 {h:'Classifier-free guidance: 분류기 없이 스스로 유도',
  lead:'조건부·무조건부 예측의 차이를 증폭해 별도 분류기 없이 텍스트를 향해 샘플을 민다.',
  d:'학습 중 캡션을 일정 확률로 빈 시퀀스 $\\emptyset$ 로 바꿔, 한 모델이 조건부 $\\epsilon_\\theta(x_t|c)$ 와 무조건부 $\\epsilon_\\theta(x_t|\\emptyset)$ 를 모두 배우게 한다. 샘플링 시에는 무조건부 예측에서 조건부 예측 방향으로 스케일 $s$ 만큼 더 밀고 나간다. 별도 분류기가 필요 없고, 텍스트처럼 분류기를 학습하기 어려운 조건에도 그대로 쓸 수 있다.'},
 {h:'CLIP guidance는 대안이지만 노이즈에 약하다',
  lead:'공개 CLIP은 노이즈 이미지를 본 적이 없어 diffusion 유도에 쓰면 성능이 떨어진다.',
  d:'CLIP guidance는 classifier guidance의 분류기 자리에 이미지·텍스트 인코딩의 내적 gradient $\\nabla_{x_t}(f(x_t)\\cdot g(c))$ 를 넣는 방식이다. 그런데 일반 CLIP은 깨끗한 이미지로만 학습돼서, 샘플링 도중의 노이즈 낀 $x_t$ 에는 분포 밖(out-of-distribution)이 된다. 그래서 이 논문은 **노이즈를 섞은 이미지로 CLIP을 다시 학습**한 noised CLIP을 별도로 만들어 비교한다.'},
 {h:'사람 평가로 승부를 낸다',
  lead:'FID·CLIP score 같은 자동 지표 대신 사람이 직접 사실성과 캡션 일치를 비교했다.',
  d:'자동 지표만으로는 두 guidance 방식의 우열이 갈리지 않아, MS-COCO 프롬프트로 사람 평가자에게 두 이미지 중 더 사실적인 쪽, 캡션과 더 맞는 쪽을 직접 고르게 했다. 결과는 일관되게 classifier-free guidance 승리였고, 이는 CLIP score가 높다고 사람이 선호하는 것은 아니라는 뜻이기도 하다.'},
 {h:'같은 아키텍처를 미세조정만으로 인페인팅에 확장',
  lead:'입력에 마스크 채널을 추가해 미세조정하는 것만으로 텍스트 지시 편집이 가능해진다.',
  d:'학습 중 이미지 일부를 지우고, 지워진 이미지 + 마스크 채널을 추가 조건으로 넣어 미세조정한다. 이렇게 하면 순수 샘플링만으로 인페인팅을 흉내내던 기존 방식의 경계 흠(edge artifact) 없이, 주변 조명·스타일에 맞춘 자연스러운 편집이 나온다. "거실 사진 생성 → 벽에 그림 추가 → 탁자에 꽃병 추가"처럼 **반복 편집으로 장면을 조립**할 수 있다.'}
],

diagram:{type:'compare', cap:'같은 3.5B 텍스트 조건 diffusion 모델에 두 가지 유도 방식을 붙여 비교한다.',
 left:{t:'CLIP guidance', items:['노이즈 CLIP 별도 학습 필요','이미지·텍스트 내적 gradient로 유도','사람 평가에서 열세']},
 right:{t:'CFG', items:['추가 모델 없이 자기 자신만 사용','조건부·무조건부 차이를 증폭','사실성 87% · 캡션 일치 69%로 DALL·E 능가'], acc:true}
},

math:[
 {expr:'μ̂θ(xt|y) = μθ(xt|y) + s·Σθ(xt|y)∇xt log pφ(y|xt)',
  tex:'\\hat{\\mu}_\\theta(x_t|y) = \\mu_\\theta(x_t|y) + s\\cdot\\Sigma_\\theta(x_t|y)\\nabla_{x_t}\\log p_\\phi(y|x_t)',
  d:'classifier guidance의 원래 형태(Dhariwal & Nichol, 2021). 노이즈 이미지 $x_t$ 에서 분류기 $p_\\phi$ 의 로그확률 gradient만큼 평균을 밀어 준다. GLIDE는 이 분류기를 CLIP 또는 아예 없앤 형태로 바꿔 비교한다.'},
 {expr:'ε̂θ(xt|c) = εθ(xt|∅) + s·(εθ(xt|c) − εθ(xt|∅))',
  tex:'\\hat{\\epsilon}_\\theta(x_t|c) = \\epsilon_\\theta(x_t|\\emptyset) + s\\cdot(\\epsilon_\\theta(x_t|c) - \\epsilon_\\theta(x_t|\\emptyset))',
  d:'이 논문이 채택한 classifier-free guidance 식. $s \\ge 1$ 이 guidance scale이며, 커질수록 캡션 충실도(fidelity)는 올라가고 다양성(diversity)은 떨어지는 trade-off가 생긴다. 별도 분류기·CLIP 없이 같은 모델의 두 예측만으로 계산된다.'},
 {expr:'μ̂θ(xt|c) = μθ(xt|c) + s·Σθ(xt|c)∇xt(f(xt)·g(c))',
  tex:'\\hat{\\mu}_\\theta(x_t|c) = \\mu_\\theta(x_t|c) + s\\cdot\\Sigma_\\theta(x_t|c)\\nabla_{x_t}\\big(f(x_t)\\cdot g(c)\\big)',
  d:'CLIP guidance 식. $f$ 는 이미지 인코더, $g$ 는 텍스트 인코더이고 둘의 내적(코사인 유사도)의 gradient로 이미지를 텍스트 쪽으로 민다. 노이즈 인식이 안 되는 공개 CLIP을 쓰면 이 gradient가 부정확해진다.'}
],

numbers:[
 {k:'주 모델 크기', v:'3.5B (텍스트 인코더 1.2B + 시각부 2.3B)', d:'DALL·E(12B) 대비 **약 1/3.4** 크기로 더 선호되는 샘플'},
 {k:'해상도 파이프라인', v:'64×64 → 256×256', d:'1.5B 업샘플링 diffusion 모델을 별도로 학습'},
 {k:'사람 평가 · 사실성', v:'87%', d:'DALL·E(CLIP 재순위 포함) 대비 classifier-free guidance 선호율'},
 {k:'사람 평가 · 캡션 일치', v:'69%', d:'같은 비교에서 caption similarity 기준'},
 {k:'MS-COCO FID', v:'12.24', d:'zero-shot 기준, guidance scale 1.5일 때 최적'},
 {k:'text encoder', v:'24층 Transformer · width 2048', d:'토큰 시퀀스를 ADM의 클래스 임베딩·attention 컨텍스트 자리에 주입'}
],

impact:'guidance 방식의 선택이 diffusion 이미지 생성에서 아키텍처만큼 중요하다는 것을 처음 실증했다. 이후 거의 모든 텍스트-이미지 diffusion 모델([DALL·E 2](#/p/dalle2), [Imagen](#/p/imagen), [Stable Diffusion](#/p/ldm))이 CLIP guidance가 아니라 **classifier-free guidance**를 기본값으로 채택했다. 또한 diffusion 기반 인페인팅을 "샘플링 트릭"이 아니라 "마스크 채널을 추가해 미세조정하는 표준 절차"로 정착시켜, 이후 편집형 생성 모델들의 기본 설계가 되었다.',

legacy:[
 '**guidance 표준화** — [Classifier-Free Guidance](#/p/cfg) 논문(Ho & Salimans)의 아이디어를 텍스트-이미지에서 대규모로 검증해, [Imagen](#/p/imagen)·[Stable Diffusion](#/p/ldm)·[SDXL](#/p/sdxl)이 모두 CFG를 기본으로 사용',
 '**unCLIP으로 이어짐** — 같은 저자진(Ramesh, Dhariwal, Nichol)이 CLIP 잠재공간을 직접 이용하는 [DALL·E 2](#/p/dalle2)로 발전',
 '**인페인팅 미세조정 레시피** — 마스크 채널을 입력에 추가해 미세조정하는 방식이 [ControlNet](#/p/controlnet) 등 조건부 편집 연구의 출발점이 됨',
 '**공개 소형 모델(GLIDE filtered)** — 안전 필터링된 데이터로 작은 모델을 공개해, 이후 오픈소스 diffusion 생태계(특히 [Stable Diffusion](#/p/ldm))의 공개 관행에 영향'
],

pitfalls:[
 '**"CLIP guidance가 diffusion 유도의 정답"이라는 통념과 반대 결론**이다. 이 논문은 사람 평가에서 CLIP guidance가 classifier-free guidance에 진다는 것을 명시적으로 보였다.',
 '노이즈 CLIP guidance를 시도하려면 **일반 공개 CLIP을 그대로 쓰면 안 되고** 노이즈 이미지로 재학습한 CLIP이 필요하다 — 이 재학습 비용 자체가 CLIP guidance의 실용성을 떨어뜨리는 요인이다.',
 '3.5B 주 모델은 픽셀 공간 64×64에서 동작하고 256×256은 별도 업샘플러가 만든다. [Stable Diffusion](#/p/ldm)처럼 압축된 잠재공간에서 동작하는 구조와 혼동하지 않는다.'
],

figures:[
 {f:'fig1-samples.png',
  cap:'classifier-free guidance로 뽑은 zero-shot 샘플 4장. 그림자·반사광 같은 사실적 디테일과 "모자를 쓴 코끼리"류의 개념 합성이 별도 재순위 없이 한 번에 나온다는 것이 핵심.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-inpainting.png',
  cap:'왼쪽 쌍: 초록 마스크로 지운 영역(들판)을 "얼룩말이 뛰노는 들판"으로 채운다. 오른쪽 쌍: 인물화 속 강아지를 지우고 "코기와 포옹"으로 바꿔도 주변 붓터치·조명이 그대로 이어진다 — 재생성이 아니라 편집임을 보여 주는 대목.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'We find that the latter is preferred by human evaluators for both photorealism and caption similarity, and often produces photorealistic samples.',
  src:'Abstract, p.1'},
 {t:'Samples from a 3.5 billion parameter text-conditional diffusion model using classifier-free guidance are favored by human evaluators to those from DALL-E, even when the latter uses expensive CLIP reranking.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2112.10741 — GLIDE', u:'https://arxiv.org/abs/2112.10741'},
 {t:'GitHub — openai/glide-text2im', u:'https://github.com/openai/glide-text2im'}
]
});
