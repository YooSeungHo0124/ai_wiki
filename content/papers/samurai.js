WIKI.paper({
slug:'samurai',
venue:'arXiv 2024',
authors:'Yang, Huang, Chai, Jiang, Hwang (University of Washington)',
arxiv:'2411.11922',

tldr:'[SAM 2](#/p/sam2)에 **칼만 필터 모션 모델**과 **모션 인식 메모리 선택**을 추가해, 재학습 없이 시각 객체 추적(VOT) 성능을 끌어올린 제로샷 트래커. 혼잡한 장면과 가림에서 SAM 2가 외형 유사도에만 의존해 틀리는 문제를 줄였다.',

context:'SAM 2는 스트리밍 메모리로 영상 분할(VOS)에서 좋은 성능을 보이지만, 시각 객체 추적에서는 두 가지 실패 유형이 있다고 저자들은 지적한다. 첫째, 비슷한 외형의 물체가 많은 혼잡한 장면에서 모션 단서를 무시하고 마스크 후보 중 affinity(IoU 점수)가 높은 것을 고른다. 둘째, 메모리 뱅크가 최근 $N_{mem}$ 개 프레임을 무조건 FIFO로 저장해, 가림이 있는 프레임의 나쁜 특징이 섞여 들어가 오류가 전파된다. 이 논문은 모델을 건드리지 않고 후보 선택과 메모리 구성 규칙만 바꾼다.',

ideas:[
 {h:'칼만 필터로 마스크 후보를 고른다',
  lead:'SAM 2의 다중 마스크 후보 중 칼만 필터 예측 박스와 가장 겹치는 것을 높이 평가한다.',
  d:'상태는 박스 중심·너비·높이와 그 속도 8차원이다. 각 후보 마스크에서 외접 박스를 구하고, 칼만 필터가 예측한 박스와의 IoU를 모션 점수 $s_{kf}$ 로 삼는다. 최종 마스크는 $s_{kf}$ 와 SAM 2 자체의 affinity 점수의 가중합 최대값으로 고른다. 모션 모듈은 최근 $\\tau_{kf}$ 프레임 동안 갱신이 안정적으로 성공했을 때만 반영한다.'},
 {h:'모션 인식 메모리 선택',
  lead:'affinity·객체 존재·모션 세 점수가 모두 기준을 넘는 프레임만 메모리에 둔다.',
  d:'현재 프레임에서 시간을 거슬러 올라가며 각 과거 프레임을 검사한다. 마스크 affinity, 객체 존재(object) 점수, 모션 점수 세 가지가 각각의 임계값 $\\tau_{mask}, \\tau_{obj}, \\tau_{kf}$ 를 모두 넘어야 메모리 후보가 된다. 최대 $N_{max}$ 프레임까지 되짚어 가며 후보를 모으고, SAM 2가 이 크기로 학습됐으므로 $N_{mem}=7$ 을 유지한다. 가려지거나 품질이 낮은 프레임은 메모리에서 빠진다.'},
 {h:'학습·미세조정이 없다',
  lead:'SAM 2 가중치는 그대로 두고 추론 시 선택 규칙만 바꾼다.',
  d:'모션 모델과 메모리 선택은 추가 파라미터나 학습이 필요 없고, 저자들은 계산 오버헤드도 거의 없어 실시간으로 동작한다고 주장한다. 모델에 종속되지 않아 SAM 2 이외의 추적 프레임워크에도 적용할 수 있다고 덧붙인다. 다만 "제로샷"은 추적 데이터셋으로 학습하지 않았다는 뜻이고, 기반인 SAM 2는 대규모 분할 데이터로 학습됐다.'}
],

diagram:{type:'flow', cap:'SAMURAI의 프레임당 처리. SAM 2 구조는 그대로 두고, 마스크 후보 선택과 메모리 뱅크 구성 두 곳만 모션·점수 정보로 바꾼다.',
 nodes:[
  {t:'메모리 어텐션', s:'조건부 이미지 임베딩'},
  {t:'마스크 디코더', s:'후보 마스크 + 점수'},
  {t:'모션 모델링', s:'칼만 필터, s_kf', acc:true, a:'가중합'},
  {t:'마스크 선택', s:'s_kf + affinity'},
  {t:'메모리 선택', s:'세 점수 모두 통과', acc:true}
 ]},

math:[
 {tex:'\\mathcal{M}^{*}=\\arg\\max_{\\mathcal{M}_i}\\;\\big(\\alpha_{kf}\\,s_{kf}(\\mathcal{M}_i)+(1-\\alpha_{kf})\\,s_{mask}(\\mathcal{M}_i)\\big)',
  expr:'M* = argmax_i ( α_kf·s_kf(M_i) + (1−α_kf)·s_mask(M_i) )',
  d:'마스크 선택. $s_{kf}$ 는 칼만 예측 박스와 후보 마스크 박스의 IoU, $s_{mask}$ 는 SAM 2의 affinity 점수다. 가중치 $\\alpha_{kf}$ 는 ablation에서 0.15가 가장 좋았다.'},
 {tex:'\\mathcal{B}_t=\\{m_i \\mid f(s_{mask},s_{obj},s_{kf})=1,\\; t-N_{max}\\le i<t\\}',
  expr:'B_t = { m_i | f(s_mask, s_obj, s_kf)=1, t−N_max ≤ i < t }',
  d:'모션 인식 메모리 뱅크. $f$ 는 세 점수가 각 임계값을 모두 넘을 때 1이다. 원래 SAM 2의 고정 창 $B_t=[m_{t-1},\\dots,m_{t-N_{mem}}]$ 를 대체한다.'}
],

numbers:[
 {k:'LaSOT · SAMURAI-L (AUC)', v:'74.2', d:'Table 1. 지도학습 LoRAT-L224도 74.2로 같다. ODTrack-L384는 74.0'},
 {k:'LaSOText · SAMURAI-L (AUC)', v:'61.0', d:'Table 1. 초록 요약의 "+7.1% AUC"는 기존 최고 대비 이득'},
 {k:'GOT-10k · SAMURAI-L (AO)', v:'81.7', d:'Table 1. 초록 요약의 "+3.5% AO"는 기존 최고 대비 이득'},
 {k:'모듈 ablation (LaSOT AUC)', v:'기준 68.32 → 모션 70.81 / 메모리 72.67 / 둘 다 74.23', d:'Table 3. 메모리 선택의 기여가 모션 모델링보다 크다'},
 {k:'모션 가중치 α_kf (LaSOT AUC)', v:'0.00 72.67 / 0.15 74.23 / 0.50 72.92', d:'Table 4. 메모리 선택만 쓴 상태에서의 민감도'}
],

impact:'SAM 2를 "분할 모델"에서 "추적 모델"로 쓰려면 모델 구조보다 후보 선택과 메모리 관리가 병목일 수 있음을 보였다. 칼만 필터라는 고전적 모션 모델을 학습 없이 붙여 LaSOText와 GOT-10k에서 기존 최고 수치를 갱신했고, LaSOT에서는 지도학습 최고 수준과 같아졌다. 같은 계열의 [SAM2Long](#/p/sam2long)이 트리 기반 메모리로 긴 영상 문제를 다룬다면, SAMURAI는 점수 기반 선택으로 같은 병목에 접근한다.',

legacy:[
 '**[SAM 2](#/p/sam2) 위의 추적 특화 변형**: 모델을 바꾸지 않고 마스크·메모리 선택 규칙만 바꾸는 접근',
 '**MOT 휴리스틱의 SOT 이식**: [SORT](#/p/sort) 이래 쓰여 온 칼만 필터를 마스크 후보 선택에 가져왔다',
 '**동시대 대안 [SAM2Long](#/p/sam2long)**: 논문 관련 연구 절이 SAM2Long의 트리 기반 메모리를 언급하며, 자신은 더 가벼운 점수 기반 선택이라고 대비한다',
 '**제로샷 SAM 기반 추적의 사례**: 지도학습 트래커 표(LoRAT·ODTrack 등)와 같은 표에 올려 놓고 비교한 초기 사례다'
],

pitfalls:[
 '**"제로샷"이 SAM 2의 학습 데이터를 포함한 말은 아니다.** 추적 벤치마크로 학습하지 않았다는 뜻이다. 지도학습 트래커와 학습 조건이 다르므로 단순 비교는 조심해야 한다.',
 '**모션 가정이 선형 칼만 필터라 급격한 움직임에는 약하다.** 저자들도 관련 연구 절에서 칼만 필터가 격렬하거나 갑작스러운 모션에서 실패하는 경우가 많다고 적는다. 그래서 최근 갱신이 안정적일 때만 모션 점수를 쓴다.',
 '**임계값 세트가 여러 개다.** $\\tau_{mask}, \\tau_{obj}, \\tau_{kf}$, $N_{max}$, $\\alpha_{kf}$ 가 있고 도메인에 따라 조정이 필요할 수 있다. 본문 ablation은 $\\alpha_{kf}$ 하나만 보인다.'
],

figures:[
 {f:'fig2-overview.png',
  cap:'아래쪽 경로는 SAM 2 그대로(이미지 인코더 → 메모리 어텐션 → 마스크 디코더). 오른쪽의 모션 모델링이 마스크 후보에 모션 점수를 주고, 왼쪽 위 Memory Selection은 고정 창 대신 좋은 점수를 가진 프레임(초록 체크)만 뱅크에 넣는다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'SAM 2 tends to prioritize appearance similarity over spatial and temporal consistency, resulting in tracking errors.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 2411.11922 — SAMURAI', u:'https://arxiv.org/abs/2411.11922'},
 {t:'GitHub — yangchris11/samurai', u:'https://github.com/yangchris11/samurai'}
]
});
