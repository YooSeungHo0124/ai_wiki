WIKI.paper({
slug:'uda',
venue:'NeurIPS 2020 (arXiv 2019)',
authors:'Xie, Dai, Hovy, Luong, Le (Google Brain · CMU)',
arxiv:'1904.12848',

tldr:'라벨 없는 데이터에 **좋은(강한) 데이터 증강**을 걸고, 원본과 증강본의 예측이 같아지도록 일관성 손실을 주는 것만으로 준지도학습이 극적으로 좋아진다는 것을 보인 논문. IMDb 라벨 **20개**로 25,000개 전체 라벨 지도학습을 이겼다.',

context:'2019년 초의 일관성 훈련(consistency training) 기반 준지도학습은 가우시안 노이즈나 단순한 dropout처럼 **약한 노이즈**를 입력에 주고 예측이 흔들리지 않게 하는 방식이 표준이었다(VAT 등). 반면 같은 시기 지도학습에서는 [AutoAugment](#/p/autoaugment)류의 공격적인 증강이 성능을 크게 끌어올리고 있었는데, 이 둘은 서로 다른 연구로 취급됐다. 이 논문의 질문은 단순하다 — **지도학습에서 검증된 강한 증강을, 일관성 손실의 "노이즈" 자리에 그대로 꽂으면 어떨까?** 저자들은 노이즈가 약할수록 안전하다는 통념과 반대로, 라벨을 보존하면서도 다양하고 사실적인 노이즈일수록 일관성 훈련에 유리하다고 주장한다.',

ideas:[
 {h:'노이즈를 가우시안이 아니라 최신 증강으로 교체',
  lead:'단순 노이즈 대신 이미지는 RandAugment, 텍스트는 역번역을 일관성 훈련의 노이즈로 쓴다.',
  d:'기존 일관성 훈련은 입력에 작은 가우시안 노이즈나 dropout을 줘서 예측이 불변하도록 만들었다. UDA는 그 자리에 이미지 [AutoAugment](#/p/autoaugment) 계열의 RandAugment, 텍스트는 영어→프랑스어→영어 역번역(back-translation), 문서 분류에는 TF-IDF 기반 단어 치환을 쓴다. 단순 노이즈는 입력을 국소적으로만 흔들지만, 이런 증강은 라벨을 유지하면서도 훨씬 크고 다양하게 흔든다.'},
 {h:'지도 손실 + 비지도 일관성 손실의 결합',
  lead:'라벨 있는 배치는 교차엔트로피로, 라벨 없는 배치는 원본-증강본 예측 일치로 학습한다.',
  d:'라벨 데이터에는 표준 교차엔트로피를 쓰고, 라벨 없는 데이터에는 원본 $x$ 에 대한 예측 $p_{\\tilde\\theta}(y|x)$(그래디언트 차단된 고정 파라미터로 계산)와 증강본 $\\hat x = q(x,\\epsilon)$ 에 대한 예측 $p_\\theta(y|\\hat x)$ 사이의 KL/교차엔트로피를 최소화한다. 두 손실을 가중치 $\\lambda$ 로 더해 한 번에 학습한다.'},
 {h:'Training Signal Annealing: 쉬운 라벨 예제부터 억제',
  lead:'라벨이 극히 적을 때 모델이 이미 자신있는 라벨 예제의 손실을 점진적으로 걸러낸다.',
  d:'라벨이 20개처럼 극단적으로 적으면 supervised loss가 순식간에 과적합해 unlabeled 신호를 압도한다. TSA는 모델이 이미 confidence threshold를 넘겨 맞히는 라벨 예제는 그래디언트에서 제외해, 학습이 남은 어려운 라벨과 비지도 신호에 집중하게 만든다.'},
 {h:'신뢰도 기반 마스킹으로 비지도 신호를 거른다',
  lead:'모델이 확신하지 못하는 비지도 예제는 일관성 손실 계산에서 제외한다.',
  d:'한 미니배치 안에서 원본 예측의 최고 확률이 임계값 $\\beta$(CIFAR-10·SVHN은 0.8, ImageNet은 0.5) 를 넘는 예제만 일관성 손실에 반영한다. 모델이 아직 잘 모르는 예제에 대해 억지로 일관성을 강제하면 잘못된 신호가 전파되는 것을 막기 위함이다.'}
],

diagram:{type:'flow', cap:'라벨 데이터는 지도 손실로, 비라벨 데이터는 원본과 증강본의 예측을 일치시키는 비지도 일관성 손실로 학습해 둘을 더한다.',
 nodes:[
  {t:'비라벨 입력 x', s:''},
  {t:'강한 증강', s:'RandAugment·역번역', acc:true},
  {t:'예측 비교', s:'원본 vs 증강본'},
  {t:'일관성 손실', s:'+ 지도 손실'}
 ]},

math:[
 {expr:'min_θ J(θ) = E[-log p_θ(y*|x1)] + λ·E[CE(p_θ̃(y|x2) || p_θ(y|x̂))]',
  tex:'\\min_\\theta \\mathcal{J}(\\theta)=\\mathbb{E}_{x_1\\sim p_L}[-\\log p_\\theta(f^*(x_1)|x_1)]+\\lambda\\,\\mathbb{E}_{x_2\\sim p_U}\\mathbb{E}_{\\hat x\\sim q(\\hat x|x_2)}\\big[\\text{CE}(p_{\\tilde\\theta}(y|x_2)\\,\\|\\,p_\\theta(y|\\hat x))\\big]',
  d:'앞 항은 라벨 데이터의 표준 교차엔트로피, 뒤 항은 비라벨 데이터에서 원본 $x_2$ 의 예측(그래디언트 차단)과 증강본 $\\hat x$ 의 예측 사이의 일관성 손실. $\\tilde\\theta$ 는 현재 파라미터의 고정 복사본으로, [VAT](https://arxiv.org/abs/1704.03976) 방식을 따른다.'}
],

numbers:[
 {k:'IMDb, 라벨 20개', v:'오차율 4.20%', d:'25,000개 라벨 전체로 학습한 기존 SOTA보다 낮은 오차율'},
 {k:'CIFAR-10, 라벨 250개', v:'오차율 5.43%', d:'RandAugment 사용, 기존 모든 준지도 접근 대비 최고'},
 {k:'ImageNet, 라벨 10%', v:'top-1 58.84%→68.78%', d:'같은 조건 지도학습 단독 대비 **+9.94%p**'},
 {k:'ImageNet, 라벨 100%(+비라벨 130만)', v:'top-1 78.43%→79.05%', d:'라벨이 이미 충분한 고데이터 영역에서도 개선'},
 {k:'TSA 효과 (Yelp-5, 라벨 2.5k)', v:'오차율 50.81%→41.35%', d:'라벨이 극소수일 때 TSA 유무 비교'}
],

impact:'"노이즈는 약할수록 안전하다"는 일관성 훈련의 암묵적 전제를 뒤집고, **지도학습용 최신 증강 기법을 그대로 준지도학습의 노이즈원으로 재활용**할 수 있음을 보였다. 비전과 텍스트 양쪽에서 동시에 검증한 것도 중요한데, 역번역·TF-IDF 치환처럼 도메인별로 다른 "좋은 증강"을 찾아 꽂기만 하면 같은 프레임워크가 그대로 작동한다는 것을 보여줬다. 결과적으로 준지도학습 연구의 초점이 "어떤 손실함수를 쓸까"에서 "어떤 증강이 라벨을 보존하며 다양성을 최대화하는가"로 옮겨가는 계기가 됐다.',

legacy:[
 '**FixMatch 등 후속 준지도 기법의 표준 틀로 정착** — 약한 증강으로 pseudo-label을 만들고 강한 증강본에 그 라벨을 강제하는 방식이 UDA의 일관성 훈련 구조를 사실상 계승했다',
 '**noisy student와의 상호보완** — 비슷한 시기의 [Noisy Student](#/p/noisy-student)는 의사라벨 자기학습 계열이고 UDA는 일관성 훈련 계열이라 접근은 다르지만, 둘 다 "비라벨 데이터에 강한 증강/노이즈를 걸어야 한다"는 결론에 독립적으로 도달했다',
 '**NLP 준지도학습의 재부상** — 역번역을 증강으로 쓴 것이 이후 저자원 텍스트 분류·데이터 증강 연구에서 표준 도구로 자리잡았다',
 '**[BERT](#/p/bert) 파인튜닝과의 결합** — UDA를 BERT 위에 얹어도 개선이 유지됨을 보이며, 사전학습 모델과 준지도 일관성 훈련이 배타적이지 않다는 것을 확인했다'
],

pitfalls:[
 '**AutoAugment를 직접 쓴 것이 아니다.** UDA는 AutoAugment에서 영감을 받았지만 탐색(search) 과정을 없앤 RandAugment를 사용한다 — 정책을 찾기 위한 라벨 데이터가 추가로 필요 없다는 점이 준지도 설정에 중요하다.',
 '**"증강이 강할수록 무조건 좋다"가 아니다.** confidence 임계값과 TSA로 신호를 걸러내지 않으면, 라벨이 극소수인 상황에서 지도 손실이 쉬운 예제에 과적합해 비지도 신호가 묻힌다 — 두 안전장치가 성능에 필수적이다.',
 '**IMDb 20-라벨 결과(4.20%)는 역번역·TF-IDF 등 텍스트 전용 증강이 결합된 최적 설정값이다.** 표에 여러 라벨 개수·증강 조합이 함께 나오므로 어느 행의 수치인지 반드시 확인해야 한다.'
],

figures:[
 {f:'fig1-objective.png',
  cap:'왼쪽: 라벨 데이터 → 모델 M → Supervised Cross-entropy Loss. 오른쪽: 비라벨 데이터를 증강(Back translation/RandAugment/TF-IDF 치환)한 것과 원본 각각을 모델에 통과시켜 두 예측 분포의 차이를 Unsupervised Consistency Loss로 만든다. 둘을 더해 Final Loss.',
  src:'원문 Figure 1, p.3'},
 {f:'fig2-examples.png',
  cap:'위: 한 영화 리뷰 문장을 역번역하면 의미는 유지한 채 표현이 크게 달라진 세 가지 패러프레이즈가 나온다. 아래: 여우 사진에 RandAugment를 적용한 세 가지 결과 — 색감·명암이 크게 바뀌어도 "여우"라는 라벨은 그대로다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'We hypothesize that stronger data augmentations in supervised learning can also lead to superior performance when used to noise unlabeled examples in the semi-supervised consistency training framework.',
  src:'Section 1, p.2'}
],

links:[
 {t:'arXiv 1904.12848 — Unsupervised Data Augmentation for Consistency Training', u:'https://arxiv.org/abs/1904.12848'},
 {t:'공식 코드 (google-research/uda)', u:'https://github.com/google-research/uda'}
]
});
