WIKI.paper({
slug:'olmo',
venue:'ACL 2024 (arXiv)',
authors:'Dirk Groeneveld et al. (Allen Institute for AI · U. Washington)',
arxiv:'2402.00838',

tldr:'가중치만 공개하는 관행에 맞서 사전학습 데이터([Dolma](#/p/dolma))·학습 코드·학습 로그·수백 개의 중간 체크포인트까지 전부 공개한 1B·7B LLM. "오픈 웨이트"와 "오픈 사이언스"가 다른 것임을 실증한 논문이다.',

context:'2023~2024년의 "공개" LLM들은 공개 정도가 제각각이었다. [Llama](#/p/llama)는 가중치와 상세한 학습 방법을 공개했지만 학습 데이터 자체는 내놓지 않았고, Mixtral은 가중치와 짧은 리포트만, Falcon은 학습 데이터를 부분적으로만 공개했다. 그 결과 "이 데이터로 학습하면 이런 능력이 생긴다"는 인과관계를 독립적으로 검증할 방법이 없었다 — 벤치마크 점수는 재현할 수 있어도 그 점수가 어디서 왔는지는 재현할 수 없었다. Pythia와 BLOOM 정도가 데이터·코드·체크포인트까지 공개한 예외였다. OLMo의 질문은 "동급 성능을 내면서도 학습 전 과정을 검증 가능하게 만들 수 있는가"였다.',

ideas:[
 {h:'"오픈 웨이트"가 아니라 "오픈 사이언스"',
  lead:'가중치·추론 코드뿐 아니라 학습 데이터·학습 코드·학습 로그·중간 체크포인트까지 공개한다.',
  d:'논문은 스스로 "대부분의 선행 사례는 가중치와 추론 코드만 공개했다"고 선을 긋는다. OLMo는 여기에 더해 사전학습 데이터셋([Dolma](#/p/dolma)) 그 자체, 데이터를 만든 코드, 데이터 분석 도구(WIMBD), 학습 코드, 학습 로그, 그리고 학습 도중의 수백 개 체크포인트를 Hugging Face에 리비전으로 공개했다. 가중치만 있으면 "무엇이 이 능력을 만들었는가"를 답할 수 없고, 전 과정이 있어야 데이터-능력 인과관계를 연구할 수 있다는 것이 핵심 주장이다.'},
 {h:'2단계 평가: 온라인(학습 중) vs 오프라인(체크포인트)',
  lead:'학습 중 1000스텝마다 돌리는 온라인 평가로 설계를 결정하고, 오프라인 평가로 최종 검증한다.',
  d:'약 4B 토큰(1,000스텝)마다 8개 핵심 다운스트림 과제로 온라인 평가를 돌려 아키텍처·옵티마이저·데이터 믹스 같은 설계 결정에 즉시 반영한다. 최종 체크포인트는 Catwalk 프레임워크로 다운스트림 8과제, Paloma 벤치마크로 585개 도메인의 펄플렉서티(bits-per-byte)를 별도로 평가한다. 이 이중 구조 덕분에 학습 곡선 자체가 논문의 결과물이 된다.'},
 {h:'표준 검증 데이터로 오염을 걷어낸 펄플렉서티 비교',
  lead:'Paloma 평가 데이터가 사전학습에 섞이지 않도록 명시적으로 제거한 뒤 비교한다.',
  d:'OLMo-7B는 사전학습 문서 중 Paloma 평가 데이터와 겹치는 문단을 가진 것을 걸러낸, "펄플렉서티 평가를 위해 명시적으로 디컨택미네이션한 첫 대형 LM"이라고 밝힌다. 오염된 학습 데이터가 섞이면 모델의 실제 일반화 능력보다 펄플렉서티가 낮게(좋게) 나오는 착시가 생기는데, 이를 원천 차단해 Pythia·RPJ-INCITE 같은 체크포인트 공개 모델과 공정하게 비교했다.'},
 {h:'구조는 새롭지 않다 — 안정성 위주의 보수적 선택',
  lead:'bias 제거·비매개변수 LayerNorm·SwiGLU·RoPE 등 검증된 조합만 골라 학습 발산을 줄인다.',
  d:'[Llama](#/p/llama)·PaLM을 따라 bias 항을 전부 제거하고, 학습가능한 gain/bias가 없는 비매개변수(non-parametric) LayerNorm을 채택했다. 활성화 함수는 SwiGLU, 위치 인코딩은 [RoPE](#/p/rope), 토크나이저는 GPT-NeoX 기반 BPE(어휘 50,280, PII 마스킹 토큰 추가)를 쓴다. 이 논문의 기여는 새 구조가 아니라 "무엇을, 왜 골랐는지"를 전부 기록하고 재현 가능하게 만든 데 있다.'},
 {h:'서로 다른 두 클러스터에서 재현되는 동일한 결과',
  lead:'AMD GPU(LUMI)와 NVIDIA GPU(MosaicML) 클러스터에서 각각 학습해 코드의 하드웨어 독립성을 검증한다.',
  d:'같은 코드베이스를 AMD MI250X 256노드(LUMI)와 NVIDIA A100 27노드(MosaicML)에서 각각 돌렸다. 배치 크기 등 세부 설정은 하드웨어에 맞춰 달랐지만, 2T 토큰 시점에서 두 런은 거의 동일한 평가 성능에 도달했다. 이 자체가 학습 코드가 특정 벤더에 종속되지 않았음을 보여주는 증거로 제시된다.'}
],

diagram:{type:'compare', cap:'가중치만 공개하는 관행과 OLMo가 실제로 공개한 항목의 차이.',
 left:{t:'기존: 오픈 웨이트', items:['모델 가중치','추론 코드','짧은 기술 리포트']},
 right:{t:'OLMo: 오픈 사이언스', items:['가중치 + 학습 코드','사전학습 데이터 Dolma 전체','학습 로그 + 중간 체크포인트 수백 개']}},

math:[
 {expr:'BPB = (평가셋의 cross-entropy loss, nats) / (UTF-8 바이트 수) × log2(e)',
  tex:'\\text{BPB}=\\frac{L_{\\text{nats}}}{N_{\\text{bytes}}}\\log_2 e',
  d:'토크나이저가 다른 모델끼리 펄플렉서티를 직접 비교할 수 없어, 토큰 대신 UTF-8 바이트 단위로 정규화한 bits-per-byte를 공통 지표로 쓴다. Paloma의 585개 도메인 평가가 전부 이 지표로 보고된다.'}
],

numbers:[
 {k:'Dolma 규모', v:'3T 토큰 · 4,367만 문서', d:'Common Crawl·GitHub·Reddit·Semantic Scholar·Gutenberg·Wikipedia 6개 출처'},
 {k:'OLMo-7B 학습량', v:'2.46T 토큰', d:'Dolma의 2T 토큰 샘플로 1 epoch, 이후 재셔플로 추가 학습'},
 {k:'8과제 zero-shot 평균 · OLMo-7B', v:'69.3', d:'Llama 2 7B 70.5 · MPT-7B 69.8과 동급, Pythia 6.9B 63.0보다 우위'},
 {k:'배치 · 학습률', v:'~4M 토큰 배치 · peak LR 3e-4(7B)', d:'5,000스텝(~21B 토큰) 워밍업 후 선형 감쇠'},
 {k:'공개 체크포인트', v:'수백 개 리비전', d:'Hugging Face에 학습 도중 지점을 통째로 공개, Pythia·RPJ-INCITE와 함께 셋뿐인 체크포인트 공개 7B급 모델'},
 {k:'라이선스', v:'Apache 2.0', d:'가중치·코드·데이터 전부 동일 라이선스로 공개'}
],

impact:'OLMo는 "공개"라는 단어를 가중치 유무가 아니라 **재현 가능성**의 정도로 재정의했다. 데이터·코드·로그·체크포인트가 모두 있으면 "이 데이터가 이 능력을 만들었는가" 같은 질문에 답하는 실증 연구가 가능해지고, 실제로 OLMo 체크포인트를 이용한 학습 동역학·데이터 영향 연구가 뒤따랐다. [Dolma](#/p/dolma)는 그 자체로 독립된 후속 연구 자원이 되어 다른 모델의 사전학습 데이터로도 쓰이기 시작했다. 성능 자체는 동급 [Llama](#/p/llama) 1세대와 비슷한 수준에 머물렀지만, 이 논문의 기여는 벤치마크 1등이 아니라 검증 가능한 과학의 기준선을 놓은 데 있다.',

legacy:[
 '**OLMo 2·OLMoE로 이어지는 완전 공개 계보** — 후속 버전이 성능을 끌어올리면서도 데이터·코드 전면 공개 원칙을 유지',
 '**Dolma의 독립 자원화** — [Dolma](#/p/dolma)가 다른 연구팀의 사전학습·데이터 커리큘럼 연구에 재사용되는 표준 공개 코퍼스로 자리잡음',
 '**"오픈" 등급 논쟁의 기준점** — 이후 모델 공개 시 "가중치만 공개"와 "데이터까지 공개"를 구분해 부르는 관행이 이 논문 이후 뚜렷해짐',
 '**중간 체크포인트 기반 연구** — 학습 곡선 자체를 분석 대상으로 삼는 학습 동역학 연구(예: 특정 능력이 학습 중 언제 나타나는가)에 재료를 제공'
],

pitfalls:[
 '**"OLMo가 성능 1위"라는 주장이 아니다.** 8과제 zero-shot 평균(69.3)은 Llama 2 7B(70.5)·MPT-7B(69.8)와 비슷하거나 약간 낮다. 이 논문의 기여는 최고 성능이 아니라 완전한 공개다.',
 '**"오픈 웨이트"와 "오픈 소스/오픈 사이언스"를 같은 말로 쓰면 안 된다.** [Llama](#/p/llama)·Mixtral처럼 가중치만 공개해도 흔히 "오픈"이라 부르지만, 학습 데이터와 코드가 없으면 그 모델이 왜 그렇게 동작하는지 독립적으로 검증할 수 없다 — OLMo는 이 차이를 명시적으로 지적한다.',
 '**Paloma 디컨택미네이션이 모든 오염을 잡지는 못한다.** n-gram 겹침 기반 제거이므로, 어휘를 바꿔 쓴 의미적 오염까지는 걸러내지 못한다는 한계가 있다.'
],

figures:[
 {f:'fig1-training-curves.png',
  cap:'8개 zero-shot 과제 각각에서 학습 토큰 수(가로축, billions)에 따른 정확도 변화. 대부분 우상향이지만 obqa는 1,500B 근처에서 정점을 찍고 내려온다. 맨 오른쪽 급격한 상승은 마지막 1,000스텝에서 학습률을 0으로 선형 감쇠시킨 효과. 이런 그래프 자체가 중간 체크포인트를 전부 공개했기 때문에 그릴 수 있는 것이다.',
  src:'원문 Figure 1, p.7'}
],

quotes:[
 {t:'Unlike most prior efforts that have only released model weights and inference code, we release OLMo alongside open training data and training and evaluation code.',
  src:'Abstract, p.1'},
 {t:'OLMo-7B is the largest LM with explicit decontamination for perplexity evaluation.',
  src:'Section 2.4, p.4'}
],

links:[
 {t:'arXiv 2402.00838 — OLMo: Accelerating the Science of Language Models', u:'https://arxiv.org/abs/2402.00838'},
 {t:'AllenAI OLMo', u:'https://allenai.org/olmo'},
 {t:'OLMo (GitHub)', u:'https://github.com/allenai/OLMo'}
]
});
