WIKI.paper({
slug:'commonsense-lm',
venue:'arXiv preprint (2018)',
authors:'Trinh & Le (Google Brain)',
arxiv:'1806.02847',

tldr:'Winograd Schema 같은 상식 추론 문제를 **추가 학습 없이**, 사전학습된 언어모델이 문장에 매기는 확률만으로 풀어낸 논문. 지식베이스도 미세조정도 없이 순수 확률 비교만으로 당시 SOTA를 크게 앞섰다.',

context:'2018년 이전까지 Winograd Schema Challenge는 지식베이스 규칙, 수작업 특징, 시맨틱 파서 같은 무거운 장치로만 접근됐다. 대표적 이전 시스템은 7만 개의 수작업 특징과 Google 검색 API 질의를 동원했다. 라벨된 예제가 수백 개뿐이라 지도학습으로는 애초에 데이터가 부족했다. 이 논문의 질문은 단순하다 — **언어모델이 이미 "그럴듯한 문장"을 알고 있다면, 상식 문제도 그 확률만으로 풀리지 않을까?**',

ideas:[
 {h:'대명사를 후보로 치환해 문장 확률을 비교',
  lead:'대명사 자리에 각 후보를 넣어 만든 두 문장 중 언어모델이 더 그럴듯하다고 본 쪽을 답으로 고른다.',
  d:'"트로피가 가방에 안 들어간다, **그것**이 너무 크기 때문에"에서 "그것"을 "트로피"와 "가방"으로 각각 치환해 두 문장을 만든다. 언어모델 $P_\\theta$ 로 두 문장의 확률을 계산해 더 높은 쪽의 후보를 정답으로 택한다. 학습도 미세조정도 필요 없고, 대용량 텍스트로 학습된 LM 하나면 끝난다.'},
 {h:'Partial scoring: 대명사 이후만 채점',
  lead:'문장 전체가 아니라 대명사 뒤 남은 부분만 조건부 확률로 채점해 희귀 단어 편향을 피한다.',
  d:'전체 문장 확률(Score_full)로 채점하면 후보 단어 자체가 희귀하다는 이유만으로 확률이 낮게 나와 오답을 고르는 경우가 많았다(예: "trophy"가 드문 단어라서). Partial scoring은 후보를 넣은 뒤 **그 뒤에 오는 단어들의 조건부 확률**만 곱해, 후보 단어 자체의 희귀도 영향을 줄인다. 저자들은 이 방식이 대체로 full scoring보다 낫다는 것을 실험으로 보였다.'},
 {h:'다양한 코퍼스로 학습한 LM들의 앙상블',
  lead:'LM-1-Billion·CommonCrawl·SQuAD·Gutenberg 등 서로 다른 말뭉치로 학습한 LM을 앙상블한다.',
  d:'단어 수준·문자 수준 RNN LM을 여러 코퍼스에 각각 학습시킨 뒤 확률을 평균해 앙상블한다. 학습 데이터의 **다양성** 자체가 성능에 기여한다는 것을 보였고, 문제 유형과 겹치는 n-gram이 많은 문서를 CommonCrawl에서 골라 만든 전용 코퍼스(STORIES)를 추가하면 성능이 더 오른다.'},
 {h:'확률 비율로 "결정적 단어"를 역으로 찾아낸다',
  lead:'단어별 확률 비율을 보면 모델이 어떤 단어 때문에 그 답을 골랐는지 거꾸로 짚어낼 수 있다.',
  d:'Winograd Schema 문제는 문장 속 특정 단어(예: "크다/작다")를 바꾸면 정답이 뒤집히도록 설계된다. 두 치환 문장의 단어별 확률 비율 $\\hat{q}_t$ 을 계산해 어느 위치에서 비율이 가장 극단적인지 보면, 모델이 스스로 그 "결정적 단어"를 찾아냈는지 확인할 수 있다. 정답을 맞힌 178문제 중 115문제에서 실제로 그 특수 단어를 짚어냈다.'}
],

diagram:{type:'flow', cap:'대명사를 두 후보로 치환한 두 문장을 LM에 넣고, 확률이 더 높은 쪽을 정답으로 고른다.',
 nodes:[
  {t:'원문 + 대명사', s:'…it is too big'},
  {t:'후보 치환', s:'trophy / suitcase', acc:true},
  {t:'언어모델 채점', s:'P(문장) 계산'},
  {t:'확률 비교', s:'더 높은 쪽 선택'}
 ]},

math:[
 {expr:'Score_full(w_k ← c) = P_θ(w1, …, w_{k-1}, c, w_{k+1}, …, w_n)',
  tex:'\\text{Score}_{\\text{full}}(w_k\\!\\leftarrow\\!c) = P_\\theta(w_1,\\dots,w_{k-1},c,w_{k+1},\\dots,w_n)',
  d:'대명사 위치 $k$ 에 후보 $c$ 를 넣은 **문장 전체**의 결합확률. 후보 단어 자체가 희귀하면 이 값이 부당하게 낮아진다.'},
 {expr:'Score_partial(w_k ← c) = P_θ(w_{k+1}, …, w_n | w1, …, w_{k-1}, c)',
  tex:'\\text{Score}_{\\text{partial}}(w_k\\!\\leftarrow\\!c) = P_\\theta(w_{k+1},\\dots,w_n \\mid w_1,\\dots,w_{k-1},c)',
  d:'후보 $c$ 를 조건으로 **그 뒤에 오는 단어들만** 채점한다. 저자들이 실험적으로 더 낫다고 확인한 방식.'}
],

numbers:[
 {k:'PDP-60 정확도', v:'70.0%', d:'앙상블(5개 LM), 이전 SOTA 66.7% 대비 +3.3%p'},
 {k:'WSC-273 정확도', v:'63.7%', d:'10개 코퍼스 앙상블에 STORIES 코퍼스 LM 4개를 더한 14개 앙상블, 이전 SOTA 52.8% 대비 +11%p'},
 {k:'단일 모델 WSC-273', v:'56.4%', d:'word-level LM 1개, partial scoring'},
 {k:'STORIES 코퍼스 단일 모델', v:'62.6%', d:'문제와 n-gram이 겹치는 CommonCrawl 상위 0.1% 문서로 학습, 10개 모델 앙상블(61.5%)보다도 높음'},
 {k:'결정적 단어 탐지율', v:'115/178', d:'정답을 맞힌 문제 중 모델이 실제 특수 단어(switch word)를 짚어낸 비율'}
],

impact:'이 논문은 "언어모델의 확률 자체가 이미 상식적 지식을 담고 있다"는 것을 정량적으로 보여준 초기 사례다. 지식베이스·수작업 특징·지도학습 없이, 순수하게 다음 단어 예측만 학습한 모델의 확률만으로 지식베이스 기반 시스템을 크게 앞섰다는 결과는 당시로선 이례적이었다. 이후 "언어모델을 미세조정 없이 그대로 평가에 쓴다"는 발상이 벤치마크 설계의 한 축으로 자리잡았고, 사전학습 규모를 키우면 이런 능력이 저절로 따라온다는 관찰로 이어졌다.',

legacy:[
 '**Zero-shot 평가의 초기 증거** — 미세조정 없이 LM 확률만으로 과제를 푸는 이 방식은 [GPT-2](#/p/gpt2)가 아예 미세조정 없는 zero-shot을 대표 능력으로 내세우는 흐름의 선행 사례다',
 '**Winograd Schema가 LM 능력 지표로 정착** — 이후 LM들이 WSC 계열 정확도를 스케일과 함께 보고하는 관행이 자리잡았다',
 '**확률 기반 채점 방식의 표준화** — 후보 문장의 log-확률을 비교하는 채점 방식이 [HellaSwag](#/p/hellaswag)류 객관식 상식 벤치마크 평가의 공통 틀이 됐다',
 '**"학습 없이 사전학습 지식을 꺼내 쓴다"는 아이디어** — 이후 in-context learning·프롬프팅 연구 전체가 이 전제 위에서 확장됐다'
],

pitfalls:[
 '**RNN 언어모델 기반이다.** Transformer도 [GPT](#/p/gpt1)류 대규모 LM도 아니고, 여러 코퍼스에 학습한 word/character-level RNN LM의 앙상블이라는 점을 놓치기 쉽다.',
 '**Full scoring이 항상 나쁜 것은 아니다.** PDP-60처럼 데이터셋이 매우 작을 때는 오히려 full scoring이 더 잘 작동했다고 저자들이 직접 밝혔다 — partial이 언제나 우월하다는 일반화는 과장이다.',
 '**"단어를 찾아냈다"는 사후 관찰이지 학습 목표가 아니다.** 결정적 단어(switch word) 탐지는 확률 비율을 사후에 분석해서 얻은 관찰일 뿐, 모델이 그 단어를 찾도록 명시적으로 학습되지는 않았다.'
],

figures:[
 {f:'fig1-overview.png',
  cap:'대명사 "it"을 "trophy"/"suitcase"로 치환한 두 문장을 언어모델에 넣어 단어별 확률(초록/주황 막대)을 얻고, 그 비율(1.3, 0.9, 9.9, 1.2)이 "big" 위치에서 가장 크게 튄다 — 이 위치가 정답을 가르는 결정적 단어라는 뜻이다.',
  src:'원문 Figure 1, p.3'},
 {f:'fig-partial-scoring.png',
  cap:'각 줄이 문제 하나. 위 줄(Full)은 대명사 위치(빨간 박스)의 확률이 낮아 오답을 골랐지만, 아래 줄(Partial)은 그 이후 단어([대괄호] 표시)에 집중해 정답(*표시)을 맞힌다. 색이 진할수록(파랑) 그 단어의 확률 비율이 크다.',
  src:'원문 Figure 3, p.7'}
],

quotes:[
 {t:'Key to our method is the use of language models, trained on a massive amount of unlabled data, to score multiple choice questions posed by commonsense reasoning tests.',
  src:'Abstract, p.1'},
 {t:'In contrast, our unsupervised method is simpler while having significantly higher accuracy.',
  src:'Section 2, p.2'}
],

links:[
 {t:'arXiv 1806.02847 — A Simple Method for Commonsense Reasoning', u:'https://arxiv.org/abs/1806.02847'},
 {t:'공식 코드 (tensorflow/models, lm_commonsense)', u:'https://github.com/tensorflow/models/tree/master/research/lm_commonsense'}
]
});
