WIKI.paper({
slug:'grounding-dino',
venue:'ECCV 2024 (arXiv 2023)',
authors:'Liu et al. (IDEA Research · Tsinghua · HKUST · Microsoft Research)',
arxiv:'2303.05499',

tldr:'[DINO-DETR](#/p/dino-detr) 검출기에 언어를 **파이프라인 세 단계 전부**(neck·query 초기화·head)에 밀어 넣어, 카테고리 이름이나 지시 표현(referring expression)만으로 임의의 객체를 찾는 open-set 검출기. COCO를 한 장도 보지 않고 COCO test-dev에서 fine-tuned 모델급 성능을 낸다.',

context:'[CLIP](#/p/clip) 이후 open-vocabulary 인식은 "이미지·텍스트를 같은 임베딩 공간에 넣고 유사도로 분류"가 표준이 됐지만, 검출기에 언어를 얼마나 깊이 섞을지는 논문마다 달랐다. GLIP은 neck 단계에서만 이미지·텍스트를 fusion했고, OV-DETR은 decoder query에만 언어를 주입했다 — 한쪽 단계만 건드리는 "partial fusion"이었다. 저자들은 이것이 최적이 아니라고 보고, closed-set 검출기를 backbone·neck·head 세 단계로 나눈 뒤 각 단계마다 fusion을 넣을 수 있는지 점검한다. Faster R-CNN류 2-stage 검출기는 구조상 중간 단계에 언어를 끼워 넣기 어렵지만, [DINO-DETR](#/p/dino-detr) 같은 DETR류는 layer-by-layer 구조라 매 층에 언어 블록을 얹기 쉽다는 것이 이 논문의 출발점이다.',

ideas:[
 {h:'Feature Enhancer: neck에서 조기 융합',
  lead:'이미지 self-attention과 텍스트 self-attention 사이에 image↔text cross-attention을 끼워 넣는다.',
  d:'6개 층으로 쌓은 feature enhancer 층마다 이미지 쪽은 deformable self-attention, 텍스트 쪽은 vanilla self-attention을 돌리고, 그 사이에 GLIP에서 착안한 **image-to-text**·**text-to-image** cross-attention을 추가해 두 모달리티를 정렬한다. vanilla 이미지·텍스트 특징이 이 단계를 거쳐 "cross-modality" 특징으로 바뀐다.'},
 {h:'Language-Guided Query Selection: 텍스트로 decoder query를 고른다',
  lead:'이미지 토큰과 텍스트 토큰의 유사도 행렬에서 각 이미지 토큰의 최댓값을 기준으로 상위 900개를 query로 뽑는다.',
  d:'인코더가 만든 이미지 특징 $X_I$ 와 텍스트 특징 $X_T$ 의 내적 $X_I X_T^\\top$ 을 구하고, 각 이미지 토큰이 텍스트 토큰 중 가장 높은 유사도를 낸 값을 기준으로 상위 $N_q{=}900$ 개 인덱스를 고른다. [DINO-DETR](#/p/dino-detr)의 mixed query selection을 그대로 따라 위치 part는 encoder 출력의 anchor box로, content part는 학습 가능한 값으로 초기화한다.'},
 {h:'Cross-Modality Decoder: head에서 한 번 더 언어를 섞는다',
  lead:'decoder 층마다 self-attention 다음에 image cross-attention과 text cross-attention을 순서대로 둔다.',
  d:'[DINO-DETR](#/p/dino-detr)의 decoder 층은 self-attention → image cross-attention → FFN이었는데, 여기에 **text cross-attention**을 하나 더 추가한다. 최종 층의 query가 박스 좌표와, 그 박스에 대응하는 phrase를 동시에 예측한다. 이 세 단계(enhancer·query selection·decoder)를 모두 갖춘 것이 이 논문의 핵심이고, 논문은 이를 GLIP(neck만)·OV-DETR(query만) 같은 기존 "partial fusion"과 대비시킨다.'},
 {h:'Sub-sentence 레벨 텍스트 표현',
  lead:'카테고리들을 한 문장으로 이어붙이되, attention mask로 서로 다른 카테고리 사이의 attention을 끊는다.',
  d:'GLIP처럼 카테고리 이름을 한 문장으로 이어붙이면(sentence-level) 서로 무관한 카테고리들끼리 self-attention으로 영향을 주고받는 부작용이 생긴다. 반대로 단어 단위로 따로 인코딩(word-level)하면 forward를 여러 번 돌려야 한다. Grounding DINO는 한 번에 인코딩하되 attention mask로 카테고리 경계를 막아 이 둘의 장점만 취한다.'},
 {h:'Grounded pre-training: 검출·grounding·caption 세 종류 데이터를 섞는다',
  lead:'박스 라벨이 있는 검출 데이터, phrase-box 짝인 grounding 데이터, 캡션에서 뽑은 pseudo-label 데이터를 함께 학습한다.',
  d:'검출 데이터(COCO·Objects365·OpenImage)는 카테고리 이름을 텍스트로 바꿔 phrase grounding 형식으로 통일한다. grounding 데이터는 MDETR이 정리한 **GoldG**(Flickr30k entities + Visual Genome)와 **RefC**(RefCOCO/+/g)를 쓴다. caption 데이터는 GLIP이 만든 pseudo-label을 그대로 재사용해 novel category 일반화를 돕는다.'}
],

diagram:{type:'flow', cap:'Grounding DINO 전체 파이프라인. 파란 화살표가 텍스트↔이미지가 만나는 세 지점(enhancer·query selection·decoder).',
 nodes:[
  {t:'이미지/텍스트 백본', s:'vanilla 특징'},
  {t:'특징 강화', s:'6층, cross-attn 융합', acc:true},
  {t:'쿼리 선택', s:'유사도 top-900', a:'언어로'},
  {t:'크로스모달 디코더', s:'text cross-attn 추가'},
  {t:'박스 + phrase', s:'contrastive+loc loss'}
 ]},

math:[
 {expr:'I_Nq = Top_Nq( Max_(-1)( X_I X_Tᵀ ) )',
  tex:'\\mathcal{I}_{N_q} = \\text{Top}_{N_q}\\!\\left(\\text{Max}^{(-1)}\\!\\left(X_I X_T^{\\top}\\right)\\right)',
  d:'이미지 토큰 $X_I \\in \\mathbb{R}^{N_I \\times d}$ 와 텍스트 토큰 $X_T \\in \\mathbb{R}^{N_T \\times d}$ 의 내적을 구해, 각 이미지 토큰이 텍스트 토큰 중 가장 잘 맞는 값(마지막 차원 max)을 기준으로 상위 $N_q{=}900$ 개를 decoder query로 뽑는다. $d{=}256$, $N_I$ 는 보통 1만 이상, $N_T$ 는 256 이하.'}
],

numbers:[
 {k:'COCO zero-shot AP (2017val)', v:'52.5', d:'Swin-L, O365+OI+GoldG 사전학습, **COCO 이미지를 한 장도 학습에 쓰지 않고** 얻은 값'},
 {k:'COCO fine-tune AP (test-dev)', v:'63.0', d:'같은 Swin-L 모델을 COCO로 fine-tune, 입력 해상도 1.5배(최대 2000px)일 때'},
 {k:'LVIS zero-shot AP (MiniVal)', v:'33.9', d:'Swin-L, O365+OI+GoldG+Cap4M+COCO+RefC 사전학습 — rare 카테고리(APr)는 22.2로 common(APc 30.7)보다 크게 낮음'},
 {k:'LVIS fine-tune AP (MiniVal)', v:'52.1', d:'Swin-T, O365+GoldG만으로 사전학습 후 LVIS로 fine-tune — DetCLIPv2-T를 +1.5 AP 앞섬'},
 {k:'ODinW zero-shot 평균 AP', v:'26.1', d:'Swin-L, 35개 이상 데이터셋 평균 — 논문이 "new record"라 주장하는 수치'},
 {k:'모델 크기 / query 수', v:'172M(Swin-T) · 900 query', d:'[DINO-DETR](#/p/dino-detr)과 동일하게 900 query, text token 상한 256'}
],

impact:'GLIP·OV-DETR처럼 파이프라인의 한 지점에서만 언어를 섞던 방식들을, "검출기를 backbone/neck/head 세 단계로 보고 전부 融合한다"는 하나의 설계 원칙으로 정리했다. 결과적으로 COCO 이미지를 전혀 보지 않고도 fine-tuned 모델과 맞먹는 52.5 AP를 냈고, 이는 "박스 라벨을 새 카테고리마다 다시 모을 필요 없이 텍스트 프롬프트만 바꾸면 된다"는 실무 워크플로를 가능하게 했다. 공개된 체크포인트와 추론 코드 덕분에 open-set 검출의 사실상 기본 베이스라인이 됐다.',

legacy:[
 '**Grounded-SAM 조합** — 이 논문 자체는 [SAM](#/p/sam)을 언급하지 않지만, "Grounding DINO로 텍스트 프롬프트에서 박스를 뽑고 그 박스를 [SAM](#/p/sam)에 넣어 마스크로 바꾼다"는 조합이 공개 이후 커뮤니티에서 널리 쓰이며 "Grounded-SAM"이라는 이름으로 알려졌다 — 논문이 주장한 것이 아니라 널리 퍼진 후속 사용 패턴이다.',
 '**Grounding DINO 1.5/1.6, GroundingDINO-X** 등 IDEA 자체 후속판이 이어지며 같은 3단계 fusion 골격에 더 큰 백본·데이터를 얹는 식으로 발전',
 '**image editing 파이프라인** — 검출된 박스를 diffusion 모델(예: Stable Diffusion) inpainting 조건으로 넘기는 "텍스트로 찾고 텍스트로 편집" 워크플로의 표준 입력 단계로 자리잡음',
 '**open-vocabulary 검출 벤치마크의 기준점** — 이후 나오는 open-set 검출 논문들이 COCO/LVIS/ODinW zero-shot 수치를 비교할 때 거의 예외 없이 Grounding DINO를 baseline으로 인용'
],

pitfalls:[
 '**COCO zero-shot(52.5)과 fine-tune(63.0) 수치를 섞지 않는다.** 같은 Table 2 안에 zero-shot·fine-tune 열이 나란히 있고, LVIS·ODinW 표도 마찬가지로 zero-shot/few-shot/full-shot(또는 fine-tune) 설정이 한 표에 같이 실려 있어 어느 열의 값인지 반드시 확인해야 한다.',
 '**"DINO"라는 이름이 이 위키에서 두 개다.** 이 논문의 "DINO"는 [DINO-DETR](#/p/dino-detr) — DETR 계열 객체 검출기 — 를 가리키며, 자기지도 학습 비전 트랜스포머 논문("Emerging Properties in Self-Supervised Vision Transformers", 이 위키의 별도 슬러그)과는 이름만 같을 뿐 무관하다. Grounding DINO는 후자와 아무 관계가 없다.',
 '**LVIS rare 카테고리 성능은 별도로 봐야 한다.** LVIS 전체 AP가 GLIP보다 높아도, rare 카테고리(APr)는 오히려 낮게 나오는 경향이 논문에 명시돼 있다 — "전체 AP가 비슷해도 rare AP는 DETR류가 구조적으로 약하다"는 저자들의 관찰이다.'
],

figures:[
 {f:'fig3-pipeline.png',
  cap:'전체 파이프라인(block 1). 아래에서 위로: 이미지/텍스트 백본 → Feature Enhancer(파란 상자) → Language-guide Query Selection → Cross-Modality Decoder → 오른쪽 위 유사도 행렬로 contrastive loss와 localization loss를 계산. 언어가 세 지점(Feature Enhancer, Query Selection, Decoder)에서 이미지 특징과 섞이는 것이 이 그림의 핵심.',
  src:'원문 Figure 3 block 1, p.5'}
],

quotes:[
 {t:'To effectively fuse language and vision modalities, we conceptually divide a closed-set detector into three phases and propose a tight fusion solution, which includes a feature enhancer, a language-guided query selection, and a cross-modality decoder for modalities fusion.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2303.05499 — Grounding DINO', u:'https://arxiv.org/abs/2303.05499'},
 {t:'GitHub — IDEA-Research/GroundingDINO', u:'https://github.com/IDEA-Research/GroundingDINO'}
]
});
