WIKI.paper({
slug:'speculative',
venue:'ICML 2023 (Oral)',
authors:'Leviathan, Kalman, Matias (Google Research)',
arxiv:'2211.17192',

tldr:'작은 draft 모델이 다음 토큰 $\\gamma$ 개를 미리 찍어 두고, 큰 모델이 그 $\\gamma+1$ 개 위치를 **한 번의 forward로 병렬 검증**한다. 맞은 것까지 채택하고 틀린 지점에서 다시 시작하는데, 검증 규칙을 잘 짜면 최종 출력 분포가 **큰 모델 단독 샘플링과 수학적으로 완전히 동일**하다. 모델 재학습도, 구조 변경도, 품질 손실도 없이 2~3배 빨라진다.',

context:'디코딩이 느린 이유는 연산량이 아니라 **직렬성**이다. 토큰 $K$ 개를 만들려면 모델을 $K$ 번 순차적으로 돌려야 하고, 매 스텝마다 수십 GB의 가중치를 HBM에서 읽어 온다. 배치 크기가 1이면 그 가중치로 하는 일은 벡터 하나와의 곱뿐이라 GPU 연산 유닛은 대부분 놀고 있다 — 전형적인 **메모리 대역폭 바운드**다. [vLLM](#/p/vllm)이 배치를 키워 이 문제를 푼다면, 여기서는 다른 각도로 접근한다: **어차피 한 스텝의 계산 여력이 남는다면, 여러 위치를 동시에 처리하면 되지 않나?** 문제는 아직 만들지 않은 토큰의 위치를 어떻게 아느냐인데, 그 답이 "값싼 모델에게 추측시킨다"이다. CPU의 분기 예측·투기적 실행과 정확히 같은 구조다.',

ideas:[
 {h:'많은 토큰은 쉽다 — 난이도가 균일하지 않다는 관찰',
  lead:'쉬운 토큰까지 큰 모델에 똑같은 비용을 치르는 것이 회수 가능한 낭비다.',
  d:'문장의 모든 토큰이 11B 모델을 필요로 하는 것은 아니다 — 관사, 조사, 흔한 연어, 이미 문맥에 나온 고유명사 같은 토큰은 77M 모델도 맞히고, 어려운 분기점에서만 큰 모델의 판단이 필요하다. 그런데 표준 디코딩은 **모든 토큰에 똑같은 비용**을 지불한다. 이 불균형이 회수할 수 있는 낭비다.'},
 {h:'검증은 병렬이다',
  lead:'큰 모델이 draft가 낸 여러 토큰을 한 번의 forward로 동시에 검증한다.',
  d:'draft가 $x_1 \\dots x_\\gamma$ 를 내놓으면, 큰 모델에 원본 프리픽스와 이 $\\gamma$ 개를 이어 붙여 **한 번** 넣는다. causal attention 덕분에 한 번의 forward로 $\\gamma+1$ 개 위치 각각의 다음 토큰 분포 $p$ 가 전부 나온다. 즉 검증 비용은 토큰 하나를 생성하는 비용과 사실상 같다(대역폭 바운드 구간에서는 배치를 몇 개 늘려도 시간이 거의 안 늘어난다). 여기가 이 방법이 성립하는 물리적 근거다.'},
 {h:'speculative sampling: 분포를 정확히 보존하는 채택 규칙',
  lead:'거부된 확률질량을 잔차 분포로 되돌려 최종 분포를 완전히 보존한다.',
  d:'단순히 "draft와 큰 모델의 argmax가 같으면 채택"하면 temperature > 0 에서 분포가 왜곡된다. 대신 draft가 뽑은 $x$ 를 확률 $\\min(1, p(x)/q(x))$ 로 채택하고, 거부되면 **잔차 분포** $\\mathrm{norm}(\\max(0, p-q))$ 에서 다시 뽑는다. 이렇게 하면 최종 표본이 $p$ 에서 뽑은 것과 분포적으로 구별 불가능하다는 것을 증명할 수 있다. **근사가 아니라 등가**라는 점이 이 논문의 핵심 주장이다.'},
 {h:'채택률 α 하나로 성능이 결정된다',
  lead:'draft-타깃 일치도 α와 draft 비용 c의 균형이 속도를 결정한다.',
  d:'draft가 큰 모델과 얼마나 일치하는지를 $\\alpha$ 로 정의하면(정확히는 $\\alpha = E[\\min(p,q)] = 1 - E[D_{LK}(p,q)]$, 즉 두 분포의 겹침), 한 번의 사이클에서 나오는 토큰 수의 기댓값이 닫힌 형태로 나온다. 실무 튜닝은 결국 **$\\alpha$(draft가 클수록 높음)와 $c$(draft 실행 비용, draft가 클수록 높음)의 균형점 찾기**다. 논문 실험에서 11B 타깃에 대해 800M·250M·77M 중 가장 작은 77M이 최고 속도를 냈다.'},
 {h:'연산량은 늘고 지연 시간은 준다',
  lead:'놀고 있던 연산 유닛을 태워 총 FLOPs 증가를 지연시간 감소로 바꾼다.',
  d:'거부된 draft 토큰의 계산은 버려지므로 총 FLOPs는 오히려 증가한다. 이 방법이 이득인 이유는 **놀고 있던 연산 유닛으로 그 추가 계산을 공짜에 가깝게 처리하기 때문**이다. 뒤집어 말하면 GPU가 이미 연산 포화 상태(배치가 크고 처리량 최적화된 서버)라면 이득이 사라지거나 손해가 된다. 이 논문이 배치 크기 1에서 측정한 것은 우연이 아니다.'}
],

diagram:{type:'loop', cap:'한 사이클. 채택된 토큰 수만큼 전진하고, 거부 지점에서 큰 모델이 직접 하나를 뽑아 붙이므로 매 사이클 최소 1토큰은 보장된다.',
 center:'출력 분포는 큰 모델 단독과 동일',
 nodes:[
  {t:'draft 모델 γ회 실행', s:'q(x) — 값싸지만 순차적'},
  {t:'타깃 1회 forward', s:'γ+1 위치를 병렬 검증', acc:true},
  {t:'채택 판정', s:'min(1, p(x)/q(x))'},
  {t:'거부 시 잔차 재샘플', s:'norm(max(0, p−q))'},
  {t:'채택분 + 1토큰 확정', s:'프리픽스 갱신'}
 ]},

math:[
 {expr:'accept x ~ q  with prob  min(1, p(x)/q(x));  else  x ~ norm(max(0, p(x) − q(x)))',
  tex:'\\begin{aligned} &\\text{accept } x\\sim q \\text{ with prob } \\min(1, p(x)/q(x)); \\\\ &\\text{else } x \\sim \\mathrm{norm}(\\max(0, p(x)-q(x))) \\end{aligned}',
  d:'논문 전체가 이 두 줄이다. draft가 과대평가한 토큰($q > p$)은 그 비율만큼 거부되고, 그때 거부된 확률질량이 정확히 $p$ 가 $q$ 보다 큰 쪽으로 재배분된다. 결과적으로 최종 표본의 분포는 $p$ 와 **정확히** 일치한다.'},
 {expr:'E[생성 토큰 수] = (1 − α^(γ+1)) / (1 − α)',
  tex:'E[\\text{생성 토큰 수}] = \\frac{1-\\alpha^{\\gamma+1}}{1-\\alpha}',
  d:'채택이 독립이라 가정하면 사이클당 토큰 수는 성공확률 $1-\\alpha$, 상한 $\\gamma+1$ 인 절단 기하분포다. $\\alpha = 0.8, \\gamma = 5$ 이면 사이클당 평균 약 3.6토큰 — 즉 타깃 모델 호출 횟수가 1/3.6로 준다.'},
 {expr:'speedup = (1 − α^(γ+1)) / ((1 − α)(γc + 1))',
  tex:'\\text{speedup} = \\frac{1-\\alpha^{\\gamma+1}}{(1-\\alpha)(\\gamma c + 1)}',
  d:'$c$ 는 타깃 대비 draft의 실행 비용 비율. $\\gamma$ 를 키우면 분자(기대 토큰)는 포화하는데 분모의 draft 비용 $\\gamma c$ 는 선형으로 늘어나므로, **$\\gamma$ 에는 최적값이 존재한다.** 실무에서 $\\gamma$ 를 무작정 늘리면 오히려 느려지는 이유가 이 식에 있다.'}
],

numbers:[
 {k:'번역 (WMT EnDe)', v:'3.4× (temp=0) / 2.6× (temp=1)', d:'타깃 T5-XXL 11B, draft T5-small 77M, $\\gamma$=7'},
 {k:'요약 (CNN/DM)', v:'3.1× (temp=0) / 2.3× (temp=1)', d:'같은 구성. 출력은 표준 디코딩과 **동일**'},
 {k:'채택률 α', v:'0.75 (temp=0) / 0.62 (temp=1)', d:'temperature가 낮을수록 분포가 뾰족해 draft가 맞히기 쉽다'},
 {k:'draft 크기 비율', v:'77M / 11B ≈ 0.7%', d:'800M·250M도 시험했으나 **가장 작은 77M이 최고 속도**'},
 {k:'측정 조건', v:'batch size 1 · TPU-v4 1장', d:'메모리 대역폭 바운드 구간 — 이 방법이 성립하는 전제'},
 {k:'후속 검증', v:'Chinchilla 70B에서 2~2.5×', d:'DeepMind의 독립 연구(arXiv 2302.01318)가 같은 시기 동일 결과 보고'}
],

figures:[
 {f:'fig1-speculative-trace.png',
  cap:'한 줄이 target 모델의 병렬 실행 1회다. 초록은 draft 모델의 제안 중 target이 그대로 승인한 토큰, 빨강은 기각된 제안, 파랑은 그 자리를 대체한 target의 정정 토큰이다. 첫 줄에서 target을 딱 한 번 돌렸는데 5개 토큰(초록 4개+파랑 1개)이 한 번에 확정된 것을 보면, 문장이 "쉬운" 구간(고유명사·숫자 뒤 조사 등)에서는 draft가 거의 다 맞혀 target 호출 횟수가 실제 토큰 수보다 훨씬 적게 든다는 것을 알 수 있다.',
  src:'원문 Figure 1, p.2'}
],

quotes:[
 {t:'In this work we introduce speculative decoding - an algorithm to sample from autoregressive models faster without any changes to the outputs, by computing several tokens in parallel.',
  src:'Abstract, p.1'}
],

impact:'speculative decoding은 **품질 트레이드오프가 없는** 몇 안 되는 추론 최적화다. 양자화([GPTQ](#/p/gptq)·[AWQ](#/p/awq))나 [MQA](#/p/mqa)/[GQA](#/p/gqa)는 어느 정도의 품질·표현력을 내주고 속도를 얻지만, 여기서는 출력 분포가 증명 가능하게 보존된다. 그래서 "켤지 말지"가 품질 검증 문제가 아니라 순수한 시스템 튜닝 문제가 되고, 상용 API와 오픈 추론 엔진 양쪽에서 빠르게 기본 옵션이 됐다. 동시에 이 논문은 **디코딩의 직렬성 자체가 공격 대상**이라는 인식을 열었다 — 이후 등장한 Medusa(다중 헤드), EAGLE(피처 수준 draft), lookahead decoding 등이 모두 같은 검증 골격 위에 서 있다.',

legacy:[
 '**self-speculative 계열** — 별도 draft 모델 없이 타깃 모델의 일부 층만 돌리거나(layer skipping), 추가 헤드를 붙여 draft를 만드는 Medusa·EAGLE 등으로 확장',
 '**n-gram / prompt lookup** — 프롬프트에서 일치하는 접두사를 그대로 복사해 draft로 쓰는 파라미터 없는 방식. 요약·코드 편집처럼 입력 복사가 많은 작업에서 특히 효과적',
 '**트리 기반 검증** — 하나의 선형 draft 대신 후보 트리를 만들어 한 번에 검증하는 확장으로 채택 토큰 수를 더 늘림',
 '**서빙 엔진 통합** — [vLLM](#/p/vllm)의 블록 페이징 위에서 draft 토큰의 KV 캐시를 붙였다 떼는 것이 자연스러워, 두 기법이 한 엔진에서 결합됨'
],

pitfalls:[
 '**처리량 최적화된 서버에서는 이득이 없거나 손해다.** 이 방법은 유휴 연산 자원을 태워 지연 시간을 사는 거래다. 배치가 커서 GPU가 이미 연산 포화 상태라면 draft 실행과 버려지는 계산이 순수 비용이 된다. **개인용·저지연 시나리오(batch 1~수 개)에서 켜고, 대량 배치 서버에서는 측정 후 결정하라.**',
 '**$\\gamma$ 는 크면 클수록 좋은 값이 아니다.** 채택 토큰 수의 기댓값은 $\\gamma$ 에 대해 포화하지만 draft 비용은 선형으로 늘어난다. $\\alpha$ 가 낮은 조합에서 $\\gamma$ 를 키우면 거의 매번 첫 토큰에서 거부되면서 draft 실행 시간만 낭비한다.',
 '**draft는 타깃과 토크나이저·어휘가 같아야 한다.** 확률 비교 $p(x)/q(x)$ 가 성립하려면 같은 토큰 공간이어야 한다. 서로 다른 계열의 모델을 draft로 붙이려는 시도가 흔한 실수이며, 이 경우 별도의 어휘 정렬 작업이 필요하다.'
],

links:[
 {t:'arXiv 2211.17192 — Fast Inference from Transformers via Speculative Decoding', u:'https://arxiv.org/abs/2211.17192'},
 {t:'arXiv 2302.01318 — Accelerating LLM Decoding with Speculative Sampling (DeepMind)', u:'https://arxiv.org/abs/2302.01318'},
 {t:'vLLM: Speculative Decoding 문서', u:'https://docs.vllm.ai/en/latest/features/spec_decode.html'}
]
});
