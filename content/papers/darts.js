WIKI.paper({
slug:'darts',
venue:'ICLR 2019',
authors:'Hanxiao Liu, Karen Simonyan, Yiming Yang (CMU · DeepMind)',
arxiv:'1806.09055',

tldr:'강화학습·진화로 이산 구조를 반복 샘플링하던 NAS를, 후보 연산들을 **softmax로 섞어 연속 공간에서 경사 하강**으로 탐색하는 문제로 바꿨다. [ENAS](#/p/enas)의 가중치 공유가 "슈퍼그래프에서 부분그래프를 고른다"였다면, DARTS는 그 선택 자체를 미분 가능하게 만든 것이다.',

context:'[NASNet](#/p/nasnet)의 강화학습 탐색은 2000 GPU-일, 진화 알고리즘 기반 AmoebaNet은 3150 GPU-일이 들었다. [ENAS](#/p/enas)는 가중치 공유로 이를 0.5 GPU-일까지 줄였지만, 컨트롤러가 이산적인 구조를 하나씩 **샘플링**하고 그 보상으로 REINFORCE 그레이디언트를 추정하는 것은 여전했다 — 분산이 크고 비효율적인 추정 방식이다. 이 논문은 질문을 다시 바꾼다. 애초에 "이산적인 연산 선택"을 유지할 이유가 있는가? 후보 연산들의 **가중 평균**으로 탐색 공간을 연속화하면, 구조 자체를 경사 하강으로 직접 최적화할 수 있지 않을까?',

ideas:[
 {h:'연속 완화: 후보 연산을 softmax로 섞는다',
  lead:'두 노드 사이 간선에 연산 하나를 고정하는 대신, 모든 후보 연산의 softmax 가중합을 놓는다.',
  d:'노드 $i,j$ 사이 간선에서, 컨볼루션·풀링·zero(연결 없음) 등 후보 연산 집합 $\\mathcal{O}$ 전부를 $\\bar o^{(i,j)}(x)=\\sum_{o\\in\\mathcal{O}} \\frac{\\exp(\\alpha_o^{(i,j)})}{\\sum_{o\'}\\exp(\\alpha_{o\'}^{(i,j)})}o(x)$ 로 섞는다. 탐색 대상이 이제 이산적인 연산 선택이 아니라 **연속 벡터** $\\alpha$ 가 되어, 이 자체를 경사 하강으로 학습할 수 있다. 탐색이 끝나면 각 간선에서 $\\alpha$ 가 가장 큰 연산 하나만 남겨 이산 구조로 되돌린다.'},
 {h:'이중 최적화: 구조 α와 가중치 w를 서로 다른 데이터로 번갈아 학습',
  lead:'구조 α는 검증 손실을, 가중치 w는 학습 손실을 최소화하도록 두 손실을 겹쳐 최적화한다.',
  d:'목표는 학습 손실을 최소화하는 가중치 $w^*(\\alpha)$ 아래에서 검증 손실을 최소화하는 $\\alpha^*$ 를 찾는 것 — $\\min_\\alpha \\mathcal{L}_{val}(w^*(\\alpha),\\alpha)$, 단 $w^*(\\alpha)=\\arg\\min_w \\mathcal{L}_{train}(w,\\alpha)$. 이 이중(bilevel) 최적화는 $w$ 를 수렴까지 완전히 풀고 나서 $\\alpha$ 를 갱신하면 계산량이 감당 안 되므로, 실제로는 $w$ 를 한 스텝만 갱신한 근사값으로 $\\alpha$ 의 그레이디언트를 추정한다.'},
 {h:'1차 근사 vs 2차 근사: 정확도와 속도의 트레이드오프',
  lead:'내부 스텝을 완전히 생략(1차)하면 빠르지만 부정확하고, 한 스텝만 밟아 근사(2차)하면 느리지만 더 정확하다.',
  d:'내부 최적화 스텝 크기 $\\xi=0$ 이면 $\\nabla_\\alpha \\mathcal{L}_{val}(w,\\alpha)$ 로 단순화되는 **1차 근사**가 되고, $\\xi>0$ 이면 $w$ 를 한 스텝 미리 갱신한 지점에서 $\\alpha$ 를 미분하는 **2차 근사**가 된다. 2차 근사는 유한차분으로 헤시안-벡터곱을 근사해 계산 복잡도를 $O(|\\alpha||w|)$ 에서 $O(|\\alpha|+|w|)$ 로 낮춘다. CIFAR-10에서 1차 근사는 3.00%, 2차 근사는 2.76% 오류율로, 2차가 더 낫지만 탐색 비용도 1.5 GPU-일에서 4 GPU-일로 늘어난다.'},
 {h:'탐색은 작은 대리 네트워크에서, 평가는 큰 네트워크로 전이',
  lead:'8개 셀짜리 작은 네트워크에서 구조를 찾고, 그 셀을 20개로 늘려 쌓은 네트워크를 처음부터 다시 학습시켜 평가한다.',
  d:'[NASNet](#/p/nasnet)·[ENAS](#/p/enas)처럼 DARTS도 작은 프록시 네트워크에서 셀을 탐색한 뒤 더 깊게 쌓아 최종 평가한다. 탐색 자체는 CIFAR-10에서 하루 안팎(1.5~4 GPU-일)이면 끝나지만, 최종 선택(1 GPU-일)과 처음부터 재학습(CIFAR 1.5 GPU-일, PTB 3 GPU-일)은 이 비용에 포함되지 않는다는 것을 저자들이 표에 각주로 명시한다.'}
],

diagram:{type:'flow', cap:'각 간선에 후보 연산을 softmax로 섞어두고, 검증 손실로 α를 경사 하강시킨 뒤 가장 큰 연산만 남겨 이산 구조로 되돌린다.',
 nodes:[
  {t:'간선마다 후보 연산 나열', s:'conv·pool·zero 등'},
  {t:'softmax 가중 혼합', s:'α로 파라미터화', acc:true},
  {t:'이중 최적화', s:'α↔w 번갈아 경사 하강'},
  {t:'최대 가중치 연산 선택', s:'argmax α'},
  {t:'큰 네트워크로 재학습', s:'셀 반복 수 늘림'}
 ]},

math:[
 {expr:'ō(i,j)(x) = Σ_o softmax(α_o^(i,j)) · o(x)',
  tex:'\\bar o^{(i,j)}(x)=\\sum_{o\\in\\mathcal{O}} \\frac{\\exp(\\alpha_o^{(i,j)})}{\\sum_{o\'\\in\\mathcal{O}}\\exp(\\alpha_{o\'}^{(i,j)})}\\,o(x)',
  d:'간선 $(i,j)$ 위의 혼합 연산. 이산적인 연산 선택을 연속적인 softmax 가중합으로 완화한 것이 DARTS의 핵심 트릭이다.'},
 {expr:'min_α L_val(w*(α), α)  s.t.  w*(α) = argmin_w L_train(w, α)',
  tex:'\\min_{\\alpha}\\; \\mathcal{L}_{val}(w^{*}(\\alpha),\\alpha)\\quad\\text{s.t.}\\quad w^{*}(\\alpha)=\\arg\\min_{w}\\mathcal{L}_{train}(w,\\alpha)',
  d:'구조 $\\alpha$ 를 상위 변수, 가중치 $w$ 를 하위 변수로 둔 이중 최적화. 실제로는 $w^*(\\alpha)$ 를 완전히 풀지 않고, 한 스텝 경사 하강으로 근사한 $w\'=w-\\xi\\nabla_w \\mathcal{L}_{train}(w,\\alpha)$ 지점에서 $\\alpha$ 그레이디언트를 계산한다.'}
],

numbers:[
 {k:'CIFAR-10 탐색 비용(1차/2차)', v:'1.5 / 4 GPU-일', d:'NASNet 2000 GPU-일·AmoebaNet 3150 GPU-일 대비 수백~수천 배 절감'},
 {k:'CIFAR-10 test error(1차/2차)', v:'3.00% / 2.76%', d:'모두 +cutout. NASNet-A+cutout 2.65%에 근접'},
 {k:'PTB 탐색 비용', v:'약 0.5 GPU-일', d:'ENAS와 비슷한 수준, NAS(Zoph & Le)보다 크게 빠름'},
 {k:'파라미터 수(CIFAR 최종)', v:'3.3M', d:'NASNet-A(3.3M)와 동급 규모에서 비교'},
 {k:'선택·재학습 비용(표에서 별도 명시)', v:'선택 1 GPU-일 + 재학습 1.5 GPU-일(CIFAR)', d:'탐색 비용 수치에는 포함되지 않음 — 원문이 각주로 명시'},
 {k:'복잡도 개선(2차 근사)', v:'O(|α||w|) → O(|α|+|w|)', d:'유한차분으로 헤시안-벡터곱 근사'}
],

impact:'탐색을 "이산 공간에서의 시행착오"에서 "연속 공간에서의 경사 하강"으로 바꿔, NAS 탐색 비용을 GPU-일 단위(1.5~4일)까지 끌어내렸다 — NASNet 대비 수백 배, 강화학습·진화 기반 NAS 전반과 비교해도 자릿수가 다른 절감이다. 동시에 이 단순함이 부메랑이 됐다 — 연산 선택이 완전히 미분 가능해지자, 학습이 길어질수록 **파라미터가 없는 skip-connect 연산에 α가 쏠려 성능이 오히려 떨어지는 붕괴 현상**이 후속 연구들에서 반복적으로 보고됐고, 탐색 결과의 실행 간 변동성(재현성) 문제도 함께 지적됐다.',

legacy:[
 '**gradient-based NAS 계열의 시작** — 이후 셀 탐색뿐 아니라 채널 수·연산 폭까지 연속 완화해 탐색하는 후속 연구들이 DARTS의 softmax 완화 틀을 그대로 확장',
 '**성능 붕괴 문제의 발견과 안정화 연구 촉발** — skip-connect 지배 현상이 알려지면서, 탐색 초기 조기 종료·정규화·2차 미분 대체 등으로 안정성을 개선하려는 여러 후속 논문(P-DARTS, PC-DARTS 등)이 이어짐',
 '**재현성 검증 문화 형성** — 무작위 시드에 따라 발견 구조 성능이 크게 흔들린다는 지적이 NAS 논문 전반에 여러 시드 반복 실험·통계적 유의성 보고를 요구하는 관행을 남김',
 '**다목적 탐색으로의 확장** — 정확도만 최적화하는 한계는 지연시간을 직접 목적함수에 넣는 [MnasNet](#/p/mnasnet) 계열과는 다른 방향에서, 이후 하드웨어 인지형 gradient NAS 연구로 이어짐'
],

pitfalls:[
 '**"DARTS는 항상 안정적으로 좋은 구조를 찾는다"는 사실이 아니다.** 연속 완화 자체가 탐색을 길게 돌릴수록 파라미터 없는 skip-connect가 지배적으로 선택되며 성능이 오히려 악화되는 붕괴 현상이 후속 연구들에서 반복 보고됐다 — 원 논문이 보고한 수치는 특정 조기 종료 시점의 결과다.',
 '**탐색 비용(1.5~4 GPU-일)에는 최종 구조 선택과 재학습 비용이 빠져 있다.** 원문이 표 각주에서 명시하듯 총 비용은 "탐색 + 선택(1일) + 재학습(1.5~3일)"이며, 탐색 수치만 인용하면 실제 총 비용을 과소평가하게 된다.',
 '**이중 최적화의 근사(1차/2차)는 완전한 해가 아니다.** 특히 1차 근사는 $w$ 가 이미 최적이라고 가정하는 단순화이며, 논문 스스로 이 가정이 성능을 떨어뜨린다는 것을 실험으로 보인다 — "미분 가능하다"는 말이 "정확한 그레이디언트"를 뜻하지 않는다.'
],

figures:[
 {f:'fig1-relaxation.png',
  cap:'(a) 노드 사이 어떤 연산이 쓰일지 처음엔 미지수(물음표). (b) 각 간선에 색깔별 후보 연산 전부를 겹쳐 놓아 연속 완화. (c) 이중 최적화로 α와 가중치를 함께 학습하며 선을 굵게(가중치 높게) 만든다. (d) 최종적으로 간선마다 가장 굵은 선(최대 α) 하나만 남겨 이산 구조를 얻는다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'Our algorithm excels in discovering high-performance convolutional architectures for image classification and recurrent architectures for language modeling, while being orders of magnitude faster than state-of-the-art non-differentiable techniques.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 1806.09055 — DARTS: Differentiable Architecture Search', u:'https://arxiv.org/abs/1806.09055'}
]
});
