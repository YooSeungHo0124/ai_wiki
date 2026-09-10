WIKI.paper({
slug:'vilt',
venue:'ICML 2021',
authors:'Kim, Son, Kim (Kakao Enterprise · Kakao Brain)',
arxiv:'2102.03334',

tldr:'비전-언어 사전학습(VLP)에서 이미지를 다루는 무거운 **object detector를 통째로 없앤** 모델. 픽셀을 곧바로 [ViT](#/p/vit)처럼 패치로 잘라 선형 투영만 거쳐 텍스트 토큰과 함께 트랜스포머에 넣는다.',

context:'2019~2020년의 VLP 모델([ViLBERT](#/p/vilbert), UNITER, [LXMERT](#/p/lxmert) 등)은 하나같이 이미지를 **영역 특징(region feature)**으로 바꿔 넣었다. 이미지를 [Faster R-CNN](#/p/faster-rcnn) 같은 검출기에 통과시켜 물체 후보 영역을 뽑고, 각 영역을 CNN으로 인코딩한 뒤 그 벡터들을 텍스트 토큰과 함께 트랜스포머에 넣는 방식이다. 이 파이프라인은 사전학습된 검출기 자체가 무겁고, NMS 같은 후처리가 느리며, 검출기가 정의한 1,600개 클래스 어휘 밖의 개념은 애초에 표현할 수 없다는 한계가 있다. Pixel-BERT는 검출기 대신 CNN의 grid feature를 썼지만 여전히 ResNet 백본을 통째로 돌려야 했다. 이 논문의 질문은 단순하다 — [ViT](#/p/vit)가 이미지를 합성곱 없이 패치 선형 투영만으로 다뤄도 되는 것을 보였는데, VLP도 그렇게 하면 안 되는가?',

ideas:[
 {h:'검출기를 지우고 패치 선형 투영만 남긴다',
  lead:'이미지를 32×32 패치로 잘라 단일 선형층으로 투영하는 것이 시각 임베딩의 전부다.',
  d:'ViLT의 시각 임베딩은 파라미터 **2.4M**짜리 선형층 하나다. CNN 백본도, RoI 연산도, NMS도 없다. 논문은 이를 "region/grid feature 대신 patch projection"이라는 세 갈래 비교로 제시하며(Figure 1), 시각 임베딩을 텍스트 임베딩과 **같은 수준의 단순한 연산**으로 끌어내린 것이 핵심이라고 말한다.'},
 {h:'시각 임베더가 아니라 트랜스포머에 모든 상호작용을 맡긴다',
  lead:'모달 전용 연산보다 멀티모달 트랜스포머 쪽이 더 많이 계산하는 첫 VLP 모델.',
  d:'저자들은 기존 VLP 모델들의 실제 병목이 "이미지-텍스트를 섞는 트랜스포머"가 아니라 "이미지를 특징으로 바꾸는 전처리"에 있다고 지적한다. ViLT는 시각·텍스트 임베딩을 극단적으로 가볍게 만들어, 계산의 대부분이 실제 멀티모달 상호작용을 하는 트랜스포머 본체에서 일어나게 뒤집었다.'},
 {h:'상호작용 트랜스포머를 BERT가 아니라 ViT 가중치로 초기화한다',
  lead:'사전학습된 [ViT](#/p/vit) 가중치로 인코더를 초기화해 이미지 처리 능력을 그대로 물려받는다.',
  d:'ViLT는 단일 스트림(single-stream) 트랜스포머 하나에 텍스트·이미지 토큰을 같이 넣는데, 이 트랜스포머를 [BERT](#/p/bert)가 아니라 ImageNet-21k로 사전학습된 ViT-B/32 가중치로 초기화한다. 별도의 깊은 시각 인코더가 없는 대신, 상호작용 레이어 자체가 이미지 처리 능력을 갖고 시작하게 만드는 선택이다. 반대로 BERT 가중치로 초기화하고 ViT의 패치 투영만 가져오는 조합은 논문 각주에서 "작동하지 않았다"고 명시한다.'},
 {h:'토큰 위치·모달 종류·패치 위치를 모두 임베딩으로 더한다',
  lead:'토큰 위치·모달 타입·패치 위치 임베딩을 각 입력에 합산해 하나의 시퀀스로 합친다.',
  d:'텍스트 쪽은 word embedding + position embedding, 이미지 쪽은 patch linear projection + patch position embedding을 만든 뒤, 두 시퀀스 모두에 "이 토큰이 텍스트인지 이미지인지"를 나타내는 modal-type embedding을 더해 하나의 시퀀스로 concat한다(Figure 3). 이 표기 방식이 이후 여러 단일 스트림 VLP 구현의 표준이 됐다.'},
 {h:'ITM + MLM 두 목적함수로 사전학습, MPP는 버린다',
  lead:'image text matching과 masked language modeling만으로 학습해도 충분함을 보였다.',
  d:'image text matching(ITM, 이미지-텍스트 쌍이 맞는지 이진 분류)과 masked language modeling(MLM)을 기본 목적함수로 쓰고, 여기에 word patch alignment(WPA, optimal transport로 단어와 패치를 정렬)를 추가로 실험한다. [ViT](#/p/vit)처럼 이미지 패치 자체를 마스킹해 예측하는 masked patch prediction(MPP)도 시도했지만, ablation에서 다운스트림 성능에 기여하지 않는 것으로 나타나 최종 레시피에서는 제외했다.'}
],

diagram:{type:'compare', cap:'세 가지 시각 임베딩 방식의 계산 비용 차이. region은 검출기+NMS, grid는 CNN 백본, patch는 선형층 하나.',
 left:{t:'기존: region feature', items:['Faster R-CNN으로 영역 검출','CNN으로 각 영역 인코딩','NMS 후처리로 수천 개 축소','검출기 전체가 학습 밖 고정']},
 right:{t:'ViLT: patch 투영', items:['패치를 선형층 1개로 투영','CNN·검출기·NMS 전부 제거','파라미터 2.4M, 지연 ~0.4ms']}},

math:[
 {expr:'z0 = [ t̄ + t_type ; v̄ + v_type ]',
  tex:'z^{0}=[\\bar t + t^{\\text{type}}\\,;\\,\\bar v + v^{\\text{type}}]',
  d:'텍스트 시퀀스 $\\bar t$ 와 패치 시퀀스 $\\bar v$ 에 각각 modal-type embedding을 더한 뒤 이어 붙여 트랜스포머의 입력 $z^0$ 을 만든다. 이후 층은 표준 pre-norm 트랜스포머 블록(MSA → MLP, 둘 다 residual)을 그대로 쌓는다.'},
 {expr:'v̄ = [v_class; v1 V; …; vN V] + V_pos',
  tex:'\\bar v=[v_{\\text{class}};\\,v_1V;\\dots;v_NV]+V^{\\text{pos}}',
  d:'$N$ 개로 flatten된 이미지 패치 각각에 학습 가능한 선형 투영 $V$ 를 곱하고, 여기에 patch position embedding $V^{pos}$ 를 더한다. CNN이 전혀 없다는 것이 이 식 전체다.'}
],

numbers:[
 {k:'시각 임베더 파라미터', v:'2.4M', d:'32×32 패치를 자르는 선형 투영층 하나. ResNet-101 검출기(수십M)와 대조'},
 {k:'시각 임베딩 지연', v:'~0.4ms (region ~75ms)', d:'UNITER-Base의 region feature 추출(~75ms) 대비, Figure 1 기준'},
 {k:'속도 배수', v:'region 대비 수십 배, grid 대비 4배 이상', d:'논문이 abstract·본문에서 직접 밝힌 수치("up to tens of times faster", "at least four times faster")'},
 {k:'VQAv2 test-dev', v:'70.33', d:'ViLT-B/32 기본 설정. UNITER-Base(72.70)보다는 낮음'},
 {k:'NLVR2 test-P', v:'74.57', d:'ViLT-B/32. UNITER-Base(75.80)와 큰 차이 없이 근접'},
 {k:'Flickr30K 파인튜닝 TR R@1', v:'83.5~83.7', d:'RandAugment 적용 시. 두 번째로 빠른 Pixel-BERT-R50(75.7)을 크게 앞섬'}
],

impact:'ViLT는 VLP에서 "이미지를 어떻게 특징으로 바꿀 것인가"라는 질문 자체를 무의미하게 만들었다. region feature 추출이라는, 사실상 모든 이전 VLP 모델이 당연히 거쳐야 한다고 여긴 전처리 단계를 통째로 걷어내면서 학습·추론 속도를 자릿수 단위로 끌어올렸다. VQAv2 같은 세밀한 객체 인식이 필요한 과제에서는 region 기반 모델에 못 미쳤지만, retrieval처럼 전역적 정합이 중요한 과제에서는 속도 대비 성능이 오히려 앞섰다. 이후 VLP 연구는 "더 무거운 검출기"가 아니라 "패치를 어떻게 더 잘 정렬시킬 것인가"라는 방향으로 갈라졌다.',

legacy:[
 '**detector-free VLP 계열의 출발점** — 이후 ALBEF, METER, BLIP 등이 patch/grid 기반 경량 시각 임베딩을 이어받음',
 '**[ViT](#/p/vit) 레시피의 멀티모달 이식** — "이미지를 패치 토큰으로 취급한다"는 아이디어가 단일 모달을 넘어 VLP 표준으로 확장된 사례',
 '**속도-성능 trade-off의 재설정** — VQA류 세밀 인식 과제에서는 여전히 region feature의 우위가 남아, 이후 연구들이 이 격차를 좁히는 것을 목표로 삼음',
 '**단일 스트림 임베딩 규약의 정착** — modal-type + position embedding을 더해 하나의 시퀀스로 합치는 구성이 이후 단일 스트림 VLP 구현의 사실상 표준이 됨'
],

pitfalls:[
 '**"ViLT가 모든 지표에서 이겼다"가 아니다.** VQAv2 test-dev(70.33)는 UNITER-Base(72.70)보다 낮다. 논문 스스로 "객체 표현이 분리돼 있어야 VQA류 질문에 유리하다"고 원인을 추정한다.',
 '**BERT 사전학습 가중치를 텍스트 임베딩에 쓰지 않는다.** 텍스트 임베딩 파라미터는 처음부터 학습하며, 논문은 "사전학습 BERT를 쓰는 것이 오히려 득이 되지 않았다"는 선행 연구(Tan & Bansal)를 근거로 든다. BERT를 가져오는 건 상호작용 트랜스포머가 아니라 반대로 ViT 쪽이다.',
 '**MPP(masked patch prediction)는 최종 모델에 없다.** [ViT](#/p/vit)류의 패치 마스킹 예측을 시도했지만 ablation에서 이득이 없어 제외됐다 — "패치까지 마스킹해서 학습한다"고 오해하기 쉽다.'
],

figures:[
 {f:'fig1-comparison.png',
  cap:'위: region/grid/patch 세 시각 임베딩 방식의 파이프라인 비교. 아래: 실제 실행시간 막대그래프 — UNITER는 검출기(~75ms)+RPN/RoI/NMS(~810ms)로 총 ~900ms, ViLT는 선형 임베딩 ~0.4ms에 트랜스포머 ~15ms뿐이다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig3-architecture.png',
  cap:'전체 구조. 왼쪽 하단이 텍스트 word embedding, 오른쪽 하단이 이미지 patch 선형 투영이며 각 토큰에 회색(모달 종류)·초록/보라(위치) 임베딩이 더해져 하나의 시퀀스로 합쳐진 뒤 Transformer Encoder(주황)를 통과한다. 위쪽 세 분기가 ITM·MLM·WPA 세 사전학습 목적함수.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'We show that ViLT is up to tens of times faster than previous VLP models, yet with competitive or better downstream task performance.',
  src:'Abstract, p.1'},
 {t:'ViLT is the first VLP model of which the modal-specific components require less computation than the transformer component for multimodal interactions.',
  src:'Figure 1 caption, p.1'}
],

links:[
 {t:'arXiv 2102.03334 — ViLT', u:'https://arxiv.org/abs/2102.03334'},
 {t:'공식 코드 (dandelin/vilt)', u:'https://github.com/dandelin/vilt'}
]
});
