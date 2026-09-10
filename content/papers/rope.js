WIKI.paper({
slug:'rope',
venue:'Neurocomputing 2024 (arXiv 2021)',
authors:'Jianlin Su et al. (Zhuiyi Technology, 선전)',
arxiv:'2104.09864',

tldr:'위치 정보를 벡터에 **더하는** 대신, Query·Key를 위치에 비례하는 각도만큼 **회전**시킨다. 절대 위치로 회전했는데 내적을 취하면 회전각이 상쇄되어 상대 위치 $m-n$ 만 남는다 — 절대 위치 구현으로 상대 위치 의미를 얻는 트릭이다. 오늘날 거의 모든 오픈 LLM의 기본 위치 인코딩이다.',

context:'[Transformer](#/p/transformer)는 sin/cos 절대 위치 인코딩을 임베딩에 더했다. 구현은 간단하지만 두 가지가 불편했다. 첫째, 모델이 "5칸 떨어짐"이라는 **상대** 관계를 알아내려면 두 절대 위치 벡터의 차이를 스스로 학습해야 한다. 둘째, 학습 때 본 적 없는 위치 인덱스가 나오면 그 위치 임베딩은 처음 보는 벡터라 성능이 무너진다. 그래서 Shaw et al.(2018), Transformer-XL, [T5](#/p/t5)의 relative position bias처럼 attention 점수에 상대 거리 항을 직접 더하는 계열이 나왔는데, 이들은 $n \\times n$ 짜리 상대 거리 행렬을 만들어야 해서 느리고 linear attention 같은 변형과 결합하기 어려웠다. RoPE는 "attention 점수를 건드리지 말고 Q·K 벡터 자체를 바꾸자"는 세 번째 길을 택한다.',

ideas:[
 {h:'위치를 각도로 바꾼다',
  lead:'벡터를 2차원씩 묶어 위치에 비례하는 각도만큼 쌍마다 다른 속도로 회전시킨다.',
  d:'$d$ 차원 벡터를 2차원씩 $d/2$ 쌍으로 묶고, 위치 $m$ 인 토큰의 각 쌍을 $m\\theta_i$ 만큼 **회전**시킨다. $\\theta_i = 10000^{-2i/d}$ 로 쌍마다 회전 속도를 다르게 준다 — 앞쪽 쌍은 빠르게 돌아 미세한 위치 차이를, 뒤쪽 쌍은 느리게 돌아 넓은 범위의 위치를 인코딩한다. 시계 바늘이 초침·분침·시침으로 다른 시간 척도를 표현하는 것과 같은 구조다.'},
 {h:'내적을 취하면 절대 위치가 사라진다',
  lead:'회전행렬의 직교성 때문에 두 벡터 내적에는 상대 거리 $n-m$ 만 남는다.',
  d:'회전 행렬은 직교행렬이라 $R_m^T R_n = R_{n-m}$ 이 성립한다. 따라서 $\\langle R_m q, R_n k \\rangle = q^T R_{n-m} k$ — **attention 점수가 오직 상대 거리 $n-m$ 에만 의존**한다. 절대 위치로 각 벡터를 따로 변환했는데 결과는 상대 위치 인코딩이 되는 것이 이 논문의 핵심이다.'},
 {h:'노름을 보존하기 때문에 어디에나 끼워 넣을 수 있다',
  lead:'회전은 벡터 크기를 바꾸지 않아 linear attention·FlashAttention과도 그대로 호환된다.',
  d:'더하는 방식과 달리 회전은 벡터의 크기를 바꾸지 않는다. 그래서 스케일이 망가지지 않고, Q·K에만 적용하고 V는 건드리지 않아도 되며, $QK^T$ 행렬을 명시적으로 만들지 않는 linear attention이나 [FlashAttention](#/p/flashattention) 커널과도 그대로 호환된다. 상대 거리 bias를 $n \\times n$ 행렬로 더하는 방식이 못 하는 일이다.'},
 {h:'먼 토큰일수록 자연스럽게 약해진다 (long-term decay)',
  lead:'여러 주파수의 회전이 거리에 따라 서로 어긋나며 먼 토큰의 영향력이 자연히 준다.',
  d:'논문은 Abel 변환으로, $\\theta_i$ 를 지수적으로 배치하면 상대 거리가 커질수록 내적 항들의 평균 크기가 감소함을 보인다. 여러 주파수의 회전이 거리가 멀어질수록 서로 어긋나 상쇄되기 때문이다. "가까운 토큰이 더 중요하다"는 언어의 사전지식이 **별도 페널티 없이 기하학에서 따라 나온다**.'},
 {h:'외삽이 임베딩 조회가 아니라 각도 계산이 된다',
  lead:'위치가 테이블 항목이 아니라 각도값이라 범위 밖 위치도 계산은 항상 가능하다.',
  d:'학습된 위치 임베딩 테이블은 인덱스 4096을 넘으면 참조할 항목 자체가 없다. RoPE에서 위치 5000은 그냥 각도 $5000\\theta_i$ 이므로 **계산은 언제나 가능하다**. 다만 학습 중 본 적 없는 각도 영역이라 그대로 두면 품질이 떨어지고, 여기서 각도를 조정하는 실무 기법군이 파생된다(아래 참조).'}
],

diagram:{type:'compare', cap:'위치를 어떻게 주입하는가. 왼쪽은 벡터를 이동시키고, 오른쪽은 벡터를 돌린다.',
 left:{t:'기존: 절대 위치 인코딩을 더함', items:[
  'x ← embedding + PE(pos)',
  '입력 단계에서 한 번만 주입',
  '상대 거리는 모델이 알아서 학습',
  '학습 범위 밖 인덱스 = 미학습 벡터',
  '층이 깊어질수록 위치 신호 희석']},
 right:{t:'RoPE: Q·K를 위치각만큼 회전', items:[
  '매 층 attention마다 Q·K를 회전',
  '내적이 자동으로 상대거리만 남김',
  '노름 보존 → linear attention과 호환',
  '거리 멀수록 위상 상쇄 → long-term decay',
  '위치는 테이블 조회가 아닌 각도 계산']}},

math:[
 {expr:'R_Θ,m = blockdiag( [cos mθ_i, −sin mθ_i ; sin mθ_i, cos mθ_i] ),  θ_i = 10000^(−2i/d)',
  tex:'R_{\\Theta,m}=\\text{blockdiag}\\!\\begin{pmatrix}\\cos m\\theta_i & -\\sin m\\theta_i\\\\ \\sin m\\theta_i & \\cos m\\theta_i\\end{pmatrix},\\quad \\theta_i=10000^{-2i/d}',
  d:'$d/2$ 개의 2×2 회전 블록으로 이루어진 블록대각 행렬. 실제 구현은 행렬곱이 아니라 `x*cos + rotate_half(x)*sin` 두 줄의 원소별 연산이다.'},
 {expr:'⟨ R_m q, R_n k ⟩ = qᵀ R_mᵀ R_n k = qᵀ R_(n−m) k',
  tex:'\\langle R_m q,\\, R_n k\\rangle = q^{\\top} R_m^{\\top} R_n k = q^{\\top} R_{n-m} k',
  d:'회전 행렬의 직교성 $R^T = R^{-1}$ 에서 바로 나온다. 논문의 모든 주장이 이 한 줄에 걸려 있다.'},
 {expr:'θ_i\' = θ_i / s   (position interpolation, s = 확장 배율)',
  tex:'\\theta_i\' = \\theta_i / s \\quad (s = \\text{확장 배율})',
  d:'후속 연구의 문맥 확장 공식. base 10000을 키우거나 위치를 $s$ 로 나눠 **학습 중 봤던 각도 범위 안으로 압축**한다. NTK-aware scaling은 고주파는 거의 건드리지 않고 저주파만 늘려 세밀한 위치 분해능을 지킨다.'}
],

numbers:[
 {k:'base θ', v:'10000', d:'[Transformer](#/p/transformer) 사인 인코딩의 값을 그대로 계승. 문맥 확장 시 이 값을 500000 등으로 키우는 것이 실무 관행'},
 {k:'WMT14 EN→DE BLEU', v:'27.5 vs 27.3', d:'RoFormer vs 베이스라인 Transformer — 원 논문의 이득은 크지 않았다'},
 {k:'CAIL2019-SCM', v:'68.29% (512) → 69.79% (1024)', d:'중국어 법률 유사판례 매칭. 긴 문맥일수록 이득이 커지는 경향'},
 {k:'회전 단위', v:'2차원 쌍 × d/2개', d:'쌍마다 회전 속도가 지수적으로 달라 서로 다른 위치 척도를 담당'}
],

impact:'원 논문의 벤치마크 이득(BLEU +0.2)은 소박했지만, **[LLaMA](#/p/llama)가 채택하면서 사실상 업계 표준**이 되었다. Llama·Mistral·Qwen·[DeepSeek-V3](#/p/deepseek-v3) 등 오늘날 대부분의 오픈 LLM이 RoPE를 쓴다. 실무에서 결정적이었던 것은 벤치마크가 아니라 **문맥 확장 가능성**이다. 위치가 각도이므로 각도의 스케일만 바꾸면 4K로 학습한 모델을 32K·128K로 늘릴 수 있고, 이 조정은 파인튜닝 몇 백 스텝 혹은 추론 시 설정 변경만으로도 어느 정도 작동한다. "긴 문맥 지원"이 새 모델 학습이 아니라 **하이퍼파라미터 조정 문제**가 된 것이 RoPE의 실질적 기여다.',

legacy:[
 '**Position Interpolation / NTK-aware scaling / [YaRN](#/p/yarn)** — RoPE 각도를 압축하거나 주파수 대역별로 다르게 늘려 문맥을 8배~32배 확장하는 기법군. `rope_scaling` 설정으로 추론 프레임워크에 그대로 노출되어 있다',
 '**[LLaMA](#/p/llama) 계열 전반** — [Llama 2](#/p/llama2), [Mistral](#/p/mistral), [DeepSeek-V3](#/p/deepseek-v3)까지 RoPE + [GQA](#/p/gqa) + pre-LN 조합이 오픈 LLM의 기본 골격이 됨',
 '**멀티모달로의 확장** — 2D/3D 좌표를 회전각으로 인코딩하는 축별 RoPE가 이미지·비디오 트랜스포머에 이식됨',
 '**[ALiBi](#/p/alibi)와의 노선 경쟁** — 같은 시기 "위치 임베딩을 아예 없애고 거리 페널티만 주자"는 대안이 나왔고, 외삽 능력과 품질 사이 트레이드오프를 두고 두 계열이 갈렸다'
],

pitfalls:[
 '**RoPE가 저절로 외삽되는 것은 아니다.** 위치 5000의 각도를 "계산할 수 있다"와 "그 각도에서 모델이 제대로 동작한다"는 다른 문제다. scaling 없이 학습 길이를 넘기면 perplexity가 급격히 발산하는 것이 일반적이다.',
 '**문맥을 늘리면 짧은 문맥 성능이 깎일 수 있다.** 각도를 압축하면 인접 토큰 사이의 각도 차이도 함께 줄어 세밀한 위치 분해능이 떨어진다. NTK/YaRN 계열이 주파수 대역을 나눠 다루는 이유가 이것이다.',
 '**base 값과 확장 설정이 체크포인트와 반드시 일치해야 한다.** `rope_theta`나 `rope_scaling`을 학습 때와 다르게 두고 추론하면 조용히 품질만 떨어진다 — 에러가 나지 않아서 발견이 늦다.'
],

figures:[
 {f:'fig1-rotation-illustration.png',
  cap:'d=2 인 단순화된 경우다. 왼쪽 벡터 $(x_1,x_2)$ 가 Query/Key 원본이고, 위치 $m$ 이 정해지면 그만큼의 각도 $m\\theta_1$ 만큼 **원점을 중심으로 회전**시켜(가운데 그래프의 화살표가 돌아가는 모습) 오른쪽의 $(x_1\\prime, x_2\\prime)$ 를 얻는다. 즉 위치 정보가 벡터에 "더해지는" 것이 아니라 벡터의 "방향을 트는" 방식으로 들어간다는 것이 이 그림의 핵심.',
  src:'원문 Figure 1, p.5'}
],

quotes:[
 {t:'RoPE encodes the absolute position with a rotation matrix and meanwhile incorporates the explicit relative position dependency in self-attention formulation.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2104.09864 — RoFormer: Enhanced Transformer with Rotary Position Embedding', u:'https://arxiv.org/abs/2104.09864'},
 {t:'arXiv 2306.15595 — Extending Context Window via Position Interpolation', u:'https://arxiv.org/abs/2306.15595'},
 {t:'arXiv 2309.00071 — YaRN: Efficient Context Window Extension', u:'https://arxiv.org/abs/2309.00071'}
]
});
