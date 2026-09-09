WIKI.paper({
slug:'ncf',
venue:'WWW 2017',
authors:'He, Liao, Zhang, Nie, Hu, Chua (NUS · Columbia · Shandong · Texas A&M)',
arxiv:'1708.05031',

tldr:'[행렬 분해](#/p/mf)의 핵심 연산인 내적($q_i^\\top p_u$)이 사용자-아이템 상호작용을 표현하기엔 너무 단순하다고 지적하고, 그 자리를 **학습 가능한 신경망(MLP)**으로 대체했다. 내적을 특수한 경우로 포함하는 일반 프레임워크 NCF를 제시하고, 선형(GMF)과 비선형(MLP)을 앙상블한 NeuMF로 암묵적 피드백 추천의 성능을 끌어올렸다.',

context:'[행렬 분해](#/p/mf) 이후 CF 연구는 대체로 "내적은 그대로 두고 무엇을 더 넣을까"(편향항, 시간, 암묵적 피드백)에 집중해왔다. 이 논문은 다른 질문을 던진다 — **내적 자체가 병목이면 어떻게 하는가.** 내적은 두 잠재벡터의 각 차원을 독립적으로 곱해 더하는 고정된 선형 연산이라, 사용자 간 유사도 순서를 latent space 기하로 정확히 재현하지 못하는 경우가 생긴다(논문 Figure 1: 4번째 사용자가 1번과 가장 비슷해야 하는데 내적 기하로는 2번에 더 가깝게 배치될 수 있음). 저차원을 늘려 이 문제를 완화할 수는 있지만 과적합 위험이 커진다. 당시 CF에 신경망을 쓴 연구들도 대개 텍스트·이미지 같은 **보조 정보**를 다루는 데 그쳤고, 정작 사용자-아이템 상호작용 자체는 여전히 내적으로 계산했다.',

ideas:[
 {h:'해석 함수를 데이터로 학습되는 신경망으로',
  lead:'예측 함수 f를 손수 고정하지 않고 신경망으로 데이터에서 학습한다.',
  d:'$\\hat y_{ui}=f(u,i|\\Theta)$ 에서 $f$ 를 내적처럼 고정하지 않고, 사용자·아이템 원-핫 벡터를 임베딩한 뒤 여러 개의 "Neural CF Layer"를 통과시켜 학습한다. 신경망은 임의의 연속함수를 근사할 수 있다는 보편근사 성질을 이용해, 내적이 놓치는 비선형 상호작용까지 표현하려는 것이 NCF 프레임워크의 요지다.'},
 {h:'GMF: 내적을 일반화한 신경망 버전',
  lead:'원소별 곱에 학습 가능한 가중치 h를 얹으면 MF를 포함하는 상위 집합이 된다.',
  d:'$\\hat y_{ui}=a_{out}(h^\\top(p_u\\odot q_i))$ 에서 $a_{out}$ 을 항등함수, $h$ 를 전부 1인 벡터로 고정하면 정확히 원래 MF가 복원된다. $h$ 를 데이터에서 학습하게 풀거나 $a_{out}$ 을 시그모이드 같은 비선형 함수로 바꾸면, MF보다 표현력이 큰 **일반화된 행렬 분해(GMF)**가 된다.'},
 {h:'MLP: 연결 후 쌓아서 고차 상호작관을 학습',
  lead:'사용자·아이템 임베딩을 이어붙인 뒤 ReLU 은닉층을 쌓아 상호작용을 학습한다.',
  d:'단순 연결(concatenation)만으로는 두 벡터 사이의 상호작용을 전혀 표현하지 못한다. 연결된 벡터 위에 표준 MLP(ReLU, 위로 갈수록 폭이 줄어드는 tower 구조)를 쌓아 $p_u$ 와 $q_i$ 사이의 관계를 비선형으로 학습하게 한다. 이 부분은 GMF의 고정된 원소별 곱과 대비되는, 완전히 데이터 주도적인 상호작용 함수다.'},
 {h:'NeuMF: 선형과 비선형을 앙상블하되 임베딩은 따로',
  lead:'GMF와 MLP가 각자 임베딩을 갖게 하고 마지막 은닉층만 연결해 융합한다.',
  d:'GMF와 MLP가 임베딩을 공유하면 두 모델의 최적 임베딩 차원이 다를 때 성능이 묶인다. 그래서 NeuMF는 두 경로가 **독립된 임베딩**을 학습하게 하고, 각자의 마지막 표현을 연결(concat)한 뒤 하나의 출력층으로 합친다. 이렇게 하면 MF의 선형성과 MLP의 비선형성을 동시에 갖는 앙상블이 되면서도 유연성을 잃지 않는다.'},
 {h:'GMF·MLP를 먼저 학습해 NeuMF를 예열',
  lead:'각각 수렴할 때까지 학습한 파라미터로 NeuMF를 초기화해 비볼록 최적화를 돕는다.',
  d:'NeuMF의 목적함수는 비볼록이라 무작위 초기화는 지역 최적해에 쉽게 갇힌다. GMF와 MLP를 각각 수렴시킨 뒤 그 파라미터로 NeuMF를 초기화하고, 마지막 출력층 가중치만 $h\\leftarrow[\\alpha h^{GMF};(1-\\alpha)h^{MLP}]$ 로 섞는다. 이후 미세조정은 모멘텀이 없는 일반 SGD로 진행한다(Adam의 모멘텀 정보가 초기화 시 사라지기 때문).'}
],

diagram:{type:'flow', cap:'사용자·아이템 원-핫 입력이 임베딩을 거쳐 GMF(원소별 곱)와 MLP(연결+ReLU층) 두 경로로 각각 흐르다가, 마지막에 하나의 출력층에서 합쳐져 예측 점수가 된다.',
 nodes:[
  {t:'원-핫 입력', s:'사용자 · 아이템 ID'},
  {t:'독립 임베딩', s:'GMF용 · MLP용 분리'},
  {t:'GMF 경로', s:'원소별 곱'},
  {t:'MLP 경로', s:'연결 + ReLU tower'},
  {t:'NeuMF 결합', s:'두 경로 concat', acc:true, note:'σ(hᵀ·)로 출력'}
 ]},

math:[
 {expr:'ŷui = pᵀu qi = Σ puk qik',
  tex:'\\hat y_{ui}=f(u,i\\mid p_u,q_i)=p_u^{\\top}q_i=\\sum_{k=1}^{K}p_{uk}q_{ik}',
  d:'전통 MF의 내적. 각 잠재 차원을 서로 독립적으로, 같은 가중치로 선형 결합한다는 점이 표현력의 한계다.'},
 {expr:'ŷui = σ(hᵀ φL(zL-1)),  φ1 = [pu; qi]',
  tex:'\\mathbf z_1=\\begin{bmatrix}p_u\\\\ q_i\\end{bmatrix},\\ \\ \\phi_L(\\mathbf z_{L-1})=a_L\\!\\left(W_L^{\\top}\\mathbf z_{L-1}+b_L\\right),\\ \\ \\hat y_{ui}=\\sigma\\!\\left(h^{\\top}\\phi_L(\\mathbf z_{L-1})\\right)',
  d:'MLP 경로. 두 임베딩을 이어붙인 뒤 $L$개의 ReLU 층을 통과시켜 비선형 상호작용을 학습하고 시그모이드로 확률화한다.'},
 {expr:'L = -Σ yui log ŷui + (1-yui) log(1-ŷui)',
  tex:'L=-\\!\\!\\sum_{(u,i)\\in\\mathcal Y\\cup\\mathcal Y^{-}}\\!\\! y_{ui}\\log\\hat y_{ui}+(1-y_{ui})\\log(1-\\hat y_{ui})',
  d:'암묵적 피드백을 이진 분류로 취급하는 로그 손실(=binary cross-entropy). 관측되지 않은 상호작용 $\\mathcal Y^-$ 는 매 반복마다 균등 샘플링한 음성 사례다.'}
],

numbers:[
 {k:'평가 데이터셋', v:'MovieLens-1M · Pinterest', d:'각 1,000,209건 / 1,500,809건 상호작용, 희소도 95.53% / 99.73%'},
 {k:'평가 프로토콜', v:'leave-one-out + HR@10 · NDCG@10', d:'사용자별 마지막 상호작용을 테스트로, 미상호작용 100개와 함께 순위 매김'},
 {k:'NeuMF vs 최고 MF 베이스라인', v:'eALS 대비 +4.5% · BPR 대비 +4.9%', d:'평균 상대 개선폭(HR/NDCG 종합)'},
 {k:'Pinterest 저차원 우세', v:'예측 인자 8개인 NeuMF > 64개인 eALS/BPR', d:'차원을 늘리지 않고도 비선형 상호작용으로 더 나은 성능'},
 {k:'MLP 기본 구조', v:'32→16→8 tower (예측 인자 8 기준)', d:'위로 갈수록 폭을 절반으로 줄이는 구조 채택'}
],

impact:'NCF는 "내적이 CF의 유일한 답은 아니다"라는 것을 실증적으로 보여, 이후 CTR·추천 모델 설계에서 상호작용 함수 자체를 학습 대상으로 놓는 관점을 대중화했다. MF를 NCF의 특수 사례로 형식화함으로써, 향후 연구가 GMF·MLP·혹은 다른 상호작용 함수를 자유롭게 조합할 수 있는 공통 언어를 제공했다. 다만 저자들 스스로도 밝혔듯 pairwise 랭킹 손실로의 확장이나 콘텐츠 특징의 결합은 이 논문의 범위 밖으로 남겨졌다.',

legacy:[
 '**그래프로의 확장** — Neural Graph Collaborative Filtering 등은 NCF의 임베딩+MLP 결합을 사용자-아이템 그래프의 이웃 전파로 확장했다',
 '**후보생성/랭킹 실무의 표준 부품화** — 임베딩을 내적이 아니라 MLP·attention으로 결합한다는 아이디어는 [DIN](#/p/din)의 로컬 활성화 유닛처럼 이후 CTR 모델 전반에서 반복된다',
 '**시퀀스 모델로의 이행** — 이 논문이 정적인 (u,i) 쌍의 상호작용 함수를 다뤘다면, 이후 [SASRec](#/p/sasrec)·[BERT4Rec](#/p/bert4rec)은 그 상호작용 자체를 시퀀스로 확장했다',
 '**MF 재평가 논쟁** — 후속 연구(예: 2019년 "내적이냐 아니냐" 재현 연구)들이 동일한 하이퍼파라미터 튜닝 조건에서는 잘 조정된 MF/내적이 NeuMF와 경쟁력 있다고 재반박하며, 벤치마크 재현성 논쟁을 촉발했다'
],

pitfalls:[
 '**"MLP가 내적보다 항상 더 좋다"는 과장이다.** 이 논문 스스로도 MLP 단독은 GMF보다 약간 낮은 성능을 보였고, 층을 더 깊게 쌓아야 개선된다고 밝힌다. 그리고 이후 재현 연구들은 하이퍼파라미터를 충분히 튜닝한 MF가 NeuMF와 큰 차이가 안 날 수 있음을 보여, HR@10·NDCG@10 같은 오프라인 지표 비교가 튜닝 노력에 얼마나 민감한지를 드러냈다.',
 '**암묵적 피드백의 음성 샘플링 방식이 결과를 좌우한다.** 관측되지 않은 상호작용을 균등 샘플링해 음성으로 쓰는데, 실제로는 안 본 것과 싫어하는 것이 다르다. 논문도 인기도 기반 비균등 샘플링이 성능을 더 올릴 수 있다고 인정하면서도 이를 향후 과제로 남겼다 — 샘플링 편향은 그대로 잔존한다.',
 '**leave-one-out + 100개 무작위 샘플링 평가가 실제 전체 랭킹 성능과 다를 수 있다.** 이 논문의 HR/NDCG는 전체 아이템이 아니라 1개 정답과 무작위 100개 후보 중에서의 순위로 계산되므로, 오프라인 벤치마크 점수가 실제 서비스에서의 전체 카탈로그 랭킹 품질을 그대로 대변하지 않는다.'
],

figures:[
 {f:'fig1-mf-limitation.png',
  cap:'(a) 사용자-아이템 행렬에서 자카드 유사도로 보면 u4는 u1과 가장 비슷하고 u2와 가장 다르다. (b) 그런데 내적 기하에서 p4를 p1에 가장 가깝게 놓으면(점선 p4′) 오히려 p2와 더 가까워져버린다 — 내적이라는 고정된 연산이 만드는 구조적 오차를 보여준다.',
  src:'원문 Figure 1, p.2'},
 {f:'fig3-neumf.png',
  cap:'같은 사용자·아이템 원-핫 입력이 왼쪽 GMF 경로(원소별 곱)와 오른쪽 MLP 경로(연결 후 ReLU tower)로 각각 독립된 임베딩을 거쳐 흐르다가, 위쪽 NeuMF Layer에서 두 경로의 마지막 표현이 연결(concatenation)되어 하나의 점수로 합쳐진다.',
  src:'원문 Figure 3, p.5'}
],

quotes:[
 {t:'By replacing the inner product with a neural architecture that can learn an arbitrary function from data, we present a general framework named NCF, short for Neural network-based Collaborative Filtering.',
  src:'Abstract, p.1'},
 {t:'NeuMF achieves the best performance on both datasets, significantly outperforming the state-of-the-art methods eALS and BPR by a large margin.',
  src:'4.2 Performance Comparison (RQ1), p.6'}
],

links:[
 {t:'arXiv 1708.05031 — Neural Collaborative Filtering', u:'https://arxiv.org/abs/1708.05031'},
 {t:'공식 구현 (hexiangnan/neural_collaborative_filtering)', u:'https://github.com/hexiangnan/neural_collaborative_filtering'}
]
});
