WIKI.paper({
slug:'hybridsort',
venue:'AAAI 2024 (arXiv 2023)',
authors:'Yang, Han et al. (Dalian Univ. of Technology)',
arxiv:'2308.00783',

tldr:'IoU와 외형 같은 **강한 단서**가 겹침 속에서 무너질 때, 검출 신뢰도·박스 높이·속도 방향 같은 **약한 단서**로 보완하는 [OC-SORT](#/p/ocsort) 계열 트래커. DanceTrack test에서 OC-SORT의 HOTA 54.6을 62.2로 올렸고(ReID 추가 시 65.7), 약한 단서 모듈은 SORT·DeepSORT·[ByteTrack](#/p/bytetrack) 등 5종 트래커에 학습 없이 붙는다.',

context:'tracking-by-detection에서 연관은 주로 공간(IoU)과 외형(ReID)이라는 강한 단서로 푼다. 그런데 두 물체가 크게 겹치면 예측 상자와 검출 상자의 IoU가 모호해지고, 두 물체의 외형 특징은 앞쪽 물체에 지배당해 둘 다 구분력을 잃는다. [OC-SORT](#/p/ocsort)의 속도 방향 외에는 약한 단서를 쓴 방법이 드물었다. 각 약한 단서는 일부 물체 쌍에서만 구분력이 있어서 무시되어 왔다는 것이 저자들의 진단이다. 저자들은 약한 단서를 따로 모델링해 강한 단서가 실패하는 곳을 메우는 쪽을 택한다.',

ideas:[
 {h:'TCM: 트랙릿 신뢰도를 상태로 모델링',
  lead:'검출 신뢰도가 앞·뒤 물체(가리는 쪽·가려진 쪽)를 구분하는 단서가 된다.',
  d:'겹친 물체에서 가려진 쪽은 검출 신뢰도가 낮으므로 신뢰도가 전후 관계를 알려준다. 칼만 상태에 신뢰도 $c$ 와 그 속도 $\\dot c$ 를 추가해 $[u,v,s,c,r,\\dot u,\\dot v,\\dot s,\\dot c]$ 로 만들고, 비용은 $|\\hat c_{trk}-c_{det}|$ 로 둔다. 1차(고신뢰 검출) 연관에는 칼만 추정을, 2차(저신뢰 검출) 연관에는 직전 두 값으로 외삽하는 선형 예측을 쓴다. 가려짐이 시작되거나 끝날 때 신뢰도가 급변해서 칼만 추정은 뒤처지기 때문이다.'},
 {h:'HMIoU: 높이 IoU로 IoU를 변조',
  lead:'높이 방향 IoU를 구해 기존 IoU에 원소별로 곱한다.',
  d:'DanceTrack처럼 박스 높이가 주로 카메라까지의 거리에 좌우되는 데이터에서 높이는 겹친 물체를 구분하는 깊이 단서가 된다. 포즈에도 비교적 강건해서 칼만 필터가 안정적으로 추정한다. 높이 IoU $HIoU$ 를 기존 $IoU$ 와 곱한 $HMIoU=HIoU\\cdot IoU$ 를 쓴다. 너비로 같은 변조를 하면(WMIoU) 오히려 성능이 떨어지는데, 너비는 포즈나 팔다리 움직임에 따라 불규칙하게 변해 정확히 추정하기 어렵기 때문이라고 한다.'},
 {h:'ROCM: 네 모서리와 여러 간격으로 속도 방향 계산',
  lead:'OC-SORT의 OCM을 중심점 한 개, 간격 3에서 네 모서리, 간격 1~3의 합으로 확장한다.',
  d:'OC-SORT의 방향 비용은 박스 중심과 고정 간격 3프레임만 써서 노이즈에 약하다. ROCM은 좌상·우상·좌하·우하 네 모서리의 속도 방향 비용을 구하고, 간격 $\\Delta t=1,2,3$ 에 대해 합한다. 복잡하게 움직이는 물체는 중심의 방향이 정반대여도 일부 모서리는 방향이 유지되는 경우가 있다. 가중치는 OC-SORT와 같은 0.2다.'},
 {h:'강한 단서와 약한 단서의 합산',
  lead:'세 단계 연관(고신뢰·저신뢰·OCR)에 하나의 합산 비용을 쓴다.',
  d:'기본 틀은 OC-SORT를 기준선으로 삼고, [ByteTrack](#/p/bytetrack)식 저신뢰 검출 연관 단계를 추가한 3단계다. 최종 비용은 $C=C_{HMIoU}+\\lambda_1C_{Vel}+\\lambda_2C_{Conf}+\\lambda_3C_{Appr}$ 이고 외형 항은 ReID 버전에서만 쓴다. ReID 모델은 [BoT-SORT](#/p/botsort)의 BoT 모델을 그대로 가져왔고, 외형은 EMA로 갱신하며 코사인 거리를 쓴다.'}
],

diagram:{type:'compare', cap:'강한 단서만 쓰는 기존 연관과, 약한 단서로 보완하는 Hybrid-SORT의 차이. 약한 단서는 단독으로는 구분력이 부분적이지만 강한 단서가 실패한 쌍에서는 신뢰할 만하다.',
 left:{t:'강한 단서만', items:['IoU (공간)','외형 특징 (ReID)','겹치면 둘 다 모호','구분력이 한꺼번에 무너짐']},
 right:{t:'Hybrid-SORT', items:['IoU를 높이 IoU로 변조','신뢰도 차이 비용 (TCM)','네 모서리 속도 방향 (ROCM)','강한 단서가 틀린 곳 보완']}},

math:[
 {expr:'HMIoU = HIoU · IoU,   HIoU = (min(y2) − max(y1)) / (max(y2) − min(y1))',
  tex:'\\mathrm{HMIoU}=\\mathrm{HIoU}\\cdot\\mathrm{IoU},\\qquad \\mathrm{HIoU}=\\frac{\\min(y_2^1,y_2^2)-\\max(y_1^1,y_1^2)}{\\max(y_2^1,y_2^2)-\\min(y_1^1,y_1^2)}',
  d:'$y_1$, $y_2$ 는 박스의 위·아래 y 좌표(위첨자는 두 박스). 세로 방향으로만 계산한 1차원 IoU다. 높이 범위가 어긋나면 값이 작아져 IoU가 큰 이웃도 감점된다.'},
 {expr:'ĉ_trk = c_trk^(t−1) − (c_trk^(t−2) − c_trk^(t−1)),   C_Conf = |ĉ_trk − c_det|',
  tex:'\\hat c_{trk}=c_{trk}^{t-1}-\\big(c_{trk}^{t-2}-c_{trk}^{t-1}\\big),\\qquad C_{Conf}=\\big|\\hat c_{trk}-c_{det}\\big|',
  d:'2차 연관(저신뢰 검출)에서 쓰는 선형 예측. 직전 두 프레임의 변화가 이어진다고 가정해 외삽한다. 이전 값이 하나뿐이면 직전 값을 그대로 쓴다.'},
 {expr:'C = C_HMIoU + λ1 C_Vel + λ2 C_Conf + λ3 C_Appr',
  tex:'C=C_{HMIoU}+\\lambda_1C_{Vel}+\\lambda_2C_{Conf}+\\lambda_3C_{Appr}',
  d:'최종 비용. 신뢰도 비용 가중치는 DanceTrack에서 1·2차 연관 각각 1.5, 1.0이고 그 외 데이터셋은 1.0, 1.0이다. ROCM 가중치는 0.2다.'}
],

numbers:[
 {k:'DanceTrack test · HOTA/IDF1/MOTA', v:'62.2 / 63.0 / 91.6', d:'Table 1. OC-SORT는 54.6/54.6/89.6. ReID를 더한 Hybrid-SORT-ReID는 65.7/67.4/91.8'},
 {k:'MOT17 test · HOTA/IDF1/MOTA', v:'63.6 / 78.4 / 79.3', d:'Table 3. OC-SORT 63.2/77.5/78.0 대비 소폭 상승. ReID 버전은 64.0/78.7/79.9로 BoT-SORT(65.0)에는 못 미친다'},
 {k:'MOT20 test · HOTA/IDF1/MOTA', v:'62.5 / 76.2 / 76.4', d:'Table 2. OC-SORT 62.1/75.9/75.5. ReID 버전은 63.9/78.4/76.7'},
 {k:'DanceTrack val 구성요소 누적 (HOTA)', v:'53.1 → 53.7 → 57.7 → 59.3 → 63.0', d:'Table 4. 기준 → ROCM → +TCM → +HMIoU → +ReID. TCM이 +4.0으로 가장 크다. FPS는 30.1 → 27.8(ReID 전) → 15.5(ReID 후)'},
 {k:'TCM 모델링 선택 (DanceTrack val HOTA)', v:'칼만+선형 57.7 vs 선형만 53.9', d:'Table 5. 1차에 선형 예측을 쓰면 HOTA가 오히려 52.6으로 떨어진다(칼만 1차는 56.6)'},
 {k:'다른 트래커에 TCM 적용 (DanceTrack HOTA)', v:'DeepSORT +4.9, SORT +3.5, ByteTrack +2.3', d:'Table 7. MOT17에서는 +0.9, +0.2, +0.2로 이득이 작다. HMIoU도 비슷하게 DanceTrack에서 크고 MOT17에서 작다'}
],

impact:'Hybrid-SORT는 외형이나 모션 같은 강한 단서를 더 정교하게 만드는 대신, 쉽게 얻을 수 있는데 버려지던 약한 단서(신뢰도·높이)를 연관에 넣는 것으로 DanceTrack에서 큰 향상을 얻었다. TCM과 HMIoU는 칼만 상태를 확장하거나 IoU에 곱하는 정도라 학습 없이 기존 트래커에 이식된다. 복잡한 학습 매처(MOTRv2 등)나 오프라인 파이프라인(SUSHI)보다는 낮지만 실시간 SORT 계열의 성능 상한을 올렸다.',

legacy:[
 '**[OC-SORT](#/p/ocsort)를 기준선으로 삼아 OCM을 ROCM으로 개선** — 같은 검출·같은 연관 입력에서 DanceTrack HOTA를 7.6 올림',
 '**[ByteTrack](#/p/bytetrack)의 저신뢰 검출 연관 단계를 흡수** — 그 단계에 맞춘 신뢰도 선형 예측을 추가',
 '**[BoT-SORT](#/p/botsort)의 ReID 모델을 채택해 외형 버전을 구성** — 외형 부분은 논문의 초점이 아니라고 밝힘',
 '**신뢰도 단서는 이후 연구가 같은 질문을 다시 다루는 계기** — 검출 신뢰도를 연관에 쓰는 방식이 다른 트래커에서도 다뤄짐'
],

pitfalls:[
 '**약한 단서의 이득은 DanceTrack에 몰려 있다.** TCM은 DeepSORT에서 DanceTrack +4.9, MOT17 +0.9다. MOT17/20은 선형 움직임이 많고 포화 상태라 향상이 작다고 저자들이 직접 설명한다.',
 '**신뢰도를 어떻게 모델링하느냐에 따라 오히려 해가 된다.** 1차 연관에 선형 예측을 쓰면 칼만(56.6)보다 낮은 52.6이 나온다. 칼만과 선형 예측의 선택은 단계별로 다르게 해야 한다.',
 '**ReID 버전은 속도가 절반 가까이 줄고 이득은 데이터셋마다 다르다.** DanceTrack val에서 FPS 27.8 → 15.5이고, MOT17 test에서는 ReID 버전(64.0)이 [BoT-SORT](#/p/botsort)(65.0)보다 낮다. 논문도 ReID를 효율적으로 넣는 것은 범위 밖이라고 밝힌다.'
],

figures:[
 {f:'fig1-cue-discrimination.png',
  cap:'맨 위가 t 프레임의 트랙릿과 t+1 프레임 검출이다. 아래 각 그림은 네 사람 쌍 사이에서 해당 단서가 얼마나 구분하는지를 화살표 숫자로 나타낸다. 초록 실선은 믿을 만한 구분, 빨간 점선은 믿을 수 없는 구분이다. 위쪽 Strong Cues(IoU, 외형)가 실패한 쌍(−0.1, 0.0)을 아래 Weak Cues가 일부 구분해 준다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'we demonstrate this long-standing challenge in MOT can be efficiently and effectively resolved by incorporating weak cues to compensate for strong cues.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2308.00783 — Hybrid-SORT', u:'https://arxiv.org/abs/2308.00783'},
 {t:'GitHub — ymzis69/HybridSORT', u:'https://github.com/ymzis69/HybridSORT'}
]
});
