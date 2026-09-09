WIKI.paper({
slug:'blip',
venue:'ICML 2022',
authors:'Li et al. (Salesforce Research)',
arxiv:'2201.12086',

tldr:'웹에서 긁어온 노이즈투성이 alt-text로 학습한 모델에게 **스스로 캡션을 새로 쓰게 하고(captioner) 나쁜 캡션을 걸러내게(filter)** 해서 학습 데이터 자체를 부트스트랩한 논문. 이해(retrieval)와 생성(captioning)을 한 모델에서 동시에 다루는 MED 구조도 함께 제안했다.',

context:'[CLIP](#/p/clip)·[ALIGN](#/p/align)이 증명한 것은 "웹에서 긁은 이미지-텍스트 쌍 수억 개면 사람 라벨 없이도 된다"였다. 하지만 그 데이터의 실체는 상품명, 파일명, SEO 키워드, 이미지와 아무 상관 없는 문장이 뒤섞인 alt-text 더미다. 당시의 대응은 **데이터를 더 늘리는 것**뿐이었고, 노이즈는 규모로 희석한다고 가정했다. 구조 면에서도 병목이 있었다. 대조학습 계열 encoder는 검색은 잘하지만 문장을 못 만들고, encoder-decoder 계열은 생성은 되지만 검색 성능이 떨어졌다 — 하나의 사전학습 모델을 이해 과제와 생성 과제 양쪽에 그대로 쓰기 어려웠다. BLIP은 이 두 문제를 **하나의 구조로 묶어서** 푼다.',

ideas:[
 {h:'MED: 파라미터를 공유하는 세 가지 모드',
  lead:'같은 텍스트 트랜스포머를 대조·매칭·생성 세 모드로 돌려 가중치를 공유한다.',
  d:'Multimodal mixture of Encoder-Decoder는 하나의 텍스트 트랜스포머를 세 방식으로 쓴다. **(1) 단일 모달 encoder** — 이미지 encoder와 짝지어 ITC(대조) 손실, **(2) 이미지 조건부 텍스트 encoder** — 각 층에 cross-attention을 넣어 ITM(매칭 이진분류) 손실, **(3) 이미지 조건부 텍스트 decoder** — self-attention을 causal로 바꿔 LM 손실. 세 모드는 self-attention을 제외한 대부분의 가중치를 공유하므로, 한 번의 사전학습으로 검색용 표현과 생성 능력을 동시에 얻는다.'},
 {h:'CapFilt: 모델이 자기 학습 데이터를 다시 쓴다',
  lead:'Captioner가 캡션을 새로 쓰고 Filter가 불일치 쌍을 걸러 데이터를 정제한다.',
  d:'사전학습이 끝난 MED를 소량의 사람 주석 데이터(COCO)로 파인튜닝해 두 개의 도구를 만든다. **Captioner**는 decoder 모드로 웹 이미지에 새 캡션을 생성하고, **Filter**는 ITM 헤드로 원본 웹 텍스트와 합성 캡션 각각이 이미지와 맞는지 판정해 불일치를 버린다. 남은 것을 사람 주석 데이터와 합쳐 **처음부터 다시 사전학습**한다. 라벨을 사람이 더 붙이는 대신 모델이 데이터를 정제하는 자기 부트스트랩 루프다.'},
 {h:'캡션 생성은 beam search가 아니라 nucleus sampling',
  lead:'노이즈가 더 많은 nucleus sampling 캡션이 다양성 덕에 다운스트림 성능은 더 낫다.',
  d:'직관과 반대되는 결과다. Beam search로 만든 캡션은 안전하지만 흔한 문장에 수렴해 이미 모델이 아는 정보만 반복하고, nucleus sampling 캡션은 노이즈 비율이 더 높은데도(25% vs 19%) **다운스트림 성능은 더 좋았다**. 합성 데이터의 가치가 정확도가 아니라 **다양성·새로운 정보량**에 있다는 신호이며, 이후 합성 데이터 파이프라인 설계에서 반복 확인되는 교훈이다.'},
 {h:'노이즈 제거는 규모 확장과 곱해진다',
  lead:'데이터·모델을 키운 뒤에도 CapFilt의 이득이 그대로 유지된다.',
  d:'CapFilt는 14M 이미지 설정에서만 유효한 트릭이 아니다. LAION을 더한 129M 이미지 설정에서도, 그리고 이미지 encoder를 ViT-B에서 ViT-L로 키운 뒤에도 이득이 유지됐다. "데이터를 늘리면 노이즈는 알아서 씻긴다"는 당시 가정을 정면으로 반박한 부분이다.'}
],

figures:[
 {f:'fig2-med-architecture.png',
  cap:'맨 왼쪽 Image Encoder를 뺀 나머지 세 블록이 색으로 표시된 대로 파라미터를 공유하는 같은 텍스트 트랜스포머다. Text Encoder(양방향 Bi Self-Att, ITC), Image-grounded Text encoder(Cross Attention 추가, ITM), Image-grounded Text decoder(Causal Self-Att로 교체, LM) 순서로 오른쪽으로 갈수록 이미지 조건이 강해지고 생성 능력이 생긴다 — 같은 색 블록은 같은 가중치라는 점이 이 그림의 핵심.',
  src:'원문 Figure 2, p.2'},
 {f:'fig3-capfilt-loop.png',
  cap:'왼쪽에서 노이즈 웹 데이터로 MED를 사전학습한 뒤, 그 모델을 COCO로 가볍게 파인튜닝해 Filter(ITC&ITM)와 Captioner(LM)를 만든다. Filter는 원본 웹 텍스트를, Captioner는 새 합성 캡션을 만들고, 다시 Filter가 합성 캡션도 거른다. 오른쪽 D가 최종 학습셋(필터된 웹 텍스트+필터된 합성 캡션+사람 주석)이고, 이걸로 처음부터 재사전학습한다.',
  src:'원문 Figure 3, p.4'}
],

diagram:{type:'loop', cap:'CapFilt 부트스트랩 루프. 모델 → 데이터 → 더 나은 모델의 순환. 웹 alt-text로 사전학습 후 Captioner가 합성 캡션을 작성한다.',
 center:'노이즈 웹 데이터 정제',
 nodes:[
  {t:'alt-text 사전학습', s:'ITC + ITM + LM'},
  {t:'COCO로 파인튜닝', s:'Captioner · Filter 생성'},
  {t:'Captioner 캡션생성', s:'nucleus sampling', acc:true},
  {t:'Filter: 불일치 제거', s:'ITM 헤드로 판정'},
  {t:'정제 데이터로 재사전학습', s:'from scratch'}
 ]},

quotes:[
 {t:'Despite the performance gain obtained by scaling up the dataset, our paper shows that the noisy web text is suboptimal for vision-language learning.',
  src:'Section 1, p.1'}
],

math:[
 {expr:'L = L_ITC + L_ITM + L_LM',
  tex:'\\mathcal{L} = \\mathcal{L}_{ITC} + \\mathcal{L}_{ITM} + \\mathcal{L}_{LM}',
  d:'세 손실을 한 번에 최적화한다. 이미지 하나당 이미지 encoder는 1회, 텍스트 트랜스포머는 세 모드로 3회 forward한다. ITC는 검색 표현을, ITM은 미세한 이미지-텍스트 정렬을, LM은 생성 능력을 담당한다.'},
 {expr:'D = {(I_w, T_s)_filtered} ∪ {(I_w, T_w)_filtered} ∪ {(I_h, T_h)}',
  tex:'D = \\{(I_w, T_s)\\}_{\\text{filtered}} \\cup \\{(I_w, T_w)\\}_{\\text{filtered}} \\cup \\{(I_h, T_h)\\}',
  d:'최종 학습 집합은 필터를 통과한 **합성 캡션** $T_s$, 필터를 통과한 **원본 웹 텍스트** $T_w$, 그리고 사람이 쓴 주석 $T_h$ 의 합집합이다. 원본 웹 텍스트를 전부 버리지 않는 것이 중요하다.'}
],

numbers:[
 {k:'COCO 검색 (평균 recall@1)', v:'+2.7%', d:'CapFilt 적용 시 기존 SOTA 대비'},
 {k:'COCO 캡셔닝 (CIDEr)', v:'+2.8%', d:'같은 설정'},
 {k:'VQA score', v:'+1.6%', d:'생성형 VQA로 답을 만들어내는 방식'},
 {k:'사전학습 규모', v:'14M / 129M 이미지', d:'14M = COCO+VG+CC3M+CC12M+SBU, 129M은 LAION 일부 추가'},
 {k:'합성 캡션 노이즈 비율', v:'nucleus 25% vs beam 19%', d:'더 노이즈가 많은 쪽이 다운스트림에서 더 좋았다'}
],

impact:'BLIP은 VLM 연구의 축을 하나 더 늘렸다. 그전까지 개선 수단은 모델 구조와 데이터 **양**이었는데, 여기서 데이터 **품질을 모델로 만드는 것**이 독립적인 레버로 자리 잡았다. 이후 합성 캡션 재작성은 사실상 표준 전처리가 되어 텍스트-이미지 생성 쪽에서도 재사용된다. 구조 면에서 MED는 이해와 생성을 한 사전학습에 담는 실용적 절충안을 보였고, 그 텍스트 트랜스포머가 이미지 특징을 cross-attention으로 흡수하는 방식은 곧이어 [BLIP-2](#/p/blip2)의 Q-Former로 압축된다. 다만 BLIP 자체는 이미지 encoder와 텍스트 모델을 **전부 학습**하는 end-to-end 방식이라, "얼린 대형 모델을 재활용한다"는 다음 단계의 문제의식은 아직 없다.',

legacy:[
 '**Q-Former로의 진화** — [BLIP-2](#/p/blip2)가 같은 팀에서 나오며 세 손실 구조를 그대로 계승하되, 학습 대상을 얼린 두 모델 사이의 작은 다리로 축소',
 '**합성 캡션의 일상화** — 웹 alt-text를 모델이 다시 쓰는 재캡셔닝이 [Stable Diffusion](#/p/ldm) 계열 텍스트-이미지 학습과 이후 VLM 데이터 파이프라인의 기본 절차가 됨',
 '**instruction 데이터도 모델이 만든다** — [LLaVA](#/p/llava)가 GPT-4로 시각 지시 데이터를 생성하는 발상은 "강한 모델로 학습 데이터를 합성한다"는 같은 계보',
 '**대조 손실만으로는 부족하다** — ITC + ITM + LM을 함께 쓰는 다중 목적 사전학습이 [SigLIP](#/p/siglip) 등 대조학습 개선 계열과는 다른 축으로 이어짐'
],

pitfalls:[
 '**"필터가 정확한 캡션만 남긴다"는 오해.** Filter는 ITM 헤드의 판정일 뿐이라 자신의 편향을 그대로 통과시키고, 모델이 이미 잘 아는 개념 쪽으로 데이터 분포를 좁히는 부작용이 있다. 희귀 개념일수록 걸러질 위험이 크다.',
 '**CapFilt는 재사전학습을 요구한다.** 정제된 데이터로 처음부터 다시 학습하는 절차라 비용이 두 배 든다. 기존 체크포인트를 이어서 파인튜닝하는 식으로 대체하면 논문이 보고한 이득이 그대로 나오지 않는다.',
 '**BLIP은 얼린 LLM을 쓰지 않는다.** 텍스트 쪽이 BERT 규모의 트랜스포머라 언어 능력·상식 추론은 [LLaVA](#/p/llava)나 [Qwen-VL](#/p/qwen-vl)처럼 LLM을 백본으로 쓰는 모델과 비교할 수준이 아니다. BLIP의 기여는 데이터 방법론 쪽에서 읽어야 한다.'
],

links:[
 {t:'arXiv 2201.12086 — BLIP: Bootstrapping Language-Image Pre-training', u:'https://arxiv.org/abs/2201.12086'},
 {t:'공식 구현 (salesforce/BLIP)', u:'https://github.com/salesforce/BLIP'}
]
});
