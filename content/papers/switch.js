WIKI.paper({
slug:'switch',
venue:'JMLR 2022 (arXiv 2021)',
authors:'Fedus, Zoph, Shazeer (Google Brain)',
arxiv:'2101.03961',

tldr:'MoE 라우팅을 **전문가 하나(top-1)** 로 단순화하고, 불안정한 학습을 잡는 세 가지 기법(선택적 float32, 작은 초기화, 전문가 드롭아웃)을 붙여 조 단위 파라미터 모델을 실제로 학습시킨 논문. 같은 연산 예산에서 T5-Base 대비 사전학습 속도 최대 7배.',

context:'[Sparsely-Gated MoE](#/p/moe-shazeer)는 2017년에 조건부 연산의 가능성을 증명했지만 4년이 지나도록 주류가 되지 못했다. 이유는 세 가지로 정리된다 — **복잡성**(top-$k$ 라우팅과 두 종류의 보조 손실, 계층적 게이팅), **통신 비용**(토큰을 전문가가 있는 디바이스로 보내고 받아오는 all-to-all), 그리고 **학습 불안정성**(라우터의 지수 연산이 저정밀도에서 쉽게 발산). 당시 통념은 "$k \\ge 2$ 여야 라우터가 학습된다"는 것이었다 — 전문가를 하나만 고르면 비교 대상이 없어 게이팅에 gradient가 흐르지 않는다는 논리였다. 이 논문은 그 통념부터 실험으로 반박하고 시작한다.',

ideas:[
 {h:'Top-1 라우팅 — 전문가 하나만 고른다',
  lead:'가장 확률 높은 전문가 하나만 골라 통신량과 계산을 절반으로 줄인다.',
  d:'각 토큰은 라우터 softmax 확률이 가장 높은 전문가 **하나**에만 간다. $k=1$ 이어도 선택된 전문가의 게이트 확률 $p_i(x)$ 가 출력에 곱해지므로 라우터에 gradient가 흐른다. 이득은 세 방향이다 — 라우터 계산이 줄고, 전문가당 배치 크기가 최소 절반으로 줄어 메모리가 여유로워지며, 무엇보다 **토큰당 all-to-all 통신량이 절반**이 된다. 통신이 지배적인 대규모 학습에서 이 항이 가장 크다.'},
 {h:'Expert capacity — 전문가별 버퍼를 고정하고 넘치면 버린다',
  lead:'전문가별 처리량을 고정 버퍼로 두고 넘친 토큰은 residual로 흘려보낸다.',
  d:'TPU/GPU는 정적인 텐서 모양을 요구하므로 전문가마다 처리할 토큰 수를 미리 정해야 한다. `expert capacity = (총 토큰 / 전문가 수) × capacity factor` 로 잡고, 용량을 넘긴 토큰은 그 층의 전문가 연산을 **건너뛰고 residual만 타고 지나간다**. capacity factor를 키우면 드롭이 줄지만 낭비되는 패딩 연산이 늘어난다. 논문은 부하 분산 손실을 충분히 걸면 1.0~1.25의 낮은 계수에서도 드롭률이 보통 1% 미만임을 보인다.'},
 {h:'보조 손실을 하나로 통합',
  lead:'배정 비율과 라우터 확률의 내적 하나로 부하 분산 손실을 단순화한다.',
  d:'2017년 MoE는 importance 손실과 load 손실 두 개를 따로 뒀다. Switch는 **실제 배정 비율 $f_i$ 와 라우터 확률 $P_i$ 의 내적** 하나로 통합한다. $f$ 는 argmax라 미분 불가능하지만 $P$ 가 미분 가능하므로 학습이 된다. 전문가 수 $N$ 을 곱해두어 전문가 수가 변해도 균등 라우팅 시 손실 값이 1로 고정되고, 계수 $\\alpha = 10^{-2}$ 하나만 남는다.'},
 {h:'선택적 정밀도 — 라우터 내부만 float32',
  lead:'라우터 계산만 float32로 올려 통신 비용 없이 발산을 막는다.',
  d:'MoE의 발산은 대개 라우터의 지수 함수에서 시작된다. 전체를 float32로 돌리면 안정적이지만 all-to-all로 오가는 텐서가 두 배가 되어 느려진다. Switch는 **라우터 함수 본문 안에서만** float32로 캐스팅하고, 반환 직전 bfloat16으로 되돌린다. float32 텐서가 디바이스 경계를 넘지 않으므로 통신 비용은 bfloat16 수준이면서 안정성은 float32 수준이 된다.'},
 {h:'희소 모델을 dense 모델로 증류할 수 있다',
  lead:'teacher logit으로 작은 dense 모델을 학습시켜 품질 상당 부분을 옮긴다.',
  d:'MoE의 실무적 걸림돌은 서빙이다 — 파라미터 전부를 메모리에 올려야 한다. 논문은 dense student를 **전문가가 아닌 부분의 가중치로 초기화**하고 teacher logit과 정답 레이블을 섞어 학습시키면, 파라미터를 99% 압축하고도 희소 모델이 얻은 품질 향상분의 상당 부분을 유지할 수 있음을 보인다.'}
],

diagram:{type:'split', cap:'Switch layer: Transformer의 FFN 자리를 N개 전문가로 대체하고 토큰마다 하나만 켠다.',
 from:{t:'토큰 x', s:'self-attn 출력'},
 branches:[{t:'FFN 1', s:'p=0.05'}, {t:'FFN 2', s:'p=0.62 → 선택', acc:true}, {t:'FFN 3', s:'p=0.21'}, {t:'…', s:'최대 2048개'}],
 join:'top-1만 실행 · 출력 × p · 용량 초과 토큰은 residual로 통과'},

math:[
 {expr:'expert capacity = (총 토큰 수 / 전문가 수) × capacity factor',
  tex:'\\text{capacity}=\\frac{\\text{tokens}}{\\text{experts}}\\times \\text{capacity factor}',
  d:'정적 텐서 모양을 위해 각 전문가가 처리할 토큰 수를 고정한다. 이 값을 넘긴 토큰은 드롭되어 그 층을 그냥 지나간다. 논문의 주력 설정은 capacity factor 1.0~1.25.'},
 {expr:'loss = α · N · Σᵢ fᵢ · Pᵢ,   α = 1e-2',
  tex:'\\text{loss}=\\alpha\\, N \\sum_i f_i P_i,\\quad \\alpha=10^{-2}',
  d:'$f_i$ 는 전문가 $i$ 로 실제 배정된 토큰 비율, $P_i$ 는 라우터가 그 전문가에 할당한 확률의 평균. 둘 다 균등($1/N$)일 때 최소가 되고, $N$ 을 곱했으므로 전문가 수와 무관하게 값이 1 근처로 유지된다. $\\alpha$ 는 $10^{-1}$~$10^{-5}$ 를 스윕해 $10^{-2}$ 로 결정.'}
],

numbers:[
 {k:'Switch-C 파라미터', v:'1571B (약 1.6T)', d:'전문가 2048개 · 15층. 학습 불안정이 **전혀 관찰되지 않음**'},
 {k:'Switch-XXL 파라미터', v:'395B', d:'전문가 64개 · 시퀀스당 6.3T FLOPs. 파라미터는 4배 적지만 연산은 7배 많고, 간헐적으로 불안정'},
 {k:'사전학습 속도', v:'최대 7×', d:'동일 연산 예산에서 T5-Base/Large 대비 목표 품질 도달 속도'},
 {k:'Switch-C vs T5-XXL', v:'4× 빠름', d:'C4에서 고정 perplexity 도달까지. 학습이 길어질수록 격차가 벌어짐'},
 {k:'증류 압축', v:'82% 압축 시 품질 향상분 37% 보존', d:'99%까지 압축해도 28% 보존'},
 {k:'다국어', v:'101개 언어 전부에서 개선', d:'mT5-Base 대비'}
],

figures:[
 {f:'fig2-switch-ffn-layer.png',
  cap:'왼쪽은 보통의 Transformer 인코더 블록(self-attention → FFN). 오른쪽이 그 FFN 자리를 Switch FFN 층으로 바꾼 확대도다. 두 토큰("More", "Parameters")이 각자 독립적으로 Router를 거쳐 **단 하나의 FFN**만 선택하는 것이 이 논문의 핵심 단순화 — [Shazeer의 MoE](#/p/moe-shazeer)는 토큰마다 여러 전문가를 top-k로 섞었지만, 여기서는 p=0.65, p=0.8처럼 확률 하나로 스케일된 전문가 하나의 출력만 쓴다(점선 화살표가 곱해지는 게이트 값).',
  src:'원문 Figure 2, p.5'},
 {f:'fig1-scaling-and-efficiency.png',
  cap:'왼쪽 그래프는 x축이 로그 스케일 sparse 파라미터 수(전문가 1개→256개), y축은 test loss — **연산량은 고정한 채 전문가 수(=파라미터)만 늘렸는데도 loss가 꾸준히 떨어진다**는 것이 이 논문의 존재 이유다. 오른쪽 그래프는 같은 연산 예산에서 전문가 수가 다른 Switch 모델들(파랑~주황)과 T5-Base(보라)의 학습 곡선을 비교한 것 — 전문가가 많을수록 더 적은 학습 스텝으로 더 낮은 perplexity에 도달한다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'We simplify the MoE routing algorithm and design intuitive improved models with reduced communication and computational costs. Our proposed training techniques mitigate the instabilities, and we show large sparse models may be trained, for the first time, with lower precision (bfloat16) formats.',
  src:'Abstract, p.1'}
],

impact:'Switch 이후 MoE는 "이론적으로 흥미로운 아이디어"에서 **실제로 쓰이는 스케일링 축**이 되었다. 특히 라우팅을 top-1까지 단순화해도 작동한다는 사실은 MoE 구현의 진입 장벽을 크게 낮췄고, expert capacity·통합 보조 손실·선택적 정밀도는 이후 거의 모든 MoE 구현이 채택하는 기본 부품이 되었다. 동시에 이 논문은 스케일링 논의에 축을 하나 더한다 — dense 파라미터를 늘리는 것과 sparse 파라미터를 늘리는 것은 같은 loss 개선을 다른 연산 비용으로 산다. [Chinchilla](#/p/chinchilla)가 dense 축의 최적 배분을 정리했다면, Switch 계열은 그 배분표 자체가 sparse 모델에서는 달라진다는 것을 보여준 셈이다.',

legacy:[
 '**오픈 웨이트 MoE의 등장** — [Mixtral 8x7B](#/p/mixtral)가 top-2 라우팅으로 상용 품질을 공개하며 MoE를 실무 선택지로 만듦',
 '**세분화된 전문가 구조** — [DeepSeek-V3](#/p/deepseek-v3)가 전문가를 더 잘게 쪼개고 항상 켜지는 공유 전문가를 추가하며, 보조 손실 없는 부하 분산까지 도입',
 '**서빙 공학의 분화** — 파라미터는 많고 연산은 적은 모델을 위해 전문가 오프로딩, 전문가 병렬화, 배치별 라우팅 캐시 같은 별도 최적화 계열이 형성',
 '**희소 → dense 증류의 상용화** — 큰 희소 teacher로 작은 dense student를 만드는 파이프라인이 배포용 모델 제작의 표준 패턴 중 하나가 됨'
],

pitfalls:[
 '**"1.6T 파라미터"를 dense 모델 크기와 비교하면 안 된다.** Switch-C의 시퀀스당 FLOPs는 890B로 395B짜리 Switch-XXL(6.3T FLOPs)보다 훨씬 적다. 논문 자신도 파라미터가 4배 많은 Switch-C가 파인튜닝 성능에서는 Switch-XXL에 밀린다는 점을 지적한다. **파라미터 수는 품질 지표가 아니다.**',
 '**토큰 드롭은 정상 동작이다.** capacity를 넘긴 토큰은 그 층에서 아무 전문가도 통과하지 못한다. 이는 버그가 아니라 설계이며, capacity factor와 보조 손실 계수가 잘못되면 드롭률이 급증해 품질이 조용히 무너진다. MoE 학습 디버깅에서 가장 먼저 봐야 할 지표다.',
 '**MoE는 메모리를 아껴주지 않는다.** 절약되는 것은 토큰당 연산이지 가중치 저장 공간이 아니다. 1.6T 파라미터는 어딘가에 전부 올라가 있어야 하고, 그래서 이 논문이 마지막 절을 증류에 할애한 것이다.'
],

links:[
 {t:'arXiv 2101.03961 — Switch Transformers', u:'https://arxiv.org/abs/2101.03961'},
 {t:'JMLR 23(120) 게재본 (전체 표·부록 포함)', u:'https://www.jmlr.org/papers/v23/21-0998.html'},
 {t:'GLaM: Efficient Scaling with Mixture-of-Experts (동시기 비교군)', u:'https://arxiv.org/abs/2112.06905'}
]
});
