WIKI.paper({
slug:'internvl',
venue:'CVPR 2024',
authors:'Chen, Wu, Wang et al. (OpenGVLab · Shanghai AI Lab · Tsinghua)',
arxiv:'2312.14238',

tldr:'비전 인코더를 언어 모델 규모에 맞춰 **60억 파라미터**까지 키우고, 대조학습→생성학습→지도 미세조정의 3단계로 언어 모델과 점진적으로 정렬시킨 논문. "VLM의 비전 인코더는 10억 개면 충분하다"는 관행에 정면으로 반박한다.',

context:'2023년 말 기준 LLM은 이미 1000억 파라미터를 넘겼는데, [LLaVA](#/p/llava)·[Qwen-VL](#/p/qwen-vl) 같은 VLM이 쓰는 비전 인코더는 대부분 [CLIP](#/p/clip) 계열로 10억 파라미터 안팎에 머물러 있었다. 이 격차는 두 가지 문제를 낳는다 — 언어 모델의 용량을 비전 쪽이 다 못 받아내는 **파라미터 불균형**, 그리고 QFormer나 선형 투영 같은 가벼운 접합층만으로는 두 표현 공간을 제대로 정렬하기 어려운 **표현 불일치**다. [PaLI](#/p/pali)가 비전 인코더를 4B까지 키워 이 문제를 처음 지적했다면, InternVL은 "그럼 얼마나 더 키울 수 있는가"를 6B까지 밀어붙인 실험이다.',

ideas:[
 {h:'InternViT-6B: ViT를 언어 모델 스케일로',
  lead:'순정 ViT 구조를 유지한 채 파라미터를 60억까지 늘리고 안정성 위주로 하이퍼파라미터를 고른다.',
  d:'깊이 {32,48,64,80}, head 차원 {64,128}, MLP 비율 {4,8}을 조합해 탐색한 결과, 같은 파라미터 수에서는 깊이·head 차원·MLP 비율이 성능에 거의 영향을 주지 않는다는 것을 발견했다. 대신 안정성이 갈렸고, 그 기준으로 깊이 48·폭 3200·head 25개 구성(InternViT-6B)을 최종 채택했다. 새 구조를 발명한 게 아니라 **기존 ViT를 안정적으로 키우는 법**을 찾은 것이다.'},
 {h:'QLLaMA: 8B짜리 "접합층"',
  lead:'96개 학습 가능한 쿼리와 cross-attention으로 시각 특징을 언어모델 표현 공간에 재조직한다.',
  d:'다국어 LLaMA-7B에 새로 96개의 학습 가능한 쿼리와 cross-attention 레이어(10억 파라미터)를 추가해 QLLaMA를 만든다. 기존 VLM들이 QFormer(수백만 파라미터) 같은 가벼운 접합층을 썼던 것과 달리, QLLaMA는 8B 파라미터 전체가 정렬에 관여한다 — QFormer보다 42배 크다. 비전 인코더 쪽만 키우고 접합층은 그대로 얇게 두면 병목이 접합층으로 옮겨갈 뿐이라는 진단이다.'},
 {h:'3단계 점진적 정렬',
  lead:'대조학습 → 생성학습 → 지도 미세조정 순으로 목적함수를 바꿔가며 단계적으로 정렬한다.',
  d:'1단계는 InternViT-6B와 LLaMA-7B를 웹 규모 이미지-텍스트 쌍(60억 개, 정제 후 약 50억 개)으로 대조학습시켜 [CLIP](#/p/clip)과 비슷한 정렬을 얻는다. 2단계는 InternViT를 얼리고 QLLaMA를 cross-attention으로 붙여 매칭·대조·생성 손실을 동시에 걸어 생성 능력을 추가한다. 3단계는 QLLaMA 출력을 MLP로 Vicuna-13B에 연결해 멀티모달 대화·VQA로 지도 미세조정한다. 각 단계가 이전 단계의 가중치를 얼리거나 재사용해, 60억 규모 비전 인코더를 처음부터 언어모델과 같이 학습하는 대신 **단계별로 위험을 분산**한다.'},
 {h:'"Swiss army knife": 조합에 따라 다른 과제를 지원',
  lead:'같은 컴포넌트를 다르게 조합해 대조·생성·대화 과제를 전부 커버한다.',
  d:'InternViT-6B 단독(perception), InternViT+QLLaMA(제로샷 분류·검색), InternViT+QLLaMA+Vicuna(캡셔닝·대화)처럼 컴포넌트 조합을 바꿔가며 InternVL-C, InternVL-G, InternVL-Chat 등 여러 추론 모드를 하나의 학습된 파라미터 집합에서 뽑아낸다. 이는 접합층이 가벼워서 떼었다 붙였다 하기 쉬운 late-fusion 계열([PaLI](#/p/pali)와도 다르고 early-fusion [Chameleon](#/p/chameleon)과도 다른) 절충안이다.'}
],

diagram:{type:'stack', cap:'3단계 정렬 파이프라인. 각 단계에서 이전 컴포넌트를 얼리고 새 목적함수를 추가한다.',
 layers:[
  {t:'Stage 1: 대조학습', s:'ViT-6B ↔ LLaMA-7B', note:'둘 다 학습, 대조 손실'},
  {t:'Stage 2: 생성학습', s:'+ QLLaMA (8B)', acc:true, note:'ViT 동결, QLLaMA 학습'},
  {t:'Stage 3: SFT', s:'+ Vicuna-13B (MLP 연결)', note:'대화·VQA로 정렬'}
 ]},

numbers:[
 {k:'InternViT-6B', v:'폭 3200 · 깊이 48 · head 25', d:'ViT-22B(21.7B)보다 작지만 다수 벤치마크에서 근접하거나 상회'},
 {k:'QLLaMA', v:'8B (신규 cross-attn 1B 포함)', d:'QFormer 대비 파라미터 약 42배'},
 {k:'Stage 1 학습 데이터', v:'60.3억 쌍 → 정제 후 49.8억', d:'LAION-en·LAION-multi·COYO·Wukong 등 웹 규모 혼합'},
 {k:'ImageNet-1K 제로샷 top-1', v:'83.2%', d:'InternVL-C, 동시대 CLIP 계열 중 최고 수준'},
 {k:'Flickr30K 제로샷 검색 (중국어)', v:'image→text R@1 92.9', d:'InternVL-G, 다국어 검색에서도 강함'},
 {k:'COCO 캡셔닝 CIDEr', v:'146.2', d:'InternVL-Chat(w/ QLLaMA), Vicuna-13B 연결 기준'}
],

impact:'InternVL은 "비전 인코더는 CLIP 정도 크기면 충분하다"는 VLM 커뮤니티의 암묵적 합의를 6B 규모 실험으로 무너뜨렸다. 동시에 접합층(QLLaMA)도 함께 키워야 비전 확장의 이득이 언어모델까지 전달된다는 것을 보여, 스케일업이 비전 인코더 하나만의 문제가 아니라는 점을 분명히 했다. InternViT는 이후 공개된 대형 비전 인코더 중 하나로 여러 후속 VLM 연구에 백본으로 재사용되었고, 3단계 점진적 정렬 절차는 대형 비전 인코더를 언어모델에 안전하게 붙이는 방법론의 참고 사례가 되었다.',

legacy:[
 '**대형 비전 인코더 표준화** — InternViT 계열이 이후 InternVL 2.0/2.5 등 후속 버전과 다른 연구의 비전 백본으로 재사용됨',
 '**[PaLI](#/p/pali)의 문제의식을 더 큰 스케일로 재검증** — "비전-언어 과제에서 비전 스케일링은 포화되지 않는다"는 관찰을 4B에서 6B로, 그리고 접합층 크기까지 포함해 재확인',
 '**점진적 정렬 레시피** — 대조학습으로 먼저 정렬하고 생성학습·SFT를 순서대로 얹는 3단계 절차가 이후 대형 VLM 학습 파이프라인 설계에 참고 사례가 됨',
 '**Swiss-army-knife 설계** — 하나의 학습된 모델에서 대조·생성·대화 모드를 골라 쓰는 유연성이, 이후 VLM이 여러 하위 벤치마크를 동시에 커버하도록 설계되는 관행에 영향'
],

pitfalls:[
 '**QLLaMA는 InternViT와 별개의 8B 모델이다.** "비전 인코더가 6B"라는 문구만 보고 전체 모델을 6B로 오해하기 쉬운데, 실제 InternVL-Chat 전체는 InternViT(6B)+QLLaMA(8B)+Vicuna(13B)를 합쳐 훨씬 크다.',
 '**Stage 2에서 InternViT는 동결된다.** "함께 스케일업한다"는 제목만 보고 전 단계에서 두 컴포넌트가 계속 같이 학습된다고 생각하면 틀린다 — 실제로는 단계마다 무엇을 얼리고 무엇을 학습할지가 다르다.',
 '**제로샷 분류·검색 수치(InternVL-C/G)와 대화형 수치(InternVL-Chat)는 서로 다른 컴포넌트 조합의 결과다.** 벤치마크 표를 비교할 때 어느 조합(그림 4의 (a)~(d)) 기준인지 반드시 확인해야 한다.'
],

figures:[
 {f:'fig1-comparison.png',
  cap:'왼쪽부터 (a) 분류 전용 지도학습 비전 모델, (b) CLIP류 대조학습 비전-언어 모델, (c) InternVL. (c)에서만 비전 인코더 쪽에 "6B #params로 스케일업"이라는 빨간 글씨가 붙어 있고, 오른쪽에 언어 모델과의 가중치 공유(shared weights) 화살표가 추가된 것이 핵심 차이.',
  src:'원문 Figure 1, p.1'},
 {f:'fig3-training-stages.png',
  cap:'불꽃 아이콘(학습 중)과 얼음 아이콘(동결)의 위치가 단계마다 바뀐다. Stage 1에서는 InternViT·LLaMA 둘 다 학습되지만, Stage 2에서는 InternViT가 얼고 QLLaMA만 학습되며, Stage 3에서는 QLLaMA도 얼고 MLP 연결부만 학습된다 — 단계가 진행될수록 학습 대상이 좁아지는 것을 한눈에 볼 수 있다.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'In this work, we design a large-scale vision-language foundation model (InternVL), which scales up the vision foundation model to 6 billion parameters and progressively aligns it with the LLM, using web-scale image-text data from various sources.',
  src:'Abstract, p.1'},
 {t:'The large LLMs now boosts up to 1000 billion parameters, while the widely-used vision encoders of VLLMs are still around one billion. This gap may lead to the under-use of LLM\'s capacity.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 2312.14238 — InternVL', u:'https://arxiv.org/abs/2312.14238'},
 {t:'GitHub: OpenGVLab/InternVL', u:'https://github.com/OpenGVLab/InternVL'}
]
});
