WIKI.paper({
slug:'make-a-scene',
venue:'ECCV 2022',
authors:'Gafni, Polyak, Ashual, Sheynin, Parikh, Taigman (Meta AI Research)',
arxiv:'2203.13131',

tldr:'[DALL·E](#/p/dalle)류의 텍스트-이미지 토큰 자기회귀 생성에 **장면 분할 레이아웃(scene) 토큰**을 세 번째 축으로 끼워 넣어, 텍스트만으로는 지정할 수 없던 "무엇이 어디에 있는지"를 사용자가 직접 스케치로 제어하게 만든 논문. VQGAN 토크나이저에 얼굴·물체 전용 손실을 더해 사람이 민감하게 보는 부분의 화질을 끌어올렸다.',

context:'2021~2022년 텍스트-이미지 생성은 [DALL·E](#/p/dalle)·CogView 같은 VQ 토큰 자기회귀 계열과 GLIDE 같은 diffusion 계열로 갈라져 경쟁하고 있었다. 둘 다 입력이 **텍스트 하나뿐**이라는 공통 한계가 있었다 — "피자 바퀴를 단 얼룩말 자전거"처럼 학습 분포 밖의 조합이나, 물체들의 정확한 배치·구도는 텍스트만으로 지정하기 어렵다. 한편 [VQGAN](#/p/vqgan)은 지각·적대 손실로 토크나이저 화질을 끌어올렸지만 사람 얼굴처럼 작고 민감한 영역은 여전히 뭉개졌다. 이 논문은 두 문제를 함께 겨냥한다 — **텍스트 옆에 장면 레이아웃이라는 두 번째 조건을 추가하고, 토크나이저 손실에 사람 지각 우선순위(human priors)를 명시적으로 반영**하면 되지 않는가.',

ideas:[
 {h:'세 번째 토큰 공간: 장면(scene)',
  lead:'텍스트·장면·이미지 세 토큰 스트림을 한 시퀀스로 이어 붙여 자기회귀로 학습한다.',
  d:'panoptic·human·face 세 종류의 의미 분할(segmentation)을 합친 장면 맵을 VQ-SEG로 토큰화하고, 텍스트 토큰(BPE) 뒤·이미지 토큰(VQ-IMG) 앞에 끼워 넣는다. 시퀀스는 `[텍스트, 장면, 이미지]` 순서로 고정되며, 학습 시 모델은 장면도 스스로 생성하도록 배운다 — 그래서 추론 때 장면 입력은 **선택적**이다. 텍스트만 줘도 되고, 사용자가 손으로 그린 스케치를 장면으로 줘도 된다.'},
 {h:'장면은 암묵적 조건화다',
  lead:'장면 정보를 무시할 수도 있게 학습해, 텍스트·장면이 각각 독립적으로 이미지를 통제하게 한다.',
  d:'장면 토큰을 이미지 토큰보다 먼저 배치하되 모델이 이를 무시하고 텍스트만으로 생성할 수도 있게 학습한다. 논문은 이를 "implicit conditioning"이라 부른다 — 장면에 포함된 카테고리의 선택 자체가 이미 사람의 지각 우선순위를 반영한 사전(prior) 역할을 한다는 것. 실험적으로 텍스트와 장면 둘 다 결과 이미지를 확실히 통제하는 것으로 확인됐다.'},
 {h:'Human priors: 얼굴·물체 전용 손실',
  lead:'얼굴 임베딩 네트워크와 VGG 특징 매칭으로 VQGAN 손실에 지각 우선순위를 더한다.',
  d:'VQGAN 재구성 손실만으로는 이미지 전체 픽셀 오차를 고르게 줄일 뿐, 사람이 유독 민감하게 보는 얼굴 같은 작은 영역은 개선되지 않는다. VQ-IMG(face-aware VQGAN)는 얼굴 크롭에 대해 사전학습 얼굴 임베딩망의 여러 층 활성화 차이를 손실로 추가하고(식 1), 같은 방식을 VGG 특징으로 일반화해 물체(object-aware) 크롭에도 적용한다(식 3). 장면 쪽 VQ-SEG도 얼굴 부위 클래스에 가중 이진 교차엔트로피(식 2)를 더해, 눈·코·입처럼 픽셀 수가 적어 사라지기 쉬운 클래스를 보존한다.'},
 {h:'Transformer classifier-free guidance',
  lead:'텍스트를 패딩으로 대체한 무조건 스트림과 조건 스트림의 로짓 차이로 다음 토큰을 유도한다.',
  d:'diffusion에서 쓰이던 classifier-free guidance를 자기회귀 transformer에 옮긴다. 학습 중 확률 $p_{CF}$ 로 텍스트를 패딩 토큰으로 바꿔 무조건 생성도 배우게 한 뒤, 추론 시 조건/무조건 두 스트림의 로짓을 동시에 계산해 `logits_uncond + α·(logits_cond − logits_uncond)`로 다음 토큰을 뽑는다. 한 토큰을 뽑아 두 스트림에 동일하게 먹이는 방식이라, diffusion처럼 샘플링 과정 전체를 두 번 돌릴 필요가 없다.'},
 {h:'물체 인식 손실로 해상도까지 확장',
  lead:'물체 크롭 단위 지각 손실을 더하며 인코더·디코더에 다운/업샘플 층을 얹어 512×512로 키운다.',
  d:'object-aware 손실을 크롭 단위로 계산하는 구조 덕분에, VQ-IMG의 인코더·디코더에 다운샘플·업샘플 층을 한 겹 추가하는 것만으로 출력 해상도를 $256\\times256$ 에서 $512\\times512$ 로 올릴 수 있었다. 토큰 수를 유지한 채 해상도를 늘리는 실용적인 트릭이다.'}
],

diagram:{type:'flow', cap:'텍스트·장면·이미지 세 인코더가 각각 토큰을 만들고, 한 자기회귀 transformer가 이어붙인 시퀀스를 학습·생성한다. 장면 입력은 추론 시 선택적.',
 nodes:[
  {t:'텍스트', s:'BPE 토큰'},
  {t:'장면(선택)', s:'VQ-SEG 토큰', acc:true},
  {t:'토큰 이어붙이기', s:'text+scene+image'},
  {t:'AR Transformer', s:'GPT-3 구조 · 4B'},
  {t:'VQ-IMG 디코더', s:'256² 또는 512²'}
 ]},

math:[
 {expr:'L_Face = Σ_k Σ_l α_f^l ‖FE^l(ĉ_f^k) − FE^l(c_f^k)‖',
  tex:'\\mathcal{L}_{\\text{Face}} = \\sum_k \\sum_l \\alpha_f^l \\left\\| \\text{FE}^l(\\hat{c}_f^k) - \\text{FE}^l(c_f^k) \\right\\|',
  d:'얼굴 임베딩망 FE의 여러 해상도 층(112²…1×1)에서, 복원된 얼굴 크롭 $\\hat{c}_f^k$ 과 원본 $c_f^k$ 의 특징 차이를 합산한다. VQGAN 손실에 더해지는 얼굴 전용 보강 항.'},
 {expr:'logits_cf = logits_uncond + α_c · (logits_cond − logits_uncond)',
  tex:'\\text{logits}_{cf} = \\text{logits}_{uncond} + \\alpha_c \\cdot (\\text{logits}_{cond} - \\text{logits}_{uncond})',
  d:'조건 스트림 $T(t_y,t_z\\mid t_x)$ 과 텍스트를 뺀 무조건 스트림 $T(t_y,t_z\\mid\\varnothing)$ 의 로짓 차이를 guidance scale $\\alpha_c$ 배 만큼 증폭해 다음 토큰을 뽑는다. [CFG](#/p/cfg)의 원래 형태를 로짓 공간으로 옮긴 것.'}
],

numbers:[
 {k:'모델 크기', v:'4B 파라미터', d:'GPT-3 구조 기반 자기회귀 transformer'},
 {k:'토큰 시퀀스', v:'텍스트 256 + 장면 256 + 이미지 1024', d:'256×256/512×512 두 해상도 모델 모두 같은 토큰 수 사용'},
 {k:'학습 데이터', v:'3,500만 텍스트-이미지 쌍', d:'CC12M·CC·YFCC100M·RedCaps 일부의 합집합'},
 {k:'MS-COCO FID (필터링 없음)', v:'7.55', d:'DALL·E 재구현 34.60, GLIDE 12.24 대비 최저'},
 {k:'MS-COCO FID (필터링)', v:'11.84', d:'MS-COCO로 학습하지 않은 모델군 중 최저. 참고로 학습·검증 세트 간 이론적 하한은 2.47'},
 {k:'CFG 추가 효과', v:'FID 14.45 → 7.55', d:'ablation에서 classifier-free guidance 도입만으로 얻은 개선폭'}
],

impact:'텍스트 하나로 모든 것을 지정하던 프레임을 깨고 **"텍스트 + 공간 레이아웃"이라는 이중 조건**을 자기회귀 토큰 생성에 결합한 첫 대규모 사례다. 장면 편집·텍스트 편집(앵커 장면 유지)·분포 밖 조합 생성 같은 새 조작 방식을 열었고, 얼굴처럼 좁지만 지각적으로 중요한 영역에 별도 손실을 주는 아이디어는 이후 토크나이저 설계에서 반복되는 패턴이 됐다. 동시에 자기회귀 토큰 노선이 diffusion과 나란히 512×512급 고해상도·저FID를 낼 수 있음을 보여, diffusion 일변도로 굳어지던 흐름에 균형추 역할을 했다.',

legacy:[
 '**공간 조건화의 확산** — 텍스트만으로는 불가능한 레이아웃 제어라는 문제의식이 이후 [ControlNet](#/p/controlnet) 같은 diffusion 기반 공간 조건화 연구로 이어짐(메커니즘은 다르지만 목표는 동일)',
 '**같은 팀의 Parti(2022)** — [Parti](#/p/parti)가 같은 VQ 자기회귀 노선을 20B까지 스케일업하며 장면 조건 없이도 순수 스케일로 품질을 밀어붙임',
 '**Make-A-Video(2022)** — 같은 저자진이 이미지 생성기를 시공간으로 확장해 텍스트-비디오 생성으로 이어감',
 '**human priors 손실의 일반화** — 얼굴·물체별 지각 손실을 추가하는 방식이 이후 토크나이저 화질 개선 연구에서 반복 채택됨'
],

pitfalls:[
 '**diffusion 모델이 아니다.** [DALL·E](#/p/dalle)·[VQGAN](#/p/vqgan)과 같은 계열의 **VQ 토큰 기반 자기회귀 transformer**다. GLIDE·[DALL·E 2](#/p/dalle2) 이후 텍스트-이미지 생성을 diffusion과 동일시하기 쉬운데, 이 논문의 생성 메커니즘은 노이즈 제거가 아니라 다음 토큰 예측이다.',
 '**"scene"은 필수 입력이 아니라 선택적 조건이다.** 논문은 장면 없이 텍스트만으로도 생성 가능하다는 점을 강조한다 — 장면 입력이 있어야만 동작하는 시스템으로 오해하면 안 된다.',
 '**FID가 낮다고 반드시 더 나은 이미지는 아니다.** 저자들도 ablation에서 가장 낮은 FID를 낸 256×256 모델보다, object-aware 손실을 쓴 512×512 모델을 사람 평가자들이 더 선호했다고 명시한다.'
],

figures:[
 {f:'fig6-architecture.png',
  cap:'텍스트 인코더(파랑)·VQ-SEG 인코더(빨강)·VQ-IMG 인코더/디코더(초록) 세 갈래가 각각 텍스트·장면·이미지 토큰을 만들고, 이를 이어붙인 시퀀스 하나를 보라색 Auto-Regressive Scene-Based Transformer가 학습·생성한다. 위쪽 이미지 3장은 각각 "Optional During Inference"(장면 스케치), "Training Only"(원본 사진), "Inference Only"(생성 결과)로, 장면 입력이 학습·추론에서 어떻게 다르게 쓰이는지 보여준다.',
  src:'원문 Figure 6, p.7'},
 {f:'fig1-scene-control.png',
  cap:'"피자 바퀴를 단 두 머리 얼룩말이 타일 도로에서 자전거를 타는" 같은, 텍스트만으로는 배치를 특정하기 힘든 프롬프트에 작은 장면 스케치(가운데 보라색 썸네일)를 함께 주면 네 가지 다른 배치의 이미지가 나온다 — 같은 텍스트라도 장면이 구도를 결정한다는 것을 보여주는 예시.',
  src:'원문 Figure 1(b), p.1'}
],

quotes:[
 {t:'We propose a novel text-to-image method that addresses these gaps by (i) enabling a simple control mechanism complementary to text in the form of a scene, (ii) introducing elements that substantially improve the tokenization process by employing domain-specific knowledge over key image regions (faces and salient objects), and (iii) adapting classifier-free guidance for the transformer use case.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2203.13131 — Make-A-Scene', u:'https://arxiv.org/abs/2203.13131'},
 {t:'Meta AI — Make-A-Scene 소개', u:'https://ai.meta.com/blog/greater-creative-control-for-ai-image-generation/'},
 {t:'프로젝트 페이지', u:'https://ai.facebook.com/blog/greater-creative-control-for-ai-image-generation/'}
]
});
