WIKI.paper({
slug:'janus-pro',
venue:'arXiv 2025',
authors:'Chen, Wu, Liu et al. (DeepSeek-AI)',
arxiv:'2501.17811',

tldr:'이해와 생성을 하나의 autoregressive transformer로 처리하되, **두 작업에 서로 다른 비전 인코더**(이해용 SigLIP, 생성용 VQ tokenizer)를 쓴다. 전작 Janus의 이 설계를 그대로 두고 학습 전략·데이터·모델 크기만 키워 성능을 끌어올린 개선판이다.',

context:'통합 이해·생성 모델 다수는 이미지 이해와 이미지 생성에 **같은 비전 인코더**를 재사용한다. 문제는 두 작업이 요구하는 표현이 다르다는 점이다 — 이해에는 고수준 의미 특징이 필요하고, 생성에는 픽셀을 복원할 수 있는 저수준 정보가 필요하다. 인코더를 공유하면 한쪽에 최적화된 특징이 다른 쪽에는 최적이 아니게 되어, 특히 이해 성능이 떨어지는 문제가 생긴다. [Chameleon](#/p/chameleon)은 이미지와 텍스트를 동일한 이산 토큰 공간으로 early-fusion 시켜 이 문제를 아예 다르게 풀었지만, Janus 계열은 "인코딩을 분리하고 트랜스포머만 통합하자"는 반대 방향을 택했다. 전작 Janus는 1.5B급 LLM에서 이 아이디어를 검증했지만 학습 데이터가 적고 모델이 작아 짧은 프롬프트 생성이 불안정했다.',

ideas:[
 {h:'시각 인코딩 분리: 이해는 SigLIP, 생성은 VQ tokenizer',
  lead:'이해용 SigLIP 인코더와 생성용 VQ 토크나이저를 따로 두고 트랜스포머만 하나로 공유한다.',
  d:'이해 경로는 SigLIP으로 이미지에서 고차원 의미 특징을 뽑아 2D 그리드를 1D 시퀀스로 펼친 뒤 understanding adaptor로 LLM 입력 공간에 맞춘다. 생성 경로는 별도의 VQ tokenizer로 이미지를 이산 코드 ID로 바꾸고 generation adaptor로 임베딩을 맞춘다. 두 시퀀스를 이어붙여 하나의 autoregressive transformer에 넣고, 생성 시에는 LLM 내장 헤드 대신 별도로 초기화한 이미지 예측 헤드를 쓴다. [Chameleon](#/p/chameleon)이 이미지·텍스트를 같은 토큰 어휘로 융합한 것과 정반대로, 여기서는 입력 인코딩만 갈라놓고 트랜스포머는 그대로 공유한다.'},
 {h:'3단계 학습 전략을 재조정: ImageNet 프리트레이닝 축소',
  lead:'Stage I을 늘려 ImageNet 픽셀 의존성 학습을 끝내고, Stage II에서는 아예 뺀다.',
  d:'전작은 Stage II에서 텍스트-이미지 학습 스텝의 66.67%를 ImageNet 카테고리명 기반 생성에 썼는데, 이는 계산 낭비였다. Janus-Pro는 Stage I(어댑터+이미지 헤드만 학습)을 늘려 LLM이 고정된 채로도 픽셀 의존성을 충분히 학습하게 하고, Stage II에서는 ImageNet 데이터를 완전히 빼고 일반 텍스트-이미지 데이터만 쓴다. Stage III(SFT)의 멀티모달:순수텍스트:텍스트-이미지 데이터 비율도 7:3:10에서 5:1:4로 바꿔 텍스트-이미지 비중을 줄이면서 이해 성능을 끌어올렸다.'},
 {h:'실제 데이터 노이즈를 합성 미학 데이터로 상쇄',
  lead:'실제 텍스트-이미지 데이터의 노이즈 문제를 합성 데이터 비율 1:1로 완화한다.',
  d:'전작이 쓴 실제 텍스트-이미지 데이터는 품질이 낮고 노이즈가 많아 생성이 불안정하고 미적으로 떨어지는 원인이었다. Janus-Pro는 약 7200만 장의 합성 미학 데이터를 추가해 통합 사전학습 단계의 실제:합성 데이터 비율을 1:1로 맞췄다. 합성 데이터로 학습하면 수렴이 더 빠르고 결과물의 안정성·미적 품질이 크게 개선됐다고 보고한다.'},
 {h:'이해 데이터를 DeepSeek-VL2 기준으로 약 9천만 샘플 추가',
  lead:'표·차트·문서 이해 데이터와 멀티모달 대화 데이터를 대거 보강한다.',
  d:'Stage II 사전학습에는 DeepSeek-VL2 데이터 구성을 참고해 이미지 캡션(YFCC 등)과 표·차트·문서 이해 데이터(Docmatix 등) 약 9천만 샘플을 추가했다. Stage III SFT에는 밈 이해, 중국어 대화 데이터 등을 더해 대화 경험을 강화했다.'},
 {h:'모델 크기 확장: 1.5B → 7B',
  lead:'LLM을 1.5B에서 7B로 키워 이해·생성 양쪽의 수렴 속도가 크게 개선됨을 확인한다.',
  d:'전작은 1.5B LLM으로 인코딩 분리의 효과를 검증했다. Janus-Pro는 1B/7B 두 크기를 내놓으며, 7B로 키우면 이해·생성 양쪽 loss의 수렴 속도가 눈에 띄게 빨라져 이 접근법이 스케일에 잘 견딘다는 것을 확인했다.'}
],

diagram:{type:'compare', cap:'이미지·텍스트를 하나의 토큰 공간으로 합친 Chameleon과, 인코딩만 분리하고 트랜스포머는 공유하는 Janus-Pro 비교.',
 left:{t:'Chameleon: 완전 통합', items:['이미지·텍스트 같은 토큰 어휘','단일 인코딩 경로','이해·생성 표현 공유']},
 right:{t:'Janus-Pro: 인코딩만 분리', items:['이해=SigLIP, 생성=VQ','트랜스포머는 하나로 공유','작업별 최적 표현 확보']}
},

numbers:[
 {k:'MMBench (이해), 7B', v:'79.2', d:'Janus 69.4 · TokenFlow 68.9 · MetaMorph 75.2 상회 (Table 3)'},
 {k:'GenEval overall (생성), 7B', v:'0.80', d:'Janus 0.61 · DALL-E 3 0.67 · SD3-Medium 0.74 상회 (Table 4)'},
 {k:'DPG-Bench overall, 7B', v:'84.19', d:'생성 전용 모델 포함 전체 최고, Janus 79.68 대비 개선 (Table 5)'},
 {k:'이해용 추가 데이터', v:'약 9천만 샘플', d:'DeepSeek-VL2 기준 Stage II 사전학습에 추가'},
 {k:'생성용 합성 데이터', v:'약 7200만 샘플', d:'실제:합성 비율을 1:1로 조정'},
 {k:'모델 크기', v:'1B / 7B', d:'전작(1.5B) 대비 최대 7B로 확장'}
],

impact:'Janus-Pro는 "이해와 생성을 하나의 모델로 묶되 인코딩은 나눈다"는 설계가 데이터·모델 스케일링에 잘 반응한다는 것을 보였다. GenEval·DPG-Bench에서 생성 전용 확산 모델까지 능가한 결과는, 통합 모델이 더는 이해-생성 트레이드오프 때문에 전용 모델에 뒤처지지 않을 수 있음을 시사했다. 아키텍처 자체는 전작에서 그대로 가져왔기 때문에, 이 논문은 "새 구조"가 아니라 "같은 구조를 데이터·학습 절차·크기로 얼마나 밀어붙일 수 있는가"를 보여준 사례로 읽힌다.',

legacy:[
 '**인코딩 분리 vs 완전 통합 논쟁** — [Chameleon](#/p/chameleon)식 단일 토큰 공간과 Janus식 분리 인코딩이 통합 멀티모달 모델의 두 갈래 설계로 계속 비교됨',
 '**학습 단계 재설계의 참고 사례** — ImageNet 사전학습을 줄이고 합성 데이터 비율을 조정한 방식이 후속 통합 모델의 학습 레시피에 참고됨',
 '**작은 모델로도 통합 모델이 성립함을 확인** — 1B 모델도 이해·생성 양쪽에서 합리적 성능을 냄으로써 통합 모델의 경량화 가능성을 보여줌',
 '**DeepSeek 계열 VLM 로드맵의 한 축** — DeepSeek-VL2의 데이터 구성을 재사용하며 DeepSeek의 멀티모달 라인업 안에서 위치가 이어짐'
],

pitfalls:[
 '**아키텍처는 새 것이 아니다.** Figure 3이 명시하듯 Janus-Pro의 구조는 전작 Janus와 동일하다 — 이 논문의 기여는 학습 전략·데이터·모델 크기이지 새 블록이 아니다.',
 '**"인코딩 분리"가 "가중치 전부 분리"를 뜻하지 않는다.** 분리되는 것은 이해용 SigLIP과 생성용 VQ tokenizer(및 각각의 어댑터)뿐이고, 이후의 autoregressive transformer 본체는 이해·생성 작업이 공유한다.',
 '**GenEval·DPG-Bench 점수는 자동 평가 지표다.** 사람이 보기에 자연스러운 이미지인지와는 별개로, 지시-따르기 정확도(객체 수·색상·위치 등)를 측정하는 벤치마크라는 점을 감안해야 한다.'
],

figures:[
 {f:'fig-arch.png', cap:'왼쪽 Understanding 경로는 Und. Encoder(SigLIP)로 이미지를 받아 언어 응답을 만들고, 오른쪽 Image Generation 경로는 Gen. Encoder(VQ tokenizer)로 이미지를 받아 이미지를 생성한다. 가운데 Auto-Regressive Transformer가 두 경로에서 공유되는 유일한 지점이다.',
  src:'원문 Figure 3, p.3'}
],

quotes:[
 {t:'The core design principle of the overall architecture is to decouple visual encoding for multimodal understanding and generation.',
  src:'Section 2.1, p.3'}
],

links:[
 {t:'arXiv 2501.17811 — Janus-Pro', u:'https://arxiv.org/abs/2501.17811'},
 {t:'GitHub — deepseek-ai/Janus', u:'https://github.com/deepseek-ai/Janus'}
]
});
