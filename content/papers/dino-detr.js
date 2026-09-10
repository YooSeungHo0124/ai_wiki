WIKI.paper({
slug:'dino-detr',
venue:'ECCV 2022 (arXiv 2022)',
authors:'Zhang, Li, Liu et al. (IDEA-CVR · IDEA-Research · 칭화대)',
arxiv:'2203.03605',

tldr:'[DETR](#/p/detr) 계열이 처음으로 COCO 리더보드에서 최고 전통 detector들을 넘어선 논문. 서로 다른 세 문제를 각각 겨냥한 세 개의 독립적 개선 — contrastive denoising, mixed query selection, look forward twice — 을 [Deformable DETR](#/p/deformable-detr) 기반 파이프라인에 결합해 얻었다.',

context:'DN-DETR가 denoising training으로 [DETR](#/p/detr)의 느린 수렴을 해결했고, DAB-DETR는 쿼리를 4D anchor box로 재해석했으며, [Deformable DETR](#/p/deformable-detr)는 deformable attention과 2-stage 쿼리 선택으로 연산량과 초기화를 개선했다. 그런데도 2022년 초까지 DETR류 모델은 COCO test-dev에서 50 AP를 넘지 못했고, DyHead·HTC++ 같은 개선된 고전 detector가 여전히 SOTA를 차지했다. 이 논문은 그 이유를 두 가지로 짚는다 — DETR류 모델 자체의 성능 한계, 그리고 대형 backbone·대규모 데이터로의 **스케일링이 검증된 적이 없다는 점**이다. DN-DETR·DAB-DETR·Deformable DETR을 그대로 조합한 강한 베이스라인 위에, 이 논문은 세 가지 새 기법을 추가로 얹는다.',

ideas:[
 {h:'Contrastive DeNoising (CDN): "없다"를 가르친다',
  lead:'같은 GT 주변에 약한 노이즈(positive)와 강한 노이즈(negative) anchor를 동시에 만들어 대비시킨다.',
  d:'DN-DETR의 denoising은 GT 근처의 noised anchor로부터 GT를 복원하도록 학습시켜 수렴은 빠르지만, **주변에 물체가 없는 anchor에 대해 "no object"를 예측하는 능력이 없다**. CDN은 같은 GT 박스에 두 종류의 노이즈를 건다 — 노이즈 크기가 $\\lambda_1$ 보다 작은 것은 positive(그 GT를 복원해야 함), $\\lambda_1$ 과 $\\lambda_2$ 사이인 것은 negative(no object를 예측해야 함)로 표시한다. 이 대비 학습이 모델이 **거의 겹치는 두 anchor 중 진짜 물체 쪽만 살리도록** 만들어, 같은 물체에 대한 중복 예측(duplicate output)을 줄인다.'},
 {h:'Mixed Query Selection: 위치만 인코더에서 빌린다',
  lead:'encoder top-K 특징으로 anchor 위치만 초기화하고, content 쿼리는 그대로 학습 파라미터로 둔다.',
  d:'[Deformable DETR](#/p/deformable-detr)의 2-stage(query selection) 방식은 encoder에서 뽑은 top-K 특징으로 위치 쿼리와 content 쿼리를 **둘 다** 초기화한다. 문제는 encoder의 top-K 특징이 아직 충분히 정제되지 않아 하나의 객체가 아니라 여러 객체가 섞이거나 객체의 일부만 담긴 모호한 표현이라는 점이다. 이걸 content 쿼리에까지 그대로 주입하면 decoder를 오도할 수 있다. DINO는 top-K 특징으로 **위치(anchor box)만** 초기화하고 content 쿼리는 이전처럼 학습 가능한 정적 파라미터로 남겨, decoder가 좋은 위치 prior만 받고 content는 encoder 출력에서 직접 풀링하도록 유도한다.'},
 {h:'Look Forward Twice: 그래디언트를 한 층 더 앞으로',
  lead:'layer-i의 파라미터를 layer-(i+1)의 박스 손실로도 같이 최적화한다.',
  d:'[Deformable DETR](#/p/deformable-detr)의 iterative box refinement는 학습 안정화를 위해 layer 사이 그래디언트를 끊는다("look forward once") — layer-i의 파라미터는 오직 자기 layer의 박스 손실로만 갱신된다. DINO는 다음 layer가 뽑은 더 정제된 박스 정보가 이전 layer의 파라미터를 고치는 데도 쓸모 있다고 보고, layer-i의 출력 offset $\\Delta b_i$ 를 layer-i의 최종 박스 $b_i^\\prime$ 와 layer-(i+1)의 예측 박스 계산에 **동시에** 사용한다. 즉 layer-i는 자신의 손실과 layer-(i+1)의 손실 양쪽으로부터 그래디언트를 받는다.'}
],

diagram:{type:'flow', cap:'DINO 전체 파이프라인. multi-scale feature가 encoder를 거쳐 top-K 위치로 anchor를 초기화하고, decoder는 그 anchor와 학습된 content 쿼리, 그리고 CDN 브랜치를 함께 받는다.',
 nodes:[
  {t:'Multi-scale 특징', s:'backbone 출력'},
  {t:'Encoder', s:'N층 deformable attn'},
  {t:'쿼리 선택', s:'top-K → anchor 위치', acc:true, a:'위치만'},
  {t:'Decoder', s:'M층, content는 학습 파라미터'},
  {t:'예측 + CDN', s:'박스·클래스 + denoising'}
 ]},

math:[
 {expr:'b_i-1 (초기 박스), Δb_i (offset) → b_i-prime = update(b_i-1, Δb_i)',
  tex:'b_i^{\\prime}=\\text{Update}(b_{i-1},\\,\\Delta b_i),\\qquad b_{i+1}^{(pred)}=\\text{Update}(b_i^{\\prime},\\,\\Delta b_{i+1})',
  d:'look forward once는 $\\Delta b_i$ 만 layer-i 손실에 쓰고 $b_{i-1}$ 로의 그래디언트를 끊는다. look forward twice는 layer-i가 만든 $b_i^{\\prime}$ 를 layer-(i+1)의 예측에도 다시 사용해, $\\Delta b_i$ 를 layer-i와 layer-(i+1) 손실 양쪽에서 동시에 최적화한다.'},
 {expr:'λ1 < λ2: noise < λ1 → positive(복원), λ1 < noise < λ2 → negative(no object)',
  tex:'\\text{noise}(b)\\ \\begin{cases}<\\lambda_1 & \\text{positive, reconstruct GT}\\\\ \\in[\\lambda_1,\\lambda_2) & \\text{negative, predict }\\varnothing\\end{cases}',
  d:'CDN은 DN-DETR의 단일 노이즈 스케일 $\\lambda$ 를 두 개의 임계값으로 쪼개, 같은 GT 주변에 정도가 다른 두 노이즈 anchor를 동시에 만들어 대비 학습시킨다.'}
],

numbers:[
 {k:'AP · COCO val2017, R50 4scale, 12epoch', v:'49.0', d:'같은 조건 DN-Deformable-DETR 대비 **+5.6 AP**'},
 {k:'AP · COCO val2017, R50 5scale, 12epoch', v:'49.4', d:'DETR류 최초로 50 AP에 근접, small object는 **+7.5 AP**'},
 {k:'AP · COCO val2017, R50 5scale, 24epoch', v:'51.3', d:'50-epoch 학습 없이도 이전 SOTA(DN-Deformable-DETR 48.6) 상회'},
 {k:'AP · COCO test-dev, SwinL + Objects365 사전학습', v:'63.3', d:'TTA 적용, 당시 COCO 리더보드 신기록 — Transformer decoder 기반 최초 SOTA'},
 {k:'파라미터 · SwinL 설정', v:'218M', d:'경쟁 SOTA인 SwinV2-G(3.0B) 대비 약 **1/15** 크기로 더 높은 AP'}
],

impact:'DINO는 [DETR](#/p/detr) 계열이 "연구용 대안"에서 "실전 SOTA"로 넘어가는 분기점이 되었다. COCO test-dev 63.3 AP는 end-to-end Transformer detector가 처음으로 HTC++·DyHead 같은 고전 detector 기반 SOTA를 넘어선 결과였고, 이후 detection 연구의 기본 베이스라인이 사실상 DINO로 교체되었다. 세 기법이 서로 다른 병목(denoising의 no-object 능력, 쿼리 초기화의 모호함, 박스 refinement의 그래디언트 흐름)을 겨냥한 독립적 개선이라는 점도 이후 논문들이 "어느 부분을 더 고칠지"를 명확히 나눠 실험하는 관행을 만들었다.',

legacy:[
 '**Grounding DINO** — DINO의 detector 구조에 텍스트 인코더를 결합해 open-vocabulary detection으로 확장',
 '**Mask DINO** — 같은 query 설계에 mask 예측 브랜치를 얹어 detection과 instance/panoptic segmentation을 통합',
 '**Stable-DINO / co-DINO 계열** — CDN·look forward twice 같은 학습 안정화 기법을 더 다듬어 후속 SOTA 경쟁에 사용',
 '**COCO 벤치마크의 기준선 교체** — 이후 detection 논문 다수가 Deformable DETR 대신 DINO를 비교 베이스라인으로 채택'
],

pitfalls:[
 '**이름 충돌 주의: 이 "DINO"는 자기지도 학습 논문 "DINO"(Emerging Properties in Self-Supervised Vision Transformers, arXiv 2104.14294, 위키의 `dino` 항목)와 완전히 다른 논문이다.** 저자도 다르고 아이디어도 무관하며, 오직 약칭("DETR with Improved deNoising anchOr boxes")이 우연히 같을 뿐이다. 절대 서로 링크로 연결하지 말 것.',
 '**CDN은 DN-DETR denoising의 대체가 아니라 확장이다.** 기존 positive 노이즈 denoising은 그대로 유지한 채 negative 노이즈 그룹을 추가한 것이며, "DN-DETR의 denoising을 버리고 contrastive로 바꿨다"는 식으로 이해하면 틀린다.',
 '**mixed query selection은 content 쿼리까지 encoder에서 가져오지 않는다.** Deformable DETR의 2-stage 방식(위치+content 둘 다 encoder top-K에서 초기화)과 헷갈리기 쉬운데, DINO는 **위치만** encoder에서 가져오고 content는 학습 파라미터로 고정한다는 점이 핵심 차이다.'
],

figures:[
 {f:'fig2-framework.png',
  cap:'왼쪽부터 backbone의 multi-scale feature가 encoder(N층)를 통과하고, 맨 위 "Query Selection" 박스가 top-K 위치로 decoder의 초기 anchor(Init Anchors)를 만든다. decoder는 이 anchor와 별도의 학습된 content 쿼리를 받고, 오른쪽 CDN 박스가 positive(주황)/negative(진한색) 노이즈 쿼리를 추가로 공급한다.',
  src:'원문 Figure 2, p.6'},
 {f:'fig5-query-selection.png',
  cap:'세 초기화 방식 비교. (a) static은 anchor·content 모두 이미지와 무관하게 고정. (b) pure query selection(Deformable DETR)은 encoder top-K로 anchor와 content를 둘 다 만듦. (c) DINO의 mixed는 anchor만 encoder에서, content는 (a)처럼 static하게 유지 — 이 차이가 본문 3.4절의 핵심 논지다.',
  src:'원문 Figure 5, p.10'},
 {f:'fig6-look-forward.png',
  cap:'(a) look forward once: layer-i 파라미터는 자기 layer의 offset Δb_i 손실로만 갱신(점선이 끊긴 그래디언트). (b) look forward twice: 같은 Δb_i가 layer-i의 최종 박스 b_i(prime) 와 layer-(i+1)의 예측 양쪽 화살표로 흘러 들어간다.',
  src:'원문 Figure 6, p.10'}
],

quotes:[
 {t:'The contrastive denoising training helps the model to avoid duplicate outputs of the same target.',
  src:'Sec. 1 (Introduction), p.3'},
 {t:'It is the first time that an end-to-end Transformer detector is established as a SOTA model on the leaderboard.',
  src:'Sec. 4.3, p.13'}
],

links:[
 {t:'arXiv 2203.03605 — DINO: DETR with Improved DeNoising Anchor Boxes', u:'https://arxiv.org/abs/2203.03605'},
 {t:'IDEA-Research/DINO (공식 코드)', u:'https://github.com/IDEA-Research/DINO'}
]
});
