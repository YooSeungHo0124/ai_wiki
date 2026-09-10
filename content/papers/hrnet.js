WIKI.paper({
slug:'hrnet',
venue:'CVPR 2019',
authors:'Sun et al. (USTC · Microsoft Research Asia)',
arxiv:'1902.09212',

tldr:'대부분의 자세 추정 네트워크는 고해상도→저해상도→고해상도로 축소했다가 복원하는데, HRNet은 **고해상도 표현을 네트워크 처음부터 끝까지 유지**하면서 여러 해상도의 가지를 병렬로 두고 반복적으로 정보를 교환한다. 자세 추정 성능뿐 아니라 분류·검출·분할 백본으로도 널리 쓰이게 되었다.',

context:'2019년 이전의 자세 추정 네트워크는 거의 전부 **고해상도→저해상도→고해상도** 구조였다. Hourglass는 대칭적인 축소·복원 경로에 skip connection을 더했고, SimpleBaseline은 [ResNet](#/p/resnet) 뒤에 transposed convolution 몇 층을 붙여 해상도를 되돌렸다. 문제는 **한 번 저해상도로 눌린 표현은 복원해도 공간 정밀도가 완전히 회복되지 않는다**는 점이다. 관절처럼 작고 위치가 정밀해야 하는 대상에는 이 손실이 특히 치명적이다. 상향식 방법인 [OpenPose](#/p/openpose)도 결국 백본이 해상도를 낮췄다가 복원하는 동일한 구조 위에서 part affinity field를 뽑는다는 점은 같다. 질문은 단순하다 — **애초에 고해상도를 한 번도 버리지 않으면 어떨까?**',

ideas:[
 {h:'고해상도 가지를 처음부터 끝까지 유지',
  lead:'해상도를 낮췄다가 복원하는 대신 1×축 고해상도 가지를 네트워크 전체에서 살려둔다.',
  d:'1단계는 고해상도 서브넷 하나로 시작한다. 이후 2, 3, 4단계에서 저해상도 가지를 **하나씩 추가**해 병렬로 나란히 놓는다. 최종적으로 1×, 2×, 4×, 8× 축소된 네 개의 가지가 동시에 존재하며, 어떤 가지도 다른 가지로 완전히 대체되지 않는다. 고해상도 표현이 한 번도 저해상도로 붕괴됐다가 복원되지 않으므로 정보 손실 자체가 구조적으로 줄어든다.'},
 {h:'반복적 multi-scale fusion',
  lead:'병렬 가지들이 exchange unit을 통해 서로의 정보를 반복적으로 주고받는다.',
  d:'각 해상도 가지는 독립적으로 컨볼루션을 몇 층 쌓은 뒤, `exchange unit`에서 다른 모든 해상도의 정보를 모아 합친다. 저해상도→고해상도는 nearest-neighbor 업샘플링 + 1×1 conv, 고해상도→저해상도는 stride-2 3×3 conv로 맞춘다. 이 교환이 **한 번이 아니라 네트워크 전체에서 8번 반복**되므로, 고해상도 표현이 저해상도 가지가 축적한 넓은 문맥 정보를 계속 흡수하면서도 자기 해상도를 잃지 않는다.'},
 {h:'단계마다 가지를 늘리며 폭도 같이 키운다',
  lead:'저해상도 가지를 추가할 때 채널 수를 두 배로 늘려 표현력을 보상한다.',
  d:'해상도가 절반이 되는 새 가지를 추가할 때마다 채널 폭(width)을 두 배로 늘린다. HRNet-W32는 마지막 세 단계 고해상도 가지 폭이 32, HRNet-W48은 48이며, 나머지 저해상도 가지는 그 2배·4배·8배 폭을 갖는다. [ResNet](#/p/resnet)의 병목 설계를 그대로 가져와 첫 단계 residual unit을 구성했다.'},
 {h:'heatmap을 고해상도 표현에서 직접 회귀',
  lead:'별도의 업샘플링 디코더 없이 마지막 exchange unit의 고해상도 출력에서 바로 heatmap을 뽑는다.',
  d:'Hourglass나 SimpleBaseline은 저해상도 특징을 다시 고해상도로 복원하는 별도의 디코더 경로가 필요하다. HRNet은 고해상도 가지가 이미 살아있으므로 그 출력에 바로 회귀 헤드를 붙이면 된다. 중간 감독(intermediate supervision) 없이도 이 구조만으로 기존 방법을 능가한다고 논문은 강조한다.'},
 {h:'자세 추정 전용이 아니라 범용 백본',
  lead:'같은 병렬-교환 구조를 분류·검출·분할에 그대로 적용해도 강한 백본이 된다.',
  d:'논문은 자세 추정으로 소개하지만, 구조 자체는 특정 태스크에 종속되지 않는다. 마지막 단계에서 저해상도 가지의 표현들을 업샘플링해 고해상도 가지와 합치기만 하면 분류·검출·의미분할용 백본으로 바로 전용할 수 있다. 이 범용성 때문에 HRNet은 이후 여러 dense prediction 계열 논문의 백본으로 채택된다.'}
],

diagram:{type:'stack', cap:'고해상도(1×) 가지가 맨 위에서 끝까지 살아있고, 2×·4× 가지가 아래에 병렬로 붙어 반복적으로 정보를 교환한다(실제 도식은 아래 원문 Figure 1 참조).',
 layers:[
  {t:'입력 이미지', s:'stride-2 stem ×2'},
  {t:'1단계: 고해상도', s:'1× 해상도 시작', acc:true},
  {t:'2단계 가지 추가', s:'2× 저해상도 병렬'},
  {t:'exchange unit', s:'해상도 간 정보 교환', note:'8회 반복'},
  {t:'3·4단계 가지 추가', s:'4×, 8× 저해상도 병렬'},
  {t:'heatmap 회귀', s:'1× 출력에서 직접'}
 ]},

math:[
 {expr:'Y_k = Σ_{i=1..s} a(X_i, k)',
  tex:'Y_k=\\sum_{i=1}^{s}a(X_i,k)',
  d:'exchange unit의 핵심 식. $s$ 개 해상도의 입력 맵 $X_i$ 를 각각 목표 해상도 $k$ 로 맞춘 뒤($a(X_i,k)$ = 업/다운샘플) 전부 더해 출력 $Y_k$ 를 만든다. $i=k$ 이면 항등 연결이다.'},
 {expr:'OKS = Σ_i exp(-d_i² / 2s²k_i²) δ(v_i>0) / Σ_i δ(v_i>0)',
  tex:'OKS=\\frac{\\sum_i \\exp\\!\\left(-d_i^{2}/2s^{2}k_i^{2}\\right)\\delta(v_i>0)}{\\sum_i \\delta(v_i>0)}',
  d:'COCO의 평가 지표인 Object Keypoint Similarity. $d_i$ 는 예측-정답 키포인트 간 유클리드 거리, $s$ 는 객체 스케일, $k_i$ 는 키포인트별 감쇠 상수. AP는 OKS 임계값 0.50~0.95(10개 지점)의 평균이다.'}
],

numbers:[
 {k:'COCO val AP · HRNet-W32', v:'73.4 (from scratch)', d:'입력 256×192, 사전학습 없이 처음부터 학습, top-down'},
 {k:'COCO val AP · HRNet-W48', v:'76.3', d:'입력 384×288, ImageNet 사전학습, 같은 입력 크기의 ResNet-152 SimpleBaseline(74.3)보다 높고 파라미터는 63.6M로 더 적음'},
 {k:'파라미터 · GFLOPs', v:'W32 28.5M·7.1G / W48 63.6M·14.6G', d:'입력 256×192 기준, human detection·keypoint grouping 연산은 제외'},
 {k:'COCO test-dev AP · HRNet-W48+extra', v:'77.0', d:'top-down, 384×288, 추가 데이터 사용 시 최고 성능'},
 {k:'단계 구성', v:'4단계 · 8회 exchange unit', d:'2·3·4단계에 각각 1, 4, 3개의 exchange block, 각 block이 4개 residual unit'}
],

impact:'HRNet 이후 "먼저 축소했다가 복원"이 자세 추정의 유일한 정답이 아니라는 것이 확인됐고, 고해상도 유지 + 반복 교환이라는 설계 원칙이 자세 추정을 넘어 의미분할·객체검출 백본으로 확산됐다. 같은 파라미터·연산량 대비 SimpleBaseline류보다 높은 AP를 보여, "디코더를 잘 만드는 것"보다 "애초에 해상도를 잃지 않는 것"이 더 근본적인 해법이라는 방향을 제시했다. 이후 [ViTPose](#/p/vitpose) 같은 후속 연구는 오히려 이 정교한 다중 해상도 설계를 걷어내고 평범한 백본 + 사전학습으로도 비슷하거나 더 나은 성능이 나온다는 것을 보이며 반박하는 흐름을 만들었다.',

legacy:[
 '**MMPose/MMDetection 생태계의 기본 백본** — [RTMPose](#/p/rtmpose)를 비롯한 여러 실무 파이프라인이 HRNet을 표준 backbone 후보로 채택',
 '**"단순한 백본 + 사전학습"으로의 반박** — [ViTPose](#/p/vitpose)가 HRNet 식 정교한 멀티스케일 설계 없이도 plain ViT로 대등하거나 더 나은 성능을 보이며 설계 철학 자체에 의문을 제기',
 '**분류·검출·분할로 이식** — 같은 저자들이 HRNet 백본을 semantic segmentation, object detection에 확장해 "고해상도 유지"가 자세 추정 전용 트릭이 아님을 보임',
 '**bottom-up 계열과의 공존** — [OpenPose](#/p/openpose) 식 상향식 방법은 이후로도 다중 인원 처리 속도에서 강점을 유지하며 top-down/bottom-up 두 계열이 병존'
],

pitfalls:[
 '**HRNet은 top-down(하향식)이다.** 사람 검출기로 각 인물의 박스를 먼저 자르고, 그 안에서 단일 인물 keypoint를 추정한다. 반면 [OpenPose](#/p/openpose)는 bottom-up(상향식) — 이미지 전체에서 keypoint와 part affinity field를 먼저 뽑고 그룹핑한다. 논문 Table 2의 top-down AP 수치에는 **사람 검출기(SimpleBaseline이 쓴 것과 동일한 detector) 성능이 그대로 섞여 들어간다** — HRNet 자체의 keypoint 추정 능력만을 보는 수치가 아니다.',
 '"HRNet이 항상 더 빠르다"는 오해가 있다. 병렬 가지를 여러 개 유지하므로 연산량(GFLOPs)은 같은 입력 크기의 단일 경로 ResNet 백본보다 늘어날 수 있다 — 이 논문이 보이는 이득은 속도가 아니라 **같은 파라미터·연산량 대비 정확도**다.',
 '표의 AP 값을 읽을 때 입력 해상도(256×192 vs 384×288)와 사전학습 여부(Pretrain 열)를 반드시 같이 봐야 한다. 같은 HRNet-W32라도 256×192/scratch는 73.4, 384×288/pretrain은 75.8로 조건에 따라 수치가 크게 갈린다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'가로축이 네트워크 깊이, 세로축이 특징맵 해상도(1×/2×/4×). 맨 위 1× 가지가 입력부터 출력까지 끊기지 않고 이어지는 것이 핵심이고, 대각선으로 교차하는 화살표들이 해상도 간 정보 교환(exchange unit)이다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig3-exchange-unit.png',
  cap:'왼쪽부터 고·중·저 해상도 출력이 각각 어떻게 만들어지는지 보여준다. 초록 사각형은 다운샘플(stride-3×3 conv), 파란 사각형은 업샘플(nearest-neighbor + 1×1 conv) — 모든 입력 해상도가 화살표를 통해 각 출력에 합산된다.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'Instead, our proposed network maintains high-resolution representations through the whole process.',
  src:'Abstract, p.1'},
 {t:'We conduct repeated multi-scale fusions such that each of the high-to-low resolution representations receives information from other parallel representations over and over, leading to rich high-resolution representations.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1902.09212 — Deep High-Resolution Representation Learning for Human Pose Estimation', u:'https://arxiv.org/abs/1902.09212'},
 {t:'공식 코드 (leoxiaobin/deep-high-resolution-net.pytorch)', u:'https://github.com/leoxiaobin/deep-high-resolution-net.pytorch'}
]
});
