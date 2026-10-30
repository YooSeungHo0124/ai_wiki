WIKI.paper({
slug:'ostrack',
venue:'ECCV 2022',
authors:'Ye et al. (CAS ICT · UCAS)',
arxiv:'2203.11991',

tldr:'템플릿과 탐색 영역 이미지 패치를 하나의 시퀀스로 이어 붙여 **평범한 ViT 하나**에 넣는 one-stream 트래커. 별도 관계 모델링 모듈 없이 박스 헤드만 얹었고, 배경 토큰을 층 중간에 버리는 early candidate elimination으로 속도도 올렸다.',

context:'기존 트래커는 템플릿과 탐색 영역을 같은 CNN으로 따로 처리하고(two-stream), 그 다음에 상관 연산이나 Transformer로 관계를 모델링하는(two-stage) 구조였다. 이러면 추출된 특징이 오프라인 학습 후 고정되어 타깃이 무엇인지 모르고, 학습 데이터에 없던 부류의 물체를 추적할 때 특히 약하다. 관계 모듈을 가볍게 하면(상관 연산) 정보가 손실되고, 무겁게 하면([TransT](#/p/transt), STARK 등) 느려진다는 속도-성능 딜레마도 있었다. 저자들은 이 분리 자체를 없애 [ViT](#/p/vit)에 두 이미지를 한 번에 넣는 것을 제안한다.',

ideas:[
 {h:'One-stream: 이미지 쌍을 이어 붙여 ViT에 투입',
  lead:'템플릿 토큰과 탐색 토큰을 concat해 self-attention하면 추출과 관계 모델링이 같은 연산이 된다.',
  d:'템플릿과 탐색 패치를 각각 P×P 패치로 나눠 선형 투영하고, 위치 임베딩을 더한 뒤 하나의 시퀀스로 이어 붙인다. 이 시퀀스를 ViT-Base 인코더에 통과시키면 모든 층에서 템플릿과 탐색 영역이 서로를 참조한다. 출력의 탐색 영역 토큰을 바로 분류·회귀 헤드에 넣으므로 별도 매칭 모듈이 없다. 템플릿과 탐색 영역을 구분하는 임베딩이나 상대 위치 임베딩은 이득이 없어 뺐다고 한다.'},
 {h:'attention 블록 분해: 추출과 관계가 한 식에 있다',
  lead:'self-attention 가중치를 4개 블록으로 나누면 intra-image와 inter-image 항이 함께 나온다.',
  d:'concat된 Q·K로 만든 attention을 $W_{zz}, W_{zx}, W_{xz}, W_{xx}$ 네 블록으로 쪼개면, $W_{xx}V_x$ 는 탐색 영역 안의 특징 추출이고 $W_{xz}V_z$ 는 템플릿 정보를 탐색 영역으로 가져오는 관계 모델링이다. 반대 방향 $W_{zx}V_x$ 도 있어 양방향 정보 흐름이 생기고, 템플릿 특징도 탐색 영역에 따라 달라진다. 저자들은 이것이 "상호 유도"로 타깃 지향 특징을 만든다고 설명한다.'},
 {h:'Early candidate elimination: 배경 토큰을 일찍 버린다',
  lead:'템플릿 중앙 토큰과의 attention 유사도가 낮은 탐색 토큰을 층 중간에서 제거한다.',
  d:'one-stream 구조에서는 초반 층의 attention만으로도 탐색 영역 각 위치가 타깃과 얼마나 닮았는지 알 수 있다(원문 Fig. 4). 템플릿 중앙 토큰의 탐색 영역에 대한 attention 가중치를 헤드 평균해 점수로 삼고, 상위 $k$개만 남긴다. 유지 비율 $\\rho=k/n$ 은 0.7이고 ViT의 4·7·10번째 층에 넣었다. 버린 토큰은 마지막에 원래 순서로 복원하고 0으로 패딩해 2D 맵으로 되돌린다.'},
 {h:'MAE 사전학습 ViT로 빠른 수렴',
  lead:'Transformer 층이 무작위 초기화였던 이전 트래커와 달리 전체 백본을 사전학습으로 시작한다.',
  d:'이전 Transformer 융합 트래커는 CNN 백본만 ImageNet으로 사전학습하고 융합 Transformer는 무작위로 시작했다. OSTrack은 MAE로 사전학습한 ViT-Base를 통째로 쓴다. 헤드는 Conv-BN-ReLU 4층짜리 FCN 세 개(중심 분류 맵, 오프셋, 박스 크기)로 CenterNet 식으로 박스를 낸다. 추론 때는 Hanning window 페널티로 직전 위치 prior를 반영한다.'}
],

diagram:{type:'flow', cap:'OSTrack의 프레임당 처리. 이미지 쌍을 이어 붙여 ViT에 넣고, 일부 층에서 배경 후보를 제거한 뒤 나머지를 복원해 헤드로 보낸다.',
 nodes:[
  {t:'이미지 쌍', s:'템플릿 + 탐색 영역'},
  {t:'패치 임베딩', s:'선형 투영 + 위치'},
  {t:'ViT 인코더', s:'self-attn on concat', acc:true, a:'4·7·10층'},
  {t:'후보 제거', s:'top-k, ρ=0.7'},
  {t:'FCN 헤드', s:'중심·오프셋·크기'}
 ]},

math:[
 {tex:'A=\\begin{bmatrix}W_{zz}V_z+W_{zx}V_x\\\\ W_{xz}V_z+W_{xx}V_x\\end{bmatrix}',
  expr:'A = [Wzz Vz + Wzx Vx ; Wxz Vz + Wxx Vx]',
  d:'concat된 self-attention의 출력. $W_{xx}V_x$ 가 탐색 영역 내부 추출, $W_{xz}V_z$ 가 템플릿→탐색 관계 모델링이다.'},
 {tex:'\\bar w_x^{\\phi}=\\frac{1}{M}\\sum_{m=1}^{M} w_x^{\\phi}(m),\\quad \\text{keep top-}k,\\;\\; \\rho=\\frac{k}{n}',
  expr:'w̄ = (1/M)·Σ_m w_x^φ(m);  상위 k개 유지, ρ = k/n',
  d:'$\\phi$ 는 템플릿 중앙 토큰, $M$ 은 헤드 수, $n$ 은 탐색 토큰 수. 점수가 낮은 후보를 배경으로 간주해 버린다.'},
 {tex:'L_{track}=L_{cls}+\\lambda_{iou}L_{iou}+\\lambda_{L1}L_1',
  expr:'L = L_cls + 2·L_iou + 5·L1',
  d:'$L_{cls}$ 는 가우시안 가중 focal loss이고 $\\lambda_{iou}=2$, $\\lambda_{L1}=5$ 이다.'}
],

numbers:[
 {k:'GOT-10k · OSTrack-384 AO', v:'73.7', d:'one-shot 프로토콜(GOT-10k train만 사용). 초록 요약은 SwinTrack 대비 +4.3%'},
 {k:'LaSOT · OSTrack-384 (AUC / PNorm)', v:'71.1 / 81.1', d:'Table 1. OSTrack-256은 69.1 / 78.7'},
 {k:'TrackingNet · OSTrack-384 (AUC)', v:'83.9', d:'Table 1. OSTrack-256은 83.1'},
 {k:'속도 · OSTrack-256 (RTX 2080Ti)', v:'105.4 FPS', d:'본문. SwinTrack-B는 52 FPS로 약 2배 느리다'},
 {k:'early elimination 효과 (256)', v:'MACs −25.9%, 속도 +13.2%', d:'Table 3. LaSOT AUC는 오히려 +0.4%. 384에서는 속도 +40.3%'},
 {k:'LaSOText · OSTrack-384 AUC', v:'50.5 (58.1 FPS)', d:'본문. 기존 최고 대비 +2.3%라고 서술'}
],

impact:'two-stream 두 단계 패러다임을 걷어내고도 성능이 오른다는 것을 보여, SOT 백본을 "ViT 한 개 + 얇은 헤드"로 단순화하는 흐름을 정착시켰다. 구조가 단순해 사전학습 ViT를 그대로 쓸 수 있고, 템플릿 토큰이 적어 연산 부담이 작다. 이후 많은 트래커가 OSTrack 코드베이스를 기준선으로 삼았다. 같은 시기의 [MixFormer](#/p/mixformer)가 CvT 기반이었다면 OSTrack은 vanilla ViT로 같은 결론에 도달한 것이다.',

legacy:[
 '**[ODTrack](#/p/odtrack)**: OSTrack의 one-stream 구조에 시간 축 토큰을 더해 온라인 밀집 시간 문맥을 학습한다',
 '**[LoRAT](#/p/lorat)**: OSTrack류 ViT 트래커에 LoRA를 붙여 더 큰 모델을 더 빠르게 학습하는 방향으로 이었다',
 '**[SUTrack](#/p/sutrack)**: OSTrack과 [MixFormer](#/p/mixformer)를 부모로 하는 단일 모델 통합 추적',
 '**표준 비교 기준선**: [SAMURAI](#/p/samurai)의 비교표에도 OSTrack384가 지도학습 트래커로 실려 있다'
],

pitfalls:[
 '**GOT-10k의 73.7은 GOT-10k train만으로 학습한 one-shot 값이다.** LaSOT 같은 다른 벤치마크 수치와 학습 데이터 조건이 다르므로 섞어 비교하면 안 된다.',
 '**early elimination은 정확도를 위한 장치가 아니라 속도 장치다.** 논문은 오히려 약간의 정확도 상승도 보이지만 이는 모델·해상도에 따라 다르고, 핵심 이득은 MACs와 FPS다.',
 '**기본 모델은 첫 프레임 템플릿 하나만 쓴다.** 온라인 템플릿 갱신은 VOT2020용으로 부록에서만 따로 다루며, 본문 벤치마크의 OSTrack에는 들어 있지 않다. 시간 문맥을 본격적으로 쓰는 것은 후속 연구([ODTrack](#/p/odtrack) 등)의 주제다.'
],

figures:[
 {f:'fig3-one-stream.png',
  cap:'(a) 템플릿·탐색 패치를 선형 투영해 이어 붙이고 인코더 N층에 넣은 뒤, 토큰 패딩을 거쳐 헤드로 간다. (b) 인코더 층에서 multi-head attention 뒤에 top-k 후보만 남기는 early elimination이 들어가는 위치.',
  src:'원문 Figure 3, p.5'}
],

quotes:[
 {t:'we propose a novel one-stream tracking (OSTrack) framework that unifies feature learning and relation modeling by bridging the template-search image pairs with bidirectional information flows.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2203.11991 — OSTrack', u:'https://arxiv.org/abs/2203.11991'},
 {t:'GitHub — botaoye/OSTrack', u:'https://github.com/botaoye/OSTrack'}
]
});
