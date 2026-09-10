WIKI.paper({
slug:'kto',
venue:'ICML 2024',
authors:'Ethayarajh et al. (Stanford · Contextual AI)',
arxiv:'2402.01306',

tldr:'"A가 B보다 낫다"는 **쌍 비교 선호 데이터** 없이, 응답 하나하나에 대한 **좋다/나쁘다 이진 신호만으로** [DPO](#/p/dpo) 수준의 정렬을 이끌어내는 방법. Kahneman·Tversky의 전망 이론에서 가져온 손실 회피(loss aversion) 개념을 목적함수에 직접 심어 이름을 지었다.',

context:'[DPO](#/p/dpo)는 RL 없이 선호 쌍 $y_w \\succ y_l$ 로부터 바로 정책을 학습해 RLHF의 복잡한 파이프라인을 크게 단순화했다. 하지만 실무의 현실은 다르다 — 실제로 모을 수 있는 피드백은 "이 응답이 A보다 낫다"가 아니라 **"이 응답은 괜찮다/별로다"** 같은 단순 이진 신호(👍/👎, 별점 위/아래)인 경우가 훨씬 많고, 쌍을 짓는 데는 추가 비용이 든다. 저자들은 한발 더 나아가, DPO를 포함한 기존 정렬 목적함수들이 왜 잘 작동하는지를 **전망 이론의 인간 편향**(손실 회피 등)을 체계화한 인간 인지 손실 함수(HALO, human-aware loss) 관점에서 재해석한다.',

ideas:[
 {h:'HALO: 정렬 손실함수를 인간 가치함수로 재해석한다',
  lead:'DPO·PPO-Clip이 암묵적으로 전망 이론의 손실 회피·오목함을 닮은 가치함수를 내포한다는 것을 보인다.',
  d:'전망 이론은 사람이 결과를 기준점(reference point) 대비 이득/손실로 지각하며, **손실을 이득보다 훨씬 크게 느낀다**(loss aversion)고 말한다. 저자들은 DPO·PPO-Clip의 손실을 "함의된 가치함수"로 역산해 그려보면, 실제로 이 손실 회피와 이득 구간의 오목함(concavity)을 공유한다는 것을 보인다. 이런 성질을 가진 손실 계열을 HALO로 정의한다.'},
 {h:'Kahneman-Tversky 가치함수를 직접 손실로 쓴다',
  lead:'선호의 로그가능도 대신, 각 응답의 효용을 전망 이론 가치함수로 직접 최대화한다.',
  d:'DPO는 $y_w \\succ y_l$ 로그가능도를 최대화하지만, KTO는 응답 하나마다 "바람직한지 아닌지"만 보고 그 효용을 최대화한다. 기준점은 하나의 비선호 응답이 아니라 **정책과 참조 모델 사이 KL 발산 전체**로 잡아, 사람이 특정 대안이 아니라 가능한 모든 출력에 비추어 판단한다는 가정을 반영한다.'},
 {h:'좋다/나쁘다 비율 불균형은 하이퍼파라미터로 보정한다',
  lead:'바람직한 예와 아닌 예의 개수 차이를 $\\lambda_D, \\lambda_U$ 가중치로 흡수한다.',
  d:'실무 데이터는 보통 좋다·나쁘다 비율이 한쪽으로 치우친다. KTO는 손실 회피 계수를 바람직한 쪽 $\\lambda_D$ 와 바람직하지 않은 쪽 $\\lambda_U$ 로 분리해, 예를 들어 부정 예가 10배 많으면 $\\lambda_U=1, \\lambda_D\\in[10,15]$ 로 맞추는 식으로 클래스 불균형을 직접 통제한다.'},
 {h:'쌍이 필요 없다 — one-y-per-x로도 학습된다',
  lead:'선호 쌍에서 하나만 남기고 짝을 끊어도 DPO에 준하는 성능이 유지된다.',
  d:'KTO 데이터가 자연스럽게 비쌍(unpaired)이라는 것을 보이기 위해, Llama-7B 실험에서 바람직한 예의 90%를 무작위로 버려 원래 쌍 관계를 완전히 깨뜨렸다. 그래도 하이퍼파라미터만 재조정하면 성능이 크게 떨어지지 않았고, Mistral-7B에서도 응답 하나만 쓰는 one-y-per-x 설정이 DPO와 견줄 만한 결과를 냈다.'}
],

diagram:{type:'compare', cap:'DPO는 쌍 하나를 비교하는 로그가능도 비율을 최적화하고, KTO는 응답 각각의 효용을 전망 이론 가치함수로 직접 최적화한다.',
 left:{t:'DPO', items:['쌍(y_w, y_l) 필요','비선호 응답 하나가 기준점','로그가능도 비율 최대화']},
 right:{t:'KTO', items:['바람직/아님 이진 신호만','KL 발산 전체가 기준점','손실 회피 가치함수 최대화','$\\lambda_D,\\lambda_U$로 불균형 보정'],}
},

math:[
 {expr:'L_KTO(πθ, πref) = E[λ_y − v(x,y)]',
  tex:'L_{KTO}(\\pi_\\theta,\\pi_{ref}) = \\mathbb{E}_{x,y\\sim D}\\left[\\lambda_y - v(x,y)\\right]',
  d:'KTO의 전체 손실. $\\lambda_y$ 는 $y$ 가 바람직하면 $\\lambda_D$, 아니면 $\\lambda_U$ 를 쓴다. $v(x,y)$ 가 실제 전망 이론식 가치함수다.'},
 {expr:'v(x,y) = λ_D·σ(β(r_θ(x,y) − z0))  [바람직] 또는 λ_U·σ(β(z0 − r_θ(x,y)))  [아님]',
  tex:'v(x,y)=\\begin{cases}\\lambda_D\\,\\sigma\\!\\big(\\beta(r_\\theta(x,y)-z_0)\\big) & y\\sim y_{desirable}\\mid x\\\\ \\lambda_U\\,\\sigma\\!\\big(\\beta(z_0-r_\\theta(x,y))\\big) & y\\sim y_{undesirable}\\mid x\\end{cases}',
  d:'$r_\\theta(x,y)=\\log\\frac{\\pi_\\theta(y|x)}{\\pi_{ref}(y|x)}$ 는 DPO의 암묵적 보상과 같은 형태다. $z_0$ 는 기준점으로, 정책과 참조 모델 사이 KL 발산의 (마이크로배치 내에서 근사한) 값을 쓴다. $\\beta$ 는 위험 회피 정도를 조절하며 DPO의 $\\beta$ 처럼 $\\pi_\\theta$ 가 $\\pi_{ref}$ 에서 얼마나 벗어날 수 있는지를 제어한다.'}
],

numbers:[
 {k:'모델 규모', v:'1B ~ 30B', d:'Pythia·Llama 계열에서 스케일을 바꿔가며 검증'},
 {k:'HALO 유의 우위', v:'13B 이상에서 p<0.05', d:'7B 이하에서는 정렬이 SFT 대비 거의 이득이 없었음'},
 {k:'바람직 데이터 90% 삭제', v:'여전히 정렬 유지', d:'Llama-7B, 쌍 관계를 완전히 끊어도 하이퍼파라미터 재조정으로 커버'},
 {k:'Mistral-7B AlpacaEval winrate', v:'KTO(전체 y) 0.652 · DPO 0.600', d:'OpenAssistant 데이터, unaligned 기준 0.525'},
 {k:'평가자', v:'GPT-4-0613', d:'사람 판단과의 일치를 부록에서 별도 검증'}
],

impact:'DPO 이후 "선호 쌍이 있어야 정렬할 수 있다"는 암묵적 전제를 깨고, **이진 피드백만으로도 동급 성능**을 낼 수 있음을 보였다. 실무에서 쌍 데이터를 인위적으로 구성할 필요 없이 이미 쌓여 있는 좋아요/싫어요 로그를 바로 정렬에 쓸 수 있는 길을 열었다. 동시에 HALO라는 틀로 DPO·PPO 등 기존 방법들의 성공 요인을 전망 이론이라는 공통 언어로 설명해, 이후 정렬 손실 설계를 "어떤 인간 편향을 인코딩할 것인가"의 문제로 재구성했다.',

legacy:[
 '**비쌍 데이터 기반 정렬의 표준 참조점**이 되어, 이후 실무 파이프라인에서 별점·리액션 로그를 직접 정렬에 쓰는 사례들의 근거로 인용됨',
 '**[ORPO](#/p/orpo)** 등 참조 모델 없는 단일 단계 정렬 방법들과 함께 "DPO의 비용 구조를 하나씩 걷어내는" 흐름을 이룸',
 'HALO 프레임은 이후 정렬 손실을 설계할 때 "어떤 인지 편향을 반영하는가"를 명시적으로 따지는 관점을 남김',
 '$\\lambda_D, \\lambda_U$ 로 클래스 불균형을 다루는 방식은 이진 피드백 기반 후속 정렬 기법들의 실무 레시피로 자리잡음'
],

pitfalls:[
 '**"KTO가 항상 DPO보다 낫다"가 아니다.** 저자들이 명시하듯 7B 이하 규모에서는 정렬 자체가 SFT 대비 거의 이득이 없고, HALO 계열의 우위가 통계적으로 유의한 것은 13B 이상부터다.',
 '**KTO 데이터도 결국 선호 쌍을 쪼개 만든 것이다.** 이 논문의 주 실험은 HH·SHP·OASST 같은 기존 선호 데이터셋에서 $y_w$ 를 바람직함, $y_l$ 을 바람직하지 않음으로 **가정**해 변환한 것이며, 저자들 스스로 이를 "단순화를 위한 순진한 가정"이라 부른다. 진짜 독립적인 이진 피드백에서의 결과는 별도 확인이 필요하다.',
 '$z_0$ (KL 기준점) 추정은 마이크로배치 내 응답을 뒤섞어 근사하는 편향된 방식이라, 배치 구성이나 배치 크기에 따라 학습 안정성이 달라질 수 있다.'
],

figures:[
 {f:'fig1-value-function.png',
  cap:'가로축은 이득/손실, 세로축은 함의된 효용. DPO(파란선)·PPO-Clip(노란선)이 그리는 곡선이 전망 이론의 표준 가치함수(빨간 점선)처럼 손실 쪽에서 더 가파르고(loss aversion) 이득 쪽에서 오목(concavity)하다는 것을 보여준다.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'We call this approach KTO, and it matches or exceeds the performance of preference-based methods at scales from 1B to 30B, despite only learning from a binary signal of whether an output is desirable.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2402.01306 — KTO: Model Alignment as Prospect Theoretic Optimization', u:'https://arxiv.org/abs/2402.01306'},
 {t:'Tversky & Kahneman (1992), Prospect Theory', u:'https://link.springer.com/article/10.1007/BF00122574'}
]
});
