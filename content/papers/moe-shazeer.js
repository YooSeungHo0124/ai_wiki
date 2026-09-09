WIKI.paper({
slug:'moe-shazeer',
venue:'ICLR 2017',
authors:'Shazeer, Mirhoseini, Maziarz et al. (Google Brain · Jagiellonian U.)',
arxiv:'1701.06538',

tldr:'모델의 **파라미터 수와 토큰당 연산량을 분리**한 논문. 수천 개의 전문가(expert) 네트워크 중 입력마다 몇 개만 켜는 sparsely-gated MoE 층으로, MoE 층 하나에 최대 1370억 파라미터를 넣으면서도 연산량은 거의 그대로 유지했다.',

context:'2017년 초까지 "모델을 키운다"는 곧 "모든 예제가 모든 파라미터를 통과한다"는 뜻이었고, 따라서 학습 비용은 모델 크기 × 데이터 크기로 **거의 제곱으로** 불어났다. 조건부 연산(conditional computation) — 예제별로 네트워크의 일부만 켜자는 아이디어 — 는 2013년부터 이론적으로 제안돼 있었지만 실제로 이득을 낸 사례가 없었다. 이유는 공학적이다. GPU는 분기보다 산술에 압도적으로 유리하고, 전문가를 $n$ 개로 쪼개면 각 전문가가 받는 배치가 $n$ 분의 1로 쪼그라들어(shrinking batch problem) 효율이 무너지며, 게이팅 네트워크는 소수의 전문가만 편애하도록 자기강화적으로 수렴한다. 이 논문은 이 세 문제를 한꺼번에 실무적으로 푼 첫 사례다.',

ideas:[
 {h:'Noisy Top-K Gating — 미분 가능한 희소 라우팅',
  lead:'점수 상위 k개만 남기고 나머지를 0으로 죽여 라우터를 역전파로 학습시킨다.',
  d:'게이팅 네트워크가 $n$ 개 전문가에 대한 점수를 내고, **상위 $k$ 개만 남긴 뒤 나머지는 $-\\infty$ 로 설정**해 softmax를 통과시킨다. 나머지 전문가의 게이트 값은 정확히 0이 되므로 그 전문가는 아예 계산하지 않는다. 점수에 학습 가능한 크기의 가우시안 노이즈를 더하는 것이 "Noisy" 부분으로, 부하 분산과 탐색을 동시에 돕는다. $k>1$ 이면 상위 전문가들의 게이트 값이 게이팅 가중치에 대해 미분 가능하므로 라우터가 역전파로 함께 학습된다.'},
 {h:'배치가 쪼그라드는 문제를 병렬화 구조로 푼다',
  lead:'전문가는 모델 병렬로 디바이스마다 배치해 전문가당 배치 크기를 회복한다.',
  d:'전문가가 $n$ 개, 배치 크기 $b$, top-$k$ 라면 각 전문가는 평균 $kb/n$ 개 예제만 받는다. 논문은 표준 층과 게이팅은 **데이터 병렬**로 두고 전문가는 **모델 병렬**로 각 디바이스에 하나씩만 두는 혼합 방식을 쓴다. $d$ 개 디바이스가 각각 크기 $b$ 배치를 처리하면 전문가 하나가 받는 배치는 $kbd/n$ 이 되어, 디바이스를 늘리는 것만으로 전문가 배치 크기가 $d$ 배 회복된다. 여기에 RNN의 모든 타임스텝을 한꺼번에 MoE에 던지는 convolutional 적용으로 배치를 다시 몇 배 키운다.'},
 {h:'부하 분산을 손실 함수로 강제한다',
  lead:'전문가별 게이트 합의 변동계수를 보조 손실로 벌해 승자독식을 막는다.',
  d:'게이팅은 방치하면 승자독식으로 수렴한다 — 자주 뽑힌 전문가가 더 잘 학습되고 그래서 더 자주 뽑힌다. 논문은 배치별 게이트 합을 전문가의 **importance**로 정의하고, 그 값들의 변동계수 제곱 $CV(\\text{Importance})^2$ 을 보조 손실로 추가해 모든 전문가가 비슷한 총 가중치를 받도록 밀어낸다. importance가 같아도 실제 예제 **개수**는 다를 수 있어(적은 예제에 큰 가중치), 개수를 균등하게 만드는 $L_{load}$ 를 별도로 하나 더 둔다.'},
 {h:'전문가는 계층적으로도 쌓을 수 있다',
  lead:'그룹을 먼저 고르고 그룹 안에서 다시 고르는 2단 게이팅으로 확장한다.',
  d:'전문가가 수만 개가 되면 게이팅 네트워크 자체의 분기 비용이 커진다. 그래서 1차 게이팅이 전문가 **그룹**을 고르고, 그룹 안의 2차 게이팅이 개별 전문가를 고르는 2단 계층 MoE를 쓴다. 이 구조로 실험에서 최대 131,072개 전문가까지 밀어붙였다.'},
 {h:'전문가는 실제로 분화한다',
  lead:'학습 후 각 전문가가 특정 어휘·문법 맥락에 반응하도록 자연히 분업한다.',
  d:'전문가 각각은 하나의 은닉층을 가진 평범한 ReLU FFN이다. 그런데 학습 후 관찰하면 각 전문가가 구문·의미적으로 뚜렷하게 전문화된다 — 특정 어휘군이나 문법적 맥락에 반응한다. 즉 라우팅이 임의의 해시가 아니라 **의미 있는 분업**으로 수렴한다는 것이 경험적으로 확인됐다.'}
],

diagram:{type:'split', cap:'MoE 층: 게이팅이 top-k 전문가만 켠다. 전문가 수를 늘리면 파라미터는 늘지만 토큰당 연산량은 그대로다.',
 from:{t:'토큰 표현 x', s:'LSTM 층 사이에 삽입'},
 branches:[{t:'Expert 1', s:'FFN · 약 1M 파라미터'}, {t:'Expert 2', s:'선택됨', acc:true}, {t:'…', s:'최대 131,072개'}, {t:'Expert n', s:'게이트=0 → 계산 생략'}],
 join:'상위 k개(실험에서 k=4)만 활성 · 게이트 가중합으로 결합'},

math:[
 {expr:'y = Σᵢ G(x)ᵢ · Eᵢ(x)',
  tex:'y=\\sum_i G(x)_i \\, E_i(x)',
  d:'MoE 층의 출력. $G(x)_i = 0$ 인 전문가는 $E_i(x)$ 를 아예 계산하지 않아도 되므로, 전문가 수 $n$ 이 커져도 실제 연산량은 $k$ 개분에 머문다. 이것이 파라미터와 연산량을 분리하는 지점이다.'},
 {expr:'H(x)ᵢ = (x·W_g)ᵢ + StandardNormal() · Softplus((x·W_noise)ᵢ),   G(x) = Softmax(KeepTopK(H(x), k))',
  tex:'\\begin{aligned}&H(x)_i=(x\\cdot W_g)_i+\\text{StandardNormal}()\\cdot\\text{Softplus}((x\\cdot W_{noise})_i)\\\\&G(x)=\\text{Softmax}(\\text{KeepTopK}(H(x),k))\\end{aligned}',
  d:'게이팅 점수에 입력에 따라 크기가 학습되는 가우시안 노이즈를 더한 뒤 상위 $k$ 개만 남기고 나머지를 $-\\infty$ 로 만든다. 노이즈 덕분에 경계선에 있는 전문가들이 번갈아 뽑히며 부하가 퍼진다.'},
 {expr:'L_importance(X) = w_importance · CV( Σ_{x∈X} G(x) )²',
  tex:'L_{importance}(X)=w_{importance}\\cdot CV\\!\\left(\\sum_{x\\in X} G(x)\\right)^{2}',
  d:'배치 $X$ 에 대한 전문가별 게이트 합의 변동계수 제곱. 모든 전문가의 총 가중치가 같아지면 0이 된다. 여기에 실제 배정 예제 수를 맞추는 $L_{load}$ 를 더해 최종 손실에 얹는다.'}
],

numbers:[
 {k:'MoE 층 파라미터', v:'최대 137B', d:'2017년 기준. 당시 최대 dense 모델보다 두 자릿수 이상 큼'},
 {k:'용량 증가', v:'> 1000×', d:'"연산 효율은 소폭만 손해 보면서" 모델 용량을 1000배 이상 늘렸다는 것이 논문의 표제 주장'},
 {k:'1B Word Benchmark perplexity', v:'28.0', d:'기존 최고 published 결과 **34.7** 대비. 저예산 MoE는 34.1을 **연산량 6%** 로 달성'},
 {k:'전문가 65,536개', v:'perplexity −39%', d:'100B word 코퍼스에서 연산량이 같은 baseline 대비. 131,072개에서는 오히려 악화 — 과도한 희소성'},
 {k:'층 희소도', v:'99.994%', d:'전문가 65,536개일 때. 그럼에도 0.72 TFLOPS/GPU 유지'},
 {k:'WMT14 EN→FR BLEU', v:'40.56', d:'전문가 2048개 · 총 8.7B 파라미터. GNMT의 39.22를 상회하면서 timestep당 연산은 85M vs 214M'}
],

figures:[
 {f:'fig1-moe-layer.png',
  cap:'왼쪽은 스택된 LSTM 층 사이사이에 MoE 층(하늘색)이 끼워진 전체 구조. 오른쪽이 MoE 층 내부 확대도 — 아래에서 들어온 입력이 Gating Network(초록)로도, 여러 Expert(흰/회색 박스)로도 동시에 흘러간다. 그림에서는 회색으로 칠해진 Expert 2와 Expert n-1 두 개만 게이트 값 G(x)가 곱해져(× 기호) 활성화되고, 나머지 Expert는 아예 계산되지 않는다 — "선택된 것만 계산한다"는 희소성이 그림 하나로 요약된다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'We introduce a Sparsely-Gated Mixture-of-Experts layer (MoE), consisting of up to thousands of feed-forward sub-networks. A trainable gating network determines a sparse combination of these experts to use for each example.',
  src:'Abstract, p.1'}
],

impact:'"파라미터를 늘리는 것"과 "연산을 늘리는 것"이 같은 말이 아님을 실증한 논문이다. 이후 스케일링 논의는 dense 축(모든 파라미터를 다 쓴다)과 sparse 축(파라미터는 많이, 연산은 조금) 두 갈래로 갈라진다. 다만 2017년 시점에는 LSTM 위에 얹은 구조였고 인프라 요구가 커서 즉시 주류가 되지는 못했다. 실제 폭발은 이 아이디어가 [Transformer](#/p/transformer)의 FFN 자리로 옮겨간 뒤 — 즉 [Switch Transformer](#/p/switch) 이후 — 에 일어난다. 부하 분산 보조 손실, 전문가 병렬화, top-k 라우팅이라는 세 가지 설계는 오늘날 MoE 구현에 거의 그대로 남아 있다.',

legacy:[
 '**FFN을 MoE로 교체** — [Switch Transformer](#/p/switch)가 라우팅을 top-1로 단순화하고 Transformer FFN 자리에 넣으면서 조 단위 파라미터 시대를 엶',
 '**오픈 모델의 표준 옵션화** — [Mixtral](#/p/mixtral)이 top-2 라우팅으로 8×7B 구성을 공개하고, [DeepSeek-V3](#/p/deepseek-v3)가 세분화된 전문가 + 공유 전문가 구조로 이어받음',
 '**부하 분산 연구 계열** — importance/load 보조 손실은 이후 auxiliary-loss-free 라우팅, expert choice 라우팅 등 "어떻게 균형을 맞출 것인가"라는 독립 연구 주제로 발전',
 '**추론 시스템 문제 파생** — 파라미터는 많고 연산은 적은 모델은 메모리 대역폭이 병목이 되어, MoE 전용 서빙·전문가 배치 최적화가 별도 공학 영역이 됨'
],

pitfalls:[
 '**"MoE는 공짜로 커진다"가 아니다.** 토큰당 FLOPs는 그대로여도 **모든 파라미터를 메모리에 올려야** 하므로 VRAM 요구량과 분산 통신량은 dense와 같거나 더 나쁘다. 이 논문 자체가 네트워크 대역폭을 주요 병목으로 명시한다.',
 '**전문가를 무작정 늘리면 오히려 나빠진다.** 100B word 실험에서 65,536개까지는 개선되지만 131,072개에서는 성능이 떨어졌다. 논문은 과도한 희소성 — 전문가당 학습 신호 부족 — 을 원인으로 추정한다. 데이터 규모가 전문가 수의 상한을 정한다.',
 '**부하 분산 손실은 선택 사항이 아니다.** 이것 없이 학습하면 게이팅이 소수 전문가로 붕괴해 사실상 작은 dense 모델이 된다. MoE 구현에서 가장 자주 나오는 재현 실패 원인이 이 보조 손실의 계수 설정이다.'
],

links:[
 {t:'arXiv 1701.06538 — Outrageously Large Neural Networks', u:'https://arxiv.org/abs/1701.06538'},
 {t:'GShard: Scaling Giant Models with Conditional Computation (후속 확장)', u:'https://arxiv.org/abs/2006.16668'},
 {t:'A Review of Sparse Expert Models in Deep Learning', u:'https://arxiv.org/abs/2209.01667'}
]
});
