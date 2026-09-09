WIKI.paper({
slug:'two-tower',
venue:'RecSys 2019',
authors:'Yi, Yang, Hong, Cheng, Heldt, Kumthekar, Zhao, Wei, Chi (Google)',

tldr:'대규모 후보 생성 모델에서 배치 안 네거티브(in-batch negative)를 쓰면 **인기 아이템일수록 부당하게 더 많이 벌점을 받는다**는 편향을 수학적으로 짚어내고, 스트리밍 데이터에서 아이템 등장 빈도를 실시간 추정해 이를 보정하는 방법을 제시한 논문. [YouTube DNN](#/p/youtube-dnn)의 후보 생성 아이디어를 사용자·아이템 두 개의 독립된 타워로 재구성해 서빙 구조까지 규격화했다.',

context:'[YouTube DNN](#/p/youtube-dnn)이 정립한 후보 생성 단계는 사용자·문맥을 임베딩 `u`로, 후보 아이템을 임베딩 `v`로 만들어 내적으로 관련도를 매기는 방식이었다. 이를 일반화하면 **두 개의 독립된 신경망(타워)**으로 나뉜다 — 사용자 타워와 아이템 타워. 그런데 수백만~수십억 아이템 코퍼스에서는 매 스텝 전체 코퍼스에 대해 softmax 정규화 상수를 계산할 수 없어, 같은 미니배치 안의 다른 샘플들을 네거티브로 재사용하는 **in-batch softmax**가 실무 표준이 됐다. 문제는 배치가 보통 실제 노출 로그에서 뽑히기 때문에, 파워로우 분포를 따르는 인기 아이템이 네거티브로 뽑힐 확률도 그만큼 높다는 것이다. 그 결과 인기 아이템의 임베딩은 실제보다 훨씬 자주 "틀린 답"으로 벌점을 받는다.',

ideas:[
 {h:'Two-Tower: 사용자와 아이템을 완전히 분리한다',
  lead:'입력을 섞지 않고 두 신경망이 각자 임베딩을 만든 뒤 내적만 공유한다.',
  d:'쿼리(사용자+문맥) 피처 `x`는 타워 `u(x,θ)`가, 아이템 피처 `y`는 타워 `v(y,θ)`가 각각 `k`차원 임베딩으로 매핑하고, 점수는 `s(x,y) = ⟨u(x,θ), v(y,θ)⟩`뿐이다. [NCF](#/p/ncf)처럼 두 임베딩을 concat해 MLP에 태우는 구조와 달리 **아이템 임베딩을 사용자와 독립적으로 미리 계산**할 수 있어, 서빙 시 코퍼스 전체의 아이템 벡터를 미리 인덱싱해두고 사용자 벡터 하나로 근접 탐색만 하면 된다.'},
 {h:'in-batch softmax의 인기 편향을 수식으로 드러낸다',
  lead:'배치 내 네거티브 샘플링 확률이 곧 softmax 손실에 새는 편향이 된다는 것을 밝힌다.',
  d:'배치 안 아이템만으로 만든 softmax `P_B(y_i|x_i)`는 파워로우 분포에서 뽑힌 배치를 쓰므로 전체 코퍼스에 대한 softmax와 다르다. 인기 아이템일수록 배치에 네거티브로 낄 확률 `p_j`가 커서 그만큼 더 많이 벌점을 받고, 결과적으로 그 임베딩이 실제보다 밀려난다. 이 편향은 배치 크기를 키운다고 사라지지 않고, 표본 분포 자체에서 나온다.'},
 {h:'logQ correction: 등장 확률만큼 로짓을 깎는다',
  lead:'각 네거티브 로짓에서 log(등장확률)을 빼 배치 내 softmax를 전체 코퍼스 softmax에 근접시킨다.',
  d:'sampled softmax의 logQ correction에서 착안해 `s_c(x,y_j) = s(x,y_j) - log(p_j)`로 로짓을 보정한다. 자주 뽑히는 아이템일수록 `log(p_j)`가 커서 로짓이 더 많이 깎이므로, 인기라는 이유만으로 받던 과도한 벌점이 상쇄된다. 보정된 로짓으로 만든 손실이 이 논문의 핵심 학습 목적함수다.'},
 {h:'스트리밍 빈도 추정: 고정 사전 없이 실시간으로 p_j를 잰다',
  lead:'전역 스텝과 해시 배열만으로 분산 학습 중에도 아이템 등장 빈도를 근사한다.',
  d:'고정된 아이템 사전을 가정할 수 없는 스트리밍 환경(신규 영상이 계속 유입)에서는 `p_j`를 미리 셀 수 없다. 대신 아이템을 해시해 배열 `A`(마지막으로 등장한 스텝)·`B`(등장 간격의 이동평균 `δ`)에 기록하고, `p̂ = 1/B[h(y)]`로 확률을 근사한다. 전역 스텝을 공유하는 것만으로 여러 워커가 암묵적으로 동기화되고, 이동평균이라 분포 변화에도 적응한다.'},
 {h:'순차 학습으로 분포 이동에 대응한다',
  lead:'신선한 영상·변하는 인기도를 반영하기 위해 스트리밍 데이터를 그대로 흘려 학습한다.',
  d:'YouTube 서빙 시스템은 새 데이터가 도착하는 대로 이어서 학습하는 순차 학습(sequential training)을 쓰고, 빈도 추정 알고리즘이 여기 자연스럽게 통합된다. 인덱스도 몇 시간마다 주기적으로 재구축해, 신규 업로드 영상이 최근접 이웃 탐색 대상에 계속 편입되게 한다.'}
],

diagram:{type:'compare', cap:'같은 임베딩 내적 구조 안에서, 배치 내 인기 편향을 그대로 두느냐 보정하느냐가 갈린다.',
 left:{t:'보정 없는 in-batch', items:['배치 내 아이템만 네거티브로 사용','인기 아이템일수록 과도하게 벌점','추천 품질 저하']},
 right:{t:'편향 보정 in-batch', items:['logQ correction으로 로짓 보정','스트리밍 빈도 추정 p̂ 사용','인기 편향 상쇄']}},

math:[
 {expr:'s(x, y) = ⟨u(x, θ), v(y, θ)⟩',
  tex:'s(x, y) = \\langle u(x,\\theta),\\, v(y,\\theta) \\rangle',
  d:'두 타워의 출력 임베딩을 내적한 값이 유일한 상호작용 신호다. 이 형태여야 아이템 임베딩 `v(y,θ)`를 사용자와 무관하게 미리 계산해 인덱싱할 수 있다.'},
 {expr:'s_c(x_i, y_j) = s(x_i, y_j) - log(p_j)',
  tex:'s_c(x_i, y_j) = s(x_i, y_j) - \\log(p_j)',
  d:'배치 내 아이템 `y_j`가 네거티브로 뽑힐 확률 `p_j`의 로그를 로짓에서 뺀다. `p_j`가 클수록(인기 아이템일수록) 더 많이 깎여 편향이 상쇄된다.'},
 {expr:'B[h(y)] ← (1-α)·B[h(y)] + α·(t - A[h(y)]),   p̂ = 1 / B[h(y)]',
  tex:'B[h(y)] \\leftarrow (1-\\alpha)\\,B[h(y)] + \\alpha\\,(t - A[h(y)]),\\qquad \\hat p = \\dfrac{1}{B[h(y)]}',
  d:'아이템 `y`가 스텝 `t`에 등장할 때마다 마지막 등장 이후 간격으로 이동평균 `B`를 갱신한다. `B`는 평균 등장 간격 `δ`의 추정치이므로 `1/δ`가 곧 등장 확률의 근사가 된다.'}
],

numbers:[
 {k:'Wikipedia Recall@50', v:'correct-sfx 0.5322 vs plain-sfx 0.4586', d:'τ=0.05 동일 조건, 보정만으로 유의미한 격차'},
 {k:'Wikipedia vs mse-gramian', v:'0.5322 vs 0.1338', d:'행렬분해 계열 baseline 대비 batch softmax 계열이 압도적'},
 {k:'YouTube 학습 데이터', v:'일일 수십억 클릭 로그', d:'여러 날에 걸친 스트리밍 학습'},
 {k:'YouTube 타워 구조', v:'3층 DNN [1024,512,128]', d:'두 타워 모두 동일 크기, Adagrad lr 0.2, batch 8192'},
 {k:'빈도 추정 설정', v:'H=50M, α=0.01 (YouTube)', d:'해시 배열 크기와 이동평균 학습률'},
 {k:'YouTube 라이브 A/B', v:'참여 지표 +0.37% (correct-sfx) vs +0.20% (plain-sfx)', d:'보정이 실제 서비스 트래픽에서도 우위'}
],

impact:'이 논문은 "임베딩 내적 + 서빙 시 최근접 이웃"이라는 [YouTube DNN](#/p/youtube-dnn)의 레시피를 사용자·아이템 두 타워로 명확히 분리하고, 산업 규모에서 흔히 쓰이던 in-batch negative의 숨은 편향을 이론적으로 규명한 첫 사례로 인용된다. logQ correction과 스트리밍 빈도 추정은 이후 다른 회사·다른 도메인(검색, 광고, 다양한 추천 플랫폼)의 대규모 retrieval 모델에도 그대로 이식되는 표준 기법이 되었고, "두 타워 구조라야 서빙이 가능하다"는 제약 조건이 이후 retrieval 연구 전반의 설계 전제로 굳어졌다.',

legacy:[
 '**in-batch negative 보정의 표준화** — logQ correction이 이후 대다수 산업 retrieval 논문의 기본 구성 요소로 인용됨',
 '**Two-Tower가 retrieval의 사실상 표준 아키텍처로 정착** — 검색·광고·추천 전반의 dense retrieval이 이 구조를 채택',
 '**빈도 추정 기법의 확산** — count-min sketch류의 해시 기반 근사 카운팅이 스트리밍 추천 시스템의 공통 도구로 재사용됨',
 '**[DIN](#/p/din)류 랭커와의 역할 분담 고착** — Two-Tower가 만든 후보군을 attention 기반 랭킹 모델이 이어받는 2단계 구조가 산업 표준으로 굳어짐'
],

pitfalls:[
 '**arXiv에 공식 게재된 논문이 아니다.** ACM RecSys 2019 프로시딩(DOI 10.1145/3298689.3346996)이 정본이며, 사설 미러 PDF를 인용할 때는 이 DOI를 함께 표기해야 한다.',
 '**"두 타워라서 무조건 빠르다"가 아니다.** 속도 이점은 아이템 임베딩을 사용자와 독립적으로 미리 계산해 인덱싱할 수 있다는 구조적 특성에서 나오는 것이지, 모델 자체의 연산량이 작아서가 아니다 — 사용자·아이템 피처를 섞는 순간(예: cross-feature) 이 이점이 사라진다.',
 '**logQ correction은 배치 구성 방식에 의존한다.** `p_j` 추정이 실제 샘플링 분포와 어긋나면(예: 배치가 균등 샘플링이면) 보정이 오히려 해가 될 수 있다 — 이 논문의 보정은 "배치가 파워로우 분포를 따른다"는 전제 위에 서 있다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'왼쪽 타워가 쿼리 `x∈X`(사용자+문맥), 오른쪽 타워가 아이템 `y∈Y`를 각각 독립적으로 임베딩 `u(x)`·`v(y)`로 매핑한다. 두 타워는 최상단에서 내적 `⟨u(x),v(y)⟩` 하나로만 연결되고, 그 아래로는 완전히 분리된 별개의 신경망이다 — 이 분리가 아이템 임베딩의 사전 계산·인덱싱을 가능하게 하는 구조적 핵심이다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'In-batch loss is subject to sampling biases, potentially hurting model performance, particularly in the case of highly skewed distribution.',
  src:'Abstract, p.1'}
],

links:[
 {t:'ACM DOI — Sampling-Bias-Corrected Neural Modeling', u:'https://dl.acm.org/doi/10.1145/3298689.3346996'},
 {t:'논문 PDF 미러 (tangxyw/RecSysPapers)', u:'https://github.com/tangxyw/RecSysPapers/blob/main/Match/%5B2019%5D%5BGoogle%5D%20Sampling-Bias-Corrected%20Neural%20Modeling%20for%20Large%20Corpus%20Item%20Recommendations.pdf'}
]
});
