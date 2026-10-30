WIKI.paper({
slug:'ocsort',
venue:'CVPR 2023 (arXiv 2022)',
authors:'Cao et al. (CMU · Shanghai AI Lab · Nvidia)',
arxiv:'2203.14360',

tldr:'[SORT](#/p/sort)의 칼만 필터를 그대로 두고, 가려진 동안 쌓인 오차를 **검출 관측값으로 만든 가상 궤적**으로 되돌려 고치는 모션 기반 트래커. 비선형 움직임과 가려짐이 심한 [DanceTrack](#/p/dancetrack)에서 HOTA 54.6으로 [ByteTrack](#/p/bytetrack)의 47.3을 크게 앞섰고, 검출 결과만 주어지면 CPU 한 코어로 793 FPS가 나온다.',

context:'칼만 필터 기반 트래커는 물체가 일정한 속도로 움직인다고 가정하며, 프레임 간격이 짧으면 이 가정이 대체로 통한다. 하지만 관측이 없는 프레임에서는 [SORT](#/p/sort)가 예측값을 그대로 사후 상태로 쓰는 "dummy update"를 하므로 오차가 시간에 따라 증폭된다. 논문의 분석에 따르면 속도 추정 잡음이 $\\mathcal N(0,2\\sigma^2)$ 일 때 $T$ 프레임 가려진 뒤 위치 잡음은 $\\mathcal N(0,2T^2\\sigma^2)$ 이다. MOT17의 근접 보행자는 약 50×300 픽셀인데 위치 분산이 1픽셀이라도 10프레임 가려지면 위치 어긋남이 물체 크기만큼 커질 수 있다. 저자들은 이를 "estimation-centric"한 설계의 문제로 보고, 관측(검출기 출력)을 중심에 놓는 방향으로 고친다.',

ideas:[
 {h:'SORT의 세 가지 한계',
  lead:'높은 프레임레이트의 잡음 민감성, 가려진 동안의 오차 증폭, 예측 중심 설계가 서로 얽혀 있다.',
  d:'프레임 간 물체 이동이 작은 영상에서는 변위 잡음이 실제 변위와 비슷한 크기가 되어 칼만 필터의 속도 추정이 흔들린다. 관측이 없으면 갱신 없이 예측을 이어가므로 오차가 $T^2$ 로 커진다. 반면 검출기의 관측 잡음은 프레임마다 독립이어서 시간에 따라 쌓이지 않으며, 보통 상태 추정의 잡음보다 작다. 그래서 관측을 우선하는 쪽이 낫다는 것이 이 논문의 출발점이다.'},
 {h:'ORU: 가상 궤적으로 칼만 필터를 다시 갱신',
  lead:'놓쳤던 트랙이 다시 매칭되면 마지막 관측과 새 관측을 이은 가상 궤적으로 그 구간을 재갱신한다.',
  d:'가려졌던 트랙이 재활성되면 마지막 관측 $z_{t_1}$ 과 재연결 관측 $z_{t_2}$ 사이를 가상 궤적 $\\tilde z_t$ 로 채운다. 그 궤적을 "관측"으로 삼아 예측과 re-update를 $t_1<t<t_2$ 구간에서 반복해 칼만 상태와 공분산을 바로잡는다. 구현에서는 등속 가정으로 선형 보간한 궤적을 쓴다. 칼만 루프 바깥에서, 재활성 때에만 실행되는 독립 단계다.'},
 {h:'OCM: 관측 기반 이동 방향 일관성',
  lead:'관측점 사이의 방향으로 구한 이동 방향이 트랙과 검출 사이에서 일치하는지를 비용에 더한다.',
  d:'트랙의 관측 두 점을 이은 방향 $\\theta^{track}$ 과 트랙의 과거 관측에서 새 검출로 이은 방향 $\\theta^{intention}$ 의 차이 $\\Delta\\theta$ 를 비용에 더한다. 방향은 추정 상태가 아니라 관측점에서 구한다. 두 관측점의 시간 차 $\\Delta t$ 는 클수록 방향 잡음이 줄지만 선형 가정이 깨지는 트레이드오프라서 구현에서는 $\\Delta t=3$ 으로 둔다.'},
 {h:'OCR: 마지막 관측으로 한 번 더 연결 시도',
  lead:'일반 연관 뒤 남은 트랙의 마지막 관측과 남은 검출을 한 번 더 매칭한다.',
  d:'멈추거나 짧게 가려진 물체는 칼만 예측이 이미 빗나가서 매칭에 실패하기 쉽다. 이 경우 예측 상자 대신 마지막으로 본 관측 상자를 기준으로 2차 연관을 한다. 저자들은 이를 경험적으로 도움이 되는 휴리스틱이라고 소개한다.'}
],

diagram:{type:'flow', cap:'OC-SORT 프레임 처리. 속도 일관성 비용(OCM)으로 연관하고, 남은 것은 마지막 관측으로 재시도(OCR)하며, 재연결되면 ORU가 가려진 구간의 칼만 상태를 고친다.',
 nodes:[
  {t:'칼만 예측', s:'상태 추정'},
  {t:'IoU+OCM 연관', s:'IoU + λ·방향 차이', acc:true},
  {t:'OCR 재시도', s:'마지막 관측 기준'},
  {t:'ORU 재갱신', s:'가상 궤적으로', acc:true},
  {t:'트랙 갱신', s:'생성/삭제'}
 ]},

math:[
 {expr:'C(X̂, Z) = C_IoU(X̂, Z) + λ · C_v(𝒵, Z)',
  tex:'C(\\hat X,Z)=C_{\\mathrm{IoU}}(\\hat X,Z)+\\lambda\\,C_v(\\mathcal Z,Z)',
  d:'연관 비용. $C_{IoU}$ 는 음의 IoU, $C_v$ 는 모든 쌍의 방향 차 $\\Delta\\theta=|\\theta^{track}-\\theta^{intention}|$ 이다. 구현에서는 $\\lambda=0.2$, 방향은 $\\theta=\\arctan\\frac{v_1-v_2}{u_1-u_2}$ (라디안)로 계산한다.'},
 {expr:'z̃_t = z_t1 + (t−t1)/(t2−t1)·(z_t2 − z_t1),  t1 < t < t2',
  tex:'\\tilde z_t=z_{t_1}+\\frac{t-t_1}{t_2-t_1}\\,(z_{t_2}-z_{t_1}),\\quad t_1<t<t_2',
  d:'ORU의 가상 궤적(등속 가정). 이 $\\tilde z_t$ 를 관측으로 삼아 $K_t=P_{t|t-1}H_t^\\top(H_tP_{t|t-1}H_t^\\top+R_t)^{-1}$, $\\hat x_{t|t}=\\hat x_{t|t-1}+K_t(\\tilde z_t-H_t\\hat x_{t|t-1})$ 로 재갱신한다.'}
],

numbers:[
 {k:'DanceTrack test · OC-SORT HOTA/AssA/IDF1', v:'54.6 / 40.2 / 54.6', d:'선형 보간을 더하면 HOTA 55.1. 같은 표 ByteTrack은 47.3/31.4/52.5'},
 {k:'MOT17 test · OC-SORT HOTA/MOTA/IDF1', v:'63.2 / 78.0 / 77.5', d:'private detection. ByteTrack(63.1/80.3/77.3)과 같은 검출을 쓴 비교. IDs 1,950 대 2,196'},
 {k:'MOT20 test · OC-SORT HOTA/MOTA/IDF1', v:'62.1 / 75.5 / 75.9', d:'혼잡한 장면에서 HOTA +0.8 (ByteTrack 61.3), IDs 913 대 1,223. MOTA는 ByteTrack(77.8)보다 낮다'},
 {k:'MOT17 val 구성요소 누적 (HOTA/AssA/IDF1)', v:'64.9/66.8/76.9 → 66.5/68.9/77.7', d:'Table 5. 기준(SORT식)에서 ORU+OCM+OCR까지. 가장 큰 증가는 ORU(+1.4 HOTA)'},
 {k:'DanceTrack val 구성요소 누적 (HOTA/AssA/IDF1)', v:'47.8/31.0/48.3 → 52.1/35.3/51.6', d:'Table 5. ORU만 넣으면 48.5, OCM까지 넣으면 52.1로 OCM이 비선형 움직임에서 크게 기여'},
 {k:'속도', v:'793 FPS (CPU 한 코어)', d:'검출 결과를 입력으로 받는 트래커 부분만 측정. Intel i9-9980XE'}
],

impact:'OC-SORT는 외형 모델이나 학습 없이 SORT의 모션 모델만 고쳐서 DanceTrack처럼 외형이 비슷하고 움직임이 비선형인 데이터에서 큰 격차를 만들었다. 가려짐 동안의 오차 증폭을 식으로 분석한 뒤 각 요소를 그 분석에 맞춰 설계한 점에서, 이후 모션 기반 트래커의 비교 기준이 되었다. 연산이 가벼워 검출기 추론 시간에 비하면 트래킹 비용이 거의 들지 않는다.',

legacy:[
 '**[SORT](#/p/sort)의 칼만 필터를 보존하면서 관측 중심으로 고친 직계 개선** — 구조와 연산량은 그대로 유지',
 '**[Deep OC-SORT](#/p/deepocsort)가 같은 저자 그룹에서 OC-SORT에 적응적 ReID와 카메라 보정을 추가**',
 '**[Hybrid-SORT](#/p/hybridsort)가 OC-SORT를 기준선으로 신뢰도·높이 같은 약한 단서를 더 얹음**',
 '**[DanceTrack](#/p/dancetrack) 계열 비교표에서 모션 기반 기준선으로 자리잡음** — ByteTrack과 나란히 인용되는 두 축'
],

pitfalls:[
 '**OC-SORT의 이득은 DanceTrack처럼 비선형 움직임이 많은 데이터에서 크고, MOT17/20에서는 작다.** MOT17 test HOTA 63.2 대 63.1이고 MOTA는 ByteTrack보다 낮다. 저자들도 ByteTrack처럼 저신뢰 검출을 더 쓰거나 적응적 임계값을 쓰지 않았다고 밝힌다.',
 '**IoU만 쓰는 연관이라 물체가 빠르거나 프레임 간 겹침이 0에 가까우면 실패한다.** 논문은 이것이 OC-SORT 구조의 본질적 약점이 아니라 IoU 선택에서 나온다고 설명하며, 외형 같은 다른 단서를 추가하라고 제안한다.',
 '**ORU의 가상 궤적은 등속(선형) 가정이다.** 논문의 Table 6에서 GPR이나 선형회귀 같은 더 복잡한 가상 궤적은 MOT17 val HOTA가 63.1, 64.3으로 등속(66.5)보다 낮았다.'
],

figures:[
 {f:'fig2-pipeline.png',
  cap:'DanceTrack 장면 세 프레임. 파란색 큰 화살표가 OCM 연관, 연한 파란색이 OCR, 초록이 칼만 예측, 보라색이 ORU다. 3번 무용수가 t+1에서 가려져 잃어버렸다가 t+2에서 t의 관측으로 다시 찾으면 ORU가 t부터 t+2까지의 칼만 파라미터를 고친다.',
  src:'원문 Figure 2, p.4'},
 {f:'fig4-ocm-direction.png',
  cap:'초록 점이 트랙의 과거 관측이고 빨간 점이 새 검출 후보다. 노란 선은 트랙 자체의 이동 방향이고 파란 선은 트랙에서 후보 검출로 가는 방향이다. 이 두 선의 각도 차 Δθ가 클수록 비용이 커진다.',
  src:'원문 Figure 4, p.5'}
],

quotes:[
 {t:'In this work, we show that a basic Kalman filter can still obtain state-of-the-art tracking performance if proper care is taken to fix the noise accumulated during occlusion.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2203.14360 — OC-SORT', u:'https://arxiv.org/abs/2203.14360'},
 {t:'GitHub — noahcao/OC_SORT', u:'https://github.com/noahcao/OC_SORT'}
]
});
