WIKI.paper({
slug:'qlora',
venue:'NeurIPS 2023',
authors:'Tim Dettmers et al. (University of Washington)',
arxiv:'2305.14314',

tldr:'동결된 백본을 **4-bit로 양자화**한 채 그 위에 [LoRA](#/p/lora) 어댑터를 얹어 학습한다. NF4 자료형 · 이중 양자화 · paged optimizer 세 장치로 **65B 모델의 미세조정을 48GB GPU 한 장**에 밀어 넣으면서 16-bit 전체 미세조정 성능을 그대로 유지했다.',

context:'[LoRA](#/p/lora)가 학습 파라미터와 옵티마이저 상태를 지웠지만, 남은 병목이 하나 있었다 — **동결된 백본 자체의 무게**다. 65B 모델은 fp16으로만 130GB이고, 여기에 gradient checkpointing과 activation을 얹으면 미세조정에 780GB 이상의 GPU 메모리가 필요하다. A100 80GB 여러 대를 묶어야 하는 규모다. 한편 [LLM.int8()](#/p/llm-int8)과 [GPTQ](#/p/gptq)가 추론용 양자화를 성립시켜 놓았지만, **양자화된 가중치를 통과해 역전파하는 학습**은 별개의 문제였다. QLoRA의 질문은 이것이다 — 백본은 4-bit로 눌러 읽기 전용으로 두고, 학습 신호는 그것을 그냥 통과시켜 16-bit 어댑터에만 흘리면 안 되는가?',

ideas:[
 {h:'NF4 — 정규분포 가중치에 맞춘 4-bit 자료형',
  lead:'격자점을 표준정규분포 분위수로 배치해 0 근처 밀집 값의 손실을 줄인다.',
  d:'신경망 가중치는 대략 0 중심의 정규분포를 따른다. 균등 간격(int4)으로 자르면 밀도가 높은 0 근처에서 손실이 크다. NF4(4-bit NormalFloat)는 **표준정규분포의 분위수(quantile)** 로 16개 격자점을 배치해, 각 구간에 들어가는 값의 개수가 같아지도록 만든 자료형이다. 논문은 이것이 정규분포 데이터에 대해 정보이론적으로 최적임을 논증하고, 실험적으로 fp4·int4보다 일관되게 낫다는 것을 보인다.'},
 {h:'이중 양자화 — 양자화 상수까지 양자화한다',
  lead:'블록별 fp32 스케일 상수를 다시 8-bit로 양자화해 오버헤드를 더 줄인다.',
  d:'블록 단위 양자화는 64개 가중치마다 스케일 상수 하나를 fp32로 저장한다. 이 상수 자체가 파라미터당 $32/64 = 0.5$ 비트의 오버헤드다. QLoRA는 이 상수들을 다시 모아 256개 단위로 8-bit 양자화한다. 파라미터당 평균 **약 0.37비트**를 절약하는데, 65B 모델에서는 이것만으로 약 3GB다 — 48GB 한 장에 들어가느냐 마느냐를 가르는 크기다.'},
 {h:'Paged Optimizer — OOM 스파이크를 CPU로 흘려보낸다',
  lead:'옵티마이저 상태를 필요할 때만 CPU RAM으로 페이징해 메모리 스파이크를 견딘다.',
  d:'긴 시퀀스가 들어오면 gradient checkpointing 중에 메모리가 순간적으로 치솟아 OOM으로 학습이 죽는다. NVIDIA unified memory를 이용해 옵티마이저 상태를 **운영체제의 페이징처럼 CPU RAM으로 자동 축출**했다가 필요할 때 되가져온다. 평균 사용량을 줄이는 게 아니라 **최악의 순간 스파이크를 견디게** 하는 장치다.'},
 {h:'전방 계산 시에만 역양자화한다',
  lead:'가중치는 NF4로만 저장하고 행렬곱 직전에만 BF16으로 잠깐 되돌려 쓴다.',
  d:'가중치는 항상 NF4로 저장돼 있고, 각 층의 행렬곱 직전에만 계산용 자료형(BFloat16)으로 되돌려 쓰고 즉시 버린다. 역전파는 이 동결된 4-bit 가중치를 **그대로 통과해** LoRA 어댑터 $A, B$ 에만 gradient를 남긴다. 백본에 대한 gradient도, 옵티마이저 상태도 존재하지 않는다.'},
 {h:'모든 선형 층에 어댑터를 붙여야 격차가 사라진다',
  lead:'attention만이 아니라 FFN까지 모든 선형 층에 붙여야 전체 미세조정을 따라잡는다.',
  d:'논문의 실용적으로 가장 중요한 발견이다. LoRA 원 논문처럼 $W_q, W_v$ 에만 붙이면 4-bit 백본에서는 전체 미세조정 성능을 따라잡지 못한다. **모든 선형 층**(attention 투영 4개 + FFN 전부)에 어댑터를 붙였을 때 비로소 16-bit 전체 미세조정과 대등해진다. 오늘날 실무에서 `target_modules`를 전부 지정하는 관행이 여기서 굳었다.'}
],

diagram:{type:'flow', cap:'QLoRA의 forward 경로. 저장은 4-bit, 계산은 BF16, 학습되는 것은 어댑터뿐.',
 nodes:[
  {t:'NF4 백본', s:'4-bit · 동결', acc:true},
  {t:'역양자화', s:'→ BFloat16 (일시적)'},
  {t:'W₀x 계산', s:'gradient 통과만'},
  {t:'+ LoRA BAx', s:'BF16 · 학습 대상'},
  {t:'출력 h', s:'옵티마이저 상태는 어댑터 것만'}
 ]},

math:[
 {expr:'Y^BF16 = X^BF16 · doubleDequant( c₁^FP32, c₂^k-bit, W^NF4 ) + X^BF16 · L₁^BF16 L₂^BF16',
  tex:'Y^{BF16} = X^{BF16}\\cdot\\text{doubleDequant}(c_1^{FP32}, c_2^{k\\text{-bit}}, W^{NF4}) + X^{BF16} L_1^{BF16} L_2^{BF16}',
  d:'논문의 핵심 수식. 앞항은 이중 양자화된 4-bit 백본을 그때그때 풀어 쓰는 것이고, 뒷항이 학습되는 LoRA 분기다. 저장은 NF4, 계산은 BF16.'},
 {expr:'q_i = ½ ( Q_N( i/17 ) + Q_N( (i+1)/17 ) )   — NF4 격자점',
  tex:'q_i = \\tfrac12\\big(Q_N(i/17) + Q_N((i{+}1)/17)\\big)',
  d:'표준정규분포의 분위수 함수 $Q_N$ 으로 16개 격자를 만들고 $[-1,1]$ 로 정규화한다. 정확히 0을 표현하는 점이 포함되도록 비대칭 처리를 하는 것이 세부 요령이다.'},
 {expr:'오버헤드:  32/64 = 0.5 bit/param  →  8/64 + 32/(64·256) ≈ 0.127 bit/param',
  tex:'\\frac{32}{64}=0.5\\ \\text{bit/param}\\;\\longrightarrow\\;\\frac{8}{64}+\\frac{32}{64\\cdot256}\\approx 0.127\\ \\text{bit/param}',
  d:'이중 양자화의 산수. 파라미터당 약 0.37비트가 줄고, 65B에서 약 3GB에 해당한다.'}
],

numbers:[
 {k:'65B 미세조정 메모리', v:'>780GB → <48GB', d:'GPU 한 장(A6000/A100 48GB)에 수렴'},
 {k:'Guanaco 65B', v:'ChatGPT의 99.3%', d:'Vicuna 벤치마크 · GPT-4 심사 기준'},
 {k:'학습 시간', v:'24시간 / 단일 GPU', d:'Guanaco 65B 기준'},
 {k:'이중 양자화 절감', v:'약 0.37 bit/param', d:'65B 모델에서 **약 3GB**'},
 {k:'양자화 블록 크기', v:'가중치 64 · 상수 256', d:'1차/2차 양자화 각각의 블록'},
 {k:'학습한 모델 수', v:'1,000개 이상', d:'8종 지시 데이터셋 · 여러 규모를 교차 실험'}
],

impact:'QLoRA는 **미세조정 가능한 모델 크기의 상한을 하드웨어가 아니라 소프트웨어 문제로 바꿨다.** 65B를 소비자용에 가까운 GPU 한 장에서 학습할 수 있게 되면서, 그때까지 대형 연구소의 전유물이던 대형 모델 미세조정이 개인·소규모 팀으로 내려왔다. 2023년 이후 [LLaMA](#/p/llama)/[Llama 2](#/p/llama2) 기반 오픈 파인튜닝의 대부분이 QLoRA로 만들어졌고, `bitsandbytes` + `peft` + `transformers` 조합이 사실상 표준 스택이 되었다. 또한 논문은 방법론적 기여도 남겼는데, **데이터 품질이 데이터 양보다 중요하다**는 것(작고 잘 고른 OASST1 데이터가 훨씬 큰 데이터셋을 이김)과 GPT-4 자동 평가의 순서 편향 같은 한계를 함께 보고했다.',

legacy:[
 '**개인 규모 미세조정의 표준** — `load_in_4bit` 한 줄로 대형 모델을 튜닝하는 오늘날의 관행이 이 논문에서 직결',
 '**양자화 학습 계열의 확장** — 양자화 오차를 어댑터 초기화에 반영하는 LoftQ, 4-bit 이하를 노리는 후속 연구들이 파생',
 '**추론 양자화와의 분업 정착** — 학습은 QLoRA(NF4), 배포는 [GPTQ](#/p/gptq)/[AWQ](#/p/awq)로 다시 양자화하는 파이프라인이 관행화',
 '**데이터 중심 정렬** — 소량 고품질 지시 데이터로 충분하다는 관찰이 이후 [지시 학습](#/p/flan)·[DPO](#/p/dpo) 계열 데이터셋 설계에 영향'
],

pitfalls:[
 '**메모리는 줄지만 속도는 느려진다.** 매 forward마다 역양자화가 들어가므로 fp16 LoRA보다 학습 처리량이 떨어진다. QLoRA는 "빠르게 학습하는 방법"이 아니라 **애초에 올라가지도 않던 모델을 올리는 방법**이다. 메모리가 충분하다면 그냥 fp16 LoRA가 낫다.',
 '**병합할 때 양자화 오차와 섞인다.** 4-bit 백본에 어댑터를 그대로 더하면 성능이 떨어질 수 있다. 배포용 단일 가중치를 만들려면 원본 fp16 백본을 다시 불러와 병합한 뒤, 필요하면 [GPTQ](#/p/gptq)/[AWQ](#/p/awq)로 새로 양자화하는 것이 안전하다.',
 '**논문의 평가는 GPT-4 심사 기반이다.** 저자들 스스로 자동 평가의 위치 편향과 벤치마크 간 순위 불일치를 보고했다. "ChatGPT의 99.3%"는 Vicuna 벤치마크에서의 상대 점수이지 일반 능력이 동등하다는 뜻이 아니며, 특히 지식·추론 벤치마크로 옮기면 격차가 남는다.'
],

figures:[
 {f:'fig1-finetuning-memory-comparison.png',
  cap:'세 방식 모두 아래 Base Model에서 위로 gradient(초록)가 흐르고 Adapters로 업데이트(파랑)가 내려온다는 점은 같다. 차이는 무엇이 몇 bit로 저장되느냐다 — Full Finetuning은 Base Model 자체가 16-bit이고 그 위에 32-bit Optimizer State까지 통째로 들고 있다. LoRA는 Base Model은 그대로 16-bit지만 학습 대상은 작은 Adapter뿐이다. QLoRA는 Base Model을 4-bit로 낮추고, Optimizer State(문서 아이콘)에 CPU로 빠져나가는 분홍 화살표(Paging Flow)가 추가된 것이 보이는데 이게 메모리 스파이크를 CPU로 흘려보내는 Paged Optimizer다.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'QLoRA backpropagates gradients through a frozen, 4-bit quantized pretrained language model into Low Rank Adapters (LoRA).',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2305.14314 — QLoRA: Efficient Finetuning of Quantized LLMs', u:'https://arxiv.org/abs/2305.14314'},
 {t:'artidoro/qlora — 원저자 구현', u:'https://github.com/artidoro/qlora'},
 {t:'bitsandbytes — NF4 · paged optimizer 구현체', u:'https://github.com/bitsandbytes-foundation/bitsandbytes'}
]
});
