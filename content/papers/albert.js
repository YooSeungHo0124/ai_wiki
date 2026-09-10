WIKI.paper({
slug:'albert',
venue:'ICLR 2020',
authors:'Lan, Chen, Goodman, Gimpel, Sharma, Soricut (Google Research · TTI-Chicago)',
arxiv:'1909.11942',

tldr:'[BERT](#/p/bert)를 "더 깊게 쌓기"가 아니라 **더 적은 파라미터로 같은 깊이를 내는** 방향으로 다시 설계한 논문. 임베딩 행렬 분해와 층 간 파라미터 공유로 BERT-large 대비 파라미터를 **18배** 줄이면서 성능은 오히려 끌어올렸다.',

context:'BERT 이후 업계의 답은 단순했다 — 층을 더 쌓고 은닉 차원을 키운다. 하지만 은닉 차원 $H$ 를 키우면 임베딩 행렬은 $O(V \\times H)$ 로 함께 커지는데, 이 파라미터는 각 스텝에서 해당 단어가 등장할 때만 드문드문 갱신된다. 또한 BERT-large(334M)를 더 키운 실험은 GPU/TPU 메모리 한계에 먼저 부딪혔고, RACE 같은 벤치마크에서는 오히려 성능이 떨어지는 **표현력 저하(degradation)**까지 관측됐다. 이 논문은 "파라미터를 늘리지 않고도 더 깊은 모델의 효과를 낼 수 없는가"를 묻는다.',

ideas:[
 {h:'임베딩 인수분해: 어휘 크기와 은닉 크기를 분리한다',
  lead:'원-핫→은닉을 원-핫→저차원→은닉 두 단계로 쪼개 임베딩 파라미터를 줄인다.',
  d:'BERT는 원-핫 벡터를 곧바로 은닉 차원 $H$ 로 투영해 임베딩 파라미터가 $O(V \\times H)$ 이다. ALBERT는 먼저 저차원 공간 $E$ 로 투영한 뒤 다시 $H$ 로 올려, 파라미터를 $O(V \\times E + E \\times H)$ 로 줄인다. $H \\gg E$ 일 때 절감이 커지는데, 논문은 모든 configuration에서 $E=128$ 을 고정으로 쓴다.'},
 {h:'층 간 파라미터 공유: 24개 층이 사실은 1개 층의 반복',
  lead:'모든 Transformer 층이 동일한 파라미터를 공유해 층 수와 무관하게 크기가 고정된다.',
  d:'ALBERT는 attention·FFN 파라미터를 **모든 층에서 그대로 재사용**한다. 그 결과 ALBERT-large는 24층이면서도 파라미터는 18M — BERT-large(334M)의 1/18이다. 층별 입출력 임베딩의 L2 거리·코사인 유사도를 측정해 보면 BERT는 층마다 진동하는 반면 ALBERT는 매끄럽게 수렴해, 공유가 학습을 오히려 **안정화**시킨다는 것도 함께 보였다.'},
 {h:'SOP: 문장 순서를 맞히게 해 NSP의 헛점을 없앤다',
  lead:'문장 쌍의 순서를 뒤바꾼 부정 예시로 진짜 응집성만 학습시킨다.',
  d:'[BERT](#/p/bert)의 NSP는 양성(연속 문장) vs 음성(다른 문서에서 뽑은 문장)을 구분하는데, 이는 사실상 **주제(topic) 판별**로 풀려 MLM과 정보가 겹친다. ALBERT는 같은 두 문장을 쓰되 **순서만 뒤집은** 것을 음성 예시로 삼는 SOP를 쓴다. 실험에서 NSP로 학습한 모델은 SOP 과제에서 무작위 수준(52.0%)에 그쳤지만, SOP로 학습한 모델은 NSP 과제도 78.9%까지 풀어내 — 응집성 학습이 주제 판별을 포함하는 상위 과제임을 보였다.'},
 {h:'드롭아웃 제거: 큰 모델에서는 정규화가 오히려 손해',
  lead:'대형 ALBERT-xxlarge에서 드롭아웃을 없애자 MLM 정확도가 꾸준히 올라갔다.',
  d:'1M 스텝을 넘긴 뒤에도 드롭아웃이 없는 쪽의 dev MLM 정확도가 계속 개선되는 것을 관측했다(70.7% → 72%대). 논문은 이를 CNN에서 배치정규화와 드롭아웃을 같이 쓰면 해롭다는 기존 보고와 같은 맥락으로 해석하며, Transformer 기반 대형 모델에서 이를 실증적으로 보인 것은 이 논문이 처음이라고 밝힌다.'}
],

diagram:{type:'compare', cap:'같은 구조를 반대 방향으로 키운 두 모델. ALBERT는 "더 깊게"가 아니라 "더 가볍게"를 택했다.',
 left:{t:'BERT-large · 크게 쌓기', items:[
   '24층 · 파라미터 독립','334M 파라미터','임베딩 = 은닉 차원 그대로','NSP: 주제 판별로 새는 과제']},
 right:{t:'ALBERT · 가볍게 반복', items:[
   '24층 · 파라미터 전부 공유','18M 파라미터(1/18)','임베딩 128차원으로 분해','SOP: 순서 반전으로 응집성만 학습']}},

math:[
 {expr:'임베딩 파라미터: O(V×H) → O(V×E + E×H)',
  tex:'O(V\\times H)\\;\\longrightarrow\\;O(V\\times E + E\\times H)',
  d:'$V$ 는 어휘 크기, $H$ 는 은닉 차원, $E$ 는 인수분해된 임베딩 차원($E=128$). $H \\gg E$ 일수록 절감폭이 커진다.'},
 {expr:'ALBERT-large: 18M params vs BERT-large: 334M params (18×)',
  tex:'\\dfrac{334\\text{M (BERT-large)}}{18\\text{M (ALBERT-large)}}\\approx 18\\times',
  d:'같은 24층·$H=1024$ 구성에서 층 공유 + 임베딩 분해 두 가지만으로 얻은 절감비다.'}
],

numbers:[
 {k:'파라미터 · large', v:'18M', d:'BERT-large(334M) 대비 **18배** 적음, 층 수(24)는 동일'},
 {k:'파라미터 · xxlarge', v:'235M', d:'$H=4096$·12층. BERT-large의 약 70% 크기로 최고 성능 달성'},
 {k:'GLUE 점수', v:'89.4', d:'앙상블 기준 SOTA (RoBERTa 88.5, XLNet 88.4)'},
 {k:'SQuAD2.0 test F1', v:'92.2', d:'ALBERT-xxlarge 단일/앙상블 기준'},
 {k:'RACE test 정확도', v:'89.4%', d:'2017년 원 논문 인간 대비 기준(44.1%)에서 **+45.3%p** 향상'},
 {k:'학습 속도(large 기준)', v:'1.7배 빠름', d:'BERT-large 대비. 파라미터 공유로 동일 하드웨어에서 처리량 증가'}
],

impact:'ALBERT는 "모델을 더 크게"라는 2019년의 공식에 **"파라미터를 늘리지 않고도 깊이의 이점을 얻을 수 있다"**는 반례를 제시했다. 임베딩 인수분해는 이후 대규모 어휘를 쓰는 모델들의 표준 절감 기법이 됐고, SOP가 드러낸 "NSP는 사실 주제 판별이었다"는 진단은 [RoBERTa](#/p/roberta)의 NSP 제거 결정과 같은 방향에서 서로를 뒷받침한다. 다만 층 공유가 순전히 파라미터 수만 줄일 뿐 층을 실제로 줄이지는 않는다는 점에서, 이후 경량화 연구의 주류는 ALBERT식 공유보다 [DistilBERT](#/p/distilbert)식 증류 쪽으로 흘러갔다.',

legacy:[
 '**SOP → 응집성 목적함수 계열** — 문장 순서·구조를 이용한 사전학습 신호로 이어지며, NSP를 쓰는 이후 모델은 사실상 사라짐',
 '**임베딩 인수분해** — 대형 어휘를 쓰는 다국어·멀티모달 모델에서 임베딩 크기를 줄이는 표준 트릭으로 자리잡음',
 '**"파라미터 수 ≠ 추론 속도" 교훈** — 이 착시가 이후 모델 설계에서 파라미터 절감과 지연시간(latency) 절감을 명확히 구분하게 만듦',
 '**경량화의 갈림길** — 같은 목표(작은 BERT)를 [DistilBERT](#/p/distilbert)는 증류로, ALBERT는 공유+분해로 풀며 서로 다른 계열을 이룸'
],

pitfalls:[
 '**"파라미터가 18배 줄었으니 18배 빠르다"는 오해.** 층 수(24개)는 그대로라 forward pass의 **행렬곱 횟수와 추론 지연시간은 거의 줄지 않는다** — 오히려 xxlarge는 큰 은닉 차원 때문에 BERT-large보다 **3배 느리다**. 줄어드는 것은 저장·통신 비용이다.',
 '**SOP가 NSP를 완전히 대체한 "더 쉬운 과제"가 아니다.** SOP는 주제 판별(NSP)까지 포함해서 푸는 **더 어려운 상위 과제**이며, 그래서 다운스트림에 더 도움이 된다는 것이 논문의 핵심 주장이다.',
 '**층 공유는 기본값이 "전부 공유"다.** attention만 공유·FFN만 공유 등 부분 공유 옵션도 실험했지만 성능 손실이 커서, 실무에서 쓰는 사전학습 체크포인트는 대부분 전체 공유(all-shared) 버전이다.'
],

figures:[
 {f:'fig1-embedding-stability.png',
  cap:'x축은 층 번호(0~24), y축은 각 층 입출력 임베딩의 L2 거리(왼쪽)·코사인 유사도(오른쪽). BERT-large(빨간 점선)는 층마다 크게 진동하는 반면 ALBERT-large(파란 실선)는 매끄럽게 수렴한다 — 파라미터 공유가 층 간 표현을 안정시킨다는 근거.',
  src:'원문 Figure 1, p.4'},
 {f:'fig2-data-dropout.png',
  cap:'x축은 학습 스텝(만 단위), y축은 dev MLM 정확도. 왼쪽: 추가 데이터를 넣으면(점선) 항상 위. 오른쪽: 드롭아웃을 제거하면(점선) 1M 스텝을 넘겨도 계속 상승 — 대형 모델에서 드롭아웃이 오히려 발목을 잡는다는 근거.',
  src:'원문 Figure 2, p.9'}
],

quotes:[
 {t:'We present two parameter-reduction techniques to lower memory consumption and increase the training speed of BERT.',
  src:'Abstract, p.1'},
 {t:'ALBERT-large has about 18x fewer parameters compared to BERT-large, 18M versus 334M.',
  src:'Section 3.2, p.5'}
],

links:[
 {t:'arXiv 1909.11942 — ALBERT', u:'https://arxiv.org/abs/1909.11942'},
 {t:'Google AI Blog — ALBERT', u:'https://ai.googleblog.com/2019/12/albert-lite-bert-for-self-supervised.html'},
 {t:'GitHub — google-research/ALBERT', u:'https://github.com/google-research/ALBERT'}
]
});
