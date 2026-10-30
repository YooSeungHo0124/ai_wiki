WIKI.paper({
slug:'lorat',
venue:'ECCV 2024',
authors:'Lin, Fan, Zhang, Wang, Xu, Ling (Peng Cheng Lab · UNT · Stony Brook 외)',
arxiv:'2403.05231',

tldr:'LLM에서 쓰던 **LoRA**를 단일 스트림 ViT 추적기에 처음 적용해, 연구실 수준 GPU로 ViT-g(약 11억 파라미터)급 추적기까지 학습할 수 있게 만든 논문. LoRA가 제대로 동작하도록 위치 임베딩을 "공유 위치 + 토큰 타입"으로 분리하고 컨볼루션 헤드를 MLP 헤드로 바꿨다.',

context:'[OSTrack](#/p/ostrack) 이후 성능 좋은 트랜스포머 추적기는 대부분 데이터센터급 GPU 여러 장과 긴 학습 시간을 요구했다. 저자들이 지적하는 가장 큰 추적 모델은 ViT-L 백본의 SeqTrack-L384인데, 공개된 사전학습 ViT의 크기에는 한참 못 미친다. LLM 쪽에서는 이미 파라미터 효율적 미세조정(PEFT)이 비용 문제의 해법으로 자리잡았지만, 추적에서는 거의 시도되지 않았다. 그대로 갖다 붙이면 잘 안 되는 이유가 두 가지 있었다 — 템플릿·검색 영역에 따로 둔 위치 임베딩, 그리고 컨볼루션 헤드의 귀납 편향이다.',

ideas:[
 {h:'위치 임베딩을 "공유 위치"와 "토큰 타입"으로 분리',
  lead:'사전학습 ViT의 위치 임베딩을 그대로 공유하고, 출처 구분은 BERT식 타입 임베딩이 맡는다.',
  d:'기존 단일 스트림 추적기는 템플릿과 검색 영역에 서로 다른 위치 임베딩을 두어 사전학습 구조를 흩뜨린다. LoRAT은 두 영역이 같은 위치 임베딩을 쓰게 하고, 템플릿 전경·템플릿 배경·검색 영역을 구분하는 세 개의 타입 임베딩($E^{T_o}, E^{T_b}, E^{S}$)만 새로 학습한다. 템플릿 안에서 표적에 해당하는 패치에는 전경 타입을 붙이는 "전경 지시 임베딩"도 쓴다.'},
 {h:'슬라이싱 방식 위치 임베딩 적응',
  lead:'해상도가 다른 템플릿에는 위치 임베딩을 보간하지 않고 왼쪽 위 블록을 잘라 쓴다.',
  d:'검색 영역이 ViT의 기본 해상도라고 가정하면 그 위치 임베딩 $P_x$ 를 그대로 쓸 수 있다. 더 작은 템플릿에는 $P_x$ 에서 템플릿 패치 격자 크기만큼 왼쪽 위 블록을 잘라 쓰는 방식(slicing)이 보간(interpolation)보다 좋았다고 저자들은 ablation에서 보고한다. 위치 임베딩을 동결한 채로 두어도 학습한 경우와 비슷하거나 약간 낫다.'},
 {h:'MLP만으로 만든 앵커 프리 헤드',
  lead:'컨볼루션 헤드는 LoRA 미세조정에서 수렴하지 않아 3층 MLP 두 갈래로 교체한다.',
  d:'분류와 박스 회귀를 각각 3층 MLP로 하고, 중심 기반 앵커 프리 방식으로 박스 후보와 분류 점수를 낸다. 저자들은 컨볼루션의 지역성 같은 귀납 편향이 LoRA의 저차원 갱신 가정과 맞지 않기 때문이라고 해석한다. Table 5에서 OSTrack식 컨볼루션 헤드를 LoRA 설정에 쓰면 LaSOT SUC가 5.4로 무너진다.'},
 {h:'ViT의 모든 선형층에 LoRA(rank 64)',
  lead:'백본은 동결하고 어텐션·MLP의 선형층 6개에 저차원 업데이트만 학습한다.',
  d:'[LoRA](#/p/lora)는 가중치 갱신 $\\Delta\\theta\\approx BA$ 를 저차원 행렬 곱으로 근사하고, 학습 후 원래 가중치에 합쳐 추론 지연을 더하지 않는다. LoRAT은 [ViT](#/p/vit)의 어텐션 투영 4개와 MLP 투영 2개 모두에 rank 64를 쓴다. 백본은 DINOv2 사전학습 가중치가 기본이며, 학습되는 부분은 LoRA·타입 임베딩·헤드뿐이다.'}
],

diagram:{type:'stack', cap:'LoRAT 구조. 파란 동결 부분 위에 학습되는 부분(LoRA, 타입 임베딩, MLP 헤드)만 얹었다. 아래가 입력이다.',
 layers:[
  {t:'패치 임베딩', s:'템플릿 + 검색', note:'← 선형 투영 동결'},
  {t:'위치 임베딩', s:'템플릿·검색 공유', note:'← 사전학습 값 그대로'},
  {t:'토큰 타입 임베딩', s:'전경/배경/검색', acc:true, note:'← 새로 학습'},
  {t:'ViT 인코더 + LoRA', s:'선형층 6개, r=64', acc:true, note:'← 저차원만 학습'},
  {t:'MLP 전용 헤드', s:'분류 + 박스 회귀', note:'← 컨볼루션 제거'}
 ]},

math:[
 {expr:'Δθ ≈ Δφ = B A,  B ∈ R^{d×r}, A ∈ R^{r×k}',
  tex:'\\Delta\\theta\\approx\\Delta\\phi=BA,\\quad B\\in\\mathbb{R}^{d\\times r},\\ A\\in\\mathbb{R}^{r\\times k},\\ r\\ll\\min(d,k)',
  d:'가중치 갱신을 $d\\times k$ 개 대신 $(d+k)\\times r$ 개 파라미터로 표현한다. 학습 뒤 $BA$ 를 원래 가중치에 더해 넣으면 추론 비용이 늘지 않는다.'},
 {expr:'E_T^(i,j) = E_pos^(i,j) + E_type(전경 or 배경),  E_S^(i,j) = E_pos^(i,j) + E_type(검색)',
  tex:'E_T^{(i,j)}=E_{pos}^{(i,j)}+E^{T_o\\text{ or }T_b}_{type},\\qquad E_S^{(i,j)}=E_{pos}^{(i,j)}+E^{S}_{type}',
  d:'위치 항 $E_{pos}$ 는 템플릿과 검색 영역이 공유하고, 타입 항만 영역별로 다르다. 템플릿 패치가 표적에 속하면 전경 타입, 아니면 배경 타입을 더한다.'}
],

numbers:[
 {k:'LaSOT · SUC (g-378 / L-378 / L-224 / B-224)', v:'76.2 / 75.1 / 74.2 / 71.7', d:'Table 1. 초록은 L-224의 SUC를 0.703에서 0.742로 올렸다고 보고'},
 {k:'L-224 학습 시간', v:'35.0 → 10.8 GPU 시간', d:'초록·Figure 1. V100 8장 기준. Table 7에서 L-224를 LoRA로 학습하면 10.8시간·6.6GB, 풀 파인튜닝은 12.1시간·10.0GB'},
 {k:'g-378 학습 자원', v:'60.0시간 · 25.8GB', d:'Table 7. 같은 g-378을 풀 파인튜닝하면 메모리 부족(OOM)으로 학습 불가'},
 {k:'추론 속도 (fps)', v:'B-224 209 · L-224 119 · g-378 20', d:'Table 2. 저자 장비에서 재측정한 값. OSTrack-256 130, SeqTrack-L384 6'},
 {k:'LoRA vs 풀 파인튜닝 (LaSOT SUC)', v:'L-224 74.2 vs 73.0, B-224 71.7 vs 70.9', d:'Table 3. B-378은 풀 파인튜닝이 72.9보다 0.3 높은 73.2라서 항상 LoRA가 앞서는 것은 아니다'},
 {k:'컨볼루션 헤드 + LoRA (L-224, LaSOT SUC)', v:'4.7', d:'Table 5. 수렴 실패 수준. 같은 헤드를 풀 파인튜닝하면 71.7로 정상 동작'}
],

impact:'LoRAT은 추적 분야에 "큰 ViT를 쓰려면 큰 GPU 클러스터가 필요하다"는 전제를 흔든 논문이다. 단순히 LoRA를 붙인 것이 아니라 위치 임베딩 구조와 헤드 구조를 LoRA에 맞게 바꿔야 한다는 점을 ablation으로 보였다. 그 결과 ViT-g 백본으로 LaSOT SUC 76.2를 얻으면서 학습 자원은 8×V100 60시간 안에 들어왔다. 트랜스포머 추적기의 규모 확장을 방해하던 학습 비용 병목을 크게 낮췄다.',

legacy:[
 '**[SUTrack](#/p/sutrack)** 은 LoRAT의 토큰 타입 임베딩에서 영감을 받아, 경계 패치를 전경·배경 임베딩의 가중합으로 처리하는 soft token type embedding으로 확장했다',
 '**[SUTrack](#/p/sutrack)·[SAM2Long](#/p/sam2long)·[DAM4SAM](#/p/dam4sam)의 비교표에서 박스 추적 최상위 기준선**으로 반복 등장한다(LoRAT-L-378, LaSOT 75.1)',
 '**PEFT를 컴퓨터 비전 하위 과제(추적)에 가져온 사례**로, 큰 사전학습 백본을 얼려 두고 소수 파라미터만 학습하는 흐름의 한 예가 됐다'
],

pitfalls:[
 '**LoRA가 풀 파인튜닝보다 항상 좋은 것은 아니다.** Table 3의 LaSOT SUC 차이는 대부분 0.2~1.2 수준이고 B-378에서는 풀 파인튜닝이 0.3 더 높다. 핵심 이득은 정확도보다 메모리·시간 절감이다.',
 '**헤드를 바꾸지 않고 LoRA만 붙이면 학습이 실패한다.** 컨볼루션 헤드는 LoRA 설정에서 SUC 4~5대로 수렴하지 못했다. 위치 임베딩 분리도 마찬가지로 구조 변경이 먼저 필요하다.',
 '**모델이 클수록 항상 좋아지지는 않는다.** LaSOText에서 L-378(SUC 56.6)이 g-378(56.5)보다 높다. GOT-10k에서는 해상도보다 모델 크기가 더 크게 작용하고, fps는 저자 장비 기준이다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'아래부터 위로 읽는다. 패치 임베딩에 공유 위치 임베딩(P)과 토큰 타입 임베딩(b: 템플릿 배경, t: 템플릿 전경, s: 검색)을 더해 인코더에 넣는다. 눈송이는 동결, 불꽃은 학습 대상이며, 오른쪽은 인코더 블록 안에서 LoRA가 붙는 위치(MSA·MLP)다.',
  src:'원문 Figure 2, p.5'}
],

quotes:[
 {t:'Albeit effective in full fine-tuning [72], such design is not well aligned with LoRA-style PEFT and thus results in suboptimal performance.',
  src:'Introduction, p.3'}
],

links:[
 {t:'arXiv 2403.05231 — Tracking Meets LoRA', u:'https://arxiv.org/abs/2403.05231'},
 {t:'GitHub — LitingLin/LoRAT', u:'https://github.com/LitingLin/LoRAT'}
]
});
