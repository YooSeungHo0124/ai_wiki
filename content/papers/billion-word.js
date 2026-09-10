WIKI.paper({
slug:'billion-word',
venue:'arXiv 2013 (Google · Edinburgh · Cantab Research)',
authors:'Chelba, Mikolov, Schuster, Ge, Brants, Koehn, Robinson',
arxiv:'1312.3005',

tldr:'약 8억 단어짜리 언어모델 벤치마크 데이터셋을 표준화해 공개하고, n-gram부터 [신경망 언어모델](#/p/nnlm) 계열까지 같은 데이터·같은 지표(perplexity)로 비교한 논문. "누가 더 좋은 언어모델을 만들었는가"를 잴 공통 자를 처음으로 제공했다.',

context:'2013년 이전까지 언어모델 논문들은 저마다 다른 데이터(Penn Treebank처럼 너무 작거나, 사내 전용 코퍼스처럼 재현 불가능한)로 성능을 보고했다. [신경망 언어모델](#/p/nnlm) 계열이 유망하다는 것은 알려져 있었지만, 대량의 데이터에서 전통적인 n-gram과 정말 경쟁이 되는지, 그리고 그 결과가 다른 연구실에서도 재현되는지 확인할 방법이 없었다. Goodman(2001)이 대규모 데이터에서 여러 기법을 비교한 선례가 있었지만 데이터 자체가 공개되지는 않았다.',

ideas:[
 {h:'"공짜로 받을 수 있는" 데이터로 벤치마크를 만든다',
  lead:'WMT11 학습 코퍼스를 정제해 누구나 내려받아 똑같이 재현할 수 있게 했다.',
  d:'벤치마크의 목적은 새로운 기록이 아니라 **비교 가능성**이다. 저자들은 WMT11 사이트에 공개된 코퍼스를 정규화·토큰화하고 중복 문장을 제거해 약 29억 단어를 8억 단어로 줄였다. 데이터가 저작권이나 사내 접근 권한 없이 웹에서 바로 받을 수 있다는 점이, 결과를 재현할 수 있는지 여부를 갈랐다.'},
 {h:'문장 순서를 섞어 100개 파티션으로 나눈다',
  lead:'문장 단위로 셔플한 뒤 100등분해 학습·평가 데이터를 분리한다.',
  d:'원 데이터의 문장 순서를 무작위로 섞고 100개의 서로 겹치지 않는 파티션으로 나눠, 그중 1개를 held-out으로 뺐다. 이렇게 섞은 대가로 문장을 넘어서는 장기 문맥(예: 문단 단위 의존관계)을 요구하는 모델은 이 벤치마크로 평가할 수 없다는 제약이 생긴다.'},
 {h:'같은 데이터로 n-gram과 신경망을 나란히 비교',
  lead:'Kneser-Ney·Katz·Stupid Backoff부터 RNN까지 같은 test set에서 perplexity를 직접 비교했다.',
  d:'보간 Kneser-Ney 5-gram(67.6), Katz 5-gram(79.9), Stupid Backoff(87.9) 같은 전통 기법과 [Bengio 2003 신경망 언어모델](#/p/nnlm) 계열의 MaxEnt·RNN 기반 모델을 같은 test set·같은 perplexity 지표로 나란히 놓았다. RNN 계열이 은닉 유닛을 1024개까지 늘렸을 때 가장 낮은 perplexity(51.3)를 기록했다.'},
 {h:'모델을 선형 결합하면 더 떨어진다',
  lead:'여러 모델의 확률을 선형 보간하면 단일 모델보다 perplexity가 더 낮아진다.',
  d:'KN 5-gram, RNN-256/512/1024, Stupid Backoff, MaxEnt 모델의 출력 확률을 held-out 데이터로 튜닝한 가중치로 선형 결합하면 perplexity가 43.8까지 떨어진다. 흥미롭게도 성능이 가장 나쁜 축에 속하는 Stupid Backoff가 결합에서 오히려 큰 가중치(0.20)를 받아, 단일 모델 성능과 결합 시 기여도가 다르다는 점을 보여준다.'}
],

diagram:{type:'compare', cap:'같은 test set에서 perplexity(낮을수록 좋음)를 직접 비교한 결과. RNN 계열이 전통 n-gram을 앞서기 시작한 첫 공개 대규모 비교다.',
 left:{t:'n-gram 계열', items:['보간 KN 5-gram: 67.6','Katz 5-gram: 79.9','Stupid Backoff: 87.9']},
 right:{t:'신경망 계열', items:['RNN-256+MaxEnt: 58.3','RNN-1024+MaxEnt: 51.3','전체 선형 결합: 43.8']}},

math:[
 {expr:'PPL = exp( -1/N * Σ log p(w_i) )',
  tex:'\\text{PPL} = \\exp\\!\\left(-\\frac{1}{N}\\sum_{i=1}^{N}\\log p(w_i)\\right)',
  d:'perplexity는 모델이 다음 단어를 얼마나 헷갈려하는지를 나타내는 지표로, 낮을수록 좋다. 이 논문에서 perplexity 35% 감소는 cross-entropy(비트) 기준으로는 10% 감소에 해당한다고 명시한다 — 두 지표가 로그 관계라 감소율이 그대로 대응되지 않는다는 점에 유의해야 한다.'}
],

numbers:[
 {k:'전체 단어 수', v:'약 8.29억', d:'중복 제거 후 학습 데이터 크기(문장 경계 마커 포함)'},
 {k:'어휘 크기', v:'793,471', d:'빈도 3 미만 단어는 `<UNK>`로 대체'},
 {k:'베이스라인 perplexity', v:'67.6', d:'보간 Kneser-Ney 5-gram, 가지치기 없음'},
 {k:'최고 단일 모델', v:'51.3', d:'RNN-1024 + MaxEnt 9-gram, 파라미터 200억 개, 학습 10일'},
 {k:'모델 결합 결과', v:'43.8', d:'베이스라인 대비 perplexity **35%** 감소 (cross-entropy 기준 10% 감소)'},
 {k:'OOV 비율', v:'0.28%', d:'test set 기준 어휘 밖 단어 비율'}
],

impact:'이 벤치마크는 이후 신경망 언어모델 논문들이 "우리 모델이 얼마나 나아졌는가"를 주장할 때 쓰는 사실상의 표준 시험장이 됐다. 특히 [거대 LSTM 언어모델 연구](#/p/lm-limits)가 이 벤치마크에서 perplexity를 30대까지 끌어내리며 신경망 언어모델의 스케일링 가능성을 처음으로 명확히 보여줬다. 데이터·평가 스크립트·베이스라인 log-probability까지 공개했다는 점이, 이후 언어모델 연구가 논문마다 다른 셋업으로 성능을 주장하는 문제를 크게 줄였다.',

legacy:[
 '**[Exploring the Limits of Language Modeling](#/p/lm-limits)** — 이 벤치마크에서 LSTM 기반 대형 언어모델의 perplexity를 대폭 낮추며 신경망 스케일업의 가능성을 입증',
 '**perplexity의 표준화** — 이후 GPT 계열까지 이어지는 "perplexity로 언어모델을 비교한다"는 관행의 근거가 된 초기 사례',
 '**모델 결합(ensembling) 관행** — 서로 다른 계열의 모델을 선형 결합하면 단일 모델보다 낫다는 관찰이 이후 언어모델 실무에도 반복적으로 등장',
 '**공개 재현 가능 벤치마크 문화** — 데이터·스크립트·베이스라인 결과까지 전부 공개하는 방식이 이후 NLP 벤치마크 설계의 기본값이 됨'
],

pitfalls:[
 '**문장이 무작위로 섞여 있다.** 문단·문서 단위의 장기 문맥을 요구하는 모델(예: 현대의 긴 문맥 언어모델)은 이 벤치마크로 제대로 평가할 수 없다 — 원 논문이 스스로 명시한 한계다.',
 '**"perplexity가 낮다"가 "실제 응용에서 더 낫다"를 보장하지 않는다.** 이 논문도 음성인식·번역 같은 다운스트림 성능과의 상관관계는 별도로 확인해야 한다고 밝힌다.',
 '**RNN 학습 비용을 가볍게 보면 안 된다.** 가장 좋은 결과를 낸 RNN-1024 모델은 GPU 없이 단일 머신에서 최대 2주가 걸렸다 — 2013년 기준으로도 상당한 비용이다.'
],

links:[
 {t:'arXiv 1312.3005 — One Billion Word Benchmark', u:'https://arxiv.org/abs/1312.3005'},
 {t:'벤치마크 코드/데이터 (GitHub, ciprian-chelba)', u:'https://github.com/ciprian-chelba/1-billion-word-language-modeling-benchmark'}
]
});
