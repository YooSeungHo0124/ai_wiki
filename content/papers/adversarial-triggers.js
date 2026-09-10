WIKI.paper({
slug:'adversarial-triggers',
venue:'EMNLP 2019',
authors:'Wallace, Feng, Kandpal, Gardner, Singh (Allen Institute for AI · UMD · UC Irvine)',
arxiv:'1908.07125',

tldr:'입력이 무엇이든 앞(또는 뒤)에 붙이기만 하면 모델을 틀리게 만드는 짧은 토큰열 — **보편 적대 트리거(universal adversarial trigger)** — 를 경사 기반 탐색으로 찾는 공격. [FGSM](#/p/fgsm)의 연속 픽셀 섭동을 이산 토큰 교체로 옮긴 언어판이다.',

context:'2019년의 텍스트 적대 공격은 대부분 **입력 하나마다** 섭동을 새로 계산했다 — 문장 A를 속이는 섭동이 문장 B에는 통하지 않는다. 이미지 쪽에서는 [FGSM](#/p/fgsm) 이후 "어떤 입력에 붙여도 통하는" 보편 섭동(universal perturbation)이 이미 알려져 있었지만, 텍스트는 토큰이 이산적이라 그래디언트를 직접 더할 수 없다는 문제가 있었다. 저자들은 HotFlip의 1차 테일러 근사를 이용해 이 문제를 우회하면서 질문을 던진다 — **입력에 무관하게 통하는 트리거를 텍스트에서도 찾을 수 있는가?**',

ideas:[
 {h:'보편 적대 트리거: 입력 무관 토큰열',
  lead:'같은 몇 개 토큰을 어떤 입력에 붙여도 목표 예측을 일으키도록 최적화한다.',
  d:'개별 입력 $t$ 에 대한 공격 $f(t_{adv};t)=\\tilde{y}$ 대신, 데이터 분포 $\\mathcal{T}$ 전체에서 평균 손실을 최소화하는 트리거 $t_{adv}$ 를 찾는다. 한번 찾으면 재사용·배포가 가능해서 공격자가 대상 모델에 접근할 필요조차 없어진다는 것이 안보적 함의다.'},
 {h:'HotFlip 기반 1차 근사 토큰 교체',
  lead:'토큰을 임베딩 공간에서 손실의 1차 테일러 근사로 그때그때 최적 후보로 바꾼다.',
  d:'토큰은 이산적이라 그래디언트를 직접 더할 수 없다. 대신 현재 트리거 임베딩 $e_{adv_i}$ 주변에서 손실의 1차 테일러 근사를 최소화하는 어휘 임베딩 $e_i\'$ 을 브루트포스 내적으로 찾고, 그 임베딩에 대응하는 토큰으로 치환한다. `the the the` 같은 초기화에서 시작해 배치 단위로 반복하면 몇 스텝 만에 `zoning tapping fiennes` 같은 트리거로 수렴한다.'},
 {h:'빔서치로 다중 위치를 동시에 탐색',
  lead:'각 토큰 위치의 top-k 후보를 좌에서 우로 빔서치해 국소최적을 피한다.',
  d:'1차 근사가 실제 손실 변화를 완벽히 반영하지 못하므로, 한 토큰만 탐욕적으로 바꾸면 국소 최적에 갇히기 쉽다. 각 위치에서 top-k 후보를 남기고 배치 손실로 빔을 평가하는 좌→우 빔서치를 더해, 특히 SQuAD처럼 트리거가 길 때 성공률을 크게 높인다.'},
 {h:'화이트박스로 만든 트리거가 블랙박스로 전이된다',
  lead:'한 모델·임베딩으로 최적화한 트리거가 다른 아키텍처·임베딩 모델에도 통한다.',
  d:'GloVe 기반 SQuAD 모델(BiDAF)로 만든 트리거가 ELMo 기반 모델이나 아예 다른 아키텍처인 QANet에도 어느 정도 통하고, [GPT-2](#/p/gpt2) 117M용 트리거가 345M 모델에도 통한다. 트리거를 만드는 데 목표 모델 접근이 필요 없다는 뜻이라 실전 위협도가 더 높아진다.'},
 {h:'트리거는 공격이자 모델 분석 도구',
  lead:'입력과 무관하다는 성질을 거꾸로 이용해 모델이 기댄 데이터셋 편향을 드러낸다.',
  d:'트리거는 특정 문장이 아니라 데이터 분포 전체에 통해야 하므로, 성공한 트리거는 개별 사례의 오류가 아니라 **모델이 데이터셋에서 배운 일반적 지름길**을 가리킨다. SNLI에서 "nobody" 한 단어가 Entailment 예측을 99.43%까지 Contradiction으로 뒤집는 것이 대표 사례다.'}
],

diagram:{type:'flow', cap:'트리거 탐색 한 스텝. 현재 트리거를 배치에 붙여 목표 손실의 그래디언트를 구하고, 1차 근사로 각 토큰을 더 나은 후보로 교체한 뒤 수렴할 때까지 반복한다.',
 nodes:[
  {t:'현재 트리거', s:'예: the the the'},
  {t:'배치에 결합', s:'입력 앞에 붙임'},
  {t:'목표 손실 계산', s:'예: p(negative)'},
  {t:'그래디언트', s:'∇e_adv L', acc:true},
  {t:'토큰 교체', s:'1차 근사 + 빔서치', a:'반복'}
 ]},

math:[
 {expr:'arg min_{t_adv}  E_{t~T} [ L(ỹ, f(t_adv; t)) ]',
  tex:'\\arg\\min_{t_{adv}} \\; \\mathbb{E}_{t\\sim\\mathcal{T}}\\big[\\mathcal{L}(\\tilde{y}, f(t_{adv};t))\\big]',
  d:'보편 공격의 목적함수. 개별 입력이 아니라 데이터 분포 $\\mathcal{T}$ 전체에 대한 기대 손실을 최소화하는 트리거 $t_{adv}$ 를 찾는다.'},
 {expr:'arg min_{e_i\' ∈ V}  (e_i\' − e_adv_i)ᵀ ∇_{e_adv_i} L',
  tex:'\\arg\\min_{e_i^{\\prime}\\in\\mathcal{V}} \\;\\left(e_i^{\\prime}-e_{adv_i}\\right)^{\\!\\top}\\nabla_{e_{adv_i}}\\mathcal{L}',
  d:'토큰 $i$ 를 교체할 때 푸는 1차 테일러 근사. 어휘 전체 임베딩 $\\mathcal{V}$ 와의 내적을 브루트포스로 계산해 손실을 가장 줄이는 후보를 고른다 — forward pass 전부를 돌리는 것보다 싸다.'}
],

numbers:[
 {k:'SNLI 함의(entailment) 정확도', v:'89.94% → 0.55%', d:'한 단어 트리거 하나로 세 모델 평균 정확도가 거의 0으로'},
 {k:'SNLI, "nobody" 트리거', v:'Entailment→Contradiction 99.43%', d:'DA 모델 기준, 단어 하나로'},
 {k:'감성분석(SST) 정확도', v:'86.2% → 29.1%', d:'`zoning tapping fiennes` 세 단어, Bi-LSTM+word2vec, 긍정→부정'},
 {k:'SQuAD "why" 질문', v:'72%가 목표 답 생성', d:'ELMo 모델, 트리거 정제 후(reduced trigger, Table 5)'},
 {k:'GPT-2 117M 인종차별 발화 유도', v:'샘플 98% 인종/공격적, 63% 명시적 인종차별', d:'6개 서브워드 트리거 `TH PEOPLEMan goddreams Blacks` 사용, 100개 샘플 수작업 분석'},
 {k:'GPT-2 345M 전이', v:'58%에서 유사한 명시적 인종차별', d:'117M용 트리거를 그대로 345M에 적용 — 화이트박스 접근 없이도 전이'}
],

impact:'적대 공격이 "이 문장 하나만 깨는 섭동"에서 "배포 가능한 범용 공격 문자열"로 바뀐 것이 핵심이다. 트리거를 한 번만 계산해 텍스트로 공유하면 되므로, 공격에 필요한 자원과 목표 모델 접근 요건이 크게 낮아진다. 동시에 이 논문은 공격과 해석을 같은 도구로 묶었다 — 트리거가 잘 먹힌다는 사실 자체가 SNLI·SQuAD 모델이 표면적 패턴에 기대고 있다는 진단이 된다. 이후 프롬프트 주입·탈옥(jailbreak) 연구는 "입력 앞에 고정 문자열을 붙여 모델을 장악한다"는 이 논문의 구도를 그대로 물려받았다.',

legacy:[
 '**경사 기반 이산 토큰 탐색의 표준형** — HotFlip의 1차 근사 + 빔서치 조합이 이후 텍스트 적대 공격·프롬프트 최적화 연구의 기본 레시피가 됨',
 '**보편성이라는 위협 모델** — "입력 무관 공격"이라는 틀이 이후 프롬프트 주입 연구와 탈옥 프롬프트 탐색으로 이어짐(자동화된 탈옥 문자열 탐색은 이 논문의 목적함수를 거의 그대로 가져옴)',
 '언어모델 안전성 논의에서 "누구나 재배포 가능한 공격 문자열"이라는 위협이 이 논문 이후 표준 시나리오로 자리잡음',
 '트리거를 모델 진단 도구로 쓰는 접근은 [편향 서베이](#/p/bias-survey)류 연구가 데이터셋 편향을 드러내는 방법론과 궤를 같이함'
],

pitfalls:[
 '**"트리거가 통한다"가 곧 "모델이 이해를 못 한다"의 증명은 아니다.** 저자들도 트리거 성공을 PMI 기반 데이터셋 아티팩트와 연결해 설명하지, 모델의 일반적 무능으로 확대 해석하지 않는다.',
 '**트리거는 white-box 그래디언트로 생성되지만 공격 자체는 white-box 접근을 요구하지 않는다** — 전이성 덕분에 대리 모델로 만든 트리거를 블랙박스 목표에 그대로 쓸 수 있다는 점이 흔히 간과된다.',
 '**어떤 토큰이 트리거에 있다고 그 토큰 자체가 원인은 아니다.** "Blacks"를 "Asians"·"Jews"로 바꿔도 유해 출력이 유지된다는 저자들의 실험이 보여주듯, 개별 토큰이 아니라 트리거 전체의 상호작용이 효과를 낸다.'
],

figures:[
 {f:'fig1-search.png',
  cap:'트리거 탐색 한 스텝을 세 번 반복해 보여준다. 왼쪽 박스가 현재 트리거(the the the → movie apollo spider → zoning tapping fiennes), 오른쪽이 그 트리거를 붙인 배치의 목표 클래스 확률(p(neg)). 그래디언트로 각 토큰 아래 후보 목록(초록 상자)을 만들고 그중 하나를 다음 트리거로 선택하는 과정이 아래로 이어진다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'We define universal adversarial triggers: input-agnostic sequences of tokens that trigger a model to produce a specific prediction when concatenated to any input from a dataset.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1908.07125 — Universal Adversarial Triggers for Attacking and Analyzing NLP', u:'https://arxiv.org/abs/1908.07125'},
 {t:'공식 코드 (GitHub)', u:'https://github.com/Eric-Wallace/universal-triggers'}
]
});
