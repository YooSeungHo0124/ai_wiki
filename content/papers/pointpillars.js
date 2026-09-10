WIKI.paper({
slug:'pointpillars',
venue:'CVPR 2019',
authors:'Lang, Vora, Caesar, Zhou, Yang, Beijbom (nuTonomy · Aptiv)',
arxiv:'1812.05784',

tldr:'[VoxelNet](#/p/voxelnet)의 병목이던 **3D 합성곱을 통째로 걷어내고**, 점군을 수직 기둥(pillar)으로 나눠 2D 합성곱만으로 검출하는 라이다 검출기. KITTI에서 정확도를 유지하면서 **62Hz**로 동작해 실시간 자율주행 파이프라인에 쓸 수 있는 속도를 처음 확보했다.',

context:'[VoxelNet](#/p/voxelnet)은 손으로 만든 특징을 걷어내고 end-to-end 학습을 이뤘지만, 3D 복셀 특징에 3D 합성곱을 적용하는 middle layer가 추론 시간(225ms)의 대부분(170ms)을 차지해 4.4Hz로만 동작했다 — 자율주행에는 너무 느리다. 후속 SECOND는 희소 3D 합성곱으로 20Hz까지 끌어올렸지만 3D 합성곱 자체는 여전히 남아 있었다. 한편 MV3D·AVOD·PIXOR 같은 방법은 점군을 지면 위 격자로 투영해 손으로 만든 특징(pseudo-image)을 만들고 표준 2D CNN을 쓰는데, 빠르지만 고정 인코더라 정확도가 학습된 인코더보다 낮다. PointPillars의 질문은 명확하다 — **학습된 인코더의 정확도와 고정 인코더의 속도를 동시에 가질 수 있는가.**',

ideas:[
 {h:'복셀의 높이(z) 축을 아예 없앤다: pillar',
  lead:'x-y 평면에만 격자를 만들고 z 방향은 하나로 합쳐 3D 복셀이 아닌 수직 기둥으로 나눈다.',
  d:'[VoxelNet](#/p/voxelnet)은 `vD, vH, vW` 세 방향 모두에 복셀 크기를 정해야 했다. PointPillars는 x-y 평면만 격자로 나누고 z 방향은 나누지 않는다 — 즉 하나의 격자 셀에 속한 점은 높이에 상관없이 같은 "기둥(pillar)"에 속한다. 이 선택 하나로 z 방향 binning이라는 하이퍼파라미터가 아예 사라지고, 뒤따르는 인코딩·합성곱이 3차원이 아니라 **2차원**이 된다.'},
 {h:'Pillar Feature Net: 점을 학습된 벡터로, 다시 pseudo-image로',
  lead:'기둥마다 PointNet류 인코더로 특징을 뽑고, 기둥 위치에 되돌려 2D CNN이 먹을 수 있는 가짜 이미지를 만든다.',
  d:'점 `(x,y,z,r)`에 기둥 내 평균으로부터의 오프셋 `(x_c,y_c,z_c)`와 기둥 중심으로부터의 오프셋 `(x_p,y_p)`를 더해 9차원으로 증강한 뒤, 기둥마다 최대 `N`점·샘플당 최대 `P`개 기둥으로 잘라 `(D,P,N)` 텐서를 만든다. 이를 선형층+BN+ReLU와 기둥 내부 max pooling으로 처리해 기둥마다 `C`차원 벡터를 얻고(Pillar Feature Net), 이 벡터를 원래 x-y 위치에 되돌려 흩뿌려(scatter) `(C,H,W)` 크기의 **pseudo-image**를 만든다. 이 시점부터는 완전히 표준 2D 이미지처럼 다뤄진다.'},
 {h:'2D CNN 백본 + SSD 검출 헤드',
  lead:'pseudo-image를 다운샘플 3단 + 업샘플 3단 2D CNN에 넣고 Single Shot Detector로 박스를 회귀한다.',
  d:'pseudo-image는 표준 2D CNN 백본(다운샘플하며 채널을 키우는 3개 블록, 각 출력을 업샘플해 이어붙이는 구조)을 통과한다. 이 특징 맵 위에 [SSD](#/p/ssd) 스타일 단일 단계 검출 헤드를 얹어 클래스당 앵커의 방향·크기까지 한 번에 회귀한다 — 제안(proposal) 단계가 따로 없는 단일 단계 구조라 그 자체로도 빠르다.'}
],

diagram:{type:'compare', cap:'같은 라이다 인코딩 문제에 대한 VoxelNet과 PointPillars의 선택 차이.',
 left:{t:'VoxelNet: 3D 복셀', items:['x,y,z 3방향 모두 격자화','3D 합성곱으로 문맥 확장','추론 225ms, 그중 170ms가 3D conv']},
 right:{t:'PointPillars: 수직 기둥', items:['x,y만 격자화, z는 미분할', 'pseudo-image로 만들어 2D conv만 사용', '62Hz, VoxelNet 대비 14배 이상']}},

math:[
 {expr:'l_aug = [x, y, z, r, x_c, y_c, z_c, x_p, y_p] ∈ R^9',
  tex:'l_{\\text{aug}} = [\\,x,\\ y,\\ z,\\ r,\\ x_c,\\ y_c,\\ z_c,\\ x_p,\\ y_p\\,] \\in \\mathbb{R}^{9}',
  d:'원본 점(x,y,z,반사율 r)에 기둥 내 점들의 산술평균으로부터의 거리(c 첨자)와 기둥 x-y 중심으로부터의 오프셋(p 첨자)을 더해 9차원으로 증강한다. 이 증강이 Pillar Feature Net 입력이며, z방향 binning 없이도 기둥 내부의 상대적 높이 정보를 일부 보존한다.'}
],

numbers:[
 {k:'추론 속도', v:'62Hz', d:'KITTI 기준, [VoxelNet](#/p/voxelnet) 4.4Hz·SECOND 20Hz 대비 2~4배 이상(전체 파이프라인 기준)'},
 {k:'KITTI test 3D mAP(전클래스)', v:'59.20', d:'test 3D detection benchmark, 라이다만 사용 — VoxelNet 49.05·SECOND 56.69 대비 최고(Table 2, 논문 시점 기준)'},
 {k:'KITTI test BEV mAP(전클래스)', v:'66.19', d:'test BEV detection benchmark — 라이다+이미지를 쓰는 AVOD-FPN(64.11)도 앞섬(Table 1)'},
 {k:'Car 3D AP(easy/mod/hard)', v:'79.05 / 74.99 / 68.30', d:'test 3D 기준, IoU 0.7 — 같은 표의 VoxelNet은 77.47/65.11/57.73'},
 {k:'비어있지 않은 기둥 비율', v:'약 3%', d:'0.16²㎡ 격자, HDL-64E 라이다 기준 6천~9천 개 비어있지 않은 기둥(전체 대비 ~97% 희소)'}
],

impact:'"3D 인지에 반드시 3D 합성곱이 필요한가"라는 질문에 아니라고 답했다. z축을 아예 격자화하지 않는 단순한 선택 하나로 전체 연산을 2D로 접었고, 그 결과가 정확도 손실 없이(오히려 KITTI test에서 최고 mAP) 실시간 처리 속도로 이어졌다. 이 "학습된 인코더 + 순수 2D 백본"이라는 조합은 이후 라이다 검출기의 사실상 표준 출발점이 되어, [CenterPoint](#/p/centerpoint) 같은 후속 연구가 인코더는 그대로 두고 검출 헤드(앵커 기반 → 중심점 기반)만 바꾸는 방식으로 개선을 이어간다.',

legacy:[
 '**검출 헤드 교체의 토대** — [CenterPoint](#/p/centerpoint)가 PointPillars/VoxelNet류 백본 위에 앵커 없는 중심점 검출 헤드를 얹어 더 개선',
 '**pseudo-image 레시피의 확산** — "점을 격자 위 벡터로 학습해 2D CNN에 넣는다"는 패턴이 카메라 기반 BEV 인지(예: [Lift-Splat-Shoot](#/p/lss))에도 구조적으로 영향',
 '**실시간 라이다 인지의 기준점** — 이후 속도를 보고하는 논문들이 PointPillars의 62Hz를 비교 기준으로 삼음',
 '**산업 배치 표준화** — 단순함과 속도 덕에 실제 자율주행 스택에서 채택된 대표적 라이다 검출기 중 하나가 됨'
],

pitfalls:[
 '**KITTI easy/moderate/hard와 nuScenes mAP/NDS를 섞지 않는다.** 이 논문의 수치는 전부 KITTI test 기준(3D 또는 BEV, 클래스별·난이도별 AP)이며, [nuScenes](#/p/nuscenes)의 mAP·NDS 체계와는 산출 방식이 다르다.',
 '**"pillar라 정확도를 희생한다"는 오해다.** 원문은 오히려 VoxelNet·SECOND보다 KITTI test mAP가 높다고 보고한다 — z축을 없앤 것이 정보 손실이 아니라 인코딩 방식의 재배치였음을 보여주는 것이 이 논문의 핵심 주장이다.',
 '**62Hz는 전체 파이프라인(인코딩+백본+검출 헤드) 속도다.** 개별 구성 요소만 떼어 비교하는 다른 논문의 수치와 조건을 맞춰봐야 한다.'
],

figures:[
 {f:'fig2-pipeline.png',
  cap:'위: 전체 흐름 — 점군이 Pillar Feature Net → 2D CNN 백본 → SSD 검출 헤드를 거쳐 예측으로 이어진다. 왼쪽 아래: 점군이 Stacked Pillars(D×P×N 텐서)가 되고 학습된 특징을 거쳐 Pseudo image(C×H×W)로 흩뿌려지는 과정. 오른쪽 아래: 백본이 세 단계로 다운샘플(Conv)하고 각각을 업샘플(Deconv)해 이어붙이는(Concat) 구조.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'Recent literature suggests two types of encoders; fixed encoders tend to be fast but sacrifice accuracy, while encoders that are learned from data are more accurate, but slower.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1812.05784 — PointPillars', u:'https://arxiv.org/abs/1812.05784'},
 {t:'공식 코드 (nutonomy/second.pytorch)', u:'https://github.com/nutonomy/second.pytorch'}
]
});
