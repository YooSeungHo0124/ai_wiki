WIKI.paper({
slug:'gemini',
venue:'기술 보고서 (arXiv-only)',
authors:'Gemini Team, Google',
arxiv:'2312.11805',

tldr:'텍스트·이미지·오디오·비디오를 **처음부터 함께 사전학습**했다고 주장하는 Google의 첫 네이티브 멀티모달 모델. Ultra·Pro·Nano 세 크기로 나오며, MMLU 90.04%로 "사람 전문가 수준을 넘은 첫 모델"을 표방했지만 그 수치는 표준 5-shot이 아닌 32-샘플 신뢰도 기반 CoT라는 점에서 발표 당시 비교 방식 논란이 있었다.',

context:'2023년 초까지 최상위 멀티모달 모델([GPT-4](#/p/gpt4), [Flamingo](#/p/flamingo))은 대체로 텍스트로 사전학습된 언어모델에 비전 인코더를 나중에 붙이는 방식이었다. [PaLM-E](#/p/palm-e) 같은 시도도 있었지만, 이미지·오디오·비디오를 텍스트와 **동등한 1급 모달리티로 두고 처음부터 함께** 사전학습한 대형 모델은 없었다. Gemini는 [PaLM 2](#/p/palm2)의 스케일링·다국어 인프라를 이어받아, 모달리티를 사후에 붙이지 않고 사전학습 단계부터 통합하면 어떤 이점이 있는지를 검증하려는 시도다.',

ideas:[
 {h:'"네이티브 멀티모달": 사후 결합이 아니라 공동 사전학습',
  lead:'텍스트·이미지·오디오·비디오를 사전학습 단계부터 함께 학습시켰다고 주장한다.',
  d:'원문은 "Gemini 모델은 텍스트·이미지·오디오·비디오에 걸쳐 공동으로 학습되므로 네이티브 멀티모달"이라고 명시한다. 웹 문서·책·코드에 이미지·오디오·비디오 데이터를 섞은 사전학습 데이터셋을 썼다고 밝히지만, 정확한 모달리티별 비율이나 총 데이터 규모는 공개하지 않았다. 입출력 모두 텍스트·이미지가 섞인 시퀀스를 다룰 수 있다.'},
 {h:'Ultra·Pro·Nano: 세 크기, 세 용도',
  lead:'최상위 추론용 Ultra, 비용 최적화된 Pro, 온디바이스용 Nano(1.8B/3.25B)로 나눈다.',
  d:'Ultra는 TPUv4 대규모 클러스터로, Pro는 그 일부 자원으로 몇 주 만에, Nano는 Ultra/Pro로부터의 지식 증류로 각각 학습했다. Nano는 1.8B(Nano-1)·3.25B(Nano-2) 두 버전이 있고 배포용으로 4비트 양자화된다. Ultra·Pro의 정확한 파라미터 수는 공개하지 않았다.'},
 {h:'Transformer 디코더 + 멀티쿼리 attention, 32K 컨텍스트',
  lead:'디코더 전용 Transformer에 멀티쿼리 attention을 얹어 TPU 추론에 최적화했다.',
  d:'아키텍처는 [Transformer](#/p/transformer) 디코더를 기반으로 하되, [멀티쿼리 attention](#/p/mqa) 등 효율적 attention을 적용해 TPU에서 안정적으로 서빙되도록 개선했다. 32K 컨텍스트 길이를 지원한다고 밝혔지만, 층수·hidden 차원 등 더 세부적인 아키텍처는 공개하지 않았다.'},
 {h:'MMLU 90.0%: 불확실도 기반 CoT@32라는 조건부 기록',
  lead:'32개 chain-of-thought 샘플의 합의도가 낮으면 그리디 답으로 되돌리는 방식으로 90.0%를 냈다.',
  d:'저자들이 제안한 "불확실도 라우팅 chain-of-thought(uncertainty-routed CoT)"는 k=32개의 CoT 샘플을 뽑아 검증셋 기준 신뢰도 임계값 이상으로 답이 일치하면 다수결을, 그렇지 않으면 그리디(탐욕적) 샘플을 채택한다. Gemini Ultra는 이 방식으로 그리디 단독 84.0% → 90.0%까지 올랐지만, 순수 5-shot 방식으로는 83.7%에 그쳤다 — GPT-4의 널리 인용되는 5-shot 수치 86.4%보다 오히려 낮다.'},
 {h:'크기가 커질수록 여섯 능력 모두에서 이득',
  lead:'Nano→Pro→Ultra로 갈수록 사실성·장문맥·수학/과학·요약·추론·다국어 전 영역이 함께 좋아진다.',
  d:'Pro를 기준(1.0)으로 정규화했을 때 Ultra는 모든 여섯 범주에서 일관되게 Pro를 앞섰고, Nano 1/2는 대체로 Pro의 절반~4분의 3 수준이었다. 특정 능력만 급격히 좋아지는 것이 아니라 크기 증가에 따라 전 영역이 고르게 개선되는 패턴을 보였다.'}
],

diagram:{type:'flow', cap:'네 가지 모달리티가 하나의 시퀀스로 합쳐져 Transformer를 통과하고, 텍스트·이미지 두 디코더로 나뉘어 출력된다.', nodes:[
 {t:'4가지 모달리티', s:'토큰으로 인터리빙'},
 {t:'통합 시퀀스', s:'모달리티 혼합 토큰열'},
 {t:'Transformer', s:'디코더+멀티쿼리 attn', acc:true},
 {t:'텍스트 디코더', s:'자기회귀 생성'},
 {t:'이미지 디코더', s:'이미지 출력'}
]},

numbers:[
 {k:'MMLU', v:'Ultra 90.04%(CoT@32) / 83.7%(5-shot)', d:'GPT-4는 87.29%(CoT@32) / 86.4%(5-shot, 원 보고치)'},
 {k:'GSM8K', v:'Ultra 94.4% (Maj1@32)', d:'GPT-4 92.0%(SFT+5-shot CoT)'},
 {k:'MATH', v:'Ultra 53.2% (4-shot)', d:'GPT-4 API 재측정 52.9%'},
 {k:'HumanEval', v:'Ultra 74.4% (0-shot, 후처리 학습 모델)', d:'GPT-4 67.0%(공개 보고치)'},
 {k:'Nano 크기', v:'Nano-1 1.8B · Nano-2 3.25B', d:'Ultra/Pro로부터 증류, 배포 시 4비트 양자화'},
 {k:'벤치마크 우위', v:'32개 중 30개에서 SOTA', d:'Ultra 기준, 텍스트·이미지·오디오·비디오 포함'}
],

impact:'상용 최상위 모델이 "텍스트 모델에 비전을 붙이는" 접근에서 "모든 모달리티를 대등하게 처음부터 학습하는" 접근으로 옮겨가는 전환점이 됐다. 동시에 MMLU 90%라는 헤드라인 수치가 표준 프롬프팅이 아닌 특수한 디코딩 절차(CoT@32 + 불확실도 라우팅)에서 나온 것이라는 점이 공개 직후 지적되며, 대형 모델의 벤치마크 발표 시 **프롬프팅·샘플링 조건을 명시해야 한다**는 압력을 업계 전반에 남겼다. [GPT-4](#/p/gpt4)에 이어 최상위권 기술 보고서가 파라미터 수·데이터 구성을 비공개로 유지하는 관행을 다시 한번 굳혔다.',

legacy:[
 '**후속 Gemini 세대의 기반** — 이후 Gemini 1.5·2.0 계열이 이 네이티브 멀티모달·긴 컨텍스트 방향을 그대로 확장했다',
 '**벤치마크 보고 관행에 대한 문제제기** — CoT@32 대 5-shot 비교 논란이 이후 모델 발표에서 "어떤 프롬프팅으로 측정했는가"를 명시하도록 요구하는 관행을 강화했다',
 '**온디바이스 소형 모델의 증류 레시피** — Nano 1/2가 보여준 "큰 모델에서 증류한 4비트 양자화 온디바이스 모델"이라는 조합이 이후 소형 모델 출시의 표준 패턴이 됐다',
 '**PaLM 2 계보의 완성** — [PaLM 2](#/p/palm2)의 다국어·스케일링 인프라가 멀티모달로 확장된 사례로, 두 보고서가 사실상 하나의 로드맵을 이룬다'
],

pitfalls:[
 '**MMLU 90.04%를 GPT-4의 표준 5-shot 수치와 직접 비교하면 안 된다.** 90.04%는 k=32 불확실도 라우팅 CoT, GPT-4의 널리 인용되는 86.4%는 5-shot이다. 같은 CoT@32 조건에서는 Gemini Ultra 90.0% vs GPT-4 87.3%로 격차가 줄고, 표준 5-shot 조건만 보면 Gemini Ultra 83.7% vs GPT-4 86.4%로 순위가 뒤집힌다.',
 '**"네이티브 멀티모달"의 구체적 근거(데이터 비율·학습 곡선)는 공개되지 않았다.** 공동 사전학습을 했다는 서술은 있지만, 그로 인한 이득을 사후 결합 방식과 통제 비교한 ablation은 이 보고서에 없다.',
 '**Ultra·Pro의 정확한 파라미터 수, 아키텍처 층수는 이 보고서 어디에도 나오지 않는다.** Nano의 1.8B/3.25B만 공개됐다 — 외부 추정치를 원문 수치처럼 인용하지 않는다.'
],

figures:[
 {f:'fig2-multimodal.png',
  cap:'입력 시퀀스에서 텍스트·오디오·이미지·비디오 토큰(왼쪽 네 아이콘)이 색이 다른 토큰으로 인터리빙되어 하나의 Transformer를 통과하고, 출력 쪽에서 이미지 디코더와 텍스트 디코더로 갈라져 이미지·텍스트가 섞인 응답을 만든다는 것을 보여준다.',
  src:'원문 Figure 2, p.4'},
 {f:'fig3-family-radar.png',
  cap:'Gemini Pro를 1.0 기준선(점선)으로 정규화한 막대그래프. 여섯 범주(사실성·장문맥·수학과학·요약·추론·다국어) 전부에서 Ultra(파랑)가 1.0을 넘고 Nano 1(빨강)·Nano 2(노랑)는 대체로 0.3~0.8 사이 — 크기 증가가 특정 능력만이 아니라 전 영역을 고르게 끌어올린다는 근거로 쓰인다.',
  src:'원문 Figure 3, p.9'}
],

quotes:[
 {t:'Evaluation on a broad range of benchmarks shows that our most-capable Gemini Ultra model advances the state of the art in 30 of 32 of these benchmarks — notably being the first model to achieve human-expert performance on the well-studied exam benchmark MMLU.',
  src:'Abstract, p.1'},
 {t:'The Gemini models are natively multimodal, as they are trained jointly across text, image, audio, and video.',
  src:'Section 5, p.4'}
],

links:[
 {t:'arXiv 2312.11805 — Gemini: A Family of Highly Capable Multimodal Models', u:'https://arxiv.org/abs/2312.11805'}
]
});
