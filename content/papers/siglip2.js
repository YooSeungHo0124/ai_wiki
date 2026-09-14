WIKI.paper({
slug:'siglip2',
venue:'arXiv 2025 (Google DeepMind)',
authors:'Tschannen, Gritsenko, Wang, Naeem, Alabdulmohsin et al. (Google DeepMind)',
arxiv:'2502.14786',

tldr:'[SigLIP](#/p/siglip)의 sigmoid 대조 손실에 캡셔닝 기반 사전학습(LocCa)과 [DINO](#/p/dino) 계열 자기지도(자기증류·마스킹 예측)를 한 레시피로 합쳤다. 그 결과 원래 SigLIP보다 모든 모델 크기에서 제로샷·검색뿐 아니라 **위치추정·dense 예측**까지 함께 좋아진, 이후 여러 VLM이 표준 비전 인코더로 채택하는 모델이 됐다.',

context:'[CLIP](#/p/clip)·[SigLIP](#/p/siglip) 같은 대조학습 인코더는 제로샷 분류·검색에는 강하지만, 이미지 전체와 텍스트를 맞추는 목표 특성상 물체의 위치나 지역적 구조를 정밀하게 담는 데는 약하다는 한계가 있었다. 한편 재캡셔닝, 이미지 전용 자기지도 손실, 캡셔닝·위치추정용 소형 디코더를 붙이는 시도들이 개별적으로는 있었지만, 이들을 하나로 통합해 공개한 모델은 없었다. SigLIP 2는 이런 개별 개선들을 하나의 학습 레시피로 합치는 것을 목표로 한다.',

ideas:[
 {h:'SigLIP 손실 위에 캡셔닝 손실(LocCa)을 얹는다',
  lead:'이미지 인코더에 텍스트 디코더를 cross-attention으로 붙여 캡셔닝·재영역 표현·referring expression을 함께 학습한다.',
  d:'[LocCa](https://arxiv.org/abs/2403.19325)의 레시피를 따라 autoregressive 디코더가 이미지 인코더 출력에 cross-attention으로 접근하며 캡션 생성, dense captioning, referring expression 예측을 학습한다. 이 디코더 기반 손실이 OCR 능력과 위치추정(localization) 성능을 끌어올린다.'},
 {h:'자기증류·마스킹 예측으로 dense 특징을 보강한다',
  lead:'SILC/TIPS 방식의 self-distillation과 masked prediction을 학습 후반 20%에 추가한다.',
  d:'[DINO](#/p/dino) 계열처럼 EMA teacher 이미지 인코더를 두고, student가 (1) teacher와 표현을 맞추는 self-distillation, (2) 일부를 가린 입력에서 가려진 위치의 표현을 맞추는 masked prediction을 학습한다. 이 두 손실은 학습 전체가 아니라 **마지막 20%** 구간에만 추가되며, 세그멘테이션·깊이 추정 같은 dense 예측 성능을 크게 끌어올린다.'},
 {h:'NaFlex: 종횡비를 보존하는 가변 해상도',
  lead:'FlexiViT의 가변 패치 시퀀스 길이와 NaViT의 종횡비 보존을 결합해 한 체크포인트로 여러 해상도를 지원한다.',
  d:'표준 SigLIP처럼 정사각형으로 찌그러뜨려 리사이즈하는 대신, 원본 종횡비를 유지한 채로 목표 시퀀스 길이에 맞춰 이미지를 전처리한다. 문서·화면 이해처럼 종횡비가 중요한 응용에서 표준 변형보다 더 나은 성능을 보이며, 하나의 체크포인트로 여러 시퀀스 길이(해상도)를 함께 지원한다.'},
 {h:'온라인 데이터 큐레이션과 다국어·공정성 개선',
  lead:'활성 샘플 선택 기반 증류로 작은 모델을 개선하고, 다국어·편향 완화 데이터 믹스를 함께 학습한다.',
  d:'가장 작은 모델(B/16, B/32)의 품질을 끌어올리기 위해 활성 샘플 선택(active data curation)을 통한 암묵적 증류를 적용한다. 또한 더 다양한 데이터 믹스와 편향 완화 기법으로 다국어 이해와 공정성을 함께 개선했다.'},
 {h:'네 가지 크기로 계산-성능 트레이드오프를 제공',
  lead:'B(86M)·L(303M)·So400m(400M)·g(1B) 네 크기로 추론 비용과 성능을 선택하게 한다.',
  d:'아키텍처는 원래 SigLIP과 동일하게 유지해, 기존 SigLIP 사용자가 가중치와 (이제 다국어인) 토크나이저만 교체하면 바로 개선을 얻을 수 있도록 하위 호환성을 지켰다.'}
],

diagram:{type:'flow', cap:'SigLIP 2의 학습 손실 구성. SigLIP(v1)의 sigmoid 손실에 캡셔닝(LocCa)과 자기지도(SILC/TIPS)를 더한다.',
 nodes:[
  {t:'이미지·텍스트 인코더', s:'SigLIP과 동일 구조'},
  {t:'Sigmoid 손실', s:'전체 학습, 원 SigLIP'},
  {t:'LocCa 캡셔닝 손실', s:'AR 디코더, cross-attn'},
  {t:'SILC/TIPS 손실', s:'자기증류+마스킹, 후반 20%', acc:true}
 ]},

numbers:[
 {k:'ImageNet 제로샷 (So400m/14, 384px)', v:'85.0%', d:'같은 크기 SigLIP(83.2%) 대비 +1.8%p'},
 {k:'ImageNet 제로샷 (B/16, 256px)', v:'78.2%', d:'같은 크기 SigLIP(76.2%) 대비 +2.0%p'},
 {k:'모델 크기 라인업', v:'B(86M)·L(303M)·So400m(400M)·g(1B)', d:'추론 비용에 따라 선택 가능하게 4종 공개'},
 {k:'NaFlex 시퀀스 길이', v:'가변(단일 체크포인트)', d:'종횡비 보존, FlexiViT+NaViT 결합'}
],

impact:'SigLIP 계열을 "제로샷 분류용 인코더"에서 "제로샷·검색·위치추정·dense 예측을 두루 감당하는 범용 비전 인코더"로 넓혔다. 이 범용성 덕에 [Qwen3-VL](#/p/qwen3-vl)이 SigLIP2-SO-400M을 비전 인코더로 그대로 채택하는 등, 이후 여러 VLM이 자체 비전 인코더를 처음부터 학습하는 대신 SigLIP 2를 표준 부품으로 가져다 쓰는 흐름이 생겼다. 다만 이는 CLIP류 대조학습 인코더가 [DINOv2](#/p/dinov2) 같은 순수 자기지도 모델의 dense 성능을 완전히 대체했다는 뜻은 아니다 — DINOv3 등의 비교에서 SigLIP 2는 여전히 자기지도 전용 모델에 dense 과제 일부에서 뒤처진다.',

legacy:[
 '**[Qwen3-VL](#/p/qwen3-vl)의 기본 비전 인코더로 채택** — SigLIP2-SO-400M(소형 LLM에는 SigLIP2-Large)을 그대로 가져와 동적 해상도로 이어 학습',
 '**dense 예측 비교의 baseline으로 자리잡음** — [DINOv3](#/p/dinov3) 등 이후 dense 예측 논문들이 "약지도 대표"로 SigLIP 2를 비교 대상에 포함',
 '**LocCa·SILC/TIPS 같은 개별 기법들의 실전 검증** — 각각 논문으로만 존재하던 기법들을 하나의 공개 모델로 통합해 재현·비교를 쉽게 만듦'
],

pitfalls:[
 '**"모든 면에서 SigLIP을 이긴다"는 과제별로 조건이 다르다.** dense 예측·위치추정 개선은 학습 후반 20%에 추가된 자기지도 손실 덕이 크므로, 그 구간을 생략한 변형과 단순 비교하면 안 된다.',
 '**NaFlex는 별도 변형이다.** 표준 고정 해상도 SigLIP 2와 NaFlex는 서로 다른 체크포인트/학습 경로이며, "SigLIP 2"라는 이름만으로 종횡비 보존을 기대하면 안 된다.',
 '**dense 성능이 DINOv2 같은 순수 자기지도 모델보다 항상 앞서는 것은 아니다.** SigLIP 2는 "약지도 대조학습 계열 중 개선"이라는 틀에서 봐야 하며, 자기지도 전용 백본과 직접 비교하면 여전히 격차가 있는 지표가 있다.'
],

figures:[
 {f:'fig1-recipe.png',
  cap:'왼쪽 EMA teacher(회색)가 student 이미지 인코더에 SILC/TIPS 손실(자기증류+마스킹 예측)을 준다. 가운데 이미지 인코더가 오른쪽 AR 디코더에 cross-attention으로 연결되어 LocCa 캡셔닝 손실을 받고, 동시에 텍스트 인코더와 함께 SigLIP(v1)의 sigmoid 손실(점선 상자)을 받는다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'SigLIP 2 models outperform their SigLIP counterparts at all model scales in core capabilities... Furthermore, the new training recipe leads to significant improvements on localization and dense prediction tasks.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2502.14786 — SigLIP 2', u:'https://arxiv.org/abs/2502.14786'},
 {t:'big_vision (공식 구현 · 체크포인트)', u:'https://github.com/google-research/big_vision/tree/main/big_vision/configs/proj/image_text/README_siglip2.md'}
]
});
