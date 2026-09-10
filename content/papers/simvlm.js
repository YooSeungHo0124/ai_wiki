WIKI.paper({
slug:'simvlm',
venue:'ICLR 2022',
authors:'Wang et al. (CMU · Google Research · U. Washington)',
arxiv:'2108.10904',

tldr:'객체 검출기·다중 손실을 조합한 복잡한 비전-언어 사전학습을 걷어내고, **prefix 언어모델링 목적 하나**로 이미지-텍스트 표현을 처음부터 끝까지 학습해도 최고 수준 성능이 나온다는 것을 보인 논문.',

context:'2021년 무렵 비전-언어 사전학습(VLP)은 대부분 (1) Faster R-CNN 같은 객체 검출기로 이미지 영역을 뽑고, (2) masked language modeling·word-region alignment·contrastive loss 등 **여러 손실을 동시에** 쓰는 방식이었다. 이 조합은 손실 간 균형을 맞추기 어렵게 만들고, 검출기가 만드는 깨끗한 캡션·영역 라벨에 의존해 데이터 확장성을 제한했다. `[CLIP](#/p/clip)`·`[ALIGN](#/p/align)`이 약한 감독(웹에서 긁은 alt-text)만으로 대조학습이 됨을 보인 뒤, 질문은 자연스럽게 이어진다 — **생성형 목적 하나로도 같은 일이 되지 않을까?**',

ideas:[
 {h:'PrefixLM: 이미지를 텍스트의 접두어로 본다',
  lead:'이미지 패치 시퀀스를 텍스트 앞에 붙이고, 접두어는 양방향으로 나머지는 자기회귀로 본다.',
  d:'표준 언어모델링은 왼쪽 문맥만 보고 다음 토큰을 예측한다. PrefixLM은 시퀀스의 앞부분(prefix, 길이 $T_p$)에는 **양방향 attention**을 허용하고 그 뒤(≥$T_p$)만 자기회귀로 생성한다. 이미지-텍스트 쌍에서는 이미지 패치 길이 $T_i$ 이상으로 접두어를 잘라, 이미지 전체 + 텍스트 일부를 양방향으로 인코딩한 뒤 나머지 텍스트를 생성하게 만든다.'},
 {h:'검출기 없이 원본 이미지 패치를 그대로 쓴다',
  lead:'ResNet 앞 3블록으로 만든 패치를 `[ViT](#/p/vit)`처럼 토큰화해 인코더에 넣는다.',
  d:'객체 검출 모듈이나 영역 라벨이 전혀 필요 없다. `[ViT](#/p/vit)`처럼 이미지를 패치로 잘라 시퀀스로 펴되, 단순 선형 투영 대신 ResNet의 앞 3개 블록(Conv stage)을 통과시켜 문맥화된 패치를 만든다 — 이 conv stage가 순수 선형 투영보다 낫다는 것을 확인했다.'},
 {h:'단일 손실, 단일 단계, 대신 대규모 약한 감독 데이터',
  lead:'깨끗한 캡션 대신 웹에서 긁은 alt-text 쌍을 대량으로 써서 손실 하나로 학습한다.',
  d:'`[ALIGN](#/p/align)`이 구축한 노이즈 섞인 이미지-alt텍스트 쌍과, 텍스트 전용 코퍼스 C4를 같은 배치 안에 섞어(이미지-텍스트 4096개 + 텍스트만 512개) 학습한다. PrefixLM이 모달리티에 무관한 목적이라 텍스트 전용 데이터를 그대로 섞어 넣을 수 있고, 이것이 노이즈 섞인 alt-text의 약점을 보완한다.'},
 {h:'생성 목적이 프롬프트 기반 제로샷을 공짜로 준다',
  lead:'GPT류 언어모델처럼 프롬프트만으로 파인튜닝 없이 캡션·VQA를 풀 수 있다.',
  d:'MLM 기반 VLP는 판별 과제(분류)에는 강하지만 생성이나 제로샷 프롬프팅에 약하다. PrefixLM은 GPT-3처럼 텍스트를 직접 생성하므로, 파인튜닝 없이 이미지에 프롬프트 문장을 이어 쓰게 하는 것만으로 제로샷 캡셔닝과 open-ended VQA가 가능해진다.'}
],

diagram:{type:'compare', cap:'같은 인코더-디코더, 사전학습 목적과 입력 파이프라인이 다르다.',
 left:{t:'기존 VLP', items:['검출기로 영역·라벨 추출','MLM+대조+정렬 등 다중 손실','깨끗한 캡션 데이터 필요']},
 right:{t:'SimVLM', items:['원본 이미지 패치 그대로 사용','PrefixLM 손실 하나','약한 감독(alt-text)+텍스트 혼합']}},

math:[
 {expr:'L_PrefixLM(θ) = -E[ log Pθ(x≥Tp | x<Tp) ]',
  tex:'\\mathcal{L}_{\\text{PrefixLM}}(\\theta) = -\\mathbb{E}_{\\mathbf{x}\\sim D}\\Big[\\log P_\\theta(\\mathbf{x}_{\\ge T_p}\\mid \\mathbf{x}_{<T_p})\\Big]',
  d:'표준 LM 손실(식 2, $-E[\\log P_\\theta(\\mathbf{x})]$)과 달리 앞부분 $T_p$ 토큰은 조건으로만 쓰고 손실을 계산하지 않는다. 이미지 패치 길이 $T_i$ 이상으로 $T_p$ 를 샘플링해, 이미지+텍스트 일부를 조건으로 나머지 텍스트를 생성하도록 만든다.'}
],

numbers:[
 {k:'VQA (test-std)', v:'+3.74%p', d:'SimVLMhuge 80.34 vs 이전 SOTA, vqa-score 기준'},
 {k:'NLVR2 (test-P)', v:'+1.17%p', d:'정확도 기준, 이전 SOTA 대비'},
 {k:'SNLI-VE', v:'+1.37%p', d:'정확도 기준, 이전 SOTA 대비'},
 {k:'이미지 캡셔닝 (평균 CIDEr)', v:'+10.1점', d:'CoCo·NoCaps 등 여러 벤치마크 평균 개선폭'},
 {k:'사전학습 배치 구성', v:'4096(ALIGN 이미지-텍스트) + 512(C4 텍스트)', d:'512개 TPU v3 칩에 분산, 약 1M 스텝'},
 {k:'모델 규모', v:'Base / Large / Huge', d:'`[ViT](#/p/vit)`와 동일한 3가지 크기 변형'}
],

impact:'SimVLM은 VLP 커뮤니티에 "복잡한 다중 손실이 필수가 아니다"라는 실증적 반례를 제공했다. 이후 `[CoCa](#/p/coca)`가 대조 손실과 캡셔닝(생성) 손실을 함께 쓰는 절충안으로 이어졌고, `[BLIP](#/p/blip)`은 노이즈 캡션을 스스로 걸러내는 부트스트래핑으로 데이터 품질 문제에 다른 각도로 접근했다. 검출기 의존을 끊고 원본 패치+웹 규모 약한 감독으로 가는 흐름 자체는 이후 VLM 설계의 기본값이 됐다.',

legacy:[
 '**`[CoCa](#/p/coca)`의 절충** — 대조학습(`[CLIP](#/p/clip)`식)과 캡셔닝(SimVLM식 생성)을 한 모델에 합쳐 판별·생성 두 마리를 다 잡으려는 후속 설계로 이어짐',
 '**`[BLIP](#/p/blip)`의 데이터 관점 대응** — SimVLM이 노이즈를 "많은 데이터로 희석"했다면, BLIP은 캡션 자체를 정제(bootstrapping)하는 다른 해법을 택함',
 '**검출기 없는 VLP의 정착** — 객체 검출 파이프라인 없이 원본 패치만으로 학습하는 방식이 이후 `[Flamingo](#/p/flamingo)`, `[BLIP-2](#/p/blip2)`, `[LLaVA](#/p/llava)` 계열의 기본 전제가 됨',
 '**단일 목적 사전학습이라는 관성** — "손실을 늘리지 말고 데이터와 모델을 키워라"는 이후 대규모 멀티모달 사전학습 설계 철학에 힘을 실음'
],

pitfalls:[
 '**"검출기가 필요 없다"가 "영역 정보가 필요 없다"는 뜻은 아니다.** SimVLM은 세밀한 영역-텍스트 정합이 중요한 과제(예: 매우 정밀한 grounding)에서는 검출기 기반 방법의 이점을 완전히 대체하지 못할 수 있다.',
 '**약한 감독(alt-text)의 노이즈는 사라지지 않고 데이터량으로 희석된 것이다.** ALIGN 데이터의 품질 문제 자체는 그대로 남아 있으며, 텍스트 전용 C4를 섞은 것은 이를 보완하는 장치이지 근본 해결책은 아니다.',
 '**PrefixLM ≠ 표준 캡션 생성 학습.** 접두어 길이 $T_p$ 를 이미지 길이 이상으로 무작위 샘플링하는 절차가 핵심이며, 이를 빼고 단순히 "이미지 다음에 캡션을 이어 붙여 LM 학습"만 하면 논문이 보고한 판별 과제 성능(양방향 인코딩 이점)을 재현하기 어렵다.'
],

figures:[
 {f:'fig1-prefixlm.png',
  cap:'왼쪽 Conv Stage가 이미지를 패치 임베딩(x_p1…x_p9)으로, Token Embedding이 텍스트를 토큰(x_t1…x_t5)으로 바꿔 둘을 이어붙여 Transformer Encoder에 넣는다. 이미지 패치 전부와 텍스트 앞부분("Two brown and white dogs")이 양방향 접두어이고, Decoder가 그 뒤를 이어 자기회귀로 생성("running happily on a dirt road")하는 것이 PrefixLM의 핵심.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'SimVLM reduces the training complexity by exploiting large-scale weak supervision, and is trained end-to-end with a single prefix language modeling objective.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2108.10904 — SimVLM', u:'https://arxiv.org/abs/2108.10904'}
]
});
