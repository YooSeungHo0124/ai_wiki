WIKI.paper({
slug:'pointnet2',
venue:'NeurIPS 2017',
authors:'Qi, Yi, Su, Guibas (Stanford University)',
arxiv:'1706.02413',

tldr:'[PointNet](#/p/pointnet)이 점 전체를 한 번에 max pooling으로 뭉개 **국소 구조를 못 본다**는 한계를, 샘플링→그룹핑→미니 PointNet을 반복하는 **계층적 집합 추상화**로 해결한 논문. CNN이 작은 커널부터 receptive field를 키워가듯, 점군에도 같은 원리를 이식했다.',

context:'[PointNet](#/p/pointnet)은 점마다 MLP를 태운 뒤 max pooling 하나로 전역 특징을 만든다. 이 구조는 순열 불변성은 완벽하게 지키지만, 그 대가로 **점과 점 사이의 국소 관계를 전혀 모델링하지 않는다** — 이웃한 두 점이 서로 가깝다는 사실 자체가 네트워크에 들어갈 통로가 없다. CNN이 작은 커널로 지역 패턴을 잡고 층을 쌓아 receptive field를 키우는 것과 대비된다. 게다가 실제 라이다·스캐너 데이터는 시점에 따라 점 밀도가 크게 달라진다 — 가까운 표면은 점이 빽빽하고 먼 표면은 성기다. 이 논문은 두 문제를 동시에 겨눈다: **국소 구조를 어떻게 보게 할 것인가**, 그리고 **밀도가 균일하지 않은 실제 데이터를 어떻게 다룰 것인가**.',

ideas:[
 {h:'set abstraction: 샘플링→그룹핑→미니 PointNet',
  lead:'중심점을 뽑고, 그 주변을 묶고, 묶음마다 작은 PointNet을 돌려 새로운 점 집합을 만든다.',
  d:'하나의 set abstraction 레벨은 세 층으로 이뤄진다. **Sampling**: farthest point sampling(FPS)으로 중심점 `m`개를 고른다 — 무작위 샘플링보다 점 집합 전체를 고르게 덮는다. **Grouping**: 각 중심점 주변의 이웃을 ball query(반경 내 점)로 묶는다. **PointNet layer**: 각 묶음에 [PointNet](#/p/pointnet) 구조(점별 MLP + max pooling)를 독립적으로 적용해 하나의 지역 특징 벡터로 요약한다. 이 레벨의 출력은 `N`개보다 적은 `N\'`개의 점에, 좌표와 함께 지역 문맥을 담은 새 특징이 붙은 집합이다.'},
 {h:'레벨을 쌓아 CNN처럼 receptive field를 키운다',
  lead:'set abstraction을 반복해 점점 넓은 영역의 문맥을 담은, 점점 적은 수의 점으로 요약한다.',
  d:'set abstraction 레벨을 여러 번 쌓으면 각 레벨의 "점"은 이전 레벨에서 더 넓은 반경을 요약한 결과가 된다. CNN이 conv layer를 쌓아 낮은 층은 에지, 높은 층은 물체 전체를 보게 되는 것과 같은 원리를, 격자가 아니라 비정형 점 집합 위에서 구현한 것이다. 분류는 마지막 레벨의 전역 특징으로, 분할은 보간(interpolation)으로 원래 점 개수까지 특징을 되돌려 픽셀 단위가 아닌 점 단위로 점수를 낸다.'},
 {h:'밀도 적응 그룹핑: MSG와 MRG',
  lead:'같은 중심점 주변을 여러 반경으로 동시에 묶어, 밀도가 낮은 곳은 큰 반경이 보완하게 한다.',
  d:'밀도가 낮은 영역은 작은 반경 안에 점이 거의 없어 지역 패턴이 깨진다. **Multi-Scale Grouping(MSG)**은 같은 중심점에 대해 여러 반경으로 각각 그룹핑·PointNet을 돌리고 특징을 이어붙여, 네트워크가 스스로 어느 스케일에 의존할지 학습하게 한다. **Multi-Resolution Grouping(MRG)**은 인접한 두 레벨의 특징을 직접 이어붙여 MSG와 비슷한 효과를 훨씬 싼 비용으로 낸다 — MSG는 여러 반경마다 별도 계산이 필요해 SSG(단일 스케일) 대비 forward 시간이 약 2배다.'}
],

diagram:{type:'stack', cap:'set abstraction 레벨을 두 번 쌓은 뒤 분류/분할로 갈라지는 구조. 왼쪽 초록 판이 원본 점, 오른쪽으로 갈수록 점 개수는 줄고 특징 차원은 늘어난다.',
 layers:[
  {t:'입력 점군', s:'N × (d+C)'},
  {t:'FPS 샘플링', s:'중심점 N1개 선택'},
  {t:'ball query 그룹핑', s:'반경 내 이웃 묶기', acc:true, note:'국소 구조 확보'},
  {t:'미니 PointNet', s:'묶음→지역특징'},
  {t:'SA 레벨 반복', s:'점점 넓은 문맥'},
  {t:'분류·분할 헤드', s:'전역특징 or 점별점수'}
 ]},

math:[
 {expr:'FPS: x_ij = argmax_{x∈S\\{x_i1,...,x_i(j-1)}} min_k dist(x, x_ik)',
  tex:'x_{i_j} = \\underset{x\\,\\in\\, S \\setminus \\{x_{i_1},\\dots,x_{i_{j-1}}\\}}{\\arg\\max}\\ \\min_{k<j}\\ \\mathrm{dist}(x,\\,x_{i_k})',
  d:'farthest point sampling은 이미 뽑은 점들과의 최소 거리가 가장 먼 점을 반복해서 고른다. 무작위 샘플링보다 점 집합 전체를 고르게(균일하게) 덮는 중심점 집합을 만든다.'}
],

numbers:[
 {k:'ModelNet40 정확도(xyz만)', v:'90.7%', d:'[PointNet](#/p/pointnet)의 89.2%(원 논문) / 87.2%(vanilla 재현치) 대비 향상'},
 {k:'ModelNet40 정확도(법선 포함)', v:'91.9%', d:'표면 법선(normal) 특징까지 넣었을 때, 같은 표(Table 2)의 최고치'},
 {k:'ShapeNet part segmentation', v:'mIoU 85.1%', d:'PointNet의 83.7% 대비 향상 — 같은 지표(점 단위 mIoU)로 비교'},
 {k:'MNIST 오차율', v:'0.51%', d:'PointNet 0.78% 대비 상대 34.6% 오차 감소(점군으로 변환한 MNIST)'},
 {k:'MSG vs SSG forward 시간', v:'163.2ms vs 82.4ms', d:'GTX 1080·배치 8 기준, 밀도 적응(MSG)의 비용이 단일 스케일(SSG)의 약 2배'},
 {k:'FPS 샘플링 임의성 영향', v:'정확도 표준편차 0.0017', d:'FPS의 첫 점 선택이 무작위인데도 반복 실행 간 정확도 변동이 거의 없음을 확인'}
],

impact:'[PointNet](#/p/pointnet)이 "점을 어떻게 순서 없이 처리하는가"를 풀었다면, 이 논문은 "그 처리를 어떻게 지역적으로, 계층적으로 반복하는가"를 풀었다. set abstraction이라는 반복 가능한 블록을 정의함으로써 점군 처리가 CNN처럼 **깊이를 쌓아 성능을 올릴 수 있는** 문제가 됐고, 밀도 적응 그룹핑은 실제 스캔 데이터(균일하지 않은 밀도)를 정면으로 다룬 첫 설계였다. 다만 ball query와 미니 PointNet을 점마다 반복하는 연산은 여전히 비싸서, 자율주행처럼 실시간이 필요한 응용에서는 이후 [VoxelNet](#/p/voxelnet)처럼 점을 격자로 미리 묶어버리는 방향이 갈라져 나온다.',

legacy:[
 '**지역 특징 추출기로 재사용** — 이후 여러 3D 검출·분할 네트워크가 set abstraction을 인코더 백본으로 그대로 차용',
 '**밀도 적응이라는 화두** — 실제 라이다 스캔의 불균일 밀도를 다루는 이후 연구들이 MSG/MRG의 문제의식을 계승',
 '**격자화로의 분기** — set abstraction의 연산 비용을 피해, 점을 복셀/기둥으로 미리 묶고 격자 합성곱을 쓰는 [VoxelNet](#/p/voxelnet)·[PointPillars](#/p/pointpillars) 계열이 갈라짐',
 '**자율주행 3D 인지의 이론적 토대** — 라이다 검출기 대부분이 "점을 어떻게 벡터화할까"의 답으로 PointNet 계열의 인코딩 방식을 어떤 형태로든 계승'
],

pitfalls:[
 '**"국소 구조를 본다" ≠ "합성곱을 쓴다".** set abstraction은 CNN의 커널이 아니라 ball query + 미니 PointNet(공유 MLP + max pooling)으로 지역을 요약한다 — 격자 위의 합성곱과는 계산 방식이 다르다.',
 '**MSG가 항상 이득은 아니다.** 밀도가 균일한 데이터(ModelNet40 CAD 모델 등)에서는 SSG와 성능 차이가 작으면서 forward 시간은 약 2배다. 밀도가 실제로 불균일한 스캔 데이터에서 MSG/MRG의 이점이 두드러진다.',
 '**ModelNet40 91.9%는 법선(normal) 정보를 추가로 쓴 결과다.** xyz 좌표만 쓴 90.7%와 같은 표에서 조건이 다르므로 혼동하지 않는다.'
],

figures:[
 {f:'fig2-hierarchy.png',
  cap:'왼쪽(초록→파랑→빨강)이 hierarchical feature learning: 각 set abstraction이 "sampling & grouping"으로 이웃을 묶고 "pointnet"으로 지역 특징을 뽑아 점 개수(N→N1→N2)는 줄이고 특징 차원(C→C1→C2)은 늘린다. 오른쪽 위가 분할(보간으로 원래 점 개수까지 되돌림), 오른쪽 아래가 분류(전역 특징을 완전연결층에 통과).',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'PointNet does not capture local structures induced by the metric space points live in, limiting its ability to recognize fine-grained patterns and generalizability to complex scenes.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1706.02413 — PointNet++', u:'https://arxiv.org/abs/1706.02413'},
 {t:'공식 코드 (charlesq34/pointnet2)', u:'https://github.com/charlesq34/pointnet2'}
]
});
