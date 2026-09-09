WIKI.paper({
slug:'gnome',
venue:'Nature 624, 80–85 (2023)',
authors:'Merchant, Batzner, Schoenholz, Aykol, Cheon & Cubuk (Google DeepMind)',

tldr:'결정 구조를 그래프로 표현한 GNN으로 형성 에너지를 예측하고, 능동학습 루프로 후보 생성과 DFT 검증을 반복해 **220만 개의 새로운 안정 결정 구조**를 찾아낸 논문. 인류가 알던 안정 무기물 결정의 수를 한 자릿수 이상 늘렸다.',

context:'무기 결정 재료 발견은 오랫동안 시행착오에 의존해 왔다. 실험적으로 축적된 안정 구조는 ICSD 기준 약 2만 개뿐이고, [Materials Project](https://materialsproject.org)·OQMD 같은 DFT(밀도범함수이론) 기반 데이터베이스도 이온 치환·화학적 직관에 의존한 후보 생성 탓에 확장이 느렸다. 이 논문 직전까지 축적된 안정 구조는 약 4만 8천 개였다. 문제는 DFT 계산이 정확하지만 느려서 후보를 무작위로 다 계산해 볼 수 없다는 것 — 저렴하게 "이 구조가 안정적일 것 같다"를 걸러줄 대리 모델이 필요했다. GNoME은 그 대리 모델을 [GCN](#/p/gcn)/[MPNN](#/p/mpnn) 계열 그래프 신경망으로 만들고, 그 예측을 다시 DFT로 검증해 학습 데이터를 불리는 루프를 대규모로 돌렸다.',

ideas:[
 {h:'결정 구조 = 그래프, 원자 = 노드',
  lead:'원자를 노드로, 일정 거리 이내 원자쌍을 엣지로 잇고 메시지패싱으로 형성 에너지를 예측한다.',
  d:'구조 모델에서는 원자 사이 거리가 4.0Å 미만이면 엣지를 긋는다(포텐셜 모델은 5.0Å). 노드는 원자 종류로, 엣지는 원자간 거리로 임베딩하고, 전체 구조를 대표하는 global 노드를 모든 원자에 연결한다. [MPNN](#/p/mpnn)의 message-passing 공식을 그대로 따라 3~6회 메시지패싱을 반복한 뒤 global 벡터에서 에너지를 읽어낸다. 조성만 있는(구조 없는) 경우를 위한 별도의 compositional 모델도 있는데, 원소 하나가 노드 하나이고 그 비율이 노드 특징이 된다.'},
 {h:'능동학습 루프: 생성→예측→DFT→재학습',
  lead:'GNN이 후보를 거르고 DFT가 검증한 결과를 다시 학습 데이터로 되먹임한다.',
  d:'후보 구조를 대량 생성 → GNN으로 안정성(형성 에너지, convex hull까지 거리) 예측 → 유망한 것만 골라 DFT로 실제 에너지 계산 → 그 결과를 학습셋에 추가해 다음 라운드 GNN을 재학습, 이 사이클을 6라운드 반복했다. DFT가 모델의 오답을 걸러주는 동시에 다음 모델을 위한 데이터 공장(flywheel) 역할을 한다. 이 구조는 [AlphaZero](#/p/alphazero)가 자기 대국 결과로 스스로를 개선하는 것과 같은 형태의 self-improving loop다 — 다만 대국 대신 DFT라는 값비싼 "정답 오라클"이 검증자 역할을 한다.'},
 {h:'후보 생성 두 갈래: 구조적 치환 vs 조성 기반 탐색',
  lead:'기존 구조를 대칭 인식 부분치환(SAPS)하거나, 조성만으로 무작위 구조 탐색(AIRSS)한다.',
  d:'구조적 파이프라인은 이미 알려진 결정에서 원소를 이온 치환하되, 기존 방식이 놓치던 **불완전 치환**까지 대칭을 인식하며 허용하는 SAPS(symmetry-aware partial substitutions)로 후보를 10⁹개 이상까지 늘렸다. 조성적 파이프라인은 구조 정보 없이 화학식만 GNN으로 걸러낸 뒤, 살아남은 조성에 대해 AIRSS(ab initio random structure searching)로 100개의 무작위 초기 구조를 만들어 DFT로 평가한다.'},
 {h:'딥 앙상블로 불확실성을 재고 test-time augmentation으로 안정화',
  lead:'10개 모델의 중앙값과 사분위범위로 불확실성을 재고, 격자를 80~120% 스케일링해 예측을 안정화한다.',
  d:'그래프 신경망은 학습 분포 밖 구조에서 예측이 불안정하다. 이를 보완하려 10개 모델을 앙상블해 평균 대신 **중앙값**을 예측치로, 사분위범위를 불확실성으로 쓴다. 또한 이완(relax)되지 않은 치환 직후 구조를 평가해야 하는 특성 때문에, 격자 부피를 80~120% 범위에서 20단계로 스케일링해 최솟값을 취하는 test-time augmentation으로 예측을 보정한다.'},
 {h:'스케일이 곧 일반화: out-of-distribution 정확도 상승',
  lead:'학습 데이터가 커질수록 5원소 이상 낯선 조합에서도 오차가 멱법칙으로 줄어든다.',
  d:'훈련 데이터를 4원소 이하로 제한해도, 데이터 규모를 키우면 학습에 없던 6원소 화합물에서까지 예측 오차가 꾸준히 줄었다(Fig. 1e). 언어·비전 모델의 스케일링 법칙과 같은 패턴이 재료과학 GNN에서도 나타난다는 것이 이 논문의 또 다른 핵심 주장이다.'}
],

diagram:{type:'loop', cap:'구조 파이프라인과 조성 파이프라인이 각각 GNN으로 후보를 거르고, DFT 계산 결과가 GNoME DB에 쌓이며 다음 라운드 학습 데이터가 된다.',
 center:'6라운드 능동학습',
 nodes:[
  {t:'후보 생성', s:'SAPS · AIRSS'},
  {t:'GNN 안정성 예측', s:'형성 에너지'},
  {t:'DFT 검증', s:'정답 오라클'},
  {t:'GNoME DB 갱신', s:'재학습 데이터'}
 ]},

math:[
 {expr:'m_v = (1/|N(v)|) * sum_{w in N(v)} f(h_v, h_w, e_vw)',
  tex:'m_v=\\frac{1}{|\\mathcal{N}(v)|}\\sum_{w\\in\\mathcal{N}(v)} f(h_v,h_w,e_{vw})',
  d:'메시지패싱 한 스텝의 핵심. 이웃 $\\mathcal{N}(v)$ 로부터 온 메시지를 **평균(정규화된 합)** 으로 모아 노드 $v$ 의 표현 $h_v$ 를 갱신한다. 원자 수가 다른 결정마다 이웃 수가 제각각이라, 단순 합 대신 평균 정규화가 학습을 안정시킨다.'},
 {expr:'E_hull(x) = E(x) - E_convex_hull(composition of x)',
  tex:'E_{\\text{hull}}(x)=E(x)-E_{\\text{convex hull}}(\\text{comp}(x))',
  d:'"안정하다"의 정의. 어떤 조성으로 분해했을 때 나올 수 있는 가장 낮은 에너지 조합(convex hull)보다 구조 $x$ 의 에너지가 낮거나 같으면(음수 또는 0) 열역학적으로 안정하다고 본다. GNN과 DFT 모두 이 거리를 예측·계산한다.'}
],

numbers:[
 {k:'신규 안정 구조', v:'약 220만 개', d:'기존 Materials Project 대비 안정한 것으로 예측된 구조 수'},
 {k:'갱신된 convex hull', v:'38.1만 개 신규 · 총 42.1만 개', d:'경쟁하는 구조끼리 걸러진 뒤 최종적으로 hull 위에 남은 안정 결정 수 — 기존 대비 약 10배'},
 {k:'최종 에너지 예측 오차', v:'11 meV/atom', d:'능동학습을 거친 최종 앙상블의 relaxed 구조 기준 MAE (초기 모델은 21 meV/atom)'},
 {k:'구조 기반 hit rate', v:'80% 이상', d:'후보가 실제로 안정 판정될 확률. 조성만 쓰면 33%(100회 시도당), 두 방식 모두 초기 3~6%에서 상승. 기존 연구는 약 1%'},
 {k:'실험적으로 검증된 구조', v:'736개', d:'예측된 안정 구조 중 독립적인 실험으로 이미 합성·확인된 것 (2.2백만 개 중 극히 일부)'},
 {k:'r²SCAN 재검증 안정 비율', v:'84%', d:'더 정확한 범함수(r²SCAN)로 이진·삼진 화합물을 재계산했을 때도 음의 phase-separation energy를 유지한 비율'}
],

impact:'GNoME 이후 알려진 안정 무기 결정의 수가 한 자릿수 이상 늘었고, 그 결과물(GNoME 데이터베이스)이 공개되어 태양전지·배터리·고체전해질 후보 스크리닝에 바로 쓰이기 시작했다. 대규모 DFT 궤적 데이터가 부산물로 쌓이면서 이를 학습한 등변(equivariant) [interatomic potential](#/p/mpnn)이 분자동역학 시뮬레이션에 쓸 수 있을 만큼 정확해졌다는 점도 중요한 파생 성과다. 방법론적으로는 "GNN 대리 모델 + 값비싼 시뮬레이터 검증 + 재학습"이라는 능동학습 루프가 재료과학에서도 스케일이 성능을 견인한다는 것을 실증했다.',

legacy:[
 '**공개 데이터셋으로서의 파급력** — GNoME이 발견한 안정 구조가 이후 [학습된 원자간 포텐셜](#/p/mpnn) 연구, 결정 생성 모델의 학습 데이터로 재사용됨',
 '**능동학습형 재료 발견의 표준화** — 이후 연구들이 "저렴한 GNN 필터 + 비싼 DFT 검증"이라는 동일한 루프를 다른 물성(이온 전도도, 촉매 활성 등)에 적용',
 '**"발견"과 "합성"의 간극이 새 연구 주제로** — 예측된 구조를 실제로 만들어 보는 자율 실험실(autonomous lab) 연구가 후속으로 이어짐',
 '**그래프 기반 과학 모델링의 확산** — 같은 시기의 [GraphCast](#/p/graphcast)(날씨)와 함께, 물리적 실체를 그래프로 표현해 GNN으로 시뮬레이션을 대체하는 흐름을 대표하는 사례로 자주 인용됨'
],

pitfalls:[
 '**"안정하다"는 열역학적 안정성이지 합성 가능성이 아니다.** DFT 기준 convex hull 아래에 있다는 것은 이론적으로 분해되지 않는다는 뜻일 뿐, 실제로 그 결정을 실험실에서 합성할 수 있는지는 별개 문제다. 220만 개 중 실험으로 검증된 것은 736개뿐이다.',
 '**예측-실험 간극이 이 분야의 핵심 병목으로 남는다.** GNN과 DFT 모두 계산 근사이며, 합성 경로·전구체·반응 조건 같은 실험적 제약은 이 파이프라인이 전혀 다루지 않는다.',
 '**기존 데이터베이스와의 중복·경쟁 관계에 주의.** 새로 발견된 구조도 서로 경쟁해 convex hull에서 밀려날 수 있고(논문 스스로 기존 "안정" 물질 5,000개 이상을 hull에서 밀어냄), GNoME 자체 결과도 미래 발견에 밀려날 수 있는 잠정적 안정성이다.'
],

figures:[
 {f:'fig1a-loop.png',
  cap:'구조 파이프라인(위)과 조성 파이프라인(아래)이 각각 GNN으로 후보의 안정성(Stability)을 거르고, 그 결과가 DFT로 넘어가 GNoME database에 쌓인다. 맨 아래 점선 화살표가 "Repeat for rounds of active learning" — 이 DB가 다시 GNN 학습에 쓰이는 것이 능동학습 루프의 실체다.',
  src:'원문 Figure 1a, p.81'},
 {f:'fig1e-accuracy.png',
  cap:'x축이 학습 데이터 규모(로그), y축이 학습 범위 밖(out-of-domain) 구조에 대한 평균절대오차(로그). 데이터가 10³에서 10⁷로 늘어나는 동안 오차가 꾸준히 줄어 GNoME(진한 점)이 Materials Project 기준 모델(연한 점)보다 항상 낮은 오차를 보인다 — 스케일이 곧 일반화 성능으로 이어짐을 보여주는 근거.',
  src:'원문 Figure 1e, p.81'}
],

quotes:[
 {t:'Here we show that graph networks trained at scale can reach unprecedented levels of generalization, improving the efficiency of materials discovery by an order of magnitude.',
  src:'Abstract, p.80'},
 {t:'The energy of the filtered candidates is computed using DFT, both verifying model predictions and serving as a data flywheel to train more robust models on larger datasets in the next round of active learning.',
  src:'본문 "Overview of generation and filtration", p.81'}
],

links:[
 {t:'Nature — Scaling deep learning for materials discovery', u:'https://www.nature.com/articles/s41586-023-06735-9'},
 {t:'DeepMind blog — Millions of new materials discovered with deep learning', u:'https://deepmind.google/discover/blog/millions-of-new-materials-discovered-with-deep-learning/'},
 {t:'GitHub — google-deepmind/materials_discovery', u:'https://github.com/google-deepmind/materials_discovery'}
]
});
