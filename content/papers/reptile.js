WIKI.paper({
slug:'reptile',
venue:'arXiv (OpenAI, 2018)',
authors:'Alex Nichol, Joshua Achiam, John Schulman (OpenAI)',
arxiv:'1803.02999',

tldr:'[MAML](#/p/maml)의 2차 미분을 완전히 없앤 1차 메타 학습 알고리즘. 과제마다 몇 스텝 SGD를 돌린 뒤 파라미터를 **그 방향으로 그냥 이동**시키는 것이 전부지만, 테일러 전개로 분석하면 단순한 "여러 과제로 학습(joint training)"과는 다른 항을 최적화한다는 것을 보인다.',

context:'[MAML](#/p/maml)은 내부 루프 적응이 외부 루프 손실을 통과하기 때문에 2차 미분(Hessian-vector product)이 필요했고, 논문 스스로도 1차 근사(FOMAML)가 거의 같은 성능을 낸다는 것을 보여줬다. 그렇다면 질문은 자연스럽다 — 2차 미분을 아예 설계에서 빼면 어떻게 되는가? 그리고 더 근본적으로, 그런 1차 알고리즘이 단순히 **여러 과제의 손실 평균을 최소화하는 것(joint training)** 과 대체 무엇이 다른가? 이 논문은 알고리즘 자체는 극도로 단순하게 제시하면서, 그 질문에 대한 답을 테일러 전개 분석으로 준다.',

ideas:[
 {h:'Reptile: k스텝 SGD 후 파라미터를 그 방향으로 이동',
  lead:'과제 하나에 대해 k번 SGD를 밟아 얻은 파라미터 φ̃를 향해 초기값 φ를 조금 옮긴다.',
  d:'매 반복에서 과제 $\\tau$ 를 샘플링해 $\\tilde{\\phi}=U_\\tau^k(\\phi)$(k번의 SGD 또는 Adam 갱신)를 계산한 뒤, $\\phi \\leftarrow \\phi + \\epsilon(\\tilde{\\phi}-\\phi)$ 로 초기값을 갱신한다. [MAML](#/p/maml)처럼 지지집합·쿼리집합을 나누지도 않고, 메타 그레이디언트를 위한 별도의 역전파도 없다 — $(\\tilde{\\phi}-\\phi)$ 자체를 그레이디언트처럼 취급해 Adam 같은 옵티마이저에 그냥 넣는다.'},
 {h:'k=1이면 정확히 joint training이지만, k>1이면 아니다',
  lead:'한 스텝만 밟으면 기대손실의 그레이디언트와 같아지지만, 여러 스텝을 밟으면 2차 이상의 항이 섞여 든다.',
  d:'$k=1$ 일 때 Reptile의 기대 갱신은 $\\mathbb{E}_\\tau[\\nabla_\\phi \\mathcal{L}_\\tau(\\phi)]$, 즉 과제 전체의 평균 손실에 대한 순수 SGD와 같다. 그러나 $k>1$ 이면 $\\mathbb{E}_\\tau[U_\\tau^k(\\phi)]$ 는 더 이상 이 평균 손실의 그레이디언트가 아니다 — 테일러 전개에서 손실의 2차 미분(Hessian)에서 나오는 항이 섞이기 때문이다. 이것이 "Reptile은 단순히 여러 과제로 학습하는 것과 같다"는 오해를 논문이 정면으로 반박하는 지점이다.'},
 {h:'테일러 전개: AvgGrad와 AvgGradInner로 분해',
  lead:'메타 그레이디언트를 전개하면 평균 손실을 낮추는 항(AvgGrad)과, 같은 과제의 서로 다른 미니배치 그레이디언트 내적을 키우는 항(AvgGradInner)으로 갈라진다.',
  d:'같은 과제에서 뽑은 두 미니배치의 손실을 $L_1,L_2$ 라 하면, MAML·FOMAML·Reptile의 기대 그레이디언트는 모두 $\\text{AvgGrad}=\\mathbb{E}[\\bar g_1]$ 항과 $\\text{AvgGradInner}=\\mathbb{E}[\\bar H_2\\bar g_1]$ 항의 선형결합으로 근사된다. $-\\text{AvgGradInner}$ 방향은 서로 다른 미니배치 그레이디언트의 내적을 키우는 방향, 즉 **한 배치에서 밟은 스텝이 다른 배치의 성능도 같이 올리게 만드는** 방향이다. 이것이 곧 빠른 적응(일반화) 능력의 원천이며, Reptile이 joint training과 구별되는 이유다.'},
 {h:'세 알고리즘은 같은 두 항의 다른 계수 조합일 뿐',
  lead:'MAML·FOMAML·Reptile은 AvgGrad와 AvgGradInner를 서로 다른 비율로 섞은 것으로 통일된다.',
  d:'$k$ 스텝 기준으로 MAML은 $(1)\\text{AvgGrad}-(2(k-1)\\alpha)\\text{AvgGradInner}$, FOMAML은 $(1)\\text{AvgGrad}-((k-1)\\alpha)\\text{AvgGradInner}$, Reptile은 $(k)\\text{AvgGrad}-(\\tfrac12 k(k-1)\\alpha)\\text{AvgGradInner}$ 형태다. AvgGradInner 대 AvgGrad의 비율은 MAML > FOMAML > Reptile 순이지만, 세 방법 모두 $\\alpha$ 와 $k$ 가 커질수록 이 비율이 커진다 — Reptile이 2차 미분 없이도 within-task 일반화 항을 갖는 이유가 바로 이 비율 구조다.'}
],

diagram:{type:'compare', cap:'MAML은 지지·쿼리를 나눠 2차 미분으로 메타 그레이디언트를 만들지만, Reptile은 k스텝 SGD의 도착점 방향으로 그냥 이동한다.',
 left:{t:'MAML', items:['지지/쿼리 분리 필요','쿼리 손실을 θ로 재미분','Hessian-vector product 필요']},
 right:{t:'Reptile', items:['분리 없이 k스텝 SGD','φ̃-φ를 그레이디언트로 사용','1차 미분만 필요','joint training과 다른 항 최적화']}
},

math:[
 {expr:'φ ← φ + ε(φ̃ − φ),   φ̃ = U_τ^k(φ)',
  tex:'\\phi \\leftarrow \\phi+\\epsilon(\\tilde{\\phi}-\\phi),\\qquad \\tilde{\\phi}=U_\\tau^{k}(\\phi)',
  d:'Reptile의 갱신 전체. $U_\\tau^k$ 는 과제 $\\tau$ 위에서 SGD(또는 Adam)를 $k$ 번 적용하는 연산. $\\epsilon$ 은 바깥 학습률.'},
 {expr:'E[g_Reptile] = k·AvgGrad − (k(k−1)/2)α·AvgGradInner + O(α²)',
  tex:'\\mathbb{E}[g_{\\text{Reptile}}]=(k)\\,\\text{AvgGrad}-\\left(\\tfrac12 k(k-1)\\alpha\\right)\\text{AvgGradInner}+O(\\alpha^2)',
  d:'테일러 전개로 얻은 Reptile 그레이디언트의 리딩 오더 근사. $k=1$ 이면 AvgGradInner 항이 사라져 순수 joint training(AvgGrad만)이 되고, $k>1$ 부터 일반화를 높이는 AvgGradInner 항이 나타난다 — "Reptile이 joint training과 다른 이유"의 정량적 답.'}
],

numbers:[
 {k:'miniImageNet 5-way 1-shot', v:'49.97%', d:'Reptile+Transduction. MAML(48.70%)·FOMAML(48.07%)보다 높음'},
 {k:'miniImageNet 5-way 5-shot', v:'65.99%', d:'Reptile+Transduction, MAML 63.11%보다 높음'},
 {k:'Omniglot 5-way 1-shot / 20-way 1-shot', v:'97.68% / 89.43%', d:'Reptile+Transduction. MAML(98.7%/95.8%)에는 못 미침 — 데이터셋에 따라 우열이 갈림'},
 {k:'내부 루프 스텝 수', v:'k (실험은 다수 스텝)', d:'k=1이면 순수 joint training과 동일, k>1부터 AvgGradInner 항 발생'},
 {k:'Adam 모멘텀 β1', v:'0으로 설정', d:'모멘텀을 쓰면 연속 스텝이 같은 배치에 영향받아 within-task 일반화 효과가 줄어든다는 분석과 일치'},
 {k:'2차 미분 필요 여부', v:'불필요(1차 방법)', d:'MAML 대비 메모리·연산 절감, FOMAML과 같은 급'}
],

impact:'"복잡한 이중 루프 미분 없이도 within-task 일반화를 얻을 수 있는가"라는 질문에 테일러 전개라는 명확한 도구로 답했다. 알고리즘 자체의 성능 향상보다, **왜 1차 방법이 작동하는지**를 수학적으로 규명한 것이 이 논문의 실질적 기여다 — MAML·FOMAML·Reptile을 AvgGrad/AvgGradInner라는 공통 언어로 통일해, 이후 메타 학습 알고리즘을 비교하는 분석 틀 자체를 남겼다.',

legacy:[
 '**1차 메타 학습의 이론적 정당화** — FOMAML이 "그냥 근사"가 아니라 AvgGradInner 항을 실제로 갖고 있음을 보여 1차 방법 전반의 신뢰도를 높임',
 '**분산 최적화와의 연결** — Reptile의 배치 버전이 통신 효율적 분산 SGD 기법인 SimuParallelSGD와 형식적으로 같다는 지적은, 메타 학습과 분산 학습이 서로 다른 문제가 아닐 수 있다는 관점을 열었음',
 '**"단순 baseline"의 기준점 확립** — 이후 메타 학습 논문들이 새 방법을 Reptile 대비 얼마나 복잡도를 늘렸는지로 정당화하는 관행에 참조점을 제공',
 '**분석 도구로서의 테일러 전개** — 메타 그레이디언트를 1차/2차 항으로 쪼개 비교하는 방법론이 후속 메타 학습 분석 연구에 재사용됨'
],

pitfalls:[
 '**"Reptile은 그냥 여러 과제로 학습하는 것과 같다"는 흔한 오해다.** k=1일 때만 참이고, 논문의 핵심 논증은 정확히 이 오해를 반박하는 테일러 전개다 — k>1에서는 AvgGradInner라는 별도의 항이 작동한다.',
 '**모든 벤치마크에서 MAML을 이기는 것은 아니다.** Omniglot에서는 Reptile이 MAML보다 낮은 정확도를 보였다(20-way 1-shot 89.43% vs 95.8%) — 저자들도 miniImageNet에서만 우위, Omniglot에서는 열세라고 명시한다.',
 '**"1차라서 항상 더 빠르다"는 계산량 얘기이지 수렴 품질 얘기가 아니다.** AvgGradInner 계수가 MAML보다 작아, 같은 α·k에서 within-task 일반화 효과 자체는 MAML보다 약하게 걸린다.'
],

figures:[
 {f:'fig1-sine-demo.png',
  cap:'1차원 사인파 회귀 토이 문제. 왼쪽부터 학습 전(파랑 곡선이 평평함), MAML 학습 후, Reptile 학습 후 — 검은 점이 관측한 10개 표본이고 초록이 정답 곡선. Reptile과 MAML 모두 학습 전에는 평균이 0인 함수(주황과 파랑이 거의 평평)였다가, 몇 개의 점만 보고도 초록 곡선에 가깝게(주황) 수렴한다.',
  src:'원문 Figure 1, p.5'}
],

quotes:[
 {t:'Reptile is so similar to joint training (i.e., training to minimize loss on the expected loss over tasks) that it is especially interesting to understand how it differs.',
  src:'Introduction, p.1'}
],

links:[
 {t:'arXiv 1803.02999 — On First-Order Meta-Learning Algorithms', u:'https://arxiv.org/abs/1803.02999'},
 {t:'OpenAI Blog — Reptile', u:'https://openai.com/research/reptile'}
]
});
