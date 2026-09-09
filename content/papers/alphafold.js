WIKI.paper({
slug:'alphafold',
venue:'Nature 2021',
authors:'Jumper et al. (DeepMind)',

tldr:'서열만 주어지면 아미노산 사슬이 어떤 3차원 구조로 접히는지 예측하는 문제를, CASP14에서 사실상 실험 정확도에 근접한 수준으로 풀어낸 논문. Evoformer라는 새 attention 블록으로 진화 정보(MSA)와 잔기 쌍 정보를 반복적으로 교환시키고, 그 결과를 structure module이 직접 3D 좌표로 변환한다.',

context:'단백질 구조 예측은 50년 넘게 열려 있던 문제였다. 실험적으로 구조가 밝혀진 단백질은 약 10만 개뿐인데, 알려진 서열은 수십억 개에 달해 격차가 컸다. 물리 기반 시뮬레이션(분자동역학)은 계산량이 감당이 안 됐고, 진화 정보 기반 접근(공진화 신호로 접촉 잔기 쌍을 추정)은 CASP13(2018)의 AlphaFold 1을 포함해 발전했지만 여전히 원자 수준 정확도에는 못 미쳤다. 특히 유사한 실험 구조(템플릿)가 없는 표적에서 기존 방법들의 정확도가 크게 떨어졌다. 이 논문은 [Transformer](#/p/transformer)의 attention을 MSA와 잔기 쌍 표현 사이의 정보 교환에 맞게 새로 설계하고, 구조 예측을 end-to-end 미분 가능한 파이프라인으로 통째로 학습시켜 이 격차를 좁혔다.',

ideas:[
 {h:'Evoformer: MSA와 pair 표현을 맞물려 갱신',
  lead:'같은 서열의 진화 정보(MSA)와 잔기 쌍 관계(pair)를 48블록 동안 서로 주고받으며 정제한다.',
  d:'입력 서열로 유전자 데이터베이스에서 상동 서열들을 모아 MSA(다중 서열 정렬)를 만들고, 이를 $N_{seq} \\times N_{res}$ 표현으로, 잔기 쌍 관계는 $N_{res} \\times N_{res}$ pair 표현으로 각각 만든다. Evoformer 블록은 row-wise/column-wise attention으로 MSA를 갱신하고, outer product mean으로 그 결과를 pair 표현에 흘려보내고, pair 표현이 다시 MSA attention의 bias로 되먹임되는 구조다. 이 왕복이 48블록 반복되며 두 표현이 서로를 계속 보정한다.'},
 {h:'Triangle update: 거리의 삼각부등식을 구조로 강제',
  lead:'잔기 쌍 $(i,j)$ 를 그래프의 edge로 보고, 삼각형 $(i,j,k)$ 단위로만 정보를 갱신한다.',
  d:'세 잔기 $i,j,k$ 사이의 거리는 삼각부등식을 만족해야 한다는 물리적 제약을 아키텍처에 직접 새겨 넣었다. pair 표현의 각 entry를 방향 있는 edge로 해석하고, `triangle multiplicative update`(비-attention 연산, edge $ik$·$kj$ 로 $ij$ 를 갱신)와 `triangle self-attention`(같은 노드를 공유하는 edge끼리 attention) 두 종류를 번갈아 적용한다. 논문은 두 방식을 결합했을 때가 둘 중 하나만 쓸 때보다 더 정확하다고 보고한다.'},
 {h:'Structure module과 IPA: 표현을 바로 좌표로',
  lead:'각 잔기를 강체(rigid body)로 보고 invariant point attention으로 회전·이동을 직접 예측한다.',
  d:'8블록짜리 structure module은 pair·single 표현을 받아 각 잔기의 backbone을 전역 좌표계에 대한 회전·이동(residue gas)으로 표현한다. `Invariant point attention(IPA)`은 3D 공간에서 query·key·value를 점(point)으로도 만들어, 좌표계를 회전·이동시켜도 attention 결과가 바뀌지 않도록(equivariance) 설계됐다. 이 과정을 반복하며 backbone frame을 갱신하고 마지막에 side-chain $\\chi$ 각도까지 예측해 전체 원자 좌표를 만든다.'},
 {h:'Recycling: 예측을 스스로 다시 입력한다',
  lead:'전체 네트워크가 만든 구조 예측을 다시 입력에 더해 최대 4회 반복 정제한다.',
  d:'한 번의 forward pass로 나온 pair·single 표현과 예측 구조를 다음 forward pass의 초기값에 더해 넣고 같은 네트워크를 다시 통과시킨다. 학습·추론 모두에서 반복 횟수만큼 그래디언트를 매번 다시 계산하지 않고 마지막 반복에서만 역전파해 비용을 억제했다. 반복이 거듭될수록 GDT가 개선되는 궤적을 논문이 직접 보여준다.'},
 {h:'FAPE 손실: 국소 좌표계 기준의 프레임 정렬 오차',
  lead:'모든 잔기의 국소 좌표계에서 원자 위치 오차를 재는 손실로 카이랄성까지 함께 학습한다.',
  d:'`Frame Aligned Point Error(FAPE)`는 각 잔기의 backbone frame $(R_k, t_k)$ 을 기준으로 다른 모든 원자의 좌표를 국소 좌표계로 변환한 뒤 예측과 정답의 차이를 잰다. 전역 정렬(예: RMSD 최적 정렬) 없이도 국소 구조 오차를 직접 벌점화하고, 좌표를 반사시키는 실수를 걸러내 아미노산의 카이랄성(손대칭)을 자연스럽게 강제한다.'}
],

diagram:{type:'stack', cap:'입력 서열 → MSA/템플릿 검색 → Evoformer(48블록, MSA↔pair 반복 갱신) → structure module(8블록, IPA) → 3D 좌표. 전체가 최대 4회 recycling.',
 layers:[
  {t:'입력 서열', s:'유전자 DB 검색'},
  {t:'MSA 표현', s:'Nseq × Nres × c'},
  {t:'Pair 표현', s:'Nres × Nres × c', note:'잔기 쌍 관계'},
  {t:'Evoformer', s:'48블록, 가중치 비공유', acc:true, note:'MSA↔pair 정보 교환'},
  {t:'Single 표현', s:'MSA 첫 행 복사'},
  {t:'구조 모듈', s:'8블록, IPA', note:'프레임 회전·이동 예측'},
  {t:'3D 구조 + pLDDT', s:'원자 좌표, 신뢰도'}
 ]},

math:[
 {expr:'FAPE = (1/N) Σ_frames Σ_atoms clamp( |T_frame^-1(x_pred) - T_frame^-1(x_true)| , 0, d_clamp )',
  tex:'\\text{FAPE}=\\frac{1}{N_{\\text{frames}}N_{\\text{atoms}}}\\sum_{k}\\sum_{i}\\text{clamp}\\!\\left(\\left\\|T_k^{-1}\\!\\circ x_i^{\\text{pred}} - T_k^{-1}\\!\\circ x_i^{\\text{true}}\\right\\|,\\,0,\\,d_{\\text{clamp}}\\right)',
  d:'프레임 $k$ 의 좌표계로 변환($T_k^{-1}$)한 뒤 원자 $i$ 의 예측·정답 위치 거리를 재고, 이상치가 학습을 망치지 않도록 $d_{clamp}$(보통 10Å)로 잘라낸다. 모든 프레임·원자 쌍에 대한 평균이 구조 예측의 핵심 손실이다.'},
 {expr:'IPA attention weight ∝ softmax( QKᵀ/√d - γ Σ_p |q_p - k_p|² )',
  tex:'w_{ij}\\propto\\text{softmax}\\!\\left(\\frac{q_i^{\\top}k_j}{\\sqrt{d}}-\\gamma\\sum_{p}\\left\\|R_iq_i^p+t_i-(R_jk_j^p+t_j)\\right\\|^2\\right)',
  d:'보통의 attention 점수(스칼라 내적)에, 3D 점 $q^p, k^p$ 를 각자의 프레임 $(R,t)$ 로 전역 좌표계에 놓은 뒤 그 거리를 뺀 항을 더한다. 프레임을 통째로 회전·이동시켜도 두 항 모두 값이 그대로라 attention이 좌표계 선택에 불변(invariant)이다.'}
],

numbers:[
 {k:'CASP14 backbone 정확도', v:'중앙값 0.96Å r.m.s.d.₉₅', d:'2위 방법은 2.8Å — 탄소 원자 지름(1.4Å)보다 오차가 작다'},
 {k:'CASP14 all-atom 정확도', v:'중앙값 1.5Å r.m.s.d.₉₅', d:'2위 방법은 3.5Å'},
 {k:'Evoformer 깊이', v:'48블록 (가중치 비공유)', d:'structure module은 8블록, 가중치 공유'},
 {k:'recycling', v:'최대 4회 반복', d:'그림 4a — 반복마다 GDT가 개선되는 궤적을 직접 관찰'},
 {k:'대형 단일 사슬 검증', v:'2,180잔기 (T1044)', d:'구조 상동체 없이도 올바른 도메인 배치 예측'},
 {k:'MSA 데이터베이스 제거 실험', v:'−6.1 GDT', d:'BFD·MGnify 등 MSA를 모두 빼면 정확도가 크게 떨어짐 — 서열만으로 접는 게 아니라는 근거'}
],

impact:'CASP14 평가위원단이 "구조 예측 문제가 사실상 풀렸다"고 평가할 만큼 격차가 컸고, 구조생물학 실험의 병목(수개월~수년의 결정화·냉동전자현미경 작업)을 계산으로 우회할 길을 열었다. DeepMind는 이후 UniProt 전체·인간 프로테옴 등 수억 개 구조 예측을 [AlphaFold Protein Structure Database](https://alphafold.ebi.ac.uk/)로 공개했고, 신약 개발·효소 설계·구조 기반 생물학 연구의 표준 도구가 됐다. 코드와 가중치가 오픈소스로 공개되면서 이 아키텍처를 그대로 재사용·변형하는 후속 연구가 폭발적으로 늘었다.',

legacy:[
 '**MSA 없는 예측** — [ESMFold](#/p/esmfold)는 언어모델의 표현으로 MSA 검색 단계를 대체해 속도를 크게 높임',
 '**생체분자 전반으로 확장** — [AlphaFold 3](#/p/alphafold3)는 diffusion 기반 구조 모듈로 단백질뿐 아니라 DNA·RNA·리간드 복합체까지 예측',
 '**오픈소스 생태계** — RoseTTAFold, OpenFold 등 Evoformer/IPA 설계를 재구현·변형한 대안 구현이 다수 등장',
 '**구조 기반 설계로 확산** — 단백질 구조 예측이 표준화되면서 역방향 문제인 단백질 설계(구조→서열) 연구가 이어서 활발해짐'
],

pitfalls:[
 '**"서열만으로 접힘을 푼다"는 과장이다.** 실제로는 [Evoformer](#/p/transformer) 입력 자체가 MSA·템플릿 같은 진화·구조 데이터베이스 검색 결과이고, 논문의 ablation에서 MSA 데이터베이스를 빼면 정확도가 6 GDT 넘게 떨어진다. 순수 단일 서열 입력 성능은 별개 문제다.',
 '**pLDDT·PAE는 "정확도"가 아니라 "모델이 스스로 매긴 신뢰도"다.** 특히 다중 도메인 단백질의 도메인 간 상대 배치나, 원래 유연한(intrinsically disordered) 영역에서는 낮은 pLDDT가 실제로 "그 부분이 유연하다"는 신호일 수도, 예측 실패일 수도 있어 해석에 주의가 필요하다.',
 '**예측 구조는 실험적으로 검증된 것이 아니다.** 논문의 벤치마크 자체는 실험 구조와 비교해 정확도를 측정한 것이지만, 데이터베이스에 대량으로 배포된 예측 구조 각각이 X-ray·Cryo-EM 검증을 거친 것은 아니므로 신뢰도 점수를 함께 확인하지 않고 실험 구조처럼 쓰면 안 된다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'입력 서열에서 유전자·구조 DB 검색으로 MSA와 템플릿을 얻어 MSA/pair 표현을 만들고, Evoformer(48블록)를 거쳐 structure module(8블록)이 3D 구조를 출력한다. 맨 아래 화살표가 recycling(3~4회 반복) 경로.',
  src:'원문 Figure 1e, p.2'},
 {f:'fig3-evoformer.png',
  cap:'Evoformer 블록 하나의 내부. 위쪽 경로가 MSA 표현을 row/column-wise attention으로 갱신하고, outer product mean으로 pair 표현에 정보를 넘긴다. 아래쪽 경로가 pair 표현을 triangle update·triangle self-attention 네 종류로 갱신한다.',
  src:'원문 Figure 3a, p.4'}
],

quotes:[
 {t:'Here we provide the first computational method that can regularly predict protein structures with atomic accuracy even in cases in which no similar structure is known.',
  src:'Abstract, p.583'},
 {t:'We demonstrate accuracy competitive with experimental structures in a majority of cases and greatly outperforming other methods.',
  src:'Abstract, p.583'}
],

links:[
 {t:'Nature — Highly accurate protein structure prediction with AlphaFold', u:'https://www.nature.com/articles/s41586-021-03819-2'},
 {t:'AlphaFold Protein Structure Database', u:'https://alphafold.ebi.ac.uk/'},
 {t:'DeepMind — AlphaFold 발표 글', u:'https://deepmind.google/discover/blog/alphafold-a-solution-to-a-50-year-old-grand-challenge-in-biology/'}
]
});
