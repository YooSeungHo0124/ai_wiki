WIKI.paper({
slug:'fim',
venue:'arXiv preprint (2022) / OpenAI',
authors:'Mohammad Bavarian, Heewoo Jun, Nikolas Tezak et al. (OpenAI)',
arxiv:'2207.14255',

tldr:'문서를 prefix·middle·suffix 세 조각으로 잘라 **prefix-suffix-middle 순서로 재배열**하기만 하면, 어떤 자기회귀 모델에도 공짜로 인필링 능력을 얹을 수 있다는 것을 50M~6.9B 규모로 체계적으로 검증한 논문. 이 "FIM-for-free" 주장은 조건부다 — **사전학습에서는** 좌→우 성능 손실이 없지만, **사후 파인튜닝으로는** 같은 성능에 도달하는 데 막대한 추가 연산이 든다는 것도 같은 논문이 보인다. [StarCoder](#/p/starcoder)·[SantaCoder](#/p/santacoder)·[Code Llama](#/p/codellama)가 전부 이 레시피를 그대로 쓴다.',

context:'[InCoder](#/p/incoder)가 causal masking으로 6.7B 모델 하나에서 인필링과 생성을 통합할 수 있음을 보였지만, 그 논문의 FIM 비율은 낮았고(약 15%) "정말 공짜인가", "얼마나 공격적으로 데이터를 섞어도 되는가" 같은 질문은 체계적으로 답하지 않았다. GPT-3·Codex·PaLM 같은 당대 최고 모델들은 여전히 순수 좌→우로만 학습됐고, 인필링이 필요하면(docstring 생성, import 추가, 함수 중간 완성) 마스크 언어모델이나 인코더-디코더 구조로 갈아타야 한다는 것이 통념이었다. 이 논문은 "데이터만 바꾸면 되는가, 그렇다면 어떤 설정이 최선인가"를 대규모 ablation으로 정면 검증한다.',

ideas:[
 {h:'데이터 변환 한 줄: prefix-suffix-middle 재배열(PSM)',
  lead:'문서를 세 조각으로 잘라 prefix·suffix·middle 순서로 이어 붙이고 그대로 자기회귀 학습한다.',
  d:'문서를 무작위 지점 두 곳에서 잘라 prefix·middle·suffix로 나누고, 각 조각 앞에 `<PRE>`·`<SUF>`·`<MID>` sentinel을 붙여 **prefix, suffix, middle** 순서로 이어 붙인다(PSM). 이 재배열된 시퀀스를 그대로, 세 구간 모두에 loss를 걸어 표준 다음 토큰 예측으로 학습한다. 아키텍처 변경도, 별도 목적함수도 없다 — 데이터 파이프라인 한 단계만 추가된다.'},
 {h:'FIM-for-free: 50% 비율로 섞어도 좌→우 loss 곡선이 그대로',
  lead:'절반을 FIM으로 바꿔 학습해도 원래 언어모델링 test loss의 스케일링 곡선이 변하지 않는다.',
  d:'50M~6.9B까지 여러 크기의 모델을 FIM 비율 0%와 50%로 각각 학습해 언어·코드 두 도메인에서 test loss를 비교했다. 두 곡선이 사실상 겹친다 — 원본 데이터를 절반만 보고도, 그리고 새 능력(인필링)을 동시에 배우면서도 순수 생성 능력의 스케일링에는 비용이 없었다. 저자들은 세 구간 전부에 loss를 거는 것이 이 성질이 성립하는 데 핵심적이었다고 밝힌다.'},
 {h:'SPM: KV 캐시를 살리기 위해 순서를 한 번 더 바꾼다',
  lead:'suffix를 prefix보다 먼저 배치해, prefix가 늘어나도 suffix의 캐시가 무효화되지 않게 한다.',
  d:'PSM 순서에서는 prefix 길이가 바뀌면(사용자가 타이핑을 계속하면) 그 뒤의 suffix·middle 토큰의 key-value 캐시가 전부 무효화된다. SPM(suffix-prefix-middle)은 순서를 `<PRE><SUF>` + suffix + prefix + `<MID>` 로 바꿔, prefix가 늘어나도 이미 계산된 suffix 캐시를 재사용할 수 있게 한다. 실전 추론 효율을 위한 순전히 공학적인 변형이며, 부수적으로 infilling 벤치마크 성능도 PSM보다 약간 더 좋았다.'},
 {h:'FIM 비율은 최대 90%까지 올려도 안전하다',
  lead:'FIM 비율을 90%까지 높여도 좌→우 test loss에 손상이 없고, 인필링 성능은 오히려 계속 좋아진다.',
  d:'FIM 비율(p)을 0, 0.25, 0.5, 0.75, 0.9, 1.0으로 바꿔 가며 대형 모델 6개를 학습했다. 90%까지는 좌→우 test loss와 HumanEval 성능에 유의미한 손상이 없었고, 100%에서만 저하가 나타났다. 반면 인필링 능력 자체는 FIM 비율이 높을수록 꾸준히 좋아져, perplexity 같은 loss 기반 지표만으로는 이 차이가 잘 드러나지 않는다는 점도 함께 지적한다.'},
 {h:'파인튜닝으로는 같은 공짜 효과를 못 얻는다',
  lead:'이미 학습된 좌→우 전용 모델에 나중에 FIM을 가르치려면 상당한 추가 연산이 필요하다.',
  d:'FIM 없이 100B 토큰으로 사전학습된 XL 모델을 가져와, 다양한 학습률·FIM 비율(50%/90%)·토큰 수(25B/50B)로 파인튜닝하는 16가지 조합을 실험했다. 처음부터 FIM 50%로 사전학습한 기준 모델의 성능을 따라잡은 조합은 **가장 공격적인 설정(90% FIM 비율, 최대 학습률, 50B 토큰 추가 학습)** 하나뿐이었다. "공짜"는 사전학습 단계에서 성립하는 조건부 주장이라는 뜻이다.'}
],

diagram:{type:'flow', cap:'문서를 세 조각으로 잘라 순서를 prefix→suffix→middle로 재배열한 뒤, 원래 자기회귀 목적함수 그대로 학습한다. 아키텍처는 손대지 않는다.',
 nodes:[
  {t:'원본 문서', s:'prefix+middle+suffix'},
  {t:'무작위 두 지점 절단', s:'세 조각으로 분할'},
  {t:'PSM 재배열', s:'sentinel로 순서 표시', acc:true, note:'prefix→suffix→middle'},
  {t:'표준 자기회귀 학습', s:'세 구간 전부에 loss'}
 ]},

math:[
 {expr:'PSM = <PRE> Enc(prefix) <SUF> Enc(suffix) <MID> Enc(middle)',
  tex:'\\texttt{PSM}=\\langle PRE\\rangle \\circ \\text{Enc}(\\text{prefix}) \\circ \\langle SUF\\rangle \\circ \\text{Enc}(\\text{suffix}) \\circ \\langle MID\\rangle \\circ \\text{Enc}(\\text{middle})',
  d:'학습 시 이 순서 그대로의 토큰열에 표준 다음 토큰 예측 loss를 건다. 추론 시에는 `middle` 을 뺀 `<PRE>Enc(prefix)<SUF>Enc(suffix)<MID>` 까지만 주고, 모델이 `<EOT>` 를 낼 때까지 이어서 생성시키면 그 사이가 middle이 된다.'}
],

numbers:[
 {k:'모델 규모', v:'50M ~ 6.9B', d:'GPT-3와 유사한 아키텍처로 8개 크기를 처음부터 학습해 스케일링을 확인'},
 {k:'FIM-for-free 학습량', v:'100B 토큰', d:'FIM 0%/50% 모델을 언어·코드 두 도메인에서 비교, test loss 곡선 사실상 동일'},
 {k:'안전한 FIM 비율 상한', v:'~90%', d:'90%까지 좌→우 test loss·HumanEval 손상 없음, 100%에서만 저하'},
 {k:'권장 FIM 비율', v:'50~90%', d:'선행 연구([InCoder](#/p/incoder))가 쓴 15%는 이 논문 기준 준최적'},
 {k:'파인튜닝으로 따라잡는 비용', v:'+50B 토큰(90% FIM, 최대 LR)', d:'100B 토큰 순수 좌→우 사전학습 모델 기준, 그마저 가장 공격적 설정에서만 성공'},
 {k:'컨텍스트 길이', v:'2048', d:'전 실험 공통'}
],

impact:'FIM이 "인코더가 필요한 특수 능력"이 아니라 **데이터 전처리 한 줄로 얻는 부가 기능**임을 보여, 이후 공개 코드 모델들이 기본값으로 채택하는 표준 관행이 됐다. 동시에 "공짜"라는 표현을 무조건적인 주장이 아니라 **사전학습이라는 조건 위에서만 성립**하는 결과로 정교화했다 — 이미 배포된 좌→우 전용 모델에 나중에 FIM을 붙이려는 시도는 이 논문의 결과대로라면 비효율적이다. FIM 비율·PSM/SPM 선택·span 단위(문자/토큰/줄) 같은 세부 하이퍼파라미터에 대한 권장값을 실험으로 못박아, 이후 논문들이 그대로 재사용할 수 있는 레시피를 남겼다.',

legacy:[
 '**[StarCoder](#/p/starcoder)·[SantaCoder](#/p/santacoder)·[Code Llama](#/p/codellama)** 가 전부 이 논문의 FIM 비율·PSM 포맷 권장값을 그대로 사전학습 레시피에 채택',
 '**OpenAI Codex/API의 인필링 엔드포인트**가 이 논문에서 학습한 모델을 그대로 사용',
 '"사전학습 때 넣지 않으면 나중에 싸게 못 넣는다"는 결론이, 이후 다른 부가 능력(도구 사용, 긴 문맥 등)을 파인튜닝으로 붙일 수 있는지 따질 때 자주 인용되는 반례가 됨'
],

pitfalls:[
 '**"공짜"는 사전학습에 한정된 결과다.** 이미 학습이 끝난 모델에 파인튜닝으로 FIM을 붙이는 경우에는 이 논문 스스로 "상당한 추가 연산이 필요하다"고 명시한다 — 아무 모델에나 사후로 붙일 수 있다는 뜻이 아니다.',
 '**FIM 비율이 높아도 perplexity에는 안 잡힐 수 있다.** 90% 근처까지 test loss·HumanEval은 그대로인데 실제 인필링 능력(random span infilling 등 샘플링 기반 지표)은 비율에 따라 계속 달라진다 — loss만 보고 "차이 없다"고 단정하면 안 된다.',
 '**[InCoder](#/p/incoder)와 같은 방법이 아니다.** 이 논문은 InCoder(causal masking, 여러 span을 문서 끝에 모으는 방식)를 이어받아 PSM/SPM이라는 더 단순한 3구간 변환으로 정리하고, InCoder가 쓴 15% FIM 비율이 준최적이라고 실험으로 지적한다.'
],

figures:[
 {f:'fig1-forfree.png',
  cap:'x축이 모델 파라미터 수(로그), y축이 좌→우 test loss. 언어(왼쪽)·코드(오른쪽) 모두에서 FIM 비율 0%(보라)와 50%(노랑) 곡선이 거의 완전히 겹친다 — 절반을 인필링용으로 재배열해 학습해도 원래의 스케일링 추세가 손상되지 않는다는 핵심 증거.',
  src:'원문 Figure 1, p.3'}
],

quotes:[
 {t:'We show that autoregressive language models can learn to infill text after we apply a straightforward transformation to the dataset, which simply moves a span of text from the middle of a document to its end.',
  src:'Abstract, p.1'},
 {t:'Surprisingly, we find that for finetuned models to reach the same level of performance as baseline pretrained models, one needs to expend a large amount of compute relative to the pretraining compute.',
  src:'Section 5, p.13'}
],

links:[
 {t:'arXiv 2207.14255 — Efficient Training of Language Models to Fill in the Middle', u:'https://arxiv.org/abs/2207.14255'},
 {t:'공식 infilling 벤치마크 저장소 (human-eval-infilling)', u:'https://github.com/openai/human-eval-infilling'}
]
});
