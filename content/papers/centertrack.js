WIKI.paper({
slug:'centertrack',
venue:'ECCV 2020',
authors:'Zhou, Koltun, Krähenbühl (UT Austin · Intel Labs)',
arxiv:'2004.01177',

tldr:'물체를 박스가 아니라 **중심점 하나**로 보고, 점을 시간축으로 따라가는 검출-추적 동시 모델. [CenterNet](#/p/centernet) 에 이전 프레임과 이전 트랙의 점 히트맵을 입력으로 주고 이전 프레임으로의 변위(offset)를 함께 예측하게 해, 단순 탐욕 매칭만으로 연결한다.',

context:'tracking-by-detection 은 검출 뒤에 [SORT](#/p/sort) 의 칼만 필터·헝가리안이나 [DeepSORT](#/p/deepsort) 의 외형 특징으로 연결하며, 검출과 연결이 분리돼 있다. [Tracktor](#/p/tracktor) 같은 동시 검출·추적은 Faster R-CNN 의 박스 제안으로 이전 박스를 쓰므로, 프레임 사이에 박스가 많이 겹쳐야 한다. 그래서 저프레임율 영상에서는 별도 모션 모델이 필요하다고 저자들은 지적한다. CenterTrack 은 이전 정보를 박스가 아니라 점 히트맵으로 주어, 박스가 전혀 겹치지 않아도 수용 영역 안이면 물체를 맞출 수 있게 한다.',

ideas:[
 {h:'이전 트랙을 점 히트맵으로 입력',
  lead:'이전 프레임의 두 이미지와 트랙 중심점 히트맵을 CenterNet 입력 채널로 더한다.',
  d:'현재 프레임 $I^{(t)}$, 이전 프레임 $I^{(t-1)}$, 그리고 신뢰도 $\\tau$ 이상인 이전 트랙 중심을 가우시안으로 렌더한 클래스 무관 단일 채널 히트맵을 입력으로 쓴다. 구조는 CenterNet 과 거의 같고 입력 채널 4개(이미지 3개 + 히트맵 1개)와 출력 채널 2개(변위)만 늘어난다. 덕분에 사전학습된 CenterNet 으로 초기화한다.'},
 {h:'중심 오프셋으로 연결',
  lead:'각 검출이 이전 프레임의 자기 중심 위치까지의 2D 변위를 직접 예측한다.',
  d:'출력 맵에 변위 $\\hat D^{(t)}$ 를 추가해 $\\hat d=\\hat p^{(t)}-\\hat p^{(t-1)}$ 을 회귀한다. 연결은 신뢰도 순으로 각 검출을 $\\hat p-\\hat D_{\\hat p}$ 에서 가장 가까운 미매칭 이전 검출에 붙이고, 반경 $\\kappa$ 안에 없으면 새 트랙을 만든다. $\\kappa$ 는 예측 박스 너비·높이의 기하평균이다. 헝가리안으로 바꿔도 이득이 없었다(Table 5).'},
 {h:'학습 시 노이즈 히트맵 시뮬레이션',
  lead:'정답 트랙 대신 흔들고 지우고 끼워 넣은 히트맵을 입력해, 이전 프레임을 베끼는 지름길을 막는다.',
  d:'정답 히트맵을 그대로 주면 모델이 이전 예측을 복사하는 쪽으로 학습된다. 이를 막으려 이전 중심에 가우시안 지터($\\lambda_{jt}=0.05$)를 주고, 확률 $\\lambda_{fp}$ 로 가짜 점을 넣고, 확률 $\\lambda_{fn}$ 으로 점을 지운다. 이 노이즈를 빼면 MOT17 검증 MOTA 가 66.1 에서 34.4 로 무너진다(Table 5).'},
 {h:'정지 이미지로도 학습',
  lead:'현재 이미지를 무작위로 스케일·이동해 이전 프레임을 흉내 내면 비디오 라벨이 없어도 된다.',
  d:'검출 데이터셋의 한 장에서 확대·이동으로 "이전 프레임"을 합성해 오프셋 학습 신호를 만든다. MOT17 에서는 정지 이미지 학습이 비디오 학습과 같은 MOTA(66.1)를 냈다. 반면 프레임율이 낮은 nuScenes 에서는 덜 효과적이었다고 저자들이 적는다.'},
 {h:'순수하게 국소적인 온라인 추적',
  lead:'인접 프레임만 연결하고 긴 공백의 재연결은 하지 않아 단순·고속을 얻는다.',
  d:'사라졌다 다시 나타난 물체에는 새 ID 가 붙는다. 이 한계는 IDF1 과 ID 스위치에서 오프라인 방법 LSST17 보다 약한 것으로 드러난다. MOT17 테스트에서는 비활성 트랙을 K=32 프레임 보관하는 rebirth 를 쓴다. 같은 구조를 3D 속성 회귀로 확장해 nuScenes 단안 3D 추적에도 적용했다.'}
],

diagram:{type:'flow', cap:'CenterTrack 한 프레임 처리. 현재·이전 이미지와 이전 트랙 히트맵을 넣고, 검출과 변위를 한 번에 낸 뒤 탐욕 매칭으로 ID 를 잇는다.',
 nodes:[
  {t:'입력', s:'I(t), I(t-1), 히트맵'},
  {t:'CenterNet 변형', s:'채널 4개 추가', acc:true},
  {t:'출력 맵', s:'중심 · 크기 · 변위'},
  {t:'탐욕 매칭', s:'p̂ − D̂ 와 거리'}
 ]},

math:[
 {expr:'L_off = (1/N) Σ_i | D̂_{p_i(t)} − (p_i(t−1) − p_i(t)) |',
  tex:'L_{off}=\\frac{1}{N}\\sum_{i=1}^{N}\\left|\\hat D^{(t)}_{p_i^{(t)}}-\\left(p_i^{(t-1)}-p_i^{(t)}\\right)\\right|',
  d:'정답 중심의 프레임 간 이동을 L1 로 회귀한다. 크기·국소 위치 회귀와 같은 방식이라 추가 비용이 거의 없고, CenterNet 의 focal·size·loc 손실에 더해 멀티태스크로 학습한다.'},
 {expr:'match(p̂) = argmin_{unmatched q} || (p̂ − D̂_p̂) − q ||  if < κ',
  tex:'\\hat p \\mapsto \\arg\\min_{q\\in T^{(t-1)}}\\left\\|(\\hat p-\\hat D_{\\hat p})-q\\right\\|\\ \\ \\text{if}\\ \\ <\\kappa',
  d:'변위만큼 되돌린 위치와 가장 가까운 이전 트랙을 잇는다. 거리 기준 $\\kappa$ 가 박스 크기에 비례하므로 별도 비용 행렬이 필요 없다.'}
],

numbers:[
 {k:'MOT17 테스트, 공개 검출', v:'MOTA 61.5', d:'Table 1. Tracktor v2 는 56.5, GMOT 55.4, LSST17 54.7'},
 {k:'MOT17 테스트, private 검출', v:'MOTA 67.8 / IDF1 64.7', d:'Table 1. 속도 57ms (leaderboard 의 Hz 열 기준)'},
 {k:'KITTI 테스트 (자동차)', v:'MOTA 89.44', d:'Table 2. 비교한 공개 결과 중 최고였고 MASS 85.04, MOTSFusion 84.83 등이 뒤를 이음, 82ms'},
 {k:'nuScenes 테스트 (단안 3D)', v:'AMOTA@0.2 27.8', d:'Table 3. 단안 baseline(Mapillary+AB3D) 6.9, 45ms'},
 {k:'MOT17 검증 ablation', v:'MOTA 63.6 → 66.1', d:'Table 4. detection only 에서 히트맵+오프셋을 더했을 때. 오프셋을 빼면 nuScenes AMOTA@0.2 가 28.3 → 17.8 로 크게 떨어진다'}
],

impact:'점 하나를 추적 단위로 삼아 검출과 추적을 한 네트워크의 출력으로 합치고, 연결 비용을 "변위 한 번 예측 + 거리 매칭"으로 줄였다. 이전 프레임을 입력으로 조건화하는 아이디어는 이후 [TransTrack](#/p/transtrack) 이 CenterTrack 을 계승해 object query 로 옮긴 흐름의 출발점이 됐다. 또 정지 이미지 학습으로 비디오 라벨 의존도를 낮췄고, 2D MOT·KITTI·nuScenes 3D 추적을 같은 틀로 다뤘다.',

legacy:[
 '**[FairMOT](#/p/fairmot)** — CenterNet 의 중심점 표현을 가져오되, 이전 프레임 조건화 대신 re-ID 임베딩으로 장기 연결을 함',
 '**[TransTrack](#/p/transtrack)** — CenterTrack 이전 프레임 조건화 흐름을 계승해 쿼리 기반 Transformer 추적으로 확장',
 '**점 기반 추적 변형** — 중심점 + 변위 예측은 이후 점 기반 3D 추적기에서도 재사용됨(예: [CenterPoint](#/p/centerpoint) 도 중심점에서 속도를 예측해 최근접 점으로 연결)'
],

pitfalls:[
 '**논문 안에서 숫자가 어긋난다.** 초록은 MOT17 67.8 MOTA 22 FPS, nuScenes 28.3 AMOTA@0.2 라고 쓰지만, §5.4 본문은 67.3 MOTA 17 FPS 라 하고 Table 1 은 67.8·57ms, Table 3(테스트)은 nuScenes 27.8 이다. 28.3 은 검증셋(Table 4) 값이다. 인용할 때는 어느 표인지 확인해야 한다.',
 '**MOT17 은 공개 검출 설정과 private 설정이 섞여 있다.** 61.5 는 공개 검출 버전이고 67.8 은 CenterTrack 이 직접 검출하는 private 버전이다. ablation 은 private 설정에서 한다.',
 '**장기 가림에는 약하다.** 인접 프레임만 연결하므로 가림 뒤 재등장은 새 ID 가 되고, rebirth(K=32)를 붙여도 IDF1·ID 스위치에서는 오프라인 LSST17 보다 못하다. 같은 이유로 MOT17 에서는 모션 모델 종류가 큰 차이를 내지 않았지만(Table 6) 저프레임율 KITTI·nuScenes 에서는 오프셋의 효과가 컸다.'
],

figures:[
 {f:'fig2-framework.png',
  cap:'왼쪽 세 칸이 입력(현재 프레임, 이전 프레임, 이전 트랙의 점 히트맵), 오른쪽 세 칸이 출력(검출 히트맵, 크기 맵, 이전 위치를 가리키는 오프셋 화살표)이다. 입력의 히트맵과 출력의 오프셋 사이에 연결이 이뤄진다.',
  src:'원문 Figure 2, p.5'}
],

quotes:[
 {t:'Given this minimal input, CenterTrack localizes objects and predicts their associations with the previous frame.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2004.01177 — Tracking Objects as Points', u:'https://arxiv.org/abs/2004.01177'},
 {t:'공식 코드 (xingyizhou/CenterTrack)', u:'https://github.com/xingyizhou/CenterTrack'}
]
});
