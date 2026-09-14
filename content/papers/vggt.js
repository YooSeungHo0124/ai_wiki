WIKI.paper({
slug:'vggt',
venue:'CVPR 2025 (Oxford VGG · Meta AI)',
authors:'Wang, Chen, Karaev, Rupprecht, Vedaldi, Novotny (Visual Geometry Group, Oxford · Meta AI)',
arxiv:'2503.11651',

tldr:'카메라 파라미터·깊이맵·포인트맵·점 트랙까지 3D 복원에 필요한 값 전부를, Bundle Adjustment 같은 **반복 최적화 없이 단 한 번의 순전파**로 1초 이내에 낸다. 최적화 기반 SfM/MVS 파이프라인을 최소한의 3D 귀납 편향만 가진 대형 transformer로 대체한다.',

context:'3D 복원의 표준은 [COLMAP](https://colmap.github.io/) 같은 Structure-from-Motion(SfM) 파이프라인이다 — 특징점 매칭, 삼각측량, 그리고 재투영 오차를 반복적으로 줄이는 Bundle Adjustment(BA)라는 **최적화 루프**로 카메라와 3D 점을 동시에 구한다. 최근 [DUSt3R](https://arxiv.org/abs/2312.14132)와 MASt3R는 신경망으로 이 과정 상당 부분을 대체했지만, 이미지 두 장씩만 처리하고 여러 장을 합치려면 여전히 후처리 정합(global alignment)이 필요했다. 질문은 단순하다 — 특징 매칭도 BA도 없이, 여러 장의 이미지에서 3D 속성 전부를 신경망 하나의 순전파로 바로 뽑아낼 수 있는가?',

ideas:[
 {h:'카메라·깊이·포인트맵·트랙을 한 번에, 한 순전파로',
  lead:'N장의 이미지를 넣으면 프레임마다 카메라 파라미터·깊이맵·포인트맵·추적 특징을 동시에 출력한다.',
  d:'입력 이미지열 $(I_i)_{i=1}^N$을 카메라 파라미터 $g_i$(회전 쿼터니언·이동·시야각), 깊이맵 $D_i$, 뷰포인트에 무관한 포인트맵 $P_i$(첫 카메라 좌표계 기준 3D 좌표), 추적용 특징 $T_i$로 매핑하는 단일 함수로 문제를 정의한다. 첫 번째 이미지를 기준 좌표계로 삼는 것 외에는 입력 순서에 무관하도록(permutation equivariant) 설계했다.'},
 {h:'DINO 토큰 + 교차 self-attention',
  lead:'각 이미지를 [DINO](#/p/dino) 패치로 토큰화한 뒤, 프레임별 attention과 전체 프레임 attention을 번갈아 쌓는다.',
  d:'입력 이미지들을 DINO로 패치화하고 카메라 예측용 토큰을 추가한 뒤, "이 프레임 안에서만" 보는 frame-wise self-attention과 "모든 프레임을 함께" 보는 global self-attention을 24개 층에 걸쳐 번갈아 적용한다(alternating attention, AA). frame-wise attention이 각 이미지 내부 정규화를, global attention이 이미지 간 정보 통합을 맡아 균형을 이룬다.'},
 {h:'과잉 예측이 오히려 정확도를 높인다',
  lead:'깊이·카메라만 알면 포인트맵을 계산으로 유도할 수 있는데도, 굳이 포인트맵을 직접 예측하도록 훈련시킨다.',
  d:'포인트맵은 사실 깊이맵과 카메라 파라미터로부터 닫힌 형태로 유도될 수 있어(DUSt3R에서 보인 것처럼), 세 가지를 모두 예측하는 것은 원칙적으로 중복이다. 그런데도 학습 시점에 이 중복된 값들을 전부 명시적으로 예측하도록 지도하면 성능이 크게 오른다. 반대로 추론 시점에는 독립적으로 예측한 깊이와 카메라로 포인트맵을 유도하는 쪽이, 포인트맵 헤드를 직접 쓰는 것보다 더 정확했다.'},
 {h:'카메라 헤드는 가볍고, 나머지는 DPT 헤드 하나로',
  lead:'카메라 파라미터는 작은 헤드로, 깊이·포인트맵·트랙 특징은 공통 DPT 디코더로 뽑는다.',
  d:'카메라 헤드는 반복 정제(iterative refinement)로 파라미터를 예측하는 가벼운 모듈이라 0.03초·0.2GB 정도만 쓴다. 나머지 dense 출력(깊이맵·포인트맵·트래킹 특징)은 [DPT](https://arxiv.org/abs/2103.13413) 기반 디코더가 backbone의 dense 토큰으로부터 만들며, 별도의 tracking 모듈이 이 특징과 질의점을 받아 실제 트랙을 계산한다.'},
 {h:'후처리 BA를 곁들이면 더 정확해지지만, 없어도 이미 최고 수준',
  lead:'VGGT의 순수 feed-forward 출력만으로도 최적화 기반 방법들을 이기고, BA를 추가하면 한 번 더 오른다.',
  d:'RealEstate10K·CO3Dv2 카메라 자세 추정에서 VGGT feed-forward 단독이 이미 VGGSfM·MASt3R 등 반복 최적화를 쓰는 방법들보다 높은 AUC를 훨씬 짧은 시간에 낸다. 여기에 Bundle Adjustment를 추가로 얹으면(그래도 약 2초 이내) 정확도가 한 번 더 오른다 — 즉 최적화가 완전히 불필요해진 것이 아니라, 최적화 없이도 그것을 능가하는 출발점을 신경망이 준다는 것이 핵심 주장이다.'}
],

diagram:{type:'flow', cap:'VGGT 아키텍처. DINO로 토큰화한 여러 이미지가 프레임별·전역 attention을 번갈아 통과한 뒤 두 종류의 헤드로 갈라진다.',
 nodes:[
  {t:'다중 이미지 입력', s:'1장~수백 장'},
  {t:'DINO 패치화', s:'+ 카메라 토큰 추가'},
  {t:'교차 attention', s:'전역·프레임별 × 24층', acc:true},
  {t:'카메라 헤드', s:'경량, 반복 정제', a:'카메라'},
  {t:'DPT 헤드', s:'깊이·포인트맵·트랙 특징', a:'dense 출력'}
 ]},

math:[
 {expr:'f((I_i)_{i=1}^N) = (g_i, D_i, P_i, T_i)_{i=1}^N',
  tex:'f\\big((I_i)_{i=1}^N\\big) = (g_i, D_i, P_i, T_i)_{i=1}^N',
  d:'VGGT가 정의하는 함수. N장의 이미지 각각에 카메라 파라미터 $g_i \\in \\mathbb{R}^9$, 깊이맵 $D_i$, 뷰포인트 불변 포인트맵 $P_i$, 추적 특징 $T_i$를 동시에 할당한다.'}
],

numbers:[
 {k:'카메라 자세 AUC@30 (CO3Dv2)', v:'88.2 (feed-forward) / 91.8 (+BA)', d:'0.2초 / 1.8초. VGGSfM(83.4, ~10초), MASt3R(81.8, ~9초) 상회'},
 {k:'카메라 자세 AUC@30 (RealEstate10K)', v:'85.3 (feed-forward)', d:'0.2초. VGGSfM(78.9, ~10초), COLMAP+SPSG(45.2, ~15초) 상회'},
 {k:'ScanNet 두 장 매칭 AUC@20', v:'73.4', d:'전용 2뷰 매칭 모델 Roma(70.9)보다 높음. VGGT의 tracking head는 2뷰 특화가 아닌데도 상회'},
 {k:'전방향 처리 시간', v:'약 0.2초 (H100, 카메라 자세)', d:'COLMAP·PixSfM류 최적화 파이프라인의 10~20초 대비'},
 {k:'레이어 수', v:'L=24 (전역+프레임별 attention)', d:'64 A100에서 학습'}
],

impact:'"3D 복원에는 기하학적 귀납 편향이 필요하다"는 통념에 맞서, 번갈아 배치한 attention 외에는 특별한 3D 구조 없이 표준 transformer만으로 카메라·깊이·포인트맵을 동시에, 최적화 기반 방법보다 수십 배 빠르게 낸다는 것을 보였다. 특히 과잉·중복된 출력을 굳이 함께 학습시키는 것이 표현 학습에 도움이 된다는 관찰은, "출력을 하나로 통일하라"는 기존 설계 원칙과 반대 방향이라 후속 멀티태스크 3D 모델 설계에 참고점이 됐다. 다만 BA를 곁들이면 여전히 한 번 더 정확해진다는 점에서, 최적화가 완전히 대체됐다기보다 "최적화 없이도 이미 그것을 이기는 출발점"이라는 것이 더 정확한 요약이다.',

legacy:[
 '**[DINOv2](#/p/dinov2) 토크나이저의 3D 재사용** — 자기지도로 학습된 patch 특징이 기하 복원의 입력 표현으로도 통한다는 사례 추가',
 '**DUSt3R/MASt3R 계열과의 분기점** — 2뷰 쌍 처리 후 후처리 정합이 필요했던 접근에서, 임의 개수 이미지를 한 번에 처리하는 방향으로 3D foundation model 설계가 이동',
 '**과잉 예측(over-complete prediction)이라는 설계 원칙의 재조명** — 출력이 서로 유도 가능해도 명시적으로 다중 헤드를 두는 것이 표현 학습에 유리하다는 관찰이 이후 멀티태스크 dense 예측 모델에 인용됨'
],

pitfalls:[
 '**"최적화가 필요 없어졌다"는 과장이다.** BA를 추가하면 여전히 정확도가 오른다(CO3Dv2 88.2→91.8). VGGT의 주장은 "최적화 없이도 최적화 기반 SOTA를 이긴다"는 것이지 "최적화가 무용해졌다"가 아니다.',
 '**포인트맵을 직접 예측하는 헤드보다, 깊이+카메라를 결합해 유도하는 쪽이 더 정확하다.** 세 출력을 함께 학습시키는 것은 이득이지만, 추론 시 어느 조합을 쓰는지가 정확도에 영향을 준다는 점을 놓치기 쉽다.',
 '**32장을 넘는 극단적 다뷰 비교는 논문의 정성적 예시(Fig. 3)에 한정된다.** DUSt3R가 메모리 부족으로 실패하는 지점 이상에서 VGGT의 정량적 한계가 어디인지는 별도로 확인이 필요하다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'입력 이미지들을 DINO로 패치화(초록/하늘색 토큰)하고 카메라 토큰(주황)을 붙인 뒤, Global Attention과 Frame Attention을 L번 번갈아 통과시킨다. 이후 카메라 토큰은 작은 Camera Head로, 나머지 dense 토큰은 DPT 헤드로 들어가 깊이맵·포인트맵·트랙을 만든다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'It does so in a single forward pass, in seconds. This is a substantial departure from DUSt3R, MASt3R, or VGGSfM, which still require costly iterative post-optimization to obtain usable results.',
  src:'Section 1, p.2'}
],

links:[
 {t:'arXiv 2503.11651 — VGGT: Visual Geometry Grounded Transformer', u:'https://arxiv.org/abs/2503.11651'},
 {t:'facebookresearch/vggt (공식 구현)', u:'https://github.com/facebookresearch/vggt'}
]
});
