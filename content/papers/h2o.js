WIKI.paper({
slug:'h2o',
venue:'NeurIPS 2023',
authors:'Zhang, Sheng et al. (UT Austin · Stanford · Meta AI FAIR · CMU)',
arxiv:'2306.14048',

tldr:'생성 중 attention 점수가 **소수의 토큰(heavy hitter)에 몰린다**는 관찰에서, KV 캐시의 대부분을 버려도 정확도가 거의 그대로라는 것을 보인 논문. "최근 토큰 + 누적 attention 점수가 높은 토큰"만 남기는 동적 축출 정책으로 캐시를 최대 20%까지 줄인다.',

context:'[FlashAttention](#/p/flashattention)은 attention **계산**을 빠르게 만들었지만, 생성 단계에서 매 스텝 재계산을 피하려고 쌓아두는 **KV 캐시**는 그대로 시퀀스 길이·배치 크기에 비례해 자란다. 30B 모델에 배치 128·시퀀스 1024만 돼도 KV 캐시가 180GB에 달해, 파라미터보다 캐시가 메모리 병목이 되는 역전이 일어난다. 캐시를 줄이는 가장 단순한 방법은 오래된 토큰을 그냥 버리는 것이지만, 어떤 토큰을 버려도 안전한지가 문제다. 이 논문은 "버려도 되는 토큰을 어떻게 고를 것인가"에 답한다.',

ideas:[
 {h:'Attention은 이미 희소하다',
  lead:'사전학습된 LLM의 attention 행렬이 95% 넘게 희소하다는 관찰이 출발점이다.',
  d:'OPT·LLaMA·GPT-NeoX를 Wiki-Text-103으로 zero-shot 추론시켜 attention 점수 행렬을 보면, 각 행 최댓값의 1%를 임계값으로 잡아도 거의 모든 층에서 **95% 이상이 0에 가깝다**. dense하게 학습됐는데도 실제로 참조되는 KV는 소수라는 뜻이고, 이것이 캐시를 줄여도 될 것이라는 첫 번째 근거다.'},
 {h:'Heavy Hitter: 누적 attention을 오래 받는 소수의 토큰',
  lead:'단어의 co-occurrence 빈도와 강하게 상관된 소수 토큰이 attention 대부분을 가져간다.',
  d:'토큰별로 attention 점수를 누적(accumulate)해 보면, 소수 토큰(H2, Heavy Hitter)이 전체 점수의 대부분을 차지하고 이 현상은 데이터 안에서 그 단어가 다른 단어와 함께 등장하는 빈도(co-occurrence)와 강하게 상관된다. 같은 heavy hitter를 지우면(w.o. heavy hitter) 정확도가 크게 떨어져, 이 소수 토큰들이 실제로 예측에 기여함을 확인했다.'},
 {h:'H2O 축출: 최근 토큰 + heavy hitter를 동적으로 유지',
  lead:'캐시가 꽉 차면 누적 attention 점수가 가장 낮은 토큰 하나를 매 스텝 교체한다.',
  d:'캐시 예산을 $k$로 고정하고, 새 토큰이 들어올 때마다 현재 캐시 $S_{i-1}\\cup\\{i\\}$ 중 누적 점수 $F_{score}$가 가장 낮은 토큰 하나를 **탐욕적으로** 빼서 $S_i$를 유지한다(Algorithm 1). 스텝마다 최대 1개만 교체하므로 최근 토큰(recency)과 heavy hitter(importance)가 자연스럽게 섞여 남는다. "최근 토큰만" 남기는 Local 전략은 이 논문에서 별도 비교 대상으로 실패한다.'},
 {h:'동적 submodular 문제로의 정식화',
  lead:'축출을 dynamic submodular maximization으로 formalize해 탐욕 알고리즘의 근사 보장을 증명한다.',
  d:'점수 함수 $F_{score}$가 submodular라는 가정 아래, 매 스텝 탐욕적으로 최선의 부분집합을 고르는 것이 전역 최적 대비 $(1-\\alpha)(1-1/e)$ 배 이상을 보장한다는 정리(Theorem 4.4, informal)를 제시한다. 실험적 관찰(희소성 + heavy hitter)에 이론적 근거를 붙인 것이 이 논문의 차별점이다.'},
 {h:'기존 정적 sparse attention과 결합 가능',
  lead:'strided/fixed sparse attention에 H2O를 얹으면 20% 예산에서도 무너지지 않는다.',
  d:'[Sparse Transformer](#/p/sparse-transformers)류의 고정 패턴(strided, fixed) sparsity는 20% 캐시 예산에서 정확도가 최대 35%p까지 붕괴한다. 여기에 H2O의 heavy-hitter 선택을 결합하면 같은 예산에서 full KV에 가까운 성능을 회복한다 — H2O는 새 아키텍처가 아니라 **기존 축출·희소화 기법에 얹을 수 있는 정책**이라는 점을 보여준다.'}
],

diagram:{type:'flow', cap:'디코딩 스텝마다 캐시가 꽉 차면 누적 attention 점수가 가장 낮은 토큰 하나를 빼고 새 토큰을 넣는다.',
 nodes:[
  {t:'새 토큰 생성', s:'Q_i, K_i 계산'},
  {t:'캐시 가득?', s:'|S|=k'},
  {t:'점수 계산', s:'누적 attention 합', acc:true},
  {t:'최저 점수 축출', s:'1개만 제거'},
  {t:'다음 스텝', s:'recent+heavy 유지'}
 ]},

math:[
 {expr:'F_score(T) = Σ_{s∈T} o_s,   u = argmax_{v∈S_{i-1}∪{i}} F_score(S_{i-1}∪{i}\\{v})',
  tex:'F_{score}(T)=\\sum_{s\\in T} o_s,\\qquad u=\\operatorname*{arg\\,max}_{v\\in S_{i-1}\\cup\\{i\\}} F_{score}\\big((S_{i-1}\\cup\\{i\\})\\setminus\\{v\\}\\big)',
  d:'매 스텝 각 후보 토큰을 뺐을 때 남는 집합의 누적 점수가 최대가 되는 $v$를 고른다 — 뒤집으면 "뺐을 때 점수 손실이 가장 작은 토큰"을 남긴다는 뜻이라, 결과적으로 누적 점수가 가장 낮은 토큰이 축출된다.'},
 {expr:'f(S̃_i) ≥ (1-α)(1-1/e) max_{|S|=k} f(S) − β',
  tex:'f(\\widetilde S_i) \\geq (1-\\alpha)\\left(1-\\tfrac{1}{e}\\right)\\max_{|S|=k} f(S) - \\beta',
  d:'탐욕 알고리즘이 만든 캐시 집합이, submodular 가정 아래 전역 최적 대비 $(1-1/e)$ 근사 보장(고전적 탐욕 submodular maximization 상수)에 근접함을 보이는 정리. $\\alpha,\\beta$는 근사 오차를 흡수하는 완화 항.'}
],

numbers:[
 {k:'KV 캐시 예산', v:'20%', d:'전체 시퀀스 길이 대비 유지하는 KV 비율. 이 예산에서 대부분 태스크가 full KV와 comparable'},
 {k:'메모리 절감', v:'5~10×', d:'정확도 저하 없이 KV 캐시 메모리 footprint를 줄인 배수(OPT·LLaMA·GPT-NeoX, 6.7B~175B)'},
 {k:'처리량 향상', v:'최대 29×/29×/3×', d:'OPT-6.7B·30B에서 각각 DeepSpeed ZeRO-Inference·HF Accelerate·FlexGen 대비 (20% H2O)'},
 {k:'지연시간 감소', v:'1.1~1.9×', d:'동일 배치 크기에서 FlexGen 대비 (A100, 시퀀스 4K~10K)'},
 {k:'attention 희소성', v:'>95%', d:'OPT/LLaMA/GPT-NeoX 거의 모든 층에서, 행 최댓값의 1%를 임계값으로 측정'},
 {k:'정적 sparsity 붕괴폭', v:'최대 35%p', d:'strided/fixed Sparse Transformer가 20% 예산에서 H2O 없이 실패하는 정확도 낙폭'}
],

impact:'"attention이 소수 토큰에 집중된다"는 관찰을 **캐시를 버려도 되는 근거**로 직접 연결해, KV 캐시 관리를 "전부 보관"에서 "정책적으로 선택"의 문제로 바꿨다. FlexGen 위에 얹은 구현만으로 기존 추론 시스템 대비 최대 29배 처리량을 보이며, 이후 나온 모든 KV 캐시 압축·축출 연구의 공통 출발점(축출 기준=누적/최근 attention 점수)이 됐다. 다만 저자들 스스로도 이는 **정책(policy)**이지 아키텍처 변경이 아니라서, 서빙 시스템 어디에나 얹을 수 있다는 점이 실용적 impact의 핵심이다.',

legacy:[
 '**어텐션 싱크와의 대비** — [StreamingLLM](#/p/streaming-llm)은 비슷한 "몇 개만 남긴다" 아이디어를 초기 토큰 고정으로 단순화해, H2O의 동적 점수 계산 비용 없이 무한 스트리밍을 가능하게 했다',
 '**축출 정책의 세분화** — 이후 연구들이 헤드별·레이어별로 다른 예산을 주거나(비균일 축출), 양자화와 결합하는 방향으로 H2O의 "recent+heavy" 골격을 확장',
 '**서빙 스택에 흡수** — [vLLM/PagedAttention](#/p/vllm) 계열 서빙 엔진이 캐시 관리 정책의 하나로 heavy-hitter류 축출을 옵션으로 흡수하는 흐름의 시작점',
 '**이론적 근거 제시의 선례** — submodular maximization으로 탐욕 축출을 정당화한 방식이, 이후 캐시 정책 논문들이 실험 관찰에 이론적 보장을 덧붙이는 관행에 영향'
],

pitfalls:[
 '**"20% 캐시로 성능 유지"는 다운스트림 분류·QA 태스크 기준이다.** 긴 문서 안의 특정 사실을 정확히 짚어내야 하는 검색형 과제(Needle-in-a-Haystack류)에서는 축출된 토큰이 하필 필요한 정보를 담고 있으면 영구히 사라진다 — 논문이 검증한 벤치마크(COPA, PiQA, XSUM 등)는 이런 실패를 직접 측정하지 않는다.',
 '**축출은 되돌릴 수 없다.** 한 번 버린 KV는 재계산 없이는 복구되지 않으므로(Implementation Details에서 명시), 이후 스텝에서 그 토큰이 다시 중요해져도 접근할 수 없다. "긴 문맥을 처리한다"가 "그 문맥 전체를 계속 기억한다"를 뜻하지 않는다.',
 '**Local(최근 토큰만 유지) 전략은 실제로 무너진다.** heavy hitter 없이 recency만으로는 60% 예산에서도 특정 태스크(LLaMA-13B+XSUM 등)가 붕괴했다 — "최근 것만 남기면 되지 않냐"는 직관이 이 논문의 실험으로 반박된 지점이다.'
],

figures:[
 {f:'fig2-sparsity-ablation.png',
  cap:'(a) 층별 attention 희소성 — 거의 모든 모델·층에서 95% 이상. (b) x축은 어휘 속 단어 인덱스, 빨간 점은 그 단어가 받은 누적 attention 점수, 회색 곡선은 co-occurrence 빈도 — 둘이 같은 모양으로 치솟는다(heavy hitter=고빈도 단어). (c) heavy hitter를 지우면(빗금) 정확도가 크게 떨어짐.',
  src:'원문 Figure 2, p.4'},
 {f:'fig3-eviction-algo.png',
  cap:'디코딩 스텝 4→5 사이, 캐시 예산 3인 상태에서 X 표시된 토큰(3번째)의 KV가 누적 attention 점수가 가장 낮아 축출되는 과정. 오른쪽 파란 상자가 각 토큰의 누적 점수 합.',
  src:'원문 Figure 3, p.6'}
],

quotes:[
 {t:'we find that (i) the emergence of H2 is natural and strongly correlates with the frequent co-occurrence of tokens in the text, and (ii) removing them results in significant performance degradation',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2306.14048 — H2O: Heavy-Hitter Oracle', u:'https://arxiv.org/abs/2306.14048'},
 {t:'GitHub — FMInference/H2O', u:'https://github.com/FMInference/H2O'}
]
});
