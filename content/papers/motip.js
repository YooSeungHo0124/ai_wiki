WIKI.paper({
slug:'motip',
venue:'CVPR 2025 (arXiv 2024)',
authors:'Gao et al. (Nanjing Univ. · China Mobile Suzhou · Shanghai AI Lab)',
arxiv:'2403.16848',

tldr:'객체 연관을 "역사 궤적이 달고 있는 ID 라벨을 문맥(in-context)으로 보고 현재 객체의 라벨을 예측하는 분류 문제"로 바꾼 트래커. [Deformable DETR](#/p/deformable-detr) 검출 위에 표준 Transformer decoder 하나를 얹어, 휴리스틱 매칭 없이 DanceTrack에서 외부 데이터 없이 HOTA 69.6을 냈다.',

context:'MOT 연관은 칼만 필터와 IoU, Re-ID 유사도로 비용 행렬을 만들어 푸는 방식이 오래 지배했고, 복잡한 장면마다 규칙과 하이퍼파라미터를 손으로 고쳐야 했다. [MOTR](#/p/motr) 계열은 track query를 전파해 이를 학습 문제로 바꿨지만, 한 decoder가 검출과 추적을 동시에 맡을 때 생기는 충돌이 지적됐다. 외부 검출기를 쓰는 [MOTRv2](#/p/motrv2)가 그 충돌을 줄였지만 검출을 따로 뺐다는 점에서 구조가 복잡해졌다. 저자들은 검출과 연관을 분리한 채로 연관만 end-to-end로 학습하는 길을 택했다.',

ideas:[
 {h:'In-context ID 예측: 라벨은 의미가 아니라 일관성',
  lead:'궤적의 ID는 어떤 숫자여도 프레임 사이에 일관되기만 하면 되므로 문맥 속 라벨을 예측하게 한다.',
  d:'정답 파일에서 4개 객체가 1 2 3 4라 해도 8 5 7 3으로 불러도 일관되면 맞다. 학습 때 각 궤적에 무작위 라벨 $k_m$ 을 붙이고, 현재 객체가 어느 궤적에 속하는지를 그 라벨로 맞히게 한다. 라벨 집합 $1\\le k\\le K$ 안에서만 예측하므로 처음 보는 궤적이 나와도 분포 밖 라벨 문제가 생기지 않는다. 이것이 일반 분류와 Re-ID 코사인 유사도 방식의 사이를 메운다.'},
 {h:'ID dictionary와 tracklet 구성',
  lead:'학습 가능한 ID 단어 $K$개와 신생 객체용 특수 토큰으로 궤적에 정체성을 붙인다.',
  d:'one-hot 대신 $K+1$ 개의 학습형 임베딩 사전을 쓰고, 마지막은 신생 객체를 뜻하는 특수 토큰이다. 각 궤적의 과거 $T$ 프레임 객체 feature에 해당 ID 단어를 이어 붙여($2C$ 차원) tracklet을 만든다. 현재 프레임 객체는 아직 ID가 없으므로 특수 토큰을 붙인다. 객체 feature는 Deformable DETR decoder의 출력 embedding을 그대로 쓴다.'},
 {h:'ID Decoder: 표준 Transformer decoder 하나',
  lead:'과거 tracklet을 key·value로, 현재 객체를 query로 놓고 선형 헤드로 ID 라벨을 분류한다.',
  d:'특별한 구조 없이 self-attention과 cross-attention이 번갈아 있는 표준 decoder이고 상대 위치 인코딩을 쓴다. 손실은 검출 손실(focal·L1·GIoU)에 ID 교차엔트로피 $\\mathcal{L}_{id}$ 를 더한 하나로 합친다. 추론에서는 같은 프레임에서 같은 ID로 예측된 객체가 둘이면 점수가 높은 쪽만 남기고, 헝가리안이나 다단계 매칭은 쓰지 않는다.'},
 {h:'Trajectory augmentation',
  lead:'궤적의 일부를 지우고 두 궤적의 ID 토큰을 바꿔 추론 중 생기는 연관 오류를 학습 때 흉내 낸다.',
  d:'학습은 정답 ID로 궤적을 만들어 추론보다 훨씬 쉽다. 이를 보완하려고 궤적 토큰을 확률 $\\lambda_{occ}$ 로 무작위 제거해 가림을 모사하고, 같은 프레임의 두 궤적 ID 토큰을 확률 $\\lambda_{sw}$ 로 맞바꿔 잘못된 ID 배정을 모사한다. 두 값 모두 0.5로 모든 데이터셋에 같게 썼다.'}
],

diagram:{type:'flow', cap:'DETR 검출기가 객체 feature를 만들고, ID Decoder가 과거 tracklet의 ID 단어를 문맥으로 읽어 현재 객체의 ID 라벨을 분류한다.',
 nodes:[
  {t:'DETR 검출', s:'객체 feature·박스'},
  {t:'tracklet 구성', s:'feature + ID 단어', a:'T 프레임'},
  {t:'ID Decoder', s:'과거 K,V / 현재 Q', acc:true},
  {t:'ID 라벨 분류', s:'K+1 클래스'},
  {t:'트랙 갱신', s:'신생은 새 ID'}
 ]},

math:[
 {tex:'\\mathcal{L}=\\lambda_{cls}\\mathcal{L}_{cls}+\\lambda_{L1}\\mathcal{L}_{L1}+\\lambda_{giou}\\mathcal{L}_{giou}+\\lambda_{id}\\mathcal{L}_{id}',
  expr:'L = λcls·Lcls + λL1·LL1 + λgiou·Lgiou + λid·Lid',
  d:'검출 세 항에 ID 교차엔트로피를 더한 통합 손실. 가중치는 순서대로 2.0, 5.0, 2.0, 1.0이다. 연관이 $K+1$ 분류 문제이므로 별도 매칭 손실이 필요 없다.'},
 {tex:'\\tau^{m,k_m}_t=\\text{concat}\\big(f^m_t,\; i^{k_m}\\big)',
  expr:'τ = concat(f_t^m, i^{k_m})',
  d:'궤적 $m$ 의 시점 $t$ 토큰은 DETR 객체 feature $f$ 와 그 궤적에 배정된 ID 단어 $i^{k_m}$ 의 이어 붙임이다. 결과는 $2C$ 차원이며 ID 단어가 "문맥 속 프롬프트" 역할을 한다.'}
],

numbers:[
 {k:'DanceTrack test · HOTA / AssA / IDF1 (추가 데이터 없음)', v:'69.6 / 60.4 / 74.7', d:'같은 표의 CO-MOT 65.3 / 53.5 / 66.5, MOTR 54.2 / 40.2 / 51.5. DetA 80.4, MOTA 90.6'},
 {k:'DanceTrack test · HOTA (추가 데이터 사용)', v:'72.0', d:'MOTRv2 69.9와 비교. AssA 63.5, IDF1 76.8'},
 {k:'SportsMOT test · HOTA / AssA / IDF1', v:'72.6 / 63.2 / 77.1', d:'추가 데이터 없는 방법들 중 최고. 같은 표의 OC-SORT는 68.1 / 54.8 / 68.0'},
 {k:'BFT(새 추적) test · HOTA / AssA', v:'70.5 / 71.8', d:'같은 표의 OC-SORT는 66.8 / 68.7. MOTA는 77.1로 OC-SORT와 같다'},
 {k:'ID 사전 크기와 학습 비용', v:'K = 50, 8×RTX 4090으로 1일 미만', d:'DanceTrack 학습 기준. 최대 시간 길이 T는 DanceTrack 29, SportsMOT 59, BFT 19'}
],

impact:'MOTIP는 end-to-end MOT에서 문제를 "검출과 추적을 함께 학습할 것인가"가 아니라 "연관 자체를 어떻게 학습 가능한 형태로 정식화할 것인가"로 바꿨다. track query를 전파하지 않고 검출 모듈과 ID 예측 모듈을 순차 구성으로 나눠 두 과제의 충돌을 피했다. 객체 수준 feature만으로 DanceTrack, SportsMOT, BFT에서 휴리스틱 기반과 query 기반 방법을 모두 앞섰다. 저자들은 단순함을 장점으로 내세우며 후속 연구의 기준선이 되기를 기대한다.',

legacy:[
 '**연관을 분류로 보는 관점** — Re-ID 코사인 유사도 대신 문맥 속 라벨 예측으로 [DETR](#/p/detr) 계열 트래커의 연관을 정식화했다.',
 '**MOTR 계열과의 갈라짐** — [MOTR](#/p/motr)과 [MOTRv2](#/p/motrv2)가 query를 전파하는 것과 달리 검출과 연관을 두 모듈로 나눈다.',
 '**휴리스틱 SORT 계열과의 대비** — [SORT](#/p/sort)와 [ByteTrack](#/p/bytetrack)이 쓰는 손수 설계한 매칭 규칙 대신 데이터로 연관을 학습하는 쪽의 주장을 이어간다.'
],

pitfalls:[
 '**MOT17 같은 소규모 데이터셋 결과가 주력이 아니다.** 본문 표는 DanceTrack, SportsMOT, BFT에 집중되어 있고 MOT17 비교는 부록(D.1, Table 7)에만 있다. 저자들도 MOT17은 학습 데이터가 적어 현대 모델 학습에 부족하다고 본다. 외형이 비슷하고 움직임이 복잡한 장면에서의 이득이라고 읽어야 한다.',
 '**추가 데이터 비교를 구분해야 한다.** 저자들은 정지 영상으로 비디오를 모사하는 방식이 end-to-end·장기 모델링에 해롭다고 보고 주 비교를 추가 데이터 없는 조건으로 한다. MOTRv2 등은 추가 데이터 조건의 값이므로 표의 구분을 확인해야 한다.',
 '**ID 사전 크기 $K$ 가 상한이다.** $K$ 는 프레임당 최대 객체 수보다 작으면 안 된다. 저자들은 $K=50$ 으로 두었고, 긴 영상에서는 끝난 궤적의 라벨을 재활용한다.'
],

figures:[
 {f:'fig2-overview.png',
  cap:'왼쪽의 ID 사전(1~K와 특수 토큰 S)에서 라벨을 골라 과거 프레임 $I_{t-T}$~$I_{t-1}$ 의 객체 embedding(회색)에 붙이면 초록색 tracklet이 된다. 오른쪽 현재 프레임 $I_t$ 의 객체는 모두 S를 달고 ID Decoder에 들어가 id 헤드가 각자의 라벨을 예측한다. 아래 cls·bbox 헤드는 일반 DETR 검출 손실이다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'In MOT, the labels of the trajectories are actually used to indicate a certain consistency rather than specific semantic information.',
  src:'Sec. 3.1, p.3'}
],

links:[
 {t:'arXiv 2403.16848 — MOTIP', u:'https://arxiv.org/abs/2403.16848'},
 {t:'GitHub — MCG-NJU/MOTIP', u:'https://github.com/MCG-NJU/MOTIP'}
]
});
