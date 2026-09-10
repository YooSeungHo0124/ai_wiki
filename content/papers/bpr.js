WIKI.paper({
slug:'bpr',
venue:'UAI 2009',
authors:'Rendle, Freudenthaler, Gantner, Schmidt-Thieme (University of Hildesheim)',
arxiv:'1205.2618',

tldr:'추천을 "평점이 몇 점일까"가 아니라 "이 아이템이 저 아이템보다 위에 와야 한다"는 **쌍(pair) 순서 맞히기**로 바꾼 논문. 관측되지 않은 항목을 전부 "싫어함"으로 취급하던 관행을 버리고, 베이지안 사후확률 최대화로 이 순위 목적함수를 유도했다.',

context:'2009년의 암묵적 피드백(클릭·구매·조회) 추천은 [행렬 분해](#/p/mf)나 adaptive kNN처럼 강력한 모델을 쓰고 있었지만, 학습 방식은 여전히 **평점 예측**에서 물려받은 것이었다. 관측된 (사용자, 아이템) 쌍에는 레이블 1을, 나머지 전부에는 레이블 0을 주고 회귀나 분류로 맞히는 식이다. 문제는 암묵적 피드백에는 명시적 부정 신호가 없다는 점이다 — 사용자가 아이템을 안 봤다는 것은 "싫어해서"일 수도 "아직 못 봐서"일 수도 있는데, 이걸 전부 0으로 채우면 모델은 미래에 순위를 매겨야 할 대상 전체를 학습 시점에 이미 "부정"으로 낙인찍고 시작한다. 표현력이 충분한 모델이라면 이 데이터를 완벽히 맞혀 전부 0을 예측해버릴 수도 있는데, 그런 모델은 순위를 전혀 못 매긴다.',

ideas:[
 {h:'점수가 아니라 순서를 학습 신호로 삼는다',
  lead:'절대 평점 대신 "i가 j보다 위"라는 사용자별 상대 순서를 학습 데이터로 만든다.',
  d:'사용자가 아이템 `i`를 봤고 `j`를 안 봤다면, `i >_u j` (사용자 `u`는 `i`를 `j`보다 선호)라는 쌍을 만든다. 둘 다 본 쌍, 둘 다 안 본 쌍은 순서를 알 수 없으니 버린다. 이렇게 만든 학습셋 $D_S := \\{(u,i,j) \\mid i \\in I_u^+ \\wedge j \\in I \\setminus I_u^+\\}$ 는 두 가지 이점이 있다 — 관측되지 않은 쌍이 전부 부정이 아니라 미래에 풀어야 할 진짜 순위 문제로 남고, 학습 목표 자체가 최종 목적(순위)과 일치한다.'},
 {h:'베이지안 사후확률 최대화로 목적함수를 유도한다',
  lead:'개별 선호 확률에 시그모이드를 씌우고 파라미터에 정규분포 사전을 걸어 MAP로 푼다.',
  d:'사용자 `u`가 `i`를 `j`보다 선호할 확률을 $p(i>_u j|\\Theta) := \\sigma(\\hat x_{uij}(\\Theta))$ 로 모델링한다. 여기서 $\\hat x_{uij}$ 는 행렬 분해든 kNN이든 아무 모델이나 꽂을 수 있는 자리다. 파라미터에 평균 0인 정규분포 사전 $p(\\Theta)\\sim N(0,\\Sigma_\\Theta)$ 을 주고 로그 사후확률을 최대화하면, 시그모이드의 로그 합에 L2 정규화 항이 붙은 형태로 정리된다 — 이게 BPR-Opt다.'},
 {h:'AUC 최적화와의 관계: 미분 가능한 대체 손실',
  lead:'AUC의 계단함수를 $\\ln\\sigma(x)$ 로 바꾼 것이 곧 BPR-Opt와 같은 형태다.',
  d:'사용자별 AUC는 $\\hat x_{uij}>0$ 인 쌍의 비율로 정의되는데, 이 지시함수(Heaviside)는 미분이 안 돼 그래디언트 방법으로 최적화할 수 없다. AUC 최적화 연구들은 보통 시그모이드 $\\sigma(x)$ 로 근사하지만, 이 논문은 MAP 유도 과정에서 자연스럽게 $\\ln\\sigma(x)$ 가 나온다는 것을 보인다. 즉 BPR-Opt는 즉흥적 근사가 아니라 **AUC를 재는 것과 같은 문제를 확률적으로 풀었을 때 나오는 정답**이라는 논지다.'},
 {h:'LearnBPR: 사용자·아이템별이 아니라 완전 무작위 부트스트랩',
  lead:'삼중항을 균등 무작위로 뽑는 SGD가 순서대로 도는 것보다 훨씬 빨리 수렴한다.',
  d:'전체 배치 경사하강은 $O(|S||I|)$ 개 삼중항 때문에 스텝당 비용이 너무 크고, 사용자별·아이템별로 순서대로 도는 일반적인 SGD는 같은 (u,i) 쌍에 대해 다른 j로 연속 업데이트가 몰려 수렴이 느리다(한 인기 아이템이 그래디언트를 지배해버림). LearnBPR은 삼중항 $(u,i,j)$ 를 **복원추출로 완전히 무작위** 샘플링한다. 논문 Figure 5는 같은 BPR-MF 모델에서 이 방식이 사용자별 순차 SGD보다 훨씬 빠르게 수렴함을 보인다.'},
 {h:'같은 모델도 목적함수만 바꾸면 성능이 갈린다',
  lead:'BPR-MF와 SVD-MF·WR-MF는 모델이 동일한데 학습 기준만 다르다.',
  d:'BPR을 [행렬 분해](#/p/mf)와 adaptive kNN 두 모델 클래스에 적용해, 각각 $\\hat x_{uij}=\\hat x_{ui}-\\hat x_{uj}$ 로 분해한 뒤 파라미터별 그래디언트만 새로 유도하면 그대로 꽂힌다. 이렇게 만든 BPR-MF·BPR-kNN을 SVD 기반 최소제곱 학습(SVD-MF), 가중 정규화 행렬 분해(WR-MF, [Hu et al. 2008]), 코사인 유사도 kNN과 비교하면, **모델 구조는 같은데 학습 기준만 BPR로 바꿔도 순위 품질이 뚜렷이 오른다.** 목적함수 선택이 모델 선택 못지않게 중요하다는 것이 이 논문의 핵심 실증이다.'}
],

diagram:{type:'compare', cap:'같은 관측 데이터 S에서 학습 신호를 어떻게 만드는지가 갈린다.',
 left:{t:'기존: 점별 예측', items:['관측=1, 나머지 전부=0','완벽히 맞히면 전부 0만 예측','순위 목적과 학습 목표 불일치']},
 right:{t:'BPR: 쌍별 순서', items:['i>uj 쌍만 학습 데이터로','미관측 쌍은 미래 순위 문제로 남김','AUC 목적과 학습 목표 일치']}},

math:[
 {expr:'BPR-Opt = Σ ln σ(x̂uij) − λΘ ||Θ||²',
  tex:'\\text{BPR-Opt} := \\ln p(\\Theta \\mid >_u) = \\sum_{(u,i,j)\\in D_S} \\ln \\sigma(\\hat x_{uij}) - \\lambda_\\Theta \\lVert \\Theta \\rVert^2',
  d:'베이지안 MAP 추정으로 유도한 최종 목적함수(최대화 대상). $\\sigma$ 는 로지스틱 시그모이드, $\\hat x_{uij}$ 는 사용자 `u`가 `i`를 `j`보다 얼마나 더 선호하는지를 나타내는 임의의 모델 함수다.'},
 {expr:'x̂uij := x̂ui − x̂uj',
  tex:'\\hat x_{uij} := \\hat x_{ui} - \\hat x_{uj}',
  d:'삼중항 점수를 개별 아이템 점수의 차로 분해한다. 행렬 분해에서는 $\\hat x_{ui} = \\langle w_u, h_i \\rangle$ 이므로 $\\hat x_{uij} = \\langle w_u, h_i - h_j \\rangle$ 가 되어, 파라미터별 그래디언트가 기존 모델 학습과 거의 같은 형태로 나온다.'},
 {expr:'Θ ← Θ + α · ( e^(−x̂uij) / (1+e^(−x̂uij)) · ∂x̂uij/∂Θ + λΘ·Θ )',
  tex:'\\Theta \\leftarrow \\Theta + \\alpha\\left( \\frac{e^{-\\hat x_{uij}}}{1+e^{-\\hat x_{uij}}} \\cdot \\frac{\\partial}{\\partial \\Theta}\\hat x_{uij} + \\lambda_\\Theta \\Theta \\right)',
  d:'LearnBPR의 갱신식. 삼중항 $(u,i,j)$ 를 $D_S$ 에서 복원추출로 무작위로 뽑아 이 규칙으로 갱신하기를 반복한다.'}
],

numbers:[
 {k:'평가 지표', v:'AUC (식 2)', d:'테스트셋에서 (관측, 미관측) 쌍 중 모델이 올바른 순서로 맞힌 비율. 무작위 0.5, 완벽 1.0'},
 {k:'Rossmann (온라인 쇼핑)', v:'BPR-MF/kNN 최고 AUC ≈ 0.90', d:'10,000 사용자 · 4,000 아이템 · 구매 426,612건, 128차원 기준'},
 {k:'Netflix 서브샘플', v:'BPR-kNN ≈ 0.92 vs WR-MF ≈ 0.90', d:'10,000 사용자 · 5,000 아이템, leave-one-out 평가'},
 {k:'비정규화 최적선과 비교', v:'Cosine-kNN이 npmax를 이미 능가', d:'개인화 안 된 최선의 방법(npmax)보다 단순한 개인화 kNN이 더 나음 — 개인화 자체의 가치를 보여줌'},
 {k:'차원 효율', v:'BPR-MF 8차원 ≈ WR-MF 128차원', d:'Netflix 실험에서, 학습 기준이 좋으면 훨씬 적은 차원으로도 같은 품질에 도달'}
],

impact:'BPR은 추천 시스템 연구에서 "무엇을 예측할 것인가"의 기본값을 평점에서 순위로 옮겼다. 이후 임의의 점수 함수 $\\hat x_{ui}$ 위에 쌍별 순서 손실을 얹는 **BPR loss**가 사실상 표준 학습 목적함수가 되어, 딥러닝 기반 추천 모델([NCF](#/p/ncf) 등)에서도 형태를 유지한 채 재사용된다. AUC 최적화를 매끄러운 대체 손실로 유도했다는 점에서, 랭킹 손실 설계 일반에도 참조점을 남겼다.',

legacy:[
 '**손실 함수로서의 재사용** — BPR loss가 [행렬 분해](#/p/mf) 계열을 넘어 그래프 임베딩([node2vec](#/p/node2vec) 류)·딥러닝 추천 모델 전반에서 쌍별 순위 학습의 기본형으로 채택됨',
 '**임베딩 기반 추천으로의 합류** — 아이템을 벡터로 놓고 내적/유사도로 순위를 매긴다는 틀은 [item2vec](#/p/item2vec) 같은 임베딩 접근과 만나 "표현 학습 + 순위 손실"이라는 조합으로 굳어짐',
 '**샘플링 전략 연구의 출발점** — LearnBPR의 무작위 negative 샘플링은 이후 "얼마나 어려운 negative를 뽑을 것인가"(hard negative mining)를 다투는 후속 연구들의 베이스라인이 됨',
 '**어텐션 기반 CTR 모델과의 결합** — [DIEN](#/p/dien) 등 산업 CTR 모델의 보조 손실(auxiliary loss)도 형태상 BPR과 같은 시그모이드 기반 쌍별 대조 손실을 쓴다'
],

pitfalls:[
 '**BPR-Opt는 pointwise 개선이 아니라 "순위가 맞았는가"만 본다.** 평점 예측 RMSE를 낮추는 것과 목적이 다르므로, 명시적 평점 예측 과제에 그대로 쓰면 최적화 방향이 어긋난다 — 저자들도 이 논문의 초점을 암묵적 피드백의 개인화 순위로 명확히 한정한다.',
 '**미관측 항목 중 j로 뽑힌 것이 실제로는 "관심 있지만 아직 못 본 것"일 수 있다.** BPR은 이 잡음을 통계적으로 감수하는 것이지 해결하는 것이 아니다 — 샘플링된 negative 안에 진짜 양성이 섞여 있다는 가정 자체는 여전히 남는다.',
 '**LearnBPR의 무작위 부트스트랩은 완전한 epoch을 돌지 않는다.** "한 바퀴 다 봤다"는 개념이 없고 대신 관측된 피드백 수에 비례한 스텝 수를 정해서 멈추므로, 다른 논문의 epoch 단위 학습 곡선과 직접 비교하려면 스텝 수 환산이 필요하다.'
],

figures:[
 {f:'fig2-pairwise.png',
  cap:'왼쪽 행렬이 원 관측 데이터 S(?=미관측, +=관측). 화살표를 따라가면 사용자 u1의 행이 오른쪽 위 i>u1 j 행렬로 바뀌는데, u1이 본 아이템(i2, i3)의 행/열에는 +가, 둘 다 못 본 조합에는 ?가 남는다 — 이것이 그 사용자 하나의 학습용 쌍대 비교 데이터다. 사용자마다 이런 행렬이 하나씩 만들어진다(u5 예시가 아래).',
  src:'원문 Figure 2, p.3'},
 {f:'fig6-auc.png',
  cap:'x축은 잠재 요인 차원 수(8~128), y축은 AUC. 왼쪽 Rossmann·오른쪽 Netflix 모두에서 초록 두 선(BPR-MF·BPR-kNN)이 항상 위에 있고, 빨간 SVD-MF는 차원이 늘수록 오히려 떨어진다(과적합). 주황 점선(npmax, 비개인화 이론 상한)보다 파란 Cosine-kNN조차 이미 위에 있다는 것이 "개인화 자체의 힘"을 보여주는 지점.',
  src:'원문 Figure 6, p.9'}
],

quotes:[
 {t:'We use a different approach by using item pairs as training data and optimize for correctly ranking item pairs instead of scoring single items as this better represents the problem than just replacing missing values with negative ones.',
  src:'Section 3.2, p.2'}
],

links:[
 {t:'arXiv 1205.2618 — BPR: Bayesian Personalized Ranking from Implicit Feedback', u:'https://arxiv.org/abs/1205.2618'},
 {t:'UAI 2009 원문 (AUAI Press)', u:'https://arxiv.org/pdf/1205.2618'}
]
});
