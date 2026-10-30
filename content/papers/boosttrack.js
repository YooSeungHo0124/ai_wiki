WIKI.paper({
slug:'boosttrack',
venue:'Machine Vision and Applications 2024',
authors:'Stanojević, Todorović (University of Niš)',

tldr:'[ByteTrack](#/p/bytetrack)처럼 저신뢰 검출을 2단계로 나눠 매칭하지 않고, **연관 전에 검출 신뢰도를 끌어올린 뒤 한 번에** 매칭하는 SORT 기반 트래커. 신뢰도 보정 두 가지(DLO, DUO)와 유사도 보정 세 가지(검출-트랙릿 신뢰도, 마할라노비스, 형태)를 IoU 위에 얹는다. 외형을 쓰는 BoostTrack+는 MOT20 test에서 HOTA 66.2를 냈다.',

context:'검출 신뢰도 임계값으로 상자를 거르면 부분적으로 가려진 실제 물체도 같이 버려진다. [ByteTrack](#/p/bytetrack)은 저신뢰 검출을 2단계 연관에 쓰는 방식으로 이 문제를 풀었고 이후 표준이 되었다. 그러나 저자들은 다단계 연관이 ID switch를 늘릴 수 있다고 지적한다. 겹친 두 물체 중 하나만 신뢰도가 높으면 1단계에서 잘못된 쪽에 붙고, 남은 쪽이 2단계에서 억지로 연결되기 때문이다. 외형 모듈은 FPS를 크게 낮추므로, 가벼운 부품으로 유사도의 변별력과 검출 선택을 개선하는 것이 목표다.',

ideas:[
 {h:'DLO: 트랙릿과 많이 겹치는 저신뢰 검출의 신뢰도를 올린다',
  lead:'칼만 예측 상자와 IoU가 높은 검출은 신뢰도가 낮아도 임계값을 넘도록 끌어올린다.',
  d:'가려진 물체는 신뢰도가 낮아도 예측 위치와는 잘 겹친다. 각 검출에 대해 모든 트랙릿과의 최대 IoU를 구해 $\\hat c=\\max(c,\\beta_c\\cdot\\max_j \\mathrm{IoU})$ 로 보정한다. $\\beta_c$ 와 임계값 $\\tau_D$ 가 "얼마나 겹쳐야 저신뢰 검출을 살리는가"를 암묵적으로 정한다. 논문 설정에서는 MOT17에서 요구 IoU가 0.923, MOT20에서 0.8이다.'},
 {h:'DUO: 어떤 트랙릿에서도 먼 검출을 새 물체로 본다',
  lead:'모든 트랙릿과 마할라노비스 거리가 먼 이상치 검출은 아직 못 본 물체일 수 있어 신뢰도를 올린다.',
  d:'가장자리에 걸쳐 일부만 보이는 물체처럼 처음부터 탐지되지 못한 대상을 찾는 장치다. 가장 가까운 트랙릿과의 마할라노비스 거리가 임계값 $\\tau_{MhD}=13.2767$(자유도 4, 99% 구간)을 넘으면 이상치로 본다. 이 검출들에 NMS(임계값 0.3)를 걸어 겹침을 줄이고 남은 것의 신뢰도를 $\\tau_D$ 로 올린다. 오탐이 섞일 수 있다는 것은 저자들도 인정한다.'},
 {h:'검출-트랙릿 신뢰도로 유사도를 보정',
  lead:'최근 갱신된 트랙릿과 고신뢰 검출의 쌍에 더 큰 가중치를 주어 1단계 매칭 안에서 우선순위를 만든다.',
  d:'트랙릿 신뢰도는 새 트랙은 $\\beta^{s_{init}-age}$, 그 외에는 마지막 갱신 이후 시간에 따라 $\\beta^{last\\_update-1}$ 로 감쇠한다. 검출 신뢰도와 곱한 값 $c_{d_i,t_j}=c_{d_i}\\cdot c_{t_j}$ 로 IoU를 스케일해 더한다. 2단계 매칭이 하던 "믿을 만한 쌍 먼저"를 한 단계 안에서 부드럽게 구현한 셈이다. 논문 설정은 $\\beta=0.9$, $s_{init}=7$ 이다.'},
 {h:'마할라노비스를 softmax 확률로, 그리고 형태 유사도',
  lead:'거리를 열 단위로 softmax해 확률처럼 쓰고, 폭·높이 차이로 IoU의 모호함을 줄인다.',
  d:'마할라노비스 거리는 자유도와 신뢰구간에 따라 값의 범위가 달라 가중치를 매번 다시 맞춰야 한다. 거리를 상한으로 자르고 상한에서 뺀 뒤 트랙릿마다 softmax하며, 상한을 넘는 쌍은 0으로 둔다. 형태 유사도는 폭·높이의 상대 차이 $ds$ 로 $c_{d,t}\\cdot e^{-ds}$ 를 쓴다. 겹쳐서 지나가는 보행자는 IoU가 비슷해도 폭과 높이는 짧은 시간 안에는 거의 변하지 않기 때문이다.'}
],

diagram:{type:'flow', cap:'BoostTrack의 프레임 처리. 저신뢰 검출을 걸러내기 전에 신뢰도를 올리고, 걸러진 검출로 기본 유사도와 유사도 보정을 합쳐 한 번만 연관한다.',
 nodes:[
  {t:'신뢰도 보정', s:'DLO + DUO', acc:true},
  {t:'저신뢰 필터', s:'τD 미만 제거'},
  {t:'유사도 계산', s:'IoU + 보정 3종', acc:true},
  {t:'1단계 연관', s:'헝가리안'},
  {t:'트랙 갱신', s:'CMC·보간 포함'}
 ]},

math:[
 {expr:'S_boost = S_base + λ_IoU·C ⊙ IoU + λ_MhD·S_MhD + λ_shape·S_shape',
  tex:'S_{boost}=S_{base}+\\lambda_{IoU}\\,C\\odot \\mathrm{IoU}(D,T)+\\lambda_{MhD}\\,S_{MhD}+\\lambda_{shape}\\,S_{shape}',
  d:'최종 유사도. $S_{base}$ 는 IoU이고 $C$ 는 검출-트랙릿 신뢰도 행렬이다. 그리드 서치로 $\\lambda_{IoU}=0.5$, $\\lambda_{MhD}=0.25$, $\\lambda_{shape}=0.25$ 를 골랐다. 외형을 쓰는 BoostTrack+는 코사인 유사도에 $\\lambda_{app}=3$ 을 더한다.'},
 {expr:'ĉ = max( c, βc · max_j IoU(D, T_j) )',
  tex:'\\hat c_{d_i}=\\max\\Big(c_{d_i},\\ \\beta_c\\cdot\\max_j \\mathrm{IoU}(D_i,T_j)\\Big)',
  d:'DLO 신뢰도 보정. $\\beta_c=0.65$(MOT17), $0.5$(MOT20), $\\tau_D=0.6$, $0.4$ 이므로 보정값이 임계값을 넘으려면 IoU가 각각 $0.6/0.65\\approx0.923$, $0.4/0.5=0.8$ 이상이어야 한다.'}
],

numbers:[
 {k:'MOT17 test · BoostTrack HOTA/MOTA/IDF1', v:'65.4 / 80.5 / 80.2', d:'Table 4. 외형 없음. IDSW 1,104. 속도 65.45 FPS(RTX 3090). 같은 표 BoT-SORT는 65.0/80.5/80.2'},
 {k:'MOT17 test · BoostTrack+ HOTA/MOTA/IDF1', v:'66.4 / 80.6 / 81.8', d:'Table 4. 외형 유사도를 더한 버전. 15.35 FPS. 온라인 방법 중 HOTA 1위라고 논문은 적는다'},
 {k:'MOT20 test · BoostTrack+ HOTA/MOTA/IDF1', v:'66.2 / 77.2 / 81.5', d:'Table 5. 같은 표 Deep OC-SORT 63.9/75.6/79.2, BoT-SORT 63.3/77.8/77.5. 3.05 FPS'},
 {k:'MOT20 test · BoostTrack (외형 없음)', v:'63 / 76.4 / 76.5', d:'Table 5. 32.79 FPS. ByteTrack 61.3/77.8/75.2보다 HOTA와 IDF1이 높다'},
 {k:'유사도 보정 3종 효과 (MOT17 val)', v:'IDF1 77.298 → 78.644', d:'Table 1. HOTA 66.132 → 66.831, IDSW 227 → 175. 마할라노비스만 단독으로 더하면 IDF1은 77.289로 그대로이고 IDSW가 250으로 늘어 오히려 나쁘다'},
 {k:'신뢰도 보정 효과 (MOT20 val HOTA)', v:'DLO만 56.717 → 58.628', d:'Table 2. 보정 없는 기준 대비. MOT17 val에서는 보정 5종을 모두 더해 HOTA 67.678, IDF1 79.854'}
],

impact:'BoostTrack은 "저신뢰 검출을 쓰려면 2단계 매칭이 필요하다"는 가정을 바꿔, 검출을 걸러내기 전에 신뢰도를 보정하는 길을 제시했다. 각 부품이 IoU 기반 어떤 트래커에도 붙는 플러그인이라 ablation에서 개별 효과를 확인할 수 있고, 외형 없이도 BoT-SORT에 근접한 성능을 65 FPS로 낸다. 외형 유사도를 더한 BoostTrack+는 MOT17과 MOT20에서 온라인 방법 중 HOTA 1위를 주장한다.',

legacy:[
 '**[ByteTrack](#/p/bytetrack)의 2단계 연관을 1단계 + 사전 신뢰도 보정으로 대체** — 다단계가 ID switch를 늘린다는 문제의식에서 출발',
 '**[BoT-SORT](#/p/botsort)와 같은 ECC 카메라 보정·ReID 결합 틀 위에 가벼운 보정 부품을 추가** — Deep OC-SORT의 Dynamic Appearance 갱신도 가져옴',
 '**후속 BoostTrack++가 같은 저자들에 의해 DLO를 soft 신뢰도 보정과 가변 유사도 임계값으로 확장**',
 '**검출 신뢰도를 연관 비용에 직접 반영하는 흐름의 한 사례** — Hybrid-SORT의 신뢰도·높이 단서와 같은 계열의 아이디어'
],

pitfalls:[
 '**마할라노비스 보정은 혼자서는 해롭다.** MOT17 val에서 단독으로 더하면 HOTA 66.132 → 65.953으로 내려가고, 신뢰도 보정이나 형태 유사도와 함께일 때만 이득이 난다.',
 '**BoostTrack 수치에는 CMC와 보간이 포함된다.** test 결과는 ECC 카메라 보정과 gradient boosting 보간을 쓴 것이고, val ablation(Table 3)에서 보간만으로 HOTA가 3점 가까이 오른다. 순수한 연관 알고리즘의 효과와 섞어 읽으면 안 된다.',
 '**신뢰도 보정은 오탐도 살릴 수 있고 하이퍼파라미터가 데이터셋별로 다르다.** $\\beta_c$ 가 MOT17은 0.65, MOT20은 0.5이고, 보정으로 사용된 ID 수도 늘어난다(MOT20 val에서 DLO를 쓰면 1,894 → 2,039). 저자들은 이 때문에 ID 수와 IDSW를 함께 확인한다.'
],

figures:[
 {f:'fig2-overview.png',
  cap:'파란 점선 상자 집합 D가 검출, 빨간 T가 칼만 예측으로 만든 트랙릿이다. 위쪽 회색 두 상자에서 검출 신뢰도를 올린 뒤 낮은 것을 거르고, 걸러진 검출(초록 D)과 트랙릿으로 기본 유사도와 유사도 보정을 계산해 하나의 최종 유사도로 합쳐 한 번만 연관한다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'We design a detection-tracklet confidence score and use it to scale the similarity measure and implicitly favour high detection confidence and high tracklet confidence pairs in one-stage association.',
  src:'Abstract, p.1'}
],

links:[
 {t:'Springer — BoostTrack (MVA 35:53)', u:'https://doi.org/10.1007/s00138-024-01531-5'},
 {t:'GitHub — vukasin-stanojevic/BoostTrack', u:'https://github.com/vukasin-stanojevic/BoostTrack'},
 {t:'arXiv 2408.13003 — BoostTrack++ (후속)', u:'https://arxiv.org/abs/2408.13003'}
]
});
