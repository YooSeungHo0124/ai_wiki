WIKI.paper({
slug:'llama',
venue:'arXiv 2023 (Meta AI)',
authors:'Touvron et al. (Meta AI)',
arxiv:'2302.13971',

tldr:'공개 데이터만으로 7B~65B 모델을 **[Chinchilla](#/p/chinchilla)가 권하는 것보다 훨씬 많은 토큰**으로 오래 학습시켜, 13B가 175B [GPT-3](#/p/gpt3)를 대부분 벤치마크에서 이기게 만든 논문. 가중치가 연구용으로 배포되면서 오픈 웨이트 생태계의 출발점이 되었다.',

context:'2022년 말의 대형 언어모델은 두 겹으로 닫혀 있었다. 성능 좋은 모델([GPT-3](#/p/gpt3), [PaLM](#/p/palm), Chinchilla)은 가중치가 없었고, 공개된 모델(OPT, BLOOM)은 성능이 처졌다. 게다가 학습 데이터에 비공개 코퍼스가 섞여 있어 재현이 불가능했다. 여기에 방법론적 병목이 하나 더 있었다 — [Chinchilla](#/p/chinchilla)의 "파라미터 1개당 토큰 20개"는 **학습 예산**을 최소화하는 답이지, 모델을 배포해서 수십억 번 추론할 때의 총비용을 최소화하는 답이 아니다. LLaMA는 이 지점을 정면으로 노린다.',

ideas:[
 {h:'추론 비용을 목적함수에 넣는다',
  lead:'학습을 늘리는 대신 배포·추론이 싼 작은 모델을 택한다.',
  d:'[Chinchilla](#/p/chinchilla)의 compute-optimal 곡선은 "고정된 FLOPs로 최저 loss"를 푼다. 하지만 실제 서비스에서는 학습이 한 번, 추론이 수십억 번이다. 그래서 이 논문은 **학습을 더 비싸게 하더라도 작은 모델을 택한다** — 7B 모델을 1.0T 토큰, 65B 모델을 1.4T 토큰까지 밀어붙였다. Chinchilla 비율대로면 7B는 140B 토큰이면 충분한데 그 **7배**를 먹였는데도 loss는 계속 떨어지고 있었다.'},
 {h:'공개 데이터만 쓴다',
  lead:'재배포 가능한 공개 데이터만으로도 SOTA급 성능이 나옴을 증명한다.',
  d:'CommonCrawl(67%), C4(15%), GitHub(4.5%), Wikipedia(4.5%), Books(4.5%), arXiv(2.5%), StackExchange(2%). 전부 재배포 가능한 출처다. 이 제약은 성능을 위한 선택이 아니라 **재현 가능성**을 위한 선택이었고, 결과적으로 "폐쇄 데이터 없이도 SOTA급이 된다"는 존재 증명이 되었다.'},
 {h:'세 개의 부품 교체 — pre-norm RMSNorm, SwiGLU, RoPE',
  lead:'정규화·활성함수·위치인코딩을 RMSNorm·SwiGLU·RoPE로 교체한다.',
  d:'원본 [Transformer](#/p/transformer) 블록에서 세 곳을 바꿨다. **(1)** 정규화를 sublayer 출력이 아니라 **입력**에 걸고([LayerNorm](#/p/layernorm) 대신 RMSNorm) — 평균 빼기를 생략해 학습이 안정적이면서 더 싸다. **(2)** FFN 활성함수를 ReLU 대신 **SwiGLU**로 바꾸고, 게이팅 때문에 늘어난 파라미터를 상쇄하려 hidden 차원을 $4d$ 가 아니라 $\\frac{2}{3}\\cdot 4d$ 로 잡았다. **(3)** 절대 위치 인코딩을 [RoPE](#/p/rope)로 교체했으며, 이 세 조합이 이후 오픈 모델의 **사실상 표준 레시피**가 됐다.'},
 {h:'학습 속도 자체를 엔지니어링한다',
  lead:'효율 커널과 선택적 재계산으로 학습 처리량을 끌어올린다.',
  d:'causal multi-head attention을 메모리 효율 커널([FlashAttention](#/p/flashattention) 계열)로 구현해 마스킹되는 상삼각 부분을 아예 계산하지 않고, activation checkpointing에서 선형 계층 출력처럼 재계산이 비싼 값만 골라 저장했다. 결과적으로 2048장의 A100에서 GPU당 초당 약 380토큰을 처리해, 65B 모델의 1.4T 토큰 학습을 **21일**에 끝냈다.'},
 {h:'"작은 모델을 오래"가 배포를 바꾼다',
  lead:'작은 모델을 오래 학습시켜 배포 하한선을 노트북까지 끌어내린다.',
  d:'13B는 fp16으로 26GB, 4bit 양자화하면 소비자용 GPU 한 장에 들어간다. 성능은 유지한 채 배포 하한선을 데이터센터에서 노트북으로 끌어내린 것이, 이 논문이 실제로 일으킨 변화의 대부분이다.'}
],

diagram:{type:'compare', cap:'같은 벤치마크 점수를 어떤 자원 배분으로 달성하는가 — Chinchilla는 학습 FLOPs를, LLaMA는 추론 비용을 최소화한다',
 left:{t:'Chinchilla: 학습 최적', items:[
  '파라미터 : 토큰 = 1 : 20',
  '70B 모델 · 1.4T 토큰',
  '학습 예산이 목적함수',
  '추론 시 70B를 다 올려야 함']},
 right:{t:'LLaMA: 추론 비용 최적', items:[
  '7B에 1.0T · 65B에 1.4T 토큰',
  '7B 기준 Chinchilla 권장량의 약 7배',
  '학습을 더 쓰고 추론을 아낌',
  '13B로 175B GPT-3를 이김']}},

math:[
 {expr:'RMSNorm(x) = x / sqrt( mean(x²) + ε ) · g',
  tex:'\\text{RMSNorm}(x)=\\frac{x}{\\sqrt{\\text{mean}(x^2)+\\epsilon}}\\cdot g',
  d:'[LayerNorm](#/p/layernorm)에서 평균 빼기와 bias를 없앤 형태. 재중심화(re-centering) 없이 재스케일링만으로도 학습 안정성이 유지된다는 관찰에 기반하며, 연산이 줄어 그만큼 빠르다.'},
 {expr:'FFN_SwiGLU(x) = ( Swish(x W₁) ⊙ x W₃ ) W₂',
  tex:'\\text{FFN}_{\\text{SwiGLU}}(x)=\\left(\\text{Swish}(xW_1)\\odot xW_3\\right)W_2',
  d:'두 개의 선형 투영을 곱하는 게이팅 구조. 행렬이 2개에서 3개로 늘어나므로 hidden 차원을 $\\frac{2}{3}$ 배로 줄여 총 파라미터 수를 맞춘다.'}
],

numbers:[
 {k:'모델 크기', v:'7B / 13B / 33B / 65B', d:'네 크기를 모두 공개(연구 목적 라이선스)'},
 {k:'학습 토큰', v:'1.0T (7B·13B) · 1.4T (33B·65B)', d:'Chinchilla 권장 대비 7B는 약 7배'},
 {k:'문맥 길이', v:'2048', d:'[Llama 2](#/p/llama2)에서 4096으로 확장된다'},
 {k:'MMLU 5-shot · 65B', v:'63.4', d:'같은 표에서 GPT-3 175B는 43.9, Chinchilla-70B 67.5, PaLM-540B 69.3'},
 {k:'학습 처리량', v:'약 380 tokens/sec/GPU', d:'A100 80GB 2048장 · 65B 1.4T 토큰을 21일'},
 {k:'총 학습 비용', v:'1,022,362 GPU-hours', d:'논문 탄소발자국 표 기준 1,015 tCO2eq'}
],

impact:'세 가지가 동시에 열렸다. **(1) 스케일링 해석의 전환** — "compute-optimal"이 곧 "실무 최적"은 아니며, 배포까지 포함하면 작은 모델을 더 오래 학습시키는 쪽이 유리하다는 관점이 표준이 됐다. **(2) 아키텍처 표준화** — RMSNorm + SwiGLU + [RoPE](#/p/rope) 조합이 이후 거의 모든 오픈 모델의 기본형이 되면서, 새 모델을 읽을 때 볼 것은 "이 레시피에서 무엇을 바꿨는가"로 좁혀졌다. **(3) 생태계** — 배포 2주 만에 가중치가 유출되며 llama.cpp·[LoRA](#/p/lora) 파인튜닝·[GPTQ](#/p/gptq) 양자화 같은 도구 계열이 폭발했고, [LLaVA](#/p/llava)처럼 LLaMA를 백본으로 삼은 파생 연구가 대량으로 나왔다.',

legacy:[
 '**라이선스 개방** — 연구용 제약이 [Llama 2](#/p/llama2)에서 상업적 이용 허용으로 풀리며 오픈 웨이트가 산업 기본값이 됨',
 '**7B 체급 경쟁** — [Mistral 7B](#/p/mistral)가 같은 크기에서 sliding window와 [GQA](#/p/gqa)로 앞서면서 "작은 모델 튜닝" 자체가 하나의 연구 분야가 됨',
 '**로컬 실행 인프라** — 4bit 양자화([GPTQ](#/p/gptq), [AWQ](#/p/awq), [QLoRA](#/p/qlora))와 소비자 GPU 파인튜닝 도구 스택 전체가 이 모델 크기를 전제로 만들어짐',
 '**백본으로서의 역할** — [LLaVA](#/p/llava) 등 멀티모달·에이전트 연구가 사설 API 대신 검사 가능한 가중치 위에서 진행되기 시작'
],

pitfalls:[
 '**LLaMA 1은 상업적 이용이 불가능했다.** 비영리 연구 목적의 제한적 라이선스로 배포됐고, 상업적 사용이 열린 것은 [Llama 2](#/p/llama2)부터다. 두 세대를 뭉뚱그려 "오픈소스 라이선스"라 부르는 것은 부정확하다.',
 '**"작을수록 좋다"가 아니다.** 논문의 주장은 *같은 성능을 목표로 할 때* 작은 모델을 오래 학습시키는 쪽이 총비용에서 유리하다는 것이지, 65B가 175B보다 상한 성능이 높다는 뜻이 아니다. 실제로 65B는 여전히 PaLM-540B에 뒤진다.',
 '**베이스 모델은 채팅 모델이 아니다.** LLaMA 1에는 [instruction tuning](#/p/flan)이나 [RLHF](#/p/instructgpt)가 전혀 들어가 있지 않다. 지시를 따르는 것처럼 보이는 응답은 few-shot 프롬프트의 효과이며, Alpaca·Vicuna 같은 파생 모델들이 이 빈칸을 채우려고 나왔다.'
],

figures:[
 {f:'fig1-training-loss.png',
  cap:'x축은 학습에 먹인 토큰 수(billion), y축은 training loss. 4개 모델 크기(7B~65B) 모두 1.4T 토큰까지 loss가 계속 떨어지고 있고 평평해지는 지점이 안 보인다 — Chinchilla가 권장한 토큰 수를 한참 넘긴 지점에서도 더 학습시킬 여지가 있었다는 근거.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'We show that it is possible to train state-of-the-art models using publicly available datasets exclusively, without resorting to proprietary and inaccessible datasets.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2302.13971 — LLaMA: Open and Efficient Foundation Language Models', u:'https://arxiv.org/abs/2302.13971'},
 {t:'Meta AI 발표 블로그', u:'https://ai.meta.com/blog/large-language-model-llama-meta-ai/'},
 {t:'llama.cpp — CPU/로컬 추론 구현', u:'https://github.com/ggml-org/llama.cpp'}
]
});
