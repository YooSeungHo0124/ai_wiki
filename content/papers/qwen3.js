WIKI.paper({
slug:'qwen3',
venue:'arXiv 2025',
authors:'Qwen Team (Alibaba)',
arxiv:'2505.09388',

tldr:'[Qwen2.5](#/p/qwen25)의 후속. 사전학습을 36T 토큰·119개 언어로 늘리고, 공개 가중치에도 MoE를 처음 넣었으며, 무엇보다 **"생각하는 모드"와 "즉답 모드"를 하나의 모델에 융합**한 하이브리드 추론을 도입했다.',

context:'2024년 말~2025년 초, [DeepSeek-V3](#/p/deepseek-v3)류 모델과 OpenAI의 o1/o3-mini가 "먼저 길게 사고한 뒤 답한다"는 추론 모델 노선을 열었다. 문제는 추론 모델과 일반 대화 모델이 보통 별도로 존재한다는 점이다 — 간단한 질문에도 매번 긴 사고 과정을 강제하면 비용과 지연이 낭비되고, 반대로 즉답 모델은 어려운 문제에서 성능이 떨어진다. [Qwen2.5](#/p/qwen25)까지는 사전학습 데이터 규모(18T)와 후처리 정교화로 경쟁했지만, 추론 모델이라는 새 축을 어떻게 흡수할지가 남은 문제였다.',

ideas:[
 {h:'thinking mode와 non-thinking mode를 한 모델에 융합',
  lead:'추론 전용 모델과 일반 대화 모델을 따로 두지 않고 하나의 가중치에서 전환한다.',
  d:'사용자가 요청에 따라 모델이 긴 chain-of-thought로 사고한 뒤 답하게 하거나(thinking), 사고 과정 없이 바로 답하게(non-thinking) 전환할 수 있다. 별도 모델을 서빙할 필요 없이 하나의 체크포인트가 두 역할을 겸하는 것이 핵심 차별점이다.'},
 {h:'thinking budget: 사고 길이를 토큰 수로 통제',
  lead:'추론 과정의 최대 토큰 수를 사용자가 지정해 성능과 비용을 맞바꾼다.',
  d:'thinking budget(토큰 예산)을 늘릴수록 수학·코딩·STEM 벤치마크 성능이 매끄럽게 향상되는 스케일링 곡선을 관측했다. 32K 토큰까지 실험했고, 그 이상으로 늘리면 더 개선될 것으로 추정하지만 실제로 검증하지는 않았다 — 저자들도 이를 후속 연구로 남긴다고 명시한다.'},
 {h:'4단계 후처리로 사고 능력을 주입하고 융합한다',
  lead:'Long-CoT 콜드스타트 → 추론 RL → 모드 융합 SFT → 일반 RL 순으로 학습한다.',
  d:'flagship 모델은 (1) Long-CoT 데이터로 콜드스타트 SFT, (2) 추론 전용 RL, (3) thinking/non-thinking 데이터를 함께 SFT해 두 모드를 한 모델에 융합(Stage 2 모델 자신이 rejection sampling으로 thinking 데이터를 생성), (4) 일반 성능·지시 따르기·에이전트 능력을 위한 General RL을 거친다. Stage 3가 없으면 non-thinking 모드 자체가 존재하지 않는다는 점에서 이 단계가 하이브리드 설계의 실질적 접합부다.'},
 {h:'경량 모델은 강↔약 증류로 대체한다',
  lead:'flagship의 4단계 RL을 반복하지 않고 큰 모델의 출력을 작은 모델에 distill한다.',
  d:'0.6B~14B 경량 모델에는 동일한 4단계 파이프라인을 다시 돌리지 않고, flagship 모델(235B-A22B, 32B)에서 강↔약(Strong-to-Weak) 증류로 지식을 옮긴다. On-policy distillation이 직접 RL보다 GPU 시간 대비 효율적이었다고 보고한다 — 비용 절감이 이 설계의 명시적 동기다.'},
 {h:'공개 가중치에 처음 MoE를 넣는다',
  lead:'235B 파라미터 중 22B만 활성화하는 MoE로 dense 대비 활성 파라미터를 크게 줄인다.',
  d:'[Qwen2.5](#/p/qwen25)에서 MoE는 API 전용(Turbo/Plus)이었지만, Qwen3는 235B-A22B·30B-A3B MoE를 가중치로 공개한다. 128개 전문가 중 8개를 토큰마다 활성화하며, Qwen2.5-MoE와 달리 상시 활성 전문가(shared expert)를 제거했다. 30B-A3B는 활성 파라미터가 1/5에 불과한데도 비슷한 크기의 dense 모델과 맞먹는 성능을 낸다고 보고한다.'}
],

diagram:{type:'flow', cap:'flagship 모델의 4단계 후처리. Stage 3가 thinking/non-thinking을 한 모델로 합치는 접합부다.',
 nodes:[
  {t:'Long-CoT 콜드스타트', s:'Stage 1', a:'SFT'},
  {t:'추론 RL', s:'Stage 2'},
  {t:'모드 융합', s:'Stage 3', acc:true, a:'SFT'},
  {t:'General RL', s:'Stage 4'}
 ]},

math:[
 {expr:'thinking budget ↑ → 수학·코딩·STEM 벤치마크 정확도 ↑ (매끄러운 스케일링)',
  tex:'\\text{Accuracy}(b)\\ \\text{is monotonically increasing in thinking budget } b\\ (\\text{up to } 32\\text{K tokens})',
  d:'thinking budget $b$(사고 과정에 허용한 최대 토큰 수)를 늘릴수록 성능이 매끄럽게 오르는 것을 실험적으로 관측했다(Figure 2). 정확한 함수형은 제시하지 않고 경험적 곡선만 보고한다.'}
],

numbers:[
 {k:'파라미터 범위', v:'0.6B ~ 235B', d:'dense·MoE 혼합 공개'},
 {k:'flagship MoE', v:'235B 총 / 22B 활성', d:'128 전문가 중 8개 활성, shared expert 없음'},
 {k:'사전학습 토큰', v:'36T', d:'[Qwen2.5](#/p/qwen25)의 18T 대비 2배'},
 {k:'지원 언어', v:'119개 언어·방언', d:'Qwen2.5의 29개 대비 대폭 확대'},
 {k:'MoE 효율', v:'1/5 활성 파라미터', d:'30B-A3B가 비슷한 dense 모델과 동등 성능(원문 주장)'},
 {k:'thinking budget 실험', v:'~32K 토큰', d:'그 이상은 검증하지 않고 향후 과제로 남김'}
],

impact:'추론 모델과 일반 대화 모델을 분리 배포해야 한다는 통념을 깨고, 하나의 오픈 가중치 모델이 요청 단위로 사고 깊이를 조절하게 만들었다. 이는 서빙 비용 관점에서 실질적 이득이며, 이후 오픈 모델들이 "reasoning on/off" 또는 budget 제어를 기본 인터페이스로 채택하는 계기가 됐다. 동시에 공개 가중치에 MoE를 정식 도입하면서, [DeepSeek-V3](#/p/deepseek-v3) 이후 오픈 진영에서 MoE가 API 전용 사치품이 아니라 표준 옵션이 되는 흐름을 굳혔다.',

legacy:[
 '**하이브리드 추론의 참조 사례** — thinking/non-thinking 융합과 thinking budget 개념이 이후 오픈 추론 모델 설계의 비교 대상이 됨',
 '**증류 기반 경량화의 실무적 검증** — 강↔약 on-policy distillation이 직접 RL보다 GPU 시간 대비 효율적이라는 보고가 경량 모델 학습 관행에 참고됨',
 '**공개 MoE의 정착** — [Qwen2.5](#/p/qwen25)에서 API 전용이던 MoE가 가중치로 공개되며 오픈 모델의 MoE 채택이 가속',
 '**다국어 확장의 사례** — 29개→119개 언어로의 급격한 확대가 이후 보고서들의 다국어 지원 범위 비교 기준점이 됨'
],

pitfalls:[
 '**thinking budget을 늘리면 항상 이득이라고 단정할 수 없다.** 논문 자체가 32K 이상은 검증하지 않았다고 명시하며, 실무에서는 비용·지연과의 트레이드오프를 직접 측정해야 한다.',
 '**"MoE가 dense와 동등한 성능을 활성 파라미터 1/5로 낸다"는 특정 벤치마크·특정 모델 쌍(30B-A3B vs 유사 dense)의 비교다.** 모든 태스크·모든 크기에 일반화되는 결론이 아니다.',
 '**경량 모델(0.6B~14B)은 flagship과 동일한 4단계 RL을 거치지 않고 증류로 만들어졌다.** 학습 방식이 다르므로 flagship의 특성(예: thinking budget 스케일링 곡선)을 경량 모델에 그대로 기대하면 안 된다.'
],

figures:[
 {f:'fig1-posttraining.png',
  cap:'flagship 모델(위, 주황)은 4단계 RL·SFT를 거치고, 경량 모델(아래, 파랑)은 그 결과물에서 증류만 받는다. Stage 3 "Thinking Mode Fusion"이 두 사고 모드를 하나로 합치는 지점.',
  src:'원문 Figure 1, p.9'}
],

quotes:[
 {t:'A key innovation in Qwen3 is the integration of thinking mode (for complex, multi-step reasoning) and non-thinking mode (for rapid, context-driven responses) into a unified framework.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2505.09388 — Qwen3 Technical Report', u:'https://arxiv.org/abs/2505.09388'},
 {t:'Qwen3 (GitHub)', u:'https://github.com/QwenLM/Qwen3'}
]
});
