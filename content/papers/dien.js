WIKI.paper({
slug:'dien',
venue:'AAAI 2019',
authors:'Zhou, Mou, Fan, Pi, Bian, Zhou, Zhu, Gai (Alibaba Group)',
arxiv:'1809.03672',

tldr:'[DIN](#/p/din)이 "지금 어떤 과거 행동에 주목할까"만 풀었다면, DIEN은 "사용자의 관심사 자체가 시간에 따라 어떻게 변해왔나"를 GRU 두 층으로 모델링한 논문. 관심 추출(interest extractor)과 관심 진화(interest evolving)를 분리하고, 중간 은닉 상태를 직접 감독하는 보조 손실(auxiliary loss)로 GRU가 실제 "관심 상태"를 표현하도록 강제했다.',

context:'[DIN](#/p/din)은 사용자의 과거 행동 각각에 후보 광고와의 관련도를 매겨 가중합하는 activation unit으로 CTR 예측을 크게 개선했지만, 행동들을 **집합**처럼 다뤄 그 사이의 시간적 의존성을 보지 않는다. 그런데 실제 사용자 관심사는 정적이지 않다 — 외부 환경(유행)과 내부 인지가 함께 바뀌면서, 옷에 대한 취향이 계절이 지나며 달라지듯 관심 자체가 궤적을 그리며 진화한다. 단순히 행동 시퀀스에 RNN을 얹는 시도들(ATRank 등)은 있었지만, 이들은 RNN의 은닉 상태를 **그대로 관심으로 취급**한다는 근본적 문제가 있었다. 은닉 상태는 "행동 사이의 의존성"을 인코딩하도록 학습될 뿐, 그 값이 실제로 사용자의 잠재적 관심을 표현한다는 보장이 없다.',

ideas:[
 {h:'행동 인코딩과 관심 표현을 분리한다: 관심 추출 계층',
  lead:'GRU로 행동 시퀀스를 인코딩하되, 은닉 상태가 관심을 표현하도록 별도로 감독한다.',
  d:'첫 GRU 층(interest extractor layer)이 시간순 행동 임베딩 $e(1),\\dots,e(T)$ 을 받아 은닉 상태 $h(1),\\dots,h(T)$ 를 만든다. 문제는 최종 클릭 레이블이 마지막 스텝만 감독하고 중간 은닉 상태 $h(t),\\ t<T$ 는 아무 지도 신호를 못 받는다는 것이다 — 그냥 "다음 행동을 예측하는 데 필요한 정보"가 아니라 "관심"을 담고 있다는 보장이 없다. DIEN은 이걸 구조 문제로 인식하고 다음 아이디어(보조 손실)로 직접 해결한다.'},
 {h:'보조 손실: 바로 다음 행동으로 중간 은닉 상태를 감독한다',
  lead:'각 스텝의 은닉 상태가 실제로 다음 클릭 행동을 예측하도록 별도 손실을 더한다.',
  d:'"관심이 곧바로 다음 행동으로 이어진다"는 전제를 이용해, $h(t)$ 가 실제 다음 행동 $e_b[t+1]$ 과 negative sampling으로 뽑은 가짜 행동을 구분하도록 로지스틱 손실을 추가한다. 전체 손실은 $L = L_{target} + \\alpha \\cdot L_{aux}$ 로, 최종 CTR 손실과 이 보조 손실을 가중합한다. 이 감독 덕분에 GRU가 긴 시퀀스를 다룰 때의 역전파 난이도가 줄고, 임베딩 층 학습에도 더 많은 의미 정보가 흘러간다 — 공개 데이터셋에서 개선 폭이 가장 컸던 장치다.'},
 {h:'AUGRU: 관련도로 게이트 벡터 전체를 스케일한다',
  lead:'attention 스칼라 하나로 업데이트 게이트의 전 차원을 함께 조절해 무관한 관심의 영향을 줄인다.',
  d:'DIEN은 두 번째 GRU(interest evolving layer)에서 후보 광고와의 관련도(attention score $a_t$, 식 8)를 반영해 "관련 있는 과거 관심만 진화시키고, 무관한 관심 드리프트는 억누른다"는 목표를 세운다. 시도한 세 방식 중 AIGRU(입력에 곱함)는 0 입력조차 은닉 상태를 바꿔 버려 효과가 약했고, AGRU(업데이트 게이트를 스칼라로 통째 교체)는 게이트 벡터의 차원별 정보를 무시했다. 최종 채택한 **AUGRU**는 원래 벡터 업데이트 게이트 $u_t$ 를 유지하면서 그 위에 스칼라 attention $a_t$ 를 곱해($\\tilde u_t = a_t \\cdot u_t$) 차원별 중요도 정보와 관련도 신호를 모두 살린다.'},
 {h:'관심마다 독립된 진화 궤적, 후보에 따라 달라지는 활성화',
  lead:'옷과 신발의 관심 진화는 서로 독립적으로 흐르되, 어떤 후보를 보여주느냐에 따라 강조되는 궤적이 달라진다.',
  d:'옷에 대한 관심이 진화하는 과정과 신발에 대한 관심이 진화하는 과정은 거의 독립적으로 흘러가지만([DIN](#/p/din)이 지적한 관심의 다양성과 같은 맥락), 어떤 관심이 지금 클릭 확률에 영향을 주는지는 **후보 아이템이 무엇이냐에 달렸다.** AUGRU는 후보와 무관한 시점의 은닉 상태 변화를 낮은 attention으로 억제해, 같은 행동 시퀀스라도 후보가 바뀌면 진화 궤적 자체가 달라지도록 만든다. 논문 Figure 3의 PCA 시각화가 실제로 후보 카테고리에 따라 은닉 상태의 이동 경로가 달라짐을 보여준다.'}
],

diagram:{type:'stack', cap:'DIEN의 3층 구조. 아래가 원시 행동, 위로 갈수록 후보 조건부 관심 표현.',
 layers:[
  {t:'행동 계층', s:'b(1)…b(T), 원-핫'},
  {t:'임베딩 계층', s:'e(1)…e(T)'},
  {t:'관심 추출 계층', s:'GRU + 보조 손실', note:'h(t)가 관심을 표현하도록 감독'},
  {t:'관심 진화 계층', s:'AUGRU + attention', acc:true, note:'후보 조건부로 관련 관심만 진화'},
  {t:'MLP + Softmax', s:'concat → CTR 예측'}
 ]},

math:[
 {expr:'Laux = −(1/N) Σ [ log σ(hti, e[t+1]) + log(1 − σ(hti, ê[t+1])) ]',
  tex:'L_{aux} = -\\frac{1}{N}\\sum_{i=1}^{N}\\sum_t \\Big[\\log\\sigma(h_t^i, e_b^i[t{+}1]) + \\log\\big(1-\\sigma(h_t^i, \\hat e_b^i[t{+}1])\\big)\\Big]',
  d:'보조 손실. $e_b^i[t{+}1]$ 은 실제 다음 클릭 행동(양성), $\\hat e_b^i[t{+}1]$ 은 클릭되지 않은 아이템에서 뽑은 negative sample이다. 전체 손실은 $L=L_{target}+\\alpha L_{aux}$.'},
 {expr:'at = exp(ht·W·ea) / Σj exp(hj·W·ea)',
  tex:'a_t = \\frac{\\exp(h_t W e_a)}{\\sum_{j=1}^{T}\\exp(h_j W e_a)}',
  d:'후보 광고 임베딩 $e_a$ 와 $t$ 번째 관심 상태 $h_t$ 의 관련도를 정규화한 attention score. 이 $a_t$ 가 AUGRU의 업데이트 게이트를 스케일한다.'},
 {expr:'ũt = at * ut,   ht = (1 − ũt) ∘ ht−1 + ũt ∘ h̃t',
  tex:'\\tilde u_t = a_t * u_t, \\qquad h_t = (1-\\tilde u_t)\\circ h_{t-1} + \\tilde u_t \\circ \\tilde h_t',
  d:'AUGRU. 원래 GRU의 벡터 업데이트 게이트 $u_t$(차원별 중요도)를 유지한 채 스칼라 $a_t$(관련도)를 곱해 스케일한다 — 벡터 정보와 스칼라 관련도를 모두 보존하는 것이 AGRU와의 차이다.'}
],

numbers:[
 {k:'Amazon Electronics AUC', v:'DIEN 0.7792 vs DIN 0.7603', d:'BaseModel은 0.7435. Two-layer GRU+Attention은 0.7605로 DIN과 비슷한 수준에 그침'},
 {k:'Amazon Books AUC', v:'DIEN 0.8453 vs DIN 0.7880', d:'BaseModel 0.7686 대비 가장 큰 개선 폭을 보인 데이터셋'},
 {k:'산업 데이터셋 규모', v:'8억 사용자 · 8.2억 상품 · 70억 샘플', d:'Taobao 온라인 전시 광고 로그, 카테고리 18,006개'},
 {k:'산업 데이터셋 AUC', v:'DIEN 0.6541 vs DIN 0.6428', d:'BaseModel 0.6350 대비 개선폭이 공개 데이터셋보다 작음 — 학습 샘플이 워낙 많아 보조 손실의 상대적 기여가 줄어든다고 원문이 설명'},
 {k:'온라인 A/B 테스트', v:'CTR +20.7% · eCPM +17.1%', d:'2018-06-07~07-12, Taobao 실트래픽. DIN은 같은 조건에서 CTR +8.9%'},
 {k:'서빙 지연시간', v:'38.2ms → 6.6ms', d:'커널 퓨전·배칭·Rocket Launching 경량화로 초당 100만+ 사용자 트래픽에서 달성한 지연시간'}
],

impact:'DIEN은 CTR 예측에서 "행동 시퀀스를 어떻게 인코딩할까"의 표준을 한 단계 밀어올렸다 — 은닉 상태를 관심으로 그냥 믿지 않고 **직접 감독**한다는 발상과, attention 스칼라와 게이트 벡터를 함께 쓰는 AUGRU 설계는 이후 시퀀스 기반 추천·광고 모델에서 반복 재사용되는 패턴이 됐다. 실제로 Taobao 메인 트래픽에 배포되어 두 자릿수 CTR 개선을 실증했다는 점도, 학계형 개선이 아니라 산업 규모에서 검증된 아키텍처라는 무게를 더했다.',

legacy:[
 '**보조 손실이라는 장치의 확산** — 마지막 레이블만으로는 부족한 중간 표현을 직접 감독하는 패턴이 이후 시퀀스 추천·멀티태스크 CTR 모델 전반에서 재사용됨',
 '**Attention과 게이트의 결합 설계 계보** — AUGRU가 보여준 "스칼라 관련도로 벡터 게이트를 스케일한다"는 아이디어가 이후 시퀀스 인코더 설계의 참조점이 됨',
 '**DIN → DIEN → DSIN으로 이어지는 Alibaba 계열** — 정적 activation unit(DIN) → 시간적 진화(DIEN) → 세션 경계 인식(DSIN)으로 사용자 표현이 점점 정교해지는 흐름의 중간 지점',
 '**[Transformer](#/p/transformer) 기반 시퀀스 추천과의 경쟁·보완** — 이후 [SASRec](#/p/sasrec) 류의 self-attention 시퀀스 모델이 등장하며 RNN 기반 접근(DIEN)과 attention 전용 접근이 병렬로 발전'
],

pitfalls:[
 '**AUGRU는 표준 attention이 아니라 GRU 게이트 메커니즘의 변형이다.** attention score $a_t$ 가 값(value)을 가중합하는 것이 아니라 업데이트 게이트를 스케일하는 용도로 쓰이므로, 일반적인 Transformer attention과 같은 것으로 오해하면 구현이 어긋난다.',
 '**공개 데이터셋과 산업 데이터셋에서 보조 손실의 효과 크기가 다르다.** Amazon 데이터셋에서는 AUGRU와 auxiliary loss가 뚜렷한 개선을 보이지만, 원문은 산업 데이터셋에서는 학습 샘플이 워낙 많아 보조 손실의 상대적 기여가 작아지고 AUGRU의 효과가 상대적으로 부각된다고 명시한다 — "공개 벤치마크 개선폭 = 실서비스 개선폭"이 아니다.',
 '**AUC 절대 개선폭(0.006~0.011)이 작아 보이지만 산업 맥락에서는 크다.** [DIN](#/p/din)과 마찬가지로, 수억 트래픽 규모의 광고 시스템에서는 이 정도 AUC 차이가 실제 온라인 A/B 테스트의 두 자릿수 CTR 개선(+20.7%)으로 이어진다는 것이 이 논문의 명시적 주장이다.'
],

figures:[
 {f:'fig1-architecture.png',
  cap:'아래에서 위로: 행동 계층(회색, b(1)…b(T))이 임베딩되어 첫 GRU(주황, Interest Extractor)를 통과하며 h(t)를 만들고, 왼쪽 아래 점선 박스(Auxiliary Loss)가 각 h(t)를 실제 다음 클릭/비클릭으로 직접 감독한다. 그 위 두 번째 GRU(분홍, Interest Evolving)는 각 스텝마다 Attention을 받아 AUGRU(왼쪽 위 점선 박스가 내부 구조)로 진화하며, 최종 h\'(T)만 오른쪽 MLP(Concat→PReLU/Dice→Softmax)로 들어간다.',
  src:'원문 Figure 1, p.4'}
],

quotes:[
 {t:'Most of them regard hidden states of sequential structure as latent interests directly, while these hidden states lack special supervision for interest representation.',
  src:'Related Work, p.2'}
],

links:[
 {t:'arXiv 1809.03672 — Deep Interest Evolution Network for Click-Through Rate Prediction', u:'https://arxiv.org/abs/1809.03672'},
 {t:'공식 구현 (mouna99/dien)', u:'https://github.com/mouna99/dien'}
]
});
