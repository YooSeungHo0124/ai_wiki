WIKI.paper({
slug:'deepocsort',
venue:'ICIP 2023 (arXiv 2023)',
authors:'Maggiolino, Ahmad et al. (Carnegie Mellon University)',
arxiv:'2302.11813',

tldr:'순수 모션 기반인 [OC-SORT](#/p/ocsort)에 외형(ReID)을 **검출 신뢰도와 매칭의 변별력에 따라 적응적으로** 섞고, [BoT-SORT](#/p/botsort)식 카메라 모션 보정까지 얹은 트래커. MOT20 test에서 HOTA 63.9, MOT17 test에서 64.9, DanceTrack test에서 61.3을 냈다.',

context:'검출기가 강해지면서 [SORT](#/p/sort) 계열의 모션 기반 연관이 다시 리더보드 상위를 차지했지만, 외형 단서를 넣는 방식은 단순한 이동 평균 갱신에 머물렀다. 박스 수준의 ReID 특징은 가려짐, 모션 블러, 비슷한 외모 때문에 잡음이 크다. [OC-SORT](#/p/ocsort)는 외형 없이도 비선형 움직임에 강하지만 외형이 큰 도움이 되는 장면에서는 그 정보를 쓰지 못한다. 저자들은 외형이 믿을 만한 순간에만 외형을 반영하도록 가중치를 상황마다 바꾸는 방식으로 이 간극을 메운다.',

ideas:[
 {h:'Dynamic Appearance: 검출 신뢰도로 EMA 계수를 조절',
  lead:'검출 confidence가 낮은 프레임의 외형 특징은 트랙 특징에 거의 반영하지 않는다.',
  d:'트랙의 외형 특징은 보통 고정 $\\alpha$ 의 EMA로 갱신한다. 이 논문은 $\\alpha$ 를 검출 신뢰도 $s_{det}$ 에 따라 프레임마다 바꾼다. 신뢰도가 임계값 $\\sigma$ 이면 $\\alpha_t=1$ 이라 새 특징을 완전히 무시하고, 신뢰도가 1이면 $\\alpha_t=\\alpha_f=0.95$ 로 새 특징이 최대한 반영된다. 그 사이는 선형이다. 새 하이퍼파라미터는 없고 계산량도 거의 늘지 않는다.'},
 {h:'Adaptive Weighting: 변별력이 큰 쌍에 외형 비중을 키운다',
  lead:'한 트랙이 한 검출에만 확실히 닮았을 때, 그 쌍의 외형 비용 가중치를 키운다.',
  d:'외형 비용 행렬 $A_c$ 의 각 행과 열에서 1등과 2등 값의 차이를 변별력 $z_{diff}$ 로 본다. 트랙 쪽과 검출 쪽 변별력의 평균 $w_b(m,n)$ 을 기본 가중치 $a_w$ 에 더해 그 칸의 외형 비중으로 쓴다. 차이는 상한 $\\epsilon$ 으로 자른다. KL 발산 같은 분포 지표를 쓰지 않는 이유는 3등 이하의 낮은 점수 분포는 상관없고 1등이 2등과 멀리 떨어져 있는지가 핵심이기 때문이라고 설명한다.'},
 {h:'카메라 모션 보정을 OC-SORT의 세 모듈에 적용',
  lead:'OOS, OCM, OCR 각각에서 쓰는 좌표에 같은 스케일 회전+이동 변환을 건다.',
  d:'프레임 간 변환 $M_t=s_tR_t$, $T_t$ 를 OpenCV VidStab 모듈(특징점, 광류, RANSAC)로 구한다. OC-SORT의 칼만 상태에서는 중심 좌표와 속도 성분에만 $M_t$, $T_t$ 를 적용하고 면적·종횡비에는 적용하지 않는다. 회전된 물체의 외접 상자는 선형 근사가 되지 않아 정밀한 마스크가 필요하고, 칼만 필터가 이런 근사 오류에 민감하다는 이유다. 보정은 칼만 예측 단계 전에 적용한다.'},
 {h:'OC-SORT 구조를 그대로 유지',
  lead:'연관은 여전히 헝가리안으로 푸는 단일 단계 비용 행렬이다.',
  d:'OCM, OCR, OOS를 포함한 OC-SORT의 전체 파이프라인과 헝가리안 할당을 그대로 쓴다. 외형은 IoU 비용에 더하는 항으로 한 번에 합쳐지며, 외형 특징은 fast-reid의 SBS50을 쓴다. 검출기는 앞선 연구들과 같은 YOLOX라서 같은 검출 위의 비교가 된다.'}
],

diagram:{type:'flow', cap:'Deep OC-SORT 처리 흐름. 외형 특징은 Dynamic Appearance로 갱신되고, CMC로 보정한 OC-SORT 칼만 상태와 함께 Adaptive Weighting을 거쳐 하나의 비용 행렬이 된다.',
 nodes:[
  {t:'검출 + ReID', s:'SBS50 특징'},
  {t:'Dynamic App.', s:'신뢰도로 EMA', acc:true},
  {t:'CMC + KF', s:'OC-SORT 모션'},
  {t:'Adaptive Wt.', s:'변별력 가중', acc:true},
  {t:'비용 행렬+할당', s:'헝가리안'}
 ]},

math:[
 {expr:'α_t = α_f + (1 − α_f)(1 − (s_det − σ)/(1 − σ)),  α_f = 0.95',
  tex:'\\alpha_t=\\alpha_f+(1-\\alpha_f)\\left(1-\\frac{s_{det}-\\sigma}{1-\\sigma}\\right),\\quad \\alpha_f=0.95',
  d:'$\\mathbf e_t=\\alpha_t\\mathbf e_{t-1}+(1-\\alpha_t)\\mathbf e^{new}$ 에 쓰는 가변 계수. $s_{det}=\\sigma$ 이면 1, $s_{det}=1$ 이면 $\\alpha_f$.'},
 {expr:'z_diff = min( max_i A[i,n] − max_{j≠i} A[j,n], ε )',
  tex:'z_{diff}^{det}(A_c,n)=\\min\\Big(\\max_i A_c[i,n]-\\max_{j\\neq i}A_c[j,n],\\ \\epsilon\\Big)',
  d:'열 $n$(검출)의 변별력. 행 $m$(트랙)에 대해서도 같은 식으로 $z_{diff}^{track}$ 를 구한다. 두 값의 평균이 $w_b(m,n)$ 이다.'},
 {expr:'C[m,n] = IoU[m,n] + [a_w + w_b(m,n)] · A_c[m,n]',
  tex:'C[m,n]=\\mathrm{IoU}[m,n]+\\big[a_w+w_b(m,n)\\big]\\,A_c[m,n]',
  d:'최종 비용. 외형 비용 $A_c$ 는 코사인 유사도 행렬이고 할당은 $-C$ 를 최소화하는 선형 합 할당이다. MOT17·MOT20은 $a_w=0.75$, $\\epsilon=0.5$, DanceTrack은 외형이 IoU보다 유리하다고 보아 $a_w=1.25$, $\\epsilon=1.0$ 을 썼다.'}
],

numbers:[
 {k:'MOT17 test · HOTA/MOTA/IDF1', v:'64.9 / 79.4 / 80.6', d:'Table 1. 같은 표 OC-SORT는 63.2/78.0/77.5, ByteTrack 63.1/80.3/77.3. IDs 1,023. 논문은 공개된 방법 중 최고, 리더보드 2위라고 적는다'},
 {k:'MOT20 test · HOTA/MOTA/IDF1', v:'63.9 / 75.6 / 79.2', d:'Table 1. OC-SORT 62.1/75.5/75.9 대비 IDF1 +3.3. 리더보드 1위라고 적는다'},
 {k:'DanceTrack test · HOTA/AssA/IDF1', v:'61.3 / 45.8 / 61.5', d:'Table 2. OC-SORT 55.1/38.3/54.6, StrongSORT++ 55.6/38.6/55.2 대비 큰 폭'},
 {k:'MOT17 val 누적 (HOTA/IDF1)', v:'68.13/79.52 → 70.20/82.78', d:'Table 3. OC-SORT 기준에서 외형+DA+CMC+AW까지. CMC만 더해도 69.66/82.44'},
 {k:'DanceTrack val 누적 (HOTA/IDF1)', v:'53.07/52.43 → 58.53/59.06', d:'Table 3. 외형을 넣는 것만으로 HOTA 53.07 → 58.03으로 가장 크게 오르고, DA와 AW는 각각 +0.3, +0.1 가량'},
 {k:'MOT20 val에서 CMC 효과', v:'HOTA 58.35 → 58.33', d:'정지 카메라에서는 CMC가 도움이 안 된다는 논문의 설명과 일치'}
],

impact:'Deep OC-SORT는 모션 기반 트래커에 외형을 넣는 문제를 "외형을 얼마나 믿을지를 상황별로 정하는 문제"로 바꿨다. 두 가지 조절(검출 신뢰도, 매칭 변별력)이 모두 추가 학습이나 추가 하이퍼파라미터 없이 규칙으로 정의되어 기존 트래커에 이식하기 쉽다. 이 논문은 이후 외형·모션 결합 트래커의 비교 기준이 되었고, 특히 DanceTrack에서 외형을 제대로 쓰면 큰 이득이 있음을 수치로 보였다.',

legacy:[
 '**[OC-SORT](#/p/ocsort)의 직계 확장** — 관측 중심 모션 모델은 그대로 두고 외형 단서만 적응적으로 추가',
 '**[BoT-SORT](#/p/botsort)가 보인 CMC와 EMA 외형 갱신을 이어받아 개선** — 논문은 BoT-SORT 등이 고정 이동 평균을 쓴다고 지적',
 '**[Hybrid-SORT](#/p/hybridsort) 등이 OC-SORT 계열 위에 다른 약한 단서를 추가하는 후속 흐름으로 이어짐**',
 '**MOT17·MOT20·DanceTrack 세 벤치마크에서 모두 기준선으로 쓰이는 온라인 트래커** — 논문은 오프라인 후처리를 쓴 StrongSORT++보다도 연관 정확도가 높다고 보고'
],

pitfalls:[
 '**CMC는 정지 카메라에서 이득이 없다.** MOT20-val은 정지 카메라라 HOTA가 58.35 → 58.33으로 그대로다. 움직이는 카메라가 있는 MOT17과 DanceTrack에서만 효과가 있다.',
 '**데이터셋마다 $a_w$, $\\epsilon$ 을 다르게 썼다.** MOT17·MOT20은 0.75/0.5, DanceTrack은 1.25/1.0이다. 외형 비중이 높을수록 좋은 데이터가 있다는 뜻이라, 다른 도메인에 옮기면 재조정이 필요하다.',
 '**DanceTrack 수치는 val과 test가 크게 다르다.** val ablation의 최종 HOTA는 58.53이고 test는 61.3이다. 어느 분할의 수치인지 확인하고 인용해야 한다.'
],

figures:[
 {f:'fig1-overview.png',
  cap:'위쪽 가지가 외형 경로로, ReID 특징을 DA(Dynamic Appearance)가 순환 갱신한다. 아래쪽 가지는 CMC로 보정되는 OC-SORT 칼만 필터다. 두 경로가 AW(Adaptive Weighting)에서 만나 하나의 비용 행렬과 선형 할당기로 간다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We propose a dynamic and adaptive heuristic-based model to incorporate the visual appearance with motion-based cues in a single stage for object association.',
  src:'1. Introduction, p.1'}
],

links:[
 {t:'arXiv 2302.11813 — Deep OC-SORT', u:'https://arxiv.org/abs/2302.11813'},
 {t:'GitHub — GerardMaggiolino/Deep-OC-SORT', u:'https://github.com/GerardMaggiolino/Deep-OC-SORT'}
]
});
