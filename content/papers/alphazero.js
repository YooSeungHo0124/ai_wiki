WIKI.paper({
slug:'alphazero',
venue:'arXiv 2017 (개정판: Science 362, 2018)',
authors:'Silver, Hubert, Schrittwieser et al. (DeepMind)',
arxiv:'1712.01815',

tldr:'[AlphaGo](#/p/alphago)에서 **인간 기보와 바둑 특유의 가정을 전부 걷어내고**, 무작위 초기화된 하나의 네트워크가 self-play만으로 바둑·체스·쇼기를 각각 몇 시간 만에 세계 최강 프로그램 수준으로 끌어올린 논문. "탐색이 데이터를 만들고 그 데이터로 학습한 망이 다시 탐색을 개선한다"는 순환 하나만 남겼다.',

context:'[AlphaGo](#/p/alphago)는 강했지만 바둑에 깊게 맞춰져 있었다. 인간 기보로 정책망을 부트스트랩했고, 손으로 설계한 특징 평면을 입력으로 썼고, 바둑판의 8중 회전·반사 대칭을 데이터 증강에 사용했고, 리프 평가에 빠른 롤아웃을 절반 섞었다. 한편 체스 쪽 전통은 완전히 다른 세계였다 — 20년간 축적된 알파-베타 탐색, 사람이 손으로 조율한 평가 함수, 오프닝 북과 엔드게임 테이블베이스가 Stockfish 같은 엔진을 지탱했다. 두 세계 모두 **도메인 지식이 성능의 상당 부분을 차지한다**는 전제 위에 있었다. 그래서 질문은 이렇게 정리된다 — 게임 규칙과 self-play 말고 아무것도 주지 않으면 어디까지 갈 수 있는가, 그리고 그 답이 게임마다 달라지는가.',

ideas:[
 {h:'지도학습 단계의 완전한 제거',
  lead:'인간 기보 없이 무작위 초기화에서 곧바로 self-play로 시작한다.',
  d:'인간 기보를 쓰는 단계가 아예 없다. 파라미터를 무작위로 초기화한 뒤 곧바로 self-play를 시작하고, 처음에는 사실상 무작위로 두던 에이전트가 스스로 만든 대국을 학습 데이터로 삼아 올라간다. 인간 기보가 없으니 **인간의 오프닝 편향도 없다** — AlphaZero는 사람이 즐겨 쓰는 정석들을 스스로 발견해 한동안 쓰다가, 학습이 진행되면서 그중 상당수를 버리는 궤적을 보였다.'},
 {h:'정책망과 가치망을 하나의 몸통으로 합친다',
  lead:'잔차망 하나가 몸통을 공유하며 정책과 가치 두 머리를 동시에 낸다.',
  d:'AlphaGo가 정책망·RL 정책망·가치망·롤아웃 정책 네 개를 따로 굴렸다면, 여기서는 **잔차 신경망 하나**가 두 개의 머리로 $(\\mathbf{p}, v)$ 를 동시에 낸다. 국면을 이해하는 표현은 "어디에 둘까"와 "누가 이기고 있나"에 공통이므로 몸통을 공유하는 것이 정규화로도 작용한다. 리프 평가에서 롤아웃도 사라져, 탐색 중 신경망 평가가 유일한 국면 평가다.'},
 {h:'탐색 결과를 정책의 학습 타깃으로 삼는다 — 정책 향상 연산자로서의 MCTS',
  lead:'MCTS의 방문 분포가 신경망의 사전확률보다 나으므로, 그 분포를 학습 타깃으로 되먹인다.',
  d:'이 논문의 핵심 순환이다. 네트워크의 사전확률 $\\mathbf{p}$ 로 800회 시뮬레이션을 돌리면, 방문 횟수 분포 $\\boldsymbol{\\pi} \\propto N^{1/\\tau}$ 는 원래의 $\\mathbf{p}$ 보다 **거의 항상 더 나은 정책**이다. 탐색이 여러 수 앞을 실제로 굴려 $\\mathbf{p}$ 의 오차를 씻어냈기 때문이다. 그래서 $\\mathbf{p}$ 를 $\\boldsymbol{\\pi}$ 에 맞추도록 학습시키면 다음 판의 탐색은 더 좋은 사전확률에서 출발한다. MCTS를 "탐색 알고리즘"이 아니라 **정책 향상 연산자**로 재해석한 것이 AlphaZero의 이론적 골격이다.'},
 {h:'승/패 이진 확률이 아니라 기댓값을 예측한다',
  lead:'무승부가 많은 체스·쇼기를 위해 결과의 기댓값 자체를 회귀한다.',
  d:'바둑에는 무승부가 사실상 없지만 체스는 무승부가 다수다. 그래서 가치 머리를 "이길 확률"이 아니라 **결과의 기댓값**($-1$/$0$/$+1$의 기댓값)으로 정의하고 그것을 직접 회귀한다. 사소해 보이지만, 이 변경이 없으면 무승부가 지배적인 게임에서 가치 신호가 무너진다. 대칭 증강도 뺐다 — 체스는 좌우 반전이 캐슬링·폰 진행 방향 때문에 다른 국면이 되기 때문이다.'},
 {h:'평가 게이트를 없애고 최신 파라미터로 계속 돈다',
  lead:'승률 게이트 없이 단일 네트워크를 계속 갱신하며 학습을 끊지 않는다.',
  d:'AlphaGo Zero는 새 네트워크가 기존 최고 네트워크를 상대로 승률 55%를 넘어야 self-play 생성자로 교체하는 **게이트**를 두었다. AlphaZero는 이 절차를 버리고 단일 네트워크를 계속 갱신하며 최신 파라미터로 곧바로 대국을 생성한다. 파이프라인이 단순해지고 학습이 끊기지 않는다. 하이퍼파라미터도 게임마다 다시 튜닝하지 않았고, 루트 Dirichlet 탐험 노이즈의 스케일만 각 게임의 평균 합법수 개수에 맞춰 조정했다.'}
],

diagram:{type:'loop', cap:'AlphaZero의 유일한 루프. 인간 데이터도, 게임별 휴리스틱도, 롤아웃도 없이 이 순환 하나가 전부다.',
 center:'self-play ↔ 학습',
 nodes:[
  {t:'현재 네트워크 f_θ', s:'(p, v) 두 머리 · 잔차망 하나'},
  {t:'MCTS 800 시뮬레이션', s:'p를 사전확률로, v를 리프 평가로', acc:true},
  {t:'방문 분포 π 로 착수', s:'p보다 나은 정책'},
  {t:'대국 종료 → 결과 z', s:'(s, π, z) 를 저장'},
  {t:'θ 갱신', s:'v→z 회귀 + p→π 교차엔트로피'}
 ]},

figures:[
 {f:'fig1-elo-training.png', cap:'세 패널 모두 x축은 self-play 학습 스텝(70만 스텝까지), y축은 Elo. 파란 곡선(AlphaZero)이 초반에 가파르게 올라가 수평선(기존 최강 프로그램의 Elo)을 넘어서는 지점이 핵심 — 체스는 약 30만 스텝, 쇼기는 약 11만 스텝, 바둑은 약 16.5만 스텝에서 각각 Stockfish·Elmo·AlphaGo Zero(3일 버전)를 추월한다.', src:'원문 Figure 1, p.4'},
 {f:'fig2-scalability.png', cap:'x축은 수당 사고 시간(로그 스케일, 초), y축은 상대 Elo. 같은 사고 시간을 줄 때 파란 곡선(AlphaZero)의 기울기가 초록 곡선(Stockfish/Elmo)보다 가팔라, 시간이 늘수록 MCTS 쪽이 알파-베타 탐색보다 더 빠르게 강해진다는 뜻 — "AlphaZero가 적게 보고도 이긴다"는 주장의 근거가 되는 그래프.', src:'원문 Figure 2, p.7'}
],

quotes:[
 {t:'Starting from random play, and given no domain knowledge except the game rules, AlphaZero achieved within 24 hours a superhuman level of play in the games of chess and shogi (Japanese chess) as well as Go, and convincingly defeated a world-champion program in each case.', src:'Abstract, p.1'},
 {t:'AlphaZero searches just 80 thousand positions per second in chess and 40 thousand in shogi, compared to 70 million for Stockfish and 35 million for Elmo.', src:'p.5'}
],

math:[
 {expr:'l = (z − v)² − πᵀ log p + c‖θ‖²',
  tex:'l = (z-v)^2 - \\boldsymbol{\\pi}^{\\top}\\log \\mathbf{p} + c\\lVert\\theta\\rVert^2',
  d:'전체 손실 함수. 앞 항은 가치 머리를 실제 대국 결과 $z$ 에 맞추는 회귀, 가운데 항은 정책 머리를 탐색이 만든 분포 $\\boldsymbol{\\pi}$ 에 맞추는 교차 엔트로피다. **탐색 결과가 지도 신호가 된다**는 이 논문의 주장이 두 번째 항 하나에 압축돼 있다.'},
 {expr:'π(a | s) ∝ N(s, a)^(1/τ)',
  tex:'\\pi(a \\mid s) \\propto N(s,a)^{1/\\tau}',
  d:'방문 횟수를 온도 $\\tau$ 로 조절해 정책으로 읽는다. 학습 초반 수순에서는 $\\tau=1$ 로 두어 탐험을 유지하고, 이후에는 $\\tau \\to 0$ 으로 보내 가장 많이 방문한 수를 결정적으로 고른다.'},
 {expr:'U(s,a) = C(s) · P(s,a) · √(ΣN(s,·)) / (1 + N(s,a))',
  tex:'U(s,a) = C(s)\\cdot P(s,a)\\cdot \\dfrac{\\sqrt{\\sum_b N(s,b)}}{1+N(s,a)}',
  d:'PUCT 보너스. $P$ 는 신경망의 사전확률이고, 루트에서는 $P$ 에 Dirichlet 노이즈를 섞어 탐험을 강제한다. 방문이 쌓일수록 보너스가 줄어 실제 평가 $Q$ 가 선택을 지배한다.'}
],

numbers:[
 {k:'체스 vs Stockfish 8', v:'28승 72무 0패', d:'100판 · 수당 1분 · arXiv 초판 조건'},
 {k:'쇼기 vs Elmo', v:'90승 2무 8패', d:'같은 조건의 100판'},
 {k:'바둑 vs AlphaGo Zero(3일 버전)', v:'60승 40패', d:'AlphaGo Zero보다도 일반화된 설정으로'},
 {k:'추월까지 걸린 시간', v:'체스 4h · 쇼기 2h · 바둑 8h', d:'각각 30만·11만·16.5만 스텝'},
 {k:'초당 탐색 국면', v:'8만 (체스)', d:'Stockfish는 **7,000만** — 약 1,000배 적게 보고 이긴다'},
 {k:'학습 규모', v:'70만 스텝 × 배치 4,096', d:'무작위 초기화에서 시작'},
 {k:'하드웨어', v:'self-play TPU 5,000개 · 학습 TPU 64개', d:'1세대/2세대 TPU'},
 {k:'착수당 시뮬레이션', v:'800회', d:'세 게임 모두 동일한 값'}
],

impact:'**알고리즘이 도메인보다 위에 놓였다.** 같은 코드·같은 하이퍼파라미터가 규칙만 갈아끼우면 바둑·체스·쇼기에서 모두 최강 수준에 도달한다는 결과는, 수십 년간 게임별로 축적된 도메인 공학이 충분한 self-play 앞에서 대체 가능하다는 것을 보였다. 특히 체스에서 **초당 8만 국면**으로 **7,000만 국면**을 보는 엔진을 이겼다는 사실은 방향을 바꿨다 — 무차별 탐색량이 아니라 **어디를 볼지 고르는 학습된 판단**이 성능을 만든다. 이 결과는 곧바로 오픈소스 재현(Leela Chess Zero)과 상용 엔진의 신경망 평가 함수 도입(Stockfish NNUE)으로 이어져 컴퓨터 체스 판도를 다시 짰다. 남은 목발은 하나였다 — **규칙, 즉 완벽한 환경 시뮬레이터**. AlphaZero는 여전히 다음 국면을 정확히 시뮬레이션할 수 있어야만 탐색할 수 있다.',

legacy:[
 '**규칙마저 지우기** — 환경 모델을 주지 않고 잠재 동역학을 학습하는 [MuZero](#/p/muzero)가 같은 루프를 Atari처럼 규칙을 모르는 환경까지 확장',
 '**엔진 산업의 재편** — Leela Chess Zero 같은 오픈소스 재현과, 전통 알파-베타 엔진에 신경망 평가를 이식한 Stockfish NNUE로 흡수',
 '**LLM 추론의 청사진** — 생성 후보를 트리로 펼치고 가치 추정으로 가지치기하는 [Tree of Thoughts](#/p/tot), 여러 경로의 합의를 쓰는 [Self-Consistency](#/p/self-consistency)가 이 구도를 언어 도메인에 옮겼다',
 '**"탐색이 만든 데이터로 학습한다"** — 정책 향상 연산자로 좋은 궤적을 만들고 그것을 다시 학습하는 패턴이 [DeepSeek-R1](#/p/deepseek-r1)·[GRPO](#/p/grpo) 계열의 추론 학습에 재등장',
 '**과학 문제로의 이식** — 같은 골격이 행렬 곱셈 알고리즘 탐색(AlphaTensor)·정렬 알고리즘 최적화(AlphaDev)처럼 조합 탐색 문제로 확장됐다'
],

pitfalls:[
 '**"AlphaZero는 지식이 전혀 없다"는 과장이다.** 게임 규칙(합법수 생성과 다음 국면 전이)은 완전히 주어져 있고, 입력·출력 표현은 게임별로 손으로 설계됐으며(체스는 8×8×73의 착수 인코딩), 무엇보다 **완벽한 시뮬레이터로 탐색할 수 있다**는 전제가 있다. 제거된 것은 인간 기보와 평가 휴리스틱이지 환경 모델이 아니다.',
 '**Stockfish전의 조건은 논쟁거리였다.** arXiv 초판은 수당 1분 고정에 오프닝 북·엔드게임 테이블베이스 없이, 기본 해시 크기의 Stockfish 8을 상대로 했다. Science 개정판은 시간 제어와 오프닝 다양화를 보강해 다시 측정했으므로, 두 판의 수치를 섞어 인용하면 안 된다.',
 '**연산량을 빼고 알고리즘만 보면 오독한다.** 5,000개의 TPU로 self-play를 생성했다는 조건이 "4시간 만에 Stockfish를 넘었다"의 절반이다. 이 방법의 효율은 시뮬레이션이 값싼 도메인에 강하게 의존하며, 시뮬레이터가 느리거나 없는 실제 문제에는 그대로 적용되지 않는다.'
],

links:[
 {t:'arXiv 1712.01815 — Mastering Chess and Shogi by Self-Play with a General RL Algorithm', u:'https://arxiv.org/abs/1712.01815'},
 {t:'Science 362, 1140–1144 (2018) — 개정 발표판', u:'https://www.science.org/doi/10.1126/science.aar6404'},
 {t:'DeepMind — AlphaZero 소개', u:'https://deepmind.google/discover/blog/alphazero-shedding-new-light-on-chess-shogi-and-go/'}
]
});
