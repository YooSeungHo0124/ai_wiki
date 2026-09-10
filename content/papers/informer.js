WIKI.paper({
slug:'informer',
venue:'AAAI 2021 (Best Paper)',
authors:'Zhou, Zhang, Peng, Zhang, Li, Xiong, Zhang (北航 · UC Berkeley · Rutgers · 하와이대)',
arxiv:'2012.07436',

tldr:'긴 시퀀스 시계열 예측(LSTF)에서 [Transformer](#/p/transformer)의 세 가지 병목 — $O(L^2)$ 어텐션, 층을 쌓을수록 늘어나는 메모리, 한 토큰씩 순차 생성하는 느린 디코딩 — 을 **ProbSparse 어텐션·distilling·생성식 디코더**로 동시에 공략한 논문. AAAI 2021 최우수 논문이다.',

context:'2020년까지 시계열 예측에 Transformer를 쓰려는 시도는 있었지만 전부 짧은 예측 구간에 머물렀다. 원인은 명확하다. [Transformer](#/p/transformer)의 self-attention은 모든 토큰 쌍의 내적을 계산하므로 시퀀스 길이 $L$ 에 대해 시간·메모리가 $O(L^2)$ 로 늘고, 인코더-디코더를 $J$ 층 쌓으면 메모리가 $O(J \\cdot L^2)$ 로 더 불어난다. 게다가 디코더가 [RNN](#/p/lstm)처럼 토큰을 하나씩 순차 생성(dynamic decoding)하면 추론 속도가 그대로 RNN 수준으로 느려진다. 전력 변압기 온도처럼 며칠~몇 주 앞을 내다봐야 하는 실무 예측(long sequence time-series forecasting, LSTF)에서는 입력·출력 길이가 곧 수백~수천이 되므로 이 세 병목이 그대로 벽이 된다.',

ideas:[
 {h:'쿼리 희소성 측정으로 "중요한 쿼리"만 골라낸다',
  lead:'attention 점수 분포가 균등에서 먼 쿼리일수록 정보가 많다고 보고 그 정도를 KL 근사로 측정한다.',
  d:'대부분의 쿼리는 attention 분포가 거의 균등해 값들을 그냥 평균 내는 것과 다르지 않다 — 이런 쿼리는 계산해도 얻는 정보가 적다. 저자들은 쿼리 $q_i$ 의 attention 분포가 균등분포에서 얼마나 먼지를 측정하는 희소성 지표 $M(q_i,K)$ 를 정의하고, 이것이 attention이 실제로 "뾰족한"(informative) 쿼리를 가려낸다는 것을 이론적으로(Lemma 1) 보인다.'},
 {h:'ProbSparse self-attention: 상위 u개 쿼리만 계산',
  lead:'희소성 상위 $u=c\\ln L_Q$ 개 쿼리만 전체 key와 어텐션하고 나머지는 평균으로 채운다.',
  d:'전체 $L_Q \\times L_K$ 쌍을 다 계산하는 대신, 무작위 샘플로 희소성 근사치 $\\bar M$ 을 구한 뒤 top-$u$ 쿼리만 골라 실제 softmax attention을 계산한다. 나머지 쿼리의 출력은 값들의 평균(residual 입력)으로 대체한다. 그 결과 시간·메모리 복잡도가 $O(L^2)$ 에서 **$O(L\\ln L)$** 로 줄어든다.'},
 {h:'Self-attention distilling: 층마다 시퀀스 길이를 절반으로',
  lead:'인코더 층 사이에 conv+pooling을 넣어 다음 층으로 갈수록 시퀀스 길이를 절반씩 줄인다.',
  d:'각 인코더 층 출력에 1D 컨볼루션과 max-pooling(stride 2)을 적용해 지배적인 특징만 다음 층에 넘기고 나머지는 버린다. 이러면 $J$ 층을 쌓아도 총 메모리가 $O(J L^2)$ 대신 $O((2-\\epsilon)L\\ln L)$ 로 억제되고, 피라미드처럼 좁아지는 인코더 구조(Fig.2의 사다리꼴)가 만들어진다.'},
 {h:'생성식 디코더: 한 번의 forward로 전체 구간을 출력',
  lead:'디코더에 정답 시작 토큰과 0으로 채운 미래 자리를 한 번에 넣어 전체 예측을 단일 forward로 뽑는다.',
  d:'기존 인코더-디코더는 토큰을 하나씩 만들어 다음 입력으로 되먹이는 dynamic decoding을 쓰는데, 이는 길이만큼 순차 단계를 거쳐야 해서 느리고 오차가 누적된다. Informer는 디코더 입력을 `[X_token(최근 관측), X_0(0으로 채운 미래 자리)]` 로 구성해, **한 번의 forward pass**로 전체 예측 시퀀스를 동시에 출력한다.'}
],

diagram:{type:'compare', cap:'바닐라 Transformer가 갖는 세 병목과 Informer의 대응.',
 left:{t:'바닐라 Transformer', items:['self-attention O(L²)','J층 쌓으면 메모리 O(J·L²)','디코더가 토큰별 순차 생성']},
 right:{t:'Informer', items:['ProbSparse attention O(L ln L)','distilling으로 층마다 절반 축소','생성식 디코더 1회 forward']}
 },

math:[
 {expr:'M(q_i, K) = max_j{q_i k_jᵀ/√d} - (1/L_K)Σ_j q_i k_jᵀ/√d',
  tex:'\\overline{M}(q_i, K) = \\max_j\\left\\{\\frac{q_i k_j^{\\top}}{\\sqrt{d}}\\right\\} - \\frac{1}{L_K}\\sum_{j=1}^{L_K}\\frac{q_i k_j^{\\top}}{\\sqrt{d}}',
  d:'쿼리 희소성의 실용적 근사치(식 4). 최대 유사도와 평균 유사도의 차이가 클수록 그 쿼리의 attention이 소수의 key에 집중돼 있다는 뜻이며, 이런 쿼리만 top-u로 골라낸다.'},
 {expr:'A(Q,K,V) = softmax( Q̄Kᵀ/√d ) V',
  tex:'\\mathcal{A}(Q,K,V) = \\text{Softmax}\\!\\left(\\frac{\\overline{Q}K^{\\top}}{\\sqrt{d}}\\right)V',
  d:'$\\overline Q$ 는 top-$u$ 쿼리만 남긴 희소 행렬. 이 식 하나가 ProbSparse self-attention의 전부이며, 나머지 쿼리 출력은 값들의 평균으로 채워진다.'},
 {expr:'u = c · ln(L_Q),  총 복잡도 O(L ln L)',
  tex:'u = c\\cdot \\ln L_Q, \\qquad \\text{Time/Space} = \\mathcal{O}(L\\ln L)',
  d:'샘플링 상수 $c$ 로 top-u 쿼리 개수를 조절한다. $L_Q=L_K=L$ 일 때 전체 ProbSparse attention의 시간·공간 복잡도가 $O(L\\ln L)$ 로 수렴한다.'}
],

numbers:[
 {k:'복잡도', v:'O(L²) → O(L log L)', d:'시간·메모리 모두. distilling까지 포함하면 층당 메모리는 O((2-ε)L log L)'},
 {k:'ETTh1 멀티변량 MSE·MAE (horizon 336)', v:'1.128 · 0.873', d:'ETT(변압기 온도) 데이터셋, horizon 336. LSTMa(1.424) 등 RNN 계열보다 우수 (Table 2)'},
 {k:'ETTh1 멀티변량 MSE (horizon 720)', v:'1.215', d:'Reformer 2.415, LSTnet 2.143 대비 큰 폭으로 낮음 — 긴 horizon일수록 격차가 커짐 (Table 2)'},
 {k:'전체 승수(winning-count)', v:'Informer 32 vs Informer† 12 vs 나머지 합 3', d:'Table 2 멀티변량 실험 전체(4개 데이터셋 × 5개 horizon)에서 최저 오차를 기록한 횟수'},
 {k:'실험 데이터셋', v:'ETTh1 / ETTh2 / ETTm1 · ECL(321고객) · Weather', d:'horizon은 데이터셋별로 {24,48,168,336,720} 또는 {24,48,96,288,672} 등으로 다름'},
 {k:'인코더 구조', v:'3층 스택 + 1층(1/4 입력) 스택, 디코더 2층', d:'distilling으로 층마다 시퀀스 길이가 절반씩 줄어드는 피라미드형 인코더'}
],

impact:'"Transformer는 시계열에 안 맞는다"는 통념에, **어텐션 자체를 바꾸면 맞을 수 있다**는 답을 던졌다. ProbSparse로 $O(n^2)$ 을 깨는 접근은 [Sparse Transformer](#/p/sparse-attn)·[Linformer](#/p/linformer) 계열과 같은 문제의식을 시계열에 최초로 본격 적용한 사례이며, 이후 [Autoformer](#/p/autoformer)·[PatchTST](#/p/patchtst) 등 "Transformer 기반 장기 시계열 예측" 이라는 하나의 하위분야를 열었다. 동시에 이 성공은 곧이어 [DLinear](#/p/dlinear)의 정면 반박(선형 모델 하나가 이 모든 걸 이긴다)을 촉발하는 계기가 된다.',

legacy:[
 '**Transformer 기반 장기 시계열 예측(LTSF) 분야를 개시** — [Autoformer](#/p/autoformer), [PatchTST](#/p/patchtst)가 모두 이 논문의 벤치마크(ETT/ECL/Weather)와 문제 설정(LSTF)을 그대로 계승',
 '**어텐션 근사 계열과의 접점** — ProbSparse는 시계열 도메인에서 $O(n\\log n)$ 어텐션을 실증한 사례로 [희소 attention](#/p/sparse-attn) 연구 계보에 편입',
 '**"성능 향상이 진짜인가"라는 반박을 촉발** — [DLinear](#/p/dlinear) 논문이 이 논문을 포함한 Transformer 계열의 실험 설정 자체를 문제 삼으며 시계열 Transformer 붐에 제동을 걸었다',
 '**생성식 디코더 아이디어의 확산** — 한 번의 forward로 전체 시퀀스를 내는 방식이 이후 시계열 Transformer들의 기본 설계가 됨'
],

pitfalls:[
 '**ProbSparse는 "모든 쿼리를 본다"가 아니다.** top-u 외 나머지 쿼리는 값의 평균으로 대체되므로, 희소성 측정이 놓치는 드문 패턴(rare event)은 정보 손실이 발생할 수 있다.',
 '**멀티변량 실험은 모든 변수를 한 채널 집합으로 함께 넣는다(channel-mixing).** 이는 후일 [PatchTST](#/p/patchtst)가 지적하는 "채널 독립"과 반대 설계이며, 변수 간 스케일 차이가 큰 데이터에서는 불리할 수 있다.',
 '**"O(L log L)이니 항상 빠르다"로 오해하기 쉽다.** 이는 어텐션 연산 자체의 점근 복잡도이고, distilling·다층 구조·top-u 선택 등 부가 연산이 실제 wall-clock 이득 폭을 좌우한다 — 논문의 속도 이득은 특정 하드웨어·배치 설정에서의 실측치다.'
],

figures:[
 {f:'fig2-architecture.png',
  cap:'왼쪽 인코더: 사다리꼴로 갈수록 좁아지는 것이 self-attention distilling(층마다 시퀀스 길이 절반 축소)이고, 위아래 두 병렬 인코더가 서로 다른 길이의 입력을 처리하는 replica다. 오른쪽 디코더: 아래쪽 회색/흰 칸이 실제 관측(X_token)+0으로 채운 미래 자리(X_0)이고, 위쪽 주황 칸이 한 번의 forward로 동시에 나온 예측값이다.',
  src:'원문 Figure 2, p.2'}
],

quotes:[
 {t:'We design an efficient transformer-based model for LSTF, named Informer, with three distinctive characteristics: (i) a ProbSparse self-attention mechanism, which achieves O(L log L) in time complexity and memory usage.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2012.07436 — Informer', u:'https://arxiv.org/abs/2012.07436'},
 {t:'공식 코드 (zhouhaoyi/Informer2020)', u:'https://github.com/zhouhaoyi/Informer2020'}
]
});
