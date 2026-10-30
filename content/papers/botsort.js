WIKI.paper({
slug:'botsort',
venue:'arXiv 2022',
authors:'Aharon, Orfaig, Bobrovsky (Tel-Aviv University)',
arxiv:'2206.14651',

tldr:'[ByteTrack](#/p/bytetrack) 위에 세 가지를 얹은 "MOT 요령 모음". 칼만 상태 벡터를 너비·높이 직접 추정으로 바꾸고, 카메라 모션 보정(CMC)으로 예측 상자를 옮기고, IoU 거리와 ReID 코사인 거리를 element-wise **min** 으로 융합한다. MOT17 test에서 MOTA 80.5·IDF1 80.2·HOTA 65.0(BoT-SORT-ReID)을 냈다.',

context:'SORT 계열 트래커는 칼만 필터가 예측한 상자와 검출 상자의 겹침(IoU)에 크게 기댄다. 그런데 카메라가 움직이면 화면 속 물체 위치가 통째로 밀려 예측 상자와 실제 검출의 IoU가 급락하고, ID switch나 놓침이 늘어난다. [DeepSORT](#/p/deepsort) 이후의 칼만 상태는 종횡비 $a$ 와 높이 $h$ 를 추정하는데, 저자들은 이 때문에 상자 너비가 부정확해진다고 본다. 또 IoU는 MOTA에, ReID 외형 거리는 IDF1에 유리해서 둘을 단순 가중합하면 서로의 약점이 섞이는 trade-off가 있었다. 저자들은 이 세 문제를 각각 고쳐 [ByteTrack](#/p/bytetrack)의 2단계 연관 구조에 이식한다.',

ideas:[
 {h:'칼만 상태 벡터: 종횡비 대신 너비·높이',
  lead:'상태를 $[x_c,y_c,w,h,\\dot x_c,\\dot y_c,\\dot w,\\dot h]$ 8차원으로 바꿔 박스 너비를 직접 추정한다.',
  d:'SORT의 상태는 7차원 $[x_c,y_c,s,a,\\dot x_c,\\dot y_c,\\dot s]$(면적 $s$, 종횡비 $a$)이고, DeepSORT 이후는 8차원 $[x_c,y_c,a,h,\\dot x_c,\\dot y_c,\\dot a,\\dot h]$ 이었다. BoT-SORT는 $w$ 와 $h$ 를 그대로 상태에 넣고 측정 벡터도 $[x_c,y_c,w,h]$ 로 둔다. 잡음 공분산 $Q_k$, $R_k$ 도 상태에 맞춰 $w$, $h$ 의 크기에 비례하는 대각 행렬로 고쳤다. 저자들은 HOTA가 오르는 정확한 이유는 모르겠고, 예측 상자의 너비가 물체에 더 잘 맞기 때문일 것이라고 추정한다.'},
 {h:'카메라 모션 보정: 아핀 변환으로 상태와 공분산을 옮긴다',
  lead:'배경 특징점의 희소 광류로 프레임 간 아핀 행렬을 구하고 칼만 예측값에 적용한다.',
  d:'OpenCV 비디오 안정화 모듈의 GMC 방식을 쓴다. 키포인트를 뽑고 희소 광류로 추적한 뒤 RANSAC으로 $A_{k-1}^k\\in\\mathbb R^{2\\times3}$ 을 푼다. 희소 방식이라 검출 상자 안의 점을 제외할 수 있어 움직이는 물체가 아닌 배경 움직임만 추정할 수 있다. 이 행렬의 회전·스케일 부분 $M$ 과 이동 부분 $T$ 로 예측 상태 $\\hat x$ 와 공분산 $P$ 를 변환한 뒤 그것으로 칼만 갱신을 한다. 이동은 중심 좌표에만, $M$ 은 속도 항까지 상태 전체에 영향을 준다.'},
 {h:'IoU–ReID 융합: 거리의 element-wise min',
  lead:'멀거나 외형이 다른 후보는 먼저 버리고, 남은 쌍은 IoU 거리와 코사인 거리 중 작은 값을 비용으로 쓴다.',
  d:'BoT(SBS, ResNeSt50 백본)를 FastReID로 학습한 ReID 특징을 쓰고, 트랙릿의 외형 상태는 EMA $e_i^k=\\alpha e_i^{k-1}+(1-\\alpha)f_i^k$, $\\alpha=0.9$ 로 갱신한다. 외형 특징이 가려짐과 블러에 약하므로 **고신뢰 검출에서만** 특징을 뽑는다. 코사인 거리가 $\\theta_{emb}=0.25$ 이상이거나 IoU 거리가 $\\theta_{iou}=0.5$ 이상이면 외형 비용을 1로 마스킹하고, 통과한 쌍은 코사인 거리를 0.5배한다. 최종 비용은 두 행렬의 같은 칸끼리 min이다. 외형이 비슷하면 IoU보다 비용이 더 내려갈 수 있다는 것이 핵심이다.'},
 {h:'ByteTrack 구조 위에 얹는다',
  lead:'1차는 IoU+ReID 융합 비용, 2차는 저점수 상자와 IoU만으로 매칭한다.',
  d:'고신뢰 검출은 융합 비용으로 헝가리안 매칭하고, 매칭 안 된 트랙은 [ByteTrack](#/p/bytetrack)처럼 저신뢰 검출과 IoU만으로 다시 매칭한다. 유사도가 0.2 미만이면 매칭을 거부하고, 놓친 트랙은 30프레임 보관한다. ReID 없는 버전이 BoT-SORT, 있는 버전이 BoT-SORT-ReID다. 후처리로 최대 간격 20의 선형 보간을 쓴다(ByteTrack을 따름).'}
],

diagram:{type:'flow', cap:'BoT-SORT-ReID 프레임 처리. 카메라 모션 추정이 칼만 예측 상자를 보정해 1차 연관(IoU+ReID 융합)으로 들어가고, 미매칭 트랙은 저점수 검출과 IoU로 2차 연관한다.',
 nodes:[
  {t:'카메라 모션 추정', s:'프레임 간 아핀 A', acc:true},
  {t:'칼만 예측+보정', s:'상태 8차원 (w,h)'},
  {t:'1차 연관', s:'min(IoU, 0.5·cos)', a:'미매칭'},
  {t:'2차 연관', s:'저점수 상자, IoU'},
  {t:'트랙 관리', s:'KF·EMA 갱신'}
 ]},

math:[
 {expr:'x = [xc, yc, w, h, ẋc, ẏc, ẇ, ḣ]ᵀ,  z = [zxc, zyc, zw, zh]ᵀ',
  tex:'\\mathbf x_k=[x_c,y_c,w,h,\\dot x_c,\\dot y_c,\\dot w,\\dot h]^{\\top},\\quad \\mathbf z_k=[z_{x_c},z_{y_c},z_w,z_h]^{\\top}',
  d:'BoT-SORT의 칼만 상태와 측정 벡터. $Q_k=\\mathrm{diag}\\big((\\sigma_p\\hat w)^2,(\\sigma_p\\hat h)^2,(\\sigma_p\\hat w)^2,(\\sigma_p\\hat h)^2,(\\sigma_v\\hat w)^2,\\ldots\\big)$, $R_k=\\mathrm{diag}\\big((\\sigma_m\\hat w)^2,(\\sigma_m\\hat h)^2,\\ldots\\big)$ 이고 $\\sigma_p=0.05$, $\\sigma_v=0.00625$, $\\sigma_m=0.05$ 는 DeepSORT를 따랐다.'},
 {expr:'x̂′ = M̃ x̂ + T̃,   P′ = M̃ P M̃ᵀ',
  tex:'\\hat{\\mathbf x}\'_{k|k-1}=\\tilde M\\,\\hat{\\mathbf x}_{k|k-1}+\\tilde T,\\quad P\'_{k|k-1}=\\tilde M\\,P_{k|k-1}\\,\\tilde M^{\\top}',
  d:'$A=[M\\,|\\,T]$ 에서 $M\\in\\mathbb R^{2\\times2}$(회전·스케일), $T=(a_{13},a_{23})^\\top$ 이다. $\\tilde M\\in\\mathbb R^{8\\times8}$ 은 $M$ 을 대각 블록 4개로 쌓은 행렬, $\\tilde T\\in\\mathbb R^8$ 은 앞 두 성분만 $T$ 이고 나머지는 0이다. 보정된 $\\hat x\'$, $P\'$ 가 이어서 칼만 이득과 갱신(식 9)에 들어간다. 카메라가 느리게 움직이면 공분산 보정은 생략할 수 있다고 한다.'},
 {expr:'d̂cos = 0.5·dcos  (dcos<θemb 이고 diou<θiou), 아니면 1;  C = min(diou, d̂cos)',
  tex:'\\hat d^{cos}_{i,j}=\\begin{cases}0.5\\,d^{cos}_{i,j}, & d^{cos}_{i,j}<\\theta_{emb}\\ \\wedge\\ d^{iou}_{i,j}<\\theta_{iou}\\\\ 1, & \\text{otherwise}\\end{cases},\\qquad C_{i,j}=\\min\\{d^{iou}_{i,j},\\,\\hat d^{cos}_{i,j}\\}',
  d:'$\\theta_{iou}=0.5$, $\\theta_{emb}=0.25$ (MOT17 val 히스토그램으로 선택). 외형이 틀리거나 위치가 먼 쌍은 외형 비용이 1이 되어 IoU 거리가 그대로 비용이 된다. 외형이 맞는 쌍만 코사인 쪽이 작아져 선택된다. 기존 $C=\\lambda A_a+(1-\\lambda)A_m$ ($\\lambda=0.98$) 가중합을 대체한다.'}
],

numbers:[
 {k:'MOT17 test · BoT-SORT-ReID MOTA/IDF1/HOTA', v:'80.5 / 80.2 / 65.0', d:'private detection. IDs 1,212, FPS 4.5. 논문은 IDF1 80을 넘긴 첫 트래커라고 주장. BoT-SORT 단독은 80.6/79.5/64.6, IDs 1,257, FPS 6.6'},
 {k:'MOT17 test · 같은 표의 ByteTrack', v:'80.3 / 77.3 / 63.1', d:'IDs 2,196, FPS 29.6. IDF1 +2.9 대신 FPS는 크게 낮다 (논문도 FPS 비교는 장비에 따라 달라진다고 단서)'},
 {k:'MOT20 test · BoT-SORT-ReID MOTA/IDF1/HOTA', v:'77.8 / 77.5 / 63.3', d:'IDs 1,257, FPS 2.4. 같은 표 ByteTrack은 77.8/75.2/61.3'},
 {k:'MOT17 val 누적 (MOTA/IDF1/HOTA)', v:'77.66/79.77/67.88 → 78.46/82.07/69.17', d:'Table 1. 재현한 ByteTrack 기준선에서 BoT-SORT-ReID까지. KF 변경만으로는 77.67/79.89/68.12로 변화가 작다'},
 {k:'CMC 추가 효과 (MOT17 val)', v:'IDF1 79.89 → 81.51', d:'Table 1의 KF 다음 단계. HOTA 68.12 → 69.06, MOTA 77.67 → 78.31. 이 구성에서 가장 큰 단일 이득'},
 {k:'유사도 융합 비교 (MOT17 val IDF1)', v:'IoU 81.5 / 코사인만 70.0 / min 융합 82.1', d:'Table 2. 코사인 단독은 MOTA 73.7로 크게 낮다. IoU 마스킹을 건 코사인은 81.0, 융합은 MOTA 78.5, HOTA 69.2'}
],

impact:'BoT-SORT는 새 알고리즘을 만들기보다 "카메라가 움직일 때 칼만 예측을 어떻게 고치고, 외형 거리를 IoU와 어떻게 섞을 것인가"라는 실무 질문에 구체적 답을 준 논문이다. 특히 CMC는 MOT17의 움직이는 카메라 시퀀스(MOT17-13 등)에서 예측 상자가 어긋나는 문제를 정면으로 다뤘고, 이후 많은 트래커가 이 보정을 기본 부품으로 쓴다. 공개 코드가 YOLOX·FastReID와 함께 바로 돌아가도록 정리되어 실무용 기본 트래커로도 널리 쓰인다.',

legacy:[
 '**[ByteTrack](#/p/bytetrack)의 2단계 구조를 그대로 물려받는다** — 1차 연관에만 ReID를 넣고 2차는 IoU 전용으로 둔다',
 '**[DeepSORT](#/p/deepsort)의 가중합 비용 $\\lambda A_a+(1-\\lambda)A_m$ 을 폐기** — 마스킹 후 min으로 바꾼 설계가 이후 ReID 결합 트래커의 비교 기준이 됨',
 '**[Deep OC-SORT](#/p/deepocsort)가 BoT-SORT의 CMC와 외형 융합을 가져다 개선** — 외형 가중치를 검출 품질에 따라 조절',
 '**[BoostTrack](#/p/boosttrack)이 BoT-SORT를 비교·기반 기준선으로 삼음** — IoU와 외형 유사도를 섞는 방식이 계속 연구 주제'
],

pitfalls:[
 '**BoT-SORT는 "ByteTrack + 요령 세 개"이지 새 연관 알고리즘이 아니다.** Table 1에서 칼만 상태 변경만의 효과는 MOTA 77.66 → 77.67로 거의 없고, 이득의 대부분은 CMC에서 나온다. 저자들도 KF 변경이 HOTA를 올리는 이유는 확실하지 않다고 적었다.',
 '**배경 특징점이 부족하면 CMC가 실패한다.** 논문의 한계 절에 따르면 움직이는 물체가 빽빽한 장면에서는 카메라 모션 추정이 틀릴 수 있고, 틀린 모션은 트래커를 이상하게 만든다. 큰 해상도에서는 GMC 계산도 느리지만 검출기 추론 시간에 비하면 작다고 한다.',
 '**ReID 버전은 느리고 이득이 IDF1에 몰려 있다.** MOT17 test에서 BoT-SORT 6.6 FPS, BoT-SORT-ReID 4.5 FPS이고 MOTA는 80.6 → 80.5로 오히려 소폭 하락한다. 저사양에서는 IoU만 쓰는 쪽이 낫다고 논문도 말한다.'
],

figures:[
 {f:'fig2-pipeline.png',
  cap:'위쪽 점선 영역이 온라인 추적이다. 아래쪽 "Estimate Camera Motion"이 만든 warp matrix가 칼만 예측 상자(Predicted BB)로 들어가는 선, 그리고 1차 연관이 IoU+ReID 융합이라는 점이 ByteTrack과 다른 곳이다. 아래 박스의 보간은 선택적 후처리다.',
  src:'원문 Figure 2, p.3'},
 {f:'fig4-cmc-before-after.png',
  cap:'MOT17-13(차량이 우회전하는 시퀀스)의 같은 프레임. 왼쪽은 CMC 전, 오른쪽은 CMC 후의 칼만 예측 상자다. 보정 전에는 상자가 사람 몸에서 한쪽으로 밀려 있어 검출과의 IoU가 낮아지고, 보정 후에는 사람에게 맞는다.',
  src:'원문 Figure 4 (b), p.6'}
],

quotes:[
 {t:'Using IoU usually achieves better MOTA while Re-ID achieves higher IDF1.',
  src:'2. Related Work, p.2'}
],

links:[
 {t:'arXiv 2206.14651 — BoT-SORT', u:'https://arxiv.org/abs/2206.14651'},
 {t:'GitHub — NirAharon/BoT-SORT', u:'https://github.com/NirAharon/BOT-SORT'}
]
});
