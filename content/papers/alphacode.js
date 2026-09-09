WIKI.paper({
slug:'alphacode',
venue:'Science 2022 (DeepMind)',
authors:'Li et al. (DeepMind)',
arxiv:'2203.07814',

tldr:'경쟁 프로그래밍 문제를 자연어 설명만 보고 풀도록 만든 시스템. 문제당 최대 **백만 개**의 프로그램을 생성한 뒤 공개 테스트로 걸러내고 행동 기준으로 군집화해 10개 이하로 좁히는 방식으로, Codeforces 실제 대회에서 참가자 상위 **54.3%**에 해당하는 성적을 냈다.',

context:'2021년 [Codex/HumanEval](#/p/humaneval)은 함수 시그니처와 docstring 하나를 보고 짧은 함수 하나를 채우는 문제에서 pass@1 28.8%를 기록했다. 하지만 그 문제들은 명세를 코드로 직역하면 풀리는 수준이었다. 경쟁 프로그래밍은 다르다 — 문제는 수백 단어짜리 자연어 설명이고, 풀려면 알고리즘을 스스로 설계해야 하며, 정답 여부는 대회 당일까지 공개되지 않는 **숨겨진 테스트**로 채점된다. 기존 시도들은 이런 문제에서 한 자릿수 % 수준의 해결률에 머물렀고, 심지어 그 점수조차 테스트 커버리지가 부실해 30~60%가 **거짓 양성**(우연히 테스트만 통과한 오답)이었다. AlphaCode는 이 두 문제 — 문제 자체의 난이도, 그리고 채점의 신뢰성 — 를 동시에 공략한다.',

ideas:[
 {h:'CodeContests: 시간순 분할 + 생성 테스트로 오염과 거짓 양성을 잡는다',
  lead:'Codeforces 문제를 시간순으로 나누고 테스트를 추가 생성해 거짓 양성률을 낮춘다.',
  d:'Codeforces·Description2Code·CodeNet을 합친 데이터셋을 만들되, 모든 학습 데이터가 평가 문제보다 시간상 앞서도록 **엄격한 시간순 분할**을 적용해 정답을 외워서 맞히는 것을 막았다. 또한 공개된 예제 테스트만으로는 성긴 경우가 많아 추가로 테스트 입력을 생성해 붙였다. 그 결과 기존 데이터셋의 거짓 양성률 30~60%가 **4%**로 떨어졌다.'},
 {h:'비대칭 encoder-decoder + multi-query attention',
  lead:'인코더는 얕고 넓게, 디코더는 깊게 만들고 multi-query attention으로 샘플링을 가속한다.',
  d:'[Transformer](#/p/transformer) encoder-decoder를 그대로 쓰되, 인코더에는 1536토큰, 디코더에는 768토큰만 배정하는 **비대칭 구조**를 썼다. 문제 설명은 양방향으로 한 번만 읽으면 되지만 생성은 토큰마다 반복되므로, 얕은 인코더·깊은 디코더 조합이 해결률 손실 없이 학습 효율을 높인다. 샘플링을 수백만 번 반복해야 하므로 [multi-query attention](#/p/mqa)으로 key/value를 head 간에 공유해 추론 비용을 줄였다.'},
 {h:'GOLD + tempering: 정답 하나만 확신 있게 뱉도록 미세조정',
  lead:'표준 최대우도 대신 GOLD 목적함수로 다양한 정답에 골고루 확률을 흩뿌리지 않게 한다.',
  d:'같은 문제에 정답 구현은 무수히 많다. 표준 최대우도 학습은 모든 정답 스타일에 조금씩 확률을 나눠주다 보니 각각의 확신이 약해진다. GOLD($\\delta$-reward 버전)는 로그우도 기울기에 모델 자신의 확률 $P_\\theta(s)$ 를 중요도 가중치로 곱해, 이미 확신 있게 잘 맞히는 방향으로 더 밀어준다. 여기에 tempering(추론 온도 조정)을 더해 과적합과 분포 붕괴를 동시에 억제했다.'},
 {h:'대량 샘플링: 문제당 최대 100만 개',
  lead:'같은 모델에서 문제당 최대 100만 개 프로그램을 병렬로 뽑아 탐색 공간을 넓힌다.',
  d:'transformer 샘플링은 문제마다 독립적이라 쉽게 병렬화된다. 이 점을 극단까지 밀어붙여 문제당 최대 **100만 개**의 후보 프로그램을 생성했다. Codex의 [HumanEval](#/p/humaneval)이 문제당 최대 수백 개를 뽑던 것과는 규모가 다르다 — AlphaCode의 핵심 통찰은 "모델이 정답을 아는가"가 아니라 "충분히 많이 뽑으면 그 안에 정답이 있는가"로 질문을 바꾼 것이다.'},
 {h:'필터링 + 클러스터링: 백만 개를 10개로 압축',
  lead:'공개 테스트로 99%를 걸러내고 실행 행동으로 군집화해 대표 10개만 제출한다.',
  d:'실제 대회는 제출 횟수가 사람과 같이 최대 10회로 제한된다. 먼저 문제 설명에 포함된 공개 예제 테스트를 실행해 통과하지 못하는 샘플을 버리면 약 **99%**가 사라진다. 그래도 수천 개가 남으므로, 같은 무작위 입력에 대해 같은 출력을 내는 프로그램끼리 **행동 기준으로 군집화**하고 큰 군집부터 대표 하나씩 뽑아 최대 10개를 제출한다. 이 필터링+클러스터링 파이프라인이 없으면 같은 모델도 해결률이 크게 떨어진다.'}
],

diagram:{type:'flow', cap:'GitHub로 사전학습 → CodeContests로 파인튜닝한 뒤, 문제당 최대 100만 개를 샘플링하고 필터링·군집화로 10개 이하로 압축해 제출한다.',
 nodes:[
  {t:'GitHub 사전학습', s:'715GB 코드'},
  {t:'파인튜닝', s:'CodeContests + GOLD'},
  {t:'대량 샘플링', s:'문제당 최대 100만개', acc:true},
  {t:'필터링', s:'공개테스트 통과, ~1%만'},
  {t:'클러스터링', s:'행동 기준 소수로 압축'},
  {t:'제출', s:'최대 10개'}
 ]},

math:[
 {expr:'∇L_GOLD(θ) = − Σ_{s∈Solution} P_θ(s) ∇log P_θ(s)',
  tex:'\\nabla \\mathcal{L}_{\\text{GOLD}}(\\theta) = -\\sum_{s\\,\\in\\,\\text{Solution tokens}} P_\\theta(s)\\,\\nabla \\log P_\\theta(s)',
  d:'표준 로그우도 기울기 $\\nabla \\log P_\\theta(s)$ 에 모델 자신의 현재 확률 $P_\\theta(s)$ 를 중요도 가중치로 곱한다. 모델이 이미 어느 정도 확신하는 정답 스타일일수록 더 강하게 밀어주므로, 여러 정답에 확률을 고르게 흩뿌리는 대신 하나의 스타일에 확신을 모으게 된다.'},
 {expr:'n@k: 문제당 k개 생성 후 n개(n≤10) 이하만 골라 제출, 하나라도 숨겨진 테스트 통과 시 해결',
  tex:'n@k \\;=\\; \\Pr\\big[\\exists\\, i \\le n : \\text{sample}_i \\text{ passes hidden tests} \\mid k \\text{ samples generated}\\big]',
  d:'[HumanEval](#/p/humaneval)의 pass@k와 이름은 비슷하지만 다르다. pass@k는 k개 중 하나라도 맞으면 되는 상한값이고, n@k는 "k개를 생성한 뒤 그 중 **경쟁자가 실제로 선택 가능한 정보(공개 테스트)만으로 n개를 골라** 제출했을 때"의 현실적인 해결률이다.'}
],

numbers:[
 {k:'Codeforces 순위', v:'상위 54.3%', d:'참가자 5,000명 이상인 실제 대회 10회 평균, 제출 10회 제한'},
 {k:'추정 Codeforces 레이팅', v:'1238', d:'최근 6개월 참가자 중 상위 약 28%에 해당'},
 {k:'문제당 최대 샘플 수', v:'100만 개', d:'CodeContests 평가에서 10@1M 설정'},
 {k:'CodeContests 해결률', v:'34.2%', d:'41B 모델 + 클러스터링, 제출 10회 제한, 기존 방식은 1~5%대'},
 {k:'필터링으로 제거되는 비율', v:'약 99%', d:'공개 예제 테스트를 통과 못 하는 샘플, 문제의 약 10%는 통과 샘플 자체가 없음'},
 {k:'최대 모델 크기', v:'41.1B', d:'인코더 6144차원 · 56층, 비대칭 encoder-decoder'}
],

impact:'AlphaCode는 "코드는 실행해서 정답을 판정할 수 있다"는 성질을 극한까지 밀어붙였다. 정답 여부를 사람이 판단할 필요가 없으므로, **모델을 더 똑똑하게 만드는 대신 더 많이 뽑고 실행으로 걸러내는 것**만으로 성능을 크게 올릴 수 있음을 보였다. 이는 이후 [self-consistency](#/p/self-consistency)·best-of-n·검증자 재순위 같은 "추론 시점 계산량을 늘리는" 접근 전체의 실증적 근거가 되었다. 다만 Codeforces 상위 54.3%는 사람 중급자 수준이지 최상위가 아니며, 100만 개를 뽑고 걸러내는 방식은 실제 서비스에는 비현실적인 계산 비용이라는 한계도 함께 남겼다.',

legacy:[
 '**추론 시점 스케일링의 초기 증거** — 모델 크기를 키우는 대신 샘플 수를 키워도 로그-선형으로 해결률이 오른다는 관찰이 이후 test-time compute 연구 전체의 출발점 중 하나가 됨',
 '**필터링+클러스터링 레시피의 표준화** — 실행 가능한 후보를 대량 생성 후 행동으로 좁히는 절차가 [SWE-agent](#/p/swe-agent)·[SWE-bench](#/p/swe-bench) 계열 코드 에이전트의 후보 선택 방식으로 이어짐',
 '**검증 가능한 보상으로서의 코드 실행** — 공개 테스트 통과라는 0/1 신호가 이후 코드 RL 학습([DeepSeek-Coder](#/p/deepseek-coder))의 보상 설계에 직접 재사용됨',
 '**후속 상용화** — 이 계보의 아이디어는 이후 AlphaCode 2([Gemini](#/p/gpt4) 기반)로 이어졌고, 대량 샘플링·필터링 파이프라인은 코드 생성 제품의 표준 구성요소가 됨'
],

pitfalls:[
 '**"AlphaCode가 사람 중급 프로그래머 수준"은 정확하지 않다.** 상위 54.3%는 순위이지 절대 실력이 아니고, 대회 참가자 자체가 일반 개발자보다 알고리즘에 특화된 self-selected 집단이다. 또 실제 대회처럼 시간 압박 아래 처음 보는 문제를 실시간으로 풀었다기보다 시뮬레이션 환경에서 평가됐다.',
 '**100만 개 샘플링은 실전 배포 비용을 무시한 실험 설정이다.** 논문 스스로도 이 비용을 인정하며, 훨씬 적은 샘플로도 필터링·클러스터링만 잘 되면 해결률의 상당 부분을 유지할 수 있음을 함께 보인다(Figure 6/8). 샘플 수만 보고 비용 대비 효율을 비교하지 않으면 과대평가하기 쉽다.',
 '**pass@k(HumanEval)와 n@k(AlphaCode)를 같은 지표로 혼동하기 쉽다.** pass@k는 k개 중 하나만 맞으면 되는 상한이고, n@k는 정답을 미리 알 수 없는 상태에서 공개 정보만으로 최대 n개를 골라야 하는 현실적 제약을 반영한다. 두 논문의 점수를 직접 비교하면 안 된다.'
],

figures:[
 {f:'fig4-pipeline.png',
  cap:'왼쪽 DATA 블록: GitHub 코드와 CodeContests 문제·정답으로 사전학습→파인튜닝(LEARNING). 오른쪽 SAMPLING & EVALUATION 블록: 새 Codeforces 문제에 대해 대량 샘플링으로 Py/C++ 후보를 쏟아낸 뒤(파란 필터 아이콘) 필터링·클러스터링으로 소수만 골라 실행·채점한다.',
  src:'원문 Figure 4, p.9'},
 {f:'fig1-rating.png',
  cap:'x축은 최근 6개월 내 대회에 참가한 사용자를 레이팅 오름차순으로 줄 세운 백분위, y축은 Codeforces 레이팅. 주황 세로선이 AlphaCode의 추정 레이팅(1238)이 곡선과 만나는 지점 — 약 72%가 AlphaCode보다 레이팅이 낮다.',
  src:'원문 Figure 1(b), p.3'}
],

quotes:[
 {t:'In the evaluation of 10 recent contests with over 5,000 participants each, AlphaCode achieved an average ranking within the top 54.3%.',
  src:'p.3'},
 {t:'Filtering removes approximately 99% of model samples, although the exact amount depends on the problem and model, and filtering can still leave tens of thousands of candidate samples for many problems.',
  src:'p.9, Section 4.5'}
],

links:[
 {t:'arXiv 2203.07814 — Competition-Level Code Generation with AlphaCode', u:'https://arxiv.org/abs/2203.07814'},
 {t:'DeepMind — CodeContests dataset', u:'https://github.com/deepmind/code_contests'},
 {t:'DeepMind blog — Competitive programming with AlphaCode', u:'https://deepmind.google/discover/blog/competitive-programming-with-alphacode/'}
]
});
