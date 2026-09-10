WIKI.paper({
slug:'voxelnet',
venue:'CVPR 2018',
authors:'Zhou, Tuzel (Apple Inc.)',
arxiv:'1711.06396',

tldr:'라이다 점군을 **복셀로 나누고, 복셀 안에서 [PointNet](#/p/pointnet) 스타일 인코더를 돌린 뒤, 3D 합성곱으로 검출**하는 end-to-end 파이프라인. 손으로 설계한 bird\'s-eye-view 특징 같은 전처리 없이 원시 점군에서 바로 3D 박스를 낸다.',

context:'VoxelNet 이전의 라이다 3D 검출은 대부분 **손으로 만든 특징**을 거쳤다 — 점군을 새-눈 시점(bird\'s-eye view)으로 투영해 높이·밀도 통계를 채널로 쌓거나, 복셀마다 6개의 통계량을 미리 계산해 넣는 식이다. 이런 수작업 특징은 region proposal network(RPN) 같은 표준 검출 헤드가 요구하는 **조밀한 텐서 입력**을 만들어 주지만, 정보 병목이 생겨 점군이 가진 3D 형태 정보를 다 살리지 못한다. 한편 [PointNet](#/p/pointnet)/[PointNet++](#/p/pointnet2)는 원시 점을 직접 학습하지만, 장면 전체의 점(라이다 한 프레임에 10만 개 안팎)을 그대로 넣기엔 비싸고, RPN이 기대하는 격자 구조도 아니다. VoxelNet은 "점 단위 학습과 격자 기반 RPN 사이의 간극을 메운다"는 목표로 설계됐다.',

ideas:[
 {h:'Voxel Feature Encoding(VFE): 복셀 안에서 점끼리 상호작용',
  lead:'복셀 내부의 각 점에 점별 특징과 복셀 전체를 요약한 지역 특징을 이어붙여 쌓는다.',
  d:'점군을 `vD×vH×vW` 크기의 동일 간격 복셀로 나누고, 복셀 하나에 들어온 점들(최대 `T`개로 무작위 샘플링)에 VFE 레이어를 적용한다. 각 점은 FCN으로 특징을 뽑은 뒤, 같은 복셀 안 모든 점의 특징을 element-wise max로 모은 **지역 요약 벡터**를 다시 자신의 점별 특징에 이어붙인다. 이 결합 특징을 다시 FCN에 태우는 것을 여러 층 반복(stacked VFE)해서, 복셀 내부 점들이 서로의 존재를 반영한 특징을 학습한다 — [PointNet](#/p/pointnet)의 점별 MLP + max pooling 구조를 복셀 하나하나의 로컬 인코더로 재사용한 것이다.'},
 {h:'희소 4D 텐서로 빈 복셀을 건너뛴다',
  lead:'점이 있는 복셀만 계산해 메모리와 연산을 아끼고, 결과를 조밀한 4D 텐서로 되돌린다.',
  d:'라이다 스캔은 전형적으로 복셀의 대부분이 비어 있다. VoxelNet은 비어 있지 않은 복셀만 해시 테이블로 추적해 VFE 인코딩을 GPU에서 병렬로 수행하고, 이후 3D 합성곱 입력용으로만 조밀한 `C×D\'×H\'×W\'` 텐서를 구성한다. 점 집합 수준의 희소성과 이후 단계의 조밀 텐서 연산을 모두 살리는 절충이다.'},
 {h:'3D 합성곱 middle layer로 복셀 사이 문맥을 섞는다',
  lead:'복셀별 특징을 3D convolutional middle layer 여러 겹으로 통과시켜 수용 영역을 넓힌다.',
  d:'VFE가 만든 복셀별 특징 볼륨에 3D 합성곱을 몇 층 적용해, 인접 복셀 사이의 공간 문맥을 섞고 채널을 키운다. 이 단계가 이 논문에서 가장 비싼 연산이다(추론 225ms 중 170ms) — 3D 합성곱은 2D보다 커널 크기가 한 차원 늘어난 만큼 연산량이 크게 늘기 때문이며, 이 병목이 [PointPillars](#/p/pointpillars)가 통째로 걷어내는 대상이 된다.'},
 {h:'RPN으로 최종 3D 박스 회귀',
  lead:'3D 합성곱 출력을 2D로 접어 표준 RPN에 넣고 앵커 기반으로 3D 박스를 회귀한다.',
  d:'3D 합성곱 middle layer의 출력에서 높이 축을 채널에 합쳐 2D 특징 맵으로 만든 뒤, 다운샘플링과 업샘플링 블록으로 이뤄진 RPN(Faster R-CNN 계열의 region proposal network 구조 차용)을 얹어 클래스당 앵커를 두고 `Δx,Δy,Δz` 및 크기·방향을 회귀한다. 특징 추출부터 박스 회귀까지 **하나의 네트워크로 end-to-end 학습**되는 것이 손으로 설계한 특징 파이프라인과의 결정적 차이다.'}
],

diagram:{type:'stack', cap:'전체 파이프라인. 원시 점군이 복셀 분할과 VFE를 거쳐 희소 4D 텐서가 되고, 3D 합성곱과 RPN을 지나 3D 박스가 나온다.',
 layers:[
  {t:'원시 점군', s:'프레임당 ~10만 점'},
  {t:'복셀 분할·그룹핑', s:'vD×vH×vW 격자'},
  {t:'Stacked VFE', s:'점별 특징+복셀 요약', acc:true, note:'PointNet식 인코더'},
  {t:'희소 4D 텐서', s:'C×D\'×H\'×W\''},
  {t:'3D 합성곱 층', s:'문맥 확장, 170ms', note:'가장 느린 단계'},
  {t:'RPN', s:'앵커 기반 3D 박스 회귀'}
 ]},

math:[
 {expr:'f_out_i = [f_i^T, f̃^T]^T,   f̃ = max{f_1,...,f_t}',
  tex:'f_i^{\\text{out}} = \\big[\\,f_i^{\\top},\\ \\tilde{f}^{\\top}\\,\\big]^{\\top},\\qquad \\tilde{f} = \\underset{j=1,\\dots,t}{\\text{MAX}}\\ f_j',
  d:'VFE 레이어의 핵심 연산. 점별 특징 `f_i`에, 같은 복셀 안 모든 점의 특징을 element-wise max로 합친 지역 요약 `f̃`를 이어붙인다. 이 결합 벡터가 다음 VFE 층의 입력이 되어, 층을 쌓을수록 복셀 내부의 점 간 상호작용이 깊어진다.'}
],

numbers:[
 {k:'KITTI Car 3D detection AP', v:'81.97 / 65.46 / 62.85', d:'easy/moderate/hard, KITTI validation set — bird\'s-eye-view가 아닌 **3D box** 기준(Table 2)'},
 {k:'KITTI Car BEV detection AP', v:'89.60 / 84.81 / 78.57', d:'같은 데이터셋의 bird\'s-eye-view 기준(Table 1), 3D 기준과 지표가 다르므로 섞지 않는다'},
 {k:'HC-baseline 대비 3D AP 향상', v:'+10.68 / +5.71 / +7.16%p', d:'손으로 만든 복셀 통계(HC-baseline)와 동일 파라미터 수·학습 절차로 비교한 end-to-end 학습의 효과'},
 {k:'추론 시간', v:'225ms', d:'TitanX GPU 기준 — VFE 20ms + 3D 합성곱 170ms + RPN 30ms(+ 복셀화 5ms)'},
 {k:'IoU 임계값', v:'Car 0.7 / Pedestrian·Cyclist 0.5', d:'KITTI AP 계산에 쓰인 클래스별 매칭 기준'}
],

impact:'"라이다 점군에서 손으로 만든 특징을 걷어내고 끝단까지 학습으로 대체할 수 있는가"라는 질문에 처음으로 명확히 그렇다고 답한 논문이다. VFE라는 복셀-내부 인코더는 [PointNet](#/p/pointnet)의 아이디어를 검출 파이프라인의 부품으로 재배치한 것이고, 이 조합이 KITTI에서 기존 수작업 특징 기반 방법을 명백한 차이로 앞섰다. 그러나 3D 합성곱이 추론 시간의 약 4분의 3(225ms 중 170ms)을 잡아먹는다는 사실이 곧바로 다음 문제로 넘어간다 — 복셀을 굳이 3차원으로 유지해야 하는가, 아니면 높이 축을 없애고 2D 합성곱만으로 될 것인가라는 질문이 [PointPillars](#/p/pointpillars)를 낳는다.',

legacy:[
 '**3D 합성곱 제거** — [PointPillars](#/p/pointpillars)가 복셀을 수직 기둥(pillar)으로 바꿔 3D 합성곱을 2D로 대체, 실시간 처리를 달성',
 '**VFE의 재사용** — 이후 여러 복셀 기반 검출기가 stacked VFE 또는 그 변형을 점→복셀 인코더로 그대로 채택',
 '**희소 컨볼루션으로의 발전** — 빈 복셀을 건너뛰는 아이디어가 이후 sparse convolution 라이브러리 기반 검출기들로 정교화됨',
 '**end-to-end 학습이 표준이 됨** — 손으로 만든 bird\'s-eye-view 특징을 쓰던 이전 방식이 VoxelNet 이후 사실상 도태'
],

pitfalls:[
 '**BEV AP와 3D AP를 혼동하지 않는다.** 같은 논문 안에서도 Table 1(BEV)과 Table 2(3D)의 값이 다르다 — Car easy 기준 89.60(BEV) vs 81.97(3D). 어느 표인지 반드시 명시해야 한다.',
 '**KITTI easy/moderate/hard는 nuScenes의 mAP/NDS와 다른 체계다.** KITTI는 객체 크기·가림·잘림 정도로 난이도를 나누고 클래스별 AP를 따로 낸다 — [nuScenes](#/p/nuscenes) 논문의 지표와 섞으면 안 된다.',
 '**"손으로 만든 특징이 전혀 없다"는 과장에 가깝다.** 복셀 크기·최대 점 수 `T`·앵커 크기 같은 하이퍼파라미터는 여전히 사람이 정한다 — 사라진 것은 복셀 내부 통계 특징이지 모든 설계 선택이 아니다.'
],

figures:[
 {f:'fig2-vfe-pipeline.png',
  cap:'왼쪽부터: 원본 점군을 복셀 격자(자홍색 상자)로 나누고(Voxel Partition), 각 복셀에 속한 점을 묶고(Grouping), 최대 t개로 무작위 샘플링한 뒤(Random Sampling) VFE Layer를 1번부터 n번까지 쌓아(Stacked Voxel Feature Encoding) 점별 특징을 키우다가 element-wise maxpool로 복셀 하나당 C차원 벡터 하나를 만든다(맨 오른쪽 Sparse 4D Tensor).',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'VoxelNet divides a point cloud into equally spaced 3D voxels and transforms a group of points within each voxel into a unified feature representation through the newly introduced voxel feature encoding (VFE) layer.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1711.06396 — VoxelNet', u:'https://arxiv.org/abs/1711.06396'},
 {t:'KITTI 3D Object Detection Benchmark', u:'https://www.cvlibs.net/datasets/kitti/eval_object.php'}
]
});
