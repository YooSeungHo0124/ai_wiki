WIKI.paper({
slug:'mpnn',
venue:'ICML 2017',
authors:'Gilmer, Schoenholz, Riley, Vinyals, Dahl (Google Brain · Google · Google DeepMind)',
arxiv:'1704.01212',

tldr:'[GCN](#/p/gcn)을 포함해 서로 다른 이름으로 제안돼 온 그래프 신경망들을 **메시지 함수 $M$ · 갱신 함수 $U$ · readout 함수 $R$** 세 개로 이루어진 하나의 공통 프레임워크(MPNN)로 재정리하고, 분자의 양자화학 성질 예측에서 DFT 계산을 초당 $10^5$ 배 빠르게 근사했다.',

context:'2017년 시점에 그래프 위에서 동작하는 신경망은 [GCN](#/p/gcn), Gated Graph Neural Network, Interaction Networks, Molecular Graph Convolutions 등 서로 다른 논문·다른 표기법·다른 이름으로 흩어져 있었다. 저자들이 지적하듯 이들은 모두 "이웃으로부터 정보를 모아 정점 상태를 갱신한다"는 같은 동작을 하고 있었지만, 그 유사성이 표기법 차이에 가려 잘 보이지 않았다. 동시에 응용 쪽에서는 분자의 양자화학적 성질(에너지·HOMO/LUMO 등)을 정확히 계산하는 DFT(밀도범함수이론) 시뮬레이션이 분자 하나당 몇 시간까지 걸려, 신약 개발 같은 대규모 스크리닝에 병목이었다. 질문은 두 갈래다 — **① 이 흩어진 GNN들을 하나의 언어로 통합할 수 있는가, ② 그 통합된 모델이 DFT를 대체할 만큼 정확하고 빠른가?**',

ideas:[
 {h:'메시지 패싱 프레임워크: M, U, R 세 함수',
  lead:'모든 GNN을 메시지 함수 $M$, 정점 갱신 함수 $U$, 그래프 readout 함수 $R$의 조합으로 표현한다.',
  d:'$T$ 스텝 동안 각 정점 $v$ 는 이웃 $w \\in \\mathcal N(v)$ 로부터 메시지 $m_v^{t+1}=\\sum_w M_t(h_v^t, h_w^t, e_{vw})$ 를 받아 $h_v^{t+1}=U_t(h_v^t, m_v^{t+1})$ 로 상태를 갱신하는 **메시지 패싱 단계**를 거친 뒤, 그래프 전체 표현 $\\hat y = R(\\{h_v^T \\mid v \\in G\\})$ 를 만드는 **readout 단계**로 끝난다. [GCN](#/p/gcn)·GG-NN·Interaction Networks·Molecular Graph Convolutions 등 최소 8개의 기존 모델이 $M,U,R$ 을 각기 다르게 고른 MPNN의 특수 사례임을 보인다.'},
 {h:'간선 특징을 메시지 함수에 직접 넣는다',
  lead:'원자쌍 사이 결합·거리 정보를 $M(h_v,h_w,e_{vw})$ 의 입력으로 명시적으로 반영한다.',
  d:'분자 그래프는 정점(원자)뿐 아니라 간선(결합 종류·원자간 거리)에도 중요한 정보가 있다. 저자들이 실험에서 가장 좋은 성능을 낸 edge network 메시지 함수는 $M(h_v,h_w,e_{vw}) = A(e_{vw})h_w$ 로, 간선 특징 $e_{vw}$ 를 신경망으로 $d\\times d$ 행렬로 변환해 이웃 상태 $h_w$ 에 곱한다 — 간선마다 다른 선형변환을 쓰는 셈이다.'},
 {h:'set2set readout: 순서에 무관하되 표현력은 유지',
  lead:'단순 합·평균 대신 attention 기반 LSTM(set2set)으로 정점 집합을 그래프 벡터로 압축한다.',
  d:'readout $R$ 은 정점 순서에 불변해야 하는데, 단순 합/평균은 정보 손실이 크다. Vinyals et al.의 set2set 모델을 readout으로 써서, 여러 스텝 동안 attention으로 정점 표현들을 반복 조회하며 정보를 압축한 그래프 수준 벡터를 만든다. 이 선택이 GG-NN 기본 readout보다 일관되게 더 좋은 성능을 냈다.'},
 {h:'towers: 큰 은닉 차원을 여러 병렬 복사본으로 분할',
  lead:'차원 $d$ 를 $k$개의 독립 메시지 패싱 복사본으로 쪼개 계산량은 유지하며 파라미터를 늘린다.',
  d:'은닉 차원을 그대로 키우면 메시지 함수(특히 행렬곱 형태)의 파라미터 수가 $d^2$ 로 급증한다. 대신 $d$ 를 $k$개의 더 작은 "tower"로 나눠 각자 독립적으로 메시지 패싱을 수행한 뒤 결과를 합치면, 같은 파라미터 예산으로 더 많은 표현력을 얻으면서 동일 파라미터 수 기준 추론 시간도 약 2배 빨라졌다.'}
],

diagram:{type:'flow', cap:'메시지 패싱 T스텝(이웃 메시지 합산→상태 갱신 반복) 후 readout으로 그래프 전체 벡터를 얻는다.',
 nodes:[
  {t:'분자 그래프', s:'원자=정점, 결합=간선'},
  {t:'메시지 함수 M', s:'이웃별 메시지 계산', acc:true},
  {t:'상태 갱신 U', s:'h ← U(h, Σ메시지)'},
  {t:'T 스텝 반복', s:'가중치 공유 가능'},
  {t:'readout R', s:'set2set 등'},
  {t:'예측 ŷ', s:'분자 성질 (E, ω₀…)'}
 ]},

math:[
 {expr:'m_v^{t+1} = Σ_{w∈N(v)} M_t(h_v^t, h_w^t, e_vw)',
  tex:'m_v^{t+1}=\\sum_{w\\in \\mathcal N(v)} M_t\\big(h_v^t,\\,h_w^t,\\,e_{vw}\\big)',
  d:'정점 $v$ 가 매 스텝 이웃들로부터 받는 메시지의 합. $M_t$ 는 학습되는 신경망으로, 이웃의 상태·자신의 상태·둘 사이 간선 특징을 모두 입력으로 받는다.'},
 {expr:'h_v^{t+1} = U_t(h_v^t, m_v^{t+1})',
  tex:'h_v^{t+1}=U_t\\big(h_v^t,\\,m_v^{t+1}\\big)',
  d:'받은 메시지로 자신의 은닉 상태를 갱신한다. $T$번 반복하면 각 정점의 표현에 최대 $T$홉 떨어진 이웃까지의 정보가 누적된다.'},
 {expr:'ŷ = R({ h_v^T | v ∈ G })',
  tex:'\\hat y = R\\big(\\{h_v^T \\mid v \\in G\\}\\big)',
  d:'모든 정점의 최종 상태 집합을 정점 순서에 불변한 함수 $R$ 로 압축해 그래프 수준의 예측(분자 성질)을 얻는다. $R$ 이 순서 불변이어야 그래프 동형(isomorphism)에 대해 결과가 바뀌지 않는다.'}
],

numbers:[
 {k:'DFT 대비 추론 속도', v:'약 10⁵배', d:'분자 하나당 DFT ~10³초 vs MPNN ~10⁻²초'},
 {k:'화학적 정확도 달성', v:'13개 중 11개 타깃', d:'QM9 데이터셋, 최고 모델 기준'},
 {k:'SOTA 달성', v:'13개 타깃 전부', d:'기존 발표된 방법들 대비 모든 목표 성질에서 최고 성능'},
 {k:'QM9 분자 수', v:'약 13만 개', d:'최대 9개 heavy atom을 가진 유기 분자'},
 {k:'towers 적용 시 속도', v:'약 2배', d:'k=9, d=200 조건에서 k=1 대비 동일 파라미터로 추론 가속'}
],

impact:'GCN·GG-NN·Interaction Networks처럼 따로 발전하던 그래프 신경망들을 **하나의 설계 공간(메시지 함수·갱신 함수·readout 함수의 선택)**으로 통합해, 이후 연구가 "완전히 새 아키텍처"가 아니라 "이 세 함수 중 무엇을 바꿀까"라는 문제로 재구성되게 만들었다. 화학 응용에서는 DFT라는 정확하지만 느린 시뮬레이션을 신경망으로 근사해 분자 스크리닝의 속도를 몇 자릿수 끌어올릴 수 있음을 실증하며, 분자 특성 예측·신약 후보 스크리닝에 GNN을 쓰는 흐름을 열었다.',

legacy:[
 '**"메시지 패싱"이 GNN의 표준 어휘가 됨** — 이후 대부분의 그래프 신경망 논문이 자기 모델을 MPNN 프레임의 $M, U, R$ 선택으로 설명',
 '**attention을 메시지 함수에 도입** — [GAT](#/p/gat)는 메시지 합산을 균등/고정 가중치가 아닌 학습된 attention 가중치 합으로 대체',
 '**표현력의 상한 규명** — [GIN](#/p/gin)이 메시지 패싱 GNN 전체가 Weisfeiler-Lehman 테스트를 넘어설 수 없음을 증명하며, MPNN 프레임의 이론적 한계를 정리',
 '**분자 표현학습의 표준 베이스라인화** — 이후 소재·신약 개발 분야 GNN 연구 대부분이 MPNN 계열을 기본 비교 대상으로 채택'
],

pitfalls:[
 '**$T$ 스텝(메시지 패싱 층수)이 곧 수용 범위(receptive field)를 결정한다.** $T$ 홉보다 먼 원자 간 상호작용은 원리적으로 포착할 수 없고, $T$ 를 키우면 [GCN](#/p/gcn)과 마찬가지로 over-smoothing·계산 비용 증가 문제가 함께 온다.',
 '**readout이 순서 불변이어야 한다는 제약을 깨면 그래프 동형에 대해 다른 답을 낼 수 있다.** 단순 concat 같은 순서 의존적 readout을 쓰면 같은 분자를 다른 원자 순서로 넣었을 때 예측이 달라지는 버그로 이어질 수 있다.',
 '**MPNN은 프레임워크지 알고리즘이 아니다.** "MPNN을 썼다"는 말만으로는 성능이 보장되지 않는다 — 메시지 함수·readout 선택(예: edge network + set2set)에 따라 QM9 성능이 크게 갈린다는 것이 이 논문의 실험 결과이기도 하다.'
],

figures:[
 {f:'fig1-dft-vs-mpnn.png',
  cap:'같은 분자(왼쪽 회색 원)를 위쪽 경로(DFT 계산, ~10³초)와 아래쪽 경로(Message Passing Neural Net, ~10⁻²초)로 처리해 같은 목표값(E, ω₀ 등)을 예측한다. 아래쪽 회색 상자 안 세 개의 분자 그림은 메시지 패싱이 반복되며 원자(점)의 상태가 갱신되는 과정을 나타낸다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'In this paper, we reformulate existing models into a single common framework we call Message Passing Neural Networks (MPNNs) and explore additional novel variations within this framework.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1704.01212 — Neural Message Passing for Quantum Chemistry', u:'https://arxiv.org/abs/1704.01212'}
]
});
