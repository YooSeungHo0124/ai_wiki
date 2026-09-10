WIKI.paper({
slug:'longrope',
venue:'ICML 2024',
authors:'Ding, Zhang, Zhang, Xu, Shang, Xu, Yang, Yang (Microsoft Research)',
arxiv:'2402.13753',

tldr:'[위치 보간](#/p/position-interpolation)·[YaRN](#/p/yarn)처럼 사람이 정한 규칙 대신, RoPE 차원별·토큰 위치별 비균일 보간 계수를 **진화 탐색(evolutionary search)으로 직접 찾아서** LLM 컨텍스트 윈도우를 2,048k(약 200만) 토큰까지 늘렸다. 파인튜닝 없이도 8배 확장이 가능하고, 점진적 확장과 짧은 문맥 재조정으로 원래 성능도 회복시킨다.',

context:'[RoPE](#/p/rope)는 회전 위치 인코딩으로 상대 거리를 인코딩하지만, 학습 때 본 적 없는 위치(예: 4k 학습 모델의 8k 이후)에 그대로 쓰면 값이 극단으로 치솟는 "catastrophic value"가 생겨 성능이 무너진다. [위치 보간](#/p/position-interpolation)(PI)은 새 위치를 학습 범위 안으로 균등하게 눌러 넣고, [YaRN](#/p/yarn)은 RoPE 차원을 주파수별로 세 그룹으로 나눠 사람이 정한 규칙(고주파는 외삽, 저주파는 보간)으로 처리한다. 두 방법 모두 확장 비율이 커질수록(특히 128k를 넘어서면) 성능이 급격히 떨어지고, 확장을 하고 나면 원래의 짧은 문맥 성능도 함께 나빠진다는 공통 문제가 있었다. 이 논문은 "사람이 정한 규칙이 최적인가?"라는 질문에서 출발한다.',

ideas:[
 {h:'두 가지 비균일성: RoPE 차원과 토큰 위치',
  lead:'차원마다, 그리고 처음 몇 개 토큰이냐 아니냐에 따라 보간을 다르게 줘야 perplexity가 크게 줄어든다.',
  d:'RoPE의 각 차원마다 최적의 보간 계수 $\\lambda_i$를 탐색으로 찾으면(사람 규칙 없이) LLaMA2-7B의 PG19 perplexity가 PI의 10.65에서 9.37로, Proof-pile은 3.65에서 3.45로 떨어진다(Table 1). 또한 시작 토큰 몇 개($\\hat n$개)는 attention 점수를 많이 받는 [StreamingLLM](#/p/streaming-llm)의 관찰과 같은 이유로 **보간을 아예 하지 않는 것**이 유리하다는 것도 확인했다(Table 2) — 차원 축과 위치 축, 두 축 모두에서 비균일성이 존재한다는 것이 첫 번째 발견이다.'},
 {h:'진화 탐색으로 비균일 계수를 직접 찾는다',
  lead:'사람이 정한 주파수 그룹 규칙 대신, perplexity를 목적함수로 삼아 유전 알고리즘으로 계수를 탐색한다.',
  d:'각 RoPE 차원의 rescale factor $\\hat\\lambda_i$와 보간을 생략할 시작 토큰 수 $\\hat n$을 탐색 변수로 두고, PG19 검증 샘플의 perplexity를 최소화하는 방향으로 돌연변이·교차를 반복한다(Algorithm 1). $\\lambda_i$가 차원 $i$에 대해 단조증가한다는 제약만 걸어 탐색 공간을 줄인다. 목표 윈도우 크기(256k 등)가 클수록 개체군·변이 크기를 줄여 탐색 비용을 관리한다.'},
 {h:'점진적 확장: 4k → 256k(파인튜닝) → 2048k(재탐색)',
  lead:'한 번에 2048k로 파인튜닝하지 않고, 256k까지 학습한 뒤 그 위에 다시 탐색만으로 8배를 더 늘린다.',
  d:'긴 텍스트 자체가 희귀하고 2048k 길이로 직접 파인튜닝하는 것은 비용이 크다. 그래서 먼저 128k, 이어서 256k까지만 파인튜닝(RedPajama, 최대 1k 스텝)하고, 그 체크포인트 위에 **다시 진화 탐색**을 적용해 파인튜닝 없이 2048k(최종 확장비 512배)까지 늘린다. 비균일 보간이 좋은 초기화를 제공하기 때문에 직접 256k로 파인튜닝하는 것보다 이 경로가 더 효율적이었다.'},
 {h:'짧은 문맥 성능의 재조정',
  lead:'긴 문맥으로 확장한 뒤 8k 이하 짧은 문맥에서 별도로 재탐색해 원래 성능을 되살린다.',
  d:'512배 확장 비율에서는 원래 4k 윈도우 안의 위치들이 지나치게 좁은 영역에 몰려(crowded) 짧은 문맥 성능이 떨어지는 부작용이 생긴다. LongRoPE는 확장된 모델 위에서 4k·8k 같은 짧은 길이에 대해 **별도의 진화 탐색**을 한 번 더 돌려 rescale factor를 다시 찾고, 추론 시 입력 길이에 따라 이 짧은-문맥용 계수와 긴-문맥용 계수를 동적으로 전환한다.'}
],

diagram:{type:'compare', cap:'위치 보간 방식의 차이 — PI/YaRN은 규칙을 사람이 정하고, LongRoPE는 탐색으로 찾는다.',
 left:{t:'PI / YaRN', items:['전 차원에 같은 비율로 축소(PI)','주파수 3그룹, 사람이 규칙 지정(YaRN)','128k 근처부터 급격히 성능 저하']},
 right:{t:'LongRoPE', items:['차원별·위치별 계수를 진화 탐색으로 탐색','256k 파인튜닝 후 2048k까지 재탐색만으로 확장','짧은 문맥용 계수를 별도 재탐색']}},

math:[
 {expr:'RoPE(n)_i = [cos(I(λ̂_i, n̂) · β_n^i), sin(I(λ̂_i, n̂) · β_n^i)],   I(λ̂_i, n̂) = 1 if n<n̂ else 1/λ̂_i',
  tex:'\\text{RoPE}(n)_i=\\Big[\\cos\\!\\big(I(\\hat\\lambda_i,\\hat n)\\cdot\\beta_n^{i}\\big),\\ \\sin\\!\\big(I(\\hat\\lambda_i,\\hat n)\\cdot\\beta_n^{i}\\big)\\Big],\\quad I(\\hat\\lambda_i,\\hat n)=\\begin{cases}1 & n<\\hat n\\\\ \\tfrac{1}{\\hat\\lambda_i} & n\\ge \\hat n\\end{cases}',
  d:'차원 $i$마다 다른 rescale factor $\\hat\\lambda_i$를 쓰고, 위치가 임계값 $\\hat n$ 미만이면 아예 보간을 적용하지 않는다(원래 회전각 $\\beta_n^i$ 그대로). 두 비균일성(차원·위치)을 하나의 식에 담은 것이 LongRoPE의 핵심 정식화다.'}
],

numbers:[
 {k:'최대 컨텍스트', v:'2,048k 토큰(약 200만)', d:'LLaMA2-7B·Mistral-7B에 적용, Books3 데이터셋으로 검증'},
 {k:'파인튜닝 스텝', v:'최대 1k 스텝(≤256k 학습 길이)', d:'2048k까지는 그 이후 추가 파인튜닝 없이 진화 탐색만으로 확장'},
 {k:'비파인튜닝 확장비', v:'8×', d:'파인튜닝 없이 비균일 보간 탐색만으로 확장 가능한 비율(더 큰 목표는 파인튜닝 필요)'},
 {k:'최종 확장비', v:'512×', d:'4k 사전학습 → 2048k, 256k 파인튜닝 체크포인트에서 2차 탐색으로 도달'},
 {k:'PG19 PPL 개선(비파인튜닝)', v:'10.65 → 9.37', d:'LLaMA2-7B, 8192 컨텍스트, PI 대비 차원별 탐색 적용 시(Table 1)'},
 {k:'256k 이내 성능', v:'16배 긴 윈도우로도 SOTA 상회', d:'Proof-pile/PG19에서 LongRoPE-2048k가 256k 이내 평가 길이에서 Together-32k·YaRN 등보다 낮은 perplexity(Table 5)'}
],

impact:'컨텍스트 확장을 "어떤 보간 규칙이 이론적으로 그럴듯한가"의 문제에서 "탐색으로 무엇이 실제로 perplexity를 낮추는가"의 문제로 바꿨다. 아키텍처 변경 없이 RoPE의 rescale factor만 바꾸는 것이라 기존 최적화([FlashAttention](#/p/flashattention) 등)를 그대로 재사용할 수 있고, 최초로 200만 토큰대 컨텍스트를 보고한 논문이 됐다. 다만 긴 문맥으로의 확장과 짧은 문맥 성능 유지가 트레이드오프 관계에 있다는 것을 명시적으로 다룬 최초의 논문 중 하나이기도 하다 — 확장 후 재조정이라는 2단계 절차 자체가 이후 장문맥 연구의 표준적 관행이 됐다.',

legacy:[
 '**YaRN·PI 계열의 자동화** — 사람이 정한 주파수 그룹(YaRN) 대신 탐색으로 rescale factor를 찾는 방식이, 이후 위치 인코딩 확장 연구에서 수작업 규칙을 탐색/학습 기반으로 대체하는 흐름의 계기가 됨',
 '**"짧은 문맥 회귀" 문제의 명시화** — 긴 문맥 확장 후 원래 길이 성능이 떨어지는 현상을 별도로 측정·재조정한 절차가, 이후 장문맥 벤치마크가 짧은/긴 문맥 성능을 함께 보고하게 만드는 계기',
 '**KV 캐시 압축과 결합 가능한 별개 축** — LongRoPE는 위치 인코딩만 다루고 캐시 메모리는 그대로 키우므로, [H2O](#/p/h2o)·[StreamingLLM](#/p/streaming-llm)류의 캐시 축출과 결합해야 실제 200만 토큰 서빙이 현실적이라는 후속 논의로 이어짐'
],

pitfalls:[
 '**"200만 토큰까지 처리한다"는 perplexity가 낮게 유지된다는 뜻이지, 그 길이의 정보를 전부 검색·추론할 수 있다는 뜻이 아니다.** 논문은 Passkey retrieval 같은 검색형 과제도 함께 보고하지만, 핵심 수치인 Books3/PG19/Proof-pile perplexity는 언어모델링 지표이지 Needle-in-a-Haystack류의 정밀 검색 성능과는 별개다.',
 '**Mistral과 LLaMA2의 2048k 확장 결과가 다르다.** 논문 스스로 밝히듯 Mistral-7B는 짧은 길이에서는 우수하지만 256k를 넘어서면 perplexity가 7을 넘어가고, LLaMA2는 1024k~2048k에서 완만하게만 perplexity가 오른다 — "LongRoPE를 적용하면 어떤 모델이든 2048k까지 안정적"이라고 일반화하면 안 된다.',
 '**진화 탐색은 목표 윈도우 크기마다 다시 돌려야 하는 비용이다.** 256k 탐색과 짧은 문맥(4k/8k) 재조정 탐색이 별도 단계로 필요하고, 탐색 자체가 다수의 perplexity 평가를 반복하는 최적화 루프라 새로운 모델·목표 길이마다 이 탐색을 재실행해야 한다.'
],

figures:[
 {f:'fig2-nonuniform-interp.png',
  cap:'위쪽: RoPE를 학습 범위 밖(빨간 영역)으로 그대로 외삽하면 주기가 깨진다. 중간: 위치 보간(PI)은 전체를 균등하게 눌러 넣는다(초록 점). 아래: LongRoPE는 차원마다(파란·보라·초록 선) 다른 주기로 보간하고, 맨 앞 구간(하늘색)은 아예 보간하지 않는다.',
  src:'원문 Figure 2, p.3'}
],

quotes:[
 {t:'This paper introduces LongRoPE that, for the first time, extends the context window of pre-trained LLMs to an impressive 2048k tokens, with up to only 1k fine-tuning steps.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2402.13753 — LongRoPE: Extending LLM Context Window Beyond 2 Million Tokens', u:'https://arxiv.org/abs/2402.13753'},
 {t:'GitHub — microsoft/LongRoPE', u:'https://github.com/microsoft/LongRoPE'}
]
});
