WIKI.paper({
slug:'alphafold3',
venue:'Nature 630, 493–500 (2024)',
authors:'Abramson, Adler, Dunger, Evans, Green et al. (Google DeepMind · Isomorphic Labs)',

tldr:'단백질만 접던 [AlphaFold](#/p/alphafold)를 DNA·RNA·리간드·이온까지 예측하는 범용 모델로 확장한 논문. Evoformer를 단순화한 Pairformer로 pair representation을 만들고, 최종 좌표는 [DDPM](#/p/ddpm) 계열 diffusion 모델로 직접 생성해 도킹 전용 도구들을 큰 폭으로 앞섰다.',

context:'[AlphaFold2](#/p/alphafold)는 단백질 단일 사슬과 그 변형(멀티머)의 구조를 뛰어난 정확도로 예측했지만, 구조는 아미노산 고유의 backbone frame과 side-chain torsion angle로 파라미터화되어 있었다. 이 표현은 단백질에는 맞지만 리간드·핵산·이온처럼 화학적으로 이질적인 분자에는 그대로 쓸 수 없다. 그래서 단백질-리간드 결합은 여전히 AutoDock Vina 같은 전용 도킹 도구가, 단백질-핵산 복합체는 RoseTTAFoldNA 같은 전용 예측기가 따로 맡고 있었고, 이런 특화 도구들의 정확도도 물리 기반 방법에 못 미치는 경우가 많았다. AlphaFold 3(AF3)는 "구조를 원자 좌표로 직접 생성하면 분자 종류에 무관한 하나의 모델로 통합할 수 있지 않을까"라는 질문에서 출발한다.',

ideas:[
 {h:'Pairformer: Evoformer를 pair 중심으로 축소',
  lead:'MSA 처리를 4블록으로 줄이고 이후 처리는 pair representation만으로 진행한다.',
  d:'AlphaFold2의 Evoformer는 MSA representation과 pair representation을 번갈아 갱신했다. AF3는 MSA 임베딩 블록을 4개로 크게 줄이고 pair-weighted averaging 같은 저비용 연산만 남긴 뒤, MSA representation 자체는 더 유지하지 않는다. 이후 처리를 전담하는 Pairformer는 pair representation과 single representation만 받아 48블록을 쌓는데, triangle update·triangle self-attention 같은 pair 처리 방식은 AlphaFold2와 거의 그대로다.'},
 {h:'Diffusion Module: 좌표를 직접 생성한다',
  lead:'backbone frame·torsion 표현을 버리고 원자 좌표에 노이즈를 씌웠다 벗기는 과정으로 구조를 만든다.',
  d:'AlphaFold2의 Structure Module은 아미노산별 backbone frame과 side-chain torsion angle로 구조를 표현했다. AF3는 이를 버리고 raw atom coordinate에 직접 노이즈를 더한 뒤 원래 좌표를 맞히도록 학습하는 [DDPM](#/p/ddpm) 계열 diffusion 모델로 대체했다. 회전·이동에 대한 equivariance 제약도 없앴다 — 노이즈를 씌우고 벗기는 과정 자체가 다양한 스케일의 구조(국소 결합 기하부터 전체 fold까지)를 배우게 만들기 때문에, 별도의 입체화학 위반 손실(stereochemical violation loss)이나 torsion 파라미터화 없이도 임의의 화학 구조를 다룰 수 있다.'},
 {h:'생성 모델이라 답이 확률분포다',
  lead:'같은 입력도 노이즈 시드에 따라 다른 구조가 나오는 대신 국소 기하는 항상 또렷하다.',
  d:'diffusion 학습은 결정론적 회귀가 아니라 생성적 절차이므로 출력이 하나의 정답이 아니라 분포다. 그 덕에 모델이 전체적으로 불확실한 영역(예: 유연한 loop)에서도 국소적인 결합 길이·각도 같은 세부 기하는 항상 그럴듯하게 나온다. 반대로 하나의 정답 구조를 기대하고 한 번만 샘플링하면 매번 다른 결과를 볼 수 있다는 뜻이기도 하다.'},
 {h:'Cross-distillation으로 환각 구조를 억제',
  lead:'AlphaFold-Multimer가 예측한 무질서 영역의 늘어진 loop를 학습 데이터로 섞어 환각을 줄인다.',
  d:'생성 모델은 정답이 없는 무질서 영역에서도 그럴듯해 보이는 가짜 구조(hallucination)를 만들어내는 경향이 있다. AF3는 AlphaFold-Multimer v2.3이 예측한 구조 — 무질서 영역을 뭉친 덩어리 대신 늘어진 리본 형태로 표현하는 경향이 있다 — 를 학습 데이터에 섞는 cross-distillation으로 이 행동을 모방하게 만들어 환각을 크게 줄였다.'},
 {h:'단백질·핵산·리간드·이온을 하나의 토큰 체계로',
  lead:'서로 다른 화학종을 같은 트렁크에 넣어 PDB 대부분의 분자 유형을 한 모델로 예측한다.',
  d:'입력 임베더가 서열·리간드 SMILES·공유결합 정보를 함께 받아 단백질, DNA, RNA, 이온, 보조인자(cofactor), 변형 잔기(modified residue)를 같은 pair/single representation 위에서 처리한다. PoseBusters(리간드), CASP15 RNA, 공유 변형(글리코실화 등), 항체-항원 복합체까지 사실상 PDB에 등장하는 거의 모든 분자 유형을 별도 특화 모델 없이 한 네트워크로 다룬다.'}
],

diagram:{type:'stack', cap:'추론 시 파이프라인. Evoformer 자리를 Pairformer가, Structure Module 자리를 Diffusion Module이 대체했다.',
 layers:[
  {t:'입력 임베더', s:'서열·리간드·공유결합'},
  {t:'Template/MSA', s:'2블록 + 4블록 (축소)'},
  {t:'Pairformer', s:'48블록', acc:true, note:'pair·single만 갱신'},
  {t:'Diffusion 모듈', s:'노이즈→좌표, 3+24+3블록', acc:true, note:'원자 좌표 직접 생성'},
  {t:'Confidence 모듈', s:'pLDDT·PAE·PDE'}
 ]},

math:[
 {expr:'x_t = x_0 + σ·ε,  ε ~ N(0, I)',
  tex:'\\hat{x}_\\theta(x_t,\\sigma) \\approx x_0,\\qquad x_t = x_0 + \\sigma\\,\\epsilon,\\ \\ \\epsilon\\sim\\mathcal{N}(0,I)',
  d:'AF3의 diffusion module은 [DDPM](#/p/ddpm)의 이산 β-스케줄 대신 Karras 등의 elucidated diffusion model(EDM) 관례를 따라, 노이즈 수준 $\\sigma$ 를 더한 원자 좌표 $x_t$ 에서 원래 좌표 $x_0$ 를 직접 회귀하도록 네트워크 $\\hat{x}_\\theta$ 를 학습시킨다.'},
 {expr:'낮은 σ → 국소 기하, 높은 σ → 전체 구조',
  tex:'\\mathbb{E}_{\\sigma}\\Big[\\lambda(\\sigma)\\,\\lVert \\hat{x}_\\theta(x_0+\\sigma\\epsilon,\\ \\sigma) - x_0 \\rVert^2\\Big]',
  d:'노이즈 수준 $\\sigma$ 를 다양하게 샘플링해 학습하면, 낮은 $\\sigma$ 에서는 결합 길이 같은 국소 입체화학을, 높은 $\\sigma$ 에서는 도메인 배치 같은 전역 구조를 배우도록 강제된다. 추론 시에는 순수 노이즈에서 시작해 이 과정을 여러 번 반복 적용(recurrent denoising)해 최종 구조를 만든다.'}
],

numbers:[
 {k:'PoseBusters 성공률', v:'AF3 76% vs Vina 52%', d:'리간드 428개, pocket-aligned RMSD < 2Å 기준(2019 cutoff 모델)'},
 {k:'Pairformer 블록 수', v:'48개', d:'AlphaFold2 Evoformer의 pair 처리 규모를 거의 유지, MSA 블록만 4개로 축소'},
 {k:'Diffusion Module 구조', v:'3+24+3 블록', d:'원자 단위 local attention(3+3)과 토큰 단위 global attention(24)의 조합'},
 {k:'항체-항원 정확도', v:'AF3 > AlphaFold-Multimer v2.3', d:'protein-antibody 클러스터 65개, seed 수를 1000까지 늘려도 정확도가 계속 개선'},
 {k:'키랄성 위반율', v:'4.4%', d:'PoseBusters 벤치마크에서 순위 시 페널티를 줘도 남는 위반 비율'},
 {k:'학습 배치', v:'256 샘플 × diffusion 샘플 48개(초기)', d:'파인튜닝 단계에서는 샘플당 32개로 축소, crop size 384→640→768'}
],

impact:'AF3는 "구조 예측"과 "도킹"을 하나의 문제로 통합했다. 리간드 결합 포즈는 전용 도킹 소프트웨어의 영역이었고, 핵산 구조는 또 다른 전용 예측기의 영역이었지만, AF3 이후로는 이런 문제들이 원자 좌표를 생성하는 하나의 diffusion 트렁크의 특수 사례가 됐다. Isomorphic Labs와의 공동 저술이 보여주듯 신약 개발 파이프라인에서 단백질-리간드 상호작용을 직접 모델링할 수 있게 된 것도 실무적 파급이 크다. 다만 상업적 이용은 무료 AlphaFold Server를 통한 비영리 연구 목적으로 제한된다.',

legacy:[
 '**구조 예측의 diffusion화** — AlphaFold2류의 explicit frame/torsion 표현을 버리고 좌표를 직접 생성하는 흐름이 이후 여러 생체분자 모델 설계에 영향을 줌',
 '**오픈소스 재현** — OpenFold 계열을 비롯한 커뮤니티 재구현이 뒤따르며 Pairformer·diffusion module 조합이 검증됨',
 '**신약 개발 결합** — Isomorphic Labs가 이 아키텍처를 신약 후보 물질 스크리닝에 바로 적용하며 연구용 구조 예측과 산업 파이프라인의 경계가 흐려짐',
 '**평가 벤치마크의 표준화** — PoseBusters가 "물리적으로 타당한 포즈"를 강제하는 리간드 도킹 평가의 기준으로 자리잡음'
],

pitfalls:[
 '**같은 입력도 매번 다른 구조가 나올 수 있다.** diffusion 기반 생성이라 결정론적이지 않으며, 논문 스스로도 항체-항원처럼 어려운 케이스는 seed를 1000개까지 늘려야 정확도가 계속 오른다고 보고한다 — 한 번의 샘플링 결과를 유일한 정답으로 오해하면 안 된다.',
 '**confidence score(pLDDT·pTM·ipTM·PAE)는 정확도의 근사치일 뿐 보장이 아니다.** 논문은 이 점수들이 실제 정확도와 잘 보정(calibrated)되어 있다고 보이지만, 이는 평가셋에서의 상관관계이지 개별 예측이 항상 옳다는 뜻은 아니다.',
 '**리간드·핵산 예측은 여전히 단백질 예측보다 부정확하다.** 저자들도 model limitations 절에서 키랄성 위반(4.4%), 균질 다합체에서의 원자 겹침(clash), 무질서 영역의 환각(hallucination) 등을 직접 밝히고 있다.',
 '**정적 구조만 예측한다.** 여러 random seed를 돌려도 그것이 용액 상태의 conformational ensemble을 근사하지는 않는다 — 동적 거동이나 다중 conformational state(예: 열림/닫힘 상태 전환)는 별도 처리 없이는 한쪽 상태로만 수렴할 수 있다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'추론 파이프라인 전체 흐름. 왼쪽 입력 임베더 이후 Template/MSA 모듈(작게 축소)을 거쳐 Pairformer(48블록)가 pair·single representation을 갱신하고, 그 표현을 조건으로 Diffusion Module이 순수 노이즈(회색 점구름)에서 시작해 반복적으로(Diffusion iterations, 녹색 점선) 원자 좌표를 생성한다. 파란 Recycling 점선은 트렁크 반복.',
  src:'원문 Figure 1d, p.2'},
 {f:'fig1-benchmarks.png',
  cap:'네 개 패널이 각각 리간드(PoseBusters), 핵산, 공유 변형, 단백질 카테고리에서 AF3(하늘색)와 기존 전용 도구를 비교한다. 막대는 성공률(%), 오차선은 95% 신뢰구간, ***는 p<0.001. 왼쪽 첫 패널만 봐도 AF3가 AutoDock Vina·RoseTTAFold All-Atom을 20%p 이상 앞선다.',
  src:'원문 Figure 1c, p.2'}
],

quotes:[
 {t:'In this paper, we describe our AlphaFold 3 model with a substantially updated diffusion-based architecture, which is capable of joint structure prediction of complexes including proteins, nucleic acids, small molecules, ions, and modified residues.',
  src:'Abstract, p.1'},
 {t:'We use a relatively standard diffusion approach in which the diffusion model is trained to receive "noised" atomic coordinates then predict the true coordinates.',
  src:'Main text, p.4 (line 101–103)'}
],

links:[
 {t:'Nature — Accurate structure prediction of biomolecular interactions with AlphaFold 3', u:'https://www.nature.com/articles/s41586-024-07487-w'},
 {t:'GitHub — google-deepmind/alphafold3', u:'https://github.com/google-deepmind/alphafold3'},
 {t:'AlphaFold Server', u:'https://alphafoldserver.com/'}
]
});
