WIKI.paper({
slug:'patchcore',
venue:'CVPR 2022',
authors:'Roth et al. (Amazon AWS · Univ. of Tübingen · MPI)',
arxiv:'2106.08265',

tldr:'[PaDiM](#/p/padim)의 "위치마다 가우시안"이라는 통계적 가정을 버리고, 정상 이미지의 패치 특징을 그대로 **메모리 뱅크**에 모아 최근접 이웃 거리로 이상을 판정하는 방법. 메모리 뱅크를 coreset으로 1%까지 줄여도 성능이 거의 그대로라는 것을 보이며, MVTec AD 이미지 레벨 AUROC를 99% 이상까지 끌어올려 벤치마크를 사실상 포화시켰다.',

context:'[PaDiM](#/p/padim)은 위치별 가우시안이라는 파라메트릭 가정을 두기 때문에 정상 분포가 실제로 단일 봉우리(unimodal) 가우시안에서 벗어나면 표현력이 부족하다. 반면 [SPADE](https://arxiv.org/abs/2005.02357) 같은 K-NN 기반 방법은 정상 특징을 가정 없이 그대로 저장해 표현력은 높지만, 이미지 전체 단위로만 저장해 지역적 세밀함이 떨어지고 무엇보다 메모리 뱅크 전체를 매번 검색해야 해서 학습 데이터가 커질수록 추론 시간·저장공간이 선형으로 는다. PatchCore는 "패치 단위로 저장하되, 그 방대한 저장소를 대표성 있게 줄일 수는 없는가"라는 질문에서 출발한다.',

ideas:[
 {h:'이웃을 반영한 패치 특징 (locally aware patch features)',
  lead:'패치 특징을 이웃 위치와 함께 평균 풀링해 국소 문맥과 견고성을 확보한다.',
  d:'너무 얕은 층의 특징은 위치별 세부는 살지만 문맥이 없고, 너무 깊은 층은 문맥은 있지만 ImageNet 분류에 편향돼 해상도도 낮다. PatchCore는 중간 두 계층(예: [ResNet](#/p/resnet)의 layer 2, 3)에서 각 위치 주변 이웃 $\\mathcal N_p^{(h,w)}$ 의 특징을 adaptive average pooling으로 합쳐 지역 문맥을 담은 패치 특징을 만든다.'},
 {h:'메모리 뱅크: 가정 없이 정상 패치 특징을 그대로 저장',
  lead:'모든 정상 이미지의 모든 패치 특징을 집합 $\\mathcal M$ 에 합집합으로 쌓는다.',
  d:'PaDiM처럼 위치별 파라메트릭 분포를 추정하는 대신, PatchCore는 정상 학습 이미지 전체에서 나온 패치 특징을 그대로 $\\mathcal M=\\bigcup_i \\mathcal P_{s,p}(\\phi_j(x_i))$ 로 모은다. 테스트 시에는 이 메모리 뱅크 전체에서 최근접 이웃까지의 거리로 이상을 판정하므로 정상 분포의 형태에 대한 가정이 전혀 없다.'},
 {h:'greedy coreset 서브샘플링: 메모리를 대표점만으로 압축',
  lead:'전체 대비 거리 커버리지를 최대로 보존하는 부분집합만 반복적으로 골라낸다.',
  d:'메모리 뱅크를 그대로 두면 학습 이미지 수에 비례해 저장공간과 최근접 이웃 검색(추론) 시간이 늘어난다. PatchCore는 minimax facility location coreset 선택으로, 이미 고른 대표점 집합 $\\mathcal M_C$ 에서 가장 먼 점을 매 라운드 하나씩 추가하는 greedy 방식을 쓴다 — 무작위 샘플링과 달리 밀집된 다수 클러스터도, 희소한 소수 지점도 골고루 대표점을 남긴다.'},
 {h:'국소 이웃을 반영한 이상 점수 재조정',
  lead:'가장 가까운 정상 이웃들도 서로 멀리 떨어져 있으면 이상 점수를 더 키운다.',
  d:'단순 최근접 거리만 쓰면 원래 희소한 정상 영역(흔치 않지만 정상인 패턴)이 이상으로 오판되기 쉽다. PatchCore는 후보 이상 패치의 최근접 이웃 $m^*$ 주변 이웃들과의 softmax 가중 거리로 점수를 스케일해, "이 지점 자체가 정상 데이터에서도 원래 고립돼 있었는가"를 반영한다.'}
],

diagram:{type:'flow', cap:'정상 이미지를 사전학습 CNN에 통과시켜 이웃 인지 패치 특징을 모으고, greedy coreset으로 대표점만 남긴 메모리 뱅크를 만든 뒤, 테스트 패치의 최근접 이웃 거리로 이상을 판정한다.',
 nodes:[
  {t:'정상 이미지', s:'학습 데이터'},
  {t:'이웃 인지 패치특징', s:'중간 2개 층', a:'전체 저장'},
  {t:'메모리 뱅크 M', s:'패치 특징 집합'},
  {t:'coreset 서브샘플링', s:'~1~25%로 축소', acc:true},
  {t:'최근접 이웃 검색', s:'테스트 패치 vs M', a:'이상 점수'}
 ]},

math:[
 {expr:'M*_C = argmin_{M_C⊂M} max_{m∈M} min_{n∈M_C} ‖m − n‖₂',
  tex:'\\mathcal M_C^{*} = \\underset{\\mathcal M_C\\subset\\mathcal M}{\\arg\\min}\\;\\max_{m\\in\\mathcal M}\\;\\min_{n\\in\\mathcal M_C}\\lVert m-n\\rVert_2',
  d:'minimax facility location coreset 선택. 전체 $\\mathcal M$ 의 어떤 점도 대표점 집합 $\\mathcal M_C$ 에서 너무 멀지 않도록 만드는 부분집합을 찾는다. NP-hard라 논문은 반복적 greedy 근사로 푼다 — 매 라운드 현재 대표점들과 가장 먼 점을 하나씩 추가.'},
 {expr:'s = (1 − exp(‖m_test,* − m*‖) / Σ_{m∈Nb(m*)} exp(‖m_test,* − m‖)) · s*,   s* = ‖m_test,* − m*‖₂',
  tex:'s=\\left(1-\\frac{\\exp\\lVert m_{\\text{test},*}-m^{*}\\rVert_2}{\\sum_{m\\in N_b(m^{*})}\\exp\\lVert m_{\\text{test},*}-m\\rVert_2}\\right)\\cdot s^{*}',
  d:'이미지 레벨 이상 점수. $s^*$ 는 테스트 이미지의 모든 패치 중 메모리 뱅크까지 거리가 최대인 패치의 거리. 그 최근접 이웃 $m^*$ 주변 $b$개 이웃과의 상대적 거리로 재조정해, 원래 희소했던 정상 영역의 오탐을 줄인다.'}
],

numbers:[
 {k:'MVTec AD 이미지 레벨 AUROC', v:'99.1% (PatchCore-25%)', d:'PaDiM 95.3%·SPADE 85.5% 대비 오분류 이미지 1725장 중 42장까지 감소'},
 {k:'앙상블·고해상도 최고치', v:'99.6%', d:'DenseNet-201+ResNeXt-101+WideResNet-101 앙상블, 320px 입력 — 오차 0.4%까지'},
 {k:'픽셀 레벨 AUROC', v:'98.1% (PatchCore-25%)', d:'PaDiM 97.5% 대비 근소 우위. PRO-score는 93.5% vs PaDiM 92.1%'},
 {k:'coreset 압축률 vs 성능', v:'1%로 줄여도 AUROC 99.0%', d:'메모리 뱅크를 100%에서 1%로(약 2자릿수 축소)해도 이미지 AUROC는 99.1%→99.0%로 거의 그대로'},
 {k:'추론 시간', v:'0.6초(100%) → 0.17초(1%)', d:'coreset 축소로 추론이 3배 이상 빨라짐. SPADE 0.66초보다도 빠름'},
 {k:'MTD(자기 타일 결함) 데이터셋', v:'AUROC 99.1~99.4%', d:'MVTec AD 밖의 별도 산업 데이터셋에서도 SOTA — 정상 925장·이상 392장'}
],

impact:'"정상을 요약된 분포로 근사할 것인가, 대표 사례 집합으로 남길 것인가"라는 갈림길에서 후자를 택하고, coreset이라는 고전적인 근사 기법으로 그 저장 비용 문제를 해결했다. 특히 PaDiM 대비 파라메트릭 가정을 없앴는데도 오히려 더 가볍고 빠른 추론을 달성했다는 점이, "가정을 줄이는 것과 효율을 높이는 것이 상충하지 않는다"는 근거로 널리 인용된다. 이 논문 이후 MVTec AD의 이미지 레벨 AUROC는 사실상 포화 상태(99%대)에 도달해, 이 벤치마크 자체의 난이도를 재검토하는 후속 연구를 촉발했다.',

legacy:[
 '**MVTec AD 벤치마크의 사실상 포화** — 99%대 AUROC 이후 연구는 더 어려운 변종(다중 클래스 통합, few-shot, 3D 이상 탐지)으로 이동',
 '**coreset 서브샘플링의 재조명** — 대규모 메모리 기반 방법에서 저장 비용을 줄이는 표준 기법으로 다른 검색 기반 이상 탐지·이미지 검색 연구에 재사용됨',
 '**산업 배포 기준의 정착** — "추론 시간·메모리·정확도"를 함께 보고하는 3중 지표 비교(Table 5 형식)가 이후 이상 탐지 논문의 관례가 됨',
 '**멀티클래스·통합 모델 연구의 베이스라인** — 클래스별로 별도 메모리 뱅크를 두던 방식에서 하나의 통합 모델로 여러 클래스를 다루려는 후속 연구의 출발점이 됨'
],

pitfalls:[
 '**"메모리 뱅크가 크면 항상 좋다"가 아니다.** coreset으로 1%까지 줄여도 AUROC가 99.1%→99.0%로 거의 유지되는 반면, 무작위 서브샘플링은 같은 비율에서 성능이 훨씬 크게 떨어진다(Figure 5) — 무작위 축소와 coreset 축소를 같은 것으로 취급하면 안 된다.',
 '**이미지 레벨 AUROC(99.1~99.6%)와 픽셀 레벨 AUROC(98.0~98.4%), PRO-score(93~95%)는 서로 다른 지표다.** "PatchCore가 99.6%를 달성했다"는 문장은 대개 이미지 레벨을 가리키며, 이는 표준 단일 백본이 아니라 여러 백본을 앙상블하고 입력 해상도를 키운 설정(Table 4)의 값이다.',
 '**로컬 인지(locally aware) 특징은 중간 두 계층(j, j+1)만 쓰고 그 이상은 오히려 성능을 떨어뜨린다.** "층을 더 많이 합칠수록 좋다"고 일반화하면 안 된다 — 논문은 세 층 이상 결합이 ImageNet 편향을 키운다고 명시한다.'
],

figures:[
 {f:'fig2-overview.png',
  cap:'왼쪽 Training: 정상 이미지에서 이웃 인지 패치 특징을 뽑아 coreset 서브샘플링(빨간 점만 남김)으로 메모리 뱅크 M을 만든다. 오른쪽 Testing: 테스트 이미지의 패치 특징을 M과 최근접 이웃 검색으로 비교해 이상 점수와 세그멘테이션 지도를 얻는다.',
  src:'원문 Figure 2, p.4'},
 {f:'fig3-coreset-vs-random.png',
  cap:'위 행(Greedy Coreset)이 아래 행(Random)보다 파란 전체 분포의 형태(다봉우리 (a), 균일 (b))를 훨씬 적은 빨간 대표점으로도 고르게 덮는다 — 무작위 샘플링은 밀집 군집을 놓치거나 특정 영역에 쏠린다.',
  src:'원문 Figure 3, p.4'}
],

quotes:[
 {t:'On the challenging, widely used MVTec AD benchmark PatchCore achieves an image-level anomaly detection AUROC score of up to 99.6%, more than halving the error compared to the next best competitor.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2106.08265 — Towards Total Recall in Industrial Anomaly Detection', u:'https://arxiv.org/abs/2106.08265'},
 {t:'GitHub — amazon-science/patchcore-inspection', u:'https://github.com/amazon-science/patchcore-inspection'}
]
});
