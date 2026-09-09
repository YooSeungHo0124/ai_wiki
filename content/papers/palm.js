WIKI.paper({
slug:'palm',
venue:'JMLR 2023 (arXiv 2022)',
authors:'Chowdhery, Narang, Devlin, Dean et al. (Google Research)',
arxiv:'2204.02311',

tldr:'540B 파라미터 dense Transformer를 **두 개의 TPU v4 Pod에 걸쳐 6144칩으로** 학습시킨 논문. 파이프라인 병렬화 없이 46.2%라는 당시 최고 수준의 model FLOPs utilization을 달성했고, 다단계 추론 과제에서 파인튜닝된 전용 모델을 few-shot으로 넘어섰다.',

context:'2022년 초 시점의 제약은 모델 크기가 아니라 **인프라**였다. TPU Pod 하나에 들어가지 않는 모델을 학습시키려면 파이프라인 병렬화가 필요한데, 파이프라인은 버블(유휴 시간)을 만들고 배치를 마이크로배치로 쪼개야 해서 효율이 떨어진다. 당시 대형 모델들의 model FLOPs utilization은 대체로 20~30%대에 머물렀다 — 하드웨어가 이론적으로 낼 수 있는 연산의 3분의 2 이상을 버리고 있었다는 뜻이다. 동시에 [Chinchilla](#/p/chinchilla)가 같은 달에 "모델이 아니라 데이터를 늘려라"고 발표하면서, PaLM은 dense 스케일링 노선의 사실상 마지막 대형 사례가 된다.',

ideas:[
 {h:'Pathways — 두 Pod에 걸친 파이프라인 없는 학습',
  lead:'Pod 사이는 데이터 병렬만 쓰고 통신을 계산과 겹쳐 버블을 없앤다.',
  d:'Pod 내부는 모델 병렬 + 데이터 병렬로 나누고, **Pod 사이는 데이터 병렬만** 쓴다. 두 Pod가 각자 forward/backward를 끝낸 뒤 gradient를 Pod 간 네트워크로 교환한다. 파이프라인 단계를 두지 않으므로 버블이 없고, 대신 Pod 간 통신이 데이터센터 네트워크를 타는데 이를 비동기 gang-scheduling으로 계산과 겹쳐 숨긴다. 이것이 46.2% MFU의 직접적 원인이다.'},
 {h:'MFU — 하드웨어 효율을 비교 가능한 지표로 정의',
  lead:'재계산분을 뺀 실측 처리량 비율로 하드웨어 효율을 비교 가능하게 만든다.',
  d:'논문은 기존의 hardware FLOPs utilization이 rematerialization(활성값 재계산) 같은 구현 선택에 좌우돼 모델 간 비교에 부적합하다고 지적하고, **model FLOPs utilization** — 실제 관측 처리량 ÷ 이론적 최대 처리량, 재계산분은 제외 — 을 제안한다. PaLM의 MFU는 46.2%, HFU는 57.8%다. 이 지표가 이후 대규모 학습 보고서의 표준 항목이 됐다.'},
 {h:'아키텍처 잔손질의 누적',
  lead:'SwiGLU·병렬 블록·MQA·RoPE 등 작은 개선을 쌓아 대규모에서 효과를 합친다.',
  d:'구조 자체는 표준 decoder-only Transformer지만 부품을 여럿 갈아끼웠다 — SwiGLU 활성화, attention과 FFN을 직렬이 아닌 **병렬**로 배치(대규모에서 약 15% 속도 이득), 멀티쿼리 attention([MQA](#/p/mqa))으로 디코딩 비용 절감, [RoPE](#/p/rope) 위치 인코딩, 입출력 임베딩 공유, 모든 dense 층에서 bias 제거. 개별 효과는 작지만 540B 규모에서 합쳐지면 무시할 수 없다.'},
 {h:'다단계 추론에서의 도약',
  lead:'CoT와 계산기를 붙인 few-shot 프롬프팅만으로 전용 파인튜닝 파이프라인을 넘어선다.',
  d:'PaLM 540B가 가장 크게 앞선 영역은 여러 단계를 거쳐야 하는 추론이다. 8-shot [chain-of-thought](#/p/cot) 프롬프트에 외부 계산기를 붙여 GSM8K에서 58%를 기록했는데, 이전 SOTA 55%는 **파인튜닝 + CoT + 계산기 + 별도 검증기**를 모두 동원한 결과였다. 즉 프롬프팅만으로 전용 파이프라인을 넘어선 것이다. CoT 없이 같은 모델을 쓰면 17%로 떨어진다.'},
 {h:'규모에 따른 불연속적 개선의 보고',
  lead:'62B에서 540B로 갈 때 여러 과제 성능이 매끄럽지 않게 가파르게 뛴다.',
 d:'BIG-bench의 상당수 과제에서 62B → 540B 구간에 성능이 매끄럽게가 아니라 **가파르게** 뛰는 현상을 논문이 명시적으로 기록했다. 이 관찰이 같은 해의 [창발 능력](#/p/emergent) 논문에 직접적인 증거로 인용되며, 이후 "창발은 진짜인가 지표의 착시인가" 논쟁의 출발점 중 하나가 된다.'}
],

diagram:{type:'flow', cap:'Pathways의 2-Pod 학습 구조. Pod 안에서는 모델+데이터 병렬, Pod 사이는 데이터 병렬만 — 파이프라인 단계가 없다.',
 nodes:[
  {t:'TPU v4 Pod A', s:'3072칩 · MP12×DP256'},
  {t:'FWD/BWD', s:'Pod 내부에서 완결'},
  {t:'gradient 교환', s:'데이터센터 네트워크 · 계산과 오버랩', acc:true},
  {t:'TPU v4 Pod B', s:'3072칩 · 동일 구성'},
  {t:'파라미터 갱신', s:'46.2% MFU'}
 ]},

numbers:[
 {k:'파라미터', v:'540B', d:'118층 · d_model 18432 · attention head 48. dense(모든 파라미터가 항상 활성)'},
 {k:'학습 인프라', v:'6144 TPU v4', d:'두 개의 Pod에 걸침. 파이프라인 병렬화 없이'},
 {k:'학습 토큰', v:'780B', d:'[Chinchilla](#/p/chinchilla) 기준으로는 심하게 부족하다 — 파라미터당 약 1.4토큰'},
 {k:'MFU / HFU', v:'46.2% / 57.8%', d:'당시 동급 모델 대비 가장 높은 수준'},
 {k:'MMLU (5-shot)', v:'69.3%', d:'당시 SOTA였던 [Chinchilla](#/p/chinchilla) 70B를 약 2점 상회. 같은 계열 8B는 25.3%, 62B는 53.7%'},
 {k:'GSM8K (8-shot CoT)', v:'58%', d:'CoT 없이는 17%. 이전 SOTA 55%는 파인튜닝+검증기를 동원한 결과'},
 {k:'BIG-bench', v:'58개 공통 과제 중 44개에서 SOTA', d:'GPT-3·Gopher·Chinchilla와 비교 가능한 과제 집합 기준'}
],

figures:[
 {f:'fig5-discontinuous-scaling.png',
  cap:'x축은 8B→62B→540B 세 모델 크기, y축은 정규화 점수(0%가 무작위 추측). 회색 점선이 사람 평균, 검은 점선이 사람 최고 성적이다. (a) goal_step_wikihow는 규모가 커질수록 완만하게 오르는 반면, (b) english_proverbs·logical_sequence는 8B→62B 구간은 거의 평평하다가 62B→540B 구간에서 **꺾은선이 거의 수직으로 솟는다** — 이 급격한 꺾임이 논문이 말하는 "불연속적 향상"이다. (c) navigate·mathematical_induction처럼 540B까지 가도 거의 오르지 않는 과제도 있어, 규모가 만능이 아님을 같은 그림에서 보여준다.',
  src:'원문 Figure 5, p.17'}
],

quotes:[
 {t:'A significant number of BIG-bench tasks showed discontinuous improvements from model scale, meaning that performance steeply increased as we scaled to our largest model.',
  src:'Abstract, p.1'}
],

impact:'PaLM은 두 가지를 남겼다. 하나는 **인프라**다 — Pathways가 보인 "Pod 경계를 넘되 파이프라인은 쓰지 않는다"는 설계와 MFU라는 지표는 이후 대규모 학습 보고서의 공통 언어가 되었다. 다른 하나는 **역설적 교훈**이다. 780B 토큰으로 540B 모델을 학습시킨 PaLM은 같은 달 발표된 Chinchilla 기준으로는 명백히 학습 부족 상태였고, 4배 작은 Chinchilla 70B가 MMLU에서 거의 대등한 성능을 냈다. dense 모델을 파라미터 축으로만 밀어붙이는 노선이 실질적으로 끝나는 지점이 여기다. 이후 Google 자신도 PaLM 2에서 모델을 줄이고 토큰을 늘리는 방향으로 선회한다. 한편 CoT 결과는 "능력을 끌어내는 것은 파라미터가 아니라 프롬프트일 수도 있다"는 별개의 연구 축을 열었다.',

legacy:[
 '**[Chain-of-Thought](#/p/cot)의 실증 무대** — CoT가 규모가 충분한 모델에서만 작동한다는 주장의 핵심 증거를 PaLM 540B가 제공',
 '**[창발 능력](#/p/emergent) 논쟁의 데이터 출처** — BIG-bench의 불연속적 개선 곡선이 창발 주장과 그 반박 양쪽에서 반복 인용됨',
 '**MFU의 표준화** — 이후 거의 모든 대규모 학습 기술 보고서가 model FLOPs utilization을 보고 항목으로 채택',
 '**dense 스케일링의 종점** — PaLM 이후 프론티어 모델의 확장 축은 파라미터에서 토큰([Chinchilla](#/p/chinchilla) 노선)과 희소성([Switch](#/p/switch)·[Mixtral](#/p/mixtral) 노선)으로 옮겨감'
],

pitfalls:[
 '**PaLM은 compute-optimal 모델이 아니다.** 파라미터당 약 1.4토큰으로, Chinchilla가 제시한 20 근처와 자릿수가 다르다. PaLM의 성능을 "540B라서 나온 결과"로 읽으면 안 되고, **같은 연산으로 더 잘할 수 있었던 사례**로 읽는 편이 정확하다.',
 '**"평균 인간을 넘었다"는 표현은 좁게 읽어야 한다.** BIG-bench에서 인간 평가자 평균을 넘은 것은 특정 과제 집합의 평균 점수이며, 논문 스스로 최고 인간 전문가와는 여전히 큰 격차가 있고 과제별 편차가 크다고 명시한다.',
 '**46.2% MFU는 아키텍처가 아니라 시스템의 성과다.** 병렬 attention·SwiGLU 같은 모델 쪽 선택이 아니라 Pathways의 스케줄링과 병렬화 전략이 대부분을 설명한다. 같은 모델 구조를 다른 인프라에 올리면 그 수치는 재현되지 않는다.'
],

links:[
 {t:'arXiv 2204.02311 — PaLM: Scaling Language Modeling with Pathways', u:'https://arxiv.org/abs/2204.02311'},
 {t:'Pathways: Asynchronous Distributed Dataflow for ML', u:'https://arxiv.org/abs/2203.12533'},
 {t:'PaLM 2 Technical Report (토큰 우선 노선으로의 선회)', u:'https://arxiv.org/abs/2305.10403'}
]
});
