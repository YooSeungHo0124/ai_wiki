WIKI.paper({
slug:'coca',
venue:'arXiv 2022 (Google Research)',
authors:'Yu, Wang, Vasudevan, Yeung, Seyedhosseini, Wu (Google Research)',
arxiv:'2205.01917',

tldr:'대조학습(대표: `[CLIP](#/p/clip)`)과 캡션 생성(대표: SimVLM)을 **하나의 encoder-decoder를 한 번의 forward pass로 함께 학습**시켜, 검색·분류처럼 이해가 필요한 과제와 캡셔닝·VQA처럼 생성이 필요한 과제를 한 모델로 다 잘하게 만든 논문이다. ImageNet zero-shot 86.3%, 파인튜닝 91.0%를 동시에 새 SOTA로 찍었다.',

context:'2022년 초 이미지-텍스트 foundation model은 두 갈래로 갈라져 있었다. `[CLIP](#/p/clip)`·ALIGN 같은 **dual-encoder 대조학습**은 검색과 zero-shot 분류에 강하지만, 이미지와 텍스트를 각각 하나의 임베딩으로 압축하기 때문에 VQA처럼 둘을 **결합**해 추론해야 하는 과제에는 그대로 못 쓴다. 반대로 SimVLM 같은 **encoder-decoder 생성 모델**은 캡셔닝·VQA에 강하지만, 텍스트만의 독립된 임베딩을 만들지 않아 이미지-텍스트 검색에는 비효율적이다. 두 계열은 구조가 달라 한쪽 장점을 다른 쪽에 옮기려면 별도의 사전학습 단계나 모듈을 추가해야 했다. CoCa의 질문은 단순하다 — **디코더를 반으로 잘라 한쪽은 대조 손실, 한쪽은 생성 손실을 맡기면 한 번의 학습으로 둘 다 되지 않을까?**',

ideas:[
 {h:'디코더를 unimodal/multimodal로 이등분',
  lead:'디코더 앞 절반은 cross-attention을 끄고, 뒤 절반만 이미지에 cross-attend한다.',
  d:'표준 encoder-decoder는 모든 디코더 층이 encoder 출력에 cross-attention을 건다. CoCa는 디코더를 절반으로 나눠 앞쪽 $n_{uni}$ 층은 cross-attention을 **아예 없애** 텍스트만으로 표현을 학습하는 unimodal text decoder로 쓰고, 뒤쪽 $n_{multi}$ 층만 이미지 encoder 출력에 cross-attend하는 multimodal decoder로 쓴다. 이 분리 덕분에 대조 손실용 텍스트 임베딩과 생성 손실용 멀티모달 표현이 **같은 파라미터 안에서 자연스럽게 공존**한다.'},
 {h:'대조 손실 + 캡션 손실을 한 forward pass로',
  lead:'causal masking 덕에 두 손실을 위한 두 번째 forward가 필요 없다.',
  d:'unimodal 디코더 끝에 학습 가능한 `[CLS]` 토큰을 붙여 그 출력을 텍스트 임베딩으로 쓰고, 이미지 encoder 출력을 attentional pooling(쿼리 1개)으로 풀링한 벡터와 대조 손실 $\\mathcal{L}_{Con}$을 계산한다. 동시에 multimodal 디코더 출력에는 다음 토큰을 예측하는 캡션 손실 $\\mathcal{L}_{Cap}$을 건다. 두 손실 모두 **인과적 마스킹이 걸린 하나의 디코더 forward**에서 나오므로, 양방향 attention이 필요한 방식(예: ALBEF)처럼 corrupted/clean 두 번을 돌릴 필요가 없다.'},
 {h:'attentional pooler로 과제별 이미지 표현을 분리',
  lead:'쿼리 1개짜리 풀러는 전역 벡터를, 쿼리 256개짜리 풀러는 영역별 토큰을 뽑는다.',
  d:'대조 손실은 이미지 하나당 벡터 하나만 필요하고, 캡션 디코더는 여러 영역 토큰이 있어야 세밀한 묘사가 가능하다. CoCa는 이미지 encoder 출력을 공유한 채, multi-head attention 층 하나로 된 pooler에 학습 가능한 쿼리를 넣어 목적에 맞게 서로 다른 길이로 풀링한다 — 대조용 `n_query=1`, 캡션용 `n_query=256`. 같은 backbone에서 과제별 어댑터처럼 동작해, 나중에 프레임 단위 pooler를 새로 학습시키는 것만으로 video 도메인까지 확장한다.'},
 {h:'라벨을 전부 텍스트로 취급해 두 데이터를 한 번에',
  lead:'사람이 붙인 라벨과 웹 alt-text를 구분하지 않고 같은 캡션 손실로 학습한다.',
  d:'JFT-3B의 클래스 라벨을 `"a photo of the cat, animal"`처럼 문장으로 바꾸고, ALIGN의 노이즈 섞인 alt-text와 **똑같은 형식**으로 취급해 한 데이터 파이프라인에 섞는다. 별도의 supervised pretraining 단계 없이 **처음부터 전체 파라미터를 한 번에** 학습시키는 것이 이전의 LiT·BASIC 같은 2단계 방식과의 차이다.'}
],

diagram:{type:'compare', cap:'CoCa는 대조 전용·생성 전용 두 계열을 한 디코더 안에서 절반씩 나눠 합친다.',
 left:{t:'CLIP: 대조만', items:['dual-encoder, 임베딩 하나씩 대조','검색·zero-shot 분류에 강함','VQA 등 결합 추론 불가']},
 right:{t:'CoCa: 대조 + 생성', items:['디코더 절반은 unimodal 대조용','나머지 절반은 이미지 cross-attend 생성용','한 forward로 두 손실 동시 계산']}},

math:[
 {expr:'L_Con = -(1/N) [ Σ log(exp(xiᵀyi/σ) / Σⱼexp(xiᵀyj/σ)) + Σ log(exp(yiᵀxi/σ) / Σⱼexp(yiᵀxj/σ)) ]',
  tex:'\\mathcal{L}_{Con}=-\\frac{1}{N}\\left(\\sum_i \\log\\frac{\\exp(x_i^{\\top}y_i/\\sigma)}{\\sum_{j=1}^{N}\\exp(x_i^{\\top}y_j/\\sigma)} + \\sum_i \\log\\frac{\\exp(y_i^{\\top}x_i/\\sigma)}{\\sum_{j=1}^{N}\\exp(y_i^{\\top}x_j/\\sigma)}\\right)',
  d:'배치 $N$개의 이미지·텍스트 임베딩을 양방향(image→text, text→image)으로 대조한다. `[CLIP](#/p/clip)`의 InfoNCE와 동일한 형태.'},
 {expr:'L_Cap = - Σ_t log P_θ(y_t | y_<t, x)',
  tex:'\\mathcal{L}_{Cap}=-\\sum_{t=1}^{T}\\log P_\\theta(y_t\\,|\\,y_{<t},\\,x)',
  d:'multimodal 디코더가 이미지 $x$에 조건부로 캡션 토큰을 순차 예측하는 표준 autoregressive LM 손실. 두 손실은 $\\mathcal{L}=\\lambda_{Con}\\mathcal{L}_{Con}+\\lambda_{Cap}\\mathcal{L}_{Cap}$로 합쳐진다.'}
],

numbers:[
 {k:'파라미터', v:'2.1B', d:'이미지 encoder(ViT-giant, 1B) + 텍스트 디코더(1.1B), CoCa-Base는 383M'},
 {k:'배치 크기', v:'65,536', d:'image-text pair, ALIGN·BASIC과 동일한 설정을 따름'},
 {k:'ImageNet zero-shot', v:'86.3%', d:'top-1, 파인튜닝 없이'},
 {k:'ImageNet frozen encoder', v:'90.6%', d:'encoder 고정, 분류 head+pooler만 학습'},
 {k:'ImageNet finetuned', v:'91.0%', d:'당시 새 SOTA, top-1'},
 {k:'NoCaps CIDEr', v:'120.6', d:'경량 파인튜닝만으로 달성'}
],

impact:'CoCa는 "대조냐 생성이냐"를 선택의 문제가 아니라 **디코더 절반 분할**이라는 구조 문제로 바꿨다. 이후 vision-language foundation model들은 검색·분류·VQA·캡셔닝을 별도 모델로 두지 않고 한 백본에서 다 지원하는 것을 기본값으로 삼기 시작했다. 사전학습 단계도 하나로 줄면서, `[BLIP](#/p/blip)`처럼 데이터 정제 자체를 모델 안으로 끌어들이는 다음 세대 연구의 발판이 되었다.',

legacy:[
 '**하나의 인코더로 다목적 표현** — 분류(단일 encoder), 검색(dual-encoder), 캡셔닝/VQA(encoder-decoder) 세 패러다임을 한 체크포인트로 통합하는 설계가 이후 vision-language foundation model의 기본 틀이 됨',
 '`[BLIP](#/p/blip)`은 CoCa와 달리 **파라미터 공유 구조(MED)**로 세 모드를 나누고, 여기에 CapFilt라는 자기 부트스트랩 데이터 정제 루프를 추가로 얹어 노이즈 문제 자체를 정면으로 다룸',
 '**attentional pooler** 방식의 과제별 어댑터가 video·영역 단위 표현으로 그대로 확장되어, 이후 다중 downstream head를 붙이는 표준 패턴이 됨'
],

pitfalls:[
 '**"CLIP보다 항상 낫다"가 아니다.** CoCa는 캡션 손실 덕에 결합 추론이 되지만, 순수 대조 검색 성능에서 배치 크기·데이터 규모가 같다면 CLIP 계열과 큰 차이가 나지 않는 경우가 많다.',
 '**unimodal/multimodal 분할은 파라미터 수를 늘리지 않지만 설계가 고정적이다.** $n_{uni}=n_{multi}$로 정확히 반씩 나누는 것이 최적이라는 보장은 없고, 논문도 이를 경험적 선택으로 둔다.',
 '`[BLIP](#/p/blip)`과 혼동하기 쉽다 — CoCa는 **한 번의 사전학습으로 구조를 나눠** 두 손실을 동시에 걸고, BLIP은 **파라미터 공유 구조 + 데이터 자체를 재작성**하는 별도의 CapFilt 단계를 추가한다는 점이 다르다.'
],

figures:[
 {f:'fig-overview.png',
  cap:'맨 왼쪽이 CoCa 사전학습 한 번, 오른쪽 세 블록은 그 결과를 그대로 재사용해 시각 인식(단일 encoder)·크로스모달 정렬(dual-encoder)·캡셔닝&멀티모달 이해(encoder-decoder) 세 다운스트림으로 zero-shot/frozen/finetune 전환하는 흐름.',
  src:'원문 Figure 1, p.2'},
 {f:'fig-architecture.png',
  cap:'왼쪽 attentional pooling(파란 점)이 이미지 encoder 출력을 쿼리 개수만큼 압축한다. 가운데 Unimodal Text Decoder는 cross-attention이 없어 `[CLS]` 토큰으로 대조 손실만 받고, 위쪽 Multimodal Text Decoder만 곡선 화살표(Cross-Attention)로 이미지 표현을 받아 캡션을 생성한다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'This paper presents Contrastive Captioner (CoCa), a minimalist design to pretrain an image-text encoder-decoder foundation model jointly with contrastive loss and captioning loss, thereby subsuming model capabilities from contrastive approaches like CLIP and generative methods like SimVLM.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2205.01917 — CoCa: Contrastive Captioners are Image-Text Foundation Models', u:'https://arxiv.org/abs/2205.01917'},
 {t:'Google AI Blog — CoCa', u:'https://ai.googleblog.com/2022/05/image-text-pre-training-with.html'}
]
});
