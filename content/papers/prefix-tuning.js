WIKI.paper({
slug:'prefix-tuning',
venue:'ACL 2021',
authors:'Xiang Lisa Li, Percy Liang (Stanford)',
arxiv:'2101.00190',

tldr:'가중치를 하나도 건드리지 않고, **모든 층의 attention 앞에 학습 가능한 "가상 토큰" 벡터열을 붙여** 태스크에 적응시키는 방법. 전체의 0.1% 파라미터만 학습하고도 생성 태스크에서 전체 미세조정과 비슷한 성능을 냈고, 데이터가 적을 때는 오히려 더 좋았다.',

context:'[GPT-3](#/p/gpt3)가 보여준 in-context learning은 이상한 사실을 하나 드러냈다 — **가중치를 전혀 바꾸지 않고 입력 앞에 예시 몇 개를 붙이는 것만으로** 태스크가 바뀐다. 하지만 이산적인 자연어 프롬프트는 탐색 공간이 사람이 쓴 문자열로 제한되고, 문맥 창을 잡아먹으며, 최적화가 불가능하다. 한편 [Adapter](#/p/adapter)는 파라미터는 아꼈지만 네트워크에 층을 실제로 더 쌓는 방식이었다. 이 논문의 발상은 둘 사이다 — **프롬프트를 이산 토큰이 아니라 연속 벡터로 두고, 경사하강법으로 직접 최적화하면 어떨까?**',

ideas:[
 {h:'프롬프트를 임베딩 공간에서 최적화한다',
  lead:'실제 단어에 대응하지 않는 자유 벡터를 시퀀스 앞에 붙여 경사하강법으로 학습한다.',
  d:'실제 어휘에 대응하는 토큰을 찾는 대신, **어떤 단어에도 대응하지 않는 자유로운 실수 벡터** $P_\\theta$ 를 시퀀스 앞에 붙이고 이것만 학습한다. 이산 토큰이라는 제약이 사라지므로 탐색 공간이 훨씬 넓고, 사람이 프롬프트를 손으로 깎을 필요도 없다. 뒤따르는 실제 토큰들은 attention을 통해 이 prefix를 "가상 토큰"처럼 참조한다.'},
 {h:'입력층이 아니라 모든 층에 prefix를 준다',
  lead:'모든 층의 key·value 앞에 층별 prefix를 붙여 표현력과 직접 조정력을 높인다.',
  d:'가장 단순한 구현은 임베딩 층에만 벡터를 붙이는 것이지만(훗날의 prompt tuning), 이 논문은 **모든 Transformer 층의 key·value 앞에** 층별 prefix를 붙인다. 표현력이 훨씬 커지고, 상위 층이 하위 층의 결과에 의존하지 않고 직접 조정될 수 있다. 실질적으로는 각 층의 KV 캐시 앞부분을 학습 가능한 상수로 채워 넣는 것과 같다.'},
 {h:'재파라미터화로 학습을 안정화한다',
  lead:'작은 행렬을 MLP에 통과시켜 prefix를 만들면 직접 최적화보다 수렴이 안정적이다.',
  d:'prefix 행렬을 직접 최적화하면 학습률에 극도로 민감하고 발산하기 쉽다. 그래서 더 작은 행렬 $P\'_\\theta$ 를 두고 MLP를 통과시켜 실제 prefix를 만든다: $P_\\theta = \\mathrm{MLP}(P\'_\\theta)$. 학습이 끝나면 MLP는 버리고 산출된 prefix 벡터만 저장한다 — 저장 비용은 그대로다.'},
 {h:'저데이터·미지 주제에서 전체 미세조정을 이긴다',
  lead:'적은 파라미터가 강한 정규화로 작동해 데이터가 적을수록 오히려 유리하다.',
  d:'파라미터가 적다는 것은 곧 정규화가 세다는 뜻이다. 학습 예시가 수백 개뿐인 low-data 구간에서 prefix-tuning은 전체 미세조정보다 **더 높은** 점수를 냈고, 학습 때 본 적 없는 주제(unseen topic)로의 외삽에서도 우세했다. 사전학습 지식을 덮어쓰지 않고 "끌어내는" 방식이기 때문이라는 것이 논문의 해석이다.'}
],

diagram:{type:'compare', cap:'무엇을 학습하는가 — 가중치인가, 입력인가.',
 left:{t:'전체 미세조정', items:[
  '모든 층의 모든 가중치를 갱신',
  '태스크당 모델 사본 1개 (100%)',
  '사전학습 지식을 덮어씀',
  '데이터가 적으면 과적합']},
 right:{t:'Prefix-Tuning', items:[
  '가중치 전부 동결 · prefix 벡터만 학습',
  '태스크당 0.1% 파라미터',
  '모든 층의 key/value 앞에 삽입',
  '저데이터 · 미지 주제에서 더 강함']}},

math:[
 {expr:'h_i = LM_φ( z_i , h_<i )   if i ∉ P_idx ,   h_i = P_θ[i, :]   if i ∈ P_idx',
  tex:'h_i=\\begin{cases}\\text{LM}_\\phi(z_i,h_{<i}) & i\\notin P_{\\text{idx}}\\\\ P_\\theta[i,:] & i\\in P_{\\text{idx}}\\end{cases}',
  d:'prefix 위치의 은닉 상태는 계산되는 것이 아니라 **학습 파라미터에서 직접 읽어온다**. 그 외 위치는 동결된 언어모델 $\\phi$ 가 평소대로 계산하되, attention을 통해 prefix를 참조하게 된다.'},
 {expr:'P_θ = MLP_θ( P\'_θ )',
  tex:'P_\\theta = \\text{MLP}_\\theta(P\'_\\theta)',
  d:'재파라미터화. 직접 최적화보다 수렴이 안정적이며, 학습 종료 후 $P_\\theta$ 만 남기고 MLP는 폐기한다.'}
],

numbers:[
 {k:'학습 파라미터 비율', v:'0.1%', d:'전체 미세조정 100% 대비'},
 {k:'전체 데이터 성능', v:'전체 미세조정과 동등', d:'table-to-text([GPT-2](#/p/gpt2)) · 요약(BART)'},
 {k:'저데이터 구간', v:'전체 미세조정보다 우수', d:'학습 예시가 적을수록 격차가 벌어짐'}
],

impact:'"태스크 적응 = 가중치 갱신"이라는 등식을 깨고, **입력 공간에서의 적응**이라는 별도 축을 만들었다. 이후 prompt tuning(입력층만, 모델이 커질수록 전체 미세조정에 수렴), P-tuning v2 등 연속 프롬프트 계열이 여기서 갈라져 나왔다. 실무적으로는 하나의 동결된 백본에 태스크별 prefix만 갈아끼우는 서빙 구조를 제시했고, 배치 안에서 서로 다른 태스크의 prefix를 섞어 처리할 수 있다는 점이 [Adapter](#/p/adapter)에는 없는 장점이었다. 다만 곧이어 나온 [LoRA](#/p/lora)가 문맥 창을 잡아먹지 않으면서 최적화도 쉽다는 이유로 실무 표준 자리를 가져갔다.',

legacy:[
 '**연속 프롬프트 계열의 원점** — prompt tuning, P-tuning v2 등 "이산 프롬프트를 미분 가능한 벡터로 바꾼다"는 방향의 출발점',
 '**PEFT 삼분법의 확립** — [Adapter](#/p/adapter)(모듈 삽입) · prefix(입력 조작) · [LoRA](#/p/lora)(가중치 델타)라는 세 갈래 분류가 이 논문으로 완성됐다',
 '**프롬프트 엔지니어링의 이론적 배경** — "프롬프트가 왜 작동하는가"를 최적화 문제로 재정식화하면서 [사고 사슬](#/p/cot) 같은 프롬프트 기법 연구의 언어를 제공',
 '**멀티태스크 서빙** — 동결 백본 + 태스크별 KV prefix 구조는 오늘날 다중 어댑터 서빙 설계의 직접적 선행 사례'
],

pitfalls:[
 '**prefix는 문맥 창을 실제로 소모한다.** 길이 $l$ 의 prefix를 붙이면 사용 가능한 입력 길이가 그만큼 줄고, attention 비용도 늘어난다. 긴 문서 태스크에서는 이 손해가 무시하기 어렵다.',
 '**최적화가 까다롭다.** 재파라미터화 없이는 발산하기 쉽고, prefix 길이·학습률에 성능이 크게 흔들린다. LoRA 대비 하이퍼파라미터 튜닝 부담이 큰 것이 실무 채택이 밀린 주된 이유다.',
 '**"prefix = 사람이 읽을 수 있는 프롬프트"가 아니다.** 학습된 벡터를 가장 가까운 어휘로 사영해도 대개 의미 없는 토큰들이 나온다. 해석 가능한 프롬프트를 얻는 방법이 아니다.'
],

figures:[
 {f:'fig1-finetune-vs-prefix.png',
  cap:'위 Fine-tuning은 태스크(번역·요약·표-to-텍스트)마다 통째로 복제된 빨간 Transformer 박스 전체가 학습 대상이라는 뜻이고, 아래 Prefix-tuning은 회색 "Transformer (Pretrained)"가 모든 태스크에서 완전히 같은 채 그 앞에 붙는 작은 분홍 "Prefix" 블록만 태스크별로 다르다. 즉 저장해야 하는 것이 위에서는 모델 전체 사본, 아래에서는 prefix 벡터 하나뿐이라는 대비가 그림의 핵심.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'Prefix-tuning draws inspiration from prompting, allowing subsequent tokens to attend to this prefix as if it were “virtual tokens”.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2101.00190 — Prefix-Tuning: Optimizing Continuous Prompts for Generation', u:'https://arxiv.org/abs/2101.00190'},
 {t:'The Power of Scale for Parameter-Efficient Prompt Tuning (후속 연구)', u:'https://arxiv.org/abs/2104.08691'},
 {t:'Hugging Face PEFT — Prefix Tuning 문서', u:'https://huggingface.co/docs/peft/package_reference/prefix_tuning'}
]
});
