WIKI.paper({
slug:'bert4rec',
venue:'CIKM 2019',
authors:'Sun, Liu, Wu, Pei, Lin, Ou, Jiang (Alibaba · 북경대)',
arxiv:'1904.06690',

tldr:'[SASRec](#/p/sasrec)의 단방향 제약을 풀고 [BERT](#/p/bert)처럼 **양방향 attention + 마스킹(Cloze) 학습**을 순차 추천에 가져온 논문. "다음 아이템 맞히기"를 "빈칸 채우기"로 바꿔, 왼쪽만 보던 모델이 앞뒤 맥락을 모두 쓰게 만들었다.',

context:'[SASRec](#/p/sasrec)이 self-attention 을 추천에 들여왔지만 한 가지 제약을 물려받았다 — **인과 마스킹**이다. $t$ 시점의 표현은 $t$ 이전만 볼 수 있다. 언어모델이라면 다음 단어를 생성해야 하니 당연하지만, 추천에서 이 제약이 꼭 필요한지는 다른 문제다. 사용자의 행동 순서는 문장만큼 엄격하지 않다 — 장바구니에 담는 순서는 상당 부분 우연이고, 어떤 아이템을 이해하는 데 그 뒤에 무엇을 봤는지가 도움이 된다. 단방향 모델은 이 정보를 버린다. [GPT-1](#/p/gpt1) 대 [BERT](#/p/bert)의 대립이 추천에서 그대로 반복되는 지점이다.',

ideas:[
 {h:'양방향으로 보되 정보 누출을 막아야 한다',
  lead:'앞뒤를 모두 보게 하면서 정답을 미리 보는 것은 막아야 하는 모순을 풀어야 한다.',
  d:'단순히 마스킹을 없애면 $t$ 시점 표현이 $t$ 시점 아이템 자신을 보게 되어, 예측이 무의미해진다(정답을 입력으로 받는 셈). 여러 층을 쌓으면 간접적으로도 새어 들어온다. 양방향을 쓰려면 **학습 목표 자체를 바꿔야** 한다.'},
 {h:'Cloze — 빈칸 채우기로 목표를 바꾼다',
  lead:'시퀀스 일부를 `[mask]`로 가리고 그 자리의 아이템을 앞뒤 맥락으로 맞힌다.',
  d:'[BERT](#/p/bert)의 마스킹 언어모델을 그대로 가져왔다. 가려진 위치는 자기 자신을 볼 수 없으니 누출이 없고, 나머지 위치는 앞뒤를 자유롭게 참조한다. 부수 효과도 크다 — 시퀀스 하나에서 **어느 위치를 가리느냐에 따라 여러 개의 학습 샘플**이 나온다. 단방향 모델이 시퀀스당 예측 하나를 얻는 것과 대비되어, 데이터가 적을 때 특히 유리하다.'},
 {h:'학습과 추론의 불일치를 꼬리 마스크로 메운다',
  lead:'추론 시에는 시퀀스 끝에 `[mask]`를 붙여 그 자리를 예측한다.',
  d:'Cloze 의 약점은 실제 과제("다음에 볼 아이템")와 학습 목표("가운데 빈칸")가 다르다는 것이다. 저자들은 추론 시 시퀀스 맨 뒤에 `[mask]` 토큰을 하나 덧붙여 그 자리를 맞히게 한다. 그리고 학습 중에도 **마지막 위치만 가린 샘플을 일부 섞어** 이 상황을 미리 연습시킨다.'},
 {h:'구조는 BERT 그대로, 토큰만 아이템으로',
  lead:'양방향 Transformer 블록을 쌓고 아이템 임베딩 + 학습 가능한 위치 임베딩을 입력으로 쓴다.',
  d:'다층 양방향 self-attention 과 position-wise FFN 을 그대로 쓴다. 다른 점은 어휘가 단어가 아니라 아이템이고, 문장 쌍 과제(NSP)가 없다는 것이다. **아키텍처 혁신이 아니라 학습 목표의 이식**이 이 논문의 기여다.'}
],

diagram:{type:'compare', cap:'같은 self-attention을 쓰지만 무엇을 맞히도록 학습하느냐가 다르고, 그 차이가 참조 가능한 맥락의 범위를 정한다.',
 left:{t:'SASRec: 단방향', items:[
  '인과 마스킹으로 미래 차단',
  '학습 목표는 다음 아이템 예측',
  '시퀀스당 예측 하나',
  '추론과 학습 목표가 일치']},
 right:{t:'BERT4Rec: 양방향', items:[
  '마스킹 없이 앞뒤 모두 참조',
  '학습 목표는 빈칸 채우기',
  '마스크 위치마다 샘플 생성',
  '추론 시 끝에 mask를 덧붙임']}},

math:[
 {tex:'\\mathcal{L} \;=\; \\frac{1}{|\\mathcal{S}_u^{m}|} \\sum_{v_m \\in \\mathcal{S}_u^{m}} -\\log P\\!\\left(v_m = v_m^{*} \\mid \\mathcal{S}_u^{\\prime}\\right)',
  expr:'L = (1/|마스크|) Σ −log P(가려진 아이템 = 정답)',
  d:'가려진 위치에 대해서만 손실을 계산한다. $\\mathcal{S}_u^{\\prime}$ 은 일부가 `[mask]` 로 바뀐 시퀀스다. 마스킹 비율 $\\rho$ 가 하이퍼파라미터이며, 클수록 샘플은 늘지만 맥락이 줄어든다.'},
 {tex:'P(v) \;=\; \\mathrm{softmax}\\!\\left(\\mathrm{GELU}\\!\\left(\\mathbf{h}^{L}_{t}\\mathbf{W}^{P} + \\mathbf{b}^{P}\\right)\\mathbf{E}^{\\top} + \\mathbf{b}^{O}\\right)',
  expr:'P(v) = softmax(GELU(h W_P + b) Eᵀ + b_O)',
  d:'출력층에서 입력 아이템 임베딩 $\\mathbf{E}$ 를 다시 쓴다(weight tying). 파라미터를 줄이고 과적합을 막는 장치로, [SASRec](#/p/sasrec)과 같은 선택이다.'}
],

numbers:[
 {k:'Beauty · NDCG@10', v:'0.1862', d:'[SASRec](#/p/sasrec) 0.1633 대비 **+14.0%**'},
 {k:'Beauty · HR@10', v:'0.3025', d:'SASRec 0.2653 대비 +14.0%'},
 {k:'Steam · NDCG@10', v:'0.2261', d:'SASRec 0.2147 대비 +5.3% — 밀집 데이터에서는 격차가 작다'},
 {k:'MovieLens-1M · HR@1', v:'0.2863', d:'SASRec 0.2351 대비 **+21.8%**'},
 {k:'비교 대상', v:'POP · BPR-MF · NCF · FPMC · GRU4Rec · Caser · SASRec', d:'비신경망부터 당시 최신까지 8종'}
],

impact:'순차 추천에서 양방향 학습이 표준 선택지가 됐다. 산업 현장의 사용자 표현 학습에서 "행동 이력을 마스킹해 사전학습하고 다운스트림 과제에 미세조정한다"는 [BERT](#/p/bert)식 파이프라인이 자리 잡은 것도 이 논문 이후다. 넓게 보면 **NLP 의 사전학습 패러다임이 추천으로 통째로 이식된 사례**이며, 이후 아이템을 토큰으로 다루는 관점이 LLM 기반 추천으로 이어진다.',

legacy:[
 '**사전학습·미세조정 파이프라인** — 대규모 행동 로그로 사전학습한 사용자 인코더를 여러 과제에 재사용하는 구조가 산업에서 널리 쓰이게 됐다',
 '**후보 생성과의 결합** — [투 타워](#/p/two-tower) 구조의 사용자 타워를 이런 시퀀스 인코더가 맡는 구성이 표준이 됐다',
 '**재현성 논쟁의 계기** — 2022년 RecSys 재현 연구가 BERT4Rec 의 공개 구현이 논문 수치를 재현하지 못하며, 충분히 오래 학습하면 SASRec 이 대등하거나 낫다고 보고했다. 순차 추천 평가 관행 전반을 다시 보게 만든 사건이다',
 '**LLM 기반 추천으로** — 아이템 시퀀스를 언어처럼 다루는 관점이 굳어지며, 이후 언어모델에 이력을 직접 넣는 연구로 확장됐다'
],

pitfalls:[
 '**재현이 어렵다는 보고가 있다.** 후속 재현 연구에서 공개 코드가 논문 수치에 미치지 못했고, 학습 시간을 충분히 주면 [SASRec](#/p/sasrec)이 따라잡거나 앞선다는 결과가 나왔다. 이 논문의 개선폭을 인용할 때는 그 논쟁을 함께 알아야 한다.',
 '**평가 프로토콜이 관대하다.** 정답 1개와 인기도 기반 부정 샘플 100개 중 순위를 매기는 방식이라, 전체 아이템을 대상으로 하면 점수가 크게 낮아지고 모델 간 순위도 달라질 수 있다.',
 '**양방향이 항상 이득은 아니다.** 실시간 추천처럼 "지금 다음"을 맞혀야 하는 상황에서는 미래 맥락이 애초에 존재하지 않는다. 양방향의 이득은 주로 **표현 학습** 쪽이며, 학습과 추론의 목표 불일치는 이 논문의 꼬리 마스크로도 완전히 해소되지 않는다.'
],

figures:[
 {f:'fig1-architecture.png', cap:'왼쪽(b)이 BERT4Rec, 오른쪽 위(c)가 SASRec, 오른쪽 아래(d)가 RNN 계열. **연결선의 방향**을 보면 된다 — BERT4Rec은 각 위치가 앞뒤 모두와 이어지고, (c)와 (d)는 왼쪽에서 오른쪽으로만 흐른다. 입력 맨 오른쪽이 [mask] 토큰이고 그 자리를 맞히는 것이 학습 목표다.', src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'To avoid the information leakage and efficiently train the bidirectional model, we adopt the Cloze objective to sequential recommendation, predicting the random masked items in the sequence by jointly conditioning on their left and right context.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1904.06690 — BERT4Rec', u:'https://arxiv.org/abs/1904.06690'},
 {t:'A Systematic Review and Replicability Study of BERT4Rec (RecSys 2022)', u:'https://arxiv.org/abs/2207.07483'}
]
});
