WIKI.paper({
slug:'raft',
venue:'ECCV 2020 (Best Paper)',
authors:'Teed, Deng (Princeton University)',
arxiv:'2003.12039',

tldr:'모든 픽셀 쌍의 유사도를 담은 4D 상관 볼륨을 만들고, GRU 하나로 그 볼륨을 반복 조회하며 흐름장을 갱신하는 optical flow 아키텍처. 파라미터는 훨씬 적으면서 Sintel·KITTI 오류를 각각 30%·16% 줄여 이후 대부분의 흐름 추정 모델의 기본 골격이 됐다.',

context:'2020년 이전 딥러닝 기반 optical flow(FlowNet, PWC-Net 등)는 대체로 **coarse-to-fine 피라미드**를 썼다. 저해상도에서 대략적인 흐름을 구한 뒤 해상도를 높여가며 다듬는 방식인데, 저해상도 단계에서 작고 빠르게 움직이는 물체를 한번 놓치면 이후 단계에서 복구할 방법이 없다. 게다가 피라미드 레벨마다 다른 가중치를 쓰다 보니 반복 횟수가 레벨 수로 고정되고, 학습에도 흔히 100만 스텝 이상이 필요했다. 전통적인 최적화 기반 방법은 데이터항과 정규화항의 트레이드오프를 손으로 설계해야 했다. "**모든 해상도를 동시에, 하나의 가중치 공유 갱신 연산으로** 반복 정제할 수는 없을까"가 이 논문의 출발점이다.',

ideas:[
 {h:'전체 픽셀 쌍의 4D 상관 볼륨',
  lead:'두 프레임의 모든 픽셀 쌍 내적을 한 번의 행렬곱으로 미리 다 계산해둔다.',
  d:'$I_1$과 $I_2$의 특징맵 $g_\\theta(I_1), g_\\theta(I_2) \\in \\mathbb{R}^{H\\times W\\times D}$ 사이 모든 픽셀 쌍의 내적을 계산해 $H\\times W\\times H\\times W$ 크기의 4D 볼륨 하나로 만든다. 행렬곱 한 번으로 계산되고 반복 횟수와 무관하게 **한 번만** 만들면 되므로, 매 반복마다 특징을 다시 비교할 필요가 없다. 이 볼륨의 마지막 두 차원을 커널 크기 {1,2,4,8}로 평균 풀링해 4단계 피라미드로 만들어 큰 변위와 작은 변위를 동시에 담는다.'},
 {h:'GRU 기반 update operator가 흐름을 반복 갱신',
  lead:'현재 흐름 추정치로 상관 볼륨을 조회하고 GRU로 다음 흐름을 예측한다.',
  d:'0으로 초기화한 흐름장에서 시작해, 현재 추정치 $f^k$ 주변의 상관 볼륨을 조회(lookup)하고 그 값과 현재 흐름·문맥 특징을 conv-GRU에 넣어 업데이트량 $\\Delta f$ 를 예측한다. 이 과정을 100회 이상 반복해도 파라미터는 단 **2.7M**뿐이다. 매 반복마다 다른 가중치를 쓰던 이전 방법과 달리 하나의 가중치를 계속 재사용(weight-tying)하기 때문에 반복 횟수가 학습·추론 시점에 자유롭게 정해진다.'},
 {h:'저해상도 흐름 없이 고정 해상도에서 전부 처리',
  lead:'피라미드를 내려가며 해상도를 바꾸지 않고 1/8 해상도 하나에서 전 과정을 수행한다.',
  d:'coarse-to-fine 방법은 저해상도에서 놓친 작은 물체의 움직임을 복구할 수 없었다. RAFT는 1/8 해상도의 단일 흐름장을 유지한 채 다중 스케일 상관 볼륨만 조회 시점에 참조하므로, 고해상도의 세부 정보를 잃지 않으면서도 큰 변위 정보를 함께 볼 수 있다.'},
 {h:'최적화 알고리즘을 흉내 내는 학습된 업데이트',
  lead:'전통 최적화의 반복 갱신 구조를 그대로 두되 규칙 대신 학습된 함수로 대체한다.',
  d:'전통적인 optical flow는 데이터항과 정규화항을 손으로 설계해 반복적으로 최적화했다. RAFT는 그 반복 구조 자체는 유지하되, "다음에 어느 방향으로 흐름을 바꿀지"를 규칙이 아니라 특징 인코더와 update operator가 **학습**하게 만들었다. 결과적으로 고정점(fixed point)에 수렴하도록 학습되는 recurrent 구조가 된다.'}
],

diagram:{type:'loop', cap:'0으로 초기화한 흐름장이 상관 볼륨 조회 → GRU 갱신을 반복하며 다듬어진다.',
 center:'매 반복 GRU 갱신',
 nodes:[
  {t:'특징 인코더', s:'1/8 해상도 D=256'},
  {t:'4D 상관 볼륨', s:'전체 픽셀 쌍', acc:true},
  {t:'상관 조회', s:'현재 흐름 주변'},
  {t:'GRU 갱신', s:'Δf 예측, 2.7M'},
  {t:'흐름 누적', s:'f ← f + Δf'}
 ]},

math:[
 {expr:'C(g(I1), g(I2)) ∈ R^(H×W×H×W),  C_ijkl = Σ_h g(I1)_ijh · g(I2)_klh',
  tex:'\\mathbf{C}(g_\\theta(I_1),g_\\theta(I_2))\\in\\mathbb{R}^{H\\times W\\times H\\times W},\\quad C_{ijkl}=\\sum_h g_\\theta(I_1)_{ijh}\\cdot g_\\theta(I_2)_{klh}',
  d:'두 프레임 특징의 모든 픽셀 쌍에 대한 내적을 한 번의 행렬곱으로 구한 것이 4D 상관 볼륨이다. 이후 커널 {1,2,4,8}로 마지막 두 차원을 풀링해 4단계 피라미드 $\\{C^1,C^2,C^3,C^4\\}$ 를 만든다.'},
 {expr:'f_(k+1) = f_k + Δf,  Δf = GRU(L_C(f_k), f_k, context)',
  tex:'f_{k+1}=f_k+\\Delta f,\\qquad \\Delta f=\\text{GRU}\\big(L_{\\mathbf{C}}(f_k),\\,f_k,\\,\\text{context}\\big)',
  d:'현재 흐름 $f_k$ 로 상관 피라미드를 조회한 값 $L_C(f_k)$ 와 문맥 특징을 GRU에 넣어 업데이트량 $\\Delta f$ 를 얻고 흐름을 누적한다. 이 반복이 100회 이상 이어져도 학습되는 가중치는 GRU 하나뿐이다.'}
],

numbers:[
 {k:'Sintel(final) EPE', v:'2.855px', d:'이전 최고 4.098px 대비 **30%** 오류 감소'},
 {k:'KITTI F1-all', v:'5.10%', d:'이전 최고 6.10% 대비 **16%** 오류 감소'},
 {k:'합성 데이터만 학습 시 KITTI EPE', v:'5.04px', d:'이전 최고 딥러닝 모델(8.36px) 대비 **40%** 감소 — 교차 데이터셋 일반화'},
 {k:'추론 속도', v:'10 FPS', d:'1088×436 해상도, 1080Ti GPU 기준'},
 {k:'경량판 속도', v:'20 FPS', d:'파라미터 1/5로 줄여도 Sintel에서 기존 모든 방법보다 우수'},
 {k:'update operator 파라미터', v:'2.7M', d:'100회 이상 반복 적용 가능. IRR은 38M로 5회 한정'}
],

impact:'"저해상도부터 다듬는다"는 피라미드 패러다임을 "**모든 픽셀 쌍을 미리 다 비교해두고 하나의 갱신 연산을 반복한다**"는 패러다임으로 바꿨다. 학습 반복 횟수를 10배 줄이면서도 정확도와 일반화 성능을 동시에 크게 끌어올려, 이후 광학 흐름 연구 대부분이 RAFT의 상관 볼륨+GRU 갱신 구조를 기본 베이스라인으로 채택했다. 동일한 "전체 쌍 상관 + 반복 갱신" 레시피가 스테레오 매칭·장면 흐름 등 다른 대응(correspondence) 문제로도 그대로 확장됐다.',

legacy:[
 '**상관 볼륨 + GRU 레시피의 표준화** — 이후 스테레오 깊이 추정(RAFT-Stereo), 장면 흐름 등 대응 문제 전반이 같은 구조를 재사용',
 '**반복 정제라는 발상의 재확인** — 픽셀 단위 dense 예측에서 "고정 해상도 + 반복 갱신"이 "coarse-to-fine"을 대체할 수 있음을 보여, [Depth Anything](#/p/depth-anything) 등 이후 dense 예측 연구에도 참고가 됨',
 '**비디오 기반 파운데이션 모델의 부품화** — RAFT 자체가 이후 여러 비디오 이해·3D 재구성 파이프라인에서 흐름 추정 모듈로 그대로 재사용됨',
 '**학습 효율에 대한 재평가** — 10배 적은 반복으로 SOTA를 낸 사례가, 아키텍처가 데이터 효율에도 영향을 준다는 인식을 강화'
],

pitfalls:[
 '**4D 상관 볼륨은 메모리를 많이 먹는다.** 해상도가 커질수록 $H \\times W \\times H \\times W$ 로 제곱에 가깝게 늘어나, 고해상도 영상에서는 별도의 근사·타일링 기법 없이는 그대로 적용하기 어렵다.',
 '**"10 FPS 실시간"은 특정 GPU·해상도 기준이다.** 1080Ti·1088×436 조건이며, 반복 횟수를 늘리면 정확도는 오르지만 속도는 그만큼 떨어지는 트레이드오프가 있다.',
 '**GRU 갱신이 항상 고정점에 수렴한다는 보장은 없다.** 학습으로 수렴을 유도할 뿐 이론적 수렴 증명은 없으며, 반복 횟수를 늘려도 성능 향상이 포화되는 지점이 존재한다(원문 ablation).'
],

figures:[
 {f:'fig1-overview.png',
  cap:'왼쪽부터: 두 프레임을 특징 인코더(공유 가중치)에 통과시켜 4D 상관 볼륨을 만들고, 프레임 1만 별도로 문맥 인코더에 통과시킨다. 가운데 0에서 시작한 흐름이 GRU(L) 반복을 거치며 오른쪽 Optical Flow로 수렴한다. "10+ iter."라고 적힌 부분이 같은 가중치를 계속 재사용하는 지점.',
  src:'원문 Figure 1, p.2'},
 {f:'fig2-correlation.png',
  cap:'왼쪽 두 이미지의 화살표는 Image 1의 한 픽셀이 Image 2의 모든 픽셀과 비교된다는 뜻. 오른쪽 세 격자 $C^1, C^2, C^3$ 는 그 비교 결과(4D 볼륨)를 커널 1·2·4로 풀링해 해상도를 낮춘 것 — 격자가 성글어질수록 더 먼 거리의 변위를 담당한다.',
  src:'원문 Figure 2, p.6'}
],

quotes:[
 {t:'We introduce Recurrent All-Pairs Field Transforms (RAFT), a new deep network architecture for optical flow.',
  src:'Abstract, p.1'},
 {t:'RAFT processes 1088×436 videos at 10 frames per second on a 1080Ti GPU. It trains with 10X fewer iterations than other architectures.',
  src:'Section 1, p.2'}
],

links:[
 {t:'arXiv 2003.12039 — RAFT: Recurrent All-Pairs Field Transforms for Optical Flow', u:'https://arxiv.org/abs/2003.12039'},
 {t:'princeton-vl/RAFT (공식 코드)', u:'https://github.com/princeton-vl/RAFT'}
]
});
