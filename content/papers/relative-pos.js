WIKI.paper({
slug:'relative-pos',
venue:'NAACL 2018',
authors:'Shaw, Uszkoreit, Vaswani (Google · Google Brain)',
arxiv:'1803.02155',

tldr:'[Transformer](#/p/transformer)의 절대 위치 인코딩을 **토큰 사이의 상대 거리를 attention 내부에 직접 넣는 방식**으로 바꾼 논문. 위치 인코딩을 입력에 더하는 대신, self-attention의 key·value 계산 자체에 "얼마나 떨어져 있는가"를 학습 가능한 임베딩으로 주입한다.',

context:'[Transformer](#/p/transformer)는 순서 정보를 아키텍처가 아니라 입력으로 준다 — sin/cos 위치 인코딩을 토큰 임베딩에 더해서 넣는다. 이 방식의 한계는 위치 정보가 **절대적**이라는 것이다. "3번째와 7번째 토큰의 관계"와 "13번째와 17번째 토큰의 관계"가 똑같이 거리 4인데도 attention은 이를 서로 다른 절대 위치의 문제로만 본다. 반면 RNN은 은닉 상태를 스텝마다 갱신하면서 암묵적으로 상대적 순서를 학습하고, 합성곱([ConvS2S](#/p/convs2s))은 커널 안에서 상대 위치를 자연히 포착한다. 이 논문은 "Transformer의 self-attention 안에 상대 위치를 직접 표현하면 어떨까"라는 질문에서 출발한다.',

ideas:[
 {h:'입력을 레이블 있는 완전그래프로 본다',
  lead:'토큰 시퀀스를 각 쌍 $(i,j)$마다 엣지 표현이 붙은 방향 그래프로 재해석한다.',
  d:'기존 self-attention은 각 토큰을 독립된 벡터로만 다룬다. 이 논문은 토큰 $x_i$와 $x_j$ 사이의 엣지에 벡터 $a^V_{ij}, a^K_{ij}$를 대응시켜, attention을 "레이블 있는 방향 완전그래프 위의 연산"으로 일반화한다. 언어의 선형 순서는 이 그래프의 특수 경우(엣지 레이블 = 상대 거리)일 뿐이며, 저자들은 논문 말미에서 이 틀이 임의의 그래프 구조로 확장될 수 있다고 언급한다.'},
 {h:'상대 거리를 clip해서 유한 개의 임베딩으로 학습한다',
  lead:'거리를 $[-k,k]$로 잘라 $2k{+}1$개의 상대 위치 임베딩만 학습한다.',
  d:'두 토큰의 상대 거리 $j-i$를 그대로 쓰면 시퀀스 길이만큼 서로 다른 거리 값이 생긴다. 이를 $\\text{clip}(x,k)=\\max(-k,\\min(k,x))$로 잘라 $2k{+}1$개의 고유한 거리 구간만 학습되는 임베딩 $w^K, w^V$로 대응시킨다. 먼 거리의 정확한 값은 번역에 별 의미가 없다는 가설이며, 실험적으로 $k\\ge2$부터는 BLEU가 거의 변하지 않았다 — 층을 여러 개 쌓으면 clip 거리 너머의 정보도 간접 전파되기 때문으로 추정한다.'},
 {h:'key와 value 계산 둘 다에 상대 위치를 더한다',
  lead:'attention 점수(eq.4)와 값 합산(eq.3) 양쪽에 상대 위치 임베딩을 덧셈으로 주입한다.',
  d:'value 쪽에서는 $z_i=\\sum_j \\alpha_{ij}(x_jW^V+a^V_{ij})$로, compatibility 쪽에서는 $e_{ij}=x_iW^Q(x_jW^K+a^K_{ij})^\\top/\\sqrt{d_z}$로 상대 위치를 더한다. 곱셈이 아니라 **덧셈**을 쓴 것이 핵심 설계 선택인데, 이 덕분에 행렬 곱을 두 항으로 쪼개 텐서 reshape만으로 효율적으로 계산할 수 있다(3.3절) — 곱셈이었다면 이런 분해가 불가능했다.'},
 {h:'헤드·시퀀스 간 임베딩을 공유해 메모리를 줄인다',
  lead:'상대 위치 임베딩을 모든 attention head와 배치의 모든 시퀀스가 공유해 메모리를 $O(n^2 d_a)$로 묶는다.',
  d:'엣지 표현을 헤드마다, 시퀀스마다 따로 두면 공간 복잡도가 $O(hn^2d_a)$로 폭발한다. 이 논문은 모든 헤드가 같은 상대 위치 임베딩 테이블을 공유하게 해 $O(n^2d_a)$로 줄이고, 시퀀스 간에도 같은 테이블을 재사용한다. 그 결과 전체 self-attention 공간 복잡도는 $O(bhnd_z)$에서 $O(bhnd_z+n^2d_a)$로만 늘어난다.'}
],

diagram:{type:'compare', cap:'위치 정보를 어디에 넣는가의 차이.',
 left:{t:'Transformer 원본', items:['sin/cos을 임베딩에 덧셈','절대 위치만 표현','attention 계산 자체는 위치 무관']},
 right:{t:'상대 위치 표현', items:['거리를 clip해 임베딩화','attention의 K·V 계산에 직접 주입','절대 위치 인코딩과 병행해도 이득 없음']}},

math:[
 {expr:'e_ij = x_i W^Q (x_j W^K + a_ij^K)^T / √d_z',
  tex:'e_{ij}=\\frac{x_i W^Q (x_j W^K + a_{ij}^{K})^{\\top}}{\\sqrt{d_z}}',
  d:'원본 Transformer의 compatibility 식 $e_{ij}=(x_iW^Q)(x_jW^K)^\\top/\\sqrt{d_z}$에 상대 위치 항 $a_{ij}^K$를 더한 것. 이 한 항이 attention 점수 자체에 "얼마나 떨어져 있는가"를 반영한다.'},
 {expr:'z_i = Σ_j α_ij (x_j W^V + a_ij^V)',
  tex:'z_i=\\sum_{j=1}^{n}\\alpha_{ij}\\left(x_jW^V+a_{ij}^{V}\\right)',
  d:'value 쪽도 마찬가지로 상대 위치 임베딩을 더해서 합산한다. $\\alpha_{ij}$는 $e_{ij}$의 softmax.'},
 {expr:'a_ij^K = w^K_clip(j−i,k),  clip(x,k) = max(−k, min(k, x))',
  tex:'a_{ij}^{K}=w^{K}_{\\text{clip}(j-i,\\,k)},\\qquad \\text{clip}(x,k)=\\max(-k,\\min(k,x))',
  d:'상대 거리 $j-i$를 $[-k,k]$로 잘라 $2k{+}1$개의 학습 가능한 임베딩 중 하나를 찾아 쓴다. $k$를 넘는 거리는 전부 같은 임베딩을 공유한다.'}
],

numbers:[
 {k:'EN-DE BLEU · base', v:'26.8 (절대 26.5)', d:'상대 위치가 절대 위치보다 +0.3 BLEU'},
 {k:'EN-DE BLEU · big', v:'29.2 (절대 27.9)', d:'큰 모델에서 이득이 더 커짐, +1.3 BLEU'},
 {k:'EN-FR BLEU · big', v:'41.5 (절대 41.2)', d:'+0.3 BLEU'},
 {k:'clip 거리 k 민감도', v:'k=1→25.5, k≥2→25.8~25.9', d:'k=0(상대 위치 구분 자체 없음)이면 12.5로 붕괴'},
 {k:'속도 비용', v:'약 7% 감소', d:'steps/sec 기준, 같은 배치·모델 크기는 유지 가능'},
 {k:'key만 vs key+value', v:'25.8 vs 25.3(value만)', d:'compatibility(key) 쪽 상대 위치만으로도 대부분의 이득 확보'}
],

impact:'이 논문은 위치 정보를 "입력에 더하는 상수"에서 "attention 연산 내부의 학습 가능한 편향"으로 옮겼다. 절대 위치 인코딩과 함께 써도 추가 이득이 없다는 관찰은, 상대 위치 하나만으로 Transformer가 필요로 하는 순서 정보를 충분히 표현한다는 뜻이다. 이 관찰이 이후 위치 인코딩 연구 전체의 방향을 상대 위치 쪽으로 크게 틀었다 — sin/cos을 입력에 더하는 절대 방식은 이후 주류 대형 모델에서 거의 쓰이지 않는다.',

legacy:[
 '**[Transformer-XL](#/p/transformer-xl)** — 세그먼트를 넘나드는 재귀적 문맥에 상대 위치를 결합해 긴 문맥을 다룸',
 '**[RoPE](#/p/rope)** — 상대 위치를 덧셈이 아니라 쿼리·키를 회전시키는 방식으로 구현해 효율과 외삽 성능을 모두 개선, 현재 대다수 LLM의 표준',
 '**[ALiBi](#/p/alibi)** — 학습 가능한 임베딩 대신 거리에 비례한 고정 페널티를 attention 점수에 더해 더 단순하게 상대 위치를 구현',
 '**[Music Transformer](#/p/music-transformer)** — 이 논문의 상대 위치 표현을 음악 생성에 적용하면서 메모리 효율을 개선한 구현 트릭을 별도로 제안'
],

pitfalls:[
 '**절대 위치 인코딩과 함께 쓴다고 더 좋아지지 않는다.** 저자들이 직접 확인했다 — 상대 위치 표현이 이미 절대 위치가 주는 정보를 포함하므로, 굳이 두 방식을 합칠 필요는 없다.',
 '**clip 거리 $k$를 키운다고 계속 좋아지지 않는다.** $k\\ge2$부터 성능이 사실상 평평해진다(표2: $k=2$일 때 25.8, $k=256$일 때도 25.8) — "정밀한 먼 거리 정보"가 필요하다는 직관과 달리, 여러 층을 쌓으면 clip 범위 밖의 정보도 간접 전파된다.',
 '**value 쪽 상대 위치($a^V_{ij}$)는 없어도 손실이 크지 않다.** key 쪽만 상대 위치를 넣어도(25.8) 둘 다 넣은 경우(25.8)와 거의 같고, value만 넣으면 오히려 떨어진다(25.3) — "상대 위치 표현"을 구현할 때 어디에 넣는지가 균등하게 중요하지 않다.'
],

figures:[
 {f:'fig1-clipping.png',
  cap:'토큰 $x_1 \\ldots x_n$ 사이 일부 엣지에 상대 위치 임베딩이 붙는 예시. $a^V_{2,1}=w^V_{-1}$는 $x_2$가 바로 앞 토큰 $x_1$을 볼 때 쓰는 값(거리 -1), $a^V_{4,n}=w^V_k$는 거리가 clip 한계 $k$를 넘어 같은 임베딩을 공유하는 경우다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'We describe an efficient implementation of our method and cast it as an instance of relation-aware self-attention mechanisms that can generalize to arbitrary graph-labeled inputs.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1803.02155 — Self-Attention with Relative Position Representations', u:'https://arxiv.org/abs/1803.02155'}
]
});
