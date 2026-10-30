WIKI.paper({
slug:'ab3dmot',
venue:'arXiv 2020 (4쪽 요약본)',
authors:'Weng, Wang, Held, Kitani (CMU Robotics Institute)',
arxiv:'2008.08063',

tldr:'LiDAR 3D 검출 결과 위에 **3D 칼만 필터(등속 모델) + 헝가리안 알고리즘**만 얹은 3D 다중 객체 추적 기준선. 알고리즘 혁신이 아니라 가장 기본적인 구성이 얼마나 강한지를 보이는 것이 목적이며, KITTI 에서 207.4 FPS 로 돌면서 경쟁 3D 추적기를 앞섰다. 3D 공간에서 직접 재는 평가 도구와 새 지표(sAMOTA·AMOTA·AMOTP)도 함께 제안한다.',

context:'3D MOT 은 자율주행에 필수지만 당시 연구는 정확도 경쟁에 치우쳐 계산량과 시스템 복잡도를 소홀히 했다. 저자들은 KITTI 2D MOT 리더보드에서 MOTA 가 2년 만에 57.03 에서 84.04 로 올랐지만 최고 성능 방법들이 큰 계산 비용을 요구해 실시간이 어렵고, 어느 부품이 성능을 만드는지도 불분명하다고 본다. 게다가 KITTI 같은 표준 벤치마크는 2D 이미지 평면 평가만 지원해서, 3D 추적 결과를 이미지에 투영해 2D 도구로 채점하는 관행이 3D 방법의 강점을 가린다고 지적한다. 이 논문은 [SORT](#/p/sort) 식 칼만+헝가리안 조합을 3D 로 옮긴 단순 기준선과, 3D 평가 도구를 함께 내놓는다.'

,ideas:[
 {h:'3D 상태공간의 칼만 필터',
  lead:'칼만 필터의 상태를 이미지 평면이 아니라 3D 위치·크기·속도·방향으로 정의한다.',
  d:'다른 필터 기반 MOT 가 이미지 평면에서 상태를 정의하는 것과 달리, 이 시스템은 3D 위치, 3D 크기, 3D 속도, 방향을 상태에 넣는다. 모션 모델은 등속(constant velocity)이다. 입력은 LiDAR 점군에서 얻은 3D 검출이고, 실험에서는 PointRCNN 검출을 쓴다.'},
 {h:'헝가리안 연결과 생성·소멸 메모리',
  lead:'예측 트랙과 검출을 헝가리안으로 매칭하고, 미매칭은 새 트랙(birth)·소멸(death)로 처리한다.',
  d:'프레임마다 칼만 예측 $T_{est}$ 와 검출 $D_t$ 를 연결해 매칭 쌍 $D_{match}/T_{match}$ 로 필터를 갱신한다. 매칭되지 않은 트랙은 $T_{unmatch}$, 검출은 $D_{unmatch}$ 로 남아 "Birth and Death Memory" 모듈이 새 트랙 $T_{new}$ 와 소멸 트랙 $T_{lost}$ 를 정한다(Fig. 1). 이 4쪽 요약본에는 이 모듈의 구체적 임계값이나 연결 비용 정의가 적혀 있지 않다.'},
 {h:'3D 공간 평가 도구',
  lead:'KITTI 2D 평가 도구의 비용 함수를 2D IoU 에서 3D IoU 로 바꿔 3D 정답과 직접 비교한다.',
  d:'지금까지의 관행은 3D 추적 결과를 이미지 평면에 투영해 2D 도구로 채점하는 것이었다. 이 논문은 비용 함수를 3D IoU 로 바꿔 3D 정답 궤적과 바로 매칭하며, 추적 객체는 정답과 3D IoU 0.25 이상이어야 성공한 매칭으로 친다. 저자들도 이것이 2D 도구의 단순한 확장이라고 인정한다.'},
 {h:'신뢰도 임계값에 의존하지 않는 지표',
  lead:'recall 40개 지점에서 MOTA·MOTP 를 평균해 sAMOTA·AMOTA·AMOTP 로 요약한다.',
  d:'MOTA·MOTP 는 추적 객체의 신뢰도를 고려하지 않아 사용자가 임계값을 골라야 하고, 한 임계값에서 높은 MOTA 가 다른 임계값에서는 매우 낮을 수 있다. AMOTA·AMOTP 는 recall 전 구간을 이산 40개 점의 합으로 근사해 적분하고, sAMOTA 는 AMOTA 값의 범위를 0~100% 로 맞추도록 조정한 것이다. 평균 정밀도(AP)처럼 신뢰도에 강건한 3D MOT 를 장려하자는 취지다.'}
],

diagram:{type:'flow', cap:'AB3DMOT 파이프라인. 3D 검출기가 낸 박스를 칼만 예측과 헝가리안으로 연결하고, 미매칭을 생성·소멸 메모리가 처리한다.',
 nodes:[
  {t:'3D 객체 검출', s:'LiDAR 점군', a:'D(t)'},
  {t:'3D 칼만 필터', s:'등속 모델', acc:true, a:'T_est'},
  {t:'헝가리안 연결', s:'예측 × 검출'},
  {t:'생성·소멸', s:'T_new / T_lost'}
 ]},

math:[
 {expr:'match(pred, gt) iff IoU_3D(pred, gt) ≥ 0.25',
  tex:'\\text{match}(b,\\,g)\\iff \\mathrm{IoU}_{3D}(b,\\,g)\\ge 0.25',
  d:'3D 평가 도구의 성공 매칭 기준이다. KITTI 2D 도구의 2D IoU 비용을 3D IoU 로 바꾼 것으로, 이 임계값 0.25 는 이 논문의 실험 설정이다.'}
],

numbers:[
 {k:'3D MOT 지표 (KITTI val, 자동차)', v:'sAMOTA 93.28 / AMOTA 45.43', d:'Table 1, 3D 평가 도구. mmMOT 70.61 / 33.08, FANTrack 82.97 / 40.03'},
 {k:'MOTA / MOTP (같은 표)', v:'86.24 / 78.43', d:'mmMOT 74.07 / 78.16, FANTrack 74.30 / 75.24'},
 {k:'ID 스위치 / FRAG', v:'0 / 15', d:'Table 1. mmMOT 10 / 125, FANTrack 35 / 202'},
 {k:'속도', v:'207.4 FPS', d:'Table 1, 3D 검출기를 제외한 추적 부분, GPU 없이. mmMOT 4.8, FANTrack 25.0'},
 {k:'AMOTP (같은 표)', v:'77.41', d:'Table 1. mmMOT 72.45, FANTrack 75.01. AMOTP 는 높을수록 좋은 것으로 표기됨'}
],

impact:'복잡한 모델이 아니라 [SORT](#/p/sort) 식 칼만 필터 + 헝가리안을 3D 로 옮긴 것이 강한 기준선이 된다는 점을 보여, 3D MOT 연구에 "먼저 단순 기준선과 비교하라"는 압력을 만들었다. 입력으로 2D 정보를 전혀 쓰지 않았는데도 투영 평가에서 경쟁력이 있었고, 저자들은 3D 에서 깊이 모호성이 해결되어 오매칭이 줄었기 때문이라고 가설을 세웠다(검증한 것은 아니다). [CenterTrack](#/p/centertrack) 도 KITTI 표와 nuScenes 단안 3D baseline 에서 AB3D 를 비교 대상으로 삼았다.',

legacy:[
 '**[CenterTrack](#/p/centertrack)** — KITTI 테스트 표(Table 2)에 AB3D 를 83.84 MOTA 로 올리고, nuScenes 단안 baseline(Mapillary+AB3D)으로 삼음',
 '**[SORT](#/p/sort) 계보의 3D 확장** — 칼만+헝가리안의 역할 분리를 LiDAR 3D 박스 위로 옮긴 레퍼런스 구현',
 '**3D 추적 평가의 표준화 시도** — 3D IoU 기반 평가 도구와 AMOTA 계열 지표를 제안'
],

pitfalls:[
 '**arXiv 판은 4쪽 요약본이다.** 상태 벡터 차원, 연결 비용 정의, 생성·소멸 임계값 같은 구현 세부는 이 판에 없다. 세부를 알려면 공개 코드를 봐야 하고, 이 노트도 그 부분은 서술하지 않았다.',
 '**검출기 품질에 종속된다.** 이 시스템은 3D 검출을 그대로 받아 연결만 하며, 비교 표의 세 방법은 모두 같은 PointRCNN 검출을 입력으로 쓴다(2D 입력이 필요한 baseline 은 3D 검출을 투영해 사용). 다른 검출기 결과와 직접 비교하면 안 된다.',
 '**평가 조건이 다르다.** Table 1 은 KITTI 검증셋에서 3D IoU 0.25 기준으로 잰 값이고, 리더보드의 84.04 같은 수치는 이미지 평면 2D 평가다. 둘을 같은 축에 놓고 비교하면 안 된다. FPS 도 검출 시간을 뺀 값이다.'
],

figures:[
 {f:'fig1-pipeline.png',
  cap:'3D 검출기가 낸 박스 $D_t$ 와 3D 칼만 필터의 예측 $T_{est}$ 를 헝가리안으로 연결하고, 매칭은 필터 갱신으로, 미매칭은 오른쪽 생성·소멸 메모리로 간다. 위쪽 화살표가 갱신된 궤적을 다음 프레임으로 되돌린다.',
  src:'원문 Figure 1(오른쪽), p.2'}
],

quotes:[
 {t:'To be clear, the contribution of this work is not to innovate 3D MOT algorithms but to provide a more clear picture of modern 3D MOT systems in comparison to a most basic yet strong baseline',
  src:'Section 2, p.2'}
],

links:[
 {t:'arXiv 2008.08063 — AB3DMOT', u:'https://arxiv.org/abs/2008.08063'},
 {t:'공식 코드 (xinshuoweng/AB3DMOT)', u:'https://github.com/xinshuoweng/AB3DMOT'}
]
});
