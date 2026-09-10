WIKI.paper({
slug:'wikitext',
venue:'arXiv 2016 (unpublished, widely cited)',
authors:'Merity, Xiong, Bradbury, Socher (MetaMind / Salesforce)',
arxiv:'1609.07843',

tldr:'Pointer Sentinel Mixture 라는 기법 논문이자, 그 평가를 위해 **WikiText 데이터셋**을 함께 낸 논문. [Penn Treebank](#/p/lstm)의 한계(어휘 1만 단어, 소문자화·구두점 제거 등 과도한 전처리)를 정면으로 지적하며 대안을 만들었고, 이후 언어모델 perplexity 보고의 표준 벤치마크가 되었다.',

context:'2016년까지 단어 단위 언어모델 연구는 거의 전부 Penn Treebank(PTB)로 성능을 보고했다. 문제는 PTB가 1990년대에 만들어진 전처리 관행을 그대로 물려받았다는 점이다 — 소문자화, 구두점 제거, 숫자를 `N`으로 치환, 어휘를 최빈 1만 단어로 제한. 저자들은 이 전처리가 실제 언어 사용과 동떨어져 있고, 특히 희귀 단어의 긴 꼬리를 아예 잘라내 버려 "긴 문맥에서 희귀 단어를 예측하는" 능력을 평가할 수 없게 만든다고 지적한다. 대안이던 One Billion Word Benchmark는 문장 순서를 무작위로 섞어놔서 장거리 의존성 학습 자체가 불가능했다. 동시에 저자들은 모델 쪽 문제도 겨냥한다 — RNN의 고정 크기 은닉 상태로는 문맥에 등장한 고유명사를 몇 문단 뒤에 그대로 다시 꺼내 쓰는 일이 구조적으로 손실이 크다.',

ideas:[
 {h:'Pointer Sentinel: 어휘 softmax와 포인터를 섞는다',
  lead:'RNN의 vocabulary softmax와 최근 문맥을 가리키는 pointer network를 gate 하나로 혼합한다.',
  d:'Vinyals et al.(2015)의 Pointer Network는 입력에 있는 단어만 출력할 수 있어 입력에 없는 단어는 아예 못 뱉는다. 이 논문은 pointer 분포 $p_{ptr}$ 과 표준 어휘 분포 $p_{vocab}$ 을 게이트 $g$ 로 섞어 $p = g\\,p_{vocab} + (1-g)p_{ptr}$ 를 만든다 — 최근에 나온 단어면 포인터가, 처음 나오는 단어면 vocabulary가 담당한다.'},
 {h:'sentinel: 포인터 스스로 "모르겠다"고 말하게 한다',
  lead:'포인터의 attention 후보에 sentinel 벡터를 끼워 넣어 백오프 여부 자체를 포인터가 결정하게 한다.',
  d:'기존 방식([Gulcehre 2016] 등)은 별도의 switching network가 RNN 상태만 보고 포인터를 쓸지 결정했다. 이 논문은 그 대신 attention 점수 벡터 $z$ 에 sentinel 벡터 $s$ 하나를 추가 원소로 넣고 함께 softmax를 취한다. sentinel이 확률 질량을 많이 가져가면 그만큼이 자동으로 vocabulary 쪽 확률로 넘어가므로, "포인터 후보 중 확신이 안 선다"는 신호 자체가 백오프 결정이 된다.'},
 {h:'query 벡터로 자기 자신을 가리키는 편향을 없앤다',
  lead:'마지막 은닉상태를 그대로 쓰지 않고 별도 MLP로 query를 만들어 자기 내적 편향을 제거한다.',
  d:'최근 은닉 상태 $h_{N-1}$ 자신을 attention 후보에도 포함시키면, 벡터의 내적은 자기 자신과 가장 크므로 항상 "방금 나온 단어"에 쏠리는 편향이 생긴다. $q=\\tanh(Wh_{N-1}+b)$ 로 별도 query를 투영해 이 편향을 없앤다.'},
 {h:'WikiText: 원문 그대로의 위키백과 우수 문서',
  lead:'PTB식 전처리 없이 원래 대소문자·구두점·숫자를 보존한 위키백과 Good/Featured 문서로 데이터셋을 새로 만든다.',
  d:'23,805개 Good 문서와 4,790개 Featured 문서(사람이 검수해 품질이 검증된 문서)에서 텍스트를 추출해, Moses tokenizer로만 정규화하고 등장 빈도 3 미만 단어만 `<unk>`로 치환한다. 문서 순서를 보존해 장거리 의존성 학습·평가가 가능하고, WikiText-2(PTB의 2배 크기, 어휘 33,278)와 WikiText-103(전체, 어휘 267,735) 두 크기로 배포한다.'}
],

diagram:{type:'flow', cap:'RNN이 만든 query로 최근 L개 은닉상태와 sentinel 벡터를 함께 attention한 뒤, sentinel이 가져간 확률만큼 vocabulary softmax로 되돌려 최종 분포를 만든다.',
 nodes:[
  {t:'RNN 은닉상태', s:'h_{N-1}'},
  {t:'query 투영', s:'q=tanh(Wh+b)'},
  {t:'ptr+sentinel', s:'attention', acc:true},
  {t:'gate g 산출', s:'sentinel 질량'},
  {t:'혼합 분포', s:'g·vocab+(1-g)·ptr'}
 ]},

math:[
 {expr:'p(y_i|x_i) = g · p_vocab(y_i|x_i) + (1-g) · p_ptr(y_i|x_i)',
  tex:'p(y_i\\mid x_i) = g\\,p_{vocab}(y_i\\mid x_i) + (1-g)\\,p_{ptr}(y_i\\mid x_i)',
  d:'전체 모델의 최종 출력. $g$ 는 포인터 attention에 sentinel 원소를 끼워 넣어 계산되므로 별도의 파라미터가 거의 필요 없다.'},
 {expr:'z_i = qᵀh_i,  a = softmax([z; qᵀs])',
  tex:'z_i = q^{\\top}h_i,\\qquad a = \\text{softmax}\\big(z;\\, q^{\\top}s\\big)',
  d:'query와 최근 $L$개 은닉상태의 내적에 sentinel과의 내적 $q^Ts$ 를 한 원소 더 붙여 함께 softmax한다. 마지막 원소 $a[V+1]$ 이 곧 gate $g$ 다.'},
 {expr:'p_ptr(y|x) = (1/(1-g)) · Σ_{i∈I(y,x)} a_i',
  tex:'p_{ptr}(y\\mid x) = \\frac{1}{1-g}\\sum_{i\\in I(y,x)} a_i',
  d:'같은 단어가 윈도 안에 여러 번 등장하면(pointer sum attention) 그 위치들의 attention 질량을 모두 더한다. sentinel이 가져간 $g$ 만큼을 제외하고 나머지를 다시 정규화한다.'}
],

numbers:[
 {k:'PTB test PPL', v:'70.9', d:'pointer sentinel-LSTM, 파라미터 21M — Table 2, 당시 SOTA'},
 {k:'WikiText-2 test PPL', v:'80.8', d:'같은 모델을 새 데이터셋에 적용, variational LSTM(96.3)보다 우수 — Table 3'},
 {k:'PTB 어휘/OoV', v:'10,000 / 4.8%', d:'Table 1 — 최빈 1만 단어 고정, 나머지는 `<unk>`'},
 {k:'WikiText-2 어휘/OoV', v:'33,278 / 2.6%', d:'PTB의 3배 어휘, Table 1'},
 {k:'WikiText-103 규모', v:'103,227,021 토큰 · 어휘 267,735', d:'PTB의 약 100배, One Billion Word Benchmark의 약 1/10 규모'},
 {k:'추가 파라미터', v:'H²+2H', d:'query용 W,b와 sentinel 벡터 s뿐 — LSTM 한 층의 8H²+4H에 비해 미미'}
],

impact:'이 논문의 실질적 영향은 기법(pointer sentinel)보다 **데이터셋**에서 더 크게 남았다. WikiText-2/103은 이후 몇 년간 단어 단위 언어모델 perplexity를 보고하는 사실상의 표준 벤치마크가 되어, PTB의 좁은 1만 어휘·과도한 전처리 문제 없이 모델을 비교할 수 있게 했다. 기법 측면에서는 "모델이 어휘 전체에서 고를지, 방금 본 문맥에서 그대로 가리킬지를 스스로 결정하게 한다"는 아이디어가, [attention이 곧 정보 검색이라는 관점](#/p/transformer)과 맞물려 이후 복사(copy) 메커니즘을 쓰는 요약·QA 모델들의 설계에 반복적으로 재등장했다.',

legacy:[
 '**WikiText-2/103이 언어모델 perplexity의 표준 벤치마크로 정착** — 이후 [Transformer-XL](#/p/transformer-xl), AWD-LSTM 등 다수 논문이 이 데이터셋으로 SOTA를 보고',
 '**copy/pointer 메커니즘의 재등장** — 요약 모델(Pointer-Generator), QA 모델 등에서 "어휘 vs 입력에서 복사" 이분법이 이 논문과 같은 gate 구조로 반복됨',
 '**sentinel로 게이트를 attention에 통합하는 설계** — 별도 스위칭 네트워크 없이 attention 자체에 백오프 옵션을 끼워 넣는 방식이 이후 여러 혼합 분포 모델의 참고 설계가 됨'
],

pitfalls:[
 '**PTB 대비 수치가 절대적으로 우월한 것으로 오해하기 쉽다.** WikiText-2 PPL(80.8)이 PTB PPL(70.9)보다 높은 건 모델이 나빠서가 아니라 어휘가 3배 넘게 크기 때문 — 서로 다른 어휘 크기의 perplexity는 직접 비교할 수 없다.',
 '**pointer가 "새 단어를 생성한다"는 뜻이 아니다.** 포인터는 여전히 입력 윈도 안에 이미 등장한 단어만 가리킬 수 있고, 어휘에도 없고 최근 문맥에도 없는 단어는 이 모델도 예측하지 못한다.',
 '**WikiText-103 이 "10억 단어 벤치마크의 대체"는 아니다.** 저자들 스스로 그 데이터셋의 1/10 크기라고 명시하며, 장점은 규모가 아니라 문서 순서 보존과 원문 그대로의 전처리다.'
],

figures:[
 {f:'fig1-pointer-sentinel.png',
  cap:'위쪽 Pointer 행이 최근 문맥(Fed, Chair, Janet, Yellen…)에 대한 attention이고 맨 오른쪽 회색이 sentinel. 아래쪽 Softmax RNN 행이 전체 어휘 분포. 두 분포가 게이트 g로 섞여 다음 단어(Yellen)를 예측한다.',
  src:'원문 Figure 1, p.1'},
 {f:'fig3-zipf.png',
  cap:'x축이 빈도 순위, y축이 등장 빈도(둘 다 로그 스케일). 왼쪽 PTB는 어휘가 10⁴에서 뚝 끊기는 반면(그 너머 단어가 전부 `<unk>`), 오른쪽 WikiText-2는 10⁵ 부근까지 자연스러운 긴 꼬리가 이어진다.',
  src:'원문 Figure 3, p.7'}
],

quotes:[
 {t:'Recent neural network sequence models with softmax classifiers have achieved their best language modeling performance only with very large hidden states and large vocabularies.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1609.07843 — Pointer Sentinel Mixture Models', u:'https://arxiv.org/abs/1609.07843'}
]
});
