WIKI.paper({
slug:'pointer-generator',
venue:'ACL 2017',
authors:'See, Liu, Manning (Stanford University · Google Brain)',
arxiv:'1704.04368',

tldr:'요약에서 매 스텝마다 **원문 단어를 그대로 복사할지, 어휘사전에서 새 단어를 생성할지**를 확률 $p_{gen}$으로 부드럽게 섞는 하이브리드 seq2seq 모델. 여기에 이전 attention을 누적한 커버리지 벡터로 반복 생성을 억제해, 당시 최고 추상 요약 시스템을 ROUGE 기준 최소 2점 앞질렀다.',

context:'2015~2016년의 신경망 추상(abstractive) 요약은 [seq2seq](#/p/seq2seq)에 [Bahdanau attention](#/p/bahdanau)을 얹은 구조가 표준이었고, 대부분 헤드라인 생성처럼 한두 문장으로 압축하는 짧은 과제에 머물렀다. 이 구조를 CNN/Daily Mail 같은 긴 다문장 요약에 적용하면 두 가지 문제가 두드러졌다. 첫째, 어휘사전에 없는 고유명사(muhammadu buhari 같은)를 `UNK`로 뭉개거나 엉뚱한 단어로 대체하는 **OOV 문제**. 둘째, 같은 구절을 계속 반복해서 생성하는 **반복 문제**. 저자들은 "복사"와 "생성"을 아키텍처 차원에서 통합하고, 과거에 무엇을 봤는지 기억하는 장치를 추가해 이 두 문제를 동시에 겨냥한다.',

ideas:[
 {h:'포인터와 생성기를 확률 $p_{gen}$으로 섞는다',
  lead:'매 디코더 스텝마다 어휘분포와 attention분포를 $p_{gen}$ 가중합해 최종 분포를 만든다.',
  d:'컨텍스트 벡터 $h_t^*$·디코더 상태 $s_t$·디코더 입력 $x_t$로부터 $[0,1]$ 스칼라 $p_{gen}$을 계산한다. 최종 단어 분포는 어휘사전에서 뽑는 $P_{vocab}$과 원문 단어를 가리키는 attention 분포 $a^t$를 $p_{gen}$으로 가중합한 것이다. 학습 신호 없이도 모델이 상황에 따라 복사와 생성 중 어느 쪽에 기울지를 스스로 배운다.'},
 {h:'확장 어휘로 OOV 단어를 그대로 출력한다',
  lead:'문서마다 원문 단어를 어휘사전에 임시로 합쳐, 사전에 없는 단어도 복사로 출력할 수 있게 한다.',
  d:'문서별 "확장 어휘(extended vocabulary)" = 고정 어휘사전 ∪ 원문에 나오는 모든 단어. OOV 단어 $w$는 $P_{vocab}(w)=0$이지만 attention 분포 쪽에서 확률을 받아 최종 분포 $P(w)$가 0이 아니게 된다. 그 결과 `2-0`처럼 사전에 없는 표현도 원문을 가리켜서 그대로 출력할 수 있다 — 기존 seq2seq는 구조적으로 불가능했던 부분이다.'},
 {h:'커버리지 벡터로 "이미 본 곳"을 기억한다',
  lead:'과거 모든 attention 분포의 합을 커버리지 벡터로 유지해 반복 attention에 패널티를 준다.',
  d:'커버리지 벡터 $c^t$는 스텝 0부터 $t-1$까지의 attention 분포를 모두 더한 것으로, "지금까지 각 원문 단어가 얼마나 주목받았는지"를 나타낸다. 이를 attention score 계산에 추가 입력으로 넣어, 다음에 어디를 볼지 결정할 때 과거 이력을 참고하게 만든다. Tu et al.(2016)의 기계번역용 커버리지를 요약에 맞게 변형한 것이다.'},
 {h:'커버리지 손실로 반복 자체에 직접 페널티를 준다',
  lead:'현재 attention과 누적 커버리지의 겹침을 손실에 더해 같은 곳을 반복해서 보는 것을 막는다.',
  d:'커버리지 손실은 $\\sum_i \\min(a_i^t, c_i^t)$로, 이미 많이 본 위치를 다시 강하게 주목하면 손실이 커진다. 기계번역과 달리 요약은 원문을 균일하게 다 봐야 하는 게 아니므로, "새로 보는 곳"이 아니라 "겹치는 정도"만 벌점을 준다. 이 손실을 가중치 $\\lambda$로 기존 손실에 더해 별도의 짧은 추가 학습 단계에서 붙인다.'}
],

diagram:{type:'flow', cap:'포인터-생성기 네트워크의 한 디코더 스텝. 어휘분포와 attention분포가 p_gen으로 섞여 최종 분포가 된다.',
 nodes:[
  {t:'인코더 LSTM', s:'원문 → hidden states', acc:true},
  {t:'Attention', s:'컨텍스트 벡터 + 분포'},
  {t:'디코더 LSTM', s:'이전 단어 → 상태 s_t'},
  {t:'p_gen 계산', s:'h*, s_t, x_t → σ'},
  {t:'분포 혼합', s:'어휘분포·복사분포 가중합', a:'가중합'}
 ]},

math:[
 {expr:'p_gen = σ(w_h*ᵀh_t* + w_sᵀs_t + w_xᵀx_t + b_ptr)',
  tex:'p_{gen}=\\sigma\\!\\left(\\mathbf{w}_{h^*}^{\\top}h_t^{*}+\\mathbf{w}_s^{\\top}s_t+\\mathbf{w}_x^{\\top}x_t+b_{ptr}\\right)',
  d:'생성 확률. 컨텍스트 벡터·디코더 상태·디코더 입력 세 가지로부터 계산되는 학습 가능한 스칼라 게이트.'},
 {expr:'P(w) = p_gen·P_vocab(w) + (1-p_gen)·Σ(i: w_i=w) a_i^t',
  tex:'P(w)=p_{gen}P_{vocab}(w)+(1-p_{gen})\\sum_{i:\\,w_i=w} a_i^{t}',
  d:'확장 어휘에 대한 최종 분포. $w$가 OOV면 $P_{vocab}(w){=}0$이라 복사 항만 남고, 원문에 없으면 attention 합이 0이라 생성 항만 남는다.'},
 {expr:'loss_t = -log P(w_t*) + λ·Σ_i min(a_i^t, c_i^t)',
  tex:'\\text{loss}_t = -\\log P(w_t^{*}) + \\lambda\\sum_i \\min(a_i^{t}, c_i^{t})',
  d:'커버리지 손실을 더한 최종 학습 목적함수. 현재 attention과 누적 커버리지의 최솟값 합이 반복 패널티다.'}
],

numbers:[
 {k:'ROUGE-1 / -2 / -L (pointer-gen + coverage)', v:'39.53 / 17.28 / 36.38', d:'기존 abstractive SOTA(35.46/13.30/32.65) 대비 전 지표에서 +2 이상'},
 {k:'ROUGE-1 (pointer-gen, coverage 없음)', v:'36.44', d:'baseline seq2seq+attn(50k vocab) 31.33보다 +5.1'},
 {k:'추가 파라미터', v:'pointer +1,153 · coverage +512', d:'baseline 21,499,600개에 비해 무시할 수준'},
 {k:'학습 속도', v:'pointer-gen 23만 iter(12.8 epoch) vs baseline 60만 iter(33 epoch)', d:'복사 경로 덕에 학습 초기부터 훨씬 빠르게 수렴'},
 {k:'CNN/Daily Mail 데이터 규모', v:'287,226 / 13,368 / 11,490', d:'train / validation / test 쌍 수'},
 {k:'lead-3 추출 baseline', v:'ROUGE-1 40.34', d:'단순히 앞 3문장을 그대로 쓰는 추출 방법이 이 논문의 최종 abstractive 모델과 거의 동률 — ROUGE 평가의 한계로 논의됨'}
],

impact:'"복사냐 생성이냐"를 미리 정하지 않고 모델이 매 스텝 학습으로 판단하게 만든 설계가 이후 추상 요약·데이터-투-텍스트 생성의 표준 부품이 됐다. 커버리지 메커니즘은 반복이라는 seq2seq 생성 전반의 고질적 문제에 대한 실전적 해법을 제시했다. 동시에 lead-3 같은 단순 추출 baseline이 ROUGE 지표에서 정교한 abstractive 모델과 맞먹는다는 관찰은, ROUGE 자체의 한계에 대한 논의를 촉발했다.',

legacy:[
 '`copy mechanism`이라는 이름으로 이후 대부분의 seq2seq 기반 생성 모델(대화, 데이터-투-텍스트)에 표준 옵션으로 채택',
 '[BART](#/p/bart)·[T5](#/p/t5) 같은 사전학습 seq2seq 모델은 서브워드 토크나이저로 OOV 문제 자체를 줄이면서 별도 포인터 메커니즘 없이도 비슷한 효과를 얻는 방향으로 발전',
 '`[요약 RLHF](#/p/summarize-hf)` 등 이후 연구는 ROUGE의 한계(이 논문이 관찰한 lead-3 baseline 문제)를 넘어서기 위해 사람 선호도 기반 보상으로 학습 목표 자체를 바꿈',
 '커버리지 손실의 아이디어(과거 attention 누적을 벌점화)는 반복 억제가 필요한 다른 생성 과제(이미지 캡셔닝 등)에도 재사용됨'
],

pitfalls:[
 '**포인터 메커니즘이 있다고 완전한 추상 요약이 되는 것은 아니다.** 본문 사례처럼 pointer-gen+coverage 모델의 최종 요약도 원문 문장 몇 개를 거의 그대로 이어붙인 형태에 가깝고, 저자들도 이를 "여러 조각으로 구성된다"고 명시한다.',
 '**ROUGE 점수가 높다고 요약 품질이 좋다는 뜻은 아니다.** 단순 lead-3 추출이 이 논문의 최종 모델과 ROUGE에서 거의 동률이었다 — 원문 앞부분에 핵심 정보가 몰리는 뉴스 데이터 특성과 ROUGE의 표면 일치 편향이 겹친 결과다.',
 '**커버리지는 처음부터 학습하지 않고 별도의 짧은 2단계 학습으로 추가됐다.** 처음부터 커버리지 손실을 넣으면 초기 학습을 방해한다는 것을 저자들이 직접 실험으로 확인했다.'
],

figures:[
 {f:'fig3-pointer-gen.png',
  cap:'파란 화살표가 attention 분포, 초록 막대가 어휘분포(Vocabulary Distribution). 가운데 노란 원이 $p_{gen}$ 게이트로, 왼쪽(1-p_gen, 복사)과 오른쪽(p_gen, 생성) 경로를 가중해 맨 위 최종분포(Final Distribution)를 만든다. `2-0`처럼 사전에 없는 원문 단어도 최종분포에 파란 막대로 나타난다.',
  src:'원문 Figure 3, p.3'},
 {f:'fig1-comparison.png',
  cap:'같은 기사에 대한 세 모델의 출력 비교. baseline(빨강)은 `UNK UNK`로 고유명사를 뭉개고 사실관계를 왜곡한다. pointer-gen(초록)은 고유명사를 정확히 복사하지만 문장을 반복한다. pointer-gen+coverage(파랑)는 반복 없이 원문 여러 구절을 이어붙인다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'Note that if w is an out-of-vocabulary (OOV) word, then Pvocab(w) is zero...The ability to produce OOV words is one of the primary advantages of pointer-generator models.',
  src:'Section 2.2, p.3'}
],

links:[
 {t:'arXiv 1704.04368 — Get To The Point', u:'https://arxiv.org/abs/1704.04368'},
 {t:'GitHub — abisee/pointer-generator', u:'https://github.com/abisee/pointer-generator'},
 {t:'저자 블로그 설명 (Abigail See)', u:'https://www.abigailsee.com/2017/04/16/taming-rnns-for-better-summarization.html'}
]
});
