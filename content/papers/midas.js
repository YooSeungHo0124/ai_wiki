WIKI.paper({
slug:'midas',
venue:'IEEE TPAMI 2022 (44권 3호, arXiv 2019)',
authors:'Ranftl, Lasinger, Hafner, Schindler, Koltun (Intel Labs · ETH Zürich)',
arxiv:'1907.01341',

tldr:'단안 깊이 추정을 학습해 본 적 없는 데이터셋에서도 잘 되게 만드는 **제로샷 교차 데이터셋 전이**를 목표로, 척도·기준점이 제각각인 5종의 이종 데이터셋을 하나의 불변 손실로 묶어 학습했다. 이 데이터 혼합 레시피가 이후 [Depth Anything](#/p/depth-anything)까지 이어지는 "대량의 이종 데이터로 일반화"의 출발점이 됐다.',

context:'단안 깊이 추정은 데이터가 다양할수록 좋아지지만, 정확한 밀집 깊이 정답을 대규모로 모으는 센서는 존재하지 않는다. 그래서 라이다·RGB-D·스테레오·SfM 등 서로 다른 방법으로 만든 여러 데이터셋이 각자의 편향을 안은 채 흩어져 있다. 문제는 이 데이터셋들을 그냥 합칠 수 없다는 것이다 — 라이다는 미터 단위 절대 깊이, SfM(MegaDepth 등)은 척도를 모르는 상대 깊이, 스테레오 기반은 알려지지 않은 베이스라인 때문에 척도와 기준점(shift)이 모두 어긋난 disparity를 내놓는다. 기존 연구는 대개 단일 데이터셋에 특화된 모델을 학습해서, 그 데이터셋의 test split에는 강하지만 다른 환경에서는 성능이 급격히 떨어졌다. 이 논문은 "여러 편향된 데이터셋을 어떻게 하나의 학습에 섞어 넣을 것인가"라는 도구 문제로 이 상황을 정면으로 다룬다.',

ideas:[
 {h:'척도·이동 불변 손실: median/MAD로 정렬',
  lead:'예측과 정답 각각을 median으로 이동, MAD로 스케일을 맞춘 뒤 차이를 잰다.',
  d:'disparity 공간에서 예측 $d$ 와 정답 $d^*$ 을 각각 $\\hat d=(d-t(d))/s(d)$ 로 정규화한다. 여기서 $t(d)$ 는 median, $s(d)$ 는 median으로부터의 평균절대편차(MAD)다. 두 값을 각자 자신의 통계로 정렬하기 때문에, 정답이 미터 단위 절대 깊이든 척도·기준점을 모르는 disparity든 **같은 손실식**으로 비교할 수 있게 된다.'},
 {h:'trimmed MAE: 정답의 이상치는 아예 버린다',
  lead:'정렬된 잔차 중 가장 큰 20%를 손실 계산에서 제외한다.',
  d:'단순 MSE는 이상치에 취약하고, 기존 M-estimator처럼 큰 잔차의 가중치를 낮추는 방식도 시험해봤지만 최선이 아니었다. 대신 정렬된 잔차 $|\\hat d_j-\\hat d_j^*|$ 를 오름차순으로 정렬해 **상위 20%를 손실 계산에서 완전히 제외**한다. 정답 자체가 부정확한 대규모 데이터셋(스테레오 매칭 오류 등)에서, 그 오차가 학습에 영향을 주지 않게 막는 것이 목적이다.'},
 {h:'다중스케일 gradient matching 정규화',
  lead:'4단계 해상도에서 예측·정답의 기울기 차이를 더해 경계를 날카롭게 만든다.',
  d:'주손실 $L_{ssi}$ 에 더해, 이미지를 4단계로 절반씩 줄여가며 각 스케일에서 예측과 정답의 x·y 방향 gradient 차이를 누적하는 $L_{reg}$ 를 $\\alpha=0.5$ 가중치로 더한다. 이 항이 깊이 불연속(물체 경계)이 정답의 경계와 일치하도록 유도한다.'},
 {h:'다목적(Pareto) 데이터셋 믹싱',
  lead:'배치를 데이터셋 수만큼 등분해 섞는 naive mixing보다 Pareto 최적화가 낫다.',
  d:'가장 단순한 방법은 배치 크기 $B$ 를 데이터셋 수 $L$ 로 나눠 $B/L$ 씩 똑같이 섞는 것이다. 하지만 이 naive mixing은 데이터셋을 추가해도 성능이 항상 좋아진다는 보장이 없다. 논문은 각 데이터셋의 손실을 별도 task로 보고, 어느 task의 손실도 늘리지 않고는 다른 task를 더 줄일 수 없는 지점을 찾는 **다중목표 최적화**([Sener & Koltun, NeurIPS 2018] 절차를 적용)로 데이터셋을 섞는다. 이 방식이 naive mixing을 일관되게 앞섰다.'},
 {h:'3D 영화: 스테레오 매칭으로 만든 대규모 가상 정답',
  lead:'블루레이 3D 영화 23편의 스테레오 프레임을 광학 흐름으로 disparity화한다.',
  d:'기존 데이터셋을 보완할 새로운 소스로 3D 영화(MV)를 제안한다. 스테레오 카메라로 촬영된 3D 영화에서 좌우 프레임을 뽑아, 표준 스테레오 매처 대신 **광학 흐름 알고리즘**으로 disparity를 추출한다(영화의 disparity는 화면 앞뒤 모두에 걸쳐 있어 양의 범위만 가정하는 스테레오 매처가 잘 작동하지 않기 때문). 좌우 일관성 검사·하늘 영역 마스킹 등 자동 정제 파이프라인을 거쳐 학습용 75,074프레임을 얻는다. 사람이 라벨링하지 않은 대규모 pseudo ground truth라는 점에서, 훗날 [Depth Anything](#/p/depth-anything)의 대량 비라벨 데이터 활용과 같은 방향이다.'}
],

diagram:{type:'flow', cap:'라이다·SfM·스테레오처럼 척도·기준점이 다른 데이터셋을 median/MAD로 각자 정렬한 뒤, 불변 손실과 Pareto 믹싱으로 한 모델을 학습해 미학습 데이터셋에서 평가한다.',
 nodes:[
  {t:'이종 데이터셋', s:'라이다·SfM·스테레오·영화'},
  {t:'median/MAD 정렬', s:'척도·기준점 제거', a:'정렬'},
  {t:'불변 손실 학습', s:'trimmed MAE + reg', acc:true},
  {t:'제로샷 전이 평가', s:'미학습 6개 데이터셋'}
 ]},

math:[
 {expr:'Lssi(d̂, d̂*) = (1/2M) Σ ρ(d̂ᵢ - d̂*ᵢ)',
  tex:'L_{ssi}(\\hat d,\\hat d^{*})=\\frac{1}{2M}\\sum_{i=1}^{M}\\rho\\!\\left(\\hat d_i-\\hat d_i^{*}\\right)',
  d:'척도·이동 불변 손실의 기본형. $\\rho$ 자리에 어떤 픽셀별 거리 함수를 넣느냐로 MSE 버전과 MAE(trimmed) 버전이 갈린다.'},
 {expr:'t(d) = median(d),  s(d) = (1/M) Σ |d - t(d)|,  d̂ = (d - t(d)) / s(d)',
  tex:'t(d)=\\text{median}(d),\\quad s(d)=\\frac{1}{M}\\sum_{i=1}^{M}|d_i-t(d)|,\\quad \\hat d=\\frac{d-t(d)}{s(d)}',
  d:'예측과 정답을 각각 자신의 median·MAD로 정렬해 이동량 0·스케일 1로 맞춘다. 이 정렬을 예측·정답 양쪽에 독립적으로 적용하기 때문에 서로 다른 척도·기준점을 가진 데이터셋을 같은 손실로 비교할 수 있다.'},
 {expr:'Lssitrim(d̂, d̂*) = (1/2M) Σ_{j=1}^{0.8M} |d̂ⱼ - d̂*ⱼ|   (잔차 오름차순 정렬 후 상위 20% 제외)',
  tex:'L_{ssitrim}(\\hat d,\\hat d^{*})=\\frac{1}{2M}\\sum_{j=1}^{0.8M}\\left|\\hat d_j-\\hat d_j^{*}\\right|,\\quad |\\hat d_j-\\hat d_j^{*}|\\le|\\hat d_{j+1}-\\hat d_{j+1}^{*}|',
  d:'실험적으로 검증 성능이 가장 좋았던 최종 손실. 잔차를 오름차순으로 정렬한 뒤 가장 큰 20%를 아예 버려서, 정답 자체의 결함(스테레오 매칭 오류 등)이 학습을 오염시키지 않게 한다.'}
],

numbers:[
 {k:'학습/제로샷 테스트', v:'5종 / 6종', d:'DIML·MegaDepth·ReDWeb·WSVD·3D Movies로 학습, DIW·ETH3D·Sintel·KITTI·NYU·TUM은 학습에 전혀 사용 안 함'},
 {k:'3D Movies 규모', v:'영화 23편 · 75,074프레임', d:'1920×1080 스테레오, 24fps 추출 후 학습셋은 4fps로 서브샘플'},
 {k:'인코더 교체 효과', v:'최대 +15%', d:'ResNet-50 baseline 대비 ResNeXt-101-WSL(약한 지도 사전학습) 인코더의 상대 성능 향상'},
 {k:'랜덤 초기화 손실', v:'평균 -35%', d:'ImageNet 사전학습 없이 랜덤 초기화한 ResNet-50 인코더는 사전학습 버전보다 평균 35% 나쁨'},
 {k:'최종 믹스(MIX5) 개선', v:'+22.4%', d:'5개 데이터셋 전부를 Pareto 최적 믹싱으로 학습했을 때, RW 단독 학습 대비 6개 제로샷 테스트셋 평균 상대 개선(naive 믹싱은 +19.5%)'},
 {k:'학습 연산량', v:'약 6 GPU-월', d:'논문 전체 실험(손실·인코더·믹싱 ablation 포함)에 든 총 계산량'}
],

impact:'이 논문 이후 "특정 데이터셋에서 잘 되는가"가 아니라 "**학습에 쓰지 않은 데이터셋에서 잘 되는가**(zero-shot cross-dataset transfer)"가 단안 깊이 추정의 표준 평가 프로토콜로 자리잡았다. 공개된 MiDaS 모델과 척도·이동 불변 손실은 이후 깊이 추정 연구 대부분의 기본 구성요소가 됐고, 인코더를 Vision Transformer로 바꾼 같은 저자들의 후속작 DPT로 이어졌다. 절대 척도가 필요한 로보틱스·AR 응용에서는 여전히 별도 스케일 보정이 필요하지만, "상대 깊이는 어디서나 안정적으로 뽑아낼 수 있다"는 기준선을 처음으로 제시했다.',

legacy:[
 '**DPT** — 같은 저자들이 인코더를 ResNet에서 Vision Transformer로 바꿔 같은 혼합 학습 레시피를 그대로 이어감',
 '**[Depth Anything](#/p/depth-anything)** — "여러 이종·비라벨 데이터를 대규모로 섞어 제로샷 일반화를 얻는다"는 이 논문의 핵심 아이디어를 62M장 규모로 확장한 계보의 직계 후속',
 '**메트릭 깊이 모델(ZoeDepth 등)** — MiDaS의 상대 깊이 백본 위에 별도의 척도 예측 헤드를 얹어 절대 깊이를 복원하는 2단계 구조가 이후 표준 패턴이 됨',
 '**공개 모델·zero-shot 벤치마크 관행 정착** — GitHub에 공개된 MiDaS 체크포인트가 이후 다수 논문의 상대 깊이 추정 baseline으로 통용됨'
],

pitfalls:[
 '**MiDaS는 절대(metric) 깊이를 예측하지 않는다.** 학습·평가 모두 disparity를 median/MAD(또는 최소자승)로 정렬한 뒤 비교하므로, 출력은 항상 "척도와 기준점을 모르는 상대 깊이"다. 실제 거리(미터)가 필요한 응용에는 별도의 스케일 보정이 필요하다.',
 '**"낮은 위치 = 가까움"이라는 통계적 편향을 그대로 학습한다.** 논문 스스로 실패 사례로 보고한다 — 이미지가 90도 회전되어 있으면 바닥면을 잘못 추정하는 등, 사람이 갖는 것과 같은 종류의 사전 편향이 모델에도 나타난다.',
 '**거울·그림처럼 평면에 비친 장면은 장면 자체가 아니라 표면에 그려진 내용으로 깊이를 추정한다.** 반사·투영면 인식은 이 파이프라인이 다루지 않는 별도 문제로 남는다.'
],

figures:[
 {f:'fig1-teaser.png',
  cap:'위: 학습에 쓰이지 않은 COCO 이미지 입력. 아래: MiDaS가 예측한 inverse depth map. 데이터셋마다 학습에 없던 코끼리·사람·수하물·도로 장면 전부에서 경계가 뚜렷한 깊이가 나온다 — 이것이 "제로샷 교차 데이터셋 전이"가 실제로 보여주는 것이다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig5-mixing.png',
  cap:'같은 입력 이미지에 대해 MIX 1(데이터셋 2개)부터 MIX 5(5개 전부)까지 순서대로 예측한 결과. 오른쪽으로 갈수록(더 많은 이종 데이터셋을 섞을수록) 사람·동물의 윤곽과 배경 분리가 눈에 띄게 선명해진다.',
  src:'원문 Figure 5, p.9'}
],

quotes:[
 {t:'We propose a robust training objective that is invariant to changes in depth range and scale, advocate the use of principled multi-objective learning to combine data from different sources, and highlight the importance of pretraining encoders on auxiliary tasks.',
  src:'Abstract, p.1'},
 {t:"Our extensive experiments, which cover approximately six GPU months of computation, show that a model trained on a rich and diverse set of images from different sources, with an appropriate training procedure, delivers state-of-the-art results across a variety of environments.",
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 1907.01341 — Towards Robust Monocular Depth Estimation', u:'https://arxiv.org/abs/1907.01341'},
 {t:'GitHub — isl-org/MiDaS', u:'https://github.com/isl-org/MiDaS'},
 {t:'IEEE TPAMI 판본 (DOI)', u:'https://ieeexplore.ieee.org/document/9178977'}
]
});
