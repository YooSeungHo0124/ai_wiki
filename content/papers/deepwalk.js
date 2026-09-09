WIKI.paper({
slug:'deepwalk',
venue:'KDD 2014',
authors:'Perozzi, Al-Rfou, Skiena (Stony Brook University)',
arxiv:'1403.6652',

tldr:'그래프의 정점을 **[word2vec](#/p/word2vec)의 단어처럼** 다룬다. 그래프 위에서 무작위 걷기(random walk)로 "문장"을 만들고, 그 문장에 SkipGram을 그대로 돌려 정점 임베딩을 얻는다.',

context:'2014년의 네트워크 분석은 손으로 설계한 통계량(차수·클러스터링 계수) 이나 스펙트럴 클러스터링처럼 그래프 전체의 고유벡터를 계산하는 방법이 주류였다. 둘 다 새 정점이 추가되면 다시 계산해야 하고, 라벨이 희소한 경우 성능이 급격히 떨어졌다. 같은 시기 NLP에서는 [word2vec](#/p/word2vec)이 "단어의 의미는 주변 단어로 정의된다"는 분포 가설 하나로 저차원 임베딩을 값싸게 학습하고 있었다. 이 논문의 질문은 단순하다 — **그래프의 정점도 "주변"이 있는데, 그 주변을 문장처럼 만들 수는 없을까?**',

ideas:[
 {h:'무작위 걷기 = 문장',
  lead:'정점에서 시작한 균등 무작위 걷기 경로를 SkipGram의 입력 문장으로 취급한다.',
  d:'정점 $v_i$ 에서 시작해 매 스텝 현재 정점의 이웃 중 하나를 균등하게 골라 이동하는 것을 길이 $t$ 만큼 반복한다. 이렇게 나온 정점 나열 $\\mathcal{W}_{v_i} = (v_i, \\dots)$ 를 "문장"으로, 그래프 전체 정점 집합을 "어휘"로 취급하면 언어 모델 학습 파이프라인을 그대로 재사용할 수 있다.'},
 {h:'멱법칙 정당화: 정점 빈도도 단어 빈도를 닮았다',
  lead:'무작위 걷기에서 정점의 등장 빈도 분포가 단어 빈도처럼 멱법칙을 따름을 실증으로 보인다.',
  d:'SkipGram이 자연어에서 잘 작동하는 이유 중 하나는 단어 빈도가 멱법칙(Zipf 분포)을 따르기 때문이다. 저자들은 무작위 걷기로 생성한 정점 시퀀스에서도 정점 방문 빈도가 멱법칙을 따른다는 것을 보여, 언어 모델링 기법을 그래프로 옮기는 선택을 정당화한다.'},
 {h:'SkipGram + Hierarchical Softmax',
  lead:'윈도 $w$ 안의 co-occurrence를 최대화하되, 계산량은 이진 트리로 $O(\\log|V|)$ 로 줄인다.',
  d:'걷기 경로 위에서 윈도 크기 $w$ 안에 있는 정점 쌍의 co-occurrence 확률 $\\Pr(u_k \\mid \\Phi(v_j))$ 을 최대화하도록 임베딩 $\\Phi$ 를 학습한다. 정점 수 $|V|$ 가 수백만에 이를 수 있어 일반 softmax는 비현실적이므로, 정점을 이진 트리 잎에 배치하고 경로 확률의 곱으로 분해하는 Hierarchical Softmax를 써서 예측 비용을 $O(|V|)$ 에서 $O(\\log|V|)$ 로 낮춘다.'},
 {h:'온라인·병렬 학습',
  lead:'전체 그래프를 한 번에 볼 필요 없이 걷기 스트림만으로 점진적으로 학습한다.',
  d:'각 걷기는 로컬한 정보만 필요하므로, 그래프가 스트림으로 조금씩 바뀌어도(정점·간선 추가) 전체를 다시 학습하지 않고 새 걷기만 추가로 흘려보내면 된다. 또한 정점마다 독립적으로 걷기를 생성할 수 있어 비동기 SGD로 손쉽게 병렬화되고, 논문은 코어 수에 거의 선형으로 스피드업됨을 보인다.'}
],

diagram:{type:'flow', cap:'그래프 정점 → 무작위 걷기 → SkipGram 학습, word2vec 파이프라인을 그대로 재사용한다.',
 nodes:[
  {t:'그래프 G', s:'정점·간선'},
  {t:'무작위 걷기', s:'γ개 × 길이 t', acc:true, note:'정점 시퀀스 = 문장'},
  {t:'SkipGram', s:'윈도 w 안 co-occurrence'},
  {t:'계층 Softmax', s:'O(log|V|)'},
  {t:'정점 임베딩 Φ', s:'|V| × d'}
 ]},

math:[
 {expr:'minimize over Φ:  −log Pr({v_{i−w},…,v_{i+w}} \\ v_i | Φ(v_i))',
  tex:'\\Phi^{*}=\\operatorname*{arg\\,min}_{\\Phi}\\; -\\log \\Pr\\!\\big(\\{v_{i-w},\\dots,v_{i+w}\\}\\setminus v_i \\;\\big|\\; \\Phi(v_i)\\big)',
  d:'걷기 위 각 정점 $v_i$ 를 중심으로, 윈도 $w$ 안의 이웃 정점들이 함께 등장할 확률을 최대화하도록 임베딩 $\\Phi(v_i)$ 를 학습한다. word2vec의 SkipGram 목적함수와 동일한 형태다.'},
 {expr:'Pr(u_k | Φ(v_j)) = ∏_{l=1}^{⌈log|V|⌉} Pr(b_l | Φ(v_j))',
  tex:'\\Pr(u_k \\mid \\Phi(v_j)) = \\prod_{l=1}^{\\lceil \\log|V| \\rceil} \\Pr(b_l \\mid \\Phi(v_j))',
  d:'정점 $u_k$ 를 이진 트리의 잎으로 두고, 루트에서 그 잎까지 경로 $(b_0,\\dots,b_{\\lceil\\log|V|\\rceil})$ 상의 각 갈림에서 이진 분류기를 통과할 확률의 곱으로 co-occurrence 확률을 근사한다. 빈도가 높은 정점에는 Huffman 코딩으로 더 짧은 경로를 배정해 추가로 가속한다.'}
],

numbers:[
 {k:'Micro-F1 개선', v:'최대 +10%p', d:'라벨 희소(10% 학습 데이터)한 BlogCatalog에서 경쟁 기법 대비'},
 {k:'학습 데이터 절감', v:'−60%', d:'일부 실험에서 60% 적은 라벨로도 모든 베이스라인을 능가'},
 {k:'기본 하이퍼파라미터', v:'γ=80, w=10, d=128', d:'walks per vertex · window · 임베딩 차원'},
 {k:'YouTube 데이터셋', v:'정점 최대 규모', d:'수백만 정점 그래프에도 온라인 학습으로 적용 가능함을 실증'},
 {k:'복잡도', v:'O(log|V|)', d:'Hierarchical Softmax로 정점당 예측 비용을 어휘 크기의 로그로 축소'}
],

impact:'그래프 표현학습을 **"그래프 고유의 알고리즘을 새로 설계"에서 "그래프를 시퀀스로 변환해 기존 언어모델 기법을 재사용"으로** 바꿔놓았다. 스펙트럴 방법처럼 그래프 전체의 고유분해가 필요 없어 대규모·동적 그래프에 바로 적용할 수 있었고, 비지도로 얻은 저차원 임베딩이 분류·클러스터링·링크 예측 등 여러 downstream 작업에 재사용 가능하다는 것을 보였다. 이 "임베딩 먼저, 태스크는 나중" 패턴은 이후 그래프 표현학습 전체의 기본 틀이 되었다.',

legacy:[
 '**걷기 전략의 일반화** — [node2vec](#/p/node2vec)이 균등 무작위 걷기를 편향된 2차 무작위 걷기로 확장해 BFS/DFS 성향을 조절 가능하게 만듦',
 '**행렬 분해와의 등가성** — 이후 연구들이 DeepWalk의 SkipGram 목적함수가 특정 점별 상호정보량(PMI) 행렬의 암묵적 분해와 같음을 보이며 이론적 기반을 정리',
 '**직접 집계 방식으로의 전환** — [GCN](#/p/gcn)은 걷기·SkipGram 없이 이웃 특징을 신경망으로 직접 집계하는 방향으로 갈라져 나가며, 그래프 신경망이라는 다른 계열을 엶',
 '**속성 없는 그래프의 한계** — 정점 특징(단어·이미지 등)을 쓰지 않고 그래프 구조만 보는 이 계열은, 특징까지 함께 학습하는 GNN 계열이 등장하며 상대적으로 표현력이 제한된 방법으로 재평가됨'
],

pitfalls:[
 '**Transductive다.** 학습 시점에 없던 새 정점은 임베딩이 없다 — 전체를 다시 학습해야 한다. 이 한계가 [GraphSAGE](#/p/graphsage)가 풀려는 문제의 출발점이다.',
 '**정점 특징(attribute)을 전혀 쓰지 않는다.** 오직 그래프 위상만으로 임베딩을 만들기 때문에, 정점에 텍스트·이미지 같은 풍부한 특징이 있어도 활용하지 못한다.',
 '**균등 무작위 걷기라 구조적 편향이 없다.** BFS 성향(동질성 커뮤니티 포착)과 DFS 성향(구조적 역할 포착)을 구분하지 못한다는 것이 후속 논문 [node2vec](#/p/node2vec)의 핵심 문제 제기다.'
],

figures:[
 {f:'fig1-karate.png',
  cap:'왼쪽(a)이 입력 그래프(Zachary의 Karate 네트워크, 색은 modularity 기반 커뮤니티), 오른쪽(b)이 DeepWalk로 얻은 2차원 임베딩. 그래프 위에서 멀리 떨어진 색(커뮤니티)끼리 임베딩 공간에서도 멀리 떨어져, 그래프 구조를 전혀 몰랐던 (b)가 (a)의 커뮤니티 구조를 좌표만으로 복원했음을 보여준다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'DeepWalk uses local information obtained from truncated random walks to learn latent representations by treating walks as the equivalent of sentences.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1403.6652 — DeepWalk: Online Learning of Social Representations', u:'https://arxiv.org/abs/1403.6652'},
 {t:'DeepWalk 공식 구현 (GitHub)', u:'https://github.com/phanein/deepwalk'}
]
});
