WIKI.paper({
slug:'eagle3',
venue:'arXiv 2025',
authors:'Li, Wei, Zhang, Zhang (Peking University · Microsoft Research · U. Waterloo · Vector Institute)',
arxiv:'2503.01840',

tldr:'[EAGLE](#/p/eagle)의 feature 예측 제약을 없애고 토큰을 직접 예측하도록 바꾸면서, 목표 모델의 저·중·고층 feature를 함께 쓰는 draft 모델을 학습 중에 다단계 추론을 시뮬레이션(Training-Time Test)해 만든다. 그 결과 학습 데이터를 늘릴수록 가속률이 함께 늘어나는 스케일링 법칙이 처음으로 관찰됐다.',

context:'[추측 디코딩](#/p/speculative)은 작은 draft 모델이 여러 토큰을 먼저 생성하고 목표 모델이 병렬로 검증하는 방식으로 지연 시간을 줄인다. [EAGLE](#/p/eagle)은 토큰이 아니라 목표 모델의 **최상위층 feature**를 자기회귀적으로 예측한 뒤 목표 모델의 LM head를 재사용해 draft 토큰을 얻는다. 문제는 EAGLE의 학습 손실이 feature 예측 손실 $l_{fea}$ 와 토큰 예측 손실 $l_{token}$ 을 함께 쓴다는 점이다. feature를 정확히 맞춰야 한다는 제약이 draft 모델의 표현력을 제한해서, 학습 데이터를 [Medusa](#/p/medusa)나 다른 draft 방식처럼 늘려도 가속률이 거의 늘지 않았다. LLaMA 계열이 1T→2T→15T 토큰으로 학습 데이터를 늘려 성능을 키운 것과 대조적으로, EAGLE류 draft 모델은 데이터 스케일링의 혜택을 받지 못하고 있었다.',

ideas:[
 {h:'feature 예측을 버리고 토큰을 직접 예측한다',
  lead:'draft 모델이 목표 모델의 feature를 흉내내야 한다는 제약을 없애 표현력을 풀어준다.',
  d:'EAGLE은 $l_{fea}$ 로 draft 모델의 출력이 목표 모델의 실제 feature $f_{t+1}$ 에 가깝도록 강제한다. 이 제약을 없애면 draft 모델의 1단계 출력은 여전히 부정확하지만, **애초에 특정 feature를 맞추도록 강요받지 않으므로** 학습 데이터가 늘어날수록 자유롭게 개선될 여지가 생긴다. 다만 이렇게만 하면 2단계 이후 draft 모델 자신의 부정확한 출력이 입력으로 들어가면서 학습 분포에서 벗어나 수용률이 급락하는 새 문제가 생긴다.'},
 {h:'Training-Time Test: 추론 시의 다단계 입력을 학습 때 미리 재현한다',
  lead:'학습 중에 draft 모델 자신의 이전 스텝 출력을 다음 스텝 입력으로 먹여 추론 시 분포 차이를 없앤다.',
  d:'추론 시 draft 모델의 2단계 입력에는 1단계의 (부정확한) 자기 출력 $\\hat{a}_{t+1}$ 이 섞여 들어간다. 이 분포가 학습 때는 없었으므로 수용률이 떨어졌다. Training-Time Test는 학습 과정에서도 같은 방식으로 draft 모델의 출력을 다음 스텝 입력에 피드백해, **학습 분포와 추론 분포를 일치**시킨다. 이름 그대로 테스트(추론) 시의 절차를 학습 시점에 미리 시험해 두는 것이다.'},
 {h:'저·중·고층 feature를 하나로 융합한다',
  lead:'목표 모델의 여러 층 feature를 concat 후 FC로 합쳐 다음 다음 토큰 예측에 필요한 정보를 넓힌다.',
  d:'feature 예측 손실이 사라지면 draft 모델의 입력을 최상위층 feature로 한정할 이유도 사라진다. EAGLE-3는 목표 모델의 저(low)·중(mid)·고(high)층 feature $l,m,h$ 를 이어붙여 $3k$ 차원 벡터를 만들고, FC 레이어로 $k$ 차원 feature $g$ 로 압축한다. 최상위층 feature는 원래 다음 토큰 하나만을 위한 정보인데, draft 모델은 다음-다음 토큰까지 예측해야 하므로 여러 층의 의미 정보가 더 풍부한 단서가 된다.'},
 {h:'EAGLE-2의 동적 draft 트리와 그대로 호환된다',
  lead:'구조 변경은 draft 모델 내부에 국한돼 있어 트리형 draft·검증 파이프라인을 그대로 재사용한다.',
  d:'변경 지점은 draft 모델의 입력 구성과 학습 방식뿐이라, [EAGLE-2](#/p/eagle)의 컨텍스트 인식 동적 draft 트리와 tree attention 검증을 그대로 이어받는다. self-attention을 제외한 나머지 구성 요소는 학습·추론 과정에서 추가 수정이 필요 없다.'}
],

diagram:{type:'compare', cap:'EAGLE과 EAGLE-3의 draft 모델 설계 차이.',
 left:{t:'EAGLE / EAGLE-2', items:[
  '최상위층 feature만 입력',
  'feature 예측 손실 l_fea 사용',
  '데이터를 늘려도 가속 정체',
  '자기 출력 피드백 시 수용률 급락']},
 right:{t:'EAGLE-3', items:[
  '저·중·고층 feature 융합',
  'l_fea 제거, 토큰 직접 예측',
  'Training-Time Test로 분포 일치',
  '데이터 늘수록 가속률도 증가']}},

math:[
 {expr:'accept(t̂) = min(1, p(t̂) / p̂(t̂))',
  tex:'\\text{accept}(\\hat{t}) = \\min\\!\\left(1, \\frac{p(\\hat{t})}{\\hat{p}(\\hat{t})}\\right)',
  d:'표준 추측 디코딩의 수용 확률. EAGLE-3도 이 엄격한 조건을 그대로 쓰므로 목표 모델의 출력 분포를 바꾸지 않는 무손실(lossless) 가속이다.'}
],

numbers:[
 {k:'가속률 (온도 0, 5개 과제 평균)', v:'3.0×~6.5×', d:'Vicuna-13B·LLaMA-Instruct 3.1 8B/3.3 70B·DeepSeek-R1-Distill-8B, MT-bench·HumanEval·GSM8K·Alpaca·CNN/DM'},
 {k:'EAGLE-2 대비 개선', v:'약 20~40%', d:'같은 조건(온도 0)에서 모델·과제별 평균'},
 {k:'HumanEval 최대 가속', v:'6.47× (Vicuna-13B)', d:'평균 수용 길이 7.54, 코드 생성은 고정 템플릿이 많아 draft가 쉬움'},
 {k:'SGLang 배치 64 처리량', v:'EAGLE-3 1.38× vs EAGLE-2 0.99×', d:'H100 1장, LLaMA-Instruct 3.1 8B, MT-bench. 배치가 커질수록 EAGLE-2는 오히려 처리량이 떨어지지만 EAGLE-3는 유지'},
 {k:'배치=1 처리량 (H100, SGLang)', v:'373.25 tok/s (EAGLE-3) vs 244.10 (EAGLE-2) vs 158.34 (베이스라인)', d:'LLaMA-Instruct 3.1 8B, MT-bench'},
 {k:'ablation: 융합 feature 추가 효과', v:'MT-bench 3.82× → 4.40×', d:'LLaMA-Instruct 3.1 8B. feature 제약 제거만으로 3.16×→3.82×, 다층 융합 추가로 4.40×까지'}
],

figures:[
 {f:'fig5-pipeline.png',
  cap:'draft 모델의 3단계 파이프라인. ①에서 목표 모델의 저·중·고층 feature(l,m,h)를 FC로 합쳐 g를 만들고, ②·③에서는 draft 모델 자신의 이전 출력(a)과 새 토큰 임베딩(e)을 이어붙여 다음 draft를 생성한다 — 빨간 점선 위쪽이 draft 모델만으로 진행되는 자기회귀 구간.',
  src:'원문 Figure 5, p.4'}
],

impact:'추측 디코딩에서 "draft 모델도 스케일링 법칙을 따른다"는 것을 처음 보였다. 이전까지 EAGLE류 방법은 학습 데이터를 늘려도 가속률이 정체돼, 목표 모델처럼 데이터를 투입해 개선하는 길이 막혀 있었다. feature 예측이라는 인위적 제약이 병목이었음을 짚어내고 제거함으로써, draft 모델 학습도 "데이터를 더 넣으면 더 좋아진다"는 익숙한 스케일링 레시피 안으로 들어왔다. 배치 크기가 커져도 [vLLM](#/p/vllm)·[SGLang](#/p/sglang) 같은 프로덕션 서빙 프레임워크에서 처리량 이득이 유지된다는 실측도, 추측 디코딩이 지연 시간뿐 아니라 처리량에도 쓸 수 있다는 증거를 보탰다.',

legacy:[
 '**Training-Time Test 패턴의 확산** — 학습·추론 분포 불일치를 학습 시점에 미리 시뮬레이션하는 아이디어가 이후 draft 모델 설계의 표준 기법으로 언급됨',
 '**SGLang·vLLM 프로덕션 통합** — 논문 자체가 SGLang·vLLM 팀과 협업해 실제 서빙 프레임워크에서 배치별 처리량을 측정한 드문 사례',
 '**multi-token prediction과의 상호 영향** — EAGLE의 아이디어가 [DeepSeek-V3](#/p/deepseek-v3)의 multi-token prediction에 영향을 줬고, 그것이 다시 EAGLE-3의 다층 feature 융합 설계에 영향을 준 상호 순환 관계'
],

pitfalls:[
 '**가속률은 배치 크기·온도·과제에 강하게 의존한다.** 3.0~6.5×는 온도 0 조건의 5개 과제 평균 범위이고, 온도 1이나 큰 배치에서는 배수가 줄어든다(SGLang 배치 64에서 1.38×). 조건을 떼고 "6.5배 빠르다"고만 인용하면 과장이다.',
 '**무손실이지만 EAGLE-2 대비 이득은 과제 의존적이다.** 코드 생성처럼 템플릿이 고정된 과제에서 최대 수용 길이가 나오고, CNN/DM 같은 요약 과제에서는 개선폭이 상대적으로 작다.',
 '**대형 배치에서 EAGLE-2는 오히려 손해를 볼 수 있다** (Table 3에서 배치 24 이상에서 1.0× 미만). EAGLE-3가 이 문제를 완화하긴 하지만, 추측 디코딩 일반이 "배치가 커지면 이득이 준다"는 근본 트레이드오프에서 자유롭지 않다.'
],

links:[
 {t:'arXiv 2503.01840 — EAGLE-3: Scaling up Inference Acceleration via Training-Time Test', u:'https://arxiv.org/abs/2503.01840'},
 {t:'SafeAILab/EAGLE (GitHub)', u:'https://github.com/SafeAILab/EAGLE'}
]
});
