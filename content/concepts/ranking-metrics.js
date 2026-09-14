WIKI.concept({
slug:'ranking-metrics',

tldr:'검색·추천 결과 목록의 품질을 재는 지표들로, Precision@k·Recall@k는 상위 k개의 정확성을, MRR·MAP·NDCG는 결과가 놓인 순서까지 반영한다.',

why:'검색·추천 시스템의 출력은 분류처럼 맞다/틀리다가 아니라 "정답을 얼마나 위에 올렸는가"가 핵심이다. 지표마다 재는 대상이 달라서 — 단순히 상위 몇 개가 맞았는지, 정답을 몇 등에 처음 올렸는지, 정답 여러 개의 순서 전체를 얼마나 잘 배치했는지 — 잘못된 지표로 시스템을 최적화하면 사용자가 체감하는 품질과 어긋난 결과를 낳는다. 오프라인 지표를 잘못 고르면 온라인 A/B 테스트 결과와 상충하는 경우도 실무에서 흔하다.',

sections:[
 {h:'Precision@k · Recall@k', d:'Precision@k는 상위 k개 결과 중 실제로 관련 있는 것의 비율("내가 보여준 것 중 몇 개가 맞았는가")이고, Recall@k는 전체 관련 항목 중 상위 k개 안에 들어온 것의 비율("찾아야 할 것 중 몇 개를 찾았는가")이다. 검색 결과 페이지처럼 사용자가 상위 몇 개만 보는 상황에서는 Precision@k가, 추천 후보군을 넓게 걸러내는 1차 단계에서는 Recall@k가 더 중요한 지표가 된다.'},
 {h:'MRR', d:'MRR(Mean Reciprocal Rank)은 질의마다 "첫 번째 정답이 몇 등에 나왔는가"의 역수를 평균한 것이다. 정답이 1등이면 1, 5등이면 0.2로 순위가 뒤로 갈수록 기여도가 빠르게 줄어든다. 정답이 오직 하나뿐이거나(질문응답에서 정답 문서 하나) "가장 먼저 맞는 것 하나만 나오면 되는" 시나리오(챗봇의 첫 정답 링크)에 적합하고, 정답이 여러 개인 경우 나머지 정답들의 순위는 전혀 반영하지 못한다는 한계가 있다.'},
 {h:'MAP', d:'MAP(Mean Average Precision)는 각 정답이 나올 때마다의 Precision@k를 계산해 평균낸 뒤(Average Precision), 이를 전체 질의에 대해 다시 평균한 것이다. 정답이 여러 개일 때 그 정답들이 상위에 고르게 몰려 있을수록 높은 점수를 받는다 — MRR과 달리 "첫 정답"만이 아니라 관련 항목 전체의 배치를 반영한다.'},
 {h:'NDCG의 할인과 정규화', d:'NDCG(Normalized Discounted Cumulative Gain)는 두 단계로 이뤄진다. 먼저 각 순위의 관련도 점수를 로그 함수로 할인(discount)해 뒤로 갈수록 기여도를 줄인다(DCG) — 등수가 밀릴수록 사용자가 볼 확률이 낮아진다는 것을 반영한 것이다. 그 다음 이상적인 순서(관련도가 높은 순서대로 완벽하게 정렬했을 때의 DCG, IDCG)로 나눠 0~1 사이로 정규화한다 — 질의마다 관련 항목 수가 다르더라도 비교 가능하게 만드는 단계다. 관련도가 이진(관련/무관)이 아니라 등급(매우 관련·약간 관련·무관)으로 매겨질 때 이 차이를 반영할 수 있는 유일한 지표라는 점이 NDCG의 강점이다.'},
 {h:'검색·추천 실무에서 어느 것을 보는가', d:'웹 검색처럼 관련도가 여러 등급(매우 관련~무관)으로 라벨링되고 순위 전체의 품질이 중요하면 NDCG@k를 본다. 추천 시스템의 1차 후보 생성 단계에서는 후보군을 놓치지 않는 것이 중요해 Recall@k를 보고, 최종 노출 단계에서는 사용자가 상위 몇 개만 보므로 Precision@k나 NDCG@k를 본다. 질문응답·팩트 검색처럼 정답이 하나뿐인 과제는 MRR이 표준이고, 문서 검색처럼 정답이 여러 개인 과제는 MAP나 NDCG를 쓴다 — 무엇이 "정답"이고 몇 개인지가 지표 선택을 결정한다.'}
],

math:[
 {tex:'\\text{P@}k=\\dfrac{|\\{\\text{관련 항목}\\}\\cap\\{\\text{상위 }k\\text{개}\\}|}{k},\\quad \\text{R@}k=\\dfrac{|\\{\\text{관련 항목}\\}\\cap\\{\\text{상위 }k\\text{개}\\}|}{|\\{\\text{관련 항목}\\}|}', expr:'Precision@k · Recall@k', d:'분자는 동일(상위 k개 안에 든 관련 항목 수)하지만 분모가 다르다 — Precision@k는 "보여준 개수 k"로, Recall@k는 "전체 관련 항목 수"로 나눈다.'},
 {tex:'\\text{MRR}=\\dfrac{1}{|Q|}\\sum_{q=1}^{|Q|}\\dfrac{1}{\\text{rank}_q}', expr:'Mean Reciprocal Rank', d:'$\\text{rank}_q$는 질의 $q$에서 첫 번째 정답이 나온 순위. 전체 질의에 대해 그 역수를 평균한다.'},
 {tex:'\\text{DCG}@k=\\sum_{i=1}^k\\dfrac{2^{rel_i}-1}{\\log_2(i+1)},\\quad \\text{NDCG}@k=\\dfrac{\\text{DCG}@k}{\\text{IDCG}@k}', expr:'NDCG', d:'$rel_i$는 $i$번째 결과의 관련도 등급. 분모 $\\log_2(i+1)$이 등수가 뒤로 갈수록 커져 기여도를 할인하고, $\\text{IDCG}@k$(이상적 순서일 때의 DCG)로 나눈 NDCG는 0~1 사이 값으로 질의 간 비교가 가능해진다.'}
],

diagram:{type:'flow', cap:'같은 결과 목록도 무엇을 재는지에 따라 다른 숫자가 나온다.',
 steps:['상위 k개 추출','정확성 P@k','회수율 R@k','첫 정답 순위 MRR','전체 배치 MAP/NDCG']},

confuse:[
 {a:'MRR', b:'MAP', d:'MRR은 정답이 하나(또는 "첫 정답"만 중요)일 때 그 순위의 역수만 본다. MAP은 정답이 여러 개일 때 그것들 전체의 배치를 Precision@k의 평균으로 반영한다 — 정답이 하나뿐인 과제에서는 두 지표가 같은 값을 낸다.'},
 {a:'DCG', b:'NDCG', d:'DCG는 할인만 적용한 원점수라 질의마다 관련 항목 수가 다르면 절대값 비교가 무의미하다. NDCG는 이상적 순서의 DCG(IDCG)로 나눠 정규화해 서로 다른 질의 간 비교와 평균이 가능해지며, 실무 리포트에서는 거의 항상 정규화된 NDCG만 보고된다.'},
 {a:'Recall@k(랭킹 지표)', b:'재현율(recall, 분류 지표)', d:'분류의 재현율은 임계값 하나로 나뉜 양성/음성 예측 전체에 대한 것이고, Recall@k는 순위 목록에서 "상위 k개까지만 봤을 때"의 회수율이다 — k를 어떻게 잡느냐에 따라 값이 달라진다는 점이 랭킹 특유의 차이이며, 같은 이름의 지표라도 두 맥락에서 계산 방식이 다르다는 것을 놓치기 쉽다.'}
],

pitfalls:[
 '정답이 여러 개인 과제에 MRR을 쓰면 첫 번째 정답 이후의 나머지 정답 순위는 전혀 반영되지 않는다는 것을 놓치기 쉽다.',
 '관련도가 이진이 아니라 등급으로 라벨링된 데이터에 Precision@k만 쓰면 "약간 관련"과 "매우 관련"을 구분하지 못한다 — NDCG가 필요한 이유다.',
 'k 값을 다르게 잡은 두 시스템의 Precision@k·Recall@k를 그대로 비교하면 안 된다 — k가 커질수록 Recall@k는 오르고 Precision@k는 대개 내려간다.',
 '관련도 라벨 자체가 평가자에 따라 갈리는 주관적 판단이라면, 지표 계산 이전에 [평가자 간 일치도](#/c/inter-annotator)부터 확인하지 않으면 NDCG 숫자의 신뢰도를 논할 수 없다.'
],

code:{lang:'python', d:'NDCG@k 계산의 최소 골격.', src:'def dcg(rels):\n    return sum((2**r - 1) / log2(i + 2) for i, r in enumerate(rels))\n\ndef ndcg_at_k(rels, k):\n    ideal = sorted(rels, reverse=True)[:k]\n    return dcg(rels[:k]) / dcg(ideal)'},

papers:['bm25','dpr','ms-marco'],
terms:['regression-metrics','precision-recall','significance','inter-annotator']
});
