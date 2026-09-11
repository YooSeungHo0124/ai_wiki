WIKI.paper({
slug:'simpo',
venue:'NeurIPS 2024',
authors:'Meng, Xia, Chen (U. Virginia · Princeton PLI)',
arxiv:'2405.14734',

tldr:'[DPO](#/p/dpo)의 암묵적 보상을 **참조 모델 없이, 길이로 정규화한 평균 로그확률**로 바꾼 선호 최적화 방법. 참조 모델을 없앤 [ORPO](#/p/orpo)보다도 AlpacaEval 2·Arena-Hard에서 크게 앞섰다.',

context:'[DPO](#/p/dpo)는 보상을 정책과 참조 모델의 로그확률 비율로 정의해 별도 보상 모델을 없앴지만, 여전히 **참조 모델 $\\pi_{ref}$ 를 메모리에 올리고 매 스텝 forward를 한 번 더 돌려야** 한다. 더 근본적인 문제는 DPO의 보상이 실제 생성 시 쓰는 지표(평균 로그확률)와 어긋난다는 것이다. 시퀀스 길이로 나누지 않은 로그확률 합을 보상으로 쓰면, 학습 후 검증셋에서 승자 응답의 평균 로그우도가 패자보다 낮은 경우가 오히려 흔하게 관찰된다 — 보상 정의와 생성 정책이 따로 논다. [ORPO](#/p/orpo)도 참조 모델을 없앴지만 odds ratio를 SFT loss에 얹는 방식이라, 이 논문은 애초에 DPO의 Bradley-Terry 틀 안에서 참조 모델만 걷어내는 다른 접근을 취한다.',

ideas:[
 {h:'보상을 정책의 평균 로그확률 자체로 정의',
  lead:'참조 모델과의 비율 대신 정책 하나의 길이-정규화 로그확률을 보상으로 쓴다.',
  d:'DPO의 암묵적 보상 $\\beta\\log\\frac{\\pi_\\theta(y|x)}{\\pi_{ref}(y|x)}$ 에서 $\\pi_{ref}$ 를 아예 제거하고, 응답 $y$ 의 토큰별 로그확률 평균 $\\frac{1}{|y|}\\sum_i \\log\\pi_\\theta(y_i|x,y_{<i})$ 에 $\\beta$ 를 곱한 값을 그대로 보상으로 쓴다. 이 지표는 빔서치·다지선다 채점에 흔히 쓰이는 것과 같은 형태라 **학습 목표와 추론 시 쓰는 지표가 일치**한다. 참조 모델이 없으니 학습 중 forward 연산과 메모리가 절반 가까이 줄어든다.'},
 {h:'길이 정규화가 핵심 — ORPO와 다른 지점',
  lead:'로그확률을 길이로 나누지 않으면 짧은 승자 응답에 불리해 긴 응답을 과대평가하게 된다.',
  d:'토큰별 로그확률의 **합**을 그대로 보상으로 쓰면 긴 시퀀스일수록 값이 작아지는 길이 편향이 생겨, $y_w$ 가 $y_l$ 보다 길 때 모델이 확률을 인위적으로 부풀려 퇴화(degeneration) 위험이 커진다. SimPO는 합이 아니라 **평균**(길이로 나눈 값)을 보상으로 써서 이 편향을 없앤다. `[ORPO](#/p/orpo)`도 참조 모델은 없앴지만 odds ratio를 SFT 목적함수에 보조항으로 더하는 완전히 다른 구조이며, 길이 정규화라는 SimPO의 장치를 쓰지 않는다.'},
 {h:'목표 마진 γ로 승자·패자 보상 차를 강제',
  lead:'Bradley-Terry 확률에 여유 마진 γ를 더해 두 보상의 차이가 일정 값 이상 벌어지게 한다.',
  d:'단순히 $r(y_w) > r(y_l)$ 이 아니라 $r(y_w) - r(y_l) > \\gamma$ 를 요구하도록 시그모이드 안에 $-\\gamma$ 항을 더한다. 마진이 클수록 분류 경계의 일반화가 좋아진다는 통념을 선호 최적화에 옮긴 것으로, 실험적으로 마진을 키우면 처음엔 성능이 오르다 너무 커지면 오히려 나빠지는 최적점이 존재한다. `[IPO](#/p/dpo)` 계열도 비슷한 마진 항을 쓰지만 전체 목적함수 성능은 SimPO에 못 미친다고 보고한다.'},
 {h:'KL 정규화 없이도 파국적 망각을 억제',
  lead:'참조 모델 KL 페널티가 없는데도 실제 학습에서는 KL divergence가 낮게 유지된다.',
  d:'참조 모델이 없으므로 DPO처럼 $\\pi_{ref}$ 로부터의 KL을 명시적으로 억제하는 장치가 없다. 그런데도 SFT 초기화·낮은 학습률·목표 마진 등 실무적 요인들이 겹쳐 SFT 모델로부터의 KL이 낮게 유지되는 것이 관찰된다. 안전장치를 아키텍처가 아니라 결과로 확인한 셈이라, 하이퍼파라미터 선택에 더 민감할 수 있다.'}
],

diagram:{type:'compare', cap:'DPO와 SimPO 모두 Bradley-Terry 시그모이드 손실을 쓰지만 보상을 정의하는 방식이 다르다.',
 left:{t:'DPO', items:['참조 모델 π_ref 필요','로그확률 비율이 보상','길이 정규화 없음']},
 right:{t:'SimPO', items:['참조 모델 없음','길이-평균 로그확률이 보상','목표 마진 γ로 여유 확보']}},

math:[
 {expr:'r_SimPO(x,y) = (β/|y|) Σ log πθ(yi|x,y<i)',
  tex:'r_{\\text{SimPO}}(x,y)=\\frac{\\beta}{|y|}\\log\\pi_\\theta(y|x)=\\frac{\\beta}{|y|}\\sum_{i=1}^{|y|}\\log\\pi_\\theta(y_i\\mid x,y_{<i})',
  d:'참조 모델 없이 정책 자신의 길이-정규화 로그확률만으로 정의한 보상. $\\beta$ 는 보상 크기를 조절하는 상수다.'},
 {expr:'L_SimPO = -E[log σ( (β/|yw|)log πθ(yw|x) - (β/|yl|)log πθ(yl|x) - γ )]',
  tex:'\\mathcal{L}_{\\text{SimPO}}(\\pi_\\theta)=-\\mathbb{E}_{(x,y_w,y_l)\\sim D}\\left[\\log\\sigma\\!\\left(\\frac{\\beta}{|y_w|}\\log\\pi_\\theta(y_w|x)-\\frac{\\beta}{|y_l|}\\log\\pi_\\theta(y_l|x)-\\gamma\\right)\\right]',
  d:'목표 마진 $\\gamma$ 를 Bradley-Terry 시그모이드 안에 넣은 최종 목적함수. DPO 목적함수와 형태는 같지만 보상에 참조 모델이 없다.'}
],

numbers:[
 {k:'AlpacaEval 2 LC 개선폭', v:'최대 +6.4점', d:'DPO 대비 (Mistral/Llama3 4개 설정 평균 기준 논문 Figure 1)'},
 {k:'Arena-Hard 개선폭', v:'최대 +7.5점', d:'DPO 대비, Llama3-8B-Instruct 설정'},
 {k:'Gemma-2-9B-it-SimPO', v:'LC 72.4% · Arena-Hard 59.1%', d:'10B 이하 오픈소스 최고 성능, 응답 길이 1833 토큰'},
 {k:'Chatbot Arena', v:'36위 → 25위', d:'Gemma-2-9B-it 대비, 10B 미만 모델 중 1위 (2024-09-16 기준)'},
 {k:'권장 하이퍼파라미터', v:'β 2.0~2.5, γ 0.5 부근', d:'설정에 따라 최적값이 갈리지만 이 범위가 대체로 안정적'}
],

impact:'참조 모델 제거로 학습 메모리·연산을 크게 줄이면서도 성능이 오히려 올라간다는 것을 보여, 선호 최적화 파이프라인의 기본값을 흔들었다. 이후 오픈소스 정렬 레시피(예: [Tulu 3](#/p/tulu3))에서 SimPO/DPO 계열을 함께 후보로 검토하는 것이 표준이 됐고, "보상을 생성 지표와 일치시킨다"는 아이디어가 이후 목적함수 설계의 공통 점검 항목이 되었다.',

legacy:[
 '**참조 모델 없는 정렬**이 실용적 선택지로 자리잡으며, 이후 정렬 레시피들이 DPO·ORPO·SimPO를 나란히 벤치마크에 올리는 것이 관행이 됨',
 '"학습 보상과 추론 지표의 불일치"라는 진단이 이후 선호 최적화 목적함수 설계에서 공통 점검 항목이 됨',
 '오픈 가중치 모델의 사후학습(post-training) 공개 레시피(예: [Tulu 3](#/p/tulu3))에 기본 옵션으로 채택'
],

pitfalls:[
 '**길이 정규화를 뺀 SimPO는 오히려 해롭다.** 저자들이 직접 ablation으로 확인했듯, 정규화를 제거하면 길지만 품질이 낮은 응답을 선호하는 방향으로 편향된다.',
 '**참조 모델이 없다고 KL이 자동으로 통제되는 것은 아니다.** 논문은 실험적으로 낮은 KL을 관찰했을 뿐, 구조적으로 보장하는 장치는 없다 — 학습률·데이터 품질이 나쁘면 망각이 재발할 수 있다.',
 '**β·γ 최적값은 모델·데이터셋마다 다시 찾아야 한다.** 논문이 제시한 범위는 출발점일 뿐, 그대로 옮기면 성능이 크게 떨어지는 설정이 보고돼 있다.'
],

figures:[
 {f:'fig1-loss-compare.png',
  cap:'위 빨간 박스가 DPO 손실 — π_ref 비율이 두 번 등장한다. 아래 파란 박스가 SimPO 손실 — 참조 모델 항이 전부 사라지고 |y_w|, |y_l|로 나눈 길이-정규화 로그확률과 −γ 마진만 남는다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'The effectiveness of SimPO is attributed to a key design: using the average log probability of a sequence as the implicit reward.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2405.14734 — SimPO', u:'https://arxiv.org/abs/2405.14734'},
 {t:'GitHub — princeton-nlp/SimPO', u:'https://github.com/princeton-nlp/SimPO'}
]
});
