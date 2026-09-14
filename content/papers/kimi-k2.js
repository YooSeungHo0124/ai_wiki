WIKI.paper({
slug:'kimi-k2',
venue:'arXiv 2025',
authors:'Kimi Team (Moonshot AI)',
arxiv:'2507.20534',

tldr:'1조 파라미터 MoE를 **손실 스파이크 0회**로 15.5T 토큰까지 학습했다고 보고한 기술 보고서. 핵심은 새 아키텍처가 아니라 Muon 옵티마이저의 불안정성을 잡는 **QK-Clip**과, 에이전틱 능력을 위한 대규모 합성 tool-use 데이터다.',

context:'2025년 상반기 오픈 웨이트 MoE는 [DeepSeek-V3](#/p/deepseek-v3)가 671B/37B 활성 구성으로 표준을 세웠다. 동시에 [AdamW](#/p/adamw)보다 토큰 효율이 좋다는 Muon 계열 옵티마이저가 중소 규모에서 검증되고 있었지만, 대규모로 키우면 attention logit이 폭주해 학습이 발산하는 문제가 알려져 있었다. 기존 대응책인 logit soft-cap은 이미 커진 내적을 사후에 자르기만 하고, QK-Norm은 [MLA](#/p/deepseek-v2)처럼 Key 행렬이 추론 시 완전히 물질화되지 않는 구조에는 적용할 수 없었다. Kimi K2는 이 문제를 풀지 않고는 1조 파라미터 규모의 Muon 학습이 성립하지 않는다는 전제에서 출발한다.',

ideas:[
 {h:'QK-Clip: 로짓이 아니라 가중치를 사후 재조정',
  lead:'매 스텝 후 Q/K 투영 가중치를 헤드별로 스케일링해 로짓 폭주를 원천에서 억제한다.',
  d:'헤드 $h$ 의 최대 로짓 $S_{max}^h$ 가 임계값 $\\tau$ 를 넘으면, 그 스텝에서 이미 계산된 forward는 그대로 두고 **다음 스텝을 위해** $W_q,W_k$ 를 $\\gamma=\\min(1,\\tau/S_{max}^h)$ 비율로 줄인다. 모든 헤드를 동일하게 자르지 않고 실제로 폭주하는 **일부 헤드만 개별적으로** 자르는 것이 설계의 핵심 — 개입을 최소화해 다른 헤드의 학습 동역학을 건드리지 않는다.'},
 {h:'MuonClip: Muon + weight decay + QK-Clip',
  lead:'토큰 효율이 좋은 Muon에 QK-Clip을 결합해 대규모에서도 발산 없이 쓸 수 있게 만든다.',
  d:'9B 활성·53B 총 파라미터 중간 규모 실험에서 바닐라 Muon은 최대 로짓이 1000을 넘기며 폭주했다(Figure 2 왼쪽). 동일 조건에 $\\tau=100$ 의 QK-Clip을 추가하자 로짓이 100에서 상한을 유지하다가 학습이 진행되며 **자연히 30 근처로 내려가 다시 개입이 필요 없어졌다**(Figure 2 오른쪽) — clip이 임시 목발이지 영구 제약이 아님을 보여준다.'},
 {h:'Self-deactivation: 개입은 일시적이었다',
  lead:'70,000스텝을 넘기면서 모든 헤드가 스스로 로짓을 낮춰 QK-Clip이 저절로 꺼졌다.',
  d:'실제 K2 학습에서 QK-Clip은 초기 70,000스텝 동안 전체 헤드의 12.7%에서만 발동했고, 그 이후로는 모든 헤드가 $S_{max}$를 100 아래로 스스로 낮춰 clip이 비활성 상태가 됐다(부록 D). 소규모 ablation($\\tau=30$)에서도 QK-Clip 유무가 최종 loss curve를 갈라놓지 않아, 품질 저하 없이 안정성만 사는 개입이라는 주장을 뒷받침한다.'},
 {h:'희소성 스케일링 법칙: 전문가를 늘리는 쪽을 택했다',
  lead:'활성 파라미터를 고정한 채 총 전문가 수를 늘릴수록 손실이 낮아지는 경향을 실측했다.',
  d:'동일 FLOPs에서 전문가 총수를 늘려 희소성(총 전문가/활성 전문가)을 키울수록 학습·검증 손실이 꾸준히 낮아졌다(Figure 5). 같은 검증 손실 1.5에 도달하는 데 희소성 48이 희소성 8보다 **1.69배** 적은 FLOPs로 충분했다. 이 결과에 따라 [DeepSeek-V3](#/p/deepseek-v3)의 256개 대신 384개 전문가(8개 활성)를 채택하고, 대신 attention head 수는 128→64로 줄여 추론 비용을 상쇄했다.'},
 {h:'대규모 합성 tool-use 데이터로 에이전틱 능력을 주입',
  lead:'수천 개의 실제·가상 도구와 시뮬레이션 환경에서 멀티턴 tool-use 궤적을 자동 생성한다.',
  d:'실제 MCP 도구와 계층적으로 진화시킨 합성 도구를 함께 모아 도구·에이전트·과제·궤적을 조합해 생성한다. 시뮬레이터가 각 tool call 이후 상태를 갱신하며 현실적인 피드백을 주는 방식으로, 사실상 **거절 샘플링(rejection sampling)을 대규모로 자동화**한 셈이다. 이후 RL 단계에서 이 합성 환경과 실제 환경을 함께 사용해 모델이 상호작용을 통해 개선되도록 한다.'}
],

diagram:{type:'loop', cap:'MuonClip 한 스텝. QK-Clip은 forward는 건드리지 않고 다음 스텝의 가중치만 줄인다.',
 center:'매 스텝 반복',
 nodes:[
  {t:'Muon 업데이트', s:'모멘텀 + Newton-Schulz'},
  {t:'S_max 계산', s:'헤드별 최대 로짓'},
  {t:'QK-Clip', s:'τ 초과 헤드만', acc:true, a:'초과 시만'},
  {t:'다음 스텝 forward', s:'로짓 재폭주 감시'}
 ]},

math:[
 {expr:'S_max^h = (1/√d) · max over batch, i, j of Q_i^h · (K_j^h)ᵀ',
  tex:'S_{\\max}^{h}=\\frac{1}{\\sqrt{d}}\\max_{\\mathbf{X}\\in B}\\max_{i,j}\\mathbf{Q}_i^{h}{\\mathbf{K}_j^{h}}^{\\top}',
  d:'헤드 $h$ 의 배치 내 최대 attention 로짓. 이 값이 QK-Clip 발동 여부를 결정하는 유일한 신호다.'},
 {expr:'γ_h = min(1, τ / S_max^h);  W_q^h ← W_q^h · √γ_h,  W_k^h ← W_k^h · √γ_h',
  tex:'\\gamma_h=\\min\\!\\left(1,\\ \\tau/S_{\\max}^{h}\\right),\\quad \\mathbf{W}_q^{h}\\leftarrow \\mathbf{W}_q^{h}\\sqrt{\\gamma_h},\\ \\ \\mathbf{W}_k^{h}\\leftarrow \\mathbf{W}_k^{h}\\sqrt{\\gamma_h}',
  d:'헤드별 스케일. MLA에서는 헤드 고유 성분 $q^C,k^C,q^R$ 만 스케일하고, 헤드 간 공유되는 $k^R$(rotary)은 다른 헤드에 영향을 주지 않도록 건드리지 않는다.'}
],

numbers:[
 {k:'파라미터', v:'1.04T 총 / 32.6B 활성', d:'MoE, [DeepSeek-V3](#/p/deepseek-v3) 671B/37B 대비 활성 파라미터는 오히려 13% 적음'},
 {k:'전문가 구성', v:'384개 중 8개 활성', d:'DeepSeek-V3의 256개 대비 50% 증가, 희소성 스케일링 법칙에 근거'},
 {k:'사전학습 토큰', v:'15.5T', d:'MuonClip으로 **손실 스파이크 0회** 달성했다고 명시'},
 {k:'SWE-bench Verified', v:'65.8', d:'non-thinking 설정, Abstract'},
 {k:'Tau2-bench (micro-avg)', v:'66.1', d:'에이전틱 tool-use 벤치마크, Abstract'},
 {k:'QK-Clip 발동 비율', v:'헤드의 12.7%', d:'초기 70,000스텝 동안만, 이후 전 헤드 자연 비활성화(부록 D)'}
],

impact:'"1조 파라미터를 손실 스파이크 없이 학습했다"는 주장 자체보다, **그 방법을 구체적인 알고리즘(Algorithm 1)으로 공개**했다는 점이 실용적이다. QK-Clip은 MLA처럼 QK-Norm을 못 쓰는 구조에서도 적용 가능한 사후 가중치 재조정이라, 이후 대규모 MoE를 Muon 계열로 학습하려는 시도의 참조점이 됐다. 동시에 tool-use 합성 데이터 파이프라인은 에이전틱 벤치마크(Tau2-bench, ACEBench, SWE-bench)에서 비-사고형(non-thinking) 오픈 모델 중 최고 수준 성능을 냈다고 보고하며, "사고 없이도 도구를 잘 쓴다"는 축을 별도로 세웠다.',

legacy:[
 '**Muon 대규모화의 안전장치 사례** — QK-Clip이 Muon의 토큰 효율을 1T 규모까지 끌고 간 구체적 방법으로 인용됨',
 '**희소성 스케일링 법칙의 실측 근거** — 전문가 수를 늘리는 쪽이 같은 FLOPs에서 유리하다는 관측이 이후 MoE 설계 논의에서 참조됨',
 '**합성 tool-use 데이터 파이프라인** — 시뮬레이션 환경 기반 거절 샘플링 방식이 에이전틱 SFT/RL 데이터 생성의 사례로 남음'
],

pitfalls:[
 '**"손실 스파이크 0회"는 QK-Clip 덕분이지 MoE나 스케일 자체의 성질이 아니다.** 같은 규모를 AdamW나 QK-Clip 없는 Muon으로 학습하면 재현되지 않는다 — 논문도 Muon이 AdamW보다 로짓 폭주가 **더 잦다**고 명시한다.',
 '**QK-Clip은 대부분의 학습에서 결국 꺼진다.** 초기 70,000스텝(전체의 일부)에만 개입했다는 점에서, "1조 파라미터를 QK-Clip이 계속 통제한다"는 식으로 이해하면 안 된다.',
 '**벤치마크 수치는 모두 non-thinking 설정이다.** [Qwen3](#/p/qwen3)류의 확장형 사고(extended thinking) 모드와 직접 비교하려면 이 전제를 확인해야 한다.'
],

figures:[
 {f:'fig2-maxlogits.png',
  cap:'왼쪽: 바닐라 Muon은 학습 스텝이 늘수록 최대 attention 로짓이 1000을 넘기며 폭주. 오른쪽: MuonClip(τ=100)을 쓴 실제 K2 학습에서는 로짓이 100에서 한동안 상한을 유지하다 약 70,000스텝(전체의 30%) 이후 30 근처로 스스로 내려가 안정된다 — clip이 계속 걸려 있는 게 아니라 일시적 개입임을 보여준다.',
  src:'원문 Figure 2, p.4'}
],

quotes:[
 {t:'Based on MuonClip, K2 was pre-trained on 15.5 trillion tokens with zero loss spike.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2507.20534 — Kimi K2: Open Agentic Intelligence', u:'https://arxiv.org/abs/2507.20534'},
 {t:'GLM-4.5', u:'#/p/glm-45'},
 {t:'gpt-oss', u:'#/p/gpt-oss'}
]
});
