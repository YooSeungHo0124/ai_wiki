WIKI.paper({
slug:'music-transformer',
venue:'ICLR 2019',
authors:'Huang, Vaswani, Uszkoreit, Shazeer, Simon, Hawthorne, Dai, Hoffman, Dinculescu, Eck (Google Brain)',
arxiv:'1809.04281',

tldr:'[상대 위치 표현](#/p/relative-pos)을 음악 생성에 적용해 동기(motif)가 반복·변주되는 **긴 구조**를 가진 곡을 만들어 낸 논문. 상대 위치의 메모리 비용을 $O(L^2D)$에서 $O(LD)$로 줄이는 "skewing" 구현 트릭을 제안해, 분 단위 길이(수천 스텝)의 곡을 실제로 학습 가능하게 만들었다.',

context:'음악은 동기가 프레이즈로, 프레이즈가 절·후렴 같은 섹션으로 반복·발전하는 **다중 시간척도의 자기참조** 구조를 가진다. [Transformer](#/p/transformer)의 self-attention은 이전에 생성한 어떤 부분이든 한 스텝만에 다시 참조할 수 있어 이런 구조에 적합해 보이지만, 원본 Transformer는 sin/cos 절대 위치 인코딩만 쓴다. 음악에서는 "지금 음이 3옥타브 위 음과 몇 박자 떨어져 있는가" 같은 **상대적 타이밍**이 절대 위치보다 훨씬 중요하다. [Shaw et al. 2018](#/p/relative-pos)이 상대 위치를 attention에 넣는 방법을 제안했지만, 그 구현은 중간 텐서가 $O(L^2D)$ 메모리를 요구해 수천 스텝짜리 음악 시퀀스에는 그대로 쓸 수 없었다.',

ideas:[
 {h:'상대 위치 attention을 음악에 그대로 가져온다',
  lead:'attention 로짓에 $S^{rel}$(상대 거리 임베딩과의 내적)을 더해 상대적 타이밍을 반영한다.',
  d:'[상대 위치 표현](#/p/relative-pos)의 식을 그대로 가져와 $\\text{RelativeAttention}=\\text{Softmax}((QK^\\top+S^{rel})/\\sqrt{D_h})V$로 attention을 계산한다. $S^{rel}$은 쿼리와, 쿼리-키 사이 상대 거리에 대응하는 학습된 임베딩 $E^r$의 내적이다. 원 논문처럼 $(i_q,j_k)$ 쌍마다 임베딩을 모아 만든 텐서 $R$을 직접 만들면 $O(L^2D)$ 메모리가 든다는 것이 문제였다.'},
 {h:'"Skewing": R을 만들지 않고 QEʳᵀ를 재배열해서 같은 결과를 얻는다',
  lead:'쿼리 $Q$를 상대 위치 임베딩 $E^r$에 직접 곱한 뒤 패딩·reshape·슬라이스로 필요한 행렬을 얻는다.',
  d:'핵심 관찰은 $S^{rel}$이 필요로 하는 모든 항이 사실 $QE^{r\\top}$ 안에 이미 들어있다는 것이다. $QE^{r\\top}$의 $(i_q, r)$ 위치의 값은 이미 맞는 내적이지만 열 인덱스가 절대 위치 $j_k$가 아니라 상대 거리 $r$ 기준이라 어긋나 있다. 그래서 (1) 왼쪽에 더미 열 하나를 패딩하고, (2) 행렬을 $(L{+}1, L)$ 모양으로 reshape하고, (3) 마지막 $L$개 행만 잘라내는 세 단계("skewing")로 열 인덱스를 $j_k-i_q=r$이 맞게 재배열한다. 이 과정은 $R$이라는 $O(L^2D)$ 크기 중간 텐서를 아예 만들지 않는다.'},
 {h:'메모리를 $O(L^2D)$에서 $O(LD)$로 줄인다',
  lead:'같은 시간 복잡도 $O(L^2D)$를 유지하면서 relative memory만 $L^2D$에서 $LD$로 낮춘다.',
  d:'표 1에서 직접 비교하듯, 원 구현은 길이 $L=2048$에서 레이어당 헤드당 약 1100MB(+16MB)가 필요해 GPU 16GB 기준 최대 길이가 650에 그쳤다. Skewing 구현은 같은 길이에서 0.52MB(+16MB)만 써서 최대 길이를 3500까지 늘렸다 — 실제로 길이 650에서 속도도 6배 빨랐다. 시간 복잡도 자체는 두 방법 모두 $O(L^2D)$로 동일하다는 점에 주의해야 한다 — 이 논문이 줄인 것은 **중간 메모리**이지 점근적 시간이 아니다.'},
 {h:'로컬 상대 attention으로 더 긴 시퀀스까지 확장한다',
  lead:'시퀀스를 겹치지 않는 블록으로 쪼개 블록 내부에서만 상대 attention을 계산해 메모리를 더 아낀다.',
  d:'전역(global) 상대 attention도 여전히 $O(L^2D)$ 시간이 필요해 매우 긴 시퀀스에는 부담이다. 그래서 입력을 블록으로 나누고 각 블록이 자신과 바로 이전 블록만 보게 하는 로컬 attention에도 같은 skewing 절차를 적용한다. 실험에서는 전역·로컬 상대 attention이 비슷한 성능을 냈지만, 로컬 attention은 레이어를 쌓으면서 점점 넓은 수용영역을 확보할 수 있어 더 긴 시퀀스 학습에 유리하다고 언급한다.'}
],

diagram:{type:'flow', cap:'Skewing 절차 — R이라는 O(L²D) 텐서를 만들지 않고 QEʳᵀ 하나만으로 상대 attention 로짓을 얻는다.',
 nodes:[
  {t:'Q × Eʳ', s:'상대 임베딩과 내적'},
  {t:'더미 열 패딩', s:'왼쪽에 1열 추가'},
  {t:'Reshape', s:'(L+1, L)로'},
  {t:'Slice', s:'마지막 L행만'},
  {t:'S^rel', s:'절대 인덱스로 정렬됨', acc:true}
 ]},

math:[
 {expr:'RelativeAttention = Softmax( (QKᵀ + S^rel) / √D_h ) V',
  tex:'\\text{RelativeAttention}=\\text{Softmax}\\!\\left(\\frac{QK^{\\top}+S^{rel}}{\\sqrt{D_h}}\\right)V',
  d:'[상대 위치 표현](#/p/relative-pos)의 attention 식. $S^{rel}$이 쿼리-키 사이 상대 거리 정보를 로짓에 더한다. 이 논문의 기여는 이 식 자체가 아니라 $S^{rel}$을 메모리 효율적으로 계산하는 방법이다.'},
 {expr:'j_k = r − (L − 1) + i_q   (skewing의 열 인덱스 재배열 규칙)',
  tex:'j_k = r-(L-1)+i_q',
  d:'skewing 후 얻어지는 절대 열 인덱스 공식. $QE^{r\\top}$에서 상대 거리 $r$로 색인된 값을, attention에서 실제로 필요한 절대 위치 $j_k$ 색인으로 옮기는 규칙이다.'},
 {expr:'Relative memory: Shaw et al. O(L²D+L²)  vs  Ours O(LD+L²)',
  tex:'\\text{Shaw et al.: } O(L^2D+L^2)\\qquad\\text{Ours: } O(LD+L^2)',
  d:'상대 임베딩을 저장·계산하는 데 드는 메모리만 비교한 것. attention 행렬 자체의 $O(L^2)$ 항은 두 방법 모두 동일하게 남는다 — 즉 시간 복잡도의 근본적 병목은 그대로다.'}
],

numbers:[
 {k:'메모리(L=2048, 레이어·헤드당)', v:'0.52MB(우리) vs 1100MB(Shaw et al.)', d:'상대 임베딩 부분만 비교, $D_h=64$ 기준'},
 {k:'최대 학습 길이', v:'3500 (우리) vs 650 (Shaw et al.)', d:'16GB GPU 메모리 한도 내'},
 {k:'속도 개선', v:'약 6배', d:'길이 650에서 skewing 구현이 원본보다 빠름'},
 {k:'JSB Chorales NLL', v:'0.335', d:'상대 attention + 상대 음고·시간 정보까지 더한 최종 모델, baseline Transformer(0.417)보다 개선'},
 {k:'Piano-e-Competition NLL', v:'1.835', d:'상대 전역 attention 모델, LSTM 기반 PerformanceRNN(1.969)보다 낮음 — SOTA'},
 {k:'생성 길이', v:'수천 스텝(분 단위)', d:'Oore et al. 2018 대비 4배 긴 곡을 생성'}
],

impact:'상대 위치 attention이 계산·메모리 면에서 실용적으로 큰 시퀀스에 쓰일 수 있음을 보여, 긴 문맥에서 반복·재귀 구조를 다뤄야 하는 다른 도메인(긴 텍스트, 게놈 시퀀스 등)에도 이 skewing 기법이 응용될 수 있는 길을 열었다. 동시에 청취 평가에서 상대 attention 모델이 baseline Transformer보다 유의미하게 선호됐다는 결과는, "구조를 표현하는 귀납적 편향(inductive bias)이 모델 크기보다 중요할 수 있다"는 사례로 자주 인용된다.',

legacy:[
 '**상대 위치 attention의 실용화 사례** — [상대 위치 표현](#/p/relative-pos)이 이론적으로 가능함을 보였다면, 이 논문은 그것을 실제로 큰 $L$에서 쓸 수 있게 만든 엔지니어링 기여로 자주 함께 인용됨',
 '**생성 음악 분야의 기준점** — 이후 음악 생성 Transformer 연구(예: MuseNet 등)가 장기 구조 모델링 문제의 출발점으로 이 논문을 참조',
 '**메모리 효율적 상대 attention 구현의 선례** — skewing과 유사한 재배열 트릭이 이후 상대 위치를 쓰는 다른 아키텍처 구현에도 참고됨',
 '**"긴 문맥에서의 반복·재귀 구조"라는 평가 축** — NLL만이 아니라 "생성물이 이전 내용을 구조적으로 재참조하는가"를 정성적으로 평가하는 관행에 영향'
],

pitfalls:[
 '**메모리 복잡도를 줄인 것이지 시간 복잡도를 줄인 것이 아니다.** Skewing은 상대 임베딩을 저장하는 중간 텐서의 크기만 $O(L^2D)$에서 $O(LD)$로 낮춘다 — attention 행렬 자체의 $O(L^2)$ 시간 비용은 원본 Transformer와 동일하게 남아 있다.',
 '**듣기 평가에서 LSTM이 집계 기준으로는 더 좋게 나온 항목도 있었다.** Perplexity는 Transformer 계열이 더 낮았지만, 사람 청취 평가의 집계 순위에서는 LSTM이 앞선 경우가 있었다 — 저자들도 이 결과를 그대로 보고하며, "정량 지표가 낮다고 항상 더 선호되는 것은 아니다"라고 적었다.',
 '**로컬 attention이 전역 attention보다 항상 나은 것은 아니다.** 실험에서 둘의 성능은 비슷했다(로컬 1.840 vs 전역 1.835) — 로컬 attention의 장점은 더 긴 시퀀스로 확장할 때의 메모리 여유이지, 이 논문의 실험 범위에서 품질 우위가 아니다.'
],

figures:[
 {f:'fig1-skewing.png',
  cap:'왼쪽에서 오른쪽으로 skewing의 네 단계. $QE^{r\\top}$(상대 거리 $r$로 색인)에 더미 열을 패딩하고, reshape한 뒤, 마지막 부분만 잘라내면 절대 위치 $(i_q, j_k)$로 색인된 $S^{rel}$이 된다 — 회색은 마스킹·패딩된 위치, 색깔은 서로 다른 상대 거리를 뜻한다.',
  src:'원문 Figure 1, p.4'},
 {f:'fig4-piano-rolls.png',
  cap:'같은 동기(왼쪽 위)로 시작해 세 모델이 이어 그린 곡. 위쪽 행(상대 attention Transformer)은 동기가 변주되며 반복되는 구조가 뚜렷하지만, 가운데 행(baseline Transformer)과 아래 행(LSTM 기반 PerformanceRNN)은 구조 없이 흘러가거나 원래 동기에서 금세 벗어난다.',
  src:'원문 Figure 4, p.8'}
],

quotes:[
 {t:'Music relies heavily on repetition to build structure and meaning. Self-reference occurs on multiple timescales, from motifs to phrases to reusing of entire sections of music.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1809.04281 — Music Transformer', u:'https://arxiv.org/abs/1809.04281'},
 {t:'Google Magenta: Music Transformer samples', u:'https://storage.googleapis.com/music-transformer/index.html'}
]
});
