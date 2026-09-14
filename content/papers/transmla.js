WIKI.paper({
slug:'transmla',
venue:'arXiv 2025 (Peking University · BIGAI · Tencent Youtu · Xiaomi)',
authors:'Meng, Tang, Tang, Yao, Sun, Zhang (Peking University · BIGAI · Tencent Youtu Lab · Xiaomi)',
arxiv:'2502.07864',

tldr:'같은 KV 캐시 크기라면 [MLA](#/p/deepseek-v2)가 [GQA](#/p/gqa)보다 표현력이 이론적으로 더 크다는 것을 증명하고, 이미 GQA로 학습된 [LLaMA](#/p/llama2)·[Qwen](#/p/qwen)·Gemma·Mistral 같은 모델을 **처음부터 재학습하지 않고** MLA 구조로 변환하는 절차를 제시한다. LLaMA-2-7B에서 KV 캐시를 93% 압축하고도 6B 토큰의 가벼운 미세조정만으로 성능을 되살렸다.',

context:'[GQA](#/p/gqa)는 query head를 $g$ 개 그룹으로 묶어 그룹당 하나의 key·value head를 공유하는 식으로 [KV 캐시](#/c/gqa-mqa)를 줄인다. DeepSeek-V2/V3/R1의 [MLA](#/p/deepseek-v2)는 다른 방식을 쓴다 — key·value를 저랭크 잠재 벡터로 압축하고, 추론 시 그 압축된 표현을 query 투영에 흡수(Absorb)시켜 원래 크기로 되돌리지 않고도 attention을 계산한다. MLA가 같은 캐시 예산에서 더 나은 품질-메모리 트레이드오프를 보인다는 것은 DeepSeek 시리즈의 실증으로 이미 알려져 있었지만, 대부분의 모델 제공사는 이미 GQA 기반 모델에 막대한 투자를 해 둔 상태라 MLA로 처음부터 재학습할 유인이 없었다. 게다가 GQA를 MLA로 직접 바꾸는 데는 구조적 장벽이 있다 — GQA의 모든 query·key head가 각자 [RoPE](#/c/rope-c) 회전을 갖고 있는데, 이 개별 회전이 Absorb 연산(MLA가 빠른 이유의 핵심)을 막는다.',

ideas:[
 {h:'같은 캐시 크기에서 GQA < MLA < MQA',
  lead:'GQA의 head별 투영 행렬은 MLA의 저랭크 공유 투영의 특수(희소)한 경우로 표현된다.',
  d:'GQA는 캐시 크기가 $2gd$(그룹 수 $g$ × head 차원 $d$ × 2)일 때, key 투영 $W^K$ 가 그룹마다 같은 블록을 반복하는 특수한 형태의 행렬이다. 저자들은 랭크 $r_{kv}=2gd$ 인 MLA의 저랭크 투영이 이 GQA 행렬을 **선택 행렬**(블록 대각의 0/1 행렬)로 정확히 재현할 수 있음을 보여, GQA가 MLA의 부분집합임을 증명한다. 반대로 MLA가 GQA로 정확히 재현되는 경우는 일반적으로 성립하지 않으므로, 같은 캐시 예산에서 MLA의 표현력이 **약하지 않게(엄밀히는 더 크게)** 된다. MQA는 이 스펙트럼의 반대쪽 극단으로, 공유가 가장 강한 대신 표현력이 가장 크다(캐시를 head 차원 하나로 다 몰아준다는 의미에서).'},
 {h:'RoRoPE: 위치 정보를 한 head로 몰아 나머지의 RoPE를 없앤다',
  lead:'PCA와 head 간 회전으로 위치 신호를 첫 head에 집중시켜 나머지 head는 RoPE 없이 압축 가능하게 만든다.',
  d:'GQA를 MLA로 바꾸려면 key의 RoPE 성분을 분리해야 한다(DeepSeek의 Decoupled RoPE처럼). RoRoPE는 key 출력에 PCA를 적용하고, 모든 attention head에 걸쳐 **같은 차원끼리만** 회전시키는 행렬 $U$ — RoPE의 실수부·허수부를 동일하게 회전시키는 조건을 만족하는 — 를 찾아 여러 head에 흩어진 위치 정보의 주성분을 첫 head 하나로 모은다. 이 회전은 query·key 내적을 바꾸지 않는다는 것이 증명된 성질이라, 정보 손실 없이 재배치만 하는 셈이다. 결과적으로 첫 head를 뺀 나머지 head들은 RoPE 의존이 거의 사라져 압축 대상이 된다.'},
 {h:'FreqFold: 인접 주파수를 접어 집중 효율을 더 높인다',
  lead:'RoPE 인접 차원의 주파수가 비슷하다는 성질을 이용해 첫 head로의 집중을 한 단계 더 끌어올린다.',
  d:'RoRoPE 혼자서는 head 하나에 모든 위치 정보를 몰아넣는 데 한계가 있다. RoPE의 인접 차원들이 비슷한 회전 주파수 $\\theta_i$ 를 갖는다는 사실을 이용해, 이 인접 차원들을 접어(fold) 합침으로써 첫 head의 집중 효율을 개선한다. 이 두 기법(RoRoPE + FreqFold)을 합쳐야 $K_{rope}$(위치 정보 담당)와 $K_{nope}$(내용 정보 담당, RoPE 없음)로 확실히 분리된다.'},
 {h:'BKV-PCA: Key와 Value의 크기를 맞춘 뒤에 합쳐서 압축한다',
  lead:'K_nope의 노름이 V보다 훨씬 커서, 크기를 맞추지 않고 합쳐 PCA하면 V의 정보가 묻힌다.',
  d:'$K_{nope}$ 와 $V$ 를 이어붙여 공동 저랭크 근사(joint PCA)를 하면 압축을 한 번에 끝낼 수 있지만, 실측 결과 $K_{nope}$ 의 $\\ell_2$-노름이 $V$ 보다 훨씬 커서 PCA의 주성분이 $K_{nope}$ 쪽으로 쏠리고 $V$ 정보가 크게 손실됐다. Balanced Key-Value(BKV) 절차는 PCA 전에 두 텐서의 노름을 맞추는 **재조정 단계**를 하나 추가한다. 이 단순한 정규화만으로 압축 품질이 눈에 띄게 개선됐다 — MHA2MLA 같은 동시대 연구가 이 균형 조정 없이 SVD를 바로 적용해 더 큰 손실을 본 것과 대비된다.'}
],

diagram:{type:'flow', cap:'GQA 체크포인트를 MLA로 바꾸는 변환 파이프라인. 각 단계는 가중치를 재배치·압축할 뿐 재학습을 전제하지 않는다.',
 nodes:[
  {t:'GQA 체크포인트', s:'head별 개별 RoPE'},
  {t:'RoRoPE', s:'PCA + head간 회전', acc:true, a:'위치정보 집중'},
  {t:'FreqFold', s:'인접 주파수 접기'},
  {t:'BKV-PCA', s:'노름 균형 후 공동압축'},
  {t:'MLA 체크포인트', s:'6B 토큰 미세조정'}
 ]},

math:[
 {expr:'W\'^K = W^UK · W^DKV   (GQA는 W^UK가 선택 행렬인 특수 MLA)',
  tex:'W\'^{K} = W^{UK} \\cdot W^{DKV}',
  d:'GQA의 유효 key 투영 $W\'^K$(랭크 $\\le gd$)는 랭크 $r_{kv}=2gd$ 인 MLA의 하향 투영 $W^{DKV}$ 와 상향 투영 $W^{UK}$ 의 곱으로 정확히 재현된다. $W^{UK}$ 를 블록 단위 0/1 선택 행렬로 두면 그룹별 key 공유를 그대로 흉내낼 수 있다는 것이 GQA ≤ MLA 증명의 핵심 구성이다.'}
],

numbers:[
 {k:'KV 캐시 압축 (학습 없이)', v:'68.75% 감소, 성능 하락 1.65%', d:'LLaMA-2, 6개 벤치마크 평균. 동시대 MHA2MLA는 같은 조건에서 21.85% 하락'},
 {k:'최대 압축률', v:'93%', d:'LLaMA-2-7B. 이 수준에서도 출력이 의미를 유지'},
 {k:'복구에 필요한 토큰', v:'6B 토큰 미세조정', d:'93% 압축 후 여러 벤치마크에서 성능을 대체로 회복'},
 {k:'추론 가속', v:'8K 컨텍스트에서 최대 10.6×', d:'vLLM, 92.97% KV 캐시 압축 모델, 165.2 TFLOPS·24GB 하드웨어. 더 큰 하드웨어(312/320 TFLOPS)에서는 각각 6.5×·5.1×'},
 {k:'KV 캐시 압축률 표기', v:'-68.75% / -87.50% / -92.97%', d:'논문이 실험한 단계별 압축 수준, 표기는 원본 KV 캐시 대비 감소율'}
],

figures:[
 {f:'fig1-transform.png',
  cap:'(a) 같은 KV 캐시 크기에서 GQA·MLA·MQA로 갈수록 표현력이 커진다는 이론 결과의 도식. (b) TransMLA의 변환 파이프라인 — 왼쪽 K에서 시작해 RoRoPE·FreqFold로 위치 정보를 K_rope에 모으고 K_nope·V를 BKV-PCA로 공동 압축해 오른쪽의 작은 K_rope·C_kv(잠재 캐시)로 끝난다.',
  src:'원문 Figure 1, p.1'}
],

impact:'MLA를 "DeepSeek만의 아키텍처"에서 "기존 GQA 모델에 이식 가능한 변환 대상"으로 바꿨다. 이론적으로는 같은 KV 캐시 예산에서 GQA가 MLA의 표현력 부분집합이라는 것을 증명해, MLA 채택의 근거를 수치 실험이 아니라 구조적 논증으로 제시했다. 실용적으로는 LLaMA·Qwen·Gemma·Mistral 같은 이미 널리 배포된 GQA 모델들이 재학습 없이 DeepSeek 생태계(FP8 양자화, Multi-Token Prediction, [vLLM](#/p/vllm)·[SGLang](#/p/sglang)의 MLA 최적화 커널)를 그대로 쓸 수 있는 길을 열었다.',

legacy:[
 '**GQA→MLA 변환이라는 연구 갈래를 개척** — 동시대 MHA2MLA를 포함해 이후 여러 연구가 이 문제를 다루는 출발점이 됨',
 '**Absorb 연산과 RoPE 분리의 일반화** — DeepSeek 고유의 Decoupled RoPE 아이디어를 임의의 GQA 아키텍처에 적용 가능한 절차(RoRoPE·FreqFold)로 일반화',
 '**KV·V 노름 불균형 문제의 명시화** — 저랭크 공동압축에서 스케일이 다른 텐서를 그냥 합치면 실패한다는 것을 구체적으로 보여, 이후 유사 압축 기법의 표준 점검 항목이 됨'
],

pitfalls:[
 '**10.6배는 특정 조건(8K 컨텍스트, 특정 저사양 하드웨어, 93% 압축)에서의 결과다.** 컨텍스트가 짧거나 하드웨어가 더 강력할수록(312·320 TFLOPS 조건에서 6.5×·5.1×) 배수가 줄어든다. "TransMLA는 10배 빠르다"고 조건 없이 옮기면 과장이다.',
 '**표현력이 이론적으로 크다는 것이 실제 학습 성능 우위를 보장하지 않는다.** 증명은 GQA의 투영이 MLA의 특수 사례로 표현 가능하다는 구조적 사실이며, 최적화로 그 표현력에 실제로 도달한다는 것과는 별개다.',
 '**완전히 학습 없는 변환은 압축률이 커질수록 성능이 떨어진다.** 68.75% 압축은 학습 없이도 1.65% 손실로 버티지만, 93%까지 가면 미세조정(6B 토큰)이 사실상 필수다.'
],

links:[
 {t:'arXiv 2502.07864 — TransMLA: MLA Is All You Need', u:'https://arxiv.org/abs/2502.07864'},
 {t:'fxmeng/TransMLA (GitHub)', u:'https://github.com/fxmeng/TransMLA'}
]
});
