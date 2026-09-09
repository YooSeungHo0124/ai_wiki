WIKI.paper({
slug:'sparse-attn',
venue:'Longformer: arXiv 2020 · Big Bird: NeurIPS 2020',
authors:'Beltagy, Peters, Cohan (AI2) · Zaheer et al. (Google Research)',
arxiv:'2004.05150',

tldr:'$n \\times n$ attention 행렬을 다 채우지 말고 **일부 칸만 계산하자**는 계열. 슬라이딩 윈도우(지역) + 전역 토큰(허브) + 랜덤 연결(지름길)의 조합으로 복잡도를 $O(n^2)$ 에서 $O(n)$ 으로 낮추고, 512 토큰이던 문맥을 4096으로 늘렸다.',

context:'[Transformer](#/p/transformer)의 attention은 모든 토큰 쌍의 점수를 계산하므로 메모리와 연산이 길이의 제곱으로 는다. [BERT](#/p/bert)가 512 토큰에서 멈춘 것은 성능 문제가 아니라 이 제곱항 때문이었다. 그런데 논문 한 편, 판례 하나, 유전체 조각 하나는 수천~수만 토큰이다. 당시 대응은 문서를 512짜리로 잘라 따로 처리하고 결과를 이어붙이는 것이었는데, 이러면 조각을 넘나드는 관계는 애초에 모델이 볼 수 없다. 2019~2020년에 Sparse Transformer, Reformer, Linformer 등 수십 편의 "Efficient Transformer"가 쏟아졌고, 그중 실제로 널리 쓰인 것이 Longformer와 Big Bird다.',

ideas:[
 {h:'슬라이딩 윈도우 — 언어는 대체로 지역적이다',
  lead:'각 토큰이 좌우 이웃 $w/2$ 개만 보게 해 계산량을 길이에 선형으로 줄인다.',
  d:'각 토큰이 좌우 $w/2$ 개 이웃만 본다. 한 층의 수용 영역은 $w$ 지만 층을 $L$ 개 쌓으면 CNN처럼 $L \\times w$ 까지 넓어지므로, 12층 모델이 윈도우 512면 이론적 수용 영역은 시퀀스 전체를 덮는다. 계산량은 $O(n \\times w)$ 로 길이에 **선형**이다.'},
 {h:'전역 토큰 — 몇 개는 모두를 보고, 모두가 그것을 본다',
  lead:'소수의 토큰에만 양방향 전역 attention을 줘 정보 허브로 삼는다.',
  d:'`[CLS]`나 질문 토큰처럼 태스크상 중요한 소수 위치를 지정해 **양방향 전역 attention**을 준다. 이 토큰들은 전체를 읽고 전체에게 읽히므로 정보의 허브 역할을 한다. 개수 $g$ 가 상수이므로 비용은 $O(g \\times n)$, 여전히 선형이다. QA에서 질문 토큰을 전역으로 지정하는 것만으로 성능이 크게 오른다.'},
 {h:'랜덤 attention — 그래프의 지름을 줄이는 지름길',
  lead:'무작위 연결 몇 개를 더해 그래프의 지름을 줄이는 small-world 효과를 쓴다.',
  d:'Big Bird는 여기에 각 쿼리가 $r$ 개의 무작위 키를 보는 항을 더한다. 근거는 그래프 이론이다. 규칙적인 지역 그래프에 무작위 간선 몇 개를 뿌리면 **small-world 성질**이 생겨 임의의 두 노드 사이 경로가 짧아진다. 즉 층을 적게 쌓고도 먼 토큰끼리 몇 홉 안에 연결된다.'},
 {h:'희소해도 표현력은 잃지 않는다는 증명',
  lead:'star graph 포함 희소 attention이 튜링 완전한 universal approximator임을 증명한다.',
  d:'Big Bird의 이론 파트는 star graph를 포함하는 희소 attention이 **시퀀스 함수의 universal approximator**이며, 튜링 완전하다는 것을 보인다. "근사니까 성능이 떨어질 것"이라는 직관에 대한 방어인데, 동시에 논문 스스로 밝히듯 이 표현력을 얻으려면 full attention보다 **층을 더 많이** 쌓아야 하는 경우가 있다.'},
 {h:'블록 단위로 계산해야 실제로 빨라진다',
  lead:'토큰 단위 희소 패턴 대신 블록 단위 gather·행렬곱으로 구현해야 실측 속도가 난다.',
  d:'토큰 하나씩 흩어진 희소 패턴은 GPU에서 오히려 느리다. 두 논문 모두 시퀀스를 블록(예: 64토큰)으로 묶어 **블록 단위 gather/행렬곱**으로 구현한다. 이론상 FLOPs 절감과 실측 속도가 다르다는 이 교훈은 나중에 [FlashAttention](#/p/flashattention)이 "근사를 버리고 IO만 고치자"로 방향을 트는 배경이 된다.'}
],

diagram:{type:'matrix', cap:'attention 행렬의 어디를 계산하는가. 세 패턴을 겹치면 각 행이 O(1)개 칸만 채우고도 전체가 몇 홉으로 연결된다.',
 cols:['t1','t2','t3','t4','t5','t6','t7','t8'],
 rows:[
  {t:'[CLS] (전역)', v:[1,1,1,1,1,1,1,1]},
  {t:'t2 (윈도우)',  v:[1,1,1,0,0,0,0,0]},
  {t:'t3 (윈도우)',  v:[1,1,1,1,0,0,0,0]},
  {t:'t4 (+랜덤)',   v:[1,0,1,1,1,0,0.7,0]},
  {t:'t5 (윈도우)',  v:[1,0,0,1,1,1,0,0]},
  {t:'t6 (+랜덤)',   v:[1,0,0.7,0,1,1,1,0]},
  {t:'t7 (윈도우)',  v:[1,0,0,0,0,1,1,1]},
  {t:'t8 (윈도우)',  v:[1,0,0,0,0,0,1,1]}
 ]},

math:[
 {expr:'cost_full = O(n²·d)   →   cost_sparse = O(n·(w + g + r)·d)',
  tex:'\\text{cost}_{\\text{full}}=O(n^2 d)\\;\\longrightarrow\\;\\text{cost}_{\\text{sparse}}=O(n(w+g+r)d)',
  d:'윈도우 $w$, 전역 $g$, 랜덤 $r$ 이 모두 상수이므로 길이에 선형이다. $n=4096$, $w=512$ 이면 행 하나당 계산할 칸이 8분의 1 이하로 줄고, 메모리는 그보다 더 크게 줄어든다.'},
 {expr:'receptive_field(L layers) ≈ L × w',
  tex:'\\text{receptive\\_field}(L)\\approx L\\times w',
  d:'한 층의 윈도우는 좁지만 층을 거치며 정보가 번진다. Longformer가 층마다 윈도우 크기를 다르게(아래층 좁게, 위층 넓게) 주고, 문자 단위 LM에서는 dilation(0→3)을 쓰는 이유가 이 수용 영역 설계다.'}
],

numbers:[
 {k:'최대 시퀀스 길이', v:'4,096', d:'[BERT](#/p/bert) 512의 8배. Longformer는 당시 GPU에서 16K까지 가능하다고 보고'},
 {k:'Longformer 윈도우', v:'w = 512', d:'사전학습·파인튜닝 설정. 층별로 다르게 주기도 한다'},
 {k:'WikiHop', v:'81.9 F1', d:'Longformer-large. 여러 문서를 넘나드는 추론이라 긴 문맥이 직접 이득'},
 {k:'TriviaQA', v:'77.3 F1', d:'Longformer-large'},
 {k:'문자 단위 LM', v:'text8 1.10 BPC · enwik8 1.00 BPC', d:'Longformer, dilated sliding window 사용'},
 {k:'Big Bird 요약', v:'arXiv 46.63 · PubMed 46.32 ROUGE-1', d:'BigBird-Pegasus. 긴 문서 요약이 대표 수혜 태스크'}
],

impact:'"긴 문맥"이 연구 주제로 성립하게 만든 계열이다. 문서 QA, 법률·의료 문서 처리, 유전체 시퀀스(Big Bird는 프로모터 예측에서 99.9 F1을 보고한다)처럼 512로는 아예 접근할 수 없던 태스크가 열렸다. 동시에 이 계열은 **근사라는 대가**를 분명히 드러냈다 — 어떤 칸을 버릴지 사람이 미리 정해야 하고, 태스크마다 최적 패턴이 다르며, 이론상 FLOPs 절감이 실제 속도로 이어지지 않는 경우가 많았다. 이 불만이 곧 "행렬은 다 계산하되 메모리 이동만 줄이자"는 [FlashAttention](#/p/flashattention)으로 방향을 틀게 한다.',

legacy:[
 '**정확한 attention으로의 선회** — [FlashAttention](#/p/flashattention)이 근사 없이 더 빠르고 메모리도 적게 쓰는 것을 보이면서, 범용 LLM에서 희소 패턴 채택은 크게 줄었다',
 '**블록 희소성의 부활** — 다만 발상 자체는 살아남아 Mistral의 sliding window attention, 초장문 모델의 로컬/글로벌 층 교대 배치 등으로 계속 쓰인다',
 '**선형 시퀀스 모델 계열** — "길이에 선형"이라는 목표는 [S4](#/p/s4)·[Mamba](#/p/mamba)·[RWKV](#/p/rwkv)처럼 attention 자체를 버리는 방향으로도 이어졌다',
 '**위치 인코딩과의 결합** — 긴 문맥을 다루려면 위치 표현도 외삽돼야 한다는 문제의식이 [RoPE](#/p/rope)·[ALiBi](#/p/alibi)와 같은 시기에 맞물려 진행됐다'
],

pitfalls:[
 '**"$O(n)$ 이니까 무조건 빠르다"가 아니다.** 짧은 시퀀스(≤1K)에서는 gather·마스킹 오버헤드 때문에 dense attention보다 느린 경우가 흔하다. 이득은 시퀀스가 충분히 길 때만 나온다.',
 '**전역 토큰을 어디에 둘지는 사람이 정한다.** QA면 질문 토큰, 분류면 `[CLS]` 식으로 태스크마다 수동 설계가 필요하고, 이 선택이 성능을 크게 좌우한다. 자동으로 학습되는 부분이 아니다.',
 '**자기회귀 생성과는 궁합이 애매하다.** 희소 패턴은 인코더형 긴 문서 이해에 최적화돼 있고, 디코딩 시 병목인 KV 캐시 문제는 전혀 해결하지 않는다. 그쪽은 [MQA](#/p/mqa)/[GQA](#/p/gqa)의 영역이다.'
],

figures:[
 {f:'fig2-sparse-attention-patterns.png',
  cap:'네 개의 $n \\times n$ 격자는 모두 "행=쿼리, 열=키, 초록색=attention을 계산하는 칸"이다. (a) 전체를 다 칠하는 원래 방식과 달리, (b)는 대각선 주변 띠만 칠해 각 토큰이 좌우 이웃만 보고, (c)는 그 띠 안에서 한 칸씩 건너뛰어(팽창) 같은 계산량으로 더 먼 거리를 보며, (d)는 (b)에 더해 세로·가로 줄이 추가로 칠해져 있는데 이게 몇 개 안 되는 전역(global) 토큰이 시퀀스 전체와 양방향으로 attention한다는 뜻이다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'To address this challenge, we sparsify the full self-attention matrix according to an “attention pattern” specifying pairs of input locations attending to one another.',
  src:'Section 3, p.3'}
],

links:[
 {t:'arXiv 2004.05150 — Longformer: The Long-Document Transformer', u:'https://arxiv.org/abs/2004.05150'},
 {t:'arXiv 2007.14062 — Big Bird: Transformers for Longer Sequences', u:'https://arxiv.org/abs/2007.14062'},
 {t:'Efficient Transformers: A Survey (Tay et al.)', u:'https://arxiv.org/abs/2009.06732'}
]
});
