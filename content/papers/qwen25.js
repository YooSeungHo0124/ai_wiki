WIKI.paper({
slug:'qwen25',
venue:'arXiv 2024',
authors:'Qwen Team (Alibaba)',
arxiv:'2412.15115',

tldr:'[Qwen](#/p/qwen) 계열을 사전학습 데이터 18T 토큰까지 늘리고 SFT+DPO+GRPO의 다단계 후처리를 정식화한 오픈 가중치 시리즈. 72B 모델이 자기보다 5배 큰 [Llama 3](#/p/llama3) 405B와 경쟁한다고 주장한다.',

context:'[Qwen](#/p/qwen)과 후속 Qwen2는 오픈 모델 진영에서 빠르게 규모를 키워왔지만, 사전학습 데이터는 여전히 7T 토큰 수준이었다. 같은 시기 [Llama 3](#/p/llama3)가 15.6T 토큰·405B 파라미터로 오픈 가중치의 상한을 끌어올리면서, 파라미터를 무한정 키우지 않고도 경쟁력을 유지하려면 데이터 품질과 후처리 단계에서 격차를 메워야 한다는 압박이 커졌다. Qwen2.5는 "얼마나 크게 만들 것인가"보다 "같은 크기에서 얼마나 잘 우려낼 것인가"에 무게를 둔 보고서다.',

ideas:[
 {h:'사전학습 데이터를 7T에서 18T 토큰으로',
  lead:'Qwen2 대비 데이터량을 약 2.6배 늘리고 지식·코드·수학 비중을 높였다.',
  d:'Qwen1.5(3T) → Qwen2(7T) → Qwen2.5(18T)로 이어지는 데이터 스케일링을 Figure 1에서 직접 강조한다. 단순 증량이 아니라 Qwen2-Instruct 모델을 활용해 데이터 필터링·합성 데이터 생성까지 파이프라인에 넣었다고 밝히지만, **정확한 소스별 비율이나 필터링 임계값은 공개하지 않는다.**'},
 {h:'하이퍼파라미터도 스케일링 법칙으로 정한다',
  lead:'44M~14B 규모의 실험으로 학습률·배치 크기를 모델 크기별로 미리 역산한다.',
  d:'dense 44M~14B, MoE 44M~1B(활성 파라미터) 범위에서 0.8B~600B 토큰까지 스윕한 실험으로 최적 학습률 $\\mu_{opt}$ 와 배치 크기 $B$ 를 모델·데이터 크기의 함수로 근사했다. [친칠라](#/p/chinchilla)식 손실 스케일링과 달리 하이퍼파라미터 자체를 스케일링 법칙의 대상으로 삼은 점이 특징이지만, 정작 공개 모델(0.5B~72B)의 최종 학습률 표는 논문에 없다.'},
 {h:'긴 문맥은 API 전용 모델에만 단계적으로',
  lead:'공개 dense 모델은 32K, API 전용 Qwen2.5-Turbo만 32K→1M까지 4단계로 확장한다.',
  d:'공개되는 dense 모델들은 4,096 → 32,768 토큰으로 context를 늘리는 데 그치지만, API로만 제공되는 MoE 모델 Qwen2.5-Turbo는 32K·64K·128K·262K 4단계 continued pre-training으로 최종 1M 토큰까지 확장한다. **1M 토큰급 긴 문맥은 오픈 가중치로 공개되지 않는다** — 이 보고서가 공개 모델과 API 전용 모델의 능력을 명확히 구분해서 읽어야 하는 지점이다.'},
 {h:'후처리: SFT → DPO(오프라인) → GRPO(온라인)',
  lead:'100만 개 이상 SFT 샘플 뒤 [DPO](#/p/dpo)와 온라인 GRPO를 순차로 적용한다.',
  d:'지도 미세조정에 100만 개 이상의 샘플을 쓴 뒤, 오프라인 선호 최적화로 [DPO](#/p/dpo)를, 온라인 강화학습으로 GRPO(DeepSeekMath에서 제안된 방법)를 적용하는 2단계 선호 정렬을 쓴다. 이 조합으로 긴 텍스트 생성·구조화 데이터(표·JSON) 처리·지시 따르기가 특히 개선됐다고 밝힌다.'},
 {h:'MoE는 API 전용, 공개 가중치는 전부 dense',
  lead:'Qwen2.5-Turbo/Plus만 MoE이고, 0.5B~72B 공개 모델은 전부 dense 구조다.',
  d:'MoE 아키텍처(fine-grained expert, top-K 라우팅)를 Qwen1.5-MoE 방식을 이어 적용하지만, 이 MoE 모델들(Turbo/Plus)은 가중치가 공개되지 않고 Alibaba Cloud API로만 제공된다. 즉 "Qwen2.5는 MoE를 도입했다"는 서술은 **API 한정**이며, 오픈 가중치로 받을 수 있는 것은 여전히 dense 모델뿐이다.'}
],

diagram:{type:'flow', cap:'후처리 파이프라인. SFT 이후 오프라인·온라인 선호 최적화를 순차로 적용한다.',
 nodes:[
  {t:'사전학습 모델', s:'18T 토큰'},
  {t:'SFT', s:'100만+ 샘플', a:'지시 따르기'},
  {t:'DPO', s:'오프라인 선호', acc:true},
  {t:'GRPO', s:'온라인 RL', a:'DeepSeekMath式'}
 ]},

math:[
 {expr:'μ_opt(N, D), B_opt(N, D) — 모델·데이터 크기의 함수로 학습률·배치 추정',
  tex:'\\mu_{opt}(N,D),\\ B_{opt}(N,D)',
  d:'전통적 스케일링 법칙이 손실을 예측하는 것과 달리, 여기서는 최적 학습률과 배치 크기 자체를 모델 크기 $N$·데이터 크기 $D$ 의 함수로 회귀해, 신규 크기의 모델을 학습할 때마다 별도 탐색 없이 값을 대입한다.'}
],

numbers:[
 {k:'공개 모델', v:'0.5B/1.5B/3B/7B/14B/32B/72B', d:'전부 dense, 양자화 버전도 제공'},
 {k:'사전학습 토큰', v:'18T', d:'Qwen2의 7T 대비 약 2.6배'},
 {k:'공개 모델 컨텍스트', v:'32,768', d:'API 전용 Turbo만 최대 1M까지 확장'},
 {k:'SFT 샘플', v:'100만+', d:'다단계 RL(DPO+GRPO) 전 단계'},
 {k:'MMLU', v:'86.1', d:'Qwen2.5-72B, [Llama 3](#/p/llama3) 405B의 87.3보다 근소하게 낮음'},
 {k:'GSM8K', v:'91.5', d:'Qwen2.5-72B (8-shot 등 세부 조건은 원문 Table 2 기준)'}
],

impact:'"큰 모델을 더 키운다" 대신 "같은 크기에서 데이터·후처리로 짜낸다"는 노선을 오픈 모델 진영에 확산시켰다. 72B 모델이 5배 큰 [Llama 3](#/p/llama3) 405B와 경쟁한다는 주장은, 이후 모델 보고서들이 파라미터 대비 성능(토큰당 효율)을 전면에 내세우는 관행을 강화했다. 또한 Qwen2.5-Math·Qwen2.5-Coder 같은 특화 모델의 공통 기반이 되어, 하나의 사전학습 모델을 여러 특화 모델의 출발점으로 쓰는 생태계를 만들었다.',

legacy:[
 '**[Qwen3](#/p/qwen3)로 이어짐** — 하이브리드 추론 모드와 MoE를 공개 가중치에도 도입하며 이 보고서가 API 전용으로 남겨둔 것들을 다음 세대에서 열어줌',
 '**특화 모델 생태계** — Qwen2.5-Math, Qwen2.5-Coder, QwQ 등이 이 사전학습 체크포인트를 공통 기반으로 파생',
 '**하이퍼파라미터 스케일링 법칙의 실무적 채택** — 매 모델 크기마다 학습률을 재탐색하지 않고 회귀식으로 대입하는 방식이 이후 보고서에서도 언급',
 '**"작은 모델도 충분하다" 서사 강화** — 72B가 405B와 경쟁한다는 비교가 이후 효율 중심 모델 보고서의 비교 관행에 영향'
],

pitfalls:[
 '**MoE 도입은 API 전용 모델(Turbo/Plus)에 한정된다.** 공개 가중치로 받는 0.5B~72B는 전부 dense이므로 "Qwen2.5는 MoE"라고 일반화하면 틀린다.',
 '**1M 토큰 긴 문맥도 API 전용이다.** 오픈 가중치 모델의 실제 지원 컨텍스트는 32K이고, 이후 YaRN 등으로 확장해 쓰는 것은 커뮤니티의 별도 작업이다.',
 '**데이터 구성 비율·필터링 기준·정확한 하이퍼파라미터 표는 공개되지 않았다.** "18T 토큰"이라는 총량 숫자 외에 재현에 필요한 세부는 이 보고서만으로 알 수 없다.'
],

figures:[
 {f:'fig1-data-scaling.png',
  cap:'Qwen 시리즈의 사전학습 토큰 수(3T→7T→18T)가 늘 때마다 Math·MBPP·BBH·MMLU 네 벤치마크가 함께 오르는 것을 보여준다. 이 논문이 스스로 강조하는 근거 그래프.',
  src:'원문 Figure 1, p.1'}
],

quotes:[
 {t:'the open-weight flagship Qwen2.5-72B-Instruct outperforms a number of open and proprietary models and demonstrates competitive performance to the state-of-the-art open-weight model, Llama-3-405B-Instruct, which is around 5 times larger.',
  src:'Abstract, p.1'}
],

links:[
 {t:'arXiv 2412.15115 — Qwen2.5 Technical Report', u:'https://arxiv.org/abs/2412.15115'},
 {t:'Qwen2.5 (GitHub)', u:'https://github.com/QwenLM/Qwen2.5'}
]
});
