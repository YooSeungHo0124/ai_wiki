WIKI.paper({
slug:'minimax-m1',
venue:'arXiv 2025',
authors:'MiniMax',
arxiv:'2506.13585',

tldr:'456B/45.9B 활성 MoE에 **7개 lightning attention 블록마다 1개 softmax attention을 섞는 하이브리드 구조**를 써서 100만 토큰 문맥과 저렴한 test-time 스케일링을 동시에 얻었다고 주장하는 논문. RL 알고리즘 CISPO와 결합해 512 H800·3주·$534,700라는 학습 비용을 구체적으로 공개한 점이 특히 드물다.',

context:'2025년 상반기 추론 모델들은 [DeepSeek-R1](#/p/deepseek-r1)처럼 사고 사슬을 길게 늘려 test-time 연산을 늘리는 방식으로 성능을 올렸지만, 표준 softmax attention은 문맥 길이에 제곱으로 비용이 늘어 **사고를 길게 시킬수록 추론·RL 학습 비용이 그만큼 불어난다**는 물리적 한계가 있었다. 선형 attention 계열(lightning attention 등)은 이론적으로 이 문제를 피하지만, 순수 선형 attention만으로는 검색·카피 같은 특정 능력이 약하다는 우려가 있어 대규모 추론 모델에는 아직 검증되지 않은 상태였다.',

ideas:[
 {h:'하이브리드 lightning attention: 7:1 비율로 섞는다',
  lead:'transnormer 블록 7개마다 softmax attention 블록 1개를 끼워 넣는다.',
  d:'MiniMax-Text-01을 기반으로, I/O-aware 선형 attention 구현인 lightning attention 기반 transnormer 블록 7개마다 표준 softmax attention 블록을 하나씩 배치한다. DeepSeek R1과 비교해 생성 길이 64K에서 FLOPs 50% 미만, **100K에서는 약 25%**만 소모한다고 보고한다. 순수 선형 attention의 약점을 소수의 softmax 블록으로 보완하면서 대부분의 계산은 선형 비용으로 처리하는 절충 설계다.'},
 {h:'100만 토큰 네이티브 문맥',
  lead:'lightning attention 덕분에 DeepSeek R1의 8배인 100만 토큰 문맥을 추가 트릭 없이 지원한다.',
  d:'문맥 길이에 선형으로 비용이 느는 구조 덕분에 별도의 슬라이딩 윈도우나 압축 없이 100만 토큰을 네이티브로 지원한다고 주장한다. 당시 공개된 다른 추론형 오픈 웨이트 모델(LRM) 대비 한 자릿수 이상 큰 문맥이라고 명시한다.'},
 {h:'CISPO: 토큰이 아니라 중요도가중치를 clip한다',
  lead:'PPO/GRPO식 토큰 업데이트 clip 대신 importance sampling 가중치 자체를 clip해 모든 토큰의 gradient를 살린다.',
  d:'PPO/[GRPO](#/p/grpo)는 advantage가 큰 토큰의 업데이트를 자르는데, 이는 긴 응답에서 중요한 토큰의 gradient 기여를 통째로 버리는 결과를 낳는다. CISPO(Clipped IS-weight Policy Optimization)는 대신 $\\hat r_{i,t}(\\theta)$, 즉 importance sampling 비율을 $[1-\\epsilon_{low}, 1+\\epsilon_{high}]$ 로 clip하고 **모든 토큰의 로그확률 항은 그대로 유지**한다. 저자들은 [DAPO](#/p/dapo)가 시도한 "상한을 늘려 완화" 방식이 16회 off-policy 업데이트가 있는 자신들의 설정에서는 덜 효과적이었다고 명시한다.'},
 {h:'CISPO의 실측 효과: 동일 스텝에서 더 높고, 절반 스텝으로 같은 성능',
  lead:'Qwen2.5-32B-base 기준 AIME 2024에서 CISPO가 GRPO·DAPO를 모두 앞섰다.',
  d:'제어된 소규모 실험(Qwen2.5-32B-base, zero-RL 설정)에서 CISPO는 같은 학습 스텝 수에서 GRPO·DAPO보다 AIME 2024 정확도가 높았고, DAPO가 도달하는 성능을 **절반의 학습 스텝**으로 달성했다(Figure 2, "2x speedup"). 다만 이 비교는 MiniMax-M1 본체가 아니라 별도의 통제된 소형 실험이라는 점을 원문이 명시한다.'},
 {h:'학습 비용을 숫자로 공개했다',
  lead:'하이브리드 attention과 CISPO를 결합해 512 H800 GPU·3주·53만 달러로 전체 RL을 끝냈다.',
  d:'하이브리드 attention의 효율과 CISPO의 학습 효율이 결합해, MiniMax-M1의 전체 RL 학습을 512개 H800 GPU로 **3주** 만에, 대여 비용 기준 **$534,700**로 완료했다고 명시한다. 프런티어급 추론 모델의 학습 비용을 구체적 달러 단위로 공개하는 사례는 드물다.'}
],

diagram:{type:'stack', cap:'attention 블록 8개 중 하나의 배치 패턴. 7:1 비율로 비용과 표현력을 절충한다.',
 layers:[
  {t:'transnormer 블록', s:'lightning attention'},
  {t:'transnormer 블록', s:'× 6회 반복'},
  {t:'softmax 블록', s:'8개마다 1개', acc:true, note:'검색·카피 능력 보완'}
 ]},

math:[
 {expr:'r̂(θ) = clip( r(θ), 1−ε_low, 1+ε_high )',
  tex:'\\hat r_{i,t}(\\theta)=\\text{clip}\\!\\left(r_{i,t}(\\theta),\\,1-\\epsilon_{low}^{IS},\\,1+\\epsilon_{high}^{IS}\\right)',
  d:'CISPO가 clip하는 대상은 토큰 업데이트가 아니라 importance sampling 비율 자체다. 실험에서는 $\\epsilon_{low}^{IS}$ 를 매우 크게 둬 사실상 하한 clip을 걸지 않고 $\\epsilon_{high}^{IS}$ 만 튜닝했다.'},
 {expr:'J_CISPO(θ) = E[ (1/Σ|o_i|) ΣΣ sg(r̂) · Â · log π_θ(token) ]',
  tex:'\\mathcal{J}_{\\text{CISPO}}(\\theta)=\\mathbb{E}\\left[\\frac{1}{\\sum_i^G|o_i|}\\sum_{i=1}^{G}\\sum_{t=1}^{|o_i|} \\text{sg}(\\hat r_{i,t}(\\theta))\\hat A_{i,t}\\log\\pi_\\theta(o_{i,t}\\mid q,o_{i,<t})\\right]',
  d:'GRPO의 그룹 상대 advantage와 토큰 단위 손실을 그대로 쓰되, 정책비율 항만 clip된 IS 가중치로 바꾼 목적함수. clip을 걷어내면 표준 policy gradient로 환원된다.'}
],

numbers:[
 {k:'파라미터', v:'456B 총 / 45.9B 활성', d:'MoE, 32 전문가, MiniMax-Text-01 기반'},
 {k:'네이티브 문맥', v:'100만 토큰', d:'DeepSeek R1의 8배'},
 {k:'FLOPs (100K 생성)', v:'DeepSeek R1의 약 25%', d:'하이브리드 attention 덕분, Abstract'},
 {k:'RL 학습 비용', v:'512 H800 · 3주 · $534,700', d:'대여 비용 기준, Abstract'},
 {k:'CISPO 가속 (AIME24)', v:'DAPO 대비 절반 스텝', d:'Qwen2.5-32B-base 통제 실험(Figure 2), MiniMax-M1 본체 수치 아님'},
 {k:'공개 버전', v:'40K / 80K thinking budget', d:'40K는 80K 학습의 중간 체크포인트'}
],

impact:'"선형 attention은 이론상 빠르지만 대규모 추론 모델에서 실제로 검증된 적은 없다"는 공백을 456B 규모에서 메운 사례다. 7:1 하이브리드 비율이라는 구체적 설계와 CISPO라는 명확히 정의된 RL 목적함수 변경, 그리고 학습 비용의 숫자 공개까지 — 이 세 가지가 함께 나왔다는 점이 "test-time 연산을 늘리는 경쟁"의 비용 구조를 처음으로 투명하게 보여준 사례로 남는다.',

legacy:[
 '**하이브리드 선형/softmax attention의 대규모 검증 사례** — 순수 선형 attention의 약점을 소수 softmax 블록으로 보완하는 설계가 이후 장문맥 추론 모델 설계에 참조됨',
 '**CISPO가 토큰 clip 대신 IS 가중치 clip이라는 대안 축을 세움** — GRPO/DAPO 계열 RL 알고리즘 비교에서 반복 인용되는 기준선이 됨',
 '**학습 비용 공개의 드문 선례** — GPU 대수·기간·달러 비용을 함께 명시한 것이 이후 보고서의 비용 투명성 논의에 참조점 제공'
],

pitfalls:[
 '**CISPO의 "2배 속도" 결과는 MiniMax-M1 자체가 아니라 Qwen2.5-32B-base 기반 통제 실험이다.** M1 본체 학습에 동일한 배수가 적용된다는 보장은 원문에 없다.',
 '**FLOPs 절감률(25%, 50%)은 특정 생성 길이(64K·100K)에서의 비교다.** 더 짧은 문맥에서는 하이브리드 attention의 이점이 줄어든다.',
 '**$534,700는 GPU 대여 비용만이다.** 데이터 구축·사전학습·인력 비용은 포함하지 않으므로 "모델 하나를 53만 달러에 만들었다"로 확대 해석하면 안 된다.'
],

figures:[
 {f:'fig2-cispo.png',
  cap:'Qwen2.5-32B-base로 AIME 2024를 학습한 통제 실험. CISPO(빨강)가 GRPO(초록)보다 훨씬 높은 최종 성능에 도달하고, DAPO(파랑)가 약 1000스텝에서 도달하는 성능을 CISPO는 절반인 약 500스텝에서 이미 달성한다(화살표로 표시된 "2x speedup").',
  src:'원문 Figure 2, p.6'}
],

quotes:[
 {t:'We introduce MiniMax-M1, the world’s first open-weight, large-scale hybrid-attention reasoning model.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2506.13585 — MiniMax-M1', u:'https://arxiv.org/abs/2506.13585'},
 {t:'Magistral', u:'#/p/magistral'},
 {t:'Kimi K2', u:'#/p/kimi-k2'}
]
});
