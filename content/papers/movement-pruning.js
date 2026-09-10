WIKI.paper({
slug:'movement-pruning',
venue:'NeurIPS 2020',
authors:'Sanh, Wolf, Rush (Hugging Face)',
arxiv:'2005.07683',

tldr:'가지치기 기준을 "가중치가 얼마나 큰가"(magnitude)에서 "**파인튜닝 중에 0에서 얼마나 멀어지는 방향으로 움직였는가**"(movement)로 바꾼 논문. 고희소성 구간에서 magnitude pruning을 크게 앞선다.',

context:'[Lottery Ticket](#/p/lottery-ticket) 이후 가지치기 연구는 대부분 magnitude pruning — 절댓값이 작은 가중치를 지운다 — 을 기본 전제로 삼았다. 이 전제는 **처음부터 학습하는** 세팅에서 나왔다. 문제는 2020년 NLP의 표준이 이미 [BERT](#/p/bert)식 사전학습 후 파인튜닝으로 바뀌었다는 점이다. 파인튜닝은 사전학습된 가중치를 절댓값 기준으로 크게 흔들지 않는다. 즉 파인튜닝 후 가중치가 작다는 사실이, 그 가중치가 **다운스트림 과제에** 안 쓰인다는 뜻이 아니게 된다. 이 논문은 전이학습 세팅에서 magnitude pruning의 전제 자체가 깨진다는 것을 실증하고, 그 대안을 제시한다.',

ideas:[
 {h:'magnitude pruning은 전이학습에서 근거를 잃는다',
  lead:'가중치 크기는 사전학습 목적함수를 반영할 뿐, 파인튜닝 후 중요도를 보장하지 않는다.',
  d:'magnitude pruning의 논리는 "학습 전체를 거쳐 작아진 가중치는 정말 안 쓰인다"는 것이다. 그러나 파인튜닝에서는 가중치가 사전학습 값 근처에 머문 채 절댓값 기준으로는 거의 움직이지 않는다. 이 경우 가지치기 대상이 **파인튜닝을 시작하기도 전에, 사전학습 값만 보고 사실상 결정**된다. 다운스트림 과제가 실제로 어떤 가중치를 필요로 하는지는 전혀 반영되지 않는다.'},
 {h:'movement: 0에서 멀어지는 방향으로 움직이는 가중치를 남긴다',
  lead:'크기가 아니라 파인튜닝 동안의 이동 방향으로 중요도를 판단한다.',
  d:'절댓값 대신 **중요도 점수 S**를 따로 두고, 파인튜닝과 함께 경사하강법으로 학습시킨다. $\\partial L/\\partial S_{i,j}$ 의 부호는 $W_{i,j}$ 가 0에서 멀어지는 중인지 가까워지는 중인지와 일치하도록 설계돼서, 0으로 수축하는 가중치는 점수가 떨어지고 0에서 멀어지는 가중치는 점수가 올라간다. 결과적으로 파인튜닝이 "이 가중치가 지금 과제에 필요해지고 있다"고 말하는 신호를 그대로 가지치기 기준으로 쓴다.'},
 {h:'Straight-Through Estimator로 마스크를 미분 가능하게 만든다',
  lead:'top-v 마스크 함수의 기울기가 0인 문제를 straight-through로 우회한다.',
  d:'중요도 점수 상위 v%만 남기는 `Topv` 함수는 어디서나 기울기가 0이라 역전파가 안 된다. 이 논문은 순전파에서는 마스크를 그대로 적용하고, 역전파에서는 마스크를 무시한 채 손실의 기울기를 점수 S로 그대로 흘려보낸다. 그 결과 **마스크로 가려진 가중치의 점수도 계속 갱신**되어, 한 번 가지치기된 연결이 다시 살아날 여지가 남는다.'},
 {h:'soft movement pruning: 전역 임계값 + 희소성 정규화',
  lead:'고정 비율 v 대신 임계값 τ와 L0류 정규화 항으로 희소성을 유도한다.',
  d:'(hard) movement pruning은 여전히 "상위 v%"라는 사전 설정 비율을 쓴다. soft 버전은 이를 전역 임계값 $\\tau$ 로 바꾸고 ($M=(S>\\tau)$), 점수 S를 0쪽으로 밀어붙이는 정규화 항 $R(S)$를 손실에 더해 희소성 수준을 학습 과정 자체가 조절하게 한다. 논문에서 이 soft 버전이 모든 실험에서 hard movement pruning보다 우수하다.'}
],

diagram:{type:'compare', cap:'같은 파인튜닝 과정에서 두 방법이 가중치를 보는 방식이 다르다.',
 left:{t:'Magnitude pruning', items:['0th-order · \\|W\\|만 봄','사전학습 값에 사실상 좌우됨','저희소성에서 강함']},
 right:{t:'Movement pruning', items:['1st-order · 이동 방향 S 학습','과제별 파인튜닝 신호 반영','고희소성에서 압도적',]}
},

math:[
 {expr:'S(T) = -αS · Σ_{t<T} (∂L/∂W)^(t) · W^(t)',
  tex:'S_{i,j}^{(T)} = -\\alpha_S \\sum_{t<T} \\Big(\\frac{\\partial L}{\\partial W_{i,j}}\\Big)^{(t)} W_{i,j}^{(t)}',
  d:'중요도 점수 S는 학습 전 기간에 걸친 "기울기 × 가중치"의 누적이다. 즉 S는 가중치가 0에서 멀어지는 방향으로 얼마나 꾸준히 움직였는지를 적분한 값이고, 이것이 magnitude(현재 값 하나)와의 근본적 차이다.'},
 {expr:'∂L/∂S_{i,j} = ∂L/∂a_i · W_{i,j} x_j',
  tex:'\\frac{\\partial L}{\\partial S_{i,j}} = \\frac{\\partial L}{\\partial a_i}\\,W_{i,j}\\,x_j',
  d:'straight-through estimator로 얻는 근사 기울기. `Topv` 연산 자체는 미분 불가능하지만, 역전파에서는 그 연산을 건너뛰고 점수 S에 이 값을 직접 흘려보낸다.'}
],

numbers:[
 {k:'SQuAD F1 · 3% 남김', v:'54.5 → 76.3', d:'magnitude(MaP) 54.5 F1 vs movement(MvP) 76.3 F1, 같은 3% 파라미터'},
 {k:'SQuAD F1 · soft movement', v:'79.9', d:'3% 남김에서 soft movement pruning(SMvP)의 F1, 전체 방법 중 최고'},
 {k:'MNLI acc · 3% 남김', v:'68.9 → 79.0', d:'magnitude 68.9 vs soft movement 79.0'},
 {k:'저희소성 경계', v:'약 70% 이상 남김', d:'이 구간에서는 반대로 magnitude pruning이 더 우수'},
 {k:'파라미터 수', v:'3% = 260만, 10% = 850만', d:'encoder 기준 non-zero 파라미터 수(BERT-base 대비 비율)'},
 {k:'최종 결과', v:'파라미터 3%로 BERT-base 95% 성능', d:'soft movement pruning + distillation 결합 시'}
],

impact:'가지치기를 "학습이 끝난 모델을 사후에 깎는 절차"에서 "**파인튜닝과 함께 학습되는 과정**"으로 바꿨다. 중요도 점수를 별도의 학습 가능한 파라미터로 두고 straight-through estimator로 역전파한다는 설계는 이후 다양한 구조적/비구조적 희소화 기법의 공통 템플릿이 됐다. 또한 magnitude 기준이 전이학습에서 실패하는 이유를 Figure 1의 산점도로 명확히 보여줘, "사전학습-파인튜닝" 패러다임에서는 모델 압축도 과제별 신호를 반영해야 한다는 인식을 굳혔다.',

legacy:[
 '**학습 기반 희소화의 표준 레시피** — 중요도 점수 + straight-through + 임계값 조절이라는 조합이 이후 구조적 pruning·[LoRA](#/p/lora) 등 효율화 연구 전반의 설계 언어가 됨',
 '**압축 파이프라인의 결합** — pruning과 [distillation](#/p/distillation)([DistilBERT](#/p/distilbert) 계열)을 함께 쓰면 단독보다 낫다는 것을 정량적으로 보여, 이후 압축 논문 대부분이 두 기법을 병행',
 '**전이학습 시대의 압축 재정의** — magnitude 기반 전제를 의심하게 만들어, 이후 압축 연구가 "사전학습 통계"가 아니라 "파인튜닝/다운스트림 신호"를 우선 참조하는 방향으로 이동',
 '고희소성(3~10%) 구간을 벤치마크의 기본값으로 정착시켜, 이후 pruning 논문들이 저희소성 결과만 보고하는 관행에서 벗어나게 함'
],

pitfalls:[
 '**저희소성에서는 magnitude pruning이 더 낫다.** 남는 가중치가 70% 이상인 구간에서는 magnitude pruning이 movement pruning보다 우수하다고 논문이 명시한다 — "고희소성에서 movement가 이긴다"를 전 구간의 결론으로 확대하면 안 된다.',
 '**soft movement pruning과 hard movement pruning을 혼동하지 않는다.** 전자는 전역 임계값 τ + 정규화로 희소성을 학습 중 조절하고, 후자는 고정 비율 v의 Topv를 쓴다. 논문 실험에서 soft가 hard보다 항상 우수하다.',
 '**추론 속도 향상을 자동으로 보장하지 않는다.** 이 논문도 지적하듯 당시 하드웨어는 비구조적 희소 행렬의 최적화된 추론을 지원하지 않아서, 같은 크기의 조밀한 소형 모델(mini-BERT)이 실제 지연시간에서는 더 유리할 수 있다.'
],

figures:[
 {f:'fig1-scatter.png',
  cap:'MNLI 파인튜닝 중 각 가중치의 (사전학습 값, 파인튜닝 후 값) 산점도. 검은 대각선이 항등선이고 회색이 가지치기된 가중치. magnitude pruning(왼쪽, 빨강)은 항등선 근처 좁은 띠에서 |값|이 작은 쪽만 골라 사실상 사전학습 값으로 결정되지만, movement pruning(오른쪽, 노랑)은 항등선에서 벗어나 이동한 가중치를 넓게 걸러낸다.',
  src:'원문 Figure 1, p.4'},
 {f:'fig2-curves.png',
  cap:'x축 = 남은 가중치 비율(%), y축 = SQuAD F1 / MNLI acc / QQP F1. 왼쪽으로 갈수록(고희소성) 빨간 선(MaP, magnitude)이 급격히 무너지는 반면 검은 선(RPP)과 자홍/보라 계열(SMvP)은 완만하게 유지된다 — 세 과제 모두 저희소성(오른쪽)에서는 순서가 역전된다.',
  src:'원문 Figure 2, p.6'}
],

quotes:[
 {t:'Magnitude pruning is a widely used strategy for reducing model size in pure supervised learning; however, it is less effective in the transfer learning regime that has become standard for state-of-the-art natural language processing applications.',
  src:'Abstract, p.1'},
 {t:'While magnitude pruning selects the most important weights as the ones which maximize their distance to 0, movement pruning selects the weights which are moving the most away from 0.',
  src:'Section 4, p.4'}
],

links:[
 {t:'arXiv 2005.07683 — Movement Pruning: Adaptive Sparsity by Fine-Tuning', u:'https://arxiv.org/abs/2005.07683'},
 {t:'Hugging Face nn_pruning 구현', u:'https://github.com/huggingface/nn_pruning'}
]
});
