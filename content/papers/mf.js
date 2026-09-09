WIKI.paper({
slug:'mf',
venue:'IEEE Computer, Vol. 42, No. 8 (Aug. 2009), pp. 42-49 — Cover Feature',
authors:'Yehuda Koren (Yahoo Research) · Robert Bell, Chris Volinsky (AT&T Labs—Research)',

tldr:'Netflix Prize에서 우승한 BellKor 팀이 자신들의 무기를 정리한 해설 논문. 아이템 기반·사용자 기반 이웃(neighborhood) 방식보다 **잠재 요인(latent factor) 행렬 분해**가 더 정확하고, 편향항·암묵적 피드백·시간 변화까지 같은 최적화 틀 안에 자연스럽게 얹을 수 있음을 보였다.',

context:'2006년 Netflix가 자사 추천 알고리즘(Cinematch, RMSE 0.9514)을 10% 개선하면 100만 달러를 주겠다는 공모전을 열면서, 협업 필터링(collaborative filtering) 연구에 처음으로 1억 건 이상의 실제 평점 데이터가 공개됐다. 그전까지 주류였던 방식은 **이웃 기반(neighborhood) 방법**이다 — 어떤 영화를 좋아할지 예측하려면, 그 영화와 비슷한 평가 패턴을 가진 다른 영화(또는 비슷한 취향의 다른 사용자)를 찾아 그들의 평점을 참고한다. 직관적이지만 사용자·아이템을 몇 개의 잠재 축으로 압축하는 **잠재 요인 모델**만큼 정확하지는 않았다. 이 논문은 그 잠재 요인 모델의 대표 실현체인 행렬 분해를, Netflix 데이터라는 실전에서 검증된 형태로 정리한다.',

ideas:[
 {h:'사용자·아이템을 같은 잠재 공간의 벡터로',
  lead:'평점 행렬을 사용자 벡터와 아이템 벡터의 내적으로 근사한다.',
  d:'아이템 $i$ 를 벡터 $q_i \\in \\mathbb{R}^f$, 사용자 $u$ 를 벡터 $p_u \\in \\mathbb{R}^f$ 로 표현하고, 예측 평점을 $\\hat r_{ui}=q_i^\\top p_u$ 로 둔다. $f$ 는 보통 20~100차원이며, 각 축이 "코미디 vs 드라마", "여성향 vs 남성향" 같은 (때로는 해석 불가능한) 취향의 축이 된다. 전통 SVD와 달리 결측치를 채우지 않고 **관측된 평점만으로** 이 벡터들을 학습한다.'},
 {h:'SGD와 ALS, 두 가지 학습 방식',
  lead:'Simon Funk가 대중화한 SGD와, 병렬화에 유리한 ALS 중 상황에 맞게 고른다.',
  d:'목적함수(식 2)는 $q_i,p_u$ 를 동시에 보면 볼록하지 않지만, 한쪽을 고정하면 나머지는 최소제곱으로 풀리는 볼록 문제가 된다. SGD는 평점마다 오차 $e_{ui}=r_{ui}-q_i^\\top p_u$ 를 계산해 그래디언트 반대 방향으로 조금씩 갱신하며 구현이 쉽고 빠르다. ALS(alternating least squares)는 $q$ 와 $p$ 를 번갈아 고정해 풀며, 아이템별·사용자별 계산이 서로 독립이라 **병렬화**가 쉽고, 관측치가 조밀한 암묵적 피드백 데이터에도 잘 맞는다.'},
 {h:'편향항으로 "취향"과 "그냥 후한 평가"를 분리',
  lead:'전역 평균·아이템 편향·사용자 편향을 먼저 빼고 남은 신호만 상호작용으로 설명한다.',
  d:'어떤 영화가 높은 평점을 받는 건 그 영화가 사용자 취향에 맞아서일 수도, 원래 다들 후하게 주는 인기작이라서일 수도 있다. 이걸 구분하지 않으면 $q_i^\\top p_u$ 가 순수한 상호작용이 아니라 인기·후함까지 억지로 설명하려다 왜곡된다. $\\hat r_{ui}=\\mu+b_i+b_u+q_i^\\top p_u$ 로 전역 평균·아이템 편향·사용자 편향을 먼저 떼어내고, 남은 잔차만 잠재 요인이 설명하게 한다.'},
 {h:'암묵적 피드백과 사용자 속성도 같은 벡터 공간에',
  lead:'평점이 없는 사용자도 클릭·조회 이력이나 인구통계 정보로 벡터를 보강한다.',
  d:'평점을 거의 안 남긴 사용자(cold start)라도, 어떤 아이템을 봤는지(암묵적 피드백 $N(u)$)나 인구통계 속성($A(u)$)은 있을 수 있다. 이런 신호마다 별도의 요인 벡터($x_i$, $y_a$)를 학습해 사용자 벡터 $p_u$ 에 더해준다(식 6). 명시적 평점이라는 하나의 신호에 갇히지 않고, **같은 최적화 틀에 신호를 계속 추가**할 수 있다는 것이 행렬 분해의 실질적 장점이다.'},
 {h:'평점의 의미 자체가 시간에 따라 변한다',
  lead:'아이템 인기·사용자 채점 기준·취향을 모두 시간의 함수로 만든다.',
  d:'영화의 인기는 배우의 새 작품 개봉 같은 외부 사건으로 출렁이고($b_i(t)$), 같은 사용자도 시간이 지나며 평점을 후하게/박하게 주는 기준이 바뀌고($b_u(t)$), 좋아하는 장르 자체가 바뀌기도 한다($p_u(t)$). 정적 모델을 $\\hat r_{ui}(t)=\\mu+b_i(t)+b_u(t)+q_i^\\top p_u(t)$ 로 시간의 함수로 확장하면, 이 논문 실험에서 가장 큰 정확도 개선을 가져온 요소가 바로 이 시간 동역학이었다.'}
],

diagram:{type:'stack', cap:'BellKor 우승 모델이 예측값을 쌓아올린 순서. 아래일수록 먼저 빼는 "취향과 무관한" 성분, 위로 갈수록 개인화 신호.',
 layers:[
  {t:'전역 평균', s:'μ (모든 평점의 평균)'},
  {t:'아이템 편향', s:'bi — 인기작 보정'},
  {t:'사용자 편향', s:'bu — 후한/박한 채점 보정'},
  {t:'잠재 요인 상호작용', s:'qiᵀ pu', acc:true, note:'진짜 개인화 신호'},
  {t:'시간의 함수로 확장', s:'bi(t), bu(t), pu(t)', note:'가장 큰 개선 요인'}
 ]},

math:[
 {expr:'r̂ui = qiᵀ pu',
  tex:'\\hat r_{ui}=q_i^{\\top}p_u',
  d:'가장 기본형. 아이템 벡터와 사용자 벡터의 내적이 곧 예측 평점이다.'},
 {expr:'min Σ (rui - qiᵀpu)² + λ(‖qi‖² + ‖pu‖²)',
  tex:'\\min_{q^{*},p^{*}}\\ \\sum_{(u,i)\\in\\kappa}\\left(r_{ui}-q_i^{\\top}p_u\\right)^2 + \\lambda\\left(\\lVert q_i\\rVert^2+\\lVert p_u\\rVert^2\\right)',
  d:'관측된 (사용자,아이템) 쌍 $\\kappa$ 에 대해서만 오차를 최소화하고, $\\lambda$ 로 과적합을 규제한다. 결측치를 채우지 않는 것이 전통 SVD와의 핵심 차이다.'},
 {expr:'r̂ui = μ + bi + bu + qiᵀpu',
  tex:'\\hat r_{ui}=\\mu+b_i+b_u+q_i^{\\top}p_u',
  d:'예측을 전역 평균·아이템 편향·사용자 편향·상호작용 네 항으로 분해한 최종 형태(식 4). 이후 시간의 함수로 확장된다.'}
],

numbers:[
 {k:'Netflix 학습 데이터', v:'평점 1억+ · 사용자 약 50만 · 영화 1.7만+', d:'테스트셋은 별도 약 300만 건'},
 {k:'Cinematch 기준선', v:'RMSE 0.9514', d:'그랜드 프라이즈 목표는 RMSE 0.8563 (10% 개선)'},
 {k:'BellKor 진행 성적', v:'2007년 +8.43% · 2008년 +9.46%', d:'각각 그 해 Progress Prize 수상 기록'},
 {k:'대회 참가 규모', v:'182개국 4.8만+ 팀', d:'데이터 다운로드 기준. 당시 공개 CF 데이터 중 최대 규모'},
 {k:'잠재 요인 차원 f', v:'20~100', d:'차원을 늘릴수록(그림 4에서 최대 1,500) RMSE가 꾸준히 낮아짐'}
],

impact:'행렬 분해는 이 논문 이후 협업 필터링의 **기본 표준**이 됐다. 이웃 기반 방식보다 정확하면서도, 사용자·아이템 하나당 벡터 하나만 저장하면 되는 **메모리 효율적** 모델이라는 점이 산업 적용을 쉽게 만들었다. 더 결정적으로는, 편향항·암묵적 피드백·시간 동역학·신뢰도까지 전부 "같은 제곱오차 최적화에 항을 하나씩 더하는" 형태로 통합할 수 있음을 보여줘서, 이후 추천 모델 설계가 "새 구조를 발명하는 일"에서 "이 목적함수에 어떤 신호를 더할까"의 문제로 바뀌었다.',

legacy:[
 '**딥러닝으로의 일반화** — [NCF](#/p/ncf)는 $q_i^\\top p_u$ 의 내적을 MLP로 바꿔 비선형 상호작용을 학습하고, [Wide & Deep](#/p/wide-deep)의 wide 부분은 이 논문의 편향항·저차 상호작용 아이디어의 후예다',
 '**암묵적 피드백의 전면화** — 평점이 사라지고 클릭·시청 로그만 남은 산업 환경에서, 이 논문의 $N(u)$ 아이디어는 [YouTube DNN](#/p/youtube-dnn)·[투 타워](#/p/two-tower) 같은 후보 생성 모델의 출발점이 됐다',
 '**시퀀스로의 확장** — 사용자 취향이 시간에 따라 변한다는 관찰은 이후 [SASRec](#/p/sasrec)·[BERT4Rec](#/p/bert4rec)이 평점이 아니라 행동 시퀀스 자체를 모델링하는 방향으로 이어졌다',
 '**임베딩이라는 공통 어휘** — 사용자·아이템을 같은 잠재 공간의 벡터로 놓는다는 발상은 추천을 넘어 검색·광고까지 퍼진 "임베딩 내적 = 관련도"라는 표준 패턴의 초기 실증 사례다'
],

pitfalls:[
 '**오프라인 RMSE 개선이 그대로 서비스 지표로 이어지지 않는다.** BellKor의 최종 우승 앙상블은 100개 넘는 예측기를 조합한 것으로, RMSE는 낮췄지만 구현·서빙 복잡도 대비 실익이 크지 않아 Netflix 프로덕션에는 전체가 반영되지 않았다. 오프라인 지표(RMSE·NDCG)와 실제 시청시간·클릭률의 괴리는 이후 추천 시스템 연구에서 반복되는 문제다.',
 '**관측된 평점만 학습하면 인기 편향이 그대로 스며든다.** $b_i$ 는 사실상 아이템의 평균적 인기를 흡수하는 항이라, 정규화를 약하게 하면 인기 아이템 쪽으로 예측이 쏠리기 쉽다. 평점을 거의 남기지 않은 신규 사용자·아이템은 $q_i^\\top p_u$ 항이 거의 0으로 수렴해 사실상 $\\mu+b_i+b_u$ 만 남는 콜드스타트 문제도 이 모델 자체로는 해결되지 않는다.',
 '**시간 동역학 모델을 검증할 때 시간 순서를 지키지 않으면 지표가 부풀려진다.** $b_u(t)$, $p_u(t)$ 처럼 시점을 특징으로 쓰는 모델을 무작위로 train/test 분할하면 미래 시점의 평가 패턴이 학습에 새어 들어가는 데이터 누출이 생겨, 실제 배포 시 성능보다 오프라인 지표가 낙관적으로 나온다.'
],

figures:[
 {f:'fig3-factor-space.png',
  cap:'축 자체에는 이름이 없다 — 사람이 사후에 영화 제목을 보고서야 x축이 "저속한 코미디·공포(왼쪽) vs 진지한 드라마·강한 여성 서사(오른쪽)", y축이 "독립·컬트 영화(위) vs 대중적 정형 영화(아래)"임을 알아챈 것. qi를 2차원만 뽑아 뿌린 산점도다.',
  src:'원문 Figure 3, p.47'},
 {f:'fig4-rmse.png',
  cap:'x축은 로그 스케일 파라미터 수(≈요인 차원 f), y축은 RMSE(낮을수록 좋음). 다섯 곡선이 위(단순 모델)에서 아래(시간 동역학까지 반영)로 순서대로 낮아지며, 같은 곡선 안에서도 곡선을 따라 붙은 숫자(요인 차원)가 커질수록 오른쪽 아래로 내려간다 — 차원과 정교함이 각각 독립적으로 정확도에 기여함을 보여준다.',
  src:'원문 Figure 4, p.48'}
],

quotes:[
 {t:'Matrix factorization models map both users and items to a joint latent factor space of dimensionality f, such that user-item interactions are modeled as inner products in that space.',
  src:'A Basic Matrix Factorization Model, p.44'},
 {t:'Our winning entries consist of more than 100 different predictor sets, the majority of which are factorization models using some variants of the methods described here.',
  src:'Netflix Prize Competition, p.47'}
],

links:[
 {t:'IEEE Computer 42(8), 2009 (Semantic Scholar)', u:'https://www.semanticscholar.org/paper/Matrix-Factorization-Techniques-for-Recommender-Koren-Bell/d4bbcc842f22547eaf5884251eaa68251895dccb'},
 {t:'원문 PDF (datajobs.com 미러)', u:'https://datajobs.com/data-science-repo/Recommender-Systems-%5BNetflix%5D.pdf'},
 {t:'Simon Funk, Netflix Update: Try This at Home (SGD 최초 공개)', u:'http://sifter.org/~simon/journal/20061211.html'}
]
});
