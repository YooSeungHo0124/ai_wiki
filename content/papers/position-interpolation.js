WIKI.paper({
slug:'position-interpolation',
venue:'arXiv 2023',
authors:'Chen, Wong, Chen, Tian (Meta Platforms)',
arxiv:'2306.15595',

tldr:'`RoPE` 로 학습한 모델은 학습 때 못 본 위치 인덱스를 만나면 attention 점수가 폭발한다는 것을 이론적으로 보이고, 위치 인덱스를 학습 범위 안으로 **선형으로 눌러 넣는 것**만으로 [LLaMA](#/p/llama)의 문맥을 2048에서 32768까지 늘렸다. 미세조정은 단 1000 스텝이면 충분했다.',

context:'[LLaMA](#/p/llama)를 비롯한 당시 LLM은 [RoPE](#/p/rope)로 위치를 인코딩했고 2048 토큰 안에서만 학습됐다. 단순히 더 긴 시퀀스를 넣고 그대로 추론하면(외삽, extrapolation) perplexity가 $10^3$ 을 넘게 치솟았다. 직접 긴 문맥으로 계속 미세조정하는 방법도 있었지만 만 스텝을 돌려도 2048→2560 정도로 창이 거의 늘지 않았다. 질문은 명확했다 — 왜 Transformer는 훈련 때보다 긴 시퀀스로 못 가는가, 그리고 값싸게 고칠 수 있는가.',

ideas:[
 {h:'외삽이 실패하는 이유를 수식으로 보인다',
  lead:'학습 범위 밖 위치 $s$ 에서 attention 점수의 상한이 학습 범위 안보다 훨씬 크게 풀린다.',
  d:'RoPE의 attention 점수는 $a(s)=\\text{Re}\\sum_j h_j e^{is\\theta_j}$ 형태의 삼각함수 합으로 쓸 수 있다. 이 함수를 $[0,L]$ 구간의 점들로만 학습하면 그 구간 밖에서 함수 값이 얼마나 커질지는 전혀 통제되지 않는다 — 다항식 보간이 관측 구간 밖에서 요동치는 것과 같은 현상이다. 논문은 이 외삽 상한을 이론적으로 유도해, 학습 밖 위치에서 값이 "catastrophically" 커질 수 있음을 보인다.'},
 {h:'Position Interpolation: 위치를 나누기만 한다',
  lead:'위치 인덱스 $m$ 을 $m \\cdot L/L\\prime$ 로 축소해 항상 학습 범위 $[0,L]$ 안에 있게 만든다.',
  d:'문맥을 $L$ 에서 $L\\prime$ 로 늘리고 싶으면, RoPE에 넣는 위치 인덱스를 원래 $m$ 대신 $mL/L\\prime$ 로 바꾼다. 그러면 $L\\prime$ 개의 새 위치가 모두 원래 학습됐던 $[0,L]$ 구간 안으로 눌려 들어간다. 모델 구조·가중치는 전혀 안 바뀌고, forward pass에서 위치 인덱스를 계산하는 한 줄만 바뀐다.'},
 {h:'보간 상한이 외삽 상한보다 600배 작다',
  lead:'같은 이론으로 보간 구간의 함수 변동 상한을 구하면 외삽 상한보다 약 600배 작다.',
  d:'구간을 촘촘히 눌러 넣으면 인접한 두 학습 포인트 사이의 간격이 좁아지므로, 그 사이에서 함수가 튈 수 있는 폭(상한)도 훨씬 좁아진다. LLaMA 7B 설정에서 이 상한이 외삽 대비 약 $2\\cdot294.73\\approx 600\\times$ 작다는 것을 직접 계산해 보인다. 이 안정성 덕분에 모델이 새 위치 스케일에 적응하는 데 필요한 학습량이 크게 줄어든다.'},
 {h:'미세조정 1000 스텝, 사전학습 대비 공짜',
  lead:'전체 재학습이 아니라 Pile 데이터로 짧게 미세조정만 하면 새 창을 쓸 수 있다.',
  d:'미세조정 없이도(0 스텝) 8192 문맥에서 perplexity가 20 미만으로 나와 이미 외삽(>$10^3$)보다 압도적으로 안정적이다. 여기에 [Pile](#/p/the-pile) 데이터로 1000 스텝만 미세조정하면 원래 2048 창에서의 perplexity를 오히려 넘어서는 수준까지 개선된다. 사전학습 비용에 비하면 무시할 만한 추가 비용이다.'}
],

diagram:{type:'compare', cap:'같은 위치 4096을 다루는 두 방식. 외삽은 모델이 한 번도 보지 못한 위치를, 보간은 이미 학습된 위치 범위 안의 값을 쓴다.',
 left:{t:'외삽 (Extrapolation)', items:['위치 인덱스를 그대로 4096까지 사용','학습 범위 [0,2048] 밖으로 나감','attention 점수 상한 통제 불가','PPL이 10³ 이상으로 발산']},
 right:{t:'Position Interp.', items:['위치를 m·L/L′로 축소','모든 인덱스가 [0,2048] 안에 남음','상한이 외삽 대비 약 600× 작음','1000 스텝 미세조정으로 안정']}
},

math:[
 {expr:'a(s) = Re Σ h_j e^{i s θ_j},  θ_j = 10000^{-2j/d}',
  tex:'a(s)=\\text{Re}\\sum_{j=0}^{d/2-1} h_j\\, e^{is\\theta_j}',
  d:'RoPE를 적용한 두 위치 사이의 attention 점수는 상대 거리 $s=m-n$ 에 대한 삼각함수 기저의 선형결합으로 쓸 수 있다. 이 표현이 이론 분석의 출발점이다.'},
 {expr:"f'(x, m) = f(x, m·L/L')",
  tex:"f'(x,m)=f\\!\\left(x,\\ \\frac{mL}{L'}\\right)",
  d:'Position Interpolation의 전부다. 원래 위치 함수 $f$ 에 넣던 위치 $m$ 대신, 새 문맥 길이 $L\\prime$ 에 맞춰 축소한 $mL/L\\prime$ 을 넣는다. $L\\prime=4L$ 이면 위치 간격이 1/4로 촘촘해진다.'}
],

numbers:[
 {k:'문맥 확장', v:'2048 → 32768', d:'LLaMA 7B~65B 전 규모에서 확인'},
 {k:'미세조정 비용', v:'1000 스텝', d:'직접 미세조정 방식은 10000 스텝을 써도 2048→2560 수준'},
 {k:'이론적 안정성', v:'약 600×', d:'보간 attention 점수 상한이 외삽 상한보다 작음 (LLaMA 7B)'},
 {k:'PPL·8192 문맥, 0 스텝', v:'< 20', d:'미세조정 전에도 외삽($>10^3$)과 비교가 안 될 만큼 안정'},
 {k:'PPL·32768, 7B PI', v:'6.77', d:'PG19에서 문맥을 늘릴수록 오히려 perplexity가 낮아짐(6.77 vs 2048창 7.20)'}
],

impact:'문맥을 늘리려면 처음부터 긴 시퀀스로 재학습해야 한다는 전제를 깨고, **추론 시점의 위치 인덱스 스케일링**만으로 사후 확장이 가능함을 보였다. 이후 나온 [YaRN](#/p/yarn)·NTK-aware scaling·동적 스케일링은 전부 이 선형 보간의 변형이거나 대안이다. "긴 문맥 LLM"이 사전학습 재설계 문제에서 값싼 후처리 문제로 바뀐 최초의 사례다.',

legacy:[
 '**주파수별 차등 스케일링** — [YaRN](#/p/yarn)이 모든 RoPE 차원을 동일하게 누르는 대신 저주파/고주파를 다르게 다뤄 성능 저하를 더 줄임',
 '**동적 스케일링** — 추론 중 실제 입력 길이에 맞춰 스케일 비율을 그때그때 계산하는 NTK-aware/dynamic RoPE 변형들이 뒤이어 등장',
 '**"문맥을 늘렸다"의 검증 기준** — 이 논문의 passkey retrieval 실험이 이후 긴 문맥 모델을 평가하는 표준 태스크가 됨',
 '**긴 문맥이 곧 활용은 아니라는 반증** — [Lost in the Middle](#/p/lost-in-the-middle)이 늘어난 창 안에서도 중간 정보를 놓친다는 것을 보여, 창 확장과 실사용 성능이 별개임을 드러냄'
],

pitfalls:[
 '**보간은 원래 창 안 성능을 공짜로 지키지 못한다.** 위치를 촘촘히 누르는 만큼 원래 2048 구간 내 해상도가 낮아져, proof-pile 등에서 0.01~0.05 수준의 소폭 성능 저하가 실제로 관측된다.',
 '**"외삽이 아예 불가능하다"는 주장이 아니다.** 논문은 RoPE 기반 모델의 **직접** 외삽이 불안정함을 보인 것이지, 위치 인코딩 자체(예: [ALiBi](#/p/alibi))가 모두 외삽에 약하다는 뜻은 아니다.',
 '**선형 보간은 모든 RoPE 차원을 동일 비율로 압축한다.** 고주파 차원(가까운 토큰 구분)까지 똑같이 눌려서 지역적 위치 해상도가 저하되는데, 이 비효율을 겨냥해 나온 것이 [YaRN](#/p/yarn)의 차원별 스케일링이다.'
],

figures:[
 {f:'fig1-interpolation.png',
  cap:'위: 정상 사용(왼쪽, 파란 점이 학습 범위 [0,2048] 안)과 외삽(오른쪽, 빨간 점이 학습 밖 [2048,4096]). 아래: Position Interpolation은 같은 [0,4096] 범위의 점들(초록·파랑)을 f′(x,m)=f(x,m/2) 로 절반씩 압축해 전부 [0,2048] 안으로 넣는다 — 파형의 위상 패턴 자체는 유지된 채 점 간격만 좁아진 것을 볼 것.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'Instead of extrapolation, we directly down-scale the input position indices so that the maximum position index matches the previous context window limit in the pre-training stage.',
  src:'Abstract 근처 서론, p.1'}
],

links:[
 {t:'arXiv 2306.15595 — Extending Context Window of LLMs via Positional Interpolation', u:'https://arxiv.org/abs/2306.15595'},
 {t:'RoFormer (RoPE) 원 논문', u:'https://arxiv.org/abs/2104.09864'}
]
});
